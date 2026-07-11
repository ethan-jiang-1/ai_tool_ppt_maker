/**
 * Resolve friendly --only selectors against slide_plan.json slide entries.
 *
 * Order: exact id → sNN / zero-padded prefix → 1-based page number →
 * unique case-insensitive substring. Ambiguous or unknown → throw.
 *
 * @param {string[]} requested - tokens from --only (already split)
 * @param {{id: string}[]} slides - plan.slides
 * @returns {string[]} resolved ids (same order as requested, deduped)
 */
export function resolveSlideIds(requested, slides) {
  const ids = (slides || []).map((s) => s.id).filter(Boolean);
  if (!Array.isArray(requested) || requested.length === 0) {
    return [];
  }
  if (ids.length === 0) {
    throw new Error('slide_plan.json has no slides to resolve --only against');
  }

  const known = new Set(ids);
  /** @type {string[]} */
  const resolved = [];
  /** @type {string[]} */
  const errors = [];

  for (const raw of requested) {
    const token = String(raw || '').trim();
    if (!token) continue;

    if (known.has(token)) {
      if (!resolved.includes(token)) resolved.push(token);
      continue;
    }

    // s03 / s3 / S03 prefix (match ids that start with s0*N_ or equal s0*N)
    const prefixMatch = token.match(/^s0*(\d+)$/i);
    if (prefixMatch) {
      const n = prefixMatch[1];
      const padded = `s${n.padStart(2, '0')}`;
      const hits = ids.filter(
        (id) =>
          id === padded ||
          id === `s${n}` ||
          id.startsWith(`${padded}_`) ||
          id.startsWith(`s${n}_`) ||
          new RegExp(`^s0*${n}(_|$)`, 'i').test(id)
      );
      const unique = [...new Set(hits)];
      if (unique.length === 1) {
        if (!resolved.includes(unique[0])) resolved.push(unique[0]);
        continue;
      }
      if (unique.length > 1) {
        errors.push(`'${token}' is ambiguous: ${unique.join(', ')}`);
        continue;
      }
    }

    // 1-based page number
    if (/^\d+$/.test(token)) {
      const idx = parseInt(token, 10);
      if (idx >= 1 && idx <= ids.length) {
        const id = ids[idx - 1];
        if (!resolved.includes(id)) resolved.push(id);
        continue;
      }
      errors.push(`'${token}' is out of range (1–${ids.length})`);
      continue;
    }

    // unique substring
    const lower = token.toLowerCase();
    const hits = ids.filter((id) => id.toLowerCase().includes(lower));
    if (hits.length === 1) {
      if (!resolved.includes(hits[0])) resolved.push(hits[0]);
      continue;
    }
    if (hits.length > 1) {
      errors.push(`'${token}' is ambiguous: ${hits.join(', ')}`);
      continue;
    }

    errors.push(`'${token}' matched no slide id`);
  }

  if (errors.length > 0) {
    const list = ids.length <= 40 ? ids.join(', ') : `${ids.slice(0, 40).join(', ')}, …`;
    throw new Error(
      `Unknown or ambiguous slide selector(s): ${errors.join('; ')}. Available ids: ${list}`
    );
  }

  return resolved;
}

/**
 * Format available ids for CLI hints (truncated).
 * @param {{id: string}[]} slides
 * @param {number} [max=40]
 */
export function formatAvailableSlideIds(slides, max = 40) {
  const ids = (slides || []).map((s) => s.id).filter(Boolean);
  if (ids.length === 0) return '(none)';
  if (ids.length <= max) return ids.join(', ');
  return `${ids.slice(0, max).join(', ')}, … (+${ids.length - max} more)`;
}
