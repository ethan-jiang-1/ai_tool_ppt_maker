#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { encode as encodePng } from "fast-png";
import { initHtmlFirstBundle } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  HTML_PAGE_MAX_BYTES,
  COMPOSE_PAGE_TIMEOUT_MS,
  assertSerializedHtmlWithinLimit,
  composeDeckTimeoutMs,
} from "../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_renderer.mjs";
import {
  buildHtmlPlan,
  composeHtmlSlides,
  renderHtmlPages,
} from "../../../PPTMAKER_FRAMEWORK/scripts/03-html-production/index.mjs";
import {
  inspectHtmlReviewReadiness,
  publishHtmlGateDecision,
  resetHtmlProduction,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function nearLimitPng() {
  const width = 2200;
  const height = 2200;
  const data = new Uint8Array(width * height * 4);
  let state = 0x12345678;
  for (let index = 0; index < data.length; index += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    data[index] = state >>> 24;
  }
  const bytes = Buffer.from(encodePng({ width, height, data, channels: 4, depth: 8 }));
  if (bytes.length > 20 * 1024 * 1024) throw new Error(`benchmark PNG exceeds the valid 20 MiB asset cap: ${bytes.length}`);
  return bytes;
}

function slide(number, id, title, body) {
  return `## Slide ${String(number).padStart(2, "0")}: \`${id}\`

**VISUAL TYPE**: Benchmark
**TITLE**: ${title}
**CONCEPT**:
- **MUST communicate**: The local HTML delivery profile remains bounded and reproducible.
- **MUST NOT**: Use remote or legacy production inputs.

**SLIDE BODY**:
\`\`\`yaml
${body}\`\`\`
`;
}

function source() {
  return `---
production:
  pipeline: html-first-v1
identity:
  scheme: mnemonic-v1
---

${slide(1, "BigPic", "Worst valid embedded raster", `schema_version: 1
family: visual-focus
caption:
  body: Near-limit valid local raster
primary_visual:
  placement: body
  brief: A text-free deterministic raster field
  fit: cover
  focal_point: [0.5, 0.5]
  fallback:
    kind: asset
    asset_id: worst_visual
  selection: null
`)}
${slide(2, "HeroGo", "Representative hero", `schema_version: 1
family: hero
hero_statement: Local composition stays deterministic
supporting_line: English and 简体中文 remain bundled and measured
`)}
${slide(3, "DataGo", "Representative data slide", `schema_version: 1
family: data
chart:
  kind: bar
  categories: [Alpha, Beta, Gamma]
  series:
    - name: Current
      values: [3, 7, 11]
  value_format:
    kind: number
    decimals: 0
  legend: auto
insight:
  body: One deterministic Node-side SVG chart
`)}
`;
}

function treeStats(root) {
  if (!existsSync(root)) return { bytes: 0, files: 0 };
  let bytes = 0;
  let files = 0;
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) {
        files += 1;
        bytes += statSync(path).size;
      }
    }
  };
  visit(root);
  return { bytes, files };
}

function manifestSummary(runDir) {
  const production = join(runDir, "_generated", "html_production");
  const pages = JSON.parse(readFileSync(join(production, "html_pages", "manifest.json"), "utf8"));
  const finals = JSON.parse(readFileSync(join(production, "final_slides", "manifest.json"), "utf8"));
  const preview = JSON.parse(readFileSync(join(production, "preview", "manifest.json"), "utf8"));
  return {
    page_entries: pages.entries.length,
    final_entries: finals.entries.length,
    composition_input_receipts: [...pages.entries, ...finals.entries].filter((entry) => entry.composition_input_receipt?.schema === "composition_input_receipt_v1").length,
    review_plan_slots: Object.values(preview.review_plans).filter(Boolean).length,
    contact_sheet_slots: Object.values(preview.contact_sheets).filter(Boolean).length,
    page_html_shas: pages.entries.map((entry) => entry.sha256),
    final_png_shas: finals.entries.map((entry) => entry.sha256),
    reset_id: pages.html_production_reset_id,
  };
}

async function measuredComposition(runDir) {
  let peakRssBytes = process.memoryUsage().rss;
  const sampler = setInterval(() => {
    peakRssBytes = Math.max(peakRssBytes, process.memoryUsage().rss);
  }, 20);
  const started = performance.now();
  try {
    await buildHtmlPlan(runDir);
    const pages = await renderHtmlPages(runDir);
    const result = await composeHtmlSlides(runDir);
    return {
      elapsed_ms: Math.round((performance.now() - started) * 10) / 10,
      peak_rss_bytes: peakRssBytes,
      serialized_page_bytes: pages.pages.map((page) => Buffer.byteLength(page.html, "utf8")),
      html_delivery_digest: result.html_delivery_digest || null,
    };
  } finally {
    clearInterval(sampler);
  }
}

async function main() {
  const root = mkdtempSync(join(tmpdir(), "html-delivery-acceptance-"));
  try {
    const deck = join(root, "deck_benchmark");
    initHtmlFirstBundle(deck, null, "report", "dark-executive");
    const runDir = join(deck, "3_versions", "v1");
    const assets = join(deck, "2_backbone", "visual-style", "assets");
    const rasterDir = join(assets, "reference");
    mkdirSync(rasterDir, { recursive: true });
    const raster = nearLimitPng();
    writeFileSync(join(rasterDir, "worst.png"), raster);
    writeFileSync(join(assets, "asset-manifest.yaml"), `version: 2
assets:
  worst_visual:
    path: reference/worst.png
    type: png
    label: Worst valid raster
    description: Deterministic acceptance benchmark raster
    usage_guidance: Benchmark only
    sha256: ${sha256(raster)}
`);
    writeFileSync(join(runDir, "slide-specifications.md"), source());

    const production = join(runDir, "_generated", "html_production");
    const fresh = await measuredComposition(runDir);
    const freshDisk = treeStats(production);
    const freshManifests = manifestSummary(runDir);
    const readyForApproval = inspectHtmlReviewReadiness(runDir);
    if (!readyForApproval.gates.content?.plan?.plan_hash || !readyForApproval.gates.visual?.plan?.plan_hash) {
      throw new Error("fresh benchmark did not publish complete review plans");
    }
    publishHtmlGateDecision(runDir, { gate: "content", planHash: readyForApproval.gates.content.plan.plan_hash, status: "approved" });
    publishHtmlGateDecision(runDir, { gate: "visual", planHash: readyForApproval.gates.visual.plan.plan_hash, status: "approved" });
    if (!inspectHtmlReviewReadiness(runDir).ready) throw new Error("benchmark approvals did not become current");

    const repeated = await measuredComposition(runDir);
    const repeatedDisk = treeStats(production);
    const repeatedManifests = manifestSummary(runDir);
    if (JSON.stringify(repeatedManifests.page_html_shas) !== JSON.stringify(freshManifests.page_html_shas)
      || JSON.stringify(repeatedManifests.final_png_shas) !== JSON.stringify(freshManifests.final_png_shas)) {
      throw new Error("repeated rebuild changed deterministic page/final bytes");
    }

    const reset = resetHtmlProduction(runDir, { confirmedRunVersion: "v1" });
    if (existsSync(production)) throw new Error("state-first reset left the generated owner present");
    const rebuilt = await measuredComposition(runDir);
    const rebuiltDisk = treeStats(production);
    const rebuiltManifests = manifestSummary(runDir);
    const afterResetReview = inspectHtmlReviewReadiness(runDir);
    if (afterResetReview.ready) throw new Error("byte-identical reset rebuild resurrected prior approval");
    if (rebuiltManifests.reset_id !== reset.html_production_reset_id || rebuiltManifests.reset_id === freshManifests.reset_id) {
      throw new Error("reset rebuild did not bind the rotated reset ID");
    }
    if (JSON.stringify(rebuiltManifests.page_html_shas) !== JSON.stringify(freshManifests.page_html_shas)
      || JSON.stringify(rebuiltManifests.final_png_shas) !== JSON.stringify(freshManifests.final_png_shas)) {
      throw new Error("reset rebuild was not byte-identical");
    }

    const exactLimit = "x".repeat(HTML_PAGE_MAX_BYTES);
    if (assertSerializedHtmlWithinLimit(exactLimit, "LimitOk") !== HTML_PAGE_MAX_BYTES) throw new Error("exact page cap was not accepted");
    let overLimitRejected = false;
    try { assertSerializedHtmlWithinLimit(`${exactLimit}x`, "LimitBad"); } catch { overLimitRejected = true; }
    if (!overLimitRejected) throw new Error("page cap accepted one byte over the limit");

    process.stdout.write(`${JSON.stringify({
      schema: "pptmaker-html-delivery-acceptance-v1",
      measured_on: { platform: process.platform, arch: process.arch, node: process.version },
      deck: { slides: 3, raster_bytes: raster.length },
      limits: {
        serialized_page_bytes: HTML_PAGE_MAX_BYTES,
        exact_limit_accepted: true,
        over_limit_rejected: true,
        page_timeout_ms: COMPOSE_PAGE_TIMEOUT_MS,
        deck_timeout_ms: composeDeckTimeoutMs(3),
        deck_timeout_formula: "30000 + 30000 * selected_slide_count",
      },
      fresh: { ...fresh, disk: freshDisk, manifests: freshManifests },
      repeated_rebuild: {
        ...repeated,
        disk: repeatedDisk,
        disk_growth_bytes: repeatedDisk.bytes - freshDisk.bytes,
        manifests: repeatedManifests,
      },
      reset_rebuild: {
        ...rebuilt,
        disk: rebuiltDisk,
        disk_growth_from_fresh_bytes: rebuiltDisk.bytes - freshDisk.bytes,
        manifests: rebuiltManifests,
        reset_status: reset.status,
        prior_approval_resurrected: afterResetReview.ready,
        byte_identical: true,
      },
    }, null, 2)}\n`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

await main();
