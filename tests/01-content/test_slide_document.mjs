import { describe, expect, it } from 'vitest';
import {
  applySlideEdit,
  computeSlideEditPlanSha256,
  parseSlideDocument,
  planSlideEdit,
  serializeSlideDocument,
  sha256SlideSource,
  validateSlideDocument,
  verifySlideEditPlanHash,
} from '../../PPTMAKER_FRAMEWORK/scripts/01-content/internal/slide_document.mjs';

function block(number, id, title, body = '') {
  return (
    `## Slide ${String(number).padStart(2, '0')}: \`${id}\`\n\n` +
    `**TITLE**: ${title}\n` +
    `**SPEAKER NOTE**: ${body || `Note for ${id}`}\n\n`
  );
}

function source({ frontmatter = '', preamble = '# Deck\n\n', slides, epilogue = '' } = {}) {
  return frontmatter + preamble + (slides || [
    block(1, 'DeckGo', 'Opening'),
    block(2, 'UXGap', 'Problem'),
    block(3, 'AICost', 'Cost'),
  ]).join('') + epilogue;
}

describe('parseSlideDocument', () => {
  it('round-trips CRLF, frontmatter, whitespace, and UTF-8 byte ranges exactly', () => {
    const text = source({
      frontmatter: '---\nidentity:\n  scheme: mnemonic-v1\n---\n',
      preamble: '# Deck\n\nIntro with 中文.\n\n',
      epilogue: '## Change Log\n\n  Keep this spacing.  \n',
    }).replace(/\n/g, '\r\n');
    const document = parseSlideDocument(text, '3_versions/v1/slide-specifications.md');

    expect(document.frontmatter.present).toBe(true);
    expect(document.slides.map((slide) => slide.slide_id)).toEqual(['DeckGo', 'UXGap', 'AICost']);
    expect(document.epilogue.raw).toBe('## Change Log\r\n\r\n  Keep this spacing.  \r\n');
    expect(document.slides[0].range.byte_start).toBe(
      Buffer.byteLength(text.slice(0, document.slides[0].range.start), 'utf8')
    );
    expect(serializeSlideDocument(document)).toBe(text);
  });

  it('keeps a post-slide level-2 heading and body in the epilogue', () => {
    const text = source({ epilogue: '## Change Log\n\n- moved a page\n' });
    const document = parseSlideDocument(text);
    expect(document.slides.at(-1).body).not.toContain('Change Log');
    expect(document.epilogue.raw).toContain('- moved a page');
  });

  it('blocks malformed slide-like headings instead of treating them as epilogue', () => {
    const text = source({
      slides: [block(1, 'DeckGo', 'Opening')],
      epilogue: '## Slide seven UXGap\n\nBad heading\n',
    });
    expect(() => parseSlideDocument(text, 'spec.md')).toThrow(/line 8.*expected.*Slide NN/i);
  });
});

describe('validateSlideDocument', () => {
  it('requires non-empty unique IDs, unique spoken keys, and canonical continuous headings', () => {
    const text = source({
      slides: [
        block(1, 'UXGap', 'First'),
        block(3, 'UxGap', 'Second'),
        block(3, 'UXGap', 'Third'),
      ],
    });
    const issues = validateSlideDocument(parseSlideDocument(text));
    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'duplicate_slide_id',
        'duplicate_spoken_key',
        'noncanonical_heading_position',
      ])
    );
    expect(issues.find((issue) => issue.code === 'noncanonical_heading_position')?.repair_hint).toMatch(
      /slides normalize/
    );
  });

  it('enforces strict syntax only when mnemonic-v1 is asserted', () => {
    const legacy = parseSlideDocument(source({ slides: [block(1, 's07_problem', 'Legacy')] }));
    expect(validateSlideDocument(legacy)).toEqual([]);

    const native = parseSlideDocument(source({
      frontmatter: '---\nidentity:\n  scheme: mnemonic-v1\n---\n',
      slides: [block(1, 's07_problem', 'Not mnemonic')],
    }));
    expect(validateSlideDocument(native)).toContainEqual(
      expect.objectContaining({ code: 'invalid_mnemonic_id', severity: 'ERROR' })
    );
  });

  it('rejects malformed identity mappings and unknown nested keys', () => {
    const wrongType = parseSlideDocument(source({
      frontmatter: '---\nidentity: mnemonic-v1\n---\n',
      slides: [block(1, 'DeckGo', 'Opening')],
    }));
    expect(validateSlideDocument(wrongType).map((issue) => issue.code)).toContain('invalid_identity_marker');

    const unknown = parseSlideDocument(source({
      frontmatter: '---\nidentity:\n  scheme: mnemonic-v1\n  random: true\n---\n',
      slides: [block(1, 'DeckGo', 'Opening')],
    }));
    expect(validateSlideDocument(unknown).map((issue) => issue.code)).toContain('unknown_identity_key');
  });
});

describe('slide edit transactions', () => {
  it('resolves multi-delete selectors from one pre-edit snapshot', () => {
    const text = source({
      slides: [
        block(1, 'DeckGo', 'Opening'),
        block(2, 'UXGap', 'Problem'),
        block(3, 'AICost', 'Cost'),
        block(4, 'IDFix', 'Fix'),
      ],
    });
    const document = parseSlideDocument(text, '3_versions/v2/slide-specifications.md');
    const plan = planSlideEdit(document, ['2', '4'], [{ op: 'delete' }], [], {
      targetVersion: 'v3',
    });

    expect(plan.bindings.map((binding) => binding.slide_id)).toEqual(['UXGap', 'IDFix']);
    expect(plan.operations).toEqual([
      { op: 'delete', slide_id: 'UXGap' },
      { op: 'delete', slide_id: 'IDFix' },
    ]);
    expect(plan.after_order).toEqual(['DeckGo', 'AICost']);
    expect(verifySlideEditPlanHash(plan)).toBe(true);
  });

  it('moves complete blocks, normalizes headings, and leaves epilogue bytes behind', () => {
    const second = block(2, 'UXGap', 'Problem', 'See page 3 for costs.');
    const text = source({
      slides: [block(1, 'DeckGo', 'Opening'), second, block(3, 'AICost', 'Cost')],
      epilogue: '## Change Log\n\nOriginal log.\n',
    });
    const document = parseSlideDocument(text);
    const plan = planSlideEdit(document, ['2'], [{ op: 'move', after: '3' }]);
    const applied = applySlideEdit(plan, text, { expectedPlanSha256: plan.plan_sha256 });

    expect(applied.text.indexOf('AICost')).toBeLessThan(applied.text.indexOf('UXGap'));
    expect(applied.text).toContain('## Slide 03: `UXGap`\n\n**TITLE**: Problem');
    expect(applied.text).toContain('**SPEAKER NOTE**: See page 3 for costs.');
    expect(applied.text.endsWith('## Change Log\n\nOriginal log.\n')).toBe(true);
    expect(applied.receipt.after_order).toEqual(['DeckGo', 'AICost', 'UXGap']);
    expect(applied.receipt.warnings).toContainEqual(
      expect.objectContaining({ code: 'natural_language_page_reference', match: 'page 3' })
    );
  });

  it('updates deterministic render.header-lock references when deleting', () => {
    const text = source({
      frontmatter:
        '---\nrender:\n  default: full-page\n  header-lock: [UXGap, AICost]\n---\n',
    });
    const document = parseSlideDocument(text);
    const plan = planSlideEdit(document, ['UXGap'], [{ op: 'delete' }]);
    const applied = applySlideEdit(plan, text, { expectedPlanSha256: plan.plan_sha256 });
    const result = parseSlideDocument(applied.text);

    expect(result.frontmatter.metadata.render['header-lock']).toEqual(['AICost']);
    expect(plan.structured_reference_changes).toEqual([
      { kind: 'render.header-lock', action: 'remove', slide_ids: ['UXGap'] },
    ]);
  });

  it('supports an Agent-authored insertion and preserves its body', () => {
    const text = source();
    const document = parseSlideDocument(text);
    const inserted = block(1, 'IDFix', 'Stable identity', 'Keep this note exactly.');
    const plan = planSlideEdit(document, [], [
      { op: 'insert', block: inserted, after: 'UXGap' },
    ], ['OldGone']);
    const applied = applySlideEdit(plan, text, { expectedPlanSha256: plan.plan_sha256 });

    expect(plan.after_order).toEqual(['DeckGo', 'UXGap', 'IDFix', 'AICost']);
    expect(applied.text).toContain('## Slide 03: `IDFix`');
    expect(applied.text).toContain('Keep this note exactly.');
  });

  it('rejects duplicate-operation, deleted-anchor, and historically reserved insert conflicts', () => {
    const document = parseSlideDocument(source());
    expect(() => planSlideEdit(document, ['UXGap', 'UX gap'], [{ op: 'delete' }])).toThrow(
      /targeted by 2 conflicting operations/i
    );
    expect(() => planSlideEdit(document, [], [
      { op: 'delete', selector: 'UXGap' },
      { op: 'move', selector: 'AICost', after: 'UXGap' },
    ])).toThrow(/anchor.*deleted/i);
    expect(() => planSlideEdit(document, [], [
      { op: 'insert', block: block(1, 'IDFix', 'New'), to: 'end' },
    ], ['IDFix'])).toThrow(/invalid or reserved/i);
  });

  it('binds the canonical hash to mutations but excludes render status and presentation', () => {
    const document = parseSlideDocument(source());
    const plan = planSlideEdit(document, ['UXGap'], [{ op: 'move', after: 'AICost' }], [], {
      targetVersion: 'v2',
    });
    const originalHash = plan.plan_sha256;
    const decorated = { ...plan, render_impact: { needs_render: ['UXGap'] }, display: 'preview' };
    expect(computeSlideEditPlanSha256(decorated)).toBe(originalHash);

    const changedTarget = {
      ...plan,
      publication: { ...plan.publication, target_version: 'v3' },
    };
    expect(computeSlideEditPlanSha256(changedTarget)).not.toBe(originalHash);
  });

  it('requires an explicit matching plan hash and the unchanged source hash', () => {
    const text = source();
    const plan = planSlideEdit(parseSlideDocument(text), ['UXGap'], [{ op: 'delete' }]);
    expect(() => applySlideEdit(plan, text)).toThrow(/requires.*plan_sha256/i);
    expect(() => applySlideEdit(plan, text, { expectedPlanSha256: '0'.repeat(64) })).toThrow(
      /does not match/i
    );
    expect(() => applySlideEdit(plan, `${text}\n`, { expectedPlanSha256: plan.plan_sha256 })).toThrow(
      /source changed/i
    );
    expect(plan.base_spec_sha256).toBe(sha256SlideSource(text));
  });

  it('produces a byte-identical no-op normalize receipt for canonical source', () => {
    const text = source();
    const plan = planSlideEdit(parseSlideDocument(text), [], [{ op: 'normalize' }]);
    const applied = applySlideEdit(plan, text, { expectedPlanSha256: plan.plan_sha256 });
    expect(applied.text).toBe(text);
    expect(applied.receipt.no_op).toBe(true);
    expect(applied.receipt.heading_normalization).toEqual([]);
  });
});
