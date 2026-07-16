## Context

`slide-specifications.md` 已经把页码和字符串 ID 写在同一个 heading 中，但当前运行时没有真正分开二者：Stage 1 将 position 写进 raw-image 文件名，Stage 3/4 用 glob 反查图片，selector 对 `s03` 有历史特殊规则，Stage 5 则完全按位置注入 notes。结构变化因此同时触发 source 重编号、派生路径漂移、review evidence 失配和 notes 风险。

这是跨 Stage 1–5、CLI、MD Controller、run-bundle versioning 和未来 dual-render adapter 的数据模型变更。约束如下：

- Markdown 仍是 source SSOT；不得新增第二份持久化 order 文件。
- Agent/MD 擅长语义命名与自然语言理解，JS 擅长确定性校验、事务和 provenance；两侧不能互换责任。
- Structural Versioning Path 仍创建干净 vNext，`_generated/` 仍是派生物且不可手改。
- legacy ID 和旧 `NN_<id>.png` 必须可读；普通 reorder 不能隐式改 legacy ID。
- 仅重排或删除页面不得发起 Image2 或未来 HTML 的远端渲染。

## Goals / Non-Goals

**Goals:**

- 以稳定 `slide_id` 表示页面身份，以 derived `position` 表示当前顺序。
- 让 ID 在视觉、键盘和语音中都容易引用，同时携带“对象 + 角度”两个语义钩子。
- 提供 preview-first、snapshot-based、concurrency-safe 的增删重排事务。
- 让 Stage 1–5 按 ID 关联 source、render artifact、PPTX 顺序和 notes。
- 以 manifest/fingerprint/hash 证明跨版本复用，最小化结构变更后的刷新范围。
- 为 dual-render 留下 `(slide_id, render_engine, generation_fingerprint)` 的逻辑 artifact interface。

**Non-Goals:**

- 不实现 HTML renderer、mixed-engine 策略或 dual-render CLI。
- 不实现多人并发编辑、CRDT 或 LexoRank。
- 不把 PowerPoint XML 内部 ID 变成 source identity。
- 不让 JS 发明语义呼号，也不自动理解并重写正文中的自然语言页码。
- 不在 MVP 提供无版本保护的 in-place add/delete/reorder。
- 不在普通结构编辑中自动迁移 legacy ID；显式 ID migration 后续独立实现。

## Decisions

### 1. 正式身份使用 BlockCase 双语义 ID，页序独立派生

正式 `slide_id` 直接写成 `UXGap`、`AIFee`、`IDFix`、`PPTGo`；它同时作为 Markdown ID、plan ID、manifest key 和日志 ID。新 ID 的结构是 `SUBJECT + MOVE`：第一块说明对象/领域，第二块说明角度、判断或叙事动作。

- 正式 ID 只含 ASCII letters，目标 5 字母、必要时 6 字母。
- BlockCase 必须解析为正好两个 2–4 字母 block；至少一个 block 为 TitleCase word-like 形态，而不是两个纯辅音 token。
- Agent/MD 负责选择有意义的两块；JS 只验证 shape、长度、保留词、exact uniqueness、spoken-key uniqueness 和近似冲突。
- `position` 是 source slide-block 物理顺序的 1-based 投影。Heading 数字是可读镜像，不是身份。
- ID rename 视为身份变化，普通标题编辑、move、render-engine 切换都不改 ID。

选择 BlockCase 而不是随机码，是为了口述；选择双块而不是 `PAIN` 等单名词，是为了在长 deck 中提供第二个辨识钩子。选择 5 为目标、6 为上限，是为了兼顾记忆负担和语义保真；不得为了五位把 `AICost` 压成 `AICst`。

### 2. selector 使用 spoken key 归一化，但正式 ID 保持原样

selector resolver 按以下顺序解析：

1. exact formal ID；
2. spoken key；
3. explicit position (`7`, `p7`, “第 7 页”经 MD 转为 position token)；
4. 唯一标题片段；
5. exact legacy ID fallback。

`spoken_key` 通过移除 `@`、空格、连字符并转小写得到，因此 `UX gap`、`UXGap`、`uxgap`、`ux-gap` 和 `@UXGap` 都命中正式 ID `UXGap`。deck 历史中的正式和 legacy ID 均参与 spoken-key reservation；冲突 fail loud。语音近似检查先采用确定性的拼写距离/易混淆集合并给 warning，不做不可靠的自动纠正。

旧的 `sNN` prefix 便利规则仅作为 legacy fallback；它不得覆盖 exact/spoken match，也不得让新 ID 的数字含义与 position 重新耦合。

### 3. 一个 `slide_document` 深模块拥有 Markdown 结构和 edit transaction

新增 `scripts/lib/slide_document.mjs`（最终文件名可在 apply 时按现有命名习惯微调），其外部 interface 保持小而完整：

```js
parseSlideDocument(text, source) -> document
validateSlideDocument(document, history) -> issues
planSlideEdit(document, selectors, operations, history) -> transaction
applySlideEdit(transaction, sourceText) -> { text, receipt }
```

实现使用保留 byte ranges 的 line/heading scanner，而不是多处独立 regex。Document 明确区分：leading frontmatter、preamble、slide blocks、epilogue。遇到 slide list 后的非-slide level-2 heading（例如 `## Change Log`）即进入 epilogue，避免它被吞进最后一页。

无改动区域按原 bytes 回写；只有被移动的完整 block、heading number 和确定性的 structured reference 发生变化。Stage 1、validator、notes parser 和 structure CLI 都复用该 module，不再各自 split Markdown。

Canonical run-dir 的单一 `slide-specifications.md` 要求 heading numbers 等于 `01..N`。Stage 1 standalone 多输入仍受支持：每个文件独立验证本地连续编号，合并后的 `slide_plan` position 依输入与 block 顺序全局递增。Structure CLI MVP 只编辑 run-dir 的唯一 canonical spec。

### 4. 所有结构操作先在同一快照解析，再一次提交

Edit transaction 包含：

```json
{
  "schema_version": 1,
  "base_spec_sha256": "...",
  "operations": [
    { "op": "move", "slide_id": "IDFix", "after_id": "AICost" }
  ],
  "before_order": ["..."],
  "after_order": ["..."],
  "warnings": []
}
```

所有 position/title/spoken selectors 先针对 `before_order` 解析成 formal ID，之后才执行 operations。因此 delete p3,p7 不会因为先删 p3 而重新解释 p7。Planner 验证目标存在、最终 ID set、连续 position、structured references 和 operation conflicts，并返回 before/after preview。

Apply 时重新计算 source SHA；不一致即拒绝，不自动 rebase。自然语言正文、Block Map 或 notes 中出现的“第 7 页”只产生 review warning，Agent 负责语义更新；JS 仅更新可结构化判定的引用，例如 `render.header-lock`。

### 5. 结构命令 preview-first，apply 通过现有 versioning interface 提交

`ppt_flow slides list|resolve|normalize|move|delete|insert|apply-plan` 保持一个顶层 `slides` command group。除 `list/resolve` 外，不带 `--apply` 的变更命令只输出 preview，绝不写文件。

- `move/delete/insert/apply-plan --apply` 先在内存和 source-version `_scratch/` 临时文件完成 transform 与完整验证，再调用 `bundle_layout.mjs` 的 version creation interface 创建 vNext，并用 same-directory temp + atomic rename 替换 target spec。
- 如果 commit 在 target version 创建后失败，只清理本次新建且尚未发布成功的 target；源版本不变。
- `normalize --apply` 是唯一 current-version exception，因为它只修 heading projection，不改变 ID set、block order 或内容；仍使用 atomic rename。
- 持久化 edit plan 只能放在 `_scratch/`，它是事务输入/回执，不是第二份 order SSOT。

CLI human output显示 `position + BlockCase ID + title`。`--json` 输出稳定 preview/receipt 对象。硬失败继续由 `cli-surface` 的 envelope/diagnostic 权威定义，新的命令复用 `cli_error.mjs`。

### 6. Stage 1 输出 position，昂贵 output identity 不再含 position

Stage 1 的每个 plan/prompt entry 增加 `position`。新 prompt entry 的 logical output 是 ID-stable `<slide_id>.png`；人类可读 prompt twin 可以继续使用 `NN--<slide_id>.prompt.md`，因为它便宜且可重建。

Duplicate/empty ID、formal/spoken-key collision、canonical run 中 heading mismatch/skip 均是 blocking source errors。Legacy ID shape 本身不报错；只有通过新 insert/authoring 路径创建的 ID 必须满足 BlockCase contract。新模板和 Agent guidance 保证新 deck 进入严格格式。

Position、human-readable prompt filename 和 current order 不进入 image generation fingerprint。Legacy `_prompts.json` 中的 `NN_<id>.png` output 通过 adapter 继续可读，不要求远端重生。

### 7. Stage-specific manifests 共同满足 render-artifact interface

不新增一份复制所有 provenance 的巨型 manifest。各 owner 继续维护自己的 manifest，通过 `render_artifacts.mjs` 统一读取 interface：

```text
resolve(slide_id, engine, kind) -> path + fingerprint/profile + sha256
```

- Stage 2 的现有 `page_images_full/_manifest.json` 继续拥有 Image2 raw provenance；新写 output 使用 formal ID filename，legacy manifest output 可直接采用或无损 materialize 为 ID-stable path。
- Stage 3 新增 `header_locked/_manifest.json`，每页记录 output、output SHA、raw image SHA、resolved render mode、header fields/config fingerprint 和生成时间。Full-page passthrough 同样登记。
- Stage 4 只通过 Stage 3 manifest/adapter 取每个 plan ID 的唯一 final PNG，不再扫描目录猜测。
- 未来 HTML engine 提供自己的 adapter/manifest；逻辑 identity 固定为 `(slide_id, render_engine, generation_fingerprint)`。

这保留 owner locality，也避免把 Stage 2/3 schema 复制到一个第二事实源。

### 8. 跨版本复用是验证后的 materialization，不是手工复制

结构 apply 后的 pipeline 先运行 Stage 1，再比较 source/target：

- stable ID 相同；
- 当前 generation fingerprint/profile 与源 manifest 相同；
- 源文件 bytes SHA 与 manifest 相同；
- 对 final/header artifact，Stage 3 input fingerprint 和 output SHA 也相同。

全部通过才由 Node 自动 copy 到 target `_generated/` 并原子写 target manifests。Reorder/delete-only 的 retained IDs 全部复用；insert 只让新 ID 缺 artifact；内容变化按现有 ownership/fingerprint 规则失效。任何校验失败都降级为正常 refresh，不猜测，也不手改 `_generated/`。

Header review evidence仍按 version 存储，但 pipeline 可为 target version **重新 materialize**逐页证据：仅当 stable ID、header fingerprint、generation profile 和 reviewed raw-image SHA 全部一致，并记录 source version lineage。Target 不直接读取 source-version record；没有验证 materialization 时仍按现有规则 blocked。

### 9. Stage 4 assembly receipt让 Stage 5证明 ID 顺序

Stage 4 在 `_generated/qa/pptx_assembly.json` 写 receipt，绑定 slide-plan hash、ordered slide IDs、每页 final-image SHA、PPTX path/hash 和时间。Stage 5 将 notes 解析为 `{slide_id, note}`，要求 ID set 与 plan exact match，然后按 plan order 注入。

Stage 5 首次运行要求 current PPTX hash 匹配 assembly receipt。Notes-only rerun可以由上一份 current notes receipt证明 PPTX 是同一 ordered-ID assembly 的后继；Stage 5 在改写前读取并验证旧 receipt，成功后发布包含 ordered IDs 与 final PPTX hash 的新 notes receipt。这样既支持 notes-only refresh，也不会只凭数量相等放过错位 deck。

### 10. MD Controller只做意图与确认，JS receipt提供确定事实

`restructure-slides` playbook 与 COMMANDS 将用户的“第 7 页”“UX gap 那页”转成 selector，调用 preview，并展示 before/after。Agent不直接手工重排 Markdown。若 selector 歧义、正文页码 warning 或 CLI diagnostic `requires_human:true`，MD 停下让用户确认；否则可在用户已明确授权后运行相同 transaction 的 apply。

Producer字段与 failure emission仍归 `cli-surface`；`node-specification` 只定义如何消费 preview/receipt/diagnostic，不复制 schema。

### 11. 验证策略覆盖 module interface和端到端结构行为

- **Unit**: identity parser、BlockCase/spoken-key validation、legacy classification、selector precedence、snapshot multi-delete、move/insert conflicts、byte-preserving parse/serialize、epilogue boundary、base-hash mismatch、artifact fingerprint comparison。
- **Integration**: Stage 1 plan/order/output naming；Stage 2 legacy/current manifest reuse；Stage 3 manifest；Stage 4 manifest resolution + assembly receipt；Stage 5 ID-set/order validation；CLI preview/apply/envelope/return audit。
- **E2E**: 使用 `tests_e2e` 创建临时最小 run bundle（不读取生产 `deck_*`），验证 reorder/delete-only 创建 vNext、零远端 render call、PPTX 新顺序和 notes ID 对齐；insert 只缺一个 artifact。
- **Regression**: legacy `s07_problem` + `NN_<id>.png` fixture、multi-input Stage 1、header review version isolation、现有 refresh paths 和完整 `npm test`。

## Risks / Trade-offs

- **[语义无法由 JS 证明]** → Agent拥有命名；JS只验证可测试 shape/冲突，模板与 playbook提供候选与推荐。
- **[BlockCase acronym边界复杂]** → 使用单一 parser和 golden cases；正式 ID exactly two blocks，拒绝无法唯一分段的形式。
- **[spoken selector误命中]** → spoken key deck-history unique；近似项 warning；歧义 fail loud，不自动纠正。
- **[Markdown round-trip破坏手写内容]** → byte-range document model；未改区域 byte-preserving；golden fixtures覆盖 frontmatter/preamble/epilogue。
- **[跨版本复用陈旧 artifact/evidence]** → stable ID 只是第一道条件，还必须验证 fingerprint/profile/bytes；任一不符即不复用。
- **[Stage 3/4 manifest迁移扩大范围]** → 读侧保留 legacy adapter；新写 manifest逐步建立；不要求一次性改生产 deck。
- **[大小写在不区分大小写文件系统上冲突]** → formal exact ID 与 lowercased spoken key 都必须唯一，禁止仅靠 case区分两页。
- **[结构 apply 中途失败留下空 vNext]** → 先完整预验证，commit使用现有 version interface + atomic source replacement；只回收本次未发布 target。
- **[范围较大]** → 实现按 identity/document、read-only UX、artifact manifests、write transactions、reuse/notes 六阶段推进；每阶段保持 legacy tests绿色。

## Migration Plan

1. 先落 pure identity/document modules与兼容 tests，不改变现有输出。
2. Stage 1增加 position和严格 duplicate/order validation；新模板开始生成 BlockCase ID，legacy shape继续接受。
3. Stage 2/3增加 ID-stable writes与 manifest adapters；Stage 4切到 manifest read，并保留 legacy bootstrap adapter。
4. Stage 4/5增加 assembly/notes ordered-ID receipts。
5. 注册 read-only `slides list|resolve|normalize`，再启用 preview/apply结构事务。
6. 最后开启跨版本 materialization和 verified header-evidence carry-forward，更新MD docs/playbook。

Rollback时可停止使用 `slides --apply` 并保留 legacy读adapter；已创建的 BlockCase ID仍是合法字符串，不影响旧 parser。新 manifests均在 `_generated/`，可删除并由兼容管线重建。Source version永不被 structural apply覆盖，因此可回到上一版本。

## Open Questions

- HTML renderer 的物理目录和 manifest schema由后续 `dual-render-pipeline` change决定；本 change只固定逻辑 artifact interface。
- 显式 legacy ID migration的命令、是否保留 alias以及迁移review evidence的UX不在本 change，后续按真实使用反馈单独提案。
