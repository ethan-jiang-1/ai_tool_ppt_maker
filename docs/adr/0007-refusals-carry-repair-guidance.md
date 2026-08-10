# Every Refusal Carries Repair Guidance In The Author's Terms

Status: Proposed

A schema defines what is valid. It does not, by itself, tell anyone what to do
when their work is not. We are adopting the schema-first model described in
[ADR 0006](0006-define-production-schemas-in-yaml.md) while the person using the
Harness is a Deck Author who knows none of its vocabulary — so every refusal
must name the next action in that author's terms, not only the rule it
violated. A validation result that says which field failed is incomplete
output, not correct output.

## Why

The Harness is used through a heavily interactive conversation, not through a
command line an operator has learned. The author owns content and judgment and
nothing else; process knowledge is the Agent's job and evidence is the
Harness's. That division only holds if a refusal hands back a content decision.
"`**PAGE CLASS**` must be one of standard, opening, transition, closing" is a
vocabulary problem the author cannot act on. "This page reads like a section
divider — shall I mark it as a transition?" is a content decision they can.

The risk is specific to the direction we are taking. Nineteen written schemas
and a drift test make it easy and satisfying to build a strict validator, and
strictness is genuinely the right property for the *rules*. The failure is in
the *response*: a system that is correct and unhelpful converts every author
mistake into a support request to the Agent, and the author learns that the
tool blocks rather than helps. That is the opposite of what the Harness is for.

## Trade-off accepted

Guidance is coupled to the schema it belongs to, so a schema change can leave
its guidance stale in a way no type check catches. We accept that over the two
alternatives.

Keeping validation pure and putting all guidance in the Agent layer was
rejected because it makes helpfulness depend on the Agent reconstructing intent
from an error code — the reconstruction is lossy exactly where the rule is
subtle, which is where help is most needed. Making validators lenient was
rejected outright: the Harness's value is that its evidence can be trusted, and
a validator that guesses at intent produces evidence that cannot be.

## Consequences

Guidance is part of a schema definition, authored alongside the rule, and it is
the definition's job to state what a violation means for the author. Wherever
this shows up in derived data, it is a Collaboration Projection: it helps the
author decide and it never authorizes, records, or gates anything.

This does not soften a Hard Stop. An operation whose identity, integrity,
attributable execution, security, or recoverability cannot be established still
refuses, without exception. What changes is that it also says what to do next.
