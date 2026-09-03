# 核心公式

> deck 的身份 DNA 之一——一个可证伪的命题，整个 deck 存在就是为了论证它。迁移自 `deck_ai_sdlc_bpm_keynote`。

## 核心公式

```
人定义边界 × AI 自主执行 × 共享 Agent 基础设施 = 组织结构的不可逆重构
```

## 公式拆解

| 变量 | 定义 | 为什么必要 / 证据 |
|------|------|------------------|
| **人定义边界** | Framed Autonomy：人设定 frame，AI 在框内自主 | Deer Valley → Engelberg；Dagstuhl APM Manifesto（18 位作者） |
| **AI 自主执行** | Fable 5 级别的自主性：从「操作工具」到「委托任务」 | Mollick「I commission」；Krieger「wake up to find it done」 |
| **共享 Agent 基础设施** | Claude Code / Codex 同一套引擎同时用于 coding + office | 飞书 CLI 化；Nadella「Agent 需要 Office」 |
| **= 组织重构** | 中层消失、角色重写、金字塔变平 | Block 重定义三角色(IC/DRI/Player-Coach)；Cloudflare 重定义三种人(Builder/Seller/Measurer)；Three-Tier Developer Split |

## 展开：三波冲击

v1 的叙事揭示了一个时序结构——AI 对组织的冲击不是一波，是三波，按顺序释放：

```
第一波：Productivity（个人效率）
  人+AI > 纯人。个人产出暴增。→ slides 02-04

第二波：Communication（沟通方式）
  人与 AI 的沟通方式≠人与人的沟通方式。"说清楚"变成核心技能。
  反馈周期从 human-paced 变为 AI-paced。→ slides 10-12

第三波：Organization（组织架构）
  前两波积累到临界点，组织结构被迫重画——层级压缩、角色重定义。
  → slides 13-15, 22-23
```

前两波已经在发生。第三波刚刚开始。

## 关键等价关系（v1 验证）

| BPM 侧术语 | SDLC 侧术语 | 本质 |
|-----------|-----------|------|
| Framed Autonomy | AI Sandwich | 人定边界 + Agent 在框内自主 |
| Operational Frame | CI Pipeline（lint → test → build） | 命令式约束 |
| Normative Frame | 编码规范、安全策略 | 声明式约束 |
| Agentic BPM | Agentic SDLC | 同一个范式 |

**同一件事。不同的术语。** 软件行业先说"AI Sandwich"，企业 BPM 界说"Framed Autonomy"。18 位 Dagstuhl 作者的 Manifesto 和 Kieran Klaassen 的日常实践——描述的是同一个东西。

## 怎么证伪这个公式

如果 12 个月后，软件公司恢复了中层管理岗位、传统企业的组织架构没有显著变化——这个公式就不成立。正因为它可被证伪，它才有论证力：每张 slide 都在论证它的一部分。
