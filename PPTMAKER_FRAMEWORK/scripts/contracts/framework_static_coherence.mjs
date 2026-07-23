/** Static-only legacy-token contract consumed by architecture verification. */
export const LEGACY_TOKEN_EXCEPTIONS = Object.freeze([
  Object.freeze({
    token: "image2-refinement",
    file: "PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs",
    reason: "read-only visual-slot state compatibility and public workflow-inspection projection",
    owner: "shared-state",
    public_compatibility: true,
    retire_by: "change:public-image-production-terminology",
  }),
  Object.freeze({
    token: "image2-refinement",
    file: "PPTMAKER_FRAMEWORK/playbook/image2-refine.md",
    reason: "documented public controller and action identifiers remain stable during this physical-owner change",
    owner: "workflow-control",
    public_compatibility: true,
    retire_by: "change:public-image-production-terminology",
  }),
  Object.freeze({
    token: "04-image2-refinement",
    file: "openspec/changes/realign-image-production-and-framework-governance/proposal.md",
    reason: "breaking migration records the retired physical path",
    owner: "openspec",
    public_compatibility: false,
    retire_by: "not-applicable:protected-migration-history",
  }),
]);

const LEGACY_RETIRE_BY = /^(?:change:[a-z0-9][a-z0-9-]*|release:[0-9]+(?:\.[0-9]+){1,2}|not-applicable:[a-z][a-z0-9-]*)$/;
const LEGACY_OWNER = /^[a-z][a-z0-9-]{1,63}$/;
const LEGACY_TOKEN = /^[A-Za-z0-9][A-Za-z0-9._/-]{1,127}$/;

function issue(file, line, rule, message, hint) { return { file, line, rule, message, hint }; }

export function validateLegacyTokenExceptions(entries = LEGACY_TOKEN_EXCEPTIONS) {
  const issues = [];
  const seen = new Set();
  if (!Array.isArray(entries)) return [issue("<legacy-token-exceptions>", 1, "legacy-token-exception", "registry must be an array", "provide literal exception rows")];
  for (const entry of entries) {
    const file = entry?.file || "<legacy-token-exception>";
    if (!entry || Object.keys(entry).sort().join("\n") !== ["file", "owner", "public_compatibility", "reason", "retire_by", "token"].join("\n")) {
      issues.push(issue(file, 1, "legacy-token-exception", "entry must contain exactly token, file, reason, owner, public_compatibility, retire_by", "remove broad or undocumented fields"));
      continue;
    }
    if (!LEGACY_TOKEN.test(entry.token) || /[*?]/.test(entry.token)) issues.push(issue(file, 1, "legacy-token-exception", "token must be one literal legacy token", "remove wildcard token matching"));
    if (typeof entry.file !== "string" || !entry.file || /[*?]|\/$/.test(entry.file)) issues.push(issue(file, 1, "legacy-token-exception", "file must be one exact repository path", "name one exact file"));
    if (typeof entry.reason !== "string" || !entry.reason.trim()) issues.push(issue(file, 1, "legacy-token-exception", "reason is required", "state the concrete compatibility purpose"));
    if (!LEGACY_OWNER.test(entry.owner || "")) issues.push(issue(file, 1, "legacy-token-exception", "owner must be a stable direct owner id", "assign a direct owner"));
    if (typeof entry.public_compatibility !== "boolean") issues.push(issue(file, 1, "legacy-token-exception", "public_compatibility must be boolean", "state whether the spelling is public"));
    if (!LEGACY_RETIRE_BY.test(entry.retire_by || "")) issues.push(issue(file, 1, "legacy-token-exception", "retire_by must be change:<name>, release:<version>, or not-applicable:<invariant>", "add an explicit retirement condition"));
    const key = `${entry.token}\u0000${entry.file}`;
    if (seen.has(key)) issues.push(issue(file, 1, "legacy-token-exception", "duplicate token/file exception", "keep one authoritative row"));
    seen.add(key);
  }
  return issues;
}
