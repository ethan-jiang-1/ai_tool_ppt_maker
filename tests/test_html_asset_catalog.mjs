import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { encode as encodePng } from "fast-png";
import jpeg from "jpeg-js";
import {
  loadHtmlAssetCatalog,
  validateHtmlAssetBytes,
} from "../PPTMAKER_FRAMEWORK/scripts/lib/html_asset_catalog.mjs";
import { checkBundle } from "../PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");

function runFixture() {
  const root = mkdtempSync(join(tmpdir(), "html-assets-"));
  const runDir = join(root, "deck_fixture", "3_versions", "v1");
  mkdirSync(runDir, { recursive: true });
  return { root, deck: join(root, "deck_fixture"), runDir };
}

function writeLayer(directory, assets) {
  mkdirSync(directory, { recursive: true });
  const lines = ["version: 2", "assets:"];
  for (const [id, { path, type = "svg", bytes }] of Object.entries(assets)) {
    mkdirSync(dirname(join(directory, path)), { recursive: true });
    writeFileSync(join(directory, path), bytes);
    lines.push(`  ${id}:`);
    lines.push(`    path: ${path}`);
    lines.push(`    type: ${type}`);
    lines.push(`    label: ${id}`);
    lines.push("    description: passive fixture");
    lines.push("    usage_guidance: use locally");
    lines.push(`    sha256: ${hash(bytes)}`);
  }
  writeFileSync(join(directory, "asset-manifest.yaml"), `${lines.join("\n")}\n`);
}

const svg = (fill = "#000") => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path id="p" fill="${fill}" d="M0 0h10v10z"/></svg>`);

describe("HTML-first v2 asset catalog", () => {
  it("merges backbone then sparse version entries by stable ID", () => {
    const fixture = runFixture();
    try {
      writeLayer(join(fixture.deck, "2_backbone", "visual-style", "assets"), {
        icon_main: { path: "svg/main.svg", bytes: svg("#111") },
        icon_keep: { path: "svg/keep.svg", bytes: svg("#222") },
      });
      writeLayer(join(fixture.runDir, "overrides", "visual-style", "assets"), {
        icon_main: { path: "svg/replacement.svg", bytes: svg("#333") },
        icon_new: { path: "svg/new.svg", bytes: svg("#444") },
      });
      const result = loadHtmlAssetCatalog(fixture.runDir);
      expect(Object.keys(result.catalog)).toEqual(["icon_keep", "icon_main", "icon_new"]);
      expect(result.catalog.icon_main.origin).toBe("version");
      expect(result.catalog.icon_keep.origin).toBe("backbone");
      expect(result.catalog.icon_main.path).toBe("svg/replacement.svg");
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("rejects unused digest-invalid entries", () => {
    const fixture = runFixture();
    try {
      const directory = join(fixture.deck, "2_backbone", "visual-style", "assets");
      writeLayer(directory, { unused_bad: { path: "svg/bad.svg", bytes: svg() } });
      const manifest = join(directory, "asset-manifest.yaml");
      writeFileSync(manifest, String(`version: 2
assets:
  unused_bad:
    path: svg/bad.svg
    type: svg
    label: bad
    description: passive fixture
    usage_guidance: use locally
    sha256: ${"a".repeat(64)}
`));
      expect(() => loadHtmlAssetCatalog(fixture.runDir)).toThrow(/SHA-256 mismatch/);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("rejects external references, CSS and icon text", () => {
    const external = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><image href="https://example.com/x.png"/></svg>');
    expect(() => validateHtmlAssetBytes(external, { assetId: "bad_svg", type: "svg" })).toThrow(/local fragment/);
    const styled = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path style="fill:red"/></svg>');
    expect(() => validateHtmlAssetBytes(styled, { assetId: "bad_style", type: "svg" })).toThrow(/forbidden attribute/);
    const text = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><text>x</text></svg>');
    expect(() => validateHtmlAssetBytes(text, { assetId: "bad_text", type: "svg", iconContext: true })).toThrow(/contains <text>/);
    const entityUrl = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><image href="https&#58;//example.com/x.png"/></svg>');
    expect(() => validateHtmlAssetBytes(entityUrl, { assetId: "entity_url", type: "svg" })).toThrow(/local fragment/);
    const foreign = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" xmlns:x="urn:foreign" viewBox="0 0 10 10"><x:widget/></svg>');
    expect(() => validateHtmlAssetBytes(foreign, { assetId: "foreign", type: "svg" })).toThrow(/foreign namespace/);
  });

  it("rejects malformed and active SVG", () => {
    expect(() => validateHtmlAssetBytes(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><g></svg>'), { assetId: "bad", type: "svg" })).toThrow(/parse failed/);
    expect(() => validateHtmlAssetBytes(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><script/></svg>'), { assetId: "active", type: "svg" })).toThrow(/forbidden/);
    expect(() => validateHtmlAssetBytes(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path id="same"/><path id="same"/></svg>'), { assetId: "duplicate", type: "svg" })).toThrow(/duplicate id/);
    expect(() => validateHtmlAssetBytes(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><use href="#missing"/></svg>'), { assetId: "fragment", type: "svg" })).toThrow(/missing #missing/);
    const deep = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">${"<g>".repeat(128)}${"</g>".repeat(128)}</svg>`);
    expect(() => validateHtmlAssetBytes(deep, { assetId: "deep", type: "svg" })).toThrow(/complexity/);
  });

  it("fully decodes passive raster bytes and rejects corrupt/animated/oriented forms", () => {
    expect(() => validateHtmlAssetBytes(svg(), { assetId: "wrong_signature", type: "png" })).toThrow(/PNG signature/);
    const pixels = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255]);
    const png = Buffer.from(encodePng({ width: 2, height: 2, data: pixels, channels: 4, depth: 8 }));
    expect(validateHtmlAssetBytes(png, { assetId: "ok_png", type: "png" })).toMatchObject({ width: 2, height: 2 });
    expect(() => validateHtmlAssetBytes(Buffer.alloc(20 * 1024 * 1024 + 1), { assetId: "too_large", type: "png" })).toThrow(/20 MiB/);
    const corrupt = Buffer.from(png); corrupt[corrupt.length - 6] ^= 0xff;
    expect(() => validateHtmlAssetBytes(corrupt, { assetId: "bad_png", type: "png" })).toThrow(/decode failed/);
    const fakeAnimation = Buffer.concat([png.subarray(0, 33), Buffer.from([0, 0, 0, 0, 0x61, 0x63, 0x54, 0x4c, 0, 0, 0, 0]), png.subarray(33)]);
    expect(() => validateHtmlAssetBytes(fakeAnimation, { assetId: "apng", type: "png" })).toThrow(/APNG/);

    const jpg = Buffer.from(jpeg.encode({ width: 2, height: 2, data: Buffer.from(pixels) }, 90).data);
    expect(validateHtmlAssetBytes(jpg, { assetId: "ok_jpg", type: "jpg" })).toMatchObject({ width: 2, height: 2 });
    expect(() => validateHtmlAssetBytes(jpg.subarray(0, jpg.length - 8), { assetId: "truncated_jpg", type: "jpg" })).toThrow(/decode failed|invalid/i);
    const exif = Buffer.concat([jpg.subarray(0, 2), Buffer.from([0xff, 0xe1, 0x00, 0x08]), Buffer.from("Exif\0\0", "binary"), jpg.subarray(2)]);
    expect(() => validateHtmlAssetBytes(exif, { assetId: "exif", type: "jpg" })).toThrow(/EXIF/);
  });

  it("rejects symlink escapes and over-limit manifest entry counts", () => {
    const fixture = runFixture();
    try {
      const directory = join(fixture.deck, "2_backbone", "visual-style", "assets");
      mkdirSync(directory, { recursive: true });
      const outside = join(fixture.root, "outside.svg");
      writeFileSync(outside, svg());
      mkdirSync(join(directory, "svg"), { recursive: true });
      symlinkSync(outside, join(directory, "svg", "escape.svg"));
      writeFileSync(join(directory, "asset-manifest.yaml"), `version: 2
assets:
  escaped:
    path: svg/escape.svg
    type: svg
    label: escaped
    description: passive fixture
    usage_guidance: use locally
    sha256: ${hash(svg())}
`);
      expect(() => loadHtmlAssetCatalog(fixture.runDir)).toThrow(/real path escapes/);

      const ids = Array.from({ length: 513 }, (_, index) => `asset_${index}`);
      writeFileSync(join(directory, "asset-manifest.yaml"), `version: 2\nassets:\n${ids.map((id) => `  ${id}: {}`).join("\n")}\n`);
      expect(() => loadHtmlAssetCatalog(fixture.runDir)).toThrow(/more than 512/);

      writeFileSync(join(directory, "asset-manifest.yaml"), Buffer.from([0xff]));
      expect(() => loadHtmlAssetCatalog(fixture.runDir)).toThrow(/valid UTF-8/);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("keeps unregistered version shadow bytes non-authoritative and applies the override asset whitelist", () => {
    const fixture = runFixture();
    try {
      const backbone = join(fixture.deck, "2_backbone", "visual-style", "assets");
      writeLayer(backbone, { icon_main: { path: "icons/main.svg", bytes: svg("#111") } });
      const version = join(fixture.runDir, "overrides", "visual-style", "assets");
      mkdirSync(join(version, "icons"), { recursive: true });
      writeFileSync(join(version, "icons", "main.svg"), svg("#999"));
      const result = loadHtmlAssetCatalog(fixture.runDir);
      expect(result.catalog.icon_main.origin).toBe("backbone");
      expect(result.catalog.icon_main.measured_sha256).toBe(hash(svg("#111")));

      writeFileSync(join(version, "rogue.svg"), svg());
      expect(checkBundle(fixture.runDir, false)).toEqual(expect.arrayContaining([expect.stringMatching(/rogue\.svg.*not canonical/)]));
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
