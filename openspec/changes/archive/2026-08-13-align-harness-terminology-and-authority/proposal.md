## Why

The Harness has one current Page Image protocol and one ownership model, but
its entry documents still describe several retired or overloaded concepts:
`CONTEXT.md` is an unlinked terminology reference, `playbook/` is called an
intent-routing appendix, `bundle_layout --init` appears to be a competing
public initializer, and retired HTML/Image Production wording remains active.
These inconsistencies make a fresh Agent choose between documents instead of
following the existing owner and specification hierarchy.

## What Changes

- Make the repository Agent entry identify `openspec/specs/` as the normative
  behavior contract and `CONTEXT.md` as the glossary/reference that explains
  its canonical terms; keep the existing BOOTSTRAP and Agent Contract route for
  run-bundle production.
- Align active Harness guidance with current terminology: `playbook/` contains
  MD Controllers and its manifest; `intent-routes.json` is the Intent Route
  Catalog; `schema/` is the current production definition home; and “11 rules”
  language becomes the Agent Contract without stale enumeration.
- Replace stale active documentation claims: remove HTML Production as a live
  production family, narrow Image Production to the Page Image Workflow, and
  complete the CONSTITUTION snapshot with the current Style Master iteration
  history and Pure visual-system source locations while preserving the current
  Style Master intent and Page Image visual-language sources.
- Establish documentation meanings for the three distinct uses of “workflow”:
  the `page-image-workflow` pipeline, the version-level `framed|pure`
  selection, and method-module/Controller workflow guidance. Preserve machine
  field names and the current protocol.
- Clarify that `ppt_flow init` is the supported public Run Bundle creation
  command while `bundle_layout.mjs --init` remains its layout-owner interface,
  not a competing user entry. Align `slide_id` documentation with its
  `NN_slideID` filename projection and distinguish the Framed Reserved Header
  Region from its provider-facing avoidance instruction; retain implementation
  field names such as `protected_composition` unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `harness-charter`: active guidance shall expose the normative-specification
  and terminology-reference hierarchy and use current Page Image terminology.
- `harness-directory-layout`: current directory guidance shall name `schema/`
  in its source map and preserve its sole definition-home role.
- `run-bundle-layout`: active run-bundle tree references shall name the current
  Style Master and Pure visual-system source locations.
- `bootstrap-env-guidance`: BOOTSTRAP guidance shall name the supported public
  initialization route without creating a second initializer contract.
- `commands-reference`: human-facing discovery guidance shall name the Intent
  Route Catalog and MD Controller boundary consistently.
- `visual-config`: Framed composition guidance shall distinguish the local
  Reserved Header Region from provider avoidance semantics.
- `image-production`: active Image Production guidance shall remain limited to
  the current whole-page Page Image Workflow and its filename projection.
- `slide-identity-and-ordering`: guidance shall distinguish the stable
  `slide_id` field from its position-prefixed filename projection.

## Impact

- **Harness source:** top-level and Harness entry documents, Charter,
  BOOTSTRAP, COMMANDS, reference glossary, and active workflow guidance.
- **OpenSpec:** the listed existing capability specifications gain the current
  documentation/terminology contract; no new capability, state schema, CLI
  grammar, or production protocol is introduced.
- **Tests:** documentation coherence coverage will assert the canonical entry,
  controller/catalog labels, current directory terms, init handoff, and
  composition terminology without treating implementation keys as prose
  aliases.
- **Control ownership:** MD Controllers retain intent and route sequencing; JS
  and CLI retain deterministic validation, state, and diagnostics. This change
  only makes those boundaries discoverable and unambiguous.
- **Run-bundle contract:** `none`. Existing `page-image-workflow`,
  `image2-page-workflow`, `framed|pure`, `slide_id`, filenames, and serialized
  fields are preserved. No production `deck_*` or `dpt_*` data is read or
  migrated.
- **Control-policy review:** This adds no guide, confirm, hard-stop, provider
  action, diagnostic, validator, retry, fallback, or state. It shortens the
  documentation control loop by directing readers to existing owners, so the
  human-centered-gates, agent-assistance-and-control, and
  simple-reliable-control policies retain their current behavior.
