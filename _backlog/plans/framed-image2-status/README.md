# 规划：Framed 渲染契约与渐进式生产 UX

> 类型：总设计（design umbrella） | 状态：可进入 OpenSpec proposal | 更新：2026-07-30

## 目的

本目录把 Framed Image2 现状调查，以及更广泛的 Page Authority 反馈时机缺口，整理为一条自洽的 framework maintenance（框架维护）方向。这里不实现任何变更，也不授权修改生产数据 `deck_*`。

按职责阅读以下文档：

1. [research.md](research.md)：记录当前行为、已观察到的缺口与实测结果。
2. [render-contract-plan.md](render-contract-plan.md)：定义目标契约和模块边界。
3. [pilot-run-plan.md](pilot-run-plan.md)：定义 Style Master（风格母版）以及 Framed、Pure 两条独立路径中的代表性 Pilot Run（试生产）UX。
4. [progressive-plan.md](progressive-plan.md)：把工作安排为带 Gate（关口）、可独立验证的渐进阶段。

## 双语术语约定

本文档组以中文说明为主；代码标识、schema 字段、CLI 命令、文件路径和 OpenSpec change 名称保持英文原样。关键产品与契约术语首次出现时采用“英文（中文）”写法，后文可按语境保留英文简称。

| 术语 | 本文含义 |
| --- | --- |
| Framed（框架合成模式） | Image2 生成无文字 underlay（底图），本地 Chromium 再合成 Text Frame（文本框架）。 |
| Pure（全图模式） | Image2 直接拥有整页最终像素，包括展示文字。 |
| Style Master（风格母版） | 在页面级生产前供人确认的真实视觉语言参考图。 |
| Pilot Run（试生产） | 从完整计划中选择通常 3-5 张代表页，先生产、展示并收集反馈，再决定是否扩量。 |
| raw plan（原始图计划） | 不触发 provider 调用、覆盖当前完整生成范围的规范计划。 |
| raw review（原始图审查） | 对生成原始图及其完整性、归属和视觉质量的人工审查。 |
| authorization grant（授权许可） | 人针对精确计划、精确页面范围和最大提交次数授予的 provider 调用权限。 |
| materialization（物化） | 由所属 owner 把已验证计划或 provider 结果写成正式状态、回执或产物。 |
| Source of Record（事实源） | 对某项事实具有最终权威的规范记录或 owner。 |
| `guide`（引导） | 可由确定性修复或建议安全推进，不需要人承担风险。 |
| `confirm`（确认） | 可逆的质量或流程判断归人所有，需要展示真实证据并取得明确决定。 |
| `hard-stop`（硬停止） | 身份、完整性、安全、授权或可恢复性不确定时不可绕过的停止。 |

## 权威与政策

本 backlog 目录只是规划辅助材料，不是 runtime authority（运行时权威），也不代表 OpenSpec change 状态。具体行为仍依次受 `AGENTS.md`、`openspec/config.yaml`、已接受的 capability specs、可执行契约以及当前运行时事实约束。

未来由本规划形成的 proposal/design 必须引用并应用：

- [human-centered-gates.md](../../../openspec/policies/human-centered-gates.md)：负责 `guide`、`confirm`、`hard-stop` 的分类；
- [agent-assistance-and-control.md](../../../openspec/policies/agent-assistance-and-control.md)：负责直接权威、人/Agent/runtime 的职责交接、状态、诊断和 same-check recovery（同检查点恢复）；
- [simple-reliable-control.md](../../../openspec/policies/simple-reliable-control.md)：要求质量控制必须比它所验证的工作更简单。

政策推论：渲染收敛用一个有明确 owner 的布局 evaluator（评估器）替代相互竞争的检查，不增加持久化 layout-proof（布局证明）记录。渐进式生产只增加无法自动化的人类决定：精确 provider 授权、真实 Style Master 判断、代表性 Pilot Run 判断，以及完整视觉审查。它不增加 waiver（豁免）、隐藏重试、fallback（回退链）、第二权威、跨 workflow Controller 或平行成功状态库；任何新增持久事实都必须是不可重建的授权、provenance（来源归属）或人类决定证据，并且只有一个 owner 和一条失效路径。

## 核心结论

Framed Image2 当前是**流程完整，但渲染契约不完整**。v2 lifecycle 已经存在，但 authoring/preflight 声明的是浅色 `standard-v1` frame，而最终 Chromium 合成器独立输出深色 Arial frame。因此，当前启发式检查可能会为实际上无法适配最终 renderer 的文字放行 provider 工作。

修正方向不是建立可配置模板系统，而是建立一个私有的 Framed render-contract module（渲染契约模块）：以已经声明的浅色 `standard-v1` frame 为唯一权威，在 raw 授权前用真实浏览器布局证明其可适配，并在最终合成时复用同一个 compiler（编译器）与检查。

v2 生产 UX 还有一个独立缺口：它要求存在 Style Master 文件，却没有暴露前置的 Style Master 反馈环路；同时，它在看到代表性生产样本前就授权并生成完整 raw plan。目标 UX 是先建立真实 Style Master，再执行通常为 3-5 页的 Pilot Run，让人基于 production-equivalent output（生产等价输出）尽早反馈；确认后，才单独提供剩余页面的扩量授权。Framed 与 Pure 共用这一产品原则，但各自沿已选 workflow 的独立流程前进。

## 已确定的决定

| 关注点 | 决定 |
| --- | --- |
| 视觉权威 | 保留已声明的浅色 `standard-v1` 设计。意外形成的深色 Arial 合成器不是第二权威。 |
| Preset 清理 | 规范化重复或未使用的 preset 事实。既有 hash 不能成为保留畸形数据的理由；digest 变化应有意使陈旧派生证据失效。 |
| 契约身份 | 增加规范 `render_profile_digest`，覆盖规范化 preset、layout compiler 身份、checked-in font inventory（随库字体清单）以及固定的 runtime/capture 身份。 |
| 单页证明 | 浏览器布局证明按页计算且可重建；它不是新的持久产物、approval 或状态机。 |
| Raw 绑定 | 每个 Framed raw contract 都绑定 render profile，因此既有 raw-plan hash 会传递性地把它绑定进授权、审查、接受和最终化。 |
| 证明时机 | 先解析并编译只读 candidate（候选），在 `image2 plan` 中执行一次有界浏览器批处理；只有全部成功后，才物化 source state/receipt 和 raw plan。最终合成时重检；authorize/generate/review/accept 阶段不启动 Chromium。 |
| 兼容性 | render profile 变化会使既有 Framed raw/final 证据陈旧，并通过所属 raw rebuild path（原始图重建路径）恢复。以 underlay/render 双身份复用旧 underlay 的优化暂缓。 |
| 字体 | 只嵌入实际文字所需的 checked-in WOFF2 shard。预期 font family 取决于真实 glyph selection（字形选择）；观察到任何非自定义字体 fallback 都 fail closed（失败关闭）。 |
| 布局测量 | 精确证明 panel 和 field 矩形、scroll bounds，以及按 y 分组的 line fragments。原始 glyph box 不要求落在 CSS field box 内。 |
| 失败归属 | 非法 literal、不支持的 code point、文字不适配属于 `source_validation` 停止；Chromium/字体未就绪属于 `environment`；preset/compiler invariant 漂移属于 `internal`。三者都不是 provider failure。 |
| Raw 视觉审查 | 无文字与视觉适配判断继续归人所有，不引入 OCR。在通用 raw-review owner 中恢复 Framed safe-zone guide、`position + formal slide_id + title` 标签，以及规范 projection/profile coverage。 |
| 测试接缝 | 移除面向生产的 `preflight` 信任和任意 `compose` 注入。替换能力仅保留在 renderer/runtime 私有实现内。 |
| Style Master UX | 页面级生产前展示并确认真实 candidate。仅在当前人工审查后提升 canonical bytes（规范字节）；被拒绝的迭代继续由既有 owner 保留。 |
| Pilot 地位 | Pilot Run 是两种 workflow 的一等反馈阶段，不是可选 debug preview。 |
| Workflow 独立性 | Framed 与 Pure 共用 Pilot Run 概念和 Gate 语义，但拥有各自直线式 Controller 路径与特定模式的审查证据。 |
| 代表范围 | Agent 通常提出 3-5 个覆盖风险的页面，并展示 `position + slide_id + title + reason`；人在授权前可以调整精确范围。first-N 不是权威选择规则。 |
| 渐进授权 | 保留一份完整且 provider-free 的计划。先只授权 pilot IDs；pilot `proceed` 后，再对剩余 IDs 单独取得精确授权。 |
| Pilot 复用 | 扩量和完整审查必须保留并复用当前 pilot 精确字节。部分 pilot 证据不能最终化部分 deck；若 pilot 已覆盖完整小范围，则只审查一次。 |

## 契约模型

以下四个概念必须保持区分：

```text
规范化 preset
      + layout compiler 身份
      + checked-in font inventory 身份
      + 固定的 runtime/capture 身份
      = render profile（渲染配置身份）
                |
                v
源 Text Frame -> 单页 layout proof（可重算、不持久化）
                |
                v
Framed raw contract -> raw plan hash -> 授权/审查/接受
                |
已接受 underlay + 当前 Text Frame
                v
最终合成 -> 最终 PNG/manifest（派生输出）
```

render profile 不包含 Text Frame literal，也不包含单页所选 font-shard list。这些事实由当前 source 与已绑定 profile 派生。这样既能保留 provider-free 的 text-only refresh（仅文本刷新），又能让 compiler、font inventory 或 runtime 的变化使旧证据失效。

不要把这个 Framed render profile 与既有 provider generation profile（生成配置身份），或 raw-review contact sheet 自身的 projection/capture profile 混为一谈。Review coverage 绑定自己的 projection profile 和带类型的 workflow contribution；其中 Framed contribution 会传递性绑定 `render_profile_digest`。

## 范围

包含：

- 收敛 `standard-v1`、raw safe zones、浏览器布局和最终像素；
- 引入私有 `framed_render_contract` 模块；
- 拆分只读 source/contract 编译、批量验证，以及证明成功后的 source-state/receipt/raw-plan 物化；
- 通过既有 Framed raw contract 绑定 render-profile 失效规则；
- 加固 text-only 和 notes-only refresh 行为；
- 输出 owner 归属正确的 source/environment CLI diagnostics；
- 恢复通用 raw review 的 safe-zone 和 profile 证据；
- 建立前置、面向当前版本的 Style Master candidate/review/promotion 环路；
- 为 Framed 与 Pure 增加独立 Pilot Run 路径，覆盖代表性范围、精确 batch authorization（批次授权）、生产等价审查、剩余范围扩量和当前 pilot 字节复用；
- 更新受影响 specs，以及 focused/unit/mock-E2E 覆盖。

不包含：

- 额外 preset，或用户提供的 HTML/CSS/capture 选项；
- 单页级 Framed/Pure 选择，或在同一版本混用 workflow；
- 自由形式的本地正文、表格/图表标签，或对 Pure 的替代；
- OCR，或自动对生成 underlay 做语义接受；
- 持久化 layout-proof schema，或再增加一个 approval gate；
- 跨 render-profile 变化复用旧 underlay 的优化；
- 面向用户的跨 workflow 共享 pilot；
- 静默的整计划授权、自动扩量或 pilot bypass。

## Framework Maintenance 影响

未来 proposal 必须记录 `openspec/config.yaml` 中的以下项目级事实：

| 维度 | 决定 |
| --- | --- |
| Framework 源码范围 | 仅限 `PPTMAKER_FRAMEWORK/`、`openspec/`、`tests/` 和 `tests_e2e/`。任何生产 `deck_*` 或 `dpt_*` 输入都不得成为源码或 fixture。 |
| Control owner | JS 负责确定性 profile/layout 检查、精确授权与物化写入、失效和诊断；MD/Agent 负责意图、代表页选择、产物展示和人类交互。既有 create-deck Controller 增加按已选 workflow 分开的节点，不增加第二个 Controller 权威。 |
| Run-bundle contract 影响 | 渲染收敛和 raw-review 恢复为 `compatible`；Style Master 增加惰性物化的接受证据；Pilot Run 需要由 owner 控制的 authorization/materialization state migration，但 source grammar 和“一版本一种 workflow”保持不变。 |
| Migration | 不批量或手工迁移生产 deck。既有已接受精确证据，在新 owner 能验证时仍可消费；未接受的整计划授权，必须在再次 submit 前重新规划、重新授权。生成产物只针对明确选择的 run，并通过各自 owner 重建。 |

## Change 边界

未来使用四个 OpenSpec change，且必须严格串行：

1. `converge-framed-render-contract`：负责 preset 规范化、render-profile 身份、私有 renderer、plan-time/final proof、refresh 失效、诊断和测试。
2. `restore-target-raw-review-evidence`：在共享 target raw-review owner 中恢复 safe-zone overlay、完整标签，以及规范 projection/workflow coverage。
3. `establish-target-style-master-feedback`：恢复面向当前 Page Authority 的 candidate/authorization/review/promotion 环路，但不复活 legacy production adapter。
4. `introduce-target-pilot-runs`：增加精确限定范围的生成批次、彼此独立的 Framed/Pure Pilot Run Controller 路径、生产等价证据、单独的剩余范围授权，以及 pilot 字节复用。

每个 change 都要在提出下一个 change 前完成 validate 和 archive。Raw review 消费已接受的规范 render-profile 身份；Style Master 随后建立前置、已接受的视觉参考；Pilot Run 再消费前三项已接受契约。这样可以避免并行依赖，并让每个 change 保持局部 owner 清晰。

第一个 change 不增加人类决定：所有新增 layout/profile 结果都是确定性且不可绕过的完整性检查。第二个 change 保留既有 raw-review `confirm`。第三和第四个 change 针对视觉方向、代表性质量与精确 provider 花费增加有界的人类决定，因为这些事实无法机械判断。它们都不是 continuation（继续许可）或 waiver。面对完整且当前的证据，人的 `proceed` 是归人所有的内容判断，不是跨越身份、授权或证据失败的 bypass。

第一个 proposal 至少必须审计以下既有 capabilities 的 delta：

- `image-production`
- `html-render-runtime`
- `image-generation`
- `visual-config`
- `environment-check`
- `cli-surface`
- `pipeline-orchestration`

raw-review proposal 还必须对齐已经描述 safe-zone/profile binding 的 accepted evidence 和 bundle-layout requirements。准确 capability delta 在创建 proposal 时确认；consumer specs 不得复制 producer 所有的 CLI diagnostic schema。需要审计 `node-specification` 的兼容性，且只有 Controller 消费行为确实变化时才增加 delta。

Style Master 与 Pilot Run proposal 必须审计 [pilot-run-plan.md](pilot-run-plan.md) 列出的 capabilities。清晰的公共名称 `style-master` 和 `pilot` 只能作为当前 Page Authority CLI surface 恢复。这是一次有意的 `cli-surface` 契约变更，包含 command-count/help 和 retirement-test 更新；不能只是删除断言，也不能复用旧 whole-page state 语义。版本 workflow 选定后，Framed 与 Pure Controller 节点继续保持独立；只允许共享不理解语义的机械 primitives。

只有 requirement-level behavior 才属于 Modified Capabilities。既有 requirement 如果只是缺少实现覆盖，不得伪装为新的 capability 行为。

当前没有 active OpenSpec change。下一步是 [progressive-plan.md](progressive-plan.md) 的 Phase 0，而不是实现。

## 成功定义

只有以下条件全部成立，本方向才算完成：

- 一个规范化 preset 和一个 compiler 能同时解释 raw contract 与最终像素；
- 被浏览器证明无法适配的 frame 不能产生可授权 raw plan；
- plan-time proof 失败时，不推进 source state，也不物化 source/raw 产物；
- 最终合成在发布前重复同一组契约检查；
- profile 漂移通过既有 owner 使证据失效；
- 合法 text-only refresh 继续保持 provider-free；
- raw review 展示精确 Framed safe zones，并同时绑定自己的 projection profile 与 Framed render-profile contribution；
- 页面级生产前审查真实 Style Master，且只有当前已接受字节进入 generation profile；
- Framed 与 Pure 都必须先展示生产等价的代表性输出，再授权更大的剩余批次；
- pilot scope 不能授权未选择页面；扩量必须取得独立精确授权；当前 pilot 字节不得重新生成；
- 部分 pilot 证据不能发布最终输出；完整的小范围也不得重复审查；
- focused tests、mock E2E、完整 regression suite 和严格 OpenSpec validation 全部通过。
