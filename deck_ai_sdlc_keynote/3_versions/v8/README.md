# 这一版(v8)

新 harness `page-image-workflow` 的 pure 生产版。迁移自 v1（内容基准）+ v7（pure 生产）。

**你改这两处:**
- `slide-specifications.md` — 每一页的 stable ID、Page Image、VISUAL BRIEF/SLIDE BODY 和 notes
- `overrides/` — 只放这一版偏离 backbone 的东西(空 = 全继承 backbone)

**本版约定（V8-only）:**
- 不使用具名 Agent 人格（砚/铸/舵/核/察/算）。角色一律用职能描述——"负责思考/书写/验证的 Agent"、"承保核对/欺诈筛查/赔付计算"——不给 Agent 起单字名字，免得演讲时要向听众解释名字含义。backbone 里 `agent-portrayal.md` / `design-constraints.md` 的具名人格规范在本版不生效。

**别碰:** `_generated/` — 机器生成的成品,改源文件后会被覆盖重建。
