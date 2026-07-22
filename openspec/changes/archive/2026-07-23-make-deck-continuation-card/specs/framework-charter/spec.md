## ADDED Requirements

### Requirement: AGENT_CONTRACT defines portable run-bundle entry

`AGENT_CONTRACT.md` SHALL define `RUN_BUNDLE.md` as the portable entry for a local
repository-agent session. It SHALL direct the Agent to the one run-bundle-management locator
module for static card proof, without duplicating its parser, filesystem checks, candidate order,
or failure codes. The Agent SHALL carry out this bounded zero-write order:

1. Ask the locator module to resolve card bytes using only the optional original readable card
   path or human-explicit deck/framework roots; consume its resolved result or bounded guide.
   It SHALL not substitute the current working directory, scan, enumerate, or use deck name or
   recency inference.
2. Read only the state owner's selector through observe/no-heal access: active `run_version`
   takes precedence; otherwise `continuation_target_version` selects one exact visible run.
3. Run existing `bundle_layout --check <run-dir> --structure-only`, then `ppt_flow state` and
   `status`, before natural-language routing.

Every resolution failure is a bounded no-write `guide`, never an implicit approval or route.
Card bytes do not themselves select a run, change state, reopen terminal work, or establish a
remote-chat capability. A host unable to access the declared local roots must request the
needed root; attachment-host integration is outside this repository. A deck-only relocation may
retain the verified declared framework root, while a framework-only relocation may use the
recorded relation only if the declared deck root is still verified; a double relocation requests
one explicit framework root.

#### Scenario: Card bytes locate an accessible local bundle
- **WHEN** an Agent receives `RUN_BUNDLE.md` bytes and can access its declared local roots
- **THEN** it resolves and verifies those roots before state inspection
- **AND** it derives one exact run without requiring the user to know framework paths

#### Scenario: Stale locator has bounded recovery
- **WHEN** an absolute root is stale and no verified fallback is available
- **THEN** the Agent requests exactly the missing deck or framework root
- **AND** it does not scan, heal, re-upload, or infer a replacement
