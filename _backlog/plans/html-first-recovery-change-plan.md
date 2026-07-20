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

## OpenSpec 治理落点

建议在 Change 1 中新增 `openspec/policies/human-centered-gates.md`，作为 **OpenSpec change 的
设计政策**，而不是第二份运行时事实源。`openspec/config.yaml` 做两层接入：

1. `context` 加入简短核心原则和 policy 路径，要求涉及 gate/readiness/validation/error/override
   的 change 先读该文件；
2. `rules.proposal/specs/design/tasks` 分别要求：列出 gate 分类、给出可观察的正常/override/
   hard-stop 场景、说明 hard-stop 所保护的不变量、实现并测试推荐动作与继续动作。

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

**为什么合并**：这些问题共享同一条验收链和同一组权威对象：current plan 投影、version-scoped
state、CLI diagnostic、review/delivery 决定以及可选 Image2 continuation。单修 016 仍会在
019/020/021 再次阻塞；单做 `--force` 又会掩盖 018/019 的契约错误。

**主要范围**：

- 用同一 canonical projection 重建/验证 content 与 visual review plan；重建 visual plan 时带上
  已发布 composition evidence，消除 body projection 和 composition 缺失造成的永久 stale；
- 让 diagnostics 返回具体 mismatch path、expected/actual、受影响 slide/recipe、推荐命令；
- 保留 `approved` 与显式风险接受的语义区分，统一 `--waive` / `--force --reason` 的用户语言；
- build、delivery-review、Image2 plan 对可逆证据风险提供可审计 continuation，但不伪造
  “fresh/current”；state 记录当时失败项、当前 source/reset/version 身份和用户 reason；
- notes-only 修改只失效 notes/delivery 所有者，不静默击穿无关 content/visual review；其他 source
  变化明确显示 stale 原因和最小重跑命令；
- `state --validate`（最终命令名由 proposal/design 定）报告 unknown/missing/extra key、版本 key
  迁移建议和 SHA 格式问题；正常用户不再需要手工构造 17 字段 delivery record；
- CLI 为 Phase 4 构造正式 transport adapter，复用既有凭据/endpoint 约定，同时保持 plan →
  authorize → chargeable generate 的远端授权边界；
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

**为什么合并**：032 是 028 的现场证明；palette 初始化、source preamble 兼容和生成目录 hygiene
都是同一 migration prepare/preview 能否进入的前置条件。

**主要范围**：

- 为 markerless 输入提供 prepare/readiness 阶段：机械创建 isolated projected-run、HTML palette、
  asset manifest/state/metadata/template 骨架和逐页 authoring checklist；
- Agent 仍拥有从 IMAGE PROMPT 到 structured SLIDE BODY 的创意判断。MJS 不从 prompt 猜 family/body，
  但会指出每页缺什么并给下一条可执行命令；
- `migrate-html preview` 遇到裸 markerless source 时进入引导/prepare，而不是只报 marker missing；
- palette 由 preset 和 legacy tokens 确定性初始化，校验失败显示字段级 diff；
- slide parser 只把 `## Slide <number>:` 当 slide heading，允许文档 preamble/section 标题；
- HTML production/migration topology 在所有层级一致忽略批准的系统 dotfiles；
- preview/apply 继续保留 exact hash、isolated render、no-provider、no-replace publication 等不可
  override 的事务安全边界。

**必须验收**：用最小但真实的 markerless fixture，从首次命令开始得到 prepare 指引，Agent 补齐
structured body 后，preview 与 exact-hash apply 生成 clean vNext；重复运行幂等，失败不污染 source
version，不读取或复制 legacy generated bytes 作为 HTML 权威。

### Change 3: `expand-html-visual-language-and-review`

**目标**：让 HTML-first 从“排版正确”升级为可表达信息关系的 presentation，同时保留确定性、
本地渲染和结构化输入。

**吸收 bug**：BUG-014、015（2 个）。

**为什么单独一个 change**：这不是小修，而是 slide contract、component registry、geometry、renderer
和视觉验收的产品能力扩展；与状态/迁移事务混在一起会使回归定位和回滚不可控。014 的 review
导航正好作为新视觉能力的人工验收面。

**主要范围**：

- 先用代表性 deck 场景收敛最小概念图 grammar，例如 flow、layered architecture、relationship、
  timeline，以及可组合的本地图标；不开放任意脚本/任意 HTML 注入；
- structured body 明确表达节点、关系、层级和强调，CSS/SVG 负责确定性绘制；ECharts 继续服务
  数据图，不用它冒充所有概念图；
- hero/split/comparison/quote/visual-focus 可消费受限的视觉 primitive，并有容量/overflow 诊断；
- 保留 CAS hash 文件作为 immutable object；额外发布 `preview/index.html` 和/或结构化 slide map，
  以 position、slide_id、title、缩略图链接到对应 HTML/PNG；
- 用 renderer fixtures、像素非空/边界检查、contact sheet 和人工代表页审阅验证视觉质量。

**必须验收**：至少一组非数据型关系页、比较页和 hero 页能通过 structured source 产生信息承载型
视觉，而非装饰背景；25 页产物可从一个入口按 slide_id 定位；CAS、manifest 和 deterministic
render 不回归。

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
方式演进。按业务优先级建议先 Change 2（P0 migration），再 Change 3。若并行开发，二者都必须以
Change 1 archive 后的 main specs 为基线。

每个 change 都先 `openspec propose` 生成 proposal/specs/design/tasks，严格校验后才 apply；不在一个
change 尚未归档时让后续 change 复制其尚未成为 main spec 的契约。

## 风险 / 取舍

- **[风险] Change 1 横跨较多 capability** → 用一条 lifecycle e2e 作为纵向完成线，tasks 内按
  policy/projection/state/CLI/Image2/tests 分段；若 proposal 阶段确认 transport 需要全新 provider
  protocol，才把 BUG-021 延后拆出，不能静默遗漏。
- **[风险] `force` 被误解为跳过所有安全检查** → policy 和 specs 用 gate 分类表逐项列出可覆盖与
  不可覆盖条件；所有 override 必须绑定当前版本/来源身份、reason 和失败快照。
- **[风险] warning 太多仍会吓到新手** → 默认输出只给“发生了什么、推荐动作、继续动作”；内部
  hash/path 放进结构化 diagnostic，不要求用户手工编辑 state 或 `_generated/`。
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
