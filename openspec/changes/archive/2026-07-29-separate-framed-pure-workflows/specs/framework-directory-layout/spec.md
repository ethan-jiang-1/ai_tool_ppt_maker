## ADDED Requirements

### Requirement: Framework layout exposes target sibling workflow ownership

The framework directory map SHALL expose `03-framed-image`, `04-pure-image`,
`05-delivery`, and `06-iteration` as target method-module owners. It SHALL
show `03` and `04` as mutually exclusive siblings, `05` as their single shared
delivery owner, and `06` as the version-workflow-aware iteration owner. It
SHALL keep shared source/visual and raw mechanics distinct from workflow
business owners and SHALL not expose a second target finalization, PPTX, notes,
or delivery owner.

The map may identify the bounded CURRENT v1 compatibility resolver, but it
SHALL NOT make that resolver a new-authoring workflow or retain undocumented
generic branches after target activation.

#### Scenario: Target directory ownership is audited

- **WHEN** framework directory layout is inspected after target activation
- **THEN** Framed, Pure, Delivery, and Iteration each have one declared owner and `03`/`04` are shown as XOR siblings
- **AND** no active directory path claims a second target delivery or generic authority owner
