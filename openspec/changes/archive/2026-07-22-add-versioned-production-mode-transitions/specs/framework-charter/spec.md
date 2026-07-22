## ADDED Requirements

### Requirement: Cross-pipeline mode changes are versioned and HTML-quality-scoped

Active framework guidance SHALL describe `html-* <-> image2-only` as a clean versioned transition, not
an in-place production-mode write or a permanent refusal.  It SHALL preserve the version-scoped mode
SSOT, source-marker contract, source-version history, target-only evidence, provider authorization, and
human confirmation boundary.  Guidance SHALL identify `migrate-import` as the controller owner and the
state owner as the deterministic confirmation/registration/recovery owner.

The transition's HTML target scope SHALL be limited to the existing valid, runnable HTML contract and
its existing human delivery process.  Active guidance SHALL NOT claim that this change improves, scores,
compares, or guarantees HTML visual quality, visual parity, premium layout, or an HTML style-master.
Image2-primary quality, provenance, authorization, and final-review requirements remain unchanged.

#### Scenario: Guidance explains an HTML target

- **WHEN** active documentation describes an Image2-to-HTML transition
- **THEN** it presents a safe clean-vNext path and existing HTML contract without adding an HTML quality claim

#### Scenario: Guidance explains an Image2 target

- **WHEN** active documentation describes an HTML-to-Image2 transition
- **THEN** it preserves the normal Image2 pilot/review/authorization boundary after target publication
