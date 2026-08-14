import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createRawWorkPlan } from "../../../ppt_maker_harness/scripts/shared/image2/page_image_artifacts.mjs";
import {
  publishAcceptedRawEvidence,
  submitAuthorizedRawWorkPlan,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_raw_mechanics.mjs";
import {
  createInitialState,
  initializeTargetPageImageState,
  recordPageImageRawProviderAuthorization,
  writeState,
} from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";
import { pageImageProviderInputBinding } from "../../helpers/page_image_provider_input_binding.mjs";

const digest = (letter) => letter.repeat(64);

function rawWorkPlan(sourceReceiptSha256) {
  return createRawWorkPlan({
    source_receipt_sha256: sourceReceiptSha256,
    workflow: "pure",
    ordered_slide_ids: ["DeckGo"],
    provider_profile_sha256: digest("b"),
    authorization_scope_sha256: digest("c"),
    items: [{
      slide_id: "DeckGo",
      raw_contract_sha256: digest("d"),
      provider_input_binding: pageImageProviderInputBinding({ workflow: "pure" }),
    }],
  });
}

function targetDeck() {
  const deck = mkdtempSync(join(tmpdir(), "deck_page_image_raw_"));
  const runDir = join(deck, "3_versions", "v1");
  const source = "---\nproduction:\n  pipeline: page-image-workflow\n  workflow: pure\n---\n";
  mkdirSync(runDir, { recursive: true });
  writeFileSync(join(runDir, "slide-specifications.md"), source, "utf8");
  writeState(deck, createInitialState("gated", "keynote", "dark", { workflow: "pure" }));
  return {
    deck,
    runDir,
    sourceReceipt: {
      schema: "page-source-receipt",
    artifact_role: "parsed-source",
      pipeline: "page-image-workflow",
      workflow: "pure",
      source_sha256: createHash("sha256").update(source).digest("hex"),
      slides: [{ slide_id: "DeckGo", position: 1 }],
    },
  };
}

describe("Page Image shared raw mechanics", () => {
  it("submits opaque plan items only after current state authorization", async () => {
    const { deck, runDir, sourceReceipt } = targetDeck();
    const plan = rawWorkPlan(sourceReceipt.source_sha256);
    let submits = 0;
    try {
      initializeTargetPageImageState(deck, { runDir, sourceReceipt });
      const unboundPlan = structuredClone(plan);
      delete unboundPlan.items[0].provider_input_binding;
      await expect(submitAuthorizedRawWorkPlan({
        deckDir: deck, runDir, rawWorkPlan: unboundPlan, submit: async () => { submits += 1; },
      })).rejects.toMatchObject({ code: "raw_plan_invalid" });
      expect(submits).toBe(0);
      await expect(submitAuthorizedRawWorkPlan({
        deckDir: deck, runDir, rawWorkPlan: plan, submit: async () => { submits += 1; },
      })).rejects.toMatchObject({ code: "provider_authorization_required" });
      expect(submits).toBe(0);

      recordPageImageRawProviderAuthorization(deck, { runDir, rawWorkPlan: plan, maxSubmissions: 1 });
      const submitted = await submitAuthorizedRawWorkPlan({
        deckDir: deck,
        runDir,
        rawWorkPlan: plan,
        submit: async ({ item }) => { submits += 1; return item.slide_id; },
      });
      expect(submitted).toMatchObject({ submitted: 1 });
      expect(submits).toBe(1);
      expect(publishAcceptedRawEvidence({
        deckDir: deck,
        runDir,
        rawWorkPlan: plan,
        raw_review_sha256: digest("e"),
        raw_bytes_by_slide: { DeckGo: Buffer.from("raw") },
      })).toMatchObject({ schema: "page-image-adapter-accepted-raw-evidence", workflow: "pure" });

      const stalePlan = createRawWorkPlan({
        ...plan,
        provider_profile_sha256: digest("9"),
      });
      await expect(submitAuthorizedRawWorkPlan({
        deckDir: deck, runDir, rawWorkPlan: stalePlan, submit: async () => { submits += 1; },
      })).rejects.toMatchObject({ code: "provider_authorization_required" });
      expect(submits).toBe(1);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });
});
