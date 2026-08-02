# Suspended Bugs — 悬挂 bug 归档

> 最后更新: 2026-08-02 | `_backlog/_done/_suspened_bugs/` — 暂未确认修复的 bug。
> `_` 前缀 = coding agent 默认忽略，除非显式点名要读。

这里放**已排查、但尚未确认修复**的 bug：可能难复现、依赖上游、或优先级压低暂缓。它们仍占用 BUG-NNN 编号（编号权威见 [`../_fixed_bugs/README.md`](../_fixed_bugs/README.md)）。

- 悬挂 → 修复：`git mv` 到 `../_fixed_bugs/`，按 fixed 的接收步骤更新。
- 活跃 → 悬挂：从 `../../bugs/` `git mv` 进来，并在 `../_fixed_bugs/README.md` 的 "Suspended" 段登记。

---

## 悬挂列表

| ID | Date | Title |
|----|------|-------|
| [BUG-038](BUG-038-text-frame-dark-overlay-conflicts-warm-editorial.md) | 2026-08-02 | Historical dark Text Frame compositor retired; current `standard-v1` is warm-themed. |
| [BUG-039](BUG-039-async-generate-naming-mismatch.md) | 2026-08-02 | Historical scratch generator naming split is absent from the current stable-ID raw owner. |
