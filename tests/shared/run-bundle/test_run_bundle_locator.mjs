import { describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { initBundle, initLegacyFixtureBundle, checkBundle } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  RUN_BUNDLE_FILE,
  renderRunBundle,
  resolveRunBundleLocator,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/run_bundle_locator.mjs";
import { readState, resolveContinuationTargetVersion } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";

const FRAMEWORK_ROOT = resolve("PPTMAKER_FRAMEWORK");

function fixture(name) {
  const root = mkdtempSync(join(tmpdir(), `${name}-`));
  const deck = join(root, "deck_locator");
  initLegacyFixtureBundle(deck, FRAMEWORK_ROOT, "keynote", null, { mode: "image2-only" });
  return { root, deck, cardPath: join(deck, RUN_BUNDLE_FILE) };
}

function fakeFramework(root, name) {
  const framework = join(root, name);
  for (const file of [
    "scripts/ppt_flow.mjs",
    "scripts/shared/run-bundle/bundle_layout.mjs",
    "scripts/shared/state/state.mjs",
  ]) {
    const target = join(framework, file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, "export {};\n");
  }
  return framework;
}

function replaceCard(deck, frameworkRoot, frameworkRelation) {
  const text = renderRunBundle({
    deckName: "deck_locator",
    deckRoot: realpathSync.native(deck),
    frameworkRoot: resolve(frameworkRoot),
    frameworkRelation,
  });
  writeFileSync(join(deck, RUN_BUNDLE_FILE), text);
  return text;
}

function cleanup(root) {
  rmSync(root, { recursive: true, force: true });
}

describe("run bundle locator", () => {
  it("fails before deck writes when init cannot prove the framework root", () => {
    const root = mkdtempSync(join(tmpdir(), "locator-init-failure-"));
    const deck = join(root, "deck_locator");
    try {
      expect(() => initBundle(deck, join(root, "missing-framework"))).toThrow(/framework root is unavailable/);
      expect(existsSync(deck)).toBe(false);
      expect(existsSync(join(deck, RUN_BUNDLE_FILE))).toBe(false);
    } finally {
      cleanup(root);
    }
  });

  it("locates a byte-only manifest without relying on the current working directory", () => {
    const { root, deck, cardPath } = fixture("locator-bytes");
    try {
      const before = readFileSync(join(deck, "_state", "state.yaml"));
      const result = resolveRunBundleLocator({ manifestText: readFileSync(cardPath, "utf8") });
      expect(result).toMatchObject({
        kind: "resolved",
        deckDir: realpathSync.native(deck),
        frameworkDir: FRAMEWORK_ROOT,
        deckSource: "declared",
        frameworkSource: "declared",
      });
      expect(readFileSync(join(deck, "_state", "state.yaml"))).toEqual(before);
    } finally {
      cleanup(root);
    }
  });

  it("rejects closed-manifest syntax outside its four scalar fields", () => {
    const { root, cardPath } = fixture("locator-manifest");
    try {
      const valid = readFileSync(cardPath, "utf8");
      for (const invalid of [
        "not a manifest",
        valid.replace("schema:", "schema_alias:"),
        valid.replace("deck_root:", "deck_root: &deck"),
        valid.replace("---\n\n#", "extra: no\n---\n\n#"),
        valid.replace(/deck_root: "[^"]+"/, 'deck_root: "/tmp/../tmp"'),
      ]) {
        expect(resolveRunBundleLocator({ manifestText: invalid })).toEqual({
          kind: "guide", subject: "manifest", code: "manifest_invalid",
        });
      }
    } finally {
      cleanup(root);
    }
  });

  it("returns bounded deck-root guides for unavailable, unverified, and conflicting roots", () => {
    const { root, deck, cardPath } = fixture("locator-deck-guides");
    try {
      const missing = replaceCard(deck, FRAMEWORK_ROOT, relative(deck, FRAMEWORK_ROOT).split("\\").join("/"))
        .replace(`deck_root: ${JSON.stringify(realpathSync.native(deck))}`, `deck_root: ${JSON.stringify(join(root, "missing"))}`);
      expect(resolveRunBundleLocator({ manifestText: missing })).toMatchObject({ code: "deck_root_unavailable" });

      const empty = join(root, "empty-deck");
      mkdirSync(empty);
      const unverified = missing.replace(JSON.stringify(join(root, "missing")), JSON.stringify(empty));
      expect(resolveRunBundleLocator({ manifestText: unverified })).toMatchObject({ code: "deck_root_unverified" });

      const other = join(root, "deck_other");
      initLegacyFixtureBundle(other, FRAMEWORK_ROOT, "keynote", null, { mode: "image2-only" });
      const conflict = readFileSync(cardPath, "utf8").replace(JSON.stringify(realpathSync.native(deck)), JSON.stringify(realpathSync.native(other)));
      expect(resolveRunBundleLocator({ manifestText: conflict })).toMatchObject({ code: "deck_root_conflict" });
      expect(resolveRunBundleLocator({ manifestText: readFileSync(join(other, RUN_BUNDLE_FILE), "utf8") })).toMatchObject({
        kind: "resolved", deckDir: realpathSync.native(other),
      });
    } finally {
      cleanup(root);
    }
  });

  it("rejects a symlinked root card before any state access", () => {
    const { root, deck, cardPath } = fixture("locator-symlink-card");
    try {
      const original = `${cardPath}.real`;
      renameSync(cardPath, original);
      symlinkSync(original, cardPath);
      expect(resolveRunBundleLocator({ manifestText: readFileSync(original, "utf8") })).toEqual({
        kind: "guide", subject: "deck_root", code: "deck_root_unverified",
      });
    } finally {
      cleanup(root);
    }
  });

  it("uses only explicit deck relocation fallback and preserves the direct framework anchor", () => {
    const { root, deck, cardPath } = fixture("locator-relocate-deck");
    const moved = join(root, "moved", "deck_locator");
    try {
      mkdirSync(join(root, "moved"), { recursive: true });
      renameSync(deck, moved);
      expect(resolveRunBundleLocator({
        manifestText: readFileSync(join(moved, RUN_BUNDLE_FILE), "utf8"),
        originalCardPath: join(moved, RUN_BUNDLE_FILE),
      })).toMatchObject({
        kind: "resolved",
        deckDir: realpathSync.native(moved),
        frameworkDir: FRAMEWORK_ROOT,
        deckSource: "card-parent",
        frameworkSource: "declared",
      });
      expect(resolveRunBundleLocator({
        manifestText: readFileSync(join(moved, RUN_BUNDLE_FILE), "utf8"),
        requestedDeckRoot: moved,
      })).toMatchObject({ kind: "resolved", deckSource: "requested" });
      expect(existsSync(cardPath)).toBe(false);
    } finally {
      cleanup(root);
    }
  });

  it("returns bounded framework guides and accepts only its relation fallback", () => {
    const { root, deck } = fixture("locator-framework-guides");
    try {
      const missingRoot = join(root, "missing-framework");
      const missing = replaceCard(deck, missingRoot, "../also-missing");
      expect(resolveRunBundleLocator({ manifestText: missing })).toMatchObject({ code: "framework_root_unavailable" });

      const empty = join(root, "empty-framework");
      mkdirSync(empty);
      const unverified = replaceCard(deck, empty, relative(deck, empty).split("\\").join("/"));
      expect(resolveRunBundleLocator({ manifestText: unverified })).toMatchObject({ code: "framework_root_unverified" });

      const first = fakeFramework(root, "framework-first");
      const second = fakeFramework(root, "framework-second");
      const conflict = replaceCard(deck, first, relative(deck, second).split("\\").join("/"));
      expect(resolveRunBundleLocator({ manifestText: conflict })).toMatchObject({ code: "framework_root_conflict" });

      const relation = replaceCard(deck, missingRoot, relative(deck, first).split("\\").join("/"));
      expect(resolveRunBundleLocator({ manifestText: relation })).toMatchObject({
        kind: "resolved", frameworkDir: realpathSync.native(first), frameworkSource: "relation",
      });
    } finally {
      cleanup(root);
    }
  });

  it("selects the state-owned exact run only after locator resolution", () => {
    const { root, deck, cardPath } = fixture("locator-state");
    try {
      const located = resolveRunBundleLocator({ manifestText: readFileSync(cardPath, "utf8") });
      expect(located.kind).toBe("resolved");
      const state = readState(located.deckDir, { purpose: "observe", heal: false });
      const selected = resolveContinuationTargetVersion(state, located.deckDir);
      expect(selected).toMatchObject({ ok: true, run_version: "v1" });
      expect(checkBundle(join(located.deckDir, "3_versions", selected.run_version), false)).toEqual([]);
    } finally {
      cleanup(root);
    }
  });
});
