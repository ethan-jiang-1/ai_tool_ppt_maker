## MODIFIED Requirements

### Requirement: Image2 first-time credential setup is self-contained in BOOTSTRAP

BOOTSTRAP Step 1 SHALL state that fresh HTML-first create/preview/build/local iteration requires only base HTML readiness and SHALL not solicit `IMAGE2_API_KEY`, `IMAGE2_BASE_URL`, a style master, or a live provider probe. During Change 3, modern HTML visual-slot refinement is unavailable and BOOTSTRAP SHALL not advertise a runnable `image2` workflow.

When and only when an existing markerless deck is classified into `legacy-image2-maintenance`, BOOTSTRAP or the linked legacy reference SHALL provide the existing optional credential presence/live-probe guidance: `.env` location, `doctor --image2`, disclosed-submit confirmation before live flags, and non-secret lesson capture. It SHALL not describe channel diagnosis as page-generation authorization or duplicate the full provider protocol.

#### Scenario: Fresh user starts an HTML deck

- **WHEN** base doctor is ready and the user creates a new deck
- **THEN** BOOTSTRAP proceeds without asking for Image2 credentials or live probes

#### Scenario: Legacy deck requires Image2 maintenance

- **WHEN** a markerless deck enters its explicit compatibility controller
- **THEN** the Agent can discover offline credential checks and optional confirmed live diagnostics
- **AND** no guidance is applied to the HTML path

#### Scenario: Modern refinement is not yet available

- **WHEN** a user asks for professional Image2 visual-slot refinement during Change 3
- **THEN** BOOTSTRAP states it is unavailable rather than offering executable steps or commands

#### Scenario: User declines a legacy live probe

- **WHEN** the user declines the disclosed provider submit
- **THEN** no live flag runs and base HTML readiness remains unaffected

## ADDED Requirements

### Requirement: BOOTSTRAP repairs the complete local HTML delivery prerequisites

BOOTSTRAP SHALL map every base doctor/runtime/font/browser failure to copy-pasteable local repair guidance and SHALL explain that per-run source/config/catalog/overflow failures are repaired through `ppt_flow validate` or HTML preview diagnostics rather than environment credentials. It SHALL route the Agent from BOOTSTRAP into final `00-setup` and the pipeline-specific playbook.

#### Scenario: Runtime is ready but a slide overflows

- **WHEN** doctor passes and HTML composition reports pixel overflow
- **THEN** BOOTSTRAP/controller treats it as a run source/layout repair
- **AND** does not ask for Image2 or reinstall the browser
