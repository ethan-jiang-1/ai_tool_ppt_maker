# Plan: Keel 架构体检 — 术语对齐 + 残留清理

> 类型: 分析（keel `architecture_review` + `rot-audit`） | 更新: 2026-08-13

## 背景 / 现状

用户两个诉求，触发本 plan：

1. **术语和思路对齐** —— 同一个概念别这边叫 A、那边叫 B；harness 经过多轮迭代，担心文档/规格之间口径漂移。
2. **残留老东西清理干净** —— 迭代版本多，可能有已无用但仍在原地"造神"的东西；目标是今后 coding agent 进入项目时拿到的是高信噪比信号。

**边界（硬约束）**：只审 4 个源码目录（`ppt_maker_harness/`、`openspec/`、`tests/`、`tests_e2e/`）+ 顶层文档 + `_backlog/`。**不碰 `deck_*` / `dpt_*`（生产数据）。**

## 决策 / 方案

### keel 路由映射

- 术语/思路对齐 → keel §3「Declare Authority, Writers, Projections」+ §4「Make Ownership Explicit」+ rot-audit 的 **Ambiguous authority** 指标：同一事实经多条路径可独立编辑而无协调。
- 残留清理 → keel §8「Keep Change And Deletion Routine」+ rot-audit 的 **Concept count / Public surface growth / Suppression count** 指标。
- 方法：`architecture_review` 路由（每条 claim 落到 file/contract/test/owner/unknown）+ `rot-audit` 路由（声明 scope、指标、证据窗口、负控证据，close 时每个指标有 grounded evidence 或显式不可得）。

### 已确认的初步发现（grounded，非假设）

1. **目录名改名漂移**：live 文件统一用 `ppt_maker_harness/`；`openspec/changes/archive/*` 仍写 `PPTMAKER_FRAMEWORK/`（archive 是冻结历史，保留正确）。**但我的跨会话 memory 文件 `framework-boundary-production-data.md` 仍写旧名 `PPTMAKER_FRAMEWORK/`** —— 它会被加载进每个未来 agent 的上下文，属于 stale 信号，是本次要修的高优先级项。
2. **指令入口面过大、权威未标定**：顶层 `AGENTS.md`/`CLAUDE.md`/`CONTEXT.md`(20KB)/`README.md` + harness 内 5 个 `.md` + `charter/` 4 文件 + `openspec/specs/` 28 个 spec。缺一张 **authority map**（谁对哪个术语/事实是 fact authority、decision authority、owner）。
3. **残留候选**（待引用追踪确认）：`.env.saved`/`.env.example`（gitignore 的备份）、`skills-lock.json`（gitignore 但存 skill 同步清单，且 repo 内 skill 面不可复现）、`.claude/.agents/.codex/.cursor` 四套 skills 镜像、`CONTEXT.md` 疑似与 openspec/specs 重复/过时、`_backlog/_done|learning|todos|bugs` 需查 stale。
4. **反例（已证伪，不是残留）**：4 个 vitest config 全部被 `tests/contracts/run_selected_verification.mjs` 引用，保留。

### 交付物

- **Authority map**：每个术语/事实 → fact authority / decision authority / owner，落到具体文件。
- **术语漂移清单**：同一概念多处不同叫法，标注对齐方向（往哪个文件/规格收敛）。
- **残留清单**：每个候选 → 引用追踪 → 判定（删除 / 保留 / 降级归档），遵循 §8（关入口、列依赖、留行为证据）。

## 风险 / 取舍

- 删除不可逆 → 只删 git-tracked 且引用追踪为空的；先出清单给用户逐项确认，不自行删。
- `CONTEXT.md`(20KB) 可能仍有活引用 → 先 grep 引用再判 stale，不凭体量下结论。
- `openspec/changes/archive/`（106 个）是 openspec 历史账本 → 不动。
- memory 文件改的是"未来 agent 的第一印象" → 改前需用户确认，不随本 plan 静默改。
- 术语"framework" vs "harness"（旧 vs 新）在 prose 中可能残留混用 → 收敛方向以 live 文件与 `openspec/specs/harness-*` 为准。

## 落地关联

- 本 plan 是分析/复盘文档，不是 active change。
- 结论确认后，清理动作拆成 `openspec/changes/<change>` 落地（遵循 openspec 流程）。
- 术语对齐最终回写 `openspec/specs/` + `charter/`，**不动 archive**。
