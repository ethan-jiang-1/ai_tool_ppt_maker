import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { pageAuthorityImage2Paths } from "../../shared/run-bundle/bundle_layout.mjs";

const PAGE_AUTHORITY_FINAL_MANIFEST_SCHEMA = "pptmaker-page-authority-final-manifest-v1";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function writeAtomic(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = join(dirname(path), `.final.tmp-${process.pid}`);
  writeFileSync(temporary, bytes);
  renameSync(temporary, path);
}

/** Render an observation-only projection from a verified CURRENT final manifest. */
export async function renderPageAuthorityFinalProjection(runDir) {
  const paths = pageAuthorityImage2Paths(runDir);
  if (!existsSync(paths.final_manifest)) throw new Error("Page Authority final manifest is missing");
  const manifest = JSON.parse(readFileSync(paths.final_manifest, "utf8"));
  if (manifest.schema !== PAGE_AUTHORITY_FINAL_MANIFEST_SCHEMA || !Array.isArray(manifest.entries) || !manifest.entries.length) {
    throw new Error("Page Authority final manifest is invalid");
  }
  const width = 1032;
  const cellWidth = 500;
  const cellHeight = 281;
  const padding = 16;
  const labelHeight = 34;
  const rows = Math.ceil(manifest.entries.length / 2);
  const canvas = createCanvas(width, padding * 2 + rows * (cellHeight + labelHeight) + Math.max(0, rows - 1) * padding);
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (const [index, entry] of manifest.entries.entries()) {
    const x = padding + (index % 2) * (cellWidth + padding);
    const y = padding + Math.floor(index / 2) * (cellHeight + labelHeight + padding);
    context.drawImage(await loadImage(readFileSync(join(paths.final_root, entry.path))), x, y, cellWidth, cellHeight);
    context.fillStyle = "#17212b";
    context.font = "700 16px Arial";
    context.fillText(entry.slide_id, x, y + cellHeight + 22);
  }
  const bytes = canvas.toBuffer("image/png");
  writeAtomic(paths.final_projection, bytes);
  return Object.freeze({ path: paths.final_projection, sha256: sha256(bytes) });
}
