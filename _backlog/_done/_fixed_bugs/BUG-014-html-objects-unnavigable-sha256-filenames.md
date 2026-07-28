# BUG-014: HTML 审阅面缺少由 slide_id 驱动的直接定位入口

> 严重级别: P1 | 发现: 2026-07-20 | 状态: 已修复 | 基线校准: 2026-07-28 | 修复: 2026-07-28

## 原始症状

HTML Production 的 `html_pages/objects/` 与 `final_slides/objects/` 是 raw-byte SHA-256 的 immutable
object store。直接浏览这些目录不能按 `slide_id` 找页，但这本身是正确的 CAS 边界，不能通过改 object
文件名来修复。

当前 `preview/` manifest 已分别持有 content/visual review plan 和 visual-review/delivery contact-sheet
slots，HTML build 也会发布 contact sheet。因此“pilot 后没有 preview/contact sheet”的旧复现不再准确。
剩余问题是：人或 Agent 想从一个 stable `slide_id` 直接定位当前 HTML/final-slide 审阅对象时，仍需理解私有
manifest/object path；contact sheet 适合整体审阅，不是逐页 locator contract。

## 原始根因

缺的是 review-facing locator，不是 CAS、manifest 或 final-slide ownership 的错误。现有 manifest 是唯一 current-set
pointer；任何新入口都必须从该 owner 读取并按 current plan order 输出，不能复制第二份 artifact mapping，也不能让
SHA 文件名、目录 glob 或 position 重新成为 identity authority。

## 修复与当前基线

`retire-legacy-production-surface` 已删除 HTML-first 的 object store、HTML review projection 与其
生产路径，因此不再存在以 SHA-256 object filename 作为审阅导航面的 current surface。

当前 Page Authority 的 raw/final artifact 都以安全的 stable `slide_id` 命名（`<slide_id>.png`），
而 current raw-review projection 在按当前 manifest tuple 建立的审阅图上标出 `slide_id`。manifest、
coverage 与 byte digest 仍负责 lineage/freshness，文件名本身不再被当作 authority。因此原问题的
“逐页可定位”目标已经满足，且没有引入第二份 durable mapping。

## 回归验证

1. `tests/04-image-production/test_page_authority_raw_manifest.mjs` 覆盖 stable `slide_id` raw/final manifest
   entries 与 stale lineage rejection。
2. `raw_review.mjs` 从 current raw manifest tuple 构建 projection，并将每页的 stable ID 作为审阅标签。
3. `npm test` 的 60 秒 core verifier 已通过；具体 Page Authority seam 测试仍由受影响 change 选择性运行。

## 关闭原因

原问题依赖的 HTML object-store 审阅面已经退休；同一用户目标由 current Page Authority manifest-bound
`slide_id` artifact 和 raw-review projection 实现。没有遗留的 active locator work。
