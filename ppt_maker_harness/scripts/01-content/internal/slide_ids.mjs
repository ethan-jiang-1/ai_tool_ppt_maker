const DEFAULT_RESERVED_SPOKEN_KEYS = new Set([
  "all",
  "first",
  "last",
  "before",
  "after",
  "start",
  "end",
  "next",
  "previous",
  "prev",
  "slide",
  "page",
  "position",
  "current",
]);

const EASY_CONFUSION_GROUPS = [
  ["b", "p"],
  ["c", "k", "q"],
  ["d", "t"],
  ["f", "v"],
  ["g", "j"],
  ["m", "n"],
  ["s", "z"],
];

export class SlideIdentityError extends Error {
  constructor(message, issues = []) {
    super(message);
    this.name = "SlideIdentityError";
    this.issues = issues;
  }
}

export class SlideSelectorError extends Error {
  constructor(message, { token = null, candidates = [], available = [] } = {}) {
    super(message);
    this.name = "SlideSelectorError";
    this.token = token;
    this.candidates = candidates;
    this.available = available;
  }
}

/**
 * Normalize the voice-friendly selector form without changing the formal ID.
 * Only a leading @ plus spaces and hyphens are ignored by the contract.
 */
export function normalizeSpokenKey(value) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .replace(/[\s-]+/g, "")
    .toLowerCase();
}

function blockKind(value) {
  if (/^[A-Z]{2,4}$/.test(value)) return "acronym";
  if (/^[A-Z][a-z]{1,3}$/.test(value)) return "title";
  return null;
}

/**
 * Parse the deterministic part of the mnemonic contract. Semantic SUBJECT +
 * MOVE quality deliberately remains Agent-owned.
 */
export function parseMnemonicSlideId(value) {
  const id = String(value ?? "");
  const problems = [];
  if (!/^[A-Za-z]+$/.test(id)) {
    problems.push("must contain only ASCII letters");
  }
  if (id.length < 5 || id.length > 8) {
    problems.push("must contain 5-8 letters");
  }

  const parses = [];
  if (problems.length === 0) {
    for (let split = 2; split <= 4; split += 1) {
      const left = id.slice(0, split);
      const right = id.slice(split);
      if (right.length < 2 || right.length > 4) continue;
      const leftKind = blockKind(left);
      const rightKind = blockKind(right);
      if (!leftKind || !rightKind) continue;
      if (leftKind !== "title" && rightKind !== "title") continue;
      parses.push({ blocks: [left, right], block_kinds: [leftKind, rightKind] });
    }
    if (parses.length === 0) {
      problems.push(
        "must be exactly two 2-4 letter BlockCase blocks with at least one TitleCase block"
      );
    } else if (parses.length > 1) {
      problems.push("has an ambiguous BlockCase boundary");
    }
  }

  return {
    valid: problems.length === 0,
    id,
    spoken_key: normalizeSpokenKey(id),
    blocks: parses.length === 1 ? parses[0].blocks : null,
    block_kinds: parses.length === 1 ? parses[0].block_kinds : null,
    problems,
  };
}

export function isMnemonicSlideId(value) {
  return parseMnemonicSlideId(value).valid;
}

export function classifySlideId(value) {
  const id = String(value ?? "").trim();
  if (!id) return "empty";
  return isMnemonicSlideId(id) ? "mnemonic" : "legacy";
}

export function isLegacySlideId(value) {
  return classifySlideId(value) === "legacy";
}

function levenshteinDistance(left, right) {
  const a = String(left);
  const b = String(right);
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[b.length];
}

function easyConfusionDistance(left, right) {
  if (left.length !== right.length) return Infinity;
  let differences = 0;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] === right[index]) continue;
    const group = EASY_CONFUSION_GROUPS.find(
      (items) => items.includes(left[index]) && items.includes(right[index])
    );
    if (!group) return Infinity;
    differences += 1;
  }
  return differences;
}

export function findNearConfusions(value, otherIds, { maxDistance = 1 } = {}) {
  const key = normalizeSpokenKey(value);
  if (!key) return [];
  return [...new Set((otherIds || []).map((item) => String(item ?? "").trim()).filter(Boolean))]
    .filter((other) => {
      const otherKey = normalizeSpokenKey(other);
      if (!otherKey || otherKey === key) return false;
      return (
        levenshteinDistance(key, otherKey) <= maxDistance ||
        easyConfusionDistance(key, otherKey) <= maxDistance
      );
    })
    .sort((a, b) => a.localeCompare(b));
}

export function buildSlideIdReservation(ids = []) {
  const formalIds = new Map();
  const spokenKeys = new Map();
  for (const raw of ids) {
    const id = String(raw ?? "").trim();
    if (!id) continue;
    if (!formalIds.has(id)) formalIds.set(id, []);
    formalIds.get(id).push(id);
    const key = normalizeSpokenKey(id);
    if (!spokenKeys.has(key)) spokenKeys.set(key, []);
    spokenKeys.get(key).push(id);
  }
  return { formal_ids: formalIds, spoken_keys: spokenKeys };
}

/**
 * Validate an ID supplied by a creation/insertion path. Current Page Image
 * IDs are created here; historical bytes do not pass through ordinary deck reads.
 */
export function validateNewSlideId(
  value,
  {
    currentIds = [],
    historyIds = [],
    reservedWords = DEFAULT_RESERVED_SPOKEN_KEYS,
    nearConfusionDistance = 1,
  } = {}
) {
  const id = String(value ?? "").trim();
  const parsed = parseMnemonicSlideId(id);
  const issues = parsed.problems.map((message) => ({
    severity: "ERROR",
    code: "invalid_mnemonic_id",
    message,
    slide_id: id || null,
  }));
  const spokenKey = normalizeSpokenKey(id);
  const reserved = reservedWords instanceof Set ? reservedWords : new Set(reservedWords || []);
  if (spokenKey && reserved.has(spokenKey)) {
    issues.push({
      severity: "ERROR",
      code: "reserved_slide_id",
      message: `spoken key ${JSON.stringify(spokenKey)} is reserved by selector syntax`,
      slide_id: id,
    });
  }

  const allReservedIds = [...currentIds, ...historyIds]
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
  const formalConflicts = [...new Set(allReservedIds.filter((item) => item === id))];
  const spokenConflicts = [
    ...new Set(
      allReservedIds.filter(
        (item) => normalizeSpokenKey(item) === spokenKey && item !== id
      )
    ),
  ];
  if (formalConflicts.length > 0) {
    issues.push({
      severity: "ERROR",
      code: "reserved_formal_id",
      message: `slide ID ${JSON.stringify(id)} is already reserved by deck history`,
      slide_id: id,
      conflicts: formalConflicts,
    });
  }
  if (spokenConflicts.length > 0) {
    issues.push({
      severity: "ERROR",
      code: "reserved_spoken_key",
      message:
        `spoken key ${JSON.stringify(spokenKey)} conflicts with reserved slide ID(s): ` +
        spokenConflicts.join(", "),
      slide_id: id,
      conflicts: spokenConflicts,
    });
  }

  const nearConfusions = findNearConfusions(id, allReservedIds, {
    maxDistance: nearConfusionDistance,
  });
  if (nearConfusions.length > 0) {
    issues.push({
      severity: "WARN",
      code: "near_confusable_slide_id",
      message: `slide ID ${JSON.stringify(id)} is easy to confuse with: ${nearConfusions.join(", ")}`,
      slide_id: id,
      conflicts: nearConfusions,
    });
  }

  return {
    valid: issues.every((issue) => issue.severity !== "ERROR"),
    id,
    spoken_key: spokenKey,
    blocks: parsed.blocks,
    preferred_length: id.length === 5 || id.length === 6,
    issues,
  };
}

function normalizeSlide(slide, index) {
  const id = String(slide?.slide_id ?? slide?.id ?? "").trim();
  return {
    original: slide,
    slide_id: id,
    position: Number.isInteger(slide?.position) ? slide.position : index + 1,
    title: String(slide?.title ?? slide?.headline ?? "").trim(),
  };
}

export function formatSlideCandidate(slide) {
  const title = slide.title ? ` · ${slide.title}` : "";
  return `${String(slide.position).padStart(2, "0")} · ${slide.slide_id}${title}`;
}

function selectorFailure(token, message, candidates, slides, maxCandidates) {
  const boundedCandidates = candidates.slice(0, maxCandidates);
  const boundedAvailable = slides.slice(0, maxCandidates);
  const detail = boundedCandidates.length > 0
    ? boundedCandidates.map(formatSlideCandidate).join(", ")
    : boundedAvailable.map(formatSlideCandidate).join(", ");
  const label = boundedCandidates.length > 0 ? "Candidates" : "Available ids/slides";
  throw new SlideSelectorError(`${message}. ${label}: ${detail || "(none)"}`, {
    token,
    candidates: boundedCandidates,
    available: boundedAvailable,
  });
}

/**
 * Resolve every selector against one immutable slide snapshot. Bindings retain
 * token order and duplicates; operation-specific callers decide deduplication.
 */
export function resolveSlideBindings(requested, inputSlides, { maxCandidates = 20 } = {}) {
  if (!Array.isArray(requested) || requested.length === 0) return [];
  const slides = (inputSlides || []).map(normalizeSlide);
  if (slides.length === 0 || slides.every((slide) => !slide.slide_id)) {
    throw new SlideSelectorError("slide snapshot has no slides to resolve selectors against");
  }

  const bindings = [];
  for (const raw of requested) {
    const token = String(raw ?? "").trim();
    if (!token) {
      selectorFailure(token, "Empty slide selector", [], slides, maxCandidates);
    }

    let hits = slides.filter((slide) => slide.slide_id === token);
    if (hits.length === 1) {
      bindings.push({ token, slide_id: hits[0].slide_id, position: hits[0].position, matched_by: "exact_id" });
      continue;
    }
    if (hits.length > 1) {
      selectorFailure(token, `Slide selector ${JSON.stringify(token)} is ambiguous`, hits, slides, maxCandidates);
    }

    const spokenKey = normalizeSpokenKey(token);
    hits = slides.filter((slide) => normalizeSpokenKey(slide.slide_id) === spokenKey);
    if (hits.length === 1) {
      bindings.push({ token, slide_id: hits[0].slide_id, position: hits[0].position, matched_by: "spoken_key" });
      continue;
    }
    if (hits.length > 1) {
      selectorFailure(token, `Spoken slide selector ${JSON.stringify(token)} is ambiguous`, hits, slides, maxCandidates);
    }

    const positionMatch = token.match(/^(?:p)?(\d+)$/i);
    if (positionMatch) {
      const position = Number.parseInt(positionMatch[1], 10);
      hits = slides.filter((slide) => slide.position === position);
      if (hits.length === 1) {
        bindings.push({ token, slide_id: hits[0].slide_id, position: hits[0].position, matched_by: "position" });
        continue;
      }
      if (hits.length > 1) {
        selectorFailure(token, `Position selector ${JSON.stringify(token)} is ambiguous`, hits, slides, maxCandidates);
      }
      selectorFailure(
        token,
        `Position selector ${JSON.stringify(token)} is out of range`,
        [],
        slides,
        maxCandidates
      );
    }

    const titleNeedle = token.toLowerCase();
    hits = slides.filter(
      (slide) => slide.title && slide.title.toLowerCase().includes(titleNeedle)
    );
    if (hits.length === 1) {
      bindings.push({ token, slide_id: hits[0].slide_id, position: hits[0].position, matched_by: "title" });
      continue;
    }
    if (hits.length > 1) {
      selectorFailure(token, `Title selector ${JSON.stringify(token)} is ambiguous`, hits, slides, maxCandidates);
    }

    const legacyPrefix = token.match(/^s0*(\d+)$/i);
    if (legacyPrefix) {
      const number = legacyPrefix[1];
      const prefixPattern = new RegExp(`^s0*${number}(?:_|$)`, "i");
      hits = slides.filter(
        (slide) => isLegacySlideId(slide.slide_id) && prefixPattern.test(slide.slide_id)
      );
      if (hits.length === 1) {
        bindings.push({ token, slide_id: hits[0].slide_id, position: hits[0].position, matched_by: "legacy_prefix" });
        continue;
      }
      if (hits.length > 1) {
        selectorFailure(token, `Legacy slide selector ${JSON.stringify(token)} is ambiguous`, hits, slides, maxCandidates);
      }
    }

    selectorFailure(token, `Slide selector ${JSON.stringify(token)} matched no slide`, [], slides, maxCandidates);
  }
  return bindings;
}

/**
 * Backward-compatible --only resolver. New code should keep binding evidence by
 * calling resolveSlideBindings(); this adapter retains historic ID-substring
 * convenience and deduplicates IDs for stage execution.
 */
export function resolveSlideIds(requested, slides) {
  if (!Array.isArray(requested) || requested.length === 0) return [];
  const snapshot = (slides || []).map(normalizeSlide);
  const resolved = [];
  for (const raw of requested) {
    const token = String(raw ?? "").trim();
    try {
      const [binding] = resolveSlideBindings([token], snapshot);
      if (!resolved.includes(binding.slide_id)) resolved.push(binding.slide_id);
      continue;
    } catch (error) {
      if (!(error instanceof SlideSelectorError) || !token || /^p?\d+$/i.test(token)) throw error;
      const lower = token.toLowerCase();
      const hits = snapshot.filter((slide) => slide.slide_id.toLowerCase().includes(lower));
      if (hits.length === 1) {
        if (!resolved.includes(hits[0].slide_id)) resolved.push(hits[0].slide_id);
        continue;
      }
      if (hits.length > 1) {
        selectorFailure(token, `Slide selector ${JSON.stringify(token)} is ambiguous`, hits, snapshot, 20);
      }
      throw error;
    }
  }
  return resolved;
}

export function formatAvailableSlideIds(slides, max = 40) {
  const ids = (slides || [])
    .map((slide) => String(slide?.slide_id ?? slide?.id ?? "").trim())
    .filter(Boolean);
  if (ids.length === 0) return "(none)";
  if (ids.length <= max) return ids.join(", ");
  return `${ids.slice(0, max).join(", ")}, … (+${ids.length - max} more)`;
}

export const RESERVED_SLIDE_SELECTOR_WORDS = DEFAULT_RESERVED_SPOKEN_KEYS;
