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
**KICKER**: 工具已经涌现
**TITLE**: 一个人，把很多事串起来了
**SUBTITLE**: WorkBuddy、Cursor、Claude Code、Codex、Trae，正在变成同一个人的工作回路。
**VISUAL BRIEF**:
```yaml
recipe: org-transform
composition: centered-constellation
motifs: [responsibility-owner]
negative_constraints:
  - no-watermark
```

**SLIDE BODY**:
```yaml
items:
  - role: label
    literal: "WorkBuddy｜办公 Agent"
  - role: label
    literal: "Cursor｜Coding Agent"
  - role: label
    literal: "Claude Code｜Coding Agent"
  - role: label
    literal: "Codex｜Coding Agent"
  - role: label
    literal: "Trae｜Coding Agent"
  - role: supporting_copy
    literal: "写代码、写文案、做分析、做创作、做原型"
  - role: callout
    literal: "不是多了一个团队，是同一个人能把整条回路跑完"
```

> **SPEAKER NOTE**: 画面只留一个人。工具是他手里的家伙，不是五个并列主角，也不要一群人各用一个工具。WorkBuddy 是办公 Agent，其余是 Coding Agent。因为工具足够多样，同一个人开始什么都能干。

## Slide 03: `WorkArc`
**KICKER**: 第一处断层
**TITLE**: 个人已经拿到工具，组织价值没有自动出现
**SUBTITLE**: 少数人已经闭环；组织还没有把这些能力接到真实问题上。
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
    literal: "已经形成新工作方式"
  - role: supporting_copy
    literal: "少数人把工具串成了可重复的个人回路"
  - role: label
    literal: "组织尚未接住"
  - role: supporting_copy
    literal: "还缺少真实场景、信心、权限与反馈"
  - role: callout
    literal: "个人变了，不等于组织已经获得价值"
```

> **SPEAKER NOTE**: 不要讲杠杆和支点的物理关系。这一页只把断层立住：工具已经到人，价值还没有到组织。口播可留一句遇强则强、遇弱则弱。转场到软件：那些最有话语权的人，自己是怎样转过来的。

## Slide 04: `CodeRise`
**KICKER**: 观念变了
**TITLE**: 年初还在怀疑，年中已经转向
**SUBTITLE**: Thoughtworks 与 Fowler 的西方圈层。后面挑战更多。
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
    literal: "年初｜Thoughtworks / Fowler"
  - role: quote
    literal: "Fowler：a total, absolute skeptic"
  - role: quote
    literal: "Vella：there is more uncertainty than certainty"
  - role: label
    literal: "年中｜同一批西方人，已经在生产里做"
  - role: quote
    literal: "The evidence is in."
  - role: quote
    literal: "Everybody in the room was shipping it in production."
  - role: quote
    literal: "Fowler：The game is how fast can we tell whether this is right."
  - role: quote
    literal: "Beck：TDD is a superpower with AI agents"
```

> **SPEAKER NOTE**: 这一页讲观念翻转，不是会议名录。材料是 2026 年 2 月到 6/7 月，台上用年初/年中，口播可说不到半年。台上的人按西方人来画。半年转向属于 Thoughtworks / Fowler 社区，不要安到 Beck 头上；Beck 只钉验证。金句来自 Fowler 原始报告，不新编。后面挑战更多。

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
**TITLE**: Coding Agent 正在变成会干活的 Agent
**SUBTITLE**: Agent 在适配人的工作方式；企业要接住的是这种能力，不是一个产品名。
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
  - role: callout
    literal: "Agent 接着干、能改、能反馈，围着人转"
  - role: supporting_copy
    literal: "人负责目标和升级"
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

> **SPEAKER NOTE**: 企业听众不必先懂 Coding Agent。软件里那个很能干的东西，本质是 Agent 在适配人：它能接着干、能改、能反馈。企业要接住的是这种会干活的 Agent，不是一个叫 Coding Agent 的产品。下面回路只是后面案例要接的接口，不是整页主角。

## Slide 08: `BlkOwn`
**KICKER**: 案例一 / Block
**TITLE**: 只保留三种角色，不设永久中层
**SUBTITLE**: 个人贡献者做事；DRI 对问题负责；player-coach 下场带。
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
    literal: "个人贡献者｜做事"
  - role: supporting_copy
    literal: "直接交付，不再把信息交给常设中层转发"
  - role: label
    literal: "DRI｜问题的负责人"
  - role: supporting_copy
    literal: "90 天内成为这个问题的 CEO，调度跨职能能力"
  - role: label
    literal: "player-coach｜下场带"
  - role: supporting_copy
    literal: "仍然做事，同时带人；不是永久中层"
  - role: callout
    literal: "从岗位所有权，转向问题所有权"
  - role: supporting_copy
    literal: "信息透明、能力可调用、结果可验证是前提；不是通用裁员答案"
```

> **SPEAKER NOTE**: 三种角色是这一页的主画面，DRI 只是其中一种。对照下一页 Cloudflare 的 Builders / Sellers / Measurers：Block 讲责任怎么分配，Cloudflare 讲价值链怎么切。不要把裁员当主线。来源：Dorsey 与 Botha《From Hierarchy to Intelligence》。

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
**KICKER**: 一把手的启发
**TITLE**: 没有标准动作，路径可以不同
**SUBTITLE**: 完整闭环是一个建议；也可以先看见人、先透明，或按公式选第一刀。
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
  - role: label
    literal: "看见已经在用的人｜让成果浮出水面"
  - role: label
    literal: "一个真实问题，一个完整闭环｜负责人、权限、指标、边界、停止条件"
  - role: label
    literal: "先透明，先做原型｜不必先建中台"
  - role: label
    literal: "按公式选第一刀｜缺人才、缺杠杆，还是摩擦太大"
  - role: callout
    literal: "这是建议，不是唯一处方"
```

> **SPEAKER NOTE**: 这一页给人启发和选择，不要讲成六要素检查清单。完整闭环只是其中一条。下一页才是：无论选哪条入口，都要变成组织学习。来源：腾讯研究院最小启动动作、Anthropic 透明即协调、第 11 页组织公式。

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

> **SPEAKER NOTE**: 无论上一页选哪条入口，这一页只回答如何变成组织学习。不要再重复启动清单。失败也要留下边界、原因和停止条件。

## Slide 14: `AskNow`
**KICKER**: Q&A
**TITLE**: 把组织问题带回自己的现场
**SUBTITLE**: 带着一个真实问题，进入下一轮探索。
**PAGE CLASS**: closing
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
  - role: callout
    literal: "Q&A"
  - role: supporting_copy
    literal: "你所在的组织，最先需要重做哪一个接口？"
```

> **SPEAKER NOTE**: 现在把问题交还给现场。这一页只打开对话，不新增结论。
