## MODIFIED Requirements

### Requirement: Page Image visual configuration separates visual direction from source content

The current Page Image Workflow SHALL keep visual direction in the selected
Visual Language registry, Page Class catalog, Deck Defaults, and the one
workflow-specific profile source while keeping Page Source content and slide
identity separate. The Visual Language source SHALL use its declared current
shape without a numeric revision marker. A resolver SHALL expose only the
selected page's closed current projection and provenance; it SHALL not infer an
alternate workflow, profile, source, or undeclared contract.

#### Scenario: Current visual source resolves without a revision marker

- **WHEN** a current Visual Language source and selected presentation package
  are valid
- **THEN** the resolver returns the existing selected workflow projection and
  provenance
- **AND** neither source nor projection contains a numeric Harness revision
  marker

#### Scenario: Framed visual selection allows integrated page text

- **WHEN** a valid Framed Page Image Workflow slide resolves a registered
  visual selection and Provider Content Schema
- **THEN** Visual Config emits the selected visual direction without a
  whole-page no-text requirement
- **AND** the source literals remain owned by the receipt rather than the
  visual registry

#### Scenario: Registry cannot replace canonical content

- **WHEN** a registry clause attempts to prescribe provider copy or declare a
  text-free Framed page
- **THEN** Visual Config rejects that clause before raw planning
- **AND** it does not emit a provider request or substitute source content

#### Scenario: Invalid visual source stays owner-rejected

- **WHEN** the Visual Language source or selected presentation package is
  malformed or inconsistent
- **THEN** its existing owner rejects it before dependent raw planning
- **AND** it does not infer, convert, or route an alternate contract
