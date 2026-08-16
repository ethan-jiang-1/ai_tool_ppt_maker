# BUG-067: Style Master 将 visual-language 配置错误掩盖成 lifecycle inspect 自循环

> 严重级别: P1 | 发现: 2026-08-16 | 状态: 活跃

## 症状

在 `deck_ai_sdlc_keynote/3_versions/v8` 的 Pure 调优中，为开场/转场/结束页新增
`compositions.title-pause` 后，provider clause 曾包含以下内容片段：

```text
... beneath the centered title stack; ... cards, labels, arrows, or diagram
```

它违反了 visual-language 的内容中立约束：`title`、`labels` 是
`PAGE_IMAGE_VISUAL_CLAUSE_FORBIDDEN_CONTENT_TOKENS` 中的保留词。直接解析时，
`resolvePureStyleMasterScope()` 给出结构化事实：

```text
PageImageVisualLanguageError
compositions.title-pause.provider_clause: must not prescribe source content token "title"
```

但两个公开 Style Master 入口都将同一错误改写为：

```text
FAILED: The current Style Master lifecycle record is stale, incomplete, or inconsistent.
Next: Inspect the current Style Master owner projection, then follow its exact next action.
```

该 next action 正是已失败的 `style-master inspect` 本身，因此形成不可前进的自循环；没有
path、违反的 token、source/config owner 或可执行的 source 修复动作。此时尚未发生 provider
调用、授权、source epoch、raw plan 或 evidence mutation。

## 根因

`ppt_maker_harness/scripts/ppt_flow.mjs` 的 `commandStyleMaster()` 在调用 selected-workflow
`resolveStyleMasterScope()` 时捕获了 `PageImageVisualLanguageError`。该错误的可消费信息在
`issues[]` 中，而不是当前 Style Master mapping 识别的 `style_master_*` code；随后
`styleMasterFailure()` 将它归为泛化的 `style_master_operation_failed`，再进入
`reason.startsWith("style_master_")` 的泛化 `inspect` 分支。

这把 source/configuration 的最早失败原因伪装成 Style Master lifecycle 状态，违反了
Diagnostic Recovery Handoff 的“消费 producer-issued failure、给出最近合法动作”约束。

相关路径：

- `ppt_maker_harness/scripts/02-visual-system/internal/page_image_visual_language.mjs`
  - `normalizePageImageVisualClause()` 和 `PageImageVisualLanguageError.issues`
- `ppt_maker_harness/scripts/ppt_flow.mjs`
  - `commandStyleMaster()`
  - `styleMasterFailure()` 的泛化 `style_master_*` mapping

## 复现

在临时 Page Image run 或测试 fixture 的 visual-language registry 中加入以下 invalid clause，
不要在 production deck 上保留该输入：

```yaml
compositions:
  title-pause:
    provider_clause: one small etching beneath the centered title stack, no labels
    workflows: [framed, pure]
    min_motifs: 0
    max_motifs: 1
```

然后运行：

```bash
node ppt_maker_harness/scripts/ppt_flow.mjs style-master inspect <run-dir>
node ppt_maker_harness/scripts/ppt_flow.mjs style-master plan <run-dir> --candidate-count 0
```

两条命令目前均 exit 1，且将 typed source error 改写为泛化 lifecycle error，并把
`style-master inspect <run-dir>` 回送为自己的下一步。直接调用 selected Pure resolver 则可
观察到原始 `PageImageVisualLanguageError` 和 `issues[0].path`。

期望行为：两个 CLI producer 都应保留受限的 source/configuration failure 分类、registry path
和违规 token，并给出一次 source repair 后重跑同一 checkpoint 的动作；不得报告 internal、
不得 self-loop、不得暗示 Style Master/provider work 已开始。

## 修复关联

本轮现场登记，不修复。建议后续以一个仅覆盖 producer diagnostic preservation 的 OpenSpec
change 处理，并在 Style Master inspect/plan 的 fixture 中覆盖 typed visual-language failure、
无 provider side effect、以及非 self-referential next action。
