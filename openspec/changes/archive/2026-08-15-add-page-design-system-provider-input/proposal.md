## Why

The current Page Image Workflow deliberately compiles a closed, structured
provider request. That protects source authority and exact-byte lineage, but
it has no deck-owned place for the rich shared design guidance that governs
type, CJK legibility, text-to-image balance, colour, exclusions, and tone.
Consequently, a deck cannot apply one authored design system consistently to
both Pure and Framed provider pages without abusing slide content or changing
the Harness for that individual deck.

This is a reusable Harness gap, not a `deck_ai_sdlc_keynote/v8` exception.
The Harness needs one confined, optional, deck-level prose source that binds
the same exact text into every current Pure and Framed provider request while
retaining the existing workflow-specific boundaries, lifecycle evidence, and
human Complete Page Review.

## What Changes

- Reserve `page-design-system.md` as an optional deck-owned Page Image source
  at the backbone path and matching version override path. It is opaque UTF-8
  prose with explicit override-first, empty-value, confinement, validation,
  and size-limit semantics; it is not a slide source, visual-language entry,
  provider result, lifecycle record, or Style Master replacement.
- Resolve that source once into an immutable local
  `{ schema: "page-image-design-system-binding", text, sha256 }` binding,
  declared through a dedicated `layout-config` wire-schema entry;
  project only its text/digest facts into Page Image Core, raw contracts,
  normal and progressive raw plans, invalidation, and derived request
  inspection, and preserve accepted historical evidence unchanged.
- Add an exact top-level `design_system: string | null` field to both Pure and
  Framed canonical provider inputs. The field carries text only: never a path,
  digest, source origin, or lifecycle fact. Pure retains its whole-page
  contract; Framed retains its existing exact exclusive-header-reservation
  instruction and local-header ownership.
- Make source drift or compiler cutover invalidate current raw work before
  authorization or provider initialization, using the existing Generated Image
  Rebuild path. A narrowly recognized former progressive head remains readable
  only for immutable-lineage validation, exact unresolved-attempt reconciliation,
  and successor-head advancement; it cannot authorize, submit, review, or reuse
  former provider work. The runtime transports adapter-bound bytes and does not
  reread or rebuild design-system text.
- Route declared Page Design System source failures and the new canonical-input
  size failure through the existing direct `image2` diagnostic envelope as
  bounded source/configuration repair. Command forms, routing, envelope schema,
  and consumer control flow remain unchanged; raw prose and digest facts remain
  excluded from CLI output.
- Declare the new source, derived bindings, adapter symmetry, and
  provider-facing exclusions in the layout and serialization contracts; seed
  only an optional zero-byte source file for discoverability, never deck- or
  provider-specific example prose.
- Add source-resolver, adapter/validator, stale-plan, exact-transport,
  invalidation, layout, and architecture coverage using synthetic temporary
  bundles. No production deck is a test fixture.
- **BREAKING (derived exact-byte contract):** a freshly compiled provider
  request gains `design_system` and the complete canonical input gains a
  32,768-byte UTF-8 validity bound. Prior current plans cannot authorize or
  submit under the new compiler, and a formerly compilable oversized input
  must be repaired at its source/configuration owner before replanning.
  Retained immutable lifecycle plans, grants, attempts, reviews, media, and
  delivery records remain historical evidence. The stale adapter plan file is
  a rebuildable current projection: it is never field-patched and becomes
  current again only when its owner publishes a fresh plan through the existing
  planning and authorization workflow. If the progressive current head names an
  exact former-binding plan, any persisted submitted attempt keeps the existing
  reconciliation precedence; otherwise the owner advances the head to the fresh
  current plan without treating former media or review as reusable.

The source-validation failures are `hard-stop`s under
`openspec/policies/human-centered-gates.md`: they protect confined attributable
source bytes, exact digest binding, and recoverable raw-plan identity. The
nearest legal recovery is to repair the source through its owner and rerun the
same provider-free planning checkpoint; there is no waiver or fallback to an
older source. Per `openspec/policies/agent-assistance-and-control.md` and
`openspec/policies/simple-reliable-control.md`, resolution, invalidation, and
submit reuse the existing direct ownership path instead of adding a controller
branch, persistent control state, retry, human confirmation, or parallel
prompt authority.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `image-generation`: bind one optional shared page design-system source into
  current Pure and Framed raw contracts, canonical inputs, exact plans,
  inspection, invalidation, and byte-preserving provider transport.
- `visual-config`: admit one explicitly bounded deck-level opaque prose source
  alongside, but distinct from, the closed visual-language registry and the
  Pure-only deck visual-system package.
- `run-bundle-layout`: reserve and validate the backbone and version-override
  source locations, including their structure and source/derived ownership.
- `run-bundle-management`: define optional zero-byte seeding without emitting
  deck-specific prompt content or lifecycle evidence.
- `production-schema-conformance`: declare and statically guard the local
  resolver binding, shared nullable digest binding, and provider-facing
  `design_system` field across the current derived request chain.
- `cli-surface`: classify the new source-owned and compiler-size failures at the
  existing direct `image2` producer boundary without adding a command, action
  vocabulary, envelope field, or consumer-owned recovery route.

## Impact

- **Harness source:** expected owners are
  `scripts/shared/run-bundle/bundle_layout.mjs`, a new
  `scripts/02-visual-system/internal/page_design_system.mjs`, Page Image Core,
  both adapters, the Framed exact-input validator, raw-plan/progressive
  schemas, the progressive store/owner cutover boundary, invalidation, target
  runtime, and the existing direct `image2` diagnostic classifier. Public CLI
  commands/routing and the diagnostic envelope schema, provider transport
  envelope, MD Controller order, State
  workflow identity, and external provider API remain unchanged.
- **OpenSpec and schemas:** this change supplies delta specifications for the
  six existing capabilities above and updates the current source/serialization
  declarations only after implementation is accepted through the normal sync
  and archive workflow.
- **Tests:** focused tests belong under `tests/02-visual-system/`,
  `tests/03-framed-image/`, `tests/04-pure-image/`, `tests/shared/cli/`, and
  contract/invalidation coverage. No live-provider call is necessary to prove
  the local contract; Complete Page Review remains the visual acceptance
  authority.
- **Run-bundle contract impact:** `compatible` for source discovery (missing
  or blank files bind `null`), and `migration` impact only in the compatibility-
  classification sense that a retained current raw-plan projection and an exact
  former progressive head must cross the compiler cutover before new work. The
  former progressive plan is admitted only to preserve reconciliation and head
  lineage; no stored record is converted or field-patched and no former plan is
  admitted as a current provider-work plan.
  Production `deck_*` directories, including
  `deck_ai_sdlc_keynote/3_versions/v8`, are not modified, migrated, or used as
  test fixtures.
- **Dependencies and runtime:** no new dependency, outer provider
  transport-envelope field, retry path, or external runtime. The only
  provider-visible addition is the adapter-owned top-level `design_system`
  text/null field inside existing canonical request bytes; the 32,768-byte
  check is a local provider-free compiler constraint.
