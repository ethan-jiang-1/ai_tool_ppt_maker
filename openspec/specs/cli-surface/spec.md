# CLI Surface Specification

## Purpose

Define every registered direct Node CLI and the fixed 12-command unified entry
point. The CLI producer owns its JSON diagnostics, current Page Authority routing,
and bounded historical adoption/repair responses; Controller consumers do not copy
that schema.

## Requirements

### Requirement: Public CLI exposes only Page Authority production operations

The public CLI SHALL expose v2 Page Authority source validation, Style Master candidate inspection/planning,
authorization, generation/progress, review, acceptance/promotion, and exact unknown-plan abandonment; page raw planning, authorization,
generation, review, final delivery, Framed local refresh, notes refresh, and structural versioning. The
Style Master command family SHALL operate only on one exact v2 scope as defined below and shall expose no legacy
mode, adoption/migration command, direct provider request, arbitrary prompt/path/provider/profile/scope
override, caller nonce/generation, `--force`, inferred authorization, or retry flag. A fresh-v2 authoring draft
after its selected workflow is authored is an allowed pre-raw scope. Style Master inspection/planning SHALL
perform read-only selected-workflow candidate-source validation for that scope without requiring a materialized
source receipt or invoking a mutating source-validation prerequisite; commands SHALL NOT materialize its page
source receipt, production-mode record, target evidence, raw plan, or source epoch.

`style-master` SHALL be one registered top-level unified command family, not an unregistered direct script or
an overloaded page-raw operation. The checked-in CLI inventory currently has 11 registered top-level commands;
the inventory, help assertions, and any command-count contract SHALL be updated atomically to 12. Implementation
SHALL explicitly correct the main `cli-surface` Purpose from its stale `fixed 14-command` claim to say
`fixed 12-command unified entry point`, because delta sync does not rewrite that section.

Its fixed forms SHALL be:

```text
ppt_flow style-master inspect <run-dir> [--plan-hash <sha256>]
ppt_flow style-master plan <run-dir> --candidate-count <0..4>
ppt_flow style-master authorize <run-dir> --plan-hash <sha256>
ppt_flow style-master generate <run-dir> --plan-hash <sha256>
ppt_flow style-master review <run-dir> --plan-hash <sha256>
ppt_flow style-master accept <run-dir> --plan-hash <sha256> --decision proceed --candidate-id <slot-id>
ppt_flow style-master accept <run-dir> --plan-hash <sha256> --decision repair|redirect
ppt_flow style-master abandon <run-dir> --plan-hash <sha256> --reason <text>
```

`<run-dir>` resolves the one scope tuple. `inspect` returns the exact current lifecycle head, plan, attempt,
derived grant-consumption/progress, and next action without mutation. `plan` materializes a provider-free
immutable candidate plan or idempotently returns the matching nonterminal plan; `review` and inspection do not
submit to a provider. Without `--plan-hash`, inspect resolves the current head; with it, the supplied digest is
an exact current-head assertion. A stale assertion SHALL fail with the current inspect action and SHALL NOT
project a historical plan as current or actionable. `review` and `accept` reject omitted/stale plan hashes,
except that `accept proceed` MAY
exact-replay the plan/decision/candidate still named by the current selection record after the lifecycle head
advances. `accept` also rejects
an absent or ambiguous `proceed` candidate ID, and candidate IDs attached to `repair` or `redirect`.
`authorize` and `generate` reject a zero-generated local plan because it has no provider cost. `abandon`
requires the exact current unknown plan and a human reason canonicalized by the Style Master owner to NFC,
with each Unicode-whitespace run folded to one ASCII space, no remaining C0/C1 controls, and `1..512`
normalized UTF-8 bytes; it preserves the unknown attempt, and
does not create or authorize a successor. An exact abandonment replay MAY return its immutable record after
successor head advancement. A pre-submit `claimed` attempt remains on the exact generate action;
reissuing that exact command resumes the same attempt rather than creating a retry.

For a nonzero current plan, `authorize` SHALL create or exact-return the one owner-validated canonical candidate
grant and its external `candidate_grant_sha256`; it SHALL not overwrite a divergent grant, mint another grant for
the same plan, or report authorization before the persisted grant can be reread and cross-checked by `generate`.
`generate` and `abandon` SHALL expose only the owner-validated exact attempt or abandonment fact; malformed or
cross-bound direct records are hard failures, not grounds to reinterpret a retry, unknown outcome, or plan
terminality from CLI prose.

#### Scenario: Help has no other-protocol choice

- **WHEN** a user requests public CLI help
- **THEN** every production operation is v2 Page Authority-owned
- **AND** no historical, adoption, compatibility, or migration route is listed

#### Scenario: Unified inventory includes Style Master exactly once

- **WHEN** the registered CLI inventory, main `cli-surface` Purpose, help, and coherence checks are evaluated
- **THEN** they describe one fixed 12-command unified entry with one top-level `style-master` family
- **AND** they do not retain the stale fixed-14 claim or count Style Master as a direct executable twice

#### Scenario: Style Master plan and inspection are provider-free

- **WHEN** a user requests the current Style Master plan or inspection/progress projection for one valid run
- **THEN** the CLI returns or materializes the owner-issued one-tuple scope, head generation/predecessor,
  candidate count, cost boundary, intent/context/profile identities, ordered candidate IDs, and next action
  without provider submission
- **AND** it does not create a page raw plan, authorization, evidence, source epoch, or final artifact

#### Scenario: Inspect plan hash is a current-head assertion

- **WHEN** `inspect --plan-hash` names a plan that is no longer the scope head
- **THEN** the CLI rejects the stale assertion and returns the owner-issued current inspect action
- **AND** it does not expose the historical plan as executable progress, abandonment, review, or promotion state

#### Scenario: Fresh Style Master source validation is read-only

- **WHEN** Style Master inspect or plan resolves an active fresh-v2 draft with an authored selected workflow
- **THEN** it validates current source bytes through the selected workflow's read-only candidate-source path
- **AND** it does not require or create a source receipt/state pair or invoke the materializing source-validation action

#### Scenario: Fresh CLI routing follows manifest-owned pre-raw nodes

- **WHEN** a fresh create-deck execution advances from workflow selection through its selected Style Master branch
- **THEN** CLI draft routing consumes the node-declared, controller-manifest-validated ordered `draft_route: true` projection instead of one literal node, phase inference, or a copied node list
- **AND** another controller, unknown/sibling/post-raw node, or existing production mode fails before Style Master mutation or provider initialization

#### Scenario: Candidate authorization cannot become page authorization

- **WHEN** a user authorizes an exact Style Master candidate plan
- **THEN** the CLI binds the grant only to that candidate plan and its disclosed maximum submissions
- **AND** a subsequent page raw command still requires its own exact page-raw authorization

#### Scenario: Authorization replay returns one grant identity

- **WHEN** `style-master authorize` is replayed for the same valid current nonzero plan
- **THEN** it returns the existing exact canonical grant and its same `candidate_grant_sha256`
- **AND** a malformed or divergent existing grant blocks before provider initialization rather than being replaced

#### Scenario: CLI never infers a terminal candidate record

- **WHEN** `generate`, `inspect`, or `abandon` encounters an attempt or abandonment record with an invalid
  canonical field/digest binding
- **THEN** it returns the owner-issued hard failure before provider work or successor planning
- **AND** it does not infer a retry, failed outcome, cost consumption, or plan closure from the file name or text

#### Scenario: Local-only plan skips authorization

- **WHEN** the exact current plan contains one local-existing candidate and zero generated slots
- **THEN** inspect routes directly to exact-hash review and authorize/generate reject as inapplicable
- **AND** no credential, grant, provider submit, or page raw artifact is created

#### Scenario: Invalid present local payload blocks planning

- **WHEN** the canonical local compatibility path exists but cannot produce a confined stable supported-image snapshot
- **THEN** plan exits through the owner diagnostic before publishing a plan/head or initializing a provider
- **AND** it does not silently omit the local candidate and continue with the requested generated slots

#### Scenario: Proceed names the candidate to promote

- **WHEN** a user accepts a reviewed plan with `--decision proceed`
- **THEN** the CLI requires its exact current plan hash and one eligible `--candidate-id`
- **AND** it does not select a candidate by order, timestamp, filename, or image presence

#### Scenario: Exact current-selection replay survives head advancement

- **WHEN** an exact `accept proceed` replay names the plan, decision, and candidate still bound by the current selection after a successor became the lifecycle head
- **THEN** the CLI returns the original selection record and may repair only its derived compatibility payload
- **AND** it rejects the replay after a newer selection or any binding change and never creates a second decision or acceptance

#### Scenario: Post-CAS payload failure reports partial success exactly

- **WHEN** `accept proceed` commits the effective selection but its derived JPEG projection fails
- **THEN** the CLI emits no success receipt on stdout and exits nonzero with the producer-owned final stderr diagnostic whose `subject.kind` is `style_master_selection`, whose `subject.id` is the committed selection digest, whose reason is `compatibility_projection_failed`, and whose non-human `rerun` invocation preserves the exact accept argument array
- **AND** it does not report the selection as uncommitted, roll it back, create another receipt, infer page raw authorization, or add a parallel partial-success schema

#### Scenario: Retired Style Master input is fenced

- **WHEN** a user passes a non-v2 run, `--force`, a legacy generator option, an arbitrary style asset/prompt path,
  profile, or scope selector
- **THEN** the CLI rejects the request before provider initialization or artifact mutation
- **AND** it does not translate the input into a current candidate plan

#### Scenario: Unknown plan is abandoned without retry

- **WHEN** an exact current plan has an unknown submitted attempt and abandon receives a normalized human reason
- **THEN** the CLI CAS-records that attempt as terminal `unknown` and writes the immutable abandonment that derivationally closes only the named plan
- **AND** it does not call the provider, label the outcome failed, or infer authorization for a successor

#### Scenario: Invalid abandonment reason cannot touch the attempt

- **WHEN** `--reason` normalizes to empty, retains a C0/C1 control, or exceeds 512 UTF-8 bytes
- **THEN** the CLI rejects it before attempt CAS or abandonment record creation
- **AND** whitespace/NFC-equivalent valid input exact-replays the same normalized reason digest rather than creating a conflict

#### Scenario: Claimed candidate resumes without a second attempt

- **WHEN** inspect finds the exact current candidate attempt persisted as `claimed` before provider submission
- **THEN** it reports the same exact generate invocation as the next action
- **AND** generate revalidates and continues that attempt without early grant consumption, a second attempt, or abandonment

#### Scenario: Known candidate failure stops remaining submits

- **WHEN** generate records a known failure before later candidate slots have been submitted
- **THEN** the CLI returns the terminal-plan successor action with current consumed/remaining progress
- **AND** it does not submit later slots, reuse the residual grant, or describe a retry as available

### Requirement: --only accepts friendly slide selectors

Commands accepting `--only` SHALL resolve friendly selectors through the shared
stable-identity owner and reject ambiguous or unknown values before work begins.

#### Scenario: Spoken selector resolves

- **WHEN** a unique spoken stable ID identifies one current slide
- **THEN** the command resolves that slide without inferring another ID

### Requirement: CLI observation does not mutate or invoke providers

Plain status and state observation SHALL consume the read-only inspection path.
They SHALL not write source, state, history, journals, metadata, receipts, or
generated artifacts, and shall not invoke a provider.

#### Scenario: Observation sees a repairable fact

- **WHEN** status observes a repairable current fact
- **THEN** it returns the owner-issued action without mutation

### Requirement: CLI routing does not duplicate workflow evaluation

Shared command routing SHALL consume the state/workflow owner result rather than
reconstructing mode, gate, authorization, recovery, or completion rules from CLI
arguments, rendered output, or metadata.

#### Scenario: CLI consumes one inspection action

- **WHEN** a current command needs its next action
- **THEN** it uses the owner-issued inspection result
- **AND** it does not synthesize a parallel route

### Requirement: Diagnostics remain producer-owned

Every CLI hard failure SHALL use the registered producer-owned diagnostic envelope. Consumers MAY use
its bounded category and next action but SHALL NOT parse prose, copy the producer schema, or infer a
different recovery route.

For Framed render-contract and raw-review operations, the producer SHALL classify the earliest
independent root as `source_validation`, `environment`, `internal`, or the existing owning stale
artifact/evidence category, and SHALL emit one secret-safe nearest legal action per root. Earlier
source identity/schema or environment failures SHALL short-circuit dependent browser, provider, and
artifact symptoms. A provider call SHALL NOT be blamed for a failure that occurred before provider
submission.

#### Scenario: Invalid current request fails before work

- **WHEN** a command receives an invalid source, state, plan hash, render profile, or authorization scope
- **THEN** it emits one bounded producer diagnostic before provider or artifact work

#### Scenario: Text fit failure belongs to source validation

- **WHEN** Framed planning proves that a current Text Frame cannot fit the canonical render profile
- **THEN** the producer reports a bounded `source_validation` hard-stop and one source-repair action
- **AND** it does not expose browser internals, offer a force option, or classify the failure as provider-related

#### Scenario: Runtime readiness failure belongs to environment

- **WHEN** the pinned browser or required checked-in font is unavailable before layout proof
- **THEN** the producer reports a bounded `environment` hard-stop and one environment-repair action
- **AND** it does not ask the user to edit source or retry a provider

#### Scenario: Browser proof timeout belongs to environment

- **WHEN** the pinned browser cannot complete a page or finite batch proof before its owned deadline
- **THEN** the producer reports a bounded `environment` hard-stop and one runtime-repair action
- **AND** it does not attribute unknown runtime behavior to source, retry a provider, or publish an artifact

#### Scenario: Contract contradiction belongs to the framework

- **WHEN** canonical preset, compiler, safe-zone, or capture assertions contradict one another
- **THEN** the producer reports a bounded `internal` hard-stop and the framework-repair action
- **AND** no source, provider, review, or generated artifact is mutated

### Requirement: Non-v2 CLI requests fail before execution
When a command receives a non-v2 source/state pair, the CLI producer SHALL emit the one bounded unsupported-protocol diagnostic before provider initialization, generated-artifact reads, review publication, or state mutation.

#### Scenario: Non-v2 build is fenced
- **WHEN** a non-v2 run requests build, refresh, review, or raw generation
- **THEN** the CLI returns only the unsupported-protocol next action
- **AND** it does not invoke a decoder, migration operation, or provider

### Requirement: Style Master diagnostics remain owner-issued and bounded

Every Style Master hard failure SHALL use the registered producer-owned diagnostic envelope and report the
earliest independent failure in the current candidate lifecycle. The producer SHALL return the nearest
legal owner action for missing/stale intent or selection, unavailable runtime, candidate-plan/grant mismatch,
uncertain attempt, invalid candidate evidence, lifecycle-head conflict, or selection compare-and-swap conflict; consumers SHALL NOT derive a
parallel style recovery route from prose or file presence.

#### Scenario: Missing selection has one repair action

- **WHEN** page raw planning finds no current accepted effective-style selection
- **THEN** the CLI emits one bounded Style Master owner action before page raw provider work
- **AND** it does not offer raw-plan force, file-copy, or generic retry alternatives

#### Scenario: Candidate conflict is not reported as provider failure

- **WHEN** a candidate promotion loses its compare-and-swap precondition after valid candidate bytes exist
- **THEN** the CLI reports the current-selection conflict and its review/rebuild action
- **AND** it does not blame the provider, resubmit a candidate, or overwrite the selection

#### Scenario: Unknown attempt has one preserved-cost recovery action

- **WHEN** inspection finds an attempt whose provider outcome became unknown after submit
- **THEN** the CLI reports the recoverability hard-stop and exact-plan abandonment action requiring a human reason
- **AND** it does not offer retry, force, outcome editing, or successor authorization as the same action

### Requirement: Page Authority image2 exposes exact progressive production operations

The registered image2 family SHALL retain provider-free full-plan planning and
replace one-shot raw production with these fixed current-v2 forms:

    ppt_flow image2 plan <run-dir>
    ppt_flow image2 pilot <run-dir> --plan-hash <sha256> --slide-id <formal-id> [--slide-id <formal-id>...]
    ppt_flow image2 expansion <run-dir> --plan-hash <sha256>
    ppt_flow image2 authorize <run-dir> --plan-hash <sha256> --batch-hash <sha256>
    ppt_flow image2 generate <run-dir> --plan-hash <sha256> --batch-hash <sha256>
    ppt_flow image2 pilot-review <run-dir> --plan-hash <sha256> --batch-hash <sha256>
    ppt_flow image2 pilot-accept <run-dir> --plan-hash <sha256> --batch-hash <sha256> --decision proceed|repair|redirect
    ppt_flow image2 review <run-dir> --plan-hash <sha256>
    ppt_flow image2 accept <run-dir> --plan-hash <sha256> --decision proceed|repair|redirect
    ppt_flow image2 reconcile <run-dir> --plan-hash <sha256> --attempt-sha256 <sha256>

Pilot SHALL be provider-free and accept only repeated exact current formal
slide IDs; it SHALL return the owner-derived ordered Pilot projection and its
batch hash. That projection SHALL disclose the ordered selected formal IDs,
their source-derived `position + title` display fields, review-sample and paid
submission membership, and maximum submissions; display fields are not accepted
as selectors or batch identity. A repeat of the same current planning action
SHALL return the exact existing batch rather than minting another live scope or
grant. Expansion SHALL be provider-free and derive only the current remaining
paid scope after an exact partial Pilot proceed. Authorize and generate SHALL
require both current hashes. Generate SHALL submit at most one owner-eligible
item per invocation, then return derived progress and the one next legal
action. Pilot-review and pilot-accept apply only to a partial Pilot; review and
accept apply only to complete full-plan raw evidence.

The former authorize/generate forms without a batch hash, all use of --slides,
friendly or inferred scope selectors, arbitrary prompt/provider/profile/path
overrides, force, retry, and direct provider-operation flags SHALL be rejected
before provider initialization or artifact mutation. Reconcile may use only the
exact persisted attempt's supported reconciliation identity; it SHALL not
resubmit or let a caller assert an outcome. When a submitted attempt blocks a
stale current plan, reconcile SHALL still accept that exact plan/attempt pair
solely to record a terminal historical outcome; it SHALL not advance a head,
mint a batch or grant, or present its result as current raw evidence.

#### Scenario: Pilot CLI binds formal IDs in plan order

- **WHEN** a current full plan receives a pilot command with three exact current formal IDs in an arbitrary input order
- **THEN** the CLI returns one provider-free Pilot batch hash ordered by the full plan
- **AND** it does not accept a position, title fragment, --slides value, or unselected ID as equivalent scope

#### Scenario: Pilot CLI gives bounded human cost disclosure

- **WHEN** a valid partial Pilot projection is created
- **THEN** its success report includes ordered formal IDs, display-only position/title, review and paid membership, and maximum submissions
- **AND** a caller cannot submit those display fields, a batch generation, or a predecessor as an alternate scope assertion

#### Scenario: Generate advances one committed item

- **WHEN** an authorized current Pilot batch has two unsubmitted items
- **THEN** one generate invocation claims, submits, and commits at most the next legal item before returning progress
- **AND** the returned next action does not imply that the second item was submitted

#### Scenario: Partial Pilot proceed cannot authorize Expansion

- **WHEN** pilot-accept records proceed for a current partial Pilot batch
- **THEN** the CLI returns only the current Expansion planning action
- **AND** it does not mint an Expansion grant, submit remaining items, or publish accepted raw evidence

#### Scenario: Complete branches reject synthetic Pilot commands

- **WHEN** current paid debt is zero or a one-through-five-item Pilot scope exhausts all paid debt
- **THEN** pilot-review and pilot-accept are inapplicable and review is the owner-issued next quality operation
- **AND** the CLI does not create synthetic Pilot evidence, a partial decision, or an Expansion grant

#### Scenario: Unresolved submitted attempt has one reconciliation route

- **WHEN** generate observes a current `submitted` item attempt without a provable terminal outcome
- **THEN** the CLI emits the producer-owned recoverability hard-stop and the exact reconcile invocation
- **AND** it does not expose retry, force, status editing, or a successor grant as the same action

#### Scenario: Terminal unknown cannot reopen a grant

- **WHEN** reconcile terminalizes an attempt as `unknown`
- **THEN** later paid work starts only from the owner-derived successor planning action and a new explicit cost authorization
- **AND** the CLI does not reopen the old grant, resubmit from reconcile, or present historical bytes as current evidence

#### Scenario: Stale plan still permits only exact historical reconciliation

- **WHEN** a submitted attempt's source/profile tuple becomes stale before its outcome is terminal
- **THEN** only `reconcile` with that persisted plan and attempt identity is accepted for the old lifecycle
- **AND** the CLI does not create a successor plan, batch, grant, or current evidence from that invocation

### Requirement: Progressive production diagnostics remain direct and bounded

Every progressive image2 hard failure SHALL use the registered producer-owned
diagnostic envelope. The producer SHALL first validate exact run/workflow
identity, full-plan identity, batch identity, grant/attempt binding, and
current item provenance before any derived projection, browser work, or
provider call. It SHALL report the smallest independent root cause and one
nearest legal owner action; the Controller SHALL consume that action without
parsing prose or creating another recovery route.

#### Scenario: Stale batch stops before submission

- **WHEN** authorize or generate receives a batch hash whose plan, raw contract, profile, source, execution, or selected IDs drifted
- **THEN** the CLI returns the raw-owner rebuild/replan diagnostic before provider initialization
- **AND** it does not reinterpret the grant, choose a replacement batch, or consume another item
