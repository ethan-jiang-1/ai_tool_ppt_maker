# BUG-033: markerless whole-page deck 的单页迭代缺少经验证的最小合法重跑路径

> 严重级别: P1 | 发现: 2026-07-22 | 状态: 已修复 | 基线校准: 2026-07-23 | 修复: 2026-07-23

## 症状

目标仍然是已交付 markerless whole-page deck 的单页修改：改一页 KICKER/visual brief，只为该页产生必要的新
whole-page bytes，保持未经修改页面的已验证 bytes，然后由 canonical pipeline 重建 header/PPTX/notes。

但原报告把多个不同版本的现象合并了：当前 first-class `image2-only` 已经由 `create-deck` 的
`04-image-production/whole-page` adapter 负责；`legacy-image2-maintenance` 只服务历史 markerless compatibility。
`production_mode.by_version` 是唯一 mode authority，`project-metadata.yaml` 是非权威 mirror，因此“state 有有效
record 但 metadata 缺字段会导致 MODE_MISSING”不再是当前机制。现有 BUG-033 inspection test 也使用 HTML fixture，
它证明了 observation 的 earliest-diagnostic discipline，却没有复现 markerless whole-page 的实际单页路径。

## 保留的不变量

- 新 provider submit 仍必须由 exact selected-slide scope、profile 与 execution-bound authorization 授权；
  不存在靠旧交付物、`--incremental` 或手写 state 获得的免授权路径。
- prompt/visual brief 改变后，该页 provenance 失效是正确行为；未变页面只有在 fingerprint、profile、bytes 与
  manifest lineage 全部 current 时才可本地复用。
- current artifact identity 来自 manifest。文件名只是历史 compatibility fallback；双命名歧义应由 owner 的
  manifest/repair diagnostic 处理，不能通过 glob、手选 PNG 或把 `header_locked/` 提升为手工 canonical source 规避。
- PPTX/notes 必须继续由 canonical assembly 生成，不允许 direct `pptxgenjs` 旁路作为成功证明。

## 当前证据缺口

尚无一个只经支持 public owner interface 建立的 markerless completed fixture，同时覆盖：单页 source change、
未改页 reuse、该页 exact authorization、一次 mocked submit、manifest-driven header/assembly、以及 restart/rerun。
在该 fixture 出现前，不能把 `agent-portrayal.md`、mode mirror、命名冲突或“全量生产设计”写成已确认根因，也不能
预先决定新增 `--incremental`。

## 最小验证

1. 从 supported markerless init/owner workflow 建立至少两页的 completed whole-page run；不手写 state、receipt、
   authorization、manifest、PPTX 或 `_generated/`。
2. 只修改一个 stable `slide_id` 的 source/brief，运行 owner-issued classify/repair/build route。
3. 断言未改页零 provider calls 且 bytes/manifest lineage 保持；改页在没有 exact authorization 时 hard-stop，
   有一次 explicit mocked authorization 后仅提交该页。
4. 断言 Stage 3-5 通过 manifest 重建 current header/PPTX/notes；old filename-only ambiguity 给出 bounded owner
   repair，不能被隐式选择；同一 checkpoint 重跑不重复 submit。

这些是 pure owner/manifest/provider-mock tests，不依赖真实 Image2、浏览器、HTML renderer 或完整 E2E sweep。

## 修复方向

先以该 fixture 将每个事实分为已修复、仍阻断或不复现。若存在真实缺口，后续 change 只能收敛为：

- 一个 selected-slide 的 owner-issued authorization/action，而非 generic bypass；
- 一条由 manifest/provenance 决定的 local reuse + targeted render 路径；
- 一个明确的 legacy artifact repair/migration 诊断，而非新文件命名约定或手工 assembly。

## 非目标

- 不预设 `--incremental`、force/state bypass、prompt-diff 容忍或把 `header_locked/` 变成独立 canonical owner。
- 不把 current `image2-only` first-class route 错写为 legacy compatibility，或将 modern visual-slot refinement 混入此问题。

## 修复关联

通过 CLS-011 agent-workflow-simplification 的三项串行 change 解决：

| Change | 解决的原始症状 |
|---|---|
| `unify-workflow-inspection` | 统一了 workflow 观察面，消除 Agent 需要手工拼接 hash/flag/恢复协议的问题 |
| `simplify-workflow-control-and-interfaces` | 退休 generic node control，收敛 CLI interface，消除 MODE_MISSING 等多重推导不一致 |
| `realign-image-production-and-framework-governance` | `production_mode.by_version` 成为唯一 mode authority；`04-image-production/whole-page` adapter 承担 first-class `image2-only`；manifest 成为 canonical artifact identity |

原始六条症状中：#2（MODE_MISSING）已修复；#3（授权门禁）与 #4（provenance 指纹）重新分类为保留不变量（正确行为）；#1、#5、#6 被架构收敛消除。剩余"markerless fixture 证据缺口"转跟踪为测试覆盖任务，不再作为阻断 bug 保持活跃。
