## MODIFIED Requirements

### Requirement: Stage 4 builds PPTX container

Stage 4 SHALL assemble final PNG images into a 16:9 `.pptx` file using `pptxgenjs`, with one full-bleed image on each blank-layout slide. It SHALL iterate `slide_plan.json` in current array/position order and resolve exactly one current `final-slide` artifact for each formal slide ID and selected render engine through the Stage 3 manifest. It SHALL require `verified` status and verify the resolved image bytes against the manifest. A compatibility adapter MAY report a legacy file as `legacy-located`, but Stage 4 SHALL require Stage 3 to establish a current manifest entry before assembly. It SHALL NOT derive identity or order from directory glob order or filename position prefixes.

After successful atomic PPTX publication, Stage 4 SHALL atomically write `_generated/qa/pptx_assembly.json`. The assembly receipt SHALL bind a schema version, slide-plan SHA-256, ordered formal slide IDs, each resolved final-image path and SHA-256, output PPTX run-dir-relative path and SHA-256, and an ISO timestamp. Failure or ambiguity SHALL NOT publish a current success receipt.

#### Scenario: Build PPTX from manifest-resolved images

- **WHEN** `slide_plan.json` has N ordered IDs and the Stage 3 manifest resolves one verified selected-engine `final-slide` PNG for every ID
- **THEN** the output PPTX has N slides, each a 16:9 full-frame image
- **AND** slide order exactly matches the plan rather than directory or filename order
- **AND** a current assembly receipt records those N ordered IDs and image hashes

#### Scenario: Build PPTX from header_locked images

- **WHEN** `header_locked/` contains N PNG images and `slide_plan.json` has N slides
- **THEN** output .pptx has N slides, each a 16:9 full-frame image
- **AND** slide order matches `slide_plan.json` sequence

#### Scenario: Missing, unverified, or ambiguous final image fails

- **WHEN** a planned ID has no verified final artifact, has only a `legacy-located` candidate, or resolves to more than one unsupported candidate
- **THEN** Stage 4 fails and names the affected formal ID
- **AND** directs local Stage 3 repair when raw prerequisites are current
- **AND** does not assemble from the lexicographically first file or publish a current receipt

#### Scenario: Reordered plan produces reordered assembly

- **WHEN** all final-image bytes are reused but the current plan order changes
- **THEN** Stage 4 rebuilds the PPTX in the new order
- **AND** its receipt records the new ordered ID list with the unchanged per-ID image hashes
