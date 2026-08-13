## Context

See `proposal.md` for the motivation. The C1 change has already retired the
numeric node lifecycle projection, leaving the existing Page Image source/state
protocol, method modules, controller manifest, and target ownership checks
unchanged. The keel audit identifies the remaining drift as active prose and
entry guidance, not competing runtime implementations.

The direct facts remain owned by existing sources:

- `openspec/specs/` defines intended Harness behavior; implementation and
  tests conform to it.
- `CONTEXT.md` is the terminology reference, not an evaluator, controller, or
  serialized schema.
- `bundle_layout.mjs` owns run-bundle layout, `ppt_flow init` is the supported
  public initialization entry, and `schema/` owns current schema definitions.
- `playbook/` contains MD Controllers and their manifest;
  `intent-routes.json` is a closed discovery catalog.
- Framed serialization and implementation keys retain their exact current
  names; terminology changes only describe their ownership correctly.

## Goals / Non-Goals

**Goals:**

- Give a fresh Agent one discoverable document hierarchy for terminology,
  intended behavior, run-bundle startup, and controller routing.
- Remove stale active prose that describes retired production families, a
  competing initializer, or an alternate lifecycle/workflow model; complete
  visual-source maps from the layout owner without classifying a current source
  literal as obsolete.
- Make natural-language term distinctions readable without changing exact
  machine field names, filenames, state, or protocol values.
- Add narrow documentation-coherence coverage that guards the repaired entry
  and terminology claims.

**Non-Goals:**

- Do not rename serialized `page-image-workflow`, `image2-page-workflow`,
  `production.workflow`, `slide_id`, filenames, or Framed geometry fields.
- Do not alter CLI grammar, controller sequencing, state/receipt ownership,
  run-bundle layout, provider behavior, gates, diagnostics, or production data.
- Do not create, delete, or migrate `deck_*` or `dpt_*` data.
- Do not perform H-track housekeeping, including `.env.saved`,
  `skills-lock.json`, ADR statuses, backlog records, or suspended-directory
  decisions.
- Do not modify frozen OpenSpec archive history.

## Decisions

### Link terminology rather than duplicate specification

Top-level Agent guidance will link `CONTEXT.md` as the terminology reference
and retain `openspec/specs/` as normative behavior. `CONTEXT.md` will point
back to the appropriate current spec/owner categories where necessary, without
copying full requirement prose or becoming a second controller.

This is owned by MD guidance and specifications, not JS. A separate machine
registry or runtime authority map was rejected because it would duplicate the
existing specification, Controller, and CLI ownership surfaces.

### Preserve current contracts while disambiguating prose

The implementation will use unambiguous prose for:

- pipeline vs version-level workflow selection vs method-module/Controller
  workflow guidance;
- local Reserved Header Region vs provider-facing Provider Avoidance Constraint;
- formal `slide_id` vs `NN_slideID` filename projection; and
- public `ppt_flow init` vs layout-owner `bundle_layout.mjs --init`.

Exact machine keys (`protected_composition`, `reserved_header`, `body_safe`),
filename shapes, and command interfaces remain literal contracts. Renaming
them would create a migration and need a different change.

### Route each correction to the existing capability owner

The proposal's eight modified capabilities define where each requirement-level
statement belongs. Charter/entry language belongs to `harness-charter`;
schema-home wording belongs to `harness-directory-layout`; visual-source tree
references belong to `run-bundle-layout`; public startup wording belongs to
`bootstrap-env-guidance`; discovery/catalog wording belongs to
`commands-reference`; Framed composition terms belong to `visual-config`; and
production/identity naming belongs to their respective capabilities.

Creating an umbrella “terminology” capability was rejected because it would
duplicate the responsibility already owned by those stable capabilities.

### Validate claims, not all vocabulary occurrences

Focused documentation-coherence tests will assert the specific repaired
claims: the Agent entry hierarchy, `playbook/`/catalog distinction, source-map
and layout-owner visual-source paths, public init handoff, retired
production-family prose, composition terminology, and identity naming. The
tests will allow exact implementation/serialization identifiers, current source
literals, and historical/archive terminology where they are legitimate.

A repository-wide banned-word scan was rejected because it would confuse
machine literals and frozen history with operational prose, creating a noisy
second validator. The existing documentation-coherence seam remains the single
quality check.

## Risks / Trade-offs

- [Over-correcting a literal contract] -> Restrict prose edits to active
  guidance and explicitly test that exact schema, field, filename, CLI values,
  and current layout-owned source literals remain unchanged.
- [Duplicating normative behavior in CONTEXT] -> Keep CONTEXT definitional and
  link to its owner/spec instead of copying runtime procedures or schemas.
- [Treating a snapshot as an authority] -> Preserve the CONSTITUTION tree's
  snapshot disclaimer and reference `bundle_layout.mjs` for layout truth.
- [False-positive documentation validation] -> Add only claim-specific
  assertions and keep implementation identifiers outside prose-only bans.

## Migration Plan

No migration is required. All edits are idempotent documentation/spec changes
over current contracts. If an active document claims a retired source path or
term after implementation, repair that owning document and rerun documentation
coherence and OpenSpec validation. No state heal, compatibility reader, waiver,
or run-bundle rewrite applies.

## Verification Strategy

- **Focused unit/integration:** update the existing documentation-coherence
  test to protect corrected active references and retain a negative sample for
  genuine ambiguity.
- **Core:** run `npm test` because documentation coherence belongs to the
  protected core inventory.
- **E2E:** not needed. No public runtime journey, state, provider action, or
  CLI behavior changes.
- **Static:** run `openspec validate align-harness-terminology-and-authority
  --strict`, `openspec validate --all --strict`, and `git diff --check`; verify
  the targeted active documents no longer claim the retired paths or production
  families.
