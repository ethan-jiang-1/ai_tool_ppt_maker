## ADDED Requirements

### Requirement: Current generated ownership is Page Authority-only
Canonical run-bundle layout SHALL assign current raw, review, final, projection, PPTX, and notes
artifacts to Page Authority owners. Historical generated trees are diagnostic-only observer input and
shall not be selected as current artifacts.

#### Scenario: A current path is resolved
- **WHEN** a Page Authority operation resolves generated paths
- **THEN** it receives Page Authority owner paths and no HTML/refinement/Header-Lock owner path


## REMOVED Requirements

### Requirement: Canonical run-bundle tree and directory roles
**Reason**: The legacy contract is replaced by the current owner run-bundle layout.
**Migration**: Use the current contract owned by run-bundle layout.

### Requirement: Glossary Where Map is the GREP placement index
**Reason**: The legacy contract is replaced by the current owner run-bundle layout.
**Migration**: Use the current contract owned by run-bundle layout.

### Requirement: Visual-style directory optionally includes assets subdirectory
**Reason**: The legacy contract is replaced by the current owner run-bundle layout + Agent registry.
**Migration**: Use the current contract owned by run-bundle layout + Agent registry.

### Requirement: Path resolvers provide assets directory access
**Reason**: The legacy contract is replaced by the current owner run-bundle layout.
**Migration**: Use the current contract owned by run-bundle layout.

### Requirement: Structured source control remains inside the existing run-bundle topology
**Reason**: The legacy contract is replaced by the current owner run-bundle layout.
**Migration**: Use the current contract owned by run-bundle layout.

### Requirement: Derived contract artifacts are rebuildable
**Reason**: The legacy contract is replaced by the current owner Page Authority artifacts.
**Migration**: Use the current contract owned by Page Authority artifacts.

### Requirement: HTML production and Image2 refinement partitions cannot be confused
**Reason**: The legacy production contract is retired; no current production route retains it.
**Migration**: Use the Page Authority lifecycle for new work; use the read-only observer/adoption boundary for recognized historical runs.

### Requirement: Production-mode transition scratch is isolated and layout-validated
**Reason**: The legacy contract is replaced by the current owner adoption transaction.
**Migration**: Use the current contract owned by adoption transaction.

### Requirement: Whole-page run identity is explicit
**Reason**: The legacy contract is replaced by the current owner run-bundle layout.
**Migration**: Use the current contract owned by run-bundle layout.
