# Deletion Matrix

| Surface | Disposition | Preconditions | Preserved evidence |
| --- | --- | --- | --- |
| `reference/agent-prompts.md` | Delete | Confirm zero inbound current references at apply time | Git history |
| `reference/workflow-inspection-baseline.md` | Absorb then delete | Compare unique invariants with current spec/ledger | Main spec + machine ledger + Git |
| `reference/workflow-inspection-ledger.md` | Absorb then delete | Same as baseline; remove stale export language | Main spec + machine ledger + Git |
| `html-slide-rendering` main spec | Delete capability | Confirm retained Framed runtime is fully owned by `html-render-runtime` and current workflow specs | Current specs/tests + archive |
| v2-specific requirements | Delete/replace generically | Preserve exact current-only rejection behavior without naming history | Generic negative-path tests + archive |
| `unsupported-protocol/export` | Delete | One replacement action taxonomy is specified and implemented atomically | Current runtime/spec tests + archive |
| OpenSpec config legacy paths/aliases | Delete | Current registry and public owner paths are enumerated | Main specs + current files + Git |
| legacy `phase` acceptance | Delete behavior | Closed frontmatter schema and negative controls exist | `method_module` behavior tests + Git |
| Intent Route Catalog family | Recommended delete, decision required | Prove `COMMANDS` + classifier/Controllers/inspection cover first handoff; enumerate all current references | Current routing specs/tests + Git |
| `production_mode` singleton layer | Decide, not yet delete | Complete persisted-surface and failure-path design | Design artifact + current contract tests |
| `openspec/changes/archive/` | Retain | Keep out of default active searches | Archive itself |
| deck business-phase examples | Retain | Exclude from Harness lifecycle terminology scans | Methodology content |
| exact current schema literals | Retain as current contracts | Remove compatibility framing, not required equality | Schema inventory + conformance tests |

## Deletion Rule

A deletion closes only when:

1. every live entry and consumer is removed or moved to the declared owner;
2. any still-current invariant is preserved in its authoritative spec/test;
3. active references and schema anchors are updated together;
4. no compatibility alias, tombstone, or forwarding reader remains;
5. planted negative controls prove the old surface cannot quietly return.

Filename reference count alone is evidence, not authority. Runtime modules are
classified with import reachability plus declared public roots; prose/data
surfaces are classified through entry guidance, specs, schema anchors, and
Controller consumption.
