# Retired Deck Rendering Contract

## Purpose

This retired capability has no current requirements. The private Framed runtime
supports Page Authority finalization only and does not restore a deck-rendering
route.

## Requirements

### Requirement: HTML deck rendering remains retired
The retired HTML deck-rendering route SHALL NOT publish current deck pages, final-slide artifacts, or
a production adapter. The retained Framed runtime is private Page Authority implementation detail.

#### Scenario: Current finalization is selected
- **WHEN** a current slide is finalized
- **THEN** Page Authority owns the final artifact and no HTML deck-rendering route is selected
