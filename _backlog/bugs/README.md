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

### P1（重要 — 2 个）

- **[BUG-014](BUG-014-html-objects-unnavigable-sha256-filenames.md)** — HTML 产物 SHA256 文件名无法按 slide_id 定位
- **[BUG-015](BUG-015-html-first-rendering-text-only-no-visual-expression.md)** — html-first 渲染以文字排版为主，缺乏视觉表达能力

---

**Next available bug ID: BUG-033**

## 类别分布

| 类别 | 数量 | Bug IDs |
|---|---|---|
| 渲染/视觉 | 2 | 014, 015 |

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
