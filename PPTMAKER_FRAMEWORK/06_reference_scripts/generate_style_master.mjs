#!/usr/bin/env node
/**
 * Generate the canonical style_master.jpg from its source prompt.
 *
 * This wrapper is the official Phase-2 entry point. It resolves per-version
 * overrides file-by-file, loads the deck .env, bridges OPENAI_* credentials to
 * the image skill's native APIMART_* names, and calls image2-imagegen with
 * supported arguments. The prompt remains a source file; no shell substitution
 * is required.
 *
 * Usage:
 *   node generate_style_master.mjs --run-dir deck_x/3_versions/v1
 *   node generate_style_master.mjs --run-dir deck_x/3_versions/v1 --base-url https://api.example.com/v1
 *   node generate_style_master.mjs --run-dir deck_x/3_versions/v1 --resolution 4k --force
 *   node generate_style_master.mjs --run-dir deck_x/3_versions/v1 --dry-run
 *
 * Port of generate_style_master.py. Imports path constants from ./bundle_layout.mjs.
 */

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";

// --- Import from bundle_layout.mjs — the single source of truth ---------------
import {
  checkBundle,
  styleAsset,
  deckRoot,
  loadDotenv,
  STYLE_MASTER_PROMPT,
  STYLE_MASTER_IMAGE,
  IMAGE_TRACE_SUFFIX,
} from "./bundle_layout.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FRAMEWORK_DIR = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Python discovery
// ---------------------------------------------------------------------------

/**
 * Find a usable Python executable.
 * @returns {string}
 */
function findPython() {
  return "python3";
}

// ---------------------------------------------------------------------------
// Skill script discovery
// ---------------------------------------------------------------------------

/**
 * Find a skill script by searching common skill directory locations.
 *
 * Searches:
 *   1. Project-level: <FRAMEWORK_DIR>/../.claude/skills, .agents/skills
 *   2. CWD and parents: .claude/skills, .agents/skills
 *   3. Global: ~/.claude/skills, ~/.agents/skills
 *
 * @param {string[]} relativePaths - Candidate paths relative to a skills root.
 * @returns {string | null}
 */
export function findSkillScript(relativePaths) {
  const searchRoots = [];

  // Project-level skills
  const projectBases = [resolve(FRAMEWORK_DIR, ".."), process.cwd()];
  // Walk up CWD parents
  let p = process.cwd();
  while (p) {
    if (!projectBases.includes(p)) projectBases.push(p);
    const parent = dirname(p);
    if (parent === p) break;
    p = parent;
  }

  for (const base of projectBases) {
    for (const skillsDir of [".claude/skills", ".agents/skills"]) {
      const candidate = join(base, skillsDir);
      if (existsSync(candidate) && !searchRoots.includes(candidate)) {
        searchRoots.push(candidate);
      }
    }
  }

  // Global skills
  const home = homedir();
  for (const skillsDir of [".claude/skills", ".agents/skills"]) {
    const candidate = join(home, skillsDir);
    if (existsSync(candidate)) {
      searchRoots.push(candidate);
    }
  }

  for (const root of searchRoots) {
    for (const rel of relativePaths) {
      const candidate = join(root, rel);
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Subprocess runner
// ---------------------------------------------------------------------------

/**
 * Run a command as a subprocess. Returns a promise that resolves
 * with the exit code.
 *
 * @param {string} executable - Command to run.
 * @param {string[]} args - CLI arguments.
 * @returns {Promise<number>} Exit code (0 = success).
 */
function runSubprocess(executable, args) {
  const cmdStr = [executable, ...args]
    .map((c) => (c.includes(" ") ? `"${c}"` : c))
    .join(" ");

  return new Promise((resolve) => {
    const child = spawn(executable, args, {
      stdio: "inherit",
      env: process.env,
    });

    child.on("close", (code) => {
      resolve(code !== null ? code : 1);
    });

    child.on("error", (err) => {
      console.error(`Failed to spawn ${executable}: ${err.message}`);
      resolve(1);
    });
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Generate the style_master.jpg image.
 *
 * @param {object} opts
 * @param {string} opts.runDir - Version dir path.
 * @param {string[]} [opts.baseUrl] - Optional API base URLs (may be repeated).
 * @param {string} [opts.resolution] - "1k", "2k", or "4k".
 * @param {string} [opts.model] - Model name.
 * @param {boolean} [opts.force] - Force regeneration.
 * @param {boolean} [opts.dryRun] - Dry run mode.
 * @returns {Promise<number>} Exit code (0 = success, non-zero = failure).
 */
export async function generateStyleMaster({
  runDir,
  baseUrl = [],
  resolution = "2k",
  model = "gpt-image-2",
  force = false,
  dryRun = false,
}) {
  const resolvedRunDir = resolve(runDir);

  // 1. Validate bundle structure (no pipeline readiness required — this can run early).
  const violations = checkBundle(resolvedRunDir, false);
  if (violations.length > 0) {
    console.error("✗ Bundle structure is not valid:");
    for (const v of violations) {
      console.error(`  - ${v}`);
    }
    return 1;
  }

  // 2. Locate the style-master prompt file.
  const promptPath = styleAsset(resolvedRunDir, STYLE_MASTER_PROMPT);
  if (!existsSync(promptPath)) {
    console.error(`✗ Missing style master prompt: ${promptPath}`);
    return 1;
  }

  // 3. Find the image2-imagegen skill script (Python).
  const generator = findSkillScript([
    "image2-imagegen/scripts/generate_image.py",
    "image2-imagegen/scripts/generate_image_apimart.py",
  ]);
  if (!generator) {
    console.error("✗ image2-imagegen skill not found in .claude/skills or .agents/skills");
    return 1;
  }

  // 4. Load .env credentials — search deck root, cwd, and cwd parents.
  //    Explicit env vars win (loadDotenv does not override already-set vars).
  const dkRoot = deckRoot(resolvedRunDir);
  const cwd = process.cwd();
  const searchDirs = [dkRoot, cwd];
  // Walk up CWD parents
  let p = cwd;
  while (p) {
    const parent = dirname(p);
    if (parent === p) break;
    if (!searchDirs.includes(parent)) searchDirs.push(parent);
    p = parent;
  }
  loadDotenv(...searchDirs);

  // 5. Bridge credentials: if OPENAI_API_KEY is set but APIMART_API_KEY is not,
  //    alias it so the image skill can find it.
  if (!process.env.APIMART_API_KEY && process.env.OPENAI_API_KEY) {
    process.env.APIMART_API_KEY = process.env.OPENAI_API_KEY;
  }

  // 6. Resolve base URL(s).
  let resolvedBaseUrls = Array.isArray(baseUrl) ? baseUrl.slice() : [];
  if (resolvedBaseUrls.length === 0) {
    const configured = process.env.OPENAI_BASE_URL || process.env.APIMART_BASE_URL;
    if (configured) {
      resolvedBaseUrls = [configured];
    }
  }

  // 7. Read the prompt from the source file.
  const promptText = readFileSync(promptPath, "utf-8");

  // 8. Determine output paths.
  const promptDir = dirname(promptPath);
  const outPath = join(promptDir, STYLE_MASTER_IMAGE);
  const tracePath = join(promptDir, `style_master${IMAGE_TRACE_SUFFIX}`);

  // 9. Build the command for the Python image generator.
  const pyArgs = [
    "--prompt", promptText,
    "--out", outPath,
    "--meta-out", tracePath,
    "--size", "16:9",
    "--resolution", resolution,
    "--model", model,
  ];
  for (const url of resolvedBaseUrls) {
    pyArgs.push("--base-url", url);
  }
  if (force) {
    pyArgs.push("--force");
  }
  if (dryRun) {
    pyArgs.push("--dry-run");
  }

  console.log(`Prompt: ${promptPath}`);
  console.log(`Output: ${outPath}`);
  console.log(`Generator: ${generator}`);

  if (dryRun) {
    const cmdStr = ["python3", generator, ...pyArgs]
      .map((c) => (c.includes(" ") ? `"${c}"` : c))
      .join(" ");
    console.log(`[DRY RUN] Would execute: ${cmdStr}`);
    return 0;
  }

  // 10. Execute subprocess.
  return runSubprocess(findPython(), [generator, ...pyArgs]);
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

/**
 * Run the CLI from command line arguments.
 * @param {string[]} [argv] - process.argv (or test args).
 * @returns {Promise<void>}
 */
export async function main(argv = process.argv) {
  const program = new Command();

  program
    .name("generate_style_master.mjs")
    .description("Generate the canonical style_master.jpg from its source prompt")
    .addHelpText("after", `
Examples:
  generate_style_master.mjs --run-dir deck_x/3_versions/v1
  generate_style_master.mjs --run-dir deck_x/3_versions/v1 --base-url https://api.example.com/v1
  generate_style_master.mjs --run-dir deck_x/3_versions/v1 --resolution 4k --force
    `)
    .requiredOption("--run-dir <path>", "Version dir, e.g. deck_x/3_versions/v1")
    .option("--base-url <url>", "Optional image API base URL; may be repeated",
      (val, prev) => [...(prev || []), val], [])
    .option("--resolution <res>", "Output resolution: 1k, 2k, or 4k", "2k")
    .option("--model <name>", "Image model name", "gpt-image-2")
    .option("--force", "Force regeneration even if output exists")
    .option("--dry-run", "Print what would be executed without running")
    .action(async (opts) => {
      const exitCode = await generateStyleMaster({
        runDir: opts.runDir,
        baseUrl: opts.baseUrl || [],
        resolution: opts.resolution,
        model: opts.model,
        force: opts.force || false,
        dryRun: opts.dryRun || false,
      });
      process.exit(exitCode);
    });

  await program.parseAsync(argv);
}

// Run when executed directly (not imported)
if (process.argv[1] === __filename || process.argv[1]?.endsWith("/generate_style_master.mjs")) {
  main();
}
