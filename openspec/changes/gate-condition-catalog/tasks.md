## 0. 对齐 playbook frontmatter 条件到 catalog

- [x] 0.1 扫描所有 6 个 playbook 文件的 entry/exit 条件, 列出全部 31 个条件
- [x] 0.2 将 prose 条件映射为 catalog 标准名 (见 design §4 完整映射表)
- [x] 0.3 更新 playbook frontmatter: 所有条件使用 catalog 标准名 + 冒号格式
- [x] 0.4 修复 pilot→confirm 链命名不一致 (pilot_approved_by_user → pilot_approved)
- [x] 0.5 修复 intake_complete 自指循环 (hitl1 exit 只用 user_confirmed_direction)

## 1. 补全 charter/NODE-SPEC.md — Gate Conditions Catalog

- [x] 1.1 新增 "Gate Conditions Catalog" 章节, 含 3 类条件完整表 (16 个条件)
- [x] 1.2 FILESYSTEM (8): run_bundle_exists, deck_guide_created, visual_preset_seeded, style_master_exists, slide_specs_exists, stage1_output_exists, pptx_generated, speaker_notes_injected
- [x] 1.3 STATE (5): node_completed:<name>, node_status:<name>:<s>, gate_approved:<name>, current_node_is:<name>, playbook_is:<name>
- [x] 1.4 USER (3): user_confirmed_direction, review_decision_proceed, review_decision_repair
- [x] 1.5 自定义条件策略: 不在 catalog → unknown → Agent 人工判断

## 2. 实现 scripts/lib/state.mjs — 完整 State API

- [ ] 2.1 READ/QUERY: readStateRobust (主入口), readState, writeState, statePath, getNodeStatus, getCurrentNode, getCompletedNodes, getPendingNodes, isNodeCompleted, isPlaybookComplete
- [ ] 2.2 GATE: getGateStatus, isGateApproved
- [ ] 2.3 VALIDATE: checkEntry, checkExit, getMissingConditions, validateState
- [ ] 2.4 CONDITIONS 注册表 (16 个条件 + 参数化工厂, 操作组装后的 state 对象)
- [ ] 2.5 WRITE: setNodeStatus, resetNode, skipNode, setGate, switchPlaybook, startPlaybook, resumePlaybook
- [ ] 2.6 FACTORY: createInitialState (创建 _state/ 目录 + 四文件初始化)
- [ ] 2.7 INFRA: 实现 _state/ 目录结构 (state.yaml + history.jsonl)
- [ ] 2.7a INFRA: bundle_layout.mjs --init 自动创建 _state/ + 初始 state.yaml
- [ ] 2.8 SAFETY: writeState 原子写 (tmp → rename)
- [ ] 2.9 HISTORY: appendHistory — 追加单行 JSON, 原子写
- [ ] 2.10 HISTORY: readHistory — 读全部事件, 跳过损坏行
- [ ] 2.11 parseNodeConditions: 读 playbook MD, 解析 frontmatter entry/exit 列表
- [ ] 2.12 `node_done:<name>` 条件: 接受 completed OR skipped
- [ ] 2.13 Playbook 栈: playbook_stack + switchPlaybook push + resumePlaybook pop
- [ ] 2.14 JS simple: readState 损坏→返回 {corrupted:true}, LLM 手动修. 不抛异常

## 3. CLI: ppt_flow state 命令

- [x] 3.1 `ppt_flow.mjs state <runDir>` — 人类可读状态摘要
- [x] 3.2 `ppt_flow.mjs state <runDir> --json` — JSON 输出
- [x] 3.3 `ppt_flow.mjs state <runDir> --check-gates` — gate 验证, exit 0/1

## 4. 扩展 tests_e2e/test-state-machine.mjs

- [x] 4.1 entry gate: checkEntry('wave0', ...) 返回 {pass:false, missing:[...]} 当 seed-topics pending
- [x] 4.2 exit gate: checkExit('wave0', ...) 返回 {pass:true} 当条件满足
- [x] 4.3 validateState: completed→in_progress 被检测为非法
- [x] 4.4 node_done: skipNode → checkEntry 对依赖 skipped node 的下游 node 通过
- [x] 4.5 resetNode: rerun 循环中 resetNode('seed-topics') 清除 extra, 允许重新执行
- [x] 4.6 playbook_stack: switchPlaybook push → resumePlaybook pop → 位置恢复
- [x] 4.7 原子写: 中间 crash → state 文件仍是完整旧版或完整新版
- [x] 4.8 YAML round-trip: 特殊字符、嵌套对象保真
- [x] 4.9 state 损坏: 无效 YAML → readState 返回 {corrupted:true, errors:[...]}
- [x] 4.10 空 state: 文件不存在 → readState 返回初始态
- [x] 4.11 create-deck 全流程: 11 nodes 完整执行, 每步 state 正确
- [x] 4.12 pilot→confirm 链: 命名对齐后 entry/exit 匹配

## 5. 验证

- [x] 5.1 `npm run test:e2e` 全部通过 (≥15 tests)
- [x] 5.2 `npm test` 不受影响 (25/25)
- [x] 5.3 charter/NODE-SPEC.md 中 catalog 与 state.mjs CONDITIONS 注册表一致
