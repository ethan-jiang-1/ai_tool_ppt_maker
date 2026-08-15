## MODIFIED Requirements

### Requirement: Active run-bundle tree guidance names the complete current visual source set

Active run-bundle tree guidance SHALL name the current Style Master iteration
history, current Style Master intent source, current Page Image visual-language
source, current `pure-deck-visual-system.yaml` source locations, and the
non-secret Image2 provider-profile source at
`2_backbone/visual-style/image2-provider-profile.yaml` with its version
override only at
`3_versions/vN/overrides/visual-style/image2-provider-profile.yaml`. The Style
Master intent, visual-language, and provider-profile sources remain distinct
from the Page Image presentation package; none is replaced by the Pure-only
source. The profile source supplies route-capability declaration only; it is
not `.env`, State, a receipt, plan, grant, attempt, review record, derived
inspection, or provider authorization. The tree remains a human-readable
snapshot; `bundle_layout.mjs` and this capability remain the current layout
authorities.

The layout whitelist and structure check SHALL recognize the provider profile
only at those canonical visual-style locations and preserve the existing
strict-root/loose-leaf gradient. Layout observation SHALL not validate a
capability, choose a version, resolve a profile, infer a provider, record a
lifecycle fact, or authorize provider work.

#### Scenario: Maintainer reads the Run Bundle tree

- **WHEN** a maintainer consults active Charter or reference tree guidance
- **THEN** it can locate current Style Master history, intent, visual-language,
  Pure visual-system, and provider-profile sources with their distinct roles
- **AND** it does not replace one current source with another or create a
  competing layout authority

#### Scenario: Provider profile source has only canonical locations

- **WHEN** a current Bundle contains a provider profile source or version
  override
- **THEN** layout validation recognizes it only at the declared backbone or
  matching override visual-style path
- **AND** it does not treat an environment value, derived file, lifecycle
  record, or invented source path as that profile

#### Scenario: Layout observation creates no provider authority

- **WHEN** a structure-only check observes the profile path or its absence
- **THEN** it reports only the filesystem-layout fact without selecting or
  confirming a capability profile
- **AND** it creates no plan, authorization, attempt, environment identity, or
  provider request
