# BUG-014: HTML 产物文件名为 SHA256 hash，无法按 slide_id 定位

> 严重级别: P1 | 发现: 2026-07-20 | 状态: 活跃

## 症状
`_generated/html_production/html_pages/objects/` 和 `final_slides/objects/` 下的 HTML/PNG
文件全部以 SHA256 hash 命名（如 `a660cf3...69d6.html`）。审阅者打开目录后完全无法知道哪个
文件对应哪页幻灯片——必须去读 `manifest.json` 才能做映射。

每次 review 都要手工查 manifest → 找 hash → 找到文件，这在 25 页 deck 里已经是严重摩擦，
在更大 deck 里不可接受。

## 根因
Content-addressable storage（CAS）设计正确地将 SHA256 作为 immutable object 的主键，
但缺少一个**人类可读的索引层**。manifest.json 有映射（`slide_id → html_sha256`），但没有
被渲染成可点击的 review 入口页。

`_generated/html_production/preview/` 目录存在但 pilot 后未产出 contact sheet 式的
slide_id → 文件导航。

## 复现
1. 跑 `ppt_flow pilot <run-dir>`
2. 打开 `_generated/html_production/html_pages/objects/`
3. 看到 25 个 SHA256 文件名，无法区分哪页是哪页

## 修复关联
待定。预期方向：pilot 后自动在 `preview/` 生成 `index.html`（slide_id 列表 + 链接到对应
HTML page）或至少生成一个 `slide_map.json`（human-readable: `{slide_id: filename}`）。
