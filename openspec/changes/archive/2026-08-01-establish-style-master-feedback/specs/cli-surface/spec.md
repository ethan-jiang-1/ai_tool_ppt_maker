## MODIFIED Requirements

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

## ADDED Requirements

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
