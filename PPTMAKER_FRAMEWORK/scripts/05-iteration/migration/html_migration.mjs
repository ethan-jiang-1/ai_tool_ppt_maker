import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { canonicalJson, canonicalJsonSha256 } from '../../contracts/canonical_json.mjs';
import { checkBundle, deckRoot, findSlideSpecs, nextVersionName, SCRATCH_SUBDIR, GEN_QA_SUBDIR, checkStagedVersion } from '../../shared/run-bundle/bundle_layout.mjs';
import { probeProductionMarker, validateAndBuildHtmlFirstPlan } from '../../03-html-production/internal/html_slide_contract.mjs';
import { createCanonicalHtmlValidatedRunContext, createMigrationPreviewHtmlValidatedRunContext, publishHtmlComposition } from '../../03-html-production/internal/html_slide_renderer.mjs';
import { classifyHtmlOwnerLiveness, htmlOwnerRoot, readHtmlCurrentManifest, readHtmlPreviewManifest } from '../../03-html-production/internal/html_object_store.mjs';
import { publishHtmlDeliveryContactSheet } from '../../03-html-production/internal/html_preview.mjs';
import { readState } from '../../shared/state/state.mjs';
import { ARTIFACT_KIND_FINAL_SLIDE, ARTIFACT_STATUS_VERIFIED, RENDER_ENGINE_IMAGE2, readArtifactManifest, resolveRenderArtifact } from '../../shared/identity/render_artifacts.mjs';

const MIGRATION_DIR = 'html-migration';
const MIGRATION_CANDIDATE_SOURCE = 'slide-specifications.md';
const MIGRATION_PROJECTED_RUN = 'projected-run';
const MIGRATION_PLAN_FILE = 'plan.json';
const MIGRATION_JOURNAL_FILE = 'apply-journal.json';
const MIGRATION_PREVIEW_SCHEMA = 'pptmaker-html-migration-preview-v1';
const MIGRATION_APPLY_REPORT_SCHEMA = 'pptmaker-html-migration-apply-report-v1';
const MIGRATION_JOURNAL_SCHEMA = 'pptmaker-html-migration-apply-journal-v1';
const MIGRATION_SUCCESS_SCHEMA = 'pptmaker-html-migration-success-v1';
const AUTO_RECOVERY_MS = 60_000;
const EXPLICIT_RECOVERY_MS = 300_000;
const HEX_RE = /^[0-9a-f]{64}$/;

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function currentHost() {
  return process.env.HOSTNAME || process.env.COMPUTERNAME || 'localhost';
}

function migrationRoot(runDir) {
  return join(resolve(runDir), SCRATCH_SUBDIR, MIGRATION_DIR);
}

function candidateSourcePath(runDir) {
  return join(migrationRoot(runDir), MIGRATION_CANDIDATE_SOURCE);
}

function projectedRunPath(runDir) {
  return join(migrationRoot(runDir), MIGRATION_PROJECTED_RUN);
}

function planPath(runDir) {
  return join(migrationRoot(runDir), MIGRATION_PLAN_FILE);
}

function journalPath(runDir) {
  return join(migrationRoot(runDir), MIGRATION_JOURNAL_FILE);
}

function migrationRelativePath(runDir, path) {
  return relative(resolve(runDir), resolve(path)).split(sep).join('/');
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function copyTree(src, dest) {
  if (!existsSync(src)) return false;
  const stat = statSync(src);
  if (!stat.isDirectory()) {
    ensureDir(dirname(dest));
    copyFileSync(src, dest);
    return true;
  }
  ensureDir(dest);
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const from = join(src, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory()) copyTree(from, to);
    else if (entry.isSymbolicLink()) throw new Error(`migration transaction cannot follow symlink ${from}`);
    else copyFileSync(from, to);
  }
  return true;
}

function writeCanonicalJson(path, value, { replace = true } = {}) {
  ensureDir(dirname(path));
  const temp = join(dirname(path), `.${basename(path)}.${process.pid}.${Date.now()}.tmp`);
  writeFileSync(temp, `${canonicalJson(value)}\n`, { flag: 'wx', mode: 0o600 });
  try {
    if (!replace && existsSync(path)) throw new Error(`conflict at ${path}`);
    renameSync(temp, path);
  } catch (error) {
    if (existsSync(temp)) rmSync(temp, { force: true });
    throw error;
  }
  return path;
}

function writeCanonicalJsonNoReplace(path, value) {
  if (existsSync(path)) throw new Error(`conflict at ${path}`);
  return writeCanonicalJson(path, value, { replace: false });
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${error.message}`);
  }
}

function stableSlideSummary(plan) {
  return (plan?.slides || []).map((slide) => ({
    slide_id: slide.slide_id,
    title: slide.title || slide.header?.title || '',
    visual_type: slide.visual_type || '',
    family: slide.family || '',
    body_sha256: sha256(Buffer.from(canonicalJson(slide.body || null))),
  }));
}

function diffSlideSummaries(basePlan, candidatePlan) {
  const base = new Map(stableSlideSummary(basePlan).map((slide) => [slide.slide_id, slide]));
  const candidate = new Map(stableSlideSummary(candidatePlan).map((slide) => [slide.slide_id, slide]));
  const baseIds = [...base.keys()];
  const candidateIds = [...candidate.keys()];
  const added = candidateIds.filter((id) => !base.has(id));
  const removed = baseIds.filter((id) => !candidate.has(id));
  const changed = candidateIds.filter((id) => {
    const left = base.get(id);
    const right = candidate.get(id);
    return left && right && canonicalJsonSha256(left) !== canonicalJsonSha256(right);
  });
  const reordered = candidateIds.filter((id, index) => baseIds[index] !== id && base.has(id));
  return Object.freeze({
    added_slide_ids: added,
    removed_slide_ids: removed,
    changed_slide_ids: changed,
    reordered_slide_ids: reordered,
    base_slide_count: baseIds.length,
    candidate_slide_count: candidateIds.length,
  });
}

function validateCandidatePresence(runDir) {
  const path = candidateSourcePath(runDir);
  if (!existsSync(path)) {
    throw new Error('missing migration candidate source in _scratch/html-migration/slide-specifications.md');
  }
  return path;
}

function validatePreviewPlanShape(plan, planHash) {
  if (!plan || plan.schema !== MIGRATION_PREVIEW_SCHEMA) throw new Error('invalid migration preview plan');
  if (plan.plan_hash !== planHash) throw new Error('migration preview plan hash drifted');
  if (!['canonical-run', 'migration-preview'].includes(plan.publication_scope)) throw new Error('migration preview plan scope is invalid');
  if (plan.publication_scope !== 'migration-preview') throw new Error('migration preview plan must use migration-preview scope');
  if (plan.html_production_reset_id !== null) throw new Error('migration preview plan reset ID must be null');
  if (typeof plan.source_version !== 'string' || !plan.source_version || typeof plan.target_version !== 'string' || !plan.target_version) throw new Error('migration preview plan versions are invalid');
  if (!['verified-current', 'degraded-missing', 'degraded-stale'].includes(plan.old_side_mode)) throw new Error('migration preview plan old-side mode is invalid');
  if (!Array.isArray(plan.base_receipts) || !Array.isArray(plan.candidate_receipts)) throw new Error('migration preview plan receipts are invalid');
  if (!Array.isArray(plan.ordered_composition_fingerprints) || !Array.isArray(plan.final_png_shas) || typeof plan.contact_sheet_sha !== 'string') throw new Error('migration preview plan output lineage is invalid');
  return true;
}

function assertPreviewInputsCurrent(plan, evidence) {
  if (canonicalJsonSha256(plan.base_receipts) !== canonicalJsonSha256(evidence.base.receipts)) {
    throw new Error('migration base source/control receipts changed after preview');
  }
  if (canonicalJsonSha256(plan.candidate_receipts) !== canonicalJsonSha256(evidence.candidate.receipts)) {
    throw new Error('migration candidate source/control receipts changed after preview');
  }
}

function validateJournalShape(journal) {
  if (!journal || journal.schema !== MIGRATION_JOURNAL_SCHEMA) throw new Error('migration journal is invalid');
  if (!HEX_RE.test(journal.owner_token || '')) throw new Error('migration journal owner token is invalid');
  if (!journal.host || typeof journal.host !== 'string') throw new Error('migration journal host is invalid');
  if (!Number.isInteger(journal.pid) || journal.pid <= 0) throw new Error('migration journal pid is invalid');
  if (!Number.isFinite(journal.created_at_epoch_ms)) throw new Error('migration journal age is invalid');
  if (typeof journal.source_execution_id !== 'string' || !journal.source_execution_id) throw new Error('migration journal source execution is invalid');
  if (typeof journal.source_version !== 'string' || !journal.source_version || typeof journal.target_version !== 'string' || !journal.target_version) throw new Error('migration journal versions are invalid');
  if (!HEX_RE.test(journal.plan_hash || '')) throw new Error('migration journal plan hash is invalid');
  if (!['verified-current', 'degraded-missing', 'degraded-stale'].includes(journal.old_side_mode)) throw new Error('migration journal old-side mode is invalid');
  if (
    journal.reservation_basename !== `.${journal.target_version}.migration-reservation-${journal.owner_token}` ||
    journal.staging_basename !== `.${journal.target_version}.migration-staging-${journal.owner_token}`
  ) throw new Error('migration journal basenames are invalid');
  return true;
}

function activeMigrationExecution(runDir, expectedPlanHash, expectedMode) {
  const state = readState(deckRoot(runDir), { heal: false });
  if (state?.corrupted) throw new Error('migration source state is unreadable');
  if (state.playbook !== 'migrate-import' || !state.execution_id) throw new Error('exact active source migrate-import apply execution is required');
  const current = state.nodes?.[state.current_node] || null;
  if (!current || current.execution_id !== state.execution_id || current.status !== 'in_progress') throw new Error('exact active source migrate-import apply execution is required');
  const declaredPlanHash = current.migration_plan_hash || current.plan_hash || state.migration_plan_hash || state.plan_hash;
  const declaredMode = current.old_side_mode || current.migration_old_side_mode || state.old_side_mode || state.migration_old_side_mode;
  if (!HEX_RE.test(declaredPlanHash || '') || !['verified-current', 'degraded-missing', 'degraded-stale'].includes(declaredMode || '')) {
    throw new Error('exact active source migrate-import apply execution is required');
  }
  if (declaredPlanHash !== expectedPlanHash || declaredMode !== expectedMode) throw new Error('active migration execution does not match the confirmed plan hash/mode');
  return { state, executionId: state.execution_id, nodeId: state.current_node, node: current, planHash: declaredPlanHash, oldSideMode: declaredMode };
}

function buildSourceEvidence(sourceRunDir) {
  const sourcePath = findSlideSpecs(sourceRunDir);
  if (!sourcePath) throw new Error('migration source version has no slide specifications');
  const marker = probeProductionMarker(readFileSync(sourcePath), { source: migrationRelativePath(sourceRunDir, sourcePath) });
  if (marker.branch === 'invalid') throw new Error('migration source marker is invalid');
  const baseResult = marker.branch === 'html-first-v1'
    ? validateAndBuildHtmlFirstPlan({ runDir: sourceRunDir })
    : null;
  const candidatePath = validateCandidatePresence(sourceRunDir);
  const candidateResult = validateAndBuildHtmlFirstPlan({ runDir: sourceRunDir, sourcePathOverride: candidatePath });
  const base = baseResult
    ? { ...baseResult.validated, plan: baseResult.plan, pipeline: 'html-first-v1' }
    : {
      pipeline: 'legacy',
      plan: null,
      receipts: [{ path: migrationRelativePath(sourceRunDir, sourcePath), sha256: sha256(readFileSync(sourcePath)) }],
    };
  const candidate = { ...candidateResult.validated, plan: candidateResult.plan };
  return { base, candidate, candidatePath };
}

function legacyOldSideEvidence(sourceRunDir, candidatePlan) {
  const finalDir = join(sourceRunDir, '_generated', 'header_locked');
  const { manifest, error } = readArtifactManifest(join(finalDir, '_manifest.json'));
  if (!manifest) {
    return { mode: 'degraded-missing', evidence: { mode: 'degraded-missing', reason: error || 'legacy final-slide manifest is missing', parity_claim: false, provider_calls: false } };
  }
  const artifacts = candidatePlan.slides.map((slide) => resolveRenderArtifact({
    directory: finalDir,
    manifest,
    manifestError: error,
    slideId: slide.slide_id,
    renderEngine: RENDER_ENGINE_IMAGE2,
    artifactKind: ARTIFACT_KIND_FINAL_SLIDE,
    allowLegacyLocate: false,
  }));
  if (artifacts.every((artifact) => artifact.status === ARTIFACT_STATUS_VERIFIED)) {
    return {
      mode: 'verified-current',
      evidence: {
        mode: 'verified-current',
        manifest_sha256: sha256(readFileSync(join(finalDir, '_manifest.json'))),
        final_slide_shas: artifacts.map((artifact) => artifact.byte_sha256),
        parity_claim: false,
        provider_calls: false,
      },
    };
  }
  return {
    mode: 'degraded-stale',
    evidence: {
      mode: 'degraded-stale',
      reason: 'legacy final-slide evidence is incomplete, stale, or not adaptable to the candidate identities',
      parity_claim: false,
      provider_calls: false,
    },
  };
}

async function renderWorkspace({ sourceRunDir, publicationRunDir, candidateSourcePath: candidatePath, logicalRunVersion, allowHiddenRunDir = false }) {
  const context = allowHiddenRunDir
    ? createCanonicalHtmlValidatedRunContext({ runDir: publicationRunDir, logicalRunVersion, allowHiddenRunDir: true })
    : createMigrationPreviewHtmlValidatedRunContext({ sourceRunDir, publicationRunDir, candidateSourcePath: candidatePath, logicalRunVersion });
  const pages = await publishHtmlComposition(context, {});
  const finalRoot = htmlOwnerRoot(publicationRunDir, 'final-slides');
  const finalManifest = readHtmlCurrentManifest(finalRoot, { expectedSchema: 'pptmaker-html-final-slides-manifest-v1', publicationScope: allowHiddenRunDir ? 'canonical-run' : 'migration-preview', htmlProductionResetId: null });
  const orderedEntries = finalManifest.manifest.entries.map((entry) => ({ slide_id: entry.slide_id, path: join(finalRoot, ...entry.path.split('/')) }));
  const delivery = await publishHtmlDeliveryContactSheet({
    runDir: publicationRunDir,
    orderedEntries,
    publicationScope: allowHiddenRunDir ? 'canonical-run' : 'migration-preview',
    htmlProductionResetId: null,
    logicalRunVersion,
    slot: 'delivery',
    ownerDigest: pages.html_delivery_digest || canonicalJsonSha256({ ordered_slide_ids: orderedEntries.map((entry) => entry.slide_id), publication_scope: allowHiddenRunDir ? 'canonical-run' : 'migration-preview' }),
  });
  const previewManifest = readHtmlPreviewManifest(htmlOwnerRoot(publicationRunDir, 'preview'), { publicationScope: allowHiddenRunDir ? 'canonical-run' : 'migration-preview', htmlProductionResetId: null, logicalRunVersion });
  return { context, pages, finalManifest, delivery, previewManifest };
}

function buildPreviewPlan({ sourceRunDir, candidate, base, projectedRunDir: projectedRun, oldSideMode, oldSideEvidence, targetVersion, sourceDiff, rendered }) {
  const finalEntries = rendered.finalManifest.manifest.entries;
  const orderedCompositionFingerprints = finalEntries.map((entry) => entry.composition_fingerprint);
  const finalPngShas = finalEntries.map((entry) => entry.sha256);
  const contactSheetSha = rendered.delivery.sha256;
  const htmlDeliveryDigest = rendered.pages.html_delivery_digest || canonicalJsonSha256({ ordered_plan_digest: candidate.plan.ordered_plan_digest, slides: finalEntries.map((entry) => ({ slide_id: entry.slide_id, composition_fingerprint: entry.composition_fingerprint, png_sha256: entry.sha256 })) });
  const body = {
    schema: MIGRATION_PREVIEW_SCHEMA,
    publication_scope: 'migration-preview',
    html_production_reset_id: null,
    source_version: basename(sourceRunDir),
    target_version: targetVersion,
    old_side_mode: oldSideMode,
    old_side_evidence: {
      ...oldSideEvidence,
    },
    base_receipts: base.receipts,
    candidate_receipts: candidate.receipts,
    source_diff: sourceDiff,
    ordered_composition_fingerprints: orderedCompositionFingerprints,
    final_png_shas: finalPngShas,
    contact_sheet_sha: contactSheetSha,
    html_delivery_digest: htmlDeliveryDigest,
    projected_run: migrationRelativePath(sourceRunDir, projectedRun),
  };
  const planHash = canonicalJsonSha256(body);
  return Object.freeze({ ...body, plan_hash: planHash });
}

async function renderPreviewWorkspace(sourceRunDir) {
  const candidatePath = validateCandidatePresence(sourceRunDir);
  const targetVersion = nextVersionName(sourceRunDir);
  const projectedRun = projectedRunPath(sourceRunDir);
  rmSync(projectedRun, { recursive: true, force: true });
  ensureDir(projectedRun);
  const evidence = buildSourceEvidence(sourceRunDir);
  const oldSide = legacyOldSideEvidence(sourceRunDir, evidence.candidate.plan);
  const rendered = await renderWorkspace({
    sourceRunDir,
    publicationRunDir: projectedRun,
    candidateSourcePath: candidatePath,
    logicalRunVersion: targetVersion,
    allowHiddenRunDir: false,
  });
  const sourceDiff = diffSlideSummaries(evidence.base.plan, evidence.candidate.plan);
  const plan = buildPreviewPlan({
    sourceRunDir,
    candidate: evidence.candidate,
    base: evidence.base,
    projectedRunDir: projectedRun,
    oldSideMode: oldSide.mode,
    oldSideEvidence: oldSide.evidence,
    targetVersion,
    sourceDiff,
    rendered,
  });
  writeCanonicalJson(planPath(sourceRunDir), plan);
  return {
    schema: MIGRATION_PREVIEW_SCHEMA,
    status: 'previewed',
    source_version: basename(sourceRunDir),
    target_version: targetVersion,
    projected_run: migrationRelativePath(sourceRunDir, projectedRun),
    plan_hash: plan.plan_hash,
    plan_path: migrationRelativePath(sourceRunDir, planPath(sourceRunDir)),
    old_side_mode: plan.old_side_mode,
    old_side_evidence: plan.old_side_evidence,
    source_diff: plan.source_diff,
    base_receipts: plan.base_receipts,
    candidate_receipts: plan.candidate_receipts,
    ordered_composition_fingerprints: plan.ordered_composition_fingerprints,
    final_png_shas: plan.final_png_shas,
    contact_sheet_sha: plan.contact_sheet_sha,
    html_delivery_digest: plan.html_delivery_digest,
  };
}

function journalRecoveryMode(journal, token, now = Date.now()) {
  const liveness = classifyHtmlOwnerLiveness(journal, { now, host: currentHost() });
  if (liveness.status === 'invalid') throw new Error(`migration journal ${liveness.reason}`);
  if (liveness.status === 'active') return liveness;
  if (liveness.status === 'waiting') return liveness;
  if (liveness.status === 'recoverable') return { ...liveness, status: 'recoverable-abort', mode: 'same-host-dead' };
  if (token !== journal.owner_token) return { ...liveness, status: 'forbidden' };
  if (liveness.age_ms < EXPLICIT_RECOVERY_MS) {
    return { ...liveness, status: 'waiting', retry_after_ms: EXPLICIT_RECOVERY_MS - liveness.age_ms };
  }
  return { ...liveness, status: 'recoverable-cleanup', mode: 'confirmed-owner' };
}

function exactSuccessReceipt(runDir, expectedSourceVersion, targetVersion, expectedPlanHash, expectedMode, expectedSourceExecutionId) {
  const successPath = join(runDir, '_generated', GEN_QA_SUBDIR, 'html_migration.json');
  if (!existsSync(successPath)) return null;
  const receipt = readJson(successPath, 'migration success receipt');
  if (
    receipt.schema !== MIGRATION_SUCCESS_SCHEMA ||
    receipt.pipeline !== 'html-first-v1' ||
    receipt.publication_scope !== 'canonical-run' ||
    receipt.source_execution_id !== expectedSourceExecutionId ||
    receipt.source_version !== expectedSourceVersion ||
    receipt.target_version !== targetVersion ||
    receipt.plan_hash !== expectedPlanHash ||
    receipt.old_side_mode !== expectedMode
  ) {
    return { valid: false, receipt, path: successPath };
  }
  return { valid: true, receipt, path: successPath };
}

function verifyTargetOutputs(targetRunDir, expectedPlan, rendered) {
  const finalRoot = htmlOwnerRoot(targetRunDir, 'final-slides');
  const finalManifest = readHtmlCurrentManifest(finalRoot, { expectedSchema: 'pptmaker-html-final-slides-manifest-v1', publicationScope: 'canonical-run', htmlProductionResetId: null });
  const finalEntries = finalManifest.manifest.entries;
  const orderedCompositionFingerprints = finalEntries.map((entry) => entry.composition_fingerprint);
  const finalPngShas = finalEntries.map((entry) => entry.sha256);
  const renderedFinalEntries = rendered.finalManifest.manifest.entries;
  const renderedFingerprints = renderedFinalEntries.map((entry) => entry.composition_fingerprint);
  const renderedShas = renderedFinalEntries.map((entry) => entry.sha256);
  if (canonicalJsonSha256(orderedCompositionFingerprints) !== canonicalJsonSha256(expectedPlan.ordered_composition_fingerprints)) throw new Error('migration target composition fingerprints differ from preview');
  if (canonicalJsonSha256(finalPngShas) !== canonicalJsonSha256(expectedPlan.final_png_shas)) throw new Error('migration target final PNG SHAs differ from preview');
  if (renderedFingerprints.length !== orderedCompositionFingerprints.length || renderedShas.length !== finalPngShas.length) {
    throw new Error('migration target output count differs from preview');
  }
  if (canonicalJsonSha256(renderedFingerprints) !== canonicalJsonSha256(orderedCompositionFingerprints) || canonicalJsonSha256(renderedShas) !== canonicalJsonSha256(finalPngShas)) {
    throw new Error('migration target rendered outputs differ from published target');
  }
  const targetDeliveryDigest = rendered.html_delivery_digest || canonicalJsonSha256({ ordered_plan_digest: expectedPlan.html_delivery_digest || '', slides: renderedFinalEntries.map((entry) => ({ slide_id: entry.slide_id, composition_fingerprint: entry.composition_fingerprint, png_sha256: entry.sha256 })) });
  if (targetDeliveryDigest !== expectedPlan.html_delivery_digest) throw new Error('migration target delivery digest differs from preview');
  const previewManifest = readHtmlPreviewManifest(htmlOwnerRoot(targetRunDir, 'preview'), { publicationScope: 'canonical-run', htmlProductionResetId: null, logicalRunVersion: expectedPlan.target_version });
  if (!previewManifest || !previewManifest.manifest.contact_sheets.delivery || previewManifest.manifest.contact_sheets.delivery.sha256 !== expectedPlan.contact_sheet_sha) {
    throw new Error('migration target contact sheet differs from preview');
  }
  return {
    finalManifest,
    orderedCompositionFingerprints,
    finalPngShas,
    contactSheetSha: expectedPlan.contact_sheet_sha,
    htmlDeliveryDigest: targetDeliveryDigest,
  };
}

function createHiddenTargetRun(sourceRunDir, targetVersion, token) {
  const parent = dirname(resolve(sourceRunDir));
  const staging = join(parent, `.${targetVersion}.migration-staging-${token}`);
  const reservation = join(parent, `.${targetVersion}.migration-reservation-${token}`);
  rmSync(staging, { recursive: true, force: true });
  rmSync(reservation, { recursive: true, force: true });
  ensureDir(staging);
  const candidatePath = validateCandidatePresence(sourceRunDir);
  copyFileSync(candidatePath, join(staging, MIGRATION_CANDIDATE_SOURCE));
  const baseOverrides = join(sourceRunDir, 'overrides');
  const candidateOverrides = join(migrationRoot(sourceRunDir), 'overrides');
  copyTree(baseOverrides, join(staging, 'overrides'));
  copyTree(candidateOverrides, join(staging, 'overrides'));
  ensureDir(join(staging, '_generated'));
  ensureDir(join(staging, '_scratch'));
  writeFileSync(join(staging, '_generated', 'README.md'), '# generated\n', 'utf8');
  writeFileSync(join(staging, '_scratch', 'README.md'), '# scratch\n', 'utf8');
  writeFileSync(join(staging, 'README.md'), `# migration staging ${targetVersion}\n`, 'utf8');
  return { staging, reservation, candidatePath };
}

function removeOwnedMigrationPaths(sourceRunDir, targetVersion, token) {
  const parent = dirname(resolve(sourceRunDir));
  const staging = join(parent, `.${targetVersion}.migration-staging-${token}`);
  const reservation = join(parent, `.${targetVersion}.migration-reservation-${token}`);
  rmSync(staging, { recursive: true, force: true });
  rmSync(reservation, { recursive: true, force: true });
  rmSync(journalPath(sourceRunDir), { force: true });
}

function normalizePreviewPlan(plan) {
  const copy = { ...plan };
  return copy;
}

async function renderCanonicalTarget(sourceRunDir, targetVersion, token, expectedPlanHash) {
  const hidden = createHiddenTargetRun(sourceRunDir, targetVersion, token);
  try {
    const stagedIssues = checkStagedVersion(hidden.staging);
    if (stagedIssues.length > 0) throw new Error(`hidden canonical migration target is invalid: ${stagedIssues.join('; ')}`);
    const stage1 = await import('../../03-html-production/unified_pipeline.mjs').then((mod) => mod.stage1);
    if (!await stage1(hidden.staging, false)) throw new Error('hidden canonical stage 1 failed');
    const context = createCanonicalHtmlValidatedRunContext({ runDir: hidden.staging, logicalRunVersion: targetVersion, allowHiddenRunDir: true });
    const rendered = await publishHtmlComposition(context, {});
    const finalRoot = htmlOwnerRoot(hidden.staging, 'final-slides');
    const finalManifest = readHtmlCurrentManifest(finalRoot, { expectedSchema: 'pptmaker-html-final-slides-manifest-v1', publicationScope: 'canonical-run', htmlProductionResetId: null });
    const orderedEntries = finalManifest.manifest.entries.map((entry) => ({ slide_id: entry.slide_id, path: join(finalRoot, ...entry.path.split('/')) }));
    const delivery = await publishHtmlDeliveryContactSheet({
      runDir: hidden.staging,
      orderedEntries,
      publicationScope: 'canonical-run',
      htmlProductionResetId: null,
      logicalRunVersion: targetVersion,
      slot: 'delivery',
    ownerDigest: rendered.html_delivery_digest || expectedPlanHash,
    });
    return { hidden, rendered, finalManifest, delivery };
  } catch (error) {
    rmSync(hidden.staging, { recursive: true, force: true });
    throw error;
  }
}

function writeSuccessReceipt(targetRunDir, sourceVersion, targetVersion, plan, targetLineage, sourceExecutionId) {
  const receipt = {
    schema: MIGRATION_SUCCESS_SCHEMA,
    pipeline: 'html-first-v1',
    publication_scope: 'canonical-run',
    source_execution_id: sourceExecutionId,
    source_version: sourceVersion,
    target_version: targetVersion,
    plan_hash: plan.plan_hash,
    old_side_mode: plan.old_side_mode,
    base_receipts: plan.base_receipts,
    candidate_receipts: plan.candidate_receipts,
    ordered_composition_fingerprints: targetLineage.orderedCompositionFingerprints,
    final_png_shas: targetLineage.finalPngShas,
    contact_sheet_sha: targetLineage.contactSheetSha,
    html_delivery_digest: targetLineage.htmlDeliveryDigest,
    created_at_epoch_ms: Date.now(),
  };
  const receiptPath = join(targetRunDir, '_generated', GEN_QA_SUBDIR, 'html_migration.json');
  writeCanonicalJsonNoReplace(receiptPath, receipt);
  return { receipt, receiptPath };
}

export async function previewHtmlMigration(runDir) {
  const sourceRunDir = resolve(runDir);
  const structureIssues = checkBundle(sourceRunDir, false);
  if (structureIssues.length > 0) throw new Error(`source version is invalid: ${structureIssues.join('; ')}`);
  validateCandidatePresence(sourceRunDir);
  if (existsSync(journalPath(sourceRunDir))) throw new Error('CONFLICT: migration apply journal already exists');
  return renderPreviewWorkspace(sourceRunDir);
}

export async function applyHtmlMigration(runDir, { planHash = null, oldSideMode = null, recoverJournalToken = null } = {}) {
  const sourceRunDir = resolve(runDir);
  const sourceScratchRoot = migrationRoot(sourceRunDir);
  const planFile = planPath(sourceRunDir);
  if (!existsSync(planFile)) throw new Error('migration preview plan is missing; run preview first');
  const plan = readJson(planFile, 'migration preview plan');
  validatePreviewPlanShape(plan, plan.plan_hash);
  const expectedPlanHash = planHash || plan.plan_hash;
  const expectedMode = oldSideMode || plan.old_side_mode;
  if (!HEX_RE.test(expectedPlanHash || '')) throw new TypeError('plan hash must be a 64-lowercase-hex SHA-256');
  if (!['verified-current', 'degraded-missing', 'degraded-stale'].includes(expectedMode || '')) throw new TypeError('old-side mode must be verified-current, degraded-missing, or degraded-stale');
  if (plan.plan_hash !== expectedPlanHash) throw new Error('migration apply plan hash does not match the preview plan');
  if (plan.old_side_mode !== expectedMode) throw new Error('migration apply old-side mode does not match the preview plan');
  const sourceExecution = activeMigrationExecution(sourceRunDir, expectedPlanHash, expectedMode);
  const targetVersion = plan.target_version;
  const targetRunDir = join(dirname(sourceRunDir), targetVersion);
  const existingTarget = exactSuccessReceipt(targetRunDir, basename(sourceRunDir), targetVersion, expectedPlanHash, expectedMode, sourceExecution.executionId);
  if (existingTarget?.valid) {
    return {
      schema: MIGRATION_APPLY_REPORT_SCHEMA,
      status: 'idempotent',
      source_version: basename(sourceRunDir),
      target_version: targetVersion,
      target_run_dir: migrationRelativePath(sourceRunDir, targetRunDir),
      plan_hash: expectedPlanHash,
      old_side_mode: expectedMode,
      receipt_path: migrationRelativePath(sourceRunDir, existingTarget.path),
    };
  }
  if (existsSync(journalPath(sourceRunDir)) && !recoverJournalToken) throw new Error('CONFLICT: migration apply journal already exists; use --recover-journal with the journal owner token');

  const candidatePath = validateCandidatePresence(sourceRunDir);
  const sourceEvidence = buildSourceEvidence(sourceRunDir);
  const previewPlan = readJson(planFile, 'migration preview plan');
  assertPreviewInputsCurrent(previewPlan, sourceEvidence);
  const journal = {
    schema: MIGRATION_JOURNAL_SCHEMA,
    owner_token: recoverJournalToken || randomBytes(32).toString('hex'),
    host: currentHost(),
    pid: process.pid,
    created_at_epoch_ms: Date.now(),
    source_execution_id: sourceExecution.executionId,
    source_version: basename(sourceRunDir),
    target_version: targetVersion,
    plan_hash: expectedPlanHash,
    old_side_mode: expectedMode,
    reservation_basename: `.${targetVersion}.migration-reservation-${recoverJournalToken || 'pending'}`,
    staging_basename: `.${targetVersion}.migration-staging-${recoverJournalToken || 'pending'}`,
  };
  if (recoverJournalToken && !HEX_RE.test(recoverJournalToken)) throw new TypeError('recover-journal token must be a 64-lowercase-hex owner token');
  journal.owner_token = recoverJournalToken || journal.owner_token;
  journal.reservation_basename = `.${targetVersion}.migration-reservation-${journal.owner_token}`;
  journal.staging_basename = `.${targetVersion}.migration-staging-${journal.owner_token}`;
  const journalFile = journalPath(sourceRunDir);
  if (existsSync(journalFile) && !recoverJournalToken) throw new Error('CONFLICT: migration apply journal already exists');

  writeCanonicalJsonNoReplace(journalFile, journal);
  try {
    const journalBytes = readFileSync(journalFile);
    if (sha256(journalBytes) !== sha256(Buffer.from(`${canonicalJson(journal)}\n`))) throw new Error('migration journal bytes changed before reservation');
    const parent = dirname(resolve(sourceRunDir));
    const reservation = join(parent, journal.reservation_basename);
    const staging = join(parent, journal.staging_basename);
    if (existsSync(reservation) || existsSync(staging)) {
      throw new Error('CONFLICT: migration journal-owned reservation or staging path already exists');
    }
    mkdirSync(reservation);
    mkdirSync(staging);
    copyFileSync(candidatePath, join(staging, MIGRATION_CANDIDATE_SOURCE));
    copyTree(join(sourceRunDir, 'overrides'), join(staging, 'overrides'));
    copyTree(join(sourceScratchRoot, 'overrides'), join(staging, 'overrides'));
    ensureDir(join(staging, '_generated'));
    ensureDir(join(staging, '_scratch'));
    writeFileSync(join(staging, '_generated', 'README.md'), '# generated\n', 'utf8');
    writeFileSync(join(staging, '_scratch', 'README.md'), '# scratch\n', 'utf8');
    writeFileSync(join(staging, 'README.md'), `# migration staging ${targetVersion}\n`, 'utf8');
    const stagedIssues = checkStagedVersion(staging);
    if (stagedIssues.length > 0) throw new Error(`hidden migration target is invalid: ${stagedIssues.join('; ')}`);
    if (sha256(readFileSync(journalFile)) !== sha256(Buffer.from(`${canonicalJson(journal)}\n`))) throw new Error('migration journal bytes changed before staging');
    const stage1 = await import('../../03-html-production/unified_pipeline.mjs').then((mod) => mod.stage1);
    if (!await stage1(staging, false)) throw new Error('hidden canonical Stage 1 failed');
    if (sha256(readFileSync(journalFile)) !== sha256(Buffer.from(`${canonicalJson(journal)}\n`))) throw new Error('migration journal bytes changed before canonical rerender');
    const canonicalContext = createCanonicalHtmlValidatedRunContext({ runDir: staging, logicalRunVersion: targetVersion, allowHiddenRunDir: true });
    const rendered = await publishHtmlComposition(canonicalContext, {});
    const finalRoot = htmlOwnerRoot(staging, 'final-slides');
    const finalManifest = readHtmlCurrentManifest(finalRoot, { expectedSchema: 'pptmaker-html-final-slides-manifest-v1', publicationScope: 'canonical-run', htmlProductionResetId: null });
    const actualLineage = {
      orderedCompositionFingerprints: finalManifest.manifest.entries.map((entry) => entry.composition_fingerprint),
      finalPngShas: finalManifest.manifest.entries.map((entry) => entry.sha256),
      contactSheetSha: null,
      htmlDeliveryDigest: rendered.html_delivery_digest || canonicalJsonSha256({ ordered_plan_digest: previewPlan.ordered_plan_digest, slides: finalManifest.manifest.entries.map((entry) => ({ slide_id: entry.slide_id, composition_fingerprint: entry.composition_fingerprint, png_sha256: entry.sha256 })) }),
    };
    const delivery = await publishHtmlDeliveryContactSheet({
      runDir: staging,
      orderedEntries: finalManifest.manifest.entries.map((entry) => ({ slide_id: entry.slide_id, path: join(finalRoot, ...entry.path.split('/')) })),
      publicationScope: 'canonical-run',
      htmlProductionResetId: null,
      logicalRunVersion: targetVersion,
      slot: 'delivery',
      ownerDigest: actualLineage.htmlDeliveryDigest,
    });
    actualLineage.contactSheetSha = delivery.sha256;
    if (canonicalJsonSha256(actualLineage.orderedCompositionFingerprints) !== canonicalJsonSha256(previewPlan.ordered_composition_fingerprints)) throw new Error('migration target composition fingerprints differ from preview');
    if (canonicalJsonSha256(actualLineage.finalPngShas) !== canonicalJsonSha256(previewPlan.final_png_shas)) throw new Error('migration target final PNG SHAs differ from preview');
    if (actualLineage.contactSheetSha !== previewPlan.contact_sheet_sha) throw new Error('migration target contact sheet differs from preview');
    if (actualLineage.htmlDeliveryDigest !== previewPlan.html_delivery_digest) throw new Error('migration target delivery digest differs from preview');
    const targetReceipt = writeSuccessReceipt(staging, basename(sourceRunDir), targetVersion, previewPlan, actualLineage, sourceExecution.executionId);
    if (sha256(readFileSync(journalFile)) !== sha256(Buffer.from(`${canonicalJson(journal)}\n`))) throw new Error('migration journal bytes changed before final rename');
    if (existsSync(targetRunDir)) throw new Error('migration target already exists');
    renameSync(staging, targetRunDir);
    const publishedReceiptPath = join(targetRunDir, '_generated', GEN_QA_SUBDIR, 'html_migration.json');
    const publishedReceipt = readJson(publishedReceiptPath, 'migration success receipt');
    if (publishedReceipt.schema !== MIGRATION_SUCCESS_SCHEMA || publishedReceipt.pipeline !== 'html-first-v1' || publishedReceipt.publication_scope !== 'canonical-run' || publishedReceipt.source_execution_id !== sourceExecution.executionId || publishedReceipt.source_version !== basename(sourceRunDir) || publishedReceipt.plan_hash !== previewPlan.plan_hash || publishedReceipt.target_version !== targetVersion) {
      throw new Error('migration success receipt is invalid after publication');
    }
    rmSync(reservation, { recursive: true, force: true });
    rmSync(journalFile, { force: true });
    return {
      schema: MIGRATION_APPLY_REPORT_SCHEMA,
      status: 'published',
      source_version: basename(sourceRunDir),
      target_version: targetVersion,
      target_run_dir: migrationRelativePath(sourceRunDir, targetRunDir),
      plan_hash: previewPlan.plan_hash,
      old_side_mode: previewPlan.old_side_mode,
      receipt_path: migrationRelativePath(sourceRunDir, publishedReceiptPath),
      source_execution_id: sourceExecution.executionId,
      journal_path: migrationRelativePath(sourceRunDir, journalFile),
      success_receipt: targetReceipt.receipt,
    };
  } catch (error) {
    // Preserve exact owner evidence and hidden paths for the bounded recovery
    // matrix. A later owner can remove only the journal-derived paths.
    throw error;
  }
}

export async function recoverHtmlMigrationApply(runDir, { recoverJournalToken } = {}) {
  const sourceRunDir = resolve(runDir);
  const journalFile = journalPath(sourceRunDir);
  if (!existsSync(journalFile)) throw new Error('migration apply journal is absent');
  const journal = readJson(journalFile, 'migration apply journal');
  validateJournalShape(journal);
  if (!recoverJournalToken || !HEX_RE.test(recoverJournalToken)) throw new TypeError('recover-journal requires the exact 64-lowercase-hex owner token');
  const recovery = journalRecoveryMode(journal, recoverJournalToken);
  if (recovery.status === 'active') throw new Error('CONFLICT: migration apply owner is still live');
  if (recovery.status === 'waiting') throw new Error(`CONFLICT: migration apply owner recovery requires at least ${recovery.retry_after_ms} ms more`);
  if (recovery.status === 'forbidden') throw new Error('CONFLICT: migration apply owner token does not match the journal');
  const targetRunDir = join(dirname(sourceRunDir), journal.target_version);
  const exactTarget = exactSuccessReceipt(targetRunDir, journal.source_version, journal.target_version, journal.plan_hash, journal.old_side_mode, journal.source_execution_id);
  if (exactTarget?.valid) {
    const parent = dirname(resolve(sourceRunDir));
    rmSync(join(parent, journal.reservation_basename), { recursive: true, force: true });
    rmSync(join(parent, journal.staging_basename), { recursive: true, force: true });
    rmSync(journalFile, { force: true });
    return {
      schema: MIGRATION_APPLY_REPORT_SCHEMA,
      status: 'idempotent',
      source_version: basename(sourceRunDir),
      target_version: journal.target_version,
      target_run_dir: migrationRelativePath(sourceRunDir, targetRunDir),
      plan_hash: journal.plan_hash,
      old_side_mode: journal.old_side_mode,
      receipt_path: migrationRelativePath(sourceRunDir, exactTarget.path),
      recovery_mode: recovery.mode || recovery.status,
    };
  }
  if (existsSync(targetRunDir)) throw new Error('CONFLICT: migration target exists but does not match the exact success receipt');
  const parent = dirname(resolve(sourceRunDir));
  rmSync(join(parent, journal.reservation_basename), { recursive: true, force: true });
  rmSync(join(parent, journal.staging_basename), { recursive: true, force: true });
  rmSync(journalFile, { force: true });
  return applyHtmlMigration(sourceRunDir, { planHash: journal.plan_hash, oldSideMode: journal.old_side_mode });
}
