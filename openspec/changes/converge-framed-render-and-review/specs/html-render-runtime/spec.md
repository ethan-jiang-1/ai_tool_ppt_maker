## MODIFIED Requirements

### Requirement: Retained browser runtime is internal Framed-compositor infrastructure

The pinned browser, checked-in fonts, denied network, fixed capture profile, geometry verification,
PNG validation, timeout, and cleanup SHALL remain private Framed render-contract infrastructure.
The same runtime profile SHALL be available to the Framed owner for bounded plan-time layout proof
and final composition. Callers SHALL provide only current Page Authority evidence and SHALL NOT
select a browser executable, system font, network asset, markup, CSS, or capture option.

The runtime SHALL evaluate an ordered bounded slide batch without creating a long-lived daemon or a
workflow controller. It SHALL close browser resources on success, failure, and timeout, and an unknown
runtime or font result SHALL fail closed without provider work or artifact publication.

#### Scenario: Runtime use does not create a deck route

- **WHEN** the Framed owner invokes the runtime for plan verification or final composition
- **THEN** it can evaluate only receipt-bound Page Authority facts under the pinned profile
- **AND** it cannot select a separate source, review, provider, or delivery route

#### Scenario: Plan and final use the same runtime profile

- **WHEN** a Framed page passes plan-time layout proof and later enters final composition without profile drift
- **THEN** both checkpoints use the same pinned browser, font inventory, compiler, and capture identity
- **AND** final composition repeats the layout and font assertions before publishing pixels

## ADDED Requirements

### Requirement: Framed runtime uses only required checked-in font faces

For each Framed page, the runtime SHALL derive required font faces from the actual source code points
and the canonical checked-in font inventory, embed only the selected local faces, and prove that every
rendered text leaf uses the expected selected custom family. It SHALL NOT treat `local()`, a system
font, or a network font as successful evidence.

An unsupported source code point SHALL be a bounded source-validation failure. A missing, changed, or
unloadable selected font file SHALL be an environment failure. The diagnostic SHALL NOT claim broad
language support from code-point coverage alone.

#### Scenario: Mixed supported text uses selected local faces

- **WHEN** a Text Frame contains supported Latin and Simplified-Chinese code points
- **THEN** the runtime embeds the corresponding checked-in faces and proves their use for rendered glyphs
- **AND** it does not load every unrelated font shard

#### Scenario: Unsupported code point stops before browser-dependent work

- **WHEN** a Text Frame contains code points absent from the canonical inventory
- **THEN** the Framed owner returns a bounded source-validation hard-stop naming the affected field and code points
- **AND** no provider request or system-font fallback occurs

#### Scenario: Selected font is unavailable

- **WHEN** a required checked-in font file is missing, changed, or fails to load
- **THEN** the operation returns the environment-repair hard-stop
- **AND** source editing is not presented as the recovery action
