# BUG-085: 交付后不提示"打开审稿"，status 的 Next 中游一过就哑火

> 严重级别: P2 | 发现: 2026-08-19 | 状态: 活跃

## 症状

两处下游引导断点，都会让小白误以为"做完了"或"卡住了"：

1. **交付后不引导审稿**：`ppt_maker_harness/scripts/shared/cli/commands/build.mjs:6` 成功只打
   `✓ Target Page Image {workflow} delivery assembled: {path}`——给了成品路径，但没说"打开这个 PPTX 审核一下"。`review-target-page-image-delivery` 是个 GATE（`create-deck.md:635-636`，proceed/repair/redirect），可 `build` 打完这行就停，小白看到 ✓ 加路径会以为任务完成，不会去开图比对。
2. **status 的 Next 中游哑火**：`ppt_maker_harness/scripts/shared/cli/command_support.mjs:654-678` 的 `Next:` 只列 `build`/`refresh` 与"Create visual profile"，**从不排 style-master / image2 的 pilot/authorize/review 序列**。小白最可能卡在中游（Style Master 之后、图片生成之间），而正是这个区间 `status` 不再给"下一步"。

## 根因

成功交接只给了"路径/单行"，没给"下一步人动作"（`build.mjs:6`）；`status` 的 Next 生成器没有覆盖上游到中游的渐进式生产步骤，只有 build/refresh 两类终态动作。

## 复现

1. `ppt_flow build <v1>` → 只见一行路径，无"打开审阅/还有 delivery review 决定"。
2. Style Master 就绪后 `ppt_flow status <v1>` → `Next:` 不再提示 style-master/image2 步骤。

## 修复关联

待后续 findings 汇齐后统一进 OpenSpec change（交付手：`build` 补"打开成品 + 走 delivery review Gate"；`status` 的 Next 覆盖完整画布进度序列，含 style-master 与 image2 渐进生产）。