import { existsSync, readFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { decode as decodePng } from "fast-png";
import { canonicalJsonSha256 } from "../../shared/identity/canonical_json.mjs";
import { normalizeFinalSlideRecord, verifyCallerSuppliedBytes } from "../../shared/identity/render_artifacts.mjs";
import { HTML_FINAL_SLIDES_MANIFEST_SCHEMA, htmlOwnerRoot, readHtmlCurrentManifest } from "./html_object_store.mjs";

export function adaptHtmlFinalSlideManifest({ runDir, ownerRoot, manifest, plan }) {
  if (!manifest || manifest.schema !== HTML_FINAL_SLIDES_MANIFEST_SCHEMA || manifest.publication_scope !== "canonical-run" || !Array.isArray(manifest.entries) || !plan || !Array.isArray(plan.slides)) throw new Error("HTML final-slide adapter received an invalid current manifest or plan");
  const byId = new Map(manifest.entries.map((entry) => [entry.slide_id, entry]));
  const adapted = plan.slides.map((slide) => {
    const source = byId.get(slide.slide_id);
    if (!source || source.composition_variant !== "effective") throw new Error(`HTML final-slide evidence is missing for ${slide.slide_id}`);
    const path = resolve(ownerRoot, ...String(source.path || "").split("/"));
    const relOwner = relative(ownerRoot, path).split(sep).join("/");
    if (!relOwner.startsWith("objects/") || !existsSync(path)) throw new Error(`HTML final-slide receipt drifted for ${slide.slide_id}`);
    const bytes = readFileSync(path);
    verifyCallerSuppliedBytes({ bytes, declaredSha256: source.sha256 });
    const png = decodePng(bytes, { checkCrc: true });
    if (png.width !== source.width || png.height !== source.height) throw new Error(`HTML final-slide dimensions drifted for ${slide.slide_id}`);
    return {
      common: normalizeFinalSlideRecord({ slideId: source.slide_id, producer: source.producer, producerPrivateFingerprint: source.composition_fingerprint, byteSha256: source.sha256, width: source.width, height: source.height, mediaProfile: source.media_profile, declaredFingerprint: source.final_slide_fingerprint, path: relative(runDir, path).split(sep).join("/"), absolutePath: path }),
      composition_fingerprint: source.composition_fingerprint,
    };
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
