import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import PptxGenJS from "pptxgenjs";
import { canonicalJson } from "../../contracts/canonical_json.mjs";
import { pageAuthorityImage2Paths } from "../../shared/run-bundle/bundle_layout.mjs";
import { addPageAuthorityOrdinalFooter } from "./page_authority_ordinal_footer.mjs";
const PAGE_AUTHORITY_FINAL_MANIFEST_SCHEMA = "pptmaker-page-authority-final-manifest-v1";

export const PAGE_AUTHORITY_PPTX_ASSEMBLY_SCHEMA = "pptmaker-page-authority-pptx-assembly-v1";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const atomicJson = (path, value) => { mkdirSync(join(path, ".."), { recursive: true }); const tmp = `${path}.tmp-${process.pid}`; writeFileSync(tmp, `${canonicalJson(value)}\n`); renameSync(tmp, path); };
const SHA256_RE = /^[0-9a-f]{64}$/;
const SLIDE_ID_RE = /^[A-Za-z][A-Za-z0-9_-]{0,127}$/;

/** Validate the closed Page Authority final lineage before any PPTX writer is created. */
export function validatePageAuthorityAssemblyInput(manifest, { sourceEpoch } = {}) {
  if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0) throw new Error("current Page Authority source epoch is required for assembly");
  if (!manifest || manifest.schema !== PAGE_AUTHORITY_FINAL_MANIFEST_SCHEMA || manifest.source_epoch !== sourceEpoch ||
    !SHA256_RE.test(manifest.raw_review_coverage_sha256 || "") || !Array.isArray(manifest.entries) || !manifest.entries.length) {
    throw new Error("Page Authority final manifest is invalid or stale");
  }
  const ids = new Set();
  for (const entry of manifest.entries) {
    if (!entry || !SLIDE_ID_RE.test(entry.slide_id || "") || ids.has(entry.slide_id) ||
      !["pure-image2", "framed-image2"].includes(entry.authority) || entry.path !== `${entry.slide_id}.png` ||
      !SHA256_RE.test(entry.final_sha256 || "") || !SHA256_RE.test(entry.raw_sha256 || "") ||
      !SHA256_RE.test(entry.raw_image_contract_digest || "") || !SHA256_RE.test(entry.raw_generation_profile_digest || "") ||
      !SHA256_RE.test(entry.finalization_fingerprint || "") || entry.width !== 2000 || entry.height !== 1125 ||
      typeof entry.media_profile !== "string" || !entry.media_profile) {
      throw new Error("Page Authority final manifest contains an invalid current entry");
    }
    ids.add(entry.slide_id);
  }
  return Object.freeze({ entries: Object.freeze([...manifest.entries]), ordered_slide_ids: Object.freeze([...ids]) });
}

/** Assemble only verified, lexical Page Authority final entries. */
export async function assemblePageAuthorityPptx(runDir, { title = "Presentation", sourceEpoch } = {}) {
  const paths = pageAuthorityImage2Paths(runDir);
  if (!existsSync(paths.final_manifest)) throw new Error("Page Authority final manifest is missing");
  const manifest = JSON.parse(readFileSync(paths.final_manifest, "utf8"));
  const input = validatePageAuthorityAssemblyInput(manifest, { sourceEpoch });
  const pptxPath = join(paths.final_root, "deck.pptx"); const temporary = `${pptxPath}.tmp-${process.pid}.pptx`;
  const pptx = new PptxGenJS(); pptx.layout = "LAYOUT_WIDE"; pptx.author = "PPT Maker Framework"; pptx.title = title;
  for (const [index, entry] of input.entries.entries()) {
    const path = join(paths.final_root, entry.path);
    if (!existsSync(path) || sha256(readFileSync(path)) !== entry.final_sha256) throw new Error(`final Page Authority PNG drifted for ${entry.slide_id}`);
    const slide = pptx.addSlide();
    slide.addImage({ path, x: 0, y: 0, w: 13.333333, h: 7.5 });
    addPageAuthorityOrdinalFooter(slide, index + 1);
  }
  try { await pptx.writeFile({ fileName: temporary }); renameSync(temporary, pptxPath); } catch (error) { rmSync(temporary, { force: true }); throw error; }
  const receipt = { schema: PAGE_AUTHORITY_PPTX_ASSEMBLY_SCHEMA, source_epoch: sourceEpoch, final_manifest_sha256: sha256(readFileSync(paths.final_manifest)), ordered_slide_ids: input.ordered_slide_ids, final_entries: input.entries.map((entry) => ({ slide_id: entry.slide_id, final_sha256: entry.final_sha256, finalization_fingerprint: entry.finalization_fingerprint })), pptx_path: relative(runDir, pptxPath).split("\\").join("/"), pptx_sha256: sha256(readFileSync(pptxPath)) };
  atomicJson(join(paths.final_root, "pptx-assembly.json"), receipt);
  return Object.freeze({ pptx_path: pptxPath, receipt });
}
