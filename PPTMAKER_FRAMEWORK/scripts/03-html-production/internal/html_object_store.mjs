import { createHash, randomBytes } from 'node:crypto';
import { closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { GENERATED_SUBDIR, GEN_HTML_FINAL_SLIDES_SUBDIR, GEN_HTML_PAGES_SUBDIR, GEN_HTML_PREVIEW_SUBDIR, GEN_HTML_PRODUCTION_SUBDIR, deckRoot } from '../../shared/run-bundle/bundle_layout.mjs';

export const HTML_PAGES_MANIFEST_SCHEMA = 'pptmaker-html-pages-manifest-v1';
export const HTML_FINAL_SLIDES_MANIFEST_SCHEMA = 'pptmaker-html-final-slides-manifest-v1';
export const HTML_PREVIEW_MANIFEST_SCHEMA = 'pptmaker-html-preview-manifest-v1';
export const HTML_PUBLISH_LOCK_SCHEMA = 'pptmaker-html-publish-lock-v1';
export const PUBLISH_LOCK_AUTO_RECOVERY_MIN_AGE_MS = 60_000;
export const PUBLISH_LOCK_EXPLICIT_RECOVERY_MIN_AGE_MS = 300_000;

const SHA_RE = /^[0-9a-f]{64}$/;
const TOKEN_RE = /^[0-9a-f]{64}$/;
const OWNER_KINDS = new Set(['html-pages', 'final-slides', 'preview']);
const SCOPES = new Set(['canonical-run']);

function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function randomToken() { return randomBytes(32).toString('hex'); }
function nowMs() { return Date.now(); }
function exactKeys(value, keys, context) { const actual = Object.keys(value || {}); if (actual.length !== keys.length || actual.some((key) => !keys.includes(key))) throw new Error(`${context} has unknown or missing fields`); }
function safeResetId(value) { if (value !== null && !SHA_RE.test(value)) throw new Error('html_production_reset_id must be null or lowercase SHA-256'); return value; }

function validateManifestEntries(ownerRoot, schema, entries) {
  const seen = new Set();
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') throw new Error('HTML current manifest has an invalid entry');
    if (schema === HTML_PREVIEW_MANIFEST_SCHEMA) {
      if (typeof entry.slot !== 'string') throw new Error('HTML preview manifest entry slot is invalid');
    } else if (typeof entry.slide_id !== 'string' || seen.has(entry.slide_id)) throw new Error('HTML current manifest has duplicate/invalid slide IDs');
    if (entry.composition_variant !== 'effective') throw new Error('forced-fallback objects cannot enter an HTML delivery current manifest');
    if (typeof entry.path !== 'string' || entry.path.includes('\\') || entry.path.split('/').some((part) => !part || part === '.' || part === '..') || !entry.path.startsWith('objects/')) throw new Error('HTML current manifest object path is not confined');
    const objectPath = join(ownerRoot, ...entry.path.split('/'));
    const realOwner = realpathSync(ownerRoot); const realObject = existsSync(objectPath) ? realpathSync(objectPath) : null;
    if (!SHA_RE.test(entry.sha256) || !realObject || relative(realOwner, realObject).startsWith('..') || sha256(readFileSync(objectPath)) !== entry.sha256) throw new Error('HTML current manifest object receipt is invalid');
    if (schema === HTML_FINAL_SLIDES_MANIFEST_SCHEMA && (entry.artifact_kind !== 'final-slide' || entry.width !== 2000 || entry.height !== 1125 || typeof entry.producer !== 'string' || !entry.producer || !SHA_RE.test(entry.html_sha256 || '') || !SHA_RE.test(entry.composition_fingerprint || '') || !SHA_RE.test(entry.final_slide_fingerprint || '') || typeof entry.media_profile !== 'string' || !entry.media_profile)) throw new Error('HTML final-slide manifest entry profile is invalid');
    if (schema === HTML_PAGES_MANIFEST_SCHEMA && entry.artifact_kind !== 'html-page') throw new Error('HTML page manifest entry kind is invalid');
    if (entry.slide_id) seen.add(entry.slide_id);
  }
}

export function htmlProductionRoot(runDir) {
  const run = resolve(runDir); const root = resolve(deckRoot(run));
  const rel = relative(root, run);
  if (!rel || rel.startsWith('..') || resolve(root, rel) !== run) throw new Error('run directory is not confined to its deck root');
  return join(run, GENERATED_SUBDIR, GEN_HTML_PRODUCTION_SUBDIR);
}

export function htmlOwnerRoot(runDir, ownerKind) {
  if (!OWNER_KINDS.has(ownerKind)) throw new Error(`unsupported HTML owner kind ${ownerKind}`);
  return join(htmlProductionRoot(runDir), ownerKind === 'html-pages' ? GEN_HTML_PAGES_SUBDIR : ownerKind === 'final-slides' ? GEN_HTML_FINAL_SLIDES_SUBDIR : GEN_HTML_PREVIEW_SUBDIR);
}

export function ensureHtmlOwnerRoot(runDir, ownerKind) {
  const root = htmlOwnerRoot(runDir, ownerKind);
  mkdirSync(join(root, 'objects'), { recursive: true });
  return root;
}

function objectAddress(root, digest, extension) {
  if (!SHA_RE.test(digest)) throw new Error('object address must be a lowercase raw-byte SHA-256');
  return join(root, 'objects', `${digest}.${extension}`);
}

export function writeHtmlObject({ ownerRoot, bytes, extension, ownerToken }) {
  if (!Buffer.isBuffer(bytes) && !(bytes instanceof Uint8Array)) throw new TypeError('immutable object bytes must be Buffer or Uint8Array');
  if (!TOKEN_RE.test(ownerToken || '')) throw new TypeError('object write requires the exact lock owner token');
  if (!/^[a-z0-9]+$/.test(extension || '')) throw new TypeError('immutable object extension is invalid');
  const data = Buffer.from(bytes); const digest = sha256(data); const target = objectAddress(ownerRoot, digest, extension);
  mkdirSync(dirname(target), { recursive: true });
  if (lstatSync(dirname(target)).isSymbolicLink()) throw new Error('immutable object directory must not be a symlink');
  if (existsSync(target)) {
    if (sha256(readFileSync(target)) !== digest) throw new Error(`immutable object collision at ${digest}`);
    return { sha256: digest, path: relative(ownerRoot, target).split('\\').join('/'), reused: true };
  }
  const temp = join(dirname(target), `.object.${ownerToken}.${digest}.${extension}.tmp`);
  let fd;
  try {
    fd = openSync(temp, 'wx', 0o600);
    writeFileSync(fd, data);
    fsyncSync(fd); closeSync(fd); fd = null;
    if (sha256(readFileSync(temp)) !== digest) throw new Error('immutable object temp digest mismatch');
    if (existsSync(target)) {
      if (sha256(readFileSync(target)) !== digest) throw new Error(`immutable object collision at ${digest}`);
      unlinkSync(temp);
    } else renameSync(temp, target);
  } catch (error) {
    if (fd != null) closeSync(fd);
    if (existsSync(temp)) try { unlinkSync(temp); } catch {}
    throw error;
  }
  return { sha256: digest, path: relative(ownerRoot, target).split('\\').join('/'), reused: false };
}

export function acquireHtmlPublishLock({ ownerRoot, ownerKind, publicationScope, htmlProductionResetId = null, inputScopeSha256, priorManifestSha256 = null, now = nowMs(), host = hostname(), pid = process.pid } = {}) {
  if (!OWNER_KINDS.has(ownerKind) || !SCOPES.has(publicationScope) || !SHA_RE.test(inputScopeSha256 || '')) throw new TypeError('invalid HTML publication lock inputs');
  safeResetId(htmlProductionResetId);
  if (priorManifestSha256 !== null && !SHA_RE.test(priorManifestSha256)) throw new TypeError('priorManifestSha256 must be null or SHA-256');
  if (!Number.isInteger(pid) || pid <= 0 || !Number.isFinite(now)) throw new TypeError('invalid lock owner pid/time');
  mkdirSync(ownerRoot, { recursive: true }); const lockDir = join(ownerRoot, '.publish.lock');
  try { mkdirSync(lockDir); } catch { throw new Error('CONFLICT: HTML publish lock already exists'); }
  const ownerToken = randomToken();
  const record = { schema: HTML_PUBLISH_LOCK_SCHEMA, owner_token: ownerToken, owner_kind: ownerKind, publication_scope: publicationScope, html_production_reset_id: htmlProductionResetId, host: String(host), pid, created_at_epoch_ms: now, input_scope_sha256: inputScopeSha256, prior_manifest_sha256: priorManifestSha256 };
  const ownerPath = join(lockDir, 'owner.json');
  try { writeFileSync(ownerPath, `${JSON.stringify(record)}\n`, { flag: 'wx', mode: 0o600 }); } catch (error) { rmSync(lockDir, { recursive: true, force: true }); throw error; }
  return Object.freeze({ ownerRoot, lockDir, ownerPath, ownerToken, record });
}

export function readHtmlPublishLock(ownerRoot) {
  const lockDir = join(ownerRoot, '.publish.lock'); if (!existsSync(lockDir)) return null;
  const ownerPath = join(lockDir, 'owner.json'); if (!existsSync(ownerPath)) throw new Error('CONFLICT: HTML publish lock has no owner record');
  let record; try { record = JSON.parse(readFileSync(ownerPath, 'utf8')); } catch { throw new Error('CONFLICT: HTML publish owner record is invalid JSON'); }
  try { exactKeys(record, ['schema', 'owner_token', 'owner_kind', 'publication_scope', 'html_production_reset_id', 'host', 'pid', 'created_at_epoch_ms', 'input_scope_sha256', 'prior_manifest_sha256'], 'HTML publish owner'); } catch (error) { throw new Error(`CONFLICT: ${error.message}`); }
  if (record.schema !== HTML_PUBLISH_LOCK_SCHEMA || !TOKEN_RE.test(record.owner_token) || !OWNER_KINDS.has(record.owner_kind) || !SCOPES.has(record.publication_scope) || !SHA_RE.test(record.input_scope_sha256) || (record.prior_manifest_sha256 !== null && !SHA_RE.test(record.prior_manifest_sha256))) throw new Error('CONFLICT: invalid HTML publish owner record');
  safeResetId(record.html_production_reset_id); return Object.freeze({ ownerRoot, lockDir, ownerPath, ownerToken: record.owner_token, record });
}

export function releaseHtmlPublishLock(lock) {
  const current = readHtmlPublishLock(lock.ownerRoot); if (!current || current.ownerToken !== lock.ownerToken) throw new Error('HTML publish lock owner mismatch');
  rmSync(lock.lockDir, { recursive: true, force: false });
}

function ownerAlive(pid) {
  try { process.kill(pid, 0); return true; } catch (error) { return error?.code === 'EPERM'; }
}

// Kept private to the publication protocol, but reused by adjacent owner
// protocols so host/PID/age recovery decisions cannot drift.
export function classifyHtmlOwnerLiveness({ host: recordHost, pid, created_at_epoch_ms: createdAt } = {}, { now = nowMs(), host = hostname() } = {}) {
  if (typeof recordHost !== 'string' || !recordHost || !Number.isInteger(pid) || pid <= 0 || !Number.isFinite(createdAt)) {
    return Object.freeze({ status: 'invalid', reason: 'owner record is incomplete' });
  }
  const age = now - createdAt;
  if (!Number.isFinite(age) || age < 0) return Object.freeze({ status: 'invalid', reason: 'owner record clock data is invalid' });
  const sameHost = recordHost === host;
  if (sameHost && ownerAlive(pid)) return Object.freeze({ status: 'active', age_ms: age });
  if (sameHost && age < PUBLISH_LOCK_AUTO_RECOVERY_MIN_AGE_MS) {
    return Object.freeze({ status: 'waiting', age_ms: age, retry_after_ms: PUBLISH_LOCK_AUTO_RECOVERY_MIN_AGE_MS - age });
  }
  return Object.freeze({ status: sameHost ? 'recoverable' : 'uncertain', age_ms: age });
}

export function classifyHtmlPublishLock(ownerRoot, { now = nowMs(), host = hostname() } = {}) {
  let lock;
  try { lock = readHtmlPublishLock(ownerRoot); } catch (error) { return Object.freeze({ status: 'invalid', reason: error.message, lock: null }); }
  if (!lock) return Object.freeze({ status: 'absent', lock: null });
  return Object.freeze({ ...classifyHtmlOwnerLiveness(lock.record, { now, host }), lock });
}

export function recoverHtmlPublishLock(ownerRoot, { now = nowMs(), confirmedOwnerToken = null, host = hostname() } = {}) {
  const lock = readHtmlPublishLock(ownerRoot);
  if (!lock) return { status: 'absent' };
  const age = now - lock.record.created_at_epoch_ms;
  if (!Number.isFinite(age) || age < 0) throw new Error('CONFLICT: HTML publish lock clock data is invalid');
  const sameHost = lock.record.host === host;
  const live = sameHost && ownerAlive(lock.record.pid);
  if (live) throw new Error('CONFLICT: HTML publish owner is still live');
  const automatic = sameHost && age >= PUBLISH_LOCK_AUTO_RECOVERY_MIN_AGE_MS;
  const explicit = confirmedOwnerToken === lock.ownerToken && age >= PUBLISH_LOCK_EXPLICIT_RECOVERY_MIN_AGE_MS;
  if (!automatic && !explicit) throw new Error('CONFLICT: HTML publish owner recovery requires age and exact confirmation');
  if (explicit && lock.record.publication_scope === 'canonical-run') throw new Error('CONFLICT: canonical uncertain-owner recovery requires whole HTML production reset');
  for (const name of readdirSafe(join(ownerRoot, 'objects'))) if (name.startsWith(`.object.${lock.ownerToken}.`)) rmSync(join(ownerRoot, 'objects', name), { force: true, recursive: true });
  const manifestTemp = join(ownerRoot, `.manifest.${lock.ownerToken}.tmp`); if (existsSync(manifestTemp)) rmSync(manifestTemp, { force: true });
  rmSync(lock.lockDir, { recursive: true, force: false });
  return { status: 'recovered', mode: automatic ? 'same-host-dead' : 'confirmed-owner', ownerToken: lock.ownerToken };
}

function readdirSafe(path) {
  try { return readdirSync(path); } catch { return []; }
}

export function publishHtmlCurrentManifest({ ownerRoot, ownerToken, schema, publicationScope, htmlProductionResetId = null, entries, priorManifestSha256 = null } = {}) {
  if (![HTML_PAGES_MANIFEST_SCHEMA, HTML_FINAL_SLIDES_MANIFEST_SCHEMA, HTML_PREVIEW_MANIFEST_SCHEMA].includes(schema)) throw new TypeError('unsupported HTML current manifest schema');
  const lock = readHtmlPublishLock(ownerRoot); if (!lock || lock.ownerToken !== ownerToken) throw new Error('HTML publish manifest owner mismatch');
  if (lock.record.publication_scope !== publicationScope || lock.record.html_production_reset_id !== htmlProductionResetId) throw new Error('HTML publish scope/reset drifted');
  safeResetId(htmlProductionResetId); if (!Array.isArray(entries)) throw new TypeError('manifest entries must be an array');
  validateManifestEntries(ownerRoot, schema, entries);
  const manifest = { schema, publication_scope: publicationScope, html_production_reset_id: htmlProductionResetId, entries };
  const manifestPath = join(ownerRoot, 'manifest.json'); const prior = existsSync(manifestPath) ? sha256(readFileSync(manifestPath)) : null;
  if (prior !== priorManifestSha256) throw new Error('HTML current manifest CAS mismatch');
  const temp = join(ownerRoot, `.manifest.${ownerToken}.tmp`);
  writeFileSync(temp, `${JSON.stringify(manifest)}\n`, { flag: 'wx', mode: 0o600 });
  try { if (existsSync(manifestPath) && sha256(readFileSync(manifestPath)) !== prior) throw new Error('HTML current manifest changed before commit'); renameSync(temp, manifestPath); }
  catch (error) { if (existsSync(temp)) unlinkSync(temp); throw error; }
  return Object.freeze({ path: manifestPath, sha256: sha256(readFileSync(manifestPath)), manifest });
}

export function readHtmlCurrentManifest(ownerRoot, { expectedSchema, publicationScope, htmlProductionResetId = null } = {}) {
  const path = join(ownerRoot, 'manifest.json'); if (!existsSync(path)) return null;
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  exactKeys(manifest, ['schema', 'publication_scope', 'html_production_reset_id', 'entries'], 'HTML current manifest');
  if (manifest.schema !== expectedSchema || manifest.publication_scope !== publicationScope || manifest.html_production_reset_id !== htmlProductionResetId || !Array.isArray(manifest.entries)) throw new Error('HTML current manifest scope/schema/reset mismatch');
  validateManifestEntries(ownerRoot, expectedSchema, manifest.entries);
  return Object.freeze({ path, sha256: sha256(readFileSync(path)), manifest });
}

function validatePreviewReference(ownerRoot, reference, slot) {
  if (reference == null) return;
  if (!reference || typeof reference !== 'object') throw new Error(`HTML preview ${slot} reference is invalid`);
  exactKeys(reference, ['path', 'sha256', 'owner', 'owner_digest', 'composition_variants'], `HTML preview ${slot}`);
  if (typeof reference.path !== 'string' || reference.path.includes('\\') || reference.path.split('/').some((part) => !part || part === '.' || part === '..') || !(reference.path.startsWith('objects/') || reference.path.startsWith('plans/'))) throw new Error(`HTML preview ${slot} reference path is not confined`);
  if (!SHA_RE.test(reference.sha256)) throw new Error(`HTML preview ${slot} reference SHA is invalid`);
  const path = join(ownerRoot, ...reference.path.split('/'));
  if (!existsSync(path) || sha256(readFileSync(path)) !== reference.sha256) throw new Error(`HTML preview ${slot} reference bytes are stale`);
  if (typeof reference.owner !== 'string' || !reference.owner) throw new Error(`HTML preview ${slot} reference owner is invalid`);
  if (!SHA_RE.test(reference.owner_digest || '')) throw new Error(`HTML preview ${slot} owner digest is invalid`);
  if (!Array.isArray(reference.composition_variants) || reference.composition_variants.some((variant) => !['effective', 'forced-fallback'].includes(variant))) throw new Error(`HTML preview ${slot} composition variants are invalid`);
}

export function readHtmlPreviewManifest(ownerRoot, { publicationScope, htmlProductionResetId = null, logicalRunVersion = null } = {}) {
  const path = join(ownerRoot, 'manifest.json'); if (!existsSync(path)) return null;
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  exactKeys(manifest, ['schema', 'publication_scope', 'html_production_reset_id', 'pipeline', 'logical_run_version', 'review_plans', 'contact_sheets'], 'HTML preview manifest');
  if (manifest.schema !== HTML_PREVIEW_MANIFEST_SCHEMA || manifest.publication_scope !== publicationScope || manifest.html_production_reset_id !== htmlProductionResetId || manifest.pipeline !== 'html-first-v1' || (logicalRunVersion != null && manifest.logical_run_version !== logicalRunVersion)) throw new Error('HTML preview manifest scope/schema/reset mismatch');
  if (!manifest.review_plans || !manifest.contact_sheets || !Object.hasOwn(manifest.review_plans, 'content') || !Object.hasOwn(manifest.review_plans, 'visual') || !Object.hasOwn(manifest.contact_sheets, 'visual_review') || !Object.hasOwn(manifest.contact_sheets, 'delivery')) throw new Error('HTML preview manifest slots are incomplete');
  for (const [slot, reference] of Object.entries({ 'review_plans.content': manifest.review_plans.content, 'review_plans.visual': manifest.review_plans.visual, 'contact_sheets.visual_review': manifest.contact_sheets.visual_review, 'contact_sheets.delivery': manifest.contact_sheets.delivery })) validatePreviewReference(ownerRoot, reference, slot);
  return Object.freeze({ path, sha256: sha256(readFileSync(path)), manifest });
}

export function publishHtmlPreviewManifest({ ownerRoot, ownerToken, publicationScope, htmlProductionResetId = null, logicalRunVersion, slots = {}, priorManifestSha256 = null } = {}) {
  const lock = readHtmlPublishLock(ownerRoot); if (!lock || lock.ownerToken !== ownerToken || lock.record.owner_kind !== 'preview') throw new Error('HTML preview manifest owner mismatch');
  if (lock.record.publication_scope !== publicationScope || lock.record.html_production_reset_id !== htmlProductionResetId) throw new Error('HTML preview manifest scope/reset drifted');
  if (typeof logicalRunVersion !== 'string' || !logicalRunVersion) throw new TypeError('logicalRunVersion is required for HTML preview manifest');
  const path = join(ownerRoot, 'manifest.json'); const prior = existsSync(path) ? sha256(readFileSync(path)) : null;
  if (prior !== priorManifestSha256) throw new Error('HTML preview manifest CAS mismatch');
  const previous = prior == null ? null : readHtmlPreviewManifest(ownerRoot, { publicationScope, htmlProductionResetId, logicalRunVersion });
  const slotValue = (section, name) => Object.hasOwn(slots?.[section] || {}, name) ? slots[section][name] : previous?.manifest?.[section]?.[name] ?? null;
  const merged = {
    schema: HTML_PREVIEW_MANIFEST_SCHEMA,
    publication_scope: publicationScope,
    html_production_reset_id: htmlProductionResetId,
    pipeline: 'html-first-v1',
    logical_run_version: logicalRunVersion,
    review_plans: { content: slotValue('review_plans', 'content'), visual: slotValue('review_plans', 'visual') },
    contact_sheets: { visual_review: slotValue('contact_sheets', 'visual_review'), delivery: slotValue('contact_sheets', 'delivery') },
  };
  for (const [slot, reference] of Object.entries({ 'review_plans.content': merged.review_plans.content, 'review_plans.visual': merged.review_plans.visual, 'contact_sheets.visual_review': merged.contact_sheets.visual_review, 'contact_sheets.delivery': merged.contact_sheets.delivery })) validatePreviewReference(ownerRoot, reference, slot);
  const temp = join(ownerRoot, `.manifest.${ownerToken}.tmp`); writeFileSync(temp, `${JSON.stringify(merged)}\n`, { flag: 'wx', mode: 0o600 });
  try { if (existsSync(path) && sha256(readFileSync(path)) !== prior) throw new Error('HTML preview manifest changed before commit'); renameSync(temp, path); }
  catch (error) { if (existsSync(temp)) unlinkSync(temp); throw error; }
  return Object.freeze({ path, sha256: sha256(readFileSync(path)), manifest: merged });
}
