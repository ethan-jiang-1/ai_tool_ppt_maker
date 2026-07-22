## MODIFIED Requirements

### Requirement: Init produces the run-bundle Agent diagnostic entry

`bundle_layout.mjs#initBundle` and therefore `ppt_flow init` SHALL generate deck-root `AGENTS.md` and `CLAUDE.md` as short pointers to `deck-guide.md`. The generated guide SHALL include the runtime consumer essentials owned by `node-specification`: parse the final CLI failure envelope; use supported structured `diagnostic.next`; preserve `program`/`args` boundaries; stop on `requires_human:true`; do not invent omitted lineage; edit source and rerun rather than hand-editing `_generated/`. The producer-owned `workflow/00-setup/template-deck-guide.md` SHALL carry the same essentials so the manual/Expert seed and `initBundle` output do not contradict each other.

The generated `deck-guide.md` SHALL also be the seeded **continuation card**: it SHALL contain the plain-language attach-to-a-new-chat invitation, the deck identity, the fixed `framework_relation: ../PPTMAKER_FRAMEWORK`, and a statement that the Agent obtains the current version and position from `_state/state.yaml` (`ppt_flow state`/`status`) automatically. Any version reference in the seeded card SHALL be the init-time value and SHALL be labeled non-authoritative. The seeded card SHALL NOT contain current node, next action, gate status, or digest. The producer-owned `workflow/00-setup/template-deck-guide.md` SHALL carry the same continuation-card content so the manual/Expert seed and `initBundle` output do not contradict each other.

`checkBundle` (and therefore `bundle_layout --check`, including `--structure-only`) SHALL remain read-only and zero-write. It SHALL validate the deck-root file set and structure only; it SHALL NOT verify how an Agent received a file or claim to prove chat-attachment provenance. Attachment provenance is resolved by the Agent entry route where the original local path exists, not by the checker.

The producer SHALL be the durable fix. Tests SHALL initialize a fresh temporary deck and assert all generated files and structure validity. Existing golden or user run bundles, including `deck_ai_sdlc_keynote`, SHALL NOT be hand-edited as part of this change. This change SHALL NOT alter the root/version README placement-map seeds. Because scaffold writes are create-if-absent, legacy bundles MAY gain the continuation-card content only through an explicit future migration/repair operation, not an incidental pipeline run.

#### Scenario: Fresh init is discoverable to agent-agnostic runtimes

- **WHEN** `initBundle` creates a temporary deck
- **THEN** root `AGENTS.md` and `CLAUDE.md` both route to `deck-guide.md`
- **AND** the guide contains diagnostic consumer essentials
- **AND** the framework `template-deck-guide.md` expresses the same essentials
- **AND** `--check --structure-only` passes

#### Scenario: Existing deck is not silently rewritten

- **WHEN** an existing run bundle lacks `AGENTS.md` or the continuation-card content
- **AND** normal status/build/pipeline commands run
- **THEN** they do not create or overwrite root Agent control files or rewrite `deck-guide.md`
- **AND** the deck remains valid under legacy compatibility

#### Scenario: This producer change does not refresh the golden deck

- **WHEN** this change is implemented and its diff is reviewed
- **THEN** no file under `deck_ai_sdlc_keynote/` is changed
- **AND** fresh-scaffold tests, not a hand-patched generated deck, prove the new control behavior

#### Scenario: Fresh init seeds the continuation card

- **WHEN** `initBundle` creates a temporary deck
- **THEN** the seeded `deck-guide.md` contains the attach-to-a-new-chat invitation, deck identity, and the fixed `../PPTMAKER_FRAMEWORK` relation
- **AND** it states the Agent obtains current version/position from `_state` automatically
- **AND** the framework `template-deck-guide.md` expresses the same continuation-card content
- **AND** the seeded card contains no authoritative current version, current node, next action, gate status, or digest

#### Scenario: Structure check does not verify attachment provenance

- **WHEN** `bundle_layout --check --structure-only` runs on a deck root
- **THEN** it validates the file set and structure without writing
- **AND** it does not claim to verify how an Agent received a file or resolve a chat attachment
