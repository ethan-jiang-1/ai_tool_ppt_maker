import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import PptxGenJS from "pptxgenjs";
import { canonicalJson } from "../../contracts/canonical_json.mjs";
import { pageAuthorityImage2Paths } from "../../shared/run-bundle/bundle_layout.mjs";
import { PAGE_AUTHORITY_FINAL_MANIFEST_SCHEMA } from "./final_manifest.mjs";

export const PAGE_AUTHORITY_PPTX_ASSEMBLY_SCHEMA = "pptmaker-page-authority-pptx-assembly-v1";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const atomicJson = (path, value) => { mkdirSync(join(path, ".."), { recursive: true }); const tmp = `${path}.tmp-${process.pid}`; writeFileSync(tmp, `${canonicalJson(value)}\n`); renameSync(tmp, path); };

/** Assemble only verified, lexical Page Authority final entries. */
export async function assemblePageAuthorityPptx(runDir, { title = "Presentation" } = {}) {
  const paths = pageAuthorityImage2Paths(runDir);
  if (!existsSync(paths.final_manifest)) throw new Error("Page Authority final manifest is missing");
  const manifest = JSON.parse(readFileSync(paths.final_manifest, "utf8"));
  if (manifest.schema !== PAGE_AUTHORITY_FINAL_MANIFEST_SCHEMA || !Array.isArray(manifest.entries) || !manifest.entries.length) throw new Error("Page Authority final manifest is invalid");
  const ids = manifest.entries.map((entry) => entry.slide_id);
  if (new Set(ids).size !== ids.length) throw new Error("Page Authority final manifest has duplicate slide IDs");
  const pptxPath = join(paths.final_root, "deck.pptx"); const temporary = `${pptxPath}.tmp-${process.pid}.pptx`;
  const pptx = new PptxGenJS(); pptx.layout = "LAYOUT_WIDE"; pptx.author = "PPT Maker Framework"; pptx.title = title;
  for (const entry of manifest.entries) {
    const path = join(paths.final_root, entry.path);
    if (!existsSync(path) || sha256(readFileSync(path)) !== entry.final_sha256) throw new Error(`final Page Authority PNG drifted for ${entry.slide_id}`);
    pptx.addSlide().addImage({ path, x: 0, y: 0, w: 13.333333, h: 7.5 });
  }
  try { await pptx.writeFile({ fileName: temporary }); renameSync(temporary, pptxPath); } catch (error) { rmSync(temporary, { force: true }); throw error; }
  const receipt = { schema: PAGE_AUTHORITY_PPTX_ASSEMBLY_SCHEMA, final_manifest_sha256: sha256(readFileSync(paths.final_manifest)), ordered_slide_ids: ids, final_entries: manifest.entries.map((entry) => ({ slide_id: entry.slide_id, final_sha256: entry.final_sha256, finalization_fingerprint: entry.finalization_fingerprint })), pptx_path: relative(runDir, pptxPath).split("\\").join("/"), pptx_sha256: sha256(readFileSync(pptxPath)) };
  atomicJson(join(paths.final_root, "pptx-assembly.json"), receipt);
  return Object.freeze({ pptx_path: pptxPath, receipt });
}
