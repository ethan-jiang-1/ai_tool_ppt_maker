# Plan: Progressive Page Image Integrity and Usability Repair

> 类型: 设计 | 更新: 2026-08-08 | 状态: 活跃（Changes 1–5 已归档；BUG-055/056/059/060/062/063 已归档；BUG-057 等待既有授权流程下的人类 Pilot）

## 当前进度（2026-08-08）

Change 1、2、3 均已完成实现、受保护基线验证、main-spec sync 和 OpenSpec archive。Change 3 归档于
`openspec/changes/archive/2026-08-08-add-human-artifact-reference-view/`；其完整覆盖的 BUG-056、063 已移至
`_done/_fixed_bugs/`。BUG-062 的产品边界已收敛为“机器 JSON 保持不变、Agent 不原样转述成功回执”；
Change 5 `add-human-cli-handoff-guidance` 已实现、验证、main-spec sync 和归档。它在 Charter 中将每个
successful direct Harness CLI 的人类转述收敛为 Purpose / Outcome / Next human action；current Page Image
额外使用现有 provider-free `image2 artifact-view` 的 stable IDs、typed display refs、read-only locators 和
bounded unavailable facts。普通 CLI success JSON、完整 SHA 参数、selector grammar 与运行时协议均保持不变；
BUG-062 已移至 `_done/_fixed_bugs/`。

Change 4 `bind-pure-deck-visual-system` 已完成 provider-free implementation/validation。它以
`visual-config`、`image-generation` 和 `run-bundle-layout` 三个 capability 定义并落实 version-level
Pure visual-system source/binding：新 bundle 获得闭合、可 version override 的
`pure-deck-visual-system.yaml`；Pure Core、raw contract、compiled provider input、ordinary/progressive raw plan 和
inspection 绑定同一 `deck_visual_system: { sha256, projection }`，而 common binding 的
`deck_visual_system_sha256` 为 Pure 必填、Framed 严格为 `null`。Style Master 保持已选色彩/参考 authority；编辑
Pure token 只产生既有的 raw rebuild debt，不生成或重选 Style Master candidate，不改变 source receipt 的
`slide-specifications.md` byte hash，也不写入 State 或历史 evidence。旧 Pure receipt fixture 已修复，
`tests/04-pure-image/test_pure_workflow.mjs` 为 14/14 通过。新增/相关 focused tests、protected `npm test`、
`git diff --check`、change strict 与 all-spec strict 已通过；未执行 provider-backed E2E 或 Pilot。

这些结果证明输入绑定和失效边界，不证明 provider 输出像素已经遵守该系统。下一步须通过既有的成本授权与
Complete Page Review，对三张内容/构图需求不同的 Pure 页进行人类视觉验收；这不是新 gate。

## 执行看板（2026-08-08）

- [x] **Change 0**：归档 `add-jpeg-delivery-media`。
- [x] **Change 1 / BUG-059、BUG-060**：完成 raster projection integrity 修复、验证、main-spec sync 与归档。
- [x] **Change 2 / BUG-055**：完成有界 provider response-shape diagnostics、验证、main-spec sync 与归档。
- [x] **Change 3 / BUG-056、BUG-063**：完成 human artifact reference view、验证、main-spec sync 与归档。
- [x] **Change 4 / BUG-057（provider-free 部分）**：完成 Pure deck visual-system binding、验证、main-spec sync 与归档。
- [x] **Release**：确认并完成 `0.24.4 → 0.25.0` MINOR bump。
- [ ] **BUG-057 人类 Pilot**：等待人类指定真实 `runDir`、三张代表页与该 exact plan/batch 的 provider 成本授权；尚未产生 provider 请求。
- [x] **BUG-062 产品探索**：确认普通 CLI JSON/精确 SHA 是 machine contract；`artifact-view` 是现有的人类检查面，但不会自动阻止 Agent 原样转述成功 JSON。
- [x] **BUG-062 proposal**：已创建 `add-human-cli-handoff-guidance`，包含 proposal、`harness-charter` delta spec、design 与 tasks。
- [x] **BUG-062 polish**：两轮 planning-only 审查、change/all-spec strict、diff check 与 `npm test` 均通过；随后取得人类 `APPLY` 授权。
- [x] **BUG-062 apply / validate / sync / archive**：Charter/test 已实现；focused handoff 5/5、protected `npm test`、change/all-spec strict 与 diff check 均通过；main `harness-charter` spec 已同步并归档 change。没有 provider 工作、CLI schema、state/receipt/immutable-record 或 production run-bundle 改动。

## 下一步队列（2026-08-08）

没有 active OpenSpec change。不能将 provider-free binding 结果误作付费 Pilot 的替代，也不能直接修改
machine JSON 来“顺手”关闭 BUG-062。

| 优先级 | Owner | 下一项 | 进入条件与完成条件 |
| --- | --- | --- | --- |
| P0 | Maintainer | **release bump** | 已确认并完成：`0.24.4 → 0.25.0`（MINOR）。Change 4 修改既有 Pure 行为：旧 current Pure run 缺少明确 source record 时会 hard-stop，而不是静默采用历史输入；按 `project-versioning` 的 breaking-change 规则，MINOR 比先前仅覆盖 Changes 2/3 的 `0.24.5` PATCH 建议更准确。`VERSION`、`VERSION_LOG.md`、`ppt_maker_harness/README.md`、`package.json` 和根 package-lock 元数据已同步。 |
| P1 | Human + Agent | **BUG-057 三页 Pure Pilot** | 人类指定真实 deck 的 canonical `runDir`、三张具有 editorial narrative / metric-data-led / process-relationship-led 需求的页，并明确授权该 exact plan/batch 的 provider 成本。随后复用既有 Pilot/Complete Page Review；跨页检查 hierarchy、Style-Master-derived colour use、zones、whitespace 和 layout-family discipline。通过才可将 BUG-057 移至 `_done`；修复则回到 source edit → raw rebuild。无需新的 Harness OpenSpec change。 |
| P2 | Agent + Maintainer | **BUG-062 人类 handoff guidance** | **已完成并归档。** `add-human-cli-handoff-guidance` 将所有 direct Harness CLI success 的人类摘要与 machine payload 分离；current Page Image 额外使用 provider-free、collision-aware `image2 artifact-view`。不新增 `--short-refs`、不截短 CLI 控制键、不改 CLI schema、目录内容寻址或 selector grammar。版本建议为 PATCH `0.25.0 → 0.25.1`，待 maintainer 确认后才修改 release surfaces。 |

Change 3 已完成：main specs 已同步并归档至
`openspec/changes/archive/2026-08-08-add-human-artifact-reference-view/`。Change 4 已完成：main specs 已同步并归档至
`openspec/changes/archive/2026-08-08-bind-pure-deck-visual-system/`。两者均不再是 active implementation work。

## 背景 / 现状

本计划吸收 BUG-055、056、057、059、060、062、063 的分诊结论。它们不应按卡片逐个修补，
而应按四个稳定责任面收敛：

| 责任面 | 对应 bug | 当前缺口 |
| --- | --- | --- |
| Raster projection integrity | 059、060 | 已完成：共享 projector 已覆盖所有审计到的 derived canvas seam；16-bit/RGB provider PNG 和 Chromium RGB screenshot 不再被错误当作 8-bit RGBA。 |
| Provider diagnosis | 055 | 已完成：完整读取的非 JSON 响应在既有 `invalid_json` fact 中以闭集 shape 区分 empty、HTML-like 与 other，不泄露 provider 数据或改变成本控制。 |
| Human artifact navigation | 056、062、063 | 已完成：BUG-056/063 由 explicit logical reference view、locator/type/purpose handoff 和 typed display refs 解决；BUG-062 以 Agent 成功交接规则解决，普通 CLI JSON 与 exact SHA 继续仅作 machine/control contract。 |
| Pure deck visual system | 057 | 已完成 provider-free binding：Pure 每页共享闭合 deck-level typography、colour-use、zones、whitespace 和 layout-family projection；尚待真实三页 Pilot 的人类像素验收。 |

`add-jpeg-delivery-media` 已于 2026-08-08 完成 main-spec sync 并 archive。其 delivery contact
projection 仍是 raster-to-canvas 调用点，因而纳入 Change 1；不再有两个 active change 重叠拥有 delivery
行为。

另外，`tests/04-pure-image/test_pure_workflow.mjs` 的 pre-replacement receipt fixture 已在 Change 4 中修复：
它现有 ordered `position` 且不再携带 retired per-slide `workflow`，focused suite 为 14/14 通过。该修复是
视觉系统实现前的绿色基线，不改变 provider/lifecycle ownership。

## 目标架构

```text
exact provider/screenshot PNG bytes
              |
              | immutable evidence stays unchanged
              v
      shared decoded-PNG projector
  validates depth/channels/byte count
  normalizes only derived pixels to RGBA8
              |
     +--------+---------+----------+
     |                  |          |
Style Master JPEG   Framed crop   review/delivery projections

owner records (full SHA-256, unchanged)
              |
              v
rebuildable human reference view
short typed display refs + artifact locators
              |
              v
Agent/user inspection only; never a selector, authority, or storage alias
```

Pure remains a separate branch: it binds one selected deck-level visual-system digest into every
provider input, while preserving Pure's rule that the provider page is the complete-page evidence.
There is no local Text Frame/compositor fallback for Pure.

## 决策 / 方案

### D1. 用一个深模块统一“decoded PNG -> derived RGBA8 pixels”

新增一个 internal shared module，提供小 interface：接受已验证的 decoded PNG 或 bytes，返回经过
严格 shape validation 的 opaque/alpha-preserving RGBA8 pixel buffer，或给出有限的输入不支持结果。
模块内部处理 8/16-bit 和 1/2/3/4 channel；调用方不再自行推断 `data.length`、row stride 或直接把
decoder buffer 写入 canvas ImageData。

这是正确的 seam：复杂的 depth/channel 转换、16-bit downsampling、grayscale expansion、alpha 填充和
长度校验只在一个地方出现；Style Master compatibility JPEG、Framed screenshot crop、complete-review/
inspection projection 和 delivery projection 只消费标准 RGBA8。原始 PNG bytes、hash、native dimensions、
selection 和 provenance 绝不改变。

### D2. 诊断只公开有限的“响应形状”，不公开响应内容

BUG-055 不增加 retry、failover、第二授权或持久状态。它扩展既有 known-failure 的 secret-safe facts：
解析失败时，只能报告有限枚举的本地分类（推荐至少区分 empty、HTML-like 和 other-non-JSON），不得输出
header、length、body digest、body 片段、task id 或 provider 名称。分类由同一 response reader 产生，
Style Master 和 Page Image 共用；其唯一作用是让已有的最近合法动作更可诊断。

此决策在 proposal 前须由 maintainer 明确确认：`HTML-like` 这类派生分类是否符合现有“不暴露 provider
response body”的保密边界。默认不采纳原 BUG 提出的 content-type/length/digest。

**确认（2026-08-08）**：允许在现有 `invalid_json` known-failure fact 中增加闭集
`response_shape: empty | html_like | other_non_json`。它仅表达本地 reader 对完整已读 body 的有限判断；不得
公开 header、长度、digest、body 片段、provider/task 身份，也不得改变 retry、授权、submission 或持久状态。

### D3. 人类 display layer 与 immutable protocol 完全分离

完整 SHA-256 继续是 records、directory names、CAS locks 和 CLI precise arguments 的唯一真实键。
短引用只作为 typed、collision-aware display reference；它不得反向作为 lifecycle selector。

为解决用户浏览而非重写存储，推荐创建可重建的、run-scoped human reference view：用短引用、stable
slide/candidate ID 和 confined absolute artifact locator 组织 Style Master、provider input、raw/review、final,
PPTX、notes 和 delivery receipt。它可被 Agent 的用户提示直接引用；其条目不是编辑许可，不是
authorization，也不成为 immutable roots 下的 alias/symlink。

该方案将 BUG-056 的“每项可定位”、BUG-062 的“可读短引用”、BUG-063 的“短入口导航”收敛成一个
display-only projection，而不破坏 store 对 64-hex real directory 的验证。它不承诺把物理目录变成可
`cd` 的短路径；若这一点是不可协商需求，必须另立 protocol/migration change。

### D4. Pure 固定系统，provider 仍拥有全部页面像素

新增一个选定的 Pure deck visual-system profile。它只包含视觉 token：type hierarchy、字体风格、
颜色使用、标题/正文区域、grid/whitespace 和可用 layout family；不包含源文字、具体 claim 或自由
prompt ingress。其 canonical digest 进入 Page Image Core、raw contract、compiled provider input、plan
和 inspection projection，以便 token 变化精确触发 raw rebuild。

实际输出一致性仍要经过 human Complete Page Review；prompt/digest 测试证明“同一规则被提交”，不能伪称
证明 provider 像素相同。禁止把 Framed Text Frame 迁入 Pure，除非未来另行改变 Pure 完整 provider-page
语义。

## Progressive OpenSpec Changes

| 顺序 | 建议 change | 覆盖 | 主要 capability | 依赖 / 完成条件 |
| --- | --- | --- | --- | --- |
| 0 | archive `add-jpeg-delivery-media` | 既有完成 change | 已有 delivery capabilities | 已完成：先同步 delta specs，后 archive；不与后续 raster change 重叠。 |
| 1 | `harden-page-image-raster-projections` | BUG-059、BUG-060；审计发现的同类 derived projection exposure | `style-master-generation`、`html-render-runtime`、`image-generation`、`image-production` | **已完成**：通过 protected baseline、主 spec sync 后归档至 `openspec/changes/archive/2026-08-08-harden-page-image-raster-projections/`；BUG-059/060 已移入 `_done/_fixed_bugs/`。 |
| 2 | `add-bounded-provider-response-shape-diagnostics` | BUG-055 | `image-generation`、`cli-surface`、`style-master-generation` | **已完成**：主 spec 已同步，change 已归档至 `openspec/changes/archive/2026-08-08-add-bounded-provider-response-shape-diagnostics/`，BUG-055 已移入 `_done/_fixed_bugs/`。仅 `empty` / `html_like` / `other_non_json`；无 retry，Style Master 不新增持久化或 CLI field。 |
| 3 | `add-human-artifact-reference-view` | BUG-056、BUG-063（BUG-062 仍活跃） | `harness-charter`、`run-bundle-layout`、`image-generation`、`cli-surface`、`node-specification` | **已完成**：main specs 已同步，change 已归档至 `openspec/changes/archive/2026-08-08-add-human-artifact-reference-view/`；显式 provider-free `image2 artifact-view` 重建 run-scoped logical view；所有人类检查 handoff 都有 locator；storage/CLI exact args 与普通 machine JSON 不变。BUG-056/063 已移入 `_done/_fixed_bugs/`。 |
| 4 | `bind-pure-deck-visual-system` | BUG-057 + Pure fixture baseline | `visual-config`、`image-generation`、`run-bundle-layout` | **已完成**：main specs 已同步并归档至 `openspec/changes/archive/2026-08-08-bind-pure-deck-visual-system/`；closed deck-authored source record 已进入 Pure Core/raw contract/compiled input/plan binding；`deck_visual_system_sha256` 为 Pure-required / Framed-null 的 common binding slot，并在 ordinary/progressive raw-plan validation、invalidation、inspection 和 fixtures 同步。Style Master 保持色彩/参考 authority、不扩大 candidate scope。14/14 Pure fixture、focused suites、protected baseline 和 strict checks 已绿；仅待既有成本授权下的三张 representative Pilot 供人类视觉判断。 |
| 5 | `add-human-cli-handoff-guidance` | BUG-062 | `harness-charter` | **已完成**：main spec 已同步并归档至 `openspec/changes/archive/2026-08-08-add-human-cli-handoff-guidance/`；成功 direct CLI 对人只报告 Purpose / Outcome / Next human action，当前 Page Image 状态/行动用重建的 typed artifact view。普通 success JSON、full SHA CLI 参数、content-addressed storage 和 selector grammar 保持不变；BUG-062 已移入 `_done/_fixed_bugs/`。 |

Change 1 已在 2026-08-08 完成实施、验证、主 spec sync 和 archive：共享 raster projector 覆盖 Style
Master compatibility JPEG、Framed capture、Page Image review 与 delivery contact projection；delivery 还在
任何 final-root 写入前预计算 JPEG/contact projection，失败不改变已有 final artifacts。聚焦 90 项测试、
protected `npm test` 与归档后的 all-spec strict validation 均通过。

Changes 2 和 3 都是 display/control 变化，可在 Change 1 archive 后依次进行；不共享 durable lifecycle
state。Change 2 已在 2026-08-08 完成实施、主 spec sync 与 archive：两轮 planning-only review 解决了 Style
Master 不应持久化或投影该 diagnostic fact 的边界问题；9/9 tasks、74 项 targeted Image2 tests、12 项 process
diagnostics、`npm test`、change strict、all-spec strict 与 `git diff --check` 均通过。BUG-055 已按其“无安全
响应可见性”范围修复并归档；provider TLS 行为与自动 retry 仍为独立决策。Change 4 最后，因为它必须把
“统一”的 token 约束与最终人类视觉判断清楚分开，且后者有 provider 成本。

Change 3 已于 2026-08-08 完成 proposal、五份 delta specs、design 和 tasks；两轮 planning-only polish 已复核
proposal/spec/design/tasks 的完整链路，以及 Image2 dispatcher、task-projection tail、Style Master/raw/delivery
owner readers 与 architecture boundary。实施后的 `artifact-view` 在 generic Image2 task-projection tail 前返回，
保持 `_state` 不变；它从 public owner inspector 组成 Style Master、provider input、Pure/Framed Pilot、Complete
Page Review、final、PPTX、notes 和 delivery 的可读 view。渲染器只接受已验证、confined 的文件 locator，并可原子
覆盖手工编辑或删除的旧 view。70 项 focused tests、`npm test`、change strict、main-spec sync、archive 和
归档后的 all-spec strict validation 均通过；BUG-056/063 已归档，BUG-062 仍活跃。Change 4 的 proposal、
specs、design、tasks 经两轮 planning-only polish 后已完成实现。普通与 progressive raw-plan schema 的独立严格
validator 已以一个 `deck_visual_system_sha256` slot 同步扩展，Pure 必填、Framed 固定 null；不能仅改 Core。
`pure-deck-visual-system.yaml` 的 override/backbone resolver、closed parser、source-first failure、Core/raw
contract/compiled input/inspection binding、binding-drift invalidation 和 multi-page provider-free coverage 均已落地。
`tests/04-pure-image/test_pure_workflow.mjs` 的 baseline fixture 已修复至 14/14；focused suites、`npm test`、
`openspec validate bind-pure-deck-visual-system --strict`、`openspec validate --all --strict` 与 `git diff --check`
均通过。像素一致性仍留给已有授权的人工 Pilot/Complete Page Review；本 change 不把 binding 结果误记为 acceptance。

## Proposed Change 质量关

这条质量关适用于本计划的每一个 proposed change，包括 Change 1--4，以及后来为本计划新增的任何
change。它位于 `openspec-propose`（或手工完成 proposal/specs/design/tasks）之后、任何
`openspec-apply-change` 之前：**未通过不得动手实现。**

1. 先确保 proposal、全部 delta specs、design 和 tasks 完整，并通过该 change 的 strict validation。
2. 对 active change 运行 `$polish-openspec-change <change-name>`。它必须至少完成两轮不同的审查：第一轮
   检查 proposal → specs → design → tasks → verification 的整体验证链；第二轮以最高风险的 authority、
   state、兼容性、失败恢复或可验证性问题为中心，查阅权威 source/spec/test 后复核。
3. 可由该步骤修正的遗漏、术语不一致、缺失 task、错误验证边界，必须同步修正 change 内的 artifacts 并再审；
   不能由既有事实决定的产品/权限/风险选择必须升级给人类，结论为 `not ready`，不能以假设进入实现。
4. 只有 polish 的最终结论为 `ready for apply`，且 `openspec validate <change> --strict`、
   `git diff --check`、`openspec validate --all --strict` 以及仓库声明的适用 protected baseline 均通过，才可
   开始 apply。项目级检查的既有失败同样阻止该 change 宣称 ready；必须隔离并记录，不能静默绕过。
5. polish 是 planning-only：不执行 provider 工作、不修改 Harness/test 代码、不标记 implementation task 完成。
   通过后才进入正常的 apply → validate → spec sync → archive 顺序。

## 每个 Change 的验收与验证

### 1. Raster projections

- 真实 fixture 覆盖 8/16-bit 与 1/2/3/4-channel PNG；转换后 RGBA8 长度、alpha 和 dimensions 正确。
- 16-bit RGB Style Master accept 生成可解码、尺寸不变的 compatibility JPEG；既有 `caBX` regression 继续通过。
- Chromium RGB 和 RGBA screenshot 都正确裁出 2000x1125；不透明输入不产生 fabricated transparency；
  单页和 batch 共用同一路径。
- 所有 provider raw bytes、hash、native dimensions、selection/provenance 均保持 byte-identical；只允许
  derived JPEG/PNG/contact projections 改变。
- 定向 unit/integration tests；无 provider E2E。将 audit 找到的每一个 `decodePng -> canvas` 或
  `loadImage(provider bytes)` call site 列入 proposal design，明确改用 shared projector 或证明其输入已固定 RGBA。

### 2. Provider response shape diagnostics

- synthetic `200 + HTML-like`、empty、other non-JSON 和 valid JSON response 都经过同一 reader。
- stdout/stderr/known-failure records 不含 body、headers、length、digest、credential、prompt 或 task id。
- 已有 known-failure vs unknown/reconciliation、single submission 和 no-retry tests 保持不变。
- 只增加有界 fact，不新增 command、state、grant 或人类 gate；失败仍返回原 owner 的一个最近动作。

### 3. Human artifact reference view

- 每一个要求人类查看候选、Pilot/Complete Review、final PNG/PPTX、notes 或 delivery receipt 的 projection/
  guide 都给出 confined absolute locator，并标明 artifact 类型和检查目的。
- 所有 display refs 是 kind-prefixed、collision-aware，按 stable slide/candidate ID 排序；完整 digest 不出现在
  human card 的 display text。
- reference view 从 canonical owners rebuild；删除后不影响 current authority；不能被 CLI 当作 plan/batch/
  attempt selector；不授予 `_generated/` 手工编辑权限。
- current 64-hex storage container checks、CAS/lock paths、record hashes 和 public exact-hash arguments 维持。

### 4. Pure visual system

- 每个 Pure provider input 含同一个 selected visual-system digest 与 deterministic token projection；内容变化只
  改动允许变化的 per-slide facts。
- token 改变导致明确的 raw rebuild debt；未选 token 不造成 invalidation；视觉 token 不能供应/改写 literals。
- 现有 Pure “provider page is complete evidence / no local composite” requirements 保持。
- 修复旧 receipt fixture 后，Pure focused suite 全绿；再以经授权的 multi-page Pilot 做人类视觉 review，确认
  typography、layout、colour 和 whitespace 达到约定的一致性。

### Change 4 后续人工 Pilot 协议（待单独成本授权）

该协议只使用既有 Pure Pilot authorization 与 Complete Page Review，不创建新的 gate、State 字段、selector 或
acceptance 记录。授权前不得提交 provider work。

1. 人类先明确授权恰好三张 Pure slide 的 Pilot 范围，并从同一当前 source/version 选择三种需求：一张
   editorial narrative、 一张 metric/data-led、 一张 process/relationship-led。三页必须有不同的 literals 与
   visual-language selection，且都绑定同一 selected deck visual-system digest。
2. Agent 按既有 exact plan hash/batch authorization 生成并展示 provider complete-page evidence；Pure 不生成
   本地 header overlay、composite 或第二份页面证据。
3. 人类在既有 Complete Page Review 中跨三页评估：title/body hierarchy、Style-Master-derived colour use、
   title/content zones、whitespace 密度，以及是否落在允许的 layout family；同时确认各页仍满足其各自内容和
   构图任务。
4. 通过只证明该 deck/sample 的人工视觉结论；修复则返回现有 source edit → raw rebuild 路径。输入 digest/
   inspection 一致性本身不构成 pixel acceptance，也不会 bypass review。

## 风险 / 取舍

- [把 PNG normalizer 做成另一套媒体 authority] → 只用于 derived pixels；raw acceptance 仍由现有 exact-media
  contract 和原 bytes/provenance owning path 负责。
- [一次修复遗漏某个 canvas 调用点] → Change 1 proposal 必须以 grep inventory 为输入，并让每个调用点有
  明确 disposition；测试至少覆盖 Style Master、Framed capture、review/projection 与 delivery。
- [诊断为排错泄露 provider 数据] → D2 仅允许 closed enum；任何新增字段先以 secret-safety negative tests
  证明不会透出原文、header 或稳定 body fingerprint。
- [短引用碰撞或被误当作 command key] → 只在 scope 内生成带 `~N` 的 display ref；不修改任何 selection/
  authorization parameter grammar。
- [logical view 仍不满足“短物理路径”] → 先交付可浏览、可定位、无协议迁移的版本；若要 alias directory，
  必须新开 migration change，不能藏在 Change 3。
- [Pure prompt 规则被误解为像素保证] → 把 deterministic binding 与 human visual acceptance 分开；无需新增
  quality state、自动 retry 或第二个 acceptance 流程。

## Gate / Control 纪律

- Change 1 的不支持 PNG layout 是 integrity hard-stop：保护 derived rendering 的正确性，修复后 rerun 原 owner。
- Change 2 不改变 provider submission/control；所有 invalid JSON 仍是既有 known failure，避免以自动 retry
  烧掉授权项。
- Change 3 是可重建 display projection；没有新 approval、waiver 或 state，不引入第二套 locator authority。
- Change 4 的 token 定义与最终视觉满意度是人类决策；Agent 可完成 binding/test/prompt 机械工作，但只有在
  明确成本和样本 scope 后才请求 Pilot provider work。

这些边界遵循 `simple-reliable-control`：复用 direct owner facts、短路最早错误、只返回一个最近动作；并遵循
`human-centered-gates` 与 `agent-assistance-and-control`，不把诊断、task card 或 display view 变成证据/
授权真相。

## 进入实施前的三个确认

1. D2 已确认：允许公开 finite `response_shape`（`empty` / `html_like` / `other_non_json`），但不公开任何
   header、长度、digest 或内容。
2. **D3 已确认并完成（2026-08-08）**：接受 logical, rebuildable human reference view 作为 BUG-063 的修复范围；不承诺物理短目录 alias。Change 3 已完成 main-spec sync 并归档至 `openspec/changes/archive/2026-08-08-add-human-artifact-reference-view/`。
3. **D4 已完成 apply 与 provider-free validation**：Pure 保持 provider-owned complete page；closed source record
   指定 typography hierarchy、Style-Master-derived colour use、zones、whitespace 和 permitted layout families。source
   receipt 不吸收 profile digest；canonical runDir 选择 override/backbone record；`deck_visual_system_sha256` 同步
   进入 Core、raw contract、compiled input、ordinary/progressive plan binding、invalidation 与 inspection。14/14
   Pure fixture、focused suites、strict/diff/protected baseline 均已绿；main-spec sync/archive 已完成。之后仅能按
   既有成本授权申请三页 human Pilot，binding 测试不构成像素验收。

确认后，按 Change 1 → 2 → 3 → 4 创建 proposal；每个 change 必须先通过上面的 Proposed Change 质量关，
再进入 apply，archive 后才进入下一项。完成一个 change 后更新对应 BUG 卡，再决定是否移入
`_done/_fixed_bugs/`。
