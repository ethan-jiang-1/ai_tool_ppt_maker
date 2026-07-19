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
import { canonicalJson, canonicalJsonSha256 } from './canonical_json.mjs';
import { deckRoot, METADATA_FILE } from '../bundle_layout.mjs';
import {
  classifyHtmlOwnerLiveness,
  classifyHtmlPublishLock,
  htmlOwnerRoot,
  htmlProductionRoot,
  readHtmlPreviewManifest,
} from './html_object_store.mjs';
import { HTML_FIRST_PIPELINE, probeProductionMarker, validateAndBuildHtmlFirstPlan } from './html_slide_contract.mjs';
import { buildPlaybookIndex, resolveNode } from './md_controller_reader.mjs';
import {
  prepareStateWrite,
  readState,
  statePath,
  writeState,
} from './state.mjs';
import { buildHtmlReviewPlan } from './html_preview.mjs';
import {
  assemblyReceiptPath,
  notesReceiptPath,
  sha256File,
  validateNotesCompletionReceipt,
  validatePptxAssemblyReceipt,
} from './notes_receipt.mjs';
import { resolveHtmlFinalSlideArtifacts } from './render_artifacts.mjs';

const SHA_RE = /^[0-9a-f]{64}$/;
const VERSION_RE = /^v[1-9][0-9]*$/;
const GATES = new Set(['content', 'visual']);
const DECISIONS = new Set(['proceed', 'repair', 'redirect']);
const JOURNAL_SCHEMA = 'pptmaker-html-gate-approval-journal-v1';
const RESET_SCHEMA = 'pptmaker-html-production-reset-v1';
const GATE_SCHEMA = 'pptmaker-html-gate-review-v1';
const DELIVERY_SCHEMA = 'pptmaker-html-delivery-review-v1';
const JOURNAL_FILE = 'gate-approval-journal.json';
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

function versionContext(runDir) {
  const run = resolve(runDir);
  const runVersion = basename(run);
  if (!VERSION_RE.test(runVersion)) throw new Error('HTML review requires a normalized vN run directory');
  const root = deckRoot(run);
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
    metadataFile: join(root, METADATA_FILE),
    journalFile: join(root, '_state', JOURNAL_FILE),
  };
}

function versionRecord(state, id, context) {
  const record = state?.nodes?.[id]?.by_version?.[context.versionKey] || null;
  return record?.run_version === context.runVersion ? record : null;
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

function readCurrentPlan(ownerRoot, reference, expectedKind, currentPlan, expectedResetId, expectedVersion) {
  if (!reference) return { valid: false, reason: 'missing current review plan', plan: null };
  if (typeof reference.path !== 'string' || !reference.path.startsWith('plans/')) return { valid: false, reason: 'review plan path is invalid', plan: null };
  const path = join(ownerRoot, ...reference.path.split('/'));
  if (!existsSync(path)) return { valid: false, reason: 'current review plan bytes are missing', plan: null };
  let plan;
  try { plan = JSON.parse(readFileSync(path, 'utf8')); } catch { return { valid: false, reason: 'current review plan JSON is invalid', plan: null }; }
  const { plan_hash: planHash, ...hashBody } = plan;
  if (plan.schema !== 'pptmaker-html-review-plan-v1' || plan.kind !== expectedKind ||
      planHash !== canonicalJsonSha256(hashBody) || planHash !== basename(reference.path, '.json') ||
      plan.pipeline !== HTML_FIRST_PIPELINE || plan.publication_scope !== 'canonical-run' ||
      plan.html_production_reset_id !== expectedResetId || plan.logical_run_version !== expectedVersion) {
    return { valid: false, reason: 'current review plan hash/schema/scope/reset is invalid', plan };
  }
  const expected = buildHtmlReviewPlan({
    plan: currentPlan,
    kind: expectedKind,
    publicationScope: 'canonical-run',
    htmlProductionResetId: expectedResetId,
    logicalRunVersion: expectedVersion,
  });
  const projectionCurrent = expectedKind === 'content'
    ? plan.content_fingerprint === expected.content_fingerprint && plan.ordered_plan_digest === currentPlan.ordered_plan_digest
    : plan.visual_system_fingerprint === expected.visual_system_fingerprint &&
      canonicalJsonSha256(plan.page_visual_dependencies) === canonicalJsonSha256(expected.page_visual_dependencies);
  if (!projectionCurrent) return { valid: false, reason: 'current review plan inputs are stale', plan };
  if (plan.approvable !== true || !Array.isArray(plan.outstanding) || plan.outstanding.length !== 0) return { valid: false, reason: 'current review plan is incomplete', plan };
  return { valid: true, reason: 'current', plan, path };
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
  try {
    const finalSlides = resolveHtmlFinalSlideArtifacts({ runDir: context.run, plan: currentPlan, htmlProductionResetId: resetId });
    const previewRoot = htmlOwnerRoot(context.run, 'preview');
    const preview = readHtmlPreviewManifest(previewRoot, { publicationScope: 'canonical-run', htmlProductionResetId: resetId, logicalRunVersion: context.runVersion });
    const contact = preview?.manifest?.contact_sheets?.delivery;
    if (!contact || contact.owner_digest !== finalSlides.html_delivery_digest) throw new Error('current HTML delivery contact sheet is missing or stale');
    const assembly = validatePptxAssemblyReceipt(context.run, { requireCurrentPptx: false, expectedOrderedIds: currentPlan.slides.map((slide) => slide.slide_id) });
    if (!assembly.valid || assembly.receipt.schema_version !== 2 || assembly.receipt.pipeline !== HTML_FIRST_PIPELINE ||
        assembly.receipt.html_production_reset_id !== resetId || assembly.receipt.html_delivery_digest !== finalSlides.html_delivery_digest) {
      throw new Error(assembly.reason || 'HTML assembly-v2 lineage is stale');
    }
    const notes = validateNotesCompletionReceipt(context.run);
    if (!notes.valid || notes.receipt.schema_version !== 3 || notes.receipt.pipeline !== HTML_FIRST_PIPELINE ||
        notes.receipt.html_production_reset_id !== resetId || notes.receipt.html_delivery_digest !== finalSlides.html_delivery_digest) {
      throw new Error(notes.reason || 'HTML notes-v3 lineage is stale');
    }
    const contactPath = join(previewRoot, ...contact.path.split('/'));
    return {
      valid: true,
      html_delivery_digest: finalSlides.html_delivery_digest,
      contact_sheet_manifest_path: relativePath(context.run, preview.path),
      contact_sheet_manifest_sha256: preview.sha256,
      contact_sheet_path: relativePath(context.run, contactPath),
      contact_sheet_sha256: contact.sha256,
      assembly_receipt_path: relativePath(context.run, assemblyReceiptPath(context.run)),
      assembly_receipt_sha256: sha256File(assemblyReceiptPath(context.run)),
      pptx_sha256: notes.receipt.pptx_sha256,
      notes_receipt_path: relativePath(context.run, notesReceiptPath(context.run)),
      notes_receipt_sha256: sha256File(notesReceiptPath(context.run)),
    };
  } catch (error) { return { valid: false, reason: error.message }; }
}

function deliveryRecordCurrent(record, evidence, resetId, context) {
  if (!record || !evidence.valid) return false;
  const fixed = ['schema', 'pipeline', 'run_version', 'html_production_reset_id', 'html_delivery_digest',
    'contact_sheet_manifest_path', 'contact_sheet_manifest_sha256', 'contact_sheet_path', 'contact_sheet_sha256',
    'assembly_receipt_path', 'assembly_receipt_sha256', 'pptx_sha256', 'notes_receipt_path',
    'notes_receipt_sha256', 'decision', 'reason', 'decided_at'];
  return exactKeys(record, fixed) && record.schema === DELIVERY_SCHEMA && record.pipeline === HTML_FIRST_PIPELINE &&
    record.run_version === context.runVersion && record.html_production_reset_id === resetId &&
    DECISIONS.has(record.decision) && ((record.decision === 'proceed' && record.reason === null) ||
      (record.decision !== 'proceed' && typeof record.reason === 'string' && record.reason)) &&
    fixed.filter((key) => key.endsWith('_sha256') || key === 'html_delivery_digest').every((key) => record[key] === evidence[key]) &&
    record.contact_sheet_manifest_path === evidence.contact_sheet_manifest_path && record.contact_sheet_path === evidence.contact_sheet_path &&
    record.assembly_receipt_path === evidence.assembly_receipt_path && record.notes_receipt_path === evidence.notes_receipt_path;
}

export function normalizeHumanReason(reason) {
  const value = String(reason ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!value || Buffer.byteLength(value, 'utf8') > 1024) throw new Error('human reason must be non-empty and at most 1024 UTF-8 bytes');
  return value;
}

export function inspectHtmlReviewReadiness(runDir) {
  const context = versionContext(runDir);
  const snapshot = readStateSnapshot(context, { purpose: 'observe', heal: true });
  const reset = currentReset(snapshot.state, context);
  const journal = classifyJournal(context);
  const publicView = {
    pipeline: HTML_FIRST_PIPELINE,
    run_version: context.runVersion,
    state_present: true,
    content: { decision: 'pending', freshness: 'missing', review_required: true },
    visual: { decision: 'pending', freshness: 'missing', outstanding_recipe_keys: [], outstanding_slide_ids: [] },
    delivery: { freshness: 'missing', decision: null, reason_present: false },
    reset: publicReset(reset),
    journal: publicJournal(journal),
  };
  const gates = {};
  let currentPlan = null;
  let previewManifest = null;
  if (reset.status !== 'deletion_pending') {
    try {
      currentPlan = validateAndBuildHtmlFirstPlan({ runDir: context.run }).plan;
      const ownerRoot = htmlOwnerRoot(context.run, 'preview');
      previewManifest = readHtmlPreviewManifest(ownerRoot, { publicationScope: 'canonical-run', htmlProductionResetId: reset.id, logicalRunVersion: context.runVersion });
      for (const gate of GATES) {
        const planResult = readCurrentPlan(ownerRoot, previewManifest?.manifest.review_plans?.[gate], gate, currentPlan, reset.id, context.runVersion);
        const record = versionRecord(snapshot.state, `html-${gate}-review`, context);
        const approvedPlan = SHA_RE.test(record?.review_plan_hash || '')
          ? readCurrentPlan(ownerRoot, { path: `plans/${record.review_plan_hash}.json` }, gate, currentPlan, reset.id, context.runVersion)
          : { valid: false };
        const recordCurrent = Boolean(record && record.schema === GATE_SCHEMA && record.gate === gate && record.pipeline === HTML_FIRST_PIPELINE &&
          record.run_version === context.runVersion && record.html_production_reset_id === reset.id && ['approved', 'waived'].includes(record.status) && approvedPlan.valid);
        gates[gate] = Object.freeze({ ready: recordCurrent, plan: planResult.plan, plan_reason: planResult.reason, record: recordCurrent ? record : null });
        publicView[gate].decision = record?.status === 'approved' || record?.status === 'waived' ? record.status : 'pending';
        publicView[gate].freshness = recordCurrent ? 'current' : record ? 'stale' : planResult.plan ? 'missing' : 'missing';
      }
      publicView.content.review_required = publicView.content.freshness !== 'current';
      const outstanding = previewManifest?.manifest.review_plans?.visual
        ? readCurrentPlan(ownerRoot, previewManifest.manifest.review_plans.visual, 'visual', currentPlan, reset.id, context.runVersion).plan?.outstanding || []
        : [];
      publicView.visual.outstanding_recipe_keys = [...new Set(outstanding.filter((item) => SHA_RE.test(item)))].sort();
      publicView.visual.outstanding_slide_ids = [...new Set(outstanding.map((item) => String(item).split(':').at(-1)).filter((item) => currentPlan.slides.some((slide) => slide.slide_id === item)))].sort();
      const evidence = deliveryEvidence(context, reset.id, currentPlan);
      const deliveryRecord = versionRecord(snapshot.state, 'html-delivery-review', context);
      const deliveryCurrent = deliveryRecordCurrent(deliveryRecord, evidence, reset.id, context);
      publicView.delivery = {
        freshness: deliveryCurrent ? 'current' : deliveryRecord ? 'stale' : evidence.valid ? 'missing' : 'missing',
        decision: deliveryRecord && DECISIONS.has(deliveryRecord.decision) ? deliveryRecord.decision : null,
        reason_present: Boolean(deliveryRecord?.reason),
      };
      Object.defineProperty(publicView, '_delivery_evidence', { value: evidence, enumerable: false });
    } catch (error) {
      Object.defineProperty(publicView, '_inspection_error', { value: error.message, enumerable: false });
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

export function recoverHtmlGatePublication(runDir, { confirmedOwnerToken = null } = {}) {
  const context = versionContext(runDir);
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

export function publishHtmlGateDecision(runDir, { gate, planHash, status, waiverReason = null } = {}) {
  if (!GATES.has(gate) || !SHA_RE.test(planHash || '') || !['approved', 'waived'].includes(status)) throw new TypeError('invalid HTML gate decision');
  const reason = status === 'waived' ? normalizeHumanReason(waiverReason) : null;
  if (status === 'approved' && waiverReason != null) throw new Error('approved HTML gate cannot carry a waiver reason');
  const context = versionContext(runDir);
  recoverHtmlGatePublication(context.run);
  const snapshot = readStateSnapshot(context, { purpose: 'execute', heal: true });
  const reset = currentReset(snapshot.state, context);
  if (reset.status === 'deletion_pending') throw new Error('CONFLICT: HTML production reset is deletion_pending');
  const currentPlan = validateAndBuildHtmlFirstPlan({ runDir: context.run }).plan;
  const ownerRoot = htmlOwnerRoot(context.run, 'preview');
  const manifest = readHtmlPreviewManifest(ownerRoot, { publicationScope: 'canonical-run', htmlProductionResetId: reset.id, logicalRunVersion: context.runVersion });
  const planResult = readCurrentPlan(ownerRoot, manifest?.manifest.review_plans?.[gate], gate, currentPlan, reset.id, context.runVersion);
  if (!planResult.valid || planResult.plan.plan_hash !== planHash) throw new Error(`HTML ${gate} review plan is missing, stale, or incomplete`);
  const decidedAt = nowIso();
  const nextState = structuredClone(snapshot.state);
  delete nextState.durable_state_present;
  nextState.schema_version = 3;
  nextState.nodes ||= {};
  nextState.gates ||= {};
  const id = `html-${gate}-review`;
  const existing = nextState.nodes[id]?.by_version || {};
  nextState.nodes[id] = { by_version: { ...existing, [context.versionKey]: {
    schema: GATE_SCHEMA,
    gate,
    pipeline: HTML_FIRST_PIPELINE,
    run_version: context.runVersion,
    status,
    waiver_reason: reason,
    review_plan_hash: planHash,
    html_production_reset_id: reset.id,
    ...(gate === 'content' ? {
      content_review_fingerprint: planResult.plan.content_fingerprint,
      ordered_plan_digest: planResult.plan.ordered_plan_digest,
    } : {
      visual_system_fingerprint: planResult.plan.visual_system_fingerprint,
      component_recipe_coverage: planResult.plan.coverage,
      page_visual_dependencies: planResult.plan.page_visual_dependencies,
      shown_artifacts: planResult.plan.shown_artifacts,
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
  return Object.freeze({ gate, status, review_plan_hash: planHash, run_version: context.runVersion, html_production_reset_id: reset.id });
}

export function publishHtmlDeliveryDecision(runDir, { decision, reason = null } = {}) {
  if (!DECISIONS.has(decision)) throw new TypeError('delivery decision must be proceed, repair, or redirect');
  const normalizedReason = decision === 'proceed' ? null : normalizeHumanReason(reason);
  if (decision === 'proceed' && reason != null) throw new Error('proceed delivery decision cannot carry a reason');
  const context = versionContext(runDir);
  if (readJournal(context)) throw new Error('CONFLICT: gate approval journal fences delivery review');
  const snapshot = readStateSnapshot(context, { purpose: 'execute', heal: true });
  const reset = currentReset(snapshot.state, context);
  if (reset.status === 'deletion_pending') throw new Error('CONFLICT: HTML production reset is deletion_pending');
  const currentPlan = validateAndBuildHtmlFirstPlan({ runDir: context.run }).plan;
  const evidence = deliveryEvidence(context, reset.id, currentPlan);
  if (!evidence.valid) throw new Error(`HTML delivery evidence is missing or stale: ${evidence.reason}`);
  const index = buildPlaybookIndex(resolve(dirname(new URL(import.meta.url).pathname), '..', '..', 'playbook'));
  const declaration = resolveNode(index, snapshot.state.playbook, snapshot.state.current_node);
  if (!declaration || !declaration.decisions.includes(decision)) throw new Error('current controller node does not declare this delivery decision');
  const active = snapshot.state.nodes?.[snapshot.state.current_node];
  if (!snapshot.state.execution_id || !active || active.execution_id !== snapshot.state.execution_id) throw new Error('current delivery-review node is not part of the active execution');
  const decidedAt = nowIso();
  const nextState = structuredClone(snapshot.state);
  delete nextState.durable_state_present;
  const prior = nextState.nodes?.['html-delivery-review']?.by_version || {};
  const deliveryRecord = {
    schema: DELIVERY_SCHEMA,
    pipeline: HTML_FIRST_PIPELINE,
    run_version: context.runVersion,
    html_production_reset_id: reset.id,
    ...evidence,
    decision,
    reason: normalizedReason,
    decided_at: decidedAt,
  };
  delete deliveryRecord.valid;
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
  return Object.freeze({ decision, run_version: context.runVersion, freshness: 'current' });
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

export function resetHtmlProduction(runDir, { confirmedRunVersion } = {}) {
  const context = versionContext(runDir);
  if (confirmedRunVersion !== context.runVersion) throw new Error('confirmedRunVersion must exactly match the target vN');
  if (readJournal(context)) {
    try { recoverHtmlGatePublication(context.run); } catch (error) { throw new Error(`CONFLICT: gate approval journal must be recovered before HTML reset: ${error.message}`); }
    if (readJournal(context)) throw new Error('CONFLICT: gate approval journal must be recovered before HTML reset');
  }
  const snapshot = readStateSnapshot(context, { purpose: 'execute', heal: true });
  let reset = currentReset(snapshot.state, context);
  const ownerRoot = htmlProductionRoot(context.run);
  const ownerExists = assertOwnerPathSafe(ownerRoot);
  const authority = hasCurrentAuthority(context, snapshot.state, reset.id);
  if (!reset.record && !ownerExists && !authority) return resetResult('no-reset-needed', context, null);
  if (reset.status === 'complete' && !ownerExists && !authority) return resetResult('already-complete', context, reset.id);
  for (const ownerKind of ['html-pages', 'final-slides', 'preview']) {
    const classification = classifyHtmlPublishLock(htmlOwnerRoot(context.run, ownerKind));
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
