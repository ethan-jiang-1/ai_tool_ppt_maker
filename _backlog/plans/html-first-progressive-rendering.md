# Plan: HTML-first 渐进式渲染

> 类型: 总控设计 | 状态: 架构已锁定；Change 1 已完成多轮对抗性 review，apply-ready | 更新: 2026-07-18
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
      Image2 只生成无文字主视觉素材候选
                  |
                  v
HTML 确定性重合成 -> 逐页接受或保留 HTML
```

HTML 始终拥有 kicker、title、subtitle、body、KPI、标签、卡片、图表文字、callout 和精确位置。Image2 不是第二个整页 renderer，而是每页最多生成一个主视觉区候选；它只负责大片 body 视觉中的插画、场景、材质、象征物或无文字复杂构图。候选只有在用户接受并 promotion 成正式 source asset 后，才回到 HTML compositor 重合成。

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
| 候选保留 | 本版打磨期间保留在 version-owned Image2 派生区；accepted 提升为正式资产，rejected 不写入 upstream material，cleanup 显式处理 |
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
| 5 | [`04-run-bundle-and-artifacts.md`](html-first-progressive-rendering/04-run-bundle-and-artifacts.md) | HTML 主交付与 Image2 派生/正式资产的物理目录、所有权、寻址和失效 |
| 6 | [`05-refinement-transactions-and-interfaces.md`](html-first-progressive-rendering/05-refinement-transactions-and-interfaces.md) | Image2 候选生成、成本计划、promotion transaction、CLI/MD interface |
| 7 | [`06-framework-directory-impact.md`](html-first-progressive-rendering/06-framework-directory-impact.md) | `workflow/`、`playbook/` 最终目标树及其与 run bundle 的 ownership 对齐 |
| 8 | [`07-delivery-roadmap-and-verification.md`](html-first-progressive-rendering/07-delivery-roadmap-and-verification.md) | 最终 OpenSpec changes 顺序、任务包、测试矩阵、风险和执行纪律 |

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
                    4. optional Image2 visual-slot asset upgrade
```

| 阶段 | OpenSpec change | 状态 | 完成定义 |
|---|---|---|---|
| 1 | `upgrade-html-render-runtime-readiness` | Propose + Review 完成；等待 Apply | 固定 Node/browser/font runtime 可安装、可诊断，base/Image2 readiness 分层且 legacy 行为不回归 |
| 2 | `add-structured-html-slide-contract` | 等待阶段 1 | 新 schema、families、visual config、asset merge 可独立验证 |
| 3 | `deliver-html-first-decks` | 等待阶段 2 | HTML renderer、assembly、新 deck 默认、基础 UX 与 legacy migration 一次形成可交付垂直切片 |
| 4 | `add-image2-visual-slot-refinement` | 等待阶段 3 | 授权、候选、逐页采用/回退、promotion、provenance 与专业 UX 闭环 |

每个 change 单独 propose、review、apply、validate、archive。前一个 change 归档并同步 main specs 后，才开始下一个；四个 change 不再继续细拆，也不得反向合成一个巨型 change。每个 change 的具体任务包、影响 capability 和独立完成线见最后一篇 [`07-delivery-roadmap-and-verification.md`](html-first-progressive-rendering/07-delivery-roadmap-and-verification.md)。

## 全局不变量

1. `slide_id` 是稳定身份，`position` 只是当前顺序投影；任何昂贵 artifact fingerprint 排除 position。
2. `slide-specifications.md` 是页面内容与正式 visual selection 的 source；`_generated/` 不手改。
3. HTML 是唯一整页 compositor；Stage 4 只消费 verified `final-slide`。
4. Image2 不绘制必须准确的文字、数字、刻度、标签或图表。
5. 结构编辑、materialization 和普通 HTML build 不得暗中调用远端 renderer。
6. 任何远端成本先有明确 scope、预计调用数和用户授权；不得自动扩大或重试。
7. 已接受 Image2 候选必须提升为版本 source asset，并绑定其适用的 visual contract fingerprint；确保删掉 `_generated/` 后仍可零远端重建。
8. `1_upstream_raw_material/` 只拥有上游素材；HTML 生成物、Image2 候选、rejected history 和 transport receipts 不得混入其中。
9. 新 HTML-first version 的 `_generated/html_production/` 是完整交付线，`_generated/image2_refinement/` 是可选付费线；普通 HTML iteration 不创建 Image2 authorization。
10. legacy deck 不猜测迁移；Agent 在 clean vNext 重写结构化 body 并向用户展示对照结果。
11. selection 的语义适用性与 asset 的物理完整性分开判断：contract stale 可以明确回退 HTML；current selection 指向缺失、未登记或 SHA 不符的正式资产时必须阻断，不能伪装成正常 fallback。
12. provider profile、style reference 和生成 reference assets 只决定下一张候选怎样生成；它们不追溯性废除已接受像素。会改变当前页面视觉语义或构图的 renderer-neutral tokens 必须通过 versioned dependency projection 进入 visual contract fingerprint。

## 当前下一步

架构打磨已完成：selection applicability / asset integrity / generation provenance 已分层，五条端到端路径与四个归档点已反证，workflow/playbook/run-bundle/state/CLI ownership 已统一，内部链接与 diff 格式检查通过。

Change 1 `upgrade-html-render-runtime-readiness` 已依据本计划完整重写 proposal/design/specs/tasks，并完成多轮对抗性 review。最终版本收紧了 Node support profile、mutable font snapshot、浏览器实际字体证据、smoke timeout/cleanup、canonical package-root loading、lazy submit guard、live redirect/no-retry、JSON stdout purity、重复 probe 避免及跨平台 CI 证据；strict OpenSpec、capability/task 对应、19 个 MODIFIED requirement 场景保留、远程入口清单、范围与 diff 格式均通过，当前 apply-ready。Change 2 继续等待 Change 1 apply、validate、sync 和 archive 完成。
