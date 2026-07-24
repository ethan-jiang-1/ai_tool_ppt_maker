## RENAMED Requirements

- FROM: `### Requirement: Editing-path terminology uses English canonical names and controlled legacy aliases`
- TO: `### Requirement: Editing-path terminology uses canonical current names`

## MODIFIED Requirements

### Requirement: Agent resume protocol consumes workflow inspection
`AGENT_CONTRACT.md` and `NODE-SPEC.md` SHALL direct an Agent that has resolved an exact run to consume `state --json.workflow_inspection.primary_action` and its owner-issued `continuation` for resume and gate guidance. They SHALL preserve `_state/state.yaml` as the execution-pointer SSOT and the direct-owner public CLI as the sole mutation route. `workflow_summary`, `suggested_next`, and `eligible_candidates` are non-authoritative display projections and SHALL NOT be the Agent's control input.

#### Scenario: Agent resumes an exact run
- **WHEN** an Agent has resolved an exact existing run and requests resume or gate guidance
- **THEN** the Charter directs it to consume `workflow_inspection.primary_action` and its owner-issued continuation
- **AND** it does not use display projections to select or invoke a mutation

### Requirement: Cross-pipeline mode changes are versioned and HTML-quality-scoped
Active framework guidance SHALL describe `html-* <-> image2-only` as a clean state-owned versioned production-mode transition, not an in-place production-mode write or a permanent refusal. It SHALL preserve the version-scoped mode SSOT, source-marker contract, source-version history, target-only evidence, provider authorization, and target-user intake-decision boundary. Guidance SHALL identify `production-mode-transition` as the Controller owner and the state owner as the deterministic exact-plan-hash commit, registration, and recovery owner. Guidance SHALL reject a missing, malformed, retired, or mismatched source/state identity before it advertises a transition path.

The named `--confirm-production-mode-transition` operation records the target user's `proceed` decision for an explicitly authored, hash-bound intake. It is not the Human-Centered Gate Policy's `confirm` outcome: it accepts no risk reason or force option, creates no waiver/continuation, and never relaxes source identity, receipt, CAS, journal, or provider-authorization checks.

Likewise, the closed uncertain-journal `no-active-apply` operation is a revalidated factual attestation inside a recovery hard-stop, not a waiver of writer ownership. Guidance SHALL keep recovery blocked when its exact journal/source/target/plan binding cannot be re-established and SHALL never turn either form of human input into a force path.

The transition's HTML target scope SHALL be limited to the existing valid runnable HTML contract and its existing human delivery process. Active guidance SHALL NOT claim that this change improves, scores, compares, or guarantees HTML visual quality, visual parity, premium layout, or an HTML style master. Image2-primary quality, provenance, authorization, and final-review requirements remain unchanged.

#### Scenario: Guidance explains an HTML target
- **WHEN** active documentation describes an Image2-to-HTML transition
- **THEN** it presents a safe clean-vNext path and existing HTML contract without adding an HTML quality claim

#### Scenario: Guidance explains an Image2 target
- **WHEN** active documentation describes an HTML-to-Image2 transition
- **THEN** it preserves the normal Image2 pilot/review/authorization boundary after target publication

#### Scenario: Guidance sees unsupported state
- **WHEN** active documentation addresses a run with absent or inconsistent source/state identity
- **THEN** it directs the Agent to one bounded owner-issued typed next action
- **AND** it does not name an old Controller as a recovery path

### Requirement: CONSTITUTION declares MD↔JS complementary robustness
`charter/CONSTITUTION.md` SHALL include a governing section titled approximately **MD↔JS 互补健壮性（Agentic 双轨）**, placed alongside the CLI failure-envelope rules, stating: MD Controllers / agents are smart but fuzzy producers; JS / CLI is the precise contract executor. Production-path format and schema defects (missing punctuation, wrong types, empty mappings where arrays are required, and similar template/state blemishes) SHALL be healed by the precise side when deterministic repair is possible, and/or actively fixed by the MD/agent before continuing. On write-back after heal, on-disk YAML/JSON SHALL be canonical so subsequent MD edits start from a clean template. Presenting "fix the YAML/JSON syntax" as the novice user's primary next step SHALL be forbidden. Irrecoverable failures SHALL still use the structured CLI JSON envelope; recoverable format problems SHALL be repaired first.

For source/state handling, deterministic repair applies only after the state owner establishes an explicit current schema-5 identity, a one-to-one repairable defect, and clear gate/reset/transition fences. Charter, Agent Contract, and bootstrap guidance SHALL distinguish that `guide` from a pre-current, retired, or identity-ambiguous protocol: observation of the latter is a non-writing `hard-stop` that preserves bytes and reports exactly one owner-issued typed next action through the existing owner. Neither the Agent nor a person may choose from a recovery menu, hand-edit state YAML, or manufacture a current Controller continuation from metadata, generated artifacts, history, source preference, or chat context.

#### Scenario: Agent or human reads the constitution for agentic pairing

- **WHEN** a reader opens `charter/CONSTITUTION.md`
- **THEN** they find an explicit MD↔JS complementary-robustness section
- **AND** the section requires read-side tolerance, write-side canonicalization, and heal-before-asking-novices

#### Scenario: Contract points MD at heal-first behavior

- **WHEN** an agent reads `charter/AGENT_CONTRACT.md` §7 (runtime / CLI)
- **THEN** it finds a heal-first bullet for bad state/templates
- **AND** it is not directed to make the user manually fix YAML punctuation as the default path

#### Scenario: Current state has a repairable defect
- **WHEN** Agent guidance encounters a current explicit run whose state owner reports a one-to-one repairable schema-5 defect
- **THEN** it invokes or reports the owner-issued repair path rather than asking the person to edit YAML
- **AND** it does not treat the repair as approval, completion, or a new execution

#### Scenario: Historical state cannot be promoted by conversation
- **WHEN** Agent guidance encounters a pre-current or retired state protocol
- **THEN** it reports one bounded owner-issued typed next action and preserves the state bytes during observation
- **AND** it does not use chat context, source preference, metadata, or generated artifacts to resume it as current work


### Requirement: WORKFLOW.md describes the complete agent process
charter/WORKFLOW.md SHALL document lifecycle 0 -> 1 -> 2 -> 3 -> [4 Image Production] -> 5 with Phase name, purpose, gate, and Agent/human ownership. Phase 3 delivers complete HTML contact-sheet/PPTX/notes. Image Production distinguishes current whole-page image2-only work, owned by create-deck through 04-image-production/whole-page, from post-delivery html-then-image2 visual-slot refinement; only visual-slot requires current HTML delivery and explicit per-page adoption. Phase 5 is iteration and versioned transition support, not a whole-page implementation or a source-to-HTML migration route.

The workflow SHALL name HTML Local Slide Rebuild, Local Deck Rebuild, Notes-Only Refresh, and the outer Structural Versioning Path. For current image2-only it SHALL name Header Text & Style Refresh, Generated Image Rebuild, Notes-Only Refresh, and Structural Versioning Path. Structural Versioning is not a peer refresh and always publishes source/control before later materialization. Unsupported historical protocols receive a non-writing state-owner hard-stop and one typed next action rather than a maintenance workflow.

#### Scenario: Agent understands the current complete paths
- **WHEN** an Agent reads charter/WORKFLOW.md
- **THEN** it can distinguish complete HTML delivery, optional authorized visual-slot refinement, and current Image2-primary production
- **AND** it is not offered a legacy maintenance or source-migration route

### Requirement: BOOTSTRAP requires showing artifacts before visual gates
BOOTSTRAP and the Agent Contract SHALL require the Agent to show exact pipeline-owned artifacts before recording human gates. For HTML-first, content approval follows the ordered human-reviewed content projection and visual approval follows production-equivalent representative or affected-page preview/contact-sheet evidence; selected-current fallback review visibly uses its forced-fallback variant. For a current whole-page image2-only run, the Agent shows its current style-master, pilot, content/visual, and header artifacts required by the owning review path. Successful generation, prose description, metadata scalar, or an artifact from the other pipeline never counts as approval. Every gate binds the shown current evidence hash and remains human-owned.

#### Scenario: Whole-page gate is requested
- **WHEN** the Agent asks for a current whole-page content, visual, or header decision
- **THEN** it first presents the owning current artifact/evidence set
- **AND** it does not accept a historical artifact or HTML evidence as a substitute

### Requirement: Active constitutional guidance matches current runtime behavior
All active root, charter, workflow, reference, playbook, script README, template, and OpenSpec guidance SHALL agree on version-scoped state authority with modes html-only, html-then-image2, and image2-only. New decks default to image2-only with direct whole-page-image2-v1 source, normal create-deck ownership, current style-master/pilot/gate/header/build/PPTX/notes/final-review flow, scoped offline readiness, and exact provider authorization before a chargeable submit. HTML modes retain direct html-first-v1 structured source, local HTML production, current HTML evidence, and their established refinement policy.

Every deck-scoped route SHALL verify the exact current source/mode pair without deriving one from metadata, prose, history, generated files, directory shape, or conversation. Source markers are renderer contracts and durable state is routing authority. Missing, retired, malformed, or mismatched identity is a non-writing owner-issued hard-stop with one typed next action; active guidance shall not describe it as a compatibility maintenance, migration, or resumable Controller route.

#### Scenario: Historical protocol is not guidance for a current route
- **WHEN** active guidance addresses a run without a supported current source/state pair
- **THEN** it names one bounded owner-issued typed next action
- **AND** it does not advertise a maintenance Controller, inferred mode, or migration continuation

### Requirement: Editing-path terminology uses canonical current names
Active classifier, glossary, WORKFLOW, COMMANDS, playbook, and OpenSpec guidance SHALL resolve the exact current source/mode pair before choosing a path. HTML uses Local Slide Rebuild, Local Deck Rebuild, Notes-Only Refresh, and Structural Versioning Path; html-then-image2 additionally reports refinement freshness. Current image2-only uses Header Text & Style Refresh, Generated Image Rebuild, Notes-Only Refresh, and Structural Versioning Path. Structural Versioning remains outside peer refresh sets, publishes source/control before materialization, and completes target mode registration before production.

Active guidance SHALL not mix HTML and whole-page evidence/flags, use retired Chain aliases as operational paths, or route current whole-page work through a maintenance Controller. Historical aliases may appear only in archived history or explicit negative tests, never as user-facing continuation guidance. An unsupported historical protocol receives the state owner's one hard-stop action rather than a classification result.

#### Scenario: Maintainer classifies a current Image2-primary edit
- **WHEN** image2-only and whole-page-image2-v1 verify for the selected run
- **THEN** guidance uses current whole-page refresh terms or Structural Versioning as applicable
- **AND** it does not call the run legacy maintenance

### Requirement: Active framework guidance separates slide identity from order
Active guidance SHALL define formal slide_id as stable page identity and physical slide-block order as derived current position; examples use position + slide_id + title. New pages use Agent-authored mnemonic-v1 two-block 5-8 ASCII-letter IDs, preferring 5-6. A retained historical-format ID remains a readable/reserved identity only when its containing run otherwise has current source/state identity; it is not silently renamed and never selects pipeline, Controller, artifact provenance, or repair behavior.

Artifact identity remains (slide_id, producer, artifact_kind, producer_fingerprint), not position, filename, heading, or generic engine selection. _generated remains rebuildable and never manually edited/copied. Structural source apply publishes clean vNext without renderer/provider work. HTML receipts use needs_local_materialization and target-local reuse/composition; current whole-page receipts use manifest-proven raw reuse plus needs_render for separately authorized Generated Image Rebuild. Unproven historical raw files do not create reuse authority.

#### Scenario: Retained historical ID remains identity-only
- **WHEN** current source contains retained s07_problem and a new mnemonic ID
- **THEN** guidance preserves and reserves the former while validating the latter
- **AND** it does not infer a historical pipeline or state continuation

### Requirement: Framework ownership separates complete HTML delivery from future refinement
The Constitution and Agent Contract SHALL state that MD Controller/human review owns content/visual approval, optional professional refinement choice, exact remote-cost authorization, and per-page adoption; JS owns deterministic HTML rendering/evidence and authorized visual-slot enforcement. Ordinary HTML create/build/iteration does not load a provider adapter. Complete HTML delivery is a valid terminal outcome with no refinement debt until the user enters the applicable refinement mode. Active guidance places complete HTML delivery under Phase 3, visual-slot refinement under Phase 4, and current whole-page image2-only generation under its create-deck-owned 04-image-production/whole-page route. Phase 5 shall not own whole-page generation or a historical maintenance route.

#### Scenario: Maintainer locates Image2 ownership
- **WHEN** active Charter guidance distinguishes the two Image2 capabilities
- **THEN** visual-slot points to authorized HTML refinement and whole-page points to current image2-only create-deck ownership
- **AND** neither points to a Phase-5 maintenance bridge

## ADDED Requirements

### Requirement: Active whole-page terminology names only the current route
Active root, Charter, workflow, playbook, reference, script, and command guidance SHALL identify current whole-page work as production mode `image2-only`, pipeline `whole-page-image2-v1`, and normal Controller `create-deck`. It SHALL identify cross-pipeline work only as the state-owned production-mode transition. It SHALL not describe current whole-page work as markerless, legacy, compatibility-only, maintenance-only, or migration, and SHALL not advertise a removed Controller, node, command, scratch owner, or receipt reader.

Unrelated compatibility wording MAY remain only when its owning current requirement names the exact preserved contract. Archived history and explicit negative-test literals are not active guidance. The active-surface verifier SHALL reject exact retired whole-page identities and malformed mechanical replacements without treating a generic word ban as the behavioral proof.

#### Scenario: Agent reads the current whole-page route
- **WHEN** an Agent starts or resumes a supported `image2-only` run
- **THEN** active guidance directs it through `create-deck` and `whole-page-image2-v1`
- **AND** it does not expose a compatibility maintenance route

#### Scenario: Agent changes page authority
- **WHEN** an Agent needs to move between HTML and whole-page pipelines
- **THEN** active guidance names only the closed `state --*-production-mode-transition` operations
- **AND** no removed migration command or Controller is offered
