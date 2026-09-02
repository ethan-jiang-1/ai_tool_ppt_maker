# Tests — PPT Maker Harness 测试体系

## 测试 Tier 体系

本仓库的测试分为 5 个 tier，按**速度/风险/反馈周期**分层：

```
                    ┌─────────────────────────────────────┐
                    │        npm run test:real-e2e         │  ← 最慢，需要真实 provider
                    │  (tests_e2e/test_real_*.mjs)         │
                    ├─────────────────────────────────────┤
                    │        npm run test:mock-e2e         │  ← 模拟端到端
                    │  (tests_e2e/test_mock_*.mjs)         │
                    ├─────────────────────────────────────┤
                    │        npm run test:focused          │  ← 单个选定测试
                    │  (node ... focused <path>)           │
                    ├─────────────────────────────────────┤
                    │        npm run test:sweep            │  ← 全量单元/集成测试
                    │  (vitest run, 默认 config)            │
                    ├─────────────────────────────────────┤
                    │        npm test                      │  ← 核心验证（最快）
                    │  (bounded core admission)            │
                    └─────────────────────────────────────┘
```

另有 **`process` tier**（`tests/**/test_process_*.mjs`），通过 `npm run test:process` 运行，用于验证 CLI 子进程行为。该 tier 被默认 sweep 排除（配置在 `vitest.config.mjs` 的 exclude 中），因为其进程级 setup 较重，需显式选择。

### npm script 映射

| 命令 | 层级 | 说明 |
|------|------|------|
| `npm test` | 核心验证 | 受保护的核心验证（admission-controlled），跑 `run_development_verification.mjs` |
| `npm run test:sweep` | 全量 | `vitest run`，跑所有 `tests/**/test_*.mjs`（排除 `test_process_*` 和 fixture） |
| `npm run test:focused` | 精选 | 跑单个选定测试文件：`node tests/contracts/run_selected_verification.mjs focused <path>` |
| `npm run test:process` | 进程级 | 跑 `test_process_*.mjs` 文件集合 |
| `npm run test:mock-e2e` | 模拟 E2E | 跑 `tests_e2e/test_mock_*.mjs` |
| `npm run test:real-e2e` | 真实 E2E | 跑 `tests_e2e/test_real_*.mjs`，需要 `PPTMAKER_RUN_REAL_E2E=1` |

### 选择指南

| 你想做什么 | 应该跑的测试 |
|-----------|-------------|
| 改了一个小模块，快速验证没炸 | `npm test`（< 5 秒） |
| 改了一批文件，想确认全量通过 | `npm run test:sweep`（~2 分钟） |
| 只改了一个特定文件，只想测它 | `npm run test:focused tests/<path>/test_<name>.mjs` |
| 改了 CLI 行为或子进程逻辑 | `npm run test:process tests/<path>/test_process_<name>.mjs` |
| 改了管线编排，验证完整流程 | `npm run test:mock-e2e` |
| 改了 provider 交互，验证真实调用 | `PPTMAKER_RUN_REAL_E2E=1 npm run test:real-e2e` |

## 测试目录结构

```
tests/
├── 00-setup/              # 环境检查、运行时检测
├── 01-content/            # 内容解析、slide 文档、narrative 规划
├── 02-visual-system/      # 视觉系统、design system
├── 03-framed-image/       # Framed 管线单元测试
├── 04-pure-image/         # Pure 管线单元测试
├── 05-delivery/           # 交付 PPTX 组装
├── 06-iteration/          # 迭代 refresh 路由
├── contracts/             # 跨模块契约测试（governance、CLI surface、schema conformance）
│   └── fixtures/          # 测试夹具（admission 验证用）
├── helpers/               # 测试辅助函数、fixture 构建
└── shared/                # 共享模块测试
    ├── cli/               # CLI 错误处理、diagnostics
    ├── diagnostic/        # 诊断事实
    ├── image2/            # Image2 生成、style master、progressive raw
    ├── identity/          # 身份哈希
    ├── page-image/        # Page Image core
    ├── run-bundle/        # Run bundle 布局、binding、lessons
    ├── state/             # 状态模块
    └── workflow/          # 工作流检测、task projection
tests_e2e/                 # 端到端测试
├── shared/                # E2E fixture 共享
└── ...                    # mock 和 real provider 测试
```

## 测试配置

| 配置文件 | 用途 |
|----------|------|
| `vitest.config.mjs` | 默认：单元/集成测试（排除 `test_process_*`） |
| `vitest.process.config.mjs` | 进程级测试（只包含 `test_process_*`） |
| `vitest.e2e.config.mjs` | 模拟端到端测试 |
| `vitest.real-e2e.config.mjs` | 真实端到端测试（超时 10 分钟，单 worker） |

## 核心验证（`npm test`）

`npm test` 跑的是 `tests/contracts/run_development_verification.mjs`，它不是一个普通的 vitest 运行——它通过 admission control 筛选出核心测试文件，在 60 秒内完成验证。这是 CI 中最快的反馈环。

## 编写测试

- 测试文件命名：`test_<描述>.mjs` 或 `test-<描述>.mjs`
- 进程级测试命名：`test_process_<描述>.mjs`
- 夹具放在对应测试目录的 `fixtures/` 子目录下
- 跨测试共享的辅助函数放在 `tests/helpers/`
- 每个测试文件顶部标注对应的 capability spec（见 spec-to-test traceability 注释）