# Legacy Whole-Page Image2 Contract Hardening (Superseded)

> Type: Historical exploration | Updated: 2026-07-26 | Status: Superseded -- do not apply
>
> Superseded by [`unify-image2-page-authority.md`](./unify-image2-page-authority.md) and OpenSpec change `unify-image2-page-authority`.

> This document preserves the investigation that exposed the v3 prompt conflict and the useful ideas subsequently absorbed into the Page Authority plan: explicit Agent identity material, receipt freshness, bounded reference projection, exact authorization material, and run-bound ingress fencing. It is **not** an independently applicable foundation. Its `body+header-lock` assumptions are incompatible with `framed-image2`, and applying its registry or receipt work separately would create competing ownership for the same Image2 inputs.

## Background / Current State

`deck_ai_sdlc_bpm_keynote` shows two linked reliability gaps.

First, v3 uses `body+header-lock` for 21 of 25 slides. The generated prompt correctly begins by reserving an empty header band, but the same prompt later retains L3 and deck-wide text rules that tell Image2 to render the title and Kicker. The `RomPyr` final page visibly has the provider's duplicate/garbled header beneath the local deterministic header. v1 and v3 otherwise share `gpt-image-2`, 2K 16:9 output, and the same style-master hash, so this is a contract-composition defect, not a provider configuration change.

Second, the strongest consistent Agent representation already exists: the v1 amber-glass, topology-network five-pose model sheet. It is visually coherent with the deck's cream/sepia/amber language and portrays the Agent as a warm guide, rather than a generic metallic robot. Yet it only exists in `v1/_scratch/`, while the durable `2_backbone/visual-style/assets/` catalog is empty. Current Stage 2 already supports registered reference images and fingerprints their bytes, but it cannot represent recurring identity or semantic poses.

## Decision / Approach

Create the framework change `harden-image2-identity-and-prompt-contracts` and use it to introduce two linked but independent safeguards.

1. **Prompt contract compiler**: Stage 1 becomes the only owner of final prompt composition. It has separate full-page and body-lock projections, mode-specific final rules, deterministic removal of exact legacy header echoes, and fail-closed detection for unresolved header instructions. Its derived audit becomes the one fast answer to “what did this slide actually ask Image2 to do?”
2. **Visual identity profile**: promote the approved Agent sheet and portrayal spec into the deck backbone. Register it as `amber-agent-model-sheet` and define an opt-in `amber-agent` profile with semantic roles (`guide`, `collaborating`, `working`, `orchestrating`, `reviewing`). Slides bind `profile/role`, not paths or prompt snippets. Stage 1 resolves the reference; Stage 2 submits the one canonical image, fingerprints it, and writes its provenance.

The explicit opt-in is important. A character reference is a visual continuity tool for pages that talk about agents as partners; it must not make every claim slide contain a robot. Existing `VISUAL ASSETS` remains available for ordinary diagrams and source material.

## Why This Shape

- A deck-global default would cause irrelevant visual repetition.
- A raw `VISUAL ASSETS` list lacks role semantics and can force each page to repeat character instructions.
- A slide-level filesystem path or provider URL would bypass catalog confinement, override rules, and provenance.
- A warning-only prompt linter still permits a paid bad render. A preflight compiler can prove the final contract before authorization.
- An image grader/OCR loop would add an unreliable second gate after the remote call. The direct cause is available in the prompt and can be caught locally.

## Risks / Trade-offs

- [Image models vary even with a reference] -> treat the profile as continuity guidance; continue human visual review and do not promise pixel-identical characters.
- [One reference can dominate a composition] -> cap the identity reference at one and require slide-level opt-in.
- [Natural-language prompts are not fully parsable] -> normalize only exact known header echoes; hard-stop on remaining header-drawing directives instead of silently deleting semantic content.
- [The v1 sheet is scratch output] -> promotion copies its approved bytes into backbone and records origin plus SHA; future production never depends on scratch.
- [Assets README conflicts with Image2 support] -> reconcile that documentation during implementation, retaining its HTML-first restrictions rather than broadening unrelated source schemas.

## Round 1 Review Findings

Three independent reviews found that the original proposal was structurally valid but not Apply-ready. The corrected design separates the HTML asset catalog from a backbone-only whole-page reference registry, replaces an advisory audit with a Stage-2-verified prompt-contract receipt, and makes provider authorization bind exact selected material rather than only style/model settings.

The review also required explicit solutions for five visual/production hazards: a subject model sheet must not become a second style master; Agent identity needs a scoped non-metal/non-blue robot exception; a receipt must make old prompts unusable after input drift; transport needs a total reference budget and capability contract; and legacy header cleanup needs a closed grammar tested against the actual 21-page v3 corpus.

## Round 2 Review Findings

The revised receipt and registry design passed strict OpenSpec validation, but a second independent review found that it was still not executable as written. The corrections now make five ownership boundaries explicit:

1. The receipt is not only a Stage-2 file. It carries the plan projection too, and header lock, PPTX assembly, plus whole-page pilot/approve/status readers must consume or verify receipt-bound plan data. This closes the stale `slide_plan.json` route.
2. Whole-deck receipt SHA is publication evidence, not scoped authorization material. Authorization uses per-slide effective-contract digests so a rebuilt receipt caused only by another page does not invalidate an unchanged selected scope.
3. v1 reference material intentionally supports only style master plus one identity subject. It rejects legacy whole-page `VISUAL ASSETS` rather than mixing the separate HTML catalog into Image2 ownership.
4. The direct authorization UX is a provider-free `authorize-image2 plan` followed by an explicit plan-hash-bound `record`, stored as a v2 material-sensitive record. Existing v1 profile-only state remains readable historical evidence but cannot submit receipt-aware work.
5. The compiler's claimed compatibility is now tied to real v3 facts: canonical deck-system label parsing accepts `SUBJECTS ARE CONTEMPORARY` only through an exact alias; header matching has a bounded final-CJK-stop normalizer; and identity binding rejects unresolved local robot prohibitions or multi-Agent scene briefs.

## Round 3 Review Findings

The third pass found the kinds of boundary errors that strict document validation cannot see. The plan now distinguishes receipt-free style-master authorization from receipt-bound slide authorization, uses lexicographically stable scope order for state/material hashes, adds the new command to the closed CLI inventory and return audit, and makes the old generic asset APIs explicitly non-receipt-only. It also fences Stage 5 notes injection and structural materialization behind the receipt, and defines the effective-contract digest to exclude Header-Lock-only text so a title refresh does not trigger an Image2 rebuild or reauthorization.

## Round 4 Closure

The final review closed two bootstrap/edit-path edge cases. `style-master` derives and checks its receipt-free material both at planning and immediately before transport, so the first style master cannot deadlock on a receipt that it must precede. For an existing v3 slide, changing only structured header text can leave an old duplicated L3 header clause behind; the compiler may remove it only when it equals the same field of the same stable slide in the last valid receipt, records that exact prior-receipt match, and still rejects every other historical or arbitrary header value. The final strict validation passed after these corrections.

## Round 5 Review Revisions

The previous closure did not account for the actual executable surface. The current standalone Stage 2 and Stage 3 utilities still accept raw prompt/plan paths, and Stage 2 accepts an arbitrary style-reference path; this would permit a marked whole-page bundle to produce or submit output without the new receipt. The receipt also named a style-master SHA but did not say how its bytes are safely re-resolved without leaking paths or allowing substitution.

The change now makes the receipt a run-bound production boundary. Canonical whole-page Stage 1--5, materialization, review, and authorization routes resolve from `--run-dir` and the receipt only; raw-artifact CLI forms are refactored into non-production helpers or rejected for marked bundles. The framework resolves fixed `style-master` bytes from the canonical run asset and identity bytes from the registry, verifies both hashes, and keeps paths out of all durable evidence. This is a prerequisite for claiming receipt authority, not a cosmetic CLI change.

The review also binds the receipt-free bootstrap branch: a managed style master always includes the canonical `deck_system.txt`. Its existing `--no-deck-system` escape hatch would otherwise change effective provider prompt bytes without an independently represented choice in the authorization material, so it is explicitly rejected before authorization or credential lookup.

## Delivery Plan

1. Write OpenSpec proposal, delta specs, design, and tasks. Status: complete.
2. Implement the visual identity module and manifest/profile validation with unit tests.
3. Implement mode-specific prompt compilation and derived audit with regression tests for the v3 conflict.
4. Wire profile projection into Stage 2 and mocked provider traces; verify fingerprint-local invalidation.
5. Promote the Agent sheet/spec to the named deck backbone and add the first `amber-agent` profile.
6. Run local Stage-1 preflight on v3; confirm all 21 body-lock prompts have no header-rendering requirement.
7. Choose only the v3 slides whose story needs the recurring Agent, obtain the normal exact Image2 authorization, generate a pilot/contact sheet, and review before any full rebuild.

## Acceptance Evidence

- A body-lock prompt's final bytes never contain a model-rendered structured header, while changing its title still changes Stage 3 only.
- A selected Agent slide submits one canonical reference with profile/role/asset SHA evidence; non-selected slides submit none.
- Any mismatched identity asset, unknown role, or unresolved header instruction fails before remote submission and reports one repair action.
- A profile or character asset change invalidates only consuming raw images.
- The v3 rebuild is a normal Generated Image Rebuild and does not hand-edit `_generated/`.

## Implementation Link

OpenSpec change: [`harden-image2-identity-and-prompt-contracts`](../../openspec/changes/harden-image2-identity-and-prompt-contracts/).
