/**
 * command_result.mjs — structured owner result + dual renderers for the
 * direct CLI. The owner result carries business facts; text and JSON are
 * renderers that consume it and own no facts.
 */
export const COMMAND_RESULT_SCHEMA = "pptmaker-command-result";
export const COMMAND_RESULT_VERSION = 1;

export const COMMAND_RESULT_STATES = Object.freeze([
  "success",
  "partial-effect",
  "no-op",
  "failure",
]);

/**
 * Build a frozen owner result. `effect` carries the delivery/business effect;
 * `partial` carries the second, separately-versionable effect (e.g. projection)
 * on partial-effect states; `facts` carries the machine facts the renderers
 * consume.
 */
export function commandResult({ operation, state, effect = null, partial = null, facts = {} } = {}) {
  if (!COMMAND_RESULT_STATES.includes(state)) {
    throw new Error(`invalid command result state ${JSON.stringify(state)}`);
  }
  return Object.freeze({
    schema: COMMAND_RESULT_SCHEMA,
    version: COMMAND_RESULT_VERSION,
    operation,
    state,
    effect,
    partial,
    facts,
  });
}

/**
 * Build the registered JSON success report: the structured envelope plus the
 * command's own fields spread at the top level (least-breaking for existing
 * consumers that read command facts directly).
 */
export function commandReport({ operation, state = "success", effect = null, fields = {} } = {}) {
  return Object.freeze({
    schema: COMMAND_RESULT_SCHEMA,
    version: COMMAND_RESULT_VERSION,
    operation,
    state,
    ...(effect ? { effect } : {}),
    ...fields,
  });
}

/**
 * Shared JSON renderer. It owns no business fact — it serializes the owner
 * result verbatim (after the caller registers it via registerCliJsonReport).
 */
export function renderCommandJson(result) {
  return JSON.stringify(result);
}

const DEFAULT_EXIT_CODES = Object.freeze({ 0: "success", 1: "JS-controlled failure" });
const DEFAULT_STDERR = "secret-safe JSON envelope on the last non-empty stderr line";

/**
 * Per-command machine contract: the single declared source for the --help
 * contract block and the exact-grammar equality audit.
 */
export const COMMAND_CONTRACTS = Object.freeze({
  doctor: { exitCodes: DEFAULT_EXIT_CODES, stdout: "offline readiness report", stderr: DEFAULT_STDERR },
  preflight: { exitCodes: DEFAULT_EXIT_CODES, stdout: "operation readiness report", stderr: DEFAULT_STDERR, decisionEnums: ["framed-local-refresh", "raw-generation", "full-build"] },
  probe: { exitCodes: DEFAULT_EXIT_CODES, stdout: "connectivity report", stderr: DEFAULT_STDERR, decisionEnums: ["smoke", "vendors"], note: "success is connectivity only, not readiness or authorization" },
  init: { exitCodes: DEFAULT_EXIT_CODES, stdout: "initialization summary", stderr: DEFAULT_STDERR },
  status: { exitCodes: DEFAULT_EXIT_CODES, stdout: "human text, or one --json report", stderr: DEFAULT_STDERR },
  validate: { exitCodes: DEFAULT_EXIT_CODES, stdout: "receipt-validated line", stderr: DEFAULT_STDERR },
  build: { exitCodes: DEFAULT_EXIT_CODES, stdout: "delivery-assembled line", stderr: DEFAULT_STDERR },
  refresh: { exitCodes: DEFAULT_EXIT_CODES, stdout: "refresh-result line", stderr: DEFAULT_STDERR },
  slides: { exitCodes: DEFAULT_EXIT_CODES, stdout: "preview/report, or one --json report", stderr: DEFAULT_STDERR, decisionEnums: ["list", "resolve", "normalize", "move", "delete", "insert", "apply-plan"] },
  paginate: { exitCodes: DEFAULT_EXIT_CODES, stdout: "narrative plan/apply report", stderr: DEFAULT_STDERR, decisionEnums: ["plan", "apply"] },
  "new-version": { exitCodes: DEFAULT_EXIT_CODES, stdout: "created-version line", stderr: DEFAULT_STDERR },
  "reset-unproduced-v1": { exitCodes: DEFAULT_EXIT_CODES, stdout: "reset receipt, or one --json report", stderr: DEFAULT_STDERR },
  test: { exitCodes: DEFAULT_EXIT_CODES, stdout: "core verification output", stderr: DEFAULT_STDERR },
  state: {
    exitCodes: Object.freeze({ 0: "success", 1: "JS-controlled failure", 2: "replacement/current-repair hard-stop" }),
    stdout: "state projection, or one --json report",
    stderr: DEFAULT_STDERR,
    note: "ordinary text state and state --json may rebuild the current task projection only for the eligible active replacement Controller route, after read-only inspection",
  },
  image2: { exitCodes: DEFAULT_EXIT_CODES, stdout: "lifecycle report, or one --json report", stderr: DEFAULT_STDERR, decisionEnums: ["plan", "pilot", "expansion", "authorize", "generate", "pilot-review", "pilot-accept", "review", "accept", "reconcile"] },
  artifacts: { exitCodes: DEFAULT_EXIT_CODES, stdout: "derived navigation report", stderr: DEFAULT_STDERR, note: "rebuilds only the current Human Navigation Path; provider-free, non-selector, non-authorizing" },
  "style-master": { exitCodes: DEFAULT_EXIT_CODES, stdout: "candidate lifecycle report", stderr: DEFAULT_STDERR, decisionEnums: ["inspect", "plan", "authorize", "generate", "review", "accept", "abandon", "proceed", "repair", "redirect"] },
});

/**
 * Render the --help machine contract block from a contract object. The block
 * is derived from the single declared contract, never hand-maintained prose.
 */
export function renderContractBlock(contract) {
  const lines = ["", "Machine contract:"];
  const exitCodes = Object.entries(contract.exitCodes || {}).map(([code, meaning]) => `${code}=${meaning}`).join(", ");
  lines.push(`  exit codes: ${exitCodes}`);
  if (contract.stdout) lines.push(`  stdout: ${contract.stdout}`);
  if (contract.stderr) lines.push(`  stderr: ${contract.stderr}`);
  if (contract.decisionEnums?.length) lines.push(`  decision enums: ${contract.decisionEnums.join(", ")}`);
  if (contract.note) lines.push(`  note: ${contract.note}`);
  return lines.join("\n") + "\n";
}

/**
 * Verb collisions: a shared verb across two command families with distinct
 * owners/effect classes. This is the single registered decision table (H);
 * the document-command audit consumes it to prevent drift.
 */
export const VERB_COLLISION_TABLE = Object.freeze({
  plan: Object.freeze({ owners: Object.freeze(["image2", "style-master"]) }),
  authorize: Object.freeze({ owners: Object.freeze(["image2", "style-master"]) }),
  generate: Object.freeze({ owners: Object.freeze(["image2", "style-master"]) }),
  review: Object.freeze({ owners: Object.freeze(["image2", "style-master"]) }),
  accept: Object.freeze({ owners: Object.freeze(["image2", "style-master"]) }),
});

/**
 * Equality audit for the single declaration: contract ids must equal the
 * inventory, every contract must declare its required fields, and the verb
 * collision table must match the shared decision enums actually declared.
 */
export function validateCommandContracts({ contracts = COMMAND_CONTRACTS, inventory = null, verbTable = VERB_COLLISION_TABLE } = {}) {
  const issues = [];
  const actual = Object.keys(contracts).sort();
  if (inventory) {
    const expected = [...inventory].sort();
    if (actual.join("\n") !== expected.join("\n")) {
      issues.push(`contract ids [${actual.join(", ")}] != inventory [${expected.join(", ")}]`);
    }
  }
  for (const id of actual) {
    const c = contracts[id];
    if (!c || typeof c.exitCodes !== "object" || Object.keys(c.exitCodes || {}).length === 0 || !c.stdout || !c.stderr) {
      issues.push(`${id} contract requires exitCodes, stdout, stderr`);
    }
  }
  for (const [verb, entry] of Object.entries(verbTable)) {
    for (const owner of entry.owners) {
      const enums = contracts[owner]?.decisionEnums || [];
      if (!enums.includes(verb)) {
        issues.push(`verb ${verb} is declared as a ${owner} collision but ${owner} does not declare it in decisionEnums`);
      }
    }
  }
  return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues) });
}
