# Suspended Bugs — 悬挂 bug 归档

> 最后更新: 2026-08-20 | `_backlog/_done/_suspended_bugs/` — 已排查、不再当活跃 bug 修的条目。
> `_` 前缀 = coding agent 默认忽略，除非显式点名要读。

本目录是本仓库 **wontfix / 暂不修** 的唯一落点。编号仍占用 BUG-NNN（权威见 [`../_fixed_bugs/README.md`](../_fixed_bugs/README.md)）。

- 悬挂 → 修复：`git mv` 到 `../_fixed_bugs/`，按 fixed 的接收步骤更新。
- 活跃 → 悬挂：从 `../../bugs/` `git mv` 进来，并在 `../_fixed_bugs/README.md` 的 "Suspended" 段登记。
- 拒绝理由写在 **该 bug 卡片的 triage 段** 和下面的主题分组，不另开仓库根目录。

两种来源：

1. **历史悬挂**（038、039）：路径已退役，现场不再复现。
2. **2026-08-20 triage wontfix**：相对现行 spec 不是缺陷，或 Maintainer 明确不做。

---

## 悬挂列表

| ID | Date | Title |
|----|------|-------|
| [BUG-038](BUG-038-text-frame-dark-overlay-conflicts-warm-editorial.md) | 2026-08-02 | Historical dark Text Frame compositor retired; current `standard-v1` is warm-themed. |
| [BUG-039](BUG-039-async-generate-naming-mismatch.md) | 2026-08-02 | Historical scratch generator naming split is absent from the current stable-ID raw owner. |
| [BUG-075](BUG-075-onboarding-missing-upstream-material-first-step.md) | 2026-08-20 | triage wontfix：不上游素材 gate |
| [BUG-076](BUG-076-missing-layer-boundary-1-2-3-charter.md) | 2026-08-20 | triage wontfix：三层表不是散文 DAG |
| [BUG-080](BUG-080-onboarding-no-progress-map-and-no-plain-framed-pure.md) | 2026-08-20 | triage wontfix：Agent 翻译 framed/pure |
| [BUG-082](BUG-082-downstream-success-output-violates-success-handoff-contract.md) | 2026-08-20 | triage wontfix：CLI JSON 保持 Agent 面 |
| [BUG-083](BUG-083-provider-spend-no-plain-cost-disclosure.md) | 2026-08-20 | triage wontfix：不编价目表 |
| [BUG-084](BUG-084-proceed-repair-redirect-gates-all-jargon.md) | 2026-08-20 | triage wontfix：Gate 枚举保持机器契约 |
| [BUG-086](BUG-086-downstream-terminology-all-jargon.md) | 2026-08-20 | triage wontfix：glossary 保持路径图 |
| [BUG-087](BUG-087-image2-known-failure-has-no-item-recovery.md) | 2026-08-20 | triage wontfix：known_failure exit 0 是成功记录；全失败断裂是 BUG-088 |
| [BUG-089](BUG-089-image2-plan-exceeds-declared-provider-prompt-budget.md) | 2026-08-20 | triage wontfix：量错了 inspection request JSON，不是 compiled prompt |
| [BUG-091](BUG-091-special-page-class-accepts-forbidden-body-items.md) | 2026-08-20 | triage wontfix：PAGE CLASS OVERRIDE 留 deck-local |
| [BUG-092](BUG-092-approved-preview-images-have-no-legal-pptx-path.md) | 2026-08-20 | triage wontfix：不开 scratch→PPTX |

## 2026-08-20 主题分组

拒绝理由以各卡 triage 段为准。这里只方便以后别再当成新 bug 重开。

| 主题 | IDs | 一句话 |
|------|-----|--------|
| CLI/playbook 保持 Agent 机器面 | 075, 080, 082, 084, 086 | Purpose/Outcome/Next、Gate 白话、进度地图由 Agent 翻译 |
| 三层梯度不是 DAG | 076 | 目录表不是「禁止提到下层路径」 |
| 不编 provider 价目 | 083 | Task Mandate 覆盖普通花费 |
| known_failure 退出语义 | 087 | exit 0 是成功记账；卡住的是 088 |
| prompt 准入量错字段 | 089 | 量的是 inspection 整份 request JSON |
| PAGE CLASS 正文闭集 | 091 | design-system 散文留在 deck，不进 Harness validate |
| `_scratch/` 洗成 PPTX | 092 | 官方 delivery 走 090 能力矢量，不开旁路 |
