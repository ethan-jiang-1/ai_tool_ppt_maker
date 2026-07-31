import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createCanvas } from "@napi-rs/canvas";

import { CLI_BOUNDS, parseCliErrorLine } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/cli/cli_error.mjs";
import { pageAuthorityImage2Paths } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/page_authority_paths.mjs";
import { initBundle } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";

const FLOW = resolve(process.cwd(), "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs");

function pngBytes(color) {
  const canvas = createCanvas(2000, 1125);
  const context = canvas.getContext("2d");
  context.fillStyle = color;
  context.fillRect(0, 0, 2000, 1125);
  return canvas.toBuffer("image/png");
}

function framedSource(title) {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: framed
---

## Slide 01: \`FramGo\`

**TITLE**: ${title}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-readable-text
  - no-labels
\`\`\`

> **SPEAKER NOTE**: The CLI must preserve the current owner boundary.
`;
}

function createFixture(title) {
  const root = mkdtempSync(join(tmpdir(), "pptmaker-target-cli-diagnostic-"));
  const deck = join(root, "deck_target_cli_diagnostic");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), pngBytes("#1f4d6e"));
  writeFileSync(join(runDir, "slide-specifications.md"), framedSource(title));
  return { root, deck, runDir, paths: pageAuthorityImage2Paths(runDir) };
}

function runFlow(args, env = {}) {
  return new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, [FLOW, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, 45_000);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (status, signal) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`ppt_flow timed out: ${args.join(" ")}`));
        return;
      }
      resolveResult({ status, signal, stdout, stderr });
    });
  });
}

async function startMockProvider() {
  const calls = [];
  const server = createServer((request, response) => {
    calls.push({ method: request.method, url: request.url });
    request.resume();
    response.writeHead(500, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "unexpected provider call" }));
  });
  await new Promise((resolveReady, rejectReady) => {
    server.once("error", rejectReady);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", rejectReady);
      resolveReady();
    });
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("mock provider did not receive a TCP address");
  return {
    calls,
    env: {
      IMAGE2_API_KEY: "CLI_DIAGNOSTIC_CREDENTIAL_SENTINEL",
      IMAGE2_BASE_URL: `http://127.0.0.1:${address.port}`,
    },
    close: () => new Promise((resolveClosed) => server.close(resolveClosed)),
  };
}

function derivedPaths(paths) {
  return [
    paths.target_source_receipt,
    paths.target_raw_plan,
    paths.target_raw_evidence,
    paths.target_raw_review,
    paths.target_raw_review_projection,
    paths.target_final_manifest,
  ];
}

function immutableSnapshot(fixture) {
  return {
    state: readFileSync(join(fixture.deck, "_state", "state.yaml")),
    derived: derivedPaths(fixture.paths).map((path) => (existsSync(path) ? readFileSync(path) : null)),
    rawFiles: existsSync(fixture.paths.raw_root) ? readdirSync(fixture.paths.raw_root).sort() : null,
  };
}

function expectUnchanged(fixture, snapshot) {
  expect(immutableSnapshot(fixture)).toEqual(snapshot);
}

function parseFailure(result) {
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(1);
  expect(result.stdout).toBe("");
  const lines = result.stderr.split(/\r?\n/).filter(Boolean);
  const envelope = parseCliErrorLine(lines.at(-1));
  expect(envelope).toBeTruthy();
  expect(lines.map(parseCliErrorLine).filter(Boolean)).toHaveLength(1);
  expect(Buffer.byteLength(lines.at(-1), "utf8")).toBeLessThanOrEqual(CLI_BOUNDS.envelopeBytes);
  return envelope;
}

function expectOwnerAction(envelope, { category, reason, action }) {
  expect(envelope).toMatchObject({
    ok: false,
    code: "FAILED",
    diagnostic: {
      version: 1,
      category,
      reason: { kind: reason },
      next: { action, requires_human: false },
    },
  });
  expect(JSON.stringify(envelope.diagnostic.next)).not.toMatch(/force|waiv|retry/i);
}

describe("target Page Authority CLI diagnostics", () => {
  it("short-circuits an unfit Framed source, preserves owner boundaries, and succeeds after the same plan repair", async () => {
    const fixture = createFixture(`SOURCE_LITERAL_SENTINEL ${"W".repeat(28)}`);
    const provider = await startMockProvider();
    try {
      const before = immutableSnapshot(fixture);
      const rejected = await runFlow(["image2", "plan", fixture.runDir], provider.env);
      const envelope = parseFailure(rejected);

      expectOwnerAction(envelope, {
        category: "source_validation",
        reason: "framed_text_fit_failed",
        action: "edit_source",
      });
      expect(`${rejected.stdout}${rejected.stderr}`).not.toMatch(/SOURCE_LITERAL_SENTINEL|CLI_DIAGNOSTIC_CREDENTIAL_SENTINEL|page\.evaluate/i);
      expect(provider.calls).toHaveLength(0);
      expectUnchanged(fixture, before);

      writeFileSync(join(fixture.runDir, "slide-specifications.md"), framedSource("Repaired canonical Framed title"));
      const planned = await runFlow(["image2", "plan", fixture.runDir], provider.env);
      expect(planned.status, planned.stderr).toBe(0);
      const plan = JSON.parse(planned.stdout);
      expect(plan).toMatchObject({
        schema: "page-authority-target-raw-plan-projection-v1",
        plan_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      expect(provider.calls).toHaveLength(0);

      const beforeStaleHash = immutableSnapshot(fixture);
      const stale = await runFlow([
        "image2", "authorize", fixture.runDir, "--plan-hash", "0".repeat(64),
      ], provider.env);
      const staleEnvelope = parseFailure(stale);
      expectOwnerAction(staleEnvelope, {
        category: "artifact",
        reason: "target_raw_plan_stale",
        action: "repair_prerequisite",
      });
      expect(provider.calls).toHaveLength(0);
      expectUnchanged(fixture, beforeStaleHash);

      const authorized = await runFlow([
        "image2", "authorize", fixture.runDir, "--plan-hash", plan.plan_hash,
      ], provider.env);
      expect(authorized.status, authorized.stderr).toBe(0);
      expect(provider.calls).toHaveLength(0);
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 45_000);

  it("reports an unavailable pinned runtime before materialization and succeeds after the same plan environment repair", async () => {
    const fixture = createFixture("Runtime readiness");
    const emptyBrowserCache = mkdtempSync(join(tmpdir(), "pptmaker-empty-browser-cache-"));
    const provider = await startMockProvider();
    try {
      const before = immutableSnapshot(fixture);
      const rejected = await runFlow(["image2", "plan", fixture.runDir], {
        ...provider.env,
        PLAYWRIGHT_BROWSERS_PATH: emptyBrowserCache,
      });
      const envelope = parseFailure(rejected);

      expectOwnerAction(envelope, {
        category: "environment",
        reason: "framed_runtime_unavailable",
        action: "repair_environment",
      });
      expect(`${rejected.stdout}${rejected.stderr}`).not.toMatch(/CLI_DIAGNOSTIC_CREDENTIAL_SENTINEL|PLAYWRIGHT_BROWSERS_PATH/i);
      expect(provider.calls).toHaveLength(0);
      expectUnchanged(fixture, before);

      const repaired = await runFlow(["image2", "plan", fixture.runDir], provider.env);
      expect(repaired.status, repaired.stderr).toBe(0);
      expect(JSON.parse(repaired.stdout)).toMatchObject({
        schema: "page-authority-target-raw-plan-projection-v1",
        workflow: "framed",
      });
      expect(provider.calls).toHaveLength(0);
    } finally {
      await provider.close();
      rmSync(emptyBrowserCache, { recursive: true, force: true });
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 45_000);
});
