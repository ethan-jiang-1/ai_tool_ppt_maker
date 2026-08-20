import { describe, expect, it } from "vitest";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { parse as parseYaml } from "yaml";
import { initBundle, LAB_DIR } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  RUN_BUNDLE_FILE,
  RUN_BUNDLE_SCHEMA,
  renderRunBundle,
  verifyDeckHarnessBinding,
} from "../../../ppt_maker_harness/scripts/shared/run-bundle/run_bundle_locator.mjs";

const HARNESS_ROOT = realpathSync.native(resolve("ppt_maker_harness"));

function fixture(name) {
  const root = mkdtempSync(join(tmpdir(), `${name}-`));
  const deck = join(root, "deck_locator");
  initBundle(deck, HARNESS_ROOT, "keynote", null);
  return { root, deck, cardPath: join(deck, RUN_BUNDLE_FILE) };
}

function cleanup(root) {
  rmSync(root, { recursive: true, force: true });
}

function frontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(text);
  if (!match) throw new Error("expected frontmatter");
  return parseYaml(match[1]);
}

function fakeHarness(root, name) {
  const harness = join(root, name);
  for (const file of [
    "scripts/ppt_flow.mjs",
    "scripts/shared/run-bundle/bundle_layout.mjs",
    "scripts/shared/state/state.mjs",
  ]) {
    const target = join(harness, file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, "export {};\n");
  }
  return realpathSync.native(harness);
}

describe("run bundle local Harness binding", () => {
  it("does not scaffold when the local Harness cannot be verified or the Deck target is inside it", () => {
    const root = mkdtempSync(join(tmpdir(), "locator-init-failure-"));
    try {
      const missingHarnessDeck = join(root, "deck_missing_harness");
      expect(() => initBundle(missingHarnessDeck, join(root, "missing-harness"))).toThrow(/harness root is unavailable/);
      expect(existsSync(missingHarnessDeck)).toBe(false);

      const insideHarnessDeck = join(HARNESS_ROOT, "deck_should_not_exist");
      expect(() => initBundle(insideHarnessDeck, HARNESS_ROOT)).toThrow(/outside the local Harness root/);
      expect(existsSync(insideHarnessDeck)).toBe(false);
    } finally {
      cleanup(root);
    }
  });

  it("renders exactly the v2 binding fields and resolves only the exact local Harness", () => {
    const { root, deck, cardPath } = fixture("locator");
    try {
      const card = readFileSync(cardPath, "utf8");
      const manifest = frontmatter(card);
      const canonicalDeck = realpathSync.native(deck);
      expect(Object.keys(manifest).sort()).toEqual([
        "deck_root",
        "harness_relation",
        "harness_root",
        "schema",
      ]);
      expect(manifest).toEqual({
        schema: RUN_BUNDLE_SCHEMA,
        deck_root: canonicalDeck,
        harness_root: HARNESS_ROOT,
        harness_relation: relative(canonicalDeck, HARNESS_ROOT).split("\\").join("/"),
      });

      const before = readFileSync(join(deck, "_state", "state.yaml"));
      expect(verifyDeckHarnessBinding(deck)).toEqual({
        kind: "resolved",
        deckDir: realpathSync.native(deck),
        harnessDir: HARNESS_ROOT,
      });
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(before);
      expect(canonicalDeck.startsWith(`${HARNESS_ROOT}/`)).toBe(false);
    } finally {
      cleanup(root);
    }
  });

  it("keeps the binding valid when only the repairable Lab scaffold is missing", () => {
    const { root, deck } = fixture("locator-missing-lab");
    try {
      rmSync(join(deck, LAB_DIR), { recursive: true, force: true });
      expect(verifyDeckHarnessBinding(deck)).toEqual({
        kind: "resolved",
        deckDir: realpathSync.native(deck),
        harnessDir: HARNESS_ROOT,
      });
    } finally {
      cleanup(root);
    }
  });

  it("rejects a present Lab path that is not an ordinary directory", () => {
    const { root, deck } = fixture("locator-unsafe-lab");
    try {
      rmSync(join(deck, LAB_DIR), { recursive: true, force: true });
      writeFileSync(join(deck, LAB_DIR), "not-a-directory\n");
      expect(verifyDeckHarnessBinding(deck)).toMatchObject({
        kind: "hard-stop",
        code: "deck_root_unverified",
      });
      rmSync(join(deck, LAB_DIR), { force: true });
      const outside = join(root, "outside-lab");
      mkdirSync(outside);
      symlinkSync(outside, join(deck, LAB_DIR));
      expect(verifyDeckHarnessBinding(deck)).toMatchObject({
        kind: "hard-stop",
        code: "deck_root_unverified",
      });
    } finally {
      cleanup(root);
    }
  });

  it("rejects malformed and undeclared cards without selecting a fallback", () => {
    const { root, deck, cardPath } = fixture("locator-reject-undeclared");
    try {
      const valid = readFileSync(cardPath, "utf8");
      const rejected = [
        "not a manifest",
        valid.replace("schema: pptmaker-run-bundle", "schema: unrecognized-run-bundle"),
        valid.replace("harness_root:", "framework_root:"),
        valid.replace("harness_relation:", "framework_relation:"),
        valid.replace("---\n\n#", "extra: no\n---\n\n#"),
      ];
      for (const card of rejected) {
        writeFileSync(cardPath, card);
        expect(verifyDeckHarnessBinding(deck)).toMatchObject({
          kind: "hard-stop",
          subject: "harness_binding",
        });
      }
    } finally {
      cleanup(root);
    }
  });

  it("rejects a conflicting relation and a different verified local Harness", () => {
    const { root, deck, cardPath } = fixture("locator-exact-root");
    try {
      const valid = readFileSync(cardPath, "utf8");
      const otherHarness = fakeHarness(root, "other-harness");
      const canonicalDeck = realpathSync.native(deck);
      const actualRelation = relative(canonicalDeck, HARNESS_ROOT).split("\\").join("/");
      const otherRelation = relative(canonicalDeck, otherHarness).split("\\").join("/");

      writeFileSync(cardPath, valid.replace(
        `harness_relation: ${JSON.stringify(actualRelation)}`,
        `harness_relation: ${JSON.stringify(otherRelation)}`,
      ));
      expect(verifyDeckHarnessBinding(deck)).toMatchObject({
        kind: "hard-stop",
        code: "harness_relation_conflict",
      });

      writeFileSync(cardPath, valid
        .replace(`harness_root: ${JSON.stringify(HARNESS_ROOT)}`, `harness_root: ${JSON.stringify(otherHarness)}`)
        .replace(
          `harness_relation: ${JSON.stringify(actualRelation)}`,
          `harness_relation: ${JSON.stringify(otherRelation)}`,
        ));
      expect(verifyDeckHarnessBinding(deck)).toMatchObject({
        kind: "hard-stop",
        code: "harness_root_conflict",
      });
    } finally {
      cleanup(root);
    }
  });

  it("does not render a card for a different Harness or a nonmatching relation", () => {
    const { root, deck } = fixture("locator-render-guard");
    try {
      const otherHarness = fakeHarness(root, "render-other-harness");
      const relation = relative(deck, otherHarness).split("\\").join("/");
      expect(() => renderRunBundle({
        deckName: "deck_locator",
        deckRoot: realpathSync.native(deck),
        harnessRoot: otherHarness,
        harnessRelation: relation,
      })).toThrow(/this local PPT Maker Harness/);
      expect(() => renderRunBundle({
        deckName: "deck_locator",
        deckRoot: realpathSync.native(deck),
        harnessRoot: HARNESS_ROOT,
        harnessRelation: relation,
      })).toThrow(/exact normalized relation/);
    } finally {
      cleanup(root);
    }
  });
});
