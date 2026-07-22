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

`deck_root` and `framework_root` are normalized absolute paths measured at init. The relation
is normalized POSIX and is only a fallback after a deck root is already verified. Paths are
locators, not authority, approval, state, or a command. The prose body gives the human-facing
handoff and labels this local information explicitly.

### D3 - Resolution is bounded and verification-first

**Owner: framework-charter / MD<->JS protocol.** The Agent parses only this closed manifest
record. It resolves the declared `deck_root` and verifies a regular non-symlink
`<deck-root>/RUN_BUNDLE.md` with the same static record. When that absolute root is stale, an
original readable card path may supply its parent as the one fallback candidate; otherwise the
result is a no-write guide for an explicit deck root. It never searches for a deck.

The Agent resolves `framework_root` directly and verifies the expected framework scripts. If
that anchor is stale, it evaluates `framework_relation` from the verified deck root; if still
invalid it requests one explicit framework root. It never searches adjacent directories.

Only after both roots are verified does the state owner read `run_version` or
`continuation_target_version`, form one exact run, run `bundle_layout --check <run-dir>
--structure-only`, and invoke state/status. Current card bytes do not select a version.

### D4 - State remains the sole inactive version selector

**Owner: node-specification.** The existing durable `continuation_target_version` remains
valid: active normalized `run_version` wins, otherwise a visible normalized target is used.
Init, exact version publication, and terminal handoff are its only writers. This change does
not add a second state parser, selector, CLI, or version scan.

### D5 - Relocation and privacy have explicit limits

Absolute local paths are necessary for the novice handoff and may expose local path names.
The card states that it is for a local repository-agent session. A deck move is recoverable only
when the original card path supplies its parent or the user provides an explicit deck root; a
framework-only move may use the relation or one explicit root. Byte-only attachment plus stale
absolute paths cannot be magically recovered and receives a bounded guide.

## Risks / Trade-offs

- [Card bytes name an unrelated path] -> verify the on-disk card, root controls, and expected
  framework scripts before any state/status invocation; card fields never grant approval.
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
  exact structure checks do not select a deck/run; stale or conflicting anchors produce no
  write and no search.
- Locator black box: from an unrelated cwd, consume only `RUN_BUNDLE.md` bytes plus accessible
  local paths, resolve one exact run through the state owner, and prove active/terminal
  precedence. Attachment-host integration itself remains outside this repository.
- Release: focused tests, full `npm test`, strict OpenSpec validation, `git diff --check`, and
  an audit that no production `deck_*` data changed.
