# BUG-005: `_state/` 在 run bundle 中完全隐形 — 无 README/注释/面包屑

> 严重级别: P1 | 发现: 2026-07-11 | 状态: 活跃

## 症状

在 run bundle（如 `deck_temp_untitied/`）里看到 `_state/` 目录，里面只有纯数据的 `state.yaml`：
- **没有任何注释** — schema 不可见
- **没有 README.md** — 不知道这是什么、谁写的、谁读的
- **`deck-guide.md` 没提它** — 人类或 agent 顺着 CLAUDE.md → deck-guide.md 读下去完全不会知道 `_state/` 存在
- **`renderTree()` 里没有它** — SSOT 目录树渲染输出中 `_state/` 缺席

但 `_state/` 实际上是运行时最关键的基础设施之一：`state.mjs` 135 行完整 CRUD API，`NODE-SPEC.md` 整个 State Schema 章节，所有 playbook node 的执行进度都写在这里。**在框架知识层无处不在，在 bundle 文件系统层完全隐身。**

人或 agent 在 bundle 里撞见 `_state/` 时，只能靠猜。

## 根因

`_state/` 是运行时态的产物（由 `state.mjs` 的 `writeState()` 通过 `mkdirSync(…, {recursive:true})` 隐式创建），不在 `bundle_layout.mjs` 的 scaffolding 流程里。所以：

| 缺口 | 位置 |
|---|---|
| 不在 `_DIR_READMES` 里 | `bundle_layout.mjs:489-560` — `_state` 无条目 |
| 不在 `renderTree()` 里 | `bundle_layout.mjs:709-745` — SSOT 树缺 `_state/` |
| 不在头部 ASCII 布局注释里 | `bundle_layout.mjs:17-49` — 布局图缺 `_state/` |
| `initBundle()` 不写 `_state/README.md` | 建目录靠 `writeState` 副作用，不是显式 scaffold |
| `state.yaml` 无 schema 注释 | `createInitialState()` / `writeState()` 产出纯 YAML |
| `deck-guide.md` 模板不提 `_state/` | `bundle_layout.mjs:652-684` GUIDE_FILE 内容无 `_state` |
| `METADATA_FILE` 模板不提 `_state/` | 项目元数据也没有 breadcrumb |

这其实是 **scaffolding 层的契约缺失**：`_state/` 是 runtime concern，但 bundle init 没有把它当一等目录对待。

## 复现

```bash
# 进任意 run bundle
ls deck_temp_untitied/_state/
# → state.yaml（可能还有 history.jsonl）

cat deck_temp_untitied/_state/state.yaml
# → 纯 YAML 数据，零注释

# 问任何 agent："_state/state.yaml 的 schema 是什么？"
# agent 必须在整个 repo 里搜，最终找到 NODE-SPEC.md 或 state.mjs
# 没有任何就近 breadcrumb 告诉它去那里找
```

## 影响范围

- **人类**: 翻 bundle 时看到 `_state/`，完全不知道是什么
- **MD Controller / agent**: 需要跨文件跳转才能理解 schema（NODE-SPEC.md 在框架里，不在 bundle 里）
- **新 agent**: 如果它的 CLAUDE.md auto-load 不包含框架层，它完全不知道 state 协议

## 建议修复方向

1. `_DIR_READMES` 加 `_state` 条目 → 建 README.md，解释 state 用途 + schema 快照 + 指向 `NODE-SPEC.md` / `state.mjs` 的指针
2. `state.yaml` 顶部加被注释的 schema（`# playbook: <name>` 之类），人读即懂
3. `renderTree()` 加 `_state/` 节点
4. 头部 ASCII 布局图加 `_state/`
5. `deck-guide.md` 模板加一行："当前进度见 `_state/state.yaml`"
6. `project-metadata.yaml` 模板加 comment breadcrumb（与 `_state/` 的关系）

## 修复关联

待分配 OpenSpec change。

---

> 本 bug 属于 **scaffolding discoverability** 类——`_state/` 功能齐全但文档化在 bundle 层断链。这不是功能 bug，但它是每次 agent 初次接触 bundle 都会碰到的摩擦面。
