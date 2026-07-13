## ADDED Requirements

### Requirement: Init produces the run-bundle Agent diagnostic entry

`bundle_layout.mjs#initBundle` and therefore `ppt_flow init` SHALL generate deck-root `AGENTS.md` and `CLAUDE.md` as short pointers to `deck-guide.md`. The generated guide SHALL include the runtime consumer essentials owned by `node-specification`: parse the final CLI failure envelope; use supported structured `diagnostic.next`; preserve `program`/`args` boundaries; stop on `requires_human:true`; do not invent omitted lineage; edit source and rerun rather than hand-editing `_generated/`. The producer-owned `workflow/00-setup/template-deck-guide.md` SHALL carry the same essentials so the manual/Expert seed and `initBundle` output do not contradict each other.

The producer SHALL be the durable fix. Tests SHALL initialize a fresh temporary deck and assert all generated files and structure validity. Existing golden or user run bundles, including `deck_ai_sdlc_keynote`, SHALL NOT be hand-edited as part of this change. This change SHALL NOT alter the root/version README placement-map seeds, so the existing README golden-sample requirement remains satisfied but does not trigger a deck refresh here. Because scaffold writes are create-if-absent, legacy bundles MAY gain the new control only through an explicit future migration/repair operation, not an incidental pipeline run.

#### Scenario: Fresh init is discoverable to agent-agnostic runtimes

- **WHEN** `initBundle` creates a temporary deck
- **THEN** root `AGENTS.md` and `CLAUDE.md` both route to `deck-guide.md`
- **AND** the guide contains diagnostic consumer essentials
- **AND** the framework `template-deck-guide.md` expresses the same essentials
- **AND** `--check --structure-only` passes

#### Scenario: Existing deck is not silently rewritten

- **WHEN** an existing run bundle lacks `AGENTS.md`
- **AND** normal status/build/pipeline commands run
- **THEN** they do not create or overwrite root Agent control files
- **AND** the deck remains valid under legacy compatibility

#### Scenario: This producer change does not refresh the golden deck

- **WHEN** this change is implemented and its diff is reviewed
- **THEN** no file under `deck_ai_sdlc_keynote/` is changed
- **AND** fresh-scaffold tests, not a hand-patched generated deck, prove the new control behavior
