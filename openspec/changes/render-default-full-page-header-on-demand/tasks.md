## 1. Render 策略源与级联（Stage 1）

- [ ] 1.1 在 `stage1_build_inputs.mjs` 加 `slide-specifications.md` frontmatter `render:` 块解析器：读 `render.default`（缺省 `full-page`）与 `render.header-lock`（id 列表）；未知 id / 非法 mode 值 fail-loud 并列出问题页，失败走 JSON envelope（`ok/code/message/hint/where`）。
- [ ] 1.2 改 `determineRenderMode` 接入固定级联：每页显式 `RENDER MODE` > deck `header-lock` 例外表 > deck `default` > VISUAL TYPE 派生（旧 deck 兜底）。
- [ ] 1.3 扩展 `buildLayoutContract` 的 `render_mode_source` 取值为 `explicit` / `policy:exception` / `policy:default` / `derived:visual_type`，保证每页决策可追溯。
- [ ] 1.4 确认无 frontmatter 的旧 deck 仍走 VISUAL TYPE 派生（向后兼容），不改其 `slide_plan.json` 结果。

## 2. Full-page Header Placement 契约（Stage 1 prompt 组装）

- [ ] 2.1 在 `assemblePrompt` 的 full-page 分支注入 Header Placement 契约：从 `visual_config.mjs`（`color_palette.json` header 几何）取 position/size/alignment，结合结构化 kicker/headline/subtitle 组成指令，取代"作者散文手写标题位置"。
- [ ] 2.2 保证同一 deck 内所有 full-page 页的 header 几何指令一致（只有文字不同），措辞借用现有 `systemHeaderContract` 的强约束风格。
- [ ] 2.3 确认 full-page 与 body+header-lock 读取的是**同一套** header 几何 SSOT（切换模式不移动 header 位置）。

## 3. 播种与文档校准

- [ ] 3.1 `--init` 模板在 `slide-specifications.md` 顶部播种注释版 `render:` 块（`default: full-page` + 空 `header-lock:`），并在 README/注释里用小白话说明"只填标题文字即可"。
- [ ] 3.2 校准 `BOOTSTRAP.md` / `AGENTS.md` 中"80% body+header-lock、20% full-page"等旧默认描述为"默认 full-page，header-lock 按需"。
- [ ] 3.3 在用户可见能力说明里写清诚实边界：full-page 的 header 只能"足够稳"，像素级锁死需 header-lock 兜底。

## 4. 测试（content-parsing / header-lock 回归）

- [ ] 4.1 级联优先级用例：默认→full-page（`policy:default`）；例外表→单页 body+header-lock（`policy:exception`）；每页显式覆盖 default（`explicit`）；无 frontmatter 旧 deck→`derived:visual_type`。
- [ ] 4.2 full-page 契约用例：assembled prompt 含 header 文字 + 几何指令；两页 full-page 的几何指令一致（仅文字不同）。
- [ ] 4.3 header-lock 用例：默认 full-page + 单页入例外表时，仅该页被叠加、其余透传；full-page 软契约与 header-lock 硬叠加的 header 位置/字号一致。
- [ ] 4.4 frontmatter 解析失败用例：拼错 mode 值 / 未知 id 时 fail-loud 且输出 JSON envelope。
- [ ] 4.5 `npm test` 全绿。

## 5. 验收与闸门

- [ ] 5.1 跑 `openspec validate --specs --strict`（或等价）确认 spec delta 合法。
- [ ] 5.2 pilot 1-2 页对照 Header Placement 契约的两种措辞（绝对 px vs 相对描述），选稳定度更高的一种定稿（Open Question）。
- [ ] 5.3 交付前把 BUG-009 关联在卡上引用清楚（本 change 不修解码 bug，仅依赖其修复后 full-page 透传才真正无损）。
