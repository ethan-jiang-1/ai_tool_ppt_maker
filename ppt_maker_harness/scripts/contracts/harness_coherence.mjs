import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, normalize, relative, resolve } from "node:path";
import { parseDocument } from "yaml";
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

const TERMINOLOGY_AUTHORITY_REQUIREMENTS = Object.freeze([
  Object.freeze({
    file: "AGENTS.md",
    required: ["CONTEXT.md", "openspec/specs/<capability>/spec.md", "MD Controllers", "schema/"],
    forbidden: ["自然语言意图路由（附录）"],
  }),
  Object.freeze({
    file: "CONTEXT.md",
    required: ["Normative Harness Specification", "openspec/specs/", "Workflow Meanings", "NN_slideID", "The current whole-page Page Image Workflow capability family."],
    forbidden: ["**HTML Production**", "reviewed visual-slot asset", "whole-deck renderer", "visual-slot production branch"],
  }),
  Object.freeze({
    file: "ppt_maker_harness/AGENTS.md",
    required: ["`page-image-workflow` names the pipeline", "version-level selection", "../openspec/specs/", "../CONTEXT.md"],
    forbidden: [],
  }),
  Object.freeze({
    file: "ppt_maker_harness/BOOTSTRAP.md",
    required: ["`ppt_flow init`", "`bundle_layout.mjs --init`", "Reserved Header Region", "Provider Avoidance Constraint", "不证明 Provider compliance"],
    forbidden: [],
  }),
  Object.freeze({
    file: "ppt_maker_harness/COMMANDS.md",
    required: ["Intent Route Catalog", "MD Controllers", "controller manifest"],
    forbidden: ["[discovery catalog]"],
  }),
  Object.freeze({
    file: "ppt_maker_harness/charter/AGENT_CONTRACT.md",
    required: ["Intent Route Catalog", "MD Controllers", "controller manifest", "`html-render-runtime`", "receipt-bound Framed Page", "`05-delivery` consumes the resulting current final"],
    forbidden: [],
  }),
  Object.freeze({
    file: "ppt_maker_harness/charter/CONSTITUTION.md",
    required: ["page-image-style-master-iterations", "style-master-prompt.md", "page-image-visual-language.yaml", "pure-deck-visual-system.yaml", "ppt_flow.mjs init", "lower-level"],
    forbidden: [],
  }),
  Object.freeze({
    file: "ppt_maker_harness/reference/glossary.md",
    required: ["production schema definitions", "page-image-style-master-iterations", "style-master-prompt.md", "page-image-visual-language.yaml", "page-image-presentation/", "NN_slideID", "not a second workflow value"],
    forbidden: ["1_upstream_raw_material/style-master-iterations/"],
  }),
]);

export function validateTerminologyAuthorityPointers({ root = ".", readFile = readFileSync } = {}) {
  const issues = [];
  for (const requirement of TERMINOLOGY_AUTHORITY_REQUIREMENTS) {
    const path = join(root, requirement.file);
    if (!existsSync(path)) {
      issues.push(issue(requirement.file, 1, "terminology-authority", "required active guidance is missing", "restore the current ownership guidance"));
      continue;
    }
    const text = readFile(path, "utf8");
    for (const needle of requirement.required) {
      if (!text.includes(needle)) {
        issues.push(issue(requirement.file, 1, "terminology-authority", `missing current guidance: ${needle}`, "restore the owning capability's terminology"));
      }
    }
    for (const needle of requirement.forbidden) {
      if (text.includes(needle)) {
        issues.push(issue(requirement.file, 1, "terminology-authority", `stale active guidance: ${needle}`, "replace the retired prose without renaming machine contracts"));
      }
    }
  }
  return issues;
}


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

const CAPABILITY_REGISTRY_START = "<!-- harness-capability-registry:start -->";
const CAPABILITY_REGISTRY_END = "<!-- harness-capability-registry:end -->";
const CAPABILITY_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const ROOT_ENTRY_DOCUMENTS = new Set([
  "ppt_maker_harness/AGENTS.md",
  "ppt_maker_harness/BOOTSTRAP.md",
  "ppt_maker_harness/COMMANDS.md",
  "ppt_maker_harness/README.md",
]);

function plainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function normalizedAuthorityPath(value) {
  return typeof value === "string" ? value.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/+/g, "/") : "";
}

function registryMarkerCount(text, marker) {
  return text.split(marker).length - 1;
}

/**
 * Parse the one machine-readable navigation projection embedded in the
 * OpenSpec context. It only interprets supplied text and creates no state.
 */
export function parseHarnessCapabilityRegistryContext(text, { file = "openspec/config.yaml" } = {}) {
  const source = typeof text === "string" ? text : "";
  const startCount = registryMarkerCount(source, CAPABILITY_REGISTRY_START);
  const endCount = registryMarkerCount(source, CAPABILITY_REGISTRY_END);
  const start = source.indexOf(CAPABILITY_REGISTRY_START);
  const end = source.indexOf(CAPABILITY_REGISTRY_END);
  if (startCount !== 1 || endCount !== 1 || start < 0 || end < 0 || end < start) {
    return { registry: null, issues: [issue(file, 1, "authority-registry-marker", "expected exactly one ordered capability-registry marker pair", "repair the bounded capability registry in openspec/config.yaml and rerun coherence")] };
  }
  const bodyStart = start + CAPABILITY_REGISTRY_START.length;
  const body = source.slice(bodyStart, end).trim();
  const document = parseDocument(body);
  if (document.errors.length > 0) {
    return { registry: null, issues: [issue(file, lineAt(source, bodyStart), "authority-registry-yaml", "capability registry YAML is unreadable", "repair the bounded capability registry in openspec/config.yaml and rerun coherence")] };
  }
  return { registry: document.toJS({ mapAsMap: false }), issues: [] };
}

function registryShapeIssues(registry) {
  const issues = [];
  if (!plainObject(registry) || Object.keys(registry).length !== 1 || !Object.hasOwn(registry || {}, "capabilities") || !Array.isArray(registry.capabilities)) {
    return [issue("openspec/config.yaml", 1, "authority-registry-shape", "capability registry must be one mapping containing only capabilities", "repair the bounded capability registry in openspec/config.yaml and rerun coherence")];
  }
  const seen = new Set();
  for (const [index, entry] of registry.capabilities.entries()) {
    const location = `openspec/config.yaml#capabilities[${index}]`;
    const keys = plainObject(entry) ? Object.keys(entry).sort() : [];
    const allowedKeys = ["id", "owner_paths", "scope", "spec"];
    const requiredKeys = ["id", "scope", "spec"];
    if (!plainObject(entry) || keys.some((key) => !allowedKeys.includes(key)) || requiredKeys.some((key) => !keys.includes(key)) ||
      (keys.includes("owner_paths") && (!Array.isArray(entry.owner_paths) || entry.owner_paths.some((path) => typeof path !== "string")))) {
      issues.push(issue(location, 1, "authority-registry-shape", "capability registry record has an invalid closed shape", "repair the named capability record in openspec/config.yaml and rerun coherence"));
      continue;
    }
    if (typeof entry.id !== "string" || !CAPABILITY_ID.test(entry.id) || typeof entry.spec !== "string" || !entry.spec || typeof entry.scope !== "string" || !entry.scope.trim()) {
      issues.push(issue(location, 1, "authority-registry-shape", "capability registry record requires lower-kebab id, spec, and non-empty scope", "repair the named capability record in openspec/config.yaml and rerun coherence"));
      continue;
    }
    if (seen.has(entry.id)) issues.push(issue(location, 1, "authority-registry-duplicate-id", `capability ${entry.id} appears more than once`, "remove the duplicate capability record and rerun coherence"));
    seen.add(entry.id);
  }
  return issues;
}

function ownerPathProblem(path) {
  if (!path || path !== normalizedAuthorityPath(path) || path.startsWith("/") || path.split("/").some((part) => part === "..") || /[*?\[\]]/.test(path)) return "forbidden";
  const parts = path.split("/");
  if (parts.some((part) => /^(?:deck_|dpt_)/.test(part)) || parts.includes("_generated") || path.startsWith("openspec/changes/archive/") || path.startsWith("openspec/specs/") || path.startsWith("tests/") || path.startsWith("tests_e2e/") || parts.includes("internal")) return "forbidden";
  return null;
}

function admittedNonScriptOwner(path) {
  if (ROOT_ENTRY_DOCUMENTS.has(path)) return true;
  if (/^ppt_maker_harness\/(?:charter|playbook|workflow|reference)\/.+\.md$/.test(path)) return true;
  return /^ppt_maker_harness\/schema\/.+\.(?:md|ya?ml)$/.test(path);
}

/**
 * Evaluate a pre-discovered authority snapshot. This pure seam does not parse
 * files, inspect directories, or mutate repository state.
 */
export function evaluateHarnessAuthorityMap(snapshot = {}) {
  const shapeIssues = registryShapeIssues(snapshot.registry);
  if (shapeIssues.length > 0) return { ok: false, issues: shapeIssues };

  const registry = snapshot.registry;
  const expectedCapabilities = Array.isArray(snapshot.capabilities) ? snapshot.capabilities : null;
  if (!expectedCapabilities || expectedCapabilities.some((id) => typeof id !== "string" || !CAPABILITY_ID.test(id))) {
    return { ok: false, issues: [issue("openspec/specs", 1, "authority-capability-source", "discovered main-spec capability set is invalid", "repair the immediate main-spec directory set and rerun coherence")] };
  }

  const issues = [];
  const expected = new Set(expectedCapabilities);
  const actual = new Set(registry.capabilities.map((entry) => entry.id));
  for (const id of [...expected].filter((id) => !actual.has(id)).sort()) {
    issues.push(issue("openspec/config.yaml", 1, "authority-capability-missing", `missing capability ${id}`, "add the named current main-spec capability to the registry and rerun coherence"));
  }
  for (const id of [...actual].filter((id) => !expected.has(id)).sort()) {
    issues.push(issue("openspec/config.yaml", 1, "authority-capability-extra", `unbacked capability ${id}`, "remove the unbacked capability from the registry and rerun coherence"));
  }
  for (const entry of registry.capabilities) {
    const expectedSpec = `openspec/specs/${entry.id}/spec.md`;
    if (entry.spec !== expectedSpec) issues.push(issue("openspec/config.yaml", 1, "authority-registry-spec", `${entry.id} must cite ${expectedSpec}`, "repair the named capability spec path and rerun coherence"));
  }
  if (issues.length > 0) return { ok: false, issues };

  const repositoryFiles = new Set((Array.isArray(snapshot.repositoryFiles) ? snapshot.repositoryFiles : []).map(normalizedAuthorityPath));
  const repositoryDirectories = new Set((Array.isArray(snapshot.repositoryDirectories) ? snapshot.repositoryDirectories : []).map(normalizedAuthorityPath));
  const registeredScripts = new Set((Array.isArray(snapshot.registeredScriptSurfaces) ? snapshot.registeredScriptSurfaces : []).map(normalizedAuthorityPath));
  for (const entry of registry.capabilities) {
    const ownerPaths = entry.owner_paths || [];
    const seenOwnerPaths = new Set();
    for (const rawPath of ownerPaths) {
      const path = normalizedAuthorityPath(rawPath);
      if (seenOwnerPaths.has(path)) {
        issues.push(issue("openspec/config.yaml", 1, "authority-owner-duplicate", `duplicate owner path ${path}`, "remove the duplicate owner path and rerun coherence"));
        continue;
      }
      seenOwnerPaths.add(path);
      if (ownerPathProblem(rawPath)) {
        issues.push(issue("openspec/config.yaml", 1, "authority-owner-forbidden", `forbidden owner path ${rawPath}`, "replace the named owner path with an admitted public surface or omit it and rerun coherence"));
        continue;
      }
      if (repositoryDirectories.has(path)) {
        issues.push(issue("openspec/config.yaml", 1, "authority-owner-directory", `owner path ${path} is a directory`, "cite one admitted public file or omit the owner path and rerun coherence"));
        continue;
      }
      if (!repositoryFiles.has(path)) {
        issues.push(issue("openspec/config.yaml", 1, "authority-owner-missing", `owner path ${path} does not exist`, "repair or remove the named owner path and rerun coherence"));
        continue;
      }
      if (/\.(?:mjs|js)$/.test(path)) {
        if (!registeredScripts.has(path)) issues.push(issue("openspec/config.yaml", 1, "authority-owner-script-unregistered", `script owner ${path} is not a registered public interface or executable`, "register the true public script surface or omit the owner path and rerun coherence"));
        continue;
      }
      if (!admittedNonScriptOwner(path)) issues.push(issue("openspec/config.yaml", 1, "authority-owner-unadmitted", `existing owner path ${path} is not in a published Harness source home`, "cite an admitted public owner file or omit the owner path and rerun coherence"));
    }
  }
  return { ok: issues.length === 0, issues };
}

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

function relativeFilesUnder(root, directory) {
  const absolute = join(root, directory);
  if (!existsSync(absolute)) return [];
  return walk(absolute)
    .filter((path) => statSync(path).isFile())
    .map((path) => normalizedAuthorityPath(relative(root, path)));
}

function relativeDirectoriesUnder(root, directory, output = []) {
  const absolute = join(root, directory);
  if (!existsSync(absolute) || !statSync(absolute).isDirectory()) return output;
  output.push(normalizedAuthorityPath(relative(root, absolute)));
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    if (entry.isDirectory()) relativeDirectoriesUnder(root, join(directory, entry.name), output);
  }
  return output;
}

function immediateMainSpecCapabilities(root) {
  const specsRoot = join(root, "openspec/specs");
  if (!existsSync(specsRoot)) return [];
  return readdirSync(specsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(specsRoot, entry.name, "spec.md")))
    .map((entry) => entry.name)
    .sort();
}

function manifestScriptSurfaces(root) {
  const manifestPath = join(root, "tests/contracts/source-test-ownership.json");
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (manifest?.schema !== "pptmaker-source-test-ownership" || !Array.isArray(manifest.owners)) return [];
    return manifest.owners.flatMap((owner) => [
      ...(Array.isArray(owner.interfaces) ? owner.interfaces : []),
      ...(Array.isArray(owner.executables) ? owner.executables : []),
    ]).filter((path) => typeof path === "string")
      .map((path) => normalizedAuthorityPath(`ppt_maker_harness/scripts/${path}`));
  } catch {
    return [];
  }
}

/** Read only direct repository authority facts for the existing coherence check. */
export function evaluateRepositoryHarnessAuthorityMap({ root = ".", configText = undefined } = {}) {
  const configPath = join(root, "openspec/config.yaml");
  if (configText === undefined && !existsSync(configPath)) {
    return { ok: false, issues: [issue("openspec/config.yaml", 1, "authority-registry-missing", "repository-maintenance context is missing", "restore openspec/config.yaml and rerun coherence")] };
  }
  let document;
  try {
    document = parseDocument(configText === undefined ? readFileSync(configPath, "utf8") : configText);
  } catch {
    return { ok: false, issues: [issue("openspec/config.yaml", 1, "authority-config-yaml", "OpenSpec config is unreadable", "repair openspec/config.yaml and rerun coherence")] };
  }
  if (document.errors.length > 0) return { ok: false, issues: [issue("openspec/config.yaml", 1, "authority-config-yaml", "OpenSpec config is unreadable", "repair openspec/config.yaml and rerun coherence")] };
  const config = document.toJS({ mapAsMap: false });
  const parsed = parseHarnessCapabilityRegistryContext(config?.context, { file: "openspec/config.yaml" });
  if (parsed.issues.length > 0) return { ok: false, issues: parsed.issues };
  const sourceFiles = relativeFilesUnder(root, "ppt_maker_harness");
  return evaluateHarnessAuthorityMap({
    registry: parsed.registry,
    capabilities: immediateMainSpecCapabilities(root),
    repositoryFiles: sourceFiles,
    repositoryDirectories: relativeDirectoriesUnder(root, "ppt_maker_harness"),
    registeredScriptSurfaces: manifestScriptSurfaces(root),
  });
}

export function scanHarnessCoherence({ root = "ppt_maker_harness", exceptions = DOC_EXCEPTIONS, linkExceptions = LINK_EXCEPTIONS } = {}) {
  const issues = [
    ...validateExceptionMap(exceptions, linkExceptions),
    ...validateDiagnosticAuthorityPointers(),
    ...validateTerminologyAuthorityPointers(),
    ...evaluateRepositoryHarnessAuthorityMap().issues,
  ];
  const markdown = walk(root).filter((file) => file.endsWith(".md"));
  const scriptsDir = join(root, "scripts");
  for (const file of markdown) {
    const normalized = normalize(file).split("\\").join("/");
    if (exceptions[normalized]) continue;
    const text = readFileSync(file, "utf8");
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
    issues.push(...scanSemanticDrift(file, text));
  }
  return issues;
}
