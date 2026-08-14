# 这一版(v8)

新 harness `page-image-workflow` 的 pure 生产版。迁移自 v1（内容基准）+ v7（pure 生产）。

**你改这两处:**
- `slide-specifications.md` — 每一页的 stable ID、Page Image、VISUAL BRIEF/SLIDE BODY 和 notes
- `overrides/` — 只放这一版偏离 backbone 的东西(空 = 全继承 backbone)

**别碰:** `_generated/` — 机器生成的成品,改源文件后会被覆盖重建。
