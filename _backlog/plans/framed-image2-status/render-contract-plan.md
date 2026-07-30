# Framed 渲染契约设计

> [README.md](README.md) 配套文档 | 状态：可进入决策（decision-ready） | 更新：2026-07-30

## 问题与必需不变量

当前 `standard-v1` model 声明了 geometry、colors、Source Sans 3 和 Noto Sans SC。私有 compositor 却独立 hard-code 了一套深色 Arial layout。它的 heuristic preflight 不等价于 browser layout，因此 source receipt 与 raw contract 可能描述一种最终像素根本没有使用的 frame。

支配性 invariant 是：

> 只有每个当前 Text Frame 都适配 raw plan 所绑定的精确、自包含 render profile 后，Framed raw plan 才能 materialization（物化）；最终合成在发布像素前，必须再次证明同一契约。

已选 `03-framed-image` workflow 拥有这条规则。共享 raw mechanics 继续处理不透明 typed contracts、hashes、authorization、bytes 与 review evidence，不解释 Framed fields。

## Policy 对齐

本设计服从 [README.md](README.md) 链接的三项 policy 和 accepted capability behavior。

### 职责交接

| Actor | 负责 | 不负责 |
| --- | --- | --- |
| Human | 文字含义、generated-underlay 的视觉/内容判断，以及既有显式 provider authorization decisions。 | Browser geometry、font readiness、hashes、state repair 或 artifact materialization。 |
| Agent | 已授权机械工作：运行检查、执行 owner 给出的合法修复、重跑同一 checkpoint，并解释有界结果。 | 隐式豁免 integrity、覆盖 state 或发明内容决定的权限。 |
| JS/runtime owner | 确定性 parsing、profile construction、layout evaluation、diagnostics、精确 writes 与 evidence invalidation。 | 创意判断、第二套 playbook、inferred intent 或人类风险接受。 |

Agent 不得要求人重复运行其合法可执行的常规命令。它只在最小、确实归人的决定或缺失 external authority 处停止；决定完成后继续剩余机械工作。

### Gate 分类

| Checkpoint 事实 | 结果 | 受保护 invariant | 唯一最近合法动作 |
| --- | --- | --- | --- |
| Doctor 发现确定性本地 runtime/font prerequisite 缺失 | `guide` | 没有事实被豁免；production 仍未开放。 | 通过 environment owner 修复，再重跑 doctor。 |
| `image2 plan` 无法证明当前 Text Frame 适配或 code-point coverage | `hard-stop` | Final-pixel integrity 与 provider 授权前的正确性。 | 修复当前 Text Frame source，再重跑同一 plan checkpoint。 |
| `image2 plan` 缺少已就绪的 pinned browser/font environment | `hard-stop` | Layout result 未知，不能成为可授权 plan。 | 修复 environment readiness，再重跑同一 plan checkpoint。 |
| 后续 command 发现 source/profile/stored-plan 漂移 | `hard-stop` | 精确 identity、provenance 与 recoverability。 | 重跑 `image2 plan`，取得当前精确计划。 |
| Provider authorization 缺失或未绑定精确当前计划 | `hard-stop` | 显式 provider-spend authorization。 | 为精确当前计划取得授权。 |
| accepted-raw/final 路径发现 raw-contract/render-profile 漂移 | `hard-stop` | Accepted-underlay attribution 与 recoverability。 | 通过已选 owner 执行 Generated Image Rebuild。 |
| Raw projection 完整、当前但尚无人类决定 | 既有 `confirm` | generated-underlay quality 归人所有。 | 展示当前证据，请人作出既有、有界 raw-review 决定。 |
| Raw review coverage 缺失、不完整或陈旧 | `hard-stop` | Review evidence completeness 与 byte/profile attribution。 | 重建当前 projection，再重跑同一 review checkpoint。 |
| Preset/compiler/runtime assertions 与自身 contract 矛盾 | `hard-stop` | Framework integrity；修改 source 无法修复。 | 修复所属 framework contract，再重跑失败 checkpoint。 |

Identity、integrity、authorization 或 evidence-completeness 失败都不允许 force 或 waiver。Raw-review `confirm` 绝不替代 missing coverage，也不会让不完整 evidence 变完整。本计划不改变 accepted decision record/schema。面对 complete/current evidence 作出的 `proceed` 是 human evaluator 的内容判断，不是对已知失败确定性检查的 waiver。若未来 change 允许在已知可逆 warning 下继续，则新的 continuation 必须绑定版本，并携带 policy 要求的规范化 human reason。

### 净简化准入

允许新增 browser checkpoint，是因为它删除的控制多于新增的控制：

1. **Direct facts：** 当前 source receipt/Text Frame、规范化 preset、checked-in font render inventory、pinned runtime profile 和 accepted raw bytes 是所属事实。
2. **真实未覆盖失败：** heuristic 会放行在真实 browser 中 overflow 的文字；当前 final compositor 还会渲染另一种 frame。
3. **删除的复杂度：** 删除 heuristic authorization authority、重复 hard-coded CSS、调用方可信的 `preflight`、公共任意 `compose`，以及每个 lifecycle command 都重建/写入 raw plan 的行为。
4. **每个根因只有一条恢复路径：** 每个独立 root 精确映射到 source edit、environment repair、fresh plan、exact authorization、Generated Image Rebuild、fresh review projection 或 framework repair 之一，随后回到同一失败 checkpoint。
5. **Focused negative proof：** 必须测试 prerequisite short-circuiting、无 wrong-owner write/provider call、有界 diagnostics、无 bypass/fallback，以及 same-check rerun 成功。

一个内部 layout evaluator 同时复用于 plan-time verification 和 final composition。它在两个边界都运行，是因为两处直接事实发生在不同时间，且 final composition 额外拥有 accepted underlay bytes；这不是两套相互竞争的 pass/fail authority。

不持久化任何 page-specific layout result。只有 canonical profile digest 绑定进既有 raw contract/hash lineage，因为后续 invocation 必须能检测 profile drift。Raw review 只丰富既有 coverage owner，不创建另一套 ledger。

持久状态纪律如下：

| 绑定 | Owner/writer | Readers | 新鲜度与移除路径 |
| --- | --- | --- | --- |
| Framed raw-contract lineage 内的 `render_profile_digest` | Framed adapter，在 proof 成功后的 plan materialization 期间写入 | Current-plan validation、refresh classification、raw-review contribution 与 finalization | 从 direct profile facts 重算；不匹配时 derived evidence 陈旧，由 owner rebuild 替换。 |
| Raw-review coverage/profile binding | 既有 shared target raw-review owner | Review decision validation 与 finalization | 通过该 owner 重建 projection/coverage；绝不复制或手工编辑。 |
| Page layout proof | 无 durable owner 或 writer | 只在 plan 与 final composition 时重算 | 无需迁移/移除；重跑同一 evaluator。 |

未来设计若新增字段，必须同时说明其 owner、writer、readers、freshness rule 和 owner-controlled invalidation/removal path，否则不得增加。

前置条件短路派生检查：

```text
source identity/schema
  -> preset + font inventory + runtime readiness
  -> 一个 browser layout evaluator
  -> 成功后的 source/state/raw-plan materialization
```

若更早 authority 非法或 readiness 未知，后续不得出现 browser-derived symptom、provider call、retry、fallback 或 state write。共享 prerequisites 通过后，batch 可以报告一个有界的独立 page/field fit failures 集合，但每项都指向相同 source-repair action。

## 领域词汇

### Preset（预设）

Preset 是声明式视觉数据：canvas、variants、panel rectangles、field rectangles、typography、palette、line limits 和 raw safe zones。它不包含 HTML、browser results、runtime facts 或 source literals。

把 `standard-v1` 作为权威前先规范化：

- panel fill/opacity 只保留一次，不同时存在于 theme 和每个 panel；
- 除非 renderer 实际绘制 border，否则移除未使用的 border fact；
- 移除 panel padding，因为 fields 已使用 absolute geometry，且当前 callout padding 与这些坐标冲突；
- 保留 rectangles 与 field geometry，作为显式 layout Source of Record。

规范化 preset 获得新 digest。Compatibility 不是永远 hash 已知重复或未使用数据的理由。

### Render profile（渲染配置身份）

Render profile 是所有可能改变“preset 如何变成 pixels”之因素的稳定身份：

```text
render profile = 规范化 preset digest
               + layout compiler schema/version
               + checked-in font render-inventory digest
               + font-selection algorithm identity
               + pinned Chromium/Playwright identity
               + capture profile identity
```

其 canonical JSON 生成 `render_profile_digest`。它排除 source text、per-page line measurements、所选 per-page font shards、underlay bytes 和 final PNG bytes；否则普通 Text Frame 编辑会被错误转化为 raw-generation debt。

Profile 必须使用稳定且有 owner 的 identities，不能使用 absolute executable path 或 host-specific temporary value。已安装 runtime facts 缺失或不匹配，是相对于 profile 的 readiness failure，不是静默创造另一个 profile 的输入。

这里特指 **Framed final-pixel render profile**。它不同于 provider generation profile（`provider_profile_sha256`），也不同于 raw review contact sheet 的 projection/capture profile。每个 identity 只有一个 owner 和一种用途；不得把任何一个重命名或复用为另一个的 alias。

### Layout proof（布局证明）

Layout proof 是从当前 Text Frame literals 与当前 render profile 派生的 page-specific browser observation，用于证明 geometry、lines、overflow 和真实 custom-font 使用情况。它在 plan time 与 final composition 时重算，不持久化为新的 approval 或 lifecycle artifact。

### Derived output（派生输出）

Raw plan、authorization、accepted underlay、final PNG/manifest、projection、PPTX、notes 和 delivery receipt 继续作为既有 owner-produced artifacts。它们当前的 hash chain 必须通过 Framed raw contract 传递性绑定 render profile。

## 权威与身份流

对每个 Framed slide：

```text
source receipt Text Frame -----+
                               |
规范化 standard-v1 ------------+--> describeFrame()
font inventory + runtime IDs --+          |
                                          +--> raw-contract contribution
                                          |       + render_profile_digest
                                          |       + safe zones
                                          |
                                          +--> verifyFrames() [ephemeral]
                                                       |
                                                       v
                                      已物化 raw plan 与 exact hash
                                                       |
                                                       v
                                    authorization -> raw -> human review
                                                       |
accepted raw bytes + 当前 Text Frame --------------------+
                                                       v
                                               composePages()
                                                       |
                                                       v
                                             final PNG/manifest
```

Raw contract 保留 preset name、规范化 canvas 和 reserved underlay rectangles，因为 provider 与 human reviewer 需要这些事实。它还绑定 `render_profile_digest`；profile 本身再绑定 preset digest。不信任任何由 caller 独立提供的 digest。

## Deep Module（深模块）边界

引入 `scripts/03-framed-image/internal/framed_render_contract.mjs`。其小型概念接口是：

```text
describeFrame(textFrame)
verifyFrames([{ slideId, textFrame }])
composePages([{ slideId, textFrame, verifiedRaw }])
```

精确 return shapes 属于 implementation design，但以下职责边界不可改变：

- `describeFrame` 验证 literals 与 code-point coverage，解析规范化 variant，派生 safe zones 与 render-profile binding，并在不启动 browser 的情况下返回确定性 contract facts。
- `verifyFrames` 针对一个有界 batch 只启动一次 pinned runtime，构建每个 self-contained page；要么接受整个 batch，要么返回有界 page/field diagnostics。其 observations 是 ephemeral（临时的）。
- `composePages` 验证 accepted underlay bytes，用这些字节渲染相同 documents，重复 layout/font checks；只有整个 batch 成功后才返回 final PNG bytes。

模块隐藏 HTML generation、escaping、CSS、data-URI encoding、font-shard selection、DOM evaluation、geometry tolerances、network denial、capture scale 和 browser lifecycle。Caller 不能提供 markup、CSS、font paths、capture options、可信 `preflight` object 或 alternate compositor。

既有 setup/font owner 可以为 canonical font inventory 和 code-point-to-shard selection 暴露一个窄接口私有 helper。Framed 消费该 owner；不 fork font metadata，也不接受任意 filesystem assets。

Test substitution 位于公共 Framed workflow 之下，例如私有 browser-launch 或 capture dependency。Public APIs 必须经过唯一 owner 路径，不得暴露当前任意 `compose` callback。

Bounded batch 指当前 plan 中有序的 Framed slides、一个 pinned browser process、受控 page/context reuse、既有 per-page timeout，以及显式 total operation limit。它不表示 unbounded concurrency、每个 field 一个 browser 或 long-lived daemon。

## Font 契约

每个 self-contained page 只嵌入实际出现 code points 所选择的 WOFF2 faces。不得把 `local()` 或 system-font fallback 当作成功路径。

验证区分三类事实：

1. 若 source literal 包含 checked-in inventory 未覆盖的 code point，则 source validation 失败，并返回 field name 和有界 `U+XXXX` values 列表。Coverage 是 code-point fact；diagnostics 不得声称广泛语言支持。
2. Expected font families 从实际 glyphs 所选 faces 派生。仅含 Latin 的页面不会因为未使用 Han face 而失败；选择 Han face 的页面则必须证明该 face 确实被使用。
3. Font file 缺失/损坏、pinned runtime 不可用或 font load 失败，属于 `environment` readiness failure。Text Frame leaf 中只要出现 rendered glyph count 大于零的真实 noncustom fallback，就必须 fail closed。

Font render-inventory digest 覆盖所有允许的 checked-in face bytes 和 pixel-relevant metadata：canonical face identity、family、style、weight、unicode ranges 与 content hash。Legal/provenance text、source URLs、host paths 和其他 non-rendering metadata 仍属于 integrity/readiness facts，但不触发 pixel invalidation。所选 subset 是确定性 page derivation，因此文字变化时不会改变 render-profile identity。

Layout compiler 使用显式、已 version 的 identity。任何影响像素的 compiler change 都必须 bump 该版本，并由 profile fixtures/coherence tests 守住这项义务；偶然 host paths 绝不参与 digest。

## Browser Layout 契约

Compiler 根据 preset coordinates 输出 fixed-size elements。验证使用与 CSS layout 对应的 DOM facts：

- slide canvas 与每个实际存在 panel 都具有 expected rectangle；
- 每个实际存在 field container 都具有精确 preset rectangle；
- 在一项有文档说明的小 device-pixel tolerance 内，`scrollWidth` 和 `scrollHeight` 不超过 field usable dimensions；
- 按 y coordinate 对 text `Range` fragments 分组，计算 rendered lines，且数量不超过 `max_lines`；
- 每个 expected leaf marker 恰好存在一次且可见渲染；
- panel rectangles 被相应 reserved underlay safe zones 包含；
- 针对真实 text leaves，CDP/runtime evidence 只报告所选 custom font families；
- 页面不发出 forbidden network request，capture 尺寸精确为 2000x1125。

原始 `Range.getClientRects()` glyph boxes 可用于分组行，但不要求完全留在 CSS field rectangle 内。Font ink 与 browser rounding 可以合法超出 layout box；field scroll geometry 才是 overflow authority。

当前 estimated glyph-width preflight 不得授权或拒绝 raw work。可以为 source grammar 与 code-point coverage 保留低成本 synchronous checks，但真实 Chromium layout 才是 fit authority。

## Lifecycle 集成

### Plan command

`image2 plan` 变为有序 transaction：

1. 通过新的只读 source-resolution path，把当前 source/registry facts 读取并解析为 candidate receipt。不得 initialize/advance source state，也不写 source receipt。
2. 在内存中编译全部 Framed descriptions、raw contracts、provider requests 和 candidate plan。
3. 在一个有界 Chromium batch 中验证全部 Text Frames。
4. 若每页都通过，通过既有 owners 提交精确 candidate source receipt/state 和 raw plan，再返回 exact plan hash。若任意页面失败，不写 source receipt、state、raw plan、authorization、provider、review、accepted-raw 或 final artifact。

当前 `resolveTargetSourceContext()` 会写 source receipt，并可能在编译前 initialize 或 advance state，所以不能复用于只读 candidate path。验证后，materialization 仍可使用其 state/receipt owners，但只有 raw plan 绑定刚刚提交的 receipt 与 source epoch 时才能发布。Partial filesystem failure 必须保持 fail-closed 且可重跑；绝不能留下绑定另一 source tuple 的可授权 plan。

### 后续 raw lifecycle commands

Authorize、generate、prepare review、decide review 和 accept 必须加载已经物化的 plan。它们按需在内存中重新编译确定性 current contract/profile facts，并验证 stored plan、当前 source receipt、profile digest 和 exact plan hash。它们不重写 plan，也不重跑 Chromium layout proof。

该验证使用同一个只读 current-source/plan context。Planning 后发生 source changes，会因 stale 而失败并要求新的 `image2 plan`；后续 command 不得在发现 drift 时顺带推进 source epoch。

这会移除当前每个 command 都调用同时写 plan 的 plan builder 这一模式。

### Final composition

Finalization 加载精确 accepted underlay evidence，并针对有界集合调用 `composePages`。Renderer 在 capture final bytes 时重复同一 geometry/font assertions。失败时不发布 partial final manifest 或 delivery artifact。成功字节继续通过既有 shared final manifest 与 delivery owners；不引入新的 durable proof schema。

### Text-only 与 notes-only refresh

当 slide order、visual/raw contract、safe zones、provider profile 和 render profile 都未改变，且精确 accepted underlay evidence 当前有效时，Text Frame-only edit 继续保持 provider-free。刷新文字在发布前的 local final composition 中验证并证明。

Notes-only refresh 不启动 Chromium。它仍必须通过当前 owner 拒绝 pixel-owning source drift 与 profile drift。Structural edits 或 workflow changes 继续要求 preview 加 exact Structural Versioning plan hash。

## 失效 Policy

规范化 preset facts、compiler identity、allowed font inventory、font-selection algorithm、pinned runtime identity 或 capture profile 中任何一项变化，都会改变 `render_profile_digest`。该变化通过既有 hash/owner checks，使受影响 Framed raw plans、authorization、raw review、accepted raw evidence、final manifest 和 delivery derivatives 失效。

恢复路径是既有 generated-image rebuild path。即使旧 accepted underlays 的 safe-zone rectangles 恰好未变，也不得静默 rebind。未来优化可以引入分别推理的 underlay-contract 与 render-profile identities，但这被有意排除在本 change 外。

Text literals 与其 selected shard subset 不改变 profile，单独出现时不产生 provider debt。拥有 underlay 的 visual facts、safe zones、provider profile、slide order 和 workflow 继续遵守当前 invalidation rules。

## 兼容性、幂等性与恢复

Run-bundle contract impact 是 `compatible`，不是 source/state migration。Source grammar、version workflow、slide identity、state ownership 和既有 provider authorization boundary 保持不变。有意承担的 compatibility 成本是：新的 render-profile digest 会让旧 Framed derived evidence 陈旧；已选 run 通过 Generated Image Rebuild 修复。

不批量迁移 deck、不自动 rebind underlay，也不手工编辑 `_generated/`。未选择的 production decks 不会被打开或重写。

Direct facts 不变时，candidate compilation/profile construction 是确定性的，plan verification 可重算；重跑成功 plan 会得到相同 canonical plan identity。Proof 后的 materialization 使用既有精确 owners。Partial write 继续不可授权，通过重跑同一 plan checkpoint 修复；不引入 parallel journal 或 success record。

Rollback 不会跨 profile identities 重新解释 artifacts。若 code revert，只有当 artifacts 能通过该代码当前 contract 验证时才消费；否则仍由所属 rebuild path 恢复。

## Raw Review 边界

Browser proof 可以确认本地 typography 与 safe-zone geometry，却不能可靠确认 generated underlay 不含 readable text 或在视觉上适配。这些判断继续由人类 raw review 所有；不增加 OCR 或 automatic acceptance。

通用 raw-review projection 仍必须展示 Framed reserved safe-zone guides 与 `position + formal slide_id + title`。当前 v2 review 只展示 images 和 IDs，遗漏了已接受的 projection/capture-profile coverage。

用 typed projection contribution 保持 ownership：

```text
已选 workflow adapter
  -> generic review contribution
       { slide identity, overlay primitives, workflow profile digest }
  -> shared raw-review owner
       { exact raw bytes, generic labels, contribution digest,
         raw-review projection/capture profile }
  -> projection PNG + coverage + human decision
```

对 Framed，adapter 把 reserved rectangles 转为 generic guide primitives，并贡献 `render_profile_digest`。Shared owner 验证、渲染 rectangles，但不 parse Text Frame literals，也不按 Framed semantics 分支。其自身 canonical projection-profile digest 标识 contact-sheet layout、guide rendering、labels 和 capture behavior。Coverage 同时绑定两种 identity，不把任何一种与 provider generation profile 混为一谈。

恢复这些 accepted contract facts 属于独立 shared-owner change，不是 Framed renderer 的隐藏副作用。

## Pilot Run 依赖边界

[pilot-run-plan.md](pilot-run-plan.md) 中的渐进式生产 UX 依赖本 render contract，但不属于 renderer module 内部。

Framed Pilot Run 必须通过 final composition 所用的同一套私有 compiler、font selection、browser evaluator 与 capture profile，合成代表性、尚未审查的 underlays。它可以发布 preview-only pilot bytes 与 evidence，但不能发布 accepted raw evidence、final manifest、PPTX、notes 或 delivery state。这样可让前置样本生产等价，又不增加另一 renderer 或 finalization bypass。

Renderer 仍不了解 pilot selection、human decisions、batch authorization 和 expansion。这些事实属于已选 Framed Controller 和既有 shared raw/state owners。Pure Pilot Run 完全不导入本模块；其 provider bytes 已拥有最终页面像素。

因此实现顺序必须严格：先接受并归档本 render contract；再恢复 shared raw-review contribution contract；最后让后续 Pilot Run change 消费二者。如果 pilot 基于当前深色 Arial compositor 实现，虽然能提早反馈，却仍会要求人判断不属于已声明 Framed contract 的像素。

## Diagnostic Ownership

使用既有 producer-owned CLI diagnostic envelope 与 `scripts/shared/cli/cli_error.mjs`。至少区分：

- `source_validation`：非法 literal、不支持的 code point、variant mismatch 或不适配的 text field；
- `environment`：缺失 Playwright/Chromium、runtime identity mismatch、缺失/损坏 font shard、font load failure 或 capture readiness failure；
- `internal`：source editing 无法修复的 preset/compiler panel、field、safe-zone、leaf 或 capture-geometry mismatch；
- stale evidence：当前 source/profile/plan 不再匹配持久化 raw lifecycle artifacts。

Provider 调用前发生的 layout/runtime failures，绝不分类为通用 `provider` errors。MD Controller 消费 producer result，不得复制其 schema。

Direct `env-check.mjs` 必须保留 zero-static-npm-dependency startup path。只有 package presence checks 通过后，才能动态加载 profile/font/browser readiness；缺失 `node_modules` 仍应形成正常、可执行的 environment report，而不是 module-load crash。

## 明确暂缓项

- 更多 presets 或面向 author 的 style configuration。
- Durable DOM/layout proof artifacts。
- OCR 或 automatic raw-underlay semantic validation。
- Cross-profile accepted-underlay reuse。
- Per-slide workflow mixing。
- 仅基于 Unicode coverage 声称 language support。

这些属于独立 product 或 architecture decisions，不是本次修正隐藏的 follow-up requirements。
