// Tests: openspec/specs/visual-config/spec.md
// Tests: openspec/specs/visual-asset-management/spec.md
import { createHash } from "node:crypto";
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import * as visualConfig from "../../ppt_maker_harness/scripts/02-visual-system/index.mjs";
import {
  PAGE_DESIGN_SYSTEM_BINDING_SCHEMA,
  PAGE_DESIGN_SYSTEM_MAX_SOURCE_UTF8_BYTES,
  PageDesignSystemError,
  resolvePageDesignSystemBinding,
} from "../../ppt_maker_harness/scripts/02-visual-system/index.mjs";
import { createPageDesignSystemResolver } from "../../ppt_maker_harness/scripts/02-visual-system/internal/page_design_system.mjs";
import { PAGE_DESIGN_SYSTEM_FILE } from "../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";

function createSyntheticBundle() {
  const root = mkdtempSync(join(tmpdir(), "page-design-system-"));
  const deck = join(root, "deck_design_system");
  const runDir = join(deck, "3_versions", "v1");
  const backboneStyle = join(deck, "2_backbone", "visual-style");
  const overrideStyle = join(runDir, "overrides", "visual-style");
  mkdirSync(backboneStyle, { recursive: true });
  mkdirSync(overrideStyle, { recursive: true });
  return {
    root,
    runDir,
    backbone: join(backboneStyle, PAGE_DESIGN_SYSTEM_FILE),
    override: join(overrideStyle, PAGE_DESIGN_SYSTEM_FILE),
  };
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function expectPageDesignSystemError(action, code) {
  let error = null;
  try {
    action();
  } catch (caught) {
    error = caught;
  }
  expect(error).toBeInstanceOf(PageDesignSystemError);
  expect(error.code).toBe(code);
}

describe("Page Design System source resolver", () => {
  it("resolves exact nonempty backbone text into a frozen local-only binding", () => {
    const value = createSyntheticBundle();
    const bytes = Buffer.from("Use a clear CJK editorial system.\n", "utf8");
    try {
      writeFileSync(value.backbone, bytes);
      const binding = resolvePageDesignSystemBinding(value.runDir);
      expect(binding).toEqual({
        schema: PAGE_DESIGN_SYSTEM_BINDING_SCHEMA,
        text: bytes.toString("utf8"),
        sha256: sha256(bytes),
      });
      expect(Object.keys(binding).sort()).toEqual(["schema", "sha256", "text"]);
      expect(Object.isFrozen(binding)).toBe(true);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("uses an existing override exactly and lets a blank override suppress backbone inheritance", () => {
    const value = createSyntheticBundle();
    try {
      writeFileSync(value.backbone, "Backbone direction.\n", "utf8");
      const overrideText = "Version-specific direction.\n";
      writeFileSync(value.override, overrideText, "utf8");
      expect(resolvePageDesignSystemBinding(value.runDir)).toMatchObject({
        text: overrideText,
        sha256: sha256(Buffer.from(overrideText, "utf8")),
      });

      writeFileSync(value.override, " \n\t", "utf8");
      expect(resolvePageDesignSystemBinding(value.runDir)).toEqual({
        schema: PAGE_DESIGN_SYSTEM_BINDING_SCHEMA,
        text: null,
        sha256: null,
      });
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("treats missing, zero-byte, and whitespace-only selected sources as null", () => {
    const value = createSyntheticBundle();
    try {
      expect(resolvePageDesignSystemBinding(value.runDir)).toEqual({
        schema: PAGE_DESIGN_SYSTEM_BINDING_SCHEMA,
        text: null,
        sha256: null,
      });
      writeFileSync(value.backbone, "", "utf8");
      expect(resolvePageDesignSystemBinding(value.runDir).text).toBeNull();
      writeFileSync(value.backbone, "\n\t ", "utf8");
      expect(resolvePageDesignSystemBinding(value.runDir).sha256).toBeNull();
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("uses the valid backbone when the optional override branch is wholly absent", () => {
    const value = createSyntheticBundle();
    try {
      rmSync(join(value.runDir, "overrides"), { recursive: true, force: true });
      writeFileSync(value.backbone, "Backbone direction.\n", "utf8");
      expect(resolvePageDesignSystemBinding(value.runDir)).toMatchObject({
        text: "Backbone direction.\n",
      });
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("preserves a leading UTF-8 BOM and hashes the exact original bytes", () => {
    const value = createSyntheticBundle();
    const bytes = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from("Exact source text.\n", "utf8")]);
    try {
      writeFileSync(value.backbone, bytes);
      const binding = resolvePageDesignSystemBinding(value.runDir);
      expect(binding.text).toBe("\uFEFFExact source text.\n");
      expect(binding.sha256).toBe(sha256(bytes));
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("enforces the raw-byte limit before UTF-8 blank canonicalization", () => {
    const value = createSyntheticBundle();
    try {
      const maximum = Buffer.concat([Buffer.from("x", "utf8"), Buffer.alloc(PAGE_DESIGN_SYSTEM_MAX_SOURCE_UTF8_BYTES - 1, 0x20)]);
      writeFileSync(value.backbone, maximum);
      expect(resolvePageDesignSystemBinding(value.runDir)).toMatchObject({
        text: maximum.toString("utf8"),
        sha256: sha256(maximum),
      });

      writeFileSync(value.backbone, Buffer.alloc(PAGE_DESIGN_SYSTEM_MAX_SOURCE_UTF8_BYTES + 1, 0x20));
      expectPageDesignSystemError(
        () => resolvePageDesignSystemBinding(value.runDir),
        "page_design_system_source_too_large",
      );
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("hard-stops invalid UTF-8 without using a valid backbone fallback", () => {
    const value = createSyntheticBundle();
    try {
      writeFileSync(value.backbone, "Backbone direction.\n", "utf8");
      writeFileSync(value.override, Buffer.from([0xc3, 0x28]));
      expectPageDesignSystemError(
        () => resolvePageDesignSystemBinding(value.runDir),
        "page_design_system_source_utf8_invalid",
      );
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("hard-stops invalid selected leaves and escaping ancestors without fallback", () => {
    const value = createSyntheticBundle();
    try {
      writeFileSync(value.backbone, "Backbone direction.\n", "utf8");

      symlinkSync(value.backbone, value.override);
      expectPageDesignSystemError(
        () => resolvePageDesignSystemBinding(value.runDir),
        "page_design_system_source_invalid",
      );
      rmSync(value.override);

      symlinkSync(join(value.root, "missing.md"), value.override);
      expectPageDesignSystemError(
        () => resolvePageDesignSystemBinding(value.runDir),
        "page_design_system_source_invalid",
      );
      rmSync(value.override);

      mkdirSync(value.override);
      expectPageDesignSystemError(
        () => resolvePageDesignSystemBinding(value.runDir),
        "page_design_system_source_invalid",
      );
      rmSync(value.override, { recursive: true, force: true });

      const outside = join(value.root, "outside-visual-style");
      mkdirSync(outside);
      writeFileSync(join(outside, PAGE_DESIGN_SYSTEM_FILE), "Escaping override.\n", "utf8");
      rmSync(join(value.runDir, "overrides", "visual-style"), { recursive: true, force: true });
      symlinkSync(outside, join(value.runDir, "overrides", "visual-style"), "dir");
      expectPageDesignSystemError(
        () => resolvePageDesignSystemBinding(value.runDir),
        "page_design_system_source_escape",
      );
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("hard-stops malformed override ancestors instead of treating the leaf as absent", () => {
    const value = createSyntheticBundle();
    try {
      writeFileSync(value.backbone, "Backbone direction.\n", "utf8");
      const overrides = join(value.runDir, "overrides");
      const visualStyle = join(overrides, "visual-style");

      rmSync(overrides, { recursive: true, force: true });
      writeFileSync(overrides, "not a directory", "utf8");
      expectPageDesignSystemError(
        () => resolvePageDesignSystemBinding(value.runDir),
        "page_design_system_source_invalid",
      );

      rmSync(overrides);
      symlinkSync(join(value.root, "missing-overrides"), overrides, "dir");
      expectPageDesignSystemError(
        () => resolvePageDesignSystemBinding(value.runDir),
        "page_design_system_source_invalid",
      );

      rmSync(overrides);
      mkdirSync(overrides);
      writeFileSync(visualStyle, "not a directory", "utf8");
      expectPageDesignSystemError(
        () => resolvePageDesignSystemBinding(value.runDir),
        "page_design_system_source_invalid",
      );

      rmSync(visualStyle);
      symlinkSync(join(value.root, "missing-visual-style"), visualStyle, "dir");
      expectPageDesignSystemError(
        () => resolvePageDesignSystemBinding(value.runDir),
        "page_design_system_source_invalid",
      );
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("hard-stops absent or malformed required backbone ancestors", () => {
    const value = createSyntheticBundle();
    try {
      rmSync(join(value.runDir, "overrides"), { recursive: true, force: true });
      const deck = join(value.runDir, "..", "..");
      const backbone = join(deck, "2_backbone");
      const visualStyle = join(backbone, "visual-style");

      rmSync(backbone, { recursive: true, force: true });
      expectPageDesignSystemError(
        () => resolvePageDesignSystemBinding(value.runDir),
        "page_design_system_source_unavailable",
      );

      writeFileSync(backbone, "not a directory", "utf8");
      expectPageDesignSystemError(
        () => resolvePageDesignSystemBinding(value.runDir),
        "page_design_system_source_invalid",
      );

      rmSync(backbone);
      mkdirSync(backbone);
      expectPageDesignSystemError(
        () => resolvePageDesignSystemBinding(value.runDir),
        "page_design_system_source_unavailable",
      );

      writeFileSync(visualStyle, "not a directory", "utf8");
      expectPageDesignSystemError(
        () => resolvePageDesignSystemBinding(value.runDir),
        "page_design_system_source_invalid",
      );
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("hard-stops symlinked, dangling, escaping, or uninspectable backbone ancestors", () => {
    const value = createSyntheticBundle();
    try {
      rmSync(join(value.runDir, "overrides"), { recursive: true, force: true });
      const deck = join(value.runDir, "..", "..");
      const backbone = join(deck, "2_backbone");
      const visualStyle = join(backbone, "visual-style");
      const outside = join(value.root, "outside-backbone");
      mkdirSync(join(outside, "visual-style"), { recursive: true });

      rmSync(backbone, { recursive: true, force: true });
      symlinkSync(outside, backbone, "dir");
      expectPageDesignSystemError(
        () => resolvePageDesignSystemBinding(value.runDir),
        "page_design_system_source_escape",
      );

      rmSync(backbone);
      symlinkSync(join(value.root, "missing-backbone"), backbone, "dir");
      expectPageDesignSystemError(
        () => resolvePageDesignSystemBinding(value.runDir),
        "page_design_system_source_invalid",
      );

      rmSync(backbone);
      mkdirSync(backbone);
      symlinkSync(join(outside, "visual-style"), visualStyle, "dir");
      expectPageDesignSystemError(
        () => resolvePageDesignSystemBinding(value.runDir),
        "page_design_system_source_escape",
      );

      rmSync(visualStyle);
      symlinkSync(join(value.root, "missing-backbone-style"), visualStyle, "dir");
      expectPageDesignSystemError(
        () => resolvePageDesignSystemBinding(value.runDir),
        "page_design_system_source_invalid",
      );

      rmSync(visualStyle);
      mkdirSync(visualStyle);
      const inspectionResolver = createPageDesignSystemResolver({
        lstat(sourcePath) {
          if (sourcePath === visualStyle) {
            const error = new Error("injected backbone inspection failure");
            error.code = "EACCES";
            throw error;
          }
          return lstatSync(sourcePath);
        },
        readFile: readFileSync,
        realpath: realpathSync.native,
      });
      expectPageDesignSystemError(
        () => inspectionResolver(value.runDir),
        "page_design_system_source_unavailable",
      );
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("uses injected inspection and read failures for platform-independent unreadability controls", () => {
    const value = createSyntheticBundle();
    try {
      writeFileSync(value.backbone, "Backbone direction.\n", "utf8");
      writeFileSync(value.override, "Override direction.\n", "utf8");
      const overrideStyle = join(value.runDir, "overrides", "visual-style");
      const inspectionResolver = createPageDesignSystemResolver({
        lstat(sourcePath) {
          if (sourcePath === overrideStyle) {
            const error = new Error("injected inspection failure");
            error.code = "EACCES";
            throw error;
          }
          return lstatSync(sourcePath);
        },
        readFile: readFileSync,
        realpath: realpathSync.native,
      });
      expectPageDesignSystemError(
        () => inspectionResolver(value.runDir),
        "page_design_system_source_unavailable",
      );

      const readResolver = createPageDesignSystemResolver({
        lstat: lstatSync,
        readFile(sourcePath) {
          if (sourcePath === value.override) {
            const error = new Error("injected read failure");
            error.code = "EACCES";
            throw error;
          }
          return readFileSync(sourcePath);
        },
        realpath: realpathSync.native,
      });
      expectPageDesignSystemError(
        () => readResolver(value.runDir),
        "page_design_system_source_unreadable",
      );
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("keeps the injected filesystem factory out of the public Visual Config entry", () => {
    const pageDesignSystemExports = Object.keys(visualConfig).filter((name) =>
      name.includes("DESIGN_SYSTEM") || name.includes("DesignSystem") || name.includes("PageDesignSystem"));
    expect(pageDesignSystemExports.sort()).toEqual([
      "PAGE_DESIGN_SYSTEM_BINDING_SCHEMA",
      "PAGE_DESIGN_SYSTEM_MAX_SOURCE_UTF8_BYTES",
      "PageDesignSystemError",
      "resolvePageDesignSystemBinding",
    ]);
    expect(visualConfig.createPageDesignSystemResolver).toBeUndefined();
  });
});
