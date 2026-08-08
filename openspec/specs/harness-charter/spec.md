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

Active Charter, BOOTSTRAP, workflow, reference, and Agent guidance SHALL name
`page-image-workflow-v1` with matching `image2-page-workflow-v1` state as the
sole current page-production protocol. It SHALL require one version-level
workflow choice, `framed` or `pure`; `hybrid` describes Framed composition only
and is never a third workflow or per-slide choice. Active guidance SHALL name
`page-authority-image2-v2` only as unsupported historical input with no
converter, compatibility, adoption, or automatic migration route.

#### Scenario: An Agent reads active page-production guidance

- **WHEN** an Agent opens Charter or workflow documentation for a current
  version
- **THEN** it receives the replacement workflow identity and one selected
  policy
- **AND** it does not receive Page Authority v2 as a production option

### Requirement: Harness guidance defines the shared Page Image Core and Header Rendering Policy

Active guidance SHALL explain that Framed and Pure share one full-canvas Page
Image Core: canonical source owns meaning and required literals; the provider
composes the visual scene and provider-visible body, labels, metrics, diagram
text, quotes, callouts, and supporting copy. Pure has the provider render the
entire page including `kicker`, `title`, and `subtitle`. Framed adds a
transparent deterministic local overlay for only those three header fields and
sends their exact literals to the provider as context not to render. The
Framed protected zone is a composition constraint, not a blank band or a
text-free-page rule.

#### Scenario: Framed guidance does not assign callouts to a local frame

- **WHEN** an Agent reads active Framed composition guidance
- **THEN** it sees callouts and all non-header copy as provider-rendered
content
- **AND** it does not treat the local overlay as a general body renderer

### Requirement: Harness guidance routes changes by actual provider inputs

Active guidance SHALL classify Page Image changes from actual compiled
provider-input, protected-geometry, raw-contract, and profile bindings. A
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

### Requirement: Harness guidance makes Page Image inspection handoffs locatable

Active Charter and Agent guidance SHALL require an Agent that asks a person to inspect one or
more current Page Image artifacts to first rebuild the owner-issued human artifact reference view
and to cite every requested artifact's locator, type, and inspection purpose. Saying that an
artifact was generated, opened, or available SHALL NOT replace its locator.

The guidance SHALL describe the locator as a read target only. It SHALL NOT grant hand-edit
permission for `_generated/`, select a lifecycle record, authorize provider work, record a review
decision, or replace the existing guide, confirm, and hard-stop classifications.

#### Scenario: Agent requests a Complete Page Review

- **WHEN** an Agent asks a person to inspect current Pure or Framed complete-page evidence
- **THEN** it cites the reference-view locator for every requested page or review projection,
  together with its artifact type and review purpose
- **AND** it preserves the existing owner-issued review decision and generated-artifact boundary

#### Scenario: Agent requests delivery inspection

- **WHEN** an Agent asks a person to inspect final PNG/PPTX, notes, or a delivery receipt
- **THEN** it gives the corresponding current reference-view locator rather than a bare
  "delivered" or "opened" statement
- **AND** it does not present a display reference or locator as an acceptance or authorization key
