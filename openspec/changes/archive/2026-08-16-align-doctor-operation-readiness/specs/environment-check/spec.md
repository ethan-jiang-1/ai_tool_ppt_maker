# Environment Check Specification (delta)

## ADDED Requirements

### Requirement: Doctor operations are backed by real owner readiness

The accepted doctor operation set SHALL contain only operations with real,
targeted owner readiness checks. The current set SHALL be exactly
`framed-local-refresh`, `raw-generation`, and `full-build`; the hidden
`image2-raw` alias SHALL be removed (the sole current name is
`raw-generation`), and `assembly-notes` SHALL NOT remain an accepted or
help-documented operation until an owner implements real, bounded, secret-free
readiness checks for it. An unknown or retired operation SHALL fail with the
existing bounded usage diagnostic naming the accepted set. Every accepted
operation SHALL map to the targeted checks of its owning capability and SHALL
NOT fall through to an unrelated generic profile.

#### Scenario: The hidden raw alias is rejected

- **WHEN** an Agent passes `--operation image2-raw`
- **THEN** env-check returns the bounded usage failure naming the accepted set
- **AND** it does not silently treat the alias as `raw-generation`

#### Scenario: A hollow assembly operation is not accepted

- **WHEN** an Agent passes `--operation assembly-notes`
- **THEN** env-check returns the bounded usage failure naming the accepted set
- **AND** it does not report a generic common-profile result as notes/assembly
  readiness

### Requirement: Exact-run readiness and its consumers share one restricted startup environment

`ppt_flow doctor --run-dir <run-dir> --operation raw-generation` SHALL resolve
its Image2 runtime facts through the same restricted startup loader used by the
exact-run `image2 authorize`/`generate` and Style Master authorize/generate
entries, with the same precedence: explicit process environment first, the
selected deck `.env` filling only missing declared keys, and the project/cwd
`.env` filling only keys still missing. The loader SHALL read only declared
runtime keys (`IMAGE2_API_KEY`, `IMAGE2_BASE_URL`,
`IMAGE2_PROVIDER_PROFILE_ID`), SHALL NOT overwrite explicit environment values,
and SHALL NOT output values or secrets. A raw-generation READY result therefore
implies that the same exact run's authorized consumer can resolve the same
non-secret configuration without a shell export.

#### Scenario: Doctor READY reaches the exact authorize checkpoint

- **WHEN** exact-run raw-generation doctor reports READY with the profile ID
  present in the deck `.env` and absent from the shell
- **THEN** the same exact run's `image2 authorize` resolves the same profile
  identity and proceeds to its existing grant preconditions
- **AND** it does not require the human to export the `.env` values manually

#### Scenario: Shell precedence beats deck .env

- **WHEN** the shell exports one `IMAGE2_PROVIDER_PROFILE_ID` and the deck
  `.env` declares a different one
- **THEN** doctor and authorize both resolve the explicit shell value
- **AND** the deck `.env` value never overrides it
