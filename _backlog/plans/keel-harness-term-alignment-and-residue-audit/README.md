# Keel 架构体检 — 索引

> 2026-08-13 | 只读扫描已完成，结论落地走 `openspec/changes/`

- [plan.md](plan.md) — 体检计划（背景 / 方案 / 风险 / 落地）
- [progress-plan.md](progress-plan.md) — 落地顺序（C1/C2 两个 openspec change + H 直接清理）
- [authority-map.md](authority-map.md) — 权威来源地图：每个核心术语的权威文件 + 冲突来源
- [term-drift.md](term-drift.md) — 术语漂移清单：13 处同概念不同叫法，附 file:line + 修复优先级
- [residue-list.md](residue-list.md) — 残留清单：delete / keep(刷新) / archive / 待拍板

**一句话结论**：`PPTMAKER_FRAMEWORK → ppt_maker_harness` 改名在 live 代码里已彻底完成（残留只在 archive 和用户 memory）；真正要清的是「术语漂移」（最高信号 = Phase vs method module 两套编号）和「三件硬残留」（`.DS_Store`/`.env.saved`/`skills-lock.json`）。
