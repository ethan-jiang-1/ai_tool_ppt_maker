---
title: 04 — 端到端走查
stage: workflow/05-iteration
position: 05 of 05
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- workflow/05-iteration/README.md
- workflow/05-iteration/03-pipeline-change-workflow.md
feeds_into: []
agent_action: iterate_with_openspec
---

# 04 — 端到端走查

← [03](03-pipeline-change-workflow.md) | [README](README.md)

## 从头到尾走一遍

下面是一个完整项目的时间线——从 "我想做一个 PPT" 到最终交付，标注每个迭代介入点。示例中 Claude Code 环境的 OpenSpec 命令代表结构化迭代流程的具体执行方式；在其他 agent 环境中，同样的流程通过 changelog + 手改源文件执行。

## 阶段 0：项目启动

```
用户: "帮我做一个 manufacturing AI strategy keynote。听众是工厂 GM 和供应链 VP。
       40 分钟。只讲方向和模式，不讲具体数字。"

Agent (读 AGENTS.md → Phase 0):
  1. node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs --init deck_mfg_ai
     → 一条命令建好三层结构 + 每目录 README + 铺好内容模板 + deck-guide/CLAUDE/metadata 桩
  2. 填 project-metadata.yaml(topic/听众/语言)
  3. （可选）template-visual-style.md → 2_backbone/visual-style/visual-style.md
```

**没有迭代介入。** 这是机械初始化。

## 阶段 1：内容设计

```
Agent (Phase 1.1):
  "你的 audience 目前相信什么——但其实是错的？"
  → 用户: "他们认为只要产品好，客户自然会找来。"
  → Agent: 草拟隐喻 "Two Languages" — 物理制造语言 vs 数据语言

Agent (Phase 1.2):
  → 识别 outcome: AI Adoption（被 AI 采购系统发现、评估、选中）
  → 推导公式: Readable Data + Managed Agents = AI Adoption
  → 验证可证伪性

Agent (Phase 1.3):
  → 填写 Block Map：5 Blocks, 19 slides
  → 用户 approve Block Map

Agent (Phase 1.4):
  → 逐张填写 L1 Meta / L2 Concept / L4 Speaker Note
  → 用户 review 每张 slide 的 TITLE 和 CONCEPT
  → L3 IMAGE PROMPT 本阶段留占位——视觉锁定后（§2.7）再回填（见 bug 0003）

Agent (Phase 1.5):
  → 逐项检查 constraints: no internal numbers ✓, no entity names ✓, ...
```

**第一个迭代介入点**：

```
用户: "我觉得 Slide 8 应该先讲 Efficiency 再讲 Growth。而且 Fastenal 案例太弱了。"

Agent: "这两个是独立的改动。先处理 Block 重排？"

  # 在 Claude Code 中：
  openspec-propose "Reorder Block 3: Efficiency before Growth"
    → 变更类型: 叙事框架
    → proposal: 改 Block Map、调整 slide 08-13 顺序、更新 Bridge from/to
    → user approve → apply → archive

  openspec-propose "Replace Fastenal case with stronger vending-data example"
    → 变更类型: 案例锚点
    → proposal: 新案例 evidence card + evidence tier
    → user approve → apply → archive

  # 在其他 agent 中：同样的流程——在 changelog 写下提案，审核后动手改，改完归档。
```

```
用户: "Slide 05 的 claim 太 vague——改成更具体的对比。"

Agent: "这个只影响一张 slide，不走迭代流程——直接改。"
  → 编辑 slide-specifications.md，重写 Slide 05 的 TITLE 和 CONCEPT
```

**闸门**：用户确认内容锁定。

## 阶段 2：风格设计

```
Agent (Phase 2.1 + §2.1a Medium 决策)：
  "你的产品长什么样？"
  → 用户: "精密金属零件——connectors, fasteners, turned parts。
            Swiss precision 感觉，不是 heavy industrial。"
  → 先锁 medium（画风先于配色）：内容是实体精密零件 → 给用户对比
    "macro 摄影 vs 几何图解 vs 3D 渲染"，用户选 macro 摄影质感
  → medium 锁定后，才推导色板（见 bug 0002：medium before color）

Agent (Phase 2.2-2.3):
  → 从 medium 推导 color palette（deep navy + blue-cyan-teal single family）
  → 填充 visual-style.md（Dimension 0 Medium → Dimension 1 Color …）
  → 组装 meta-prompt

Agent (Phase 2.4):
  → 用单图生成 skill（image2-imagegen）生成 style_master.jpg

Agent (Phase 2.5):
  → Review: 画风与锁定的 medium 一致？color/typography 清晰？
  → Path A (95%+ pass) → Lock style_master.jpg

Agent (Phase 2.7 — 回填 L3):
  → 视觉锁定后，回到 slide-specifications.md 逐张填 L3 IMAGE PROMPT
    （此刻可真正对照 2_backbone/visual-style/，不会作废）
  → 跑 stage1_build_inputs.mjs --validate 清 ERROR
```

**第二个迭代介入点**：

```
用户: "Cyan #00b4d8 太亮了——换成更 subtle 的 teal。"

Agent: "这会影响所有 slide 的颜色语义。走结构化迭代流程。"

  # 在 Claude Code 中：
  openspec-propose "Adjust accent color: cyan #00b4d8 → teal #0abab5"
    → 变更类型: 视觉系统变更
    → proposal: 新旧色对比、受影响元素列表
    → user approve → apply
    → 重新生成 style_master.jpg（因为 color swatches 变了）
    → archive

  # 在其他 agent 中：在 changelog 中记录提案内容，审核后执行同样步骤，改完归档。
```

**闸门**：用户确认风格锁定。

## 阶段 3：生产管线

```
Agent (Phase 3 — 一条命令跑全部 5 个 stage)：
  → node PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs \
       --run-dir deck_mfg_ai/3_versions/v1 --stage all
  （脚本就地运行，不复制进 run bundle；跑前自动 --check 结构 + L3 校验）

  Stage 1 → slide_plan.json (19 slides) + page_prompts/_prompts.json
    闸门: 19 slides ✓, render_mode 分类正确 ✓
  Stage 2 → page_images_full/*.png（用图像 skill 生成，缺一张即中止）
    闸门: header zone 干净 ✓, 颜色一致 ✓
  Stage 3 → header_locked/*.png (19 张最终图)
    闸门: full-page 标题完整 ✓, header 没撞 body ✓
  Stage 4 → _generated/ppt/mfg_ai.pptx
    闸门: 19 slides ✓, 能正常打开 ✓
  Stage 5 → 自动备份后注入 speaker notes
    闸门: notes 全部注入 ✓
```

**没有迭代介入。** 这是确定性执行——只确认 gate checks。

## 阶段 4：迭代维护

```
用户 (一周后): "客户觉得 Slide 12 的文字太多了——精简一下。"

Agent: "这段 body 文字烧在生成图里，使用 Generated Image Rebuild。
  改 slide-specifications.md → 只重跑该页的画面：
  unified_pipeline.mjs --run-dir deck_mfg_ai/3_versions/v1 --stage 1,2,3,4,5 --only s12 --force-images
  （--only 只把 Stage 2 限定到 s12，不会自动 force；重生后先 review，再完成组装）"
  → 5 分钟完成
```

```
用户 (一个月后): "要在 Block 2 加一张 slide——新的 regulations 要讲。"

Agent: "新增 slide 会影响后续 slide 编号和 Bridge。先走 Structural Versioning Path，再刷新受影响页。"

  # 在 Claude Code 中：
  openspec-propose "Add regulation slide in Block 2"
    → Structural Versioning Path → bundle_layout.mjs --new-version deck_mfg_ai/3_versions/v1
    → 在 v2 中实施变更
    → image-owned 的新增/受影响页使用 Generated Image Rebuild
    → archive

  # 在其他 agent 中：先在 changelog 中写下提案（新 slide 位置、理由、四层规格草案），
  # 审核后用 --new-version 创建 v2，在 v2 中改，改完归档。
```

## 关键 Takeaways

1. **小改动直接改，大改动走结构化迭代流程**——规则是 "影响 multi-slide 或 deck 级约束"
2. **迭代流程在 Phase 1 和 Phase 2 最活跃**——设计和迭代阶段
3. **Phase 3 不走迭代流程**——管线执行是确定性的
4. **Phase 4 用迭代流程管理大改动**——先分离 Structural Versioning Path，再按失效产物选择刷新路径
5. **每次变更结束后归档**——保持 change log 干净

---

> **Back to**: [README](README.md)
