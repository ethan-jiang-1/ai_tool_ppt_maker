import { existsSync, lstatSync, readFileSync, rmSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { hostname } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { canonicalJsonSha256 } from './canonical_json.mjs';
import { deckRoot } from '../bundle_layout.mjs';
import { htmlOwnerRoot, htmlProductionRoot, readHtmlPreviewManifest, readHtmlPublishLock } from './html_object_store.mjs';
import { HTML_FIRST_PIPELINE, probeProductionMarker, validateAndBuildHtmlFirstPlan } from './html_slide_contract.mjs';
import { readState, writeState } from './state.mjs';

const SHA_RE = /^[0-9a-f]{64}$/;
const GATES = new Set(['content', 'visual']);

function versionContext(runDir) {
  const run = resolve(runDir); const runVersion = basename(run);
  if (!/^v[1-9][0-9]*$/.test(runVersion)) throw new Error('HTML review requires a normalized vN run directory');
  return { run, root: deckRoot(run), runVersion, versionKey: `3_versions/${runVersion}` };
}

function versionRecord(state, id, versionKey) {
  return state?.nodes?.[id]?.by_version?.[versionKey] || null;
}

function currentReset(state, versionKey) {
  const record = versionRecord(state, 'html-production-reset', versionKey);
  if (!record) return { id: null, status: 'complete' };
  const id = record.html_production_reset_id;
  if (!SHA_RE.test(id || '')) throw new Error('HTML production reset record is invalid');
  if (!['deletion_pending', 'complete'].includes(record.status)) throw new Error('HTML production reset status is invalid');
  return { id, status: record.status };
}

function readCurrentPlan(ownerRoot, reference, expectedKind, currentPlan) {
  if (!reference) return { valid: false, reason: 'missing current review plan', plan: null };
  const path = join(ownerRoot, ...reference.path.split('/'));
  if (!existsSync(path)) return { valid: false, reason: 'current review plan bytes are missing', plan: null };
  const plan = JSON.parse(readFileSync(path, 'utf8'));
  const { plan_hash: planHash, ...hashBody } = plan;
  if (plan.schema !== 'pptmaker-html-review-plan-v1' || plan.kind !== expectedKind || planHash !== canonicalJsonSha256(hashBody) || planHash !== basename(reference.path, '.json')) return { valid: false, reason: 'current review plan hash/schema is invalid', plan };
  if (plan.pipeline !== 'html-first-v1' || plan.publication_scope !== 'canonical-run' || plan.ordered_plan_digest !== currentPlan.ordered_plan_digest || plan.source_sha256 !== currentPlan.source_sha256) return { valid: false, reason: 'current review plan inputs are stale', plan };
  if (plan.approvable !== true || !Array.isArray(plan.outstanding) || plan.outstanding.length !== 0) return { valid: false, reason: 'current review plan is incomplete', plan };
  return { valid: true, reason: 'current', plan };
}

export function normalizeHumanReason(reason) {
  const value = String(reason ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!value || Buffer.byteLength(value, 'utf8') > 1024) throw new Error('human reason must be non-empty and at most 1024 UTF-8 bytes');
  return value;
}

export function inspectHtmlReviewReadiness(runDir) {
  const context = versionContext(runDir); const state = readState(context.root, { heal: false });
  if (state?.corrupted) throw new Error('HTML review state is unreadable');
  const reset = currentReset(state, context.versionKey);
  if (reset.status === 'deletion_pending') return Object.freeze({ ready: false, conflict: true, reason: 'html production reset is deletion_pending', run_version: context.runVersion, html_production_reset_id: reset.id, gates: {} });
  const { plan: currentPlan } = validateAndBuildHtmlFirstPlan({ runDir: context.run });
  const ownerRoot = htmlOwnerRoot(context.run, 'preview');
  let manifest = null;
  try { manifest = readHtmlPreviewManifest(ownerRoot, { publicationScope: 'canonical-run', htmlProductionResetId: reset.id, logicalRunVersion: context.runVersion }); } catch (error) { return Object.freeze({ ready: false, conflict: false, reason: error.message, run_version: context.runVersion, html_production_reset_id: reset.id, gates: {} }); }
  const gates = {};
  for (const gate of GATES) {
    const planResult = readCurrentPlan(ownerRoot, manifest?.manifest.review_plans?.[gate] || null, gate, currentPlan);
    const record = versionRecord(state, `html-${gate}-review`, context.versionKey);
    const recordCurrent = Boolean(record && record.schema === 'pptmaker-html-gate-review-v1' && record.gate === gate && record.pipeline === 'html-first-v1' && record.run_version === context.runVersion && record.html_production_reset_id === reset.id && ['approved', 'waived'].includes(record.status) && record.review_plan_hash === planResult.plan?.plan_hash);
    gates[gate] = Object.freeze({ ready: planResult.valid && recordCurrent, plan: planResult.plan, plan_reason: planResult.reason, record: recordCurrent ? record : null });
  }
  return Object.freeze({ ready: gates.content.ready && gates.visual.ready, conflict: false, reason: gates.content.ready && gates.visual.ready ? 'current' : 'HTML content/visual review is pending or stale', run_version: context.runVersion, html_production_reset_id: reset.id, gates, preview_manifest: manifest?.manifest || null });
}

export function publishHtmlGateDecision(runDir, { gate, planHash, status, waiverReason = null } = {}) {
  if (!GATES.has(gate) || !SHA_RE.test(planHash || '') || !['approved', 'waived'].includes(status)) throw new TypeError('invalid HTML gate decision');
  const reason = status === 'waived' ? normalizeHumanReason(waiverReason) : null;
  if (status === 'approved' && waiverReason != null) throw new Error('approved HTML gate cannot carry a waiver reason');
  const context = versionContext(runDir); const state = readState(context.root, { heal: false });
  if (state?.corrupted) throw new Error('HTML review state is unreadable');
  const reset = currentReset(state, context.versionKey); if (reset.status === 'deletion_pending') throw new Error('CONFLICT: HTML production reset is deletion_pending');
  const { plan: currentPlan } = validateAndBuildHtmlFirstPlan({ runDir: context.run });
  const ownerRoot = htmlOwnerRoot(context.run, 'preview');
  const manifest = readHtmlPreviewManifest(ownerRoot, { publicationScope: 'canonical-run', htmlProductionResetId: reset.id, logicalRunVersion: context.runVersion });
  const planResult = readCurrentPlan(ownerRoot, manifest?.manifest.review_plans?.[gate], gate, currentPlan);
  if (!planResult.valid || planResult.plan.plan_hash !== planHash) throw new Error(`HTML ${gate} review plan is missing, stale, or incomplete`);
  state.schema_version = 3; state.nodes ||= {}; state.gates ||= {};
  const id = `html-${gate}-review`; const existing = state.nodes[id]?.by_version || {};
  state.nodes[id] = { by_version: { ...existing, [context.versionKey]: { schema: 'pptmaker-html-gate-review-v1', gate, pipeline: 'html-first-v1', run_version: context.runVersion, status, waiver_reason: reason, review_plan_hash: planHash, html_production_reset_id: reset.id, ordered_plan_digest: currentPlan.ordered_plan_digest, decided_at: new Date().toISOString() } } };
  state.gates[`html_${gate}`] = status; state.gates[`html_${gate}_run_version`] = context.runVersion;
  writeState(context.root, state);
  return Object.freeze({ gate, status, review_plan_hash: planHash, run_version: context.runVersion, html_production_reset_id: reset.id });
}

export function recoverHtmlGatePublication(runDir) {
  versionContext(runDir);
  return Object.freeze({ status: 'absent' });
}

export function publishHtmlDeliveryDecision() {
  throw new Error('HTML delivery review publication requires the completed delivery-review contract');
}

export function resetHtmlProduction(runDir, { confirmedRunVersion } = {}) {
  const context = versionContext(runDir);
  if (confirmedRunVersion !== context.runVersion) throw new Error('confirmedRunVersion must exactly match the target vN');
  const source = join(context.run, 'slide-specifications.md');
  if (!existsSync(source) || probeProductionMarker(readFileSync(source), { source: 'slide-specifications.md' }).branch !== HTML_FIRST_PIPELINE) throw new Error('HTML production reset is branch-inapplicable for this run');
  const journal = join(context.root, '_state', 'gate-approval-journal.json');
  if (existsSync(journal)) throw new Error('CONFLICT: gate approval journal must be recovered before HTML reset');
  for (const ownerKind of ['html-pages', 'final-slides', 'preview']) {
    const ownerRoot = htmlOwnerRoot(context.run, ownerKind);
    if (existsSync(join(ownerRoot, '.publish.lock'))) {
      const lock = readHtmlPublishLock(ownerRoot);
      throw new Error(`CONFLICT: active or uncertain ${lock?.record.owner_kind || ownerKind} publication blocks HTML reset`);
    }
  }
  let state = readState(context.root, { heal: false });
  if (state?.corrupted) throw new Error('HTML reset state is unreadable');
  const existing = versionRecord(state, 'html-production-reset', context.versionKey);
  const ownerRoot = htmlProductionRoot(context.run);
  if (existing?.status === 'complete' && !existsSync(ownerRoot)) return Object.freeze({ status: 'already-complete', run_version: context.runVersion, html_production_reset_id: existing.html_production_reset_id });
  const resumed = existing?.status === 'deletion_pending';
  const resetId = resumed ? existing.html_production_reset_id : randomBytes(32).toString('hex');
  const ownerClaim = resumed ? existing.owner_claim : randomBytes(32).toString('hex');
  if (!SHA_RE.test(resetId || '') || !SHA_RE.test(ownerClaim || '')) throw new Error('HTML reset pending record is invalid');
  state.schema_version = 3; state.nodes ||= {}; state.gates ||= {};
  const previous = state.nodes['html-production-reset']?.by_version || {};
  state.nodes['html-production-reset'] = { by_version: { ...previous, [context.versionKey]: { schema: 'pptmaker-html-production-reset-v1', pipeline: 'html-first-v1', run_version: context.runVersion, html_production_reset_id: resetId, owner_claim: ownerClaim, owner_host: hostname(), owner_pid: process.pid, status: 'deletion_pending', started_at: resumed ? existing.started_at : new Date().toISOString(), updated_at: new Date().toISOString() } } };
  state.gates.html_content = 'pending'; state.gates.html_visual = 'pending'; state.gates.html_content_run_version = context.runVersion; state.gates.html_visual_run_version = context.runVersion;
  writeState(context.root, state);
  try {
    if (existsSync(ownerRoot)) {
      if (lstatSync(ownerRoot).isSymbolicLink()) throw new Error('canonical HTML production owner must not be a symlink');
      rmSync(ownerRoot, { recursive: true, force: false });
    }
  } catch (error) {
    throw new Error(`HTML production reset deletion failed with deletion_pending preserved: ${error.message}`);
  }
  state = readState(context.root, { heal: false });
  const pending = versionRecord(state, 'html-production-reset', context.versionKey);
  if (pending?.status !== 'deletion_pending' || pending.html_production_reset_id !== resetId || pending.owner_claim !== ownerClaim) throw new Error('CONFLICT: HTML reset ownership changed before completion');
  pending.status = 'complete'; pending.completed_at = new Date().toISOString(); pending.updated_at = pending.completed_at;
  writeState(context.root, state);
  return Object.freeze({ status: resumed ? 'resumed' : 'started', run_version: context.runVersion, html_production_reset_id: resetId });
}
