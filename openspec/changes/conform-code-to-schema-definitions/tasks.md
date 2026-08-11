## 1. Establish The Conformance Inventory

- [ ] 1.1 Re-derive every schema-shaped Page Image identifier from the bounded Harness source set without reading a Run Bundle; classify each as a C1 stage mirror, a C1 frozen reference, or an explicit non-schema detail.
- [ ] 1.2 Add the reviewed implementation-mirror inventory under `ppt_maker_harness/schema/`, with only valid C1 `stage_ref` or frozen references, exact code anchors, and an explicit planned-producer boundary.
- [ ] 1.3 Update the schema README discovery map so maintainers can distinguish conceptual YAML authority, frozen preservation policy, and the non-authoritative code-mirror inventory.

## 2. Align Code Without Changing Semantics

- [ ] 2.1 Extend the existing `scripts/contracts/harness_architecture.mjs` contract to validate the mirror inventory, stage/frozen references, complete bounded source classification, and anchor presence; do not introduce a new runtime validator, CLI command, state field, or controller.
- [ ] 2.2 Add precise C1 stage anchors and rename only reviewed non-frozen conceptual mirrors; preserve all frozen literal text, current record validators, provider bytes, state formats, and Run Bundle data.
- [ ] 2.3 Keep historical record and identity owners byte-preserving: prove a representative checked-in fixture validates through its existing owner, and make deliberate frozen-literal drift fail before any dependent mutation or provider work.

## 3. Preserve Owner-Controlled Author Assistance

- [ ] 3.1 Identify materialized C1 fields with an existing validation owner and project only their declared defaults and Repair Guidance through that owner's current `next_action`/diagnostic handoff; keep one nearest Deck Author action and no schema or source-field names in the projection.
- [ ] 3.2 Add negative coverage proving the projection is a `guide` only, creates no confirmation, approval, record, state write, CLI-envelope field, or alternate recovery path, and leaves identity/integrity/preservation failures on their current hard-stop path.
- [ ] 3.3 Prove planned C3-C5 fields, including the `standard` Page Class defaults, remain declarative until their named producer exists; do not add a Page Class validator or implementation-only substitute in C2.

## 4. Verify The Conformance Boundary

- [ ] 4.1 Add and register focused contracts and owner tests for complete inventory classification, missing stage/frozen reference, missing anchor, deliberate non-frozen drift, frozen-literal drift, byte-preserving owner validation, materialized guidance projection, and the planned-stage boundary.
- [ ] 4.2 Run the affected targeted sweeps, `npm test`, `git diff --check`, and `openspec validate conform-code-to-schema-definitions --strict`; audit that C2 adds no record migration, provider request change, Run Bundle mutation, second control path, or new CLI/state schema. No E2E suite is selected because C2 adds no public command, journey, or state transition.
- [ ] 4.3 For Checkpoint 2, obtain an owner-designated existing Run Bundle and exact historical record, validate it read-only through its current owner, and present the drift proof, core result, and record evidence for confirmation. Do not discover the target by scanning `deck_*`.
