# Findings III: CLI 优化的影响面（Blast Radius）测算

> 挖掘日期: 2026-08-16（working-tree HEAD = d2df02b）
> 回答: “CLI 该优化，那优化的影响面有多大？影响面越小越容易优化——先做哪个？”
> 姊妹篇: `cli-dependency-and-cli-design-audit.md`（历史+设计）、
> `cli-agent-ergonomics-and-optimization-space.md`（体验摩擦）、
> `cli-command-split-design.md`（拆分设计）。
> 方法: 对 repo 内每个命令形态做 grep 触点计数 + 枚举项目自带的“命令面治理机制”。
> 未读 `_backlog/` 内容；未改任何代码。

---

## 0. 结论速览

1. **影响面不是均匀的，分三档**：不改命令面的优化（帮助/文档/加 flag）≈ 个位数文件；
   改命令面的拆分 ≈ 每刀 15–40 个文件；全量重构 ≈ 80–110 个文件。**先做零档和一档，再按
   手术顺序做拆分，影响面完全可控。**
2. **拆分有两个出乎意料的好消息**：
   - production Controller（Agent 真正照着执行的东西）对“非生命周期业务”的拆分**几乎零
     敏感**：`artifact-view` 在 playbook 中 0 处、`validate-state`/`repair` 0 处、`doctor`
     3 处、narrative-plan 3 处、probe 2 处。**拆分成本集中在 spec/测试/机制，不在 Agent 面。**
   - 项目自带的 alias/退役机制（“alias 只能是纯转发 + 可审计 inventory + retirement
     owner + 精确 retire_by”，见归档 proposal `simplify-workflow-control-and-interfaces`）
     意味着每次拆分可以做**先加新命令、旧形态留纯转发 alias**——**运行时破坏面 ≈ 0**，
     剩下的只是文档/测试的更新工作。
3. **唯一的硬阻碍是一句话**：`cli-surface/spec.md:5` 写着 “the **fixed 12-command**
   unified entry point”。“12”这个数字是 2026-08-02 立下的稳定性承诺，但它把“命令数”当
   成了不变量，任何拆分都要先跟它打架。把表述改成 “closed, audited command inventory”
   （数量可变、集合封闭且受审计），拆分的制度阻力就消失了——这是所有拆分的第一步。

---

## 1. 影响面由什么构成（六维 + 固定税）

一个命令面变更的影响 = **固定税**（任何增/拆/改命令都逃不掉的机制文件）+ **变量面**
（该命令自己的 spec/测试/文档触点）。

### 1.1 固定税：10 个机制文件（项目自己造的“命令面变更税”）

| # | 文件 | 角色 |
| --- | --- | --- |
| 1 | `ppt_maker_harness/scripts/ppt_flow.mjs` | 注册 + 命令体 |
| 2 | `scripts/shared/cli/cli_error.mjs:19–32` | `PPT_FLOW_COMMAND_INVENTORY`（12 个名字的闭集） |
| 3 | `scripts/contracts/cli_return_audit.mjs` | 每命令 return-case 行（现 20 行 case） |
| 4 | `tests/contracts/test_process_command_surface_entry_seams.mjs:88` | **硬断言 inventory 等于 12 个名字** |
| 5 | `tests/shared/cli/test_process_cli_error.mjs:253,340` | inventory 相等性 + 逐命令审计 |
| 6 | `tests/contracts/test_cli_surface.mjs` | 对每个命令 spawn 验证 |
| 7 | `scripts/contracts/harness_document_command_audit.mjs` | 对文档声称的每个 flag spawn `--help` 验证存在 |
| 8 | `openspec/specs/cli-surface/spec.md` | fixed forms + “fixed 12-command” 表述（:5） |
| 9 | `openspec/specs/commands-reference/spec.md` | 命令参考与 intent 路由 |
| 10 | `scripts/contracts/harness_architecture.mjs` + `harness-script-layout/spec.md` | 退役词汇 guard（改名时登记旧名） |

### 1.2 变量面：实测触点计数（grep 全仓，2026-08-16）

| 形态 | 提及文件数 | 备注 |
| --- | --- | --- |
| `image2`（作为命令形态） | **115** | 排除 `shared/image2/` 模块路径噪音后 |
| `ppt_flow state` | 64 | |
| `probe-vendors` | 56 | 含 environment-check spec（647 行）的大量场景 |
| `ppt_flow doctor` | 49 | |
| `ppt_flow init` | 48 | |
| `artifact-view` | 45 | 但 playbook 0 处（见 §3） |
| `validate-state` | 29 | playbook 0 处 |
| `ppt_flow slides` | 26 | |
| `style-master`（命令形态） | 26 | |
| `ppt_flow refresh` | 23 | |
| `narrative-plan` | 20 | playbook 仅 create-deck 3 处 |
| `ppt_flow status` / `ppt_flow validate` | 各 21 | |
| `ppt_flow build` | 18 | |
| `repair-known-execution-mismatch` | **7** | 最小 |
| `ppt_flow new-version` / `ppt_flow test` | 各 11 | |

> 说明：“提及文件数”是**引用面**，不是**必改面**。有了 alias 机制，被拆分走的那部分
> 旧形态继续可用，这些文件里只有“spec 场景、测试断言、推荐性文档”需要改。

---

## 2. 各优化项的影响面分级

与 `cli-agent-ergonomics-and-optimization-space.md` 第 3 节的 G/C/F/E/D/A/B 对应，按
影响面从小到大：

### 零档：不动命令面（个位数文件，随时可做）

| 项 | 内容 | 必改文件 | 破坏面 |
| --- | --- | --- | --- |
| **G 帮助机器契约块** | 每命令 help 加 exit codes / stdout-stderr 契约 / digest 字段 / decision 枚举 | `ppt_flow.mjs`（文案）+ 1 个防漂移契约测试 ≈ **3 文件** | 0 |
| **H 动词撞名决策表** | 文档表 + 挂进 harness_document_command_audit | **2–3 文件** | 0 |

### 一档：纯增量（10–20 文件，零破坏）

| 项 | 内容 | 必改文件 | 破坏面 |
| --- | --- | --- | --- |
| **D `--json` 一致性** | validate/build/refresh/new-version 补 `--json` + 注册 report schema；style-master 补 `--json` flag | ppt_flow.mjs + cli_error.mjs（schema 注册）+ cli-surface spec + 4 组命令测试 ≈ **10–15 文件** | 0（纯加法） |
| **E state 隐藏写显式化** | 投影重建迁出 state → 新命令（见拆分 S4），state 回零写 | 见 S4 | 行为变化，需 spec 条款改写 |

### 二档：改名归一（15–50 文件，机械但分散）

| 项 | 内容 | 必改文件 | 破坏面 |
| --- | --- | --- | --- |
| **C 选择器/hash 命名统一** | `--plan-sha256`→`--plan-hash`；`--only`→`--slide-id`；alias 过渡期共存 | slides 族 ~10 + refresh 族 ~8 + spec + 测试 ≈ **20–30 文件** | 0（alias 期） |
| **F run_dir 口径统一** | doctor 的 `--run-dir` flag 与其他命令位置参数统一 | playbook 40 步里的引用 + 文档 + 测试 ≈ **30–50 文件** | 一次性语法迁移（难 alias：位置参数与 flag 无法同存，需要一次切） |

### 三档：手术拆分（每刀 15–40 文件；运行时破坏面 ≈ 0，靠 alias）

| 拆分 | 内容 | 必改文件 | 备注 |
| --- | --- | --- | --- |
| **S1 `artifacts`**（artifact-view 出 image2） | 新命令 + `image2 artifact-view` 纯转发 alias | 固定税 10 + 命令体搬迁 + cli-surface 4 条 artifact-view 要求 + AGENT_CONTRACT 1 处 + image2 操作集断言测试 ≈ **15–20 文件** | playbook 0 处，Agent 面零改 |
| **S2 `paginate`**（narrative-plan 出 slides） | 新命令 + `slides narrative-plan/apply-plan` alias | 固定税 10 + create-deck 3 步（alias 期可不改）+ narrative 测试 ≈ **15–20 文件** | |
| **S4 `state` 子命令化 + `task-projection`** | validate/repair 成子命令（消灭互斥 flag）；投影重建迁到 `task-projection` | 固定税 10 + cli-surface/node-specification 状态条款 + state 测试 ≈ **15–20 文件** | playbook 0 处 |
| **S3 `preflight` + `probe`**（doctor 拆分） | doctor 收缩为纯体检；run 级就绪→`preflight`；live 探针→`probe`；`doctor --run-dir/--smoke/--probe-vendors` alias 转发 | 固定税 10（两个新命令共享）+ environment-check spec（647 行 spec 的“direct env-check 仅 recovery”边界要重述）+ BOOTSTRAP + probe-image-channels 2 处 + doctor 测试 ≈ **30–40 文件** | **最大的拆分，但仍是项目里 change 的常规量级**（对比：converge-agent-control-surfaces 一次就动了 ~30 文件） |

**全量（零档+一档+二档+三档全部做完）≈ 80–110 个文件**，但分 7 批落地、每批独立可验证；
若只做零档+一档+S1+S2+S4（收益最大的前五刀）≈ **40–55 个文件**。

---

## 3. 关键发现：拆分不伤 Agent 面

对“哪些拆分会让 40 个 Controller 步骤重写”这个担心，实测数据给了反直觉的答案：

| 拆分目标 | playbook 提及数 | 说明 |
| --- | --- | --- |
| artifact-view → artifacts | **0** | 只在 AGENT_CONTRACT 的 human-inspection handoff 出现 1 处 |
| validate-state / repair | **0** | 维修路径，不进 deck 生产步骤 |
| narrative-plan → paginate | 3 | create-deck 的 plan/apply 两步 |
| doctor（含 smoke/probe） | 3 + 2 | intake + probe-image-channels |
| state 投影重建 | 0 | Controller 不显式调用 |

**原因**：拆分走的都是“非生命周期业务”（导航视图、分页计划、环境检查、维修），而
Controller 的 40 个 CLI 步骤几乎全是生命周期动词（style-master/image2 的
inspect/plan/authorize/generate/review/accept）。**只要不重命名生命周期动词，Agent 面的
迁移成本接近零；alias 机制又保证连 spec/测试外的存量调用也不断。**

---

## 4. 落地顺序建议（按影响面+收益）

```
第一刀（个位数文件，零风险，立刻做）
  G 帮助机器契约块  →  H 决策表
第二刀（纯增量）
  D --json 一致性
第三刀（手术拆分，各自独立 change，全部带 alias + retire_by）
  S1 artifacts  →  S2 paginate  →  S4 state 子命令化+task-projection  →  S3 preflight+probe
第四刀（机械改名，单独排期，一次性切）
  C 命名统一  →  F run_dir 统一
最后（框架修订）
  把 "fixed 12-command" 表述改为 "closed, audited command inventory"
```

前置条件（每个拆分 change 的 tasks 第一项）：改 `cli-surface/spec.md:5` 的 12-command
表述——不是删稳定性承诺，而是把不变量从“数量=12”换成“集合封闭、逐命令审计、退役需
alias+retire_by”。

### 附：证据索引

- 固定税: `cli_error.mjs:19–32`、`cli_return_audit.mjs`（20 行 case）、
  `tests/contracts/test_process_command_surface_entry_seams.mjs:88`、
  `tests/shared/cli/test_process_cli_error.mjs:253,340`、
  `tests/contracts/test_cli_surface.mjs`、`harness_document_command_audit.mjs`
- 12-command 表述: `openspec/specs/cli-surface/spec.md:5`
- alias/退役机制出处: `openspec/changes/archive/2026-07-23-simplify-workflow-control-and-interfaces/proposal.md`
  （“alias 只能是纯转发…retirement owner…精确 retire_by”）
- 触点计数: 本文件 §1.2（2026-08-16 grep 实测）
