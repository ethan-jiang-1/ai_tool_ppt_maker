## Why

Header review gate 被建成守门员（检查→拒绝→报错），而不是向导（检查→告诉 MD 下一步→继续）。BUG-003 暴露了三个设计缺陷：① 全局指纹——改 s05 标题锁死全部 25 页；② Gate 输出内部术语（"fingerprint is stale"）——用户不知道发生了什么也不该需要知道；③ Gate 不尊重 `--only`——指定只改 3 页，检查全部 25 页。用户试了 7 种 workaround 全失败。

核心理念：Gate 的消费者是 **MD Controller**。Gate 被触发时，应该返回 MD 可直接执行的动作指令。MD 拿到指令自动修——用户无感知。

## What Changes

- **header review gate 重构为 per-slide 状态机**——s05 标题变了只影响 s05，不牵连其余页
- **Gate 输出改为 MD 可消费格式**——`{format, applicable, ok, changed: [{id, field, was, now}], action: "可执行命令", hint: "人话解释"}`
- **纯 full-page deck 自动跳过**——无 body+header-lock 对比基线时 gate 不适用
- **`--only` 限缩 gate 检查**——只查指定的 slide
- **AGENT_CONTRACT 定位升级**：标题改为「你的 PPT 助手」；新增开篇定位声明（"我是来帮你做成的，不是来卡你的"）；Rule 4 软化；新增 Rule 12「Gate 是向导，不是路障」
- **State record 改为 per-slide schema**——`slides.{id}.{status, fingerprint, header_snapshot, ...}`

## Capabilities

### Modified Capabilities
- `pipeline-orchestration`: gate 从全局锁 → per-slide 向导；输出对 MD 友好
- `node-specification`: header-review state record 从全局 → per-slide schema

## Impact

- `PPTMAKER_FRAMEWORK/scripts/lib/header_review.mjs` — 四个函数重构
- `PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs` — Stage 2/4 gate 适配
- `PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs` — build/refresh 适配
- `PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md` — 新增 Rule 12
- `PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md` — state schema 更新
- **非 BREAKING** — 旧 record（无 `slides` 字段）自动放行
