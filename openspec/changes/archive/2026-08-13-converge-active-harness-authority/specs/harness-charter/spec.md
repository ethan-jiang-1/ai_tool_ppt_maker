## MODIFIED Requirements

### Requirement: Active Harness guidance exposes one terminology and authority hierarchy

Active repository and Harness entry guidance SHALL identify
`openspec/specs/` as the normative behavior contract and `CONTEXT.md` as the
canonical terminology reference. It SHALL direct run-bundle production through
BOOTSTRAP, the Agent Contract, and the applicable current Controller guidance,
without making the glossary, OpenSpec context, or another reference a competing
Controller or executable entry.

The repository-maintenance context in `openspec/config.yaml` SHALL expose one
bounded capability registry as a navigation projection. That registry SHALL
enumerate exactly once every immediate `openspec/specs/<capability>/spec.md`
capability and no other capability. Each entry SHALL identify its corresponding
main spec as normative behavior authority, state only a bounded routing
responsibility, and MAY cite current public owner surfaces. The marker-bounded
registry payload SHALL be one YAML mapping containing only its `capabilities`
sequence. Each capability record SHALL contain exactly `id`, `spec`, and
`scope`, with optional `owner_paths`; its `id` SHALL be lower-kebab case, its
`spec` SHALL equal `openspec/specs/<id>/spec.md`, and its owner paths SHALL be
unique literal strings.

Every cited surface SHALL be one literal repository-relative path to an
existing active file. A cited script SHALL be admitted by the existing
source/test ownership manifest as a registered interface or executable. A
cited non-script file SHALL be one of `ppt_maker_harness/AGENTS.md`,
`ppt_maker_harness/BOOTSTRAP.md`, `ppt_maker_harness/COMMANDS.md`, or
`ppt_maker_harness/README.md`; a Markdown document under the declared
`charter/`, `playbook/`, `workflow/`, or `reference/` source home; or a
Markdown/YAML definition file under the declared `schema/` home. This
source-root classification SHALL NOT become a capability-specific owner
allowlist. A cited surface SHALL NOT be a glob, private `internal/` module,
archived change, main-spec substitute, test, production `deck_*`/`dpt_*` data,
generated artifact, or an unclassified source file. The context SHALL NOT copy
another capability's detailed schema or contract.

Active guidance SHALL distinguish the `page-image-workflow` pipeline, the
version-level `production.workflow: framed|pure` selection, and
method-module/MD Controller workflow guidance. It SHALL not reintroduce numeric
lifecycle labels, render-mode compatibility aliases, Chain aliases, a stale
Stage 1-5 production route, historical-reader or frozen-identifier policy, a
live HTML Production family, a visual-slot Image Production branch, or an
alternate Page Image protocol.

The existing provider-free Harness coherence checkpoint SHALL validate the
registry against the immediate main-spec directories and validate every cited
literal path before accepting the maintenance context. Missing, extra, or
duplicate capabilities; a missing or forbidden path; and an unreadable or
ambiguous registry SHALL hard-stop repository-maintenance verification with a
bounded root finding and the single nearest action to repair the named owning
source and rerun the same checkpoint. The check SHALL create no runtime state,
scan no Run Bundle, invoke no provider, and offer no waiver, force path,
fallback registry, or competing pass/fail projection.

#### Scenario: Agent begins repository maintenance

- **WHEN** an Agent enters the repository to maintain the Harness
- **THEN** its injected context identifies every current main-spec capability
  exactly once and binds it to its normative spec plus only existing public
  owner surfaces
- **AND** it treats that context as navigation rather than a replacement for an
  owning specification, Controller, CLI, or run-bundle source of record

#### Scenario: Capability projection disagrees with main specs

- **WHEN** the capability registry omits a main spec, names an unbacked
  capability, or repeats a capability
- **THEN** the existing coherence checkpoint rejects the projection before
  accepting dependent path claims
- **AND** it identifies the direct mismatch and tells the Agent to repair the
  registry or owning main-spec source, then rerun the same checkpoint

#### Scenario: Capability projection cites a stale or unadmitted owner path

- **WHEN** a registry entry cites a missing path, glob, private implementation,
  archive record, main-spec substitute, test, production-data path, generated
  artifact, unadmitted script, or existing but unclassified source file
- **THEN** the existing coherence checkpoint rejects that literal owner claim
- **AND** it does not search for an alternative implementation or silently
  treat a nearby file as authority

#### Scenario: Planted authority drift proves guard sensitivity

- **WHEN** focused verification supplies safe synthetic missing-capability,
  extra-capability, duplicate-capability, or stale-path input to the same
  evaluator used by repository coherence
- **THEN** each violation is detected with no repository mutation
- **AND** restoring the exact valid input makes the same checkpoint pass

#### Scenario: Agent begins deck production

- **WHEN** an Agent enters a current run-bundle production route
- **THEN** the active guidance distinguishes pipeline, selected workflow, and
  method-module/Controller meanings before directing the existing entry route
- **AND** it does not offer lifecycle numbering, render aliases, refresh Chain
  aliases, HTML Production, visual-slot Image Production, historical-reader
  handling, or a second Page Image workflow as a current choice
