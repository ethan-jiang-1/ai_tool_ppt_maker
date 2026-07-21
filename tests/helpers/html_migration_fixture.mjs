import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initBundle } from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";

export function markerlessMigrationSource() {
  return `# Legacy migration fixture

## Slide 01: \`HeroGo\`

**VISUAL TYPE**: Title / Opener
**TITLE**: Markerless migration
**IMAGE PROMPT**: A cinematic factory at dawn, blue light, no text.

## Slide 02: \`ProofNow\`

**VISUAL TYPE**: Content
**TITLE**: Evidence before action
**IMAGE PROMPT**: A technical diagram with a clear upward path.
`;
}

export function createMarkerlessMigrationFixture(prefix = "markerless-migration-") {
  const root = mkdtempSync(join(tmpdir(), prefix));
  const deck = join(root, "deck_markerless");
  initBundle(deck, null, "keynote", "dark-executive");
  const runDir = join(deck, "3_versions", "v1");
  writeFileSync(join(runDir, "slide-specifications.md"), markerlessMigrationSource(), "utf8");
  const assetsDir = join(deck, "2_backbone", "visual-style", "assets");
  mkdirSync(assetsDir, { recursive: true });
  writeFileSync(join(assetsDir, "asset-manifest.yaml"), "version: 2\nassets: {}\n", "utf8");
  const providerCalls = [];
  return Object.freeze({
    root,
    deck,
    runDir,
    providerCalls,
    providerSpy: (operation) => providerCalls.push(operation),
  });
}
