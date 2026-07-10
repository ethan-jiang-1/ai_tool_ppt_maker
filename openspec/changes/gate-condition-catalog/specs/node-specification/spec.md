## ADDED Requirements

### Requirement: Gate Conditions Catalog is defined in NODE-SPEC.md

`charter/NODE-SPEC.md` SHALL contain a Gate Conditions Catalog section listing every valid gate condition name, its type (FILESYSTEM/STATE/USER), its check logic, and its implementation. All playbook frontmatter entry/exit conditions SHALL use names from this catalog.

#### Scenario: Developer looks up a condition

- **WHEN** a developer opens `charter/NODE-SPEC.md`
- **THEN** they see the complete conditions catalog with standard names

### Requirement: CONDITIONS registry is implemented in state.mjs

`scripts/lib/state.mjs` SHALL export a `CONDITIONS` object mapping each standard condition name to an executable check function. Parameterized conditions (e.g., `node_completed:<name>`) SHALL be supported via function factories.

#### Scenario: Condition is checked

- **WHEN** `CONDITIONS['run_bundle_exists'](state, ctx)` is called
- **THEN** it returns `true` if the deck directory exists on disk
- **AND** `false` otherwise

### Requirement: checkEntry validates entry conditions

`checkEntry(nodeName, playbookDir, state, ctx)` SHALL parse the playbook MD file, extract the entry conditions from the node's frontmatter, resolve each against the CONDITIONS registry, and return `{ pass: boolean, missing: string[] }`.

#### Scenario: Entry gate fails with missing conditions

- **WHEN** `checkEntry('wave0', playbookDir, state)` is called and `seed-topics` is pending
- **THEN** it returns `{ pass: false, missing: ['node_completed:seed-topics'] }`

#### Scenario: Entry gate passes when all conditions met

- **WHEN** all required nodes are completed and files exist
- **THEN** `checkEntry('wave0', playbookDir, state)` returns `{ pass: true, missing: [] }`

### Requirement: checkExit validates exit conditions

`checkExit(nodeName, playbookDir, state, ctx)` SHALL work identically to `checkEntry` but parse the `exit` field from the node's frontmatter.

#### Scenario: Exit gate passes when conditions met

- **WHEN** wave0 exit conditions are satisfied
- **THEN** `checkExit('wave0', playbookDir, state)` returns `{ pass: true }`
