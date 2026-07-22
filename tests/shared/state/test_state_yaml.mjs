import { describe, it, expect } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
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
  projectImage2RefinementState,
  readImage2RefinementState,
  writeImage2RefinementState,
  IMAGE2_REFINEMENT_STATE_SCHEMA_V1,
  IMAGE2_REFINEMENT_STATE_SCHEMA_V2,
} from '../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs';
import { createHtmlFirstRun } from '../../helpers/html_first_fixture.mjs';

function tmpDeck(tag) {
  const deck = join(tmpdir(), `deck_state_${tag}_${Date.now()}_${Math.random().toString(16).slice(2)}`);
  mkdirSync(join(deck, STATE_DIR), { recursive: true });
  return deck;
}

describe('state.yaml yaml library + heal', () => {
  it('stores refinement evidence only as a version-scoped reserved record', () => {
    const fixture = createHtmlFirstRun('image2-refinement-state-');
    try {
      const before = readFileSync(join(fixture.deck, STATE_DIR, STATE_FILE));
      const record = { schema: 'pptmaker-image2-refinement-state-v1', run_version: 'v1', plan: null, authorization: null, attempts: {}, reviews: {} };
      expect(writeImage2RefinementState(fixture.deck, 'v1', record, { expectedStateSha: createHash('sha256').update(before).digest('hex') })).toEqual(record);
      expect(readImage2RefinementState(readState(fixture.deck), 'v1')).toEqual(record);
      expect(() => writeImage2RefinementState(fixture.deck, 'v1', { ...record, extra: true })).toThrow(/invalid/);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });

  it('reads v1 and v2 refinement records without observation migration', () => {
    const fixture = createHtmlFirstRun('image2-refinement-v2-reader-');
    try {
      const stateFile = join(fixture.deck, STATE_DIR, STATE_FILE);
      const legacy = { schema: IMAGE2_REFINEMENT_STATE_SCHEMA_V1, run_version: 'v1', plan: null, authorization: null, attempts: {}, reviews: {} };
      writeImage2RefinementState(fixture.deck, 'v1', legacy);
      const legacyBytes = readFileSync(stateFile);
      expect(readImage2RefinementState(readState(fixture.deck, { purpose: 'observe' }), 'v1')).toEqual(legacy);
      expect(readFileSync(stateFile)).toEqual(legacyBytes);

      const current = {
        schema: IMAGE2_REFINEMENT_STATE_SCHEMA_V2,
        run_version: 'v1',
        plan: null,
        authorization: null,
        attempts: {},
        reviews: {},
        prerequisite_waiver: null,
      };
      writeImage2RefinementState(fixture.deck, 'v1', current);
      const currentBytes = readFileSync(stateFile);
      expect(readImage2RefinementState(readState(fixture.deck, { purpose: 'observe' }), 'v1')).toEqual(current);
      expect(readFileSync(stateFile)).toEqual(currentBytes);
    } finally { rmSync(fixture.root, { recursive: true, force: true }); }
  });
  it('projects every bounded refinement status and human-action boundary', () => {
    const plan = { plan_hash: 'a'.repeat(64) };
    const authorization = { authorization_id: 'auth-one', plan_hash: plan.plan_hash, used: false };
    const attempt = (state, extra = {}) => ({ attempt_id: 'attempt-one', kind: 'slot', slide_id: 'AlphaGo', state, ...extra });
    const review = (decision) => ({ slide_id: 'AlphaGo', candidate_id: 'candidate-one', decision });
    const project = ({ plan: currentPlan = plan, authorization: currentAuthorization = authorization, attempts = {}, reviews = {} } = {}) => {
      const state = createDefaultState();
      state.nodes['image2-refinement'] = { by_version: { '3_versions/v1': { schema: 'pptmaker-image2-refinement-state-v1', run_version: 'v1', plan: currentPlan, authorization: currentAuthorization, attempts, reviews } } };
      return projectImage2RefinementState(state, 'v1');
    };
    expect(project({ plan: null, authorization: null })).toMatchObject({ status: 'planned', human_action_required: true });
    expect(project({ authorization: null })).toMatchObject({ status: 'awaiting-authorization', human_action_required: true });
    expect(project({ attempts: { 'attempt-one': attempt('planned') } })).toMatchObject({ status: 'in-progress', human_action_required: false });
    expect(project({ attempts: { 'attempt-one': attempt('unknown-submit') } })).toMatchObject({ status: 'unknown-submit', human_action_required: true });
    expect(project({ attempts: { 'attempt-one': attempt('failed', { failure_code: 'provider_failure' }) } })).toMatchObject({ status: 'failed', human_action_required: true });
    expect(project({ attempts: { 'attempt-one': attempt('submitted') }, reviews: { AlphaGo: review('pending') } })).toMatchObject({ status: 'review-pending', human_action_required: true });
    expect(project({ attempts: { 'attempt-one': attempt('submitted') }, reviews: { AlphaGo: review('use-html') } })).toMatchObject({ status: 'complete', human_action_required: false });
  });
  it('preserves unusable HTML state bytes while requiring explicit replacement', () => {
    const fixture = createHtmlFirstRun('html-state-replacement-');
    try {
      const path = join(fixture.deck, STATE_DIR, STATE_FILE);
      const broken = Buffer.from('][}{\n');
      writeFileSync(path, broken);
      expect(readState(fixture.deck, { purpose: 'observe' })).toMatchObject({
        replacement_required: true,
        pipeline: 'html-first-v1',
      });
      expect(readFileSync(path)).toEqual(broken);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('preserves HTML state bytes when source and durable pipeline conflict', () => {
    const fixture = createHtmlFirstRun('html-state-pipeline-conflict-');
    try {
      const path = join(fixture.deck, STATE_DIR, STATE_FILE);
      const state = readState(fixture.deck, { heal: false });
      state.pipeline = 'legacy-image2-v1';
      writeState(fixture.deck, state);
      const conflicting = readFileSync(path);
      expect(readState(fixture.deck, { purpose: 'observe' })).toMatchObject({
        replacement_required: true,
      });
      expect(readFileSync(path)).toEqual(conflicting);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

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
      s.pipeline = 'html-first-v1';
      s.current_node = 'setup';
      switchPlaybook(s, 'iterate-style');
      writeState(deck, s);
      const loaded = readState(deck);
      expect(Array.isArray(loaded.playbook_stack)).toBe(true);
      expect(loaded.playbook_stack).toHaveLength(1);
      expect(loaded.playbook_stack[0].playbook).toBe('create-deck');
      expect(loaded.playbook_stack[0].current_node).toBe('configure-visual-system');
      expect(loaded.playbook).toBe('iterate-style');
      resumePlaybook(loaded);
      expect(loaded.playbook).toBe('create-deck');
      expect(loaded.current_node).toBe('configure-visual-system');
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
      s.pipeline = 'html-first-v1';
      s.playbook = 'iterate-style';
      s.current_node = 'review-style-system';
      s.run_version = 'v1';
      s.nodes = {
        'review-style-system': {
          status: 'in_progress',
          execution_id: s.execution_id,
          run_version: 'v1',
          waiting_for: 'user:review-style-master',
          note: 'open style master',
        },
      };
      writeState(deck, s);
      const loaded = readState(deck);
      expect(loaded.nodes['review-style-system'].waiting_for).toBe('user:review-style-master');
      expect(loaded.nodes['review-style-system'].note).toBe('open style master');
      const { state: healed, dirty } = healState(JSON.parse(JSON.stringify(loaded)));
      expect(healed.nodes['review-style-system'].waiting_for).toBe('user:review-style-master');
      expect(healed.nodes['review-style-system'].note).toBe('open style master');
      expect(dirty).toBe(false);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it('buildResumeCard: waiting_for shapes summary and suggested_next', async () => {
    const { buildResumeCard } = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs');
    const s = createDefaultState();
    s.playbook = 'iterate-style';
    s.current_node = 'review-style-system';
    s.execution_id = 'exec-card-waiting';
    s.execution_started_at = '2024-01-01T00:00:00.000Z';
    s.run_version = 'v1';
    s.nodes = {
      'review-style-system': {
        status: 'in_progress',
        execution_id: s.execution_id,
        run_version: 'v1',
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
    expect(card.current_node).toBe('review-style-system');
  });

  it('buildResumeCard: artifact heuristics when not waiting', async () => {
    const { buildResumeCard } = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs');
    const s = createDefaultState();
    s.playbook = 'create-deck';
    s.current_node = 'wave3';
    s.execution_id = 'exec-card-heuristic';
    s.execution_started_at = '2024-01-01T00:00:00.000Z';
    s.run_version = 'v1';
    s.nodes = { wave3: { status: 'in_progress', execution_id: s.execution_id, run_version: 'v1' } };
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

  it('buildResumeCard: producer HTML guidance stays ahead of optional Image2 routing', async () => {
    const { buildResumeCard } = await import('../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs');
    const s = createDefaultState();
    s.playbook = 'image2-refine';
    s.current_node = 'recommend-image2-refinement';
    s.execution_id = 'exec-card-guidance';
    s.execution_started_at = '2024-01-01T00:00:00.000Z';
    s.run_version = 'v1';
    s.nodes = { 'recommend-image2-refinement': { status: 'in_progress', execution_id: s.execution_id, run_version: 'v1' } };
    const guidance = {
      summary: 'HTML visual review needs an explicit decision',
      recommended_command: 'node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs approve "/tmp/deck/3_versions/v1" visual --plan-hash abc',
      continuation_command: 'node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs approve "/tmp/deck/3_versions/v1" visual --waive --reason "<human reason>"',
    };

    const card = buildResumeCard(s, { html_resume_guidance: guidance }, { ctx: { runVersion: 'v1' } });

    expect(card.workflow_summary).toBe(guidance.summary);
    expect(card.suggested_next).toBe(guidance.recommended_command);
    expect(card.html_resume_guidance).toBe(guidance);
  });

  it('rejects invalid node/gate enum writes without mutation', () => {
    const s = createInitialState('demo', 'keynote', 'dark');
    expect(() => setNodeStatus(s, 'authoring-slides', 'done')).toThrow(/invalid node status/);
    expect(s.nodes['authoring-slides']).toBeUndefined();
    expect(() => setGate(s, 'visual', 'done')).toThrow(/invalid gate status/);
    expect(s.gates.visual).toBe('pending');
  });

  it('cleans incompatible timestamps when a completed node restarts', () => {
    const s = createInitialState('demo', 'keynote', 'dark');
    setNodeStatus(s, 'authoring-slides', 'completed', { failed_reason: 'old' });
    expect(s.nodes['authoring-slides'].completed).toBeTruthy();
    expect(s.nodes['authoring-slides'].failed_reason).toBeUndefined();
    setNodeStatus(s, 'authoring-slides', 'in_progress');
    expect(s.nodes['authoring-slides'].completed).toBeUndefined();
    expect(s.nodes['authoring-slides'].started).toBeTruthy();
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
    expect(first.current_node).toBe('review-text-delivery');
    expect(first.nodes['verify-output']).toBeUndefined();
    expect(first.nodes['review-text-delivery'].status).toBe('in_progress');
    expect(first.nodes['review-text-delivery'].note).toContain('canonical');
    expect(first.nodes['review-text-delivery'].decision.kind).toBe('agent');
    expect(first.nodes['review-text-delivery'].evidence.old.kind).toBe('agent');
    expect(first.gates.content).toBe('pending');
    expect(first.execution_id).toBeTruthy();
    expect(first.playbook_stack[0].controller_nodes).toEqual({});
    expect(first.playbook_stack[0].diagnostic).toMatch(/legacy stack/);
    const second = healState(first).state;
    expect(second.execution_id).toBe(first.execution_id);
    expect(second.playbook_stack[0].execution_id).toBe(first.playbook_stack[0].execution_id);
    expect(second).toEqual(first);
  });

  it('migrates all five create-deck legacy node IDs to canonical names', () => {
    const legacy = {
      playbook: 'create-deck',
      current_node: 'hitl2',
      started_at: '2026-01-01T00:00:00.000Z',
      nodes: {
        hitl1: { status: 'completed' },
        hitl2: { status: 'in_progress' },
        wave0: { status: 'completed', evidence: { 'sources-collected': { met: true, kind: 'agent', at: '2026-01-01T00:00:00.000Z' } } },
        wave1: { status: 'pending' },
        wave2: { status: 'pending' },
      },
      gates: { content: 'pending', visual: 'pending' },
      deck: { name: 'x' },
    };
    const first = healState(legacy).state;
    expect(first.current_node).toBe('checkpoint-final-review');
    expect(first.nodes.hitl1).toBeUndefined();
    expect(first.nodes.hitl2).toBeUndefined();
    expect(first.nodes.wave0).toBeUndefined();
    expect(first.nodes.wave1).toBeUndefined();
    expect(first.nodes.wave2).toBeUndefined();
    expect(first.nodes['checkpoint-intake'].status).toBe('completed');
    expect(first.nodes['checkpoint-final-review'].status).toBe('in_progress');
    expect(first.nodes['author-structured-content'].status).toBe('completed');
    expect(first.nodes['preview-content'].status).toBe('pending');
    expect(first.nodes['produce-html-deck'].status).toBe('pending');
    const second = healState(first).state;
    expect(second).toEqual(first);
  });

  it('migrates pointer-only current_node without a node record', () => {
    const legacy = {
      playbook: 'create-deck',
      current_node: 'hitl2',
      started_at: '2026-01-01T00:00:00.000Z',
      nodes: {},
      gates: { content: 'pending', visual: 'pending' },
      deck: { name: 'x' },
    };
    const healed = healState(legacy).state;
    expect(healed.current_node).toBe('checkpoint-final-review');
    // current_node should survive restrictActiveWorkingSet because it's a valid canonical ID
    expect(healed.current_node).not.toBe('');
    const second = healState(healed).state;
    expect(second.current_node).toBe('checkpoint-final-review');
  });

  it('handles collision where legacy and canonical keys coexist with canonical priority', () => {
    const legacy = {
      playbook: 'create-deck',
      current_node: 'author-structured-content',
      started_at: '2026-01-01T00:00:00.000Z',
      nodes: {
        wave0: { status: 'completed', extra_field: 'old-value', evidence: { old: { met: true, kind: 'agent', at: '2026-01-01T00:00:00.000Z' } } },
        'author-structured-content': { status: 'in_progress' },
      },
      gates: { content: 'pending', visual: 'pending' },
      deck: { name: 'x' },
    };
    const healed = healState(legacy).state;
    // canonical status wins
    expect(healed.nodes['author-structured-content'].status).toBe('in_progress');
    // legacy-only field is preserved
    expect(healed.nodes['author-structured-content'].extra_field).toBe('old-value');
    // legacy key is removed
    expect(healed.nodes.wave0).toBeUndefined();
    // idempotent
    const second = healState(healed).state;
    expect(second).toEqual(healed);
  });

  it('migrates playbook_stack entry legacy node IDs', () => {
    const legacy = {
      playbook: 'edit-text',
      current_node: 'classify-change',
      started_at: '2026-01-01T00:00:00.000Z',
      nodes: {
        'classify-change': { status: 'in_progress' },
      },
      gates: { content: 'pending', visual: 'pending' },
      deck: { name: 'x' },
      playbook_stack: [
        {
          playbook: 'create-deck',
          current_node: 'hitl2',
          execution_id: 'exec-parent',
          execution_started_at: '2026-01-01T00:00:00.000Z',
          controller_nodes: {
            hitl1: { status: 'completed' },
            wave0: { status: 'completed' },
            wave2: { status: 'pending' },
          },
        },
      ],
    };
    const healed = healState(legacy).state;
    const entry = healed.playbook_stack[0];
    expect(entry.current_node).toBe('checkpoint-final-review');
    expect(entry.controller_nodes['checkpoint-intake']).toBeDefined();
    expect(entry.controller_nodes['checkpoint-intake'].status).toBe('completed');
    expect(entry.controller_nodes['author-structured-content']).toBeDefined();
    expect(entry.controller_nodes['author-structured-content'].status).toBe('completed');
    expect(entry.controller_nodes['produce-html-deck']).toBeDefined();
    expect(entry.controller_nodes['produce-html-deck'].status).toBe('pending');
    expect(entry.controller_nodes.hitl1).toBeUndefined();
    expect(entry.controller_nodes.wave0).toBeUndefined();
    expect(entry.controller_nodes.wave2).toBeUndefined();
    // top-level nodes unaffected (different playbook)
    expect(healed.nodes['classify-change']).toBeDefined();
  });

  it('handles stack collision with canonical priority for controller_nodes', () => {
    const legacy = {
      playbook: 'edit-text',
      current_node: 'classify-change',
      started_at: '2026-01-01T00:00:00.000Z',
      nodes: {
        'classify-change': { status: 'in_progress' },
      },
      gates: { content: 'pending', visual: 'pending' },
      deck: { name: 'x' },
      playbook_stack: [
        {
          playbook: 'create-deck',
          current_node: 'wave0',
          execution_id: 'exec-parent',
          execution_started_at: '2026-01-01T00:00:00.000Z',
          controller_nodes: {
            wave0: { status: 'completed', legacy_field: 'from-legacy' },
            'author-structured-content': { status: 'in_progress' },
          },
        },
      ],
    };
    const healed = healState(legacy).state;
    const entry = healed.playbook_stack[0];
    expect(entry.current_node).toBe('author-structured-content');
    // canonical status wins
    expect(entry.controller_nodes['author-structured-content'].status).toBe('in_progress');
    // legacy-only field preserved
    expect(entry.controller_nodes['author-structured-content'].legacy_field).toBe('from-legacy');
    // legacy key removed
    expect(entry.controller_nodes.wave0).toBeUndefined();
    // idempotent
    const second = healState(healed).state;
    expect(second).toEqual(healed);
  });

  it('records create-deck rename migration messages in diagnostics', () => {
    const legacy = {
      playbook: 'create-deck',
      current_node: 'hitl2',
      started_at: '2026-01-01T00:00:00.000Z',
      nodes: {
        hitl1: { status: 'completed' },
        wave0: { status: 'completed' },
      },
      gates: { content: 'pending', visual: 'pending' },
      deck: { name: 'x' },
    };
    const healed = healState(legacy).state;
    expect(Array.isArray(healed.diagnostics)).toBe(true);
    const diags = healed.diagnostics.join('\n');
    expect(diags).toMatch(/create-deck/);
    expect(diags).toMatch(/migrated/);
    // pointer migration message
    expect(diags).toMatch(/hitl2.*current_node.*checkpoint-final-review/);
  });

  it('heal removes controller records outside the active playbook working set', () => {
    const healed = healState({
      playbook: 'iterate-style',
      current_node: 'review-style-system',
      started_at: '2026-07-12T00:00:00.000Z',
      nodes: {
        'review-style-system': { status: 'in_progress' },
        'intake-source': { status: 'completed' },
        'header-review': { by_version: { '3_versions/v1': { status: 'completed' } } },
      },
      gates: { content: 'pending', visual: 'pending' },
      deck: {},
      playbook_stack: [],
    }).state;
    expect(healed.nodes['review-style-system']).toBeDefined();
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
    const ids = ['instantiation', 'checkpoint-intake', 'setup'];
    expect(getPendingNodes(s, ids)).toEqual(['checkpoint-intake', 'setup']);
    expect(isPlaybookComplete(s, ids)).toBe(false);
    setNodeStatus(s, 'checkpoint-intake', 'skipped');
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
