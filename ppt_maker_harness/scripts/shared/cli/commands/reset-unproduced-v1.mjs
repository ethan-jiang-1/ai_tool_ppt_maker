/**
 * reset-unproduced-v1 — Abandon an unpublished unique v1 structure and restore the authoring draft.
 * Authority: openspec/specs/run-bundle-management/spec.md
 */

import { CLI_ERROR_CODES, CLI_DIAGNOSTIC_SCHEMA, createCliNext, emitCliError, registerCliJsonReport } from "../cli_error.mjs";
import { commandResult, renderCommandJson } from "../command_result.mjs";
import { emitUsage } from "../cli_diagnostics.mjs";
import { resolveRunHarnessBinding } from "../command_support.mjs";
import { basename, resolve } from "node:path";
import {
  UnproducedV1ResetError,
  UNPRODUCED_V1_RESET_CODES,
  resetUnproducedV1Draft,
} from "../../run-bundle/reset_unproduced_v1.mjs";

function renderResetText(result) {
  const lines = [
    `✓ Reset unproduced v1 authoring draft: ${result.facts.run_dir}`,
    "  Exact deck-type seed restored.",
    "  Irreversible provider and decision records were retained.",
  ];
  if (result.facts.previous_workflow) {
    lines.push(`  Previous workflow ${result.facts.previous_workflow} was abandoned for this unpublished v1.`);
  }
  return lines.join("\n");
}

function emitIrreversibleGate(code, details) {
  const reasonKind = {
    [UNPRODUCED_V1_RESET_CODES.SUCCESSOR_PRESENT]: "successor_version_present",
    [UNPRODUCED_V1_RESET_CODES.IDENTITY_UNRESOLVABLE]: "v1_identity_unresolvable",
    [UNPRODUCED_V1_RESET_CODES.IRREVERSIBLE_EVIDENCE]: "irreversible_v1_evidence",
  }[code] || "unproduced_v1_reset_blocked";
  emitCliError({
    code: CLI_ERROR_CODES.GATE_BLOCKED,
    message: "Unproduced v1 reset is not available; keep the current bytes and publish structure as vNext.",
    hint: "Use paginate / new-version on a clean successor. Do not hand-edit source or State.",
    where: "ppt_flow.reset-unproduced-v1",
    diagnostic: {
      schema: CLI_DIAGNOSTIC_SCHEMA,
      category: "gate",
      operation: "reset-unproduced-v1",
      reason: { kind: reasonKind, ...(details?.evidence ? { actual: String(details.evidence) } : {}) },
      next: createCliNext("repair_prerequisite", {
        default: "Keep the current v1 bytes and publish the new structure through the existing vNext path.",
      }),
    },
  });
  return 1;
}

export function commandResetUnproducedV1(runDir, { confirmAbandon = false, json = false } = {}) {
  if (!confirmAbandon) {
    return emitUsage(
      "ppt_flow.reset-unproduced-v1",
      "reset-unproduced-v1 requires --confirm-abandon.",
      "Pass --confirm-abandon only after the Deck Author abandons this unpublished v1 page structure."
    );
  }
  const resolvedArg = resolve(runDir || "");
  if (basename(resolvedArg) !== "v1") {
    return emitUsage(
      "ppt_flow.reset-unproduced-v1",
      "reset-unproduced-v1 requires an exact 3_versions/v1 run-dir.",
      "Pass the v1 version directory, not v2+ or the deck root."
    );
  }
  const binding = resolveRunHarnessBinding(runDir, "ppt_flow.reset-unproduced-v1.binding");
  if (!binding) return 1;
  const { resolved } = binding;

  let effect;
  try {
    effect = resetUnproducedV1Draft(resolved);
  } catch (error) {
    if (error instanceof UnproducedV1ResetError && error.code === UNPRODUCED_V1_RESET_CODES.NOT_V1) {
      return emitUsage(
        "ppt_flow.reset-unproduced-v1",
        "reset-unproduced-v1 requires an exact 3_versions/v1 run-dir.",
        "Pass the v1 version directory, not v2+ or the deck root."
      );
    }
    if (error instanceof UnproducedV1ResetError) {
      return emitIrreversibleGate(error.code, error.details);
    }
    throw error;
  }

  const ownerResult = commandResult({
    operation: "reset-unproduced-v1",
    state: "success",
    effect: {
      run_version: effect.run_version,
      seed_restored: effect.seed_restored,
      irreversible_records_deleted: effect.irreversible_records_deleted,
    },
    facts: effect,
  });
  if (json) {
    registerCliJsonReport(ownerResult);
    console.log(renderCommandJson(ownerResult));
    return 0;
  }
  console.log(renderResetText(ownerResult));
  return 0;
}
