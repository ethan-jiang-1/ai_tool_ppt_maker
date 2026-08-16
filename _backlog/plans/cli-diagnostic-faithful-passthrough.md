# Plan: CLI 诊断忠实传递与相邻恢复边界

> 类型: 复盘（postmortem）+ 设计边界 | 更新: 2026-08-16 | 状态: 待拆分为 OpenSpec changes

## 结论

一线 V8 生产确认了一个重要问题：`ppt_flow.mjs` 的若干入口会在 workflow owner 已经掌握
明确事实时，重新推导错误类别和下一步，导致 `PageImageVisualLanguageError` 被改写为自循环或
`internal`。这正是 BUG-067 / BUG-068 的共同根因，修复方向是让 CLI 不再维护第二个归因器。

但 BUG-069（验证观察）、BUG-070（运行时环境）并不是同一种诊断透传缺陷；BUG-071（活跃
生成与 reconcile）和 BUG-072（State cursor）更不是。它们共同伤害 Agent 的恢复体验，却有
不同的事实权威、时间语义和修复边界。本文件是 umbrella postmortem，不应被当作“一个 change
一次修完五类问题”的实施令。

## 现场证据

| Bug | 已证实的失败 | 所属机制 | 处理边界 |
|---|---|---|---|
| BUG-067 | Style Master 将 `PageImageVisualLanguageError` 改写为 inspect 自循环 | typed source fact 在 CLI fallback 中丢失 | Change A |
| BUG-068 | `image2 plan` 将同一错误降级为 `internal` / `report_internal` | 同一 typed source fact 走了另一条 CLI fallback | Change A |
| BUG-069 | source 已可解析，但 `validate` 只暴露 state stale | 多阶段结果的公共观察契约缺失 | Change B |
| BUG-070 | doctor READY 后 authorize 不读取相同 dotenv | runtime startup/env 来源不一致 | Change C |
| BUG-071 | review 遇到 live writer 时没有等待/重读事实 | 并发、时序与 in-progress observation | 不纳入本计划 |
| BUG-072 | State/status 与 workflow inspection 指向不同当前步骤 | durable cursor 与 owner projection 漂移 | 不纳入本计划 |

BUG-071 的现场最终证明当时 generate 仍在运行，不能把它伪称为 stale-lock/reconcile 缺陷；
BUG-072 则在 pilot review 后仍显示最早 authoring node。两者都应保持独立 backlog，不得为了
“统一诊断”把不同恢复语义塞进 CLI fallback。

## 当前契约与缺口

`openspec/specs/cli-surface/spec.md` 已给出两个正确方向：

- CLI routing 消费 state/workflow owner 的结果，不重建 mode、gate、authorization、recovery
  或 completion。
- parent 只有在 child 已发出完整、可信、受支持的 diagnostic envelope 时才忠实保留其字段；
  否则必须 fail closed，不能猜测 recovery。

前者直接约束 BUG-067 / BUG-068 的重复归因。后者不能被误读为“所有内部 `Error` 都天然是
CLI diagnostic”：`PageImageVisualLanguageError` 是 resolver 内部的 typed problem fact，它有
`issues[]`，却没有已经授权给外部的 `category` 或 `next`。因此需要先分清下列三个权威，
而不是把 `toDiagnostic()` 随意下沉到任意模块：

| 事实 | 权威 | 不拥有的内容 |
|---|---|---|
| source/visual-language 问题（kind、path、token、issues） | source/visual-language producer | Style Master 或 raw-plan 的 lifecycle recovery |
| 当前 operation 的最近合法动作 | Style Master owner 或 progressive raw owner | 改写 source problem 的 path/token |
| `pptmaker-cli-diagnostic` JSON envelope、parent invocation、secret-safe 输出 | direct CLI producer | 重新推导前两者的业务语义 |

该三段式边界既保留 CLI thin shell，也避免把 CLI schema 和某个 command 的 `next` 反向泄漏给
通用 visual-language resolver。

## 三个独立实施切片

### Change A: `cli-diagnostic-faithful-passthrough`

**范围**：BUG-067、BUG-068，以及具有同样可复现证据的未来 typed source failure。

**决策**：建立一个受支持的 structured diagnostic-fact bridge。它由 source producer 返回
机器可读的 kind、subject、issues、path/token 等事实；调用它的 operation owner 绑定当前
workflow/lifecycle 的 exact `next`；CLI 只将这两个已绑定结果封装为
`pptmaker-cli-diagnostic`，可追加 bounded invocation/delegated lineage，但不再以
`String(error.code || fallback)` 或 `startsWith(...)` 猜测类别和恢复。

**fail-closed**：没有可信 structured fact 的未知/截断异常仍是 `internal` 或 `delegated` 加
`report_internal`。忠实传递的是受支持的结构化结果，不是 stack、任意 `Error.message`、provider
body 或 secrets。

**最小验收**：

1. Style Master inspect 与 plan 遇到 invalid visual-language fixture 时保留 issues path、违规
   token、source owner 和 direct source repair action；next 不得回指同一个 inspect。
2. `image2 plan` 遇到相同 fixture 时保留同一 source fact，且不是 `internal` /
   `report_internal`。
3. 未登记 typed fact、无效 delegated output、截断 child output 仍 fail closed，不能借修复之名
   暴露内部信息或猜测 retry。
4. 回归同时覆盖 Pure 与 Framed，因为 shared visual-language registry 不能只在 V8/Pure 证明。

### Change B: `validate-source-state-projection`

**范围**：BUG-069，独立于 Change A。

**决策**：`validate` 仍在 source/state identity stale 时返回 nonzero，且绝不授予 raw planning、
provider work 或 state rebind 权限；但它必须在同一公开结果中可机器消费地表达 source parsing
已经成功。OpenSpec design 必须固定以下 surface，不能只在 prose 中补一句：

- source-invalid：source problem 优先，不能被 identity mismatch 覆盖；
- source-valid + state-stale：exit nonzero，state owner 的 hard-stop 和 exact next 保留，同时有
  稳定的 `source_validation: valid` observation；
- output schema、human text、JSON/non-JSON compatibility、MD consumer 行为与无 provider side
  effect 都有明确断言。

推荐把它实现为现有 `validate` 的加性、版本化 observation 字段，而不是偷偷让命令 exit 0；如
OpenSpec 选择独立 source-only command，必须把它另立为 public surface，写明 owner、兼容与帮助。

### Change C: `image2-runtime-startup-boundary`

**范围**：BUG-070，独立于诊断信封。

**决策**：Image2 runtime 所有宣称可执行的入口共享同一个受限 startup loader。运行调用者的
显式环境值优先；deck `.env` 只补齐缺失值；project/current-working-directory `.env` 仅补齐仍缺失
的值。loader 只处理已声明的 runtime keys，不输出值或 secrets，并在 doctor 的 raw-generation
readiness、Image2 authorize、generate 与相关 Style Master provider operations 中使用同一来源。

**最小验收**：

1. 不 export dotenv 值时，doctor READY 后 exact authorize 和 generate 都能从同一来源解析匹配
   profile。
2. shell、deck、project 三处各给不同 profile 时，测试固定优先级为 shell > deck > project。
3. 缺失、无效和不匹配 profile 保持原有 hard-stop，且在 grant、attempt、provider request 之前
   停止。
4. 未涉及 Image2 runtime 的 CLI 不因这项收敛而隐式读取 dotenv 或改变行为。

## 明确不纳入

- BUG-071：需单独定义 live writer、进程已退出但 submitted、异常 lock 三种时间状态，以及
  每种状态的等待、重读、reconcile 或 escalation action。
- BUG-072：需在 successful owner/CLI transition 时更新 State node cursor、node eligibility、gate
  display 与 task projection；不能仅让 `state --json` 偏好显示 workflow inspection。
- Provider 像素质量、中文表达和内容保真：由 Page Image review / source refinement 处理；人工
  visual gate 正是该类问题的既有 owner，不能误记为 CLI diagnostic bug。

## 变更与归档纪律

本文件不创建或授权任何 Harness 改动。实施时应分别建 OpenSpec proposal、design、delta specs
与 tasks；每个 change 只修改其拥有的 spec/capability，并只在其验收完成后关闭对应 bug：

- Change A 完成后可评估 BUG-067、BUG-068；
- Change B 完成后可评估 BUG-069；
- Change C 完成后可评估 BUG-070；
- BUG-071、BUG-072 保持活跃，除非其独立回归已通过。

所有验证使用 isolated fixtures；`deck_ai_sdlc_keynote/3_versions/v8` 可作为现场样本，不得手改
其 `_generated/`、state、receipts、journals 或 locks。所有 public CLI field、flag、exit path、
stdout JSON 与 stderr diagnostic 的变化，先更新 `cli-surface` main spec 和 active delta；MD 只消费
producer 公开字段，不复制 producer schema。
