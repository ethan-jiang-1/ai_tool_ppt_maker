## MODIFIED Requirements

### Requirement: Framework guidance names one current production protocol
Active framework guidance SHALL name `page-authority-image2-v2` as the sole current production protocol and describe its version-level Framed/Pure workflow choice. It SHALL not describe v1, per-slide authority, compatibility, or historical adoption as an active workflow context. A named retired input may be mentioned only as the explicit migration/export hard-stop, with historical detail confined to archive.

#### Scenario: An active workflow reference is read
- **WHEN** an Agent reads Charter, BOOTSTRAP, or workflow guidance for a version
- **THEN** it receives the v2 once-per-version workflow decision and ownership-aware refresh guidance
- **AND** it does not receive v1, compatibility, or a retired protocol as a production choice
