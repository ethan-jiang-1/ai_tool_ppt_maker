# Plan: 活跃 bug triage 之后，四个 OpenSpec change

> 类型: 设计 / 分析 | 更新: 2026-08-20（四 change 名与进度表 final）
>
> 范围: 原 `_backlog/bugs/` BUG-073…092。个数、名字、scope、goal **已 final，不再改 packing**。
> 每个 change 的流水线：propose → polish 到 apply-ready → apply → archive。不跳步。

## 进度

每个 change 独立滚完再开下一个。当前滚 Change 4。

### Change 1 `restore-draft-and-cli-projections`（073, 074, 078, 079, 085）

- [x] propose
- [x] polish 到 apply-ready
- [x] apply
- [x] archive
- [x] 对应 bug 卡移入 `_fixed_bugs/`

### Change 2 `project-cursor-to-owner-checkpoint`（088）

- [x] propose
- [x] polish 到 apply-ready
- [x] apply
- [x] archive
- [x] BUG-088 移入 `_fixed_bugs/`

### Change 3 `reset-unproduced-v1`（081）

- [x] propose
- [x] polish 到 apply-ready
- [x] apply
- [x] archive
- [x] BUG-081 移入 `_fixed_bugs/`

### Change 4 `bind-image2-transport-capability-vector`（090）

- [ ] propose
- [ ] polish 到 apply-ready
- [ ] apply
- [ ] archive
- [ ] BUG-090 移入 enhancement 完成处；092 A 路关闭保持悬挂 B 路

## 背景 / 现状

20 条现场痛来自同一张 deck 的第一次 Pure 旅程。Maintainer 于 2026-08-20 确认四道产品题：

1. **CLI 给 Agent 看。** Purpose/Outcome/Next 仍由 Agent 投影，不推翻 `harness-charter` 的 machine schema。
2. **081 做 enhancement。** 未生产 v1 的显式 reset 另开 change，不塞进 bugfix。
3. **090 做 enhancement。** 能力矢量另开 change；禁止 `_scratch/` → PPTX。
4. **091 保持 deck-local。** PAGE CLASS OVERRIDE 不升成 Harness validate。

## 为什么是 4 个，不是 3 也不是 2

按 **load-bearing HOW** 切，不按「还剩几张卡」。

| # | 名字（final） | 这一份 HOW | 相对现行 spec | 吸收 |
|---|---|---|---|---|
| 1 | `restore-draft-and-cli-projections` | 机器面是 owner 的投影：不得发明更重的类别，也不得另写一套 Next | **恢复**已有契约 | 073, 074, 078, 079, 085 |
| 2 | `project-cursor-to-owner-checkpoint` | 耐久 cursor 是 image2 owner checkpoint 的投影，不是单向 ratchet | **改** `node-specification`（2026-08-19 写进去的 monotonic fail-closed） | 088 |
| 3 | `reset-unproduced-v1` | 未生产 v1 的 owner 原子 reseed | **新** admission / 不可逆证据 hard-stop | 081 |
| 4 | `bind-image2-transport-capability-vector` | Image2 profile 的 transport 能力矢量 | **新** persisted 契约；现行 `operation` 是 `page-image-reference-generation`，不是 HTTP generations/edits | 090 |

**不是 3：** 上次把 088 塞进「修现行契约」是错的。现行 spec 明确写：checkpoint 只能单调向前，落在 cursor 后面就 fail-closed。088 要改这条 invariant，是独立的 architecture 决策。和「给 `style-master inspect` 注册 `--json`」不是同一份 HOW。

**不是 2：** Q2/Q3 已拍，081 与 090 不进 bugfix，彼此也没有共享 invariant。要少一个 OpenSpec 周期，就**延期** 3 或 4，不要粘。

**不是 5：** 073/074/078/079/085 共用同一条问责：CLI / inspection 不得另编故事。拆开会变成 change 膨胀。

实施顺序：1 全部 archive 后再开 2；3 与 4 在 1–2 之后各自独立，互不粘。流水线对每个 change 相同：propose → polish → apply → archive。

---

## Change 1 — `restore-draft-and-cli-projections`

**Goal：** 合法 draft、错误 target、init/status/inspect 都只投影现行 owner 事实；不再把 draft 报成 protocol 损坏、把 deck root 报成 binding 损坏、或另写一套 Next。

**Kind：** bugfix（实现偏离现行 spec）。

**吸收：** 073, 074, 078, 079（只修 Next 单源）, 085（只修 status Next）。

**Capabilities：** `run-bundle-management`、`workflow-inspection`、`cli-surface`。  
**Run-bundle：** `none`。  
**Policies：** `human-centered-gates.md`（错误类别不得伪装成更重的 hard-stop）、`simple-reliable-control.md`（Next 复用 inspection，不第二套路由）。

### In scope

| ID | Goal（可验收） | 锁住的 HOW |
|---|---|---|
| 073 | `--check <deck-root>` 不是 `harness_binding_invalid`；`--check <v1>` 仍走现行 binding hard-stop | 先认 target 是精确 `3_versions/vN`（CONSTITUTION 已写）。非 run-dir 用**现有** `usage` / `CLI_ERROR_CODES.USAGE`，文案点出 `3_versions/vN`。不新发明 reason.kind。不教 `deckRoot()` 接受 deck root。 |
| 074 | `source.workflow ∈ {framed,pure}` 且本 version **没有** `production_identity.by_version` 条目时，inspection/state 不是 `current-protocol-invalid`，而是现行 narrative / paginate-apply owner | 谓词只看「无 identity」。这就是 `workflow-inspection` / `pipeline-orchestration` 已写的 *declared fresh authoring draft without current production identity*。实现今天只把 `workflow` 未选当成 draft。 **不要**再加「无 provider 证据」——那是 Change 3 的 admission。无 identity 却已有 provider/delivery 证据，仍走现行 protocol hard-stop。 |
| 078 | `style-master inspect --json` 不是 USAGE | 给该命令注册 `--json`。默认仍是 JSON（Q1）。`--json` 与默认是同一 owner result 的 JSON renderer（`cli-surface`：text/JSON 两渲染器不得各自推导事实）。不加新手文案默认。 |
| 079 | `ppt_flow init` 与 `bundle_layout --init` 成功后 Next **同一句** | 用 init 已有的句子：`Next: ppt_flow.mjs status <v1Path>`，`v1Path` 即已创建的 `3_versions/v1`。CONSTITUTION 已说 `--init` 不是第二条 public startup。不写「先喂上游 / 进度地图」。 |
| 085 | `status` 在 Style Master / Image2 中游仍有 Next | 消费已有字段 `workflow_inspection.primary_action`（`state --json`、AGENT_CONTRACT、COMMANDS.md 已用）。人类 `status` 与 `status --json` 的 next 同源。不另写 build/refresh 步骤表。不改 `build` 成功文案。 |

### Out of scope

088 cursor、081 reset、090 transport、Gate 白话、价目、framed/pure 小白解释、PAGE CLASS 闭集、改 `known_failure` exit 0、把 `--check` 改成接受 deck root。

### Done when

- deck root `--check` → usage，指向 `3_versions/vN`；真 run-dir 的 binding 失败仍是 binding。
- 已选 `framed\|pure`、identity 空、无 identity 的 draft → narrative/paginate，不是 protocol repair。
- 两条 init 入口 Next 字节级同一句 `ppt_flow.mjs status <v1Path>`。
- `status` Next 来自 `primary_action`，覆盖 style-master / image2。
- `style-master inspect --json` 接受且输出一份注册 JSON。

---

## Change 2 — `project-cursor-to-owner-checkpoint`

**Goal：** 每次成功的 image2 mutation 之后，耐久 `current_node` 等于 owner 当前 checkpoint（可前可后）；attempt / grant / receipt 不可变；owner 已落盘而 cursor 投影失败时，结果是已有的 `partial-effect`，不是 `internal`。

**Kind：** spec 修订（triage 仍叫 bug：ratchet 把 owner 权威让给了 cursor）。现行 `node-specification` 写死：只单调向前；checkpoint 在 cursor 后面 fail-closed；handoff **只**从成功的 image2 mutation 调用。

**吸收：** 088。

**Capabilities：** `node-specification`、`cli-surface`（只为 `partial-effect` 分类，契约已存在）。  
**Run-bundle：** `compatible`（cursor 投影规则变；attempt/grant 字节不变）。  
**Policies：** `agent-assistance-and-control.md`（恢复走唯一 owner action；Agent 不手改 state）。

### In scope

- `recordTargetProgressiveCheckpointCliHandoff`：把 `current_node` 投影到 owner checkpoint，允许后退。
- 后退只改 cursor 与该 checkpoint 的 `in_progress`（`waiting_for` 仍跟 owner）。不把后面的 `in_progress` 标成 `completed`，不 un-complete 已完成节点，不删 attempt / grant / receipt / history。
- 未知或未声明的 checkpoint 节点仍 fail-closed。
- 作用面 = 现行 spec 已限定的 **image2 mutation path**。本 change 不把 handoff 扩到 style-master。
- image2 owner 写入已成功、随后投影失败 → `partial-effect`（已有分类：delivery 与失败的后续 effect 分列），不得 `internal` / `report_internal`，不得暗示 owner 写入已回滚。

### Out of scope

Change 1 的诊断/Next、081 reseed、090 transport、改 `known_failure` 语义、Pilot 全失败的 item 级恢复（087 已悬挂）。

### Done when

- 全失败 Pilot 或源重写后的 `image2 plan`：cursor 落在 inspection 的 checkpoint（如 `plan_progressive_pilot`），而不是卡在 `generate-…` 并 CONFLICT。
- 已落盘的 plan/attempt 不因投影失败变成 `internal`。
- 历史 evidence 字节不变。

---

## Change 3 — `reset-unproduced-v1`

**Goal：** Deck Author 明确要求时，owner 可以原子放弃「已 paginate apply、但零不可逆副作用」的 v1 页面结构，并继续把同一 v1 当唯一草稿；一旦存在不可逆证据，同一操作 hard-stop，bytes 不变，仍走 vNext。

**Kind：** enhancement（Q2）。现行 `slide-identity-and-ordering` 把首次非 seed 的结构发布定为 vNext，这是刻意边界，不是缺陷。

**吸收：** 081。

**Capabilities（propose 时再定精确 delta，本 plan 只锁目标）：** `cli-surface`、`slide-identity-and-ordering`、`node-specification` / narrative-authoring（以届时 main spec 为准）。  
**Run-bundle：** 新 mutation；无自动迁移。

### In scope

- 仅 `v1`。
- Admission 必须全部成立：identity 可解析；无 grant / submit / attempt / 费用 / unknown commit；无 raw / final / PPTX / delivery evidence；人明确要求放弃当前未生产结构。
- Owner 一次做完：清可重建 derived、清非外部副作用 state、重建 authoring draft 或原子绑定新的 exact Page Source；source / receipt / identity / lease / Controller 一致。
- 回执证明没有删除不可逆 provider/decision 记录。
- 任一不可逆证据 → hard-stop + 保持 bytes + 继续要求 vNext。

### Out of scope

- 折进 Change 1/2。
- Agent 手改多文件当正式路径。
- 已有 provider 证据的 v1 原地改页数。
- 命令名、flag、精确 CLI 字形（那是 propose/design 的 HOW）。

### Done when

- 零不可逆证据的 v1，显式 reset 后可以再次以 `target_run_version: v1` materialize 新页数。
- 一旦有 attempt 或其他不可逆记录，同一操作拒绝且全树字节不变。

088 rewind **不能**代替本 change：cursor 退回 plan 之后，`paginate plan` 仍因 source receipt 给出 `publication: next-version`。

---

## Change 4 — `bind-image2-transport-capability-vector`

**Goal：** 选定的 Image2 profile 声明 transport 能力矢量（operation / encoding / size / sync-async），compiler、preflight、authorize、transport 绑同一份矢量；未声明组合在零远端拒绝。当前已声明的 `generations` + `2000x1125` 仍是合法组合。

**Kind：** enhancement（Q3）。现行 profile 对已声明的 generations 契约是完整的。Packy `edits` / multipart / 尺寸是新需求。现行 spec 里的 `operation` 是 Harness capability `page-image-reference-generation`，不是 HTTP 动词。

**吸收：** 090。092 的 A 路（官方 generate → receipt → build）随本 change 关闭；B 路 `_scratch/` → PPTX 保持拒绝。

**Capabilities（propose 时再定）：** `image-generation`，以及它要求的 profile/schema/cli 表面。  
**Run-bundle：** 新 profile 字段；旧 generations 组合兼容。

### In scope

- Profile 能表达：HTTP operation（至少 generations vs edits）、编码（JSON vs multipart）、尺寸规则、sync vs async。
- 同一矢量贯穿 compile / preflight / authorize / transport。
- 未声明组合：零远端、明确类别、不打到 provider。
- 不把任何 vendor 名字写进 schema。
- 保留现有 generations 路径。

### Out of scope

- `_scratch/` PNG 写入 `_generated/` 或冒充 delivery。
- 为一家 vendor 写死 endpoint。
- 折进 Change 1/2/3。
- 改 prompt 计量字段（089 已悬挂：量的是 inspection.`prompt` 不是 `compiled_provider_input.utf8`）。

### Done when

- 声明 `edits + multipart + native size` 的 profile，transport 的 endpoint/编码/尺寸与矢量一致，能进正式 receipt chain（用假 profile / mock transport 也可证，不绑 Packy 名字做断言）。
- 未声明组合在零远端被拒。

---

## 已关闭 / 悬挂

| ID | 去向 |
|---|---|
| 077 | `_fixed_bugs/` already implemented（linter 已执法） |
| 075, 080, 082, 084, 086 | [`_suspended_bugs/`](../_done/_suspended_bugs/README.md)（CLI 保持 Agent 机器面） |
| 076 | [`_suspended_bugs/`](../_done/_suspended_bugs/README.md)（三层表不是 DAG） |
| 083 | [`_suspended_bugs/`](../_done/_suspended_bugs/README.md)（不编价目表） |
| 087 | [`_suspended_bugs/`](../_done/_suspended_bugs/README.md)（by design；Change 2 才处理全失败后的 cursor/internal） |
| 089 | [`_suspended_bugs/`](../_done/_suspended_bugs/README.md)（量错了 inspection.`prompt`） |
| 091 | [`_suspended_bugs/`](../_done/_suspended_bugs/README.md)（PAGE CLASS OVERRIDE 留 deck-local） |
| 092 | [`_suspended_bugs/`](../_done/_suspended_bugs/README.md)（不开 scratch→PPTX；官方路径等 Change 4） |

## 风险 / 取舍

| 风险 | 缓解 |
|---|---|
| Change 2 rewind 被理解成删历史 | goal 写死：只移动 `current_node`；attempt/grant/receipt 不可变 |
| Change 1 的 status Next 再写一套表 | 必须消费已有 `workflow_inspection.primary_action` |
| 为了「少一个 change」把 2/3/4 粘进 1 | 禁止。要少就延期 3 或 4 |
| 074 带上「无 provider 证据」把 081 偷运进 bugfix | 禁止。无 identity 是 draft；有 identity 无副作用是 Change 3 |

## 落地关联

1. 名字与 packing 已 final。进度表在文首，完成一步勾一步。
2. 每个 change：`openspec new change` → polish 到 apply-ready → apply → archive。
3. 本 plan 在四个 change 都 archive 后移入 `_closed_plans/`。
