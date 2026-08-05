## Purpose

Define the reusable PPT Maker Harness's Charter and Agent-facing guidance while
keeping Human, Agent, Harness, and Run Bundle ownership explicit and separate.

## ADDED Requirements

### Requirement: Harness guidance names one current production protocol

Active Harness guidance SHALL name `page-authority-image2-v2` as the sole
current production protocol and describe its version-level `framed` or `pure`
workflow choice. It SHALL not describe another protocol, per-slide authority,
compatibility, or historical adoption as an active workflow context. A non-v2
input may be mentioned only as the generic unsupported-protocol hard-stop.

#### Scenario: An active Harness workflow reference is read

- **WHEN** an Agent reads Harness Charter, BOOTSTRAP, or workflow guidance for a
  version
- **THEN** it receives the v2 once-per-version workflow decision and
  ownership-aware refresh guidance
- **AND** it does not receive a legacy protocol or compatibility path as a
  production choice

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

### Requirement: Harness guidance routes changes by ownership and invalidation

Active Harness guidance SHALL route Framed Text Frame-only edits to local
refresh, raw contract changes to raw rebuild, notes-only edits to notes refresh,
and structural changes to previewed exact-hash versioning. It SHALL present the
target method graph as `03-framed-image XOR 04-pure-image -> 05-delivery ->
06-iteration`, where the selected route owns its semantic rules and common
delivery owns final projection, complete-deck PPTX, notes injection, and
delivery review.

#### Scenario: A slide is reordered

- **WHEN** an Agent receives a reorder request
- **THEN** it enters Structural Versioning Path before any affected refresh work
- **AND** it does not treat the sibling workflows as sequential production
  stages or independent delivery owners

### Requirement: Agent Contract provides one bounded diagnostic handoff

The active Harness `AGENT_CONTRACT.md` SHALL define one non-persistent,
producer-owned diagnostic-recovery handoff. A current valid final CLI failure
envelope SHALL retain authority for the exact next action; the Agent SHALL not
reconstruct a category, retry policy, shell command, authorization, or state
record. The user-facing translation SHALL state, in order, what happened, what
it affects, what the Agent can mechanically do, and the one real human action
or confirmation required.

#### Scenario: A producer reserves a human decision

- **WHEN** a current valid producer diagnostic marks its next action as human
  required or reaches an existing confirmation boundary
- **THEN** the Agent names only that one current decision or confirmation
- **AND** it does not offer a second recovery menu, waiver, force path, or
  invented retry

### Requirement: Harness recovery preserves fixed authority precedence

The canonical Harness recovery handoff SHALL use this precedence: current valid
CLI failure envelope; otherwise startable main entry with a known exact run and
`state --json`; otherwise a supported Run Bundle locator; otherwise direct
environment recovery. Direct environment recovery SHALL remain a final,
pre-install-only branch and SHALL not displace a valid envelope, locate a Run
Bundle, select a workflow, or authorize provider work.

#### Scenario: A current envelope wins over later inspection

- **WHEN** a user has a known exact run and the immediately preceding CLI
  invocation returns a valid final failure envelope
- **THEN** the Agent consumes the producer-owned next action before considering
  state, a locator, or direct environment recovery
- **AND** it does not replace that action with generic inspection or recovery
