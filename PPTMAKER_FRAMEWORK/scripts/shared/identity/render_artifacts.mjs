import { existsSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative, resolve, sep } from "node:path";
import { sha256File, stableJson } from "../../05-iteration/legacy-image2/internal/image_provenance.mjs";
import { canonicalJsonSha256 } from "../../contracts/canonical_json.mjs";
import { decode as decodePng } from "fast-png";
import { HTML_FINAL_SLIDES_MANIFEST_SCHEMA, htmlOwnerRoot, readHtmlCurrentManifest } from "../../03-html-production/internal/html_object_store.mjs";
import { loadImage } from "@napi-rs/canvas";

export const ARTIFACT_STATUS_VERIFIED = "verified";
export const ARTIFACT_STATUS_LEGACY_LOCATED = "legacy-located";
export const ARTIFACT_STATUS_MISSING = "missing";
export const ARTIFACT_STATUS_AMBIGUOUS = "ambiguous";

export const RENDER_ENGINE_IMAGE2 = "image2";
export const ARTIFACT_KIND_RAW_RENDER = "raw-render";
export const ARTIFACT_KIND_FINAL_SLIDE = "final-slide";
export const ARTIFACT_MANIFEST_VERSION = 1;
export const FINAL_SLIDE_CONTRACT_VERSION = 1;

const SHA256_RE = /^[0-9a-f]{64}$/;

export function finalSlideFingerprintV1({ producer, producerPrivateFingerprint, byteSha256, width, height, mediaProfile }) {
  if (typeof producer !== "string" || !producer || !SHA256_RE.test(producerPrivateFingerprint || "") || !SHA256_RE.test(byteSha256 || "") || !Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0 || typeof mediaProfile !== "string" || !mediaProfile) throw new TypeError("invalid final-slide fingerprint inputs");
  return canonicalJsonSha256({ schema: "final_slide_fingerprint_v1", contract_version: FINAL_SLIDE_CONTRACT_VERSION, producer, producer_private_fingerprint: producerPrivateFingerprint, byte_sha256: byteSha256, width, height, media_profile: mediaProfile });
}

export function adaptHtmlFinalSlideManifest({ runDir, ownerRoot, manifest, plan }) {
  if (!manifest || manifest.schema !== "pptmaker-html-final-slides-manifest-v1" || manifest.publication_scope !== "canonical-run" || !Array.isArray(manifest.entries) || !plan || !Array.isArray(plan.slides)) throw new Error("HTML final-slide adapter received an invalid current manifest or plan");
  const byId = new Map(manifest.entries.map((entry) => [entry.slide_id, entry]));
  const adapted = plan.slides.map((slide) => {
    const source = byId.get(slide.slide_id);
    if (!source || source.composition_variant !== "effective") throw new Error(`HTML final-slide evidence is missing for ${slide.slide_id}`);
    const path = resolve(ownerRoot, ...String(source.path || "").split("/"));
    const relOwner = relative(ownerRoot, path).split(sep).join("/");
    if (!relOwner.startsWith("objects/") || !existsSync(path) || sha256File(path) !== source.sha256) throw new Error(`HTML final-slide receipt drifted for ${slide.slide_id}`);
    const png = decodePng(readFileSync(path), { checkCrc: true });
    if (png.width !== source.width || png.height !== source.height) throw new Error(`HTML final-slide dimensions drifted for ${slide.slide_id}`);
    const expectedFingerprint = finalSlideFingerprintV1({ producer: source.producer, producerPrivateFingerprint: source.composition_fingerprint, byteSha256: source.sha256, width: source.width, height: source.height, mediaProfile: source.media_profile });
    if (source.final_slide_fingerprint !== expectedFingerprint) throw new Error(`HTML final-slide fingerprint drifted for ${slide.slide_id}`);
    return { common: Object.freeze({ slide_id: source.slide_id, artifact_kind: ARTIFACT_KIND_FINAL_SLIDE, producer: source.producer, final_slide_fingerprint: expectedFingerprint, path: relative(runDir, path).split(sep).join("/"), absolute_path: path, sha256: source.sha256, width: source.width, height: source.height, media_profile: source.media_profile }), composition_fingerprint: source.composition_fingerprint };
  });
  const htmlDeliveryDigest = canonicalJsonSha256({ schema: "html_delivery_digest_v1", ordered_plan_digest: plan.ordered_plan_digest, slides: adapted.map((entry) => ({ slide_id: entry.common.slide_id, composition_fingerprint: entry.composition_fingerprint, png_sha256: entry.common.sha256 })) });
  return Object.freeze({ entries: adapted.map((entry) => entry.common), html_delivery_digest: htmlDeliveryDigest });
}

export function resolveHtmlFinalSlideArtifacts({ runDir, plan, htmlProductionResetId = null }) {
  const ownerRoot = htmlOwnerRoot(runDir, "final-slides");
  const current = readHtmlCurrentManifest(ownerRoot, { expectedSchema: HTML_FINAL_SLIDES_MANIFEST_SCHEMA, publicationScope: "canonical-run", htmlProductionResetId });
  if (!current) throw new Error("current HTML final-slide manifest is missing; run local Stage 3 first");
  return adaptHtmlFinalSlideManifest({ runDir: resolve(runDir), ownerRoot, manifest: current.manifest, plan });
}

export async function adaptLegacyFinalSlideArtifacts({ runDir, artifacts }) {
  if (!Array.isArray(artifacts)) throw new TypeError("legacy final-slide adapter requires verified artifacts");
  const entries = [];
  for (const artifact of artifacts) {
    if (artifact.status !== ARTIFACT_STATUS_VERIFIED || artifact.artifact_kind !== ARTIFACT_KIND_FINAL_SLIDE) throw new Error(`legacy final-slide artifact is not verified for ${artifact.slide_id}`);
    const image = await loadImage(artifact.path);
    const mediaProfile = `legacy-final-slide-v1:${canonicalJsonSha256({ profile: artifact.profile, width: image.width, height: image.height })}`;
    const privateFingerprint = canonicalJsonSha256({ fingerprint: artifact.fingerprint, profile: artifact.profile });
    entries.push(Object.freeze({ slide_id: artifact.slide_id, artifact_kind: ARTIFACT_KIND_FINAL_SLIDE, producer: "legacy-image2-stage3-v1", final_slide_fingerprint: finalSlideFingerprintV1({ producer: "legacy-image2-stage3-v1", producerPrivateFingerprint: privateFingerprint, byteSha256: artifact.byte_sha256, width: image.width, height: image.height, mediaProfile }), path: relative(runDir, artifact.path).split(sep).join("/"), absolute_path: artifact.path, sha256: artifact.byte_sha256, width: image.width, height: image.height, media_profile: mediaProfile }));
  }
  return Object.freeze(entries);
}

export function artifactManifestEntryKey({ slideId, renderEngine, artifactKind }) {
  return `${slideId}::${renderEngine}::${artifactKind}`;
}

export function artifactIdentity({ slideId, renderEngine, artifactKind, fingerprint = null }) {
  return {
    slide_id: String(slideId),
    render_engine: String(renderEngine),
    artifact_kind: String(artifactKind),
    ...(fingerprint ? { fingerprint: String(fingerprint) } : {}),
  };
}

function normalizeManifestEntries(manifest) {
  const entries = [];
  if (!manifest || typeof manifest !== "object") return entries;
  if (Array.isArray(manifest.artifacts)) {
    entries.push(...manifest.artifacts.filter((entry) => entry && typeof entry === "object"));
  }
  if (manifest.entries && typeof manifest.entries === "object" && !Array.isArray(manifest.entries)) {
    entries.push(...Object.values(manifest.entries).filter((entry) => entry && typeof entry === "object"));
  }
  if (manifest.slides && typeof manifest.slides === "object" && !Array.isArray(manifest.slides)) {
    entries.push(...Object.entries(manifest.slides).flatMap(([slideId, value]) => {
      if (Array.isArray(value)) {
        return value.filter((entry) => entry && typeof entry === "object").map((entry) => ({ slide_id: entry.slide_id || slideId, ...entry }));
      }
      return value && typeof value === "object"
        ? [{ slide_id: value.slide_id || slideId, ...value }]
        : [];
    }));
  }
  return entries;
}

function entryEngine(entry, defaultEngine) {
  return entry.render_engine || entry.engine || defaultEngine || null;
}

function entryKind(entry, defaultKind) {
  return entry.artifact_kind || entry.kind || defaultKind || null;
}

function entryFingerprint(entry) {
  return entry.fingerprint || entry.generation_fingerprint || entry.header_fingerprint || null;
}

function entryProfile(entry) {
  return entry.generation_profile || entry.profile || null;
}

function entryOutputSha(entry) {
  return entry.output_sha256 || entry.image_sha256 || entry.final_sha256 || null;
}

function profileMatches(actual, expected) {
  if (expected == null) return true;
  return actual != null && stableJson(actual) === stableJson(expected);
}

function legacyCandidates(directory, slideId) {
  if (!existsSync(directory)) return [];
  const escaped = String(slideId).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^(?:\\d+[_-])?${escaped}$`, "i");
  try {
    return readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .filter((entry) => [".png", ".jpg", ".jpeg", ".webp"].includes(extname(entry.name).toLowerCase()))
      .filter((entry) => pattern.test(basename(entry.name, extname(entry.name))))
      .map((entry) => join(directory, entry.name))
      .sort();
  } catch {
    return [];
  }
}

/**
 * Resolve one logical artifact from Stage-owned manifest evidence. Directory
 * scanning is used only to report legacy-located compatibility bytes and never
 * promotes those bytes to verified identity.
 */
export function resolveRenderArtifact({
  directory,
  manifest,
  manifestError = null,
  slideId,
  renderEngine,
  artifactKind,
  fingerprint = null,
  profile = null,
  defaultEngine = null,
  defaultKind = null,
  allowLegacyLocate = true,
}) {
  const identity = artifactIdentity({ slideId, renderEngine, artifactKind, fingerprint });
  const entries = normalizeManifestEntries(manifest).filter((entry) =>
    String(entry.slide_id || "") === String(slideId) &&
    entryEngine(entry, defaultEngine) === renderEngine &&
    entryKind(entry, defaultKind) === artifactKind
  );
  const matching = entries.filter((entry) =>
    (fingerprint == null || entryFingerprint(entry) === fingerprint) &&
    profileMatches(entryProfile(entry), profile)
  );
  if (matching.length > 1) {
    return {
      ...identity,
      status: ARTIFACT_STATUS_AMBIGUOUS,
      reason: "multiple manifest entries match the requested artifact identity",
      candidates: matching,
    };
  }
  if (matching.length === 1 && !manifestError) {
    const entry = matching[0];
    const output = entry.output || entry.path;
    const path = output ? (resolve(output) === output ? output : join(directory, output)) : null;
    if (path && existsSync(path)) {
      let actualSha;
      try {
        actualSha = sha256File(path);
      } catch (error) {
        return { ...identity, status: ARTIFACT_STATUS_MISSING, reason: `artifact unreadable: ${error.message}`, entry, path };
      }
      const expectedSha = entryOutputSha(entry);
      const declaredFingerprint = entryFingerprint(entry);
      const declaredProfile = entryProfile(entry);
      if (expectedSha && expectedSha === actualSha && declaredFingerprint && declaredProfile) {
        return {
          ...identity,
          status: ARTIFACT_STATUS_VERIFIED,
          path,
          output: basename(path),
          byte_sha256: actualSha,
          fingerprint: declaredFingerprint,
          profile: declaredProfile,
          entry,
        };
      }
      if (expectedSha && expectedSha === actualSha && (!declaredFingerprint || !declaredProfile)) {
        return {
          ...identity,
          status: ARTIFACT_STATUS_LEGACY_LOCATED,
          reason: !declaredFingerprint
            ? "manifest fingerprint lineage is missing"
            : "manifest profile lineage is missing",
          path,
          candidates: [path],
          entry,
          actual_sha256: actualSha,
        };
      }
      return {
        ...identity,
        status: ARTIFACT_STATUS_MISSING,
        reason: expectedSha ? "artifact SHA-256 mismatch" : "manifest byte SHA-256 missing",
        path,
        entry,
        actual_sha256: actualSha,
      };
    }
    return { ...identity, status: ARTIFACT_STATUS_MISSING, reason: "manifest output is missing", entry, path };
  }

  if (allowLegacyLocate) {
    const candidates = legacyCandidates(directory, slideId);
    if (candidates.length === 1) {
      return {
        ...identity,
        status: ARTIFACT_STATUS_LEGACY_LOCATED,
        reason: manifestError || (entries.length > 0 ? "manifest evidence does not match the requested artifact" : "artifact located without provenance proof"),
        path: candidates[0],
        candidates,
      };
    }
    if (candidates.length > 1) {
      return {
        ...identity,
        status: ARTIFACT_STATUS_AMBIGUOUS,
        reason: "multiple legacy artifact files are locatable without unique provenance",
        candidates,
      };
    }
  }
  return {
    ...identity,
    status: ARTIFACT_STATUS_MISSING,
    reason: manifestError || (entries.length > 0 ? "manifest fingerprint or profile does not match" : "manifest entry missing"),
    candidates: [],
  };
}

export function indexRenderArtifacts(manifest, { defaultEngine = null, defaultKind = null } = {}) {
  const index = new Map();
  for (const entry of normalizeManifestEntries(manifest)) {
    const key = artifactManifestEntryKey({
      slideId: entry.slide_id,
      renderEngine: entryEngine(entry, defaultEngine),
      artifactKind: entryKind(entry, defaultKind),
    });
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(entry);
  }
  return index;
}

export function readArtifactManifest(path) {
  if (!existsSync(path)) return { manifest: null, error: `manifest missing: ${path}` };
  try {
    return { manifest: JSON.parse(readFileSync(path, "utf8")), error: null };
  } catch (error) {
    return { manifest: null, error: `corrupt manifest ${path}: ${error.message}` };
  }
}

export function emptyArtifactManifest() {
  return { version: ARTIFACT_MANIFEST_VERSION, entries: {} };
}

export function writeArtifactManifestAtomic(path, manifest) {
  const temp = `${path}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(temp, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  renameSync(temp, path);
  return path;
}
