# Narrative Authoring Specification

## Purpose

Define the deck-level narrative sources and deterministic page planning that let
a Deck Author correct an argument before it becomes Page Image source.

## Requirements

### Requirement: Narrative source expresses the argument in ordered Blocks
The current Story Outline SHALL be editable deck-level Source Data. It SHALL
state one central claim and one intended audience outcome, then order Blocks by
their intended argument sequence. Every Block SHALL state its audience question,
argument function, supporting evidence or reasoning beats, and intended page
range. A Story Outline SHALL NOT contain provider instructions, page geometry,
or a final review/delivery decision.

The current Design Constraints source SHALL state only audience, language and
tone, claim boundaries, and required terminology that constrain the deck's
content. It SHALL NOT own visual-language selections, page-specific layout, or
per-class text-density policy.

#### Scenario: Deck Author corrects the argument before pagination
- **WHEN** the Deck Author changes a central claim, Block, audience question,
  argument function, evidence beat, or audience outcome
- **THEN** the next page plan derives from that current source decision
- **AND** the change does not require the author to edit page order, provider
  instructions, or derived artifacts directly

#### Scenario: A visual or layout preference is supplied as a narrative constraint
- **WHEN** a Story Outline or Design Constraints document contains a
  visual-language selection, page geometry, or page-class layout rule
- **THEN** narrative validation reports that the boundary is wrong and names
  the nearest owning source in Deck Author terms
- **AND** it does not treat the misplaced value as a current narrative input

### Requirement: Pagination compiles one Agent-authored candidate into a provenance-carrying page plan
The Agent SHALL make the creative decision that groups Blocks and beats into
proposed pages. The narrative planner SHALL consume that candidate with the
current Story Outline, Design Constraints, and current Visual Language registry to
produce an ordered page plan. Each proposed page SHALL identify its source
digests and its originating Block and evidence or reasoning beats. The page
plan SHALL identify the target workflow and complete canonical Page Source it
would materialize, including current mnemonic slide identities where a new
identity is required.

The plan SHALL bind the candidate's canonical bytes and confined
scratch-relative locator. Exact-plan publication SHALL resolve the same locator
within the current version's `_scratch/` and reject the plan before mutation
when the candidate is absent, escapes that directory, or no longer has the
bound bytes.

The candidate SHALL be UTF-8 JSON with
`schema: narrative-page-grouping-candidate`, one complete target Page Source
text, and an ordered page list. Each list entry SHALL name the target `slide_id`
and one or more Block references containing the normalized Block ordinal and
heading plus one or more beat ordinals. The compiler SHALL require the parsed
target Page Source order to exactly match the list, then validate every lineage
reference and intended inclusive page range. The derived preview SHALL use
`schema: narrative-page-plan` and reside only at
`_scratch/narrative-plans/<plan_sha256>.json`; neither schema establishes
authoritative Source Data or State.

The page plan is derived and reviewable. It SHALL NOT become another editable
page-order source, lifecycle ledger, acceptance record, state-machine node, or
provider input. Re-running compilation from unchanged narrative inputs and the
same candidate SHALL reproduce the same plan identity and contents.

#### Scenario: A page can be traced to the story
- **WHEN** an Agent or Deck Author inspects a proposed page
- **THEN** the plan identifies the exact Story Outline, Design Constraints, and
  Visual Language registry inputs and the Block and beats that justify that page
- **AND** it does not require source order alone to explain the page's purpose

#### Scenario: A narrative input or candidate changes after planning
- **WHEN** a Story Outline, Design Constraints, current Visual Language registry, or
  Agent-provided page-grouping candidate changes after a page plan was created
- **THEN** that plan is no longer eligible for materialization
- **AND** the Agent's nearest action is to regenerate and present one current
  page plan

### Requirement: Narrative planning keeps human content decisions and runtime integrity distinct
The Agent SHALL present a page plan as a content and structure recommendation in
Deck Author terms. Materializing a new plan requires one explicit Deck Author
confirmation because it commits the Agent's argument-to-page structure; routine
candidate validation, provenance calculation, source validation, and
rendering-debt calculation remain Agent/Harness work under the Task Mandate.

Missing or malformed narrative source is a `guide` when the Agent can repair it
from already supplied content, and otherwise a `confirm` for the smallest new
content decision. A stale plan, changed source bytes, invalid identity, or
invalid target version is a non-bypassable `hard-stop` owned by the existing
source/structural protections. No confirmation is a provider authorization,
review decision, or evidence of completed rendering.

#### Scenario: The author accepts a proposed page structure
- **WHEN** the Deck Author confirms the displayed exact page plan
- **THEN** the Agent may invoke the existing exact-plan materialization path
- **AND** the confirmation does not create a provider grant, acceptance record,
  or additional state authority

#### Scenario: The source no longer matches the confirmed plan
- **WHEN** materialization receives a plan whose declared input bytes or plan
  identity no longer match the current direct sources
- **THEN** the operation hard-stops before source or state mutation
- **AND** it directs the Agent to regenerate the plan from the current sources
