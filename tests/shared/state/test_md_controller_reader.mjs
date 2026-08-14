import { describe, it, expect } from "vitest";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  METHOD_MODULES,
  buildPlaybookIndex,
  controllerActiveNodeIds,
  controllerDraftRouteNodes,
  controllerNodeIds,
  nodeAppliesToWorkflow,
  parseControllerFile,
  validatePlaybookIndex,
} from "../../../ppt_maker_harness/scripts/shared/state/md_controller_reader.mjs";
import {
  buildResumeCard,
  createInitialState,
  createTargetAuthoringState,
} from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";

const PLAYBOOK_DIR = "ppt_maker_harness/playbook";

const CHECKED_MANIFEST = JSON.parse(readFileSync(join(PLAYBOOK_DIR, "controller-manifest.json"), "utf8"));
export const EXPECTED_CONTROLLER_MANIFEST = Object.freeze(Object.fromEntries(
  Object.entries(CHECKED_MANIFEST.controllers).map(([playbook, value]) => [playbook, value.nodes]),
));

function fixtureDir(tag) {
  const dir = join(tmpdir(), `md_controller_reader_${tag}_${Date.now()}_${Math.random().toString(16).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("MD Controller reader characterization", () => {
  it("parses fenced YAML nodes rather than only document frontmatter", () => {
    const parsed = parseControllerFile(join(PLAYBOOK_DIR, "create-deck.md"));
    expect(parsed.playbook).toBe("create-deck");
    expect(parsed.nodes.map((node) => node.id)).toContain("author-target-page-image-content");
    expect(parsed.nodes.find((node) => node.id === "author-target-page-image-content")?.methodModule).toBe("01-content");
  });

  it("keeps Controller diagnostic recovery bound to producer structured fields", () => {
    const controller = readFileSync(join(PLAYBOOK_DIR, "create-deck.md"), "utf8");
    expect(controller).toContain("[Diagnostic Recovery Handoff](../charter/AGENT_CONTRACT.md#diagnostic-recovery-handoff)");
    expect(controller).toContain("diagnostic.category");
    expect(controller).toContain("diagnostic.next");
    expect(controller).toMatch(/does not recreate a category,\s*action, or recovery route/i);
    expect(controller).toMatch(/shared handoff owns the user explanation/i);
  });

  it("keeps narrative page-plan confirmation conversational and outside State authority", () => {
    const index = buildPlaybookIndex(PLAYBOOK_DIR);
    const sources = index.nodesById.get("author-target-narrative-sources");
    const pageSource = index.nodesById.get("author-target-page-image-content");
    expect(sources).toMatchObject({
      requires: ["checkpoint-intake"],
      exit: [],
    });
    expect(pageSource).toMatchObject({
      requires: ["configure-target-page-image-visual-system"],
      exit: ["slide_specs_exists", "slide_specs_valid"],
    });
    expect(pageSource.steps.map((step) => step.type)).toEqual(["MD", "CLI", "GATE", "CLI"]);
    expect(pageSource.decisions).toEqual([]);

    const state = createTargetAuthoringState("target", "keynote", "dark-executive");
    expect(state.current_node).toBe("author-target-narrative-sources");
    expect(state).not.toHaveProperty("narrative_page_plan");
    expect(state).not.toHaveProperty("narrative_confirmation");
    expect(state).not.toHaveProperty("provider_authorization");
  });

  it("the live MD Controller registry matches the checked-in v3 manifest and validates cleanly", () => {
    const index = buildPlaybookIndex(PLAYBOOK_DIR);
    const result = validatePlaybookIndex(index);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
    const expectedUnique = new Set([CHECKED_MANIFEST.shared_nodes, ...Object.values(EXPECTED_CONTROLLER_MANIFEST)].flat());
    expect(index.nodesById.size).toBe(expectedUnique.size);
    for (const [playbook, ids] of Object.entries(EXPECTED_CONTROLLER_MANIFEST)) {
      expect(controllerNodeIds(index, playbook), playbook).toEqual(ids);
      for (const id of ids) {
        const node = index.nodesById.get(id);
        expect(node, `${playbook}/${id}`).toBeDefined();
        expect(METHOD_MODULES).toContain(node.methodModule);
        expect(Object.keys(node)).not.toContain(["lifecycle", "Phase"].join(""));
        expect(node.steps.length).toBeGreaterThan(0);
      }
    }
  });

  it("registers Page Image as the sole active Image Production controller", () => {
    const index = buildPlaybookIndex(PLAYBOOK_DIR);
    expect(index.controllers.size).toBe(5);
    expect(index.controllers.has("production-mode-transition")).toBe(false);
    expect(index.controllers.has("image2-refine")).toBe(false);
    expect(index.controllers.get("create-deck").supportedPipelines).toEqual([
      "page-image-workflow",
    ]);
  });

  it("uses adapter and selected-workflow declarations for Image Production legality", () => {
    const index = buildPlaybookIndex(PLAYBOOK_DIR);
    const pageImage = index.nodesById.get("generate-target-framed-pilot");
    expect(pageImage).toMatchObject({ methodModule: "03-framed-image", adapter: "page-image-workflow", productionWorkflows: ["framed"] });
    expect(nodeAppliesToWorkflow(pageImage, "framed")).toBe(true);
    expect(nodeAppliesToWorkflow(pageImage, "pure")).toBe(false);
  });

  it("projects one bound target workflow through 03 XOR 04, then common delivery and iteration", () => {
    const index = buildPlaybookIndex(PLAYBOOK_DIR);
    const framed = controllerActiveNodeIds(index, "create-deck", "framed");
    const pure = controllerActiveNodeIds(index, "create-deck", "pure");
    const unresolved = controllerActiveNodeIds(index, "create-deck");

    expect(unresolved).toEqual([
      "checkpoint-intake",
      "author-target-narrative-sources",
      "select-target-page-image-workflow",
    ]);
    expect(framed).toEqual([
      "checkpoint-intake",
      "author-target-narrative-sources",
      "select-target-page-image-workflow",
      "configure-target-page-image-visual-system",
      "author-target-page-image-content",
      "inspect-target-framed-style-master",
      "plan-target-framed-style-master",
      "authorize-target-framed-style-master",
      "generate-target-framed-style-master",
      "abandon-target-framed-style-master",
      "review-target-framed-style-master",
      "promote-target-framed-style-master",
      "plan-target-framed-progressive-raw",
      "recommend-target-framed-pilot",
      "authorize-target-framed-pilot",
      "generate-target-framed-pilot",
      "review-target-framed-pilot",
      "plan-target-framed-expansion",
      "authorize-target-framed-expansion",
      "generate-target-framed-expansion",
      "review-target-framed-raw",
      "publish-target-framed-final-manifest",
      "deliver-target-page-image",
      "review-target-page-image-delivery",
      "complete-target-page-image-iteration",
    ]);
    expect(pure).toEqual([
      "checkpoint-intake",
      "author-target-narrative-sources",
      "select-target-page-image-workflow",
      "configure-target-page-image-visual-system",
      "author-target-page-image-content",
      "inspect-target-pure-style-master",
      "plan-target-pure-style-master",
      "authorize-target-pure-style-master",
      "generate-target-pure-style-master",
      "abandon-target-pure-style-master",
      "review-target-pure-style-master",
      "promote-target-pure-style-master",
      "plan-target-pure-progressive-raw",
      "recommend-target-pure-pilot",
      "authorize-target-pure-pilot",
      "generate-target-pure-pilot",
      "review-target-pure-pilot",
      "plan-target-pure-expansion",
      "authorize-target-pure-expansion",
      "generate-target-pure-expansion",
      "review-target-pure-raw",
      "publish-target-pure-final-manifest",
      "deliver-target-page-image",
      "review-target-page-image-delivery",
      "complete-target-page-image-iteration",
    ]);
    expect(framed).not.toContain("authorize-target-pure-pilot");
    expect(pure).not.toContain("authorize-target-framed-pilot");
    expect(framed).not.toContain("inspect-target-pure-style-master");
    expect(pure).not.toContain("inspect-target-framed-style-master");
    expect(controllerDraftRouteNodes(index, "create-deck", "framed")).toEqual([
      "author-target-narrative-sources",
      "select-target-page-image-workflow",
      "configure-target-page-image-visual-system",
      "author-target-page-image-content",
      "inspect-target-framed-style-master",
      "plan-target-framed-style-master",
      "authorize-target-framed-style-master",
      "generate-target-framed-style-master",
      "abandon-target-framed-style-master",
      "review-target-framed-style-master",
      "promote-target-framed-style-master",
      "plan-target-framed-progressive-raw",
    ]);
    expect(controllerDraftRouteNodes(index, "create-deck", "pure")).toEqual([
      "author-target-narrative-sources",
      "select-target-page-image-workflow",
      "configure-target-page-image-visual-system",
      "author-target-page-image-content",
      "inspect-target-pure-style-master",
      "plan-target-pure-style-master",
      "authorize-target-pure-style-master",
      "generate-target-pure-style-master",
      "abandon-target-pure-style-master",
      "review-target-pure-style-master",
      "promote-target-pure-style-master",
      "plan-target-pure-progressive-raw",
    ]);

    expect(controllerActiveNodeIds(index, "edit-text", "framed")).toEqual([
      "classify-change",
      "refresh-target-framed-text",
      "review-target-text-delivery",
    ]);
    expect(controllerActiveNodeIds(index, "edit-text", "pure")).toEqual([
      "classify-change",
      "refresh-target-pure-text",
      "review-target-text-delivery",
    ]);
    expect(controllerActiveNodeIds(index, "edit-notes", "framed")).toEqual([
      "classify-change",
      "refresh-target-speaker-notes",
      "verify-target-speaker-notes",
    ]);

    const framedNode = index.nodesById.get("authorize-target-framed-pilot");
    expect(nodeAppliesToWorkflow(framedNode, "framed")).toBe(true);
    expect(nodeAppliesToWorkflow(framedNode, "pure")).toBe(false);

    const state = createInitialState("target", "keynote", "dark", {
      workflow: "framed",
    });
    const card = buildResumeCard(state, null, { index, ctx: { runVersion: "v1" } });
    expect(card.pending_nodes).toEqual(framed);
    const mismatched = buildResumeCard(state, null, {
      index,
      ctx: { runVersion: "v1", productionWorkflow: "pure" },
    });
    expect(mismatched.pending_nodes).toEqual(unresolved);
  });

  it("rejects undeclared Controller metadata before indexing or draft routing", () => {
    const declarations = [
      ["controller", "---\nplaybook: bad\nsupported_pipelines: [page-image-workflow]\nincludes: []\nunknown_key: true\n---\n", "unsupported Controller frontmatter key unknown_key"],
      ["shared", "---\nnode: shared-node\nmethod_module: 01-content\nphase: 04\nrequires: []\nentry: []\nexit: []\nshared: true\n---\n\n**Step 1 — MD**: read\n", "unsupported shared-node frontmatter key phase"],
      ["lifecycle", "---\nplaybook: bad\nsupported_pipelines: [page-image-workflow]\nincludes: []\n---\n\n```yaml\nnode: fenced-node\nmethod_module: 01-content\nlifecycle_phase: 01\nrequires: []\nentry: []\nexit: []\n```\n\n**Step 1 — MD**: read\n", "unsupported fenced-node frontmatter key lifecycle_phase"],
      ["retired-mode", "---\nplaybook: bad\nsupported_pipelines: [page-image-workflow]\nincludes: []\n---\n\n```yaml\nnode: fenced-node\nmethod_module: 01-content\nproduction_modes: [image2-page-workflow]\nrequires: []\nentry: []\nexit: []\n```\n\n**Step 1 — MD**: read\n", "unsupported fenced-node frontmatter key production_modes"],
      ["duplicate", "---\nplaybook: bad\nsupported_pipelines: [page-image-workflow]\nincludes: []\n---\n\n```yaml\nnode: fenced-node\nmethod_module: 01-content\nrequires: []\nentry: []\nexit: []\nexit: []\n```\n\n**Step 1 — MD**: read\n", "Map keys must be unique"],
    ];
    for (const [name, source, expected] of declarations) {
      const dir = fixtureDir(`closed-${name}`);
      const path = join(dir, "bad.md");
      try {
        writeFileSync(path, source);
        const parsed = parseControllerFile(path);
        expect(parsed.errors.some((error) => error.includes(expected))).toBe(true);
        expect(parsed.nodes).toEqual([]);
        const index = buildPlaybookIndex(dir);
        expect(index.nodesById.size).toBe(0);
        expect(controllerDraftRouteNodes(index, "bad", "framed")).toEqual([]);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it("preserves target module adapter and workflow ownership checks", () => {
    const dir = fixtureDir("target-ownership");
    try {
      writeFileSync(join(dir, "ownership.md"), `---\nplaybook: ownership\nsupported_pipelines: [page-image-workflow]\nincludes: []\n---\n\n\`\`\`yaml\nnode: target-without-owner-contract\nmethod_module: 03-framed-image\nproduction_workflows: [pure]\nrequires: []\nentry: []\nexit: []\n\`\`\`\n\n**Step 1 — MD**: route\n`);
      const result = validatePlaybookIndex(buildPlaybookIndex(dir));
      expect(result.errors.some((error) => error.rule === "image-production-adapter")).toBe(true);
      expect(result.errors.some((error) => error.rule === "production-workflows")).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("accepts only manifest-owned literal draft_route declarations", () => {
    const dir = fixtureDir("draft-route");
    const controller = [
      "---",
      "playbook: create-deck",
      "supported_pipelines: [page-image-workflow]",
      "includes: []",
      "---",
      "",
      "```yaml",
      "node: select-target-page-image-workflow",
      "method_module: 01-content",
      "draft_route: true",
      "requires: []",
      "entry: []",
      "exit: []",
      "```",
      "",
      "**Step 1 — MD**: route",
      "",
    ].join("\n");
    try {
      writeFileSync(join(dir, "create-deck.md"), controller);
      writeFileSync(join(dir, "controller-manifest.json"), JSON.stringify({
        schema: "pptmaker-controller-manifest",
        shared_nodes: [],
        controllers: {
          "create-deck": {
            supported_pipelines: ["page-image-workflow"],
            nodes: ["select-target-page-image-workflow"],
            draft_route_nodes: {
              framed: ["select-target-page-image-workflow"],
              pure: ["select-target-page-image-workflow"],
            },
          },
        },
      }));
      const index = buildPlaybookIndex(dir);
      expect(validatePlaybookIndex(index)).toMatchObject({ valid: true });
      expect(controllerDraftRouteNodes(index, "create-deck", "framed")).toEqual(["select-target-page-image-workflow"]);
      expect(controllerDraftRouteNodes(index, "create-deck", null)).toEqual(["select-target-page-image-workflow"]);

      const manifest = JSON.parse(readFileSync(join(dir, "controller-manifest.json"), "utf8"));
      manifest.controllers["create-deck"].draft_route_nodes.pure = ["unknown-node"];
      writeFileSync(join(dir, "controller-manifest.json"), JSON.stringify(manifest));
      const mismatched = buildPlaybookIndex(dir);
      expect(validatePlaybookIndex(mismatched).errors.some((error) => error.rule === "draft-route")).toBe(true);
      expect(controllerDraftRouteNodes(mismatched, "create-deck", "pure")).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects noncanonical and duplicate draft_route YAML forms before routing", () => {
    const controllerLines = (value, duplicate = false) => [
      "---",
      "playbook: create-deck",
      "supported_pipelines: [page-image-workflow]",
      "includes: []",
      "---",
      "",
      "```yaml",
      "node: select-target-page-image-workflow",
      "method_module: 01-content",
      `draft_route: ${value}`,
      ...(duplicate ? [`draft_route: ${value}`] : []),
      "requires: []",
      "entry: []",
      "exit: []",
      "```",
      "",
      "**Step 1 — MD**: route",
      "",
    ].join("\n");
    for (const value of ["false", "\"true\"", "1", "null"]) {
      const dir = fixtureDir(`draft-route-${value.replace(/[^a-z0-9]/gi, "") || "null"}`);
      try {
        writeFileSync(join(dir, "create-deck.md"), controllerLines(value));
        expect(validatePlaybookIndex(buildPlaybookIndex(dir)).errors.some((error) => error.rule === "parse")).toBe(true);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }
    const duplicate = fixtureDir("draft-route-duplicate");
    try {
      writeFileSync(join(duplicate, "create-deck.md"), controllerLines("true", true));
      expect(validatePlaybookIndex(buildPlaybookIndex(duplicate)).errors.some((error) => error.rule === "parse")).toBe(true);
    } finally {
      rmSync(duplicate, { recursive: true, force: true });
    }
  });
});
