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

## 活跃列表

| Bug | 严重级别 | 简述 |
|-----|---------|------|
| [BUG-003](BUG-003-header-review-stale-fingerprint.md) | high | Header review gate 全局锁——纯 full-page deck 被强制拦截，改了 3 页堵住 25 页 |
| [BUG-004](BUG-004-stage3-invalid-svg-passthrough.md) | medium | Stage 3 full-page passthrough 对某些 vendor PNG 抛 "Invalid SVG image" |
| [BUG-005](BUG-005-image2-vendor-experience.md) | medium | Image2 vendor 切换体验差——key 不互通、单 vendor 无 fallback、无重试 |

**Next available bug ID: BUG-010**

> BUG-008（image_api_client submit 数组解析）已修，在 `_done/_fixed_bugs/`。BUG-009（Stage 3 loadImage sync race）已修，在 `_done/_fixed_bugs/`。

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
