## ADDED Requirements

### Requirement: Controllers create and resume only the current Page Image Workflow

The `create-deck` Controller SHALL obtain one human semantic choice, `framed`
or `pure`, for a new version before provider-facing work. It SHALL author the
`page-image-workflow-v1` source selection, configure common visual semantics,
route to the selected Style Master lifecycle, and then route to the selected
Page Image adapter. The Controller SHALL never ask for a per-slide authority
choice or offer `hybrid` as a workflow. Fresh Style Master work may use a
validated draft, while first raw-page planning materializes the current
source/state receipt pair only after the Style Master prerequisite is current.

On resume, the Controller SHALL obtain the selected workflow and one nearest
legal action from Workflow Inspection. It SHALL not reconstruct a receipt,
mode, provider authorization, review decision, or recovery path from Markdown,
task cards, generated files, or conversation history.

#### Scenario: A Framed deck has one straight selected route

- **WHEN** a human selects `framed` for a valid fresh version
- **THEN** the Controller presents only the Framed Style Master and Page Image
  handoffs before shared delivery
- **AND** it does not expose a Pure or per-slide policy choice

#### Scenario: A current resume preserves owner evaluation

- **WHEN** a current Page Image Workflow Controller resumes with blocked work
- **THEN** it presents Workflow Inspection's owner-issued primary action
- **AND** it does not infer a different route or evidence from a task card

### Requirement: Page Image Workflow gates have one direct recovery and review path

Controller nodes SHALL treat source/state/receipt identity mismatch, closed
content-schema failure, invalid Style Master selection, stale compiled input,
invalid provider scope, stale/invalid page evidence, and final/delivery
lineage mismatch as non-waivable hard-stops. Each gate SHALL reuse the owning
evaluator and present its one nearest legal action. Provider cost authorization
and visual review remain their own bounded human confirms; neither confirms
another lifecycle fact.

Complete Page Review SHALL use one `proceed` or `repair` decision. A Framed
node presents the exact raw provider page beside the production-equivalent
local-header composite; a Pure node presents its complete provider page. It
SHALL not add a second composite approval gate, let Pilot approval stand in for
complete-page acceptance, or expose sibling adapter controls.

#### Scenario: Framed review does not split its decision

- **WHEN** all current Framed page evidence is ready
- **THEN** the Controller presents raw and composite evidence under one
  Complete Page Review decision
- **AND** it does not require a later local-overlay approval

#### Scenario: Stale provider input returns to its owner

- **WHEN** a selected workflow reaches finalization with a stale compiled
  provider-input binding
- **THEN** the Controller routes to the owning rebuild action
- **AND** it does not publish a final slide, PPTX, notes, or delivery receipt

### Requirement: Current Controller refresh and Pilot paths preserve the Page Image model

Pilot remains an explicitly authorized sample/cost stage. Its `pilot` command
creates only a provider-free exact batch projection; sample provider work starts
only after that same batch receives its separate exact cost authorization and
`generate` is invoked. A partial Pilot may present the same policy-specific
page representation that Complete Page Review will use, but it does not publish
acceptance or add a duplicate review gate. `pilot-review` and `pilot-accept`
apply only to partial Pilot evidence; complete current coverage goes directly to
Complete Page Review. The Controller SHALL use direct owner facts to determine
any remaining paid work, not task-card state or file presence.

A Framed provider-free local overlay refresh is permitted only when its owner
proves the compiled provider input, protected geometry, raw contract, and local
profile are unchanged. A changed header literal normally changes provider
context and routes to raw rebuild. Notes-only work remains delivery-owned;
structural or whole-workflow changes use previewed exact-hash versioning.

#### Scenario: A Framed title change avoids false local refresh

- **WHEN** a Framed title literal changes
- **THEN** the Controller presents the owner-issued raw rebuild path
- **AND** it does not place the change on a provider-free Pilot or local
  overlay path

#### Scenario: Pilot remains non-accepting

- **WHEN** an authorized Framed Pilot sample is available
- **THEN** the Controller presents its raw and composite sample representation
- **AND** it does not record final-page acceptance or open a second review
  gate

### Requirement: Agent retains bounded current Image2 channel-probe guidance

When current Style Master or Page Image provider-path symptoms occur -- such as
failed image checks, an Image2 API/relay failure, or a report that image
generation is unavailable -- and no channel probe has run in the session, the
Agent SHALL offer the existing current channel probe as one concrete action,
for example `probe-image-channels` or `doctor --probe-vendors`, with a short
reason. It SHALL not respond only with an unbounded instruction to check an
API, run an undisclosed live probe, or treat a successful probe as page-cost
authorization, review acceptance, or progress evidence.

#### Scenario: First current provider-path failure offers a bounded probe

- **WHEN** current Page Image or Style Master work fails with a provider-path
  symptom and no session probe has run
- **THEN** the Agent offers one concrete channel-probe action that the human may
  accept or decline
- **AND** it does not create a page plan, grant, provider attempt, or review
  decision from the offer or its result

### Requirement: Active Controller guidance rejects v2 Page Authority routes

Registered active playbooks, Controller manifests, resume cards, and task
projection sources SHALL describe only the replacement Page Image Workflow.
When they encounter v2 Page Authority source/state/evidence, they SHALL show
the owner-issued `unsupported-protocol/export` hard-stop and preserve bytes.
They SHALL not register, select, rewrite, resume, adopt, migrate, or route a
v2 workflow.

#### Scenario: A v2 run cannot enter an active controller

- **WHEN** a controller attempts to resolve a v2 source/state pair
- **THEN** it presents the `unsupported-protocol/export` action before
  selecting nodes
- **AND** it does not create a compatibility controller or task projection

### Requirement: Page Image task projections remain non-authoritative collaboration views

For an exact active current Page Image Workflow Controller route, the optional
`_state/page-production-task-projection.md` SHALL be rebuilt only from
owner-issued inspection and typed handoffs. It may show bounded plan, evidence,
review, manifest, delivery, and current-action references, but it SHALL not
become a selector, source of authority, authorization, acceptance record, or
provider progress evaluator. A v2 record is ineligible to create or refresh
the view.

#### Scenario: Card edits cannot advance a current page checkpoint

- **WHEN** a task projection contains changed prose, checkboxes, or stale
  references
- **THEN** the Controller re-reads current owner facts before choosing work
- **AND** it does not treat the card as authorization or acceptance evidence

## REMOVED Requirements

### Requirement: Agent offers channel probe on image-path symptoms

**Reason**: Its active production terminology is Page Authority-specific.

**Migration**: Image-path symptoms continue through the current operation's
owner-issued diagnostic and channel-probe guidance.

### Requirement: Controller resume guidance consumes workflow inspection

**Reason**: It describes non-v2 as unsupported and therefore excludes the
replacement protocol.

**Migration**: Resume only current Page Image Workflow runs marker-first.

### Requirement: New decks enter the Page Authority production controller

**Reason**: It authors the retired v2 source and Page Authority route.

**Migration**: Start from the explicit Page Image Workflow policy selection.

### Requirement: Page Authority gates have one direct recovery path

**Reason**: Its evidence and review model assumes the retired Framed underlay.

**Migration**: Use the replacement Complete Page Review and direct owner
recovery paths.

### Requirement: Active controllers route only Page Authority work

**Reason**: v2 is no longer an active controller protocol.

**Migration**: Active controllers route only current Page Image Workflow work.

### Requirement: TARGET controller gates reuse direct workflow evidence

**Reason**: Its target contract is v2 Page Authority-specific.

**Migration**: Reuse only replacement parser, state, evidence, and delivery
evaluators.

### Requirement: Style Master Controller handoff stays selected-workflow specific

**Reason**: It binds the handoff to a fresh-v2/current-v2 lifecycle.

**Migration**: Bind Style Master to the replacement source/state or draft
scope.

### Requirement: Page Authority Controller uses progressive selected-workflow checkpoints

**Reason**: Its raw evidence names a text-free Framed underlay and v2 route.

**Migration**: Pilot uses the replacement policy-specific page representation
and Complete Page Review.

### Requirement: Progressive Controller task projection is a rebuildable collaboration card

**Reason**: Its eligible controller identity is Page Authority-specific.

**Migration**: Build the view only from current Page Image Workflow facts.

### Requirement: Controller omits duplicate Pilot gates for complete or provider-free debt

**Reason**: Its provider-free Framed Text Frame route is not valid under the
new compiled-input invalidation contract.

**Migration**: Use direct compiled-input proof before any local overlay refresh.

### Requirement: Active Pure Pilot prose names Page Authority raw evidence

**Reason**: Its active documentation still names the retired production model.

**Migration**: Present Pure provider pages as current Page Image Workflow
evidence.
