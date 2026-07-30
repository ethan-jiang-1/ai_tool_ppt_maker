# deck_ai_sdlc_keynote — 迁移说明（人写 · 不在 `_generated/`）

## 2026-07-30: page-authority-image2-v2 migration — first production deck on new pipeline

从 `html-first-v1` pipeline 迁移到 `page-authority-image2-v2`，workflow 选 `framed`（Text Frame 持有 title/kicker/subtitle/callout；Image2 生成无文字 underlay）。

**变更清单：**

- **`slide-specifications.md`（v2）**：frontmatter 改为 `production.pipeline: page-authority-image2-v2` + `workflow: framed`。25 页全部从旧 `SLIDE BODY` YAML（schema_version: 1, family: hero/split/comparison/flow/cards/quote）转换为新 `VISUAL BRIEF` YAML（recipe/composition/motifs/negative_constraints）。映射：hero/quote → editorial-systems/centered-constellation，split/comparison → editorial-systems/left-to-right-flow，flow → +layered-pathways，cards → +soft-grid。所有 framed slides 添加 `no-readable-text` + `no-labels` negative constraints。保留 KICKER/TITLE/SUBTITLE/CONCEPT/SPEAKER NOTE 为 narrative context。
- **`_state/state.yaml`**：pipeline 改为 `page-authority-image2-v2`，production_mode.by_version.v2 改为 `mode: image2-page-authority-v2, workflow: framed, source_epoch: 1`。移除所有 html-* 旧节点（html-content-review、html-visual-review、html-delivery-review、image2-refinement）和 legacy gates。新增 `page_authority_raw_provider_authorization` 和 `page_authority_target_evidence` 空结构。
- **`project-metadata.yaml`**：production.pipeline 改为 `page-authority-image2-v2` + `workflow: framed`，production_mode 改为 `image2-page-authority-v2`。
- **`deck-guide.md`**：重写为 page-authority-image2-v2 framed workflow 指南，包含新 CLI 命令（validate/image2 plan/authorize/generate/review/accept/build/refresh）。
- **`AGENTS.md` / `CLAUDE.md`**：更新 framework 入口引用。
- **`_generated/`（v2）**：清空旧产物（html_production/、image2_refinement/、ppt/、qa/、slide_plan.json）。由新 framework 重建到 `page_authority_image2/`。
- **v1 / v3**：保留为只读历史版本（legacy pipelines）。

**Workflow 选择理由**：该 deck 的视觉风格依赖精确的中文 Song/Ming serif typography over sketch/etching underlays。framed workflow 的 Text Frame 拥有文字排版权，Image2 负责无文字 underlay——与现有 visual-style 资产和设计约束一致。现有 `page-authority-visual-language.yaml` 已支持 `framed-image2` authority。

**未改动**：`1_upstream_raw_material/`、`2_backbone/`（含 visual-style）、`_lessons/`、`3_versions/v2/overrides/`、`3_versions/v2/_scratch/`。

## 2026-07-25: framework v0.22 alignment — v5 state + RUN_BUNDLE + production_mode

升级 run bundle 以适配当前 PPTMAKER_FRAMEWORK（v0.22.0，包含 production-mode + image2-primary 功能分支）。

**变更清单：**

- **新增 `RUN_BUNDLE.md`**：静态定位入口（deck root + framework root），Agent 进入时最先解析。
- **新增 `AGENTS.md`**：指向 `RUN_BUNDLE.md` → `deck-guide.md` 的入口链，匹配框架新版 Agent 进入协议。
- **更新 `CLAUDE.md`**：改为先指向 `RUN_BUNDLE.md` 再指向 `deck-guide.md`。
- **更新 `_state/state.yaml`**：schema v3 → v5。新增 `production_mode.by_version`（v2 → `html-then-image2`，v1 → `image2-only`）。html-content-review / html-visual-review 记录补充 schema-required 审计字段（`content_review_fingerprint`、`ordered_plan_digest`、`visual_system_fingerprint` 等）。移除已完成迁移的无活跃 playbook 标识，转为 inactive state。
- **更新 `project-metadata.yaml`**：新增 `production.pipeline: html-first-v1` 与 `production_mode` / `production_mode_run_version` 镜像字段。
- **更新 `deck-guide.md`**：适配当前框架词汇（production mode、v5 state、RUN_BUNDLE.md 定位、html-then-image2 路径）。
- **删除 `_generated/` 中的 `fake_contact.jpg`（5 字节占位）**，contact sheet 证据更新为指向实际渲染的 contact sheet PNG。
- **验证通过**：`--validate-state` 通过，`bundle_layout --check --structure-only` 通过，`ppt_flow validate` 通过（25 slides，完整 html-first-v1 合约）。

## 2026-07-20: legacy-image2-first → html-first-v1 (v2)

从 markerless Image2 pipeline 迁移到 html-first-v1。v1 保留为只读历史版本。

- 创建 `3_versions/v2/` — 干净的 HTML-first target version
- `slide-specifications.md` 重写：移除全部 IMAGE PROMPT，新增 mnemonic-v1 slide_id + 结构化 SLIDE BODY YAML（25 页）
- `color_palette.json` 新增 `html_first` 段（palette/typography/spacing/components/image_language）
- `_state/state.yaml` 重置为 html-first-v1 初始状态
- `deck-guide.md` / `CLAUDE.md` / `project-metadata.yaml` 更新为 HTML-first 入口
- `2_backbone/visual-style/assets/` 新建（空 v2 catalog）
- `agent-portrayal.md` 从 `2_backbone/` 移至 `1_upstream_raw_material/`（不在 backbone 白名单内）
- `.env.example` 更新（HTML-first 无需 provider credentials）
- `ppt_flow validate 3_versions/v2` 通过（25 slides，完整 html-first-v1 合约）

## 历史（2026-07-11 — v1 markerless → 三层树）

## 已对齐

- 宪法树 + control files + `_state/` + `_lessons/`
- `2_backbone/visual-style/style_master.jpg` 在盘
- Stage 1：`slide_plan.json` + `page_prompts/`（**25** 页，2026-07-12 用当前框架重跑）
- slide specs 已加入 `render.default: full-page` / `header-lock: []`；封面 VISUAL TYPE 已规范为 `Title / Opener`
- 门闩双写：metadata 与 `_state` 均为 `waived` / `waived`
- 断点：`iterate-style` @ `review-gate`（等人审 style master）
- **Session resume（2026-07-11）：** `_state/README` + `state.yaml` header 已与现行框架 where-am-I 卡对齐；断线后续跑先 `ppt_flow state`
- **Framework data sync（2026-07-12）：** 新版要求 raw-image manifest、generation profile/hash 和 version-scoped header-review evidence。旧派生物已移到 `3_versions/v1/_scratch/framework-sync-2026-07-12/`，不再冒充 current cache。

## 待完成（故意不伪造）

- 旧 raw images 共 25 张，24 张有旧 task trace，generation profile 混合为 19 张 1K + 5 张 2K；全部缺新版 `_manifest.json`，因此没有合法途径补写 provenance 或直接批准 header review。
- 25 页 IMAGE PROMPT 已逐页迁移：保留 body 文案、证据、数据与构图，移除重复的结构化 TITLE/KICKER/SUBTITLE 和 header 位置指令；自动审计为 0 个 exact-text 重复。
- style master 仍在 `iterate-style/review-gate` 等用户 LOCK。之后按目标 profile 执行 `pilot` → 打开审图 → `approve <run-dir> header` → `build --reuse-images`。

## SSOT

源：`2_backbone/` + `3_versions/v1/slide-specifications.md`。  
派生物：`3_versions/v1/_generated/`（可 `rm -rf` 后重跑；勿手改当源）。

迁移日：2026-07-11。真相对齐复查：2026-07-12（含 render policy、provenance/header-review 数据契约同步）。
