# BUG-014: HTML 审阅面缺少由 slide_id 驱动的直接定位入口

> 严重级别: P1 | 发现: 2026-07-20 | 状态: 活跃 | 基线校准: 2026-07-23

## 症状

HTML Production 的 `html_pages/objects/` 与 `final_slides/objects/` 是 raw-byte SHA-256 的 immutable
object store。直接浏览这些目录不能按 `slide_id` 找页，但这本身是正确的 CAS 边界，不能通过改 object
文件名来修复。

当前 `preview/` manifest 已分别持有 content/visual review plan 和 visual-review/delivery contact-sheet
slots，HTML build 也会发布 contact sheet。因此“pilot 后没有 preview/contact sheet”的旧复现不再准确。
剩余问题是：人或 Agent 想从一个 stable `slide_id` 直接定位当前 HTML/final-slide 审阅对象时，仍需理解私有
manifest/object path；contact sheet 适合整体审阅，不是逐页 locator contract。

## 当前根因

缺的是 review-facing locator，不是 CAS、manifest 或 final-slide ownership 的错误。现有 manifest 是唯一 current-set
pointer；任何新入口都必须从该 owner 读取并按 current plan order 输出，不能复制第二份 artifact mapping，也不能让
SHA 文件名、目录 glob 或 position 重新成为 identity authority。

## 最小验证

1. 用两个不同 `slide_id` 发布 HTML page/final-slide manifest 与 review/contact-sheet slots。
2. 审阅入口必须返回每个 current `slide_id` 的可打开/可展示目标、artifact kind、current manifest identity 和
   plan order。
3. 旧 object、forced-fallback object、非 current manifest entry 或 position-only lookup 必须不可被该入口误选。

验证应是 manifest/locator contract test，不启动浏览器、HTML compositor、Canvas 或 PPTX。

## 修复方向

新增一个由 preview/final-slide owner 生成或只读导出的 slide locator（具体载体待定，可为 review index、CLI JSON
view 或受控页面）。它必须：

- 以 `slide_id` 为键、以 current owning manifest 为唯一来源；
- 显示 visual-review/delivery contact-sheet 的现有整体入口，并提供单页 current artifact 的受控定位；
- 把 SHA/object path 保留为 receipt/provenance，不把它暴露成用户必须手工拼接的导航协议；
- 在纯 Node contract test 中覆盖 current/stale/forced-fallback/missing 的选择规则。

## 非目标

- 不重命名 CAS object，不创建 `slide_id -> SHA` 的第二 durable authority，不手改 `_generated/`。
- 不把浏览器截图或完整 HTML render suite 设为该问题的开发态默认验证。
