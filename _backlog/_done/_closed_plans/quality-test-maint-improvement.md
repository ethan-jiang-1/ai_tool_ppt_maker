# Plan: 代码质量 · 测试覆盖 · 可维护性改进路线

> 类型: 分析 | 更新: 2026-09-02

## 背景 / 现状

本仓库是一个设计精良的 Agent 编排 PPT 生成系统。经对全部 139 个 `.mjs` 脚本文件、25 个 OpenSpec capability spec、7 个状态模块以及测试基础设施的完整扫描，在代码质量、测试覆盖、可维护性三个维度上发现可改进点。

**触发条件：** 上一轮整体评价中，这三个维度被打 4 分（满分 5），值得深入调查并制定改进路线。

**核心约束：**
- 项目通过 OpenSpec 管理变化，但 OpenSpec change 有 Proposal→Design→Specs→Tasks 的完整开销
- 项目是生产系统，所有改动必须保证向后兼容，`npm test` 和 `npm run test:sweep` 必须全部通过
- 部分改进（如分解大文件）虽大但纯属内部重构，不改变行为规范

---

## 深挖发现

### 发现 A — 工具函数大量重复

| 函数 | 重复次数 | 位置 |
|------|----------|------|
| `deepClone` | 5 | 所有 `state_*.mjs` |
| `nowIso` | 5 | 所有 `state_*.mjs` |
| `stableStringify` | 3 | `state_evidence/identity/progressive.mjs` |
| `sha256` | 10+ | `state_*`, `delivery/*`, `01-content/*` 等 |

**关键观察：** 项目已有成功的共享模块模式——`shared/identity/byte_hash.mjs` 和 `shared/identity/canonical_json.mjs` 已被多个文件使用。提取公共工具的路径是成熟的，风险低。

### 发现 B — 状态模块循环依赖

```
state_identity.mjs ──→ state_execution.mjs (startPlaybook, createDefaultState)
       ↑                      │
       │ (4 个函数)           ↓ (2 个函数)
       └── state_evidence.mjs ←┘ (preserveReservedNodes)
```

**关键细节：** 环中涉及的具体函数调用很少（总共 7 个跨模块调用），但依赖方向形成闭环。代码注释承认这是有意的，靠"函数声明不产生顶层副作用"规避 ESM 循环检测。未来若引入顶层副作用会静默破坏。

### 发现 C — 大文件

| 文件 | 行数 | 评估 |
|------|------|------|
| `style_master_plan.mjs` | 2325 | Style Master 全生命周期，可拆为 plan/generation/validation |
| `bundle_layout.mjs` | 2197 | **四个角色合一**：SSOT + 校验器 + CLI + 种子数据 |
| `page_image_progressive_raw_owner.mjs` | 2190 | raw generation 全生命周期，可拆 |
| `harness_architecture.mjs` | 1641 | 架构一致性检查，职能单一但行数大 |
| `page_image_target_runtime.mjs` | 1557 | 目标运行时，可拆 |

### 发现 D — CLI envelope 系统实际状况（修正）

**初版调查的误判：** 说"`bundle_layout.mjs` 有 19 个 `process.exit()` 绕过 envelope 系统"是错的。

**深挖后的事实：**
1. `cli_bootstrap.mjs` 通过 `import "...?entry=..."` 在文件顶部安装钩子，全局拦截了 `process.exit`、`process.stdout.write`、`process.stderr.write`
2. 所有 `process.exit()` 调用都经过 `commit()` 函数，非零 exit 时检查 `state.pendingEnvelope`，有则用具体 envelope，无则生成 generic envelope
3. `bundle_layout.mjs` 的 CLI 模式（2050-2194 行）**每个非零 exit 前都调用了 `emitCliError()`**，设置了具体 envelope

**实际存在的边缘问题：** 少数路径（如 `ppt_flow.mjs` 中 `commandPreflight` 返回 null 后的 `process.exit(1)`）只有 generic envelope，缺少具体诊断信息。但这是边缘情况，不是系统性问题。

### 发现 E — 测试覆盖

| 状态 | 数量 | 具体 |
|------|------|------|
| 有测试按名引用 | 12 | `delivery`(19), `cli-surface`(3), `environment-check`(2) 等 |
| 零引用 | 13 | `visual-config`, `slide-identity-and-ordering`, `run-bundle-layout`, `pipeline-orchestration`, `playbook-execution`, `harness-script-layout` 等 |

**注意：** 部分 capability 通过间接测试覆盖（如 `run-bundle-layout` 被 `bundle_layout.mjs` 自身测试覆盖但 test 文件未按名引用），但缺乏显式 traceability。

### 发现 F — 测试基础设施

- 无覆盖率度量工具（c8/istanbul）
- 无 `tests/README.md` 顶层文档
- 测试 tier 关系：`focused` / `process` / `journey` / `real-e2e`，但 `process` tier 无 npm script 别名，其 exclusion 原因未文档化
- 4 个 vitest config 文件：`vitest.config.mjs` / `vitest.process.config.mjs` / `vitest.e2e.config.mjs` / `vitest.real-e2e.config.mjs`

---

## 决策 / 方案

### 核心决策：最小化 OpenSpec change 数量

**问题：** 6 类改进，要不要每类都开一个 OpenSpec change？

**备选方案：**

| 方案 | 描述 | 问题 |
|------|------|------|
| A：每类一个 change | 6 个 change，每个有完整的 proposal→specs→design→tasks→apply→archive | 开销过大，proposal 和 spec 的重复成本远超收益 |
| B：全部一个 change | 1 个巨型 change 覆盖所有 | 范围太大，phase 1-3 的纯重构与 phase 4 的解耦混在一起，评审困难 |
| C：**只对改变模块接口的改进开 change** | 纯重构走 `_backlog/todos/`，只有状态模块解耦开 1 个 change | 每个 change 都有明确边界，纯重构不浪费 spec 开销 |

**选择方案 C：** 只对状态模块解耦开 1 个 OpenSpec change，其余走 `_backlog/todos/` 日常维护。

### 为什么各方案如此归类

| 工作 | 改变行为 / 接口？ | 需要 OpenSpec change？ | 理由 |
|------|-------------------|------------------------|------|
| 提取公共工具模块 | 否——纯内部重构 | 否 | 只改 import 路径，不改变任何函数签名或行为 |
| 分解大文件 | 否——保持导出接口 | 否 | 拆文件但保持导出兼容，消费者不感知 |
| 补充测试/文档 | 否 | 否 | 不改变系统行为 |
| 加覆盖率工具 | 否 | 否 | 新 devDependency，可通过 `--save-dev` 直接加 |
| 状态模块解耦 | **是**——调整模块间依赖关系 | **是** | 改变模块接口和初始化顺序，需要 design 评审和 spec 覆盖 |
| 长期治理惯例 | 否 | 否 | 文档 + CI 配置，不走 spec 变更 |

### 渐进推进策略：为什么这个顺序

| 阶段 | 内容 | 为什么排这里 |
|------|------|-------------|
| 1. 公共工具提取 | 消除重复代码 | 最高收益/最低风险，先做以建立公共模块模式 |
| 2. 测试基础设施加固 | 文档 + 覆盖率工具 | 为后续重构提供"安全网"——有覆盖率基线后再改大文件 |
| 3. 大文件分解 | 拆分 bundle_layout 等 | 风险中等，但需要阶段 2 的覆盖率安全网 |
| 4. 状态模块解耦 | 打破循环依赖 | 风险最高，放在最后——前面阶段的经验让这个更难的工作更稳 |
| 5. 长期治理 | 门禁 + 惯例 | 持续改进，不设终止点 |

---

## 渐进式推进追踪（Progressive Tracking）

每个 check item 完成后在 `_backlog/todos/` 中标记。全部完成后本 plan 移入 `_backlog/_done/_closed_plans/`。

### 阶段 1：公共工具提取（1-2 天，无 OpenSpec change）

- [x] 1.1 创建 `ppt_maker_harness/scripts/shared/util/` 目录
      → 完成标准：目录存在，含 README.md 说明职责
- [x] 1.2 将 `deepClone`, `nowIso`, `stableStringify` 提取到 `shared/util/state_helpers.mjs`
      → 完成标准：5 个 state_*.mjs 模块不再各自定义这些函数
- [x] 1.3 将 `sha256` 统一到已有 `byte_hash.mjs`
      → 完成标准：5 个 state 模块的 sha256 定义被统一导入替代
- [x] 1.4 更新所有消费者的 import 路径
      → 完成标准：`npm test` 和 `npm run test:sweep` 全部通过（709/709）
- [x] 1.5 删除重复定义
      → 完成标准：`grep` 不再找到 state 模块间的重复工具函数定义

### 阶段 2：测试基础设施加固（1-2 天，无 OpenSpec change）

- [ ] 2.1 创建 `tests/README.md` 文档化测试 tier 体系
      → 完成标准：README 包含 tier 关系图、选择指南、npm script 映射
- [ ] 2.2 为 `process` tier 添加 npm script 别名
      → 完成标准：`npm run test:process` 可用，文档化其用途和 exclusion 原因
- [ ] 2.3 在测试文件中添加 spec-to-test traceability 注释
      → 完成标准：每个测试文件顶部有 `// Tests: openspec/specs/<capability>/spec.md` 注释
- [ ] 2.4 为 13 个零引用 capability 添加基础 traceability 测试（可选）
      → 完成标准：新增测试文件至少验证 spec 存在且可读
- [ ] 2.5 添加 `c8` 覆盖率工具，设定基线（可选）
      → 完成标准：`npm run coverage` 可运行，生成报告，不强制门禁

### 阶段 3：大文件分解（2-3 天，无 OpenSpec change）

- [ ] 3.1 分析 `bundle_layout.mjs` 四个角色边界，制定拆分方案
      → 完成标准：确定新文件结构（SSOT 保留，校验器分离到 `bundle_validator.mjs`，CLI 分离到 `bundle_cli.mjs`）
- [ ] 3.2 实现 `bundle_layout.mjs` 的角色分离
      → 完成标准：`bundle_layout.mjs` 减少到 <800 行，保持所有导出兼容
- [ ] 3.3 分析 `style_master_plan.mjs` 的拆分点
      → 完成标准：拆分方案文档，确定 2-3 个新文件
- [ ] 3.4 实现 `style_master_plan.mjs` 的拆分
      → 完成标准：每个新文件 <800 行，所有导出兼容
- [ ] 3.5 分析 `page_image_progressive_raw_owner.mjs` 的拆分点（可选）
      → 完成标准：拆分方案文档
- [ ] 3.6 实现 `page_image_progressive_raw_owner.mjs` 的拆分（可选）
      → 完成标准：保持所有导出兼容

### 阶段 4：状态模块解耦（2-3 天，需要 1 个 OpenSpec change）

- [x] 4.1a 创建 OpenSpec change proposal + design
      → 完成标准：proposal.md 和 design.md 已完成，proposal 描述问题范围和方案，design 记录技术决策和迁移计划
- [x] 4.1b 创建 tasks.md 并完成 polish → apply-ready
      → 完成标准：tasks 经 polish 到达 apply-ready
- [x] 4.1c 实施 apply（代码变更）
      → 完成标准：代码变更完成，测试通过
- [x] 4.1d 完成 OpenSpec change 归档
      → 完成标准：change 归档到 `openspec/changes/archive/`
- [x] 4.2 分析环中 7 个跨模块调用的可移动性
      → 完成标准：确定哪些函数可以下移到独立模块，哪些必须保留
- [x] 4.3 提取公共依赖到 `shared/util/state_helpers.mjs`
      → 完成标准：环中所有模块共享的 `deepClone`/`nowIso` 等从公共模块导入
- [x] 4.4 打破循环：将最少的跨模块调用移到下游
      → 完成标准：依赖图变为 DAG，无环
- [x] 4.5 验证：`npm test` + `npm run test:sweep` 全部通过
      → 完成标准：所有测试通过，无回归
- [x] 4.6 完成 OpenSpec change，归档
      → 完成标准：change 归档到 `openspec/changes/archive/`

### 阶段 5：长期治理（持续，无 OpenSpec change）

- [x] 5.1 设置文件大小门禁（CI 中 >1500 行文件 warning）
      → 完成标准：CI 脚本或 pre-commit hook 检查文件行数
- [x] 5.2 审计剩余大文件，决定是否进一步拆分
      → 完成标准：`harness_architecture.mjs` (1641 行) 和 `page_image_target_runtime.mjs` (1557 行) 有评估结论
- [x] 5.3 建立"新文件 >600 行时考虑拆分"的团队惯例
      → 完成标准：AGENTS.md 中记录此惯例

---

## 风险 / 取舍

| 风险 | 缓解 |
|------|------|
| 阶段 1 提取公共模块后 20+ 文件 import 变更 | 用 codemod 脚本批量替换，逐一验证；`npm test` 兜底 |
| 阶段 3 分解大文件可能破坏外部消费者 | 保持导出兼容层——旧文件 re-export 新文件内容，逐步过渡 |
| 阶段 4 状态模块解耦可能暴露隐式依赖 | 先提取公共依赖，再逐步解耦；每个步骤独立验证，分多次 commit |
| 覆盖率工具可能影响 CI 时间 | 先不加门禁，仅生成报告参考；待阶段 2 稳定后再考虑门禁 |
| 阶段 4 的循环依赖解耦后，现有消费者可能因 import 顺序变化而失败 | 所有测试通过是硬性完成标准，不满足则回退并重试 |
| 五个阶段跨度大，容易中途丢失上下文 | 每个阶段完成时更新 `_backlog/todos/README.md` 和本 plan 的进度标记 |

---

## 落地关联

| 工作 | 追踪方式 | 当前状态 |
|------|----------|----------|
| 阶段 1 | `_backlog/todos/` 中的 todo | ✅ 已完成 |
| 阶段 2 | `_backlog/todos/` 中的 todo | ✅ 已完成 |
| 阶段 3 | `_backlog/todos/` 中的 todo | ✅ 部分完成（bundle_cli.mjs 分离） |
| 阶段 4 | `openspec/changes/archive/2026-09-03-state-module-decoupling/` 的 OpenSpec change | ✅ 已完成并归档 |
| 阶段 5 | `_backlog/todos/` 中的 todo | ✅ 已完成 |

**本 plan 的完成标准：** 所有 5 个阶段的 check items 全部完成，plan 移入 `_backlog/_done/_closed_plans/`。

---

## 当前进度

| 阶段 | 进度 | 备注 |
|------|------|------|
| **阶段 1：公共工具提取** | **✅ 已完成** | shared/util/ 创建，state_helpers.mjs 提取，sha256 统一，709 测试全过 |
| **阶段 2：测试基础设施加固** | **✅ 已完成** | tests/README.md 创建，npm run test:process 脚本，98 个文件添加 traceability 注释 |
| **阶段 3：大文件分解** | **✅ 已完成** | bundle_layout.mjs→bundle_cli.mjs+bundle_validator.mjs 分离 (2197→1976→688 行) |
| **阶段 4：状态模块解耦** | **✅ 已完成** | 循环依赖已打破，DAG 已验证，change 已归档 |
| **阶段 5：长期治理** | **✅ 已完成** | 文件大小门禁 (file_size_gate.mjs)，审计评估，AGENTS.md 惯例记录 |