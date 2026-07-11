# learning — apply / 研究复盘 retro

> 最后更新: 2026-07-11 | `_backlog/learning/` — 框架级复盘笔记长期留存（不搬迁、不归档）。

这里放**做完一件事之后的复盘**：一次 OpenSpec change apply、一轮研究、一次大修 bug 的经验沉淀。目的是把「这次为什么做得好/差、下次怎么复用」变成可检索的经验，而不是散落在 commit message 里。

命名：`YYYY-MM-DD-<slug>.md`。retro 只增不删，也不参与 `git mv` 生命周期——它不是待办，是记忆。

---

## 对比：`_backlog/learning/` ≠ `deck_*/_lessons/`

两套面，名字曾经都像「learning」，**不要写错地方**：

| | `_backlog/learning/`（本目录） | `deck_*/_lessons/` |
|--|-------------------------------|---------------------|
| **层级** | 框架仓库（跨 deck） | 单个 run bundle（本 PPT 项目） |
| **改名** | **没改**，仍叫 `learning/` | **已改**：原 `_learning/` → `_lessons/` |
| **放什么** | apply / 研究 / 大修后的 **retro**（过程与方法） | 遇事克服后的 **非密钥操作教训**（先读再猜） |
| **谁读** | 改框架的人 / Agent（下次做同类 change） | 进该 deck 的 Agent（下次猜 endpoint / 踩坑前） |
| **生命周期** | 只增不删，不进 `_done/` | 跟 deck 走；init 种子 README；可有 `image2-proven.yaml` 等 |
| **例子** | 「视觉迭代那次怎么用 trace 当契约探针」 | 「本 deck Image2 试通 base_url=…」 |
| **不放** | 某 deck 的密钥、试通回执、playbook 进度 | 框架级 retro、OpenSpec 过程复盘 |

**分流：**

- 改框架 / 做完 OpenSpec / 横切排查心得 → **写这里**
- 某个 `deck_*` 试通 API、修了本 deck 独有坑 → **写该 deck 的 `_lessons/`**（规矩见该目录 README / `LESSONS_DIR_README`）

禁止：把 deck 试通回执塞进 `_backlog/learning/`；把框架 retro 塞进 `deck_*/_lessons/`；再发明第三套 `notes/` 装经验。

---

## retro 模板

```markdown
# <标题> Retro

Date: 2026-MM-DD

## What Went Well
这次哪里做得比平常好，为什么。

## Repeatable Practices
可复用的具体做法（清单式，越具体越好）。

## Why This Found More Issues
为什么这套做法比以前发现了更多问题 / 更少返工。

## Next-Time Standard
下次同类工作，达到什么条件才算"做完"（可勾选清单）。
```

> 精髓（取自源实践）：把一个具体缺陷**转成横切排查**；先怀疑「这看起来像测试问题」，契约类 bug 要先看实现面；按 `tasks.md` 顺序执行，若发现顺序错了就**显式说明并调整**，别偷偷跳；复盘的归档说明**不要过度宣称**超出测试实际证明的范围。
