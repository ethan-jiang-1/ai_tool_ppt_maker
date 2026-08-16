import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";
import { encode as encodePng } from "fast-png";

import {
  STYLE_MASTER_IMAGE,
  STYLE_MASTER_PROMPT,
  initBundle,
  styleAsset,
} from "../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { writeConfirmedImage2ProviderProfile } from "../../tests/helpers/image2_provider_profile.mjs";
import { pageImageWorkflowPaths } from "../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import { readState } from "../../ppt_maker_harness/scripts/shared/state/state.mjs";

const FLOW = join(process.cwd(), "ppt_maker_harness/scripts/ppt_flow.mjs");
const LOCAL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABHNCSVQICAgIfAhkiAAAAAFzUkdCAK7OHOkAAAANSURBVAiZY1AJyPoPAANYAd6lcnCEAAAAAElFTkSuQmCC",
  "base64",
);

let generatedPng = null;

function generatedCandidate() {
  if (generatedPng === null) {
    const data = new Uint8Array(2000 * 1125 * 4);
    data.fill(255);
    generatedPng = Buffer.from(encodePng({ width: 2000, height: 1125, data }));
  }
  return Buffer.from(generatedPng);
}

function flow(args, env = {}, cwd = process.cwd()) {
  const childEnv = { ...process.env, ...env };
  for (const [key, value] of Object.entries(childEnv)) {
    if (value === undefined) delete childEnv[key];
  }
  return new Promise((resolveResult, rejectResult) => {
    const child = spawn(process.execPath, [FLOW, ...args], {
      cwd,
      env: childEnv,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGTERM"), 30_000);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", (error) => {
      clearTimeout(timer);
      rejectResult(error);
    });
    child.once("close", (status, signal) => {
      clearTimeout(timer);
      resolveResult({ status, signal, stdout, stderr });
    });
  });
}

function isolatedImage2Env(overrides = {}) {
  return {
    IMAGE2_API_KEY: undefined,
    IMAGE2_BASE_URL: undefined,
    IMAGE2_PROVIDER_PROFILE_ID: undefined,
    ...overrides,
  };
}

function writeImage2Dotenv(directory, env) {
  writeFileSync(join(directory, ".env"), `IMAGE2_API_KEY=${env.IMAGE2_API_KEY}\nIMAGE2_BASE_URL=${env.IMAGE2_BASE_URL}\nIMAGE2_PROVIDER_PROFILE_ID=${env.IMAGE2_PROVIDER_PROFILE_ID}\n`, "utf8");
}

function expectSuccess(result) {
  expect(result.status, result.stderr || result.stdout).toBe(0);
  return JSON.parse(result.stdout);
}

function source({ workflow = "pure" } = {}) {
  return `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: ${workflow}
---

## Slide 01: \`DeckGo\`

**TITLE**: Style Master lifecycle
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: The Style Master handoff precedes raw planning.
`;
}

function fixture({ local = false, workflow = "pure" } = {}) {
  const root = mkdtempSync(join(tmpdir(), "style-master-lifecycle-cli-"));
  const deck = join(root, "deck_style_master_lifecycle");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeConfirmedImage2ProviderProfile(runDir, {
    profileId: "mock-style-master-profile",
    styleMasterModel: "mock-style-master-model",
    pageImageModel: "mock-page-image-model",
  });
  writeFileSync(join(runDir, "slide-specifications.md"), source({ workflow }), "utf8");
  writeFileSync(styleAsset(runDir, STYLE_MASTER_PROMPT), "Use a calm editorial visual system with material depth.\n", "utf8");
  if (local) writeFileSync(styleAsset(runDir, STYLE_MASTER_IMAGE), LOCAL_PNG);
  return { root, deck, runDir, paths: pageImageWorkflowPaths(runDir) };
}

function expectNoRawPublication(paths) {
  expect(existsSync(paths.target_source_receipt)).toBe(false);
  expect(existsSync(paths.target_raw_plan)).toBe(false);
  expect(existsSync(paths.target_raw_evidence)).toBe(false);
  expect(existsSync(paths.target_raw_review)).toBe(false);
  expect(existsSync(paths.target_final_manifest)).toBe(false);
  expect(existsSync(paths.final_projection)).toBe(false);
}

async function startMockProvider(bytes) {
  const calls = [];
  const encoded = bytes.toString("base64");
  const server = createServer((request, response) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.once("end", () => {
      calls.push({ method: request.method, url: request.url, body: Buffer.concat(chunks) });
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ data: [{ b64_json: encoded }] }));
    });
  });
  await new Promise((resolveReady, rejectReady) => {
    server.once("error", rejectReady);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", rejectReady);
      resolveReady();
    });
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("mock Style Master provider has no TCP address");
  return {
    calls,
    env: {
      IMAGE2_API_KEY: "mock-style-master-key",
      IMAGE2_BASE_URL: `http://127.0.0.1:${address.port}`,
      IMAGE2_PROVIDER_PROFILE_ID: "mock-style-master-profile",
    },
    close: () => new Promise((resolveClosed) => server.close(resolveClosed)),
  };
}

describe("fresh Style Master lifecycle integration", () => {
  it("promotes a generated candidate before the first Pure raw-plan materialization", async () => {
    const value = fixture();
    const provider = await startMockProvider(generatedCandidate());
    try {
      const planned = expectSuccess(await flow(["style-master", "plan", value.runDir, "--candidate-count", "1"], provider.env));
      expect(planned).toMatchObject({ workflow: "pure", max_candidate_submissions: 1, next_action: "authorize_style_master_candidates" });
      const authorized = expectSuccess(await flow(["style-master", "authorize", value.runDir, "--plan-hash", planned.plan_sha256], provider.env));
      expect(authorized).toMatchObject({ plan_sha256: planned.plan_sha256, max_candidate_submissions: 1 });
      const generated = expectSuccess(await flow(["style-master", "generate", value.runDir, "--plan-hash", planned.plan_sha256], provider.env));
      expect(generated).toMatchObject({ plan_sha256: planned.plan_sha256, next_action: "review_style_master_candidates" });
      expect(provider.calls).toHaveLength(1);
      const review = expectSuccess(await flow(["style-master", "review", value.runDir, "--plan-hash", planned.plan_sha256], provider.env));
      expect(review.candidates.map((candidate) => candidate.candidate_id)).toEqual(["candidate-001"]);
      const accepted = expectSuccess(await flow([
        "style-master", "accept", value.runDir,
        "--plan-hash", planned.plan_sha256,
        "--decision", "proceed",
        "--candidate-id", "candidate-001",
      ], provider.env));
      expect(accepted).toMatchObject({ promoted: true, selection_sha256: expect.stringMatching(/^[0-9a-f]{64}$/) });
      expect(readState(value.deck, { purpose: "observe", runDir: value.runDir }))
        .toMatchObject({ page_image_style_master: { by_version: { "3_versions/v1": { plan_sha256: planned.plan_sha256 } } } });
      expectNoRawPublication(value.paths);

      const rawPlan = expectSuccess(await flow(["image2", "plan", value.runDir], provider.env));
      expect(rawPlan).toMatchObject({ workflow: "pure", maximum_submissions: 1 });
      expect(existsSync(value.paths.target_source_receipt)).toBe(true);
      expect(existsSync(value.paths.target_raw_plan)).toBe(true);
      expect(existsSync(value.paths.target_raw_evidence)).toBe(false);
      expect(existsSync(value.paths.target_final_manifest)).toBe(false);
      expect(provider.calls).toHaveLength(1);
    } finally {
      await provider.close();
      rmSync(value.root, { recursive: true, force: true });
    }
  }, 60_000);

  it("takes an eligible local candidate directly to real-byte review without a provider cost gate", async () => {
    const value = fixture({ local: true });
    try {
      const planned = expectSuccess(await flow(["style-master", "plan", value.runDir, "--candidate-count", "0"]));
      expect(planned).toMatchObject({ max_candidate_submissions: 0, next_action: "review_style_master_candidates" });
      const review = expectSuccess(await flow(["style-master", "review", value.runDir, "--plan-hash", planned.plan_sha256]));
      expect(review.candidates).toMatchObject([{ candidate_id: "local-existing", kind: "local-existing" }]);
      const accepted = expectSuccess(await flow([
        "style-master", "accept", value.runDir,
        "--plan-hash", planned.plan_sha256,
        "--decision", "proceed",
        "--candidate-id", "local-existing",
      ]));
      expect(accepted).toMatchObject({ promoted: true, candidate_id: "local-existing" });
      expectNoRawPublication(value.paths);

      const rawPlan = expectSuccess(await flow(["image2", "plan", value.runDir]));
      expect(rawPlan).toMatchObject({ workflow: "pure", maximum_submissions: 1 });
      expect(existsSync(value.paths.target_source_receipt)).toBe(true);
      expect(existsSync(value.paths.target_raw_plan)).toBe(true);
      expect(existsSync(value.paths.target_raw_evidence)).toBe(false);
      expect(existsSync(value.paths.target_final_manifest)).toBe(false);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  }, 60_000);

  it("runs the public Framed plan, authorize, generate, and review path against the exact exclusive-header input", async () => {
    const value = fixture({ local: true, workflow: "framed" });
    const provider = await startMockProvider(generatedCandidate());
    try {
      // The authorize checkpoint resolves the runtime selector from the deck
      // .env through the shared restricted startup environment (no shell export).
      writeFileSync(join(value.deck, ".env"), [
        "IMAGE2_API_KEY=mock-style-master-key",
        "IMAGE2_BASE_URL=http://127.0.0.1:1/v1",
        "IMAGE2_PROVIDER_PROFILE_ID=mock-style-master-profile",
      ].join("\n"));
      const stylePlan = expectSuccess(await flow(["style-master", "plan", value.runDir, "--candidate-count", "0"]));
      expectSuccess(await flow([
        "style-master", "review", value.runDir,
        "--plan-hash", stylePlan.plan_sha256,
      ]));
      expectSuccess(await flow([
        "style-master", "accept", value.runDir,
        "--plan-hash", stylePlan.plan_sha256,
        "--decision", "proceed",
        "--candidate-id", "local-existing",
      ]));

      const planned = expectSuccess(await flow(["image2", "plan", value.runDir]));
      expect(planned).toMatchObject({ workflow: "framed", maximum_submissions: 1 });
      const pilot = expectSuccess(await flow([
        "image2", "pilot", value.runDir,
        "--plan-hash", planned.plan_hash,
        "--slide-id", "DeckGo",
      ]));
      expectSuccess(await flow([
        "image2", "authorize", value.runDir,
        "--plan-hash", planned.plan_hash,
        "--batch-hash", pilot.batch.batch_hash,
      ]));
      expectSuccess(await flow([
        "image2", "generate", value.runDir,
        "--plan-hash", planned.plan_hash,
        "--batch-hash", pilot.batch.batch_hash,
      ], provider.env));
      const reviewed = expectSuccess(await flow([
        "image2", "review", value.runDir,
        "--plan-hash", planned.plan_hash,
      ]));
      expect(reviewed).toMatchObject({ complete_raw_review_sha256: expect.stringMatching(/^[0-9a-f]{64}$/) });
      expect(provider.calls).toHaveLength(1);
      const request = JSON.parse(provider.calls[0].body.toString("utf8"));
      const prompt = JSON.parse(request.prompt);
      expect(prompt.instruction).toContain("exclusively reserved");
      expect(prompt.instruction).toContain("Do not render provider typography, labels, readable body content, or key subjects in reserved_header.");
      expect(prompt).not.toHaveProperty("local_header");
      expect(prompt).not.toHaveProperty("protected_geometry");
    } finally {
      await provider.close();
      rmSync(value.root, { recursive: true, force: true });
    }
  }, 60_000);

  it("loads Style Master credentials from deck-root then process-current dotenv scopes", async () => {
    const deckScoped = fixture();
    const cwdScoped = fixture();
    const currentDir = join(cwdScoped.root, "dotenv-current");
    const provider = await startMockProvider(generatedCandidate());
    try {
      writeImage2Dotenv(deckScoped.deck, provider.env);
      const deckPlan = expectSuccess(await flow(
        ["style-master", "plan", deckScoped.runDir, "--candidate-count", "1"],
        isolatedImage2Env(),
      ));
      expectSuccess(await flow(
        ["style-master", "authorize", deckScoped.runDir, "--plan-hash", deckPlan.plan_sha256],
        isolatedImage2Env(),
      ));
      expectSuccess(await flow(
        ["style-master", "generate", deckScoped.runDir, "--plan-hash", deckPlan.plan_sha256],
        isolatedImage2Env(),
      ));

      mkdirSync(currentDir);
      writeImage2Dotenv(currentDir, provider.env);
      const cwdPlan = expectSuccess(await flow(
        ["style-master", "plan", cwdScoped.runDir, "--candidate-count", "1"],
        isolatedImage2Env(),
        currentDir,
      ));
      expectSuccess(await flow(
        ["style-master", "authorize", cwdScoped.runDir, "--plan-hash", cwdPlan.plan_sha256],
        isolatedImage2Env(),
        currentDir,
      ));
      expectSuccess(await flow(
        ["style-master", "generate", cwdScoped.runDir, "--plan-hash", cwdPlan.plan_sha256],
        isolatedImage2Env(),
        currentDir,
      ));

      expect(provider.calls).toHaveLength(2);
      expect(provider.calls.map((call) => call.method)).toEqual(["POST", "POST"]);
    } finally {
      await provider.close();
      rmSync(deckScoped.root, { recursive: true, force: true });
      rmSync(cwdScoped.root, { recursive: true, force: true });
    }
  }, 60_000);
});
