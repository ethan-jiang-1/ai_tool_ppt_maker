## MODIFIED Requirements

### Requirement: Registered playbooks pass machine validation

Every active controller/shared node SHALL pass the canonical node-specification validator. A checked-in normative manifest SHALL bind the expected controller/shared-node inventory, globally unique IDs, exact order, pipeline ownership, lifecycle/module values, includes/requires, conditions, decisions, and absence of Phase-4 execution. Registered controller script references SHALL resolve to the migrated Phase interfaces or direct executable owner paths. Validation SHALL not rely on a stale hard-coded count alone and SHALL reject old flat script paths.

#### Scenario: Final controller set validates

- **WHEN** the framework indexes all active playbooks
- **THEN** the normalized graph matches the checked-in manifest with no duplicates, missing references, cycles, unknown conditions, impossible gates, ownership conflicts, or stale script paths

#### Scenario: Controller references a moved direct CLI

- **WHEN** an active node names a direct executable that moved under a Phase
- **THEN** validation requires the canonical owner path
- **AND** rejects an old root alias

### Requirement: Playbook lifecycle and methodology metadata are explicit

Every registered node SHALL declare lifecycle Phase `0|1|2|3|4|5` and one exact method module `00-setup|01-content|02-visual-system|03-html-production|04-image2-refinement|05-iteration`. Phase 3 nodes own complete HTML delivery. Change 4's active index SHALL contain no lifecycle-4 or module-`04-image2-refinement` executable node, and the corresponding script directory SHALL remain README-only/non-executable. Legacy whole-page maintenance SHALL be Phase 5/module `05-iteration`, and provider channel probing SHALL remain Phase 0/module `00-setup` while invoking the migrated Phase 0 environment owner.

#### Scenario: HTML production node is unambiguous

- **WHEN** Agent inspects the create-deck production node
- **THEN** it declares lifecycle Phase 3 and method module `03-html-production`
- **AND** any JS reference resolves through the Phase 3 owner

#### Scenario: Unavailable Phase 4 is registered accidentally

- **WHEN** a Change-4 active node declares lifecycle 4, module `04-image2-refinement`, or a Phase-4 executable
- **THEN** playbook and architecture validation fail

#### Scenario: Legacy and probe routes keep distinct owners

- **WHEN** the controller graph resolves legacy maintenance and provider channel probing
- **THEN** legacy whole-page work remains Phase 5
- **AND** the diagnostic probe remains Phase 0 without becoming modern refinement
