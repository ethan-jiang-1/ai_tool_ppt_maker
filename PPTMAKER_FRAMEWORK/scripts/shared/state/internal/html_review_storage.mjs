import { existsSync, readFileSync } from "node:fs";
import { hostname } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { canonicalJsonSha256 } from "../../../contracts/canonical_json.mjs";
import { normalizeFinalSlideRecord, verifyCallerSuppliedBytes } from "../../identity/render_artifacts.mjs";
import { sha256Bytes } from "../../identity/byte_hash.mjs";

const SHA_RE = /^[0-9a-f]{64}$/;
const PUBLISH_LOCK_AUTO_RECOVERY_MIN_AGE_MS = 60_000;

function exactKeys(value, keys, context) {
  const actual = Object.keys(value || {});
  if (actual.length !== keys.length || actual.some((key) => !keys.includes(key))) throw new Error(`${context} has unknown or missing fields`);
}

function ownerAlive(pid) {
  try { process.kill(pid, 0); return true; } catch (error) { return error?.code === "EPERM"; }
}

export function classifyHtmlOwnerLiveness({ host: recordHost, pid, created_at_epoch_ms: createdAt } = {}, { now = Date.now(), host = hostname() } = {}) {
  if (typeof recordHost !== "string" || !recordHost || !Number.isInteger(pid) || pid <= 0 || !Number.isFinite(createdAt)) return Object.freeze({ status: "invalid", reason: "owner record is incomplete" });
  const age = now - createdAt;
  if (!Number.isFinite(age) || age < 0) return Object.freeze({ status: "invalid", reason: "owner record clock data is invalid" });
  const sameHost = recordHost === host;
  if (sameHost && ownerAlive(pid)) return Object.freeze({ status: "active", age_ms: age });
  if (sameHost && age < PUBLISH_LOCK_AUTO_RECOVERY_MIN_AGE_MS) return Object.freeze({ status: "waiting", age_ms: age, retry_after_ms: PUBLISH_LOCK_AUTO_RECOVERY_MIN_AGE_MS - age });
  return Object.freeze({ status: sameHost ? "recoverable" : "uncertain", age_ms: age });
}

function readHtmlPublishLock(ownerRoot) {
  const ownerPath = join(ownerRoot, ".publish.lock", "owner.json");
  if (!existsSync(join(ownerRoot, ".publish.lock"))) return null;
  if (!existsSync(ownerPath)) throw new Error("CONFLICT: HTML publish lock has no owner record");
  let record;
  try { record = JSON.parse(readFileSync(ownerPath, "utf8")); } catch { throw new Error("CONFLICT: HTML publish owner record is invalid JSON"); }
  exactKeys(record, ["schema", "owner_token", "owner_kind", "publication_scope", "html_production_reset_id", "host", "pid", "created_at_epoch_ms", "input_scope_sha256", "prior_manifest_sha256"], "HTML publish owner");
  if (record.schema !== "pptmaker-html-publish-lock-v1" || !SHA_RE.test(record.owner_token || "")) throw new Error("CONFLICT: invalid HTML publish owner record");
  return Object.freeze({ ownerRoot, ownerToken: record.owner_token, record });
}

export function classifyHtmlPublishLock(ownerRoot, options = {}) {
  let lock;
  try { lock = readHtmlPublishLock(ownerRoot); } catch (error) { return Object.freeze({ status: "invalid", reason: error.message, lock: null }); }
  if (!lock) return Object.freeze({ status: "absent", lock: null });
  return Object.freeze({ ...classifyHtmlOwnerLiveness(lock.record, options), lock });
}

function validateReference(ownerRoot, reference, slot) {
  if (reference == null) return;
  exactKeys(reference, ["path", "sha256", "owner", "owner_digest", "composition_variants"], `HTML preview ${slot}`);
  if (typeof reference.path !== "string" || reference.path.includes("\\") || reference.path.split("/").some((part) => !part || part === "." || part === "..") || !(reference.path.startsWith("objects/") || reference.path.startsWith("plans/"))) throw new Error(`HTML preview ${slot} reference path is not confined`);
  const path = join(ownerRoot, ...reference.path.split("/"));
  if (!SHA_RE.test(reference.sha256 || "") || !existsSync(path) || sha256Bytes(readFileSync(path)) !== reference.sha256) throw new Error(`HTML preview ${slot} reference bytes are stale`);
  if (typeof reference.owner !== "string" || !reference.owner || !SHA_RE.test(reference.owner_digest || "")) throw new Error(`HTML preview ${slot} owner is invalid`);
  if (!Array.isArray(reference.composition_variants) || reference.composition_variants.some((variant) => !["effective", "forced-fallback"].includes(variant))) throw new Error(`HTML preview ${slot} composition variants are invalid`);
}

export function readHtmlPreviewManifest(ownerRoot, { publicationScope, htmlProductionResetId = null, logicalRunVersion = null } = {}) {
  const path = join(ownerRoot, "manifest.json");
  if (!existsSync(path)) return null;
  const bytes = readFileSync(path);
  const manifest = JSON.parse(bytes.toString("utf8"));
  exactKeys(manifest, ["schema", "publication_scope", "html_production_reset_id", "pipeline", "logical_run_version", "review_plans", "contact_sheets"], "HTML preview manifest");
  if (manifest.schema !== "pptmaker-html-preview-manifest-v1" || manifest.publication_scope !== publicationScope || manifest.html_production_reset_id !== htmlProductionResetId || manifest.pipeline !== "html-first-v1" || (logicalRunVersion != null && manifest.logical_run_version !== logicalRunVersion)) throw new Error("HTML preview manifest scope/schema/reset mismatch");
  if (!manifest.review_plans || !manifest.contact_sheets) throw new Error("HTML preview manifest slots are incomplete");
  for (const [slot, reference] of Object.entries({ "review_plans.content": manifest.review_plans.content, "review_plans.visual": manifest.review_plans.visual, "contact_sheets.visual_review": manifest.contact_sheets.visual_review, "contact_sheets.delivery": manifest.contact_sheets.delivery })) validateReference(ownerRoot, reference, slot);
  return Object.freeze({ path, sha256: sha256Bytes(bytes), manifest });
}

export function resolveHtmlFinalSlideArtifacts({ runDir, ownerRoot, plan, htmlProductionResetId = null }) {
  if (typeof ownerRoot !== "string" || !ownerRoot) throw new TypeError("final-slide owner root is required");
  const manifestPath = join(ownerRoot, "manifest.json");
  if (!existsSync(manifestPath)) throw new Error("current HTML final-slide manifest is missing; run local Stage 3 first");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.schema !== "pptmaker-html-final-slides-manifest-v1" || manifest.publication_scope !== "canonical-run" || manifest.html_production_reset_id !== htmlProductionResetId || !Array.isArray(manifest.entries)) throw new Error("HTML final-slide manifest scope/schema/reset mismatch");
  const byId = new Map(manifest.entries.map((entry) => [entry.slide_id, entry]));
  const adapted = plan.slides.map((slide) => {
    const source = byId.get(slide.slide_id);
    if (!source || source.composition_variant !== "effective") throw new Error(`HTML final-slide evidence is missing for ${slide.slide_id}`);
    const path = resolve(ownerRoot, ...String(source.path || "").split("/"));
    const ownerRelative = relative(ownerRoot, path).split(sep).join("/");
    if (!ownerRelative.startsWith("objects/") || !existsSync(path)) throw new Error(`HTML final-slide receipt drifted for ${slide.slide_id}`);
    verifyCallerSuppliedBytes({ bytes: readFileSync(path), declaredSha256: source.sha256 });
    return { common: normalizeFinalSlideRecord({ slideId: source.slide_id, producer: source.producer, producerPrivateFingerprint: source.composition_fingerprint, byteSha256: source.sha256, width: source.width, height: source.height, mediaProfile: source.media_profile, declaredFingerprint: source.final_slide_fingerprint, path: relative(runDir, path).split(sep).join("/"), absolutePath: path }), composition_fingerprint: source.composition_fingerprint };
  });
  const htmlDeliveryDigest = canonicalJsonSha256({ schema: "html_delivery_digest_v1", ordered_plan_digest: plan.ordered_plan_digest, slides: adapted.map((entry) => ({ slide_id: entry.common.slide_id, composition_fingerprint: entry.composition_fingerprint, png_sha256: entry.common.sha256 })) });
  return Object.freeze({ entries: adapted.map((entry) => entry.common), html_delivery_digest: htmlDeliveryDigest });
}
