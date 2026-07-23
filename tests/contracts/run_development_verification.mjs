import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readAndAuditCoreInventory } from "./development_verification_admission.mjs";

const require = createRequire(import.meta.url);
const SCHEMA = "development-verification-v1";
const TOTAL_MS = 60_000;
const PREFLIGHT_MS = 5_000;
const EXECUTION_MS = 50_000;
const SHUTDOWN_MS = 5_000;
const PROCESS_ENTRY = process.hrtime.bigint();

function elapsedMs(start) { return Math.min(TOTAL_MS, Math.max(0, Math.floor(Number(process.hrtime.bigint() - start) / 1_000_000))); }
function boundedTail(value) {
  let text = String(value || "");
  while (Buffer.byteLength(JSON.stringify(text), "utf8") > 8192) text = text.slice(Math.max(0, text.length - 128));
  return text;
}
function summary(start, result, nextAction, failureTail = "") {
  const value = { schema: SCHEMA, tier: "core", result, duration_ms: elapsedMs(start), next_action: nextAction };
  if (failureTail) value.failure_tail = boundedTail(failureTail);
  return value;
}
function appendTail(current, chunk) { return boundedTail(`${current}${chunk}`); }

function runChild(vitestEntry, entries, { root, spawnChild = spawn, executionMs = EXECUTION_MS, shutdownMs = SHUTDOWN_MS }) {
  return new Promise((resolveResult) => {
    let child;
    try {
      child = spawnChild(process.execPath, [vitestEntry, "run", "--config", "vitest.config.mjs", ...entries], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
    } catch (error) {
      resolveResult({ unavailable: error.message });
      return;
    }
    let tail = "";
    let settled = false;
    let timedOut = false;
    let killTimer;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(executionTimer);
      clearTimeout(killTimer);
      resolveResult({ ...result, tail });
    };
    child.stdout?.on("data", (chunk) => { tail = appendTail(tail, chunk); });
    child.stderr?.on("data", (chunk) => { tail = appendTail(tail, chunk); });
    child.once("error", (error) => finish({ unavailable: error.message }));
    child.once("close", (code, signal) => finish({ code, signal, timedOut }));
    const executionTimer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      killTimer = setTimeout(() => child.kill("SIGKILL"), Math.max(1, shutdownMs - 250));
    }, executionMs);
  });
}

/** Runs one admitted local Vitest child and emits no child progress itself. */
export async function runDevelopmentVerification({
  root = process.cwd(), inventoryPath,
  preflightMs = PREFLIGHT_MS, executionMs = EXECUTION_MS, shutdownMs = SHUTDOWN_MS,
  resolveVitest = () => require.resolve("vitest/vitest.mjs"), spawnChild = spawn,
  start = PROCESS_ENTRY,
} = {}) {
  const emit = (result, nextAction, tail = "") => ({ output: summary(start, result, nextAction, tail), exitCode: result === "passed" ? 0 : 1 });
  const audited = readAndAuditCoreInventory({ root, ...(inventoryPath ? { inventoryPath } : {}) });
  if (!audited.ok) return emit("invalid_inventory", audited.next_action, `${audited.code}: ${audited.detail}`);
  if (elapsedMs(start) > preflightMs) return emit("timed_out", "reduce core admission work below the 5,000-ms preflight budget", "core preflight exceeded its deadline");
  let vitestEntry;
  try { vitestEntry = resolveVitest(); } catch (error) { return emit("unavailable", "restore the installed local Vitest dependency", error.message); }
  if (elapsedMs(start) > preflightMs) return emit("timed_out", "reduce core admission work below the 5,000-ms preflight budget", "core preflight exceeded its deadline");
  const child = await runChild(vitestEntry, audited.entries, { root, spawnChild, executionMs, shutdownMs });
  if (child.unavailable) return emit("unavailable", "repair local Vitest startup and rerun the core verifier", child.unavailable);
  if (child.timedOut) return emit("timed_out", "repair or demote the timed-out core test", child.tail || "owned Vitest child exceeded execution budget");
  if (child.code === 0) return emit("passed", "core inventory passed; select only affected opt-in seams when needed");
  return emit("failed", "repair the failing core assertion and rerun the core verifier", child.tail || `Vitest exited ${child.code ?? child.signal ?? "unknown"}`);
}

async function main() {
  const result = await runDevelopmentVerification({ start: PROCESS_ENTRY });
  process.stdout.write(`${JSON.stringify(result.output)}\n`);
  process.exitCode = result.exitCode;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
