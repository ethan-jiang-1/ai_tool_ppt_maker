# Plan: 版本级「打磨轨迹」目录（version-local polish/journal directory）

> 类型: 设计 | 更新: 2026-08-16 | 状态: 待 OpenSpec change 实施

## 一句话

run-bundle 宪法里，version root 只允许 `slide-specifications*.md` / `overrides/` / `_generated/` / `_scratch/` / `README.md` 五样。但一个版本在**长期打磨（polish）**过程中产生的、**给人读的、版本私有的**轨迹/决策记录，没有落点——`_scratch/` 语义是"临时/可删"，`_lessons/` 在 deck 根（跨版本共享），`history.jsonl` 是机器 hash。本计划要新增一个 version root 白名单目录（暂名 `_polish/`），专门承载"本版本的打磨轨迹"。

## 为什么需要 / 意义 / 目的

### 1. 打磨是版本级、持续迭代的活动，它的轨迹该留在版本内

一个版本（v8）不是一次性生成，而是反复打磨：style master 重选、source 推进、每页文案/视觉迭代、决策取舍。这些是**这个版本自己的历史**，天然应该跟这个版本走——v9 是另一次设计迭代，不需要继承 v8 的打磨过程。放到 deck 根的 `_lessons/`（跨版本）不合理：那会让 v8 的轨迹污染全局，也不符合 `_lessons/` 的定位（"可复用教训"，不是"某版本的流水账"）。

### 2. 现有的记录对「人」不可用

| 现有落点 | 是什么 | 为什么不够 |
|---|---|---|
| `_state/history.jsonl` | 机器事件日志（`style_master_selection_recorded`、`source_epoch_advanced`…） | 全是 `selection_sha256: 9f9a203…`，对人几乎不可读 |
| `1_upstream_raw_material/page-image-style-master-iterations/` 等 | 不可变候选历史（plan/candidate/attempt/review-decision JSON） | 机器 provenance，不是叙事 |
| `_lessons/` | 跨版本可复用教训（"先读再猜"） | 在 deck 根、跨版本共享；不是版本私有轨迹 |

**缺口**：缺一个"人话叙事层"——"这一版磨了啥、为什么磨、磨到哪了、还差什么"，用 MD 写、人在 v8 里一眼能读到。

### 3. `_scratch/` 名字与语义都不对

`_scratch/` 在宪法里是"本版最松的官方出口"，但它的语义写死为**临时/bak/可删**（"不是真相源，可随时删"）。把一条**持久的打磨轨迹**塞进 `_scratch/polish/`，语义上自相矛盾，而且 `_scratch` 这个名字会误导后续 Agent/人把它当垃圾场随手清掉。需要一个**名字就表达"这是本版本持久的人读记录"**的目录。

### 4. 现状是硬阻塞，不是偏好问题

version root 是硬白名单。实测 `3_versions/v8/_polish/` 会触发 `bundle_layout --check`：

```
unexpected '_polish' at version root — not part of the canonical structure.
A version holds only: slide-specifications.md, overrides/, _generated/, _scratch/, README.md.
... Do not improvise.
```

这不是"换个名字绕过去"能解决的（`_ignorable()` 只放过点开头文件和 `__pycache__`），必须动 harness 宪法本身。

## 背景 / 现状

- **触发场景**：`deck_ai_sdlc_keynote` v8 由另一 Agent 长期打磨（source_epoch 已到 5、style master 重选 10 次）。owner 想给这段打磨过程留一条人读轨迹，但发现无处安放。
- **机器权威**：run-bundle 目录结构由 `ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs` 定义：
  - `VERSION_SUBDIRS = [overrides, _generated, _scratch]`（~L363-371）
  - `checkBundle()` 的 version root 白名单校验（~L1000-1010）——五样之外一律 `unexpected ... at version root`
  - `SCRATCH_DIR_README` 模板（~L374-392）
  - `renderTree()` 树文本（`bundle_layout.mjs --check` 打印的目录宪法）
- **spec 权威**：`openspec/specs/run-bundle-layout/spec.md`，核心条款（L11）：

  > a version dir admits source + `overrides/` + `_generated/` + `_scratch/`; `_scratch/` internals are not filename-whitelisted.

- **相关但不同的能力**：`run-bundle-management`（CLI scaffold/validate 行为）、`lessons-management`（`_lessons/`）、`harness-directory-layout`（harness 侧，不 merge）。

## 决策 / 方案

### 推荐：在 version root 白名单新增一个版本级、非管线、人读目录

- 目录名候选（需在 change 里定稿）：`_polish/`（贴合"打磨"语义）｜ `_notes/`（更通用的人读记录）｜ `_journal/`（时间线叙事）。**本计划倾向 `_polish/`**，理由：它精确命名了"打磨轨迹"这一用途，且与 `_scratch/`（临时）、`_lessons/`（教训）在语义上互斥清晰。
- 该目录的属性（与 `_scratch/` 对齐）：
  1. **版本私有**：`--new-version` 只拷 `slide-specifications.md` + `overrides/`，**不拷**它——轨迹不泄漏到 v9。
  2. **非管线**：不参与任何生成/校验，不是生产真相源（和 `_scratch/` 一致）。
  3. **内部不校验**：最松层，MD 为主，可自由组织（README.md + 若干 `.md`）。
  4. **人读优先**：约定以 Markdown 叙事为主，禁止塞 JSON/hash 当唯一记录。

### 需要落地的改动面

| 区域 | 改动 |
|---|---|
| `bundle_layout.mjs` | 新增 `POLISH_SUBDIR` 常量；加入 `VERSION_SUBDIRS`；version root 校验白名单加一项；新增 `POLISH_DIR_README` 模板；`renderTree()` 树文本加一行 |
| `openspec/specs/run-bundle-layout/spec.md` | 把"a version dir admits source + overrides + _generated + _scratch"扩展为含新目录；新增 scenario（结构梯度、--new-version 不拷贝、与 _scratch/_lessons 边界） |
| `reference/glossary.md` Where Map | 加一行 term → canonical path（例如 `_polish/` = "本版本打磨轨迹，人读，非管线，不跨版本"） |
| `run-bundle-management` | 若 `--check`/scaffold 逻辑对 version root 有额外假设，同步 |
| 测试 | `tests/` 下 run-bundle-layout 相关：新目录被识别、`_scratch/` 仍被识别、`--new-version` 不拷贝新目录、边界负例（`_tmp/` 等仍拒绝） |

### 备选（已否决）

- **塞进 `_scratch/polish/`**：不违反宪法（`_scratch/` 内部最松），但语义错位——把持久轨迹放进"临时/可删"桶，名字误导，且会被当作垃圾场对待。这是"现状能做的权宜"，不是正确设计。
- **塞进 `_lessons/`**：`_lessons/` 是跨版本可复用教训，且 `_lessons/README` 禁止 free-form 日记（一题一文、四问）。版本级流水账不该进全局教训层。
- **塞进 `overrides/`**：`overrides/` 语义是"这一版偏离 backbone 的视觉/讲稿"，跟"打磨轨迹"无关，塞进去污染 override 语义。
- **不建目录，只用 `history.jsonl`**：机器可读、人不可用，正是要补的缺口。

## 风险 / 取舍

- [命名 `_polish` vs `_notes` vs `_journal`] → 在 OpenSpec change 的 proposal/design 里定稿；命名要能概括"版本级人读轨迹"，避免未来又冒出 `_history/` `_log/` 等新目录。建议用 `_polish/` 并把语义写死进 spec，防止泛化。
- [与 `_scratch/` 的边界混淆] → 两个 README 都要写清：**临时/bak/一次性 → `_scratch/`；持久的人读打磨轨迹/决策 → `_polish/`**。
- [与 `_lessons/` 的边界混淆] → `_lessons/` 是"跨版本可复用教训"，`_polish/` 是"本版本私有轨迹"；spec + Where Map 写清，避免重复记录。
- [影响所有 deck，不是单 deck 事] → 这是 harness 级目录语义扩展，必须走 OpenSpec change（`openspec/changes/`），不能手改 `bundle_layout.mjs` 或单 deck 特殊处理。
- [兼容性] → 已有 deck 的 `--check` 不能因新增目录而误报；新目录应是"可缺省"（无 `_polish/` 也合法），`--new-version` 不自动生成它、也不拷它。
- [过度设计风险] → 若后续发现"版本级人读记录"其实和 `_lessons/` 高度重叠，需在 change design 阶段评估是否真的需要独立目录，还是改进 `_lessons/` 定位。当前判断：轨迹（流水账/时间线）与教训（可复用结论）是两类东西，值得分开。

## 落地关联

- **capability**：`run-bundle-layout`（`openspec/specs/run-bundle-layout/spec.md`），连带 `run-bundle-management`（CLI scaffold/validate）与 Where Map（`reference/glossary.md`）。
- **机器权威**：`ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs`。
- **实施路径**：OpenSpec change（建议名 `add-version-local-polish-directory`），按 OpenSpec 流程 proposal → design → delta specs → tasks → 实施 → strict validation，不直接改代码。
- **与现有 change 的关系**：独立于 `provider-prompt-length-budget.md`（那是 image-generation 的 prompt 边界），本计划是 run-bundle-layout 的目录本体扩展，两者不交叉。

### 验收标准（可执行）

1. `bundle_layout.mjs --check` 对含 `_polish/` 的 version dir 报 `OK`，不再 `unexpected '_polish'`。
2. `_polish/` 缺省（version 里没有它）时 `--check` 仍通过（可缺省，不强制）。
3. `--new-version v8 → v9` 时，`_polish/` 内容**不**被拷贝（版本私有），`_scratch/` 行为保持不变。
4. version root 白名单仍拒绝 `_tmp/` / `backup/` / `_bak/` / 任意新目录（负例回归）。
5. `renderTree()` 树文本 + `reference/glossary.md` Where Map 都新增该目录的 canonical 条目，且语义写明"版本私有 / 人读 / 非管线 / 不跨版本"。
6. 不修改任何 `deck_*` 生产数据；`deck_ai_sdlc_keynote/v8` 仅作为验证样本。
