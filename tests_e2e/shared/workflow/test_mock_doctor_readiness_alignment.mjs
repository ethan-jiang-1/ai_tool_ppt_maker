import { spawn } from "node:child_process";
import { createCanvas } from "@napi-rs/canvas";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { STYLE_MASTER_PROMPT, initBundle, styleAsset } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { writeConfirmedImage2ProviderProfile } from "../../../tests/helpers/image2_provider_profile.mjs";

const FLOW = resolve(process.cwd(), "ppt_maker_harness/scripts/ppt_flow.mjs");
const PROFILE_ID = "mock-aligned-profile";

function pngBytes(color) {
  const canvas = createCanvas(2048, 1136);
  const context = canvas.getContext("2d");
  context.fillStyle = color;
  context.fillRect(0, 0, 2048, 1136);
  return canvas.toBuffer("image/png");
}

function sourceText() {
  return `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`PureOne\`

**TITLE**: Alignment
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
  const root = mkdtempSync(join(tmpdir(), "doctor-readiness-alignment-"));
  const deck = join(root, "deck_alignment");
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

/** Spawn ppt_flow with a fully controlled env (never inherits IMAGE2_* shell values).
 *  cwd stays at the repo root so package discovery works; the deck .env fills
 *  first by precedence, so the repo .env is inert when the deck .env is complete. */
function flow(args, { env = {} } = {}) {
  const childEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith("IMAGE2_")) childEnv[key] = value;
  }
  Object.assign(childEnv, env);
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

function jsonResult(result) {
  return JSON.parse(result.stdout);
}

async function runStyleMasterLocalLifecycle(runDir) {
  const inspected = await flow(["style-master", "inspect", runDir], {});
  expect(inspected.status, inspected.stderr).toBe(0);
  const plannedResult = await flow(["style-master", "plan", runDir, "--candidate-count", "0"], {});
  expect(plannedResult.status, plannedResult.stderr).toBe(0);
  const planned = jsonResult(plannedResult);
  await flow(["style-master", "review", runDir, "--plan-hash", planned.plan_sha256], {});
  await flow([
    "style-master", "accept", runDir,
    "--plan-hash", planned.plan_sha256,
    "--decision", "proceed",
    "--candidate-id", "local-existing",
  ], {});
  return planned;
}

async function buildPlanAndPilot(runDir) {
  const plan = jsonResult(await flow(["image2", "plan", runDir], {}));
  const pilot = jsonResult(await flow([
    "image2", "pilot", runDir,
    "--plan-hash", plan.plan_hash,
    "--slide-id", "PureOne",
  ], {}));
  return { plan, pilot };
}

describe("doctor READY reaches the exact Image2/Style Master consumers", () => {
  it("lets image2 authorize resolve the deck .env profile without a shell export", async () => {
    const value = fixture();
    try {
      writeFileSync(join(value.deck, ".env"), [
        `IMAGE2_API_KEY=deck-only-key`,
        `IMAGE2_BASE_URL=https://deck.example/v1`,
        `IMAGE2_PROVIDER_PROFILE_ID=${PROFILE_ID}`,
      ].join("\n"));

      const doctor = await flow([
        "preflight", value.runDir, "--operation", "raw-generation",
      ], {});
      expect(doctor.status, doctor.stderr).toBe(0);
      expect(doctor.stdout).toContain("READY");

      await runStyleMasterLocalLifecycle(value.runDir);
      const { plan, pilot } = await buildPlanAndPilot(value.runDir);

      const authorization = await flow([
        "image2", "authorize", value.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", pilot.batch.batch_hash,
      ], {});
      expect(authorization.status, authorization.stderr).toBe(0);
      const result = jsonResult(authorization);
      expect(result.grant_hash).toMatch(/^[0-9a-f]{64}$/);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  }, 120_000);

  it("hard-stops a deck .env profile mismatch before a grant with no provider side effect", async () => {
    const value = fixture();
    try {
      writeFileSync(join(value.deck, ".env"), [
        "IMAGE2_API_KEY=deck-only-key",
        "IMAGE2_BASE_URL=https://deck.example/v1",
        "IMAGE2_PROVIDER_PROFILE_ID=wrong-profile",
      ].join("\n"));

      await runStyleMasterLocalLifecycle(value.runDir);
      const { plan, pilot } = await buildPlanAndPilot(value.runDir);

      const authorization = await flow([
        "image2", "authorize", value.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", pilot.batch.batch_hash,
      ], {});
      expect(authorization.status).toBe(1);
      const envelope = JSON.parse(authorization.stderr.trim().split(/\r?\n/).filter(Boolean).at(-1));
      expect(envelope.diagnostic.category).toBe("environment");
      expect(envelope.diagnostic.reason.kind).toBe("image2_provider_profile_id_mismatch");
      expect(envelope.diagnostic.next.action).toBe("repair_environment");
      expect(authorization.stderr).not.toMatch(/api[_-]?key|bearer|authorization/i);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  }, 120_000);

  it("lets Style Master authorize resolve the same deck .env source", async () => {
    const value = fixture();
    try {
      writeFileSync(join(value.deck, ".env"), [
        `IMAGE2_API_KEY=deck-only-key`,
        `IMAGE2_BASE_URL=https://deck.example/v1`,
        `IMAGE2_PROVIDER_PROFILE_ID=${PROFILE_ID}`,
      ].join("\n"));

      const planned = jsonResult(await flow(["style-master", "plan", value.runDir, "--candidate-count", "1"], {}));
      const authorized = await flow([
        "style-master", "authorize", value.runDir,
        "--plan-hash", planned.plan_sha256,
      ], {});
      expect(authorized.status, authorized.stderr).toBe(0);
      const result = jsonResult(authorized);
      expect(result.grant).toBeDefined();
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  }, 120_000);
});
