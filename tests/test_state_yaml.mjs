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
});
