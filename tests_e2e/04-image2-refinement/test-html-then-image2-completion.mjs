import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { rmSync } from "node:fs";
import { encode as encodePng } from "fast-png";
import { createCurrentHtmlDelivery } from "../../tests/helpers/image2_refinement_fixture.mjs";
import { createFakeRefinementTransport } from "../../PPTMAKER_FRAMEWORK/scripts/04-image2-refinement/internal/transport.mjs";
import { loadRefinementOperations } from "../../PPTMAKER_FRAMEWORK/scripts/04-image2-refinement/index.mjs";
import {
  readImage2RefinementState,
  readState,
  transitionProductionMode,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

const FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";

function flow(args, timeout = 120_000) {
  return spawnSync("node", [FLOW, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout,
    env: {
      ...process.env,
      IMAGE2_API_KEY: "",
      IMAGE2_BASE_URL: "",
      OPENAI_API_KEY: "",
      GEMINI_API_KEY: "",
    },
  });
}

function submittedBytes(request) {
  const bytes = Buffer.from(encodePng({
    width: 1,
    height: 1,
    data: new Uint8Array([20, 30, 40, 255]),
    channels: 4,
    depth: 8,
  }));
  return {
    status: "submitted",
    bytes,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    media: "image/png",
    width: 1,
    height: 1,
    provider_request_id: `provider-${request.attempt_id}`,
  };
}

describe("html-then-image2 completion E2E", () => {
  it("requires refinement and a renewed final review, while retaining refinement work across a mode round-trip", async () => {
    const fixture = await createCurrentHtmlDelivery("html-then-image2-e2e-", { mode: "html-then-image2" });
    try {
      const initial = flow(["status", fixture.runDir, "--json"], 30_000);
      expect(initial.status, initial.stderr || initial.stdout).toBe(0);
      expect(JSON.parse(initial.stdout)).toMatchObject({
        production_mode: { mode: "html-then-image2" },
        image2_refinement: { present: false },
        suggested_next: "start:image2-refine/plan",
      });

      const operations = await loadRefinementOperations();
      expect(await operations.enterRefinementController({ runDir: fixture.runDir }))
        .toMatchObject({ entered: true, playbook: "image2-refine" });
      const plan = await operations.createRefinementPlan({
        runDir: fixture.runDir,
        profileFingerprint: "a".repeat(64),
      });
      const authorization = await operations.authorizeRefinement({
        runDir: fixture.runDir,
        planHash: plan.plan_hash,
        authorizationId: "auth-html-then-image2-e2e",
      });
      const transport = createFakeRefinementTransport({ onSubmit: async (request) => submittedBytes(request) });
      const candidates = [];
      for (const attempt of authorization.authorization.attempts) {
        const result = await operations.generateRefinement({ runDir: fixture.runDir, attemptId: attempt.attempt_id, transport });
        if (result.candidate) candidates.push(result.candidate);
      }
      for (const candidate of candidates) {
        await operations.composeCandidateReview({ runDir: fixture.runDir, candidateId: candidate.candidate_id });
        await operations.useHtmlRefinement({
          runDir: fixture.runDir,
          slideId: candidate.slide_id,
          candidateId: candidate.candidate_id,
        });
      }
      expect(transport.submitCount).toBe(3);

      expect(await operations.completeRefinementController({ runDir: fixture.runDir }))
        .toMatchObject({ complete: true, playbook: "create-deck", requires_final_review: true });
      let state = readState(fixture.deck, { purpose: "execute", heal: false });
      const retained = readImage2RefinementState(state, "v1");
      expect(retained).toMatchObject({ plan: { plan_hash: plan.plan_hash } });
      expect(state.nodes["html-delivery-review"]?.by_version?.["3_versions/v1"] ?? null).toBeNull();

      const awaitingReview = flow(["status", fixture.runDir, "--json"], 30_000);
      expect(awaitingReview.status, awaitingReview.stderr || awaitingReview.stdout).toBe(0);
      expect(JSON.parse(awaitingReview.stdout)).toMatchObject({
        html_reviews: { delivery: { freshness: "missing", decision: null } },
        suggested_next: expect.stringContaining("--record-delivery-review proceed"),
      });

      const renewed = flow(["state", fixture.runDir, "--record-delivery-review", "proceed"], 30_000);
      expect(renewed.status, renewed.stderr || renewed.stdout).toBe(0);
      const complete = flow(["status", fixture.runDir, "--json"], 30_000);
      expect(complete.status, complete.stderr || complete.stdout).toBe(0);
      expect(JSON.parse(complete.stdout)).toMatchObject({
        production_mode: { mode: "html-then-image2" },
        image2_refinement: { status: "complete" },
        html_reviews: { delivery: { freshness: "current", decision: "proceed" } },
        suggested_next: "complete:html-delivery",
      });

      const toHtmlOnly = transitionProductionMode(fixture.deck, {
        runVersion: "v1",
        toMode: "html-only",
      });
      expect(toHtmlOnly).toMatchObject({ ok: true, to_mode: "html-only" });
      state = readState(fixture.deck, { purpose: "execute", heal: false });
      expect(readImage2RefinementState(state, "v1")).toEqual(retained);

      const toRequiredRefinement = transitionProductionMode(fixture.deck, {
        runVersion: "v1",
        toMode: "html-then-image2",
      });
      expect(toRequiredRefinement).toMatchObject({ ok: true, to_mode: "html-then-image2" });
      state = readState(fixture.deck, { purpose: "execute", heal: false });
      expect(readImage2RefinementState(state, "v1")).toEqual(retained);
      expect(flow(["status", fixture.runDir, "--json"], 30_000).status).toBe(0);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }, 180_000);
});
