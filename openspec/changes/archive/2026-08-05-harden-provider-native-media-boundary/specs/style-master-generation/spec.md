## MODIFIED Requirements

### Requirement: Effective selection and acceptance share one canonical state record

The Style Master state owner SHALL persist one exact
`page_authority_style_master.by_version["3_versions/vN"]` record for each accepted scope tuple. Its canonical
record SHALL contain only the schema, run version, workflow, plan digest, candidate ID/digest/provenance digest,
candidate media type and dimensions, style-intent digest, style-context digest, candidate-generation-profile digest, previous selection digest,
review-decision digest, and acceptance timestamp. The canonical JSON SHA-256 of that record SHALL be the
effective selection and acceptance receipt identity. The owner SHALL NOT write a second mutable receipt,
metadata mirror, raw-profile payload, or host path as selection authority.

After the state CAS commits, the owner SHALL ensure the compatibility `style_master.jpg` payload as valid JPEG
bytes projected from the selected immutable candidate through the existing in-framework image stack at the
layout-resolved canonical path: use an existing `overrides/visual-style/style_master.jpg` when present, otherwise
the shared backbone default, and never create an override solely for projection. For a selected PNG candidate,
the projection SHALL derive pixels from the same CRC-valid decoded PNG media that established its candidate
dimensions; valid ancillary or private PNG chunks SHALL NOT make that derived projection fail solely because a
different image decoder rejects them. Its transformed bytes, failure, presence, or digest SHALL neither roll back
nor establish the selection. An exact idempotent accept replay SHALL return the original selection record and
timestamp while repairing only a missing or stale compatibility payload for the requesting run; it SHALL not
change another version's selection record or automatically create an override.

A post-CAS projection failure SHALL return a nonzero owner diagnostic that includes the already committed
selection identity and only the same exact accept replay as recovery. Read-only selection inspection SHALL
continue to report that authoritative selection as current; the failure SHALL NOT mint a second acceptance,
misreport promotion as uncommitted, or satisfy page raw authorization. A successful replay SHALL verify or
repair the derived JPEG and return the original receipt and timestamp.

`page_authority_style_master` SHALL be an optional schema-v5 state map. Its absence in an existing current v2
bundle SHALL mean unavailable Style Master evidence, not unsupported state. A present record SHALL satisfy the
exact selection field schema, canonical version key and matching `run_version`, plus the exact bound workflow
when source/state is materialized. A structurally valid but stale record SHALL remain supported and unavailable;
a malformed present record SHALL make state validation fail closed without being deleted, normalized, or
treated as absence. For an active fresh-v2 authoring draft, the Style Master writer MAY add the exact selected-workflow
record without creating the missing production-mode or target-evidence records; later page raw source materialization
SHALL preserve and revalidate that record. Observation and a failed CAS SHALL remain byte-preserving.

First structural publication of vNext SHALL preserve the source version's record but SHALL NOT copy, rename,
infer, or rebind it into the target version, even for an unchanged workflow. The target begins without an
accepted selection and plans against a null previous target selection. Exact replay of the already-published
structural plan SHALL revalidate and preserve any later target-owned selection instead of deleting it. Neither
path SHALL invoke a provider, rewrite the layout-resolved compatibility payload, or use that payload as inheritance.

#### Scenario: Payload drift cannot create a selection

- **WHEN** a compatibility payload is missing, stale, or contains bytes selected for another action
- **THEN** the effective selection remains determined solely by the current state record and immutable candidate bytes
- **AND** raw planning neither reads the payload as authority nor changes another version's selection record

#### Scenario: Compatibility payload matches its filename

- **WHEN** promotion or explicit rebuild projects a selected PNG or JPEG candidate to `style_master.jpg`
- **THEN** the projection contains valid JPEG bytes while the selection continues to reference the immutable original candidate bytes
- **AND** the projected JPEG digest does not replace candidate or acceptance identity

#### Scenario: Private PNG chunk remains promotable

- **WHEN** an accepted generated PNG candidate has CRC-valid positive dimensions and contains an ancillary private chunk that a canvas image loader rejects
- **THEN** promotion writes a valid compatibility JPEG from the verified candidate pixels
- **AND** it retains the candidate's original bytes, digest, dimensions, and selection identity unchanged

#### Scenario: Projection failure preserves committed selection

- **WHEN** selection CAS commits but compatibility JPEG projection fails before accept returns
- **THEN** the owner emits no success receipt on stdout and returns a nonzero diagnostic whose selection subject names the committed digest and whose structured next invocation is the exact accept replay
- **AND** replay repairs only the derived payload and returns the original receipt/timestamp without another decision, selection, or provider call

#### Scenario: Existing schema-v5 state remains readable without selection

- **WHEN** an existing exact v2 bundle has schema-v5 state but no `page_authority_style_master` map
- **THEN** state remains supported and Style Master readiness evaluates unavailable
- **AND** observation does not seed a selection, promote the compatibility payload, or rewrite state

#### Scenario: Structural vNext owns a fresh selection scope

- **WHEN** structural publication creates a target version from a source version with an accepted selection
- **THEN** the source selection remains intact while the target has no selection until its own reviewed promotion
- **AND** exact structural replay preserves a later valid target-owned selection without copying source authority or changing the layout-resolved compatibility payload
