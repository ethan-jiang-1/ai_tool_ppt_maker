---
title: VERSION_LOG
description: Repo 级版本迭代记录。从 v0.14.3 起追踪项目整体（软包+脚本+管线+OpenSpec 体系）的版本演进。
---

# VERSION_LOG

> 这个文件记录 repo 整体的版本变更。每次实质性改动（新增 capability、修改管线行为、架构变更）在 archive 后追加一条 bump 记录。文档措辞微调不必记录。

## 版本号规则

```
v0 . 14 . 3
│   │   └─ PATCH：修 bug、改措辞、小修正（不影响使用方式）
│   └───── MINOR：新 capability、破坏性变更、架构变化
└───────── MAJOR：目前为 0（pre-1.0）。MAJOR 升为 1 在项目稳定、可对外发布时。
```

MAJOR 从 1 修正为 0 的原因：项目未到 1.0 水准。历史积累通过旧 MAJOR.MINOR 合并为新 MINOR 得以保留（v1.4.3 → v0.14.3）。以下历史条目已从 v1.x.y 重编号为 v0.xy.z。

---

## v0.24.4 — Fixed-Profile JPEG Delivery Media（2026-08-08）

**代号**：JPEG-backed delivery

> 归档 `add-jpeg-delivery-media`：shared delivery 对每个有效 final PNG 派生同序 `NN_slideID.jpg`
> 交付表示（同像素尺寸、quality 95、4:4:4 chroma、alpha 对不透明白展平），并把 digest、文件名、
> 固定 profile 与来源 final PNG digest 绑定到精确的 final-slide manifest。PPTX 只嵌入已验证的
> JPEG 交付媒体；notes injection 与 state 绑定新的 JPEG 交付谱系；stale JPEG 在组装前重建；
> 派生失败 hard-stop 并保留既有交付。raw/final PNG bytes、hash、尺寸与 provenance 不变。

### 变了什么

1. `05-delivery` 对每个 ordered final PNG 派生固定 profile 的 JPEG delivery media，并发布
   `page-image-delivery-media-v1` manifest；final PNG 仍是 finalization artifact。
2. PPTX assembly、notes injection 与 state 的 current 交付谱系均校验并绑定 JPEG delivery-media digest
  与 ordered entries；缺失该绑定的旧 receipt 走 normal delivery rebuild，不做 hand migration。
3. 派生失败在替换 PPTX/发布 receipt 前 hard-stop；JPEG 转换 profile 是机械 delivery metadata，
  不暴露 quality/subsampling/resize/background override。
4. `image-production`、`pptx-assembly`、`notes-injection`、`node-specification`、`run-bundle-layout`
  main specs 同步新增 JPEG delivery-media 契约。

---

## v0.24.3 — Render Pure Slide Text In Provider Prompt（2026-08-05）

**代号**：Text-forward pure slides

> 归档 `render-pure-slide-text-in-provider-prompt`：pure 工作流的 provider prompt 把 slide 文字
> （kicker/title/subtitle/callout/body）作为显式顶层文字渲染契约突出呈现，让 provider 把字画得更全更清；
> framed 保持 text-free underlay。transport-only，raw contract/授权/idempotency 不变。

### 变了什么

1. `targetPageAuthoritySubmitFactory` 对 pure raw 请求构建结构化 prompt：顶层 `text` 段携带 slide 全部文字 +
   bounded「render as readable typography」指令，`visual` 段携带 recipe/composition/motifs/relationship/scene。
2. framed 请求保持 `JSON.stringify(request)`（text-free underlay，文字由 framework 本地 composition 叠加）。
3. 回归测试：pure prompt 含显式文字契约、framed prompt 不含；raw contract/授权/idempotency 不变。
4. `image-generation` main spec 同步新增「pure prompts render slide text prominently」requirement。

---

## v0.24.2 — Hardened Page Authority Provider-Clause Delivery（2026-08-05）

**代号**：Canonical clause contract

> 归档 `harden-page-authority-provider-clause-delivery` 并修复 BUG-035（P0）：把 Page Authority raw contract
> 的 provider-clause 交付收口为受支持工作流的 canonical 校验契约，并补上序列化 provider body 的回归断言。

### 变了什么

1. Pure 工作流新增 canonical raw contract 校验（`validatePureRawContract`），在授权与 provider 工作前
   拒绝畸形 contract；Framed 的 `provider_clauses` 校验从 `object-or-null` 收紧为
   `{recipe, composition, motifs}` 文本形状。
2. `image-generation` main spec 新增/修改 requirement：raw request 必须携带 text-guard 保护的 canonical
   provider-clause 文本，畸形形状在 plan 阶段 hard-stop，序列化 provider body 必须包含该文本而非仅 digest。
3. 保持 raw contract 作为 provider clause 文本的唯一来源；不新增提交前反查、不回退授权/idempotency 契约。
4. 新增回归测试：Pure/Framed 的 canonical clause shape 校验、malformed 提前 hard-stop、以及序列化
   provider body 含 exact clause 文本（含 registry drift 后的提交路径）。
5. BUG-035 关闭并移入 `_backlog/_done/_fixed_bugs/`。

---

## v0.24.1 — Hardened Style Master Provider Boundary（2026-08-05）

**代号**：Bounded, provider-compatible

> 归档 `harden-style-master-provider-boundary`：把 Style Master 的 provider 边界收紧为确定性、有界、
> 对兼容 provider 可解释，并修复 BUG-046..052。这是纯 bug 修复 + 既有 capability 边界收紧，无新 capability。

### 变了什么

1. Style Master provider prompt 从"全投影序列化"改为确定性 4,000 字节 provider brief（authored intent +
   紧凑 global visual summary）；超限在 plan/grant/provider 工作之前失败，绝不静默截断。
2. `IMAGE2_BASE_URL` 强制为单端点，逗号分隔列表在任何联网工作前拒绝；env-check 与 doctor 同步，doctor
   `--smoke` 成功证据改为 connectivity-only，不再被误读为 Style Master 生产兼容证明。
3. Style Master 与 page raw 共享一个有界 600,000 ms 的 submit/poll deadline（剩余预算 abort）；收到的明确
   失败（HTTP/畸形 JSON/terminal task 失败/非法媒体）定类为 known failed attempt，无法证实的响应丢失、
   abort、deadline 耗尽仍保留 `submitted`/`unknown` 边界。
4. 生成的 Style Master 候选校验接受 CRC 有效且正尺寸的原生 PNG（不再固定 2000x1125），保留原字节与尺寸
   进不可变 provenance；收到非法媒体为 known failed attempt。
5. `style-master generate` 复用 page raw 的 scoped dotenv 解析与共享 sync-or-async provider 完成路径，
   不持久化 task ID、不引入 retry/reconcile。
6. BUG-046..052 全部修复并移入 `_backlog/_done/_fixed_bugs/`；相关 main specs（style-master-generation、
   cli-surface、environment-check）已同步并归档。

---

## v0.24.0 — Native Page Authority Recovery And Delivery（2026-08-04）

**代号**：Native bytes, complete chain

> 以真实 v7 recovery 校正 provider request 与 native response 的契约边界；完成异步结果、
> 历史 attempt 投影、Pure 原字节交付与 25 页最终 PPTX 验收。

### 变了什么

1. Page Authority 保留 `2000x1125` transport request，但将 provider raw 响应契约明确为
   `2048x1136` native PNG；错误媒体仍在 ingress hard-stop，不 resize、crop 或 transcode。
2. Pure final 保留 accepted native raw bytes，delivery/PPTX 对该契约验证并按原字节嵌入媒体；
   Framed 保留自己的本地 composition contract。
3. `image2 generate` 在一次授权 submit 内解析有界 async task result，并在 owner mutation 前执行
   secret-safe dotenv credential preflight；不增加 retry、后台 worker 或 durable task store。
4. 仅对一个严格的历史 `known_failure + unknown` 直接 sibling pair 建立 effective terminal
   projection，所有其它分叉继续 integrity hard-stop。
5. v7 实际完成 25/25 raw/final/PPTX：final/raw 与 embedded media 的 25/25 hash 相同，25 页
   notes、ordinal footer、ZIP/layout 与 visual contact-sheet review 均通过；相关 OpenSpec changes
   已同步主规格并归档。

---

## v0.23.2 — Pure BODY Text Delivery And NN_slideID Production Naming（2026-08-02）

**代号**：Text-first, numbered

> 修复 BUG-043/044：Pure 页面从"图多字少"走向"字为主、图为隐喻"。`BODY` 正文首次送达模型；最终生产文件用 `NN_slideID` 命名。

### 变了什么

1. `content-parsing`：`**BODY**` 成为可选单行源字段，解析进 slide receipt（`body`）；Framed 继续禁止 BODY。
2. `image-generation`：`pureRawContract` 携带 `body` 文本，正文可被模型画进图。
3. `image-production`：final manifest 生产文件命名 `NN_slideID.png`（`position` 两位补零 + slide_id），validator 与 PPTX assembly 同步。
4. 归档 `pure-text-delivery-and-nn-production-naming` 并同步三个 main specs；测试覆盖 BODY 解析/入合约、NN_ 路径。

---

## v0.23.1 — Provider Clause And Scene Semantic Chain（2026-08-02）

**代号**：Clause and scene reach the model

> 修复 BUG-035（provider_clauses 文本被丢弃、模型只收到 SHA 摘要）与 BUG-036（每页 CONCEPT 场景从未到达 provider）。resolved 视觉语言条款文本、身份 role clause 与 per-slide scene 现在随 receipt-bound raw contract 进入 provider prompt。

### 变了什么

1. 新增可选 `**VISUAL SCENE**` 源字段（`content-parsing`），按内联字段解析进 slide receipt，缺省为 `null`。
2. Pure/Framed raw contract 增加 `provider_clauses`（recipe/composition/motifs 文本）、`visual_identity_role_clause`、经 text guard 规范化的 `visual_scene`（`image-generation`）；Framed exact-key validator 同步扩展。
3. scene 文本在 raw-contract 编译时过同款 text guard（`visual-config`），违规在 provider-free planning 硬停并给出 bounded source-repair 诊断。
4. 归档 `fix-provider-clauses-and-visual-scene` OpenSpec change 并同步三个 main specs；测试覆盖 scene 解析、条款/scene 入合约、guard 规范化与 fail-closed。

---

## v0.23.0 — V2-only Page Authority Workflow（2026-07-29）

**代号**：One current graph

> Page Authority 生产框架收敛到 v2 的 Framed/Pure 版本级 workflow；active v1 runtime、controller、CLI、文档、测试与 main-spec ownership 已退休。

### 变了什么

1. 新 authoring 只接受 `page-authority-image2-v2` / `image2-page-authority-v2`，每个 version 只绑定 `framed` 或 `pure` 一个 workflow，并经共享 `05-delivery` 与 `06-iteration` 交付和迭代。
2. 删除 active v1 compatibility runtime、receipt/state initializer、workflow/playbook routes、fixtures 和 retired capability specs；non-v2 source/state 统一保持字节不变并返回 export hard-stop。
3. 加入 marker-first no-write observation、active-root/main-spec retirement audit、Framed/Pure mock E2E 和 v2/shared invariant proof；不读取或修改 production `deck_*`、`dpt_*` 或 `_generated/` 数据。
4. 归档 `separate-framed-pure-workflows`、`clean-current-v1-compatibility-boundary` 与 `retire-current-v1-compatibility` 三个 OpenSpec changes，并同步其 current main specs。

---

## v0.22.0 — Bounded Development Verification（2026-07-23）

**代号**：One bounded checkpoint

> 默认验证从无界全量 Vitest sweep 收敛为受清单、依赖闭包和 60 秒总预算约束的核心检查；重型 render、闭包和 E2E 证据改为显式单路径诊断。

### 变了什么

1. `npm test` 改为 Node-owned core verifier：只执行版本化 inventory，先静态审计纯 Node import closure，再输出唯一 JSON 最终回执。
2. 新增固定 60 秒预算、5 秒 preflight、50 秒 child execution、5 秒 owned shutdown，以及 `invalid_inventory`、`unavailable`、`failed`、`timed_out` hard-stop 结果。
3. 新增 `test:sweep`、单路径 `test:focused` / `test:render` 和单个 mock journey `test:e2e`；移除 broad `test:watch` 与 E2E 默认 sweep。
4. 架构静态检查与 subprocess load-closure probes 拆分；legacy-token 静态契约不再引入 `node:child_process`。
5. `framework-script-layout` 主规格同步新增 core 依赖准入、受控 runner、mock artifact 命名与 opt-in evidence 要求，并归档 change `bound-development-verification`。

---

## v0.21.0 — Workflow Control And Image Production Realignment（2026-07-23）

**代号**：Clear ownership

> 把 workflow inspection、continuation、控制接口与 Image Production 的物理所有权收敛到可恢复、可解释的边界。

### 变了什么

1. 新增 workflow inspection：CLI `status` / `state` 输出可恢复的当前动作、直接 owner 路由和最小 continuation。
2. 增加 portable run-bundle locator 与 continuation card，避免会话恢复依赖目录猜测或全局扫描。
3. 简化 Agent/MD 控制接口，保留 guide/confirm/hard-stop 的直接职责与可审计恢复路径。
4. 将 whole-page 与 visual-slot 统一到 `04-image-production/` adapter family；退休旧 `04-image2-refinement` 与 `05-iteration/legacy-image2` 物理路径，同时保留公共 CLI 行为。

---

## v0.20.0 — Versioned Production Modes（2026-07-22）

**代号**：Three explicit modes

> 生产意图成为 version-scoped state：`html-only`、`html-then-image2` 与 `image2-only` 不再由派生产物或 metadata 猜测。

### 变了什么

1. `production_mode.by_version` 成为唯一运行时路由权威；init、doctor、status、build、refresh 与 state 按模式选择受限 adapter。
2. 新 deck 默认 `image2-only`，但保留零 provider 的 `html-only` 与授权后的 `html-then-image2` 路径。
3. 支持同一 pipeline 的原子 mode 切换，并以 preview、确认、receipt 和 clean-vNext 实现跨 pipeline transition。
4. 模式专属 readiness、授权、evidence 与 controller working set 分离，既不删除历史工作，也不把无关节点伪装成完成。

---

## v0.19.0 — Guided HTML Recovery And Image2 Refinement（2026-07-21）

**代号**：Recoverable delivery

> HTML-first 与 Image2 refinement 获得 version-scoped evidence、明确授权和可恢复的端到端控制流。

### 变了什么

1. 完成 HTML content/visual/delivery evidence、状态校验、producer-owned diagnostics 与 reset/journal recovery。
2. 引入独立的 visual-slot Image2 transport、plan/authorize/generate/accept 生命周期和 provider request provenance。
3. 完成 markerless legacy-to-HTML clean-vNext migration：比较、确认和 apply 全程 zero-provider，且不在原版本就地切换 pipeline。
4. 改进 gate guidance、waiver 与 MD controller 路由，保持用户决策、CLI mutation owner 和 hard-stop 边界分离。

---

## v0.18.0 — HTML-First Delivery（2026-07-20）

**代号**：Local complete path

> 新建 HTML-first deck 从 structured source 到可审阅 contact sheet、PPTX 和 notes 成为完整的本地可交付路径。

### 变了什么

1. 实现 deterministic HTML page composition、local Chromium/font/runtime guards、ECharts SVG、verified final-slide 与 Stage 4 plan-ordered assembly。
2. HTML 生产产物、fingerprint、receipt、contact sheet 与 delivery review 都成为 version-owned、可重建 evidence。
3. HTML refresh、notes-only、structural materialization 和 legacy-to-HTML migration 使用明确的 local rebuild/zero-remote 边界。
4. framework 目录、playbook、workflow 与 charter 同步迁移到完整 HTML-first 生命周期，同时保留 markerless legacy compatibility。

---

## v0.17.0 — Stable Slide Identity And HTML Foundations（2026-07-16 至 2026-07-18）

**代号**：Identity before position

> 页面身份从当前位置中分离，并为后续 HTML-first 交付建立本地 runtime 与 structured contract。

### 变了什么

1. 引入 mnemonic-v1 BlockCase `slide_id` 与 derived `position`；新增 preview-first structural transaction、plan hash、clean-vNext 与 ID-keyed artifact/notes/provenance。
2. 增加本地 HTML runtime readiness、Chromium/font 检查和 structured HTML slide contract，关闭网络与布局漂移的早期失败面。
3. 将 structural reuse、PPTX assembly、notes injection 和 stage output 按稳定 ID 对齐，避免插页、删页和重排破坏身份。
4. 增加可选 Git safety guidance，明确 Git 仅是用户授权的 source/control 审计，不是 run-bundle 的运行时权威。

---

## v0.16.0 — Lessons Management（2026-07-15）

**代号**：Remember the hard-won path

> `_lessons/` 从被动目录提升为 Agent 可检索、可写入且在 status 中可见的运行知识面。

### 变了什么

1. 新增 `lessons.mjs` 的 list/add/check/search 操作，并纳入 `ppt_flow status` 与 deck guide。
2. BOOTSTRAP、AGENT_CONTRACT、AGENTS 与模板将 deck entry、phase transition 和故障恢复中的 lesson retrieval/capture 变成明确工作流。
3. lessons 管理保持 run-bundle 局部、Node-only 和向后兼容，不要求迁移既有 deck。

## v0.15.0 — Visual Asset System（2026-07-14）

**代号**：Multi-reference image support

> 新增 visual-asset-management capability。GPT Image 2 支持多 reference image 传入，管线不再局限于单张 style_master.jpg。用户可注册 SVG/PNG/JPG 视觉资产并在 slide 级别绑定。

### 变了什么

1. 新增 `asset_manifest.mjs` — YAML 资产目录的 SSOT 加载/校验/解析/SHA-256。
2. `bundle_layout.mjs` — 5 个新常量 + 2 个路径解析器；renderTree / initBundle / checkBundle / selfCheck 更新。
3. Stage 1 — `parseSlides` / `validateSpecRecords` / `validateSpecs` 接受可选的 `assetManifest`；`**VISUAL ASSETS**` 字段解析（WARNING 级）。
4. Stage 2 — per-slide profile 计算；`assetResolver` 闭包注入；`additionalReferencePaths` 传入 API。
5. `image_api_client.mjs` — `fileToDataUrl` 支持 SVG；`generateOneImage` 接受多 reference paths。
6. `image_provenance.mjs` — `generationProfile` 接受可选 `assetRefs`；资产变化 → fingerprint 变化 → 精确失效。
7. `unified_pipeline.mjs` — stage1/stage2 资产 manifest 加载；post-generation per-slide provenance。
8. Specs：1 新建（visual-asset-management）+ 4 更新（content-parsing, image-generation, run-bundle-layout, run-bundle-management）。13 requirements, 41 scenarios。
9. 模板 + glossary + config.yaml 同步更新。

---

## v0.14.3 — Node-only runtime constitution（2026-07-11）

**代号**：No skills, no bash, no Python

> 可执行资产只允许 Node ESM。Stage 2 / style-master / contact sheet 全部内置；宪法 + config.yaml + AGENT_CONTRACT §7 写死；回归测试托底。

### 变了什么

1. 新增 `image_api_client.mjs`、`stage2_generate_images.mjs`、`make_contact_sheet.mjs`；管线不再发现外部 skill。
2. `generate_style_master.mjs` / `env-check` / `ppt_flow` 去 skill 依赖。
3. `charter/CONSTITUTION.md` 增加「运行时宪法」；`openspec/config.yaml` 增加「运行时铁律」。
4. 测试：`test_image_generation.mjs`（mock fetch）、`test_runtime_constitution.mjs`（禁 .py/.sh/skill 发现）。

---

## v0.14.2 — Node-only hard cut（2026-07-11）

**代号**：No Python in the building

> 框架内彻底去掉 Python 执行路径与栈叙事。Stage 3 走 `@napi-rs/canvas`；Stage 2 / style-master 只认 Node skill 入口（`.mjs`/`.js`）。

### 变了什么

1. `unified_pipeline` / `ppt_flow`：Stage 3 改为 programmatic `lockHeaders()`，不再 spawn 已删除的 `.py`。
2. Stage 2 / contact sheet / style-master：只发现并 `node` 执行 skill；`.py` adapter 明确拒绝。
3. `env-check`：`stage2_generator` 要求 `generate_full_page_images.mjs`（仅有 `.py` 也算失败）。
4. 方法论文档与 preset `deck_system.txt`：Header-Lock / 工具链一律 Node 表述。

---

## v0.14.1 — Doc executability + Stage-2 hard gate（2026-07-11）

**代号**：Agent can follow the map

> 收敛入口文档与 Node 实现；把 `image2-ppt` 升为 doctor 硬闸门（本框架产品是 Image2 视觉表达，缺 skill = 不能生产）。

### 变了什么

1. `BOOTSTRAP.md` / 根 `AGENTS.md` / `CLAUDE.md` / `README.md`：栈叙事改为 Node 18 + npm；死链 `charter/charter/`、`workflow/00-setup/workflow/…`、`PTMAKER_*` 拼写、旧 `00_project_setup` / `06_reference_scripts` 路径全部对齐。
2. `env-check.mjs`：`stage2_generator` 缺失从 `warn` 改为 `fail`；READY 文案同步。
3. `bundle_layout.mjs --init`：deck-guide 命令改为 `node` / `ppt_flow`；不再铺 `pyproject.toml`。
4. `WORKFLOW.md` Phase 编号与 `AGENTS.md` 对齐；`COMMANDS.md` 标为意图路由附录。
5. 烧图 PPTX 在已知限制中标为**设计选择**（视觉表达优先于 PPT 内编辑）。

---

## v0.14.0 — Execution Hardening（2026-07-10）

**代号**：Make the Contract Real

> 把 v1.3 的文档契约落实为可执行行为：刷新不会跳过、版本不会带旧产物、override 真正按文件继承、style master 有统一入口、Phase gate 可跨会话执法。

### 变了什么

1. 新增 `generate_style_master.mjs`：读取源 prompt、加载 deck `.env`、桥接凭据并调用实际 image skill。
2. Chain B 的 `--only` 自动强制刷新指定图片；全量视觉刷新新增 `--force-images`；pilot 可用 `--resolution 1k`。
3. visual-style override 改为**按文件**解析，允许只覆盖 palette 而继承 backbone 的 system/style master。
4. 新增 `bundle_layout.mjs --new-version`，只复制 slide specs + overrides，永不复制 `_generated/`。
5. 去除 deck_system/style anchoring 的重复注入：Stage 1 组装完整实发 prompt，Stage 2 以 `--prompt-is-final` 只负责发送与附加 reference image。
6. metadata 新增 `content_gate` / `visual_gate`；Stage 2 readiness check 要求 `approved` 或明确 `waived`。
7. BOOTSTRAP 顺序改为隐喻/公式 → medium → visual preset，落实 Medium before color。
8. 新增统一测试入口 `vitest run`，补充 version/override/cache/gate/deck-guide、文档漂移 guard 与 Stage 1→3→4→5 offline E2E smoke test。
9. 初始化直接生成可执行的 `deck-guide.md`，不再只生成待填 stub。
10. Stage 2 完成后自动生成 `_generated/preview/contact_sheet.jpg`，pilot QA 有固定检查产物。

### 兼容性

- `header_lock.normal_safe_zone` 仍作为输入别名兼容；新 preset 统一写 `body_header_safe_zone`。
- `style_dir()` 保留给旧调用；新管线使用 `style_asset()` 做文件级 fallback。
- 旧 bundle 需在 `project-metadata.yaml` 增加 gate 字段，或明确写成 `waived` 后才能跑 Stage 2。

---

## v0.13.0 — 词汇统一 + Agent 铁律（2026-07-10）

**代号**：One Vocab / Contract

> 收敛一致性、执行遵从性、agent 友好性：一套 RENDER MODE 词汇、一条 Stage 2 官方路径、一页 agent 铁律。

### 变了什么

1. **RENDER MODE 唯一词汇**：对外与 `slide_plan.json` 一律使用 `full-page` / `body+header-lock`。字段为 `layout_contract.render_mode`（不再写 `header_variant`）。旧词 `image_direct` / `normal` 仅作**输入别名**兼容；Stage 3 读 canonical，旧 plan 的 `header_variant` 仍可映射。
2. **Stage 2 官方路径唯一**：`unified_pipeline.mjs` → `image2-ppt/scripts/generate_full_page_images.py`。原 `stage2_generate_images.py` 改名为 `stage2_generate_images.LEGACY.py`（默认不用）。
3. **charter/AGENT_CONTRACT.md**：10 条不可违反铁律（一页）。入口流变为 BOOTSTRAP → AGENT_CONTRACT → 按 Phase 翻 AGENTS（勿整本通读）。CLAUDE / README / QUICK_START / ANTI_PATTERNS 已对齐。

### 兼容性

- 旧 slide specs 若仍写 `RENDER MODE: image_direct` / `normal` → 自动归一化，无需改文件。
- 旧 `slide_plan.json`（含 `header_variant`）→ Stage 3 仍可跑；建议重跑 Stage 1 写出新字段。
- 无 image2-ppt skill 时仍可用 LEGACY Stage 2，但 agent 默认路径不变。

---

## v0.12.0 — 三层分化梯度（2026-07-09）

**代号**：Gradient

> 本版**取代 v1.1 的扁平 `_build/` 布局**。v1.1 把源/派生分开了(对的),但版本轴切错了地方——`cp -r v1 v2` 会把整个 deck(含 research、视觉)复制一份,共性分叉,正是 bug 0007 换个轴复发。v1.2 按"信息分化梯度"重构:越上游越共享,越下游才切版本。

### 变了什么

run bundle 现在是**三层分化梯度**(唯一权威源:`scripts/bundle_layout.mjs`,跑它打印权威树):

```
deck_{NAME}/
├── 1_upstream_raw_material/   ← 上游:原始素材,共享,只增
├── 2_backbone/               ← 中游:主干(隐喻/公式/约束/大纲/讲稿/视觉),共享,默认事实源
└── 3_versions/v{n}/          ← 下游:微调+生产,版本只切这里
    ├── slide-specifications.md   (每页规格 + 全册 render policy,管线入口)
    ├── overrides/               (只放这版偏离 backbone 的东西)
    └── _generated/             (派生品,可 rm -rf 重建)
```

- **版本 = 下游 delta**。`cp -r 3_versions/v1 3_versions/v2` 只复制 slide 规格 + overrides;backbone/上游引用共享,不复制 → 共性永不分叉。
- **下游从 backbone 汲取,可局部 override**。版本 `overrides/<X>` 存在就用它,否则回退 `2_backbone/<X>`(`bundle_layout.resolve_backbone_asset`)——给下游灵活度又不拷贝分叉。
- **目录结构 SSOT = `bundle_layout.mjs`**。所有脚本 import 它取路径,文档树是它的人读镜像。彻底根除"结构信息散在各处、各自漂移"的碎片化(用户核心诉求)。
- **prompt 是一等资产**。每页 prompt 拆成 `_generated/page_prompts/NN_id.prompt.md`(人读)+ `_prompts.json`(机器);style master 的 prompt 存为 `2_backbone/visual-style/style-master-prompt.md`(以前画完就丢)。
- **两个 render mode**:新 deck frontmatter 默认 `full-page`；需要确定性 header 的页加入 `render.header-lock`，逐页字段仅作高级 override。旧 deck 无顶层 `render` 时保持 VISUAL TYPE 派生。
- **`deck-brief.md` 拆成 4 个模板**:`template-core-metaphor` / `template-core-formula` / `template-design-constraints`(→ backbone)+ `template-slide-specifications`(→ 版本)。
- **`_build/` → `_generated/`**;**per-bundle guide** 从 `template-deck-guide.md` 生成(`deck-guide.md` 人读控制流 + `CLAUDE.md` 一行指针)。

### 修复的 bug

- **0007**(视觉参数散落、拷贝即分叉)→ 根治:共性只在 backbone 一份;prompt 一等资产;SSOT 单一源。

### 兼容性

- v1.1 的扁平 run bundle(`v{n}/{session_design,style,_build}`)需要迁移到三层:内容 → `2_backbone/` + `3_versions/v1/slide-specifications.md`;视觉 → `2_backbone/visual-style/`;产物目录名 `_build/` → `_generated/`。用 `--run-dir deck_{NAME}/3_versions/v1` 调用管线。

---

## v0.11.0 — 目录结构锁定（2026-07-09）

> ⚠️ 本版的扁平 `_build/` 布局已被 **v1.2 三层梯度**取代。以下为历史记录。

**代号**：One Shape

### 变了什么

**run bundle 只有一种形状了。** 之前 run bundle 结构散落在 ~11 个文件里，互相矛盾（脚本文件名、`style/` 内容、JSON 放哪、`-v1` 后缀、trace 扩展名、pptx 名各说各话），agent 照着读根本拼不出一致的目录，只能临场发挥——这就是 bug 0005 的根。现在：

- **源与派生物理分离**。`v{n}/` 下只有两个源目录（`session_design/` + `style/`，你手改），脚本生成的一切进 `_build/`（绝不手改，可 `rm -rf` 后重跑重建）。打开 `v{n}/` 只看到三样东西，边界自明。
- **唯一权威定义**落在 `workflow/00-setup/01-directory-template.md`。AGENTS.md、scripts/README、workflow/04-production/* 全部对齐到它。
- **管线路径写死在 `unified_pipeline.mjs` 常量里**，不再靠人工传 `--out-dir`。stage1/stage3 解耦了"写产物"和"读 style"的位置（新增 `--style-dir`）。
- **脚本就地运行**，不再复制进 `v{n}/scripts/`——少一个分叉源。
- **文件名去掉 `-v1` 后缀**（bug 0004）；版本只由 `v{n}/` 目录承载。
- **新增 per-bundle `CLAUDE.md` 模板**（`workflow/00-setup/template-bundle-claude.md`）——每个 run bundle 的反临场发挥护栏，agent 进目录先读它就知道能改什么、别碰什么。

### 修复的 bug

- **0004**（`-v1` 冗余后缀）→ resolved
- **0005**（目录约定被随意违反）→ resolved

### 已知 follow-up（未纳入本版）

- 脚本级 `--out-dir` allow-list 校验、目录改名自动更新引用（见 `_todos_bugs/0005` 文末）——结构锁定后的加固项。

### 兼容性

- 现有旧 run bundle（产物在 `v{n}/` 根、带 `-v1` 后缀）需要迁移：把生成物移进 `_build/`。脚本对独立调用保留了向后兼容的 style 目录探测，但推荐统一走 `unified_pipeline.mjs`。

---

## v0.10.0 — 小白可用（2026-07-08）

**代号**：Turnkey

### 现在你能做什么

**从零到 PPTX，只跟 Agent 说话。** 你唯一要做的是告诉 Agent 你想要什么 PPT——融资 pitch、战略 keynote、培训课、还是研究报告。Agent 问你几个选择题（听众是谁、多长时间、最想让人记住什么），然后自动生成隐喻候选、推荐视觉风格、搭好 slide 骨架。你确认方向，Agent 跑管线，拿到 PPTX。

**不用懂配色。** 从 5 套经过实战验证的视觉预设里挑一个——Dark Executive（深色高管风，T10 实战胜）、Clean Clinical（白底数据风）、Warm Editorial（暖色编辑风）、Tech Startup（深紫科技风）、Corporate Safe（企业蓝保守风）。选了就能用，不需要调色板。

**不用发明隐喻。** Agent 从 22 个隐喻模式里做匹配，给你 2-3 个候选。你做选择题——"这个对"或"换一个"。

**不用学管线。** 一条命令跑完 5 个 Stage（解析 markdown → AI 生图 → Header-Lock 叠加标题 → 打包 PPTX → 注入演讲备注）。改一个字不用重跑全流程——Agent 自动判断影响范围和最小重跑路径。

**改东西说人话就行。** "第 5 页的案例换成特斯拉"、"颜色太暗了"——Agent 听懂自然语言，内部分类到对应的编辑链，告诉你要多久，执行。

**跨 Agent 可用。** Claude Code、Codex、Cursor 都能用。Agent 读到 BOOTSTRAP.md 就知道该干什么。

### 现在你还做不到的（以及怎么办）

- **Slides 上放中文**：预设默认英文。要用中文需要 Agent 手动改 deck_system.txt + 切换 stage3 字体。支持，但不自动。
- **在 PowerPoint 里直接改文字**：PPTX 是图片容器——每页是一张完整图片。要改文字得回到源 markdown 改，然后重跑 Chain A（~5 分钟）。
- **用自己的 Logo**：预设默认无 logo。需要 Agent 在每个 IMAGE PROMPT 中描述 logo 位置，并编辑 deck_system.txt 放开禁止规则。
- **不喜欢 5 个预设**：告诉 Agent "我想自定义风格"，Agent 会切到 Expert Mode 带你从头设计视觉系统。
- **断网后继续生图**：Stage 2 崩了重跑全量（但已下载的图片会跳过，不浪费 API 调用）。

### 这个版本基于什么

v1.0.0 的前身是 T9（30 页 3-session keynote + breakout）和 T10（19 页单 session 战略简报）两个真实项目中长出来的方法论框架——Style Anchoring、Header-Lock、四层 slide 规格、三编辑链。那些核心资产没变，变的是**入口**：从"你得先读完 60 个文件才能上手"变成了"Agent 读 BOOTSTRAP.md，你回答选择题"。

---

> **分界说明**：以上为 v1.x.y → v0.xy.z 重编号的历史条目。MAJOR 从 1 修正为 0（项目未到 1.0 水准），旧 MAJOR.MINOR 合并为新 MINOR。自本条目起，版本号覆盖 repo 整体（软包+脚本+管线+OpenSpec 体系），由根目录 `VERSION` 文件作为 SSOT。

## v0.14.3 — 确立 repo 级版本管理（2026-07-14）

**代号**：Version Awareness

### 变了什么

1. 根目录新建 `VERSION` 文件（`0.14.3`）作为 repo 版本号 SSOT。
2. `PPTMAKER_FRAMEWORK/reference/version-log.md` 移动到根目录并重命名为 `VERSION_LOG.md`，历史条目从 v1.x.y 重编号为 v0.xy.z。
3. `PPTMAKER_FRAMEWORK/README.md` frontmatter 和标题旁加版本号。
4. `CLAUDE.md` 追加版本管理行为铁律；`openspec/config.yaml` `rules:` 下新增 `version:` 段。
5. `package.json` `version` 同步为 `0.14.3`；`openspec/config.yaml` capability 注册表新增 `project-versioning`。
