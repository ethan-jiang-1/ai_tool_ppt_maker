# task-trace-suffix-drift

**遇到什么:**
2026-07-15 做 framework sync 时发现：`_generated/page_images_full/` 和 `header_locked/` 下的 image task trace 文件使用 `.apimart-task.json` 后缀，而 framework `bundle_layout.mjs` 定义的 `IMAGE_TRACE_SUFFIX` 是 `.image-task.json`。旧版 image_api_client 写 `.apimart-task.json`，新版写 `.image-task.json`。`2_backbone/visual-style/style_master.apimart-task.json` 直接触发 `bundle_layout --check` 结构违规。

**怎么试的:**
- `style_master.apimart-task.json` 已重命名为 `style_master.image-task.json`（backbone 层，必须合规）
- `_generated/` 内的 `.apimart-task.json` 文件不改动——它们是派生物，下次重跑 Stage 2 自然会被新版 client 写成 `.image-task.json`
- 当前 `_manifest.json` + `state.yaml` header-review evidence 已有合法 SHA256，这批 image 是有效的

**结论:**
backbone/visual-style 层必须用 `.image-task.json`（宪法要求）。`_generated/` 内的旧后缀可以不管，反正重跑就覆盖了。如果下次 Stage 2 重跑后，旧 `.apimart-task.json` 没被自动清理，手工删掉即可。

**下次先看哪:**
`bundle_layout.mjs` 的 `IMAGE_TRACE_SUFFIX` 常量；`image_api_client.mjs` 的输出文件名逻辑。
