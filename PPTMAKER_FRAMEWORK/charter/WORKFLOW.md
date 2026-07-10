# 流程宪法: Agent 工作流程

> 本文描述 PPTMAKER_FRAMEWORK 的完整工作流程——从零开始到迭代打磨.
> 详细执行步骤在 `AGENTS.md` (按 Phase 查阅), 启动流程在 `BOOTSTRAP.md`.

## 5 Phase 总览

| Phase | 做什么 | Gate | Agent 角色 |
|-------|--------|------|-----------|
| 00 项目初始化 | 环境检查 → 5 问题 intake → 创建 run bundle | 结构合规 (`--check --structure-only`) | 执行者 |
| 01 视觉风格 | medium → preset → style_master.jpg → review | 视觉锁定 (95%+ 通过审查) | 建议者 |
| 02 内容设计 | 隐喻 → 公式 → Block Map → 四层 slide specs | 内容确认 (人审) | 创作者 |
| 03 图像提示词 | 能力层: 教 Agent 怎么写好的 image prompt | — | 学习者 |
| 04 生产管线 | Stage 1→5: markdown → PPTX | 每 Stage 一个 gate | 执行者 |
| 05 迭代引擎 | 分类变更 → 最小化重跑 → 记录 | — | 判断者 |

Phase 顺序不可变: 00 → 01/02 (可并行) → 03 (能力层, 贯穿) → 04 → 05 (持续).

## 编辑链 (变更分类)

任何用户变更请求必须先分类, 再跑对应链:

| 链 | 用户说 (示例) | 变更类型 | Stage | 耗时 |
|----|-------------|---------|-------|------|
| **A** | "第5页标题改一下" | title/kicker/subtitle | 1,3,4,5 | ~5 min |
| **B** | "第8页的图重新生成" | image prompt/颜色/布局 | 1,2,3,4,5 | ~5 min/页 |
| **C** | "备注改一下" | speaker notes | 5 | ~30 sec |
| **Structural** | "加一页案例" / "删掉第3页" | 增/删/重排 slide | new-version + 受影响页 | 按页数 |

**Agent 分类逻辑**:
1. 改了什么? (text / visual / notes / structure)
2. 影响多少页? (1 页 → targeted; 几页 → rerun affected; 全部 → full rebuild)
3. 要 pilot 吗? (颜色/风格变更 → 先试 3 页, 通过后再全量)

## Gate 机制

每个 Phase 结束必须通过 Gate——**人审确认**. Gate 状态记录在 `project-metadata.yaml`:

- `content_gate: pending|approved|waived`
- `visual_gate: pending|approved|waived`

Stage 2 运行前检查: 两个 gate 必须为 `approved` 或 `waived`.

## Agent 入口序列

```
CLAUDE.md  →  BOOTSTRAP.md  →  charter/AGENT_CONTRACT.md  →  按 Phase 读 AGENTS.md
(自动加载)     (三步启动)        (10 条铁律)            (详细执行)
```

## 迭代节奏

| 频率 | 操作 | 走什么 |
|------|------|--------|
| 高 (每轮对话) | 改 wording, 调单页 prompt | Chain A/B, 直接编辑 |
| 中 (每几次) | 换案例, 调结构 | Structural, proposal 先行 |
| 低 (关键节点) | 换隐喻/公式, 换视觉方向 | 回 Phase 1/2, 全量重跑 |
