# 这一版(v5)

**内容基准：V1**（`../v1/slide-specifications.md`，最高质量）。v5 把 V1 的 25 页 TITLE/KICKER/SUBTITLE/CONCEPT/SPEAKER NOTE 迁移到当前框架的 **pure** workflow 格式：

- `identity.scheme: mnemonic-v1`，slide_id 按 SUBJECT+MOVE 定义（封面 `InfoRev` 等）
- `production.workflow: pure` — Image2 渲染整页含 display 文字
- `VISUAL SCENE`（ASCII、过 text guard）承载每页非文字场景
- VISUAL BRIEF 负约束不含 `no-readable-text`/`no-labels`

v5 基于框架 v0.23.1（含 BUG-035/036 修复：provider_clauses 文本 + 每页 scene 真正到达 Image2 prompt）。

`_generated/` 与 `_scratch/` 干净。临时/备份只放 `_scratch/`（上严下松）。
