## MODIFIED Requirements

### Requirement: Style Master readiness accepts only exact current evidence

The `style_master_exists` Controller prerequisite SHALL inspect only the
layout-resolved optional `style_master.png` local source for the selected run
scope. Its file presence is not a media or selection verdict: the Style Master
owner's existing candidate evaluator owns PNG-byte validation and recovery. A
retired `style_master.jpg` file SHALL not satisfy the prerequisite or become a
fallback source.

The `style_master_accepted` Controller prerequisite SHALL consult only the
current Style Master acceptance for the exact Page Image Workflow version,
workflow, source/visual scope, selected bytes, and `image/png` candidate media
type. A `style_master.png` local source, a retired `style_master.jpg` file,
task card, undeclared or mismatched acceptance evidence, historical JPEG
selection, or sibling workflow selection SHALL not satisfy the condition. Both
Booleans remain read-only; the Style Master owner supplies its detailed source
refresh or replacement-selection action.

#### Scenario: State observes only the canonical PNG local-source path

- **WHEN** a selected run scope contains a layout-resolved `style_master.png`
  source
- **THEN** `style_master_exists` reflects that PNG path's presence without
  treating it as valid media or an accepted selection
- **AND** a legacy `style_master.jpg` is not adopted as a fallback or a State
  mutation

#### Scenario: Foreign style evidence does not pass current readiness

- **WHEN** an otherwise current Framed version has only an undeclared Style
  Master selection, a `style_master.png` or `style_master.jpg` file, or an
  immutable JPEG selection from before the PNG-current contract
- **THEN** `style_master_accepted` is false and inspection points to the
  current Style Master owner
- **AND** State preserves the historical record and does not seed a replacement
  acceptance record
