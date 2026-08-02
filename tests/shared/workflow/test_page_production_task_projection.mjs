import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createCanvas } from "@napi-rs/canvas";

import { initBundle } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  buildPureProgressiveTargetRawPlan,
  resolvePureStyleMasterScope,
} from "../../../PPTMAKER_FRAMEWORK/scripts/04-pure-image/index.mjs";
import { readState, writeState } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import { inspectWorkflow } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/workflow/inspect_workflow.mjs";
import {
  pageProductionTaskProjectionPath,
  progressiveControllerCheckpoint,
  refreshPageProductionTaskProjection,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/workflow/page_production_task_projection.mjs";
import { progressiveControllerTaskProjectionEligibility } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/workflow/progressive_controller_task_projection_eligibility.mjs";
import { acceptLocalStyleMasterFixture } from "../../helpers/accepted_style_master.mjs";

const PPT_FLOW = resolve(process.cwd(), "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs");

function progressiveInspection({ actionId, latestBatch = null, progress = null } = {}) {
  return {
    evidence_summary: {
      mode: "image2-page-authority-v2",
      workflow: "pure",
      plan_hash: "a".repeat(64),
      latest_batch: latestBatch,
      progress,
      evidence: {},
      controller_handoffs: {},
    },
    primary_action: {
      owner: "progressive-raw-owner",
      action_id: actionId,
      kind: "confirm",
      requires_human: true,
    },
  };
}

function authoritySnapshot(root, current = root, entries = []) {
  for (const name of readdirSync(current).sort()) {
    const path = join(current, name);
    const relative = path.slice(root.length + 1);
    if (statSync(path).isDirectory()) authoritySnapshot(root, path, entries);
    else if (relative !== "_state/page-production-task-projection.md") {
      entries.push(`${relative}:${readFileSync(path).toString("base64")}`);
    }
  }
  return entries;
}

function runState(runDir, { json = false, validate = false } = {}) {
  return spawnSync(process.execPath, [PPT_FLOW, "state", runDir, ...(json ? ["--json"] : []), ...(validate ? ["--validate-state"] : [])], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

function readProjectionStatus(result, { json }) {
  if (json) return JSON.parse(result.stdout).task_projection?.status;
  return result.stdout.match(/^Task projection:\s+(\S+)$/mi)?.[1];
}

async function fixture() {
  const root = mkdtempSync(join(tmpdir(), "page-production-task-projection-"));
  const deck = join(root, "deck_projection");
  const runDir = join(deck, "3_versions", "v1");
  const image = createCanvas(2000, 1125);
  image.getContext("2d").fillRect(0, 0, 2000, 1125);
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
  writeFileSync(join(runDir, "slide-specifications.md"), `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Collaboration projection fixture
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`);
  await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
  const plan = buildPureProgressiveTargetRawPlan(runDir);
  const state = readState(deck, { purpose: "observe", runDir });
  state.current_node = "recommend-target-pure-pilot";
  writeState(deck, state);
  return { root, deck, runDir, plan };
}

describe("progressive page-production task projection", () => {
  it("rebuilds missing and manually edited cards only from current owner inspection", async () => {
    const value = await fixture();
    try {
      const inspection = inspectWorkflow({ runDir: value.runDir });
      expect(inspection.primary_action).toMatchObject({ action_id: "plan_progressive_pilot" });
      const path = pageProductionTaskProjectionPath(value.runDir);
      const first = refreshPageProductionTaskProjection({ runDir: value.runDir, inspection });
      expect(first.status).toBe("created");
      expect(readFileSync(path, "utf8")).toContain(value.plan.progressive_raw_work_plan.sha256);
      expect(readFileSync(path, "utf8")).toContain("recommend-target-pure-pilot");

      writeFileSync(path, "# manually edited\n- action: generate_progressive_raw_item\n");
      const before = inspectWorkflow({ runDir: value.runDir });
      const replaced = refreshPageProductionTaskProjection({ runDir: value.runDir, inspection: before });
      expect(replaced.status).toBe("updated");
      expect(readFileSync(path, "utf8")).not.toContain("manually edited");
      expect(inspectWorkflow({ runDir: value.runDir }).primary_action).toEqual(before.primary_action);

      unlinkSync(path);
      const rebuilt = refreshPageProductionTaskProjection({ runDir: value.runDir, inspection: inspectWorkflow({ runDir: value.runDir }) });
      expect(rebuilt.status).toBe("created");
      expect(readFileSync(path, "utf8")).toContain("Page Production Task Projection");
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("requires the exact active create-deck Controller identity before writing a card", async () => {
    const value = await fixture();
    try {
      const inspection = inspectWorkflow({ runDir: value.runDir });
      const state = readState(value.deck, { purpose: "observe", runDir: value.runDir });
      const wrongController = { ...state, playbook: "edit-text" };
      expect(() => refreshPageProductionTaskProjection({
        runDir: value.runDir,
        inspection,
        state: wrongController,
      })).toThrow("PROGRESSIVE_CONTROLLER_IDENTITY_MISMATCH");

      const siblingNode = { ...state, current_node: "review-target-framed-raw" };
      expect(() => refreshPageProductionTaskProjection({
        runDir: value.runDir,
        inspection,
        state: siblingNode,
      })).toThrow("PROGRESSIVE_CONTROLLER_NODE_MISMATCH");
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("uses one read-only predicate for the exact active progressive route", async () => {
    const value = await fixture();
    try {
      const inspection = inspectWorkflow({ runDir: value.runDir });
      const state = readState(value.deck, { purpose: "observe", runDir: value.runDir });
      expect(progressiveControllerTaskProjectionEligibility({ runDir: value.runDir, inspection, state })).toMatchObject({
        eligible: true,
        checkpoint: { controller_node: "recommend-target-pure-pilot", workflow: "pure" },
      });
      expect(progressiveControllerTaskProjectionEligibility({
        runDir: value.runDir,
        inspection,
        state: { ...state, current_node: "inspect-target-pure-style-master" },
      })).toEqual({ eligible: false, reason: "PROGRESSIVE_CONTROLLER_NODE_MISMATCH" });
      expect(progressiveControllerTaskProjectionEligibility({
        runDir: value.runDir,
        inspection,
        state: { ...state, playbook: "edit-text", current_node: "refresh-target-pure-text" },
      })).toEqual({ eligible: false, reason: "PROGRESSIVE_CONTROLLER_IDENTITY_MISMATCH" });
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it.each([false, true])("reports every task-projection status through normal state (%s JSON)", async (json) => {
    for (const expected of ["created", "updated", "current", "not-applicable"]) {
      const value = await fixture();
      try {
        const path = pageProductionTaskProjectionPath(value.runDir);
        const inspection = inspectWorkflow({ runDir: value.runDir });
        if (expected === "updated") writeFileSync(path, "# stale collaboration card\n");
        if (expected === "current") refreshPageProductionTaskProjection({ runDir: value.runDir, inspection });
        if (expected === "not-applicable") {
          const state = readState(value.deck, { purpose: "observe", runDir: value.runDir });
          writeState(value.deck, {
            ...state,
            current_node: "inspect-target-pure-style-master",
          });
        }
        const before = authoritySnapshot(value.deck);
        const result = runState(value.runDir, { json });
        expect(result.status, `${expected} ${result.stderr}`).toBe(0);
        expect(readProjectionStatus(result, { json }), `${expected} ${result.stdout}`).toBe(expected);
        expect(authoritySnapshot(value.deck), expected).toEqual(before);
        if (expected === "not-applicable") expect(existsSync(path), expected).toBe(false);
        else expect(readFileSync(path, "utf8"), expected).toContain("Page Production Task Projection");
      } finally {
        rmSync(value.root, { recursive: true, force: true });
      }
    }
  }, 60_000);

  it("keeps status and state validation zero-write without a projection status", async () => {
    const value = await fixture();
    try {
      const before = authoritySnapshot(value.deck);
      const status = spawnSync(process.execPath, [PPT_FLOW, "status", value.runDir, "--json"], {
        cwd: process.cwd(),
        encoding: "utf8",
      });
      expect(status.status, status.stderr).toBe(0);
      expect(status.stdout).not.toContain("task_projection");
      expect(authoritySnapshot(value.deck)).toEqual(before);

      const validation = runState(value.runDir, { validate: true });
      expect(validation.status, validation.stderr).toBe(0);
      expect(validation.stdout).not.toContain("task_projection");
      expect(authoritySnapshot(value.deck)).toEqual(before);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  }, 60_000);

  it("maps partial Pilot proceed only to Expansion and routes small or zero debt straight to complete review", () => {
    expect(progressiveControllerCheckpoint(progressiveInspection({
      actionId: "plan_progressive_expansion",
      latestBatch: { kind: "pilot", is_partial_pilot: true },
      progress: { total: 8, materialized: 2, unsubmitted: 6, paid_debt: ["Slide03"] },
    }))).toMatchObject({ controller_node: "plan-target-pure-expansion" });

    for (const latestBatch of [null, { kind: "pilot", is_partial_pilot: false }]) {
      expect(progressiveControllerCheckpoint(progressiveInspection({
        actionId: "prepare_progressive_raw_review",
        latestBatch,
        progress: { total: 3, materialized: 3, unsubmitted: 0, paid_debt: [] },
      }))).toMatchObject({ controller_node: "review-target-pure-raw" });
    }
  });
});
