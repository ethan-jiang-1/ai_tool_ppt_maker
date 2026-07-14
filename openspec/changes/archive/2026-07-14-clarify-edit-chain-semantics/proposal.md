## Why

The framework uses `Chain A` / `Chain B` / `Chain C` as legacy internal labels without explaining their execution meaning. This makes the iteration model difficult for new maintainers to learn, encourages incorrect text/visual/notes shortcuts, and obscures that structural versioning is an outer workflow which is followed by one or more artifact-refresh paths.

## What Changes

- Establish three English canonical refresh-path names:
  - **Header Text & Style Refresh** — the former Chain A path for changing KICKER/TITLE/SUBTITLE text or their Stage-3-owned font, color, spacing, and position on resolved `body+header-lock` slides, without changing the raw-image contract.
  - **Generated Image Rebuild** — the former Chain B path whenever a generated slide image is stale.
  - **Notes-Only Refresh** — the former Chain C path for speaker-note-only changes.
- Define **Structural Versioning Path** as a separate outer path for add/delete/reorder changes. It creates a clean version first; affected slides then use the appropriate refresh path. Structural versioning is not a fourth peer refresh chain.
- Make English the only canonical naming layer. Chinese documentation MAY explain an English term at its first authoritative definition, but the Chinese explanation is not a second formal name.
- Keep A/B/C/Structural only as controlled compatibility aliases in an explicit terminology registry and historical material. Operational guidance, playbooks, tests, and code comments migrate to the English canonical names instead of perpetually pairing both forms.
- Define the classification principle explicitly: resolve content ownership, identify the stale downstream artifact, and select the smallest safe refresh path. A user intent such as `edit-text` is an entry route, not an execution-path identity.
- Treat header safe-zone height, render-mode switches, and any other change that alters the Stage 2 prompt/image contract as Generated Image Rebuild rather than Header Text & Style Refresh.
- Correct adjacent routing contradictions exposed by that principle: generated body text/data/case changes require Generated Image Rebuild; structural additions require Structural Versioning Path before affected-page rebuilding.
- Clarify that Generated Image Rebuild requires actual forced regeneration when an existing selected image is stale. Raw `unified_pipeline --only` does not imply `--force-images`; the public `ppt_flow refresh --kind visual` route adds force for its selected scope.
- Preserve all current CLI commands, Stage behavior, render-mode resolution, pilot/header-review gates, versioning behavior, and generated-artifact ownership. This is not a breaking runtime change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `framework-charter`: Make English refresh-path terminology, the controlled legacy boundary, artifact-ownership classification, and structural layering constitutional and consistent across active guidance.
- `pipeline-orchestration`: Name the existing Stage subsets semantically and define Generated Image Rebuild as a logical reviewed workflow without changing Stage execution or CLI arguments.
- `playbook-execution`: Separate intent routing, structural versioning, and resolved artifact-refresh paths across all four iteration controllers.
- `commands-reference`: Replace text/visual/notes shortcuts with descriptive user intents plus ownership-aware resolution, including case/data examples.
- `cli-surface`: Replace legacy-only title-refresh language with the English canonical path names while preserving selectors, review envelopes, and reviewed-image reuse behavior.

## Impact

- Direct legacy terminology appears in at least 29 active files outside historical version logs: 18 framework Markdown files, two framework `.mjs` files, five main specs, two tests, root `AGENTS.md`, and `openspec/config.yaml`.
- Additional semantic-adjacency review is required for user routing, all four iteration playbooks, the run-bundle guide template, Stage 2 force/skip documentation, and reference pipeline guidance. The complete active review surface is approximately 40 files, although not every file necessarily needs an edit.
- Five existing capability specs require full modified requirements; adding a new requirement beside old legacy-only requirements is insufficient.
- No dependency, data model, CLI command, state schema, or runtime pipeline change is introduced.
- Archived OpenSpec changes and genuinely historical version-log records remain unchanged.
