/** Private, exact-run owner operation for content-addressed path migration. */
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmdirSync,
} from "node:fs";
import { dirname, join, sep } from "node:path";

import { canonicalJson, canonicalJsonSha256 } from "../identity/canonical_json.mjs";
import {
  pageImageProgressiveRawPaths,
  pageImageStyleMasterPaths,
  pageImageWorkflowPaths,
} from "../run-bundle/page_image_paths.mjs";
import { inspectWorkflow, isWorkflowInspectionSourceReady } from "../workflow/inspect_workflow.mjs";
import {
  CONTENT_ADDRESS_LEGACY_NAME_RE,
  CONTENT_ADDRESS_MIGRATION_LOCK,
  CONTENT_ADDRESS_SHORT_NAME_RE,
  shortName,
} from "./content_address_store.mjs";
import {
  PAGE_IMAGE_COMPLETE_PAGE_REVIEW_PRESENTATION_SCHEMA,
  PAGE_IMAGE_PILOT_PAGE_REVIEW_PRESENTATION_SCHEMA,
} from "./page_image_complete_page_review.mjs";
import {
  validateProgressiveAcceptedRawEvidence,
  validateProgressiveRawBatch,
  validateProgressiveRawCompleteReview,
  validateProgressiveRawItemAttempt,
  validateProgressiveRawMaterializationProvenance,
  validateProgressiveRawPilotDecision,
  validateProgressiveRawPilotEvidence,
  validateProgressiveRawWorkPlan,
} from "./page_image_progressive_schema.mjs";
import { validateStyleMasterPlanRecord } from "./style_master_schema.mjs";

const WORKFLOWS = new Set(["framed", "pure"]);
const LOCK_NAME_RE = /^\.[A-Za-z0-9._-]+\.lock$/;
const DIRECT_RECORD_GROUPS = Object.freeze([
  ["attempts", validateProgressiveRawItemAttempt],
  ["pilot-evidence", validateProgressiveRawPilotEvidence],
  ["pilot-decisions", validateProgressiveRawPilotDecision],
  ["complete-reviews", validateProgressiveRawCompleteReview],
  ["accepted-evidence", validateProgressiveAcceptedRawEvidence],
]);

export class ContentAddressMigrationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ContentAddressMigrationError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new ContentAddressMigrationError(code, message);
}

function result(ok, code, message, extra = {}) {
  return Object.freeze({ ok, ...(ok ? {} : { code, message }), ...extra });
}

function canonicalRecord(pathname, label, { trailingNewline = true } = {}) {
  let bytes;
  let record;
  try {
    bytes = readFileSync(pathname);
    record = JSON.parse(bytes.toString("utf8"));
  } catch {
    fail("migration_record_mismatch", `${label} is not readable canonical JSON`);
  }
  if (!bytes.equals(Buffer.from(`${canonicalJson(record)}${trailingNewline ? "\n" : ""}`, "utf8"))) {
    fail("migration_record_mismatch", `${label} is not canonical JSON bytes`);
  }
  return Object.freeze({ record: Object.freeze(record), bytes: Buffer.from(bytes), sha256: canonicalJsonSha256(record) });
}

function checked(validation, label) {
  if (!validation?.ok) fail("migration_record_mismatch", `${label} is not a valid typed owner record`);
  return validation;
}

function entries(root, label) {
  if (!existsSync(root)) return [];
  let stats;
  try { stats = lstatSync(root); } catch { fail("migration_layout_invalid", `${label} is unavailable`); }
  if (!stats.isDirectory() || stats.isSymbolicLink()) fail("migration_layout_invalid", `${label} must be a real directory`);
  return readdirSync(root, { withFileTypes: true });
}

function contentAddressName(name) {
  return CONTENT_ADDRESS_LEGACY_NAME_RE.test(name) || CONTENT_ADDRESS_SHORT_NAME_RE.test(name);
}

function assertNoLocksOrSymlinks(root) {
  if (!existsSync(root)) return;
  const stats = lstatSync(root);
  if (stats.isSymbolicLink()) fail("migration_layout_invalid", `migration root is a symbolic link: ${root}`);
  if (!stats.isDirectory()) return;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const pathname = join(root, entry.name);
    if (entry.isSymbolicLink()) fail("migration_layout_invalid", `migration root contains a symbolic link: ${pathname}`);
    if (LOCK_NAME_RE.test(entry.name)) {
      fail("migration_locked", `migration preflight found owner resource lock ${pathname}; wait for the owner and rerun`);
    }
    if (entry.isDirectory()) assertNoLocksOrSymlinks(pathname);
  }
}

function assertOnly(entriesToCheck, label, predicate) {
  for (const entry of entriesToCheck) {
    if (!predicate(entry)) fail("migration_layout_invalid", `${label} contains unexpected entry ${entry.name}`);
  }
}

function addRename(plan, parent, legacyName, suffix, verify) {
  if (!CONTENT_ADDRESS_LEGACY_NAME_RE.test(legacyName)) return;
  plan.push({
    from: join(parent, `${legacyName}${suffix}`),
    to: join(parent, `${shortName(legacyName)}${suffix}`),
    verify,
    bytes: null,
  });
}

function verifyDirectoryRecord(recordName, expectedHash, validator, options, label, canonicalOptions = undefined) {
  return (pathname) => {
    const found = canonicalRecord(join(pathname, recordName), label, canonicalOptions);
    const validation = checked(validator(found.record, options), label);
    if (validation.sha256 !== expectedHash && validation.plan_sha256 !== expectedHash) {
      fail("migration_record_mismatch", `${label} does not bind the expected content address`);
    }
    return found.bytes;
  };
}

function verifyFileRecord(expectedHash, validator, options, label) {
  return (pathname) => {
    const found = canonicalRecord(pathname, label);
    const validation = checked(validator(found.record, options), label);
    if (validation.sha256 !== expectedHash) fail("migration_record_mismatch", `${label} does not bind its filename content address`);
    return found.bytes;
  };
}

function collectStylePlans(root, runVersion, plan) {
  let skipped = 0;
  const children = entries(root, "Style Master plans root");
  assertOnly(children, "Style Master plans root", (entry) => entry.isDirectory() && contentAddressName(entry.name));
  for (const entry of children) {
    const dir = join(root, entry.name);
    const record = canonicalRecord(join(dir, "candidate-plan.json"), "Style Master candidate plan", { trailingNewline: false });
    const validation = checked(validateStyleMasterPlanRecord(record.record), "Style Master candidate plan");
    if (record.record.run_version !== runVersion) continue;
    const identity = validation.plan_sha256;
    if (entry.name !== (entry.name.length === 64 ? identity : shortName(identity))) {
      fail("migration_record_mismatch", "Style Master plan directory does not match candidate-plan identity");
    }
    if (entry.name.length === 64) {
      addRename(plan, root, entry.name, "", verifyDirectoryRecord(
        "candidate-plan.json", identity, validateStyleMasterPlanRecord, undefined, "Style Master candidate plan", { trailingNewline: false },
      ));
    } else {
      skipped += 1;
    }
  }
  return skipped;
}

function collectDirectRecords(planRoot, rawPlan, plan) {
  let skipped = 0;
  for (const [group, validator] of DIRECT_RECORD_GROUPS) {
    const root = join(planRoot, group);
    const children = entries(root, `progressive ${group} root`);
    assertOnly(children, `progressive ${group} root`, (entry) => entry.isFile() && entry.name.endsWith(".json") && contentAddressName(entry.name.slice(0, -5)));
    for (const entry of children) {
      const stem = entry.name.slice(0, -5);
      const found = canonicalRecord(join(root, entry.name), `progressive ${group} record`);
      const validation = checked(validator(found.record, { plan: rawPlan }), `progressive ${group} record`);
      if (stem !== (stem.length === 64 ? validation.sha256 : shortName(validation.sha256))) {
        fail("migration_record_mismatch", `progressive ${group} record does not match its content address`);
      }
      if (stem.length === 64) addRename(plan, root, stem, ".json", verifyFileRecord(validation.sha256, validator, { plan: rawPlan }, `progressive ${group} record`));
      else skipped += 1;
    }
  }
  return skipped;
}

function collectProgressivePlans(root, runVersion, plan) {
  const planHashes = new Set();
  const batchHashes = new Set();
  let skipped = 0;
  const children = entries(root, "progressive raw plans root");
  assertOnly(children, "progressive raw plans root", (entry) => entry.isDirectory() && contentAddressName(entry.name));
  for (const entry of children) {
    const planRoot = join(root, entry.name);
    const rawPlan = canonicalRecord(join(planRoot, "work-plan.json"), "progressive raw work plan");
    const planCheck = checked(validateProgressiveRawWorkPlan(rawPlan.record), "progressive raw work plan");
    if (entry.name !== (entry.name.length === 64 ? planCheck.sha256 : shortName(planCheck.sha256))) {
      fail("migration_record_mismatch", "progressive raw plan directory does not match its work-plan identity");
    }
    if (rawPlan.record.run_version !== runVersion) continue;
    planHashes.add(planCheck.sha256);

    const batchesRoot = join(planRoot, "batches");
    const batches = entries(batchesRoot, "progressive raw batches root");
    assertOnly(batches, "progressive raw batches root", (item) => item.isDirectory() && contentAddressName(item.name));
    for (const batchEntry of batches) {
      const batchRoot = join(batchesRoot, batchEntry.name);
      const batch = canonicalRecord(join(batchRoot, "batch.json"), "progressive raw batch");
      const batchCheck = checked(validateProgressiveRawBatch(batch.record, { plan: rawPlan.record }), "progressive raw batch");
      if (batchEntry.name !== (batchEntry.name.length === 64 ? batchCheck.sha256 : shortName(batchCheck.sha256))) {
        fail("migration_record_mismatch", "progressive raw batch directory does not match its batch identity");
      }
      batchHashes.add(batchCheck.sha256);
      if (batchEntry.name.length === 64) addRename(plan, batchesRoot, batchEntry.name, "", verifyDirectoryRecord(
        "batch.json", batchCheck.sha256, validateProgressiveRawBatch, { plan: rawPlan.record }, "progressive raw batch",
      ));
      else skipped += 1;
    }

    const materializationsRoot = join(planRoot, "materializations");
    const materializations = entries(materializationsRoot, "progressive raw materializations root");
    assertOnly(materializations, "progressive raw materializations root", (item) => item.isDirectory() && contentAddressName(item.name));
    for (const item of materializations) {
      const found = canonicalRecord(join(materializationsRoot, item.name, "provenance.json"), "progressive raw materialization provenance");
      const check = checked(validateProgressiveRawMaterializationProvenance(found.record, { plan: rawPlan.record }), "progressive raw materialization provenance");
      if (item.name !== (item.name.length === 64 ? check.sha256 : shortName(check.sha256))) {
        fail("migration_record_mismatch", "progressive raw materialization directory does not match provenance identity");
      }
      if (item.name.length === 64) addRename(plan, materializationsRoot, item.name, "", verifyDirectoryRecord(
        "provenance.json", check.sha256, validateProgressiveRawMaterializationProvenance, { plan: rawPlan.record }, "progressive raw materialization provenance",
      ));
      else skipped += 1;
    }
    skipped += collectDirectRecords(planRoot, rawPlan.record, plan);
    if (entry.name.length === 64) addRename(plan, root, entry.name, "", verifyDirectoryRecord(
      "work-plan.json", planCheck.sha256, validateProgressiveRawWorkPlan, undefined, "progressive raw work plan",
    ));
    else skipped += 1;
  }
  return { planHashes, batchHashes, skipped };
}

function collectReviewRoot(root, kind, expectedHashes, plan) {
  let skipped = 0;
  const evidenceName = kind === "complete-page" ? "complete-page-review-evidence-v1.json" : "pilot-page-review-evidence-v1.json";
  const schema = kind === "complete-page" ? PAGE_IMAGE_COMPLETE_PAGE_REVIEW_PRESENTATION_SCHEMA : PAGE_IMAGE_PILOT_PAGE_REVIEW_PRESENTATION_SCHEMA;
  const field = kind === "complete-page" ? "raw_work_plan_sha256" : "batch_sha256";
  const children = entries(root, `${kind} review root`);
  assertOnly(children, `${kind} review root`, (entry) => entry.isDirectory() && contentAddressName(entry.name));
  for (const entry of children) {
    const found = canonicalRecord(join(root, entry.name, evidenceName), `${kind} review evidence`);
    const hash = found.record[field];
    if (found.record.schema !== schema || !expectedHashes.has(hash) || entry.name !== (entry.name.length === 64 ? hash : shortName(hash))) {
      fail("migration_record_mismatch", `${kind} review root is not bound to this exact run`);
    }
    const verify = (pathname) => {
      const reread = canonicalRecord(join(pathname, evidenceName), `${kind} review evidence`);
      if (reread.record.schema !== schema || reread.record[field] !== hash) fail("migration_record_mismatch", `${kind} review evidence no longer binds its address`);
      return reread.bytes;
    };
    if (entry.name.length === 64) addRename(plan, root, entry.name, "", verify);
    else skipped += 1;
  }
  return skipped;
}

function preflight(runDir, runVersion) {
  const style = pageImageStyleMasterPaths(runDir);
  const progressive = pageImageProgressiveRawPaths(runDir);
  const reviewRoot = pageImageWorkflowPaths(runDir).review_root;
  const roots = [style.plans_root, progressive.plans_root, join(reviewRoot, "complete-page"), join(reviewRoot, "pilot")];
  for (const root of roots) assertNoLocksOrSymlinks(root);

  const plan = [];
  let skipped = collectStylePlans(style.plans_root, runVersion, plan);
  const progressiveRecords = collectProgressivePlans(progressive.plans_root, runVersion, plan);
  skipped += progressiveRecords.skipped;
  skipped += collectReviewRoot(join(reviewRoot, "complete-page"), "complete-page", progressiveRecords.planHashes, plan);
  skipped += collectReviewRoot(join(reviewRoot, "pilot"), "pilot", progressiveRecords.batchHashes, plan);
  plan.sort((left, right) => right.from.split(sep).length - left.from.split(sep).length);
  const targets = new Set();
  for (const step of plan) {
    if (targets.has(step.to) || existsSync(step.to)) fail("migration_collision", `content-address migration target is occupied: ${step.to}`);
    targets.add(step.to);
    step.bytes = Buffer.from(step.verify(step.from));
  }
  return Object.freeze({ plan: Object.freeze(plan), skipped });
}

function execute(plan) {
  const completed = [];
  try {
    for (const step of plan) {
      renameSync(step.from, step.to);
      completed.push(step);
      if (!Buffer.from(step.verify(step.to)).equals(step.bytes)) {
        fail("migration_record_mismatch", `record bytes changed while renaming ${step.from}`);
      }
    }
    return { ok: true, completed };
  } catch (error) {
    let restored = true;
    for (const step of completed.reverse()) {
      try { renameSync(step.to, step.from); } catch { restored = false; }
    }
    if (!restored) return { ok: false, error: new ContentAddressMigrationError("migration_recovery_required", "migration rollback could not restore every path; resolve the lock condition and rerun this exact owner operation") };
    return { ok: false, error };
  }
}

/**
 * Migrate the caller-selected exact run only. It inspects source/state before
 * opening owner storage and never scans or chooses a sibling `3_versions/vN`.
 */
export function migrateCurrentRunContentAddresses({ runDir } = {}) {
  let inspection;
  try { inspection = inspectWorkflow({ runDir }); } catch (error) {
    return result(false, "migration_layout_invalid", error?.message || "the supplied run directory is invalid");
  }
  const workflow = inspection?.evidence_summary?.workflow;
  if (inspection?.evidence_summary?.pipeline !== "page-image-workflow-v1" || !WORKFLOWS.has(workflow) || !isWorkflowInspectionSourceReady(inspection)) {
    const action = inspection?.primary_action?.action_id;
    return result(false, action === "unsupported-protocol/export" ? action : "migration_layout_invalid", inspection?.primary_action?.summary || "the supplied run is not eligible for content-address migration");
  }
  let paths;
  try { paths = pageImageStyleMasterPaths(runDir); } catch (error) {
    return result(false, "migration_layout_invalid", error?.message || "the supplied run directory is invalid");
  }
  const lock = join(paths.deck_root, CONTENT_ADDRESS_MIGRATION_LOCK);
  try {
    mkdirSync(lock, { mode: 0o700 });
  } catch (error) {
    return result(false, error?.code === "EEXIST" ? "migration_locked" : "migration_layout_invalid", error?.code === "EEXIST" ? `content-address migration is already active at ${lock}` : error.message);
  }
  try {
    const checkedPlan = preflight(runDir, paths.run_version);
    const execution = execute(checkedPlan.plan);
    if (!execution.ok) return result(false, execution.error?.code || "migration_recovery_required", execution.error?.message || "content-address migration failed");
    return result(true, null, null, {
      run_version: paths.run_version,
      workflow,
      renamed: execution.completed.length,
      skipped: checkedPlan.skipped,
      entries: Object.freeze(execution.completed.map((step) => Object.freeze({ from: step.from, to: step.to }))),
    });
  } catch (error) {
    return result(false, error?.code || "migration_layout_invalid", error?.message || "content-address migration failed");
  } finally {
    try { rmdirSync(lock); } catch { /* Keep an unproven coordination lock for recovery. */ }
  }
}
