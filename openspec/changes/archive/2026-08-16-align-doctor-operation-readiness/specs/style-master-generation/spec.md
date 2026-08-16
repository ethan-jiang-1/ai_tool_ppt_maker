# Style Master Generation Specification (delta)

## ADDED Requirements

### Requirement: Style Master provider operations share the restricted startup environment

The current Style Master authorize and generate entries SHALL resolve their
Image2 runtime facts through the same shared restricted startup loader as
Page Image (`shared/image2/startup_env.mjs`) with the same fixed precedence:
explicit process environment first, the selected deck `.env` filling only
missing declared keys, then the project/cwd `.env` filling only keys still
missing. The loader SHALL read only the declared runtime keys
(`IMAGE2_API_KEY`, `IMAGE2_BASE_URL`, `IMAGE2_PROVIDER_PROFILE_ID`), SHALL NOT
overwrite explicit environment values, and SHALL NOT output values or
secrets. Style Master and Image2 therefore share one startup source and
precedence; provider-free Style Master planning SHALL continue to require
neither an API key nor a base URL and SHALL NOT load dotenv configuration.

A missing, invalid, or profile-mismatched runtime fact SHALL hard-stop before
grant publication, attempt claim, credential initialization, or provider
request, with the existing secret-safe owner repair action; it SHALL NOT relax
profile identity, infer a fallback, or produce a provider side effect.

#### Scenario: Style Master authorize uses the deck .env profile

- **WHEN** a current exact run's deck `.env` supplies
  `IMAGE2_PROVIDER_PROFILE_ID` while the shell does not
- **THEN** Style Master authorize resolves the same profile identity through
  the shared loader and continues to its existing grant preconditions
- **AND** provider-free planning remains credential-free and dotenv-free

#### Scenario: Style Master mismatch keeps its hard-stop

- **WHEN** the resolved runtime profile ID differs from the plan-bound profile
- **THEN** Style Master authorization hard-stops before grant publication with
  the existing environment repair action
- **AND** no attempt claim, credential initialization, or provider request
  occurs
