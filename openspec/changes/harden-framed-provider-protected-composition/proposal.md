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

- Define one Framed protected-composition binding derived from the resolved
  Framed profile: normalized reserved-header geometry, explicit canvas
  semantics, and a body-safe region. It remains provider-facing guidance and a
  review guide, not source-authored coordinates, an opaque local panel, or a
  native-provider guarantee.
- Carry the source-owned closed `subject_restrictions` facts through Page Image
  Core into the immutable Framed raw contract and exact provider request.
- Compile the Framed request from these bindings with an honest bounded
  best-effort instruction: readable provider body text and key subjects must
  use the body-safe region, and exact local header literals are not serialized
  as provider context. Changes to any of these bindings require raw rebuild and
  a new Complete Page Review.
- Preserve the existing full-canvas provider page, transparent local header,
  exact transport bytes, Task-Mandate lifecycle, and single human Complete Page
  Review `proceed | repair` decision. No C6-specific approval, retry, state,
  or recovery controller is introduced.
- Add deterministic contract and invalidation coverage. Any optional
  provider-free occupancy diagnostic remains advisory and must have a defined
  false-positive policy; OCR does not become a production dependency or an
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
  composition and body-safe facts as workflow-isolated resolver output.

## Impact

- **Harness source:** Framed adapter and its shared compilation seam, Page
  Image Core, profile resolver/configuration, current schemas, the existing
  invalidation route, and the current `BOOTSTRAP.md` workflow guidance. The
  header-contract clean cutover also reaches the Framed overlay/raw-contract
  validators and the architecture guard that inventories prompt assembly.
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
- **Run-bundle contract:** compatible provider-free contract change. Existing
  production bundles are neither read, migrated, nor rewritten; an explicit
  synthetic run is required for a paid probe, and v3 repair remains C7 work.
