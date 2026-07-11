## ADDED Requirements

### Requirement: CONSTITUTION declares MD↔JS complementary robustness

`charter/CONSTITUTION.md` SHALL include a governing section titled approximately **MD↔JS 互补健壮性（Agentic 双轨）**, placed alongside the CLI failure-envelope rules, stating: MD Controllers / agents are smart but fuzzy producers; JS / CLI is the precise contract executor. Production-path format and schema defects (missing punctuation, wrong types, empty mappings where arrays are required, and similar template/state blemishes) SHALL be healed by the precise side when deterministic repair is possible, and/or actively fixed by the MD/agent before continuing. On write-back after heal, on-disk YAML/JSON SHALL be canonical so subsequent MD edits start from a clean template. Presenting "fix the YAML/JSON syntax" as the novice user's primary next step SHALL be forbidden. Irrecoverable failures SHALL still use the structured CLI JSON envelope; recoverable format problems SHALL be repaired first.

#### Scenario: Agent or human reads the constitution for agentic pairing

- **WHEN** a reader opens `charter/CONSTITUTION.md`
- **THEN** they find an explicit MD↔JS complementary-robustness section
- **AND** the section requires read-side tolerance, write-side canonicalization, and heal-before-asking-novices

#### Scenario: Contract points MD at heal-first behavior

- **WHEN** an agent reads `charter/AGENT_CONTRACT.md` §7 (runtime / CLI)
- **THEN** it finds a heal-first bullet for bad state/templates
- **AND** it is not directed to make the user manually fix YAML punctuation as the default path
