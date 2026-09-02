import { join } from "node:path";
import { HARNESS_DIR, runNode } from "../command_support.mjs";

const ENV_CHECK = join(HARNESS_DIR, "scripts", "00-setup", "env-check.mjs");

// Command: doctor
// ---------------------------------------------------------------------------

/**
 * doctor — Offline local runtime check. Delegates to env-check.mjs as a
 * subprocess with no run-dir, operation, or live-probe flags.
  * Authority: openspec/specs/environment-check/spec.md
 * Authority: openspec/specs/cli-surface/spec.md
 */
export async function commandDoctor() {
  return runNode(ENV_CHECK, []);
}
