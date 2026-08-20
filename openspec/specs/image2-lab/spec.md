## Purpose

Own the Image2 Lab: a standalone discovery CLI, the run-bundle `_lab/` workspace, immutable trials, and the lab playbook that prove a candidate Call Shape can retrieve an inspector-valid PNG without writing production profile, State, or lessons.

## Requirements

### Requirement: Image2 Lab is the only live discovery owner for unconfirmed Call Shapes

The Harness SHALL expose one standalone Image2 Lab CLI at
`ppt_maker_harness/scripts/shared/image2/lab_cli.mjs`, registered in the
executable inventory, as the only entry that may live-submit an explicit
candidate Call Shape when the exact run has no confirmed page-image Call
Shape. The CLI SHALL bind one exact `3_versions/vN` run directory. It SHALL
NOT be a twentieth method stage, a `ppt_flow` production route, a create-deck
node, or a writer of confirmed profile, State, grants, attempts, receipts, or
`_lessons/`.

Session B using Lab and Session A using PPT flow MAY be different sessions on
the same Run Bundle. Lab success SHALL prove only that that candidate value,
with the supplied prompt and reference bytes, retrieved a PNG that passed the
current production media inspector. Lab success SHALL NOT confirm a profile,
authorize generate, or replace `image2 authorize`.

#### Scenario: Pending profile can be trialed

- **WHEN** an exact run's page-image profile is pending or absent and the Lab
  CLI receives a valid candidate envelope plus a bounded execute plan
- **THEN** it may live-submit that candidate through the shared executor
- **AND** it does not write the provider profile, State, or `_lessons/`

#### Scenario: Lab is not a production stage

- **WHEN** architecture or directory-layout validation inspects the Lab CLI
- **THEN** the CLI is owned under `scripts/shared/image2/` as a shared
  executable
- **AND** it is not counted as a nineteenth-or-twentieth conceptual stage

### Requirement: Lab admission precedes fetch and trial writes

Before the first provider fetch, Lab SHALL, in order: confirm the argument is
an exact `3_versions/vN` after `realpath`; verify Harness binding; heal or
require the empty `_lab/` scaffold; require every `_lab/` path component
inside the deck root to be a confined ordinary directory rather than a
symlink; require candidate, prompt, and reference inputs to be confined
regular files; reject symlink, FIFO, and device inputs; and require schema,
budget shape, fixture/credential presence, and a bounded work record. Only
after those checks MAY Lab write a plan or trial under `_lab/`. Failure at any
step SHALL hard-stop with a secret-safe owner-issued next action and zero
remote calls.

#### Scenario: Symlink fixture never reaches the network

- **WHEN** `--reference-file` points at a symlink or a path outside the deck
  root
- **THEN** Lab hard-stops before fetch and before creating a trial directory
- **AND** it does not follow the symlink or copy bytes from outside the bundle

#### Scenario: Unbound or foreign run is rejected first

- **WHEN** Lab is invoked with a path that is not exact `3_versions/vN` or that
  fails Harness binding
- **THEN** it hard-stops before reading `_lab/` as a discovery step
- **AND** it does not create a competing workspace outside the bound deck

### Requirement: Edits trials require an explicit reference file

When the candidate Call Shape uses `edits`, Lab SHALL require an explicit
`--reference-file`. The file SHALL be either a confined ordinary PNG under
`_lab/fixtures/` or a Lab-imported read-only copy of the current exact
version's already verified Style Master bytes, hashed before execute. Lab
fixtures SHALL have no production selection, source-receipt, or lineage
identity. The shared executor SHALL NOT search the deck for a default image.

#### Scenario: Missing reference stops before fetch

- **WHEN** a candidate declares `edits` and no `--reference-file` is supplied
- **THEN** Lab hard-stops before fetch
- **AND** it does not invent a blank canvas or read a coincidental
  `style_master.png`

#### Scenario: Imported Style Master bytes are hashed, not selected

- **WHEN** Lab imports the current exact version's verified Style Master bytes
  as the reference
- **THEN** the trial records the bytes' SHA-256 and media facts
- **AND** it does not write a production Style Master selection or source
  receipt

### Requirement: A bounded trial plan is the Lab Work Request

Lab SHALL be non-interactive. A `plan` invocation SHALL emit one bounded trial
plan that names the exact run, Call Shape hash, candidate count, at most one
submit per candidate, and whether poll may occur, together with a plan hash.
An `execute --plan-hash <hash>` invocation SHALL run that plan only when the
hash still matches. Expanding candidates, changing endpoint or runtime,
rerunning failed items, or executing without that plan SHALL return to the
human boundary. The execute gate SHALL NOT create a production grant, attempt,
or authorize token.

#### Scenario: Matching plan hash executes the batch once

- **WHEN** the human Work Request asked to execute a disclosed bounded plan and
  `execute --plan-hash` matches that plan
- **THEN** Lab submits each listed candidate at most once through the shared
  executor
- **AND** it does not re-ask per candidate and does not publish a production
  grant

#### Scenario: Stale or missing plan hash is a hard-stop

- **WHEN** `execute` is invoked with no plan, a mismatched hash, or after the
  candidate set has changed
- **THEN** Lab hard-stops with zero fetch
- **AND** the next action is to form a new bounded plan

### Requirement: Trials are immutable and identified by id plus hash

Each successful or failed execute item SHALL be atomically sealed under
`_lab/runs/vN/trials/<trial-id>/` as a `pptmaker-image2-lab-trial` record.
A half-written directory SHALL NOT be readable as proven. The machine handoff
SHALL be `trial_id` plus `trial_sha256`. Lab, probe, and generate SHALL NOT
read or write a `last-proven.json` or other mutable latest pointer.

The sealed trial SHALL bind: trial schema and id; manifest hash; deck-relative
`3_versions/vN`; Harness binding fingerprint; canonical Call Shape value and
hash; non-secret endpoint/selector fingerprint; prompt locator, SHA-256, unit,
and `tested_measurement`; reference need, source class, SHA-256, and media
facts when present; sanitized execution classification; and on success the PNG
SHA-256, byte length, and inspector-passed actual width and height. Failure
SHALL store no output PNG. Provider body, prompt text, headers, and secrets
SHALL NOT be written.

Distinct `vN` trees SHALL NOT overwrite each other. A new trial under the same
`vN` SHALL only append a new id. Sealed manifests SHALL NOT be rewritten.
`new-version` SHALL neither copy nor delete existing trials and SHALL NOT mark
old trials as proven for the successor.

#### Scenario: Atomic seal rejects a half-written trial

- **WHEN** Lab is interrupted after creating a temporary trial directory and
  before the atomic rename
- **THEN** later Lab or Session A readers do not treat that directory as proven
- **AND** no `last-proven.json` is consulted as a substitute

#### Scenario: v1 and v2 trials do not cover each other

- **WHEN** a v2 execute completes after v1 already has sealed trials
- **THEN** the new trial is stored under `runs/v2/trials/`
- **AND** v1 trial bytes and hashes remain unchanged

#### Scenario: Tested measurement is not a provider max

- **WHEN** a trial submits a prompt whose measured length is 21,241 in the
  selected unit and the inspector accepts the PNG
- **THEN** the trial records `tested_measurement` 21,241
- **AND** it does not rewrite the confirmed profile `prompt_budget.limit` or
  claim a provider maximum

### Requirement: Unregistered result dialects cannot be marked proven

Lab SHALL submit only through the shared executor. A candidate whose
`result_protocol` is absent from the registered closed set, or whose response
requires an unregistered retrieve dialect, SHALL fail before being sealed as
proven. Direct PNG bodies and result-URL downloads SHALL NOT become proven in
this change.

#### Scenario: Direct PNG body is not a Lab success

- **WHEN** the provider returns a raw PNG body and the candidate does not use a
  registered dialect that accepts that body
- **THEN** Lab records a typed failure with no proven PNG
- **AND** it does not mark the trial proven or teach production a new dialect

### Requirement: Lab success envelope is secret-safe and names the trial

On success the Lab CLI SHALL emit a structured stdout document under the
`cli-surface` envelope that includes a stable schema, `trial_id`,
`trial_sha256`, Call Shape hash, PNG digest, inspector width and height, and
`tested_measurement`, plus one bounded next action to show that trial to the
Deck Author for optional profile writeback. On failure it SHALL emit the
owner-issued secret-safe diagnostic. Stdout, stderr, envelope, and trial
SHALL NOT contain provider body, prompt text, stack, planted secrets, or
token-bearing URLs.

#### Scenario: Success names the immutable trial

- **WHEN** a candidate retrieves an inspector-valid PNG
- **THEN** stdout includes `trial_id` and `trial_sha256`
- **AND** the next action is profile consideration, not generate authorization

#### Scenario: Planted secret does not leak

- **WHEN** a provider body, prompt, or environment value contains a planted
  secret and Lab fails or succeeds
- **THEN** that secret is absent from stdout, stderr, the envelope, and the
  sealed trial
- **AND** the diagnostic remains owner-issued and bounded

### Requirement: Lab playbook is independent of create-deck

The Harness SHALL provide one registered lab playbook at
`ppt_maker_harness/playbook/image2-lab.md` that is not a node in
`create-deck`. The playbook SHALL form the bounded trial plan, disclose submit
count and possible poll, obtain the Work Request, invoke the Lab CLI, and
handoff `trial_id` plus `trial_sha256`. When a cross-session human lesson is
useful, it MAY recommend the existing `lessons.mjs add` writer that cites only
trial id and hash. It SHALL NOT auto-write `_lessons/`, copy a Call Shape as a
second authority, or enter generate.

#### Scenario: Discovery intent selects the lab playbook

- **WHEN** the user asks which candidate Call Shape can retrieve a PNG
- **THEN** routing selects the lab playbook rather than `create-deck` or
  `probe-image-channels`
- **AND** the playbook does not invoke `image2 generate`

#### Scenario: Lesson write is optional and existing

- **WHEN** a trial has cross-session value
- **THEN** the playbook may recommend `lessons.mjs add` citing trial id and hash
- **AND** the Lab CLI itself writes no lesson file
