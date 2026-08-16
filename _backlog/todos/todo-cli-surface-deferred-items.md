# Todo: re-evaluate deferred CLI surface items after command-surface reduction

> 优先级: 低（按实际 Agent 使用反馈再评估）| 来源: `_backlog/_done/_closed_plans/cli-command-surface-reduction/06-deferred-and-no-go.md`

CLI 命令面平衡瘦身（C0/C1/C2/C4）已归档后，以下延后项重新评估（不提前承诺顺序）：

| 项 | 内容 | 重启条件 |
| --- | --- | --- |
| **C3 `separate-state-task-projection-rebuild`** | `state` 子命令化 + 投影重建触发重设计（`state show/validate/repair-known-execution-mismatch` + `task-projection rebuild`）；设计预案 + 评审 6 问 + trigger cutover matrix 保留在 plan 目录 `03` | 四个 change 归档后，若 Agent 实际使用反馈显示「state 隐藏写」是高频痛点，按 `03` 预案重启（先重跑 trigger 计数 ≈15–20 节点） |
| **C 命名统一** | `--plan-sha256`→`--plan-hash`、`--only`→`--slide-id`、hash 字段名三种写法归一 | 随 C2 提案一并定（未随 C2 落地，留此待定） |
| **B operation 子命令化** | image2/style-master 的 flags 挂到 operation 级 | 触碰 create-deck 40 Controller 节点，约束 1 明令不做；G 契约块已缓解一半 |

no-go（永久不做）见 `06` §二/§三：findings-I 选项 B+C 大重构（库 seam + 薄 CLI / 会话上下文）、选项 A/D（收窄表面/单动词 execute）、选项 E（治理转向）、自动带 hash/run_dir 推断/缓存。
