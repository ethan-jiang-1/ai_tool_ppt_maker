# Plan: Page Authority 残余 Bug 收敛修复

> 类型: 设计 / 分析 | 更新: 2026-08-03

## 结论

这 8 张 bug 卡不应产生 8 个 OpenSpec change。初始复核将它们按三条系统线收敛为
**最初 2 个** change；真实验收随后发现 `new-version` 无法把 clean Page Authority target
接入 authoring draft，因而新增了一个窄的 activation repair。最终共 **3 个** change，
而不是按八张卡逐张拆分；已合入的语义修复仍只做回归验收和卡片关闭。

| 系统线 | 覆盖 bug | 处理方式 |
| --- | --- | --- |
| Source-to-provider 语义 | BUG-036、BUG-041、BUG-044 | 已由归档 change 实现；做端到端回归与 run-bundle 内容迁移，不新建 change |
| Provider I/O 边界 | BUG-037、BUG-042 | 新建 1 个 change |
| 页序的人类可见投影 | BUG-040、BUG-043、BUG-045 | 新建 1 个 change；BUG-043 作为既有 final 命名的回归项 |
| Clean target activation | 真实 run 验收前置 | 验收中发现；新建 1 个窄 change，已完成并归档 |

最终保持为三个彼此独立、可讨论、可验收、可回归的系统边界，同时避免按八张卡逐张开 change。

## 计数口径

- **3 条工作线**：语义、provider I/O、页序投影。
- **3 个 OpenSpec change（均已完成）**：原计划的 Change 1、Change 2，以及验收中发现的 Change 3。
- **1 条非 change 的语义收尾线**：已由两个归档 change 实现，只需回归验收和指定
  run bundle 的内容迁移。

不建议为了凑数量重开语义线：它当前没有新的 framework 行为契约。Change 3 不是重复
语义线，而是实际 new-version 验收揭示的可达性缺口。

## 背景 / 现状

近期的两个归档 change 已经吸收了一部分最初的问题：

- `fix-provider-clauses-and-visual-scene` 已把每页场景输入建模为显式的
  `VISUAL SCENE`，并把受 guard 的场景与 provider clauses 放入 Pure / Framed
  raw contract。
- `pure-text-delivery-and-nn-production-naming` 已让 Pure raw contract 携带
  `display` 和 `BODY`，并让 final manifest 使用 `NN_slideID.png`。

因此 BUG-036 不应以“把自由 CONCEPT prose 直接塞给 provider”的方式修。正确的
输入是由内容作者将 `Content structure` / `MUST communicate` 中真正要画的部分提炼为
`VISUAL SCENE`；这属于指定 run bundle 的内容迁移，不属于 framework change。

BUG-041、BUG-043、BUG-044 的 framework 行为也已有实现。它们在真实生成 run 上验收
通过后再关闭；若验收失败，回到对应归档 change 的回归测试定位，而不是另开重复 change。

provider 请求的可诊断投影、provider 返回图像的早期介质校验、PPTX 页码，以及 raw 等
人类浏览产物的页序命名一致性均已由 Change 1 / Change 2 完成。当前只缺真实 run 的
人类 Style Master 选择、显式 provider 授权、生成 / review / delivery，以及最终视觉确认。

## Bug 去向

| Bug | 当前判断 | 最终归属 |
| --- | --- | --- |
| BUG-036 | v7 source 的 `VISUAL SCENE` 已迁移并验证；待真实图像语义确认 | 语义回归验收，不新建 change |
| BUG-037 | 入站 PNG 尺寸 / 格式边界已验证；待 live provider probe | Change 1 已归档 |
| BUG-040 | PPTX 页脚 XML 已验证；待真实 delivery 可读性确认 | Change 2 已归档 |
| BUG-041 | Pure 已携带 display、BODY 和 scene；待真实文字可读性确认 | 语义回归验收，不新建 change |
| BUG-042 | request inspection 已由本地 plan 生成；待真实请求回放确认 | Change 1 已归档 |
| BUG-043 | v5 final 25/25 使用 `NN_slideID.png`；待 v7 rebuild 回归 | Change 2 的回归项 |
| BUG-044 | Pure 已携带 `BODY`；待真实图文比例确认 | 语义回归验收，不新建 change |
| BUG-045 | 新 raw / pilot / final 命名规则已由测试覆盖；待 v7 rebuild 文件树确认 | Change 2 已归档 |

在修改 bug 卡状态前，必须跑一次不含远端调用的 fixture 回归；对 BUG-036、BUG-041、
BUG-044 再补一次经授权的真实 run 验收。不能把某个 `deck_*` 当 framework fixture 或
由 change 自动迁移。

## Change 1: `harden-page-authority-provider-boundary`

**目的：** 把“发给 provider 什么”与“provider 返回的 bytes 能否成为 raw 事实”收束到同一
确定性边界，覆盖 BUG-037 和 BUG-042。

**建议 capability：** `image-generation` 为主，`cli-surface` 仅定义显式诊断入口的
输出与保密边界。控制 owner 是 JS；MD / 人类只决定是否查看投影和是否授权新的 provider
提交。对 run bundle 的影响是 `compatible`：新增可重建诊断投影，错误 provider 输出将更早
停止，不手改既有 `_generated/`。

### 必须交付

1. 在计划编译时产生一个可重建、与 `provider_request_sha256` 绑定的本地请求检查投影。
   它只含本次真正要提交的请求文本与非 secret 元数据，绝不含 API key、Authorization header、
   provider response body 或环境变量。
2. 为人类提供显式、按当前 plan / slide 精确寻址的检查路径；默认 JSON、stderr 和失败回执
   只给 digest、相对路径和下一步，不把 raw prompt/prose 无意打印到终端。该选择必须遵守
   `cli-surface` 的 secret-safe diagnostic 规则。
3. 在 selected adapter/provider-result 边界解码返回 PNG，并在任何 raw materialization、
   provenance 或 `succeeded` 状态之前验证精确 `2000x1125` 尺寸。
4. 非 PNG、空 bytes 或错误尺寸必须成为有界的 `known_failure`：记录可诊断的期望/实际介质
   事实，且不留下被接受的 raw bytes、raw digest 或 final 候选。不得静默 resize；resize 会把
   provider 返回的错误事实伪装成合格原件。

### 验收与测试

- Pure 与 Framed 共用该入站校验；合法的 `2000x1125` PNG 保持当前成功路径。
- 错误高度、错误宽度、损坏 PNG、空 bytes 分别都在 materialize 前停止，并允许现有重试 /
  授权模型按 `known_failure` 继续。
- 请求检查投影与实际提交 request 的 canonical digest 一致；正常 CLI 回执不泄露 prompt。
- 回归锁住语义契约：Pure request 含 display、body、scene 及工作流适配的 clauses；Framed
  保持本地 Text Frame 与无字 underlay。这样 BUG-036、BUG-041、BUG-044 不会被后续 I/O
  修复重新打穿。

### 非目标

- 不探测或承诺某个第三方 provider 一定遵守 `size` 参数；这是单独授权的 live probe。
- 不为错误尺寸添加自动缩放 fallback。
- 不把 prompt 作为常规 CLI error diagnostic 的一部分。

## Change 2: `unify-page-ordinal-projections`

**目的：** 让当前快照的 `position` 只在面向人类的文件名和 PPTX 页脚中投影，覆盖
BUG-040 与 BUG-045，并持续保护 BUG-043 已实现的 final 命名。

**建议 capability：** `image-generation`（raw / pilot 浏览投影）、`image-production`
（final manifest）、`pptx-assembly`（页脚）与 `slide-identity-and-ordering`（身份不变量）。
控制 owner 是 JS。对 run bundle 的影响是 `compatible`：重跑对应生成 / delivery 即获得新路径和
新 PPTX；不迁移或手改旧 `_generated/` 文件。

### 必须交付

1. 定义唯一的 `position + slide_id -> NN_slideID.png` 投影规则，至少两位补零，超过 99 页时
   自然扩展。所有人类浏览的逐页图片输出都复用它：final、raw 及 pilot / review 的逐页导出。
2. 明确区分人类浏览投影与证据存储：canonical receipt、CAS、attempt、provenance 和 raw
   contract 继续以稳定 `slide_id` / digest 寻址，绝不能把 `NN_` 写进逻辑身份或 raw contract。
3. 让 final manifest、其校验器和实际 delivery writer 使用同一命名规则；清理或对齐仍期待
   `${slide_id}.png` 的旧装配路径，避免日后回归为两套 schema。
4. PPTX assembly 在每页整图上方增加小型右下页脚，显示当前 `NN` position。默认开启；若保留
   deck 级关闭开关，必须只有一个受验证的配置点，且不影响 `slide_id`、raw evidence 或图片内容。

### 验收与测试

- `01_DeckGo.png`、`10_...png`、`100_...png` 的命名和 manifest 一致，所有声明的输出文件都存在。
- 仅重排页面时，`slide_id` 和语义 raw inputs 不变；文件名前缀与 PPTX 页脚随新的 `position`
  改变，且不会触发 provider 重新生成。
- 交付出的 PPTX 含每页对应页脚文本；用 XML 断言与渲染 / 视觉检查共同覆盖位置和可读性。
- 针对当前 final `NN_slideID` 行为保留回归测试，防止 BUG-045 的修复把 BUG-043 重新引入。

### 非目标

- 不将文件名前缀当作跨版本 ID，也不重命名 source heading 中的 formal ID。
- 不要求迁移已交付 run bundle；派生输出按现有重建路径更新即可。

## Change 3: `activate-clean-page-authority-versions`

**目的：** 让 `new-version` 创建的 clean Page Authority target 立即成为其已选 workflow
的 `create-deck` authoring draft，而不继承 source 的 production 或 paid-work lineage。

**验收中发现与完成：** 2026-08-03 在 `deck_ai_sdlc_keynote` 从 v5 创建 v7 时发现，旧路径
会让 target 在 provider-free validation 前卡在 `MODE_MISSING`。该 change 已覆盖 active / inactive
source、target lineage conflict 和 public CLI routing；主规格已同步，并归档为
`openspec/changes/archive/2026-08-03-activate-clean-page-authority-versions/`。

## 逐步 To-do（按真实次序）

以下清单是后续工作的唯一顺序索引。完成一项就将 `[ ]` 改为 `[x]`，并记录失败或新增
发现；没有指定 run bundle 前，不执行第 2 和第 9 步。

1. [x] **建立 baseline（非 change）**：运行与 Page Authority 相关的无远端 fixture 回归，
   记录 BUG-036/041/043/044 的当前契约结果；不修改 `_generated/`，不提交 provider 请求。
2. [x] **完成语义线验收（非 change）**：在用户指定的
   `deck_ai_sdlc_keynote/3_versions/v7` 中，官方 `validate` 通过 25 页；结构化
   source receipt 显示 `BODY` 25/25、`VISUAL SCENE` 25/25，且所有 slide ID 唯一。逐页
   人工语义复核确认 scene 承载各页的结构或隐喻，Pure 所需正文也已存在。这是 source-side
   readiness，不替代 provider 真实出图验收。
3. [x] **创建 Change 1 proposal**：以 `harden-page-authority-provider-boundary` 运行
   `openspec-propose`，生成 proposal、delta specs、design、tasks；先确认请求检查投影的
   secret-safe CLI 边界和错误 PNG 的 known-failure 语义。
4. [x] **实施并验证 Change 1**：完成 provider request 检查投影与入站 PNG 尺寸/格式校验；
   用 Pure、Framed、损坏 PNG、错误尺寸和正常 PNG 的测试覆盖其边界。
   验证于 2026-08-02：focused Page Authority 套件 53/53、直接 CLI 套件 7/7、`npm test`、
   `openspec validate harden-page-authority-provider-boundary --strict` 与 `git diff --check` 均通过。
5. [x] **归档 Change 1**：执行相关测试与 OpenSpec validation；通过后 archive，并把
   BUG-037、BUG-042 改为“待真实 run 验收”或关闭，取决于结果。
   2026-08-02：delta specs 已同步至 `image-generation` / `cli-surface` 主规格，Change 1
   已归档为 `2026-08-02-harden-page-authority-provider-boundary`；两张卡均待指定真实 run 验收。
6. [x] **创建 Change 2 proposal**：以 `unify-page-ordinal-projections` 运行
   `openspec-propose`，明确 `position` 的展示投影、内部 stable-ID 不变量、文件命名和 PPTX
   页脚规则。2026-08-02：proposal、3 份 delta specs、design 与 tasks 已创建，strict validation
   已通过。
7. [x] **实施并验证 Change 2**：统一人类浏览的 raw / pilot / final 命名，给 PPTX 增加页脚；
   覆盖 1、10、100 页，以及仅重排页面时不重新生成 provider raw 的场景。
   2026-08-02：focused artifact/raw-owner/Pure/Framed/delivery/process tests 与 `npm test`
   通过；PPTX XML 断言通过。`soffice` / `libreoffice` 不可用，视觉 renderer 验收保留给
   指定真实 run。
8. [x] **归档 Change 2**：执行相关测试、PPTX XML 断言和可读性检查；通过后 archive，并将
   BUG-040、BUG-045 关闭或标成待真实 run 验收，同时确认 BUG-043 未回归。
   2026-08-03：delta specs 已同步至 `image-generation`、`pptx-assembly` 与
   `slide-identity-and-ordering` 主规格，Change 2 已归档为
   `openspec/changes/archive/2026-08-03-unify-page-ordinal-projections/`；BUG-040、
   BUG-043 与 BUG-045 均待指定真实 run 验收。PPTX XML 断言通过；本机无
   `soffice` / `libreoffice`，视觉渲染验收保留给第 9 步。
9. [ ] **真实 run 验收（非 change，需授权）**：对指定 run bundle 执行正确的 Generated Image
   Rebuild / delivery 重建；先完成 v7 Style Master plan / human selection，再以显式 provider
   authorization 生成、review、delivery。人类确认画面文字、场景表达、文件顺序和页脚。绝不手改
   `_generated/`，也不因验收而修改 framework 外的未指定 deck。
   2026-08-03 已完成无远端前置：v7 `validate` 和 `bundle_layout --check` 通过，source receipt
   为 25/25 非空 `BODY`、25/25 非空 `VISUAL SCENE`、25 个唯一 slide ID；Style Master 的零生成
   本地候选 plan `4907a3fd5150911d14bf15a7c2632a98b07c0d50f525733cd7e78b21448c15c6` 已 review。
   未完成的首个 gate 是人类对 `local-existing` 候选作 `proceed`、`repair` 或 `redirect` 决策；它不能
   由 agent 代替。其后才可进行明确授权的 provider 工作。
10. [ ] **簿记、归档与版本收尾（非 change）**：仅在第 2、9 步的真实 run 验收全部通过后执行：
    先记录八张卡的最终状态与仍存在的根因，再以 `git mv` 将 BUG-036、BUG-037、BUG-040、
    BUG-041、BUG-042、BUG-043、BUG-044、BUG-045 移入 `_backlog/_done/_fixed_bugs/`，并同步
    `_backlog/bugs/README.md`、`_backlog/_done/_fixed_bugs/README.md` 与
    `_backlog/_done/README.md` 的活跃列表、编号和计数；随后以 `git mv` 将本文件移入
    `_backlog/_done/_closed_plans/page-authority-production-repair.md`，分配归档当日的下一个
    `CLS-NNN`，并同步 `_backlog/plans/README.md`、`_backlog/_done/_closed_plans/README.md` 与
    `_backlog/_done/README.md`。最后按 `project-versioning` 决定版本更新是否需要人类确认。
    在真实 run 验收前不得移动任何待验收卡或本 plan。

第 3、6 步分别创建 Change 1、Change 2；验收中新发现的 Change 3 也已完成并归档。plan 保留
这些顺序和验收事实，供后续真实 run 恢复时直接定位下一项未完成 gate。

## 风险 / 取舍

- [Prompt 可见性与泄露冲突] → 把完整请求限制在用户显式读取的本地可重建投影；默认 CLI
  诊断只输出安全索引，不输出 raw prose 或凭据。
- [把第三方尺寸偏差“修好”] → 在边界 hard-stop 为 known failure；保留真实 bytes 的真实性，
  而不是自动 resize。
- [页序污染稳定身份] → 只在派生展示层计算 `NN`，所有 lineage、授权与 raw contract 继续基于
  `slide_id` 和 digest。
- [一次性扩展所有文件] → 只统一人类浏览的按页 image projection；不触碰内部 CAS / attempt
  路径，避免为了美观扩大迁移面。

## 落地关联

本文件是 backlog 中的分析 / 设计记录，不是 active OpenSpec change。已实施并归档的 change 为：

1. `harden-page-authority-provider-boundary`
2. `unify-page-ordinal-projections`
3. `activate-clean-page-authority-versions`

已归档的 `fix-provider-clauses-and-visual-scene` 与
`pure-text-delivery-and-nn-production-naming` 是语义线的历史依据和回归基线，不应重新开启。
