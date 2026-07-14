> **实施顺序：** 先读 `design.md`（特别是 §2 State migration 的执行顺序和 mergeMissing 语义），再按 0→9 顺序执行。每节内部无严格顺序要求。`npm test` 和 `npm run test:e2e` 只在第 9 节验证阶段运行——中间步骤预计不通过。
>
> **搜索替换策略：** 大部分步骤是字符串替换。建议先全局搜索确认位置，再逐文件替换。⚠️ 注意区分：`state.nodes.wave0`（dot-notation，须改）vs `state.nodes[node]`（变量 bracket，不改）。

## 0. 前置修复 — e2e 基线

- [ ] 0.1 `tests_e2e/test-state-machine.mjs` 的 `initState()`（line 21）手造 state 对象，缺少 `schema_version`、`execution_started_at`、`execution_id` 等 schema v2 必需字段。修复：删除 `initState` 的 `playbook` 参数和手造逻辑，改为 `createInitialState(deckName, 'keynote', 'dark-executive')` + `writeState(deckDir, state)` + `return state`。当前所有调用方只传 `deckDir`，不传非默认 playbook——直接删参数即可
- [ ] 0.2 运行 `npm run test:e2e` 确认基线全绿（17 passed），再开始后续步骤

## 1. Framework — create-deck playbook（node ID 重命名）

- [ ] 1.1 将 `hitl1` → `checkpoint-intake`：node ID（line 34）、heading（line 31）、`requires: [hitl1]`（line 55）
- [ ] 1.2 将 `hitl2` → `checkpoint-final-review`：node ID（line 151）、heading（line 148）、所有 `requires: [hitl2]`（lines 171, 193）、`node_decision:hitl2:proceed`（line 173）、`node_decision:hitl2:repair`（line 195）、body 文字"重置 hitl1 及其下游"（line 163）、"返回 hitl2"（line 201）
- [ ] 1.3 将 `wave0` → `authoring-slides`：node ID（line 93）、heading（line 90）、`requires: [wave0]`（line 115）
- [ ] 1.4 将 `wave1` → `composing-prompts`：node ID（line 112）、heading（line 109）、`requires: [wave1]`（line 133）
- [ ] 1.5 将 `wave2` → `producing-deck`：node ID（line 130）、heading（line 127）、`requires: [wave2]`（line 154）
- [ ] 1.6 更新流程行（line 9）：`instantiation → checkpoint-intake → setup → seed-topics → authoring-slides → composing-prompts → producing-deck → checkpoint-final-review → readiness/rerun → final`

## 2. Framework — NODE-SPEC.md 示例

- [ ] 2.1 所有 YAML 示例中 `node: wave0` → `node: authoring-slides`（lines 19, 175）
- [ ] 2.2 State 示例中 `current_node: wave0` → `current_node: authoring-slides`（line 55）、`wave0:` → `authoring-slides:`（line 62）
- [ ] 2.3 State 示例中 `hitl2:` → `checkpoint-final-review:`（line 70）
- [ ] 2.4 完整示例 heading `# wave0: Foundation Shared Reference` → `# authoring-slides: Foundation Shared Reference`（line 187）

## 3. Framework — COMMANDS.md 路由文字

- [ ] 3.1 "回 hitl2 → rerun → seed-topics" → "回 checkpoint-final-review → rerun → seed-topics"（line 75）

## 4. Framework — state.mjs：添加 NODE_ALIASES 并扩展 applyNodeAliases

- [ ] 4.1 在 `NODE_ALIASES` 常量中新增 `create-deck` 条目，包含 5 条映射：`hitl1→checkpoint-intake`、`hitl2→checkpoint-final-review`、`wave0→authoring-slides`、`wave1→composing-prompts`、`wave2→producing-deck`
- [ ] 4.2 调整 `healState()` 执行顺序并扩展 alias 逻辑。详见 design §2 决策 1-2。要点：(a) 调整 `healState()` 三阶段顺序为 normalize → alias → restrict；(b) pointer 迁移与 record 存在性解耦——无 `nodes[legacyId]` 时也迁移 `current_node`；(c) 遍历 `playbook_stack`（此时已规范化），对匹配条目迁移 `current_node` 和 `controller_nodes` key，采用 `mergeMissing` 浅合并语义（canonical 优先，仅补顶层缺失字段）；(d) execution ID 由 healer 按所属 execution 规范化，timestamps 按兼容性规则清理
- [ ] 4.3 验证：alias migration 对顶层 `current_node`（含 pointer-only：有 pointer 无 record）、`nodes` key、`playbook_stack[].current_node`、`playbook_stack[].controller_nodes` key 全部生效，且 migration 幂等

## 5. Main specs — playbook-execution

- [ ] 5.1 将 `openspec/specs/playbook-execution/spec.md` 中节点列表更新为：`instantiation, checkpoint-intake, setup, seed-topics, authoring-slides, composing-prompts, producing-deck, checkpoint-final-review, readiness, rerun, final`

## 6. Main specs — node-specification

- [ ] 6.1 将 `openspec/specs/node-specification/spec.md` 中所有 scenario 示例的旧 node ID 替换为新名（详见 delta spec `specs/node-specification/spec.md`），并新增 playbook_stack alias migration scenario

## 7. Main specs — notes-injection

- [ ] 7.1 将 `openspec/specs/notes-injection/spec.md` 中 "Circular wave2 proxy" scenario 的 `wave2` → `producing-deck`，scenario 标题同步更新（详见 delta spec `specs/notes-injection/spec.md`）

## 8. 测试文件 — 硬编码 node ID 同步

- [ ] 8.1 `tests/test_md_controller_reader.mjs`：`EXPECTED_CONTROLLER_MANIFEST` 中 create-deck 数组（line 15）的旧名替换；`toContain("wave0")`（line 36）→ `toContain("authoring-slides")`；`.find(node => node.id === "wave0")`（line 37）→ `"authoring-slides"`
- [ ] 8.2 `tests_e2e/test-state-machine.mjs`：全局搜索替换所有旧 node ID——在 5 个数组字面量（lines 44, 131, 156, 216）、setNodeStatus/skipNode 调用、test title 字符串、注释中。⚠️ 搜索替换后手动修复 dot-notation→bracket（lines 148, 166）：`final.nodes.hitl2.decision` → `final.nodes['checkpoint-final-review'].decision`。变量访问 `state.nodes[node]` 不用改（本来就是 bracket）
- [ ] 8.3 `tests/test_ppt_flow.mjs`：fixture YAML 中 `current_node: hitl1` → `checkpoint-intake`（line 403）、`hitl1:` → `checkpoint-intake:`（line 405）、断言 `toBe("hitl1")` → `toBe("checkpoint-intake")`（line 422）
- [ ] 8.4 `tests/test_bundle_layout.mjs`：`current_node = 'wave0'`（line 268）→ `'authoring-slides'`；断言 `toBe('wave0')`（line 274）→ `toBe('authoring-slides')`
- [ ] 8.5 `tests/test_state_yaml.mjs`：**(a) 非 migration 测试（lines 247-262, 356-366）**——`wave0` → `authoring-slides`，`hitl1` → `checkpoint-intake`。⚠️ dot-notation 改 bracket：`s.nodes.wave0` → `s.nodes['authoring-slides']`；(b) **migration 测试（lines 265-293）**——line 276 legacy fixture 中的 `current_node: 'hitl2'` 保留不改为旧名，用于验证 alias 迁移逻辑
- [ ] 8.6 在 `tests/test_state_yaml.mjs` 中新增 migration test（放在现有 migration test 附近），覆盖 create-deck 迁移：(a) 5 个旧名全部映射；(b) pointer-only——`current_node: hitl2` 无对应 record 也迁移 pointer；(c) collision——`nodes` 同时有 `wave0` 和 `authoring-slides`，canonical 优先（status/decision），legacy 独有顶层字段补入，legacy key 删除，execution ID 由 healer 规范化；(d) playbook_stack 条目中的旧名迁移 + stack collision——`playbook_stack.0.controller_nodes` 中 legacy 和 canonical key 共存，验证相同的 canonical-priority 规则；(e) 迁移后 `state.diagnostics` 包含 create-deck rename 相关迁移消息（至少一条）。所有 fixture 使用旧名（合法残留）

## 9. 验证

- [ ] 9.1 在 `PPTMAKER_FRAMEWORK/` 中运行：`grep -rn "hitl1\|hitl2\|wave0\|wave1\|wave2" --include="*.md" PPTMAKER_FRAMEWORK/playbook/ PPTMAKER_FRAMEWORK/charter/ PPTMAKER_FRAMEWORK/COMMANDS.md`。零残留（state.mjs 是 .mjs 文件，不在此 grep 范围内；其 NODE_ALIASES 由 9.4 单独验证）
- [ ] 9.2 在 `openspec/specs/` 中运行：`grep -rn "hitl1\|hitl2\|wave0\|wave1\|wave2" --include="*.md" openspec/specs/`。允许命中：`node-specification/spec.md` 的 migration scenarios（scenario 名含 "alias"、"pointer-only"、"coexist"、"stack entries"）。其余零残留
- [ ] 9.3 在 `tests/` 和 `tests_e2e/` 中运行：`grep -rn "hitl1\|hitl2\|wave0\|wave1\|wave2" --include="*.mjs" tests/ tests_e2e/`。允许命中：所有 migration fixtures（task 8.6 新增 + task 8.5 保留的现有 fixture line 276）。其余零残留
- [ ] 9.4 确认 `state.mjs` 的 `NODE_ALIASES` 中 5 条 create-deck 映射完整且 key/value 正确
- [ ] 9.5 运行 `npm test`：确认 playbook 验证器通过（40 个全局唯一 node、无重复 ID、无 broken requires 链）、migration alias 测试通过（task 8.6：alias 映射、pointer-only、collision、stack migration）。运行 `npm run test:e2e`：确认新 canonical ID 下的状态机流程全部通过（17 passed）
