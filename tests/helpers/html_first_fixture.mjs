import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";

export function htmlFirstSlide({
  number = 1,
  id = "HeroGo",
  title = "Hello",
  body = "schema_version: 1\nfamily: hero\n",
  note = null,
} = {}) {
  return `## Slide ${String(number).padStart(2, "0")}: \`${id}\`

**VISUAL TYPE**: Content
**TITLE**: ${title}
**CONCEPT**:
- **MUST communicate**: One clear idea
- **MUST NOT**: Visual noise

**SLIDE BODY**:
\`\`\`yaml
${body}\`\`\`
${note == null ? "" : `> **SPEAKER NOTE**: ${note}\n`}`;
}

export function htmlFirstSource(slides = [htmlFirstSlide()]) {
  return `---
production:
  pipeline: html-first-v1
---

${slides.join("\n")}`;
}

export function createHtmlFirstRun(prefix = "html-first-run-") {
  const root = mkdtempSync(join(tmpdir(), prefix));
  const deck = join(root, "deck_html_first");
  initBundle(deck, null, "keynote", "dark-executive");
  const runDir = join(deck, "3_versions", "v1");
  writeFileSync(join(runDir, "slide-specifications.md"), htmlFirstSource(), "utf8");
  const assetsDir = join(deck, "2_backbone", "visual-style", "assets");
  mkdirSync(assetsDir, { recursive: true });
  writeFileSync(join(assetsDir, "asset-manifest.yaml"), "version: 2\nassets: {}\n", "utf8");
  return { root, deck, runDir };
}
