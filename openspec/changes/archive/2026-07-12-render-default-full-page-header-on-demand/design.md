## Context

Stage 1 决定每页 `render_mode` 并组装 image prompt；Stage 3 对 `body+header-lock` 页叠加结构化 header，对 `full-page` 页透传。现状的 content full-page 没有统一 header 纪律，而框架模板又鼓励逐页显式写 mode，用户和 Agent 都暴露在内部生产选择中。

`slide-specifications.md` 已经存在 YAML frontmatter。`color_palette.json` 经 `visual_config.mjs` 提供 header position、font size/family/weight/color、line height 和 margins；Stage 3 固定左对齐，当前 schema 没有 alignment 字段。

## Goals / Non-Goals

**Goals:**
- 新 deck 默认 full-page，用户只管理内容文字。
- 旧 deck 不迁移也保持原 mode 结果。
- policy/legacy 状态可判定、级联确定、输出可追溯。
- content full-page 和 header-lock 共享真实存在的 header geometry。
- 默认翻转由可执行的 pilot header gate 兜底。

**Non-Goals:**
- 不修 BUG-009。
- 不增加第三种 render mode。
- 不修改 `color_palette.json` schema，不增加可配置 alignment。
- 不保证 full-page header 像素级一致。
- 不实现逐页自由 header 坐标。

## Decisions

### 1. 只解析文档开头可选的 YAML frontmatter

示例：

```yaml
---
title: Deck Brief
stage: workflow/02-content
render:
  default: full-page
  header-lock: []
---
```

- 使用项目已有 `yaml` 包解析仅在文档开头出现的可选 frontmatter；没有 frontmatter 的旧 deck 合法并进入 legacy 分支。
- 开头 frontmatter 结束后的 `---` 都是普通 Markdown 分隔线，不得被当作另一段 YAML 或报错。
- 保留既有和未知顶层键；Stage 1 只消费 `render`。`render` 自身是 closed mapping，只允许 `default` 和 `header-lock`，因此 `header_lock` / `headerLock` 等拼写错误不会静默失效。
- `render` 若存在必须是 mapping；`default` 缺失时取 `full-page`；`header-lock` 缺失时取空数组。
- `default` 仅允许 `full-page` / `body+header-lock`；例外表元素 trim 后必须非空、唯一、存在且只对应一张 slide。被重复 slide id 命中的 exception 属于歧义错误，而不是沿用普通 duplicate-id WARN。
- YAML 语法、duplicate YAML key、未知 render key、类型、mode、空 id、重复/未知/歧义 id 均 fail-loud。Stage 1 抛出具体错误；通过 `ppt_flow` 调用时由 orchestrator 保证 JSON envelope 为 stderr 最后一行，standalone Stage 1 不另造一套 envelope 协议。
- 若存在，开头 frontmatter 在 slide-block 解析前剥离；原 markdown 其余内容不改写。
- Stage 1 被 standalone API 以多个输入文件调用时，每个文件的 frontmatter 只作用于该文件的 slide blocks，exception id 也按文件校验，policy 不跨文件泄漏；正常 production run 仍以版本目录中选中的单个 specs 文件为入口。

### 2. `render` 键的存在性是唯一的新旧行为分界

```text
render 键缺失
└─ legacy: explicit RENDER MODE > VISUAL TYPE derivation

render 键存在
└─ policy: explicit RENDER MODE
          > header-lock exception
          > hero guard
          > render.default (missing => full-page)
```

不存在“无 policy 同时默认 full-page”的第三种解释。新 deck 通过 `--init` 写入有效 `render.default: full-page`，所以自然进入 policy 分支；旧 deck 没有该键，自然留在 legacy 分支。

source 规则：
- per-slide explicit → `explicit`
- exception list → `policy:exception`
- policy 下 hero guard 覆盖 `body+header-lock` default → `derived:hero_type`
- policy default，包括显式或缺省的 `full-page` → `policy:default`
- legacy VISUAL TYPE → `derived:visual_type`

### 3. Hero 类型先规范化再判断

canonical hero 集合为：

```text
Title / Opener
Section Divider / Bridge
Closer
```

至少接受 `Section Divider` 作为 `Section Divider / Bridge` 的 alias，并统一 trim/case/空白后比较。canonicalization 和 `isHeroVisualType` 必须放在 Stage 1 与 `ppt_flow` selector 共用的 helper 中，不能复制两套集合。模板与测试使用的所有现存 hero 拼法都必须覆盖。未知 VISUAL TYPE 维持现有验证策略，不在本 change 顺带发明新的 taxonomy。

policy 分支中的每张 slide 必须有真实 VISUAL TYPE，因为 Stage 1 必须先区分 hero/content 才能选择 prompt contract。缺失或 bracket placeholder 直接 fail-loud；legacy 分支继续维持既有兼容行为。

### 4. Full-page 软契约与 Stage 3 硬叠加共享真实 geometry

共享字段明确为：
- canvas width/height
- body header safe-zone height
- left/right margins
- kicker/title y 坐标
- subtitle gap
- title/subtitle line height
- kicker/title/subtitle font family、weight、size、color
- 固定左对齐 invariant

alignment 不是 palette 字段。content 软契约使用固定混合格式：先声明语义区域（top-left header band、header only、body visual must begin below it），再给 canvas 和 px 坐标/字号；不再把绝对 vs 相对措辞留作实现期开放选择。软 band 高度来自 visual config，但只注入 prompt。所有 full-page 的 `layout_contract.header_safe_zone` 继续为 `0`，因为该字段保留“确定性 overlay 的硬安全区”既有语义；Stage 3 仍只由 `render_mode` 决定是否叠字。hero full-page 不注入固定 band，但必须注入 present header fields 的 exact-text contract，明确文字准确、构图自由。这样用户不需要在 IMAGE PROMPT 中重复结构化 header 文字。

Stage 1 对可选 header 字段使用同一个 presence normalization：空、大小写不敏感的 `(none)`、`(无)` 或整字段 bracket placeholder 都视为 absent，并在输出 slide record/prompt 中省略，确保 full-page 和 header-lock 不会把 sentinel 当成可见文字。所有注入 prompt 的 exact text 使用稳定的结构化 formatter 和 JSON string escaping，不做字符串裸拼接。content TITLE 缺失只发非阻塞 WARN；body+header-lock TITLE 缺失仍按现有规则阻断。

body+header-lock assembled prompt 不包含 kicker/title/subtitle 的具体值。它只包含 hard safe-zone/body contract 和一条 generic “header will be overlaid later”说明。结构化 header 文字只进入 `slide_plan.json` 给 Stage 3 使用。否则 title-only edit 会改变 final image prompt，与 Chain A 和 provenance cache 直接冲突。

“同源”只保证两条路径读取同一配置目标，不保证图像模型实现出相同像素结果。

### 5. Stage 3 对 source 无感

Stage 3 的完整决策只有：

```text
render_mode == body+header-lock -> overlay
render_mode == full-page        -> pass-through
```

whole-deck default、exception、explicit 和 legacy derivation 都只是 Stage 1 的来源信息。`render_mode_source` 用于诊断，不参与 Stage 3 行为。

### 6. 编辑链取决于文字实际由谁渲染

| 改动 | 分类 | 原因 |
|---|---|---|
| body+header-lock 的 kicker/title/subtitle | Chain A | Stage 3 重画即可 |
| full-page 的 kicker/title/subtitle | Chain B | 文字已烧进图片 |
| full-page → header-lock | Chain B | body prompt 必须改为预留 header band |
| header-lock → full-page | Chain B | 图片需要重新包含 header |

所有 Chain B 单页重生均显式使用 `--force-images`。

### 7. Pilot selector 与 review gate 是默认翻转的强制安全网

- 自动 pilot 选择属于 `pipeline-orchestration`：若存在 content full-page，`count >= 1` 时至少选一张；若至少存在两张且 `count >= 2`，至少选两张，以便真正检查跨页一致性。剩余名额再覆盖 opener/closer/其他模式。选择必须确定且去重。
- `--only` 保持用户显式选择的语义，CLI 不偷偷加页；但任何要用于批准 full build 的 pilot，在 deck 有两张以上 content full-page 时必须实际 review 至少两张。手工选择不足时，playbook 要求补跑，而不是宣称 gate 已满足。
- review contact sheet 时必须检查：文字是否准确完整、是否清晰可读、header zone/字号/左对齐是否跨页稳定、是否与 body 冲突。
- 有漂移时 Agent 点名页和症状，建议加入 `render.header-lock`；只有用户确认后才修改 policy。
- policy 修改后按 Chain B 重生对应页并重新 review；问题未解决或用户未显式接受风险，不得把视觉 review 视为通过并继续 full build。
- 若用户接受未解决风险，Agent 必须在版本 Change Log 或 playbook state extra 中记录受影响 slide ids 和接受的具体风险，不能只留一条瞬时对话。

header review evidence 存在 deck 根 `_state/state.yaml` 的稳定共享节点 `nodes.header-review.by_version["3_versions/vN"]` 中，不新增顶层 gate。必须按规范化 run-dir 相对路径分版本存储，任何 evidence 只可用于同一 version。每个 version record 至少记录：
- `reviewed_content_full_page_ids`
- `header_review_fingerprint`
- `full_page_header_snapshot`（per-slide normalized header fingerprint）
- `reviewed_changed_full_page_ids`（本轮 source delta 涉及且已实际 review 的 full-page ids）
- `accepted_risk_ids` 与症状（若有）

fingerprint 由会影响观测结果的规范化输入稳定计算：所有当前 full-page slide ids 及其 render mode、normalized VISUAL TYPE、present kicker/title/subtitle，以及 content soft-contract 使用的共享 header geometry。review evidence 另记录 content 抽样 ids，且必须满足覆盖规则。`full_page_header_snapshot` 用于和下一次 source 解析结果做 per-slide diff：新增为 full-page、mode 变为/离开 full-page、或 header text 变化的 ids 都算 changed；共享 geometry 变化要求重新做 content 覆盖 review。接受新 fingerprint 前，所有 changed full-page ids 必须实际 pilot/review 或逐页持久化 accepted risk。这样 hero 标题编辑也不会被 content-only gate 漏掉。纯 speaker notes 或无关 body 内容变化不使 evidence 失效。

机器 gate 适用于 `ppt_flow build`、非 preview Stage 2 和 Stage 4；preview/pilot 不要求 evidence。若当前没有 content full-page 且相对 accepted snapshot 也没有 changed full-page ids，gate 不适用；hero-only deck 的首次普通 build 不强制建立 baseline，但其后 hero title/mode 变化会由 title refresh/changed-id 路径要求 evidence。有效 evidence 可以是“review 通过”，也可以包含用户明确接受并持久化的具体风险；后者不是泛化 `--waive`，必须绑定当前 fingerprint、image/profile 和 slide ids。失败使用标准 JSON envelope，hint 指向运行 pilot/review，而不是建议用户手改 state。

evidence 的正规写入口是扩展现有命令 `ppt_flow approve <run-dir> header`，不新增 CLI command，也不复用 content/visual metadata gate：
- 普通 header approval 从当前 `pilot_slide_plan.json` / contact sheet 对应 subset 读取 ids，验证这些图存在、raw-image provenance 与当前 generation inputs 一致，且 header fingerprint 与当前 source/config 一致，然后写 node extra。
- 同一 version、同一 fingerprint 和 generation profile 的多次 approval 合并 reviewed ids/image hashes，支持多个 contact sheet 补齐覆盖；fingerprint/profile 不同则不能合并旧批次。
- 覆盖尚不足时仍可保存 partial evidence，但当前 `by_version[versionKey].status` 保持 `in_progress`，CLI 明确输出缺少的 ids/classes；baseline coverage、所有 changed full-page ids 和 accepted risks 都满足后该 version record 才标 `completed`。production gate 只接受当前 version 的 completed record；其他 version 的状态不受影响。
- `approve header --waive` 不是全局跳过；必须带 `--only <ids>` 和 `--reason <text>`，将具体 accepted risk 绑定当前 fingerprint。没有 ids/reason fail-loud。
- header approval 不修改 `project-metadata.yaml` 的 content/visual gate，也不写 `_state.gates.header`；它只更新 review node evidence/history。
- 直接调用 state helper 手写 evidence 不属于用户工作流；文档和 error hint 必须指向 approve header。

Stage 4/final assembly 是最后一道 fail-closed 边界。无论调用来自 `ppt_flow build`、refresh，还是直接 `unified_pipeline --stage 1,3,4,5`，只要要组装 PPTX，就必须以当前 source/config 校验 header evidence；否则旧 full-page 图片不得进入新 PPTX。Stage 2 的 production check 负责避免昂贵生成前浪费，Stage 4 check 负责堵住 partial-chain 旁路。

### 8. Raw image provenance 让缓存和 review 可证明

- Stage 2 在 `_generated/page_images_full/_manifest.json` 维护 per-slide entry：output filename、SHA-256 generation fingerprint、generated_at。
- entry 还记录生成后 PNG bytes 的 SHA-256 `image_sha256`；approve/review 绑定的是实际图片 bytes，不只是请求输入。
- fingerprint 稳定覆盖 final assembled prompt、style-reference file content hash、resolution、model identifier 和改变图像语义的 generator options；不包含 endpoint、时间戳等运行信息。
- 只有 output image 存在且 manifest fingerprint 与当前输入一致时才能 `skipped-exists`。图片存在但 entry 缺失、损坏或不匹配时视为 stale：默认 fail-loud 并给出精确 `--only ... --force-images`，不静默复用，也不自动触发付费请求。
- 成功生成后原子更新对应 entry；失败不标 current。`--only` 只更新 selected entries并保留其他有效记录。
- pilot contact sheet 和 `approve header` 使用同一 provenance 校验。旧图片无 manifest 时，首次要 review/production reuse 必须显式强制重生建立 provenance。
- header evidence 记录 reviewed ids 的 `image_sha256` 和 generation profile（model/resolution/style hash/semantic options）。Stage 4 要求这些已审 image hashes 未变化。
- `ppt_flow build` 若会 `--force-images` 覆盖 current reviewed/accepted full-page ids，必须在生成前 fail-loud；标准路径是用与 approval 相同的 profile 执行 `build --reuse-images`，保留已审页并只生成缺失页。若要改 resolution/model/style 或重生已审页，先用目标 profile 跑 `pilot --only <ids> --force-images` 并重新 `approve header`。
- 1K quick preview 可以探索，但只有与计划 production profile 相同的 pilot 才能生成可供该 build 使用的 header evidence；build profile 不匹配时 evidence 对该 build 无效。

### 9. `refresh --kind title` 按 resolved mode 路由

- CLI 继续保留 `refresh --kind title`，并允许 `--only` / `--all`；selector 复用标准 slide id resolution。
- 命令先基于当前 source/config 刷新 Stage 1，再确定目标页。`--only` 指定目标；`--all` 表示全部；两者都没有时，若 deck 含任何 full-page，fail-loud 要求用户声明目标，避免为一个 body-lock 标题误重生整册 full-page。全 deck 都是 body-lock 时保留旧的无 selector Chain A 行为。
- 目标全是 body+header-lock：运行 Stage 3/4/5（Stage 1 已刷新），不跑 Stage 2。
- 目标含 full-page：若这些 changed ids 尚无 current review/accepted-risk evidence，命令以 `TITLE_REVIEW_REQUIRED` 失败，列出 ids，并提示 `ppt_flow pilot <run-dir> --only <ids> --force-images`；不得产出最终 PPTX。
- pilot/review 更新 current evidence 后，再次运行同一 refresh；它复用已重生、已审 raw images，只跑 Stage 3/4/5 完成打包，不再二次生成图片。
- `--all` 下所有 current full-page 都视为可能 changed，需要 current evidence；body-lock 部分仍由 Stage 3 更新。

“某页偏离已配置目标”才走 header-lock remedy；若用户不满意的是整册目标位置/字号本身，应修改 visual config 并按受影响 render modes 重新分类重跑，不把全局设计变更伪装成单页 exception。

## Risks / Trade-offs

- **模型非确定性和 CJK 清晰度**：prompt 只能改善，不能保证。由 pilot gate + header-lock 兜底。
- **新旧行为分叉**：相同内容因是否有 `render` 键而不同。这是有意的兼容边界，必须通过 `render_mode_source` 和 init seed 可见。
- **模板显式 mode 覆盖 policy**：若旧指导残留，新 deck 会继续走 `explicit`。因此模板和 Agent 方法论文档同步是实现完成条件，不是附属文档工作。
- **hero 文字丢失或 prompt 重复**：只排除 fixed band 不等于不传文字。Stage 1 必须注入 hero exact text，同时文档必须要求 source IMAGE PROMPT 不重复结构化 header 文案。
- **已有 visual gate 无法代表后置 pilot 风险**：header review evidence 单独持久化，并由 production CLI/readiness 和 playbook 双重核对，不修改现有 content/visual gate schema。
- **frontmatter 解析失败面**：通过结构化 YAML parser、单一 schema validator 和具体错误消息控制。
- **顶层 `render` 键拼错无法与 legacy deck 完全区分**：为了保证“无 render = legacy”兼容性，`renders:` 这类未知顶层 metadata 不能被无依据地判死。Mitigation 是所有新模板强制 seed 正确 key、`render` 内 closed schema fail-loud、输出 source 可追溯；不做 fuzzy 猜测或自动改写。未来若要消除该歧义，需要单独引入 specs schema-version marker。
- **prompt 变长**：使用固定的“语义 band + px geometry”结构化 formatter，不能让每页作者自由发挥；pilot 验证效果，但不再在实现后才决定协议形状。

## Migration / Rollback

1. 实现 frontmatter parser + schema validator，并让 validate/parse 共用。
2. 实现 legacy/policy 两分支和 hero normalization。
3. 注入 content full-page header contract。
4. 更新 init seed、全部模板和方法论文档。
5. 更新 pilot selector、change-classifier 和 pilot playbook/spec。
6. 回滚时可停止新 seed 并移除 policy 分支；已有旧 deck仍走 legacy。已带 `render` 的新 deck 回滚前必须先显式迁移逐页 mode，不能宣称只删解析代码即可无损回滚。

## Open Questions

- 是否未来增加自动漂移检测另开 change；本 change 只要求人审 gate。
