## MODIFIED Requirements

### Requirement: Intent Route Catalog is a closed discovery contract

The intent-route catalog SHALL use the unversioned shared-contract name
declared in the serialization inventory and retain its existing closed route
shape. It SHALL contain exactly the declared contract marker and `routes`; each
route SHALL retain the required routing fields and deterministic validation.
No active route catalog, template, or command reference SHALL carry a
version-suffixed contract marker.

#### Scenario: An Agent loads the current route catalog

- **WHEN** command routing loads the checked-in catalog
- **THEN** its contract marker resolves in the serialization inventory and its
  routes validate under the existing closed rules
- **AND** no alternate or historical catalog format is considered

#### Scenario: Catalog validates the public discovery surface

- **WHEN** the checked-in current catalog is validated
- **THEN** its contract declaration and every required route field validate
- **AND** no code-only or version-suffixed route schema is accepted

#### Scenario: Work-change leaves reuse existing lifecycle owners

- **WHEN** a route resolves a production change
- **THEN** it delegates to the existing current lifecycle owner
- **AND** it does not create a compatibility controller

### Requirement: Commands route current Page Image changes by compiled-input ownership

Active `COMMANDS.md` guidance SHALL describe one schema-declared current
version-level Page Image workflow choice, `framed` or `pure`, and route work to
the selected owner. It SHALL not teach historical pipeline values, a migration,
or a compatibility route.

#### Scenario: A current workflow change is routed

- **WHEN** a Deck Author asks for a current Page Image change
- **THEN** command guidance selects the owner using the current declared
workflow contract
- **AND** it does not offer a retired marker as an alternative path

#### Scenario: A user changes a Framed header literal

- **WHEN** a Deck Author changes a current Framed header literal
- **THEN** guidance routes to the established owner-selected refresh path
- **AND** it does not select a historical workflow

#### Scenario: A user requests a workflow switch

- **WHEN** a Deck Author requests a current Framed/Pure switch
- **THEN** guidance routes it through the existing structural-versioning path
- **AND** it does not create a conversion route
