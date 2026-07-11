## 1. Render 策略源与级联（Stage 1）

- [ ] 1.1 在 `stage1_build_inputs.mjs` 加 `slide-specifications.md` frontmatter `render:` 块解析器：读 `render.default`（缺省 `full-page`）与 `render.header-lock`（id 列表）；**frontmatter 必须在 `splitSlideBlocks` 之前剥离**，不得干扰首个 slide 块；未知 id / 非法 mode 值 fail-loud 并列出问题页，失败走 JSON envelope（`ok/code/message/hint/where`）。
- [ ] 1.2 改 `determineRenderMode` 接入固定级联：每页显式 `RENDER MODE` > deck `header-lock` 例外表 > **hero 类型守卫（`Title/Opener`、`Section Divider/Bridge`、`Closer` → full-page 自由构图）** > deck `default` > VISUAL TYPE 派生（旧 deck 兜底）。hero 守卫须保证 `default: body+header-lock` 也不会强锁封面/分隔/结尾。
- [ ] 1.3 扩展 `buildLayoutContract` 的 `render_mode_source` 取值为 `explicit` / `policy:exception` / `derived:hero_type` / `policy:default` / `derived:visual_type`，保证每页决策可追溯。
- [ ] 1.4 确认无 frontmatter 的旧 deck 仍走 VISUAL TYPE 派生（向后兼容），不改其 `slide_plan.json` 结果。
- [ ] 1.5 校验补丁：content full-page 无真实 TITLE → **非阻塞 WARN** 点名该页（默认翻转前这是 body-lock 的 loud error，别静音）；hero full-page 无 TITLE 不 WARN。

## 2. Full-page Header Placement 契约（Stage 1 prompt 组装）

- [ ] 2.1 在 `assemblePrompt` 的 full-page 分支注入 Header Placement 契约：从 `visual_config.mjs`（`color_palette.json` header 几何）取 position/size/alignment，结合结构化 kicker/headline/subtitle 组成指令，取代"作者散文手写标题位置"。**仅作用于非 hero 类型**（`Title/Opener`、`Section Divider/Bridge`、`Closer` 保持自由构图，不套 band）；**空/占位字段的子句跳过**（对齐 `_drawHeader` 对 `(NONE)` 的处理）。
- [ ] 2.2 保证同一 deck 内所有 **content** full-page 页的 header 几何指令一致（只有文字不同），措辞借用现有 `systemHeaderContract` 的强约束风格。
- [ ] 2.3 确认 full-page 与 body+header-lock 读取的是**同一套** header 几何 SSOT（切换模式不移动 header 位置）。

## 3. 播种与文档校准

- [ ] 3.1 `--init` 模板在 `slide-specifications.md` 顶部播种注释版 `render:` 块（`default: full-page` + 空 `header-lock:`），并在 README/注释里用小白话说明"只填标题文字即可"。
- [ ] 3.2 校准 `BOOTSTRAP.md` / `AGENTS.md`（含 `PPTMAKER_FRAMEWORK/AGENTS.md:271` "RENDER MODE 由 VISUAL TYPE 自动映射" 一句）中"80% body+header-lock、20% full-page"等旧默认描述为"默认 full-page、由 deck 级 `render:` 策略 + 级联决定、header-lock 按需"；保留"RENDER MODE 只有两个"不变（未加第三种 mode，hero 守卫是内部派生）。
- [ ] 3.3 在用户可见能力说明里写清诚实边界：full-page 的 header 只能"足够稳"，像素级锁死需 header-lock 兜底。
- [ ] 3.4 `--init` 对**所有 deck-type 一致**播种 `render.default: full-page`（尊重用户"默认 full-page"）；把 header 稳定度设为 **pilot 显式验收 checkpoint**——漂移则 agent 提示 + 对漂移页建议 header-lock，不静默、不改默认（Decision 5）。
- [ ] 3.5 更新 `change-classifier`：把"full-page → header-lock 升级"归类为**编辑链 B**（body prompt 改为预留 band → 重生该页图，`--force-images`），并同步用户话术，别宣称零操作成本。

## 4. 测试（content-parsing / header-lock 回归）

- [ ] 4.1 级联优先级用例：默认→full-page（`policy:default`）；例外表→单页 body+header-lock（`policy:exception`）；每页显式覆盖 default（`explicit`）；**`default: body+header-lock` 下 hero 页仍→full-page（`derived:hero_type`）**；无 frontmatter 旧 deck→`derived:visual_type`。
- [ ] 4.2 content full-page 契约用例：非 hero 页 assembled prompt 含 header 文字 + 几何指令；两页 content full-page 的几何指令一致（仅文字不同）。
- [ ] 4.2b hero 排除用例：`Title/Opener`、`Section Divider/Bridge`、`Closer` 的 full-page 页**不注入固定 band**；空/占位 kicker 或 subtitle 的子句被跳过。
- [ ] 4.3 header-lock 用例：默认 full-page + 单页入例外表时，仅该页被叠加、其余透传；full-page 软契约与 header-lock 硬叠加**指向同一套 `color_palette.json` 几何**（断言指令/几何同源，**不**断言 AI 像素结果一致）。
- [ ] 4.4 frontmatter 解析失败用例：拼错 mode 值 / 未知 id 时 fail-loud 且输出 JSON envelope。
- [ ] 4.4b 校验 WARN 用例：content full-page 无 TITLE → 非阻塞 WARN 且不 abort；hero full-page 无 TITLE → 不 WARN。
- [ ] 4.5 `npm test` 全绿。

## 5. 验收与闸门

- [ ] 5.1 跑 `openspec validate --specs --strict`（或等价）确认 spec delta 合法。
- [ ] 5.2 pilot 1-2 页对照 Header Placement 契约的两种措辞（绝对 px vs 相对描述），选稳定度更高的一种定稿（Open Question）。
- [ ] 5.3 交付前把 BUG-009 关联在卡上引用清楚（本 change 不修解码 bug，仅依赖其修复后 full-page 透传才真正无损）。
