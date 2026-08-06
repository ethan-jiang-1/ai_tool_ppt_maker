import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { decode as decodePng } from "fast-png";

import { canonicalJson, canonicalJsonSha256 } from "../identity/canonical_json.mjs";
import { sha256Bytes } from "../identity/byte_hash.mjs";
import {
  SLIDE_SPECS_NAME,
  STYLE_MASTER_IMAGE,
  STYLE_MASTER_PROMPT,
  deckRoot,
  styleAsset,
} from "../run-bundle/bundle_layout.mjs";
import {
  readState,
  recordEffectiveStyleMasterSelection,
  resolveEffectiveStyleMasterSelection,
} from "../state/state.mjs";
import { resolveStyleMasterScopeContext } from "./style_master_scope.mjs";
import {
  STYLE_MASTER_GENERATION_PROFILE,
  STYLE_MASTER_CANDIDATE_ABANDONMENT_SCHEMA,
  STYLE_MASTER_GENERATED_PROVENANCE_SCHEMA,
  STYLE_MASTER_LOCAL_PROVENANCE_SCHEMA,
  STYLE_MASTER_REVIEW_DECISION_SCHEMA,
  STYLE_MASTER_REVIEW_DECISIONS,
  STYLE_MASTER_SELECTION_SCHEMA,
  StyleMasterSchemaError,
  createStyleMasterCandidateAttemptRecord,
  createStyleMasterCandidateGrantRecord,
  createStyleMasterHeadRecord,
  createStyleMasterPlanRecord,
  createStyleMasterProviderRequestRecord,
  deriveStyleMasterGrantProgress,
  normalizeStyleMasterAbandonmentReason,
  styleMasterReasonSha256,
  styleMasterCanonicalBytes,
  styleMasterGenerationProfileSha256,
  validateStyleMasterAbandonmentRecord,
  validateStyleMasterCandidateAttemptRecord,
  validateStyleMasterCandidateGrantRecord,
  validateStyleMasterGeneratedProvenance,
  validateStyleMasterHeadRecord,
  validateStyleMasterLocalProvenance,
  validateStyleMasterPlanRecord,
  validateStyleMasterProviderRequestRecord,
  validateStyleMasterReviewDecisionRecord,
  validateStyleMasterSelectionRecord,
} from "./style_master_schema.mjs";
import {
  cleanupStyleMasterStagingDirectory,
  createOrExactMatchStyleMasterRecord,
  createStyleMasterStagingDirectory,
  placeStyleMasterCandidateImage,
  publishStyleMasterStagedPlan,
  readCanonicalStyleMasterRecord,
  styleMasterStorePaths,
  writeStyleMasterCandidateAttemptCas,
  writeStyleMasterScopeHeadCas,
} from "./style_master_store.mjs";

const SHA256_RE = /^[0-9a-f]{64}$/;
const STABLE_SLIDE_ID_RE = /^[A-Za-z][A-Za-z0-9_-]{0,127}$/;
const MAX_PLAN_CAS_RETRIES = 8;
const MAX_GENERATION_CAS_RETRIES = 8;
const MAX_SELECTION_CAS_RETRIES = 8;
const COMPILED_PROMPT_SCHEMA = "page-authority-style-master-provider-brief-v1";
const COMPILED_PROMPT_INSTRUCTION = "Generate one visual style reference image with no readable text or labels.";
const MAX_COMPILED_PROMPT_BYTES = 4_000;

export class StyleMasterPlanError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = "StyleMasterPlanError";
    this.code = code;
    if (details && typeof details === "object") Object.assign(this, details);
  }
}

function fail(code, message, details = null) {
  throw new StyleMasterPlanError(code, message, details);
}

function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    fail("style_master_plan_input_invalid", `${label} must be a plain object`);
  }
  return value;
}

function assertInside(root, candidate, label) {
  const resolvedRoot = resolve(root);
  const resolvedCandidate = resolve(candidate);
  const relation = relative(resolvedRoot, resolvedCandidate);
  if (!relation || relation === ".." || relation.startsWith(`..${sep}`) || isAbsolute(relation)) {
    fail("style_master_scope_invalid", `${label} must remain below its canonical deck root`);
  }
  return resolvedCandidate;
}

function assertPhysicallyInside(root, candidate, label) {
  let realRoot;
  let realCandidate;
  try {
    realRoot = realpathSync(root);
    realCandidate = realpathSync(candidate);
  } catch {
    fail("style_master_scope_invalid", `${label} could not be resolved within its canonical deck root`);
  }
  const relation = relative(realRoot, realCandidate);
  if (!relation || relation === ".." || relation.startsWith(`..${sep}`) || isAbsolute(relation)) {
    fail("style_master_scope_invalid", `${label} resolves outside its canonical deck root`);
  }
  return realCandidate;
}

function sameScopeTuple(left, right) {
  return left.run_dir === right.run_dir && left.deck_dir === right.deck_dir &&
    left.run_version === right.run_version && left.workflow === right.workflow && left.draft === right.draft;
}

function equalBytes(left, right) {
  return Buffer.from(left).equals(Buffer.from(right));
}

function optionalCanonicalRecord(path, validator, options = undefined) {
  try {
    return readCanonicalStyleMasterRecord(path, validator, options);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function ensureCanonicalScope(scope) {
  assertPlainObject(scope, "Style Master scope");
  const runDir = resolve(scope.run_dir || "");
  const deckDir = deckRoot(runDir);
  const expectedContext = (() => {
    try {
      return resolveStyleMasterScopeContext(runDir);
    } catch (error) {
      fail("style_master_scope_stale", error?.message || "Style Master scope is no longer current");
    }
  })();
  if (scope.run_dir !== runDir || scope.deck_dir !== deckDir || scope.run_version !== basename(runDir) ||
    !sameScopeTuple(scope, expectedContext) ||
    scope.style_intent_source_path !== styleAsset(runDir, STYLE_MASTER_PROMPT) ||
    scope.local_existing_source_path !== styleAsset(runDir, STYLE_MASTER_IMAGE)) {
    fail("style_master_scope_invalid", "Style Master planning requires one canonical resolved scope");
  }
  const candidate = scope.source_candidate;
  assertPlainObject(candidate, "Style Master source candidate");
  if (candidate.run_dir !== runDir || candidate.deck_dir !== deckDir || candidate.source_path !== join(runDir, SLIDE_SPECS_NAME) ||
    candidate.workflow !== scope.workflow || candidate.receipt?.workflow !== scope.workflow ||
    !SHA256_RE.test(candidate.source_sha256 || "") || candidate.receipt?.source_sha256 !== candidate.source_sha256) {
    fail("style_master_scope_candidate_invalid", "Style Master planning requires the selected workflow's canonical read-only candidate source");
  }
  let sourceBytes;
  try {
    sourceBytes = readFileSync(candidate.source_path);
  } catch {
    fail("style_master_scope_stale", "Style Master candidate source is unavailable");
  }
  if (sha256Bytes(sourceBytes) !== candidate.source_sha256) {
    fail("style_master_scope_stale", "Style Master candidate source no longer matches its selected workflow receipt");
  }
  return Object.freeze({ ...scope, source_candidate: candidate });
}

async function resolveCurrentScope(scope, refreshScope) {
  const initial = ensureCanonicalScope(scope);
  if (refreshScope == null) return initial;
  if (typeof refreshScope !== "function") {
    fail("style_master_plan_input_invalid", "refreshScope must be a selected workflow scope resolver");
  }
  const refreshed = ensureCanonicalScope(await refreshScope(initial.run_dir));
  if (!sameScopeTuple(initial, refreshed)) {
    fail("style_master_scope_stale", "Style Master scope changed before planning could continue");
  }
  return refreshed;
}

function readStyleIntent(scope) {
  const path = scope.style_intent_source_path;
  assertInside(scope.deck_dir, path, "style intent source");
  let stats;
  try {
    stats = lstatSync(path);
  } catch {
    fail("style_master_intent_invalid", "Style Master requires the canonical style-master-prompt.md intent");
  }
  if (!stats.isFile() || stats.isSymbolicLink()) {
    fail("style_master_intent_invalid", "Style Master intent must be a confined regular file");
  }
  assertPhysicallyInside(scope.deck_dir, path, "style intent source");
  let bytes;
  try {
    bytes = readFileSync(path);
  } catch {
    fail("style_master_intent_invalid", "Style Master requires the canonical style-master-prompt.md intent");
  }
  if (bytes.length === 0 || bytes.length > 8192) {
    fail("style_master_intent_invalid", "Style Master intent must contain 1 through 8192 UTF-8 bytes");
  }
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail("style_master_intent_invalid", "Style Master intent must be valid UTF-8");
  }
  if (!text) fail("style_master_intent_invalid", "Style Master intent must not be empty");
  return Object.freeze({ text, style_intent_sha256: sha256Bytes(bytes) });
}

function assertCanonicalProjection(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("style_master_context_invalid", "Style Master visual projection contains a non-finite number");
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) assertCanonicalProjection(item);
    return;
  }
  assertPlainObject(value, "Style Master visual projection");
  if (Object.hasOwn(value, "identity_reference") || Object.hasOwn(value, "path")) {
    fail("style_master_context_invalid", "Style Master visual context cannot include identity-reference paths");
  }
  for (const item of Object.values(value)) assertCanonicalProjection(item);
}

function styleContextFromCandidate(scope) {
  const slides = scope.source_candidate.receipt?.slides;
  if (!Array.isArray(slides) || slides.length === 0) {
    fail("style_master_context_invalid", "Style Master requires selected-workflow slides with visual language projections");
  }
  const seen = new Set();
  const context = slides.map((slide) => {
    const slideId = slide?.slide_id;
    const projection = slide?.visual_language?.projection;
    if (!STABLE_SLIDE_ID_RE.test(slideId || "") || seen.has(slideId)) {
      fail("style_master_context_invalid", "Style Master visual context requires unique ASCII stable slide IDs");
    }
    seen.add(slideId);
    assertPlainObject(projection, "Style Master visual projection");
    assertCanonicalProjection(projection);
    return { slide_id: slideId, projection: structuredClone(projection) };
  }).sort((left, right) => left.slide_id < right.slide_id ? -1 : left.slide_id > right.slide_id ? 1 : 0);
  return Object.freeze({ context: Object.freeze(context), style_context_sha256: canonicalJsonSha256(context) });
}

function providerBriefIdentifier(value) {
  if (typeof value === "string" && value) return value;
  if (isPlainRecord(value) && typeof value.id === "string" && value.id) return value.id;
  return null;
}

function orderedUniqueProviderBriefIdentifiers(values) {
  return Object.freeze([...new Set(values)].sort((left, right) => left < right ? -1 : left > right ? 1 : 0));
}

function compactProviderBriefSummary(styleContext) {
  const recipes = [];
  const compositions = [];
  const motifs = [];
  const identitySubjects = [];
  for (const item of styleContext) {
    const projection = item?.projection;
    if (!isPlainRecord(projection)) {
      fail("style_master_prompt_invalid", "Style Master prompt compilation requires canonical visual projections");
    }
    const recipe = providerBriefIdentifier(projection.recipe);
    if (recipe) recipes.push(recipe);
    const composition = providerBriefIdentifier(projection.composition);
    if (composition) compositions.push(composition);
    if (Array.isArray(projection.motifs)) {
      for (const motif of projection.motifs) {
        const identifier = providerBriefIdentifier(motif);
        if (identifier) motifs.push(identifier);
      }
    }
    const identitySubject = providerBriefIdentifier(projection.selected_identity_subject_class);
    if (identitySubject) identitySubjects.push(identitySubject);
  }
  return Object.freeze({
    recipes: orderedUniqueProviderBriefIdentifiers(recipes),
    compositions: orderedUniqueProviderBriefIdentifiers(compositions),
    motifs: orderedUniqueProviderBriefIdentifiers(motifs),
    identity_subjects: orderedUniqueProviderBriefIdentifiers(identitySubjects),
  });
}

/** Deterministically compile the bounded provider brief without provider or page-raw work. */
export function compileStyleMasterProviderPrompt({ styleIntent, styleContext } = {}) {
  if (typeof styleIntent !== "string" || !styleIntent) {
    fail("style_master_prompt_invalid", "Style Master prompt compilation requires nonempty authored intent");
  }
  if (!Array.isArray(styleContext) || styleContext.length === 0) {
    fail("style_master_prompt_invalid", "Style Master prompt compilation requires canonical style context");
  }
  const prompt = {
    schema: COMPILED_PROMPT_SCHEMA,
    prompt_contract: STYLE_MASTER_GENERATION_PROFILE.prompt_contract,
    output_instruction: COMPILED_PROMPT_INSTRUCTION,
    style_intent: styleIntent,
    global_visual_summary: compactProviderBriefSummary(styleContext),
  };
  const bytes = Buffer.from(canonicalJson(prompt), "utf8");
  if (bytes.length === 0) fail("style_master_prompt_invalid", "Style Master compiled prompt must not be empty");
  if (bytes.length > MAX_COMPILED_PROMPT_BYTES) {
    fail("style_master_prompt_invalid", "Style Master provider brief exceeds the fixed 4,000 UTF-8 byte limit");
  }
  return Object.freeze({ bytes, compiled_prompt_sha256: sha256Bytes(bytes) });
}

function stableRegularFileBytes(path, label) {
  let before;
  try {
    before = lstatSync(path);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    fail("style_master_local_invalid", `${label} is unreadable`);
  }
  if (!before.isFile() || before.isSymbolicLink()) {
    fail("style_master_local_invalid", `${label} must be a confined regular file`);
  }
  let first;
  let afterFirst;
  let second;
  let afterSecond;
  try {
    first = readFileSync(path);
    afterFirst = lstatSync(path);
    second = readFileSync(path);
    afterSecond = lstatSync(path);
  } catch {
    fail("style_master_local_invalid", `${label} changed while being read`);
  }
  const sameFile = (left, right) => left.dev === right.dev && left.ino === right.ino && left.size === right.size &&
    left.mtimeMs === right.mtimeMs && left.ctimeMs === right.ctimeMs;
  if (!sameFile(before, afterFirst) || !sameFile(before, afterSecond) || !equalBytes(first, second) || first.length !== before.size) {
    fail("style_master_local_unstable", `${label} changed while being snapshotted`);
  }
  return first;
}

function imageMediaType(bytes) {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  fail("style_master_local_invalid", "local Style Master bytes must be PNG or JPEG");
}

function pngDimensions(bytes, label) {
  if (bytes.length < 45 || bytes.subarray(12, 16).toString("ascii") !== "IHDR" || bytes.readUInt32BE(8) !== 13) {
    fail("style_master_local_invalid", `${label} is not a structurally valid PNG`);
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  let offset = 8;
  let sawIend = false;
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const next = offset + 12 + length;
    if (next > bytes.length) fail("style_master_local_invalid", `${label} has a truncated PNG chunk`);
    const type = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    if (type === "IEND") {
      if (length !== 0 || next !== bytes.length) fail("style_master_local_invalid", `${label} has an invalid PNG terminator`);
      sawIend = true;
      break;
    }
    offset = next;
  }
  if (!sawIend || width === 0 || height === 0) fail("style_master_local_invalid", `${label} has invalid PNG dimensions`);
  return { candidate_width: width, candidate_height: height };
}

function jpegDimensions(bytes, label) {
  let offset = 2;
  while (offset < bytes.length) {
    while (offset < bytes.length && bytes[offset] !== 0xff) offset += 1;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) break;
    const marker = bytes[offset];
    offset += 1;
    if (marker === 0xd9) break;
    if (marker === 0x00 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) continue;
    if (offset + 2 > bytes.length) break;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) fail("style_master_local_invalid", `${label} has a truncated JPEG segment`);
    const sof = (marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf);
    if (sof) {
      if (length < 8) fail("style_master_local_invalid", `${label} has an invalid JPEG frame`);
      const height = bytes.readUInt16BE(offset + 3);
      const width = bytes.readUInt16BE(offset + 5);
      if (width === 0 || height === 0) fail("style_master_local_invalid", `${label} has invalid JPEG dimensions`);
      return { candidate_width: width, candidate_height: height };
    }
    offset += length;
  }
  fail("style_master_local_invalid", `${label} has no supported JPEG frame`);
}

function describeSupportedImage(bytes, label) {
  const candidate_media_type = imageMediaType(bytes);
  const dimensions = candidate_media_type === "image/png" ? pngDimensions(bytes, label) : jpegDimensions(bytes, label);
  return Object.freeze({ candidate_media_type, ...dimensions });
}

async function localCandidateFromScope(scope) {
  const expected = resolve(styleAsset(scope.run_dir, STYLE_MASTER_IMAGE));
  if (scope.local_existing_source_path !== expected) {
    fail("style_master_scope_invalid", "Style Master local input must use the layout-resolved canonical compatibility path");
  }
  assertInside(scope.deck_dir, expected, "local Style Master source");
  const bytes = stableRegularFileBytes(expected, "local Style Master source");
  if (bytes === null) return null;
  assertPhysicallyInside(scope.deck_dir, expected, "local Style Master source");
  const media = describeSupportedImage(bytes, "local Style Master source");
  const candidate_sha256 = sha256Bytes(bytes);
  const provenance = {
    schema: STYLE_MASTER_LOCAL_PROVENANCE_SCHEMA,
    kind: "local-existing",
    source_asset: "visual-style/style_master.jpg",
    candidate_sha256,
    ...media,
  };
  const checked = validateStyleMasterLocalProvenance(provenance);
  if (!checked.ok) throw new StyleMasterSchemaError(checked.code, checked.message);
  return Object.freeze({
    bytes,
    candidate: Object.freeze({
      candidate_id: "local-existing",
      kind: "local-existing",
      candidate_sha256,
      candidate_provenance_sha256: checked.candidate_provenance_sha256,
      ...media,
    }),
    provenance: Object.freeze(provenance),
  });
}

function currentPreviousSelectionSha256(scope) {
  const state = readState(scope.deck_dir, { purpose: "observe", heal: false, runDir: scope.run_dir });
  if (state?.replacement_required || state?.corrupted) {
    fail("style_master_selection_invalid", "Style Master cannot plan from unavailable state");
  }
  const map = state?.page_authority_style_master;
  if (map === undefined) return null;
  if (!map || typeof map !== "object" || Array.isArray(map) || !map.by_version || typeof map.by_version !== "object" || Array.isArray(map.by_version)) {
    fail("style_master_selection_invalid", "Style Master selection state has an invalid map shape");
  }
  const record = map.by_version[`3_versions/${scope.run_version}`];
  if (record === undefined) return null;
  const checked = validateStyleMasterSelectionRecord(record, {
    expectedRunVersion: scope.run_version,
    expectedWorkflow: scope.workflow,
  });
  if (!checked.ok) throw new StyleMasterSchemaError(checked.code, checked.message);
  return checked.selection_sha256;
}

async function compilePlanInputs(scope, candidateCount) {
  if (!Number.isInteger(candidateCount) || candidateCount < 0 || candidateCount > 4) {
    fail("style_master_candidate_count_invalid", "Style Master candidateCount must be an explicit integer from 0 through 4");
  }
  const intent = readStyleIntent(scope);
  const visual = styleContextFromCandidate(scope);
  const prompt = compileStyleMasterProviderPrompt({ styleIntent: intent.text, styleContext: visual.context });
  const local = await localCandidateFromScope(scope);
  if (candidateCount === 0 && local === null) {
    fail("style_master_zero_candidate_invalid", "zero generated candidates require one valid local-existing Style Master candidate");
  }
  return Object.freeze({
    style_intent_sha256: intent.style_intent_sha256,
    style_context_sha256: visual.style_context_sha256,
    candidate_generation_profile_sha256: styleMasterGenerationProfileSha256(),
    compiled_prompt_sha256: prompt.compiled_prompt_sha256,
    compiled_prompt_bytes: Buffer.from(prompt.bytes),
    generated_candidate_count: candidateCount,
    local,
  });
}

function inputCandidates(inputs) {
  return Object.freeze([
    ...(inputs.local ? [inputs.local.candidate] : []),
    ...Array.from({ length: inputs.generated_candidate_count }, (_, index) => ({
      candidate_id: `candidate-${String(index + 1).padStart(3, "0")}`,
      kind: "generated",
    })),
  ]);
}

function createPlanFromInputs(scope, inputs, { planGeneration, previousPlanSha256, previousSelectionSha256 }) {
  return createStyleMasterPlanRecord({
    schema: "page-authority-style-master-plan-identity-v1",
    run_version: scope.run_version,
    workflow: scope.workflow,
    plan_generation: planGeneration,
    previous_plan_sha256: previousPlanSha256,
    previous_selection_sha256: previousSelectionSha256,
    style_intent_sha256: inputs.style_intent_sha256,
    style_context_sha256: inputs.style_context_sha256,
    candidate_generation_profile_sha256: inputs.candidate_generation_profile_sha256,
    compiled_prompt_sha256: inputs.compiled_prompt_sha256,
    generated_candidate_count: inputs.generated_candidate_count,
    candidates: inputCandidates(inputs),
  });
}

function samePlanInputs(plan, inputs, previousSelectionSha256) {
  return plan.style_intent_sha256 === inputs.style_intent_sha256 &&
    plan.style_context_sha256 === inputs.style_context_sha256 &&
    plan.candidate_generation_profile_sha256 === inputs.candidate_generation_profile_sha256 &&
    plan.compiled_prompt_sha256 === inputs.compiled_prompt_sha256 &&
    plan.generated_candidate_count === inputs.generated_candidate_count &&
    plan.previous_selection_sha256 === previousSelectionSha256 &&
    canonicalJson(plan.candidates) === canonicalJson(inputCandidates(inputs));
}

function planInputProjection(inputs) {
  return {
    style_intent_sha256: inputs.style_intent_sha256,
    style_context_sha256: inputs.style_context_sha256,
    candidate_generation_profile_sha256: inputs.candidate_generation_profile_sha256,
    compiled_prompt_sha256: inputs.compiled_prompt_sha256,
    generated_candidate_count: inputs.generated_candidate_count,
    local_candidate: inputs.local?.candidate || null,
  };
}

function readCurrentHead(scope) {
  const paths = styleMasterStorePaths(scope.run_dir, { workflow: scope.workflow });
  const head = optionalCanonicalRecord(paths.scope_head, validateStyleMasterHeadRecord);
  if (head === null) return Object.freeze({ paths, head: null, plan: null, head_bytes: null });
  const planPaths = styleMasterStorePaths(scope.run_dir, { plan_sha256: head.record.plan_sha256 });
  const plan = readCanonicalStyleMasterRecord(planPaths.candidate_plan, validateStyleMasterPlanRecord);
  const checked = validateStyleMasterHeadRecord(head.record, { plan: plan.record });
  if (!checked.ok || head.record.run_version !== scope.run_version || head.record.workflow !== scope.workflow) {
    fail("style_master_head_invalid", "Style Master scope head does not bind the requested scope and plan");
  }
  return Object.freeze({ paths, head: head.record, plan: plan.record, head_bytes: head.bytes });
}

function directPlanRecords(scope, current) {
  const paths = styleMasterStorePaths(scope.run_dir, { plan_sha256: current.plan.plan_sha256 });
  const grant = optionalCanonicalRecord(paths.candidate_grant, validateStyleMasterCandidateGrantRecord, { plan: current.plan });
  if (current.plan.generated_candidate_count === 0 && grant !== null) {
    fail("style_master_plan_state_invalid", "zero-generated Style Master plans cannot have a candidate grant");
  }
  const attempts = [];
  for (const candidate of current.plan.candidates.filter((item) => item.kind === "generated")) {
    const candidatePaths = styleMasterStorePaths(scope.run_dir, {
      plan_sha256: current.plan.plan_sha256,
      candidate_id: candidate.candidate_id,
    });
    const attempt = optionalCanonicalRecord(candidatePaths.candidate_attempt, validateStyleMasterCandidateAttemptRecord, {
      plan: current.plan,
      ...(grant ? { grant: grant.record } : {}),
    });
    if (attempt && !grant) {
      fail("style_master_plan_state_invalid", "Style Master candidate attempts require their immutable grant");
    }
    if (attempt) attempts.push(attempt);
  }
  const decision = optionalCanonicalRecord(paths.review_decision, validateStyleMasterReviewDecisionRecord, { plan: current.plan });
  let abandonment = optionalCanonicalRecord(paths.abandonment, validateStyleMasterAbandonmentRecord, {
    head: current.head,
    plan: current.plan,
    ...(grant ? { grant: grant.record } : {}),
  });
  if (abandonment && !grant) {
    fail("style_master_plan_state_invalid", "Style Master abandonment requires an immutable grant");
  }
  if (abandonment) {
    const attempt = attempts.find((item) => item.record.candidate_id === abandonment.record.candidate_id);
    if (!attempt) fail("style_master_plan_state_invalid", "Style Master abandonment must bind one persisted unknown attempt");
    const checked = validateStyleMasterAbandonmentRecord(abandonment.record, {
      head: current.head,
      plan: current.plan,
      grant: grant.record,
      attempt: attempt.record,
    });
    if (!checked.ok) throw new StyleMasterSchemaError(checked.code, checked.message);
    abandonment = Object.freeze({ ...abandonment, ...checked });
  }
  return Object.freeze({ paths, grant, attempts: Object.freeze(attempts), decision, abandonment });
}

function inspectPlanTerminality(scope, current) {
  const records = directPlanRecords(scope, current);
  const abandonedCandidateId = records.abandonment?.record.candidate_id || null;
  const unresolved = records.attempts.some(({ record }) => record.status === "submitted" ||
    (record.status === "unknown" && record.candidate_id !== abandonedCandidateId));
  const failed = records.attempts.some(({ record }) => record.status === "failed");
  let terminalReason = null;
  if (!unresolved && failed) terminalReason = "known_failure";
  if (!unresolved && records.abandonment) terminalReason = "abandoned_unknown";
  if (!unresolved && records.decision?.record.decision === "repair") terminalReason = "repair";
  if (!unresolved && records.decision?.record.decision === "redirect") terminalReason = "redirect";
  if (!unresolved && records.decision?.record.decision === "proceed") {
    const selection = resolveEffectiveStyleMasterSelection(scope.deck_dir, { runDir: scope.run_dir });
    if (selection.ok && selection.record.plan_sha256 === current.plan.plan_sha256 &&
      selection.record.candidate_id === records.decision.record.candidate_id &&
      selection.record.candidate_sha256 === records.decision.record.candidate_sha256) {
      terminalReason = "promoted";
    }
  }
  const counts = { planned: current.plan.generated_candidate_count, claimed: 0, submitted: 0, succeeded: 0, failed: 0, unknown: 0 };
  for (const { record } of records.attempts) counts[record.status] += 1;
  return Object.freeze({
    terminal: terminalReason !== null,
    terminal_reason: terminalReason,
    unresolved_submitted: unresolved,
    progress: Object.freeze({
      generated_candidate_count: counts.planned,
      local_candidate_count: current.plan.candidates[0]?.kind === "local-existing" ? 1 : 0,
      claimed_candidate_count: counts.claimed,
      submitted_candidate_count: counts.submitted,
      succeeded_candidate_count: counts.succeeded,
      failed_candidate_count: counts.failed,
      unknown_candidate_count: counts.unknown,
      remaining_candidate_capacity: Math.max(0, counts.planned - counts.submitted),
    }),
  });
}

function writeStagedPlanBundle(stagingPath, plan, local) {
  writeFileSync(join(stagingPath, "candidate-plan.json"), styleMasterCanonicalBytes(plan), { flag: "wx", mode: 0o600 });
  if (!local) return;
  const candidateRoot = join(stagingPath, "candidates", "local-existing");
  mkdirSync(candidateRoot, { recursive: true, mode: 0o700 });
  const extension = local.candidate.candidate_media_type === "image/png" ? "png" : "jpg";
  writeFileSync(join(candidateRoot, `image.${extension}`), local.bytes, { flag: "wx", mode: 0o600 });
  writeFileSync(join(candidateRoot, "provenance.json"), styleMasterCanonicalBytes(local.provenance), { flag: "wx", mode: 0o600 });
}

function validatePlanBundleStructure(root, expectedPlan, local) {
  const plan = readCanonicalStyleMasterRecord(join(root, "candidate-plan.json"), validateStyleMasterPlanRecord);
  if (!equalBytes(plan.bytes, styleMasterCanonicalBytes(expectedPlan)) || plan.plan_sha256 !== expectedPlan.plan_sha256) {
    fail("style_master_plan_conflict", "candidate plan bytes do not exactly match the planned identity");
  }
  if (!local) return;
  const candidate = expectedPlan.candidates[0];
  const candidateRoot = join(root, "candidates", "local-existing");
  const extension = candidate.candidate_media_type === "image/png" ? "png" : "jpg";
  const imagePath = join(candidateRoot, `image.${extension}`);
  const provenance = readCanonicalStyleMasterRecord(join(candidateRoot, "provenance.json"), validateStyleMasterLocalProvenance);
  const bytes = stableRegularFileBytes(imagePath, "staged local Style Master candidate");
  if (bytes === null || sha256Bytes(bytes) !== candidate.candidate_sha256 || !equalBytes(bytes, local.bytes) ||
    provenance.candidate_provenance_sha256 !== candidate.candidate_provenance_sha256 ||
    provenance.record.candidate_sha256 !== candidate.candidate_sha256 ||
    provenance.record.candidate_media_type !== candidate.candidate_media_type ||
    provenance.record.candidate_width !== candidate.candidate_width || provenance.record.candidate_height !== candidate.candidate_height) {
    fail("style_master_plan_bundle_invalid", "staged local Style Master candidate does not match the planned immutable snapshot");
  }
}

async function validateCompletePlanBundle(root, plan, local) {
  validatePlanBundleStructure(root, plan, local);
  if (!local) return;
  const candidate = plan.candidates[0];
  const extension = candidate.candidate_media_type === "image/png" ? "png" : "jpg";
  const bytes = readFileSync(join(root, "candidates", "local-existing", `image.${extension}`));
  const media = describeSupportedImage(bytes, "staged local Style Master candidate");
  if (media.candidate_media_type !== candidate.candidate_media_type || media.candidate_width !== candidate.candidate_width || media.candidate_height !== candidate.candidate_height) {
    fail("style_master_plan_bundle_invalid", "staged local Style Master candidate media facts changed before publication");
  }
}

function projectedPlanResult(plan, terminality, { published, replay } = {}) {
  return Object.freeze({
    plan,
    plan_sha256: plan.plan_sha256,
    run_version: plan.run_version,
    workflow: plan.workflow,
    published: Boolean(published),
    replay: Boolean(replay),
    max_candidate_submissions: plan.generated_candidate_count,
    progress: terminality.progress,
    terminal: terminality.terminal,
    terminal_reason: terminality.terminal_reason,
    next_action: terminality.terminal
      ? "plan_style_master_successor"
      : plan.generated_candidate_count === 0
        ? "review_style_master_candidates"
        : "authorize_style_master_candidates",
  });
}

function inspectAttemptProjection(attempt) {
  return Object.freeze({
    candidate_id: attempt.record.candidate_id,
    status: attempt.record.status,
    attempt_record_sha256: attempt.attempt_record_sha256,
    provider_request_sha256: attempt.record.provider_request_sha256,
  });
}

function inspectSelectionProjection(scope) {
  const selection = resolveEffectiveStyleMasterSelection(scope.deck_dir, { runDir: scope.run_dir });
  if (!selection.ok) return null;
  return Object.freeze({
    selection: Object.freeze(structuredClone(selection.record)),
    selection_sha256: selection.selection_sha256,
  });
}

async function inspectCurrentStyleMasterPlan(scope, current) {
  const records = directPlanRecords(scope, current);
  const terminality = inspectPlanTerminality(scope, current);
  const inputs = await compilePlanInputs(scope, current.plan.generated_candidate_count);
  const previousSelectionSha256 = currentPreviousSelectionSha256(scope);
  const inputStale = !samePlanInputs(current.plan, inputs, previousSelectionSha256);
  const grantProgress = records.grant
    ? deriveStyleMasterGrantProgress({
      plan: current.plan,
      grant: records.grant.record,
      attempts: records.attempts.map((attempt) => attempt.record),
    })
    : null;
  const generation = records.grant
    ? orderedGenerationTarget(records, records.grant)
    : null;
  const terminal = terminality.terminal || (inputStale && !terminality.unresolved_submitted);
  const terminalReason = terminality.terminal_reason || (terminal ? "canonical_input_drift" : null);
  let nextAction;
  if (terminal) {
    nextAction = "plan_style_master_successor";
  } else if (terminality.unresolved_submitted || generation?.kind === "unknown") {
    nextAction = "abandon_style_master_plan";
  } else if (records.decision?.record.decision === "proceed") {
    nextAction = "accept_style_master_candidates";
  } else if (current.plan.generated_candidate_count === 0) {
    nextAction = "review_style_master_candidates";
  } else if (records.grant === null) {
    nextAction = "authorize_style_master_candidates";
  } else if (generation?.kind === "failed") {
    nextAction = "plan_style_master_successor";
  } else if (generation?.kind === "complete") {
    nextAction = "review_style_master_candidates";
  } else {
    nextAction = "generate_style_master_candidates";
  }
  const selection = inspectSelectionProjection(scope);
  return Object.freeze({
    run_version: current.plan.run_version,
    workflow: current.plan.workflow,
    head: Object.freeze(structuredClone(current.head)),
    plan: Object.freeze(structuredClone(current.plan)),
    plan_sha256: current.plan.plan_sha256,
    candidate_grant_sha256: records.grant?.candidate_grant_sha256 || null,
    grant: records.grant ? Object.freeze(structuredClone(records.grant.record)) : null,
    progress: grantProgress || terminality.progress,
    attempts: Object.freeze(records.attempts.map(inspectAttemptProjection)),
    review_decision: records.decision ? Object.freeze(structuredClone(records.decision.record)) : null,
    review_decision_sha256: records.decision?.review_decision_sha256 || null,
    abandonment: records.abandonment ? Object.freeze(structuredClone(records.abandonment.record)) : null,
    abandonment_sha256: records.abandonment?.abandonment_sha256 || null,
    input_stale: inputStale,
    terminal,
    terminal_reason: terminalReason,
    next_action: nextAction,
    ...(selection || {}),
  });
}

/**
 * Return the owner-issued current lifecycle projection without creating a plan,
 * grant, attempt, review receipt, selection, or compatibility payload. A
 * supplied plan hash is an assertion against the scope head, never a request
 * to expose historical plan state as an actionable projection.
 */
export async function inspectStyleMasterCandidates({
  scope,
  planSha256 = null,
  refreshScope = null,
} = {}) {
  if (planSha256 !== null) assertPlanSha256(planSha256);
  const resolvedScope = await resolveCurrentScope(scope, refreshScope);
  const current = readCurrentHead(resolvedScope);
  if (!current.head) {
    if (planSha256 !== null) {
      fail("style_master_plan_not_current", "Style Master inspect plan hash does not name the current scope head");
    }
    const selection = inspectSelectionProjection(resolvedScope);
    return Object.freeze({
      run_version: resolvedScope.run_version,
      workflow: resolvedScope.workflow,
      head: null,
      plan: null,
      plan_sha256: null,
      candidate_grant_sha256: null,
      grant: null,
      progress: null,
      attempts: Object.freeze([]),
      review_decision: null,
      review_decision_sha256: null,
      abandonment: null,
      abandonment_sha256: null,
      input_stale: false,
      terminal: false,
      terminal_reason: null,
      next_action: "plan_style_master_candidates",
      ...(selection || {}),
    });
  }
  if (planSha256 !== null && current.plan.plan_sha256 !== planSha256) {
    fail("style_master_plan_not_current", "Style Master inspect plan hash does not name the current scope head");
  }
  return inspectCurrentStyleMasterPlan(resolvedScope, current);
}

function assertPlanSha256(value) {
  if (!SHA256_RE.test(value || "")) {
    fail("style_master_plan_hash_invalid", "Style Master operation requires one exact plan SHA-256");
  }
}

async function assertCurrentPlanInputs(scope, current) {
  const inputs = await compilePlanInputs(scope, current.plan.generated_candidate_count);
  const previousSelectionSha256 = currentPreviousSelectionSha256(scope);
  if (!samePlanInputs(current.plan, inputs, previousSelectionSha256)) {
    fail("style_master_plan_stale", "Style Master authorization requires current plan inputs and selection context");
  }
  return Object.freeze({ inputs, previous_selection_sha256: previousSelectionSha256 });
}

async function readCurrentGenerationContext(scope, planSha256, refreshScope) {
  const resolvedScope = await resolveCurrentScope(scope, refreshScope);
  const current = readCurrentHead(resolvedScope);
  if (!current.head) {
    fail("style_master_plan_missing", "Style Master generation requires a current candidate plan");
  }
  if (current.plan.plan_sha256 !== planSha256) {
    fail("style_master_plan_not_current", "Style Master generation requires the exact current scope-head plan");
  }
  if (current.plan.generated_candidate_count === 0) {
    fail("style_master_generate_inapplicable", "zero-generated Style Master plans do not have candidate submissions");
  }
  const inputContext = await assertCurrentPlanInputs(resolvedScope, current);
  const records = directPlanRecords(resolvedScope, current);
  if (!records.grant) {
    fail("style_master_grant_missing", "Style Master generation requires the immutable current candidate grant");
  }
  const grantProgress = deriveStyleMasterGrantProgress({
    plan: current.plan,
    grant: records.grant.record,
    attempts: records.attempts.map((attempt) => attempt.record),
  });
  const terminality = inspectPlanTerminality(resolvedScope, current);
  return Object.freeze({
    scope: resolvedScope,
    current,
    inputs: inputContext.inputs,
    records,
    grant: records.grant,
    grant_progress: grantProgress,
    terminality,
  });
}

function orderedGenerationTarget(records, grant) {
  const attempts = new Map(records.attempts.map((attempt) => [attempt.record.candidate_id, attempt]));
  const candidateIds = grant.record.generated_candidate_ids;
  const laterAttemptExists = (index) => candidateIds.slice(index + 1).some((candidateId) => attempts.has(candidateId));
  for (let index = 0; index < candidateIds.length; index += 1) {
    const candidate_id = candidateIds[index];
    const attempt = attempts.get(candidate_id) || null;
    if (attempt === null) {
      if (laterAttemptExists(index)) {
        fail("style_master_generation_order_invalid", "Style Master generated attempts must be recorded in immutable grant order");
      }
      return Object.freeze({ kind: "pending", candidate_id, attempt: null });
    }
    if (attempt.record.status === "succeeded") continue;
    if (laterAttemptExists(index)) {
      fail("style_master_generation_order_invalid", "Style Master generated attempts must be recorded in immutable grant order");
    }
    if (attempt.record.status === "claimed") return Object.freeze({ kind: "claimed", candidate_id, attempt });
    if (attempt.record.status === "failed") return Object.freeze({ kind: "failed", candidate_id, attempt });
    if (attempt.record.status === "submitted" || attempt.record.status === "unknown") {
      return Object.freeze({ kind: "unknown", candidate_id, attempt });
    }
    fail("style_master_attempt_invalid", "Style Master candidate attempt has an unsupported generation state");
  }
  return Object.freeze({ kind: "complete", candidate_id: null, attempt: null });
}

function generationProjection(context) {
  const target = orderedGenerationTarget(context.records, context.grant);
  const terminalReason = context.terminality.terminal_reason;
  const knownFailure = target.kind === "failed" || terminalReason === "known_failure";
  const next_action = knownFailure
    ? "plan_style_master_successor"
    : target.kind === "unknown"
      ? "abandon_style_master_plan"
      : target.kind === "complete"
        ? "review_style_master_candidates"
        : "generate_style_master_candidates";
  return Object.freeze({
    plan: context.current.plan,
    plan_sha256: context.current.plan.plan_sha256,
    run_version: context.current.plan.run_version,
    workflow: context.current.plan.workflow,
    grant: context.grant.record,
    candidate_grant_sha256: context.grant.candidate_grant_sha256,
    progress: context.grant_progress,
    terminal: knownFailure || context.terminality.terminal,
    terminal_reason: knownFailure ? "known_failure" : terminalReason,
    current_candidate_id: target.candidate_id,
    current_attempt: target.attempt
      ? Object.freeze({
        candidate_id: target.attempt.record.candidate_id,
        status: target.attempt.record.status,
        attempt_record_sha256: target.attempt.attempt_record_sha256,
      })
      : null,
    next_action,
  });
}

function isPlainRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function isKnownTransportFailure(value) {
  if (!isPlainRecord(value)) return false;
  return value.outcome === "known_failure" || value.outcome === "failed" ||
    value.status === "known_failure" || value.status === "failed";
}

function isKnownTransportError(error) {
  return error?.style_master_known_failure === true || error?.known_failure === true;
}

function successfulTransportBytes(value) {
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return Buffer.from(value);
  if (isPlainRecord(value) && (value.outcome === "succeeded" || value.status === "succeeded") &&
    (Buffer.isBuffer(value.bytes) || value.bytes instanceof Uint8Array)) {
    return Buffer.from(value.bytes);
  }
  fail("style_master_attempt_unknown", "Style Master provider returned an unresolved candidate response after submission");
}

function validateGeneratedCandidatePng(value) {
  const bytes = Buffer.from(value);
  let decoded;
  try {
    decoded = decodePng(bytes, { checkCrc: true });
  } catch {
    fail("style_master_provider_media_invalid", "Style Master provider response is not valid PNG media");
  }
  if (!Number.isInteger(decoded.width) || decoded.width <= 0 || !Number.isInteger(decoded.height) || decoded.height <= 0) {
    fail("style_master_provider_media_invalid", "Style Master provider response has invalid PNG dimensions");
  }
  return Object.freeze({
    bytes,
    candidate_sha256: sha256Bytes(bytes),
    candidate_media_type: "image/png",
    candidate_width: decoded.width,
    candidate_height: decoded.height,
  });
}

function terminalAttemptOrFail(scope, current, grant, candidateId, expectedBytes, attempt) {
  try {
    return writeStyleMasterCandidateAttemptCas(scope.run_dir, {
      plan: current.plan,
      grant: grant.record,
      candidate_id: candidateId,
      expected_bytes: expectedBytes,
      attempt,
    });
  } catch (error) {
    if (error?.code === "style_master_attempt_conflict" || error?.code === "style_master_attempt_transition_invalid") {
      fail("style_master_attempt_terminal_conflict", "Style Master candidate terminal publication lost its compare-and-swap");
    }
    throw error;
  }
}

function persistKnownFailedAttempt(context, submitted) {
  const failed = {
    ...submitted.record,
    status: "failed",
  };
  return terminalAttemptOrFail(
    context.scope,
    context.current,
    context.grant,
    submitted.record.candidate_id,
    submitted.bytes,
    failed,
  );
}

function persistSucceededAttempt(context, submitted, transportResult) {
  const candidate = validateGeneratedCandidatePng(successfulTransportBytes(transportResult));
  const provenance = {
    schema: STYLE_MASTER_GENERATED_PROVENANCE_SCHEMA,
    kind: "generated",
    plan_sha256: context.current.plan.plan_sha256,
    candidate_id: submitted.record.candidate_id,
    compiled_prompt_sha256: context.current.plan.compiled_prompt_sha256,
    candidate_generation_profile_sha256: context.current.plan.candidate_generation_profile_sha256,
    provider_request_sha256: submitted.record.provider_request_sha256,
    candidate_sha256: candidate.candidate_sha256,
    candidate_media_type: candidate.candidate_media_type,
    candidate_width: candidate.candidate_width,
    candidate_height: candidate.candidate_height,
  };
  const preliminaryProvenance = validateStyleMasterGeneratedProvenance(provenance, { plan: context.current.plan });
  if (!preliminaryProvenance.ok) throw new StyleMasterSchemaError(preliminaryProvenance.code, preliminaryProvenance.message);
  const succeeded = {
    ...submitted.record,
    status: "succeeded",
    candidate_sha256: candidate.candidate_sha256,
    candidate_provenance_sha256: preliminaryProvenance.candidate_provenance_sha256,
  };
  const checkedAttempt = validateStyleMasterCandidateAttemptRecord(succeeded, {
    plan: context.current.plan,
    grant: context.grant.record,
  });
  if (!checkedAttempt.ok) throw new StyleMasterSchemaError(checkedAttempt.code, checkedAttempt.message);
  const checkedProvenance = validateStyleMasterGeneratedProvenance(provenance, {
    plan: context.current.plan,
    attempt: succeeded,
  });
  if (!checkedProvenance.ok || checkedProvenance.candidate_provenance_sha256 !== succeeded.candidate_provenance_sha256) {
    throw new StyleMasterSchemaError(checkedProvenance?.code || "style_master_provenance_invalid", checkedProvenance?.message || "Style Master generated provenance does not bind the successful attempt");
  }
  const paths = styleMasterStorePaths(context.scope.run_dir, {
    plan_sha256: context.current.plan.plan_sha256,
    candidate_id: submitted.record.candidate_id,
    candidate_media_type: candidate.candidate_media_type,
  });
  placeStyleMasterCandidateImage(context.scope.run_dir, {
    plan_sha256: context.current.plan.plan_sha256,
    candidate_id: submitted.record.candidate_id,
    candidate_media_type: candidate.candidate_media_type,
    bytes: candidate.bytes,
  });
  createOrExactMatchStyleMasterRecord(
    paths.candidate_provenance,
    provenance,
    validateStyleMasterGeneratedProvenance,
    { plan: context.current.plan, attempt: succeeded },
  );
  return terminalAttemptOrFail(
    context.scope,
    context.current,
    context.grant,
    submitted.record.candidate_id,
    submitted.bytes,
    succeeded,
  );
}

function recordedGenerationContext(context) {
  const records = directPlanRecords(context.scope, context.current);
  const grantProgress = deriveStyleMasterGrantProgress({
    plan: context.current.plan,
    grant: context.grant.record,
    attempts: records.attempts.map((attempt) => attempt.record),
  });
  return Object.freeze({
    ...context,
    records,
    grant_progress: grantProgress,
    terminality: inspectPlanTerminality(context.scope, context.current),
  });
}

/**
 * Compile and publish one provider-free current Style Master candidate plan.
 * The caller supplies a selected workflow scope; no prompt, path, provider,
 * profile, slot, or historical-plan override is accepted here.
 */
export async function planStyleMasterCandidates({ scope, candidateCount, refreshScope = null } = {}) {
  let initialScope = await resolveCurrentScope(scope, refreshScope);
  for (let iteration = 0; iteration < MAX_PLAN_CAS_RETRIES; iteration += 1) {
    const inputs = await compilePlanInputs(initialScope, candidateCount);
    const previousSelectionSha256 = currentPreviousSelectionSha256(initialScope);
    const current = readCurrentHead(initialScope);
    let planGeneration = 1;
    let previousPlanSha256 = null;
    if (current.head) {
      const terminality = inspectPlanTerminality(initialScope, current);
      const matches = samePlanInputs(current.plan, inputs, previousSelectionSha256);
      if (matches && !terminality.terminal) {
        return projectedPlanResult(current.plan, terminality, { published: false, replay: true });
      }
      if (!matches && terminality.unresolved_submitted) {
        fail("style_master_plan_blocked", "Style Master canonical input drift cannot replace a plan with an unresolved submitted candidate");
      }
      planGeneration = current.head.plan_generation + 1;
      previousPlanSha256 = current.plan.plan_sha256;
    }
    const plan = createPlanFromInputs(initialScope, inputs, {
      planGeneration,
      previousPlanSha256,
      previousSelectionSha256,
    });
    const staging = createStyleMasterStagingDirectory(initialScope.run_dir);
    let published = null;
    try {
      writeStagedPlanBundle(staging, plan, inputs.local);
      await validateCompletePlanBundle(staging, plan, inputs.local);
      published = publishStyleMasterStagedPlan(initialScope.run_dir, {
        staging_path: staging,
        plan_sha256: plan.plan_sha256,
        validate_bundle: (root) => validatePlanBundleStructure(root, plan, inputs.local),
      });
    } finally {
      if (published === null) cleanupStyleMasterStagingDirectory(initialScope.run_dir, staging);
    }

    const refreshedScope = await resolveCurrentScope(initialScope, refreshScope);
    const recheckedInputs = await compilePlanInputs(refreshedScope, candidateCount);
    const recheckedPreviousSelection = currentPreviousSelectionSha256(refreshedScope);
    if (canonicalJson(planInputProjection(inputs)) !== canonicalJson(planInputProjection(recheckedInputs)) ||
      previousSelectionSha256 !== recheckedPreviousSelection) {
      initialScope = refreshedScope;
      continue;
    }
    const head = createStyleMasterHeadRecord(plan);
    try {
      writeStyleMasterScopeHeadCas(refreshedScope.run_dir, {
        workflow: refreshedScope.workflow,
        head,
        plan,
        expected_bytes: current.head_bytes,
      });
    } catch (error) {
      if (error?.code !== "style_master_head_conflict") throw error;
      initialScope = refreshedScope;
      continue;
    }
    const terminality = inspectPlanTerminality(refreshedScope, Object.freeze({
      ...current,
      head,
      plan,
      head_bytes: styleMasterCanonicalBytes(head),
    }));
    return projectedPlanResult(plan, terminality, { published: published.published, replay: published.replay });
  }
  fail("style_master_head_conflict", "Style Master scope changed repeatedly while attempting plan publication");
}

/**
 * Persist or exact-replay the one immutable candidate-cost grant for a current
 * nonzero Style Master plan. This owner never authorizes page raw work.
 */
export async function authorizeStyleMasterCandidates({ scope, planSha256, refreshScope = null } = {}) {
  assertPlanSha256(planSha256);
  const initialScope = await resolveCurrentScope(scope, refreshScope);
  const current = readCurrentHead(initialScope);
  if (!current.head) {
    fail("style_master_plan_missing", "Style Master authorization requires a current candidate plan");
  }
  if (current.plan.plan_sha256 !== planSha256) {
    fail("style_master_plan_not_current", "Style Master authorization requires the exact current scope-head plan");
  }
  if (current.plan.generated_candidate_count === 0) {
    fail("style_master_grant_inapplicable", "zero-generated Style Master plans do not require candidate authorization");
  }
  await assertCurrentPlanInputs(initialScope, current);
  const terminality = inspectPlanTerminality(initialScope, current);
  if (terminality.terminal || terminality.unresolved_submitted) {
    fail("style_master_plan_not_authorizable", "Style Master authorization requires a current nonterminal plan without an unresolved submission");
  }

  const grant = createStyleMasterCandidateGrantRecord(current.plan);
  const grantPaths = styleMasterStorePaths(initialScope.run_dir, { plan_sha256: current.plan.plan_sha256 });
  const persisted = createOrExactMatchStyleMasterRecord(
    grantPaths.candidate_grant,
    grant,
    validateStyleMasterCandidateGrantRecord,
    { plan: current.plan },
  );

  // A grant created during a lost head/input race remains unreferenced history,
  // never a usable authorization. Recheck before returning it to a caller.
  const refreshedScope = await resolveCurrentScope(initialScope, refreshScope);
  const refreshed = readCurrentHead(refreshedScope);
  if (!refreshed.head || refreshed.plan.plan_sha256 !== planSha256 ||
    refreshed.head.plan_generation !== current.head.plan_generation ||
    !equalBytes(refreshed.head_bytes, current.head_bytes)) {
    fail("style_master_plan_not_current", "Style Master scope head changed while candidate authorization was being recorded");
  }
  await assertCurrentPlanInputs(refreshedScope, refreshed);
  const refreshedTerminality = inspectPlanTerminality(refreshedScope, refreshed);
  if (refreshedTerminality.terminal || refreshedTerminality.unresolved_submitted) {
    fail("style_master_plan_not_authorizable", "Style Master plan changed before candidate authorization could become current");
  }
  return Object.freeze({
    plan: refreshed.plan,
    plan_sha256: refreshed.plan.plan_sha256,
    run_version: refreshed.plan.run_version,
    workflow: refreshed.plan.workflow,
    grant: persisted.record,
    candidate_grant_sha256: persisted.candidate_grant_sha256,
    created: persisted.created,
    replay: persisted.replay,
    max_candidate_submissions: persisted.record.max_submissions,
  });
}

/**
 * Submit the generated slots of one exact current Style Master plan in grant
 * order. `initialize` is deliberately after durable claim but before the
 * submitted CAS, so unavailable credentials remain a resumable pre-submit
 * claim rather than a consumed unknown outcome.
 */
export async function generateStyleMasterCandidates({
  scope,
  planSha256,
  submit,
  initialize = null,
  refreshScope = null,
} = {}) {
  assertPlanSha256(planSha256);
  if (initialize !== null && typeof initialize !== "function") {
    fail("style_master_transport_invalid", "Style Master provider initialization must be a function when supplied");
  }
  let currentScope = await resolveCurrentScope(scope, refreshScope);
  for (let iteration = 0; iteration < MAX_GENERATION_CAS_RETRIES; iteration += 1) {
    const context = await readCurrentGenerationContext(currentScope, planSha256, refreshScope);
    currentScope = context.scope;
    const initialProjection = generationProjection(context);
    const initialTarget = orderedGenerationTarget(context.records, context.grant);
    if (initialProjection.terminal) {
      if (initialProjection.terminal_reason === "known_failure") return initialProjection;
      fail("style_master_plan_not_generatable", "Style Master generation requires a current nonterminal candidate plan");
    }
    if (initialTarget.kind === "unknown") {
      fail("style_master_attempt_unknown", "Style Master has an unresolved submitted candidate; abandon the exact plan before further generation");
    }
    if (initialTarget.kind === "complete") return initialProjection;

    let claimed = initialTarget.attempt;
    if (initialTarget.kind === "pending") {
      const claim = createStyleMasterCandidateAttemptRecord({
        run_version: context.current.plan.run_version,
        workflow: context.current.plan.workflow,
        plan_sha256: context.current.plan.plan_sha256,
        candidate_id: initialTarget.candidate_id,
        candidate_grant_sha256: context.grant.candidate_grant_sha256,
      });
      try {
        const persisted = writeStyleMasterCandidateAttemptCas(context.scope.run_dir, {
          plan: context.current.plan,
          grant: context.grant.record,
          candidate_id: initialTarget.candidate_id,
          expected_bytes: null,
          attempt: claim,
        });
        claimed = Object.freeze({ record: persisted.record, bytes: persisted.bytes, attempt_record_sha256: persisted.attempt_record_sha256 });
      } catch (error) {
        if (error?.code === "style_master_attempt_conflict") continue;
        throw error;
      }
    }

    // No credential or provider setup occurs before the absence -> claimed CAS.
    const transport = initialize === null
      ? undefined
      : await initialize(Object.freeze({
        run_dir: context.scope.run_dir,
        plan_sha256: context.current.plan.plan_sha256,
        candidate_id: claimed.record.candidate_id,
        candidate_generation_profile: STYLE_MASTER_GENERATION_PROFILE,
      }));

    // Initialization may take time. Rebuild every exact pre-submit fact and
    // resume only this same persisted claim before recording a submission.
    const beforeSubmit = await readCurrentGenerationContext(context.scope, planSha256, refreshScope);
    const beforeSubmitProjection = generationProjection(beforeSubmit);
    if (beforeSubmitProjection.terminal) {
      if (beforeSubmitProjection.terminal_reason === "known_failure") return beforeSubmitProjection;
      fail("style_master_plan_not_generatable", "Style Master candidate plan became terminal before provider submission");
    }
    const target = orderedGenerationTarget(beforeSubmit.records, beforeSubmit.grant);
    if (target.kind !== "claimed" || target.candidate_id !== claimed.record.candidate_id ||
      !equalBytes(target.attempt?.bytes, claimed.bytes)) {
      currentScope = beforeSubmit.scope;
      continue;
    }
    if (typeof submit !== "function") {
      fail("style_master_provider_submit_required", "Style Master provider submission requires the existing Image2 transport owner");
    }
    const providerRequest = createStyleMasterProviderRequestRecord({
      plan_sha256: beforeSubmit.current.plan.plan_sha256,
      candidate_id: target.candidate_id,
      compiled_prompt_sha256: beforeSubmit.current.plan.compiled_prompt_sha256,
      candidate_generation_profile_sha256: beforeSubmit.current.plan.candidate_generation_profile_sha256,
    });
    const checkedRequest = validateStyleMasterProviderRequestRecord(providerRequest, {
      plan: beforeSubmit.current.plan,
      candidateId: target.candidate_id,
    });
    if (!checkedRequest.ok) throw new StyleMasterSchemaError(checkedRequest.code, checkedRequest.message);
    const submittedRecord = {
      ...target.attempt.record,
      status: "submitted",
      provider_request_sha256: checkedRequest.provider_request_sha256,
    };
    let submitted;
    try {
      const persisted = writeStyleMasterCandidateAttemptCas(beforeSubmit.scope.run_dir, {
        plan: beforeSubmit.current.plan,
        grant: beforeSubmit.grant.record,
        candidate_id: target.candidate_id,
        expected_bytes: target.attempt.bytes,
        attempt: submittedRecord,
      });
      submitted = Object.freeze({ record: persisted.record, bytes: persisted.bytes, attempt_record_sha256: persisted.attempt_record_sha256 });
    } catch (error) {
      if (error?.code === "style_master_attempt_conflict" || error?.code === "style_master_attempt_transition_invalid") {
        currentScope = beforeSubmit.scope;
        continue;
      }
      throw error;
    }

    let transportResult;
    try {
      transportResult = await submit(Object.freeze({
        plan: beforeSubmit.current.plan,
        candidate_id: target.candidate_id,
        provider_request: providerRequest,
        provider_request_sha256: checkedRequest.provider_request_sha256,
        compiled_prompt_bytes: Buffer.from(beforeSubmit.inputs.compiled_prompt_bytes),
        candidate_generation_profile: STYLE_MASTER_GENERATION_PROFILE,
        transport,
      }));
    } catch (error) {
      if (!isKnownTransportError(error)) {
        fail("style_master_attempt_unknown", "Style Master provider submission was interrupted after its request was recorded");
      }
      persistKnownFailedAttempt(beforeSubmit, submitted);
      return generationProjection(recordedGenerationContext(beforeSubmit));
    }

    if (isKnownTransportFailure(transportResult)) {
      persistKnownFailedAttempt(beforeSubmit, submitted);
      return generationProjection(recordedGenerationContext(beforeSubmit));
    }

    try {
      persistSucceededAttempt(beforeSubmit, submitted, transportResult);
    } catch (error) {
      if (error?.code !== "style_master_provider_media_invalid") throw error;
      persistKnownFailedAttempt(beforeSubmit, submitted);
      return generationProjection(recordedGenerationContext(beforeSubmit));
    }
    // Progress is recomputed from the grant-bound persisted attempts before
    // this invocation may advance to another generated slot.
    const progressed = recordedGenerationContext(beforeSubmit);
    const projection = generationProjection(progressed);
    const nextTarget = orderedGenerationTarget(progressed.records, progressed.grant);
    if (projection.terminal) {
      if (projection.terminal_reason === "known_failure") return projection;
      fail("style_master_plan_not_generatable", "Style Master candidate plan became terminal during generation");
    }
    if (nextTarget.kind === "unknown") {
      fail("style_master_attempt_unknown", "Style Master has an unresolved submitted candidate; abandon the exact plan before further generation");
    }
    if (nextTarget.kind === "complete") return projection;
    currentScope = progressed.scope;
  }
  fail("style_master_attempt_conflict", "Style Master candidate attempt changed repeatedly while generation was being serialized");
}

function abandonmentProjection({ plan, grant, records, abandonment }, { replay }) {
  const attempt = records.attempts.find((item) => item.record.candidate_id === abandonment.record.candidate_id);
  if (!attempt) fail("style_master_abandonment_invalid", "Style Master abandonment must bind one persisted unknown candidate attempt");
  const progress = deriveStyleMasterGrantProgress({
    plan,
    grant: grant.record,
    attempts: records.attempts.map((item) => item.record),
  });
  return Object.freeze({
    plan,
    plan_sha256: plan.plan_sha256,
    run_version: plan.run_version,
    workflow: plan.workflow,
    candidate_grant_sha256: grant.candidate_grant_sha256,
    candidate_id: abandonment.record.candidate_id,
    provider_request_sha256: attempt.record.provider_request_sha256,
    unknown_attempt_sha256: attempt.attempt_record_sha256,
    abandonment: abandonment.record,
    abandonment_sha256: abandonment.abandonment_sha256,
    replay: Boolean(replay),
    progress,
    next_action: "plan_style_master_successor",
  });
}

function readStyleMasterAbandonmentReplay(scope, planSha256, reason) {
  const paths = styleMasterStorePaths(scope.run_dir, { plan_sha256: planSha256 });
  const rawAbandonment = optionalCanonicalRecord(paths.abandonment, validateStyleMasterAbandonmentRecord);
  if (rawAbandonment === null) return null;
  const plan = readCanonicalStyleMasterRecord(paths.candidate_plan, validateStyleMasterPlanRecord);
  if (plan.record.plan_sha256 !== planSha256 || plan.record.run_version !== scope.run_version || plan.record.workflow !== scope.workflow) {
    fail("style_master_abandonment_invalid", "Style Master abandonment does not bind the requested plan scope");
  }
  const grant = readCanonicalStyleMasterRecord(paths.candidate_grant, validateStyleMasterCandidateGrantRecord, { plan: plan.record });
  const head = createStyleMasterHeadRecord(plan.record);
  const candidatePaths = styleMasterStorePaths(scope.run_dir, {
    plan_sha256: planSha256,
    candidate_id: rawAbandonment.record.candidate_id,
  });
  const attempt = readCanonicalStyleMasterRecord(candidatePaths.candidate_attempt, validateStyleMasterCandidateAttemptRecord, {
    plan: plan.record,
    grant: grant.record,
  });
  const checkedAbandonment = validateStyleMasterAbandonmentRecord(rawAbandonment.record, {
    head,
    plan: plan.record,
    grant: grant.record,
    attempt: attempt.record,
  });
  if (!checkedAbandonment.ok) throw new StyleMasterSchemaError(checkedAbandonment.code, checkedAbandonment.message);
  if (rawAbandonment.record.reason !== reason || rawAbandonment.record.reason_sha256 !== styleMasterReasonSha256(reason)) {
    fail("style_master_abandonment_conflict", "Style Master abandonment already exists with a different normalized reason");
  }
  const records = directPlanRecords(scope, Object.freeze({ plan: plan.record, head }));
  const abandonment = Object.freeze({ ...rawAbandonment, ...checkedAbandonment });
  return Object.freeze({ plan: plan.record, grant, records, abandonment });
}

async function readCurrentAbandonmentContext(scope, planSha256, refreshScope) {
  const resolvedScope = await resolveCurrentScope(scope, refreshScope);
  const current = readCurrentHead(resolvedScope);
  if (!current.head) {
    fail("style_master_plan_missing", "Style Master abandonment requires a current candidate plan");
  }
  if (current.plan.plan_sha256 !== planSha256) {
    fail("style_master_plan_not_current", "Style Master abandonment requires the exact current scope-head plan");
  }
  const records = directPlanRecords(resolvedScope, current);
  if (!records.grant) {
    fail("style_master_abandonment_inapplicable", "Style Master abandonment requires one generated candidate grant");
  }
  const checkedHead = validateStyleMasterHeadRecord(current.head, { plan: current.plan });
  if (!checkedHead.ok) throw new StyleMasterSchemaError(checkedHead.code, checkedHead.message);
  return Object.freeze({
    scope: resolvedScope,
    current,
    records,
    grant: records.grant,
    head_sha256: checkedHead.head_sha256,
  });
}

function abandonmentTarget(records, reasonSha256) {
  const unresolved = records.attempts.filter(({ record }) => record.status === "submitted" || record.status === "unknown");
  if (unresolved.length === 0) {
    fail("style_master_abandonment_inapplicable", "Style Master abandonment requires one unresolved submitted candidate attempt");
  }
  if (unresolved.length !== 1) {
    fail("style_master_abandonment_ambiguous", "Style Master abandonment requires exactly one unresolved candidate attempt");
  }
  const target = unresolved[0];
  if (target.record.status === "unknown" && target.record.reason_sha256 !== null && target.record.reason_sha256 !== reasonSha256) {
    fail("style_master_abandonment_conflict", "Style Master unknown attempt is already bound to a different abandonment reason");
  }
  return target;
}

function writeAbandonmentUnknownAttempt(context, target, reasonSha256) {
  if (target.record.status === "unknown") return target;
  const unknown = {
    ...target.record,
    status: "unknown",
    reason_sha256: reasonSha256,
  };
  const persisted = writeStyleMasterCandidateAttemptCas(context.scope.run_dir, {
    plan: context.current.plan,
    grant: context.grant.record,
    candidate_id: target.record.candidate_id,
    expected_bytes: target.bytes,
    attempt: unknown,
  });
  return Object.freeze({ record: persisted.record, bytes: persisted.bytes, attempt_record_sha256: persisted.attempt_record_sha256 });
}

function createStyleMasterAbandonment(context, attempt, reason, reasonSha256) {
  const record = {
    schema: STYLE_MASTER_CANDIDATE_ABANDONMENT_SCHEMA,
    run_version: context.current.plan.run_version,
    workflow: context.current.plan.workflow,
    scope_head_sha256: context.head_sha256,
    plan_sha256: context.current.plan.plan_sha256,
    candidate_grant_sha256: context.grant.candidate_grant_sha256,
    candidate_id: attempt.record.candidate_id,
    unknown_attempt_sha256: attempt.attempt_record_sha256,
    provider_request_sha256: attempt.record.provider_request_sha256,
    reason,
    reason_sha256: reasonSha256,
  };
  const checked = validateStyleMasterAbandonmentRecord(record, {
    head: context.current.head,
    plan: context.current.plan,
    grant: context.grant.record,
    attempt: attempt.record,
  });
  if (!checked.ok) throw new StyleMasterSchemaError(checked.code, checked.message);
  const persisted = createOrExactMatchStyleMasterRecord(
    context.records.paths.abandonment,
    record,
    validateStyleMasterAbandonmentRecord,
    {
      head: context.current.head,
      plan: context.current.plan,
      grant: context.grant.record,
      attempt: attempt.record,
    },
  );
  return Object.freeze({ ...persisted, abandonment_sha256: checked.abandonment_sha256 });
}

/**
 * Preserve the one uncertain submitted request with a normalized human reason.
 * This never recontacts the provider and an exact existing record remains
 * replayable after a terminal plan receives its successor head.
 */
export async function abandonStyleMasterCandidates({ scope, planSha256, reason, refreshScope = null } = {}) {
  assertPlanSha256(planSha256);
  const normalizedReason = normalizeStyleMasterAbandonmentReason(reason);
  const reasonSha256 = styleMasterReasonSha256(normalizedReason);
  let currentScope = await resolveCurrentScope(scope, refreshScope);
  for (let iteration = 0; iteration < MAX_GENERATION_CAS_RETRIES; iteration += 1) {
    const replay = readStyleMasterAbandonmentReplay(currentScope, planSha256, normalizedReason);
    if (replay) return abandonmentProjection(replay, { replay: true });

    const context = await readCurrentAbandonmentContext(currentScope, planSha256, refreshScope);
    currentScope = context.scope;
    const target = abandonmentTarget(context.records, reasonSha256);
    if (target.record.status === "submitted") {
      try {
        writeAbandonmentUnknownAttempt(context, target, reasonSha256);
      } catch (error) {
        if (error?.code === "style_master_attempt_conflict" || error?.code === "style_master_attempt_transition_invalid") {
          continue;
        }
        throw error;
      }
    }

    // Read the winning terminal attempt before binding it into the immutable
    // record. A same-reason crash recovery reaches this branch with unknown.
    const after = await readCurrentAbandonmentContext(context.scope, planSha256, refreshScope);
    if (after.records.abandonment) {
      currentScope = after.scope;
      continue;
    }
    const unknown = abandonmentTarget(after.records, reasonSha256);
    if (unknown.record.status !== "unknown") {
      currentScope = after.scope;
      continue;
    }
    const persisted = createStyleMasterAbandonment(after, unknown, normalizedReason, reasonSha256);
    const recorded = directPlanRecords(after.scope, after.current);
    const abandonment = Object.freeze({
      record: persisted.record,
      abandonment_sha256: persisted.abandonment_sha256,
    });
    return abandonmentProjection(Object.freeze({
      plan: after.current.plan,
      grant: after.grant,
      records: recorded,
      abandonment,
    }), { replay: persisted.replay });
  }
  fail("style_master_abandonment_conflict", "Style Master abandonment changed repeatedly while its terminal attempt was being resolved");
}

function readImmutableReviewCandidateBytes(scope, path, label) {
  assertInside(scope.deck_dir, path, label);
  const bytes = stableRegularFileBytes(path, label);
  if (bytes === null) fail("style_master_review_evidence_missing", `${label} is missing from immutable candidate history`);
  assertPhysicallyInside(scope.deck_dir, path, label);
  return bytes;
}

function validateReviewGeneratedPng(bytes) {
  let decoded;
  try {
    decoded = decodePng(bytes, { checkCrc: true });
  } catch {
    fail("style_master_review_evidence_invalid", "generated Style Master candidate bytes are not a valid PNG");
  }
  if (!Number.isInteger(decoded.width) || decoded.width <= 0 || !Number.isInteger(decoded.height) || decoded.height <= 0) {
    fail("style_master_review_evidence_invalid", "generated Style Master candidate bytes do not have positive dimensions");
  }
  return Object.freeze({
    candidate_media_type: "image/png",
    candidate_width: decoded.width,
    candidate_height: decoded.height,
  });
}

async function readCurrentReviewContext(scope, planSha256, refreshScope) {
  const resolvedScope = await resolveCurrentScope(scope, refreshScope);
  const current = readCurrentHead(resolvedScope);
  if (!current.head) fail("style_master_plan_missing", "Style Master review requires a current candidate plan");
  if (current.plan.plan_sha256 !== planSha256) {
    fail("style_master_plan_not_current", "Style Master review requires the exact current scope-head plan");
  }
  await assertCurrentPlanInputs(resolvedScope, current);
  const records = directPlanRecords(resolvedScope, current);
  if (current.plan.generated_candidate_count > 0 && !records.grant) {
    fail("style_master_review_evidence_missing", "generated Style Master review requires the immutable candidate grant");
  }
  if (records.abandonment) {
    fail("style_master_review_ineligible", "an abandoned Style Master plan cannot enter candidate review");
  }
  return Object.freeze({ scope: resolvedScope, current, records, grant: records.grant });
}

function reviewCandidateLocator(scope, path) {
  const locator = relative(scope.deck_dir, path).split(sep).join("/");
  if (!locator || locator === ".." || locator.startsWith("../")) {
    fail("style_master_review_evidence_invalid", "Style Master review candidate bytes are outside the canonical run scope");
  }
  return locator;
}

function reviewLocalCandidate(context, candidate) {
  const paths = styleMasterStorePaths(context.scope.run_dir, {
    plan_sha256: context.current.plan.plan_sha256,
    candidate_id: candidate.candidate_id,
    candidate_media_type: candidate.candidate_media_type,
  });
  const unexpectedAttempt = optionalCanonicalRecord(paths.candidate_attempt, validateStyleMasterCandidateAttemptRecord, {
    plan: context.current.plan,
  });
  if (unexpectedAttempt) {
    fail("style_master_review_evidence_invalid", "local-existing Style Master candidates cannot carry a generated attempt record");
  }
  const provenance = readCanonicalStyleMasterRecord(paths.candidate_provenance, validateStyleMasterLocalProvenance);
  const bytes = readImmutableReviewCandidateBytes(context.scope, paths.candidate_image, "local-existing Style Master candidate");
  const media = describeSupportedImage(bytes, "local-existing Style Master candidate");
  if (sha256Bytes(bytes) !== candidate.candidate_sha256 || provenance.candidate_provenance_sha256 !== candidate.candidate_provenance_sha256 ||
    provenance.record.candidate_sha256 !== candidate.candidate_sha256 || provenance.record.candidate_media_type !== candidate.candidate_media_type ||
    provenance.record.candidate_width !== candidate.candidate_width || provenance.record.candidate_height !== candidate.candidate_height ||
    media.candidate_media_type !== candidate.candidate_media_type || media.candidate_width !== candidate.candidate_width || media.candidate_height !== candidate.candidate_height) {
    fail("style_master_review_evidence_invalid", "local-existing Style Master candidate does not match its immutable plan snapshot");
  }
  return Object.freeze({
    candidate_id: candidate.candidate_id,
    kind: candidate.kind,
    candidate_sha256: candidate.candidate_sha256,
    candidate_provenance_sha256: candidate.candidate_provenance_sha256,
    candidate_media_type: candidate.candidate_media_type,
    candidate_width: candidate.candidate_width,
    candidate_height: candidate.candidate_height,
    candidate_path: reviewCandidateLocator(context.scope, paths.candidate_image),
    bytes: Buffer.from(bytes),
  });
}

function reviewGeneratedCandidate(context, candidate) {
  const attempt = context.records.attempts.find((item) => item.record.candidate_id === candidate.candidate_id);
  if (!attempt || attempt.record.status !== "succeeded") {
    fail("style_master_review_ineligible", "every generated Style Master candidate must have one succeeded grant-bound attempt before review");
  }
  const providerRequest = createStyleMasterProviderRequestRecord({
    plan_sha256: context.current.plan.plan_sha256,
    candidate_id: candidate.candidate_id,
    compiled_prompt_sha256: context.current.plan.compiled_prompt_sha256,
    candidate_generation_profile_sha256: context.current.plan.candidate_generation_profile_sha256,
  });
  const checkedRequest = validateStyleMasterProviderRequestRecord(providerRequest, {
    plan: context.current.plan,
    candidateId: candidate.candidate_id,
  });
  if (!checkedRequest.ok || attempt.record.provider_request_sha256 !== checkedRequest.provider_request_sha256) {
    fail("style_master_review_evidence_invalid", "generated Style Master attempt does not retain its exact submitted provider request digest");
  }
  const paths = styleMasterStorePaths(context.scope.run_dir, {
    plan_sha256: context.current.plan.plan_sha256,
    candidate_id: candidate.candidate_id,
    candidate_media_type: "image/png",
  });
  const bytes = readImmutableReviewCandidateBytes(context.scope, paths.candidate_image, "generated Style Master candidate");
  const media = validateReviewGeneratedPng(bytes);
  const provenance = readCanonicalStyleMasterRecord(paths.candidate_provenance, validateStyleMasterGeneratedProvenance, {
    plan: context.current.plan,
    attempt: attempt.record,
  });
  if (sha256Bytes(bytes) !== attempt.record.candidate_sha256 || provenance.candidate_provenance_sha256 !== attempt.record.candidate_provenance_sha256 ||
    provenance.record.provider_request_sha256 !== attempt.record.provider_request_sha256 || provenance.record.candidate_sha256 !== attempt.record.candidate_sha256 ||
    provenance.record.candidate_media_type !== media.candidate_media_type || provenance.record.candidate_width !== media.candidate_width ||
    provenance.record.candidate_height !== media.candidate_height) {
    fail("style_master_review_evidence_invalid", "generated Style Master candidate bytes or provenance do not match its succeeded attempt");
  }
  return Object.freeze({
    candidate_id: candidate.candidate_id,
    kind: candidate.kind,
    candidate_sha256: attempt.record.candidate_sha256,
    candidate_provenance_sha256: attempt.record.candidate_provenance_sha256,
    candidate_media_type: media.candidate_media_type,
    candidate_width: media.candidate_width,
    candidate_height: media.candidate_height,
    candidate_path: reviewCandidateLocator(context.scope, paths.candidate_image),
    bytes: Buffer.from(bytes),
  });
}

/**
 * Revalidate and return exact current candidate bytes for review or a later
 * accept operation. It writes no review receipt and never treats preplaced
 * image files as authority without their full direct-record chain.
 */
async function validateStyleMasterCandidateReviewForAction({
  scope,
  planSha256,
  refreshScope = null,
} = {}, { allowExistingDecision = false } = {}) {
  assertPlanSha256(planSha256);
  const context = await readCurrentReviewContext(scope, planSha256, refreshScope);
  if (context.records.decision && !allowExistingDecision) {
    fail("style_master_review_ineligible", "a Style Master plan with a recorded decision cannot create another review projection");
  }
  const candidates = context.current.plan.candidates.map((candidate) => (
    candidate.kind === "local-existing"
      ? reviewLocalCandidate(context, candidate)
      : reviewGeneratedCandidate(context, candidate)
  ));
  return Object.freeze({
    plan: context.current.plan,
    plan_sha256: context.current.plan.plan_sha256,
    run_version: context.current.plan.run_version,
    workflow: context.current.plan.workflow,
    candidate_grant_sha256: context.grant?.candidate_grant_sha256 || null,
    candidates: Object.freeze(candidates),
    next_action: "accept_style_master_candidates",
  });
}

/** Revalidate exact current candidate bytes without creating a review receipt. */
export async function validateStyleMasterCandidateReview(options = {}) {
  return validateStyleMasterCandidateReviewForAction(options);
}

/** Provider-free public review preparation over the exact current plan hash. */
export async function prepareStyleMasterCandidateReview(options = {}) {
  return validateStyleMasterCandidateReviewForAction(options);
}

/**
 * Serialize a real-byte review as immutable candidate locators and identity
 * facts. The owner retains validated bytes for promotion instead of pushing
 * image buffers through the bounded public CLI transaction.
 */
export function projectStyleMasterCandidateReview(review) {
  if (!review || typeof review !== "object" || !Array.isArray(review.candidates)) {
    fail("style_master_review_projection_invalid", "Style Master review projection requires owner-validated candidates");
  }
  return Object.freeze({
    plan: Object.freeze(structuredClone(review.plan)),
    plan_sha256: review.plan_sha256,
    run_version: review.run_version,
    workflow: review.workflow,
    candidate_grant_sha256: review.candidate_grant_sha256,
    candidates: Object.freeze(review.candidates.map(({ bytes, ...candidate }) => Object.freeze(structuredClone(candidate)))),
    next_action: review.next_action,
  });
}

function normalizedReviewDecision(decision, candidateId) {
  if (!STYLE_MASTER_REVIEW_DECISIONS.includes(decision)) {
    fail("style_master_decision_invalid", "Style Master acceptance requires proceed, repair, or redirect");
  }
  const normalizedCandidateId = candidateId ?? null;
  if (decision === "proceed") {
    if (typeof normalizedCandidateId !== "string" || !normalizedCandidateId) {
      fail("style_master_decision_invalid", "Style Master proceed requires one reviewed candidate ID");
    }
  } else if (normalizedCandidateId !== null) {
    fail("style_master_decision_invalid", "Style Master repair and redirect cannot select a candidate");
  }
  return Object.freeze({ decision, candidate_id: normalizedCandidateId });
}

function reviewDecisionRecord(plan, { decision, candidate = null } = {}) {
  const record = {
    schema: STYLE_MASTER_REVIEW_DECISION_SCHEMA,
    run_version: plan.run_version,
    workflow: plan.workflow,
    plan_sha256: plan.plan_sha256,
    decision,
    candidate_id: candidate ? candidate.candidate_id : null,
    candidate_sha256: candidate ? candidate.candidate_sha256 : null,
    previous_selection_sha256: plan.previous_selection_sha256,
  };
  const checked = validateStyleMasterReviewDecisionRecord(record, { plan });
  if (!checked.ok) fail(checked.code, checked.message);
  return Object.freeze({ record: Object.freeze(record), review_decision_sha256: checked.review_decision_sha256 });
}

function acceptedSelectionRecord(plan, decision, candidate, acceptedAt) {
  const record = {
    schema: STYLE_MASTER_SELECTION_SCHEMA,
    run_version: plan.run_version,
    workflow: plan.workflow,
    plan_sha256: plan.plan_sha256,
    candidate_id: candidate.candidate_id,
    candidate_sha256: candidate.candidate_sha256,
    candidate_media_type: candidate.candidate_media_type,
    candidate_width: candidate.candidate_width,
    candidate_height: candidate.candidate_height,
    candidate_provenance_sha256: candidate.candidate_provenance_sha256,
    style_intent_sha256: plan.style_intent_sha256,
    style_context_sha256: plan.style_context_sha256,
    candidate_generation_profile_sha256: plan.candidate_generation_profile_sha256,
    previous_selection_sha256: plan.previous_selection_sha256,
    review_decision_sha256: decision.review_decision_sha256,
    accepted_at: acceptedAt,
  };
  const checked = validateStyleMasterSelectionRecord(record, { plan, decision: decision.record });
  if (!checked.ok) fail(checked.code, checked.message);
  return Object.freeze({ record: Object.freeze(record), selection_sha256: checked.selection_sha256 });
}

function reviewedCandidateById(review, candidateId) {
  const candidate = review.candidates.find((item) => item.candidate_id === candidateId);
  if (!candidate) {
    fail("style_master_review_ineligible", "Style Master proceed candidate is not eligible in the exact current review");
  }
  return candidate;
}

function exactPlanForSelectionReplay(scope, planSha256) {
  const paths = styleMasterStorePaths(scope.run_dir, { plan_sha256: planSha256 });
  let plan;
  try {
    plan = readCanonicalStyleMasterRecord(paths.candidate_plan, validateStyleMasterPlanRecord).record;
  } catch (error) {
    fail("style_master_selection_invalid", `selected Style Master plan cannot be reread: ${error?.message || "missing plan"}`);
  }
  if (plan.plan_sha256 !== planSha256 || plan.run_version !== scope.run_version || plan.workflow !== scope.workflow) {
    fail("style_master_selection_invalid", "selected Style Master plan does not match the requested scope");
  }
  return Object.freeze({ paths, plan });
}

function reviewedHistoricalSelectionCandidate(scope, plan, selection) {
  const candidate = plan.candidates.find((item) => item.candidate_id === selection.candidate_id);
  if (!candidate) fail("style_master_selection_invalid", "selection names a candidate outside its immutable plan");

  let reviewed;
  if (candidate.kind === "local-existing") {
    reviewed = reviewLocalCandidate(Object.freeze({
      scope,
      current: Object.freeze({ plan }),
    }), candidate);
  } else {
    const paths = styleMasterStorePaths(scope.run_dir, { plan_sha256: plan.plan_sha256 });
    let grant;
    let attempt;
    try {
      grant = readCanonicalStyleMasterRecord(paths.candidate_grant, validateStyleMasterCandidateGrantRecord, { plan }).record;
      const candidatePaths = styleMasterStorePaths(scope.run_dir, {
        plan_sha256: plan.plan_sha256,
        candidate_id: candidate.candidate_id,
      });
      attempt = readCanonicalStyleMasterRecord(candidatePaths.candidate_attempt, validateStyleMasterCandidateAttemptRecord, {
        plan,
        grant,
      });
    } catch (error) {
      fail("style_master_selection_invalid", `selected generated candidate cannot be reread: ${error?.message || "missing evidence"}`);
    }
    reviewed = reviewGeneratedCandidate(Object.freeze({
      scope,
      current: Object.freeze({ plan }),
      records: Object.freeze({ attempts: Object.freeze([attempt]) }),
    }), candidate);
  }

  if (reviewed.candidate_sha256 !== selection.candidate_sha256 ||
    reviewed.candidate_provenance_sha256 !== selection.candidate_provenance_sha256 ||
    reviewed.candidate_media_type !== selection.candidate_media_type ||
    reviewed.candidate_width !== selection.candidate_width ||
    reviewed.candidate_height !== selection.candidate_height) {
    fail("style_master_selection_invalid", "selection no longer matches its immutable candidate bytes");
  }
  return reviewed;
}

/**
 * The historical exception is deliberately narrow: once the state record has
 * won, only the exact plan/decision/candidate it names can rebuild its derived
 * JPEG. It never turns an arbitrary historical plan back into a review action.
 */
function exactAcceptedSelectionReplay(scope, { planSha256, decision, candidateId }) {
  const effective = resolveEffectiveStyleMasterSelection(scope.deck_dir, { runDir: scope.run_dir });
  if (!effective.ok || effective.record.plan_sha256 !== planSha256) return null;
  if (decision !== "proceed" || effective.record.candidate_id !== candidateId) {
    fail("style_master_selection_conflict", "current effective Style Master selection has a different acceptance binding");
  }

  const { paths, plan } = exactPlanForSelectionReplay(scope, planSha256);
  let persistedDecision;
  try {
    persistedDecision = readCanonicalStyleMasterRecord(paths.review_decision, validateStyleMasterReviewDecisionRecord, { plan });
  } catch (error) {
    fail("style_master_selection_invalid", `selected Style Master decision cannot be reread: ${error?.message || "missing decision"}`);
  }
  if (persistedDecision.record.decision !== "proceed" || persistedDecision.record.candidate_id !== candidateId ||
    persistedDecision.record.candidate_sha256 !== effective.record.candidate_sha256) {
    fail("style_master_selection_conflict", "current effective Style Master selection has a different decision binding");
  }
  const checkedSelection = validateStyleMasterSelectionRecord(effective.record, {
    plan,
    decision: persistedDecision.record,
  });
  if (!checkedSelection.ok || checkedSelection.selection_sha256 !== effective.selection_sha256) {
    fail("style_master_selection_invalid", checkedSelection.message || "selected Style Master record is invalid");
  }
  const candidate = reviewedHistoricalSelectionCandidate(scope, plan, effective.record);
  return Object.freeze({
    plan,
    candidate,
    decision: persistedDecision.record,
    review_decision_sha256: persistedDecision.review_decision_sha256,
    selection: effective.record,
    selection_sha256: effective.selection_sha256,
  });
}

function compatibilityProjectionTarget(scope) {
  const target = resolve(styleAsset(scope.run_dir, STYLE_MASTER_IMAGE));
  assertInside(scope.deck_dir, target, "Style Master compatibility projection");
  const parent = dirname(target);
  let parentStats;
  try {
    parentStats = lstatSync(parent);
  } catch {
    fail("style_master_compatibility_projection_failed", "Style Master compatibility projection directory is unavailable");
  }
  if (!parentStats.isDirectory() || parentStats.isSymbolicLink()) {
    fail("style_master_compatibility_projection_failed", "Style Master compatibility projection directory is invalid");
  }
  assertPhysicallyInside(scope.deck_dir, parent, "Style Master compatibility projection directory");
  if (existsSync(target)) {
    const targetStats = lstatSync(target);
    if (!targetStats.isFile() || targetStats.isSymbolicLink()) {
      fail("style_master_compatibility_projection_failed", "Style Master compatibility projection target is not a regular file");
    }
  }
  return target;
}

function assertUnchangedCompatibilityProjectionTarget(scope, target) {
  const refreshed = compatibilityProjectionTarget(scope);
  if (refreshed !== target) {
    fail("style_master_compatibility_projection_failed", "Style Master compatibility projection path changed during promotion");
  }
}

async function encodeStyleMasterCompatibilityJpeg(candidate) {
  try {
    const decoded = decodePng(candidate.bytes, { checkCrc: true });
    if (decoded.width !== candidate.candidate_width || decoded.height !== candidate.candidate_height ||
      decoded.data.length !== decoded.width * decoded.height * 4) {
      fail("style_master_compatibility_projection_failed", "Style Master selected bytes changed image dimensions before compatibility projection");
    }
    const canvas = createCanvas(decoded.width, decoded.height);
    const context = canvas.getContext("2d");
    const pixels = context.createImageData(decoded.width, decoded.height);
    pixels.data.set(decoded.data);
    context.putImageData(pixels, 0, 0);
    const jpeg = Buffer.from(canvas.toBuffer("image/jpeg"));
    if (jpeg.length === 0 || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) {
      fail("style_master_compatibility_projection_failed", "Style Master compatibility projection did not produce JPEG bytes");
    }
    const verified = await loadImage(jpeg);
    if (verified.width !== candidate.candidate_width || verified.height !== candidate.candidate_height) {
      fail("style_master_compatibility_projection_failed", "Style Master compatibility JPEG dimensions are invalid");
    }
    return jpeg;
  } catch (error) {
    if (error instanceof StyleMasterPlanError) throw error;
    fail("style_master_compatibility_projection_failed", "Style Master selected bytes could not be projected as JPEG");
  }
}

function writeCompatibilityProjectionAtomic(scope, target, bytes) {
  const temporary = join(dirname(target), `.${basename(target)}.style-master-${randomUUID()}.tmp`);
  try {
    writeFileSync(temporary, bytes, { flag: "wx", mode: 0o600 });
    assertUnchangedCompatibilityProjectionTarget(scope, target);
    renameSync(temporary, target);
  } catch (error) {
    try { rmSync(temporary, { force: true }); } catch { /* Best-effort cleanup of this invocation's temporary. */ }
    throw error;
  }
}

async function ensureStyleMasterCompatibilityProjection(scope, candidate) {
  const target = compatibilityProjectionTarget(scope);
  const jpeg = await encodeStyleMasterCompatibilityJpeg(candidate);
  let current = null;
  try {
    current = existsSync(target) ? readFileSync(target) : null;
  } catch {
    fail("style_master_compatibility_projection_failed", "Style Master compatibility projection target is unreadable");
  }
  if (current !== null && equalBytes(current, jpeg)) {
    return Object.freeze({ path: target, status: "current", bytes_sha256: sha256Bytes(jpeg) });
  }
  writeCompatibilityProjectionAtomic(scope, target, jpeg);
  return Object.freeze({ path: target, status: "rebuilt", bytes_sha256: sha256Bytes(jpeg) });
}

function compatibilityProjectionFailure(error, replay) {
  return new StyleMasterPlanError(
    "style_master_compatibility_projection_failed",
    "Style Master selection committed, but its compatibility JPEG projection must be replayed",
    Object.freeze({
      subject: Object.freeze({ kind: "style_master_selection", id: replay.selection_sha256 }),
      reason: Object.freeze({ kind: "compatibility_projection_failed" }),
      replay: Object.freeze({
        plan_sha256: replay.plan.plan_sha256,
        decision: "proceed",
        candidate_id: replay.candidate.candidate_id,
      }),
      cause_code: error?.code || "style_master_compatibility_projection_failed",
    }),
  );
}

async function finalizedStyleMasterSelectionResult(scope, replay, { replayed }) {
  let compatibility_projection;
  try {
    compatibility_projection = await ensureStyleMasterCompatibilityProjection(scope, replay.candidate);
  } catch (error) {
    throw compatibilityProjectionFailure(error, replay);
  }
  return Object.freeze({
    plan_sha256: replay.plan.plan_sha256,
    run_version: replay.plan.run_version,
    workflow: replay.plan.workflow,
    decision: "proceed",
    candidate_id: replay.candidate.candidate_id,
    review_decision_sha256: replay.review_decision_sha256,
    selection: Object.freeze(structuredClone(replay.selection)),
    selection_sha256: replay.selection_sha256,
    accepted_at: replay.selection.accepted_at,
    promoted: true,
    replay: Boolean(replayed),
    compatibility_projection,
    next_action: "style_master_accepted",
  });
}

function stateWriteConflict(error) {
  return error?.message === "CONFLICT: state precondition changed" || error?.message === "CONFLICT: state changed before commit";
}

async function promoteReviewedStyleMasterCandidate({ scope, planSha256, decision, refreshScope }) {
  let review = await validateStyleMasterCandidateReviewForAction({
    scope,
    planSha256,
    refreshScope,
  }, { allowExistingDecision: true });
  let candidate = reviewedCandidateById(review, decision.record.candidate_id);

  for (let attempt = 0; attempt < MAX_SELECTION_CAS_RETRIES; attempt += 1) {
    const selection = acceptedSelectionRecord(review.plan, decision, candidate, new Date().toISOString());
    try {
      const recorded = recordEffectiveStyleMasterSelection(scope.deck_dir, {
        runDir: scope.run_dir,
        selection: selection.record,
      });
      return Object.freeze({
        plan: review.plan,
        candidate,
        decision: decision.record,
        review_decision_sha256: decision.review_decision_sha256,
        selection: recorded.record,
        selection_sha256: recorded.selection_sha256,
        replay: recorded.status === "already-current",
      });
    } catch (error) {
      const winner = exactAcceptedSelectionReplay(scope, {
        planSha256,
        decision: "proceed",
        candidateId: decision.record.candidate_id,
      });
      if (winner) return Object.freeze({ ...winner, replay: true });
      if (!stateWriteConflict(error) || attempt === MAX_SELECTION_CAS_RETRIES - 1) {
        if (error?.message === "STYLE_MASTER_SELECTION_CONFLICT") {
          fail("style_master_selection_conflict", "Style Master effective selection changed before promotion");
        }
        throw error;
      }
      review = await validateStyleMasterCandidateReviewForAction({
        scope,
        planSha256,
        refreshScope,
      }, { allowExistingDecision: true });
      candidate = reviewedCandidateById(review, decision.record.candidate_id);
    }
  }
  fail("style_master_selection_conflict", "Style Master effective selection changed repeatedly before promotion");
}

/**
 * Persist one human review decision and, for proceed, atomically promote the
 * same review-validated immutable bytes through the state owner. No previous
 * review projection is treated as acceptance authority.
 */
export async function acceptStyleMasterCandidateReview({
  scope,
  planSha256,
  decision,
  candidateId = null,
  refreshScope = null,
} = {}) {
  assertPlanSha256(planSha256);
  const requested = normalizedReviewDecision(decision, candidateId);
  const resolvedScope = await resolveCurrentScope(scope, refreshScope);

  // A selection CAS winner is the only historical replay path. It can repair
  // its JPEG even when a terminal successor has advanced the lifecycle head.
  const existingReplay = exactAcceptedSelectionReplay(resolvedScope, {
    planSha256,
    decision: requested.decision,
    candidateId: requested.candidate_id,
  });
  if (existingReplay) return finalizedStyleMasterSelectionResult(resolvedScope, existingReplay, { replayed: true });

  const review = await validateStyleMasterCandidateReviewForAction({
    scope: resolvedScope,
    planSha256,
    refreshScope,
  }, { allowExistingDecision: true });
  const candidate = requested.decision === "proceed"
    ? reviewedCandidateById(review, requested.candidate_id)
    : null;
  const decisionRecord = reviewDecisionRecord(review.plan, { decision: requested.decision, candidate });
  const paths = styleMasterStorePaths(resolvedScope.run_dir, { plan_sha256: planSha256 });
  const persistedDecision = createOrExactMatchStyleMasterRecord(
    paths.review_decision,
    decisionRecord.record,
    validateStyleMasterReviewDecisionRecord,
    { plan: review.plan },
  );

  if (requested.decision !== "proceed") {
    return Object.freeze({
      plan_sha256: review.plan_sha256,
      run_version: review.run_version,
      workflow: review.workflow,
      decision: requested.decision,
      review_decision: persistedDecision.record,
      review_decision_sha256: persistedDecision.review_decision_sha256,
      promoted: false,
      replay: persistedDecision.replay,
      next_action: requested.decision === "repair" ? "repair_style_master_candidates" : "redirect_style_master_workflow",
    });
  }

  // Re-run the exact review chain after decision publication and before the
  // selection CAS. A crash in this window remains resumable only by this same
  // plan/decision/candidate tuple.
  const promotion = await promoteReviewedStyleMasterCandidate({
    scope: resolvedScope,
    planSha256,
    decision: Object.freeze({
      record: persistedDecision.record,
      review_decision_sha256: persistedDecision.review_decision_sha256,
    }),
    refreshScope,
  });
  return finalizedStyleMasterSelectionResult(resolvedScope, promotion, { replayed: promotion.replay });
}

/**
 * Resolve the accepted Style Master authority for Page Authority raw planning.
 * The compatibility JPEG is intentionally absent from this interface: the
 * returned bytes are the immutable candidate bytes named by the state record.
 */
export function resolveAcceptedStyleMasterReference({ runDir, deckDir = null, receipt } = {}) {
  const resolvedRunDir = resolve(runDir || "");
  const resolvedDeckDir = deckRoot(resolvedRunDir);
  if (deckDir !== null && resolve(deckDir) !== resolvedDeckDir) {
    fail("style_master_scope_invalid", "Style Master reference must use the canonical deck for its run directory");
  }
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt) ||
    !SHA256_RE.test(receipt.source_sha256 || "") || !["framed", "pure"].includes(receipt.workflow) ||
    !Array.isArray(receipt.slides) || receipt.slides.length === 0) {
    fail("style_master_scope_candidate_invalid", "Style Master reference requires the selected workflow's current source receipt");
  }
  const scope = Object.freeze({
    run_dir: resolvedRunDir,
    deck_dir: resolvedDeckDir,
    run_version: basename(resolvedRunDir),
    workflow: receipt.workflow,
    style_intent_source_path: styleAsset(resolvedRunDir, STYLE_MASTER_PROMPT),
    source_candidate: Object.freeze({ receipt }),
  });
  const effective = resolveEffectiveStyleMasterSelection(resolvedDeckDir, { runDir: resolvedRunDir });
  if (!effective.ok) {
    fail(
      effective.code === "STYLE_MASTER_SELECTION_MISSING" ? "style_master_selection_missing" : "style_master_selection_stale",
      "Page Authority raw planning requires one current accepted Style Master selection",
    );
  }
  if (effective.workflow !== receipt.workflow) {
    fail("style_master_selection_stale", "Style Master selection workflow does not match the current source receipt");
  }
  const replay = exactAcceptedSelectionReplay(scope, {
    planSha256: effective.record.plan_sha256,
    decision: "proceed",
    candidateId: effective.record.candidate_id,
  });
  if (!replay) {
    fail("style_master_selection_stale", "Style Master selection cannot be reread for the current Page Authority scope");
  }
  const intent = readStyleIntent(scope);
  const styleContext = styleContextFromCandidate(scope);
  if (replay.selection.style_intent_sha256 !== intent.style_intent_sha256 ||
    replay.selection.style_context_sha256 !== styleContext.style_context_sha256 ||
    replay.selection.candidate_generation_profile_sha256 !== styleMasterGenerationProfileSha256()) {
    fail("style_master_selection_stale", "Style Master selection intent, context, or generation profile is no longer current");
  }
  return Object.freeze({
    selection_sha256: replay.selection_sha256,
    selection: Object.freeze(structuredClone(replay.selection)),
    plan_sha256: replay.plan.plan_sha256,
    candidate_id: replay.candidate.candidate_id,
    candidate_sha256: replay.candidate.candidate_sha256,
    candidate_provenance_sha256: replay.candidate.candidate_provenance_sha256,
    candidate_media_type: replay.candidate.candidate_media_type,
    candidate_width: replay.candidate.candidate_width,
    candidate_height: replay.candidate.candidate_height,
    style_intent_sha256: intent.style_intent_sha256,
    style_context_sha256: styleContext.style_context_sha256,
    candidate_generation_profile_sha256: replay.selection.candidate_generation_profile_sha256,
    bytes: Buffer.from(replay.candidate.bytes),
  });
}
