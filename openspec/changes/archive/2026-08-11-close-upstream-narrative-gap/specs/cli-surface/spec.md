## ADDED Requirements

### Requirement: Slides CLI previews narrative page plans through the structural interface
The existing `ppt_flow slides` command family SHALL expose
`slides narrative-plan <run-dir> --candidate <path>` for one exact current run.
The required candidate path SHALL resolve beneath that run's `_scratch/` both
lexically and after realpath resolution. The preview SHALL read that
Agent-authored page-grouping candidate, the current canonical narrative sources,
current Visual Language registry, and canonical page source, then return the
provenance-carrying structural plan identity and a confined non-authoritative
plan location. The plan SHALL bind the candidate's scratch-relative locator and
canonical bytes so `slides apply-plan` can revalidate both before publication.
The preview SHALL not alter canonical page source, State, lifecycle evidence,
review, delivery, or provider state, and it SHALL make zero provider calls.

The only successful preview location SHALL be
`_scratch/narrative-plans/<plan_sha256>.json`. The CLI SHALL reject a malformed
candidate before writing that plan location, and SHALL not accept an alternate
candidate or plan location outside the confined paths.

The returned plan SHALL be applied only through
`slides apply-plan <run-dir> --plan <path> --apply --plan-sha256 <hash>` with
the exact returned hash. The CLI shall not expose a force, legacy-outline,
migration, direct-source-write, or provider flag for narrative planning or
publication.

#### Scenario: Agent previews a page plan
- **WHEN** the Agent invokes the narrative page-plan preview for a current run
  with valid current inputs
- **THEN** the CLI returns the ordered pages, their bounded provenance, exact
  plan hash, and confined plan location
- **AND** it does not create a target version, mutate source/state, or invoke a
  provider

#### Scenario: Narrative input is invalid or stale
- **WHEN** the preview or exact-plan apply cannot establish current narrative
  inputs, source bytes, plan identity, or target binding
- **THEN** the CLI emits the registered bounded diagnostic with one nearest
  action to repair or regenerate the plan
- **AND** it does not publish a target source, infer a legacy outline, or offer
  force or migration behavior

#### Scenario: Candidate changes after preview
- **WHEN** the bound candidate is missing, escapes the current `_scratch/`, or
  has different bytes at exact-plan apply
- **THEN** the CLI hard-stops before source, State, derived-artifact, or provider
  mutation
- **AND** its nearest action is to restore or repair the candidate and generate
  one current narrative preview
