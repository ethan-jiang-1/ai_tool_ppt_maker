# Framework Scripts

`ppt_flow.mjs` is the public entry point. The registered direct executables are
listed in `contracts/executable_inventory.mjs`; no production executable lives
outside that inventory.

CLI producer fields and diagnostics are governed by `openspec/specs/cli-surface/spec.md`.

## Current ownership

```
00-setup/              operation-scoped readiness
01-content/            Page Authority source and stable IDs
02-visual-system/      visual language, frames, and references
03-framed-image/       TARGET Framed workflow semantics and final-manifest publication
04-pure-image/         TARGET Pure workflow semantics and final-manifest publication
05-delivery/           TARGET and bounded CURRENT final projection, PPTX, notes, and delivery review
06-iteration/          TARGET workflow-aware refresh and structural routing
04-image-production/   bounded CURRENT v1 mixed compatibility adapter
05-iteration/          bounded CURRENT v1 iteration compatibility
shared/                state, run-bundle, identity, and workflow interfaces
contracts/             static architecture and retirement audits
```

The target route is `03-framed-image XOR 04-pure-image -> 05-delivery ->
06-iteration`. The two workflow adapters publish the same final-slide-manifest
contract; only `05-delivery` writes final projection, PPTX, notes, or delivery
review. The v1 paths remain compatibility owners only.

## Boundaries

- Root commands import Phase interfaces, never private Phase modules.
- `03-framed-image` and `04-pure-image` never import each other; target
  iteration may use only public sibling interfaces.
- Delivery consumes the Page Authority final manifest without workflow-semantic
  branching.
- Direct executable inventory is unchanged: target method modules are imported
  interfaces, not new CLI commands.
- `shared/state/legacy_protocol_adoption.mjs` is a read-only historical
  observer. It is not a production adapter.
- `contracts/retirement_ledger_audit.mjs` verifies main-spec retirement
  coverage without reading run-bundle or generated data.
