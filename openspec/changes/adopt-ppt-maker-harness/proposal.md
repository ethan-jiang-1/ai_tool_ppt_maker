## Why

`PPTMAKER_FRAMEWORK` inaccurately describes the reusable environment that an
external Agent uses to create and operate a Deck. `PPT Maker Harness` names the
actual boundary: reusable methodology, controls, and production tools, separate
from both the Agent and a Deck's Run Bundle. The repository is unreleased, so
this is the appropriate point to make one clear, complete terminology and path
transition rather than carry a misleading compatibility layer.

## What Changes

- **BREAKING** Replace the canonical Harness root `PPTMAKER_FRAMEWORK/` with
  `ppt_maker_harness/`, and use **PPT Maker Harness** as the canonical display
  name throughout active source, tests, CLI guidance, package metadata, and
  normative OpenSpec specifications.
- **BREAKING** Remove the former root completely. The resulting Harness SHALL
  not provide an alias, symlink, duplicate tree, legacy parser, or automatic
  migration route for `PPTMAKER_FRAMEWORK/` or v1 Run Bundles.
- **BREAKING** Make fresh Run Bundles bind to their creating local Harness via a
  v2 locator manifest containing exactly `schema`, `deck_root`, `harness_root`,
  and `harness_relation`. The new Harness accepts only that current contract;
  older production data remains untouched and requires explicit reconstruction
  if it is ever to be used again.
- Preserve project namespaces `ppt_flow`, `PPTMAKER_*`, and `pptmaker-*`; rename
  the npm package to `pptmaker-harness`.
- Replace active capability IDs `framework-charter`,
  `framework-directory-layout`, and `framework-script-layout` with their
  `harness-*` equivalents. Active schema IDs that explicitly name Framework
  become Harness IDs with an incremented version.
- Keep a Run Bundle external to its Harness root, bind it to that exact local
  root rather than a release/hash/portable identity, and retain `_lessons/` as
  local non-secret Deck knowledge only.

## Capabilities

### New Capabilities

- `harness-charter`: Defines current Harness-facing Charter and Agent guidance,
  including the Human, Agent, Harness, and Run Bundle ownership boundary.
- `harness-directory-layout`: Defines the one canonical Harness source root and
  its separation from production data.
- `harness-script-layout`: Defines executable ownership and import boundaries
  for scripts housed by the Harness.

### Modified Capabilities

- `framework-charter`: Retire its active capability identity after its
  requirements move to `harness-charter`.
- `framework-directory-layout`: Retire its active capability identity after its
  requirements move to `harness-directory-layout`.
- `framework-script-layout`: Retire its active capability identity after its
  requirements move to `harness-script-layout`.
- `run-bundle-layout`: Make Harness binding and external Run Bundle placement a
  part of the canonical bundle ontology and update its machine authority path.
- `run-bundle-management`: Create and validate only the v2 Harness-bound
  locator contract; reject legacy roots and v1 locator data without mutation.
- `node-specification`: Replace Framework path/context terminology in the MD to
  JS protocol with Harness terminology while preserving the existing control
  boundaries.
- `cli-surface`: Expose the renamed Harness paths and preserve bounded,
  owner-issued diagnostics for unsupported legacy inputs.
- `commands-reference`: Locate the novice command reference and intent catalog
  at the Harness root.
- `bootstrap-env-guidance`: Point startup and readiness guidance at the Harness
  root and its executable entrypoints.
- `environment-check`: Check the canonical Harness-owned environment and
  production tools from the renamed root.
- `lessons-management`: Locate the Run Bundle lessons CLI beneath the Harness
  without broadening lessons beyond a single bundle.
- `playbook-execution`: Locate MD Controller playbooks beneath the Harness and
  preserve the external-Agent ownership model.
- `project-versioning`: Use the Harness README location and package identity in
  the project version surface; version-bump judgment remains deferred until
  this change is archived.

## Impact

The Harness maintenance domain changes from `PPTMAKER_FRAMEWORK/`, `openspec/`,
`tests/`, and `tests_e2e/` to `ppt_maker_harness/`, `openspec/`, `tests/`, and
`tests_e2e/`. MD/Agent guidance owns the conceptual and orchestration wording;
JS/CLI owns root resolution, locator validation, and diagnostic behavior; the
v2 locator is the MD-to-JS protocol boundary.

Run-bundle contract impact is **migration**: the renamed Harness produces and
accepts only v2 Harness-bound bundles. Existing `deck_*` and `dpt_*` production
data are not source, fixtures, or automatic migration targets, and they will
not be read or modified by this change. Archived OpenSpec changes are also out
of scope; active `openspec/specs/` is the normative contract to be updated.

Per `openspec/policies/human-centered-gates.md`, a missing, conflicting, or
legacy Harness binding is a **hard-stop**: it protects exact local identity and
cannot be waived, force-continued, or silently reassigned. Per
`openspec/policies/agent-assistance-and-control.md`, the locator remains the
single direct source of that decision and returns one bounded reconstruction
action; an Agent can perform only the mechanical work that action permits.
Following `openspec/policies/simple-reliable-control.md`, the design removes
legacy parsing, requested-root fallback, portability handling, and automatic
migration instead of adding state, retry, or recovery branches around them.
