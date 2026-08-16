# Plan: CLI 命令面平衡瘦身（3-change 计划,无兼容包袱）

> 类型: 设计 | 更新: 2026-08-16 | 状态: 活跃 — 待开工
> 依据: `_backlog/_findings/` 四份 findings（写于 HEAD `d2df02b`;已复核: 此后 2 个 commit 未触 CLI 面,
> `cli-surface/spec.md:5` 的 "fixed 12-command" 与 12-name inventory 硬断言均在位）
> 目录: `01/02/03` = 三个 OpenSpec change 的落地说明;`04` = 同步面总清单;`05` = 明确不做/延后清单

---

## 背景 / 现状

四份 findings 的结论（细节在原文件,此处只留决策所需的压缩版）:

| Findings | 一句话结论 |
| --- | --- |
| I 依赖与设计审计 | 依赖 CLI 是架构必然（LLM 无法 import Node）;病在接口堆积（12 命令/26 子操作/~35 flags/4 种 hash/每调用重校验）与 owner 逻辑渗漏进 4000 行入口;真深度只有 `cli_error.mjs`/`cli_bootstrap.mjs` 的 envelope/脱敏/边界纪律 |
| II Agent 使用体验 | 摩擦真实但不致命: `doctor`/`image2`/`slides`/`state` 职责混装、flags 挂在父命令上、hash 三种写法、`state` 观察命令带隐藏写;给出 G/H/D/C/F/E/A/B 优化清单 |
| III 影响面测算 | 影响面分档: 零档 G/H ≈ 3 文件、一档 D ≈ 10–15、三档拆分 S1–S4 每刀 15–40;**非生命周期拆分的 playbook 敏感度 ≈ 0**;唯一制度阻碍是 "fixed 12-command" 一句话 |
| IV 拆分设计 | 目标树 12→17: S1 `artifacts`、S2 `paginate`、S3 `preflight`+`probe`、S4 state 子命令化 + `task-projection`;原方案每刀带 alias+retire_by |

## 决策约束（人类给定,2026-08-16）

1. **风险/影响面可控优先** — 不做单 change >50 文件的巨型变更;不做触碰 40 个 Controller 步骤的操作。
2. **走 OpenSpec** — proposal → specs → design → tasks → apply → validate → archive。
3. **change 尽量少** — change 有固定成本（全套 artifact + 验证 + 归档）,能合并就合并。
4. **无兼容包袱** — 未发行、滚动开发。**不做 alias、不做过渡期、旧形态直接删除换新。**
   影响: 每个拆分不再维护双表面;风险从"共存窗口漂移"变成"切得干不干净",
   由仓库自带审计（04 清单）兜底。findings 原方案里的 alias/retire_by 机制整体退场,
   换成 **tombstone 硬拒绝**（旧词注册进 architecture guard,复现即失败）。

## 权衡框架

两个轴: **change 数量（成本）** × **单 change 影响面（风险）**。找平衡点:

```
 change 数量
   ▲
 2 │  ✗ 全合并: 单 change 70–90 文件,超出 repo 历史惯例(~30),违反约束 1
 3 │  ● 平衡点(本计划): 每 change 12–40 文件,C2 略高于惯例但主题单一
 4 │  ○ 更稳: 把 S4 从 C2 拆出;+1 change 成本(保留为旋钮)
 8 │  ✗ findings 原方案: 每刀一个 change + framing,成本 ×3,收益不增
   └──────────────────────────────────────────▶ 风险轴(单 change 影响面)
```

| 方案 | change 数 | 最大单 change 影响面 | 评价 |
| --- | --- | --- | --- |
| 全合并 | 2 | ~70–90 文件 | 拒绝: 超出历史惯例,违反约束 1 |
| **平衡（本计划）** | **3** | **~35–40 文件（C2）** | 采纳: 主题单一、机械编辑为主、审计兜底 |
| 稳健 | 4 | ~25 文件 | 备选: S4 独立成 change;C2 提案评审时可切换 |

## 决策 / 方案（总图）

```
Change 1  align-cli-machine-contract            （findings II 的 G + H + D）
          帮助机器契约块 / 动词撞名决策表 / --json 一致性
          ~12–15 文件,纯增量,零破坏 ─────────────────────── 先做,当天级收益

Change 2  split-non-lifecycle-commands         （framing + S1 + S2 + S4）
          任务 0: "fixed 12-command" → "closed, audited command inventory"（拆分制度前置）
          S1: image2 artifact-view            →  artifacts
          S2: slides narrative-plan/apply-plan →  paginate / paginate apply
          S4: state 互斥 flag 拼图             →  state / state validate / state repair-known-execution-mismatch
               + 隐藏写                        →  task-projection
          ~35–40 文件;全部非生命周期业务,playbook 触点 ≤ 3;旧形态 = tombstone 硬拒绝

Change 3  split-doctor-readiness-probe         （S3）
          doctor 收缩为纯离线体检;
          --run-dir/--operation → preflight;--smoke/--probe-vendors → probe
          ~25–30 文件;environment-check spec 31 处为最大单点
```

执行顺序: **1 → 2 → 3**,一次只开一个 active change（repo 惯例）。C2 与 C3 互不依赖,
按影响面从小到大排。每 change 的同步面、任务骨架、完成判据见 `01/02/03`。

## 风险 / 取舍

- [C2 ~35–40 文件 > 历史惯例 ~30] → 主题单一（全部是非生命周期命令搬移）、编辑以机械性
  spec/测试/文档改写为主;每刀独立契约测试;tombstone + 计数归零判据 + 文档命令审计强制同步完整;
  若评审仍嫌大,把 S4 拆为第 4 个 change（显式保留的旋钮）。
- [改命令后同步不完整 → 半迁移态] → 无兼容模式下完成判据 = live 域旧形态计数 → 0 + tombstone
  注册 + 全部审计绿;完整清单见 `04-sync-surface-master-checklist.md`。
- [state 零写化是行为变化（S4）] → 与 spec 既有 zero-write 观察精神一致;playbook 0 处;
  独立契约测试证明 `state` 零写、投影重建只在 `task-projection` 发生。
- [命名分歧] → 候选名取自 CONTEXT.md canonical 术语（Pagination/Human Navigation Path/
  Collaboration Projection）;最终名在 proposal 由人类定,不是架构决策。
- [收益未覆盖全部摩擦] → C（命名统一）、F（run_dir 统一）、B（operation 子命令化）与
  findings-I 的大重构（库 seam/会话上下文）显式延后,记录在 `05`,不假装解决。

## 落地关联

- 每个 change: `openspec new change <name>` → proposal/specs/design/tasks → apply →
  `openspec validate <name> --strict` → archive。artifact 规则照 `openspec/config.yaml` rules。
- 建议 change 名（可调）: `align-cli-machine-contract` / `split-non-lifecycle-commands` /
  `split-doctor-readiness-probe`。
- 关闭条件: 三个 change 全部归档,`npm test` 与全部审计绿,`05` 延后项已在 backlog 有记录。
- 本 plan 完成后按 `_backlog/plans/README.md` 流程移入 `_done/_closed_plans/`。
