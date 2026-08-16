# Findings II: CLI 的 Agent 使用体验 — 职责过重与参数易用性

> 挖掘日期: 2026-08-16（working-tree HEAD = d2df02b）
> 视角: “如果我是 Agent，我希望 CLI 非常清晰干净”——本条不讨论“该不该有 CLI”，只讨论
> **好不好用**：哪个命令职责过重、参数好不好填、有什么低风险优化空间。
> 姊妹篇: 同目录 `cli-dependency-and-cli-design-audit.md`（历史问题 + deep-module 评判）、
> `cli-optimization-blast-radius.md`（影响面测算）、
> `cli-command-split-design.md`（拆分设计）。
> 证据均为 file:line 级；未读 `_backlog/` 内容；未改任何代码。

---

## 0. 结论速览

**两个问题的回答都是“是，有摩擦，但不致命”。** 系统的正确性纪律（hash 反漂移、单一
next action、secret-safe envelope）本身很好；问题集中在**“命令 = 多个业务”**与
**“同一套 flag 对不同 operation 含义不同”**这两类，导致 Agent 每次都要在脑内维护一张
比帮助文本更复杂的交叉表。

- **问题一（职责过重）**：`doctor`、`image2`、`slides`、`state`、`status` 五个命令都有
  业务混装，其中 `doctor`（4 种互斥模式）和 `image2`（11 个 operation 混入导航重建）最重；
  `state` 还有一个**观察命令带隐藏写**的陷阱。
- **问题二（参数难填）**：最难的参数不是“填什么”，而是“**什么操作允许填什么**”——
  flags 挂在父命令上，`--help` 无法告诉你哪个 operation 能用哪个 flag（代码里靠
  `hasExplicitCliOption` 手扫 argv 补救）；同一个 `--decision` 的值域随 operation 变化；
  4 种 hash 跨调用线程化 + 命名不统一；4 种 slide 选择器写法；`run_dir` 有时是位置参数
  有时是 flag。连 Controller 文档自己都写 `pilot-accept ... --decision proceed` 用省略号
  代替完整参数表。
- **总体判断**：没有“特别的深的问题”，但有一批**低风险、高体验收益**的优化（第 3 节
  按 ROI 排序）。其中“operation 子命令化”一条能同时解决职责判断与参数填写两个问题。

---

## 1. 问题一：哪些 CLI 承担的业务太多

按“Agent 判断如何使用它的难度”排序：

### 1.1 `doctor` —— 一个命令三种业务、四种互斥形态（最重）

证据: `ppt_flow.mjs:722–773`（commandDoctor）+ 注册 `:3528–3564`。

| 业务 | 形态 | 谁在做 |
| --- | --- | --- |
| 全局本地环境体检（node/npm/字体/磁盘/git…） | `doctor`（裸调用） | 委托 env-check 子进程 |
| run 级 readiness（绑定 exact run，验 profile + provider 身份） | `doctor --run-dir <dir> --operation <op>` | **内联在 ppt_flow.mjs**：resolveRunAdapter → 解析 provider profile → 匹配 IMAGE2_PROVIDER_PROFILE_ID → source/env 分类（:726–768） |
| 付费网络探针（live submit，需人确认） | `--smoke`（1 次提交）或 `--probe-vendors`（每 vendor 1 次） | 委托 env-check |

- 互斥拼图：`--smoke` 与 `--probe-vendors` 互斥（:3538–3544）；`--operation` 必须搭配
  `--run-dir`（:3545–3547）；`--operation` 枚举（framed-local-refresh|raw-generation|
  full-build）写在 option 描述 prose 里。
- 一个 Agent 看到 `doctor` 时无法从命令名判断这是“体检/就绪检查/花钱探针”中的哪一个，
  必须先想清楚自己处于生命周期哪一步（BOOTSTRAP 甚至专门花一段话教这个区别，Step 1）。
- 历史佐证：`--image2` 已退役、`6547b59` 还在删 dead doctor plumbing、曾有一次
  `align-doctor-operation-readiness` 专项变更——这条命令面一直在返工。

### 1.2 `image2` —— 11 个 operation，混进了不同业务 + 全套 hash

证据: 注册 `:3955–3974`、`PAGE_IMAGE_OPERATIONS` `:1551–1563`、spec fixed forms
`cli-surface/spec.md:224–238`。

- 生命周期 9 个：plan / pilot / expansion / authorize / generate / pilot-review /
  pilot-accept / review / accept / reconcile（其实是 10 个，见下）。
- **`artifact-view` 是另一类业务**：重建 Human Navigation Path（provider-free 导航视图），
  与生命周期、hash、授权毫无关系，却住在同一棵命令树下，被 spec 反复强调
  “not a selector / 不授权 / 只重建导航”。Agent 要记住这个异类。
- 参数随 operation 漂移：`--batch-hash` 只有 authorize/generate/pilot-review/pilot-accept
  用；`--attempt-sha256` 只有 reconcile 用；`--slide-id` 只有 pilot 用；`--decision`
  pilot-accept 接受 `proceed|repair|redirect`、accept 只接受 `proceed|repair`（spec :234/236）
  ——**同一个 flag 的值域随 sibling 参数变化**，这是“填参数难”的典例。

### 1.3 `slides` —— 8 个子命令其实是三种业务

证据: 注册 `:3647–3702`；帮助示例 `:3517–3519`。

| 业务 | 子命令 | 需要的 flag |
| --- | --- | --- |
| 选择器工具 | list / resolve / normalize | （几乎无） |
| 结构编辑（preview→apply 两段式） | move / delete / insert | --after/--before/--to/--source/--apply/--plan-sha256 |
| 叙事分页计划（另一套 preview→apply） | narrative-plan / apply-plan | --candidate/--plan/--plan-sha256/--apply |

- 同一个 `--plan-sha256` 服务于两个不同语义的 plan（slide-edit transaction 与 narrative
  plan），`--apply` 也一样；`move` 的语法（`slides move <run-dir> 7 --after 3`）把选择器
  同时放在位置参数和 flag 值里。
- 选择器解析规则（位置→口头 ID→title 片段→保留 ID 回退）是共享 owner 的深度，但命令面
  把它摊在 8 个入口上，Agent 每次都要判断“我这个子命令吃哪种选择器”。

### 1.4 `state` —— 观察命令带着一个隐藏写

证据: 注册 `:3727–3935`；`refreshProgressiveControllerTaskProjection` `:3884–3888`；
`page_production_task_projection.mjs:272–289`（writeFileSync 落盘
`page-production-task-projection.md`）。

- 三个互斥模式：纯文本投影 / `--json` / `--validate-state` / `--repair-known-execution-mismatch`
  （四者间还有两两/三向互斥，:3738–3748）。
- 纯文本 `state` 与 `state --json` 在特定 route 下**会重建任务投影文件**（spec 也承认
  “normal text state and state --json may rebuild the current task projection”）——
  一个描述为 “Show current Page Image state” 的命令有时会写磁盘。对 Agent 来说这是
  最难推理的一类行为：**读命令有写副作用**。
- 输出形态三套：人类文本（Playbook/Current/Status/Gates…）、JSON report（含 durable
  state 全量 + workflow_inspection + task_projection）、validate-state 的独立报告。
  Agent 要背三套输出形状。

### 1.5 `status` —— 一站式投影（中等）

证据: `collectStatus` `:485–548` + `enrichStatusWithState` `:555–690` + 注册 `:3588–3600`。

- 一个命令投影：结构检查、gates、style master、receipt、页数、raw/final 图片数、PPTX、
  lessons、playbook 断点、production_identity、next action。内容多但**都只是投影**，
  无写、无参数谜题——属于“宽但不险”。与 `state`/`validate` 的边界（谁能投影什么）需要
  记 AGENT_CONTRACT 的优先级链（`state --json → workflow_inspection.primary_action`）。

### 1.6 `style-master` —— 最干净的家庭（相对）

证据: 注册 `:3938–3952`。

- 7 个 operation 是单一连贯生命周期（inspect→plan→authorize→generate→review→accept→abandon），
  唯一摩擦是它与 image2 的动词撞名（见 2.5）和 `--candidate-id` 只对 accept 有意义。

---

## 2. 问题二：参数设计的实际摩擦

逐条给证据和“为什么难”。难度评级：★=低，★★★=高。

### 2.1 ★★★ hash 线程化：Agent 当交易账本

- 4 种 hash 跨调用往返：`--plan-hash`（image2/style-master）、`--batch-hash`（image2）、
  `--attempt-sha256`（reconcile）、`--plan-sha256`（slides）。Controller 明确要求
  “retain the one grant digest”（create-deck.md:187），hash 要穿过 LLM context window
  逐字往返，抄错一个字符 = 漂移 hard-stop。
- 命名不统一：image2/style-master 用 kebab `--plan-hash`，slides 用 `--plan-sha256`，
  而 slides 的 JSON 输出字段又叫 `plan_sha256`（snake）。同一个概念三种写法。
- 各 operation 需要哪几个 hash 没有结构性表达，Agent 只能靠 spec fixed forms 背。

### 2.2 ★★★ flags 挂在父命令上，帮助无法回答“这个 operation 能用哪些 flag”

- `image2` 的 6 个 flag、`slides` 的 9 个 flag 都声明在父命令上（:3960–3965、:3653–3661），
  `image2 generate --help` 看到的是全家 flag。
- 真正限制是手写的运行时白名单：`hasExplicitCliOption`（:190–192，对原始 argv 做前缀
  匹配）+ `progressiveUnsupportedOption`（:1982–2019）+ `styleMasterUnexpectedOption`
  （:3177–3189）。**帮助撒谎，代码纠错**——Agent 第一次用某个 operation 时要么踩 USAGE
  错误（~1s 冷启动后才知道），要么先把 spec 背下来。

### 2.3 ★★★ 同一个 flag，值域随 operation 变化

- `image2 --decision`：pilot-accept = `proceed|repair|redirect`；accept = `proceed|repair`
  （spec :234/236）。
- `slides --plan-sha256/--apply`：服务于 slide-edit 与 narrative-plan 两套不同事务。
- `refresh --kind`：title/visual 才吃 `--only`/`--all`，notes 不吃（:3628–3633，运行时才拦）。
- `doctor --operation` 枚举、`--smoke/--probe-vendors` 互斥——都靠运行时 usage 失败兜底。

### 2.4 ★★ 四种 slide 选择器写法

| 命令 | 写法 |
| --- | --- |
| image2 pilot | `--slide-id <formal-id>`（可重复） |
| refresh | `--only <逗号分隔 IDs>` |
| style-master accept | `--candidate-id <slot-id>`（不是 slide！） |
| slides move/delete | 位置参数选择器 + `--after/--before <selector>` |

- 同一个“指名某页”的意图有 4 种语法，其中 `--candidate-id` 指的不是 slide 而是候选槽位，
  极易混。

### 2.5 ★★ 动词撞名，语义漂移

`plan`、`authorize`、`generate`、`review`、`accept` 在 style-master 与 image2 两个家庭
同时存在，但：image2 `authorize` 要 `--batch-hash`、style-master 不要；style-master
`review` 有 `redirect`、image2 `review` 没有；image2 `plan` 产生 pilot 用 hash、
style-master `plan` 产生候选数（`--candidate-count 0–4`）。Agent 必须时刻带着家族前缀
思考，任何“上一个 authorize 怎么填来着”的类比都会错。

### 2.6 ★★ `run_dir` 有时是位置参数，有时是 flag

- 除 doctor 外全部命令：`<run_dir>` 是位置参数；`doctor` 用 `--run-dir`（:3530）。
- `init` 吃 `<deck_dir>`（deck 根），其余吃 `<run_dir>`（3_versions/vN）——这个区别
  CONTEXT.md 和 BOOTSTRAP 都专门教过，正说明它是个常错点。
- `slides` 的 run_dir 在 subcommand **之后**（`slides <subcommand> <run_dir> ...`），
  其他家族是 `<operation> <run_dir>`——位置口径微妙不一致。

### 2.7 ★ `--json` 门控不一致

| 命令 | 机器输出 |
| --- | --- |
| status / state / slides / image2 | 有 `--json` |
| style-master | **没有 `--json` flag，但成功时总是 JSON.stringify**（:3483） |
| validate / build / refresh / new-version / test | 只有人类文本成功输出，无机器报告 |

- Agent 无法用一条规则记住“想要 JSON 该不该加 flag”；validate 成功只有 prose
  （“receipt-validated”类文本），机器事实只能靠 exit 0。
- 附带：成功 JSON 里嵌着下一步要用的 digest，Agent 必须学会从
  `JSON.stringify(..., null, 2)` 的哪个字段抠哪个 hash（plan_sha256 / plan_hash /
  batch_hash / grant digest……命名还不一样）。

### 2.8 ★ 文档自己也在省略参数

- `create-deck.md:324,558` 写着 `ppt_flow image2 pilot-accept ... --decision proceed`——
  **Controller 文档用 `...` 代替完整参数表**。连写文档的人都嫌参数太长，Agent 抄写时
  更难免错漏。

### 2.9 ★ 成功输出的机器事实不完整 / 进度噪声

- runNode 在 stdout 打 `→ node script args`（:386）；委托进度事件走 stderr 标记
  （CLI_PROGRESS_ENV）。对人类友好，对 Agent 是输出契约（“最后一个非空 stderr 行才是
  envelope”）之外的噪声——契约本身清晰，但噪声让“扫描最后一行”的心理负担略增。

---

## 3. 优化空间（按 ROI 排序；均为增量、可单独落地）

| # | 优化 | 具体 | 收益 | 成本/风险 |
| --- | --- | --- | --- | --- |
| **A** | `doctor` 拆分 | 裸 `doctor`=全局体检；run 级就绪迁到 run-scoped 命令面（或 `doctor --run-dir` 保留但独立 help 段）；`--smoke/--probe-vendors` 显式冠名 `probe`（付费+需人确认，名字就该吓人） | 直接消除“最重的命令”，BOOTSTRAP 里那大段教学可缩成一行 | 中：spec 多处引用 doctor 三态；env-check 的恢复入口语义要重划 |
| **B** | **operation 子命令化** | `image2 generate` → `image2-generate` 或 `image2 generate` 但把 flags 挂到 operation 级（commander 子命令自带 option），`--help` 每操作只显示本操作 flags | **同时解决 2.2/2.3/2.5**：帮助不再撒谎，删掉 hasExplicitCliOption 第二解析器，值域差异进各子命令帮助 | 中：改命令面 = 动 spec fixed forms + 40 个 Controller 步骤 + spawn 测试；这正是上一份 Findings 选项 A 的缩小版 |
| **C** | 选择器与 hash 命名统一 | `--only`/`--candidate-id` 归一为可重复 `--slide-id`（style-master 用 `--candidate-id` 保留但帮助注明不是 slide）；hash 统一 `--plan-hash`（slides 的 `--plan-sha256` 改名或提供 alias + 过渡期） | 4 种选择器 → 1 种；3 种写法 → 1 种；Agent 少背两张表 | 低-中：一次性 spec/测试/文档同步；alias 需登记退役 owner（项目已有这套机制） |
| **D** | `--json`/报告一致性 | 所有观察/投影命令统一支持 `--json` 且注册 report schema（validate/build/refresh/new-version 补上；style-master 补 `--json` flag 或明确无 flag 也 JSON）；成功 digest 字段名统一并在帮助里列出 | 2.7/2.1 缓解：Agent 用一条规则拿到机器事实 | 低：纯增量，不破坏现有输出 |
| **E** | `state` 隐藏写显式化 | 任务投影重建改为显式 flag（如 `state --refresh-projection`）或迁到 `status`；纯 `state`/`--json` 回到零写观察 | 消除“读命令有写副作用”推理陷阱，与 spec 的 zero-write 观察精神一致 | 低-中：spec 的 eligible-route 条款要改写；Controller 里依赖投影重建的步骤要显式传 flag |
| **F** | `run_dir` 口径统一 | 全部 run-scoped 命令统一位置参数 `<run_dir>`（doctor 改位置参数或全部改 `--run-dir` flag）；帮助统一印“run_dir = 3_versions/vN，不是 deck 根” | 2.6 消除 | 低：纯语法迁移 + 测试更新 |
| **G** | 帮助加“机器契约”块 | 每个命令 help 尾部固定输出：exit codes（0/1/2）、stdout/stderr 契约、本命令 digest 字段名、decision 枚举 | 2.1–2.9 全局缓解：Agent 读一个 help 就能正确调用 | 极低：只改 `.addHelpText` 文案 + 一个契约测试防漂移 |
| **H** | 动词撞名决策表 | 在 `COMMANDS.md`/help 或 deck-guide 维护一张“style-master vs image2 同动词差异表”（hash 需求、decision 枚举、产证物） | 2.5 缓解 | 极低：文档，但需防漂移（挂进 harness_document_command_audit） |

**推荐的落地顺序**：G（当天可做，立刻降 Agent 摩擦）→ C + F + E + D（低风险语法归一，一批
OpenSpec change）→ A（doctor 拆分）→ B（operation 子命令化，作为“接口面收窄”的第一刀）。

---

## 4. 不该动的（看似摩擦，实为有意设计）

- **hash 线程化本身**：`--plan-hash/--batch-hash/--attempt-sha256` 是反漂移/授权绑定
  （drift 检测、grant 绑定、CAS）。不要删，只统一命名（第 3 节 C）或按上一份 Findings
  的选项 C 移进会话。**任何“帮 Agent 自动带上一次 hash”的缓存都会破坏
  byte-preservation 保证**。
- **pilot/authorize/generate 的动词分离**：这是 human-gate 机制（付费步骤之间必须插人
  决定）。合并成单动词 execute 是上一份 Findings 的选项 D，风险大，此处不做。
- **不推断 run_dir / 不扫 deck_\***：明确的反模式（AGENT_CONTRACT），任何“默认值智能推断”
  都会违反它。
- **secret-safe envelope 与 last-line 契约**：深度所在，动不得。
- **success 人类文本**：AGENT_CONTRACT 的 Human-facing CLI success handoff 依赖它有界、
  有序的人类摘要；机器事实走 JSON（第 3 节 D 补全即可），不必删人类文本。

---

## 5. 与上一份 Findings 的关系

- 上一份（`cli-dependency-and-cli-design-audit.md`）诊断的是**为什么**：接口堆积、owner
  逻辑渗漏、立法治理。
- 这一份回答的是**Agent 实际体验**：职责混装（1.x）与参数摩擦（2.x）是那份诊断在
  “使用手感”上的投影；第 3 节的 G/C/F/E/D 是低风险增量，A/B 是向“收窄接口”迈进的
  第一步。两份配合：**先 G+C+F+E+D 止血，再按 A、B 顺序收窄表面。**

### 附：一手证据索引（供复核）

- `ppt_maker_harness/scripts/ppt_flow.mjs`：doctor 体 :722–773、status 体 :485–690、
  state 体 :3727–3935（隐藏写 :3884–3888）、image2 :3955–3974、style-master :3938–3952、
  slides :3647–3702、argv 白名单 :190–192/:1982–2019/:3177–3189、JSON 输出点 :864/:1137/
  :3057/:3135/:3483/:3808/:3913
- `openspec/specs/cli-surface/spec.md`：fixed forms :224–238、`--decision` 值域差异 :234/:236
- `ppt_maker_harness/playbook/create-deck.md`：hash 教学 :187/:200/:214/:228/:242/:270/…、
  省略号参数 :324/:558
- `ppt_maker_harness/scripts/shared/workflow/page_production_task_projection.mjs:272–289`
  （投影落盘写）
- 姊妹篇: `cli-dependency-and-cli-design-audit.md`
