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
├── openspec/                  ← OpenSpec spec-driven 开发
├── _backlog/                  ← 待办/Bug/Plan 簿记
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

## 关键约束

- `PPTMAKER_FRAMEWORK/` 是只读方法论——Agent 从这里学习, 不修改它
- Agent 拥有过程, 人类拥有内容
- 编辑链 A/B/C 分类后再跑管线, 不要每次都全量
- `_generated/` 内一切都可以重跑管线重新生成, 绝不手动编辑
- RENDER MODE 只有两个: `full-page` / `body+header-lock`

## 从哪里开始

如果是做 PPT → 读 `PPTMAKER_FRAMEWORK/BOOTSTRAP.md` → `PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md`
如果是改代码 → 看 `openspec/specs/` 和 `_backlog/`
如果是修 bug → 看 `_backlog/bugs/`
