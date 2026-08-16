# 06 — 外部设计评审（2026-08-16）

> 结论：**方向成立，但当前版本暂缓开工，必须修订后再进入 OpenSpec proposal。**
> 本文只评审设计，不修改原计划，也不实现任何命令。
> 仓库基线：`HEAD e39143e`；方案基线：下表当前 worktree 字节。若任一文件变化，本结论需要重新核对。

| 文件 | SHA-256 |
| --- | --- |
| `README.md` | `6832ccf9b58a5a55018e7b5627793e579f886d80ec869cede51fe7621a83d7fb` |
| `01-align-cli-machine-contract.md` | `a7ac6bc80593bbf60aea2e9a3c27d5f4dc115223f16137e23df01c7b804adba5` |
| `02-split-non-lifecycle-commands.md` | `ff6052726d08a4dcb64e63293c0ab39a98dd0bfc29582d8a8e9864e33f18dc22` |
| `03-split-doctor-readiness-probe.md` | `92882786aa96c9919b7bc720ce06fc6ef06575d56da853fe1a4abe93eb4e5af3` |
| `04-sync-surface-master-checklist.md` | `6bbccc8e15377dea6f9d6da898b91474e4c5a207f62e43f5aa9dec66a1b7856d` |
| `05-deferred-and-no-go.md` | `e088460896bbabcbf85696ce8406c98738b8b77ab8985e00cf3a2d5419a04388` |

## 一、总判断

这份计划识别的问题基本真实：`doctor`、`slides`、`state`、`image2` 的接口确有职责混装，
离线检查与付费探针应分开，机器输出与 help 契约也值得统一。S1 与 S3 的方向尤其合理。

但当前方案把几项**行为和控制路径重设计**误判成了“命令搬家”，并且有一项会删除仍在使用的
结构编辑能力。按当前文本直接开工，最可能出现的不是机械迁移遗漏，而是：结构计划无法回放、
Controller 不再按既有时机收敛协作投影、退出码文档与真实协议相反，以及旧 run bundle 给出已经
失效却没有精确恢复动作的命令。

| 范围 | 评审意见 |
| --- | --- |
| C1 机器契约 | 目标正确，但不是“纯增量文案”；须先设计结构化结果与单一声明源 |
| S1 `artifact-view` 拆分 | 原则支持；命令名需显式表达只重建 Human Navigation Path |
| S2 narrative pagination 拆分 | **按当前文本拒绝**；必须保留结构用途的 `slides apply-plan` |
| S4 `state` / task projection | **必须独立成第 3 个 change**；这是收敛触发器重设计 |
| S3 doctor/preflight/probe | 原则支持；须先决定 probe 的绑定范围与唯一语法 |
| 3-change 拓扑 | **不成立**；建议强制改为 4 changes，而不是把第 4 个保留成可选旋钮 |

当前三个“混装点”的真实形状是：

```text
slides apply-plan
├── narrative-page-plan       → 叙事分页 publication
└── structural transaction    → 结构编辑 exact-plan replay

ordinary state
├── 读取 State / Workflow Inspection
├── 生成 resume/status projection
└── 在合资格 route 上刷新 collaboration task projection

doctor
├── 全局离线环境体检
├── exact-run / operation readiness
└── 有网络与成本的 live provider probe
```

只有第三组主要是职责拆分；前两组还承担跨调用的回放或收敛语义。

## 二、开工前必须修正的问题

### 1. S2 会误删结构编辑的 persisted-plan replay

`02` 把 `slides narrative-plan/apply-plan` 整体迁到 `paginate`，并要求旧
`slides apply-plan` 消失及进入 tombstone。这个边界与当前实现不符：

- `ppt_flow.mjs:1376` 的 `slides apply-plan` 先识别 `narrative-page-plan`；
- 非 narrative schema 会继续进入 `ppt_flow.mjs:1423` 的结构事务校验与回放；
- `tests/01-content/test_target_structural_cli.mjs:140` 明确验证 target Controller 已激活后的
  persisted structural plan replay；同文件还验证 drift 时零写失败；
- `openspec/specs/node-specification/spec.md:839` 要求结构 mutation 只能消费同一份
  `plan_sha256` 绑定事务，并在 stale 时重新 preview，不能手改或自动 rebase。

因此，正确拆分应是：

1. 只把 narrative preview 与 narrative-plan apply 搬到 `paginate`；
2. 保留 `slides apply-plan` 作为 structural transaction 的公开回放入口；
3. `slides apply-plan` 收到 narrative schema 时可以给出新入口的精确替换诊断，但不能把
   `apply-plan` 这个 token 全局 tombstone；
4. 保留结构回放、selection-map drift、source drift、零写失败和零 provider 的契约测试。

这是当前计划的首要 blocker。它不是命名意见，而是能力删除。

### 2. S4 不是“去掉观察命令隐藏写”，而是改变投影收敛路径

当前普通 `state` 有意在合资格 route 上调用
`refreshProgressiveControllerTaskProjection()`（`ppt_flow.mjs:3884`）。这不是偶然副作用：

- `openspec/specs/cli-surface/spec.md:498` 明确允许普通 text/JSON `state` 在只读 inspection 后
  重建 current task projection；
- `openspec/specs/playbook-execution/spec.md:441` 规定 projection 只从 owner-issued inspection
  与 typed handoff 重建；
- `ppt_maker_harness/playbook/create-deck.md:82` 规定 route entry/resume 与 relevant decisions 后
  重建；
- `openspec/specs/workflow-inspection/spec.md:8` 则刻意把只读 inspection 与后续 presentation
  refresh 分开。

所以 `02` 所称“playbook 0 触点”只是在数旧命令字符串，没有计算控制语义触点。若普通
`state` 变为零写，而重建只剩一个无人保证调用的 `task-projection`，route entry/resume 会失去
现有收敛触发器。

S4 应独立设计并至少回答：

1. 谁在 route entry、resume 和 relevant decision 后调用 rebuild；
2. 谁判断 projection 是 `created`、`updated`、`current`、`not-applicable` 或 stale；
3. projection 被删除、人工编辑、写一半或重建失败时，哪个 owner 负责前向修复；
4. ineligible / undeclared current protocol 是否仍保持 projection 字节不变；
5. `state` 观察成功但 projection rebuild 失败时，两者是一个事务、两个结果，还是后者只作
   独立命令失败；
6. 终态不变量是“合资格 route 的 card 等于当前 owner facts 的确定性渲染”，还是仅保证
   “显式请求后可收敛”。

在这些问题关闭前，不能把 S4 与 S1/S2 当作同一类机械迁移。第 4 个 change 应是强制项。

### 3. 退出码基线写反了

`01:10`、`02:38` 与 `05:30` 都把 exit 2 归给 `state validate`。实际协议是：

- `state --validate-state` 发现 invalid result 时在 `ppt_flow.mjs:3824` 设置 exit 1；
- 普通 `state` 发现 replacement/current-repair hard-stop 时在 `ppt_flow.mjs:3861` exit 2；
- CLI bootstrap 对 `SIGINT` / `SIGTERM` 还保留 130 / 143
  （`shared/cli/cli_bootstrap.mjs:178`）。

这会直接污染 C1 的 help 契约、S4 的“语义保留”和 `05` 的 no-go 基线。proposal 前必须先改正
事实，再决定 help 如何表示 operation-specific exit matrix。不能从当前 plan 文案生成测试期待值。

### 4. C1 需要结果模型，不是给四个命令补 flag

`validate`、`build`、`refresh`、`new-version` 当前直接打印人类文本并只返回数值 code；它们没有
可供 JSON renderer 可靠消费的结构化成功结果。直接加 `--json` 会面临两个坏选择：解析自己
的 stdout，或在 text/JSON 两条路径重复业务事实。

此外，compound mutation 需要显式结果语义。例如：

- `new-version` 先创建 target，再激活 State draft；后半段失败时需要声明已发生的效果与恢复；
- `build` 完成 delivery 后还刷新 collaboration projection；若后者失败，不能把已完成的 delivery
  含糊报告成“build 未发生”。

C1 至少应先定义：

1. command implementation 返回结构化 owner result，text 与 JSON 只是两个 renderer；
2. 每个 JSON success report 的 schema/version、必填字段与 effect/partial-effect 表达；
3. JSON mode 的 stdout 恰好一个注册文档，不混入进度或人类 prose；
4. non-zero 时 stdout report 与 stderr final envelope 的关系；
5. help、inventory、exit matrix、JSON capability 与 operation grammar 的单一声明源或相等性审计。

“help 尾部存在一个契约块”的 contains 断言不够，它只能证明文案存在，不能证明文案等于实现。
C1 可以排第一，但前提是它产出后续 4 个 change 可复用的机器声明；否则先手写 12 份 help，随后
立刻扩到 17 个 root command，只会制造一次性 churn。

### 5. `fixed 12` 的制度前置比清单写得更广，且造成 change 依赖

固定数量不仅存在于 `cli-surface/spec.md:5` 和 inventory 测试，还被以下机制主动守护：

- `ppt_maker_harness/scripts/contracts/harness_coherence.mjs:444`；
- `tests/contracts/test_process_docs_consistency.mjs:194`；
- `tests/contracts/test_process_command_surface_entry_seams.mjs:88`；
- `ppt_maker_harness/scripts/shared/cli/cli_error.mjs` 的闭集 inventory。

`04` 没有列出前两个。因此如果 C2 才把 fixed-12 改成 variable inventory，C3 新增
`preflight`/`probe` 就必然依赖 C2；README 所说“C2 与 C3 互不依赖”不成立。

建议把 inventory governance 移到 C1，并把“closed, audited”补成可判定规则：新增命令必须声明
owner、单一职责、完整 grammar、输出模式、effect class、测试归属、与既有命令不重叠的理由；
删除命令必须关闭 runtime entry、consumer 与 residue guard。仅把固定数字删掉，不足以控制以后
的表面净增长。

### 6. tombstone 混淆了 runtime cutover 与 repository residue guard

“旧命令不能再执行”与“仓库 live 文本不能重新出现旧语法”是两种不同控制：

1. **runtime rejection**：旧 invocation 应在 binding、文件写、State 写、provider 初始化之前失败，
   输出 secret-safe envelope 与精确的新 `program + args`；
2. **repository residue guard**：静态审计应识别完整 obsolete grammar，而不是禁止一个仍可能合法
   出现在新语法、禁止句、诊断或历史说明里的普通 token。

现有 `harness_architecture.mjs` 不是通用 command-grammar parser。尤其 `apply-plan` 仍有结构用途，
不能进入全局词汇 tombstone。每个旧形态都需要 focused no-write/no-provider runtime test，以及能
安全 planted-failure 的 exact-grammar residue guard；两者不能由同一个“退役词清单”代替。

### 7. 现有 run bundle 是有意 clean break，不是“无影响”

`bundle_layout.mjs:1518` 会把 `image2 artifact-view` 写进 `deck-guide.md`，而
`_writeIfAbsent()`（`:1354`）不会刷新已有 bundle。遵守“不改 `deck_*` 生产数据”是对的，但结果是
现存 bundle 会继续保存旧 invocation。

计划应明确记录这个 support boundary：

- cutover 不触碰现有 run bundle 字节；
- 旧 invocation 必须返回 owner-issued 精确替代动作，而不是普通 unknown-command prose；
- 新建 bundle 使用新命令；已有 guide 的 stale 文本不构成 authority，也不能被静默手改；
- 若未来需要 guide repair，必须另有 owner-controlled、byte-preserving-aware 路径，不能在本计划中
  假装已经迁移。

## 三、建议的 4-change 拓扑

| 顺序 | 建议 change | 核心边界 | 进入下一步前的硬条件 |
| --- | --- | --- | --- |
| 1 | `align-cli-machine-contract` | 结构化结果、help/exit/JSON 单一声明、variable closed inventory governance | 真实 exit matrix；help 与实现相等性审计；后续命令可复用 |
| 2 | `split-navigation-and-pagination-commands` | S1 + 修正后的 S2；只迁 narrative，保留 structural `slides apply-plan` | 两类 plan schema 路由不混淆；旧 narrative 入口零写拒绝 |
| 3 | `separate-state-task-projection-rebuild` | S4 的观察/投影写分离与 Controller 收敛 | route entry/resume/decision 触发器、stale repair、终态不变量闭合 |
| 4 | `split-doctor-readiness-probe` | 离线 doctor、exact-run preflight、付费 live probe | probe scope、确认边界、提交次数、readiness authority 均唯一 |

C1 先做的理由不应是“当天级文案收益”，而应是它为后续命令提供一个可复用的 interface contract。
C2 与 C3 都依赖 C1 的 inventory governance；S4 独立后，S1/S2 的 change 才真正接近机械迁移。

不建议继续用“最大文件数”作为主要合并依据。文件数能估算执行成本，却不能代表控制风险：S4
即使只改十几个文件，也比改三十份镜像文档更需要独立 proposal、negative path 与 recovery 评审。

## 四、每个 change 应写入的 cutover 不变量

### C1 — 机器结果与 help

- 默认 text mode 的人类 handoff 保持现有意图；JSON mode stdout 恰好一个 schema-valid 文档。
- JS-controlled non-zero 仍以 stderr 最后一个非空行为唯一 envelope；不得泄漏 incidental JSON。
- 0/1/2/130/143 按真实 operation 和 bootstrap 语义声明，不把 command family 粗略写成 `0/1`。
- mutating command 的成功、partial effect、no-op 与失败可区分，renderer 不拥有业务事实。

### C2 — navigation 与 narrative pagination

- navigation rebuild 仍 provider-free、非 selector、非授权、非 lifecycle transition。
- narrative candidate 与 plan 仍受 `_scratch/` lexical + realpath confinement、canonical bytes 与 exact
  hash 约束。
- structural `slides apply-plan` 的 persisted replay、drift fencing、零 provider 与 target 不重复变更
  保持原契约。
- 旧 narrative invocation 在任何 binding/write/provider work 前失败，并返回新 invocation。

### C3 — State 与 task projection

- `state` 观察是否零写，要与所有 Controller trigger 同时切换，不能只删 writer call。
- Workflow Inspection 继续是 read-only fact projection；task card 继续不是 authority、selector、resume
  signal、authorization 或 evidence。
- ineligible route 不创建、不更新 card；手改、删除或 stale card 不影响 owner action。
- rebuild 可重复、确定性收敛；失败不改 State、source、evidence，也不制造第二条 recovery policy。

### C4 — doctor / preflight / probe

- `doctor` 永远离线、零 provider、零费用。
- `preflight` 绑定 exact run + operation，复用现有 identity/readiness evaluator，零网络、零写，不成为
  第二个 readiness authority。
- `probe` 的 first-vendor / all-vendor 提交次数、redirect、不重试、secret-safe 与“成功不等于生产
  授权”逐项保持。
- 人类确认属于 MD Controller policy；CLI 不能凭一个自造 flag 推断聊天授权。

## 五、S3 仍需 owner 定案的关键问题

S3 的方向是本计划中最稳的一刀，但当前语法与范围尚未唯一：

1. `03` 定义 `preflight <run-dir> --operation <op>`，而 `05:11` 又把 doctor/preflight 描述成
   `--run-dir` flag，必须选定一种 canonical grammar；
2. `probe` 是全局 channel connectivity probe，还是 exact-run/profile-bound probe？
   - 若是全局 probe，应明确它不确认 run profile、readiness 或生产授权；
   - 若绑定 run/profile，就必须显式接收并验证该 identity，不能靠环境猜测；
3. “迁入独立 owner 模块”不能新造 readiness authority。可以抽出深 module/seam，但 run identity、
   environment check 与 selected-workflow readiness 的事实所有权仍须留在现有 owner。

在现有契约下，我倾向于：`probe` 保持不绑定 run 的 connectivity-only 诊断；`preflight` 才负责
exact-run/operation readiness。两者的成功都不授予 provider production cost。

## 六、命名与 interface 深度意见

计划名叫“surface reduction”，但 root commands 由 12 增至 17；它减少的是职责混装和非法 flag
组合，不是命令数量。建议用以下指标评估收益，而不是只看 root count 或文件数：

- 每个 invocation 跨越几个 owner；
- parent help 暴露多少与当前 operation 无关的 flags；
- 可构造但无意义的 flag 组合数量；
- caller 为正确调用必须记住的隐藏事实数量；
- 新 root command 的净增长理由与退役能力。

具体命名建议重新开一次窄决策：

- `artifacts` 比实际职责宽，且裸名不表达写 derived navigation；优先考虑
  `navigation rebuild` 或 `artifacts navigation-rebuild`；
- `task-projection` 是会写文件的裸名，优先 `task-projection rebuild`；
- `paginate apply ... --apply` 同时用了 mutation subcommand 与 mutation flag。要么把 `apply` 视为
  明确动作，要么保留 flag 并写清第二重确认解决什么独立风险，不应无理由重复；
- `paginate` 若只做 plan/apply，可显式使用 `paginate plan` / `paginate apply`，让 help 与测试都以
  operation 为 interface，而不是靠 flags 推断模式。

这些不是为了追求词漂亮，而是让 effect class、owner 与恢复动作直接从 invocation 可见。

## 七、同步面清单的已知遗漏

`04` 是有价值的起点，但不能声称“漏任一行审计就会红”；现有审计尚不能覆盖完整 grammar，且
至少还要纳入：

- `ppt_maker_harness/scripts/contracts/harness_coherence.mjs`；
- `tests/contracts/test_process_docs_consistency.mjs`；
- `tests/contracts/source-test-ownership.json`（新增/迁移测试归属时）；
- `openspec/specs/workflow-inspection/spec.md`（S4）；
- `openspec/specs/playbook-execution/spec.md`（S4 的 rebuild trigger）；
- `tests_e2e/shared/workflow/test_mock_doctor_readiness_alignment.mjs`（S3）；
- `ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs`、
  `openspec/specs/run-bundle-layout/spec.md`、`openspec/specs/run-bundle-management/spec.md`；
- `tests/shared/run-bundle/test_page_image_layout.mjs` 与
  `tests/contracts/test_diagnostic_recovery_handoff.mjs`；
- 一项新的 exact command-grammar audit；现有 `harness_document_command_audit` 主要验证文档 flag
  能否在 help 找到，不能证明完整 invocation、参数位置或 operation 组合有效。

影响面估算应在修正 S2/S4 边界后重跑；当前 `~35–40` 与“playbook 触点 ≤ 3”已不能作为提案
拆分依据。

## 八、进入 proposal 前需要 owner 明确的决定

1. 接受 4 changes 为强制拓扑，而不是保留成可选旋钮；
2. 确认 structural `slides apply-plan` 保留，只迁 narrative schema；
3. 决定 projection rebuild 的 caller、触发时机、failure/repair 与终态不变量；
4. 决定 probe 是 connectivity-only 还是 exact-run/profile-bound，并统一 `run-dir` 语法；
5. 决定 mutating commands 是否采用带动作的名字，以及 `paginate apply` 是否还需要 `--apply`；
6. 接受现有 run bundle 字节不迁移但旧调用必须给出精确替代动作的 clean-break 边界；
7. 给 variable inventory 写 admission/net-growth rule，并用职责摩擦指标而非“命令越少越好”验收。

这些决定落到修订版 README/01–05 后，再创建第一个 OpenSpec change。当前版本不建议进入 apply。

## 九、复核证据

本评审核对了相关 main specs、`ppt_flow.mjs`、CLI bootstrap/error contract、State/task projection、
run-bundle scaffolder、architecture/coherence/document audits 与对应测试。定向回归：

- `tests/01-content/test_target_structural_cli.mjs`；
- `tests/shared/workflow/test_page_production_task_projection.mjs`。

合计 16 个定向测试通过。这些测试证明当前行为基线，不代表当前 plan 已可实施。
