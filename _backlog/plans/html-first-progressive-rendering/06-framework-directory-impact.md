# 专题 06: PPTMAKER_FRAMEWORK 目录影响

> 总控: [`../html-first-progressive-rendering.md`](../html-first-progressive-rendering.md)
> 状态: workflow/playbook 迁移已由 Change 3 落地；scripts 层次迁移新增为 Change 4；Image2 refinement 顺延为 Change 5 | 更新: 2026-07-20

## 这份文档回答什么

这份文档回答三件必须同时成立的事：总计划落地后 `PPTMAKER_FRAMEWORK/` 的 `workflow/` / `playbook/` 会变成什么样，`scripts/` 与 `tests/` / `tests_e2e/` 如何用可一一定位的物理层次表达同一组 lifecycle/capability ownership，以及它们如何指向 [04-run-bundle-and-artifacts.md](04-run-bundle-and-artifacts.md) 定义的 HTML/Image2 物理分区。

- 这里画的是 framework soft bundle，不是 `deck_*` run bundle。
- 本计划阶段不移动 framework 文件；实际 rename/rewrite 必须进入对应 OpenSpec change。
- framework 根仍严格保持 5 个子目录：`workflow/`、`scripts/`、`charter/`、`reference/`、`playbook/`。不会新增第六个根目录。
- run bundle 仍保持 `1_upstream_raw_material/` → `2_backbone/` → `3_versions/vN/` 三层本体论；本文件不把 run-bundle 目录定义复制进 framework。
- 目标树中的公开方法文档、script phase interface、import direction 和职责在本计划锁定；phase 私有实现文件名可在 Change 4 design 中微调，但不得恢复万能 `scripts/lib/` 或改变本页规定的 module interface 和所有权。

## 一眼看懂

```text
当前 Image2-first 方法树                    最终 HTML-first 方法树

00-setup                                  00-setup
01-visual          style master 必经       01-content
02-content                                 02-visual-system
03-prompts         整页生图 prompt 必经 -> 03-html-production
04-production      Image2 Stage 2/3        04-image2-refinement 可选、付费
05-iteration                               05-iteration
```

核心变化不是多加一份 HTML 文档，而是重写默认生命周期：

```text
当前: setup -> content/visual -> style master -> IMAGE PROMPT
      -> Image2 whole-page -> header lock -> PPTX -> iteration

目标: setup -> structured content -> renderer-neutral visual system
      -> HTML complete PPTX -> user may finish
      -> optional authorized Image2 visual-slot asset upgrade -> local recomposition
      -> iteration / maintenance
```

## 最终 `workflow/` 目标树

`workflow/` 的目录形状已在 Change 3 一次迁移到最终六目录；Change 4 只迁移 `scripts/` 的代码所有权层次，不激活任何 Image2 refinement；Change 5 才激活并补全可选 Image2 refinement 内容。目录编号同时成为 Lifecycle Phase 与 `method_module` 顺序，不再维护“Method Module 编号与 Lifecycle Phase 编号不同”的双重解释。

目标 lifecycle 为 `0 -> 1 -> 2 -> 3 -> [4 optional] -> 5`：Phase 3 已经交付完整 PPTX；Phase 4 只有用户明确选择 Image2 专业升级时进入；Phase 5 可从 HTML 成品或采用 Image2 asset 后的成品开始迭代。Change 3 必须同步迁移 `node-specification` 的 `lifecycle_phase`/`method_module` enum、全部 playbook node frontmatter、validator fixture 和既有 `_state` 的续跑解释。

四层必须一一对应，用户和 Agent 不需要跨文档猜所有权：

| 用户正在做什么 | Workflow 方法 | Playbook Controller | Run bundle 主要路径 | 远端成本 |
|---|---|---|---|---|
| 完成一份可直接使用的 PPT | `03-html-production/` | `create-deck` / `quick-preview` / build nodes | `_generated/html_production/` | 无 |
| 修改文案、layout、visual system、notes 或结构 | `05-iteration/` | `edit-text` / `edit-visual` / `iterate-style` / `edit-notes` / `restructure-slides` | source + `_generated/html_production/` | 无 |
| 在已完成 HTML deck 上升级少数主视觉 | `04-image2-refinement/` | `image2-refine` | lazy `_scratch/image2_refinement/` + `_generated/image2_refinement/`；接受后进入 `overrides/.../refined/image2/` | 有，必须授权 |
| 维护未迁移的旧 Image2-first deck | `reference/legacy-image2-first-maintenance.md` | `legacy-image2-maintenance` | legacy version-owned paths | 有，沿旧合同 |

任何实现若让同一用户意图同时匹配两行，或让普通 HTML/local 行触达 Image2 adapter，即为 ownership 错误。

已有 deck 的断线续跑不能因 framework 目录改名而丢失。state heal 必须确定性映射仍存在的 playbook/current-node/module 引用，保留 completed evidence、human waits、execution identity 和 reserved records；若旧执行拓扑无法无歧义映射，必须返回需要人类确认的 replacement/restart 诊断，不能静默清空进度或假装 completed。legacy deck 即使不迁移内容，也必须能在新 framework 下 `ppt_flow state/status` 并继续其兼容维护路径；历史 markerless deck 若本来没有 `_state`，只读 state/status/check 不得为了展示而创建执行记录，显式进入 legacy controller 时才初始化 durable state。

```text
PPTMAKER_FRAMEWORK/workflow/
├── README.md
│
├── 00-setup/
│   ├── README.md
│   ├── 00-run-bundle-concept.md
│   ├── 00-zero-to-ready.md
│   ├── 02-nodejs-environment.md
│   ├── 03-runtime-and-tools.md
│   ├── 04-conventions.md
│   ├── 05-migrate-import-existing-deck.md
│   └── template-deck-guide.md
│
├── 01-content/
│   ├── README.md
│   ├── 00-the-problem-why-slide-count-fails.md
│   ├── 01-find-the-core-metaphor-and-formula.md
│   ├── 02-build-narrative-arc-blocks.md
│   ├── 03-specify-structured-slides.md
│   ├── 04-choose-layout-families.md
│   ├── 05-create-content-assets.md
│   ├── 06-iterate-with-version-discipline.md
│   ├── template-slide-specifications.md
│   ├── templates-and-examples...
│   └── presets/...
│
├── 02-visual-system/
│   ├── README.md
│   ├── 00-why-deterministic-visual-systems.md
│   ├── 01-gather-product-context-dna.md
│   ├── 02-design-the-visual-system.md
│   ├── 03-configure-visual-tokens.md
│   ├── 04-validate-the-html-system.md
│   ├── template-deck-system.txt
│   ├── template-color-palette.json
│   └── presets/...
│
├── 03-html-production/
│   ├── README.md
│   ├── 00-the-pipeline-philosophy.md
│   ├── 01-stage-1-resolve-slide-plan.md
│   ├── 02-stage-2-render-html-pages.md
│   ├── 03-stage-3-compose-final-slides.md
│   ├── 04-stage-4-build-the-pptx-container.md
│   ├── 05-stage-5-inject-speaker-notes.md
│   └── reference-pipeline-scripts.md
│
├── 04-image2-refinement/
│   ├── README.md
│   ├── 00-when-refinement-is-worth-it.md
│   ├── 01-recommend-visual-slots.md
│   ├── 02-plan-and-authorize-cost.md
│   ├── 03-design-image2-visual-briefs.md
│   ├── 04-generate-and-review-candidates.md
│   ├── 05-accept-fallback-and-clean.md
│   ├── 06-debug-provider-and-retry.md
│   └── template-visual-refinement-brief.md
│
└── 05-iteration/
    ├── README.md
    ├── 00-openspec-capabilities-for-ppt.md
    ├── 01-content-and-layout-iteration.md
    ├── 02-visual-system-iteration.md
    ├── 03-structural-versioning-workflow.md
    ├── 04-image2-refinement-iteration.md
    └── 05-end-to-end-walkthrough.md
```

旧 deck 的方法说明不进入上面的 active phase tree，而是单独位于 `PPTMAKER_FRAMEWORK/reference/legacy-image2-first-maintenance.md`；执行入口由 `playbook/legacy-image2-maintenance.md` 拥有。

## 当前目录怎样迁移

| 当前目录 | 最终去向 | 处理方式 | 原因 |
|---|---|---|---|
| `00-setup/` | `00-setup/` | 保留并改写 | base readiness 不再要求 Image2；Image2 setup 移至可选 refinement |
| `01-visual/` | `02-visual-system/` + `04-image2-refinement/` | 拆分 | visual tokens/presets 属于所有 deck；style master/prompt/review 只属于专业 Image2 精修 |
| `02-content/` | `01-content/` | rename + 扩展 | 内容成为默认第一工作面；新增 structured body 和 family authoring |
| `03-prompts/` | `04-image2-refinement/`（专业知识）+ `reference/legacy-image2-first-maintenance.md`（旧 deck） | 吸收后删除旧目录 | Image prompt 不再是所有新页面必经的独立阶段 |
| `04-production/` | `03-html-production/` | rename + 重写 Stage 2/3 | 默认生产改为 HTML render + deterministic composition；Image2 不作为整页 production renderer |
| `05-iteration/` | `05-iteration/` | 保留并改写 | 默认刷新变成本地 rebuild；远端重试需要新授权 |

最终不得同时保留旧目录和新目录作为两套活跃方法论。Change 3 必须原子更新全 framework cross-reference、frontmatter `stage/depends_on/feeds_into`、playbook `lifecycle_phase/method_module`、state heal/migration、OpenSpec main specs 和链接扫描；旧路径不能靠复制文件长期兼容。

## Gate 合同怎样变化

为避免同时迁移 state/metadata 的 gate key，`content` 和 `visual` 两个 gate 名称保留，但其证据按 `production.pipeline` 分支，不能混用：

| Gate | HTML-first deck | Legacy Image2-first deck |
|---|---|---|
| `content` | 用户确认 narrative、准确 header/body、family 和 fallback 已可进入渲染 | 保持当前内容确认语义 |
| `visual` | 使用与正式生产相同的 HTML compositor 渲染代表页/contact sheet，展示实物后由用户确认 visual system；不要求 style master 或 Image2 | 保持当前 style master/pilot review 语义 |
| Image2 page review | 不复用全 deck `visual` gate；每个 candidate 的 accepted/use-html 决定写入 version-scoped `image2-refinement` state | legacy 继续使用独立 maintenance review evidence |

HTML-first 的 `visual` gate 只阻断最终 PPTX publication，不阻断零远端、可反复重跑的 HTML preview/composition。这样 Phase 2 能看到真实产物再确认，Phase 3 仍拥有正式 contact sheet/PPTX/notes 交付。

gate evidence 记录 pipeline marker、`visual_system_fingerprint`、已覆盖的 family/geometry、代表页 IDs 和当时展示的 preview SHAs。`visual_system_fingerprint` 覆盖 visual config、renderer/runtime profile、family registry、CSS/abstract recipe/chart/compositor versions，以及 gate 代表页实际消费的 renderer-neutral fallback asset SHAs；versioned canonicalization 由 JS 拥有。preview SHA 是“用户看过什么”的审计证据，不直接参与 freshness。

以下变化使全册 visual gate stale：visual config、renderer/runtime/family registry/recipe/compositor 版本改变，或出现尚未覆盖的新 `component_recipe_key_v1`（family、geometry、typed/chart kind/count/formatter/legend discriminator、primary-visual/fallback recipe kind）。普通 header/body/label 文案变化只需重新通过 content/schema/pixel overflow 和本地 composition，不重新索要视觉批准。global system fingerprint 与 page dependency 严格分离：全局变化重审每个 current recipe key 的代表页，不因 page fingerprint 重复 global 输入而逐页 stale。只影响某些页面的 chart numeric shape、fallback/source/selected/inline-icon asset byte、visual resolution 或已覆盖 recipe key 变化时，classifier 展示受影响页面，并在 `page_reviews[slide_id]` 下记录排除 global/ordinary-copy/notes/position 的 `page_visual_dependency_fingerprint_v1`，同时保留 shown effective/forced-fallback composition/preview SHA 作 audit。它不新增第三个 gate key，也不要求重批未受影响 coverage。当前为 `selected` 时必须强制 identity 独立的 forced-fallback variant，不能拿 accepted 图代审。accepted selection byte 变化是 SHA integrity failure，必须正式修复。legacy evidence 与 HTML evidence 双向隔离。

`ppt_flow state --check-gates` 必须先分类 pipeline：HTML 只接受当前 version-scoped content/visual records、当前 nullable HTML-production reset ID、完整可批准 plan/audit bytes、fresh fingerprints 和已完成恢复的 journal；HTML 只写独立 `html_content_gate|html_visual_gate` + run-version metadata 与 `_state.gates.html_*` status mirrors，绝不覆盖 markerless 既有 `content_gate|visual_gate` / `_state.gates.content|visual`，任何 mirror 都不能让 HTML 单独通过。markerless 只读自己的既有 scalar gate 语义并忽略 `html_*`。`html-delivery-review` 绑定同一 reset ID，影响 completion/resume 但不是第三个 gate。plain state/status 只报告 journal/reset，不恢复写；state/status 必须列出 HTML content/visual/delivery freshness、reset status 与 outstanding recipe key/page IDs；当前 HTML 已完成时不得显示 Change 3 尚不可用的 Phase 4 为欠账。

上述读取/写入不得散落在 `approve`、`checkBundle`、state/status、refresh 和 Stage 4：Change 3 用单一 deep module 暴露 read-only `inspectHtmlReviewReadiness(runDir)`、显式 `recoverHtmlGatePublication(runDir,{confirmedOwnerToken})`、`publishHtmlGateDecision(...)`、`publishHtmlDeliveryDecision(...)`、`resetHtmlProduction(runDir,{confirmedRunVersion})`，内部独占 canonical path/version/reset/owner ID、fingerprint、immutable evidence、journal recovery、timestamp/SHA 与 exact generated-owner 推导。plain state/status/checkBundle 只 inspect；build/check-gates/gate publication 明确做同机死亡 60 秒自动 recover 后再检查；跨机/不确定 journal 只能由 human-confirmed exact token 在 5 分钟后恢复。confirmed canonical whole-owner reset 只能走 `refresh --kind reset-html-production --confirm-run-version <vN>`：先以 expected-state CAS 写入 `html-production-reset: deletion_pending`、旋转语义 reset ID 并安装独立 owner token/host/PID/claim time、使匹配 HTML mirrors pending并形成写栅栏，再删除完整 owner，最后将同一 ID 标为 complete；live owner 不可覆盖，同机 dead 60 秒后一个 CAS claimant 自动接管，跨机/PID-uncertain 5 分钟后只能 human-confirmed 接管，竞争 claimant 必须让给单一 owner；崩溃重跑继续同一 reset ID，complete+owner absent 幂等成功。若 reset 与 journal creation 竞争，只允许“old state + exact reset-pending projection、old/pending-only metadata、gate new state 从未出现”这一种 third-state 清理 journal，其余第三 SHA 仍 fail closed；所有 HTML state writer 在 rename 前重查 expected SHA/reset fence。调用方不得传 metadata mirrors、state records、manifest path、reset/owner ID 或 digest 作为替代真相，测试也跨同一 interface。

五个 public interface 均为同步、本地文件系统、零 browser/provider，保留现有同步 `checkBundle`。为避免 `bundle_layout` 与 HTML contract 的静态循环，唯一 evaluator 放在 internal core：`bundle_layout` 用自己 SSOT constants/resolvers 构造 trusted context，public facade 也通过这些 exports 构造同一 context；core/context 不暴露给 orchestration，外部调用方不能注入路径或预制 snapshot。canonical manifests/plans/receipts 与 gate/delivery records 绑定 current nullable reset ID，review-plan hash 包含它，但 raw HTML/PNG/contact-sheet 和 composition/final-slide/delivery identity 不包含它；因此字节可安全复用，reset 前授权却绝不会复活。若 generated owner 意外缺失但当前 reset ID 已有 gate/delivery/Stage-4/5 authority，直接重建必须先旋转 reset ID；owner 缺失且无当前 authority 才可视为普通首次/未批准 preview 重建。

## `workflow/` 逐文件处置

### `00-setup/`

| 当前文件 | 目标动作 |
|---|---|
| `00-run-bundle-concept.md` | 保留；补 HTML-first source/generated artifact 说明 |
| `00-zero-to-ready.md` | 改写为 base HTML readiness；Image2 不再阻断新手 |
| `02-nodejs-environment.md` | 更新 `>=22` engine floor、supported `22.x`/`24.x`/`26.x` profile、Playwright/Chromium、bundled fonts |
| `03-tool-selection.md` | rename 为 `03-runtime-and-tools.md`；只讲基础 runtime，provider 配置迁到 `04-image2-refinement/` |
| `04-conventions.md` | 更新 `production.pipeline`、`SLIDE BODY` 和 source ownership |
| `05-migrate-import-existing-deck.md` | 增加 legacy Image2-first -> clean HTML-first vNext 对照 gate |
| `template-deck-guide.md` | 新 deck 默认说明 HTML complete delivery，不要求 key/style master |

### 当前 `02-content/` -> 目标 `01-content/`

| 当前文件 | 目标动作 |
|---|---|
| `00-the-problem-why-slide-count-fails.md` | rename 路径，内容保留 |
| `01-find-the-core-metaphor-and-formula.md` | rename 路径，适配结构化 source 术语 |
| `02-build-narrative-arc-blocks.md` | rename 路径，适配 stable ID/position |
| `03-specify-slides-multi-layer.md` | 改为 `03-specify-structured-slides.md`；L3 从 `IMAGE PROMPT` 改为 `SLIDE BODY` |
| 新文件 | `04-choose-layout-families.md`：family、typed block、capacity、fallback authoring |
| `04-create-content-assets.md` | 顺延为 `05-...`；使用 merged asset catalog |
| `05-iterate-with-version-discipline.md` | 顺延为 `06-...`；结构变化仍走 clean vNext |
| `template-slide-specifications.md` | 默认写 `production.pipeline: html-first-v1`、mnemonic ID、`SLIDE BODY` |
| examples/presets/templates | 全部更新示例，不再把准确正文藏进 prompt |

### 当前 `01-visual/` -> 目标 `02-visual-system/` 与 `04-image2-refinement/`

| 当前文件 | 目标动作 |
|---|---|
| `00-the-problem-why-text-fails.md` | 不原样保留；改写为 `02-visual-system/00-why-deterministic-visual-systems.md` |
| `01-gather-product-context-dna.md` | 移入 `02-visual-system/` |
| `02-design-the-visual-system.md` | 移入 `02-visual-system/`，视觉决策落到 visual config |
| `03-write-the-style-master-prompt.md` | 移入 `04-image2-refinement/03-design-image2-visual-briefs.md`，从默认必经降为可选 |
| `04-iterate-review-lock.md` | 拆成 HTML visual-system validation 与 Image2 candidate review 两部分 |
| `05-use-the-style-master-for-slides.md` | 改写为 Image2 refinement style-reference 使用规则，不再控制整页 layout |
| `template-deck-system.txt` | 移入 `02-visual-system/`，继续拥有自然语言约束 |
| `template-visual-style.md` | 拆为 renderer-neutral config template + optional refinement brief template |
| `presets/` | 移入 `02-visual-system/presets/`；扩展 body/layout/chart/callout tokens |

结构化视觉真相仍叫 `color_palette.json`；这里的 `template-color-palette.json` 只是它的 authoring template。不得再创建 `html-theme.json` 或第二份 visual-config source。

### 当前 `03-prompts/` -> 目标 `04-image2-refinement/` / legacy reference

| 当前文件 | 目标动作 |
|---|---|
| `00-why-prompt-engineering-matters.md` | 改写为“何时精修值得成本”，不再是默认生命周期 checkpoint |
| `01-understanding-the-model.md` | 保留为 Image2 refinement 专业知识 |
| `02-prompt-structure-and-patterns.md` | 改写为无文字 visual-slot brief/prompt 派生规则 |
| `03-style-anchoring-in-practice.md` | 改写为 style reference setup 与 provenance |
| `04-iteration-and-debugging.md` | 改写为 plan/authorization/unknown-submit/retry 纪律 |
| `05-resolution-quality-tradeoffs.md` | 保留为 profile、质量、成本选择 |
| `template-image-prompt-builder.md` | 替换为 `template-visual-refinement-brief.md`；不允许准确文字和整页 layout |
| 新文件 `reference/legacy-image2-first-maintenance.md` | 汇总旧 deck 的 style master、whole-page prompt、pilot/review 与刷新入口；仅兼容维护，不进入新 deck 默认生命周期 |

### 当前 `04-production/` -> 目标 `03-html-production/`

| 当前文件 | 目标动作 |
|---|---|
| `00-the-pipeline-philosophy.md` | 改写为 HTML complete first、Image2 asset refinement explicit |
| `01-stage-1-parse-content-to-specs.md` | 改为 resolve/validate structured slide plan，同时保留 legacy branch |
| `02-stage-2-generate-images-with-anchoring.md` | 默认文档替换为 HTML page rendering；legacy whole-page Image2 只留指向 legacy reference 的兼容说明 |
| `03-stage-3-lock-headers-deterministically.md` | 改为 final-slide composition；HTML 拥有所有准确文字 |
| `04-stage-4-build-the-pptx-container.md` | 保留，改为只消费 verified provider-neutral `final-slide` |
| `05-stage-5-inject-speaker-notes.md` | 保留，继续按 stable ID + current order 注入 |
| `reference-pipeline-scripts.md` | Change 3 更新 HTML/local CLI 和 legacy compatibility；Change 4 更新迁移后的 canonical script paths；Change 5 才加入实际可用的 `image2` CLI |

### `05-iteration/`

| 当前文件 | 目标动作 |
|---|---|
| `00-openspec-capabilities-for-ppt.md` | 更新 capability 和四个最终 refresh/structural 概念 |
| `01-content-iteration-workflow.md` | 改为 content + family，普通变化全部本地重合成 |
| `02-style-iteration-workflow.md` | 改为 renderer-neutral visual config；style reference 变化归 refinement |
| `03-pipeline-change-workflow.md` | 改为 structural versioning + artifact invalidation 路径 |
| 新文件 `04-image2-refinement-iteration.md` | Change 5 新增；明确 Image2 retry/new candidate 必须新 plan 和授权，HTML/local iteration 仍走本地路径；Change 3/4 不创建可执行内容 |
| `04-end-to-end-walkthrough.md` | 顺延为 `05-...`，展示 novice stop 与 professional continue 两条结尾 |

## 迭代与刷新分类

Change 3 起，change classifier 先读取 `production.pipeline`，再选择所有权和最小失效路径；不能再用 render mode 统一解释新旧 deck。

| 用户改动 | HTML-first 路径 | Legacy 路径 |
|---|---|---|
| 单页 header/body/family/fallback | Local Slide Rebuild：parse/validate -> HTML render -> compose -> affected-page review -> contact sheet/PPTX；零远端；纯文字不重批整册 visual gate，family/asset 变化按上文刷新相应 evidence | 保持 Header Text & Style Refresh / Generated Image Rebuild 分流 |
| deck visual config | Local Deck Rebuild：使受影响 HTML/final-slide 失效，先出代表页 visual gate，再本地全量 | 保持 style master -> pilot -> Generated Image Rebuild |
| notes only | Notes-Only Refresh | Notes-Only Refresh |
| 增删重排 | Structural Versioning Path source publication -> `needs_local_materialization` -> target-local HTML rebuild；零远端 | 保持当前 structural materialization/`needs_render` 远端授权语义 |
| 已接受主视觉后的普通文字/layout 变化 | 若 visual contract 仍匹配则本地重合成；不匹配则 stale 并回退 HTML，不自动生成 | 不适用 |
| 用户明确要求新的专业主视觉 | Phase 4 新 Image2 plan/authorization | legacy Generated Image Rebuild，除非先显式迁移 deck |

`Local Slide Rebuild`、`Local Deck Rebuild`、`Notes-Only Refresh` 和 `Structural Versioning Path` 是 HTML-first 的稳定维护检索词。Phase 4 Image2 refinement 是单独的付费工作流，不伪装成普通 refresh。Phase 5 iteration 不是单向终点；它按这张表回到对应 source owner/production path，再返回可交付状态。

## `PPTMAKER_FRAMEWORK/` 其他目录怎样变

根目录形状不变，但以下文件会随 workflow 一起改，避免方法论与执行代码分裂。

```text
PPTMAKER_FRAMEWORK/
├── BOOTSTRAP.md                 [改] base HTML readiness；Image2 按需 onboarding
├── COMMANDS.md                  [改] build + `image2` 命令与用户话术
├── AGENTS.md                    [改] Phase 顺序、gate、source ownership
├── README.md                    [改] 新 workflow 树
├── charter/
│   ├── WORKFLOW.md              [改] HTML complete -> optional refinement
│   ├── AGENT_CONTRACT.md        [改] 成本授权/show-before-gate 细化
│   └── CONSTITUTION.md          [改] 只同步 run-bundle 目标树，不复制权威
├── playbook/
│   ├── create-deck.md           [改] 新 deck 默认 HTML-first
│   ├── edit-text.md             [改] local compose，不按 render mode 分流
│   ├── edit-visual.md           [改] HTML/local visual config；专业升级只路由到 Image2
│   ├── iterate-style.md         [改] HTML visual system 为默认
│   ├── quick-preview.md         [改] HTML contact sheet，不要求 style master
│   ├── image2-refine.md         [新] HTML 成品后的推荐、授权、候选、逐页 review
│   ├── legacy-image2-maintenance.md [新] 仅 legacy pipeline 的 whole-page Image2 兼容维护
│   └── classify-change.md       [改] 先 pipeline marker，再结构/所有权/失效，最后判断是否需远端
└── scripts/
    ├── README.md
    ├── ppt_flow.mjs                 唯一 canonical root front controller
    ├── 00-setup/
    │   ├── index.mjs                Phase 0 interface
    │   ├── env-check.mjs
    │   └── internal/                runtime/package/font readiness implementation
    ├── 01-content/
    │   ├── index.mjs                structured source/identity interface
    │   └── internal/                slide document、ID、source contract implementation
    ├── 02-visual-system/
    │   ├── index.mjs                visual config/catalog/family interface
    │   └── internal/                tokens、assets、geometry、component registry implementation
    ├── 03-html-production/
    │   ├── index.mjs                complete local Stages 1-5 interface
    │   ├── stage1_build_inputs.mjs
    │   ├── stage2_render_html.mjs
    │   ├── stage3_compose_slides.mjs
    │   ├── stage4_build_pptx.mjs
    │   ├── stage5_inject_notes.mjs
    │   └── internal/                renderer/runtime/object/review/artifact/notes implementation
    ├── 04-image2-refinement/
    │   └── README.md                 Change 4 仍 unavailable；Change 5 才加入 executable/module
    ├── 05-iteration/
    │   ├── index.mjs                local maintenance/version/migration/legacy interface
    │   ├── structural/
    │   ├── migration/
    │   └── legacy-image2/            old whole-page generation/header-lock maintenance
    ├── shared/
    │   ├── cli/                      envelope/bootstrap/progress
    │   ├── run-bundle/               layout、marker、coherence
    │   ├── state/                    state/controller/evidence primitives
    │   └── identity/                 canonical bytes、receipts、common artifact identity
    ├── contracts/                    versioned JSON/evidence contracts and generators
    ├── fonts/                        bundled licensed font resources
    └── fixtures/                     checked-in runtime/golden fixtures
```

这里的 `index.mjs` 是 phase module 的 interface，不是把私有函数逐个 re-export 的 barrel。每个 interface 必须隐藏本 phase 的路径、receipt、runtime 和 transaction 细节；调用方与测试通过同一个 seam。`internal/` 只是一条可见的“不得跨 phase import”标记，内部仍应按真实职责分组，不能成为新的平铺垃圾场。

Change 4 必须锁定并机器检查以下 import direction：

- `ppt_flow.mjs` 只依赖 phase `index.mjs` 与 `shared/cli`，不直接进入任何 `internal/`。
- `shared/` 不依赖 00-05 phase；phase 可以依赖分类后的 shared module。
- Phase 3 只通过 Phase 1/2 的 interface 消费 structured content 与 visual system；Phase 4 只通过 Phase 1/2/3 interface 消费完整 HTML deck；Phase 5 只通过 owning phase interface 发起 rebuild/migration/legacy maintenance。
- 任何 phase 不得 import 另一 phase 的 `internal/`、CLI 文件或物理 artifact path constant。
- legacy Image2 transport 物理位于 `05-iteration/legacy-image2/`；Change 5 的 modern Image2 adapter 物理位于 `04-image2-refinement/`，两者不能共享业务 implementation，只能共同依赖明确的外部 transport port。
- 根目录不保留旧路径 shim 集合。若 canonical direct executable 路径发生 breaking change，Change 4 必须原子更新 `cli-surface`、COMMANDS/BOOTSTRAP/AGENTS、executable inventory、diagnostic invocation、tests 和所有 active links。

Change 4 不是“移动文件后保留原有测试再叠一层 wrapper”。旧的内部文件级测试应由 phase interface 测试替代；只有 versioned pure contract/golden 与真实外部 adapter 测试继续保留。迁移后的 architecture self-check 必须枚举根文件白名单、六个 phase 目录、每个 `index.mjs`、禁止的跨 phase internal imports、direct executable inventory 和零 `scripts/lib/`。

`tests/` 和 `tests_e2e/` 必须与 scripts ownership 同步迁移，目标顶层如下：

```text
tests/
├── 00-setup/
├── 01-content/
├── 02-visual-system/
├── 03-html-production/
├── 04-image2-refinement/     Change 4 仅 README/absence contract
├── 05-iteration/
├── shared/
├── contracts/
└── helpers/                  只放 fixture builders；不得实现业务规则

tests_e2e/
├── 00-setup/
├── 01-content/
├── 02-visual-system/
├── 03-html-production/
├── 04-image2-refinement/     Change 5 才加入付费精修旅程
├── 05-iteration/
└── helpers/
```

一一对应指 ownership 可双向定位，不要求每个私有 `.mjs` 都机械配一个同名测试文件：

- `scripts/<phase>/index.mjs` 的 interface/golden/integration tests 必须位于 `tests/<phase>/`；该 phase 的纯内部 contract 测试也只能位于同目录。
- 跨 phase E2E 按“最终对用户结果负责的 phase”归档：fresh HTML delivery 属于 `tests_e2e/03-html-production/`，structural/migration/legacy maintenance 属于 `tests_e2e/05-iteration/`，future paid refinement 属于 `tests_e2e/04-image2-refinement/`。
- `tests/shared/` 只验证真正跨 phase 的 shared module；不能成为无法归类测试的新垃圾场。`tests/helpers/` 与 `tests_e2e/helpers/` 只构造输入、fake adapter 和临时目录，不复制 production parser/state/fingerprint 逻辑。
- `tests/`、`tests_e2e/` 根目录不得保留 `test_*.mjs` 业务文件；Vitest config、CLI audit 和 docs coherence 必须递归发现新层次并检查 source/test ownership map 完整。
- Change 4 必须生成并验证一份 machine-readable source-to-test ownership manifest，至少覆盖每个 phase interface、direct executable、shared interface、对应 unit/integration suite 和拥有其用户旅程的 E2E suite；缺失、多 owner 或旧平铺路径均 fail closed。

后续 design 应保持两个主要领域 interface，并允许 Change 4 在不扩大调用面前提下按当前实现深化名称：

```text
parseAndResolveSlideDocument(source, resolved_config, resolved_assets)
  -> validated structured slide plan | diagnostics

composeSlide(structured_plan, resolved_assets, runtime_profile)
  -> verified final-slide | diagnostics
```

远端 Image2 transport 不进入 `composeSlide`。它只由显式、已授权的 Image2 generation interface 调用；该 interface 可以复用 `image_api_client.mjs` 的 transport/extract 能力，但 Image2 visual-slot refinement 不是新 Stage 2，也不借用 legacy whole-page Stage 2 的业务 interface。

## 五个 Change 分别动哪里

| Change | `workflow/` 变化 | framework 其他主要变化 |
|---|---|---|
| 1 `upgrade-html-render-runtime-readiness` | 只更新 `00-setup/` 的 Node/browser/font/readiness 事实；不重排目录 | `BOOTSTRAP`、doctor、fonts、runtime profile |
| 2 `add-structured-html-slide-contract` | 在当前 `02-content/` 先落 structured body/family authoring；尚不切默认 workflow | parser、visual config、asset catalog interfaces |
| 3 `deliver-html-first-decks` | 原子迁移为最终六目录和 Phase 0-5 enum；迁移既有 state 续跑解释；新 `03-html-production/` 只拥有 HTML 完整交付；legacy whole-page Image2 进入独立兼容 playbook/reference | HTML renderer、composition、Stage 4、node/playbook/state schema、init/template、create/edit playbooks |
| 4 `restructure-framework-script-modules` | workflow/playbook lifecycle 不变；只更新所有 active script links 和 executable paths | 将平铺 root/`lib/` 迁入 00-05 phase modules 与分类 `shared/`；建立 phase interface/import checker；不新增 Image2 execution |
| 5 `add-image2-visual-slot-refinement` | 激活并补全 `04-image2-refinement/` 的推荐、授权、候选、review、promotion、cleanup，更新 Phase 5 Image2 refinement iteration | 在已归档的 Phase-4 script module 内加入 `image2` CLI/state/provider adapter/promotion/cleanup/playbook |

每个 change 归档时，`workflow/README.md`、`charter/WORKFLOW.md`、`AGENTS.md` 和 active playbook 必须准确描述当时已经可用的系统，不能提前宣传下一 change 才实现的路径。

### Change 3 归档后的可用树

Change 3 已经切换新用户的 HTML-first 完整流程并完成 workflow/schema 迁移，但 Change 4 scripts 架构迁移和 Change 5 visual-slot refinement 尚未交付：

```text
workflow/
├── 00-setup/          active: HTML base readiness
├── 01-content/        active
├── 02-visual-system/  active
├── 03-html-production/ active: HTML complete delivery
├── 04-image2-refinement/ README-only unavailable stub; never a new-user gate
└── 05-iteration/      active: HTML/local maintenance; Image2 iteration remains explicit/not available
```

这个归档点必须可用且自洽：新用户可以完整交付，旧 deck 通过独立 `legacy-image2-maintenance` 兼容入口维护。为了让 Phase/module enum 和顶层目录一次迁移到最终形状，Change 3 创建 `workflow/04-image2-refinement/README.md`，但 README 只能明确写“本版本尚不可用、不是完成交付的 gate”，不得包含可执行步骤、controller link 或命令。Change 4 只建立对应的 script ownership 目录并保持 README-only/non-executable；active playbook index、status 和 next-node calculation 仍不注册 Phase 4 execution。Change 5 才填充 workflow/script Phase 4、注册 `image2-refine` nodes/CLI 并移除 unavailable 标记，不再进行第二次 lifecycle enum 迁移。

### Change 4 归档后的 scripts 可用树

Change 4 归档时，所有 Change-3 行为、CLI envelopes、artifact bytes/fingerprints、state/gate/reset/migration semantics 和 markerless legacy behavior 必须保持兼容；改变的是代码导航与 module seam，不是产品行为。归档点必须满足：根目录只剩 `ppt_flow.mjs` 这一个 canonical front controller、`README.md` 和非执行资源目录；00/01/02/03/05 phase interface 可从目录直接发现；04 只有 unavailable README；`shared/` 无 phase 反向依赖；仓库不存在 `scripts/lib/`、旧 direct path 引用或跨 phase `internal/` import。

## 最终阅读体验

新手或 Agent 进入 framework 后，只需要看到：

```text
00 setup
01 content
02 visual system
03 HTML production -> 完整 PPTX，可以结束
04 Image2 refinement -> 只有用户想继续并授权成本时才进入
05 iteration
```

`04-image2-refinement/` 的存在不能让前三步显得是半成品；它是完成后的专业升级，不是完成 PPT 的必经 gate。HTML 的普通打磨属于 `05-iteration/` 的 local path，不进入 Image2 refinement。

## Playbook 路由与用户可见边界

`workflow/` 是方法论阅读面，`playbook/` 是 MD Controller 的执行面，`scripts/` 是 JS implementation 面；三者必须用同一组 ownership 名称。Change 3/4/5 之后，Controller 的最小路由应是：

```text
production.pipeline = html-first-v1
        │
        ├── create-deck / quick-preview / build
        │       └── 03-html-production -> PPTX complete -> user may finish
        │
        ├── ordinary content/layout/visual-config/notes change
        │       └── 05-iteration -> local HTML/composition path
        │
        └── explicit user request after HTML delivery
                └── image2-refine -> plan -> authorize -> generate -> review

production.pipeline = legacy-image2-first
        └── legacy-image2-maintenance -> style-master/pilot/whole-page refresh
```

约束如下：

- `create-deck` 和 `quick-preview` 不得自动进入 Image2；HTML 成品完成后才允许出现“可选专业升级”的分支。
- `create-deck` 必须先把 HTML final/PPTX/notes 和用户交付确认记录为 completed，再以普通 handoff 文案询问是否查看 Image2 建议。用户拒绝或结束时，不留下 pending Image2 node；用户选择继续时启动独立 `image2-refine` execution，而不是让 create-deck 永远卡在一个 optional node 上。
- `classify-change` 必须先读取 `production.pipeline`，再判断 source ownership 和失效路径；普通 HTML iteration 不得因为“视觉变好”而暗中创建远端授权。
- `image2-refine` 只服务 visual-slot asset 生成，CLI 使用 `ppt_flow image2 ...`，不再使用容易误解的裸 `refine` 命令。
- `ppt_flow image2 ...` 必须验证 `production.pipeline: html-first-v1`；legacy deck fail closed 并由 `legacy-image2-maintenance` 使用既有 pilot/build 路径，两个 Image2 模型不能交叉调用。
- `image2-refine` controller nodes 使用 `lifecycle_phase: 4` / `method_module: 04-image2-refinement`；这不是普通 iteration 的别名。
- `legacy-image2-maintenance` 只服务没有 `html-first-v1` marker 的旧 deck；不得被新 deck 的默认入口引用。它是兼容维护，nodes 使用 `lifecycle_phase: 5` / `method_module: 05-iteration`，不伪装成新的 visual-slot Phase 4。
- `probe-image-channels` 保持独立的 off-path 环境诊断 playbook，nodes 继续使用 `lifecycle_phase: 0` / `method_module: 00-setup`；它不是 modern Phase 4 execution，也不属于 HTML production path。modern `image2-refine` 与 `legacy-image2-maintenance` 需要体检时都通过 playbook switch 进入并返回，调用方不得复制 probe nodes 或把诊断 submit 当成页面授权。这样 Change 3 可以保留 legacy 诊断，Change 4 只迁移 helper ownership 而不注册 modern Phase 4，Change 5 再消费该 interface。
- `_state` 的 reserved record 使用明确的 `image2-refinement` 名称；HTML/local progress、Image2 authorization 和 legacy execution 不得共用一个模糊的 `refinement` 状态。
