## Context

See proposal.md. Current `targetPageAuthoritySubmitFactory` builds
`prompt: JSON.stringify(request)`, burying the slide text under
`raw_contract.display`/`raw_contract.body`. Pure raw images ARE the final slide
(PPTX embeds raw bytes; no local text overlay), so the provider must render the
text; burying it yields text-light images. Framed raw images are text-free
underlays with local composition, so they must NOT gain text instructions.

## Goals / Non-Goals

**Goals:** Pure prompts present the slide text as an explicit renderable contract;
framed prompts unchanged; raw contract/authorization/idempotency unchanged.

**Non-Goals:** No raw contract schema change; no free-prose prompt; no diagnostic
surface change; no framed behavior change.

## Decisions

### D1: Pure-only prompt restructuring inside `targetPageAuthoritySubmitFactory`

Branch on `request.raw_contract.workflow === "pure"` (or the presence of
`raw_contract.body`/`display`): for pure, build a structured prompt whose top
level has a `text` section
(`{ kicker, title, subtitle, callout, body }` pulled from
`raw_contract.display`/`raw_contract.body`), a `visual` section
(`provider_clauses` + `visual_scene`), and a bounded instruction to render the
text as readable typography. Framed keeps `JSON.stringify(request)`.

*Rationale:* pure needs text-in-image; framed must stay text-free. Branching on
the raw contract's own workflow keeps the transport honest and deterministic.

*Alternative:* add the text to the raw contract schema — rejected: that changes
the contract digest and invalidates existing plans/authorizations.

### D2: Keep the prompt structured JSON, not prose

The new pure prompt is still `JSON.stringify({...})` with clear sections, not a
free-form paragraph. Deterministic, secret-safe, and diffable in the inspection.

### D3: Assertion scope in tests

Update submit-factory and workflow tests: pure prompt contains the explicit text
section (and the exact title/body strings); framed prompt does not contain a
renderable text section and still equals the framed request serialization.

## Risks / Trade-offs

- [Risk: providers render text imperfectly (wrong language/placement)] →
  Mitigation: raw images remain human-reviewed production artifacts; the bounded
  instruction is deterministic and consistent; no aesthetic gate added.
- [Risk: pure prompt change alters provider-request inspection hashes] →
  Mitigation: inspection is transport diagnostic; existing plans/authorizations
  (raw contract based) are unaffected.

## Migration Plan

Transport-only. Existing plans/contracts/authorizations remain valid; already
materialized pure raw images can be regenerated with the new prompt via a fresh
batch without contract changes.
