## 1. Sync node-specification

- [x] 1.1 State → `_state/state.yaml` + `history.jsonl` (已 commit 6d76edc)
- [x] 1.2 补 History log append-only; 删旧 corruption 需求
- [x] 1.3 scenario: `unified_pipeline.mjs`→`ppt_flow.mjs`, `visual_gate`→`gates.visual`
- [x] 1.4 scenario: `full-creation`→`create-deck`, `seed_topics_complete`→`node_completed:seed-topics`
- [x] 1.5 scenario: `chain-a.md`/`chain-b.md`→`edit-text.md`/`edit-visual.md`

## 2. Sync playbook-execution

- [x] 2.1 State → `_state/state.yaml` (已 commit 6d76edc)
- [x] 2.2 删 "coexists with project-metadata.yaml"
- [x] 2.3 playbook 5→6 文件 (补 shared node `classify-change.md`)
- [x] 2.4 Gates: `visual_gate`→`gates.visual`

## 3. Sync framework-charter

- [x] 3.1 删 REMOVED 噪声段 (3 条: 01-directory-template + 2×00_project_setup, 已 commit 6d76edc)
- [x] 3.2 charter 3→4 文件 (+`NODE-SPEC.md`, RENAMED + MODIFIED)
- [x] 3.3 root 4→5 子目录 (+`playbook/`)
- [x] 3.4 reference 文档大写→小写

## 4. Verify

- [x] 4.1 `grep -rn "run-bundle-state\.yaml" openspec/specs/` 零残留
- [x] 4.2 `grep -rn "full-creation\|chain-a\.md\|chain-b\.md\|00_project_setup" openspec/specs/` 零残留
- [x] 4.3 `grep -rn "QUICK_START\|GLOSSARY\|ANTI_PATTERNS\|VERSION_LOG\|visual_gate\|unified_pipeline" openspec/specs/` 仅剩合理引用
- [x] 4.4 "exactly N" 计数与 `ls PPTMAKER_FRAMEWORK/{charter,playbook}/` 及 root 子目录一致
- [x] 4.5 `npm test` 通过
