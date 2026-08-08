# Framed Capture Runtime Specification

## Purpose

Define the retained private browser, font, capture, network-denial, timeout, and
cleanup primitives used only by the Page Image Workflow Framed header-overlay compositor. It is a
private runtime seam, not a deck source, renderer, review, or delivery protocol.

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

The Harness SHALL keep a fixed local capture fixture. Smoke validation SHALL
launch paired headless Chromium, load only local/data resources, block network
requests and service workers, wait for bundled fonts, verify geometry, and close
contexts and browsers on success, failure, or timeout.

#### Scenario: Fixture attempts remote access

- **WHEN** the fixture attempts HTTP or HTTPS access
- **THEN** the request is aborted and smoke validation fails

### Requirement: Official Latin and Simplified-Chinese WOFF2 assets are distributed immutably

The Harness SHALL distribute pinned local font assets with their provenance,
license material, immutable bytes, and fixed manifest. The runtime SHALL use only
those local assets and shall not query a font service or use a system-font fallback
as evidence.

#### Scenario: Machine has no usable system font

- **WHEN** the distributed font tree and manifest are valid
- **THEN** Framed runtime font readiness succeeds using Harness-owned assets
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

The pinned browser, checked-in fonts, denied network, fixed capture profile, geometry verification,
PNG validation, timeout, and cleanup SHALL remain private Framed render-contract infrastructure.
The same runtime profile SHALL be available to the Framed owner for bounded plan-time layout proof
and final composition. Callers SHALL provide only current Page Image Workflow evidence and SHALL NOT
select a browser executable, system font, network asset, markup, CSS, or capture option.

The runtime SHALL evaluate one finite ordered raw-plan batch under one pinned browser process, with
per-page capture deadlines and one finite whole-batch deadline, without creating a long-lived daemon or
a workflow controller. It SHALL close browser resources on success, failure, and timeout, and an unknown
runtime, font, or proof-timeout result SHALL fail closed without provider work or artifact publication.

#### Scenario: Runtime use does not create a deck route

- **WHEN** the Framed owner invokes the runtime for plan verification or final composition
- **THEN** it can evaluate only receipt-bound Page Image Workflow facts under the pinned profile
- **AND** it cannot select a separate source, review, provider, or delivery route

#### Scenario: Plan and final use the same runtime profile

- **WHEN** a Framed page passes plan-time layout proof and later enters final composition without profile drift
- **THEN** both checkpoints use the same pinned browser, font inventory, compiler, and capture identity
- **AND** final composition repeats the layout and font assertions before publishing pixels

### Requirement: Framed runtime uses only required checked-in font faces

For each Framed page, the runtime SHALL derive required font faces from the actual source code points
and the canonical checked-in font inventory, embed only the selected local faces, and prove that every
rendered text leaf uses the expected selected custom family. It SHALL NOT treat `local()`, a system
font, or a network font as successful evidence.

An unsupported source code point SHALL be a bounded source-validation failure. A missing, changed, or
unloadable selected font file SHALL be an environment failure. The diagnostic SHALL NOT claim broad
language support from code-point coverage alone.

#### Scenario: Mixed supported text uses selected local faces

- **WHEN** a Framed header overlay contains supported Latin and Simplified-Chinese code points
- **THEN** the runtime embeds the corresponding checked-in faces and proves their use for rendered glyphs
- **AND** it does not load every unrelated font shard

#### Scenario: Unsupported code point stops before browser-dependent work

- **WHEN** a Framed header overlay contains code points absent from the canonical inventory
- **THEN** the Framed owner returns a bounded source-validation hard-stop naming the affected field and code points
- **AND** no provider request or system-font fallback occurs

#### Scenario: Selected font is unavailable

- **WHEN** a required checked-in font file is missing, changed, or fails to load
- **THEN** the operation returns the environment-repair hard-stop
- **AND** source editing is not presented as the recovery action

### Requirement: Framed runtime terminology is protocol-neutral
The retained private browser, font, capture, network-denial, timeout, and cleanup runtime SHALL be described only as the Framed compositor seam. Its current purpose and requirement titles SHALL NOT preserve a historical implementation name, source grammar, observer, or delivery protocol.

#### Scenario: Runtime contract is read
- **WHEN** an Agent reads the Framed runtime contract
- **THEN** it can identify the current private compositor seam
- **AND** it does not discover a retired implementation route
