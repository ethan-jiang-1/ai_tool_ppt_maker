# Term Drift — 术语漂移清单

> 来源：keel §3（ambiguous authority）+ rot-audit `ambiguous authority` 指标 | 2026-08-13
> 每条：概念、叫法 A @ file:line、叫法 B @ file:line、canonical 判断。

## 1. "Phase N" vs "method module NN" —— 同一生命周期两套编号（最高信号）

- A（旧）：`workflow/00-setup/README.md:54` "5 Phase"；`workflow/01-content/README.md:10` "# Phase 1"；`workflow/02-visual-system/README.md:8` "# Phase 2"；`harness/CLAUDE.md:22` "the Phase you are executing"
- B（现）：`README.md:40` "method graph = `03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration`"；`harness-directory-layout/spec.md:33` "method-module"
- **同一文件并存**：`playbook/classify-change.md:3-4` 同时带 `lifecycle_phase: "5"` 和 `method_module: 06-iteration`；代码两套都强制（`md_controller_reader.mjs:394,415-418`）
- canonical：`method_module` / method graph（charter + spec 全收敛；`node-specification` 从不提 `lifecycle_phase`）

## 2. "11 条铁律 / 11 rules" vs 契约实际形态

- A：`CLAUDE.md:11`、`harness/CLAUDE.md:21`、`workflow/00-setup/README.md:55` 说 "11 条铁律 / 11 non-negotiable rules"
- B：`charter/AGENT_CONTRACT.md` 实为 11 个 section，无数值编号的 "rules"
- canonical：文件本身（sections）。"11" 是旧枚举版本的残留

## 3. Style Master 三种 surface casing + Run Bundle source roles

- casing：`glossary.md:19-24` "Style Master"；CLI/spec "style-master"；`style_master.jpg`；`page_image_style_master.by_version`
- `style-master-prompt.md` 与 `page-image-visual-language.yaml` 是 `2_backbone/visual-style/` 的 current sources；`style-master-iterations/` 是独立的历史/accepted selection surface。
- canonical：Style Master 的 history、intent 与 visual-language sources 各有明确角色；C2 已将三者完整列入 Constitution、glossary 和 layout specification。

## 4. `page-image-visual-language.yaml` vs `pure-deck-visual-system.yaml`

- `page-image-visual-language.yaml` 是 shared Page Image visual-language source；`pure-deck-visual-system.yaml` 是 Pure-only presentation profile source。
- canonical：两者并存且职责不同；C2 已将此 distinction 写入 Constitution、glossary 和 layout specification。

## 5. "HTML Production"（仍当活概念）vs "HTML deck rendering 已退休"

- A：`CONTEXT.md:79-81` 把 "HTML Production" 列成与 Image Production 平行的活 family
- B：`html-slide-rendering/spec.md:1,11-13` "Retired"；`html-render-runtime/spec.md:1-6` 幸存者重构为私有 "Framed Capture Runtime"
- canonical：spec（HTML deck rendering 已退，只剩 Framed capture runtime）

## 6. "Image Production" 定义漂移

- A：`CONTEXT.md:83-84` "whole-page OR visual-slot asset"
- B：`image-production/spec.md:2` "Page Image Workflow capability family"（仅 whole-page）
- canonical：spec（visual-slot 分支是被取代的旧 pipeline）

## 7. slide_id 字段 vs NN_slideID 文件名 vs --slide-id flag

- `slide_id`（`slide-identity-and-ordering/spec.md:7`）；`NN_slideID.png`（`image-production/spec.md:6`）；`--slide-id`（`cli-surface/spec.md:227`）
- 同一概念三种 casing，非冲突但常绊人

## 8. `schema/` 在两份目录清单里缺失

- 有：`README.md:20`、`harness-directory-layout/spec.md:44-46`（权威 home）
- 缺：`glossary.md:3-4`、顶层 `AGENTS.md:15-21`
- canonical：`schema/` 是 "single authoritative definition home"

## 9. `playbook/` 两种互斥描述

- A：`AGENTS.md:20` "自然语言意图路由（附录）"
- B：`README.md:19` + `playbook-execution/spec.md:7` "MD Controllers + manifest"
- canonical：后者

## 10. intent-routes.json 三个名字

- `COMMANDS.md:37` "discovery catalog"；`AGENT_CONTRACT.md:113` "closed discovery catalog"；`CONTEXT.md:271-273` + `playbook-execution/spec.md:27` "Intent Route Catalog"
- canonical："Intent Route Catalog"

## 11. Protected Zone / Provider Avoidance Constraint / Reserved Header Region

- `CONTEXT.md:206-209` 自己承认：代码仍叫 "Protected Zone"，canonical 是 "Reserved Header Region" + "Provider Avoidance Constraint"

## 12. "workflow" 三义过载

- (a) pipeline 名 `page-image-workflow`；(b) 版本级选择 `production.workflow: framed|pure`；(c) `workflow/` 方法论目录 + workflow nodes；"pipeline" 又用于 (a)（`NODE-SPEC.md:26`、`BOOTSTRAP.md:30`）

## 13. run bundle 由谁创建 —— 两个 init 命令

- A：`BOOTSTRAP.md:15`、`AGENTS.md:30` → `ppt_flow init …`
- B：`CONSTITUTION.md:153` → `bundle_layout.mjs --init …`；`README.md:24` "created by bundle_layout.mjs"
- canonical：以 `ppt_flow init` 为准（BOOTSTRAP + 顶层 AGENTS 是入口；CONSTITUTION/README 是旧描述）

## 修复优先级（ranked）

1. **C1 已完成**：`lifecycle_phase` / "Phase N" 已退休，收敛为 `method_module`。
2. **已排除**：`project-versioning/spec.md` 的不存在是 `test_harness_directory_layout.mjs` 明确断言的无 release-version surface，不是缺失 capability。
3. **C2 已完成**：`CONTEXT.md` 已接入入口链，HTML/Image Production 定义已调和。
4. **C2 已完成**：Constitution tree 已列出 Style Master history、intent 与 visual-language sources 的不同角色。
5. **C2 已完成**：`schema/` 已补入 active Harness source maps。
6. **C2 已完成**：旧 "11 条铁律" 标签已移除。
7. **C2 已完成**：public init 入口与 layout owner 的 lower-level interface 已区分。
8. **C2 已完成**：`playbook/` 已统一定义为 MD Controller home。
