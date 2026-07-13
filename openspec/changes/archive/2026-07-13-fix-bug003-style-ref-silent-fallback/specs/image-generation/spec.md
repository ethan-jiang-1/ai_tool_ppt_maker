## ADDED Requirements

### Requirement: generateOneImage logs when no style reference is provided

`generateOneImage` SHALL log an informational message when `styleReferencePath` is falsy, before the vendor loop begins. The message SHALL indicate that generation is proceeding without visual style anchoring. This makes the absence of a style reference visible to callers — both production pipelines and scratch experiments — without treating it as an error or warning.

When `styleReferencePath` is provided and valid, no additional log SHALL be emitted (the existing behavior is unchanged).

#### Scenario: No style reference logs informational message

- **WHEN** `generateOneImage` is called without a `styleReferencePath` (the parameter is falsy: null, undefined, or empty string)
- **THEN** output includes the line `"No style reference — generating without visual style anchoring"`
- **AND** the log appears once per call, before vendor-specific output

#### Scenario: Style reference provided does not log extra message

- **WHEN** `generateOneImage` is called with a valid `styleReferencePath`
- **THEN** no "no style reference" message is logged
- **AND** existing behavior (attaching the ref as base64 data URL) is unchanged
