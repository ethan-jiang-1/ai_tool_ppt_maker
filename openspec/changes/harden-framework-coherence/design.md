## Context

The framework has three different kinds of authority that evolved at different speeds:

1. executable runtime contracts in `scripts/` and `openspec/specs/`;
2. MD Controller declarations in `playbook/` and `_state/state.yaml`;
3. human/agent teaching material in root, charter, workflow, reference, and README files.

The production runtime is already strongly guarded by run-bundle layout validation, render policy resolution, image provenance, header-review fingerprints, and regression tests. The coherence defects occur at the boundaries: playbook node YAML is visually present but not parsed by `state.mjs`; condition names are mostly prose rather than executable catalog entries; standalone scripts do not share the failure-envelope behavior of `ppt_flow`; and recent changes such as in-framework Stage 2 and policy-default `full-page` were not propagated through every active document.

The change must remain Node.js ESM only, preserve the existing run-bundle layout, avoid new production dependencies, and retain Markdown as the primary authoring interface for agents.

## Goals / Non-Goals

**Goals:**

- Make every registered playbook node discoverable, uniquely identifiable, parseable, and testable.
- Make entry/exit checks reflect the declarations that humans see in Markdown.
- Represent human-judgment conditions as explicit persisted evidence rather than silently unknown prose.
- Ensure all supported standalone CLI failures obey the constitutional JSON envelope.
- Make active documentation agree with current runtime behavior and canonical vocabulary.
- Add whole-framework tests that fail on broken links, stale paths, semantic edit-chain drift, invalid playbooks, or prose-only CLI failures.

**Non-Goals:**

- Changing the run-bundle three-tier layout or generated artifact paths.
- Replacing the agent with a fully automatic workflow server or DAG engine.
- Removing human review gates or attempting to automate subjective content/visual approval.
- Changing image generation models, visual output, slide content, or current generation profiles.
- Refactoring every large production module solely for file-size reduction; only extraction needed for shared validation/error behavior is in scope.

## Decisions

### 1. Keep Markdown playbooks, but define one canonical node declaration grammar

Registered controller files will continue to contain ordered ` ```yaml ` node declarations because this keeps the workflow readable as one narrative document. Standalone shared nodes may continue to use document frontmatter. A single parser will support these two explicit forms and reject ambiguous substring-based discovery.

The parser will build a playbook index containing playbook name, ordered node list, includes, source file, source location, requires, entry, exit, and produces. Node lookup will use this index rather than scanning for `c.includes("node: ...")`.

Alternative considered: split all 38 embedded nodes into separate Markdown files. Rejected because it would substantially damage playbook readability and create many tiny files without improving the user-facing workflow.

### 2. Require globally unique node IDs in the registered playbook set

Node IDs are persisted under `state.nodes.<id>` and `current_node`, so duplicate names are inherently ambiguous. Generic duplicates such as `verify-output` will be renamed to intent-specific IDs such as `verify-text-output` and `verify-visual-output`. Includes and requires references will be validated against the complete index.

Alternative considered: qualify IDs as `<playbook>/<node>`. Rejected for this change because it would require a state migration for every existing deck and would complicate resume compatibility. Unique kebab-case IDs preserve the current state schema.

### 3. Make manual judgment an explicit condition type

Every condition will be either:

- a deterministic catalog condition backed by filesystem/state data; or
- an explicit `manual:<evidence-key>` condition backed by persisted node evidence.

Manual conditions will not auto-pass. The current node record will carry an `evidence` mapping, and the condition will pass only when the matching key is recorded as true. This keeps human judgment in the loop while allowing `checkEntry`/`checkExit` to return deterministic results from disk state.

Free-form unknown conditions will fail validation. This replaces the current behavior where dozens of prose conditions remain unknown and most embedded declarations are skipped entirely.

Alternative considered: add all existing prose tokens as one-off functions in `CONDITIONS`. Rejected because many represent subjective decisions rather than reusable executable predicates.

### 4. Add a playbook validator before wiring stricter runtime enforcement

A reusable validator will check node parsing, unique IDs, includes, requires, condition syntax/catalog coverage, and impossible self-entry conditions. Tests and `ppt_flow test` will exercise the validator. Runtime entry/exit checks will then consume the same parsed index, preventing validator/runtime drift.

Existing `_state/state.yaml` files need no structural migration beyond optional `evidence`; missing evidence maps are treated as empty.

### 5. Centralize standalone CLI termination through the existing error helper

`cli_error.mjs` will expose a small wrapper for executable entry points that:

- maps usage failures, known validation failures, and uncaught errors to stable codes;
- preserves human-readable diagnostics before the envelope;
- emits exactly one JSON envelope as the final non-empty stderr line;
- leaves imported-library behavior unchanged by applying only in `isMain` entry paths.

Every supported standalone script will use the wrapper or an equivalent shared helper. `ppt_flow` child wrapping remains in place, but a child will also be independently compliant when invoked directly.

### 6. Treat documentation coherence as executable policy

The documentation tests will scan all active Markdown rather than a small critical-file subset. They will validate:

- relative Markdown links;
- stale active production paths such as `image2-ppt`, `automation/`, or removed scripts;
- canonical render terms;
- resolved-mode-aware edit-chain language;
- version-delta semantics;
- canonical lifecycle vocabulary.

Historical statements in `reference/version-log.md` may be excluded only by explicit, narrow rules. Templates containing illustrative unresolved links may use an explicit marker rather than being silently ignored.

### 7. Separate the four hierarchy names

Documentation will consistently use:

- **Lifecycle Phase 0–4** for the end-to-end agent process;
- **Method Module 00–05** for `workflow/` directories;
- **Pipeline Stage 1–5** for executable production stages;
- **Playbook Node** for MD Controller steps.

This preserves existing folder names and command flags while removing competing meanings of “Phase.” `openspec/config.yaml` context will be updated as part of the same convergence so future proposals do not regenerate obsolete assumptions.

## Risks / Trade-offs

- [Risk] Stricter playbook validation reveals many existing invalid or manual conditions at once. → Migrate playbooks in one controlled pass and add fixtures before making validation a required test gate.
- [Risk] Renaming duplicate node IDs may affect in-progress decks whose `current_node` uses an old generic ID. → Add a small read/heal alias migration for known renamed IDs, scoped by active playbook, and preserve history.
- [Risk] Full documentation scans may flag historical or illustrative text. → Use explicit exclusion markers and keep the exclusion list narrow and test-visible.
- [Risk] Adding envelopes to child scripts can produce two envelopes when invoked through `ppt_flow`. → `ppt_flow` will treat child stderr as diagnostics and emit one parent envelope; tests will assert exactly one final envelope per process rather than forbidding an earlier child JSON line in captured output.
- [Risk] Manual evidence can become boilerplate. → Use a single parameterized `manual:<key>` convention and helper APIs instead of creating dozens of bespoke condition functions.
- [Trade-off] Global node uniqueness is less namespaced than qualified IDs, but avoids a broad state-schema migration and is sufficient for the current registered controller set.

## Migration Plan

1. Add parser/index/validator tests that reproduce the current silent-pass and duplicate-ID failures.
2. Implement canonical playbook parsing and validation without yet changing existing state files.
3. Rename duplicate nodes and normalize all playbook conditions, adding scoped aliases for resumable old state values.
4. Extend shared CLI failure handling and add subprocess contract tests for every standalone entry point.
5. Correct active documentation and `openspec/config.yaml`, then enable full link and semantic coherence tests.
6. Run `bundle_layout --self-check`, the complete Vitest suite, representative CLI failure probes, and an existing-deck resume audit.

Rollback is a normal code revert. No run-bundle generated artifacts are rewritten, and optional state evidence fields are backward-compatible.

## Open Questions

- Should manual evidence be stored as `nodes.<id>.evidence.<key>: true` or as a timestamped object? The initial implementation may use booleans while leaving the schema extensible.
- Should the playbook validator be exposed as a dedicated `ppt_flow` command or remain part of `ppt_flow test` and module APIs? The default recommendation is to avoid expanding the public 12-command surface unless operational use proves necessary.
