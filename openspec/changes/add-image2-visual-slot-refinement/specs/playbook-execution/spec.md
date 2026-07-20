## ADDED Requirements

### Requirement: Modern refinement is an explicit optional controller

The playbook registry SHALL add an `image2-refine` controller only for current HTML-first deliveries. Its nodes SHALL recommend, plan, obtain human authorization, generate, review per page, promote or keep HTML, locally recompose, and optionally clean derived candidates. Decline/completion SHALL leave no pending Phase-4 obligation; legacy decks SHALL route only to legacy maintenance or explicit migration.

#### Scenario: User keeps HTML for every candidate
- **WHEN** review records `use-html` for all generated candidates
- **THEN** the controller completes without source promotion or provider retry
