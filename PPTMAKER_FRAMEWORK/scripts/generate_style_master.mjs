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
  resolveBaseUrls,
  bridgeCredentials,
  DEFAULT_MODEL,
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
  const resolvedRunDir = resolve(runDir);

  const violations = checkBundle(resolvedRunDir, false);
  if (violations.length > 0) {
    console.error("✗ Bundle structure is not valid:");
    for (const v of violations) console.error(`  - ${v}`);
    return 1;
  }

  const promptPath = styleAsset(resolvedRunDir, STYLE_MASTER_PROMPT);
  if (!existsSync(promptPath)) {
    console.error(`✗ Missing style master prompt: ${promptPath}`);
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
  bridgeCredentials();

  let resolvedBaseUrls = Array.isArray(baseUrl) ? baseUrl.slice() : [];
  if (resolvedBaseUrls.length === 0) {
    try {
      resolvedBaseUrls = resolveBaseUrls();
    } catch (err) {
      if (!dryRun) {
        console.error(`✗ ${err.message}`);
        return 1;
      }
    }
  }

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
      baseUrls: resolvedBaseUrls,
      tracePath,
    });
    return 0;
  } catch (err) {
    console.error(`✗ ${err.message}`);
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
      process.exit(exitCode);
    });

  await program.parseAsync(argv);
}

if (process.argv[1] === __filename || process.argv[1]?.endsWith("/generate_style_master.mjs")) {
  main();
}
