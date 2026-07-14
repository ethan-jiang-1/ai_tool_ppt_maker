## 1. 泛化 "Known node rename is playbook-scoped" scenario

- [x] 1.1 将 "Known node rename is playbook-scoped" scenario 中的 `edit-text`/`verify-output`/`edit-visual` 替换为 `⟨legacy-id⟩`/`⟨canonical-id⟩` 占位符，playbook 名用叙事化语言（"a playbook whose NODE_ALIASES entry maps..."），THEN 从句使用 `⟨canonical-id⟩` 而非具体名（如 delta spec 所示）

## 2. 删除 4 个 create-deck 专用 scenario

- [x] 2.1 删除 "Playbook-scoped alias covers the full create-deck rename" scenario（含 hitl1, hitl2, wave0, wave1, wave2）
- [x] 2.2 删除 "Pointer-only migration preserves current_node without a node record" scenario（含 hitl2, checkpoint-final-review）
- [x] 2.3 删除 "Legacy and canonical keys coexist with canonical priority" scenario（含 wave0, authoring-slides）
- [x] 2.4 删除 "Playbook stack entries receive alias migration" scenario（含 hitl2, wave0）

## 3. 新增泛化综合性 scenario

- [x] 3.1 新增 "Playbook-scoped alias migration is comprehensive and idempotent" scenario — 用 `⟨legacy-id⟩` / `⟨canonical-id⟩` 占位符覆盖 pointer-only migration、record key merge (mergeMissing with canonical priority)、playbook_stack entry migration (current_node + controller_nodes keys)、diagnostics 记录四个维度

## 4. 验证

- [x] 4.1 `grep -rn "hitl1\|hitl2\|wave0\|wave1\|wave2\|verify-output" openspec/specs/node-specification/spec.md` — 零命中。（`edit-text`/`edit-visual` 是合法 playbook 名在其他 scenario 中存在，不纳入旧名检查；`verify-text-output`/`verify-visual-output` 是 canonical 名，从不在原 scenario 中字面出现。）
- [x] 4.2 `openspec validate --specs` — 全绿，node-specification 零错误
- [x] 4.3 `npm test` — 186 passed（测试文件不改，确认 migration test 不受 spec 文本变更影响）
