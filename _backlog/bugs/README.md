# Active Bugs — 活跃 bug 列表

> 最后更新: 2026-08-08 | `_backlog/bugs/` — 活跃 bug 在此
>
> **bug 编号归档索引在 `_done/_fixed_bugs/`；新 bug 必须取所有已分配 BUG 编号后的下一个值，避免与活跃条目冲突。** 本文件只列活跃 bug。

## 修完一个 bug 的步骤

1. `git mv bugs/BUG-<NNN>-<slug>.md _done/_fixed_bugs/BUG-<NNN>-<slug>.md`
2. 更新 `_done/_fixed_bugs/README.md`（加表格行 + 更新 Next available bug ID）
3. 更新本文件（删掉该 bug）
4. 更新 `../_done/README.md`（计数 +1）

---

## 活跃列表

### P1（重要 — 1 个）

- **[BUG-057](BUG-057-pure-pages-lack-visual-system-consistency.md)** — Pure workflow 各页视觉系统不一致：字体/字号/色调/layout 每页自由发挥，缺全 deck 锁定视觉系统

### P3（体验 — 1 个）

- **[BUG-062](BUG-062-long-hash-leaks-in-cli-stdout-despite-short-refs.md)** — 短引用只覆盖 task-projection，一般 CLI stdout 仍输出完整 64 位哈希

---

**Next available bug ID: BUG-064**

## 类别分布

P0: 0 | P1: 1 | P2: 0 | P3: 1

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
