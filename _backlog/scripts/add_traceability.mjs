/**
 * Add spec-to-test traceability comments to test files.
 * Maps each test directory to the relevant capability specs.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SPEC_MAP = {
  "00-setup": [
    "openspec/specs/environment-check/spec.md",
    "openspec/specs/html-render-runtime/spec.md",
  ],
  "01-content": [
    "openspec/specs/narrative-authoring/spec.md",
    "openspec/specs/content-parsing/spec.md",
    "openspec/specs/slide-identity-and-ordering/spec.md",
  ],
  "02-visual-system": [
    "openspec/specs/visual-config/spec.md",
    "openspec/specs/visual-asset-management/spec.md",
  ],
  "03-framed-image": [
    "openspec/specs/image-generation/spec.md",
  ],
  "04-pure-image": [
    "openspec/specs/image-generation/spec.md",
  ],
  "05-delivery": [
    "openspec/specs/delivery/spec.md",
  ],
  "06-iteration": [
    "openspec/specs/workflow-inspection/spec.md",
  ],
  contracts: [
    "openspec/specs/cli-surface/spec.md",
    "openspec/specs/harness-charter/spec.md",
    "openspec/specs/harness-script-layout/spec.md",
    "openspec/specs/production-schema-conformance/spec.md",
    "openspec/specs/harness-directory-layout/spec.md",
  ],
  "shared/cli": [
    "openspec/specs/cli-surface/spec.md",
    "openspec/specs/diagnostic-facts/spec.md",
  ],
  "shared/state": [
    "openspec/specs/node-specification/spec.md",
    "openspec/specs/playbook-execution/spec.md",
  ],
  "shared/image2": [
    "openspec/specs/image-generation/spec.md",
    "openspec/specs/style-master-generation/spec.md",
    "openspec/specs/image2-lab/spec.md",
    "openspec/specs/pipeline-orchestration/spec.md",
  ],
  "shared/run-bundle": [
    "openspec/specs/run-bundle-layout/spec.md",
    "openspec/specs/run-bundle-management/spec.md",
    "openspec/specs/lessons-management/spec.md",
  ],
  "shared/workflow": [
    "openspec/specs/workflow-inspection/spec.md",
    "openspec/specs/pipeline-orchestration/spec.md",
  ],
  "shared/page-image": [
    "openspec/specs/visual-config/spec.md",
  ],
  "shared/diagnostic": [
    "openspec/specs/diagnostic-facts/spec.md",
  ],
};

function collectFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "helpers" && entry.name !== "fixtures" && entry.name !== "node_modules") {
        results.push(...collectFiles(full));
      }
    } else if (entry.isFile() && entry.name.startsWith("test_") && entry.name.endsWith(".mjs")) {
      results.push(full);
    }
  }
  return results;
}

const testFiles = collectFiles("tests");
let updated = 0;

for (const file of testFiles) {
  const rel = file.replace(/^tests\//, "");
  const dir = rel.replace(/\/[^/]+$/, "");
  const specs = SPEC_MAP[dir];
  if (!specs) {
    console.log(`SKIP ${rel} — no spec mapping for directory '${dir}'`);
    continue;
  }

  const content = readFileSync(file, "utf-8");
  if (content.startsWith("// Tests:")) {
    console.log(`SKIP ${rel} — already has traceability comment`);
    continue;
  }

  const commentLines = specs.map((s) => `// Tests: ${s}`);
  const newContent = commentLines.join("\n") + "\n" + content;
  writeFileSync(file, newContent, "utf-8");
  updated++;
  console.log(`UPDATED ${rel}`);
}

console.log(`\nDone. Updated ${updated} files.`);