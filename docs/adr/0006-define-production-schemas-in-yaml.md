# Define Production Schemas In YAML Outside The Code

Every production schema — what each stage of PPT generation hands to the next —
is defined once in YAML under the Harness Root, and the `.mjs` constants that
name those schemas become mirrors annotated with the definition they reference.
A schema present in code but absent from that directory is a defect a
regression test catches.

Status: Proposed

## Why

Roughly fifty schema identifiers existed only as string constants scattered
across `.mjs` files, never described in one place. Three consequences followed.
Nobody could see the data flow end to end, so design discussions happened
against code archaeology. The same artifact acquired different names at
different pipeline stages. And the upstream half of production — story,
outline, constraints, pagination — carried no schema at all and was invisible
to the flow, which is exactly where authors most need to see what the system
understood.

Three parties have to read these definitions: the human, the Agent writing them
into a prompt, and the deterministic JS validator. YAML is the smallest thing
all three read and write without an interpreter. Code is not, because reading it
requires following imports; prose is not, because JS cannot check it.

## Trade-off accepted

Two definitions of the same fact can drift. We accept that risk rather than
generating one from the other, because a generator would put code back in
charge of the vocabulary and reintroduce the problem. The drift is contained by
a test that enumerates schema constants across `.mjs` and fails on any name
without a YAML definition — cheap, and it fails at the moment of divergence.

## No schema versioning

Schema identifiers carry no `-v1` suffix. The root `VERSION` is the only
version number: it is the charter, and when the charter changes everything
changes with it. Of the fifty-odd identifiers, exactly one had genuine dual
versions; the rest were compared for exact equality, meaning the suffix was
identity noise that invited nobody-needed migrations. Supporting two schema
generations at once is a cost we are choosing never to pay.

## Consequence for derived data

Because all refinement after the first generation happens through conversation
with the Agent rather than by hand-editing files, the design criterion for
derived data is not human writability but Agent traceability: every derived
value records the configuration layer it came from, so the Agent can state
which pages a change affects and the human can check that claim instead of
trusting it.
