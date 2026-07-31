import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createCanvas } from "@napi-rs/canvas";

import { initBundle } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { pageAuthorityImage2Paths } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/page_authority_paths.mjs";
import { readState } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

const FLOW = resolve(process.cwd(), "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs");

function pngBytes(color) {
  const canvas = createCanvas(2000, 1125);
  const context = canvas.getContext("2d");
  context.fillStyle = color;
  context.fillRect(0, 0, 2000, 1125);
  return canvas.toBuffer("image/png");
}

function targetSource(workflow, slides) {
  const negativeConstraints = workflow === "framed"
    ? "  - no-readable-text\n  - no-labels"
    : "  - no-logo";
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: ${workflow}
---

${slides.map((slide, index) => `## Slide ${String(index + 1).padStart(2, "0")}: \`${slide.id}\`

**TITLE**: ${slide.title}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
${negativeConstraints}
\`\`\`

> **SPEAKER NOTE**: ${slide.note}`).join("\n\n")}
`;
}

function createTargetFixture(prefix, workflow, slides) {
  const root = mkdtempSync(join(tmpdir(), prefix));
  const deck = join(root, `deck_${workflow}_journey`);
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), pngBytes("#1f4d6e"));
  writeFileSync(join(runDir, "slide-specifications.md"), targetSource(workflow, slides));
  return { root, deck, runDir };
}

function flow(args, env = {}) {
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

function expectSuccess(result) {
  expect(result.status, result.stderr || result.stdout).toBe(0);
  return result;
}

async function startMockProvider(bytes) {
  const calls = [];
  const encoded = bytes.toString("base64");
  const server = createServer((request, response) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.once("end", () => {
      let body = null;
      try {
        body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      } catch {
        // The request still counts: the child exercised the provider boundary.
      }
      calls.push({ method: request.method, url: request.url, body });
      if (request.method !== "POST" || request.url !== "/images/generations") {
        response.writeHead(404, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: "unexpected mock provider route" }));
        return;
      }
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
  if (!address || typeof address === "string") throw new Error("mock provider did not receive a TCP address");
  return {
    calls,
    env: {
      IMAGE2_API_KEY: "mock-target-workflow-key",
      IMAGE2_BASE_URL: `http://127.0.0.1:${address.port}`,
    },
    close: () => new Promise((resolveClosed) => server.close(resolveClosed)),
  };
}

async function runTargetRawLifecycle(runDir, env) {
  const planned = expectSuccess(await flow(["image2", "plan", runDir], env));
  const plan = JSON.parse(planned.stdout);
  expect(plan).toMatchObject({
    schema: "page-authority-target-raw-plan-projection-v1",
    plan_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
  });
  expectSuccess(await flow(["image2", "authorize", runDir, "--plan-hash", plan.plan_hash], env));
  expectSuccess(await flow(["image2", "generate", runDir, "--plan-hash", plan.plan_hash], env));
  expectSuccess(await flow(["image2", "review", runDir], env));
  expectSuccess(await flow(["image2", "accept", runDir, "--decision", "proceed"], env));
  expectSuccess(await flow(["build", runDir], env));
  return plan;
}

describe("mock TARGET workflow journey", () => {
  it("runs a homogeneous Framed current-version journey through text-only and notes-only refreshes", async () => {
    const slides = [
      { id: "FramGo", title: "Original framed heading", note: "Original Framed note." },
      { id: "BodyMap", title: "Second framed heading", note: "Second Framed note." },
    ];
    const fixture = createTargetFixture("target-framed-journey-", "framed", slides);
    const provider = await startMockProvider(pngBytes("#5d277f"));
    try {
      const initial = await runTargetRawLifecycle(fixture.runDir, provider.env);
      expect(initial).toMatchObject({ workflow: "framed", source_epoch: 1, ordered_slide_ids: ["FramGo", "BodyMap"] });
      expect(provider.calls).toHaveLength(2);
      expect(provider.calls.every((call) => call.body?.model === "gpt-image-2")).toBe(true);

      const paths = pageAuthorityImage2Paths(fixture.runDir);
      const originalRaw = readFileSync(join(paths.raw_root, "FramGo.png"));
      const titleUpdated = [
        { ...slides[0], title: "Refreshed framed heading" },
        slides[1],
      ];
      writeFileSync(join(fixture.runDir, "slide-specifications.md"), targetSource("framed", titleUpdated));
      const refreshed = expectSuccess(await flow([
        "refresh", fixture.runDir, "--kind", "title", "--only", "FramGo",
      ], provider.env));
      expect(refreshed.stdout).toContain("Target Framed refresh delivered without provider submission");
      expect(provider.calls).toHaveLength(2);
      expect(readFileSync(join(paths.raw_root, "FramGo.png"))).toEqual(originalRaw);
      const finalAfterTitleRefresh = readFileSync(join(paths.final_root, "FramGo.png"));

      const notesUpdated = [
        { ...titleUpdated[0], note: "Updated source-owned Framed note." },
        titleUpdated[1],
      ];
      writeFileSync(join(fixture.runDir, "slide-specifications.md"), targetSource("framed", notesUpdated));
      const notes = expectSuccess(await flow(["refresh", fixture.runDir, "--kind", "notes"], provider.env));
      expect(notes.stdout).toContain("Target Page Authority notes refreshed");
      expect(provider.calls).toHaveLength(2);
      expect(readFileSync(join(paths.raw_root, "FramGo.png"))).toEqual(originalRaw);
      expect(readFileSync(join(paths.final_root, "FramGo.png"))).toEqual(finalAfterTitleRefresh);
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 90_000);

  it("rejects mixed workflow evidence before final publication", async () => {
    const slides = [{ id: "FramGo", title: "Current framed heading", note: "Current Framed note." }];
    const fixture = createTargetFixture("target-mixed-evidence-", "framed", slides);
    const provider = await startMockProvider(pngBytes("#5d277f"));
    try {
      await runTargetRawLifecycle(fixture.runDir, provider.env);
      const paths = pageAuthorityImage2Paths(fixture.runDir);
      const finalManifestBefore = readFileSync(paths.target_final_manifest);
      const evidence = JSON.parse(readFileSync(paths.target_raw_evidence, "utf8"));
      writeFileSync(paths.target_raw_evidence, `${JSON.stringify({ ...evidence, workflow: "pure" })}\n`);

      const result = await flow(["build", fixture.runDir], provider.env);
      expect(result.status).not.toBe(0);
      expect(`${result.stdout}\n${result.stderr}`).toContain("accepted raw evidence does not bind the current raw work plan");
      expect(provider.calls).toHaveLength(1);
      expect(readFileSync(paths.target_final_manifest)).toEqual(finalManifestBefore);
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 90_000);

  it("runs fresh Pure and rebuilds its visible pixels through a fresh raw lifecycle", async () => {
    const initialSlides = [{ id: "PureGo", title: "Original pure heading", note: "Original Pure note." }];
    const fixture = createTargetFixture("target-pure-journey-", "pure", initialSlides);
    const provider = await startMockProvider(pngBytes("#205070"));
    try {
      const initial = await runTargetRawLifecycle(fixture.runDir, provider.env);
      expect(initial).toMatchObject({ workflow: "pure", source_epoch: 1 });
      expect(provider.calls).toHaveLength(1);

      writeFileSync(join(fixture.runDir, "slide-specifications.md"), targetSource("pure", [
        { ...initialSlides[0], title: "Updated pure heading" },
      ]));
      const rejectedRefresh = await flow([
        "refresh", fixture.runDir, "--kind", "title", "--only", "PureGo",
      ], provider.env);
      expect(rejectedRefresh.status).not.toBe(0);
      expect(`${rejectedRefresh.stdout}\n${rejectedRefresh.stderr}`).toContain("Target Pure visible text requires a Pure raw rebuild");
      expect(provider.calls).toHaveLength(1);

      const rebuilt = await runTargetRawLifecycle(fixture.runDir, provider.env);
      expect(rebuilt).toMatchObject({ workflow: "pure", source_epoch: 2 });
      expect(provider.calls).toHaveLength(2);
      expect(readState(fixture.deck, { purpose: "observe", runVersion: "v1" })
        .page_authority_target_evidence.by_version["3_versions/v1"])
        .toMatchObject({ source_epoch: 2, workflow: "pure", accepted_raw_evidence_sha256: expect.any(String), final_manifest_sha256: expect.any(String), delivery_receipt_sha256: expect.any(String) });
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 90_000);

});
