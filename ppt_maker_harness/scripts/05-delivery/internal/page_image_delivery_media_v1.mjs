import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { canonicalJson, canonicalJsonSha256 } from "../../shared/identity/canonical_json.mjs";
import {
  pageImageOrdinalImageFilename,
  validateFinalSlideManifest,
} from "../../shared/image2/page_image_artifacts.mjs";

export const PAGE_IMAGE_DELIVERY_MEDIA_SCHEMA = "page-image-delivery-media-v1";
export const PAGE_IMAGE_DELIVERY_MEDIA_PROFILE = Object.freeze({
  format: "jpeg",
  quality: 95,
  chroma_subsampling: "4:4:4",
  alpha_background: "#ffffff",
});

const SHA256_RE = /^[0-9a-f]{64}$/;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function exactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function expectedPath(item) {
  return `delivery-media/${pageImageOrdinalImageFilename(item.position, item.slide_id).replace(/\.png$/i, ".jpg")}`;
}

function assertCurrentFinalManifest(finalManifest, finalManifestSha256) {
  const checked = validateFinalSlideManifest(finalManifest);
  if (!checked.ok || !SHA256_RE.test(finalManifestSha256 || "") || checked.sha256 !== finalManifestSha256) {
    throw new Error("Page Image final manifest is invalid or stale for delivery media");
  }
  return checked;
}

function validProfile(profile) {
  return exactKeys(profile, ["format", "quality", "chroma_subsampling", "alpha_background"]) &&
    profile.format === PAGE_IMAGE_DELIVERY_MEDIA_PROFILE.format &&
    profile.quality === PAGE_IMAGE_DELIVERY_MEDIA_PROFILE.quality &&
    profile.chroma_subsampling === PAGE_IMAGE_DELIVERY_MEDIA_PROFILE.chroma_subsampling &&
    profile.alpha_background === PAGE_IMAGE_DELIVERY_MEDIA_PROFILE.alpha_background;
}

/** Validate the derivative declaration and its source-side identity. */
export function validatePageImageDeliveryMediaManifest(manifest, {
  finalManifest,
  finalManifestSha256,
} = {}) {
  const finalChecked = assertCurrentFinalManifest(finalManifest, finalManifestSha256);
  if (!exactKeys(manifest, ["schema", "final_manifest_sha256", "workflow", "profile", "entries"]) ||
    manifest.schema !== PAGE_IMAGE_DELIVERY_MEDIA_SCHEMA ||
    manifest.final_manifest_sha256 !== finalChecked.sha256 ||
    manifest.workflow !== finalManifest.workflow ||
    !validProfile(manifest.profile) ||
    !Array.isArray(manifest.entries) || manifest.entries.length !== finalManifest.items.length) {
    throw new Error("Page Image delivery-media manifest is invalid or stale");
  }

  for (const [index, item] of finalManifest.items.entries()) {
    const entry = manifest.entries[index];
    if (!exactKeys(entry, ["slide_id", "position", "source_final_sha256", "jpeg_sha256", "path", "width", "height"]) ||
      entry.slide_id !== item.slide_id || entry.position !== item.position ||
      entry.source_final_sha256 !== item.final_sha256 || !SHA256_RE.test(entry.jpeg_sha256 || "") ||
      entry.path !== expectedPath(item) || !Number.isSafeInteger(entry.width) || entry.width <= 0 ||
      !Number.isSafeInteger(entry.height) || entry.height <= 0 ||
      (Object.hasOwn(item, "width") && (entry.width !== item.width || entry.height !== item.height))) {
      throw new Error("Page Image delivery-media manifest does not bind final media order");
    }
  }

  return Object.freeze({
    manifest: Object.freeze(manifest),
    manifest_sha256: canonicalJsonSha256(manifest),
    ordered_slide_ids: Object.freeze(finalManifest.items.map((item) => item.slide_id)),
  });
}

function verifyJpeg(bytes, entry) {
  return sharp(bytes).metadata().then((metadata) => {
    if (metadata.format !== "jpeg" || metadata.width !== entry.width || metadata.height !== entry.height ||
      metadata.chromaSubsampling !== PAGE_IMAGE_DELIVERY_MEDIA_PROFILE.chroma_subsampling) {
      throw new Error(`Page Image delivery JPEG media is invalid for ${entry.slide_id}`);
    }
  });
}

async function encodeJpeg(bytes) {
  return sharp(bytes)
    .flatten({ background: PAGE_IMAGE_DELIVERY_MEDIA_PROFILE.alpha_background })
    .jpeg({
      quality: PAGE_IMAGE_DELIVERY_MEDIA_PROFILE.quality,
      chromaSubsampling: PAGE_IMAGE_DELIVERY_MEDIA_PROFILE.chroma_subsampling,
    })
    .toBuffer();
}

/** Derive every JPEG in memory before publishing any delivery artifact. */
export async function derivePageImageDeliveryMedia({
  finalManifest,
  finalManifestSha256,
  finalBytesBySlide,
  encode = encodeJpeg,
} = {}) {
  assertCurrentFinalManifest(finalManifest, finalManifestSha256);
  const orderedSlideIds = finalManifest.items.map((item) => item.slide_id);
  if (!finalBytesBySlide || typeof finalBytesBySlide !== "object" || Array.isArray(finalBytesBySlide) ||
    Object.keys(finalBytesBySlide).sort().join("\n") !== [...orderedSlideIds].sort().join("\n")) {
    throw new Error("Page Image final bytes must exactly cover delivery media");
  }

  const mediaBytesBySlide = {};
  const entries = [];
  for (const item of finalManifest.items) {
    const source = finalBytesBySlide[item.slide_id];
    if ((!Buffer.isBuffer(source) && !(source instanceof Uint8Array)) || sha256(source) !== item.final_sha256) {
      throw new Error(`Page Image final PNG drifted for ${item.slide_id}`);
    }
    const sourceMetadata = await sharp(source).metadata();
    if (sourceMetadata.format !== "png" || !sourceMetadata.width || !sourceMetadata.height ||
      (Object.hasOwn(item, "width") && (sourceMetadata.width !== item.width || sourceMetadata.height !== item.height))) {
      throw new Error(`Page Image final PNG media is invalid for ${item.slide_id}`);
    }
    const jpeg = Buffer.from(await encode(Buffer.from(source)));
    const entry = {
      slide_id: item.slide_id,
      position: item.position,
      source_final_sha256: item.final_sha256,
      jpeg_sha256: sha256(jpeg),
      path: expectedPath(item),
      width: sourceMetadata.width,
      height: sourceMetadata.height,
    };
    await verifyJpeg(jpeg, entry);
    mediaBytesBySlide[item.slide_id] = jpeg;
    entries.push(entry);
  }

  const manifest = {
    schema: PAGE_IMAGE_DELIVERY_MEDIA_SCHEMA,
    final_manifest_sha256: finalManifestSha256,
    workflow: finalManifest.workflow,
    profile: PAGE_IMAGE_DELIVERY_MEDIA_PROFILE,
    entries,
  };
  const checked = validatePageImageDeliveryMediaManifest(manifest, { finalManifest, finalManifestSha256 });
  return Object.freeze({
    ...checked,
    final_manifest: Object.freeze(finalManifest),
    final_manifest_sha256: finalManifestSha256,
    media_bytes_by_slide: Object.freeze(mediaBytesBySlide),
  });
}

function writeAtomic(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}`;
  writeFileSync(temporary, bytes);
  renameSync(temporary, path);
}

/** Publish a complete in-memory derivative only after all conversion succeeds. */
export function publishPageImageDeliveryMedia(paths, derived) {
  const checked = validatePageImageDeliveryMediaManifest(derived?.manifest, {
    finalManifest: derived?.final_manifest,
    finalManifestSha256: derived?.final_manifest_sha256,
  });
  const mediaBytesBySlide = derived?.media_bytes_by_slide;
  if (!mediaBytesBySlide || typeof mediaBytesBySlide !== "object" || Array.isArray(mediaBytesBySlide)) {
    throw new Error("Page Image delivery media bytes are unavailable");
  }

  const stagingRoot = `${paths.delivery_media_root}.tmp-${process.pid}`;
  const priorRoot = `${paths.delivery_media_root}.prior-${process.pid}`;
  let priorMoved = false;
  let published = false;
  rmSync(stagingRoot, { recursive: true, force: true });
  mkdirSync(stagingRoot, { recursive: true });
  try {
    for (const entry of checked.manifest.entries) {
      const bytes = mediaBytesBySlide[entry.slide_id];
      if ((!Buffer.isBuffer(bytes) && !(bytes instanceof Uint8Array)) || sha256(bytes) !== entry.jpeg_sha256) {
        throw new Error(`Page Image delivery JPEG drifted for ${entry.slide_id}`);
      }
      writeFileSync(join(stagingRoot, entry.path.slice("delivery-media/".length)), bytes);
    }
    if (existsSync(paths.delivery_media_root)) {
      renameSync(paths.delivery_media_root, priorRoot);
      priorMoved = true;
    }
    renameSync(stagingRoot, paths.delivery_media_root);
    published = true;
    writeAtomic(paths.delivery_media_manifest, Buffer.from(`${canonicalJson(checked.manifest)}\n`, "utf8"));
    rmSync(priorRoot, { recursive: true, force: true });
  } catch (error) {
    rmSync(stagingRoot, { recursive: true, force: true });
    if (priorMoved && existsSync(priorRoot)) {
      if (published) rmSync(paths.delivery_media_root, { recursive: true, force: true });
      if (!existsSync(paths.delivery_media_root)) renameSync(priorRoot, paths.delivery_media_root);
    }
    throw error;
  }
  return Object.freeze({
    ...checked,
    manifest_path: paths.delivery_media_manifest,
    media_by_slide: Object.freeze(Object.fromEntries(checked.manifest.entries.map((entry) => [entry.slide_id, Object.freeze({
      path: join(paths.final_root, entry.path),
      entry: Object.freeze(entry),
    })]))),
  });
}

/** Read and verify delivery-owned JPEGs for PPTX assembly or notes refresh. */
export async function readPageImageDeliveryMedia(paths, { finalManifest, finalManifestSha256 } = {}) {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(paths.delivery_media_manifest, "utf8"));
  } catch {
    throw new Error("Page Image delivery media is unavailable");
  }
  const checked = validatePageImageDeliveryMediaManifest(manifest, { finalManifest, finalManifestSha256 });
  const mediaBySlide = {};
  for (const entry of checked.manifest.entries) {
    const path = join(paths.final_root, entry.path);
    let bytes;
    try {
      bytes = readFileSync(path);
    } catch {
      throw new Error(`Page Image delivery JPEG is unavailable for ${entry.slide_id}`);
    }
    if (sha256(bytes) !== entry.jpeg_sha256) {
      throw new Error(`Page Image delivery JPEG drifted for ${entry.slide_id}`);
    }
    await verifyJpeg(bytes, entry);
    mediaBySlide[entry.slide_id] = Object.freeze({ path, bytes, entry: Object.freeze(entry) });
  }
  return Object.freeze({ ...checked, media_by_slide: Object.freeze(mediaBySlide) });
}
