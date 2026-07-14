import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";

export const IMAGE_MANIFEST_NAME = "_manifest.json";
export const IMAGE_MANIFEST_VERSION = 1;
export const DEFAULT_IMAGE_SIZE = "16:9";

export function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function sha256File(filePath) {
  return sha256Bytes(readFileSync(filePath));
}

export function stableJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${stableJson(value[key])}`
    ).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function generationProfile({
  styleReferenceSha256,
  resolution,
  model,
  semanticOptions = {},
  assetRefs = {},
}) {
  const profile = {
    model,
    resolution,
    size: semanticOptions.size || DEFAULT_IMAGE_SIZE,
    style_reference_sha256: styleReferenceSha256,
    semantic_options: {
      n: semanticOptions.n ?? 1,
      ...semanticOptions,
    },
  };
  if (assetRefs && Object.keys(assetRefs).length > 0) {
    profile.asset_refs = assetRefs;
  }
  return profile;
}

export function generationFingerprint({ prompt, profile }) {
  return sha256Bytes(stableJson({
    prompt: String(prompt),
    profile,
  }));
}

export function manifestPath(outDir) {
  return join(outDir, IMAGE_MANIFEST_NAME);
}

export function emptyImageManifest() {
  return { version: IMAGE_MANIFEST_VERSION, slides: {} };
}

export function readImageManifest(outDir) {
  const path = manifestPath(outDir);
  if (!existsSync(path)) return { manifest: emptyImageManifest(), error: null };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf-8"));
    if (
      !parsed || parsed.version !== IMAGE_MANIFEST_VERSION ||
      !parsed.slides || typeof parsed.slides !== "object" || Array.isArray(parsed.slides)
    ) {
      return { manifest: emptyImageManifest(), error: `invalid manifest schema: ${path}` };
    }
    return { manifest: parsed, error: null };
  } catch (err) {
    return { manifest: emptyImageManifest(), error: `corrupt manifest ${path}: ${err.message}` };
  }
}

export function writeImageManifestAtomic(outDir, manifest) {
  const path = manifestPath(outDir);
  const temp = `${path}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(temp, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
  renameSync(temp, path);
  return path;
}

export function buildImageManifestEntry({
  slideId,
  output,
  prompt,
  profile,
  imagePath,
  generatedAt = new Date().toISOString(),
}) {
  return {
    slide_id: slideId,
    output: basename(output),
    generation_fingerprint: generationFingerprint({ prompt, profile }),
    image_sha256: sha256File(imagePath),
    generation_profile: profile,
    generated_at: generatedAt,
  };
}

export function provenanceRepairHint(slideIds) {
  return `rerun with --only ${slideIds.join(",")} --force-images`;
}

export function inspectImageProvenance({
  slide,
  outDir,
  manifest,
  manifestError = null,
  profile,
}) {
  const slideId = String(slide.id || "");
  const output = slide.out || `${slideId}.png`;
  const imagePath = join(outDir, output);
  const expectedFingerprint = generationFingerprint({
    prompt: String(slide.prompt || "").trim(),
    profile,
  });
  if (!existsSync(imagePath)) {
    return { current: false, reason: "image missing", imagePath, expectedFingerprint };
  }
  if (manifestError) {
    return { current: false, reason: manifestError, imagePath, expectedFingerprint };
  }
  const entry = manifest.slides?.[slideId];
  if (!entry || typeof entry !== "object") {
    return { current: false, reason: "manifest entry missing", imagePath, expectedFingerprint };
  }
  if (entry.output !== basename(output)) {
    return { current: false, reason: "manifest output mismatch", imagePath, expectedFingerprint, entry };
  }
  if (entry.generation_fingerprint !== expectedFingerprint) {
    return { current: false, reason: "generation fingerprint mismatch", imagePath, expectedFingerprint, entry };
  }
  let imageSha256;
  try {
    imageSha256 = sha256File(imagePath);
  } catch (err) {
    return { current: false, reason: `image unreadable: ${err.message}`, imagePath, expectedFingerprint, entry };
  }
  if (!entry.image_sha256 || entry.image_sha256 !== imageSha256) {
    return { current: false, reason: "image SHA-256 mismatch", imagePath, expectedFingerprint, entry, imageSha256 };
  }
  return { current: true, imagePath, expectedFingerprint, entry, imageSha256 };
}

export function validateImageProvenance({ slides, outDir, profile }) {
  const { manifest, error } = readImageManifest(outDir);
  const results = slides.map((slide) => ({
    slideId: slide.id,
    ...inspectImageProvenance({
      slide,
      outDir,
      manifest,
      manifestError: error,
      profile,
    }),
  }));
  const stale = results.filter((result) => !result.current);
  return { current: stale.length === 0, manifest, manifestError: error, results, stale };
}
