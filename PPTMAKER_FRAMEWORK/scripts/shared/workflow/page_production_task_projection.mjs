/**
 * Rebuildable collaboration projection for the progressive Page Authority
 * lifecycle. It intentionally consumes only workflow inspection and narrow
 * state handoffs; it is never a source of lifecycle truth.
 */
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalJsonSha256 } from "../identity/canonical_json.mjs";
import { pageAuthorityProgressiveRawPaths } from "../run-bundle/page_authority_paths.mjs";
import {
  STATE_DIR,
  readTargetProgressiveControllerDecision,
  readTargetProgressiveHandoff,
} from "../state/state.mjs";
import {
  progressiveControllerCheckpoint,
  progressiveControllerTaskProjectionEligibility,
} from "./progressive_controller_task_projection_eligibility.mjs";

export const PAGE_PRODUCTION_TASK_PROJECTION_SCHEMA = "page-production-task-projection-v1";
export const PAGE_PRODUCTION_TASK_PROJECTION_FILE = "page-production-task-projection.md";

const FRAMEWORK_PLAYBOOK_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "playbook");

export { progressiveControllerCheckpoint } from "./progressive_controller_task_projection_eligibility.mjs";

function requiredObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} is required`);
  }
  return value;
}

function safeDigest(value) {
  return /^[0-9a-f]{64}$/.test(value || "") ? value : null;
}

function safeDecision(value) {
  return ["proceed", "repair", "redirect"].includes(value) ? value : null;
}

function safeNote(value) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/[\r\n\t]+/g, " ").trim().slice(0, 500);
  return normalized || null;
}

function boundedProgress(progress) {
  if (!progress || typeof progress !== "object" || Array.isArray(progress)) return null;
  const counts = {};
  for (const key of ["total", "materialized", "unsubmitted", "claimed", "submitted", "known_failure", "unknown"]) {
    if (Number.isInteger(progress[key]) && progress[key] >= 0) counts[key] = progress[key];
  }
  if (!Number.isInteger(counts.total)) return null;
  const paidDebt = Array.isArray(progress.paid_debt)
    ? progress.paid_debt.filter((id) => /^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(id || "")).slice(0, counts.total)
    : [];
  return Object.freeze({ ...counts, paid_debt_slide_ids: Object.freeze(paidDebt) });
}

function reference(label, value) {
  const sha256 = safeDigest(value);
  return sha256 ? Object.freeze({ label, sha256 }) : null;
}

function ownerReferences(inspection, handoff) {
  const summary = inspection.evidence_summary || {};
  const evidence = summary.evidence || {};
  const latestBatch = summary.latest_batch || {};
  const rawHandoffs = summary.controller_handoffs || {};
  return Object.freeze([
    reference("raw_work_plan", handoff?.raw_work_plan_sha256 || summary.plan_hash),
    reference("current_batch", latestBatch.batch_hash),
    reference("pilot_evidence", evidence.pilot_evidence_sha256),
    reference("partial_pilot_decision", handoff?.partial_pilot_decision_sha256 || rawHandoffs.partial_pilot?.pilot_decision_sha256),
    reference("complete_raw_review", handoff?.complete_raw_review_sha256 || evidence.complete_raw_review_sha256 || rawHandoffs.complete_raw_review?.complete_raw_review_sha256),
    reference("accepted_raw_evidence", handoff?.accepted_raw_evidence_sha256 || evidence.accepted_raw_evidence_sha256),
    reference("final_manifest", handoff?.final_manifest_sha256),
    reference("delivery_receipt", handoff?.delivery_receipt_sha256),
  ].filter(Boolean));
}

function typedDecision({ handoff, controllerDecision, directDecision = null }) {
  const decision = safeDecision(directDecision) || safeDecision(controllerDecision?.value);
  if (!handoff && !decision) return null;
  return Object.freeze({
    decision,
    ...(handoff ? { reference_sha256: handoff } : {}),
    ...(safeNote(controllerDecision?.note) ? { note: safeNote(controllerDecision.note) } : {}),
  });
}

function humanHandoffs(runDir, workflow, inspection, handoff) {
  const direct = inspection.evidence_summary?.controller_handoffs || {};
  const partialNode = `review-target-${workflow}-pilot`;
  const completeNode = `review-target-${workflow}-raw`;
  const partialDecision = readTargetProgressiveControllerDecision(pageAuthorityProgressiveRawPaths(runDir).deck_root, {
    runDir,
    nodeId: partialNode,
  });
  const completeDecision = readTargetProgressiveControllerDecision(pageAuthorityProgressiveRawPaths(runDir).deck_root, {
    runDir,
    nodeId: completeNode,
  });
  const deliveryDecision = readTargetProgressiveControllerDecision(pageAuthorityProgressiveRawPaths(runDir).deck_root, {
    runDir,
    nodeId: "review-target-page-authority-delivery",
  });
  return Object.freeze({
    partial_pilot: typedDecision({
      handoff: safeDigest(handoff?.partial_pilot_decision_sha256),
      controllerDecision: partialDecision,
      directDecision: direct.partial_pilot?.decision,
    }),
    complete_raw_review: typedDecision({
      handoff: safeDigest(handoff?.complete_raw_review_sha256),
      controllerDecision: completeDecision,
      directDecision: direct.complete_raw_review?.decision,
    }),
    delivery: typedDecision({
      handoff: safeDigest(handoff?.delivery_receipt_sha256),
      controllerDecision: deliveryDecision,
    }),
  });
}

function projectionPayload({ runDir, inspection, state, playbookDir }) {
  const paths = pageAuthorityProgressiveRawPaths(runDir);
  const summary = requiredObject(inspection.evidence_summary, "workflow inspection evidence summary");
  const eligibility = progressiveControllerTaskProjectionEligibility({ runDir, inspection, state, playbookDir });
  if (!eligibility.eligible) throw new Error(eligibility.reason);
  const { checkpoint, controller } = eligibility;
  const handoff = readTargetProgressiveHandoff(paths.deck_root, { runDir });
  return Object.freeze({
    schema: PAGE_PRODUCTION_TASK_PROJECTION_SCHEMA,
    run_version: paths.run_version,
    workflow: checkpoint.workflow,
    controller: Object.freeze({ current_node: controller.current_node, checkpoint_node: checkpoint.controller_node }),
    next_action: checkpoint,
    references: ownerReferences(inspection, handoff),
    progress: boundedProgress(summary.progress),
    human_handoffs: humanHandoffs(runDir, checkpoint.workflow, inspection, handoff),
  });
}

function renderReferences(references) {
  return references.length
    ? references.map((entry) => `- ${entry.label}: \`${entry.sha256}\``).join("\n")
    : "- none";
}

function renderProgress(progress) {
  if (!progress) return "- unavailable";
  const counts = ["total", "materialized", "unsubmitted", "claimed", "submitted", "known_failure", "unknown"]
    .filter((key) => Number.isInteger(progress[key]))
    .map((key) => `${key}=${progress[key]}`)
    .join(", ");
  const debt = progress.paid_debt_slide_ids.length ? `\n- paid_debt_slide_ids: ${progress.paid_debt_slide_ids.map((id) => `\`${id}\``).join(", ")}` : "";
  return `- ${counts || "unavailable"}${debt}`;
}

function renderHandoff(name, value) {
  if (!value) return `- ${name}: none`;
  const fields = [
    `${name}: ${value.decision || "recorded"}`,
    ...(value.reference_sha256 ? [`reference=\`${value.reference_sha256}\``] : []),
    ...(value.note ? [`note=${value.note}`] : []),
  ];
  return `- ${fields.join("; ")}`;
}

export function renderPageProductionTaskProjection(payload) {
  const checked = requiredObject(payload, "task projection payload");
  const digest = canonicalJsonSha256(checked);
  return [
    "# Page Production Task Projection",
    "",
    `<!-- ${PAGE_PRODUCTION_TASK_PROJECTION_SCHEMA} sha256:${digest} -->`,
    "",
    `- run_version: \`${checked.run_version}\``,
    `- workflow: \`${checked.workflow}\``,
    `- controller_node: \`${checked.controller.checkpoint_node || checked.controller.current_node}\``,
    "",
    "## Next Action",
    "",
    `- owner: \`${checked.next_action.owner}\``,
    `- action: \`${checked.next_action.action_id}\``,
    `- kind: \`${checked.next_action.kind}\``,
    `- requires_human: \`${checked.next_action.requires_human}\``,
    "",
    "## Owner References",
    "",
    renderReferences(checked.references),
    "",
    "## Bounded Progress",
    "",
    renderProgress(checked.progress),
    "",
    "## Human Handoffs",
    "",
    renderHandoff("partial_pilot", checked.human_handoffs.partial_pilot),
    renderHandoff("complete_raw_review", checked.human_handoffs.complete_raw_review),
    renderHandoff("delivery", checked.human_handoffs.delivery),
    "",
  ].join("\n");
}

export function pageProductionTaskProjectionPath(runDir) {
  const paths = pageAuthorityProgressiveRawPaths(runDir);
  return join(paths.deck_root, STATE_DIR, PAGE_PRODUCTION_TASK_PROJECTION_FILE);
}

/**
 * Rebuild the card from an already refreshed workflow inspection. This writer
 * never invokes a provider or reads the previous card as lifecycle input.
 */
export function refreshPageProductionTaskProjection({ runDir, inspection, state = null, playbookDir = FRAMEWORK_PLAYBOOK_DIR } = {}) {
  const resolvedRunDir = resolve(runDir || "");
  const eligibility = progressiveControllerTaskProjectionEligibility({ runDir: resolvedRunDir, inspection, state, playbookDir });
  if (!eligibility.eligible) throw new Error(eligibility.reason);
  const payload = projectionPayload({ runDir: resolvedRunDir, inspection, state: eligibility.state, playbookDir });
  const text = renderPageProductionTaskProjection(payload);
  const path = pageProductionTaskProjectionPath(resolvedRunDir);
  const current = existsSync(path) ? readFileSync(path, "utf8") : null;
  if (current === text) {
    return Object.freeze({ path, status: "current", projection_sha256: canonicalJsonSha256(payload), projection: payload });
  }
  mkdirSync(dirname(path), { recursive: true });
  const temp = join(dirname(path), `.${basename(path)}.tmp-${process.pid}-${randomBytes(4).toString("hex")}`);
  try {
    writeFileSync(temp, text, "utf8");
    renameSync(temp, path);
  } catch (error) {
    rmSync(temp, { force: true });
    throw error;
  }
  return Object.freeze({ path, status: current === null ? "created" : "updated", projection_sha256: canonicalJsonSha256(payload), projection: payload });
}
