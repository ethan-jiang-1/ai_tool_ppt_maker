## ADDED Requirements

### Requirement: Style Master CLI exposes PNG selection without a JPEG replay surface

The direct Style Master acceptance result SHALL expose the existing accepted
selection and its immutable PNG lineage without a
`presentation_jpeg_projection` result. `style-master accept`, inspection, and
artifact navigation SHALL not create, require, advertise, or repair a
`style_master.jpg` presentation artifact. The CLI SHALL not emit
`style_master_presentation_jpeg_projection_failed` or offer an exact replay
action for that retired projection.

A JPEG payload at the canonical current `style_master.png` source SHALL be
rejected by the existing Style Master owner before plan creation. A historical
`style_master.jpg` file or immutable JPEG selection SHALL not be presented as a
current Style Master selection. The CLI SHALL preserve the owner-issued
source-refresh or replacement-selection action and SHALL not add a file-copy,
transcode, compatibility, force, or generic retry route.

#### Scenario: Acceptance completes at the PNG selection CAS

- **WHEN** `style-master accept` promotes one current reviewed PNG candidate
- **THEN** the CLI reports the accepted immutable selection and its normal next
  action
- **AND** it reports no JPEG projection status and requires no projection replay

#### Scenario: Navigation describes the selected PNG without a JPEG artifact

- **WHEN** artifact navigation is rebuilt for a version with an accepted Style
  Master PNG selection
- **THEN** the CLI describes the derived selected PNG evidence through its
  normal navigation owner
- **AND** it does not list a Style Master JPEG or delivery-media artifact

#### Scenario: Retired JPEG projection diagnostics cannot be emitted

- **WHEN** an accepted Style Master selection is replayed under the current
  layout
- **THEN** the CLI returns the selection result or another current owner-issued
  lifecycle diagnostic
- **AND** it does not emit the retired projection failure or a command to replay
  a JPEG projection
