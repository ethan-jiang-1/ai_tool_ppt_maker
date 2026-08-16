import { CLI_ERROR_CODES, CLI_DIAGNOSTIC_SCHEMA, createCliNext, emitCliError } from "../cli_error.mjs";
import { emitCurrentProtocolError, emitFailed, emitUsage, pageImageDiagnosticReasonKind, resolveRunAdapter, targetImage2Operations } from "../command_support.mjs";
import { commandResult } from "../command_result.mjs";

// Command: refresh
// ---------------------------------------------------------------------------

function renderNotesText(result) {
  return `✓ Target Page Image notes refreshed: ${result.facts.notesInjected} slide(s)`;
}

function renderFramedText(result) {
  return `✓ Target Framed refresh delivered without provider submission: ${result.facts.assemblyPath}`;
}

async function commandPageImageRefresh(route, {
  kind,
  only,
  all,
}) {
  if (route.adapter === "page-image-workflow") {
    if (kind === "visual") {
      return emitUsage(
        "ppt_flow.refresh.target.visual",
        "Target Page Image visual refresh requires a selected-workflow raw rebuild",
        "Run image2 plan, authorize the exact raw scope when needed, generate, review, then build."
      );
    }
    try {
      const operations = await targetImage2Operations(route.workflow);
      if (kind === "notes") {
        if (only || all) return emitUsage("ppt_flow.refresh.target.notes", "Target Page Image notes refresh accepts no slide selectors", "Rerun notes against the current shared target delivery.");
        const result = await operations.refreshNotes(route.run_dir);
        const ownerResult = commandResult({
          operation: "refresh",
          state: "success",
          effect: { kind, notesInjected: result.delivery.notes.notesInjected },
          facts: { kind, notesInjected: result.delivery.notes.notesInjected },
        });
        console.log(renderNotesText(ownerResult));
        return 0;
      }
      if (route.workflow !== "framed") {
        return emitUsage("ppt_flow.refresh.target.title", "Target Pure visible text requires a Pure raw rebuild", "Run the selected Pure image2 raw lifecycle; Framed local refresh is not legal for Pure.");
      }
      if (only && all) return emitUsage("ppt_flow.refresh.target.title", "--only and --all are mutually exclusive", "Select exact Framed stable IDs or use --all.");
      if (!only && !all) return emitUsage("ppt_flow.refresh.target.title", "Framed header overlay refresh requires --only or --all", "Select exact current Framed stable IDs before a provider-free refresh.");
      const slideIds = only ? only.split(",").map((id) => id.trim()).filter(Boolean) : null;
      const result = await operations.refreshFramedText(route.run_dir, { slideIds });
      const ownerResult = commandResult({
        operation: "refresh",
        state: "success",
        effect: { kind, assemblyPath: result.delivery.assembly.path },
        facts: { kind, assemblyPath: result.delivery.assembly.path },
      });
      console.log(renderFramedText(ownerResult));
      return 0;
    } catch (error) {
      if (error?.code === "current_protocol_invalid") {
        emitCurrentProtocolError("ppt_flow.refresh.target.identity", route.run_dir, error.code);
        return 1;
      }
      const rawRequired = /TARGET_(?:ACCEPTED_RAW_EVIDENCE_REQUIRED|RAW_REVIEW|SOURCE_RECEIPT_STALE)|raw_evidence|raw_review/i.test(`${error.code || ""} ${error.message || ""}`);
      if (rawRequired) {
        emitCliError({
          code: CLI_ERROR_CODES.GATE_BLOCKED,
          message: error.message,
          hint: "Use the selected target raw plan and review lifecycle before target finalization.",
          where: "ppt_flow.refresh.target.title",
          diagnostic: {
            schema: CLI_DIAGNOSTIC_SCHEMA,
            category: "gate",
            operation: "target-framed-refresh",
            source: { path: route.run_dir },
            reason: { kind: pageImageDiagnosticReasonKind(error.code, "raw_evidence_required") },
            next: createCliNext("repair_prerequisite", { default: "Build a fresh selected-workflow target raw plan; authorize only a nonzero current scope." }),
          },
        });
        return 1;
      }
      emitFailed("ppt_flow.refresh.target", error.message || "Target Page Image refresh failed.", "Repair the selected workflow source, evidence, final manifest, or notes before retrying.");
      return 1;
    }
  }
}

/**
 * refresh — Run the smallest safe edit chain.
 * Routes only the current Page Image ownership/invalidation path.
 *
 * @param {string} runDir
 * @param {{kind: string, only: string|null, all: boolean}} opts
 */
export async function commandRefresh(runDir, { kind, only, all }) {
  const route = await resolveRunAdapter(runDir, "ppt_flow.refresh.identity");
  if (!route) return 1;
  return commandPageImageRefresh(route, { kind, only, all });
}
