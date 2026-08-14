import { beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { createAcceptedRawEvidence } from "../../ppt_maker_harness/scripts/shared/image2/page_image_artifacts.mjs";
import { resolveContentAddressName } from "../../ppt_maker_harness/scripts/shared/image2/content_address_store.mjs";

const pureResolverControls = vi.hoisted(() => ({
  null_provider_clauses: false,
  tamper_identity_clause: false,
}));

vi.mock("../../ppt_maker_harness/scripts/02-visual-system/index.mjs", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createPageImageSourceResolver(...args) {
      const resolver = actual.createPageImageSourceResolver(...args);
      return Object.freeze({
        resolveSelection(context) {
          const selection = resolver.resolveSelection(context);
          const identityReference = pureResolverControls.tamper_identity_clause && selection.identity_reference
            ? Object.freeze({
              ...selection.identity_reference,
              provider_reference: Object.freeze({
                ...selection.identity_reference.provider_reference,
                role_clause: "tampered identity clause",
              }),
            })
            : selection.identity_reference;
          return Object.freeze({
            ...selection,
            ...(pureResolverControls.null_provider_clauses ? { provider_clauses: null } : {}),
            identity_reference: identityReference,
          });
        },
      });
    },
  };
});
import { canonicalJson, canonicalJsonSha256 } from "../../ppt_maker_harness/scripts/shared/identity/canonical_json.mjs";
import { sha256Bytes } from "../../ppt_maker_harness/scripts/shared/identity/byte_hash.mjs";
import { prepareFramedProgressivePilotReview } from "../../ppt_maker_harness/scripts/03-framed-image/index.mjs";
import {
  classifyPureRefresh,
  createPureRawWorkPlan,
  publishPureFinalSlideManifest,
  readPureTargetStoredPlanContext,
  authorizePureTargetRawPlan,
  authorizePureProgressiveRawBatch,
  acceptPureProgressivePilot,
  acceptPureProgressiveRawReview,
  buildPureTargetDelivery,
  buildPureProgressiveTargetDelivery,
  buildPureTargetRawPlan,
  buildPureProgressiveTargetRawPlan,
  decidePureTargetRawReview,
  generatePureProgressiveRawItem,
  generatePureTargetRawPlan,
  planPureTargetExpansion,
  planPureTargetPilot,
  preparePureProgressivePilotReview,
  preparePureProgressiveRawReview,
  preparePureTargetRawReview,
  refreshPureTargetNotes,
  resolvePureStyleMasterScope,
  validatePureRawContract,
} from "../../ppt_maker_harness/scripts/04-pure-image/index.mjs";
import { initBundle } from "../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { pageImageDerivedPagePaths, pageImageWorkflowPaths } from "../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import { readState } from "../../ppt_maker_harness/scripts/shared/state/state.mjs";
import { targetPageImageSubmitFactory } from "../../ppt_maker_harness/scripts/ppt_flow.mjs";
import {
  readProgressiveAcceptedRawWork,
} from "../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_raw_owner.mjs";
import {
  readProgressiveRawPlanDirectRecords,
} from "../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_store.mjs";
import { acceptLocalStyleMasterFixture } from "../helpers/accepted_style_master.mjs";
import {
  TEST_IDENTITY_REFERENCE,
  allowTestIdentitySubjectClass,
  writeTestIdentityReference,
} from "../helpers/page_image_identity_reference_fixture.mjs";

const digest = (letter) => letter.repeat(64);

function pureProviderInputBinding(compiled = "a") {
  return {
    compiled_provider_input_sha256: digest(compiled),
    provider_content_sha256: digest("b"),
    visual_selection_sha256: digest("c"),
    style_master_selection_sha256: digest("d"),
    generation_profile_sha256: digest("e"),
    header_policy_sha256: digest("f"),
    page_presentation_sha256: digest("9"),
    local_header_profile_sha256: null,
    protected_composition_sha256: null,
  };
}
const NATIVE_PROVIDER_PNG = (() => {
  const image = createCanvas(2048, 1136);
  image.getContext("2d").fillRect(0, 0, 2048, 1136);
  return image.toBuffer("image/png");
})();

function receipt(source = "a") {
  return {
    schema: "page-source-receipt",
    artifact_role: "parsed-source", pipeline: "page-image-workflow", workflow: "pure", source_sha256: digest(source),
    slides: [{ slide_id: "DeckGo", position: 1, subject_restrictions: "none", display: { title: "Visible pure text" } }],
  };
}

describe("Pure target workflow", () => {
  beforeEach(() => {
    pureResolverControls.null_provider_clauses = false;
    pureResolverControls.tamper_identity_clause = false;
  });

  it("rejects a Framed receipt before creating target work", () => {
    expect(() => createPureRawWorkPlan({
      receipt: { ...receipt(), workflow: "framed" },
      provider_profile_sha256: digest("b"),
      authorization_scope_sha256: digest("c"),
      raw_contracts_by_slide: { DeckGo: digest("d") },
    })).toThrow(/Pure workflow requires/);
  });

  it("publishes accepted Pure raw bytes directly as a common manifest", () => {
    const source = receipt();
    const rawWorkPlan = createPureRawWorkPlan({
      receipt: source,
      provider_profile_sha256: digest("b"),
      authorization_scope_sha256: digest("c"),
      raw_contracts_by_slide: { DeckGo: digest("d") },
      provider_input_bindings_by_slide: { DeckGo: pureProviderInputBinding() },
    });
    const acceptedRawEvidence = createAcceptedRawEvidence({ plan: rawWorkPlan, provider_authorization_sha256: digest("e"), raw_review_sha256: digest("f"), raw_bytes_by_slide: { DeckGo: NATIVE_PROVIDER_PNG } });
    expect(publishPureFinalSlideManifest({ receipt: source, rawWorkPlan, acceptedRawEvidence, rawBytesBySlide: { DeckGo: NATIVE_PROVIDER_PNG } })).toMatchObject({
      workflow: "pure",
      items: [{ final_sha256: acceptedRawEvidence.items[0].raw_sha256 }],
    });
  });

  it("preserves a non-default provider-native PNG and rejects evidence drift", () => {
    const source = receipt();
    const rawWorkPlan = createPureRawWorkPlan({
      receipt: source,
      provider_profile_sha256: digest("b"),
      authorization_scope_sha256: digest("c"),
      raw_contracts_by_slide: { DeckGo: digest("d") },
      provider_input_bindings_by_slide: { DeckGo: pureProviderInputBinding() },
    });
    const providerNative = createCanvas(1684, 934).toBuffer("image/png");
    const acceptedRawEvidence = createAcceptedRawEvidence({ plan: rawWorkPlan, provider_authorization_sha256: digest("e"), raw_review_sha256: digest("f"), raw_bytes_by_slide: { DeckGo: providerNative } });
    expect(publishPureFinalSlideManifest({
      receipt: source,
      rawWorkPlan,
      acceptedRawEvidence,
      rawBytesBySlide: { DeckGo: providerNative },
    })).toMatchObject({
      items: [{
        final_sha256: acceptedRawEvidence.items[0].raw_sha256,
        width: 1684,
        height: 934,
      }],
    });
    const framedFinal = createCanvas(2000, 1125).toBuffer("image/png");
    expect(() => publishPureFinalSlideManifest({
      receipt: source,
      rawWorkPlan,
      acceptedRawEvidence,
      rawBytesBySlide: { DeckGo: framedFinal },
    })).toThrow(/drifted from accepted raw evidence/);
  });

  it("classifies visible-text source changes as raw rebuild debt", () => {
    expect(classifyPureRefresh({ previousReceipt: receipt("a"), nextReceipt: receipt("b") })).toMatchObject({ kind: "rebuild_raw", provider_required: true });
  });

  it("validates the canonical Pure clause shape and preserves its digest in the plan", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-raw-contract-validation-"));
    const deck = join(root, "deck_pure_raw_contract_validation");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Validate raw contract
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));

      const plan = buildPureTargetRawPlan(runDir);
      const rawContract = plan.provider_requests_by_slide.DeckGo.raw_contract;
      const expectedDigest = plan.raw_work_plan.items.find((item) => item.slide_id === "DeckGo").raw_contract_sha256;
      expect(validatePureRawContract(rawContract)).toEqual({ ok: true, raw_contract_sha256: expectedDigest });

      const clauses = rawContract.provider_clauses;
      const malformedClauses = [
        null,
        { recipe: clauses.recipe, composition: clauses.composition },
        { ...clauses, unexpected: "extra" },
        { ...clauses, recipe: "   " },
        { ...clauses, motifs: [42] },
      ];
      for (const providerClauses of malformedClauses) {
        expect(validatePureRawContract({ ...structuredClone(rawContract), provider_clauses: providerClauses }))
          .toMatchObject({ ok: false, code: "pure_raw_contract_invalid" });
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("stops a malformed Pure clause record before source or raw-plan materialization", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-raw-contract-hard-stop-"));
    const deck = join(root, "deck_pure_raw_contract_hard_stop");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Reject malformed clauses
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
      const paths = pageImageWorkflowPaths(runDir);
      const stateBefore = readFileSync(join(deck, "_state", "state.yaml"));

      pureResolverControls.null_provider_clauses = true;
      const error = (() => {
        try {
          buildPureTargetRawPlan(runDir);
        } catch (value) {
          return value;
        }
        throw new Error("expected Pure raw planning to fail");
      })();

      expect(error).toMatchObject({ code: "pure_raw_contract_invalid" });
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);
      expect(existsSync(paths.target_source_receipt)).toBe(false);
      expect(existsSync(paths.target_raw_plan)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("compiles a semantic Pure identity and rejects malformed raw identity facts", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-identity-provider-input-"));
    const deck = join(root, "deck_pure_identity_provider_input");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Identity-bearing Pure page
**VISUAL IDENTITY**: ${TEST_IDENTITY_REFERENCE.profile}/${TEST_IDENTITY_REFERENCE.role}
**IDENTITY SUBJECT COUNT**: one
**SUBJECT RESTRICTIONS**: none
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

## Slide 02: \`FlowGo\`

**TITLE**: Identity-free Pure control
**IDENTITY SUBJECT COUNT**: none
**SUBJECT RESTRICTIONS**: none
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      allowTestIdentitySubjectClass(deck);
      const reference = writeTestIdentityReference(deck);
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));

      const plan = buildPureTargetRawPlan(runDir);
      const identityRequest = plan.provider_requests_by_slide.DeckGo;
      const identityContract = identityRequest.raw_contract;
      const identityInput = JSON.parse(identityRequest.compiled_provider_input.utf8);
      const noIdentityInput = JSON.parse(plan.provider_requests_by_slide.FlowGo.compiled_provider_input.utf8);
      const expectedProviderIdentity = {
        profile: TEST_IDENTITY_REFERENCE.profile,
        role: TEST_IDENTITY_REFERENCE.role,
        subject_class: TEST_IDENTITY_REFERENCE.subject_class,
        identity_subject_count: "one",
        subject_restrictions: "none",
        role_clause: reference.role_clause,
      };

      expect(identityContract.visual_identity).toEqual({
        profile: TEST_IDENTITY_REFERENCE.profile,
        role: TEST_IDENTITY_REFERENCE.role,
        reference_sha256: reference.reference_sha256,
        role_clause_sha256: reference.role_clause_sha256,
        subject_class: TEST_IDENTITY_REFERENCE.subject_class,
        identity_subject_count: "one",
        subject_restrictions: "none",
      });
      expect(identityContract.visual_identity_role_clause).toBe(reference.role_clause);
      expect(identityInput.visual.identity).toEqual(expectedProviderIdentity);
      expect(identityInput.visual.identity).not.toHaveProperty("reference_sha256");
      expect(identityInput.visual.identity).not.toHaveProperty("role_clause_sha256");
      expect(identityInput.visual.identity).not.toHaveProperty("path");
      expect(noIdentityInput.visual.identity).toBeNull();

      const paths = pageImageWorkflowPaths(runDir);
      const legacyInputUtf8 = canonicalJson({
        ...identityInput,
        visual: { ...identityInput.visual, identity: identityContract.visual_identity },
      });
      const legacyBindings = Object.fromEntries(plan.raw_work_plan.items.map((item) => [
        item.slide_id,
        item.slide_id === "DeckGo"
          ? { ...item.provider_input_binding, compiled_provider_input_sha256: sha256Bytes(Buffer.from(legacyInputUtf8, "utf8")) }
          : item.provider_input_binding,
      ]));
      const legacyPlan = createPureRawWorkPlan({
        receipt: plan.receipt,
        provider_profile_sha256: plan.raw_work_plan.provider_profile_sha256,
        authorization_scope_sha256: plan.raw_work_plan.authorization_scope_sha256,
        raw_contracts_by_slide: Object.fromEntries(plan.raw_work_plan.items.map((item) => [item.slide_id, item.raw_contract_sha256])),
        provider_input_bindings_by_slide: legacyBindings,
      });
      const historicalEvidence = createAcceptedRawEvidence({
        plan: legacyPlan,
        provider_authorization_sha256: "c".repeat(64),
        raw_review_sha256: "d".repeat(64),
        raw_bytes_by_slide: { DeckGo: NATIVE_PROVIDER_PNG, FlowGo: NATIVE_PROVIDER_PNG },
      });
      const historicalBefore = structuredClone(historicalEvidence);
      expect(classifyPureRefresh({
        previousReceipt: plan.receipt,
        nextReceipt: plan.receipt,
        rawWorkPlan: legacyPlan,
        nextRawWorkPlan: plan.raw_work_plan,
        acceptedRawEvidence: historicalEvidence,
      })).toMatchObject({ kind: "rebuild_raw", reason: "compiled_provider_input_drift" });
      expect(historicalEvidence).toEqual(historicalBefore);

      const currentPlanBytes = readFileSync(paths.target_raw_plan);
      const stateBeforeLegacyPreflight = readFileSync(join(deck, "_state", "state.yaml"));
      writeFileSync(paths.target_raw_plan, JSON.stringify(legacyPlan));
      const readLegacy = (() => {
        try {
          readPureTargetStoredPlanContext(runDir);
        } catch (error) {
          return error;
        }
        throw new Error("expected retained projection-only plan to be stale");
      })();
      expect(readLegacy).toMatchObject({ code: "target_raw_plan_stale" });
      const authorizeLegacy = (() => {
        try {
          authorizePureTargetRawPlan(runDir, { planHash: legacyPlan.sha256 });
        } catch (error) {
          return error;
        }
        throw new Error("expected authorization to reject the retained projection-only plan");
      })();
      expect(authorizeLegacy).toMatchObject({ code: "target_raw_plan_stale" });
      let staleSubmitCalls = 0;
      await expect(generatePureTargetRawPlan(runDir, {
        planHash: legacyPlan.sha256,
        submit: async () => {
          staleSubmitCalls += 1;
          return NATIVE_PROVIDER_PNG;
        },
      })).rejects.toMatchObject({ code: "target_raw_plan_stale" });
      expect(staleSubmitCalls).toBe(0);
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBeforeLegacyPreflight);
      writeFileSync(paths.target_raw_plan, currentPlanBytes);

      const progressive = buildPureProgressiveTargetRawPlan(runDir);
      const progressiveIdentityRequest = progressive.provider_requests_by_slide.DeckGo;
      const derivedIdentity = JSON.parse(readFileSync(pageImageDerivedPagePaths(runDir, "DeckGo").image2_request, "utf8"));
      const inspection = JSON.parse(readFileSync(paths.target_provider_request_inspection, "utf8"));
      expect(derivedIdentity.payload).toMatchObject({
        canonical_utf8: progressiveIdentityRequest.compiled_provider_input.utf8,
        request_digest: progressiveIdentityRequest.compiled_provider_input.sha256,
      });
      expect(progressiveIdentityRequest.compiled_provider_input).toEqual(identityRequest.compiled_provider_input);
      expect(JSON.parse(inspection.items.find((item) => item.slide_id === "DeckGo").prompt)).toEqual(progressiveIdentityRequest);

      const registry = readFileSync(reference.registry_path, "utf8");
      writeFileSync(reference.registry_path, registry.replace(reference.role_clause, "one drifted light-form waits quietly"));
      const providerBodies = [];
      const submit = targetPageImageSubmitFactory(plan, {
        credentialResolver: () => ({ base_url: "https://image.example", api_key: "test-key" }),
        fetchImpl: async (_url, options) => {
          providerBodies.push(JSON.parse(options.body));
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ data: [{ b64_json: NATIVE_PROVIDER_PNG.toString("base64") }] }),
          };
        },
      });
      await submit({
        request: identityRequest,
        item: { slide_id: "DeckGo" },
        provider_idempotency_key: `page-image-workflow-${"a".repeat(64)}`,
      });
      await submit({
        request: plan.provider_requests_by_slide.FlowGo,
        item: { slide_id: "FlowGo" },
        provider_idempotency_key: `page-image-workflow-${"b".repeat(64)}`,
      });

      const [identityBody, noIdentityBody] = providerBodies;
      expect(identityBody.prompt).toBe(identityRequest.compiled_provider_input.utf8);
      expect(identityBody.prompt).not.toContain("one drifted light-form waits quietly");
      expect(JSON.parse(identityBody.prompt).visual.identity).toEqual(expectedProviderIdentity);
      expect(identityBody.images).toEqual([
        `data:image/png;base64,${plan.style_master_reference.bytes.toString("base64")}`,
        `data:image/png;base64,${readFileSync(reference.reference_path).toString("base64")}`,
      ]);
      expect(noIdentityBody.prompt).toBe(plan.provider_requests_by_slide.FlowGo.compiled_provider_input.utf8);
      expect(JSON.parse(noIdentityBody.prompt).visual.identity).toBeNull();
      expect(noIdentityBody.images).toEqual([
        `data:image/png;base64,${plan.style_master_reference.bytes.toString("base64")}`,
      ]);

      const invalidContracts = [
        (candidate) => { candidate.visual_identity_role_clause = null; },
        (candidate) => { candidate.visual_identity = null; },
        (candidate) => { delete candidate.visual_identity.role; },
        (candidate) => { candidate.visual_identity.unexpected = "extra"; },
        (candidate) => { candidate.visual_identity.profile = "UpperCase"; },
        (candidate) => { candidate.visual_identity.reference_sha256 = "A".repeat(64); },
        (candidate) => { candidate.visual_identity.identity_subject_count = "none"; },
        (candidate) => { candidate.visual_identity.subject_restrictions = "unsupported"; },
        (candidate) => { candidate.visual_identity_role_clause = "tampered identity clause"; },
      ];
      for (const mutate of invalidContracts) {
        const candidate = structuredClone(identityContract);
        mutate(candidate);
        expect(validatePureRawContract(candidate)).toMatchObject({
          ok: false,
          code: "pure_raw_contract_invalid",
        });
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("hard-stops a tampered Pure identity before publication and recovers at the same checkpoint", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-identity-hard-stop-"));
    const deck = join(root, "deck_pure_identity_hard_stop");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Reject tampered identity
**VISUAL IDENTITY**: ${TEST_IDENTITY_REFERENCE.profile}/${TEST_IDENTITY_REFERENCE.role}
**IDENTITY SUBJECT COUNT**: one
**SUBJECT RESTRICTIONS**: none
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      allowTestIdentitySubjectClass(deck);
      writeTestIdentityReference(deck);
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
      const paths = pageImageWorkflowPaths(runDir);
      const stateBefore = readFileSync(join(deck, "_state", "state.yaml"));

      pureResolverControls.tamper_identity_clause = true;
      expect(() => buildPureTargetRawPlan(runDir)).toThrow(expect.objectContaining({
        code: "pure_raw_contract_invalid",
      }));
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);
      expect(existsSync(paths.target_source_receipt)).toBe(false);
      expect(existsSync(paths.target_raw_plan)).toBe(false);

      pureResolverControls.tamper_identity_clause = false;
      expect(buildPureTargetRawPlan(runDir).raw_work_plan).toMatchObject({
        workflow: "pure",
        ordered_slide_ids: ["DeckGo"],
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("requires its current Complete Page Review before publishing Pure provider bytes", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-target-lifecycle-"));
    const deck = join(root, "deck_pure_target");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = (note) => `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Pure target fact
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: ${note}
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source("Pure target source-owned note."));
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
      const plan = buildPureTargetRawPlan(runDir);
      const projection = plan.raw_work_plan.sha256;
      expect(authorizePureTargetRawPlan(runDir, { planHash: projection })).toMatchObject({ authorized: true });
      let providerSubmissions = 0;
      expect(await generatePureTargetRawPlan(runDir, {
        planHash: projection,
        submit: async () => {
          providerSubmissions += 1;
          return NATIVE_PROVIDER_PNG;
        },
      })).toMatchObject({ submitted: 1 });
      expect(await preparePureTargetRawReview(runDir)).toMatchObject({ raw_review_sha256: expect.any(String) });
      expect(decidePureTargetRawReview(runDir, { decision: "proceed" })).toMatchObject({
        decision: "proceed",
        accepted_raw_evidence: { workflow: "pure" },
      });
      const paths = pageImageWorkflowPaths(runDir);
      const reviewEvidencePath = join(paths.review_root, "complete-page", resolveContentAddressName(join(paths.review_root, "complete-page"), projection), "complete-page-review-evidence.json");
      const reviewEvidence = readFileSync(reviewEvidencePath);
      writeFileSync(reviewEvidencePath, "{}\n");
      await expect(buildPureTargetDelivery(runDir)).rejects.toMatchObject({ code: "target_complete_page_review_stale" });
      expect(existsSync(paths.target_final_manifest)).toBe(false);
      writeFileSync(reviewEvidencePath, reviewEvidence);
      const delivery = await buildPureTargetDelivery(runDir);
      expect(delivery).toMatchObject({ ok: true, delivery: { receipt: { ordered_slide_ids: ["DeckGo"] } } });
      expect(readFileSync(join(paths.final_root, "01_DeckGo.png"))).toEqual(NATIVE_PROVIDER_PNG);
      const rawEvidenceBefore = JSON.parse(readFileSync(paths.target_raw_evidence, "utf8"));
      const sourceEpochBefore = readState(deck, { purpose: "observe", runVersion: "v1" })
        .page_image_target_evidence.by_version["3_versions/v1"].source_epoch;

      writeFileSync(join(runDir, "slide-specifications.md"), source("Only the Pure speaker note changed."));
      await expect(refreshPureTargetNotes(runDir)).resolves.toMatchObject({ ok: true });
      const rawEvidenceAfter = JSON.parse(readFileSync(paths.target_raw_evidence, "utf8"));
      expect(providerSubmissions).toBe(1);
      expect(rawEvidenceAfter.raw_review_sha256).toBe(rawEvidenceBefore.raw_review_sha256);
      expect(readState(deck, { purpose: "observe", runVersion: "v1" })
        .page_image_target_evidence.by_version["3_versions/v1"].source_epoch).toBe(sourceEpochBefore);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("delivers a small-debt Pure progressive lifecycle from accepted evidence without a new authorization", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-progressive-target-"));
    const deck = join(root, "deck_pure_progressive");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Progressive pure fact
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Progressive source-owned note.
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));

      const plan = buildPureProgressiveTargetRawPlan(runDir);
      const planHash = plan.progressive_raw_work_plan.sha256;
      const pilot = await planPureTargetPilot(runDir, { planHash, slideIds: ["DeckGo"] });
      expect(pilot.batch).toMatchObject({ is_partial_pilot: false, paid_submission_slide_ids: ["DeckGo"] });

      await authorizePureProgressiveRawBatch(runDir, { planHash, batchHash: pilot.batch.batch_hash });
      await generatePureProgressiveRawItem(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
        submit: async () => NATIVE_PROVIDER_PNG,
      });
      const review = await preparePureProgressiveRawReview(runDir, { planHash });
      const accepted = await acceptPureProgressiveRawReview(runDir, { planHash, decision: "proceed" });
      expect(accepted).toMatchObject({ accepted_raw_evidence_sha256: expect.any(String) });
      expect(readProgressiveAcceptedRawWork({
        runDir,
        workflow: "pure",
        plan_hash: planHash,
        expected_plan: plan.progressive_raw_work_plan,
      })).toMatchObject({
        complete_raw_review_sha256: accepted.complete_raw_review_sha256,
        complete_raw_review: {
          decision: "proceed",
          workflow_evidence_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        },
      });

      const delivery = await buildPureProgressiveTargetDelivery(runDir);
      expect(delivery).toMatchObject({ ok: true, delivery: { receipt: { ordered_slide_ids: ["DeckGo"] } } });
      const state = readState(deck, { purpose: "observe", runVersion: "v1" });
      const handoff = state.page_image_progressive_handoff.by_version["3_versions/v1"];
      expect(handoff).toMatchObject({
        raw_work_plan_sha256: planHash,
        complete_raw_review_sha256: accepted.complete_raw_review_sha256,
        accepted_raw_evidence_sha256: accepted.accepted_raw_evidence_sha256,
        final_manifest_sha256: delivery.finalization.final_manifest_sha256,
        delivery_receipt_sha256: expect.any(String),
      });
      expect(state.page_image_raw_provider_authorization?.by_version?.["3_versions/v1"]).toBeUndefined();
      expect(state.page_image_target_evidence.by_version["3_versions/v1"].provider_authorization_sha256).toBeNull();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("writes a current Pure provider-request inspection sidecar without provider work", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-provider-request-inspection-"));
    const deck = join(root, "deck_pure_provider_request_inspection");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = (title) => `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: ${title}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Provider request inspection is provider-free.
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source("Initial Pure inspection prompt"));
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));

      const initial = buildPureProgressiveTargetRawPlan(runDir);
      const initialPlanHash = initial.progressive_raw_work_plan.sha256;
      const paths = pageImageWorkflowPaths(runDir);
      const initialBytes = readFileSync(paths.target_provider_request_inspection);
      const initialInspection = JSON.parse(initialBytes.toString("utf8"));
      const initialRequest = initial.provider_requests_by_slide.DeckGo;

      expect(initial.provider_request_inspection).toMatchObject({
        path: "_generated/page_image_workflow/raw/provider-input-inspection.json",
        sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        plan_hash: initialPlanHash,
      });
      expect(initialInspection).toMatchObject({
        schema: "page-image-provider-request-inspection",
        progressive_raw_work_plan_sha256: initialPlanHash,
        target_raw_work_plan_sha256: initial.raw_work_plan.sha256,
        source_receipt_sha256: initial.receipt.source_sha256,
        source_epoch: initial.source_epoch,
        workflow: "pure",
        provider_profile_sha256: initial.progressive_raw_work_plan.provider_profile_sha256,
        transport: { model: initialRequest.generation_profile.provider.model, size: "2000x1125" },
        ordered_slide_ids: ["DeckGo"],
      });
      expect(initialInspection.items).toEqual([{
        slide_id: "DeckGo",
        raw_contract_sha256: initial.progressive_raw_work_plan.items[0].raw_contract_sha256,
        provider_input_binding: initial.raw_work_plan.items[0].provider_input_binding,
        provider_request_sha256: canonicalJsonSha256(initialRequest),
        prompt: canonicalJson(initialRequest),
      }]);
      expect(JSON.stringify(initialInspection)).not.toMatch(/data:image|authorization|api[_-]?key/i);
      expect(readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: initialPlanHash })).toMatchObject({
        batches: [],
        grants: [],
        attempts: [],
        materializations: [],
      });

      const replay = buildPureProgressiveTargetRawPlan(runDir);
      expect(replay.provider_request_inspection).toEqual(initial.provider_request_inspection);
      expect(readFileSync(paths.target_provider_request_inspection)).toEqual(initialBytes);

      writeFileSync(join(runDir, "slide-specifications.md"), source("Replacement Pure inspection prompt"));
      const replacement = buildPureProgressiveTargetRawPlan(runDir, { allowSourceRebuild: true });
      const replacementInspection = JSON.parse(readFileSync(paths.target_provider_request_inspection, "utf8"));
      expect(replacement.progressive_raw_work_plan.sha256).not.toBe(initialPlanHash);
      expect(replacement.provider_request_inspection).toMatchObject({
        plan_hash: replacement.progressive_raw_work_plan.sha256,
        sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      expect(replacement.provider_request_inspection.sha256).not.toBe(initial.provider_request_inspection.sha256);
      expect(replacementInspection.source_receipt_sha256).not.toBe(initialInspection.source_receipt_sha256);
      expect(replacementInspection.items[0]).toMatchObject({
        provider_input_binding: replacement.raw_work_plan.items[0].provider_input_binding,
        provider_request_sha256: canonicalJsonSha256(replacement.provider_requests_by_slide.DeckGo),
        prompt: canonicalJson(replacement.provider_requests_by_slide.DeckGo),
      });
      expect(replacementInspection.items[0].prompt).toContain("Replacement Pure inspection prompt");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("compiles structured provider content and visual clauses into the Pure raw contract", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-scene-contract-"));
    const deck = join(root, "deck_pure_scene");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`DeckGo\`

**KICKER**: Learning systems
**TITLE**: Pure target fact
**SUBTITLE**: Provider-visible headers and body use one Core
**SLIDE BODY**:
\`\`\`yaml
items:
  - role: body
    literal: "两个东西让 AI 学编程比别的都快"
  - role: supporting_copy
    literal: "A calm working model for repeatable practice"
    copy_policy: presentation_adaptable
\`\`\`
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
relationship: causal-flow
\`\`\`

> **SPEAKER NOTE**: Pure scene source-owned note.
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));

      const plan = buildPureProgressiveTargetRawPlan(runDir);
      const contract = plan.provider_requests_by_slide.DeckGo.raw_contract;
      expect(contract.provider_clauses).toEqual(expect.objectContaining({
        recipe: expect.any(String),
        composition: expect.any(String),
        motifs: expect.any(Array),
        relationship: "connected luminous forms progressing from left origin to right outcome",
      }));
      expect(contract.visual_language.relationship).toMatchObject({
        id: "causal-flow",
        reading_order: "left-to-right",
      });
      for (const providerClauses of [
        Object.fromEntries(Object.entries(contract.provider_clauses).filter(([key]) => key !== "relationship")),
        { ...contract.provider_clauses, relationship: "" },
        { ...contract.provider_clauses, relationship: "nested translucent planes rising from broad base to focused apex" },
      ]) {
        expect(validatePureRawContract({ ...structuredClone(contract), provider_clauses: providerClauses }))
          .toMatchObject({ ok: false, code: "pure_raw_contract_invalid" });
      }
      expect(contract.page_image_core).toMatchObject({
        schema: "page-image-core-slide-facts",
        canonical_semantic_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      expect(contract.provider_rendered_content).toEqual({
        header: {
          kicker: "Learning systems",
          title: "Pure target fact",
          subtitle: "Provider-visible headers and body use one Core",
        },
        items: [
          { role: "body", literal: "两个东西让 AI 学编程比别的都快", copy_policy: "exact" },
          { role: "supporting_copy", literal: "A calm working model for repeatable practice", copy_policy: "presentation_adaptable" },
        ],
      });
      expect(contract.visual_scene).toBeNull();
      expect(contract).not.toHaveProperty("body");
      expect(contract.visual_identity_role_clause).toBeNull();
      expect(contract.visual_language).toEqual(expect.objectContaining({
        recipe: expect.objectContaining({ id: "editorial-systems", provider_clause_sha256: expect.any(String) }),
      }));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects an unsupported VISUAL SCENE input before Pure style or raw planning", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-scene-guard-"));
    const deck = join(root, "deck_pure_scene_guard");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Pure target fact
**VISUAL SCENE**: a slide with visible text annotations
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Pure scene guard note.
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      expect(() => resolvePureStyleMasterScope(runDir)).toThrow(/VISUAL SCENE/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("publishes a partial Pure Pilot as preview-only complete-page evidence", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-progressive-pilot-"));
    const deck = join(root, "deck_pure_progressive_pilot");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const slides = ["DeckGo", "FlowGo", "DataGo", "ToneGo", "FormGo", "GridGo", "LineGo", "RoleGo", "PathGo", "DataMap"];
    const source = `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

${slides.map((slideId, index) => `## Slide ${String(index + 1).padStart(2, "0")}: \`${slideId}\`

**TITLE**: Pure Pilot ${index + 1}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`).join("\n")}> **SPEAKER NOTE**: Partial Pure Pilot fixture.
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));

      const plan = buildPureProgressiveTargetRawPlan(runDir);
      const planHash = plan.progressive_raw_work_plan.sha256;
      const pilot = await planPureTargetPilot(runDir, { planHash, slideIds: ["DataMap"] });
      await authorizePureProgressiveRawBatch(runDir, { planHash, batchHash: pilot.batch.batch_hash });
      const rawBytes = NATIVE_PROVIDER_PNG;
      await generatePureProgressiveRawItem(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
        submit: async () => rawBytes,
      });
      const paths = pageImageWorkflowPaths(runDir);
      const pilotRoot = join(paths.review_root, "pilot", resolveContentAddressName(join(paths.review_root, "pilot"), pilot.batch.batch_hash));
      await expect(prepareFramedProgressivePilotReview(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
      })).rejects.toMatchObject({ code: "target_source_receipt_invalid" });
      expect(existsSync(pilotRoot)).toBe(false);
      const evidence = await preparePureProgressivePilotReview(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
      });
      const presentation = JSON.parse(readFileSync(join(pilotRoot, "pilot-page-review-evidence.json"), "utf8"));
      expect(evidence).toMatchObject({ pilot_evidence_sha256: expect.stringMatching(/^[0-9a-f]{64}$/) });
      expect(readFileSync(join(pilotRoot, "provider-page", "10_DataMap.png"))).toEqual(rawBytes);
      expect(existsSync(join(pilotRoot, "provider-page", "DataMap.png"))).toBe(false);
      expect(presentation).toMatchObject({
        schema: "page-image-pilot-page-review-presentation",
        workflow: "pure",
        raw_work_plan_sha256: planHash,
        batch_sha256: pilot.batch.batch_hash,
        has_complete_page_artifact: false,
        items: [{ slide_id: "DataMap" }],
      });
      expect(existsSync(join(pilotRoot, "complete-page", "10_DataMap.png"))).toBe(false);
      expect(existsSync(join(pilotRoot, "pilot-page-review.png"))).toBe(true);
      expect(existsSync(paths.target_final_manifest)).toBe(false);
      expect(existsSync(join(paths.final_root, "deck.pptx"))).toBe(false);
      expect(existsSync(join(paths.final_root, "pptx-assembly.json"))).toBe(false);
      expect(existsSync(join(paths.final_root, "notes-receipt.json"))).toBe(false);

      writeFileSync(join(pilotRoot, "provider-page", "10_DataMap.png"), Buffer.from("stale-pilot-page"));
      await expect(acceptPureProgressivePilot(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
        decision: "proceed",
      })).rejects.toMatchObject({ code: "pilot_page_review_stale" });
      expect(readState(deck).page_image_progressive_handoff.by_version["3_versions/v1"])
        .toMatchObject({ partial_pilot_decision_sha256: null });
      writeFileSync(join(pilotRoot, "provider-page", "10_DataMap.png"), rawBytes);

      const decision = await acceptPureProgressivePilot(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
        decision: "proceed",
      });
      expect(decision).toMatchObject({
        pilot_decision_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        progressive_handoff: { partial_pilot_decision_sha256: expect.any(String) },
        next_action: { action_id: "plan_progressive_expansion" },
      });
      const state = readState(deck);
      expect(state.page_image_progressive_handoff.by_version["3_versions/v1"]).toMatchObject({
        partial_pilot_decision_sha256: decision.pilot_decision_sha256,
        accepted_raw_evidence_sha256: null,
        final_manifest_sha256: null,
        delivery_receipt_sha256: null,
      });
      expect(existsSync(paths.target_final_manifest)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("takes a partial Pilot through Expansion, complete acceptance, and rebuildable delivery", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-progressive-expansion-delivery-"));
    const deck = join(root, "deck_pure_progressive_expansion");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const slides = ["DeckGo", "FlowGo", "DataGo", "ToneGo", "FormGo", "GridGo"];
    const source = `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

${slides.map((slideId, index) => `## Slide ${String(index + 1).padStart(2, "0")}: \`${slideId}\`

**TITLE**: Expansion Pure ${index + 1}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
> **SPEAKER NOTE**: Progressive Expansion fixture ${index + 1}.
`).join("\n")}
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));

      const plan = buildPureProgressiveTargetRawPlan(runDir);
      const planHash = plan.progressive_raw_work_plan.sha256;
      const paths = pageImageWorkflowPaths(runDir);
      await expect(buildPureProgressiveTargetDelivery(runDir)).rejects.toMatchObject({
        code: "progressive_raw_accepted_evidence_required",
      });
      expect(existsSync(paths.target_final_manifest)).toBe(false);

      const pilot = await planPureTargetPilot(runDir, { planHash, slideIds: ["DeckGo"] });
      expect(pilot.batch).toMatchObject({ is_partial_pilot: true, paid_submission_slide_ids: ["DeckGo"] });
      await authorizePureProgressiveRawBatch(runDir, { planHash, batchHash: pilot.batch.batch_hash });
      await generatePureProgressiveRawItem(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
        submit: async () => NATIVE_PROVIDER_PNG,
      });
      await preparePureProgressivePilotReview(runDir, { planHash, batchHash: pilot.batch.batch_hash });
      const pilotDecision = await acceptPureProgressivePilot(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
        decision: "proceed",
      });
      expect(pilotDecision.next_action).toMatchObject({ action_id: "plan_progressive_expansion" });

      const expansion = await planPureTargetExpansion(runDir, { planHash });
      expect(expansion.batch).toMatchObject({
        kind: "expansion",
        paid_submission_slide_ids: ["FlowGo", "DataGo", "ToneGo", "FormGo", "GridGo"],
      });
      await authorizePureProgressiveRawBatch(runDir, { planHash, batchHash: expansion.batch.batch_hash });
      for (const slideId of expansion.batch.paid_submission_slide_ids) {
        const generated = await generatePureProgressiveRawItem(runDir, {
          planHash,
          batchHash: expansion.batch.batch_hash,
          submit: async () => NATIVE_PROVIDER_PNG,
        });
        expect(generated.item).toBe(slideId);
      }
      const review = await preparePureProgressiveRawReview(runDir, { planHash });
      const accepted = await acceptPureProgressiveRawReview(runDir, { planHash, decision: "proceed" });
      expect(accepted).toMatchObject({
        accepted_raw_evidence_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        complete_raw_review_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      expect(accepted.complete_raw_review_sha256).not.toBe(review.complete_raw_review_sha256);

      const delivery = await buildPureProgressiveTargetDelivery(runDir);
      expect(delivery).toMatchObject({
        ok: true,
        delivery: { receipt: { ordered_slide_ids: slides } },
        finalization: { final_manifest_sha256: expect.stringMatching(/^[0-9a-f]{64}$/) },
      });

      const directBefore = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: planHash });
      const acceptedBefore = readProgressiveAcceptedRawWork({
        runDir,
        workflow: "pure",
        plan_hash: planHash,
        expected_plan: plan.progressive_raw_work_plan,
      });
      rmSync(paths.raw_root, { recursive: true, force: true });
      rmSync(paths.review_root, { recursive: true, force: true });
      rmSync(paths.final_root, { recursive: true, force: true });

      const replayedPlan = buildPureProgressiveTargetRawPlan(runDir);
      expect(replayedPlan.progressive_publication).toMatchObject({ replay: true, plan_hash: planHash });
      const replayedReview = await preparePureProgressiveRawReview(runDir, { planHash });
      expect(replayedReview).toMatchObject({
        replay: true,
        complete_raw_review_sha256: accepted.complete_raw_review_sha256,
      });
      const rebuilt = await buildPureProgressiveTargetDelivery(runDir);
      expect(rebuilt.finalization.final_manifest_sha256).toBe(delivery.finalization.final_manifest_sha256);
      expect(existsSync(paths.target_raw_plan)).toBe(true);
      expect(existsSync(paths.target_raw_review)).toBe(false);
      expect(existsSync(join(paths.review_root, "complete-page", resolveContentAddressName(join(paths.review_root, "complete-page"), planHash), "complete-page-review-evidence.json"))).toBe(true);
      expect(existsSync(paths.target_final_manifest)).toBe(true);

      const directAfter = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: planHash });
      const acceptedAfter = readProgressiveAcceptedRawWork({
        runDir,
        workflow: "pure",
        plan_hash: planHash,
        expected_plan: plan.progressive_raw_work_plan,
      });
      expect(directAfter).toEqual(directBefore);
      expect(acceptedAfter.accepted_raw_evidence_sha256).toBe(acceptedBefore.accepted_raw_evidence_sha256);
      expect(acceptedAfter.raw_bytes_by_slide).toEqual(acceptedBefore.raw_bytes_by_slide);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("advances a target source epoch and rebuilds Pure raw work after visible source drift", async () => {
    const root = mkdtempSync(join(tmpdir(), "pure-target-rebuild-"));
    const deck = join(root, "deck_pure_rebuild");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = (title) => `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: ${title}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Pure target source-owned note.
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source("Original pure fact"));
      await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
      let providerSubmissions = 0;
      const submit = async () => {
        providerSubmissions += 1;
        return NATIVE_PROVIDER_PNG;
      };

      const initial = buildPureTargetRawPlan(runDir);
      authorizePureTargetRawPlan(runDir, { planHash: initial.raw_work_plan.sha256 });
      await generatePureTargetRawPlan(runDir, { planHash: initial.raw_work_plan.sha256, submit });
      await preparePureTargetRawReview(runDir);
      decidePureTargetRawReview(runDir, { decision: "proceed" });
      await buildPureTargetDelivery(runDir);

      writeFileSync(join(runDir, "slide-specifications.md"), source("Updated pure fact"));
      expect(() => buildPureTargetRawPlan(runDir)).toThrow("TARGET_SOURCE_STATE_IDENTITY_MISMATCH");
      const rebuilt = buildPureTargetRawPlan(runDir, { allowSourceRebuild: true });
      expect(rebuilt.source_epoch).toBe(2);
      expect(readState(deck, { purpose: "observe", runVersion: "v1" })
        .page_image_target_evidence.by_version["3_versions/v1"])
        .toMatchObject({ source_epoch: 2, workflow: "pure", provider_authorization_sha256: null, accepted_raw_evidence_sha256: null });

      authorizePureTargetRawPlan(runDir, { planHash: rebuilt.raw_work_plan.sha256 });
      await generatePureTargetRawPlan(runDir, { planHash: rebuilt.raw_work_plan.sha256, submit });
      await preparePureTargetRawReview(runDir);
      decidePureTargetRawReview(runDir, { decision: "proceed" });
      await buildPureTargetDelivery(runDir);
      expect(providerSubmissions).toBe(2);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
