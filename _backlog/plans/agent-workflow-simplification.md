# Plan: Agent 工作流控制面的减法重构

> 类型: 架构审视 / 简化路线 | 更新: 2026-07-22 | 状态: 活跃 | 建议: 当前 production-mode change 完成后，4 个 OpenSpec change 严格串行

## 结论

框架不是整体都“过分复杂”。真正复杂的生产问题仍然需要严格实现：稳定 `slide_id`、版本发布、
canonical bytes/hash、远端调用授权、CAS/atomic write、journal recovery、receipt/provenance 和
`_generated/` owner 都保护了真实的不变量，不应为了代码量好看而删除。

过度复杂集中在 **Agent 面向的控制面**：同一工作流事实被 Markdown controller、通用 node state、
domain-specific review/transaction state、`status`、`state --json` 和 CLI command routing 多次表达。
结果是框架虽然有单一 `ppt_flow` 入口和 Phase `index.mjs`，Agent 仍需理解实现协议、拼接 hash/flag、
辨认多个“下一步”投影。这个控制面没有做到 policy 要求的：

```text
direct fact -> one deterministic check -> earliest root cause
  -> one legal next action -> rerun the same checkpoint
```

本计划的目标不是重写渲染器，而是让 **Agent 负责意图、创意判断和用户沟通；深 module 负责机械推进、
状态写入与恢复**。每删除一层控制，都必须保留或加强身份、完整性、授权和可恢复性。

## 评审范围与依据

本结论基于 2026-07-22 当前 working tree，而非仅基于 `HEAD`。当前
`add-production-mode-and-image2-primary` 尚在进行（25/34 tasks），相关未提交修改也纳入了现状评审。

依据包括：

- `openspec/policies/simple-reliable-control.md`
- `openspec/policies/agent-assistance-and-control.md`
- `openspec/policies/human-centered-gates.md`
- `PPTMAKER_FRAMEWORK/BOOTSTRAP.md`、`charter/`、`playbook/`、`COMMANDS.md`
- `PPTMAKER_FRAMEWORK/scripts/` 的 public interface、state、CLI、contracts 和代表性生产路径
- `openspec/specs/` 中 CLI、node、playbook、pipeline、layout 等现行规格
- `tests/`、`tests_e2e/` 的结构治理和 journey coverage

此次没有把 `deck_*` 或 `dpt_*` 当作框架源码读取。

## 现状诊断

### 1. 通用 node state 与真实 domain transaction 是双轨控制

`charter/NODE-SPEC.md` 定义了 `current_node`、五态 node、typed evidence/decision、entry/exit condition、
execution 和 playbook stack；但生产调用关系显示：

- `setNodeEvidence` 只被 state 自身与测试引用；
- `setNodeDecision` 没有生产 caller；
- `startPlaybook` 没有正常 create/edit CLI caller；
- `checkEntry`、`checkExit`、`getEligibleNextNodes` 主要服务 resume 投影和测试；
- HTML review、Image2 final review、provider authorization、migration confirmation 和 refinement 各自通过
  domain-specific writer 推进，部分路径直接改 `current_node`。

这意味着 controller 文档描述了一套通用状态机，真实命令又执行另一套专用协议。Agent 被要求维护的
部分 node/evidence 不是 runtime truth，domain writer 才是真正的 authority。继续补 node 同步只会制造
更多 dual write、heal 和 drift。

**建议方向**：以 domain-owned checkpoint 为权威，退休通用 per-node durable FSM。只有审计证明无法从
直接 authority 重建、且跨 invocation 必须保留的 intent/cursor 才可留下一个最小记录；不得默认保留
整套 node working set。

### 2. “下一步”至少被推导三次

HTML 的 `buildHtmlResumeGuidance` 已经是正确样板：它返回 `guide|confirm|hard-stop`、一个推荐命令、
可选 continuation、protected invariant 和 evidence completeness。

但其外层仍有重复决策：

- `state.mjs::buildResumeCard` 根据 node、artifact count、mode 和 refinement 再生成 `suggested_next`；
- `ppt_flow.mjs::enrichStatusWithState` 消费 card 后又覆盖 refinement/completion；
- `ppt_flow state --json` 再做一轮相似覆盖；
- `projectModeCompletion` 又独立描述完成条件和 missing action。

同一 fact 因 caller 不同可能走不同分支；修复一个 evaluator 不能保证所有入口一致。它违反 one truth
path，也迫使 Agent 判断哪个 `next` 更权威。

**建议方向**：提升现有 HTML guidance 形状为全 workflow 的唯一 inspection result。`status`、`state`、
human-readable output 和 JSON 只做 adapter，不再各自推导动作。

### 3. 名为 deep interface，实际 public surface 仍然很宽

当前规模信号：

| 表面 | 当前量级 |
|---|---:|
| `ppt_flow` 顶层命令 | 15 |
| `ppt_flow` options | 79 |
| `state.mjs` exports | 70 |
| `bundle_layout.mjs` exports | 94 |
| Phase 3 / 4 / 5 `index.mjs` exports | 21 / 26 / 28 |
| framework script `.mjs` | 约 33,900 行 |
| `ppt_flow.mjs` / `state.mjs` | 3,744 / 2,336 行 |

Phase `index.mjs` 解决了 import 路径秩序，但多数仍是 operation/re-export catalog。caller 需要选择大量
细粒度函数、理解 ordering 和 record shape，interface 与 implementation 接近同样复杂，属于浅 module。

**建议方向**：按 caller goal 形成少数深 interface，例如 inspect、preview、produce、refresh、publish
decision；stage/helper 留在内部。不要为了“统一”再加一个只转发全部旧函数的 facade。

### 4. Controller 把方法论拆成了机械微步骤

当前 playbook 有 62 个 node、109 个显式 MD/CLI/GATE step、29 个 GATE；仅 `create-deck` manifest 就有
27 个 node。若 node 只是帮助 Agent 定位，数量本身不致命；但它们还承担 durable status、requires、
entry/exit、evidence、decision enum 和全局唯一性，控制成本已接近生产工作本身。

尤其是“运行 producer -> 读 state -> 找 plan hash -> 运行 publisher -> 再记录 node evidence”这类步骤，
把 module implementation 泄漏给 Agent。它没有增加创意判断，只增加协议遵循。

**建议方向**：controller 只保留 task routing、创意/语义判断、真正的人类决定和异常 handoff。正常机械
步骤由 command 完成，并在同一结果里返回当前 artifact、决策姿态和唯一下一动作。对基于同一组 artifact、
没有独立下游语义的连续 gate，按 gate burden 评估是否合并；不得机械地把每个 phase/node 变成确认点。

### 5. 结构治理保护了过多“形状”，而不全是运行不变量

`framework_architecture.mjs` 同时约束 import direction 和 provider isolation，也固定 scripts root
whitelist、exact Phase adjacency、direct executable inventory、public shared path、test owner 目录和完整
ownership manifest。前一类能阻止真实耦合/越权，后一类有些只是当前文件树偏好。

结构偏好被写成 fail-closed runtime-like contract 后，每次正常重构都要同步 checker、manifest、spec、docs
和 tests。质量控制开始比被验证的移动/重命名更复杂。

**建议方向**：保留依赖方向、private import、provider load isolation、production-data fixture 禁令等有失效
故事的规则；删除 exact count、exact tree、机械 test mirroring 等无法指出真实故障的 blocking rule，或降级
为维护建议。

### 6. 文档入口仍要求 Agent 学习内部控制词汇

`BOOTSTRAP`、`AGENT_CONTRACT`、`NODE-SPEC`、`WORKFLOW`、`COMMANDS`、playbook 和 run-bundle guide
重复讲 state、gate、receipt、journal、projection、reset、mode/pipeline。严格词汇有价值，但正常 Agent
不应先学习 schema v4、reserved node、journal 字段或 direct executable 才能做 deck。

**建议方向**：`BOOTSTRAP + status` 构成 progressive disclosure 入口。正常路径只显示当前任务、真实产物、
需要的人类决定和下一动作；schema/recovery 细节只在对应 hard-stop 或维护文档中展开。

## 必须保留的边界

以下内容不因简化而降级：

1. `slide_id` 稳定身份、position 仅为快照顺序。
2. 结构编辑 preview + exact plan hash + clean vNext publication。
3. canonical path、bytes、hash、receipt、provenance 和 notes/render lineage。
4. provider submit 的显式、scope-bound 授权；未知 submit 不盲重试。
5. CAS、atomic write、single writer、journal/reset recovery 和 no-replace publication。
6. `_generated/` 只由 owner 重建，绝不手改。
7. `guide|confirm|hard-stop` 及不可 waiver 的 protected invariants。
8. source pipeline 与 version-scoped production intent 的清晰所有权。

简化的验收标准不是“少校验”，而是 **同一不变量只有一个 owner/evaluator，其他表面只消费其结果**。

## 目标形态

```text
User intent / creative work
          |
          v
 concise task playbook (routing + judgment only)
          |
          v
 inspectWorkflow(run, intent?)
          |
          +--> direct domain owners/evaluators
          |      source / mode / artifact / review / auth / transaction
          |
          v
 one checkpoint result
 { posture, artifact, root_cause, human_decision?, next_action }
          |
          v
 existing owner command executes one legal action
          |
          +---- rerun the same inspection checkpoint
```

`inspectWorkflow` 是 projection/composition module，不拥有新 state、不缓存 pass/fail、不复制 domain schema。
删除它后，caller 会重新承担组合逻辑，因此它应是深 module；domain writer 仍各自拥有 mutation。

## 落地顺序

### 前置：完成并稳定当前 active change

先完成 `add-production-mode-and-image2-primary` 的剩余任务、strict validation 和回归，使三模式权威模型
有一个稳定基线。不要在当前未完成 change 内夹带本计划的大规模删除。

同时暂停创建 `add-versioned-production-mode-transitions`。`production-mode-system.md` 原建议两个 change
紧邻执行；本计划把控制面简化插在两者之间，避免双向 transition 继续复制当前 state/controller 协议。

### Change 1: `unify-workflow-inspection`

**目标**：先统一观察，不改变写入语义。

1. 选定 canonical journeys：HTML 新建、Image2 新建、断点恢复、小改、结构重排、HTML/Image2 refinement、
   migration/recovery；记录每条路径的命令数、authority hops、state writes、human gates 和 failure branches。
2. 建 durable-state ledger：每个字段列 owner、writer、reader、freshness/invalidation、删除路径，并标记为
   `irreplaceable | reconstructible | compatibility | unused`。
3. 建一个 read-only workflow inspection module，直接组合现有 owning evaluators，返回封闭 checkpoint result：
   `posture`、bounded root cause、artifact/evidence summary、exactly one `next_action`、nullable continuation、
   `requires_human`、protected invariant。
4. HTML guidance 迁入/成为该 module 的 domain evaluator；`status`、`state --json`、plain output 共用同一结果。
5. 删除 `enrichStatusWithState`、`buildResumeCard` 外围的重复 next/completion override；暂保 legacy 字段为同一
   result 的兼容投影，禁止独立推导。
6. 用 interface-level negative tests 覆盖 prerequisite short-circuit、bounded root cause、same-check rerun、
   fail-closed 和 wrong-owner no-mutation。

**退出条件**：任一 canonical journey 在任一点调用 `status` 与 `state --json` 得到同一 posture/root/next；
同一 fact 只有一个 evaluator；inspection 零写入；旧 CLI behavior 仍由 compatibility tests 覆盖。

### Change 2: `retire-generic-node-control`

**目标**：消除 Markdown node FSM 与 domain transaction 的双轨状态。

1. 以 Change 1 ledger 证明哪些 node facts 可从 source/artifact/domain record 重建。
2. 新写路径停止持久化 reconstructible `current_node`、node status、agent evidence、generic gates 和 stack snapshot；
   保留真正不可重建的 human decision、waiver、provider authorization、transaction ownership 和 accepted receipt。
3. 若确有跨 invocation 且不可推导的用户 intent，只设计一个最小 `active_intent` record，明确 owner/invalidator；
   不把旧 node FSM 换名重建。
4. Controller Markdown 改为非持久化 task guide：目标、可编辑 source、真实 review artifact、人类决定、异常路由。
   create-deck 按 mode 路由到短 journey，不再把三个 mode 的所有机械节点放进一个 27-node working set。
5. legacy state 采用 one-way `dual-read / single-write` 迁移；旧 node 字段只读兼容一段明确窗口，新 writer
   不再回填。无法安全归属的 transaction/human decision 继续 hard-stop，绝不猜测。
6. 删除无生产 caller 的 generic setter/condition/manifest validation 及只验证内部 node 转移的测试；用
   canonical journey tests 和 domain checkpoint tests 替代。

**退出条件**：正常 create/edit/resume 不依赖通用 node mutation；restart 后仅靠 direct authority 和最小
durable facts 得到同一 next action；state schema 中无 owner/invalidator 不明字段；旧状态迁移可重复且不丢失
human authorization/decision。

### Change 3: `deepen-production-interfaces`

**目标**：让 module 和 CLI 按 Agent goal 提供 leverage，删除 pass-through surface。

1. 对 `state.mjs`、`bundle_layout.mjs`、Phase 3/4/5 index 和 direct executables 做 deletion test；按 caller goal
   设计两套候选 interface，再以 depth、locality、test surface 比较后选择。
2. 将 init/version scaffolding、HTML production、whole-page Image2、refinement、structural publication 各自收敛
   为少数 cohesive operations；stage/helper/export alias 变为 implementation detail。
3. `ppt_flow` 保留用户/Agent 能理解的 task verbs；把 `state` 的 mutation option bag 收回 owner command，
   maintenance/debug action 与正常 task path 分开。兼容 alias 只转发并发出 bounded deprecation，不复制逻辑。
4. command 接受 workflow inspection 给出的 opaque action identity 或从 direct authority 重新派生 exact identity；
   Agent 不再从 JSON 内提取 hash 后手工拼协议，writer 仍必须在 mutation 前重新验证 current identity。
5. root CLI 只做 parse/dispatch/envelope；mode、gate、recovery 和 completion 分支留在 deep modules。
6. interface tests 替代浅 module unit-test layering；旧 wrapper 测试随 wrapper 删除。

**退出条件**：public interface 明显缩小且没有转发 facade；一个 canonical task 只跨一个外部 seam；
`ppt_flow.mjs` 不再拥有 domain pass/fail；Agent 正常路径不需调用 direct stage executable 或理解 state schema。

### Change 4: `simplify-framework-governance`

**目标**：让文档、spec 和 architecture checks 保护行为，而不是固化偶然结构。

1. 对每个 blocking architecture/coherence rule 写 failure story 和 protected invariant；答不出 policy 的五个
   admission 问题则删除或降级为 advisory。
2. 保留 import direction、private implementation、provider load isolation、production data boundary 等真实规则；
   重新评估 exact root whitelist、exact executable inventory、mandatory test-owner manifest 和目录镜像。
3. 删除被深 interface journey tests 覆盖的内部结构测试，避免 source move 同时修改 checker + manifest + spec + test。
4. 重写 progressive disclosure：`BOOTSTRAP` 只保留 intake、doctor/init、`status`；contract 只讲 ownership/
   hard boundaries；command grammar 来自 CLI help/spec，不在多份 Markdown 复制；recovery 细节按需链接。
5. 合并/删除已无 runtime authority 的 NODE-SPEC/controller 文档和 specs；保留 domain spec，避免把实现步骤写成
   SHALL requirement。
6. 在 OpenSpec template/review 中执行 policy admission：新增 gate、field、validator、retry、controller step 必须
   指出删除/合并了什么，否则 change 不进入实现。

**退出条件**：质量控制代码/规格对 canonical journey 的解释短于生产路径；移动 private 文件不触发无关
合同变更；新 Agent 从 bootstrap 到准确 next action 不需读取内部 schema；全量 tests 仍覆盖所有 protected
invariants。

## 量化基线与目标

Change 1 先生成可复现 baseline，后续 change 以 journey 指标验收，不以总代码行数作为主目标。

| 指标 | 当前信号 | 目标 |
|---|---:|---|
| 同一 checkpoint 的 next-action 推导位置 | 至少 3 | 1 |
| 正常 resume 需要选择的权威投影 | `status` / state card / HTML guidance 等 | 1 个 checkpoint result |
| generic node evidence/decision 的生产 caller | 接近 0 | 删除 generic surface，或每个保留项有真实 caller |
| create-deck controller nodes | 27 | 只保留不可自动化的 task checkpoint；目标不超过 8 个持久/人类 checkpoint |
| state durable fields | 未建完整 owner ledger | 100% 有 owner/writer/reader/invalidation/removal |
| 同一事实的 evaluator | 多处 | 1 owner，N 个无逻辑 adapter |
| canonical journey 的人工 hash/flag 搬运 | 多处 | 0；opaque action 或 writer rederive |
| architecture blocking rule | 结构与不变量混合 | 100% 有 protected invariant + failure story |

代码行、文件数和 export 数作为辅助趋势：只有在 interface 变深、journey 变短、测试仍覆盖不变量时，删除才算
成功。反过来，新增 facade 后旧 interface 全保留不算简化。

## 验证矩阵

每个 change 至少覆盖：

1. Fresh HTML-only 从 init 到本地 final review。
2. Fresh Image2-only 从 init 到授权、pilot、build、notes、final review。
3. HTML-then-Image2 的 current delivery、授权 refinement、candidate decision、renewed final review。
4. 小范围 text/visual/notes refresh，只刷新真正 stale 的 owner artifacts。
5. Structural preview/hash/apply/clean-vNext/materialization。
6. Migration prepare/author/preview/confirm/apply 与 mode registration recovery。
7. crash/restart、stale hash、CAS race、journal/reset、unknown submit、missing authorization。
8. old state/run bundle compatibility：migration 幂等、原 bytes 可归属、无 silent fallback。
9. `status` plain/JSON 与 owning command failure envelope 对同一 root cause 给出同一 nearest action。
10. tests 明确证明 inspection 不写 state，错误 recovery 不修改 wrong owner。

## 风险与缓解

- [风险] 删除 node FSM 后丢失断点信息。  
  [缓解] 先做 durable-state ledger 和 restart journey；只有可重建 facts 才删除，不可重建 intent 进入最小记录。

- [风险] 简化误删安全 gate。  
  [缓解] 每项删除先分类 `guide|confirm|hard-stop` 并写 protected invariant；identity/integrity/auth/recovery 不降级。

- [风险] 新 inspection module 变成第二 authority。  
  [缓解] module read-only、无 cache/state、只调用 owning evaluator；writer mutation 前仍重新验证 direct fact。

- [风险] 兼容层永久存在。  
  [缓解] 每个 alias/legacy field 带 removal change、唯一 reader 和明确窗口；single-write 新格式，不 dual-write。

- [风险] 大重构与 active production-mode change 相互污染。  
  [缓解] 先归档当前 change，再逐 change 串行；每一步保持 main specs/runtime truth 一致。

- [风险] 只追求 export/LOC 下降，形成巨型不可测函数。  
  [缓解] depth 以 caller leverage 和 interface test 为准；允许 deep module 内部有 private seam，不把内部 seam 暴露给 caller。

## 非目标

- 不在本计划中提升 HTML 视觉质量或实现 HTML style-master。
- 不把 whole-page Image2 与 visual-slot refinement 合并成一个 renderer。
- 不取消版本身份、provider authorization、receipt/provenance、CAS/journal/reset。
- 不把所有 domain state 塞进一个通用 workflow engine。
- 不一次性改写所有 specs/tests/docs；每个 change 先稳定 interface，再删除旧表面。
- 不手改任何 `deck_*`、`dpt_*` 或 `_generated/` 数据来证明框架设计。

## 落地关联

建议 OpenSpec 串行顺序：

```text
finish add-production-mode-and-image2-primary
  -> unify-workflow-inspection
  -> retire-generic-node-control
  -> deepen-production-interfaces
  -> simplify-framework-governance
  -> re-plan add-versioned-production-mode-transitions on the new interface
```

每个 proposal 必须引用三份 policy，并明确列出：新增了什么、删除了什么、哪个 direct owner 仍是 authority、
哪条 canonical journey 变短、哪项 protected invariant 由 focused negative test 保证。
