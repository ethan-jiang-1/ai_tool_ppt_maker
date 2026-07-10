/**
 * state.mjs — Complete State API for run-bundle-state.yaml.
 * Zero npm dependencies. MD and CLI both use this to read/write state.
 */
import { readFileSync, writeFileSync, existsSync, renameSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';

export const STATE_DIR = '_state';
export const STATE_FILE = 'state.yaml';
export const HISTORY_FILE = 'history.jsonl';

// --- YAML ---
function parseYaml(text) {
  const lines = text.split('\n'), root = {}, stack = [{ obj: root, indent: -1 }];
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, ''); if (!line || line.startsWith('#')) continue;
    const indent = line.search(/\S|$/), content = line.trim();
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
    const cur = stack[stack.length - 1].obj;
    if (content.includes(': ')) {
      const i = content.indexOf(': '), k = content.slice(0, i).trim(), v = content.slice(i + 2).trim();
      if (v === '') { const c = {}; cur[k] = c; stack.push({ obj: c, indent }); }
      else cur[k] = _scalar(v);
    } else if (content.endsWith(':')) { const c = {}; cur[content.slice(0, -1).trim()] = c; stack.push({ obj: c, indent }); }
  }
  return root;
}
function _scalar(v) { if (v === 'true') return true; if (v === 'false') return false; if (v === 'null'||v === '~') return null; if (/^-?\d+$/.test(v)) return parseInt(v); if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v); return v.replace(/^["']|["']$/g,''); }
function toYaml(obj, indent = 0) {
  const pad = '  '.repeat(indent); let out = '';
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) out += `${pad}${k}: null\n`;
    else if (typeof v === 'object' && !Array.isArray(v)) { out += `${pad}${k}:\n`; out += toYaml(v, indent + 1); }
    else if (Array.isArray(v)) { out += `${pad}${k}:\n`; for (const i of v) out += `${pad}  - ${i}\n`; }
    else out += `${pad}${k}: ${v}\n`;
  }
  return out;
}

// --- CORE ---
export function statePath(deckDir) { return join(deckDir, STATE_DIR, STATE_FILE); }
export function historyPath(deckDir) { return join(deckDir, STATE_DIR, HISTORY_FILE); }
export function readState(deckDir) { const sp = statePath(deckDir); if (!existsSync(sp)) return createDefaultState(); try { const s = parseYaml(readFileSync(sp, 'utf-8')); if (!s.playbook && Object.keys(s.nodes||{}).length===0) return { corrupted: true, errors: ['missing playbook+nodes'] }; return s; } catch (e) { return { corrupted: true, errors: [e.message] }; } }
export function appendHistory(deckDir, event) { event.at = event.at || new Date().toISOString(); const hp = historyPath(deckDir); mkdirSync(dirname(hp), { recursive: true }); const line = JSON.stringify(event) + '\n'; writeFileSync(hp, line, { flag: 'a' }); }
export function readHistory(deckDir) { const hp = historyPath(deckDir); if (!existsSync(hp)) return []; try { return readFileSync(hp,'utf-8').split('\n').filter(l=>l.trim()).map(l=>{try{return JSON.parse(l)}catch{return null}}).filter(Boolean); } catch { return []; } }
export function writeState(deckDir, state) { state.updated_at = new Date().toISOString(); const sp = statePath(deckDir), tmp = join(tmpdir(), `.state_${randomBytes(4).toString('hex')}.tmp`); mkdirSync(dirname(sp), { recursive: true }); writeFileSync(tmp, toYaml(state), 'utf-8'); renameSync(tmp, sp); }

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

// --- WRITE ---
export function setNodeStatus(state, name, status, extra = {}) { if (!state.nodes) state.nodes = {}; if (!state.nodes[name]) state.nodes[name] = {}; state.nodes[name].status = status; const now = new Date().toISOString(); if (status==='in_progress') state.nodes[name].started = now; if (['completed','skipped','failed'].includes(status)) state.nodes[name].completed = now; Object.assign(state.nodes[name], extra); state.current_node = name; return state; }
export function resetNode(state, name) { if (!state.nodes) state.nodes = {}; state.nodes[name] = { status: 'pending' }; return state; }
export function skipNode(state, name, reason = '') { return setNodeStatus(state, name, 'skipped', { skip_reason: reason }); }
export function setGate(state, name, status) { if (!state.gates) state.gates = {}; state.gates[name] = status; return state; }
export function switchPlaybook(state, newPlaybook) { if (!state.playbook_stack) state.playbook_stack = []; state.playbook_stack.push({ playbook: state.playbook, current_node: state.current_node }); state.playbook = newPlaybook; state.current_node = ''; return state; }
export function resumePlaybook(state) { if (!state.playbook_stack||state.playbook_stack.length===0) return state; const prev = state.playbook_stack.pop(); state.playbook = prev.playbook; state.current_node = prev.current_node; return state; }
export function startPlaybook(state, playbook) { state.playbook = playbook; state.current_node = ''; state.started_at = new Date().toISOString(); if (!state.playbook_stack) state.playbook_stack = []; return state; }
export function createDefaultState() { return { playbook: '', current_node: '', started_at: '', updated_at: '', nodes: {}, gates: { content: 'pending', visual: 'pending' }, deck: { name: '', type: '', style: '' }, playbook_stack: [] }; }
export function createInitialState(deckName, deckType, style) { return { playbook: 'create-deck', current_node: 'instantiation', started_at: new Date().toISOString(), updated_at: '', nodes: {}, gates: { content: 'pending', visual: 'pending' }, deck: { name: deckName, type: deckType||'', style: style||'' }, playbook_stack: [] }; }

// --- VALIDATE ---
export function validateState(state) { const errors = []; if (!state) return { valid: false, errors: ['state is null'] }; if (state.corrupted) return { valid: false, errors: state.errors||['corrupted'] }; if (!state.nodes) errors.push('missing nodes'); if (!state.gates) errors.push('missing gates'); for (const [name, node] of Object.entries(state.nodes||{})) { if (node.status==='in_progress' && node.completed) errors.push(`illegal: ${name} completed→in_progress`); } return { valid: errors.length===0, errors }; }

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
  try { for (const f of readdirSync(dir).filter(x=>x.endsWith('.md'))) { const c=readFileSync(join(dir,f),'utf-8'); if (c.includes(`node: ${nodeName}`)) return c; } } catch {}
  return '';
}

function _check(conds, state, ctx) {
  const missing=[], unknown=[];
  for (const c of conds) { const fn=_resolveCondition(c); if (!fn) { unknown.push(c); continue; } try { if(!fn(state,ctx)) missing.push(c); } catch { missing.push(c); } }
  return { pass: missing.length===0&&unknown.length===0, missing, unknown };
}

export function checkEntry(nodeName, playbookDir, state, ctx = {}) { const md=_findNodeMd(nodeName, playbookDir); const {entry}=_parseNodeYaml(md); return _check(entry, state, ctx); }
export function checkExit(nodeName, playbookDir, state, ctx = {}) { const md=_findNodeMd(nodeName, playbookDir); const {exit}=_parseNodeYaml(md); return _check(exit, state, ctx); }
export function getMissingConditions(nodeName, playbookDir, state, ctx = {}) { const r=checkEntry(nodeName,playbookDir,state,ctx); return [...r.missing,...r.unknown]; }
