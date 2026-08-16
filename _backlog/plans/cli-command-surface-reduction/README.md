# Plan: CLI 命令面平衡瘦身（4-change,无兼容包袱）

> 类型: 设计 | 更新: 2026-08-16 | 状态: 已按外部评审修订,仍不开工,待人类复核
> 一句话: 用 4 个有界 OpenSpec change,把 CLI 命令面从「职责混装 + 控制路径内藏」改成
> 「一个命令一个业务、机器契约可审计、写动作可见」;不做 alias、不做大重构、不删结构回放能力。
> 进度真相在 [`progress.md`](progress.md),本文件只是索引与总纲。

## 这是什么

四份 findings（`_backlog/_findings/`）诊断出 CLI 面的病: `doctor`/`image2`/`slides`/`state`
职责混装、flags 挂在父命令上、机器输出不一致、`state` 观察命令带写。本计划把修复拆成 4 个
change,每个都满足: 影响面可控（≤ ~30 文件）、可独立验证、可独立回滚。

## 决策约束（人类给定,2026-08-16）

1. **风险/影响面可控优先** — 不做单 change >50 文件的变更;不触碰 40 个 Controller 步骤的操作面。
2. **走 OpenSpec** — proposal → specs → design → tasks → apply → validate → archive。
3. **change 尽量少** — 有固定成本,能合并就合并;但合并上限由**控制风险面**决定,不只看文件数。
4. **无兼容包袱** — 未发行、滚动开发。旧形态直接删除 + tombstone 硬拒绝,不做 alias/过渡期。

## 方案总图

```
C1  align-cli-machine-contract          (findings G/H/D 的修正版)
    结构化结果模型 + help/exit/JSON 单一声明源 + variable closed inventory 治理
C2  split-navigation-and-pagination-commands
    S1: image2 artifact-view → artifacts
    S2(修正): 只迁叙事分页 slides narrative-plan → paginate plan/apply
              **保留 structural slides apply-plan 回放**
C3  separate-state-task-projection-rebuild
    state 子命令化 + 投影重建触发重设计(评审 6 问闭合后才开工)
C4  split-doctor-readiness-probe
    doctor 纯离线体检 / preflight 绑 exact run / probe connectivity-only
```

**依赖**: C2/C3/C4 都依赖 C1 的 inventory 治理（`harness_coherence.mjs:444`、
`test_process_docs_consistency.mjs:194` 都断言 "fixed 12-command"）。
**顺序**: 1→2→3→4,一次只开一个 active change。

## 为什么从 3-change 改成 4-change

外部评审（`07`）抓到三处事实错误,经逐条代码复核属实:

1. S2 会删掉 structural `slides apply-plan` 回放能力（`ppt_flow.mjs:1392/:1423` 双 schema 分流）;
2. S4 不是「隐藏写」,而是 spec 有意设计的收敛触发器（`cli-surface:498`、`create-deck.md:92`）;
3. exit 2 属于普通 `state` 的 replacement/current-repair hard-stop（`:3861`）,不是
   `state --validate-state`（其 invalid 是 exit 1,`:3824`）——findings-I 此处也有事实错误。

合并依据因此从「文件数」改为「控制风险面」: S4 是控制路径重设计,独立成 C3。

## 目录索引

| 文件 | 职责 |
| --- | --- |
| `progress.md` | **进度跟踪**: 每 change 状态、依赖、开工门槛、下一步、窄决策待办 |
| `01-align-cli-machine-contract.md` | C1 范围 / 同步面 / 完成判据 |
| `02-split-navigation-and-pagination-commands.md` | C2 范围 / 同步面 / 完成判据 |
| `03-separate-state-task-projection-rebuild.md` | C3 范围 + 评审 6 问 + 候选设计 |
| `04-split-doctor-readiness-probe.md` | C4 范围 / 同步面 / 完成判据 |
| `05-sync-surface-master-checklist.md` | 改命令必须同步的全部位置（五层清单 + clean-break 边界） |
| `06-deferred-and-no-go.md` | 明确不做/延后的（防止丢失） |
| `07-external-design-review.md` | 外部评审原文（2026-08-16） |

**编号映射**: 评审原文中的 04/05 = 本目录修订后的 05/06;原文 01–03 对应修订后 01/02/04
（S2 修正、S4 单列）。文件已重命名,评审的基线 hash 因修订必然过期——其结论已吸收进本修订。

## 修订记录（2026-08-16,吸收 07 评审）

| 修订 | 内容 |
| --- | --- |
| 拓扑 3→4 | S4 独立为 C3;change 名与文件名同步重排 |
| S2 边界 | 只迁 narrative;structural `slides apply-plan` 保留;`apply-plan` token 不 tombstone |
| exit code 事实 | 0/1/2/130/143 真值表进 `01`(2 属于普通 state hard-stop) |
| C1 定性 | 从「补 --json flag」改为「结果模型 + 单一声明源 + inventory 治理」 |
| 05 清单 | 补 harness_coherence / docs-consistency 等 10 处遗漏;修 overclaim;加 clean-break 边界 |
| 进度跟踪 | 拆分出 `progress.md`,README 只留索引与总纲 |
