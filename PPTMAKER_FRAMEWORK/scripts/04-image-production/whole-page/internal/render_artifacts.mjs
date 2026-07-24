import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";
import { loadImage } from "@napi-rs/canvas";
import { canonicalJson, canonicalJsonSha256 } from "../../../shared/identity/canonical_json.mjs";
import { sha256File } from "../../../shared/identity/byte_hash.mjs";
import {
  ARTIFACT_KIND_FINAL_SLIDE,
  ARTIFACT_MANIFEST_VERSION,
  ARTIFACT_STATUS_AMBIGUOUS,
  ARTIFACT_STATUS_MISSING,
  ARTIFACT_STATUS_VERIFIED,
  WHOLE_PAGE_ARTIFACT_PIPELINE,
  artifactIdentity,
  artifactManifestEntryKey,
  normalizeFinalSlideRecord,
  verifyCallerSuppliedBytes,
} from "../../../shared/identity/render_artifacts.mjs";

function normalizeManifestEntries(manifest) {
  const entries = [];
  if (!isCurrentWholePageManifest(manifest)) return entries;
  if (manifest.entries && typeof manifest.entries === "object" && !Array.isArray(manifest.entries)) {
    entries.push(...Object.values(manifest.entries).filter((entry) => entry && typeof entry === "object"));
  }
  if (manifest.slides && typeof manifest.slides === "object" && !Array.isArray(manifest.slides)) {
    entries.push(...Object.entries(manifest.slides).flatMap(([slideId, value]) => {
      if (Array.isArray(value)) return value.filter((entry) => entry && typeof entry === "object").map((entry) => ({ slide_id: entry.slide_id || slideId, ...entry }));
      return value && typeof value === "object" ? [{ slide_id: value.slide_id || slideId, ...value }] : [];
    }));
  }
  return entries;
}

function isCurrentWholePageManifest(manifest) {
  return Boolean(
    manifest
    && typeof manifest === "object"
    && manifest.version === ARTIFACT_MANIFEST_VERSION
    && manifest.pipeline === WHOLE_PAGE_ARTIFACT_PIPELINE
    && ((manifest.entries && typeof manifest.entries === "object" && !Array.isArray(manifest.entries))
      || (manifest.slides && typeof manifest.slides === "object" && !Array.isArray(manifest.slides))),
  );
}

const entryEngine = (entry, fallback) => entry.render_engine || entry.engine || fallback || null;
const entryKind = (entry, fallback) => entry.artifact_kind || entry.kind || fallback || null;
const entryFingerprint = (entry) => entry.fingerprint || entry.generation_fingerprint || entry.header_fingerprint || null;
const entryProfile = (entry) => entry.generation_profile || entry.profile || null;
const entryOutputSha = (entry) => entry.output_sha256 || entry.image_sha256 || entry.final_sha256 || null;
const profileMatches = (actual, expected) => expected == null || (actual != null && canonicalJson(actual) === canonicalJson(expected));

export function resolveRenderArtifact({ directory, manifest, manifestError = null, slideId, renderEngine, artifactKind, fingerprint = null, profile = null, defaultEngine = null, defaultKind = null }) {
  const identity = artifactIdentity({ slideId, renderEngine, artifactKind, fingerprint });
  if (manifestError || !isCurrentWholePageManifest(manifest)) {
    return {
      ...identity,
      status: ARTIFACT_STATUS_MISSING,
      reason: manifestError || "current whole-page artifact manifest is missing or invalid",
      candidates: [],
    };
  }
  const entries = normalizeManifestEntries(manifest).filter((entry) =>
    String(entry.slide_id || "") === String(slideId) &&
    entryEngine(entry, defaultEngine) === renderEngine &&
    entryKind(entry, defaultKind) === artifactKind);
  const matching = entries.filter((entry) =>
    (fingerprint == null || entryFingerprint(entry) === fingerprint) && profileMatches(entryProfile(entry), profile));
  if (matching.length > 1) return { ...identity, status: ARTIFACT_STATUS_AMBIGUOUS, reason: "multiple manifest entries match the requested artifact identity", candidates: matching };
  if (matching.length === 1 && !manifestError) {
    const entry = matching[0];
    const output = entry.output || entry.path;
    const stableOutput = `${slideId}.png`;
    if (output !== stableOutput || basename(output) !== stableOutput) {
      return { ...identity, status: ARTIFACT_STATUS_MISSING, reason: "manifest output is not stable ID-addressed", entry, candidates: [] };
    }
    const path = join(directory, output);
    if (path && existsSync(path)) {
      let actualSha;
      try { actualSha = sha256File(path); } catch (error) { return { ...identity, status: ARTIFACT_STATUS_MISSING, reason: `artifact unreadable: ${error.message}`, entry, path }; }
      const expectedSha = entryOutputSha(entry);
      const declaredFingerprint = entryFingerprint(entry);
      const declaredProfile = entryProfile(entry);
      if (expectedSha && expectedSha === actualSha && declaredFingerprint && declaredProfile) {
        return { ...identity, status: ARTIFACT_STATUS_VERIFIED, path, output: basename(path), byte_sha256: actualSha, fingerprint: declaredFingerprint, profile: declaredProfile, entry };
      }
      return { ...identity, status: ARTIFACT_STATUS_MISSING, reason: expectedSha ? "artifact SHA-256 mismatch" : "manifest byte SHA-256 missing", path, entry, actual_sha256: actualSha };
    }
    return { ...identity, status: ARTIFACT_STATUS_MISSING, reason: "manifest output is missing", entry, path };
  }
  return { ...identity, status: ARTIFACT_STATUS_MISSING, reason: entries.length > 0 ? "manifest fingerprint or profile does not match" : "manifest entry missing", candidates: [] };
}

export function indexRenderArtifacts(manifest, { defaultEngine = null, defaultKind = null } = {}) {
  const index = new Map();
  for (const entry of normalizeManifestEntries(manifest)) {
    const key = artifactManifestEntryKey({ slideId: entry.slide_id, renderEngine: entryEngine(entry, defaultEngine), artifactKind: entryKind(entry, defaultKind) });
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(entry);
  }
  return index;
}

export function readArtifactManifest(path) {
  if (!existsSync(path)) return { manifest: null, error: `manifest missing: ${path}` };
  try {
    const manifest = JSON.parse(readFileSync(path, "utf8"));
    if (!isCurrentWholePageManifest(manifest) || !manifest.entries || Array.isArray(manifest.entries)) {
      return { manifest: null, error: `invalid current whole-page artifact manifest: ${path}` };
    }
    return { manifest, error: null };
  }
  catch (error) { return { manifest: null, error: `corrupt manifest ${path}: ${error.message}` }; }
}

export function writeArtifactManifestAtomic(path, manifest) {
  const temp = `${path}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(temp, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  renameSync(temp, path);
  return path;
}

export async function adaptWholePageFinalSlideArtifacts({ runDir, artifacts }) {
  if (!Array.isArray(artifacts)) throw new TypeError("whole-page final-slide adapter requires verified artifacts");
  const entries = [];
  for (const artifact of artifacts) {
    if (artifact.status !== ARTIFACT_STATUS_VERIFIED || artifact.artifact_kind !== ARTIFACT_KIND_FINAL_SLIDE) throw new Error(`whole-page final-slide artifact is not verified for ${artifact.slide_id}`);
    const bytes = readFileSync(artifact.path);
    verifyCallerSuppliedBytes({ bytes, declaredSha256: artifact.byte_sha256 });
    const image = await loadImage(bytes);
    const mediaProfile = `whole-page-final-slide-v1:${canonicalJsonSha256({ profile: artifact.profile, width: image.width, height: image.height })}`;
    const privateFingerprint = canonicalJsonSha256({ fingerprint: artifact.fingerprint, profile: artifact.profile });
    entries.push(normalizeFinalSlideRecord({ slideId: artifact.slide_id, producer: "whole-page-image2-stage3-v1", producerPrivateFingerprint: privateFingerprint, byteSha256: artifact.byte_sha256, width: image.width, height: image.height, mediaProfile, path: relative(runDir, artifact.path).split(sep).join("/"), absolutePath: artifact.path }));
  }
  return Object.freeze(entries);
}
