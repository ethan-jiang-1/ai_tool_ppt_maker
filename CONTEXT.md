# AI PPT Production

This terminology reference names the durable concepts used to author, version,
render, and assemble an AI-generated presentation without confusing page
identity with current order. It does not define behavior: `openspec/specs/` is
the Normative Harness Specification, while the owning Charter, MD Controller,
CLI, and run-bundle source remain their respective sources of record.

## Authority Navigation

| Need | Current authority |
| --- | --- |
| Intended Harness behavior | `openspec/specs/<capability>/spec.md`, plus the active delta for that capability |
| Canonical terminology | This reference |
| Agent process and decisions | The applicable `playbook/` MD Controller and controller manifest |
| Deterministic command/state behavior | The owning CLI and its capability specification |
| Run-bundle paths and layout | `bundle_layout.mjs` and `run-bundle-layout` |

## Language

**PPT Maker Harness**:
The reusable methodology, controls, and production tools that an Agent uses to establish and operate individual Run Bundles. It does not contain an Agent instance.
_Avoid_: a generic system label or `ppt_maker_harness` when naming the conceptual system

**Agent**:
The external orchestrator that turns human presentation intent and Refinement Requests into evidence-backed navigation and normal in-scope work. An Agent is not Harness source, Run Bundle identity, or implicit authority for a different goal.
_Avoid_: A component of the Harness, a persisted Deck identity, a human schema debugger

**Deck Author**:
The human who owns a Deck's content and judgment while knowing none of the PPT
Maker Harness's vocabulary, commands, fields, or lifecycle. Being able to name a
schema, controller, or workflow node is never a precondition for making
progress: the Agent supplies process knowledge and the Harness supplies
evidence. Learning the system is not part of the work.
_Avoid_: An operator, a schema debugger, a person expected to learn the CLI

**Ownership Model**:
The division in which the human owns Deck content and genuinely new consequential directions, the Agent owns process navigation, impact analysis, and normal Task Mandate execution, the PPT Maker Harness owns reusable methods and tools, and the Run Bundle owns one Deck's working facts. Harness evidence and cost records support the work without becoming repeated human approval chores.
_Avoid_: Harness ownership of Deck content, Agent ownership of human content, per-step permission prompts

**Harness Root**:
The one source directory that contains a PPT Maker Harness and is distinct from every Run Bundle.
_Avoid_: a generic source-root label or duplicate Harness root

**Harness Maintenance Domain**:
The source and verification area used to evolve a PPT Maker Harness, including its implementation, normative specifications, and tests. It excludes Deck production data.
_Avoid_: Harness Root alone, a Deck workspace

**Normative Harness Specification**:
The active `openspec/specs/<capability>/spec.md` contract that states intended
Harness behavior within the Harness Maintenance Domain. Harness guidance,
implementation, and tests conform to it; a contradiction is resolved explicitly
rather than silently choosing one source. An active change delta adds only its
declared capability changes.
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
The durable identity of one conceptual page across title edits, reordering, and
work versions; it is expressed by `slide_id`. A final filename projects it as
`NN_slideID`: the zero-padded current Position plus the exact formal identity
literal. That projection is not a second identity field, selector, or schema
conversion.
_Avoid_: Page number, heading number, filename as identity

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

**Image Production**:
The current whole-page Page Image Workflow capability family. The Provider
creates the page composition, while Framed's deterministic local header overlay
remains part of that same workflow rather than a second production family.
_Avoid_: A visual-slot branch, refinement as an umbrella name, or a synonym for provider authorization

### Deck Narrative

**Story Outline**:
The Deck-level narrative source that states the argument, its order, and the
evidence carrying each move, before any page exists. It is human-owned content
under Content Authority and survives repagination.
_Avoid_: A slide list, a page count, an agenda

**Design Constraint Set**:
The Deck-level source that records what the presentation must and must not do:
audience, tone, forbidden claims, required terminology, and delivery limits. It
constrains every downstream stage without describing any single page.
_Avoid_: A visual style sheet, a per-page instruction, a provider prompt

**Visual Language**:
The Deck-level source that fixes the presentation's visual vocabulary:
typography, colour roles, imagery register, and composition habits. Both
workflows compile it into provider-facing facts; it owns no page content and no
local renderer geometry.
_Avoid_: A per-slide style override, a provider prompt, a rendered asset

**Pagination**:
The act of turning a Story Outline into a set of Slide Identities, and the
reason a Deck's page count changes without its argument changing. One narrative
move may become several pages or one.
_Avoid_: Reordering, a structural version, a page-count target

### Production Data Kinds

**Source Data**:
Data a human or an Agent may edit directly. It cannot be recomputed from
anything else, so losing it loses work.
_Avoid_: Input file, raw data

**Derived Data**:
Data that exists only as the recomputable result of an upstream transformation.
Editing it directly is never the repair; changing its upstream source and
recomputing is. Every derived value carries the configuration layer it came
from, so an Agent can state a change's blast radius and a human can check that
claim.
_Avoid_: Cache, generated file, temporary output

**Record Data**:
An append-only statement that something irreversible already happened —
provider spend, an authorization, a human decision. Existing entries are never
rewritten; a correction is a new entry.
_Avoid_: Log, derived evidence, state

**Provenance**:
The annotation on a Derived Data value naming the source or configuration layer
that produced it. It is what makes a derived file answerable to the question
"where do I change this, and what else changes with it?"
_Avoid_: A comment, a debug field

**Schema Definition Home**:
The single directory under the Harness Root that defines every production
schema in YAML. Code constants are mirrors of it, annotated with the definition
they reference; a schema that exists in code but not there is a defect.
_Avoid_: A JS constant, a per-module type file, documentation of code

### Page Image Composition

**Page Source**:
The canonical per-slide authoring facts, including exact header and body
content, visual selection, and Page Class selection. It is the only per-page
presentation scope and cannot directly choose a workflow or author renderer
geometry.
_Avoid_: A controller input, a review-time layout override, an unstructured prompt

**Page Source Receipt**:
The immutable normalized record derived from Page Source before adapter planning. It binds the Work Version's workflow, stable slide identities and positions, canonical content, and selected visual facts; it is derived data, not editable source.
_Avoid_: A second source of truth, a provider request, generated evidence

**Page Image Core**:
The shared immutable semantic and binding model used by Pure and Framed. It combines a Page Source Receipt with validated visual configuration; it neither renders pixels nor owns either workflow's controller.
_Avoid_: A Framed-only renderer, a text-free underlay, a background-only image

**Header Rendering Policy**:
A workflow-bound rule, expressed with each page's canonical header literals, that assigns those fields to a renderer. One Work Version gives every page the same ownership branch: the provider renders them in Pure, while Framed's deterministic transparent local overlay renders them in Framed. A page cannot change that owner.
_Avoid_: A slide-level authority choice, a provider avoidance instruction, a third workflow

**Page Class**:
The source-authored, workflow-neutral category that expresses a page's
narrative role, not its geometry or renderer choice; the classes are
`standard`, `opening`, `transition`, and `closing`. An omitted class normalizes
to `standard`. Adding a class is a Deck-level design change, never a per-page
escape hatch.
_Avoid_: A Framed-only concept, a post-generation review override, arbitrary slide styling

**Header Overlay Preset**:
The single closed local-header treatment that the Framed adapter will render:
canvas, font families, theme, Reserved Header Region, and kicker/title/subtitle
geometry. Exactly one exists and a caller cannot supply its own.
_Avoid_: Header Profile, a per-class style menu, a per-slide typography override

**Reserved Header Region**:
The normalized spatial region owned exclusively by Framed's deterministic local
header renderer, declared by the Header Overlay Preset. It is represented by
existing profile and serialization fields such as `header_region`,
`protected_composition`, `reserved_header`, and `body_safe`; these literal
contracts are not terminology aliases. Provider compliance with the derived
avoidance instruction is requested separately and then human-reviewed.
_Avoid_: Provider Avoidance Constraint, Protected Zone, per-slide header styling

**Provider Avoidance Constraint**:
The provider-facing composition instruction derived from a Framed Reserved
Header Region. It asks the provider to keep readable text and key subjects away
from that region, but neither changes local ownership nor itself proves
provider compliance.
_Avoid_: Reserved Header Region, a blank band, a guaranteed collision prevention mechanism

**Protected Zone**:
曾用旧名，现已不再使用；仅历史文档可见。它曾指 Framed 的本地 Reserved
Header Region 或 Provider Avoidance Constraint，但当前层术语已分别用这两个
规范词（见上），实现中已无此名。
_Avoid_: Reserved Header Region, a second local renderer, a hard spatial guarantee

**Presentation Scope**:
The intentional reach of a design adjustment: Visual Language for shared visual rules, Page Class for a named class of pages, or Page Source for one page's content, visual selection, and class selection. Derived per-page data exposes the result of those scopes but cannot be edited as another scope.
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

**Workflow Meanings**:
`page-image-workflow` is the pipeline literal. `production.workflow: framed|pure`
is the single selected workflow for one Work Version. Method modules and MD
Controller guidance describe how the Agent proceeds; neither introduces another
protocol or version-level workflow value.

**Production Identity**:
The State-owned exact-version agreement at
`production_identity.by_version[3_versions/vN]`. Its record is exactly
`{ workflow, source_epoch }`: source owns the pipeline and selected workflow;
State owns the matching acceptance and freshness fence for state-owned
evidence. A fresh authoring draft intentionally has no record. A missing,
malformed, source-disagreeing, or historical record is a byte-preserving
current-protocol hard-stop, not an alternate workflow or compatibility input.
_Avoid_: Production mode, policy selector, project-metadata mirror

**Compiled Provider Input**:
The exact provider request bytes produced by a Page Image Workflow and bound into authorization and evidence lineage. For Framed it is distinct from the local header-renderer input and carries the provider-facing content and avoidance/controller facts selected for that page.
_Avoid_: A transport-layer prompt rewrite, an unbound request wrapper

**Production-Equivalent Composite**:
The Framed review image formed by combining the provider raw page under review with the exact deterministic local header-renderer output. Pure has no separate composite because its complete provider page is already its page composition.
_Avoid_: A second provider image, a separate approval state

**Complete Page Review**:
The one human proceed-or-repair decision on a complete page representation: Framed presents its raw page beside its Production-Equivalent Composite, while Pure presents its complete provider page. It precedes and does not replace final delivery review.
_Avoid_: A raw-only Framed decision, an additional composite gate

**Provider-Input-Preserving Refresh**:
A Framed local header refresh for which the compiled provider input, Provider Avoidance Constraint, raw contract, and generation profile remain unchanged. Any change outside that proof requires a raw rebuild.
_Avoid_: Any header-field edit, a provider-free semantic update

**Needs Render**:
A production state in which a required Render Artifact is missing or cannot be proven current; it reports unfinished work without authorizing remote rendering.
_Avoid_: Render permission, structural failure

### Intent Discovery And Control

**Foundation Request**:
A request to establish or check local runtime, provider readiness, or in-scope provider capability before Deck work begins.
_Avoid_: A Deck production request, a separate per-call permission prompt

**Work Request**:
A request to create a Deck, resume one exact run, or change an existing exact run. A clear Work Request establishes the Task Mandate for normal in-scope work.
_Avoid_: Inferred latest deck, generic diagnostic, a command-by-command authorization form

**Task Mandate**:
The standing authority established by a clear Work Request for an Agent to perform normal in-scope discovery, production, repair, provider work, and recordkeeping for that goal. The Harness records exact scope, cost, and evidence automatically; the Agent asks again only for a different goal, an explicit human limit, or a genuinely new consequential content or design direction.
_Avoid_: Per-step confirmation, a budget questionnaire, implicit authority for an unrelated Deck

**Refinement Request**:
A Work Request expressed as ordinary iterative feedback about a page, a Page Class, or the Deck as a whole. The Agent maps it to the smallest Presentation Scope and safe next action without requiring the human to name a field, controller, or workflow node.
_Avoid_: A malformed command, a request to guess content, a new authorization form

**Orientation Request**:
A request to locate an exact run, diagnose a bounded failure, recover a missing entry surface, or report an unsupported intent.
_Avoid_: New workflow, fallback production route

**Route Gap**:
A non-persistent response for an unrecognized request that names the smallest missing Controller or owner capability without creating maintenance work automatically.
_Avoid_: Backlog item, selected Controller state, silent fallback

**Guided Checkpoint**:
A non-authoritative collaboration point that states whether enough evidence and known human direction exist for the next irreversible action. When it is not ready, the Agent identifies the missing fact and prepares the smallest safe next action; it is not a Hard Stop or a second lifecycle state machine.
_Avoid_: A generic gate, a blank blocked status, a new Task Mandate

**Hard Stop**:
A non-bypassable control outcome for an operation whose identity, integrity, attributable execution, security, or recoverability cannot be established. It stops only that unsafe operation while the Agent may perform safe diagnosis and prepare the owning recovery route.
_Avoid_: A generic gate, a repeated permission prompt, a total loss of assistance

**Repair Guidance**:
What every refusal must carry beside the reason it refused: the next action
stated in the Deck Author's terms. A validation result that names only the
violated rule is incomplete, because it hands the author a vocabulary problem
instead of a content decision. Correctness of the refusal is not the standard;
the author being able to act on it is.
_Avoid_: A rule citation, a field-name error, a stack trace, a bare rejection

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
