## MODIFIED Requirements

### Requirement: Node frontmatter defines entry and exit gates

Every registered node SHALL declare globally unique kebab-case `node`, `lifecycle_phase` in exact set `0|1|2|3|4|5`, `method_module` in exact set `00-setup|01-content|02-visual-system|03-html-production|04-image2-refinement|05-iteration`, ordered `requires`, deterministic `entry`, and `exit`; routing gates SHALL declare unique allowed decisions. Fenced controller YAML and standalone shared-node frontmatter remain the only forms. Legacy single `phase` and removed module names `01-visual|02-content|03-prompts|04-production` SHALL fail validation with migration guidance. During Change 3, the active index SHALL reject any executable lifecycle-4/module-`04-image2-refinement` node.

#### Scenario: Production node uses final metadata

- **WHEN** the HTML production node is indexed
- **THEN** it resolves to lifecycle 3/module `03-html-production`

#### Scenario: Removed module remains in active frontmatter

- **WHEN** a node declares `method_module: 04-production`
- **THEN** validation fails and names `03-html-production` as the final owner

#### Scenario: Phase-4 execution appears too early

- **WHEN** a Change-3 active playbook registers lifecycle 4
- **THEN** validation fails because the directory is README-only unavailable

### Requirement: State schema is explicitly versioned and migrated

`state.yaml` SHALL use schema version 3 while preserving whole-workflow `started_at`, active execution IDs/times, controller working-set rules, stack semantics, typed records, atomic writes, and reserved system records. Read/heal SHALL classify the canonical source marker and apply an ordered, idempotent v1/v2->v3 migration covering final lifecycle/module enums, old playbook/node aliases, pipeline-specific controller rebinding, stack frames, gate evidence, time normalization, and reserved-record normalization.

Known one-to-one mappings SHALL preserve completed/skipped evidence, in-progress/failed status, typed decisions, human waits, execution identity, stack position, content/visual gates, and capability freshness records. Markerless old create/edit production work SHALL map only to declared legacy maintenance ownership; HTML-marked work SHALL map only to final HTML controllers. Missing/conflicting source marker or one-to-many semantic mappings SHALL return a typed `replacement_required` diagnostic and SHALL not rewrite/clear the original state. Starting a new top-level execution still requires explicit replacement authorization when incomplete and preserves reserved records.

#### Scenario: V2 HTML state gains final metadata

- **WHEN** a valid schema-v2 HTML-first state has old module/node names with a one-to-one mapping
- **THEN** heal writes schema 3 with final names and identical execution/evidence/wait semantics
- **AND** a second heal is byte-stable apart from the first migration diagnostic policy

#### Scenario: V2 markerless production becomes legacy maintenance

- **WHEN** an in-progress markerless deck points to an old whole-page production node
- **THEN** migration rebinds it to the declared legacy controller/node without approving or rerunning work

#### Scenario: Ambiguous migration preserves original state

- **WHEN** the source is missing/conflicting or the old node has no unique semantic successor
- **THEN** read returns a replacement-required action
- **AND** does not silently reset progress or write a guessed current node

#### Scenario: Stack migration preserves suspended execution

- **WHEN** old stack frames contain renamed playbooks/nodes/modules
- **THEN** every unambiguous frame maps with its execution/controller evidence intact

#### Scenario: Incomplete execution is not silently replaced

- **WHEN** the active execution is incomplete and no explicit replacement authorization exists
- **THEN** starting another top-level controller fails without clearing it

## ADDED Requirements

### Requirement: HTML visual gate evidence is versioned and pipeline-specific

State SHALL reserve `html-visual-review` in addition to legacy `header-review`. The HTML record SHALL contain exact schema/pipeline, `visual_system_fingerprint`, covered family/geometry variants, representative IDs, preview manifest/path/SHA evidence, review-plan hash, and `page_reviews` keyed by stable slide ID. Each page review SHALL bind composition fingerprint, forced-fallback variant when applicable, preview SHA, reviewed fallback asset SHAs, and human decision/timestamp. HTML evidence SHALL not satisfy legacy gates and legacy evidence SHALL not satisfy HTML gates.

#### Scenario: Copy edit preserves deck visual approval

- **WHEN** ordinary body copy changes without visual-system/family/fallback change
- **THEN** deck visual-system evidence remains current

#### Scenario: New family invalidates deck visual approval

- **WHEN** a current plan introduces an uncovered family/geometry variant
- **THEN** visual gate becomes stale until representative HTML output is reviewed

#### Scenario: One fallback asset changes

- **WHEN** valid source updates a page-local fallback asset
- **THEN** only that slide's page review becomes stale
- **AND** approval requires forced-fallback preview evidence

### Requirement: State and status expose complete delivery without optional-refinement debt

When HTML Stage 1-5 receipts and final human review are current, status/resume SHALL report the deck complete even though no modern Phase-4 execution or Image2 directory exists. It SHALL not create a placeholder node, authorization, reserved refinement record, or suggested required action. Markerless decks SHALL report their legacy maintenance ownership separately.

#### Scenario: User stops after HTML delivery

- **WHEN** current HTML PPTX/notes/final review exist
- **THEN** status reports a complete deliverable and no pending refinement

### Requirement: Playbook index reserves final system evidence and enforces pipeline ownership

The canonical index SHALL reserve at least `header-review` and `html-visual-review`, validate controller-level supported pipeline declarations, reject cross-pipeline entry conditions, and verify that Change-3 active nodes do not target unavailable Phase 4.

#### Scenario: Controller declares reserved review node

- **WHEN** a playbook declares `node: html-visual-review`
- **THEN** validation fails because the ID is system evidence

#### Scenario: Legacy controller allows HTML pipeline

- **WHEN** legacy maintenance declares or is entered with `html-first-v1`
- **THEN** index/entry validation fails closed
