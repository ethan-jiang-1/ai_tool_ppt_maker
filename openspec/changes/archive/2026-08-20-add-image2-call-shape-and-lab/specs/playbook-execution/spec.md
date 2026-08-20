## MODIFIED Requirements

### Requirement: probe-image-channels playbook runs doctor channel体检

`probe-image-channels.md` SHALL remain the shared Image2
declared-Call-Shape connectivity controller. It SHALL orchestrate intake,
offline doctor/preflight presence, disclosure that `ppt_flow probe <run-dir>`
will make exactly one shared-executor submit of the confirmed page-image Call
Shape, and a bounded Summary. Entering this playbook with a confirmed profile
is the Work Request for that one submit; the playbook SHALL NOT re-confirm per
HTTP call or clone `image2 authorize`. Optional configuration writing requires
a separate human confirmation and SHALL not write secrets automatically. The
playbook SHALL NOT imply an alternate multi-vendor configuration format, walk
vendors, or invoke `--smoke` / `--probe-vendors`.

If the exact run has no confirmed Call Shape, the playbook SHALL stop before
probe, name Image2 Lab as the discovery owner, and make zero live calls.
Declining the connectivity Work Request SHALL make zero live calls and SHALL
NOT invalidate offline foundation evidence.

After an optional configuration write, the playbook SHALL report the saved
decision without automatically invoking a second readiness command. A later
verification request enters the normal foundation route, or the documented
direct recovery entry only when the normal entry is unavailable. A successful
probe proves declared-Call-Shape connectivity only; it SHALL not approve
production, create page authorization/state, or authorize a later provider
attempt.

#### Scenario: Channel probe intent selects probe-image-channels

- **WHEN** the user asks whether the confirmed Image2 Call Shape can still
  retrieve a PNG
- **THEN** routing selects `probe-image-channels`
- **AND** the playbook discloses exactly one confirmed submit before running
  `ppt_flow probe <run-dir>`

#### Scenario: User confirms all-vendor probe

- **WHEN** the user asks which Image2 channels or candidate Call Shapes work
- **THEN** the playbook does not invoke `doctor --probe-vendors` or walk a
  vendor list
- **AND** candidate discovery is Lab while confirmed connectivity is one
  `ppt_flow probe <run-dir>` submit

#### Scenario: Pending profile is sent to Lab

- **WHEN** the exact run has no confirmed page-image Call Shape
- **THEN** the playbook does not invoke `probe`
- **AND** it names the Lab playbook as the next owner

#### Scenario: User declines live diagnosis

- **WHEN** the user declines after the one-submit disclosure
- **THEN** the Agent does not invoke `probe`
- **AND** zero provider submits occur

#### Scenario: Report-only short path skips confirm-write

- **WHEN** the user wants only a connectivity report
- **THEN** the Agent presents the probe report
- **AND** it does not write configuration or a lesson

#### Scenario: Channel health does not authorize page work

- **WHEN** a confirmed live probe succeeds
- **THEN** no production authorization or page-refinement state is created
- **AND** any later provider-generating action remains subject to its owner
  gate and exact authorization contract

#### Scenario: Confirm-write does not trigger a hidden recheck

- **WHEN** a probe report is followed by a confirmed configuration write
- **THEN** the playbook reports that write without invoking another doctor or
  provider probe
- **AND** a later check requires an explicit route and any new live work needs
  a new Work Request

### Requirement: Agent retains bounded current Image2 channel-probe guidance

When current Style Master or Page Image provider-path symptoms occur -- such as
failed image checks, an Image2 API/relay failure, or a report that image
generation is unavailable -- and no channel probe has run in the session, the
Agent SHALL offer one concrete next action: `probe-image-channels` when a
confirmed Call Shape exists, or the Image2 Lab playbook when the question is
which candidate can retrieve a PNG. It SHALL not respond only with an unbounded
instruction to check an API, run an undisclosed live probe, invoke retired
`--smoke` / `--probe-vendors`, or treat a successful probe or Lab trial as
page-cost authorization, review acceptance, or progress evidence.

#### Scenario: First current provider-path failure offers a bounded probe

- **WHEN** current Page Image or Style Master work fails with a provider-path
  symptom and no session probe has run
- **THEN** the Agent offers one concrete channel-probe or Lab action that the
  human may accept or decline
- **AND** it does not create a page plan, grant, provider attempt, or review
  decision from the offer or its result

## ADDED Requirements

### Requirement: Call Shape discovery uses the Image2 Lab playbook

Registered playbook routing SHALL send "which candidate Call Shape can retrieve
a PNG" to the Image2 Lab playbook, not to `create-deck`, `probe-image-channels`,
or `image2 generate`. The lab playbook SHALL remain outside the create-deck
node graph.

#### Scenario: Discovery intent does not enter create-deck

- **WHEN** the user asks to find a working Image2 Call Shape for this vendor
- **THEN** routing selects the lab playbook
- **AND** it does not start create-deck or generate
