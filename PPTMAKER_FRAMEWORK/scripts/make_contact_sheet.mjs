#!/usr/bin/env node
/**
 * Contact sheet — tile slide PNGs into one QA preview JPEG.
 *
 * In-framework Node (@napi-rs/canvas). No external skills.
 *
 * Usage:
 *   node make_contact_sheet.mjs \
 *     --image-dir .../page_images_full \
 *     --out .../preview/contact_sheet.jpg \
 *     [--prompt-json .../_prompts.json] \
 *     [--columns 4]
 */

import { createCanvas, loadImage } from "@napi-rs/canvas";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";

const __filename = fileURLToPath(import.meta.url);

const CELL_W = 420;
const CELL_H = 236;
const LABEL_H = 28;
const PAD = 12;
const BG = "#1a1d24";
const LABEL_COLOR = "#e8eef6";

/**
 * Resolve ordered image paths from an optional prompt JSON, else directory listing.
 * @param {string} imageDir
 * @param {string|null} promptJson
 * @returns {Array<{id:string, path:string}>}
 */
export function resolveImageEntries(imageDir, promptJson = null) {
  /** @type {Array<{id:string, path:string}>} */
  const entries = [];

  if (promptJson && existsSync(promptJson)) {
    const data = JSON.parse(readFileSync(promptJson, "utf-8"));
    const slides = data.slides || data.prompts || [];
    for (const slide of slides) {
      const outName = slide.out || `${slide.id}.png`;
      const p = join(imageDir, outName);
      if (existsSync(p)) {
        entries.push({ id: slide.id || basename(outName, ".png"), path: p });
      }
    }
    if (entries.length > 0) return entries;
  }

  if (!existsSync(imageDir)) return entries;
  const files = readdirSync(imageDir)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .sort();
  for (const f of files) {
    entries.push({ id: basename(f).replace(/\.(png|jpe?g|webp)$/i, ""), path: join(imageDir, f) });
  }
  return entries;
}

/**
 * @param {object} opts
 * @param {string} opts.imageDir
 * @param {string} opts.out
 * @param {string|null} [opts.promptJson]
 * @param {number} [opts.columns]
 * @param {boolean} [opts.dryRun]
 * @returns {Promise<{count:number, out:string}>}
 */
export async function makeContactSheet({
  imageDir,
  out,
  promptJson = null,
  columns = 4,
  dryRun = false,
} = {}) {
  const cols = Math.max(1, Number(columns) || 4);
  const entries = resolveImageEntries(imageDir, promptJson);
  if (entries.length === 0) {
    throw new Error(`No images found in ${imageDir}`);
  }

  if (dryRun) {
    console.log(`  [DRY RUN] Would write contact sheet (${entries.length} images) → ${out}`);
    return { count: entries.length, out };
  }

  const rows = Math.ceil(entries.length / cols);
  const width = PAD * 2 + cols * CELL_W + (cols - 1) * PAD;
  const height = PAD * 2 + rows * (CELL_H + LABEL_H) + (rows - 1) * PAD;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);
  ctx.font = "16px sans-serif";
  ctx.fillStyle = LABEL_COLOR;

  for (let i = 0; i < entries.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = PAD + col * (CELL_W + PAD);
    const y = PAD + row * (CELL_H + LABEL_H + PAD);

    try {
      const img = await loadImage(entries[i].path);
      ctx.drawImage(img, x, y, CELL_W, CELL_H);
    } catch (err) {
      ctx.fillStyle = "#333";
      ctx.fillRect(x, y, CELL_W, CELL_H);
      ctx.fillStyle = "#f66";
      ctx.fillText("load fail", x + 8, y + 24);
      ctx.fillStyle = LABEL_COLOR;
    }
    ctx.fillText(entries[i].id, x + 4, y + CELL_H + 20);
  }

  mkdirSync(dirname(out), { recursive: true });
  const jpeg = canvas.toBuffer("image/jpeg", 85);
  writeFileSync(out, jpeg);
  console.log(`  Contact sheet: ${out} (${entries.length} images, ${cols} cols)`);
  return { count: entries.length, out };
}

/**
 * @param {string[]} [argv]
 */
export async function main(argv = process.argv) {
  const program = new Command();
  program
    .name("make_contact_sheet.mjs")
    .description("Tile slide images into a QA contact sheet (Node, in-framework)")
    .requiredOption("--image-dir <path>", "Directory of slide images")
    .requiredOption("--out <path>", "Output JPEG path")
    .option("--prompt-json <path>", "Optional _prompts.json for ordering")
    .option("--columns <n>", "Grid columns", "4")
    .option("--dry-run", "Print plan only")
    .action(async (opts) => {
      try {
        await makeContactSheet({
          imageDir: opts.imageDir,
          out: opts.out,
          promptJson: opts.promptJson || null,
          columns: Number(opts.columns),
          dryRun: !!opts.dryRun,
        });
        process.exit(0);
      } catch (err) {
        console.error(`✗ ${err.message}`);
        process.exit(1);
      }
    });
  await program.parseAsync(argv);
}

if (process.argv[1] === __filename || process.argv[1]?.endsWith("/make_contact_sheet.mjs")) {
  main();
}
