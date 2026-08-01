## Context

Change 1 established that Framed plan-time proof, final composition, and raw-review coverage share one
render contract. The resulting Page Authority raw profile still obtains its style reference by reading
`2_backbone/visual-style/style_master.jpg`; file presence is therefore an accidental readiness signal rather
than a reviewed, scoped, and recoverable visual decision.

The current v2 lifecycle has one selected workflow per version and already owns page raw plan,
authorization, evidence, review, and refresh invalidation. Style Master is deliberately earlier than that
lifecycle's page-cost boundary. Candidate creation may use the existing Image2 client, but candidate grants,
attempts, bytes, decisions, and selection must not share the page raw authorization/evidence records that
Change 3 will later extend for Pilot and Expansion.

The design follows the three gate/control policies named in the proposal. `human-centered-gates.md` decides
whether a result is `guide`, `confirm`, or `hard-stop`; `agent-assistance-and-control.md` assigns direct
facts and handoffs; `simple-reliable-control.md` requires a shorter control loop than the work being
validated.

## Goals / Non-Goals

**Goals:**

- Make one Style Master owner compile a provider-free candidate plan, hold exact candidate-cost grants,
  persist a per-scope lifecycle head and per-candidate attempts/bytes/provenance, expose current progress,
  show real bytes, and atomically promote one accepted effective style.
- Bind every page raw generation profile to a current accepted selection and exact style bytes, so page raw
  work cannot start from a bare file, stale candidate, or accidental path.
- Restore a current-v2-only `ppt_flow style-master` command family and insert selected-workflow-specific
  Controller handoffs before page raw planning.
- Preserve one direct source of record per fact, one bounded next action per failure, and same-check recovery.
- Preserve legacy physical style files without inferring their provenance or rewriting unselected production
  run bundles.
- Keep Change 2 to one exact `run-version + workflow` tuple per candidate plan; a shared compatibility
  payload must not silently broaden that selection scope.

**Non-Goals:**

- No page-level raw provider submission, exact slide batch selection, Pilot/Expansion grant, per-page
  paid-materialization/reconciliation, Pilot projection, raw acceptance, finalization, PPTX/notes, or
  delivery work. Those are Change 3.
- No second renderer, provider client, controller, authorization ledger, selection ledger, retry service,
  background daemon, external skill, provider prompt/path override, or workflow migration route.
- No cross-version Style Master selection batch, inferred selection scope, or shared-file-based promotion.
- No migration scan or automatic modification of `deck_*`, `dpt_*`, generated artifacts, or pre-existing
  receipt, state, journal, or authorization records. New Style Master records are written only by an explicit
  current-run lifecycle action through their owner.

## Decisions

### 1. One Style Master lifecycle owns the durable candidate facts

`style-master-generation` becomes the only owner of the following irrecoverable facts:

| Fact | Writer / direct record | Readers | Freshness and removal |
| --- | --- | --- | --- |
| Current candidate lifecycle head | Style Master head CAS writer | plan, inspect, review, Controller | One record per version/workflow tuple; names only the exact current plan, owner-issued generation, and predecessor. Terminality and progress are derived from the plan/grant/attempt/decision/selection facts; a terminal current plan permits one successor, while an unresolved plan cannot be replaced by filesystem order. |
| Candidate plan | Style Master plan writer | CLI, Controller, grant validator | Bound to canonical intent/context, one version/workflow tuple, prior selection, fixed generation profile, local-existing byte identity, owner-issued generation/predecessor, and ordered candidate slots; a mismatch requires replan. |
| Candidate authorization | Style Master grant writer | candidate submitter | One write-once canonical grant, addressed by its external digest, bound to one plan digest, ordered generated slot set, maximum submissions, and generation profile. Attempts retain that grant digest and remaining capacity is derived from submitted attempts. It cannot authorize page raw work, retry, or another plan. |
| Candidate attempt, bytes, provenance; derived progress | Style Master attempt/materialization writer | review, inspection, promotion | Monotonic exact-record CAS `claimed -> submitted -> succeeded|failed|unknown`; every state retains one grant digest and submitted attempts consume that immutable grant slot. Progress is derived from plan/grant/attempt facts. Unknown remains attributable and is never overwritten by a retry or guessed outcome. |
| Unknown-plan abandonment | Style Master abandonment writer | plan, inspect, Controller | CAS the exact uncertain `submitted` attempt to terminal `unknown` (or exact-match `unknown`), then create one canonical reasoned record bound to that terminal attempt record, plan, scope head, and grant. The record derivationally closes that plan without authorizing a successor. |
| Human review decision | Style Master decision writer | promotion | Bound to the current plan and, for `proceed`, one candidate ID; `repair`/`redirect` never select bytes. |
| Effective selection / acceptance receipt | Style Master selection writer through the state owner | raw-profile validator, Controller condition, inspection | One canonical state record per exact version/workflow tuple, CAS-bound to exact candidate bytes, scope, profile, decision and previous selection; selection drift makes dependent work stale. |

Candidate history is append-mostly under the existing `1_upstream_raw_material/style-master-iterations/`
owner. The small per-scope lifecycle head is its only mutable current-plan pointer; active attempts advance only
through their monotonic CAS states, and plans, grants, terminal attempts, decisions, and candidate bytes remain
immutable. The selection record changes separately through the state-owner CAS. Candidate bytes are addressed by digest. The single selection/acceptance record is the
only authority for which candidate is effective for one version/workflow tuple; an attempt file, candidate
image, status card, payload copy, or Markdown checkbox is not a competing truth source.

This puts the paid Style Master loop in one owner rather than spreading it across `ppt_flow`, page raw
mechanics, and Controller node status. It also leaves Change 3 free to create a separate page raw
materialization owner without reusing candidate attempts.

### 2. The selection record, not `style_master.jpg`, is the raw-profile authority

The layout-resolved `style_master.jpg` remains a confined visual-style payload and compatibility projection:
an existing `overrides/visual-style/style_master.jpg` takes precedence for that run, otherwise the path is the
shared backbone default. Promotion or replay may write only that resolved path and SHALL NOT create a version
override merely to project a selection. The raw-profile resolver will instead read the current effective-selection/acceptance record, resolve its
immutable candidate bytes, verify their digest and exact one-tuple run/workflow scope, and pass those exact
bytes through the raw-plan and provider-submission boundary alongside the record digest and selected-byte identity.
The submitter SHALL NOT reread `style_master.jpg` or a `style_master_path`; the payload file may be atomically
rebuilt as a format-correct JPEG compatibility projection from the selected bytes through the existing
in-framework image stack, but its transformed digest, presence, or filename cannot make a selection current.

This avoids a multi-file overwrite transaction. Promotion first validates an immutable candidate and CAS-writes
the one authoritative selection/acceptance record. A missing or out-of-sync convenience payload is derived
work that its owner can rebuild from the selection; it cannot make page raw work use wrong bytes or make a
different version current. A CAS conflict leaves the selection record unchanged and returns the current-selection
recovery action.

`visual-config` remains the owner of closed visual-language resolution. Style Master owns the narrowly scoped
authored intent input at the existing logical asset key `visual-style/style-master-prompt.md`, resolved through
the layout owner so a declared version override is respected. The owner accepts only nonempty bounded UTF-8
intent bytes, binds their SHA-256 without accepting a CLI prompt/path/provider override, and combines them with
the current style-only visual-language context. It does not copy `visual-config` schema or per-slide display
literals into candidate state.

### 3. Candidate execution is exact and independent from page raw execution

`style-master plan <run-dir> --candidate-count <0..4>` is the only plan-time operational input. The count
means newly provider-generated slots, is required, and enters the plan hash. `0` is valid only when the plan
contains an eligible confined `local-existing` candidate; otherwise the plan hard-stops before a grant is
created. The run directory resolves exactly one canonical scope tuple `{ run_version, workflow }`; Change 2
does not accept a scope selector or infer another version from the shared backbone payload.

For a fresh v2 authoring draft, that tuple comes from the explicit canonical run, active `create-deck`
execution, and validated v2 source marker after the human workflow decision. The Style Master owner reuses the
selected workflow's existing read-only candidate-source resolver; it does not call the current materializing
`ppt_flow validate` / `resolveSource` path as a prerequisite. Style Master validation therefore does not create
the Page Authority source receipt, production-mode record, target-evidence record, raw plan, or source epoch.
For an already bound run, scope resolution instead requires and validates the exact current source/state
workflow pair. This preserves the accepted rule that selected-workflow raw planning owns first
source-receipt/state materialization while still making the pre-raw Style Master checkpoint reachable. The
create-deck Controller moves its source-valid exit to this read-only post-visual-system check; the existing
materializing source-validation action remains available to already bound lifecycle callers and is not a fresh
Style Master prerequisite.

The current draft adapter's single-node condition is too narrow once the Controller advances beyond workflow
selection. Apply adds one optional Boolean node declaration, `draft_route: true`, for the exact create-deck
nodes allowed to route while production mode/source receipt are absent. The controller manifest binds the exact
ordered `draft_route_nodes` projection separately for `framed` and `pure`; the canonical node validator rejects
an undeclared/missing/duplicate ID, a node outside create-deck or its selected workflow, a post-raw node, and any
manifest/playbook disagreement. The key is canonical only when absent or literal Boolean `true`; false,
string/number/null values, and duplicate YAML keys fail parsing rather than being coerced. The normalized
Controller reader exposes that projection to the router.

Draft resolution therefore requires an exact unbound `create-deck` execution for the named run and a
`current_node` present in the selected workflow's validated draft-route projection, covering the exact
workflow-selection node, content authoring, visual configuration, that workflow's Style Master nodes, and its
first raw-plan handoff. Unknown nodes, another controller,
sibling-workflow nodes, post-raw nodes, or any existing mode record remain non-draft hard-stops. The router does
not infer eligibility from node names, lifecycle phase, array position, or its own copied list.

The plan binds these canonical inputs:

- `style_intent_sha256`: bytes of the resolved `style-master-prompt.md`, UTF-8, nonempty, and at most 8 KiB.
- `style_context_sha256`: `canonicalJsonSha256` of unique `{ slide_id, projection }` entries sorted by
  ascending ASCII stable ID, where `projection` is that slide's current `visual_language.projection`; it
  excludes display text, diagnostic spans, and identity-reference paths.
- `candidate_generation_profile_sha256`: `canonicalJsonSha256` of the exact fixed object
  `{schema:"page-authority-style-master-generation-profile-v1",
  provider:{provider:"image2",model:"gpt-image-2",api_revision:"page-authority-image2-v2"},
  output:{format:"png",width:2000,height:1125},
  prompt_contract:"style-master-no-readable-text-v1"}`.
- `compiled_prompt_sha256`: SHA-256 of the exact deterministic nonempty UTF-8 provider-prompt bytes compiled
  provider-free from intent, canonical style context, and that fixed prompt contract. Display literals, host
  paths, credentials, and provider response bytes remain excluded.
- one `{ run_version, workflow }` scope tuple, `previous_selection_sha256` as the prior canonical selection-record digest or null, the requested count,
  owner-issued `plan_generation`, `previous_plan_sha256`, and ordered slot IDs. A local-existing slot, if
  present, also binds the exact copied-byte digest, detected supported media type/dimensions, and
  `local-existing` provenance, precedes generated
  `candidate-001` through `candidate-00N` slots, and does not consume provider authorization.

`plan_sha256` is deliberately not a file digest with a self-field. It is SHA-256 over the existing shared
canonical-JSON UTF-8 bytes of this exact identity object:

```text
schema: page-authority-style-master-plan-identity-v1
run_version
workflow
plan_generation
previous_plan_sha256
previous_selection_sha256
style_intent_sha256
style_context_sha256
candidate_generation_profile_sha256
compiled_prompt_sha256
generated_candidate_count
candidates: [
  { candidate_id, kind: generated } |
  { candidate_id: local-existing, kind: local-existing, candidate_sha256,
    candidate_provenance_sha256, candidate_media_type, candidate_width, candidate_height }
]
```

`candidate-plan.json` stores that identity and the recomputable `plan_sha256`; timestamps, host paths, current
compatibility bytes, grant/attempt status, and progress stay outside the identity. The exact head record has
`schema: page-authority-style-master-head-v1` plus only `run_version`, `workflow`, `plan_sha256`, positive
`plan_generation`, and nullable `previous_plan_sha256`. It cross-checks those fields against the plan and uses
expected absent/exact prior canonical bytes plus atomic rename as its CAS, without mtime or a second revision.

`plan` CAS-reads the scope head and derives plan status from its direct records. If it points to a nonterminal plan whose current canonical inputs match, the
command returns that plan and its derived progress idempotently. Canonical input drift makes a plan stale and
terminal for successor purposes unless it contains an uncertain submitted attempt, which must first use the
reasoned abandonment path. If the current plan is otherwise terminal, the owner allocates
the next generation and binds the predecessor plan so identical authored inputs still yield a distinct legal
successor. An unresolved mismatched head hard-stops with its inspect/repair action; directory order, timestamps,
and caller nonces never select or replace a plan.

The derived terminal predicate is exhaustive. Successor allocation requires canonical drift without an
unresolved submitted outcome, a known failed attempt, a completed exact abandonment, a `repair|redirect`
decision, or a current selection that proves the plan's `proceed` promotion. Unchanged `claimed`, incomplete,
complete-but-unreviewed, and decision-written-but-uncommitted `proceed` states remain on their exact same-plan
action. Submitted/transport-owned unknown without completed abandonment is blocked but not successor-terminal.
A `proceed` decision that later loses its previous-selection precondition becomes stale through selection drift,
not retroactively successful.

The Style Master prompt compiler may use only the authored intent plus the current closed style context and
the fixed no-readable-text output constraint. It shall not carry per-slide display literals, arbitrary files,
identity-reference paths, a caller provider request, or a page raw contract.

The owner writes immutable, relative-path-only candidate history under:

```text
1_upstream_raw_material/style-master-iterations/
  _staging/plan-<unique>/                         # incomplete initial bundle only
  scopes/<run-version>/<workflow>/head.json       # the only mutable current-plan pointer
  plans/<plan-sha256>/candidate-plan.json
  plans/<plan-sha256>/candidate-grant.json        # absent for zero generated slots
  plans/<plan-sha256>/review-decision.json        # absent until accept
  plans/<plan-sha256>/abandonment.json            # only for reasoned unknown-plan recovery
  plans/<plan-sha256>/candidates/<slot-id>/attempt.json
  plans/<plan-sha256>/candidates/<slot-id>/provenance.json
  plans/<plan-sha256>/candidates/<slot-id>/image.<detected-ext>
```

`candidate-plan.json`, `candidate-grant.json`, `review-decision.json`, and `abandonment.json` are write-once. A local-existing
candidate is copied without transcoding into the immutable plan directory only after its source bytes, detected
supported media type, and dimensions are rechecked; later payload
drift cannot alter that candidate. Each attempt is a monotonic CAS record: the claim is durable before provider
initialization, `submitted` plus its canonical provider-request digest is durable immediately before the one transport call, and only a terminal state may
name committed bytes/provenance. The grant never changes after authorization; consumption and progress are
derived from exact attempts that reached `submitted`, so no multi-file mutable grant transaction exists.

`candidate-grant.json` is canonical JSON with exactly these fields:

```text
schema: page-authority-style-master-candidate-grant-v1
run_version
workflow
plan_sha256
generated_candidate_ids       # exact plan order; generated slots only
max_submissions               # positive and exactly generated_candidate_ids.length
candidate_generation_profile_sha256
```

The list must exactly equal the plan's ordered generated slots and the profile must exactly match that plan.
`candidate_grant_sha256` is `canonicalJsonSha256` of this record, not a field in it. The grant contains no
timestamp, execution pointer, host path, mutable consumed counter, or provider outcome. `authorize` validates the
current scope head and plan, then atomically creates this one record; an existing file must exact-validate to the
same canonical record and return its digest, while any divergent existing bytes hard-stop without overwrite. Every
claimed, submitted, or terminal generated attempt retains this exact `candidate_grant_sha256`; inspection derives
consumption only from submitted attempts with that binding. This gives same-command replay one stable cost
authorization fact without turning the grant into another lifecycle head or mutable ledger.

Every generated slot's `attempt.json` is canonical JSON with exactly these fields:

```text
schema: page-authority-style-master-candidate-attempt-v1
run_version
workflow
plan_sha256
candidate_id
candidate_grant_sha256
status: claimed | submitted | succeeded | failed | unknown
provider_request_sha256          # null only while claimed
candidate_sha256                 # non-null only when succeeded
candidate_provenance_sha256      # non-null only when succeeded
reason_sha256                    # non-null only for abandonment-owned unknown
```

`attempt_record_sha256` is `canonicalJsonSha256` of the current exact record, external to it. The record has no
timestamp, provider prose/body, retry counter, or mutable consumption field. CAS permits only absent -> `claimed`,
`claimed` -> `submitted`, and `submitted` -> one terminal status; every non-claimed record has the exact submitted
request digest, and `succeeded` has the matching candidate/provenance digests while every other status has those
fields null. A transport-owned `unknown` leaves `reason_sha256` null; an abandonment-owned `unknown` binds the
normalized reason digest. A terminal record is immutable except exact replay, and a `claimed` record can advance
only as that same slot, grant, plan, and scope are revalidated.

`abandonment.json` is canonical JSON with exactly these fields:

```text
schema: page-authority-style-master-candidate-abandonment-v1
run_version
workflow
scope_head_sha256
plan_sha256
candidate_grant_sha256
candidate_id
unknown_attempt_sha256
provider_request_sha256
reason
reason_sha256
```

`scope_head_sha256`, `unknown_attempt_sha256`, and `abandonment_sha256` are external canonical-JSON digests of,
respectively, the exact head, terminal unknown attempt, and this abandonment record. A fresh abandonment must
match the current head and exact grant/attempt request binding; it atomically creates the record or exact-matches
it if an equivalent writer won. When a transport already owns `unknown`, the first abandonment record selects the
normalized reason; when abandonment owns the transition, the reason digest must also match the terminal attempt.
A different reason or any head/plan/grant/attempt/request mismatch hard-stops without replacement. Historical
replay returns only the existing exact record, including after the successor advances the head. These records make
the terminal predicate verify direct facts rather than infer a closed plan from filenames or an unknown status.

Initial plan publication writes and validates the plan plus any local bytes/provenance under the confined
same-filesystem `_staging/plan-<unique>/` root, atomically renames that complete bundle to
`plans/<plan-sha256>/`, and only then attempts head CAS. An existing destination must exact-validate before
staging is discarded. Readers ignore staging and complete plans not named by the scope head as current;
cleanup is confined to `_staging/`, runs only in an explicit plan mutation rather than observation, and never
deletes immutable history.

Local discovery has one deterministic rule. The owner checks only the layout-resolved canonical
`style_master.jpg` path. Absence means no local slot. Presence requires a confined regular file and a stable,
readable, supported PNG/JPEG snapshot with positive decoded dimensions; the copied immutable bytes are
rechecked before head publication. Any present source that fails those checks aborts planning before provider
initialization instead of being silently ignored while generated slots proceed.

Every candidate has immutable `provenance.json`. The local schema contains only its schema/kind, logical
`visual-style/style_master.jpg` asset key, and candidate digest/media/dimensions, so its canonical digest can
enter plan identity without a plan/provenance cycle. The generated schema adds plan/candidate IDs, compiled
prompt digest, generation-profile digest, canonical provider-request digest, and candidate
digest/media/dimensions. The provenance digest is external to the hashed record. A generated terminal attempt
references both candidate and provenance digests; files placed before a losing terminal CAS remain
non-authoritative.

A persisted `claimed` attempt proves that no submit was recorded and consumes no grant slot. Rerunning exact
`generate --plan-hash` revalidates the unchanged plan/grant/scope, recompiles the provider prompt, requires its
exact bytes to match `compiled_prompt_sha256`, and advances that same attempt to `submitted`
before its one transport call; it does not create another attempt or count as a retry. If canonical inputs drift
while the attempt is only `claimed`, the stale plan may close and receive a successor without unknown-plan
abandonment because no provider outcome is uncertain.

A known failed slot remains terminal and a plan without successful bytes for every planned slot cannot reach
review. Because later slots cannot restore that plan's review eligibility, the first known failure stops the
generate sequence before any remaining unsubmitted slot; their grant capacity remains unconsumed but cannot be
reused. A new candidate requires the owner-issued successor plan and new disclosed authorization. `authorize`
creates or exact-replays the canonical grant for an exact current plan digest, ordered generated-slot identity set,
maximum submissions, and generation profile. A zero-generated local plan skips authorize
and generate and proceeds directly to exact-byte review. `generate` performs the same bounded sequence for
generated candidates only:

```text
validate current plan + exact grant
  -> claim one generated candidate slot
  -> recompile and exact-match compiled_prompt_sha256
  -> mark that exact slot submitted with provider_request_sha256
  -> submit through the existing Image2 transport
  -> validate and atomically place bytes
  -> CAS the attempt to succeeded with byte/provenance digests
  -> derive owner-issued grant consumption and progress
```

The terminal provenance binds the compiled prompt and fixed generation-profile digests used by the one
transport request. A compiler/profile/input mismatch while only `claimed` remains pre-submit drift: no grant
capacity is consumed and the stale plan can follow its ordinary successor path.
The request digest is `canonicalJsonSha256` of schema
`page-authority-style-master-provider-request-v1`, plan digest, candidate ID, compiled-prompt digest, and
generation-profile digest. Every terminal attempt and generated provenance must exact-match the digest already
persisted at `submitted`; a response or preplaced artifact with another/missing request identity cannot publish.

A process interruption after `submitted` is never interpreted from file presence. A persisted `submitted`
attempt without terminal evidence evaluates as unknown without an observation write; an explicitly recorded
`unknown` terminal has the same recovery posture. Either consumes that grant slot and blocks the plan. The current transport exposes no authoritative lookup
for such a request, so this change does not invent provider reconciliation. `abandon` CAS-transitions the exact
`submitted` attempt to terminal `unknown` with the normalized human-reason digest, or exact-matches an existing
transport-owned `unknown`, before it writes immutable `abandonment.json` with that bounded human reason. That
attempt CAS is the sole arbiter against a late provider
terminal commit: only abandonment or `succeeded|failed` may win, never both. The abandonment record
derivationally closes only that exact current plan; it neither labels the attempt failed nor authorizes its
successor. A crash after the attempt becomes `unknown` but before the record commit is repaired by replaying
the reason whose digest is already bound by an abandonment-owned unknown; when transport had already committed
`unknown`, atomic record creation selects the reason because no provider terminal state can still race. Any
valid bytes placed before a losing terminal CAS remain unreferenced and non-authoritative. A later `plan`
creates a new generation, and any generated slots
require a new exact cost authorization. There is no automatic retry and no `--force`. The implementation may
reuse the shared provider transport, byte hashing, and atomic state utilities, but candidate
authorization/attempt records and candidate-count calculation remain Style Master-specific.

An exact abandonment replay returns the existing record even if a successor later advanced the scope head. A
different reason, plan, grant, or uncertain-attempt binding conflicts without mutation.

Reason normalization is deterministic and happens before CAS: convert to Unicode NFC, replace each Unicode
whitespace run with one ASCII space, trim, reject remaining C0/C1 controls, reject empty text, and reject more
than 512 UTF-8 bytes. The unknown attempt binds the SHA-256 of those exact normalized bytes;
`abandonment.json` retains the normalized text and digest. This makes equivalent user input replay-stable
without treating a materially different reason as the same recovery authorization.

### 4. Review and promotion are one visual-direction checkpoint

`review --plan-hash` validates the hash against the scope head, then validates every candidate's exact authority
chain before projecting real images: a generated slot needs the current plan/slot's exact grant-bound `succeeded`
attempt, submitted provider-request digest, matching image bytes, and generated provenance; a local-existing slot
needs its plan-bound immutable copied bytes and local provenance, with no invented grant or attempt. Preplaced
generated bytes/provenance, a failed/unknown/claimed attempt, or any plan/grant/request/byte/provenance mismatch
is not reviewable. The same validator projects only the selected workflow's current visual context. It returns the exact plan hash and the stable
candidate IDs that can be selected. The human then chooses:

- `proceed`: accept one named candidate's visual direction; the owner immediately attempts promotion against
  the plan's `previous_selection_sha256`.
- `repair`: keep the existing selection and return to style intent/candidate plan repair.
- `redirect`: keep the existing selection and return to visual-direction selection; a workflow change remains
  Structural Versioning Path work.

`accept` always carries the reviewed plan hash. Before writing a new decision or attempting the selection CAS,
it reuses the review validator against the current head, exact candidate authority chain, scope, and selection
context; it does not rely on an earlier CLI projection or create a second review receipt. `proceed` additionally
requires one current candidate ID; `repair` and `redirect` reject a candidate ID because they are plan-level decisions. The decision is a
`confirm` because it is a human visual judgment over real current bytes. It never acts as page raw
authorization, Pilot approval, raw acceptance, final evidence, or waiver. Candidate/profile/scope identity,
byte validity, authorization, attempt recoverability, and CAS conflicts are `hard-stop`s because they protect
provider cost, attribution, or a single writer. Deterministic candidate-plan/projection repair is a `guide`
and reruns the same checkpoint.

The write-once decision is deterministic canonical JSON with exactly schema
`page-authority-style-master-review-decision-v1`, run version, workflow, plan digest, decision, nullable
candidate ID/digest, and nullable previous-selection digest. `proceed` fills the candidate fields;
`repair|redirect` use nulls. It has no timestamp, path, display order, or projection field, and its canonical
record SHA-256 is `review_decision_sha256`; that digest is not a field of the hashed decision record. This lets concurrent identical decisions exact-match. Promotion's
only new human-decision time is `accepted_at` in the selection record; the CAS winner chooses it once and a
semantic loser/replay returns that exact winner record.

`accept` first writes or exact-matches the immutable review decision, then performs the selection CAS. A crash
between those steps is resumed only by the same plan/decision/candidate tuple. If the CAS already committed an
identical current selection, rerun returns that persisted record and its original `accepted_at` idempotently;
it does not mint a second decision, timestamp, or receipt identity. After the state CAS, `accept` ensures the
action-scoped, format-correct JPEG compatibility projection from the immutable selected bytes at the
layout-resolved canonical compatibility path, without creating an override. Projection
failure does not roll back or invalidate the selection; an exact accept replay may repair only a missing or
stale derived payload while returning the original selection record. This is the sole historical-plan
exception to head-currentness: it is legal only while the current selection record still names that exact
plan/decision/candidate tuple, even if a terminal successor has since become the lifecycle head. A newer
selection or any changed binding makes the replay stale and non-writing.

If projection fails after CAS, `accept` returns a nonzero producer-owned diagnostic that reports the already
committed selection identity and only the same exact accept replay as recovery. Inspection and
`style_master_accepted` continue to derive the authoritative selection as current; the diagnostic neither
pretends promotion failed nor advances to page raw authorization. A successful replay verifies or repairs the
derived JPEG and returns the original receipt/timestamp.

### 5. Controller and CLI expose one selected-workflow path

The public command family will use the restored top-level surface with fixed operations:

```text
ppt_flow style-master plan <run-dir> --candidate-count <0..4>
ppt_flow style-master inspect <run-dir> [--plan-hash <sha256>]
ppt_flow style-master authorize <run-dir> --plan-hash <sha256>
ppt_flow style-master generate <run-dir> --plan-hash <sha256>
ppt_flow style-master review <run-dir> --plan-hash <sha256>
ppt_flow style-master accept <run-dir> --plan-hash <sha256> --decision proceed --candidate-id <slot-id>
ppt_flow style-master accept <run-dir> --plan-hash <sha256> --decision repair|redirect
ppt_flow style-master abandon <run-dir> --plan-hash <sha256> --reason <text>
```

This intentionally grows the registered unified top-level inventory from 11 to 12 commands. Implementation
corrects the main `cli-surface` Purpose from its stale `fixed 14-command` claim to `fixed 12-command unified entry point`,
then updates the checked-in inventory/help assertions and coherence checks together because delta sync does not rewrite
Purpose; Style Master is not hidden
inside page raw `image2` or exposed as an unregistered direct executable.

Each command first resolves either the exact validated fresh-v2 authoring draft or the current v2 source/state
pair and one run-version/workflow scope from `<run-dir>`, then invokes only the Style Master owner. `plan`
materializes or returns its immutable provider-free plan; inspect and review are provider-free. `authorize`
rejects a zero-generated plan, and `generate` cannot run without generated slots and their exact grant.
Without `--plan-hash`, `inspect` reads the current scope head. With `--plan-hash`, it treats the digest as an
exact current-head assertion and fails stale rather than projecting a historical plan as actionable current
state; historical accept/abandon replay remains available only through those operations' exact-match rules.
Review and new acceptance require the exact head plan. The sole exception is an exact idempotent `proceed`
replay for the plan/decision/candidate still named by the current selection record; it may return that original
record and repair only its derived compatibility payload even after the head advanced.
`abandon` is legal only for the exact current plan with an unknown submitted attempt and records a normalized
human reason after CAS-preserving its outcome as terminal `unknown`. This is a recovery decision that preserves uncertainty, not a
waiver of recoverability or authorization to retry. Hard failures use the existing producer-owned final stderr JSON
envelope and return the earliest root cause plus one owner action; Controller code consumes the envelope
rather than recreating categories or recovery menus.

When selection CAS succeeds but compatibility projection fails, `accept` does not emit a success receipt on
stdout. Its nonzero final stderr envelope uses the existing schema: `diagnostic.subject.kind` is
`style_master_selection`, `diagnostic.subject.id` is the committed selection digest,
`diagnostic.reason.kind` is `compatibility_projection_failed`, and `diagnostic.next` is a non-human `rerun`
whose structured invocation preserves the same program and exact accept arguments. No Controller-specific
field or parallel partial-success schema is added.

After visual-system configuration, the `create-deck` Controller receives two exclusive Style Master subgraphs:
one for `framed` and one for `pure`. They share exact mechanical validators only below their public workflow
boundary. The Framed entry can present its Framed visual constraints; the Pure entry can present only Pure
visual context. Both must complete a `style_master_accepted` handoff before their existing raw-authorization
nodes can begin. The node condition is a read-only Boolean predicate: it returns only pass/fail after asking
the selection owner whether the exact record is current. It does not return an action, store candidate
progress, or duplicate selection records in generic Controller state. The Controller obtains any recovery
action from the Style Master owner's separate inspection/diagnostic interface.

### 6. Invalidation is selection-driven and uses existing owners

The accepted style selection identity joins the page raw generation profile. If intent, canonical style
context, selected candidate bytes, selection scope, selection receipt, or candidate generation profile drifts, the raw-profile validator
marks dependent raw plan/evidence stale before page raw authorization or submission. Existing raw-review,
finalization, and delivery validators then observe their normal stale evidence path.

No code advances `source_epoch` solely because style/profile facts change. No command rebinds prior raw bytes
or review evidence to a new style selection. A selected style change may therefore create Generated Image
Rebuild debt, while Text Frame-only and notes-only paths keep the Change 1 ownership boundaries when all
style facts remain exact.

### 7. Legacy file adoption is explicit and local

For an explicitly selected current run, a confined pre-existing `style_master.jpg` may be registered as a
local candidate by copying its rechecked exact bytes into the immutable plan directory and recording a
`local-existing` provenance classification. The owner does
not claim that it made a provider call or reconstruct a missing historical grant. The image remains ineffective
until the normal review decision and CAS promotion create an acceptance receipt.

This is the explicit per-run migration path, not a bulk migration command. A `--candidate-count 0` plan is
permitted only for this case and skips grant/generate; otherwise a plan has at least one disclosed new provider slot. The framework never scans decks, creates
candidate records for every old file, writes a receipt during observation, or changes files in an unspecified
run.

### 8. Selection and receipt are one state record, not two ledgers

The state owner adds `page_authority_style_master.by_version["3_versions/vN"]`. Its exact record is the
effective selection and acceptance receipt together, with no separate receipt file or mutable metadata mirror:

```text
schema: page-authority-style-master-selection-v1
run_version: vN
workflow: framed | pure
plan_sha256
candidate_id
candidate_sha256
candidate_media_type: image/png | image/jpeg
candidate_width
candidate_height
candidate_provenance_sha256
style_intent_sha256
style_context_sha256
candidate_generation_profile_sha256
previous_selection_sha256: <sha256 | null>
review_decision_sha256
accepted_at
```

The canonical JSON SHA-256 of that exact record is its selection/acceptance receipt identity. Promotion
compares `previous_selection_sha256` with the current record digest, atomically writes the replacement state
record, and then ensures the compatibility payload. `accepted_at` is created once and reused by an exact
idempotent promotion replay; that replay may repair only the derived payload after a prior projection
interruption. The state record contains no host path, page raw plan,
or duplicated candidate bytes. The raw-profile resolver uses the record digest and the referenced immutable
candidate bytes; it never reads `style_master.jpg` as authority.

The new map is optional in schema-v5 state so existing v2 bundles remain readable and byte-preserved. Its
absence means Style Master is unavailable, never unsupported state. A present record is different: the state
validator checks its canonical version key, exact field schema, matching `run_version`, and any bound
source/state workflow before Style Master currentness is evaluated. A structurally valid but stale record makes
readiness false and routes through Style Master inspection; a malformed present record makes state validation
fail closed without deletion, normalization, or writeback rather than masquerading as absence. The Style Master writer may add or CAS
replace one record for the exact active fresh-v2 draft after validating the selected source workflow, or for an
exact current source/state pair. It does not create the draft's missing production-mode or target-evidence
records. Later raw-plan source materialization preserves and revalidates this reserved evidence instead of
recreating it.

Structural publication applies the same version boundary. On first publication of vNext, the state writer
preserves every source-version selection record but does not copy, rename, or rebind one under the target
version key, even when the workflow is unchanged; the target starts with no accepted Style Master and its first
plan therefore has `previous_selection_sha256: null`. The target may explicitly adopt a local candidate through
the normal review path. The normal structural publication branch still requires an absent target. A separate,
owner-local exact replay branch is necessary once the target is visible: it accepts only the original confirmed
plan when the source-side canonical bytes/plan hash, target source bytes, parsed target receipt, and target
workflow/source-epoch evidence identity all exactly match that plan. Later target-owned raw evidence may be
nonempty, but it must remain structurally valid and bound to that same target tuple; replay does not require it
to look like the initial empty evidence record. It does not call the staging/publish path, create another vNext,
rewrite target source/overrides/generated artifacts, or invoke a provider.

That branch is a revalidation, not a second structural route. It must be reachable through the existing persisted
`slides apply-plan` recovery path, whose original transaction contains the exact target structural plan, and
therefore must recognize the visible exact target before the normal absent-target / `nextVersionName` and
source-active-execution checks. When the target has begun its own Controller execution, replay must not apply the source-side execution fence or reset
`playbook`, `run_version`, `current_node`, node records, or the continuation pointer. The state owner validates a
present target Style Master map using its ordinary strict schema/currentness boundary, then leaves a valid
target-owned selection record byte-for-byte in place; a stale selection remains non-ready, while a malformed map
or any target tuple drift hard-stops without writing. This is what makes an exact replay preserve rather than
erase later target work. Workflow-switch publication follows the same rule, and neither first publication nor
replay invokes a provider or rewrites a compatibility payload.

`style_master.jpg` is an action-scoped, valid-JPEG compatibility projection only at the layout-resolved path.
Promotion and an exact idempotent promotion replay may write that path, but it never creates a version override automatically and never changes
another version's selection record. If the payload is missing or belongs to a different action, the owner can
rebuild it from the requesting run's accepted record through that same exact replay; its state cannot block or
satisfy page raw readiness.

## Risks / Trade-offs

- A Style Master candidate loop adds a small mutable lifecycle head plus persistent records before Change 3.
  The head is justified because plan hashes and immutable history cannot establish which same-input generation
  is current after a terminal failure. The other records are justified because a
  paid candidate attempt, human decision, and selected byte provenance cannot be reconstructed safely after
  interruption. Keeping all of them in the one Style Master owner avoids the heavier page raw ledger early.
- `style_master.jpg` ceases to be sufficient authority. Older runs must intentionally review/adopt it before
  new page raw work. This is deliberate: it removes hidden acceptance while preserving the physical asset.
- A CAS conflict may require a fresh review instead of choosing a "latest wins" overwrite. That preserves one
  exact version/workflow scope and one writer, which is simpler than conflict merge rules.
- Candidate count is a required `0..4` bounded control, not a page batch. It is an exact finite cost boundary
  for visual-direction work only; `0` exists solely for explicit local-existing adoption. Change 3 still owns
  page count, slide IDs, Pilot scope, and Expansion.

## Migration / Recovery

- No automatic migration runs. Observation is read-only and reports either a current accepted selection or
  the owner action to inspect/plan/review the exact Style Master work. An existing v2 run with no selection
  remains readable, but its legacy raw lineage cannot be silently rebound and requires local-candidate review
  followed by Generated Image Rebuild before new production can be current.
- Candidate plan/grant/selection mismatches, missing intent/context, invalid candidate count or candidate ID,
  missing bytes, invalid paths, bad receipts, unknown attempts, and CAS conflicts fail closed before the next
  provider call or promotion. Repair uses the named owner and reruns the same operation.
- A terminal candidate attempt remains immutable. Failed plans may receive an owner-issued successor; unknown
  attempts remain recorded as unknown and require an exact immutable abandonment record before a successor. A new paid
  candidate always requires a newly disclosed exact authorization.
- The first known failure stops remaining candidate submissions for that plan; an unusable terminal plan does
  not spend its unconsumed grant capacity merely because the maximum was authorized.
- A pre-submit `claimed` attempt resumes only through the exact plan's same generate action and same attempt;
  it neither consumes a grant slot nor requires unknown abandonment.
- Derived current payload/projection copies can be rebuilt from the authoritative selection by exact promotion
  replay. No one hand-edits
  `_generated/`, receipt, state, journal, or authorization to recover.

## Verification Strategy

**Unit:** Candidate-plan canonicalization and digest stability for prompt, style-only context, fixed profile,
one-tuple scope, local copied-byte/media identity, generation/predecessor, count, and slot order; scope-head CAS and
same-input successor allocation; exact immutable grant field/digest validation, atomic create-or-exact-replay,
attempt-grant binding and exact attempt/abandonment field/digest/CAS validation, generated-versus-local review-chain
validation, and derived consumption; candidate byte validation;
monotonic attempt transitions, same-attempt claimed recovery, and first-failure stop; candidate-ID decision validation; selection CAS; legacy local-candidate
classification; diagnostic root/action mapping; and Boolean Node condition behavior without file-presence inference.

**Integration:** Use minimal framework fixtures, never production decks, to prove plan -> authorize ->
candidate commit -> review -> named-candidate promotion; zero-generated local review without a grant; zero page
raw calls during every Style Master operation; partial-write cleanup including pre-submit claimed resumption;
post-CAS compatibility-projection recovery without a second selection/timestamp; stale prompt/context/profile/selection
short-circuiting; unknown-attempt abandonment and successor authorization; atomic conflict preservation;
fresh-draft source validation and promotion through the read-only candidate resolver without calling the
materializing validation path; manifest-backed draft reachability after workflow selection, through both
selected-workflow Style Master branches, and into first raw planning with unknown/sibling/post-raw nodes fenced;
raw-plan rejection before accepted selection; and normal stale evidence
projection after promotion.

Structural integration additionally proves that first vNext publication retains source-version selection
history without creating a target-version selection, that same-workflow and workflow-switch targets both fail
the readiness predicate until their own promotion, and that exact structural replay preserves a later valid
target-owned record without changing either version or the layout-resolved compatibility payload. It exercises
the persisted `slides apply-plan` route after target Controller activation, proving that exact target revalidation
does not stage a new version or reset target Controller execution; a target source/receipt/mode/evidence mismatch
instead fails closed before either target source or state changes.

**E2E:** Add one mock Framed and one mock Pure Controller journey through the separate Style Master handoff,
real candidate-byte projection, `proceed` promotion, and the first allowed page-raw planning step. Assert
that neither journey runs page raw provider work, Pilot/Expansion logic, sibling-workflow UI, or legacy CLI
surface. Run the full regression suite after focused owner and process-level CLI tests.
