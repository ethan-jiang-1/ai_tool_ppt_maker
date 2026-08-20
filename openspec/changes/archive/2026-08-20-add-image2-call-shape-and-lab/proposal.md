## Why

Production Image2 already binds a closed request transport vector, but three
truths still disagree: confirmed profiles that omit `transport` still fire
generations+JSON at `2000x1125`; `ppt_flow probe` then children into
`env-check --smoke|--probe-vendors`, which hard-codes `POST /images/generations`,
`gpt-image-2`, and `1024x1024`, and treats a `task_id` as success; vendor
discovery still lives in deck `_scratch/` scripts that can also accept a raw
PNG body or a result URL. Deck
`deck_ai_org_transform_keynote/_lessons/image2-vendor-experiments.md` proved the
split: Packy needed `edits`+multipart+`2048x1152`+a long prompt; Micu capped
near 4k; Duckcoding returned HTML; APIMART accepted a long prompt as an async
task without a proven PNG; `/v1/models` was not proof. The same deck's
confirmed profile still has no `transport`, so official generate is not the
proven call.

The product need is two sessions on one Run Bundle: Session A draws through
the normal PPT flow; Session B only discovers how this vendor's GPT Image 2
must be called. Handoff is one immutable trial (`trial_id` + `trial_sha256`),
then the Deck Author confirms that Call Shape value into the provider profile.
Credentials and base URL stay in `.env`. This change exists now because
`bind-image2-transport-capability-vector` already closed the request pairing;
leaving probe and retrieve on the old hardcoded path keeps the dual truth that
change was meant to end.

## What Changes

- Name the page-image **Image2 Call Shape value**: model, prompt budget,
  closed transport vector, and a closed `result_protocol`. One validator.
  Omitted `transport` / `result_protocol` canonicalizes to a **named default**
  that is digest-identical to today's generations+JSON+`2000x1125`+async-poll
  plus the current production retrieve dialect (`json-inline-b64`: JSON
  submit; inline `bytes_base64`/`b64_json`; async `GET ${base}/tasks/{id}`;
  redirects rejected). Direct PNG bodies and result-URL downloads stay out.
- Extract a **shared stateless executor** under `scripts/shared/image2/`.
  Production, probe, and Lab wrap it. It does not take `runDir`, parse a
  profile, or write State/grants. Success is the current production PNG
  inspector, including actual dimensions.
- Require a deck-root **`_lab/`** scaffold: `init` always writes it from the
  same `initBundleForDraft` deck-root seed loop that already mkdir's `_state/`
  and `_lessons/`; Lab CLI heals a missing scaffold before plan/trial writes;
  generate does not write `_lab/`. Empty `_lab/` does not block PPT flow.
  Generate and probe do not read `_lab/`. Internals are not
  filename-whitelisted. No `last-proven.json`. There is no pre-existing
  post-init `ensureDeckRoot()` that already heals `_lessons/` on every
  mutating command.
- Add a standalone **Image2 Lab** CLI and playbook. Pending profiles may be
  trialed. Admission precedes fetch and plan/trial writes. Bounded trial plan +
  exact plan-hash execute is the Work Request; it does not clone
  `image2 authorize`. Lab does not write `_lessons/`, profile, or State.
- **BREAKING** for live flags: retire `env-check`/`doctor`/`probe --smoke` and
  `--probe-vendors`. Those forms return a usage migration diagnostic pointing
  at `ppt_flow probe <run-dir>` or Lab; they do not silently become offline.
  `env-check` / `doctor` make zero Image2 network calls in every mode.
  `ppt_flow probe <run-dir>` submits the confirmed Call Shape exactly once
  through the shared executor. Pending/illegal profiles hard-stop with next
  pointing at Lab and zero fetch.

Not in this change: new retrieve dialects, Style Master transport,
scratch-to-PPTX (BUG-092), Lab auto-lessons, multi-vendor failover (CLS-007).

## Capabilities

### New Capabilities

- `image2-lab`: Lab CLI, `_lab/` workspace process, immutable trials, lab
  playbook, admission, fixtures, and the execute gate. It does not own Call
  Shape field authority, production authorization, or confirmed-profile
  writeback.

### Modified Capabilities

- `production-schema-conformance`: declare the Call Shape value/envelope and
  the named default, including the one registered `result_protocol`.
- `run-bundle-management`: confirmed page-image operation embeds the Call
  Shape value; omitted transport/result_protocol is the named default digest;
  init's deck-root seed loop and Lab CLI heal a missing `_lab/` scaffold.
- `run-bundle-layout`: `_lab/` is a required deck-root first-class directory;
  empty is valid; internals are unwhitelisted; `new-version` does not copy
  trials; `--check` treats absence as repairable.
- `image-generation`: generate consumes the validated Call Shape value through
  the shared executor, including retrieve + inspector; it does not read
  `_lab/`.
- `cli-surface`: Lab success/failure envelope; probe submits the confirmed
  Call Shape once; retired live flags emit migration diagnostics.
- `environment-check`: every mode is offline for Image2; live flags retire
  with migration diagnostics; the zero-npm YAML-import guard stays.
- `playbook-execution`: two questions (confirmed connectivity vs candidate
  discovery); new lab playbook; `probe-image-channels` no longer walks
  vendors or `doctor --probe-vendors`.
- `harness-script-layout`: register Call Shape validator and executor seams;
  forbid a second parser/submit/poll/decoder; Lab CLI is an inventory
  executable, not a twentieth method stage.
- `harness-directory-layout`: `shared/image2/` ownership; `_lab/` appears in
  the source map as run-bundle data, not a Harness stage.
- `commands-reference`: map the two questions to probe vs Lab vs generate.
- `bootstrap-env-guidance`: Image2 live work is probe or Lab, never env-check.
- `harness-charter`: probe is declared-Call-Shape connectivity, not capability
  proof; Lab is the discovery owner; empty `_lab/` does not block drawing.

No delta: `lessons-management` (Lab does not write lessons; existing
`lessons.mjs add` remains the optional human writer), `node-specification`
(Lab/probe reuse the existing diagnostic envelope; no new State fields),
`pipeline-orchestration` (Lab is a standalone CLI like `lessons.mjs`, not a
Page Image production route).

## Impact

- Harness source: `ppt_maker_harness/scripts/shared/image2/` (new validator,
  executor, Lab CLI), `provider_profile.mjs`, `command_support.mjs` Image2
  submit/retrieve, `commands/probe.mjs`, `00-setup` env-check/doctor,
  `bundle_layout.mjs`, architecture/executable inventory, schema
  `serialization-contracts.yaml`, playbook + COMMANDS + BOOTSTRAP + charter,
  `CONTEXT.md` terms in the last apply task, tests under `tests/` and
  targeted `tests_e2e/` as design requires. Archive then syncs delta specs.
- Control owner: JS owns Call Shape validation, executor, Lab/probe/generate
  admission, `_lab/` scaffold/heal, and diagnostic envelopes. MD owns the lab
  playbook, probe-image-channels cutover, and two-question routing. Human owns
  confirming a trial value into the profile and the bounded Lab Work Request.
- Run-bundle contract: **migration** for deck-root layout (`_lab/` required;
  heal-on-touch; `--check` repairable). Profile YAML remains **compatible**:
  omitted transport/result_protocol is the named default. Production `deck_*`
  bytes are not migrated by this change.
- Policies:
  - `human-centered-gates.md`: missing `_lab/` is guide-class heal; pending
    probe is a non-bypassable hard-stop protecting attributable live work
    (recovery: Lab); Lab execute is covered by one bounded plan Work Request,
    not per-candidate confirm; writing a confirmed profile remains a distinct
    Deck Author decision.
  - `agent-assistance-and-control.md`: Call Shape authority stays
    serialization + `validateCallShapeValue()`; production adoption stays the
    confirmed profile; Lab trial is evidence, not authorization. The human
    decides the bounded plan and whether to copy a trial value into the
    profile. The Agent runs mechanical plan/execute, heal, and handoff.
  - `simple-reliable-control.md`: net simplification is one validator, one
    executor, deletion of `last-proven.json`, and retirement of the
    hardcoded smoke/vendors live surface. Lab does not add a second
    generation-profile or current-proof lifecycle owner.
