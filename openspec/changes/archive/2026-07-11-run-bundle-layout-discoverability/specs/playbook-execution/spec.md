## ADDED Requirements

### Requirement: Unsure placement triggers GREP of Where Map before inventing paths

When an agent does not know where a file belongs, it SHALL search the soft bundle for canonical placement tokens and consult `PPTMAKER_FRAMEWORK/reference/glossary.md` Where Map (owned by `run-bundle-layout`) **before** creating a new directory name or writing to the deck root. Agents SHALL prefer Where Map paths over improvised names. `checkBundle` enforcement (`run-bundle-management`) remains; GREP does not replace the check.

#### Scenario: Agent greps before inventing temp dir

- **WHEN** Agent needs a place for a version-scoped `.bak` and is unsure of policy
- **THEN** Agent searches for `_scratch` (or opens glossary Where Map)
- **AND** writes under `3_versions/v{n}/_scratch/` rather than inventing `deck_*/_tmp/`

#### Scenario: Agent routes pilot preview via known token

- **WHEN** Agent looks for where pilot / 小样 / contact sheet lives
- **THEN** Agent can resolve via `contact_sheet` or `pilot` to `_generated/preview/`
- **AND** does not treat deck-root litter as the preview home
