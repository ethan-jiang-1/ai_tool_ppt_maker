## ADDED Requirements

### Requirement: Style Master candidate authorization is mandate-covered Agent work

The create-deck Style Master authorize nodes
(`authorize-target-framed-style-master`, `authorize-target-pure-style-master`)
SHALL be completed only by the matching state-owned `cli` evidence from an exact
style-master grant, the same way the Page Image Pilot and Expansion authorize
nodes are. An active Task Mandate covers the ordinary provider cost of a
disclosed candidate count (at most 4, chosen by the Agent), so the Agent SHALL
select the count, publish the candidate plan, and record the exact grant without
asking the human to re-confirm that cost. The human visual decision on the
generated candidates remains the `review-target-*-style-master`
`proceed | repair | redirect` gate; it SHALL not be merged into, or replaced by,
the authorization step, and no decision in this sequence authorizes Page Image
raw work. A different Deck or goal, an explicit human limit, or a genuinely new
consequential content or design direction SHALL still ask one bounded question
before a replacement scope is established.

#### Scenario: Style Master candidate cost is not a repeated human question

- **WHEN** a current create-deck route needs generated Style Master candidates
  and an active Task Mandate covers the ordinary provider cost
- **THEN** the Agent records the exact grant and proceeds to generation without
  asking the human to authorize the disclosed cost
- **AND** the human still receives the generated candidates under one
  `proceed | repair | redirect` review decision

#### Scenario: Style Master review stays a visual decision

- **WHEN** generated Style Master candidates are presented for review
- **THEN** the Controller records `proceed`, `repair`, or `redirect` as the
  visual-direction decision
- **AND** it does not treat that decision as a grant, Page Image raw
  authorization, or complete-page acceptance

#### Scenario: A changed goal or explicit limit asks one real question for Style Master

- **WHEN** a Style Master candidate authorization targets a different Deck or
  goal, exceeds an explicit human limit, or needs a genuinely new consequential
  content or design direction
- **THEN** the Controller pauses normal mandate continuation and presents the
  smallest precise human decision before a replacement scope is established
- **AND** it does not use a prior Task Mandate to submit the changed work
