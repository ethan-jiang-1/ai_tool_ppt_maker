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

## 3. Style Master 三种 surface casing + CONSTITUTION 陈旧树

- casing：`glossary.md:19-24` "Style Master"；CLI/spec "style-master"；`style_master.jpg`；`page_image_style_master.by_version`
- 陈旧树：`CONSTITUTION.md:115-117` 仍列 `2_backbone/visual-style/style-master-prompt.md`、`page-image-visual-language.yaml`；权威布局是 `1_upstream_raw_material/style-master-iterations/`（`glossary.md:19-21`、`run-bundle-layout/spec.md:73`）
- canonical：Style Master + 新布局

## 4. `page-image-visual-language.yaml` vs `pure-deck-visual-system.yaml`

- A：`CONSTITUTION.md:117` 旧文件名
- B（现）：`glossary.md:24`、`run-bundle-layout/spec.md:194-196`、`visual-config/spec.md:68-69` → `pure-deck-visual-system.yaml`
- canonical：后者（spec + glossary），CONSTITUTION 文件名已退休

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

1. **Phase N vs method module（#1）** —— 同一文件并存 + 代码双强制，最该先退 `lifecycle_phase`/"Phase" 或记映射
2. **`project-versioning/` spec 空目录** —— 要么补 spec 要么删目录
3. **CONTEXT.md 是术语权威却零引用 + 自相矛盾**（HTML/Image Production 两处 stale，#5/#6）—— 接线 + 调和
4. **CONSTITUTION 陈旧树（#3/#4）** —— style-master-prompt / page-image-visual-language 已退休文件名
5. **`schema/` 在两份清单里缺失（#8）**
6. **"11 条铁律" 标签（#2）**
7. **两个 init creator（#13）**
8. **playbook "intent routing appendix"（#9）**
