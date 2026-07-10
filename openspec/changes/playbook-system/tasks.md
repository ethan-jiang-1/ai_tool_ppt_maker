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
- [ ] 2.2 创建 `playbook/full-creation.md` — 11 nodes:
  - instantiation: 创建 run bundle
  - hitl1: 人机交互, 确认方向/profile/topics
  - setup: 配置 research profile
  - seed-topics: 生成初始 topic 列表
  - wave0: 基础证据收集
  - wave1: 深度证据收集
  - wave2: 综合与交叉验证
  - hitl2: 人机交互, 审阅 synthesis
  - readiness: 最终交付前检查
  - rerun: 重跑/修复循环
  - final: 最终报告生成
  - 每个 node 有完整的 frontmatter (entry/exit) + body (MD steps + CLI steps)
- [ ] 2.3 创建 `playbook/chain-a.md` — 文本修改 (~3 nodes): classify-change → stage1-3-4-5 → verify-output
- [ ] 2.4 创建 `playbook/chain-b.md` — 视觉修改 (~5 nodes): classify-change → pilot → confirm → regenerate → verify-output
- [ ] 2.5 创建 `playbook/chain-c.md` — 备注修改 (~2 nodes): classify-change → inject-notes → verify-notes
- [ ] 2.6 创建 `playbook/structural.md` — 结构变更 (~3 nodes): classify-change → new-version → regenerate-affected

## 3. 重构 COMMANDS.md 为路由表

- [ ] 3.1 重写 `PPTMAKER_FRAMEWORK/COMMANDS.md`:
  - 路由表: 用户说 → playbook → 入口参数
  - 覆盖全量创建 + 4 个编辑链 + 迭代反馈场景
  - 不再包含命令速查内容 (那些在 playbook 里)

## 4. 适配 CLI 脚本 (增加 state 读写)

- [ ] 4.1 `scripts/env-check.mjs`: 输出写入 run-bundle-state.yaml (node status + foundation check results)
- [ ] 4.2 `scripts/bundle_layout.mjs`: --init 后创建 run-bundle-state.yaml 初始状态
- [ ] 4.3 `scripts/unified_pipeline.mjs`: Stage 2 执行前从 state 读 visual_gate + content_gate 状态, 验证通过才执行
- [ ] 4.4 `scripts/ppt_flow.mjs`: `approve` 命令写入 state 的 gates 字段

## 5. 更新 openspec

- [ ] 5.1 `openspec/config.yaml`: 注册表加 `node-specification` + `playbook-execution` capability
- [ ] 5.2 `openspec/specs/`: sync node-specification 和 playbook-execution spec

## 6. 验证

- [ ] 6.1 `node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs --self-check` 通过
- [ ] 6.2 `npm test` 全部通过
- [ ] 6.3 全量创建 playbook: 模拟 Agent 从 instantiation 走到 final, 验证 state 正确更新
- [ ] 6.4 迭代 playbook: 模拟 chain-a, 验证 entry gate 检查 + exit gate 验证
