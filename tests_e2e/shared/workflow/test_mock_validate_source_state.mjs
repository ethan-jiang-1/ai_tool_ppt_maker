import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createCanvas } from "@napi-rs/canvas";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { STYLE_MASTER_PROMPT, initBundle, styleAsset } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { writeConfirmedImage2ProviderProfile } from "../../../tests/helpers/image2_provider_profile.mjs";

const FLOW = resolve(process.cwd(), "ppt_maker_harness/scripts/ppt_flow.mjs");
const PROFILE_ID = "mock-validate-profile";

function pngBytes(color) {
  const canvas = createCanvas(2048, 1136);
  const context = canvas.getContext("2d");
  context.fillStyle = color;
  context.fillRect(0, 0, 2048, 1136);
  return canvas.toBuffer("image/png");
}

function sourceText(title = "Title") {
  return `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`PureOne\`

**TITLE**: ${title}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`;
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "validate-source-state-"));
  const deck = join(root, "deck_validate");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeConfirmedImage2ProviderProfile(runDir, {
    profileId: PROFILE_ID,
    styleMasterModel: "mock-style-master-model",
    pageImageModel: "mock-page-image-model",
  });
  writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.png"), pngBytes("#1f4d6e"));
  writeFileSync(styleAsset(runDir, STYLE_MASTER_PROMPT), "Use a clear editorial visual system with clear content hierarchy.\n", "utf8");
  writeFileSync(join(runDir, "slide-specifications.md"), sourceText());
  return { root, deck, runDir };
}

function flow(args, env = {}) {
  const childEnv = { ...process.env, ...env };
  for (const [key, value] of Object.entries(childEnv)) {
    if (value === undefined) delete childEnv[key];
    if (key.startsWith("IMAGE2_") && !(key in env)) delete childEnv[key];
  }
  return new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, [FLOW, ...args], {
      cwd: process.cwd(),
      env: childEnv,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (status) => resolveResult({ status, stdout, stderr }));
  });
}

function json(result) {
  return JSON.parse(result.stdout);
}

function finalEnvelope(result) {
  const line = result.stderr.trim().split(/\r?\n/).filter(Boolean).at(-1);
  return JSON.parse(line);
}

function treeSnapshot(root) {
  const entries = [];
  (function walk(current) {
    for (const name of readdirSync(current).sort()) {
      const path = join(current, name);
      if (statSync(path).isDirectory()) walk(path);
      else entries.push(`${relative(root, path)}:${createHash("sha256").update(readFileSync(path)).digest("hex")}`);
    }
  })(root);
  return entries;
}

async function bindSourceAndState(runDir) {
  // Style Master local lifecycle binds the workflow; image2 plan binds the
  // source/state identity (receipt + state epoch).
  const inspected = await flow(["style-master", "inspect", runDir]);
  expect(inspected.status, inspected.stderr).toBe(0);
  const planned = json(await flow(["style-master", "plan", runDir, "--candidate-count", "0"]));
  await flow(["style-master", "review", runDir, "--plan-hash", planned.plan_sha256]);
  const accepted = await flow([
    "style-master", "accept", runDir,
    "--plan-hash", planned.plan_sha256,
    "--decision", "proceed",
    "--candidate-id", "local-existing",
  ]);
  expect(accepted.status, accepted.stderr).toBe(0);
  const plan = json(await flow(["image2", "plan", runDir]));
  return plan;
}

describe("validate projects source validity separately from state binding", () => {
  it("reports a source-only parse failure with the owner problem envelope", async () => {
    const value = fixture();
    try {
      const registryPath = join(value.deck, "2_backbone", "visual-style", "page-image-visual-language.yaml");
      writeFileSync(registryPath, readFileSync(registryPath, "utf8").replace("quiet depth", "quiet headline depth"));
      const result = await flow(["validate", value.runDir]);
      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      const envelope = finalEnvelope(result);
      expect(envelope.diagnostic.category).toBe("source_validation");
      expect(envelope.diagnostic.reason.kind).toBe("content_overriding_visual_clause");
      expect(envelope.diagnostic.next.action).toBe("edit_source");
      expect(envelope.diagnostic.source.path).toContain("page-image-visual-language.yaml");
      expect(envelope.diagnostic.source_valid).toBeUndefined();
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  }, 60_000);

  it("succeeds for a source-valid run with a current binding", async () => {
    const value = fixture();
    try {
      await bindSourceAndState(value.runDir);
      const result = await flow(["validate", value.runDir]);
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain("receipt validated: 1 slide(s)");
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  }, 90_000);

  it("separates source_valid from a stale state binding without writes", async () => {
    const value = fixture();
    try {
      await bindSourceAndState(value.runDir);
      writeFileSync(join(value.runDir, "slide-specifications.md"), sourceText("Edited title"));
      const before = treeSnapshot(value.deck);
      const result = await flow(["validate", value.runDir]);
      const after = treeSnapshot(value.deck);

      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      const envelope = finalEnvelope(result);
      expect(envelope.diagnostic.category).toBe("artifact");
      expect(envelope.diagnostic.reason.kind).toBe("target_source_state_identity_mismatch");
      expect(envelope.diagnostic.source_valid).toBe(true);
      expect(envelope.diagnostic.next.action).toBe("repair_prerequisite");
      expect(envelope.diagnostic.next.requires_human).toBe(false);
      expect(envelope.diagnostic.next.invocation.args).toContain("image2");
      expect(before).toEqual(after);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  }, 90_000);

  it("lets the source problem win over a stale binding", async () => {
    const value = fixture();
    try {
      await bindSourceAndState(value.runDir);
      const registryPath = join(value.deck, "2_backbone", "visual-style", "page-image-visual-language.yaml");
      writeFileSync(registryPath, readFileSync(registryPath, "utf8").replace("quiet depth", "quiet headline depth"));
      const result = await flow(["validate", value.runDir]);
      expect(result.status).toBe(1);
      const envelope = finalEnvelope(result);
      expect(envelope.diagnostic.category).toBe("source_validation");
      expect(envelope.diagnostic.reason.kind).toBe("content_overriding_visual_clause");
      expect(envelope.diagnostic.source_valid).toBeUndefined();
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  }, 90_000);
});
