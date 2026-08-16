# Findings IV: 负担过重的命令怎么拆 — 目标命令树设计

> 挖掘日期: 2026-08-16（working-tree HEAD = d2df02b）
> 回答: “如果负担过重，应该拆成什么命令更合理？”
> 姊妹篇: `cli-dependency-and-cli-design-audit.md`、`cli-agent-ergonomics-and-optimization-space.md`、
> `cli-optimization-blast-radius.md`（影响面测算；本文件拆分编号 S1–S4 与之对应）。
> 未读 `_backlog/` 内容；未改任何代码——这是设计提案，落地应走 OpenSpec change。

---

## 0. 拆分原则

1. **一个命令 = 一个业务**：Agent 从命令名就能判断“现在该不该用、用了会发生什么”，
   不再需要脑内交叉表。
2. **命名用 canonical 术语**：拆分出的新命令名取自 CONTEXT.md 已定义的词
   （Pagination → `paginate`；Human Navigation Path → `artifacts`；Collaboration
   Projection → `task-projection`），不发明新词汇表。
3. **只拆“非生命周期业务”**：lifecycle 动词（plan/authorize/generate/review/accept）
   的分离是 human-gate 机制，**不动**（`cli-agent-ergonomics` 第 4 节“不该动的”）。
4. **每刀配 alias + retire_by**：新命令上线，旧形态保留为纯转发 alias（项目归档
   proposal 已有的机制），运行时破坏面 ≈ 0；alias 带 retirement owner 与精确
   `retire_by`，到期删除。
5. **数量上升换取判断成本下降**：命令从 12 变 17，但每个命令的帮助、参数、副作用都
   变自明。“命令少”不是目标，“判断快、填参不查表”才是。

---

## 1. 目标命令树（12 → 17）

| # | 命令 | 业务（一句话） | 变更 |
| --- | --- | --- | --- |
| 1 | `doctor` | 全局离线环境体检（node/npm/字体/磁盘/git…） | **收缩**：删 `--run-dir/--operation/--smoke/--probe-vendors` |
| 2 | `preflight <run-dir> --operation <op>` | run 级 provider/操作就绪检查（profile + IMAGE2_PROVIDER_PROFILE_ID 匹配） | **新**（S3，收编 doctor --run-dir --operation） |
| 3 | `probe [--smoke|--vendors] [--run-dir <dir>]` | live 网络探针（付费、必须 confirm 门） | **新**（S3，收编 doctor --smoke/--probe-vendors） |
| 4 | `init <deck_dir>` | 创建 run bundle | 不变 |
| 5 | `status <run_dir>` | 只读投影（gates/artifacts/断点/next action） | 不变 |
| 6 | `validate <run_dir>` | 源解析 + 身份绑定两段校验 | 不变（补 `--json`，属 D） |
| 7 | `build <run_dir>` | 最终交付组装 | 不变 |
| 8 | `refresh <run_dir>` | 最小安全刷新链（title/visual/notes） | 不变（选择器统一属 C） |
| 9 | `slides …` | 选择器工具 + 当前快照结构编辑（list/resolve/normalize/move/delete/insert） | **收缩**：narrative-plan/apply-plan 迁出 |
| 10 | `paginate <run-dir> --candidate <path>` / `paginate apply …` | 叙事分页计划（preview → exact-plan apply 两段式） | **新**（S2，收编 slides narrative-plan/apply-plan） |
| 11 | `new-version <run_dir>` | 结构版本化 | 不变 |
| 12 | `test` | 核心验证档 | 不变 |
| 13 | `state <run_dir> [--json]` | 只读状态观察（**零写**，回退掉隐藏投影写） | **收缩**：模式改子命令 |
| 14 | `state validate <run_dir>` | 只读状态校验（现 --validate-state，exit 2 契约保留） | **子命令化**（S4） |
| 15 | `state repair-known-execution-mismatch <run_dir>` | BUG-066 精确修复 | **子命令化**（S4，消灭互斥 flag 拼图） |
| 16 | `task-projection <run-dir>` | 重建协作投影卡（现 state 文本模式的隐藏写） | **新**（S4）——写动作从命令名可见 |
| 17 | `artifacts <run-dir>` | 重建 Human Navigation Path（现 image2 artifact-view） | **新**（S1，出 image2） |
| 18 | `style-master …` | Style Master 候选生命周期（7 ops） | 不变 |
| 19 | `image2 …` | Page Image 渐进生命周期（10 ops，**不再含 artifact-view**） | 收缩一处 |

> 注：编号写 1–19 是因为 14/15 是 state 的子命令形态。顶层命令数 = **17**。

---

## 2. 每一刀的“为什么”（业务边界与证据）

### S1: `artifacts` 出 image2

- **现状**：`image2 artifact-view` 与生命周期住在同一棵树，但它**不读 hash、不授权、
  不碰状态**，只重建 `_generated/nav/` 导航树（spec 自己反复强调 “not a selector,
  authorization assertion…”）。它是**导航业务**，被硬塞进付费生命周期家族。
- **拆分后**：`artifacts <run-dir>` 单业务自明；AGENT_CONTRACT 的
  “Human inspection handoff” 改为 “先跑 `ppt_flow artifacts <run-dir>`”。
- **谁在用**：playbook 0 处、AGENT_CONTRACT 1 处（`cli-optimization-blast-radius.md` §3
  实测）——Agent 面迁移成本 ≈ 0。
- **别名**：`image2 artifact-view <run-dir>` → 转发 `artifacts <run-dir>`，
  `retire_by: change:<s1>|release:<t+1>`。

### S2: `paginate` 出 slides

- **现状**：`slides` 混装三种业务（选择器工具 / 结构编辑 / 叙事分页计划），且
  `--plan-sha256`/`--apply` 一个 flag 服务 slide-edit 与 narrative-plan 两套事务。
- **拆分后**：`paginate` 对齐 CONTEXT.md 的 **Pagination**（“把 Story Outline 变成
  Slide Identities 的动作”）——是**叙事层**业务，发生在 structural edit 之前，由
  `01-content/internal/narrative_page_plan.mjs` owner；`slides` 只剩快照层操作。
- **别名**：`slides narrative-plan` → `paginate`；`slides apply-plan` → `paginate apply`。
- **触点**：create-deck 3 处（alias 期内不改也能跑）。

### S3: `doctor` 一分为三

- **现状**：三种业务（全局体检 / run 级就绪 / 付费探针）共用一个名字，四种形态互斥，
  且 run 级就绪逻辑**内联在 ppt_flow.mjs**（:726–768）——命令名回答不了“我花不花钱”。
- **拆分后**：
  - `doctor` = 体检（零风险、零网络，随时跑）；
  - `preflight` = 起飞前检查（绑 exact run，验 profile 与环境匹配，不进网络）；
  - `probe` = 明确付费 + 明确需 confirm 的 live 探针（名字自带风险提示）。
  BOOTSTRAP 里那段教“doctor 有三种形态”的散文可删成三行。
- **别名**：`doctor --run-dir X --operation Y` → `preflight X --operation Y`；
  `doctor --smoke` → `probe --smoke`；`doctor --probe-vendors` → `probe --vendors`。
- **额外收益**：environment-check spec 里 “direct env-check 仅 pre-install/recovery”
  的边界因此更清晰——doctor 只做体检后，env-check 的定位不再与 doctor 的三态纠缠。

### S4: `state` 子命令化 + `task-projection`

- **现状**：一个命令四个互斥 flag、三套输出形状，外加一个隐藏写（文本 state 在特定
  route 下重建投影文件，`ppt_flow.mjs:3884–3888`）。“读命令有写副作用”是 Agent 最难
  推理的行为。
- **拆分后**：`state`（观察，零写）／`state validate`／`state repair-known-execution-mismatch`
  各自拥有独立参数与帮助（commander 子命令天然消灭互斥 flag 拼图）；投影重建迁到
  **`task-projection <run-dir>`**——写动作从命令名可见，且与 CONTEXT.md 的
  Collaboration Projection 对齐。
- **触点**：playbook 0 处（维修/投影路径不进生产步骤）；spec 条款改写集中在
  cli-surface 与 node-specification 的 state 观察条款。

### 不拆的与理由

- **`status` 不拆**：全是投影、无参数谜题、无写——“宽但不险”，拆分只会制造新词汇。
- **`style-master` 不拆**：7 ops 是单一连贯生命周期，唯一摩擦是撞名（H 决策表解决）。
- **`image2` 生命周期不拆**：plan/pilot/expansion/authorize/generate/review/accept 的
  分离是 human-gate（付费步骤之间必须插人决定），合并是负优化。
- **不拆 init/validate/build/refresh/new-version/test**：已是单业务；只做参数统一（C/D/F）。

---

## 3. 拆分前后：Agent 的判断成本对比

| 场景 | 现在（Agent 要想什么） | 拆分后 |
| --- | --- | --- |
| “想看看本地环境行不行” | doctor 是哪个形态？会不会触发花钱的 smoke？ | `doctor`——零风险，名字即语义 |
| “要 raw 生成了，检查 provider 就绪” | `doctor --run-dir X --operation raw-generation`（--operation 要求 --run-dir，枚举在 prose 里） | `preflight X --operation raw-generation` |
| “人要求 live 探针” | `doctor --probe-vendors`（和体检同一个名字，费用靠脑内记忆） | `probe --vendors`——名字自带付费语义，confirm 门照旧 |
| “用户要人工看产物” | `image2 artifact-view`（和付费生命周期同家族，要记得它不花钱不授权） | `artifacts X` |
| “故事大纲要分页” | `slides narrative-plan X --candidate …`（和结构编辑混装，plan-sha256 两义） | `paginate X --candidate …` |
| “看状态（保证不写）” | `state`（但要记得特定 route 下它会写投影文件！） | `state`（真的零写） |
| “要刷新协作投影卡” | 跑 `state` 并祈祷 route 匹配 | `task-projection X` |
| “校验状态” / “修 BUG-066” | `--validate-state` / `--repair-known-execution-mismatch` 与 `--json` 互斥拼图 | `state validate` / `state repair-known-execution-mismatch`，各带独立 help |

净效果：Agent 需要背的**跨命令交叉表**（哪个形态花钱、哪个 flag 属于哪个 operation、
哪个观察会写）大部分消失，变成**命令名可判**。

---

## 4. 落地切分与风险

### 落地切分（每个拆分一个独立 OpenSpec change，可单独合入/回滚）

1. `change: fix-command-inventory-framing` — 改 `cli-surface/spec.md:5` 的
   “fixed 12-command” → “closed, audited command inventory”（一切拆分的前置）。
2. `change: extract-artifacts-command`（S1）→ 3. `change: extract-paginate-command`（S2）
   → 4. `change: state-subcommands-and-task-projection`（S4）
   → 5. `change: split-doctor-preflight-probe`（S3）。
6. 之后再排 C/F（命名统一、run_dir 统一）与 B（operation 子命令化——生命周期动词的
   flags 挂到 operation 级，是“帮助不再撒谎”的根治，但触碰 40 个 Controller 步骤，
   放最后）。

每个拆分 change 的 tasks 固定五件套：命令体 + 固定税 10 文件（见
`cli-optimization-blast-radius.md` §1.1）+ spec delta + alias（带 `retire_by`）+ 契约测试
（新命令的 8 类 return-case 审计行）。

### 风险与反论

- **“命令变多了，Agent 要学的不更多吗？”** 学 17 个自明动词 < 学 12 个多义动词 +
  4 张交叉表。判断成本在“每次调用时”，不在“总数”；且 17 个里 7 个是原样保留。
- **alias 的腐化风险**：alias 必须是纯转发 + 可审计 inventory + 精确 retire_by
  （项目自己的机制），否则重蹈“退役物从不删除”的覆辙——每个 alias 落 tasks 时就写好
  removal trigger。
- **命名分歧**：`preflight` 可替换为 `readiness`；`artifacts` 可替换为 `nav`；
  `task-projection` 可替换为 `task-card`。本提案选 canonical-术语最近的名字，最终名
  在 change 的 proposal 里由人类定——名字本身不是架构决策。
- **与历史教训的关系**：拆分的每一步都是“减法式重构”（每拆一刀，被拆命令的形态数、
  flag 数、副作用数都减少），符合 `simple-reliable-control` 的 “an added layer must
  remove or consolidate complexity”。这与历史上“加层不删层”（Route Catalog 12 天即死）
  是相反的方向。

### 附：证据索引

- doctor 三业务: `ppt_flow.mjs:722–773`、注册 `:3528–3564`
- image2 家族 + artifact-view: `:3955–3974`、`PAGE_IMAGE_OPERATIONS` `:1551–1563`、
  `cli-surface/spec.md:224–238`
- slides 三业务: `:3647–3702`、帮助示例 `:3517–3519`
- state 隐藏写: `:3884–3888` → `page_production_task_projection.mjs:272–289`
- 12-command 表述: `cli-surface/spec.md:5`
- alias/retire_by 机制: `openspec/changes/archive/2026-07-23-simplify-workflow-control-and-interfaces/proposal.md`
- canonical 术语: `CONTEXT.md`（Pagination / Human Navigation Path / Collaboration Projection）
