## Purpose

Define the framework's constitutional and entry layer: the charter documents, five-root soft bundle, reference appendices including `agent-prompts.md`, and stable ownership navigation. The run-bundle SSOT is `scripts/shared/run-bundle/bundle_layout.mjs`.
## Requirements

### Requirement: Agent resume protocol consumes workflow inspection
`AGENT_CONTRACT.md` and `NODE-SPEC.md` SHALL direct an Agent that has resolved an exact run to consume `state --json.workflow_inspection.primary_action` and its owner-issued `continuation` for resume and gate guidance. They SHALL preserve `_state/state.yaml` as the execution-pointer SSOT and the direct-owner public CLI as the sole mutation route. `workflow_summary`, `suggested_next`, and `eligible_candidates` are non-authoritative display projections and SHALL NOT be the Agent's control input.

#### Scenario: Agent resumes an exact run
- **WHEN** an Agent has resolved an exact existing run and requests resume or gate guidance
- **THEN** the Charter directs it to consume `workflow_inspection.primary_action` and its owner-issued continuation
- **AND** it does not use display projections to select or invoke a mutation

### Requirement: Charter makes source and test ownership navigable

Active framework guidance SHALL explain that `workflow/`, `playbook/`, `scripts/`, `tests/`, and `tests_e2e/` share Phase vocabulary while retaining different roles. It SHALL direct maintainers to the owning Phase `index.mjs` and mirrored test owner, and forbid cross-Phase private imports, generic `scripts/lib/`, and business rules in test helpers.

#### Scenario: Coding Agent changes a Phase 3 behavior

- **WHEN** maintenance guidance is followed for a Phase-3 behavior change
- **THEN** it directs the Agent to the Phase interface, private implementation, and mirrored Phase-3 tests rather than a new flat script or test

### Requirement: Charter directory exists with exactly four files

`PPTMAKER_FRAMEWORK/charter/` SHALL exist as a subdirectory containing exactly four files: CONSTITUTION.md, WORKFLOW.md, AGENT_CONTRACT.md, and NODE-SPEC.md. No other files SHALL be placed in this directory.

#### Scenario: Agent enters framework and reads charter

- **WHEN** Agent navigates to `PPTMAKER_FRAMEWORK/charter/`
- **THEN** it finds CONSTITUTION.md (structure constitution), WORKFLOW.md (process constitution), AGENT_CONTRACT.md (behavioral constitution), and NODE-SPEC.md (node constitution)
- **AND** no other files exist in this directory

### Requirement: CONSTITUTION.md declares bundle_layout.mjs as the single source of truth

`charter/CONSTITUTION.md` SHALL explicitly state that `PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs` is the single authoritative source for the run bundle directory structure. It SHALL contain a human-readable snapshot of the canonical tree, and SHALL state that the code authority takes precedence over any snapshot.

#### Scenario: Human reads constitution to understand directory layout

- **WHEN** a human opens `charter/CONSTITUTION.md`
- **THEN** they see a clear declaration that `bundle_layout.mjs` is the SSOT
- **AND** they see the canonical directory tree (generated from `renderTree()`)
- **AND** they see the three-tier gradient explanation (upstream/backbone/downstream)
- **AND** they see the override precedence rules

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

### Requirement: AGENT_CONTRACT.md is in charter directory

`AGENT_CONTRACT.md` SHALL be located at `PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md`. It SHALL include iron-law **§11 交互节律** (interaction rhythm) as a single section whose executable bullets require: recognition over recall (concrete candidates + recommendation), show-don't-tell for visual artifacts (`open` / render — description MUST NOT substitute for seeing when the file exists), default-and-reversible choices, progressive disclosure of capabilities when relevant, visible checkpoints on long tasks (no silent long runs), confidence-calibrated step size (small early, longer after alignment), checkpoints framed as "are we still pointed correctly", and an early visible win on first interaction. The document title/count SHALL reflect eleven iron laws. Other iron laws (§1–10) MAY be retained. The contract MUST NOT claim its body is frozen against behavioral improvements.

§1 入口顺序 (or equivalent entry iron law) SHALL require that for an existing `deck_*`, **progress lives on disk**: `_state/state.yaml` is the execution-pointer SSOT, and whole-workflow where-am-I MAY also use `ppt_flow status` / artifacts — conversation context SHALL NOT be treated as progress truth. Agents SHALL run the session resume ritual (`ppt_flow state` and `status` as needed, report plain-language position, continue at `current_node`) before greenfield intake, and SHALL persist node transitions with `writeState`. Cleared chat or a new session SHALL NOT be treated as lost progress when `_state` exists.

#### Scenario: Agent reads interaction rhythm

- **WHEN** Agent follows the BOOTSTRAP entry flow and reads AGENT_CONTRACT.md
- **THEN** the link resolves to `charter/AGENT_CONTRACT.md`
- **AND** the contract contains §11 interaction-rhythm covering show-don't-tell and long-task checkpoints

#### Scenario: Contract may gain behavioral iron laws

- **WHEN** the framework adds or refines agent behavioral rules such as interaction rhythm
- **THEN** AGENT_CONTRACT.md MAY be updated accordingly
- **AND** the charter directory still contains exactly the four governing files

#### Scenario: Entry order requires state-first resume

- **WHEN** Agent starts a session on an existing in-progress deck after context was cleared
- **THEN** AGENT_CONTRACT directs the agent to treat disk (`_state` plus artifacts as needed) as progress truth
- **AND** to resume from `current_node` rather than trusting chat memory alone

### Requirement: BOOTSTRAP requires showing artifacts before visual gates
BOOTSTRAP and the Agent Contract SHALL require the Agent to show exact pipeline-owned artifacts before recording human gates. For HTML-first, content approval follows the ordered human-reviewed content projection and visual approval follows production-equivalent representative or affected-page preview/contact-sheet evidence; selected-current fallback review visibly uses its forced-fallback variant. For a current whole-page image2-only run, the Agent shows its current style-master, pilot, content/visual, and header artifacts required by the owning review path. Successful generation, prose description, metadata scalar, or an artifact from the other pipeline never counts as approval. Every gate binds the shown current evidence hash and remains human-owned.

#### Scenario: Whole-page gate is requested
- **WHEN** the Agent asks for a current whole-page content, visual, or header decision
- **THEN** it first presents the owning current artifact/evidence set
- **AND** it does not accept a historical artifact or HTML evidence as a substitute

### Requirement: Framework root contains exactly five markdown files

The `PPTMAKER_FRAMEWORK/` root directory SHALL contain exactly five `.md` files: README.md, CLAUDE.md, BOOTSTRAP.md, AGENTS.md, and COMMANDS.md. No other `.md` files SHALL exist at this level.

#### Scenario: Human opens framework and sees clean entry

- **WHEN** a human lists `PPTMAKER_FRAMEWORK/` contents
- **THEN** they see only five markdown files, all of which are entry points
- **AND** reference documents (`quick-start.md`, `glossary.md`, `anti-patterns.md`, `version-log.md`) are NOT in the root

### Requirement: Reference documents are in reference/ directory

`quick-start.md`, `glossary.md`, `anti-patterns.md`, and `version-log.md` SHALL be located in `PPTMAKER_FRAMEWORK/reference/`. These are pure lookup appendices, not entry points.

#### Scenario: Human looks for reference material

- **WHEN** a human navigates to `reference/`
- **THEN** they find `quick-start.md` (onboarding), `glossary.md` (terminology), `anti-patterns.md` (common mistakes), and `version-log.md` (changelog)

### Requirement: Root README references charter directory

The file `PPTMAKER_FRAMEWORK/README.md` SHALL mention the `charter/` directory and describe its purpose: housing the three constitutional documents. The README's directory tree diagram SHALL include `charter/` and `COMMANDS.md`.

#### Scenario: Human discovers charter from root README

- **WHEN** a human reads `PPTMAKER_FRAMEWORK/README.md`
- **THEN** they see `charter/` in the directory tree
- **AND** they understand it contains the framework's governing documents

### Requirement: Framework root subdirectories follow type-based organization

The `PPTMAKER_FRAMEWORK/` root SHALL contain exactly five subdirectories: `workflow/` (methodology), `scripts/` (executable code), `charter/` (constitution), `reference/` (appendices), and `playbook/` (workflow controllers). Phase-numbered directories (00_*, 01_*, etc.) SHALL NOT exist at root level.

#### Scenario: Human lists root subdirectories

- **WHEN** a human runs `ls PPTMAKER_FRAMEWORK/`
- **THEN** they see exactly `workflow/`, `scripts/`, `charter/`, `reference/`, `playbook/`
- **AND** no directory names contain Phase numbers at root level

### Requirement: CONSTITUTION declares run-bundle learning surface with an explicit purpose

`charter/CONSTITUTION.md` SHALL declare a run-bundle **self-retained lessons** surface at `deck_*/_lessons/` and SHALL give it a **dedicated governing section** (not only a tree-line annotation). That section SHALL state, in plain language, the **agentic loop**: the agent workflow is expected to **probe, overcome difficulties on its own, and retain non-secret lessons** under `_lessons/` so the next session reads before guessing—rather than amnesiacally restarting from chat. The framework SHALL define only the convention (path, purpose, writing rules, prohibitions); **each run bundle accumulates its own** lessons via the agent. The surface is **not** playbook progress, **not** secrets, **not** materials or generated artifacts. Domain-specific receipts (for example an Image2 smoke file) MAY be cited as **examples**, but SHALL NOT be the sole purpose of `_lessons/`. Secrets SHALL NOT be stored under `_lessons/`. Playbook progress SHALL remain under `_state/`. A bare directory name without purpose text SHALL be treated as insufficient. The constitution and tree snapshot SHALL use `_lessons/` (not `_learning/`) as the canonical path.

#### Scenario: Charter section states the agentic retain loop

- **WHEN** a reader opens `charter/CONSTITUTION.md`
- **THEN** they find a dedicated section for the `_lessons/` surface
- **AND** that section states probe / overcome / retain / read-before-guess in plain language
- **AND** it distinguishes `_lessons/` from `_state/` and from `.env` secrets

#### Scenario: Tree snapshot annotates _lessons without a single-file monopoly

- **WHEN** a reader views the canonical tree snapshot in `CONSTITUTION.md`
- **THEN** the `_lessons/` line includes a short purpose annotation (not only the folder name)
- **AND** the snapshot does not imply the directory exists only for one named receipt file

#### Scenario: Framework does not own per-deck lesson content

- **WHEN** the constitution describes `_lessons/`
- **THEN** it states that lesson content is owned by the run bundle (written during work)
- **AND** it does not require the framework tree to ship per-project endpoint lessons

### Requirement: Directory strictness increases toward the deck root

`charter/CONSTITUTION.md` and `charter/AGENT_CONTRACT.md` SHALL **mirror** the structure gradient defined by capability `run-bundle-layout` (上严下松): state that the deck root is the strictest layer, that version `_scratch/` is the loose outlet for temp backups, and that agents MUST NOT invent `_tmp/` / `backup/` / `_bak/` or litter the deck root. Charter documents SHALL NOT own the run-bundle folder ontology and SHALL NOT redefine soft-bundle layout (`framework-directory-layout`).

#### Scenario: Constitution states upper-strict lower-loose

- **WHEN** a developer or agent reads CONSTITUTION or AGENT_CONTRACT directory rules
- **THEN** the docs state that the deck root is the strictest layer and version `_scratch/` is the loose outlet for temp backups

#### Scenario: Contract forbids deck-root litter

- **WHEN** Agent needs to backup `slide-specifications.md` before a rewrite
- **THEN** AGENT_CONTRACT directs the backup into `3_versions/v{n}/_scratch/`
- **AND** forbids leaving the bak at the deck root

### Requirement: CONSTITUTION tree includes version _scratch

`charter/CONSTITUTION.md` run-bundle tree SHALL **mirror** `run-bundle-layout` by including `3_versions/v{n}/_scratch/` with a short purpose note (temp/bak for this version; not SSOT; deletable). The snapshot remains human-readable; `renderTree()` remains code authority.

#### Scenario: Constitution tree lists _scratch

- **WHEN** Agent reads the canonical tree in CONSTITUTION.md
- **THEN** `_scratch/` appears under the version directory

### Requirement: BOOTSTRAP directs GREP-before-invent for placement

`PPTMAKER_FRAMEWORK/BOOTSTRAP.md` directory-constitution section SHALL instruct: when unsure where to place a file, GREP canonical tokens and consult `reference/glossary.md` Where Map (owned by `run-bundle-layout`) **before** creating ad-hoc directories or dumping files at the deck root. BOOTSTRAP SHALL mention at least `_scratch`, `_generated`, and `style_master` (or `contact_sheet` / `pilot`) as example keys. BOOTSTRAP SHALL NOT paste a second full Where Map table.

#### Scenario: BOOTSTRAP names the grep loop

- **WHEN** Agent reads BOOTSTRAP directory-constitution rules
- **THEN** the text directs GREP / Where Map lookup before inventing placement
- **AND** links or names `reference/glossary.md`

### Requirement: AGENTS Phase 0 tree lists _scratch with glossary-aligned labels

`PPTMAKER_FRAMEWORK/AGENTS.md` Phase 0 run-bundle tree SHALL include `3_versions/v{n}/_scratch/` with English role labels aligned with the Where Map (temp/bak; not SSOT; not deck root), consistent with `renderTree()`.

#### Scenario: Phase 0 tree shows _scratch

- **WHEN** Agent reads the Phase 0 run-bundle tree in AGENTS.md
- **THEN** `_scratch/` appears under the version directory with a temp/bak purpose note

### Requirement: BOOTSTRAP documents user-triggered lesson capture

`PPTMAKER_FRAMEWORK/BOOTSTRAP.md` SHALL document that when a user says phrases like "记住这个" / "下回别忘了" / "不容易总算调出来了" / "记下来", the agent SHALL immediately capture the relevant lesson to `_lessons/` using the 4-question format (遇到什么？/ 怎么试的？/ 结论是什么？/ 下次先看哪？). BOOTSTRAP SHALL instruct the agent to use `lessons.mjs add <runDir> --title <slug>` or write the file directly.

#### Scenario: BOOTSTRAP documents user-triggered lesson capture

- **WHEN** the user says phrases like "记住这个" or "下回别忘了" or "不容易总算调出来了"
- **THEN** BOOTSTRAP instructs the agent to immediately write the relevant lesson to `_lessons/` using the 4-question format

### Requirement: AGENT_CONTRACT includes lesson capture obligation at phase gates

`PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md` §4 (Phase gates) SHALL instruct the agent to, after resolving any error that took more than one attempt, offer to capture a lesson to `_lessons/`. At each phase gate approval, the agent SHALL confirm whether any uncaptured lessons remain. The instruction SHALL reference `_lessons/README.md` for the writing rules and `lessons.mjs add` as the preferred capture tool.

#### Scenario: Agent offers to capture after multi-attempt fix

- **WHEN** the agent resolves an error after 2+ attempts (any operational issue that required repeated trial-and-error to overcome)
- **THEN** AGENT_CONTRACT instructs the agent to ask "Worth writing a lesson to `_lessons/`?"

#### Scenario: Agent checks for uncaptured lessons at phase gate

- **WHEN** the agent is about to mark a phase gate as approved
- **THEN** AGENT_CONTRACT instructs the agent to confirm no valuable lessons remain uncaptured

### Requirement: AGENTS workflow includes lesson check and capture steps

`PPTMAKER_FRAMEWORK/AGENTS.md` SHALL include explicit lesson-awareness steps at key workflow transitions:
- At the start of each Phase: "Check `_lessons/` for relevant experience before beginning this phase"
- Before Phase 2 (image generation): explicitly flag to check for vendor/endpoint lessons
- After error resolution: "Lesson worth capturing? Use `lessons.mjs add`"
- At phase gate approval: "Confirm no uncaptured lessons"

These steps SHALL reference `lessons.mjs check` and `lessons.mjs list` as the preferred tools for lesson retrieval.

#### Scenario: Phase start includes lesson check

- **WHEN** Agent begins a new Phase in AGENTS.md workflow
- **THEN** the Phase instructions include "Check `_lessons/` for relevant experience"

#### Scenario: Pre-Phase-2 vendor check

- **WHEN** Agent is about to begin Phase 2 (image generation)
- **THEN** AGENTS.md explicitly flags checking for vendor/endpoint-related lessons

### Requirement: Framework hierarchy terminology is canonical

Active framework documents and `openspec/config.yaml` SHALL distinguish four hierarchy terms: Lifecycle Phase sequence `0 → 1/2 → 2.7 → 3 → 4`, Method Module 00–05, Pipeline Stage 1–5, and Playbook Node. Documents SHALL NOT describe workflow directory numbers as a second lifecycle Phase sequence or use incompatible phase counts for the same end-to-end process.

#### Scenario: Reader compares entry and workflow documents

- **WHEN** a reader opens BOOTSTRAP, AGENT_CONTRACT, WORKFLOW, workflow/README, and openspec/config.yaml
- **THEN** the same four hierarchy terms and meanings are used
- **AND** the reader can distinguish lifecycle order from methodology folder order and production stages
- **AND** the Phase 2.7 L3 prompt-fill checkpoint is preserved rather than erased by a simplified count

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
- **AND** it does not route the run through retired maintenance

### Requirement: Active framework guidance separates slide identity from order
Active guidance SHALL define formal slide_id as stable page identity and physical slide-block order as derived current position; examples use position + slide_id + title. New pages use Agent-authored mnemonic-v1 two-block 5-8 ASCII-letter IDs, preferring 5-6. A retained historical-format ID remains a readable/reserved identity only when its containing run otherwise has current source/state identity; it is not silently renamed and never selects pipeline, Controller, artifact provenance, or repair behavior.

Artifact identity remains (slide_id, producer, artifact_kind, producer_fingerprint), not position, filename, heading, or generic engine selection. _generated remains rebuildable and never manually edited/copied. Structural source apply publishes clean vNext without renderer/provider work. HTML receipts use needs_local_materialization and target-local reuse/composition; current whole-page receipts use manifest-proven raw reuse plus needs_render for separately authorized Generated Image Rebuild. Unproven historical raw files do not create reuse authority.

#### Scenario: Retained historical ID remains identity-only
- **WHEN** current source contains retained s07_problem and a new mnemonic ID
- **THEN** guidance preserves and reserves the former while validating the latter
- **AND** it does not infer a historical pipeline or state continuation

### Requirement: Active guidance separates deck work versions from optional Git audit

Active framework entry, charter, setup, iteration, command-reference, and glossary guidance SHALL define `deck_*/3_versions/vN/` and Structural Versioning Path as the user-visible deck work-version authority. Git SHALL be described only as an optional, user-owned source/control audit and comparison aid. It SHALL not be described as a second slide-order source, a replacement for clean vNext publication, a render/cache identity source, a framework-provided source-replacement mechanism, a required project capability, or a condition for pipeline correctness.

When active guidance describes history, source/control Markdown and required state/control files SHALL be described as eligible for tracking in a user-owned repository, rather than inherently Git-tracked. It SHALL not make Git installation, a clean worktree, a first commit, or `commit + push` an automatic setup, phase, archive, or delivery prerequisite. It SHALL not direct an Agent to inspect Git state or mutate Git without explicit user direction and scope.

The guidance SHALL preserve the source/derived boundary: `_generated/` remains reproducible derived output and SHALL not be proposed for forced tracking. The framework SHALL not tell users to use `git add -f _generated/` or a Git commit in place of Structural Versioning Path. This change supplies no Git-history reader, automated source replacement, or default recovery protocol; independently authorized named Git operations remain governed by the authorization rule in `bootstrap-env-guidance`, not by a framework recovery path.

`charter/AGENT_CONTRACT.md` SHALL carry a concise operational rule: Git is optional; visible `vN` remains the deck work-version authority; `_generated/` is never a recovery target; and an Agent may not perform a Git mutation without explicit user authorization for its named operation and exact scope. `run-bundle-management` owns the corresponding generated `deck-guide.md` seed, its create-if-absent behavior, and alignment with the reference template; neither guide SHALL claim that a newly initialized deck is already Git-protected.

#### Scenario: Reader distinguishes version and audit responsibilities

- **WHEN** an Agent or human reads active framework guidance about versions and safety
- **THEN** it can distinguish deck `vN` as the work-version path from optional Git as source audit/comparison
- **AND** it sees that structural publication and later refresh authorization remain independent of commits

#### Scenario: User works without Git

- **WHEN** a user does not install Git, the current directory has no confirmed worktree, or the user declines a checkpoint
- **THEN** active guidance still permits setup, authoring, structural vNext publication, production, and delivery through their existing rules
- **AND** it does not characterize that user as failing a framework gate or imply that the framework has an automated Git source-replacement route

#### Scenario: Generated outputs stay derived under optional Git guidance

- **WHEN** active guidance discusses using Git with a run bundle
- **THEN** it retains the rule that `_generated/` is rebuilt from source and not hand-edited or force-tracked
- **AND** it keeps version-local scratch files separate from tracked source/control policy

#### Scenario: Fresh runtime guide preserves optional Git boundaries

- **WHEN** `initBundle` creates a fresh run bundle
- **THEN** its generated `deck-guide.md` seed and the reference template both state the aligned optional-Git/version/derived-output/authorization rule
- **AND** their wording does not authorize an Agent to initialize, commit, or replace source/generated output by default

### Requirement: Framework ownership separates complete HTML delivery from future refinement
The Constitution and Agent Contract SHALL state that MD Controller/human review owns content/visual approval, optional professional refinement choice, exact remote-cost authorization, and per-page adoption; JS owns deterministic HTML rendering/evidence and authorized visual-slot enforcement. Ordinary HTML create/build/iteration does not load a provider adapter. Complete HTML delivery is a valid terminal outcome with no refinement debt until the user enters the applicable refinement mode. Active guidance places complete HTML delivery under Phase 3, visual-slot refinement under Phase 4, and current whole-page image2-only generation under its create-deck-owned 04-image-production/whole-page route. Phase 5 shall not own whole-page generation or a historical maintenance route.

#### Scenario: Maintainer locates Image2 ownership
- **WHEN** active Charter guidance distinguishes the two Image2 capabilities
- **THEN** visual-slot points to authorized HTML refinement and whole-page points to current image2-only create-deck ownership
- **AND** neither points to a Phase-5 maintenance bridge

### Requirement: Gate posture is guide-first and explicitly bounded

The framework charter SHALL define gates as user-guidance surfaces. A gate result SHALL distinguish
an automatically repairable guide, a reversible risk requiring explicit human confirmation, and a
hard stop protecting identity, integrity, security, authorization, or recoverability. Quality and
workflow evidence SHALL be waivable only through a named, reasoned, version-scoped decision; a waiver
SHALL never be represented as approval and SHALL NOT imply that evidence is complete. Evidence
completeness SHALL be computed and reported independently. The charter SHALL point maintainers to
`openspec/policies/human-centered-gates.md`, and `openspec/config.yaml` SHALL require gate-sensitive
changes to record the same classification without copying runtime schemas.

#### Scenario: A quality gate is incomplete

- **WHEN** current HTML evidence is missing but the source, target version, and local artifacts are identifiable
- **THEN** the Agent receives a recommended repair path and an explicit continuation path
- **AND** the continuation records a human reason and remains visibly waived rather than approved

#### Scenario: A transaction identity is unsafe

- **WHEN** a plan hash, reset epoch, target version, active journal, or state owner is ambiguous or conflicting
- **THEN** the framework returns a hard-stop recovery diagnostic
- **AND** no waiver or force flag bypasses the identity/integrity check

#### Scenario: A maintainer proposes a gate-sensitive change

- **WHEN** an OpenSpec proposal, spec, design, or task changes readiness, validation, diagnostics, or override behavior
- **THEN** the artifact names guide/confirm/hard-stop outcomes and the invariant protected by every hard stop
- **AND** runtime CLI/state field definitions remain owned by their existing capabilities

### Requirement: Durable governance separates gate posture from control-path guidance

The framework SHALL keep long-lived governance rules under `openspec/policies/`,
not solely inside an active change. `human-centered-gates.md` SHALL own outcome
classification, continuation semantics, and protected invariants.
`agent-assistance-and-control.md` SHALL own the shape of direct control paths,
including responsibility handoff, source/evaluator selection, diagnostics, and
recovery. For a change involving both, maintainers SHALL classify the outcome
first, then shape the control path. Capability specifications and executable
contracts SHALL remain the only owners of concrete command, state-schema, and
permission behavior.

#### Scenario: A change is archived

- **WHEN** an active OpenSpec change is archived
- **THEN** any research note inside that change remains historical rationale only
- **AND** durable governance continues to be read from `openspec/policies/`

#### Scenario: A controller recovery change also affects a gate

- **WHEN** a proposed change modifies both a gate and its recovery path
- **THEN** it uses the gate policy to classify the outcome and invariant before applying the control policy to source ownership and recovery
- **AND** it does not use either policy as a substitute for the owning runtime contract

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

### Requirement: AGENT_CONTRACT defines portable run-bundle entry

`AGENT_CONTRACT.md` SHALL define `RUN_BUNDLE.md` as the portable entry for a local
repository-agent session. It SHALL direct the Agent to the one run-bundle-management locator
module for static card proof, without duplicating its parser, filesystem checks, candidate order,
or failure codes. The Agent SHALL resolve card bytes with only optional original-card or
human-explicit deck/framework paths, then use the state owner's observe/no-heal selector (active
`run_version` first, otherwise `continuation_target_version`) before the existing exact-run
structure check and state/status. It SHALL not use cwd, scans, enumeration, deck names, or recency
to infer a path.

Every locator failure is a bounded zero-write guide. Card bytes do not select a run, change state,
reopen terminal work, or establish remote-chat capability. Deck-only relocation may retain a
verified direct framework root; framework-only relocation may use the recorded relation while the
declared deck remains verified; a double relocation requires an explicit framework root.

#### Scenario: Card bytes locate an accessible local bundle
- **WHEN** an Agent receives `RUN_BUNDLE.md` bytes and can access its declared local roots
- **THEN** it resolves and verifies those roots before state inspection
- **AND** it derives one exact run without requiring the user to know framework paths

#### Scenario: Stale locator has bounded recovery
- **WHEN** an absolute root is stale and no verified fallback is available
- **THEN** the Agent requests exactly the missing deck or framework root
- **AND** it does not scan, heal, re-upload, or infer a replacement

### Requirement: Active whole-page terminology names only the current route
Active root, Charter, workflow, playbook, reference, script, and command guidance SHALL identify current whole-page work as production mode `image2-only`, pipeline `whole-page-image2-v1`, and normal Controller `create-deck`. It SHALL identify cross-pipeline work only as the state-owned production-mode transition. It SHALL not describe current whole-page work as any retired route and SHALL not advertise a removed Controller, node, command, scratch owner, or receipt reader.

Unrelated compatibility wording MAY remain only when its owning current requirement names the exact preserved contract. Archived history and explicit negative-test literals are not active guidance. The active-surface verifier SHALL reject exact retired whole-page identities and malformed mechanical replacements without treating a generic word ban as the behavioral proof.

#### Scenario: Agent reads the current whole-page route
- **WHEN** an Agent starts or resumes a supported `image2-only` run
- **THEN** active guidance directs it through `create-deck` and `whole-page-image2-v1`
- **AND** it does not expose a compatibility maintenance route

#### Scenario: Agent changes page authority
- **WHEN** an Agent needs to move between HTML and whole-page pipelines
- **THEN** active guidance names only the closed `state --*-production-mode-transition` operations
- **AND** no removed migration command or Controller is offered
