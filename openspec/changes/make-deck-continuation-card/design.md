## Context

A deck run bundle (`deck_{NAME}/`) already has every piece a user needs to resume work in a
fresh chat: `deck-guide.md` (human + Agent operating card), `AGENTS.md`/`CLAUDE.md` (thin
pointers to the guide), `_state/state.yaml` (execution-pointer SSOT), and the
`ppt_flow state`/`status` resume ritual. What is missing is a **single portable handoff**: a
non-technical user cannot drag one file into a cleared/disconnected chat and say in plain
language what they want next without already knowing the deck path, the framework path, and
the resume command.

This change ports the **spirit** of another framework's run-bundle "continuation card"
(only the spirit — not its `RUN_BUNDLE.md`, version marker, or attachment-preflight CLI).
Our deck root already admits `deck-guide.md`, `AGENTS.md`, `CLAUDE.md`, and `README.md`
(`DECK_ROOT_ALLOWED`), and legacy decks without the Agent pointers already remain structurally
valid. We reuse those exact surfaces rather than adding new ones.

Decks live one level under the project root, so the fixed framework relation from a deck root
is `../PPTMAKER_FRAMEWORK` (the project-owned soft bundle). The deck root is the parent
directory of an attached `deck-guide.md`, which makes the attachment path the natural run
anchor.

## Goals / Non-Goals

**Goals:**

- Make `deck-guide.md` the one portable, user-facing continuation card that a user can attach
  to a fresh chat with a plain-language request.
- Bind a path-preserving attachment to exactly one deck and its framework without the user
  restating either path.
- Keep current status, command meaning, business authority, and state mutation under their
  existing owners (`_state/state.yaml`, `ppt_flow`, the human).
- Reuse the existing read-only structure check and the existing resume ritual — add no new
  CLI, validator, state field, or version marker.

**Non-Goals:**

- A new root file (`CONTINUE.md`), a `RUN_BUNDLE.md`-style manifest, a card/schema version
  marker, an attachment-preflight CLI, or any bulk migration/rewrite of existing `deck_*`.
- Duplicating status, next action, gate state, or a command menu inside the card.
- Changing the MD Controller node graph, state schema, or any pipeline stage.
- Treating copied card bytes (no source path) as a resolvable deck.

## Decisions

### D1 — `deck-guide.md` is the card; `README.md`/`AGENTS.md`/`CLAUDE.md` stay thin pointers

**Owner: MD (content) + run-bundle-layout (file roles) + run-bundle-management (seed).**
`deck-guide.md` already invites plain-language edits ("改第5页文案"), carries the
source-ownership table, commands, and conventions, and is already the target of the
`AGENTS.md`/`CLAUDE.md` pointers. Promoting it to the attach-card reuses the richest existing
human surface. `README.md` remains the first-look structure pointer and also routes to
`deck-guide.md`.

- *Alternative: new `CONTINUE.md`.* Rejected — divides user entry from the existing guide,
  adds a root file and another maintenance surface, and contradicts the principle of one card.
- *Alternative: `README.md` as the card.* Rejected — it is a thinner structure/placement
  pointer; `deck-guide.md` is already the plain-language operating card and is the better
  drag-in artifact.

### D2 — Static identity + fixed framework relation; never status

**Owner: run-bundle-management (seed content) + MD.** The card carries deck identity and the
fixed `framework_relation: ../PPTMAKER_FRAMEWORK`, plus the plain-language attach invitation.
It stays static: any version reference is the init-time seed value and is explicitly labeled
non-authoritative, and the card tells the user the Agent obtains the current version/status
from `_state` automatically. It SHALL NOT carry current node, next action, gate status,
digest, or a second command menu.

- *Alternative: embed live status.* Rejected — duplicates `_state` authority and creates the
  stale-card trap (a card seeded at v1 is wrong after the deck advances to v3).

### D3 — Path-preserving attachment resolution is Agent entry behavior, not a CLI

**Owner: framework-charter (`AGENT_CONTRACT.md` §1 entry order) + MD⇔JS protocol.** When a
user attaches the card to a fresh session, the Agent follows a bounded, zero-write read path:
the attachment's parent directory is the claimed deck root; verify the attached object is a
real regular file named `deck-guide.md` whose parent is a marker-bearing deck root; resolve
`../PPTMAKER_FRAMEWORK` to the project's real direct-child soft bundle; run the existing
read-only `bundle_layout --check --structure-only`; then load `deck-guide.md` and read
`_state/state.yaml` + `ppt_flow state`/`status`. This feeds the existing resume ritual — it
does not replace it and adds no new node or state transition. Copied bytes with no original
local path produce a bounded request for the real file or an explicit deck path; the Agent
never selects a deck by name, recency, or filesystem search.

- *Alternative: a new attachment-preflight CLI.* Rejected — adds a CLI/validator surface that
  duplicates the existing structure check (violates `simple-reliable-control.md`).
- *Alternative: guess the deck from copied bytes.* Rejected — cannot resolve an exact run
  safely.

### D4 — `checkBundle` stays read-only and is not an attachment verifier

**Owner: run-bundle-management (JS).** The structure check validates the deck-root file set
and is zero-write. It does not verify how an Agent received a file (chat-attachment
provenance); that lives in the entry route, where the original local path exists. No new
validator is introduced.

### D5 — Create-if-absent seeding; legacy stays valid; no migration

**Owner: run-bundle-management (JS) + MD.** New decks receive the card content through the
existing `initBundle` deck-guide seed, kept byte-aligned with
`workflow/00-setup/template-deck-guide.md`. Existing production `deck_*` are never auto-
rewritten; a deck without the new content remains valid and resumable through the existing
explicit `ppt_flow state <run-dir>` route. This is the same pattern already used when
`AGENTS.md`/`CLAUDE.md` were added (legacy decks without them stay valid), so no version
marker is needed.

- *Alternative: bulk-migrate existing decks.* Rejected — production-data mutation.
- *Alternative: a card/schema version marker.* Rejected — our legacy-valid pattern already
  covers forward-only adoption without one.

### D6 — Completed decks still resolve, forward only

**Owner: framework-charter (MD).** A card for a terminal deck still resolves. The Agent reads
authoritative state/status, recognizes the terminal posture, and routes the user to the
existing rerun / new-version / new-deck path. Attachment does not reopen a closed bundle or
treat a chat request as delivery authority (consistent with "complete HTML delivery is a
terminal valid outcome").

## Verification strategy

This change touches framework executable code only in the `initBundle` deck-guide seed text
and its aligned template; the attachment-resolution contract is Agent/MD behavior with no new
public CLI or state-machine transition. Per the design rules each layer is evaluated, not
mechanically all-added:

- **Unit / integration (needed):** extend the existing seed-coherence suite (capability
  `run-bundle-management`, "Golden sample first-look READMEs match current seeds") to assert,
  across generic init and every active deck-type template in **fresh temporary decks**, that
  the seeded `deck-guide.md` and `template-deck-guide.md` carry the continuation-card content
  (attach invitation, static identity, fixed `../PPTMAKER_FRAMEWORK` relation, non-
  authoritative version label) and remain byte-aligned. No production `deck_*` data is used.
- **Negative tests (needed):** the seeded card SHALL NOT contain current status / next-action
  / node / gate fields; `checkBundle --structure-only` remains zero-write and unchanged in
  semantics; an existing deck is not rewritten by ordinary status/build/pipeline commands
  (create-if-absent).
- **E2E (not needed):** there is no new public CLI, MD Controller node, or state transition to
  drive end-to-end. The attachment path-preserving contract is Agent entry procedure over
  existing deterministic surfaces (structure check + resume), so it is verified by the doc +
  seed-coherence contract rather than an e2e state-machine test. Skipped deliberately.

## Risks / Trade-offs

- [Card drifts from template] → keep the `initBundle` deck-guide seed byte-identical to
  `template-deck-guide.md`; the seed-coherence test enforces it.
- [Card looks current when it is static] → forbid status/next-action fields; label the seeded
  version non-authoritative; the Agent reads `_state`/`ppt_flow status` every time.
- [Copied bytes mistaken for a resolvable deck] → path-preserving attachment contract only;
  copied bytes without a path return a bounded request, never a guess.
- [Deck relocated breaks the fixed relation] → `../PPTMAKER_FRAMEWORK` is fixed by design; if
  a deck is moved so the relation no longer resolves, the Agent reports it cannot safely
  resolve and asks for the real attachment or an explicit deck path (bounded), rather than
  guessing.
- [Existing deck lacks the card] → legacy-valid; resume via explicit
  `ppt_flow state <run-dir>` is unchanged.

## Migration Plan

New `deck_*` initialized after this change receive the card content; existing production
`deck_*` are untouched. Rollback removes the new seed text + template alignment + charter
clause before any new bundle is initialized; no production run data is altered, and no version
bump is required.

## Open Questions

None. The card remains Chinese/English mixed framework text with a plain-language request; the
active interaction profile determines the Agent's response language, unchanged by this change.
