import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { HTML_RUNTIME_PROFILE } from "./html_runtime_profile.mjs";

function* walkUpDirs(start = process.cwd()) {
  for (let path = resolve(start); ; path = dirname(path)) {
    yield path;
    const parent = dirname(path);
    if (parent === path) break;
  }
}

function findPackageInAncestorNodeModules(packageName, start = process.cwd()) {
  const parts = packageName.split("/");
  for (const directory of walkUpDirs(start)) {
    const nodeModules = join(directory, "node_modules");
    if (existsSync(join(nodeModules, ...parts))) return nodeModules;
  }
  return null;
}

export function discoverNpmPackages(start = process.cwd()) {
  const packages = [
    { importName: "@napi-rs/canvas", packageName: "@napi-rs/canvas", required: true },
    { importName: "pptxgenjs", packageName: "pptxgenjs", required: true },
    { importName: "commander", packageName: "commander", required: true },
    { importName: "playwright", packageName: "playwright", required: true, exactVersion: HTML_RUNTIME_PROFILE.playwrightVersion },
  ];
  let playwright = null;
  const checks = packages.map(({ importName, packageName, required, exactVersion }) => {
    const nodeModules = findPackageInAncestorNodeModules(importName, start);
    const packageRoot = nodeModules ? join(nodeModules, ...importName.split("/")) : null;
    let installedVersion = null;
    if (packageRoot && exactVersion) {
      try { installedVersion = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")).version; } catch {}
    }
    const present = nodeModules != null;
    const versionOk = !exactVersion || installedVersion === exactVersion;
    const ok = present && versionOk;
    if (packageName === "playwright" && present) playwright = { root: packageRoot, version: installedVersion };
    return {
      check: packageName,
      status: ok ? "ok" : required ? "fail" : "warn",
      detail: ok ? exactVersion ? `installed (exact ${installedVersion})` : "installed (ancestor node_modules)" : present && exactVersion ? `version ${installedVersion ?? "unknown"} does not match ${exactVersion}` : "not installed",
      fix: ok ? null : "Run `npm install` in the project root to restore package/lock alignment.",
    };
  });
  return { checks, playwright };
}
