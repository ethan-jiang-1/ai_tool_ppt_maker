## MODIFIED Requirements

### Requirement: Current Page Image lifecycle has one policy per version

Current orchestration SHALL execute only the V2 source receipt, selected
presentation resolution, raw plan/authorization/generation, Complete Page
Review, selected-workflow finalization, delivery, and iteration lifecycle. An
exact V2 version resolves one workflow once and executes
`03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration`.

A non-V2 source/state pair SHALL return the owner-issued hard-stop before a
receipt, State, presentation resolver, adapter, generated artifact, or provider
operation. Orchestration shall not create another lifecycle, fallback, or
historical decoder.

#### Scenario: A V2 Framed trajectory skips Pure ownership

- **WHEN** marker-first evaluation recognizes a valid V2 Framed run
- **THEN** orchestration enters Framed, then shared delivery and iteration
- **AND** it does not invoke Pure or ask for a slide-level workflow choice

#### Scenario: A version cannot mix header policies

- **WHEN** a V2 version has per-slide workflow override or `hybrid` workflow
  value
- **THEN** orchestration returns source/structural repair before raw planning
- **AND** it dispatches neither adapter nor provider request

## REMOVED Requirements

### Requirement: v2 input is excluded from current lifecycle routing

**Reason**: V2 is the sole current lifecycle.

**Migration**: Every non-V2 identity receives the generic hard-stop before
lifecycle routing.
