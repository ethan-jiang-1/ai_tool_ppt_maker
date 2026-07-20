/** Closed producer-side return audit.  This is data, not a second CLI parser. */
export const CLI_RETURN_AUDIT_SCHEMA = "pptmaker-cli-return-audit-v1";
export const CLI_RETURN_CATEGORIES = Object.freeze(["help", "usage", "validation", "gate", "conflict", "stale", "commit", "internal"]);
export const IMAGE2_RETURN_CASES = Object.freeze([
  "markerless",
  "current_delivery",
  "plan_authorization_drift",
  "duplicate_attempt",
  "unknown_submit",
  "candidate_identity",
  "promotion_recovery",
  "cleanup_ambiguity",
]);

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
    state: all,
    "migrate-html": all,
    image2: Object.freeze({
      ...all,
      markerless: "case:ownership",
      current_delivery: "case:current-html-delivery",
      plan_authorization_drift: "case:exact-plan",
      duplicate_attempt: "case:duplicate",
      unknown_submit: "case:human-only",
      candidate_identity: "case:candidate-binding",
      promotion_recovery: "case:promotion-recovery",
      cleanup_ambiguity: "case:cleanup-fail-closed",
    }),
  }),
});

export function validateCliReturnAudit(audit = PPT_FLOW_RETURN_AUDIT, expectedCommands = Object.keys(PPT_FLOW_RETURN_AUDIT.commands)) {
  if (!audit || audit.schema !== CLI_RETURN_AUDIT_SCHEMA || !audit.commands || typeof audit.commands !== "object") return { valid: false, errors: ["invalid CLI return audit schema"] };
  const errors = [];
  const actual = Object.keys(audit.commands).sort();
  const expected = [...expectedCommands].sort();
  if (actual.join("\n") !== expected.join("\n")) errors.push(`command set mismatch: ${actual.join(", ")} != ${expected.join(", ")}`);
  for (const command of expected) {
    const record = audit.commands[command];
    if (!record || typeof record !== "object") { errors.push(`${command} has no return cases`); continue; }
    for (const category of CLI_RETURN_CATEGORIES) if (typeof record[category] !== "string" || !record[category]) errors.push(`${command} is missing ${category} return case`);
    if (command === "image2") {
      for (const operation of IMAGE2_RETURN_CASES) if (typeof record[operation] !== "string" || !record[operation]) errors.push(`image2 is missing ${operation} return case`);
    }
  }
  return { valid: errors.length === 0, errors };
}
