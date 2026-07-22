import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import {
  HTML_FIRST_PIPELINE,
  LEGACY_PIPELINE,
} from "../run-bundle/production_marker.mjs";
import {
  checkBundle,
  deckRoot,
  findSlideSpecs,
} from "../run-bundle/bundle_layout.mjs";
import {
  inspectRunProductionMode,
  projectImage2RefinementState,
  readState,
  statePath,
  validateStateReadOnly,
} from "../state/state.mjs";
import { inspectHtmlReviewReadiness } from "../state/html_review_evidence.mjs";

export const WORKFLOW_INSPECTION_SCHEMA = "pptmaker-workflow-inspection-v1";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function action(owner, actionId, kind, requiresHuman = false, displayLabel = null) {
  return Object.freeze({
    owner,
    action_id: actionId,
    kind,
    requires_human: requiresHuman,
    ...(displayLabel ? { display_label: displayLabel } : {}),
  });
}

function result({ checkpoint, posture, rootCause = null, primaryAction, observations = [], continuation = null, protectedInvariant = null, evidenceSummary = {} }) {
  return Object.freeze({
    schema: WORKFLOW_INSPECTION_SCHEMA,
    checkpoint: Object.freeze(checkpoint),
    posture,
    root_cause: rootCause ? Object.freeze(rootCause) : null,
    primary_action: primaryAction,
    observations: Object.freeze(observations.map((entry) => Object.freeze(entry))),
    continuation: continuation ? Object.freeze(continuation) : null,
    protected_invariant: protectedInvariant,
    evidence_summary: Object.freeze(evidenceSummary),
  });
}

function rootCause(owner, kind, detail = null) {
  return Object.freeze({ owner, kind, ...(detail == null ? {} : { detail }) });
}

function readIdentity(path) {
  if (!path || !existsSync(path)) return "missing";
  try { return sha256(readFileSync(path)); } catch { return "unreadable"; }
}

function sourcePath(runDir) {
  return join(runDir, "slide-specifications.md");
}

function snapshot(runDir, deckDir, facts) {
  const source = sourcePath(runDir);
  const state = statePath(deckDir);
  return Object.freeze({
    run_dir: resolve(runDir),
    run_version: basename(resolve(runDir)),
    source_sha256: readIdentity(source),
    state_sha256: readIdentity(state),
    layout_sha256: sha256(canonicalJson(facts.layoutIssues)),
    validation_sha256: sha256(canonicalJson(facts.validation)),
    mode_sha256: sha256(canonicalJson(facts.mode)),
    review_sha256: sha256(canonicalJson(facts.review)),
    refinement_sha256: sha256(canonicalJson(facts.refinement)),
  });
}

function sameCheckpoint(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function htmlAction(runDir, review) {
  const run = JSON.stringify(resolve(runDir));
  const command = (suffix) => `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs ${suffix}`;
  if (review.journal?.status && review.journal.status !== "absent") {
    return {
      posture: "hard-stop",
      rootCause: rootCause("html-review", "gate-journal", review.journal.status),
      primaryAction: action("html-review", "recover-gate-journal", "recover", true, command(`state ${run} --recover-gate-journal <owner-token>`)),
      protectedInvariant: "single-writer gate publication and current version identity",
    };
  }
  if (review.reset?.status === "deletion-pending") {
    return {
      posture: "hard-stop",
      rootCause: rootCause("html-review", "html-production-reset"),
      primaryAction: action("html-review", "inspect-reset", "recover", false, command(`state ${run} --json`)),
      protectedInvariant: "canonical production-owner reset integrity",
    };
  }
  for (const gate of ["content", "visual"]) {
    const view = review[gate] || {};
    if (view.freshness === "invalid") {
      return {
        posture: "hard-stop",
        rootCause: rootCause("html-review", `${gate}-review-invalid`),
        primaryAction: action("state", "validate-state", "repair", false, command(`state ${run} --validate-state`)),
        protectedInvariant: "version-scoped review record and artifact integrity",
      };
    }
    if (view.freshness !== "current") {
      const plan = review.gates?.[gate]?.plan;
      const normal = plan?.approvable === true && /^[0-9a-f]{64}$/.test(plan.plan_hash || "")
        ? command(`approve ${run} ${gate} --plan-hash ${plan.plan_hash}`)
        : command(`pilot ${run}`);
      return {
        posture: "confirm",
        rootCause: rootCause("html-review", `${gate}-review-${view.freshness || "missing"}`),
        primaryAction: action("html-review", `review-${gate}`, "review", true, normal),
        continuation: action("html-review", `waive-${gate}-review`, "review", true, command(`approve ${run} ${gate} --waive --reason "<human reason>"`)),
      };
    }
  }
  const delivery = review.delivery || {};
  if (delivery.freshness === "invalid") {
    return {
      posture: "hard-stop",
      rootCause: rootCause("html-review", "delivery-review-invalid"),
      primaryAction: action("state", "validate-state", "repair", false, command(`state ${run} --validate-state`)),
      protectedInvariant: "reviewable delivery artifact and state-record integrity",
    };
  }
  if (delivery.freshness !== "current" || delivery.decision !== "proceed") {
    const reviewable = review._delivery_evidence?.reviewable === true;
    return {
      posture: reviewable ? "confirm" : "guide",
      rootCause: rootCause("html-review", "delivery-review-pending"),
      primaryAction: action("html-review", reviewable ? "review-delivery" : "build-delivery", reviewable ? "review" : "continue", reviewable, reviewable ? command(`state ${run} --record-delivery-review proceed`) : command(`build ${run}`)),
      ...(reviewable ? { continuation: action("html-review", "waive-delivery-review", "review", true, command(`state ${run} --record-delivery-review proceed --force --reason "<human reason>"`)) } : {}),
    };
  }
  return null;
}

/**
 * Compose direct-owner observations. It intentionally has no writer, cache,
 * provider, or controller-routing dependency.
 */
export function inspectWorkflow({ runDir, requestedIntent = null } = {}) {
  const resolved = resolve(runDir || "");
  const deckDir = deckRoot(resolved);
  const intent = requestedIntent == null ? null : requestedIntent;
  const invalidIntent = intent !== null && (!intent || typeof intent !== "object" || Array.isArray(intent));

  const facts = () => {
    const layoutIssues = checkBundle(resolved, false);
    const validation = validateStateReadOnly(deckDir, { runDir: resolved });
    const mode = inspectRunProductionMode(deckDir, { runDir: resolved, purpose: "observe" });
    const state = readState(deckDir, { purpose: "observe", heal: false, runDir: resolved });
    const source = findSlideSpecs(resolved);
    const pipeline = source && existsSync(sourcePath(resolved))
      ? (mode.ok ? mode.policy.pipeline : null)
      : null;
    let review = null;
    let refinement = null;
    if (pipeline === HTML_FIRST_PIPELINE) {
      try { review = inspectHtmlReviewReadiness(resolved); } catch (error) { review = { error: error.message || String(error) }; }
    }
    if (mode.ok && mode.mode === "html-then-image2") {
      try { refinement = projectImage2RefinementState(state, basename(resolved)); } catch (error) { refinement = { status: "invalid", reason: error.message || String(error) }; }
    }
    return { layoutIssues, validation, mode, state, review, refinement, pipeline };
  };

  const initial = facts();
  const initialCheckpoint = snapshot(resolved, deckDir, initial);
  const observations = [];
  let selected;
  if (initial.layoutIssues.length > 0) {
    selected = {
      posture: "hard-stop",
      rootCause: rootCause("run-bundle-layout", "layout-invalid", initial.layoutIssues[0]),
      primaryAction: action("run-bundle-layout", "repair-layout", "repair", false, "Repair the reported bundle layout issue."),
      protectedInvariant: "canonical run-bundle structure and path ownership",
    };
  } else if (invalidIntent) {
    selected = {
      posture: "guide",
      rootCause: rootCause("workflow-inspection", "requested-intent-invalid"),
      primaryAction: action("workflow-inspection", "inspect-current-run", "continue", false, "Inspect the current run without an intent descriptor."),
    };
  } else if (!initial.validation.valid) {
    selected = {
      posture: "hard-stop",
      rootCause: rootCause("state", "state-validation", initial.validation.issues[0]?.path || "state.yaml"),
      primaryAction: action("state", "validate-state", "repair", false, "Validate and repair the authoritative state through its owner."),
      protectedInvariant: "authoritative state integrity and execution identity",
    };
  } else if (!initial.mode.ok) {
    selected = {
      posture: "hard-stop",
      rootCause: rootCause("production-mode", initial.mode.code || "mode-unavailable"),
      primaryAction: action("production-mode", "repair-production-mode", "repair", false, "Repair or register the exact run production mode."),
      protectedInvariant: "exact version-scoped mode and source pipeline authority",
    };
  } else if (initial.review?.error) {
    selected = {
      posture: "hard-stop",
      rootCause: rootCause("html-review", "review-inspection-failed"),
      primaryAction: action("state", "validate-state", "repair", false, "Validate the authoritative HTML review state."),
      protectedInvariant: "authoritative HTML review state integrity",
    };
  } else if (initial.review) {
    selected = htmlAction(resolved, initial.review);
  }

  if (!selected && initial.refinement?.status === "invalid") {
    selected = {
      posture: "hard-stop",
      rootCause: rootCause("image2-refinement", "refinement-state-invalid"),
      primaryAction: action("image2-refinement", "repair-refinement-state", "repair", false, "Repair the authoritative refinement state."),
      protectedInvariant: "version-scoped refinement state integrity",
    };
  }
  if (!selected && initial.refinement && initial.refinement.status !== "complete") {
    selected = {
      posture: initial.refinement.human_action_required ? "confirm" : "guide",
      rootCause: rootCause("image2-refinement", initial.refinement.status),
      primaryAction: action("image2-refinement", "continue-refinement", initial.refinement.human_action_required ? "review" : "continue", initial.refinement.human_action_required, "Continue the owning visual-slot refinement workflow."),
    };
  }
  if (!selected) {
    selected = {
      posture: "ready",
      primaryAction: action("workflow-inspection", "complete-current-workflow", "complete", false, "Current workflow checkpoint is complete."),
    };
  }

  if (initial.validation.valid === false && initial.mode.ok === false) observations.push({ owner: "production-mode", kind: initial.mode.code || "mode-unavailable" });
  const finalFacts = facts();
  const finalCheckpoint = snapshot(resolved, deckDir, finalFacts);
  if (!sameCheckpoint(initialCheckpoint, finalCheckpoint)) {
    const changed = Object.keys(initialCheckpoint).find((key) => initialCheckpoint[key] !== finalCheckpoint[key]) || "direct-fact";
    return result({
      checkpoint: finalCheckpoint,
      posture: "guide",
      rootCause: rootCause("workflow-inspection", "checkpoint-changed", changed),
      primaryAction: action("workflow-inspection", "refresh-workflow-inspection", "continue", false, "Rerun workflow inspection after the direct fact changed."),
      observations,
      evidenceSummary: { pipeline: finalFacts.pipeline, mode: finalFacts.mode.ok ? finalFacts.mode.mode : null },
    });
  }
  return result({
    checkpoint: initialCheckpoint,
    posture: selected.posture,
    rootCause: selected.rootCause,
    primaryAction: selected.primaryAction,
    observations,
    continuation: selected.continuation || null,
    protectedInvariant: selected.protectedInvariant || null,
    evidenceSummary: {
      pipeline: initial.pipeline || LEGACY_PIPELINE,
      mode: initial.mode.ok ? initial.mode.mode : null,
      html_review_ready: initial.review?.ready ?? null,
      refinement_status: initial.refinement?.status ?? null,
    },
  });
}
