import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CLI_BOUNDS,
  CLI_DIAGNOSTIC_SCHEMA,
  parseCliErrorLine,
} from "../../../ppt_maker_harness/scripts/shared/cli/cli_error.mjs";
import { initBundle } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";

const FLOW = resolve(process.cwd(), "ppt_maker_harness/scripts/ppt_flow.mjs");
const REGISTRY_RELATIVE = "2_backbone/visual-style/page-image-visual-language.yaml";
const PRESENTATION_DIR = "2_backbone/visual-style/page-image-presentation";

function sourceFor({ workflow, identity = "", slideCount = 1 }) {
  let slides = "";
  for (let index = 1; index <= slideCount; index += 1) {
    const id = slideCount === 1
      ? (workflow === "framed" ? "FramGo" : "PureOne")
      : `Pure${"ABCDE"[Math.floor((index - 1) / 5)]}${"abcde"[(index - 1) % 5]}`;
    slides += `
## Slide ${String(index).padStart(2, "0")}: \`${id}\`

**TITLE**: Title ${index}
${identity}**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`;
  }
  return `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: ${workflow}
---
${slides}`;
}

function treeSnapshot(root) {
  const entries = [];
  (function walk(current) {
    for (const name of readdirSync(current).sort()) {
      const path = join(current, name);
      if (statSync(path).isDirectory()) walk(path);
      else entries.push(`${relative(root, path)}:${createHash("sha256").update(readFileSync(path)).digest("hex")}`);
    }
  })(root);
  return entries;
}

function makeFixture({ workflow, family, slideCount = 1 }) {
  const root = mkdtempSync(join(tmpdir(), "pptmaker-source-config-diagnostic-"));
  const deck = join(root, `deck_${workflow}_${family}`);
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(runDir, "slide-specifications.md"), sourceFor({ workflow, slideCount }));

  if (family === "visual-language") {
    const registryPath = join(deck, REGISTRY_RELATIVE);
    writeFileSync(registryPath, readFileSync(registryPath, "utf8").replace("quiet depth", "quiet headline depth"));
  } else if (family === "visual-brief") {
    const sourcePath = join(runDir, "slide-specifications.md");
    writeFileSync(sourcePath, readFileSync(sourcePath, "utf8").replace("recipe: editorial-systems", "recipe: absent-recipe"));
  } else if (family === "presentation") {
    const file = workflow === "framed" ? "framed-header-profiles.yaml" : "pure-deck-visual-system.yaml";
    rmSync(join(deck, PRESENTATION_DIR, file), { force: true });
  } else if (family === "reference") {
    const profileDirectory = join(deck, "2_backbone", "visual-style", "assets", "reference", "test-agent");
    mkdirSync(profileDirectory, { recursive: true });
    writeFileSync(join(profileDirectory, "guide.png"), Buffer.from("synthetic identity reference bytes", "utf8"));
    writeFileSync(join(profileDirectory, "image2-reference-material.yaml"), `schema: pptmaker-image2-reference-registry
profiles:
  test-agent:
    subject_class: amber-light-form
    maximum_identity_subjects: 1
    compatible_restrictions:
      - none
    incompatible_restrictions:
      - no-identity-subject
    roles:
      guide:
        reference_path: guide.png
        reference_sha256: ${createHash("sha256").update("synthetic identity reference bytes", "utf8").digest("hex")}
        role_clause: readable label
`, "utf8");
    const sourcePath = join(runDir, "slide-specifications.md");
    writeFileSync(sourcePath, `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: ${workflow}
---

## Slide 01: \`${workflow === "framed" ? "FramGo" : "PureOne"}\`

**TITLE**: Title
**VISUAL IDENTITY**: test-agent/guide
**IDENTITY SUBJECT COUNT**: one
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`);
  }
  return { root, deck, runDir };
}

function runFlow(args, runDir) {
  const result = spawn("node", [FLOW, ...args, runDir], { encoding: "utf8" });
  return new Promise((resolvePromise) => {
    let stdout = "";
    let stderr = "";
    result.stdout.on("data", (chunk) => { stdout += chunk; });
    result.stderr.on("data", (chunk) => { stderr += chunk; });
    result.on("close", (status) => resolvePromise({ status, stdout, stderr }));
  });
}

async function invoke(workflow, family, command) {
  const fixture = makeFixture({ workflow, family });
  const before = treeSnapshot(fixture.deck);
  const args = command === "style-master plan"
    ? ["style-master", "plan", "--candidate-count", "0"]
    : command.split(" ");
  const result = await runFlow(args, fixture.runDir);
  const after = treeSnapshot(fixture.deck);
  rmSync(fixture.root, { recursive: true, force: true });
  return { result, unchanged: JSON.stringify(before) === JSON.stringify(after) };
}

function expectFailure(result) {
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(1);
  expect(result.stdout).toBe("");
  const lines = result.stderr.split(/\r?\n/).filter(Boolean);
  const envelope = parseCliErrorLine(lines.at(-1));
  expect(envelope).toBeTruthy();
  expect(lines.map(parseCliErrorLine).filter(Boolean)).toHaveLength(1);
  expect(Buffer.byteLength(lines.at(-1), "utf8")).toBeLessThanOrEqual(CLI_BOUNDS.envelopeBytes);
  return envelope;
}

const EXPECTATIONS = {
  "visual-language": { reason: "content_overriding_visual_clause", source: REGISTRY_RELATIVE, field: undefined },
  "visual-brief": { reason: "unregistered_visual_recipe", source: "slide-specifications.md", field: "VISUAL BRIEF" },
  "presentation": { reason: "page_image_presentation_source_missing", source: undefined, field: undefined },
  "reference": { reason: "content_overriding_visual_clause", source: "image2-reference-material.yaml", field: undefined },
};

const COMMANDS = ["style-master inspect", "style-master plan", "image2 plan"];

describe("source/config producer diagnostics across public commands", () => {
  for (const workflow of ["pure", "framed"]) {
    for (const family of ["visual-language", "visual-brief", "presentation", "reference"]) {
      for (const command of COMMANDS) {
        it(`${workflow} ${family} ${command} emits one source_validation envelope with the owner fact and no writes`, async () => {
          const { result, unchanged } = await invoke(workflow, family, command);
          const envelope = expectFailure(result);
          const expectation = EXPECTATIONS[family];
          expect(unchanged).toBe(true);

          expect(envelope.diagnostic.schema).toBe(CLI_DIAGNOSTIC_SCHEMA);
          expect(envelope.diagnostic.category).toBe("source_validation");
          expect(envelope.diagnostic.reason.kind).toBe(expectation.reason);
          expect(envelope.diagnostic.next.action).toBe("edit_source");
          expect(envelope.diagnostic.next.requires_human).toBe(false);

          if (expectation.source) {
            expect(envelope.diagnostic.source.path).toContain(expectation.source);
            expect(envelope.diagnostic.next.inspect?.[0]?.path).toContain(expectation.source);
          }
          if (expectation.field) {
            expect(envelope.diagnostic.issues[0].subject.field).toBe(expectation.field);
          }
          if (family === "reference") {
            expect(envelope.diagnostic.source.path).toContain("image2-reference-material.yaml");
            expect(envelope.diagnostic.issues[0].subject.field).toBeUndefined();
          }
          if (family === "visual-language") {
            expect(envelope.diagnostic.issues[0].reason.kind).toBe("content_overriding_visual_clause");
            expect(envelope.diagnostic.source.path).not.toContain("slide-specifications.md");
          }
        });
      }
    }
  }

  it("keeps one stable root across an oversized multi-slide shared defect", async () => {
    const workflow = "pure";
    const fixture = makeFixture({ workflow, family: "visual-language", slideCount: 25 });
    const result = await runFlow(["image2", "plan"], fixture.runDir);
    rmSync(fixture.root, { recursive: true, force: true });
    const envelope = expectFailure(result);
    expect(envelope.diagnostic.reason.kind).toBe("content_overriding_visual_clause");
    expect(envelope.diagnostic.source.path).toBe(REGISTRY_RELATIVE);
    expect(envelope.diagnostic.next.action).toBe("edit_source");
    expect(envelope.diagnostic.issues.length).toBeLessThanOrEqual(CLI_BOUNDS.issues);
    expect(Number.isInteger(envelope.diagnostic.omitted_count)).toBe(true);
  });

  it("never leaks secret-like prose, prompts, or provider bodies", async () => {
    const fixture = makeFixture({ workflow: "pure", family: "visual-language" });
    const result = await runFlow(["style-master", "inspect"], fixture.runDir);
    rmSync(fixture.root, { recursive: true, force: true });
    expectFailure(result);
    expect(result.stderr).not.toMatch(/authorization\s*:|api[_-]?key\s*[=:]|bearer\s+\S+|prompt|provider body|data:image/i);
  });
});
