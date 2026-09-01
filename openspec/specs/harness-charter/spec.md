# Harness Charter Specification

## Purpose

Define active PPT Maker Harness guidance for Page Image Workflow production, ownership-aware
refresh, structural versioning, and bounded retired-input handling.

## Requirements

### Requirement: Harness guidance defines the external ownership boundary

Active Harness guidance SHALL identify the Human as owner of Deck content and
consequential approvals, the external Agent as owner of process orchestration,
the PPT Maker Harness as owner of reusable methodology and tools, and one Run
Bundle as owner of one Deck's working facts. The Harness SHALL not be described
as containing an Agent instance, owning Deck content, or providing global
cross-session lessons.

#### Scenario: Agent and Harness roles are introduced

- **WHEN** a maintainer or Agent reads the operating boundary
- **THEN** it can distinguish the external Agent from Harness source and the
  Run Bundle from reusable Harness material
- **AND** it learns that `_lessons/` remains local, non-secret knowledge for
  its one Run Bundle

### Requirement: Agent Contract defines one non-persistent diagnostic-recovery handoff

Active `AGENT_CONTRACT.md` guidance SHALL define one canonical diagnostic-recovery
handoff for an Agent responding to a user who is stuck or has received a CLI
failure. A current valid final CLI failure envelope remains the producer-owned
control fact; the handoff SHALL consume its bounded diagnostic and exact `next`
without reconstructing a category, recovery action, retry policy, shell command,
or authorization.

The handoff's novice diagnostic translation SHALL contain exactly these four
labeled parts, in this order:

1. what happened;
2. what it affects;
3. what the Agent can mechanically do; and
4. the one real human action or confirmation required.

The translation SHALL derive only from producer-owned bounded facts and current
owner inspection results. It SHALL not expose raw stderr, child output, stack
text, secrets, prompts, provider bodies, unbounded retry advice, or inferred
causality. When the current owner permits a mechanical action without a human
decision, the fourth part SHALL explicitly say that no human action is required;
when `requires_human` or an existing confirmation boundary applies, it SHALL
name only that one current human action and stop.

The handoff is conversational and SHALL not write or request a write to state,
receipts, grants, attempts, history, task projections, selected-route records,
or a new maintenance record.

#### Scenario: Producer permits a mechanical repair

- **WHEN** a current valid producer diagnostic has a non-human exact next action
- **THEN** the Agent presents all four parts and may perform only that
  owner-permitted mechanical action before rerunning its named checkpoint
- **AND** the human-action part explicitly states that no human decision is
  currently required

#### Scenario: Producer reserves a human decision

- **WHEN** a current valid producer diagnostic marks its next action as requiring
  a human or reaches an existing confirmation boundary
- **THEN** the Agent presents all four parts and names the one current decision
  or confirmation without performing it implicitly
- **AND** it does not offer a second recovery menu, waiver, force path, or
  invented retry

### Requirement: Agent Contract selects recovery authority in fixed precedence

The canonical handoff SHALL select recovery authority through this ordered
decision tree:

```text
current valid CLI failure envelope -> consume producer next
otherwise, startable main entry + known exact run -> state --json
otherwise, startable main entry + no exact run -> supported locator
otherwise, pre-install or unavailable main entry -> direct env-check
```

An invalid, missing, or truncated envelope SHALL not be mined for prose or
treated as a producer action. It remains an external/interrupted diagnostic
boundary under the existing consumer contract. It MAY therefore lead only to
the next applicable read-only discovery branch, never a guessed repair.

Direct `env-check` SHALL remain the final recovery-only branch: it SHALL not
displace a usable current envelope, inspect a known exact run, locate a run,
start a Controller, authorize provider work, or become an unbound normal
readiness substitute. The decision tree SHALL preserve the existing exact-run
and no-deck-scanning boundaries.

#### Scenario: A current envelope wins over later inspection

- **WHEN** a user has a known exact run and the immediately preceding CLI
  invocation returns a valid final failure envelope
- **THEN** the Agent consumes the producer-owned next action before considering
  `state --json`, the locator, or direct `env-check`
- **AND** it does not replace that action with a generic inspection or recovery

#### Scenario: No envelope resumes a known exact run

- **WHEN** no current valid failure envelope is available, the main entry is
  startable, and one exact run is known
- **THEN** the Agent obtains the current action through `state --json`
- **AND** it does not scan production directories or choose a different run

#### Scenario: Unlocated normal work uses the locator

- **WHEN** no current valid failure envelope is available, the main entry is
  startable, and no exact run is known
- **THEN** the Agent requests the supported `RUN_BUNDLE.md` or exact-path
  locator input
- **AND** it does not invoke direct `env-check` as a normal substitute

#### Scenario: Pre-install recovery remains narrow

- **WHEN** no current valid failure envelope is available and the Harness is
  pre-install or its main entry cannot start
- **THEN** the Agent uses the direct environment recovery entry for bounded
  local prerequisites
- **AND** it does not infer a run, Controller, provider authorization, or
  production continuation

### Requirement: Harness guidance names the current Page Image Workflow protocol

Active Charter, BOOTSTRAP, workflow, reference, command, and Agent guidance
SHALL name the schema-declared `page-image-workflow` source pipeline and the
matching state-owned `production_identity` record as the sole current Page
Image protocol. The source owns one version-level workflow choice, `framed` or
`pure`; State records that workflow and its `source_epoch` only after accepting
the exact source. `hybrid` describes Framed composition only and is never a
third workflow or per-slide choice. Active guidance SHALL not name, explain, or
route a historical marker, prompt cookbook, standalone route catalog, duplicate
workflow-inspection prose, converter, compatibility path, adoption path, or
automatic migration. A guidance surface that does not name its direct current
owner SHALL be absent from the active Harness.

#### Scenario: An Agent reads current production guidance

- **WHEN** an Agent opens active production guidance
- **THEN** it finds one declared source pipeline, selected workflow, and
  matching production-identity boundary
- **AND** it cannot select a historical protocol from that guidance

#### Scenario: An Agent reads active page-production guidance

- **WHEN** an Agent opens active production guidance
- **THEN** it finds one declared source pipeline, selected workflow, and
  matching production-identity boundary
- **AND** it finds no compatibility or migration instruction

#### Scenario: An Agent starts current work from guidance

- **WHEN** an Agent follows active Harness guidance for setup, new work, resume,
  change, or recovery
- **THEN** it reaches the applicable MD Controller or direct CLI owner without
  consulting a second routing registry or prompt cookbook
- **AND** it does not treat a prose summary as lifecycle or state authority

#### Scenario: Retired control prose is absent

- **WHEN** active Harness guidance is searched for retired prompt, route, or
  inspection-projection surfaces
- **THEN** no active entry or cross-reference exposes one
- **AND** archived OpenSpec and authorized Backlog records remain outside that
  active-surface assertion

### Requirement: Harness guidance defines the shared Page Image Core and Header Rendering Policy

Active guidance SHALL explain that Framed and Pure share one full-canvas Page
Image Core: canonical source owns meaning and required literals; the provider
composes the visual scene and provider-visible body, labels, metrics, diagram
text, quotes, callouts, and supporting copy. Pure has the provider render the
entire page including `kicker`, `title`, and `subtitle`. Framed adds a
transparent deterministic local overlay for only those three header fields and
sends their exact literals to the provider as context not to render. The
Framed Provider Avoidance Constraint is a composition constraint, not a blank
band or a text-free-page rule.

#### Scenario: Framed guidance does not assign callouts to a local frame

- **WHEN** an Agent reads active Framed composition guidance
- **THEN** it sees callouts and all non-header copy as provider-rendered
content
- **AND** it does not treat the local overlay as a general body renderer

### Requirement: Harness guidance routes changes by actual provider inputs

Active guidance SHALL classify Page Image changes from actual compiled
provider-input, protected-composition, raw-contract, and profile bindings. A
Framed title/subtitle/kicker literal changes provider context and normally
requires raw rebuild. A local overlay refresh is available only after the
owner proves every provider input and relevant deterministic contract is
unchanged. Notes-only changes remain delivery-owned; structural and
whole-workflow changes use previewed exact-hash versioning.

#### Scenario: Header change does not use stale raw evidence

- **WHEN** a current Framed title literal changes
- **THEN** active guidance directs the Agent to raw rebuild
- **AND** it does not advertise an unconditional local text refresh

### Requirement: Harness guidance presents one complete page review and shared delivery

Active guidance SHALL present the method graph as
`03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration`, with the
shared Page Image Core below the selected adapter boundary. Framed Complete
Page Review presents provider raw plus production-equivalent header composite;
Pure presents its complete provider page. One `proceed` or `repair` decision
governs that review. Shared delivery consumes only the common current final
manifest, then owns deck-level PPTX, notes, and final delivery review.

#### Scenario: Framed guidance does not add a composite gate

- **WHEN** an Agent follows current Framed review guidance
- **THEN** it receives one Complete Page Review decision containing both views
- **AND** it does not encounter a second header-composite approval

### Requirement: Harness guidance separates human CLI summaries from control identifiers

Active Charter and Agent guidance SHALL require an Agent that reports a successful direct Harness
CLI result to a person to give a bounded human summary of its purpose, outcome, and any next human
action. It SHALL use the result's domain identifiers rather than reproduce ordinary success JSON or
make a raw 64-hex digest the conversational status label. The Agent SHALL retain an exact full
SHA-256 only for the owner-controlled CLI command that requires it, unless the person explicitly
requests that exact identifier.

This requirement applies to successful `ppt_flow`, `style-master`, and `image2` operations. It
does not change the JS/CLI machine schema or the existing diagnostic-recovery path for non-zero
results; an Agent SHALL continue to consume the producer-issued failure envelope rather than
summarize a failure as if it were a successful status.

#### Scenario: Agent relays a structural preview

- **WHEN** a successful direct CLI structural preview returns an exact plan digest
- **THEN** the Agent reports the preview outcome and the existing next human confirmation in domain
  terms without reproducing the ordinary success payload or using the digest as its status label
- **AND** it retains that digest only for the exact apply command when the current owner requires it

#### Scenario: Person requests an exact identifier

- **WHEN** a person explicitly asks for the exact SHA-256 that the Agent retained for a current
  owner-controlled command
- **THEN** the Agent may provide that exact identifier with its control purpose
- **AND** it does not present an abbreviated display reference as an equivalent selector

#### Scenario: CLI reports a bounded failure

- **WHEN** a direct Harness CLI exits non-zero with a valid current diagnostic envelope
- **THEN** the Agent follows the existing producer-first diagnostic-recovery handoff
- **AND** it does not treat the human-success-summary rule as a replacement recovery path

### Requirement: Harness guidance makes Page Image inspection handoffs locatable

Active Charter and Agent guidance SHALL require an Agent that asks a person to inspect one or
more current Page Image artifacts to first rebuild the owner-issued Human Navigation Path tree
and to cite every requested artifact's short physical locator, type, and inspection purpose from
its index. Saying that an artifact was generated, opened, or available SHALL NOT replace its
short physical locator, and the Agent SHALL NOT hand a person an original SHA-named storage path.

When an Agent reports a current Page Image operation's status or asks a person for a review,
authorization, or delivery action, it SHALL use the rebuilt current navigation index as the human
display surface. It SHALL report stable slide/candidate IDs and the view's typed display references
and short physical locators where available. When the view marks an artifact unavailable, the
Agent SHALL report that bounded owner-issued availability fact and SHALL NOT invent a display
reference, a navigation copy, or an abbreviated selector.

The guidance SHALL describe a Human Navigation Path as a read/navigation target only. It SHALL
NOT grant hand-edit permission for `_generated/`, select a lifecycle record, authorize provider
work, record a review decision, or replace the existing guide, confirm, and hard-stop
classifications. A retained full SHA-256 remains internal to an owner-controlled command and is
never a human artifact-navigation path.

#### Scenario: Agent requests a Complete Page Review

- **WHEN** an Agent asks a person to inspect current Pure or Framed complete-page evidence
- **THEN** it cites the Human Navigation Path for every requested page or review projection,
  together with its artifact type and review purpose
- **AND** it preserves the existing owner-issued review decision and generated-artifact boundary

#### Scenario: Agent requests delivery inspection

- **WHEN** an Agent asks a person to inspect final PNG/PPTX, notes, or a delivery receipt
- **THEN** it gives the corresponding current short physical locator rather than a bare
  "delivered" or "opened" statement or a canonical storage locator
- **AND** it does not present a display reference or navigation path as an acceptance or
  authorization key

#### Scenario: Agent reports a planned current Page Image operation

- **WHEN** an Agent has a successful current Page Image plan and needs to report it to a person
- **THEN** it rebuilds the current navigation tree and reports the available typed display
  reference and short physical locator as its human display source
- **AND** it does not accept the display reference or navigation path as an input selector

#### Scenario: No human display reference is available

- **WHEN** the current navigation index marks a later-stage artifact unavailable
- **THEN** the Agent reports that bounded availability fact without inventing a path or exposing an
  unrelated full digest
- **AND** it preserves the owning workflow's existing next action and gate classification

### Requirement: Active Harness guidance exposes one terminology and authority hierarchy

Active repository and Harness entry guidance SHALL identify `openspec/specs/` as
the normative behavior contract and `CONTEXT.md` as the canonical terminology
reference. It SHALL direct run-bundle production through BOOTSTRAP, the Agent
Contract, and the applicable current Controller guidance, without making the
glossary, OpenSpec context, or another reference a competing Controller or
executable entry.

The repository-maintenance context in `openspec/config.yaml` SHALL expose one
bounded capability registry as a navigation projection. That registry SHALL
enumerate exactly once every immediate `openspec/specs/<capability>/spec.md`
capability and no other capability. Each entry SHALL identify its corresponding
main spec as normative behavior authority, state only a bounded routing
responsibility, and MAY cite current public owner surfaces. The marker-bounded
registry payload SHALL be one YAML mapping containing only its `capabilities`
sequence. Each capability record SHALL contain exactly `id`, `spec`, and
`scope`, with optional `owner_paths`; its `id` SHALL be lower-kebab case, its
`spec` SHALL equal `openspec/specs/<id>/spec.md`, and its owner paths SHALL be
unique literal strings.

Every cited surface SHALL be one literal repository-relative path to an existing
active file. A cited script SHALL be admitted by the existing source/test
ownership manifest as a registered interface or executable. A cited non-script
file SHALL be one of `ppt_maker_harness/AGENTS.md`,
`ppt_maker_harness/BOOTSTRAP.md`, `ppt_maker_harness/COMMANDS.md`, or
`ppt_maker_harness/README.md`; a Markdown document under the declared
`charter/`, `playbook/`, `workflow/`, or `reference/` source home; or a
Markdown/YAML definition file under the declared `schema/` home. This
source-root classification SHALL NOT become a capability-specific owner
allowlist. A cited surface SHALL NOT be a glob, private `internal/` module,
archived change, main-spec substitute, test, production `deck_*`/`dpt_*` data,
generated artifact, or an unclassified source file. The context SHALL NOT copy
another capability's detailed schema or contract.

Active guidance SHALL distinguish the `page-image-workflow` pipeline, the
version-level `production.workflow: framed|pure` selection, the retained private
Framed header-overlay runtime, and method-module/MD Controller workflow
guidance. It SHALL not reintroduce numeric lifecycle labels, render-mode
compatibility aliases, Chain aliases, a stale Stage 1-5 production route,
historical-reader or frozen-identifier policy, a retired whole-deck renderer or
visual-slot production branch, or an alternate Page Image protocol.

The existing provider-free Harness coherence checkpoint SHALL validate the
registry against the immediate main-spec directories and validate every cited
literal path before accepting the maintenance context. Missing, extra, or
duplicate capabilities; a missing or forbidden path; and an unreadable or
ambiguous registry SHALL hard-stop repository-maintenance verification with a
bounded root finding and the single nearest action to repair the named owning
source and rerun the same checkpoint. The check SHALL create no runtime state,
scan no Run Bundle, invoke no provider, and offer no waiver, force path,
fallback registry, or competing pass/fail projection.

#### Scenario: Agent begins repository maintenance

- **WHEN** an Agent enters the repository to maintain the Harness
- **THEN** its injected context identifies every current main-spec capability
  exactly once and binds it to its normative spec plus only existing public
  owner surfaces
- **AND** it treats that context as navigation rather than a replacement for an
  owning specification, Controller, CLI, or run-bundle source of record

#### Scenario: Capability projection disagrees with main specs

- **WHEN** the capability registry omits a main spec, names an unbacked
  capability, or repeats a capability
- **THEN** the existing coherence checkpoint rejects the projection before
  accepting dependent path claims
- **AND** it identifies the direct mismatch and tells the Agent to repair the
  registry or owning main-spec source, then rerun the same checkpoint

#### Scenario: Capability projection cites a stale or unadmitted owner path

- **WHEN** a registry entry cites a missing path, glob, private implementation,
  archive record, main-spec substitute, test, production-data path, generated
  artifact, unadmitted script, or existing but unclassified source file
- **THEN** the existing coherence checkpoint rejects that literal owner claim
- **AND** it does not search for an alternative implementation or silently
  treat a nearby file as authority

#### Scenario: Planted authority drift proves guard sensitivity

- **WHEN** focused verification supplies safe synthetic missing-capability,
  extra-capability, duplicate-capability, or stale-path input to the same
  evaluator used by repository coherence
- **THEN** each violation is detected with no repository mutation
- **AND** restoring the exact valid input makes the same checkpoint pass

#### Scenario: Agent begins deck production

- **WHEN** an Agent enters a current run-bundle production route
- **THEN** the active guidance distinguishes pipeline, selected workflow,
  private Framed runtime, and method-module/Controller meanings before
  directing the existing entry route
- **AND** it does not offer lifecycle numbering, render aliases, refresh Chain
  aliases, retired renderer/visual-slot branches, historical-reader handling,
  or a second Page Image workflow as a current choice

### Requirement: Active capability guidance preserves one declared source and recovery path

Active Charter, setup, reference, and Run Bundle tree guidance SHALL describe
the Image2 provider profile as the Deck Author's one non-secret
route-capability declaration at its canonical visual-style source and the
matching `IMAGE2_PROVIDER_PROFILE_ID` as environment-owned runtime selection.
The confirmed page-image operation embeds the Image2 Call Shape value. The
guidance SHALL distinguish both from credentials, endpoint URLs, Page
Design System, presentation profiles, State, inspection, authorization,
provider evidence, and Lab trials.

Before Style Master or Page Image provider-facing planning, guidance SHALL
direct the Agent to obtain a confirmed owner declaration when the source is
pending or invalid, record only the owning source/environment facts, and rerun
the same owner checkpoint. A valid producer diagnostic remains the sole
recovery control fact: guidance SHALL consume its existing category and next
action rather than recreate profile classification or a repair table.

`ppt_flow probe` SHALL be described as declared-Call-Shape connectivity only.
Image2 Lab SHALL be described as the discovery owner for unconfirmed
candidates. Neither live success SHALL confirm a profile, route, model,
budget, unit, prompt fit, authorization, or future provider work. Empty `_lab/`
SHALL NOT be described as a blocker for PPT flow when the named default or a
confirmed Call Shape is in force.

This guidance adds no Task Mandate, provider authorization, human cost
confirmation, Controller branch, State record, fallback, or capability
inference. It SHALL NOT describe `--smoke` or `--probe-vendors` as current
capability proof.

#### Scenario: Pending declaration remains source-owned

- **WHEN** active guidance reaches an Image2 provider-profile source that is
  absent, pending, or rejected by its owner validator
- **THEN** it directs the Agent to obtain the Deck Author's one capability
  declaration, repair only the owning source, and rerun the same checkpoint
- **AND** it does not infer facts from a credential, endpoint, model alias,
  Lab trial, probe result, prior plan, or provider failure

#### Scenario: Runtime selection and live diagnosis stay bounded

- **WHEN** active guidance covers raw-generation readiness or an Image2
  diagnostic
- **THEN** it distinguishes the environment-owned runtime profile ID from the
  source declaration, treats probe success as declared-Call-Shape connectivity
  only, and names Lab for candidate discovery
- **AND** it does not describe readiness as authorization, prompt-budget proof,
  or a replacement for provider-free planning

#### Scenario: Producer diagnostic remains the recovery authority

- **WHEN** a direct CLI returns a valid profile, runtime, budget, or stale-plan
  diagnostic
- **THEN** the Agent follows the existing diagnostic-recovery handoff and its
  one producer-issued next action
- **AND** active guidance does not add a second profile repair route, waiver,
  retry, or fallback

#### Scenario: Empty lab is not a drawing blocker

- **WHEN** active guidance describes a Run Bundle whose `_lab/` has no trials
- **THEN** it states that PPT flow uses the confirmed or named-default Call
  Shape
- **AND** it does not require a Lab trial before generate

### Requirement: Repository agent-facing knowledge follows the one-fact-one-home principle

The repository SHALL maintain exactly one authoritative home for every fact about
the project's standing rules, technology choices, and directory layout. Every
other occurrence of that fact SHALL be a link or symlink to the home, never a
duplicate copy.

At the repository root specifically:
- `CLAUDE.md` SHALL be a symlink pointing to `AGENTS.md` when both exist at the
  root. A standalone `CLAUDE.md` that repeats content from `AGENTS.md` violates
  the one-home principle.
- Subtree `CLAUDE.md` files (such as `ppt_maker_harness/CLAUDE.md`) are not
  covered by this requirement — they may serve other roles (e.g., redirect to a
  different entry file) and follow their own owning capability.

#### Scenario: Root CLAUDE.md is a symlink

- **WHEN** a maintainer runs `ls -l /repo-root/CLAUDE.md`
- **THEN** it reports `/repo-root/CLAUDE.md -> /repo-root/AGENTS.md`
- **AND** the file contains no original content beyond the symlink target reference

#### Scenario: Root AGENTS.md content is not duplicated

- **WHEN** a maintainer or Agent searches for a standing rule or tech-stack fact
- **THEN** that fact appears in exactly one home (`AGENTS.md`, a subtree
  `AGENTS.md`, or an owner file linked from `AGENTS.md`)
- **AND** grepping `CLAUDE.md` for the same fact does not return a duplicate

#### Scenario: Agent accesses repo standing rules

- **WHEN** an Agent loads the repo for any task
- **THEN** it resolves `CLAUDE.md` through the symlink to `AGENTS.md`
- **AND** it reads the complete set of standing rules from `AGENTS.md` alone

### Requirement: Decision records have a readable lifecycle status

Every entry in `docs/adr/` SHALL carry a `## Status:` line using exactly one of the
following controlled values: `Proposed`, `Accepted`, `Superseded`, `Rejected`,
`Archived`. The status SHALL appear within the file's first 5 lines, preceded by
`## ` (for example, `## Status: Accepted`).

The meaning of each status:
- `Proposed`: under consideration, not yet agreed
- `Accepted`: current active decision
- `Superseded`: replaced by a later ADR
- `Rejected`: considered and declined; negative knowledge
- `Archived`: historical, no longer relevant

An Agent reading a decision record SHALL rely on this status line to distinguish
current from historical or rejected decisions.

#### Scenario: ADR status is machine-readable

- **WHEN** an Agent reads any file under `docs/adr/`
- **THEN** it finds a `## Status:` line within the first 5 lines
- **AND** the value is exactly one of the five controlled terms

#### Scenario: Rejected decision is not treated as current

- **WHEN** an Agent encounters a decision record with `## Status: Rejected`
- **THEN** it treats it as negative knowledge (why a path was not taken)
- **AND** it does not propose implementing that rejected approach unless new
  evidence explicitly reopens the question

### Requirement: Negative knowledge has a documented home

The repository SHALL maintain one file that records known limitations and
rejected design paths. This file SHALL live at `docs/known-limitations.md` and
serve as the home for all negative knowledge — decisions actively rejected,
capabilities explicitly out of scope, and infrastructure paths that were
considered and declined.

Each entry SHALL specify:
- What was considered or requested
- Why it was rejected or is a known limitation
- The date or context of the decision

This requirement SHALL NOT block the addition of negative knowledge at other
homes (such as in code comments or inline ADR notes). It establishes one
guaranteed home for discovery.

#### Scenario: Agent discovers rejected paths

- **WHEN** an Agent encounters a user suggestion that matches a known rejected
  approach
- **THEN** it can find that rejection in `docs/known-limitations.md`
- **AND** it explains why the path was declined rather than silently revisiting it

#### Scenario: New negative knowledge is recorded

- **WHEN** a maintainer rejects a design path during an OpenSpec change
- **THEN** they add an entry to `docs/known-limitations.md`
- **AND** the entry includes what was considered and why it was rejected

### Requirement: Bootstrap guidance names the canonical Harness entry

Bootstrap and top-level onboarding guidance SHALL identify
`ppt_maker_harness/BOOTSTRAP.md` as the Harness startup document and
`ppt_maker_harness/scripts/ppt_flow.mjs` as the canonical production entrypoint.
It SHALL not present a retired source root as a supported startup path.

#### Scenario: An Agent begins Harness startup

- **WHEN** an Agent follows active onboarding for PPT work or local readiness
- **THEN** it enters through the Harness BOOTSTRAP document and its current CLI
  entrypoint
- **AND** it does not infer a production Run Bundle or compatibility route

### Requirement: Fix instructions are user-profile-aware

Each fix section in BOOTSTRAP.md Step 1 SHALL distinguish users with an existing coding agent from bare-metal users, but SHALL NOT assume that the coding-agent installation already provides a supported Node line. For the coding-agent profile, guidance SHALL verify the current Node major first, upgrade when it is outside `22.x`/`24.x`/`26.x`, then use repository-local `npm install` and Chromium setup commands. For bare-metal users, guidance SHALL install current LTS `24.x` plus npm before repository setup while naming `22.x` and `26.x` as the other supported lines. Image2 credential setup SHALL appear only when the user selects or reaches an Image2-dependent action.

#### Scenario: Agent user missing npm packages

- **WHEN** the user has Claude Code or Codex and doctor shows a supported Node major but missing npm packages
- **THEN** the Agent gives one repository-root `npm install` command and the explicit Chromium setup command
- **AND** does not tell the user to reinstall Node or configure Image2

#### Scenario: Coding-agent user has Node 20

- **WHEN** the user has a coding agent but doctor reports Node 20 below the required baseline
- **THEN** the Agent provides a platform-specific supported-Node upgrade path, recommending current LTS `24.x`, before npm/browser setup
- **AND** does not assume the coding agent's own runtime satisfies the Harness

#### Scenario: Bare-metal user missing Node.js

- **WHEN** doctor reports `FOUNDATION NOT READY` and the user has no coding agent installation
- **THEN** the Agent provides full current-LTS Node.js `24.x` installation instructions per platform and names the supported `22.x`/`24.x`/`26.x` profile
- **AND** only after Node/npm are confirmed proceeds to `npm install` and Chromium setup

#### Scenario: User profile is unknown

- **WHEN** the Agent cannot determine whether the user has a coding agent installed
- **THEN** the Agent presents the verify-existing-Node path first
- **AND** follows with the bare-metal current-LTS Node 24 installation path as fallback while naming the supported `22.x`/`24.x`/`26.x` profile

### Requirement: Fix instructions are copy-pasteable by beginners

Each fix instruction SHALL use concrete, copy-pasteable commands in fenced code blocks. It SHALL NOT use abstract descriptions like "install the required packages" without the exact command. Platform-specific alternatives SHALL be clearly labeled. Where a single command works across platforms, only one code block SHALL be shown.

#### Scenario: Beginner copies a fix command

- **WHEN** the user sees a fix instruction in the Agent's response
- **THEN** the instruction includes at least one fenced code block with the exact command to copy and paste
- **AND** multi-platform variants are labeled (e.g., "macOS / Linux:" and "Windows PowerShell:")

#### Scenario: No abstract placeholders

- **WHEN** reviewing any fix instruction in BOOTSTRAP.md Step 1
- **THEN** no fix instruction says "ensure the packages are installed" without providing the specific `npm install` command
- **AND** every required action has a corresponding executable command

### Requirement: External file references are for human readers only, not required for agents

BOOTSTRAP.md Step 1 MAY reference `workflow/00-setup/00-zero-to-ready.md`, `workflow/00-setup/02-nodejs-environment.md`, and `workflow/00-setup/03-runtime-and-tools.md`. These references SHALL be explicitly marked as human background reading (labeled "给人类读者的背景阅读" or similar), and the Agent SHALL NOT be required to read them to guide a user through environment repair. The BOOTSTRAP text SHALL make clear to the Agent that the inline sections are sufficient and external files are not part of the remediation path.

#### Scenario: Agent completes env fix without external files

- **WHEN** the Agent successfully guides a user through all failing doctor checks
- **THEN** the Agent has done so using only the inline sections in BOOTSTRAP.md Step 1
- **AND** has not read `00-zero-to-ready.md`, `02-nodejs-environment.md`, or `03-runtime-and-tools.md`

#### Scenario: External reference is clearly marked for humans

- **WHEN** a human reader encounters a link to `02-nodejs-environment.md` in BOOTSTRAP Step 1
- **THEN** the link is accompanied by text indicating it is background reading for humans (e.g., "给人类读者的背景阅读")
- **AND** the Agent can skip it without missing anything needed for remediation

### Requirement: BOOTSTRAP provides optional, scope-honest Git startup guidance

BOOTSTRAP.md Step 1 SHALL contain a `### git` section synchronized to the `environment-check` base check name. The section SHALL say that Git is optional for producing PPTs but recommended for user-owned source history and comparison, and that a Git-only warning permits continuing after the existing hard requirements pass. It SHALL explain that doctor observes only the directory from which it was invoked; its result does not prove that a future or separately located deck has Git protection.

The section SHALL include copy-pasteable installation and `git --version` verification commands for macOS, Linux, and Windows. It SHALL distinguish the existing coding-agent path (verify first; an absent Git executable is an optional install) from the bare-metal path (platform installation guidance), consistent with the general BOOTSTRAP profile contract. It SHALL explain that, when a user wants Git protection for a deck, the Agent and user first identify and explicitly confirm a project root containing the desired source before any user-chosen `git init`. If the Agent needs to inspect whether that target root is already inside a worktree, it SHALL obtain separate explicit authorization for that named inspection and scope; doctor does not answer it. It SHALL explicitly prohibit initialization inside `_generated/` or a single `3_versions/vN/` leaf, and SHALL say that an existing ancestor worktree must not receive a nested initialization. An unconfirmed-worktree or no-verifiable-history warning SHALL be explained as non-blocking; a first checkpoint is a user choice, not a doctor repair step. The section SHALL not direct a user to run `git status` as an environment-repair diagnostic.

#### Scenario: Agent maps Git warning to self-contained guidance

- **WHEN** doctor reports `△ git: warn`
- **THEN** the Agent finds the matching `### git` section in BOOTSTRAP Step 1
- **AND** tells the user that work may continue while offering the applicable install, current-directory, or safe-root explanation

#### Scenario: Beginner receives platform-specific Git setup commands

- **WHEN** a user has no usable Git executable
- **THEN** the BOOTSTRAP `git` section provides labeled macOS, Linux, and Windows installation commands plus `git --version` verification
- **AND** it does not require Node.js, Image2 credentials, a Git remote, or a commit to complete the Git setup advice

#### Scenario: Current worktree is not confused with deck protection

- **WHEN** doctor identifies its current invocation directory as inside a worktree
- **THEN** BOOTSTRAP guidance tells the Agent not to infer that a later or separately located deck is tracked
- **AND** it requires a user-confirmed project root before recommending a user-run initialization for that deck

#### Scenario: Existing worktree avoids nested initialization

- **WHEN** the user has confirmed that the intended project root is already inside an existing worktree
- **THEN** BOOTSTRAP guidance tells the Agent not to run a nested `git init`
- **AND** does not treat the detected worktree or a first commit as a requirement to create or continue a deck

### Requirement: Git checkpoint guidance is recommendation-only and context-bounded

BOOTSTRAP and its Agent-facing startup guidance SHALL permit an Agent to make at most one concise, user-owned source-checkpoint recommendation per continuous source-work episode after initial real source authoring, before an important structural change when the Agent knows from current interaction that it edited meaningful source, after a validated vNext, or at final delivery/archival. The guidance SHALL define an episode as the current interaction's continuous substantive source work for one deck; a decline or deferral suppresses every further reminder until that episode ends, and a later interaction or different deck begins a new episode. The guidance SHALL state that this recommendation is not authorization and does not require hidden working-tree inspection.

The Agent and Harness SHALL NOT automatically initialize a repository, stage files, commit, push, pull, change a remote, run a Git restore/reset/checkout/clean/read-tree operation, discard working-tree changes, inspect worktree cleanliness, or require a clean worktree. After explicit user authorization for a named Git operation and user-supplied scope, an Agent MAY assist with that exact operation; it SHALL restate that operation and scope and SHALL NOT infer files, staged changes, or effect from hidden inspection. Ordinary checkpoint authorization does not authorize `git status`, `git diff`, or another inspection, each of which requires separately named user direction and scope. This change supplies no Git-history reader, automated source replacement, or default recovery protocol. Absent authorization it SHALL not mutate Git state. A user who declines Git installation, initialization, or checkpoint work SHALL continue the applicable deck workflow after existing hard gates pass.

#### Scenario: Agent recommends but does not create a checkpoint

- **WHEN** an Agent reaches a stated checkpoint opportunity and knows from the current interaction that source work has occurred
- **THEN** it may explain the value of preserving user-owned source history and ask whether the user wants a Git action
- **AND** neither doctor nor the pipeline probes worktree cleanliness, creates a repository, or creates a commit as a side effect

#### Scenario: User declines Git setup or checkpoint

- **WHEN** a user declines installation, initialization, or a checkpoint
- **THEN** the Agent continues the applicable deck workflow after existing hard gates pass
- **AND** it does not frame the decision as skipping Structural Versioning Path or source validation

### Requirement: Bootstrap exposes current Page Image Workflow readiness without false local-refresh claims

Active BOOTSTRAP and top-level onboarding SHALL describe operation-scoped
readiness only for the current `page-image-workflow` contract declared by the
schema serialization inventory. They SHALL state that ordinary foundation
checks are offline, credentials are needed only when the selected operation
submits to Image2, and live Image2 work is either `ppt_flow probe <run-dir>`
for a confirmed Call Shape or Image2 Lab for candidate discovery. They SHALL
NOT name `env-check --smoke`, `--probe-vendors`, a version-suffixed, retired,
compatibility, or alternative production contract as current live work.

#### Scenario: An Agent starts current raw-generation readiness

- **WHEN** BOOTSTRAP directs an Agent to prepare current Page Image raw work
- **THEN** it names the one schema-declared current workflow and the applicable
  operation-scoped credential check
- **AND** it does not present a historical or parallel workflow as usable input

#### Scenario: Framed local readiness is scoped correctly

- **WHEN** a user prepares only local Framed work
- **THEN** guidance distinguishes local readiness from Image2 submission readiness
- **AND** it does not imply an obsolete workflow contract

#### Scenario: Fresh onboarding selects a current policy later

- **WHEN** onboarding completes before a workflow is selected
- **THEN** it defers that choice to the current source-authoring step
- **AND** it does not preselect a historical marker

#### Scenario: Live Image2 is probe or Lab

- **WHEN** BOOTSTRAP covers Image2 connectivity or vendor-call discovery
- **THEN** it names `ppt_flow probe` or Lab rather than env-check live flags
- **AND** it states that empty `_lab/` does not block drawing

### Requirement: Public initialization guidance has one supported command entry

Active user and Agent onboarding SHALL name `ppt_flow init` as the supported
public command for creating a Run Bundle. It MAY identify
`bundle_layout.mjs --init` as the layout owner's lower-level interface, but
SHALL not present it as a competing user startup route, a different Run Bundle
contract, or an alternative workflow initializer.

#### Scenario: A new Deck Author starts a Run Bundle

- **WHEN** onboarding guidance directs a new Deck Author to create a Run Bundle
- **THEN** it presents the current `ppt_flow init` route
- **AND** any layout-owner reference preserves the same current initialization
  contract without requiring the person to choose an initializer
