## ADDED Requirements

### Requirement: Framed composition drift follows the existing raw-rebuild path

Pipeline Orchestration SHALL treat a change to a current Framed page's parsed
source `subject_restrictions`, selected normalized protected composition, or
body-safe region as a material compiled-input and raw-contract change. It SHALL
route that page through the existing raw-rebuild and Complete Page Review path
before another provider submission or review; it SHALL not select a local
header-only refresh, reuse prior raw evidence, or infer that a prior provider
page satisfies the new binding.

An absent or invalid current composition binding is an integrity hard-stop at
the existing planning checkpoint. The owning diagnostic SHALL identify the
nearest source/configuration repair action and short-circuit authorization and
dependent lifecycle symptoms. This requirement introduces no command, approval,
state field, retry, waiver, or recovery controller; ordinary provider work
remains attributable to the existing Task Mandate.

#### Scenario: Restriction drift requires a raw rebuild

- **WHEN** a current Framed page's parsed subject restrictions change after a
  raw plan or review has been prepared
- **THEN** orchestration observes changed compiled bindings and routes to the
  existing raw rebuild before provider submission or review reuse
- **AND** it does not retain the former provider page or Complete Page Review
  as current

#### Scenario: Invalid composition short-circuits authorization

- **WHEN** the selected Framed composition cannot establish its required
  normalized body-safe binding
- **THEN** the existing planning checkpoint returns the direct repair action
  before authorization or provider initialization
- **AND** it does not create a C6-specific confirmation, fallback, or control
  record
