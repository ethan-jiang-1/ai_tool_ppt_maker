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
  projectModeCompletion,
  projectImage2RefinementState,
  readState,
  resolveRunProductionAdapter,
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

function action(owner, actionId, kind, requiresHuman = false, displayLabel = null, { summary = null, compatibilityCommand = null, evidenceComplete = null } = {}) {
  return Object.freeze({
    owner,
    action_id: actionId,
    kind,
    requires_human: requiresHuman,
    ...(displayLabel ? { display_label: displayLabel } : {}),
    ...(summary ? { summary } : {}),
    ...(compatibilityCommand ? { compatibility_command: compatibilityCommand } : {}),
    ...(evidenceComplete !== null ? { evidence_complete: evidenceComplete } : {}),
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

function isOwnerIssuedIntent(intent) {
  if (!intent || typeof intent !== "object" || Array.isArray(intent)) return false;
  const keys = Object.keys(intent).sort();
  return keys.join("\n") === ["action_id", "owner", "schema"].join("\n") &&
    intent.schema === "pptmaker-workflow-observation-intent-v1" &&
    ["html-review", "image2-refinement"].includes(intent.owner) &&
    intent.action_id === "resume";
}

function intentApplies(intent, facts) {
  if (intent == null) return true;
  if (intent.owner === "html-review") return facts.pipeline === HTML_FIRST_PIPELINE;
  return facts.mode?.ok === true && facts.mode.mode === "html-then-image2";
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
    if (view.decision === "waived" && view.evidence_complete === false) {
      return {
        posture: "guide",
        rootCause: rootCause("html-review", `${gate}-review-waived`),
        primaryAction: action("html-review", `repair-${gate}-review`, "continue", false, `Repair waived ${gate} review evidence before the next delivery review.`, {
          compatibilityCommand: command(`pilot ${run}`),
          evidenceComplete: false,
        }),
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
  if (delivery.freshness === "current" && delivery.decision === "proceed" && delivery.evidence_complete === false) {
    const summary = "HTML delivery is accepted with incomplete lineage evidence; repair remains recommended";
    return {
      posture: "guide",
      rootCause: rootCause("html-review", "delivery-review-incomplete-lineage"),
      primaryAction: action("html-review", "repair-delivery-lineage", "continue", false, summary, {
        summary,
        compatibilityCommand: command(`build ${run}`),
        evidenceComplete: false,
      }),
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

function cursorAction(state) {
  const playbook = typeof state?.playbook === "string" ? state.playbook : "";
  const currentNode = typeof state?.current_node === "string" ? state.current_node : "";
  const node = currentNode ? state?.nodes?.[currentNode] : null;
  const waitingFor = typeof node?.waiting_for === "string" && node.waiting_for.trim()
    ? node.waiting_for.trim()
    : null;

  if (waitingFor) {
    return {
      posture: "confirm",
      rootCause: rootCause("state", "waiting-for-human", waitingFor),
      primaryAction: action("state", "wait-for-human", "continue", true, `waiting:${waitingFor}`),
    };
  }
  if (playbook && currentNode && node?.status === "in_progress") {
    return {
      posture: "guide",
      rootCause: rootCause("playbook-controller", "node-in-progress", `${playbook}/${currentNode}`),
      primaryAction: action("playbook-controller", "resume-current-node", "continue", false, `continue:${playbook}/${currentNode}`),
    };
  }
  if (playbook) {
    return {
      posture: "guide",
      rootCause: rootCause("playbook-controller", "route-current-execution", currentNode || playbook),
      primaryAction: action("playbook-controller", "select-controller-route", "continue", false, `route:${playbook}`),
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
  const invalidIntent = intent !== null && !isOwnerIssuedIntent(intent);

  const facts = (layoutIssues) => {
    const validation = validateStateReadOnly(deckDir, { runDir: resolved });
    const adapter = resolveRunProductionAdapter(deckDir, { runDir: resolved, purpose: "observe" });
    const mode = adapter.ok
      ? { ok: true, mode: adapter.mode, policy: adapter.policy, compatibility: adapter.compatibility }
      : inspectRunProductionMode(deckDir, { runDir: resolved, purpose: "observe" });
    const markerlessCompatibility = adapter.ok && adapter.compatibility != null && !existsSync(statePath(deckDir));
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
    const completion = mode.ok && mode.mode ? projectModeCompletion(state, { runVersion: basename(resolved) }) : null;
    return { layoutIssues, validation, mode, state, review, refinement, pipeline, markerlessCompatibility, completion };
  };

  const initialLayoutIssues = checkBundle(resolved, false);
  if (initialLayoutIssues.length > 0) {
    const initial = { layoutIssues: initialLayoutIssues, validation: null, mode: null, review: null, refinement: null, pipeline: null };
    const initialCheckpoint = snapshot(resolved, deckDir, initial);
    const finalLayoutIssues = checkBundle(resolved, false);
    const final = { layoutIssues: finalLayoutIssues, validation: null, mode: null, review: null, refinement: null, pipeline: null };
    const finalCheckpoint = snapshot(resolved, deckDir, final);
    if (!sameCheckpoint(initialCheckpoint, finalCheckpoint)) {
      return result({
        checkpoint: finalCheckpoint,
        posture: "guide",
        rootCause: rootCause("workflow-inspection", "checkpoint-changed", "run-bundle-layout"),
        primaryAction: action("workflow-inspection", "refresh-workflow-inspection", "continue", false, "Refresh workflow inspection after the bundle layout changed."),
        evidenceSummary: { pipeline: null, mode: null },
      });
    }
    return result({
      checkpoint: initialCheckpoint,
      posture: "hard-stop",
      rootCause: rootCause("run-bundle-layout", "layout-invalid", initialLayoutIssues[0]),
      primaryAction: action("run-bundle-layout", "repair-layout", "repair", false, "Repair the reported bundle layout issue."),
      protectedInvariant: "canonical run-bundle structure and path ownership",
      evidenceSummary: { pipeline: null, mode: null },
    });
  }

  const initial = facts(initialLayoutIssues);
  const initialCheckpoint = snapshot(resolved, deckDir, initial);
  const observations = [];
  let selected;
  if (invalidIntent) {
    selected = {
      posture: "guide",
      rootCause: rootCause("workflow-inspection", "requested-intent-invalid"),
      primaryAction: action("workflow-inspection", "inspect-current-run", "continue", false, "Inspect the current run without an intent descriptor."),
    };
  } else if (!initial.validation.valid && !initial.markerlessCompatibility) {
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
  } else if (!intentApplies(intent, initial)) {
    selected = {
      posture: "guide",
      rootCause: rootCause("workflow-inspection", "requested-intent-inapplicable", intent.owner),
      primaryAction: action("workflow-inspection", "inspect-current-run", "continue", false, "Inspect the exact current run with an applicable owner intent."),
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
    if (initial.refinement.status === "unknown-submit") {
      selected = {
        posture: "hard-stop",
        rootCause: rootCause("image2-refinement", "unknown-submit"),
        primaryAction: action("image2-refinement", "resolve-unknown-submit", "recover", true, "human:resolve-unknown-submit"),
        protectedInvariant: "an uncertain provider submission must be reconciled before another submission",
      };
    } else if (initial.refinement.status === "awaiting-authorization") {
      selected = {
        posture: "confirm",
        rootCause: rootCause("image2-refinement", "authorization-missing"),
        primaryAction: action("image2-refinement", "authorize-refinement", "review", true, "human:authorize-image2-refinement"),
      };
    } else if (initial.refinement.status === "review-pending") {
      selected = {
        posture: "confirm",
        rootCause: rootCause("image2-refinement", "candidate-review-pending"),
        primaryAction: action("image2-refinement", "review-refinement-candidate", "review", true, "human:review-image2-refinement"),
      };
    } else if (initial.refinement.status === "failed") {
      selected = {
        posture: "guide",
        rootCause: rootCause("image2-refinement", "attempt-recovery-required"),
        primaryAction: action("image2-refinement", "recover-refinement-attempt", "recover", false, "continue:image2-refinement-recovery"),
      };
    }
  }
  if (!selected && initial.refinement && initial.refinement.status !== "complete") {
    const display = !initial.refinement.present
      ? "start:image2-refine/plan"
      : initial.refinement.human_action_required
        ? "human:review-image2-refinement"
        : "continue:image2-refinement";
    selected = {
      posture: initial.refinement.human_action_required ? "confirm" : "guide",
      rootCause: rootCause("image2-refinement", initial.refinement.status),
      primaryAction: action("image2-refinement", "continue-refinement", initial.refinement.human_action_required ? "review" : "continue", initial.refinement.human_action_required, display),
    };
  }
  const cursor = cursorAction(initial.state);
  if (!selected && cursor?.primaryAction.action_id === "wait-for-human") selected = cursor;
  if (!selected && initial.completion?.ok && initial.completion.complete === false) {
    const missing = initial.completion.missing[0];
    selected = {
      posture: "guide",
      rootCause: rootCause(missing.owner, missing.action),
      primaryAction: action(missing.owner, missing.action, "continue", false, `Continue the ${missing.owner} owner workflow.`),
    };
  }
  if (!selected && initial.completion?.complete !== true) selected = cursor;
  if (!selected) {
    const display = initial.mode.ok && ["html-only", "html-then-image2"].includes(initial.mode.mode)
      ? "complete:html-delivery"
      : "complete:current-workflow";
    selected = {
      posture: "ready",
      primaryAction: action("workflow-inspection", "complete-current-workflow", "complete", false, display),
    };
  }

  if (initial.validation.valid === false && initial.mode.ok === false) observations.push({ owner: "production-mode", kind: initial.mode.code || "mode-unavailable" });
  if (initial.refinement && initial.refinement.status !== "complete" && selected.rootCause?.owner !== "image2-refinement") {
    observations.push({ owner: "image2-refinement", kind: initial.refinement.status });
  }
  const finalFacts = facts(checkBundle(resolved, false));
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
      complete: initial.completion?.complete ?? null,
    },
  });
}
