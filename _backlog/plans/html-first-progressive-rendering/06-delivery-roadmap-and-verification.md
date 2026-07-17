# 专题 06: OpenSpec 路线与验收

> 总控: [`../html-first-progressive-rendering.md`](../html-first-progressive-rendering.md)
> 状态: 决策完成，待 Change 1 propose | 更新: 2026-07-17

## Change 1: `upgrade-html-render-runtime-readiness`

- Node 22 baseline 与文档/doctor 一致性
- Playwright/Chromium 固定安装和离线运行规则
- bundled Latin/CJK fonts 与严格字体验证
- base HTML readiness / Image2 refinement readiness 分层

完成定义：相关 main/delta specs、runtime、doctor、docs 和 tests 一致；无 Image2 条件可通过 base readiness。

## Change 2: `add-structured-slide-body-contract`

- `html-first-v1` 标记和 `SLIDE BODY` schema
- layout family registry、字段/容量/overflow validation
- renderer-neutral visual config 扩展
- backbone + override asset manifest 按 ID 合并
- legacy Image2-first parsing 隔离

完成定义：每个 family 有 discriminated schema、slot geometry、fallback 和容量测试；新旧 parser 分支可独立验证，source round-trip 不破坏其他内容。

## Change 3: `add-html-first-render-and-assembly`

- self-contained HTML document renderer
- chart/SVG/local asset adapter
- `html_pages` 与 `final_slides` manifest
- deep composition module interface
- Stage 4 改为 provider-neutral final-slide consumer
- 显式 `html-first-v1` deck 完整 contact sheet/PPTX/notes 交付；尚不改变新 deck 默认入口

完成定义：无 Image2 key/style master 的显式 HTML-first fixture 通过 E2E 生成可交付成品。

## Change 4: `add-image2-visual-slot-refinement`

- refinement plan + plan hash + cost scope
- 每页一个 primary visual slot、首轮一个候选
- output-SHA-addressed candidate provenance
- 部分失败、无自动重试、逐页审核
- atomic asset promotion / use-html / candidate cleanup
- version-scoped review evidence 与跨版本复用
- exactly-once attempt consumption、unknown-submit 对账与 comparison preview

完成定义：授权、候选、接受、回退、恢复和清理形成可重放闭环，任何远端调用都有 scope evidence。

## Change 5: `adopt-progressive-rendering-workflow`

- BOOTSTRAP、COMMANDS、create/edit playbooks 和 change classifier
- “HTML 已完成”交付语义与 2-4 页轻量推荐
- 首次精修才进行 Image2 onboarding
- side-by-side review 和逐页接受 UX
- legacy deck 显式迁移到 clean vNext 的 Agent-led 流程
- 在本 change 才把新 deck/template 默认切换到 `html-first-v1`

完成定义：新手路径不暴露不必要的 Image2 配置；专业路径可发现、透明、可中断恢复。

## Test matrix

### 内容与 layout

- 每个 family 覆盖正常、边界、非法字段和 overflow。
- overflow 不截字、不缩微、不改变页数；diagnostic 精确定位 slot。
- kicker/title/body/KPI/callout 始终由 HTML 绘制。
- Image2 prompt 不含准确文字/数字职责。
- legacy deck 继续走旧 parser；新 deck 不要求 `IMAGE PROMPT`。

### HTML renderer

- 无 Image2 凭据和 style master 可完成 contact sheet、PPTX 和 notes。
- 固定 runtime 重复渲染得到相同尺寸、稳定 layout、当前 fingerprint 和非空像素。
- 外部网络、service worker、动画和字体 fallback 被阻断或明确失败。
- Chromium 不在 render 时下载。
- Latin/CJK 字体缺失或缺字时阻断。

### Refinement 与 provenance

- 未授权、stale plan hash、扩大 scope、额外重试不调用 provider。
- 批次部分失败不影响成功页审核或 HTML 成品。
- 相同 generation fingerprint 的多个 output SHA 候选共存且不覆盖。
- 同一 attempt 重放不重复 submit；unknown-submit 不自动重试。
- accept、use-html、重复 accept、clean 和 promotion 中断保持 source/asset/state 自洽。
- 接受证据绑定 candidate SHA。
- 用户审核的 candidate-composed preview 与最终 accept 使用相同 slot geometry/crop。
- 删除 `_generated` 后，正式 accepted asset 可零远端逐字节重建 final slide。

### 版本与 E2E

- 纯重排保持 slide ID 和昂贵 visual identity，零远端完成新版本。
- slot/content/config 改变使 refinement stale 并回退 HTML。
- E2E 覆盖纯 HTML、2-4 页精修、失败后再授权、逐页回退、跨版本复用和 legacy 显式迁移。
- `npm test`、相关 `tests_e2e`、OpenSpec strict validation 和 bundle layout self-check 通过。

## 风险与缓解

| 风险 | 缓解 |
|---|---|
| 结构化 body 变成过重 DSL | v1 只提供 10 个 tested families 和少量 typed slots；Agent authoring |
| HTML 模板同质化 | visual config、正式资产和主视觉 slot 提供变化；layout 仍稳定 |
| Image2 候选占磁盘 | 本版全留；accepted 提升为 source asset，recent rejected 收尾归档一份后再清理 |
| `_generated` 可删与昂贵候选冲突 | accepted 即提升为 version source asset；删除前提示未接受候选 |
| override 遮蔽 backbone assets | manifest 按 asset ID merge |
| 字体导致跨平台换行漂移 | bundled licensed fonts + pinned Chromium + strict verification |
| change 范围失控 | 严格按 readiness -> schema -> HTML -> refinement -> UX 归档推进 |
| 用户误以为 HTML 是半成品 | 先宣告完整交付；精修只作为有收益时的追加 |

## Non-Goals

- 不输出 PowerPoint 原生可编辑文本/图表对象。
- 不允许任意 per-slide HTML/CSS authoring。
- 不允许一页多个独立 Image2 slot。
- 不让 Image2 绘制准确文字、数据图表或承担整页 layout。
- 不为旧 deck 自动解析 prompt 或自动迁移。
- 不在结构编辑、materialization 或普通 HTML build 中暗中调用 Image2。
- 不承诺不同 OS 的任意浏览器环境 pixel-identical。

## 执行纪律

每个 change 单独 propose、review、apply、validate、archive。后一个 change 只依赖已经归档并同步到 main specs 的行为，不能依赖聊天或未落地的未来接口。
