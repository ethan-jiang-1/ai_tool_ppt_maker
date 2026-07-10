## 0. 对齐 playbook frontmatter 条件到 catalog

- [ ] 0.1 扫描所有 playbook 文件的 entry/exit 条件, 列出所有 prose 条件名
- [ ] 0.2 将 prose 条件名映射为 catalog 标准名 (node_completed:<name>, gate_approved:<name>, etc.)
- [ ] 0.3 catalog 覆盖不到的 node 特有条件, 标记为 `custom:<description>` (allow unknown, 人工判断)

## 1. 补全 charter/NODE-SPEC.md — Gate Conditions Catalog

- [ ] 1.1 在 NODE-SPEC.md 新增 "Gate Conditions Catalog" 章节
- [ ] 1.2 定义所有 FILESYSTEM 条件 (run_bundle_exists, visual_preset_seeded, style_master_exists, slide_specs_exists, pptx_generated, stage1_output_exists)
- [ ] 1.3 定义所有 STATE 条件 (node_completed:<name>, gate_approved:<name>, current_node_is:<name>)
- [ ] 1.4 定义所有 USER 条件 (user_confirmed_direction, review_decision_proceed, review_decision_repair)

## 2. 实现 state.mjs — CONDITIONS + checkEntry/checkExit

- [ ] 2.1 实现 CONDITIONS 注册表 (FILESYSTEM + STATE + USER 三类)
- [ ] 2.2 实现 parseNodeConditions(nodeName, playbookDir) — 读 playbook MD, 解析 frontmatter
- [ ] 2.3 实现 checkEntry(nodeName, playbookDir, state, ctx) → { pass, missing }
- [ ] 2.4 实现 checkExit(nodeName, playbookDir, state, ctx) → { pass, missing }

## 3. 扩展 tests_e2e/

- [ ] 3.1 entry gate: checkEntry('wave0', ...) 返回 missing: ['node_completed:seed-topics']
- [ ] 3.2 exit gate: checkExit('wave0', ...) 返回 pass: true 当条件满足
- [ ] 3.3 非法状态转换: setNodeStatus(completed) → setNodeStatus(in_progress) 被拒绝
- [ ] 3.4 skipped 状态: skipped node 对 requires 链的影响
- [ ] 3.5 YAML round-trip: 特殊字符、嵌套对象保真

## 4. 验证

- [ ] 4.1 `npm run test:e2e` 全部通过
- [ ] 4.2 `npm test` 不受影响
