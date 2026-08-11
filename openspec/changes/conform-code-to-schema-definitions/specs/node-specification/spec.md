## MODIFIED Requirements

### Requirement: Controller state binds one current Page Image Workflow lineage

For production work, Node and State SHALL bind one exact schema-declared
`page-image-workflow` source and `image2-page-workflow` state pair, one
version-level `framed` or `pure` workflow, and the declared
`page-source-receipt` role when materialized. The Controller may project
lifecycle facts but SHALL not duplicate provider input, review authority, or
final acceptance as a second evaluator. An undeclared selector fails through
the current owner before state repair, provider work, or a lifecycle transition;
the Controller SHALL not classify it as a retained historical lineage.

#### Scenario: Controller observes one current lineage

- **WHEN** a current source/state pair and receipt are bound for production
- **THEN** Node/State records one declared workflow lineage and its owner facts
- **AND** no version-suffixed or historical selector can route the Controller

#### Scenario: State does not invent a per-slide policy

- **WHEN** Controller state observes a current version-level workflow
- **THEN** it preserves the selected policy as version-level owner fact
- **AND** it does not derive a per-slide or alternate protocol policy
