# CLI Surface Specification (delta)

## ADDED Requirements

### Requirement: Source/config precondition failures keep the source owner

When a provider-free `style-master inspect`, `style-master plan`, or `image2
plan` operation fails on a source/configuration precondition — Page Source
field ingress (`content-parsing`), Visual Language registry or Presentation
package (`visual-config`), or Reference Material (`visual-asset-management`) —
the CLI producer SHALL emit the existing registered secret-safe failure
envelope with `source_validation` classification, the producer-issued
`reason`/`source`/`subject`/`issues` facts, and the one exact
nearest legal owner action `edit_source` (non-human). It SHALL
NOT classify a known source/config defect as `internal`/`report_internal`,
SHALL NOT emit an `artifact`/`inspect` next that has the same failed
precondition as the command that just failed, and SHALL NOT attribute the
failure to the operation/lifecycle owner. The command SHALL exit 1 with
empty stdout and exactly one final envelope, and SHALL make no plan
publication, receipt, state, review, or provider call.

#### Scenario: A registry clause failure reaches Style Master inspect

- **WHEN** `style-master inspect` fails because a selected Visual Language
  registry clause violates a content-authority rule
- **THEN** the final envelope carries `source_validation` with the Visual
  Language registry locator facts and the registry repair next
- **AND** it does not return an `artifact`/`inspect` next, does not call it
  `internal`, and performs no plan/state/provider work

#### Scenario: A known source defect reaches image2 plan

- **WHEN** `image2 plan` fails on an unregistered identity role in Page
  Source
- **THEN** the final envelope names the `VISUAL IDENTITY` field repair and a
  single edit-source next
- **AND** it does not return `internal`/`report_internal` and does not create
  a receipt, route, or provider input

### Requirement: CLI projects producer facts without a second business attributor

For the four migrated source/config producer families, the direct CLI SHALL
consume the problem-fact contract owned by `diagnostic-facts` and SHALL NOT
re-derive owner, category, reason, or next from error class names, code
prefixes, or hard-coded code/set tables in `ppt_flow.mjs`. The CLI retains
ownership of the public envelope: schema/version compatibility, category and
action vocabulary, redaction, bounds, lineage, invocation confinement, exit
status, and stdout/stderr isolation.

`attachCliDiagnostic()` SHALL retain its existing delivery-notes
jurisdiction and SHALL NOT become the general CLI authority for low-level
source resolvers. `diagnosticFromError()` SHALL remain the delivery-notes
scoped retrieval seam with that declared jurisdiction and focused tests; it
SHALL NOT be used by source resolvers, aggregators, or the direct CLI
classifiers, and SHALL NOT remain an undocumented helper.

#### Scenario: A migrated family keeps one owner path

- **WHEN** a Page Image source/config failure carries a producer-issued
  owner fact
- **THEN** the CLI emits that owner's category/reason/next without consulting
  a `ppt_flow.mjs` code table
- **AND** the same failure emits the same root facts across
  `style-master inspect`, `style-master plan`, and `image2 plan` except for
  the operation-legal next

### Requirement: Public projection keeps one bounded root fact and one exact next

The CLI SHALL project internal problem facts to the public envelope through
declared conversion and omission rules. Raw internal `issues[]` SHALL NOT be
passed directly into the public sanitizer; each issue SHALL be converted only
when its fields map to the registered public issue shape
(`message`, `subject`, `source`, `reason`, `lineage`). The final envelope
SHALL contain a bounded root fact (one root owner/reason/locator), at most
one exact `next` action, and bounded secondary issues with
`omitted_count`/`truncated` metadata when bounds apply.

The projection SHALL NOT leak a stack trace, provider body, prompt, complete
visual clause, role clause, parser/fs prose, OS error text, digest, secret, or
absolute escape path. Facts whose public safety is not established SHALL be
omitted or replaced with a bounded summary, and unknown/unsafe facts SHALL
fail closed rather than guessing. Top-level `code`/`message`/`hint` SHALL
remain a compatibility summary only and SHALL NOT become recovery authority.

#### Scenario: An oversized source failure degrades within bounds

- **WHEN** a shared-source failure produces more issues than the public
  bounds allow
- **THEN** the envelope keeps the root owner/reason/locator and exact next
  and reports the omitted count
- **AND** truncation or slide order does not change the root fact or next

#### Scenario: A secret-like or absolute path fact is never emitted

- **WHEN** a producer issue contains secret-like text, an absolute escape
  path, or complete clause prose
- **THEN** the projection omits or bounds those values
- **AND** the final envelope remains valid and names only the safe repair
  owner
