import { createHash } from "node:crypto";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { canonicalJson } from "../../contracts/canonical_json.mjs";
import { injectNotes } from "./internal/notes_runtime.mjs";
import { pageAuthorityImage2Paths } from "../../shared/run-bundle/bundle_layout.mjs";
import { PAGE_AUTHORITY_PPTX_ASSEMBLY_SCHEMA } from "./pptx_assembly.mjs";
import { PAGE_AUTHORITY_FINAL_MANIFEST_SCHEMA } from "./final_manifest.mjs";

export const PAGE_AUTHORITY_NOTES_RECEIPT_SCHEMA = "pptmaker-page-authority-notes-receipt-v1";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Validate notes against the exact current Page Authority assembly lineage. */
export function validatePageAuthorityNotesInput({ assembly, finalManifest, finalManifestSha256, notesBySlide, sourceEpoch } = {}) {
  if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0) throw new Error("current Page Authority source epoch is required for notes injection");
  if (!assembly || assembly.schema !== PAGE_AUTHORITY_PPTX_ASSEMBLY_SCHEMA || assembly.source_epoch !== sourceEpoch || !Array.isArray(assembly.ordered_slide_ids) ||
    !finalManifest || finalManifest.schema !== PAGE_AUTHORITY_FINAL_MANIFEST_SCHEMA || finalManifest.source_epoch !== sourceEpoch ||
    assembly.final_manifest_sha256 !== finalManifestSha256) throw new Error("Page Authority assembly lineage is invalid or stale");
  if (!notesBySlide || typeof notesBySlide !== "object" || Array.isArray(notesBySlide) || Object.keys(notesBySlide).sort().join("\n") !== [...assembly.ordered_slide_ids].sort().join("\n")) {
    throw new Error("notes_by_slide must exactly cover final manifest slide IDs");
  }
  return Object.freeze({ ordered_slide_ids: Object.freeze([...assembly.ordered_slide_ids]) });
}

export async function injectPageAuthorityNotes(runDir, { notes_by_slide, sourceEpoch } = {}) {
  const paths = pageAuthorityImage2Paths(runDir); const assemblyPath = join(paths.final_root, "pptx-assembly.json");
  if (!existsSync(assemblyPath)) throw new Error("Page Authority PPTX assembly receipt is missing");
  const assembly = JSON.parse(readFileSync(assemblyPath, "utf8"));
  const finalManifest = JSON.parse(readFileSync(paths.final_manifest, "utf8"));
  const finalManifestSha256 = sha256(readFileSync(paths.final_manifest));
  const input = validatePageAuthorityNotesInput({ assembly, finalManifest, finalManifestSha256, notesBySlide: notes_by_slide, sourceEpoch });
  const notes = input.ordered_slide_ids.map((id) => notes_by_slide[id]);
  const pptxPath = join(runDir, assembly.pptx_path);
  const assembledSha = sha256(readFileSync(pptxPath));
  if (assembledSha !== assembly.pptx_sha256) throw new Error("Page Authority assembled PPTX is stale before notes injection");
  const result = await injectNotes({ pptx: pptxPath, notes });
  const receipt = { schema: PAGE_AUTHORITY_NOTES_RECEIPT_SCHEMA, source_epoch: sourceEpoch, assembly_receipt_sha256: sha256(readFileSync(assemblyPath)), final_manifest_sha256: assembly.final_manifest_sha256, ordered_slide_ids: assembly.ordered_slide_ids, notes_fingerprint: sha256(Buffer.from(canonicalJson(notes_by_slide))), pptx_sha256: sha256(readFileSync(pptxPath)), notes_injected: result.notesInjected };
  const path = join(paths.final_root, "notes-receipt.json"); const tmp = `${path}.tmp-${process.pid}`; writeFileSync(tmp, `${canonicalJson(receipt)}\n`); renameSync(tmp, path);
  return Object.freeze({ path, receipt });
}
