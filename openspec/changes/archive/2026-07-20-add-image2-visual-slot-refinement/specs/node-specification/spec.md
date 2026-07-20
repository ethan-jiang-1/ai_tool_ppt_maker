## MODIFIED Requirements

### Requirement: Node frontmatter defines entry and exit gates

Every registered node SHALL retain globally unique kebab-case identity, lifecycle `0|1|2|3|4|5`, exact final method module, ordered requires, deterministic entry/exit, and unique routing decisions. The active index SHALL permit lifecycle 4/module `04-image2-refinement` only for nodes owned by `image2-refine`, whose entry requires a marked run and current `html-delivery-review: proceed`; all other controllers reject that lifecycle/module.

#### Scenario: Unowned Phase 4 node is registered
- **WHEN** a controller other than `image2-refine` declares lifecycle 4
- **THEN** validation fails with an ownership diagnostic

### Requirement: State file is YAML at run bundle root

`state.yaml` SHALL remain the single truth source for execution pointer and authoritative evidence. Reserved system evidence SHALL reuse its existing shape; `RESERVED_NODE_IDS` SHALL be exactly `header-review`, `html-content-review`, `html-visual-review`, `html-delivery-review`, `html-production-reset`, and `image2-refinement`. Every reserved record SHALL live only at `nodes[reserved_id].by_version["3_versions/<vN>"]`; mismatched version keys are invalid. `image2-refinement` is the sole authority for its exact authorization, attempts, reviews, and safe human decisions, and creates no new top-level container or `_state` file.

Existing gate-approval journal exclusivity, HTML reset fences, read-only observation, and recovery rules remain unchanged. Refinement promotion SHALL reject active gate/reset fences and use expected-state CAS; its separate scratch journal is not a state authority. Promotion stales prior delivery review, so completion requires a new current final-review decision.

#### Scenario: HTML delivery is complete without refinement
- **WHEN** state/status reads current HTML delivery with no refinement record
- **THEN** it reports completion without Phase-4 debt

#### Scenario: Refinement promotion races a gate journal
- **WHEN** an accept operation observes an active gate-approval journal
- **THEN** it returns conflict before source or state mutation

### Requirement: Playbook index reserves final system evidence and enforces pipeline ownership

The canonical index/state reserved-ID registry SHALL reserve the six IDs above, validate controller pipeline declarations, reject cross-pipeline entry conditions, and ensure no reserved ID is declared as a controller node. Only nodes in `image2-refine` may declare Phase 4/module `04-image2-refinement`; they require current HTML delivery evidence. Legacy maintenance continues to reject HTML-first runs.

#### Scenario: Controller declares reserved refinement evidence
- **WHEN** a playbook declares `node: image2-refinement`
- **THEN** validation fails because it is system evidence
