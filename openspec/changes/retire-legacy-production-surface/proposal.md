## Why

Slice A made Page Authority the only protocol for new decks and Slice B added a bounded, provider-free
adoption bridge for intact historical runs. The repository still contains retired HTML-first, whole-page,
Header-Lock, and visual-slot production surface in code, documentation, Controller declarations, fixtures,
and main specifications. Leaving that surface readable as if it were active risks reopening an implicit
fallback and leaves the public contract inconsistent with the only supported current protocol.

This change completes the strictly serial migration by removing legacy production authority while retaining
the one observer/adoption boundary and the protocol-neutral runtime primitives needed by Framed Page
Authority composition.

## What Changes

- **BREAKING** Remove HTML-first, whole-page Image2, Header-Lock, and visual-slot refinement as active
  init, routing, CLI, Controller, state, generated-artifact, review, and completion paths.
- Keep only bounded historical inspection: a legacy run may be observed and receive adoption or
  repair/export guidance, but cannot resume production, provider work, review, refresh, or delivery.
- Delete retired adapter exports, generated-owner schemas, state records, CLI/help choices, old fixtures,
  and active documentation after extracting any Framed compositor dependency into the existing
  protocol-neutral runtime seam.
- Replace or retire every affected main-spec requirement using the checked-in retirement ledger; retain
  only explicitly labelled compatibility/migration scenarios and inert historical fixtures.
- Add mechanical retirement audits for active executable/import/help/playbook/spec vocabulary, with
  focused provider-free tests. Default verification remains the bounded core tier plus affected seams;
  it does not run broad E2E or score Image2 aesthetics.

This is framework repository maintenance. The MD Controller remains the workflow authority; JS owns the
single resolver, state validation, deterministic diagnostics, and removal checks. `guide` remains the
only legacy observer outcome, while malformed or ambiguous source/state pairs remain prerequisite-first
repair/export hard-stops. No new confirm, waiver, fallback, state map, or migration writer is introduced.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `bootstrap-env-guidance`: expose only current Page Authority operation readiness in active guidance.
- `cli-surface`: remove retired production commands and preserve producer-owned adoption/repair diagnostics.
- `commands-reference`: remove legacy production choices and route historical runs only to adoption.
- `content-parsing`: make Page Authority the only current source grammar and confine historical parsing to observation.
- `environment-check`: retire legacy readiness as a production selector while retaining diagnostic-only checks where needed.
- `framework-charter`: align active workflow and terminology with one Page Authority production model.
- `framework-directory-layout`: remove retired production layout guidance and preserve current ownership maps.
- `framework-script-layout`: retire legacy executable ownership while retaining the Framed runtime seam.
- `header-lock`: retire active Header-Lock execution and review authority.
- `html-render-runtime`: retain only protocol-neutral browser, font, CSP, timeout, and cleanup guarantees.
- `html-slide-contract`: retire HTML deck source and delivery contracts.
- `html-slide-rendering`: retire HTML deck-output routing while preserving re-homed runtime primitives.
- `image-generation`: remove whole-page lineage as current image-production authority.
- `image-production`: expose only the Page Authority adapter as active production.
- `node-specification`: remove retired active state/evidence graph paths and retain bounded observation/adoption facts.
- `notes-injection`: consume only Page Authority final-slide evidence.
- `pipeline-orchestration`: resolve exactly one current Page Authority path and fence historical production.
- `playbook-execution`: remove legacy Controller nodes and present one current controller plus adoption guidance.
- `pptx-assembly`: consume only the current Page Authority final manifest.
- `run-bundle-layout`: retire active HTML/refinement/whole-page generated owners.
- `run-bundle-management`: seed and validate only Page Authority current production topology.
- `slide-identity-and-ordering`: retain stable identity while retiring legacy structural output assumptions.
- `style-master-generation`: retain shared provider primitives without a whole-page production route.
- `visual-asset-management`: retain confined current registries without the HTML catalog as production authority.
- `visual-config`: retain Page Authority visual/frame configuration and remove HTML-only semantics.
- `visual-slot-refinement`: retire active refinement state, CLI, provider, and completion behavior.
- `workflow-inspection`: project Page Authority lifecycle or bounded legacy adoption/repair only.

## Impact

Affected framework code is concentrated under legacy HTML/whole-page/visual-slot adapters, `ppt_flow`,
state and workflow inspection, MD playbooks, run-bundle ownership, and their tests. The public breaking
change is deliberate: old production commands and help entries disappear or return only the existing
adoption/repair diagnostic; no historical artifact becomes Page Authority evidence. Main specs, Charter,
BOOTSTRAP, COMMANDS, script inventory, fixtures, and source-to-test ownership are synchronized through
the exact retirement ledger and an automated coverage audit.
