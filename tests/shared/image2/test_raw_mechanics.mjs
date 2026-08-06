import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createRawWorkPlan } from "../../../ppt_maker_harness/scripts/shared/image2/page_authority_artifacts.mjs";
import {
  publishAcceptedRawEvidence,
  submitAuthorizedRawWorkPlan,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_authority_raw_mechanics.mjs";
import {
  createInitialState,
  initializeTargetPageAuthorityState,
  recordPageAuthorityRawProviderAuthorization,
  writeState,
} from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";

const digest = (letter) => letter.repeat(64);

function rawWorkPlan(sourceReceiptSha256) {
  return createRawWorkPlan({
    source_receipt_sha256: sourceReceiptSha256,
    workflow: "pure",
    ordered_slide_ids: ["DeckGo"],
    provider_profile_sha256: digest("b"),
    authorization_scope_sha256: digest("c"),
    items: [{ slide_id: "DeckGo", raw_contract_sha256: digest("d") }],
  });
}

function targetDeck() {
  const deck = mkdtempSync(join(tmpdir(), "deck_page_authority_v2_raw_"));
  const runDir = join(deck, "3_versions", "v1");
  const source = "---\nproduction:\n  pipeline: page-authority-image2-v2\n  workflow: pure\n---\n";
  mkdirSync(runDir, { recursive: true });
  writeFileSync(join(runDir, "slide-specifications.md"), source, "utf8");
  writeState(deck, createInitialState("gated", "keynote", "dark", { mode: "image2-page-authority-v2", workflow: "pure" }));
  return {
    deck,
    runDir,
    sourceReceipt: {
      schema: "page-authority-image2-source-v2",
      pipeline: "page-authority-image2-v2",
      workflow: "pure",
      source_sha256: createHash("sha256").update(source).digest("hex"),
      slides: [{ slide_id: "DeckGo", workflow: "pure", display: { title: "Target raw work" } }],
    },
  };
}

describe("Page Authority v2 shared raw mechanics", () => {
  it("submits opaque plan items only after current state authorization", async () => {
    const { deck, runDir, sourceReceipt } = targetDeck();
    const plan = rawWorkPlan(sourceReceipt.source_sha256);
    let submits = 0;
    try {
      initializeTargetPageAuthorityState(deck, { runDir, sourceReceipt });
      await expect(submitAuthorizedRawWorkPlan({
        deckDir: deck, runDir, rawWorkPlan: plan, submit: async () => { submits += 1; },
      })).rejects.toMatchObject({ code: "provider_authorization_required" });
      expect(submits).toBe(0);

      recordPageAuthorityRawProviderAuthorization(deck, { runDir, rawWorkPlan: plan, maxSubmissions: 1 });
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
      })).toMatchObject({ schema: "page-authority-accepted-raw-evidence-v2", workflow: "pure" });

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
