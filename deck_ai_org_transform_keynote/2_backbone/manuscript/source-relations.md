# 讲稿素材与上游来源关系

这里记录 `2_backbone/manuscript/` 中讲稿素材使用了哪些上游摘要，以及如何回溯到外部原始材料。讲稿是下游表达层；事实、概念和证据边界以 `1_upstream_raw_material/` 及其 `source-*` symlink 为准。

## 01：杠杆与支点

- 讲稿：`01-block1-杠杆与支点.md`
- 上游摘要：`../../1_upstream_raw_material/tensen-report-digest.md`
- 原始材料：`../../1_upstream_raw_material/source-tensen-report/`
- 主要吸收：超级个体、AI 杠杆、个人能力先发生变化、个人突破与组织承接之间的张力。
- 表达边界：杠杆是演讲隐喻；不要把支点关系说成所有组织共享的固定方法。

## 02：软件行业的拐点

- 讲稿：`02-block2-软件行业的拐点.md`
- 上游摘要：`../../1_upstream_raw_material/martin-fowler-ai-sdlc-digest.md`
- 原始材料：`../../1_upstream_raw_material/source-martin-fowler-ai-sdlc/`
- 主要吸收：Deer Valley 到 Engelberg 的认知跃迁、能力演进、`Agent = Model + Harness`、Guides/Sensors 和验证回路。
- 表达边界：这是同一社区的鲜活切片，不代表整个软件行业已经无摩擦完成转型。

## 03：从提效到工作流重构

- 讲稿：`03-block3-从提效到重构.md`
- 上游摘要：`../../1_upstream_raw_material/enterprise-six-cases-digest.md`
- 原始材料：`../../1_upstream_raw_material/source-enterprise-six-cases/`
- 交叉上游摘要：`../../1_upstream_raw_material/ai-era-bpm-digest.md`
- 交叉原始材料：`../../1_upstream_raw_material/source-ai-era-bpm/`
- 主要吸收：重构而非部署、采用跑在系统前面、Block 的问题所有权与 DRI、Cloudflare 的角色重组与内部平台、Walmart 的四大超级智能体与可治理约束、目标驱动与确定性执行分离。
- 表达边界：企业案例不做不可比排名；公司自报 ROI 和战略叙事需标记证据强度。

## 04：一把手工程

- 讲稿：`04-block4-一把手工程.md`
- 上游摘要：`../../1_upstream_raw_material/tensen-report-digest.md`
- 原始材料：`../../1_upstream_raw_material/source-tensen-report/`
- 交叉上游摘要：`../../1_upstream_raw_material/enterprise-six-cases-digest.md`
- 交叉原始材料：`../../1_upstream_raw_material/source-enterprise-six-cases/`
- 主要吸收：组织竞争力公式、组织摩擦、园丁隐喻、最小启动动作、责任与治理边界。
- 表达边界：公式和园丁是研究启发；Block 的责任模型是案例，不是通用组织标准答案。

## 回溯规则

```text
讲稿段落 → 本关系表 → 上游摘要 → source-* symlink → 外部原始材料
```

修改讲稿中的事实、数字、案例或来源判断时，先回到上游摘要和原文核对；修改只涉及口吻、节奏或转场时，可留在讲稿层。
