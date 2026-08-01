## Purpose

Define retained visual-style primitives used by Page Authority raw profiles and
readiness. They do not create a separate production route.

## Requirements

### Requirement: Style master uses in-framework image client

The current-v2 Style Master owner SHALL compile and materialize a provider-free candidate plan before any
candidate submission. `plan <run-dir>` SHALL resolve exactly one `{ run_version, workflow }` tuple from either
an active fresh-v2 authoring draft with a validated selected-workflow source marker or an exact current v2
source/state pair, and SHALL NOT accept or infer another version scope. Draft resolution SHALL reuse the
selected workflow's existing read-only candidate-source resolver and SHALL NOT invoke the materializing source
resolver or create a Page Authority source receipt, production-mode record, target-evidence record, raw plan,
or source epoch. Draft eligibility SHALL consume the node-declared, controller-manifest-validated ordered
`draft_route: true` projection for the active selected workflow rather than require the workflow-selection node
forever or infer/copy node IDs. Another controller, an unknown/sibling/post-raw node, or an existing
production-mode record SHALL not resolve as a draft.
The exact projection SHALL include the shared workflow-selection node, shared content/visual-system nodes,
only the selected workflow's Style Master nodes, and that workflow's first-raw handoff.
The node key SHALL be absent or literal Boolean `true`; false, string, number, null, and duplicate-key forms are invalid.
Exact-pair resolution SHALL validate rather than replace that pair.

The owner SHALL maintain one CAS-protected candidate lifecycle head per scope tuple. The head SHALL name the
current plan digest, owner-issued positive `plan_generation`, and predecessor plan digest or null. Lifecycle
status and progress SHALL be derived from the plan/grant/attempt/decision/selection records rather than stored
as a competing head projection. A matching nonterminal plan SHALL be returned idempotently. Only a terminal current plan may receive
an owner-issued successor generation; an unresolved plan SHALL NOT be replaced by directory order, timestamp,
or a caller-supplied nonce. Canonical input drift SHALL make the plan stale and terminal for successor purposes
unless it contains an uncertain submitted attempt, which requires the reasoned abandonment path first. The plan SHALL bind:

Inspection without a plan digest SHALL resolve this current head. A supplied inspection digest SHALL be an
exact current-head assertion; mismatch SHALL return the current inspect action and SHALL NOT project a
historical plan as actionable progress. Historical exact-match behavior remains limited to accept and
abandonment replay.

A head plan SHALL be terminal for successor allocation only when direct records prove one of: canonical input
drift with no unresolved submitted outcome; a known failed attempt; an exact completed abandonment record; an
immutable `repair` or `redirect` decision; or a current effective selection matching its `proceed` decision and
candidate. A `claimed` attempt with unchanged inputs, incomplete generation, complete-but-unreviewed candidates,
or a `proceed` decision whose selection CAS has not committed SHALL remain nonterminal and expose its same-plan
action. A submitted/transport-owned `unknown` attempt without completed abandonment SHALL remain blocked but
nonterminal for successor allocation. If a pending `proceed` later loses its previous-selection precondition,
that selection drift makes the plan stale under the first terminal rule; the owner SHALL not reinterpret the
uncommitted decision as promotion.

- the layout-resolved canonical `visual-style/style-master-prompt.md` bytes, which are nonempty UTF-8 and at
  most 8 KiB, as `style_intent_sha256`;
- `style_context_sha256` as `canonicalJsonSha256` of the current unique `{ slide_id, projection }` entries
  sorted by ascending ASCII `slide_id`, where `projection` is that slide's
  `visual_language.projection`, excluding display literals, diagnostic spans, and identity-reference paths;
- `candidate_generation_profile_sha256` as `canonicalJsonSha256` of exactly
  `{ schema:"page-authority-style-master-generation-profile-v1",
  provider:{provider:"image2",model:"gpt-image-2",api_revision:"page-authority-image2-v2"},
  output:{format:"png",width:2000,height:1125},
  prompt_contract:"style-master-no-readable-text-v1" }`;
- `compiled_prompt_sha256`, SHA-256 of the exact nonempty UTF-8 provider-prompt bytes deterministically
  compiled provider-free from the bounded intent, canonical style context, and fixed prompt contract; display
  literals, host paths, credentials, and provider response data SHALL not enter those bytes;
- `previous_selection_sha256`, the prior canonical effective-selection record digest or null; and
- the scope-head generation and predecessor identity; and
- an explicit `--candidate-count` of `0..4` newly generated slots with ordered stable slot IDs.

The owner SHALL compute `plan_sha256` over the existing shared canonical-JSON UTF-8 serialization of one
`plan_identity` object, never over the enclosing file or a self-referential digest. That exact object SHALL
contain only `schema: page-authority-style-master-plan-identity-v1`, `run_version`, `workflow`, positive
`plan_generation`, nullable `previous_plan_sha256`, nullable `previous_selection_sha256`, the three intent /
context / generation-profile digests, `compiled_prompt_sha256`, `generated_candidate_count`, and the ordered `candidates` array. A
generated entry SHALL contain only its stable `candidate_id` and `kind: generated`; a local entry SHALL contain
`candidate_id: local-existing`, `kind: local-existing`, `candidate_sha256`,
`candidate_provenance_sha256`, `candidate_media_type`, `candidate_width`, and `candidate_height`. Host paths,
timestamps, current payload digest, grant/attempt status, and derived progress
SHALL NOT enter `plan_identity`. `candidate-plan.json` SHALL store the identity plus its `plan_sha256`, and the
owner SHALL recompute the identity digest on every read.

Initial plan publication SHALL stage `candidate-plan.json` and any local-existing candidate bytes/provenance
in a unique `style-master-iterations/_staging/plan-<unique>/` directory on the same filesystem, fully validate that bundle, then
atomically rename it to `plans/<plan-sha256>/` before attempting head CAS. If the canonical directory already
exists, the writer SHALL discard its staging directory only after exact-validating the existing immutable
identity and local candidate facts. A staging directory, partial failed publication, or complete plan not named
by the scope head SHALL never be current or reviewable; owner recovery MAY remove only entries confined below
that exact `_staging/` root during an explicit mutating plan operation, never during inspect/layout validation,
and SHALL not delete complete immutable history.

The scope head SHALL have exactly `schema: page-authority-style-master-head-v1`, `run_version`, `workflow`,
`plan_sha256`, positive `plan_generation`, and nullable `previous_plan_sha256`. Its generation/predecessor SHALL
exactly match the referenced plan identity. Head creation/replacement SHALL compare the expected absent or
exact prior canonical head bytes and publish by atomic rename; no timestamp, mtime, directory scan, or extra
revision counter participates in CAS. Concurrent writers of the same generation therefore exact-match the same
identity, while a successor is distinct because generation and predecessor are hashed inputs.

The owner SHALL inspect only the layout-resolved canonical compatibility path for local-existing input. If it
is absent, the plan omits the local slot. If it exists, the owner SHALL include exactly one local slot only after
proving it is a confined regular file, reading a stable snapshot, detecting supported image bytes/dimensions,
copying those exact bytes atomically into immutable history, and rechecking the copy before head publication.
A present but unconfined, non-regular, unreadable, unstable, unsupported, or invalid image SHALL hard-stop
planning rather than be silently omitted while generated cost proceeds.

Each candidate SHALL have immutable canonical `provenance.json`. Local provenance SHALL contain exactly
`schema: page-authority-style-master-local-provenance-v1`, `kind: local-existing`,
`source_asset: visual-style/style_master.jpg`, `candidate_sha256`, `candidate_media_type`,
`candidate_width`, and `candidate_height`; it deliberately excludes plan identity so its canonical digest can
enter `plan_identity` without a cycle. Generated provenance SHALL contain exactly
`schema: page-authority-style-master-generated-provenance-v1`, `kind: generated`, `plan_sha256`,
`candidate_id`, `compiled_prompt_sha256`, `candidate_generation_profile_sha256`,
`provider_request_sha256`, `candidate_sha256`, `candidate_media_type`, `candidate_width`, and
`candidate_height`. `candidate_provenance_sha256` SHALL be `canonicalJsonSha256` of the corresponding
provenance object, not a field inside that record and not a digest of newline-formatted file bytes.

`0` SHALL be accepted only when a confined local-existing candidate is included in the same plan; otherwise
the owner SHALL hard-stop before a grant is created. A local-existing slot SHALL precede generated
`candidate-001` through `candidate-00N` slots, bind the exact rechecked bytes copied without transcoding into
immutable candidate history plus detected supported media type/dimensions and `local-existing` provenance,
where supported local media is exactly `image/png` or `image/jpeg` with positive decoded integer dimensions,
and SHALL not consume provider authorization. The owner SHALL
disclose the generated-slot count and its maximum provider cost consequence. It SHALL reject CLI prompt,
path, provider, profile, scope, and candidate-slot overrides.

A nonzero candidate submission SHALL require one exact current Style Master authorization bound to that
plan and its generated-slot set; remaining capacity is derived from submitted attempts. `candidate-grant.json`
SHALL be canonical JSON with exactly `schema: page-authority-style-master-candidate-grant-v1`, `run_version`,
`workflow`, `plan_sha256`, ordered `generated_candidate_ids`, `max_submissions`, and
`candidate_generation_profile_sha256`. Its slot list SHALL exactly equal the plan's ordered generated slots,
`max_submissions` SHALL be their positive length, and its scope/profile SHALL cross-match the plan. Its external
`candidate_grant_sha256` SHALL be `canonicalJsonSha256` of that exact record, never a self-field or file-format
digest. It SHALL contain no timestamp, execution pointer, path, mutable consumption counter, or provider result.
After validating the current head and plan, `authorize` SHALL atomically create that one write-once record; an
existing grant SHALL be returned only after exact validation to the same canonical record, while divergent bytes
hard-stop without overwrite. Candidate authorization SHALL NOT authorize a page raw request, Pilot/Expansion
work, a retry, or a later plan. A zero-generated local plan SHALL reject authorization and generation as
unnecessary and proceed directly to review. For every authorized candidate, the owner SHALL
validate the current plan/grant, CAS-persist a `claimed` attempt before provider initialization, transition it
to `submitted` with the exact canonical `provider_request_sha256` immediately before the one transport call,
and, when the invocation regains control, transition
it exactly once to `succeeded`, `failed`, or `unknown`. A persisted `submitted` attempt with no terminal evidence
SHALL evaluate as unknown without an observation write. Only `succeeded` SHALL bind valid PNG bytes whose
decoded size is exactly 2000x1125, byte digest, and generated-provenance digest after atomic placement of both
candidate artifacts individually. The terminal attempt CAS SHALL be the single publication point and reference
and revalidate both digests; preplaced image or
provenance files without a winning `succeeded` attempt remain non-authoritative. Every claimed, submitted, or
terminal generated attempt SHALL retain the exact `candidate_grant_sha256` of its validated grant. The immutable
grant's consumed slots and owner progress SHALL be derived only from exact grant-bound attempts that reached
`submitted`; the grant itself SHALL NOT be rewritten as a mutable counter.

Each generated slot's `attempt.json` SHALL be canonical JSON with exactly
`schema: page-authority-style-master-candidate-attempt-v1`, `run_version`, `workflow`, `plan_sha256`,
`candidate_id`, `candidate_grant_sha256`, `status`, nullable `provider_request_sha256`, nullable
`candidate_sha256`, nullable `candidate_provenance_sha256`, and nullable `reason_sha256`.
`attempt_record_sha256` SHALL be `canonicalJsonSha256` of that exact current record, external to it. The record
SHALL contain no timestamp, provider prose/body, retry count, mutable consumption, or second outcome. CAS allows
only absent -> `claimed`, `claimed` -> `submitted`, and `submitted` -> exactly one of `succeeded`, `failed`, or
`unknown`, with exact replay of an already committed state only. `claimed` has all nullable outcome fields null;
every later state has the exact submitted `provider_request_sha256`; `succeeded` has matching non-null candidate
and provenance digests; `failed` and `unknown` have those candidate fields null. A transport-owned `unknown` has
null `reason_sha256`, while an abandonment-owned `unknown` binds the normalized reason digest. The plan/scope/slot
and exact grant binding SHALL remain unchanged across all transitions.

Before advancing `claimed` to `submitted`, generate SHALL deterministically recompile the provider prompt from
current canonical inputs and require its exact bytes to match `compiled_prompt_sha256`; compiler/profile/input
drift SHALL close the still-pre-submit plan as stale without a provider call. The one transport request and a
successful terminal provenance record SHALL bind that compiled prompt digest plus the fixed generation-profile
digest, so bytes cannot be attributed to a different request contract.
`provider_request_sha256` SHALL be `canonicalJsonSha256` of exactly
`{schema:"page-authority-style-master-provider-request-v1",plan_sha256,candidate_id,
compiled_prompt_sha256,candidate_generation_profile_sha256}` and SHALL match the slot submitted through the
existing transport. The `submitted` attempt persists this digest before the call; every
`succeeded|failed|unknown` terminal transition and generated provenance SHALL exact-match it. A response or
preplaced artifact with another or missing request digest cannot win terminal CAS.

A persisted `claimed` attempt SHALL consume no grant slot and remain resumable only through the same exact
plan's generate operation. After revalidating unchanged plan, grant, scope, and canonical inputs, generate SHALL
advance that same attempt to `submitted` before its one transport call; it SHALL NOT allocate a second attempt
or classify this pre-submit continuation as a retry. If canonical inputs drift before `submitted`, the stale
plan MAY receive its normal successor without unknown-plan abandonment.

An ambiguous outcome after `submitted`, including an orphan `submitted` record, SHALL remain uncertain, consume
its slot, and hard-stop the plan. Because the current transport exposes no authoritative request lookup, this change SHALL NOT invent
provider reconciliation. After recording a normalized human reason, the owner MAY CAS-transition the exact
current plan's `submitted` attempt to terminal `unknown` that binds the human-reason digest, or exact-match an
existing transport-owned `unknown`, and then write one immutable abandonment record bound to the scope head,
plan, grant, resulting unknown attempt, and exact reason. That
attempt CAS SHALL serialize abandonment against a late `succeeded|failed` commit so only one terminal outcome
can win. The abandonment record SHALL derivationally close the plan and SHALL NOT authorize a successor. A
crash after an abandonment-owned unknown CAS but before record creation SHALL remain recoverable only by an
abandon action whose reason matches the attempt's bound digest. If transport already committed `unknown`, the
atomic abandonment-record creation SHALL choose among concurrent reasons because no later terminal outcome can
win. Candidate bytes placed before a losing terminal CAS SHALL remain unreferenced and non-authoritative. A
replay with the exact same reason and bindings SHALL return the existing abandonment record,
including after successor head advancement; any different reason or plan/grant/attempt binding SHALL conflict
without mutation.
A normalized abandonment reason SHALL be the NFC form of the supplied text after every Unicode-whitespace run
is replaced by one ASCII space and leading/trailing whitespace is removed. The owner SHALL reject remaining
C0/C1 control characters, an empty result, or normalized UTF-8 longer than 512 bytes before attempt CAS. The
attempt SHALL bind `reason_sha256` over those exact UTF-8 bytes; the immutable abandonment record SHALL retain
both that normalized text and digest, so canonically equivalent input exact-replays while a different reason
conflicts.

`abandonment.json` SHALL be canonical JSON with exactly
`schema: page-authority-style-master-candidate-abandonment-v1`, `run_version`, `workflow`,
`scope_head_sha256`, `plan_sha256`, `candidate_grant_sha256`, `candidate_id`, `unknown_attempt_sha256`,
`provider_request_sha256`, normalized `reason`, and `reason_sha256`.
`scope_head_sha256`, `unknown_attempt_sha256`, and `abandonment_sha256` SHALL be external
`canonicalJsonSha256` digests of the exact head, terminal unknown attempt, and abandonment record respectively,
never self-fields or file-format digests. A fresh abandonment SHALL bind the current head and exact plan/grant/
candidate/request tuple; it atomically creates that record or exact-matches an equivalent existing record. If
transport already owns `unknown`, the first record writer selects the normalized reason; if abandonment owns
`unknown`, the record's reason digest SHALL match the terminal attempt. A changed reason or binding SHALL hard-stop
without replacement. Only the existing exact abandonment record may replay after successor head advancement.
A known failed slot SHALL remain terminal; a plan without successful bytes for every planned slot SHALL not
reach review. The first known failure SHALL stop generation before every remaining unsubmitted slot because
those submissions cannot restore plan eligibility; their grant capacity SHALL remain unconsumed and SHALL not
be reused by this plan. A successor plan with generated slots SHALL require a new exact authorization. The owner SHALL
NOT create a second parser, provider route, external skill, implicit retry, or page raw materialization record.

#### Scenario: Candidate plan has one explicit cost and scope boundary

- **WHEN** a current v2 run requests a Style Master plan with a valid `--candidate-count`
- **THEN** the owner binds the resolved prompt digest, style-only context digest, fixed candidate profile,
  one `{ run_version, workflow }` tuple, prior selection digest, head generation/predecessor, count, local-byte
  identity when present, and ordered slot IDs into the plan hash
- **AND** it does not write a page source receipt, raw plan, raw evidence, or source epoch

#### Scenario: Draft remains reachable after workflow selection

- **WHEN** an unbound create-deck draft advances along its manifest-validated selected-workflow `draft_route: true` nodes through Style Master
- **THEN** Style Master scope resolution continues to return that exact run/workflow draft without source/state materialization
- **AND** it rejects another controller, an unknown or sibling-workflow node, a post-raw node, or any draft with a production-mode record

#### Scenario: Missing or zero-cost input does not infer work

- **WHEN** candidate count is omitted, outside `0..4`, or zero without an eligible local-existing candidate
- **THEN** planning hard-stops before a grant, provider initialization, or candidate submission
- **AND** it does not choose a default count, discover another version scope, or treat `style_master.jpg` as accepted

#### Scenario: Candidate authorization is exact

- **WHEN** a current candidate plan has not received its exact Style Master authorization
- **THEN** candidate generation stops before provider initialization or candidate-artifact mutation
- **AND** the owner exposes the one authorization action for that plan

#### Scenario: Grant identity cannot be rewritten or detached from attempts

- **WHEN** authorize races a replay or finds an existing candidate-grant file for the same plan
- **THEN** it atomically creates or exact-validates the one canonical grant and returns its recomputable
  `candidate_grant_sha256`
- **AND** a divergent field, a changed slot order/count/profile, or an attempt with another grant digest hard-stops
  before provider initialization, grant consumption, or artifact mutation

#### Scenario: Attempt and abandonment terminal facts are exact

- **WHEN** a generated attempt transitions or an unknown attempt is abandoned
- **THEN** the owner accepts only the declared exact-record CAS transition and canonical attempt/abandonment
  field/digest bindings for that plan, grant, slot, request, and current head
- **AND** an extra field, altered terminal fact, mismatched digest, or different abandonment reason cannot close a
  plan, advance a successor, or overwrite a direct record

#### Scenario: Zero-generated local plan has no cost gate

- **WHEN** a current plan contains one copied local-existing candidate and zero generated slots
- **THEN** it proceeds to exact-byte review without a grant, credential resolution, or generate operation
- **AND** authorize and generate reject the plan without provider or artifact mutation

#### Scenario: Authorizing generated slots cannot authorize a local candidate or a retry

- **WHEN** a plan contains local-existing and generated slots and receives a current grant
- **THEN** the grant covers only the plan's named generated slots and their disclosed maximum submissions
- **AND** it does not create provider cost for the local candidate, another plan, or a replacement retry

#### Scenario: Candidate progress is durable per submission

- **WHEN** an authorized candidate response supplies valid image bytes
- **THEN** its terminal attempt, bytes, digest, provenance, and derived grant consumption/progress are current before the next candidate submission
- **AND** no page raw plan, raw evidence, or source epoch is written by that candidate operation

#### Scenario: Known failure stops unusable remaining cost

- **WHEN** one generated slot reaches known `failed` before later planned slots are submitted
- **THEN** the owner records current derived progress and hard-stops before another provider call
- **AND** remaining capacity stays unconsumed but unusable by the terminal plan, whose next generation requires a successor plan and new authorization

#### Scenario: Pre-submit claim resumes the same attempt

- **WHEN** generation is interrupted after an exact candidate attempt is `claimed` but before it reaches `submitted`
- **THEN** inspection reports the same-plan generate action and exact generate replay advances that same attempt after revalidation
- **AND** it does not consume a grant slot early, allocate another attempt, require abandonment, or submit more than once

#### Scenario: Compiled prompt drift stops before submit

- **WHEN** exact generate replay recompiles provider-prompt bytes that no longer match the plan's `compiled_prompt_sha256`
- **THEN** the claimed attempt remains unsubmitted and the stale plan may receive its normal successor
- **AND** the owner does not initialize the provider, consume grant capacity, or attribute later bytes to the old prompt contract

#### Scenario: Uncertain candidate outcome is not retried

- **WHEN** a candidate request may have reached the provider but its terminal result cannot be proved, including an orphan `submitted` record
- **THEN** the owner preserves an unknown consumed attempt and hard-stops with the exact-plan abandonment action
- **AND** it retains the exact submitted provider-request digest and does not consume another slot, overwrite the attempt, or submit a replacement candidate automatically

#### Scenario: Abandonment and late terminal response have one winner

- **WHEN** reasoned abandonment races a late provider response for the same `submitted` attempt
- **THEN** the attempt CAS commits exactly one of `unknown`, `succeeded`, or `failed`
- **AND** abandonment record creation or provider terminal publication loses cleanly when its required terminal state did not win, and any unreferenced preplaced bytes remain non-authoritative

#### Scenario: Abandonment reason normalization is replay-stable

- **WHEN** equivalent reason input differs only by Unicode normalization or whitespace runs
- **THEN** abandon binds the same normalized UTF-8 text and `reason_sha256` and exact replay returns the original record
- **AND** empty, control-bearing, oversized, or semantically different normalized input fails before attempt mutation

#### Scenario: Terminal plan can receive an exact successor

- **WHEN** the exact current plan is stale, failed, non-proceed, promoted, or explicitly abandoned and a successor is requested
- **THEN** the owner allocates a new generation bound to that predecessor and produces a distinct successor plan hash
- **AND** it does not reopen prior slots, reuse their grant, or select a history directory as current

#### Scenario: Unresolved direct facts cannot be replaced by a successor

- **WHEN** the current plan has an unchanged `claimed` attempt, incomplete or unreviewed candidates, a pending `proceed` selection CAS, or unknown outcome without completed abandonment
- **THEN** plan reports that exact same-plan recovery/review/promotion/abandonment action and refuses successor allocation
- **AND** it does not treat a write-once decision alone, elapsed time, or residual grant capacity as terminal proof

#### Scenario: Local candidate is an immutable snapshot

- **WHEN** a plan includes a confined `style_master.jpg` as `local-existing`
- **THEN** plan materialization rechecks and copies the exact bytes plus detected supported media type/dimensions into its immutable candidate owner before publishing the scope head
- **AND** later compatibility-payload drift cannot change the planned or reviewed candidate

#### Scenario: Invalid present local payload is not silently skipped

- **WHEN** the canonical compatibility path exists but is unconfined, non-regular, unreadable, unstable, unsupported, or not a valid image
- **THEN** planning hard-stops before publishing a plan/head or initializing a provider
- **AND** it does not omit the local slot and continue with generated candidates or inspect another path

### Requirement: Shared style primitives do not select a retired route

Shared Style Master primitives SHALL serve only the current-v2 Page Authority candidate lifecycle and
the exact effective-selection/acceptance record that its owner has accepted. A candidate, a legacy generated
image, or the physical `style_master.jpg` file alone SHALL NOT become current selection, source receipt,
page raw authorization, or a separate production route. The prompt file is an intent input, not a provider
request: only the Style Master owner may compile it with the closed current style context.

A constrained pre-existing `style_master.jpg` MAY enter the current lifecycle only as a locally observed
candidate that receives the same current human review and acceptance receipt. The owner SHALL NOT invent
historical provider provenance or silently treat file presence as acceptance.

#### Scenario: Existing style file requires current review

- **WHEN** a selected run has a confined legacy `style_master.jpg` but no current effective-style receipt
- **THEN** page raw planning reports the Style Master review/promotion action
- **AND** it does not infer that the file was authorized, accepted, or generated by the current lifecycle

#### Scenario: Style lifecycle remains current-v2 only

- **WHEN** a non-v2, partial, hybrid, or retired source/state pair invokes Style Master work
- **THEN** the owner returns the existing unsupported-protocol or identity hard-stop before any provider or artifact work
- **AND** it does not expose a legacy generator, adapter, or fallback route

### Requirement: Style Master review promotes one current effective selection

The Style Master owner SHALL present only complete, current, and attributable candidate bytes for the
candidate plan's selected workflow and exact one-tuple scope. Review SHALL require an exact plan hash, verify
that hash against the scope head, and expose the plan hash and each eligible stable candidate ID. For a generated
slot, eligibility SHALL require its exact current plan/slot/grant binding, a canonical terminal `succeeded`
attempt, that attempt's submitted provider-request digest, matching immutable image bytes, and matching generated
provenance. For a local-existing slot, eligibility SHALL require its plan-bound copied bytes and matching local
provenance but SHALL NOT invent a grant, provider request, or attempt. A preplaced image/provenance, `claimed`,
`submitted`, `failed`, or `unknown` generated attempt, or any plan/grant/request/byte/provenance mismatch SHALL
not be eligible for review or promotion. It SHALL
expose `proceed`, `repair`, and `redirect` as a human visual-direction
decision: `proceed` accepts one named current candidate; `repair` returns the candidate/style-intent checkpoint;
and `redirect` returns visual-direction selection. None of these decisions is page raw authorization, Pilot
approval, raw acceptance, a generic waiver, or a workflow switch.

`accept` SHALL bind the reviewed plan hash for every decision. Before a new decision write or selection CAS, it
SHALL reuse the review validator to revalidate the current scope head, exact generated-or-local candidate authority
chain, workflow/scope, and selection context; it SHALL NOT promote from an earlier CLI projection or create a second
review receipt. It SHALL require exactly one eligible candidate ID for `proceed` and reject a candidate ID for
`repair` or `redirect`. On a current `proceed`, the owner SHALL
write or exact-match one immutable review decision, then atomically promote exactly that reviewed candidate
with compare-and-swap against the plan's previous
effective-style identity. The one effective-selection/acceptance record SHALL bind the candidate bytes/digest,
candidate provenance, plan/selection scope, prompt/context/profile digests, current decision, and previous
selection. A candidate decision, ID, byte, scope, profile, or previous-selection mismatch SHALL stop promotion
without changing the effective selection.

The immutable review decision SHALL be the existing shared canonical-JSON serialization of exactly
`schema: page-authority-style-master-review-decision-v1`, `run_version`, `workflow`, `plan_sha256`,
`decision`, nullable `candidate_id`, nullable `candidate_sha256`, and nullable
`previous_selection_sha256`. `proceed` SHALL carry the selected candidate ID/digest; `repair|redirect` SHALL
carry nulls. `review_decision_sha256` SHALL be SHA-256 over those exact canonical record bytes and SHALL not be
stored inside or hashed into the decision record. The record SHALL contain no timestamp, host path, display
order, or derived projection fact, so concurrent identical decisions exact-match deterministic bytes. The only new
human-decision timestamp in promotion SHALL be the selection record's `accepted_at`, chosen once by the winning
selection CAS and returned unchanged by every semantic replay.

Review and a new decision SHALL require the exact scope-head plan. The only historical-plan exception SHALL be
an exact idempotent `proceed` replay whose plan, immutable decision, candidate, and bindings still match the
current effective-selection record. That replay MAY return the original record and repair only its derived
compatibility payload after the lifecycle head advances; a newer selection or changed binding SHALL make it
stale and non-writing.

Promotion SHALL project and invalidate dependent current Page Authority plans, raw-review/final/delivery
evidence, and pending Style Master work through their owning interfaces when style intent, canonical style
context, selected bytes/provenance, selection scope/identity, or generation profile drifts. It SHALL NOT manufacture a source
epoch solely because the style/profile changed, silently rebind old style bytes, or create a parallel
selection or receipt ledger.

#### Scenario: Reviewed candidate becomes effective atomically

- **WHEN** a complete current candidate has a `proceed` decision and the previous effective-style identity still matches
- **THEN** one atomic promotion records the effective selection and acceptance receipt bound to its exact bytes and scope
- **AND** dependent Page Authority work is inspected as stale or current through its existing owners

#### Scenario: Review cannot promote preplaced generated bytes

- **WHEN** a generated candidate image or provenance exists without the matching exact grant-bound `succeeded`
  attempt and submitted provider-request binding
- **THEN** review and accept hard-stop before candidate projection, decision, selection CAS, or compatibility payload work
- **AND** they do not treat the files as a local candidate, reconstruct a missing attempt, or submit a replacement

#### Scenario: Proceed requires one reviewed candidate ID

- **WHEN** an accept request uses `proceed` without exactly one candidate ID from the reviewed current plan
- **THEN** promotion hard-stops before state or payload mutation
- **AND** it does not choose the newest, first, or filesystem-discovered candidate

#### Scenario: Stale promotion leaves current selection unchanged

- **WHEN** another promotion or style/profile change makes the reviewed candidate's previous-selection identity stale
- **THEN** promotion hard-stops with the owner-issued rebuild/review action
- **AND** it does not overwrite the current style bytes, receipt, or selection

#### Scenario: Exact promotion replay is idempotent

- **WHEN** the same reviewed plan, `proceed` decision, and candidate are replayed after the selection CAS already committed
- **THEN** the owner returns the existing selection/acceptance record with its original timestamp and receipt identity
- **AND** it writes no second decision, selection, timestamp, history success, or provider artifact, while it may repair only a missing or stale derived compatibility payload

#### Scenario: Concurrent identical decision has deterministic identity

- **WHEN** concurrent accept operations carry the same current plan, decision, candidate, bytes, and previous selection
- **THEN** both derive the same timestamp-free review decision bytes/digest and exactly one selection CAS chooses `accepted_at`
- **AND** the loser returns the winning selection record rather than conflicting solely on clock time or minting another receipt

#### Scenario: Repair and redirect do not promote

- **WHEN** the human records `repair` or `redirect` for current candidate evidence
- **THEN** the owner preserves the current effective selection and returns the corresponding Style Master checkpoint
- **AND** no page raw authorization, acceptance, or final evidence is published

#### Scenario: Unknown-plan abandonment preserves uncertainty

- **WHEN** the exact current plan contains an unknown submitted attempt and the human supplies a normalized abandonment reason
- **THEN** the owner CAS-records the attempt as terminal `unknown` and writes one exact immutable abandonment record that derivationally closes the plan while retaining the grant slot as consumed
- **AND** it neither promotes candidate bytes nor authorizes, creates, or submits a successor plan

### Requirement: Effective selection and acceptance share one canonical state record

The Style Master state owner SHALL persist one exact
`page_authority_style_master.by_version["3_versions/vN"]` record for each accepted scope tuple. Its canonical
record SHALL contain only the schema, run version, workflow, plan digest, candidate ID/digest/provenance digest,
candidate media type and dimensions, style-intent digest, style-context digest, candidate-generation-profile digest, previous selection digest,
review-decision digest, and acceptance timestamp. The canonical JSON SHA-256 of that record SHALL be the
effective selection and acceptance receipt identity. The owner SHALL NOT write a second mutable receipt,
metadata mirror, raw-profile payload, or host path as selection authority.

After the state CAS commits, the owner SHALL ensure the compatibility `style_master.jpg` payload as valid JPEG
bytes projected from the selected immutable candidate through the existing in-framework image stack at the
layout-resolved canonical path: use an existing `overrides/visual-style/style_master.jpg` when present, otherwise
the shared backbone default, and never create an override solely for projection. Its
transformed bytes, failure, presence, or digest SHALL neither roll back nor establish the selection. An exact
idempotent accept replay SHALL return the original selection record and timestamp while repairing only a
missing or stale compatibility payload for the requesting run; it SHALL not change another version's selection
record or automatically create an override.

A post-CAS projection failure SHALL return a nonzero owner diagnostic that includes the already committed
selection identity and only the same exact accept replay as recovery. Read-only selection inspection SHALL
continue to report that authoritative selection as current; the failure SHALL NOT mint a second acceptance,
misreport promotion as uncommitted, or satisfy page raw authorization. A successful replay SHALL verify or
repair the derived JPEG and return the original receipt and timestamp.

`page_authority_style_master` SHALL be an optional schema-v5 state map. Its absence in an existing current v2
bundle SHALL mean unavailable Style Master evidence, not unsupported state. A present record SHALL satisfy the
exact selection field schema, canonical version key and matching `run_version`, plus the exact bound workflow
when source/state is materialized. A structurally valid but stale record SHALL remain supported and unavailable;
a malformed present record SHALL make state validation fail closed without being deleted, normalized, or
treated as absence. For an active fresh-v2 authoring
draft, the Style Master writer MAY add the exact selected-workflow record without creating the missing
production-mode or target-evidence records; later page raw source materialization SHALL preserve and revalidate
that record. Observation and a failed CAS SHALL remain byte-preserving.

First structural publication of vNext SHALL preserve the source version's record but SHALL NOT copy, rename,
infer, or rebind it into the target version, even for an unchanged workflow. The target begins without an
accepted selection and plans against a null previous target selection. Exact replay of the already-published
structural plan SHALL revalidate and preserve any later target-owned selection instead of deleting it. Neither
path SHALL invoke a provider, rewrite the layout-resolved compatibility payload, or use that payload as inheritance.

#### Scenario: Payload drift cannot create a selection

- **WHEN** a compatibility payload is missing, stale, or contains bytes selected for another action
- **THEN** the effective selection remains determined solely by the current state record and immutable candidate bytes
- **AND** raw planning neither reads the payload as authority nor changes another version's selection record

#### Scenario: Compatibility payload matches its filename

- **WHEN** promotion or explicit rebuild projects a selected PNG or JPEG candidate to `style_master.jpg`
- **THEN** the projection contains valid JPEG bytes while the selection continues to reference the immutable original candidate bytes
- **AND** the projected JPEG digest does not replace candidate or acceptance identity

#### Scenario: Projection failure preserves committed selection

- **WHEN** selection CAS commits but compatibility JPEG projection fails before accept returns
- **THEN** the owner emits no success receipt on stdout and returns a nonzero diagnostic whose selection subject names the committed digest and whose structured next invocation is the exact accept replay
- **AND** replay repairs only the derived payload and returns the original receipt/timestamp without another decision, selection, or provider call

#### Scenario: Existing schema-v5 state remains readable without selection

- **WHEN** an existing exact v2 bundle has schema-v5 state but no `page_authority_style_master` map
- **THEN** state remains supported and Style Master readiness evaluates unavailable
- **AND** observation does not seed a selection, promote the compatibility payload, or rewrite state

#### Scenario: Structural vNext owns a fresh selection scope

- **WHEN** structural publication creates a target version from a source version with an accepted selection
- **THEN** the source selection remains intact while the target has no selection until its own reviewed promotion
- **AND** exact structural replay preserves a later valid target-owned selection without copying source authority or changing the layout-resolved compatibility payload
