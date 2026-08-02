## Why

Page Authority made production intentionally more precise: a user goal now
crosses an exact run locator, Controller lifecycle, owner-issued action,
authorization boundary, and review state. The public discovery material still
looks like an older command sequence, so a novice cannot safely express setup,
work, or "I am stuck" intent without being shown implementation mechanics or
being routed by guesswork. The resulting drift also obscures real command
grammar, delegated diagnostics, and the narrow collaboration-card write that
currently accompanies some state observations.

This change makes intent discovery a small, auditable layer over the current
workflow rather than a new workflow. It preserves all current Page Authority
owners and public command grammar while making the safe first step, exact-run
boundary, human confirmation boundary, and recovery path clear to both Agents
and novices.

## What Changes

- Add a versioned, closed Intent Route Catalog beside the Controller manifest.
  It describes discovery only: `foundation`, `work`, and `orientation` routes,
  their required context, first safe step, risk boundary, fallback, and
  visibility. It neither parses language nor dispatches commands, persists a
  selected route, or authorizes a mutation.
- Render the catalog in `COMMANDS.md` as a novice-facing common-request
  surface. Users see their goal, what must be clarified or inspected, the
  expected result, the meaningful cost/confirmation boundary, and coarse
  timing; lifecycle mechanics remain Agent-facing and owner-owned.
- Preserve explicit-change precedence over resume: a known exact run can
  resume from `workflow_inspection.primary_action`, while a stated change goes
  through `classify-change`. Missing run context goes to the existing
  `RUN_BUNDLE.md` / exact-path locator boundary, never deck scanning or a
  latest-run guess.
- Correct normal versus recovery entry guidance. `ppt_flow` remains the fixed
  twelve-command normal interface; normal raw readiness stays exact-run-bound
  under `ppt_flow doctor`, while direct `env-check` remains pre-install or
  unavailable-main-entry recovery only. Its help/docs must describe only
  parser-accepted mode/operation forms. No new executable, `ppt work`, or
  generic dispatcher is added.
- Preserve valid delegated diagnostic data from child producers and fail closed
  for invalid/truncated child output. The parent may add lineage but cannot
  replace a valid producer's bounded `next` action with a generic one.
- Define the existing progressive task-card refresh precisely: `inspectWorkflow`
  remains zero-write, while normal text `state` and `state --json` may refresh
  one named rebuildable collaboration projection only for an exact active
  progressive Controller route. Those two state renderings expose the
  projection result; authority files remain unchanged, and `status` /
  `state --validate-state` remain zero-write observations outside that
  presentation path.
- Reconcile active help, bootstrap, top-level onboarding, and command guidance,
  current spec/config pointers, test-tier wording, and retired Page Authority
  terminology with the current owner contracts. Documentation examples must
  not recreate the retired one-shot Image2 sequence or imply that
  observation/probing grants provider authorization.

The change applies `openspec/policies/human-centered-gates.md`: local
foundation checks are `guide`, explicitly requested live probes require
`confirm`, and identity/authorization/invalid delegation remain `hard-stop`
conditions that protect current owner and evidence invariants. It applies
`openspec/policies/agent-assistance-and-control.md` and
`openspec/policies/simple-reliable-control.md` by reusing the existing locator,
inspection, owner diagnostic, and Controller paths rather than adding a second
controller, hidden fallback, persistent route field, or generic recovery
command.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `commands-reference`: define the closed Intent Route Catalog and the
  novice-facing command-reference rendering, including exact-run and Route Gap
  behavior.
- `cli-surface`: preserve the fixed normal CLI inventory, make delegated
  diagnostics producer-preserving/fail-closed, and expose the permitted state
  projection result and accurate verification-tier language.
- `environment-check`: define recovery-only direct entry grammar and
  offline-first versus explicitly confirmed live diagnostic behavior.
- `workflow-inspection`: preserve its zero-authority-write boundary while
  making its relationship to the separately owned rebuildable collaboration
  projection explicit.
- `playbook-execution`: map work-change discovery to the existing classifier
  and leaf playbooks, and define the exact active-route eligibility of the
  rebuildable task projection.
- `bootstrap-env-guidance`: replace fixed retired production sequences and
  top-level onboarding drift with current owner/controller handoff guidance
  and aligned readiness disclosure.
- `image-production`: remove active retired Page Authority wording without
  changing Framed/Pure evidence, authorization, or ownership semantics.

## Impact

- **Framework source:** `PPTMAKER_FRAMEWORK/playbook/intent-routes-v1.json`,
  command/bootstrap/playbook documentation, root onboarding, the unified CLI
  and diagnostic adapter, direct environment-check help, and process-contract
  audits.
- **Tests:** focused contract/process coverage under `tests/`, with small
  representative integration coverage where the CLI/projection boundary needs
  it; affected mock E2E may be run, but no proposed test calls a real provider.
- **OpenSpec:** delta specs for the seven modified capabilities plus current
  config/reference corrections.
- **Control ownership:** MD/Agent owns language interpretation and path
  selection; JS/CLI owns grammar, deterministic diagnostic and projection
  reporting; existing lifecycle owners retain mutations, hashes, grants,
  evidence, and gates.
- **Public compatibility:** no breaking CLI grammar, no third production CLI,
  no new provider action, and no inferred run selection. Run-bundle impact is
  **compatible**: the change reads or writes no production `deck_*` / `dpt_*`
  data and requires no migration of existing runs.
