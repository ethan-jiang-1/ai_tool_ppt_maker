# Plan: HTML-first 缺陷收敛与人本 Gate 宪法

> 类型: 设计 / 分析 | 更新: 2026-07-21

## 背景 / 现状

本计划覆盖 `_backlog/bugs/` 中 BUG-014 至 BUG-032 共 19 个活跃缺陷。当前没有 active
OpenSpec change。问题并非 19 个孤立补丁，而是三条相互关联的产品链路：

1. HTML-first 从 pilot、review、build、delivery 到可选 Image2 的生产链会意外硬阻塞；
2. markerless 到 HTML-first 的文档承诺与实际工具入口不一致；
3. HTML-first 虽能生成确定性页面，但视觉语言和人工审阅入口仍不足。

现有代码已经有 `approved|waived` 状态、`--waive` CLI 和早期 “Gate 是向导，不是路障”
原则，但它们没有形成覆盖所有 gate 的统一协议。尤其是 `--waive` 仍依赖完整且 current 的
review plan，因此当生成/重建 review plan 本身出错时，用户仍然无法继续。

Bug 清单的计数也有簿记误差：P0 标题写 5 个、实际列出 6 个；P2 标题写 6 个、实际列出
5 个。总数 19 不变。修复归档时一并校正，不单独创建 change。

## 核心定位

MJS Gate 的职责是帮助用户一步步把 PPT 做好：发现偏离时说明发生了什么、推荐最佳下一步，
并让用户在知情后保留最终决定权。只有继续执行无法保持目标身份、数据完整性、安全性、明确
授权或可恢复性时，才允许 hard stop。

```text
检测到问题
    |
    +-- 可自动、安全修复 ----------> 自动修复并继续，报告做了什么
    |
    +-- 可逆的质量/流程风险 ------> 建议最佳路径 + 明确 override + 记录用户决定
    |
    `-- 无法安全确定或不可逆 ------> hard stop + 解释不变量 + 给恢复动作
```

### 三类结果

| 级别 | 适用条件 | 默认行为 |
|---|---|---|
| `guide` | 最佳实践、质量建议、可自动修复的小偏差 | 给出人话说明和可执行推荐；能继续就继续 |
| `confirm` | 风险真实但可逆，且用户拥有该内容/质量决定 | 推荐修复，同时提供显式 `waive/force` 和 reason；审计后继续 |
| `hard-stop` | 无法识别目标、会覆盖并发写、破坏状态/产物、泄密、绕过付费远端授权或提交错误 plan | 拒绝执行；输出 expected/actual、为何不可覆盖及唯一安全恢复动作 |

`force` 不是“忽略一切”。它只能覆盖建议和可逆风险，不能覆盖：active journal/CAS 冲突、
结构编辑或迁移的 plan-hash 身份不匹配、路径逃逸、损坏且不可解释的 state、远端调用未授权、
或无法确定用户要操作哪个版本/slide 的情况。

### 明确不做

- 不删除 gate，也不把所有 non-zero exit 改成 warning；无法产生可信结果时仍必须失败；
- 不允许用户或 Agent 手工伪造 approval、delivery receipt、state 或 `_generated/`；
- 不让 MJS 从 IMAGE PROMPT 自动猜测 HTML family/body，创意转换仍由 Agent 负责；
- 不为了视觉自由开放任意 HTML/JavaScript、远端资源或未登记 SVG；
- 不让 `force` 暗中触发 provider submit，远端费用始终需要独立、精确的 authorization。

## OpenSpec 治理落点

建议在 Change 1 中新增 `openspec/policies/human-centered-gates.md`，作为 **OpenSpec change 的
设计政策**，而不是第二份运行时事实源。`openspec/config.yaml` 做两层接入：

1. `context` 加入简短核心原则和 policy 路径，要求涉及 gate/readiness/validation/error/override
   的 change 先读该文件；
2. `rules.proposal/specs/design/tasks` 分别要求：列出 gate 分类、给出可观察的正常/override/
   hard-stop 场景、说明 hard-stop 所保护的不变量、实现并测试推荐动作与继续动作。

Change 1 还必须澄清 config context 中“Stage 2 只能在 gate 为 `approved` 或 `waived` 时运行”
这一句：正常路径仍如此；`--force` 是把用户的显式选择发布为现有 version-scoped owner 下的
`waived` 决定后继续，不是忽略 pending，也不是改写成 `approved`。Status 必须分别显示 decision、
identity freshness 与 evidence completeness，使“当前版本上的 waiver”不会被误读成“证据完整的审批”。

运行时权威仍按现有边界维护：

| 层 | 责任 |
|---|---|
| `openspec/policies/human-centered-gates.md` | 维护 change 时如何判断 gate 姿态 |
| `openspec/config.yaml` | 把该判断注入 OpenSpec artifact 指令 |
| `PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md` | 生产 Agent 面向用户的行为宪法 |
| `cli-surface` / `node-specification` / 各 capability spec | 可测试的 CLI、state、consumer 行为 |

不要在 policy/config 中复制具体 envelope 字段、state record schema 或命令参数；它们只引用对应
capability 的权威规格。无需新增 capability，治理文本归 `framework-charter`，具体行为归现有
capability。

## 决策 / 方案

推荐只建 **3 个 OpenSpec change**。少于 3 个会把状态协议、迁移事务和视觉语言三个不同风险面
塞进同一次实现与回滚；多于 3 个则会把同一用户旅程拆成互相等待的小补丁。

### Change 1: `make-html-production-guided-and-recoverable`

**目标**：先恢复从 pilot 到 build/delivery/Image2 的真实可达性，并把人本 Gate 政策写入
OpenSpec、Charter、CLI 和 state consumer 契约。

**吸收 bug**：BUG-016、017、018、019、020、021、023、024、027、029、030、031（12 个）。

**预计修改 capability**：`framework-charter`、`cli-surface`、`node-specification`、
`pipeline-orchestration`、`playbook-execution`、`notes-injection`、`html-slide-rendering`、
`visual-slot-refinement`、`image-generation`。Proposal 必须逐项核对 main spec 后再确认，不能因为
文件会改就虚列 capability。

**为什么合并**：这些问题共享同一条验收链和同一组权威对象：current plan 投影、version-scoped
state、CLI diagnostic、review/delivery 决定以及可选 Image2 continuation。单修 016 仍会在
019/020/021 再次阻塞；单做 `--force` 又会掩盖 018/019 的契约错误。

**主要范围**：

- 用同一 canonical projection 重建/验证 content 与 visual review plan；重建 visual plan 时带上
  已发布 composition evidence，消除 body projection 和 composition 缺失造成的永久 stale；
- 让 diagnostics 返回具体 mismatch path、expected/actual、受影响 slide/recipe、推荐命令；
  expected/actual 必须 bounded、secret-safe，不能泄露 provider body、prompt 或 `.env`；
- 保留 `approved` 与显式风险接受的语义区分，统一 `--waive` / `--force --reason` 的用户语言。

**命令级 override matrix**：

| 命令 | 默认阻断条件 | 用户选择后的行为 | 仍然 hard stop |
|---|---|---|---|
| `approve content/visual` | current plan 缺失、过期或 `approvable=false` | `--waive --reason` 在现有 gate owner 下写入绑定当前 source/reset/version 与失败快照的 waiver；不伪造 review plan | source 无法解析、版本/reset 身份不明、journal 冲突 |
| `build` | content/visual evidence pending/stale | `--force --reason` 通过同一 gate publication authority 为未满足 gate 发布 current waiver，再继续组装；不新增 build 状态权威 | bundle/source 结构无效、CAS/journal/reset 冲突 |
| `state --record-delivery-review proceed` | reviewable PPTX/contact sheet 存在，但 lineage receipt 缺失或 stale | `--force --reason` 在 `html-delivery-review` 下记录 `proceed` + evidence waiver，绑定现有产物与缺失项 | 没有可供用户审阅的目标产物、无法确认版本、并发写、state 损坏 |
| `image2 plan` | 当前 HTML/final slide/slot 存在，但 delivery review 未 current | `--force --reason` 在 `image2-refinement` 记录 prerequisite waiver 并生成离线 plan；`authorize` 仍须显式确认，`generate` 仍需 credentials | 目标/slide/slot 身份不确定、基础 HTML 资产不存在，或 provider 未授权 |

`--force` 的 reason 必须非空、长度受限，并进入审计记录；帮助文本先给推荐修复路径，再显示
continuation 命令。命令名、reason 限制和 receipt 字段在 proposal/spec 中固定，不留“最终再定”。
普通 `approve` 仍要求 exact current plan hash；`approve --waive` 可以在 plan 不完整时改绑当前可计算
projection，但任何调用方显式传入且不匹配的 hash 都必须 hard stop，不能猜测其真实意图。

所有 waiver/override 都复用现有 reserved node 与其 publication/CAS authority，不新增顶层 state
container、第二份 readiness 真相或只存在于 history 的授权。Current waiver 可以满足相应 continuation
条件，但必须保留 `decision/status: waived`，并独立记录 `evidence_complete` 与具体 `waived_checks`：
证据不完整时为 `false` 且 checks 非空，证据完整但用户仍选择 waiver 时可为 `true` 且 checks 为空；
后续 source/reset/version 漂移照常使它 stale。

- build、delivery-review、Image2 plan 对可逆证据风险提供上述可审计 continuation；identity-current
  waiver 可以继续，但不能伪造 `approved` 或从 waiver 决定推断证据完整性。State 记录当时失败项、
  当前 source/reset/version 身份和用户 reason；
- 把 source 身份拆成 deterministic projections：`content_review_fingerprint_v1` / visual
  projection 排除 speaker notes，`notes_source_fingerprint_v1` 只覆盖 notes，结构/recipe/source
  变化仍使对应 content/visual owner stale。不能继续用一个 raw `source_sha256` 让 notes-only 修改
  击穿所有 gate；raw SHA 可以保留为 provenance，但不能单独决定 gate freshness；状态输出必须
  显示 stale owner 与最小重跑命令。优先复用 main spec 已定义且排除 notes 的
  `content_review_fingerprint_v1`，不要再造等价投影；
- 采用 canonical version key `3_versions/vN`，不为迁就手工直觉改变现有 state 结构。
  `state --validate-state` 为只读校验入口，报告 unknown/missing/extra key、`vN` 与 canonical key
  的误用、SHA 长度/磁盘引用和 17-field delivery record 的逐字段差异；提供明确的 normalize/repair
  建议，默认不静默改写 state；
- delivery record schema 同时进入公开 capability 文档和机器校验输出，避免用户手工拼接 17 个字段；
- CLI 为 Phase 4 构造正式 transport adapter：优先复用既有 `IMAGE2_API_KEY`、`IMAGE2_BASE_URL`、
  `--base-url` 与 `resolveVendors` credential authority，不复制一套 parser。先做 provider payload/
  reconciliation compatibility spike；若 modern visual-slot API 与 legacy whole-page API 不兼容，
  在同一个 change 内明确新增 adapter contract，而不是把凭据偷偷注入 Phase 3 或放宽 Phase-4
  authorization；
- notes blockquote parser 接受 `> **SPEAKER NOTE**\n>\n> content`；
- 更新 OpenSpec policy/config、Framework Charter、playbook consumer 指引与对应 main specs。

**必须验收**：

1. 标准路径：pilot → approve content/visual → build → delivery proceed → image2 plan/authorize/generate；
2. 引导路径：stale/missing evidence 给出原因、推荐命令和明确 continuation，不让用户读源码；
3. override 路径：用户带 reason 继续，state 可审计，status 不把 waiver 冒充 fresh approval；
4. hard-stop 路径：并发 journal、错误 exact hash、未授权远端调用仍拒绝，并说明保护的不变量；
5. notes-only 修改只触发 Stage 5 与 delivery review；现有 legacy 行为不回归。

### Change 2: `complete-markerless-html-migration`

**目标**：把文档中的 markerless → clean HTML vNext 从“要求 Agent 先手工造好一切”变成可发现、
可准备、可预览、可提交的真实工作流。

**吸收 bug**：BUG-022、025、026、028、032（5 个）。

**预计修改 capability**：`cli-surface`、`commands-reference`、`content-parsing`、`visual-config`、
`pipeline-orchestration`、`playbook-execution`、`run-bundle-management`。

**为什么合并**：032 是 028 的现场证明；palette 初始化、source preamble 兼容和生成目录 hygiene
都是同一 migration prepare/preview 能否进入的前置条件。

**主要范围**：

- 为 markerless 输入提供 prepare/readiness 阶段：机械创建 isolated projected-run、HTML palette、
  asset manifest/state/metadata/template 骨架和逐页 authoring checklist；
- 固定公开入口为 `ppt_flow migrate-html <run-dir> prepare --preset <name>`：只写
  `_scratch/html-migration/projected-run/`，不修改 source version、不创建 visible vNext、不发 provider
  请求。`preview` 在 candidate 未准备好时只返回 exact `prepare`/authoring next action，不偷偷代替
  prepare 写文件；
- Agent 仍拥有从 IMAGE PROMPT 到 structured SLIDE BODY 的创意判断。MJS 不从 prompt 猜 family/body，
  但会指出每页缺什么并给下一条可执行命令；
- `migrate-html preview` 遇到裸 markerless source 时进入引导/prepare，而不是只报 marker missing；
- palette 由 preset 和 legacy tokens 确定性初始化，校验失败显示字段级 diff；
- slide parser 在首个合法 slide 前允许 preamble/section 标题；在 slide 区域内，只有精确的
  `## Slide <number>:` 才是 slide heading。数字候选的 malformed heading 仍报错，避免把真正的
  slide typo 静默吞掉；
- HTML production/migration topology 只忽略显式 allowlist 中的 `.DS_Store`，不泛化忽略所有
  dotfile，也不忽略 `.publish.lock`、journal 或未知隐藏文件；
- preview/apply 继续保留 exact hash、isolated render、no-provider、no-replace publication 等不可
  override 的事务安全边界。

**必须验收**：用最小但真实的 markerless fixture，从首次命令开始得到 prepare 指引，Agent 补齐
structured body 后，preview 与 exact-hash apply 生成 clean vNext；重复运行幂等，失败不污染 source
version，不读取或复制 legacy generated bytes 作为 HTML 权威。

### Change 3: `expand-html-visual-language-and-review`

**目标**：让 HTML-first 从“排版正确”升级为可表达信息关系的 presentation，同时保留确定性、
本地渲染和结构化输入。

**吸收 bug**：BUG-014、015（2 个）。

**预计修改 capability**：`html-slide-contract`、`html-slide-rendering`、`visual-config`、
`visual-asset-management`、`run-bundle-layout`、`pipeline-orchestration`。

**为什么单独一个 change**：这不是小修，而是 slide contract、component registry、geometry、renderer
和视觉验收的产品能力扩展；与状态/迁移事务混在一起会使回归定位和回滚不可控。014 的 review
导航正好作为新视觉能力的人工验收面。

**主要范围**：

- 先用代表性 deck 场景收敛并冻结最小概念图 grammar（第一版至少覆盖 flow、layered architecture、
  relationship、timeline 四类，以及可组合的本地图标）；不开放任意脚本/任意 HTML 注入。先完成
  contract/geometry spike，若四类无法在 closed schema 下表达，则回写 design/spec，不直接扩张实现；
- 内置 icon registry 必须本地、版本锁定、许可证可分发，并进入 dependency/coherence fingerprint；
  不从 CDN、系统字体或运行时网络加载图标；
- structured body 明确表达节点、关系、层级和强调，CSS/SVG 负责确定性绘制；ECharts 继续服务
  数据图，不用它冒充所有概念图；
- hero/split/comparison/quote/visual-focus 可消费受限的视觉 primitive，并有容量/overflow 诊断；
- 保留 CAS hash 文件作为 immutable object；额外同时发布 `preview/index.html`（人工 review 入口）
  和结构化 `slide_map.json`（机器/脚本入口），以当前 position、stable `slide_id`、title、对象 SHA
  和相对链接定位 HTML/PNG；
- 用 renderer fixtures、像素非空/边界检查、contact sheet 和人工代表页审阅验证视觉质量。

**必须验收**：至少一组非数据型关系页、比较页和 hero 页能通过 structured source 产生信息承载型
视觉，而非装饰背景；每种第一版 primitive 至少有一个正常 fixture 和一个 overflow/error fixture；
25 页产物可从 `index.html` 按 slide_id 定位，`slide_map.json` 与 manifest 一致；CAS、manifest 和
deterministic render 不回归。

## Bug-to-change 追踪

| Bug | Change | 必须闭环的行为 |
|---|---|---|
| 014 | 3 | `index.html` + `slide_map.json` 按 slide_id 定位 CAS objects |
| 015 | 3 | 四类概念图 primitive、icon composition、容量诊断与视觉 fixtures |
| 016 | 1 | pilot 后 exact current plan 可 approve；失败给 mismatch |
| 017 | 1 | approval 故障不再让 build/Image2 永久不可达 |
| 018 | 1 | pilot/readCurrentPlan body projection 完全一致 |
| 019 | 1 | visual plan 重建读取 composition evidence |
| 020 | 1 | approve/build/delivery/image2 各有带 reason 的可审计 continuation |
| 021 | 1 | CLI 可构造 Phase-4 transport，凭据与授权边界不漂移 |
| 022 | 2 | preset/legacy palette 确定性初始化与字段 diff |
| 023 | 1 | blockquote 空行不再使 Stage 5 丢失 notes |
| 024 | 1 | canonical version key 保持，错误 key 有明确诊断/修复建议 |
| 025 | 2 | 仅 `.DS_Store` 等明确系统文件可忽略 |
| 026 | 2 | preamble 可用，slide typo 不静默吞掉 |
| 027 | 1 | delivery schema 文档化且 mismatch 可逐字段诊断 |
| 028, 032 | 2 | markerless prepare → Agent authoring → preview/apply 真实可走通 |
| 029 | 1 | 校验失败提供 bounded expected/actual/path |
| 030 | 1 | notes-only 与 content/visual stale owner 分离并可解释 |
| 031 | 1 | `state --validate-state` 只读校验 unknown/key/SHA/引用问题 |

## 顺序与依赖

```text
Change 1: policy + lifecycle correctness + override
       |
       +----------> Change 2: migration closure
       |
       `----------> Change 3: visual language + review index
```

先做 Change 1，因为 016–021 会阻断后两个 change 的可信端到端验收。Change 2 与 Change 3 在契约
上可独立：迁移工具生成规范化 structured source，不推断视觉 family；视觉 grammar 应以 additive
方式演进。Change 2 可在 Change 1 的 contract 完成后优先交付 P0 migration；Change 3 的 grammar
spike 可以并行，但实现和 migration fixture 的最终基线必须使用已归档的 main specs。

每个 change 都先 `openspec propose` 生成 proposal/specs/design/tasks，严格校验后才 apply；不在一个
change 尚未归档时让后续 change 复制其尚未成为 main spec 的契约。

## 验证与完成判据

每个 change 的 proposal/design 必须把下表转成具体 tasks；只改代码或只让单元测试通过都不算完成。

| Change | Unit / contract | Integration / CLI | E2E / 人工证据 |
|---|---|---|---|
| 1 | review projection equality、composition reload、stale matrix、notes parser、state/delivery diff、override record validation | 每个 override 命令的 normal/guide/force/hard-stop exit、JSON envelope、secret redaction；fake HTTP 验证 Phase-4 submit/reconcile | fixture 从 pilot 跑到 delivery 与 optional Image2；notes-only refresh 不重开无关 gate；无真实 provider 费用 |
| 2 | palette scaffold、heading grammar、`.DS_Store` 精确 allowlist、migration plan hash/idempotency | markerless 首次调用得到 prepare action；preview/apply/recovery 的 success/drift/conflict/no-provider 分支 | 真实形态 markerless fixture 生成 clean vNext，失败不污染 source/target；人工核对 authoring handoff 清楚 |
| 3 | 四类 primitive schema/geometry、icon registry、capacity/overflow、slide map 与 manifest 一致性 | pilot/build 发布 index/map，链接只指向当前 manifest 的相对 CAS objects | desktop/canonical canvas 截图、非空像素/越界检查、代表页人工 visual review；重复渲染 SHA 稳定 |

每个 change 的统一退出条件：

1. 所覆盖 bug 在 change artifacts 中有 requirement/scenario/task/test 的可追踪链，不能只在 proposal
   列出编号；
2. `openspec validate <change> --strict` 通过；main spec 修改在 archive 前完成一致性检查；
3. targeted tests、`npm test`、`npm run test:e2e` 全部通过；若存在基线失败，必须记录精确测试与
   独立原因，不能用笼统“pre-existing”跳过；
4. CLI failure envelope、stdout JSON、stderr diagnostic 和 command-return audit 同步；
5. 不使用 `deck_*` 生产数据作为测试夹具，不修改 `_generated/`，不进行未授权远端调用；
6. 完成后按 bug README 流程归档对应卡片并校正 P0/P2 计数。

## 风险 / 取舍

- **[风险] Change 1 横跨较多 capability** → 用一条 lifecycle e2e 作为纵向完成线，tasks 内按
  policy/projection/state/CLI/Image2/tests 分段；transport compatibility spike 是第一批任务，
  BUG-021 未形成可用 CLI transport 前 Change 1 不得完成或归档。
- **[风险] `force` 被误解为跳过所有安全检查** → policy 和 specs 用 gate 分类表逐项列出可覆盖与
  不可覆盖条件；所有 override 必须绑定当前版本/来源身份、reason 和失败快照。
- **[风险] warning 太多仍会吓到新手** → 默认输出只给“发生了什么、推荐动作、继续动作”；内部
  hash/path 放进结构化 diagnostic，不要求用户手工编辑 state 或 `_generated/`。
- **[风险] 单一 source hash 继续造成过度失效** → 在 Change 1 的 design 阶段先用 notes-only、
  header/body、palette/recipe、结构编辑四类 fixture 验证 projection/stale matrix，再实现 CLI；
  projection 不通过时不得声称 BUG-030 已解决。
- **[风险] override 记录被误认为审批通过** → readiness/status 必须分别显示 `decision`、identity
  `freshness` 与 `evidence_complete`；`waived_checks` 对人和 JSON 都可见。Delivery proceed 的用户决定
  不能单独提升 content/visual readiness。
- **[风险] `.DS_Store` 修复扩大为隐藏文件白名单漏洞** → 只接受明确 basename + 所在 topology，未知
  hidden entry 仍报错。
- **[风险] migration 自动化越界替用户做创意判断** → MJS 只做机械 scaffold/validate/transaction，
  Agent 编写和解释 structured body，用户保留内容与视觉决定。
- **[风险] 视觉 grammar 一次扩得过大** → 以代表性信息关系覆盖为准，不以组件数量为目标；先固定
  closed schema、容量与可测 geometry，再扩 family。
- **[风险] 新 policy 成为重复事实源** → policy 只定义设计判断法；runtime 细节只存在于 Charter
  与 capability specs，config 仅保存摘要和引用。

## 落地关联

计划对应后续三个 OpenSpec change：

1. `make-html-production-guided-and-recoverable`
2. `complete-markerless-html-migration`
3. `expand-html-visual-language-and-review`

本计划本身不实现 bug、不修改 framework、不触碰现有 `deck_*` 生产数据。每个 change 完成后按
bug 卡片流程移动其覆盖的 bug；全部归档且 main specs 同步后关闭本 plan。
