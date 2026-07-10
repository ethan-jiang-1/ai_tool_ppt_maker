## 1. Sync node-specification

- [ ] 1.1 `run-bundle-state.yaml` → `_state/state.yaml` (6 处)
- [ ] 1.2 补 history.jsonl + appendHistory/readHistory + node_done
- [ ] 1.3 补 checkEntry/checkExit 返回 {missing, unknown}

## 2. Sync playbook-execution

- [ ] 2.1 `run-bundle-state.yaml` → `_state/state.yaml` (3 处)
- [ ] 2.2 删 "coexists with project-metadata.yaml" 旧描述

## 3. Clean framework-charter

- [ ] 3.1 删 REMOVED Requirements 段 (2 条, 引 00_project_setup)

## 4. Verify

- [ ] 4.1 `grep -r "run-bundle-state\.yaml" openspec/specs/` 零残留
- [ ] 4.2 `grep -r "00_project_setup" openspec/specs/` 零残留 (REMOVED 段除外)
- [ ] 4.3 `npm test` 不受影响
