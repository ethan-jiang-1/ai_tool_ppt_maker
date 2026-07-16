# Plan: 稳定 Slide ID + 可编辑页序

> 类型: 设计 | 状态: 已关闭 (CLS-005) — change 已实施并 archive | 更新: 2026-07-17
> 关联: `_backlog/todos/todo-dual-render-pipeline.md`、`_backlog/todos/todo-optional-git-safety-and-startup-guidance.md`
> 落地: `openspec/changes/archive/2026-07-16-add-stable-slide-identity-and-order-editing/`

> 实现权威: `openspec/changes/add-stable-slide-identity-and-order-editing/`。本 plan 保留问题推导和 UX 背景；若细节与 OpenSpec 冲突，以已校验的 OpenSpec artifacts 为准。

## 一句话决策

页面需要两个彼此独立的概念，而不是一个会随顺序变化的复合主键：

```text
当前页引用 = position（可变页序） + slide_id（永久身份）
```

对人显示成 `07 · UXGap · 页面标题`，既能继续说“第 7 页”，也能在删页、插页、重排后说“UX gap 那页”指向同一张页面。键盘输入时也可写 `@UXGap`。

但系统内部 SHALL NOT 把 `07_UXGap` 当主键。否则 `07 -> 03` 时主键仍然发生变化，图片缓存、HTML 产物、review evidence、notes 和局部重跑都会被错误地视为另一页。

## 为什么现在会痛

当前源格式表面上已有两部分：

```markdown
## Slide 07: `s07_problem`
```

但实际实现仍把顺序和身份绑在一起：

1. 常用 ID 本身带 `s07`，人和 Agent 容易在重排时顺手改 ID。
2. Stage 1 把输出名写成 `07_s07_problem.png`；换序后即使内容没变，路径也变了。
3. Stage 3/4 通过 `NN_<id>` 或 `<id>` 文件名反查图片，而不是通过一个明确的 artifact registry。
4. Stage 5 只按位置提取和注入 notes；缺一页时后续 notes 有整体错位风险。
5. `--only 7` 已能解析当前第 7 页，但这个解析只适合“当前快照”，不能作为跨重排的稳定引用。
6. Structural Versioning Path 会创建干净新版本；如果没有跨版本、按内容指纹验证的复用机制，单纯重排也会显得像需要重新渲染全册。

双渲染会把同一页扩展成 Image2 和 HTML 两份产物。如果先不拆开身份与顺序，以上耦合会复制两遍。

## 领域模型

### 1. `slide_id`: 稳定身份

- deck 范围内唯一，跨版本保留。
- 页面移动、前后插页、标题改写、render engine 切换时均不变。
- 新页面创建时生成，删除后不回收复用。
- 新 deck 使用**可口述的双语义呼号**：`SUBJECT + MOVE`，同时回答“这页讲什么”与“这页要对它说什么”。五字母示例：`UXGap`、`AIFee`、`IDFix`、`PPTGo`；六字母示例：`UXPain`、`AICost`、`IDStay`、`WebWin`。
- **正式 ID 合法范围是 5–8 个英文字母，5–6 是优先预算**。每块 2–4 个字母；7–8 位只在能明显保留口述或语义清晰度时使用。连字符只是一种 selector 输入别名，不计入正式 ID。
- 双语义是 Agent authoring 硬要求，字数是软预算。能清楚压成五或六位就不增长；如果压缩会把正常词变成难念 token，则保留更清楚的七或八位。宁可 `AICost`，不要为了五位写成 `AICst`。
- 第一块 `SUBJECT` 是对象/领域，第二块 `MOVE` 是该页的角度、判断或叙事动作。单独的 `PAIN`、`CASE`、`PLAN` 只描述页型或名词类别，信息不足，不作为新 ID。
- 两块都必须可独立辨认，且至少一块必须是可直接念出的正常短词；禁止为了凑长度制造纯辅音缩写或伪随机码，例如 `UXPn5`、`AICst`。JS 只证明 ASCII/BlockCase syntax、长度和冲突，不能假装证明词义或可读性。
- Agent 按页面较稳定的叙事职责命名一次，而不是从当前 TITLE 机械抽首字母。例如 `AICost` 表达 Image2 成本，`WebWin` 表达 HTML 优势。
- 正式 `slide_id` 就使用无连字符的 `BlockCase`：已知缩写保持大写，普通词首字母大写，例如 `UXGap`、`AICost`、`WebWin`。它同时出现在源 Markdown、`slide_plan.json`、manifest key 和用户界面中；五个字母里没有一个浪费在分隔符上，大小写让人眼立刻看出两块。
- 程序不把大小写当唯一性基础，而是为 selector 另算 `spoken_key`：去掉 `@`、连字符和空格后转小写，例如 `UXGap -> uxgap`。语音输入用自然停顿说成“UX gap”；正式 ID 和多种口述/键入形式通过 spoken key 匹配。
- 重名时重新选择 SUBJECT 或 MOVE，使两块仍有语义区分；不得附加当前页码或随机字符。
- Validator 拒绝会与选择/编辑语法混淆的保留词，例如 `all`、`first`、`last`、`before`、`after`，并对同一 deck 中读音或拼写过近的呼号给出改名警告。
- Validator 还必须保证 spoken key 唯一：将 ID 去掉 `@`、连字符、空格并转小写后不得冲突。例如正式 ID `UXGap` 的 spoken key 是 `uxgap`；这保证语音转写成连续字符串后仍只有一个页面命中。
- 生成器扫描该 deck 的全部 `3_versions/v*/slide-specifications*.md`，碰到任何历史 ID 都重试，因而已删除 ID 也不会被再次分配。
- 用户不需要念 `@`，也不应被要求逐字母拼随机码；可以直接说“UX gap 那页”或“把 ID fix 放到 AI cost 后面”。
- ID 不包含当前序号、版本号、render engine 或文件路径。

单个名词不是好 ID，原因有四个：deck 内会重复、只能表达一个维度、在口语中容易被当作普通句子而非页面引用、也缺少第二块语义带来的听写校验。双语义呼号提供冗余：用户和 Agent 同时听到“对象 + 角度”，更容易确定是哪一页。

标题本身提供细节，ID 只保留耐久的两层叙事记忆点。标题润色不会自动重命名 ID；如果页面职责彻底变化或旧呼号确实误导，走显式、可审计的 ID rename/migration，不在普通编辑中暗改。

### 2. `position`: 当前顺序

- 1-based，由 `slide-specifications.md` 中 slide block 的物理顺序派生。
- Markdown heading 中保留两位数显示，便于人扫描和直接说“第几页”。
- 每次结构编辑后统一正规化为 `01..N`。
- `position` 可以进入 `slide_plan.json`、contact sheet 标签和日志，但不得进入昂贵渲染产物的 identity/fingerprint。

### 3. `slide selector`: 一次交互中的引用

支持三种用户写法：

| 写法 | 含义 | 生命周期 |
|------|------|----------|
| `7` / `p7` / “第 7 页” | 当前 run-dir 快照中的 position 7 | 只在本次解析快照内稳定 |
| `UXGap` / `@UXGap` / “UX gap 那页” | 双语义稳定 slide ID | 跨重排、跨版本稳定 |
| 唯一标题片段 | 便利选择器 | 只有唯一命中时可用，否则 fail loud |

旧 `s07_problem` 仍作为 exact legacy ID 接受；新实现不再把 `s07` 猜成永久页序。

语音输入不要求转写结果保留 `@`、大小写或连字符。Resolver 将 `UX gap`、`UXGap`、`uxgap`、`ux-gap`、`@UXGap` 归一到正式 ID `UXGap`；用户说中文语义如“用户缺口那页”时，Agent 可以结合两个语义块、TITLE 和叙事职责解析。若有多个候选则展示 `position + ID + title` 让用户确认，不默猜。

### 4. 当前页引用: 组合展示，不是组合主键

```text
07 · UXGap · Why the old workflow breaks
^^   ^^^^^   ^^^^^^^^^^^^^^^^^^^^^^^^^^^
页序  双语义ID             当前标题
```

这正是“序号 + ID”的用户体验，但三个显示部分各司其职。

## 源文件形态

沿用现有 heading，不额外发明第二份 order 文件：

```markdown
## Slide 07: `UXGap`

**TITLE**: Why the old workflow breaks
```

移动到第 3 页后：

```markdown
## Slide 03: `UXGap`

**TITLE**: Why the old workflow breaks
```

变化的是 block 位置和 heading 中的 `03`；`UXGap` 以及该页的内容、渲染指纹和 review identity 均不变。

新 deck 在 frontmatter 声明：

```yaml
identity:
  scheme: mnemonic-v1
```

这个 marker 断言整份 source 的当前 ID 都符合 mnemonic syntax。Markerless legacy deck 继续可读；在 legacy deck 插入的新 ID 仍单独严格校验，但只要 retained legacy ID 尚未显式迁移，就不能自动写入这个全册 marker。

### 权威与校验

- slide block 的物理顺序是 order SSOT。
- heading 里的数字是人类可读投影，必须与物理顺序一致且连续。
- Stage 1 发现重复 ID、重复/跳号、heading 序号与实际位置不符时 SHALL fail loud，并给出 `ppt_flow slides normalize` 修复命令。
- 生产 Stage 1 不应悄悄改源；正规化由显式的 source-edit 命令完成。
- 当前 duplicate slide ID 只是 WARNING，必须升级为 ERROR。否则所有按 ID 寻址的能力都不可靠。

## 用户 UX

### 日常对话不增加负担

用户仍然可以说：

```text
把第 7 页挪到第 3 页后面。
删掉第 5 页和第 11 页。
把 UX gap 那页的标题再收紧一点。
把 ID fix 放到 AI cost 后面。
```

Agent 负责把自然语言翻译为稳定 ID 操作。用户不需要维护 ID，也不需要手工给后续几十页改号，更不需要念随机字符串。

### CLI 表面

推荐在 `ppt_flow` 下提供一组小而清楚的命令：

```bash
# 查看当前“页序 + 稳定 ID + 标题”
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs slides list <run-dir>

# 只修复 heading 序号，不改 block 顺序或 ID
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs slides normalize <run-dir>

# 单动作便利入口；不带 --apply 时只输出 before/after + 影响范围
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs slides move <run-dir> 7 --after 3
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs slides delete <run-dir> 5 11
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs slides insert <run-dir> --after 3 --source <slide-block.md>

# Agent 在用户确认预览后提交同一份 plan hash；自动创建 vNext
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs slides move <run-dir> 7 --after 3 --apply --plan-sha256 <preview-hash>
```

结构命令不带 `--apply` 时绝不写文件；preview 返回 canonical `plan_sha256`，Agent 内部保留，用户不需要念或输入。Apply 必须同时携带这个 hash，裸 `--apply` 不得现场重规划并直接提交。结构 apply 默认走 Structural Versioning Path，创建 `v{n+1}`。MVP 不提供静默 in-place structural edit。`normalize --apply` 是唯一 current-version 例外，但同样绑定已确认 preview。

复杂的多动作指令由 Agent 生成一个结构化 edit plan，再交给同一深模块一次性执行：

```json
{
  "schema_version": 1,
  "base_spec_sha256": "...",
  "bindings": [
    { "token": "7", "slide_id": "IDFix", "position": 7, "matched_by": "position" }
  ],
  "operations": [
    { "op": "move", "slide_id": "IDFix", "after_id": "AICost" },
    { "op": "delete", "slide_id": "UXGap" }
  ],
  "plan_sha256": "..."
}
```

用户不需要编辑这个 JSON；它是 natural-language controller 和 source editor 之间的事务格式。
如果需要把 transaction 暂存到磁盘，只能放在版本的 `_scratch/`，不能成为第二份顺序 SSOT。

### 所有位置选择器采用 snapshot 语义

“删第 3、7 页”必须这样执行：

```text
旧顺序快照: p3 -> UXGap, p7 -> AICost
一次性操作: delete UXGap, AICost
然后才生成新顺序
```

绝不能先删第 3 页，再拿已经 shift 的新顺序解析“第 7 页”。同一 edit plan 中所有 position selector 必须在修改前统一解析。

### 每次编辑都返回可核对的 receipt

```text
Created: v3
Moved:   p7 IDFix -> p4
Deleted: p11 UXGap
Retained render artifacts: Image2 15/15, HTML 15/15
Needs render: 0
Will rebuild: slide_plan, contact sheet, PPTX, speaker notes
Review: Block Map contains page-number text that may need a content edit
```

这份回执让用户继续说页码，同时也把稳定 ID 暴露出来供跨版本引用。

## 结构编辑事务

建立一个 `slide_document` 深模块，集中隐藏 Markdown 拆分、selector 解析、重排、正规化和引用更新。CLI 与测试都只通过这个模块的 interface 工作，不在多个命令里各写一套正则和重编号逻辑。

模块至少需要保证：

1. 解析 `frontmatter + preamble + slide blocks + epilogue`，完整保留未编辑文本。
2. 不把最后一张 slide 后面的 `## Change Log` 错当成最后一页 body。
3. 所有 selector 先针对同一 base snapshot 解析为 ID。
4. 同时通过 `base_spec_sha256` 和 canonical `plan_sha256` 绑定 source 与用户看过的 transaction；源或计划变化都拒绝 apply，不自动 rebase/replan。
5. 校验 final ID set、唯一性、插入 ID、删除 ID、最终 order 和连续 position。
6. 自动更新机器可判定的 ID 引用，例如 `render.header-lock`：删页移除、ID migration 时映射。
7. 不对 Block Map、speaker note 或正文里的自然语言“第 7 页”做盲目字符串替换；扫描并列为 review warning，由 Agent 语义更新。
8. 在 `3_versions/` 下 hidden sibling staging 构造并校验完整 target，最后一次 same-parent rename 才发布可见 vNext；失败不留下空或半写版本。

推荐的核心 interface 是“提交一个完整事务”，而不是让调用方按步骤操作内部状态：

```js
planSlideEdit(document, requestedOperations) -> editTransaction
applySlideEdit(editTransaction, targetVersion) -> editReceipt
```

`move/delete/insert/normalize` CLI 只是构造同一种 transaction 的 adapter。

## 管线解耦

### `slide_plan.json`

Stage 1 输出显式 position，但数组顺序仍是组装顺序：

```json
{
  "slides": [
    {
      "position": 1,
      "id": "DeckGo",
      "headline": "Opening claim"
    },
    {
      "position": 2,
      "id": "UXGap",
      "headline": "Why the old workflow breaks"
    }
  ]
}
```

所有 consumer 按数组/position 决定顺序，按 ID 关联页面内容和产物。

### 昂贵产物按 ID 寻址

新的 Image2 raw image、HTML render、header-locked image、provenance 与 review evidence 均以 `slide_id` 为第一身份。position 不进入其文件 identity 或内容 fingerprint；`artifact_kind` 防止同 engine 的 raw/final 互相覆盖。

```text
逻辑 artifact key:
  (slide_id, render_engine, artifact_kind, fingerprint)

物理文件（由 engine adapter 写入、由 manifest 精确登记）:
  page_images_full/<slide_id>.png       # Image2 现有目录角色保留
  <html-output-subdir>/<slide_id>.png   # HTML 路径由 dual-render change 定稿

便宜、可重建的人类视图:
  page_prompts/07--<slide_id>.prompt.md
  contact sheet label: 07 · UXGap
  PPTX slide order
```

为了兼容旧 deck，读侧暂时定位 `NN_<legacy-id>.png`；新写侧逐步改为稳定 ID 文件名。Resolver 必须区分 provenance/bytes 完整的 `verified` 与只能找到路径的 `legacy-located`，后者不能直接作为 current cache 或进入 Stage 4。Stage 3/4 最终通过 manifest/plan 明确解析，不再靠目录 glob 猜测。身份计划只规定逻辑 artifact key，不替 dual-render change 决定 HTML 的物理目录。

### 失效规则

| 改动 | Image2 / HTML render | Header-lock | PPTX | Notes |
|------|----------------------|-------------|------|-------|
| 仅移动页面 | verified raw materialize | target 本地重跑 | 重组 | 按新顺序重注入 |
| 删除页面 | 其余 verified raw materialize | target 本地重跑 | 重组 | 按新顺序重注入 |
| 插入新页面 | 先报新 ID `needs_render`；授权后只渲染它 | target 本地处理 | 重组 | 全册按 ID 对齐后注入 |
| 同时改某页内容 | 仅该 ID 按现有 fingerprint 规则失效 | 按 ownership 刷新 | 重组 | 相关 notes 更新后重注入 |
| 仅切换 engine | 只补目标 engine 缺失的 variant | 依目标产物处理 | 重组 | 不因 engine 改变内容身份 |

Structural Versioning Path 仍保留，但只自动 materialize 经 manifest kind/engine/fingerprint/profile + bytes SHA 证明的昂贵 raw render。Stage 3、contact sheet/QA、PPTX、notes 等便宜产物在 target 本地重跑。结构 apply/materialization 零远端调用；无法证明的 ID 只报告 `needs_render`，由后续显式 Generated Image Rebuild 授权。这里的“复用”是管线自动 materialize，不是人工拷贝或手改 `_generated/`。

### Notes 由 ID 对齐后再按位置写入

Stage 5 应把 Markdown notes 解析为 `{slide_id, note}`，与当前 `slide_plan` 做 exact ID-set 校验，再按 plan order 注入 PPTX position。这样删除一页不会让剩余 notes 靠“数量刚好一致”而错配。

## 与 dual-render-pipeline 的合流点

双渲染不拥有页面身份，它消费这份计划定义的稳定 slide model：

```text
slide-specifications.md
        |
        v
  slide_id + position + content
        |
        +-------------------+
        |                   |
        v                   v
 Image2 adapter        HTML adapter
        |                   |
        v                   v
 artifact(slide_id, image2) artifact(slide_id, html)
        |                   |
        +---------+---------+
                  v
        build follows current position
```

双渲染的 artifact key 至少是：

```text
(slide_id, render_engine, artifact_kind, fingerprint)
```

不包含 position。build 时根据当前 plan 顺序和每页 resolved engine 选择对应 artifact；同一页两种 engine 可以共存，不互相覆盖。

因此实施顺序建议为：

1. 先落 stable identity + order editing + ID-keyed artifact resolution。
2. 再让 dual render 的两个 adapter 接入同一个 render-artifact interface。
3. 最后增加 mixed deck / sequential / parallel 等策略；这些策略不得反向污染 slide ID。

两个主题可以在设计阶段一起审，但不建议塞进同一个超大 OpenSpec change。

## 备选方案与取舍

| 方案 | 结论 | 原因 |
|------|------|------|
| 继续用 `s07_problem` 并全量重命名 | 不选 | 每次重排都会制造 identity churn 和缓存/evidence 迁移 |
| 完全去掉可见页序 | 不选 | 人工打磨时“第几页”是最低摩擦的共同语言 |
| 随机短码，如 `k7m2qp` | 不选 | 机器唯一但人念不出、记不住，尤其破坏语音交互 |
| 单名词呼号，如 `PAIN` / `CASE` | 不选 | 只有一个语义维度，容易重复，也容易在口语中失去页面引用特征 |
| 固定死 5–6 字母 | 不选 | 五六位是优先预算，不是压坏正常词的理由；必要时清楚的七八位优于难念压缩 |
| 把 `07_UXGap` 作为一个复合 ID | 不选 | 序号变化仍等于主键变化，只是换了写法 |
| 从当前 TITLE 机械生成首字母 | 不选 | 标题频繁润色会制造改 ID 的冲动；呼号应来自更耐久的叙事职责 |
| 用 10/20/30 或 LexoRank 避免重编号 | 不选 | 这是多人并发排序问题的解法；当前单 Agent 文档会增加不必要复杂度，最终展示页码仍要重算 |
| 优先 5–6、合法 5–8 字母的双语义 stable ID + derived position | 采用 | 短 ID 保持轻巧，7–8 位提供有限语义逃生口；两块共同表达“对象 + 角度” |

## 兼容与迁移

### 旧 deck

- 任意现有且唯一的 ID 先按 stable ID 对待，即使它长得像 `s07_problem`。
- 普通 move/delete 不静默改 legacy ID，避免一次结构编辑顺带使全部 provenance 失效。
- UI 显示 `11 · S07-PROBLEM (legacy)`，明确前缀只是历史名称，不再代表当前页序。
- 读侧继续接受旧 `NN_<id>.png`；新版本逐步写稳定路径。

### 新 deck

- scaffold/template/Agent 根据叙事职责生成双语义 mnemonic ID；优先 5–6 字母、必要时 7–8 字母，不再生成单名词、带序号或随机字符的 ID；新 deck 写入 `identity.scheme: mnemonic-v1`。
- `slides list` 始终同时展示 position、BlockCase mnemonic ID 和 title。

### 可选迁移

后续提供显式 `slides migrate-ids`：创建新版本、输出 old -> new mapping、更新结构化引用，并仅在内容 fingerprint 与 bytes 校验通过时迁移 artifacts/evidence。迁移绝不作为普通 reorder 的隐藏副作用。

## 实施计划

### Phase 0: OpenSpec 设计冻结

- 新增 capability `slide-identity-and-ordering`。
- 明确 `slide_id`、`position`、selector、edit transaction、artifact key 的规范。
- 同步 delta 到 `content-parsing`、`pipeline-orchestration`、`image-generation`、`header-lock`、`pptx-assembly`、`notes-injection`、`run-bundle-management`、`cli-surface`、`node-specification`。
- CLI 实施前按 repo 路由先读 `cli-surface` 和 `node-specification` 的 main spec/active delta，并复用 `cli_error.mjs`。

### Phase 1: `slide_document` 模型与 contract tests

- 将 heading parser 提升为唯一共享的结构化 slide-document parser。
- 捕获 heading position、stable ID、preamble、epilogue 和原始 block bytes。
- 增加 mnemonic ID validator/reservation：验证正式 BlockCase ID 的 ASCII/两块 syntax、总长 5–8 字母；为 selector 计算忽略空格/连字符/大小写/`@` 的 spoken key，并强制其唯一；扫描全部 deck version，防止历史 ID 复用，拒绝命令保留词，提示语音近似冲突。语义命名与可口述判断由 Agent 完成，validator 不随机造词，也不为了五位截断正常词。
- duplicate ID 从 WARNING 升为 ERROR。
- 加连续 position 校验与纯 `normalize` serializer。
- 保持 Stage 1 多输入解析兼容；MVP 的结构编辑 CLI 只修改 run-dir 中唯一 canonical spec。

### Phase 2: 只读 identity UX

- 扩展 selector resolver：current position、双块 mnemonic/`@mnemonic`、exact legacy ID、唯一标题片段，并容忍语音转写丢失 `@`、大小写或连字符。
- 增加 `ppt_flow slides list/resolve/normalize`。
- `status`、pilot、refresh 和错误提示统一显示 `pN + BlockCase ID + title`。
- 同一批 selector 统一 snapshot resolution。

### Phase 3: 产物按 ID 寻址

- Stage 1 的昂贵输出名不再含 position；cheap prompt view 可继续含 position。
- 引入/加深 render artifact registry，读侧保留旧文件名 adapter。
- Stage 2 provenance、Stage 3 header output、header review 全部以 stable ID 为 key。
- Stage 4 通过 plan + registry 取图，不通过 glob 推断身份。
- position 明确排除出 generation fingerprint。

### Phase 4: 安全的结构编辑事务

- `move/delete/insert/apply-plan` 编译成同一个 transaction。
- 默认 dry-run preview；apply 创建 vNext 并 atomic 写源。
- 自动正规化 headings、维护 `render.header-lock` 等结构化引用。
- 输出 before/after、ID mapping、人工 review warnings 和 refresh impact。

### Phase 5: 最小刷新与跨版本复用

- 对同 ID 比较 generation fingerprint/profile/bytes。
- 只将验证通过的上一版本昂贵 raw render 与 verified per-slide approval 自动 materialize 到新版本；waiver 和 cheap final 不跨版复制。
- structural apply/materialization 一律跳过远端渲染；insert 先报告新 ID `needs_render`，再由显式 refresh 只渲染已授权 ID。
- Stage 4 重组 PPTX；Stage 5 按 ID 对齐 notes 后重新注入。

### Phase 6: 模板、迁移和端到端收口

- 新 deck 模板改用 canonical stable ID。
- 更新 restructure playbook、iteration workflow、change classifier、AGENT_CONTRACT 和命令文档。
- 增加 explicit legacy migration，但不自动触发。
- 跑全量 tests + structural E2E。

## 验收矩阵

### Identity

- [ ] 把 p7 移到 p3 后，stable ID 不变。
- [ ] 标题改写不改变 stable ID。
- [ ] duplicate/empty ID 在 Stage 1 前 fail loud。
- [ ] 新 ID 不含 position/version/engine。
- [ ] 新 ID 必须含 SUBJECT + MOVE 两个可辨认语义块，不接受单名词页型 ID。
- [ ] 新 ID 合法 5–8 个字母、优先 5–6；两块均可辨认且至少一块是可念短词，不生成纯辅音缩写或随机短码。
- [ ] 重名消歧通过替换其中一个语义块完成，不使用当前页码或随机 suffix。
- [ ] 命令保留词不能成为 ID；读音/拼写近似的 deck 内 ID 会触发警告。
- [ ] 去掉大小写、空格、连字符后的 spoken key 在 deck 历史内唯一，连续语音转写不会命中两页。
- [ ] 已删除页面的历史 ID 不会分配给新页面。

### Sequence UX

- [ ] `slides list` 一眼能看到 `position + BlockCase ID + title`。
- [ ] “把 ID fix 放到 AI cost 后面”无需念 `@`、无需逐字母拼读即可解析。
- [ ] `UX gap`、`UXGap`、`uxgap`、`ux-gap`、`@UXGap` 解析为正式 ID `UXGap`；多个中文语义候选时 fail loud 并要求确认。
- [ ] `normalize` 只改错误序号，不改 block body/ID/order。
- [ ] “删第 3、7 页”按旧快照删除正确两张。
- [ ] dry-run 的 after order 与 apply 结果完全一致。
- [ ] base source 或 canonical plan hash 在 dry-run 后变化时 apply 拒绝执行；裸 `--apply` 也拒绝。

### Pipeline correctness

- [ ] reorder-only 不改变 Image2 generation fingerprint。
- [ ] reorder-only 不发起 Image2/HTML 远端渲染调用。
- [ ] Stage 4 输出严格等于新 plan 顺序。
- [ ] Stage 5 先做 exact ID-set match，删除中间页后 notes 不 shift。
- [ ] 删除页不会在新版本被组装，但旧版本仍完整保留。
- [ ] 插入一页的结构 apply 零远端调用并报告一个 `needs_render`；显式授权 refresh 后只生成该 ID 的新 raw render。

### Dual render readiness

- [ ] 同一 ID 的 `image2` 与 `html` artifact 可共存。
- [ ] engine switch 不改变 slide ID。
- [ ] build 由 `(slide_id, engine, artifact_kind)` 选产物，由 position 排顺序。
- [ ] mixed deck 重排不会让两种 engine 的产物串页。

### Compatibility

- [ ] legacy `s07_problem` deck 不迁移也能 build/refresh/reorder。
- [ ] 旧 `NN_<id>.png` 可读；新写路径不依赖 position。
- [ ] 显式 migrate 输出可审计 old -> new mapping。

## 风险 / 缓解

| 风险 | 缓解 |
|------|------|
| Markdown 编辑器误吞 epilogue 或破坏格式 | 单一 structured slide-document parser；golden round-trip tests；无改动部分 byte-preserving |
| 人工直接改 ID 导致“同页变新页” | 文档声明 rename = delete + insert；status/impact report 标出 artifact loss；常规命令永不改 ID |
| 5–8 字母双语义呼号重名或语音近似 | 调整 SUBJECT 或 MOVE；优先清楚的五六位，确需时用七八位，不造晦涩压缩；解析歧义时展示 `position + ID + title` 确认 |
| 页面标题变化后呼号不再完全贴切 | 呼号锚定叙事职责而非当前措辞；小改保持，职责彻底变化才显式 rename/migrate |
| legacy ID 带旧序号造成认知冲突 | UI 标 legacy；当前 position 永远单独显示；提供显式迁移而非隐藏迁移 |
| 跨版本复用拿到陈旧图片 | 必须同时验证 stable ID、generation fingerprint/profile 和 image SHA；失败则不复用 |
| Block Map / 正文含自然语言页码 | 扫描并给 review warning；Agent 语义更新，不做盲目全局替换 |
| 一次 change 范围过大 | identity/order change 先落；dual-render 作为下游独立 change 接口化接入 |

## Non-Goals

- 不做多人实时协同排序或 CRDT/LexoRank。
- 不把 PowerPoint 自身的内部 slide XML id 当 source identity。
- 不承诺自动理解并重写所有自然语言页码引用。
- 不在 MVP 提供无版本保护的 in-place add/delete/reorder。
- 不在这个 change 实现 HTML renderer；这里只给 dual render 建立稳定输入与 artifact seam。

## 安全层与逃生路径

```text
heading-only current version
  -> same deck clean vNext
  -> reuse unproven: explicit rebuild in vNext
  -> audience/goal/narrative materially changed: recommend a new deck
```

Git 是另一层手段：建议开工时检测并安装，用于 source/control 回滚、diff 和审计；run-bundle `v1/v2` 仍是用户可理解的作品版本，`_generated/` 不进 Git。缺少 Git 不阻断 PPT 创建。具体计划见 `_backlog/todos/todo-optional-git-safety-and-startup-guidance.md`。

## 落地关联

先从本 plan 创建 OpenSpec change：

```text
add-stable-slide-identity-and-order-editing
```

该 change 完成并归档后，再从 `todo-dual-render-pipeline` 创建：

```text
add-dual-render-pipeline
```

后者必须复用稳定 slide model 和 render-artifact interface，不再定义第二套 ID、排序或文件名寻址规则。
