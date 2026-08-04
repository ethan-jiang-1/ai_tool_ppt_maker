## MODIFIED Requirements

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
- `compiled_prompt_sha256`, SHA-256 of the exact nonempty UTF-8 provider-brief bytes deterministically
  compiled provider-free from the bounded intent, canonical style context, and fixed prompt contract; display
  literals, host paths, credentials, provider response data, and projection-only digests SHALL not enter those
  bytes;
- `previous_selection_sha256`, the prior canonical effective-selection record digest or null; and
- the scope-head generation and predecessor identity; and
- an explicit `--candidate-count` of `0..4` newly generated slots with ordered stable slot IDs.

The provider brief SHALL be at most 4,000 UTF-8 bytes. It SHALL contain the authored style intent and a
deterministic compact global visual summary derived from the current projection semantics, including the
ordered unique visual recipe, composition, motif, and identity-subject identifiers needed to describe the
deck-wide style. It SHALL NOT serialize a per-slide projection object, a projection digest, a provider-clause
digest, a registry digest, a host path, credential, provider response, display literal, or other identity-only
SHA-256 field into the provider brief. The complete canonical projection remains the source of
`style_context_sha256` and plan invalidation. The compiler SHALL fail planning before plan publication, grant
creation, or provider initialization when it cannot produce a nonempty brief within the bound; it SHALL NOT
silently truncate intent or summary content.

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
SHALL evaluate as unknown without an observation write. Only `succeeded` SHALL bind valid PNG bytes with
CRC-checked decoding, positive decoded integer width and height, byte digest, and generated-provenance digest
after atomic placement of both candidate artifacts individually. The request size in the generation profile
remains a request contract; the owner SHALL retain a provider's valid native PNG dimensions in provenance and
SHALL NOT resize or reject the response solely because those dimensions differ from `2000x1125`. The terminal
attempt CAS SHALL be the single publication point and reference and revalidate both digests; preplaced image or
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

Before advancing `claimed` to `submitted`, generate SHALL deterministically recompile the provider brief from
current canonical inputs and require its exact bytes to match `compiled_prompt_sha256`; compiler/profile/input
drift SHALL close the still-pre-submit plan as stale without a provider call. The one provider submission, any
bounded same-invocation task polling, and a successful terminal provenance record SHALL bind that compiled
prompt digest plus the fixed generation-profile digest, so bytes cannot be attributed to a different request
contract.
`provider_request_sha256` SHALL be `canonicalJsonSha256` of exactly
`{schema:"page-authority-style-master-provider-request-v1",plan_sha256,candidate_id,
compiled_prompt_sha256,candidate_generation_profile_sha256}` and SHALL match the slot submitted through the
existing transport. The `submitted` attempt persists this digest before the call; every
`succeeded|failed|unknown` terminal transition and generated provenance SHALL exact-match it. A response or
preplaced artifact with another or missing request digest cannot win terminal CAS.

Generation SHALL load credentials using the same ordered, non-overwriting scoped dotenv resolution as current
page raw generation before it resolves the existing Image2 credential pair. `IMAGE2_BASE_URL` SHALL name one
normalized endpoint and a value containing a comma SHALL fail as malformed environment configuration before
provider initialization. The Style Master transport SHALL accept either a complete inline response or a provider
task identifier. For a task identifier it SHALL poll only the provider's task result within the same generate
invocation and its explicit finite transport deadline; it SHALL not write a durable task ID or introduce a later
reconciliation command. A received non-success HTTP response, invalid JSON, malformed completed task response,
terminal task failure, or received inline/task result that cannot decode to a valid PNG SHALL terminalize the
submitted attempt as `failed`. A lost response, unreadable response, interrupted submit, poll transport failure,
or elapsed bounded deadline SHALL terminalize nothing as known and leave the submitted attempt uncertain.

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

#### Scenario: Bounded provider brief fails before paid work

- **WHEN** the authored intent and deterministic global visual summary cannot compile to a nonempty provider
  brief of at most 4,000 UTF-8 bytes
- **THEN** `plan` returns the bounded source-validation failure before publishing a plan, grant, attempt, or
  provider request
- **AND** it does not truncate intent, serialize the full slide projection, or consume a candidate submission

#### Scenario: Projection identity does not bloat the provider brief

- **WHEN** current slide projections contain provider-clause or registry SHA-256 fields
- **THEN** their full canonical projection remains bound by `style_context_sha256` while the provider brief
  contains only the compact visual summary and authored intent
- **AND** changing an identity-only digest still invalidates the plan without sending that digest to the provider

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

#### Scenario: Native provider PNG becomes a generated candidate

- **WHEN** an authorized provider response contains a CRC-valid PNG with positive native dimensions that differ
  from the requested `2000x1125` size
- **THEN** the owner records the returned bytes and native dimensions in the exact succeeded attempt and generated provenance
- **AND** it does not resize the bytes, label the response uncertain, or alter the requested generation profile

#### Scenario: Definite received response becomes a known failure

- **WHEN** an authorized submission receives a non-success response, malformed response, terminal failed task,
  or response media that cannot be decoded as a valid PNG
- **THEN** the owner terminalizes that submitted attempt as `failed` and returns the terminal-plan successor action
- **AND** it does not leave the plan at `unknown`, submit a later candidate, or expose the provider body

#### Scenario: Same-invocation task polling publishes one candidate

- **WHEN** an authorized provider submit response contains a valid task identifier and a later bounded poll in
  the same generate invocation returns a valid PNG result
- **THEN** the owner records one succeeded attempt bound to the original provider request
- **AND** it does not create a durable task identifier, second authorization, or a second provider submission

#### Scenario: Scoped dotenv and endpoint validation precede submit

- **WHEN** `style-master generate` starts with credentials available only in the deck-root or process-current `.env`,
  or with an `IMAGE2_BASE_URL` containing a comma-separated list
- **THEN** it resolves the former by the same non-overwriting scoped order as page raw, and rejects the latter
  before a provider request
- **AND** it does not require a manual `node --env-file` wrapper or attempt implicit endpoint failover

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

#### Scenario: Deadline or transport loss remains uncertain

- **WHEN** a submitted provider request or same-invocation task poll reaches its explicit deadline or loses its
  response before a terminal provider result can be established
- **THEN** the owner preserves the consumed submitted attempt as `unknown` and returns only the exact-plan abandonment action
- **AND** it does not relabel the outcome as failed, persist a task ID, or submit a replacement candidate automatically

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
