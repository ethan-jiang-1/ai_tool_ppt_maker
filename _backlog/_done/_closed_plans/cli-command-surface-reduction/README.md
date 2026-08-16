# Plan: CLI 命令面平衡瘦身（4-change,无兼容包袱;原 C3 延后）

> 类型: 设计 | 更新: 2026-08-16 | 状态: 已吸收两轮外部评审 + 三轮人类决定 + 一轮独立评审
> + v5 人类决定（α: C3 延后）,**仍不开工,待人类复核**
> 一句话: 先用 1 个零行为变化的纯拆分 change 把 4035 行的 `ppt_flow.mjs` 变成入口 + 12 个命令模块,
> 再用 3 个有界 OpenSpec change 把 CLI 命令面从「职责混装 + 控制路径内藏」改成
> 「一个命令一个业务、机器契约可审计」;不做 alias、不做大重构、不删结构回放能力。
> **C3（state/投影重建触发重设计）按 v5 人类决定延后**——价值小、风险大,设计预案保留在 `03`,
> 摩擦由 C1 的 help 契约块兜底。
> 进度真相在 [`progress.md`](progress.md),本文件只是索引与总纲。

## 这是什么

四份 findings（`_backlog/_findings/`）诊断出 CLI 面的病: `doctor`/`image2`/`slides`/`state`
职责混装、flags 挂在父命令上、机器输出不一致、`state` 观察命令带写。本计划把修复拆成 **4 个
change**（C3 按 v5 人类决定延后,理由见下）,每个都满足: 影响面可控（≤ ~30 文件,纯拆分 C0 除外）、
可独立验证、可独立回滚。

## 决策约束（人类给定,2026-08-16）

1. **风险/影响面可控优先** — 不做单 change >50 文件的变更;不触碰 40 个 Controller 步骤的操作面。
2. **走 OpenSpec** — proposal → specs → design → tasks → **polish（`/polish-openspec-change`
   磨到 apply ready）** → apply → validate → archive。
3. **change 尽量少** — 有固定成本,能合并就合并;但合并上限由**控制风险面**决定,不只看文件数。
4. **无兼容包袱** — 未发行、滚动开发。旧形态直接删除 + tombstone 硬拒绝,不做 alias/过渡期。

## 方案总图

```
C0  split-ppt-flow-command-modules      (人类决定: 拆一定要拆,用最安全的纯拆分)
    4035 行入口 → 入口 + shared/cli/commands/ 12 命令模块 + command_support;
    零行为变化、动态 import 保留冷启动、只搬不改;descriptor 是 C1 的载体
C1  align-cli-machine-contract          (findings G/H/D 的修正版)
    结构化结果模型 + help/exit/JSON 单一声明源 + variable closed inventory 治理
C2  split-navigation-and-pagination-commands
    S1: image2 artifact-view → artifacts
    S2(修正): 只迁叙事分页 slides narrative-plan → paginate plan/apply
              **保留 structural slides apply-plan 回放**
C3  separate-state-task-projection-rebuild    （**延后 α** — 见 `06` 与 `03` 设计预案）
    state 子命令化 + 投影重建触发重设计: 为一张「非权威协作卡」动 ~15–20 个 Controller 节点,
    价值小风险大;摩擦由 C1 help 契约块兜底（`state` 帮助写明投影重建行为）
C4  split-doctor-readiness-probe
    doctor 纯离线体检 / preflight 绑 exact run /
    probe 绑 exact run（保留 pre-POST profile fence）,成功仅 connectivity
```

## 依赖与顺序

- **C0 先行**（纯拆分,零行为变化——C1 的 declaration authority 需要它做 descriptor 载体）;
- C2/C4 都依赖 C1 的 inventory 治理（`harness_coherence.mjs:444`、
  `test_process_docs_consistency.mjs:194` 都断言 "fixed 12-command"）;
- **跨 change 冻结决定**: C1 开工前冻结 projection effect 边界（二次评审 #2 + 独立评审 B1）——
  C1 的 `build`/`image2` owner result 保留 delivery + projection **两个分列 effect**（现状一致）,
  projection 为独立可版本化字段,C1 不改退出路径。此契约**不依赖 C3 落地**;若将来重启 C3
  （`03` 预案）,候选 A 按已记录方向把 projection 版本化删除（见 `01` §1.5、`progress.md` 门槛 3）;
- **顺序**: 0→1→2→4,一次只开一个 active change;C3 延后（α）。

## 拓扑演变（为什么是现在这个形状）

**3→4（第一轮评审,`07` §一–九）**: 评审抓到三处事实错误,经逐条代码复核属实:

1. S2 会删掉 structural `slides apply-plan` 回放能力（`ppt_flow.mjs:1392/:1423` 双 schema 分流）;
2. S4 不是「隐藏写」,而是 spec 有意设计的收敛触发器（`cli-surface:498`、`create-deck.md:92`）;
3. exit 2 属于普通 `state` 的 replacement/current-repair hard-stop（`:3869`）,不是
   `state --validate-state`（其 invalid 是 exit 1,`:3832`）——findings-I 此处也有事实错误。

合并依据因此从「文件数」改为「控制风险面」: S4 是控制路径重设计,独立成 C3。

**4→5（人类决定,2026-08-16）**: 4035 行的 `ppt_flow.mjs` 必须拆——用最安全的纯拆分（零行为
变化、只搬不改）作为 C0 排在 C1 之前。它不只是债务清理,更是 C1 单一声明源的**结构前提**
（descriptor 落在各命令模块）。

**5→4（人类决定 α,2026-08-16）**: C3（state/投影重建触发重设计）**延后**。实测 trigger 点
≈ 15–20 个 Controller 节点（create-deck 共 40 节点）——为一张 spec 明确「非权威」的协作卡
动半个 playbook,价值小、风险大,且 B1 修复后 C1/C2/C4 不依赖它。设计预案（评审 6 问 + trigger
matrix）保留在 `03`,摩擦由 C1 的 help 契约块兜底。

## 风险 / 取舍

- [C3 的价值/风险不匹配] → **延后（α）**: 设计预案保留在 `03`;`state` 隐藏写的摩擦由 C1 的
  help 契约块（G）兜底;重启条件记录在 `06`。
- [改命令后同步不完整 → 半迁移态] → `05` 五层清单 + tombstone 三分验收 + clean-break 边界。
- [C1 结果模型依赖 C3 的投影边界] → 已解除: C1 冻结契约为「两个分列 effect」,不依赖 C3 落地
  （`progress.md` 门槛 3）。
- [纯拆分弄坏冷启动/import 顺序] → `00` 六条铁律 + 同 fixture stdout 逐字节一致验收。
- 延后项与 no-go（C/B/大重构/不该动的）全部记录在 `06`,不假装解决。

## 目录索引

| 文件 | 职责 |
| --- | --- |
| `progress.md` | **进度跟踪**: 每 change 状态、依赖、开工门槛、下一步、窄决策待办 |
| `00-split-ppt-flow-command-modules.md` | C0 纯拆分（4035 行入口 → 入口 + 12 命令模块） |
| `01-align-cli-machine-contract.md` | C1 范围 / 同步面 / 完成判据 |
| `02-split-navigation-and-pagination-commands.md` | C2 范围 / 同步面 / 完成判据 |
| `03-separate-state-task-projection-rebuild.md` | C3 **延后（α）**: 设计预案 + 评审 6 问 + trigger matrix（重启时用） |
| `04-split-doctor-readiness-probe.md` | C4 范围 / 同步面 / 完成判据 |
| `05-sync-surface-master-checklist.md` | 改命令必须同步的全部位置（五层清单 + clean-break 边界） |
| `06-deferred-and-no-go.md` | 明确不做/延后的（防止丢失） |
| `07-external-design-review.md` | 外部评审原文（含两轮: §一–九 + §十（二次评审）） |

## 修订历史

### v1 — 第一轮评审（`07` §一–九）

| 修订 | 内容 |
| --- | --- |
| 拓扑 3→4 | S4 独立为 C3;change 名与文件名同步重排 |
| S2 边界 | 只迁 narrative;structural `slides apply-plan` 保留;`apply-plan` token 不 tombstone |
| exit code 事实 | 0/1/2/130/143 真值表进 `01`(2 属于普通 state hard-stop) |
| C1 定性 | 从「补 --json flag」改为「结果模型 + 单一声明源 + inventory 治理」 |
| 05 清单 | 补 harness_coherence / docs-consistency 等遗漏;修 overclaim;加 clean-break 边界 |
| 进度跟踪 | 拆分出 `progress.md`,README 只留索引与总纲 |

### v2 — 第二轮评审（`07` §十,11 条）

| 修订 | 内容 |
| --- | --- |
| C3 门槛矛盾 | 从「design 闭合前不 open」改为 design gate（open 后、tasks 前闭合 6 问） |
| 跨 change 冻结 | C1 前冻结 `build`/`image2` 的 projection effect 边界（取 C3 候选 A） |
| partial effect 闭环 | C1 增加恢复闭环要求（new-version/build 的检测/修复/终态不变量） |
| probe 绑 run | C4 修正: `probe <run-dir>`,保留 pre-POST profile fence,负例测试不删 |
| C2 拒绝时序 | 「binding 前拒绝」改为「binding + confined read-only classification 后、mutation/provider 前」 |
| state grammar | C3 推荐 `state show/validate/repair-known-execution-mismatch` 完整 grammar |
| exit 归一协议 | C1 增加 delegated child status 的归一决定（`test`/`:4002` 透传） |
| tombstone 三分验收 | 05 拆开: active consumer 计数 / runtime 负例 / planted guard sensitivity |
| declaration authority | C1 增加 authority map,防 `cli_error.mjs` 膨胀成第二 registry |
| trigger cutover matrix | C3 design 必产闭集矩阵（state :3892 / build :959 / image2 :3134） |
| Task Mandate 对齐 | probe 确认属 Task Mandate/MD Controller 侧;覆盖 `style-master authorize` 新增的 `controller_handoff` typed evidence |

### v3 — 人类决定（2026-08-16）

| 修订 | 内容 |
| --- | --- |
| C0 纯拆分 | 4035 行入口拆为入口 + `commands/` 12 模块 + `command_support`,零行为变化,先于 C1（`00`） |
| polish 门 | 每个 change 的 planning artifacts 写完并复核后,必跑 `/polish-openspec-change`（≥2 轮,evidence-backed）,达 `ready for apply` 才许 apply |
| 命名确认 | `artifacts` / `paginate` / `preflight` / `probe` / `task-projection`（proposal 直接采用,窄决策见 `progress.md`） |

### v4 — 独立评审（2026-08-16,独立 subagent 评审 + 逐条代码复核）

| 修订 | 内容 |
| --- | --- |
| B1 冻结矛盾 | C1 投影边界冻结改为「两个分列 effect + 可版本化,C1 不改退出路径,C3 收口」（原「只拥有 delivery」与代码 exit 语义矛盾,`01` §1.5 重写） |
| M1 零行为证据 | C0 完成判据的逐字节一致扩展到全部 12 命令 |
| 行号校准 | exit-1 `:3832`、exit-2 `:3869`、state refresh `:3892`、op 枚举 `:3539`、err.exitCode `:4002`、test return `:1544`（当前工作区实测） |
| 基线措辞 | 「HEAD 5571002」改为「`ppt_flow.mjs` 最后修改 commit 5571002,行号按当前工作区实测」 |
| 守护点分类 | `01` §1.3 五守卫点分「硬编码清单类 / 自动跟随类」两类改法 |
| test 透传精度 | 数值型 status 透传;overflow/signal-killed 归一为 1（`:1518–1519`） |
| 文件名约定 | C0 命令模块文件名与命令名对齐（kebab） |

### v5 — 人类决定 α（2026-08-16,应「重点投资发虚处」而做）

| 修订 | 内容 |
| --- | --- |
| C3 延后 | state/投影重建触发重设计整体延后: trigger 点实测 ≈15–20 个 Controller 节点,价值小风险大,且 C1/C2/C4 不依赖;设计预案保留在 `03`,重启条件进 `06` |
| 摩擦兜底 | `state` 隐藏写的摩擦由 C1 的 help 契约块（G）兜底: 帮助写明 eligible route 下会重建协作卡 |
| 拓扑 5→4 | 计划内 change = C0/C1/C2/C4;C1 冻结契约改为「两个分列 effect,不依赖 C3 落地」 |

## 落地关联

- change 名与顺序: `split-ppt-flow-command-modules` → `align-cli-machine-contract` →
  `split-navigation-and-pagination-commands` → `split-doctor-readiness-probe`。
  （C3 `separate-state-task-projection-rebuild` 延后,预案在 `03`,重启条件在 `06`。）
- 每个 change 生命周期: `openspec new change <name>` → proposal/specs/design/tasks →
  `/polish-openspec-change` 磨到 `ready for apply` → apply → `openspec validate <name> --strict`
  → archive。artifact 规则照 `openspec/config.yaml` rules。
- 关闭条件: 四个 change 全部归档,`npm test` 与全部审计绿,`06` 延后项（含 C3）已在
  `_backlog/todos` 有记录;然后按 `_backlog/plans/README.md` 流程把本 plan 移入
  `_done/_closed_plans/`。

## 编号映射（对 07 的引用）

评审原文中的 04/05 = 本目录修订后的 05/06;原文 01–03 对应修订后 01/02/04（S2 修正、S4 单列）。
文件已重命名、内容历经 v1–v5 五轮修订,评审记录的基线 hash 必然过期——其结论已全部吸收进
本目录;`07` 本身不改动。
