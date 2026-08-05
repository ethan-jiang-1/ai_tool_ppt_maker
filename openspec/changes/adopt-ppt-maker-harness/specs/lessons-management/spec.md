## ADDED Requirements

### Requirement: Lessons CLI is supplied by the Harness without becoming global memory

The lessons CLI SHALL be provided at
`ppt_maker_harness/scripts/shared/run-bundle/lessons.mjs` and continue to resolve
lesson files through the Run Bundle layout authority. Moving the executable to
the Harness SHALL not create a global lesson store, cross-session memory, or
portable binding behavior.

#### Scenario: Agent checks lessons for one exact Bundle

- **WHEN** an Agent invokes the Harness lessons CLI for an exact run directory
- **THEN** it reads only that Bundle's `_lessons/` location through the layout
  authority
- **AND** it does not read or write lesson data outside that Bundle
