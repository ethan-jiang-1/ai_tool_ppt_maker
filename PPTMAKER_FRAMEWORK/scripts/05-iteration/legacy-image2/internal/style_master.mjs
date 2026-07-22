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

import { CLI_ERROR_CODES, createCliNext, emitCliError } from "../../../shared/cli/cli_error.mjs";

import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve, dirname } from "node:path";
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
  SLIDE_SPECS_NAME,
  findSlideSpecs,
} from "../../../shared/run-bundle/bundle_layout.mjs";

import {
  generateOneImage,
  DEFAULT_MODEL,
  ImageProviderError,
  ImageSubmitPrerequisiteError,
} from "./image_api_client.mjs";
import { loadDeckSystem } from "../../../02-visual-system/index.mjs";
import { sha256File } from "../../../shared/identity/byte_hash.mjs";

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

  // Source identity is the earliest useful diagnostic: a malformed marker or
  // an HTML backup cannot be reclassified through structure/mode routing.
  const canonicalSource = join(resolvedRunDir, SLIDE_SPECS_NAME);
  const sourceCandidate = existsSync(canonicalSource) ? canonicalSource : findSlideSpecs(resolvedRunDir);
  if (sourceCandidate) {
    const { HTML_FIRST_PIPELINE, probeProductionMarker } = await import("../../../shared/run-bundle/production_marker.mjs");
    const marker = probeProductionMarker(readFileSync(sourceCandidate), { source: basename(sourceCandidate) });
    if (marker.branch === "invalid") {
      generateStyleMaster.lastFailure = { category: "source_validation", source: marker.issues[0]?.source || { path: SLIDE_SPECS_NAME }, issues: marker.issues.map((entry) => ({ message: entry.message, source: entry.source, reason: { kind: entry.code || "invalid_pipeline_marker" } })) };
      return 1;
    }
    if (marker.branch === HTML_FIRST_PIPELINE && sourceCandidate !== canonicalSource) {
      generateStyleMaster.lastFailure = { category: "source_validation", source: { path: basename(sourceCandidate) }, reason: { kind: "canonical_source_missing", actual: basename(sourceCandidate), expected: SLIDE_SPECS_NAME } };
      return 1;
    }
  }

  // Structure remains the first generic local prerequisite after source
  // identity is established. A missing/corrupt run has no mode to route yet.
  const violations = checkBundle(resolvedRunDir, false);
  if (violations.length > 0) {
    console.error("✗ Bundle structure is not valid:");
    for (const v of violations) console.error(`  - ${v}`);
    generateStyleMaster.lastFailure = { category: "structure", issues: violations.map((message) => ({ message, source: { path: resolvedRunDir } })), source: { path: resolvedRunDir } };
    return 1;
  }

  // This executable is a whole-page Image2 adapter. Resolve the exact
  // state-owned mode before inspecting source/provider inputs so direct entry
  // cannot silently select itself for an HTML or drifted run.
  const { resolveRunProductionAdapter } = await import("../../../shared/state/state.mjs");
  const route = resolveRunProductionAdapter(deckRoot(resolvedRunDir), {
    runDir: resolvedRunDir,
    purpose: "observe",
  });
  if (!route.ok) {
    generateStyleMaster.lastFailure = {
      category: "gate",
      source: { path: resolvedRunDir },
      reason: { kind: route.code === "transition_required" ? "mode_source_mismatch" : "production_mode_unavailable" },
    };
    return 1;
  }
  if (route.adapter !== "whole-page-image2") {
    generateStyleMaster.lastFailure = {
      category: "gate",
      source: { path: resolvedRunDir },
      reason: { kind: "html_style_master_adapter_reserved" },
    };
    return 1;
  }

  const promptPath = styleAsset(resolvedRunDir, STYLE_MASTER_PROMPT);
  if (!existsSync(promptPath)) {
    console.error(`✗ Missing style master prompt: ${promptPath}`);
    generateStyleMaster.lastFailure = { category: "artifact", source: { path: promptPath }, reason: { kind: "missing_source_prompt" } };
    return 1;
  }

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
  console.log(`Generator: scripts/05-iteration/legacy-image2/internal/image_api_client.mjs (in-framework)`);

  if (dryRun) {
    console.log(`[DRY RUN] Would generate style master → ${outPath}`);
    return 0;
  }

  const needsProviderSubmit = force || !existsSync(outPath);
  if (needsProviderSubmit && route.mode === "image2-only") {
    const { image2AuthorizationProfileFingerprint, inspectImage2ProviderAuthorization } = await import("../../../shared/state/state.mjs");
    const profileFingerprint = image2AuthorizationProfileFingerprint({
      operation: "style-master",
      profile: {
        model,
        resolution,
        style_prompt_sha256: sha256File(promptPath),
        deck_system_sha256: !noDeckSystem && existsSync(deckSystemPath) ? sha256File(deckSystemPath) : null,
      },
    });
    const authorization = inspectImage2ProviderAuthorization(deckRoot(resolvedRunDir), {
      runDir: resolvedRunDir,
      operation: "style-master",
      scope: { role: "style-master" },
      profileFingerprint,
      maxSubmissions: 1,
    });
    if (!authorization.ok) {
      generateStyleMaster.lastFailure = {
        category: "gate",
        source: { path: resolvedRunDir },
        reason: { kind: "provider_authorization_required", code: authorization.code },
      };
      return 1;
    }
  }

  if (needsProviderSubmit) {
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
export async function runStyleMasterCli(argv = process.argv, { executablePath = "PPTMAKER_FRAMEWORK/scripts/05-iteration/legacy-image2/generate_style_master.mjs" } = {}) {
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
              invocation: { program: "node", args: [executablePath, "--run-dir", opts.runDir, "--resolution", opts.resolution] },
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
