## MODIFIED Requirements

### Requirement: AGENT_CONTRACT defines portable run-bundle entry

`AGENT_CONTRACT.md` SHALL define `RUN_BUNDLE.md` as the portable entry for a local
repository-agent session. The Agent SHALL parse only its closed static locator record and carry
out this bounded zero-write order:

1. Resolve declared `deck_root` and verify a regular non-symlink
   `<deck-root>/RUN_BUNDLE.md` with the same record and normal root controls.
2. If that absolute deck root is stale, use the original readable card path's parent as one
   verified fallback candidate; otherwise request one explicit readable deck root. No search,
   enumeration, or name/recency inference is allowed.
3. Resolve declared `framework_root` and verify the expected framework scripts. If stale,
   evaluate the card relation from the verified deck root; otherwise request one explicit
   framework root. No nearby-framework guess is allowed.
4. Read only the state owner's selector through observe/no-heal access: active `run_version`
   takes precedence; otherwise `continuation_target_version` selects one exact visible run.
5. Run existing `bundle_layout --check <run-dir> --structure-only`, then `ppt_flow state` and
   `status`, before natural-language routing.

Every resolution failure is a bounded no-write `guide`, never an implicit approval or route.
Card bytes do not themselves select a run, change state, reopen terminal work, or establish a
remote-chat capability. A host unable to access the declared local roots must request the
needed root; attachment-host integration is outside this repository.

#### Scenario: Card bytes locate an accessible local bundle
- **WHEN** an Agent receives `RUN_BUNDLE.md` bytes and can access its declared local roots
- **THEN** it resolves and verifies those roots before state inspection
- **AND** it derives one exact run without requiring the user to know framework paths

#### Scenario: Stale locator has bounded recovery
- **WHEN** an absolute root is stale and no verified fallback is available
- **THEN** the Agent requests exactly the missing deck or framework root
- **AND** it does not scan, heal, re-upload, or infer a replacement
