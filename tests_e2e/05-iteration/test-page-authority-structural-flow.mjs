import { describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { pageAuthorityImage2Paths } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { readPageAuthorityRawManifest } from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/page-authority/raw_manifest.mjs";
import { readState } from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import {
  flow,
  lastError,
  parseJson,
  startRawRelay,
} from "../helpers/page_authority_fixture.mjs";

async function provisionAcceptedMixedDeck(deck, runDir, relay) {
  const init = await flow(["init", deck, "--deck-type", "keynote", "--style", "dark-executive"]);
  expect(init.status, init.stderr || init.stdout).toBe(0);
  const { mixedPageAuthoritySource } = await import("../helpers/page_authority_fixture.mjs");
  const { writeFileSync } = await import("node:fs");
  writeFileSync(join(runDir, "slide-specifications.md"), mixedPageAuthoritySource(), "utf8");
  writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), "page-authority-e2e-style-master", "utf8");

  const planned = await flow(["image2", "plan", runDir, "--json"]);
  expect(planned.status, planned.stderr || planned.stdout).toBe(0);
  const plan = parseJson(planned.stdout);
  const authorized = await flow(["image2", "authorize", runDir, "--plan-hash", plan.plan_hash, "--json"]);
  expect(authorized.status, authorized.stderr || authorized.stdout).toBe(0);
  const generated = await flow(
    ["image2", "generate", runDir, "--plan-hash", plan.plan_hash, "--json"],
    { env: { IMAGE2_API_KEY: "page-authority-e2e-key", IMAGE2_BASE_URL: relay.baseUrl } },
  );
  expect(generated.status, generated.stderr || generated.stdout).toBe(0);
  const reviewed = await flow(["image2", "review", runDir, "--json"]);
  expect(reviewed.status, reviewed.stderr || reviewed.stdout).toBe(0);
  const accepted = await flow(["image2", "accept", runDir, "--decision", "proceed", "--json"]);
  expect(accepted.status, accepted.stderr || accepted.stdout).toBe(0);
  const built = await flow(["build", runDir], { timeout: 120_000 });
  expect(built.status, built.stderr || built.stdout).toBe(0);
}

describe("Page Authority structural vNext E2E", () => {
  it("publishes only plan-bound target-local unreviewed raw, then requires target review before finalization", async () => {
    const root = mkdtempSync(join(tmpdir(), "page-authority-structural-e2e-"));
    const deck = join(root, "deck_page_authority");
    const runDir = join(deck, "3_versions", "v1");
    const relay = await startRawRelay();
    try {
      await provisionAcceptedMixedDeck(deck, runDir, relay);
      expect(relay.calls).toHaveLength(2);

      const previewResult = await flow(["slides", "move", runDir, "PureMap", "--before", "PageGo", "--json"]);
      expect(previewResult.status, previewResult.stderr || previewResult.stdout).toBe(0);
      const preview = parseJson(previewResult.stdout);
      expect(preview.transaction.page_authority_structural_raw).toMatchObject({
        target_source_epoch: 1,
        slide_edit_base_plan_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        entries: [
          { slide_id: "PageGo", disposition: "materialize_unreviewed" },
          { slide_id: "PureMap", disposition: "materialize_unreviewed" },
        ],
      });

      const appliedResult = await flow([
        "slides", "move", runDir, "PureMap", "--before", "PageGo", "--apply",
        "--plan-sha256", preview.transaction.plan_sha256, "--json",
      ]);
      expect(appliedResult.status, appliedResult.stderr || appliedResult.stdout).toBe(0);
      const applied = parseJson(appliedResult.stdout);
      const targetRunDir = applied.target_run_dir;
      expect(applied.receipt.page_authority_structural_raw.plan_hash)
        .toBe(preview.transaction.page_authority_structural_raw.plan_hash);
      expect(relay.calls).toHaveLength(2);

      expect(readState(deck, { purpose: "execute", heal: false }).production_mode.by_version["3_versions/v2"])
        .toEqual({ mode: "image2-page-authority", source_epoch: 1 });
      const targetRaw = readPageAuthorityRawManifest(targetRunDir);
      expect(targetRaw.items.map((item) => item.slide_id)).toEqual(["PageGo", "PureMap"]);
      expect(targetRaw.items.every((item) => item.provenance === "unreviewed")).toBe(true);
      expect(targetRaw.items.every((item) => item.source_lineage?.run_dir === runDir)).toBe(true);
      const paths = pageAuthorityImage2Paths(targetRunDir);
      expect(existsSync(paths.raw_review_coverage)).toBe(false);
      expect(existsSync(paths.final_manifest)).toBe(false);

      const beforeReview = await flow(["build", targetRunDir]);
      expect(beforeReview.status).not.toBe(0);
      expect(lastError(beforeReview.stderr)).toMatchObject({
        code: "GATE_BLOCKED",
        diagnostic: { reason: { kind: "raw_review_evidence_missing" } },
      });

      const targetPlanResult = await flow(["image2", "plan", targetRunDir, "--json"]);
      expect(targetPlanResult.status, targetPlanResult.stderr || targetPlanResult.stdout).toBe(0);
      expect(parseJson(targetPlanResult.stdout)).toMatchObject({
        reusable_slide_ids: ["PageGo", "PureMap"],
        needs_raw_generation: [],
        maximum_submissions: 0,
      });
      const targetReview = await flow(["image2", "review", targetRunDir, "--json"]);
      expect(targetReview.status, targetReview.stderr || targetReview.stdout).toBe(0);

      const unacceptedFinalization = await flow(["build", targetRunDir]);
      expect(unacceptedFinalization.status).not.toBe(0);
      expect(lastError(unacceptedFinalization.stderr)).toMatchObject({
        code: "GATE_BLOCKED",
        diagnostic: { reason: { kind: "raw_review_confirm_required" } },
      });
      const targetAcceptance = await flow(["image2", "accept", targetRunDir, "--decision", "proceed", "--json"]);
      expect(targetAcceptance.status, targetAcceptance.stderr || targetAcceptance.stdout).toBe(0);
      const finalization = await flow(["build", targetRunDir], { timeout: 120_000 });
      expect(finalization.status, finalization.stderr || finalization.stdout).toBe(0);
      expect(JSON.parse(readFileSync(paths.final_manifest, "utf8")).entries.map((entry) => entry.slide_id))
        .toEqual(["PureMap", "PageGo"]);
      expect(relay.calls).toHaveLength(2);
    } finally {
      await relay.close();
      rmSync(root, { recursive: true, force: true });
    }
  }, 300_000);
});
