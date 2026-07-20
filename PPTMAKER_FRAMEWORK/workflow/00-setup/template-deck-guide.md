---
title: Template — Per-Bundle deck-guide.md
stage: workflow/00-setup
position: template
type: template
summary: HTML-first run bundle 的人类入口与 Agent 操作卡；legacy deck 按 marker 路由兼容维护。
depends_on:
- charter/CONSTITUTION.md
- scripts/shared/run-bundle/bundle_layout.mjs
feeds_into: []
agent_action: copy_to_bundle
---

# Template — Per-Bundle deck-guide.md

将下面内容写入 `deck_{NAME}/deck-guide.md`，替换 `{{...}}`。`AGENTS.md` 与 `CLAUDE.md` 只需指向它。

```markdown
# {{DECK_NAME}} — PPT 项目指南

> 当前 run version：`{{CURRENT_VERSION}}`。先改 source，再让管线重建；不要直接改 `_generated/`。
>
> 可见 `vN` + Structural Versioning Path 是 deck 工作版本权威。Git 只是可选、用户拥有的 source/control 审计；本框架不提供自动 Git source recovery，也不把 `_generated/` 当作恢复目标。

## 人类只需要知道这些

| 想改什么 | Source owner |
|---|---|
| 每页标题、正文、layout family、notes | `3_versions/{{CURRENT_VERSION}}/slide-specifications.md` |
| 主叙事、公式、设计约束 | `2_backbone/` |
| palette、字体角色、组件规则、资产 | `2_backbone/visual-style/` |
| 原始调研 | `1_upstream_raw_material/` |

跟 Agent 说“改第 5 页文案”“把这页换成 comparison”“新增风险页”即可。Agent 会把 position 解析为稳定 `slide_id`，选择最小本地刷新路径，并在结构变化前展示 before/after。

## 看进度

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state \
  {{DECK_NAME}}/3_versions/{{CURRENT_VERSION}}
```

HTML-first 完整路径是 structured source -> local HTML preview -> content/visual review -> contact sheet/PPTX/notes -> final delivery review。它不需要 Image2 key 或 style master。完成交付后可显式选择 `04-image2-refinement` 做 2–4 页 visual-slot 精修；不选择就没有 Phase-4 欠账。

Markerless 历史 deck 会显示 `legacy-image2-first`，继续走 legacy maintenance；不要手动补 HTML marker。

## Agent 控制流

- `production.pipeline` 是最早分支权威。
- HTML outputs 在 `_generated/html_production/`，QA lineage 在 `_generated/qa/`；全部可重建、不可手改。
- Preview 可在 gates pending 时运行；Stage 4 必须有当前 reset-bound content/visual evidence。
- Local Slide Rebuild：单页 header/body/family/fallback。
- Local Deck Rebuild：visual config/runtime/renderer 影响全册。
- Notes-Only Refresh：assembly lineage 当前时只跑 Stage 5。
- Structural Versioning Path：preview + exact hash -> source-only clean vNext -> explicit target-local materialization。
- HTML structural debt 是 `needs_local_materialization`；legacy remote debt 是 `needs_render`。
- stable ID 只允许 byte matching，不继承 reset、gate、delivery review 或 node decision。

## 常用命令

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs validate \
  {{DECK_NAME}}/3_versions/{{CURRENT_VERSION}}
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot \
  {{DECK_NAME}}/3_versions/{{CURRENT_VERSION}}
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build \
  {{DECK_NAME}}/3_versions/{{CURRENT_VERSION}}
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs slides list \
  {{DECK_NAME}}/3_versions/{{CURRENT_VERSION}}
```

CLI 非零退出时，只消费 stderr 最后一个有效 failure envelope。`requires_human: true` 必须停下取得决定；不要猜 path/hash/token，也不要手修 `_state`、journal、lock 或 `_generated/`。

## 项目约定

- 语言：{{LANGUAGE_POLICY}}
- 内容禁忌：{{CONTENT_CONSTRAINTS}}
- 视觉禁忌：{{VISUAL_CONSTRAINTS}}
- 视觉 preset：{{VISUAL_PRESET}}
```

短指针：

```markdown
# {{DECK_NAME}}

进入这个 run bundle 先读 [deck-guide.md](deck-guide.md)。它定义 source ownership、CLI 诊断和下一步。
```
