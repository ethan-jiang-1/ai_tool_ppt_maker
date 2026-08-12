## MODIFIED Requirements

### Requirement: One structured slide document owns Markdown round trips

Page Image Workflow source validation and structural editing SHALL consume one
shared structured slide-document interface. It SHALL parse and retain leading
frontmatter, preamble, ordered slide blocks, and epilogue. After the slide list
starts, the first ordinary level-2 heading that is not a slide heading SHALL
start the epilogue. A level-2 heading that begins with the reserved
slide-heading prefix but is malformed SHALL be a blocking parse error rather
than an epilogue boundary. Unchanged source regions and complete moved blocks
SHALL preserve their original bytes except for heading-number projection, the
explicit identity marker when required, and deterministic structured-reference
updates.

The canonical run-directory editor SHALL operate on exactly one
`slide-specifications.md`; it SHALL NOT create a second persistent order file.
The shared source parser's standalone multi-input mode SHALL remain supported,
with local heading validation per input and global positions derived from input
order followed by block order. Parsed documents, edit plans, exact-plan
transactions, and receipts SHALL use declared current structural shapes with no
numeric schema revision marker.

#### Scenario: Epilogue is not absorbed into the last slide

- **WHEN** a slide list is followed by `## Change Log` and its body
- **THEN** the document parser records that heading and body as epilogue
- **AND** moving the final slide does not move or rewrite the epilogue

#### Scenario: Malformed slide-like heading fails

- **WHEN** a slide list contains a level-2 heading such as `## Slide seven UXGap`
  that begins like a slide but does not match canonical grammar
- **THEN** parsing fails with the heading location and expected grammar
- **AND** the malformed heading is not silently treated as epilogue

#### Scenario: No-op round trip preserves bytes

- **WHEN** a parsed document is serialized without an edit
- **THEN** frontmatter, preamble, slide bodies, whitespace, and epilogue are
  byte-identical to the source

#### Scenario: Multiple standalone inputs keep local numbering

- **WHEN** the shared source parser receives two standalone source files whose
  slide headings each start at 1
- **THEN** each file is validated for its own continuous local numbering
- **AND** the merged plan positions increase globally in input and block order

#### Scenario: A structural transaction is inspected

- **WHEN** a maintainer inspects a parsed document, edit plan, or exact-plan
  receipt
- **THEN** its declared current structural shape contains no numeric schema
  revision marker
- **AND** it retains exact source, slide identity, and target Work Version
  bindings
