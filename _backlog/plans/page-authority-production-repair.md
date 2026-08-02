# Plan: Page Authority 残余 Bug 收敛修复

> 类型: 设计 / 分析 | 更新: 2026-08-02

## 结论

这 8 张 bug 卡不应产生 8 个 OpenSpec change。按当前代码与已归档 change
复核后，应按三条系统线处理，但只新建 **2 个** change：已合入的语义修复只做
回归验收和卡片关闭，不再为同一行为支付一次 change 成本。

| 系统线 | 覆盖 bug | 处理方式 |
| --- | --- | --- |
| Source-to-provider 语义 | BUG-036、BUG-041、BUG-044 | 已由归档 change 实现；做端到端回归与 run-bundle 内容迁移，不新建 change |
| Provider I/O 边界 | BUG-037、BUG-042 | 新建 1 个 change |
| 页序的人类可见投影 | BUG-040、BUG-043、BUG-045 | 新建 1 个 change；BUG-043 作为既有 final 命名的回归项 |

这比“三个 change”更省，但仍保留三个能独立讨论、验收和回归的系统边界。

## 计数口径

- **3 条工作线**：语义、provider I/O、页序投影。
- **2 个待新建 OpenSpec change**：Change 1 和 Change 2。
- **1 条非 change 的语义收尾线**：已由两个归档 change 实现，只需回归验收和指定
  run bundle 的内容迁移。

不建议为了凑“三个 change”重开语义线：它当前没有新的 framework 行为契约，额外的
proposal / spec / design / tasks / archive 只会增加维护成本。

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

仍缺的是 provider 请求的可诊断投影、provider 返回图像的早期介质校验、PPTX 页码，
以及 raw 等人类浏览产物的页序命名一致性。

## Bug 去向

| Bug | 当前判断 | 最终归属 |
| --- | --- | --- |
| BUG-036 | 已有显式 `VISUAL SCENE` 契约；待在真实 source 中采用 | 语义回归验收，不新建 change |
| BUG-037 | 返回 bytes 在 materialize 前未统一校验尺寸 | Change 1 |
| BUG-040 | 当前 PPTX 只铺整页图片，没有页脚 | Change 2 |
| BUG-041 | Pure 已携带 display，clause 已可按工作流表达 | 语义回归验收，不新建 change |
| BUG-042 | provider request 只有内存对象 / digest，难以检查 | Change 1 |
| BUG-043 | final manifest 已使用 `NN_slideID.png` | Change 2 的回归项 |
| BUG-044 | Pure 已携带 `BODY` | 语义回归验收，不新建 change |
| BUG-045 | raw / pilot 等按页浏览产物仍裸用 `slide_id` | Change 2 |

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

## 逐步 To-do（按真实次序）

以下清单是后续工作的唯一顺序索引。完成一项就将 `[ ]` 改为 `[x]`，并记录失败或新增
发现；没有指定 run bundle 前，不执行第 2 和第 9 步。

1. [ ] **建立 baseline（非 change）**：运行与 Page Authority 相关的无远端 fixture 回归，
   记录 BUG-036/041/043/044 的当前契约结果；不修改 `_generated/`，不提交 provider 请求。
2. [ ] **完成语义线验收（非 change）**：在用户指定的 run bundle 中，把每页真正要画的
   CONCEPT 内容提炼到 `VISUAL SCENE`，并为 Pure 页补齐需要上图的 `BODY`；这是内容工作，
   不是 framework 代码修改。
3. [ ] **创建 Change 1 proposal**：以 `harden-page-authority-provider-boundary` 运行
   `openspec-propose`，生成 proposal、delta specs、design、tasks；先确认请求检查投影的
   secret-safe CLI 边界和错误 PNG 的 known-failure 语义。
4. [ ] **实施并验证 Change 1**：完成 provider request 检查投影与入站 PNG 尺寸/格式校验；
   用 Pure、Framed、损坏 PNG、错误尺寸和正常 PNG 的测试覆盖其边界。
5. [ ] **归档 Change 1**：执行相关测试与 OpenSpec validation；通过后 archive，并把
   BUG-037、BUG-042 改为“待真实 run 验收”或关闭，取决于结果。
6. [ ] **创建 Change 2 proposal**：以 `unify-page-ordinal-projections` 运行
   `openspec-propose`，明确 `position` 的展示投影、内部 stable-ID 不变量、文件命名和 PPTX
   页脚规则。
7. [ ] **实施并验证 Change 2**：统一人类浏览的 raw / pilot / final 命名，给 PPTX 增加页脚；
   覆盖 1、10、100 页，以及仅重排页面时不重新生成 provider raw 的场景。
8. [ ] **归档 Change 2**：执行相关测试、PPTX XML 断言和可读性检查；通过后 archive，并将
   BUG-040、BUG-045 关闭或标成待真实 run 验收，同时确认 BUG-043 未回归。
9. [ ] **真实 run 验收（非 change，需授权）**：对指定 run bundle 执行正确的 Generated Image
   Rebuild / delivery 重建；人类确认画面文字、场景表达、文件顺序和页脚。绝不手改
   `_generated/`，也不因验收而修改 framework 外的未指定 deck。
10. [ ] **簿记与版本收尾（非 change）**：更新各 bug 卡的最终状态、记录仍存在的根因；两项
    change 都完成后移动本 plan 到 `_done/_closed_plans/`，并按 `project-versioning` 决定版本
    更新是否需要人类确认。

第 3 和第 6 步才创建 active change。这样 plan 可以先稳定存在，OpenSpec artifact 只在真正
要实施时产生，也不会在等待期间过期。

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

本文件是 backlog 中的分析 / 设计记录，不是 active OpenSpec change。实施时新建的 change
仅为：

1. `harden-page-authority-provider-boundary`
2. `unify-page-ordinal-projections`

已归档的 `fix-provider-clauses-and-visual-scene` 与
`pure-text-delivery-and-nn-production-naming` 是语义线的历史依据和回归基线，不应重新开启。
