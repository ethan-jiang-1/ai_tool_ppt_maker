import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";

import { initBundle, loadDotenv } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { parseCliErrorLine } from "../../../ppt_maker_harness/scripts/shared/cli/cli_error.mjs";
import { resolvePureStyleMasterScope, resolvePureTargetSource } from "../../../ppt_maker_harness/scripts/04-pure-image/index.mjs";
import { pageImageWorkflowPaths } from "../../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import { readState, writeState } from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";
import { acceptLocalStyleMasterFixture } from "../../../tests/helpers/accepted_style_master.mjs";

export const REAL_PROVIDER_SLIDE_ID = "RealGo";

/** Load the project-level test configuration only after the real-E2E gate admits this entry. */
export function loadRealProviderE2EEnvironment(directory = process.cwd()) {
  return loadDotenv(directory);
}

const PROVIDER_FAILURE_CLASSIFICATIONS = new Set([
  "http_error",
  "invalid_json",
  "task_terminal_failure",
  "task_response_invalid",
]);
const PROVIDER_RESPONSE_SHAPES = new Set(["empty", "html_like", "other_non_json"]);
const PROVIDER_MEDIA_CLASSIFICATIONS = new Set(["empty", "invalid_png"]);

/** Project only declared secret-safe facts from a terminal owner-issued result. */
export function formatRealProviderGenerationFailure(result) {
  const outcome = result?.outcome === "known_failure" ? "known_failure" : "unexpected_outcome";
  const facts = [`outcome=${outcome}`];
  const failure = result?.provider_failure;
  if (failure && PROVIDER_FAILURE_CLASSIFICATIONS.has(failure.classification)) {
    let value = failure.classification;
    if (failure.classification === "http_error" && Number.isSafeInteger(failure.http_status) && failure.http_status >= 100 && failure.http_status <= 599) {
      value += `:${failure.http_status}`;
    }
    if (failure.classification === "invalid_json" && PROVIDER_RESPONSE_SHAPES.has(failure.response_shape)) {
      value += `:${failure.response_shape}`;
    }
    facts.push(`provider_failure=${value}`);
  }
  const media = result?.provider_media?.actual;
  if (media && PROVIDER_MEDIA_CLASSIFICATIONS.has(media.classification)) {
    facts.push(`provider_media=${media.classification}`);
  }
  return facts.join(",");
}

function targetSource() {
  return `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`${REAL_PROVIDER_SLIDE_ID}\`

**TITLE**: Synthetic provider transport acceptance
**KICKER**: Test scope
**SUBTITLE**: One bounded raw page
**SLIDE BODY**:
\`\`\`yaml
items:
  - role: callout
    literal: Synthetic, non-sensitive acceptance content
\`\`\`
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Test-owned provider acceptance fixture.
`;
}

function localStyleMasterPng() {
  const canvas = createCanvas(2000, 1125);
  const context = canvas.getContext("2d");
  context.fillStyle = "#1f4d6e";
  context.fillRect(0, 0, 2000, 1125);
  return canvas.toBuffer("image/png");
}

/** Create a provider-free temporary Pure scope required by the real acceptance entry. */
export async function createRealProviderPureFixture() {
  const root = mkdtempSync(join(tmpdir(), "pptmaker-real-provider-e2e-"));
  const deck = join(root, "deck_real_provider_e2e");
  const runDir = join(deck, "3_versions", "v1");
  try {
    initBundle(deck, null, "keynote", "dark-executive");
    writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), localStyleMasterPng());
    writeFileSync(join(runDir, "slide-specifications.md"), targetSource(), "utf8");
    resolvePureTargetSource(runDir);
    await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
    return Object.freeze({ root, deck, runDir, paths: pageImageWorkflowPaths(runDir) });
  } catch (error) {
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
}

/** Position only the test-owned Controller fixture needed by public authorization. */
export function positionRealProviderAuthorizeNode(fixture, batch) {
  if (!fixture?.deck || !fixture?.runDir || batch?.kind !== "pilot") {
    throw new TypeError("a current real-provider fixture and Pilot batch are required");
  }
  const state = structuredClone(readState(fixture.deck, { purpose: "observe", runVersion: "v1" }));
  delete state.durable_state_present;
  state.playbook = "create-deck";
  state.current_node = "authorize-target-pure-pilot";
  writeState(fixture.deck, state);
  return state.current_node;
}

/** Remove only the OS-temporary scope created by createRealProviderPureFixture. */
export function cleanupRealProviderPureFixture(fixture) {
  if (!fixture?.root || !existsSync(fixture.root)) return;
  rmSync(fixture.root, { recursive: true, force: true });
}

function boundedCliDiagnostic(stderr) {
  const line = String(stderr || "").trim().split(/\r?\n/u).filter(Boolean).at(-1);
  const diagnostic = parseCliErrorLine(line)?.diagnostic;
  if (!diagnostic) return "";
  const facts = [
    diagnostic.category,
    diagnostic.operation,
    diagnostic.subject?.kind,
    diagnostic.reason?.kind,
    diagnostic.next?.action,
  ].filter(Boolean);
  return facts.length ? ` [${facts.join(",")}]` : "";
}

/** Convert a public command result without ever including child output in a test failure. */
export function readSafePptFlowJson(result, operation) {
  if (!result || result.status !== 0) {
    const status = Number.isInteger(result?.status) ? result.status : "unknown";
    throw new Error(`${operation} failed with exit status ${status}${boundedCliDiagnostic(result?.stderr)}`);
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(`${operation} returned invalid JSON`);
  }
}
