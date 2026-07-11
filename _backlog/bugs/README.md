# Active Bugs — 活跃 bug 列表

> 最后更新: 2026-07-11 | `_backlog/bugs/` — 活跃 bug 在此
>
> **bug 编号权威在 `_done/_fixed_bugs/`，新 bug = 最大编号 + 1。** 本文件只列活跃 bug。

## 修完一个 bug 的步骤

1. `git mv bugs/BUG-<NNN>-<slug>.md _done/_fixed_bugs/BUG-<NNN>-<slug>.md`
2. 更新 `_done/_fixed_bugs/README.md`（加表格行 + 更新 Next available bug ID）
3. 更新本文件（删掉该 bug）
4. 更新 `../_done/README.md`（计数 +1）

---

## 活跃列表

| Bug | 严重级别 | 简述 |
|-----|---------|------|
| [BUG-003](BUG-003-ppt-flow-frozen-style-presets-sort.md) | P0 | `ppt_flow.mjs` 对冻结的 `STYLE_PRESETS` 调 `.sort()`，所有子命令启动即崩 |
| [BUG-004](BUG-004-ppt-flow-state-command-registered-outside-main.md) | P1 | `ppt_flow.mjs` 的 `state` 子命令在 `main()` 外注册、引用越界的 `program`（被 BUG-003 掩盖） |
| [BUG-005](BUG-005-state-dir-invisible-no-hints.md) | P1 | `_state/` 在 run bundle 中完全隐形：无 README/注释/面包屑，SSOT 树缺此项 |

**Next available bug ID: BUG-006**

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
