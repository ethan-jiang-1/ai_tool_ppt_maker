import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { collectStaticSpecifiers, hasVisualEngineClosure } from "./development_verification_admission.mjs";

const require = createRequire(import.meta.url);
const TEST_PATH = /^tests\/.+\/(?:test_[^/]+|test-[^/]+)\.mjs$/;
const JOURNEY_PATH = /^tests_e2e\/.+\/test_mock_[^/]+\.mjs$/;

function usage(message) { process.stderr.write(`${message}\n`); return 2; }
function normalized(path) { return String(path).replaceAll("\\", "/"); }

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
      if (!specifier.endsWith(".mjs")) return { ok: false, detail: `selected local import must be an exact .mjs path: ${specifier}` };
      const dependency = resolve(dirname(path), specifier);
      if (!normalized(relative(root, dependency)).startsWith("..")) queue.push(dependency);
    }
  }
  return { ok: true, visual };
}

export function validateSelectedInvocation(args, root = process.cwd()) {
  const [tier, entry, ...rest] = args;
  if (!["focused", "render", "journey"].includes(tier)) return { ok: false, detail: "select focused, render, or journey" };
  if (!entry || rest.length) return { ok: false, detail: "supply exactly one selected test path and no extra selector or flag" };
  if (entry.includes("\\") || entry.includes("..") || entry.startsWith("/") || (tier === "journey" ? !JOURNEY_PATH.test(entry) : !TEST_PATH.test(entry))) return { ok: false, detail: "selected path is outside this tier's exact naming and scope" };
  const path = resolve(root, entry);
  if (!path.startsWith(`${resolve(root)}/`) || !existsSync(path)) return { ok: false, detail: "selected test path does not exist in this repository" };
  if (tier === "journey") return { ok: true, tier, entry, config: "vitest.e2e.config.mjs" };
  const closure = selectedClosure(root, entry);
  if (!closure.ok) return closure;
  if (tier === "focused" && closure.visual) return { ok: false, detail: "focused verification rejects a visual-engine closure; use test:render" };
  if (tier === "render" && !closure.visual) return { ok: false, detail: "render verification requires a Canvas/Chromium/PPTX/ECharts/HTML visual-engine closure" };
  return { ok: true, tier, entry, config: "vitest.config.mjs" };
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
