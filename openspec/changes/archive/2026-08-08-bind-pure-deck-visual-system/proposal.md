## Why

Current Pure pages share a Style Master, visual-language selection, and generation profile, but
each complete-page provider request is still free to choose its typography hierarchy, colour
application, page zones, whitespace, and composition independently. The result can preserve a
mood without reading as one deck. The historical BUG-057 output is v2 and cannot be replayed as
current evidence, but the current Pure compiler confirms this missing cross-page contract.

## What Changes

- Add one version-resolved, deck-authored `pure-deck-visual-system-v1` source record under the
  existing visual-style ownership. Its closed, content-neutral contract locks the provider-facing
  type hierarchy, Style-Master-derived colour use, normalized title/content zones, whitespace
  rules, and allowed layout families for every Pure page. It contains no slide literals, claims,
  prompts, credentials, approval, or provider output.
- Give Visual Config one deep validator/renderer seam: it validates the exact selected record,
  produces an immutable canonical projection and digest, and rejects a missing, malformed, or
  unsupported Pure visual-system record before source receipt, Style Master readiness, raw-plan
  publication, or provider authorization. Framed receives neither this profile nor new geometry.
- Bind the same validated Pure visual-system digest and deterministic token projection into every
  current Pure Page Image Core slide, raw contract, compiled provider input, provider-input
  inspection projection, plan item binding, and raw invalidation path. A token change creates
  ordinary raw-rebuild debt for the exact current source; it never silently reuses accepted page
  evidence or turns a short display value into a selector.
- Extend new run-bundle scaffolding and layout validation with the canonical visual-system source
  location. Existing bundles are not silently adopted or rewritten: an old Pure scope lacking the
  required source record reaches the existing owner-issued source/configuration repair path.
- Repair the pre-replacement Pure invalidation test fixture before adding new behavior. Its
  `13/14` focused baseline failure comes from an invalid fixture receipt shape, not a provider or
  lifecycle regression.
- Preserve Pure's provider-owned full page. There is no local Text Frame/compositor, no new
  review decision, no automatic retry, and no provider-backed E2E. The existing exact Pilot
  authorization remains the only cost boundary; a later human visual acceptance samples three
  deliberately selected slides with distinct content/composition demands and checks hierarchy,
  colour discipline, zones, and whitespace across the set.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `visual-config`: resolve and validate the selected Pure deck visual-system source separately
  from visual-language and Framed local-header policy.
- `image-generation`: bind the validated Pure visual-system projection into current raw facts,
  compiled provider inputs, invalidation, inspection, and exact plan lineage without changing
  Pure complete-page ownership.
- `run-bundle-layout`: reserve and seed the deck-authored Pure visual-system source in the
  existing version-resolved visual-style tree without treating it as lifecycle state or a derived
  artifact.

## Impact

- **Harness source:** Visual Config parser/normalizer, Page Image Core and Pure adapter compilation,
  provider-input binding schema/inspection projection, run-bundle seeds/layout checks, and focused
  Pure tests. Style Master candidates remain selected visual reference authority; the new record
  only requires page colour use to derive from that selection, so it does not broaden Style Master
  scope or create candidate churn.
- **Control ownership:** the Human owns the deck-level visual-system content and visual judgment;
  the Agent can create and validate a complete source record and run existing provider-free checks;
  JS owns parsing, canonical projection, digest binding, raw invalidation, and the earliest failure.
  This adds no Controller route, durable State field, recovery branch, waiver, or separate gate.
- **Gate posture:** a malformed/missing profile is an existing-style `hard-stop` protecting source
  and plan identity, with one source/configuration repair-and-rerun action. Profile semantics are
  deterministic but provider pixel adherence remains human-reviewed, so the existing authorized
  Pilot/Complete Page Review remains the only `confirm` surface. No quality preference becomes an
  auto-acceptance check.
- **Run-bundle contract:** compatible for new scaffolds. Existing current Pure runs must supply the
  explicit source record; no deck is migrated, no historical evidence is adopted, and no
  `_generated/` artifact or provider bytes are changed by planning.
- **Policies:** follows `human-centered-gates` by retaining the existing provider-cost and review
  decisions, `agent-assistance-and-control` by reusing one Visual Config authority rather than a
  controller-side check, and `simple-reliable-control` by making one validated source projection
  the only new input to plan/invalidation/inspection instead of parallel state or quality checks.
