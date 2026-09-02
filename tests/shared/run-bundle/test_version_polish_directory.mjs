// Tests: openspec/specs/run-bundle-layout/spec.md
// Tests: openspec/specs/run-bundle-management/spec.md
// Tests: openspec/specs/lessons-management/spec.md
import { afterEach, describe, expect, it } from "vitest";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  checkBundle,
  createVersion,
  initBundle,
  POLISH_SUBDIR,
  SCRATCH_SUBDIR,
  GENERATED_SUBDIR,
} from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { PAGE_IMAGE_WORKFLOW_SELECTION_REQUIRED_MESSAGE } from "../../../ppt_maker_harness/scripts/shared/run-bundle/production_marker.mjs";

const DRAFT_PROBLEMS = [PAGE_IMAGE_WORKFLOW_SELECTION_REQUIRED_MESSAGE];

const cleanupRoots = [];

function initFixture() {
  const root = mkdtempSync(join(tmpdir(), "polish-directory-"));
  cleanupRoots.push(root);
  const deck = join(root, "deck_polish");
  initBundle(deck, null, "keynote", "dark-executive");
  return { deck, runDir: join(deck, "3_versions", "v1") };
}

function addPolishTrail(runDir) {
  const polish = join(runDir, POLISH_SUBDIR);
  mkdirSync(polish, { recursive: true });
  writeFileSync(join(polish, "round-1.md"), "# Round 1\n\ntried tone A, kept tone B.\n", "utf8");
  writeFileSync(join(polish, "decisions.md"), "# Decisions\n\nsource_epoch 5 after visual pass.\n", "utf8");
  return polish;
}

afterEach(() => {
  while (cleanupRoots.length > 0) rmSync(cleanupRoots.pop(), { recursive: true, force: true });
});

describe("version-local polish directory", () => {
  it("accepts a _polish/ directory with arbitrary Markdown internals and validates none of them", () => {
    const { runDir } = initFixture();
    addPolishTrail(runDir);
    expect(checkBundle(runDir, false)).toEqual(DRAFT_PROBLEMS);
  });

  it("accepts a version without _polish/ (absence remains valid)", () => {
    const { runDir } = initFixture();
    rmSync(join(runDir, POLISH_SUBDIR), { recursive: true, force: true });
    expect(existsSync(join(runDir, POLISH_SUBDIR))).toBe(false);
    expect(checkBundle(runDir, false)).toEqual(DRAFT_PROBLEMS);
  });

  it("still rejects _tmp/, backup/, and _bak/ with a message naming the full admitted set", () => {
    for (const name of ["_tmp", "backup", "_bak"]) {
      const { runDir } = initFixture();
      mkdirSync(join(runDir, name));
      const problems = checkBundle(runDir, false);
      const hit = problems.find((p) => p.includes(`unexpected '${name}' at version root`));
      expect(hit, `expected rejection for ${name}/`).toBeDefined();
      expect(hit).toContain("slide-specifications.md");
      expect(hit).toContain(`${POLISH_SUBDIR}/`);
      expect(hit).toContain(`${SCRATCH_SUBDIR}/`);
      expect(hit).toContain(`${GENERATED_SUBDIR}/`);
      expect(hit).toContain("persistent polish trail");
    }
  });

  it("seeds v1/_polish/README.md at init with the three-role boundary and nothing else", () => {
    const { runDir } = initFixture();
    const polish = join(runDir, POLISH_SUBDIR);
    expect(existsSync(polish)).toBe(true);
    const entries = readdirSync(polish).filter((name) => name !== "README.md");
    expect(entries).toEqual([]);
    const readme = readFileSync(join(polish, "README.md"), "utf8");
    expect(readme).toContain(`${SCRATCH_SUBDIR}/`);
    expect(readme).toContain(`${POLISH_SUBDIR}/`);
    expect(readme).toContain("_lessons/");
    expect(readme).toContain("--new-version");
    expect(readme).toContain("不是真相源");
    // The scratch README directs persistent polish trails to _polish/.
    const scratchReadme = readFileSync(join(runDir, SCRATCH_SUBDIR, "README.md"), "utf8");
    expect(scratchReadme).toContain(`${POLISH_SUBDIR}/`);
  });

  it("does not copy or create _polish/ in a new-version successor and leaves the source trail byte-identical", () => {
    const { runDir } = initFixture();
    const polish = addPolishTrail(runDir);
    const trailPath = join(polish, "round-1.md");
    const before = readFileSync(trailPath, "utf8");
    const target = createVersion(runDir);
    expect(target).toContain("v2");
    expect(existsSync(join(target, POLISH_SUBDIR))).toBe(false);
    expect(readFileSync(trailPath, "utf8")).toBe(before);
    // Successor still gets clean scratch/generated outlets with their READMEs.
    expect(existsSync(join(target, SCRATCH_SUBDIR, "README.md"))).toBe(true);
    expect(existsSync(join(target, GENERATED_SUBDIR, "README.md"))).toBe(true);
    expect(checkBundle(target, false)).toEqual(DRAFT_PROBLEMS);
  });
});
