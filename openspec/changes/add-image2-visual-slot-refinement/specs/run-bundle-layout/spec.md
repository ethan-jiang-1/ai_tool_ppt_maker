## ADDED Requirements

### Requirement: Modern refinement uses lazy source and derived partitions

Accepted style-reference and visual-slot assets SHALL live in version `overrides/visual-style/assets/refined/image2/`; candidates, comparisons, attempts, and cleanup evidence SHALL live only under `_generated/image2_refinement/`, with temporary work under `_scratch/image2_refinement/`. Their absence is conformant and rejected/generated history SHALL not enter upstream material.

#### Scenario: Fresh HTML-only deck is checked
- **WHEN** bundle validation runs before refinement
- **THEN** absent refinement paths pass validation
