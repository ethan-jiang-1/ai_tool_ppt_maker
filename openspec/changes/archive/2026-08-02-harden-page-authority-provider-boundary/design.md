## Context

See `proposal.md` for the motivation. The selected Pure and Framed adapters
already compile `provider_requests_by_slide` from their current receipts and
raw contracts. That object is held only in memory. The progressive raw owner
persists a canonical request digest before submission, then currently accepts
any nonempty byte result for materialization. `ppt_flow.mjs` is the common
selected-adapter transport boundary, and `fast-png` is an existing dependency
used elsewhere for CRC-checked PNG decoding.

The direct progressive plan, batch/grant records, attempts, and materialization
provenance are the existing authority chain. The implementation must not make
an inspection projection, a CLI consumer, or a media validator a competing
state owner.

## Goals / Non-Goals

**Goals:**

- Publish a deterministic local view of exactly the prompt each selected
  adapter would send for the current progressive plan.
- Reject invalid provider media before it can become Page Authority raw
  evidence, with a bounded outcome that reuses the current lifecycle.
- Keep normal CLI output and failure diagnostics secret-safe.

**Non-Goals:**

- Adding a provider call, a direct prompt override, a force/retry flag, or a
  new human gate.
- Treating the inspection file as an authorization, reconciliation, or raw
  evidence record.
- Persisting provider response bodies, image bytes, or a second media-failure
  state store solely for diagnosis.
- Promising that a third-party provider honors its requested image size.

## Decisions

### 1. Write one rebuildable inspection sidecar from the selected adapter

JS owns the projection. A new run-relative Page Authority raw path,
`provider-request-inspection-v1.json`, will live beside the rebuildable
raw-plan projection. The selected Pure and Framed plan builders will write it
only after they have created or replayed the current progressive full plan.
The path helper remains the sole path authority.

The sidecar will bind the progressive plan digest, target raw-work-plan digest,
source receipt/epoch, workflow, provider profile, and ordered item tuples. For
each item it will contain the canonical provider-request digest and the exact
serialized prompt string used by the transport. It will also carry only safe
fixed transport facts needed to interpret that prompt, such as model and
requested output dimensions. It deliberately omits the transport's image data
URLs, credentials, headers, and provider response data.

The writer will validate exact plan membership and request digest agreement
before atomically replacing the sidecar. `image2 plan` will return a
run-relative path, its projection digest, and the current plan hash. Generate
will not read the sidecar: it recompiles the current request through the
selected adapter and the raw owner persists that request's digest as it does
today. This makes plan drift naturally replace the display projection without
granting it authority.

Alternatives considered:

- Persist raw prompts in progressive attempt records: rejected because prompt
  text is not lifecycle authority and would enlarge immutable paid-attempt
  history and migration scope.
- Add a prompt-inspection CLI command: rejected because plan already creates a
  provider-free, plan-bound checkpoint and the returned local reference is a
  smaller surface.
- Include the full HTTP body: rejected because it contains image data URLs and
  is not safe diagnostic output.

### 2. Validate PNG bytes at the common selected-adapter boundary

JS in `targetPageAuthoritySubmitFactory` owns provider-result decoding. After a
successful provider HTTP response yields inline bytes, it will use the existing
CRC-checked PNG decoder and require an exact `2000x1125` result before returning
bytes to the progressive raw owner. The adapter will construct a tagged known-
failure error for empty, malformed, non-PNG, or wrong-dimension media. The tag
contains only a fixed expected media shape and bounded actual media facts.

The progressive raw owner already recognizes tagged Page Authority failures.
It will retain its existing terminal `known_failure` transition and expose the
safe media facts in that invocation's terminal outcome. It will not create a
materialization/provenance record or `succeeded` attempt. Attempt records stay
unchanged, preserving compatibility with existing generated histories; later
inspection still uses their existing request digest and lifecycle state.

Alternatives considered:

- Decode after raw materialization or only in Framed assembly: rejected because
  invalid bytes would already be production evidence and Pure would remain
  unprotected.
- Resize or transcode a wrong-size image: rejected because it converts a
  provider contract violation into falsely attributable source material.
- Persist detailed provider-media facts in the attempt schema: rejected for
  this change because the bounded terminal outcome diagnoses the failure while
  avoiding a backwards-compatibility and state-migration expansion.

### 3. Preserve producer-owned CLI diagnostics and the existing cost gate

`cli-surface` remains the authority for command output and failure envelopes.
The plan projection will expose the sidecar reference but never its prompt
content. A definite invalid-media response is an integrity hard-stop for that
item: the raw owner records its already-paid attempt as `known_failure` and
returns its existing legal successor/remaining-scope action. The normal paid
authorization gate is unchanged.

This follows the gate policies as follows:

- **Guide:** opening the provider-free local sidecar is optional diagnosis and
  cannot change authoritative records.
- **Confirm:** the existing human batch authorization remains the only paid
  continuation.
- **Hard-stop:** invalid media cannot materialize, be resized, or be promoted;
  the only legal recovery is the raw owner's existing derived action.

There is no new controller. The selected adapter writes/rebuilds the diagnostic
projection; the progressive raw owner writes authoritative lifecycle records;
the CLI producer reports bounded facts; the Agent or human chooses only among
the already owner-issued actions. A focused negative test for invalid media is
the quality layer: it checks the direct provider bytes before any more complex
raw/review/final evidence is created.

## Risks / Trade-offs

- [A local inspection sidecar contains user-authored prompt prose] -> It is
  created only at the explicit provider-free planning checkpoint, referenced by
  a local path, and never copied to ordinary CLI output or diagnostic envelopes.
- [Sidecar write fails after a plan is current] -> The full plan remains the
  authority; rerunning the provider-free plan checkpoint rebuilds the missing
  projection without a provider call or state repair.
- [A valid PNG has the wrong visual quality] -> Exact media validation protects
  format and dimensions only; the existing review gate continues to own visual
  assessment.
- [Invalid response facts are useful after the command ends] -> The immutable
  attempt preserves the submitted request identity and terminal lifecycle, but
  not raw provider content. Re-running planning exposes the current request;
  a separate future change can add durable, schema-versioned failure evidence
  only if operational use proves it necessary.

## Migration Plan

1. Add the rebuildable path/helper and selected-adapter projection writer, then
   expose its bounded reference from the existing plan projection.
2. Add adapter-bound PNG validation and propagate its safe facts through the
   existing `known_failure` result path.
3. Add focused Pure, Framed, raw-owner, and CLI tests using synthetic provider
   responses; no test invokes a live provider or treats a `deck_*` directory as
   a fixture.
4. Existing run bundles need no source or state migration. Their inspection
   sidecar appears on the next `image2 plan`; all generated artifacts continue
   to be rebuilt through their owner and are never hand-edited.

Rollback consists of removing the rebuildable sidecar and adapter validation
code from a future revision. No canonical source, grant, attempt, provenance,
or accepted evidence schema is rewritten by this change.
