## MODIFIED Requirements

### Requirement: HTML-first source produces one validated structured slide plan
The opt-in `production.pipeline: html-first-v1` source branch SHALL require a valid UTF-8 source file with no NUL byte and exactly one structured body inside every slide block. `source_sha256` SHALL hash the exact source file bytes. The exact field grammar SHALL be an unindented `**SLIDE BODY**:` line immediately followed by an unindented ```` ```yaml ```` opener, YAML content, and an unindented ```` ``` ```` closer; the label/opener/closer lines are case-sensitive and contain no leading or trailing whitespace. Blank lines, prose, another info string, an indented fence, or more than one such field SHALL not be guessed as the owned body. Each YAML root SHALL be a mapping containing `schema_version: 1`, one registered `family`, that family's root fields, optional `callout`, and only the visual fields permitted by that family. It SHALL NOT repeat slide ID, position, Markdown header fields, concept, or notes. `KICKER`, `TITLE`, optional `SUBTITLE`, `CONCEPT`, and speaker notes SHALL remain owned by the surrounding Markdown slide block. The structured fence SHALL be the sole parsed authority for visible body/callout values; literal repetition in surrounding human prose is preserved but does not become a second contract input. Unsupported schema versions, missing/duplicate bodies, unknown fields, or conflicting whole-page controls SHALL fail before a plan is published.

#### Scenario: Every structured slide parses
- **WHEN** a source declares `production.pipeline: html-first-v1` and every slide contains exactly one valid `SLIDE BODY` fence
- **THEN** parsing emits one versioned structured plan containing stable IDs, current positions, header/body content, family records, and source locators
- **AND** no browser, Image2 provider, or PPTX stage is invoked

#### Scenario: Missing one slide body fails the source
- **WHEN** one HTML-first slide omits its `SLIDE BODY` fence or contains two fences
- **THEN** parsing fails with that slide ID and fence location evidence
- **AND** no partial plan is published

#### Scenario: Whole-page source remains outside the HTML branch
- **WHEN** a source declares `production.pipeline: whole-page-image2-v1`
- **THEN** the current whole-page Stage-1 contract remains selected
- **AND** HTML-first fields are not inferred from prompt prose

#### Scenario: Near-miss body syntax is not inferred
- **WHEN** an HTML-first slide uses `SLIDE BODY` prose, a `json` fence, an indented fence, or a blank line between the field label and YAML opener
- **THEN** validation reports the missing exact body grammar for that slide
- **AND** it does not scan another code block and reinterpret it as source truth

The following is a normative minimal `split: text-visual` source example (the referenced SVG ID must exist in a valid v2 catalog):

````markdown
**SLIDE BODY**:
```yaml
schema_version: 1
family: split
mode: text-visual
text:
  heading: Why now
  bullets:
    - Cost crossed the adoption threshold
    - Quality crossed the trust threshold
primary_visual:
  placement: right
  brief: A text-free layered system becoming simpler from left to right
  fit: cover
  focal_point:
    - 0.5
    - 0.5
  fallback:
    kind: icon-composition
    asset_ids:
      - system-layers
  selection: null
```
````

## REMOVED Requirements

### Requirement: Migration candidate inputs are a closed receipt-bound overlay
**Reason**: The projected HTML candidate, its scratch root, migration receipt arrays, and source-to-HTML conversion path are retired.

**Migration**: Use the state-owned production-mode transition with current directional candidate contracts. The HTML contract accepts only canonical `html-first-v1` input.

## ADDED Requirements

### Requirement: HTML and whole-page source contracts are disjoint
The HTML contract SHALL accept only a canonical `html-first-v1` source and SHALL not validate, project, or convert a `whole-page-image2-v1` source into structured HTML inputs. A current whole-page source SHALL remain owned by its explicit whole-page plan/prompt contract; the HTML contract SHALL not provide a scratch overlay, fallback marker reader, or publication context for it.

#### Scenario: Whole-page source reaches the HTML contract
- **WHEN** a source declares `production.pipeline: whole-page-image2-v1`
- **THEN** the HTML contract rejects it before structured-plan or renderer-context creation
- **AND** it names the whole-page contract as the owning route
