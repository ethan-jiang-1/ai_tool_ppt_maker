# Image Generation Specification (delta)

## ADDED Requirements

### Requirement: Page Image provider operations share the restricted startup environment

The current `image2 authorize` and `image2 generate` entries SHALL resolve
their Image2 runtime facts through the shared restricted startup loader
(`shared/image2/startup_env.mjs`) with the fixed precedence: explicit process
environment first, the selected deck `.env` filling only missing declared
keys, then the project/cwd `.env` filling only keys still missing. The loader
SHALL read only the declared runtime keys (`IMAGE2_API_KEY`,
`IMAGE2_BASE_URL`, `IMAGE2_PROVIDER_PROFILE_ID`), SHALL NOT overwrite explicit
environment values, and SHALL NOT output values or secrets.

A missing, invalid, or profile-mismatched runtime fact SHALL hard-stop before
grant publication, attempt claim, credential initialization, or provider
request, with the existing secret-safe `environment`/`repair_environment` (or
owner-issued source) recovery; it SHALL NOT relax profile identity, infer a
fallback profile, or produce a provider side effect. Provider-free operations
(`image2 plan`, `pilot`, `expansion`, `review`, `accept`, `reconcile`,
`artifact-view`, and observations) SHALL NOT load dotenv configuration; their
behavior is unchanged by this requirement.

#### Scenario: Authorize resolves the deck .env profile without a shell export

- **WHEN** a current exact run's deck `.env` supplies
  `IMAGE2_PROVIDER_PROFILE_ID` while the shell does not
- **THEN** `image2 authorize` resolves that profile identity through the
  shared loader and continues to its existing grant preconditions
- **AND** it does not claim an attempt, initialize credentials, or contact a
  provider as part of that resolution

#### Scenario: Runtime mismatch still hard-stops before a grant

- **WHEN** the resolved runtime profile ID differs from the plan-bound profile
- **THEN** authorization hard-stops before grant publication or provider work
  with the existing environment repair action
- **AND** no attempt, credential initialization, or provider request occurs
