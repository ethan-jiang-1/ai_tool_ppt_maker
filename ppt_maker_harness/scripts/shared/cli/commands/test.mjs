import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { buildDelegatedDiagnostic, createChildOutputCollector, createCliNext } from "../cli_error.mjs";
import { emitFailed } from "../cli_diagnostics.mjs";
import { HARNESS_DIR, runNode } from "../command_support.mjs";

// ---------------------------------------------------------------------------
// Command: test
// ---------------------------------------------------------------------------

/**
 * test — Run the bounded core verification tier via npm test.
 */
export async function commandTest() {
  const result = spawnSync("npm", ["test"], {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024,
    env: process.env,
    cwd: resolve(HARNESS_DIR, ".."),
  });
  const collector = createChildOutputCollector({ registered: false });
  collector.pushStdout(result.stdout || "");
  collector.pushStderr(result.stderr || "");
  const captured = collector.finish(result.status !== null ? result.status : 1);
  const code = captured.overflow ? 1 : captured.code;
  runNode.lastChildResult = {
    ...captured,
    invocation: { program: "npm", args: ["test"] },
  };
  if (code === 0) {
    if (captured.stdout) process.stdout.write(captured.stdout);
    if (captured.stderr) process.stderr.write(captured.stderr);
  }
  if (code !== 0) {
    emitFailed(
      "ppt_flow.test",
      `npm test exited ${code}`,
      "Inspect the failing core test suite, fix the source, then rerun ppt_flow test",
      buildDelegatedDiagnostic({
        invocation: { program: "npm", args: ["test"] },
        overflow: captured.overflow,
        operation: "test",
        childStatus: code,
        next: createCliNext("edit_source", {
          default: "Inspect the test failures in a direct test run, fix source code or tests, then rerun.",
          invocation: { program: "npm", args: ["test"] },
        }),
      })
    );
  }
  return code === 0 ? 0 : 1;
}
