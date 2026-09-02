/**
 * md_controller_reader.mjs
 *
 * Purpose: read the Harness's Markdown (MD) Controllers so runtime gate
 * checks and tests enforce the declarations that agents and humans can see.
 *
 * Authority boundary:
 * - `ppt_maker_harness/playbook/*.md` is the only source of truth for
 *   playbook content, node order, dependencies, gates, and instructions.
 * - This module only reads, parses, indexes, and validates those Markdown
 *   declarations. Its index is transient and is rebuilt from the MD files.
 * - This module does NOT define a second playbook, generate controller
 *   content, modify Markdown, make creative decisions, or execute nodes.
 * CLI diagnostic consumer authority: openspec/specs/node-specification/spec.md
 * plus active node-specification deltas discovered through `openspec status`.
 * Producer fields remain owned by cli-surface and are not redefined here.
  * Authority: openspec/specs/playbook-execution/spec.md
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { parseDocument } from "yaml";
import {
  PAGE_IMAGE_WORKFLOW_PIPELINE,
  PAGE_IMAGE_WORKFLOWS,
} from "../run-bundle/production_marker.mjs";

export const METHOD_MODULES = Object.freeze([
  "00-setup",
  "01-content",
  "02-visual-system",
  "03-framed-image",
  "04-pure-image",
  "05-delivery",
  "06-iteration",
]);
export const RESERVED_NODE_IDS = Object.freeze([]);
export const SUPPORTED_PIPELINES = Object.freeze([
  PAGE_IMAGE_WORKFLOW_PIPELINE,
]);
export const SUPPORTED_PRODUCTION_WORKFLOWS = Object.freeze([...PAGE_IMAGE_WORKFLOWS]);

const TARGET_STAGE_FOUR_MODULES = new Set([
  "03-framed-image",
  "04-pure-image",
  "05-delivery",
]);
const TARGET_WORKFLOW_MODULES = Object.freeze({
  "03-framed-image": "framed",
  "04-pure-image": "pure",
});

/** True when a target node is active for the version workflow selected in state. */
export function nodeAppliesToWorkflow(node, workflow) {
  if (!node) return false;
  const nodeWorkflows = node.productionWorkflows;
  if (!nodeWorkflows || nodeWorkflows.length === 0) return true;
  return PAGE_IMAGE_WORKFLOWS.includes(workflow) && nodeWorkflows.includes(workflow);
}

const DETERMINISTIC_CONDITIONS = new Set([
  "run_bundle_exists",
  "deck_guide_created",
  "visual_preset_seeded",
  "style_master_exists",
  "style_master_accepted",
  "slide_specs_exists",
  "slide_specs_valid",
  "pptx_generated",
  "speaker_notes_injected",
]);

function lineNumber(text, offset) {
  return text.slice(0, offset).split("\n").length;
}

function asStringArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value.map((v) => String(v)) : [String(value)];
}

const CONTROLLER_FRONTMATTER_KEYS = new Set([
  "playbook",
  "description",
  "supported_pipelines",
  "includes",
]);
const NODE_KEYS = new Set([
  "node",
  "method_module",
  "requires",
  "entry",
  "exit",
  "produces",
  "decisions",
  "production_workflows",
  "adapter",
  "draft_route",
]);
const SHARED_NODE_FRONTMATTER_KEYS = new Set([...NODE_KEYS, "shared"]);

function parseFrontmatter(text, source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!match) return { data: {}, keyLines: {}, end: 0, error: null };
  try {
    const parsed = parseYamlMapping(match[1], source, 2);
    return { ...parsed, end: match[0].length, error: null };
  } catch (error) {
    return { data: {}, keyLines: {}, end: match[0].length, error: error.message };
  }
}

function parseYamlMapping(text, source, startLine) {
  const document = parseDocument(text, { uniqueKeys: true, prettyErrors: false });
  if (document.errors.length > 0) {
    const error = document.errors[0];
    const localLine = error.linePos?.[0]?.line || 1;
    throw new Error(`${source}:${startLine + localLine - 1}: ${error.message}`);
  }
  const value = document.toJS();
  if (value == null) return { data: {}, keyLines: {} };
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${source}:${startLine}: YAML declaration must be a mapping`);
  }
  const keyLines = {};
  for (const pair of document.contents?.items || []) {
    const key = pair?.key?.value;
    if (typeof key !== "string") continue;
    keyLines[key] = startLine + lineNumber(text, pair.key.range?.[0] || 0) - 1;
  }
  return { data: value, keyLines };
}

function validateDeclarationGrammar(data, keyLines, source, kind, allowedKeys, fallbackLine) {
  const errors = [];
  for (const key of Object.keys(data)) {
    if (!allowedKeys.has(key)) {
      errors.push(`${source}:${keyLines[key] || fallbackLine}: unsupported ${kind} frontmatter key ${key}`);
    }
  }
  if (kind === "shared-node" && data.shared !== true) {
    errors.push(`${source}:${keyLines.shared || fallbackLine}: shared-node frontmatter requires shared: true`);
  }
  if ((kind === "shared-node" || kind === "fenced-node") &&
    Object.hasOwn(data, "draft_route") && data.draft_route !== true) {
    errors.push(`${source}:${keyLines.draft_route || fallbackLine}: draft_route must be the literal Boolean true when present`);
  }
  return errors;
}

function parseSteps(body, startLine) {
  const steps = [];
  const regex = /^\*\*Step\s+(\d+)\s+—\s+(MD|CLI|GATE)\*\*(?=\s*:|\s|$)/gm;
  for (const match of body.matchAll(regex)) {
    steps.push({
      number: Number(match[1]),
      type: match[2],
      line: startLine + lineNumber(body, match.index) - 1,
    });
  }
  return steps;
}

function normalizeNode(raw, meta) {
  return {
    id: raw?.node == null ? "" : String(raw.node),
    methodModule: raw?.method_module == null ? "" : String(raw.method_module),
    requires: asStringArray(raw?.requires),
    entry: asStringArray(raw?.entry),
    exit: asStringArray(raw?.exit),
    produces: asStringArray(raw?.produces),
    decisions: asStringArray(raw?.decisions),
    productionWorkflows: asStringArray(raw?.production_workflows),
    adapter: raw?.adapter == null ? null : String(raw.adapter),
    draftRoute: raw && Object.hasOwn(raw, "draft_route") ? raw.draft_route === true : false,
    shared: raw?.shared === true,
    raw,
    ...meta,
  };
}

export function parseControllerFile(filePath) {
  const text = readFileSync(filePath, "utf8");
  const fm = parseFrontmatter(text, filePath);
  const errors = fm.error ? [fm.error] : [];
  const sharedFrontmatter = Object.hasOwn(fm.data, "node");
  if (!fm.error) {
    errors.push(...validateDeclarationGrammar(
      fm.data,
      fm.keyLines,
      filePath,
      sharedFrontmatter ? "shared-node" : "Controller",
      sharedFrontmatter ? SHARED_NODE_FRONTMATTER_KEYS : CONTROLLER_FRONTMATTER_KEYS,
      1,
    ));
  }
  const frontmatterValid = errors.length === 0;
  const playbook = frontmatterValid && !sharedFrontmatter && fm.data.playbook != null
    ? String(fm.data.playbook)
    : "";
  const includes = asStringArray(fm.data.includes);
  const supportedPipelines = asStringArray(fm.data.supported_pipelines);
  const nodes = [];

  if (frontmatterValid && sharedFrontmatter) {
    const body = text.slice(fm.end);
    nodes.push(normalizeNode(fm.data, {
      playbook: "shared",
      source: filePath,
      line: 2,
      body,
      steps: parseSteps(body, lineNumber(text, fm.end)),
      order: 0,
      declaration: "frontmatter",
    }));
  }

  const fences = [...text.matchAll(/^```yaml\s*\r?\n([\s\S]*?)^```\s*$/gm)];
  for (let index = 0; index < fences.length; index += 1) {
    const match = fences[index];
    const fenceLine = lineNumber(text, match.index);
    let parsed;
    try {
      parsed = parseYamlMapping(match[1], filePath, fenceLine + 1);
    } catch (error) {
      errors.push(error.message);
      continue;
    }
    const { data: raw, keyLines } = parsed;
    if (!raw.node) continue;
    const grammarErrors = validateDeclarationGrammar(raw, keyLines, filePath, "fenced-node", NODE_KEYS, fenceLine);
    if (grammarErrors.length > 0) {
      errors.push(...grammarErrors);
      continue;
    }
    const bodyStart = match.index + match[0].length;
    const bodyEnd = fences[index + 1]?.index ?? text.length;
    const body = text.slice(bodyStart, bodyEnd);
    nodes.push(normalizeNode(raw, {
      playbook: playbook || basename(filePath, ".md"),
      source: filePath,
      line: lineNumber(text, match.index),
      body,
      steps: parseSteps(body, lineNumber(text, bodyStart)),
      order: nodes.length,
      declaration: "fenced-yaml",
    }));
  }

  return {
    source: filePath,
    playbook,
    includes,
    supportedPipelines,
    nodes,
    errors,
  };
}

const CONTROLLER_MANIFEST_FILE = "controller-manifest.json";

function progressiveRawNodeIds(workflow) {
  return Object.freeze([
    `plan-target-${workflow}-progressive-raw`,
    `recommend-target-${workflow}-pilot`,
    `authorize-target-${workflow}-pilot`,
    `generate-target-${workflow}-pilot`,
    `review-target-${workflow}-pilot`,
    `plan-target-${workflow}-expansion`,
    `authorize-target-${workflow}-expansion`,
    `generate-target-${workflow}-expansion`,
    `review-target-${workflow}-raw`,
    `publish-target-${workflow}-final-manifest`,
  ]);
}

function readControllerManifest(playbookDir) {
  const path = join(playbookDir, CONTROLLER_MANIFEST_FILE);
  if (!existsSync(path)) return { path, manifest: null, errors: [] };
  try {
    const manifest = JSON.parse(readFileSync(path, "utf8"));
    if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
      return { path, manifest: null, errors: [`${path}: controller manifest must be an object`] };
    }
    return { path, manifest, errors: [] };
  } catch (error) {
    return { path, manifest: null, errors: [`${path}: ${error.message}`] };
  }
}

function manifestDraftRoutes(manifest, playbook) {
  const routes = manifest?.controllers?.[playbook]?.draft_route_nodes;
  if (!routes || typeof routes !== "object" || Array.isArray(routes)) return null;
  return routes;
}

/**
 * Return the manifest route only when it exactly agrees with the declarations
 * in the Controller. Consumers never receive an unvalidated raw manifest list.
 */
function normalizedManifestDraftRoutes(index, playbook) {
  const controller = index?.controllers?.get(playbook);
  if (!controller || controller.playbook !== "create-deck") return null;
  const routes = manifestDraftRoutes(index.controllerManifest, playbook);
  if (!routes || Object.keys(routes).length !== PAGE_IMAGE_WORKFLOWS.length ||
    !PAGE_IMAGE_WORKFLOWS.every((workflow) => Object.hasOwn(routes, workflow))) {
    return null;
  }

  const normalized = {};
  for (const workflow of PAGE_IMAGE_WORKFLOWS) {
    const declared = controller.nodes
      .filter((node) => node.draftRoute && nodeAppliesToWorkflow(node, workflow))
      .map((node) => node.id);
    const route = routes[workflow];
    if (!Array.isArray(route) || route.some((nodeId) => typeof nodeId !== "string") ||
      new Set(route).size !== route.length || !sameOrderedValues(route, declared)) {
      return null;
    }
    normalized[workflow] = Object.freeze([...route]);
  }
  return Object.freeze(normalized);
}

export function buildPlaybookIndex(playbookDir) {
  const files = readdirSync(playbookDir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => parseControllerFile(join(playbookDir, name)));
  const controllers = new Map();
  const shared = new Map();
  const nodesById = new Map();
  const duplicates = new Map();
  const errors = files.flatMap((file) => file.errors);
  const manifestResult = readControllerManifest(playbookDir);

  for (const file of files) {
    if (file.playbook) controllers.set(file.playbook, file);
    for (const node of file.nodes) {
      if (node.shared || node.declaration === "frontmatter") shared.set(node.id, node);
      if (nodesById.has(node.id)) {
        duplicates.set(node.id, [nodesById.get(node.id), node]);
      } else {
        nodesById.set(node.id, node);
      }
    }
  }

  const index = {
    playbookDir,
    files,
    controllers,
    shared,
    nodesById,
    duplicates,
    errors,
    controllerManifest: manifestResult.manifest,
    manifestPath: manifestResult.path,
    manifestErrors: manifestResult.errors,
    draftRoutes: new Map(),
  };
  if (manifestResult.manifest?.controllers && typeof manifestResult.manifest.controllers === "object") {
    for (const playbook of Object.keys(manifestResult.manifest.controllers)) {
      const routes = normalizedManifestDraftRoutes(index, playbook);
      if (routes) index.draftRoutes.set(playbook, routes);
    }
  }
  return index;
}

/** Ordered, manifest-owned fresh-draft route for one selected workflow. */
export function controllerDraftRouteNodes(index, playbook, workflow = null) {
  const routes = index?.draftRoutes?.get(playbook) || normalizedManifestDraftRoutes(index, playbook);
  if (!routes) return [];
  if (workflow === null) {
    const framed = Array.isArray(routes.framed) ? routes.framed : [];
    const pure = Array.isArray(routes.pure) ? routes.pure : [];
    // Before a workflow is selected, expose only the common narrative and
    // workflow-selection prefix. Shared visual and production nodes become
    // routable only after the canonical source binds framed or pure.
    const common = framed.filter((nodeId, index) => pure[index] === nodeId);
    const selectionIndex = common.indexOf("select-target-page-image-workflow");
    return selectionIndex >= 0 ? common.slice(0, selectionIndex + 1) : [];
  }
  if (!PAGE_IMAGE_WORKFLOWS.includes(workflow) || !Array.isArray(routes[workflow])) return [];
  return [...routes[workflow]];
}

export function controllerDraftRouteIncludes(index, playbook, workflow, nodeId) {
  return controllerDraftRouteNodes(index, playbook, workflow).includes(nodeId);
}

function addError(errors, node, rule, message) {
  errors.push({
    rule,
    node: node?.id || null,
    source: node?.source || null,
    line: node?.line || null,
    message,
  });
}

function hasExactSet(values, expected) {
  return values.length === expected.length && expected.every((value) => values.includes(value));
}

function conditionKind(condition) {
  if (DETERMINISTIC_CONDITIONS.has(condition)) return "deterministic";
  if (/^gate_approved:[a-z0-9-]+$/.test(condition)) return "deterministic";
  if (/^node_(?:done|completed):[a-z0-9-]+$/.test(condition)) return "node";
  if (/^node_status:[a-z0-9-]+:(?:pending|in_progress|completed|skipped|failed)$/.test(condition)) return "node";
  if (/^evidence:[a-z0-9-]+$/.test(condition)) return "current-evidence";
  if (/^user_evidence:[a-z0-9-]+$/.test(condition)) return "current-evidence";
  if (["decision_recorded", "user_decision_recorded"].includes(condition)) return "current-decision";
  if (/^node_evidence:[a-z0-9-]+:[a-z0-9-]+$/.test(condition)) return "cross-evidence";
  if (/^node_decision:[a-z0-9-]+:.+$/.test(condition)) return "cross-decision";
  return "unknown";
}

function validateNodeShape(node, errors) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(node.id)) {
    addError(errors, node, "node-id", `invalid kebab-case node id ${JSON.stringify(node.id)}`);
  }
  if (RESERVED_NODE_IDS.includes(node.id)) {
    addError(errors, node, "reserved-id", `${node.id} is reserved for system evidence`);
  }
  if (Object.hasOwn(node.raw || {}, "draft_route") && node.raw.draft_route !== true) {
    addError(errors, node, "draft-route", "draft_route may only be the literal Boolean true when present");
  }
  if (node.draftRoute && node.playbook !== "create-deck") {
    addError(errors, node, "draft-route", "draft_route is limited to create-deck nodes");
  }
  if (!METHOD_MODULES.includes(node.methodModule)) {
    addError(errors, node, "method-module", `invalid method_module ${JSON.stringify(node.methodModule)}`);
  }
  const targetStageFour = TARGET_STAGE_FOUR_MODULES.has(node.methodModule);
  const targetWorkflow = TARGET_WORKFLOW_MODULES[node.methodModule] || null;
  if (targetStageFour && node.adapter !== "page-image-workflow") addError(errors, node, "image-production-adapter", "target 03/04/05 nodes require adapter: page-image-workflow");
  if (!targetStageFour && node.adapter != null) addError(errors, node, "image-production-adapter", "only target Page Image production nodes may declare an adapter");
  if (targetStageFour && node.playbook !== "create-deck") {
    addError(errors, node, "image-production-adapter", "target 03/04/05 production is owned by create-deck");
  }
  if (node.productionWorkflows.length > 0) {
    if (new Set(node.productionWorkflows).size !== node.productionWorkflows.length) {
      addError(errors, node, "production-workflows", "production_workflows must be unique");
    }
    for (const workflow of node.productionWorkflows) {
      if (!SUPPORTED_PRODUCTION_WORKFLOWS.includes(workflow)) {
        addError(errors, node, "production-workflows", `unsupported production workflow ${workflow}`);
      }
    }
  }
  if (targetWorkflow && !hasExactSet(node.productionWorkflows, [targetWorkflow])) {
    addError(errors, node, "production-workflows", `${node.methodModule} requires production_workflows: [${targetWorkflow}]`);
  }
  if (node.methodModule === "05-delivery" && !hasExactSet(node.productionWorkflows, PAGE_IMAGE_WORKFLOWS)) {
    addError(errors, node, "production-workflows", "05-delivery must apply to both target workflows without a semantic branch");
  }
  if (node.methodModule === "06-iteration" && node.productionWorkflows.length === 0) {
    addError(errors, node, "production-workflows", "06-iteration requires one or both target workflows");
  }
  if (!Array.isArray(node.raw?.requires) || !Array.isArray(node.raw?.entry) || !Array.isArray(node.raw?.exit)) {
    addError(errors, node, "node-lists", "requires, entry, and exit must be YAML arrays");
  }
  if (node.steps.length === 0) {
    addError(errors, node, "steps", "node body has no canonical Step declaration");
  } else {
    node.steps.forEach((step, index) => {
      if (step.number !== index + 1) addError(errors, node, "steps", "step numbers must start at 1 and be consecutive");
    });
  }
  if (node.decisions.length > 0) {
    if (new Set(node.decisions).size !== node.decisions.length) {
      addError(errors, node, "decisions", "decision values must be unique");
    }
    if (!node.steps.some((step) => step.type === "GATE")) {
      addError(errors, node, "decisions", "a node with decisions must contain a GATE step");
    }
    if (!node.exit.some((condition) => ["decision_recorded", "user_decision_recorded"].includes(condition))) {
      addError(errors, node, "decisions", "a node with decisions must persist a decision at exit");
    }
  }
}

function validateConditions(node, errors, available) {
  for (const [placement, conditions] of [["entry", node.entry], ["exit", node.exit]]) {
    for (const condition of conditions) {
      const kind = conditionKind(condition);
      if (kind === "unknown") {
        addError(errors, node, "condition", `unknown ${placement} condition ${condition}`);
        continue;
      }
      if (placement === "entry" && ["current-evidence", "current-decision"].includes(kind)) {
        addError(errors, node, "condition-placement", `${condition} is exit-only`);
      }
      if (kind === "cross-evidence" || kind === "cross-decision") {
        const [, upstream, value] = condition.split(":");
        if (!node.requires.includes(upstream)) {
          addError(errors, node, "cross-node", `${condition} must reference a declared required node`);
        }
        const upstreamNode = available.get(upstream);
        if (kind === "cross-decision" && upstreamNode && !upstreamNode.decisions.includes(value)) {
          addError(errors, node, "decision-value", `${value} is not declared by ${upstream}`);
        }
      }
      if (
        condition === `node_status:${node.id}:completed` ||
        condition === `node_completed:${node.id}` ||
        condition === `node_done:${node.id}`
      ) {
        addError(errors, node, "self-entry", `${condition} is an impossible self condition`);
      }
    }
  }
}

function sameOrderedValues(actual, expected) {
  return Array.isArray(actual) && Array.isArray(expected) && actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function validateManifestDraftRoutes(index, controller, manifestEntry, errors) {
  const declaredNodes = controller.nodes.filter((node) => node.draftRoute);
  const routes = manifestEntry?.draft_route_nodes;
  if (routes === undefined) {
    if (declaredNodes.length > 0) {
      errors.push({ rule: "draft-route", source: controller.source, line: 1, message: "draft_route declarations require manifest draft_route_nodes" });
    }
    return;
  }
  if (controller.playbook !== "create-deck") {
    errors.push({ rule: "draft-route", source: controller.source, line: 1, message: "only create-deck may declare manifest draft_route_nodes" });
    return;
  }
  if (!routes || typeof routes !== "object" || Array.isArray(routes) ||
    Object.keys(routes).length !== PAGE_IMAGE_WORKFLOWS.length || !PAGE_IMAGE_WORKFLOWS.every((workflow) => Object.hasOwn(routes, workflow))) {
    errors.push({ rule: "draft-route", source: controller.source, line: 1, message: "draft_route_nodes must contain exactly framed and pure arrays" });
    return;
  }
  for (const workflow of PAGE_IMAGE_WORKFLOWS) {
    const expected = routes[workflow];
    if (!Array.isArray(expected) || new Set(expected).size !== expected.length || expected.some((nodeId) => typeof nodeId !== "string")) {
      errors.push({ rule: "draft-route", source: controller.source, line: 1, message: `${workflow} draft_route_nodes must be a unique ordered node array` });
      continue;
    }
    const actual = controller.nodes
      .filter((node) => node.draftRoute && nodeAppliesToWorkflow(node, workflow))
      .map((node) => node.id);
    if (!sameOrderedValues(actual, expected)) {
      errors.push({ rule: "draft-route", source: controller.source, line: 1, message: `${workflow} draft_route_nodes must exactly match node-declared draft_route projection` });
    }
    for (const nodeId of expected) {
      const node = controller.nodes.find((entry) => entry.id === nodeId);
      if (!node || !node.draftRoute || !nodeAppliesToWorkflow(node, workflow)) {
        errors.push({ rule: "draft-route", source: controller.source, line: 1, message: `${workflow} draft route contains an unknown, sibling, or undeclared node ${nodeId}` });
      }
    }
  }
}

function validateControllerManifest(index, errors) {
  for (const message of index.manifestErrors || []) errors.push({ rule: "manifest", source: index.manifestPath, line: 1, message });
  const manifest = index.controllerManifest;
  if (!manifest) return;
  if (manifest.schema !== "pptmaker-controller-manifest" || !Array.isArray(manifest.shared_nodes) ||
    !manifest.controllers || typeof manifest.controllers !== "object" || Array.isArray(manifest.controllers)) {
    errors.push({ rule: "manifest", source: index.manifestPath, line: 1, message: "controller manifest has an invalid top-level schema" });
    return;
  }
  const shared = [...index.shared.keys()].sort();
  if (!sameOrderedValues([...manifest.shared_nodes].sort(), shared)) {
    errors.push({ rule: "manifest", source: index.manifestPath, line: 1, message: "manifest shared_nodes do not match active shared nodes" });
  }
  const manifestControllers = Object.keys(manifest.controllers).sort();
  const activeControllers = [...index.controllers.keys()].sort();
  if (!sameOrderedValues(manifestControllers, activeControllers)) {
    errors.push({ rule: "manifest", source: index.manifestPath, line: 1, message: "manifest controllers do not match active controllers" });
  }
  for (const [playbook, controller] of index.controllers) {
    const entry = manifest.controllers[playbook];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      errors.push({ rule: "manifest", source: index.manifestPath, line: 1, message: `manifest is missing controller ${playbook}` });
      continue;
    }
    const allowed = new Set(["supported_pipelines", "nodes", "draft_route_nodes"]);
    for (const key of Object.keys(entry)) {
      if (!allowed.has(key)) errors.push({ rule: "manifest", source: index.manifestPath, line: 1, message: `manifest ${playbook} has unknown key ${key}` });
    }
    if (!sameOrderedValues(entry.supported_pipelines, controller.supportedPipelines)) {
      errors.push({ rule: "manifest", source: index.manifestPath, line: 1, message: `manifest ${playbook} supported_pipelines drift` });
    }
    if (!sameOrderedValues(entry.nodes, controllerNodeIds(index, playbook))) {
      errors.push({ rule: "manifest", source: index.manifestPath, line: 1, message: `manifest ${playbook} node order drift` });
    }
    validateManifestDraftRoutes(index, controller, entry, errors);
  }
}

function validateProgressivePageProductionNodes(controller, errors) {
  if (controller.playbook !== "create-deck") return;
  const nodes = new Map(controller.nodes.map((node) => [node.id, node]));
  const presentProgressive = [...nodes.keys()].some((id) => /^(?:plan|recommend|authorize|generate|review)-target-(?:framed|pure)-(?:progressive-raw|pilot|expansion|raw)$/.test(id));
  if (!presentProgressive) return;
  for (const workflow of PAGE_IMAGE_WORKFLOWS) {
    const expected = progressiveRawNodeIds(workflow);
    for (const id of expected) {
      const node = nodes.get(id);
      if (!node) {
        errors.push({ rule: "progressive-page-production", source: controller.source, line: 1, message: `missing ${workflow} progressive node ${id}` });
        continue;
      }
      if (!hasExactSet(node.productionWorkflows, [workflow])) {
        addError(errors, node, "progressive-page-production", `${id} must remain selected-workflow specific`);
      }
    }
    const [plan, recommend, authorizePilot, generatePilot, reviewPilot, planExpansion, authorizeExpansion, generateExpansion, reviewRaw, publish] = expected;
    const requiredPairs = [
      [plan, `promote-target-${workflow}-style-master`],
      [recommend, plan],
      [authorizePilot, recommend],
      [generatePilot, authorizePilot],
      [reviewPilot, generatePilot],
      [planExpansion, reviewPilot],
      [authorizeExpansion, planExpansion],
      [generateExpansion, authorizeExpansion],
      [reviewRaw, plan],
      [publish, reviewRaw],
    ];
    for (const [nodeId, required] of requiredPairs) {
      const node = nodes.get(nodeId);
      if (node && !node.requires.includes(required)) {
        addError(errors, node, "progressive-page-production", `${nodeId} must require ${required}`);
      }
    }
    const planNode = nodes.get(plan);
    if (planNode?.draftRoute !== true) {
      addError(errors, planNode || null, "progressive-page-production", `${plan} must be the selected workflow's first progressive draft-route handoff`);
    }
    for (const id of expected.slice(1)) {
      const node = nodes.get(id);
      if (node?.draftRoute === true) {
        addError(errors, node, "progressive-page-production", `${id} must not be a fresh-draft route node`);
      }
    }
  }
}

export function validatePlaybookIndex(index) {
  const errors = [];
  for (const message of index.errors) errors.push({ rule: "parse", message });
  validateControllerManifest(index, errors);
  for (const [id, nodes] of index.duplicates) {
    for (const node of nodes) addError(errors, node, "duplicate-id", `duplicate node id ${id}`);
  }

  for (const controller of index.controllers.values()) {
    if (controller.supportedPipelines.length === 0) {
      errors.push({ rule: "supported-pipelines", source: controller.source, line: 1, message: "controller must declare supported_pipelines" });
    }
    for (const pipeline of controller.supportedPipelines) {
      if (!SUPPORTED_PIPELINES.includes(pipeline)) {
        errors.push({ rule: "supported-pipelines", source: controller.source, line: 1, message: `unsupported pipeline ${pipeline}` });
      }
    }
    const supportsPageImage = controller.supportedPipelines.includes(PAGE_IMAGE_WORKFLOW_PIPELINE);
    const available = new Map();
    for (const include of controller.includes) {
      const shared = index.shared.get(include);
      if (!shared) {
        errors.push({ rule: "include", source: controller.source, line: 1, message: `unknown include ${include}` });
      } else {
        available.set(include, shared);
      }
    }
    for (const node of controller.nodes) available.set(node.id, node);

    const seen = new Set(controller.includes);
    for (const node of controller.nodes) {
      validateNodeShape(node, errors);
      if (node.productionWorkflows.length > 0 && !supportsPageImage) {
        addError(errors, node, "production-workflows", "production_workflows require page-image-workflow controller ownership");
      }
      for (const required of node.requires) {
        if (!available.has(required)) addError(errors, node, "requires", `unknown required node ${required}`);
        else if (!seen.has(required)) addError(errors, node, "requires-order", `${required} must appear before ${node.id}`);
      }
      validateConditions(node, errors, available);
      seen.add(node.id);
    }

    const visiting = new Set();
    const visited = new Set();
    const walk = (nodeId, path = []) => {
      if (visiting.has(nodeId)) {
        const cycleStart = path.indexOf(nodeId);
        const cycle = [...path.slice(cycleStart), nodeId];
        const node = available.get(nodeId);
        addError(errors, node, "dependency-cycle", `dependency cycle: ${cycle.join(" -> ")}`);
        return;
      }
      if (visited.has(nodeId)) return;
      const node = available.get(nodeId);
      if (!node) return;
      visiting.add(nodeId);
      for (const required of node.requires) walk(required, [...path, nodeId]);
      visiting.delete(nodeId);
      visited.add(nodeId);
    };
    for (const nodeId of available.keys()) walk(nodeId);
    validateProgressivePageProductionNodes(controller, errors);
  }

  for (const node of index.shared.values()) {
    validateNodeShape(node, errors);
    validateConditions(node, errors, index.nodesById);
  }

  return { valid: errors.length === 0, errors };
}

export function controllerNodeIds(index, playbook) {
  const controller = index.controllers.get(playbook);
  if (!controller) return [];
  return [...controller.includes, ...controller.nodes.map((node) => node.id)];
}

/**
 * Workflow-filtered active node IDs for a Controller. Nodes without a
 * production_workflows restriction remain active before selection; selected
 * workflow nodes are absent until the current source selects framed or pure.
 */
export function controllerActiveNodeIds(index, playbook, workflow = null) {
  const controller = index.controllers.get(playbook);
  if (!controller) return [];
  const active = [];
  for (const include of controller.includes) {
    const shared = index.shared.get(include);
    if (nodeAppliesToWorkflow(shared, workflow)) active.push(include);
  }
  for (const node of controller.nodes) {
    if (nodeAppliesToWorkflow(node, workflow)) active.push(node.id);
  }
  return active;
}

export function resolveNode(index, playbook, nodeId) {
  const controller = index.controllers.get(playbook);
  if (!controller) return null;
  if (controller.includes.includes(nodeId)) return index.shared.get(nodeId) || null;
  return controller.nodes.find((node) => node.id === nodeId) || null;
}

export function eligibleNextNodes(index, playbook, state, checkEntryFn) {
  const ids = controllerNodeIds(index, playbook);
  return ids.filter((id) => {
    const record = state?.nodes?.[id];
    if (record && record.execution_id === state.execution_id && ["completed", "skipped", "in_progress"].includes(record.status)) return false;
    return checkEntryFn(id).pass;
  });
}
