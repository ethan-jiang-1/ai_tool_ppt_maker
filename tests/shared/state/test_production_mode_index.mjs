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

  it("models distinct first-class Image2, local HTML, and required-refinement create-deck branches", () => {
    const index = buildPlaybookIndex(LIVE_PLAYBOOK_DIR);
    const htmlOnly = new Set(controllerActiveNodeIds(index, "create-deck", "html-only"));
    const htmlThenImage2 = new Set(controllerActiveNodeIds(index, "create-deck", "html-then-image2"));
    const image2Only = new Set(controllerActiveNodeIds(index, "create-deck", "image2-only"));
    const pageAuthority = new Set(controllerActiveNodeIds(index, "create-deck", "image2-page-authority"));

    for (const node of [
      "author-structured-content",
      "produce-html-deck",
      "checkpoint-final-review",
      "readiness",
      "final",
    ]) {
      expect(htmlOnly.has(node)).toBe(true);
    }
    expect(htmlOnly.has("handoff-to-image2-refinement")).toBe(false);
    expect(htmlOnly.has("author-whole-page-content")).toBe(false);

    expect(htmlThenImage2.has("produce-html-deck")).toBe(true);
    expect(htmlThenImage2.has("handoff-to-image2-refinement")).toBe(true);
    expect(htmlThenImage2.has("readiness")).toBe(false);
    expect(htmlThenImage2.has("final")).toBe(false);

    for (const node of [
      "author-whole-page-content",
      "generate-image2-style-master",
      "pilot-image2-pages",
      "checkpoint-image2-final-review",
      "final-image2",
    ]) {
      expect(image2Only.has(node)).toBe(true);
    }
    expect(image2Only.has("produce-html-deck")).toBe(false);
    expect(image2Only.has("handoff-to-image2-refinement")).toBe(false);

    for (const node of [
      "author-page-authority-content",
      "authorize-page-authority-raw",
      "review-page-authority-raw",
      "finalize-page-authority-delivery",
      "checkpoint-page-authority-delivery-review",
      "final-page-authority",
    ]) {
      expect(pageAuthority.has(node)).toBe(true);
    }
    expect(pageAuthority.has("produce-html-deck")).toBe(false);
    expect(pageAuthority.has("generate-image2-style-master")).toBe(false);
    expect(pageAuthority.has("handoff-to-image2-refinement")).toBe(false);
    expect(controllerActiveNodeIds(index, "image2-refine", "html-only")).toEqual([]);
    expect(controllerActiveNodeIds(index, "image2-refine", "image2-only")).toEqual([]);
    expect(controllerActiveNodeIds(index, "image2-refine", "html-then-image2")).toHaveLength(4);
  });

  it("keeps Page Authority's controller surface disjoint from every legacy production stage", () => {
    const index = buildPlaybookIndex(LIVE_PLAYBOOK_DIR);
    const pageAuthority = new Set(controllerActiveNodeIds(index, "create-deck", "image2-page-authority"));
    for (const legacyNode of [
      "author-structured-content",
      "configure-visual-system",
      "preview-content",
      "review-content",
      "review-visual",
      "produce-html-deck",
      "author-whole-page-content",
      "configure-whole-page-visual-system",
      "generate-image2-style-master",
      "pilot-image2-pages",
      "review-image2-header",
      "produce-image2-deck",
      "handoff-to-image2-refinement",
    ]) {
      expect(pageAuthority, legacyNode).not.toContain(legacyNode);
    }
  });

  it("controllerSupportedModes derives from pipelines when undeclared", () => {
    const html = buildFixture("derive-html", { playbook: "c-html", pipelines: ["html-first-v1"], nodes: [{ id: "n1" }] });
    expect(controllerSupportedModes(html.controllers.get("c-html")).sort()).toEqual(["html-only", "html-then-image2"]);
    const img = buildFixture("derive-img", { playbook: "c-img", pipelines: ["whole-page-image2-v1"], nodes: [{ id: "n1" }] });
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
      writeFileSync(join(dir, "c.md"), controllerFile({ playbook: "c", pipelines: ["whole-page-image2-v1"], modes: ["html-only"], nodes: [{ id: "n1" }] }), "utf8");
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
