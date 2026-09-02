import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

import { sha256Bytes } from "../identity/byte_hash.mjs";
import { pageImageWorkflowPaths } from "../run-bundle/page_image_paths.mjs";
import { currentProtocolInvalid } from "../workflow/current_protocol_invalid.mjs";
import {
  inspectExactPageImagePng,
  pageImageFinalPngForWorkflow,
} from "./page_image_media_contract.mjs";
import {
  createFinalSlideManifest,
  validateAcceptedRawEvidenceForFinalization,
  validateFinalSlideManifest,
  validateRawWorkPlanForFinalization,
} from "./page_image_artifacts.mjs";

export class PageImageFinalManifestError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PageImageFinalManifestError";
    this.code = code;
  }
}

function bytes(value) {
  if (!Buffer.isBuffer(value) && !(value instanceof Uint8Array)) return null;
  const copy = Buffer.from(value);
  return copy.length > 0 ? copy : null;
}

function requireCurrentEvidence({ rawWorkPlan, acceptedRawEvidence }) {
  const plan = validateRawWorkPlanForFinalization(rawWorkPlan);
  if (!plan.ok) throw currentProtocolInvalid("the finalization plan cannot establish current production identity");
  const evidence = validateAcceptedRawEvidenceForFinalization(acceptedRawEvidence, { plan: rawWorkPlan });
  if (!evidence.ok) throw currentProtocolInvalid("the finalization evidence cannot establish current production identity");
  return { plan, evidence };
}

/** Publish a final manifest only from exact current accepted raw evidence.  * Authority: openspec/specs/image-generation/spec.md
 * Authority: openspec/specs/delivery/spec.md
 */
export function publishCurrentFinalSlideManifest({ rawWorkPlan, acceptedRawEvidence, ownerWorkflow, finalBytesBySlide } = {}) {
  requireCurrentEvidence({ rawWorkPlan, acceptedRawEvidence });
  const finalDimensionsBySlide = {};
  for (const slideId of rawWorkPlan.ordered_slide_ids) {
    const media = inspectExactPageImagePng(finalBytesBySlide?.[slideId], pageImageFinalPngForWorkflow(ownerWorkflow));
    if (!media.ok) throw new PageImageFinalManifestError("final_manifest_media_invalid", `final media is invalid for ${slideId}`);
    finalDimensionsBySlide[slideId] = media.actual;
  }
  return createFinalSlideManifest({
    evidence: acceptedRawEvidence,
    expected_workflow: ownerWorkflow,
    final_bytes_by_slide: finalBytesBySlide,
    final_dimensions_by_slide: finalDimensionsBySlide,
  });
}

/** Inspect an existing final artifact without writing, healing, or rebuilding it. */
export function inspectCurrentFinalSlideManifest({ rawWorkPlan, acceptedRawEvidence, manifest, finalBytesBySlide } = {}) {
  try {
    requireCurrentEvidence({ rawWorkPlan, acceptedRawEvidence });
    const checked = validateFinalSlideManifest(manifest, { evidence: acceptedRawEvidence });
    if (!checked.ok) throw new PageImageFinalManifestError(checked.code, checked.message);
    if (!finalBytesBySlide || typeof finalBytesBySlide !== "object" || Array.isArray(finalBytesBySlide)) {
      throw new PageImageFinalManifestError("final_manifest_bytes_unavailable", "current final bytes are unavailable");
    }
    for (const item of manifest.items) {
      const value = bytes(finalBytesBySlide[item.slide_id]);
      if (!value || sha256Bytes(value) !== item.final_sha256) {
        throw new PageImageFinalManifestError("final_manifest_bytes_stale", `final bytes drifted for ${item.slide_id}`);
      }
      if (Object.hasOwn(item, "width")) {
        const media = inspectExactPageImagePng(value, pageImageFinalPngForWorkflow(manifest.workflow));
        if (!media.ok || media.actual.width !== item.width || media.actual.height !== item.height) {
          throw new PageImageFinalManifestError("final_manifest_dimensions_stale", `final dimensions drifted for ${item.slide_id}`);
        }
      }
    }
    return Object.freeze({ ok: true, manifest, sha256: checked.sha256 });
  } catch (error) {
    return Object.freeze({
      ok: false,
      code: error.code || "final_manifest_unavailable",
      next_action: "rebuild_final_through_owner",
    });
  }
}

function readConfinedFinalFile(root, path, label) {
  const resolvedRoot = resolve(root);
  const resolvedPath = resolve(path);
  let physicalRoot;
  let physicalPath;
  try {
    physicalRoot = realpathSync(resolvedRoot);
    physicalPath = realpathSync(resolvedPath);
  } catch {
    throw new PageImageFinalManifestError("final_manifest_bytes_unavailable", `${label} is unavailable`);
  }
  const relation = relative(physicalRoot, physicalPath);
  if (!relation || relation === ".." || relation.startsWith(`..${sep}`) || isAbsolute(relation)) {
    throw new PageImageFinalManifestError("final_manifest_path_invalid", `${label} escapes the final artifact root`);
  }
  let stat;
  try {
    stat = lstatSync(resolvedPath);
  } catch {
    throw new PageImageFinalManifestError("final_manifest_bytes_unavailable", `${label} is unavailable`);
  }
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new PageImageFinalManifestError("final_manifest_path_invalid", `${label} is not a confined regular file`);
  }
  return readFileSync(resolvedPath);
}

/**
 * Inspect a persisted current final projection without rebuilding final media.
 * Missing final publication is availability, while a present invalid record is
 * an owner-issued integrity failure.
 */
export function inspectCurrentFinalSlideManifestFromRun({ runDir, rawWorkPlan, acceptedRawEvidence } = {}) {
  const paths = pageImageWorkflowPaths(runDir);
  if (!existsSync(paths.target_final_manifest)) return Object.freeze({ available: false });
  try {
    const manifestBytes = readConfinedFinalFile(paths.final_root, paths.target_final_manifest, "final manifest");
    let manifest;
    try {
      manifest = JSON.parse(manifestBytes.toString("utf8"));
    } catch {
      throw new PageImageFinalManifestError("final_manifest_invalid", "current final manifest is invalid");
    }
    const finalBytesBySlide = {};
    for (const item of manifest?.items || []) {
      if (typeof item?.path !== "string") {
        throw new PageImageFinalManifestError("final_manifest_invalid", "current final manifest has an invalid item path");
      }
      finalBytesBySlide[item.slide_id] = readConfinedFinalFile(paths.final_root, join(paths.final_root, item.path), `final media ${item.slide_id}`);
    }
    const inspected = inspectCurrentFinalSlideManifest({ rawWorkPlan, acceptedRawEvidence, manifest, finalBytesBySlide });
    if (!inspected.ok) {
      throw new PageImageFinalManifestError(inspected.code, "current final manifest is invalid or stale");
    }
    return Object.freeze({
      available: true,
      paths,
      manifest: inspected.manifest,
      manifest_sha256: inspected.sha256,
      final_bytes_by_slide: Object.freeze(finalBytesBySlide),
    });
  } catch (error) {
    if (error instanceof PageImageFinalManifestError) throw error;
    throw new PageImageFinalManifestError(error?.code || "final_manifest_invalid", "current final manifest is invalid or stale");
  }
}
