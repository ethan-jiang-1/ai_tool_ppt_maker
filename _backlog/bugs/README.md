# Active Bugs — 活跃 bug 列表

> 最后更新: 2026-08-04 | `_backlog/bugs/` — 活跃 bug 在此
>
> **bug 编号权威在 `_done/_fixed_bugs/`，新 bug = 最大编号 + 1。** 本文件只列活跃 bug。

## 修完一个 bug 的步骤

1. `git mv bugs/BUG-<NNN>-<slug>.md _done/_fixed_bugs/BUG-<NNN>-<slug>.md`
2. 更新 `_done/_fixed_bugs/README.md`（加表格行 + 更新 Next available bug ID）
3. 更新本文件（删掉该 bug）
4. 更新 `../_done/README.md`（计数 +1）

---

## 活跃列表

### P0（阻断 — 1 个）

- **[BUG-035](BUG-035-target-provider-request-omits-visual-language-clauses.md)** — 当前 target provider request 只携带 visual-language projection，遗漏 provider clauses

### P1（重要 — 4 个）

- **[BUG-046](BUG-046-style-master-fetch-timeout-causes-attempt-unknown.md)** — Style Master 候选被 2000x1125 硬校验 + provider 尺寸/prompt 上限/async 模型错配 → `attempt_unknown` 无重试路径（**deck_dark_factory 主阻塞**）
- **[BUG-047](BUG-047-style-master-generate-requires-manual-env-loading.md)** — `style-master generate` 不自动加载 `.env` 凭证（doctor 却会），需 `node --env-file`
- **[BUG-048](BUG-048-style-master-compiled-prompt-structurally-oversized.md)** — Style Master 编译 prompt 结构性过长（全 slide projection digest JSON，13 页 = 10931 字符）超 provider 上限
- **[BUG-049](BUG-049-style-master-attempt-unknown-no-reconcile-burns-submissions.md)** — Style Master `attempt_unknown` 永久阻塞计划、无 reconcile，只能 abandon 烧提交

### P2（次要 — 4 个）

- **[BUG-015](BUG-015-html-first-rendering-text-only-no-visual-expression.md)** — Page Authority visual-language registry 缺少关系型概念视觉的可验证语义
- **[BUG-050](BUG-050-style-master-fetch-no-explicit-timeout-undici-300s.md)** — Style Master / page raw 的 provider fetch 无显式超时，慢 provider 撞 undici 300s
- **[BUG-051](BUG-051-doctor-smoke-false-positive-misses-size-and-prompt-failures.md)** — `doctor --smoke` 假阳性，测不出尺寸不符与 prompt 超限
- **[BUG-052](BUG-052-provider-base-url-comma-list-not-supported-and-async-model.md)** — provider base_url 逗号列表不被支持；async task 模型不被 Style Master transport 支持

---

**Next available bug ID: BUG-053**

## 类别分布

| 类别 | 数量 | Bug IDs |
|---|---|---|
| 渲染/视觉 | 1 | 015 |
| 数据/契约 | 1 | 035 |
| 运行时/超时 | 1 | 046 |
| 凭证/环境 | 1 | 047 |
| 数据/契约 | 1 | 048 |
| 状态机/恢复 | 1 | 049 |
| 诊断 | 1 | 051 |
| provider 兼容 | 1 | 052 |

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
