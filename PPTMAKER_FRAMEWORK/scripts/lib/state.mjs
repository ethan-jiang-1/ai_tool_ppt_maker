/**
 * state.mjs — Lightweight YAML state reader/writer for run-bundle-state.yaml.
 * Zero npm dependencies. Hand-written parser for the simple state schema.
 *
 * Only touches state-specific fields. Does NOT modify project-metadata.yaml.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const STATE_FILE = 'run-bundle-state.yaml';

// --- Simple YAML parser (covers the state schema subset) ---

function parseYaml(text) {
  const lines = text.split('\n');
  const root = {};
  const stack = [{ obj: root, indent: -1 }];

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line || line.startsWith('#')) continue;

    const indent = line.search(/\S|$/);
    const content = line.trim();

    // Pop stack to correct indent level
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const current = stack[stack.length - 1].obj;

    if (content.includes(': ')) {
      const idx = content.indexOf(': ');
      const key = content.slice(0, idx).trim();
      const value = content.slice(idx + 2).trim();

      if (value === '') {
        // Nested object
        const child = {};
        current[key] = child;
        stack.push({ obj: child, indent });
      } else {
        // Scalar value
        current[key] = parseScalar(value);
      }
    } else if (content.endsWith(':')) {
      const key = content.slice(0, -1).trim();
      const child = {};
      current[key] = child;
      stack.push({ obj: child, indent });
    }
  }

  return root;
}

function parseScalar(val) {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null' || val === '~') return null;
  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
  // Strip quotes
  return val.replace(/^["']|["']$/g, '');
}

// --- Simple YAML writer ---

function toYaml(obj, indent = 0) {
  const pad = '  '.repeat(indent);
  let out = '';

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      out += `${pad}${key}: null\n`;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      out += `${pad}${key}:\n`;
      out += toYaml(value, indent + 1);
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        out += `${pad}${key}: []\n`;
      } else {
        out += `${pad}${key}:\n`;
        for (const item of value) {
          out += `${pad}  - ${item}\n`;
        }
      }
    } else if (typeof value === 'boolean') {
      out += `${pad}${key}: ${value}\n`;
    } else if (typeof value === 'number') {
      out += `${pad}${key}: ${value}\n`;
    } else {
      out += `${pad}${key}: ${value}\n`;
    }
  }

  return out;
}

// --- Public API ---

/**
 * Read run-bundle-state.yaml from a deck directory.
 * Returns default empty state if file doesn't exist.
 * @param {string} deckDir - Path to deck_<name>/
 * @returns {object}
 */
export function readState(deckDir) {
  const statePath = join(deckDir, STATE_FILE);
  if (!existsSync(statePath)) {
    return createDefaultState();
  }
  return parseYaml(readFileSync(statePath, 'utf-8'));
}

/**
 * Read state from a version directory (deck_<name>/3_versions/v1).
 * @param {string} runDir - Path to version dir
 * @returns {object}
 */
export function readStateFromRunDir(runDir) {
  // up two levels: 3_versions/v1 → deck root
  const deckDir = join(runDir, '..', '..');
  return readState(deckDir);
}

/**
 * Write run-bundle-state.yaml to a deck directory.
 * @param {string} deckDir - Path to deck_<name>/
 * @param {object} state
 */
export function writeState(deckDir, state) {
  const statePath = join(deckDir, STATE_FILE);
  state.updated_at = new Date().toISOString();
  writeFileSync(statePath, toYaml(state), 'utf-8');
}

/**
 * Create a default empty state.
 */
function createDefaultState() {
  return {
    playbook: '',
    current_node: '',
    started_at: new Date().toISOString(),
    updated_at: '',
    nodes: {},
    gates: { content: 'pending', visual: 'pending' },
    deck: { name: '', type: '', style: '' },
  };
}

/**
 * Set a node's status and optional extra fields.
 * @param {object} state - Current state (mutated in place)
 * @param {string} nodeName
 * @param {string} status - pending|in_progress|completed|skipped|failed
 * @param {object} [extra] - Optional extra fields (e.g., { decision: 'proceed' })
 */
export function setNodeStatus(state, nodeName, status, extra = {}) {
  if (!state.nodes[nodeName]) {
    state.nodes[nodeName] = {};
  }
  state.nodes[nodeName].status = status;
  const now = new Date().toISOString();
  if (status === 'in_progress') {
    state.nodes[nodeName].started = now;
  }
  if (status === 'completed' || status === 'skipped' || status === 'failed') {
    state.nodes[nodeName].completed = now;
  }
  Object.assign(state.nodes[nodeName], extra);
  state.current_node = nodeName;
}

/**
 * Set a gate status.
 * @param {object} state
 * @param {string} gateName - content|visual
 * @param {string} status - pending|approved|waived
 */
export function setGate(state, gateName, status) {
  if (!state.gates) state.gates = {};
  state.gates[gateName] = status;
}

export { STATE_FILE };
