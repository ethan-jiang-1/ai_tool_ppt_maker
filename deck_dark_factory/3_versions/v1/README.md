# 这一版(v1)

**你改这两处:**
- `slide-specifications.md` — 每一页的 stable ID、Page Authority、Text Frame/Visual Brief 和 notes
- `overrides/` — 只放这一版偏离 backbone 的东西(比如这版单独换配色);空 = 全继承 backbone

**临时/备份:** `_scratch/` — 改源前的 `.bak`、草稿（上严下松：别丢到 deck 根）

**别碰:** `_generated/` — 那是机器生成的成品,改源文件后会被覆盖重建。

**生成/更新:** 跟你的 AI agent 说人话(「第 5 页换个例子」),或自己跑:
`node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build <这个版本目录>`
