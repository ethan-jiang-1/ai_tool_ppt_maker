## ADDED Requirements

### Requirement: MD diagnostic consumption renders the canonical four-part handoff

MD Controllers and runtime Agent guidance SHALL consume a valid final CLI
failure envelope through the canonical diagnostic-recovery handoff. They SHALL
preserve the producer's bounded category, causal facts, and exact supported
`next` as the control authority; this consumer contract SHALL not copy or
extend the `cli-surface` schema.

For user-facing diagnosis, the consumer SHALL render exactly the four canonical
parts in order: what happened, what it affects, what the Agent can mechanically
do, and the one real human action or confirmation required. The consumer SHALL
state that no human action is needed when the producer permits an entirely
mechanical action. It SHALL stop for an owner-required human action, preserve
the current checkpoint, and not expose raw producer output or invent a retry,
fallback, shell invocation, authorization, or diagnostic classification.

For a non-zero process without a valid final envelope, the consumer SHALL retain
the existing external-interruption boundary and SHALL not promote partial output
into causal evidence. It may proceed only through the canonical next applicable
read-only discovery branch, preserving the fixed recovery precedence owned by
the Agent Contract.

#### Scenario: Human-required diagnostic is not automated

- **WHEN** a valid final failure envelope has `requires_human: true`
- **THEN** the MD consumer presents the four canonical parts and stops at the
  one producer-owned human action
- **AND** it does not run the next invocation, fabricate approval, or replace
  the action with a generic retry

#### Scenario: Invalid failure output remains non-causal

- **WHEN** a non-zero invocation has no valid final failure envelope
- **THEN** the MD consumer reports the external/interrupted boundary without
  parsing incidental stderr as a recovery policy
- **AND** any subsequent inspection, locator, or direct environment recovery
  follows the canonical Agent Contract precedence

### Requirement: Generated run-bundle guidance preserves the located diagnostic boundary

The generated `deck-guide.md` consumer guidance for a located run bundle SHALL
state the same four-part diagnostic outcome and producer-action boundary without
claiming to locate a run or start pre-install recovery. It SHALL direct a
runtime Agent to consume only the final valid envelope, retain argument
boundaries, stop for a human-required action, and avoid hand-editing state or
generated output.

#### Scenario: A new bundle receives an owner failure

- **WHEN** a runtime Agent reads the generated guide after a CLI failure in a
  located bundle
- **THEN** it can explain the failure in the four canonical parts and preserve
  the producer's exact next action
- **AND** it does not infer a route, state edit, authorization, or raw-output
  repair from the guide
