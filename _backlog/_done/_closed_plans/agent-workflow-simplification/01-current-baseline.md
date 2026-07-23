# 当前基线与探针

返回 [主计划](../agent-workflow-simplification.md)。

## 运行时事实

后续 change 必须将下列事实视为既有 direct owner：

| 事实 | 当前 owner | 简化时不可做的事 |
|---|---|---|
| exact run 的 production mode | `_state/state.yaml` 的 `production_mode.by_version` | 用 metadata 或 source marker 重新猜 mode |
| pipeline contract | 当前 run 的 source marker | 在普通生产中原地跨 pipeline 改 source |
| cross-pipeline handoff | transition state owner + exact receipt/plan | 加一条 generic state bypass 或手写 handoff |
| provider submit | operation/scope/profile/execution-bound authorization | 用已有产物或 chat 决策隐式授权新提交 |
| derived output | 对应 owner 的 canonical source/receipt | 手改 `_generated/` 或把旁路产物标成 canonical |
| Image Production | 当前 whole-page 与 visual-slot adapter 的各自 owner | 把 optional slot work 或历史 compatibility 误写成唯一 image-production 语义 |

这解释了为何“控制面减法”不是放松 gate：要减少的是重复 evaluator、opaque diagnostic 与用户手动
拼接的步骤，而不是删除上述 authority。

## 执行原则

1. `guide`、`confirm` 和 `hard-stop` 保持原有的 protected invariant；身份、完整性、授权和恢复不可 waiver。
2. source、evaluator、Agent/human handoff 与 recovery 各自只保留一个 direct owner。
3. 控制面必须收敛为：direct fact -> one check -> earliest root cause -> one primary action -> rerun。

任何 proposed field、validator、retry、controller step 或 command 都必须说明删除/合并的重复控制；
不能只因未来可能方便恢复而增加另一层 state。

## Image Production 术语迁移

当前 `04-image2-refinement` 的 workflow/scripts 目录与大量 main specs 将 Phase 4 定义为 HTML 后的
optional visual-slot refinement；同时 first-class `image2-only` 的 whole-page production 仍复用
`05-iteration/legacy-image2`。这不是单纯目录美化，而是 ownership 与 caller seam 的错位：活动概念把
Image Production 缩小成一种可选后处理，实际又在 Phase 5 保留另一条主生产 adapter。

目标术语是 **Image Production**。它与 HTML Production 是 `02-visual-system` 之后可选择的并列生产
family：

| Adapter | page authority | 适用 production mode | 必须保留的约束 |
|---|---|---|---|
| whole-page Image Production | Image model | `image2-only` | exact source, selected scope authorization, provenance, header/final review |
| visual-slot Image Production | HTML compositor | `html-then-image2` | current HTML delivery, exact plan/slot authorization, candidate review and target-local promotion |

`visual-slot refinement` 可作为第二个 adapter 的窄术语保留；`image2-only` 与
`legacy-image2-first` 也可在 mode/pipeline compatibility contract 中保留。它们不能再命名活动
workflow Phase、顶层 capability 或主入口说明。Change 3 必须在 implementation 与 main specs 同步后才
删除旧主概念，不能以全局字符串替换破坏历史 run-bundle 读写 contract。

## Legacy Image2 轻量迭代探针

[`BUG-033-legacy-image2-lightweight-iteration-blocked.md`](../../../bugs/BUG-033-legacy-image2-lightweight-iteration-blocked.md)
描述一个已交付 markerless deck 修改一页 KICKER/图片时，落入 bundle layout、mode routing、authorization、
provenance、image discovery 和 assembly 多重阻断的场景。

这是 Change 1 的重要输入，但目前是 report，不是已验证根因。最小 fixture 必须分别记录以下 direct
fact，且不得手写 state/authorization/receipt：

| 声称的阻断 | 当前已知事实 | Change 1 要验证的问题 |
|---|---|---|
| `agent-portrayal.md` 被 layout 拒绝 | layout allowlist 是 bundle owner 的契约 | 该文件是否在当前 canonical location/shape 下仍被拒绝，最早 layout diagnostic 是什么 |
| metadata 缺 mode 导致 `MODE_MISSING` | exact state `production_mode.by_version` 是 authority，metadata 只是镜像 | fixture 是否真的缺 exact state record；不能把 metadata 缺失误判成 mode authority 缺失 |
| 单页重出需要授权 | remote submit 必须保留 scope-bound authorization | selected slide 的 existing authorization path 是否给出一个 bounded owner action，而不是需要手写 state |
| KICKER 变化导致 provenance stale | source/prompt 变化可能合法地失效 rendered bytes | 哪个 source field 影响哪个 artifact；reuse 是否在 owner 确认 current 后本地完成 |
| 两种 image filename 造成 ambiguous/missing | discovered artifact naming 属于 render/assembly owner | canonical naming/reconciliation owner 是否一致，并能给出唯一 repair |
| 最终必须旁路组装 | canonical assembly 不应依赖手工 PPTX | 前置 root cause 修复后同一 build checkpoint 是否可完成 |

一个有效改进可能是把 presentation-only layout 形状降为 `guide`，或将同一 selected-slide identity 的
authorization/provenance checks 合并为一份 inspection result。它不自动允许 `--incremental`、force、
metadata fallback、header-locked promotion 或 unscoped provider submit。

## 当前诊断假设

当前代码/规格已经显示三个可审计的设计信号：generic node state 与 domain transaction 并存；next action
由 status/card/domain guidance 多处推导；public Interface 仍接近 operation catalog。它们是 Change 1
要量化的假设，而不是可直接删除代码的授权。基线至少记录：

- canonical journey 的 command count、authority hops、state writes、human gates 和 independent failure
  branches；
- 每个 durable field 的 owner、writer、reader、freshness/invalidation 与 removal path；
- same fact 在 inspect/preflight/gate/submit/status 各被谁判断；
- legacy Image2 probe 在每一步的 direct diagnostic、file/state diff 和是否需要 human decision。
