## ADDED Requirements

### Requirement: Run Bundle locator binds one exact local Harness

A current Run Bundle locator SHALL use schema `pptmaker-run-bundle-v2` and
contain exactly the scalar fields `schema`, `deck_root`, `harness_root`, and
`harness_relation`. `deck_root` and `harness_root` SHALL be canonical absolute
local paths to distinct roots, and `harness_relation` SHALL be the normalized
relative relation from the Deck root to that exact Harness root. The declared
root and relation SHALL resolve to the same verified Harness root; the locator
SHALL not carry `harness_id`, a release, a Git revision, a content hash, or a
portable cross-Harness identity.

#### Scenario: A new locator describes a local Harness binding

- **WHEN** a current Run Bundle locator is rendered
- **THEN** it contains only the four v2 binding fields and resolves both binding
  references to the same local `ppt_maker_harness/` root
- **AND** it contains no Framework-named field or portability identifier

### Requirement: Run Bundle placement remains external to its Harness

One Deck SHALL have one Run Bundle, which MAY be placed in any local directory
outside its Harness root. The Bundle SHALL bind only to the exact local Harness
root that created it. Relocating either root or presenting a different Harness
SHALL not silently rebind, select a fallback root, or establish portability.

#### Scenario: A different Harness is presented for a current Bundle

- **WHEN** a locator's declared and relation-derived Harness roots do not match
  the exact local Harness binding
- **THEN** the locator does not resolve a Harness for that Bundle
- **AND** it does not substitute a requested root or scan for another Harness

### Requirement: Run Bundle lessons remain bundle-local

`_lessons/` SHALL retain only non-secret operational knowledge for its one
Run Bundle. Locator validation and Harness operation SHALL not promote, merge,
or infer a global or cross-session memory from those files.

#### Scenario: A Bundle contains local lessons

- **WHEN** an Agent opens a current Bundle with `_lessons/`
- **THEN** it may read those lessons before guessing about that Deck
- **AND** it does not treat them as Harness-wide knowledge or workflow state
