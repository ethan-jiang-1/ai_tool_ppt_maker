import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EXECUTABLE_INVENTORY } from "../../PPTMAKER_FRAMEWORK/scripts/contracts/executable_inventory.mjs";
import {
  ACTIVE_PHASES,
  PHASE_ADJACENCY,
  PUBLIC_SHARED_INTERFACES,
  TARGET_DELIVERY_INTERFACES,
  TARGET_ITERATION_INTERFACES,
  TARGET_WORKFLOW_INTERFACES,
  collectLiteralImports,
  validateArchitectureSnapshot,
  validateRepositoryArchitecture,
} from "../../PPTMAKER_FRAMEWORK/scripts/contracts/framework_architecture.mjs";

const REQUIRED_CONTRACTS = [
  "contracts/canonical_json.mjs",
  "contracts/executable_inventory.mjs",
  "contracts/framework_architecture.mjs",
  "contracts/framework_document_command_audit.mjs",
  "contracts/framework_static_coherence.mjs",
  "contracts/retirement_ledger_audit.mjs",
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
  };
  const interfaces = [
    ...ACTIVE_PHASES.map((phase) => `${phase}/index.mjs`),
    ...TARGET_WORKFLOW_INTERFACES,
    ...TARGET_DELIVERY_INTERFACES,
    ...TARGET_ITERATION_INTERFACES,
    ...PUBLIC_SHARED_INTERFACES,
    ...REQUIRED_CONTRACTS,
  ];
  for (const path of interfaces) files[path] = "export const importSafe = true;\n";
  for (const path of EXECUTABLE_INVENTORY) {
    const prefix = path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1).split("/").map(() => "..").join("/") : "./";
    files[path] = `import "${prefix}shared/cli/cli_bootstrap.mjs?entry=${path}";\n` +
      (path.startsWith("00-setup/") ? `import "./index.mjs";\n` : "") +
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

  it("pins the exact acyclic compatibility Phase adjacency including bounded Phase 4", () => {
    expect(PHASE_ADJACENCY).toEqual({
      "00-setup": [],
      "01-content": [],
      "02-visual-system": [],
      "04-image-production": ["00-setup", "01-content", "02-visual-system"],
      "05-iteration": ["01-content", "02-visual-system", "04-image-production"],
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
      ["shared/state/state.mjs", `import "../../04-image-production/index.mjs";`, "shared-phase-import"],
      ["04-image-production/page-authority/internal/provider.mjs", `import "../../../01-content/internal/private.mjs";`, "foreign-phase-private-import"],
      ["03-framed-image/index.mjs", `import "../shared/image2/private.mjs";`, "target-private-shared-import"],
    ];
    for (const [path, source, code] of cases) {
      const snapshot = canonicalSnapshot();
      snapshot.files[path] = source;
      if (source.includes("private.mjs")) snapshot.files["01-content/internal/private.mjs"] = "export {};";
      if (path.includes("provider.mjs")) snapshot.files["01-content/internal/private.mjs"] = "export {};";
      if (path.includes("03-framed-image")) snapshot.files["shared/image2/private.mjs"] = "export {};";
      expect(issueCodes(validateArchitectureSnapshot(snapshot)), `${path} -> ${code}`).toContain(code);
    }
  });

  it("rejects Framed/Pure semantic branches in shared mechanics and delivery", () => {
    for (const [path, source] of [
      ["shared/image2/page_authority_raw_mechanics.mjs", `if (workflow === "framed") return null;`],
      ["shared/image2/page_authority_final_manifest.mjs", `if (ownerWorkflow !== "pure") return null;`],
      ["05-delivery/index.mjs", `switch (manifest.workflow) { case "framed": return null; }`],
    ]) {
      const snapshot = canonicalSnapshot();
      snapshot.files[path] = source;
      expect(issueCodes(validateArchitectureSnapshot(snapshot)), path).toContain("shared-workflow-semantic-branch");
    }
  });

  it("rejects imports between target workflow siblings", () => {
    for (const [path, imported] of [
      ["03-framed-image/index.mjs", "../04-pure-image/index.mjs"],
      ["03-framed-image/index.mjs", "../04-pure-image/internal/private.mjs"],
      ["04-pure-image/index.mjs", "../03-framed-image/index.mjs"],
      ["04-pure-image/index.mjs", "../03-framed-image/internal/private.mjs"],
    ]) {
      const snapshot = canonicalSnapshot();
      snapshot.files[path] = `import "${imported}";`;
      if (imported.includes("internal/private")) {
        const sibling = imported.includes("04-pure") ? "04-pure-image" : "03-framed-image";
        snapshot.files[`${sibling}/internal/private.mjs`] = "export {};";
      }
      expect(issueCodes(validateArchitectureSnapshot(snapshot)), `${path} -> ${imported}`).toContain("sibling-workflow-import");
    }
  });

  it("allows iteration to use target public interfaces but rejects target sibling internals", () => {
    const allowed = canonicalSnapshot();
    allowed.files["06-iteration/index.mjs"] = [
      `import "../03-framed-image/index.mjs";`,
      `import "../04-pure-image/index.mjs";`,
      `import "../05-delivery/index.mjs";`,
    ].join("\n");
    expect(issueCodes(validateArchitectureSnapshot(allowed))).not.toContain("iteration-private-sibling-import");

    for (const [path, imported] of [
      ["06-iteration/index.mjs", "../03-framed-image/internal/text_frame.mjs"],
      ["06-iteration/index.mjs", "../04-pure-image/internal/private.mjs"],
      ["06-iteration/index.mjs", "../05-delivery/internal/notes_runtime.mjs"],
    ]) {
      const snapshot = canonicalSnapshot();
      snapshot.files[path] = `import "${imported}";`;
      if (imported.includes("03-framed-image/internal/text_frame")) snapshot.files["03-framed-image/internal/text_frame.mjs"] = "export {};";
      if (imported.includes("04-pure-image/internal/private")) snapshot.files["04-pure-image/internal/private.mjs"] = "export {};";
      if (imported.includes("05-delivery/internal/notes_runtime")) snapshot.files["05-delivery/internal/notes_runtime.mjs"] = "export {};";
      expect(issueCodes(validateArchitectureSnapshot(snapshot)), `${path} -> ${imported}`).toContain("iteration-private-sibling-import");
    }
  });

  it("keeps all PPTX and notes writers under the delivery owner", () => {
    const snapshot = canonicalSnapshot();
    snapshot.files["04-image-production/page-authority/operations.mjs"] = "import PptxGenJS from 'pptxgenjs'; new PptxGenJS();";
    expect(issueCodes(validateArchitectureSnapshot(snapshot))).toContain("second-delivery-owner");
    snapshot.files["06-iteration/index.mjs"] = "injectNotes();";
    expect(issueCodes(validateArchitectureSnapshot(snapshot))).toContain("second-delivery-owner");
  });

  it("keeps the retained generic Image Production adapter bounded to CURRENT v1", () => {
    const snapshot = canonicalSnapshot();
    snapshot.files["04-image-production/page-authority/operations.mjs"] = `const protocol = "page-authority-image2-v2";`;
    expect(issueCodes(validateArchitectureSnapshot(snapshot))).toContain("target-protocol-in-current-compatibility-owner");
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

});
