# Framed Capture Runtime Specification

## Purpose

Define the retained private browser, font, capture, network-denial, timeout, and
cleanup primitives used only by the Page Authority Framed compositor. The legacy
implementation name in retained requirement titles is not a deck source, renderer,
review, or delivery protocol.

## Requirements

### Requirement: HTML runtime uses one pinned Node Playwright Chromium profile

The retained Framed runtime SHALL support the checked-in Node major set and one
pinned Playwright Chromium profile. It SHALL launch only that paired browser and
shall not select a system browser or caller-provided executable.

#### Scenario: Installed profile matches

- **WHEN** a supported Node major, the pinned Playwright package, and paired Chromium are installed
- **THEN** runtime inspection reports the matching profile facts

### Requirement: Browser acquisition is explicit setup and never readiness or render behavior

Package setup SHALL install the paired browser explicitly. Readiness and Framed
capture SHALL inspect an existing matching browser and never invoke an installer,
download a browser, or use a system-browser fallback.

#### Scenario: Offline runtime lacks paired Chromium

- **WHEN** doctor or Framed capture runs without paired Chromium
- **THEN** it fails with setup guidance
- **AND** no installer or network download is attempted

### Requirement: Static runtime smoke is local, fixed, and renderer-independent

The framework SHALL keep a fixed local capture fixture. Smoke validation SHALL
launch paired headless Chromium, load only local/data resources, block network
requests and service workers, wait for bundled fonts, verify geometry, and close
contexts and browsers on success, failure, or timeout.

#### Scenario: Fixture attempts remote access

- **WHEN** the fixture attempts HTTP or HTTPS access
- **THEN** the request is aborted and smoke validation fails

### Requirement: Official Latin and Simplified-Chinese WOFF2 assets are distributed immutably

The framework SHALL distribute pinned local font assets with their provenance,
license material, immutable bytes, and fixed manifest. The runtime SHALL use only
those local assets and shall not query a font service or use a system-font fallback
as evidence.

#### Scenario: Machine has no usable system font

- **WHEN** the distributed font tree and manifest are valid
- **THEN** Framed runtime font readiness succeeds using framework-owned assets
- **AND** it makes no remote font request

### Requirement: Font integrity and fixed sentinel coverage fail closed

The font manifest SHALL record each required file and digest. Verification SHALL
fail for absent or changed files, malformed coverage data, or failed fixed sentinel
coverage. Browser use of the expected local families is required evidence.

#### Scenario: Font file digest drifts

- **WHEN** a required font file differs from its manifest digest
- **THEN** font readiness and static smoke fail

### Requirement: Runtime evidence is reusable without becoming a workflow controller

The retained runtime SHALL expose one internal interface for profile inspection,
font validation, and smoke evidence. Readiness and Framed finalization consume that
interface; it SHALL not own user intent, source parsing, state transitions, or
provider authorization.

#### Scenario: Environment check consumes runtime evidence

- **WHEN** doctor enters package-backed checks after dependencies are present
- **THEN** it maps the shared runtime evidence into readiness records
- **AND** it does not duplicate browser or font authority

### Requirement: Retained browser runtime is internal Framed-compositor infrastructure

The pinned browser, bundled fonts, denied network, fixed capture profile, bounds
verification, PNG validation, timeout, and cleanup SHALL remain private Framed
compositor infrastructure. Callers provide Page Authority evidence only.

#### Scenario: Runtime use does not create a deck route

- **WHEN** a Framed finalizer invokes the capture runtime
- **THEN** it can compose only receipt-bound Page Authority evidence
- **AND** it cannot select a separate source, review, or delivery route
