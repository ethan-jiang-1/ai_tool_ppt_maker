import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { describe, expect, it } from "vitest";

import {
  acceptPureProgressiveRawReview,
  authorizePureProgressiveRawBatch,
  buildPureProgressiveTargetRawPlan,
  buildPureProgressiveTargetDelivery,
  generatePureProgressiveRawItem,
  planPureTargetPilot,
  preparePureProgressivePilotReview,
  preparePureProgressiveRawReview,
  resolvePureStyleMasterScope,
} from "../../ppt_maker_harness/scripts/04-pure-image/index.mjs";
import {
  acceptFramedProgressiveRawReview,
  authorizeFramedProgressiveRawBatch,
  buildFramedProgressiveTargetDelivery,
  buildFramedProgressiveTargetRawPlan,
  generateFramedProgressiveRawItem,
  planFramedTargetPilot,
  prepareFramedProgressivePilotReview,
  prepareFramedProgressiveRawReview,
  resolveFramedStyleMasterScope,
  resolveFramedTargetCandidateSource,
} from "../../ppt_maker_harness/scripts/03-framed-image/index.mjs";
import {
  initBundle,
  pageImageWorkflowPaths,
  styleAsset,
} from "../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { inspectProgressiveRawLifecycle } from "../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_raw_owner.mjs";
import { readProgressiveRawPlanDirectRecords } from "../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_store.mjs";
import {
  acceptStyleMasterCandidateReview,
  authorizeStyleMasterCandidates,
  generateStyleMasterCandidates,
  inspectStyleMasterCandidates,
  planStyleMasterCandidates,
  resolveAcceptedStyleMasterReference,
} from "../../ppt_maker_harness/scripts/shared/image2/style_master_plan.mjs";
import { styleMasterStorePaths } from "../../ppt_maker_harness/scripts/shared/image2/style_master_store.mjs";
import { acceptLocalStyleMasterFixture } from "../helpers/accepted_style_master.mjs";

const FLOW = "ppt_maker_harness/scripts/ppt_flow.mjs";

function flow(args) {
  return spawnSync(process.execPath, [FLOW, ...args], { encoding: "utf8", timeout: 30_000 });
}

function finalDiagnostic(result) {
  return JSON.parse(result.stderr.trim().split("\n").filter(Boolean).at(-1));
}

function pureSource({ speakerNote = "The fixture keeps generated facts local." } = {}) {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-image-workflow-v1
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Current reference view
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: ${speakerNote}
`;
}

function progressivePureSource(slideIds) {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-image-workflow-v1
  workflow: pure
---

${slideIds.map((slideId, index) => `## Slide ${String(index + 1).padStart(2, "0")}: \`${slideId}\`

**TITLE**: Delivery reference ${index + 1}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Delivery artifact reference ${index + 1}.
`).join("\n")}`;
}

function framedSource() {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-image-workflow-v1
  workflow: framed
---

## Slide 01: \`DeckGo\`

**TITLE**: Framed inspection only
**FRAME PRESET**: standard-v1
**SLIDE BODY**:
\`\`\`yaml
items:
  - role: callout
    literal: "A current Framed artifact view needs no provider call."
\`\`\`
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Framed delivery inspection remains source-owned.
`;
}

function progressiveFramedSource(slideIds) {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-image-workflow-v1
  workflow: framed
---

${slideIds.map((slideId, index) => `## Slide ${String(index + 1).padStart(2, "0")}: \`${slideId}\`

**TITLE**: Framed Pilot reference ${index + 1}
**FRAME PRESET**: standard-v1
**SLIDE BODY**:
\`\`\`yaml
items:
  - role: callout
    literal: "A bounded Pilot review has an explicit locator."
\`\`\`
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`).join("\n")}`;
}

describe("human artifact reference CLI", () => {
  it("rebuilds a current Pure partial view without state mutation or provider work", async () => {
    const root = mkdtempSync(join(tmpdir(), "artifact-view-cli-"));
    const deck = join(root, "deck_artifact_view");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const canvas = createCanvas(2000, 1125);
      canvas.getContext("2d").fillRect(0, 0, 2000, 1125);
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), canvas.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), pureSource());
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
      buildPureProgressiveTargetRawPlan(runDir);

      const paths = pageImageWorkflowPaths(runDir);
      const stateBefore = readFileSync(join(deck, "_state", "state.yaml"));
      const result = flow(["image2", "artifact-view", runDir]);
      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual({
        run_dir: runDir,
        workflow: "pure",
        artifact_view: paths.human_navigation_index,
        human_navigation_root: paths.human_navigation_root,
      });
      const view = readFileSync(paths.human_navigation_index, "utf8");
      expect(view).toContain("# Page Image Human Navigation");
      expect(view).toContain("local-existing");
      expect(view).toContain("provider input inspection");
      expect(view).toContain("Final media: accepted complete-page review evidence is not available");
      expect(view).not.toContain("Current reference view");
      expect(view).toMatch(/Locator: `art\/[A-Za-z0-9._~-]{1,24}`/);
      expect(view).not.toMatch(/[0-9a-f]{64}/i);
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);

      writeFileSync(paths.human_navigation_index, "manually changed\n");
      const rebuilt = flow(["image2", "artifact-view", runDir]);
      expect(rebuilt.status, rebuilt.stderr).toBe(0);
      expect(readFileSync(paths.human_navigation_index, "utf8")).toContain("# Page Image Human Navigation");
      rmSync(paths.human_navigation_index);
      const recreated = flow(["image2", "artifact-view", runDir]);
      expect(recreated.status, recreated.stderr).toBe(0);
      expect(readFileSync(paths.human_navigation_index, "utf8")).toContain("# Page Image Human Navigation");
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("projects a matching-binding pending Style Master successor before stale raw inspection and preserves failed-view bytes", async () => {
    const root = mkdtempSync(join(tmpdir(), "artifact-view-pending-successor-cli-"));
    const deck = join(root, "deck_artifact_view_pending_successor");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const canvas = createCanvas(2000, 1125);
      canvas.getContext("2d").fillRect(0, 0, 2000, 1125);
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), canvas.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), pureSource());
      const predecessor = await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
      buildPureProgressiveTargetRawPlan(runDir);

      const successor = await planStyleMasterCandidates({
        scope: resolvePureStyleMasterScope(runDir),
        candidateCount: 1,
      });
      expect(successor.plan.style_intent_sha256).toBe(predecessor.plan.plan.style_intent_sha256);
      expect(successor.plan.style_context_sha256).toBe(predecessor.plan.plan.style_context_sha256);
      expect(successor.plan.candidate_generation_profile_sha256).toBe(predecessor.plan.plan.candidate_generation_profile_sha256);
      const paths = pageImageWorkflowPaths(runDir);
      writeFileSync(join(runDir, "slide-specifications.md"), pureSource({
        speakerNote: "This non-visual literal makes the Page Image receipt stale.",
      }));
      writeFileSync(paths.target_raw_plan, "not valid progressive raw plan bytes\n", "utf8");
      const rawBefore = readFileSync(paths.target_raw_plan);
      const stateBefore = readFileSync(join(deck, "_state", "state.yaml"));
      const planPaths = styleMasterStorePaths(runDir, { plan_sha256: successor.plan_sha256 });
      const localCandidate = successor.plan.candidates.find((candidate) => candidate.candidate_id === "local-existing");
      const localPaths = styleMasterStorePaths(runDir, {
        plan_sha256: successor.plan_sha256,
        candidate_id: localCandidate.candidate_id,
        candidate_media_type: localCandidate.candidate_media_type,
      });

      const result = flow(["image2", "artifact-view", runDir]);
      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual({
        run_dir: runDir,
        workflow: "pure",
        artifact_view: paths.human_navigation_index,
        human_navigation_root: paths.human_navigation_root,
        next_action: "authorize_style_master_candidates",
      });
      const view = readFileSync(paths.human_navigation_index, "utf8");
      expect(view).toContain("Inspect this pending Style Master candidate; it is not accepted for raw work.");
      expect(view).toContain("Style Master candidate candidate-001: generated candidate lifecycle is planned; verified media is unavailable");
      expect(view).toContain("Provider input: a pending Style Master successor has no current raw plan");
      expect(view).toContain("Raw and Complete Page Review: a pending Style Master successor has no current raw plan");
      expect(view).toContain("Final media: a pending Style Master successor is not accepted for raw work");
      expect(view).toContain("Delivery: a pending Style Master successor is not accepted for delivery");
      expect(view).not.toContain("Inspect the current accepted Style Master candidate.");
      expect(view).not.toContain("current raw work plan");
      expect(readFileSync(paths.target_raw_plan)).toEqual(rawBefore);
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);
      expect(() => readFileSync(planPaths.candidate_grant)).toThrow();
      expect(() => readFileSync(styleMasterStorePaths(runDir, {
        plan_sha256: successor.plan_sha256,
        candidate_id: "candidate-001",
      }).candidate_attempt)).toThrow();

      writeFileSync(paths.human_navigation_index, "preserve this artifact view\n", "utf8");
      writeFileSync(localPaths.candidate_provenance, "corrupt pending local provenance", "utf8");
      const failedStateBefore = readFileSync(join(deck, "_state", "state.yaml"));
      const failedRawBefore = readFileSync(paths.target_raw_plan);
      const failed = flow(["image2", "artifact-view", runDir]);
      expect(failed.status).toBe(1);
      expect(finalDiagnostic(failed)).toMatchObject({
        diagnostic: {
          category: "artifact",
          operation: "target-page-image-artifact-view",
          next: { action: "inspect" },
        },
      });
      expect(finalDiagnostic(failed).diagnostic.category).not.toBe("internal");
      expect(readFileSync(paths.human_navigation_index, "utf8")).toBe("preserve this artifact view\n");
      expect(readFileSync(paths.target_raw_plan)).toEqual(failedRawBefore);
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(failedStateBefore);
      expect(() => readFileSync(planPaths.candidate_grant)).toThrow();
      expect(() => readFileSync(styleMasterStorePaths(runDir, {
        plan_sha256: successor.plan_sha256,
        candidate_id: "candidate-001",
      }).candidate_attempt)).toThrow();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("returns an exactly promoted successor to the ordinary artifact-view path", async () => {
    const root = mkdtempSync(join(tmpdir(), "artifact-view-promoted-successor-cli-"));
    const deck = join(root, "deck_artifact_view_promoted_successor");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const canvas = createCanvas(2000, 1125);
      canvas.getContext("2d").fillRect(0, 0, 2000, 1125);
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), canvas.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), pureSource());
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));

      const successor = await planStyleMasterCandidates({
        scope: resolvePureStyleMasterScope(runDir),
        candidateCount: 1,
      });
      await authorizeStyleMasterCandidates({
        scope: resolvePureStyleMasterScope(runDir),
        planSha256: successor.plan_sha256,
      });
      await generateStyleMasterCandidates({
        scope: resolvePureStyleMasterScope(runDir),
        planSha256: successor.plan_sha256,
        submit: async () => canvas.toBuffer("image/png"),
      });
      await acceptStyleMasterCandidateReview({
        scope: resolvePureStyleMasterScope(runDir),
        planSha256: successor.plan_sha256,
        decision: "proceed",
        candidateId: "candidate-001",
      });

      const paths = pageImageWorkflowPaths(runDir);
      const stateBefore = readFileSync(join(deck, "_state", "state.yaml"));
      const result = flow(["image2", "artifact-view", runDir]);
      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual({
        run_dir: runDir,
        workflow: "pure",
        artifact_view: paths.human_navigation_index,
        human_navigation_root: paths.human_navigation_root,
      });
      const view = readFileSync(paths.human_navigation_index, "utf8");
      expect(view).toContain("Inspect the current accepted Style Master candidate.");
      expect(view).not.toContain("Inspect this pending Style Master candidate");
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("lists the explicit operation in public help and hard-stops v2 before writing a view", () => {
    const root = mkdtempSync(join(tmpdir(), "artifact-view-v2-"));
    const deck = join(root, "deck_artifact_view_v2");
    const runDir = join(deck, "3_versions", "v1");
    try {
      const help = flow(["image2", "--help"]);
      expect(help.status, help.stderr).toBe(0);
      expect(help.stdout).toContain("artifact-view");
      expect(help.stdout).toContain("no provider work or state/task-projection write");

      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(runDir, "slide-specifications.md"), "---\nproduction:\n  pipeline: page-authority-image2-v2\n---\n");
      const result = flow(["image2", "artifact-view", runDir]);
      expect(result.status).toBe(1);
      expect(finalDiagnostic(result)).toMatchObject({
        diagnostic: { operation: "export-unsupported-protocol", next: { action: "export" } },
      });
      expect(pageImageWorkflowPaths(runDir).human_navigation_index).not.toBeUndefined();
      expect(() => readFileSync(pageImageWorkflowPaths(runDir).human_navigation_index)).toThrow();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rebuilds a current Framed view without initializing a provider", async () => {
    const root = mkdtempSync(join(tmpdir(), "artifact-view-framed-cli-"));
    const deck = join(root, "deck_artifact_view_framed");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const canvas = createCanvas(2000, 1125);
      canvas.getContext("2d").fillRect(0, 0, 2000, 1125);
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), canvas.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), framedSource());
      expect(() => resolveFramedTargetCandidateSource(runDir)).not.toThrow();
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));
      expect(() => resolveAcceptedStyleMasterReference({
        runDir,
        receipt: resolveFramedTargetCandidateSource(runDir).receipt,
      })).not.toThrow();
      await expect(inspectStyleMasterCandidates({
        scope: resolveFramedStyleMasterScope(runDir),
      })).resolves.toMatchObject({ selection: { candidate_id: "local-existing" } });
      expect(inspectProgressiveRawLifecycle({ runDir, workflow: "framed" })).toMatchObject({ ok: true, plan: null });
      const stateBefore = readFileSync(join(deck, "_state", "state.yaml"));

      const result = flow(["image2", "artifact-view", runDir]);
      expect(result.status, result.stderr).toBe(0);
      const view = readFileSync(pageImageWorkflowPaths(runDir).human_navigation_index, "utf8");
      expect(view).toContain("Workflow: `framed`");
      expect(view).toContain("local-existing");
      expect(view).toContain("Provider input: no current raw plan has been published");
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("lists validated current Framed review, final, and delivery artifacts", async () => {
    const root = mkdtempSync(join(tmpdir(), "artifact-view-framed-delivered-cli-"));
    const deck = join(root, "deck_artifact_view_framed_delivered");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const canvas = createCanvas(2000, 1125);
      canvas.getContext("2d").fillRect(0, 0, 2000, 1125);
      const image = canvas.toBuffer("image/png");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image);
      writeFileSync(join(runDir, "slide-specifications.md"), framedSource());
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));

      const plan = await buildFramedProgressiveTargetRawPlan(runDir);
      const planHash = plan.progressive_raw_work_plan.sha256;
      const pilot = await planFramedTargetPilot(runDir, { planHash, slideIds: ["DeckGo"] });
      await authorizeFramedProgressiveRawBatch(runDir, { planHash, batchHash: pilot.batch.batch_hash });
      await generateFramedProgressiveRawItem(runDir, { planHash, batchHash: pilot.batch.batch_hash, submit: async () => image });
      await prepareFramedProgressiveRawReview(runDir, { planHash });
      await acceptFramedProgressiveRawReview(runDir, { planHash, decision: "proceed" });
      await buildFramedProgressiveTargetDelivery(runDir);

      const stateBefore = readFileSync(join(deck, "_state", "state.yaml"));
      const result = flow(["image2", "artifact-view", runDir]);
      expect(result.status, result.stderr).toBe(0);
      const view = readFileSync(pageImageWorkflowPaths(runDir).human_navigation_index, "utf8");
      expect(view).toContain("Workflow: `framed`");
      expect(view).toContain("Framed complete page");
      expect(view).toContain("final slide");
      expect(view).toContain("delivery slide");
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 30_000);

  it("lists a current Framed Pilot review without provider initialization", async () => {
    const root = mkdtempSync(join(tmpdir(), "artifact-view-framed-pilot-cli-"));
    const deck = join(root, "deck_artifact_view_framed_pilot");
    const runDir = join(deck, "3_versions", "v1");
    const slideIds = ["DeckGo", "FlowGo", "NoteGo", "DataGo", "TeamGo", "NextGo"];
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const canvas = createCanvas(2000, 1125);
      canvas.getContext("2d").fillRect(0, 0, 2000, 1125);
      const image = canvas.toBuffer("image/png");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image);
      writeFileSync(join(runDir, "slide-specifications.md"), progressiveFramedSource(slideIds));
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));

      const plan = await buildFramedProgressiveTargetRawPlan(runDir);
      const planHash = plan.progressive_raw_work_plan.sha256;
      const pilot = await planFramedTargetPilot(runDir, { planHash, slideIds: ["DeckGo"] });
      await authorizeFramedProgressiveRawBatch(runDir, { planHash, batchHash: pilot.batch.batch_hash });
      await generateFramedProgressiveRawItem(runDir, { planHash, batchHash: pilot.batch.batch_hash, submit: async () => image });
      await prepareFramedProgressivePilotReview(runDir, { planHash, batchHash: pilot.batch.batch_hash });

      const stateBefore = readFileSync(join(deck, "_state", "state.yaml"));
      const result = flow(["image2", "artifact-view", runDir]);
      expect(result.status, result.stderr).toBe(0);
      const view = readFileSync(pageImageWorkflowPaths(runDir).human_navigation_index, "utf8");
      expect(view).toContain("Pilot provider page");
      expect(view).toContain("Framed Pilot page");
      expect(view).toContain("Pilot Page Review contact sheet");
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 30_000);

  it("lists a current Pure Pilot review without provider initialization", async () => {
    const root = mkdtempSync(join(tmpdir(), "artifact-view-pure-pilot-cli-"));
    const deck = join(root, "deck_artifact_view_pure_pilot");
    const runDir = join(deck, "3_versions", "v1");
    const slideIds = ["DeckGo", "FlowGo", "NoteGo", "DataGo", "TeamGo", "NextGo"];
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const canvas = createCanvas(2000, 1125);
      canvas.getContext("2d").fillRect(0, 0, 2000, 1125);
      const image = canvas.toBuffer("image/png");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image);
      writeFileSync(join(runDir, "slide-specifications.md"), progressivePureSource(slideIds));
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));

      const plan = buildPureProgressiveTargetRawPlan(runDir);
      const planHash = plan.progressive_raw_work_plan.sha256;
      const pilot = await planPureTargetPilot(runDir, { planHash, slideIds: ["DeckGo"] });
      await authorizePureProgressiveRawBatch(runDir, { planHash, batchHash: pilot.batch.batch_hash });
      await generatePureProgressiveRawItem(runDir, { planHash, batchHash: pilot.batch.batch_hash, submit: async () => image });
      await preparePureProgressivePilotReview(runDir, { planHash, batchHash: pilot.batch.batch_hash });

      const stateBefore = readFileSync(join(deck, "_state", "state.yaml"));
      const result = flow(["image2", "artifact-view", runDir]);
      expect(result.status, result.stderr).toBe(0);
      const view = readFileSync(pageImageWorkflowPaths(runDir).human_navigation_index, "utf8");
      expect(view).toContain("Pilot provider page");
      expect(view).toContain("Pilot Page Review contact sheet");
      expect(view).not.toContain("Framed Pilot page");
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("lists a current undecided Framed Complete Page Review without provider work or state mutation", async () => {
    const root = mkdtempSync(join(tmpdir(), "artifact-view-framed-current-review-cli-"));
    const deck = join(root, "deck_artifact_view_framed_current_review");
    const runDir = join(deck, "3_versions", "v1");
    const slideIds = ["DeckGo", "FlowGo"];
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const canvas = createCanvas(2000, 1125);
      canvas.getContext("2d").fillRect(0, 0, 2000, 1125);
      const image = canvas.toBuffer("image/png");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image);
      writeFileSync(join(runDir, "slide-specifications.md"), progressiveFramedSource(slideIds));
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));

      const plan = await buildFramedProgressiveTargetRawPlan(runDir);
      const planHash = plan.progressive_raw_work_plan.sha256;
      const batch = await planFramedTargetPilot(runDir, { planHash, slideIds });
      await authorizeFramedProgressiveRawBatch(runDir, { planHash, batchHash: batch.batch.batch_hash });
      await generateFramedProgressiveRawItem(runDir, { planHash, batchHash: batch.batch.batch_hash, submit: async () => image });
      await generateFramedProgressiveRawItem(runDir, { planHash, batchHash: batch.batch.batch_hash, submit: async () => image });
      await prepareFramedProgressiveRawReview(runDir, { planHash });

      const paths = pageImageWorkflowPaths(runDir);
      const stateBefore = readFileSync(join(deck, "_state", "state.yaml"));
      const recordsBefore = JSON.stringify(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: planHash }));
      const result = flow(["image2", "artifact-view", runDir]);
      expect(result.status, result.stderr).toBe(0);
      const view = readFileSync(paths.human_navigation_index, "utf8");
      expect(view).toContain("### `01_DeckGo`");
      expect(view).toContain("### `02_FlowGo`");
      expect(view).toContain("current provider page");
      expect(view).toContain("current Framed complete page");
      expect(view).toContain("Complete Page Review provider PNG");
      expect(view).toContain("production-equivalent complete-page PNG");
      expect(view).toContain("before the Complete Page Review decision");
      expect(view).not.toContain(paths.review_root);
      expect(view).toMatch(/Locator: `art\/[A-Za-z0-9._~-]{1,24}`/);
      expect(view).toContain("Final media: accepted complete-page review evidence is not available");
      expect(view).toContain("Delivery: a current delivery receipt has not been published");
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);
      expect(JSON.stringify(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: planHash }))).toEqual(recordsBefore);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 30_000);

  it("lists a current undecided Pure Complete Page Review and hides it after repair", async () => {
    const root = mkdtempSync(join(tmpdir(), "artifact-view-pure-current-review-cli-"));
    const deck = join(root, "deck_artifact_view_pure_current_review");
    const runDir = join(deck, "3_versions", "v1");
    const slideIds = ["DeckGo", "FlowGo"];
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const canvas = createCanvas(2048, 1136);
      canvas.getContext("2d").fillRect(0, 0, 2048, 1136);
      const image = canvas.toBuffer("image/png");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image);
      writeFileSync(join(runDir, "slide-specifications.md"), progressivePureSource(slideIds));
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));

      const plan = buildPureProgressiveTargetRawPlan(runDir);
      const planHash = plan.progressive_raw_work_plan.sha256;
      const batch = await planPureTargetPilot(runDir, { planHash, slideIds });
      await authorizePureProgressiveRawBatch(runDir, { planHash, batchHash: batch.batch.batch_hash });
      await generatePureProgressiveRawItem(runDir, { planHash, batchHash: batch.batch.batch_hash, submit: async () => image });
      await generatePureProgressiveRawItem(runDir, { planHash, batchHash: batch.batch.batch_hash, submit: async () => image });
      await preparePureProgressiveRawReview(runDir, { planHash });

      const paths = pageImageWorkflowPaths(runDir);
      const stateBefore = readFileSync(join(deck, "_state", "state.yaml"));
      const recordsBefore = JSON.stringify(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: planHash }));
      const result = flow(["image2", "artifact-view", runDir]);
      expect(result.status, result.stderr).toBe(0);
      const view = readFileSync(paths.human_navigation_index, "utf8");
      expect(view).toContain("### `01_DeckGo`");
      expect(view).toContain("### `02_FlowGo`");
      expect(view.indexOf("### `01_DeckGo`")).toBeLessThan(view.indexOf("### `02_FlowGo`"));
      expect(view).toContain("current provider page");
      expect(view).not.toContain("current Framed complete page");
      expect(view).toContain("Complete Page Review contact sheet");
      expect(view).not.toContain(paths.review_root);
      expect(view).toMatch(/Locator: `art\/[A-Za-z0-9._~-]{1,24}`/);
      expect(view).toContain("Final media: accepted complete-page review evidence is not available");
      expect(view).toContain("Delivery: a current delivery receipt has not been published");
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);
      expect(JSON.stringify(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: planHash }))).toEqual(recordsBefore);

      await acceptPureProgressiveRawReview(runDir, { planHash, decision: "repair" });
      const repairedStateBefore = readFileSync(join(deck, "_state", "state.yaml"));
      const repairedRecordsBefore = JSON.stringify(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: planHash }));
      const repaired = flow(["image2", "artifact-view", runDir]);
      expect(repaired.status, repaired.stderr).toBe(0);
      const repairedView = readFileSync(paths.human_navigation_index, "utf8");
      expect(repairedView).not.toContain("current provider page");
      expect(repairedView).toContain("Complete Page Review: no current undecided or accepted complete-page review evidence is available");
      expect(repairedView).toContain("Final media: accepted complete-page review evidence is not available");
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(repairedStateBefore);
      expect(JSON.stringify(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: planHash }))).toEqual(repairedRecordsBefore);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("lists validated current Pure review, final, and delivery artifacts in stable page order", async () => {
    const root = mkdtempSync(join(tmpdir(), "artifact-view-delivered-cli-"));
    const deck = join(root, "deck_artifact_view_delivered");
    const runDir = join(deck, "3_versions", "v1");
    const slideIds = ["DeckGo", "FlowGo"];
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const canvas = createCanvas(2048, 1136);
      canvas.getContext("2d").fillRect(0, 0, 2048, 1136);
      const image = canvas.toBuffer("image/png");
      const alternateCanvas = createCanvas(2048, 1136);
      const alternateContext = alternateCanvas.getContext("2d");
      alternateContext.fillStyle = "#c23b22";
      alternateContext.fillRect(0, 0, 2048, 1136);
      const alternateImage = alternateCanvas.toBuffer("image/png");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image);
      writeFileSync(join(runDir, "slide-specifications.md"), progressivePureSource(slideIds));
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));

      const plan = buildPureProgressiveTargetRawPlan(runDir);
      const planHash = plan.progressive_raw_work_plan.sha256;
      const pilot = await planPureTargetPilot(runDir, { planHash, slideIds });
      await authorizePureProgressiveRawBatch(runDir, { planHash, batchHash: pilot.batch.batch_hash });
      const generatedImages = [image, alternateImage];
      const submit = async () => generatedImages.shift();
      await generatePureProgressiveRawItem(runDir, { planHash, batchHash: pilot.batch.batch_hash, submit });
      await generatePureProgressiveRawItem(runDir, { planHash, batchHash: pilot.batch.batch_hash, submit });
      await preparePureProgressiveRawReview(runDir, { planHash });
      await acceptPureProgressiveRawReview(runDir, { planHash, decision: "proceed" });
      await buildPureProgressiveTargetDelivery(runDir);

      const paths = pageImageWorkflowPaths(runDir);
      const stateBefore = readFileSync(join(deck, "_state", "state.yaml"));
      const result = flow(["image2", "artifact-view", runDir]);
      expect(result.status, result.stderr).toBe(0);
      const view = readFileSync(pageImageWorkflowPaths(runDir).human_navigation_index, "utf8");
      expect(view).toContain("### `01_DeckGo`");
      expect(view).toContain("### `02_FlowGo`");
      expect(view.indexOf("### `01_DeckGo`")).toBeLessThan(view.indexOf("### `02_FlowGo`"));
      expect(view).toContain("provider page");
      expect(view).toContain("final slide");
      expect(view).toContain("delivery slide");
      expect(view).toContain("delivered PPTX");
      expect(view).toContain("notes receipt");
      expect(view).toContain("delivery receipt");
      expect(view).not.toContain("Delivery reference 1");
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);

      const finalManifest = JSON.parse(readFileSync(paths.target_final_manifest, "utf8"));
      writeFileSync(
        join(paths.final_root, finalManifest.items[0].path),
        readFileSync(join(paths.final_root, finalManifest.items[1].path)),
      );
      const rejected = flow(["image2", "artifact-view", runDir]);
      expect(rejected.status).toBe(1);
      expect(readFileSync(paths.human_navigation_index, "utf8")).toBe(view);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
