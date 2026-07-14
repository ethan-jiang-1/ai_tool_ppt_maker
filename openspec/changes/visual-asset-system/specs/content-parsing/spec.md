## ADDED Requirements

### Requirement: Stage 1 parses VISUAL ASSETS field

Stage 1 SHALL extract the `**VISUAL ASSETS**` field from each slide block, split the value on commas, trim whitespace, and validate each resulting asset ID against the asset manifest when one is provided. Valid IDs SHALL be populated as `assets` in the `slide_plan.json` record and as `asset_ids` in the `_prompts.json` record. The image prompt text SHALL NOT be modified — assets are passed as reference images at the API level, not injected into the prompt. An asset manifest SHALL be an optional input; when absent, `**VISUAL ASSETS**` parsing SHALL be skipped entirely.

#### Scenario: VISUAL ASSETS field populates slide plan and prompts

- **WHEN** a slide contains `**VISUAL ASSETS**: ai_arch, pipeline`
- **AND** both IDs exist in the asset manifest
- **THEN** the `slide_plan.json` record includes `"assets": ["ai_arch", "pipeline"]`
- **AND** the `_prompts.json` record includes `"asset_ids": ["ai_arch", "pipeline"]`

#### Scenario: Unknown asset ID produces WARNING

- **WHEN** a slide references an asset ID not in the asset manifest
- **THEN** Stage 1 emits a WARNING naming the slide ID and the unknown asset ID
- **AND** the unknown ID is excluded from the output records
- **AND** processing continues (does not block the pipeline)

#### Scenario: No VISUAL ASSETS field is valid

- **WHEN** a slide has no `**VISUAL ASSETS**` field
- **THEN** no `assets` key appears in the `slide_plan.json` record
- **AND** no `asset_ids` key appears in the `_prompts.json` record
- **AND** behavior is identical to before this feature existed

#### Scenario: No asset manifest provided skips parsing

- **WHEN** `parseSlides()` is called without an `assetManifest` parameter
- **AND** a slide contains `**VISUAL ASSETS**: some_id`
- **THEN** no `assets` or `asset_ids` fields are populated
- **AND** no warnings are emitted for the asset reference

### Requirement: VISUAL ASSETS validation integrates with validateSpecRecords

`validateSpecRecords()` SHALL accept an optional `assetManifest` parameter. When provided and a slide references unknown asset IDs, it SHALL produce WARNING severity validation records naming the slide, the unknown ID, and the source file path. These WARNING records SHALL NOT cause pipeline failure (only ERROR severity blocks the gate). The convenience wrapper `validateSpecs()` SHALL also accept and forward the optional `assetManifest` parameter to `validateSpecRecords()`.

#### Scenario: Unknown asset in validateSpecRecords yields WARNING record

- **WHEN** `validateSpecRecords([file], manifest)` is called with a slide referencing an unregistered asset ID
- **THEN** a WARNING severity record is produced naming the slide and unknown ID
- **AND** the record includes the source file path
- **AND** the record's `field` is `"VISUAL ASSETS"` and `reason` is `"unknown_asset_reference"`

#### Scenario: validateSpecs forwards assetManifest to validateSpecRecords

- **WHEN** `validateSpecs([file], manifest)` is called with a slide referencing an unregistered asset ID
- **THEN** the returned array includes a WARNING string about the unknown asset
- **AND** the WARNING does not cause a non-zero exit
