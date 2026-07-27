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
04-image-production/   Page Authority raw and Framed finalization
05-iteration/          refresh and structural versioning
shared/                state, run-bundle, identity, and workflow interfaces
contracts/             static architecture and retirement audits
```

`04-image-production/index.mjs` exposes only Page Authority. Its private
Framed runtime owns local browser capture, font, network-denial, timeout, and
cleanup guarantees. It does not create a second deck renderer or delivery path.

## Boundaries

- Root commands import Phase interfaces, never private Phase modules.
- Current assembly and notes consume the Page Authority final manifest only.
- `shared/state/legacy_protocol_adoption.mjs` is a read-only historical
  observer. It is not a production adapter.
- `contracts/retirement_ledger_audit.mjs` verifies main-spec retirement
  coverage without reading run-bundle or generated data.
