## ADDED Requirements

### Requirement: Style Master local media remains a PNG source, not a delivery projection

Run-Bundle Layout SHALL reserve `style_master.png` only as the optional
override-first/backbone-default local Style Master candidate source. The file
SHALL be a regular CRC-valid PNG with positive native dimensions before the
Style Master owner can snapshot it. It is editable deck source and never
selection authority, review evidence, raw-provider authority, delivery media,
or a replacement for immutable candidate storage.

The layout SHALL not reserve, write, validate as current, navigate as accepted,
or use as a fallback the retired `style_master.jpg` presentation path. A
historical root-level JPEG file is not a current layout input and never proves
selection; its presence alone SHALL neither establish a current candidate nor
trigger a layout migration. Layout and production owners SHALL not scan,
transcode, copy, or adopt that file as a compatibility or migration route.

#### Scenario: A local Style Master PNG is only candidate input

- **WHEN** a current version supplies a valid layout-resolved
  `style_master.png`
- **THEN** the Style Master owner may snapshot it into the ordinary immutable
  local-existing candidate lifecycle
- **AND** its presence alone does not establish an accepted selection or Page
  Image raw authority

#### Scenario: An accepted generated Style Master has no root media projection

- **WHEN** an immutable generated PNG candidate is accepted
- **THEN** current raw planning and human navigation obtain the selected PNG
  from their existing immutable-selection owner paths
- **AND** no `style_master.jpg` or replacement root-level presentation file is
  created

#### Scenario: A historical JPEG source is not adopted by layout inspection

- **WHEN** an existing bundle contains a historical `style_master.jpg`
- **THEN** layout inspection does not treat those bytes as a local candidate or
  accepted Style Master evidence
- **AND** it does not rename, convert, delete, or infer a `style_master.png`
  source from those bytes
