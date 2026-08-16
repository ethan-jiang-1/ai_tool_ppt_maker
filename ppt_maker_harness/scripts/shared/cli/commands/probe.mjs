import { join } from "node:path";
import { HARNESS_DIR, requireExactRunImage2Profile, resolveRunAdapter, runNode } from "../command_support.mjs";

const ENV_CHECK = join(HARNESS_DIR, "scripts", "00-setup", "env-check.mjs");

// Command: probe
// ---------------------------------------------------------------------------

/**
 * probe — Live connectivity probe bound to the exact run. Resolves the
 * confirmed provider profile and requires IMAGE2_PROVIDER_PROFILE_ID to match
 * before any POST; success is connectivity only.
 */
export async function commandProbe(runDir, { mode = "smoke" }) {
  const route = await resolveRunAdapter(runDir, "ppt_flow.probe.identity");
  if (!route) return 1;
  if (!(await requireExactRunImage2Profile(route, { where: "ppt_flow.probe.profile", operation: "raw-generation-readiness" }))) {
    return null;
  }
  return runNode(ENV_CHECK, [mode === "vendors" ? "--probe-vendors" : "--smoke"]);
}
