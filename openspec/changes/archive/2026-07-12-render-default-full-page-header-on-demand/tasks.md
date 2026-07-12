## 1. Frontmatter 与 render resolution（Stage 1）

- [x] 1.1 用项目已有 `yaml` 包只解析 `slide-specifications.md` 文档开头可选的 frontmatter；无 frontmatter 合法；保留/容忍无关顶层键；正文后续 `---` 保持 Markdown 分隔线语义；若存在则在 `splitSlideBlocks` 前剥离开头 frontmatter。
- [x] 1.2 实现并复用 closed render schema validator：只允许 `default` / `header-lock`；拒绝 duplicate YAML key 和 `header_lock` 等未知键；例外 id trim 后须非空、唯一、存在且只对应一张 slide；非法 YAML/类型/mode/空/重复/未知/歧义 id fail-loud 并聚合问题。
- [x] 1.3 明确 CLI 失败职责：Stage 1 提供具体错误；经 `ppt_flow` 调用时保持标准 JSON envelope 为 stderr 最后一行，不在 Stage 1 standalone 复制 envelope 协议。
- [x] 1.4 实现互斥分支：整个 `render` 键缺失走 legacy（explicit > VISUAL TYPE）；`render` 键存在走 policy（explicit > exception > hero guard > default，default 缺失为 full-page）。
- [x] 1.5 扩展 `render_mode_source` 为 `explicit` / `policy:exception` / `derived:hero_type` / `policy:default` / `derived:visual_type`。
- [x] 1.6 实现 hero canonicalization，至少覆盖 `Title / Opener`、`Section Divider / Bridge`、模板现用 `Section Divider`、`Closer` 的 case/whitespace 变体。
- [x] 1.7 把 canonicalization / `isHeroVisualType` 放进 Stage 1 与 `ppt_flow` selector 共用的 helper，禁止复制两套 hero 集合。
- [x] 1.8 policy 分支每页必须有真实 VISUAL TYPE；缺失/placeholder fail-loud，legacy 分支保持兼容。
- [x] 1.9 多输入 standalone 调用中，每个文件 policy/exception 只作用于本文件 blocks，不跨文件泄漏。
- [x] 1.10 content full-page 无真实 TITLE 发非阻塞 WARN；hero full-page 不发该 WARN。

## 2. Full-page Header Placement 契约

- [x] 2.1 从 `visual_config.mjs` 返回值构建固定混合格式 header formatter：语义 top-left band + canvas/px geometry，包含 safe-zone、margins/y positions、line heights、font family/weight/size/color 和固定左对齐；body visual 明确退出 band；不要引用不存在的 palette alignment 字段。
- [x] 2.2 仅为非 hero full-page 注入契约；hero 保持自由构图。
- [x] 2.3 为 hero full-page 注入结构化 header exact-text contract，但不注入固定 geometry；用户无需在 source IMAGE PROMPT 重复标题文字。
- [x] 2.4 建立共享 presence normalization：空、任意大小写 `(none)`、`(无)`、整字段 bracket placeholder 的可选 header 字段，在 slide record 和两种 prompt 中都省略，绝不画出 sentinel。
- [x] 2.5 exact text 使用结构化 formatter + JSON string escaping，禁止裸字符串拼接。
- [x] 2.6 所有 full-page 保持 `header_safe_zone: 0`；配置 band 高度只进入 prompt，避免改变该 field 的硬 overlay safe-zone 语义；Stage 3 仍只按 mode 决策。
- [x] 2.7 content title 缺失由 validator WARN；body+header-lock title 缺失继续阻断。
- [x] 2.8 保证同 deck content full-page 页 geometry 指令稳定，仅文字不同；确认 Stage 3 消费同一 visual config 字段。
- [x] 2.9 移除 body+header-lock prompt 中具体 kicker/title/subtitle 值，只保留 generic overlay-later 说明；title-only edit 后 final Stage-2 prompt/fingerprint 必须 byte-identical。

## 3. Init、模板与方法论文档

- [x] 3.1 `--init` 复制的通用模板和全部 deck-type 模板，在现有 frontmatter 内播种有效、未注释的 `render.default: full-page` 与 `header-lock: []`。
- [x] 3.2 移除通用模板、keynote/pitch/report/training 模板中“逐页必须/建议显式 RENDER MODE”的旧指导；逐页字段只作为高级 override，不再是完成条件。
- [x] 3.3 更新 IMAGE PROMPT 指导：普通 content/hero full-page 都不重复结构化 kicker/title/subtitle 文案或位置；hero prompt 只描述构图意图，准确文字由 Stage 1 注入。
- [x] 3.4 同步 `BOOTSTRAP.md`、`AGENTS.md`、Stage 1/Stage 3 workflow、pipeline philosophy、template-deck-guide、bundle README 和相关示例，统一为 policy/legacy 两分支及新默认。
- [x] 3.5 更新用户说明：full-page header 仅尽力稳定；像素精度和文字清晰度由 header-lock 保证。
- [x] 3.6 文档说明兼容边界：`render` 内 typo fail-loud；顶层 `render` 缺失必须按 legacy 解释，因此不做 `renders:` 等 fuzzy 自动纠错，排障看 `render_mode_source`。

## 4. Raw image provenance

- [x] 4.1 Stage 2 维护 `page_images_full/_manifest.json`：per-slide output、SHA-256 generation fingerprint、PNG `image_sha256`、generation profile、generated_at；fingerprint 覆盖 final prompt、style-reference content hash、resolution、model、semantic options，不含 endpoint/time。
- [x] 4.2 仅 image + matching manifest 同时存在才 `skipped-exists`；missing/corrupt/mismatch fail-loud 并提示精确 `--only ... --force-images`，不静默复用、不自动付费重生。
- [x] 4.3 成功生成后原子更新 selected entries；失败不标 current；`--only` 保留 unrelated entries。
- [x] 4.4 pilot contact sheet 验证 selected raw-image provenance；旧缓存无 manifest 不得进入可批准 review。

## 5. 编辑链与 pilot gate

- [x] 5.1 更新 `change-classifier.md`：body+header-lock header 文字修改 = Chain A；full-page header 文字修改 = Chain B；两个 mode 互切 = Chain B；单页 Chain B 使用 `--force-images`。
- [x] 5.2 更新所有用户沟通模板，禁止笼统宣称“改标题永远不生图”或“切换 mode 零成本”。
- [x] 5.3 更新 `selectPilotSlideIds`：按 normalized visual type 区分 hero/content full-page；count>=1 至少选一张 content，存在两张且 count>=2 至少选两张；剩余名额确定性覆盖其他代表类型，结果去重。
- [x] 5.4 保持 `--only` 精确选择、不由 CLI 偷加页；更新 `quick-preview`/相关生产 playbook，在手工 subset 覆盖不足时补跑 content full-page，并检查文字准确性、清晰度、位置、字号、左对齐、跨页一致性和 body overlap。
- [x] 5.5 用户确认 header-lock 后，更新 exception、按 Chain B 强制重生问题页并重新 review。
- [x] 5.6 用户接受未解决风险时，在版本 Change Log 或 playbook state extra 持久记录 slide ids 与症状；若诉求是改变整册目标 geometry，改走 visual-config 变更分类而非 exception。
- [x] 5.7 在 deck-root state 的 `nodes.header-review.by_version[version-relative run-dir]` 持久化 evidence，严格 version-scoped；记录 reviewed ids、fingerprint、accepted risk，禁止 v1/v2 互用。
- [x] 5.8 evidence 增加 per-slide `full_page_header_snapshot`、`reviewed_changed_full_page_ids`、image hash 和 generation profile；确保 hero 标题变化或图片 bytes/profile 变化会失效。
- [x] 5.9 扩展现有 `approve` gate 枚举支持 `header`：验证 current pilot provenance；同 fingerprint/profile 多批次合并，每个 version status 独立，partial 为 `in_progress`，完成才 `completed`；`--waive` 强制 `--only` + `--reason`。
- [x] 5.10 把 evidence 校验接入 `ppt_flow build` 和 non-preview Stage 2：从 current source/config 计算或先刷新 Stage 1；阻断 stale/in-progress/profile mismatch；force 会覆盖 reviewed full-page 时失败，matching profile 使用 `build --reuse-images`。
- [x] 5.11 Stage 4 final assembly 同样 fail-closed 校验 current evidence、image hashes 和 profile，堵住 partial-chain 旁路。
- [x] 5.12 full build playbook 用 `approve header` 写 evidence 并核对；即使 visual gate 已 approved，缺失/过期也要补 target-profile pilot + review。
- [x] 5.13 扩展 `refresh --kind title` 接受 `--only` / `--all` 并 mode-aware 路由：body-only 走 Stage 1,3,4,5；full-page 无 current evidence 时以 `TITLE_REVIEW_REQUIRED` + exact pilot hint 失败，review 后复用图片完成 3,4,5；mixed deck 无 selector fail-safe。

## 6. 测试

- [x] 6.1 frontmatter：无 frontmatter、与现有 metadata 共存、未知顶层键保留、正文多个 `---` 不误判、duplicate YAML key、unknown render key、非法 leading YAML、错误 mapping/array/mode、空/trim 后重复/未知/歧义 id。
- [x] 6.2 resolution：有效 init policy 默认 full-page；present render 无 default 仍 full-page；无 render 的旧 deck保持 VISUAL TYPE 结果；explicit/exception/default/legacy source 正确。
- [x] 6.3 hero aliases/source：`Section Divider` 与 `Section Divider / Bridge` 在 body-lock policy 下均受 hero guard 并记 `derived:hero_type`；full-page policy 下 hero 记 `policy:default`；explicit/exception 仍可覆盖。
- [x] 6.4 prompt/layout：content full-page 含语义 band + px geometry、固定左对齐和 body exclusion，但 layout safe zone 仍为 0；hero 含 JSON-escaped exact text、无 band、safe zone 0；body-lock prompt 不含 header values且 title-only byte-identical；placeholder/none 字段不进入 slide record 或 prompt；缺 title WARN。
- [x] 6.5 image provenance：matching reuse；prompt/style/resolution/model stale；missing/corrupt manifest；atomic selected update；失败不 current；old cached image cannot approve；image bytes/profile bind；force overwrite blocked；reuse preserves reviewed ids。
- [x] 6.6 Stage 3：所有来源的 body+header-lock 都叠加，所有来源的 full-page 都透传；source 不参与行为。
- [x] 6.7 init 回归：四种 deck-type 和通用模板都包含有效 policy，且不会再指导逐页写满 mode。
- [x] 6.8 selector 回归：count 1/2/3、content 数量 0/1/2+、去重和确定性；默认 count 3 在可用时选两张 content full-page；`--only` 不被扩充。
- [x] 6.9 playbook 回归：手工 `--only` 覆盖不足会补跑；失败路径要求 user-confirmed Chain B remedy。
- [x] 6.10 evidence/CLI 回归：`approve header` current/stale/waive、partial merge/status、new fingerprint reset、v1/v2 isolation；build、non-preview Stage 2、Stage 4 阻断 absent/stale/in-progress evidence；既有 visual approval不能绕过；notes-only 保持；current accepted risk 可通过。
- [x] 6.11 title refresh 回归：body-only、mixed 无 selector、full-page stale evidence、pilot 后复用图片、`--only` alias resolution、`--all`。
- [x] 6.12 `npm test` 全绿。

## 7. 验收

- [x] 7.1 `openspec validate render-default-full-page-header-on-demand --strict` 通过。
- [x] 7.2 用 1-2 张真实 content 页验证已定稿的“语义 band + px geometry”混合契约，若模型表现要求改协议则先回写 design/spec 再改实现。
- [x] 7.3 用计划 production profile 跑真实 pilot，验证英文和至少一张 CJK header；演练 header-lock Chain B 升级，以及 `build --reuse-images` 保留 reviewed image hashes。
- [x] 7.4 交付前清楚引用 BUG-009，确认本 change 未误宣称修复 Stage 3 解码问题。

验收记录（2026-07-12）：使用临时两页 run bundle，以 `gpt-image-2` / `2k` 生成英文与 CJK content full-page。两张原图的 exact header text、左对齐、字号、top-left band 和 body exclusion 均通过人工检查。随后把 CJK 页升级为 header-lock，按 Chain B `--force-images` 重生并完成 version-scoped header evidence；`build --reuse-images` 显示两页均 `skipped-exists`，build 前后 SHA-256 完全一致。Stage 3 的 CJK header-lock 产物同时复现 BUG-009 的黑底/字形解码问题，因此该缺陷仍由独立 BUG-009 跟踪，本 change 未宣称修复。
