# AI PPT Production

This context names the durable concepts used to author, version, render, and assemble an AI-generated presentation without confusing page identity with current order.

## Language

**Deck**:
A presentation work with one audience, objective, and narrative continuity across its work versions.
_Avoid_: Project, PPT file

**Slide Identity**:
The durable identity of one conceptual page across title edits, reordering, and work versions; it is expressed by `slide_id`.
_Avoid_: Page number, heading number, filename

**Position**:
The mutable 1-based place of a slide in the current work version, derived from slide-block order.
_Avoid_: Slide identity, permanent page number

**Slide Selector**:
A snapshot-scoped human reference that resolves a position, spoken mnemonic, formal identity, or unique title fragment to a Slide Identity.
_Avoid_: Slide ID when the input has not yet been resolved

**Work Version**:
A user-visible `vN` snapshot of one Deck used for structural alternatives and clean downstream production.
_Avoid_: Git commit, framework release

**Render Artifact**:
A rendered representation of one Slide Identity for a specific render engine and artifact kind under a particular content fingerprint.
_Avoid_: Slide, page position

**Needs Render**:
A production state in which a required Render Artifact is missing or cannot be proven current; it reports unfinished work without authorizing remote rendering.
_Avoid_: Render permission, structural failure

