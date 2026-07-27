# AGENTS.md — ai_tool_ppt_maker

> Agent 进入这个 repo 后第一份该读的文件.

## 这是什么项目

AI 驱动的 PPT 生成系统. Agent 是编排器——读方法论文档 → 做创意判断 → 跑生产管线 → 响应迭代.

核心技术栈: **Node.js 18+ ESM (.mjs)**. 依赖: `@napi-rs/canvas`, `pptxgenjs`, `commander`.

## 目录地图

```
ai_tool_ppt_maker/
├── PPTMAKER_FRAMEWORK/        ← 方法论知识库 (soft bundle, 只读)
│   ├── BOOTSTRAP.md           ← Agent 三步启动入口
│   ├── charter/               ← 宪法 / 铁律 / 流程摘要
│   ├── workflow/              ← 00-setup … 05-iteration 方法论
│   ├── scripts/               ← 生产管线 (.mjs)
│   ├── playbook/              ← 自然语言意图路由（附录）
│   └── reference/             ← glossary / anti-patterns / quick-start
├── tests/                     ← 测试文件 (.mjs)
├── tests_e2e/                 ← 端到端测试
├── openspec/                  ← OpenSpec spec-driven 开发
├── _backlog/                  ← 待办/Bug/Plan 簿记 - 如果不指定, 就不许读
├── deck_*/                    ← [产出] run bundle — 框架生产出的 PPT 项目目录
├── dpt_*/                     ← [输入] deep research 素材 - 如果不指定，就不许读
├── package.json               ← npm 依赖声明
└── vitest.config.mjs          ← 测试配置
```

## 快速命令

| 做什么 | 命令 |
|--------|------|
| 环境检查 | `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor` |
| 跑回归测试 | `npm test` |
| 管线入口 | `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs <cmd>` |
| 打印目录宪法 | `node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs` |
| 校验 run bundle | `node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs --check <dir>` |

## 框架边界

本仓库只有 4 个目录是框架源代码：

| 框架目录 | 是什么 |
|----------|--------|
| `PPTMAKER_FRAMEWORK/` | 方法论 + 管线脚本（soft bundle） |
| `openspec/` | 规格系统 |
| `tests/` | 单元/集成测试 |
| `tests_e2e/` | 端到端测试 |

**`deck_*` 和 `dpt_*` 是框架的产出物**——`deck_*` 是 run bundle（`ppt_flow.mjs init` 创建，做 PPT 时 Agent 在里面工作），`dpt_*` 是 deep research 素材。它们是生产数据，不是框架代码。

Agent 探索/理解框架时只看上面 4 个源码目录。**做具体 deck 时由用户指定 deck 路径，然后在该 run bundle 内操作。**

## 关键约束

- 做具体 PPT 时 `PPTMAKER_FRAMEWORK/` 是只读方法论；repo 维护 change 可以按 OpenSpec 任务修改框架源
- Agent 拥有过程, 人类拥有内容
- 先按所有权和失效产物选择最小刷新路径：Header Text & Style Refresh / Generated Image Rebuild / Notes-Only Refresh；增删重排先走 Structural Versioning Path
- 页面 `slide_id` 是跨版本身份，`position` 只属于当前快照；结构编辑必须 preview + exact plan hash，提交/materialization 零远端调用，`needs_render` 另行授权
- 新 deck 使用 `identity.scheme: mnemonic-v1`；Agent 编写 5–8 字母、恰好两块 BlockCase 的可口述 ID，优先 5–6
- `_generated/` 内一切都可以重跑管线重新生成, 绝不手动编辑
- 新 deck 使用 Page Authority 的 `pure-image2` / `framed-image2`；legacy `RENDER MODE`
  的 `full-page` / `body+header-lock` 只属于显式指定的旧 run，Page Authority source 拒绝它

## 从哪里开始

如果是做 PPT → 读 `PPTMAKER_FRAMEWORK/BOOTSTRAP.md` → `PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md`
如果是改代码 → 看 `openspec/specs/` 和 `_backlog/`
如果是修 bug → 看 `_backlog/bugs/`

## CLI / MD 诊断维护路由

- 新增或修改 direct CLI、命令、exit path、stdout JSON、stderr diagnostic、child process、`cli_error.mjs`：先读 `openspec/specs/cli-surface/spec.md`，再用 `openspec status` 找 active `cli-surface` delta，并复用 `PPTMAKER_FRAMEWORK/scripts/lib/cli_error.mjs`。
- 修改 MD Controller / state 对 CLI 回执的消费：先读 `openspec/specs/node-specification/spec.md`，再读 active `node-specification` delta。producer 字段与发射规则仍以 `cli-surface` 为权威，不在 consumer 侧复制 schema。
- 上述是 framework repository maintenance；run-bundle 生产 Agent 仍不得修改 framework，也不得手改 `_generated/`。
