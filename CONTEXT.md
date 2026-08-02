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

**HTML Production**:
The production family that composes final pages locally from structured HTML source. It is parallel to Image Production; it is not a prerequisite for every Deck.
_Avoid_: The only production path

**Image Production**:
The production family that uses an image model to create either a whole-page final Render Artifact or a reviewed visual-slot asset. Whole-page Image Production owns final page pixels; visual-slot Image Production supplies an asset to HTML Production and does not own the final page.
_Avoid_: Refinement as the umbrella name, a synonym for provider authorization, or a required post-HTML phase

**Needs Render**:
A production state in which a required Render Artifact is missing or cannot be proven current; it reports unfinished work without authorizing remote rendering.
_Avoid_: Render permission, structural failure

### Intent Discovery And Control

**Intent Route**:
A closed, named classification of a user's goal whose only responsibility is to select the first safe discovery step.
_Avoid_: CLI command, lifecycle node, authorization

**Intent Route Catalog**:
The versioned, auditable catalog of supported Intent Routes, separate from the Controller manifest and from runtime command dispatch.
_Avoid_: Controller registry, command parser, workflow state machine

**Foundation Request**:
A request to establish or check local runtime, provider readiness, or an explicitly confirmed channel probe before deck work begins.
_Avoid_: Deck production request, implicit provider authorization

**Work Request**:
A request to create a Deck, resume one exact run, or change an existing exact run.
_Avoid_: Inferred latest deck, generic diagnostic

**Orientation Request**:
A request to locate an exact run, diagnose a bounded failure, recover a missing entry surface, or report an unsupported intent.
_Avoid_: New workflow, fallback production route

**Route Gap**:
A non-persistent response for an unrecognized request that names the smallest missing route, playbook, or owner capability without creating maintenance work automatically.
_Avoid_: Backlog item, selected route state, silent fallback

**Authority-Read-Only Observation**:
An observation that cannot modify lifecycle authority facts, even when it may rebuild an explicitly named non-authoritative collaboration projection.
_Avoid_: Zero-write observation, state mutation

**Collaboration Projection**:
A rebuildable, non-authoritative view that helps an Agent and human coordinate but cannot prove progress, authorize cost, or select lifecycle work.
_Avoid_: State of record, task authority
