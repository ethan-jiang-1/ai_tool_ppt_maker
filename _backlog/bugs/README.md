# Active Bugs — 活跃 bug 列表

> 最后更新: 2026-07-13 | `_backlog/bugs/` — 活跃 bug 在此
>
> **bug 编号权威在 `_done/_fixed_bugs/`，新 bug = 最大编号 + 1。** 本文件只列活跃 bug。

## 修完一个 bug 的步骤

1. `git mv bugs/BUG-<NNN>-<slug>.md _done/_fixed_bugs/BUG-<NNN>-<slug>.md`
2. 更新 `_done/_fixed_bugs/README.md`（加表格行 + 更新 Next available bug ID）
3. 更新本文件（删掉该 bug）
4. 更新 `../_done/README.md`（计数 +1）

---

# Active Bugs — 活跃 bug 列表

> 最后更新: 2026-07-21 | `_backlog/bugs/` — 活跃 bug 在此
>
> **bug 编号权威在 `_done/_fixed_bugs/`，新 bug = 最大编号 + 1。** 本文件只列活跃 bug。

## 修完一个 bug 的步骤

1. `git mv bugs/BUG-<NNN>-<slug>.md _done/_fixed_bugs/BUG-<NNN>-<slug>.md`
2. 更新 `_done/_fixed_bugs/README.md`（加表格行 + 更新 Next available bug ID）
3. 更新本文件（删掉该 bug）
4. 更新 `../_done/README.md`（计数 +1）

---

## 活跃列表

### P0（阻断 — 5 个）

- **[BUG-016](BUG-016-approve-rejects-valid-plan-hash.md)** — `ppt_flow approve` 拒绝有效的 plan-hash
- **[BUG-017](BUG-017-approve-deadlock-blocks-build-and-image2.md)** — gate approval 死锁导致 build 和 Phase 4 Image2 不可达
- **[BUG-020](BUG-020-no-user-override-force-mechanism.md)** — 框架缺少 user-override 机制，gate 不通过时无法强制继续
- **[BUG-021](BUG-021-image2-transport-not-cli-accessible.md)** — Phase 4 Image2 transport 需要代码注入，CLI 无法使用
- **[BUG-028](BUG-028-markerless-to-html-first-migration-tooling-gap.md)** — markerless → html-first 迁移全过程无自动化工具
- **[BUG-032](BUG-032-migrate-html-preview-never-works-for-real-decks.md)** — `ppt_flow migrate-html` 对真实 deck 从未走通过

### P1（重要 — 8 个）

- **[BUG-014](BUG-014-html-objects-unnavigable-sha256-filenames.md)** — HTML 产物 SHA256 文件名无法按 slide_id 定位
- **[BUG-015](BUG-015-html-first-rendering-text-only-no-visual-expression.md)** — html-first 渲染以文字排版为主，缺乏视觉表达能力
- **[BUG-018](BUG-018-preview-plan-fingerprint-body-stripping.md)** — content_fingerprint 因 body 剥离差异永不匹配
- **[BUG-019](BUG-019-visual-review-plan-requires-composition-data.md)** — visual review plan 缺 composition 数据时 approvable=false
- **[BUG-022](BUG-022-color-palette-legacy-to-html-first-no-migration.md)** — color_palette.json legacy→html-first 无迁移工具
- **[BUG-027](BUG-027-delivery-evidence-assembly-15-fields-undocumented.md)** — delivery record 17 个必须字段无文档
- **[BUG-029](BUG-029-error-messages-no-expected-vs-actual.md)** — 框架错误信息不给 expected vs actual
- **[BUG-030](BUG-030-pipeline-rejects-modified-source-silently.md)** — 修改 source 后所有 gate 静默失效

### P2（次要 — 6 个）

- **[BUG-023](BUG-023-speaker-notes-blockquote-blank-line-breaks-stage5.md)** — SPEAKER NOTE blockquote 空行导致 Stage 5 失败
- **[BUG-024](BUG-024-versionrecord-key-inconsistency.md)** — versionKey `3_versions/v2` vs `v2` 不一致
- **[BUG-025](BUG-025-ds-store-not-in-gitignore-breaks-bundle-check.md)** — macOS .DS_Store 打破 bundle check
- **[BUG-026](BUG-026-slide-heading-parser-overmatches-section-headers.md)** — slide heading 解析器误匹配 section header
- **[BUG-031](BUG-031-no-state-yaml-validation-tool.md)** — state.yaml 无校验工具

---

**Next available bug ID: BUG-033**

## 类别分布

| 类别 | 数量 | Bug IDs |
|---|---|---|
| Gate/Approval 系统 | 5 | 016, 017, 018, 019, 020 |
| 迁移工具 | 3 | 022, 028, 032 |
| 渲染/视觉 | 2 | 014, 015 |
| Image2/Transport | 1 | 021 |
| 错误信息/可调试性 | 3 | 027, 029, 031 |
| 健壮性/边界 | 5 | 023, 024, 025, 026, 030 |

---

## 卡片模板

新建 bug 文件 `BUG-<NNN>-<slug>.md`，`<NNN>` 取 `_done/_fixed_bugs/README.md` 的 Next available ID：

```markdown
# BUG-<NNN>: <一句话标题>

> 严重级别: P0 / P1 / P2 | 发现: 2026-MM-DD | 状态: 活跃

## 症状
观察到什么错误行为（现场、报错、复现路径）。

## 根因
定位到的机制层原因（越到"契约/结构"层越好，避免只描述表象）。

## 复现
最小复现步骤 / 命令 / 输入。

## 修复关联
落地的 OpenSpec change 名称 + 版本；或说明为何拆成更窄的 follow-up。
```

> 约定：严重级别用 `P0`（阻断）/ `P1`（重要）/ `P2`（次要）。把每个 bug 当作**契约探针**——一个具体缺陷往往牵出一整类失败，值得顺藤摸瓜做横切排查，而不是只打一个孤立补丁。
