import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { EXECUTABLE_INVENTORY } from "../../PPTMAKER_FRAMEWORK/scripts/contracts/executable_inventory.mjs";
import {
  ACTIVE_PHASES,
  PHASE_ADJACENCY,
  PUBLIC_SHARED_INTERFACES,
  collectLiteralImports,
  validateArchitectureSnapshot,
  validateRepositoryArchitecture,
} from "../../PPTMAKER_FRAMEWORK/scripts/contracts/framework_architecture.mjs";

const REQUIRED_CONTRACTS = [
  "contracts/canonical_json.mjs",
  "contracts/executable_inventory.mjs",
  "contracts/framework_architecture.mjs",
  "contracts/html_source_ast.mjs",
  "contracts/html_review_projection.mjs",
];

function ownerFor(path) {
  if (path === "ppt_flow.mjs") return "root";
  if (path.startsWith("shared/")) return path.split("/").slice(0, 2).join("/");
  if (path.startsWith("contracts/")) return "contracts";
  return path.split("/")[0];
}

function canonicalSnapshot() {
  const files = {
    "README.md": "target tree",
    "04-image-production/README.md": "optional refinement",
    "shared/state/internal/html_review_evidence_core.mjs": "export const evaluate = () => ({});",
  };
  const interfaces = [
    ...ACTIVE_PHASES.map((phase) => `${phase}/index.mjs`),
    ...PUBLIC_SHARED_INTERFACES,
    ...REQUIRED_CONTRACTS,
  ];
  for (const path of interfaces) files[path] = "export const importSafe = true;\n";
  for (const path of EXECUTABLE_INVENTORY) {
    const prefix = path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1).split("/").map(() => "..").join("/") : "./";
    files[path] = `import "${prefix}shared/cli/cli_bootstrap.mjs?entry=${path}";\n` +
      (path.startsWith("00-setup/") ? `import "./index.mjs";\n` : "") +
      (path.startsWith("03-html-production/") ? `import "./index.mjs";\n` : "") +
      (path.startsWith("05-iteration/") ? `import "../../index.mjs";\n` : "");
  }
  files["ppt_flow.mjs"] = `import "./shared/cli/cli_bootstrap.mjs?entry=ppt_flow.mjs";\nimport("./00-setup/index.mjs");\n`;
  const grouped = new Map();
  for (const path of interfaces) {
    const owner = ownerFor(path);
    if (!grouped.has(owner)) grouped.set(owner, { owner, interfaces: [], executables: [], unit_integration: [], e2e: [] });
    grouped.get(owner).interfaces.push(path);
  }
  for (const path of EXECUTABLE_INVENTORY) {
    const owner = ownerFor(path);
    if (!grouped.has(owner)) grouped.set(owner, { owner, interfaces: [], executables: [], unit_integration: [], e2e: [] });
    grouped.get(owner).executables.push(path);
  }
  for (const entry of grouped.values()) {
    const testPath = `tests/${entry.owner}/test_interface.mjs`;
    entry.unit_integration.push(testPath);
    files[testPath] = "// owned synthetic test\n";
    for (const field of ["interfaces", "executables", "unit_integration", "e2e"]) entry[field].sort();
  }
  return { files, manifest: { schema: "pptmaker-source-test-ownership-v1", owners: [...grouped.values()].sort((a, b) => a.owner.localeCompare(b.owner)) } };
}

function issueCodes(result) {
  return result.issues.map((issue) => issue.code);
}

describe("framework architecture contract", () => {
  it("accepts the exact target tree, executable registry, and ownership manifest", () => {
    const result = validateArchitectureSnapshot(canonicalSnapshot());
    expect(result.issues).toEqual([]);
    expect(result.detectedExecutables).toEqual([...EXECUTABLE_INVENTORY].sort());
  });

  it("pins the exact acyclic Phase adjacency including the bounded Phase 4", () => {
    expect(PHASE_ADJACENCY).toEqual({
      "00-setup": [],
      "01-content": [],
      "02-visual-system": [],
      "03-html-production": ["00-setup", "01-content", "02-visual-system"],
      "04-image-production": ["01-content", "02-visual-system", "03-html-production"],
      "05-iteration": ["01-content", "02-visual-system", "03-html-production", "04-image-production"],
    });
    const snapshot = canonicalSnapshot();
    snapshot.files["04-image-production/cli.mjs"] = "export {};";
    expect(issueCodes(validateArchitectureSnapshot(snapshot))).toContain("phase4-public-surface");
  });

  it("rejects old paths, scripts/lib, generic roots, and root business dumping", () => {
    for (const [path, code] of [
      ["lib/old.mjs", "legacy-lib"],
      ["utils/misc.mjs", "generic-root"],
      ["visual_config.mjs", "old-flat-path"],
    ]) {
      const snapshot = canonicalSnapshot();
      snapshot.files[path] = "export {};";
      expect(issueCodes(validateArchitectureSnapshot(snapshot)), path).toContain(code);
    }
  });

  it("parses static, export-from, and literal dynamic imports while ignoring computed imports", () => {
    expect(collectLiteralImports(`import x from "./a.mjs"; export { y } from './b.mjs'; import("./c.mjs"); import(path);`)).toEqual([
      "./a.mjs", "./b.mjs", "./c.mjs",
    ]);
  });

  it("rejects forbidden Phase, shared, core, and cross-adapter private edges", () => {
    const cases = [
      ["00-setup/index.mjs", `import "../05-iteration/index.mjs";`, "phase-adjacency"],
      ["03-html-production/index.mjs", `import "../01-content/internal/private.mjs";`, "foreign-phase-private-import"],
      ["shared/state/state.mjs", `import "../../03-html-production/index.mjs";`, "shared-phase-import"],
      ["shared/identity/byte_hash.mjs", `import "../state/internal/html_review_evidence_core.mjs";`, "review-core-importer"],
      ["04-image-production/whole-page/internal/provider.mjs", `import "../../visual-slot/internal/transport.mjs";`, "cross-adapter-private-import"],
    ];
    for (const [path, source, code] of cases) {
      const snapshot = canonicalSnapshot();
      snapshot.files[path] = source;
      if (source.includes("private.mjs")) snapshot.files["01-content/internal/private.mjs"] = "export {};";
      if (path.includes("provider.mjs")) snapshot.files["04-image-production/visual-slot/internal/transport.mjs"] = "export {};";
      expect(issueCodes(validateArchitectureSnapshot(snapshot)), `${path} -> ${code}`).toContain(code);
    }
  });

  it("fails closed on executable, recursive test, and source ownership drift", () => {
    const missingCli = canonicalSnapshot();
    delete missingCli.files[EXECUTABLE_INVENTORY[1]];
    expect(issueCodes(validateArchitectureSnapshot(missingCli))).toContain("executable-inventory");

    const flatTest = canonicalSnapshot();
    flatTest.files["tests/test_business.mjs"] = "// forbidden flat suite";
    expect(issueCodes(validateArchitectureSnapshot(flatTest))).toContain("flat-test");

    const missingOwner = canonicalSnapshot();
    missingOwner.manifest.owners.find((entry) => entry.owner === "00-setup").interfaces = [];
    expect(issueCodes(validateArchitectureSnapshot(missingOwner))).toContain("missing-interface-owner");
  });

  it("keeps the pre-install CLI closure free of external packages", () => {
    for (const path of [
      "PPTMAKER_FRAMEWORK/scripts/contracts/executable_inventory.mjs",
      "PPTMAKER_FRAMEWORK/scripts/shared/cli/cli_bootstrap.mjs",
      "PPTMAKER_FRAMEWORK/scripts/shared/cli/cli_error.mjs",
    ]) {
      const imports = collectLiteralImports(readFileSync(path, "utf8"));
      expect(imports.filter((specifier) => !specifier.startsWith(".") && !specifier.startsWith("node:")), path).toEqual([]);
    }
  });

  it("enforces the final architecture against the real repository tree", () => {
    const result = validateRepositoryArchitecture(process.cwd());
    expect(result.issues, result.issues.map((issue) => `${issue.code}: ${issue.path} ${issue.message}`).join("\n")).toEqual([]);
  });

  it("keeps base, HTML-local, and markerless-provider load closures selective", () => {
    const trace = (script, args) => {
      const result = spawnSync(process.execPath, [script, ...args], {
        cwd: process.cwd(),
        encoding: "utf8",
        env: { ...process.env, NODE_DEBUG: "esm" },
        timeout: 30_000,
      });
      expect(result.status, result.stderr).toBe(0);
      return result.stderr;
    };
    const base = trace("PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs", ["doctor", "--help"]);
    expect(base).not.toMatch(/scripts\/(?:01-content|02-visual-system|03-html-production|04-image-production|05-iteration)\//);
    expect(base).not.toMatch(/(?:image_api_client|html_slide_renderer|@napi-rs\/canvas|fast-png)/);

    const html = trace("PPTMAKER_FRAMEWORK/scripts/03-html-production/stage2_render_html.mjs", ["--help"]);
    expect(html).not.toMatch(/scripts\/(?:04-image-production|05-iteration\/legacy-image2)|image_api_client/);

    const markerless = trace("PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/stage2_generate_images.mjs", ["--help"]);
    expect(markerless).not.toMatch(/visual-slot|html_slide_renderer|html_render_runtime/);
  }, 60_000);
});
