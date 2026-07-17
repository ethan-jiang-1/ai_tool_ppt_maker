---
title: 04 — Iterate, Review, Lock（迭代、审查、锁定）
stage: workflow/01-visual
position: 05 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- workflow/01-visual/README.md
- workflow/01-visual/03-write-the-style-master-prompt.md
feeds_into:
- workflow/01-visual/05-use-the-style-master-for-slides.md
agent_action: run_checklist
---

# 04 — Iterate, Review, Lock（迭代、审查、锁定）

> 质控阶段。第一版生成的 style master 很少是完美的。这个文件教你如何对着 checklist 系统性审查、识别需要修复的问题、迭代直到 style master 足够可靠来锚定整个 deck。

---

**Navigation**: ← `03-write-the-style-master-prompt.md` | Next → `05-use-the-style-master-for-slides.md`

---

## 为什么迭代是预期中的

Style masters 是复杂的图像——它们包含 4-6 个 visual dimensions（color、typography、layout、components、decorations、product reference），所有这些需要同时正确。第一版通常只能做到 **70-80% 正确。** 迭代填补这个差距。

一个 80% 正确的 style master 产出 80% 一致的 slides。20% 的 drift 在页面之间累积——到第 20 页，deck 看起来像是不同的人做的。修好 style master 一次，比修 20 张单独 slides 更便宜。**在 style master 的 refinement 上花的每一分钟，在 slide-level polish 上能省十分钟。**

## The Review Checklist（审查清单）

对照每一条审查生成的 `style_master.jpg`。标记 pass/fail。

### Color Palette（色板）
- [ ] 所有 swatches 清晰可见，可辨认为 color blocks
- [ ] Hex code labels 可读（文字不太小，不与 swatches 重叠）
- [ ] Role labels 可读（"Primary background," "Accent / positive," etc.）
- [ ] 颜色看起来彼此协调——没有哪个颜色像 intruder 跳出来
- [ ] 颜色大致匹配预期的 hex codes（完全匹配不可能；"close enough in spirit" 是标准）
- [ ] 没有出现你没指定的额外颜色

### Typography（字体层级）
- [ ] Headline sample 比 body text sample 大得多——hierarchy 一眼可见
- [ ] Body text 明显小于 headline，明显大于 labels
- [ ] KPI number 超大且占主导——应该是最大的文本元素
- [ ] 四个 size levels（headline、KPI、body、label）在同一帧中且可区分
- [ ] Text samples 语言正确（English vs. Chinese vs. bilingual）
- [ ] Text color 匹配指定的 text color（dark 背景上的 near-white，light 背景上的 dark）

### Layout Grid（布局网格）
- [ ] 三个 zones 视觉上分离（title zone、content zone、callout zone）
- [ ] Title zone 大约是高度的 20%
- [ ] Main content zone 大约是高度的 60-70%
- [ ] Callout bar 在底部可见，full-width
- [ ] Zones 有标签或清晰可区分

### Component Examples（组件示例）
- [ ] KPI card：dark panel 可见，oversized number 可见，label 在下方，accent color 正确
- [ ] Flow diagram：nodes 连接，arrows 可见，node text 可读，colors 正确
- [ ] Comparison layout：两列可见，左和右可区分，tints 正确
- [ ] Components 小但可读——它们不应主导 style master
- [ ] Component styling 看起来有意图（一致的 borders、shadows、spacing）

### Micro Decorations（微装饰 — 如有）
- [ ] 每个 mnemonic 可见且可识别
- [ ] Mnemonics 小（不主导 style master）
- [ ] Style 匹配 product DNA（geometric、precise，不是 clip-art）
- [ ] Mnemonics 旁边的 labels 可读

### Product Reference（产品参考 — 如有）
- [ ] Product inset 在 style master 底部
- [ ] Scale 和 finish 可识别
- [ ] Product 看起来像 client 实际制造的东西（不是 generic substitute）
- [ ] Inset 小（图像面积的 5-8%）——reference, not showcase

### 全局
- [ ] 没有 hallucinated 的 logos、watermarks、page numbers、draft labels
- [ ] 没有你没要求的 random text 或 decorative elements
- [ ] Mood 匹配你的 intent——"dark executive" 看起来 dark and executive
- [ ] 图像清晰，构图好——不模糊，不拥挤

## Decision Framework（决策框架）

根据 checklist 结果，选择一条路径：

### Path A: Accept As-Is（95%+ 通过）

所有或几乎所有 checklist 项通过。你不会改变任何东西。**锁定。** 进入 Stage 5（生成 slides）。

这在第一次生成时很少见。如果你走到这里：prompt 写得好，模型理解了它。

### Path B: Minor Issues（80-95% 通过）

一两个 component examples 稍微不对。一个 label 难读。一个 color swatch 偏差了一点点。

**怎么做：**
1. 记下具体问题（"KPI card label is too small to read," "Teal swatch looks too green"）
2. 编辑 style master prompt，**只**解决这些问题——加 specificity（"label text must be clearly readable," "Teal #0d9488 — ensure it reads as blue-green, not pure green"）
3. 用相同命令 regenerate style master
4. 再次审查

**不要**重写整个 prompt。Targeted edits 比 full rewrites 更可靠——你冒的风险是打破已经工作正常的东西。

### Path C: Major Color or Layout Issues（50-80% 通过）

颜色普遍偏错。Layout proportions 不对。Mood 不匹配。

**怎么做：**
1. 回到 Stage 2（design the visual system）。Design specification 可能需要 refinements。
2. 重写 style master prompt 的 palette specification——检查 hex codes 是否正确，color philosophy description 对 exclusions 是否 explicit。
3. Regenerate。
4. 如果 2 次尝试后仍然不对：palette 可能需要 fundamental redesign。在 design tool 中看起来好的颜色，当模型在图像中解读时可能渲染得不一样。调整 palette 以在模型的 rendering tendencies 内工作。

### Path D: Garbage / Complete Failure（<50% 通过）

模型生成了 slide 而不是 style guide。输出 incoherent。颜色随机。Components unrecognizable。

**怎么做：**
1. 检查 opening sentence：是否说了 "This is a reference image, not a slide itself"？如果没有，加上。
2. 检查 prompt length：是否在 400 words 以下？如果长得多，模型可能丢失 instructions track。简化。
3. 检查 contradictory instructions：你同时要求 "minimal decoration" 和 "elaborate visual details"？简化。
4. Regenerate。如果再次失败，开启新的 conversation context（model state 可能被之前的尝试 corrupted）。

## When To Lock（何时锁定）

Style master 在以下条件满足时**锁定**：
- 每个 checklist 项都通过
- 你确信你不会改变其中任何东西

这是一个高门槛。Style master 传播到每一页 slide。一个 imperfect style master 意味着 imperfect slides。逐页修复 slides 比一次修好 style master 更昂贵。

### The Lock Step — 操作上意味着什么

1. Style master 文件成为 deck 的 **immutable visual contract**
2. 在 `2_backbone/visual-style/visual-style.md` 的 Change Log 中记录锁定决定
3. 如果以后改变整个 deck 的 visual direction，更新 `style-master-prompt.md` 后重新生成 canonical `style_master.jpg`；若用户选择自己的 Git 仓库，可按其明确授权保存 source history；如果只属于某一版，放进该版 `overrides/visual-style/`
4. 锁定的 style master 通过 `--style-reference` 传入所有后续 slide generation

## Versioning（版本管理）

canonical 文件名始终只有一个；deck 工作版本由可见 `vN` / 下游 override 承载，用户可选 Git 仅做 source audit，不把版本号再次编码进文件名：

```
2_backbone/visual-style/
  style-master-prompt.md    # 当前源 prompt
  style_master.jpg          # 当前锁定视觉锚
  style_master.image-task.json
```

需要保留被拒绝的尝试时，放进 `1_upstream_raw_material/style-master-iterations/`，不要污染 canonical visual-style 目录。

## The Psychological Trap（心理陷阱）

经过 2-3 次迭代后，你会想说 "good enough" 然后继续前进。这很自然——style master iteration 是细节导向的工作，你的大脑想到 "真正的" slides 去。

抵挡这个诱惑。每一个你现在跳过的 checklist 项，都会作为 20+ 页 slides 上的 inconsistency 重新出现。你花在逐页修复 slides 上的时间，会比多一次 style master iteration 花的时间多得多。

**经验法则**：如果一个 visual issue 出现在 30 页 slides 上会让你困扰，现在就在 style master 中修好它。如果它真的只是单页问题（特定于某个特定 diagram 或 layout），可以在该页的 per-slide prompt 中处理。

---

> **Next**: `05-use-the-style-master-for-slides.md` — style master 已锁定。现在如何使用它来生成视觉一致的 slides，以及生产过程中要留意什么。
