# BUG-007: state.mjs 的 YAML 不支持数组，`playbook_stack` 往返即坏 → `switchPlaybook`/`resumePlaybook` 崩

> 严重级别: P1 | 发现: 2026-07-11 | 状态: 活跃

## 症状

任何触发 **playbook 切换 / 恢复** 的流程都会崩。临时 deck 实测：

```
createDefaultState()                       → playbook_stack: []   (数组)
writeState(deckDir, s)                      → 磁盘上写成 `playbook_stack:`（空行，无值）
readState(deckDir).playbook_stack           → {}                  ← 空数组被读回成空对象
switchPlaybook(state, "iterate-style")      → ✗ TypeError: state.playbook_stack.push is not a function
```

直接命中本仓库当前 deck（`deck_tmp_ai_sdlc_bpm_keynote`，playbook=`migrate-import`）的**必经路径**：`migrate-import` 的 `reaffirm-gates` step 4 = 「视觉不满意 → `switchPlaybook(iterate-style)`」；`create-deck` 中途进 `iterate-style` 走同一套栈机制。用户一旦说"视觉再调一版"，就会在这里崩。

## 根因

`scripts/lib/state.mjs` 的**手写 YAML 不支持数组往返**：

- `toYaml`：空数组 `[]` → 只输出 `key:\n`（`for..of` 遍历空数组什么都不写）；非空数组且元素是对象 → `'  - ' + obj` = `'  - [object Object]'`（字符串化即坏）。
- `parseYaml`：**根本不解析 `- ` 列表项**；遇到 `key:`（无内联值）一律当嵌套对象 → `playbook_stack` 被读成 `{}`。

于是 `[]` 往返成 `{}`。`switchPlaybook` 里 `if (!state.playbook_stack) state.playbook_stack = []` 判空失效（`{}` 为真值），随即 `.push` 作用在对象上 → TypeError。`resumePlaybook` 同理（`{}.length` 为 `undefined`、`.pop` 不存在）。

**结论：`playbook_stack`（中途切换 / 恢复 playbook）这个已设计的能力，被 state 的 YAML 层从根上打断。** 非空栈（对象数组）会坏得更彻底（`[object Object]` 且不被回读）。

## 复现

见"症状"三行；已用临时 deck 实测复现（write→read→`switchPlaybook`），非推理。

## 契约探针 · 横切

类："`state.mjs` 自造 YAML 与 state schema 的数组字段不兼容"。

- schema 里的数组字段：`playbook_stack`（对象数组，配 `push`/`pop` 使用）。
- `toYaml` / `parseYaml` 都无数组支持：空数组 → 对象；非空数组 → `[object Object]` 且不解析。

**修复方向**：给 state 的 YAML 层加数组支持（序列化 + 解析 `- ` 列表，含对象元素），或对 `playbook_stack` 用 inline JSON / flow-style 并让 parser 认；同时给 `switchPlaybook` / `resumePlaybook` 对"非数组"做防御性归一（`Array.isArray` 检查）。补一条**往返测试**：write→read 后字段类型不变。

## 修复关联

待排期，本卡**只报不修**。建议与"state 健壮性 / YAML round-trip"归一处理（可能牵出 nodes/其它字段的同类隐患）。
