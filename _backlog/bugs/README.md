# Active Bugs — 活跃 bug 列表

> 最后更新: 2026-08-16 | `_backlog/bugs/` — 活跃 bug 在此
>
> **bug 编号归档索引在 `_done/_fixed_bugs/`；新 bug 必须取所有已分配 BUG 编号后的下一个值，避免与活跃条目冲突。** 本文件只列活跃 bug。

## 修完一个 bug 的步骤

1. `git mv bugs/BUG-<NNN>-<slug>.md _done/_fixed_bugs/BUG-<NNN>-<slug>.md`
2. 更新 `_done/_fixed_bugs/README.md`（加表格行 + 更新 Next available bug ID）
3. 更新本文件（删掉该 bug）
4. 更新 `../_done/README.md`（计数 +1）

---

## 活跃列表

| ID | Severity | Title |
|----|----------|-------|
| [BUG-067](BUG-067-style-master-masks-visual-language-errors.md) | P1 | Style Master 将可定位的 visual-language 配置错误掩盖成生命周期 inspect 自循环 |
| [BUG-068](BUG-068-image2-plan-masks-visual-language-errors.md) | P1 | `image2 plan` 将已知 visual-language 配置错误降级为 internal |
| [BUG-069](BUG-069-validate-conflates-source-and-state.md) | P2 | `validate` 把可验证 source 与预期的 stale state 绑定，不能用于调优阶段的 source 预检 |
| [BUG-070](BUG-070-doctor-ready-does-not-reach-image2-authorize.md) | P1 | exact-run doctor 报 raw-generation READY，但 `image2 authorize` 不加载同一 `.env` 而失败 |
| [BUG-071](BUG-071-pilot-review-masks-reconcile-after-store-lock.md) | P1 | `pilot-review` 的 store-lock 诊断没有区分生成进行中与需要 reconcile 的提交 |

---

**Next available bug ID: BUG-072**

## 类别分布

P0: 0 | P1: 4 | P2: 1 | P3: 0

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
