# 05 — 明确不做 / 显式延后（防止丢失）

> 本计划只做 3 个 change。以下各项**有意不做或延后**,每条都记录理由与重新评估条件,
> 以免被误读为遗漏。

## 一、延后（第二梯队,本计划归档后重新评估）

| 项 | 内容 | 无兼容模式下的新成本 | 延后理由 |
| --- | --- | --- | --- |
| **C 命名统一** | `--plan-sha256`→`--plan-hash`;`--only`→`--slide-id`;hash 字段名三种写法归一 | ~20–30 文件（比 findings 估算低: 无 alias 过渡期） | 触碰 slides/refresh 生命周期动词面;等拆分落地后 surface 稳定再动,避免与 C2 互相踩 |
| **F run_dir 口径统一** | doctor/preflight 的 `--run-dir` flag 与其余命令位置参数归一 | ~30–50 文件,一次性切（无兼容也不能分期） | 纯语法迁移、无行为收益;本计划已通过帮助契约块（G）缓解歧义 |
| **B operation 子命令化** | image2/style-master 的 flags 挂到 operation 级,`--help` 每操作只显示本操作 flags | 触碰 create-deck 40 个 Controller 步骤 + spec fixed forms | **触碰生产 Controller 步进结构,是约束 1 明令不做的"大影响面"**;G 的契约块已缓解"帮助撒谎"的一半 |
| **findings-I 选项 A/D**（收窄表面/单动词 execute） | inspect + 泛型 step;合并 human-gate 动词 | 重写全部 spawn 测试 + 40 步 Controller | human-gate 动词分离是有意设计（付费步骤之间插人决定）,合并是负优化 |

## 二、No-go（本计划及近期都不做）

| 项 | 内容 | 理由 |
| --- | --- | --- |
| **findings-I 选项 B+C**（库 seam + 薄 CLI / 会话上下文） | command* 主体搬进可 import 运行时模块;hash 不再穿 Agent context window | 收益最大但影响面最大（80–110 文件 + 测试哲学重谈 + secret 边界搬家）;是"大重构",需要独立 plan 与更长评审,不能混进瘦身计划 |
| **findings-I 选项 E**（治理转向,closed schema 驱动命令生成） | 让错误形状不可表达 | 先有 C2/C3 的拆分成果,才知道 surface 该长什么样 |
| **自动带 hash / run_dir 智能推断 / 缓存** | 帮 Agent 记住上一次的 hash、扫 deck_* 猜 run_dir | 直接破坏 byte-preservation 保证与 AGENT_CONTRACT 反模式,永远不做 |

## 三、不该动的（看似摩擦,实为有意设计,本计划零触碰）

- **hash 线程化本身**（`--plan-hash`/`--batch-hash`/`--attempt-sha256`/`--plan-sha256`）:
  反漂移/授权绑定/CAS 的保护机制。只改命名（延后项 C),不改机制。
- **pilot/authorize/generate 的动词分离**: human-gate 机制。
- **secret-safe envelope 与 stderr 最后一行契约**: 深度所在,动不得。
- **success 人类文本**: AGENT_CONTRACT 的 Human-facing handoff 依赖。
- **`state validate` 的 exit 2 契约**: 损坏态特例,搬移时保留。

## 四、记录与重新评估

- 本清单在本 plan 关闭时随 plan 移入 `_done/_closed_plans/`,延后项若仍未排期,
  在 `_backlog/todos` 留一条"重新评估 C/F/B"的记录。
- 重新评估条件: 三个 change 全部归档 + 实际 Agent 使用反馈收集后,按
  [影响面] × [收益] 重排,不提前承诺顺序。
