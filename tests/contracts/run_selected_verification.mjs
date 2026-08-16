import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { collectStaticSpecifiers, hasVisualEngineClosure } from "./development_verification_admission.mjs";

const require = createRequire(import.meta.url);
const TEST_PATH = /^tests\/.+\/(?:test_[^/]+|test-[^/]+)\.mjs$/;
const PROCESS_TEST_PATH = /^tests\/.+\/test_process_[^/]+\.mjs$/;
const JOURNEY_PATH = /^tests_e2e\/.+\/test_mock_[^/]+\.mjs$/;
const REAL_E2E_PATH = /^tests_e2e\/.+\/test_real_[^/]+\.mjs$/;

function usage(message) { process.stderr.write(`${message}\n`); return 2; }
function normalized(path) { return String(path).replaceAll("\\", "/"); }
function localSpecifierPath(specifier) { return specifier.split(/[?#]/, 1)[0]; }

function selectedClosure(root, entry) {
  const queue = [resolve(root, entry)];
  const seen = new Set();
  let visual = false;
  while (queue.length) {
    const path = queue.shift();
    if (seen.has(path)) continue;
    if (!existsSync(path) || !statSync(path).isFile()) return { ok: false, detail: `missing selected module ${normalized(relative(root, path))}` };
    seen.add(path);
    const source = readFileSync(path, "utf8");
    visual ||= hasVisualEngineClosure(normalized(relative(root, path)));
    const parsed = collectStaticSpecifiers(source, { prohibitRuntimeSurfaces: false });
    if (!parsed.ok) return { ok: false, detail: parsed.detail };
    for (const specifier of parsed.specifiers) {
      visual ||= hasVisualEngineClosure(specifier);
      if (!specifier.startsWith(".")) continue;
      const localSpecifier = localSpecifierPath(specifier);
      if (!localSpecifier.endsWith(".mjs")) return { ok: false, detail: `selected local import must be an exact .mjs path: ${specifier}` };
      const dependency = resolve(dirname(path), localSpecifier);
      if (!normalized(relative(root, dependency)).startsWith("..")) queue.push(dependency);
    }
  }
  return { ok: true, visual };
}

export function realE2EEnabled(env = process.env) {
  return env.PPTMAKER_RUN_REAL_E2E === "1";
}

export function validateSelectedInvocation(args, root = process.cwd(), env = process.env) {
  const [tier, entry, ...rest] = args;
  if (!["focused", "process", "journey", "real-e2e"].includes(tier)) return { ok: false, detail: "select focused, process, journey, or real-e2e" };
  if (!entry || rest.length) return { ok: false, detail: "supply exactly one selected test path and no extra selector or flag" };
  const pathPattern = tier === "journey" ? JOURNEY_PATH : tier === "real-e2e" ? REAL_E2E_PATH : tier === "process" ? PROCESS_TEST_PATH : TEST_PATH;
  if (entry.includes("\\") || entry.includes("..") || entry.startsWith("/") || !pathPattern.test(entry)) return { ok: false, detail: "selected path is outside this tier's exact naming and scope" };
  const path = resolve(root, entry);
  if (!path.startsWith(`${resolve(root)}/`) || !existsSync(path)) return { ok: false, detail: "selected test path does not exist in this repository" };
  if (tier === "journey") return { ok: true, tier, entry, config: "vitest.e2e.config.mjs" };
  if (tier === "real-e2e") {
    if (!realE2EEnabled(env)) return { ok: false, detail: "real E2E requires PPTMAKER_RUN_REAL_E2E=1" };
    return { ok: true, tier, entry, config: "vitest.real-e2e.config.mjs" };
  }
  if (tier === "process") {
    // The process tier runs real public-binary suites (test_process_*). It is
    // a distinct supported tier: core and focused runs must not be read as
    // process coverage, and process suites are not part of the default sweep.
    return { ok: true, tier, entry, config: "vitest.process.config.mjs" };
  }
  const closure = selectedClosure(root, entry);
  if (!closure.ok) return closure;
  if (closure.visual) return { ok: false, detail: "focused verification rejects visual-engine closures; long local render tests are not retained" };
  return { ok: true, tier, entry, config: PROCESS_TEST_PATH.test(entry) ? "vitest.process.config.mjs" : "vitest.config.mjs" };
}

export function runSelectedVerification(args = process.argv.slice(2), { root = process.cwd(), spawnChild = spawnSync } = {}) {
  const selected = validateSelectedInvocation(args, root);
  if (!selected.ok) return usage(selected.detail);
  let vitest;
  try { vitest = require.resolve("vitest/vitest.mjs"); } catch { return usage("local Vitest is unavailable; restore dependencies before selected verification"); }
  const result = spawnChild(process.execPath, [vitest, "run", "--config", selected.config, selected.entry], { cwd: root, stdio: "inherit" });
  return result.status === 0 ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exitCode = runSelectedVerification();
