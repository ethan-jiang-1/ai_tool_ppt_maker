import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";
import { encode as encodePng } from "fast-png";

import {
  STYLE_MASTER_IMAGE,
  STYLE_MASTER_PROMPT,
  initBundle,
  styleAsset,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { pageAuthorityImage2Paths } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/page_authority_paths.mjs";
import { readState } from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

const FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";
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

function flow(args, env = {}) {
  return new Promise((resolveResult, rejectResult) => {
    const child = spawn(process.execPath, [FLOW, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
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

function expectSuccess(result) {
  expect(result.status, result.stderr || result.stdout).toBe(0);
  return JSON.parse(result.stdout);
}

function source() {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
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

function fixture({ local = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "style-master-lifecycle-cli-"));
  const deck = join(root, "deck_style_master_lifecycle");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(runDir, "slide-specifications.md"), source(), "utf8");
  writeFileSync(styleAsset(runDir, STYLE_MASTER_PROMPT), "Use a calm editorial visual system with material depth.\n", "utf8");
  if (local) writeFileSync(styleAsset(runDir, STYLE_MASTER_IMAGE), LOCAL_PNG);
  return { root, deck, runDir, paths: pageAuthorityImage2Paths(runDir) };
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
        .toMatchObject({ page_authority_style_master: { by_version: { "3_versions/v1": { plan_sha256: planned.plan_sha256 } } } });
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
});
