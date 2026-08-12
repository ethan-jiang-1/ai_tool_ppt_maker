import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Harness directory layout", () => {
  it("exposes only the current workflow owners and shared delivery", () => {
    for (const path of [
      "ppt_maker_harness/scripts/03-framed-image",
      "ppt_maker_harness/scripts/04-pure-image",
      "ppt_maker_harness/scripts/05-delivery",
      "ppt_maker_harness/scripts/06-iteration",
      "ppt_maker_harness/workflow/05-delivery",
      "tests/05-delivery",
    ]) expect(existsSync(path), path).toBe(true);
    for (const path of [
      "ppt_maker_harness/scripts/compatibility",
      "ppt_maker_harness/workflow/compatibility",
      "tests/compatibility",
    ]) expect(existsSync(path), path).toBe(false);
  });

  it("rejects retired numbered v1 and placeholder test owners", () => {
    for (const path of [
      "ppt_maker_harness/scripts/04-image-production",
      "ppt_maker_harness/scripts/05-iteration",
      "ppt_maker_harness/workflow/04-image-production",
      "ppt_maker_harness/workflow/05-iteration",
      "tests/04-image-production",
      "tests/05-iteration",
      "tests_e2e/04-image-production",
      "tests_e2e/05-iteration",
    ]) expect(existsSync(path), path).toBe(false);
  });

  it("has no Harness-owned release-version surface", () => {
    for (const path of [
      "VERSION",
      "VERSION_LOG.md",
      "openspec/specs/project-versioning/spec.md",
    ]) expect(existsSync(path), path).toBe(false);

    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
    expect(packageJson).not.toHaveProperty("version");
    const lockfile = JSON.parse(readFileSync("package-lock.json", "utf8"));
    expect(lockfile).not.toHaveProperty("version");
    expect(lockfile.packages[""]).not.toHaveProperty("version");

    const readme = readFileSync("ppt_maker_harness/README.md", "utf8");
    expect(readme).not.toMatch(/^version:/m);
    expect(readme).not.toMatch(/^# PPT Maker Harness .*\bv\d/m);
    expect(readFileSync("CLAUDE.md", "utf8")).not.toContain("project-versioning");
    expect(readFileSync("openspec/config.yaml", "utf8")).not.toContain("project-versioning");
  });

  it("keeps the schema home limited to current production definitions", () => {
    const rootFiles = readdirSync("ppt_maker_harness/schema", { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort();
    const stageFiles = readdirSync("ppt_maker_harness/schema/stages", { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".yaml"))
      .map((entry) => entry.name)
      .sort();

    expect(rootFiles).toEqual(["META.yaml", "README.md", "flow.yaml", "serialization-contracts.yaml"]);
    expect(stageFiles).toHaveLength(19);
    const schemaReadme = readFileSync("ppt_maker_harness/schema/README.md", "utf8");
    expect(schemaReadme).not.toMatch(/C[1-7]|recovery route|route_ref/i);
  });
});
