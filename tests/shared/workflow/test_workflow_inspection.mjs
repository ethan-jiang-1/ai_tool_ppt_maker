import { describe, expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";

import { createHtmlFirstRun } from "../../helpers/html_first_fixture.mjs";
import { createCurrentHtmlDelivery } from "../../helpers/image2_refinement_fixture.mjs";
import { initBundle } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { loadRefinementOperations, transitionAttempt } from "../../../PPTMAKER_FRAMEWORK/scripts/04-image-production/visual-slot/index.mjs";
import { inspectHtmlReviewReadiness, publishHtmlDeliveryDecision, publishHtmlGateDecision } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs";
import { readImage2RefinementState, readState, recordImage2DeliveryReview, transitionProductionMode, writeImage2RefinementState, writeState } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import {
  WORKFLOW_INSPECTION_SCHEMA,
  canonicalJson,
  inspectWorkflow,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/workflow/inspect_workflow.mjs";

function treeSnapshot(root, current = root, entries = []) {
  for (const name of readdirSync(current).sort()) {
    const path = join(current, name);
    const relative = path.slice(root.length + 1);
    if (statSync(path).isDirectory()) treeSnapshot(root, path, entries);
    else entries.push(`${relative}:${readFileSync(path).toString("base64")}`);
  }
  return entries;
}

describe("workflow inspection", () => {
  it("returns one typed primary action without changing observed files", () => {
    const fixture = createHtmlFirstRun("workflow-inspect-unit-");
    try {
      const statePath = join(fixture.deck, "_state", "state.yaml");
      const sourcePath = join(fixture.runDir, "slide-specifications.md");
      const before = { state: readFileSync(statePath), source: readFileSync(sourcePath) };
      const result = inspectWorkflow({ runDir: fixture.runDir });

      expect(result.schema).toBe(WORKFLOW_INSPECTION_SCHEMA);
      expect(result.primary_action).toMatchObject({
        owner: expect.any(String),
        action_id: expect.any(String),
        kind: expect.any(String),
        requires_human: expect.any(Boolean),
      });
      expect(result.observations).toEqual([]);
      expect(readFileSync(statePath)).toEqual(before.state);
      expect(readFileSync(sourcePath)).toEqual(before.source);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("performs no tree write or provider call while observing", () => {
    const fixture = createHtmlFirstRun("workflow-inspect-pure-");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      const before = treeSnapshot(fixture.deck);
      const result = inspectWorkflow({ runDir: fixture.runDir });
      expect(treeSnapshot(fixture.deck)).toEqual(before);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.checkpoint)).toBe(true);
      expect(Object.isFrozen(result.primary_action)).toBe(true);
      expect(Object.isFrozen(result.observations)).toBe(true);
    } finally {
      fetchSpy.mockRestore();
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("uses deterministic canonical bytes for an unchanged checkpoint", () => {
    const fixture = createHtmlFirstRun("workflow-inspect-parity-");
    try {
      const first = inspectWorkflow({ runDir: fixture.runDir });
      const second = inspectWorkflow({ runDir: fixture.runDir });
      expect(canonicalJson(first)).toBe(canonicalJson(second));
      expect(first.checkpoint).toEqual(second.checkpoint);
      expect(Object.keys(first.checkpoint)).not.toContain("observed_at");
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("short-circuits later workflow facts when layout is invalid", () => {
    const fixture = createHtmlFirstRun("workflow-inspect-layout-");
    try {
      rmSync(join(fixture.runDir, "slide-specifications.md"));
      writeFileSync(join(fixture.deck, "_state", "state.yaml"), "][}{\n", "utf8");
      const result = inspectWorkflow({ runDir: fixture.runDir });
      expect(result).toMatchObject({
        posture: "hard-stop",
        root_cause: { owner: "run-bundle-layout" },
        primary_action: { owner: "run-bundle-layout", kind: "repair" },
      });
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("keeps requested intent non-authoritative", () => {
    const fixture = createHtmlFirstRun("workflow-inspect-intent-");
    try {
      expect(inspectWorkflow({ runDir: fixture.runDir, requestedIntent: "build-now" }))
        .toMatchObject({ posture: "guide", root_cause: { kind: "requested-intent-invalid" } });
      expect(inspectWorkflow({ runDir: fixture.runDir, requestedIntent: {} }))
        .toMatchObject({ posture: "guide", root_cause: { kind: "requested-intent-invalid" } });
      expect(inspectWorkflow({
        runDir: fixture.runDir,
        requestedIntent: { schema: "pptmaker-workflow-observation-intent-v1", owner: "image2-refinement", action_id: "resume" },
      })).toMatchObject({ posture: "guide", root_cause: { kind: "requested-intent-inapplicable" } });
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("does not claim unfinished whole-page Image2 production is complete", () => {
    const root = mkdtempSync(join(tmpdir(), "workflow-inspect-image2-"));
    const deck = join(root, "deck_image2");
    const runDir = join(deck, "3_versions", "v1");
    try {
      initBundle(deck, null, "keynote", "dark-executive", { mode: "image2-only" });
      expect(inspectWorkflow({ runDir })).toMatchObject({
        posture: "guide",
        root_cause: { owner: "image2-delivery-review" },
        primary_action: { owner: "image2-delivery-review", kind: "continue" },
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("uses one non-mutating wait action from the execution cursor", async () => {
    const fixture = await createCurrentHtmlDelivery("workflow-inspect-wait-");
    try {
      const state = readState(fixture.deck, { purpose: "observe", heal: false });
      state.nodes[state.current_node] = { ...state.nodes[state.current_node], waiting_for: "user:confirm-delivery" };
      writeState(fixture.deck, state);
      expect(inspectWorkflow({ runDir: fixture.runDir })).toMatchObject({
        posture: "confirm",
        root_cause: { owner: "state", kind: "waiting-for-human" },
        primary_action: { owner: "state", action_id: "wait-for-human", kind: "continue", requires_human: true },
      });
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 60_000);

  it("keeps required visual-slot refinement as html-then-image2 debt", async () => {
    const fixture = await createCurrentHtmlDelivery("workflow-inspect-refinement-", { mode: "html-then-image2" });
    try {
      expect(inspectWorkflow({ runDir: fixture.runDir })).toMatchObject({
        root_cause: { owner: "image2-refinement" },
        primary_action: { display_label: "start:image2-refine/plan" },
      });
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 60_000);

  it("keeps downstream refinement debt as an ordered observation behind an HTML repair", async () => {
    const fixture = await createCurrentHtmlDelivery("workflow-inspect-observations-", { mode: "html-then-image2" });
    try {
      publishHtmlDeliveryDecision(fixture.runDir, {
        decision: "repair",
        reason: "The current delivery needs a local correction before refinement.",
      });
      expect(inspectWorkflow({ runDir: fixture.runDir })).toMatchObject({
        posture: "confirm",
        root_cause: { owner: "html-review", kind: "delivery-review-pending" },
        primary_action: { owner: "html-review" },
        observations: [{ owner: "image2-refinement", kind: "absent" }],
      });
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 60_000);

  it("uses a terminal typed action for a complete HTML-only delivery", async () => {
    const fixture = await createCurrentHtmlDelivery("workflow-inspect-complete-");
    try {
      expect(inspectWorkflow({ runDir: fixture.runDir })).toMatchObject({
        posture: "ready",
        root_cause: null,
        primary_action: {
          owner: "workflow-inspection",
          action_id: "complete-current-workflow",
          kind: "complete",
          requires_human: false,
          display_label: "complete:html-delivery",
        },
        continuation: null,
      });
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 60_000);

  it("reports a read-only repair action for invalid durable state", () => {
    const fixture = createHtmlFirstRun("workflow-inspect-invalid-state-");
    try {
      const path = join(fixture.deck, "_state", "state.yaml");
      writeFileSync(path, "][}{\n", "utf8");
      const before = readFileSync(path);
      expect(inspectWorkflow({ runDir: fixture.runDir })).toMatchObject({
        posture: "hard-stop",
        root_cause: { owner: "state" },
        primary_action: { owner: "state", action_id: "validate-state" },
      });
      expect(readFileSync(path)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("does not let an earlier inspection satisfy a later CAS-bound transition", () => {
    const fixture = createHtmlFirstRun("workflow-inspect-cas-");
    try {
      const statePath = join(fixture.deck, "_state", "state.yaml");
      const expectedStateSha = createHash("sha256").update(readFileSync(statePath)).digest("hex");
      inspectWorkflow({ runDir: fixture.runDir });
      const state = readState(fixture.deck, { purpose: "execute", heal: false });
      writeState(fixture.deck, { ...state, updated_at: "2026-07-23T00:00:00.000Z" });
      const afterConcurrentOwnerWrite = readFileSync(statePath);

      expect(() => transitionProductionMode(fixture.deck, {
        runVersion: "v1",
        toMode: "html-then-image2",
        expectedStateSha,
      })).toThrow(/CONFLICT/);
      expect(readFileSync(statePath)).toEqual(afterConcurrentOwnerWrite);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("keeps a wrong-owner final-review request non-mutating after inspection", () => {
    const fixture = createHtmlFirstRun("workflow-inspect-wrong-owner-");
    try {
      const statePath = join(fixture.deck, "_state", "state.yaml");
      const before = readFileSync(statePath);
      inspectWorkflow({ runDir: fixture.runDir });
      const expectedStateSha = createHash("sha256").update(before).digest("hex");
      expect(() => recordImage2DeliveryReview(fixture.deck, {
        runVersion: "v1",
        decision: "proceed",
        expectedStateSha,
      })).toThrow(/image2-only/);
      expect(readFileSync(statePath)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("records BUG-033's earliest owner diagnostic and reruns after its canonical repair", async () => {
    const fixture = createHtmlFirstRun("workflow-inspect-bug-033-");
    try {
      const sourceBefore = readFileSync(join(fixture.runDir, "slide-specifications.md"));
      const stateBefore = readFileSync(join(fixture.deck, "_state", "state.yaml"));
      const first = inspectWorkflow({ runDir: fixture.runDir });
      expect(first).toMatchObject({
        posture: "confirm",
        root_cause: { owner: "html-review", kind: "content-review-missing" },
        primary_action: { action_id: "review-content", requires_human: true },
      });
      expect(readFileSync(join(fixture.deck, "_state", "state.yaml"))).toEqual(stateBefore);

      const pipeline = await import("../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs");
      expect(await pipeline.stage1(fixture.runDir, false)).toBe(true);
      const renderer = await import("../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_renderer.mjs");
      await renderer.publishHtmlComposition(renderer.createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir }), {});
      const review = inspectHtmlReviewReadiness(fixture.runDir);
      publishHtmlGateDecision(fixture.runDir, {
        gate: "content",
        planHash: review.gates.content.plan.plan_hash,
        status: "approved",
      });

      const rerun = inspectWorkflow({ runDir: fixture.runDir });
      expect(rerun).toMatchObject({
        posture: "confirm",
        root_cause: { owner: "html-review", kind: "visual-review-missing" },
        primary_action: { action_id: "review-visual", requires_human: true },
      });
      expect(readFileSync(join(fixture.runDir, "slide-specifications.md"))).toEqual(sourceBefore);
      expect(readFileSync(join(fixture.deck, "_state", "state.yaml"))).not.toEqual(stateBefore);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("fails closed on an uncertain Image2 submit without proposing another submit", async () => {
    const fixture = await createCurrentHtmlDelivery("workflow-inspect-unknown-submit-", { mode: "html-then-image2" });
    try {
      const operations = await loadRefinementOperations();
      const plan = await operations.createRefinementPlan({ runDir: fixture.runDir, profileFingerprint: "a".repeat(64) });
      const authorization = await operations.authorizeRefinement({ runDir: fixture.runDir, planHash: plan.plan_hash, authorizationId: "auth-inspection" });
      const state = readState(fixture.deck, { purpose: "execute", heal: false });
      const record = readImage2RefinementState(state, "v1");
      const attempt = authorization.authorization.attempts.find((entry) => entry.kind === "style-reference");
      record.attempts[attempt.attempt_id] = transitionAttempt(
        transitionAttempt(record.attempts[attempt.attempt_id], "submitting"),
        "unknown-submit",
        { failure_code: "unknown-submit" },
      );
      writeImage2RefinementState(fixture.deck, "v1", record);

      expect(inspectWorkflow({ runDir: fixture.runDir })).toMatchObject({
        posture: "hard-stop",
        root_cause: { owner: "image2-refinement", kind: "unknown-submit" },
        primary_action: { action_id: "resolve-unknown-submit", kind: "recover", requires_human: true },
        continuation: null,
        protected_invariant: expect.stringMatching(/uncertain provider submission/),
      });
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 120_000);
});
