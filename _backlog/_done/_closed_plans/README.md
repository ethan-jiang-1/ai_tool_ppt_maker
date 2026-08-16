# Closed Plans Index — 已完成 plan 归档

> 最后更新: 2026-08-16 | `_backlog/_done/_closed_plans/` — 已完成 plan 的归档目录。
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
| [CLS-019](page-authority-production-repair.md) | 2026-08-04 | `page-authority-production-repair.md` | BUG-036/037/040/041/042/043/044/045 的七条 Change 收敛、真实 v7 25 页 recovery/delivery、bug 卡与版本 `0.24.0` 收尾完成。 |
| [CLS-020](page-production-short-references.md) | 2026-08-06 | `page-production-short-references.md` | 渐进式页面生产协作卡的 typed 短引用、完整 digest 脱敏与非 authority 边界；由 `short-page-production-references` change 吸收并归档。 |
| [CLS-021](framed-hybrid-image2-composition.md) | 2026-08-08 | `framed-hybrid-image2-composition.md` | Pure/Framed 共享完整页面生成核心、Framed 仅保留透明确定性 header overlay；由 `correct-framed-page-image-model` change 吸收并归档。 |
| [CLS-022](page-image-workflow-master-plan.md) | 2026-08-08 | `page-image-workflow-master-plan.md` | Page Image Workflow 转换总路线图；两个里程碑完成，后续仅保留为独立提案候选。 |
| [CLS-023](progressive-page-image-integrity-and-usability.md) | 2026-08-09 | `progressive-page-image-integrity-and-usability.md` | BUG-055/056/057/059/060/062/063 的渐进式 Page Image 完整性与可用性修复；Changes 0–12、successor Pilot、三页交付与最终复核均完成。 |
| [CLS-024](2026-08-06-page-production-short-references-research.md) | 2026-08-09 | `2026-08-06-page-production-short-references-research.md` | 短 Page Image 物理导航研究复核：`nav/art/` 的八位 digest 前缀实体文件已满足人类使用；immutable SHA storage 保持内部边界。 |
| [CLS-025](page-image-progressive-plan.md) | 2026-08-11 | `page-image-progressive-plan.md` | Phase 0/0.5/Track A/Track P 已落地并被 `schema-first-page-image-recovery.md` 吸收；Phase 1–6 的路线因 schema-first 决策作废。 |
| [CLS-026](page-image-presentation-schema.md) | 2026-08-11 | `page-image-presentation-schema.md` | Q2–Q13 决策与四文档配置包结构已吸收进 C4/C5；`-v1` 标识符与 `Header Profile Set` 等术语作废。 |
| [CLS-027](page-image-progressive-plan-feasibility-research.md) | 2026-08-11 | `page-image-progressive-plan-feasibility-research.md` | 基线、缺陷定位、工作量与回归影响面分析已吸收进 C1–C7；结尾的执行顺序建议作废。 |
| [CLS-028](framed-provider-protected-composition.md) | 2026-08-13 | `framed-provider-protected-composition.md` | C6 Framed 保护区诊断、设计与风险边界；实现、两页 disposable probe 与 C7 delivery 已完成，保留为历史证据。 |
| [CLS-029](framed-provider-capability-discovery-research.md) | 2026-08-13 | `framed-provider-capability-discovery-research.md` | C6 provider transport 面与 synthetic probe 准备；其有界结论已由归档 change 的 evidence 取代。 |
| [CLS-030](schema-first-active-contract-convergence-research.md) | 2026-08-13 | `schema-first-active-contract-convergence-research.md` | Pre-C7 收敛审计；三项 cleanup 已由 `converge-active-schema-authority` 完成并归档。 |
| [CLS-031](schema-first-clean-cutover-decisions.md) | 2026-08-13 | `schema-first-clean-cutover-decisions.md` | schema-first clean-cutover 决策规则；C2 与 Pre-C7 完成后随总路线关闭，保留为历史决策。 |
| [CLS-032](schema-first-page-image-recovery.md) | 2026-08-13 | `schema-first-page-image-recovery.md` | 总控路线：C1-C6、Pre-C7 收敛及 C7 reconstruction 均完成。C7 的初始 delivery 因 `DarkGo` header-reservation 视觉问题被保留为非交付 evidence；source epoch 3 修复后通过新的三页 review 与 delivery review。 |
| [CLS-033](keel-harness-term-alignment-and-residue-audit/) | 2026-08-13 | `keel-harness-term-alignment-and-residue-audit/` | Keel 架构体检：C1 生命周期编号退休、C2 术语与权威对齐、H 残留清理均完成；审计记录保留为历史证据。 |
| [CLS-034](harness-signal-cleanup/) | 2026-08-14 | `harness-signal-cleanup/` | 三项 Harness signal cleanup change 已完成、归档、推送并核对；独立 real-provider E2E acceptance 以 owner waiver 归档，不宣称 live acceptance 通过。 |
| [CLS-035](deck-configurable-design-system-provider-prompt.md) | 2026-08-15 | `deck-configurable-design-system-provider-prompt.md` | Deck-owned Page Design System source 已接入 Pure/Framed provider input；实现、回归、main-spec 同步与 OpenSpec 归档完成。 |
| [CLS-036](provider-prompt-limit-investigation.md) | 2026-08-16 | `provider-prompt-limit-investigation.md` | Image API 4K/16K prompt 限制调查；结论：micuapi 是聚合网关、`gpt-image-2` 别名可动态重定向，不能硬编码单一上限，须建模为 capability profile；设计输入已被 `bind-capability-aware-image2-provider-input` change 吸收。 |
| [CLS-037](provider-prompt-length-budget.md) | 2026-08-16 | `provider-prompt-length-budget.md` | provider prompt 超长根因与 compact prompt 方案；内部元数据混入 provider bytes 撑爆预算；由 `bind-capability-aware-image2-provider-input` change 落地并归档。 |
| [CLS-038](cli-diagnostic-faithful-passthrough.md) | 2026-08-16 | `cli-diagnostic-faithful-passthrough.md`（+ 同名研究子目录） | CLI 诊断事实/恢复权威路线图：3 个串行 OpenSpec change 全部实现并 archive（owner-issued diagnostics、doctor readiness 对齐、validate source/state 投影）；BUG-067/068/069/070 关闭证据见对应 `_fixed_bugs/` 条目。 |

| [CLS-039](current-layer-legacy-trace-audit.md) | 2026-08-16 | `current-layer-legacy-trace-audit.md` | 当前层旧痕迹深度审计：45 条 finding；3 个串行 OpenSpec change 全部实现并 archive（align-current-layer-terminology 术语对齐 / remove-retired-plumbing-and-harden-detectors 死代码+探测器扩面 / align-serialization-schema-mirror schema 对齐）；残留仅 deck Wave 5（生产数据，需 deck owner 决策）。 |
| [CLS-040](version-local-polish-directory.md) | 2026-08-16 | `version-local-polish-directory.md` | version root 白名单新增版本级人读「打磨轨迹」目录 `_polish/`；由 `add-version-local-polish-directory` change 实现、全量回归通过并归档。 |
| [CLS-041](fold-style-master-cost-into-task-mandate/) | 2026-08-16 | `fold-style-master-cost-into-task-mandate/` | 消除「问预算」打断：Style Master 候选授权 + intake 成本边界折进 Task Mandate（照搬 Page Image 模板），`prompt_budget` 定出 scope；由同名 OpenSpec change 实现并归档（commit `5571002`）。 |
| [CLS-042](cli-command-surface-reduction/README.md) | 2026-08-17 | `cli-command-surface-reduction/` | CLI 命令面平衡瘦身：4 个 OpenSpec change（C0 纯拆分 / C1 机器契约 / C2 导航分页 / C4 doctor 拆分）全部实现并归档；原 C3（state/投影重建）延后 α，设计预案保留在 `03`；commit `0c498fb`/`e14304e`/`78fb282`/`be26a6d`。 |

**Next available plan ID: CLS-043**

> 已完成计划保留历史决策；当前工作只从 `_backlog/plans/` 重新进入。
