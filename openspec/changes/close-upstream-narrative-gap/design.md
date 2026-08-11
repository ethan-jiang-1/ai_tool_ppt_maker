## Context

See [proposal.md](proposal.md) for the motivation and scope. C1 already defines
`story-outline`, `design-constraints`, and the story-to-page-source flow, but
marks their C3 producer as planned. The current Run Bundle instead exposes an
undefined `2_backbone/outline.md`; `design-constraints.md` is a broad checklist;
and the create-deck Controller moves from intake to Page Source authoring.

The existing stable-ID source editor and target structural publisher already
provide the essential integrity machinery: a preview binds canonical source
bytes and a plan hash, then apply revalidates before writing a clean target.
C3 must reuse that machinery. It must not let an LLM-like pagination choice
become hidden JS policy, and it must not use Run Bundle production data as a
development fixture.

## Goals / Non-Goals

**Goals:**

- Give a Deck Author a canonical, human-readable, Block-first argument and
  content-boundary source before page authoring begins.
- Let the Agent make the creative page-grouping decision while JS validates its
  grounding and compiles one reproducible, provenance-carrying exact plan.
- Publish canonical Page Source only after one conversational content/structure
  confirmation and existing exact-plan integrity checks.
- Replace the active ambiguous outline path completely, and materialize C3's
  schema owners, templates, layout, and Controller ordering together.

**Non-Goals:**

- A code-generated story, automatic creative selection of page groupings, or a
  prompt/provider API.
- Page Class, layout profiles, text-density policy, or a new visual system;
  C4 owns those decisions.
- New lifecycle state, approval/evidence records, retries, fallback readers, or
  a migration/compatibility route for `outline.md`.
- Reading, writing, inspecting, migrating, or deleting any historical
  `deck_*` or `dpt_*` object during implementation or verification.

## Decisions

### 1. Two readable backbone sources, one defined content boundary

`2_backbone/story-outline.md` replaces `outline.md`. Its source grammar uses
current `schema: story-outline` frontmatter, then human-readable Markdown for
the central claim, audience outcome, and ordered Blocks. Each Block has one
heading and closed labeled values for its audience question, argument function,
evidence/reasoning beats, and intended inclusive page range. Ordinal plus
heading identifies a Block for provenance; it is not a second deck identity.

`2_backbone/design-constraints.md` retains the same Markdown-first approach
under current `schema: design-constraints` frontmatter. Its closed sections are
Audience, Language and Tone, Forbidden Claims, and Required Terminology. The
parser accepts content text and ordered lists, then returns a normalized
snapshot; it rejects a visual-language selector, geometry, PAGE CLASS, or
per-page density rule as an ownership error with Deck Author repair language.

The new `scripts/01-content/internal/narrative_source.mjs` is the deterministic
owner of this grammar and normalization. It receives explicit texts/paths from
its caller, never scans a Deck. `bundle_layout.mjs` remains the only owner of
where the two sources live. C3 adds their current wire-schema declarations to
`serialization-contracts.yaml`, and makes the existing stage/flow definitions
materialized with real anchors rather than inventing a second schema home.

Alternative considered: retain `outline.md` as an alias and parse it leniently.
Rejected: it would preserve an unexplained active source contract and violate
the route's clean-cutover decision.

### 2. Agent-authored candidate, deterministic compiler

The Agent, not JS, decides how Blocks and beats group into pages and supplies a
candidate under the current version's `_scratch/`. The candidate contains the
proposed ordered pages, each page's complete Page Source content, selected
Block/beat references, and any newly needed mnemonic ID. It is an ephemeral
input to the compiler, not author-facing Source Data, a persistent page order,
or an alternative route to provider work.

`narrative_page_plan.mjs` will parse the three canonical inputs plus that
candidate, validate that every page maps to declared Block/beat lineage and
respects its intended range, compile the target Page Source, and invoke the
existing Page Source parser to ensure the candidate can become current source.
It returns an immutable JSON-safe plan with SHA-256 bindings for the Story
Outline, Design Constraints, Visual Language, candidate, current source, target
workflow, and full target source. A re-run with the same bytes returns the same
plan hash.

The plan writer stores the preview under the current `_scratch/` with confined,
deterministic paths. It is disposable and never read as authority after its
bound inputs change. The plan's lineage is the visible C3 provenance proof; no
new receipt or state field is necessary.

Alternative considered: derive page grouping directly from the Blocks in JS.
Rejected: grouping and page language are creative decisions and are explicitly
owned by the Agent. A deterministic compiler gives reproducibility without
pretending to make that judgment.

### 3. Reuse the structural publisher instead of adding a narrative writer

`ppt_flow slides narrative-plan <run-dir>` will validate the Agent candidate,
write only the confined preview, and report the plan hash plus the pages and
their bounded lineage. `ppt_flow slides apply-plan` remains the only mutation
form: it requires `--apply`, the exact returned hash, current matching bindings,
and current target structural checks. No direct-source-write, force, migration,
or provider option is added.

For the initialized but never-authored source draft, publication may replace the
known initial source in place only after the same exact-plan and source-byte
checks prove that no source receipt, state evidence, or derived/provider
artifact exists. For any authored/current version, the existing target
structural publisher creates the clean vNext source and fresh debt. Both cases
share the compiler and exact-plan verifier; neither creates provider work.

The initial-draft exception avoids creating a disposable v1 merely to populate
the first requested deck, while its evidence-absence precondition prevents an
in-place overwrite from becoming a general shortcut around structural
versioning.

### 4. Controller sequence adds one content checkpoint, not a new controller

The create-deck playbook becomes:

```text
intake -> Story Outline + Design Constraints -> workflow and Visual Language
-> Agent candidate -> narrative-plan preview -> Deck Author confirm
-> exact Page Source publication -> existing source validation -> existing flow
```

The Agent explains a candidate and plan conversationally, prepares repairs, and
runs normal deterministic checks. The Deck Author decides whether the proposed
argument-to-page structure is correct. The runtime owns parsing, hashes, source
publication, stable IDs, and diagnostics. The controller stores no plan state
and does not duplicate `slides` checks or current State facts.

The confirmation is `confirm` under
`human-centered-gates.md`: it is a new content/structure choice, not routine
work. A missing field that can be filled from already supplied content is a
`guide`; an otherwise missing content decision returns one recommended
question. Input drift, invalid source/identity, target conflict, and hash
mismatch are `hard-stop`s protecting source integrity, stable identity, exact
target ownership, and recoverability. The safe recovery in every hard-stop is
to repair the direct source or candidate and rerun the same narrative preview.
No confirmation is persisted as a second authority or used as provider
authorization.

### 5. Tests follow the direct fact path

- **Unit:** source grammar/normalization; content-boundary rejection; candidate
  lineage/range validation; deterministic plan hashes; and each stale binding
  failure. The negative cases prove no output/source mutation.
- **Integration:** temporary initialized bundles exercise seed/layout checks,
  `slides narrative-plan`, exact `apply-plan`, initial-draft publication, and
  an authored-version vNext publication. They assert no provider call, no
  acceptance inheritance, and source-parser validity.
- **Controller/E2E:** a mock create-deck journey verifies narrative authoring
  precedes page source and that a story revision invalidates the preview without
  writing source or asking for a redundant authorization. No real E2E or paid
  provider work is selected.
- **Schema/docs:** the existing schema-conformance sweep verifies materialized
  C3 owners and current serialization declarations; focused lexical/layout
  tests prove active source no longer names `outline.md`.

## Risks / Trade-offs

- **Candidate is creative but invalid.** The compiler returns the first bounded
  direct failure with its Block/beat location and requires no manual repair of
  a derived plan.
- **Narrative changes after a review.** Input digests invalidate the preview;
  a stale exact-plan apply stops before mutation rather than silently using an
  old story.
- **Initial draft exception broadens mutation rights.** Its precondition is
  deliberately narrower than a normal version: known initial bytes and absence
  of source/state/derived/provider authority. All other source structures use
  vNext publication.
- **Two editable descriptions diverge.** The source pair has non-overlapping
  fields, one parser/normalizer each, and page-plan provenance names both
  digests; no copied values are stored in State.
- **Old run data has an outline file.** C3 removes the active path but never
  reads or alters historical production bytes. A current operation does not
  infer an alternate source or offer migration.
