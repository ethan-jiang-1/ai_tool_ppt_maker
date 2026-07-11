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
