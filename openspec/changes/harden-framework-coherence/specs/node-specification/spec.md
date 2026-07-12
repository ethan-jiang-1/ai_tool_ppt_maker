## MODIFIED Requirements

### Requirement: Node frontmatter defines entry and exit gates

Every registered node SHALL have one canonical YAML declaration with at minimum: `node` (globally unique kebab-case name), `entry` (list of conditions that must be true before starting), and `exit` (list of conditions that must be true before marking completed). An ordered playbook MAY declare nodes in fenced YAML blocks within its Markdown controller; a standalone shared node MAY declare the same schema in document frontmatter. The runtime parser and validator SHALL support exactly these declared forms and SHALL NOT discover nodes by substring search.

#### Scenario: Agent checks entry gate before executing a node

- **WHEN** Agent begins executing node `wave0` in playbook `create-deck`
- **THEN** the parser resolves the exact `wave0` declaration from the playbook index
- **AND** Agent verifies all `entry` conditions are met
- **AND** if any condition fails, Agent reports the missing condition and does NOT proceed

#### Scenario: Agent checks exit gate before marking node complete

- **WHEN** Agent finishes the steps in node `wave0`
- **THEN** it verifies all `exit` conditions are met
- **AND** if any condition fails, Agent stays in the node until conditions are satisfied

#### Scenario: Duplicate node identifier is rejected

- **WHEN** two registered playbooks declare the same node identifier
- **THEN** playbook validation fails and reports both source files
- **AND** node lookup does not silently select the first textual match

### Requirement: checkEntry validates entry conditions

`checkEntry(nodeName, playbookDir, state, ctx)` SHALL resolve the exact node declaration from the canonical playbook index, extract its entry conditions, resolve each against the CONDITIONS registry, and return `{ pass: boolean, missing: string[], unknown: string[] }`. A node that is absent, duplicated, or structurally invalid SHALL NOT return `pass: true`. Conditions not found in the catalog SHALL appear in `unknown` and SHALL fail the check.

#### Scenario: Entry gate fails with missing conditions

- **WHEN** `checkEntry('wave0', playbookDir, state)` is called and the required content gate is pending
- **THEN** it returns `pass: false` with the gate condition in `missing`
- **AND** `unknown` is empty

#### Scenario: Embedded declaration is actually parsed

- **WHEN** a node is declared in a fenced YAML block inside a playbook controller
- **THEN** `checkEntry` evaluates that block's declared conditions
- **AND** it does not return a vacuous pass merely because document frontmatter lacks `entry`

#### Scenario: Unknown condition blocks execution

- **WHEN** a condition name is neither in the catalog nor a valid parameterized condition
- **THEN** it appears in the `unknown` array
- **AND** `pass` is false

### Requirement: checkExit validates exit conditions

`checkExit(nodeName, playbookDir, state, ctx)` SHALL resolve the same canonical node declaration as `checkEntry`, parse the `exit` field, and evaluate deterministic and persisted manual-evidence conditions. It SHALL NOT mark an absent, duplicated, unparsed, or unknown-condition node as passed.

#### Scenario: Exit gate passes when conditions met

- **WHEN** wave0 exit conditions and required manual evidence are satisfied in state
- **THEN** `checkExit('wave0', playbookDir, state)` returns `{ pass: true, missing: [], unknown: [] }`

#### Scenario: Missing artifact blocks exit

- **WHEN** a production node declares `pptx_generated` and no PPTX exists
- **THEN** `checkExit` returns `pass: false`
- **AND** `missing` includes `pptx_generated`

## ADDED Requirements

### Requirement: Playbook index validates references and impossible gates

The node-specification implementation SHALL expose a validation path that indexes every registered playbook and shared node, verifies globally unique node IDs, resolves `includes` and `requires`, validates entry/exit syntax, and rejects an entry condition that requires the same node to already be completed.

#### Scenario: Self-completed entry is rejected

- **WHEN** node `instantiation` declares `entry: [node_status:instantiation:completed]`
- **THEN** validation fails with an impossible-entry diagnostic

#### Scenario: Missing required node is rejected

- **WHEN** a node declares `requires: [missing-node]`
- **THEN** validation fails and names the requiring node and missing ID

### Requirement: Manual judgment conditions use persisted evidence

Subjective human-judgment conditions SHALL use the parameterized form `manual:<evidence-key>`. The condition SHALL pass only when the current node's persisted state contains affirmative evidence for that key. Free-form prose conditions SHALL NOT silently pass as manual judgment.

#### Scenario: Unrecorded manual review blocks exit

- **WHEN** a visual review node declares `manual:user-reviewed-artifact`
- **AND** no matching evidence is persisted under that node
- **THEN** `checkExit` returns the condition in `missing`

#### Scenario: Persisted manual review satisfies exit

- **WHEN** the agent opens the artifact, receives the user decision, and records `user-reviewed-artifact` evidence for the current node
- **THEN** the matching manual condition passes on a fresh state read
