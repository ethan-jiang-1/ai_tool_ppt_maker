import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

const inspection = vi.hoisted(() => ({
  value: {
    evidence_summary: { pipeline: "page-image-workflow-v1", workflow: "pure" },
    primary_action: { action_id: "plan_progressive_raw_work", summary: "fixture is current" },
  },
  sourceReady: true,
}));

vi.mock("../../../ppt_maker_harness/scripts/shared/workflow/inspect_workflow.mjs", () => ({
  inspectWorkflow: () => inspection.value,
  isWorkflowInspectionSourceReady: () => inspection.sourceReady,
}));

import { canonicalJson, canonicalJsonSha256 } from "../../../ppt_maker_harness/scripts/shared/identity/canonical_json.mjs";
import { migrateCurrentRunContentAddresses } from "../../../ppt_maker_harness/scripts/shared/image2/content_address_migrate.mjs";
import {
  publishProgressiveRawStagedPlan,
  stageProgressiveRawPlanContainer,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_store.mjs";
import {
  createProgressiveRawBatch,
  createProgressiveRawWorkPlan,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_schema.mjs";
import { pageImageProgressiveRawPaths } from "../../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import { pageImageProviderInputBinding } from "../../helpers/page_image_provider_input_binding.mjs";
import { PAGE_IMAGE_COMPILED_PROVIDER_INPUT_SCHEMA } from "../../../ppt_maker_harness/scripts/shared/image2/page_image_provider_request_binding.mjs";
import { sha256Bytes } from "../../../ppt_maker_harness/scripts/shared/identity/byte_hash.mjs";

const digest = (letter) => letter.repeat(64);

function fixturePlan() {
  const generationProfile = { provider: { model: "fixture-image-model" }, output: { format: "png", width: 1600, height: 900 } };
  const providerProfileSha256 = canonicalJsonSha256(generationProfile);
  const rawContract = { schema: "fixture-raw-contract-v1", slide_id: "DeckGo" };
  const input = canonicalJson({
    schema: "fixture-provider-input-v1",
    slide_id: "DeckGo",
    raw_contract_sha256: canonicalJsonSha256(rawContract),
    generation_profile_sha256: providerProfileSha256,
  });
  return createProgressiveRawWorkPlan({
    run_version: "v1",
    source_receipt_sha256: digest("a"),
    source_epoch: 1,
    workflow: "pure",
    provider_profile_sha256: providerProfileSha256,
    effective_style_master_sha256: digest("b"),
    source_execution_sha256: digest("c"),
    ordered_slide_ids: ["DeckGo"],
    items: [{
      slide_id: "DeckGo",
      raw_contract_sha256: canonicalJsonSha256(rawContract),
      provider_input_binding: {
        ...pageImageProviderInputBinding({ workflow: "pure" }),
        compiled_provider_input_sha256: sha256Bytes(Buffer.from(input, "utf8")),
        generation_profile_sha256: providerProfileSha256,
      },
    }],
  });
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "content-address-migrate-"));
  const deck = join(root, "deck_migration_fixture");
  const runDir = join(deck, "3_versions", "v1");
  const plan = fixturePlan();
  const paths = pageImageProgressiveRawPaths(runDir);
  const legacy = join(paths.plans_root, plan.sha256);
  mkdirSync(legacy, { recursive: true });
  writeFileSync(join(legacy, "work-plan.json"), Buffer.from(`${canonicalJson(plan)}\n`, "utf8"));
  return { root, deck, runDir, paths, plan, legacy };
}

describe("content-address physical path migration", () => {
  it("migrates only the supplied run, preserves record bytes, and is idempotent", () => {
    const value = fixture();
    const sibling = join(value.deck, "3_versions", "v2", "sentinel");
    inspection.value = {
      evidence_summary: { pipeline: "page-image-workflow-v1", workflow: "pure" },
      primary_action: { action_id: "plan_progressive_raw_work", summary: "fixture is current" },
    };
    inspection.sourceReady = true;
    try {
      mkdirSync(sibling, { recursive: true });
      writeFileSync(join(sibling, "must-not-be-read"), "sibling bytes\n");
      const before = readFileSync(join(value.legacy, "work-plan.json"));

      expect(migrateCurrentRunContentAddresses({ runDir: value.runDir })).toMatchObject({
        ok: true,
        run_version: "v1",
        workflow: "pure",
        renamed: 1,
      });
      const shortRoot = join(value.paths.plans_root, value.plan.sha256.slice(0, 8));
      expect(existsSync(value.legacy)).toBe(false);
      expect(readFileSync(join(shortRoot, "work-plan.json"))).toEqual(before);
      expect(readFileSync(join(sibling, "must-not-be-read"), "utf8")).toBe("sibling bytes\n");

      expect(migrateCurrentRunContentAddresses({ runDir: value.runDir })).toMatchObject({ ok: true, renamed: 0, skipped: 1 });
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("stops at the protocol boundary before opening owner artifacts", () => {
    const value = fixture();
    inspection.value = {
      evidence_summary: { pipeline: "page-authority-image2-v2", workflow: null },
      primary_action: { action_id: "unsupported-protocol/export", summary: "export historical fixture" },
    };
    inspection.sourceReady = false;
    try {
      const before = readFileSync(join(value.legacy, "work-plan.json"));
      expect(migrateCurrentRunContentAddresses({ runDir: value.runDir })).toEqual({
        ok: false,
        code: "unsupported-protocol/export",
        message: "export historical fixture",
      });
      expect(readFileSync(join(value.legacy, "work-plan.json"))).toEqual(before);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("preflights recursive owner locks without changing legacy paths", () => {
    const value = fixture();
    inspection.value = {
      evidence_summary: { pipeline: "page-image-workflow-v1", workflow: "pure" },
      primary_action: { action_id: "plan_progressive_raw_work", summary: "fixture is current" },
    };
    inspection.sourceReady = true;
    try {
      mkdirSync(join(value.legacy, "nested", ".owner.lock"), { recursive: true });
      expect(migrateCurrentRunContentAddresses({ runDir: value.runDir })).toMatchObject({
        ok: false,
        code: "migration_locked",
      });
      expect(existsSync(value.legacy)).toBe(true);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("rejects an occupied short target before changing its legacy peer", () => {
    const value = fixture();
    inspection.value = {
      evidence_summary: { pipeline: "page-image-workflow-v1", workflow: "pure" },
      primary_action: { action_id: "plan_progressive_raw_work", summary: "fixture is current" },
    };
    inspection.sourceReady = true;
    try {
      const shortRoot = join(value.paths.plans_root, value.plan.sha256.slice(0, 8));
      mkdirSync(shortRoot, { recursive: true });
      writeFileSync(join(shortRoot, "work-plan.json"), readFileSync(join(value.legacy, "work-plan.json")));
      const before = readFileSync(join(value.legacy, "work-plan.json"));

      expect(migrateCurrentRunContentAddresses({ runDir: value.runDir })).toMatchObject({
        ok: false,
        code: "migration_collision",
      });
      expect(readFileSync(join(value.legacy, "work-plan.json"))).toEqual(before);
      expect(existsSync(shortRoot)).toBe(true);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("makes a writer release its resource lock when migration has started", () => {
    const root = mkdtempSync(join(tmpdir(), "content-address-writer-lock-"));
    const deck = join(root, "deck_writer_lock");
    const runDir = join(deck, "3_versions", "v1");
    const plan = fixturePlan();
    const migrationLock = join(deck, ".content-address-migration.lock");
    try {
      mkdirSync(runDir, { recursive: true });
      const staged = stageProgressiveRawPlanContainer(runDir, { plan, unique: "migration-lock" });
      mkdirSync(migrationLock);
      expect(() => publishProgressiveRawStagedPlan(runDir, {
        staging_path: staged.staging_path,
        plan_sha256: plan.sha256,
      })).toThrow(/migration is in progress/);
      expect(existsSync(join(deck, "1_upstream_raw_material", "page-image-workflow-iterations", "plans", `.${plan.sha256.slice(0, 8)}.lock`))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rolls back completed child renames when a later parent rename fails", () => {
    const value = fixture();
    inspection.value = {
      evidence_summary: { pipeline: "page-image-workflow-v1", workflow: "pure" },
      primary_action: { action_id: "plan_progressive_raw_work", summary: "fixture is current" },
    };
    inspection.sourceReady = true;
    const batch = createProgressiveRawBatch({
      plan_sha256: value.plan.sha256,
      run_version: value.plan.run_version,
      source_receipt_sha256: value.plan.source_receipt_sha256,
      source_epoch: value.plan.source_epoch,
      workflow: value.plan.workflow,
      provider_profile_sha256: value.plan.provider_profile_sha256,
      effective_style_master_sha256: value.plan.effective_style_master_sha256,
      source_execution_sha256: value.plan.source_execution_sha256,
      kind: "pilot",
      batch_generation: 1,
      ordered_slide_ids: ["DeckGo"],
      items: value.plan.items,
      review_sample_slide_ids: ["DeckGo"],
      paid_submission_slide_ids: ["DeckGo"],
      maximum_submissions: 1,
      is_partial_pilot: false,
    }, { plan: value.plan });
    const legacyBatch = join(value.legacy, "batches", batch.sha256);
    try {
      mkdirSync(legacyBatch, { recursive: true });
      writeFileSync(join(legacyBatch, "batch.json"), Buffer.from(`${canonicalJson(batch)}\n`, "utf8"));
      // The nested batch parent remains writable; only the final plan-root
      // publication will fail, exercising reverse rollback of that child.
      chmodSync(value.paths.plans_root, 0o500);
      const migration = migrateCurrentRunContentAddresses({ runDir: value.runDir });
      expect(migration).toMatchObject({ ok: false });
      expect(existsSync(legacyBatch)).toBe(true);
      expect(existsSync(join(value.legacy, "batches", batch.sha256.slice(0, 8)))).toBe(false);
    } finally {
      chmodSync(value.paths.plans_root, 0o700);
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});
