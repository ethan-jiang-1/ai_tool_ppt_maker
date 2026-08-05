# AI PPT Production

This context names the durable concepts used to author, version, render, and assemble an AI-generated presentation without confusing page identity with current order.

## Language

**PPT Maker Harness**:
The reusable methodology, controls, and production tools that an Agent uses to establish and operate individual Run Bundles. It does not contain an Agent instance.
_Avoid_: Framework, `PPTMAKER_FRAMEWORK` when naming the conceptual system

**Agent**:
The external orchestrator that uses the PPT Maker Harness to operate a Run Bundle. An Agent is not Harness source or Run Bundle identity.
_Avoid_: A component of the Harness, a persisted Deck identity

**Ownership Model**:
The division in which the human owns Deck content and consequential approvals, the Agent owns process orchestration, the PPT Maker Harness owns reusable methods and tools, and the Run Bundle owns one Deck's working facts.
_Avoid_: Harness ownership of Deck content, Agent ownership of human content

**Harness Root**:
The one source directory that contains a PPT Maker Harness and is distinct from every Run Bundle.
_Avoid_: Framework root, duplicate Harness root

**Harness Maintenance Domain**:
The source and verification area used to evolve a PPT Maker Harness, including its implementation, normative specifications, and tests. It excludes Deck production data.
_Avoid_: Harness Root alone, a Deck workspace

**Normative Harness Specification**:
The active contract that states intended Harness behavior within the Harness Maintenance Domain. Harness guidance, implementation, and tests conform to it; a contradiction is resolved explicitly rather than silently choosing one source.
_Avoid_: An advisory document, an implementation-only rule

**Harness Binding**:
The association between a Run Bundle and the exact local PPT Maker Harness root that created it, rather than a release, Git revision, or content hash. A different Harness does not take over that Run Bundle implicitly.
_Avoid_: Portable binding, silent Harness reassignment, version pinning

**Run Bundle Placement**:
The local location of a Run Bundle, which may be any directory outside its Harness Root. A sibling layout is convenient but not required.
_Avoid_: A Harness child directory, a sibling-only layout

**Run Bundle Lesson**:
A non-secret operational lesson retained by one Run Bundle for its Deck's later work. It is read before guessing and does not automatically become Harness knowledge.
_Avoid_: Global memory, workflow progress, secret, automatic promotion

**Run Bundle**:
The sole instance-specific workspace for one Deck, created and operated by the PPT Maker Harness; it contains that Deck's work versions and owns its inputs, state, and evolving artifacts, not reusable Harness source.
_Avoid_: Harness instance, Harness project, a second workspace for the same Deck

**Deck**:
A presentation work with one audience, objective, and narrative continuity across its work versions. It is the persistent project identity for its Run Bundle.
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
A user-visible `vN` snapshot of one Deck inside its Run Bundle, used for structural alternatives and clean downstream production.
_Avoid_: Git commit, Harness release

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
