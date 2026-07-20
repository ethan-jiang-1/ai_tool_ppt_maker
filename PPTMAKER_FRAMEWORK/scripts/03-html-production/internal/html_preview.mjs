import { createHash } from 'node:crypto';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { canonicalJson } from '../../contracts/canonical_json.mjs';
import { buildHtmlReviewPlan as buildHtmlReviewProjection } from '../../contracts/html_review_projection.mjs';
import { writeHtmlObject, acquireHtmlPublishLock, ensureHtmlOwnerRoot, publishHtmlPreviewManifest, releaseHtmlPublishLock, readHtmlPreviewManifest } from './html_object_store.mjs';

const CELL_W = 420; const CELL_H = 236; const LABEL_H = 28; const PAD = 12; const BG = '#1a1d24'; const LABEL = '#e8eef6';
function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }

export const HTML_REVIEW_PLAN_SCHEMA = 'pptmaker-html-review-plan-v1';

export function buildHtmlReviewPlan({ plan, composition = null, kind, publicationScope = 'canonical-run', htmlProductionResetId = null, logicalRunVersion, outstanding = [], compositionVariant = 'effective' } = {}) {
  return buildHtmlReviewProjection({ plan, composition, kind, publicationScope, htmlProductionResetId, logicalRunVersion, outstanding, compositionVariant });
}

export function writeHtmlReviewPlan({ runDir, reviewPlan } = {}) {
  if (!reviewPlan || reviewPlan.schema !== HTML_REVIEW_PLAN_SCHEMA || !/^[0-9a-f]{64}$/.test(reviewPlan.plan_hash || '')) throw new TypeError('invalid HTML review plan');
  const ownerRoot = ensureHtmlOwnerRoot(runDir, 'preview');
  const plansDir = `${ownerRoot}/plans`; mkdirSync(plansDir, { recursive: true });
  const path = `${plansDir}/${reviewPlan.plan_hash}.json`; const bytes = Buffer.from(`${canonicalJson(reviewPlan)}\n`);
  if (existsSync(path)) { if (sha256(readFileSync(path)) !== sha256(bytes)) throw new Error('immutable HTML review plan collision'); return Object.freeze({ path, sha256: sha256(bytes), plan: reviewPlan, reused: true }); }
  const temp = `${path}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(temp, bytes, { flag: 'wx', mode: 0o600 });
  try { renameSync(temp, path); } catch (error) { if (existsSync(temp)) unlinkSync(temp); throw error; }
  return Object.freeze({ path, sha256: sha256(bytes), plan: reviewPlan, reused: false });
}

export async function publishHtmlReviewPlan({ runDir, plan, composition = null, kind, publicationScope = 'canonical-run', htmlProductionResetId = null, logicalRunVersion = basename(runDir), outstanding = [], compositionVariant = 'effective', dryRun = false } = {}) {
  const reviewPlan = buildHtmlReviewPlan({ plan, composition, kind, publicationScope, htmlProductionResetId, logicalRunVersion, outstanding, compositionVariant });
  if (dryRun) return Object.freeze({ reviewPlan, published: false, dry_run: true });
  const stored = writeHtmlReviewPlan({ runDir, reviewPlan });
  const ownerRoot = ensureHtmlOwnerRoot(runDir, 'preview'); const previous = readHtmlPreviewManifest(ownerRoot, { publicationScope, htmlProductionResetId, logicalRunVersion });
  const lock = acquireHtmlPublishLock({ ownerRoot, ownerKind: 'preview', publicationScope, htmlProductionResetId, inputScopeSha256: reviewPlan.plan_hash, priorManifestSha256: previous?.sha256 ?? null });
  try {
    const slot = { path: `plans/${reviewPlan.plan_hash}.json`, sha256: stored.sha256, owner: `html-review-plan-${kind}-v1`, owner_digest: reviewPlan.plan_hash, composition_variants: reviewPlan.composition_variants };
    const slots = kind === 'content'
      ? { review_plans: { content: slot, visual: null }, contact_sheets: { visual_review: null, delivery: null } }
      : { review_plans: { visual: slot }, contact_sheets: { delivery: null } };
    const manifest = publishHtmlPreviewManifest({ ownerRoot, ownerToken: lock.ownerToken, publicationScope, htmlProductionResetId, logicalRunVersion, slots, priorManifestSha256: previous?.sha256 ?? null });
    return Object.freeze({ reviewPlan, stored, published: true, manifest });
  } finally { releaseHtmlPublishLock(lock); }
}

export async function buildHtmlContactSheet({ orderedEntries, columns = 4 } = {}) {
  if (!Array.isArray(orderedEntries) || !orderedEntries.length) throw new Error('HTML contact sheet requires a complete ordered final-slide set');
  const cols = Math.max(1, Math.min(8, Number(columns) || 4)); const rows = Math.ceil(orderedEntries.length / cols);
  const canvas = createCanvas(PAD * 2 + cols * CELL_W + (cols - 1) * PAD, PAD * 2 + rows * (CELL_H + LABEL_H) + (rows - 1) * PAD);
  const ctx = canvas.getContext('2d'); ctx.fillStyle = BG; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.font = '16px sans-serif'; ctx.fillStyle = LABEL;
  for (let index = 0; index < orderedEntries.length; index += 1) {
    const entry = orderedEntries[index]; const col = index % cols; const row = Math.floor(index / cols); const x = PAD + col * (CELL_W + PAD); const y = PAD + row * (CELL_H + LABEL_H + PAD);
    const image = await loadImage(readFileSync(entry.path)); ctx.drawImage(image, x, y, CELL_W, CELL_H); ctx.fillText(String(entry.slide_id), x + 4, y + CELL_H + 20);
  }
  return Object.freeze({ bytes: canvas.toBuffer('image/png'), width: canvas.width, height: canvas.height, sha256: sha256(canvas.toBuffer('image/png')), ordered_slide_ids: orderedEntries.map((entry) => entry.slide_id) });
}

export async function publishHtmlDeliveryContactSheet({ runDir, orderedEntries, publicationScope = 'canonical-run', htmlProductionResetId = null, logicalRunVersion = basename(runDir), slot = 'delivery', ownerDigest = null, dryRun = false } = {}) {
  if (!['visual_review', 'delivery'].includes(slot)) throw new TypeError('HTML contact sheet slot must be visual_review or delivery');
  const sheet = await buildHtmlContactSheet({ orderedEntries });
  if (dryRun) return Object.freeze({ ...sheet, published: false, dry_run: true });
  const ownerRoot = ensureHtmlOwnerRoot(runDir, 'preview'); const previous = readHtmlPreviewManifest(ownerRoot, { publicationScope, htmlProductionResetId, logicalRunVersion });
  const lock = acquireHtmlPublishLock({ ownerRoot, ownerKind: 'preview', publicationScope, htmlProductionResetId, inputScopeSha256: sha256(JSON.stringify({ ordered_slide_ids: sheet.ordered_slide_ids, output_sha256: sheet.sha256 })), priorManifestSha256: previous?.sha256 ?? null });
  try {
    const object = writeHtmlObject({ ownerRoot, bytes: sheet.bytes, extension: 'png', ownerToken: lock.ownerToken });
    const contactSlots = { [slot]: { path: object.path, sha256: object.sha256, owner: `html-${slot.replace('_', '-')}-contact-sheet-v1`, owner_digest: ownerDigest || sheet.sha256, composition_variants: ['effective'] }, ...(slot === 'visual_review' ? { delivery: null } : {}) };
    const manifest = publishHtmlPreviewManifest({ ownerRoot, ownerToken: lock.ownerToken, publicationScope, htmlProductionResetId, logicalRunVersion, slots: { contact_sheets: contactSlots }, priorManifestSha256: previous?.sha256 ?? null });
    return Object.freeze({ ...sheet, published: true, manifest });
  } finally { releaseHtmlPublishLock(lock); }
}
