import { describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { htmlFirstSlide, htmlFirstSource } from '../tests/helpers/html_first_fixture.mjs';
import { inspectHtmlReviewReadiness } from '../PPTMAKER_FRAMEWORK/scripts/lib/html_review_evidence.mjs';
import { readState, writeState } from '../PPTMAKER_FRAMEWORK/scripts/lib/state.mjs';

const FLOW = 'PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs';

function flow(args, timeout = 120_000) {
  return spawnSync('node', [FLOW, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout,
    env: {
      ...process.env,
      IMAGE2_API_KEY: '',
      IMAGE2_BASE_URL: '',
      OPENAI_API_KEY: '',
      GEMINI_API_KEY: '',
    },
  });
}

describe('fresh HTML-first delivery E2E', () => {
  it('initializes, reviews, builds, records delivery, and finishes without Image2 state', () => {
    const root = mkdtempSync(join(tmpdir(), 'html-first-e2e-'));
    const deck = join(root, 'deck_html_e2e');
    const runDir = join(deck, '3_versions', 'v1');
    try {
      const init = flow(['init', deck, '--deck-type', 'keynote', '--style', 'dark-executive'], 30_000);
      expect(init.status, init.stderr || init.stdout).toBe(0);
      expect(readFileSync(join(runDir, 'slide-specifications.md'), 'utf8')).toContain('pipeline: html-first-v1');
      writeFileSync(join(runDir, 'slide-specifications.md'), htmlFirstSource([
        htmlFirstSlide({ id: 'StartGo', title: 'A complete local deck', note: 'Stable presenter note.' }),
      ]), 'utf8');

      const validate = flow(['validate', runDir]);
      expect(validate.status, validate.stderr || validate.stdout).toBe(0);
      const pilot = flow(['pilot', runDir]);
      expect(pilot.status, pilot.stderr || pilot.stdout).toBe(0);
      const pending = inspectHtmlReviewReadiness(runDir);
      for (const gate of ['content', 'visual']) {
        const approved = flow(['approve', runDir, gate, '--plan-hash', pending.gates[gate].plan.plan_hash]);
        expect(approved.status, approved.stderr || approved.stdout).toBe(0);
      }
      const build = flow(['build', runDir]);
      expect(build.status, build.stderr || build.stdout).toBe(0);

      const state = readState(deck);
      state.playbook = 'create-deck';
      state.current_node = 'checkpoint-final-review';
      state.nodes['checkpoint-final-review'] = { status: 'in_progress', execution_id: state.execution_id, evidence: {} };
      writeState(deck, state);
      const decision = flow(['state', runDir, '--record-delivery-review', 'proceed'], 30_000);
      expect(decision.status, decision.stderr || decision.stdout).toBe(0);
      const status = flow(['status', runDir, '--json'], 30_000);
      expect(status.status, status.stderr || status.stdout).toBe(0);
      expect(JSON.parse(status.stdout)).toMatchObject({
        pipeline: 'html-first-v1',
        suggested_next: 'complete:html-delivery',
        html_reviews: { delivery: { freshness: 'current', decision: 'proceed' } },
      });
      expect(readdirSync(join(runDir, '_generated', 'ppt')).some((name) => name.endsWith('.pptx'))).toBe(true);
      expect(existsSync(join(runDir, '_generated', 'qa', 'notes_injection.json'))).toBe(true);
      expect(existsSync(join(deck, '2_backbone', 'visual-style', 'style_master.jpg'))).toBe(false);
      expect(existsSync(join(runDir, '_scratch', 'image2_refinement'))).toBe(false);
      expect(existsSync(join(runDir, '_generated', 'image2_refinement'))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 180_000);
});
