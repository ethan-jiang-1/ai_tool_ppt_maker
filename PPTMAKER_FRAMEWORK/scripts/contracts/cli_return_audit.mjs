/** Closed producer-side return audit.  This is data, not a second CLI parser. */
export const CLI_RETURN_AUDIT_SCHEMA = "pptmaker-cli-return-audit-v1";
export const CLI_RETURN_CATEGORIES = Object.freeze(["help", "usage", "validation", "gate", "conflict", "stale", "commit", "internal"]);
export const IMAGE2_RETURN_CASES = Object.freeze([
  "whole_page",
  "current_delivery",
  "plan_authorization_drift",
  "duplicate_attempt",
  "unknown_submit",
  "candidate_identity",
  "promotion_recovery",
  "cleanup_ambiguity",
]);
export const PRODUCTION_MODE_TRANSITION_RETURN_CASES = Object.freeze([
  "prepare_offline",
  "preview_authoring_guide",
  "preview_exact_plan",
  "confirm_atomic",
  "apply_handoff",
  "recovery_visible_target",
  "recovery_same_host",
  "recovery_uncertain_confirmation",
  "stale_or_conflict",
]);

/**
 * Continuation paths are intentionally named here instead of inferred from
 * Commander wiring. This keeps every user-visible guide/waiver/conflict path
 * in the producer audit as the commands grow.
 */
export const CONTINUATION_RETURN_CASES = Object.freeze({
  approve: Object.freeze([
    "normal_approval",
    "guide_current_review_required",
    "waiver_incomplete_evidence",
    "conflict_plan_identity",
    "secret_safe_diagnostic",
  ]),
  build: Object.freeze([
    "normal_current_evidence",
    "guide_repair_recommended",
    "waiver_force",
    "conflict_journal_or_reset",
    "secret_safe_diagnostic",
  ]),
  state_validate: Object.freeze([
    "normal_read_only_validation",
    "guide_safe_repair",
    "conflict_invalid_authority",
    "secret_safe_diagnostic",
  ]),
  delivery_review: Object.freeze([
    "normal_proceed",
    "guide_rebuild_lineage",
    "waiver_forced_proceed",
    "conflict_review_identity",
    "secret_safe_diagnostic",
  ]),
  image2_plan: Object.freeze([
    "normal_offline_plan",
    "guide_delivery_repair",
    "waiver_force_prerequisite",
    "conflict_delivery_identity",
    "secret_safe_diagnostic",
  ]),
  image2_generate: Object.freeze([
    "normal_authorized_submit",
    "guide_credentials_required",
    "conflict_request_or_attempt_identity",
    "secret_safe_diagnostic",
  ]),
  image2_unknown_submit: Object.freeze([
    "normal_retain_or_abandon",
    "guide_reconciliation_required",
    "conflict_persisted_attempt_identity",
    "secret_safe_diagnostic",
  ]),
});

const all = Object.freeze({
  help: "case:help",
  usage: "case:usage",
  validation: "case:validation",
  gate: "case:gate",
  conflict: "case:conflict",
  stale: "case:stale",
  commit: "case:commit",
  internal: "case:internal",
});

export const PPT_FLOW_RETURN_AUDIT = Object.freeze({
  schema: CLI_RETURN_AUDIT_SCHEMA,
  commands: Object.freeze({
    doctor: all,
    init: all,
    status: all,
    approve: all,
    "style-master": all,
    validate: all,
    pilot: all,
    build: all,
    refresh: all,
    slides: all,
    "new-version": all,
    test: all,
    state: Object.freeze({
      ...all,
      ...Object.fromEntries(PRODUCTION_MODE_TRANSITION_RETURN_CASES.map((name) => ["production_mode_transition_" + name, "case:" + name])),
    }),
    image2: Object.freeze({
      ...all,
      whole_page: "case:ownership",
      current_delivery: "case:current-html-delivery",
      plan_authorization_drift: "case:exact-plan",
      duplicate_attempt: "case:duplicate",
      unknown_submit: "case:human-only",
      candidate_identity: "case:candidate-binding",
      promotion_recovery: "case:promotion-recovery",
      cleanup_ambiguity: "case:cleanup-fail-closed",
    }),
    continuations: CONTINUATION_RETURN_CASES,
  }),
});

export function validateCliReturnAudit(audit = PPT_FLOW_RETURN_AUDIT, expectedCommands = Object.keys(PPT_FLOW_RETURN_AUDIT.commands).filter((command) => command !== "continuations")) {
  if (!audit || audit.schema !== CLI_RETURN_AUDIT_SCHEMA || !audit.commands || typeof audit.commands !== "object") return { valid: false, errors: ["invalid CLI return audit schema"] };
  const errors = [];
  const actual = Object.keys(audit.commands).filter((command) => command !== "continuations").sort();
  const expected = [...expectedCommands].sort();
  if (actual.join("\n") !== expected.join("\n")) errors.push(`command set mismatch: ${actual.join(", ")} != ${expected.join(", ")}`);
  for (const command of expected) {
    const record = audit.commands[command];
    if (!record || typeof record !== "object") { errors.push(`${command} has no return cases`); continue; }
    for (const category of CLI_RETURN_CATEGORIES) if (typeof record[category] !== "string" || !record[category]) errors.push(`${command} is missing ${category} return case`);
    if (command === "image2") {
      for (const operation of IMAGE2_RETURN_CASES) if (typeof record[operation] !== "string" || !record[operation]) errors.push(`image2 is missing ${operation} return case`);
    }
    if (command === "state") {
      for (const operation of PRODUCTION_MODE_TRANSITION_RETURN_CASES) {
        const key = `production_mode_transition_${operation}`;
        if (typeof record[key] !== "string" || !record[key]) errors.push(`state is missing ${key} return case`);
      }
    }
  }
  const continuationAudit = audit.commands.continuations;
  if (!continuationAudit || typeof continuationAudit !== "object") {
    errors.push("continuation return cases are missing");
  } else {
    for (const [operation, requiredCases] of Object.entries(CONTINUATION_RETURN_CASES)) {
      const actualCases = continuationAudit[operation];
      if (!Array.isArray(actualCases)) {
        errors.push(`${operation} has no continuation return cases`);
        continue;
      }
      for (const requiredCase of requiredCases) {
        if (!actualCases.includes(requiredCase)) errors.push(`${operation} is missing ${requiredCase} continuation return case`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}
