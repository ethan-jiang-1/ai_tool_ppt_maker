import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { hostname } from 'node:os';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { canonicalJson, canonicalJsonSha256 } from '../../../contracts/canonical_json.mjs';
import {
  classifyHtmlOwnerLiveness,
  classifyHtmlPublishLock,
  readHtmlPreviewManifest,
  resolveHtmlFinalSlideArtifacts,
} from './html_review_storage.mjs';
import { HTML_FIRST_PIPELINE, probeProductionMarker } from '../../run-bundle/production_marker.mjs';
import { parseHtmlSourceAstV1 } from '../../../contracts/html_source_ast.mjs';
import { buildPlaybookIndex, resolveNode } from '../md_controller_reader.mjs';
import {
  prepareStateWrite,
  readState,
  statePath,
  writeState,
} from '../state.mjs';
import {
  buildHtmlReviewPlan,
  htmlReviewCurrentProjectionV1,
} from '../../../contracts/html_review_projection.mjs';
import {
  assemblyReceiptPath,
  notesReceiptPath,
  validateNotesCompletionReceipt,
  validatePptxAssemblyReceipt,
} from '../../identity/notes_receipt.mjs';
import { sha256File } from '../../identity/byte_hash.mjs';

const SHA_RE = /^[0-9a-f]{64}$/;
const VERSION_RE = /^v[1-9][0-9]*$/;
const GATES = new Set(['content', 'visual']);
const DECISIONS = new Set(['proceed', 'repair', 'redirect']);
const JOURNAL_SCHEMA = 'pptmaker-html-gate-approval-journal-v1';
const RESET_SCHEMA = 'pptmaker-html-production-reset-v1';
const GATE_SCHEMA_V1 = 'pptmaker-html-gate-review-v1';
const GATE_SCHEMA_V2 = 'pptmaker-html-gate-review-v2';
const DELIVERY_SCHEMA_V1 = 'pptmaker-html-delivery-review-v1';
const DELIVERY_SCHEMA_V2 = 'pptmaker-html-delivery-review-v2';
const JOURNAL_FILE = 'gate-approval-journal.json';
const WAIVED_CHECK_CODE_RE = /^[a-z][a-z0-9_]{0,63}$/;
const WAIVED_CHECK_SUBJECT_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const WAIVED_CHECK_SUBJECT_KINDS = new Set(['gate', 'slide', 'recipe', 'artifact', 'receipt']);
export const GATE_JOURNAL_AUTO_RECOVERY_MIN_AGE_MS = 60_000;
export const GATE_JOURNAL_EXPLICIT_RECOVERY_MIN_AGE_MS = 300_000;
export const RESET_AUTO_RECOVERY_MIN_AGE_MS = 60_000;
export const RESET_EXPLICIT_RECOVERY_MIN_AGE_MS = 300_000;

function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function randomToken() { return randomBytes(32).toString('hex'); }
function nowIso(now = Date.now()) { return new Date(now).toISOString(); }
function exactKeys(value, keys) {
  const actual = Object.keys(value || {});
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}
function relativePath(root, path) { return relative(root, path).split(sep).join('/'); }

function versionContext(trusted) {
  if (!trusted || trusted.schema !== 'pptmaker-html-review-trusted-context-v1') throw new TypeError('trusted HTML review context is required');
  const run = resolve(trusted.run);
  const runVersion = basename(run);
  if (!VERSION_RE.test(runVersion)) throw new Error('HTML review requires a normalized vN run directory');
  const root = resolve(trusted.root);
  const source = join(run, 'slide-specifications.md');
  if (!existsSync(source)) throw new Error('HTML review source is missing');
  const marker = probeProductionMarker(readFileSync(source), { source: 'slide-specifications.md' });
  if (marker.branch !== HTML_FIRST_PIPELINE) throw new Error('HTML review is branch-inapplicable for this run');
  return {
    run,
    root,
    runVersion,
    versionKey: `3_versions/${runVersion}`,
    stateFile: statePath(root),
    metadataFile: trusted.metadataFile,
    canonicalPptxPath: trusted.canonicalPptxPath,
    journalFile: join(root, '_state', JOURNAL_FILE),
    htmlProductionRoot: trusted.htmlProductionRoot,
    htmlOwnerRoot: trusted.htmlOwnerRoot,
  };
}

function loadCurrentHtmlPlan(runDir, planPath) {
  const sourcePath = join(runDir, 'slide-specifications.md');
  if (!existsSync(planPath)) throw new Error('current HTML slide plan is missing');
  return parseHtmlSourceAstV1({ sourceBytes: readFileSync(sourcePath), planBytes: readFileSync(planPath) }).plan;
}

function rawVersionRecord(state, id, context) {
  return state?.nodes?.[id]?.by_version?.[context.versionKey] || null;
}

function versionRecord(state, id, context) {
  const record = rawVersionRecord(state, id, context);
  return record?.run_version === context.runVersion ? record : null;
}

function canonicalWaivedChecks(value) {
  if (!Array.isArray(value) || value.length > 64) return null;
  const checks = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) || Object.keys(entry).length !== 2 || !Object.hasOwn(entry, 'code') || !Object.hasOwn(entry, 'subject') || !WAIVED_CHECK_CODE_RE.test(entry.code || '')) return null;
    let subject = null;
    if (entry.subject !== null) {
      if (!entry.subject || typeof entry.subject !== 'object' || Array.isArray(entry.subject) || Object.keys(entry.subject).length !== 2 || !WAIVED_CHECK_SUBJECT_KINDS.has(entry.subject.kind) || !WAIVED_CHECK_SUBJECT_ID_RE.test(entry.subject.id || '')) return null;
      subject = { kind: entry.subject.kind, id: entry.subject.id };
    }
    checks.push({ code: entry.code, subject });
  }
  const sorted = checks.sort((left, right) => {
    const leftKey = `${left.code}\u0000${left.subject?.kind || ''}\u0000${left.subject?.id || ''}`;
    const rightKey = `${right.code}\u0000${right.subject?.kind || ''}\u0000${right.subject?.id || ''}`;
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  });
  if (sorted.some((entry, index) => index > 0 && canonicalJsonSha256(entry) === canonicalJsonSha256(sorted[index - 1]))) return null;
  return Object.freeze(sorted.map((entry) => Object.freeze({ code: entry.code, subject: entry.subject ? Object.freeze(entry.subject) : null })));
}

function waivedCheck(code, subject = null) {
  return { code, subject };
}

function boundedWaivedChecksFromPlan(gate, planResult) {
  const checks = [];
  for (const outstanding of planResult?.plan?.outstanding || []) {
    const [prefix, subject] = String(outstanding).split(':', 2);
    if (['effective', 'forced-fallback'].includes(prefix) && WAIVED_CHECK_SUBJECT_ID_RE.test(subject || '')) {
      checks.push(waivedCheck('shown_artifact_missing', { kind: 'slide', id: subject }));
    } else if (prefix === 'incomplete-final-slide-set') {
      checks.push(waivedCheck('composition_incomplete', { kind: 'gate', id: gate }));
    } else {
      checks.push(waivedCheck('review_evidence_incomplete', { kind: 'gate', id: gate }));
    }
  }
  for (const item of planResult?.mismatches || []) {
    const subject = item.slide_id && WAIVED_CHECK_SUBJECT_ID_RE.test(item.slide_id)
      ? { kind: 'slide', id: item.slide_id }
      : { kind: 'gate', id: gate };
    checks.push(waivedCheck(item.path?.startsWith('shown_artifacts') ? 'artifact_currentness' : 'review_projection_stale', subject));
  }
  if (!checks.length) checks.push(waivedCheck('review_evidence_incomplete', { kind: 'gate', id: gate }));
  const normalized = canonicalWaivedChecks(checks);
  if (!normalized) throw new Error('failed to construct bounded waiver checks');
  return normalized;
}

function gateRecordEvidenceKeys(gate) {
  return gate === 'content'
    ? ['content_review_fingerprint', 'ordered_plan_digest']
    : ['visual_system_fingerprint', 'component_recipe_coverage', 'page_visual_dependencies', 'shown_artifacts'];
}

function normalizeGateRecord(record, gate, context) {
  if (!record || typeof record !== 'object' || Array.isArray(record) || record.gate !== gate || record.pipeline !== HTML_FIRST_PIPELINE || record.run_version !== context.runVersion || record.html_production_reset_id === undefined || !['approved', 'waived'].includes(record.status)) return null;
  const common = ['schema', 'gate', 'pipeline', 'run_version', 'status', 'waiver_reason', 'review_plan_hash', 'html_production_reset_id'];
  const audit = gateRecordEvidenceKeys(gate);
  if (record.schema === GATE_SCHEMA_V1) {
    const keys = [...common, ...audit, 'decided_at'];
    if (!exactKeys(record, keys) || (record.status === 'approved' ? record.waiver_reason !== null : typeof record.waiver_reason !== 'string' || !record.waiver_reason) || !SHA_RE.test(record.review_plan_hash || '')) return null;
    return Object.freeze({ record, schema: 1, evidence_complete: true, waived_checks: Object.freeze([]) });
  }
  if (record.schema !== GATE_SCHEMA_V2) return null;
  const keys = [...common, 'evidence_complete', 'waived_checks', ...audit, 'decided_at'];
  const checks = canonicalWaivedChecks(record.waived_checks);
  if (!checks) return null;
  const invalidApproved = record.status === 'approved' && (
    record.waiver_reason !== null ||
    record.evidence_complete !== true ||
    checks.length !== 0 ||
    !SHA_RE.test(record.review_plan_hash || '')
  );
  const invalidWaived = record.status === 'waived' && (
    typeof record.waiver_reason !== 'string' ||
    !record.waiver_reason ||
    (record.evidence_complete === false && checks.length === 0) ||
    (record.review_plan_hash !== null && !SHA_RE.test(record.review_plan_hash || ''))
  );
  if (!exactKeys(record, keys) || typeof record.evidence_complete !== 'boolean' || invalidApproved || invalidWaived) return null;
  return Object.freeze({ record, schema: 2, evidence_complete: record.evidence_complete, waived_checks: checks });
}

function validResetRecord(record, context) {
  if (!record) return false;
  return exactKeys(record, [
    'schema', 'pipeline', 'run_version', 'html_production_reset_id', 'status', 'started_at',
    'completed_at', 'owner_token', 'owner_host', 'owner_pid', 'owner_claimed_at_epoch_ms',
  ]) && record.schema === RESET_SCHEMA && record.pipeline === HTML_FIRST_PIPELINE &&
    record.run_version === context.runVersion && SHA_RE.test(record.html_production_reset_id || '') &&
    SHA_RE.test(record.owner_token || '') && typeof record.owner_host === 'string' && record.owner_host &&
    Number.isInteger(record.owner_pid) && record.owner_pid > 0 && Number.isFinite(record.owner_claimed_at_epoch_ms) &&
    ['deletion_pending', 'complete'].includes(record.status) &&
    typeof record.started_at === 'string' && !Number.isNaN(Date.parse(record.started_at)) &&
    ((record.status === 'deletion_pending' && record.completed_at === null) ||
      (record.status === 'complete' && typeof record.completed_at === 'string' && !Number.isNaN(Date.parse(record.completed_at))));
}

function currentReset(state, context) {
  const record = state?.nodes?.['html-production-reset']?.by_version?.[context.versionKey] || null;
  if (!record) return { id: null, status: 'absent', record: null };
  if (!validResetRecord(record, context)) throw new Error('HTML production reset record is invalid');
  return { id: record.html_production_reset_id, status: record.status, record };
}

function readStateSnapshot(context, { purpose = 'observe', heal = true } = {}) {
  const state = readState(context.root, { purpose, heal });
  if (state?.replacement_required) throw new Error(`replacement_required: ${state.reason}`);
  if (state?.corrupted) throw new Error('HTML review state is unreadable');
  if (!existsSync(context.stateFile)) throw new Error('replacement_required: HTML authoritative state is missing');
  const bytes = readFileSync(context.stateFile);
  return { state, bytes, sha256: sha256(bytes) };
}

function mismatchSummary(value) {
  if (value == null) return 'null';
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') return Number.isFinite(value) ? 'number' : 'non-finite';
  if (typeof value === 'string') return SHA_RE.test(value) ? `sha256:${value.slice(0, 12)}` : 'string';
  if (Array.isArray(value)) return `array:${value.length}`;
  return typeof value === 'object' ? `object:${Object.keys(value).length}` : typeof value;
}

function mismatch(path, expected, actual, { kind = 'gate', slideId = null, recipeKey = null } = {}) {
  return Object.freeze({
    path,
    kind,
    expected: mismatchSummary(expected),
    actual: mismatchSummary(actual),
    ...(slideId ? { slide_id: slideId } : {}),
    ...(recipeKey ? { recipe_key: recipeKey } : {}),
    next_action: 'rerun_local_review',
  });
}

function invalidPlan(reason, plan = null, mismatches = []) {
  return { valid: false, reason, plan, mismatches: Object.freeze(mismatches) };
}

function resolveConfinedRunArtifact(context, value, field, ownerKind) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.startsWith('/') || value.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new Error(`${field} is not a confined relative path`);
  }
  const ownerRoot = resolve(context.htmlOwnerRoot(ownerKind));
  const path = [resolve(context.run, ...value.split('/')), resolve(ownerRoot, ...value.split('/'))].find((candidate) => {
    const local = relative(ownerRoot, candidate).split(sep).join('/');
    return local.startsWith('objects/');
  });
  if (!path) throw new Error(`${field} is outside its HTML owner`);
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${field} is not a regular owner object`);
  return path;
}

function resolveVisualComposition(context, reviewPlan) {
  if (!Array.isArray(reviewPlan.shown_artifacts)) {
    return { valid: false, composition: null, mismatches: [mismatch('shown_artifacts', 'array', reviewPlan.shown_artifacts)] };
  }
  const entries = [];
  const mismatches = [];
  for (const entry of reviewPlan.shown_artifacts) {
    const slideId = typeof entry?.slide_id === 'string' ? entry.slide_id : null;
    const variant = entry?.composition_variant;
    if (!slideId || !['effective', 'forced-fallback'].includes(variant)) {
      mismatches.push(mismatch('shown_artifacts[]', 'slide_id + composition_variant', entry, { kind: 'slide', slideId }));
      continue;
    }
    for (const [field, declared, ownerKind] of [
      ['path', entry.path, 'final-slides'],
      ['page_path', entry.page_path, 'html-pages'],
    ]) {
      const declaredSha = field === 'path' ? entry.sha256 : entry.page_sha256;
      if (field === 'page_path' && declared === null && declaredSha === null) continue;
      if (!SHA_RE.test(declaredSha || '')) {
        mismatches.push(mismatch(`shown_artifacts.${field}.sha256`, 'sha256', declaredSha, { kind: 'artifact', slideId }));
        continue;
      }
      let path;
      try { path = resolveConfinedRunArtifact(context, declared, `shown_artifacts.${field}`, ownerKind); }
      catch { mismatches.push(mismatch(`shown_artifacts.${field}`, 'confined path', declared, { kind: 'artifact', slideId })); continue; }
      if (!existsSync(path)) {
        mismatches.push(mismatch(`shown_artifacts.${field}`, 'present file', null, { kind: 'artifact', slideId }));
        continue;
      }
      const actualSha = sha256(readFileSync(path));
      if (actualSha !== declaredSha) {
        mismatches.push(mismatch(`shown_artifacts.${field}.sha256`, declaredSha, actualSha, { kind: 'artifact', slideId }));
      }
    }
    entries.push({
      slide_id: slideId,
      composition_variant: variant,
      png_sha256: entry.sha256,
      html_sha256: entry.page_sha256,
      review_object_path: entry.path,
      review_page_object_path: entry.page_path,
    });
  }
  return { valid: mismatches.length === 0, composition: { final_slides: entries }, mismatches };
}

function reviewProjectionMismatches(actual, expected) {
  const mismatches = [];
  const keys = [...new Set([...Object.keys(actual), ...Object.keys(expected)])].sort();
  for (const key of keys) {
    if (canonicalJsonSha256(actual[key]) !== canonicalJsonSha256(expected[key])) {
      mismatches.push(mismatch(`review_projection.${key}`, expected[key], actual[key]));
    }
  }
  return mismatches;
}

function readCurrentPlan(context, ownerRoot, reference, expectedKind, currentPlan, expectedResetId, expectedVersion, { requireComplete = true } = {}) {
  if (!reference) return invalidPlan('missing current review plan');
  if (typeof reference.path !== 'string' || !reference.path.startsWith('plans/') || reference.path.includes('\\') || reference.path.split('/').some((part) => !part || part === '.' || part === '..')) {
    return invalidPlan('review plan path is invalid');
  }
  const path = join(ownerRoot, ...reference.path.split('/'));
  if (!existsSync(path)) return invalidPlan('current review plan bytes are missing');
  let plan;
  try { plan = JSON.parse(readFileSync(path, 'utf8')); } catch { return invalidPlan('current review plan JSON is invalid'); }
  const { plan_hash: planHash, ...hashBody } = plan;
  if (plan.schema !== 'pptmaker-html-review-plan-v1' || plan.kind !== expectedKind ||
      planHash !== canonicalJsonSha256(hashBody) || planHash !== basename(reference.path, '.json') ||
      plan.pipeline !== HTML_FIRST_PIPELINE || plan.publication_scope !== 'canonical-run' ||
      plan.html_production_reset_id !== expectedResetId || plan.logical_run_version !== expectedVersion) {
    return invalidPlan('current review plan hash/schema/scope/reset is invalid', plan);
  }
  const compositionResult = expectedKind === 'visual'
    ? resolveVisualComposition(context, plan)
    : { valid: true, composition: null, mismatches: [] };
  if (!compositionResult.valid) return invalidPlan('shown composition evidence is missing or stale', plan, compositionResult.mismatches);
  const expected = buildHtmlReviewPlan({
    plan: currentPlan,
    composition: compositionResult.composition,
    kind: expectedKind,
    publicationScope: 'canonical-run',
    htmlProductionResetId: expectedResetId,
    logicalRunVersion: expectedVersion,
    compositionVariant: plan.composition_variant,
  });
  const projectionMismatches = reviewProjectionMismatches(
    htmlReviewCurrentProjectionV1(plan),
    htmlReviewCurrentProjectionV1(expected),
  );
  if (projectionMismatches.length) return invalidPlan('current review plan inputs are stale', plan, projectionMismatches);
  const evidenceComplete = plan.approvable === true && Array.isArray(plan.outstanding) && plan.outstanding.length === 0;
  if (requireComplete && !evidenceComplete) return invalidPlan('current review plan is incomplete', plan, [mismatch('approvable', true, plan.approvable)]);
  return { valid: true, reason: evidenceComplete ? 'current' : 'current-incomplete', plan, path, composition: compositionResult.composition, evidence_complete: evidenceComplete, mismatches: Object.freeze([]) };
}

function resolveCurrentReviewInputs(context, trustedContext, snapshot, gate, { reference = null, requireComplete = true } = {}) {
  if (!GATES.has(gate)) throw new TypeError('current review input gate is invalid');
  const reset = currentReset(snapshot.state, context);
  const currentPlan = loadCurrentHtmlPlan(context.run, trustedContext.planPath);
  const ownerRoot = context.htmlOwnerRoot('preview');
  const previewManifest = readHtmlPreviewManifest(ownerRoot, {
    publicationScope: 'canonical-run',
    htmlProductionResetId: reset.id,
    logicalRunVersion: context.runVersion,
  });
  const planReference = reference || previewManifest?.manifest.review_plans?.[gate] || null;
  const planResult = readCurrentPlan(context, ownerRoot, planReference, gate, currentPlan, reset.id, context.runVersion, { requireComplete });
  return Object.freeze({ reset, currentPlan, ownerRoot, previewManifest, planReference, planResult });
}

function currentGateAudit(currentPlan, gate, resetId, runVersion) {
  return buildHtmlReviewPlan({
    plan: currentPlan,
    kind: gate,
    publicationScope: 'canonical-run',
    htmlProductionResetId: resetId,
    logicalRunVersion: runVersion,
  });
}

function gateAuditMatches(record, audit, gate) {
  if (gate === 'content') {
    return record.content_review_fingerprint === audit.content_fingerprint &&
      record.ordered_plan_digest === audit.ordered_plan_digest;
  }
  return record.visual_system_fingerprint === audit.visual_system_fingerprint &&
    canonicalJsonSha256(record.page_visual_dependencies) === canonicalJsonSha256(audit.page_visual_dependencies);
}

function gateRecordCurrent(normalized, approvedPlan, currentPlan, gate, resetId, runVersion) {
  if (!normalized || normalized.record.html_production_reset_id !== resetId) return false;
  if (normalized.record.status === 'approved' || normalized.evidence_complete) {
    return Boolean(approvedPlan?.valid && gateAuditMatches(normalized.record, currentGateAudit(currentPlan, gate, resetId, runVersion), gate));
  }
  return normalized.record.status === 'waived' &&
    gateAuditMatches(normalized.record, currentGateAudit(currentPlan, gate, resetId, runVersion), gate);
}

function metadataBytes(context) {
  return existsSync(context.metadataFile) ? readFileSync(context.metadataFile) : Buffer.alloc(0);
}

function withMetadataMirrors(bytes, updates) {
  const lines = bytes.length ? bytes.toString('utf8').split('\n') : [];
  for (const [key, value] of Object.entries(updates)) {
    const index = lines.findIndex((line) => !line.trimStart().startsWith('#') && line.includes(':') && line.split(':', 1)[0].trim() === key);
    const replacement = `${key}: ${value}`;
    if (index >= 0) lines[index] = replacement;
    else lines.push(replacement);
  }
  return Buffer.from(`${lines.join('\n').trimEnd()}\n`, 'utf8');
}

function writeMetadataCas(context, bytes, expectedSha) {
  const old = metadataBytes(context);
  if (sha256(old) !== expectedSha) throw new Error('CONFLICT: metadata precondition changed');
  mkdirSync(dirname(context.metadataFile), { recursive: true });
  const temp = join(dirname(context.metadataFile), `.${basename(context.metadataFile)}.tmp-${process.pid}-${randomBytes(4).toString('hex')}`);
  writeFileSync(temp, bytes, { flag: 'wx', mode: 0o600 });
  try {
    if (sha256(metadataBytes(context)) !== expectedSha) throw new Error('CONFLICT: metadata changed before commit');
    renameSync(temp, context.metadataFile);
  } catch (error) { rmSync(temp, { force: true }); throw error; }
}

function validateJournal(record) {
  const keys = ['schema', 'owner_token', 'owner_host', 'owner_pid', 'created_at_epoch_ms', 'run_version', 'old_state_sha256', 'new_state_sha256', 'old_metadata_sha256', 'new_metadata_sha256'];
  if (!exactKeys(record, keys) || record.schema !== JOURNAL_SCHEMA || !SHA_RE.test(record.owner_token || '') ||
      typeof record.owner_host !== 'string' || !record.owner_host || !Number.isInteger(record.owner_pid) || record.owner_pid <= 0 ||
      !Number.isFinite(record.created_at_epoch_ms) || !VERSION_RE.test(record.run_version || '') ||
      ![record.old_state_sha256, record.new_state_sha256, record.old_metadata_sha256, record.new_metadata_sha256].every((value) => SHA_RE.test(value || ''))) {
    throw new Error('gate approval journal is invalid');
  }
  return record;
}

function readJournal(context) {
  if (!existsSync(context.journalFile)) return null;
  const bytes = readFileSync(context.journalFile);
  let record;
  try { record = validateJournal(JSON.parse(bytes.toString('utf8'))); } catch (error) { return { invalid: true, bytes, error: error.message }; }
  if (record.run_version !== context.runVersion) return { invalid: true, bytes, error: 'gate approval journal targets another run version' };
  return { record, bytes };
}

function journalPair(context, journal) {
  const stateSha = existsSync(context.stateFile) ? sha256(readFileSync(context.stateFile)) : sha256(Buffer.alloc(0));
  const metadataSha = sha256(metadataBytes(context));
  const stateSide = stateSha === journal.old_state_sha256 ? 'old' : stateSha === journal.new_state_sha256 ? 'new' : 'third';
  const metadataSide = metadataSha === journal.old_metadata_sha256 ? 'old' : metadataSha === journal.new_metadata_sha256 ? 'new' : 'third';
  if (stateSide === 'old' && metadataSide === 'old') return { mode: 'abort', stateSha, metadataSha };
  if (stateSide === 'new' && metadataSide === 'old') return { mode: 'mirror', stateSha, metadataSha };
  if (stateSide === 'new' && metadataSide === 'new') return { mode: 'cleanup', stateSha, metadataSha };
  if (stateSide === 'old' && metadataSide === 'new') return { mode: 'forbidden', stateSha, metadataSha };
  if (stateSide === 'third') {
    try {
      const snapshot = readStateSnapshot(context, { purpose: 'observe', heal: false });
      const reset = currentReset(snapshot.state, context);
      const stateMirrorsPending = snapshot.state?.gates?.html_content === 'pending' && snapshot.state?.gates?.html_visual === 'pending' &&
        snapshot.state?.gates?.html_content_run_version === context.runVersion && snapshot.state?.gates?.html_visual_run_version === context.runVersion;
      const metadata = withMetadataMirrors(metadataBytes(context), {} ).toString('utf8');
      const metadataPending = /(?:^|\n)html_content_gate:\s*pending(?:\n|$)/.test(metadata) && /(?:^|\n)html_visual_gate:\s*pending(?:\n|$)/.test(metadata);
      if (reset.status === 'deletion_pending' && stateMirrorsPending && (metadataSide === 'old' || metadataPending)) return { mode: 'reset-yield', stateSha, metadataSha };
    } catch { /* a malformed third state remains forbidden */ }
  }
  return { mode: 'forbidden', stateSha, metadataSha };
}

function classifyJournal(context, { now = Date.now(), host = hostname() } = {}) {
  const journal = readJournal(context);
  if (!journal) return { status: 'absent', journal: null, pair: null, liveness: null };
  if (journal.invalid) return { status: 'invalid', journal, pair: null, liveness: null };
  const pair = journalPair(context, journal.record);
  if (pair.mode === 'forbidden') return { status: 'forbidden', journal, pair, liveness: null };
  const liveness = classifyHtmlOwnerLiveness({
    host: journal.record.owner_host,
    pid: journal.record.owner_pid,
    created_at_epoch_ms: journal.record.created_at_epoch_ms,
  }, { now, host });
  if (liveness.status === 'invalid') return { status: 'invalid', journal, pair, liveness };
  if (liveness.status === 'uncertain') return { status: 'uncertain', journal, pair, liveness };
  if (liveness.status === 'active' || liveness.status === 'waiting') return { status: 'active', journal, pair, liveness };
  return { status: `recoverable-${pair.mode}`, journal, pair, liveness };
}

function publicJournal(classification) {
  const out = { status: classification.status };
  if (classification.journal?.record) out.owner_token = classification.journal.record.owner_token;
  return Object.freeze(out);
}

function publicReset(reset, { now = Date.now() } = {}) {
  if (!reset.record) return Object.freeze({ status: 'absent', ownership: 'none', retry_after_ms: null });
  if (reset.status === 'complete') return Object.freeze({ status: 'complete', ownership: 'none', retry_after_ms: null });
  const live = classifyHtmlOwnerLiveness({
    host: reset.record.owner_host,
    pid: reset.record.owner_pid,
    created_at_epoch_ms: reset.record.owner_claimed_at_epoch_ms,
  }, { now });
  const ownership = live.status === 'recoverable' ? 'recoverable' : live.status;
  return Object.freeze({
    status: 'deletion-pending',
    ownership,
    retry_after_ms: Number.isFinite(live.retry_after_ms) ? Math.max(0, live.retry_after_ms) : null,
  });
}

function deliveryEvidence(context, resetId, currentPlan) {
  const checks = [];
  const evidence = {
    valid: false,
    reviewable: false,
    evidence_complete: false,
    html_delivery_digest: null,
    contact_sheet_manifest_path: null,
    contact_sheet_manifest_sha256: null,
    contact_sheet_path: null,
    contact_sheet_sha256: null,
    assembly_receipt_path: null,
    assembly_receipt_sha256: null,
    pptx_path: null,
    pptx_sha256: null,
    notes_receipt_path: null,
    notes_receipt_sha256: null,
  };
  let finalSlides;
  try {
    finalSlides = resolveHtmlFinalSlideArtifacts({ runDir: context.run, ownerRoot: context.htmlOwnerRoot('final-slides'), plan: currentPlan, htmlProductionResetId: resetId });
    evidence.html_delivery_digest = finalSlides.html_delivery_digest;
  } catch {
    checks.push(waivedCheck('final_slide_lineage_missing', { kind: 'artifact', id: 'final-slides' }));
  }
  if (finalSlides) {
    try {
      const previewRoot = context.htmlOwnerRoot('preview');
      const preview = readHtmlPreviewManifest(previewRoot, { publicationScope: 'canonical-run', htmlProductionResetId: resetId, logicalRunVersion: context.runVersion });
      const contact = preview?.manifest?.contact_sheets?.delivery;
      if (!contact || contact.owner_digest !== finalSlides.html_delivery_digest) throw new Error('delivery contact does not match current final slides');
      const contactPath = join(previewRoot, ...contact.path.split('/'));
      evidence.contact_sheet_manifest_path = relativePath(context.run, preview.path);
      evidence.contact_sheet_manifest_sha256 = preview.sha256;
      evidence.contact_sheet_path = relativePath(context.run, contactPath);
      evidence.contact_sheet_sha256 = contact.sha256;
    } catch {
      checks.push(waivedCheck('delivery_contact_sheet_missing', { kind: 'artifact', id: 'delivery-contact-sheet' }));
    }
  }
  const orderedIds = currentPlan.slides.map((slide) => slide.slide_id);
  const assemblyLineage = validatePptxAssemblyReceipt(context.run, { requireCurrentPptx: false, expectedOrderedIds: orderedIds });
  const assemblyCurrent = validatePptxAssemblyReceipt(context.run, { requireCurrentPptx: true, expectedOrderedIds: orderedIds });
  const assemblyMatches = assemblyLineage.valid && assemblyLineage.receipt.schema_version === 2 && assemblyLineage.receipt.pipeline === HTML_FIRST_PIPELINE &&
    assemblyLineage.receipt.html_production_reset_id === resetId && assemblyLineage.receipt.html_delivery_digest === evidence.html_delivery_digest;
  if (assemblyMatches) {
    evidence.assembly_receipt_path = relativePath(context.run, assemblyReceiptPath(context.run));
    evidence.assembly_receipt_sha256 = sha256File(assemblyReceiptPath(context.run));
    if (assemblyCurrent.valid) {
      evidence.pptx_path = relativePath(context.run, assemblyCurrent.pptxPath);
      evidence.pptx_sha256 = sha256File(assemblyCurrent.pptxPath);
    }
  } else {
    checks.push(waivedCheck('assembly_lineage_missing', { kind: 'receipt', id: 'assembly-v2' }));
  }
  const notes = validateNotesCompletionReceipt(context.run);
  const notesMatches = notes.valid && notes.receipt.schema_version === 3 && notes.receipt.pipeline === HTML_FIRST_PIPELINE &&
    notes.receipt.html_production_reset_id === resetId && notes.receipt.html_delivery_digest === evidence.html_delivery_digest;
  if (notesMatches) {
    evidence.notes_receipt_path = relativePath(context.run, notesReceiptPath(context.run));
    evidence.notes_receipt_sha256 = sha256File(notesReceiptPath(context.run));
    evidence.pptx_path = relativePath(context.run, notes.pptxPath);
    evidence.pptx_sha256 = notes.receipt.pptx_sha256;
  } else {
    checks.push(waivedCheck('notes_lineage_missing', { kind: 'receipt', id: 'notes-v3' }));
  }
  if (!evidence.pptx_path && typeof context.canonicalPptxPath === 'string' && existsSync(context.canonicalPptxPath)) {
    evidence.pptx_path = relativePath(context.run, context.canonicalPptxPath);
    evidence.pptx_sha256 = sha256File(context.canonicalPptxPath);
  }
  evidence.reviewable = Boolean(evidence.html_delivery_digest && evidence.contact_sheet_path && evidence.contact_sheet_sha256 && evidence.pptx_path && evidence.pptx_sha256);
  evidence.evidence_complete = Boolean(evidence.reviewable && evidence.assembly_receipt_path && evidence.assembly_receipt_sha256 && evidence.notes_receipt_path && evidence.notes_receipt_sha256);
  evidence.valid = evidence.evidence_complete;
  evidence.waived_checks = evidence.evidence_complete ? Object.freeze([]) : (canonicalWaivedChecks(checks) || Object.freeze([waivedCheck('delivery_lineage_incomplete', { kind: 'gate', id: 'delivery' })]));
  evidence.reason = evidence.evidence_complete ? 'current' : evidence.reviewable ? 'delivery lineage is incomplete' : 'reviewable delivery artifacts are missing or stale';
  return evidence;
}

function normalizeDeliveryRecord(record, resetId, context) {
  if (!record || typeof record !== 'object' || Array.isArray(record) || record.pipeline !== HTML_FIRST_PIPELINE || record.run_version !== context.runVersion || record.html_production_reset_id !== resetId || !DECISIONS.has(record.decision)) return null;
  const v1 = ['schema', 'pipeline', 'run_version', 'html_production_reset_id', 'html_delivery_digest',
    'contact_sheet_manifest_path', 'contact_sheet_manifest_sha256', 'contact_sheet_path', 'contact_sheet_sha256',
    'assembly_receipt_path', 'assembly_receipt_sha256', 'pptx_sha256', 'notes_receipt_path',
    'notes_receipt_sha256', 'decision', 'reason', 'decided_at'];
  if (record.schema === DELIVERY_SCHEMA_V1) {
    if (!exactKeys(record, v1) || (record.decision === 'proceed' ? record.reason !== null : typeof record.reason !== 'string' || !record.reason)) return null;
    return Object.freeze({ record, schema: 1, evidence_complete: true, waived_checks: Object.freeze([]) });
  }
  const v2 = [...v1, 'pptx_path', 'evidence_complete', 'waived_checks'];
  const checks = canonicalWaivedChecks(record.waived_checks);
  if (!checks) return null;
  if (record.schema !== DELIVERY_SCHEMA_V2 || !exactKeys(record, v2) || typeof record.evidence_complete !== 'boolean' ||
      ((record.decision === 'repair' || record.decision === 'redirect') && (typeof record.reason !== 'string' || !record.reason || !record.evidence_complete)) ||
      (record.decision === 'proceed' && ((record.reason !== null && (typeof record.reason !== 'string' || !record.reason)) || (!record.evidence_complete && (typeof record.reason !== 'string' || !record.reason || checks.length === 0)))) ||
      (record.evidence_complete && checks.length !== 0) || !record.pptx_path || !SHA_RE.test(record.pptx_sha256 || '')) return null;
  return Object.freeze({ record, schema: 2, evidence_complete: record.evidence_complete, waived_checks: checks });
}

function deliveryRecordCurrent(normalized, evidence) {
  if (!normalized) return false;
  const record = normalized.record;
  const always = ['html_delivery_digest', 'contact_sheet_manifest_path', 'contact_sheet_manifest_sha256', 'contact_sheet_path', 'contact_sheet_sha256', 'pptx_path', 'pptx_sha256'];
  if (!evidence.reviewable || always.some((key) => record[key] !== evidence[key])) return false;
  if (normalized.evidence_complete) {
    return evidence.evidence_complete && ['assembly_receipt_path', 'assembly_receipt_sha256', 'notes_receipt_path', 'notes_receipt_sha256'].every((key) => record[key] === evidence[key]);
  }
  return record.decision === 'proceed' && ['assembly_receipt_path', 'assembly_receipt_sha256', 'notes_receipt_path', 'notes_receipt_sha256'].every((key) => record[key] === null || record[key] === evidence[key]);
}

export function normalizeHumanReason(reason) {
  const value = String(reason ?? '').replace(/\r\n?/g, '\n').trim();
  if (!value) throw new Error('human reason must be non-empty');
  if (/[\u0000-\u0008\u000b-\u001f\u007f]/.test(value)) throw new Error('human reason contains a forbidden control character');
  if (Buffer.byteLength(value, 'utf8') > 1024) throw new Error('human reason exceeds 1024 UTF-8 bytes');
  return value;
}

export function inspectHtmlReviewReadiness(trustedContext) {
  const context = versionContext(trustedContext);
  const snapshot = readStateSnapshot(context, { purpose: 'observe', heal: true });
  const reset = currentReset(snapshot.state, context);
  const journal = classifyJournal(context);
  const publicView = {
    pipeline: HTML_FIRST_PIPELINE,
    run_version: context.runVersion,
    state_present: true,
    content: { decision: 'pending', freshness: 'missing', review_required: true, evidence_complete: null, waived_checks: [] },
    visual: { decision: 'pending', freshness: 'missing', outstanding_recipe_keys: [], outstanding_slide_ids: [], evidence_complete: null, waived_checks: [] },
    delivery: { freshness: 'missing', decision: null, reason_present: false, evidence_complete: null, waived_checks: [] },
    reset: publicReset(reset),
    journal: publicJournal(journal),
  };
  const gates = {};
  let currentPlan = null;
  let previewManifest = null;
  if (reset.status !== 'deletion_pending') {
    try {
      const inputs = {};
      for (const gate of GATES) {
        const input = resolveCurrentReviewInputs(context, trustedContext, snapshot, gate);
        inputs[gate] = input;
        currentPlan ||= input.currentPlan;
        previewManifest ||= input.previewManifest;
        const planResult = input.planResult;
        const rawRecord = rawVersionRecord(snapshot.state, `html-${gate}-review`, context);
        const normalizedRecord = normalizeGateRecord(rawRecord, gate, context);
        const record = normalizedRecord?.record || null;
        const approvedPlan = SHA_RE.test(record?.review_plan_hash || '')
          ? resolveCurrentReviewInputs(context, trustedContext, snapshot, gate, {
            reference: { path: `plans/${record.review_plan_hash}.json` },
          }).planResult
          : { valid: false };
        const recordCurrent = gateRecordCurrent(normalizedRecord, approvedPlan, input.currentPlan, gate, reset.id, context.runVersion);
        gates[gate] = Object.freeze({
          ready: recordCurrent,
          plan: planResult.plan,
          plan_reason: planResult.reason,
          mismatches: planResult.mismatches || [],
          record: recordCurrent ? record : null,
        });
        publicView[gate].decision = record?.status === 'approved' || record?.status === 'waived' ? record.status : 'pending';
        publicView[gate].freshness = recordCurrent ? 'current' : rawRecord ? (normalizedRecord ? 'stale' : 'invalid') : planResult.plan ? 'missing' : 'missing';
        publicView[gate].evidence_complete = normalizedRecord?.schema === 1 && !recordCurrent
          ? null
          : normalizedRecord?.evidence_complete ?? null;
        publicView[gate].waived_checks = normalizedRecord?.record.status === 'waived' ? [...normalizedRecord.waived_checks] : [];
      }
      publicView.content.review_required = publicView.content.freshness !== 'current';
      const outstanding = inputs.visual?.planResult.plan?.outstanding || [];
      publicView.visual.outstanding_recipe_keys = [...new Set(outstanding.filter((item) => SHA_RE.test(item)))].sort();
      publicView.visual.outstanding_slide_ids = [...new Set(outstanding.map((item) => String(item).split(':').at(-1)).filter((item) => currentPlan.slides.some((slide) => slide.slide_id === item)))].sort();
      const evidence = deliveryEvidence(context, reset.id, currentPlan);
      const rawDeliveryRecord = rawVersionRecord(snapshot.state, 'html-delivery-review', context);
      const normalizedDeliveryRecord = normalizeDeliveryRecord(rawDeliveryRecord, reset.id, context);
      const deliveryRecord = normalizedDeliveryRecord?.record || null;
      const deliveryCurrent = deliveryRecordCurrent(normalizedDeliveryRecord, evidence);
      publicView.delivery = {
        freshness: deliveryCurrent ? 'current' : rawDeliveryRecord ? (normalizedDeliveryRecord ? 'stale' : 'invalid') : evidence.reviewable ? 'missing' : 'missing',
        decision: deliveryRecord && DECISIONS.has(deliveryRecord.decision) ? deliveryRecord.decision : null,
        reason_present: Boolean(deliveryRecord?.reason),
        evidence_complete: normalizedDeliveryRecord?.schema === 1 && !deliveryCurrent
          ? null
          : normalizedDeliveryRecord?.evidence_complete ?? null,
        waived_checks: deliveryRecord?.decision === 'proceed' && !normalizedDeliveryRecord?.evidence_complete ? [...normalizedDeliveryRecord.waived_checks] : [],
      };
      Object.defineProperty(publicView, '_delivery_evidence', { value: evidence, enumerable: false });
    } catch (error) {
      Object.defineProperty(publicView, '_inspection_error', { value: error.message, enumerable: false });
      const deliveryRecord = rawVersionRecord(snapshot.state, 'html-delivery-review', context);
      if (deliveryRecord) {
        publicView.delivery = {
          freshness: 'stale',
          decision: DECISIONS.has(deliveryRecord.decision) ? deliveryRecord.decision : null,
          reason_present: Boolean(deliveryRecord.reason),
          evidence_complete: null,
          waived_checks: [],
        };
      }
    }
  }
  const ready = Boolean(gates.content?.ready && gates.visual?.ready && journal.status === 'absent' && reset.status !== 'deletion_pending');
  Object.defineProperties(publicView, {
    ready: { value: ready, enumerable: false },
    conflict: { value: reset.status === 'deletion_pending' || !['absent'].includes(journal.status), enumerable: false },
    reason: { value: ready ? 'current' : reset.status === 'deletion_pending' ? 'html production reset is deletion_pending' : journal.status !== 'absent' ? `gate approval journal is ${journal.status}` : 'HTML content/visual review is pending or stale', enumerable: false },
    html_production_reset_id: { value: reset.id, enumerable: false },
    gates: { value: Object.freeze(gates), enumerable: false },
    preview_manifest: { value: previewManifest?.manifest || null, enumerable: false },
  });
  return Object.freeze(publicView);
}

function removeJournal(context, expectedBytes) {
  if (!existsSync(context.journalFile) || !readFileSync(context.journalFile).equals(expectedBytes)) throw new Error('CONFLICT: gate approval journal changed before cleanup');
  rmSync(context.journalFile, { force: false });
}

export function recoverHtmlGatePublication(trustedContext, { confirmedOwnerToken = null } = {}) {
  const context = versionContext(trustedContext);
  const classification = classifyJournal(context);
  if (classification.status === 'absent') return Object.freeze({ status: 'absent' });
  if (['invalid', 'forbidden'].includes(classification.status)) throw new Error(`CONFLICT: gate approval journal is ${classification.status}`);
  const { record } = classification.journal;
  const age = Date.now() - record.created_at_epoch_ms;
  const live = classifyHtmlOwnerLiveness({ host: record.owner_host, pid: record.owner_pid, created_at_epoch_ms: record.created_at_epoch_ms });
  if (live.status === 'active') throw new Error('CONFLICT: gate approval journal owner is still active');
  const automatic = live.status === 'recoverable' && age >= GATE_JOURNAL_AUTO_RECOVERY_MIN_AGE_MS;
  const explicit = confirmedOwnerToken === record.owner_token && age >= GATE_JOURNAL_EXPLICIT_RECOVERY_MIN_AGE_MS;
  if (!automatic && !explicit) throw new Error('CONFLICT: gate approval journal recovery requires owner age and exact confirmation');
  if (confirmedOwnerToken != null && confirmedOwnerToken !== record.owner_token) throw new Error('CONFLICT: gate approval journal owner token changed');
  const pair = journalPair(context, record);
  if (pair.mode === 'forbidden') throw new Error('CONFLICT: gate approval journal has an unbound state/metadata pair');
  if (pair.mode === 'mirror') {
    const oldMetadata = metadataBytes(context);
    const state = readStateSnapshot(context, { purpose: 'observe', heal: false }).state;
    const gate = ['content', 'visual'].find((name) => {
      const rec = versionRecord(state, `html-${name}-review`, context);
      if (!rec?.decided_at) return false;
      const candidate = withMetadataMirrors(oldMetadata, { [`html_${name}_gate`]: rec.status, [`html_${name}_gate_run_version`]: context.runVersion });
      return sha256(candidate) === record.new_metadata_sha256;
    });
    if (!gate) throw new Error('CONFLICT: journal new state has no matching HTML gate record');
    const recordGate = versionRecord(state, `html-${gate}-review`, context);
    const newMetadata = withMetadataMirrors(oldMetadata, { [`html_${gate}_gate`]: recordGate.status, [`html_${gate}_gate_run_version`]: context.runVersion });
    if (sha256(newMetadata) !== record.new_metadata_sha256) throw new Error('CONFLICT: journal metadata reconstruction differs');
    writeMetadataCas(context, newMetadata, record.old_metadata_sha256);
  }
  removeJournal(context, classification.journal.bytes);
  const status = pair.mode === 'abort' ? 'aborted' : pair.mode === 'mirror' ? 'mirror-completed' : pair.mode === 'reset-yield' ? 'reset-yield' : 'cleaned';
  return Object.freeze({ status });
}

export function publishHtmlGateDecision(trustedContext, { gate, planHash, status, waiverReason = null } = {}) {
  if (!GATES.has(gate) || !['approved', 'waived'].includes(status) ||
      (planHash != null && !SHA_RE.test(planHash))) throw new TypeError('invalid HTML gate decision');
  const reason = status === 'waived' ? normalizeHumanReason(waiverReason) : null;
  if (status === 'approved' && (waiverReason != null || !SHA_RE.test(planHash || ''))) throw new Error('approved HTML gate requires an exact plan hash and no waiver reason');
  const context = versionContext(trustedContext);
  recoverHtmlGatePublication(trustedContext);
  const snapshot = readStateSnapshot(context, { purpose: 'execute', heal: true });
  const reset = currentReset(snapshot.state, context);
  if (reset.status === 'deletion_pending') throw new Error('CONFLICT: HTML production reset is deletion_pending');
  const existingRecord = rawVersionRecord(snapshot.state, `html-${gate}-review`, context);
  if (existingRecord && !normalizeGateRecord(existingRecord, gate, context)) {
    throw new Error(`current HTML ${gate} review record is invalid or ambiguous`);
  }
  const inputs = resolveCurrentReviewInputs(context, trustedContext, snapshot, gate, { requireComplete: status === 'approved' });
  const planResult = inputs.planResult;
  if (status === 'approved' && (!planResult.valid || planResult.plan.plan_hash !== planHash)) {
    throw new Error(`HTML ${gate} review plan is missing, stale, or incomplete`);
  }
  if (status === 'waived' && planHash != null && (!planResult.valid || planResult.plan?.plan_hash !== planHash)) {
    throw new Error(`HTML ${gate} supplied waiver plan hash is missing, stale, or mismatched`);
  }
  const evidenceComplete = status === 'approved' || (planResult.valid && planResult.evidence_complete === true);
  const waivedChecks = status === 'waived'
    ? (evidenceComplete ? Object.freeze([]) : boundedWaivedChecksFromPlan(gate, planResult))
    : Object.freeze([]);
  const audit = planResult.plan || currentGateAudit(inputs.currentPlan, gate, reset.id, context.runVersion);
  const reviewPlanHash = status === 'approved'
    ? planHash
    : evidenceComplete
      ? planResult.plan?.plan_hash || null
      : planHash || null;
  const decidedAt = nowIso();
  const nextState = structuredClone(snapshot.state);
  delete nextState.durable_state_present;
  nextState.schema_version = 3;
  nextState.nodes ||= {};
  nextState.gates ||= {};
  const id = `html-${gate}-review`;
  const existing = nextState.nodes[id]?.by_version || {};
  nextState.nodes[id] = { by_version: { ...existing, [context.versionKey]: {
    schema: GATE_SCHEMA_V2,
    gate,
    pipeline: HTML_FIRST_PIPELINE,
    run_version: context.runVersion,
    status,
    waiver_reason: reason,
    review_plan_hash: reviewPlanHash,
    html_production_reset_id: reset.id,
    evidence_complete: evidenceComplete,
    waived_checks: [...waivedChecks],
    ...(gate === 'content' ? {
      content_review_fingerprint: audit.content_fingerprint,
      ordered_plan_digest: audit.ordered_plan_digest,
    } : {
      visual_system_fingerprint: audit.visual_system_fingerprint,
      component_recipe_coverage: audit.coverage,
      page_visual_dependencies: audit.page_visual_dependencies,
      shown_artifacts: audit.shown_artifacts,
    }),
    decided_at: decidedAt,
  } } };
  nextState.gates[`html_${gate}`] = status;
  nextState.gates[`html_${gate}_run_version`] = context.runVersion;
  const updatedAt = decidedAt;
  const prepared = prepareStateWrite(nextState, { updatedAt });
  const oldMetadata = metadataBytes(context);
  const newMetadata = withMetadataMirrors(oldMetadata, { [`html_${gate}_gate`]: status, [`html_${gate}_gate_run_version`]: context.runVersion });
  const createdAt = Date.now();
  const ownerHost = hostname();
  const ownerToken = canonicalJsonSha256({ owner_host: ownerHost, owner_pid: process.pid, created_at_epoch_ms: createdAt, run_version: context.runVersion, nonce: randomToken() });
  const journalRecord = {
    schema: JOURNAL_SCHEMA,
    owner_token: ownerToken,
    owner_host: ownerHost,
    owner_pid: process.pid,
    created_at_epoch_ms: createdAt,
    run_version: context.runVersion,
    old_state_sha256: snapshot.sha256,
    new_state_sha256: prepared.sha256,
    old_metadata_sha256: sha256(oldMetadata),
    new_metadata_sha256: sha256(newMetadata),
  };
  mkdirSync(dirname(context.journalFile), { recursive: true });
  writeFileSync(context.journalFile, `${canonicalJson(journalRecord)}\n`, { flag: 'wx', mode: 0o600 });
  const journalBytes = readFileSync(context.journalFile);
  try {
    writeState(context.root, nextState, { expectedStateSha: snapshot.sha256, journalOwnerToken: ownerToken, updatedAt });
    writeMetadataCas(context, newMetadata, sha256(oldMetadata));
    removeJournal(context, journalBytes);
  } catch (error) { throw error; }
  return Object.freeze({ gate, status, review_plan_hash: reviewPlanHash, run_version: context.runVersion, html_production_reset_id: reset.id, evidence_complete: evidenceComplete, waived_checks: waivedChecks });
}

export function publishHtmlDeliveryDecision(trustedContext, { decision, reason = null, force = false } = {}) {
  if (!DECISIONS.has(decision)) throw new TypeError('delivery decision must be proceed, repair, or redirect');
  if (typeof force !== 'boolean' || (force && decision !== 'proceed')) throw new Error('force is only valid for a proceed delivery decision');
  const normalizedReason = decision === 'proceed'
    ? (force ? normalizeHumanReason(reason) : null)
    : normalizeHumanReason(reason);
  if (decision === 'proceed' && !force && reason != null) throw new Error('proceed delivery decision cannot carry a reason without force');
  const context = versionContext(trustedContext);
  if (readJournal(context)) throw new Error('CONFLICT: gate approval journal fences delivery review');
  const snapshot = readStateSnapshot(context, { purpose: 'execute', heal: true });
  const reset = currentReset(snapshot.state, context);
  if (reset.status === 'deletion_pending') throw new Error('CONFLICT: HTML production reset is deletion_pending');
  const existingRecord = rawVersionRecord(snapshot.state, 'html-delivery-review', context);
  if (existingRecord && !normalizeDeliveryRecord(existingRecord, reset.id, context)) {
    throw new Error('current HTML delivery review record is invalid or ambiguous');
  }
  const currentPlan = loadCurrentHtmlPlan(context.run, trustedContext.planPath);
  const evidence = deliveryEvidence(context, reset.id, currentPlan);
  if ((decision !== 'proceed' || !force) && !evidence.valid) throw new Error(`HTML delivery evidence is missing or stale: ${evidence.reason}`);
  if (force && !evidence.reviewable) throw new Error(`HTML delivery reviewable artifacts are missing or stale: ${evidence.reason}`);
  const index = buildPlaybookIndex(resolve(dirname(new URL(import.meta.url).pathname), '..', '..', '..', '..', 'playbook'));
  const declaration = resolveNode(index, snapshot.state.playbook, snapshot.state.current_node);
  if (!declaration || !declaration.decisions.includes(decision)) throw new Error('current controller node does not declare this delivery decision');
  const active = snapshot.state.nodes?.[snapshot.state.current_node];
  if (!snapshot.state.execution_id || !active || active.execution_id !== snapshot.state.execution_id) throw new Error('current delivery-review node is not part of the active execution');
  const decidedAt = nowIso();
  const nextState = structuredClone(snapshot.state);
  delete nextState.durable_state_present;
  const prior = nextState.nodes?.['html-delivery-review']?.by_version || {};
  const deliveryRecord = {
    schema: DELIVERY_SCHEMA_V2,
    pipeline: HTML_FIRST_PIPELINE,
    run_version: context.runVersion,
    html_production_reset_id: reset.id,
    html_delivery_digest: evidence.html_delivery_digest,
    contact_sheet_manifest_path: evidence.contact_sheet_manifest_path,
    contact_sheet_manifest_sha256: evidence.contact_sheet_manifest_sha256,
    contact_sheet_path: evidence.contact_sheet_path,
    contact_sheet_sha256: evidence.contact_sheet_sha256,
    assembly_receipt_path: evidence.assembly_receipt_path,
    assembly_receipt_sha256: evidence.assembly_receipt_sha256,
    pptx_path: evidence.pptx_path,
    pptx_sha256: evidence.pptx_sha256,
    notes_receipt_path: evidence.notes_receipt_path,
    notes_receipt_sha256: evidence.notes_receipt_sha256,
    decision,
    reason: normalizedReason,
    evidence_complete: evidence.evidence_complete,
    waived_checks: force && !evidence.evidence_complete ? [...evidence.waived_checks] : [],
    decided_at: decidedAt,
  };
  nextState.nodes ||= {};
  nextState.nodes['html-delivery-review'] = { by_version: { ...prior, [context.versionKey]: deliveryRecord } };
  nextState.nodes[nextState.current_node] = {
    ...nextState.nodes[nextState.current_node],
    decision: {
      value: decision,
      kind: 'user',
      at: decidedAt,
      evidence_ref: { node_id: 'html-delivery-review', version_key: context.versionKey, decided_at: decidedAt },
      ...(normalizedReason == null ? {} : { note: normalizedReason }),
    },
  };
  if (decision === 'redirect' && nextState.playbook === 'create-deck') {
    for (const [nodeId, node] of Object.entries(nextState.nodes)) {
      if (nodeId.startsWith('html-') || nodeId === 'header-review' || nodeId === 'instantiation' || nodeId === 'checkpoint-intake' || nodeId === 'checkpoint-final-review') continue;
      if (node?.execution_id === nextState.execution_id) nextState.nodes[nodeId] = { status: 'pending', execution_id: nextState.execution_id, evidence: {} };
    }
    nextState.nodes['checkpoint-intake'] = { status: 'in_progress', execution_id: nextState.execution_id, evidence: {}, waiting_for: 'user:confirm-intake-after-redirect', started: decidedAt };
    nextState.current_node = 'checkpoint-intake';
  } else if (decision === 'redirect') {
    nextState.nodes[nextState.current_node].waiting_for = 'user:select-redirect-target';
  }
  writeState(context.root, nextState, { expectedStateSha: snapshot.sha256, updatedAt: decidedAt });
  return Object.freeze({
    decision,
    run_version: context.runVersion,
    freshness: 'current',
    evidence_complete: deliveryRecord.evidence_complete,
    waived_checks: Object.freeze([...deliveryRecord.waived_checks]),
  });
}

function hasCurrentAuthority(context, state, resetId) {
  for (const id of ['html-content-review', 'html-visual-review', 'html-delivery-review']) {
    if (versionRecord(state, id, context)?.html_production_reset_id === resetId) return true;
  }
  for (const path of [assemblyReceiptPath(context.run), notesReceiptPath(context.run)]) {
    if (!existsSync(path)) continue;
    try {
      const receipt = JSON.parse(readFileSync(path, 'utf8'));
      if (receipt.pipeline === HTML_FIRST_PIPELINE && receipt.html_production_reset_id === resetId) return true;
    } catch { /* invalid receipts do not establish authority */ }
  }
  return false;
}

function assertResetOwnerCanProceed(record, { allowExplicit = true } = {}) {
  const live = classifyHtmlOwnerLiveness({ host: record.owner_host, pid: record.owner_pid, created_at_epoch_ms: record.owner_claimed_at_epoch_ms });
  if (live.status === 'active') throw new Error('CONFLICT: HTML reset owner is still active');
  if (live.status === 'waiting') throw new Error(`CONFLICT: HTML reset recovery requires at least ${live.retry_after_ms} ms more`);
  if (live.status === 'invalid') throw new Error('CONFLICT: HTML reset owner record is invalid');
  if (live.status === 'uncertain' && (!allowExplicit || live.age_ms < RESET_EXPLICIT_RECOVERY_MIN_AGE_MS)) throw new Error('CONFLICT: HTML reset owner requires explicit recovery after 300000 ms');
  return live;
}

function assertOwnerPathSafe(ownerRoot) {
  if (!existsSync(ownerRoot)) return false;
  const stat = lstatSync(ownerRoot);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('canonical HTML production owner must be a real directory');
  return true;
}

function resetResult(status, context, resetId) {
  const result = { status, run_version: context.runVersion };
  Object.defineProperty(result, 'html_production_reset_id', { value: resetId, enumerable: false });
  return Object.freeze(result);
}

export function resetHtmlProduction(trustedContext, { confirmedRunVersion } = {}) {
  const context = versionContext(trustedContext);
  if (confirmedRunVersion !== context.runVersion) throw new Error('confirmedRunVersion must exactly match the target vN');
  if (readJournal(context)) {
    try { recoverHtmlGatePublication(trustedContext); } catch (error) { throw new Error(`CONFLICT: gate approval journal must be recovered before HTML reset: ${error.message}`); }
    if (readJournal(context)) throw new Error('CONFLICT: gate approval journal must be recovered before HTML reset');
  }
  const snapshot = readStateSnapshot(context, { purpose: 'execute', heal: true });
  let reset = currentReset(snapshot.state, context);
  const ownerRoot = context.htmlProductionRoot;
  const ownerExists = assertOwnerPathSafe(ownerRoot);
  const authority = hasCurrentAuthority(context, snapshot.state, reset.id);
  if (!reset.record && !ownerExists && !authority) return resetResult('no-reset-needed', context, null);
  if (reset.status === 'complete' && !ownerExists && !authority) return resetResult('already-complete', context, reset.id);
  for (const ownerKind of ['html-pages', 'final-slides', 'preview']) {
    const classification = classifyHtmlPublishLock(context.htmlOwnerRoot(ownerKind));
    if (classification.status === 'active') throw new Error(`CONFLICT: active ${ownerKind} publication blocks HTML reset`);
    if (classification.status === 'uncertain' && classification.age_ms >= RESET_EXPLICIT_RECOVERY_MIN_AGE_MS) continue;
    if (['waiting', 'uncertain', 'invalid'].includes(classification.status)) throw new Error(`CONFLICT: active or uncertain ${ownerKind} publication blocks HTML reset`);
  }
  let state = structuredClone(snapshot.state);
  delete state.durable_state_present;
  let expectedSha = snapshot.sha256;
  let ownerToken;
  let resultStatus;
  if (reset.status === 'deletion_pending') {
    assertResetOwnerCanProceed(reset.record);
    ownerToken = randomToken();
    const claimedAt = Date.now();
    const claimed = { ...reset.record, owner_token: ownerToken, owner_host: hostname(), owner_pid: process.pid, owner_claimed_at_epoch_ms: claimedAt };
    state.nodes['html-production-reset'].by_version[context.versionKey] = claimed;
    const updatedAt = nowIso(claimedAt);
    writeState(context.root, state, { expectedStateSha: expectedSha, resetOwnerToken: reset.record.owner_token, updatedAt });
    expectedSha = sha256(readFileSync(context.stateFile));
    reset = { id: claimed.html_production_reset_id, status: claimed.status, record: claimed };
    resultStatus = 'resumed';
  } else {
    const started = Date.now();
    ownerToken = randomToken();
    const resetId = randomToken();
    const record = {
      schema: RESET_SCHEMA,
      pipeline: HTML_FIRST_PIPELINE,
      run_version: context.runVersion,
      html_production_reset_id: resetId,
      status: 'deletion_pending',
      started_at: nowIso(started),
      completed_at: null,
      owner_token: ownerToken,
      owner_host: hostname(),
      owner_pid: process.pid,
      owner_claimed_at_epoch_ms: started,
    };
    const prior = state.nodes?.['html-production-reset']?.by_version || {};
    state.nodes ||= {};
    state.nodes['html-production-reset'] = { by_version: { ...prior, [context.versionKey]: record } };
    state.gates ||= {};
    state.gates.html_content = 'pending';
    state.gates.html_visual = 'pending';
    state.gates.html_content_run_version = context.runVersion;
    state.gates.html_visual_run_version = context.runVersion;
    writeState(context.root, state, { expectedStateSha: expectedSha, resetOwnerToken: ownerToken, updatedAt: nowIso(started) });
    expectedSha = sha256(readFileSync(context.stateFile));
    reset = { id: resetId, status: 'deletion_pending', record };
    resultStatus = 'started';
  }
  const oldMetadata = metadataBytes(context);
  const pendingMetadata = withMetadataMirrors(oldMetadata, {
    html_content_gate: 'pending',
    html_content_gate_run_version: context.runVersion,
    html_visual_gate: 'pending',
    html_visual_gate_run_version: context.runVersion,
  });
  if (readJournal(context)) throw new Error('CONFLICT: gate approval journal appeared during HTML reset');
  writeMetadataCas(context, pendingMetadata, sha256(oldMetadata));
  const ownerState = readStateSnapshot(context, { purpose: 'observe', heal: false });
  const pending = currentReset(ownerState.state, context);
  if (pending.status !== 'deletion_pending' || pending.id !== reset.id || pending.record.owner_token !== ownerToken || ownerState.sha256 !== expectedSha) throw new Error('CONFLICT: HTML reset ownership changed before deletion');
  try {
    if (existsSync(ownerRoot)) {
      assertOwnerPathSafe(ownerRoot);
      rmSync(ownerRoot, { recursive: true, force: false });
    }
  } catch (error) { throw new Error(`HTML production reset deletion failed with deletion_pending preserved: ${error.message}`); }
  if (existsSync(ownerRoot)) throw new Error('HTML production reset deletion did not remove the canonical owner');
  const finalSnapshot = readStateSnapshot(context, { purpose: 'observe', heal: false });
  const finalPending = currentReset(finalSnapshot.state, context);
  if (finalPending.status !== 'deletion_pending' || finalPending.id !== reset.id || finalPending.record.owner_token !== ownerToken) throw new Error('CONFLICT: HTML reset ownership changed before completion');
  const completedAt = nowIso();
  finalPending.record.status = 'complete';
  finalPending.record.completed_at = completedAt;
  writeState(context.root, finalSnapshot.state, { expectedStateSha: finalSnapshot.sha256, resetOwnerToken: ownerToken, updatedAt: completedAt });
  return resetResult(resultStatus, context, reset.id);
}
