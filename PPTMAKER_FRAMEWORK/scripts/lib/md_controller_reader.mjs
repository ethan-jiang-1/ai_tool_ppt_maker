/**
 * md_controller_reader.mjs
 *
 * Purpose: read the framework's Markdown (MD) Controllers so runtime gate
 * checks and tests enforce the declarations that agents and humans can see.
 *
 * Authority boundary:
 * - `PPTMAKER_FRAMEWORK/playbook/*.md` is the only source of truth for
 *   playbook content, node order, dependencies, gates, and instructions.
 * - This module only reads, parses, indexes, and validates those Markdown
 *   declarations. Its index is transient and is rebuilt from the MD files.
 * - This module does NOT define a second playbook, generate controller
 *   content, modify Markdown, make creative decisions, or execute nodes.
 * CLI diagnostic consumer authority: openspec/specs/node-specification/spec.md
 * plus active node-specification deltas discovered through `openspec status`.
 * Producer fields remain owned by cli-surface and are not redefined here.
 */
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { parse } from "yaml";

export const LIFECYCLE_PHASES = Object.freeze(["0", "1", "2", "2.7", "3", "4"]);
export const METHOD_MODULES = Object.freeze([
  "00-setup",
  "01-visual",
  "02-content",
  "03-prompts",
  "04-production",
  "05-iteration",
]);
export const RESERVED_NODE_IDS = Object.freeze(["header-review"]);

const DETERMINISTIC_CONDITIONS = new Set([
  "run_bundle_exists",
  "deck_guide_created",
  "visual_preset_seeded",
  "style_master_exists",
  "slide_specs_exists",
  "slide_specs_valid",
  "pptx_generated",
  "speaker_notes_injected",
  "header_review_current",
]);

function lineNumber(text, offset) {
  return text.slice(0, offset).split("\n").length;
}

function asStringArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value.map((v) => String(v)) : [String(value)];
}

function parseFrontmatter(text, source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!match) return { data: {}, end: 0, error: null };
  try {
    return { data: parse(match[1]) || {}, end: match[0].length, error: null };
  } catch (error) {
    return { data: {}, end: match[0].length, error: `${source}:1: ${error.message}` };
  }
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
    lifecyclePhase: raw?.lifecycle_phase == null ? "" : String(raw.lifecycle_phase),
    methodModule: raw?.method_module == null ? "" : String(raw.method_module),
    legacyPhase: raw?.phase,
    requires: asStringArray(raw?.requires),
    entry: asStringArray(raw?.entry),
    exit: asStringArray(raw?.exit),
    produces: asStringArray(raw?.produces),
    decisions: asStringArray(raw?.decisions),
    shared: raw?.shared === true,
    raw,
    ...meta,
  };
}

export function parseControllerFile(filePath) {
  const text = readFileSync(filePath, "utf8");
  const fm = parseFrontmatter(text, filePath);
  const errors = fm.error ? [fm.error] : [];
  const playbook = fm.data.playbook == null ? "" : String(fm.data.playbook);
  const includes = asStringArray(fm.data.includes);
  const nodes = [];

  if (fm.data.node) {
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
    let raw;
    try {
      raw = parse(match[1]) || {};
    } catch (error) {
      errors.push(`${filePath}:${lineNumber(text, match.index)}: ${error.message}`);
      continue;
    }
    if (!raw.node) continue;
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
    nodes,
    errors,
  };
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

  return { playbookDir, files, controllers, shared, nodesById, duplicates, errors };
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
  if (node.legacyPhase != null) {
    addError(errors, node, "legacy-phase", "replace phase with lifecycle_phase and method_module");
  }
  if (!LIFECYCLE_PHASES.includes(node.lifecyclePhase)) {
    addError(errors, node, "lifecycle-phase", `invalid lifecycle_phase ${JSON.stringify(node.lifecyclePhase)}`);
  }
  if (!METHOD_MODULES.includes(node.methodModule)) {
    addError(errors, node, "method-module", `invalid method_module ${JSON.stringify(node.methodModule)}`);
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

export function validatePlaybookIndex(index) {
  const errors = [];
  for (const message of index.errors) errors.push({ rule: "parse", message });
  for (const [id, nodes] of index.duplicates) {
    for (const node of nodes) addError(errors, node, "duplicate-id", `duplicate node id ${id}`);
  }

  for (const controller of index.controllers.values()) {
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
