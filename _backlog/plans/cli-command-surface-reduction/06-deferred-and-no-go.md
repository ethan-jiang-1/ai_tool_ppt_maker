# 06 — 明确不做 / 显式延后（防止丢失）

> 本计划只做 4 个 change（见 `progress.md`）。以下各项**有意不做或延后**,每条都记录理由与
> 重新评估条件,以免被误读为遗漏。
> 修订（吸收 07）: exit-2 基线已纠正;F 的大部分随 C4 消解。

## 一、延后（第二梯队,本计划归档后重新评估）

| 项 | 内容 | 修订后状态 |
| --- | --- | --- |
| **C 命名统一** | `--plan-sha256`→`--plan-hash`;`--only`→`--slide-id`;hash 字段名三种写法归一 | 保留延后;hash 命名的窄决策随 C2 提案一并定（避免两 change 互相踩） |
| **F run_dir 口径统一** | doctor 的 `--run-dir` flag vs 其余命令位置参数 | **大部分随 C4 消解**（preflight 出生即 `<run-dir>` 位置参数,doctor 不再有 run-dir）;剩余 = 文档口径核对,并入 C4 完成判据 |
| **B operation 子命令化** | image2/style-master 的 flags 挂到 operation 级 | 保留延后: 触碰 create-deck 40 个 Controller 步骤,约束 1 明令不做;G 的契约块已缓解「帮助撒谎」的一半 |

## 二、No-go（本计划及近期都不做）

| 项 | 内容 | 理由 |
| --- | --- | --- |
| findings-I 选项 B+C（库 seam + 薄 CLI / 会话上下文） | command* 主体搬进可 import 运行时模块;hash 不再穿 Agent context window | 收益最大但影响面最大（80–110 文件 + 测试哲学重谈 + secret 边界搬家）;是「大重构」,需要独立 plan,不能混进瘦身计划 |
| findings-I 选项 A/D（收窄表面/单动词 execute） | inspect + 泛型 step;合并 human-gate 动词 | human-gate 动词分离是有意设计（付费步骤之间插人决定）,合并是负优化 |
| findings-I 选项 E（治理转向） | closed schema 驱动命令生成 | 先有 C1–C4 的拆分成果,才知道 surface 该长什么样 |
| 自动带 hash / run_dir 智能推断 / 缓存 | 帮 Agent 记住上一次 hash、扫 deck_* 猜 run_dir | 破坏 byte-preservation 保证与 AGENT_CONTRACT 反模式,永远不做 |

## 三、不该动的（看似摩擦,实为有意设计,本计划零触碰）

- **hash 线程化本身**（`--plan-hash`/`--batch-hash`/`--attempt-sha256`/`--plan-sha256`）:
  反漂移/授权绑定/CAS 保护机制。只改命名（延后项 C）,不改机制。
- **plan/authorize/generate/review 的动词分离**: 保护的是「grant 记录」与「视觉方向决定」的分离,
  不是「authorize 处插人决定」——authorize 已是 Task Mandate 下的 Agent-run 机械 grant 记录
  （Page Image 8/10 `align-task-mandate-exact-grants`、Style Master 8/16
  `fold-style-master-cost-into-task-mandate` 均已落地归档）;人类 gate 在
  `review`（`proceed|repair|redirect` 看成品）。动词不合并的理由是这个分离,任何
  「合并成单动词 execute」都会把视觉决定塞回机械序列。
- **secret-safe envelope 与 stderr 最后一行契约**: 深度所在,动不得。
- **success 人类文本**: AGENT_CONTRACT 的 Human-facing handoff 依赖。
- **exit 2 特例**: 属于普通 `state` 的 replacement/current-repair hard-stop
  （`ppt_flow.mjs:3861`）,搬移时保留——**不是** `state validate`（其 invalid 是 exit 1,`:3824`;
  另 SIGINT/SIGTERM 130/143,`cli_bootstrap.mjs:178`）。findings-I 此处有事实错误,已按 07 纠正。
- **Task Mandate 权威**（对齐已归档 `fold-style-master-cost-into-task-mandate`,commit `5571002`）:
  成本授权与 probe 的人类确认属于 Task Mandate / MD Controller 侧;CLI 不新增 confirmation
  flag、grant、State 字段或聊天推断。该 change 还新增了 state-owned 的 typed cli evidence
  （`style-master authorize` 成功后记录 `controller_handoff`）——C1 结果模型必须覆盖,
  C3 不得碰撞（见 `01` §1.8、`03` 变更形状）。

## 四、记录与重新评估

- 本清单在本 plan 关闭时随 plan 移入 `_done/_closed_plans/`,延后项若仍未排期,
  在 `_backlog/todos` 留一条「重新评估 C/B」记录。
- 重新评估条件: 四个 change 全部归档 + 实际 Agent 使用反馈收集后,按
  [影响面] × [收益] 重排,不提前承诺顺序。
