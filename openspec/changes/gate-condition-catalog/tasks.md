## 0. 对齐 playbook frontmatter 条件到 catalog

- [ ] 0.1 扫描所有 6 个 playbook 文件的 entry/exit 条件, 列出全部 37 个 prose 条件名
- [ ] 0.2 将 prose 条件名映射为 catalog 标准名 (10 个直接映射, 3 个新增, 其余标记 custom)
- [ ] 0.3 更新 playbook frontmatter: prose 条件 → catalog 标准名

## 1. 补全 charter/NODE-SPEC.md — Gate Conditions Catalog

- [ ] 1.1 新增 "Gate Conditions Catalog" 章节, 含 3 类条件完整表 (16 个条件)
- [ ] 1.2 FILESYSTEM (8): run_bundle_exists, deck_guide_created, visual_preset_seeded, style_master_exists, slide_specs_exists, stage1_output_exists, pptx_generated, speaker_notes_injected
- [ ] 1.3 STATE (5): node_completed:<name>, node_status:<name>:<s>, gate_approved:<name>, current_node_is:<name>, playbook_is:<name>
- [ ] 1.4 USER (3): user_confirmed_direction, review_decision_proceed, review_decision_repair
- [ ] 1.5 自定义条件策略: 不在 catalog → unknown → Agent 人工判断

## 2. 实现 scripts/lib/state.mjs — 完整 State API

- [ ] 2.1 READ/QUERY: readState, writeState, statePath, getNodeStatus, getCurrentNode, getCompletedNodes, getPendingNodes, isNodeCompleted, isPlaybookComplete
- [ ] 2.2 GATE: getGateStatus, isGateApproved
- [ ] 2.3 VALIDATE: checkEntry, checkExit, getMissingConditions, validateState
- [ ] 2.4 CONDITIONS 注册表 (16 个条件 + 参数化工厂)
- [ ] 2.5 WRITE: setNodeStatus, resetNode, skipNode, setGate, switchPlaybook, startPlaybook
- [ ] 2.6 FACTORY: createInitialState
- [ ] 2.7 SAFETY: readState 处理文件不存在 (返回初始态) 和 YAML 损坏 (返回 {corrupted:true})
- [ ] 2.8 parseNodeConditions: 读 playbook MD, 解析 frontmatter entry/exit 列表

## 3. CLI: ppt_flow state 命令

- [ ] 3.1 `ppt_flow.mjs state <runDir>` — 人类可读状态摘要
- [ ] 3.2 `ppt_flow.mjs state <runDir> --json` — JSON 输出
- [ ] 3.3 `ppt_flow.mjs state <runDir> --check-gates` — gate 验证, exit 0/1

## 4. 扩展 tests_e2e/test-state-machine.mjs

- [ ] 4.1 entry gate: checkEntry('wave0', ...) 返回 {pass:false, missing:['node_completed:seed-topics']}
- [ ] 4.2 exit gate: checkExit('wave0', ...) 返回 {pass:true} 当条件满足
- [ ] 4.3 非法状态转换: completed→in_progress 被 validateState 发现
- [ ] 4.4 skipped 节点: skipNode → checkEntry 对 depends-on-skipped-node 仍通过
- [ ] 4.5 rerun 循环: resetNode('seed-topics') → 重新执行 → state 正确覆盖
- [ ] 4.6 playbook 切换: switchPlaybook → 两个 playbook 的 node 共存无冲突
- [ ] 4.7 YAML round-trip: 特殊字符、嵌套对象保真
- [ ] 4.8 state 损坏恢复: 写入损坏 YAML → readState 返回 {corrupted:true}
- [ ] 4.9 空 state: 文件不存在 → readState 返回初始态
- [ ] 4.10 create-deck 全流程: 11 nodes 完整执行, 每步 state 正确

## 5. 验证

- [ ] 5.1 `npm run test:e2e` 全部通过 (≥15 tests)
- [ ] 5.2 `npm test` 不受影响 (25/25)
- [ ] 5.3 charter/NODE-SPEC.md 中 catalog 与 state.mjs CONDITIONS 注册表一致
