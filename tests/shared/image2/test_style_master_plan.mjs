import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";
import { decode as decodePng, encode as encodePng } from "fast-png";

const canvasLoaderControls = vi.hoisted(() => ({
  rejectPrivatePng: false,
  hasPrivateCaBX(value) {
    if (!Buffer.isBuffer(value) && !(value instanceof Uint8Array)) return false;
    const bytes = Buffer.from(value);
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const length = bytes.readUInt32BE(offset);
      if (offset + 12 + length > bytes.length) return false;
      if (bytes.subarray(offset + 4, offset + 8).toString("ascii") === "caBX") return true;
      offset += 12 + length;
    }
    return false;
  },
}));

vi.mock("@napi-rs/canvas", async (importOriginal) => {
  const canvas = await importOriginal();
  return {
    ...canvas,
    async loadImage(value, ...args) {
      if (canvasLoaderControls.rejectPrivatePng && canvasLoaderControls.hasPrivateCaBX(value)) {
        throw new Error("strict canvas PNG loader rejected private caBX media");
      }
      return canvas.loadImage(value, ...args);
    },
  };
});

import { canonicalJsonSha256 } from "../../../ppt_maker_harness/scripts/shared/identity/canonical_json.mjs";
import {
  abandonStyleMasterCandidates,
  acceptStyleMasterCandidateReview,
  authorizeStyleMasterCandidates,
  compileStyleMasterProviderPrompt,
  generateStyleMasterCandidates,
  inspectPendingStyleMasterSuccessorCandidateArtifacts,
  inspectStyleMasterCandidates,
  planStyleMasterCandidates,
  prepareStyleMasterCandidateReview,
} from "../../../ppt_maker_harness/scripts/shared/image2/style_master_plan.mjs";
import {
  bindStyleMasterScopeCandidate,
  resolveStyleMasterScopeContext,
} from "../../../ppt_maker_harness/scripts/shared/image2/style_master_scope.mjs";
import {
  STYLE_MASTER_CANDIDATE_ABANDONMENT_SCHEMA,
  STYLE_MASTER_GENERATED_PROVENANCE_SCHEMA,
  STYLE_MASTER_REVIEW_DECISION_SCHEMA,
  STYLE_MASTER_SELECTION_SCHEMA,
  createStyleMasterPlanRecord,
  createStyleMasterCandidateAttemptRecord,
  createStyleMasterCandidateGrantRecord,
  createStyleMasterHeadRecord,
  createStyleMasterProviderRequestRecord,
  normalizeStyleMasterAbandonmentReason,
  styleMasterCanonicalBytes,
  styleMasterGenerationProfileSha256,
  styleMasterReasonSha256,
  validateStyleMasterAbandonmentRecord,
  validateStyleMasterCandidateAttemptRecord,
  validateStyleMasterCandidateGrantRecord,
  validateStyleMasterGeneratedProvenance,
  validateStyleMasterHeadRecord,
  validateStyleMasterProviderRequestRecord,
  validateStyleMasterReviewDecisionRecord,
} from "../../../ppt_maker_harness/scripts/shared/image2/style_master_schema.mjs";
import {
  createStyleMasterStagingDirectory,
  createOrExactMatchStyleMasterRecord,
  placeStyleMasterCandidateImage,
  publishStyleMasterStagedPlan,
  styleMasterStorePaths,
  writeStyleMasterCandidateAttemptCas,
} from "../../../ppt_maker_harness/scripts/shared/image2/style_master_store.mjs";
import {
  SLIDE_SPECS_NAME,
  STYLE_MASTER_IMAGE,
  STYLE_MASTER_PROMPT,
  initBundle,
  styleAsset,
} from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { pageImageWorkflowPaths } from "../../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import {
  CONDITIONS,
  readState,
  recordEffectiveStyleMasterSelection,
  resolveEffectiveStyleMasterSelection,
  statePath,
  writeState,
} from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";

const digest = (value) => createHash("sha256").update(value).digest("hex");

function source(title = "Style Master planning") {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-image-workflow-v1
  workflow: framed
---

## Slide 01: \`DeckGo\`

**TITLE**: ${title}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-readable-text
  - no-labels
\`\`\`

> **SPEAKER NOTE**: Style Master planning remains before page raw work.

## Slide 02: \`ViewMap\`

**TITLE**: Style context membership remains stable
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: layered-grid
motifs: []
negative_constraints:
  - no-readable-text
\`\`\`
`;
}

function localImageBytes(variant = 0) {
  return Buffer.from(variant === 0
    ? "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABHNCSVQICAgIfAhkiAAAAAFzUkdCAK7OHOkAAAANSURBVAiZY1AJyPoPAANYAd6lcnCEAAAAAElFTkSuQmCC"
    : "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABHNCSVQICAgIfAhkiAAAAAFzUkdCAK7OHOkAAAANSURBVAiZY8hyUPkPAAO0Ac51OmnoAAAAAElFTkSuQmCC", "base64");
}

let generatedCandidatePng = null;

function generatedCandidateBytes() {
  if (generatedCandidatePng === null) {
    const data = new Uint8Array(2000 * 1125 * 4);
    data.fill(255);
    generatedCandidatePng = Buffer.from(encodePng({ width: 2000, height: 1125, data }));
  }
  return Buffer.from(generatedCandidatePng);
}

function nativeGeneratedCandidateBytes(width, height) {
  const data = new Uint8Array(width * height * 4);
  data.fill(255);
  return Buffer.from(encodePng({ width, height, data }));
}

function sixteenBitRgbCandidateBytes(width, height) {
  const data = new Uint16Array(width * height * 3);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    data[pixel * 3] = 0x1234;
    data[pixel * 3 + 1] = 0x5678;
    data[pixel * 3 + 2] = 0x9abc;
  }
  return Buffer.from(encodePng({ width, height, channels: 3, depth: 16, data }));
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBytes.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length);
  return chunk;
}

function providerPngWithPrivateCaBX(bytes) {
  const source = Buffer.from(bytes);
  const ihdrEnd = 8 + 12 + source.readUInt32BE(8);
  // C2PA-style ancillary/private chunk: caBX carries a JUMBF box header.
  const payload = Buffer.concat([Buffer.from([0, 0, 0, 32]), Buffer.from("jumb", "ascii"), Buffer.alloc(24)]);
  return Buffer.concat([source.subarray(0, ihdrEnd), pngChunk("caBX", payload), source.subarray(ihdrEnd)]);
}

function fixture({ local = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "style-master-plan-"));
  const deck = join(root, "deck_style_master_plan");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(runDir, SLIDE_SPECS_NAME), source(), "utf8");
  writeFileSync(styleAsset(runDir, STYLE_MASTER_PROMPT), "Use a calm editorial visual system with material depth.\n", "utf8");
  if (local) writeFileSync(styleAsset(runDir, STYLE_MASTER_IMAGE), localImageBytes());
  return { root, deck, runDir, paths: pageImageWorkflowPaths(runDir) };
}

function assertNoPageRawMaterialization(value, stateBefore) {
  expect(readFileSync(statePath(value.deck))).toEqual(stateBefore);
  expect(existsSync(value.paths.target_source_receipt)).toBe(false);
  expect(existsSync(value.paths.target_raw_plan)).toBe(false);
  expect(existsSync(value.paths.target_raw_evidence)).toBe(false);
}

function projection(recipe, { relationship = null } = {}) {
  return {
    schema: "pptmaker-page-image-visual-language-v1",
    recipe: { id: recipe, provider_clause_sha256: "a".repeat(64) },
    ...(relationship ? { relationship } : {}),
  };
}

function planningScope(value, { slides = null } = {}) {
  const sourcePath = join(value.runDir, SLIDE_SPECS_NAME);
  const sourceSha256 = digest(readFileSync(sourcePath));
  return bindStyleMasterScopeCandidate(resolveStyleMasterScopeContext(value.runDir), {
    run_dir: value.runDir,
    deck_dir: value.deck,
    source_path: sourcePath,
    source_sha256: sourceSha256,
    workflow: "framed",
    receipt: {
      workflow: "framed",
      source_sha256: sourceSha256,
      slides: slides || [
        {
          slide_id: "ViewMap",
          workflow: "framed",
          visual_language: { projection: projection("layered-grid") },
        },
        {
          slide_id: "DeckGo",
          workflow: "framed",
          visual_language: { projection: projection("editorial-systems") },
        },
      ],
    },
  });
}

function detachedPlan() {
  return createStyleMasterPlanRecord({
    schema: "page-image-style-master-plan-identity-v1",
    run_version: "v1",
    workflow: "framed",
    plan_generation: 91,
    previous_plan_sha256: null,
    previous_selection_sha256: null,
    style_intent_sha256: digest("unreferenced intent"),
    style_context_sha256: digest("unreferenced context"),
    candidate_generation_profile_sha256: styleMasterGenerationProfileSha256(),
    compiled_prompt_sha256: digest("unreferenced prompt"),
    generated_candidate_count: 1,
    candidates: [{ candidate_id: "candidate-001", kind: "generated" }],
  });
}

function failedAttempt(plan) {
  const paths = styleMasterStorePaths(plan.run_dir, { plan_sha256: plan.plan_sha256 });
  const grant = createStyleMasterCandidateGrantRecord(plan.plan);
  const grantChecked = validateStyleMasterCandidateGrantRecord(grant, { plan: plan.plan });
  createOrExactMatchStyleMasterRecord(paths.candidate_grant, grant, validateStyleMasterCandidateGrantRecord, { plan: plan.plan });
  const claimed = createStyleMasterCandidateAttemptRecord({
    run_version: plan.run_version,
    workflow: plan.workflow,
    plan_sha256: plan.plan_sha256,
    candidate_id: "candidate-001",
    candidate_grant_sha256: grantChecked.candidate_grant_sha256,
  });
  const failed = {
    ...claimed,
    status: "failed",
    provider_request_sha256: digest("failed request"),
  };
  const candidatePaths = styleMasterStorePaths(plan.run_dir, {
    plan_sha256: plan.plan_sha256,
    candidate_id: "candidate-001",
  });
  createOrExactMatchStyleMasterRecord(candidatePaths.candidate_attempt, failed, validateStyleMasterCandidateAttemptRecord, {
    plan: plan.plan,
    grant,
  });
}

function submittedAttempt(plan) {
  const paths = styleMasterStorePaths(plan.run_dir, { plan_sha256: plan.plan_sha256 });
  const grant = createStyleMasterCandidateGrantRecord(plan.plan);
  const grantChecked = validateStyleMasterCandidateGrantRecord(grant, { plan: plan.plan });
  createOrExactMatchStyleMasterRecord(paths.candidate_grant, grant, validateStyleMasterCandidateGrantRecord, { plan: plan.plan });
  const claimed = createStyleMasterCandidateAttemptRecord({
    run_version: plan.run_version,
    workflow: plan.workflow,
    plan_sha256: plan.plan_sha256,
    candidate_id: "candidate-001",
    candidate_grant_sha256: grantChecked.candidate_grant_sha256,
  });
  const submitted = {
    ...claimed,
    status: "submitted",
    provider_request_sha256: digest("submitted request"),
  };
  const candidatePaths = styleMasterStorePaths(plan.run_dir, {
    plan_sha256: plan.plan_sha256,
    candidate_id: "candidate-001",
  });
  createOrExactMatchStyleMasterRecord(candidatePaths.candidate_attempt, submitted, validateStyleMasterCandidateAttemptRecord, {
    plan: plan.plan,
    grant,
  });
}

function grantFor(plan) {
  const paths = styleMasterStorePaths(plan.run_dir, { plan_sha256: plan.plan_sha256 });
  const grant = createStyleMasterCandidateGrantRecord(plan.plan);
  const checked = validateStyleMasterCandidateGrantRecord(grant, { plan: plan.plan });
  createOrExactMatchStyleMasterRecord(paths.candidate_grant, grant, validateStyleMasterCandidateGrantRecord, { plan: plan.plan });
  return { paths, grant, checked };
}

function readCandidateAttempt(runDir, planSha256, candidateId) {
  const paths = styleMasterStorePaths(runDir, {
    plan_sha256: planSha256,
    candidate_id: candidateId,
  });
  return Object.freeze({
    paths,
    record: JSON.parse(readFileSync(paths.candidate_attempt, "utf8")),
  });
}

function claimedAttempt(plan) {
  const { grant, checked } = grantFor(plan);
  const attempt = createStyleMasterCandidateAttemptRecord({
    run_version: plan.run_version,
    workflow: plan.workflow,
    plan_sha256: plan.plan_sha256,
    candidate_id: "candidate-001",
    candidate_grant_sha256: checked.candidate_grant_sha256,
  });
  const candidatePaths = styleMasterStorePaths(plan.run_dir, {
    plan_sha256: plan.plan_sha256,
    candidate_id: "candidate-001",
  });
  createOrExactMatchStyleMasterRecord(candidatePaths.candidate_attempt, attempt, validateStyleMasterCandidateAttemptRecord, {
    plan: plan.plan,
    grant,
  });
  return { grant, attempt };
}

function writeReviewDecision(plan, decision, { candidateSha256 = null } = {}) {
  const selectedCandidateSha256 = decision === "proceed" ? candidateSha256 || digest(`reviewed ${plan.plan_sha256}`) : null;
  const record = {
    schema: STYLE_MASTER_REVIEW_DECISION_SCHEMA,
    run_version: plan.run_version,
    workflow: plan.workflow,
    plan_sha256: plan.plan_sha256,
    decision,
    candidate_id: decision === "proceed" ? "candidate-001" : null,
    candidate_sha256: selectedCandidateSha256,
    previous_selection_sha256: plan.plan.previous_selection_sha256,
  };
  const checked = validateStyleMasterReviewDecisionRecord(record, { plan: plan.plan });
  if (!checked.ok) throw new Error(checked.message);
  const paths = styleMasterStorePaths(plan.run_dir, { plan_sha256: plan.plan_sha256 });
  createOrExactMatchStyleMasterRecord(paths.review_decision, record, validateStyleMasterReviewDecisionRecord, { plan: plan.plan });
  return { record, checked };
}

function abandonUnknownAttempt(plan) {
  const { paths, grant, checked: grantChecked } = grantFor(plan);
  const claimed = createStyleMasterCandidateAttemptRecord({
    run_version: plan.run_version,
    workflow: plan.workflow,
    plan_sha256: plan.plan_sha256,
    candidate_id: "candidate-001",
    candidate_grant_sha256: grantChecked.candidate_grant_sha256,
  });
  const attempt = {
    ...claimed,
    status: "unknown",
    provider_request_sha256: digest("unknown request"),
  };
  const attemptChecked = validateStyleMasterCandidateAttemptRecord(attempt, { plan: plan.plan, grant });
  if (!attemptChecked.ok) throw new Error(attemptChecked.message);
  const candidatePaths = styleMasterStorePaths(plan.run_dir, {
    plan_sha256: plan.plan_sha256,
    candidate_id: "candidate-001",
  });
  createOrExactMatchStyleMasterRecord(candidatePaths.candidate_attempt, attempt, validateStyleMasterCandidateAttemptRecord, {
    plan: plan.plan,
    grant,
  });
  const head = createStyleMasterHeadRecord(plan.plan);
  const headChecked = validateStyleMasterHeadRecord(head, { plan: plan.plan });
  const reason = normalizeStyleMasterAbandonmentReason("Provider outcome remains unavailable");
  const abandonment = {
    schema: STYLE_MASTER_CANDIDATE_ABANDONMENT_SCHEMA,
    run_version: plan.run_version,
    workflow: plan.workflow,
    scope_head_sha256: headChecked.head_sha256,
    plan_sha256: plan.plan_sha256,
    candidate_grant_sha256: grantChecked.candidate_grant_sha256,
    candidate_id: "candidate-001",
    unknown_attempt_sha256: attemptChecked.attempt_record_sha256,
    provider_request_sha256: attempt.provider_request_sha256,
    reason,
    reason_sha256: styleMasterReasonSha256(reason),
  };
  const abandonmentChecked = validateStyleMasterAbandonmentRecord(abandonment, {
    head,
    plan: plan.plan,
    grant,
    attempt,
  });
  if (!abandonmentChecked.ok) throw new Error(abandonmentChecked.message);
  createOrExactMatchStyleMasterRecord(paths.abandonment, abandonment, validateStyleMasterAbandonmentRecord, {
    head,
    plan: plan.plan,
    grant,
    attempt,
  });
}

function promotePlan(value, plan) {
  const decision = writeReviewDecision(plan, "proceed");
  recordEffectiveStyleMasterSelection(value.deck, {
    runDir: value.runDir,
    selection: {
      schema: STYLE_MASTER_SELECTION_SCHEMA,
      run_version: plan.run_version,
      workflow: plan.workflow,
      plan_sha256: plan.plan_sha256,
      candidate_id: decision.record.candidate_id,
      candidate_sha256: decision.record.candidate_sha256,
      candidate_media_type: "image/png",
      candidate_width: 2000,
      candidate_height: 1125,
      candidate_provenance_sha256: digest(`provenance ${plan.plan_sha256}`),
      style_intent_sha256: plan.plan.style_intent_sha256,
      style_context_sha256: plan.plan.style_context_sha256,
      candidate_generation_profile_sha256: plan.plan.candidate_generation_profile_sha256,
      previous_selection_sha256: plan.plan.previous_selection_sha256,
      review_decision_sha256: decision.checked.review_decision_sha256,
      accepted_at: "2026-08-01T00:00:00.000Z",
    },
  });
}

async function generatedReviewablePlan(value) {
  const plan = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 1 });
  await authorizeStyleMasterCandidates({ scope: planningScope(value), planSha256: plan.plan_sha256 });
  await generateStyleMasterCandidates({
    scope: planningScope(value),
    planSha256: plan.plan_sha256,
    submit: async () => generatedCandidateBytes(),
  });
  return plan;
}

async function staleSelectedSuccessor(value, { candidateCount = 1 } = {}) {
  const predecessor = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 0 });
  await acceptStyleMasterCandidateReview({
    scope: planningScope(value),
    planSha256: predecessor.plan_sha256,
    decision: "proceed",
    candidateId: "local-existing",
  });
  writeFileSync(styleAsset(value.runDir, STYLE_MASTER_PROMPT), "Use a bolder editorial visual system with material depth.\n", "utf8");
  const successor = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount });
  return Object.freeze({ predecessor, successor });
}

async function matchingSelectedSuccessor(value, { candidateCount = 1 } = {}) {
  const predecessor = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 0 });
  await acceptStyleMasterCandidateReview({
    scope: planningScope(value),
    planSha256: predecessor.plan_sha256,
    decision: "proceed",
    candidateId: "local-existing",
  });
  const successor = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount });
  return Object.freeze({ predecessor, successor });
}

function optionalBytes(path) {
  return path && existsSync(path) ? readFileSync(path) : null;
}

function pendingSuccessorRecordSnapshot(value, plan) {
  const scopePaths = styleMasterStorePaths(value.runDir, { workflow: plan.workflow });
  const planPaths = styleMasterStorePaths(value.runDir, { plan_sha256: plan.plan_sha256 });
  return Object.freeze({
    state: readFileSync(statePath(value.deck)),
    head: readFileSync(scopePaths.scope_head),
    plan: readFileSync(planPaths.candidate_plan),
    grant: optionalBytes(planPaths.candidate_grant),
    decision: optionalBytes(planPaths.review_decision),
    attempts: Object.freeze(plan.plan.candidates.map((candidate) => {
      const candidatePaths = styleMasterStorePaths(value.runDir, {
        plan_sha256: plan.plan_sha256,
        candidate_id: candidate.candidate_id,
        candidate_media_type: candidate.candidate_media_type || (candidate.kind === "generated" ? "image/png" : null),
      });
      return Object.freeze({
        candidate_id: candidate.candidate_id,
        attempt: optionalBytes(candidatePaths.candidate_attempt),
        provenance: optionalBytes(candidatePaths.candidate_provenance),
        image: optionalBytes(candidatePaths.candidate_image),
      });
    })),
  });
}

function persistPendingSuccessorAttempt(value, plan, candidateId, status) {
  const planPaths = styleMasterStorePaths(value.runDir, { plan_sha256: plan.plan_sha256 });
  const grant = JSON.parse(readFileSync(planPaths.candidate_grant, "utf8"));
  const grantChecked = validateStyleMasterCandidateGrantRecord(grant, { plan: plan.plan });
  if (!grantChecked.ok) throw new Error(grantChecked.message);
  const claimed = createStyleMasterCandidateAttemptRecord({
    run_version: plan.run_version,
    workflow: plan.workflow,
    plan_sha256: plan.plan_sha256,
    candidate_id: candidateId,
    candidate_grant_sha256: grantChecked.candidate_grant_sha256,
  });
  const providerRequest = status === "claimed" ? null : createStyleMasterProviderRequestRecord({
    plan_sha256: plan.plan_sha256,
    candidate_id: candidateId,
    compiled_prompt_sha256: plan.plan.compiled_prompt_sha256,
    candidate_generation_profile_sha256: plan.plan.candidate_generation_profile_sha256,
  });
  const attempt = {
    ...claimed,
    status,
    provider_request_sha256: providerRequest ? canonicalJsonSha256(providerRequest) : null,
  };
  const candidatePaths = styleMasterStorePaths(value.runDir, {
    plan_sha256: plan.plan_sha256,
    candidate_id: candidateId,
  });
  createOrExactMatchStyleMasterRecord(candidatePaths.candidate_attempt, attempt, validateStyleMasterCandidateAttemptRecord, {
    plan: plan.plan,
    grant,
  });
}

describe("Style Master candidate planning", () => {
  it("projects only the current lifecycle head without mutating or reopening historical plans", async () => {
    const value = fixture();
    try {
      const stateBefore = readFileSync(statePath(value.deck));
      const absent = await inspectStyleMasterCandidates({ scope: planningScope(value) });
      expect(absent).toMatchObject({
        run_version: "v1",
        workflow: "framed",
        head: null,
        plan: null,
        next_action: "plan_style_master_candidates",
      });
      assertNoPageRawMaterialization(value, stateBefore);

      const first = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 1 });
      const firstPaths = styleMasterStorePaths(value.runDir, { plan_sha256: first.plan_sha256 });
      const planBytes = readFileSync(firstPaths.candidate_plan);
      const inspected = await inspectStyleMasterCandidates({
        scope: planningScope(value),
        planSha256: first.plan_sha256,
      });
      expect(inspected).toMatchObject({
        head: {
          plan_sha256: first.plan_sha256,
          plan_generation: 1,
          previous_plan_sha256: null,
        },
        plan_sha256: first.plan_sha256,
        candidate_grant_sha256: null,
        attempts: [],
        next_action: "authorize_style_master_candidates",
      });
      expect(readFileSync(firstPaths.candidate_plan)).toEqual(planBytes);

      failedAttempt({ ...first, run_dir: value.runDir });
      const successor = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 1 });
      await expect(inspectStyleMasterCandidates({
        scope: planningScope(value),
        planSha256: first.plan_sha256,
      })).rejects.toMatchObject({ code: "style_master_plan_not_current" });
      expect(successor.plan_sha256).not.toBe(first.plan_sha256);
      expect(readFileSync(firstPaths.candidate_plan)).toEqual(planBytes);
      assertNoPageRawMaterialization(value, stateBefore);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("publishes an immutable zero-cost local snapshot and exact-replays its nonterminal plan", async () => {
    const value = fixture({ local: true });
    try {
      const stateBefore = readFileSync(statePath(value.deck));
      const scope = planningScope(value);
      const first = await planStyleMasterCandidates({ scope, candidateCount: 0 });
      const paths = styleMasterStorePaths(value.runDir, { plan_sha256: first.plan_sha256, workflow: "framed", candidate_id: "local-existing", candidate_media_type: "image/png" });

      expect(first).toMatchObject({ published: true, replay: false, max_candidate_submissions: 0 });
      expect(first.plan.candidates).toHaveLength(1);
      expect(first.plan.candidates[0]).toMatchObject({ candidate_id: "local-existing", candidate_media_type: "image/png", candidate_width: 1, candidate_height: 1 });
      expect(first.plan.candidate_generation_profile_sha256).toBe(styleMasterGenerationProfileSha256());
      expect(readFileSync(paths.candidate_image)).toEqual(readFileSync(styleAsset(value.runDir, STYLE_MASTER_IMAGE)));
      expect(existsSync(paths.candidate_provenance)).toBe(true);
      expect(CONDITIONS.style_master_accepted(readState(value.deck, { purpose: "observe" }), {
        deckDir: value.deck,
        runDir: value.runDir,
      })).toBe(false);
      assertNoPageRawMaterialization(value, stateBefore);

      const replay = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 0 });
      expect(replay).toMatchObject({ replay: true, plan_sha256: first.plan_sha256 });

      writeFileSync(styleAsset(value.runDir, STYLE_MASTER_IMAGE), localImageBytes(1));
      expect(readFileSync(paths.candidate_image)).not.toEqual(readFileSync(styleAsset(value.runDir, STYLE_MASTER_IMAGE)));
      const successor = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 0 });
      expect(successor.plan_sha256).not.toBe(first.plan_sha256);
      expect(successor.plan).toMatchObject({ plan_generation: 2, previous_plan_sha256: first.plan_sha256 });
      assertNoPageRawMaterialization(value, stateBefore);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("binds a sorted unique stable-ID visual context and recompiles prompt drift into a successor", async () => {
    const value = fixture();
    try {
      const stateBefore = readFileSync(statePath(value.deck));
      const scope = planningScope(value);
      const first = await planStyleMasterCandidates({ scope, candidateCount: 2 });
      const expectedContext = [
        { slide_id: "DeckGo", projection: projection("editorial-systems") },
        { slide_id: "ViewMap", projection: projection("layered-grid") },
      ];
      const expectedPrompt = compileStyleMasterProviderPrompt({
        styleIntent: "Use a calm editorial visual system with material depth.\n",
        styleContext: expectedContext,
      });

      expect(first.plan.style_context_sha256).toBe(canonicalJsonSha256(expectedContext));
      expect(first.plan.compiled_prompt_sha256).toBe(expectedPrompt.compiled_prompt_sha256);
      expect(first.plan.candidates.map((candidate) => candidate.candidate_id)).toEqual(["candidate-001", "candidate-002"]);

      const duplicateScope = planningScope(value, {
        slides: [
          { slide_id: "DeckGo", workflow: "framed", visual_language: { projection: projection("editorial-systems") } },
          { slide_id: "DeckGo", workflow: "framed", visual_language: { projection: projection("layered-grid") } },
        ],
      });
      await expect(planStyleMasterCandidates({ scope: duplicateScope, candidateCount: 2 })).rejects.toMatchObject({
        code: "style_master_context_invalid",
      });

      const changedScope = planningScope(value, {
        slides: [
          { slide_id: "ViewMap", workflow: "framed", visual_language: { projection: projection("editorial-systems") } },
          { slide_id: "DeckGo", workflow: "framed", visual_language: { projection: projection("editorial-systems") } },
        ],
      });
      const successor = await planStyleMasterCandidates({ scope: changedScope, candidateCount: 2 });
      expect(successor).toMatchObject({ published: true, replay: false });
      expect(successor.plan_sha256).not.toBe(first.plan_sha256);
      expect(successor.plan).toMatchObject({ plan_generation: 2, previous_plan_sha256: first.plan_sha256 });
      expect(successor.plan.style_context_sha256).not.toBe(first.plan.style_context_sha256);
      assertNoPageRawMaterialization(value, stateBefore);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("changes Style Master context for a selected relationship without exposing clause text or reference paths", async () => {
    const value = fixture();
    try {
      const relationProjection = {
        id: "layer-stack",
        reading_order: "bottom-to-top",
        provider_clause_sha256: "b".repeat(64),
      };
      const legacy = await planStyleMasterCandidates({
        scope: planningScope(value, {
          slides: [{ slide_id: "DeckGo", workflow: "framed", visual_language: { projection: projection("editorial-systems") } }],
        }),
        candidateCount: 1,
      });
      const selected = await planStyleMasterCandidates({
        scope: planningScope(value, {
          slides: [{ slide_id: "DeckGo", workflow: "framed", visual_language: { projection: projection("editorial-systems", { relationship: relationProjection }) } }],
        }),
        candidateCount: 1,
      });
      const prompt = compileStyleMasterProviderPrompt({
        styleIntent: "Use a calm editorial visual system with material depth.\n",
        styleContext: [{ slide_id: "DeckGo", projection: projection("editorial-systems", { relationship: relationProjection }) }],
      });

      expect(selected.plan.style_context_sha256).not.toBe(legacy.plan.style_context_sha256);
      expect(prompt.bytes.toString("utf8")).not.toContain("nested translucent planes rising from broad base to focused apex");
      expect(prompt.bytes.toString("utf8")).not.toContain("identity_reference");
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("compiles a deterministic bounded provider brief without projection identity digests", () => {
    const digestOnly = "a".repeat(64);
    const context = [
      {
        slide_id: "ViewMap",
        projection: {
          recipe: { id: "editorial-systems", provider_clause_sha256: digestOnly },
          composition: { id: "layered-grid", provider_clause_sha256: digestOnly },
          motifs: [{ id: "signal-lines", provider_clause_sha256: digestOnly }],
          selected_identity_subject_class: "analyst",
        },
      },
      {
        slide_id: "DeckGo",
        projection: {
          recipe: { id: "editorial-systems", provider_clause_sha256: digestOnly },
          composition: { id: "centered-constellation", provider_clause_sha256: digestOnly },
          motifs: [{ id: "signal-lines", provider_clause_sha256: digestOnly }, { id: "quiet-grid", provider_clause_sha256: digestOnly }],
          selected_identity_subject_class: "none",
        },
      },
    ];
    const first = compileStyleMasterProviderPrompt({
      styleIntent: "Use a calm editorial visual system with material depth.\n",
      styleContext: context,
    });
    const second = compileStyleMasterProviderPrompt({
      styleIntent: "Use a calm editorial visual system with material depth.\n",
      styleContext: [...context].reverse(),
    });
    const brief = JSON.parse(first.bytes.toString("utf8"));

    expect(first.bytes.length).toBeLessThanOrEqual(4_000);
    expect(second.bytes).toEqual(first.bytes);
    expect(brief.global_visual_summary).toEqual({
      recipes: ["editorial-systems"],
      compositions: ["centered-constellation", "layered-grid"],
      motifs: ["quiet-grid", "signal-lines"],
      identity_subjects: ["analyst", "none"],
    });
    expect(JSON.stringify(brief)).not.toContain(digestOnly);
    expect(JSON.stringify(brief)).not.toContain("DeckGo");
    expect(JSON.stringify(brief)).not.toContain("ViewMap");
  });

  it("stops an oversized provider brief before plan, grant, or provider work", async () => {
    const value = fixture();
    try {
      const stateBefore = readFileSync(statePath(value.deck));
      writeFileSync(styleAsset(value.runDir, STYLE_MASTER_PROMPT), "x".repeat(4_001), "utf8");

      await expect(planStyleMasterCandidates({
        scope: planningScope(value),
        candidateCount: 1,
      })).rejects.toMatchObject({ code: "style_master_prompt_invalid" });

      expect(existsSync(join(value.deck, "1_upstream_raw_material", "style-master-iterations"))).toBe(false);
      assertNoPageRawMaterialization(value, stateBefore);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("keeps same-input nonterminal plans, then allocates a distinct successor only after direct terminal proof", async () => {
    const value = fixture();
    try {
      const stateBefore = readFileSync(statePath(value.deck));
      const first = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 1 });
      const replay = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 1 });
      expect(replay).toMatchObject({ replay: true, plan_sha256: first.plan_sha256 });

      failedAttempt({ ...first, run_dir: value.runDir });
      const successor = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 1 });
      expect(successor).toMatchObject({ published: true, replay: false });
      expect(successor.plan_sha256).not.toBe(first.plan_sha256);
      expect(successor.plan).toMatchObject({ plan_generation: 2, previous_plan_sha256: first.plan_sha256 });
      assertNoPageRawMaterialization(value, stateBefore);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("keeps claimed and pending-proceed plans on their exact same-plan action", async () => {
    const claimedValue = fixture();
    const pendingValue = fixture();
    try {
      const claimedFirst = await planStyleMasterCandidates({ scope: planningScope(claimedValue), candidateCount: 1 });
      claimedAttempt({ ...claimedFirst, run_dir: claimedValue.runDir });
      const claimedReplay = await planStyleMasterCandidates({ scope: planningScope(claimedValue), candidateCount: 1 });
      expect(claimedReplay).toMatchObject({ replay: true, terminal: false, plan_sha256: claimedFirst.plan_sha256 });

      const pendingFirst = await planStyleMasterCandidates({ scope: planningScope(pendingValue), candidateCount: 1 });
      writeReviewDecision({ ...pendingFirst, run_dir: pendingValue.runDir }, "proceed");
      const pendingReplay = await planStyleMasterCandidates({ scope: planningScope(pendingValue), candidateCount: 1 });
      expect(pendingReplay).toMatchObject({ replay: true, terminal: false, plan_sha256: pendingFirst.plan_sha256 });
    } finally {
      rmSync(claimedValue.root, { recursive: true, force: true });
      rmSync(pendingValue.root, { recursive: true, force: true });
    }
  });

  it("allocates successors for repair, redirect, abandoned unknown, and promoted direct terminal facts", async () => {
    const cases = [
      {
        label: "repair",
        setup: (value, plan) => writeReviewDecision({ ...plan, run_dir: value.runDir }, "repair"),
      },
      {
        label: "redirect",
        setup: (value, plan) => writeReviewDecision({ ...plan, run_dir: value.runDir }, "redirect"),
      },
      {
        label: "abandoned unknown",
        setup: (value, plan) => abandonUnknownAttempt({ ...plan, run_dir: value.runDir }),
      },
      {
        label: "promoted",
        setup: (value, plan) => promotePlan(value, { ...plan, run_dir: value.runDir }),
      },
    ];
    for (const item of cases) {
      const value = fixture();
      try {
        const first = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 1 });
        item.setup(value, first);
        const successor = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 1 });
        expect(successor, item.label).toMatchObject({ published: true, replay: false, terminal: false });
        expect(successor.plan_sha256, item.label).not.toBe(first.plan_sha256);
        expect(successor.plan, item.label).toMatchObject({ plan_generation: 2, previous_plan_sha256: first.plan_sha256 });
        expect(existsSync(value.paths.target_raw_plan), item.label).toBe(false);
      } finally {
        rmSync(value.root, { recursive: true, force: true });
      }
    }
  });

  it("creates one exact current candidate grant without granting page raw or retry work", async () => {
    const value = fixture();
    const localOnly = fixture({ local: true });
    const divergent = fixture();
    try {
      const stateBefore = readFileSync(statePath(value.deck));
      const planned = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 2 });
      const authorized = await authorizeStyleMasterCandidates({
        scope: planningScope(value),
        planSha256: planned.plan_sha256,
      });
      const replay = await authorizeStyleMasterCandidates({
        scope: planningScope(value),
        planSha256: planned.plan_sha256,
      });
      const paths = styleMasterStorePaths(value.runDir, { plan_sha256: planned.plan_sha256 });

      expect(authorized).toMatchObject({
        created: true,
        replay: false,
        plan_sha256: planned.plan_sha256,
        max_candidate_submissions: 2,
        grant: {
          run_version: "v1",
          workflow: "framed",
          plan_sha256: planned.plan_sha256,
          generated_candidate_ids: ["candidate-001", "candidate-002"],
          max_submissions: 2,
          candidate_generation_profile_sha256: styleMasterGenerationProfileSha256(),
        },
      });
      expect(replay).toMatchObject({ created: false, replay: true, candidate_grant_sha256: authorized.candidate_grant_sha256 });
      expect(readFileSync(paths.candidate_grant)).toEqual(styleMasterCanonicalBytes(authorized.grant));
      await expect(authorizeStyleMasterCandidates({
        scope: planningScope(value),
        planSha256: digest("not current"),
      })).rejects.toMatchObject({ code: "style_master_plan_not_current" });
      assertNoPageRawMaterialization(value, stateBefore);

      failedAttempt({ ...planned, run_dir: value.runDir });
      await expect(authorizeStyleMasterCandidates({
        scope: planningScope(value),
        planSha256: planned.plan_sha256,
      })).rejects.toMatchObject({ code: "style_master_plan_not_authorizable" });
      expect(readFileSync(paths.candidate_grant)).toEqual(styleMasterCanonicalBytes(authorized.grant));

      const zeroPlan = await planStyleMasterCandidates({ scope: planningScope(localOnly), candidateCount: 0 });
      const zeroPaths = styleMasterStorePaths(localOnly.runDir, { plan_sha256: zeroPlan.plan_sha256 });
      await expect(authorizeStyleMasterCandidates({
        scope: planningScope(localOnly),
        planSha256: zeroPlan.plan_sha256,
      })).rejects.toMatchObject({ code: "style_master_grant_inapplicable" });
      expect(existsSync(zeroPaths.candidate_grant)).toBe(false);

      const divergentPlan = await planStyleMasterCandidates({ scope: planningScope(divergent), candidateCount: 1 });
      const divergentPaths = styleMasterStorePaths(divergent.runDir, { plan_sha256: divergentPlan.plan_sha256 });
      const malformedGrant = {
        schema: "page-image-style-master-candidate-grant-v1",
        run_version: "v1",
        workflow: "framed",
        plan_sha256: divergentPlan.plan_sha256,
        generated_candidate_ids: ["candidate-002"],
        max_submissions: 1,
        candidate_generation_profile_sha256: styleMasterGenerationProfileSha256(),
      };
      writeFileSync(divergentPaths.candidate_grant, styleMasterCanonicalBytes(malformedGrant));
      const divergentBefore = readFileSync(divergentPaths.candidate_grant);
      await expect(authorizeStyleMasterCandidates({
        scope: planningScope(divergent),
        planSha256: divergentPlan.plan_sha256,
      })).rejects.toMatchObject({ code: "style_master_grant_invalid" });
      expect(readFileSync(divergentPaths.candidate_grant)).toEqual(divergentBefore);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
      rmSync(localOnly.root, { recursive: true, force: true });
      rmSync(divergent.root, { recursive: true, force: true });
    }
  });

  it("serializes generated candidates through claimed, submitted, immutable bytes, provenance, and succeeded", async () => {
    const value = fixture();
    try {
      const stateBefore = readFileSync(statePath(value.deck));
      const planned = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 2 });
      const authorized = await authorizeStyleMasterCandidates({ scope: planningScope(value), planSha256: planned.plan_sha256 });
      const calls = [];
      const result = await generateStyleMasterCandidates({
        scope: planningScope(value),
        planSha256: planned.plan_sha256,
        initialize: async ({ candidate_id }) => {
          const claimed = readCandidateAttempt(value.runDir, planned.plan_sha256, candidate_id);
          expect(claimed.record).toMatchObject({ status: "claimed", candidate_grant_sha256: authorized.candidate_grant_sha256 });
          return Object.freeze({ candidate_id });
        },
        submit: async (request) => {
          calls.push(request);
          const submitted = readCandidateAttempt(value.runDir, planned.plan_sha256, request.candidate_id);
          expect(request.transport).toEqual({ candidate_id: request.candidate_id });
          expect(request.provider_request_sha256).toBe(canonicalJsonSha256(request.provider_request));
          expect(digest(request.compiled_prompt_bytes)).toBe(planned.plan.compiled_prompt_sha256);
          expect(Object.keys(request.provider_request).sort()).toEqual([
            "schema", "plan_sha256", "candidate_id", "compiled_prompt_sha256", "candidate_generation_profile_sha256",
          ].sort());
          expect(validateStyleMasterProviderRequestRecord(request.provider_request, {
            plan: planned.plan,
            candidateId: request.candidate_id,
          })).toMatchObject({ ok: true, provider_request_sha256: request.provider_request_sha256 });
          expect(submitted.record).toMatchObject({
            status: "submitted",
            provider_request_sha256: request.provider_request_sha256,
            candidate_sha256: null,
            candidate_provenance_sha256: null,
          });
          return Object.freeze({ outcome: "succeeded", bytes: generatedCandidateBytes() });
        },
      });

      expect(calls.map((call) => call.candidate_id)).toEqual(["candidate-001", "candidate-002"]);
      expect(result).toMatchObject({
        plan_sha256: planned.plan_sha256,
        candidate_grant_sha256: authorized.candidate_grant_sha256,
        terminal: false,
        next_action: "review_style_master_candidates",
        progress: { max_submissions: 2, consumed_submissions: 2, remaining_submissions: 0 },
      });
      const review = await prepareStyleMasterCandidateReview({
        scope: planningScope(value),
        planSha256: planned.plan_sha256,
      });
      expect(review).toMatchObject({
        plan_sha256: planned.plan_sha256,
        candidate_grant_sha256: authorized.candidate_grant_sha256,
        next_action: "accept_style_master_candidates",
      });
      expect(review.candidates.map((candidate) => candidate.candidate_id)).toEqual(["candidate-001", "candidate-002"]);
      expect(review.candidates.every((candidate) => candidate.bytes.equals(generatedCandidateBytes()))).toBe(true);
      for (const candidateId of ["candidate-001", "candidate-002"]) {
        const attempt = readCandidateAttempt(value.runDir, planned.plan_sha256, candidateId);
        const paths = styleMasterStorePaths(value.runDir, {
          plan_sha256: planned.plan_sha256,
          candidate_id: candidateId,
          candidate_media_type: "image/png",
        });
        const provenance = JSON.parse(readFileSync(paths.candidate_provenance, "utf8"));
        expect(attempt.record).toMatchObject({
          status: "succeeded",
          candidate_sha256: digest(generatedCandidateBytes()),
          provider_request_sha256: canonicalJsonSha256(calls.find((call) => call.candidate_id === candidateId).provider_request),
        });
        expect(readFileSync(paths.candidate_image)).toEqual(generatedCandidateBytes());
        expect(Object.keys(provenance).sort()).toEqual([
          "schema", "kind", "plan_sha256", "candidate_id", "compiled_prompt_sha256",
          "candidate_generation_profile_sha256", "provider_request_sha256", "candidate_sha256",
          "candidate_media_type", "candidate_width", "candidate_height",
        ].sort());
        expect(provenance.schema).toBe(STYLE_MASTER_GENERATED_PROVENANCE_SCHEMA);
        expect(validateStyleMasterGeneratedProvenance(provenance, {
          plan: planned.plan,
          attempt: attempt.record,
        })).toMatchObject({ ok: true, candidate_provenance_sha256: attempt.record.candidate_provenance_sha256 });
      }
      assertNoPageRawMaterialization(value, stateBefore);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("terminalizes a classified provider failure without adding Style Master lifecycle state", async () => {
    const value = fixture();
    try {
      const stateBefore = readFileSync(statePath(value.deck));
      const planned = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 2 });
      const authorized = await authorizeStyleMasterCandidates({ scope: planningScope(value), planSha256: planned.plan_sha256 });
      const calls = [];
      const result = await generateStyleMasterCandidates({
        scope: planningScope(value),
        planSha256: planned.plan_sha256,
        submit: async ({ candidate_id }) => {
          calls.push(candidate_id);
          const error = new Error("PROVIDER_RESPONSE_BODY_SENTINEL");
          error.style_master_known_failure = true;
          error.style_master_known_failure_facts = {
            response: {
              classification: "invalid_json",
              response_shape: "html_like",
              provider_response: "PROVIDER_RESPONSE_BODY_SENTINEL",
            },
          };
          throw error;
        },
      });
      const first = readCandidateAttempt(value.runDir, planned.plan_sha256, "candidate-001");
      const secondPaths = styleMasterStorePaths(value.runDir, {
        plan_sha256: planned.plan_sha256,
        candidate_id: "candidate-002",
      });

      expect(calls).toEqual(["candidate-001"]);
      expect(first.record).toMatchObject({
        status: "failed",
        candidate_grant_sha256: authorized.candidate_grant_sha256,
      });
      expect(first.record).not.toHaveProperty("response_shape");
      expect(JSON.stringify(first.record)).not.toContain("PROVIDER_RESPONSE_BODY_SENTINEL");
      expect(existsSync(secondPaths.candidate_attempt)).toBe(false);
      expect(result).toMatchObject({
        terminal: true,
        terminal_reason: "known_failure",
        current_candidate_id: "candidate-001",
        next_action: "plan_style_master_successor",
        progress: { max_submissions: 2, consumed_submissions: 1, remaining_submissions: 1 },
      });
      expect(result).not.toHaveProperty("response_shape");
      const replaySubmit = vi.fn();
      const replay = await generateStyleMasterCandidates({
        scope: planningScope(value),
        planSha256: planned.plan_sha256,
        submit: replaySubmit,
      });
      expect(replay).toEqual(result);
      expect(replaySubmit).not.toHaveBeenCalled();
      assertNoPageRawMaterialization(value, stateBefore);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("accepts a valid native PNG and terminalizes received invalid media as a known failure", async () => {
    const native = fixture();
    const invalid = fixture();
    try {
      const nativePlan = await planStyleMasterCandidates({ scope: planningScope(native), candidateCount: 1 });
      await authorizeStyleMasterCandidates({ scope: planningScope(native), planSha256: nativePlan.plan_sha256 });
      const nativeBytes = nativeGeneratedCandidateBytes(17, 11);
      const nativeResult = await generateStyleMasterCandidates({
        scope: planningScope(native),
        planSha256: nativePlan.plan_sha256,
        submit: async () => nativeBytes,
      });
      const nativeAttempt = readCandidateAttempt(native.runDir, nativePlan.plan_sha256, "candidate-001");
      const nativePaths = styleMasterStorePaths(native.runDir, {
        plan_sha256: nativePlan.plan_sha256,
        candidate_id: "candidate-001",
        candidate_media_type: "image/png",
      });
      const nativeProvenance = JSON.parse(readFileSync(nativePaths.candidate_provenance, "utf8"));

      expect(nativeResult).toMatchObject({ next_action: "review_style_master_candidates" });
      expect(nativeAttempt.record).toMatchObject({ status: "succeeded" });
      expect(readFileSync(nativePaths.candidate_image)).toEqual(nativeBytes);
      expect(nativeProvenance).toMatchObject({ candidate_width: 17, candidate_height: 11 });
      await expect(prepareStyleMasterCandidateReview({
        scope: planningScope(native),
        planSha256: nativePlan.plan_sha256,
      })).resolves.toMatchObject({ candidates: [{ candidate_id: "candidate-001", candidate_width: 17, candidate_height: 11 }] });

      const invalidPlan = await planStyleMasterCandidates({ scope: planningScope(invalid), candidateCount: 1 });
      await authorizeStyleMasterCandidates({ scope: planningScope(invalid), planSha256: invalidPlan.plan_sha256 });
      const invalidResult = await generateStyleMasterCandidates({
        scope: planningScope(invalid),
        planSha256: invalidPlan.plan_sha256,
        submit: async () => Buffer.from("not a PNG"),
      });
      const invalidAttempt = readCandidateAttempt(invalid.runDir, invalidPlan.plan_sha256, "candidate-001");

      expect(invalidResult).toMatchObject({ terminal: true, terminal_reason: "known_failure", next_action: "plan_style_master_successor" });
      expect(invalidAttempt.record).toMatchObject({ status: "failed", candidate_sha256: null, candidate_provenance_sha256: null });
    } finally {
      rmSync(native.root, { recursive: true, force: true });
      rmSync(invalid.root, { recursive: true, force: true });
    }
  });

  it("keeps a generic post-submit interruption unresolved and resumes a durable pre-submit claim", async () => {
    const interrupted = fixture();
    const claimed = fixture();
    try {
      const interruptedPlan = await planStyleMasterCandidates({ scope: planningScope(interrupted), candidateCount: 1 });
      await authorizeStyleMasterCandidates({ scope: planningScope(interrupted), planSha256: interruptedPlan.plan_sha256 });
      let submittedRequestSha256 = null;
      await expect(generateStyleMasterCandidates({
        scope: planningScope(interrupted),
        planSha256: interruptedPlan.plan_sha256,
        submit: async ({ provider_request_sha256 }) => {
          submittedRequestSha256 = provider_request_sha256;
          throw new Error("network interruption");
        },
      })).rejects.toMatchObject({ code: "style_master_attempt_unknown" });
      expect(readCandidateAttempt(interrupted.runDir, interruptedPlan.plan_sha256, "candidate-001").record).toMatchObject({
        status: "submitted",
        provider_request_sha256: submittedRequestSha256,
        candidate_sha256: null,
        candidate_provenance_sha256: null,
      });
      let laterSubmitCalls = 0;
      await expect(generateStyleMasterCandidates({
        scope: planningScope(interrupted),
        planSha256: interruptedPlan.plan_sha256,
        submit: async () => { laterSubmitCalls += 1; return generatedCandidateBytes(); },
      })).rejects.toMatchObject({ code: "style_master_attempt_unknown" });
      expect(laterSubmitCalls).toBe(0);

      const claimedPlan = await planStyleMasterCandidates({ scope: planningScope(claimed), candidateCount: 1 });
      await authorizeStyleMasterCandidates({ scope: planningScope(claimed), planSha256: claimedPlan.plan_sha256 });
      let observedClaim = null;
      await expect(generateStyleMasterCandidates({
        scope: planningScope(claimed),
        planSha256: claimedPlan.plan_sha256,
        initialize: async ({ candidate_id }) => {
          observedClaim = readCandidateAttempt(claimed.runDir, claimedPlan.plan_sha256, candidate_id).record;
          throw new Error("credentials unavailable");
        },
        submit: async () => generatedCandidateBytes(),
      })).rejects.toThrow("credentials unavailable");
      expect(observedClaim).toMatchObject({ status: "claimed" });
      expect(readCandidateAttempt(claimed.runDir, claimedPlan.plan_sha256, "candidate-001").record).toMatchObject({ status: "claimed" });

      const resumed = await generateStyleMasterCandidates({
        scope: planningScope(claimed),
        planSha256: claimedPlan.plan_sha256,
        initialize: async () => Object.freeze({ initialized: true }),
        submit: async ({ transport }) => {
          expect(transport).toEqual({ initialized: true });
          return generatedCandidateBytes();
        },
      });
      expect(resumed).toMatchObject({ next_action: "review_style_master_candidates", progress: { consumed_submissions: 1 } });
      expect(readCandidateAttempt(claimed.runDir, claimedPlan.plan_sha256, "candidate-001").record).toMatchObject({ status: "succeeded" });
    } finally {
      rmSync(interrupted.root, { recursive: true, force: true });
      rmSync(claimed.root, { recursive: true, force: true });
    }
  });

  it("closes one current unknown plan with a normalized immutable abandonment and exact historical replay", async () => {
    const value = fixture();
    const invalidReason = fixture();
    try {
      const stateBefore = readFileSync(statePath(value.deck));
      const planned = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 1 });
      submittedAttempt({ ...planned, run_dir: value.runDir });
      const result = await abandonStyleMasterCandidates({
        scope: planningScope(value),
        planSha256: planned.plan_sha256,
        reason: "  No\t authoritative\n provider outcome  ",
      });
      const attempt = readCandidateAttempt(value.runDir, planned.plan_sha256, "candidate-001");
      const paths = styleMasterStorePaths(value.runDir, { plan_sha256: planned.plan_sha256 });
      const abandonment = JSON.parse(readFileSync(paths.abandonment, "utf8"));
      const grant = createStyleMasterCandidateGrantRecord(planned.plan);
      const head = createStyleMasterHeadRecord(planned.plan);

      expect(attempt.record).toMatchObject({
        status: "unknown",
        reason_sha256: styleMasterReasonSha256("No authoritative provider outcome"),
      });
      expect(abandonment).toMatchObject({
        reason: "No authoritative provider outcome",
        reason_sha256: attempt.record.reason_sha256,
        unknown_attempt_sha256: canonicalJsonSha256(attempt.record),
      });
      expect(validateStyleMasterAbandonmentRecord(abandonment, {
        head,
        plan: planned.plan,
        grant,
        attempt: attempt.record,
      })).toMatchObject({ ok: true, abandonment_sha256: result.abandonment_sha256 });
      expect(result).toMatchObject({
        replay: false,
        plan_sha256: planned.plan_sha256,
        candidate_id: "candidate-001",
        next_action: "plan_style_master_successor",
        progress: { consumed_submissions: 1, remaining_submissions: 0 },
      });

      const successor = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 1 });
      const successorPaths = styleMasterStorePaths(value.runDir, { plan_sha256: successor.plan_sha256 });
      expect(successor.plan_sha256).not.toBe(planned.plan_sha256);
      expect(existsSync(successorPaths.candidate_grant)).toBe(false);
      const successorGrant = await authorizeStyleMasterCandidates({ scope: planningScope(value), planSha256: successor.plan_sha256 });
      expect(successorGrant.candidate_grant_sha256).not.toBe(result.candidate_grant_sha256);
      const replay = await abandonStyleMasterCandidates({
        scope: planningScope(value),
        planSha256: planned.plan_sha256,
        reason: "No authoritative provider outcome",
      });
      expect(replay).toMatchObject({ replay: true, abandonment_sha256: result.abandonment_sha256 });
      await expect(abandonStyleMasterCandidates({
        scope: planningScope(value),
        planSha256: planned.plan_sha256,
        reason: "A materially different reason",
      })).rejects.toMatchObject({ code: "style_master_abandonment_conflict" });
      assertNoPageRawMaterialization(value, stateBefore);

      const invalidPlan = await planStyleMasterCandidates({ scope: planningScope(invalidReason), candidateCount: 1 });
      submittedAttempt({ ...invalidPlan, run_dir: invalidReason.runDir });
      const invalidAttempt = readCandidateAttempt(invalidReason.runDir, invalidPlan.plan_sha256, "candidate-001");
      const beforeInvalid = readFileSync(invalidAttempt.paths.candidate_attempt);
      await expect(abandonStyleMasterCandidates({
        scope: planningScope(invalidReason),
        planSha256: invalidPlan.plan_sha256,
        reason: "\u0000",
      })).rejects.toMatchObject({ code: "style_master_reason_invalid" });
      expect(readFileSync(invalidAttempt.paths.candidate_attempt)).toEqual(beforeInvalid);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
      rmSync(invalidReason.root, { recursive: true, force: true });
    }
  });

  it("recovers a same-reason unknown CAS crash and writes an abandonment for a transport-owned unknown", async () => {
    const crashed = fixture();
    const transportOwned = fixture();
    try {
      const crashedPlan = await planStyleMasterCandidates({ scope: planningScope(crashed), candidateCount: 1 });
      submittedAttempt({ ...crashedPlan, run_dir: crashed.runDir });
      const crashedAttempt = readCandidateAttempt(crashed.runDir, crashedPlan.plan_sha256, "candidate-001");
      const crashedGrant = createStyleMasterCandidateGrantRecord(crashedPlan.plan);
      const crashReason = normalizeStyleMasterAbandonmentReason("Provider outcome cannot be recovered");
      writeStyleMasterCandidateAttemptCas(crashed.runDir, {
        plan: crashedPlan.plan,
        grant: crashedGrant,
        candidate_id: "candidate-001",
        expected_bytes: readFileSync(crashedAttempt.paths.candidate_attempt),
        attempt: {
          ...crashedAttempt.record,
          status: "unknown",
          reason_sha256: styleMasterReasonSha256(crashReason),
        },
      });
      const crashPaths = styleMasterStorePaths(crashed.runDir, { plan_sha256: crashedPlan.plan_sha256 });
      expect(existsSync(crashPaths.abandonment)).toBe(false);
      const recovered = await abandonStyleMasterCandidates({
        scope: planningScope(crashed),
        planSha256: crashedPlan.plan_sha256,
        reason: crashReason,
      });
      expect(recovered).toMatchObject({ replay: false, abandonment: { reason: crashReason } });
      expect(readCandidateAttempt(crashed.runDir, crashedPlan.plan_sha256, "candidate-001").record).toMatchObject({
        status: "unknown",
        reason_sha256: styleMasterReasonSha256(crashReason),
      });

      const transportPlan = await planStyleMasterCandidates({ scope: planningScope(transportOwned), candidateCount: 1 });
      submittedAttempt({ ...transportPlan, run_dir: transportOwned.runDir });
      const transportAttempt = readCandidateAttempt(transportOwned.runDir, transportPlan.plan_sha256, "candidate-001");
      const transportGrant = createStyleMasterCandidateGrantRecord(transportPlan.plan);
      writeStyleMasterCandidateAttemptCas(transportOwned.runDir, {
        plan: transportPlan.plan,
        grant: transportGrant,
        candidate_id: "candidate-001",
        expected_bytes: readFileSync(transportAttempt.paths.candidate_attempt),
        attempt: { ...transportAttempt.record, status: "unknown" },
      });
      const selectedReason = "Provider explicitly reported an unknown outcome";
      const transportAbandonment = await abandonStyleMasterCandidates({
        scope: planningScope(transportOwned),
        planSha256: transportPlan.plan_sha256,
        reason: selectedReason,
      });
      expect(transportAbandonment).toMatchObject({ abandonment: { reason: selectedReason } });
      expect(readCandidateAttempt(transportOwned.runDir, transportPlan.plan_sha256, "candidate-001").record).toMatchObject({
        status: "unknown",
        reason_sha256: null,
      });
    } finally {
      rmSync(crashed.root, { recursive: true, force: true });
      rmSync(transportOwned.root, { recursive: true, force: true });
    }
  });

  it("requires a current nonzero grant before claiming, initializing, or submitting generated candidates", async () => {
    const generated = fixture();
    const localOnly = fixture({ local: true });
    try {
      const generatedState = readFileSync(statePath(generated.deck));
      const planned = await planStyleMasterCandidates({ scope: planningScope(generated), candidateCount: 1 });
      let initialized = 0;
      let submitted = 0;
      await expect(generateStyleMasterCandidates({
        scope: planningScope(generated),
        planSha256: planned.plan_sha256,
        initialize: async () => { initialized += 1; return Object.freeze({}); },
        submit: async () => { submitted += 1; return generatedCandidateBytes(); },
      })).rejects.toMatchObject({ code: "style_master_grant_missing" });
      const candidatePaths = styleMasterStorePaths(generated.runDir, {
        plan_sha256: planned.plan_sha256,
        candidate_id: "candidate-001",
      });
      expect(initialized).toBe(0);
      expect(submitted).toBe(0);
      expect(existsSync(candidatePaths.candidate_attempt)).toBe(false);
      assertNoPageRawMaterialization(generated, generatedState);

      const localState = readFileSync(statePath(localOnly.deck));
      const localPlan = await planStyleMasterCandidates({ scope: planningScope(localOnly), candidateCount: 0 });
      await expect(generateStyleMasterCandidates({
        scope: planningScope(localOnly),
        planSha256: localPlan.plan_sha256,
        submit: async () => generatedCandidateBytes(),
      })).rejects.toMatchObject({ code: "style_master_generate_inapplicable" });
      const localPaths = styleMasterStorePaths(localOnly.runDir, { plan_sha256: localPlan.plan_sha256 });
      expect(existsSync(localPaths.candidate_grant)).toBe(false);
      assertNoPageRawMaterialization(localOnly, localState);
    } finally {
      rmSync(generated.root, { recursive: true, force: true });
      rmSync(localOnly.root, { recursive: true, force: true });
    }
  });

  it("prepares only current complete candidate chains and returns exact local candidate bytes without a cost grant", async () => {
    const local = fixture({ local: true });
    const incomplete = fixture();
    const failed = fixture();
    const stale = fixture({ local: true });
    try {
      const localState = readFileSync(statePath(local.deck));
      const localPlan = await planStyleMasterCandidates({ scope: planningScope(local), candidateCount: 0 });
      const localReview = await prepareStyleMasterCandidateReview({ scope: planningScope(local), planSha256: localPlan.plan_sha256 });
      expect(localReview).toMatchObject({ candidate_grant_sha256: null, candidates: [{ candidate_id: "local-existing", kind: "local-existing" }] });
      expect(localReview.candidates[0].bytes).toEqual(localImageBytes());
      assertNoPageRawMaterialization(local, localState);

      const incompletePlan = await planStyleMasterCandidates({ scope: planningScope(incomplete), candidateCount: 1 });
      await authorizeStyleMasterCandidates({ scope: planningScope(incomplete), planSha256: incompletePlan.plan_sha256 });
      await expect(prepareStyleMasterCandidateReview({
        scope: planningScope(incomplete),
        planSha256: incompletePlan.plan_sha256,
      })).rejects.toMatchObject({ code: "style_master_review_ineligible" });

      const failedPlan = await planStyleMasterCandidates({ scope: planningScope(failed), candidateCount: 1 });
      await authorizeStyleMasterCandidates({ scope: planningScope(failed), planSha256: failedPlan.plan_sha256 });
      await generateStyleMasterCandidates({
        scope: planningScope(failed),
        planSha256: failedPlan.plan_sha256,
        submit: async () => Object.freeze({ outcome: "failed" }),
      });
      await expect(prepareStyleMasterCandidateReview({
        scope: planningScope(failed),
        planSha256: failedPlan.plan_sha256,
      })).rejects.toMatchObject({ code: "style_master_review_ineligible" });

      const stalePlan = await planStyleMasterCandidates({ scope: planningScope(stale), candidateCount: 0 });
      writeFileSync(styleAsset(stale.runDir, STYLE_MASTER_IMAGE), localImageBytes(1));
      await planStyleMasterCandidates({ scope: planningScope(stale), candidateCount: 0 });
      await expect(prepareStyleMasterCandidateReview({
        scope: planningScope(stale),
        planSha256: stalePlan.plan_sha256,
      })).rejects.toMatchObject({ code: "style_master_plan_not_current" });
    } finally {
      rmSync(local.root, { recursive: true, force: true });
      rmSync(incomplete.root, { recursive: true, force: true });
      rmSync(failed.root, { recursive: true, force: true });
      rmSync(stale.root, { recursive: true, force: true });
    }
  });

  it("keeps a claimed attempt unconsumed when canonical prompt inputs drift before submitted", async () => {
    const value = fixture();
    try {
      const stateBefore = readFileSync(statePath(value.deck));
      const planned = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 1 });
      await authorizeStyleMasterCandidates({ scope: planningScope(value), planSha256: planned.plan_sha256 });
      let submitCalls = 0;
      await expect(generateStyleMasterCandidates({
        scope: planningScope(value),
        planSha256: planned.plan_sha256,
        initialize: async () => {
          writeFileSync(styleAsset(value.runDir, STYLE_MASTER_PROMPT), "A deliberately changed visual direction.\n", "utf8");
          return Object.freeze({ initialized: true });
        },
        submit: async () => { submitCalls += 1; return generatedCandidateBytes(); },
      })).rejects.toMatchObject({ code: "style_master_plan_stale" });
      expect(submitCalls).toBe(0);
      expect(readCandidateAttempt(value.runDir, planned.plan_sha256, "candidate-001").record).toMatchObject({
        status: "claimed",
        provider_request_sha256: null,
      });

      const successor = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 1 });
      const successorPaths = styleMasterStorePaths(value.runDir, { plan_sha256: successor.plan_sha256 });
      expect(successor.plan_sha256).not.toBe(planned.plan_sha256);
      expect(existsSync(successorPaths.candidate_grant)).toBe(false);
      assertNoPageRawMaterialization(value, stateBefore);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("keeps preplaced generated artifacts non-authoritative and leaves them unreferenced when abandonment wins terminal CAS", async () => {
    const preplaced = fixture();
    const racing = fixture();
    try {
      const preplacedState = readFileSync(statePath(preplaced.deck));
      const preplacedPlan = await planStyleMasterCandidates({ scope: planningScope(preplaced), candidateCount: 1 });
      await authorizeStyleMasterCandidates({ scope: planningScope(preplaced), planSha256: preplacedPlan.plan_sha256 });
      const preplacedRequest = createStyleMasterProviderRequestRecord({
        plan_sha256: preplacedPlan.plan_sha256,
        candidate_id: "candidate-001",
        compiled_prompt_sha256: preplacedPlan.plan.compiled_prompt_sha256,
        candidate_generation_profile_sha256: preplacedPlan.plan.candidate_generation_profile_sha256,
      });
      const preplacedBytes = generatedCandidateBytes();
      const preplacedProvenance = {
        schema: STYLE_MASTER_GENERATED_PROVENANCE_SCHEMA,
        kind: "generated",
        plan_sha256: preplacedPlan.plan_sha256,
        candidate_id: "candidate-001",
        compiled_prompt_sha256: preplacedPlan.plan.compiled_prompt_sha256,
        candidate_generation_profile_sha256: preplacedPlan.plan.candidate_generation_profile_sha256,
        provider_request_sha256: canonicalJsonSha256(preplacedRequest),
        candidate_sha256: digest(preplacedBytes),
        candidate_media_type: "image/png",
        candidate_width: 2000,
        candidate_height: 1125,
      };
      const preplacedPaths = styleMasterStorePaths(preplaced.runDir, {
        plan_sha256: preplacedPlan.plan_sha256,
        candidate_id: "candidate-001",
        candidate_media_type: "image/png",
      });
      placeStyleMasterCandidateImage(preplaced.runDir, {
        plan_sha256: preplacedPlan.plan_sha256,
        candidate_id: "candidate-001",
        candidate_media_type: "image/png",
        bytes: preplacedBytes,
      });
      createOrExactMatchStyleMasterRecord(
        preplacedPaths.candidate_provenance,
        preplacedProvenance,
        validateStyleMasterGeneratedProvenance,
        { plan: preplacedPlan.plan },
      );
      const replay = await planStyleMasterCandidates({ scope: planningScope(preplaced), candidateCount: 1 });
      expect(replay).toMatchObject({ plan_sha256: preplacedPlan.plan_sha256, terminal: false });
      expect(existsSync(styleMasterStorePaths(preplaced.runDir, {
        plan_sha256: preplacedPlan.plan_sha256,
        candidate_id: "candidate-001",
      }).candidate_attempt)).toBe(false);
      await expect(prepareStyleMasterCandidateReview({
        scope: planningScope(preplaced),
        planSha256: preplacedPlan.plan_sha256,
      })).rejects.toMatchObject({ code: "style_master_review_ineligible" });
      await expect(generateStyleMasterCandidates({
        scope: planningScope(preplaced),
        planSha256: preplacedPlan.plan_sha256,
        initialize: async () => { throw new Error("stop before submit"); },
        submit: async () => generatedCandidateBytes(),
      })).rejects.toThrow("stop before submit");
      expect(readCandidateAttempt(preplaced.runDir, preplacedPlan.plan_sha256, "candidate-001").record).toMatchObject({ status: "claimed" });
      assertNoPageRawMaterialization(preplaced, preplacedState);

      const racingState = readFileSync(statePath(racing.deck));
      const racingPlan = await planStyleMasterCandidates({ scope: planningScope(racing), candidateCount: 1 });
      await authorizeStyleMasterCandidates({ scope: planningScope(racing), planSha256: racingPlan.plan_sha256 });
      let abandonment = null;
      await expect(generateStyleMasterCandidates({
        scope: planningScope(racing),
        planSha256: racingPlan.plan_sha256,
        submit: async () => {
          abandonment = await abandonStyleMasterCandidates({
            scope: planningScope(racing),
            planSha256: racingPlan.plan_sha256,
            reason: "Human preserves the indeterminate provider outcome",
          });
          return generatedCandidateBytes();
        },
      })).rejects.toMatchObject({ code: "style_master_attempt_terminal_conflict" });
      const racingAttempt = readCandidateAttempt(racing.runDir, racingPlan.plan_sha256, "candidate-001");
      const racingPaths = styleMasterStorePaths(racing.runDir, {
        plan_sha256: racingPlan.plan_sha256,
        candidate_id: "candidate-001",
        candidate_media_type: "image/png",
      });
      expect(abandonment).toMatchObject({ next_action: "plan_style_master_successor" });
      expect(racingAttempt.record).toMatchObject({ status: "unknown", candidate_sha256: null, candidate_provenance_sha256: null });
      expect(existsSync(racingPaths.candidate_image)).toBe(true);
      expect(existsSync(racingPaths.candidate_provenance)).toBe(true);
      const successor = await planStyleMasterCandidates({ scope: planningScope(racing), candidateCount: 1 });
      expect(successor.plan_sha256).not.toBe(racingPlan.plan_sha256);
      assertNoPageRawMaterialization(racing, racingState);
    } finally {
      rmSync(preplaced.root, { recursive: true, force: true });
      rmSync(racing.root, { recursive: true, force: true });
    }
  });

  it("rechecks the local snapshot before head CAS and leaves unreferenced plan history non-authoritative", async () => {
    const value = fixture({ local: true });
    try {
      const stateBefore = readFileSync(statePath(value.deck));
      let refreshes = 0;
      const result = await planStyleMasterCandidates({
        scope: planningScope(value),
        candidateCount: 0,
        refreshScope: async () => {
          refreshes += 1;
          if (refreshes === 2) writeFileSync(styleAsset(value.runDir, STYLE_MASTER_IMAGE), localImageBytes(1));
          return planningScope(value);
        },
      });
      const currentPaths = styleMasterStorePaths(value.runDir, {
        workflow: "framed",
        plan_sha256: result.plan_sha256,
        candidate_id: "local-existing",
        candidate_media_type: "image/png",
      });
      const history = styleMasterStorePaths(value.runDir);
      const scopePaths = styleMasterStorePaths(value.runDir, { workflow: "framed" });

      expect(refreshes).toBeGreaterThanOrEqual(3);
      expect(readFileSync(currentPaths.candidate_image)).toEqual(localImageBytes(1));
      expect(readFileSync(scopePaths.scope_head, "utf8")).toContain(result.plan_sha256);
      expect(existsSync(history.plans_root)).toBe(true);
      assertNoPageRawMaterialization(value, stateBefore);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("ignores partial staging and complete unreferenced plans until a scope head names a plan", async () => {
    const value = fixture();
    try {
      const stateBefore = readFileSync(statePath(value.deck));
      const orphan = detachedPlan();
      const orphanStaging = createStyleMasterStagingDirectory(value.runDir, "orphan-plan");
      writeFileSync(join(orphanStaging, "candidate-plan.json"), styleMasterCanonicalBytes(orphan));
      const orphanPublished = publishStyleMasterStagedPlan(value.runDir, {
        staging_path: orphanStaging,
        plan_sha256: orphan.plan_sha256,
        validate_bundle: (root) => {
          const bytes = readFileSync(join(root, "candidate-plan.json"));
          expect(bytes).toEqual(styleMasterCanonicalBytes(orphan));
        },
      });
      const concurrentStaging = createStyleMasterStagingDirectory(value.runDir, "orphan-replay");
      writeFileSync(join(concurrentStaging, "candidate-plan.json"), styleMasterCanonicalBytes(orphan));
      const concurrentReplay = publishStyleMasterStagedPlan(value.runDir, {
        staging_path: concurrentStaging,
        plan_sha256: orphan.plan_sha256,
        validate_bundle: (root) => {
          const bytes = readFileSync(join(root, "candidate-plan.json"));
          expect(bytes).toEqual(styleMasterCanonicalBytes(orphan));
        },
      });
      const partialStaging = createStyleMasterStagingDirectory(value.runDir, "crashed-plan");
      writeFileSync(join(partialStaging, "candidate-plan.json"), "{", "utf8");
      const orphanPaths = styleMasterStorePaths(value.runDir, { plan_sha256: orphan.plan_sha256 });
      const scopePaths = styleMasterStorePaths(value.runDir, { workflow: "framed" });

      expect(orphanPublished).toMatchObject({ published: true, replay: false });
      expect(concurrentReplay).toMatchObject({ published: false, replay: true });
      expect(existsSync(concurrentStaging)).toBe(false);
      expect(existsSync(orphanPaths.plan_root)).toBe(true);
      expect(existsSync(scopePaths.scope_head)).toBe(false);

      const planned = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 1 });
      const beforeInspection = readFileSync(scopePaths.scope_head);
      expect(planned.plan_sha256).not.toBe(orphan.plan_sha256);
      expect(readFileSync(scopePaths.scope_head, "utf8")).toContain(planned.plan_sha256);
      expect(existsSync(orphanPaths.plan_root)).toBe(true);
      expect(existsSync(partialStaging)).toBe(true);
      expect(resolveStyleMasterScopeContext(value.runDir)).toMatchObject({ run_dir: value.runDir, workflow: "framed" });
      expect(readFileSync(scopePaths.scope_head)).toEqual(beforeInspection);
      expect(existsSync(partialStaging)).toBe(true);
      assertNoPageRawMaterialization(value, stateBefore);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("rejects zero-cost planning without a local snapshot and keeps invalid or stale input non-writing", async () => {
    const value = fixture();
    try {
      const stateBefore = readFileSync(statePath(value.deck));
      const history = styleMasterStorePaths(value.runDir);
      await expect(planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 0 })).rejects.toMatchObject({
        code: "style_master_zero_candidate_invalid",
      });
      expect(existsSync(history.plans_root)).toBe(false);

      writeFileSync(styleAsset(value.runDir, STYLE_MASTER_PROMPT), "", "utf8");
      await expect(planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 1 })).rejects.toMatchObject({
        code: "style_master_intent_invalid",
      });
      expect(existsSync(history.plans_root)).toBe(false);

      writeFileSync(styleAsset(value.runDir, STYLE_MASTER_PROMPT), Buffer.from([0xc3, 0x28]));
      await expect(planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 1 })).rejects.toMatchObject({
        code: "style_master_intent_invalid",
      });
      expect(existsSync(history.plans_root)).toBe(false);

      writeFileSync(styleAsset(value.runDir, STYLE_MASTER_PROMPT), "Use a calm editorial visual system with material depth.\n", "utf8");

      writeFileSync(styleAsset(value.runDir, STYLE_MASTER_IMAGE), "not an image", "utf8");
      await expect(planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 1 })).rejects.toMatchObject({
        code: "style_master_local_invalid",
      });
      expect(existsSync(history.plans_root)).toBe(false);

      const staleScope = planningScope(value);
      writeFileSync(join(value.runDir, SLIDE_SPECS_NAME), source("Changed after scope resolution"), "utf8");
      await expect(planStyleMasterCandidates({ scope: staleScope, candidateCount: 1 })).rejects.toMatchObject({
        code: "style_master_scope_stale",
      });
      expect(existsSync(history.plans_root)).toBe(false);
      assertNoPageRawMaterialization(value, stateBefore);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("does not replace a plan with an unresolved submitted candidate", async () => {
    const value = fixture();
    try {
      const stateBefore = readFileSync(statePath(value.deck));
      const first = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 1 });
      submittedAttempt({ ...first, run_dir: value.runDir });
      writeFileSync(styleAsset(value.runDir, STYLE_MASTER_PROMPT), "A changed visual direction.\n", "utf8");

      await expect(planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 1 })).rejects.toMatchObject({
        code: "style_master_plan_blocked",
      });
      const head = styleMasterStorePaths(value.runDir, { workflow: "framed" });
      expect(readFileSync(head.scope_head).toString("utf8")).toContain(first.plan_sha256);
      assertNoPageRawMaterialization(value, stateBefore);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("writes one timestamp-free proceed decision, promotes reviewed bytes, and exact-replays its selection", async () => {
    const value = fixture();
    try {
      const plan = await generatedReviewablePlan(value);
      const first = await acceptStyleMasterCandidateReview({
        scope: planningScope(value),
        planSha256: plan.plan_sha256,
        decision: "proceed",
        candidateId: "candidate-001",
      });
      const paths = styleMasterStorePaths(value.runDir, { plan_sha256: plan.plan_sha256 });
      const decision = JSON.parse(readFileSync(paths.review_decision, "utf8"));
      const compatibility = readFileSync(styleAsset(value.runDir, STYLE_MASTER_IMAGE));

      expect(first).toMatchObject({
        promoted: true,
        replay: false,
        plan_sha256: plan.plan_sha256,
        candidate_id: "candidate-001",
        compatibility_projection: { status: "rebuilt" },
      });
      expect(Object.keys(decision).sort()).toEqual([
        "schema", "run_version", "workflow", "plan_sha256", "decision", "candidate_id", "candidate_sha256", "previous_selection_sha256",
      ].sort());
      expect(decision).toMatchObject({ schema: STYLE_MASTER_REVIEW_DECISION_SCHEMA, decision: "proceed" });
      expect(Object.hasOwn(decision, "accepted_at")).toBe(false);
      expect(compatibility.subarray(0, 3).toString("hex")).toBe("ffd8ff");
      expect(existsSync(join(value.runDir, "overrides", "visual-style", STYLE_MASTER_IMAGE))).toBe(false);
      expect(resolveEffectiveStyleMasterSelection(value.deck, { runDir: value.runDir })).toMatchObject({
        ok: true,
        selection_sha256: first.selection_sha256,
        record: { accepted_at: first.accepted_at, candidate_sha256: digest(generatedCandidateBytes()) },
      });
      expect(existsSync(value.paths.target_source_receipt)).toBe(false);
      expect(existsSync(value.paths.target_raw_plan)).toBe(false);

      const replay = await acceptStyleMasterCandidateReview({
        scope: planningScope(value),
        planSha256: plan.plan_sha256,
        decision: "proceed",
        candidateId: "candidate-001",
      });
      expect(replay).toMatchObject({
        promoted: true,
        replay: true,
        selection_sha256: first.selection_sha256,
        accepted_at: first.accepted_at,
      });
      expect(readFileSync(paths.review_decision)).toEqual(styleMasterCanonicalBytes(decision));
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("promotes CRC-valid provider PNG bytes carrying a private caBX chunk without changing selection identity", async () => {
    const value = fixture();
    try {
      const candidateBytes = providerPngWithPrivateCaBX(nativeGeneratedCandidateBytes(17, 11));
      expect(decodePng(candidateBytes, { checkCrc: true })).toMatchObject({ width: 17, height: 11 });
      const plan = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 1 });
      await authorizeStyleMasterCandidates({ scope: planningScope(value), planSha256: plan.plan_sha256 });
      await generateStyleMasterCandidates({
        scope: planningScope(value),
        planSha256: plan.plan_sha256,
        submit: async () => candidateBytes,
      });
      await prepareStyleMasterCandidateReview({ scope: planningScope(value), planSha256: plan.plan_sha256 });
      // The prior compatibility projection used this loader for candidate PNG bytes.
      canvasLoaderControls.rejectPrivatePng = true;

      const accepted = await acceptStyleMasterCandidateReview({
        scope: planningScope(value),
        planSha256: plan.plan_sha256,
        decision: "proceed",
        candidateId: "candidate-001",
      });
      const candidatePath = styleMasterStorePaths(value.runDir, {
        plan_sha256: plan.plan_sha256,
        candidate_id: "candidate-001",
        candidate_media_type: "image/png",
      }).candidate_image;

      expect(readFileSync(candidatePath)).toEqual(candidateBytes);
      expect(accepted).toMatchObject({
        compatibility_projection: { status: "rebuilt" },
        selection: { candidate_sha256: digest(candidateBytes) },
      });
      expect(readFileSync(styleAsset(value.runDir, STYLE_MASTER_IMAGE)).subarray(0, 3).toString("hex")).toBe("ffd8ff");
      expect(resolveEffectiveStyleMasterSelection(value.deck, { runDir: value.runDir })).toMatchObject({
        ok: true,
        selection_sha256: accepted.selection_sha256,
        record: { candidate_sha256: digest(candidateBytes), candidate_width: 17, candidate_height: 11 },
      });
    } finally {
      canvasLoaderControls.rejectPrivatePng = false;
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("projects a 16-bit RGB selected candidate without changing its selected PNG bytes", async () => {
    const value = fixture();
    try {
      const candidateBytes = sixteenBitRgbCandidateBytes(17, 11);
      expect(decodePng(candidateBytes, { checkCrc: true })).toMatchObject({ width: 17, height: 11, channels: 3, depth: 16 });
      const plan = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 1 });
      await authorizeStyleMasterCandidates({ scope: planningScope(value), planSha256: plan.plan_sha256 });
      await generateStyleMasterCandidates({
        scope: planningScope(value),
        planSha256: plan.plan_sha256,
        submit: async () => candidateBytes,
      });
      await prepareStyleMasterCandidateReview({ scope: planningScope(value), planSha256: plan.plan_sha256 });

      const accepted = await acceptStyleMasterCandidateReview({
        scope: planningScope(value),
        planSha256: plan.plan_sha256,
        decision: "proceed",
        candidateId: "candidate-001",
      });
      const candidatePath = styleMasterStorePaths(value.runDir, {
        plan_sha256: plan.plan_sha256,
        candidate_id: "candidate-001",
        candidate_media_type: "image/png",
      }).candidate_image;

      expect(accepted).toMatchObject({
        compatibility_projection: { status: "rebuilt" },
        selection: { candidate_sha256: digest(candidateBytes), candidate_width: 17, candidate_height: 11 },
      });
      expect(readFileSync(candidatePath)).toEqual(candidateBytes);
      expect(readFileSync(styleAsset(value.runDir, STYLE_MASTER_IMAGE)).subarray(0, 3).toString("hex")).toBe("ffd8ff");
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("resumes an exact persisted proceed decision after the selection-CAS interruption window", async () => {
    const value = fixture();
    try {
      const plan = await generatedReviewablePlan(value);
      const decision = writeReviewDecision({ ...plan, run_dir: value.runDir }, "proceed", {
        candidateSha256: digest(generatedCandidateBytes()),
      });
      const paths = styleMasterStorePaths(value.runDir, { plan_sha256: plan.plan_sha256 });
      const decisionBytes = readFileSync(paths.review_decision);

      expect(resolveEffectiveStyleMasterSelection(value.deck, { runDir: value.runDir })).toMatchObject({
        ok: false,
        code: "STYLE_MASTER_SELECTION_MISSING",
      });
      const resumed = await acceptStyleMasterCandidateReview({
        scope: planningScope(value),
        planSha256: plan.plan_sha256,
        decision: "proceed",
        candidateId: "candidate-001",
      });

      expect(resumed).toMatchObject({
        promoted: true,
        replay: false,
        review_decision_sha256: decision.checked.review_decision_sha256,
        candidate_id: "candidate-001",
      });
      expect(readFileSync(paths.review_decision)).toEqual(decisionBytes);
      expect(resolveEffectiveStyleMasterSelection(value.deck, { runDir: value.runDir })).toMatchObject({
        ok: true,
        selection_sha256: resumed.selection_sha256,
      });
      expect(existsSync(value.paths.target_source_receipt)).toBe(false);
      expect(existsSync(value.paths.target_raw_plan)).toBe(false);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("revalidates reviewed immutable candidate bytes before writing a decision or selection", async () => {
    const value = fixture();
    try {
      const plan = await generatedReviewablePlan(value);
      await prepareStyleMasterCandidateReview({ scope: planningScope(value), planSha256: plan.plan_sha256 });
      const paths = styleMasterStorePaths(value.runDir, {
        plan_sha256: plan.plan_sha256,
        candidate_id: "candidate-001",
        candidate_media_type: "image/png",
      });
      writeFileSync(paths.candidate_image, localImageBytes(1));

      await expect(acceptStyleMasterCandidateReview({
        scope: planningScope(value),
        planSha256: plan.plan_sha256,
        decision: "proceed",
        candidateId: "candidate-001",
      })).rejects.toMatchObject({ code: "style_master_review_evidence_invalid" });
      expect(existsSync(styleMasterStorePaths(value.runDir, { plan_sha256: plan.plan_sha256 }).review_decision)).toBe(false);
      expect(resolveEffectiveStyleMasterSelection(value.deck, { runDir: value.runDir })).toMatchObject({
        ok: false,
        code: "STYLE_MASTER_SELECTION_MISSING",
      });
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("returns the one concurrent selection winner instead of minting another timestamp", async () => {
    const value = fixture();
    try {
      const plan = await generatedReviewablePlan(value);
      const [first, second] = await Promise.all([
        acceptStyleMasterCandidateReview({
          scope: planningScope(value),
          planSha256: plan.plan_sha256,
          decision: "proceed",
          candidateId: "candidate-001",
        }),
        acceptStyleMasterCandidateReview({
          scope: planningScope(value),
          planSha256: plan.plan_sha256,
          decision: "proceed",
          candidateId: "candidate-001",
        }),
      ]);

      expect(first.selection_sha256).toBe(second.selection_sha256);
      expect(first.accepted_at).toBe(second.accepted_at);
      expect([first.replay, second.replay]).toContain(true);
      expect(resolveEffectiveStyleMasterSelection(value.deck, { runDir: value.runDir })).toMatchObject({
        ok: true,
        selection_sha256: first.selection_sha256,
      });
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("does not promote repair or redirect decisions and rejects stale review evidence before decision mutation", async () => {
    const repair = fixture({ local: true });
    const stale = fixture({ local: true });
    try {
      const repairPlan = await planStyleMasterCandidates({ scope: planningScope(repair), candidateCount: 0 });
      const repaired = await acceptStyleMasterCandidateReview({
        scope: planningScope(repair),
        planSha256: repairPlan.plan_sha256,
        decision: "repair",
      });
      const repairPaths = styleMasterStorePaths(repair.runDir, { plan_sha256: repairPlan.plan_sha256 });
      expect(repaired).toMatchObject({ decision: "repair", promoted: false, next_action: "repair_style_master_candidates" });
      expect(existsSync(repairPaths.review_decision)).toBe(true);
      expect(resolveEffectiveStyleMasterSelection(repair.deck, { runDir: repair.runDir })).toMatchObject({
        ok: false,
        code: "STYLE_MASTER_SELECTION_MISSING",
      });
      await expect(acceptStyleMasterCandidateReview({
        scope: planningScope(repair),
        planSha256: repairPlan.plan_sha256,
        decision: "redirect",
      })).rejects.toMatchObject({ code: "style_master_record_conflict" });

      const stalePlan = await planStyleMasterCandidates({ scope: planningScope(stale), candidateCount: 0 });
      const stalePaths = styleMasterStorePaths(stale.runDir, { plan_sha256: stalePlan.plan_sha256 });
      writeFileSync(styleAsset(stale.runDir, STYLE_MASTER_IMAGE), localImageBytes(1));
      await expect(acceptStyleMasterCandidateReview({
        scope: planningScope(stale),
        planSha256: stalePlan.plan_sha256,
        decision: "repair",
      })).rejects.toMatchObject({ code: "style_master_plan_stale" });
      expect(existsSync(stalePaths.review_decision)).toBe(false);
      expect(resolveEffectiveStyleMasterSelection(stale.deck, { runDir: stale.runDir })).toMatchObject({
        ok: false,
        code: "STYLE_MASTER_SELECTION_MISSING",
      });
    } finally {
      rmSync(repair.root, { recursive: true, force: true });
      rmSync(stale.root, { recursive: true, force: true });
    }
  });

  it("repairs only the committed selection's JPEG projection after head advancement", async () => {
    const value = fixture();
    try {
      const firstPlan = await generatedReviewablePlan(value);
      const accepted = await acceptStyleMasterCandidateReview({
        scope: planningScope(value),
        planSha256: firstPlan.plan_sha256,
        decision: "proceed",
        candidateId: "candidate-001",
      });
      const compatibilityPath = styleAsset(value.runDir, STYLE_MASTER_IMAGE);
      rmSync(compatibilityPath, { force: true });
      const successor = await planStyleMasterCandidates({ scope: planningScope(value), candidateCount: 1 });
      expect(successor.plan_sha256).not.toBe(firstPlan.plan_sha256);

      const replay = await acceptStyleMasterCandidateReview({
        scope: planningScope(value),
        planSha256: firstPlan.plan_sha256,
        decision: "proceed",
        candidateId: "candidate-001",
      });
      expect(replay).toMatchObject({
        replay: true,
        selection_sha256: accepted.selection_sha256,
        accepted_at: accepted.accepted_at,
        compatibility_projection: { status: "rebuilt" },
      });
      expect(readFileSync(compatibilityPath).subarray(0, 3).toString("hex")).toBe("ffd8ff");
      expect(resolveEffectiveStyleMasterSelection(value.deck, { runDir: value.runDir })).toMatchObject({
        ok: true,
        record: { plan_sha256: firstPlan.plan_sha256 },
      });
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("projects an accepted candidate to an existing override without mutating the backbone payload", async () => {
    const value = fixture();
    try {
      const backbonePath = join(value.deck, "2_backbone", "visual-style", STYLE_MASTER_IMAGE);
      const overridePath = join(value.runDir, "overrides", "visual-style", STYLE_MASTER_IMAGE);
      const backboneBytes = Buffer.from("backbone compatibility payload remains untouched");
      writeFileSync(backbonePath, backboneBytes);
      mkdirSync(join(value.runDir, "overrides", "visual-style"), { recursive: true });
      writeFileSync(overridePath, localImageBytes());
      const plan = await generatedReviewablePlan(value);

      const accepted = await acceptStyleMasterCandidateReview({
        scope: planningScope(value),
        planSha256: plan.plan_sha256,
        decision: "proceed",
        candidateId: "candidate-001",
      });

      expect(accepted.compatibility_projection.path).toBe(overridePath);
      expect(readFileSync(overridePath).subarray(0, 3).toString("hex")).toBe("ffd8ff");
      expect(readFileSync(backbonePath)).toEqual(backboneBytes);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("repairs one selection's derived payload without rewriting a sibling version selection", async () => {
    const value = fixture();
    try {
      const plan = await generatedReviewablePlan(value);
      const accepted = await acceptStyleMasterCandidateReview({
        scope: planningScope(value),
        planSha256: plan.plan_sha256,
        decision: "proceed",
        candidateId: "candidate-001",
      });
      const state = readState(value.deck, { purpose: "observe" });
      const sibling = {
        ...accepted.selection,
        run_version: "v2",
        plan_sha256: "a".repeat(64),
        candidate_sha256: "b".repeat(64),
        candidate_provenance_sha256: "c".repeat(64),
        style_intent_sha256: "d".repeat(64),
        style_context_sha256: "e".repeat(64),
        review_decision_sha256: "f".repeat(64),
      };
      state.page_image_style_master.by_version["3_versions/v2"] = sibling;
      writeState(value.deck, state);
      const stateBeforeReplay = readFileSync(statePath(value.deck));
      rmSync(styleAsset(value.runDir, STYLE_MASTER_IMAGE), { force: true });

      const replay = await acceptStyleMasterCandidateReview({
        scope: planningScope(value),
        planSha256: plan.plan_sha256,
        decision: "proceed",
        candidateId: "candidate-001",
      });

      expect(replay).toMatchObject({ replay: true, selection_sha256: accepted.selection_sha256 });
      expect(readState(value.deck, { purpose: "observe" })
        .page_image_style_master.by_version["3_versions/v2"])
        .toEqual(sibling);
      expect(readFileSync(statePath(value.deck))).toEqual(stateBeforeReplay);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("preserves a committed selection when compatibility JPEG projection fails and repairs it on exact replay", async () => {
    const value = fixture();
    try {
      const plan = await generatedReviewablePlan(value);
      const compatibilityPath = styleAsset(value.runDir, STYLE_MASTER_IMAGE);
      const compatibilityDirectory = join(value.deck, "2_backbone", "visual-style");
      chmodSync(compatibilityDirectory, 0o500);
      let failure = null;
      try {
        try {
          await acceptStyleMasterCandidateReview({
            scope: planningScope(value),
            planSha256: plan.plan_sha256,
            decision: "proceed",
            candidateId: "candidate-001",
          });
        } catch (error) {
          failure = error;
        }
      } finally {
        chmodSync(compatibilityDirectory, 0o700);
      }
      const committed = resolveEffectiveStyleMasterSelection(value.deck, { runDir: value.runDir });
      expect(failure).toMatchObject({
        code: "style_master_compatibility_projection_failed",
        subject: { kind: "style_master_selection", id: committed.selection_sha256 },
        reason: { kind: "compatibility_projection_failed" },
        replay: { plan_sha256: plan.plan_sha256, decision: "proceed", candidate_id: "candidate-001" },
      });
      expect(committed).toMatchObject({ ok: true, record: { plan_sha256: plan.plan_sha256 } });

      const recovered = await acceptStyleMasterCandidateReview({
        scope: planningScope(value),
        planSha256: plan.plan_sha256,
        decision: "proceed",
        candidateId: "candidate-001",
      });
      expect(recovered).toMatchObject({
        replay: true,
        selection_sha256: committed.selection_sha256,
        accepted_at: committed.record.accepted_at,
        compatibility_projection: { status: "rebuilt" },
      });
      expect(readFileSync(compatibilityPath).subarray(0, 3).toString("hex")).toBe("ffd8ff");
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});

describe("Style Master pending successor artifact projection", () => {
  it("projects a matching-binding successor and returns to the accepted path after exact promotion", async () => {
    const value = fixture({ local: true });
    try {
      const { predecessor, successor } = await matchingSelectedSuccessor(value);
      expect(successor.plan.style_intent_sha256).toBe(predecessor.plan.style_intent_sha256);
      expect(successor.plan.style_context_sha256).toBe(predecessor.plan.style_context_sha256);
      expect(successor.plan.candidate_generation_profile_sha256).toBe(predecessor.plan.candidate_generation_profile_sha256);

      const pendingBefore = pendingSuccessorRecordSnapshot(value, successor);
      const projection = await inspectPendingStyleMasterSuccessorCandidateArtifacts({ scope: planningScope(value) });
      expect(projection).toMatchObject({
        plan_sha256: successor.plan_sha256,
        next_action: "authorize_style_master_candidates",
      });
      expect(pendingSuccessorRecordSnapshot(value, successor)).toEqual(pendingBefore);

      await authorizeStyleMasterCandidates({ scope: planningScope(value), planSha256: successor.plan_sha256 });
      await generateStyleMasterCandidates({
        scope: planningScope(value),
        planSha256: successor.plan_sha256,
        submit: async () => generatedCandidateBytes(),
      });
      await acceptStyleMasterCandidateReview({
        scope: planningScope(value),
        planSha256: successor.plan_sha256,
        decision: "proceed",
        candidateId: "candidate-001",
      });
      const promotedBefore = pendingSuccessorRecordSnapshot(value, successor);
      await expect(inspectPendingStyleMasterSuccessorCandidateArtifacts({ scope: planningScope(value) })).resolves.toBeNull();
      expect(pendingSuccessorRecordSnapshot(value, successor)).toEqual(promotedBefore);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("revalidates stale-successor local and succeeded media without mutating owner records", async () => {
    const value = fixture({ local: true });
    try {
      const { successor } = await staleSelectedSuccessor(value);
      await authorizeStyleMasterCandidates({ scope: planningScope(value), planSha256: successor.plan_sha256 });
      await generateStyleMasterCandidates({
        scope: planningScope(value),
        planSha256: successor.plan_sha256,
        submit: async () => generatedCandidateBytes(),
      });

      const before = pendingSuccessorRecordSnapshot(value, successor);
      const projection = await inspectPendingStyleMasterSuccessorCandidateArtifacts({ scope: planningScope(value) });
      expect(projection).toMatchObject({
        run_version: "v1",
        workflow: "framed",
        plan_sha256: successor.plan_sha256,
        next_action: "review_style_master_candidates",
      });
      expect(projection.candidates).toEqual(expect.arrayContaining([
        expect.objectContaining({
          availability: "available",
          candidate_id: "local-existing",
          kind: "local-existing",
          lifecycle_state: "local-existing",
          locator: expect.stringContaining(successor.plan_sha256),
        }),
        expect.objectContaining({
          availability: "available",
          candidate_id: "candidate-001",
          kind: "generated",
          lifecycle_state: "succeeded",
          candidate_sha256: digest(generatedCandidateBytes()),
          locator: expect.stringContaining(successor.plan_sha256),
        }),
      ]));
      expect(pendingSuccessorRecordSnapshot(value, successor)).toEqual(before);
      assertNoPageRawMaterialization(value, before.state);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("reports non-media generated lifecycle states by stable ID without locators", async () => {
    const values = [];
    try {
      for (const status of ["planned", "claimed", "submitted", "failed", "unknown"]) {
        const value = fixture({ local: true });
        values.push(value);
        const { successor } = await staleSelectedSuccessor(value);
        if (status !== "planned") {
          await authorizeStyleMasterCandidates({ scope: planningScope(value), planSha256: successor.plan_sha256 });
          persistPendingSuccessorAttempt(value, successor, "candidate-001", status);
        }
        const before = pendingSuccessorRecordSnapshot(value, successor);
        const projection = await inspectPendingStyleMasterSuccessorCandidateArtifacts({ scope: planningScope(value) });
        const candidate = projection.candidates.find((item) => item.candidate_id === "candidate-001");
        expect(candidate).toMatchObject({
          candidate_id: "candidate-001",
          availability: "unavailable",
          lifecycle_state: status,
        });
        expect(candidate).not.toHaveProperty("locator");
        expect(pendingSuccessorRecordSnapshot(value, successor)).toEqual(before);
      }
    } finally {
      for (const value of values) rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("fails closed for stale scope, mismatched predecessor, and corrupt local or generated media", async () => {
    const staleScope = fixture({ local: true });
    const mismatched = fixture({ local: true });
    const inputStale = fixture({ local: true });
    const invalidReplay = fixture({ local: true });
    const localCorrupt = fixture({ local: true });
    const generatedCorrupt = fixture({ local: true });
    try {
      const stale = planningScope(staleScope);
      writeFileSync(join(staleScope.runDir, SLIDE_SPECS_NAME), source("Changed after pending scope resolution"), "utf8");
      const staleBefore = readFileSync(statePath(staleScope.deck));
      await expect(inspectPendingStyleMasterSuccessorCandidateArtifacts({ scope: stale })).rejects.toMatchObject({
        code: "style_master_scope_stale",
      });
      expect(readFileSync(statePath(staleScope.deck))).toEqual(staleBefore);

      const { successor: mismatchSuccessor } = await staleSelectedSuccessor(mismatched);
      const changedState = readState(mismatched.deck, { purpose: "observe" });
      changedState.page_image_style_master.by_version["3_versions/v1"].accepted_at = "2026-08-02T00:00:00.000Z";
      writeState(mismatched.deck, changedState);
      const mismatchBefore = pendingSuccessorRecordSnapshot(mismatched, mismatchSuccessor);
      await expect(inspectPendingStyleMasterSuccessorCandidateArtifacts({ scope: planningScope(mismatched) })).rejects.toMatchObject({
        code: "style_master_selection_conflict",
      });
      expect(pendingSuccessorRecordSnapshot(mismatched, mismatchSuccessor)).toEqual(mismatchBefore);

      const { successor: inputStaleSuccessor } = await matchingSelectedSuccessor(inputStale);
      writeFileSync(styleAsset(inputStale.runDir, STYLE_MASTER_PROMPT), "The current plan inputs are stale.\n", "utf8");
      const inputStaleBefore = pendingSuccessorRecordSnapshot(inputStale, inputStaleSuccessor);
      await expect(inspectPendingStyleMasterSuccessorCandidateArtifacts({ scope: planningScope(inputStale) })).resolves.toBeNull();
      expect(pendingSuccessorRecordSnapshot(inputStale, inputStaleSuccessor)).toEqual(inputStaleBefore);

      const { predecessor: replayPredecessor, successor: replaySuccessor } = await matchingSelectedSuccessor(invalidReplay);
      const predecessorPaths = styleMasterStorePaths(invalidReplay.runDir, { plan_sha256: replayPredecessor.plan_sha256 });
      writeFileSync(predecessorPaths.review_decision, "corrupt predecessor decision", "utf8");
      const replayBefore = pendingSuccessorRecordSnapshot(invalidReplay, replaySuccessor);
      await expect(inspectPendingStyleMasterSuccessorCandidateArtifacts({ scope: planningScope(invalidReplay) })).rejects.toMatchObject({
        code: "style_master_selection_invalid",
      });
      expect(pendingSuccessorRecordSnapshot(invalidReplay, replaySuccessor)).toEqual(replayBefore);

      const { successor: localSuccessor } = await staleSelectedSuccessor(localCorrupt);
      const localCandidate = localSuccessor.plan.candidates.find((candidate) => candidate.candidate_id === "local-existing");
      const localPaths = styleMasterStorePaths(localCorrupt.runDir, {
        plan_sha256: localSuccessor.plan_sha256,
        candidate_id: localCandidate.candidate_id,
        candidate_media_type: localCandidate.candidate_media_type,
      });
      writeFileSync(localPaths.candidate_provenance, "corrupt local provenance", "utf8");
      const localBefore = pendingSuccessorRecordSnapshot(localCorrupt, localSuccessor);
      await expect(inspectPendingStyleMasterSuccessorCandidateArtifacts({ scope: planningScope(localCorrupt) })).rejects.toMatchObject({
        code: "style_master_record_invalid",
      });
      expect(pendingSuccessorRecordSnapshot(localCorrupt, localSuccessor)).toEqual(localBefore);

      const { successor: generatedSuccessor } = await staleSelectedSuccessor(generatedCorrupt);
      await authorizeStyleMasterCandidates({ scope: planningScope(generatedCorrupt), planSha256: generatedSuccessor.plan_sha256 });
      await generateStyleMasterCandidates({
        scope: planningScope(generatedCorrupt),
        planSha256: generatedSuccessor.plan_sha256,
        submit: async () => generatedCandidateBytes(),
      });
      const generatedPaths = styleMasterStorePaths(generatedCorrupt.runDir, {
        plan_sha256: generatedSuccessor.plan_sha256,
        candidate_id: "candidate-001",
        candidate_media_type: "image/png",
      });
      writeFileSync(generatedPaths.candidate_image, "corrupt generated candidate", "utf8");
      const generatedBefore = pendingSuccessorRecordSnapshot(generatedCorrupt, generatedSuccessor);
      await expect(inspectPendingStyleMasterSuccessorCandidateArtifacts({ scope: planningScope(generatedCorrupt) })).rejects.toMatchObject({
        code: "style_master_review_evidence_invalid",
      });
      expect(pendingSuccessorRecordSnapshot(generatedCorrupt, generatedSuccessor)).toEqual(generatedBefore);
    } finally {
      rmSync(staleScope.root, { recursive: true, force: true });
      rmSync(mismatched.root, { recursive: true, force: true });
      rmSync(inputStale.root, { recursive: true, force: true });
      rmSync(invalidReplay.root, { recursive: true, force: true });
      rmSync(localCorrupt.root, { recursive: true, force: true });
      rmSync(generatedCorrupt.root, { recursive: true, force: true });
    }
  });
});
