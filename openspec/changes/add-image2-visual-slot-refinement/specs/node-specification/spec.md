## ADDED Requirements

### Requirement: Refinement execution evidence is version-scoped and independent

State SHALL record a dedicated version-scoped refinement execution, exact authorized plan, attempt/review progress, and human decisions without altering legacy scalar compatibility. Consumers SHALL expose only safe status and require human action for authorization, visual adoption, and unknown submission resolution. A successful source promotion SHALL stale the prior `html-delivery-review` and completion SHALL resume only after current local delivery evidence receives a new final human decision.

#### Scenario: HTML delivery is complete without refinement
- **WHEN** state/status reads a current HTML delivery with no refinement record
- **THEN** it reports completion without Phase-4 debt
