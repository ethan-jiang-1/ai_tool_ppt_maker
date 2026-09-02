// Tests: openspec/specs/image-generation/spec.md
// Tests: openspec/specs/style-master-generation/spec.md
// Tests: openspec/specs/image2-lab/spec.md
// Tests: openspec/specs/pipeline-orchestration/spec.md
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

import { pageImageWorkflowPaths } from "../../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import {
  renderHumanArtifactNavigation,
  writeHumanArtifactNavigation,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_human_artifact_reference.mjs";

const SHORT_COMPONENT_RE = /^[A-Za-z0-9._~-]{1,24}$/;
const digest = (value) => value.repeat(64);

function artifact(label, locator, kind, sha256) {
  return {
    label,
    artifact_type: "test artifact",
    purpose: "Inspect a bounded current test artifact.",
    locator,
    reference: { kind, sha256 },
  };
}

function fixture(name) {
  const root = mkdtempSync(join(tmpdir(), `${name}-`));
  const runDir = join(root, "deck_navigation", "3_versions", "v1");
  const paths = pageImageWorkflowPaths(runDir);
  mkdirSync(paths.raw_root, { recursive: true });
  return { root, runDir, paths };
}

function source(paths, name, bytes) {
  const pathname = join(paths.raw_root, name);
  writeFileSync(pathname, bytes);
  return pathname;
}

function navigationLocators(index) {
  return [...index.matchAll(/Locator: `([^`]+)`/g)].map((match) => match[1]);
}

describe("Human Navigation Path renderer", () => {
  it("creates collision-safe short physical copies without exposing source locators or full digests", () => {
    const { root, runDir, paths } = fixture("human-navigation");
    const first = `${"671d4555"}${"0".repeat(56)}`;
    const second = `${"671d4555"}${"f".repeat(56)}`;
    const plan = source(paths, "work-plan.json", "{\"plan\":true}\n");
    const input = source(paths, "provider-input-inspection.json", "{\"input\":true}\n");
    const firstPage = source(paths, "01_DeckGo.png", "deck page\n");
    const secondPage = source(paths, "02_FlowGo.png", "flow page\n");
    try {
      const facts = {
        run_dir: runDir,
        workflow: "pure",
        style_master: [],
        page_artifacts: [
          { position: 1, slide_id: "DeckGo", artifacts: [artifact("first page", firstPage, "review", digest("a"))] },
          { position: 2, slide_id: "FlowGo", artifacts: [artifact("second page", secondPage, "review", digest("b"))] },
        ],
        deck_artifacts: [
          artifact("current raw work plan", plan, "plan", second),
          artifact("provider input inspection", input, "plan", first),
        ],
        unavailable: [{ category: "Delivery", reason: "not published" }],
      };

      const rendered = renderHumanArtifactNavigation(facts);
      expect(rendered).toContain("p-671d4555~1.json");
      expect(rendered).toContain("p-671d4555~2.json");
      expect(rendered.indexOf("### `01_DeckGo`")).toBeLessThan(rendered.indexOf("### `02_FlowGo`"));
      expect(rendered).not.toContain(first);
      expect(rendered).not.toContain(second);
      expect(rendered).not.toContain(plan);
      expect(rendered).not.toContain(input);
      expect(rendered).not.toContain("work-plan.json");

      const output = writeHumanArtifactNavigation(facts);
      expect(output).toEqual({
        path: paths.human_navigation_index,
        root: paths.human_navigation_root,
        run_dir: runDir,
        workflow: "pure",
      });
      const index = readFileSync(paths.human_navigation_index, "utf8");
      const locators = navigationLocators(index);
      expect(locators).toHaveLength(4);
      for (const locator of locators) {
        for (const component of locator.split("/")) expect(component).toMatch(SHORT_COMPONENT_RE);
        expect(locator).not.toMatch(/[0-9a-f]{64}/i);
        expect(lstatSync(join(paths.human_navigation_root, locator)).isFile()).toBe(true);
      }
      expect(readFileSync(join(paths.human_navigation_root, locators[0]))).toEqual(readFileSync(firstPage));
      expect(readFileSync(join(paths.human_navigation_root, locators[2]))).toEqual(readFileSync(plan));

      writeFileSync(join(paths.human_navigation_root, locators[0]), "edited derived copy\n");
      expect(readFileSync(firstPage, "utf8")).toBe("deck page\n");
      writeHumanArtifactNavigation(facts);
      expect(readFileSync(join(paths.human_navigation_root, locators[0]), "utf8")).toBe("deck page\n");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("preserves the prior navigation tree when copying or replacement fails", () => {
    const { root, runDir, paths } = fixture("human-navigation-preserve");
    const oldSource = source(paths, "old.json", "old owner bytes\n");
    const nextSource = source(paths, "next.json", "next owner bytes\n");
    const lifecycle = paths.target_raw_plan;
    try {
      writeFileSync(lifecycle, "immutable lifecycle fact\n");
      const oldFacts = {
        run_dir: runDir,
        workflow: "pure",
        style_master: [],
        page_artifacts: [],
        deck_artifacts: [artifact("old", oldSource, "plan", digest("a"))],
        unavailable: [],
      };
      const nextFacts = {
        ...oldFacts,
        deck_artifacts: [artifact("next", nextSource, "plan", digest("b"))],
      };
      writeHumanArtifactNavigation(oldFacts);
      const beforeIndex = readFileSync(paths.human_navigation_index);
      const beforeCopy = readFileSync(join(paths.human_navigation_artifacts_root, "p-aaaaaaaa.json"));
      const lifecycleBefore = readFileSync(lifecycle);

      expect(() => writeHumanArtifactNavigation(nextFacts, {
        filesystem: {
          copyFileSync() {
            const error = new Error("copy failed");
            error.code = "EIO";
            throw error;
          },
        },
      })).toThrow("copy failed before publication");
      expect(readFileSync(paths.human_navigation_index)).toEqual(beforeIndex);
      expect(readFileSync(join(paths.human_navigation_artifacts_root, "p-aaaaaaaa.json"))).toEqual(beforeCopy);

      let renameCalls = 0;
      expect(() => writeHumanArtifactNavigation(nextFacts, {
        filesystem: {
          renameSync(...args) {
            renameCalls += 1;
            if (renameCalls === 2) {
              const error = new Error("replace failed");
              error.code = "EIO";
              throw error;
            }
            return renameSync(...args);
          },
        },
      })).toThrow("prior tree was preserved");
      expect(readFileSync(paths.human_navigation_index)).toEqual(beforeIndex);
      expect(readFileSync(join(paths.human_navigation_artifacts_root, "p-aaaaaaaa.json"))).toEqual(beforeCopy);
      expect(readFileSync(oldSource, "utf8")).toBe("old owner bytes\n");
      expect(readFileSync(nextSource, "utf8")).toBe("next owner bytes\n");
      expect(readFileSync(lifecycle)).toEqual(lifecycleBefore);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects escaping, symbolic-link, and unsafe-name inputs before changing the navigation tree", () => {
    const { root, runDir, paths } = fixture("human-navigation-reject");
    const inside = source(paths, "inside.json", "inside\n");
    const outside = join(root, "outside.json");
    const unsafe = source(paths, "unsafe.abcdefghijk", "unsafe\n");
    const link = join(paths.raw_root, "linked.json");
    try {
      writeFileSync(outside, "outside\n");
      expect(() => writeHumanArtifactNavigation({
        run_dir: runDir,
        workflow: "pure",
        style_master: [],
        page_artifacts: [],
        deck_artifacts: [artifact("outside", outside, "plan", digest("a"))],
        unavailable: [],
      })).toThrow("artifact locator must remain within the current run or deck root");
      expect(existsSync(paths.human_navigation_root)).toBe(false);

      expect(() => writeHumanArtifactNavigation({
        run_dir: runDir,
        workflow: "pure",
        style_master: [],
        page_artifacts: [],
        deck_artifacts: [artifact("unsafe", unsafe, "plan", digest("b"))],
        unavailable: [],
      })).toThrow("safe short extension");
      expect(existsSync(paths.human_navigation_root)).toBe(false);

      symlinkSync(inside, link);
      expect(() => writeHumanArtifactNavigation({
        run_dir: runDir,
        workflow: "pure",
        style_master: [],
        page_artifacts: [],
        deck_artifacts: [artifact("linked", link, "plan", digest("c"))],
        unavailable: [],
      })).toThrow("must not traverse a symbolic link");
      expect(existsSync(paths.human_navigation_root)).toBe(false);

      mkdirSync(paths.generated_root, { recursive: true });
      const target = join(root, "nav-target");
      mkdirSync(target);
      symlinkSync(target, paths.human_navigation_root);
      expect(() => writeHumanArtifactNavigation({
        run_dir: runDir,
        workflow: "pure",
        style_master: [],
        page_artifacts: [],
        deck_artifacts: [artifact("inside", inside, "plan", digest("d"))],
        unavailable: [],
      })).toThrow("existing human navigation root must be a non-symbolic-link directory");
      expect(lstatSync(paths.human_navigation_root).isSymbolicLink()).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
