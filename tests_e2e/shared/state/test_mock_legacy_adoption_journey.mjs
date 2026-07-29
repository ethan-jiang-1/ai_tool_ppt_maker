import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { initLegacyFixtureBundle } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { createDefaultState, readState, writeState } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

const FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";
const TARGET_INTAKE = Object.freeze({
  topic: "Target-owned topic",
  audience: "Target audience",
  duration: "20 minutes",
  language: "English",
  takeaway: "One target-owned outcome",
  content_constraints: "No inherited legacy material",
  visual_dna: "Target-owned visual system",
  success_criteria: "A clean Page Authority raw boundary",
});

function legacySource() {
  return `---
production:
  pipeline: whole-page-image2-v1
---

## Slide 01: \`HeroGo\`

**TITLE**: Historical slide
`;
}

function pageAuthoritySource() {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: framed
---

## Slide 01: \`HeroGo\`

**TITLE**: Target-owned slide
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-readable-text
  - no-labels
\`\`\`

> **SPEAKER NOTE**: Target-owned note.
`;
}

function retainedRow() {
  return {
    source_slide_id: "HeroGo",
    target_slide_id: "HeroGo",
    disposition: "retained",
    workflow: "framed",
    text_frame_disposition: "authored",
    visual_brief_disposition: "authored",
    reference_disposition: "none",
    speaker_notes_disposition: "authored",
  };
}

function flow(args, env) {
  return spawnSync("node", [FLOW, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, ...env },
    timeout: 30_000,
  });
}

function setupLegacyRun() {
  const root = mkdtempSync(join(tmpdir(), "legacy-adoption-journey-"));
  const deck = join(root, "deck_legacy_adoption");
  initLegacyFixtureBundle(deck, null, "keynote", "dark-executive", { mode: "image2-only" });
  const runDir = join(deck, "3_versions", "v1");
  writeFileSync(join(runDir, "slide-specifications.md"), legacySource());

  const state = createDefaultState();
  state.pipeline = "whole-page-image2-v1";
  state.playbook = "create-deck";
  state.current_node = "author-whole-page-content";
  state.execution_id = "exec-legacy-source";
  state.execution_started_at = "2026-07-27T00:00:00.000Z";
  state.run_version = "v1";
  state.nodes[state.current_node] = {
    status: "in_progress",
    execution_id: state.execution_id,
    run_version: "v1",
  };
  state.production_mode.by_version["3_versions/v1"] = { mode: "image2-only" };
  writeState(deck, state);
  return { root, deck, runDir };
}

function authorCandidate(runDir) {
  const candidate = join(runDir, "_scratch", "production-mode-transition", "candidate-run");
  writeFileSync(join(candidate, "target.json"), JSON.stringify({
    schema: "pptmaker-production-mode-transition-target-v2",
    target_mode: "image2-page-authority-v2",
    workflow: "framed",
  }));
  writeFileSync(join(candidate, "target-intake.json"), JSON.stringify(TARGET_INTAKE));
  writeFileSync(join(candidate, "slide-specifications.md"), pageAuthoritySource());
  writeFileSync(join(candidate, "adoption-matrix.json"), JSON.stringify({
    schema: "pptmaker-page-authority-legacy-adoption-matrix-v2",
    source_version: "v1",
    rows: [retainedRow()],
  }));
}

async function startProviderCounter() {
  const calls = [];
  const server = createServer((request, response) => {
    calls.push({ method: request.method, url: request.url });
    request.resume();
    response.writeHead(500, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "provider call is forbidden in this journey" }));
  });
  await new Promise((resolveReady, rejectReady) => {
    server.once("error", rejectReady);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", rejectReady);
      resolveReady();
    });
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("provider counter did not receive a TCP address");
  return {
    calls,
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolveClosed) => server.close(resolveClosed)),
  };
}

describe("mock legacy adoption journey", () => {
  it("publishes a clean Page Authority target with zero provider calls", async () => {
    const fixture = setupLegacyRun();
    const provider = await startProviderCounter();
    const env = {
      IMAGE2_API_KEY: "provider-counter-key",
      IMAGE2_BASE_URL: provider.baseUrl,
    };
    try {
      const inspected = flow(["state", fixture.runDir, "--inspect-legacy-protocol"], env);
      expect(inspected.status, inspected.stderr).toBe(0);
      expect(JSON.parse(inspected.stdout)).toMatchObject({
        operation: "inspect-legacy-protocol",
        classification: "recognized-legacy",
        next_action: "prepare-legacy-adoption",
      });

      const fencedBuild = flow(["build", fixture.runDir], env);
      expect(fencedBuild.status).not.toBe(0);
      expect(fencedBuild.stderr).toContain("LEGACY_PROTOCOL_ADOPTION_REQUIRED");
      expect(provider.calls).toEqual([]);

      const prepared = flow(["state", fixture.runDir, "--prepare-legacy-adoption"], env);
      expect(prepared.status, prepared.stderr).toBe(0);
      expect(JSON.parse(prepared.stdout)).toMatchObject({
        operation: "prepare-legacy-adoption",
        plan_kind: "legacy-adoption",
        target_mode: "image2-page-authority-v2",
        target_workflow: null,
      });

      authorCandidate(fixture.runDir);
      const previewed = flow(["state", fixture.runDir, "--preview-legacy-adoption"], env);
      expect(previewed.status, previewed.stderr).toBe(0);
      const preview = JSON.parse(previewed.stdout);
      expect(preview).toMatchObject({
        operation: "preview-legacy-adoption",
        plan_kind: "legacy-adoption",
        target_workflow: "framed",
        deterministic_impact: { needs_raw_generation: ["HeroGo"] },
        adoption: { workflow: "framed", matrix_rows: [retainedRow()] },
      });

      const confirmed = flow(["state", fixture.runDir, "--confirm-legacy-adoption", "--plan-hash", preview.plan_hash], env);
      expect(confirmed.status, confirmed.stderr).toBe(0);
      const applied = flow(["state", fixture.runDir, "--apply-legacy-adoption", "--plan-hash", preview.plan_hash], env);
      expect(applied.status, applied.stderr).toBe(0);
      expect(JSON.parse(applied.stdout)).toMatchObject({
        operation: "apply-legacy-adoption",
        target_version: "v2",
        target_mode: "image2-page-authority-v2",
        target_workflow: "framed",
        current_node: "authorize-target-framed-raw",
        needs_raw_generation: ["HeroGo"],
      });

      const target = join(fixture.deck, "3_versions", "v2");
      const state = readState(fixture.deck, { purpose: "observe", heal: false, runVersion: "v2" });
      expect(state.production_mode.by_version["3_versions/v2"]).toEqual({ mode: "image2-page-authority-v2", workflow: "framed", source_epoch: 1 });
      expect(state.page_authority_target_evidence.by_version["3_versions/v2"]).toMatchObject({
        workflow: "framed",
        provider_authorization_sha256: null,
        accepted_raw_evidence_sha256: null,
        final_manifest_sha256: null,
        delivery_receipt_sha256: null,
      });
      expect(state.page_authority_raw_provider_authorization?.by_version?.["3_versions/v2"]).toBeUndefined();
      expect(state.page_authority_delivery_review?.by_version?.["3_versions/v2"]).toBeUndefined();
      expect(existsSync(join(target, "_generated", "page_authority_image2", "receipts", "production-mode-transition.json"))).toBe(true);
      expect(existsSync(join(target, "adoption-matrix.json"))).toBe(false);
      expect(provider.calls).toEqual([]);
    } finally {
      await provider.close();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 90_000);
});
