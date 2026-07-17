# 专题 01: 产品模型与用户工作流

> 总控: [`../html-first-progressive-rendering.md`](../html-first-progressive-rendering.md)
> 状态: 决策完成 | 更新: 2026-07-17

## 为什么废弃 dual-render

旧方案让用户在 project 开始时选择 `html|image2|both`，整页由某个 renderer 拥有，并可能 sequential 或 parallel 运行。该模型有四个根本问题：

1. 初次用户在看到成果前就要理解 renderer、配置 Image2、承担成本和等待。
2. 专业用户虽然需要 Image2 的视觉表现，却仍然需要 HTML 的准确文字和 layout；整页替换会重新引入错字、位置漂移和排版不稳定。
3. 两条平行管线会复制页面身份、缓存、审核、回退和组装选择逻辑。
4. 页面是“HTML page”还是“Image2 page”是错误领域问题。真实问题是：这一页是否有一个已接受的专业主视觉资产。

因此明确废弃：

- project 级 `render.engine: html|image2`
- `build --engine html|image2|both`
- 用户选择 sequential / parallel
- 整页 HTML 与整页 Image2 互相替换
- Image2 绘制必须准确的正文、数字、标签或 callout

## 默认 HTML 交付

1. Intake 不询问渲染引擎，也不要求 Image2 key、endpoint 或 style master。
2. Agent 完成内容与结构后，系统生成全部页面、contact sheet、PPTX 和 notes。
3. 交付语义必须是“PPT 已完成，可以直接使用”，不能称为尚未完成的 preview。
4. 没有明显视觉升级收益时，不主动推销 Image2。
5. 有明显收益时，在正式交付后轻量推荐 2-4 个候选，展示缩略图、当前位置、slide ID、主视觉区、升级原因、预期收益和预计调用数。用户可以直接结束。

这条路径必须让从未配置 Image2 的用户完整创建和交付 deck。

## 可选专业精修

- 第一轮每个被选页面只生成一个候选；推荐 3 页意味着 3 次页面候选调用。若首次精修还缺 style reference，计划必须另外列出其 setup 调用，不能把总调用数说成 3。
- 一批候选一次授权。新增页面、失败重试或下一轮候选都需要新的明确授权。
- 首次授权精修时才配置 `IMAGE2_API_KEY`、`IMAGE2_BASE_URL` 和 Image2 style reference。
- 批次部分失败时，成功页面照常审核；失败页面保持 HTML，并报告已发生调用和失败情况。
- 审核逐页并排展示 HTML 与精修合成版。每页独立选择“采用这一版”或“保留 HTML”。
- 拒绝只是不采用，不删除候选；用户要求再试时才提出下一轮成本。
- 每接受一页就立即持久化并重合成，断线不丢失已做决定。

## 候选生命周期

```text
recommended
    -> batch authorized
    -> generated | failed
    -> reviewed
        -> accepted -> promoted source asset -> current final-slide
        -> keep-html -> fallback remains current
        -> retry requested -> new authorization -> new candidate
```

- 精修期间保留本版全部候选，以支持多轮比较和退回。
- accepted candidate 通过 promotion 成为正式版本资产。收尾时把每页最近一个 rejected candidate 归档到版本关联的 refinement history；其他未接受候选才允许显式清理。
- rejected 不等于删除；清理候选是独立、显式操作。

## 交互文案原则

- 先说成果已完成，再介绍可选升级；不能让用户误以为 HTML 是半成品。
- 用“主视觉精修”而不是“换 renderer”描述能力。
- 授权前说清页面、目的、预计调用数和失败是否收费；不要只给抽象预算。
- 推荐用缩略图 + 原因 + 收益，不用伪精确视觉评分表。
- Agent 提建议，人类拥有最终视觉判断和远端成本决定。

## 旧 deck 体验

- 没有 `html-first-v1` 标记的 deck 保持当前 Image2-first 行为。
- 不在升级框架后自动改版，也不把已有审阅结果作废。
- 迁移时创建 clean vNext，由 Agent 把 free-form prompt 重写成结构化 body，生成完整 HTML 对照稿，再请用户确认。
- 迁移无法合理收敛时，沿用已有逃生路径：新的 vNext，必要时新的 deck；不强求在一个版本内修到完美。
