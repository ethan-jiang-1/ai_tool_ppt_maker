import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, normalize, resolve } from "node:path";
import { EXECUTABLE_INVENTORY, normalizeExecutablePath } from "./executable_inventory.mjs";
import { validateDocumentedCommands } from "./harness_document_command_audit.mjs";

export const DOC_EXCEPTIONS = Object.freeze({
  "ppt_maker_harness/reference/version-log.md": "version log record",
});

export const CURRENT_CONTRACT_FILES = Object.freeze({
  "openspec/config.yaml": "repository planning context",
  "ppt_maker_harness/charter/WORKFLOW.md": "process constitution",
  "ppt_maker_harness/reference/glossary.md": "terminology reference",
  "ppt_maker_harness/scripts/06-iteration/change-classifier.md": "target agent classification table",
  "openspec/specs/harness-charter/spec.md": "governing terminology requirement",
  "openspec/specs/pipeline-orchestration/spec.md": "governing pipeline terminology requirement",
});

export const LINK_EXCEPTIONS = Object.freeze([
  Object.freeze({
    file: "ppt_maker_harness/workflow/00-setup/template-deck-guide.md",
    target: "deck-guide.md",
    reason: "template link resolves after the file is copied to a run-bundle root",
  }),
]);


function walk(dir, output = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, output);
    else output.push(path);
  }
  return output;
}

function lineAt(text, offset) { return text.slice(0, offset).split("\n").length; }
function issue(file, line, rule, message, hint) { return { file, line, rule, message, hint }; }

export function validateExceptionMap(exceptions = DOC_EXCEPTIONS, linkExceptions = LINK_EXCEPTIONS) {
  const issues = [];
  for (const [file, reason] of Object.entries(exceptions)) {
    if (/[*?]|\/$/.test(file)) issues.push(issue(file, 1, "exception-scope", "broad exception is forbidden", "name one exact file"));
    if (!String(reason).trim()) issues.push(issue(file, 1, "exception-reason", "exception reason is empty", "provide a concrete file or template reason"));
  }
  for (const entry of linkExceptions) {
    if (!entry || /[*?]|\/$/.test(entry.file || "") || !String(entry.target || "").trim()) {
      issues.push(issue(entry?.file || "<link-exception>", 1, "exception-scope", "link exception must name one exact file and target", "name one source file and one literal target"));
    }
    if (!String(entry?.reason || "").trim()) issues.push(issue(entry?.file || "<link-exception>", 1, "exception-reason", "link exception reason is empty", "provide a concrete template reason"));
  }
  return issues;
}

export function scanMarkdownLinks(file, text = readFileSync(file, "utf8"), linkExceptions = LINK_EXCEPTIONS) {
  const issues = [];
  const regex = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const match of text.matchAll(regex)) {
    let target = match[1].trim().replace(/^<|>$/g, "");
    if (!target || /^(?:https?:|mailto:|#)/i.test(target) || /[<{[]/.test(target)) continue;
    target = decodeURIComponent(target.split("#")[0]);
    const normalizedFile = normalize(file).split("\\").join("/");
    const exempt = linkExceptions.some((entry) => entry.file === normalizedFile && entry.target === match[1]);
    if (exempt) continue;
    const resolved = isAbsolute(target) ? target : resolve(dirname(file), target);
    if (!existsSync(resolved)) issues.push(issue(file, lineAt(text, match.index), "broken-link", `missing target ${match[1]}`, "fix the relative link or register one exact template exception"));
  }
  return issues;
}

const STALE_RULES = [
  ["external-image-skill", /(?:Stage 2[^\n]*(?:image2-ppt|\.claude\/skills|\.agents\/skills)|<skills>\/image2-ppt|unified_pipeline\.mjs[^\n]*image2-ppt skill)/i, "use the receipt-bound Page Image raw lifecycle"],
  ["old-path", /(?:ppt_maker_harness\/)?(?:automation\/change-classifier\.md|06_reference_scripts\/|00_project_setup\/|01_visual_style_master\/|02_content_design\/|03_image_prompts\/|04_production_pipeline\/|05_iteration\/)/, "replace with the current type-based Harness path"],
  ["unsupported-stage-run-dir", /stage[345]_[a-z0-9_]+\.mjs\s+--run-dir\b/i, "use the current Page Image `ppt_flow` operation instead"],
  ["complete-copy-version", /(?:版本快照|new-version|--new-version)[^\n]*(?:完整复制|完整拷贝|complete copy)/i, "state that only downstream source delta is copied and _generated is clean"],
];

const NEGATIVE_POLICY = /(?:不要求|不搜索|不依赖|禁止|不得|绝对禁止|无需|no external|does not require|shall not search|shall not require)/i;
const BODY_HEADER_LOCK_ALTERNATE_LABEL = "body\\+header" + "-lock";

const CANONICAL_PATHS = Object.freeze([
  "Header Text & Style Refresh",
  "Generated Image Rebuild",
  "Notes-Only Refresh",
  "Structural Versioning Path",
]);

const RETIRED_ALIAS_RULES = Object.freeze([
  Object.freeze({ alias: /(?:Chain\s*A\b|链\s*A\b|链A\b)/i, canonical: CANONICAL_PATHS[0] }),
  Object.freeze({ alias: /(?:Chain\s*B\b|链\s*B\b|链B\b)/i, canonical: CANONICAL_PATHS[1] }),
  Object.freeze({ alias: /(?:Chain\s*C\b|链\s*C\b|链C\b)/i, canonical: CANONICAL_PATHS[2] }),
  Object.freeze({ alias: /formerly\s+Structural\b/i, canonical: CANONICAL_PATHS[3] }),
]);

function normalizedRepoPath(file) {
  const normalized = normalize(file).split("\\").join("/");
  const marker = "/ppt_maker_harness/";
  const markerIndex = normalized.lastIndexOf(marker);
  if (markerIndex >= 0) return normalized.slice(markerIndex + 1);
  const specMarker = "/openspec/";
  const specIndex = normalized.lastIndexOf(specMarker);
  if (specIndex >= 0) return normalized.slice(specIndex + 1);
  return normalized.replace(/^\.\//, "");
}

function isCurrentContractFile(file) {
  return Object.hasOwn(CURRENT_CONTRACT_FILES, normalizedRepoPath(file));
}

export function scanSemanticDrift(file, text = readFileSync(file, "utf8")) {
  const issues = [];
  const registry = isCurrentContractFile(file);
  let offset = 0;
  for (const line of text.split("\n")) {
    for (const [rule, regex, hint] of STALE_RULES) {
      const match = regex.exec(line);
      if (!match || (rule === "external-image-skill" && NEGATIVE_POLICY.test(line))) continue;
      issues.push(issue(file, lineAt(text, offset + match.index), rule, match[0].trim(), hint));
    }
    for (const { alias, canonical } of RETIRED_ALIAS_RULES) {
      const match = alias.exec(line);
      if (!match) continue;
      if (!registry) {
        issues.push(issue(file, lineAt(text, offset + match.index), "retired-edit-path", `${match[0]} is a retired alias in operational prose`, `use ${canonical}`));
      } else if (!line.includes(canonical)) {
        issues.push(issue(file, lineAt(text, offset + match.index), "unpaired-retired-alias", `${match[0]} is not paired locally with ${canonical}`, `put the canonical English name in the same definition, sentence, or table row`));
      }
    }
    if (!registry && /\|\s*(?:\*\*)?[ABC](?:\*\*)?\s*\|/.test(line) && /(?:Stage|(?:1\s*(?:→|,)[^|]*[345])|(?:5\s*(?:only|仅)))/i.test(line)) {
      issues.push(issue(file, lineAt(text, offset), "retired-edit-path-table", "bare A/B/C editing-path stage table", "use the canonical English refresh-path name"));
    }
    if (/(?:safe[- ]?zone|render[- ]?mode|RENDER MODE)[^.;。|]*(?:use|uses|using|使用|走|归为|→|=)[^.;。|]*Header Text & Style Refresh/i.test(line)) {
      issues.push(issue(file, lineAt(text, offset), "raw-contract-header-route", "raw-image contract change is routed to Header Text & Style Refresh", "use Generated Image Rebuild for safe-zone or render-mode changes"));
    }
    const imageOwnedHeaderRoute = /(?:KPI|card|chart|case|body (?:text|data)|body 文案|body 数据|案例|数据|卡片|图表)[^.;。|]*(?:use|uses|using|使用|走|归为|→|=)[^.;。|]*Header Text & Style Refresh/i.exec(line);
    if (imageOwnedHeaderRoute && !imageOwnedHeaderRoute[0].includes("Generated Image Rebuild") && !new RegExp(`(?:${BODY_HEADER_LOCK_ALTERNATE_LABEL}|body-lock)`, "i").test(imageOwnedHeaderRoute[0])) {
      issues.push(issue(file, lineAt(text, offset), "image-owned-header-route", "image-owned body content is routed to Header Text & Style Refresh", "use Generated Image Rebuild for content burned into the image"));
    }
    if (/(?:add(?:ing)? (?:a )?slide|新增|添加|加一页)/i.test(line) && line.includes("Generated Image Rebuild") && !line.includes("Structural Versioning Path") && !/(?:not|不是|不能|不得|不只|after|随后|先|affected|受影响|新版本)/i.test(line)) {
      issues.push(issue(file, lineAt(text, offset), "structural-bypass", "slide addition is routed directly to Generated Image Rebuild", "enter Structural Versioning Path before affected-slide refresh"));
    }
    if (/(?:raw\s+)?unified_pipeline[^\n]*--only[^\n]*(?:automatically|auto(?:matically)?|自动|隐式).{0,30}(?:force|强制|刷新)/i.test(line) && !/(?:does not|doesn't|不|不会|并非|不是)/i.test(line)) {
      issues.push(issue(file, lineAt(text, offset), "only-implies-force", "raw --only is described as forcing regeneration", "state that Page Image raw generation requires an explicit authorized scope"));
    }
    offset += line.length + 1;
  }
  const semanticRules = [
    ["hierarchy-ambiguity", /(?:三个宏观 Phase|5 个 Phase|六个 Phase|目录\s*=\s*(?:阶段|Stage))/i, "ambiguous lifecycle/module hierarchy", "use Lifecycle Phase, Method Module, Pipeline Stage, and Playbook Node explicitly"],
  ];
  for (const [rule, regex, message, hint] of semanticRules) {
    for (const match of text.matchAll(new RegExp(regex.source, `${regex.flags}g`))) issues.push(issue(file, lineAt(text, match.index), rule, message, hint));
  }
  return issues;
}

export function extractNodeCommands(file, text = readFileSync(file, "utf8")) {
  const commands = [];
  const fenced = /^```(?:bash|sh|shell|console)\s*\n([\s\S]*?)^```\s*$/gm;
  for (const match of text.matchAll(fenced)) {
    const preceding = text.slice(0, match.index).trimEnd();
    const markerMatch = /<!--\s*coherence:pseudocode\s+reason="([^"]+)"\s*-->$/.exec(preceding);
    if (markerMatch) continue;
    const joined = match[1].replace(/\\\r?\n\s*/g, " ");
    for (const [index, raw] of joined.split("\n").entries()) {
      const line = raw.trim().replace(/^\$\s*/, "");
      if (!line || line.startsWith("#") || !/(?:^|\s)node\s+/.test(line)) continue;
      commands.push({ file, line: lineAt(text, match.index) + index + 1, command: line });
    }
  }
  const inline = /`([^`\n]*\bnode\s+(?:ppt_maker_harness\/)?scripts\/[^`\n]+)`/g;
  for (const match of text.matchAll(inline)) {
    const paragraphStart = text.lastIndexOf("\n\n", match.index) + 2;
    const before = text.slice(paragraphStart, match.index).trim();
    if (/<!--\s*coherence:pseudocode\s+reason="[^"]+"\s*-->$/.test(before)) continue;
    commands.push({ file, line: lineAt(text, match.index), command: match[1].trim().replace(/^\$\s*/, "") });
  }
  return commands;
}

export function validatePseudocodeMarkers(file, text = readFileSync(file, "utf8")) {
  const issues = [];
  for (const match of text.matchAll(/<!--\s*coherence:pseudocode\b[\s\S]*?-->/g)) {
    const exact = /^<!--\s*coherence:pseudocode\s+reason="([^"]+)"\s*-->$/.exec(match[0]);
    if (!exact) {
      issues.push(issue(file, lineAt(text, match.index), "pseudocode-marker", "invalid pseudocode marker", "use the exact marker with a non-empty reason"));
      continue;
    }
    const rest = text.slice(match.index + match[0].length);
    const next = /^\s*(?:```(?:bash|sh|shell|console)\s*\n([\s\S]*?)^```|([^\n]*(?:\n(?!\s*\n)[^\n]*)*))/m.exec(rest);
    const example = next?.[1] ?? next?.[2] ?? "";
    const count = (example.match(/(?:^|\s)node\s+(?:ppt_maker_harness\/)?scripts\//gm) || []).length;
    if (count !== 1) issues.push(issue(file, lineAt(text, match.index), "pseudocode-marker", `marker applies to ${count} Node examples`, "place it immediately before exactly one fenced or inline Node example"));
  }
  return issues;
}


export function validateDiagnosticAuthorityPointers({ root = "." } = {}) {
  const issues = [];
  const requirements = [
    ["AGENTS.md", ["openspec/specs/cli-surface/spec.md", "openspec/specs/node-specification/spec.md", "openspec status"]],
    ["ppt_maker_harness/scripts/README.md", ["openspec/specs/cli-surface/spec.md"]],
    ["ppt_maker_harness/scripts/shared/cli/cli_error.mjs", ["openspec/specs/cli-surface/spec.md"]],
    ["ppt_maker_harness/scripts/shared/state/md_controller_reader.mjs", ["openspec/specs/node-specification/spec.md"]],
    ["ppt_maker_harness/scripts/shared/state/state.mjs", ["openspec/specs/node-specification/spec.md"]],
  ];
  for (const [file, needles] of requirements) {
    const path = join(root, file);
    if (!existsSync(path)) {
      issues.push(issue(file, 1, "diagnostic-authority", "authority pointer file is missing", "restore the canonical maintenance route"));
      continue;
    }
    const text = readFileSync(path, "utf8");
    for (const needle of needles) {
      if (!text.includes(needle)) issues.push(issue(file, 1, "diagnostic-authority", `missing canonical target ${needle}`, "point to the canonical capability without copying its schema"));
    }
  }
  const mainSpec = join(root, "openspec/specs/cli-surface/spec.md");
  if (existsSync(mainSpec)) {
    const purpose = readFileSync(mainSpec, "utf8").split("## Requirements", 1)[0];
    if (!/every registered direct Node CLI/i.test(purpose) || !/12-command/i.test(purpose)) {
      issues.push(issue("openspec/specs/cli-surface/spec.md", 1, "diagnostic-authority", "Purpose is not global while retaining ppt_flow scope", "name all direct CLIs and the fixed 12-command ppt_flow surface"));
    }
  }
  return issues;
}

export function scanHarnessCoherence({ root = "ppt_maker_harness", exceptions = DOC_EXCEPTIONS, linkExceptions = LINK_EXCEPTIONS } = {}) {
  const issues = [...validateExceptionMap(exceptions, linkExceptions), ...validateDiagnosticAuthorityPointers()];
  const markdown = walk(root).filter((file) => file.endsWith(".md"));
  const scriptsDir = join(root, "scripts");
  const activeSurfaceFiles = {};
  for (const file of markdown) {
    const normalized = normalize(file).split("\\").join("/");
    if (exceptions[normalized]) continue;
    const text = readFileSync(file, "utf8");
    activeSurfaceFiles[normalized] = text;
    issues.push(...scanMarkdownLinks(file, text, linkExceptions));
    issues.push(...scanSemanticDrift(file, text));
    issues.push(...validatePseudocodeMarkers(file, text));
    issues.push(...validateDocumentedCommands(extractNodeCommands(file, text), scriptsDir));
  }
  for (const file of ["openspec/config.yaml"]) {
    if (!existsSync(file)) continue;
    issues.push(...scanSemanticDrift(file, readFileSync(file, "utf8")));
  }
  for (const file of Object.keys(CURRENT_CONTRACT_FILES).filter((file) => file.startsWith("openspec/specs/"))) {
    if (!existsSync(file)) continue;
    const text = readFileSync(file, "utf8");
    activeSurfaceFiles[file] = text;
    issues.push(...scanSemanticDrift(file, text));
  }
  if (existsSync("openspec/specs")) {
    for (const file of walk("openspec/specs").filter((path) => path.endsWith(".md"))) {
      activeSurfaceFiles[normalize(file).split("\\").join("/")] = readFileSync(file, "utf8");
    }
  }
  return issues;
}
