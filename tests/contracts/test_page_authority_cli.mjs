import { describe, expect, it } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createCanvas } from "@napi-rs/canvas";

import { initBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { pageAuthorityImage2Paths } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { readState, writeState } from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

const PPT_FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";

function pageAuthoritySource(title = "Stable pixels") {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v1
  page_authority_default: framed-image2
---

## Slide 01: \`DeckGo\`

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

> **SPEAKER NOTE**: Explain the stable Page Authority boundary.
`;
}

function run(args, { env = {}, timeout = 60_000 } = {}) {
  return spawnSync("node", [PPT_FLOW, ...args], {
    encoding: "utf8",
    timeout,
    env: { ...process.env, ...env },
  });
}

function parseJson(stdout) {
  return JSON.parse(stdout);
}

function lastError(stderr) {
  return JSON.parse(String(stderr).trim().split("\n").filter(Boolean).at(-1));
}

async function startRawRelay() {
  const png = createCanvas(2000, 1125).toBuffer("image/png").toString("base64");
  const root = mkdtempSync(join(tmpdir(), "page-authority-relay-"));
  const requestPath = join(root, "request.json");
  const scriptPath = join(root, "relay.mjs");
  writeFileSync(scriptPath, `
import { createServer } from "node:http";
import { writeFileSync } from "node:fs";
const png = ${JSON.stringify(png)};
const requestPath = process.argv[2];
const server = createServer((request, response) => {
  let body = "";
  request.on("data", (chunk) => { body += chunk; });
  request.on("end", () => {
    writeFileSync(requestPath, body, "utf8");
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ data: [{ bytes_base64: png }] }));
  });
});
server.listen(0, "127.0.0.1", () => process.stdout.write(String(server.address().port) + "\\n"));
const stop = () => server.close(() => process.exit(0));
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
`, "utf8");
  const child = spawn(process.execPath, [scriptPath, requestPath], { stdio: ["ignore", "pipe", "pipe"] });
  const port = await new Promise((resolvePort, rejectPort) => {
    const timeout = setTimeout(() => rejectPort(new Error("raw relay did not start")), 5_000);
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.once("error", (error) => { clearTimeout(timeout); rejectPort(error); });
    child.stdout.once("data", (chunk) => {
      clearTimeout(timeout);
      const value = Number.parseInt(chunk.toString().trim(), 10);
      if (Number.isSafeInteger(value) && value > 0) resolvePort(value);
      else rejectPort(new Error(`raw relay reported invalid port: ${stderr}`));
    });
  });
  return {
    baseUrl: `http://127.0.0.1:${port}/v1`,
    requests() {
      return existsSync(requestPath) ? [JSON.parse(readFileSync(requestPath, "utf8"))] : [];
    },
    async close() {
      if (child.exitCode === null) child.kill("SIGTERM");
      rmSync(root, { recursive: true, force: true });
    },
  };
}

describe("Page Authority CLI lifecycle", () => {
  it("keeps raw work receipt-bound and refreshes a Framed title without provider credentials", async () => {
    const root = mkdtempSync(join(tmpdir(), "page-authority-cli-"));
    const deck = join(root, "deck_page_authority");
    let relay = null;
    try {
      initBundle(deck, null, "keynote", "dark-executive", { mode: "image2-page-authority" });
      const runDir = join(deck, "3_versions", "v1");
      const sourcePath = join(runDir, "slide-specifications.md");
      writeFileSync(sourcePath, pageAuthoritySource(), "utf8");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), "style-master-bytes", "utf8");

      const validation = run(["validate", runDir]);
      expect(validation.status, validation.stderr).toBe(0);

      const localDoctor = run(
        ["doctor", "--run-dir", runDir, "--operation", "framed-local-refresh"],
        { env: { IMAGE2_API_KEY: "", IMAGE2_BASE_URL: "" } },
      );
      expect(localDoctor.status, localDoctor.stderr).toBe(0);
      expect(localDoctor.stdout).toContain("framed-runtime");
      expect(localDoctor.stdout).not.toContain("api_key");

      const legacyPilot = run(["pilot", runDir]);
      expect(legacyPilot.status).not.toBe(0);
      expect(lastError(legacyPilot.stderr)).toMatchObject({
        code: "FAILED",
        where: "ppt_flow.pilot.identity",
        diagnostic: {
          reason: { kind: "page_authority_adapter_pending" },
          next: { action: "repair_prerequisite", requires_human: false },
        },
      });

      const fenced = run(["image2", "plan", runDir, "--profile", "f".repeat(64), "--json"]);
      expect(fenced.status).not.toBe(0);
      expect(lastError(fenced.stderr)).toMatchObject({ code: "USAGE", where: "ppt_flow.image2.page-authority" });

      for (const args of [
        ["image2", "plan", runDir, "--slot", "primary_visual"],
        ["image2", "plan", runDir, "--slot=primary_visual"],
        ["image2", "plan", runDir, "--slides", "DeckGo"],
        ["image2", "plan", runDir, "--base-url", "https://provider.invalid"],
      ]) {
        const rejected = run(args);
        expect(rejected.status).not.toBe(0);
        expect(lastError(rejected.stderr)).toMatchObject({ code: "USAGE", where: "ppt_flow.image2.page-authority" });
      }

      const planned = run(["image2", "plan", runDir, "--json"]);
      expect(planned.status, planned.stderr).toBe(0);
      const plan = parseJson(planned.stdout);
      expect(plan).toMatchObject({ needs_raw_generation: ["DeckGo"], maximum_submissions: 1 });

      const unauthorizedSubmit = run(
        ["image2", "generate", runDir, "--plan-hash", plan.plan_hash, "--json"],
        { env: { IMAGE2_API_KEY: "", IMAGE2_BASE_URL: "" } },
      );
      expect(unauthorizedSubmit.status).not.toBe(0);
      expect(lastError(unauthorizedSubmit.stderr)).toMatchObject({
        code: "GATE_BLOCKED",
        where: "ppt_flow.image2.page-authority.generate",
        diagnostic: {
          category: "gate",
          reason: { kind: "provider_authorization_required" },
          next: { action: "repair_prerequisite", requires_human: false },
        },
      });

      const authorized = run(["image2", "authorize", runDir, "--plan-hash", plan.plan_hash, "--json"]);
      expect(authorized.status, authorized.stderr).toBe(0);
      expect(parseJson(authorized.stdout)).toMatchObject({ authorized: true, zero_submit: false });

      relay = await startRawRelay();
      const generated = run(
        ["image2", "generate", runDir, "--plan-hash", plan.plan_hash, "--json"],
        { env: { IMAGE2_API_KEY: "test-page-authority-key", IMAGE2_BASE_URL: relay.baseUrl }, timeout: 120_000 }
      );
      expect(generated.status, generated.stderr).toBe(0);
      expect(parseJson(generated.stdout)).toMatchObject({ submitted: 1 });
      expect(relay.requests()).toHaveLength(1);
      expect(JSON.stringify(relay.requests()[0])).not.toContain("Stable pixels");

      const review = run(["image2", "review", runDir, "--json"]);
      expect(review.status, review.stderr).toBe(0);
      expect(parseJson(review.stdout)).toMatchObject({ decision: null });

      const rawReviewConfirm = run(["build", runDir]);
      expect(rawReviewConfirm.status).not.toBe(0);
      expect(lastError(rawReviewConfirm.stderr)).toMatchObject({
        code: "GATE_BLOCKED",
        where: "ppt_flow.build.page-authority",
        diagnostic: {
          reason: { kind: "raw_review_confirm_required" },
          next: { action: "review", requires_human: true },
        },
      });

      const paths = pageAuthorityImage2Paths(runDir);
      writeFileSync(paths.raw_review_projection, "tampered raw review projection", "utf8");
      const staleRawEvidence = run(["build", runDir]);
      expect(staleRawEvidence.status).not.toBe(0);
      expect(lastError(staleRawEvidence.stderr)).toMatchObject({
        code: "GATE_BLOCKED",
        where: "ppt_flow.build.page-authority",
        diagnostic: {
          reason: { kind: "raw_review_evidence_stale" },
          next: { action: "repair_prerequisite", requires_human: false },
        },
      });

      const repairedReview = run(["image2", "review", runDir, "--json"]);
      expect(repairedReview.status, repairedReview.stderr).toBe(0);

      const accepted = run(["image2", "accept", runDir, "--decision", "proceed", "--json"]);
      expect(accepted.status, accepted.stderr).toBe(0);
      expect(parseJson(accepted.stdout).decision).toBe("proceed");

      const built = run(["build", runDir], { timeout: 120_000 });
      expect(built.status, built.stderr).toBe(0);
      expect(readFileSync(paths.final_manifest, "utf8")).toContain("DeckGo");
      expect(readFileSync(join(paths.final_root, "notes-receipt.json"), "utf8")).toContain("pptmaker-page-authority-notes-receipt-v1");

      const delivery = run(["state", runDir, "--record-page-authority-delivery-review", "proceed"]);
      expect(delivery.status, delivery.stderr).toBe(0);
      expect(parseJson(delivery.stdout)).toMatchObject({
        operation: "record-page-authority-delivery-review",
        decision: "proceed",
      });

      const complete = run(["state", runDir, "--json"]);
      expect(complete.status, complete.stderr).toBe(0);
      expect(parseJson(complete.stdout).workflow_inspection).toMatchObject({
        posture: "ready",
        primary_action: { display_label: "complete:page-authority-delivery" },
      });

      writeFileSync(sourcePath, pageAuthoritySource("Refreshed pixels"), "utf8");
      const refreshed = run(
        ["refresh", runDir, "--kind", "title", "--only", "DeckGo"],
        { env: { IMAGE2_API_KEY: "", IMAGE2_BASE_URL: "" }, timeout: 120_000 }
      );
      expect(refreshed.status, refreshed.stderr).toBe(0);
      expect(relay.requests()).toHaveLength(1);

      const staleDelivery = run(["state", runDir, "--json"]);
      expect(staleDelivery.status, staleDelivery.stderr).toBe(0);
      expect(parseJson(staleDelivery.stdout).workflow_inspection).toMatchObject({
        posture: "confirm",
        root_cause: { owner: "page-authority-delivery-review", kind: "DELIVERY_REVIEW_EVIDENCE_STALE" },
        primary_action: { action_id: "confirm-delivery-review", requires_human: true },
      });
    } finally {
      if (relay) await relay.close();
      rmSync(root, { recursive: true, force: true });
    }
  }, 180_000);

  it("fails closed on Page Authority source/state identity drift with one bounded recovery action", () => {
    const root = mkdtempSync(join(tmpdir(), "page-authority-identity-"));
    const deck = join(root, "deck_page_authority");
    try {
      initBundle(deck, null, "keynote", "dark-executive", { mode: "image2-page-authority" });
      const runDir = join(deck, "3_versions", "v1");
      writeFileSync(join(runDir, "slide-specifications.md"), pageAuthoritySource(), "utf8");
      const state = readState(deck, { purpose: "execute", heal: false });
      state.production_mode.by_version["3_versions/v1"] = { mode: "image2-only" };
      writeState(deck, state);

      const result = run(["doctor", "--run-dir", runDir, "--operation", "framed-local-refresh"], {
        env: { IMAGE2_API_KEY: "", IMAGE2_BASE_URL: "" },
      });
      expect(result.status).not.toBe(0);
      const error = lastError(result.stderr);
      expect(error).toMatchObject({
        code: "FAILED",
        where: "ppt_flow.doctor.run-dir",
        diagnostic: {
          category: "gate",
          reason: { kind: "mode_source_mismatch" },
          next: { action: "repair_prerequisite", requires_human: true },
        },
      });
      expect(Object.keys(error.diagnostic.next).sort()).toEqual(["action", "default", "requires_human"]);
      expect(result.stdout).not.toContain("api_key");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
