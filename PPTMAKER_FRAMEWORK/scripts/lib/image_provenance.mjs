import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";

export const IMAGE_MANIFEST_NAME = "_manifest.json";
export const IMAGE_MANIFEST_VERSION = 1;
export const DEFAULT_IMAGE_SIZE = "16:9";
export const IMAGE2_RENDER_ENGINE = "image2";
export const RAW_RENDER_ARTIFACT_KIND = "raw-render";

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
  mkdirSync(outDir, { recursive: true });
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
    render_engine: IMAGE2_RENDER_ENGINE,
    artifact_kind: RAW_RENDER_ARTIFACT_KIND,
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
  const slideId = String(slide.slide_id || slide.id || "");
  const requestedOutput = slide.out || `${slideId}.png`;
  const expectedFingerprint = generationFingerprint({
    prompt: String(slide.prompt || "").trim(),
    profile,
  });
  if (manifestError) {
    return { current: false, reason: manifestError, imagePath: join(outDir, requestedOutput), expectedFingerprint };
  }
  const entry = manifest.slides?.[slideId];
  if (!entry || typeof entry !== "object") {
    const imagePath = join(outDir, requestedOutput);
    return { current: false, reason: "manifest entry missing", imagePath, expectedFingerprint };
  }
  const entryEngine = entry.render_engine || IMAGE2_RENDER_ENGINE;
  const entryKind = entry.artifact_kind || RAW_RENDER_ARTIFACT_KIND;
  if (entryEngine !== IMAGE2_RENDER_ENGINE || entryKind !== RAW_RENDER_ARTIFACT_KIND) {
    return { current: false, reason: "manifest artifact identity mismatch", imagePath: join(outDir, entry.output || requestedOutput), expectedFingerprint, entry };
  }
  const entryOutput = entry.output || requestedOutput;
  const imagePath = join(outDir, entryOutput);
  if (!existsSync(imagePath)) {
    return { current: false, reason: "image missing", imagePath, expectedFingerprint, entry };
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
  return {
    current: true,
    imagePath,
    requestedImagePath: join(outDir, requestedOutput),
    legacyOutput: basename(entryOutput) !== basename(requestedOutput),
    expectedFingerprint,
    entry,
    imageSha256,
  };
}

/**
 * Materialize a provenance-complete raw render under the stable target name.
 * This is local file work only and never calls a renderer.
 */
export function materializeVerifiedRawImage({
  sourceDir,
  targetDir,
  slide,
  sourceManifest,
  sourceManifestError = null,
  profile,
  sourceVersion = null,
}) {
  const slideId = String(slide.slide_id || slide.id || "");
  const targetOutput = `${slideId}.png`;
  const proof = inspectImageProvenance({
    slide: { ...slide, out: targetOutput },
    outDir: sourceDir,
    manifest: sourceManifest,
    manifestError: sourceManifestError,
    profile,
  });
  if (!proof.current) {
    return { status: "needs_render", slide_id: slideId, reason: proof.reason, proof };
  }
  mkdirSync(targetDir, { recursive: true });
  const targetPath = join(targetDir, targetOutput);
  if (proof.imagePath !== targetPath) {
    const tempPath = join(targetDir, `.${targetOutput}.materialize-${process.pid}-${Date.now()}`);
    try {
      copyFileSync(proof.imagePath, tempPath);
      renameSync(tempPath, targetPath);
    } catch (error) {
      try { rmSync(tempPath, { force: true }); } catch { /* best effort */ }
      throw error;
    }
  }
  const entry = {
    ...proof.entry,
    slide_id: slideId,
    render_engine: IMAGE2_RENDER_ENGINE,
    artifact_kind: RAW_RENDER_ARTIFACT_KIND,
    output: targetOutput,
    image_sha256: sha256File(targetPath),
    ...(sourceVersion ? {
      materialized_from: {
        source_version: sourceVersion,
        source_output: basename(proof.imagePath),
        source_image_sha256: proof.imageSha256,
      },
    } : {}),
  };
  return { status: "verified", slide_id: slideId, path: targetPath, entry, proof };
}

export function publishMaterializedRawImages({ targetDir, results, replace = false }) {
  const manifest = replace ? emptyImageManifest() : readImageManifest(targetDir).manifest;
  for (const result of results || []) {
    if (result.status === "verified" && result.entry) {
      manifest.slides[result.slide_id] = result.entry;
    }
  }
  writeImageManifestAtomic(targetDir, manifest);
  return manifest;
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
