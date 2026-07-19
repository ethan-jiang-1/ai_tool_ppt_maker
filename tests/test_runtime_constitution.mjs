import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { EXECUTABLE_INVENTORY } from '../PPTMAKER_FRAMEWORK/scripts/lib/cli_error.mjs';

const SCRIPTS = 'PPTMAKER_FRAMEWORK/scripts';

function walkFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkFiles(p, acc);
    else acc.push(p);
  }
  return acc;
}

describe('runtime constitution — Node only', () => {
  it('scripts/ contains no .py or .sh executable assets', () => {
    const files = walkFiles(SCRIPTS);
    const banned = files.filter((f) => /\.(py|sh)$/i.test(f));
    expect(banned, `banned non-JS assets:\n${banned.join('\n')}`).toEqual([]);
  });

  it('required in-framework Stage 2 modules exist', () => {
    for (const f of [
      'stage2_generate_images.mjs',
      'make_contact_sheet.mjs',
      'image_api_client.mjs',
      'generate_style_master.mjs',
    ]) {
      expect(existsSync(join(SCRIPTS, f)), `missing ${f}`).toBe(true);
    }
  });

  it('the explicit executable inventory matches direct-entry modules and excludes libraries', () => {
    const direct = readdirSync(SCRIPTS)
      .filter((name) => name.endsWith('.mjs'))
      .filter((name) => {
        const src = readFileSync(join(SCRIPTS, name), 'utf8');
        return /process\.argv\[1\]/.test(src) && /\bmain\b|_main/.test(src);
      })
      .filter((name) => !['image_api_client.mjs', 'visual_config.mjs'].includes(name))
      .sort();
    expect([...EXECUTABLE_INVENTORY].sort()).toEqual(direct);
    expect(readFileSync(join(SCRIPTS, 'image_api_client.mjs'), 'utf8')).not.toMatch(/^#!/);
  });

  it('pipeline/orchestrator code does not discover external skills', () => {
    const files = [
      'unified_pipeline.mjs',
      'ppt_flow.mjs',
      'generate_style_master.mjs',
      'env-check.mjs',
    ].map((f) => join(SCRIPTS, f));
    for (const f of files) {
      const src = readFileSync(f, 'utf-8');
      expect(src.includes('findSkillScript'), `${f} still has findSkillScript`).toBe(false);
      expect(src.includes('image2-ppt'), `${f} still references image2-ppt skill`).toBe(false);
      expect(src.includes('image2-imagegen'), `${f} still references image2-imagegen`).toBe(false);
      expect(src.includes('.claude/skills'), `${f} still searches .claude/skills`).toBe(false);
    }
  });

  it('CONSTITUTION + AGENT_CONTRACT + config.yaml encode Node-only runtime', () => {
    const constitution = readFileSync('PPTMAKER_FRAMEWORK/charter/CONSTITUTION.md', 'utf-8');
    expect(constitution).toMatch(/运行时宪法/);
    expect(constitution).toMatch(/唯一允许的可执行代码形态：Node\.js ESM/);
    expect(constitution).toMatch(/外部 agent skill/);
    expect(constitution).toMatch(/MD↔JS 互补健壮性/);
    expect(constitution).toMatch(/`yaml`/);

    const contract = readFileSync('PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md', 'utf-8');
    expect(contract).toMatch(/运行时只有 Node/);
    expect(contract).toMatch(/stage2_generate_images\.mjs/);
    expect(contract).toMatch(/先 heal/);
    expect(contract).not.toMatch(/image2-ppt\/scripts\/generate_full_page_images\.py/);

    const cfg = readFileSync('openspec/config.yaml', 'utf-8');
    expect(cfg).toMatch(/运行时铁律/);
    expect(cfg).toMatch(/绝对禁止/);
    expect(cfg).toMatch(/stage2_generate_images\.mjs/);
    expect(cfg).toMatch(/yaml/);
  });

  it('env-check reports in-framework stage2_generator as ok', () => {
    let out = '';
    try {
      out = execSync('node PPTMAKER_FRAMEWORK/scripts/env-check.mjs --json --image2', {
        encoding: 'utf-8',
        timeout: 15000,
      });
    } catch (e) {
      // Missing API key etc. still yields JSON on stdout with non-zero exit.
      out = e.stdout || '';
    }
    const data = JSON.parse(out);
    const stage2 = data.checks.find((c) => c.check === 'stage2_generator');
    expect(stage2).toBeDefined();
    expect(stage2.status).toBe('ok');
    expect(stage2.detail).toMatch(/in-framework/);
  }, 20_000);

  it('unified_pipeline exports stage2 and no longer exports findSkillScript', async () => {
    const mod = await import('../PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs');
    expect(typeof mod.stage2).toBe('function');
    expect(mod.findSkillScript).toBeUndefined();
    expect(mod.findStage2Script).toBeUndefined();
  });
});
