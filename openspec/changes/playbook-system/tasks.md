## 1. 创建 charter/NODE-SPEC.md

- [ ] 1.1 创建 `PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md`:
  - Node 解剖: frontmatter 字段定义 (node/playbook/phase/requires/produces/entry/exit/shared)
  - State Schema: run-bundle-state.yaml 完整结构定义
  - Node status 枚举: pending|in_progress|completed|skipped|failed
  - Gate status 枚举: pending|approved|waived
  - Playbook 规则: node 串联、shared node 引用、CLI⇔MD 协议
  - 示例: 一个完整的 node frontmatter + body

## 2. 创建 playbook/ 目录和 5 个 Controller

- [ ] 2.1 `mkdir PPTMAKER_FRAMEWORK/playbook/`
- [ ] 2.2 创建共享 node `playbook/classify-change.md` (shared: true)——多个 playbook 引用
- [ ] 2.3 创建 `playbook/full-creation.md` — 11 nodes (instantiation→hitl1→setup→seed-topics→wave0→wave1→wave2→hitl2→readiness→rerun→final). 每个 node: frontmatter (node/phase/requires/entry/exit) + body (MD/CLI steps)
- [ ] 2.4 创建 `playbook/chain-a.md` — includes: classify-change → stage1-3-4-5 → verify-output
- [ ] 2.5 创建 `playbook/chain-b.md` — includes: classify-change → pilot → confirm → regenerate → verify-output
- [ ] 2.6 创建 `playbook/chain-c.md` — includes: classify-change → inject-notes → verify-notes
- [ ] 2.7 创建 `playbook/structural.md` — includes: classify-change → new-version → regenerate-affected

## 3. 重构 COMMANDS.md 为路由表

- [ ] 3.1 重写 `PPTMAKER_FRAMEWORK/COMMANDS.md`:
  - 路由表: 用户说 → playbook → 入口参数
  - 覆盖全量创建 + 4 个编辑链 + 迭代反馈场景
  - 不再包含命令速查内容 (那些在 playbook 里)

## 4. 创建 state 工具 + 适配 CLI 脚本

- [ ] 4.1 创建 `scripts/lib/state.mjs` — 纯手写 YAML reader/writer (零 npm 依赖): readState(runDir)/writeState(runDir, state). 仅操作 state 专用字段, 不触碰 project-metadata.yaml
- [ ] 4.2 `scripts/env-check.mjs`: check 结果写入 run-bundle-state.yaml (node status + foundation check results), 通过 lib/state.mjs
- [ ] 4.3 `scripts/bundle_layout.mjs`: --init 后创建 run-bundle-state.yaml 初始状态
- [ ] 4.4 `scripts/unified_pipeline.mjs`: Stage 2 执行前从 state 读 visual_gate + content_gate 状态, 验证通过才执行
- [ ] 4.5 `scripts/ppt_flow.mjs`: `approve` 命令写入 state 的 gates 字段

## 5. 更新 openspec

- [ ] 5.1 `openspec/config.yaml`: 注册表加 `node-specification` + `playbook-execution` capability
- [ ] 5.2 `openspec/specs/`: sync node-specification 和 playbook-execution spec

## 6. 验证

- [ ] 6.1 `node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs --self-check` 通过
- [ ] 6.2 `npm test` 全部通过
- [ ] 6.3 全量创建 playbook: node scripts/bundle_layout.mjs --init → 检查 state 文件生成了 initial state
- [ ] 6.4 迭代 playbook: 验证 entry gate 不满足时 CLI 拒绝执行, exit gate 不满足时 Agent 不能标记 completed
- [ ] 6.5 shared node: 验证 classify-change.md 被 chain-a 和 chain-b 正确引用不重复
