# Retired Deck Source Contract

## Purpose

This retired capability has no current requirements. Page Authority source is the
only current production grammar; historical source bytes are observer/adoption
input only.

## Requirements

### Requirement: HTML deck source remains retired
The retired HTML deck source contract SHALL NOT publish a current plan, source receipt, or production
adapter. Historical source bytes SHALL be read only by the observer/adoption boundary.

#### Scenario: A source is selected for current production
- **WHEN** normal production resolves a source document
- **THEN** it accepts the Page Authority grammar and does not route through the retired HTML contract
