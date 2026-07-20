import { parseDocument } from "yaml";

export const RENDER_MODE_FULL_PAGE = "full-page";
export const RENDER_MODE_BODY_HEADER_LOCK = "body+header-lock";
export const CANONICAL_RENDER_MODES = new Set([
  RENDER_MODE_FULL_PAGE,
  RENDER_MODE_BODY_HEADER_LOCK,
]);

const RENDER_MODE_ALIASES = new Map([
  ["full-page", RENDER_MODE_FULL_PAGE],
  ["fullpage", RENDER_MODE_FULL_PAGE],
  ["image_direct", RENDER_MODE_FULL_PAGE],
  ["imagedirect", RENDER_MODE_FULL_PAGE],
  ["body+header-lock", RENDER_MODE_BODY_HEADER_LOCK],
  ["bodyheaderlock", RENDER_MODE_BODY_HEADER_LOCK],
  ["body+headerlock", RENDER_MODE_BODY_HEADER_LOCK],
  ["normal", RENDER_MODE_BODY_HEADER_LOCK],
]);

const HERO_VISUAL_TYPE_ALIASES = new Map([
  ["title/opener", "Title / Opener"],
  ["sectiondivider/bridge", "Section Divider / Bridge"],
  ["sectiondivider", "Section Divider / Bridge"],
  ["closer", "Closer"],
]);

export class RenderPolicyError extends Error {
  constructor(problems) {
    const list = Array.isArray(problems) ? problems : [String(problems)];
    super(list.join("; "));
    this.name = "RenderPolicyError";
    this.problems = list;
  }
}

function compact(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

export function normalizeVisualType(value) {
  const raw = String(value || "").trim();
  return HERO_VISUAL_TYPE_ALIASES.get(compact(raw)) || raw;
}

export function isHeroVisualType(value) {
  return HERO_VISUAL_TYPE_ALIASES.has(compact(value));
}

export function isBracketPlaceholder(value) {
  const text = String(value || "").trim();
  return text.length > 2 && text.startsWith("[") && text.endsWith("]");
}

export function presentHeaderText(value) {
  const text = String(value || "").trim();
  if (!text || isBracketPlaceholder(text)) return "";
  const lower = text.toLowerCase();
  if (lower === "(none)" || text === "(无)") return "";
  return text;
}

export function normalizeRenderMode(raw, slideId = "") {
  if (!raw || !String(raw).trim()) return null;
  const canonical = RENDER_MODE_ALIASES.get(compact(raw));
  if (!canonical) {
    throw new RenderPolicyError(
      `slide ${JSON.stringify(slideId)} has unrecognized RENDER MODE ${JSON.stringify(raw)}; ` +
      "use 'full-page' or 'body+header-lock'"
    );
  }
  return canonical;
}

export function parseLeadingFrontmatter(text, label = "slide-specifications.md") {
  const source = String(text || "").replace(/^\uFEFF/, "");
  if (!source.startsWith("---\n") && !source.startsWith("---\r\n")) {
    return { body: source, metadata: {}, hasFrontmatter: false, policy: null };
  }

  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    throw new RenderPolicyError(`${label}: leading YAML frontmatter is not closed with '---'`);
  }

  const document = parseDocument(match[1], { uniqueKeys: true });
  const yamlProblems = [...document.errors, ...document.warnings].map(
    (problem) => `${label}: ${problem.message.split("\n")[0]}`
  );
  if (yamlProblems.length > 0) throw new RenderPolicyError(yamlProblems);

  const metadata = document.toJS() ?? {};
  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new RenderPolicyError(`${label}: frontmatter root must be a mapping`);
  }

  const hasRender = Object.prototype.hasOwnProperty.call(metadata, "render");
  const policy = hasRender ? validateRenderMapping(metadata.render, label) : null;
  return {
    body: source.slice(match[0].length),
    metadata,
    hasFrontmatter: true,
    policy,
  };
}

function validateRenderMapping(value, label) {
  const problems = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RenderPolicyError(`${label}: render must be a mapping`);
  }
  const allowed = new Set(["default", "header-lock"]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) problems.push(`${label}: unknown render key ${JSON.stringify(key)}`);
  }

  let defaultMode = RENDER_MODE_FULL_PAGE;
  if (Object.prototype.hasOwnProperty.call(value, "default")) {
    if (!CANONICAL_RENDER_MODES.has(value.default)) {
      problems.push(
        `${label}: render.default must be 'full-page' or 'body+header-lock'`
      );
    } else {
      defaultMode = value.default;
    }
  }

  let headerLock = [];
  if (Object.prototype.hasOwnProperty.call(value, "header-lock")) {
    if (!Array.isArray(value["header-lock"])) {
      problems.push(`${label}: render.header-lock must be an array of slide ids`);
    } else {
      const seen = new Set();
      for (const item of value["header-lock"]) {
        if (typeof item !== "string" || !item.trim()) {
          problems.push(`${label}: render.header-lock ids must be non-empty strings`);
          continue;
        }
        const id = item.trim();
        if (seen.has(id)) problems.push(`${label}: duplicate render.header-lock id ${JSON.stringify(id)}`);
        seen.add(id);
        headerLock.push(id);
      }
    }
  }
  if (problems.length > 0) throw new RenderPolicyError(problems);
  return { default: defaultMode, headerLock };
}

export function validatePolicySlideIds(policy, slideIds, label = "slide-specifications.md") {
  if (!policy) return;
  const counts = new Map();
  for (const id of slideIds) counts.set(id, (counts.get(id) || 0) + 1);
  const problems = [];
  for (const id of policy.headerLock) {
    const count = counts.get(id) || 0;
    if (count === 0) problems.push(`${label}: render.header-lock references unknown slide id ${JSON.stringify(id)}`);
    if (count > 1) problems.push(`${label}: render.header-lock id ${JSON.stringify(id)} is ambiguous (${count} slide blocks)`);
  }
  if (problems.length > 0) throw new RenderPolicyError(problems);
}

export function determineRenderMode({
  slideId,
  visualType,
  renderMode,
  policy = null,
  safeZone,
  extraSafeZone = null,
}) {
  const explicit = normalizeRenderMode(renderMode, slideId);
  if (explicit) {
    return {
      mode: explicit,
      safeZone: explicit === RENDER_MODE_FULL_PAGE ? 0 : safeZone,
      source: "explicit",
    };
  }

  if (!policy) {
    if (extraSafeZone != null) {
      return { mode: RENDER_MODE_BODY_HEADER_LOCK, safeZone: extraSafeZone, source: "derived:visual_type" };
    }
    if (isHeroVisualType(visualType)) {
      return { mode: RENDER_MODE_FULL_PAGE, safeZone: 0, source: "derived:visual_type" };
    }
    return { mode: RENDER_MODE_BODY_HEADER_LOCK, safeZone, source: "derived:visual_type" };
  }

  if (policy.headerLock.includes(slideId)) {
    return { mode: RENDER_MODE_BODY_HEADER_LOCK, safeZone, source: "policy:exception" };
  }
  if (policy.default === RENDER_MODE_BODY_HEADER_LOCK && isHeroVisualType(visualType)) {
    return { mode: RENDER_MODE_FULL_PAGE, safeZone: 0, source: "derived:hero_type" };
  }
  return {
    mode: policy.default,
    safeZone: policy.default === RENDER_MODE_FULL_PAGE ? 0 : safeZone,
    source: "policy:default",
  };
}
