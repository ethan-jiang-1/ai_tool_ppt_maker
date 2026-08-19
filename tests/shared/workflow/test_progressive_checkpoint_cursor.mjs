import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createCanvas } from "@napi-rs/canvas";

import { initBundle } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  acceptPureProgressivePilot,
  buildPureProgressiveTargetRawPlan,
  preparePureProgressivePilotReview,
  resolvePureStyleMasterScope,
} from "../../../ppt_maker_harness/scripts/04-pure-image/index.mjs";
import {
  authorizeProgressiveRawBatch,
  generateProgressiveRawItem,
  planProgressiveRawPilot,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_raw_owner.mjs";
import { advanceProgressiveControllerCheckpoint } from "../../../ppt_maker_harness/scripts/shared/cli/command_support.mjs";
import { inspectWorkflow } from "../../../ppt_maker_harness/scripts/shared/workflow/inspect_workflow.mjs";
import { acceptLocalStyleMasterFixture } from "../../helpers/accepted_style_master.mjs";

const PPT_FLOW = resolve(process.cwd(), "ppt_maker_harness/scripts/ppt_flow.mjs");
const SLIDE_IDS = ["DeckGo", "SysMap", "FlowGo", "TeamGo", "RiskGo", "ValMap"];

function progressivePureSource() {
  return `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---
${SLIDE_IDS.map((slideId, index) => `
## Slide ${String(index + 1).padStart(2, "0")}: \`${slideId}\`

**TITLE**: Cursor fixture ${index + 1}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Progressive cursor regression fixture.
`).join("")}`;
}

async function fixture() {
  const root = mkdtempSync(join(tmpdir(), "progressive-checkpoint-cursor-"));
  const deck = join(root, "deck_checkpoint_cursor");
  const runDir = join(deck, "3_versions", "v1");
  const image = createCanvas(2000, 1125);
  image.getContext("2d").fillRect(0, 0, 2000, 1125);
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.png"), image.toBuffer("image/png"));
  writeFileSync(join(runDir, "slide-specifications.md"), progressivePureSource());
  await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
  const plan = buildPureProgressiveTargetRawPlan(runDir);
  return { root, deck, runDir, plan };
}

function rawPng() {
  const canvas = createCanvas(1600, 900);
  canvas.getContext("2d").fillStyle = "#c04040";
  canvas.getContext("2d").fillRect(0, 0, 1600, 900);
  return canvas.toBuffer("image/png");
}

function runCli(runDir, args) {
  return spawnSync(process.execPath, [PPT_FLOW, ...args, runDir], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

describe("progressive checkpoint cursor", () => {
  it("advances the durable cursor to the review node after pilot-review and to expansion after proceed", async () => {
    const value = await fixture();
    try {
      const planHash = value.plan.progressive_raw_work_plan.sha256;
      const route = { run_dir: value.runDir, deck_dir: value.deck };

      const planInspection = inspectWorkflow({ runDir: value.runDir });
      const planAdvance = await advanceProgressiveControllerCheckpoint(route, { workflowInspection: planInspection });
      expect(planAdvance.status).toBe("advanced");
      expect(planAdvance.handoff.to_node).toBe("recommend-target-pure-pilot");

      const pilot = await planProgressiveRawPilot({
        runDir: value.runDir,
        workflow: "pure",
        plan_hash: planHash,
        slide_ids: ["DeckGo", "SysMap"],
      });
      await advanceProgressiveControllerCheckpoint(route);
      await authorizeProgressiveRawBatch({
        runDir: value.runDir,
        workflow: "pure",
        plan_hash: planHash,
        batch_hash: pilot.batch.batch_hash,
      });
      await advanceProgressiveControllerCheckpoint(route);
      for (const slideId of ["DeckGo", "SysMap"]) {
        await generateProgressiveRawItem({
          runDir: value.runDir,
          workflow: "pure",
          plan_hash: planHash,
          batch_hash: pilot.batch.batch_hash,
          provider_requests_by_slide: value.plan.provider_requests_by_slide,
          submit: async () => rawPng(),
        });
        await advanceProgressiveControllerCheckpoint(route);
      }

      const review = await preparePureProgressivePilotReview(value.runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
      });
      expect(review.pilot_evidence_sha256).toMatch(/^[0-9a-f]{64}$/);
      const reviewAdvance = await advanceProgressiveControllerCheckpoint(route);
            // The cursor already landed on the review node when the last generate
      // completed; the pilot-review advance is an idempotent current result.
      expect(reviewAdvance.handoff.node_id).toBe("review-target-pure-pilot");
      expect(["advanced", "current"]).toContain(reviewAdvance.handoff.status);

      // The BUG-072 tri-relation: cursor, eligibility, and task projection agree.
      const stateRun = runCli(value.runDir, ["state", "--json"]);
      expect(stateRun.status, stateRun.stderr).toBe(0);
      const report = JSON.parse(stateRun.stdout);
      expect(report.current_node).toBe("review-target-pure-pilot");
      expect(report.workflow_inspection.primary_action.action_id).toBe("accept_progressive_pilot");
      expect(report.eligible_candidates).not.toContain("author-target-narrative-sources");
      expect(report.task_projection.status).not.toBe("not-applicable");

      const statusRun = runCli(value.runDir, ["status", "--json"]);
      expect(statusRun.status, statusRun.stderr).toBe(0);
      const status = JSON.parse(statusRun.stdout);
      expect(status.current_node).toBe("review-target-pure-pilot");

      const accepted = await acceptPureProgressivePilot(value.runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
        decision: "proceed",
      });
      expect(accepted.pilot_decision_sha256).toMatch(/^[0-9a-f]{64}$/);
      const expansionAdvance = await advanceProgressiveControllerCheckpoint(route);
      expect(expansionAdvance.handoff.to_node).toBe("plan-target-pure-expansion");
      expect(expansionAdvance.handoff.status).toBe("advanced");

      const afterRun = runCli(value.runDir, ["state", "--json"]);
      expect(afterRun.status, afterRun.stderr).toBe(0);
      const after = JSON.parse(afterRun.stdout);
      expect(after.current_node).toBe("plan-target-pure-expansion");
      expect(after.eligible_candidates).not.toContain("author-target-narrative-sources");
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("leaves the cursor unchanged when a lock contention fails a mutation", async () => {
    const value = await fixture();
    try {
      const planHash = value.plan.progressive_raw_work_plan.sha256;
      const route = { run_dir: value.runDir, deck_dir: value.deck };
      await advanceProgressiveControllerCheckpoint(route);

      // Plant a live lock so the next mutation fails with the wait envelope.
      const { progressiveRawStorePaths } = await import("../../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_store.mjs");
      const { canonicalJson } = await import("../../../ppt_maker_harness/scripts/shared/identity/canonical_json.mjs");
      const { mkdirSync, writeFileSync } = await import("node:fs");
      const lockPath = progressiveRawStorePaths(value.runDir, { plan_sha256: planHash }).plan_lock;
      mkdirSync(lockPath, { recursive: false });
      writeFileSync(join(lockPath, "owner.json"), canonicalJson({ pid: process.pid, started_at: "2026-08-16T00:00:00.000Z", scope: "test" }));

      const before = runCli(value.runDir, ["state", "--json"]);
      const beforeReport = JSON.parse(before.stdout);

      const failed = runCli(value.runDir, ["image2", "pilot", "--plan-hash", planHash, "--slide-id", "DeckGo"]);
      expect(failed.status).toBe(1);
      const envelope = JSON.parse(failed.stderr.trim().split("\n").at(-1));
      expect(envelope.diagnostic.next.action).toBe("wait_then_reread");
      expect(envelope.diagnostic.reason.kind).toBe("progressive_raw_store_locked");

      const after = runCli(value.runDir, ["state", "--json"]);
      const afterReport = JSON.parse(after.stdout);
      expect(afterReport.current_node).toBe(beforeReport.current_node);
      expect(afterReport.workflow_inspection.primary_action.action_id).toBe(beforeReport.workflow_inspection.primary_action.action_id);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("fails closed on unknown and mismatched checkpoint handoffs and projects backward", async () => {
    const value = await fixture();
    try {
      const { recordTargetProgressiveCheckpointCliHandoff, readState, writeState, setNodeStatus } = await import("../../../ppt_maker_harness/scripts/shared/state/state.mjs");
      const expectCode = (fn, code) => {
        let caught = null;
        try { fn(); } catch (error) { caught = error; }
        expect(caught?.code, caught?.message).toBe(code);
      };

      // Unknown checkpoint node.
      expectCode(() => recordTargetProgressiveCheckpointCliHandoff(value.deck, {
        runDir: value.runDir,
        checkpoint_node: "not-a-controller-node",
      }), "TARGET_PROGRESSIVE_CHECKPOINT_NODE_UNKNOWN");

      // Identity mismatch (foreign run version fails closed at the execution fence).
      expectCode(() => recordTargetProgressiveCheckpointCliHandoff(value.deck, {
        runDir: value.runDir,
        runVersion: "v9",
        checkpoint_node: "review-target-pure-pilot",
      }), "execution_run_version_mismatch");

      // Backward projection: cursor ahead of the owner checkpoint.
      const state = readState(value.deck, { purpose: "observe", runDir: value.runDir });
      setNodeStatus(state, "generate-target-pure-pilot", "in_progress", {}, { runVersion: "v1" });
      const generateBefore = structuredClone(state.nodes["generate-target-pure-pilot"]);
      writeState(value.deck, state);
      const rewound = recordTargetProgressiveCheckpointCliHandoff(value.deck, {
        runDir: value.runDir,
        checkpoint_node: "recommend-target-pure-pilot",
      });
      expect(rewound).toMatchObject({
        ok: true,
        to_node: "recommend-target-pure-pilot",
      });
      const after = readState(value.deck, { purpose: "observe", runDir: value.runDir });
      expect(after.current_node).toBe("recommend-target-pure-pilot");
      expect(after.nodes?.["recommend-target-pure-pilot"]?.status).toBe("in_progress");
      expect(after.nodes?.["generate-target-pure-pilot"]?.status).toBe("in_progress");
      expect(after.nodes?.["generate-target-pure-pilot"]?.started).toBe(generateBefore.started);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});
