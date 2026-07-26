# Plan: Unify Image2 Page Authority

> Type: Architecture and delivery roadmap | Updated: 2026-07-26 | Status: Direction agreed; ready to split into three OpenSpec changes
>
> Historical input: [legacy whole-page contract hardening](../_done/_closed_plans/legacy-whole-page-image2-contract-hardening.md)

## Product Direction

The product has one active way to make a slide: an Image2 page with one declared final-pixel
authority. It has exactly two closed variants:

| Variant | Image2 owns | Local compositor owns | Finalization |
|---|---|---|---|
| `pure-image2` | The entire final page, including visible text | Nothing | Verified raw image passes through as the final slide |
| `framed-image2` | A text-free, full-canvas visual underlay | Typed kicker, title, subtitle, and callout frame | Verified underlay is locally composed into the final slide |

Both variants share the same page intent, visual system, provider authorization, review lifecycle,
final-slide manifest, PPTX assembly, and notes flow. The only semantic fork is whether a local Text
Frame exists.

`framed-image2` is not the historical `body+header-lock` route: Image2 must never be asked to draw
fields owned by the frame. It is also not `html-then-image2`: HTML is an internal deterministic
composition mechanism, not a second user-facing production family.

The future source/state pair is expected to identify one Page Authority Image2 protocol, with a
deck default and an explicit per-slide `pure-image2` or `framed-image2` choice. The exact serialized
marker names belong to Change 1's OpenSpec design, not to this backlog plan.

## Non-Negotiable Rules

1. A final visible field has one owner. Provider instructions and local composition never both claim
   the same text or panel.
2. A Framed underlay is full canvas and text-free. The local frame is deterministic, typed, and has
   no slide-authored CSS, geometry, fonts, or markup escape hatch.
3. A Pure text change changes provider material and requires fresh authorization/render/review. A
   Framed text-only change is local, provider-free work but still renews final delivery evidence.
4. `slide_id` remains stable identity. Changing a page variant is versioned source work, never an
   inference from a legacy render mode, image filename, or historical state record.
5. The provider boundary stays explicit and scoped. Preview, adoption, structural materialization,
   and local composition make zero provider calls unless a separately authorized render is selected.
6. New production does not expose `html-first`, `html-then-image2`, `full-page`, or
   `body+header-lock` as choices. Historical runs remain readable only long enough to adopt them.

## Target Shape

```text
canonical source + visual system
             |
             v
     Page Authority resolution
          /              \
         v                v
  pure-image2       framed-image2
  provider page     text-free provider underlay
         |                |
         +-------+--------+
                 v
       finalization seam
       pass through | compose Text Frame
                 |
                 v
     final-slide manifest -> review -> PPTX -> notes
```

The finalization seam is deliberately small. Its callers provide a verified raw result and the
receipt-resolved page facts; they do not choose browser settings, CSS, file paths, or provider
options. The Framed compositor is therefore a deep module: all local rendering complexity is behind
one interface and the same interface is the test surface.

## OpenSpec Change Sequence

### Change 1: `add-page-authority-image2`

**Purpose:** deliver the new protocol end to end for new production while old protocols still remain
available for existing runs.

**It changes:**

- Source parsing and validation to resolve the closed Pure/Framed page choice, a deck default, and
  typed Text Frame fields.
- Stage 1 contracts so Pure submits complete page material while Framed submits a text-free visual
  underlay contract plus a separate local frame contract.
- Image2 generation, authorization, raw/final fingerprints, manifests, review, PPTX assembly, and
  notes so both variants converge on one final-slide artifact model.
- A Page Authority resolver, state/pipeline registration, CLI and playbook route for new decks.
- A Framed compositor that may reuse the pinned HTML runtime internally but does not expose an
  HTML-first source, asset catalog, or visual-slot path.

**Primary OpenSpec capability owners:** `content-parsing`, `image-production`, `header-lock` (replaced
by the Framed composition responsibility), `pipeline-orchestration`, `node-specification`,
`cli-surface`, `pptx-assembly`, `notes-injection`, `run-bundle-layout`, `run-bundle-management`,
`slide-identity-and-ordering`, and `playbook-execution`.

**Exit evidence:** a fresh run can deliver mixed Pure/Framed slides; a Framed text-only refresh makes
no provider call; a Pure text change cannot reuse stale raw material; both paths publish the same
kind of final-slide evidence. Existing protocols continue to behave exactly as before during this
change.

### Change 2: `adopt-page-authority-from-legacy`

**Purpose:** make historical run bundles explicitly adoptable without allowing historical routes to
silently remain new production.

**It changes:**

- One read-only legacy observation module that recognizes the existing source/state pair only to
  report an adoption prerequisite. It never returns a legacy production adapter.
- A source-version preview, exact-plan-hash confirmation, and clean target-version materialization
  path. Every retained slide receives an explicit Pure/Framed choice; no `full-page` or
  `body+header-lock` heuristic mapping is permitted.
- Provider-free validation of the candidate and a narrow, separately authorized pilot after adoption.
- Controller, status, transition, and recovery behavior so old runs have one safe next action:
  adopt into Page Authority rather than resume an old active production route.

**Primary OpenSpec capability owners:** `node-specification`, `run-bundle-management`,
`run-bundle-layout`, `slide-identity-and-ordering`, `cli-surface`, `workflow-inspection`, and
`playbook-execution`.

**Exit evidence:** preview and materialization make zero provider calls; source and target remain
isolated; the exact plan hash binds adoption; a representative legacy deck reaches a clean Page
Authority target with explicitly authored page variants.

### Change 3: `retire-legacy-production-surface`

**Purpose:** after the new protocol and adoption bridge are proven, remove historical production
families as current product behavior and clean the main specifications to match the code.

**It changes:**

- Retire `html-first`, `html-only`, `html-then-image2`, whole-page/header-lock modes, and
  visual-slot refinement from current init, build, refresh, review, CLI, and playbook routing.
- Preserve only the bounded legacy observation/adoption path from Change 2. Local HTML runtime may
  remain as an internal Framed compositor dependency; it is not a user-facing production protocol.
- Remove retired adapters, state records, artifact ownership, commands, test fixtures, and active
  documentation once they no longer have a current owner.
- Replace or retire every affected main-spec requirement in the same change. Active specs, Charter,
  COMMANDS, workflow, script inventory, and tests describe Page Authority as the only production
  model; legacy terms remain only in explicitly named compatibility/migration behavior and historical
  fixtures.

**Primary OpenSpec capability owners:** every owner touched by the old production surface, notably
`framework-charter`, `framework-directory-layout`, `framework-script-layout`, `commands-reference`,
`visual-slot-refinement`, `html-slide-contract`, `html-slide-rendering`, `html-render-runtime`,
`visual-config`, `visual-asset-management`, plus the Change 1 and Change 2 owners.

**Exit evidence:** the normal resolver has one Page Authority result; a legacy run gets only adoption
guidance; active CLI/help/playbook/spec scans do not present retired routes as choices; each affected
main-spec requirement has a deliberate keep, replace, retire, or compatibility-only disposition;
focused tests prove the new route and the absence of the old active routes.

## Main-Spec Cleanup Discipline

The cleanup is not a fourth documentation-only change, and it must not happen early.

- Change 1 writes delta specs for a coexistence period; main specs remain truthful about both current
  and new behavior until the implementation is accepted.
- Change 2 writes the migration/adoption deltas and proves that old data can leave the active surface
  without unsafe inference.
- Change 3 owns the exact retirement inventory and syncs it with code removal. A requirement is
  never deleted merely because a plan calls it obsolete.

This avoids both failure modes: leaving historic routes to be rediscovered as "current," and
rewriting main specs before executable behavior has changed.

## Deliberately Deferred

The recurring Agent identity/reference registry, new visual-profile taxonomy, provider-specific
reference budgeting, and any new image-review heuristic are not prerequisites for Page Authority.
They can be proposed later against the stable Pure/Framed protocol. Keeping them out of these three
changes makes the central migration testable and finishable.

## Definition Of Done

The program is complete when new decks have one Page Authority Image2 production protocol, each
slide is explicitly Pure or Framed, Framed text refresh is honestly local, existing runs can adopt
through a versioned provider-free bridge, and the main specs no longer describe historical pipelines
as current product choices.
