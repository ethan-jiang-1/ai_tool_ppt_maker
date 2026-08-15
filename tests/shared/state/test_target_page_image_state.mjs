import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createAcceptedRawEvidence, createFinalSlideManifest, createRawWorkPlan } from "../../../ppt_maker_harness/scripts/shared/image2/page_image_artifacts.mjs";
import { createProgressiveRawWorkPlan } from "../../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_schema.mjs";
import {
  authorizeProgressiveRawBatch,
  planProgressiveRawPilot,
  publishProgressiveRawWorkPlan,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_raw_owner.mjs";
import { readProgressiveRawPlanDirectRecords } from "../../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_store.mjs";
import { testStyleMasterGenerationProfileSha256 } from "../../helpers/image2_provider_profile.mjs";
import { canonicalJsonSha256 } from "../../../ppt_maker_harness/scripts/shared/identity/canonical_json.mjs";
import { initBundle } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  advanceTargetPageImageSourceEpoch,
  createInitialState,
  ensureCurrentPageImageTaskMandate,
  inspectCurrentPageImageTaskMandate,
  initializeTargetPageImageState,
  inspectPageImageRawProviderAuthorization,
  inspectTargetPageImageState,
  CONDITIONS,
  readHistory,
  readState,
  recordEffectiveStyleMasterSelection,
  recordPageImageRawProviderAuthorization,
  recordTargetProgressiveCompleteRawReview,
  recordTargetProgressivePilotDecision,
  recordTargetProgressiveRawPlan,
  recordTargetProgressiveAuthorizeCliHandoff,
  recordTargetAcceptedRawEvidence,
  recordTargetDeliveryReceipt,
  recordTargetFinalManifest,
  resolveEffectiveStyleMasterSelection,
  readTargetProgressiveHandoff,
  PAGE_IMAGE_PROGRESSIVE_AUTHORIZE_CLI_EVIDENCE_KEY,
  statePath,
  startPlaybook,
  validateStateReadOnly,
  writeState,
} from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";
import { pageImageProviderInputBinding } from "../../helpers/page_image_provider_input_binding.mjs";

const digest = (letter) => letter.repeat(64);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function targetFixture(workflow = "pure") {
  const root = mkdtempSync(join(tmpdir(), "page-image-target-state-"));
  const deck = join(root, "deck_target");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  const source = `---\nproduction:\n  pipeline: page-image-workflow\n  workflow: ${workflow}\n---\n`;
  writeFileSync(join(runDir, "slide-specifications.md"), source);
  const state = createInitialState("target", "keynote", "dark-executive", {
    workflow,
  });
  state.continuation_target_version = "v1";
  writeState(deck, state);
  return {
    root,
    deck,
    runDir,
    sourceReceipt: {
      schema: "page-source-receipt",
    artifact_role: "parsed-source",
      pipeline: "page-image-workflow",
      workflow,
      source_sha256: sha256(source),
      slides: [{ slide_id: "DeckGo", position: 1 }],
    },
  };
}

function rawPlan(receipt) {
  return createRawWorkPlan({
    source_receipt_sha256: receipt.source_sha256,
    workflow: receipt.workflow,
    ordered_slide_ids: ["DeckGo"],
    provider_profile_sha256: digest("b"),
    authorization_scope_sha256: digest("c"),
    items: [{
      slide_id: "DeckGo",
      raw_contract_sha256: digest("d"),
      provider_input_binding: pageImageProviderInputBinding({ workflow: receipt.workflow }),
    }],
  });
}

function progressivePlan(receipt, task_mandate_sha256 = undefined, sourceEpoch = 1) {
  return createProgressiveRawWorkPlan({
    run_version: "v1",
    source_receipt_sha256: receipt.source_sha256,
    source_epoch: sourceEpoch,
    workflow: receipt.workflow,
    provider_profile_sha256: digest("b"),
    effective_style_master_sha256: digest("c"),
    source_execution_sha256: digest("d"),
    ...(task_mandate_sha256 === undefined ? {} : { task_mandate_sha256 }),
    ordered_slide_ids: ["DeckGo"],
    items: [{
      slide_id: "DeckGo",
      raw_contract_sha256: digest("d"),
      provider_input_binding: pageImageProviderInputBinding({ workflow: receipt.workflow }),
    }],
  });
}

function styleSelection(workflow = "pure", runVersion = "v1") {
  return {
    schema: "page-image-style-master-selection",
    run_version: runVersion,
    workflow,
    plan_sha256: digest("a"),
    candidate_id: "candidate-001",
    candidate_sha256: digest("b"),
    candidate_media_type: "image/png",
    candidate_width: 2000,
    candidate_height: 1125,
    candidate_provenance_sha256: digest("c"),
    style_intent_sha256: digest("d"),
    style_context_sha256: digest("e"),
    candidate_generation_profile_sha256: testStyleMasterGenerationProfileSha256(),
    previous_selection_sha256: null,
    review_decision_sha256: digest("0"),
    accepted_at: "2026-08-01T00:00:00.000Z",
  };
}

describe("TARGET Page Image state lineage", () => {
  it("owns one current non-secret Page Image Task Mandate per execution without observation mutation", () => {
    const fixture = targetFixture("pure");
    try {
      initializeTargetPageImageState(fixture.deck, {
        runVersion: "v1",
        sourceReceipt: fixture.sourceReceipt,
      });
      const path = statePath(fixture.deck);
      const beforeInspection = readFileSync(path);
      expect(inspectCurrentPageImageTaskMandate(fixture.deck, {
        runDir: fixture.runDir,
        workflow: "pure",
      })).toMatchObject({ ok: false, code: "TASK_MANDATE_MISSING" });
      expect(readFileSync(path)).toEqual(beforeInspection);

      const first = ensureCurrentPageImageTaskMandate(fixture.deck, {
        runDir: fixture.runDir,
        workflow: "pure",
      });
      expect(first).toMatchObject({
        ok: true,
        replay: false,
        run_version: "v1",
        workflow: "pure",
        task_mandate_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        record: {
          schema: "page-image-task-mandate",
          scope: "normal-page-image-production",
        },
      });
      expect(JSON.stringify(first.record)).not.toMatch(/prompt|credential|provider|work request/i);
      const afterFirst = readFileSync(path);

      const replay = ensureCurrentPageImageTaskMandate(fixture.deck, {
        runDir: fixture.runDir,
        workflow: "pure",
      });
      expect(replay).toMatchObject({ ok: true, replay: true, task_mandate_sha256: first.task_mandate_sha256 });
      expect(readFileSync(path)).toEqual(afterFirst);
      expect(inspectCurrentPageImageTaskMandate(fixture.deck, {
        runDir: fixture.runDir,
        workflow: "pure",
      })).toMatchObject({ ok: true, task_mandate_sha256: first.task_mandate_sha256 });

      const refinedSource = "---\nproduction:\n  pipeline: page-image-workflow\n  workflow: pure\n---\n# same-task source refinement\n";
      writeFileSync(join(fixture.runDir, "slide-specifications.md"), refinedSource);
      advanceTargetPageImageSourceEpoch(fixture.deck, {
        runVersion: "v1",
        sourceReceipt: {
          ...fixture.sourceReceipt,
          source_sha256: sha256(refinedSource),
        },
        expectedSourceEpoch: 1,
      });
      expect(inspectCurrentPageImageTaskMandate(fixture.deck, {
        runDir: fixture.runDir,
        workflow: "pure",
      })).toMatchObject({ ok: true, task_mandate_sha256: first.task_mandate_sha256 });
      expect(ensureCurrentPageImageTaskMandate(fixture.deck, {
        runDir: fixture.runDir,
        workflow: "pure",
      })).toMatchObject({ ok: true, replay: true, task_mandate_sha256: first.task_mandate_sha256 });

      const nextState = structuredClone(readState(fixture.deck, { purpose: "observe", runVersion: "v1" }));
      delete nextState.durable_state_present;
      startPlaybook(nextState, "create-deck", { replace: true, runVersion: "v1" });
      nextState.current_node = "select-target-page-image-workflow";
      writeState(fixture.deck, nextState);
      expect(inspectCurrentPageImageTaskMandate(fixture.deck, {
        runDir: fixture.runDir,
        workflow: "pure",
      })).toMatchObject({ ok: false, code: "TASK_MANDATE_STALE" });
      const successor = ensureCurrentPageImageTaskMandate(fixture.deck, {
        runDir: fixture.runDir,
        workflow: "pure",
      });
      expect(successor).toMatchObject({ ok: true, replay: false });
      expect(successor.task_mandate_sha256).not.toBe(first.task_mandate_sha256);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("keeps Task Mandate CAS and malformed-record failures provider-free and byte-preserving", () => {
    const fixture = targetFixture("framed");
    try {
      initializeTargetPageImageState(fixture.deck, {
        runVersion: "v1",
        sourceReceipt: fixture.sourceReceipt,
      });
      const path = statePath(fixture.deck);
      const beforeConflict = readFileSync(path);
      expect(() => ensureCurrentPageImageTaskMandate(fixture.deck, {
        runDir: fixture.runDir,
        workflow: "framed",
        expectedStateSha: digest("f"),
      })).toThrow(/CONFLICT/);
      expect(readFileSync(path)).toEqual(beforeConflict);

      const created = ensureCurrentPageImageTaskMandate(fixture.deck, {
        runDir: fixture.runDir,
        workflow: "framed",
      });
      const malformed = structuredClone(readState(fixture.deck, { purpose: "observe", runVersion: "v1" }));
      delete malformed.durable_state_present;
      malformed.page_image_task_mandate.by_version["3_versions/v1"] = {
        ...created.record,
        scope: "unbounded-provider-work",
      };
      writeFileSync(path, `${JSON.stringify(malformed, null, 2)}\n`);
      const beforeInspection = readFileSync(path);
      expect(inspectCurrentPageImageTaskMandate(fixture.deck, {
        runDir: fixture.runDir,
        workflow: "framed",
      })).toMatchObject({ ok: false });
      expect(readFileSync(path)).toEqual(beforeInspection);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("records only the matching authorize node from an exact mandate-bound raw grant and repairs the handoff on replay", async () => {
    const fixture = targetFixture("pure");
    try {
      initializeTargetPageImageState(fixture.deck, {
        runVersion: "v1",
        sourceReceipt: fixture.sourceReceipt,
      });
      const mandate = ensureCurrentPageImageTaskMandate(fixture.deck, {
        runDir: fixture.runDir,
        workflow: "pure",
      });
      const plan = progressivePlan(fixture.sourceReceipt, mandate.task_mandate_sha256);
      publishProgressiveRawWorkPlan({ runDir: fixture.runDir, plan });
      recordTargetProgressiveRawPlan(fixture.deck, {
        runDir: fixture.runDir,
        progressiveRawWorkPlan: plan,
      });
      const pilot = await planProgressiveRawPilot({
        runDir: fixture.runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        slide_ids: ["DeckGo"],
        task_mandate: mandate,
      });
      const grant = await authorizeProgressiveRawBatch({
        runDir: fixture.runDir,
        workflow: "pure",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        task_mandate: mandate,
      });
      const positioned = structuredClone(readState(fixture.deck, { purpose: "observe", runVersion: "v1" }));
      delete positioned.durable_state_present;
      positioned.current_node = "authorize-target-pure-pilot";
      writeState(fixture.deck, positioned);

      const path = statePath(fixture.deck);
      const beforeCasFailure = readFileSync(path);
      const directBefore = readProgressiveRawPlanDirectRecords(fixture.runDir, { plan_sha256: plan.sha256 });
      expect(() => recordTargetProgressiveAuthorizeCliHandoff(fixture.deck, {
        runDir: fixture.runDir,
        planHash: plan.sha256,
        batchHash: pilot.batch.batch_hash,
        grantHash: grant.grant_hash,
        expectedStateSha: digest("f"),
      })).toThrow(/CONFLICT/);
      expect(readFileSync(path)).toEqual(beforeCasFailure);
      expect(readProgressiveRawPlanDirectRecords(fixture.runDir, { plan_sha256: plan.sha256 }).grants.map((entry) => entry.sha256))
        .toEqual(directBefore.grants.map((entry) => entry.sha256));

      const handoff = recordTargetProgressiveAuthorizeCliHandoff(fixture.deck, {
        runDir: fixture.runDir,
        planHash: plan.sha256,
        batchHash: pilot.batch.batch_hash,
        grantHash: grant.grant_hash,
      });
      expect(handoff).toMatchObject({
        ok: true,
        status: "completed",
        workflow: "pure",
        node_id: "authorize-target-pure-pilot",
        plan_hash: plan.sha256,
        batch_hash: pilot.batch.batch_hash,
        grant_hash: grant.grant_hash,
        task_mandate_sha256: mandate.task_mandate_sha256,
      });
      const completed = readState(fixture.deck, { purpose: "observe", runVersion: "v1" });
      expect(completed.nodes["authorize-target-pure-pilot"]).toMatchObject({
        status: "completed",
        evidence: {
          [PAGE_IMAGE_PROGRESSIVE_AUTHORIZE_CLI_EVIDENCE_KEY]: {
            met: true,
            kind: "cli",
          },
        },
      });
      const afterFirstHandoff = readFileSync(path);
      expect(recordTargetProgressiveAuthorizeCliHandoff(fixture.deck, {
        runDir: fixture.runDir,
        planHash: plan.sha256,
        batchHash: pilot.batch.batch_hash,
        grantHash: grant.grant_hash,
      })).toMatchObject({ ok: true, status: "replay" });
      expect(readFileSync(path)).toEqual(afterFirstHandoff);

      const unmatched = structuredClone(completed);
      delete unmatched.durable_state_present;
      unmatched.current_node = "review-target-pure-raw";
      writeState(fixture.deck, unmatched);
      const beforeUnmatched = readFileSync(path);
      expect(recordTargetProgressiveAuthorizeCliHandoff(fixture.deck, {
        runDir: fixture.runDir,
        planHash: plan.sha256,
        batchHash: pilot.batch.batch_hash,
        grantHash: grant.grant_hash,
      })).toMatchObject({
        ok: true,
        status: "not-applicable",
        node_id: "authorize-target-pure-pilot",
        current_node: "review-target-pure-raw",
      });
      expect(readFileSync(path)).toEqual(beforeUnmatched);

      const refinedSource = "---\nproduction:\n  pipeline: page-image-workflow\n  workflow: pure\n---\n# current same-task refinement\n";
      writeFileSync(join(fixture.runDir, "slide-specifications.md"), refinedSource);
      const refinedReceipt = {
        ...fixture.sourceReceipt,
        source_sha256: sha256(refinedSource),
      };
      advanceTargetPageImageSourceEpoch(fixture.deck, {
        runDir: fixture.runDir,
        sourceReceipt: refinedReceipt,
        expectedSourceEpoch: 1,
      });
      const refinedPlan = progressivePlan(refinedReceipt, mandate.task_mandate_sha256, 2);
      publishProgressiveRawWorkPlan({ runDir: fixture.runDir, plan: refinedPlan });
      recordTargetProgressiveRawPlan(fixture.deck, {
        runDir: fixture.runDir,
        progressiveRawWorkPlan: refinedPlan,
      });
      const refinedPilot = await planProgressiveRawPilot({
        runDir: fixture.runDir,
        workflow: "pure",
        plan_hash: refinedPlan.sha256,
        slide_ids: ["DeckGo"],
        task_mandate: mandate,
      });
      const refinedGrant = await authorizeProgressiveRawBatch({
        runDir: fixture.runDir,
        workflow: "pure",
        plan_hash: refinedPlan.sha256,
        batch_hash: refinedPilot.batch.batch_hash,
        task_mandate: mandate,
      });
      const reentered = structuredClone(readState(fixture.deck, { purpose: "observe", runVersion: "v1" }));
      delete reentered.durable_state_present;
      reentered.current_node = "authorize-target-pure-pilot";
      writeState(fixture.deck, reentered);

      const withUserEvidence = structuredClone(readState(fixture.deck, { purpose: "observe", runVersion: "v1" }));
      delete withUserEvidence.durable_state_present;
      withUserEvidence.nodes["authorize-target-pure-pilot"].evidence["manual-quality-note"] = {
        met: true,
        kind: "user",
        at: "2026-08-10T00:00:00.000Z",
      };
      writeState(fixture.deck, withUserEvidence);
      const beforeProtectedConflict = readFileSync(path);
      expect(() => recordTargetProgressiveAuthorizeCliHandoff(fixture.deck, {
        runDir: fixture.runDir,
        planHash: refinedPlan.sha256,
        batchHash: refinedPilot.batch.batch_hash,
        grantHash: refinedGrant.grant_hash,
      })).toThrow(/TARGET_PROGRESSIVE_AUTHORIZE_HANDOFF_NODE_CONFLICT/);
      expect(readFileSync(path)).toEqual(beforeProtectedConflict);

      const cliOnly = structuredClone(readState(fixture.deck, { purpose: "observe", runVersion: "v1" }));
      delete cliOnly.durable_state_present;
      delete cliOnly.nodes["authorize-target-pure-pilot"].evidence["manual-quality-note"];
      writeState(fixture.deck, cliOnly);

      expect(recordTargetProgressiveAuthorizeCliHandoff(fixture.deck, {
        runDir: fixture.runDir,
        planHash: refinedPlan.sha256,
        batchHash: refinedPilot.batch.batch_hash,
        grantHash: refinedGrant.grant_hash,
      })).toMatchObject({
        ok: true,
        status: "superseded",
        plan_hash: refinedPlan.sha256,
        batch_hash: refinedPilot.batch.batch_hash,
        grant_hash: refinedGrant.grant_hash,
      });
      expect(readProgressiveRawPlanDirectRecords(fixture.runDir, { plan_sha256: plan.sha256 }).grants)
        .toEqual(expect.arrayContaining([expect.objectContaining({ sha256: grant.grant_hash })]));
      expect(readHistory(fixture.deck)).toEqual(expect.arrayContaining([
        expect.objectContaining({
          type: "page_image_progressive_authorize_cli_handoff",
          plan_sha256: refinedPlan.sha256,
          batch_sha256: refinedPilot.batch.batch_hash,
          grant_sha256: refinedGrant.grant_hash,
          supersedes_prior_cli_grant: true,
        }),
      ]));
      expect(readState(fixture.deck, { purpose: "observe", runVersion: "v1" }).nodes["authorize-target-pure-pilot"])
        .toMatchObject({
          status: "completed",
          evidence: {
            [PAGE_IMAGE_PROGRESSIVE_AUTHORIZE_CLI_EVIDENCE_KEY]: {
              met: true,
              kind: "cli",
              note: expect.stringContaining(refinedGrant.grant_hash),
            },
          },
        });
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("keeps optional Style Master selection state separate from raw lineage and fails closed when stale or malformed", () => {
    const fixture = targetFixture("pure");
    try {
      const selection = styleSelection();
      expect(resolveEffectiveStyleMasterSelection(fixture.deck, { runDir: fixture.runDir })).toMatchObject({
        ok: false,
        code: "STYLE_MASTER_SELECTION_MISSING",
      });
      const recorded = recordEffectiveStyleMasterSelection(fixture.deck, {
        runDir: fixture.runDir,
        selection,
      });
      expect(recorded).toMatchObject({ ok: true, status: "recorded" });
      let state = readState(fixture.deck, { purpose: "observe", runVersion: "v1" });
      expect(state.page_image_style_master.by_version["3_versions/v1"]).toEqual(selection);
      expect(state.page_image_target_evidence).toBeUndefined();
      expect(resolveEffectiveStyleMasterSelection(fixture.deck, { runDir: fixture.runDir })).toMatchObject({
        ok: true,
        current: true,
        selection_sha256: recorded.selection_sha256,
      });
      expect(CONDITIONS.style_master_accepted(state, { deckDir: fixture.deck, runDir: fixture.runDir })).toBe(true);

      initializeTargetPageImageState(fixture.deck, {
        runVersion: "v1",
        sourceReceipt: fixture.sourceReceipt,
      });
      state = readState(fixture.deck, { purpose: "observe", runVersion: "v1" });
      expect(state.page_image_style_master.by_version["3_versions/v1"]).toEqual(selection);

      const staleSource = `---\nproduction:\n  pipeline: page-image-workflow\n  workflow: framed\n---\n`;
      writeFileSync(join(fixture.runDir, "slide-specifications.md"), staleSource);
      expect(resolveEffectiveStyleMasterSelection(fixture.deck, { runDir: fixture.runDir })).toMatchObject({
        ok: false,
        code: "STYLE_MASTER_SELECTION_STALE",
        current: false,
      });

      const path = statePath(fixture.deck);
      const malformed = readState(fixture.deck, { purpose: "observe", runVersion: "v1" });
      malformed.page_image_style_master.by_version["3_versions/v1"].candidate_width = 0;
      writeFileSync(path, `${JSON.stringify(malformed, null, 2)}\n`);
      const before = readFileSync(path);
      expect(validateStateReadOnly(fixture.deck, { runDir: fixture.runDir }).valid).toBe(false);
      expect(resolveEffectiveStyleMasterSelection(fixture.deck, { runDir: fixture.runDir })).toMatchObject({ ok: false });
      expect(readFileSync(path)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("rejects noncanonical selection map keys and scope bindings without normalizing state", () => {
    const cases = [
      {
        label: "noncanonical key",
        selection: styleSelection(),
        key: "v1",
      },
      {
        label: "run-version mismatch",
        selection: styleSelection("pure", "v2"),
        key: "3_versions/v1",
      },
      {
        label: "workflow mismatch",
        selection: styleSelection("framed", "v1"),
        key: "3_versions/v1",
      },
    ];
    for (const item of cases) {
      const fixture = targetFixture("pure");
      try {
        const path = statePath(fixture.deck);
        const state = readState(fixture.deck, { purpose: "observe", runVersion: "v1" });
        state.page_image_style_master = { by_version: { [item.key]: item.selection } };
        writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`);
        const before = readFileSync(path);

        expect(validateStateReadOnly(fixture.deck, { runDir: fixture.runDir })).toMatchObject({ valid: false });
        expect(resolveEffectiveStyleMasterSelection(fixture.deck, { runDir: fixture.runDir })).toMatchObject({ ok: false, current: false });
        expect(CONDITIONS.style_master_accepted(readState(fixture.deck, { purpose: "observe" }), {
          deckDir: fixture.deck,
          runDir: fixture.runDir,
        })).toBe(false);
        expect(readFileSync(path)).toEqual(before);
      } finally {
        rmSync(fixture.root, { recursive: true, force: true });
      }
    }
  });

  it("does not let an undeclared Style Master selection or unselected asset satisfy current readiness", () => {
    const fixture = targetFixture("pure");
    try {
      const undeclaredSelection = {
        ...styleSelection(),
        schema: "unrecognized-style-master-selection",
      };
      const state = structuredClone(readState(fixture.deck, { purpose: "observe", runVersion: "v1" }));
      delete state.durable_state_present;
      state.page_image_style_master = { by_version: { "3_versions/v1": undeclaredSelection } };

      expect(resolveEffectiveStyleMasterSelection(fixture.deck, {
        runDir: fixture.runDir,
        state,
      })).toMatchObject({
        ok: false,
        code: "STYLE_MASTER_SELECTION_STALE",
        current: false,
      });
      expect(CONDITIONS.style_master_accepted(state, {
        deckDir: fixture.deck,
        runDir: fixture.runDir,
      })).toBe(false);

      writeFileSync(join(fixture.deck, "2_backbone", "visual-style", "style_master.jpg"), "unselected asset", "utf8");
      const path = statePath(fixture.deck);
      writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`);
      const before = readFileSync(path);

      expect(readState(fixture.deck, { purpose: "observe", runVersion: "v1" })).toMatchObject({
        replacement_required: true,
        code: "replacement_required",
      });
      expect(validateStateReadOnly(fixture.deck, { runDir: fixture.runDir })).toMatchObject({ valid: false });
      expect(CONDITIONS.style_master_accepted(readState(fixture.deck, { purpose: "observe" }), {
        deckDir: fixture.deck,
        runDir: fixture.runDir,
      })).toBe(false);
      expect(readFileSync(path)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("records source, authorization, raw evidence, final manifest, and delivery in one current state record", () => {
    const fixture = targetFixture();
    try {
      const plan = rawPlan(fixture.sourceReceipt);
      const beforeInitialization = readFileSync(statePath(fixture.deck));
      expect(() => recordPageImageRawProviderAuthorization(fixture.deck, {
        runVersion: "v1",
        rawWorkPlan: plan,
        maxSubmissions: 1,
      })).toThrow("TARGET_STATE_INITIALIZATION_REQUIRED");
      expect(readFileSync(statePath(fixture.deck))).toEqual(beforeInitialization);

      initializeTargetPageImageState(fixture.deck, {
        runVersion: "v1",
        sourceReceipt: fixture.sourceReceipt,
      });
      const authorization = recordPageImageRawProviderAuthorization(fixture.deck, {
        runVersion: "v1",
        rawWorkPlan: plan,
        maxSubmissions: 1,
      });
      const evidence = createAcceptedRawEvidence({
        plan,
        provider_authorization_sha256: canonicalJsonSha256(authorization.record),
        raw_review_sha256: digest("e"),
        raw_bytes_by_slide: { DeckGo: Buffer.from("raw") },
      });
      recordTargetAcceptedRawEvidence(fixture.deck, {
        runVersion: "v1",
        rawWorkPlan: plan,
        acceptedRawEvidence: evidence,
      });
      const finalManifest = createFinalSlideManifest({
        evidence,
        expected_workflow: "pure",
        final_bytes_by_slide: { DeckGo: Buffer.from("final") },
      });
      recordTargetFinalManifest(fixture.deck, {
        runVersion: "v1",
        acceptedRawEvidence: evidence,
        finalManifest,
      });
      recordTargetDeliveryReceipt(fixture.deck, {
        runVersion: "v1",
        deliveryReceipt: {
          schema: "page-image-delivery-receipt",
          source_epoch: 1,
          final_manifest_sha256: finalManifest.sha256,
          delivery_media_manifest_sha256: digest("a"),
        },
      });

      const record = readState(fixture.deck, { purpose: "observe", runVersion: "v1" })
        .page_image_target_evidence.by_version["3_versions/v1"];
      expect(record).toMatchObject({
        workflow: "pure",
        source_epoch: 1,
        source_receipt_sha256: fixture.sourceReceipt.source_sha256,
        provider_authorization_sha256: canonicalJsonSha256(authorization.record),
        accepted_raw_evidence_sha256: evidence.sha256,
        final_manifest_sha256: finalManifest.sha256,
      });
      expect(record.delivery_receipt_sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(inspectTargetPageImageState(fixture.deck, {
        runVersion: "v1",
        sourceReceipt: fixture.sourceReceipt,
      })).toMatchObject({ ok: true, workflow: "pure", source_epoch: 1 });
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("starts a fresh same-workflow source epoch before a selected raw rebuild", () => {
    const fixture = targetFixture();
    try {
      const plan = rawPlan(fixture.sourceReceipt);
      initializeTargetPageImageState(fixture.deck, {
        runVersion: "v1",
        sourceReceipt: fixture.sourceReceipt,
      });
      recordPageImageRawProviderAuthorization(fixture.deck, {
        runVersion: "v1",
        rawWorkPlan: plan,
        maxSubmissions: 1,
      });
      const nextSource = `---\nproduction:\n  pipeline: page-image-workflow\n  workflow: pure\n---\n# revised raw source\n`;
      writeFileSync(join(fixture.runDir, "slide-specifications.md"), nextSource);
      const nextReceipt = {
        ...fixture.sourceReceipt,
        source_sha256: sha256(nextSource),
      };

      const advanced = advanceTargetPageImageSourceEpoch(fixture.deck, {
        runVersion: "v1",
        sourceReceipt: nextReceipt,
        expectedSourceEpoch: 1,
      });
      expect(advanced).toMatchObject({ ok: true, previous_source_epoch: 1, source_epoch: 2 });
      const state = readState(fixture.deck, { purpose: "observe", runVersion: "v1" });
      expect(state.production_identity.by_version["3_versions/v1"]).toEqual({
        workflow: "pure",
        source_epoch: 2,
      });
      expect(state.page_image_target_evidence.by_version["3_versions/v1"]).toEqual({
        schema: "page-image-workflow-target-state",
        run_version: "v1",
        source_epoch: 2,
        source_receipt_sha256: nextReceipt.source_sha256,
        workflow: "pure",
        provider_authorization_sha256: null,
        accepted_raw_evidence_sha256: null,
        final_manifest_sha256: null,
        delivery_receipt_sha256: null,
      });
      expect(state.page_image_raw_provider_authorization?.by_version?.["3_versions/v1"]).toBeUndefined();

      const beforeRepeat = readFileSync(statePath(fixture.deck));
      expect(() => advanceTargetPageImageSourceEpoch(fixture.deck, {
        runVersion: "v1",
        sourceReceipt: nextReceipt,
        expectedSourceEpoch: 2,
      })).toThrow("TARGET_SOURCE_TRANSITION_INVALID");
      expect(readFileSync(statePath(fixture.deck))).toEqual(beforeRepeat);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("rejects malformed target evidence during read-only validation without changing persisted bytes", () => {
    const fixture = targetFixture("framed");
    try {
      initializeTargetPageImageState(fixture.deck, {
        runVersion: "v1",
        sourceReceipt: fixture.sourceReceipt,
      });
      const path = statePath(fixture.deck);
      const state = readState(fixture.deck, { purpose: "observe", runVersion: "v1" });
      state.page_image_target_evidence.by_version["3_versions/v1"].workflow = "mixed";
      writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`);
      const before = readFileSync(path);
      expect(validateStateReadOnly(fixture.deck, { runDir: fixture.runDir }).valid).toBe(false);
      expect(inspectTargetPageImageState(fixture.deck, { runVersion: "v1" })).toMatchObject({
        ok: false,
        code: "STATE_UNAVAILABLE",
      });
      expect(readFileSync(path)).toEqual(before);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("hard-stops a missing workflow or source/state mismatch before target state publication", () => {
    const missingWorkflow = targetFixture("pure");
    const mismatch = targetFixture("pure");
    try {
      const missingPath = join(missingWorkflow.runDir, "slide-specifications.md");
      writeFileSync(missingPath, "---\nproduction:\n  pipeline: page-image-workflow\n---\n");
      const missingBefore = readFileSync(statePath(missingWorkflow.deck));
      expect(inspectTargetPageImageState(missingWorkflow.deck, { runVersion: "v1" })).toMatchObject({
        ok: false,
        kind: "hard-stop",
        code: "STATE_UNAVAILABLE",
        next_action: "repair_target_source_state",
      });
      expect(readFileSync(statePath(missingWorkflow.deck))).toEqual(missingBefore);

      const mismatchSource = "---\nproduction:\n  pipeline: page-image-workflow\n  workflow: framed\n---\n";
      writeFileSync(join(mismatch.runDir, "slide-specifications.md"), mismatchSource);
      const mismatchReceipt = {
        ...mismatch.sourceReceipt,
        workflow: "framed",
        source_sha256: sha256(mismatchSource),
        slides: [{ slide_id: "DeckGo", position: 1 }],
      };
      const mismatchBefore = readFileSync(statePath(mismatch.deck));
      expect(() => initializeTargetPageImageState(mismatch.deck, {
        runVersion: "v1",
        sourceReceipt: mismatchReceipt,
      })).toThrow("IDENTITY_SOURCE_MISMATCH");
      expect(readFileSync(statePath(mismatch.deck))).toEqual(mismatchBefore);
    } finally {
      rmSync(missingWorkflow.root, { recursive: true, force: true });
      rmSync(mismatch.root, { recursive: true, force: true });
    }
  });

  it("keeps a malformed or retired identity record byte-identical before target publication", () => {
    const malformed = targetFixture("pure");
    const retired = targetFixture("pure");
    try {
      for (const [value, record] of [
        [malformed, { workflow: "pure", source_epoch: "1" }],
        [retired, { mode: "image2-page-workflow", workflow: "pure", source_epoch: 1 }],
      ]) {
        const state = readState(value.deck, { purpose: "observe", runVersion: "v1" });
        state.production_identity.by_version["3_versions/v1"] = record;
        writeFileSync(statePath(value.deck), `${JSON.stringify(state, null, 2)}\n`);
        const before = readFileSync(statePath(value.deck));
        expect(() => initializeTargetPageImageState(value.deck, {
          runVersion: "v1",
          sourceReceipt: value.sourceReceipt,
        })).toThrow("STATE_UNAVAILABLE");
        expect(readFileSync(statePath(value.deck))).toEqual(before);
      }
    } finally {
      rmSync(malformed.root, { recursive: true, force: true });
      rmSync(retired.root, { recursive: true, force: true });
    }
  });

  it("retains the confirmed version-scoped authorization when scope or raw evidence is invalid", () => {
    const fixture = targetFixture();
    try {
      const plan = rawPlan(fixture.sourceReceipt);
      initializeTargetPageImageState(fixture.deck, {
        runVersion: "v1",
        sourceReceipt: fixture.sourceReceipt,
      });
      const authorization = recordPageImageRawProviderAuthorization(fixture.deck, {
        runVersion: "v1",
        rawWorkPlan: plan,
        maxSubmissions: 1,
      });
      const authorizationDigest = canonicalJsonSha256(authorization.record);
      expect(inspectPageImageRawProviderAuthorization(fixture.deck, {
        runVersion: "v1",
        rawWorkPlan: plan,
        maxSubmissions: 1,
      })).toMatchObject({ ok: true, record: authorization.record });

      const invalidScope = { ...plan, authorization_scope_sha256: "not-a-sha256" };
      const beforeInvalidScope = readFileSync(statePath(fixture.deck));
      expect(() => recordPageImageRawProviderAuthorization(fixture.deck, {
        runVersion: "v1",
        rawWorkPlan: invalidScope,
        maxSubmissions: 1,
      })).toThrow("rawWorkPlan must be a non-empty canonical Page Image raw input");
      expect(readFileSync(statePath(fixture.deck))).toEqual(beforeInvalidScope);

      const staleEvidence = createAcceptedRawEvidence({
        plan,
        provider_authorization_sha256: digest("f"),
        raw_review_sha256: digest("e"),
        raw_bytes_by_slide: { DeckGo: Buffer.from("stale raw") },
      });
      const beforeStaleEvidence = readFileSync(statePath(fixture.deck));
      expect(() => recordTargetAcceptedRawEvidence(fixture.deck, {
        runVersion: "v1",
        rawWorkPlan: plan,
        acceptedRawEvidence: staleEvidence,
      })).toThrow("TARGET_RAW_EVIDENCE_LINEAGE_MISMATCH");
      expect(readFileSync(statePath(fixture.deck))).toEqual(beforeStaleEvidence);

      const persisted = readState(fixture.deck, { purpose: "observe", runVersion: "v1" });
      expect(persisted.page_image_raw_provider_authorization.by_version["3_versions/v1"])
        .toEqual(authorization.record);
      expect(persisted.page_image_target_evidence.by_version["3_versions/v1"])
        .toMatchObject({ provider_authorization_sha256: authorizationDigest, accepted_raw_evidence_sha256: null });
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("fences direct raw authorization and evidence paths once a progressive handoff is current", () => {
    const fixture = targetFixture();
    try {
      const directPlan = rawPlan(fixture.sourceReceipt);
      initializeTargetPageImageState(fixture.deck, {
        runVersion: "v1",
        sourceReceipt: fixture.sourceReceipt,
      });
      const authorization = recordPageImageRawProviderAuthorization(fixture.deck, {
        runVersion: "v1",
        rawWorkPlan: directPlan,
        maxSubmissions: 1,
      });
      const plan = progressivePlan(fixture.sourceReceipt);
      recordTargetProgressiveRawPlan(fixture.deck, {
        runVersion: "v1",
        progressiveRawWorkPlan: plan,
      });
      recordTargetProgressivePilotDecision(fixture.deck, {
        runVersion: "v1",
        progressiveRawWorkPlan: plan,
        pilotDecisionSha256: digest("e"),
      });
      recordTargetProgressiveCompleteRawReview(fixture.deck, {
        runVersion: "v1",
        progressiveRawWorkPlan: plan,
        completeRawReviewSha256: digest("f"),
      });

      expect(readTargetProgressiveHandoff(fixture.deck, { runVersion: "v1" })).toMatchObject({
        raw_work_plan_sha256: plan.sha256,
        partial_pilot_decision_sha256: digest("e"),
        complete_raw_review_sha256: digest("f"),
        accepted_raw_evidence_sha256: null,
        final_manifest_sha256: null,
        delivery_receipt_sha256: null,
      });
      expect(inspectPageImageRawProviderAuthorization(fixture.deck, {
        runVersion: "v1",
        rawWorkPlan: directPlan,
        maxSubmissions: 1,
      })).toMatchObject({ ok: false, code: "TARGET_PROGRESSIVE_RAW_OWNER_REQUIRED" });
      expect(inspectTargetPageImageState(fixture.deck, { runVersion: "v1" }))
        .toMatchObject({ ok: false, code: "TARGET_PROGRESSIVE_RAW_OWNER_REQUIRED" });

      const directEvidence = createAcceptedRawEvidence({
        plan: directPlan,
        provider_authorization_sha256: canonicalJsonSha256(authorization.record),
        raw_review_sha256: digest("a"),
        raw_bytes_by_slide: { DeckGo: Buffer.from("direct evidence") },
      });
      const before = readFileSync(statePath(fixture.deck));
      expect(() => recordPageImageRawProviderAuthorization(fixture.deck, {
        runVersion: "v1",
        rawWorkPlan: directPlan,
        maxSubmissions: 1,
      })).toThrow("TARGET_PROGRESSIVE_RAW_OWNER_REQUIRED");
      expect(() => recordTargetAcceptedRawEvidence(fixture.deck, {
        runVersion: "v1",
        rawWorkPlan: directPlan,
        acceptedRawEvidence: directEvidence,
      })).toThrow("TARGET_PROGRESSIVE_RAW_OWNER_REQUIRED");
      expect(readFileSync(statePath(fixture.deck))).toEqual(before);
      expect(readState(fixture.deck, { purpose: "observe", runVersion: "v1" })
        .page_image_raw_provider_authorization.by_version["3_versions/v1"])
        .toEqual(authorization.record);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("rejects a delivery lineage mismatch without replacing the target final record", () => {
    const fixture = targetFixture();
    try {
      const plan = rawPlan(fixture.sourceReceipt);
      initializeTargetPageImageState(fixture.deck, {
        runVersion: "v1",
        sourceReceipt: fixture.sourceReceipt,
      });
      const authorization = recordPageImageRawProviderAuthorization(fixture.deck, {
        runVersion: "v1",
        rawWorkPlan: plan,
        maxSubmissions: 1,
      });
      const evidence = createAcceptedRawEvidence({
        plan,
        provider_authorization_sha256: canonicalJsonSha256(authorization.record),
        raw_review_sha256: digest("e"),
        raw_bytes_by_slide: { DeckGo: Buffer.from("raw") },
      });
      recordTargetAcceptedRawEvidence(fixture.deck, {
        runVersion: "v1",
        rawWorkPlan: plan,
        acceptedRawEvidence: evidence,
      });
      const finalManifest = createFinalSlideManifest({
        evidence,
        expected_workflow: "pure",
        final_bytes_by_slide: { DeckGo: Buffer.from("final") },
      });
      recordTargetFinalManifest(fixture.deck, {
        runVersion: "v1",
        acceptedRawEvidence: evidence,
        finalManifest,
      });

      const beforeMismatch = readFileSync(statePath(fixture.deck));
      expect(() => recordTargetDeliveryReceipt(fixture.deck, {
        runVersion: "v1",
        deliveryReceipt: {
          schema: "page-image-delivery-receipt",
          source_epoch: 1,
          final_manifest_sha256: finalManifest.sha256,
        },
      })).toThrow("TARGET_DELIVERY_RECEIPT_INVALID");
      expect(readFileSync(statePath(fixture.deck))).toEqual(beforeMismatch);
      expect(() => recordTargetDeliveryReceipt(fixture.deck, {
        runVersion: "v1",
        deliveryReceipt: {
          schema: "page-image-delivery-receipt",
          source_epoch: 1,
          final_manifest_sha256: digest("9"),
          delivery_media_manifest_sha256: digest("a"),
        },
      })).toThrow("TARGET_DELIVERY_LINEAGE_MISMATCH");
      expect(readFileSync(statePath(fixture.deck))).toEqual(beforeMismatch);
      expect(readState(fixture.deck, { purpose: "observe", runVersion: "v1" })
        .page_image_target_evidence.by_version["3_versions/v1"])
        .toMatchObject({ final_manifest_sha256: finalManifest.sha256, delivery_receipt_sha256: null });
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
