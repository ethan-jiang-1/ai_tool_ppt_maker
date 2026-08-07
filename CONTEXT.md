# AI PPT Production

This context names the durable concepts used to author, version, render, and assemble an AI-generated presentation without confusing page identity with current order.

## Language

**PPT Maker Harness**:
The reusable methodology, controls, and production tools that an Agent uses to establish and operate individual Run Bundles. It does not contain an Agent instance.
_Avoid_: a generic system label or `ppt_maker_harness` when naming the conceptual system

**Agent**:
The external orchestrator that uses the PPT Maker Harness to operate a Run Bundle. An Agent is not Harness source or Run Bundle identity.
_Avoid_: A component of the Harness, a persisted Deck identity

**Ownership Model**:
The division in which the human owns Deck content and consequential approvals, the Agent owns process orchestration, the PPT Maker Harness owns reusable methods and tools, and the Run Bundle owns one Deck's working facts.
_Avoid_: Harness ownership of Deck content, Agent ownership of human content

**Harness Root**:
The one source directory that contains a PPT Maker Harness and is distinct from every Run Bundle.
_Avoid_: a generic source-root label or duplicate Harness root

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
The production family that uses an image model to create either a whole-page page composition or a reviewed visual-slot asset. A local Framed header overlay does not turn whole-page Image Production into visual-slot production or HTML Production.
_Avoid_: Refinement as the umbrella name, a synonym for provider authorization, or a required post-HTML phase

### Page Image Composition

**Page Image Core**:
The common full-canvas image composition model shared by Pure and Framed. It renders page visuals and Provider-Rendered Content while Content Authority remains in the human and canonical source.
_Avoid_: A Framed-only image model, a text-free underlay, a background-only image

**Header Rendering Policy**:
A version-level policy deciding who renders kicker, title, and subtitle: the provider for Pure or a deterministic transparent local overlay for Framed. Framed supplies their exact literals to the provider as context not to render, and it does not select a different body/content model per slide.
_Avoid_: A slide-level authority choice, a third workflow

**Pure**:
The Page Image Core workflow in which the provider renders all visible page pixels, including kicker, title, and subtitle.
_Avoid_: An HTML-composed page, a provider-free workflow

**Framed**:
The Page Image Core workflow in which a transparent deterministic local overlay renders only kicker, title, and subtitle, while the provider renders the rest of the page composition.
_Avoid_: Hybrid as a third workflow, a text-free underlay, a background-only workflow

**Content Authority**:
The human and canonical source's authority over claims, data, and exact required copy. Rendering ownership does not permit semantic invention or paraphrase unless the source explicitly grants Presentation-Adaptable Copy.
_Avoid_: Provider authorship, pixel ownership of facts

**Provider-Rendered Content**:
Canonical page content declared through a Provider Content Schema whose final pixels and composition are rendered by the provider, including body, labels, metrics, diagram text, quotes, and callouts. Its meaning and exact required copy remain under Content Authority.
_Avoid_: Provider-authored content, local frame content by default

**Provider Content Schema**:
The closed canonical-source vocabulary that declares the Provider-Rendered Content and exact required literals of a page. It expresses semantic roles, not provider prompts, free-form BODY prose, coordinates, or layout instructions.
_Avoid_: Arbitrary YAML, an unvalidated BODY field, provider-invented copy

**Presentation-Adaptable Copy**:
Non-factual supporting copy that the canonical source explicitly permits the provider to shorten or rephrase for better text-and-visual composition. It never permits the provider to alter claims, facts, numbers, names, labels, headers, or any unmarked text.
_Avoid_: Implicit paraphrase, provider-authored facts, a blanket rewrite permission

**Page Image Workflow**:
The Harness-owned route that uses Image2 knowledge to compile canonical content, visual direction, and composition constraints into auditable rendering inputs for a complete page. Pure compiles one full-page provider input; Framed coordinates a provider page input with a local header-renderer input, using Presentation-Adaptable Copy only when the source explicitly grants it.
_Avoid_: A content author, a free-form prompt, a per-slide authority choice

**Compiled Provider Input**:
The exact provider request bytes produced by a Page Image Workflow and bound into authorization and evidence lineage. For Framed it includes the exact header literals as context not to render; it is distinct from the local header-renderer input.
_Avoid_: A transport-layer prompt rewrite, an unbound request wrapper

**Production-Equivalent Composite**:
The Framed review image formed by combining the provider raw page under review with the exact deterministic local header-renderer output. Pure has no separate composite because its complete provider page is already its page composition.
_Avoid_: A second provider image, a separate approval state

**Complete Page Review**:
The one human proceed-or-repair decision on a complete page representation: Framed presents its raw page beside its Production-Equivalent Composite, while Pure presents its complete provider page. It precedes and does not replace final delivery review.
_Avoid_: A raw-only Framed decision, an additional composite gate

**Protected Zone**:
A full-canvas compositional avoidance area that keeps provider-rendered text and key visual subjects away from a Framed header. It is not a blank strip, cutout, or whole-page no-text rule.
_Avoid_: Exclusion strip, opaque header panel, guaranteed collision prevention

**Provider-Input-Preserving Refresh**:
A Framed local header refresh for which the compiled provider input, protected geometry, raw contract, and generation profile remain unchanged. Any change outside that proof requires a raw rebuild.
_Avoid_: Any header-field edit, a provider-free semantic update

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
