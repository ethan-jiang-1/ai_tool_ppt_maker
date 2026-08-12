## Context

See [proposal.md](proposal.md) and the Image Generation delta for the behavior
contract. The current Framed request has a deterministic protected-composition
binding, an opaque shared transport, exact raw lineage, and one Complete Page
Review. It deliberately does not claim that prompt guidance is a native
provider constraint or a general output guarantee.

The prepared probe research describes a bounded three-sample experiment, but it
is preparation only. A paid Provider attempt must remain attributable to an
active Task Mandate; C7's production repair cannot be used as the experiment or
as its evidence source.

## Goals / Non-Goals

**Goals:**

- Make one future disposable Framed trial reproducible from direct current
  authority: source, compiled request, plan, grant, attempt, provenance, and the
  existing provider/composite review artifacts.
- Keep the new trial-specific provider-cost decision to one explicit,
  scope-limited Work Request. Once it exists, the Agent performs normal
  mechanical lifecycle work without repeated raw-page cost prompts, while the
  existing content, Style Master, and page-review decisions retain their own
  owners.
- Preserve a secret-safe, audit-friendly conclusion that is explicitly bounded
  to at most three samples and cannot be mistaken for acceptance or a provider
  contract.

**Non-Goals:**

- No provider attempt, credential lookup, disposable probe-run creation, or
  production-bundle read occurs while this change is only planned or applied
  without an explicit Work Request.
- No new runtime state, derived artifact role, CLI command, provider transport
  field, occupancy/OCR evaluator, acceptance gate, waiver, retry, migration,
  or C7 modification is introduced.

## Decisions

### 1. Treat the Work Request as the only new trial cost decision

The existing MD Controller changed-goal path obtains one explicit Work Request
that identifies the new disposable probe run and caps raw-page provider
submissions at three. That is a `confirm` for a new, bounded cost goal under
`human-centered-gates.md`; it creates the normal Task Mandate, not a
trial-specific approval record. The Agent then owns all legal provider-free
preparation and normal mechanical actions. A missing request is a hard-stop for
submission because it protects attributable provider execution; the nearest
legal action is to obtain that Work Request.

The Work Request does not replace existing human-owned decisions: the exact
narrative-page plan needs its normal content/structure confirmation; Style
Master review and promotion retain their existing `proceed | repair | redirect`
decision; and every submitted provider page retains its own Complete Page
Review. These are not new trial gates, and their existing records remain their
only authority. A Work Request cannot select a Style Master, accept a page, or
turn a source asset into accepted evidence.

Alternative considered: ask for a confirmation per raw-page sample. Rejected
because a clear bounded Work Request already covers ordinary in-scope raw-page
cost and repeated prompts add no evidence or control.

### 2. Reuse direct runtime authority and publish no new runtime record

The JS/runtime facts remain the current plan, grant, attempt, provenance, and
Complete Page Review artifacts. The trial evidence is recorded only in this
change's `evidence.md` after the authorized work: stable identifiers, digests,
safe locators, submitted count, transport field names, and the three-state
observations. It contains neither credentials, raw prompt prose, provider
bodies, nor copied raster bytes.

This follows `agent-assistance-and-control.md`: the evidence file is an audit
projection, not a source of record, selector, or recovery authority. It avoids
an additional schema/stage, persistent state, writer, reader, invalidation
rule, and parallel success store.

Alternative considered: add a trial-result artifact under `_generated/`.
Rejected because the canonical facts already exist and a new durable artifact
would duplicate authority while widening the production contract.

### 3. Preflight with existing owners in dependency order

The Agent first validates the selected disposable scope through the existing
current source/configuration, Style Master selection, protected-composition,
plan, and grant checkpoints. A failure stops at the earliest owning diagnostic; dependent
failures are not reported as a second trial-specific control. The sample count
is recorded from canonical submitted attempts for the selected exact scope, not
from a conversation summary or prior evidence file.

New probe source uses the current unversioned `identity.scheme: mnemonic` and
the established two-BlockCase identity grammar. Its exact narrative plan remains
subject to the existing content/structure confirmation before source
publication. This is a hard-stop for identity, integrity, and authorization
failures. The same-check recovery is the owning repair followed by re-running that
checkpoint. No fallback request, copied media, or retry branch is permitted.

For a fresh scope, the existing Style Master lifecycle remains a prerequisite to
the raw plan. A zero-generated candidate plan is legal only when the new probe
already has a valid canonical local candidate in its own source scope; it still
requires the ordinary Style Master review and promotion. If it does not, the
owner stops at its existing candidate-planning action. The raw-page Work Request
does not authorize a generated Style Master candidate, reuse a C7 or production
candidate, or create a new candidate-acquisition route.

Alternative considered: create a new preflight command and trial state
machine. Rejected because it would duplicate current lifecycle evaluation and
conflict with the simple-reliable-control policy's one-truth-path rule.

### 4. Use distinct probe pages for independent submissions

The disposable probe run contains one to three deliberately identical
non-identity probe pages, each with a distinct stable `slide_id`. The selected
pages form one exact batch and one exact grant whose `maximum_submissions`
equals the requested sample count. The existing owner then claims no more than
one eligible page per `generate` invocation.

The compiled input legitimately differs per page because it binds the formal
slide identity. The evidence therefore records one compiled-input digest per
sample rather than claiming byte identity. The repeated source facts hold the
experiment constant; stable identity and immutable attempt lineage remain
unmodified.

Alternative considered: resubmit one page three times. Rejected because a
submitted exact scope cannot be reopened or replaced without violating the
existing attempt/CAS discipline.

### 5. Keep observations advisory and bounded

For each completed sample, the Agent records `observed`, `not_observed`, or
`indeterminate` for four unambiguous phenomena from the existing provider and
composite review artifacts: provider body in the reserved header, key subject
in the reserved header, provider body in the body-safe region, and local-header
legibility in the composite. It may state the transport field set seen by the
normal request, but no result is elevated into a native-provider claim.
Complete Page Review retains its existing `proceed | repair` decision; the trial
never writes or interprets that decision as a capability result.

Alternative considered: automated OCR/collision pass-fail or a trial-level
acceptance gate. Rejected because the current contract retains human review and
an automated quality layer would create a second acceptance controller without
a reliable provider guarantee.

### 6. Defer native transport work to a result-shaped change

If the authorized samples and primary provider documentation identify a real
native constraint primitive, this change records that evidence only. A later
OpenSpec change must specify any transport field, request contract, provider
failure behavior, schema declaration, invalidation, and tests. If the result is
negative or indeterminate, the current bounded-best-effort contract remains
current.

## Risks / Trade-offs

- [External cost or unavailable provider] -> No attempt occurs without the
  scope-limited Work Request; failed calls follow the existing exact terminal
  or reconciliation path and consume no implicit retry.
- [A small sample is overgeneralized] -> The evidence schema uses only bounded
  observation language and explicitly prohibits a guarantee or native claim.
- [A disposable scope leaks into production work] -> The Work Request and every
  recorded locator identify the new probe run; C7 is out of scope and its files
  are never read or mutated.
- [A fresh probe has no local Style Master candidate] -> The existing Style
  Master owner stops before raw planning. The Work Request does not permit a
  generated Style Master candidate; the human must use the existing source and
  Style Master decision path or separately authorize a new cost goal.
- [Evidence leaks sensitive provider data] -> `evidence.md` permits identifiers,
  digests, field names, and safe locators only; review records stay with their
  owning lifecycle artifacts.

## Migration Plan

No migration or rollout exists. The current bounded-best-effort contract remains
current until an independently proposed provider-transport change is accepted.
The authorized trial, if it later runs, creates ordinary immutable lifecycle
evidence in its selected disposable scope. To abandon the trial, do not submit
a sample; to recover a submitted attempt, use the existing owner-issued
terminal or reconciliation route. No record is rewritten or manually repaired.

## Verification Strategy

- **Existing checks:** use the accepted focused Framed/Core/review tests and
  public-CLI mock journey to reconfirm the reused plan, grant, provenance, and
  Complete Page Review boundaries. They do not stand in for empirical provider
  evidence.
- **Sample discipline:** verify the selected batch/grant uses distinct probe
  pages, its `maximum_submissions` equals the recorded sample count, and each
  attempt has its own bound page-specific request digest. Confirm source
  identity, narrative-plan confirmation, and the accepted current Style Master
  through their existing owners before this check.
- **External evidence:** after the explicit Work Request, record up to three
  real disposable-run samples in `evidence.md`, with the existing direct
  runtime facts as its references; then run the focused suites, `npm test`,
  strict OpenSpec validation, the layout self-check, and `git diff --check`.

## Evidence Template

Create this change's `evidence.md` only after the Work Request and without
putting any secret or provider payload into it:

```markdown
# Implementation Evidence

## Work Request
- Probe-run locator:
- Provider submission limit: authorized count (1-3)
- Scope statement: newly initialized disposable Framed probe run; C7 and
  existing production targets excluded

## Current Binding
- Source / Style Master selection / plan / grant digests and safe locators:
- Sample count / selected slide IDs / maximum submissions:
- Observed transport field names:

## Samples
### Sample 1
- Attempt / provenance / provider-page / composite locators:
- Compiled-input / protected-composition digests:
- Provider body in reserved header: observed | not_observed | indeterminate
- Key subject in reserved header: observed | not_observed | indeterminate
- Provider body in body-safe region: observed | not_observed | indeterminate
- Local header legible in composite: observed | not_observed | indeterminate

Repeat the Sample section for every submitted page.

## Bounded Conclusion
State only what the submitted samples observed. Do not claim page acceptance,
a general provider guarantee, a native primitive, or authority for a transport
change.
```
