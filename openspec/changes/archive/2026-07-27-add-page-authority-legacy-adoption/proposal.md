## Why

Slice A made Page Authority the only production protocol for new decks, but explicitly targeted
`html-first-v1` and `whole-page-image2-v1` runs still have their historical dispatch. Removing that
dispatch without a bridge would strand valid decks; inferring a conversion from old prompts, pixels, or
generated artifacts would instead give legacy material unsafe authority in a new protocol.

This change introduces the one explicit, provider-free adoption bridge before legacy production is
retired. It also bounds adoption verification to deterministic, selected journeys: automation proves
the state/evidence boundary, while Image2 quality remains a separately authorized human raw-review or
pilot decision.

## What Changes

- Add a read-only legacy-protocol observer that recognizes only exact canonical legacy source/state
  pairs and returns one typed adoption next action. Unknown, corrupted, or partially current pairs
  remain repair/export hard-stops and are never inferred into an adapter.
- Add a previewed, exact-plan-hash, CAS-bound adoption transaction that creates a clean Page Authority
  target version. Every retained slide is explicitly authored with a Page Authority variant and source
  disposition; stable identities may be retained, but no legacy prompt, pixels, raw image, review,
  authorization, execution, or delivery evidence is copied.
- Reserve, stage, publish, and recover adoption targets through the existing state-owned versioning
  boundary. Reinspection at apply protects source/state/observation drift; a crash or conflicting
  target fails closed with one owner-issued recovery action.
- Once the bridge is available, make normal legacy production entry points return
  `LEGACY_PROTOCOL_ADOPTION_REQUIRED` and route users to a provider-free preview. Actual Page Authority
  raw generation remains a later, separately authorized operation on the clean target.
- Add a narrow adoption verification rail: core and affected contract tests by default, plus only the
  selected provider-free adoption journeys. They use deterministic fixtures and provider-call counters,
  never a real Image2 request or an aesthetic-quality assertion.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `node-specification`: classify legacy/current protocol facts and own adoption transaction state,
  confirmation, CAS, and recovery semantics.
- `run-bundle-management`: reserve and publish a clean adoption target without copying legacy
  production authority.
- `run-bundle-layout`: declare the closed adoption scratch, observation, plan, and target-intake
  ownership boundaries.
- `slide-identity-and-ordering`: preserve explicitly retained stable identities and require an
  authored per-slide adoption matrix.
- `cli-surface`: expose receipt-bound observe/preview/confirm/apply/recovery forms and fence ordinary
  legacy production commands.
- `workflow-inspection`: project the exact adoption-required action without substituting legacy or
  Page Authority evidence.
- `playbook-execution`: add the MD-controlled adoption intake, confirmation, and post-publication
  handoff while keeping semantic slide choices human-owned.
- `pipeline-orchestration`: route recognized legacy runs to adoption guidance and keep target
  Page Authority work receipt-bound after publication.
- `environment-check`: keep legacy Image2 profile checks diagnostic-only and never treat them as a
  production continuation or provider authorization.
- `header-lock`: retain the historical Stage 3 implementation behind the adoption fence rather than
  exposing it as a normal production route.
- `pptx-assembly`: reject historical whole-page final bytes as Page Authority assembly input.
- `image-generation`: define the target's empty/unreviewed raw provenance boundary and prove that
  adoption itself makes zero provider calls.
- `commands-reference`: document the bounded legacy-to-adoption route without advertising legacy
  production as a current path.

## Impact

This is framework repository maintenance. It changes the state/CLI/controller protocol around existing
legacy run bundles and introduces no automatic deck conversion, provider transport, or new rendering
authority. The observer and transaction reuse the existing run-bundle/versioning owners; generated
trees remain rebuildable and target-local. The human-centered-gates policy governs the one explicit
target-intake confirmation, agent-assistance-and-control keeps observer/transaction ownership direct,
and simple-reliable-control requires one prerequisite-first recovery action rather than fallback
routing.
