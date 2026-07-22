# 三项 Change 路线

返回 [主计划](../agent-workflow-simplification.md)。每一项在前项归档、main specs 同步与回归后才可创建。
三个 change 的边界是诊断边界，不是按文件夹或行数切分：每项必须能独立说明“此前正确的行为仍为何正确、
此项新增或删除了什么、失败时应看哪个 owner”。

## Change 1: `unify-workflow-inspection`

**目的**：先统一观察语义，不改变生产写入语义、目录 ownership 或 durable record 名称。

建立 read-only `inspectWorkflow({ runDir, requestedIntent? })` module。它是 deep module：它组合 mode/source、
artifact/review、authorization、transaction 和 recovery owners，却不成为任何一个 owner 的替代品。它的
Interface 是稳定的 workflow projection，而不是 state 的复制或一个隐藏的 state machine：

```text
checkpoint          exact run/version and observed direct-fact identities
posture             ready | guide | confirm | hard-stop
root_cause          first bounded owner/fact that prevents the requested path
primary_action      exactly one ordered legal action with owner and human requirement
observations        ordered non-primary facts; never silent alternatives
continuation        nullable, only for an explicitly allowed human choice
protected_invariant nullable explanation for a hard-stop
evidence_summary    attributable artifact/review summary, never mutable authority
```

`primary_action` means a single next step in the dependency order, not a promise that a multi-gate journey
has only one future action. `observations` retains diagnostic evidence and nonblocking repair hints; a
choice is exposed only when the gate policy actually gives a human a choice.

观察输出的 compatibility contract 固定如下：

| Consumer | 保留内容 | 新增/收敛内容 |
|---|---|---|
| `status --json` | 当前 status/artifact summary 的兼容字段 | `workflow_inspection` 为 canonical posture/root/action projection |
| `state --json` | 原始 durable state、schema/recovery/debug fields | 同名嵌套 `workflow_inspection`；不得用 projection 覆盖 raw state |
| human-readable `status` / `state` | 各自面向人的上下文 | 从同一 `primary_action` 输出 next action，不自行 override |
| mutation owner | 既有 direct-fact revalidation | 不信任先前 inspection，写前仍重新检查 source/CAS/authorization/receipt |

Inspection 不缓存 verdict、不写 state/history/metadata、不开网络或 provider、也不触发 heal。任何需 schema
repair 的 read 都返回 owner-owned repair action；不能借 status/state observe 进行隐式 migration。

工作内容：

1. 为 HTML 新建、Image2 新建、resume、小改、结构变更、visual-slot refinement、migration/recovery 和 BUG-033
   单页迭代建立 canonical journey baseline 与 durable-state ledger。
2. 为每个 durable field 记录 direct owner、writer、reader、freshness/invalidation、是否可重建及 removal path；
   明确标出 generic node state、domain transaction、receipt/provenance、authorization 和 human decision 的不同。
3. 将现有 `status`、`state --json`、resume card 与 CLI diagnostic 的重复 next/completion 推导迁入 inspection，
   但保持 raw state 和 mutation-time guard 的独立 authority。
4. 用 BUG-033 的最小 fixture 验证每一个 claimed blocker 的 earliest direct diagnostic，不手改 state、authorization、
   receipt 或 PPTX。
5. 用 Interface-level negative tests 覆盖 prerequisite short-circuit、one primary action、wrong-owner no-mutation、
   same-check rerun、zero-write/zero-network inspection，以及 raw-state JSON compatibility。

**退出条件**：同一 canonical checkpoint 从 `status` 与 `state --json` 得到 byte-equivalent
`workflow_inspection`（允许各自外层兼容字段不同）；每个 durable field 已有 ledger；BUG-033 的有效 root cause
与 `guide|confirm|hard-stop` 分类均有证据；observe 路径在 fixture 中零文件写入、零 history 写入、零 remote call。

## Change 2: `simplify-workflow-control-and-interfaces`

**目的**：在 Change 1 已证明哪些事实可重建后，退休 generic node control，并将 caller-facing workflow
Interface 收敛到深 module；本 change **不**改 Image Production graph、目录、`image2-refinement` record 或
whole-page implementation 的物理 owner。

Change 1 ledger 是唯一删除依据。reconstructible generic node fact 停止新写；不可重建且跨 invocation 必需的
human intent 才可保留为最小 durable record，且 proposal 必须逐条写明 owner、writer、reader、invalidator 与
recovery story。provider authorization、target identity、receipt/provenance、CAS/journal/reset、cross-pipeline
transition 继续由既有 direct owner 持有，不属于 generic-control 删除集。

不要预先固化 `inspect/preview/produce/refresh/publish` 这类动词 catalog。Change proposal 必须先给出下表，
只保留能通过 deletion test 的 caller-facing Interface：

| 用户目标 | 唯一 workflow entry | 必须暴露的 identity/order/error facts | delegated direct owner | 人类 gate |
|---|---|---|---|---|
| create / resume / small refresh / structural change / recovery | proposal 中逐项填充 | 只填 caller 必须知道的事实 | 不复制 owner schema | `guide|confirm|hard-stop` |

一个 entry 若只是重命名一串 operation/flag/re-export，或删掉后 caller 无需重建复杂度，即为 shallow facade，
不得引入。`ppt_flow` 只 parse/dispatch/envelope；它不再自行成为 mode/gate/recovery evaluator。兼容 alias
只可作为期限明确的纯转发，不能复制逻辑或制造第二个 result schema。

为避免一个大迁移无从诊断，Change 2 在同一 OpenSpec change 内必须按以下 checkpoint 顺序提交并各自通过
focused regression；后一个 checkpoint 不通过，不进入下一个：

1. **Projection cutover**：所有 observe consumer 使用 Change 1 的 `workflow_inspection`，generic state 仍按
   原方式写入；比较新旧 canonical journey 的 posture/root/action。
2. **Writer retirement**：ledger 已证明可重建的 generic record 停止新写；已存在的受支持 record 只读兼容，
   direct owner 继续写自己的 authoritative record。每次 write 仍经 CAS/journal。
3. **Reader removal or explicit retention**：只有 ledger 证明某 reader 无受支持 caller 后才删除；否则将其列为
   compatibility reader，写明未来 retirement owner，而不是为了“减法”假装它不存在。

rollback 是 implementation/release rollback，不是对用户 state 做手工逆迁移：checkpoint 2/3 的每个 mutation
必须保留旧 state 的有效解析路径或在同一 atomic write 内完成可证明的 schema change。Change 3 的目录/record
migration 在本 change 中禁止开始，防止 bug 归因跨越两个 seam。

**退出条件**：正常 create/edit/resume 不依赖被退休的 generic node mutation；restart 仅凭 direct owners 与最小
durable facts 得到相同 `workflow_inspection.primary_action`；每个新的 workflow Interface 通过 deletion test，
并且没有 caller 重新拼接 mode/hash/authorization/recovery protocol；Image2 的目录、record key 与 bytes/path
行为仍与 Change 1 baseline 一致。

## Change 3: `realign-image-production-and-framework-governance`

**目的**：在 control seam 已稳定后，将 Image Production 从“Phase 4 optional refinement + Phase 5 whole-page
implementation”的错位状态调整为一个 capability family，并在 wire-preserving realignment 后删除没有 failure
story 的结构治理。

目标 graph 明确为：

```text
02-visual-system
  ├─ 03-html-production (html-only, html-then-image2)
  │    └─ 04-image-production / visual-slot (html-then-image2, requires current HTML delivery)
  └─ 04-image-production / whole-page (image2-only, final-page authority)

05-iteration: classify change -> invoke the selected current adapter; never owns production implementation
```

`04-` 是 capability taxonomy，不是 topological scheduler。canonical playbook index 必须以 explicit mode and
dependency predicates 决定 entry/resume；它不得从目录号或 `lifecycle_phase` 数字推断 HTML 是 whole-page 的前置。
`method_module` 若保留，只作分类/文档用途，不作为合法性或恢复的隐式排序 authority。

物理迁移分为有测试隔离的两个内部阶段：

1. **Wire-preserving realignment**：将 `workflow/04-image2-refinement/` 与
   `scripts/04-image2-refinement/` 改为 `04-image-production/`，并在其中放置 `whole-page` 与 `visual-slot`
   adapters；将现有 whole-page implementation 从 `05-iteration/legacy-image2/` 移入 whole-page adapter。
   `05-iteration` 仅保留 mode-aware iteration/compatibility routing。先验证 `ppt_flow` 命令/options/exits、
   stdout/stderr diagnostic、artifact bytes/fingerprints、provider load isolation、receipt/provenance、state/CAS/
   journal/recovery 与 markerless behavior 无变化，再清理旧路径。无永久 path shim；任何 intentional direct-path
   break 必须在 executable inventory、docs、diagnostics 和 tests 中显式列出。
2. **Durable-record and terminology cutover**：历史 visual-slot
   `nodes["image2-refinement"].by_version[...]` 以旧 schema 只读；首次成功的 state-owner mutation 将其规范化为
   新 Image Production visual-slot record，并在同一次 CAS state write 删除旧 record。observe 路径 new-first/
   old-fallback dual-read；两份 record 同时存在且语义不一致时 fail closed，promotion journal/active attempt/recovery
   均保持原子性。旧 reader 是有 owner 的 historical compatibility contract，直到未来明确停止支持旧 run bundle
   schema 的 change；本计划不设任意日期删除它。`image2-only` authorization、whole-page provenance 和 final
   delivery review 继续由现有 direct owner 持有，不能被合并成泛化 Image Production state。

之后才原子更新 main specs、entry docs、tests 与 architecture checks：以 `image-production` 作为长期 capability
主概念，保留 `visual-slot refinement` 作为 adapter 术语。active guidance 不得把 whole-page 叫作 legacy，或把
visual-slot 当作唯一 Image Production；允许的 legacy tokens 必须进入 exception inventory，逐项记录 token/path/
reason/owner/removal trigger。`image2-only` mode 和 `legacy-image2-first` normalized markerless pipeline identifier
是受保护的例外，不得被广泛替换。

治理收束只发生在上述 realignment 已通过 full regression 后：

1. 对每个 blocking architecture/coherence rule 记录 protected invariant 与真实 failure story；无法回答 admission
   的 exact tree/count/path-mirroring rule 删除或降为 advisory。
2. 保留 import direction、private implementation、provider-load isolation、production-data boundary 等可说明规则；
   用 Change 2 Interface/journey tests 代替只观察 private wiring 的 tests。
3. 收束 progressive disclosure：BOOTSTRAP 提供 intake/doctor/init/status；正常 Agent 不必读 state schema 或 direct
   executable，recovery detail 只由相应 hard-stop 链接。

**退出条件**：新 `image2-only` 可从 visual system 直接进入 whole-page adapter；`html-then-image2` 只能在 current
HTML delivery 后进入 visual-slot adapter；目录号不影响 graph legality；旧 visual-slot state、active attempt 与
promotion recovery 可读且新写单一；active docs/specs/tests 只在 exception inventory 允许的位置保留旧词；每条
blocking rule 有 failure story；完整 tests 继续覆盖所有 protected invariants。

## 串行原因

Change 1 建立无副作用的 observation seam，给 Change 2 的删除决策提供证据。Change 2 改写 workflow control 和
caller Interface，但冻结 Image Production 的 physical/durable wire，因此任何回归可归因到 control cutover。
Change 3 在该 seam 已稳定后再改 graph、目录和 compatibility record，随后才删治理噪音。三个 change 各有一个
可比较的外部行为合同，既保留诊断能力，也不额外支付 proposal/apply/archive 成本。
