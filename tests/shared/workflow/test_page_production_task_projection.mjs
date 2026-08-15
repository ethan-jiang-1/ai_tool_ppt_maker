import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createCanvas } from "@napi-rs/canvas";

import { initBundle } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  buildPureProgressiveTargetRawPlan,
  resolvePureStyleMasterScope,
} from "../../../ppt_maker_harness/scripts/04-pure-image/index.mjs";
import { readState, writeState } from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";
import { inspectWorkflow } from "../../../ppt_maker_harness/scripts/shared/workflow/inspect_workflow.mjs";
import {
  pageProductionTaskProjectionPath,
  progressiveControllerCheckpoint,
  refreshPageProductionTaskProjection,
  renderPageProductionTaskProjection,
} from "../../../ppt_maker_harness/scripts/shared/workflow/page_production_task_projection.mjs";
import {
  createPageProductionDisplayReferenceIndex,
} from "../../../ppt_maker_harness/scripts/shared/workflow/page_production_display_references.mjs";
import { progressiveControllerTaskProjectionEligibility } from "../../../ppt_maker_harness/scripts/shared/workflow/progressive_controller_task_projection_eligibility.mjs";
import { acceptLocalStyleMasterFixture } from "../../helpers/accepted_style_master.mjs";

const PPT_FLOW = resolve(process.cwd(), "ppt_maker_harness/scripts/ppt_flow.mjs");

function progressiveInspection({ actionId, latestBatch = null, progress = null } = {}) {
  return {
    evidence_summary: {
      pipeline: "page-image-workflow",
      workflow: "pure",
      source_epoch: 1,
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

function digest(letter) {
  return letter.repeat(64);
}

function taskProjectionPayload({ note = null } = {}) {
  return {
    schema: "page-production-task-projection",
    run_version: "v1",
    workflow: "pure",
    controller: { current_node: "review-target-pure-pilot", checkpoint_node: "review-target-pure-pilot" },
    next_action: { owner: "progressive-raw-owner", action_id: "prepare_progressive_pilot_review", kind: "confirm", requires_human: true },
    references: [
      { label: "raw_work_plan", sha256: digest("a") },
      { label: "current_batch", sha256: digest("b") },
      { label: "pilot_evidence", sha256: digest("c") },
      { label: "partial_pilot_decision", sha256: digest("d") },
      { label: "complete_raw_review", sha256: digest("e") },
      { label: "accepted_raw_evidence", sha256: digest("f") },
      { label: "final_manifest", sha256: digest("0") },
      { label: "delivery_receipt", sha256: digest("1") },
    ],
    progress: { total: 1, materialized: 0, unsubmitted: 1, paid_debt_slide_ids: [] },
    human_handoffs: {
      partial_pilot: { decision: "proceed", reference_sha256: digest("2"), ...(note ? { note } : {}) },
      complete_raw_review: { decision: "proceed", reference_sha256: digest("3") },
      delivery: { decision: "proceed", reference_sha256: digest("4") },
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
  writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.png"), image.toBuffer("image/png"));
  writeFileSync(join(runDir, "slide-specifications.md"), `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
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
  it("formats only valid typed card-scoped display references", () => {
    const entries = [
      { kind: "plan", sha256: digest("a") },
      { kind: "batch", sha256: digest("b") },
      { kind: "evidence", sha256: digest("c") },
      { kind: "review", sha256: digest("d") },
      { kind: "manifest", sha256: digest("e") },
      { kind: "delivery", sha256: digest("f") },
      { kind: "plan", sha256: digest("a") },
    ];
    const index = createPageProductionDisplayReferenceIndex(entries);

    expect(index.describe("plan", digest("a"))).toBe("p-aaaaaaaa");
    expect(index.describe("batch", digest("b"))).toBe("b-bbbbbbbb");
    expect(index.describe("evidence", digest("c"))).toBe("e-cccccccc");
    expect(index.describe("review", digest("d"))).toBe("r-dddddddd");
    expect(index.describe("manifest", digest("e"))).toBe("m-eeeeeeee");
    expect(index.describe("delivery", digest("f"))).toBe("d-ffffffff");
    expect(() => createPageProductionDisplayReferenceIndex([{ kind: "unknown", sha256: digest("a") }]))
      .toThrow("PAGE_PRODUCTION_DISPLAY_REFERENCE_KIND_INVALID");
    expect(() => createPageProductionDisplayReferenceIndex([{ kind: "plan", sha256: digest("A") }]))
      .toThrow("PAGE_PRODUCTION_DISPLAY_REFERENCE_DIGEST_INVALID");
    expect(() => createPageProductionDisplayReferenceIndex([{ kind: "plan", sha256: { toString: () => digest("a") } }]))
      .toThrow("PAGE_PRODUCTION_DISPLAY_REFERENCE_DIGEST_INVALID");
    expect(() => index.describe("plan", digest("b"))).toThrow("PAGE_PRODUCTION_DISPLAY_REFERENCE_UNKNOWN");
  });

  it("ranks same-type collisions lexically without expanding their digest", () => {
    const sharedPrefix = "671d4555";
    const first = `${sharedPrefix}${"0".repeat(56)}`;
    const second = `${sharedPrefix}${"f".repeat(56)}`;
    const nearCompleteFirst = `${"a".repeat(63)}b`;
    const nearCompleteSecond = `${"a".repeat(63)}c`;
    const forward = createPageProductionDisplayReferenceIndex([
      { kind: "plan", sha256: second },
      { kind: "plan", sha256: first },
      { kind: "review", sha256: first },
      { kind: "plan", sha256: nearCompleteSecond },
      { kind: "plan", sha256: nearCompleteFirst },
    ]);
    const reversed = createPageProductionDisplayReferenceIndex([
      { kind: "plan", sha256: nearCompleteFirst },
      { kind: "plan", sha256: nearCompleteSecond },
      { kind: "review", sha256: first },
      { kind: "plan", sha256: first },
      { kind: "plan", sha256: second },
    ]);

    expect(forward.describe("plan", first)).toBe("p-671d4555~1");
    expect(forward.describe("plan", second)).toBe("p-671d4555~2");
    expect(forward.describe("review", first)).toBe("r-671d4555");
    expect(forward.describe("plan", nearCompleteFirst)).toBe("p-aaaaaaaa~1");
    expect(forward.describe("plan", nearCompleteSecond)).toBe("p-aaaaaaaa~2");
    expect(forward.describe("plan", nearCompleteFirst)).not.toContain(nearCompleteFirst);
    expect(reversed.describe("plan", first)).toBe(forward.describe("plan", first));
    expect(reversed.describe("plan", nearCompleteSecond)).toBe(forward.describe("plan", nearCompleteSecond));
  });

  it("formats typed display references without creating an abbreviated control selector", () => {
    const index = createPageProductionDisplayReferenceIndex([{ kind: "style", sha256: digest("a") }]);

    expect(index.describe("style", digest("a"))).toBe("s-aaaaaaaa");
    expect(Object.getOwnPropertyNames(index).sort()).toEqual(["describe"]);
    expect(() => index.describe("s-aaaaaaaa", digest("a"))).toThrow("PAGE_PRODUCTION_DISPLAY_REFERENCE_KIND_INVALID");
  });

  it("renders every structured reference as display-only text and redacts notes without mutating the payload", () => {
    const noteDigest = "A".repeat(64);
    const payload = taskProjectionPayload({ note: `Preserve this ${noteDigest} note in state.` });
    const before = structuredClone(payload);
    const card = renderPageProductionTaskProjection(payload);

    for (const [prefix, letter] of [["p", "a"], ["b", "b"], ["e", "c"], ["r", "d"], ["r", "e"], ["e", "f"], ["m", "0"], ["d", "1"], ["r", "2"], ["r", "3"], ["d", "4"]]) {
      expect(card).toContain(`${prefix}-${letter.repeat(8)}`);
    }
    for (const value of [...payload.references.map((entry) => entry.sha256), ...Object.values(payload.human_handoffs).map((handoff) => handoff.reference_sha256)]) {
      expect(card).not.toContain(value);
    }
    expect(card).not.toContain(noteDigest);
    expect(card).toContain("[digest redacted]");
    expect(card).not.toContain("sha256:");
    expect(payload).toEqual(before);
  });

  it("redacts a complete digest from any rendered card text without changing its payload", () => {
    const payload = taskProjectionPayload();
    const completeDigest = digest("a");
    payload.next_action = { ...payload.next_action, action_id: `inspect-${completeDigest}` };
    payload.human_handoffs.partial_pilot.reference_sha256 = null;
    const before = structuredClone(payload);

    const card = renderPageProductionTaskProjection(payload);

    expect(card).not.toContain(completeDigest);
    expect(card).toContain("[digest redacted]");
    expect(payload).toEqual(before);
  });

  it("rebuilds missing and manually edited cards only from current owner inspection", async () => {
    const value = await fixture();
    try {
      const inspection = inspectWorkflow({ runDir: value.runDir });
      expect(inspection.primary_action).toMatchObject({ action_id: "plan_progressive_pilot" });
      const path = pageProductionTaskProjectionPath(value.runDir);
      const first = refreshPageProductionTaskProjection({ runDir: value.runDir, inspection });
      expect(first.status).toBe("created");
      expect(first.projection.references[0].sha256).toBe(value.plan.progressive_raw_work_plan.sha256);
      expect(readFileSync(path, "utf8")).toContain(`p-${value.plan.progressive_raw_work_plan.sha256.slice(0, 8)}`);
      expect(readFileSync(path, "utf8")).not.toContain(value.plan.progressive_raw_work_plan.sha256);
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

  it("keeps full owner facts and Controller notes outside the display-only card", async () => {
    const value = await fixture();
    try {
      const noteDigest = "A".repeat(64);
      const note = `Keep ${noteDigest} in the Controller record.`;
      const state = readState(value.deck, { purpose: "observe", runDir: value.runDir });
      state.nodes["review-target-pure-pilot"] = {
        status: "in_progress",
        execution_id: state.execution_id,
        run_version: state.run_version,
        decision: { value: "proceed", kind: "user", at: "2026-08-06T00:00:00.000Z", note },
      };
      writeState(value.deck, state);

      const stateResult = runState(value.runDir, { json: true });
      expect(stateResult.status, stateResult.stderr).toBe(0);
      const report = JSON.parse(stateResult.stdout);
      expect(report.workflow_inspection.evidence_summary.plan_hash).toBe(value.plan.progressive_raw_work_plan.sha256);
      const card = readFileSync(pageProductionTaskProjectionPath(value.runDir), "utf8");
      expect(card).toContain(`p-${value.plan.progressive_raw_work_plan.sha256.slice(0, 8)}`);
      expect(card).not.toContain(value.plan.progressive_raw_work_plan.sha256);
      expect(card).toContain("[digest redacted]");
      expect(card).not.toContain(noteDigest);

      const persisted = readState(value.deck, { purpose: "observe", runDir: value.runDir });
      expect(persisted.nodes["review-target-pure-pilot"].decision.note).toBe(note);
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
