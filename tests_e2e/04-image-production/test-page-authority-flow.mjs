import { describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { pageAuthorityImage2Paths } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  flow,
  lastError,
  mixedPageAuthoritySource,
  parseJson,
  startRawRelay,
} from "../helpers/page_authority_fixture.mjs";

function writeMixedSource(deck, runDir, values = {}) {
  writeFileSync(join(runDir, "slide-specifications.md"), mixedPageAuthoritySource(values), "utf8");
  writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), "page-authority-e2e-style-master", "utf8");
}

async function provisionAcceptedMixedDeck({ deck, runDir, relay }) {
  const init = await flow(["init", deck, "--deck-type", "keynote", "--style", "dark-executive"]);
  expect(init.status, init.stderr || init.stdout).toBe(0);
  writeMixedSource(deck, runDir);

  const validate = await flow(["validate", runDir], {
    env: { IMAGE2_API_KEY: "", IMAGE2_BASE_URL: "" },
  });
  expect(validate.status, validate.stderr || validate.stdout).toBe(0);

  const localDoctor = await flow(["doctor", "--run-dir", runDir, "--operation", "framed-local-refresh"], {
    env: { IMAGE2_API_KEY: "", IMAGE2_BASE_URL: "" },
  });
  expect(localDoctor.status, localDoctor.stderr || localDoctor.stdout).toBe(0);
  expect(localDoctor.stdout).toContain("framed-runtime");

  const planned = await flow(["image2", "plan", runDir, "--json"]);
  expect(planned.status, planned.stderr || planned.stdout).toBe(0);
  const plan = parseJson(planned.stdout);
  expect(plan).toMatchObject({
    source_epoch: 1,
    needs_raw_generation: ["PageGo", "PureMap"],
    maximum_submissions: 2,
  });

  const authorized = await flow(["image2", "authorize", runDir, "--plan-hash", plan.plan_hash, "--json"]);
  expect(authorized.status, authorized.stderr || authorized.stdout).toBe(0);
  expect(parseJson(authorized.stdout)).toMatchObject({ authorized: true, zero_submit: false });

  const generated = await flow(
    ["image2", "generate", runDir, "--plan-hash", plan.plan_hash, "--json"],
    { env: { IMAGE2_API_KEY: "page-authority-e2e-key", IMAGE2_BASE_URL: relay.baseUrl } },
  );
  expect(generated.status, generated.stderr || generated.stdout).toBe(0);
  expect(parseJson(generated.stdout)).toMatchObject({ submitted: 2 });

  const reviewed = await flow(["image2", "review", runDir, "--json"]);
  expect(reviewed.status, reviewed.stderr || reviewed.stdout).toBe(0);
  expect(parseJson(reviewed.stdout)).toMatchObject({ decision: null });

  const accepted = await flow(["image2", "accept", runDir, "--decision", "proceed", "--json"]);
  expect(accepted.status, accepted.stderr || accepted.stdout).toBe(0);

  const built = await flow(["build", runDir], { timeout: 120_000 });
  expect(built.status, built.stderr || built.stdout).toBe(0);
}

describe("Page Authority delivery E2E", () => {
  it("delivers a fresh mixed Pure/Framed deck through raw review, PPTX, notes, and delivery decision", async () => {
    const root = mkdtempSync(join(tmpdir(), "page-authority-mixed-e2e-"));
    const deck = join(root, "deck_page_authority");
    const runDir = join(deck, "3_versions", "v1");
    const relay = await startRawRelay();
    try {
      await provisionAcceptedMixedDeck({ deck, runDir, relay });

      expect(relay.calls).toHaveLength(2);
      const requestBodies = relay.calls.map((call) => call.body).join("\n");
      expect(requestBodies).not.toContain("Frame-owned title");
      expect(requestBodies).toContain("Pure-owned display title");

      const paths = pageAuthorityImage2Paths(runDir);
      const finalManifest = JSON.parse(readFileSync(paths.final_manifest, "utf8"));
      expect(finalManifest.entries.map((entry) => [entry.slide_id, entry.authority])).toEqual([
        ["PageGo", "framed-image2"],
        ["PureMap", "pure-image2"],
      ]);
      expect(existsSync(paths.final_projection)).toBe(true);
      expect(existsSync(join(paths.final_root, "pptx-assembly.json"))).toBe(true);
      expect(readFileSync(join(paths.final_root, "notes-receipt.json"), "utf8"))
        .toContain("pptmaker-page-authority-notes-receipt-v1");

      const delivery = await flow(["state", runDir, "--record-page-authority-delivery-review", "proceed"]);
      expect(delivery.status, delivery.stderr || delivery.stdout).toBe(0);
      expect(parseJson(delivery.stdout)).toMatchObject({
        operation: "record-page-authority-delivery-review",
        decision: "proceed",
      });

      const state = await flow(["state", runDir, "--json"]);
      expect(state.status, state.stderr || state.stdout).toBe(0);
      expect(parseJson(state.stdout).workflow_inspection).toMatchObject({
        posture: "ready",
        primary_action: { display_label: "complete:page-authority-delivery" },
      });
    } finally {
      await relay.close();
      rmSync(root, { recursive: true, force: true });
    }
  }, 240_000);

  it("keeps Framed Text Frame refresh local while a Pure display edit needs fresh raw evidence and review", async () => {
    const root = mkdtempSync(join(tmpdir(), "page-authority-refresh-e2e-"));
    const deck = join(root, "deck_page_authority");
    const runDir = join(deck, "3_versions", "v1");
    const relay = await startRawRelay();
    try {
      await provisionAcceptedMixedDeck({ deck, runDir, relay });

      writeMixedSource(deck, runDir, { framedTitle: "Frame title refreshed locally" });
      const framedRefresh = await flow(
        ["refresh", runDir, "--kind", "title", "--only", "PageGo"],
        { env: { IMAGE2_API_KEY: "", IMAGE2_BASE_URL: "" }, timeout: 120_000 },
      );
      expect(framedRefresh.status, framedRefresh.stderr || framedRefresh.stdout).toBe(0);
      expect(relay.calls).toHaveLength(2);

      writeMixedSource(deck, runDir, {
        framedTitle: "Frame title refreshed locally",
        pureTitle: "Pure display title requires fresh raw evidence",
      });
      const pureRefresh = await flow(
        ["refresh", runDir, "--kind", "title", "--only", "PureMap"],
        { env: { IMAGE2_API_KEY: "", IMAGE2_BASE_URL: "" } },
      );
      expect(pureRefresh.status).not.toBe(0);
      expect(lastError(pureRefresh.stderr)).toMatchObject({
        code: "GATE_BLOCKED",
        diagnostic: { reason: { kind: "pure_refresh_requires_raw" } },
      });

      const secondPlanResult = await flow(["image2", "plan", runDir, "--json"]);
      expect(secondPlanResult.status, secondPlanResult.stderr || secondPlanResult.stdout).toBe(0);
      const secondPlan = parseJson(secondPlanResult.stdout);
      expect(secondPlan).toMatchObject({
        source_epoch: 2,
        reusable_slide_ids: [],
        needs_raw_generation: ["PageGo", "PureMap"],
        maximum_submissions: 2,
      });

      const secondAuthorization = await flow(["image2", "authorize", runDir, "--plan-hash", secondPlan.plan_hash, "--json"]);
      expect(secondAuthorization.status, secondAuthorization.stderr || secondAuthorization.stdout).toBe(0);
      const regenerated = await flow(
        ["image2", "generate", runDir, "--plan-hash", secondPlan.plan_hash, "--json"],
        { env: { IMAGE2_API_KEY: "page-authority-e2e-key", IMAGE2_BASE_URL: relay.baseUrl } },
      );
      expect(regenerated.status, regenerated.stderr || regenerated.stdout).toBe(0);
      expect(parseJson(regenerated.stdout)).toMatchObject({ submitted: 2 });
      expect(relay.calls).toHaveLength(4);

      const refreshedReview = await flow(["image2", "review", runDir, "--json"]);
      expect(refreshedReview.status, refreshedReview.stderr || refreshedReview.stdout).toBe(0);
      const unacceptedBuild = await flow(["build", runDir]);
      expect(unacceptedBuild.status).not.toBe(0);
      expect(lastError(unacceptedBuild.stderr)).toMatchObject({
        code: "GATE_BLOCKED",
        diagnostic: { reason: { kind: "raw_review_confirm_required" } },
      });

      const secondAcceptance = await flow(["image2", "accept", runDir, "--decision", "proceed", "--json"]);
      expect(secondAcceptance.status, secondAcceptance.stderr || secondAcceptance.stdout).toBe(0);
      const rebuilt = await flow(["build", runDir], { timeout: 120_000 });
      expect(rebuilt.status, rebuilt.stderr || rebuilt.stdout).toBe(0);
      expect(relay.calls).toHaveLength(4);
    } finally {
      await relay.close();
      rmSync(root, { recursive: true, force: true });
    }
  }, 300_000);
});
