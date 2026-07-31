import { describe, it, expect } from "vitest";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  METHOD_MODULES,
  buildPlaybookIndex,
  controllerActiveNodeIds,
  controllerNodeIds,
  nodeAppliesToMode,
  nodeAppliesToWorkflow,
  parseControllerFile,
  validatePlaybookIndex,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/md_controller_reader.mjs";
import {
  buildResumeCard,
  createInitialState,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

const PLAYBOOK_DIR = "PPTMAKER_FRAMEWORK/playbook";

const CHECKED_MANIFEST = JSON.parse(readFileSync(join(PLAYBOOK_DIR, "controller-manifest-v3.json"), "utf8"));
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
    expect(parsed.nodes.map((node) => node.id)).toContain("author-target-page-authority-content");
    expect(parsed.nodes.find((node) => node.id === "author-target-page-authority-content")?.methodModule).toBe("01-content");
  });

  it("keeps Controller diagnostic recovery bound to producer structured fields", () => {
    const controller = readFileSync(join(PLAYBOOK_DIR, "create-deck.md"), "utf8");
    expect(controller).toMatch(/final\s+nonempty stderr JSON\s+envelope/);
    expect(controller).toContain("diagnostic.category");
    expect(controller).toContain("diagnostic.next");
    expect(controller).toMatch(/not explanatory prose/i);
    expect(controller).not.toMatch(/code\s*\+\s*hint.*decide the next repair/i);
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

  it("registers Page Authority as the sole active Image Production controller", () => {
    const index = buildPlaybookIndex(PLAYBOOK_DIR);
    expect(index.controllers.size).toBe(5);
    expect(index.controllers.has("production-mode-transition")).toBe(false);
    expect(index.controllers.has("image2-refine")).toBe(false);
    expect(index.controllers.get("create-deck").supportedPipelines).toEqual([
      "page-authority-image2-v2",
    ]);
  });

  it("uses adapter mode declarations rather than numeric module order for Image Production legality", () => {
    const index = buildPlaybookIndex(PLAYBOOK_DIR);
    const pageAuthority = index.nodesById.get("generate-target-framed-raw");
    const createDeck = index.controllers.get("create-deck");
    expect(pageAuthority).toMatchObject({ lifecyclePhase: "4", methodModule: "03-framed-image", adapter: "page-authority-image2-v2", productionModes: ["image2-page-authority-v2"] });
    expect(nodeAppliesToMode(pageAuthority, createDeck.supportedProductionModes, "image2-page-authority-v2")).toBe(true);
    expect(nodeAppliesToMode(pageAuthority, createDeck.supportedProductionModes, "unsupported-mode")).toBe(false);
  });

  it("projects one bound target workflow through 03 XOR 04, then common delivery and iteration", () => {
    const index = buildPlaybookIndex(PLAYBOOK_DIR);
    const framed = controllerActiveNodeIds(index, "create-deck", "image2-page-authority-v2", "framed");
    const pure = controllerActiveNodeIds(index, "create-deck", "image2-page-authority-v2", "pure");
    const unresolved = controllerActiveNodeIds(index, "create-deck", "image2-page-authority-v2");

    expect(unresolved).toEqual(["checkpoint-intake", "select-target-page-authority-workflow"]);
    expect(framed).toEqual([
      "checkpoint-intake",
      "select-target-page-authority-workflow",
      "author-target-page-authority-content",
      "configure-target-page-authority-visual-system",
      "authorize-target-framed-raw",
      "generate-target-framed-raw",
      "review-target-framed-raw",
      "publish-target-framed-final-manifest",
      "deliver-target-page-authority",
      "review-target-page-authority-delivery",
      "complete-target-page-authority-iteration",
    ]);
    expect(pure).toEqual([
      "checkpoint-intake",
      "select-target-page-authority-workflow",
      "author-target-page-authority-content",
      "configure-target-page-authority-visual-system",
      "authorize-target-pure-raw",
      "generate-target-pure-raw",
      "review-target-pure-raw",
      "publish-target-pure-final-manifest",
      "deliver-target-page-authority",
      "review-target-page-authority-delivery",
      "complete-target-page-authority-iteration",
    ]);
    expect(framed).not.toContain("authorize-target-pure-raw");
    expect(pure).not.toContain("authorize-target-framed-raw");

    expect(controllerActiveNodeIds(index, "edit-text", "image2-page-authority-v2", "framed")).toEqual([
      "classify-change",
      "refresh-target-framed-text",
      "review-target-text-delivery",
    ]);
    expect(controllerActiveNodeIds(index, "edit-text", "image2-page-authority-v2", "pure")).toEqual([
      "classify-change",
      "refresh-target-pure-text",
      "review-target-text-delivery",
    ]);
    expect(controllerActiveNodeIds(index, "edit-notes", "image2-page-authority-v2", "framed")).toEqual([
      "classify-change",
      "refresh-target-speaker-notes",
      "verify-target-speaker-notes",
    ]);

    const framedNode = index.nodesById.get("authorize-target-framed-raw");
    expect(nodeAppliesToWorkflow(framedNode, "framed")).toBe(true);
    expect(nodeAppliesToWorkflow(framedNode, "pure")).toBe(false);

    const state = createInitialState("target", "keynote", "dark", {
      mode: "image2-page-authority-v2",
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
      expect(result.errors.some((error) => error.rule === "legacy-phase")).toBe(true);
      expect(result.errors.some((error) => error.rule === "phase4-ownership")).toBe(true);
      expect(result.errors.some((error) => error.rule === "duplicate-id")).toBe(true);
      expect(result.errors.some((error) => error.rule === "steps")).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
