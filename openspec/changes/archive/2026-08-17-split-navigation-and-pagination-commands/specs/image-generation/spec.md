# Image Generation Specification (delta)

## MODIFIED Requirements

### Requirement: Human Navigation Path short-circuits every validated pending successor

When the Style Master owner returns a validated pending-successor candidate
projection for an exact current Page Image Workflow run, the Human Navigation
Path SHALL render that projection before raw-owner, stored-raw-plan, or
raw-only accepted-selection inspection. This applies whether or not the
predecessor selection's style-intent, style-context, or
candidate-generation-profile hashes differ from the successor plan.

The tree SHALL materialize short physical copies only from the owner-provided
verified candidate locators, label them pending and not accepted, and mark raw,
review, final, and delivery work unavailable. The `artifacts` success
projection SHALL report the owner's existing next action. Neither surface
SHALL display the predecessor as current Style Master authority, infer a raw
plan from it, or expose a SHA-named storage path.

The projection remains a provider-free guide. Any owner hard-stop for scope,
plan, predecessor, media, provenance, or navigation materialization SHALL
preserve the existing navigation tree and return the existing nearest recovery
without writing lifecycle authority.

#### Scenario: Source-receipt successor is visible before stale raw inspection

- **WHEN** a valid current successor has verified candidate media while a
  non-visual source edit makes the Page Image source receipt stale and its
  predecessor's three Style Master input hashes still match
- **THEN** rebuilding the Human Navigation Path publishes the successor's
  short candidate artifact copy and pending inspection purpose
- **AND** it does not read the stale raw plan, publish raw/final/delivery
  artifacts, initialize a provider, or mutate state

#### Scenario: Invalid pending candidate evidence leaves navigation unchanged

- **WHEN** an owner-projected successor candidate fails immutable media or
  provenance validation
- **THEN** the navigation rebuild returns the existing owner hard-stop before
  replacing the navigation tree
- **AND** it does not publish a partial candidate list or use a predecessor
  artifact as fallback

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
(`image2 plan`, `pilot`, `expansion`, `review`, `accept`, `reconcile`, and
observations) SHALL NOT load dotenv configuration; their behavior is unchanged
by this requirement. The `artifacts` command is likewise provider-free and
SHALL NOT load dotenv configuration.

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
