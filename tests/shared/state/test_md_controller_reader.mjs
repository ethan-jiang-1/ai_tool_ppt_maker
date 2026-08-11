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
  nodeAppliesToMode,
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
        expect(node.lifecyclePhase).toMatch(/^(0|1|2|3|4|5)$/);
        expect(METHOD_MODULES).toContain(node.methodModule);
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

  it("uses adapter mode declarations rather than numeric module order for Image Production legality", () => {
    const index = buildPlaybookIndex(PLAYBOOK_DIR);
    const pageImage = index.nodesById.get("generate-target-framed-pilot");
    const createDeck = index.controllers.get("create-deck");
    expect(pageImage).toMatchObject({ lifecyclePhase: "4", methodModule: "03-framed-image", adapter: "page-image-workflow", productionModes: ["image2-page-workflow"] });
    expect(nodeAppliesToMode(pageImage, createDeck.supportedProductionModes, "image2-page-workflow")).toBe(true);
    expect(nodeAppliesToMode(pageImage, createDeck.supportedProductionModes, "unsupported-mode")).toBe(false);
  });

  it("projects one bound target workflow through 03 XOR 04, then common delivery and iteration", () => {
    const index = buildPlaybookIndex(PLAYBOOK_DIR);
    const framed = controllerActiveNodeIds(index, "create-deck", "image2-page-workflow", "framed");
    const pure = controllerActiveNodeIds(index, "create-deck", "image2-page-workflow", "pure");
    const unresolved = controllerActiveNodeIds(index, "create-deck", "image2-page-workflow");

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

    expect(controllerActiveNodeIds(index, "edit-text", "image2-page-workflow", "framed")).toEqual([
      "classify-change",
      "refresh-target-framed-text",
      "review-target-text-delivery",
    ]);
    expect(controllerActiveNodeIds(index, "edit-text", "image2-page-workflow", "pure")).toEqual([
      "classify-change",
      "refresh-target-pure-text",
      "review-target-text-delivery",
    ]);
    expect(controllerActiveNodeIds(index, "edit-notes", "image2-page-workflow", "framed")).toEqual([
      "classify-change",
      "refresh-target-speaker-notes",
      "verify-target-speaker-notes",
    ]);

    const framedNode = index.nodesById.get("authorize-target-framed-pilot");
    expect(nodeAppliesToWorkflow(framedNode, "framed")).toBe(true);
    expect(nodeAppliesToWorkflow(framedNode, "pure")).toBe(false);

    const state = createInitialState("target", "keynote", "dark", {
      mode: "image2-page-workflow",
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

  it("rejects undeclared decisions, reserved ids, impossible ordering, and dependency cycles", () => {
    const dir = fixtureDir("invalid");
    try {
      writeFileSync(join(dir, "bad.md"), `---\nplaybook: bad\nincludes: []\n---\n\n\`\`\`yaml\nnode: header-review\nlifecycle_phase: 4\nmethod_module: 05-iteration\nrequires: [later]\nentry: [node_status:header-review:completed]\nexit: [user_decision_recorded]\ndecisions: [yes]\n\`\`\`\n\n**Step 1 — GATE**: choose\n\n\`\`\`yaml\nnode: later\nphase: 04\nrequires: [header-review]\nentry: [node_decision:header-review:no]\nexit: []\n\`\`\`\n\n## Step 1 — MD\nlater\n`);
      writeFileSync(join(dir, "duplicate.md"), `---\nplaybook: duplicate\nincludes: []\n---\n\n\`\`\`yaml\nnode: later\nlifecycle_phase: 4\nmethod_module: 05-iteration\nrequires: []\nentry: []\nexit: []\n\`\`\`\n\n**Step 1 — MD**: duplicate\n`);
      const result = validatePlaybookIndex(buildPlaybookIndex(dir));
      expect(result.valid).toBe(false);
      expect(result.errors.some((error) => error.rule === "requires-order")).toBe(true);
      expect(result.errors.some((error) => error.rule === "dependency-cycle")).toBe(true);
      expect(result.errors.some((error) => error.rule === "decision-value")).toBe(true);
      expect(result.errors.some((error) => error.rule === "self-entry")).toBe(true);
      expect(result.errors.some((error) => error.rule === "unsupported-phase")).toBe(true);
      expect(result.errors.some((error) => error.rule === "phase4-ownership")).toBe(true);
      expect(result.errors.some((error) => error.rule === "duplicate-id")).toBe(true);
      expect(result.errors.some((error) => error.rule === "steps")).toBe(true);
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
      "lifecycle_phase: 1",
      "method_module: 01-content",
      "production_modes: [image2-page-workflow]",
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
      "lifecycle_phase: 1",
      "method_module: 01-content",
      "production_modes: [image2-page-workflow]",
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
        expect(validatePlaybookIndex(buildPlaybookIndex(dir)).errors.some((error) => error.rule === "draft-route")).toBe(true);
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
