## Context

See `proposal.md` for motivation. The current Page Image Workflow already has authoritative
immutable Style Master and progressive-production owners, bounded inspection projections, and an
optional `_state/page-production-task-projection.md`. The latter is intentionally controller-route
dependent and may be rebuilt by `state`; it is not a complete artifact navigator and its display
reference formatter intentionally cannot resolve a short value.

The proposed view must work for an exact current run whether the controller is still active or the
run has reached delivery. `bundle_layout.mjs` remains the only owner of the run-bundle path
vocabulary. Existing owner readers, validation, identity fencing, and CLI error emission remain
authoritative; the view must not scan content-addressed directories to invent currentness.

## Goals / Non-Goals

**Goals:**

- Produce one explicit, local, current-run Markdown view with human-oriented labels, absolute
  locators, artifact types, and inspection purposes.
- Reuse canonical owner facts and exact current-protocol identity checks; preserve page ordering and
  candidate identity without introducing a second lifecycle reader or state model.
- Make human inspection handoffs mechanically repeatable while preserving all existing review,
  authorization, and generated-artifact ownership boundaries.

**Non-Goals:**

- No physical short-path directory, symlink, resolver, digest-prefix command input, storage-key
  migration, or history rewrite.
- No change to existing normal success JSON, direct exact-hash arguments, task-card eligibility,
  provider work, lifecycle state, review evidence, or delivery bytes.
- No attempt to prove that every conceivable optional artifact exists; the view is an availability
  report, not a completeness validator or a new human gate.

## Decisions

### 1. An explicit `image2 artifact-view` writes one derived run-scoped Markdown file

`ppt_flow image2 artifact-view <run-dir>` is the sole public trigger. After the existing current
protocol identity boundary succeeds, it atomically rebuilds
`_generated/page_image_workflow/reference/human-artifact-reference-v1.md` and returns only the
exact run/workflow and resulting local locator. It is provider-free and does not invoke `status`,
write any `_state/` file (including the Page Production task projection), or edit canonical
owners. The CLI routes it before the generic lifecycle operation tail that refreshes the task
projection.

This is a **JS/CLI-owned deterministic projection**. It is intentionally explicit: `status` keeps
its zero-write observation contract and ordinary `state` retains only its existing task-card
behavior. An Agent calls this command immediately before a human inspection handoff, then owns
the conversational selection of which listed artifacts to cite.

An alternative of extending `_state/page-production-task-projection.md` was rejected because that
card is controller-route scoped, carries progress/action prose, and is permitted to refresh during
ordinary state observation. A top-level generic `artifact-view` was rejected because the view
starts as an exact Page Image Workflow capability and belongs alongside the existing `image2`
identity, error, and owner routing.

### 2. Cross-owner composition remains in the CLI; the renderer consumes only validated facts

`ppt_flow.mjs` is the approved cross-owner process adapter. After target identity has selected the
exact run, it will call narrow public, read-only owner inspectors and pass their already validated
facts to a dependency-light shared renderer. The renderer will not import either workflow adapter
or `05-delivery`, parse immutable records, or discover currentness. If an owner lacks a narrow
reader, extract one from that owner rather than duplicating its receipt validation in the CLI or
renderer.

In particular, the existing internal delivery receipt reader will become a public read-only
delivery-inspection seam that validates the same final-manifest, assembly, notes, delivery-media,
and PPTX bindings without refreshing notes or writing output. The CLI invokes it only when an
owner-established delivery fact exists; a pre-delivery run therefore remains a successful partial
view. The new shared renderer is registered in the Harness architecture contract as a public
interface and receives no policy-specific provider semantics.

The CLI composition obtains each category from its owner:

| Category | Direct authority | View behavior |
| --- | --- | --- |
| Style Master | selected/current Style Master lifecycle record | Candidate identity plus the verified candidate/review media locator. |
| Provider input | current raw plan and its inspection projection | Inspection locator only; never emit its prompt contents. |
| Raw/Pilot/Complete review | validated current plan, terminal evidence, and review owner | Per-page review/raw locators in full-plan order when their exact owner contribution exists. |
| Final media | current final manifest and exact final entries | Per-page final PNG locators in full-plan order. |
| PPTX, notes, delivery | validated delivery/assembly/notes owners and receipt | Deck-level locators only when the owner establishes their current result. |

Neither the adapter nor the renderer may choose a plan by directory order, accept copied bytes, or
parse a previous view. It may include a locator only after the relevant owner record identifies it
and a confined regular-file check confirms the resolved local path. A missing future-stage
artifact is omitted or shown as unavailable; it does not cause a recovery action. An invalid
identity, invalid owner record, or path escaping the resolved run/deck scope uses the existing
owner-issued hard-stop or failure path before any view write.

This preserves **one truth path**: lifecycle owners establish availability, the view only formats
it. It avoids a second registry or writable state. The corresponding gate posture is `guide` for a
successfully rendered partial view, no `confirm`, and existing `hard-stop` behavior for identity,
integrity, confinement, or recoverability failures. No waiver or force flag is introduced.

### 3. Display references aid reading but cannot enter any control path

The renderer will use a small typed internal entry shape containing kind, optional current
full-plan position/stable ID or candidate ID, display reference, artifact type, purpose, and
absolute locator. Per-page labels use the current `NN_slideID` order; Style Master labels use the
stable candidate ID. Digest-derived labels reuse the existing kind-prefix plus collision-suffix
rule, extracted to a dependency-light shared helper only if both the task projection and view need
the same pure formatter.

Markdown labels, not raw 64-hex strings, are the primary display text. A physical locator can
naturally include a content-addressed directory segment; that is an unavoidable implementation
path and never becomes an abbreviated input grammar. The renderer must redact or reject any
unbounded provider/prompt/environment material rather than serializing owner records wholesale.

The alternative of adding `--short-refs` or display fields to all existing JSON was rejected: it
would broaden the machine protocol and still leave Finder/terminal navigation and Agent handoffs
inconsistent. The alternative of short aliases was rejected because it would change container
validation, CAS/lock assumptions, and lifecycle selection semantics.

### 4. Guidance owns the human handoff; the runtime owns only facts and rendering

`AGENT_CONTRACT.md` and the generated deck guide will require the Agent to regenerate the view
before asking a person to inspect an artifact, then cite the requested locator, artifact type, and
purpose. The guidance must state that a locator is a read target, never permission to edit
`_generated/` or approval of the referenced artifact.

No Controller node, State field, receipt, task-projection field, or additional decision is added.
The human continues to make only existing visual/review and provider-cost decisions; the Agent
performs the authorized deterministic command and communicates its result. This removes the
repeated manual path reconstruction step without creating a parallel control layer.

## Risks / Trade-offs

- [A view links to stale or copied evidence] -> resolve from current validated owner records,
  verify confined regular files, and omit optional unavailable output rather than scanning history.
- [An absolute path becomes stale after a bundle moves] -> the view is deliberately run-scoped and
  rebuildable; rerun the explicit command after relocation rather than persisting a locator map.
- [Long hashes remain visible inside physical paths] -> keep them out of labels and display refs;
  do not disguise them as protocol-shortening aliases.
- [The command becomes a hidden lifecycle route] -> command scope is read/derived-view only, with
  focused negative tests for no provider initialization, state mutation, grant, decision, or
  selector translation.
- [Partial output is mistaken for delivery completeness] -> label unavailable stages explicitly
  and preserve owner-issued review/delivery actions; do not calculate completeness in the view.

## Migration Plan

No data migration is required. The new path is a compatible derived leaf for an exact supported
run and is produced only on explicit invocation. Existing bundles have no view until requested;
they retain all current authority and behavior. Deleting the new file is the rollback for its
derived output, while reverting the Harness change removes the command without touching immutable
records or media.

## Planning Review Record

1. **Coherence pass:** verified the proposal-to-delta-to-design-to-task chain covers every stated
   behavior and its test/closeout work. The capability boundary remains existing
   `harness-charter`, `run-bundle-layout`, `image-generation`, `cli-surface`, and
   `node-specification`; no storage-migration or global CLI-display capability was smuggled in.
2. **Authority and control pass:** traced the current Image2 dispatcher, task-projection tail,
   Style Master/raw owner readers, delivery receipt reader, and architecture contract. It found
   that the ordinary Image2 tail refreshes a task projection; the design/spec/tasks now require
   `artifact-view` to bypass that tail and preserve `_state/`. It also requires a narrow delivery
   owner inspection seam and keeps cross-owner composition in `ppt_flow` rather than a shared
   reverse import.

Both passes were planning-only: no provider work, Harness source, tests, task completion, or
lifecycle artifacts were changed. With the verification below, the change is ready for apply.

## Verification Strategy

- **Unit:** use temporary current-run fixtures to prove owner-only entry construction, stable
  candidate/slide ordering, collision labeling, secret redaction, confined absolute paths, and
  absence handling. Negative cases cover selector rejection and an invalid/escaping owner path.
- **Integration:** exercise the renderer against representative Framed and Pure lifecycle facts,
  including Style Master, review, final/delivery and a pre-final partial run. Assert that the
  generated view has no authority effect after manual modification or deletion.
- **Process CLI:** verify public help and `image2 artifact-view` success output, v2 hard-stop, no
  provider request, byte-identical `_state/` before/after snapshots, and byte-identical existing
  `status`/`state` machine output for a fixture run.
- **Guidance/layout:** verify `bundle_layout` declares the canonical leaf and newly initialized
  deck guidance contains the locator-only handoff rule.
- **E2E:** no provider-backed E2E is added because the change performs no remote work and all
  command/owner boundaries can be exercised against isolated fixtures; existing protected full
  regression remains required before archive.
