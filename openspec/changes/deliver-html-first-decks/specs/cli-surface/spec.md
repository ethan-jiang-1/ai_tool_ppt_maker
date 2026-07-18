## ADDED Requirements

### Requirement: HTML renderer and compositor CLIs are registered envelope-compliant executables

Direct `stage2_render_html.mjs` and `stage3_compose_slides.mjs` SHALL be Node ESM registered executables with side-effect-free `--help`, canonical run-dir/manifest arguments, write-free `--dry-run`, deterministic stdout, and the existing one-final-JSON failure envelope. They SHALL accept no provider/base-url/model/style-master/browser-channel/executable override. Diagnostics SHALL identify bounded slide/field/box/artifact/runtime phases without absolute paths, raw HTML, source prose, browser stack, or asset bytes.

#### Scenario: Renderer CLI help is audited

- **WHEN** executable inventory runs `--help`
- **THEN** each CLI exits zero without creating files or launching Chromium

#### Scenario: Pixel overflow fails

- **WHEN** direct composition detects overflow
- **THEN** stderr ends with one `FAILED` envelope carrying slide/field/measurement evidence and a local source/layout repair action

### Requirement: Public HTML build and refresh commands route without provider flags

`ppt_flow validate`, preview, build, status, approve, slides, and refresh SHALL probe the source marker before branch-specific argument/readiness handling. HTML-first build SHALL use the local Stages 1-5 adapter. HTML refresh SHALL expose Local Slide Rebuild, Local Deck Rebuild, Notes-Only Refresh, and structural materialization through existing command ownership or explicit closed `--kind` values; it SHALL reject provider flags and never delegate to legacy image generation/style-master/header approval. Markerless behavior and flags remain backward compatible.

#### Scenario: HTML build without credentials

- **WHEN** a valid gated HTML-first run invokes `ppt_flow build`
- **THEN** it completes local delivery without reading Image2 environment variables

#### Scenario: Legacy-only flag targets HTML

- **WHEN** an HTML refresh/build receives `--force-images`, provider URL, or style-master option
- **THEN** CLI returns `USAGE` before remote prerequisite resolution or writes

### Requirement: HTML visual approval is exact-preview-hash bound

The public visual approval path SHALL accept a required exact review-plan hash for HTML-first runs and SHALL verify current preview manifest/bytes/receipts before writing pipeline-specific gate evidence. Legacy visual/header approval syntax and evidence remain isolated. A stale/missing hash SHALL fail with a human-review next action and no gate mutation.

#### Scenario: User approves current HTML preview

- **WHEN** the supplied review-plan hash matches current shown artifacts
- **THEN** `approve ... visual` records current `html-visual-review` evidence and visual gate status

#### Scenario: Preview changed after showing

- **WHEN** the supplied hash no longer matches current source/config/artifacts
- **THEN** approval fails without changing the gate

### Requirement: Legacy-to-HTML migration has preview and exact apply commands

`ppt_flow migrate-html <run-dir> preview` SHALL validate a version-local candidate source/control transaction, render a full local comparison, and emit an exact plan hash without publishing a visible version. `ppt_flow migrate-html <run-dir> apply --plan-hash <sha>` SHALL accept only a current preview hash and atomically publish the staged clean vNext after target revalidation/rendering. Both commands SHALL make zero provider calls; unknown/legacy-generation flags SHALL be usage errors.

#### Scenario: Migration preview runs

- **WHEN** an Agent has prepared a complete candidate under canonical migration scratch
- **THEN** preview emits source/comparison evidence and a plan hash while the visible version set remains unchanged

#### Scenario: Bare migration apply is rejected

- **WHEN** apply omits or mismatches the exact plan hash
- **THEN** CLI fails before hidden staging or visible version publication

### Requirement: HTML and workflow migration diagnostics remain producer-owned

New reason kinds for renderer preparation, browser measurement, manifest drift, visual-review staleness, pipeline ownership, and state replacement SHALL be emitted only by the responsible JS producer through `cli_error.mjs`. MD/node specs SHALL consume category/reason/next semantics without copying the full envelope schema or interpreting shell prose.

#### Scenario: Browser error crosses ppt_flow boundary

- **WHEN** a delegated renderer fails
- **THEN** `ppt_flow` preserves one normalized actionable parent diagnostic
- **AND** does not append raw child stderr or a second JSON envelope
