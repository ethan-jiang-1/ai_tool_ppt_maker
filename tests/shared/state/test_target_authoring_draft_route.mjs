import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  SLIDE_SPECS_NAME,
  initBundle,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  buildPlaybookIndex,
  controllerDraftRouteNodes,
  validatePlaybookIndex,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/md_controller_reader.mjs";
import { readState, writeState } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import { resolveTargetAuthoringDraftRoute } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/target_authoring_draft_route.mjs";

function controllerNode(id, { workflow = null, draftRoute = false } = {}) {
  return [
    "```yaml",
    `node: ${id}`,
    "lifecycle_phase: 1",
    "method_module: 01-content",
    "production_modes: [image2-page-authority-v2]",
    ...(workflow ? [`production_workflows: [${workflow}]`] : []),
    ...(draftRoute ? ["draft_route: true"] : []),
    "requires: []",
    "entry: []",
    "exit: []",
    "```",
    "",
    "**Step 1 \u2014 MD**: route",
    "",
  ].join("\n");
}

function writePlaybook(playbookDir) {
  mkdirSync(playbookDir, { recursive: true });
  writeFileSync(join(playbookDir, "create-deck.md"), [
    "---",
    "playbook: create-deck",
    "supported_pipelines: [page-authority-image2-v2]",
    "includes: []",
    "---",
    "",
    controllerNode("select-target-page-authority-workflow", { draftRoute: true }),
    controllerNode("author-target-page-authority-content", { workflow: "framed", draftRoute: true }),
    controllerNode("authorize-target-pure-raw", { workflow: "pure", draftRoute: true }),
    controllerNode("generate-target-framed-raw", { workflow: "framed" }),
  ].join("\n"));
  writeFileSync(join(playbookDir, "controller-manifest-v3.json"), JSON.stringify({
    schema: "pptmaker-controller-manifest-v3",
    shared_nodes: [],
    controllers: {
      "create-deck": {
        supported_pipelines: ["page-authority-image2-v2"],
        nodes: ["select-target-page-authority-workflow", "author-target-page-authority-content", "authorize-target-pure-raw", "generate-target-framed-raw"],
        draft_route_nodes: {
          framed: ["select-target-page-authority-workflow", "author-target-page-authority-content"],
          pure: ["select-target-page-authority-workflow", "authorize-target-pure-raw"],
        },
      },
    },
  }));
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "target-authoring-draft-route-"));
  const deck = join(root, "deck_fixture");
  const runDir = join(deck, "3_versions", "v1");
  const playbookDir = join(root, "playbook");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(runDir, SLIDE_SPECS_NAME), [
    "---",
    "production:",
    "  pipeline: page-authority-image2-v2",
    "  workflow: framed",
    "---",
    "",
    "## Slide 01: `DeckGo`",
    "",
    "**TITLE**: Draft route fixture",
  ].join("\n"));
  writePlaybook(playbookDir);
  return { root, deck, runDir, playbookDir };
}

function frameworkFixture(workflow) {
  const root = mkdtempSync(join(tmpdir(), `target-authoring-framework-${workflow}-`));
  const deck = join(root, "deck_framework_fixture");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(runDir, SLIDE_SPECS_NAME), [
    "---",
    "identity:",
    "  scheme: mnemonic-v1",
    "production:",
    "  pipeline: page-authority-image2-v2",
    `  workflow: ${workflow}`,
    "---",
    "",
    "## Slide 01: `DeckGo`",
    "",
    "**TITLE**: Framework draft route fixture",
    "**VISUAL BRIEF**:",
    "```yaml",
    "recipe: editorial-systems",
    "composition: centered-constellation",
    "motifs: []",
    "negative_constraints:",
    ...(workflow === "framed" ? ["  - no-readable-text", "  - no-labels"] : ["  - no-logo"]),
    "```",
  ].join("\n"));
  return { root, deck, runDir };
}

function setFrameworkDraft(value, { currentNode, workflow = "framed", playbook = "create-deck" } = {}) {
  const source = [
    "---",
    "production:",
    "  pipeline: page-authority-image2-v2",
    ...(workflow ? [`  workflow: ${workflow}`] : []),
    "---",
    "",
    "## Slide 01: `DeckGo`",
    "",
    "**TITLE**: Pending workflow fixture",
  ].join("\n");
  writeFileSync(join(value.runDir, SLIDE_SPECS_NAME), source);
  const state = readState(value.deck, { purpose: "observe", runDir: value.runDir });
  state.playbook = playbook;
  state.run_version = "v1";
  state.current_node = currentNode;
  delete state.production_mode;
  writeState(value.deck, state);
}

function setDraftState(fixtureValue, { currentNode = "author-target-page-authority-content", playbook = "create-deck", bound = false } = {}) {
  const state = readState(fixtureValue.deck, { purpose: "observe", runDir: fixtureValue.runDir });
  state.playbook = playbook;
  state.run_version = "v1";
  state.current_node = currentNode;
  if (bound) {
    state.production_mode = {
      by_version: {
        "3_versions/v1": {
          mode: "image2-page-authority-v2",
          workflow: "framed",
          source_epoch: 1,
        },
      },
    };
  }
  writeState(fixtureValue.deck, state);
}

describe("target authoring draft route", () => {
  it("uses only a validated selected-workflow manifest route", () => {
    const value = fixture();
    const rejected = [];
    const freshRejectedFixture = (options) => {
      const candidate = fixture();
      rejected.push(candidate);
      setDraftState(candidate, options);
      return candidate;
    };
    try {
      setDraftState(value);
      const index = buildPlaybookIndex(value.playbookDir);
      expect(validatePlaybookIndex(index)).toMatchObject({ valid: true });
      expect(controllerDraftRouteNodes(index, "create-deck", "framed")).toEqual(["select-target-page-authority-workflow", "author-target-page-authority-content"]);
      expect(readState(value.deck, { purpose: "observe", runDir: value.runDir })).toMatchObject({
        pipeline: "page-authority-image2-v2",
        playbook: "create-deck",
        run_version: "v1",
        current_node: "author-target-page-authority-content",
      });
      expect(resolveTargetAuthoringDraftRoute(value.runDir, { playbookDir: value.playbookDir })).toMatchObject({
        run_dir: value.runDir,
        run_version: "v1",
        workflow: "framed",
        draft_route_nodes: ["select-target-page-authority-workflow", "author-target-page-authority-content"],
      });

      const sibling = freshRejectedFixture({ currentNode: "authorize-target-pure-raw" });
      expect(resolveTargetAuthoringDraftRoute(sibling.runDir, { playbookDir: sibling.playbookDir })).toBeNull();
      const postRaw = freshRejectedFixture({ currentNode: "generate-target-framed-raw" });
      expect(resolveTargetAuthoringDraftRoute(postRaw.runDir, { playbookDir: postRaw.playbookDir })).toBeNull();
      const anotherController = freshRejectedFixture({ playbook: "another-controller" });
      expect(resolveTargetAuthoringDraftRoute(anotherController.runDir, { playbookDir: anotherController.playbookDir })).toBeNull();

      const bound = freshRejectedFixture({ bound: true });
      expect(resolveTargetAuthoringDraftRoute(bound.runDir, { playbookDir: bound.playbookDir })).toBeNull();

      const mismatch = freshRejectedFixture();
      const manifestPath = join(mismatch.playbookDir, "controller-manifest-v3.json");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      manifest.controllers["create-deck"].draft_route_nodes.framed = ["select-target-page-authority-workflow", "generate-target-framed-raw"];
      writeFileSync(manifestPath, JSON.stringify(manifest));
      expect(resolveTargetAuthoringDraftRoute(mismatch.runDir, { playbookDir: mismatch.playbookDir })).toBeNull();
    } finally {
      rmSync(value.root, { recursive: true, force: true });
      for (const rejectedValue of rejected) rmSync(rejectedValue.root, { recursive: true, force: true });
    }
  });

  it.each(["framed", "pure"])("accepts every built-in selected %s pre-raw boundary and fences all others", (workflow) => {
    const value = frameworkFixture(workflow);
    try {
      const index = buildPlaybookIndex("PPTMAKER_FRAMEWORK/playbook");
      const route = controllerDraftRouteNodes(index, "create-deck", workflow);
      expect(route.at(-1)).toBe(`authorize-target-${workflow}-raw`);
      expect(route).toContain(`promote-target-${workflow}-style-master`);

      for (const currentNode of route) {
        const state = readState(value.deck, { purpose: "observe", runDir: value.runDir });
        state.playbook = "create-deck";
        state.run_version = "v1";
        state.current_node = currentNode;
        delete state.production_mode;
        writeState(value.deck, state);
        expect(resolveTargetAuthoringDraftRoute(value.runDir)).toMatchObject({
          workflow,
          draft_route_nodes: route,
        });
      }

      for (const currentNode of [
        `inspect-target-${workflow === "framed" ? "pure" : "framed"}-style-master`,
        `generate-target-${workflow}-raw`,
      ]) {
        const state = readState(value.deck, { purpose: "observe", runDir: value.runDir });
        state.current_node = currentNode;
        writeState(value.deck, state);
        expect(resolveTargetAuthoringDraftRoute(value.runDir)).toBeNull();
      }

      const state = readState(value.deck, { purpose: "observe", runDir: value.runDir });
      state.playbook = "edit-visual";
      state.current_node = "refresh-target-framed-visual";
      writeState(value.deck, state);
      expect(resolveTargetAuthoringDraftRoute(value.runDir)).toBeNull();
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("allows only workflow selection before the source records a selected workflow", () => {
    const value = frameworkFixture("framed");
    try {
      setFrameworkDraft(value, { currentNode: "select-target-page-authority-workflow", workflow: null });
      expect(resolveTargetAuthoringDraftRoute(value.runDir)).toMatchObject({ workflow: null });

      setFrameworkDraft(value, { currentNode: "author-target-page-authority-content", workflow: null });
      expect(resolveTargetAuthoringDraftRoute(value.runDir)).toBeNull();
      setFrameworkDraft(value, { currentNode: "configure-target-page-authority-visual-system", workflow: null });
      expect(resolveTargetAuthoringDraftRoute(value.runDir)).toBeNull();
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});
