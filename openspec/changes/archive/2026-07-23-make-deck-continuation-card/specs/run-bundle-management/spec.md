## ADDED Requirements

### Requirement: Init creates an optional portable run-bundle locator

`initBundle` and `ppt_flow init` SHALL create `<deck-root>/RUN_BUNDLE.md` only if it is absent.
The producer SHALL write a closed `pptmaker-run-bundle-v1` frontmatter record containing distinct
canonical physical absolute `deck_root` and `framework_root` values measured with `realpath`
after init, plus the normalized POSIX relative `framework_relation` measured between those same
roots. The relation SHALL be nonempty, nonabsolute, and free of redundant normalization. The
body SHALL give a plain-language handoff invitation, state that current workflow facts are
state/status-owned, and warn that the local locator paths can reveal local filesystem names.
Before creating any deck file, init SHALL resolve the canonical framework root and verify the
same framework sentinels required by locator resolution. It SHALL measure the deck physical root
after creating the root but before rendering the card. A failed root proof SHALL create no
`RUN_BUNDLE.md` and SHALL not leave a partial locator manifest.

The manifest is static and local-only: it SHALL not include current version/mode/node/gate,
digest, command menu, or authority. `deck-guide.md` SHALL continue to receive its operating
guide seed rather than this locator content. Existing cards and guides are create-if-absent;
status, build, and structure check never rewrite either. `checkBundle --check <run-dir>
--structure-only` remains a zero-write exact-version check and neither validates attachment
provenance nor selects a deck or version.

#### Scenario: External deck receives direct local anchors
- **WHEN** init creates a legal `deck_*` outside the framework tree
- **THEN** `RUN_BUNDLE.md` names that exact absolute deck root and framework root
- **AND** its relation is measured rather than hard-coded

#### Scenario: Existing bundle is not silently migrated
- **WHEN** an existing bundle has no card or has a user-owned existing card
- **THEN** ordinary commands retain its bytes unchanged
- **AND** legacy structure validation remains compatible

#### Scenario: Init cannot prove its framework root
- **WHEN** init receives a framework path that cannot be canonicalized or lacks a required
  framework sentinel
- **THEN** init fails before it creates any deck file
- **AND** it creates no `RUN_BUNDLE.md` or partial locator manifest

### Requirement: Locator resolution is one static deep module

`run_bundle_locator.mjs` SHALL own the static proof of a supplied `RUN_BUNDLE.md` and expose one
zero-write resolver taking manifest bytes plus optional original-card, explicitly requested deck,
and explicitly requested framework paths. It SHALL return either resolved canonical physical deck
and framework directories with their bounded source labels, or a bounded `guide` with one subject
(`manifest`, `deck_root`, or `framework_root`) and one machine-stable failure code:
`manifest_invalid`, `deck_root_unavailable`, `deck_root_unverified`, `deck_root_conflict`,
`framework_root_unavailable`, `framework_root_unverified`, or `framework_root_conflict`.

The module SHALL parse exactly one closed four-scalar-field manifest document; reject duplicate
keys, aliases, extra documents, unknown fields, malformed/noncanonical absolute roots, and an
invalid normalized POSIX relation; and compare a supplied card to the root card by the canonical
four-field record, not prose or newline bytes. It SHALL verify regular non-symlink cards,
delegate root-control validation to `bundle_layout.mjs`, and verify these regular-file framework
sentinels: `scripts/ppt_flow.mjs`, `scripts/shared/run-bundle/bundle_layout.mjs`, and
`scripts/shared/state/state.mjs`. It SHALL not read or parse state, select/enumerate a version,
run structure validation, write a file, add a CLI, or search paths.

Candidate order SHALL be declared deck root, then original-card parent only after the declared
root is unavailable, then a human-explicit requested deck root. A conflicting present root card
SHALL stop with a deck-root guide. With the declared deck root, the declared framework root and
relation target SHALL agree whenever both are accessible; a stale declared framework root may use
the relation, then an explicit requested framework root is the final candidate if neither is
verified. With a recovered deck root, the relation SHALL not be reinterpreted; a verified declared
framework root or an explicit requested framework root is required. This preserves deck-only and
framework-only relocation recovery without nearby-path inference. A `*_conflict` guide SHALL ask
for a current `RUN_BUNDLE.md` or repair of the conflicting local card/root and SHALL require a
fresh resolver invocation; it SHALL NOT treat another path as an override. An unavailable or
unverified guide SHALL request only the named explicit root or local repair.

#### Scenario: Byte-only card resolves from unrelated working directory
- **WHEN** an Agent passes only manifest bytes while its working directory is unrelated and the
  declared local roots remain accessible
- **THEN** the module returns those verified physical deck and framework directories
- **AND** it neither observes state nor discovers paths outside its explicit candidates

#### Scenario: Card record conflicts with a present declared root
- **WHEN** the declared deck path is accessible but its regular root `RUN_BUNDLE.md` has a
  different canonical locator record
- **THEN** the module returns a bounded `deck_root` guide
- **AND** it does not use the original-card parent, requested root, relation, state, or a search

#### Scenario: Deck-only relocation retains a verified framework anchor
- **WHEN** the declared deck root is unavailable, an original-card parent verifies the same
  record, and the declared framework root remains valid
- **THEN** the module returns the card-parent deck and declared framework roots
- **AND** it does not treat the old measured relation as a conflict or a search instruction

#### Scenario: Conflicting framework anchors cannot be overridden by a path
- **WHEN** the declared deck root is verified but its accessible direct framework root and
  accessible relation target resolve to different valid framework roots
- **THEN** the module returns `framework_root_conflict`
- **AND** it requests the current card or repair before a fresh resolution rather than using a
  requested framework path as an override

## MODIFIED Requirements

### Requirement: Init produces the run-bundle Agent diagnostic entry

`bundle_layout.mjs#initBundle` and therefore `ppt_flow init` SHALL generate deck-root
`AGENTS.md` and `CLAUDE.md` as short pointers first to `RUN_BUNDLE.md` for local location and
then to `deck-guide.md` for operating rules. The generated root `README.md` SHALL tell a human to
give `RUN_BUNDLE.md` to a local repository Agent. The generated guide SHALL include the runtime
consumer essentials owned by `node-specification`: parse the final CLI failure envelope; use
supported structured `diagnostic.next`; preserve `program`/`args` boundaries; stop on
`requires_human:true`; do not invent omitted lineage; edit source and rerun rather than
hand-editing `_generated/`. The producer-owned `workflow/00-setup/template-deck-guide.md` SHALL
carry the same essentials and retain its operating-guide role so the manual/Expert seed and
`initBundle` output do not contradict each other.

The producer SHALL be the durable fix. Tests SHALL initialize a fresh temporary deck and assert
all generated files and structure validity. Existing golden or user run bundles, including
`deck_ai_sdlc_bpm_keynote`, SHALL NOT be hand-edited as part of this change. This change SHALL NOT
alter the root/version README placement-map seeds except for the concise handoff route above.
Because scaffold writes are create-if-absent, legacy bundles MAY gain the new control only through
an explicit future migration/repair operation, not an incidental pipeline run.

#### Scenario: Fresh init is discoverable to agent-agnostic runtimes

- **WHEN** `initBundle` creates a temporary deck
- **THEN** root `AGENTS.md` and `CLAUDE.md` both route to `RUN_BUNDLE.md` then `deck-guide.md`
- **AND** the README identifies `RUN_BUNDLE.md` as the human handoff file
- **AND** the guide contains diagnostic consumer essentials
- **AND** the framework `template-deck-guide.md` expresses the same essentials
- **AND** `--check --structure-only` passes

#### Scenario: Existing deck is not silently rewritten

- **WHEN** an existing run bundle lacks `AGENTS.md` or `RUN_BUNDLE.md`
- **AND** normal status/build/pipeline commands run
- **THEN** they do not create or overwrite root Agent control files
- **AND** the deck remains valid under legacy compatibility

#### Scenario: This producer change does not refresh the golden deck

- **WHEN** this change is implemented and its diff is reviewed
- **THEN** no file under `deck_ai_sdlc_bpm_keynote/` is changed
- **AND** fresh-scaffold tests, not a hand-patched generated deck, prove the new control behavior
