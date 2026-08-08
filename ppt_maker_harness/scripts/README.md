# PPT Maker Harness Scripts

`ppt_flow.mjs` is the public entry point. The registered direct executables are
listed in `contracts/executable_inventory.mjs`; no production executable lives
outside that inventory.

CLI producer fields and diagnostics are governed by `openspec/specs/cli-surface/spec.md`.

## Current ownership

```
00-setup/              operation-scoped readiness
01-content/            Page Image source and stable IDs
02-visual-system/      visual language, frames, and references
03-framed-image/       TARGET Framed workflow semantics and final-manifest publication
04-pure-image/         TARGET Pure workflow semantics and final-manifest publication
05-delivery/           final projection, PPTX, notes, and delivery
06-iteration/          TARGET workflow-aware refresh and structural routing
shared/                state, run-bundle, identity, and workflow interfaces
contracts/             static architecture and retirement audits
```

The target route is `03-framed-image XOR 04-pure-image -> 05-delivery ->
06-iteration`. The two workflow adapters publish the same final-slide-manifest
contract; only `05-delivery` writes final projection, PPTX, or notes.

## Boundaries

- Root commands import Phase interfaces, never private Phase modules.
- `03-framed-image` and `04-pure-image` never import each other; target
  iteration may use only public sibling interfaces.
- Delivery consumes the Page Image final manifest without workflow-semantic
  branching.
- Direct executable inventory is unchanged: target method modules are imported
  interfaces, not new CLI commands.
- `contracts/retirement_ledger_audit.mjs` verifies main-spec retirement
  coverage without reading run-bundle or generated data.
