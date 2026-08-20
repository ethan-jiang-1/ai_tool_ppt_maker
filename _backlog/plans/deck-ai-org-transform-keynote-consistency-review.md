# Plan: deck_ai_org_transform_keynote 一致性与 Harness 适配复盘

> 类型: 分析 / 复盘 | 更新: 2026-08-20

## 范围

审查 `deck_ai_org_transform_keynote` 的 backbone、上游摘要、讲稿、v1 slide
specification、视觉配置、Lab、lessons 和当前 Page Image state。Harness 源码与测试只做
只读核验；Harness 修复由 BUG-093 及其 fixed change 负责。

## 当前结论

- 叙事主线自洽：个人能力跃迁 -> 组织未自动获得价值 -> 软件工作单元与 Harness -> 企业重做责任/角色/基础设施 -> 一把手选择入口并形成学习闭环。
- 14 页顺序、stable slide IDs、三家案例独占第 8–10 页、两条核心公式和 Q&A 收束互相一致。
- 证据边界总体诚实：Block、Cloudflare、JPMorgan 被当作不同路径的案例，不被写成排名、统一标准答案或已独立验证的 ROI。
- Page Image 当前为单一 `pure` workflow；Style Master 已通过 successor plan 重新接受；raw plan 已按 source epoch 4 重建，14 页均为 `unsubmitted`。

## 已修复的数据漂移

1. `story-outline.md` 曾把独立标题页算进 Block 1 的 `1–3` 页范围，和其余文档的 `2–3` 页定义不一致；现已改为 Block 1 `2–3`。
2. `continuation-handoff.md` 曾保留旧的 source epoch、raw plan hash 和 Style Master 状态；现已更新到 source epoch 4、当前 raw plan `39f972bc...` 和 successor Style Master。
3. `_lessons/image2-vendor-experiments.md` 曾把实验当天的 Packy/Harness 限制写成当前事实；现已明确为历史观察，并把当前判断交给 profile、owner 输出和 state。

## 尚未构成矛盾的边界

- `project-metadata.yaml` 的静态主题字段仍为空，但 content/visual gate 和正文 source 已有内容；这不是当前生产协议镜像，不应为“看起来完整”而手填推断值。
- `_scratch/` 中的旧 PNG、manifest 和脚本仍是历史比较材料，不能提升为当前 Lab trial、raw evidence 或 delivery evidence。
- Packy 的历史成功证明了 deck-local Call Shape 候选，不等于当前 profile 已获得新 provider 事实，也不等于生产授权。

## 当前下一步

由 progressive raw owner 选择代表性 Pilot 的 exact slide IDs；此后按现行 authorization
和 generate/review/delivery gates 继续。当前没有远端提交、raw image、final manifest、PPTX
或 delivery receipt。
