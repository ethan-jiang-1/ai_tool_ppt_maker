import { join } from "node:path";
import { CLI_ERROR_CODES, CLI_DIAGNOSTIC_SCHEMA, createCliNext, emitCliError } from "../cli_error.mjs";
import { HARNESS_DIR, runNode, resolveRunAdapter, pageImageDiagnosticReasonKind } from "../command_support.mjs";

const ENV_CHECK = join(HARNESS_DIR, "scripts", "00-setup", "env-check.mjs");

// ---------------------------------------------------------------------------
// Command: doctor
// ---------------------------------------------------------------------------

/**
 * doctor — Check base local runtime and optional Image2 readiness.
 * Delegates to env-check.mjs as a subprocess.
 * @param {{smoke?: boolean, probeVendors?: boolean, runDir?: string|null, operation?: string|null}} [opts]
 */
export async function commandDoctor({ smoke = false, probeVendors = false, runDir = null, operation = null } = {}) {
  const args = [];
  let route = null;
  if (runDir) {
    route = await resolveRunAdapter(runDir, "ppt_flow.doctor.run-dir");
    if (!route) return null;
  }
  if (route && (operation === "raw-generation" || operation === "full-build" || smoke || probeVendors)) {
    try {
      const { resolveImage2ProviderProfile } = await import("../../../shared/image2/provider_profile.mjs");
      const { requireMatchingImage2RuntimeProfileId } = await import("../../../shared/image2/runtime_profile_id.mjs");
      const { applyImage2StartupEnv } = await import("../../../shared/image2/startup_env.mjs");
      const profile = resolveImage2ProviderProfile(route.run_dir);
      applyImage2StartupEnv({ runDir: route.run_dir });
      requireMatchingImage2RuntimeProfileId({ expectedProfileId: profile.profile_id });
    } catch (error) {
      const reason = pageImageDiagnosticReasonKind(error?.code);
      const sourceFailure = isImage2ProviderProfileSourceFailure(reason);
      const sourcePath = sourceFailure && error?.source
        ? join(route.deck_dir, ...String(error.source).split("/"))
        : null;
      emitCliError({
        code: CLI_ERROR_CODES.FAILED,
        message: sourceFailure
          ? "The selected Image2 provider profile source is not ready."
          : "IMAGE2_PROVIDER_PROFILE_ID does not match the selected Image2 provider profile.",
        hint: sourceFailure
          ? "Repair the selected non-secret provider profile source, then rerun this exact readiness check."
          : "Repair IMAGE2_PROVIDER_PROFILE_ID for this environment, then rerun this exact readiness check.",
        where: "ppt_flow.doctor.profile",
        diagnostic: {
          schema: CLI_DIAGNOSTIC_SCHEMA,
          category: sourceFailure ? "source_validation" : "environment",
          operation: "raw-generation-readiness",
          ...(sourcePath ? { source: { path: sourcePath } } : {}),
          reason: { kind: sourceFailure ? reason : "image2_provider_profile_id_mismatch" },
          next: createCliNext(sourceFailure ? "edit_source" : "repair_environment", {
            ...(sourcePath ? { inspect: [{ path: sourcePath }] } : {}),
            default: sourceFailure
              ? "Repair the selected provider profile source, then rerun this exact readiness check."
              : "Repair IMAGE2_PROVIDER_PROFILE_ID for the selected provider profile, then rerun this exact readiness check.",
          }),
        },
      });
      return null;
    }
  }
  if (smoke) args.push("--smoke");
  if (probeVendors) args.push("--probe-vendors");
  if (operation) args.push("--operation", operation);
  return runNode(ENV_CHECK, args);
}
