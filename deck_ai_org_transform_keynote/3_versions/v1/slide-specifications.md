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
    literal: "已经形成新工作方式"
  - role: supporting_copy
    literal: "写代码、写文案、做分析、做创作、做原型，开始被一个人串进同一条工作回路"
  - role: label
    literal: "正在路上"
  - role: supporting_copy
    literal: "组织尚未提供足够的场景、信心与反馈"
  - role: callout
    literal: "个人能力梯度已经出现"
```

> **SPEAKER NOTE**: 让听众承认：这不是等待未来的命题，变化已经从个人工作方式开始。但变化并不均匀，少数人已经形成闭环，更多人仍缺少真实场景和组织反馈。

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
    literal: "杠杆｜AI"
  - role: label
    literal: "支点｜离困难最近的真实问题"
  - role: label
    literal: "被撬动｜可验证的业务结果"
  - role: callout
    literal: "支点选错，噪声、等待和错误判断也会被放大"
```

> **SPEAKER NOTE**: AI 会放大能力，也会放大系统弱点。企业真正要回答的不是“要不要上 AI”，而是要撬动哪个困难、支点在哪里、谁能看见结果、谁对结果负责。软件行业随后成为第一个完整接住杠杆的样本。

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
    literal: "2026.02｜Deer Valley"
  - role: quote
    literal: "更多的是不确定"
  - role: label
    literal: "2026.04｜Harness engineering"
  - role: callout
    literal: "从模型能不能写，转向多快知道写得对不对"
  - role: label
    literal: "2026.06/07｜Engelberg"
  - role: quote
    literal: "Evidence is in"
  - role: supporting_copy
    literal: "同一早期采用者社区的前后切片，不代表整个行业已无摩擦完成转型"
```

> **SPEAKER NOTE**: 同一批 Martin Fowler retreat 参与者在约 5 个月内完成语气翻转：从怀疑，到 Harness engineering，再到生产议题。来源是早期采用者社区的真实切片；METR、Stanford、MIT NANDA 等反证提醒我们，收益仍取决于任务类型、Harness 与验证能力。

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
  - role: diagram_text
    literal: "聊天问答｜人拆题、搬运上下文"
  - role: diagram_text
    literal: "小任务协作｜模型完成局部动作"
  - role: diagram_text
    literal: "多步执行｜围绕目标调用工具"
  - role: diagram_text
    literal: "Agent 工作流｜行动、反馈、修正、交接"
  - role: callout
    literal: "变化的不是模型突然变成员工，而是工作单元越来越完整"
```

> **SPEAKER NOTE**: 能力不是从聊天突然跳到 Agent。随着上下文、工具和反馈被接入，人可以交给系统的工作单元逐步扩大；人的重心则移动到目标、边界、验收和高风险判断。

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
    literal: "Model｜理解、推理、生成"
  - role: diagram_text
    literal: "Guides｜上下文、规则、工具、边界"
  - role: diagram_text
    literal: "Sensors｜测试、运行结果、评估、审查"
  - role: diagram_text
    literal: "Human｜目标、验收、高风险判断"
  - role: callout
    literal: "瓶颈从写得快不快，转向多快知道写得对不对"
```

> **SPEAKER NOTE**: Model 决定能不能想出办法，Harness 决定能不能在真实环境里稳定做对。Guides 在行动前提供方向，Sensors 在行动后提供反馈，人仍负责目标、验收和高风险判断。

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
  - role: diagram_text
    literal: "目标与上下文"
  - role: diagram_text
    literal: "Agent 推理"
  - role: diagram_text
    literal: "确定性执行"
  - role: diagram_text
    literal: "过程反馈"
  - role: diagram_text
    literal: "人类升级"
  - role: supporting_copy
    literal: "权限、审计、记录与结果责任不能消失"
```

> **SPEAKER NOTE**: 软件只是先行样本。企业不能复制表面上的 Coding Agent，而要把推理和确定性执行分开，让过程产生反馈，并在不确定或高风险节点交还给人。

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
    literal: "原始瓶颈｜信息与协调依赖层级"
  - role: label
    literal: "重做接口｜岗位所有权 → 问题所有权"
  - role: callout
    literal: "选择路径｜DRI 在 90 天内成为“问题的 CEO”"
  - role: supporting_copy
    literal: "证据边界｜信息透明、能力可调用、结果可验证是前提；不是通用裁员答案"
```

> **SPEAKER NOTE**: Block 的关键不是“用了 AI”，而是把责任从岗位层级移到问题所有权。DRI 模型只有在信息透明、工具可调用、结果可验证时才成立，否则只是把责任压给个人。来源：企业 AI 转型六案例研究。

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
    literal: "原始瓶颈｜AI 采用与角色、控制面脱节"
  - role: label
    literal: "重做接口｜Builders / Sellers / Measurers"
  - role: label
    literal: "选择路径｜Cloudflare OS 向非技术部门开放工作流构建"
  - role: supporting_copy
    literal: "证据边界｜这是角色重组与平台化路径，仍需用业务结果验证"
```

> **SPEAKER NOTE**: Cloudflare 的选择不是把所有人都变成工程师，而是重组创造价值、连接客户和测量治理的角色，并用内部平台降低构建门槛。来源：企业 AI 转型六案例研究；最新战略步骤保留公司叙事边界。

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
    literal: "原始瓶颈｜实验预算难以支撑全行规模化"
  - role: label
    literal: "重做接口｜创新项目 → 核心基础设施"
  - role: label
    literal: "选择路径｜LLM Suite + 培训 + 自然流失与再部署"
  - role: supporting_copy
    literal: "证据边界｜这是平台化、渐进式路径；价值要看业务结果，而不是调用次数"
```

> **SPEAKER NOTE**: JPMorgan 代表另一条路：先把 AI 从实验预算重分类为核心基础设施，再通过培训、自然流失和再部署渐进改变人才结构。来源：企业 AI 转型六案例研究；不把战略路径等同于已独立验证的 ROI。

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
    literal: "提高 AI 杠杆｜让 AI 进入完整问题"
  - role: label
    literal: "降低组织摩擦｜缩短审批、等待与转交"
  - role: label
    literal: "保护人才密度｜让探索、共享和承担被看见"
  - role: supporting_copy
    literal: "这是管理诊断关系，不是精确计算 ROI 的财务公式"
```

> **SPEAKER NOTE**: 三个案例入口不同，但最终都要提高 AI 杠杆、降低组织摩擦、保护人才密度。这个公式用来定位瓶颈，不用来计算精确 ROI。来源：腾讯研究院报告，作为研究启发而非通用定律。

## Slide 12: `OrgMove`
**KICKER**: 一把手的第一步
**TITLE**: 先给一个真实问题，一个完整闭环
**SUBTITLE**: 找到已经自发使用 AI 的人，让成果被看见；给他负责人、权限、指标、边界和停止条件。
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
    literal: "数据与工具权限"
  - role: label
    literal: "验证指标"
  - role: label
    literal: "风险边界"
  - role: label
    literal: "停止条件"
  - role: callout
    literal: "先验证一个闭环是否改变结果，而不是先做全员部署"
```

> **SPEAKER NOTE**: 不从全员部署开始。先找到已经自发使用 AI 的人，让成果被看见，再把一个边界清晰的真实问题完整交给一个人或小组。来源：腾讯研究院报告的最小启动动作。

## Slide 13: `LoopGo`
**KICKER**: 从试验到机制
**TITLE**: 让一次试验，变成组织学习
**SUBTITLE**: 真实问题 → 小范围试验 → 形成证据 → 机制化 → 扩大覆盖。
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
    literal: "真实问题"
  - role: label
    literal: "小范围试验"
  - role: label
    literal: "形成证据"
  - role: label
    literal: "机制化"
  - role: label
    literal: "扩大覆盖"
  - role: callout
    literal: "每次探索，都在缩短个人能力到组织能力的距离"
  - role: supporting_copy
    literal: "成功和失败都必须形成可复用的组织证据"
```

> **SPEAKER NOTE**: 一把手不替团队规定唯一答案，而是判断瓶颈在哪里，让真实试验产生证据，再把有效答案产品化或机制化。失败也要留下边界、原因和停止条件，成为下一轮组织学习。

## Slide 14: `AskNow`
**KICKER**: Q&A
**TITLE**: 把组织问题带回自己的现场
**SUBTITLE**: 带着一个真实问题，进入下一轮探索。
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
  - role: callout
    literal: "Q&A"
  - role: supporting_copy
    literal: "你所在的组织，最先需要重做哪一个接口？"
```

> **SPEAKER NOTE**: 现在把问题交还给现场。这一页只打开对话，不新增结论。
