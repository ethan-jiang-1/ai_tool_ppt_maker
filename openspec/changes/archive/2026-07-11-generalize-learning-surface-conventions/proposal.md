## Why

这是 **Agent workflow**：编排器会自我琢磨、自我试探、**自己克服困难**、自我修复——修好之后若经验只留在聊天里，下一轮失忆，闭环就断了。Run bundle 需要一块**自留教训面**；**`charter/CONSTITUTION.md` 必须用独立小节把这层暗示说清楚**。

今日缺口：种子 README 把 Image2/env 写成主角；目录名 `_learning/` 偏「在学」、弱于「克服后留下」；宪法对闭环强调不够。

## What Changes

- **BREAKING**：目录 `_learning/` → **`_lessons/`**（唯一名；常量 `LESSONS_DIR` / `LESSONS_DIR_README`）
- **CONSTITUTION 独立小节**：遇事自己克服 → 留下非密钥教训 → 下次先读（Framework 约定 / bundle 自积累）
- 重写 README 种子：闭环 + 泛化 + 写条目规矩；Image2/env 仅打比方
- 树 / deck 模板 / Image2 SSOT 全部改指 `_lessons/`；`image2-proven.yaml` 仍是该类条目推荐文件名
- 迁移 `deck_ai_sdlc_bpm_keynote`：`_learning/` → `_lessons/` + 覆盖 README

## Capabilities

### Modified

- `run-bundle-management` — `_lessons/` + `LESSONS_DIR_README`；init/树/selfCheck/legacy
- `framework-charter` — CONSTITUTION 自留教训面（独立小节 + 树）
- `image-generation` — 冒烟落点 `_lessons/image2-proven.yaml`；服从 `_lessons/README` 规矩

## Impact

`bundle_layout.mjs`、`CONSTITUTION.md`、`template-deck-guide`、`03-tool-selection`、`BOOTSTRAP`、`AGENTS`、测试断言、main specs（archive sync）、`deck_ai_sdlc_bpm_keynote`。

**Out of scope**：`_issues/`；自动写条目代码；改 Image2 凭据契约。
