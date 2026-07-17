#!/usr/bin/env node
/**
 * Generate the canonical style_master.jpg from its source prompt.
 *
 * In-framework Node — uses image_api_client.mjs. No external skills.
 *
 * Usage:
 *   node generate_style_master.mjs --run-dir deck_x/3_versions/v1
 *   node generate_style_master.mjs --run-dir deck_x/3_versions/v1 --base-url https://api.example.com/v1
 *   node generate_style_master.mjs --run-dir deck_x/3_versions/v1 --resolution 4k --force
 *   node generate_style_master.mjs --run-dir deck_x/3_versions/v1 --dry-run
 */

import "./lib/cli_bootstrap.mjs?entry=generate_style_master.mjs";
import { CLI_ERROR_CODES, createCliNext, emitCliError } from "./lib/cli_error.mjs";

import { existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";

import {
  checkBundle,
  styleAsset,
  deckRoot,
  loadDotenv,
  STYLE_MASTER_PROMPT,
  STYLE_MASTER_IMAGE,
  DECK_SYSTEM_FILE,
  IMAGE_TRACE_SUFFIX,
} from "./bundle_layout.mjs";

import {
  generateOneImage,
  DEFAULT_MODEL,
  ImageProviderError,
  ImageSubmitPrerequisiteError,
} from "./image_api_client.mjs";
import { loadDeckSystem } from "./lib/deck_system.mjs";

const __filename = fileURLToPath(import.meta.url);

/**
 * @param {object} opts
 * @param {string} opts.runDir
 * @param {string[]} [opts.baseUrl]
 * @param {string} [opts.resolution]
 * @param {string} [opts.model]
 * @param {boolean} [opts.force]
 * @param {boolean} [opts.dryRun]
 * @param {boolean} [opts.noDeckSystem]
 * @returns {Promise<number>} Exit code
 */
export async function generateStyleMaster({
  runDir,
  baseUrl = [],
  resolution = "2k",
  model = DEFAULT_MODEL,
  force = false,
  dryRun = false,
  noDeckSystem = false,
}) {
  generateStyleMaster.lastFailure = null;
  const resolvedRunDir = resolve(runDir);

  const violations = checkBundle(resolvedRunDir, false);
  if (violations.length > 0) {
    console.error("✗ Bundle structure is not valid:");
    for (const v of violations) console.error(`  - ${v}`);
    generateStyleMaster.lastFailure = { category: "structure", issues: violations.map((message) => ({ message, source: { path: resolvedRunDir } })), source: { path: resolvedRunDir } };
    return 1;
  }

  const promptPath = styleAsset(resolvedRunDir, STYLE_MASTER_PROMPT);
  if (!existsSync(promptPath)) {
    console.error(`✗ Missing style master prompt: ${promptPath}`);
    generateStyleMaster.lastFailure = { category: "artifact", source: { path: promptPath }, reason: { kind: "missing_source_prompt" } };
    return 1;
  }

  const dkRoot = deckRoot(resolvedRunDir);
  const cwd = process.cwd();
  const searchDirs = [dkRoot, cwd];
  let p = cwd;
  while (p) {
    const parent = dirname(p);
    if (parent === p) break;
    if (!searchDirs.includes(parent)) searchDirs.push(parent);
    p = parent;
  }
  loadDotenv(...searchDirs);

  // Keep the CLI override unresolved. The shared submit guard resolves
  // transport only when the existing style master cannot be reused.
  const cliBaseUrls = Array.isArray(baseUrl) ? baseUrl.filter(Boolean) : [];

  let promptText = readFileSync(promptPath, "utf-8");
  const deckSystemPath = styleAsset(resolvedRunDir, DECK_SYSTEM_FILE);
  if (!noDeckSystem) {
    const deckSystem = loadDeckSystem(deckSystemPath);
    if (deckSystem) {
      promptText =
        `${promptText.trim()}\n\n` +
        `---\nDECK SYSTEM CONSTRAINTS (from ${DECK_SYSTEM_FILE}; shared with Stage 1):\n` +
        `${deckSystem}`;
      console.log(`Injected constraints from ${deckSystemPath}`);
    }
  } else {
    console.log(`Skipping ${DECK_SYSTEM_FILE} (--no-deck-system)`);
  }

  const promptDir = dirname(promptPath);
  const outPath = join(promptDir, STYLE_MASTER_IMAGE);
  const tracePath = join(promptDir, `style_master${IMAGE_TRACE_SUFFIX}`);

  console.log(`Prompt: ${promptPath}`);
  console.log(`Output: ${outPath}`);
  console.log(`Generator: scripts/image_api_client.mjs (in-framework)`);

  if (dryRun) {
    console.log(`[DRY RUN] Would generate style master → ${outPath}`);
    return 0;
  }

  try {
    await generateOneImage({
      prompt: promptText,
      outPath,
      styleReferencePath: null,
      resolution,
      model,
      force,
      baseUrls: cliBaseUrls,
      tracePath,
      requireStyleReference: false,
    });
    return 0;
  } catch (err) {
    console.error(`✗ ${err.message}`);
    generateStyleMaster.lastFailure = err instanceof ImageSubmitPrerequisiteError
      ? { category: "environment", source: { path: dkRoot }, reason: { kind: err.reason } }
      : err instanceof ImageProviderError
      ? { category: "provider", source: { path: promptPath }, reason: { kind: err.reason, ...(err.status ? { actual: err.status } : {}) } }
      : { category: "artifact", source: { path: promptPath }, reason: { kind: "style_master_generation_failed" } };
    return 1;
  }
}

/**
 * @param {string[]} [argv]
 */
export async function main(argv = process.argv) {
  const program = new Command();
  program
    .name("generate_style_master.mjs")
    .description("Generate style_master.jpg (in-framework Node, no skills)")
    .requiredOption("--run-dir <path>", "Version dir, e.g. deck_x/3_versions/v1")
    .option("--base-url <url>", "Optional image API base URL; may be repeated",
      (val, prev) => [...(prev || []), val], [])
    .option("--resolution <res>", "Output resolution: 1k, 2k, or 4k", "2k")
    .option("--model <name>", "Image model name", DEFAULT_MODEL)
    .option("--force", "Force regeneration even if output exists")
    .option("--no-deck-system", "Do not append deck_system.txt constraints")
    .option("--dry-run", "Print what would be executed without running")
    .action(async (opts) => {
      const exitCode = await generateStyleMaster({
        runDir: opts.runDir,
        baseUrl: opts.baseUrl || [],
        resolution: opts.resolution,
        model: opts.model,
        force: opts.force || false,
        dryRun: opts.dryRun || false,
        noDeckSystem: opts.noDeckSystem || false,
      });
      if (exitCode !== 0) {
        const failure = generateStyleMaster.lastFailure || { category: "internal" };
        const promptPath = opts.runDir ? styleAsset(resolve(opts.runDir), STYLE_MASTER_PROMPT) : null;
        emitCliError({
          code: CLI_ERROR_CODES.FAILED,
          message: "Style master generation could not complete.",
          hint: "Inspect the retained source/provider evidence, repair it, then rerun.",
          where: "generate_style_master.main",
          diagnostic: {
            version: 1,
            category: failure.category,
            stage: "style-master",
            operation: "generate",
            ...(failure.source ? { source: failure.source } : {}),
            ...(failure.reason ? { reason: failure.reason } : {}),
            ...(failure.issues ? { issues: failure.issues } : {}),
            ...(promptPath ? { lineage: [{ kind: "source", path: promptPath, stage: "input" }, { kind: "derived", path: styleAsset(resolve(opts.runDir), STYLE_MASTER_IMAGE), stage: "style-master" }] } : {}),
            next: createCliNext(failure.category === "environment" ? "repair_environment" : failure.category === "structure" ? "edit_source" : "repair_prerequisite", {
              inspect: failure.source ? [failure.source] : [],
              invocation: { program: "node", args: [__filename, "--run-dir", opts.runDir, "--resolution", opts.resolution] },
              default: failure.category === "environment" ? "Repair provider configuration without exposing credentials, then rerun." : "Repair the named source or prerequisite; do not edit generated style artifacts directly.",
            }),
          },
        });
      }
      process.exit(exitCode);
    });

  await program.parseAsync(argv);
}
generateStyleMaster.lastFailure = null;

if (process.argv[1] === __filename || process.argv[1]?.endsWith("/generate_style_master.mjs")) {
  const { installStandaloneFailureEnvelope } = await import("./lib/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "generate_style_master" });
  main();
}
