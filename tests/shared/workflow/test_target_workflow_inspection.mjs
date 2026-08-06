import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createCanvas } from "@napi-rs/canvas";

import { initBundle } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  buildPureProgressiveTargetRawPlan,
  resolvePureStyleMasterScope,
} from "../../../ppt_maker_harness/scripts/04-pure-image/index.mjs";
import {
  progressiveRawStorePaths,
  readProgressiveRawPlanDirectRecords,
  writeProgressiveRawItemAttempt,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_authority_progressive_store.mjs";
import { createProgressiveRawItemAttempt } from "../../../ppt_maker_harness/scripts/shared/image2/page_authority_progressive_schema.mjs";
import {
  createInitialState,
  initializeTargetPageAuthorityState,
  writeState,
} from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";
import {
  inspectWorkflow,
  isWorkflowInspectionSourceReady,
} from "../../../ppt_maker_harness/scripts/shared/workflow/inspect_workflow.mjs";
import {
  authorizeProgressiveRawBatch,
  generateProgressiveRawItem,
  planProgressiveRawPilot,
  reconcileProgressiveRawAttempt,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_authority_progressive_raw_owner.mjs";
import { acceptLocalStyleMasterFixture } from "../../helpers/accepted_style_master.mjs";

const PROGRESSIVE_SLIDE_IDS = ["DeckGo", "SysMap", "FlowGo", "TeamGo", "RiskGo", "ValMap"];

function treeSnapshot(root, current = root, entries = []) {
  for (const name of readdirSync(current).sort()) {
    const path = join(current, name);
    const relative = path.slice(root.length + 1);
    if (statSync(path).isDirectory()) treeSnapshot(root, path, entries);
    else entries.push(`${relative}:${readFileSync(path).toString("base64")}`);
  }
  return entries;
}

function fixture(workflow = "pure") {
  const root = mkdtempSync(join(tmpdir(), "workflow-inspect-target-"));
  const deck = join(root, "deck_target_page_authority");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  const source = `---\nproduction:\n  pipeline: page-authority-image2-v2\n  workflow: ${workflow}\n---\n\n## Slide 01: \`DeckGo\`\n\n**TITLE**: Target prerequisite\n`;
  writeFileSync(join(runDir, "slide-specifications.md"), source);
  const state = createInitialState("target", "keynote", "dark-executive", {
    mode: "image2-page-authority-v2",
    workflow,
  });
  state.continuation_target_version = "v1";
  writeState(deck, state);
  initializeTargetPageAuthorityState(deck, {
    runVersion: "v1",
    sourceReceipt: {
      schema: "page-authority-image2-source-v2",
      pipeline: "page-authority-image2-v2",
      workflow,
      source_sha256: createHash("sha256").update(source).digest("hex"),
      slides: [{ slide_id: "DeckGo", workflow }],
    },
  });
  return { root, deck, runDir };
}

function progressivePureSource(slideCount) {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---
${PROGRESSIVE_SLIDE_IDS.slice(0, slideCount).map((slideId, index) => `
## Slide ${String(index + 1).padStart(2, "0")}: \`${slideId}\`

**TITLE**: Inspection direct-record fixture ${index + 1}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Workflow inspection reads only owner facts.
`).join("")}`;
}

async function progressivePureFixture(slideCount = 1) {
  const root = mkdtempSync(join(tmpdir(), "workflow-inspect-progressive-pure-"));
  const deck = join(root, "deck_workflow_inspect_progressive_pure");
  const runDir = join(deck, "3_versions", "v1");
  const image = createCanvas(2000, 1125);
  image.getContext("2d").fillRect(0, 0, 2000, 1125);
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
  writeFileSync(join(runDir, "slide-specifications.md"), progressivePureSource(slideCount));
  await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
  const plan = buildPureProgressiveTargetRawPlan(runDir);
  return { root, deck, runDir, plan };
}

function appendUnknownTerminalSibling(runDir, { plan_hash, batch_hash }) {
  const direct = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan_hash });
  const submitted = direct.attempts.find((entry) =>
    entry.record.batch_sha256 === batch_hash && entry.record.status === "submitted",
  );
  const batch = direct.batches.find((entry) => entry.sha256 === batch_hash);
  const grant = direct.grants.find((entry) => entry.sha256 === submitted?.record.grant_sha256);
  const attempt = createProgressiveRawItemAttempt({
    ...submitted.record,
    status: "unknown",
    previous_attempt_sha256: submitted.sha256,
  }, { plan: direct.plan.record, batch: batch.record, grant: grant.record });
  writeProgressiveRawItemAttempt(runDir, {
    plan: direct.plan.record,
    batch: batch.record,
    grant: grant.record,
    attempt,
  });
}

describe("TARGET workflow inspection", () => {
  it("hard-stops an unsupported source without reading or creating workflow artifacts", () => {
    const root = mkdtempSync(join(tmpdir(), "workflow-inspect-unsupported-"));
    const deck = join(root, "deck_unsupported_page_authority");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(runDir, "slide-specifications.md"), `---
production:
  pipeline: unsupported-protocol-v0
---

## Slide 01: \`PastGo\`

**TITLE**: Unsupported
`);
      const before = treeSnapshot(deck);
      const inspection = inspectWorkflow({ runDir });
      expect(inspection).toMatchObject({
        posture: "hard-stop",
        root_cause: { owner: "production-protocol", kind: "unsupported-protocol" },
        primary_action: { action_id: "export-unsupported-protocol", kind: "export", requires_human: false },
      });
      expect(isWorkflowInspectionSourceReady(inspection)).toBe(false);
      expect(treeSnapshot(deck)).toEqual(before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("projects a fresh v2 bundle as a workflow-choice confirm without writes", () => {
    const root = mkdtempSync(join(tmpdir(), "workflow-inspect-target-draft-"));
    const deck = join(root, "deck_target_page_authority");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const before = treeSnapshot(deck);
      const inspection = inspectWorkflow({ runDir });
      expect(inspection).toMatchObject({
        posture: "confirm",
        root_cause: { owner: "01-content", kind: "TARGET_WORKFLOW_SELECTION_REQUIRED" },
        primary_action: { action_id: "select-target-page-authority-workflow", requires_human: true },
        evidence_summary: { pipeline: "page-authority-image2-v2", mode: null, workflow: null },
      });
      expect(isWorkflowInspectionSourceReady(inspection)).toBe(false);
      expect(treeSnapshot(deck)).toEqual(before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("fails closed on a selected workflow source that cannot establish progressive planning prerequisites", () => {
    const value = fixture();
    try {
      const before = treeSnapshot(value.deck);
      const inspection = inspectWorkflow({ runDir: value.runDir });
      expect(inspection).toMatchObject({
        posture: "hard-stop",
        root_cause: { owner: "selected-workflow-adapter", kind: "source-or-style-preflight-invalid" },
        primary_action: { owner: "04-pure-image", action_id: "repair-progressive-source-binding", requires_human: false },
        evidence_summary: { mode: "image2-page-authority-v2", workflow: "pure" },
      });
      expect(isWorkflowInspectionSourceReady(inspection)).toBe(true);
      expect(treeSnapshot(value.deck)).toEqual(before);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("reports a marker/state workflow mismatch without healing it", () => {
    const value = fixture();
    try {
      const path = join(value.deck, "_state", "state.yaml");
      const state = createInitialState("target", "keynote", "dark-executive", {
        mode: "image2-page-authority-v2",
        workflow: "framed",
      });
      state.continuation_target_version = "v1";
      writeState(value.deck, state);
      const before = readFileSync(path);
      const inspection = inspectWorkflow({ runDir: value.runDir });
      expect(inspection).toMatchObject({
        posture: "hard-stop",
        root_cause: { owner: "production-mode", kind: "MODE_SOURCE_IDENTITY_MISMATCH" },
        primary_action: { action_id: "repair-current-route" },
      });
      expect(isWorkflowInspectionSourceReady(inspection)).toBe(false);
      expect(readFileSync(path)).toEqual(before);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("reconstructs progressive inspection from direct records after generated projections are removed", async () => {
    const value = await progressivePureFixture();
    try {
      rmSync(join(value.runDir, "_generated"), { recursive: true, force: true });
      const before = treeSnapshot(value.deck);
      const inspection = inspectWorkflow({ runDir: value.runDir });
      expect(inspection).toMatchObject({
        posture: "confirm",
        root_cause: { owner: "progressive-raw-owner", kind: "plan_progressive_pilot" },
        primary_action: { owner: "progressive-raw-owner", action_id: "plan_progressive_pilot", requires_human: true },
        evidence_summary: {
          progressive: "current",
          plan_hash: value.plan.progressive_raw_work_plan.sha256,
          progress: { materialized: 0, unsubmitted: 1 },
        },
      });
      expect(treeSnapshot(value.deck)).toEqual(before);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("returns successor Pilot planning for a terminal partial Pilot with missing coverage without writes", async () => {
    const value = await progressivePureFixture(6);
    try {
      const planHash = value.plan.progressive_raw_work_plan.sha256;
      const pilot = await planProgressiveRawPilot({
        runDir: value.runDir,
        workflow: "pure",
        plan_hash: planHash,
        slide_ids: ["DeckGo"],
      });
      await authorizeProgressiveRawBatch({
        runDir: value.runDir,
        workflow: "pure",
        plan_hash: planHash,
        batch_hash: pilot.batch.batch_hash,
      });
      await generateProgressiveRawItem({
        runDir: value.runDir,
        workflow: "pure",
        plan_hash: planHash,
        batch_hash: pilot.batch.batch_hash,
        provider_requests_by_slide: { DeckGo: { schema: "fixture-request-v1" } },
        submit: async () => ({ outcome: "known_failure" }),
      });

      const before = treeSnapshot(value.deck);
      const inspection = inspectWorkflow({ runDir: value.runDir });
      expect(inspection).toMatchObject({
        posture: "confirm",
        root_cause: { owner: "progressive-raw-owner", kind: "plan_progressive_pilot" },
        primary_action: { owner: "progressive-raw-owner", action_id: "plan_progressive_pilot", kind: "confirm", requires_human: true },
        evidence_summary: {
          progressive: "current",
          plan_hash: planHash,
          progress: { materialized: 0, known_failure: 1 },
        },
      });
      expect(treeSnapshot(value.deck)).toEqual(before);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("projects a successor submitted attempt as exact reconciliation without writes", async () => {
    const value = await progressivePureFixture(6);
    try {
      const planHash = value.plan.progressive_raw_work_plan.sha256;
      const predecessor = await planProgressiveRawPilot({
        runDir: value.runDir,
        workflow: "pure",
        plan_hash: planHash,
        slide_ids: ["DeckGo"],
      });
      await authorizeProgressiveRawBatch({
        runDir: value.runDir,
        workflow: "pure",
        plan_hash: planHash,
        batch_hash: predecessor.batch.batch_hash,
      });
      await expect(generateProgressiveRawItem({
        runDir: value.runDir,
        workflow: "pure",
        plan_hash: planHash,
        batch_hash: predecessor.batch.batch_hash,
        provider_requests_by_slide: { DeckGo: { schema: "fixture-request-v1" } },
        submit: async () => { throw new Error("predecessor transport interrupted"); },
      })).rejects.toMatchObject({ code: "progressive_raw_provider_outcome_unresolved" });
      const predecessorAttempt = readProgressiveRawPlanDirectRecords(value.runDir, { plan_sha256: planHash }).attempts
        .find((entry) => entry.record.batch_sha256 === predecessor.batch.batch_hash && entry.record.status === "submitted");
      await reconcileProgressiveRawAttempt({
        runDir: value.runDir,
        workflow: "pure",
        plan_hash: planHash,
        attempt_sha256: predecessorAttempt.sha256,
        lookup: async () => null,
      });

      const successor = await planProgressiveRawPilot({
        runDir: value.runDir,
        workflow: "pure",
        plan_hash: planHash,
        slide_ids: ["DeckGo"],
      });
      await authorizeProgressiveRawBatch({
        runDir: value.runDir,
        workflow: "pure",
        plan_hash: planHash,
        batch_hash: successor.batch.batch_hash,
      });
      const successorSubmit = vi.fn(async () => { throw new Error("successor transport interrupted"); });
      await expect(generateProgressiveRawItem({
        runDir: value.runDir,
        workflow: "pure",
        plan_hash: planHash,
        batch_hash: successor.batch.batch_hash,
        provider_requests_by_slide: { DeckGo: { schema: "fixture-request-v1" } },
        submit: successorSubmit,
      })).rejects.toMatchObject({ code: "progressive_raw_provider_outcome_unresolved" });

      const submitted = readProgressiveRawPlanDirectRecords(value.runDir, { plan_sha256: planHash }).attempts
        .find((entry) => entry.record.batch_sha256 === successor.batch.batch_hash && entry.record.status === "submitted");
      const before = treeSnapshot(value.deck);
      const inspection = inspectWorkflow({ runDir: value.runDir });
      expect(inspection).toMatchObject({
        posture: "hard-stop",
        root_cause: { owner: "progressive-raw-owner", kind: "submitted-outcome-unresolved" },
        primary_action: {
          owner: "progressive-raw-owner",
          action_id: "reconcile_progressive_raw_attempt",
          kind: "repair",
          attempt_sha256: submitted.sha256,
        },
        evidence_summary: {
          progressive: "reconciliation-required",
          progress: { materialized: 0, submitted: 1 },
        },
      });
      expect(successorSubmit).toHaveBeenCalledTimes(1);
      expect(treeSnapshot(value.deck)).toEqual(before);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("projects the accepted redundant terminal pair as the newer exact reconciliation without writes", async () => {
    const value = await progressivePureFixture(6);
    try {
      const planHash = value.plan.progressive_raw_work_plan.sha256;
      const predecessor = await planProgressiveRawPilot({
        runDir: value.runDir,
        workflow: "pure",
        plan_hash: planHash,
        slide_ids: ["DeckGo"],
      });
      await authorizeProgressiveRawBatch({
        runDir: value.runDir,
        workflow: "pure",
        plan_hash: planHash,
        batch_hash: predecessor.batch.batch_hash,
      });
      const predecessorSubmit = vi.fn(async () => ({ outcome: "known_failure" }));
      await generateProgressiveRawItem({
        runDir: value.runDir,
        workflow: "pure",
        plan_hash: planHash,
        batch_hash: predecessor.batch.batch_hash,
        provider_requests_by_slide: { DeckGo: { schema: "fixture-request-v1" } },
        submit: predecessorSubmit,
      });

      const successor = await planProgressiveRawPilot({
        runDir: value.runDir,
        workflow: "pure",
        plan_hash: planHash,
        slide_ids: ["SysMap"],
      });
      await authorizeProgressiveRawBatch({
        runDir: value.runDir,
        workflow: "pure",
        plan_hash: planHash,
        batch_hash: successor.batch.batch_hash,
      });
      const successorSubmit = vi.fn(async () => { throw new Error("successor transport interrupted"); });
      await expect(generateProgressiveRawItem({
        runDir: value.runDir,
        workflow: "pure",
        plan_hash: planHash,
        batch_hash: successor.batch.batch_hash,
        provider_requests_by_slide: { SysMap: { schema: "fixture-request-v1" } },
        submit: successorSubmit,
      })).rejects.toMatchObject({ code: "progressive_raw_provider_outcome_unresolved" });
      const successorAttempt = readProgressiveRawPlanDirectRecords(value.runDir, { plan_sha256: planHash }).attempts
        .find((entry) => entry.record.batch_sha256 === successor.batch.batch_hash && entry.record.status === "submitted");
      appendUnknownTerminalSibling(value.runDir, {
        plan_hash: planHash,
        batch_hash: predecessor.batch.batch_hash,
      });

      const before = treeSnapshot(value.deck);
      const inspection = inspectWorkflow({ runDir: value.runDir });
      expect(inspection).toMatchObject({
        posture: "hard-stop",
        root_cause: { owner: "progressive-raw-owner", kind: "submitted-outcome-unresolved" },
        primary_action: {
          owner: "progressive-raw-owner",
          action_id: "reconcile_progressive_raw_attempt",
          attempt_sha256: successorAttempt.sha256,
        },
        evidence_summary: {
          progressive: "reconciliation-required",
          progress: { known_failure: 1, submitted: 1, unsubmitted: 4 },
        },
      });
      expect(treeSnapshot(value.deck)).toEqual(before);
      expect(predecessorSubmit).toHaveBeenCalledTimes(1);
      expect(successorSubmit).toHaveBeenCalledTimes(1);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("fails closed on a malformed direct raw-owner record without reconstructing progress", async () => {
    const value = await progressivePureFixture();
    try {
      const scope = progressiveRawStorePaths(value.runDir, { workflow: "pure" });
      writeFileSync(scope.scope_head, "{not canonical JSON}\n");
      const before = treeSnapshot(value.deck);
      const inspection = inspectWorkflow({ runDir: value.runDir });
      expect(inspection).toMatchObject({
        posture: "hard-stop",
        root_cause: { owner: "progressive-raw-owner", kind: expect.stringMatching(/^progressive_raw_/) },
        primary_action: { owner: "progressive-raw-owner", kind: "repair" },
      });
      expect(treeSnapshot(value.deck)).toEqual(before);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});
