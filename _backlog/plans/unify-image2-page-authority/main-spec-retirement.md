# Main-Spec Retirement Inventory

## Decision

After Page Authority is implemented, `openspec/specs/` must describe one current production
family:

```text
page-authority-image2-v1
  -> pure-image2 | framed-image2 per slide
```

The historical `html-first-v1`, `whole-page-image2-v1`, `full-page`, `body+header-lock`, and
visual-slot protocols may remain readable only through one narrow legacy-compatibility boundary.
They must not remain scattered through active command, workflow, mode, refresh, review, or layout
requirements as equal product choices.

This is a target-state inventory, not a request to edit the current main specs before their
implementation changes land. Until then, main specs must continue to describe current code truth.

## Cleanup Rule

At implementation/archive time, every old requirement takes exactly one disposition:

| Disposition | Meaning |
|---|---|
| Replace | The capability remains, but its active requirement is rewritten for Page Authority. |
| Retire | The old production requirement and implementation are removed. |
| Collapse | Historical parsing/diagnostic facts move into the single legacy-compatibility boundary. |
| Keep | The requirement is protocol-neutral and remains unchanged. |

No old requirement may survive merely because it is convenient test context. Historical fixtures
belong in tests; legacy facts belong in the compatibility boundary; neither belongs in the active
production vocabulary.

## Inventory

| Capability / area | End-state disposition | Required final state |
|---|---|---|
| `content-parsing` | Replace + collapse | Parse only Page Authority as current source. Legacy source can be read only to create an explicit adoption candidate; it cannot enter normal Stage 1. |
| `image-generation` | Replace + retire | Receipt-bound raw Page Authority generation replaces whole-page production paths and raw-manifest semantics. |
| `header-lock` | Retire + collapse | Canvas overlay and header review leave active production. Historical inspection is compatibility-only. |
| `image-production` | Replace | One Page Authority adapter with Pure/Framed branches; no active whole-page or visual-slot adapter. |
| `style-master-generation` | Replace | One shared managed style-master contract for both authorities. |
| `pipeline-orchestration` | Replace + retire | Only typed Page Authority refresh paths and unified final lineage remain active. |
| `pptx-assembly` / `notes-injection` | Replace | Consume only current unified final-slide manifest plus Page Authority lineage. |
| `visual-slot-refinement` | Retire + collapse | No vNext production/refinement route, state, or public command. Historical evidence is reader-only. |
| `html-slide-contract` / `html-slide-rendering` | Retire as a deck-output route; keep only compositor primitives | HTML remains an internal Framed compositor runtime, not a second page-authoring/output protocol. |
| `visual-asset-management` | Replace | HTML asset catalog remains separate; Image2 profile/reference registry is the only identity authority. |
| `run-bundle-layout` / `run-bundle-management` | Replace + collapse | New init/version layout exposes only Page Authority. Legacy layouts may be inspected only for adoption. |
| `cli-surface` | Replace + retire | Public current commands use Page Authority receipts, authorization, raw review, and final delivery review. Legacy production flags/commands disappear or return legacy-adoption guidance before work. |
| `commands-reference` / `playbook-execution` | Replace + retire | Natural-language routing and Controller nodes offer Pure/Framed selection, not old mode selection or header/refinement handoffs. |
| `node-specification` / `workflow-inspection` | Replace + collapse | One active state/receipt/review graph; old state can only reach explicit migration diagnostics. |
| `framework-charter`, directory layout, script layout | Replace | Current guidance and public adapter layout name Page Authority only; any retained legacy code is labelled compatibility-only. |

## Legacy Compatibility Boundary

The future change must introduce or designate one explicit `legacy-protocol-compatibility`
responsibility. It may do only the following:

1. Read a legacy source/state/artifact enough to identify its protocol and start the existing
   provider-free adoption preview.
2. Preserve historical bytes and report bounded migration/repair diagnostics.
3. Reject legacy production, refresh, provider submission, header locking, visual-slot refinement,
   and final-delivery publication as current work.

It must not supply a default, fallback adapter, compatibility alias, inferred Page Authority, or
new production workflow.

## Proof Of Cleanup

The future implementation is not complete until all of these are true:

1. Main-spec searches for legacy mode/render terms find them only in the legacy-compatibility
   boundary, migration scenarios, explicit removal notes, and historical fixture documentation.
2. No active `init`, command help, Controller node, state completion rule, or normal refresh path
   offers old modes as current choices.
3. The active framework has no `body+header-lock` or visual-slot final-pixel path.
4. A legacy deck can still be safely identified and adopted without provider work or generated
   artifact mutation.
5. Unit and end-to-end tests separately prove active Page Authority behavior and legacy hard-stop/
   adoption-reader behavior.
