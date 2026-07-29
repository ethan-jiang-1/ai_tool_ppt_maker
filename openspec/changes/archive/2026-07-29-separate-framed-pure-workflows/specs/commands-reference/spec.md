## ADDED Requirements

### Requirement: Commands route TARGET work by one version workflow and owner

For a target `page-authority-image2-v2` run, `COMMANDS.md` SHALL describe one
Framed-or-Pure workflow choice at version start and thereafter route requests by
the bound workflow and direct artifact ownership. It SHALL present the selected
workflow's current fact, gate, and nearest action without exposing shared raw
topology, sibling adapter internals, or a per-slide authority choice.

Command guidance SHALL route target Framed text-only work to its local refresh
only when exact accepted raw evidence and frame preset remain current; route
Framed underlay/preset and Pure display/visual work to raw rebuild; route
notes-only work to shared delivery; and route structural or whole-workflow
changes through previewed exact-hash vNext versioning. It SHALL name
`06-iteration` as the target iteration owner and SHALL keep CURRENT v1 mixed
guidance explicitly bounded.

#### Scenario: Human requests a target visual edit

- **WHEN** a human asks to change visible text or visual content in a target Pure version
- **THEN** COMMANDS guidance routes the request to the Pure raw rebuild path through the selected workflow
- **AND** it does not offer a Framed local refresh or ask the human to choose an authority for one slide

#### Scenario: Human requests a target workflow switch

- **WHEN** a human asks to change a target version from Framed to Pure
- **THEN** COMMANDS guidance routes to Structural Versioning Path preview and exact plan confirmation
- **AND** it does not describe an in-place workflow mutation or acceptance reuse
