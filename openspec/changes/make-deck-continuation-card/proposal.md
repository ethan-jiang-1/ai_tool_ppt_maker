## Why

When a deck run bundle is finished or paused, the only way to resume it in a fresh
(cleared/disconnected) chat is technical: the user must know the deck path, the framework
path, and run `ppt_flow state <run-dir>`. A non-technical user who just wants to say
"continue this deck", "rebuild slide 7's image", or "make a v2 with these changes" has no
single, portable file they can drag into a new conversation. The deck root already has the
right pieces (`deck-guide.md`, `AGENTS.md`/`CLAUDE.md` thin pointers, `_state/state.yaml`,
and the `ppt_flow state`/`status` resume card), but they are exposed as in-bundle operating
docs and CLI navigation rather than as one user-facing handoff.

This change ports the **spirit** of another framework's run-bundle "continuation card" —
**not its literal mechanism**. The spirit: leave ONE portable, user-facing card in every
deck so a user can attach that single file to a brand-new chat and state a continuation
request in plain language. The card establishes identity (which deck + which framework); it
never establishes authority. The Agent reads authoritative state every time, so the card
never has to — and never must — carry current status.

The direction is chosen over alternatives (a new `CONTINUE.md` root file, a schema/marker
migration, or a new attachment-preflight CLI) because our deck root already admits
`deck-guide.md` + `AGENTS.md`/`CLAUDE.md`/`README.md`, legacy decks without these already
remain structurally valid, and the existing `ppt_flow state/status` already is the
"where-am-I" resume. Reusing those surfaces is strictly simpler than adding new ones.

### Control-impact (protected invariant)

- posture: applicable — **framework maintenance** (modifying `PPTMAKER_FRAMEWORK` source).
- direct authorities: `_state/state.yaml` + `ppt_flow state`/`status` for the current
  position; `PPTMAKER_FRAMEWORK/AGENTS.md` + `ppt_flow` commands for procedure/meaning;
  deck-root `deck-guide.md` for static identity and navigation only.
- protected invariant: the continuation card SHALL identify one exact deck and its owning
  framework but SHALL NOT select a route, alter state, grant approval, or replace a human
  decision.
- minimum human decision: the user's existing natural-language request (continue / revise /
  rebuild / make a version / start a new deck). No new confirmation is introduced.
- policy citations: outcomes are classified per
  `openspec/policies/human-centered-gates.md` (the read-only structure check is a bounded
  diagnostic that never auto-repairs; a missing path is a request, not a gate bypass); the
  control path follows `openspec/policies/agent-assistance-and-control.md` (direct authority
  = the attached file's parent directory + the fixed framework relation; the Agent performs
  mechanical resolution and routing; the only genuine human decision is the plain-language
  request); quality control follows `openspec/policies/simple-reliable-control.md` (the new
  behavior composes the existing read-only structure check with the existing resume — it adds
  no new validator, state field, version marker, or CLI).

## What Changes

- Re-role deck-root **`deck-guide.md`** into the portable continuation card. Add a prominent
  plain-language "attach this file to a new chat + say what you want" invitation and a static
  deck identity plus a fixed framework relation: the deck root is the parent directory of the
  attached file, and the framework is the project-owned `PPTMAKER_FRAMEWORK` resolved by that
  fixed relative relation. The card stays **static**: it must not present the current
  version/node/gate status or next action as truth. Any version reference it carries is
  labeled non-authoritative, and it tells the user the Agent obtains the latest status from
  `_state` automatically.
- Keep deck-root **`README.md`, `AGENTS.md`, `CLAUDE.md`** as thin pointers that route to
  `deck-guide.md` (`AGENTS.md`/`CLAUDE.md` already do this today). **No new root file** is
  introduced.
- Add **path-preserving attachment resolution** as Agent entry/resume behavior — **not a new
  CLI**. When a user attaches the card to a fresh session, the Agent follows a bounded,
  zero-write read path: verify the attachment is a real regular file whose parent is a
  marker-bearing deck root, resolve the fixed framework relation, run the existing read-only
  `bundle_layout --check --structure-only`, load `deck-guide.md`, and read
  `_state/state.yaml` + `ppt_flow state`/`status`. Copied bytes with no original local path
  produce a bounded request for the real file or an explicit deck path; the Agent never
  chooses a deck by name, recency, or filesystem search. A completed/closed deck's card
  routes the user to the existing rerun / new-version / new-deck path; it does not reopen the
  closed bundle or treat a chat request as delivery authority.
- Seed the continuation-card content through the existing `initBundle` producer and keep
  `workflow/00-setup/template-deck-guide.md` aligned, **create-if-absent only**. Existing
  production `deck_*` directories are never auto-rewritten; legacy decks without the new
  content remain valid and inspectable under their existing bytes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `run-bundle-layout`: deck-root file roles — declare `deck-guide.md` as the static portable
  continuation card (identity + fixed framework relation + plain-language attach invitation;
  no current status), and `README.md`/`AGENTS.md`/`CLAUDE.md` as thin pointers to it; no new
  root file.
- `run-bundle-management`: `initBundle` seeds the continuation-card content into
  `deck-guide.md`; `workflow/00-setup/template-deck-guide.md` stays aligned; `checkBundle`
  remains read-only and is explicitly not an attachment verifier; create-if-absent seeding
  only, legacy decks stay valid (no marker, no migration).
- `framework-charter`: Agent entry/resume behavior — the bounded, zero-write path-preserving
  attachment resolution and plain-language continuation handoff that feeds the existing
  `ppt_flow state`/`status` resume; copied-bytes-without-path bounded request; completed-deck
  forward routing.

## Impact

- `PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs` — deck-root file-role
  text/constant alignment; `checkBundle` read-only semantics unchanged.
- `PPTMAKER_FRAMEWORK/workflow/00-setup/template-deck-guide.md` and the `initBundle`
  deck-guide seed — continuation-card content.
- `PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md` (session-resume / "已有 deck / 断线 / 清聊天"
  section: attach-card entry) and `BOOTSTRAP.md` (entry note).
- `PPTMAKER_FRAMEWORK/reference/glossary.md` / quick-start — continuation-card term as
  needed.
- Fresh-temp-deck tests only (no production `deck_*` data touched); OpenSpec validation.
- No runtime/dependency change, no version bump, no production `deck_*` mutation, no new CLI.
