## Why

The current Framed protected-composition contract is intentionally a
bounded-best-effort provider instruction, while Complete Page Review remains
the only acceptance decision. Before anyone considers a provider-native region
or mask extension, the team needs a small, attributable empirical record of
how one exact current request behaves on a newly initialized disposable probe
run.

The existing workflow already owns exact requests, Task Mandates, grants,
attempts, provider pages, and review. This change does not add another runtime
control path; it defines the narrow external evidence procedure that reuses
those facts and cannot be confused with C7 production repair.

## What Changes

- Define one Framed Provider Constraint Trial that reuses the current
  provider-free plan, Task Mandate, grant, attempt, provenance, and Complete
  Page Review paths for up to three one-item submissions to distinct probe
  pages in a newly initialized disposable probe run selected by an explicit
  human Work Request.
- Bind the trial evidence to the selected run, exact batch/grant, each
  page-specific compiled request and protected-composition digest, transport
  field set, and each provider/composite review artifact without copying
  credentials, prompt prose, or raster bytes into a new parallel runtime record.
- Define the trial conclusion as bounded observation only: it may report the
  current transport has no verified native primitive and whether the sampled
  pages appear to follow the composition guidance. It cannot accept a page,
  establish a general provider guarantee, decide `proceed` or `repair`, alter
  C7, or authorize a native transport extension.
- Require every preflight identity, source/configuration, plan, grant, and
  lineage failure to short-circuit before submission through its existing owner.
  The trial introduces no command, approval, waiver, retry, state field,
  automatic occupancy/OCR check, compatibility reader, migration, or fallback.
- Leave provider-native transport work out of scope. A verified provider
  contract and a later separately proposed change are required before any
  region, mask, crop, or template field can be added.
- Treat the Work Request as the bounded raw-page cost decision only. It does
  not replace the existing exact narrative-plan confirmation, Style Master
  review and promotion, or per-page Complete Page Review decisions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `image-generation`: define the bounded, attributable Framed
  Provider Constraint Trial and its evidence/conclusion boundaries.

## Impact

- **Harness source:** no runtime code, provider transport field, direct CLI
  command, schema, or persistent trial record is introduced. The change records
  its secret-safe external evidence in its OpenSpec `evidence.md`.
- **Control ownership:** the existing MD Controller obtains the Work Request and
  follows the normal route; existing JS owners validate canonical lineage; the
  human authorizes this new bounded raw-page cost goal and retains the existing
  narrative-plan, Style Master, and Complete Page Review decisions. This follows
  `openspec/policies/human-centered-gates.md`,
  `openspec/policies/agent-assistance-and-control.md`, and
  `openspec/policies/simple-reliable-control.md`.
- **Run-bundle contract:** none for existing production data. The applied change
  requires the human to name a new disposable probe run before initialization;
  it does not read, migrate, rewrite, or use C7 or another existing production
  target as a fixture.
- **Out of scope:** C7 production repair, real-provider execution before an
  explicit Work Request, native provider capability claims, transport changes,
  new acceptance gates, and manual `_generated/` edits.
