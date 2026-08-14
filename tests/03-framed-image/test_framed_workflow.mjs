import { beforeEach, describe, expect, it, vi } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const framedResolverControls = vi.hoisted(() => ({ tamper_identity_clause: false }));

vi.mock("../../ppt_maker_harness/scripts/02-visual-system/index.mjs", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createPageImageSourceResolver(...args) {
      const resolver = actual.createPageImageSourceResolver(...args);
      return Object.freeze({
        resolveSelection(context) {
          const selection = resolver.resolveSelection(context);
          if (!framedResolverControls.tamper_identity_clause || !selection.identity_reference) return selection;
          return Object.freeze({
            ...selection,
            identity_reference: Object.freeze({
              ...selection.identity_reference,
              provider_reference: Object.freeze({
                ...selection.identity_reference.provider_reference,
                role_clause: "tampered identity clause",
              }),
            }),
          });
        },
      });
    },
  };
});
import {
  createAcceptedRawEvidence,
  createRawWorkPlan,
} from "../../ppt_maker_harness/scripts/shared/image2/page_image_artifacts.mjs";
import { resolveContentAddressName } from "../../ppt_maker_harness/scripts/shared/image2/content_address_store.mjs";
import { canonicalJsonSha256 } from "../../ppt_maker_harness/scripts/shared/identity/canonical_json.mjs";
import { sha256Bytes } from "../../ppt_maker_harness/scripts/shared/identity/byte_hash.mjs";
import { canonicalJson } from "../../ppt_maker_harness/scripts/shared/identity/canonical_json.mjs";
import {
  FRAMED_EXCLUSIVE_HEADER_RESERVATION_INSTRUCTION,
  validateFramedProviderInputContract,
} from "../../ppt_maker_harness/scripts/03-framed-image/internal/framed_provider_input_contract.mjs";
import {
  classifyFramedRefresh,
  createFramedRawWorkPlan,
  createFramedTargetRawReviewContribution,
  publishFramedFinalSlideManifest,
  readFramedTargetStoredPlanContext,
  authorizeFramedTargetRawPlan,
  authorizeFramedProgressiveRawBatch,
  acceptFramedProgressivePilot,
  acceptFramedProgressiveRawReview,
  buildFramedProgressiveTargetRawPlan,
  buildFramedProgressiveTargetDelivery,
  buildFramedTargetDelivery,
  buildFramedTargetRawPlan,
  decideFramedTargetRawReview,
  generateFramedProgressiveRawItem,
  generateFramedTargetRawPlan,
  planFramedTargetPilot,
  prepareFramedProgressivePilotReview,
  prepareFramedProgressiveRawReview,
  prepareFramedTargetRawReview,
  refreshFramedTargetNotes,
  refreshFramedTargetText,
  readFramedProgressiveTargetPlanCandidate,
  resolveFramedStyleMasterScope,
  validateFramedRawContract,
} from "../../ppt_maker_harness/scripts/03-framed-image/index.mjs";
import { renderFramedHeaderOverlayHtml, verifyFramedHeaderOverlays } from "../../ppt_maker_harness/scripts/03-framed-image/internal/framed_render_contract.mjs";
import { STANDARD_FRAMED_PRESENTATION_PROFILE } from "../helpers/framed_presentation_profile.mjs";
import { targetPageImageSubmitFactory } from "../../ppt_maker_harness/scripts/ppt_flow.mjs";
import {
  FRAMED_HEADER_PROFILES_FILE,
  initBundle,
  pageImagePresentationAsset,
} from "../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { pageImageDerivedPagePaths, pageImageWorkflowPaths } from "../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import { readState } from "../../ppt_maker_harness/scripts/shared/state/state.mjs";
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
const STANDARD_PRESENTATION_PROFILE = STANDARD_FRAMED_PRESENTATION_PROFILE;

function framedProviderInputBinding(compiled = "a") {
  return {
    compiled_provider_input_sha256: digest(compiled),
    provider_content_sha256: digest("b"),
    visual_selection_sha256: digest("c"),
    style_master_selection_sha256: digest("d"),
    generation_profile_sha256: digest("e"),
    header_policy_sha256: digest("f"),
    page_presentation_sha256: digest("9"),
    local_header_profile_sha256: digest("1"),
    protected_composition_sha256: digest("2"),
  };
}
const FLOW = "ppt_maker_harness/scripts/ppt_flow.mjs";
const NATIVE_PROVIDER_PNG = (() => {
  const image = createCanvas(2048, 1136);
  image.getContext("2d").fillRect(0, 0, 2048, 1136);
  return image.toBuffer("image/png");
})();

const DEFAULT_PROVIDER_BODY = `items:
  - role: label
    literal: "Provider-owned content remains readable."`;
const DEFAULT_VISUAL_BRIEF = `recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo`;

function framedSource({
  slideId = "DeckGo",
  title = "Framed target fact",
  kicker = "Operations",
  subtitle = "A current Framed source fixture",
  bodyYaml = DEFAULT_PROVIDER_BODY,
  visualYaml = DEFAULT_VISUAL_BRIEF,
  note = "Framed source-owned note.",
  subjectRestrictions = null,
  identity = null,
  identitySubjectCount = null,
} = {}) {
  return `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: framed
---

## Slide 01: \`${slideId}\`

**KICKER**: ${kicker}
**TITLE**: ${title}
**SUBTITLE**: ${subtitle}
${identity ? `**VISUAL IDENTITY**: ${identity.profile}/${identity.role}
**IDENTITY SUBJECT COUNT**: ${identitySubjectCount || "one"}
` : identitySubjectCount ? `**IDENTITY SUBJECT COUNT**: ${identitySubjectCount}
` : ""}${subjectRestrictions ? `**SUBJECT RESTRICTIONS**: ${subjectRestrictions}
` : ""}**SLIDE BODY**:
\`\`\`yaml
${bodyYaml}
\`\`\`
**VISUAL BRIEF**:
\`\`\`yaml
${visualYaml}
\`\`\`

> **SPEAKER NOTE**: ${note}
`;
}

function runFlow(args) {
  return spawnSync("node", [FLOW, ...args], { encoding: "utf8", timeout: 30_000 });
}

const receipt = {
  schema: "page-source-receipt",
    artifact_role: "parsed-source",
  pipeline: "page-image-workflow",
  workflow: "framed",
  source_sha256: digest("a"),
  slides: [{
    slide_id: "DeckGo",
    position: 1,
    page_class: "standard",
    provider_content: { items: [{ role: "label", literal: "Provider-owned content remains readable.", copy_policy: "exact" }] },
    header_policy: {
      local_header: { kicker: null, title: "A title", subtitle: null },
    },
    subject_restrictions: "none",
  }],
};

describe("Framed target workflow", () => {

  beforeEach(() => {
    framedResolverControls.tamper_identity_clause = false;
  });

  it("compiles resolved visual and provider-content facts into the Framed raw contract", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-scene-contract-"));
    const deck = join(root, "deck_framed_scene");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = framedSource({
      title: "Framed target fact",
      visualYaml: `recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
relationship: layer-stack`,
      note: "Framed scene source-owned note.",
    });
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));
      const plan = await buildFramedTargetRawPlan(runDir);
      const contract = plan.provider_requests_by_slide.DeckGo.raw_contract;
      expect(contract.provider_clauses).toEqual(expect.objectContaining({
        recipe: expect.any(String),
        composition: expect.any(String),
        motifs: expect.any(Array),
        relationship: "nested translucent planes rising from broad base to focused apex",
      }));
      expect(contract.visual_language.relationship).toMatchObject({
        id: "layer-stack",
        reading_order: "bottom-to-top",
      });
      for (const providerClauses of [
        Object.fromEntries(Object.entries(contract.provider_clauses).filter(([key]) => key !== "relationship")),
        { ...contract.provider_clauses, relationship: "" },
        { ...contract.provider_clauses, relationship: "connected luminous forms progressing from left origin to right outcome" },
      ]) {
        expect(validateFramedRawContract({ ...structuredClone(contract), provider_clauses: providerClauses }))
          .toMatchObject({ ok: false, code: "framed_raw_contract_invalid" });
      }
      expect(contract.visual_scene).toBeNull();
      expect(contract.visual_identity_role_clause).toBeNull();
      expect(contract.framed).not.toHaveProperty("text_free");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("compiles a semantic Framed identity and rejects malformed raw or compiled identity facts", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-identity-provider-input-"));
    const deck = join(root, "deck_framed_identity_provider_input");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = `${framedSource({
      title: "Identity-bearing Framed page",
      identity: TEST_IDENTITY_REFERENCE,
      subjectRestrictions: "none",
    })}
## Slide 02: \`FlowGo\`

**TITLE**: Identity-free Framed control
**IDENTITY SUBJECT COUNT**: none
**SUBJECT RESTRICTIONS**: none
**SLIDE BODY**:
\`\`\`yaml
${DEFAULT_PROVIDER_BODY}
\`\`\`
**VISUAL BRIEF**:
\`\`\`yaml
${DEFAULT_VISUAL_BRIEF}
\`\`\`
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      allowTestIdentitySubjectClass(deck);
      const reference = writeTestIdentityReference(deck);
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));

      const plan = await buildFramedTargetRawPlan(runDir);
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
      const legacyPlan = createFramedRawWorkPlan({
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
      expect(classifyFramedRefresh({
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
          readFramedTargetStoredPlanContext(runDir);
        } catch (error) {
          return error;
        }
        throw new Error("expected retained projection-only plan to be stale");
      })();
      expect(readLegacy).toMatchObject({ code: "target_raw_plan_stale" });
      await expect(authorizeFramedTargetRawPlan(runDir, { planHash: legacyPlan.sha256 }))
        .rejects.toMatchObject({ code: "target_raw_plan_stale" });
      let staleSubmitCalls = 0;
      await expect(generateFramedTargetRawPlan(runDir, {
        planHash: legacyPlan.sha256,
        submit: async () => {
          staleSubmitCalls += 1;
          return NATIVE_PROVIDER_PNG;
        },
      })).rejects.toMatchObject({ code: "target_raw_plan_stale" });
      expect(staleSubmitCalls).toBe(0);
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBeforeLegacyPreflight);
      writeFileSync(paths.target_raw_plan, currentPlanBytes);

      const progressive = await buildFramedProgressiveTargetRawPlan(runDir);
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
        (candidate) => { candidate.visual_identity.subject_class = "UpperCase"; },
        (candidate) => { candidate.visual_identity.role_clause_sha256 = "A".repeat(64); },
        (candidate) => { candidate.visual_identity.identity_subject_count = "none"; },
        (candidate) => { candidate.visual_identity.subject_restrictions = "unsupported"; },
        (candidate) => { candidate.visual_identity_role_clause = "tampered identity clause"; },
      ];
      for (const mutate of invalidContracts) {
        const candidate = structuredClone(identityContract);
        mutate(candidate);
        expect(validateFramedRawContract(candidate)).toMatchObject({
          ok: false,
          code: "framed_raw_contract_invalid",
        });
      }

      const withLineage = structuredClone(identityInput);
      withLineage.visual.identity.reference_sha256 = reference.reference_sha256;
      const lineageUtf8 = canonicalJson(withLineage);
      expect(validateFramedProviderInputContract({
        rawContract: identityContract,
        generationProfile: identityRequest.generation_profile,
        compiledProviderInput: {
          schema: identityRequest.compiled_provider_input.schema,
          utf8: lineageUtf8,
          sha256: sha256Bytes(Buffer.from(lineageUtf8, "utf8")),
        },
      })).toMatchObject({ ok: false, code: "framed_provider_input_contract_invalid" });

      const withoutClause = structuredClone(identityInput);
      delete withoutClause.visual.identity.role_clause;
      const withoutClauseUtf8 = canonicalJson(withoutClause);
      expect(validateFramedProviderInputContract({
        rawContract: identityContract,
        generationProfile: identityRequest.generation_profile,
        compiledProviderInput: {
          schema: identityRequest.compiled_provider_input.schema,
          utf8: withoutClauseUtf8,
          sha256: sha256Bytes(Buffer.from(withoutClauseUtf8, "utf8")),
        },
      })).toMatchObject({ ok: false, code: "framed_provider_input_contract_invalid" });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("hard-stops a tampered Framed identity before publication and recovers at the same checkpoint", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-identity-hard-stop-"));
    const deck = join(root, "deck_framed_identity_hard_stop");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      allowTestIdentitySubjectClass(deck);
      writeTestIdentityReference(deck);
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), framedSource({
        title: "Reject tampered Framed identity",
        identity: TEST_IDENTITY_REFERENCE,
        subjectRestrictions: "none",
      }));
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));
      const paths = pageImageWorkflowPaths(runDir);
      const stateBefore = readFileSync(join(deck, "_state", "state.yaml"));

      framedResolverControls.tamper_identity_clause = true;
      await expect(buildFramedTargetRawPlan(runDir)).rejects.toMatchObject({
        code: "framed_raw_contract_invalid",
      });
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBefore);
      expect(existsSync(paths.target_source_receipt)).toBe(false);
      expect(existsSync(paths.target_raw_plan)).toBe(false);

      framedResolverControls.tamper_identity_clause = false;
      await expect(buildFramedTargetRawPlan(runDir)).resolves.toMatchObject({
        raw_work_plan: { workflow: "framed", ordered_slide_ids: ["DeckGo"] },
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("submits the exact bound Framed compiled input after registry drift", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-provider-clause-delivery-"));
    const deck = join(root, "deck_framed_provider_clause_delivery");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const source = framedSource({
      title: "Framed clause delivery",
      visualYaml: `recipe: editorial-systems
composition: centered-constellation
motifs:
  - connected-nodes
negative_constraints:
  - no-logo
relationship: causal-flow`,
    });
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));

      const plan = await buildFramedTargetRawPlan(runDir);
      const expectedClauses = structuredClone(plan.provider_requests_by_slide.DeckGo.raw_contract.provider_clauses);
      const registryPath = join(deck, "2_backbone", "visual-style", "page-image-visual-language.yaml");
      const registry = readFileSync(registryPath, "utf8");
      const driftClause = "connected balanced forms progressing from left origin to right outcome";
      expect(registry).toContain("connected luminous forms progressing from left origin to right outcome");
      writeFileSync(registryPath, registry.replace("connected luminous forms progressing from left origin to right outcome", driftClause));

      let providerBody = null;
      const submit = targetPageImageSubmitFactory(plan, {
        credentialResolver: () => ({ base_url: "https://image.example", api_key: "test-key" }),
        fetchImpl: async (_url, options) => {
          providerBody = JSON.parse(options.body);
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ data: [{ b64_json: NATIVE_PROVIDER_PNG.toString("base64") }] }),
          };
        },
      });
      await submit({
        request: plan.provider_requests_by_slide.DeckGo,
        item: { slide_id: "DeckGo" },
        provider_idempotency_key: `page-image-workflow-${"f".repeat(64)}`,
      });

      const boundRequest = plan.provider_requests_by_slide.DeckGo;
      const serializedRequest = JSON.parse(providerBody.prompt);
      expect(providerBody.prompt).toBe(boundRequest.compiled_provider_input.utf8);
      expect(providerBody.model).toBe(boundRequest.generation_profile.provider.model);
      expect(serializedRequest.visual.relationship).toBe(expectedClauses.relationship);
      expect(providerBody.prompt).not.toContain(driftClause);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("binds source restrictions and exact normalized composition through derived publication and the single review path", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-composition-provider-boundary-"));
    const deck = join(root, "deck_framed_composition_provider_boundary");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    const sharedLiteral = "Shared provider-owned spelling";
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), framedSource({
        title: sharedLiteral,
        subjectRestrictions: "no-generic-metal-robot",
        bodyYaml: `items:
  - role: label
    literal: "${sharedLiteral}"`,
      }));
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));

      const candidate = readFramedProgressiveTargetPlanCandidate(runDir);
      const plan = await buildFramedProgressiveTargetRawPlan(runDir);
      const coreSlide = candidate.page_image_core.slides[0];
      const rawContract = plan.provider_requests_by_slide.DeckGo.raw_contract;
      const request = JSON.parse(plan.provider_requests_by_slide.DeckGo.compiled_provider_input.utf8);
      const composition = coreSlide.visual_selection.presentation.protected_composition;
      const binding = plan.raw_work_plan.items[0].provider_input_binding;
      const paths = pageImageWorkflowPaths(runDir);
      const derivedPaths = pageImageDerivedPagePaths(runDir, "DeckGo");

      expect(coreSlide.subject_restrictions).toBe("no-generic-metal-robot");
      expect(rawContract.framed).toMatchObject({
        subject_restrictions: "no-generic-metal-robot",
        protected_composition: composition,
      });
      expect(binding.protected_composition_sha256).toBe(canonicalJsonSha256(composition));
      expect(request).toMatchObject({
        subject_restrictions: "no-generic-metal-robot",
        protected_composition: composition,
        provider_rendered_content: { items: [{ literal: sharedLiteral }] },
      });
      expect(request.instruction).toBe(FRAMED_EXCLUSIVE_HEADER_RESERVATION_INSTRUCTION);
      expect(request.instruction).toContain("exclusively reserved");
      expect(request.instruction).toContain("Do not render provider typography, labels, readable body content, or key subjects in reserved_header.");
      expect(request.instruction).toContain("place all provider-rendered readable body content, labels, and key subjects in the normalized body_safe region.");
      expect(request.protected_composition.body_safe).toEqual({
        x: 0,
        y: composition.reserved_header.y + composition.reserved_header.height,
        width: 1,
        height: 1 - composition.reserved_header.y - composition.reserved_header.height,
      });
      expect(request).not.toHaveProperty("local_header");
      expect(request).not.toHaveProperty("header_policy");
      expect(request).not.toHaveProperty("context_not_to_render");
      expect(request).not.toHaveProperty("protected_geometry");
      expect(request).not.toHaveProperty("region");
      expect(request).not.toHaveProperty("mask");

      const weakenedRequest = {
        ...request,
        instruction: "Reserve the normalized header region for the deterministic local overlay.",
      };
      const weakenedUtf8 = canonicalJson(weakenedRequest);
      const weakenedInput = {
        schema: plan.provider_requests_by_slide.DeckGo.compiled_provider_input.schema,
        utf8: weakenedUtf8,
        sha256: sha256Bytes(Buffer.from(weakenedUtf8, "utf8")),
      };
      expect(weakenedInput.sha256).not.toBe(plan.provider_requests_by_slide.DeckGo.compiled_provider_input.sha256);
      expect(validateFramedProviderInputContract({
        rawContract,
        generationProfile: plan.provider_requests_by_slide.DeckGo.generation_profile,
        compiledProviderInput: weakenedInput,
      })).toMatchObject({
        ok: false,
        code: "framed_provider_input_contract_invalid",
      });

      const nonCanonicalInput = {
        ...plan.provider_requests_by_slide.DeckGo.compiled_provider_input,
        utf8: `${plan.provider_requests_by_slide.DeckGo.compiled_provider_input.utf8}\n`,
      };
      expect(validateFramedProviderInputContract({
        rawContract,
        generationProfile: plan.provider_requests_by_slide.DeckGo.generation_profile,
        compiledProviderInput: nonCanonicalInput,
      })).toMatchObject({
        ok: false,
        code: "framed_provider_input_contract_invalid",
      });

      const layout = JSON.parse(readFileSync(derivedPaths.layout, "utf8"));
      const imageRequest = JSON.parse(readFileSync(derivedPaths.image2_request, "utf8"));
      const inspection = JSON.parse(readFileSync(paths.target_provider_request_inspection, "utf8"));
      expect(layout.payload.selected_presentation.protected_composition).toEqual(composition);
      expect(imageRequest.payload).toMatchObject({
        canonical_utf8: plan.provider_requests_by_slide.DeckGo.compiled_provider_input.utf8,
        request_digest: plan.provider_requests_by_slide.DeckGo.compiled_provider_input.sha256,
        adapter_binding: binding,
      });
      expect(JSON.parse(inspection.items[0].prompt)).toEqual(plan.provider_requests_by_slide.DeckGo);

      const contribution = createFramedTargetRawReviewContribution({
        receipt: plan.receipt,
        rawWorkPlan: plan.raw_work_plan,
      });
      expect(contribution.coverage.items[0].guide_primitives).toEqual([
        { kind: "rectangle", guide_id: "reserved_header", ...composition.reserved_header },
        { kind: "rectangle", guide_id: "body_safe", ...composition.body_safe },
      ]);
      const pilot = await planFramedTargetPilot(runDir, {
        planHash: plan.progressive_raw_work_plan.sha256,
        slideIds: ["DeckGo"],
      });
      await authorizeFramedProgressiveRawBatch(runDir, {
        planHash: plan.progressive_raw_work_plan.sha256,
        batchHash: pilot.batch.batch_hash,
      });
      await generateFramedProgressiveRawItem(runDir, {
        planHash: plan.progressive_raw_work_plan.sha256,
        batchHash: pilot.batch.batch_hash,
        submit: async () => NATIVE_PROVIDER_PNG,
      });
      await expect(prepareFramedProgressiveRawReview(runDir, {
        planHash: plan.progressive_raw_work_plan.sha256,
      })).resolves.toMatchObject({
        complete_raw_review_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      });

      const overlappingComposition = structuredClone(rawContract);
      overlappingComposition.framed.protected_composition.body_safe.y = composition.reserved_header.y;
      expect(validateFramedRawContract(overlappingComposition)).toMatchObject({
        ok: false,
        code: "framed_raw_contract_invalid",
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects the 28-W regression through the canonical browser render contract", async () => {
    await expect(verifyFramedHeaderOverlays([{
      slide_id: "WideW",
      presentation_profile: STANDARD_PRESENTATION_PROFILE,
      local_header: {
        kicker: null,
        title: "W".repeat(28),
        subtitle: null,
      },
    }])).rejects.toMatchObject({
      code: "framed_text_fit_failed",
      message: expect.stringContaining("scroll overflow"),
    });
  }, 20_000);

  it("does not materialize source lineage or a raw plan when browser proof rejects the candidate", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-proof-before-write-"));
    const deck = join(root, "deck_framed_proof_before_write");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), framedSource({
        title: "W".repeat(28),
        note: "Candidate proof must fail before materialization.",
      }));
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));
      const paths = pageImageWorkflowPaths(runDir);
      const derived = [paths.target_source_receipt, paths.target_raw_plan, paths.target_raw_evidence, paths.target_raw_review, paths.target_final_manifest];
      const beforeState = readFileSync(join(deck, "_state", "state.yaml"));
      expect(derived.every((path) => !existsSync(path))).toBe(true);

      await expect(buildFramedTargetRawPlan(runDir, { allowSourceRebuild: true })).rejects.toMatchObject({
        code: "framed_text_fit_failed",
        message: expect.stringContaining("scroll overflow"),
      });
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(beforeState);
      expect(derived.every((path) => !existsSync(path))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 20_000);

  it("stops malformed Framed profile repair before derived publication and returns to the plan checkpoint", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-profile-repair-boundary-"));
    const deck = join(root, "deck_framed_profile_repair");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), framedSource({
        title: "Profile repair gate",
      }));
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));

      const paths = pageImageWorkflowPaths(runDir);
      const derived = pageImageDerivedPagePaths(runDir, "DeckGo");
      const profiles = pageImagePresentationAsset(runDir, FRAMED_HEADER_PROFILES_FILE);
      const originalProfiles = readFileSync(profiles, "utf8");
      const stateBeforeFailure = readFileSync(join(deck, "_state", "state.yaml"));
      writeFileSync(profiles, originalProfiles.replace(
        "header_region: { x: 40, y: 28, width: 920, height: 238 }",
        "header_region: { x: 40, y: 28, width: 961, height: 238 }",
      ));

      const unpublished = [
        paths.target_source_receipt,
        paths.target_raw_plan,
        paths.target_provider_request_inspection,
        paths.derived_index,
        derived.source_receipt,
        derived.layout,
        derived.image2_request,
      ];
      expect(unpublished.every((path) => !existsSync(path))).toBe(true);
      await expect(buildFramedProgressiveTargetRawPlan(runDir)).rejects.toThrow();
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateBeforeFailure);
      expect(unpublished.every((path) => !existsSync(path))).toBe(true);

      writeFileSync(profiles, originalProfiles);
      const repaired = await buildFramedProgressiveTargetRawPlan(runDir);
      expect(repaired.source_epoch).toBe(1);
      expect(readFramedTargetStoredPlanContext(runDir).source_epoch).toBe(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 20_000);

  it("fails closed on a post-proof plan write and repairs the same checkpoint without advancing state", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-plan-write-recovery-"));
    const deck = join(root, "deck_framed_plan_write_recovery");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), framedSource({
        title: "Recover the exact plan checkpoint",
        note: "A failed plan write must remain unauthorizable.",
      }));
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));
      const paths = pageImageWorkflowPaths(runDir);
      mkdirSync(paths.target_raw_plan, { recursive: true });

      await expect(buildFramedTargetRawPlan(runDir)).rejects.toThrow();
      const stateAfterFailure = readFileSync(join(deck, "_state", "state.yaml"));
      const receiptAfterFailure = readFileSync(paths.target_source_receipt);
      await expect(authorizeFramedTargetRawPlan(runDir, { planHash: "a".repeat(64) }))
        .rejects.toMatchObject({ code: "target_raw_plan_required" });
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateAfterFailure);
      expect(readFileSync(paths.target_source_receipt)).toEqual(receiptAfterFailure);

      rmSync(paths.target_raw_plan, { recursive: true, force: true });
      const repaired = await buildFramedTargetRawPlan(runDir);
      expect(readFramedTargetStoredPlanContext(runDir).source_epoch).toBe(1);
      expect(canonicalJsonSha256(JSON.parse(readFileSync(paths.target_raw_plan, "utf8"))))
        .toBe(repaired.raw_work_plan.sha256);
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(stateAfterFailure);
      expect(readFileSync(paths.target_source_receipt)).toEqual(receiptAfterFailure);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 20_000);

  it("rejects a Pure receipt before creating target work", () => {
    expect(() => createFramedRawWorkPlan({
      receipt: { ...receipt, workflow: "pure" },
      provider_profile_sha256: digest("b"),
      authorization_scope_sha256: digest("c"),
      raw_contracts_by_slide: { DeckGo: digest("d") },
    }))
      .toThrow(/Framed workflow requires/);
  });

  it("keeps composition substitution below the public Framed workflow boundary", async () => {
    const rawWorkPlan = createFramedRawWorkPlan({
      receipt,
      provider_profile_sha256: digest("b"),
      authorization_scope_sha256: digest("c"),
      raw_contracts_by_slide: { DeckGo: digest("d") },
      provider_input_bindings_by_slide: { DeckGo: framedProviderInputBinding() },
    });
    const acceptedRawEvidence = createAcceptedRawEvidence({ plan: rawWorkPlan, provider_authorization_sha256: digest("e"), raw_review_sha256: digest("f"), raw_bytes_by_slide: { DeckGo: NATIVE_PROVIDER_PNG } });
    for (const [key, value] of Object.entries({
      compose: async () => Buffer.from("injected"),
      preflight: { ok: true },
      markup: "<main>injected</main>",
      css: ".pm-slide { color: red; }",
      asset_paths: ["/private/path.png"],
      capture_options: { scale: "css" },
      publication_root: "/private/output",
    })) {
      await expect(publishFramedFinalSlideManifest({
        receipt,
        rawWorkPlan,
        acceptedRawEvidence,
        rawBytesBySlide: { DeckGo: NATIVE_PROVIDER_PNG },
        [key]: value,
      })).rejects.toMatchObject({ code: "framed_render_input_invalid" });
    }
  });

  it("requires a raw rebuild when a Framed header literal changes its compiled input", () => {
    const next = {
      ...receipt,
      source_sha256: digest("f"),
      slides: [{
        ...receipt.slides[0],
        header_policy: {
          ...receipt.slides[0].header_policy,
          local_header: { kicker: null, title: "Updated stable heading", subtitle: null },
        },
      }],
    };
    const rawWorkPlan = createFramedRawWorkPlan({
      receipt,
      provider_profile_sha256: digest("b"),
      authorization_scope_sha256: digest("c"),
      raw_contracts_by_slide: { DeckGo: digest("d") },
      provider_input_bindings_by_slide: { DeckGo: framedProviderInputBinding() },
    });
    const acceptedRawEvidence = createAcceptedRawEvidence({
      plan: rawWorkPlan,
      provider_authorization_sha256: digest("e"),
      raw_review_sha256: digest("f"),
      raw_bytes_by_slide: { DeckGo: NATIVE_PROVIDER_PNG },
    });
    const nextRawWorkPlan = createRawWorkPlan({
      source_receipt_sha256: next.source_sha256,
      workflow: "framed",
      ordered_slide_ids: ["DeckGo"],
      provider_profile_sha256: digest("b"),
      authorization_scope_sha256: digest("c"),
      items: [{
        slide_id: "DeckGo",
        raw_contract_sha256: digest("d"),
        provider_input_binding: framedProviderInputBinding("9"),
      }],
    });
    expect(classifyFramedRefresh({ previousReceipt: receipt, nextReceipt: next, rawWorkPlan, acceptedRawEvidence, nextRawWorkPlan }))
      .toMatchObject({ kind: "rebuild_raw", provider_required: true, reason: "compiled_provider_input_drift" });
    const styleMasterDrift = createRawWorkPlan({
      source_receipt_sha256: next.source_sha256,
      workflow: "framed",
      ordered_slide_ids: ["DeckGo"],
      provider_profile_sha256: digest("e"),
      authorization_scope_sha256: digest("f"),
      items: [{
        slide_id: "DeckGo",
        raw_contract_sha256: digest("d"),
        provider_input_binding: framedProviderInputBinding(),
      }],
    });
    expect(classifyFramedRefresh({
      previousReceipt: receipt,
      nextReceipt: next,
      rawWorkPlan,
      acceptedRawEvidence,
      nextRawWorkPlan: styleMasterDrift,
    })).toMatchObject({ kind: "rebuild_raw", provider_required: true, reason: "generation_profile_drift" });
    expect(classifyFramedRefresh({ previousReceipt: receipt, nextReceipt: next }))
      .toMatchObject({ kind: "raw_evidence_required", provider_required: true });
    expect(classifyFramedRefresh({ previousReceipt: receipt, nextReceipt: next, rawWorkPlan, acceptedRawEvidence }))
      .toMatchObject({ kind: "raw_evidence_required", provider_required: true });
  });

  it("runs the selected Framed receipt through local composition and shared delivery with a provider fake", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-target-lifecycle-"));
    const deck = join(root, "deck_framed_target");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    const context = image.getContext("2d");
    context.fillStyle = "#1f4d6e";
    context.fillRect(0, 0, 2000, 1125);
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), framedSource({
        title: "Framed target fact",
        note: "Framed target source-owned note.",
      }));
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));
      const plan = await buildFramedTargetRawPlan(runDir);
      const paths = pageImageWorkflowPaths(runDir);
      const rawPlanBytes = readFileSync(paths.target_raw_plan);
      const sourceReceiptBytes = readFileSync(paths.target_source_receipt);
      const stateBeforeRawLifecycle = readState(deck, { purpose: "observe", runVersion: "v1" });
      const storedPlan = readFramedTargetStoredPlanContext(runDir);
      expect(storedPlan.source_epoch).toBe(1);
      expect(canonicalJsonSha256(storedPlan.raw_work_plan)).toBe(plan.raw_work_plan.sha256);
      expect(readFileSync(paths.target_raw_plan)).toEqual(rawPlanBytes);
      expect(readFileSync(paths.target_source_receipt)).toEqual(sourceReceiptBytes);
      expect(readState(deck, { purpose: "observe", runVersion: "v1" })).toEqual(stateBeforeRawLifecycle);
      const projection = plan.raw_work_plan.sha256;
      expect(await authorizeFramedTargetRawPlan(runDir, { planHash: projection })).toMatchObject({ authorized: true });
      expect(await generateFramedTargetRawPlan(runDir, {
        planHash: projection,
        submit: async () => NATIVE_PROVIDER_PNG,
      })).toMatchObject({ submitted: 1 });
      const preparedReview = await prepareFramedTargetRawReview(runDir);
      expect(preparedReview).toMatchObject({
        raw_review_sha256: expect.any(String),
        complete_page_presentation_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
        projection_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      const completePageRoot = join(paths.review_root, "complete-page");
      const reviewRoot = join(
        completePageRoot,
        resolveContentAddressName(completePageRoot, plan.raw_work_plan.sha256),
      );
      const reviewProjection = await loadImage(readFileSync(join(reviewRoot, "complete-page-review.png")));
      expect(reviewProjection.width).toBeGreaterThan(0);
      expect(reviewProjection.height).toBeGreaterThan(0);
      const providerPage = readFileSync(join(reviewRoot, "provider-page", "01_DeckGo.png"));
      const completePage = readFileSync(join(reviewRoot, "complete-page", "01_DeckGo.png"));
      expect(completePage.equals(providerPage)).toBe(false);
      expect(await decideFramedTargetRawReview(runDir, { decision: "proceed" })).toMatchObject({
        decision: "proceed",
        accepted_raw_evidence: { workflow: "framed" },
      });
      expect(readFileSync(paths.target_raw_plan)).toEqual(rawPlanBytes);
      expect(readFileSync(paths.target_source_receipt)).toEqual(sourceReceiptBytes);
      expect(readState(deck, { purpose: "observe", runVersion: "v1" })
        .page_image_target_evidence.by_version["3_versions/v1"].source_epoch).toBe(1);
      const delivery = await buildFramedTargetDelivery(runDir);
      expect(delivery).toMatchObject({ ok: true, delivery: { receipt: { ordered_slide_ids: ["DeckGo"] } } });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("requires raw rebuild for header text but preserves notes-only refresh", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-target-refresh-"));
    const deck = join(root, "deck_framed_refresh");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    const context = image.getContext("2d");
    context.fillStyle = "#1f4d6e";
    context.fillRect(0, 0, 2000, 1125);
    const source = (title, note = "Framed target source-owned note.") => framedSource({ title, note });
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source("Original heading"));
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));
      const initialPlan = await buildFramedTargetRawPlan(runDir);
      const projection = initialPlan.raw_work_plan.sha256;
      await authorizeFramedTargetRawPlan(runDir, { planHash: projection });
      let providerSubmissions = 0;
      await generateFramedTargetRawPlan(runDir, {
        planHash: projection,
        submit: async () => {
          providerSubmissions += 1;
          return NATIVE_PROVIDER_PNG;
        },
      });
      await prepareFramedTargetRawReview(runDir);
      await decideFramedTargetRawReview(runDir, { decision: "proceed" });
      await buildFramedTargetDelivery(runDir);
      expect(providerSubmissions).toBe(1);

      const paths = pageImageWorkflowPaths(runDir);
      const previousEvidence = JSON.parse(readFileSync(paths.target_raw_evidence, "utf8"));
      const previousRawBytes = readFileSync(join(paths.raw_root, "01_DeckGo.png"));
      const authorizationBefore = readState(deck, { purpose: "observe", runVersion: "v1" })
        .page_image_raw_provider_authorization.by_version["3_versions/v1"];
      writeFileSync(join(runDir, "slide-specifications.md"), source("Updated heading"));

      await expect(refreshFramedTargetText(runDir, { slideIds: ["DeckGo"] })).rejects.toMatchObject({
        code: "framed_local_compose_rebuild_required",
      });
      expect(providerSubmissions).toBe(1);
      expect(readFileSync(join(paths.raw_root, "01_DeckGo.png"))).toEqual(previousRawBytes);
      const state = readState(deck, { purpose: "observe", runVersion: "v1" });
      const target = state.page_image_target_evidence.by_version["3_versions/v1"];
      expect(target).toMatchObject({ workflow: "framed", source_epoch: 1, accepted_raw_evidence_sha256: expect.any(String), final_manifest_sha256: expect.any(String), delivery_receipt_sha256: expect.any(String) });
      expect(state.page_image_raw_provider_authorization.by_version["3_versions/v1"]).toEqual(authorizationBefore);
      expect(JSON.parse(readFileSync(paths.target_raw_evidence, "utf8"))).toEqual(previousEvidence);

      const finalBytes = readFileSync(join(paths.final_root, "01_DeckGo.png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source("Original heading", "Updated source-owned note."));
      const notes = await refreshFramedTargetNotes(runDir);
      expect(notes).toMatchObject({ ok: true, delivery: { receipt: { notes_injected: 1 } } });
      expect(providerSubmissions).toBe(1);
      expect(readFileSync(join(paths.raw_root, "01_DeckGo.png"))).toEqual(previousRawBytes);
      expect(readFileSync(join(paths.final_root, "01_DeckGo.png"))).toEqual(finalBytes);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("retains accepted Framed progressive raw evidence for a notes-only replan", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-progressive-local-rebind-"));
    const deck = join(root, "deck_framed_progressive_local_rebind");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    const context = image.getContext("2d");
    context.fillStyle = "#1f4d6e";
    context.fillRect(0, 0, 2000, 1125);
    const source = (note = "Framed progressive local-rebind fixture.") => framedSource({
      title: "Original progressive heading",
      note,
    });
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source());
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));

      const initial = await buildFramedProgressiveTargetRawPlan(runDir);
      const initialPlanHash = initial.progressive_raw_work_plan.sha256;
      const paths = pageImageWorkflowPaths(runDir);
      const initialInspectionBytes = readFileSync(paths.target_provider_request_inspection);
      const initialInspection = JSON.parse(initialInspectionBytes.toString("utf8"));
      const initialRequest = initial.provider_requests_by_slide.DeckGo;
      const derivedPaths = pageImageDerivedPagePaths(runDir, "DeckGo");
      const derivedIndex = JSON.parse(readFileSync(paths.derived_index, "utf8"));
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
        workflow: "framed",
        provider_profile_sha256: initial.progressive_raw_work_plan.provider_profile_sha256,
        transport: { model: initialRequest.generation_profile.provider.model, size: "2000x1125" },
        ordered_slide_ids: ["DeckGo"],
      });
      expect(initialInspection.items).toHaveLength(1);
      expect(initialInspection.items[0]).toMatchObject({
        slide_id: "DeckGo",
        raw_contract_sha256: initial.progressive_raw_work_plan.items[0].raw_contract_sha256,
        provider_input_binding: initial.progressive_raw_work_plan.items[0].provider_input_binding,
        provider_request_sha256: canonicalJsonSha256(initialRequest),
      });
      expect(JSON.parse(initialInspection.items[0].prompt)).toEqual(initialRequest);
      expect(JSON.stringify(initialInspection)).not.toMatch(/data:image|authorization|api[_-]?key/i);
      expect(initial.derived_data_publication).toMatchObject({
        root: paths.derived_root,
        index: paths.derived_index,
        workflow: "framed",
        progressive_raw_work_plan_sha256: initialPlanHash,
      });
      expect(derivedIndex.payload.pages).toEqual([expect.objectContaining({ slide_id: "DeckGo", position: 1 })]);
      for (const path of [
        derivedPaths.source_receipt,
        derivedPaths.layout,
        derivedPaths.render_model,
        derivedPaths.generation_spec,
        derivedPaths.image2_request,
        derivedPaths.framed_header_html,
        derivedPaths.artifact_index,
      ]) expect(existsSync(path)).toBe(true);
      expect(readFileSync(derivedPaths.framed_header_html, "utf8")).toBe(renderFramedHeaderOverlayHtml({
        slide_id: "DeckGo",
        presentation_profile: initial.receipt.slides[0].visual_language.presentation.profile,
        local_header: initial.receipt.slides[0].header_policy.local_header,
      }));
      expect(JSON.parse(readFileSync(derivedPaths.image2_request, "utf8")).payload).toMatchObject({
        canonical_utf8: initialRequest.compiled_provider_input.utf8,
        request_digest: initialRequest.compiled_provider_input.sha256,
      });
      expect(JSON.parse(readFileSync(derivedPaths.artifact_index, "utf8")).payload.artifact_references)
        .toHaveProperty("framed_header_html");
      const pilot = await planFramedTargetPilot(runDir, {
        planHash: initialPlanHash,
        slideIds: ["DeckGo"],
      });
      await authorizeFramedProgressiveRawBatch(runDir, {
        planHash: initialPlanHash,
        batchHash: pilot.batch.batch_hash,
      });
      let providerSubmissions = 0;
      await generateFramedProgressiveRawItem(runDir, {
        planHash: initialPlanHash,
        batchHash: pilot.batch.batch_hash,
        submit: async () => {
          providerSubmissions += 1;
          return NATIVE_PROVIDER_PNG;
        },
      });
      await prepareFramedProgressiveRawReview(runDir, { planHash: initialPlanHash });
      const accepted = await acceptFramedProgressiveRawReview(runDir, {
        planHash: initialPlanHash,
        decision: "proceed",
      });
      expect(providerSubmissions).toBe(1);
      expect(accepted.accepted_raw_evidence_sha256).toMatch(/^[0-9a-f]{64}$/);

      const initialAccepted = readProgressiveAcceptedRawWork({
        runDir,
        workflow: "framed",
        plan_hash: initialPlanHash,
        expected_plan: initial.progressive_raw_work_plan,
      });
      const initialDirect = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: initialPlanHash });
      const initialState = readState(deck, { purpose: "observe", runVersion: "v1" });
      expect(initialState.page_image_progressive_handoff.by_version["3_versions/v1"])
        .toMatchObject({
          raw_work_plan_sha256: initialPlanHash,
          complete_raw_review_sha256: initialAccepted.accepted_raw_evidence.complete_raw_review_sha256,
          accepted_raw_evidence_sha256: accepted.accepted_raw_evidence_sha256,
      });

      writeFileSync(join(runDir, "slide-specifications.md"), source("Updated source-owned note."));

      const rebound = await buildFramedProgressiveTargetRawPlan(runDir);
      const reboundPlanHash = rebound.progressive_raw_work_plan.sha256;
      const reboundInspection = JSON.parse(readFileSync(paths.target_provider_request_inspection, "utf8"));
      const reboundAccepted = readProgressiveAcceptedRawWork({
        runDir,
        workflow: "framed",
        plan_hash: reboundPlanHash,
        expected_plan: rebound.progressive_raw_work_plan,
      });
      const successorDirect = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: reboundPlanHash });
      const reboundState = readState(deck, { purpose: "observe", runVersion: "v1" });

      expect(providerSubmissions).toBe(1);
      expect(reboundPlanHash).not.toBe(initialPlanHash);
      expect(rebound.provider_request_inspection).toMatchObject({
        path: initial.provider_request_inspection.path,
        plan_hash: reboundPlanHash,
        sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      expect(rebound.provider_request_inspection.sha256).not.toBe(initial.provider_request_inspection.sha256);
      expect(reboundInspection.progressive_raw_work_plan_sha256).toBe(reboundPlanHash);
      expect(reboundInspection.source_receipt_sha256).not.toBe(initialInspection.source_receipt_sha256);
      expect(reboundInspection.items[0].provider_request_sha256)
        .toBe(canonicalJsonSha256(rebound.provider_requests_by_slide.DeckGo));
      expect(rebound.progressive_raw_work_plan.source_epoch).toBe(initial.progressive_raw_work_plan.source_epoch);
      expect(rebound.progressive_raw_work_plan.source_receipt_sha256)
        .not.toBe(initial.progressive_raw_work_plan.source_receipt_sha256);
      expect(rebound.progressive_publication).toMatchObject({
        reused_slide_ids: ["DeckGo"],
        retained_complete_raw_review_sha256: initialAccepted.accepted_raw_evidence.complete_raw_review_sha256,
        accepted_raw_evidence_sha256: reboundAccepted.accepted_raw_evidence_sha256,
      });
      expect(reboundAccepted.accepted_raw_evidence.complete_raw_review_sha256)
        .not.toBe(initialAccepted.accepted_raw_evidence.complete_raw_review_sha256);
      expect(successorDirect.batches).toHaveLength(0);
      expect(successorDirect.grants).toHaveLength(0);
      expect(successorDirect.attempts).toHaveLength(0);
      expect(successorDirect.materializations).toHaveLength(1);
      expect(successorDirect.materializations[0].provenance.record).toMatchObject({
        kind: "reuse",
        reused_from_provenance_sha256: initialDirect.materializations[0].provenance.sha256,
      });
      expect(successorDirect.complete_reviews.some((entry) =>
        entry.record.retained_from_complete_raw_review_sha256 === initialAccepted.accepted_raw_evidence.complete_raw_review_sha256,
      )).toBe(true);
      expect(reboundState.page_image_progressive_handoff.by_version["3_versions/v1"])
        .toMatchObject({
          source_epoch: initial.progressive_raw_work_plan.source_epoch,
          source_receipt_sha256: rebound.progressive_raw_work_plan.source_receipt_sha256,
          raw_work_plan_sha256: reboundPlanHash,
          complete_raw_review_sha256: reboundAccepted.accepted_raw_evidence.complete_raw_review_sha256,
          accepted_raw_evidence_sha256: reboundAccepted.accepted_raw_evidence_sha256,
        });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 30_000);

  it("publishes a partial Framed Pilot with provider and production-equivalent complete pages", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-progressive-pilot-"));
    const deck = join(root, "deck_framed_progressive_pilot");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    const context = image.getContext("2d");
    context.fillStyle = "#1f4d6e";
    context.fillRect(0, 0, 2000, 1125);
    const slides = ["DeckGo", "FlowGo", "DataGo", "ToneGo", "FormGo", "GridGo", "LineGo", "RoleGo", "PathGo", "DataMap"];
    const source = `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: framed
---

${slides.map((slideId, index) => `## Slide ${String(index + 1).padStart(2, "0")}: \`${slideId}\`

**TITLE**: Framed Pilot ${index + 1}
${slideId === "DataMap" ? "**PAGE CLASS**: opening\n" : ""}
**SLIDE BODY**:
\`\`\`yaml
items:
  - role: label
    literal: "Pilot page ${index + 1} remains provider-rendered."
\`\`\`
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`).join("\n")}> **SPEAKER NOTE**: Partial Framed Pilot fixture.
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));

      const plan = await buildFramedProgressiveTargetRawPlan(runDir);
      const planHash = plan.progressive_raw_work_plan.sha256;
      const deckGo = plan.provider_requests_by_slide.DeckGo.raw_contract.framed;
      const dataMap = plan.provider_requests_by_slide.DataMap.raw_contract.framed;
      expect(deckGo).toMatchObject({ profile_id: "standard" });
      expect(dataMap).toMatchObject({ profile_id: "opening" });
      expect(deckGo.render_profile_digest).not.toBe(dataMap.render_profile_digest);
      const pilot = await planFramedTargetPilot(runDir, { planHash, slideIds: ["DeckGo", "DataMap"] });
      await authorizeFramedProgressiveRawBatch(runDir, { planHash, batchHash: pilot.batch.batch_hash });
      const rawBytes = NATIVE_PROVIDER_PNG;
      await generateFramedProgressiveRawItem(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
        submit: async () => rawBytes,
      });
      await generateFramedProgressiveRawItem(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
        submit: async () => rawBytes,
      });
      const evidence = await prepareFramedProgressivePilotReview(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
      });
      const paths = pageImageWorkflowPaths(runDir);
      const pilotRoot = join(paths.review_root, "pilot", resolveContentAddressName(join(paths.review_root, "pilot"), pilot.batch.batch_hash));
      const presentation = JSON.parse(readFileSync(join(pilotRoot, "pilot-page-review-evidence.json"), "utf8"));
      expect(evidence).toMatchObject({ pilot_evidence_sha256: expect.stringMatching(/^[0-9a-f]{64}$/) });
      expect(readFileSync(join(pilotRoot, "provider-page", "01_DeckGo.png"))).toEqual(rawBytes);
      expect(existsSync(join(pilotRoot, "complete-page", "01_DeckGo.png"))).toBe(true);
      expect(readFileSync(join(pilotRoot, "provider-page", "10_DataMap.png"))).toEqual(rawBytes);
      expect(existsSync(join(pilotRoot, "complete-page", "10_DataMap.png"))).toBe(true);
      expect(existsSync(join(pilotRoot, "provider-page", "DataMap.png"))).toBe(false);
      expect(existsSync(join(pilotRoot, "complete-page", "DataMap.png"))).toBe(false);
      expect(presentation).toMatchObject({
        schema: "page-image-pilot-page-review-presentation",
        workflow: "framed",
        raw_work_plan_sha256: planHash,
        batch_sha256: pilot.batch.batch_hash,
        has_complete_page_artifact: true,
        items: [{ slide_id: "DeckGo" }, { slide_id: "DataMap" }],
      });
      expect(existsSync(join(pilotRoot, "pilot-page-review.png"))).toBe(true);
      expect(existsSync(paths.target_final_manifest)).toBe(false);
      expect(existsSync(join(paths.final_root, "deck.pptx"))).toBe(false);
      expect(existsSync(join(paths.final_root, "pptx-assembly.json"))).toBe(false);
      expect(existsSync(join(paths.final_root, "notes-receipt.json"))).toBe(false);

      const decision = await acceptFramedProgressivePilot(runDir, {
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
  }, 30_000);

  it("finalizes Framed from the exact reviewed header composite", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-progressive-finalization-"));
    const deck = join(root, "deck_framed_progressive_finalization");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    const context = image.getContext("2d");
    context.fillStyle = "#1f4d6e";
    context.fillRect(0, 0, 2000, 1125);
    const source = `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: framed
---

## Slide 01: \`DeckGo\`

**TITLE**: Framed finalization fact
**SLIDE BODY**:
\`\`\`yaml
items:
  - role: label
    literal: "This label remains provider-rendered."
\`\`\`
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Framed finalization source-owned note.
`;
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source);
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));

      const plan = await buildFramedProgressiveTargetRawPlan(runDir);
      const planHash = plan.progressive_raw_work_plan.sha256;
      const pilot = await planFramedTargetPilot(runDir, { planHash, slideIds: ["DeckGo"] });
      await authorizeFramedProgressiveRawBatch(runDir, { planHash, batchHash: pilot.batch.batch_hash });
      await generateFramedProgressiveRawItem(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
        submit: async () => NATIVE_PROVIDER_PNG,
      });
      await prepareFramedProgressiveRawReview(runDir, { planHash });
      const accepted = await acceptFramedProgressiveRawReview(runDir, { planHash, decision: "proceed" });
      const acceptedWork = readProgressiveAcceptedRawWork({
        runDir,
        workflow: "framed",
        plan_hash: planHash,
        expected_plan: plan.progressive_raw_work_plan,
      });
      expect(acceptedWork).toMatchObject({
        complete_raw_review_sha256: accepted.complete_raw_review_sha256,
        complete_raw_review: { decision: "proceed" },
      });

      const paths = pageImageWorkflowPaths(runDir);
      const compositePath = join(paths.review_root, "complete-page", resolveContentAddressName(join(paths.review_root, "complete-page"), planHash), "complete-page", "01_DeckGo.png");
      const reviewedComposite = readFileSync(compositePath);
      const delivery = await buildFramedProgressiveTargetDelivery(runDir);
      expect(delivery).toMatchObject({ ok: true, delivery: { receipt: { ordered_slide_ids: ["DeckGo"] } } });
      expect(readFileSync(join(paths.final_root, "01_DeckGo.png"))).toEqual(reviewedComposite);

      const finalManifest = readFileSync(paths.target_final_manifest);
      writeFileSync(compositePath, NATIVE_PROVIDER_PNG);
      await expect(buildFramedProgressiveTargetDelivery(runDir)).rejects.toMatchObject({
        code: "framed_finalization_review_stale",
      });
      expect(readFileSync(paths.target_final_manifest)).toEqual(finalManifest);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 30_000);

  it("keeps a Framed header-encroachment repair on the existing raw rebuild path", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-progressive-repair-"));
    const deck = join(root, "deck_framed_progressive_repair");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), framedSource({
        title: "Header encroachment requires repair",
        bodyYaml: `items:
  - role: label
    literal: "The human must reject visible provider content in the local header reserve."`,
      }));
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));

      const plan = await buildFramedProgressiveTargetRawPlan(runDir);
      const planHash = plan.progressive_raw_work_plan.sha256;
      const pilot = await planFramedTargetPilot(runDir, { planHash, slideIds: ["DeckGo"] });
      await authorizeFramedProgressiveRawBatch(runDir, { planHash, batchHash: pilot.batch.batch_hash });
      await generateFramedProgressiveRawItem(runDir, {
        planHash,
        batchHash: pilot.batch.batch_hash,
        submit: async () => NATIVE_PROVIDER_PNG,
      });
      await prepareFramedProgressiveRawReview(runDir, { planHash });

      const repaired = await acceptFramedProgressiveRawReview(runDir, {
        planHash,
        decision: "repair",
      });
      expect(repaired).toMatchObject({
        accepted_raw_evidence_sha256: null,
        next_action: { action_id: "rebuild_progressive_raw_work", kind: "repair", plan_hash: planHash },
      });
      expect(readState(deck, { purpose: "observe", runVersion: "v1" })
        .page_image_progressive_handoff.by_version["3_versions/v1"])
        .toMatchObject({
          complete_raw_review_sha256: repaired.complete_raw_review_sha256,
          accepted_raw_evidence_sha256: null,
          final_manifest_sha256: null,
          delivery_receipt_sha256: null,
        });
      await expect(buildFramedProgressiveTargetDelivery(runDir)).rejects.toMatchObject({
        code: "progressive_raw_accepted_evidence_required",
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 30_000);

  it("rejects Framed Pilot render overrides before resolving source or starting a browser", async () => {
    for (const override of [
      { renderer: "untrusted" },
      { html: "<main>untrusted</main>" },
      { css: "* { color: red; }" },
      { fontPath: "/tmp/untrusted.woff2" },
      { capture: { width: 1 } },
      { proof: { trusted: true } },
      { outputPath: "/tmp/untrusted-pilot" },
    ]) {
      await expect(prepareFramedProgressivePilotReview(join(tmpdir(), "missing-framed-pilot-run"), {
        planHash: digest("a"),
        batchHash: digest("b"),
        ...override,
      })).rejects.toMatchObject({
        code: "framed_pilot_input_invalid",
        message: expect.stringContaining("planHash and batchHash"),
      });
    }
  });

  it("requires a raw rebuild from the public title-refresh command", async () => {
    const root = mkdtempSync(join(tmpdir(), "framed-target-cli-refresh-"));
    const deck = join(root, "deck_framed_cli_refresh");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    const context = image.getContext("2d");
    context.fillStyle = "#1f4d6e";
    context.fillRect(0, 0, 2000, 1125);
    const source = (title) => framedSource({ title });
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), image.toBuffer("image/png"));
      writeFileSync(join(runDir, "slide-specifications.md"), source("Original CLI heading"));
      await acceptLocalStyleMasterFixture(resolveFramedStyleMasterScope(runDir));
      const initialPlan = await buildFramedTargetRawPlan(runDir);
      const projection = initialPlan.raw_work_plan.sha256;
      await authorizeFramedTargetRawPlan(runDir, { planHash: projection });
      let providerSubmissions = 0;
      await generateFramedTargetRawPlan(runDir, {
        planHash: projection,
        submit: async () => {
          providerSubmissions += 1;
          return NATIVE_PROVIDER_PNG;
        },
      });
      await prepareFramedTargetRawReview(runDir);
      await decideFramedTargetRawReview(runDir, { decision: "proceed" });
      await buildFramedTargetDelivery(runDir);
      const paths = pageImageWorkflowPaths(runDir);
      const rawBytes = readFileSync(join(paths.raw_root, "01_DeckGo.png"));
      const previousEvidence = JSON.parse(readFileSync(paths.target_raw_evidence, "utf8"));

      writeFileSync(join(runDir, "slide-specifications.md"), source("Refreshed CLI heading"));
      const result = runFlow(["refresh", runDir, "--kind", "title", "--only", "DeckGo"]);

      expect(result.status, result.stderr).not.toBe(0);
      const diagnostic = JSON.parse(result.stderr.trim().split("\n").at(-1));
      expect(diagnostic).toMatchObject({
        ok: false,
        code: "FAILED",
        message: expect.stringContaining("Framed local refresh requires exact unchanged underlay evidence"),
      });
      expect(providerSubmissions).toBe(1);
      expect(readFileSync(join(paths.raw_root, "01_DeckGo.png"))).toEqual(rawBytes);
      expect(JSON.parse(readFileSync(paths.target_raw_evidence, "utf8"))).toEqual(previousEvidence);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
