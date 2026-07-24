import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import {
  HISTORY_FILE,
  STATE_DIR,
  STATE_FILE,
  STATE_SCHEMA_VERSION,
  healState,
  parseStateYaml,
  readState,
  statePath,
  validateStateReadOnly,
  writeImage2RefinementState,
} from '../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs';
import { createHtmlFirstRun } from '../../helpers/html_first_fixture.mjs';

const FLOW = 'PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs';

function runFlow(args) {
  return spawnSync('node', [FLOW, ...args], { cwd: process.cwd(), encoding: 'utf8', timeout: 30_000 });
}

function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function parsedState(path) {
  const parsed = parseStateYaml(readFileSync(path, 'utf8'));
  if (!parsed.ok) throw new Error('fixture state must parse');
  return parsed.value;
}

function stateAndHistory(fixture) {
  const state = statePath(fixture.deck);
  const history = join(fixture.deck, STATE_DIR, HISTORY_FILE);
  mkdirSync(join(fixture.deck, STATE_DIR), { recursive: true });
  writeFileSync(history, '{"type":"preserved-test"}\n');
  return { state, history, stateBytes: readFileSync(state), historyBytes: readFileSync(history) };
}

function lastCliEnvelope(result) {
  return JSON.parse(result.stderr.trim().split(/\r?\n/).filter(Boolean).at(-1));
}

function assertHistoricalCliHardStop(result) {
  expect(result.status).toBeGreaterThan(0);
  const envelope = lastCliEnvelope(result);
  expect(envelope.diagnostic).toMatchObject({
    version: 1,
    next: { action: 'repair_prerequisite' },
  });
  expect(envelope.diagnostic.next.action).not.toBe('report_internal');
  expect(envelope.diagnostic).not.toHaveProperty('actions');
  return envelope;
}

function assertNoHistoricalExecutionWrites(fixture, before) {
  expect(digest(readFileSync(before.state))).toBe(digest(before.stateBytes));
  expect(digest(readFileSync(before.history))).toBe(digest(before.historyBytes));
  expect(existsSync(join(fixture.runDir, '_scratch', 'production-mode-transition', 'apply-journal.json'))).toBe(false);
  expect(existsSync(join(fixture.deck, '3_versions', 'v2'))).toBe(false);
  expect(existsSync(join(fixture.deck, '3_versions', '.v2.production-mode-transition-reservation-' + 'a'.repeat(64)))).toBe(false);
  expect(existsSync(join(fixture.deck, '3_versions', '.v2.production-mode-transition-staging-' + 'a'.repeat(64)))).toBe(false);
}

function expectHistoricalHardStop(fixture, mutate) {
  const before = stateAndHistory(fixture);
  mutate(before.state);
  const corruptedStateBytes = readFileSync(before.state);
  const corruptedHistoryBytes = readFileSync(before.history);

  const observed = readState(fixture.deck, { purpose: 'observe', runVersion: 'v1' });
  expect(observed).toMatchObject({ replacement_required: true, code: 'replacement_required' });
  expect(observed.durable_state_present).toBe(false);
  expect(readFileSync(before.state)).toEqual(corruptedStateBytes);
  expect(readFileSync(before.history)).toEqual(corruptedHistoryBytes);

  expect(() => writeImage2RefinementState(fixture.deck, 'v1', {
    schema: 'pptmaker-image2-refinement-state-v2',
    run_version: 'v1',
    plan: null,
    authorization: null,
    attempts: {},
    reviews: {},
    prerequisite_waiver: null,
  })).toThrow(/replacement_required/);
  expect(readFileSync(before.state)).toEqual(corruptedStateBytes);
  expect(readFileSync(before.history)).toEqual(corruptedHistoryBytes);
  return { before, observed };
}

describe('state.yaml current-schema read boundary', () => {
  it('reads current v5 state without observation mutation', () => {
    const fixture = createHtmlFirstRun('current-state-read-');
    try {
      const { state, history, stateBytes, historyBytes } = stateAndHistory(fixture);
      const observed = readState(fixture.deck, { purpose: 'observe', runVersion: 'v1' });
      expect(observed.schema_version).toBe(STATE_SCHEMA_VERSION);
      expect(observed.durable_state_present).toBe(true);
      expect(readFileSync(state)).toEqual(stateBytes);
      expect(readFileSync(history)).toEqual(historyBytes);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('rejects malformed state bytes without inventing a pipeline or replacement state', () => {
    const fixture = createHtmlFirstRun('malformed-state-');
    try {
      const { observed } = expectHistoricalHardStop(fixture, (state) => writeFileSync(state, '][}{\n'));
      expect(observed.pipeline).toBeNull();
      expect(observed.reason).toMatch(/not safely parseable/);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('rejects pre-current schema bytes instead of migrating controller or mode identity', () => {
    const fixture = createHtmlFirstRun('precurrent-state-');
    try {
      const { observed } = expectHistoricalHardStop(fixture, (state) => {
        const current = parsedState(state);
        current.schema_version = STATE_SCHEMA_VERSION - 1;
        current.current_node = 'hitl2';
        writeFileSync(state, `${JSON.stringify(current, null, 2)}\n`);
      });
      expect(observed.reason).toMatch(/unsupported state schema_version/);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('rejects topology-only active version identity without selecting a visible version', () => {
    const fixture = createHtmlFirstRun('topology-only-state-');
    try {
      const { observed } = expectHistoricalHardStop(fixture, (state) => {
        const current = parsedState(state);
        delete current.run_version;
        writeFileSync(state, `${JSON.stringify(current, null, 2)}\n`);
      });
      expect(observed.reason).toMatch(/active execution missing canonical run_version/);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('rejects missing source markers without using controller or filesystem topology as fallback', () => {
    const fixture = createHtmlFirstRun('markerless-state-');
    try {
      const { observed } = expectHistoricalHardStop(fixture, () => {
        writeFileSync(join(fixture.runDir, 'slide-specifications.md'), '# Slides\n');
      });
      expect(observed.reason).toMatch(/source\/state identity is unsupported/);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('keeps historical marker, schema, topology, and retired Controller inputs byte-preserving across CLI observation and execution', () => {
    const cases = [
      {
        name: 'missing marker',
        mutate: (fixture) => writeFileSync(join(fixture.runDir, 'slide-specifications.md'), '# Slides\n'),
      },
      {
        name: 'retired marker',
        mutate: (fixture) => writeFileSync(join(fixture.runDir, 'slide-specifications.md'), '---\nproduction:\n  pipeline: legacy-image2-first\n---\n\n# Slides\n'),
      },
      {
        name: 'pre-current schema',
        mutate: (_fixture, state) => { state.schema_version = STATE_SCHEMA_VERSION - 1; },
      },
      {
        name: 'topology-only version',
        mutate: (_fixture, state) => { delete state.run_version; },
      },
      {
        name: 'retired Controller',
        mutate: (_fixture, state) => {
          state.playbook = 'migrate-import';
          state.current_node = 'apply-migrate-import';
          state.nodes = {
            'apply-migrate-import': {
              status: 'in_progress',
              execution_id: state.execution_id,
              run_version: 'v1',
            },
          };
        },
      },
      {
        name: 'retired node identity',
        mutate: (_fixture, state) => {
          state.current_node = 'migrate-html-receipt';
          state.nodes = {
            'migrate-html-receipt': {
              status: 'in_progress',
              execution_id: state.execution_id,
              run_version: 'v1',
            },
          };
        },
      },
    ];

    for (const entry of cases) {
      const fixture = createHtmlFirstRun(`historical-${entry.name.replaceAll(' ', '-')}-`);
      try {
        const before = stateAndHistory(fixture);
        const state = parsedState(before.state);
        entry.mutate(fixture, state);
        if (entry.name !== 'missing marker' && entry.name !== 'retired marker') {
          writeFileSync(before.state, `${JSON.stringify(state, null, 2)}\n`);
        }
        before.stateBytes = readFileSync(before.state);
        before.historyBytes = readFileSync(before.history);

        const observed = runFlow(['state', fixture.runDir, '--json']);
        const observationEnvelope = assertHistoricalCliHardStop(observed);
        expect(observationEnvelope.diagnostic.next.default).toContain('fresh current run');
        assertNoHistoricalExecutionWrites(fixture, before);

        const execution = runFlow(['state', fixture.runDir, '--set-production-mode', 'html-then-image2']);
        const executionEnvelope = assertHistoricalCliHardStop(execution);
        expect(executionEnvelope.diagnostic.next.default).toContain('fresh explicit ppt_flow init');
        expect(executionEnvelope.diagnostic.next.default).not.toMatch(/edit.*yaml/i);
        assertNoHistoricalExecutionWrites(fixture, before);
      } finally {
        rmSync(fixture.root, { recursive: true, force: true });
      }
    }
  });

  it('keeps the direct helper non-promoting for compatibility consumers', () => {
    const raw = { schema_version: 4, current_node: 'hitl2' };
    const result = healState(raw);
    expect(result).toEqual({ state: raw, dirty: false });
    expect(result.state).not.toBe(raw);
  });

  it('reports current malformed records read-only without changing their bytes', () => {
    const fixture = createHtmlFirstRun('current-invalid-readonly-');
    try {
      const { state, history } = stateAndHistory(fixture);
      const current = parsedState(state);
      current.production_mode.by_version['3_versions/v1'] = { mode: 'not-a-mode' };
      writeFileSync(state, `${JSON.stringify(current, null, 2)}\n`);
      const stateBefore = readFileSync(state);
      const historyBefore = readFileSync(history);
      const report = validateStateReadOnly(fixture.deck, { runDir: fixture.runDir });
      expect(report.valid).toBe(false);
      expect(report.issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ next_action: 'repair_state' }),
      ]));
      expect(digest(readFileSync(state))).toBe(digest(stateBefore));
      expect(digest(readFileSync(history))).toBe(digest(historyBefore));
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('repairs one current v5 gate scalar only through an execution read', () => {
    const fixture = createHtmlFirstRun('current-v5-owner-repair-');
    try {
      const { state, history } = stateAndHistory(fixture);
      const current = parsedState(state);
      current.gates.content = 'legacy-pending';
      writeFileSync(state, `${JSON.stringify(current, null, 2)}\n`);
      const stateBefore = readFileSync(state);
      const historyBefore = readFileSync(history);

      const observed = readState(fixture.deck, { purpose: 'observe', runVersion: 'v1' });
      expect(observed).toMatchObject({ replacement_required: true, current_repair_required: true });
      expect(readFileSync(state)).toEqual(stateBefore);
      expect(readFileSync(history)).toEqual(historyBefore);

      const repaired = readState(fixture.deck, { purpose: 'execute', runVersion: 'v1' });
      expect(repaired.state_repaired).toEqual({ field: 'gates.content', from: 'legacy-pending', to: 'pending' });
      expect(repaired.gates.content).toBe('pending');
      expect(readFileSync(state)).not.toEqual(stateBefore);
      expect(readFileSync(history)).toEqual(historyBefore);
      expect(parsedState(state).gates.content).toBe('pending');
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('hard-stops an unrecoverable current v5 record without raw-YAML guidance', () => {
    const fixture = createHtmlFirstRun('current-v5-unrecoverable-');
    try {
      const { state, history } = stateAndHistory(fixture);
      const current = parsedState(state);
      current.production_mode.by_version['3_versions/v1'] = { mode: 'not-a-mode' };
      writeFileSync(state, `${JSON.stringify(current, null, 2)}\n`);
      const stateBefore = readFileSync(state);
      const historyBefore = readFileSync(history);

      const observed = readState(fixture.deck, { purpose: 'observe', runVersion: 'v1' });
      expect(observed).toMatchObject({ replacement_required: true });
      expect(observed.current_repair_required).not.toBe(true);
      expect(readFileSync(state)).toEqual(stateBefore);
      expect(readFileSync(history)).toEqual(historyBefore);

      const execution = runFlow(['state', fixture.runDir, '--set-production-mode', 'html-then-image2']);
      const envelope = assertHistoricalCliHardStop(execution);
      expect(envelope.diagnostic.next.default).not.toMatch(/edit.*yaml/i);
      expect(readFileSync(state)).toEqual(stateBefore);
      expect(readFileSync(history)).toEqual(historyBefore);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
