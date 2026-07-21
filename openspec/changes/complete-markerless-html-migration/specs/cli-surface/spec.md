## MODIFIED Requirements

### Requirement: CLI surface preserves command names

The `ppt_flow` CLI SHALL expose exactly 15 top-level commands: the existing `doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, `state`, `slides`, and `migrate-html`, plus `image2`. Existing command arguments remain compatible. `image2` SHALL expose only closed `plan`, `authorize`, `generate`, `accept`, `use-html`, `cleanup`, and unknown-submit resolution operations for marked HTML-first runs; it is the sole modern refinement CLI entry. `migrate-html` SHALL expose only closed `prepare`, `preview`, and `apply` operations and SHALL not mutate a source version in place.

#### Scenario: Help lists the complete surface

- **WHEN** `ppt_flow --help` runs
- **THEN** all 15 command names, including `image2`, are listed once

#### Scenario: Existing init invocation remains valid

- **WHEN** Agent runs `ppt_flow init deck_demo --deck-type keynote --style dark-executive`
- **THEN** a run bundle is created using the current HTML-first default contract

#### Scenario: Migration preparation is advertised without adding a top-level command

- **WHEN** Agent reads `ppt_flow migrate-html --help`
- **THEN** help lists `prepare --preset <name>`, `preview`, and `apply` as the closed migration operations
- **AND** the top-level command inventory remains 15

### Requirement: The complete ppt_flow command surface has return-audit coverage

The command-return registry SHALL cover exactly the 15 registered top-level commands, including `image2`. Every command/subcommand/closed repair or evidence operation SHALL register applicable success/usage/validation/gate/conflict/stale/commit/internal return categories or an explicit not-applicable reason. `state --recover-gate-journal` SHALL cover mutual-exclusion/invalid-token/too-young/token-drift/active-owner/forbidden-SHA/successful-abort/mirror-complete/cleanup/exact-reset-yield returns and prove no approval creation. `state --record-delivery-review` SHALL cover invalid decision, required/forbidden reason combinations, reason control/UTF-8-size validation, markerless rejection, missing/stale/current evidence, journal/reset conflict, each typed decision success, and unsupported evidence overrides. `refresh --kind reset-html-production` SHALL cover explicit-versus-default flag detection, exact-version confirmation, markerless/unusable-state/gate-journal/reset-CAS/metadata-CAS/unsafe-owner conflicts, gate-journal race yield, new reset, live/waiting/dead/uncertain/invalid owner matrices at exact 60000/300000-ms boundaries, competing takeover CAS, same-reset resume, idempotent completed retry only without current-epoch authority, absent-owner no-reset-needed versus authority-loss epoch rotation, deletion failure with retained fence, and successful completion without approval creation. `slides` SHALL retain its operation-specific audit; `migrate-html prepare|preview|apply` SHALL cover preset usage/unknown-preset validation, markerless and marked-source classification, isolated first preparation, matching idempotent preparation, candidate/source conflict, no provider/source/visible-version mutation, bare preparation guide, incomplete authoring guide, complete/degraded preview, exact mode/hash acknowledgement, drift, decline, apply-journal mutual exclusion, automatic/confirmed recovery age-token-owner matrices, absent-target owned cleanup/full rerender, exact-target idempotent completion, conflicting target/foreign path denial, and zero-provider failures. Its closed refinement operations SHALL audit help, markerless rejection, current-delivery eligibility, plan/authorization drift, duplicate or unknown attempt handling, candidate identity, promotion conflict/recovery, cleanup ambiguity, and success; every applicable category shall have an explicit case or not-applicable reason. Set mismatch SHALL fail.

#### Scenario: Migrate command is not audited

- **WHEN** `migrate-html` is registered without prepare, preview, or apply return cases
- **THEN** return audit fails and names the missing command/subcommands

#### Scenario: Image2 command is not audited

- **WHEN** `image2` is registered without its closed operation return cases
- **THEN** the return audit fails and names the missing command/operation

### Requirement: Legacy-to-HTML migration has preview and exact apply commands

`ppt_flow migrate-html <run-dir> prepare --preset <name>` SHALL accept only a shipped preset name and a markerless source version. It SHALL resolve the source through the migration owner, create or verify the complete candidate scaffold only under `_scratch/html-migration/projected-run/`, and return its bounded authoring checklist and candidate location. It SHALL not modify the source slide specifications, source controls, deck-root state/metadata, visible version set, or provider state, and it SHALL not read provider credentials. A matching existing preparation SHALL be idempotent; an existing authored candidate whose source receipt or preset conflicts SHALL return `CONFLICT` before overwriting it. An existing loose migration candidate may be read only by this explicit preparation compatibility path and shall never be made authoritative by preview.

`ppt_flow migrate-html <run-dir> preview` SHALL first resolve the same projected candidate without writing. For a valid markerless source with no candidate it SHALL return a successful `preparation_required` guide that contains the closed prepare syntax, available preset names, and candidate location; for a prepared but incomplete candidate it SHALL return a successful `authoring_required` guide with bounded slide/field work. Neither guide SHALL create a candidate, plan hash, rendered comparison, source mutation, or visible version. A malformed source, unsafe/colliding candidate, unresolved identity, or active transaction owner SHALL remain a hard failure through the existing producer-owned diagnostic. A complete candidate SHALL validate a version-local transaction, render the complete proposed HTML deck/contact sheet, and emit exact `old_side_mode: verified-current|degraded-missing|degraded-stale`, anticipated target version, and exact plan hash without publishing a version. Only `verified-current` may include old pixels. Degraded modes SHALL show diagnosis/placeholder, no stale pixels/parity claim, and a separately authorized legacy-maintenance next action; complete preview SHALL succeed locally.

Normal `ppt_flow migrate-html <run-dir> apply --plan-hash <sha> --old-side-mode <mode>` SHALL accept only the current exact hash/mode after human acknowledgement and an exact active source `migrate-import` apply execution, bind that execution ID into journal/target receipt, recheck target/input/evidence, and publish only when hidden-target ordered composition/final PNG/contact-sheet SHAs exactly match preview. Closed recovery form `ppt_flow migrate-html <run-dir> apply --recover-journal <owner-token>` SHALL be mutually exclusive with plan/mode flags, require exact 64-lowercase-hex token plus the human-confirmed/age/active-owner rules, and apply only the bounded migration-apply recovery matrix. A recoverable/uncertain journal SHALL be reported with opaque token; the Agent carries it without requiring user transcription. Prepare, preview, normal apply, and recovery SHALL make zero provider calls; unknown/legacy-generation/evidence/path flags, invalid operation-specific flag combinations, and a missing prepare preset SHALL be usage errors before writes.

#### Scenario: Preparation creates only an isolated candidate

- **WHEN** an Agent runs `migrate-html <markerless-run> prepare --preset dark-executive`
- **THEN** the result identifies a prepared projected candidate and its authoring checklist
- **AND** directory diff shows writes only below that run's `_scratch/html-migration/projected-run/`
- **AND** no source version, visible vNext, state/metadata authority, provider request, or credential lookup is created

#### Scenario: Preview guides a bare markerless source

- **WHEN** a valid markerless run with no projected candidate invokes `migrate-html preview`
- **THEN** it returns `preparation_required` with the exact prepare grammar and bounded preset/candidate guidance
- **AND** it does not silently call prepare or emit a plan hash

#### Scenario: Preview guides incomplete Agent authoring

- **WHEN** a projected candidate has missing structured-body or required authored fields
- **THEN** preview returns `authoring_required` with the affected stable slide IDs and required fields
- **AND** it leaves authored candidate files unchanged

#### Scenario: Migration preview runs

- **WHEN** an Agent has prepared and completed a candidate under canonical migration scratch
- **THEN** preview emits source/comparison evidence and a plan hash while the visible version set remains unchanged

#### Scenario: Bare migration apply is rejected

- **WHEN** apply omits or mismatches the exact plan hash
- **THEN** CLI fails before hidden staging or visible version publication

#### Scenario: Migration apply has no matching active execution

- **WHEN** normal apply finds no exact source `migrate-import` execution bound to the confirmed plan/mode
- **THEN** it fails before journal/reservation/staging creation and points to the controller entry

#### Scenario: Migration recovery flags are mixed

- **WHEN** apply receives `--recover-journal` together with plan hash or old-side mode
- **THEN** it returns `USAGE` before journal/staging/target mutation

#### Scenario: Cross-host migration recovery is confirmed

- **WHEN** the Controller supplies the exact old-enough token after the human confirms no migration apply is active
- **THEN** apply performs only the bound recovery matrix and creates no review approval
