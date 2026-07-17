## Purpose

Define the framework's constitutional and entry layer: the `PPTMAKER_FRAMEWORK/charter/` directory and its four governing documents (CONSTITUTION.md, WORKFLOW.md, AGENT_CONTRACT.md, NODE-SPEC.md), together with the clean top-level entry surface — exactly five root markdown files, five type-based subdirectories, and the pure-lookup appendices relocated to `reference/`. This capability guarantees that an agent or human entering the framework finds a stable, unambiguous set of entry points and a single authoritative declaration (`bundle_layout.mjs` as the SSOT for run-bundle structure), with governing documents cleanly separated from reference material. AGENT_CONTRACT includes behavioral iron laws (including interaction rhythm); BOOTSTRAP requires showing visual artifacts before related gates.
## Requirements
### Requirement: Charter directory exists with exactly four files

`PPTMAKER_FRAMEWORK/charter/` SHALL exist as a subdirectory containing exactly four files: CONSTITUTION.md, WORKFLOW.md, AGENT_CONTRACT.md, and NODE-SPEC.md. No other files SHALL be placed in this directory.

#### Scenario: Agent enters framework and reads charter

- **WHEN** Agent navigates to `PPTMAKER_FRAMEWORK/charter/`
- **THEN** it finds CONSTITUTION.md (structure constitution), WORKFLOW.md (process constitution), AGENT_CONTRACT.md (behavioral constitution), and NODE-SPEC.md (node constitution)
- **AND** no other files exist in this directory

### Requirement: CONSTITUTION.md declares bundle_layout.mjs as the single source of truth

`charter/CONSTITUTION.md` SHALL explicitly state that `PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs` is the single authoritative source for the run bundle directory structure. It SHALL contain a human-readable snapshot of the canonical tree, and SHALL state that the code authority takes precedence over any snapshot.

#### Scenario: Human reads constitution to understand directory layout

- **WHEN** a human opens `charter/CONSTITUTION.md`
- **THEN** they see a clear declaration that `bundle_layout.mjs` is the SSOT
- **AND** they see the canonical directory tree (generated from `renderTree()`)
- **AND** they see the three-tier gradient explanation (upstream/backbone/downstream)
- **AND** they see the override precedence rules

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

### Requirement: WORKFLOW.md describes the complete agent process

`charter/WORKFLOW.md` SHALL document: the 5-Phase overview table (Phase name, purpose, gate, agent role); the three English canonical artifact-refresh paths with Stage mappings and estimated durations; the separate Structural Versioning Path which creates a clean version before affected slides use refresh paths; the agent entry sequence; and the gate checkpoint mechanism. It SHALL provide one compatibility mapping from Header Text & Style Refresh / Generated Image Rebuild / Notes-Only Refresh to their former Chain A/B/C aliases, and SHALL NOT present Structural Versioning Path as a fourth peer refresh chain.

#### Scenario: Agent reads workflow to understand process structure

- **WHEN** an agent reads `charter/WORKFLOW.md`
- **THEN** it understands the Phase order (00→01→02→03→04→05)
- **AND** it knows each Phase's purpose and which gate must pass
- **AND** it can distinguish structural version creation from the three downstream artifact-refresh paths

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

`PPTMAKER_FRAMEWORK/BOOTSTRAP.md` SHALL instruct agents that before asking the user to approve a visual or pilot gate, the agent MUST open or otherwise present the real artifact to the user (at minimum `style_master.jpg` and pilot contact sheets when those gates apply). Text-only description of appearance SHALL NOT satisfy this requirement when the image file exists. When no API key / image is available yet, BOOTSTRAP MAY allow a degraded show (preset thumbnails, master prompt text) and SHALL require upgrading to real images once generation is possible. BOOTSTRAP (and sibling entry docs that cite the iron-law count) SHALL state eleven iron laws when referring to AGENT_CONTRACT length.

BOOTSTRAP SHALL also instruct: when the user points at an existing `deck_*` (or returns after disconnect / cleared session), agents MUST run `ppt_flow state` (and `status` as needed), report **whole-workflow** position in plain language (execution point + artifact/gate situation), **and scan `_lessons/`** (list all lesson files and summarize their key findings) before proceeding. BOOTSTRAP SHALL point to COMMANDS **续跑 / 做到哪了** phrasing for “接着做 / 断线了做到哪了”.

#### Scenario: Style master gate requires open

- **WHEN** Agent reaches review of `style_master.jpg` for visual lock
- **THEN** BOOTSTRAP directs the agent to present/open the image to the user before seeking approval

#### Scenario: Pilot gate requires open

- **WHEN** Agent reaches review of a pilot contact sheet
- **THEN** BOOTSTRAP directs the agent to present/open the contact sheet before seeking proceed/retry

#### Scenario: Entry docs cite eleven iron laws

- **WHEN** BOOTSTRAP or CLAUDE entry text refers to how many AGENT_CONTRACT iron laws exist
- **THEN** the cited count is eleven (not ten)

#### Scenario: BOOTSTRAP directs resume before greenfield intake

- **WHEN** Agent opens an existing in-progress deck in a new session
- **THEN** BOOTSTRAP directs a state/status resume ritual before 5-question intake

#### Scenario: BOOTSTRAP directs scanning _lessons_ on deck entry

- **WHEN** Agent opens an existing deck (new session or resumed)
- **THEN** BOOTSTRAP directs the agent to list all files in `_lessons/` and summarize key findings before proceeding
- **AND** the instruction appears alongside the `_state`/status resume ritual

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

All active root, charter, workflow, reference, playbook, scripts README, template guidance, and `openspec/config.yaml` context SHALL agree that Stage 2 is implemented inside `PPTMAKER_FRAMEWORK/scripts/`, new decks default to the current render policy, title edits branch by resolved render mode, generated-image rebuilding uses forced selected regeneration plus required review, structural changes create a clean version before affected-page refresh, and versions copy downstream source deltas rather than generated artifacts. Historical descriptions MAY remain only in explicitly historical documents.

#### Scenario: External skill path appears in active guidance

- **WHEN** the coherence test scans active framework guidance
- **THEN** no active document prescribes `image2-ppt`, `.claude/skills`, or `.agents/skills` as the production Stage 2 path

#### Scenario: Refresh-path summary is render-aware

- **WHEN** an active summary table describes title/kicker/subtitle changes
- **THEN** it distinguishes resolved `body+header-lock` Header Text & Style Refresh from resolved `full-page` Generated Image Rebuild
- **AND** it does not use a bare legacy alias as the execution explanation

#### Scenario: Version semantics are consistent

- **WHEN** an active document describes `--new-version`
- **THEN** it states that downstream source delta is copied and `_generated/` is clean
- **AND** it describes subsequent affected-slide work through the applicable refresh path
- **AND** it does not call the operation a complete deck-directory copy

#### Scenario: Generated image rebuild is force-aware

- **WHEN** active guidance documents rebuilding an existing selected image through raw `unified_pipeline`
- **THEN** it includes `--force-images` with `--only <ids>`
- **AND** it does not claim raw `--only` implies force

### Requirement: Editing-path terminology uses English canonical names and controlled legacy aliases

The English names Header Text & Style Refresh, Generated Image Rebuild, Notes-Only Refresh, and Structural Versioning Path SHALL be the only canonical editing-path names. Chinese guidance MAY provide a Chinese explanatory gloss when introducing an English term, but the gloss SHALL NOT be treated as a second formal name.

Active definitions SHALL explain that Header Text & Style Refresh changes resolved `body+header-lock` KICKER/TITLE/SUBTITLE text and Stage-3-owned overlay typography/layout only while the raw-image contract remains unchanged. Header safe-zone geometry, render-mode switches, generated body content, and other raw-image-contract changes SHALL be classified as Generated Image Rebuild.

Legacy aliases Header Text & Style Refresh (formerly Chain A), Generated Image Rebuild (formerly Chain B), Notes-Only Refresh (formerly Chain C), and Structural Versioning Path (formerly Structural) SHALL appear only in exact compatibility registries (`charter/WORKFLOW.md`, `reference/glossary.md`, `scripts/change-classifier.md`, `openspec/config.yaml`, and governing capability requirements), or in historical records. Every registry occurrence SHALL be paired in the same definition, sentence, or table row. Registry membership SHALL NOT permit legacy-only operational prose elsewhere in the same file. Other active operational guidance, playbooks, templates, tests, and code comments SHALL use canonical English terms or descriptive natural-language intent without bare legacy aliases.

#### Scenario: New maintainer learns the canonical vocabulary

- **WHEN** a new maintainer opens `charter/WORKFLOW.md` and its linked glossary or classifier
- **THEN** they see the three refresh-path names and Structural Versioning Path in English
- **AND** they can look up each former alias in one explicit compatibility mapping
- **AND** they understand that the letters are historical labels rather than acronyms

#### Scenario: Operational guidance has completed the migration

- **WHEN** coherence validation scans an active playbook, workflow example, template, test description, or code comment outside the compatibility registry
- **THEN** a bare editing-chain alias is reported as terminology drift
- **AND** an English canonical term is accepted

#### Scenario: Registry alias is paired locally

- **WHEN** a compatibility registry contains a former editing-path alias
- **THEN** the same definition, sentence, or table row contains the corresponding canonical English name
- **AND** a legacy-only operational example elsewhere in that registry file is rejected

#### Scenario: Unrelated A/B/C choices are not editing-chain aliases

- **WHEN** migrate/import guidance presents local strategy choices named A/B/C without the words Chain, 链, or an editing-path stage mapping
- **THEN** terminology validation does not flag those choices

### Requirement: Active framework guidance separates slide identity from order

Active root, charter, workflow, reference, scripts README, slide-template, and authoring guidance SHALL consistently define formal `slide_id` as stable page identity and physical slide-block order as the source of derived 1-based `position`. Human-facing examples SHALL display `position + slide_id + title` and SHALL explain that current position remains convenient for conversation while formal ID remains valid across insert, delete, reorder, title edit, and render-engine changes. No active guidance SHALL describe a compound value such as `07_UXGap`, a PowerPoint XML ID, or a position-prefixed filename as the source identity.

New-page guidance SHALL require an Agent-authored `SUBJECT + MOVE` BlockCase mnemonic containing 5–8 ASCII letters: five or six letters preferred and seven or eight accepted only when materially clearer, with examples such as `UXGap` and `AICost`. It SHALL reject one-word page categories, embedded page numbers, random tokens, and forced consonant compression as authoring strategies. New template/init sources SHALL declare `identity.scheme: mnemonic-v1`; existing sources without it and unique legacy IDs SHALL be described as readable compatibility identities that ordinary structural editing does not silently migrate.

Guidance SHALL state that render identity is keyed by stable slide ID, engine, artifact kind, and fingerprint rather than position; `_generated/` remains framework-owned and any cross-version reuse is verified materialization, never manual copying or editing. Cross-version automatic materialization SHALL be described as applying to expensive verified raw renders, while cheap target-local outputs are rebuilt. A file that is only `legacy-located` SHALL not be described as verified current provenance.

Structural guidance SHALL distinguish source-only version publication from production refresh: apply is bound to the confirmed preview plan, publishes vNext through hidden staging, and never silently invokes a remote renderer. Missing/stale raw artifacts SHALL be reported as `needs_render` and rebuilt only through an explicitly authorized Generated Image Rebuild. Guidance SHALL provide the escape ladder of heading-only current-version repair, same-deck vNext, explicit rebuild in vNext, and recommending a new deck when audience, goal, or narrative materially changes.

Guidance MAY recommend Git as a source/control safety and audit layer, but SHALL keep run-bundle `v1/v2` as the user-facing work version and SHALL NOT make Git or tracking `_generated/` a prerequisite of structural correctness. Concrete Git detection and installation guidance remains owned by a separate environment/bootstrap change.

#### Scenario: Agent authors a new deck

- **WHEN** active template or authoring guidance asks the Agent to choose slide IDs
- **THEN** it requests a durable two-block mnemonic independent of current position and title wording
- **AND** prefers a clear six-letter form over an unreadable five-letter compression
- **AND** writes the supported identity-scheme marker for a mnemonic-native source

#### Scenario: Existing deck still has numbered IDs

- **WHEN** guidance discusses a legacy ID such as `s07_problem` after it moves
- **THEN** it displays the current position separately and treats the old ID as stable compatibility text
- **AND** does not instruct ordinary reorder to rename every legacy ID

#### Scenario: Structural path documentation agrees on reuse

- **WHEN** active workflow or charter guidance describes reorder/delete-only work
- **THEN** it says verified expensive raw renders may be materialized into the clean next version while Stage 3 and later cheap outputs are rebuilt locally
- **AND** it preserves the prohibitions on hand-editing or manually copying `_generated/`

#### Scenario: Dual-render guidance consumes one identity model

- **WHEN** active guidance mentions future multiple render engines
- **THEN** it uses `(slide_id, render_engine, artifact_kind, fingerprint)` as logical artifact identity
- **AND** does not define an engine-specific slide ID or ordering model

#### Scenario: Structural apply finds an unproven render

- **WHEN** active guidance describes a vNext whose required raw render cannot be verified
- **THEN** it instructs the Agent to report `needs_render` and seek explicit Generated Image Rebuild authorization when cost is material
- **AND** does not claim structure authorization also authorized remote rendering

#### Scenario: Work no longer belongs in the same deck

- **WHEN** audience, objective, or narrative changes materially rather than merely shifting pages
- **THEN** guidance allows the Agent to recommend a new deck instead of forcing preservation in the current version chain
- **AND** presents that product choice to the user before forking

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
