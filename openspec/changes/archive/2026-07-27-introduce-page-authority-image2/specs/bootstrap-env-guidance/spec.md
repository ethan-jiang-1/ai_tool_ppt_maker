## MODIFIED Requirements

### Requirement: BOOTSTRAP presents production mode before mode-specific readiness
After foundation repair, BOOTSTRAP SHALL identify `image2-page-authority` as the sole mode for a new
deck and direct the Agent to run `doctor --mode image2-page-authority` before `ppt_flow init`. It SHALL
explain that Framed is the source default with a deterministic local Text Frame over a text-free Image2
underlay, while Pure delegates every final pixel to Image2. BOOTSTRAP SHALL not present
`html-only`, `html-then-image2`, or `image2-only` as fresh-init choices; they remain guidance only when
an explicitly targeted existing run resolves to its legacy source/state pair.

The unbound doctor result SHALL be described as independent offline `framed-runtime` and `image2-raw`
readiness, not a combined source-ready claim. A later raw-generation operation still requires its exact
provider readiness and human authorization; init, doctor, or local Framed work does not grant it.

#### Scenario: Fresh user follows the only new-deck path

- **WHEN** foundation readiness passes and the user requests a new deck without selecting an existing run
- **THEN** BOOTSTRAP routes through unbound Page Authority doctor and Page Authority initialization with
  `framed-image2` as the source default
- **AND** it does not ask the user to select a historical production mode or authorize provider work

#### Scenario: Existing legacy run remains context-bounded

- **WHEN** a user explicitly targets an existing run whose exact source/state pair resolves to a legacy
  mode
- **THEN** BOOTSTRAP routes its readiness guidance through that run's existing mode policy
- **AND** it does not reuse the legacy policy as new-deck setup guidance

#### Scenario: New user accepts the default

- **WHEN** foundation is ready and the user does not target an existing run
- **THEN** BOOTSTRAP proceeds toward `init --mode image2-page-authority` after the unbound Page Authority doctor
- **AND** it discloses the later raw-submission authorization boundary

#### Scenario: User chooses local HTML

- **WHEN** the user explicitly targets an existing `html-only` source/state pair
- **THEN** BOOTSTRAP applies that run's local HTML readiness guidance without soliciting Image2 credentials
- **AND** it does not offer `html-only` as a fresh-init selection

#### Scenario: User chooses HTML then refinement

- **WHEN** the user explicitly targets an existing `html-then-image2` source/state pair
- **THEN** BOOTSTRAP preserves that run's HTML readiness and deferred Image2 authorization guidance
- **AND** it does not reuse that legacy choice for a new deck

### Requirement: Image2 first-time credential setup is self-contained in BOOTSTRAP
BOOTSTRAP SHALL provide Image2 presence setup when a Page Authority raw-generation operation is selected,
using its exact `image2-raw` readiness profile. It SHALL not solicit provider credentials for source
authoring, local Framed composition, assembly, notes, or delivery review. The guidance SHALL distinguish
offline presence from explicitly selected live diagnostics and from the separately human-authorized raw
submission.

#### Scenario: Framed local work needs no credentials

- **WHEN** a Page Authority user is authoring source or selecting `framed-local-refresh`
- **THEN** BOOTSTRAP gives the relevant local readiness guidance without requesting Image2 credentials
- **AND** it states that credentials and authorization are required only before a later raw submission

#### Scenario: Fresh user starts an Image2-primary deck
- **WHEN** a new Page Authority deck reaches an explicitly selected raw-generation operation
- **THEN** BOOTSTRAP provides offline credential presence setup before provider-backed raw work
- **AND** it does not perform a live request or record production authorization

#### Scenario: Fresh user starts an HTML deck
- **WHEN** a user explicitly targets an existing `html-only` run
- **THEN** BOOTSTRAP proceeds with that local legacy work without asking for Image2 credentials or live probes
- **AND** it does not offer an HTML deck as a fresh-init choice

#### Scenario: User elects optional refinement
- **WHEN** an existing `html-only` user explicitly requests the legacy refinement route
- **THEN** BOOTSTRAP explains the required same-pipeline mode switch, deferred Image2 readiness, and exact authorization before submission

#### Scenario: User reaches required refinement
- **WHEN** an existing `html-then-image2` run reaches its provider-dependent refinement step
- **THEN** BOOTSTRAP/controller explains offline readiness and exact authorization before submission
