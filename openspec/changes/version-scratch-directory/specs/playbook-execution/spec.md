## ADDED Requirements

### Requirement: Version-scoped backups go under _scratch

When an agent (or playbook step) creates a disposable backup or draft of version sources such as `slide-specifications.md`, it SHALL place that file under `3_versions/v{n}/_scratch/` for the active version. Agents SHALL NOT place such backups at the deck root, under `2_backbone/`, under `_generated/`, or in ad-hoc dirs named `_tmp`, `backup`, or `_bak`. Style-master iteration history remains under `1_upstream_raw_material/style-master-iterations/`; lessons under `_lessons/`; progress under `_state/`.

#### Scenario: slidespec bak lands in version scratch

- **WHEN** Agent renumbers or rewrites slides and keeps a pre-edit copy
- **THEN** the copy is written under `3_versions/v{n}/_scratch/`
- **AND** not as a loose file at the deck root

#### Scenario: Agent does not invent _tmp at deck root

- **WHEN** Agent needs a temporary workspace for a version edit
- **THEN** it uses `_scratch/` (or an existing canonical path from the routing table)
- **AND** does not create `deck_*/_tmp/` or `deck_*/backup/`

### Requirement: Unsure placement triggers GREP of Where Map before inventing paths

When an agent does not know where a file belongs (temp bak, draft, preview artifact, style-master related file, etc.), it SHALL search the soft bundle for canonical placement tokens and consult `PPTMAKER_FRAMEWORK/reference/glossary.md` Where Map **before** creating a new directory name or writing to the deck root. Agents SHALL prefer paths named by the Where Map over improvised names. Enforcement via `checkBundle` remains; GREP discoverability does not replace the check.

#### Scenario: Agent greps before inventing temp dir

- **WHEN** Agent needs a place for a version-scoped `.bak` and is unsure of policy
- **THEN** Agent searches for `_scratch` (or opens glossary Where Map)
- **AND** writes under `3_versions/v{n}/_scratch/` rather than inventing `deck_*/_tmp/`

#### Scenario: Agent routes pilot preview via known token

- **WHEN** Agent looks for where pilot / 小样 / contact sheet lives
- **THEN** Agent can resolve via `contact_sheet` or `pilot` to `_generated/preview/`
- **AND** does not treat deck-root litter as the preview home
