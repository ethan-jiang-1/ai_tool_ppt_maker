## Why

Framed pages rely on a transparent deterministic header overlay, but the
current provider request expresses its reserved header area as underspecified
prompt data and drops source `subject_restrictions` before compilation. This
allows provider text and key subjects to collide with the local header while
leaving the provider promise stronger than the evidence supports.

C1-C5 now provide the declared current contracts, a per-page resolved layout,
and provider-free request inspection. C6 can therefore harden the deterministic
Framed contract without treating prompt compliance as a provider guarantee or
creating a second review decision.

## What Changes

- Replace the current variable-length Framed `protected_geometry` profile
  field with one CSS-pixel `header_region` that contains the profile's permitted
  local header fields. The resolver derives the sole normalized
  `protected_composition`: its `reserved_header` is that region in one declared
  normalized canvas space and its `body_safe` region is the full-width canvas
  area below the reserved header. It remains provider-facing guidance and a
  review guide, not source-authored coordinates, an opaque local panel, or a
  native-provider guarantee.
- Carry the source-owned closed `subject_restrictions` facts through Page Image
  Core into the immutable Framed raw contract and exact provider request.
- Compile the Framed request from these bindings with an honest bounded
  best-effort instruction: readable provider body text and key subjects must
  use the body-safe region, and no local-header field or header-derived context
  is serialized for the provider. Independently source-owned provider content
  may retain its own literal even when its spelling matches a local header.
  Changes to any of these bindings require raw rebuild and
  a new Complete Page Review.
- Preserve the existing full-canvas provider page, transparent local header,
  exact transport bytes, Task-Mandate lifecycle, and single human Complete Page
  Review `proceed | repair` decision. No C6-specific approval, retry, state,
  or recovery controller is introduced.
- Add deterministic contract and invalidation coverage. C6 introduces no
  provider-free occupancy diagnostic or OCR dependency: the composition guides
  are evidence for the existing human Complete Page Review, not an automated
  acceptance gate.
- Record a bounded synthetic provider probe as an explicit external Work
  Request prerequisite. A native region/mask transport extension is out of
  this change unless that work request produces a verified provider contract
  and a follow-up change specifies the extension.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `content-parsing`: keep the fixed Framed header literals local-renderer
  facts rather than deriving a provider-visible exact-literal context.
- `image-generation`: bind normalized protected composition and subject
  restrictions into the Framed raw contract and exact request; preserve the
  existing review decision while making the provider promise explicitly bounded
  and raw-rebuild-sensitive.
- `pipeline-orchestration`: classify protected-composition and
  subject-restriction drift through the existing raw-rebuild path without
  adding a gate, approval, or alternate recovery route.
- `production-schema-conformance`: declare the C6 Framed composition and
  local-only header boundary in the schema definitions and opt-in static
  conformance coverage without introducing a runtime controller.
- `visual-config`: expose the selected Framed profile's normalized protected
  composition and body-safe facts as workflow-isolated resolver output, while
  cleanly retiring the ambiguous variable-length protected-geometry field.

## Impact

- **Harness source:** Framed adapter and its shared compilation seam, Page
  Image Core, profile resolver/configuration, current schemas, the existing
  invalidation route, and the current `BOOTSTRAP.md` workflow guidance. The
  header-contract clean cutover also reaches the Framed overlay/raw-contract
  validators and the architecture guard that inventories prompt assembly.
- **Schema terminology:** the schema README and the `layout-config`,
  `page-layout`, and `image2-request` stage definitions will define
  `header_region` and `protected_composition` as current Framed terms; the
  former `protected_geometry` shape has no current alias or reader.
- **Tests:** focused parser/Core/Framed/raw-review coverage, clean-cutover
  coverage for every direct current header reader/writer and shared fixture,
  schema/conformance assertions, and the existing mock-provider path.
  Production provider calls are not part of automated tests.
- **Control ownership:** JS owns validation, canonical compilation, digests,
  diagnostics, and deterministic tests; the MD Controller retains intent and
  route selection; a human retains the one Complete Page Review decision and
  must explicitly request any paid synthetic probe. This follows
  `openspec/policies/human-centered-gates.md`,
  `openspec/policies/agent-assistance-and-control.md`, and
  `openspec/policies/simple-reliable-control.md`.
- **Run-bundle contract:** migration. C6 deliberately provides no automatic
  reader, converter, or production-bundle migration: a selected older bundle
  can enter the current contract only after its owned source/configuration is
  explicitly repaired and provider-free planning is regenerated. Existing
  production bundles are neither read nor rewritten by this change; an explicit
  synthetic run is required for a paid probe, and v3 repair remains C7 work.
