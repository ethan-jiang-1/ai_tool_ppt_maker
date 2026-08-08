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
import { initBundle, pageImageWorkflowPaths } from "../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { inspectProgressiveRawLifecycle } from "../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_raw_owner.mjs";
import {
  inspectStyleMasterCandidates,
  resolveAcceptedStyleMasterReference,
} from "../../ppt_maker_harness/scripts/shared/image2/style_master_plan.mjs";
import { acceptLocalStyleMasterFixture } from "../helpers/accepted_style_master.mjs";

const FLOW = "ppt_maker_harness/scripts/ppt_flow.mjs";

function flow(args) {
  return spawnSync(process.execPath, [FLOW, ...args], { encoding: "utf8", timeout: 30_000 });
}

function finalDiagnostic(result) {
  return JSON.parse(result.stderr.trim().split("\n").filter(Boolean).at(-1));
}

function pureSource() {
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

> **SPEAKER NOTE**: The fixture keeps generated facts local.
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
        artifact_view: paths.human_artifact_reference,
      });
      const view = readFileSync(paths.human_artifact_reference, "utf8");
      expect(view).toContain("# Page Image Human Artifact Reference");
      expect(view).toContain("local-existing");
      expect(view).toContain("provider input inspection");
      expect(view).toContain("Final media: accepted complete-page review evidence is not available");
      expect(view).not.toContain("Current reference view");
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);

      writeFileSync(paths.human_artifact_reference, "manually changed\n");
      const rebuilt = flow(["image2", "artifact-view", runDir]);
      expect(rebuilt.status, rebuilt.stderr).toBe(0);
      expect(readFileSync(paths.human_artifact_reference, "utf8")).toContain("# Page Image Human Artifact Reference");
      rmSync(paths.human_artifact_reference);
      const recreated = flow(["image2", "artifact-view", runDir]);
      expect(recreated.status, recreated.stderr).toBe(0);
      expect(readFileSync(paths.human_artifact_reference, "utf8")).toContain("# Page Image Human Artifact Reference");
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
      expect(pageImageWorkflowPaths(runDir).human_artifact_reference).not.toBeUndefined();
      expect(() => readFileSync(pageImageWorkflowPaths(runDir).human_artifact_reference)).toThrow();
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
      const view = readFileSync(pageImageWorkflowPaths(runDir).human_artifact_reference, "utf8");
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
      const view = readFileSync(pageImageWorkflowPaths(runDir).human_artifact_reference, "utf8");
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
      const view = readFileSync(pageImageWorkflowPaths(runDir).human_artifact_reference, "utf8");
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
      const view = readFileSync(pageImageWorkflowPaths(runDir).human_artifact_reference, "utf8");
      expect(view).toContain("Pilot provider page");
      expect(view).toContain("Pilot Page Review contact sheet");
      expect(view).not.toContain("Framed Pilot page");
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);
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
      const view = readFileSync(pageImageWorkflowPaths(runDir).human_artifact_reference, "utf8");
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
      expect(readFileSync(paths.human_artifact_reference, "utf8")).toBe(view);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
