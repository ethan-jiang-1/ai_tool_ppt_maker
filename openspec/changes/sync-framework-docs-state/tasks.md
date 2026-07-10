## 1. charter/NODE-SPEC.md

- [ ] 1.1 L47 state 文件位置 → `_state/state.yaml` (+ `_state/history.jsonl`)，删 "与 project-metadata.yaml 共存" 旧措辞
- [ ] 1.2 L50 code block 标题 `run-bundle-state.yaml` → `_state/state.yaml`
- [ ] 1.3 L116 "将 run-bundle-state.yaml 路径传给脚本" → `_state/state.yaml`
- [ ] 1.4 L151 "STATE — 检查 run-bundle-state.yaml 字段" → `_state/state.yaml`

## 2. 其他文档

- [ ] 2.1 `playbook/create-deck.md` L30 → `_state/state.yaml`
- [ ] 2.2 `COMMANDS.md` L45 → `_state/state.yaml`
- [ ] 2.3 `scripts/lib/state.mjs` 文件头注释 → `_state/state.yaml`

## 3. Sync spec

- [ ] 3.1 sync node-specification delta (强化 NODE-SPEC.md 需求描述 `_state/` 模型)

## 4. Verify

- [ ] 4.1 `grep -rn "run-bundle-state" PPTMAKER_FRAMEWORK --include='*.md'` 零残留
- [ ] 4.2 `npm test` + `npm run test:e2e` 通过 (test_docs_consistency 尤其相关)
