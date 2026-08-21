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
  - role: supporting_copy
    literal: "Ethan Jiang"
```

> **SPEAKER NOTE**: 先把全场主命题立住：变化已经发生，但只有被业务和组织接住，才会成为转型。标题页不展开论证。开场这句乘法是转型命题；第 14 页那把除法是回家找瓶颈的诊断尺，不要在这一页讲开。右下角签名是 Ethan Jiang，不要写成水印或页码。

## Slide 02: `WhyMe`
**KICKER**: 主讲人
**TITLE**: Ethan Jiang 蒋镒珍
**SUBTITLE**: AI 战略顾问 / 陪跑专家
**VISUAL BRIEF**:
```yaml
recipe: org-transform
composition: two-column
motifs: []
negative_constraints:
  - no-logo
  - no-watermark
```

**SLIDE BODY**:
```yaml
items:
  - role: supporting_copy
    literal: "交大教书 → Macromedia美国研发 → Adobe / HP 中国研发中心 → 巨鲸科技 CTO → 企业 AI 陪跑"
  - role: supporting_copy
    literal: "8 年 AI 经验：模型层到应用层，分析式到生成式"
  - role: supporting_copy
    literal: "陪跑三层：研发｜管理｜组织"
  - role: supporting_copy
    literal: "有孚网络 · 华乘电力 · 南洋万邦 · 海泰医疗 · 沃橙信息 · 钱拓科技"
  - role: callout
    literal: "陪跑的终点，不是让企业长期依赖外脑，而是让团队长出能力"
```

> **SPEAKER NOTE**: 左栏是这张人的半身蚀刻，比上一稿略瘦，贴原照片的脸型和肩宽，不是照片、不是女人、不是通用职场人。右栏只解释为什么是我讲这场：一线手感、Macromedia 美国研发、跨国公司交付、8 年从模型层走到应用层、从分析式走到生成式，现在做陪跑。三层陪跑是右栏文字，不要画成环绕小场景。公司名是范围，不讲成六家案例。来源：讲者履历；肖像源头 `jiang-yizhen-portrait.jpg`。

## Slide 03: `OrgGap`
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

## Slide 04: `WorkArc`
**KICKER**: 质疑一
**TITLE**: 飞起来的是个人，没动的是组织
**SUBTITLE**: 那个人反而更忙了。
**VISUAL BRIEF**:
```yaml
recipe: org-transform
composition: two-column
motifs: [responsibility-owner]
negative_constraints:
  - no-logo
  - no-watermark
```

**SLIDE BODY**:
```yaml
items:
  - role: label
    literal: "个人"
  - role: supporting_copy
    literal: "回路跑通了。写、改、交，一个人干完"
  - role: label
    literal: "组织"
  - role: supporting_copy
    literal: "活都来找他「AI 一下」。周会还是他有新东西。想复制，复制不了"
  - role: callout
    literal: "能力长在一个人身上，组织多了一个更忙的接口"
```

> **SPEAKER NOTE**: 这一页只问个人和组织。把第 3 页喜报翻过来。屏上不要写左边、右边。不要画发光的人坐正中，不要画看板。他很快；慢的是周围那圈人。口播：经营会上只能点名，点不出一个变快的部门。不要讲节奏，不要讲两套组织。

## Slide 05: `HowNow`
**KICKER**: 质疑二
**TITLE**: 人还在等下一场会，Agent 已经交下一棒
**SUBTITLE**: 就算盯住这个人了，节拍也对不齐。
**VISUAL BRIEF**:
```yaml
recipe: org-transform
composition: two-column
motifs: [responsibility-owner]
negative_constraints:
  - no-logo
  - no-watermark
```

**SLIDE BODY**:
```yaml
items:
  - role: label
    literal: "人"
  - role: supporting_copy
    literal: "他还在等回复、写纪要、赶下一场会"
  - role: label
    literal: "Agent"
  - role: supporting_copy
    literal: "任务一到就跑。几分钟里，下一棒已经接上"
  - role: callout
    literal: "人干活的节奏，和 Agent 干活的节奏，对不上"
```

> **SPEAKER NOTE**: 这一页只问这一个人的一天，对上 Agent 的节拍。屏上不要写左边、右边。不要画成多 Agent 架构图。不要讲等人到齐、岗位、审批体系，那是下一页。收句就是干活节奏对不上。口播可补：不是人慢，也不是 Agent 太快。转场：节拍对不上之后，是两套组织在抢同一件事。

## Slide 06: `MisUse`
**KICKER**: 质疑三
**TITLE**: 人的组织，接不住 Agent 的组织
**SUBTITLE**: 一套按岗位和审批转。一套按回路和交棒转。
**VISUAL BRIEF**:
```yaml
recipe: org-transform
composition: two-column
motifs: [responsibility-owner]
negative_constraints:
  - no-logo
  - no-watermark
```

**SLIDE BODY**:
```yaml
items:
  - role: label
    literal: "人的组织"
  - role: supporting_copy
    literal: "岗位、部门、审批、等人到齐。使用率可以很高，工作还是旧的"
  - role: label
    literal: "Agent 的组织"
  - role: supporting_copy
    literal: "回路、交棒、谁能构建。不等人到齐才开始"
  - role: callout
    literal: "不是缺工具，是两套组织在抢同一件事"
```

> **SPEAKER NOTE**: 这一页只问组织原理。装上工具，只是把 Agent 塞进旧组织，口播即可，不上屏当标题。屏上不要写左边、右边。不要点名骂裁员。可带 Kavak：失败往往不是模型不够强，是旧工作没有被重画。下一页转向：允许什么工作被重画。

## Slide 07: `RailCue`
**KICKER**: 转向
**TITLE**: 问下来，看着处处都有问题
**SUBTITLE**: 要系统性地做，先换一个问法。
**PAGE CLASS**: transition
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
    literal: "不少问题，根子都是工作还没被允许重画"
  - role: callout
    literal: "不要问我们部署了什么 AI。要问：允许什么工作被重画"
```

> **SPEAKER NOTE**: 前面那些问，不是要一件件修。金句是系统问法。不要写死问了几个。下面三家不给标准答案，只看他们到底改了什么。不要解释 Harness，画面少字。下一页起：Block 改责任，Cloudflare 改谁能构建，Walmart 改方法学和边界。来源：final_v5 管理层结论金句。

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
```

> **SPEAKER NOTE**: 三种角色是这一页的主画面，DRI 只是其中一种。对照下一页 Cloudflare：Block 讲责任怎么分配，Cloudflare 讲谁能构建。信息透明、能力可调用、结果可验证是前提；不是通用裁员答案。这些口播即可，第 13 页再写限度。不要把裁员当主线。文案、三栏、服饰不动。只改脸：欧美和亚洲混合，不要清一色东亚同事。来源：Dorsey 与 Botha《From Hierarchy to Intelligence》。

## Slide 09: `ClouOS`
**KICKER**: 案例二 / Cloudflare
**TITLE**: 不是减少角色，而是重组角色
**SUBTITLE**: Builders 创造，Sellers 连接客户，Measurers 测量。内部平台让非技术部门也能构建。
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
    literal: "Builders｜创造价值"
  - role: supporting_copy
    literal: "直接构建，不把所有事交给工程师代劳"
  - role: label
    literal: "Sellers｜连接客户"
  - role: supporting_copy
    literal: "把能力送到现场和客户面前"
  - role: label
    literal: "Measurers｜测量与治理"
  - role: supporting_copy
    literal: "看结果，守边界"
  - role: callout
    literal: "不是把所有人变成工程师，是改谁能构建"
```

> **SPEAKER NOTE**: Cloudflare 不是减少角色，是重组谁创造、谁连接客户、谁测量。内部 Cloudflare OS 让非技术部门也能搭工作流。口播可点：这就是第 7 页说的工作环境被开放。限度留到第 13 页。文案、三栏、服饰不动。只改脸：欧美和亚洲混合，不要清一色东亚同事。来源：企业 AI 转型六案例研究。

## Slide 10: `FourAg`
**KICKER**: 案例三 / Walmart
**TITLE**: 先有方法学，再把 Agent 铺到现场
**SUBTITLE**: 四类超级智能体接住一线；自主必须可检查。
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
  - role: label
    literal: "顾客｜Sparky｜购物与现场服务被接住"
  - role: label
    literal: "员工｜Associate Agent｜一线岗位进入统一工作回路"
  - role: label
    literal: "伙伴｜Marty｜供应商与生态用同一套接口"
  - role: label
    literal: "开发｜Developer Agent｜先内部工具链，再收敛成框架"
  - role: callout
    literal: "自主必须配上可检查、可执行的约束"
```

> **SPEAKER NOTE**: 四条水平空带从上到下：顾客 Sparky、员工 Associate Agent、伙伴 Marty、开发 Developer Agent。每条左边是原标签，右边最多一个空手、无品牌、无设备的人。系统名只作文字，不画 Sparky 形象、星标或 Marty 品牌。不要手机屏幕、购物 UI、清单、图表、API 图、货架、卡车、马甲、工具链柱、架构分层。Callout 单独一处。不要念能力清单，不要把广告或 Sparky 增长讲成已审计 ROI。来源：企业案例研究 Walmart 第 7 例；four-super-agents 为 Sparky / associate / Marty / developer。

## Slide 11: `PathMap`
**KICKER**: 三种拥抱
**TITLE**: 同一件事，三家动作完全不同
**SUBTITLE**: 不评谁赢。只把他们到底改了什么放在一起看。
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
    literal: "Block｜改责任"
  - role: supporting_copy
    literal: "谁对一件事负责：做事的人、问题负责人、下场带的人"
  - role: label
    literal: "Cloudflare｜改谁能构建"
  - role: supporting_copy
    literal: "谁动手、谁连接客户、谁测量"
  - role: label
    literal: "Walmart｜改方法学和边界"
  - role: supporting_copy
    literal: "先把方法和可检查约束讲清楚，再铺到一线"
  - role: callout
    literal: "路径不同，改的都是工作、责任或边界"
```

> **SPEAKER NOTE**: 三栏对照前三页，不要加第四家，不要排名。口播可补：换一家公司，动作还会再变。来源：七案例特殊路径表中的三家已确认入口。

## Slide 12: `NoCopy`
**KICKER**: 限度
**TITLE**: 例子只能启发，不能当模板
**SUBTITLE**: 各家都有不能照搬的地方。没有定论，正是因为这些限度存在。
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
    literal: "Block"
  - role: supporting_copy
    literal: "不能把重组写成生产率；裁员与 AI 的因果仍有争议"
  - role: label
    literal: "Cloudflare"
  - role: supporting_copy
    literal: "平台叙事不能当成已经验证的采用"
  - role: label
    literal: "Walmart"
  - role: supporting_copy
    literal: "规模数字和治理口号都有边界"
  - role: callout
    literal: "把失败写进方法，不要把愿景写成结果"
```

> **SPEAKER NOTE**: 这一页把三家的风险写清楚，是为了保护「没有定论」。不要把限度讲成这三家失败了。口播可留：没有基线的增长数字，只是故事。来源：topic_v5 不能照搬栏与失败模式。

## Slide 13: `ExecAct`
**KICKER**: 诊断尺
**TITLE**: 组织竞争力 = 人才密度 × AI 杠杆 / 组织摩擦
**SUBTITLE**: 路可以不同，回家先看自己的瓶颈
**PAGE CLASS**: transition
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
    literal: "这是找瓶颈的诊断尺，不是算 ROI 的公式"
  - role: supporting_copy
    literal: "提高 AI 杠杆｜降低组织摩擦｜保护人才密度"
```

> **SPEAKER NOTE**: 开场那句乘法是转型命题。这一页的除法是回家用的诊断尺：缺的是杠杆、摩擦太大，还是人才密度被耗掉。公式是主字，标题那句收小。不要再画一座分层建筑。三句口播即可：杠杆进完整问题，摩擦是审批等待转交，人才密度要被看见。不要讲成第三套理论，也不要说「同一组接口」。来源：腾讯研究院报告，作为研究启发而非通用定律。

## Slide 14: `AskNow`
**KICKER**: Q&A
**TITLE**: 把组织问题带回自己的现场
**SUBTITLE**: 带着一个真实问题进来。
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
    literal: "你允许什么工作先被重画？"
```

> **SPEAKER NOTE**: 现在把问题交还给现场。回扣第 8 页和第 12 页：责任、谁能构建，还是方法学和边界。只打开对话，不新增结论。不要问「哪一个接口」。
