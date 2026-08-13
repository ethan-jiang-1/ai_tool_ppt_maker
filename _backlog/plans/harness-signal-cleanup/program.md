# Cleanup Program

Each batch is an independent OpenSpec change unless an initial proposal proves
two batches share the same requirements and ownership boundary. Do not combine
the singleton-mode redesign with obvious documentation deletion.

## Batch 1 - Repair the Active Authority Map

Owners: OpenSpec config + affected capability owners.

1. Make the config capability registry mechanically match `openspec/specs/*`.
2. Replace every nonexistent implementation authority with the current public
   interface or true owner. Do not point Agents at private internals when a
   public owner interface exists.
3. Remove retired Lifecycle Phase, compatibility aliases, Chain aliases, and
   stale Stage-1-through-5 pipeline story from OpenSpec context.
4. Replace `Frozen Identifier` with current-contract terminology consistent
   with the schema spec and inventory.
5. Fill the `slide-identity-and-ordering` Purpose and fix stale `ppt_flow`
   comments/test README ownership labels.
6. Add a guard that fails on a registry/spec mismatch or nonexistent literal
   authority path.

Closure: config has a bijective capability registry, every literal path exists,
and planted stale-path/missing-capability controls fail.

## Batch 2 - Remove Historical Protocol From Active Specs

Owners: `production-schema-conformance`, pipeline/finalization, commands, and
Controller execution.

1. Delete the `html-slide-rendering` main-spec capability.
2. Replace named v2 tombstones with the generic current-only contract where a
   positive boundary requirement is still needed.
3. Converge unsupported-input recovery on one owner-issued action taxonomy.
4. Update runtime, specs, Controller guidance, and tests atomically; keep bytes
   unchanged and provider/mutation work at zero on the negative path.
5. Remove historical fixtures and aliases rather than converting them.

Closure: no retired protocol/version/action prose exists in active specs,
guidance, implementation, or tests; known-invalid current-shaped fixtures still
prove the generic hard-stop.

## Batch 3 - Delete Competing Agent Surfaces

Owners: Harness charter/commands/workflow inspection.

1. Delete `reference/agent-prompts.md`.
2. Diff the two workflow-inspection prose records against the main spec and
   machine ledger; absorb any unique current invariant, then delete them.
3. Decide the Intent Route Catalog as a whole. Recommended default: remove its
   JSON, zero-consumer reader, schema declaration, dedicated test, and duplicate
   guidance, leaving conversational intent interpretation to the Agent and
   execution routing to the existing classifier/Controllers/inspection action.
4. Add an architecture check for non-test module reachability from declared
   executable/public/contract roots, with an explicit narrow allowlist only for
   justified plugin-style or data-only entry surfaces.

Closure: no active prompt cookbook or unconsumed parallel routing registry
remains; every retained module/data authority has a named live consumer.

## Batch 4 - Close Controller Metadata

Owners: `playbook-execution` and `md_controller_reader`.

1. Define exact allowed keys for Controller frontmatter, shared-node
   frontmatter, and fenced node declarations.
2. Reject `phase`, `lifecycle_phase`, misspellings, and arbitrary unknown keys.
3. Replace positive tests that preserve silent legacy acceptance with planted
   negative controls.
4. Keep `method_module` as the sole lifecycle-location declaration.

Closure: a stale or misspelled key cannot be silently ignored, and all checked-in
Controllers validate under the closed grammar.

## Batch 5 - Decide Whether to Collapse Singleton Production Mode

Owner: state/run-bundle protocol with Controller and CLI consumers.

Design question:

```text
today:  source.pipeline + state.production_mode(mode + workflow)
target: source.pipeline + state binding(workflow) ?
```

Required evidence before deciding:

- enumerate every reader/writer and every persisted field;
- distinguish identity/checksum needs from historical layering;
- model missing, corrupt, mismatched, retry, restart, and concurrent write paths;
- quantify removed schema fields, functions, branches, Controller keys, and
  tests versus any replacement concepts;
- establish a clean cutover with no Run Bundle scan or compatibility reader.

Proceed only if the target demonstrably removes net concepts and preserves one
exact source/state identity invariant. Otherwise retain the mode deliberately
and document why it is not redundant.

## Batch 6 - Make Drift Guards Falsifiable

This may be folded into Batches 1-4, but it is not optional.

Required guard properties:

- active spec/config/guidance scope is explicit and excludes archive/history;
- every rule has at least one synthetic violation that is detected;
- restoring the pre-control content passes;
- moving a file outside scan scope cannot silently escape the rule;
- exception baselines are exact-file, reasoned, owned, and shrink-only;
- the test name states only what its implementation actually checks.

## Verification Per Batch

Minimum:

```bash
npm test
npm run test:sweep
openspec validate --all --strict
git diff --check
```

Also run the exact focused process, schema, Controller, architecture, and mock
journey tests touched by that batch. No real-provider E2E is implied.

## Suggested Proposal Split

1. `converge-active-harness-authority`
2. `retire-historical-protocol-surfaces`
3. `remove-competing-agent-routing-surfaces`
4. `close-controller-metadata-schema`
5. `collapse-singleton-production-mode` only after its design decision

The first four can be implemented in order. The fifth remains explicitly
decision-gated.
