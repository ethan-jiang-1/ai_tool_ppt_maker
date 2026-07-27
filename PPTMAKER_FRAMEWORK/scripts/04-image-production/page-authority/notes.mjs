import { createHash } from "node:crypto";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { canonicalJson } from "../../contracts/canonical_json.mjs";
import { injectNotes } from "../../03-html-production/index.mjs";
import { pageAuthorityImage2Paths } from "../../shared/run-bundle/bundle_layout.mjs";
import { PAGE_AUTHORITY_PPTX_ASSEMBLY_SCHEMA } from "./pptx_assembly.mjs";

export const PAGE_AUTHORITY_NOTES_RECEIPT_SCHEMA = "pptmaker-page-authority-notes-receipt-v1";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function injectPageAuthorityNotes(runDir, { notes_by_slide } = {}) {
  const paths = pageAuthorityImage2Paths(runDir); const assemblyPath = join(paths.final_root, "pptx-assembly.json");
  if (!existsSync(assemblyPath)) throw new Error("Page Authority PPTX assembly receipt is missing");
  const assembly = JSON.parse(readFileSync(assemblyPath, "utf8"));
  if (assembly.schema !== PAGE_AUTHORITY_PPTX_ASSEMBLY_SCHEMA || !Array.isArray(assembly.ordered_slide_ids)) throw new Error("Page Authority PPTX assembly receipt is invalid");
  if (!notes_by_slide || typeof notes_by_slide !== "object" || Array.isArray(notes_by_slide) || Object.keys(notes_by_slide).sort().join("\n") !== [...assembly.ordered_slide_ids].sort().join("\n")) throw new Error("notes_by_slide must exactly cover final manifest slide IDs");
  const notes = assembly.ordered_slide_ids.map((id) => notes_by_slide[id]);
  const pptxPath = join(runDir, assembly.pptx_path);
  const assembledSha = sha256(readFileSync(pptxPath));
  if (assembledSha !== assembly.pptx_sha256) throw new Error("Page Authority assembled PPTX is stale before notes injection");
  const result = await injectNotes({ pptx: pptxPath, notes });
  const receipt = { schema: PAGE_AUTHORITY_NOTES_RECEIPT_SCHEMA, assembly_receipt_sha256: sha256(readFileSync(assemblyPath)), final_manifest_sha256: assembly.final_manifest_sha256, ordered_slide_ids: assembly.ordered_slide_ids, notes_fingerprint: sha256(Buffer.from(canonicalJson(notes_by_slide))), pptx_sha256: sha256(readFileSync(pptxPath)), notes_injected: result.notesInjected };
  const path = join(paths.final_root, "notes-receipt.json"); const tmp = `${path}.tmp-${process.pid}`; writeFileSync(tmp, `${canonicalJson(receipt)}\n`); renameSync(tmp, path);
  return Object.freeze({ path, receipt });
}
