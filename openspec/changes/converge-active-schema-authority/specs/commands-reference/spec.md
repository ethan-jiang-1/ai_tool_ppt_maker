## MODIFIED Requirements

### Requirement: Intent discovery preserves explicit requests and exact-run boundaries

The command guidance SHALL preserve a user's explicit Deck/run selection and
route only declared current workflow facts to their existing controller or CLI
owner. An undeclared source, state, receipt, or locator contract SHALL produce
the owner-issued `unsupported-protocol/export` boundary without route
selection, source inspection, conversion, migration, or adoption. Guidance
SHALL describe the current contract and owner-issued next action without
inventing another selectable route.

#### Scenario: An explicit run has an undeclared contract

- **WHEN** command guidance receives an explicit run whose owner reports an
  undeclared source/state/receipt/locator contract
- **THEN** it preserves the selected target and presents the owner-issued
  unsupported-contract action
- **AND** it does not substitute another run or offer another route

#### Scenario: Explicit change wins over resume

- **WHEN** an exact run has a current `primary_action` and the user explicitly
  asks to change text, visual content, notes, or structure
- **THEN** discovery enters `classify-change` and the applicable leaf route
- **AND** it does not substitute the current resume action for the requested
  mutation

#### Scenario: Missing exact run uses the locator

- **WHEN** a user asks to resume or change a deck without an exact run
- **THEN** the Agent requests the supported card or exact path through
  `orientation-locate-run`
- **AND** it does not inspect production deck directories to guess a target

#### Scenario: Normal raw readiness does not bypass the exact-run boundary

- **WHEN** the installed normal entry is available and a user requests
  raw-generation readiness without an exact run
- **THEN** discovery establishes applicable local foundation and requests the
  exact run before the normal raw-readiness operation
- **AND** it does not present direct `env-check` recovery as an unbound normal
  provider-readiness route

#### Scenario: Route Gap has no durable side effect

- **WHEN** a request does not match a supported route
- **THEN** the Agent returns a Route Gap and preserves the current workflow
  authority unchanged
- **AND** it does not create maintenance work unless the user separately
  confirms that extension
