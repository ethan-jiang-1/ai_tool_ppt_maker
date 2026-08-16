# Diagnostic Facts Specification (delta)

## ADDED Requirements

### Requirement: Source/config producers emit a shared owner-issued problem-fact contract

The Page Image source/configuration producer families — Page Source
(`content-parsing`), Visual Language and Presentation (`visual-config`), and
Reference Material (`visual-asset-management`) — SHALL emit their failures
through one shared internal problem-fact shape owned by this capability. The
contract SHALL carry, when known to the producer, these distinct semantics:

- `reason`: the producer's registered failure code;
- `owner`: the capability that owns the failing source fact (Page Source,
  Visual Language, Presentation, or Reference Material);
- `physical source`: the exact source file locator (path, line, column) when
  the producer knows it;
- `logical path`: the registry/record path within that source (for example
  `recipes.editorial-systems.provider_clause`) when applicable;
- `subject`: the affected slide and source field when the fact is
  slide/field-owned;
- bounded `actual`/`expected`: only scalar values proven safe to project, never
  complete visual clauses, role clauses, OS error text, or parser prose.

The contract SHALL NOT be the public `pptmaker-cli-diagnostic` schema; public
projection rules remain owned by `cli-surface`. Producers SHALL NOT construct
public envelopes, and SHALL NOT parse `Error.message` to recover `reason`,
`owner`, `category`, or recovery facts. A fact whose `owner`, `reason`, or
locator cannot be established deterministically SHALL remain unknown rather
than inferred.

#### Scenario: A registry clause failure carries its owner and logical path

- **WHEN** a Visual Language registry clause violates a content-authority rule
- **THEN** the producer error carries `reason`, `owner: Visual Language`, the
  registry physical source locator when known, and the logical record path
- **AND** the complete clause text is not emitted as a structured `actual`

#### Scenario: A Page Source field failure carries its field ownership

- **WHEN** a Page Source slide selects an unregistered identity role
- **THEN** the producer error carries `owner: Page Source` and
  `subject.field` naming `VISUAL IDENTITY`
- **AND** the aggregator does not rewrite the field to `VISUAL BRIEF`

#### Scenario: An unknown fact stays unknown

- **WHEN** a caught failure provides no registered reason or owner
- **THEN** the producer marks the fact unknown and does not guess a reason,
  owner, or repair source
- **AND** downstream operation owners fail closed on that fact

### Requirement: Aggregation preserves origin and locator semantics

Source aggregation SHALL preserve each underlying producer fact's `owner`,
`reason`, physical source, logical path, and subject across parsing layers.
Aggregation SHALL NOT replace an underlying `owner` with the aggregating
layer's identity, SHALL NOT collapse distinct locator semantics into one
string, and SHALL NOT copy only `code`/`message` while dropping structured
facts. Physical source, logical path, Page Source field, and producer owner
remain distinct semantics throughout. The declared Page Source field-location
mapping (owned by `content-parsing`) MAY re-home a selection failure whose
repair owner is the Page Source field — for example an unregistered identity
role to `VISUAL IDENTITY` or an unregistered brief ID to `VISUAL BRIEF`; all
other owners SHALL be preserved.

A shared source that fails once SHALL produce one stable root cause with its
affected slides/selections carried as bounded subject attachments;
aggregation SHALL NOT duplicate the same root into an arbitrary number of
slide-local issues. Multi-issue truncation and slide order SHALL NOT change
the root `owner`, `reason`, or recovery subject.

#### Scenario: A shared registry defect keeps one root cause

- **WHEN** five slides select the same malformed reference registry
- **THEN** aggregation emits one root cause owned by Reference Material whose
  public projection carries the root owner/reason/locator at the envelope
  root and one bounded subject attachment per affected slide
- **AND** it does not emit five slide-local `VISUAL BRIEF` issues

#### Scenario: Truncation does not change the root

- **WHEN** a bounded public projection truncates secondary issues
- **THEN** the root `owner`, `reason`, and exact next remain unchanged
- **AND** `omitted_count`/`truncated` metadata is preserved per `cli-surface`

### Requirement: Same reason code from different owners remains distinguishable

A reason code that can originate from more than one producer family SHALL
remain distinguishable by its `owner` and locator. Consumers SHALL NOT derive
owner, repair source, or blast radius from a reason code alone.

#### Scenario: Identical codes name different repair sources

- **WHEN** `content_overriding_visual_clause` originates from a Visual
  Language registry record and from a Reference Material role clause
- **THEN** each diagnostic names its actual owner and repair source
- **AND** no classifier maps the code to a single owner

### Requirement: Unknown or unsafe facts fail closed

A problem fact that is unsafe to project or oversized SHALL fail closed
while still stating that a known source/config defect exists — a bounded
root fact with incomplete-evidence metadata — rather than degrading to an
unrelated internal story; the result SHALL remain secret-safe. A fact whose
`owner` or `reason` cannot be established deterministically SHALL fail
closed as unknown: the operation SHALL NOT retry, force, guess a source, or
invent an action.

#### Scenario: An oversized diagnostic degrades without inventing a story

- **WHEN** a source/config failure produces more issues or bytes than the
  public bounds allow
- **THEN** the final envelope keeps the bounded root fact and exact next and
  marks the evidence incomplete
- **AND** it does not classify the known source defect as `internal` or guess
  a new owner
