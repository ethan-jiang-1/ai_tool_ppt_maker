## 1. Framework 文档 — create-deck playbook

- [ ] 1.1 将 `hitl1` → `checkpoint-intake`：node ID（line 34）、heading（line 31）、`requires: [hitl1]`（line 55）
- [ ] 1.2 将 `hitl2` → `checkpoint-delivery`：node ID（line 151）、heading（line 148）、所有 `requires: [hitl2]`（lines 171, 193）、`node_decision:hitl2:proceed`（line 173）、`node_decision:hitl2:repair`（line 195）、body 文字"重置 hitl1 及其下游"（line 163）、"返回 hitl2"（line 201）
- [ ] 1.3 将 `wave0` → `authoring-slides`：node ID（line 93）、heading（line 90）、`requires: [wave0]`（line 115）
- [ ] 1.4 将 `wave1` → `composing-prompts`：node ID（line 112）、heading（line 109）、`requires: [wave1]`（line 133）
- [ ] 1.5 将 `wave2` → `assembling-deck`：node ID（line 130）、heading（line 127）、`requires: [wave2]`（line 154）
- [ ] 1.6 更新流程行（line 9）：`instantiation → checkpoint-intake → setup → seed-topics → authoring-slides → composing-prompts → assembling-deck → checkpoint-delivery → readiness/rerun → final`

## 2. Framework 文档 — NODE-SPEC.md 示例

- [ ] 2.1 所有 YAML 示例中 `node: wave0` → `node: authoring-slides`（lines 19, 175）
- [ ] 2.2 State 示例中 `current_node: wave0` → `current_node: authoring-slides`（line 55）、`wave0:` → `authoring-slides:`（line 62）
- [ ] 2.3 State 示例中 `hitl2:` → `checkpoint-delivery:`（line 70）
- [ ] 2.4 完整示例 heading `# wave0: Foundation Shared Reference` → `# authoring-slides: Foundation Shared Reference`（line 187）

## 3. Framework 文档 — COMMANDS.md 路由文字

- [ ] 3.1 "回 hitl2 → rerun → seed-topics" → "回 checkpoint-delivery → rerun → seed-topics"（line 75）

## 4. Main specs — playbook-execution

- [ ] 4.1 将 `openspec/specs/playbook-execution/spec.md` 中节点列表更新为：`instantiation, checkpoint-intake, setup, seed-topics, authoring-slides, composing-prompts, assembling-deck, checkpoint-delivery, readiness, rerun, final`

## 5. Main specs — node-specification

- [ ] 5.1 将 `openspec/specs/node-specification/spec.md` 中所有 scenario 示例的旧 node ID 替换为新名：`wave0` → `authoring-slides`、`hitl1` → `checkpoint-intake`、`hitl2` → `checkpoint-delivery`（详见 delta spec `specs/node-specification/spec.md`）

## 6. Main specs — notes-injection

- [ ] 6.1 将 `openspec/specs/notes-injection/spec.md` 中 "Circular wave2 proxy" scenario 的 `wave2` → `assembling-deck`，scenario 标题同步更新（详见 delta spec `specs/notes-injection/spec.md`）

## 7. 测试文件 — 硬编码 node ID 同步

- [ ] 7.1 `tests/test_md_controller_reader.mjs`：节点列表数组（line 15）中的旧名替换；`toContain("wave0")`（line 36）→ `toContain("authoring-slides")`；`.find(node => node.id === "wave0")`（line 37）→ `"authoring-slides"`
- [ ] 7.2 `tests_e2e/test-state-machine.mjs`：全部 ~25 处旧 node ID 替换（节点数组 lines 44-45、`hitl1`/`hitl2`/`wave0`/`wave1`/`wave2` 字符串字面量）
- [ ] 7.3 `tests/test_ppt_flow.mjs`：fixture YAML 中 `current_node: hitl1` → `checkpoint-intake`（line 403）、`hitl1:` → `checkpoint-intake:`（line 405）、断言 `toBe("hitl1")` → `toBe("checkpoint-intake")`（line 422）
- [ ] 7.4 `tests/test_bundle_layout.mjs`：`current_node = 'wave0'`（line 268）→ `'authoring-slides'`；断言 `toBe('wave0')`（line 274）→ `toBe('authoring-slides')`
- [ ] 7.5 `tests/test_state_yaml.mjs`：全部 ~12 处 `wave0`/`hitl1`/`hitl2` 字符串字面量替换

## 8. 验证

- [ ] 8.1 在 PPTMAKER_FRAMEWORK/ 中 `grep -rn "hitl1\|hitl2\|wave0\|wave1\|wave2" --include="*.md"`，确认零残留
- [ ] 8.2 在 openspec/specs/ 中 `grep -rn "hitl1\|hitl2\|wave0\|wave1\|wave2" --include="*.md"`，确认零残留
- [ ] 8.3 在 tests/ 和 tests_e2e/ 中 `grep -rn "hitl1\|hitl2\|wave0\|wave1\|wave2" --include="*.mjs"`，确认零残留
- [ ] 8.4 运行 `npm test`，确认全部测试通过（playbook 验证器识别新的 40 个全局唯一 node、无重复 ID、无 broken requires 链）
