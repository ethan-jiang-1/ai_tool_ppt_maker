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

**Page Source**:
The canonical per-slide authoring facts, including exact header and body content, visual selection, and Page Class selection when that target model is adopted. It is the only per-page presentation scope and cannot directly choose a workflow or author renderer geometry.
_Avoid_: A controller input, a review-time layout override, an unstructured prompt

**Source Receipt**:
The immutable normalized record derived from Page Source before adapter planning. It binds the Work Version's workflow, stable slide identities and positions, canonical content, and selected visual facts; it is derived data, not editable source.
_Avoid_: A second source of truth, a provider request, generated evidence

**Page Image Core**:
The shared immutable semantic and binding model used by Pure and Framed. It combines a Source Receipt with validated visual configuration today and is the intended seam for selected presentation facts; it neither renders pixels nor owns either workflow's controller.
_Avoid_: A Framed-only renderer, a text-free underlay, a background-only image

**Header Rendering Policy**:
A workflow-bound rule, expressed with each page's canonical header literals, that assigns those fields to a renderer. One Work Version gives every page the same ownership branch: the provider renders them in Pure, while Framed's deterministic transparent local overlay renders them in Framed; Page Class Profiles may vary fixed treatment but cannot change that owner.
_Avoid_: A slide-level authority choice, a provider avoidance instruction, a third workflow

### Target Presentation Control

**Page Presentation System**:
The planned version-resolved source configuration that declares the Deck Baseline, closed Page Class catalog, and workflow-isolated class profiles. It is separate from page content, provider prompts, generated output, and lifecycle authority.
_Avoid_: Pure visual system as the universal owner, a Framed preset list, an unstructured design brief

**Deck Baseline**:
The planned version-level presentation values shared by Page Class Profiles before a class declares its typed differences. It owns no slide content, page selection, or direct per-page geometry override.
_Avoid_: A universal provider prompt, a per-slide style override, a duplicate class profile

**Page Class**:
The planned source-authored, workflow-neutral category that expresses a page's narrative and presentation role, not its geometry or renderer choice; the initial classes are `standard`, `opening`, `transition`, and `closing`, with `standard` as the default and every non-standard class explicit. Any addition is a version-level design change, and each selected class resolves through a workflow-specific Page Class Profile: Pure gets provider-owned full-page treatment, while Framed gets exactly one Header Profile.
_Avoid_: A Framed-only concept, a post-generation review override, arbitrary slide styling

**Page Class Profile**:
The planned workflow-specific typed delta for one Page Class. It inherits the Deck Baseline, declares only class differences, and resolves to provider-owned full-page treatment for Pure or exactly one fixed Header Profile for Framed; it never exposes sibling-workflow facts.
_Avoid_: A per-slide layout override, a cross-workflow configuration leak, an unstructured special-page exception

**Header Profile Set**:
The planned closed, version-scoped catalog of Header Profiles available to Framed pages. A Framed Page Class Profile resolves to one member; members are not selected by per-slide coordinates or a review-time visual edit.
_Avoid_: An unbounded style menu, a provider layout choice

**Header Profile**:
The planned fixed Framed treatment resolved for one Page Class in one Work Version. After the relevant Deck Baseline and Framed Page Class Profile are applied, it fixes the allowed header fields, their positions, type styles, colours, spacing, and the Reserved Header Region; a slide cannot override it or add a header field.
_Avoid_: Slide-local typography, an ad hoc provider layout instruction

**Reserved Header Region**:
The planned spatial region owned exclusively by Framed's deterministic local header renderer. Its geometry comes from the Header Profile selected by the page's Page Class; that profile separately determines allowed fields, typography, colour, and spacing, while provider compliance is requested separately and then human-reviewed.
_Avoid_: Provider Avoidance Constraint, Protected Zone, per-slide header styling

**Resolved Page Presentation**:
The planned immutable per-slide configuration produced by applying the Deck Baseline and a slide's Page Class to the Page Class Profile selected for its Work Version's one workflow. It supplies only that workflow's projection without allowing the slide to author geometry or styling directly.
_Avoid_: Raw configuration file, a review-time override, a provider prompt

**Rendering Controller Projection**:
The planned human-inspectable, renderer-specific pre-production projection compiled from canonical content and one Resolved Page Presentation; Pure has one Image2 JSON projection, while Framed has a provider Image2 JSON projection and a deterministic local Header HTML projection, all bound to the same page facts. The exact bytes of a provider request remain the Compiled Provider Input.
_Avoid_: An opaque prompt, generated page pixels, a lifecycle approval

**Pre-Production Data View**:
The planned provider-free, page-addressable publication of separate non-secret source, resolved-presentation, and controller-projection artifacts, plus a deck-level Presentation Control Map. It exposes every non-secret fact needed to explain their transformations before authorization without becoming an input or approval authority.
_Avoid_: A summary-only debug report, a second source of truth, a provider log

**Presentation Control Map**:
The planned deck-level derived index within the Pre-Production Data View. It maps Page Class assignments, resolved profiles, downstream controller projections, and change impact to their authoritative per-page artifacts; it is neither editable configuration nor lifecycle authority.
_Avoid_: One giant configuration blob, a second source of truth, an approval record

**Presentation Scope**:
The intentional reach of a design adjustment: Deck Baseline for shared visual rules, Page Class Profile for a named class of pages, or Page Source for one page's content, visual selection, and class selection. Rendering Controller Projections expose the result of those scopes but cannot be edited as another scope.
_Avoid_: Per-page geometry nudging, one all-purpose configuration blob, a review-time layout override

### Workflow Roles

**Pure**:
The Page Image Workflow option in which the provider renders all visible page pixels, including kicker, title, and subtitle.
_Avoid_: An HTML-composed page, a provider-free workflow

**Framed**:
The Page Image Workflow option in which a transparent deterministic local overlay renders only kicker, title, and subtitle, while the provider renders the rest of the page composition.
_Avoid_: Hybrid as a third workflow, a text-free underlay, a background-only workflow

**Content Authority**:
The human and canonical source's authority over claims, data, and exact required copy. Rendering ownership does not permit semantic invention or paraphrase unless the source explicitly grants Presentation-Adaptable Copy.
_Avoid_: Provider authorship, pixel ownership of facts

**Provider-Rendered Content**:
The canonical non-header page content declared through a Provider Content Schema whose final pixels and composition are rendered by the provider, including body, labels, metrics, diagram text, quotes, and callouts. In Pure, header fields are also provider-rendered but remain Header Rendering Policy facts outside this schema; all meaning and exact required copy remain under Content Authority.
_Avoid_: Provider-authored content, local frame content by default

**Provider Content Schema**:
The closed canonical source vocabulary that declares Provider-Rendered Content and its exact required literals. It excludes KICKER, TITLE, and SUBTITLE, and expresses semantic roles rather than provider prompts, free-form BODY prose, coordinates, or layout instructions.
_Avoid_: Arbitrary YAML, an unvalidated BODY field, provider-invented copy

**Presentation-Adaptable Copy**:
Non-factual supporting copy that the canonical source explicitly permits the provider to shorten or rephrase for better text-and-visual composition. It never permits the provider to alter claims, facts, numbers, names, labels, headers, or any unmarked text.
_Avoid_: Implicit paraphrase, provider-authored facts, a blanket rewrite permission

**Page Image Workflow**:
The Harness-owned route that uses Image2 knowledge to compile canonical content, visual direction, and composition constraints into auditable rendering inputs for a complete page. Pure compiles one full-page provider input; Framed coordinates a provider page input with a local header-renderer input, using Presentation-Adaptable Copy only when the source explicitly grants it.
_Avoid_: A content author, a free-form prompt, a per-slide authority choice

**Compiled Provider Input**:
The exact provider request bytes produced by a Page Image Workflow and bound into authorization and evidence lineage. For Framed it is distinct from the local header-renderer input and carries the provider-facing content and avoidance/controller facts selected for that page.
_Avoid_: A transport-layer prompt rewrite, an unbound request wrapper

**Production-Equivalent Composite**:
The Framed review image formed by combining the provider raw page under review with the exact deterministic local header-renderer output. Pure has no separate composite because its complete provider page is already its page composition.
_Avoid_: A second provider image, a separate approval state

**Complete Page Review**:
The one human proceed-or-repair decision on a complete page representation: Framed presents its raw page beside its Production-Equivalent Composite, while Pure presents its complete provider page. It precedes and does not replace final delivery review.
_Avoid_: A raw-only Framed decision, an additional composite gate

**Provider Avoidance Constraint**:
The provider-facing composition instruction derived from a Framed Reserved Header Region. It asks the provider to keep readable text and key subjects away from that region, but neither changes local ownership nor itself proves provider compliance.
_Avoid_: Reserved Header Region, a blank band, a guaranteed collision prevention mechanism

**Protected Zone**:
The legacy name for a Provider Avoidance Constraint in current specifications and implementation. It is not the canonical name for a Reserved Header Region.
_Avoid_: Reserved Header Region, a second local renderer, a hard spatial guarantee

**Provider-Input-Preserving Refresh**:
A Framed local header refresh for which the compiled provider input, Provider Avoidance Constraint, raw contract, and generation profile remain unchanged. Any change outside that proof requires a raw rebuild.
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

### Human Artifact Navigation

**Human Navigation Path**:
The short physical directory-and-filename path through which a human locates and uses a Run Bundle artifact. It is distinct from the artifact's canonical full-SHA identity and is the only artifact path exposed for human navigation.
_Avoid_: Display reference, canonical storage path, SHA directory, logical locator
