## MODIFIED Requirements

### Requirement: Image production exposes one Page Authority adapter

Image Production SHALL expose the bounded CURRENT v1 page-authority-image2
adapter only for an exact v1 pair. Its implementation and mutation interface
SHALL live beneath
PPTMAKER_FRAMEWORK/scripts/compatibility/current-v1-page-authority/. The v1
adapter may persist a v1 receipt only through its sanctioned exact-v1 mutation
operations; a TARGET adapter, shared observer, status/controller projection,
or generic new-authoring caller SHALL NOT import or invoke that mutation
surface.

For TARGET, Image Production SHALL expose the selected 03-framed-image or
04-pure-image workflow adapter through marker-first resolution, followed by
the shared 05-delivery interface. Retired adapters shall not be exported,
registered, or imported by an active production caller. The compatibility
adapter is an existing-run-only route and SHALL NOT be advertised as a target
method module, generic fallback, or fresh-init choice.

#### Scenario: Production adapter inventory is inspected

- **WHEN** a current production caller presents an exact v1 or v2 source/state pair
- **THEN** it resolves only the adapter or workflow owner declared for that pair
- **AND** it does not select a retired adapter, generic fallback, or conflicting sibling

#### Scenario: Target observation cannot invoke the compatibility writer

- **WHEN** a selected target Framed or Pure run is inspected or rendered as a
  controller/status projection
- **THEN** it resolves direct target facts without importing or invoking the
  CURRENT v1 adapter mutation interface
- **AND** it does not write a CURRENT v1 source receipt
