import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import {
  BASE_CHECK_NAMES,
  COMMON_CHECK_NAMES,
  IMAGE2_CHECK_NAMES,
  LIVE_CHECK_NAMES,
} from '../../ppt_maker_harness/scripts/00-setup/internal/env_check.mjs';

const BOOTSTRAP = readFileSync('ppt_maker_harness/BOOTSTRAP.md', 'utf8');
const NODE_GUIDE = readFileSync('ppt_maker_harness/workflow/00-setup/02-nodejs-environment.md', 'utf8');
const IMAGE_GUIDE = readFileSync('ppt_maker_harness/workflow/00-setup/03-runtime-and-tools.md', 'utf8');
const PROBE_PLAYBOOK = readFileSync('ppt_maker_harness/playbook/probe-image-channels.md', 'utf8');
const ZERO_READY = readFileSync('ppt_maker_harness/workflow/00-setup/00-zero-to-ready.md', 'utf8');
const QUICK_START = readFileSync('ppt_maker_harness/reference/quick-start.md', 'utf8');

function runDoctorJson(args = []) {
  try {
    return JSON.parse(execFileSync('node', [
      'ppt_maker_harness/scripts/00-setup/env-check.mjs',
      '--json',
      ...args,
    ], {
      encoding: 'utf8',
      timeout: 30_000,
      env: {
        ...process.env,
        IMAGE2_API_KEY: 'guidance-test-key',
        IMAGE2_BASE_URL: 'https://guidance.invalid/v1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    }));
  } catch (error) {
    return JSON.parse(error.stdout);
  }
}

describe('runtime and diagnostic guidance coherence', () => {
  it('maps every emitted base and Image2 presence check to a BOOTSTRAP heading', () => {
    const base = runDoctorJson();
    const image2 = runDoctorJson([
      '--operation', 'raw-generation',
    ]);
    expect(base.checks.map(({ check }) => check)).toEqual(BASE_CHECK_NAMES);
    expect(image2.checks.map(({ check }) => check)).toEqual([
      ...COMMON_CHECK_NAMES,
      ...IMAGE2_CHECK_NAMES,
    ]);
    expect(image2).toMatchObject({
      operation: 'raw-generation',
    });
    for (const name of [...BASE_CHECK_NAMES, ...IMAGE2_CHECK_NAMES, ...LIVE_CHECK_NAMES]) {
      expect(BOOTSTRAP).toContain(`### ${name}`);
    }
  }, 60_000);

  it('keeps browser setup explicit and fonts inside the local Harness package', () => {
    const combined = `${BOOTSTRAP}\n${NODE_GUIDE}`;
    expect(combined).toContain('npm run setup:chromium');
    expect(combined).toContain('PLAYWRIGHT_BROWSERS_PATH');
    expect(combined).toMatch(/doctor[^\n]*(?:绝不|never)[^\n]*(?:安装|install)/i);
    expect(combined).toMatch(/用户不(?:安装系统字体|需要把字体安装到操作系统)/);
    expect(combined).toContain('ppt_maker_harness/scripts/fonts/');
    expect(combined).toMatch(/(?:不|绝不)[^\n]*(?:下载字体|联网下载)/i);
    expect(combined).toMatch(/(?:不|绝不)回退到系统 Chrome/i);
  });

  it('requires submit disclosure and confirmation before every documented live probe', () => {
    expect(BOOTSTRAP).toMatch(/doctor --smoke[^\n]*提交 1 次/);
    expect(BOOTSTRAP).toMatch(/doctor --probe-vendors[^\n]*恰好提交 1 次/);
    expect(IMAGE_GUIDE).toMatch(/doctor --smoke[^\n]*提交 \*\*1 次\*\*/);
    expect(IMAGE_GUIDE).toMatch(/doctor --probe-vendors[^\n]*每家 \*\*1 次\*\*/);
    const disclosure = PROBE_PLAYBOOK.indexOf('明确说出总 submit 数');
    const confirmation = PROBE_PLAYBOOK.indexOf('是否同意这次 live probe');
    const runProbe = PROBE_PLAYBOOK.indexOf('### run-probe');
    const invocation = PROBE_PLAYBOOK.indexOf('doctor --probe-vendors', runProbe);
    expect(disclosure).toBeGreaterThan(-1);
    expect(confirmation).toBeGreaterThan(disclosure);
    expect(invocation).toBeGreaterThan(confirmation);
    expect(PROBE_PLAYBOOK).toContain('不自动运行 `doctor --smoke`');
    expect(PROBE_PLAYBOOK).not.toMatch(/^---$/m);
    expect(PROBE_PLAYBOOK).not.toContain('node:');
  });

  it('rejects stale universal Image2, Node-18, style-master diagnostic, and premature HTML product claims', () => {
    const activeSetup = [BOOTSTRAP, NODE_GUIDE, IMAGE_GUIDE, PROBE_PLAYBOOK, ZERO_READY, QUICK_START].join('\n');
    expect(activeSetup).not.toMatch(/Node(?:\.js)?\s*18|18\+/i);
    expect(activeSetup).not.toContain('style-master <versionDir> --force --resolution 1k');
    expect(activeSetup).not.toMatch(/没有 key[^\n]*(?:PPT 就做不出来|doctor[^\n]*NOT READY)/i);
    expect(activeSetup).not.toMatch(/(?:structured HTML deck|HTML deck renderer|HTML-first default|默认 HTML 渲染)/i);
    expect(activeSetup).toMatch(/probe success[^\n]*不(?:等于|批准)|成功[^\n]*不产生生产授权/i);
  });
});
