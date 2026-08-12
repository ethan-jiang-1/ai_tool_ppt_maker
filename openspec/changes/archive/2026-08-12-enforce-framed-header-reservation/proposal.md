## Why

The current Framed provider input names a `reserved_header` and a `body_safe`
region, but its instruction only asks the provider to place source-owned body
content in the latter. In production reconstruction, the provider repeatedly
introduced its own header-like typography inside the reserved region. The local
Framed kicker, title, and subtitle then overlaid that typography, making all
three pages unusable despite a valid plan, profile, receipt chain, and review
surface.

This is a Harness contract gap, not a deck-authoring error and not a reason to
continue buying the same request. Framed must tell the provider that the header
region has exclusive local-renderer ownership, while retaining the existing
human Complete Page Review as the final judgment of remote raster output.

## What Changes

- Strengthen the canonical Framed compiled provider instruction so that:
  - the normalized `reserved_header` is exclusively reserved for the
    deterministic local kicker/title/subtitle overlay;
  - provider-generated typography, labels, body content, and key visual
    subjects are prohibited from that region; and
  - all provider-owned readable content and focal material are placed in the
    existing normalized `body_safe` region.
- Make the exact exclusive-reservation clauses an adapter-owned compiled-input
  invariant, covered by focused regression tests. A missing, weakened, or
  cross-workflow clause fails during provider-free Framed planning before a
  request, grant, or provider attempt is created.
- Clarify the existing Complete Page Review criterion: a provider page that
  encroaches on the reserved header is not eligible for `proceed`; the single
  existing `repair` route remains the recovery path.
- Preserve the current full-canvas Framed image model, source-owned body
  literals, transparent local header overlay, provider transport, raw lifecycle,
  and one human review decision. Do not add OCR, native masks, a new quality
  gate, another approval record, or an automated remote-output acceptance claim.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `image-generation`: Framed compiled provider inputs and the existing Complete
  Page Review gain an explicit exclusive-header reservation contract and
  rejection criterion for header encroachment.

## Impact

- **Harness source:** Framed provider-input compilation and its direct contract
  validation under `ppt_maker_harness/scripts/03-framed-image/`, plus the
  declared `image2-request` schema wording where it describes the Framed
  composition boundary.
- **Tests:** focused Framed request/contract and Complete Page Review regression
  coverage under `tests/`; no production `deck_*` directory becomes a fixture.
- **OpenSpec:** an `image-generation` delta spec and the corresponding main-spec
  sync after implementation.
- **Control ownership:** JS owns compilation, invariant checks, and evidence
  binding; the existing Complete Page Review remains the human `confirm` point.
  This follows `openspec/policies/human-centered-gates.md`: malformed local
  contract facts remain existing integrity hard-stops, while visible remote
  layout quality remains one repair-or-proceed decision. Under
  `openspec/policies/agent-assistance-and-control.md`, normal in-scope repair
  and provider work remain Agent/Harness work under the Task Mandate rather than
  repeated human permission prompts.
- **Control simplicity:** per `openspec/policies/simple-reliable-control.md`,
  this reuses the existing direct compiled-input evaluator and Complete Page
  Review. It adds no new state, validator chain, retry mode, fallback, or user
  step; the one repair loop remains `repair -> rebuild -> review`.
- **Run-bundle contract impact:** compatible. Existing run bundles and retained
  evidence are not rewritten or migrated. A later current Framed rebuild emits
  a new request lineage through the normal owner path.
