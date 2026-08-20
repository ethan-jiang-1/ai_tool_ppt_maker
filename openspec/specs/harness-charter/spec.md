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
