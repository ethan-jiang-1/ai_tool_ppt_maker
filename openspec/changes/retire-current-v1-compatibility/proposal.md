## Why

`clean-current-v1-compatibility-boundary` 已将 exact CURRENT v1 隔离到明确的
compatibility home，避免它污染 TARGET；但 active framework、测试与 main specs 仍同时描述
v1 和 v2。对 coding agent 而言，这仍是一个可被误选、误 import 或误解释的第二套工作图。

现在需要把仍有价值的 v1 业务语义、证据不变量与迁移判定吸收至 v2/shared owner 或一次性迁移交付物，
然后从 active tree 和 main specs 删除 v1 runtime support。这样 current framework 只保留
`03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration`，而历史仅存于 OpenSpec archive
或有截止日期的 operator migration evidence。

## What Changes

- **BREAKING** Retire exact `page-authority-image2-v1` / `image2-page-authority` as an active
  runtime, controller, CLI, inspection, structural-versioning, and documentation route. TARGET and
  normal `ppt_flow` observation will accept and execute only the v2 selected-workflow protocol.
- Build an absorb-or-delete inventory for every v1 source/state/parser/finalization/delivery behavior:
  preserve reusable semantic invariants under their v2 or shared owner; isolate any necessary v1-to-v2
  conversion as an explicit, preview-first, time-bounded operator migration deliverable; delete the
  rest. No active fallback, compatibility writer, v1 receipt initializer, or per-slide authority route
  remains.
- **BREAKING** Remove the active `scripts/compatibility/`, `workflow/compatibility/`, and
  `tests/compatibility/` v1 ownership surfaces once their required behavior has been absorbed or
  migrated. Update inventories and negative audits so their reappearance fails closed.
- Rewrite controller/playbook/command guidance and source/state/inspection/structural flows around the
  single v2 workflow protocol. Observation remains read-only; an unsupported v1 bundle receives one
  bounded migration-or-export hard-stop, never an implicit migration or fallback.
- Remove or rewrite every active main-spec Purpose, Requirement, Scenario, and cross-link that treats
  CURRENT v1, compatibility, a v1 receipt, or an old directory as a current supported path. Archive
  retains historical contracts; `openspec/specs/` describes only the v2/shared current framework.
- Convert retained v1 proof into v2/shared invariant or explicit migration proof, then delete active
  v1-focused tests, fixtures, inventories, and E2E routes. Add audits proving the active source roots
  and main specs expose no executable/importable/choosable compatibility branch.

## Capabilities

### New Capabilities

None. One-off migration is an operator delivery bounded by this change, not a permanent framework
capability or a new active workflow.

### Modified Capabilities

- `commands-reference`: remove the exact CURRENT compatibility route and leave one v2/shared human route.
- `content-parsing`: remove v1 pipeline/default/per-slide authority grammar and retain only v2 source parsing.
- `framework-charter`: make v2/shared workflow the only active framework guidance and retire v1 context.
- `framework-directory-layout`: remove compatibility homes and require one active v2/shared ownership graph.
- `framework-script-layout`: remove v1 executables/import dispatch and enforce absence of compatibility owners.
- `image-generation`: remove cross-protocol v1 evidence as a current input while preserving v2 evidence rules.
- `image-production`: remove v1 adapter/finalization/receipt behavior and retain selected v2 publishers.
- `node-specification`: remove v1 state/mode/recovery semantics from the current node contract.
- `pipeline-orchestration`: remove bounded v1 lifecycle routing and retain marker-first v2 handling.
- `playbook-execution`: remove v1 controller/adoption continuations and retain a bounded migration/export stop.
- `run-bundle-management`: reject retired v1 bundles without automatic rewrite and define the explicit migration entry boundary.
- `slide-identity-and-ordering`: remove v1 structural-source handling and retain v2-only structural provenance.
- `workflow-inspection`: remove v1 prerequisite projection and expose a read-only migration/export hard-stop for retired inputs.

## Impact

- **Framework source:** `PPTMAKER_FRAMEWORK/scripts/compatibility/`,
  `PPTMAKER_FRAMEWORK/workflow/compatibility/`, v1 branches in parser/state/controller/inspection/
  structural flows, COMMANDS, charter, playbook, and checked-in ownership inventories.
- **Tests:** active v1 compatibility tests, legacy adoption tests, fixtures, E2E journeys, architecture/link/
  retirement audits, plus new v2 invariant and migration-boundary proof.
- **OpenSpec:** the thirteen modified main capabilities above are synchronized as removal/renaming deltas;
  archive preserves the retired contract. No production `deck_*`, `dpt_*`, or `_generated/` directory is a
  fixture or automatic migration target.
- **Control ownership:** MD owns the explicit human decision to launch a migration or export an unsupported
  run; JS owns deterministic protocol classification, preview, exact-plan validation, and fail-closed
  diagnostics. In accordance with `human-centered-gates`, migration materialization is `confirm` only
  after a human reason and exact plan; malformed, ambiguous, or non-migratable input is a `hard-stop`
  protecting source/state/bytes/lineage. `agent-assistance-and-control` keeps normal observation and
  target execution free of duplicate legacy controls. `simple-reliable-control` requires one nearest
  migration-or-export action and removes the old runtime fallback rather than adding another recovery path.
- **Run-bundle contract:** migration. A separately authorized operator migration may create a confirmed v2
  target while preserving the original v1 bundle bytes; normal framework execution never rewrites an
  existing production bundle.
