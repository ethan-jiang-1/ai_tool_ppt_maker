## Context

The framework creates a run bundle outside `PPTMAKER_FRAMEWORK`, so neither a fixed sibling
path nor an attachment file's parent is a universal locator. The run bundle already owns two
different concerns: `deck-guide.md` is the detailed in-bundle operating guide, while
`_state/state.yaml` owns active execution identity. A portable handoff needs a third,
strictly static concern: local location of the deck and framework.

The prior implementation conflated these responsibilities. It replaced the guide with a card,
made byte-only handoff impossible, and still could not name the framework directly. This design
separates the three owners.

## Goals / Non-Goals

**Goals:**

- Let a novice give one `RUN_BUNDLE.md` to a repository Agent and say what they want to do,
  without knowing either local root.
- Keep card location, guide procedure, and current execution state under separate owners.
- Resolve only explicitly named paths and one state-owned exact version; never scan or infer.
- Preserve legacy bundle validity and never rewrite existing production decks.

**Non-Goals:**

- Support a chat host that cannot access the local filesystem named by the card.
- Add an attachment-preflight CLI, a generic state setter, a version marker, a root migration,
  or an automatic card-refresh command.
- Put live mode, version, node, gate, digest, command menu, or approval in the manifest.

## Decisions

### D1 - `RUN_BUNDLE.md` is a locator manifest; `deck-guide.md` remains the guide

**Owner: run-bundle-layout / run-bundle-management.** Fresh init creates
`<deck-root>/RUN_BUNDLE.md` only when absent. It is a regular root control, but legacy bundles
without it remain structurally valid. `deck-guide.md` regains its source ownership and operating
guidance; it is not rewritten into a locator. Root pointers route to both files in order:
locator first, operating guide second.

### D2 - The manifest contains three static anchors

**Owner: init producer.** A closed YAML frontmatter record contains:

```yaml
schema: pptmaker-run-bundle-v1
deck_root: /absolute/deck/path
framework_root: /absolute/PPTMAKER_FRAMEWORK/path
framework_relation: ../PPTMAKER_FRAMEWORK
```

`deck_root` and `framework_root` are the distinct canonical physical absolute paths measured
with `realpath` after init has created the bundle. `framework_relation` is the normalized POSIX
relative path measured between those same physical roots; it is nonempty, never absolute, and
has no redundant `.` or separator-normalization. The relation is a recovery anchor only after a
deck root is verified. Paths are locators, not authority, approval, state, or a command. The
prose body gives the human-facing handoff and labels this local information explicitly.

### D3 - One deep locator module owns manifest verification

**Owner: run-bundle-management, at the `run_bundle_locator.mjs` seam.** This module has one
external interface:

```js
resolveRunBundleLocator({
  manifestText,
  originalCardPath = null,
  requestedDeckRoot = null,
  requestedFrameworkRoot = null,
})
```

It returns either:

```js
{ kind: "resolved", deckDir, frameworkDir,
  deckSource: "declared" | "card-parent" | "requested",
  frameworkSource: "declared" | "relation" | "requested" }

{ kind: "guide", subject: "manifest" | "deck_root" | "framework_root",
  code: "manifest_invalid" | "deck_root_unavailable" | "deck_root_unverified" |
        "deck_root_conflict" | "framework_root_unavailable" |
        "framework_root_unverified" | "framework_root_conflict" }
```

The implementation hides frontmatter parsing, canonical-record comparison, physical-path
normalization, regular/non-symlink card checks, candidate ordering, framework sentinels, and
bounded failure classification. It owns no state read, version selection, structure check,
state write, CLI, path scan, or natural-language routing. The existing layout owner exposes the
narrow root-control check it needs; that check is shared with `checkBundle`, admits legacy
no-card roots, and does not itself inspect state or choose a version. Thus this module is the
single seam for static locator proof, not a second run-bundle or state evaluator.

The parser accepts exactly one document whose frontmatter has exactly the four scalar fields in
D2, rejects duplicate keys, aliases, extra documents, unknown fields, noncanonical paths and
relations, and compares cards by the normalized four-field record rather than prose or newline
bytes. A verified card is a regular non-symlink `RUN_BUNDLE.md` at the candidate root with that
same record. A verified framework root is a directory containing the regular files
`scripts/ppt_flow.mjs`, `scripts/shared/run-bundle/bundle_layout.mjs`, and
`scripts/shared/state/state.mjs`. Every result is zero-write and exposes only the enumerated
`guide` codes to its caller.

Init resolves and verifies the canonical framework root and those sentinels before it creates any
deck file. It then creates the deck root and measures its physical root before rendering the
card; a failed proof creates no card and leaves no partial handoff manifest.

### D4 - Resolution is bounded, relocation-aware, and verification-first

**Owner: framework-charter / MD<->JS protocol.** The module tries the declared canonical deck
root first. If it is unavailable, but only then, it tries the parent of an original readable
regular non-symlink card path with the same canonical record; finally it can try a
human-explicit requested deck root with that same proof. A present candidate whose card record
conflicts is a `deck_root` guide and stops the candidate chain. No candidate is inferred from
the current working directory, directory enumeration, deck name, recency, or framework
adjacency.

For a deck resolved at its declared root, the module verifies the direct framework root and the
relation target against the same physical root whenever both are accessible; a disagreement is a
`framework_root` guide. If the direct framework root is stale, the relation is the only automatic
framework fallback; if both are unavailable or unverified, a human-explicit requested framework
root is the final candidate. If the deck itself was recovered through `card-parent` or `requested`, the
recorded relation describes the old topology and is not reinterpreted: a still-valid declared
framework root may be used directly, otherwise a human-explicit framework root is required.
This permits a deck-only relocation without silently choosing a nearby framework, while a
framework-only relocation can still use the measured relation. It never searches adjacent
directories.

A `*_conflict` guide means the supplied card and an accessible candidate disagree, not that a
different path may silently override the proof. The Agent asks for the current `RUN_BUNDLE.md` or
for the conflicting local card/root to be repaired, then starts a fresh resolution; it does not
continue the same candidate chain. An `*_unavailable` or `*_unverified` guide names the one
explicit root or local repair needed before the same resolver is retried.

Only after both roots are verified does the state owner read `run_version` or
`continuation_target_version`, form one exact run, run `bundle_layout --check <run-dir>
--structure-only`, and invoke state/status. Current card bytes do not select a version.

### D5 - State remains the sole inactive version selector

**Owner: node-specification.** The existing durable `continuation_target_version` remains
valid: active normalized `run_version` wins, otherwise a visible normalized target is used.
Init, exact version publication, and terminal handoff are its only writers. This change does
not add a second state parser, selector, CLI, or version scan.

### D6 - Relocation and privacy have explicit limits

Absolute local paths are necessary for the novice handoff and may expose local path names.
The card states that it is for a local repository-agent session. A deck move is recoverable only
when the original card path supplies its parent or the user provides an explicit deck root. A
framework-only move may use the relation only while the declared deck root remains valid; a
deck-only move may retain a still-valid declared framework root; a double relocation needs an
explicit framework root. Byte-only attachment plus stale absolute paths cannot be magically
recovered and receives a bounded guide.

## Risks / Trade-offs

- [Card bytes name an unrelated path] -> verify the on-disk card by canonical record, shared
  root controls, and fixed framework sentinels before any state/status invocation; card fields
  never grant approval.
- [A deck relocation makes a stored relation stale] -> use relation only when the declared deck
  root remains the verified physical root; otherwise retain a verified direct framework root or
  request one explicit root.
- [Absolute paths leak outside the intended local session] -> call the paths local locators and
  do not claim remote-chat support. No secret or credential is emitted.
- [Guide/card drift] -> separate producers and tests: a guide test protects its retained
  operating content; manifest tests protect its closed static fields.
- [Legacy breakage] -> whitelist `RUN_BUNDLE.md` but do not require it in checkBundle.

## Verification Strategy

- Unit/integration: initialize all current modes/deck types in fresh temporary decks and check
  absolute anchors, normalized relation, manifest schema, root-pointer roles, and preserved
  guide content.
- Negative: no normal command rewrites an existing card; root checks accept legacy absence;
  exact structure checks do not select a deck/run; malformed, stale, symlinked, or conflicting
  anchors produce one enumerated bounded no-write guide and no search. An unprovable init
  framework root produces no deck card.
- Locator black box: from an unrelated cwd, consume only `RUN_BUNDLE.md` bytes plus accessible
  local paths, resolve one exact run through the state owner, and prove active/terminal
  precedence, canonical-record equality, deck-only/framework-only relocation behavior, and
  zero state writes. Attachment-host integration itself remains outside this repository.
- Release: focused tests, full `npm test`, strict OpenSpec validation, `git diff --check`, and
  an audit that no production `deck_*` data changed.
