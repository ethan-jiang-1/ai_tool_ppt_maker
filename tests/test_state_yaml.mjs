import { describe, it, expect } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  STATE_DIR,
  STATE_FILE,
  createDefaultState,
  createInitialState,
  writeState,
  readState,
  switchPlaybook,
  resumePlaybook,
  startPlaybook,
  setNodeStatus,
  setGate,
  setNodeEvidence,
  getNodeStatus,
  getPendingNodes,
  isPlaybookComplete,
  STATE_SCHEMA_VERSION,
  healState,
  normalizePlaybookStack,
} from '../PPTMAKER_FRAMEWORK/scripts/lib/state.mjs';

function tmpDeck(tag) {
  const deck = join(tmpdir(), `deck_state_${tag}_${Date.now()}_${Math.random().toString(16).slice(2)}`);
  mkdirSync(join(deck, STATE_DIR), { recursive: true });
  return deck;
}

describe('state.yaml yaml library + heal', () => {
  it('empty playbook_stack round-trips as array', () => {
    const deck = tmpDeck('empty');
    try {
      const s = createDefaultState();
      expect(Array.isArray(s.playbook_stack)).toBe(true);
      expect(s.playbook_stack).toHaveLength(0);
      writeState(deck, s);
      const body = readFileSync(join(deck, STATE_DIR, STATE_FILE), 'utf-8');
      expect(body.startsWith('#')).toBe(true);
      expect(body).toMatch(/playbook_stack:\s*\[\]/);
      const loaded = readState(deck);
      expect(Array.isArray(loaded.playbook_stack)).toBe(true);
      expect(loaded.playbook_stack).toHaveLength(0);
      expect(() => switchPlaybook(loaded, 'iterate-style')).toThrow(/active playbook/);
      startPlaybook(loaded, 'create-deck');
      expect(() => switchPlaybook(loaded, 'iterate-style')).not.toThrow();
      expect(loaded.playbook_stack).toHaveLength(1);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('non-empty playbook_stack round-trips object entries', () => {
    const deck = tmpDeck('stack');
    try {
      const s = createInitialState('demo', 'keynote', 'dark');
      s.current_node = 'setup';
      switchPlaybook(s, 'iterate-style');
      writeState(deck, s);
      const loaded = readState(deck);
      expect(Array.isArray(loaded.playbook_stack)).toBe(true);
      expect(loaded.playbook_stack).toHaveLength(1);
      expect(loaded.playbook_stack[0].playbook).toBe('create-deck');
      expect(loaded.playbook_stack[0].current_node).toBe('setup');
      expect(loaded.playbook).toBe('iterate-style');
      resumePlaybook(loaded);
      expect(loaded.playbook).toBe('create-deck');
      expect(loaded.current_node).toBe('setup');
      expect(loaded.playbook_stack).toHaveLength(0);
      writeState(deck, loaded);
      const again = readState(deck);
      expect(again.playbook).toBe('create-deck');
      expect(Array.isArray(again.playbook_stack)).toBe(true);
      expect(again.playbook_stack).toHaveLength(0);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('legacy playbook_stack: {} is healed and rewritten', () => {
    const deck = tmpDeck('legacy');
    try {
      const dirty = `\
# header
playbook: create-deck
current_node: setup
nodes: {}
gates:
  content: pending
  visual: pending
deck:
  name: x
  type: keynote
  style: dark
playbook_stack: {}
`;
      writeFileSync(join(deck, STATE_DIR, STATE_FILE), dirty, 'utf-8');
      const loaded = readState(deck);
      expect(loaded.corrupted).toBeFalsy();
      expect(Array.isArray(loaded.playbook_stack)).toBe(true);
      expect(loaded.playbook_stack).toHaveLength(0);
      expect(loaded._healed).toBe(true);
      const body = readFileSync(join(deck, STATE_DIR, STATE_FILE), 'utf-8');
      expect(body).toMatch(/playbook_stack:\s*\[\]/);
      expect(() => switchPlaybook(loaded, 'iterate-style')).not.toThrow();
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('unparseable YAML is backed up and seeded usable', () => {
    const deck = tmpDeck('broken');
    try {
      // Truly unparseable for `yaml` parseDocument (not merely warn-and-recover)
      writeFileSync(join(deck, STATE_DIR, STATE_FILE), '][}{', 'utf-8');
      const loaded = readState(deck);
      expect(loaded.corrupted).toBeFalsy();
      expect(typeof loaded.playbook).toBe('string');
      expect(Array.isArray(loaded.playbook_stack)).toBe(true);
      expect(existsSync(join(deck, STATE_DIR, STATE_FILE))).toBe(true);
      const backups = readdirSync(join(deck, STATE_DIR)).filter((f) =>
        f.startsWith(`${STATE_FILE}.broken.`)
      );
      expect(backups.length).toBeGreaterThanOrEqual(1);
      const strict = readState(deck, { heal: false });
      expect(strict.corrupted).toBeFalsy();
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('parse-with-errors still heals to usable mapping and rewrites', () => {
    const deck = tmpDeck('warn');
    try {
      writeFileSync(
        join(deck, STATE_DIR, STATE_FILE),
        'playbook: [\n  this is not: valid: yaml :::\n',
        'utf-8'
      );
      const loaded = readState(deck);
      expect(loaded.corrupted).toBeFalsy();
      expect(typeof loaded.playbook).toBe('string');
      expect(Array.isArray(loaded.playbook_stack)).toBe(true);
      expect(loaded._healed).toBe(true);
      const body = readFileSync(join(deck, STATE_DIR, STATE_FILE), 'utf-8');
      expect(body.startsWith('#')).toBe(true);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('heal:false still exposes corruption for diagnostics', () => {
    const deck = tmpDeck('strict');
    try {
      writeFileSync(join(deck, STATE_DIR, STATE_FILE), '][}{', 'utf-8');
      const loaded = readState(deck, { heal: false });
      expect(loaded.corrupted).toBe(true);
      expect(Array.isArray(loaded.errors)).toBe(true);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('healState + normalizePlaybookStack are idempotent on clean state', () => {
    const s = createInitialState('a', 'pitch', 'x');
    const { state, dirty } = healState(s);
    expect(dirty).toBe(false);
    normalizePlaybookStack(state);
    expect(Array.isArray(state.playbook_stack)).toBe(true);
  });

  it('waiting_for survives heal round-trip', () => {
    const deck = tmpDeck('waiting');
    try {
      const s = createInitialState('demo', 'keynote', 'dark');
      s.playbook = 'iterate-style';
      s.current_node = 'review-gate';
      s.nodes = {
        'review-gate': {
          status: 'in_progress',
          waiting_for: 'user:review-style-master',
          note: 'open style master',
        },
      };
      writeState(deck, s);
      const loaded = readState(deck);
      expect(loaded.nodes['review-gate'].waiting_for).toBe('user:review-style-master');
      expect(loaded.nodes['review-gate'].note).toBe('open style master');
      const { state: healed, dirty } = healState(JSON.parse(JSON.stringify(loaded)));
      expect(healed.nodes['review-gate'].waiting_for).toBe('user:review-style-master');
      expect(healed.nodes['review-gate'].note).toBe('open style master');
      expect(dirty).toBe(false);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('buildResumeCard: waiting_for shapes summary and suggested_next', async () => {
    const { buildResumeCard } = await import('../PPTMAKER_FRAMEWORK/scripts/lib/state.mjs');
    const s = createDefaultState();
    s.playbook = 'iterate-style';
    s.current_node = 'review-gate';
    s.nodes = {
      'review-gate': {
        status: 'in_progress',
        waiting_for: 'user:review-style-master',
      },
    };
    const card = buildResumeCard(s, {
      style_master: true,
      raw_images: 3,
      expected_slides: 22,
      pptx: ['deck.pptx'],
    });
    expect(card.workflow_summary).toMatch(/等人/);
    expect(card.workflow_summary).toMatch(/user:review-style-master/);
    expect(card.suggested_next).toBe('waiting:user:review-style-master');
    expect(card.playbook).toBe('iterate-style');
    expect(card.current_node).toBe('review-gate');
  });

  it('buildResumeCard: artifact heuristics when not waiting', async () => {
    const { buildResumeCard } = await import('../PPTMAKER_FRAMEWORK/scripts/lib/state.mjs');
    const s = createDefaultState();
    s.playbook = 'create-deck';
    s.current_node = 'wave3';
    s.nodes = { wave3: { status: 'in_progress' } };
    const mid = buildResumeCard(s, {
      style_master: true,
      raw_images: 3,
      expected_slides: 22,
      pptx: [],
    });
    expect(mid.workflow_summary).toMatch(/页图/);
    expect(mid.suggested_next).toBe('continue:create-deck/wave3');
    const done = buildResumeCard(s, {
      style_master: true,
      raw_images: 22,
      expected_slides: 22,
      pptx: ['deck.pptx'],
    });
    expect(done.workflow_summary).toMatch(/PPTX/);
  });

  it('rejects invalid node/gate enum writes without mutation', () => {
    const s = createInitialState('demo', 'keynote', 'dark');
    expect(() => setNodeStatus(s, 'wave0', 'done')).toThrow(/invalid node status/);
    expect(s.nodes.wave0).toBeUndefined();
    expect(() => setGate(s, 'visual', 'done')).toThrow(/invalid gate status/);
    expect(s.gates.visual).toBe('pending');
  });

  it('cleans incompatible timestamps when a completed node restarts', () => {
    const s = createInitialState('demo', 'keynote', 'dark');
    setNodeStatus(s, 'wave0', 'completed', { failed_reason: 'old' });
    expect(s.nodes.wave0.completed).toBeTruthy();
    expect(s.nodes.wave0.failed_reason).toBeUndefined();
    setNodeStatus(s, 'wave0', 'in_progress');
    expect(s.nodes.wave0.completed).toBeUndefined();
    expect(s.nodes.wave0.started).toBeTruthy();
  });

  it('migrates legacy schema, decisions, aliases, gates, and execution fields idempotently', () => {
    const legacy = {
      playbook: 'edit-text',
      current_node: 'verify-output',
      started_at: '2026-01-01T00:00:00.000Z',
      nodes: {
        'verify-output': { status: 'done', decision: 'proceed', evidence: { old: true } },
        'verify-text-output': { status: 'in_progress', note: 'canonical' },
      },
      gates: { content: 'yes', visual: 'approved' },
      deck: { name: 'x' },
      playbook_stack: [{ playbook: 'create-deck', current_node: 'hitl2' }],
    };
    const first = healState(legacy).state;
    expect(first.schema_version).toBe(STATE_SCHEMA_VERSION);
    expect(first.current_node).toBe('verify-text-output');
    expect(first.nodes['verify-output']).toBeUndefined();
    expect(first.nodes['verify-text-output'].status).toBe('in_progress');
    expect(first.nodes['verify-text-output'].note).toContain('canonical');
    expect(first.nodes['verify-text-output'].decision.kind).toBe('agent');
    expect(first.nodes['verify-text-output'].evidence.old.kind).toBe('agent');
    expect(first.gates.content).toBe('pending');
    expect(first.execution_id).toBeTruthy();
    expect(first.playbook_stack[0].controller_nodes).toEqual({});
    expect(first.playbook_stack[0].diagnostic).toMatch(/legacy stack/);
    const second = healState(first).state;
    expect(second.execution_id).toBe(first.execution_id);
    expect(second.playbook_stack[0].execution_id).toBe(first.playbook_stack[0].execution_id);
    expect(second).toEqual(first);
  });

  it('heal removes controller records outside the active playbook working set', () => {
    const healed = healState({
      playbook: 'iterate-style',
      current_node: 'review-gate',
      started_at: '2026-07-12T00:00:00.000Z',
      nodes: {
        'review-gate': { status: 'in_progress' },
        'intake-source': { status: 'completed' },
        'header-review': { by_version: { '3_versions/v1': { status: 'completed' } } },
      },
      gates: { content: 'pending', visual: 'pending' },
      deck: {},
      playbook_stack: [],
    }).state;
    expect(healed.nodes['review-gate']).toBeDefined();
    expect(healed.nodes['intake-source']).toBeUndefined();
    expect(healed.nodes['header-review']).toBeDefined();
    expect(healed.diagnostics).toContain('intake-source removed from active iterate-style working set');
  });

  it('isolates repeated executions while preserving reserved system evidence', () => {
    const s = createInitialState('demo', 'keynote', 'dark');
    setNodeStatus(s, 'instantiation', 'completed');
    s.nodes['header-review'] = { by_version: { v1: { status: 'completed' } } };
    const workflowStarted = s.started_at;
    startPlaybook(s, 'edit-text');
    expect(s.started_at).toBe(workflowStarted);
    expect(s.nodes.instantiation).toBeUndefined();
    expect(s.nodes['header-review']).toBeDefined();
    expect(getNodeStatus(s, 'classify-change')).toBe('pending');
  });

  it('requires explicit replacement for an incomplete top-level execution', () => {
    const s = createInitialState('demo', 'keynote', 'dark');
    setNodeStatus(s, 'instantiation', 'in_progress');
    expect(() => startPlaybook(s, 'edit-text')).toThrow(/incomplete/);
    const oldId = s.execution_id;
    startPlaybook(s, 'edit-text', { replace: true });
    expect(s.execution_id).not.toBe(oldId);
    expect(s.nodes.instantiation).toBeUndefined();
  });

  it('snapshots parent controller records across nested shared-node reuse', () => {
    const s = createInitialState('demo', 'keynote', 'dark');
    s.playbook = 'edit-text';
    setNodeStatus(s, 'classify-change', 'completed');
    setNodeEvidence(s, 'classify-change', 'change-classified', { kind: 'agent' });
    const parentId = s.execution_id;
    const parentEvidence = structuredClone(s.nodes['classify-change'].evidence);
    switchPlaybook(s, 'edit-visual');
    expect(s.nodes['classify-change']).toBeUndefined();
    setNodeStatus(s, 'classify-change', 'completed');
    setNodeEvidence(s, 'classify-change', 'playbook-selected', { kind: 'agent' });
    expect(s.nodes['classify-change'].execution_id).not.toBe(parentId);
    resumePlaybook(s);
    expect(s.execution_id).toBe(parentId);
    expect(s.nodes['classify-change'].evidence).toEqual(parentEvidence);
    expect(s.playbook_stack).toEqual([]);
  });

  it('controller-aware queries include unwritten nodes and ignore reserved records', () => {
    const s = createInitialState('demo', 'keynote', 'dark');
    setNodeStatus(s, 'instantiation', 'completed');
    s.nodes['header-review'] = { status: 'in_progress' };
    const ids = ['instantiation', 'hitl1', 'setup'];
    expect(getPendingNodes(s, ids)).toEqual(['hitl1', 'setup']);
    expect(isPlaybookComplete(s, ids)).toBe(false);
    setNodeStatus(s, 'hitl1', 'skipped');
    setNodeStatus(s, 'setup', 'completed');
    expect(isPlaybookComplete(s, ids)).toBe(true);
  });

  it('writes state through a same-directory temp and leaves no stale sibling', () => {
    const deck = tmpDeck('atomic');
    try {
      const stale = join(deck, STATE_DIR, `.${STATE_FILE}.tmp-stale`);
      writeFileSync(stale, 'stale', 'utf8');
      const s = createInitialState('demo', 'keynote', 'dark');
      writeState(deck, s);
      const names = readdirSync(join(deck, STATE_DIR));
      expect(names).toContain(STATE_FILE);
      expect(names.some((name) => name.startsWith(`.${STATE_FILE}.tmp-`))).toBe(false);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });
});
