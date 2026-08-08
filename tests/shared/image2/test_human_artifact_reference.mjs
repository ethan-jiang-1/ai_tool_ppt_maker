import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { pageImageWorkflowPaths } from "../../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import {
  renderHumanArtifactReference,
  writeHumanArtifactReference,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_human_artifact_reference.mjs";

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

describe("human artifact reference renderer", () => {
  it("renders collision-aware display references and atomically replaces edited derived output", () => {
    const root = mkdtempSync(join(tmpdir(), "human-artifact-reference-"));
    const runDir = join(root, "deck_reference", "3_versions", "v1");
    const paths = pageImageWorkflowPaths(runDir);
    const first = `${"671d4555"}${"0".repeat(56)}`;
    const second = `${"671d4555"}${"f".repeat(56)}`;
    try {
      mkdirSync(paths.raw_root, { recursive: true });
      const plan = join(paths.raw_root, "work-plan-v1.json");
      const input = join(paths.raw_root, "provider-input-inspection-v1.json");
      writeFileSync(plan, "{}\n");
      writeFileSync(input, "{}\n");
      const facts = {
        run_dir: runDir,
        workflow: "pure",
        style_master: [],
        page_artifacts: [],
        deck_artifacts: [
          artifact("current raw work plan", plan, "plan", second),
          artifact("provider input inspection", input, "plan", first),
        ],
        unavailable: [{ category: "Delivery", reason: "not published" }],
      };
      const rendered = renderHumanArtifactReference(facts);
      expect(rendered).toContain("p-671d4555~1");
      expect(rendered).toContain("p-671d4555~2");
      expect(rendered).not.toContain(first);
      expect(rendered).toContain("locators are read targets only");

      const firstWrite = writeHumanArtifactReference(facts);
      expect(firstWrite.path).toBe(paths.human_artifact_reference);
      writeFileSync(paths.human_artifact_reference, "edited view\n");
      writeHumanArtifactReference(facts);
      expect(readFileSync(paths.human_artifact_reference, "utf8")).toContain("# Page Image Human Artifact Reference");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects an escaping artifact before it creates the derived view", () => {
    const root = mkdtempSync(join(tmpdir(), "human-artifact-reference-escape-"));
    const runDir = join(root, "deck_reference", "3_versions", "v1");
    const outside = join(root, "outside.json");
    try {
      mkdirSync(runDir, { recursive: true });
      writeFileSync(outside, "{}\n");
      expect(() => writeHumanArtifactReference({
        run_dir: runDir,
        workflow: "pure",
        style_master: [],
        page_artifacts: [],
        deck_artifacts: [artifact("outside", outside, "plan", digest("a"))],
        unavailable: [],
      })).toThrow("artifact locator must remain within the current run or deck root");
      expect(existsSync(pageImageWorkflowPaths(runDir).human_artifact_reference)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
