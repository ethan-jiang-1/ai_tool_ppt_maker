/**
 * state.mjs — Complete State API for _state/state.yaml (+ _state/history.jsonl).
 * YAML I/O via `yaml` (tolerant read → schema heal → canonical write).
 * MD and CLI both use this to read/write state.
 */
import { readFileSync, writeFileSync, existsSync, renameSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { parseDocument, stringify } from 'yaml';

export const STATE_DIR = '_state';
export const STATE_FILE = 'state.yaml';
export const HISTORY_FILE = 'history.jsonl';

/** Re-emitted on every writeState (stringify regenerates the body). */
export const STATE_YAML_HEADER = `\
# _state/state.yaml — playbook execution state (not a hand-edit playground)
# Schema authority: PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md
# API: PPTMAKER_FRAMEWORK/scripts/lib/state.mjs
# CLI: node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <runDir> [--json|--check-gates]
# Fields: playbook, current_node, nodes.* (status, optional waiting_for/note), gates.{content,visual}, deck.*, playbook_stack
# Coexists with project-metadata.yaml (static config / pipeline gates) — see README.md
# Heal: readState defaults to tolerant parse + schema repair; dirty files are rewritten clean
# Resume: after disconnect / cleared chat, run ppt_flow state first (whole-workflow where-am-I card)
`;

/** Canonical README body for _state/ (Chinese, same voice as other dir READMEs). */
export const STATE_DIR_README = `\
# 执行状态 (_state)

**这里放什么:** playbook 跑到哪了——当前节点、闸门、进度。不是素材，也不是生成的 PPT。整流程「做到哪了」以这里为执行指针，再配合 \`ppt_flow status\` 看产物。

**谁读写:** MD Controller / agent、\`scripts/lib/state.mjs\`、\`ppt_flow.mjs state\`。

**主要文件:**
- \`state.yaml\` — 执行进度真相源（原子写）
- \`history.jsonl\` — 可选参考日志（首次 append 才出现；不参与自动恢复）

**字段一览:** \`playbook\` · \`current_node\` · \`nodes.*\`（\`status\`；可选 \`waiting_for\` / \`note\`）· \`gates.content/visual\` · \`deck.*\` · \`playbook_stack\`

**断线 / 清聊天后续跑:** 先跑 \`node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <runDir>\`（where-am-I 卡：指针 + \`workflow_summary\` + \`suggested_next\`），再动手。进度在 deck 盘上，不在聊天里。

**权威说明:** \`PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md\`  
**API:** \`PPTMAKER_FRAMEWORK/scripts/lib/state.mjs\`

**别手改乱改** \`state.yaml\`——优先用 CLI/API。格式小瑕疵会在下次 \`readState\` 时尽量自动整理（读容错、写洗净）。\`waiting_for\` / \`note\` 会在 heal round-trip 中保留。

**和 \`project-metadata.yaml\` 的关系:** metadata 管静态配置 + 管线闸门字段；这里管 playbook 执行进度与 playbook 闸门。两份共存，不要当成同一份文件合并。

**自留教训不在这里:** 遇事克服后的非密钥教训在 \`_lessons/\`（先读再猜；见 \`_lessons/README.md\`）。密钥只写 \`.env\`。
`;

/**
 * Ensure _state/ exists and README.md is present (create if absent).
 * @param {string} deckDir
 */
export function ensureStateDirHints(deckDir) {
  const dir = join(deckDir, STATE_DIR);
  mkdirSync(dir, { recursive: true });
  const readme = join(dir, 'README.md');
  if (!existsSync(readme)) {
    writeFileSync(readme, STATE_DIR_README, 'utf-8');
  }
}

// --- YAML (yaml package) ---

const YAML_PARSE_OPTS = {
  strict: false,
  uniqueKeys: false,
  logLevel: 'error',
};

/**
 * @param {string} text
 * @returns {{ ok: true, value: object, hadErrors: boolean } | { ok: false, errors: string[] }}
 */
export function parseStateYaml(text) {
  try {
    const doc = parseDocument(text, YAML_PARSE_OPTS);
    const hadErrors = Array.isArray(doc.errors) && doc.errors.length > 0;
    const value = doc.toJS({ mapAsMap: false });
    if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
      return {
        ok: false,
        errors: hadErrors
          ? doc.errors.map((e) => e.message || String(e))
          : ['YAML root is not a mapping'],
      };
    }
    return { ok: true, value, hadErrors };
  } catch (e) {
    return { ok: false, errors: [e.message || String(e)] };
  }
}

/**
 * @param {object} state
 * @returns {string} YAML body without header
 */
export function stringifyStateYaml(state) {
  return stringify(state, { indent: 2, lineWidth: 0 });
}

// --- HEAL ---

/**
 * @param {object} state
 * @returns {object}
 */
export function normalizePlaybookStack(state) {
  if (!state || typeof state !== 'object') return state;
  const s = state.playbook_stack;
  if (!Array.isArray(s)) {
    state.playbook_stack = [];
  } else {
    state.playbook_stack = s
      .filter((e) => e && typeof e === 'object' && !Array.isArray(e))
      .map((e) => ({
        playbook: e.playbook == null ? '' : String(e.playbook),
        current_node: e.current_node == null ? '' : String(e.current_node),
      }));
  }
  return state;
}

/**
 * Schema heal. Mutates and returns { state, dirty }.
 * @param {object} raw
 * @returns {{ state: object, dirty: boolean }}
 */
export function healState(raw) {
  const base = createDefaultState();
  const state = raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...raw } : {};
  let dirty = false;

  const before = JSON.stringify({
    playbook_stack: state.playbook_stack,
    nodes: state.nodes,
    gates: state.gates,
    deck: state.deck,
    playbook: state.playbook,
    current_node: state.current_node,
  });

  if (typeof state.playbook !== 'string') {
    state.playbook =
      state.playbook == null
        ? base.playbook
        : typeof state.playbook === 'object'
          ? base.playbook
          : String(state.playbook);
  }
  if (typeof state.current_node !== 'string') {
    state.current_node = state.current_node == null ? base.current_node : String(state.current_node);
  }
  if (!state.nodes || typeof state.nodes !== 'object' || Array.isArray(state.nodes)) {
    state.nodes = {};
  } else {
    // Preserve optional waiting_for / note; coerce to string when present
    for (const rec of Object.values(state.nodes)) {
      if (!rec || typeof rec !== 'object' || Array.isArray(rec)) continue;
      if (rec.waiting_for != null && typeof rec.waiting_for !== 'string') {
        rec.waiting_for = String(rec.waiting_for);
      }
      if (rec.note != null && typeof rec.note !== 'string') {
        rec.note = String(rec.note);
      }
    }
  }
  if (!state.gates || typeof state.gates !== 'object' || Array.isArray(state.gates)) {
    state.gates = { ...base.gates };
  } else {
    if (state.gates.content == null) state.gates.content = 'pending';
    if (state.gates.visual == null) state.gates.visual = 'pending';
  }
  if (!state.deck || typeof state.deck !== 'object' || Array.isArray(state.deck)) {
    state.deck = { ...base.deck };
  } else {
    state.deck = {
      name: state.deck.name == null ? '' : String(state.deck.name),
      type: state.deck.type == null ? '' : String(state.deck.type),
      style: state.deck.style == null ? '' : String(state.deck.style),
    };
  }
  if (state.started_at == null) state.started_at = '';
  if (state.updated_at == null) state.updated_at = '';

  normalizePlaybookStack(state);

  const after = JSON.stringify({
    playbook_stack: state.playbook_stack,
    nodes: state.nodes,
    gates: state.gates,
    deck: state.deck,
    playbook: state.playbook,
    current_node: state.current_node,
  });
  dirty = before !== after;
  return { state, dirty };
}

function _seedFromBroken(rawText) {
  const seeded = createDefaultState();
  // Best-effort: pull deck.name from broken text
  const m = /(?:^|\n)deck:\s*\n(?:[ \t]+.*\n)*?[ \t]+name:\s*["']?([^\n"']+)/.exec(rawText)
    || /(?:^|\n)name:\s*["']?([^\n"']+)/.exec(rawText);
  if (m) seeded.deck.name = m[1].trim();
  return seeded;
}

// --- CORE ---
export function statePath(deckDir) { return join(deckDir, STATE_DIR, STATE_FILE); }
export function historyPath(deckDir) { return join(deckDir, STATE_DIR, HISTORY_FILE); }

/**
 * @param {string} deckDir
 * @param {{ heal?: boolean }} [opts]
 */
export function readState(deckDir, opts = {}) {
  const heal = opts.heal !== false;
  const sp = statePath(deckDir);
  if (!existsSync(sp)) return createDefaultState();

  let raw;
  try {
    raw = readFileSync(sp, 'utf-8');
  } catch (e) {
    if (!heal) return { corrupted: true, errors: [e.message] };
    const seeded = createDefaultState();
    writeState(deckDir, seeded);
    seeded._healed = true;
    return seeded;
  }

  const parsed = parseStateYaml(raw);
  if (!parsed.ok) {
    if (!heal) return { corrupted: true, errors: parsed.errors };
    const broken = `${sp}.broken.${Date.now()}`;
    try { renameSync(sp, broken); } catch { /* keep going */ }
    const seeded = _seedFromBroken(raw);
    writeState(deckDir, seeded);
    try {
      appendHistory(deckDir, { type: 'state_healed', reason: 'unparseable', backup: broken });
    } catch { /* history optional */ }
    seeded._healed = true;
    return seeded;
  }

  if (!heal) {
    return parsed.value;
  }

  const { state, dirty } = healState(parsed.value);
  const shouldRewrite = dirty || parsed.hadErrors;
  if (shouldRewrite) {
    writeState(deckDir, state);
    try {
      appendHistory(deckDir, {
        type: 'state_healed',
        reason: dirty ? 'schema' : 'parse_errors',
      });
    } catch { /* optional */ }
    state._healed = true;
  }
  return state;
}

export function appendHistory(deckDir, event) {
  event.at = event.at || new Date().toISOString();
  const hp = historyPath(deckDir);
  mkdirSync(dirname(hp), { recursive: true });
  const line = JSON.stringify(event) + '\n';
  writeFileSync(hp, line, { flag: 'a' });
}

export function readHistory(deckDir) {
  const hp = historyPath(deckDir);
  if (!existsSync(hp)) return [];
  try {
    return readFileSync(hp, 'utf-8')
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function writeState(deckDir, state) {
  // Don't persist ephemeral flags
  const { _healed, ...persist } = state;
  persist.updated_at = new Date().toISOString();
  normalizePlaybookStack(persist);
  ensureStateDirHints(deckDir);
  const sp = statePath(deckDir);
  const tmp = join(tmpdir(), `.state_${randomBytes(4).toString('hex')}.tmp`);
  mkdirSync(dirname(sp), { recursive: true });
  writeFileSync(tmp, STATE_YAML_HEADER + stringifyStateYaml(persist), 'utf-8');
  renameSync(tmp, sp);
  // Reflect updated_at on caller's object
  state.updated_at = persist.updated_at;
}

// --- QUERY ---
export function getNodeStatus(state, name) { return state.nodes?.[name]?.status || 'pending'; }
export function getCurrentNode(state) { return state.current_node || ''; }
export function getCompletedNodes(state) { return Object.entries(state.nodes||{}).filter(([,n])=>n.status==='completed').map(([k])=>k); }
export function getPendingNodes(state) { return Object.entries(state.nodes||{}).filter(([,n])=>n.status==='pending'||!n.status).map(([k])=>k); }
export function isNodeCompleted(state, name) { return state.nodes?.[name]?.status === 'completed'; }
export function isNodeDone(state, name) { return ['completed','skipped'].includes(state.nodes?.[name]?.status); }
export function isPlaybookComplete(state) { const ns = state.nodes||{}; return Object.keys(ns).length>0 && Object.values(ns).every(n=>['completed','skipped'].includes(n.status)); }
export function getGateStatus(state, name) { return state.gates?.[name] || 'pending'; }
export function isGateApproved(state, name) { return ['approved','waived'].includes(state.gates?.[name]); }

/**
 * Whole-workflow where-am-I card (heuristics; does not mutate state).
 * @param {object} state
 * @param {{ style_master?: boolean, raw_images?: number, expected_slides?: number, pptx?: string[], pilot_preview?: boolean, content_gate?: string, visual_gate?: string } | null} [statusSnapshot]
 */
export function buildResumeCard(state, statusSnapshot = null) {
  const playbook = state?.playbook == null ? '' : String(state.playbook);
  const current_node = state?.current_node == null ? '' : String(state.current_node);
  const nodeRec =
    state?.nodes && current_node && state.nodes[current_node] && typeof state.nodes[current_node] === 'object'
      ? state.nodes[current_node]
      : {};
  const node_status = nodeRec.status == null ? '' : String(nodeRec.status);
  const waiting_for =
    nodeRec.waiting_for != null && String(nodeRec.waiting_for).trim() !== ''
      ? String(nodeRec.waiting_for)
      : null;
  const note =
    nodeRec.note != null && String(nodeRec.note).trim() !== ''
      ? String(nodeRec.note)
      : null;
  const gates = { ...(state?.gates && typeof state.gates === 'object' ? state.gates : {}) };
  const playbook_stack = Array.isArray(state?.playbook_stack) ? [...state.playbook_stack] : [];

  const pb = playbook || '（未初始化）';
  const cn = current_node || '（未初始化）';
  const execLabel = `${pb} / ${cn}`;

  let workflow_summary;
  if (waiting_for) {
    workflow_summary = `卡在等人：${waiting_for}（${pb}/${cn}）`;
  } else if (statusSnapshot && !statusSnapshot.style_master) {
    workflow_summary = `视觉母版未就绪（${execLabel}）`;
  } else if (
    statusSnapshot &&
    statusSnapshot.style_master &&
    Number(statusSnapshot.expected_slides) > 0 &&
    Number(statusSnapshot.raw_images) < Number(statusSnapshot.expected_slides)
  ) {
    workflow_summary = `生产页图进行中 ${statusSnapshot.raw_images}/${statusSnapshot.expected_slides}（执行点 ${execLabel}）`;
  } else if (
    statusSnapshot &&
    Array.isArray(statusSnapshot.pptx) &&
    statusSnapshot.pptx.length > 0
  ) {
    workflow_summary = `已有交付 PPTX，可迭代（执行点 ${execLabel}）`;
  } else {
    workflow_summary = `执行点：${execLabel}`;
  }

  let suggested_next;
  if (waiting_for) {
    suggested_next = `waiting:${waiting_for}`;
  } else if (node_status === 'in_progress') {
    suggested_next = `continue:${playbook}/${current_node}`;
  } else if (current_node) {
    suggested_next = `advance-or-inspect:${playbook}/${current_node}`;
  } else {
    suggested_next = 'inspect:run ppt_flow state|status';
  }

  return {
    playbook,
    current_node,
    node_status,
    waiting_for,
    note,
    gates,
    playbook_stack,
    workflow_summary,
    suggested_next,
  };
}

// --- WRITE ---
export function setNodeStatus(state, name, status, extra = {}) {
  if (!state.nodes) state.nodes = {};
  if (!state.nodes[name]) state.nodes[name] = {};
  state.nodes[name].status = status;
  const now = new Date().toISOString();
  if (status === 'in_progress') state.nodes[name].started = now;
  if (['completed', 'skipped', 'failed'].includes(status)) state.nodes[name].completed = now;
  Object.assign(state.nodes[name], extra);
  state.current_node = name;
  return state;
}
export function resetNode(state, name) { if (!state.nodes) state.nodes = {}; state.nodes[name] = { status: 'pending' }; return state; }
export function skipNode(state, name, reason = '') { return setNodeStatus(state, name, 'skipped', { skip_reason: reason }); }
export function setGate(state, name, status) { if (!state.gates) state.gates = {}; state.gates[name] = status; return state; }

export function switchPlaybook(state, newPlaybook) {
  normalizePlaybookStack(state);
  state.playbook_stack.push({ playbook: state.playbook, current_node: state.current_node });
  state.playbook = newPlaybook;
  state.current_node = '';
  return state;
}
export function resumePlaybook(state) {
  normalizePlaybookStack(state);
  if (state.playbook_stack.length === 0) return state;
  const prev = state.playbook_stack.pop();
  state.playbook = prev.playbook;
  state.current_node = prev.current_node;
  return state;
}
export function startPlaybook(state, playbook) {
  normalizePlaybookStack(state);
  state.playbook = playbook;
  state.current_node = '';
  state.started_at = new Date().toISOString();
  return state;
}

export function createDefaultState() {
  return {
    playbook: '',
    current_node: '',
    started_at: '',
    updated_at: '',
    nodes: {},
    gates: { content: 'pending', visual: 'pending' },
    deck: { name: '', type: '', style: '' },
    playbook_stack: [],
  };
}
export function createInitialState(deckName, deckType, style) {
  return {
    playbook: 'create-deck',
    current_node: 'instantiation',
    started_at: new Date().toISOString(),
    updated_at: '',
    nodes: {},
    gates: { content: 'pending', visual: 'pending' },
    deck: { name: deckName, type: deckType || '', style: style || '' },
    playbook_stack: [],
  };
}

// --- VALIDATE ---
export function validateState(state) {
  const errors = [];
  if (!state) return { valid: false, errors: ['state is null'] };
  if (state.corrupted) return { valid: false, errors: state.errors || ['corrupted'] };
  if (!state.nodes) errors.push('missing nodes');
  if (!state.gates) errors.push('missing gates');
  for (const [name, node] of Object.entries(state.nodes || {})) {
    if (node.status === 'in_progress' && node.completed) errors.push(`illegal: ${name} completed→in_progress`);
  }
  return { valid: errors.length === 0, errors };
}

// --- CONDITIONS ---
function _c_nodeCompleted(name) { return (s) => s.nodes?.[name]?.status === 'completed'; }
function _c_nodeDone(name) { return (s) => ['completed','skipped'].includes(s.nodes?.[name]?.status); }
function _c_nodeStatus(name, st) { return (s) => s.nodes?.[name]?.status === st; }
function _c_gateApproved(name) { return (s) => ['approved','waived'].includes(s.gates?.[name]); }

export const CONDITIONS = {
  'run_bundle_exists':       (s,ctx) => existsSync(ctx.deckDir||''),
  'deck_guide_created':     (s,ctx) => existsSync(join(ctx.deckDir||'','deck-guide.md')),
  'visual_preset_seeded':   (s,ctx) => existsSync(join(ctx.deckDir||'','2_backbone','visual-style','color_palette.json')),
  'style_master_exists':    (s,ctx) => existsSync(join(ctx.deckDir||'','2_backbone','visual-style','style_master.jpg')),
  'slide_specs_exists':     (s,ctx) => existsSync(join(ctx.runDir||'','slide-specifications.md')),
  'stage1_output_exists':   (s,ctx) => existsSync(join(ctx.runDir||'','_generated','slide_plan.json')),
  'pptx_generated':         (s,ctx) => { try { return readdirSync(join(ctx.runDir||'','_generated','ppt')).some(f=>f.endsWith('.pptx')); } catch { return false; } },
  'speaker_notes_injected': (s,ctx) => isNodeCompleted(s,'wave2'),
  'user_confirmed_direction': (s) => !!s.nodes?.hitl1?.decision,
  'review_decision:proceed':  (s) => s.nodes?.hitl2?.decision === 'proceed',
  'review_decision:repair':   (s) => s.nodes?.hitl2?.decision === 'repair',
};

function _resolveCondition(cond) {
  if (CONDITIONS[cond]) return CONDITIONS[cond];
  if (cond.startsWith('node_completed:')) return _c_nodeCompleted(cond.slice(16));
  if (cond.startsWith('node_done:')) return _c_nodeDone(cond.slice(10));
  if (cond.startsWith('node_status:')) { const p=cond.slice(12).split(':'); if(p.length>=2) return _c_nodeStatus(p[0],p.slice(1).join(':')); }
  if (cond.startsWith('gate_approved:')) return _c_gateApproved(cond.slice(14));
  return null;
}

function _parseNodeYaml(md) {
  let inFM = false, entry = [], exit = [];
  for (const line of md.split('\n')) {
    if (line.trim() === '---') { inFM = !inFM; continue; }
    if (!inFM) continue;
    const t = line.trim();
    if (t.startsWith('entry:')) { entry = []; continue; }
    if (t.startsWith('exit:')) { exit = []; continue; }
    if (t.startsWith('requires:')||t.startsWith('produces:')||t.startsWith('phase:')||t.startsWith('node:')) continue;
    if (t.startsWith('- ')) {
      if (t.includes('entry')) entry.push(t.slice(2).trim());
      else exit.push(t.slice(2).trim());
    }
  }
  return { entry, exit };
}

function _findNodeMd(nodeName, dir) {
  try {
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
      const c = readFileSync(join(dir, f), 'utf-8');
      if (c.includes(`node: ${nodeName}`)) return c;
    }
  } catch { /* ignore */ }
  return '';
}

function _check(conds, state, ctx) {
  const missing = [], unknown = [];
  for (const c of conds) {
    const fn = _resolveCondition(c);
    if (!fn) { unknown.push(c); continue; }
    try { if (!fn(state, ctx)) missing.push(c); } catch { missing.push(c); }
  }
  return { pass: missing.length === 0 && unknown.length === 0, missing, unknown };
}

export function checkEntry(nodeName, playbookDir, state, ctx = {}) {
  const md = _findNodeMd(nodeName, playbookDir);
  const { entry } = _parseNodeYaml(md);
  return _check(entry, state, ctx);
}
export function checkExit(nodeName, playbookDir, state, ctx = {}) {
  const md = _findNodeMd(nodeName, playbookDir);
  const { exit } = _parseNodeYaml(md);
  return _check(exit, state, ctx);
}
export function getMissingConditions(nodeName, playbookDir, state, ctx = {}) {
  const r = checkEntry(nodeName, playbookDir, state, ctx);
  return [...r.missing, ...r.unknown];
}
