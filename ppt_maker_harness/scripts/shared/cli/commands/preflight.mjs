import { join } from "node:path";
import { HARNESS_DIR, requireExactRunImage2Profile, resolveRunAdapter, runNode } from "../command_support.mjs";

const ENV_CHECK = join(HARNESS_DIR, "scripts", "00-setup", "env-check.mjs");
const OPERATIONS = new Set(["framed-local-refresh", "raw-generation", "full-build"]);

// Command: preflight
// ---------------------------------------------------------------------------

/**
 * preflight — Exact-run operation readiness, zero network and zero write.
 */
export async function commandPreflight(runDir, { operation }) {
  if (!OPERATIONS.has(operation)) return 1;
  const route = await resolveRunAdapter(runDir, "ppt_flow.preflight.identity");
  if (!route) return 1;
  if (operation === "raw-generation" || operation === "full-build") {
    if (!(await requireExactRunImage2Profile(route, { where: "ppt_flow.preflight.profile", operation: `${operation}-readiness` }))) {
      return null;
    }
  }
  return runNode(ENV_CHECK, ["--operation", operation]);
}
