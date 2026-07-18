#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { encode as encodePng } from "fast-png";

const ENTRY_COUNT = 512;
const EXPECTED_TOTAL_BYTES = 512 * 1024 * 1024;
const MAX_RUNTIME_MS = 120_000;
const MAX_PEAK_RSS_BYTES = 768 * 1024 * 1024;

function sizedSvg(targetBytes) {
  const prefix = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><!--');
  const suffix = Buffer.from('--><path d="M0 0h10v10z"/></svg>\n');
  const padding = Buffer.alloc(targetBytes - prefix.length - suffix.length, 0x78);
  return Buffer.concat([prefix, padding, suffix]);
}

function nearLimitPng() {
  const width = 2200; const height = 2200;
  const data = new Uint8Array(width * height * 4);
  let state = 0x12345678;
  for (let index = 0; index < data.length; index += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    data[index] = state >>> 24;
  }
  return Buffer.from(encodePng({ width, height, data, channels: 4, depth: 8 }));
}

function sampleRss(pid) {
  const result = spawnSync("ps", ["-o", "rss=", "-p", String(pid)], { encoding: "utf8" });
  const kib = Number.parseInt(String(result.stdout || "").trim(), 10);
  return Number.isFinite(kib) ? kib * 1024 : 0;
}

async function main() {
  const root = mkdtempSync(join(tmpdir(), "html-catalog-worst-case-"));
  try {
    const runDir = join(root, "deck_benchmark", "3_versions", "v1");
    const assetsDir = join(root, "deck_benchmark", "2_backbone", "visual-style", "assets");
    const svgDir = join(assetsDir, "svg");
    mkdirSync(runDir, { recursive: true });
    mkdirSync(svgDir, { recursive: true });
    const raster = nearLimitPng();
    if (raster.length > 20 * 1024 * 1024) throw new Error(`generated raster ${raster.length} exceeds 20 MiB`);
    const remainingBytes = EXPECTED_TOTAL_BYTES - raster.length;
    const svgCount = ENTRY_COUNT - 1;
    const commonSvgBytes = Math.floor(remainingBytes / svgCount);
    const finalSvgBytes = remainingBytes - commonSvgBytes * (svgCount - 1);
    const manifest = ["version: 2", "assets:"];
    for (let index = 0; index < ENTRY_COUNT; index += 1) {
      const token = String(index).padStart(3, "0");
      const id = `worst_${token}`;
      const isRaster = index === 0;
      const path = isRaster ? `reference/worst-${token}.png` : `svg/worst-${token}.svg`;
      const bytes = isRaster ? raster : sizedSvg(index === ENTRY_COUNT - 1 ? finalSvgBytes : commonSvgBytes);
      const digest = createHash("sha256").update(bytes).digest("hex");
      mkdirSync(join(assetsDir, isRaster ? "reference" : "svg"), { recursive: true });
      writeFileSync(join(assetsDir, path), bytes);
      manifest.push(`  ${id}:`);
      manifest.push(`    path: ${path}`);
      manifest.push(`    type: ${isRaster ? "png" : "svg"}`);
      manifest.push(`    label: Worst case ${token}`);
      manifest.push("    description: Generated one-MiB passive SVG benchmark entry");
      manifest.push("    usage_guidance: Acceptance benchmark only");
      manifest.push(`    sha256: ${digest}`);
    }
    writeFileSync(join(assetsDir, "asset-manifest.yaml"), `${manifest.join("\n")}\n`);

    const modulePath = resolve("PPTMAKER_FRAMEWORK/scripts/lib/html_asset_catalog.mjs");
    const childSource = `
      import { pathToFileURL } from "node:url";
      const { loadHtmlAssetCatalog } = await import(pathToFileURL(process.argv[1]).href);
      const started = process.hrtime.bigint();
      const result = loadHtmlAssetCatalog(process.argv[2]);
      const elapsed_ms = Number(process.hrtime.bigint() - started) / 1e6;
      process.stdout.write(JSON.stringify({ elapsed_ms, total_bytes: result.total_bytes, entries: Object.keys(result.catalog).length }));
    `;
    const child = spawn(process.execPath, ["--input-type=module", "-e", childSource, modulePath, runDir], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = ""; let stderr = ""; let peakRss = 0;
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    const sampler = setInterval(() => { peakRss = Math.max(peakRss, sampleRss(child.pid)); }, 25);
    const exitCode = await new Promise((resolveExit) => child.on("close", resolveExit));
    clearInterval(sampler);
    peakRss = Math.max(peakRss, sampleRss(child.pid));
    if (exitCode !== 0) throw new Error(`catalog benchmark child failed (${exitCode}): ${stderr}`);
    const result = JSON.parse(stdout);
    if (result.entries !== ENTRY_COUNT) throw new Error(`expected ${ENTRY_COUNT} entries, got ${result.entries}`);
    if (result.total_bytes !== EXPECTED_TOTAL_BYTES) throw new Error(`expected ${EXPECTED_TOTAL_BYTES} bytes, got ${result.total_bytes}`);
    if (result.elapsed_ms > MAX_RUNTIME_MS) throw new Error(`runtime ${result.elapsed_ms.toFixed(1)}ms exceeds ${MAX_RUNTIME_MS}ms`);
    if (peakRss > MAX_PEAK_RSS_BYTES) throw new Error(`peak RSS ${peakRss} exceeds ${MAX_PEAK_RSS_BYTES}`);
    process.stdout.write(`${JSON.stringify({
      schema: "pptmaker-html-asset-catalog-benchmark-v1",
      node: process.version,
      entries: result.entries,
      total_bytes: result.total_bytes,
      raster_bytes: raster.length,
      elapsed_ms: Math.round(result.elapsed_ms * 10) / 10,
      peak_rss_bytes: peakRss,
      limits: { runtime_ms: MAX_RUNTIME_MS, peak_rss_bytes: MAX_PEAK_RSS_BYTES },
    }, null, 2)}\n`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

await main();
