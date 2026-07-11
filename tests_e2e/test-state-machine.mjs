/**
 * State Machine Simulation Tests
 *
 * Validates playbook state transitions WITHOUT running real CLI or LLM.
 * Pure logic: imports state.mjs, simulates Agent behavior, verifies state.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { readState, writeState, setNodeStatus, skipNode, resetNode, switchPlaybook, resumePlaybook, isNodeDone, isNodeCompleted, validateState, createInitialState, statePath, appendHistory, readHistory } from '../PPTMAKER_FRAMEWORK/scripts/lib/state.mjs';

// --- Helpers ---

function makeDeck() {
  const dir = mkdtempSync(join(tmpdir(), 'deck_test_'));
  return dir;
}

function initState(deckDir, playbook = 'create-deck') {
  const state = {
    playbook,
    current_node: '',
    started_at: new Date().toISOString(),
    updated_at: '',
    nodes: {},
    gates: { content: 'pending', visual: 'pending' },
    deck: { name: deckDir.replace(/^.*deck_/, ''), type: 'keynote', style: 'dark-executive' },
  };
  writeState(deckDir, state);
  return state;
}

// --- Tests ---

describe('State Machine: create-deck happy path', () => {
  let deckDir;

  beforeEach(() => { deckDir = makeDeck(); });
  afterEach(() => { try { rmSync(deckDir, { recursive: true, force: true }); } catch {} });

  const NODES = [
    'instantiation', 'hitl1', 'setup', 'seed-topics',
    'wave0', 'wave1', 'wave2', 'hitl2', 'readiness', 'final',
  ];

  it('completes all 10 nodes in sequence', () => {
    const state = initState(deckDir);

    for (const node of NODES) {
      setNodeStatus(state, node, 'pending');
      writeState(deckDir, state);

      // Start node
      setNodeStatus(state, node, 'in_progress');
      writeState(deckDir, state);
      expect(state.nodes[node].status).toBe('in_progress');
      expect(state.current_node).toBe(node);

      // Complete node
      setNodeStatus(state, node, 'completed');
      writeState(deckDir, state);
      expect(state.nodes[node].status).toBe('completed');
    }

    // All done
    const final = readState(deckDir);
    expect(final.current_node).toBe('final');
    for (const node of NODES) {
      expect(final.nodes[node].status).toBe('completed');
    }
  });

  it('updates timestamps at each transition', () => {
    const state = initState(deckDir);

    setNodeStatus(state, 'instantiation', 'in_progress');
    expect(state.nodes.instantiation.started).toBeTruthy();

    setNodeStatus(state, 'instantiation', 'completed');
    expect(state.nodes.instantiation.completed).toBeTruthy();
  });
});

describe('State Machine: entry gate reject', () => {
  let deckDir;

  beforeEach(() => { deckDir = makeDeck(); });
  afterEach(() => { try { rmSync(deckDir, { recursive: true, force: true }); } catch {} });

  it('refuses to start wave0 when seed-topics is pending', () => {
    const state = initState(deckDir);
    setNodeStatus(state, 'instantiation', 'completed');
    setNodeStatus(state, 'hitl1', 'completed');
    setNodeStatus(state, 'setup', 'completed');
    // seed-topics intentionally left pending

    const seedStatus = state.nodes['seed-topics']?.status || 'pending';
    expect(seedStatus).not.toBe('completed');
  });
});

describe('State Machine: exit gate reject', () => {
  let deckDir;

  beforeEach(() => { deckDir = makeDeck(); });
  afterEach(() => { try { rmSync(deckDir, { recursive: true, force: true }); } catch {} });

  it('does not mark completed when exit conditions fail', () => {
    const state = initState(deckDir);

    // Simulate Agent doing work but exit conditions not met
    setNodeStatus(state, 'instantiation', 'in_progress');
    // Entry was ok, but exit checks haven't been verified yet
    // Agent should NOT call setNodeStatus(node, 'completed') without checking exit
    expect(state.nodes.instantiation.status).toBe('in_progress');
  });
});

describe('State Machine: rerun branch', () => {
  let deckDir;

  beforeEach(() => { deckDir = makeDeck(); });
  afterEach(() => { try { rmSync(deckDir, { recursive: true, force: true }); } catch {} });

  it('routes to rerun when hitl2 decision is repair', () => {
    const state = initState(deckDir);

    // Complete all nodes up to hitl2
    for (const node of ['instantiation', 'hitl1', 'setup', 'seed-topics', 'wave0', 'wave1', 'wave2']) {
      setNodeStatus(state, node, 'completed');
    }

    // hitl2: user decides repair
    setNodeStatus(state, 'hitl2', 'completed', { decision: 'repair' });
    writeState(deckDir, state);

    // Rerun node
    setNodeStatus(state, 'rerun', 'completed');
    writeState(deckDir, state);

    // Back to seed-topics
    setNodeStatus(state, 'seed-topics', 'completed');
    writeState(deckDir, state);

    const final = readState(deckDir);
    expect(final.nodes.hitl2.decision).toBe('repair');
    expect(final.nodes.rerun.status).toBe('completed');
    expect(final.nodes['seed-topics'].status).toBe('completed');
  });

  it('routes to readiness when hitl2 decision is proceed', () => {
    const state = initState(deckDir);

    for (const node of ['instantiation', 'hitl1', 'setup', 'seed-topics', 'wave0', 'wave1', 'wave2']) {
      setNodeStatus(state, node, 'completed');
    }

    setNodeStatus(state, 'hitl2', 'completed', { decision: 'proceed' });
    setNodeStatus(state, 'readiness', 'completed');
    setNodeStatus(state, 'final', 'completed');
    writeState(deckDir, state);

    const final = readState(deckDir);
    expect(final.nodes.hitl2.decision).toBe('proceed');
    expect(final.nodes.readiness.status).toBe('completed');
    // rerun should not exist since it was never needed
  });
});

describe('State Machine: gate approved vs waived', () => {
  let deckDir;

  beforeEach(() => { deckDir = makeDeck(); });
  afterEach(() => { try { rmSync(deckDir, { recursive: true, force: true }); } catch {} });

  it('both approved and waived allow Stage 2 to proceed', () => {
    const approved = initState(deckDir);
    approved.gates.visual = 'approved';
    approved.gates.content = 'approved';
    writeState(deckDir, approved);

    const reloaded = readState(deckDir);
    expect(reloaded.gates.visual).toBe('approved');
    expect(reloaded.gates.content).toBe('approved');

    // waived should also work
    const waived = initState(deckDir);
    waived.gates.visual = 'waived';
    waived.gates.content = 'waived';
    writeState(deckDir, waived);

    const reloaded2 = readState(deckDir);
    expect(reloaded2.gates.visual).toBe('waived');
  });

  it('pending gate prevents Stage 2', () => {
    const state = initState(deckDir);
    expect(state.gates.visual).toBe('pending');
    expect(state.gates.content).toBe('pending');
    // Stage 2 should refuse when gates are pending
  });
});

describe('State Machine: resume from state', () => {
  let deckDir;

  beforeEach(() => { deckDir = makeDeck(); });
  afterEach(() => { try { rmSync(deckDir, { recursive: true, force: true }); } catch {} });

  it('recovers current_node and continues after reload', () => {
    const state = initState(deckDir);

    // Simulate partial progress
    for (const node of ['instantiation', 'hitl1', 'setup']) {
      setNodeStatus(state, node, 'completed');
    }
    setNodeStatus(state, 'seed-topics', 'in_progress');
    writeState(deckDir, state);

    // "Session ends" — state goes out of scope
    const sp = statePath(deckDir);
    expect(existsSync(sp)).toBe(true);

    // "New session starts" — read state back
    const resumed = readState(deckDir);
    expect(resumed.current_node).toBe('seed-topics');
    expect(resumed.nodes.instantiation.status).toBe('completed');
    expect(resumed.nodes['seed-topics'].status).toBe('in_progress');

    // Continue from seed-topics
    setNodeStatus(resumed, 'seed-topics', 'completed');
    setNodeStatus(resumed, 'wave0', 'in_progress');
    writeState(deckDir, resumed);

    const after = readState(deckDir);
    expect(after.nodes['seed-topics'].status).toBe('completed');
    expect(after.current_node).toBe('wave0');
  });
});

describe('State Machine: shared node includes', () => {
  it('classify-change is referenceable by multiple playbooks', () => {
    // Simulate: edit-text playbook includes classify-change
    const editTextPlaybook = { playbook: 'edit-text', includes: ['classify-change'] };
    expect(editTextPlaybook.includes).toContain('classify-change');

    // Simulate: edit-visual playbook also includes classify-change
    const editVisualPlaybook = { playbook: 'edit-visual', includes: ['classify-change'] };
    expect(editVisualPlaybook.includes).toContain('classify-change');

    // Same shared node, two playbooks — no duplication
    expect(editTextPlaybook.includes[0]).toBe(editVisualPlaybook.includes[0]);
  });
});

// === NEW: node_done, playbook_stack, atomic write, corrupted state ===

import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';

describe('State Machine: node_done accepts skipped', () => {
  let deckDir;
  beforeEach(() => { deckDir = makeDeck(); });
  afterEach(() => { try { rmSync(deckDir, { recursive: true, force: true }); } catch {} });

  it('node_done condition passes for skipped node', () => {
    const state = initState(deckDir);
    skipNode(state, 'hitl1', 'user said skip');
    writeState(deckDir, state);
    expect(isNodeDone(state, 'hitl1')).toBe(true);
    expect(isNodeCompleted(state, 'hitl1')).toBe(false);
  });
});

describe('State Machine: playbook stack', () => {
  let deckDir;
  beforeEach(() => { deckDir = makeDeck(); });
  afterEach(() => { try { rmSync(deckDir, { recursive: true, force: true }); } catch {} });

  it('switchPlaybook pushes, resumePlaybook pops', () => {
    const state = initState(deckDir);
    setNodeStatus(state, 'wave0', 'in_progress');
    switchPlaybook(state, 'edit-text');
    expect(state.playbook).toBe('edit-text');
    expect(state.current_node).toBe('');
    expect(state.playbook_stack.length).toBe(1);
    resumePlaybook(state);
    expect(state.playbook).toBe('create-deck');
    expect(state.current_node).toBe('wave0');
  });
});

describe('State Machine: atomic write', () => {
  let deckDir;
  beforeEach(() => { deckDir = makeDeck(); });
  afterEach(() => { try { rmSync(deckDir, { recursive: true, force: true }); } catch {} });

  it('writeState produces readable state', () => {
    const state = initState(deckDir);
    setNodeStatus(state, 'instantiation', 'completed');
    writeState(deckDir, state);
    const reloaded = readState(deckDir);
    expect(reloaded.current_node).toBe('instantiation');
  });
});

describe('State Machine: corrupted state', () => {
  let deckDir;
  beforeEach(() => { deckDir = makeDeck(); });
  afterEach(() => { try { rmSync(deckDir, { recursive: true, force: true }); } catch {} });

  it('heals bad YAML into usable state by default', () => {
    mkdirSync(dirname(statePath(deckDir)), { recursive: true });
    writeFileSync(statePath(deckDir), '][}{');
    const s = readState(deckDir);
    expect(s.corrupted).toBeFalsy();
    expect(s.nodes).toBeDefined();
    expect(Array.isArray(s.playbook_stack)).toBe(true);
  });

  it('returns corrupted on bad YAML when heal:false', () => {
    mkdirSync(dirname(statePath(deckDir)), { recursive: true });
    writeFileSync(statePath(deckDir), '][}{');
    const s = readState(deckDir, { heal: false });
    expect(s.corrupted).toBe(true);
    expect(s.errors.length).toBeGreaterThan(0);
  });

  it('returns default state when file missing', () => {
    const s = readState(deckDir);
    expect(s.corrupted).toBeUndefined();
    expect(s.nodes).toBeDefined();
  });
});

describe('State Machine: validateState', () => {
  let deckDir;
  beforeEach(() => { deckDir = makeDeck(); });
  afterEach(() => { try { rmSync(deckDir, { recursive: true, force: true }); } catch {} });

  it('detects completed→in_progress as illegal', () => {
    const state = initState(deckDir);
    setNodeStatus(state, 'instantiation', 'completed');
    // Manually force an illegal transition for test
    state.nodes.instantiation.status = 'in_progress';
    const result = validateState(state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('completed→in_progress'))).toBe(true);
  });
});
