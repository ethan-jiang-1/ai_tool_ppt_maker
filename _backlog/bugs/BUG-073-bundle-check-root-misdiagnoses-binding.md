# BUG-073: bundle_layout deck-root check misdiagnoses the Harness binding

> 严重级别: P2 | 发现: 2026-08-19 | 状态: 活跃

## 症状

对现有 deck root 运行 `bundle_layout.mjs --check <deck-root>` 时，CLI 返回
`harness_binding_invalid`，提示 `RUN_BUNDLE.md` 无法验证当前本地 Harness。
同一个 Bundle 通过 locator 的只读解析是 resolved，且使用规范的精确
`3_versions/v1` run-dir 检查后，真实问题是 workflow selection required，而不是
Harness binding。

现场命令：

```text
node ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs --check deck_ai_org_transform_keynote
FAILED: RUN_BUNDLE.md does not verify this Deck's exact local PPT Maker Harness identity.
```

实际 locator 结果：

```text
deckDir: /Users/bowhead/ai_tool_ppt_maker/deck_ai_org_transform_keynote
harnessDir: /Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness
```

## 根因

`--check` 的公开语义要求精确 `3_versions/vN` run-dir，但传入 deck root 时，校验路径
没有先返回明确的 usage/target-shape 错误，而进入了 binding 诊断分支，产生了与真实
问题无关的 Harness binding failure。

## 复现

1. 在仓库根目录运行：
   `node ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs --check deck_ai_org_transform_keynote`
2. 观察错误类别为 `harness_binding_invalid`。
3. 再运行：
   `node ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs --check deck_ai_org_transform_keynote/3_versions/v1`
4. 观察真实的 source/layout 诊断。

## 修复关联

待拆为 Harness CLI validation follow-up：对 `--check` 的 target shape 做前置校验，
deck root 输入应发出明确的 usage/expected-run-dir 诊断，不得伪装成 Harness binding failure。
