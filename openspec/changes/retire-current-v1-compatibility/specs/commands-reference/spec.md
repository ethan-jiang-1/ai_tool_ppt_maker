## REMOVED Requirements

### Requirement: Commands name the bounded CURRENT compatibility surface
**Reason**: v1 is no longer a current executable or human-facing route.
**Migration**: New work uses the v2 target classifier. A named retired bundle receives only the generic unsupported-protocol/export action; any conversion requires a separately authorized deck-scoped plan.

### Requirement: COMMANDS.md complements target and CURRENT compatibility classifiers
**Reason**: An active v1 classifier makes a retired protocol discoverable to coding agents.
**Migration**: Keep historical classification in the archived change only; use `scripts/06-iteration/change-classifier.md` for current work.

## MODIFIED Requirements

### Requirement: Commands route work by Page Authority ownership and invalidation
Active command guidance SHALL route Framed, Pure, notes-only, and structural requests through the v2 Page Authority ownership/invalidation model. A non-v2 input SHALL receive the generic unsupported-protocol/export hard-stop and SHALL NOT be presented as a production, inspection-continuation, or fallback route.

#### Scenario: A non-v2 protocol is not offered
- **WHEN** command guidance describes a visual or text change
- **THEN** it selects a v2 Page Authority refresh path without presenting another protocol as a choice

#### Scenario: A non-v2 bundle is encountered
- **WHEN** command guidance receives a non-v2 source/state identity
- **THEN** it reports the generic unsupported-protocol/export action
- **AND** it does not infer a workflow, decode history, or create a receipt

### Requirement: Commands route TARGET work by one version workflow and owner
For a target `page-authority-image2-v2` run, `COMMANDS.md` SHALL describe one Framed-or-Pure workflow choice at version start and thereafter route requests by the bound workflow and direct artifact ownership. It SHALL present the selected workflow's current fact, gate, and nearest action without exposing shared raw topology, sibling adapter internals, or a per-slide authority choice.

Command guidance SHALL route target Framed text-only work to its local refresh only when exact accepted raw evidence and frame preset remain current; route Framed underlay/preset and Pure display/visual work to raw rebuild; route notes-only work to shared delivery; and route structural or whole-workflow changes through previewed exact-hash vNext versioning. It SHALL name `06-iteration` as the target iteration owner.

#### Scenario: Human requests a target visual edit
- **WHEN** a human asks to change visible text or visual content in a target Pure version
- **THEN** COMMANDS guidance routes the request to the Pure raw rebuild path through the selected workflow
- **AND** it does not offer a Framed local refresh or ask the human to choose an authority for one slide

#### Scenario: Human requests a target workflow switch
- **WHEN** a human asks to change a target version from Framed to Pure
- **THEN** COMMANDS guidance routes to Structural Versioning Path preview and exact plan confirmation
- **AND** it does not describe an in-place workflow mutation or acceptance reuse

## ADDED Requirements

### Requirement: COMMANDS.md complements the target classifier
COMMANDS.md SHALL be the concise human-facing interface and SHALL link detailed current change classification only to `scripts/06-iteration/change-classifier.md`. It SHALL not link to a compatibility, v1, or archived classifier.

#### Scenario: Documentation links resolve only to current classification
- **WHEN** command-reference links are audited
- **THEN** every active classifier link resolves to the target iteration classifier
- **AND** no active link resolves to a v1 or compatibility path
