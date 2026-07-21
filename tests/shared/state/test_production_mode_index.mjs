import { describe, it, expect } from "vitest";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  buildPlaybookIndex,
  validatePlaybookIndex,
  controllerSupportedModes,
  controllerActiveNodeIds,
  controllerNodeIds,
  nodeAppliesToMode,
  SUPPORTED_PRODUCTION_MODES,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/md_controller_reader.mjs";

const LIVE_PLAYBOOK_DIR = "PPTMAKER_FRAMEWORK/playbook";

function fixtureDir(tag) {
  return mkdtempSync(join(tmpdir(), `pmode_index_${tag}_`));
}

function controllerFile({ playbook, pipelines, modes, nodes }) {
  const fm = [
    "---",
    `playbook: ${playbook}`,
    "includes: []",
    "supported_pipelines:",
    ...pipelines.map((p) => `  - ${p}`),
    ...(modes && modes.length ? ["supported_production_modes:", ...modes.map((m) => `  - ${m}`)] : []),
    "---",
    "",
  ].join("\n");
  const blocks = nodes.map((n) => {
    const fields = [
      `node: ${n.id}`,
      `lifecycle_phase: "${n.phase || "0"}"`,
      `method_module: "${n.module || "00-setup"}"`,
      "requires: []",
      "entry: []",
      "exit: []",
      ...(n.modes && n.modes.length ? ["production_modes:", ...n.modes.map((m) => `  - ${m}`)] : []),
    ].join("\n");
    return "```yaml\n" + fields + "\n```\n\n**Step 1 — MD**: " + n.id + "\n";
  }).join("\n");
  return `${fm}\n${blocks}`;
}

function buildFixture(tag, spec) {
  const dir = fixtureDir(tag);
  writeFileSync(join(dir, `${spec.playbook}.md`), controllerFile(spec), "utf8");
  return buildPlaybookIndex(dir);
}

describe("production-mode index declarations (1.8)", () => {
  it("the live playbook registry still validates cleanly with mode-aware rules", () => {
    const index = buildPlaybookIndex(LIVE_PLAYBOOK_DIR);
    const result = validatePlaybookIndex(index);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("controllerSupportedModes derives from pipelines when undeclared", () => {
    const html = buildFixture("derive-html", { playbook: "c-html", pipelines: ["html-first-v1"], nodes: [{ id: "n1" }] });
    expect(controllerSupportedModes(html.controllers.get("c-html")).sort()).toEqual(["html-only", "html-then-image2"]);
    const img = buildFixture("derive-img", { playbook: "c-img", pipelines: ["legacy-image2-first"], nodes: [{ id: "n1" }] });
    expect(controllerSupportedModes(img.controllers.get("c-img"))).toEqual(["image2-only"]);
  });

  it("controllerSupportedModes honors an explicit declaration", () => {
    const idx = buildFixture("declared", { playbook: "c-dec", pipelines: ["html-first-v1"], modes: ["html-only"], nodes: [{ id: "n1" }] });
    expect(controllerSupportedModes(idx.controllers.get("c-dec"))).toEqual(["html-only"]);
  });

  it("controllerActiveNodeIds filters nodes by the exact mode while retaining unrestricted nodes", () => {
    const idx = buildFixture("filter", {
      playbook: "c-filter",
      pipelines: ["html-first-v1"],
      nodes: [{ id: "always-on" }, { id: "html-only-node", modes: ["html-only"] }],
    });
    expect(controllerActiveNodeIds(idx, "c-filter", "html-only").sort()).toEqual(["always-on", "html-only-node"]);
    expect(controllerActiveNodeIds(idx, "c-filter", "html-then-image2")).toEqual(["always-on"]);
    // Unfiltered still returns all.
    expect(controllerNodeIds(idx, "c-filter").sort()).toEqual(["always-on", "html-only-node"]);
  });

  it("returns an empty active set when the controller does not own the mode", () => {
    const idx = buildFixture("not-owned", { playbook: "c-no", pipelines: ["html-first-v1"], nodes: [{ id: "n1" }] });
    expect(controllerActiveNodeIds(idx, "c-no", "image2-only")).toEqual([]);
  });

  it("nodeAppliesToMode treats an absent restriction as applicable to every supported mode", () => {
    const node = { productionModes: [] };
    for (const mode of SUPPORTED_PRODUCTION_MODES) {
      expect(nodeAppliesToMode(node, [...SUPPORTED_PRODUCTION_MODES], mode)).toBe(true);
    }
    expect(nodeAppliesToMode({ productionModes: ["html-only"] }, [...SUPPORTED_PRODUCTION_MODES], "image2-only")).toBe(false);
  });

  it("validatePlaybookIndex rejects an unsupported production mode", () => {
    const dir = fixtureDir("bad-mode");
    try {
      writeFileSync(join(dir, "c.md"), controllerFile({ playbook: "c", pipelines: ["html-first-v1"], modes: ["html"], nodes: [{ id: "n1" }] }), "utf8");
      const result = validatePlaybookIndex(buildPlaybookIndex(dir));
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.rule === "supported-production-modes")).toBe(true);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it("validatePlaybookIndex rejects a mode incompatible with supported_pipelines", () => {
    const dir = fixtureDir("bad-compat");
    try {
      writeFileSync(join(dir, "c.md"), controllerFile({ playbook: "c", pipelines: ["legacy-image2-first"], modes: ["html-only"], nodes: [{ id: "n1" }] }), "utf8");
      const result = validatePlaybookIndex(buildPlaybookIndex(dir));
      expect(result.errors.some((e) => e.rule === "supported-production-modes" && /incompatible/.test(e.message))).toBe(true);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it("validatePlaybookIndex rejects a node mode outside controller ownership", () => {
    const dir = fixtureDir("bad-node-mode");
    try {
      writeFileSync(join(dir, "c.md"), controllerFile({ playbook: "c", pipelines: ["html-first-v1"], nodes: [{ id: "n1", modes: ["image2-only"] }] }), "utf8");
      const result = validatePlaybookIndex(buildPlaybookIndex(dir));
      expect(result.errors.some((e) => e.rule === "production-modes" && /outside controller ownership/.test(e.message))).toBe(true);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
