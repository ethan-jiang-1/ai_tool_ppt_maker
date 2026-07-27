/**
 * State-owned source/control transaction for a cross-pipeline production-mode
 * transition. Candidate inputs are target-authored and never derived from the
 * source pipeline's prompts, pixels, generated artifacts, or approvals.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { hostname } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { parsePageAuthoritySource } from "../../01-content/index.mjs";
import {
  createPageAuthoritySourceResolver,
  loadPageAuthorityVisualLanguage,
} from "../../02-visual-system/index.mjs";
import { canonicalJson } from "../../contracts/canonical_json.mjs";
import { PAGE_AUTHORITY_IMAGE2_PIPELINE, probeProductionMarker } from "../run-bundle/production_marker.mjs";
import {
  canonicalVersionKey,
  checkStagedVersion,
  isProductionMode,
  nextVersionName,
  normalizeRunVersion,
  pipelineFromSourceMarker,
  productionPolicyForMode,
} from "../run-bundle/bundle_layout.mjs";
import {
  completeProductionModeTransitionHandoff,
  confirmProductionModeTransition,
  inspectActiveProductionModeTransition,
  readState,
  restoreProductionModeTransitionSource,
  statePath,
  verifyProductionModeTransitionRecoveryConfirmation,
} from "./state.mjs";
import { inspectLegacyProtocol, isRecognizedLegacyProtocol } from "./legacy_protocol_adoption.mjs";

const SCRATCH = "production-mode-transition";
const PREVIEW_SCHEMA = "pptmaker-production-mode-transition-preview-v1";
const JOURNAL_SCHEMA = "pptmaker-production-mode-transition-apply-journal-v1";
const SUCCESS_SCHEMA = "pptmaker-production-mode-transition-success-v1";
const LEDGER_SCHEMA = "pptmaker-production-mode-transition-identity-ledger-v1";
const TARGET_SCHEMA = "pptmaker-production-mode-transition-target-v1";
const ADOPTION_MATRIX_SCHEMA = "pptmaker-page-authority-legacy-adoption-matrix-v1";
const MODE_TRANSITION_KIND = "mode-transition";
const LEGACY_ADOPTION_KIND = "legacy-adoption";
const INTAKE_FIELDS = Object.freeze(["topic", "audience", "duration", "language", "takeaway", "content_constraints", "visual_dna", "success_criteria"]);
const TARGET_CANDIDATE_ENTRIES = Object.freeze([
  "identity-ledger.json",
  "target.json",
  "target-intake.json",
  "slide-specifications.md",
  "overrides",
]);
const ADOPTION_MATRIX_ROW_KEYS = Object.freeze([
  "source_slide_id",
  "target_slide_id",
  "disposition",
  "authority",
  "text_frame_disposition",
  "visual_brief_disposition",
  "reference_disposition",
  "speaker_notes_disposition",
]);
const ADOPTION_TARGET_DISPOSITIONS = Object.freeze(["authored", "none"]);
const SLIDE_ID_RE = /^[A-Za-z][A-Za-z0-9]{4,7}$/;
const HEX_RE = /^[0-9a-f]{64}$/;
const VERSION_RE = /^v[1-9][0-9]*$/;
const SAME_HOST_RECOVERY_MS = 60_000;
const UNCERTAIN_RECOVERY_MS = 300_000;

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonicalBytes = (value) => Buffer.from(`${canonicalJson(value)}\n`);

function transitionPaths(runDir) {
  const root = join(resolve(runDir), "_scratch", SCRATCH);
  const candidate = join(root, "candidate-run");
  return Object.freeze({
    root,
    candidate,
    ledger: join(candidate, "identity-ledger.json"),
    target: join(candidate, "target.json"),
    intake: join(candidate, "target-intake.json"),
    source: join(candidate, "slide-specifications.md"),
    adoptionMatrix: join(candidate, "adoption-matrix.json"),
    overrides: join(candidate, "overrides"),
    plan: join(root, "plan.json"),
    journal: join(root, "apply-journal.json"),
  });
}

function ensureDir(path) { mkdirSync(path, { recursive: true }); }

function writeNoReplace(path, bytes) {
  ensureDir(dirname(path));
  if (existsSync(path)) throw new Error(`CONFLICT: transition artifact already exists: ${path}`);
  writeFileSync(path, bytes, { flag: "wx", mode: 0o600 });
}

function writeCanonicalNoReplace(path, value) { writeNoReplace(path, canonicalBytes(value)); }

function readJson(path, label) {
  try { return JSON.parse(readFileSync(path, "utf8")); }
  catch (error) { throw new Error(`${label} is invalid JSON: ${error.message}`); }
}

function safeFile(path, label) {
  if (!existsSync(path)) return false;
  const stat = statSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} must be a regular file`);
  return true;
}

function sourceIdentityLedger(sourceBytes) {
  const entries = [];
  const pattern = /^##\s+Slide\s+(\d+)\s*:\s*`([A-Za-z][A-Za-z0-9]{4,7})`/gm;
  for (const match of sourceBytes.toString("utf8").matchAll(pattern)) {
    entries.push({ position: Number(match[1]), slide_id: match[2] });
  }
  if (entries.length === 0 || new Set(entries.map((entry) => entry.position)).size !== entries.length ||
    new Set(entries.map((entry) => entry.slide_id)).size !== entries.length ||
    !entries.every((entry, index) => entry.position === index + 1)) {
    throw new Error("source has no valid formal slide identity/order ledger");
  }
  return entries;
}

function candidateIdentityLedger(candidateBytes) {
  return sourceIdentityLedger(candidateBytes);
}

function validIntake(value) {
  return value != null && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === INTAKE_FIELDS.length &&
    INTAKE_FIELDS.every((field) => typeof value[field] === "string" && value[field].trim().length > 0);
}

function normalizeIntake(value) {
  if (!validIntake(value)) throw new Error("target intake must explicitly contain every normal intake field");
  return Object.fromEntries(INTAKE_FIELDS.map((field) => [field, value[field].trim()]));
}

function exactTargetSelection(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
    value.schema !== TARGET_SCHEMA || !isProductionMode(value.target_mode) ||
    Object.keys(value).some((key) => !["schema", "target_mode"].includes(key))) {
    throw new Error("transition candidate target.json is invalid");
  }
  return Object.freeze({ target_mode: value.target_mode, target_pipeline: productionPolicyForMode(value.target_mode).pipeline });
}

function exactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function validTargetDisposition(value) {
  return ADOPTION_TARGET_DISPOSITIONS.includes(value);
}

function validateAdoptionMatrix(value, { sourceVersion, sourceEntries, receipt } = {}) {
  if (!exactKeys(value, ["schema", "source_version", "rows"]) || value.schema !== ADOPTION_MATRIX_SCHEMA ||
    value.source_version !== sourceVersion || !Array.isArray(value.rows) || value.rows.length === 0) {
    throw new Error("adoption matrix is invalid");
  }
  const sourceIds = new Set(sourceEntries.map((entry) => entry.slide_id));
  const receiptById = new Map(receipt.slides.map((slide) => [slide.slide_id, slide]));
  const seenSource = new Set();
  const seenTarget = new Set();
  let previous = null;
  for (const row of value.rows) {
    if (!exactKeys(row, ADOPTION_MATRIX_ROW_KEYS) || !["retained", "removed", "addition"].includes(row.disposition)) {
      throw new Error("adoption matrix row is invalid");
    }
    const sourceId = row.source_slide_id;
    const targetId = row.target_slide_id;
    const sortKey = `${targetId || "~"}:${sourceId || "~"}`;
    if (previous !== null && previous >= sortKey) throw new Error("adoption matrix rows must be in canonical target/source order");
    previous = sortKey;
    if (row.disposition === "removed") {
      if (!SLIDE_ID_RE.test(sourceId || "") || targetId !== null || row.authority !== null ||
        row.text_frame_disposition !== "removed" || row.visual_brief_disposition !== "removed" ||
        row.reference_disposition !== "removed" || row.speaker_notes_disposition !== "removed") {
        throw new Error("adoption removal row is invalid");
      }
      if (!sourceIds.has(sourceId) || seenSource.has(sourceId)) throw new Error("adoption matrix does not account for source identities exactly once");
      seenSource.add(sourceId);
      continue;
    }
    if (!SLIDE_ID_RE.test(targetId || "") || !["pure-image2", "framed-image2"].includes(row.authority) ||
      row.visual_brief_disposition !== "authored" || !validTargetDisposition(row.reference_disposition) ||
      !validTargetDisposition(row.speaker_notes_disposition)) {
      throw new Error("adoption target row is invalid");
    }
    const slide = receiptById.get(targetId);
    if (!slide || slide.authority !== row.authority || seenTarget.has(targetId)) {
      throw new Error("adoption matrix target does not match the Page Authority source");
    }
    seenTarget.add(targetId);
    const expectedFrame = row.authority === "framed-image2" ? "authored" : "not-applicable";
    if (row.text_frame_disposition !== expectedFrame) throw new Error("adoption matrix Text Frame disposition does not match authority");
    if (row.disposition === "retained") {
      if (!SLIDE_ID_RE.test(sourceId || "") || sourceId !== targetId || !sourceIds.has(sourceId) || seenSource.has(sourceId)) {
        throw new Error("adoption retained identity must be explicitly unchanged");
      }
      seenSource.add(sourceId);
    } else if (sourceId !== null) {
      throw new Error("adoption addition must not claim a source identity");
    }
  }
  if (seenSource.size !== sourceIds.size || seenTarget.size !== receiptById.size) {
    throw new Error("adoption matrix must account for every source and target identity");
  }
  return Object.freeze(value.rows.map((row) => Object.freeze({ ...row })));
}

function assertRecognizedLegacyObservation(source, observation) {
  if (!isRecognizedLegacyProtocol(observation) || observation.observation?.canonical_run !== source.sourceRunDir ||
    observation.observation?.run_version !== source.sourceVersion || observation.observation?.production_mode !== source.sourceMode ||
    observation.observation?.source_sha256 !== sha256(source.sourceBytes) ||
    observation.observation?.state_sha256 !== sha256(readFileSync(statePath(source.deckDir)))) {
    throw new Error("legacy adoption observation is missing, stale, or no longer recognized");
  }
}

function relativeRunPath(runDir, path) {
  return relative(resolve(runDir), resolve(path)).split(sep).join("/");
}

function recursivelyReceiptedFiles(root, runDir) {
  if (!existsSync(root)) return [];
  const rootStat = statSync(root);
  if (rootStat.isSymbolicLink()) throw new Error("transition candidate cannot contain symbolic links");
  const receipts = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error("transition candidate cannot contain symbolic links");
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) receipts.push({ path: relativeRunPath(runDir, path), sha256: sha256(readFileSync(path)) });
      else throw new Error("transition candidate contains an unsupported filesystem entry");
    }
  };
  if (rootStat.isDirectory()) visit(root);
  else if (rootStat.isFile()) receipts.push({ path: relativeRunPath(runDir, root), sha256: sha256(readFileSync(root)) });
  else throw new Error("transition candidate contains an unsupported filesystem entry");
  return receipts;
}

function assertTargetOwnedCandidateTree(candidateRoot, { adoption = false } = {}) {
  const allowed = adoption ? [...TARGET_CANDIDATE_ENTRIES, "adoption-matrix.json"] : TARGET_CANDIDATE_ENTRIES;
  for (const entry of readdirSync(candidateRoot, { withFileTypes: true })) {
    if (!allowed.includes(entry.name)) {
      const retired = entry.name === "html-migration" || entry.name === "projected-run";
      throw new Error(retired
        ? "retired html-migration overlay cannot be transition evidence"
        : `transition candidate contains non-target-owned entry ${entry.name}`);
    }
    if (entry.name === "overrides" && (!entry.isDirectory() || entry.isSymbolicLink())) {
      throw new Error("transition candidate overrides must be a regular target-owned directory");
    }
    if (entry.name !== "overrides" && (!entry.isFile() || entry.isSymbolicLink())) {
      throw new Error(`transition candidate ${entry.name} must be a regular target-owned file`);
    }
  }
}

function sourceContext(runDir) {
  const sourceRunDir = resolve(runDir);
  const sourceVersion = normalizeRunVersion(sourceRunDir);
  if (!sourceVersion) throw new Error("transition source must be a canonical run version");
  const deckDir = resolve(sourceRunDir, "..", "..");
  const state = readState(deckDir, { purpose: "observe", heal: false, runVersion: sourceVersion });
  if (state?.replacement_required || state?.corrupted) throw new Error("active source execution is unavailable for production-mode transition");
  if (state?.execution_run_version_mismatch) throw new Error("execution_run_version_mismatch: selected run does not own the active execution");
  if (!state?.execution_id || state.run_version !== sourceVersion || state.playbook === "production-mode-transition" && state.current_node === "apply-production-mode-transition") {
    throw new Error("active source execution is unavailable for production-mode transition");
  }
  const sourceMode = state.production_mode?.by_version?.[canonicalVersionKey(sourceVersion)]?.mode;
  if (!isProductionMode(sourceMode)) throw new Error("transition source has no authoritative production mode");
  const sourcePath = join(sourceRunDir, "slide-specifications.md");
  if (!safeFile(sourcePath, "transition source")) throw new Error("transition source has no slide specifications");
  const sourceBytes = readFileSync(sourcePath);
  const marker = probeProductionMarker(sourceBytes, { source: "slide-specifications.md" });
  const sourcePipeline = pipelineFromSourceMarker(marker);
  if (!sourcePipeline?.ok || sourcePipeline.pipeline !== productionPolicyForMode(sourceMode).pipeline) {
    throw new Error("transition source mode and canonical marker disagree");
  }
  return Object.freeze({ deckDir, sourceRunDir, sourceVersion, state, sourceMode, sourcePipeline: sourcePipeline.pipeline, sourcePath, sourceBytes });
}

function sourceContextFromActiveTransition(runDir) {
  const sourceRunDir = resolve(runDir);
  const sourceVersion = normalizeRunVersion(sourceRunDir);
  if (!sourceVersion) throw new Error("transition source must be a canonical run version");
  const deckDir = resolve(sourceRunDir, "..", "..");
  const active = inspectActiveProductionModeTransition(deckDir, { sourceRunVersion: sourceVersion });
  if (!active.ok) {
    throw new Error("active transition checkpoint is missing or drifted");
  }
  const { state, record } = active;
  const sourceMode = state.production_mode?.by_version?.[canonicalVersionKey(sourceVersion)]?.mode;
  const sourcePath = join(sourceRunDir, "slide-specifications.md");
  if (!isProductionMode(sourceMode) || !safeFile(sourcePath, "transition source")) throw new Error("transition source authority is unavailable");
  const sourceBytes = readFileSync(sourcePath);
  const marker = pipelineFromSourceMarker(probeProductionMarker(sourceBytes, { source: "slide-specifications.md" }));
  if (!marker?.ok || marker.pipeline !== record.transition_source_pipeline || sourceMode !== record.transition_source_mode) {
    throw new Error("transition source mode and canonical marker disagree");
  }
  return Object.freeze({ deckDir, sourceRunDir, sourceVersion, state, record, sourceMode, sourcePipeline: marker.pipeline, sourcePath, sourceBytes });
}

function candidateState(source, { kind = MODE_TRANSITION_KIND, observation = null } = {}) {
  const adoption = kind === LEGACY_ADOPTION_KIND;
  if (![MODE_TRANSITION_KIND, LEGACY_ADOPTION_KIND].includes(kind)) throw new Error("transition plan kind is invalid");
  const paths = transitionPaths(source.sourceRunDir);
  if (!existsSync(paths.candidate)) {
    return Object.freeze({ status: "preparation_required", paths, missing: ["candidate-run/"] });
  }
  const candidateStat = statSync(paths.candidate);
  if (!candidateStat.isDirectory() || candidateStat.isSymbolicLink()) throw new Error("transition candidate root must be a regular directory");
  assertTargetOwnedCandidateTree(paths.candidate, { adoption });
  const missing = [];
  if (!safeFile(paths.ledger, "transition identity ledger")) missing.push("identity-ledger.json");
  if (!safeFile(paths.target, "transition target selection")) missing.push("target.json");
  if (!safeFile(paths.intake, "transition target intake")) missing.push("target-intake.json");
  if (!safeFile(paths.source, "transition target source")) missing.push("slide-specifications.md");
  if (adoption && !safeFile(paths.adoptionMatrix, "adoption matrix")) missing.push("adoption-matrix.json");
  if (missing.length > 0) return Object.freeze({ status: "authoring_required", paths, missing });

  const ledger = readJson(paths.ledger, "transition identity ledger");
  if (ledger?.schema !== LEDGER_SCHEMA || ledger.source_version !== source.sourceVersion || !Array.isArray(ledger.entries) || ledger.entries.length === 0) {
    throw new Error("transition identity ledger is invalid");
  }
  const sourceIds = ledger.entries.map((entry) => `${entry.position}:${entry.slide_id}`);
  if (!sourceIds.every((entry) => /^[1-9][0-9]*:[A-Za-z][A-Za-z0-9]{4,7}$/.test(entry))) throw new Error("transition identity ledger is invalid");
  if (canonicalJson(ledger.entries) !== canonicalJson(sourceIdentityLedger(source.sourceBytes))) {
    throw new Error("transition identity ledger no longer matches the source identity/order");
  }
  const target = exactTargetSelection(readJson(paths.target, "transition target selection"));
  const intake = normalizeIntake(readJson(paths.intake, "transition target intake"));
  const candidateBytes = readFileSync(paths.source);
  if (adoption) {
    assertRecognizedLegacyObservation(source, observation);
    if (target.target_mode !== "image2-page-authority" || target.target_pipeline !== PAGE_AUTHORITY_IMAGE2_PIPELINE) {
      throw new Error("legacy adoption must select the exact Page Authority target mode");
    }
    if (!HEX_RE.test(observation.observation?.state_sha256 || "")) throw new Error("legacy adoption observation has no canonical source state binding");
    let receipt;
    try {
      const visualLanguage = loadPageAuthorityVisualLanguage(source.deckDir);
      receipt = parsePageAuthoritySource(candidateBytes.toString("utf8"), {
        source: "candidate-run/slide-specifications.md",
        registry: createPageAuthoritySourceResolver({ deckDir: source.deckDir, visualLanguage }),
      });
    } catch (error) {
      throw new Error(`legacy adoption Page Authority candidate is invalid: ${error.message || String(error)}`);
    }
    const matrixBytes = readFileSync(paths.adoptionMatrix);
    const matrix = readJson(paths.adoptionMatrix, "adoption matrix");
    const matrixRows = validateAdoptionMatrix(matrix, {
      sourceVersion: source.sourceVersion,
      sourceEntries: ledger.entries,
      receipt,
    });
    if (!existsSync(join(paths.overrides, "visual-style", "color_palette.json"))) {
      return Object.freeze({ status: "authoring_required", paths, missing: ["overrides/visual-style/color_palette.json"] });
    }
    const controls = recursivelyReceiptedFiles(paths.candidate, source.sourceRunDir);
    const adoptionMatrixSha256 = sha256(matrixBytes);
    const candidateReceipt = sha256(canonicalBytes({
      kind,
      source_version: source.sourceVersion,
      target_mode: target.target_mode,
      observation_sha256: observation.observation_sha256,
      adoption_matrix_sha256: adoptionMatrixSha256,
      controls,
    }));
    return Object.freeze({
      status: "complete",
      paths,
      kind,
      targetMode: target.target_mode,
      targetPipeline: target.target_pipeline,
      intake,
      intakeSha256: sha256(Buffer.from(canonicalJson(intake))),
      candidateBytes,
      candidateSourceSha256: sha256(candidateBytes),
      controls,
      candidateReceiptSha256: candidateReceipt,
      identityLedgerSha256: sha256(readFileSync(paths.ledger)),
      adoptionObservationSha256: observation.observation_sha256,
      adoptionSourceStateSha256: observation.observation.state_sha256,
      adoptionMatrixSha256,
      adoptionMatrixRows: matrixRows,
      pageAuthorityDefault: receipt.page_authority_default,
      candidateSlideCount: receipt.slides.length,
    });
  }
  const targetIds = candidateIdentityLedger(candidateBytes).map((entry) => `${entry.position}:${entry.slide_id}`);
  if (canonicalJson(sourceIds) !== canonicalJson(targetIds)) throw new Error("transition target identity/order must match the continuity ledger");
  const candidatePipeline = pipelineFromSourceMarker(probeProductionMarker(candidateBytes, { source: "candidate-run/slide-specifications.md" }));
  if (!candidatePipeline?.ok || candidatePipeline.pipeline !== target.target_pipeline) throw new Error("candidate source marker does not match the selected target mode");
  if (!existsSync(join(paths.overrides, "visual-style", "color_palette.json"))) {
    return Object.freeze({ status: "authoring_required", paths, missing: ["overrides/visual-style/color_palette.json"] });
  }
  const controls = recursivelyReceiptedFiles(paths.candidate, source.sourceRunDir);
  const candidateReceipt = sha256(canonicalBytes({ kind, source_version: source.sourceVersion, target_mode: target.target_mode, controls }));
  return Object.freeze({
    status: "complete",
    paths,
    kind,
    targetMode: target.target_mode,
    targetPipeline: target.target_pipeline,
    intake,
    intakeSha256: sha256(Buffer.from(canonicalJson(intake))),
    candidateBytes,
    candidateSourceSha256: sha256(candidateBytes),
    controls,
    candidateReceiptSha256: candidateReceipt,
    identityLedgerSha256: sha256(readFileSync(paths.ledger)),
    candidateSlideCount: targetIds.length,
  });
}

function previewPlan(source, candidate, { executionId = source.state.execution_id, sourceMode = source.sourceMode, sourcePipeline = source.sourcePipeline, kind = MODE_TRANSITION_KIND } = {}) {
  if (candidate.kind !== kind || ![MODE_TRANSITION_KIND, LEGACY_ADOPTION_KIND].includes(kind)) throw new Error("transition candidate plan kind is invalid");
  const targetVersion = nextVersionName(source.sourceRunDir);
  const sourceTargetPolicy = productionPolicyForMode(candidate.targetMode);
  if (sourcePipeline === sourceTargetPolicy.pipeline) throw new Error("transition target must use a different production pipeline");
  const plan = {
    schema: PREVIEW_SCHEMA,
    plan_kind: kind,
    source_execution_id: executionId,
    source_version: source.sourceVersion,
    source_mode: sourceMode,
    source_pipeline: sourcePipeline,
    source_marker_sha256: sha256(source.sourceBytes),
    target_version: targetVersion,
    target_mode: candidate.targetMode,
    target_pipeline: candidate.targetPipeline,
    expected_target_marker_pipeline: candidate.targetPipeline,
    candidate_receipt_sha256: candidate.candidateReceiptSha256,
    candidate_source_sha256: candidate.candidateSourceSha256,
    candidate_control_receipts: candidate.controls,
    identity_ledger_sha256: candidate.identityLedgerSha256,
    target_intake_sha256: candidate.intakeSha256,
    deterministic_impact: {
      target_slide_count: candidate.candidateSlideCount,
      needs_local_materialization: candidate.targetPipeline === "html-first-v1",
      needs_render: candidate.targetPipeline === "whole-page-image2-v1",
      needs_raw_generation: kind === LEGACY_ADOPTION_KIND ? candidate.adoptionMatrixRows
        .filter((row) => row.target_slide_id !== null)
        .map((row) => row.target_slide_id)
        .sort() : [],
    },
  };
  if (kind === LEGACY_ADOPTION_KIND) {
    plan.adoption = {
      observation_sha256: candidate.adoptionObservationSha256,
      source_state_sha256: candidate.adoptionSourceStateSha256,
      matrix_sha256: candidate.adoptionMatrixSha256,
      page_authority_default: candidate.pageAuthorityDefault,
      matrix_rows: candidate.adoptionMatrixRows,
    };
  }
  return Object.freeze({ ...plan, plan_hash: sha256(canonicalBytes(plan)) });
}

function validatePlan(plan) {
  if (!plan || typeof plan !== "object" || plan.schema !== PREVIEW_SCHEMA || !HEX_RE.test(plan.plan_hash || "")) throw new Error("transition preview plan is invalid");
  const copy = { ...plan };
  delete copy.plan_hash;
  if (sha256(canonicalBytes(copy)) !== plan.plan_hash) throw new Error("transition preview plan hash drifted");
  if (![MODE_TRANSITION_KIND, LEGACY_ADOPTION_KIND].includes(plan.plan_kind) || !normalizeRunVersion(plan.source_version) || !normalizeRunVersion(plan.target_version) || !isProductionMode(plan.source_mode) || !isProductionMode(plan.target_mode) ||
    !HEX_RE.test(plan.candidate_receipt_sha256 || "") || !HEX_RE.test(plan.target_intake_sha256 || "") || typeof plan.source_execution_id !== "string" || !plan.source_execution_id) {
    throw new Error("transition preview plan has invalid bindings");
  }
  if (plan.plan_kind === LEGACY_ADOPTION_KIND) {
    if (plan.target_mode !== "image2-page-authority" || plan.target_pipeline !== PAGE_AUTHORITY_IMAGE2_PIPELINE ||
      !exactKeys(plan.adoption, ["observation_sha256", "source_state_sha256", "matrix_sha256", "page_authority_default", "matrix_rows"]) ||
      !HEX_RE.test(plan.adoption.observation_sha256 || "") || !HEX_RE.test(plan.adoption.source_state_sha256 || "") || !HEX_RE.test(plan.adoption.matrix_sha256 || "") ||
      !["pure-image2", "framed-image2"].includes(plan.adoption.page_authority_default) || !Array.isArray(plan.adoption.matrix_rows)) {
      throw new Error("legacy adoption preview plan is invalid");
    }
  } else if (Object.hasOwn(plan, "adoption")) {
    throw new Error("mode transition preview plan cannot contain adoption fields");
  }
  return plan;
}

function planFile(runDir) {
  const paths = transitionPaths(runDir);
  if (!safeFile(paths.plan, "transition preview plan")) throw new Error("transition preview plan is missing; run preview first");
  return validatePlan(readJson(paths.plan, "transition preview plan"));
}

function samePlan(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function copyTree(source, target) {
  if (!existsSync(source)) return;
  const sourceStat = statSync(source);
  if (sourceStat.isSymbolicLink()) throw new Error("transition candidate cannot contain symbolic links");
  if (sourceStat.isFile()) {
    ensureDir(dirname(target));
    copyFileSync(source, target);
    return;
  }
  ensureDir(target);
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const from = join(source, entry.name);
    const to = join(target, entry.name);
    if (entry.isSymbolicLink()) throw new Error("transition candidate cannot contain symbolic links");
    if (entry.isDirectory()) copyTree(from, to);
    else if (entry.isFile()) copyFileSync(from, to);
    else throw new Error("transition candidate contains an unsupported filesystem entry");
  }
}

function journalPathFor(sourceRunDir) { return transitionPaths(sourceRunDir).journal; }

function activeReceiptPath(sourceRunDir, targetVersion) {
  return join(dirname(resolve(sourceRunDir)), targetVersion, "_generated", "qa", "production_mode_transition.json");
}

function expectedSuccessReceipt(path, plan) {
  if (!safeFile(path, "transition success receipt")) return null;
  const bytes = readFileSync(path);
  const receipt = readJson(path, "transition success receipt");
  const matches = receipt?.schema === SUCCESS_SCHEMA && receipt.transition_kind === plan.plan_kind && receipt.plan_hash === plan.plan_hash &&
    receipt.source_execution_id === plan.source_execution_id && receipt.source_version === plan.source_version &&
    receipt.target_version === plan.target_version && receipt.target_mode === plan.target_mode &&
    receipt.target_pipeline === plan.target_pipeline && receipt.candidate_receipt_sha256 === plan.candidate_receipt_sha256 &&
    receipt.target_intake_sha256 === plan.target_intake_sha256 && HEX_RE.test(receipt.source_control_fingerprint || "") &&
    (plan.plan_kind !== LEGACY_ADOPTION_KIND ||
      exactKeys(receipt.adoption, ["observation_sha256", "source_state_sha256", "matrix_sha256"]) &&
      receipt.adoption.observation_sha256 === plan.adoption.observation_sha256 &&
      receipt.adoption.source_state_sha256 === plan.adoption.source_state_sha256 &&
      receipt.adoption.matrix_sha256 === plan.adoption.matrix_sha256);
  return matches ? Object.freeze({ receipt, bytes, sha256: sha256(bytes), path }) : null;
}

function transitionJournal(source, plan, token) {
  const ownerToken = token || randomBytes(32).toString("hex");
  const ownerHost = hostname().trim().toLowerCase();
  if (!HEX_RE.test(ownerToken) || !ownerHost) throw new Error("transition journal owner is invalid");
  return Object.freeze({
    schema: JOURNAL_SCHEMA,
    owner_token: ownerToken,
    owner_host: ownerHost,
    owner_pid: process.pid,
    claimed_at_epoch_ms: Date.now(),
    plan_hash: plan.plan_hash,
    source_execution_id: plan.source_execution_id,
    source_version: plan.source_version,
    target_version: plan.target_version,
    target_mode: plan.target_mode,
    target_pipeline: plan.target_pipeline,
    reservation_basename: `.${plan.target_version}.production-mode-transition-reservation-${ownerToken}`,
    staging_basename: `.${plan.target_version}.production-mode-transition-staging-${ownerToken}`,
  });
}

function validateJournal(journal, plan) {
  const valid = journal && journal.schema === JOURNAL_SCHEMA && HEX_RE.test(journal.owner_token || "") &&
    typeof journal.owner_host === "string" && journal.owner_host.trim() && Number.isInteger(journal.owner_pid) && journal.owner_pid > 0 &&
    Number.isFinite(journal.claimed_at_epoch_ms) && journal.claimed_at_epoch_ms > 0 &&
    journal.plan_hash === plan.plan_hash && journal.source_execution_id === plan.source_execution_id &&
    journal.source_version === plan.source_version && journal.target_version === plan.target_version &&
    journal.target_mode === plan.target_mode && journal.target_pipeline === plan.target_pipeline &&
    typeof journal.reservation_basename === "string" && typeof journal.staging_basename === "string" &&
    journal.reservation_basename === `.${plan.target_version}.production-mode-transition-reservation-${journal.owner_token}` &&
    journal.staging_basename === `.${plan.target_version}.production-mode-transition-staging-${journal.owner_token}`;
  if (!valid) throw new Error("transition apply journal does not match the active checkpoint");
  return journal;
}

function journalSnapshot(sourceRunDir, plan) {
  const path = journalPathFor(sourceRunDir);
  if (!safeFile(path, "transition apply journal")) return null;
  const bytes = readFileSync(path);
  return Object.freeze({ path, bytes, sha256: sha256(bytes), journal: validateJournal(readJson(path, "transition apply journal"), plan) });
}

function removeJournalOwnedPaths(sourceRunDir, journal) {
  const parent = dirname(resolve(sourceRunDir));
  rmSync(join(parent, journal.reservation_basename), { recursive: true, force: true });
  rmSync(join(parent, journal.staging_basename), { recursive: true, force: true });
  rmSync(journalPathFor(sourceRunDir), { force: true });
}

function assertActivePlan(source, plan) {
  const { record } = source;
  if (record.transition_kind !== plan.plan_kind || record.transition_plan_hash !== plan.plan_hash || record.transition_source_execution_id !== plan.source_execution_id ||
    record.transition_source_version !== plan.source_version || record.transition_source_mode !== plan.source_mode ||
    record.transition_source_pipeline !== plan.source_pipeline || record.transition_target_version !== plan.target_version ||
    record.transition_target_mode !== plan.target_mode || record.transition_target_pipeline !== plan.target_pipeline ||
    record.transition_candidate_receipt_sha256 !== plan.candidate_receipt_sha256 || record.transition_target_intake_sha256 !== plan.target_intake_sha256 ||
    (plan.plan_kind === LEGACY_ADOPTION_KIND &&
      (!record.transition_adoption || record.transition_adoption.observation_sha256 !== plan.adoption.observation_sha256 ||
        record.transition_adoption.source_state_sha256 !== plan.adoption.source_state_sha256 ||
        record.transition_adoption.matrix_sha256 !== plan.adoption.matrix_sha256))) {
    throw new Error("active transition checkpoint is missing or drifted");
  }
}

function materializeStaging(source, candidate, plan, journal) {
  const parent = dirname(source.sourceRunDir);
  const reservation = join(parent, journal.reservation_basename);
  const staging = join(parent, journal.staging_basename);
  const target = join(parent, plan.target_version);
  if (existsSync(target) || existsSync(reservation) || existsSync(staging)) throw new Error("CONFLICT: transition target, reservation, or staging path already exists");
  mkdirSync(reservation);
  mkdirSync(staging);
  copyFileSync(candidate.paths.source, join(staging, "slide-specifications.md"));
  copyTree(candidate.paths.overrides, join(staging, "overrides"));
  ensureDir(join(staging, "_generated"));
  ensureDir(join(staging, "_scratch"));
  writeFileSync(join(staging, "_generated", "README.md"), "# generated\n");
  writeFileSync(join(staging, "_scratch", "README.md"), "# scratch\n");
  writeFileSync(join(staging, "README.md"), `# production-mode transition staging ${plan.target_version}\n`);
  const issues = checkStagedVersion(staging);
  if (issues.length > 0) throw new Error(`transition target staging is invalid: ${issues.join("; ")}`);
  return Object.freeze({ reservation, staging, target });
}

function publishTarget(source, candidate, plan, journal) {
  const staging = materializeStaging(source, candidate, plan, journal);
  try {
    const journalBytes = readFileSync(journalPathFor(source.sourceRunDir));
    if (sha256(journalBytes) !== sha256(canonicalBytes(journal))) throw new Error("transition journal bytes changed before publication");
    const receipt = {
      schema: SUCCESS_SCHEMA,
      transition_kind: plan.plan_kind,
      source_execution_id: plan.source_execution_id,
      source_version: plan.source_version,
      target_version: plan.target_version,
      target_mode: plan.target_mode,
      target_pipeline: plan.target_pipeline,
      plan_hash: plan.plan_hash,
      candidate_receipt_sha256: plan.candidate_receipt_sha256,
      target_intake_sha256: plan.target_intake_sha256,
      source_control_fingerprint: plan.candidate_receipt_sha256,
      target_source_sha256: plan.candidate_source_sha256,
      candidate_control_receipts: plan.candidate_control_receipts,
      needs_local_materialization: plan.deterministic_impact.needs_local_materialization,
      needs_render: plan.deterministic_impact.needs_render,
      needs_raw_generation: plan.deterministic_impact.needs_raw_generation,
      created_at_epoch_ms: Date.now(),
    };
    if (plan.plan_kind === LEGACY_ADOPTION_KIND) {
      receipt.adoption = {
        observation_sha256: plan.adoption.observation_sha256,
        source_state_sha256: plan.adoption.source_state_sha256,
        matrix_sha256: plan.adoption.matrix_sha256,
      };
    }
    const receiptPath = join(staging.staging, "_generated", "qa", "production_mode_transition.json");
    writeCanonicalNoReplace(receiptPath, receipt);
    if (existsSync(staging.target)) throw new Error("CONFLICT: transition target already exists");
    renameSync(staging.staging, staging.target);
    rmSync(staging.reservation, { recursive: true, force: true });
    return Object.freeze({ targetRunDir: staging.target, receiptPath: join(staging.target, "_generated", "qa", "production_mode_transition.json"), receipt });
  } catch (error) {
    // The journal owns these paths for the closed recovery operation. Keep it
    // intact until recovery can prove which source/target outcome occurred.
    throw error;
  }
}

export function prepareProductionModeTransition(runDir, { targetMode } = {}) {
  const source = sourceContext(runDir);
  if (!isProductionMode(targetMode)) throw new TypeError("prepare requires one canonical target production mode");
  if (targetMode === "image2-page-authority") throw new Error("Page Authority target requires explicit legacy adoption");
  if (productionPolicyForMode(targetMode).pipeline === source.sourcePipeline) throw new Error("same-pipeline mode changes must use the in-place transition");
  const paths = transitionPaths(source.sourceRunDir);
  if (existsSync(paths.plan) || existsSync(paths.journal)) throw new Error("CONFLICT: transition preview or apply is already active");
  ensureDir(paths.candidate);
  const target = { schema: TARGET_SCHEMA, target_mode: targetMode };
  const ledger = { schema: LEDGER_SCHEMA, source_version: source.sourceVersion, entries: sourceIdentityLedger(source.sourceBytes) };
  if (existsSync(paths.target)) {
    if (canonicalJson(readJson(paths.target, "transition target selection")) !== canonicalJson(target)) throw new Error("CONFLICT: existing transition candidate selects a different target mode");
  } else writeCanonicalNoReplace(paths.target, target);
  if (existsSync(paths.ledger)) {
    if (canonicalJson(readJson(paths.ledger, "transition identity ledger")) !== canonicalJson(ledger)) throw new Error("CONFLICT: existing transition identity ledger drifted");
  } else writeCanonicalNoReplace(paths.ledger, ledger);
  return Object.freeze({
    status: "prepared",
    source_version: source.sourceVersion,
    source_mode: source.sourceMode,
    anticipated_target_version: nextVersionName(source.sourceRunDir),
    target_mode: targetMode,
    target_pipeline: productionPolicyForMode(targetMode).pipeline,
    candidate_root: relativeRunPath(source.sourceRunDir, paths.candidate),
    next_action: "author target-owned slide-specifications.md, target-intake.json, and overrides/visual-style/color_palette.json in candidate-run",
  });
}

function prepareLegacyCandidate(source, observation) {
  assertRecognizedLegacyObservation(source, observation);
  const paths = transitionPaths(source.sourceRunDir);
  if (existsSync(paths.plan) || existsSync(paths.journal)) throw new Error("CONFLICT: transition preview or apply is already active");
  ensureDir(paths.candidate);
  const target = { schema: TARGET_SCHEMA, target_mode: "image2-page-authority" };
  const ledger = { schema: LEDGER_SCHEMA, source_version: source.sourceVersion, entries: sourceIdentityLedger(source.sourceBytes) };
  if (existsSync(paths.target)) {
    if (canonicalJson(readJson(paths.target, "transition target selection")) !== canonicalJson(target)) {
      throw new Error("CONFLICT: existing transition candidate selects a different target mode");
    }
  } else writeCanonicalNoReplace(paths.target, target);
  if (existsSync(paths.ledger)) {
    if (canonicalJson(readJson(paths.ledger, "transition identity ledger")) !== canonicalJson(ledger)) {
      throw new Error("CONFLICT: existing transition identity ledger drifted");
    }
  } else writeCanonicalNoReplace(paths.ledger, ledger);
  return Object.freeze({
    status: "prepared",
    plan_kind: LEGACY_ADOPTION_KIND,
    source_version: source.sourceVersion,
    source_mode: source.sourceMode,
    anticipated_target_version: nextVersionName(source.sourceRunDir),
    target_mode: target.target_mode,
    target_pipeline: PAGE_AUTHORITY_IMAGE2_PIPELINE,
    observation_sha256: observation.observation_sha256,
    candidate_root: relativeRunPath(source.sourceRunDir, paths.candidate),
    next_action: "author Page Authority slide-specifications.md, target-intake.json, adoption-matrix.json, and overrides/visual-style/color_palette.json in candidate-run",
  });
}

export function prepareLegacyProtocolAdoption(runDir) {
  const source = sourceContext(runDir);
  const observation = inspectLegacyProtocol(source.sourceRunDir);
  if (!isRecognizedLegacyProtocol(observation)) {
    throw new Error(`legacy adoption requires recognized-legacy protocol; observed ${observation.classification}`);
  }
  return prepareLegacyCandidate(source, observation);
}

export function previewProductionModeTransition(runDir) {
  const source = sourceContext(runDir);
  const candidate = candidateState(source);
  if (candidate.status !== "complete") {
    return Object.freeze({
      schema: "pptmaker-production-mode-transition-guide-v1",
      status: candidate.status,
      source_version: source.sourceVersion,
      candidate_root: relativeRunPath(source.sourceRunDir, candidate.paths.candidate),
      missing: candidate.missing,
      next_action: "author the listed target-owned candidate fields, then rerun transition preview",
    });
  }
  const paths = transitionPaths(source.sourceRunDir);
  if (existsSync(paths.plan)) throw new Error("CONFLICT: transition preview already exists; prepare a fresh candidate after changes");
  const plan = previewPlan(source, candidate);
  writeCanonicalNoReplace(paths.plan, plan);
  return Object.freeze({
    ...plan,
    status: "previewed",
    needs_local_materialization: plan.deterministic_impact.needs_local_materialization,
    needs_render: plan.deterministic_impact.needs_render,
    next_action: "confirm the exact transition plan hash",
  });
}

export function previewLegacyProtocolAdoption(runDir) {
  const source = sourceContext(runDir);
  const observation = inspectLegacyProtocol(source.sourceRunDir);
  if (!isRecognizedLegacyProtocol(observation)) {
    throw new Error(`legacy adoption requires recognized-legacy protocol; observed ${observation.classification}`);
  }
  const candidate = candidateState(source, { kind: LEGACY_ADOPTION_KIND, observation });
  if (candidate.status !== "complete") {
    return Object.freeze({
      schema: "pptmaker-legacy-adoption-guide-v1",
      status: candidate.status,
      source_version: source.sourceVersion,
      candidate_root: relativeRunPath(source.sourceRunDir, candidate.paths.candidate),
      missing: candidate.missing,
      next_action: "author the listed Page Authority candidate fields, then rerun legacy adoption preview",
    });
  }
  const paths = transitionPaths(source.sourceRunDir);
  if (existsSync(paths.plan)) throw new Error("CONFLICT: transition preview already exists; prepare a fresh candidate after changes");
  const plan = previewPlan(source, candidate, { kind: LEGACY_ADOPTION_KIND });
  writeCanonicalNoReplace(paths.plan, plan);
  return Object.freeze({
    ...plan,
    status: "previewed",
    needs_raw_generation: plan.deterministic_impact.needs_raw_generation,
    next_action: "confirm the exact legacy adoption plan hash after reviewing the target intake and per-slide matrix",
  });
}

/** Reinspect a preview immediately before the state-owned confirmation write. */
export function inspectProductionModeTransitionConfirmation(runDir, { planHash } = {}) {
  if (!HEX_RE.test(planHash || "")) throw new TypeError("plan hash must be a 64-lowercase-hex SHA-256");
  const source = sourceContext(runDir);
  const plan = planFile(source.sourceRunDir);
  if (plan.plan_kind !== MODE_TRANSITION_KIND) throw new Error("transition preview belongs to explicit legacy adoption");
  if (plan.plan_hash !== planHash) throw new Error("transition confirmation does not match the current preview hash");
  const candidate = candidateState(source);
  if (candidate.status !== "complete") throw new Error("transition candidate authoring is incomplete");
  const currentPlan = previewPlan(source, candidate);
  if (!samePlan(plan, currentPlan)) throw new Error("transition preview inputs changed; prepare a fresh preview");
  if (existsSync(join(dirname(source.sourceRunDir), plan.target_version))) throw new Error("CONFLICT: anticipated transition target already exists");
  return Object.freeze({ ...plan, target_intake: candidate.intake, expected_state_sha256: sha256(readFileSync(join(source.deckDir, "_state", "state.yaml"))) });
}

export function inspectLegacyProtocolAdoptionConfirmation(runDir, { planHash } = {}) {
  if (!HEX_RE.test(planHash || "")) throw new TypeError("plan hash must be a 64-lowercase-hex SHA-256");
  const source = sourceContext(runDir);
  const observation = inspectLegacyProtocol(source.sourceRunDir);
  if (!isRecognizedLegacyProtocol(observation)) {
    throw new Error(`legacy adoption requires recognized-legacy protocol; observed ${observation.classification}`);
  }
  const plan = planFile(source.sourceRunDir);
  if (plan.plan_kind !== LEGACY_ADOPTION_KIND || plan.plan_hash !== planHash) {
    throw new Error("legacy adoption confirmation does not match the current preview hash");
  }
  const candidate = candidateState(source, { kind: LEGACY_ADOPTION_KIND, observation });
  if (candidate.status !== "complete") throw new Error("legacy adoption candidate authoring is incomplete");
  const currentPlan = previewPlan(source, candidate, { kind: LEGACY_ADOPTION_KIND });
  if (!samePlan(plan, currentPlan)) throw new Error("legacy adoption preview inputs changed; prepare a fresh preview");
  if (existsSync(join(dirname(source.sourceRunDir), plan.target_version))) throw new Error("CONFLICT: anticipated transition target already exists");
  return Object.freeze({ ...plan, target_intake: candidate.intake, expected_state_sha256: sha256(readFileSync(statePath(source.deckDir))) });
}

export function confirmPreparedProductionModeTransition(runDir, { planHash } = {}) {
  const inspection = inspectProductionModeTransitionConfirmation(runDir, { planHash });
  return confirmProductionModeTransition(resolve(runDir, "..", ".."), {
    sourceRunDir: resolve(runDir),
    sourceRunVersion: inspection.source_version,
    targetRunVersion: inspection.target_version,
    targetMode: inspection.target_mode,
    planHash: inspection.plan_hash,
    candidateReceiptSha256: inspection.candidate_receipt_sha256,
    targetIntake: inspection.target_intake,
    targetIntakeSha256: inspection.target_intake_sha256,
    expectedStateSha: inspection.expected_state_sha256,
  });
}

export function confirmPreparedLegacyProtocolAdoption(runDir, { planHash } = {}) {
  const inspection = inspectLegacyProtocolAdoptionConfirmation(runDir, { planHash });
  return confirmProductionModeTransition(resolve(runDir, "..", ".."), {
    sourceRunDir: resolve(runDir),
    sourceRunVersion: inspection.source_version,
    targetRunVersion: inspection.target_version,
    targetMode: inspection.target_mode,
    planHash: inspection.plan_hash,
    candidateReceiptSha256: inspection.candidate_receipt_sha256,
    targetIntake: inspection.target_intake,
    targetIntakeSha256: inspection.target_intake_sha256,
    transitionKind: LEGACY_ADOPTION_KIND,
    transitionAdoption: {
      observation_sha256: inspection.adoption.observation_sha256,
      source_state_sha256: inspection.adoption.source_state_sha256,
      matrix_sha256: inspection.adoption.matrix_sha256,
    },
    expectedStateSha: inspection.expected_state_sha256,
  });
}

function assertCandidateMatchesPlan(source, candidate, plan) {
  if (candidate.candidateReceiptSha256 !== plan.candidate_receipt_sha256 || candidate.intakeSha256 !== plan.target_intake_sha256 ||
    candidate.targetMode !== plan.target_mode || candidate.targetPipeline !== plan.target_pipeline || sha256(source.sourceBytes) !== plan.source_marker_sha256) {
    throw new Error("transition candidate or source inputs changed; prepare a fresh preview");
  }
  if (plan.plan_kind === LEGACY_ADOPTION_KIND &&
    (candidate.adoptionObservationSha256 !== plan.adoption.observation_sha256 ||
      candidate.adoptionMatrixSha256 !== plan.adoption.matrix_sha256 ||
      canonicalJson(candidate.adoptionMatrixRows) !== canonicalJson(plan.adoption.matrix_rows) ||
      candidate.pageAuthorityDefault !== plan.adoption.page_authority_default)) {
    throw new Error("legacy adoption candidate or observation inputs changed; prepare a fresh preview");
  }
}

function activeCandidateForPlan(source, plan) {
  if (plan.plan_kind === MODE_TRANSITION_KIND) {
    const candidate = candidateState(source);
    if (candidate.status !== "complete") throw new Error("transition candidate authoring is incomplete");
    assertCandidateMatchesPlan(source, candidate, plan);
    return candidate;
  }
  const observation = inspectLegacyProtocol(source.sourceRunDir);
  if (!isRecognizedLegacyProtocol(observation)) {
    throw new Error(`legacy adoption source is no longer recognized; observed ${observation.classification}`);
  }
  const candidate = candidateState(source, { kind: LEGACY_ADOPTION_KIND, observation });
  if (candidate.status !== "complete") throw new Error("legacy adoption candidate authoring is incomplete");
  assertCandidateMatchesPlan(source, candidate, plan);
  return candidate;
}

function applyTransition(runDir, { planHash, expectedKind } = {}) {
  if (!HEX_RE.test(planHash || "")) throw new TypeError("plan hash must be a 64-lowercase-hex SHA-256");
  const source = sourceContextFromActiveTransition(runDir);
  const plan = planFile(source.sourceRunDir);
  if (plan.plan_kind !== expectedKind) throw new Error("transition apply command does not match the active plan kind");
  if (plan.plan_hash !== planHash) throw new Error("transition apply plan hash does not match the preview plan");
  assertActivePlan(source, plan);
  const candidate = activeCandidateForPlan(source, plan);
  const existing = expectedSuccessReceipt(activeReceiptPath(source.sourceRunDir, plan.target_version), plan);
  if (existing) {
    const handoff = completeProductionModeTransitionHandoff(source.deckDir, { sourceRunVersion: source.sourceVersion, planHash: plan.plan_hash, receiptSha256: existing.sha256, sourceControlFingerprint: existing.receipt.source_control_fingerprint });
    const snapshot = journalSnapshot(source.sourceRunDir, plan);
    if (snapshot) removeJournalOwnedPaths(source.sourceRunDir, snapshot.journal);
    return Object.freeze({ status: "handoff-complete", publication: "already-visible", ...handoff });
  }
  if (journalSnapshot(source.sourceRunDir, plan)) throw new Error("CONFLICT: transition apply journal already exists; use the closed recovery operation");
  if (existsSync(join(dirname(source.sourceRunDir), plan.target_version))) throw new Error("CONFLICT: transition target exists without the exact success receipt");
  const journal = transitionJournal(source, plan);
  writeCanonicalNoReplace(journalPathFor(source.sourceRunDir), journal);
  const published = publishTarget(source, candidate, plan, journal);
  const receipt = expectedSuccessReceipt(published.receiptPath, plan);
  if (!receipt) throw new Error("transition success receipt is invalid after publication");
  const handoff = completeProductionModeTransitionHandoff(source.deckDir, {
    sourceRunVersion: source.sourceVersion,
    planHash: plan.plan_hash,
    receiptSha256: receipt.sha256,
    sourceControlFingerprint: receipt.receipt.source_control_fingerprint,
  });
  removeJournalOwnedPaths(source.sourceRunDir, journal);
  return Object.freeze({
    status: "published-and-handed-off",
    source_version: source.sourceVersion,
    target_version: plan.target_version,
    target_mode: plan.target_mode,
    plan_hash: plan.plan_hash,
    needs_local_materialization: receipt.receipt.needs_local_materialization,
    needs_render: receipt.receipt.needs_render,
    needs_raw_generation: receipt.receipt.needs_raw_generation || [],
    ...handoff,
  });
}

export function applyProductionModeTransition(runDir, { planHash } = {}) {
  return applyTransition(runDir, { planHash, expectedKind: MODE_TRANSITION_KIND });
}

export function applyLegacyProtocolAdoption(runDir, { planHash } = {}) {
  return applyTransition(runDir, { planHash, expectedKind: LEGACY_ADOPTION_KIND });
}

function sameHostOwnerIsLive(journal) {
  if (journal.owner_host !== hostname().trim().toLowerCase()) return null;
  try { process.kill(journal.owner_pid, 0); return true; }
  catch (error) { return error.code !== "ESRCH"; }
}

function revalidateRecoveryTakeover(sourceRunDir, plan, snapshot, ownerToken, expectedKind) {
  const source = sourceContextFromActiveTransition(sourceRunDir);
  const currentPlan = planFile(source.sourceRunDir);
  if (currentPlan.plan_kind !== expectedKind) throw new Error("transition recovery command does not match the active plan kind");
  if (!samePlan(currentPlan, plan)) throw new Error("CONFLICT: transition recovery plan changed before takeover");
  assertActivePlan(source, currentPlan);
  if (currentPlan.plan_kind === LEGACY_ADOPTION_KIND) activeCandidateForPlan(source, currentPlan);
  if (existsSync(join(dirname(source.sourceRunDir), currentPlan.target_version))) {
    throw new Error("CONFLICT: transition target became visible during recovery");
  }
  const currentSnapshot = journalSnapshot(source.sourceRunDir, currentPlan);
  if (!currentSnapshot || currentSnapshot.sha256 !== snapshot.sha256) {
    throw new Error("CONFLICT: transition recovery journal changed before takeover");
  }
  const age = Math.max(0, Date.now() - currentSnapshot.journal.claimed_at_epoch_ms);
  const ownerLive = sameHostOwnerIsLive(currentSnapshot.journal);
  if (ownerLive === true) throw new Error("CONFLICT: transition apply owner is still live");
  if (ownerLive === false) {
    if (age < SAME_HOST_RECOVERY_MS) throw new Error(`CONFLICT: transition apply owner recovery requires at least ${SAME_HOST_RECOVERY_MS - age} ms more`);
  } else {
    if (!ownerToken || ownerToken !== currentSnapshot.journal.owner_token) throw new Error("transition uncertain-owner recovery requires the exact owner token");
    if (age < UNCERTAIN_RECOVERY_MS) throw new Error(`CONFLICT: uncertain transition recovery requires at least ${UNCERTAIN_RECOVERY_MS - age} ms more`);
    const confirmation = verifyProductionModeTransitionRecoveryConfirmation(source.deckDir, {
      sourceRunVersion: source.sourceVersion,
      planHash: currentPlan.plan_hash,
      ownerToken,
    });
    if (!confirmation.ok) throw new Error(`transition recovery confirmation is required: ${confirmation.code}`);
  }
  return Object.freeze({
    source,
    plan: currentPlan,
    snapshot: currentSnapshot,
    state_sha256: sha256(readFileSync(statePath(source.deckDir))),
  });
}

function recoverTransition(runDir, { ownerToken = null, expectedKind } = {}) {
  if (ownerToken !== null && !HEX_RE.test(ownerToken)) throw new TypeError("recovery owner token must be a 64-lowercase-hex SHA-256");
  const source = sourceContextFromActiveTransition(runDir);
  const plan = planFile(source.sourceRunDir);
  if (plan.plan_kind !== expectedKind) throw new Error("transition recovery command does not match the active plan kind");
  assertActivePlan(source, plan);
  const receipt = expectedSuccessReceipt(activeReceiptPath(source.sourceRunDir, plan.target_version), plan);
  if (receipt) {
    const handoff = completeProductionModeTransitionHandoff(source.deckDir, { sourceRunVersion: source.sourceVersion, planHash: plan.plan_hash, receiptSha256: receipt.sha256, sourceControlFingerprint: receipt.receipt.source_control_fingerprint });
    const snapshot = journalSnapshot(source.sourceRunDir, plan);
    if (snapshot) removeJournalOwnedPaths(source.sourceRunDir, snapshot.journal);
    return Object.freeze({ status: "visible-target-handed-off", ...handoff });
  }
  if (existsSync(join(dirname(source.sourceRunDir), plan.target_version))) throw new Error("CONFLICT: visible transition target has no exact success receipt");
  const snapshot = journalSnapshot(source.sourceRunDir, plan);
  if (!snapshot) throw new Error("transition recovery requires an exact visible target receipt or apply journal");
  const age = Math.max(0, Date.now() - snapshot.journal.claimed_at_epoch_ms);
  const ownerLive = sameHostOwnerIsLive(snapshot.journal);
  if (ownerLive === true) throw new Error("CONFLICT: transition apply owner is still live");
  if (ownerLive === false) {
    if (age < SAME_HOST_RECOVERY_MS) throw new Error(`CONFLICT: transition apply owner recovery requires at least ${SAME_HOST_RECOVERY_MS - age} ms more`);
  } else {
    if (!ownerToken || ownerToken !== snapshot.journal.owner_token) throw new Error("transition uncertain-owner recovery requires the exact owner token");
    if (age < UNCERTAIN_RECOVERY_MS) throw new Error(`CONFLICT: uncertain transition recovery requires at least ${UNCERTAIN_RECOVERY_MS - age} ms more`);
    const confirmation = verifyProductionModeTransitionRecoveryConfirmation(source.deckDir, { sourceRunVersion: source.sourceVersion, planHash: plan.plan_hash, ownerToken });
    if (!confirmation.ok) throw new Error(`transition recovery confirmation is required: ${confirmation.code}`);
  }
  const takeover = revalidateRecoveryTakeover(source.sourceRunDir, plan, snapshot, ownerToken, expectedKind);
  const restored = restoreProductionModeTransitionSource(takeover.source.deckDir, {
    sourceRunVersion: takeover.source.sourceVersion,
    planHash: takeover.plan.plan_hash,
    expectedStateSha: takeover.state_sha256,
  });
  const finalSnapshot = journalSnapshot(takeover.source.sourceRunDir, takeover.plan);
  if (!finalSnapshot || finalSnapshot.sha256 !== takeover.snapshot.sha256) {
    throw new Error("CONFLICT: transition recovery journal changed after source restoration");
  }
  removeJournalOwnedPaths(takeover.source.sourceRunDir, takeover.snapshot.journal);
  return restored;
}

export function recoverProductionModeTransition(runDir, { ownerToken = null } = {}) {
  return recoverTransition(runDir, { ownerToken, expectedKind: MODE_TRANSITION_KIND });
}

export function recoverLegacyProtocolAdoption(runDir, { ownerToken = null } = {}) {
  return recoverTransition(runDir, { ownerToken, expectedKind: LEGACY_ADOPTION_KIND });
}
