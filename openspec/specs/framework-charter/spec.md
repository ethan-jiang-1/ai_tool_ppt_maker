# Framework Charter Specification

## Purpose

Define active framework guidance for Page Authority production, ownership-aware
refresh, structural versioning, and bounded historical adoption.
## Requirements
### Requirement: Framework guidance names one current production protocol
Active framework guidance SHALL name `page-authority-image2-v2` as the sole current production protocol and describe its version-level Framed/Pure workflow choice. It SHALL not describe another protocol, per-slide authority, compatibility, or historical adoption as an active workflow context. A non-v2 input may be mentioned only as the generic unsupported-protocol hard-stop.

#### Scenario: An active workflow reference is read
- **WHEN** an Agent reads Charter, BOOTSTRAP, or workflow guidance for a version
- **THEN** it receives the v2 once-per-version workflow decision and ownership-aware refresh guidance
- **AND** it does not receive another protocol or compatibility path as a production choice

### Requirement: Framework guidance routes changes by ownership and invalidation

Active guidance SHALL route Framed Text Frame-only edits to local refresh, raw
contract changes to raw rebuild, notes-only edits to notes refresh, and structural
changes to previewed exact-hash versioning.

#### Scenario: A slide is reordered

- **WHEN** an Agent receives a reorder request
- **THEN** it enters Structural Versioning Path before any affected refresh work

### Requirement: Framework guidance presents sibling workflows and shared delivery

Active framework guidance SHALL present the target method graph as
`03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration`. It SHALL
explain that the selected workflow owns its semantic rules and publishes a
common final-slide manifest; shared delivery owns final projection, complete-deck
PPTX, notes injection, and delivery review. It SHALL preserve the ownership and
invalidation rule that structural and whole-workflow changes use a previewed
exact-hash vNext path.

#### Scenario: Target workflow root is read

- **WHEN** an Agent opens the active target workflow root
- **THEN** it can identify one selected sibling route followed by shared delivery and iteration
- **AND** it does not read `03` and `04` as sequential production stages or independent delivery owners

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

- **WHEN** no current valid failure envelope is available and the framework is
  pre-install or its main entry cannot start
- **THEN** the Agent uses the direct environment recovery entry for bounded
  local prerequisites
- **AND** it does not infer a run, Controller, provider authorization, or
  production continuation
