## 0. 对齐 playbook frontmatter 条件到 catalog

- [x] 0.1 扫描所有 6 个 playbook 文件的 entry/exit 条件, 列出全部 31 个条件
- [x] 0.2 将 prose 条件映射为 catalog 标准名 (见 design §6 完整映射表)
- [x] 0.3 更新 playbook frontmatter: 所有条件使用 catalog 标准名 + 冒号格式
- [x] 0.4 修复 pilot→confirm 链命名不一致 (pilot_approved_by_user → pilot_approved)
- [x] 0.5 修复 intake_complete 自指循环 (hitl1 exit 只用 user_confirmed_direction)

## 1. 补全 charter/NODE-SPEC.md

- [x] 1.1 新增 "Gate Conditions Catalog" 章节 (16 个条件, 3 类)
- [x] 1.2 新增 "State API" 章节 (READ/QUERY/VALIDATE/WRITE/SAFETY)
- [x] 1.3 新增 `_state/` 目录结构说明 (state.yaml + history.jsonl)
- [x] 1.4 新增条件格式约定 (冒号 vs 下划线) + 自定义条件策略

## 2. 实现 state.mjs — 已完成的单文件 API (14/14 done)

- [x] 2.1 readState, writeState (原子写 tmp→rename), statePath
- [x] 2.2 getNodeStatus, getCurrentNode, getCompletedNodes, getPendingNodes
- [x] 2.3 isNodeCompleted, isNodeDone, isPlaybookComplete
- [x] 2.4 getGateStatus, isGateApproved
- [x] 2.5 setNodeStatus, resetNode, skipNode, setGate
- [x] 2.6 switchPlaybook, resumePlaybook, startPlaybook (playbook_stack)
- [x] 2.7 createInitialState, createDefaultState
- [x] 2.8 CONDITIONS 注册表 (11 条件 + 参数化工)
- [x] 2.9 checkEntry, checkExit, getMissingConditions
- [x] 2.10 parseNodeConditions (读 playbook MD, 解析 frontmatter)
- [x] 2.11 `node_done:<name>` 条件 (completed OR skipped)
- [x] 2.12 validateState (detect completed→in_progress)
- [x] 2.13 readState 损坏→{corrupted:true}, JS 不抛异常
- [x] 2.14 YAML parser/writer (零依赖)

## 3. 升级 state.mjs — 多文件 + history (4 pending)

- [x] 3.1 实现 `_state/` 目录结构读写 (readState 读 state.yaml, writeState 写 state.yaml)
- [x] 3.2 bundle_layout.mjs --init 自动创建 `_state/` + 初始 state.yaml
- [x] 3.3 appendHistory: 追加单行 JSON 到 history.jsonl, 原子写
- [x] 3.4 readHistory: 读 history.jsonl 全部事件, 跳过损坏行

## 4. CLI 命令 (done)

- [x] 4.1 `ppt_flow.mjs state <runDir>` — 人类可读状态摘要
- [x] 4.2 `ppt_flow.mjs state <runDir> --json` — JSON 输出
- [x] 4.3 `ppt_flow.mjs state <runDir> --check-gates` — gate 验证 (exit 0/1)

## 5. 测试 (done)

- [x] 5.1 e2e: 16 tests 全部通过 (happy path, gates, rerun, skip, stack, corrupt, atomic)
- [x] 5.2 unit: 25/25 不受影响

## 6. 验证 (done)

- [x] 6.1 `node scripts/bundle_layout.mjs --self-check` 通过
- [x] 6.2 NODE-SPEC.md catalog 与 state.mjs CONDITIONS 一致
