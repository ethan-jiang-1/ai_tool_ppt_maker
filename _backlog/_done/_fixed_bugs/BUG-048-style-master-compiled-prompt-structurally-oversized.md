# BUG-048: Style Master 编译 prompt 结构性过长（全 slide projection digest JSON）超 provider 上限

> 严重级别: P1 | 发现: 2026-08-04 | 状态: 活跃

## 症状

13 页 pure deck 的 Style Master 编译 prompt 为 **10931 字符**，超过 micuapi provider 的
`~4000` 字符上限，被拒绝：

```
{"error":{"message":"Prompt too long (10921 chars, max ~4000)..."}}
```

→ `known_failure`，candidate 生成失败，计划终结，只能 abandon 重来。

## 根因

`style_master_plan.mjs` 的 `compileStyleMasterProviderPrompt` 把 `style_intent` 与
**全部 slide 的 `style_context`** 一起序列化进 provider prompt。而
`styleContextFromCandidate` 对每张 slide 取 `slide.visual_language.projection` —— 该 projection
是 **schema keys + 多个 64 字符 sha256 digest**（`text_guard_digest`、`registry_semantic_digest`、
recipe/composition/motif 各自的 `provider_clause_sha256`），**不含 clause 文本**，结构性 ~660
字符/页。

实测（13 slides）：intent 1571 字符 + style_context 9072 字符 + JSON 样板 ~750 = 10931。

关键点：**压缩 registry 的 provider_clause 文本无法减小 prompt** —— projection 存的是 digest，
不是文本。即便 intent 缩到 0，style_context 仍 ~9072，最小 prompt ~9472，仍超 micuapi 上限。
DUCK 能接受长 prompt 但返回尺寸不对（见 [[BUG-046]]）。

## 复现

```bash
node --env-file=.env PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master plan <run-dir> --candidate-count 2
node --env-file=.env PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master authorize <run-dir> --plan-hash <sha>
# micuapi → known_failure (Prompt too long 10921 chars max ~4000)
```

## 影响面 / 修复方向

- 这是 Style Master 与"prompt 有上限"的 provider 之间的结构性错配。
- 修复方向（B）：`styleContextFromCandidate` 不再嵌入全量 projection digest JSON，改为每 slide
  只带 `slide_id` + 精简摘要（如 recipe/composition/motif 的 clause 文本或一句话），把 prompt
  压到任何主流 provider 上限之内。
- 关联 [[BUG-046]]（尺寸校验是另一半主因）与 [[BUG-051]]（doctor --smoke 测不出这个问题）。
