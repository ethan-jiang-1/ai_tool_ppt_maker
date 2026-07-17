# Plan: HTML-first 渐进式渲染

> 类型: 总控设计 | 状态: 架构已锁定，待 Change 1 外部事实核验与 propose | 更新: 2026-07-17
> 上游: [`slide-identity-and-sequence-editing`](../_done/_closed_plans/slide-identity-and-sequence-editing.md)（已落地并归档）
> 专题目录: [`html-first-progressive-rendering/`](html-first-progressive-rendering/)
> 原始记录: 由 `_backlog/todos/todo-dual-render-pipeline.md` 升级、改名而来

## 北极星

这不是 HTML 与 Image2 二选一的双管线，而是一条渐进式工作流：

```text
renderer-neutral 结构化 Slide 内容
                  |
                  v
HTML 确定性排版并生成完整、可直接交付的 PPTX
                  |
         用户满意 -> 到此结束
                  |
     Agent 推荐 2-4 个高价值主视觉区
                  |
        用户明确授权 Image2 成本
                  |
      Image2 只生成无文字主视觉素材
                  |
                  v
HTML 确定性重合成 -> 逐页接受或保留 HTML
```

HTML 始终拥有 kicker、title、subtitle、body、KPI、标签、卡片、图表文字、callout 和精确位置。Image2 每页最多处理一个主视觉区，只负责大片 body 视觉中的插画、场景、材质、象征物或无文字复杂构图。

HTML 不是低配预览；它是所有新用户都会得到的正式成品。Image2 是可选、昂贵、耗时的专业精修阶段。

## 锁定决策

| 主题 | 决策 |
|---|---|
| 默认路径 | 所有新 deck 先完成 HTML 成品，不在 intake 询问 renderer |
| Image2 角色 | 只增强可选主视觉区，不拥有整页 layout 或准确文字 |
| 精修数量 | 每页最多一个主视觉区；首轮每个候选页生成一张图 |
| 推荐方式 | HTML 交付后，仅在确有收益时推荐 2-4 页 |
| 成本授权 | 一批一次授权；新增页、重试、下一轮重新授权 |
| 审核方式 | 逐页比较；独立采用精修或保留 HTML |
| 候选保留 | 本版打磨期间全部保留；accepted 提升为正式资产，recent rejected 收尾时归档一份 |
| 内容溢出 | 阻断并交给 Agent 修正文案/family；不缩微、不截断、不自动拆页 |
| 旧 deck | 保持 Image2-first，只有显式迁移才进入新流程 |
| PPTX 形态 | 继续每页一张高分辨率全幅图片，不做原生可编辑对象 |

## 专题导航

按下面顺序阅读；每份文档只拥有一个问题域：

| # | 专题 | 负责回答 |
|---|---|---|
| 1 | [`01-product-workflow.md`](html-first-progressive-rendering/01-product-workflow.md) | 为什么不是 dual-render；小白与专业用户怎样完成工作 |
| 2 | [`02-slide-content-and-layout.md`](html-first-progressive-rendering/02-slide-content-and-layout.md) | renderer-neutral 内容真相、visual selection binding 和 overflow |
| 3 | [`02a-layout-family-contracts.md`](html-first-progressive-rendering/02a-layout-family-contracts.md) | 10 个 family 的字段、容量、slot geometry 和 fallback 合同 |
| 4 | [`03-rendering-runtime.md`](html-first-progressive-rendering/03-rendering-runtime.md) | visual config、Playwright/Chromium、字体和 readiness |
| 5 | [`04-run-bundle-and-artifacts.md`](html-first-progressive-rendering/04-run-bundle-and-artifacts.md) | 文件放哪里、谁拥有、如何寻址、怎样跨版本失效/复用 |
| 6 | [`05-refinement-transactions-and-interfaces.md`](html-first-progressive-rendering/05-refinement-transactions-and-interfaces.md) | 候选生成、成本计划、promotion transaction、CLI/MD interface |
| 7 | [`06-delivery-roadmap-and-verification.md`](html-first-progressive-rendering/06-delivery-roadmap-and-verification.md) | OpenSpec changes 顺序、测试、风险和 non-goals |
| 8 | [`07-framework-directory-impact.md`](html-first-progressive-rendering/07-framework-directory-impact.md) | `PPTMAKER_FRAMEWORK/` 尤其 `workflow/` 的最终目标树、逐文件迁移和 change 落点 |

专题之间通过链接引用，不复制另一专题的 schema。若专题与本总控的锁定决策冲突，以本页为当前产品决策；若未来 OpenSpec main spec 已落地，则以 main spec 为实现权威并回写本计划状态。

## 依赖与阶段

```text
已完成地基
stable slide_id + derived position + artifact provenance
                         |
                         v
1. runtime readiness -> 2. structured body/layout
                                  |
                                  v
                    3. HTML-first delivery + default workflow
                                  |
                                  v
                    4. optional Image2 visual refinement
```

| 阶段 | OpenSpec change | 状态 | 完成定义 |
|---|---|---|---|
| 1 | `upgrade-html-render-runtime-readiness` | 待 propose | Node 22、固定 Chromium/字体、分层 doctor 契约定稿并归档 |
| 2 | `add-structured-html-slide-contract` | 等待阶段 1 | 新 schema、families、visual config、asset merge 可独立验证 |
| 3 | `deliver-html-first-decks` | 等待阶段 2 | HTML renderer、assembly、新 deck 默认、基础 UX 与 legacy migration 一次形成可交付垂直切片 |
| 4 | `add-image2-visual-slot-refinement` | 等待阶段 3 | 授权、候选、逐页采用/回退、promotion、provenance 与专业 UX 闭环 |

每个 change 单独 propose、review、apply、validate、archive。前一个 change 归档并同步 main specs 后，才开始下一个；四个 change 不再继续细拆，也不得反向合成一个巨型 change。每个 change 的具体任务包、影响 capability 和独立完成线见 [`06-delivery-roadmap-and-verification.md`](html-first-progressive-rendering/06-delivery-roadmap-and-verification.md)。

## 全局不变量

1. `slide_id` 是稳定身份，`position` 只是当前顺序投影；任何昂贵 artifact fingerprint 排除 position。
2. `slide-specifications.md` 是页面内容与正式 visual selection 的 source；`_generated/` 不手改。
3. HTML 是唯一整页 compositor；Stage 4 只消费 verified `final-slide`。
4. Image2 不绘制必须准确的文字、数字、刻度、标签或图表。
5. 结构编辑、materialization 和普通 HTML build 不得暗中调用远端 renderer。
6. 任何远端成本先有明确 scope、预计调用数和用户授权；不得自动扩大或重试。
7. 已接受 Image2 候选必须提升为版本 source asset，并绑定其适用的 visual contract fingerprint；确保删掉 `_generated/` 后仍可零远端重建。
8. legacy deck 不猜测迁移；Agent 在 clean vNext 重写结构化 body 并向用户展示对照结果。

## 当前下一步

从阶段 1 `upgrade-html-render-runtime-readiness` 开始 `openspec propose`。提案前只需补齐两个随时间变化的外部事实：

- 当前 Playwright 支持的 Node/Chromium 组合及离线安装方式；
- 准备随框架分发的 Latin/CJK 字体及许可证。

其余产品、目录、schema、UX 和阶段决策已在专题文档中固定，不应在 Change 1 重新发散。
