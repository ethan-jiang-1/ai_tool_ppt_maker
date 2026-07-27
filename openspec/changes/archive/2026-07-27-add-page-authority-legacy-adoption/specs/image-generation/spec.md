## ADDED Requirements

### Requirement: Legacy adoption creates no Image2 evidence or provider work
Image Generation SHALL treat a published legacy adoption target as a new Page Authority source epoch with no raw item, raw manifest, raw-review projection or coverage, final manifest/projection, provider authorization, provider request, provider result, PPTX assembly, notes receipt, or delivery evidence. Adoption observation, candidate validation, preview, confirmation, staging, publication, state handoff, and recovery SHALL make zero provider calls and SHALL not initialize credentials or transport. The target's parsed Page Authority source is the only input that may later produce a receipt-bound raw plan; every target slide SHALL first classify as `needs_raw_generation` and require a separately displayed, exact scoped human authorization before a nonzero submit.

Automation SHALL verify this boundary with deterministic fixtures and a provider-call counter. It SHALL not call a real Image2 endpoint, compare visual aesthetics, or retry to score image quality. Raw-image quality remains a human review of the target's later raw projection or an explicitly authorized pilot.

#### Scenario: Adoption publishes only raw-generation debt
- **WHEN** a confirmed legacy adoption target is published
- **THEN** its Page Authority raw state contains no inherited item or acceptance and every target slide is `needs_raw_generation`
- **AND** no credential resolver, transport adapter, or provider call is invoked

#### Scenario: Target raw work still needs fresh authorization
- **WHEN** the adoption target later attempts to generate raw images
- **THEN** Image Generation requires a current target receipt and scoped human authorization
- **AND** a legacy authorization, review, prompt, image, or delivery artifact cannot satisfy either precondition
