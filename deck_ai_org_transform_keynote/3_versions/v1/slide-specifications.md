---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

# Page Image current source

## Slide 01: `AiLeap`
**KICKER**: AI 组织转型
**TITLE**: 从个人能力跃迁到组织能力
**SUBTITLE**: AI 不只是加到原来的组织上，而是让新的工作回路被组织接住。
**PAGE CLASS**: opening
**VISUAL BRIEF**:
```yaml
recipe: org-transform
composition: title-pause
motifs: []
negative_constraints:
  - no-logo
  - no-watermark
```

**SLIDE BODY**:
```yaml
items:
  - role: supporting_copy
    literal: "个人能力跃迁 × 业务连接 × 组织机制 = 可持续的 AI 转型"
```

> **SPEAKER NOTE**: 先把全场主命题立住：变化已经发生，但只有被业务和组织接住，才会成为转型。标题页不展开论证。

## Slide 02: `OrgGap`
**KICKER**: 第一处断层
**TITLE**: 个人已经变了，组织价值没有自动出现
**SUBTITLE**: AI 转型最先发生在一个人的工作方式里，而不是企业战略里。
**VISUAL BRIEF**:
```yaml
recipe: org-transform
composition: left-to-right-flow
motifs: [fulcrum-lever]
negative_constraints:
  - no-logo
  - no-watermark
```

**SLIDE BODY**:
```yaml
items:
  - role: label
    literal: "AI 转型"
  - role: supporting_copy
    literal: "从一个人的工作回路开始"
```

> **SPEAKER NOTE**: 让听众承认：这不是等待未来的命题，变化已经从个人工作方式开始。

## Slide 03: `WorkArc`
**KICKER**: 杠杆与支点
**TITLE**: AI 放大的不是组织，而是组织已有的能力
**SUBTITLE**: 杠杆的关键不是更用力，而是找到离困难最近的支点。
**VISUAL BRIEF**:
```yaml
recipe: org-transform
composition: specialist-generalist
motifs: [fulcrum-lever, responsibility-owner]
negative_constraints:
  - no-logo
  - no-watermark
```

**SLIDE BODY**:
```yaml
items:
  - role: label
    literal: "个人能力跃迁"
  - role: label
    literal: "业务连接"
  - role: label
    literal: "组织机制"
  - role: callout
    literal: "组织价值不会自动出现"
```

> **SPEAKER NOTE**: 解释碳基个体和硅基系统的差异，但把结论落回杠杆隐喻：支点选错，噪声和错误判断也会被放大。软件行业随后成为第一个完整接住杠杆的样本。

## Slide 04: `CodeRise`
**KICKER**: 软件先行
**TITLE**: 软件行业先跑通了完整工作回路
**SUBTITLE**: 结构化上下文、可调用工具和快速反馈，让 AI 从回答进入执行。
**VISUAL BRIEF**:
```yaml
recipe: org-transform
composition: left-to-right-flow
motifs: [verification-rails]
negative_constraints:
  - no-logo
  - no-watermark
```

**SLIDE BODY**:
```yaml
items:
  - role: label
    literal: "怀疑"
  - role: label
    literal: "生产"
  - role: supporting_copy
    literal: "同一批 Martin Fowler retreat 参与者，在约 5 个月内完成语气翻转"
```

> **SPEAKER NOTE**: 用 retreat 的时间切片建立拐点感，但提醒这是早期采用者社区的真实切片。

## Slide 05: `ModFit`
**KICKER**: 工作单元改变
**TITLE**: 从一个回答，到一条可验证的工作回路
**SUBTITLE**: 聊天问答 → 小任务协作 → 多步执行 → Agent 化工作流。
**VISUAL BRIEF**:
```yaml
recipe: org-transform
composition: left-to-right-flow
motifs: [verification-rails]
negative_constraints:
  - no-logo
  - no-watermark
```

**SLIDE BODY**:
```yaml
items:
  - role: label
    literal: "上下文"
  - role: label
    literal: "工具"
  - role: label
    literal: "规则"
  - role: label
    literal: "反馈"
```

> **SPEAKER NOTE**: 核心变化不是模型突然变成员工，而是工作单元逐步变完整。

## Slide 06: `RailCue`
**KICKER**: Agent 的构成
**TITLE**: Agent = Model + Harness
**SUBTITLE**: 模型提供理解与生成，Harness 把行动、反馈、评估和交接接起来。
**VISUAL BRIEF**:
```yaml
recipe: org-transform
composition: stack
motifs: [verification-rails]
negative_constraints:
  - no-logo
  - no-watermark
```

**SLIDE BODY**:
```yaml
items:
  - role: diagram_text
    literal: "Model"
  - role: diagram_text
    literal: "Harness"
  - role: callout
    literal: "多快知道写得对不对"
  - role: supporting_copy
    literal: "软件行业先跑通了人定义目标、Agent 执行、系统验证的回路"
```

> **SPEAKER NOTE**: 把 Guides + Sensors 讲清楚：行动前引导，行动后反馈。瓶颈从写得快不快转向多快知道写得对不对。

## Slide 07: `OrgLink`
**KICKER**: 跨行业转场
**TITLE**: 企业要迁移的不是 Coding Agent，而是工作回路
**SUBTITLE**: 企业流程还要补上业务上下文、权限、审计、人工升级和结果责任。
**PAGE CLASS**: transition
**VISUAL BRIEF**:
```yaml
recipe: org-transform
composition: centered-constellation
motifs: [responsibility-owner]
negative_constraints:
  - no-logo
  - no-watermark
```

**SLIDE BODY**:
```yaml
items:
  - role: label
    literal: "推理"
  - role: label
    literal: "执行"
  - role: label
    literal: "反馈"
  - role: label
    literal: "责任"
```

> **SPEAKER NOTE**: 软件只是先行样本。企业不能复制表面上的 Coding Agent，而要重做把推理、执行、反馈和责任接起来的接口。

## Slide 08: `BlkOwn`
**KICKER**: 案例一 / Block
**TITLE**: 从岗位所有权，转向问题所有权
**SUBTITLE**: DRI 在 90 天内成为一个问题的 CEO；AI 提供上下文、工具与协调能力。
**VISUAL BRIEF**:
```yaml
recipe: org-transform
composition: centered-constellation
motifs: [responsibility-owner]
negative_constraints:
  - no-logo
  - no-watermark
```

**SLIDE BODY**:
```yaml
items:
  - role: label
    literal: "责任接口"
  - role: metric
    literal: "90 天"
  - role: supporting_copy
    literal: "路径：重构责任与层级。证据边界：案例说明一种选择，不是通用裁员答案。"
```

> **SPEAKER NOTE**: Block 的关键不是“用了 AI”，而是把责任从岗位层级移到问题所有权。诚实保留组织代价和证据边界。

## Slide 09: `ClouOS`
**KICKER**: 案例二 / Cloudflare
**TITLE**: 不是减少角色，而是重组角色
**SUBTITLE**: Builders、Sellers、Measurers 加上内部 Cloudflare OS，让非技术部门也能构建工作流。
**VISUAL BRIEF**:
```yaml
recipe: org-transform
composition: three-column
motifs: [platform-stack]
negative_constraints:
  - no-logo
  - no-watermark
```

**SLIDE BODY**:
```yaml
items:
  - role: label
    literal: "Builders"
  - role: label
    literal: "Sellers"
  - role: label
    literal: "Measurers"
  - role: supporting_copy
    literal: "路径：角色组合重构。证据边界：平台与角色设计仍需业务验证。"
```

> **SPEAKER NOTE**: Cloudflare 的选择是角色重组和内部平台化，不是把所有人都变成工程师。重点是协作接口被重新设计。

## Slide 10: `JpBase`
**KICKER**: 案例三 / JPMorgan
**TITLE**: 把 AI 从实验预算，重分类为核心基础设施
**SUBTITLE**: LLM Suite、培训、自然流失与再部署，构成渐进式的人才结构改变。
**VISUAL BRIEF**:
```yaml
recipe: org-transform
composition: stack
motifs: [platform-stack]
negative_constraints:
  - no-logo
  - no-watermark
```

**SLIDE BODY**:
```yaml
items:
  - role: label
    literal: "平台"
  - role: label
    literal: "培训"
  - role: label
    literal: "再部署"
  - role: supporting_copy
    literal: "路径：平台化、渐进式重构。价值看收入、成本、周期、质量、风险与学习，而非调用次数。"
```

> **SPEAKER NOTE**: JPMorgan 代表另一条路：先把底座建成核心基础设施，再通过培训、自然流失和再部署渐进改变人才结构。

## Slide 11: `ExecAct`
**KICKER**: 组织公式
**TITLE**: 路可以不同，最后都要解决同一组接口
**SUBTITLE**: 组织竞争力 = 人才密度 × AI 杠杆 / 组织摩擦
**VISUAL BRIEF**:
```yaml
recipe: org-transform
composition: centered-constellation
motifs: [platform-stack]
negative_constraints:
  - no-logo
  - no-watermark
```

**SLIDE BODY**:
```yaml
items:
  - role: metric
    literal: "人才密度 × AI 杠杆 / 组织摩擦"
  - role: label
    literal: "人机如何配合"
  - role: label
    literal: "系统如何协作"
  - role: label
    literal: "结果由谁负责"
```

> **SPEAKER NOTE**: 把三个案例收束成同一个判断：重构可以从责任、角色、平台或基础设施开始，但不能停在部署。

## Slide 12: `OrgMove`
**KICKER**: 一把手的第一步
**TITLE**: 给一个真实问题，一个完整闭环
**SUBTITLE**: 找到已经自发使用 AI 的人，让成果被看见；给他负责人、权限、指标、边界和停止条件。
**PAGE CLASS**: closing
**VISUAL BRIEF**:
```yaml
recipe: org-transform
composition: title-pause
motifs: [fulcrum-lever]
negative_constraints:
  - no-logo
  - no-watermark
```

**SLIDE BODY**:
```yaml
items:
  - role: label
    literal: "真实问题"
  - role: label
    literal: "结果负责人"
  - role: label
    literal: "验证指标"
  - role: label
    literal: "风险边界"
  - role: callout
    literal: "探索闭环：试验 → 证据 → 机制化 → 扩大覆盖"
```

> **SPEAKER NOTE**: 最后不提供标准答案，只给最小启动动作：让一个真实业务问题进入有负责人、有权限、有验证、有边界的探索闭环。
