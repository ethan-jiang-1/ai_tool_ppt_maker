# 专题 07: PPTMAKER_FRAMEWORK 目录影响

> 总控: [`../html-first-progressive-rendering.md`](../html-first-progressive-rendering.md)
> 状态: 目标目录与迁移责任已锁定，实际改动由四个 OpenSpec changes 分步完成 | 更新: 2026-07-17

## 这份文档回答什么

这份文档只回答：总计划落地后，`PPTMAKER_FRAMEWORK/` 尤其是 `workflow/` 会变成什么样。

- 这里画的是 framework soft bundle，不是 `deck_*` run bundle。
- 本计划阶段不移动 framework 文件；实际 rename/rewrite 必须进入对应 OpenSpec change。
- framework 根仍严格保持 5 个子目录：`workflow/`、`scripts/`、`charter/`、`reference/`、`playbook/`。不会新增第六个根目录。
- 目标树中的公开方法文档名称和职责在本计划锁定；`scripts/lib/` 内部文件名可在各 change design 中微调，但不得改变本页规定的模块 interface 和所有权。

## 一眼看懂

```text
当前 Image2-first 方法树                    最终 HTML-first 方法树

00-setup                                  00-setup
01-visual          style master 必经       01-content
02-content                                 02-visual-system
03-prompts         整页生图 prompt 必经 -> 03-production
04-production      Image2 Stage 2/3        04-refinement      可选、付费
05-iteration                               05-iteration
```

核心变化不是多加一份 HTML 文档，而是重写默认生命周期：

```text
当前: setup -> content/visual -> style master -> IMAGE PROMPT
      -> Image2 whole-page -> header lock -> PPTX -> iteration

目标: setup -> structured content -> renderer-neutral visual system
      -> HTML complete PPTX -> user may finish
      -> optional authorized Image2 visual-slot refinement -> iteration
```

## 最终 `workflow/` 目标树

`workflow/` 的目录形状在 Change 3 一次迁移到最终六目录；Change 4 只激活并补全可选 refinement 内容。目录编号同时成为 Lifecycle Phase 与 `method_module` 顺序，不再维护“Method Module 编号与 Lifecycle Phase 编号不同”的双重解释。

目标 lifecycle 为 `0 -> 1 -> 2 -> 3 -> [4 optional] -> 5`：Phase 3 已经交付完整 PPTX；Phase 4 只有用户明确选择专业精修时进入；Phase 5 可从 HTML 成品或精修成品开始迭代。Change 3 必须同步迁移 `node-specification` 的 `lifecycle_phase`/`method_module` enum、全部 playbook node frontmatter 和 validator fixture。

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
├── 03-production/
│   ├── README.md
│   ├── 00-the-pipeline-philosophy.md
│   ├── 01-stage-1-resolve-slide-plan.md
│   ├── 02-stage-2-render-html-pages.md
│   ├── 03-stage-3-compose-final-slides.md
│   ├── 04-stage-4-build-the-pptx-container.md
│   ├── 05-stage-5-inject-speaker-notes.md
│   └── reference-pipeline-scripts.md
│
├── 04-refinement/
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
    ├── 04-refinement-iteration.md
    └── 05-end-to-end-walkthrough.md
```

## 当前目录怎样迁移

| 当前目录 | 最终去向 | 处理方式 | 原因 |
|---|---|---|---|
| `00-setup/` | `00-setup/` | 保留并改写 | base readiness 不再要求 Image2；Image2 setup 移至可选 refinement |
| `01-visual/` | `02-visual-system/` + `04-refinement/` | 拆分 | visual tokens/presets 属于所有 deck；style master/prompt/review 只属于专业精修 |
| `02-content/` | `01-content/` | rename + 扩展 | 内容成为默认第一工作面；新增 structured body 和 family authoring |
| `03-prompts/` | `04-refinement/` | 吸收后删除旧目录 | Image prompt 不再是所有页面必经的独立阶段 |
| `04-production/` | `03-production/` | rename + 重写 Stage 2/3 | 默认生产改为 HTML render + deterministic composition |
| `05-iteration/` | `05-iteration/` | 保留并改写 | 默认刷新变成本地 rebuild；远端重试需要新授权 |

最终不得同时保留旧目录和新目录作为两套活跃方法论。Change 3 必须原子更新全 framework cross-reference、frontmatter `stage/depends_on/feeds_into`、playbook `lifecycle_phase/method_module`、OpenSpec main specs 和链接扫描；旧路径不能靠复制文件长期兼容。

## `workflow/` 逐文件处置

### `00-setup/`

| 当前文件 | 目标动作 |
|---|---|
| `00-run-bundle-concept.md` | 保留；补 HTML-first source/generated artifact 说明 |
| `00-zero-to-ready.md` | 改写为 base HTML readiness；Image2 不再阻断新手 |
| `02-nodejs-environment.md` | 更新 Node 22、Playwright/Chromium、bundled fonts |
| `03-tool-selection.md` | rename 为 `03-runtime-and-tools.md`；只讲基础 runtime，provider 配置迁到 `04-refinement/` |
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

### 当前 `01-visual/` -> 目标 `02-visual-system/` 与 `04-refinement/`

| 当前文件 | 目标动作 |
|---|---|
| `00-the-problem-why-text-fails.md` | 不原样保留；改写为 `02-visual-system/00-why-deterministic-visual-systems.md` |
| `01-gather-product-context-dna.md` | 移入 `02-visual-system/` |
| `02-design-the-visual-system.md` | 移入 `02-visual-system/`，视觉决策落到 visual config |
| `03-write-the-style-master-prompt.md` | 移入 `04-refinement/03-design-image2-visual-briefs.md`，从默认必经降为可选 |
| `04-iterate-review-lock.md` | 拆成 HTML visual-system validation 与 Image2 candidate review 两部分 |
| `05-use-the-style-master-for-slides.md` | 改写为 refinement style-reference 使用规则，不再控制整页 layout |
| `template-deck-system.txt` | 移入 `02-visual-system/`，继续拥有自然语言约束 |
| `template-visual-style.md` | 拆为 renderer-neutral config template + optional refinement brief template |
| `presets/` | 移入 `02-visual-system/presets/`；扩展 body/layout/chart/callout tokens |

结构化视觉真相仍叫 `color_palette.json`；这里的 `template-color-palette.json` 只是它的 authoring template。不得再创建 `html-theme.json` 或第二份 visual-config source。

### 当前 `03-prompts/` -> 目标 `04-refinement/`

| 当前文件 | 目标动作 |
|---|---|
| `00-why-prompt-engineering-matters.md` | 改写为“何时精修值得成本”，不再是默认生命周期 checkpoint |
| `01-understanding-the-model.md` | 保留为 Image2 refinement 专业知识 |
| `02-prompt-structure-and-patterns.md` | 改写为无文字 visual-slot brief/prompt 派生规则 |
| `03-style-anchoring-in-practice.md` | 改写为 style reference setup 与 provenance |
| `04-iteration-and-debugging.md` | 改写为 plan/authorization/unknown-submit/retry 纪律 |
| `05-resolution-quality-tradeoffs.md` | 保留为 profile、质量、成本选择 |
| `template-image-prompt-builder.md` | 替换为 `template-visual-refinement-brief.md`；不允许准确文字和整页 layout |

### 当前 `04-production/` -> 目标 `03-production/`

| 当前文件 | 目标动作 |
|---|---|
| `00-the-pipeline-philosophy.md` | 改写为 HTML complete first、remote refinement explicit |
| `01-stage-1-parse-content-to-specs.md` | 改为 resolve/validate structured slide plan，同时保留 legacy branch |
| `02-stage-2-generate-images-with-anchoring.md` | 默认文档替换为 HTML page rendering；legacy whole-page Image2 只留兼容说明 |
| `03-stage-3-lock-headers-deterministically.md` | 改为 final-slide composition；HTML 拥有所有准确文字 |
| `04-stage-4-build-the-pptx-container.md` | 保留，改为只消费 verified provider-neutral `final-slide` |
| `05-stage-5-inject-speaker-notes.md` | 保留，继续按 stable ID + current order 注入 |
| `reference-pipeline-scripts.md` | 更新 HTML/refinement CLI 和 legacy compatibility 路由 |

### `05-iteration/`

| 当前文件 | 目标动作 |
|---|---|
| `00-openspec-capabilities-for-ppt.md` | 更新 capability 和四个最终 refresh/structural 概念 |
| `01-content-iteration-workflow.md` | 改为 content + family，普通变化全部本地重合成 |
| `02-style-iteration-workflow.md` | 改为 renderer-neutral visual config；style reference 变化归 refinement |
| `03-pipeline-change-workflow.md` | 改为 structural versioning + artifact invalidation 路径 |
| 新文件 `04-refinement-iteration.md` | 明确 retry/new candidate 必须新 plan 和授权 |
| `04-end-to-end-walkthrough.md` | 顺延为 `05-...`，展示 novice stop 与 professional continue 两条结尾 |

## `PPTMAKER_FRAMEWORK/` 其他目录怎样变

根目录形状不变，但以下文件会随 workflow 一起改，避免方法论与执行代码分裂。

```text
PPTMAKER_FRAMEWORK/
├── BOOTSTRAP.md                 [改] base HTML readiness；Image2 按需 onboarding
├── COMMANDS.md                  [改] build + refine 命令与用户话术
├── AGENTS.md                    [改] Phase 顺序、gate、source ownership
├── README.md                    [改] 新 workflow 树
├── charter/
│   ├── WORKFLOW.md              [改] HTML complete -> optional refinement
│   ├── AGENT_CONTRACT.md        [改] 成本授权/show-before-gate 细化
│   └── CONSTITUTION.md          [改] 只同步 run-bundle 目标树，不复制权威
├── playbook/
│   ├── create-deck.md           [改] 新 deck 默认 HTML-first
│   ├── edit-text.md             [改] local compose，不按 render mode 分流
│   ├── edit-visual.md           [改] visual config / accepted asset 分流
│   ├── iterate-style.md         [改] HTML visual system 为默认
│   ├── quick-preview.md         [改] HTML contact sheet，不要求 style master
│   ├── refine-visuals.md        [新] 推荐、授权、生成、逐页 review
│   └── classify-change.md       [改] 先结构/所有权/失效，再判断是否需远端
└── scripts/
    ├── env-check.mjs            [改] base 与 `--image2` readiness 分层
    ├── stage1_build_inputs.mjs  [改] structured plan + legacy branch
    ├── stage2_render_html.mjs   [新] deterministic HTML page renderer
    ├── stage2_generate_images.mjs [留] 仅 legacy whole-page Image2，不进 HTML-first build/refine workflow
    ├── stage3_compose_slides.mjs  [新] local final-slide composition
    ├── stage3_lock_headers.mjs  [留] legacy compatibility
    ├── stage4_build_pptx.mjs    [改] provider-neutral final-slide consumer
    ├── unified_pipeline.mjs     [改] 以 `production.pipeline` 选择完整分支
    ├── ppt_flow.mjs             [改] refine 子命令
    ├── asset_manifest.mjs       [改] per-ID layered catalog
    ├── visual_config.mjs        [改] renderer-neutral schema
    ├── fonts/                   [改] bundled licensed Latin/CJK WOFF2
    └── lib/                     [改/新] structured slide、layout family、HTML composition、refinement transaction 深模块
```

`scripts/lib/` 不按每个小步骤暴露一层 wrapper。后续 design 应保持两个主要外部 interface：

```text
parseAndResolveSlideDocument(source, resolved_config, resolved_assets)
  -> validated structured slide plan | diagnostics

composeSlide(structured_plan, resolved_assets, runtime_profile)
  -> verified final-slide | diagnostics
```

远端 Image2 transport 不进入 `composeSlide`。它只由显式、已授权的 refinement generation interface 调用；该 interface 可以复用 `image_api_client.mjs` 的 transport/extract 能力，但 refinement 不是新 Stage 2，也不借用 legacy whole-page Stage 2 的业务 interface。

## 四个 Change 分别动哪里

| Change | `workflow/` 变化 | framework 其他主要变化 |
|---|---|---|
| 1 `upgrade-html-render-runtime-readiness` | 只更新 `00-setup/` 的 Node/browser/font/readiness 事实；不重排目录 | `BOOTSTRAP`、doctor、fonts、runtime profile |
| 2 `add-structured-html-slide-contract` | 在当前 `02-content/` 先落 structured body/family authoring；尚不切默认 workflow | parser、visual config、asset catalog interfaces |
| 3 `deliver-html-first-decks` | 原子迁移为最终六目录和 Phase 0-5 enum；旧 `03-prompts`/style-master 知识移入 `04-refinement/`，但只服务 legacy 维护并明确 HTML-first refinement 尚不可用 | HTML renderer、composition、Stage 4、node/playbook schema、init/template、create/edit playbooks |
| 4 `add-image2-visual-slot-refinement` | 激活并补全 `04-refinement/` 的推荐、授权、候选、review、promotion、cleanup，更新 Phase 5 refinement iteration | refine CLI/state/provider adapter/promotion/cleanup/playbook |

每个 change 归档时，`workflow/README.md`、`charter/WORKFLOW.md`、`AGENTS.md` 和 active playbook 必须准确描述当时已经可用的系统，不能提前宣传下一 change 才实现的路径。

### Change 3 归档后的可用树

Change 3 已经切换新用户的 HTML-first 完整流程并完成目录/schema 迁移，但 Change 4 尚未交付 visual-slot refinement：

```text
workflow/
├── 00-setup/          active: HTML base readiness
├── 01-content/        active
├── 02-visual-system/  active
├── 03-production/     active: HTML complete delivery
├── 04-refinement/     legacy-only: 只维护旧 deck；HTML-first 路径明确标为 not available
└── 05-iteration/      active: HTML/local + legacy maintenance，暂无 visual-slot refinement
```

这个归档点必须可用且自洽：新用户可以完整交付，旧 deck 可以按旧行为维护，但系统不会提前声称 visual-slot refinement 已经存在。Change 4 随后在既有 `04-refinement/` 中激活新能力，不再进行第二次目录或 enum 迁移。

## 最终阅读体验

新手或 Agent 进入 framework 后，只需要看到：

```text
00 setup
01 content
02 visual system
03 production -> 完整 PPTX，可以结束
04 refinement -> 只有用户想继续并授权成本时才进入
05 iteration
```

`04-refinement/` 的存在不能让前四步显得是半成品；它是完成后的专业升级，不是完成 PPT 的必经 gate。
