## Why

The present framework mixes whole-page Image2, HTML-first, and Canvas header-lock production
families. They let different paths claim the same visible pixels, which makes quality inconsistent and
turns a text or visual refresh into a routing problem. New decks need one Image2-native protocol in
which the owner of every final pixel is explicit and the visual prompt, Agent identity, evidence, and
finalization contracts cannot drift apart.

This change establishes that new-production path. It deliberately does not migrate or remove legacy
runs; those are the next two planned changes once the new protocol is proven.

## What Changes

- Add the Page Authority Image2 protocol for new decks, identified by the closed
  `page-authority-image2-v1` source marker and `image2-page-authority` state mode.
- Add exactly two per-slide final-pixel authorities: `pure-image2`, where Image2 owns the complete
  slide, and `framed-image2`, where Image2 supplies a text-free full-canvas underlay and a local,
  deterministic frame owns optional kicker/subtitle/callout and required title pixels.
- Replace free provider prompt ingress for this protocol with a validated, deck-wide visual-language
  registry. Add the checksum-bound Amber Agent reference registry; the multi-pose model sheet is
  doctrine only and cannot enter a provider request. The user-designated v1 model sheet is promoted
  from scratch into the deck backbone as the initial doctrine asset.
- Add receipt-bound raw generation, review coverage, a single `finalizePage(...)` Interface, final
  slide manifest, final visual projection, PPTX assembly, and notes lineage for mixed Pure/Framed
  decks. A Framed text-only refresh is local and provider-free; changing provider-owned Pure text
  requires new raw generation and raw review.
- Add source-aware initialization, readiness, CLI/MD-controller routing, diagnostic, state, and
  rebuildable run-bundle ownership for the new path. Provider authorization remains explicit and
  last-mile only.
- Carry Page Authority through the existing exact-plan structural versioning path: a vNext may
  atomically materialize only verified raw tuples as target-owned unreviewed evidence, never inherit a
  review, final, or provider decision, and never submit a provider request as part of preview/apply.
- **BREAKING for new decks:** new initialization defaults to `framed-image2`; Page Authority source
  rejects legacy render mappings, `RENDER MODE`, and free-form `IMAGE PROMPT` inputs.

All changed gates follow `openspec/policies/human-centered-gates.md`: malformed authority/source,
missing/partial/stale/mismatched evidence, an unknown provider submission, or an attempted submit
without a recorded exact authorization are hard-stops because they protect pixel ownership and evidence
integrity. A complete current raw or delivery projection awaiting its human `proceed|repair|redirect`
decision, and a complete disclosed provider scope awaiting authorization, are `confirm` gates. The Agent
may perform only the mechanical, receipt-bound steps. The direct resolver,
one finalization Interface, and prerequisite-first evidence chain follow
`openspec/policies/agent-assistance-and-control.md` and
`openspec/policies/simple-reliable-control.md`; they replace parallel routing and duplicate quality
checks rather than layering new fallbacks.

## Capabilities

### New Capabilities

- None. The protocol is owned by existing stable capabilities; it does not introduce a parallel
  capability name for one migration.

### Modified Capabilities

- `content-parsing`: parse and validate the closed Page Authority source grammar and per-slide
  authority receipt.
- `image-production`: own the Page Authority production adapter and the sole finalization Interface.
- `image-generation`: generate, verify, and review receipt-bound Image2 raw evidence.
- `visual-config`: own the trusted visual-language registry and deterministic Framed display preset.
- `visual-asset-management`: own registered, checksum-bound Image2 reference assets.
- `style-master-generation`: bind shared visual-system and effective provider style bytes into the
  generation profile.
- `html-render-runtime`: provide only the protocol-neutral local composition runtime guarantees.
- `pipeline-orchestration`: route the Page Authority receipt-to-delivery lifecycle and refresh paths.
- `pptx-assembly`: consume the one current final-slide manifest.
- `notes-injection`: bind notes receipt to the Page Authority delivery lineage.
- `node-specification`: own the authoritative state, evidence, and recovery rules for the new mode.
- `cli-surface`: expose and diagnose the new production entry points without prompt/provider bypasses.
- `playbook-execution`: route Controller nodes and gates through the new production model.
- `run-bundle-layout`: declare canonical Page Authority source, state, receipt, raw, review, and final
  artifact ownership.
- `run-bundle-management`: initialize and validate new Page Authority runs.
- `environment-check`: report operation-scoped Page Authority readiness.
- `bootstrap-env-guidance`: make Page Authority the sole new-deck startup path while retaining
  operation-scoped local and provider readiness guidance.
- `commands-reference`: route natural-language production work to the new protocol.
- `header-lock`: fence the legacy whole-page Stage 3 from Page Authority finalization.
- `workflow-inspection`: project Page Authority's direct-owner prerequisites without falling into an
  HTML or legacy Image2 observation route.
- `slide-identity-and-ordering`: classify and atomically publish Page Authority structural vNext raw
  materialization or raw-generation debt under the existing preview/hash/CAS transaction.

## Impact

This is framework repository maintenance in `PPTMAKER_FRAMEWORK/`, `openspec/`, `tests/`, and
`tests_e2e/`, plus the explicitly user-designated backbone doctrine asset at
`deck_ai_sdlc_bpm_keynote/2_backbone/visual-style/assets/reference/amber-agent/`. It does not modify a
version's `_generated/` output. The change touches source parsing, state and generated-artifact lineage,
the Image2 provider boundary, the local browser capture runtime, public CLI/Controller guidance, and
tests. It introduces no new production dependency and preserves legacy execution behavior only until
the subsequent adoption change supplies its explicit bridge.
