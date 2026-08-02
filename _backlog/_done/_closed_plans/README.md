# Closed Plans Index — 已完成 plan 归档

> 最后更新: 2026-08-02 | `_backlog/_done/_closed_plans/` — 已完成 plan 的归档目录。
> 接收来自 [`../../plans/`](../../plans/) 的 plan。`_` 前缀 = coding agent 默认忽略。
>
> **plan 完成后文件名不变，位置即状态。** 移入时分配 `CLS-NNN` 序号（Closed），按完成时间递增。

## 接收一个完成的 plan

plan 完成后从 `_backlog/plans/` 通过 `git mv` 移入本目录：
1. 在本文件表格加一行（CLS-NNN + 日期 + 文件名 + 简述），编号 = 当前最大 + 1
2. 更新最后的 "Next available plan ID" 行
3. 更新 `../../plans/README.md`（移除该 plan 的行）
4. 更新 `../README.md`（计数 +1）

---

## 已完成列表

| ID | Date | File | Summary |
|----|------|------|---------|
| [CLS-001](agent-interaction-protocol.md) | 2026-07-11 | `agent-interaction-protocol.md` | 交互节律协议；由 Change 1 吸收（§11 + show） |
| [CLS-002](style-iterate-and-quick-preview.md) | 2026-07-11 | `style-iterate-and-quick-preview.md` | 探索 playbook 实例；并入 Change 1 |
| [CLS-003](improve-visual-iteration-env.md) | 2026-07-11 | `improve-visual-iteration-env.md` | 视觉迭代环境；由 `improve-visual-iteration-env` change 吸收 |
| [CLS-004](openspec-config-agentic-control-plane.md) | 2026-07-14 | `openspec-config-agentic-control-plane.md` | 重整 `openspec/config.yaml` 为项目级 Agentic 开发控制面 |
| [CLS-005](slide-identity-and-sequence-editing.md) | 2026-07-17 | `slide-identity-and-sequence-editing.md` | 稳定 5–6 字母双语义 mnemonic slide ID + derived position + 事务化增删重排 + ID-keyed artifact resolution；由 `add-stable-slide-identity-and-order-editing` change 吸收 |
| [CLS-006](visual-asset-system.md) | 2026-07-14 | `visual-asset-system.md` | 视觉管线 Asset 概念：SVG/位图/图标按约定目录存放，manifest 注册，`**VISUAL ASSETS**` 绑定 |
| [CLS-007](image2-multi-vendor-architecture.md) | 2026-07-16 | `image2-multi-vendor-architecture.md` | Image2 多 vendor = 多组 (base_url,key) 顺序试 + failover；同步/异步一个薄分支 |
| [CLS-008](html-first-progressive-rendering.md) | 2026-07-20 | `html-first-progressive-rendering.md` | HTML-first 渐进式渲染总控设计；5 个 Change（1-4 已归档，5 已提案），架构锁定决策全部落地 |
| [CLS-009](html-first-recovery-change-plan.md) | 2026-07-21 | `html-first-recovery-change-plan.md` | 完成 guided/recoverable lifecycle 与 markerless migration；未实施的 HTML 视觉质量范围释放给未来重新规划 |
| [CLS-010](production-mode-system.md) | 2026-07-22 | `production-mode-system.md` | 三模式 version-scoped production mode、Image2-primary 发行与跨 pipeline clean-vNext transition；由两个严格串行 OpenSpec change 吸收 |
| [CLS-011](agent-workflow-simplification.md) | 2026-07-23 | `agent-workflow-simplification.md` | 三项串行 change 已完成：统一 workflow inspection、收敛 workflow control/interface、重整 Image Production 与框架治理；BUG-033 的复现分类保留为活跃 follow-up |
| [CLS-012](legacy-whole-page-image2-contract-hardening.md) | 2026-07-26 | `legacy-whole-page-image2-contract-hardening.md` | Superseded whole-page Image2 investigation preserved as historical input; its unimplemented contract is not an active delivery plan. |
| [CLS-013](unify-image2-page-authority.md) | 2026-07-28 | `unify-image2-page-authority.md` | Three serial OpenSpec changes completed: Page Authority protocol, provider-free legacy adoption, and retirement of the historical production surface. |
| [CLS-014](framed-image-directory-ssot.md) | 2026-07-29 | `framed-image-directory-ssot.md` | Framed/Pure sibling-workflow directory and delivery SSOT; absorbed by the archived Page Authority changes. |
| [CLS-015](page-authority-workflow-baseline-target-gap.md) | 2026-07-29 | `page-authority-workflow-baseline-target-gap.md` | CURRENT baseline, TARGET dual-workflow model, and implementation gap; absorbed by the archived Page Authority changes. |
| [CLS-016](page-authority-workflow-openspec-progressive-plan.md) | 2026-07-29 | `page-authority-workflow-openspec-progressive-plan.md` | Progressive delivery, compatibility hygiene, retirement, archive, and `v0.23.0` closeout complete. |
| [CLS-017](progressive-plan.md) | 2026-08-02 | `progressive-plan.md` | Page Authority 第一阶段三个串行 OpenSpec change 已完成并归档；同级保留其设计输入。 |
| [CLS-018](command-surface-and-entry-seam-reconciliation.md) | 2026-08-02 | `command-surface-and-entry-seam-reconciliation.md` | 命令发现面、精确 run 定位、诊断四段翻译与恢复优先级已由三个 OpenSpec change 落地并验证。 |

**Next available plan ID: CLS-019**

> 已完成计划保留历史决策；当前工作只从 `_backlog/plans/` 重新进入。
