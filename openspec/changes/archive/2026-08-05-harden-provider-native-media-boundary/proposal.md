## Why

BUG-053 and BUG-054 expose the same boundary defect in two consumers of Image2 provider media. The framework validates a provider PNG with `fast-png`, but Style Master promotion later delegates the same bytes to a stricter canvas decoder, while page raw rejects otherwise valid provider-native PNGs solely because their dimensions differ from a historical native-size assumption.

Provider output must remain immutable, CRC-verified evidence with recorded native dimensions. It must not need to conform to a local request hint or to a particular decoder's tolerance for private PNG chunks before it can progress through its owning pipeline.

## What Changes

- Define one provider-native PNG acceptance model for Page Authority: non-empty, CRC-valid PNG bytes with positive decoded dimensions are accepted unchanged, and their actual dimensions remain bound to provenance and downstream evidence.
- Update page raw planning, progressive materialization, Pure final publication, Framed composition, and delivery assembly to consume the accepted provider-native dimensions rather than a fixed `2048x1136` result contract. The `2000x1125` transport request remains a request parameter, not received-media evidence.
- Make Style Master compatibility JPEG projection decode validated PNG pixels through the existing `fast-png` path before encoding, so private ancillary chunks such as `caBX` cannot make an already accepted candidate unreplayable.
- Preserve fail-closed handling for empty, malformed, CRC-invalid, or non-positive PNG media, existing authorization and attempt lifecycles, byte identity for Pure final output, and secret-safe bounded diagnostics.
- Add fixtures and focused regressions for private-chunk Style Master candidates and non-default valid provider-native page raw sizes across acceptance, provenance, finalization, and delivery.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `style-master-generation`: accepted generated PNG candidates must remain promotable to their derived JPEG compatibility projection when they contain valid provider-private ancillary chunks.
- `image-generation`: page raw provider media acceptance changes from one fixed native size to CRC-valid PNG media with positive native dimensions, retained as evidence without transformation.
- `image-production`: workflow finalization and delivery-facing media validation must preserve and consume the actual accepted provider-native dimensions while retaining Pure byte identity.
- `cli-surface`: successful non-default native media must follow the existing success path rather than emit a wrong-size known-failure diagnostic; invalid media remains on the existing bounded failure surface.

## Impact

- **Framework source:** `PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_media_contract.mjs`, target runtime and progressive raw owner, Style Master plan promotion, Framed/Pure finalization, and delivery/PPTX media validation.
- **Tests:** focused shared Image2, workflow, CLI diagnostic, and delivery/PPTX coverage; no production deck is a fixture or migration target.
- **Control owner:** JS owns deterministic media parsing, provenance, and derived projection. Existing MD-to-JS handoffs, human visual review confirms, and provider authorization remain unchanged.
- **Run-bundle contract:** compatible. Existing valid raw bytes and receipts retain their meaning; the change writes no migration and does not modify `deck_*` data.
- **Dependencies/API:** uses the existing `fast-png` and canvas dependencies; no new runtime dependency or CLI command is introduced.

This change follows `openspec/policies/human-centered-gates.md`: malformed/CRC-invalid/non-positive media remains a hard-stop because byte integrity and attributable provenance are protected; a successful local derived JPEG replay remains a guide with no human risk acceptance; visual review remains the existing confirm boundary. Per `agent-assistance-and-control.md`, the direct authority is the selected adapter's single media inspection result, and the Agent's mechanical action is to rerun the existing owner checkpoint only when its current diagnostic permits it. Per `simple-reliable-control.md`, the change consolidates validation around one decoded-media fact and avoids a preflight, retry route, fallback provider, new state record, or duplicate size validator; focused tests prove accepted media is not blocked and invalid media cannot materialize evidence.
