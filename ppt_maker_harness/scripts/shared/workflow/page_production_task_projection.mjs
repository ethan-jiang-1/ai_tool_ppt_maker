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

const HARNESS_PLAYBOOK_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "playbook");
const SHA256_RE = /^[0-9a-f]{64}$/;
const DIGEST_TOKEN_RE = /(?<![0-9a-f])[0-9a-f]{64}(?![0-9a-f])/gi;
const DISPLAY_REFERENCE_PREFIXES = Object.freeze({
  plan: "p",
  batch: "b",
  evidence: "e",
  review: "r",
  manifest: "m",
  delivery: "d",
});
const DISPLAY_REFERENCE_KIND_BY_OWNER_LABEL = Object.freeze({
  raw_work_plan: "plan",
  current_batch: "batch",
  pilot_evidence: "evidence",
  partial_pilot_decision: "review",
  complete_raw_review: "review",
  accepted_raw_evidence: "evidence",
  final_manifest: "manifest",
  delivery_receipt: "delivery",
});
const DISPLAY_REFERENCE_KIND_BY_HANDOFF = Object.freeze({
  partial_pilot: "review",
  complete_raw_review: "review",
  delivery: "delivery",
});

export { progressiveControllerCheckpoint } from "./progressive_controller_task_projection_eligibility.mjs";

function requiredObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} is required`);
  }
  return value;
}

function safeDigest(value) {
  return typeof value === "string" && SHA256_RE.test(value) ? value : null;
}

function safeDecision(value) {
  return ["proceed", "repair", "redirect"].includes(value) ? value : null;
}

function safeNote(value) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/[\r\n\t]+/g, " ").trim().slice(0, 500);
  return normalized || null;
}

function displayReferenceKey(kind, sha256) {
  return `${kind}\u0000${sha256}`;
}

function requireDisplayReferenceKind(kind) {
  if (typeof kind !== "string" || !Object.hasOwn(DISPLAY_REFERENCE_PREFIXES, kind)) {
    throw new TypeError("PAGE_PRODUCTION_DISPLAY_REFERENCE_KIND_INVALID");
  }
  return kind;
}

function requireDisplayReferenceDigest(sha256) {
  if (typeof sha256 !== "string" || !SHA256_RE.test(sha256)) {
    throw new TypeError("PAGE_PRODUCTION_DISPLAY_REFERENCE_DIGEST_INVALID");
  }
  return sha256;
}

function redactDigestTokens(value) {
  return value.replace(DIGEST_TOKEN_RE, "[digest redacted]");
}

/** Create a card-scoped formatter; it intentionally cannot resolve a short value. */
export function createPageProductionDisplayReferenceIndex(entries) {
  if (!Array.isArray(entries)) throw new TypeError("PAGE_PRODUCTION_DISPLAY_REFERENCE_ENTRIES_INVALID");
  const unique = new Map();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new TypeError("PAGE_PRODUCTION_DISPLAY_REFERENCE_ENTRY_INVALID");
    }
    const kind = requireDisplayReferenceKind(entry.kind);
    const sha256 = requireDisplayReferenceDigest(entry.sha256);
    unique.set(displayReferenceKey(kind, sha256), Object.freeze({ kind, sha256 }));
  }

  const collisionGroups = new Map();
  for (const entry of [...unique.values()].sort((left, right) => {
    if (left.kind !== right.kind) return left.kind < right.kind ? -1 : 1;
    if (left.sha256 === right.sha256) return 0;
    return left.sha256 < right.sha256 ? -1 : 1;
  })) {
    const collisionKey = displayReferenceKey(entry.kind, entry.sha256.slice(0, 8));
    const group = collisionGroups.get(collisionKey) || [];
    group.push(entry);
    collisionGroups.set(collisionKey, group);
  }

  const displayByKey = new Map();
  for (const group of collisionGroups.values()) {
    for (const [index, entry] of group.entries()) {
      const suffix = group.length > 1 ? `~${index + 1}` : "";
      displayByKey.set(
        displayReferenceKey(entry.kind, entry.sha256),
        `${DISPLAY_REFERENCE_PREFIXES[entry.kind]}-${entry.sha256.slice(0, 8)}${suffix}`,
      );
    }
  }

  return Object.freeze({
    describe(kind, sha256) {
      const checkedKind = requireDisplayReferenceKind(kind);
      const checkedDigest = requireDisplayReferenceDigest(sha256);
      const display = displayByKey.get(displayReferenceKey(checkedKind, checkedDigest));
      if (!display) throw new Error("PAGE_PRODUCTION_DISPLAY_REFERENCE_UNKNOWN");
      return display;
    },
  });
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

function ownerDisplayReferenceKind(label) {
  const kind = DISPLAY_REFERENCE_KIND_BY_OWNER_LABEL[label];
  if (!kind) throw new Error("PAGE_PRODUCTION_DISPLAY_REFERENCE_OWNER_LABEL_UNKNOWN");
  return kind;
}

function handoffDisplayReferenceKind(name) {
  const kind = DISPLAY_REFERENCE_KIND_BY_HANDOFF[name];
  if (!kind) throw new Error("PAGE_PRODUCTION_DISPLAY_REFERENCE_HANDOFF_UNKNOWN");
  return kind;
}

function taskProjectionDisplayReferenceEntries(payload) {
  if (!Array.isArray(payload.references)) throw new TypeError("PAGE_PRODUCTION_TASK_PROJECTION_REFERENCES_INVALID");
  const entries = payload.references.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new TypeError("PAGE_PRODUCTION_TASK_PROJECTION_REFERENCE_INVALID");
    }
    return Object.freeze({ kind: ownerDisplayReferenceKind(entry.label), sha256: entry.sha256 });
  });
  const handoffs = requiredObject(payload.human_handoffs, "task projection human handoffs");
  for (const [name, handoff] of Object.entries(handoffs)) {
    if (!handoff || typeof handoff !== "object" || Array.isArray(handoff) || handoff.reference_sha256 == null) continue;
    entries.push(Object.freeze({ kind: handoffDisplayReferenceKind(name), sha256: handoff.reference_sha256 }));
  }
  return entries;
}

function renderReferences(references, displayReferenceIndex) {
  return references.length
    ? references.map((entry) => `- ${entry.label}: \`${displayReferenceIndex.describe(ownerDisplayReferenceKind(entry.label), entry.sha256)}\``).join("\n")
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

function renderHandoff(name, value, displayReferenceIndex) {
  if (!value) return `- ${name}: none`;
  const fields = [
    `${name}: ${value.decision || "recorded"}`,
    ...(value.reference_sha256 ? [`reference=\`${displayReferenceIndex.describe(handoffDisplayReferenceKind(name), value.reference_sha256)}\``] : []),
    ...(value.note ? [`note=${redactDigestTokens(value.note)}`] : []),
  ];
  return `- ${fields.join("; ")}`;
}

export function renderPageProductionTaskProjection(payload) {
  const checked = requiredObject(payload, "task projection payload");
  const displayReferenceIndex = createPageProductionDisplayReferenceIndex(taskProjectionDisplayReferenceEntries(checked));
  return redactDigestTokens([
    "# Page Production Task Projection",
    "",
    `<!-- ${PAGE_PRODUCTION_TASK_PROJECTION_SCHEMA} -->`,
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
    renderReferences(checked.references, displayReferenceIndex),
    "",
    "## Bounded Progress",
    "",
    renderProgress(checked.progress),
    "",
    "## Human Handoffs",
    "",
    renderHandoff("partial_pilot", checked.human_handoffs.partial_pilot, displayReferenceIndex),
    renderHandoff("complete_raw_review", checked.human_handoffs.complete_raw_review, displayReferenceIndex),
    renderHandoff("delivery", checked.human_handoffs.delivery, displayReferenceIndex),
    "",
  ].join("\n"));
}

export function pageProductionTaskProjectionPath(runDir) {
  const paths = pageAuthorityProgressiveRawPaths(runDir);
  return join(paths.deck_root, STATE_DIR, PAGE_PRODUCTION_TASK_PROJECTION_FILE);
}

/**
 * Rebuild the card from an already refreshed workflow inspection. This writer
 * never invokes a provider or reads the previous card as lifecycle input.
 */
export function refreshPageProductionTaskProjection({ runDir, inspection, state = null, playbookDir = HARNESS_PLAYBOOK_DIR } = {}) {
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
