## ADDED Requirements

### Requirement: Page Image Workflow artifacts have canonical rebuildable owners

Run-Bundle Layout SHALL give the current Page Image Workflow canonical owners
for normalized source, matching state, source receipt, Style Master lifecycle,
compiled provider input and digest, raw provider page/provenance, Page Review
contributions, `page-image-final-slide-manifest-v1`, assembly, and notes.
The selected adapter owns policy-specific raw and review contributions; shared
delivery owns the common final-manifest projection. All media, receipts,
inspection projections, composites, and task cards beneath `_generated/` or
their declared derived owner remain rebuildable and SHALL NOT become source
authority by path, filename, timestamp, or hand edit.

For Framed, the review owner SHALL retain the exact provider page and its
production-equivalent transparent header composite as distinct bound
contributions to one Complete Page Review. For Pure, the provider page is the
complete-page contribution. Neither layout creates a second local-composite
approval record.

#### Scenario: A Framed review has two bound views but one owner

- **WHEN** layout resolves current Framed complete-page review artifacts
- **THEN** it identifies the raw provider page and local-header composite as
  separate derived contributions to one review record
- **AND** it does not treat either filename as a second acceptance decision

#### Scenario: Deleting a current derived artifact does not make it source

- **WHEN** a generated provider page, composite, manifest, or task projection
  is absent
- **THEN** layout identifies its declared rebuild owner
- **AND** it does not accept a manually placed replacement as current evidence

### Requirement: Current Page Image lifecycle records remain append-mostly and CAS-scoped

The replacement-owned Style Master and page-production iteration owners SHALL
retain immutable plans, exact authorization grants, submitted attempts,
verified media/provenance, review decisions, and any bounded abandonment or
reconciliation records. For each exact version/workflow scope, one small
CAS-protected head SHALL name the current immutable plan generation and
predecessor; progress, paid debt, terminality, and next action SHALL be derived
from the referenced direct records rather than stored as a mutable head or
task-card projection.

An owner SHALL fully validate and atomically publish a staged immutable plan
before its head CAS. Staging and complete-but-unreferenced plans are never
current authority, and cleanup is confined to the owner staging root during an
explicit mutating operation. Immutable plans, grants, attempts, provenance,
and provider bytes SHALL not be selected, overwritten, or recovered by
directory order, timestamps, filenames, copied media, compatibility payloads,
or `_generated/` artifacts. Current media and provenance become evidence only
through their exact terminal attempt and plan/batch/selection lineage; State
may retain a typed handoff reference but not a duplicate lifecycle ledger.

#### Scenario: A staged or copied page artifact cannot become current

- **WHEN** a staged plan, orphaned provider page, or copied derived artifact is
  present beside a current scope
- **THEN** layout ignores it as current authority until the owning immutable
  plan, head, attempt, and provenance chain validates it
- **AND** it does not issue a grant, reconstruct an attempt, or use the bytes
  as accepted evidence

#### Scenario: A current head cannot be chosen from history order

- **WHEN** a replacement lifecycle contains terminal and successor plans
- **THEN** layout resolves the owner-declared CAS head and exact predecessor
  lineage
- **AND** it does not reopen a terminal plan or choose a directory by timestamp

### Requirement: Current layout records do not adopt v2 Page Authority artifacts

`page-authority-image2-v2` source/state, receipt, plan, provider media,
review, final-manifest, or delivery records may remain physically present but
are unsupported input to current Page Image Workflow layout and lifecycle
readers. Those readers SHALL stop at identity before following a v2 artifact
path, deriving provenance, or using a v2 record as a current pointer. They
SHALL NOT create an adoption directory, converter, evidence bridge, or
automatic cleanup.

#### Scenario: Old raw media cannot become a current rebuild source

- **WHEN** a current layout reader encounters a v2 raw artifact and its
  accompanying receipt
- **THEN** it returns the `unsupported-protocol/export` boundary before reading media
  provenance or review facts
- **AND** it does not copy, convert, or register the bytes in current layout

## REMOVED Requirements

### Requirement: Page Authority artifacts have canonical rebuildable owners

**Reason**: It assigns source, raw, review, and final ownership to the retired
v2 Page Authority schemas and text-free Framed evidence.

**Migration**: Use current Page Image Workflow owners and one Complete Page
Review contribution set.

### Requirement: Current generated ownership is Page Authority-only

**Reason**: Its current generated-artifact identity is v2-only.

**Migration**: Generated ownership follows the replacement source/state and
final-manifest lineage.

### Requirement: Progressive raw production records have one append-mostly owner

**Reason**: Its raw-plan record family is a v2 production route.

**Migration**: Publish replacement protocol plans and evidence only after
current identity validation.

### Requirement: Progressive evidence and migration preserve ownership boundaries

**Reason**: It permits v2 migration framing that is explicitly out of scope.

**Migration**: Preserve v2 bytes as unsupported and create no migration path.

### Requirement: Progressive task projection remains a rebuildable collaboration view

**Reason**: Its named Page Authority progressive record set is retired.

**Migration**: Rebuild collaboration views only from current Page Image
Workflow facts.
