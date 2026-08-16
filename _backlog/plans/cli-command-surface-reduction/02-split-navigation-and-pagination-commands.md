# Change 2: split-navigation-and-pagination-commands（S1 + 修正后的 S2）

> 阶段见 `progress.md`。吸收评审 `07` 第 1/6 条: 只迁 narrative;**保留 structural `slides apply-plan`**。

## S1: `image2 artifact-view` → `artifacts`

- 现状: provider-free 导航重建住在付费生命周期家族（cli-surface 4 条要求反复强调
  not a selector / 不授权）;
- 新形态: `artifacts <run-dir>`（窄决策: 裸名 vs `artifacts rebuild`,proposal 定）;
- 触点: playbook 0 处;`AGENT_CONTRACT.md` human-inspection handoff 1 处;
  `image-generation/spec.md` :765/:1782;`tests/contracts/test_human_artifact_reference_cli.mjs` 30 处;
  `bundle_layout.mjs:1518`（deck-guide seed 文本 → clean-break 边界,见 `05` §F）。

## S2（修正）: 只迁叙事分页,保留结构回放

代码事实（已复核）: `slides apply-plan` 按 plan 的 schema 分流——`narrative-page-plan` 走
`applyNarrativePagePlan`（`ppt_flow.mjs:1392–1405`）;非 narrative 走 `verifySlideEditPlanHash` +
`applyConfirmedSlideTransaction`（`:1423–1444`）的结构事务回放。narrative owners 已是独立函数
（`narrative_page_plan.mjs:452 previewNarrativePagePlan` / `:533 applyNarrativePagePlan`）,
新命令只是薄路由。

- `slides narrative-plan <run-dir> --candidate <path>` → `paginate plan <run-dir> --candidate <path>`
- narrative schema 的 apply → `paginate apply <run-dir> --plan <path> --plan-sha256 <hash>`
  （窄决策: 是否保留 `--apply`;倾向 plan/apply 两 operation,去双重 apply）
- `slides apply-plan` **保留**,只服务 structural transaction replay;
  narrative schema 投到 `slides apply-plan` → 在任何 binding/write/provider work **之前**失败,
  并给 `paginate apply` 精确替代诊断
- tombstone 仅 `slides narrative-plan`;`apply-plan` token **不**全局 tombstone

## 不变量（评审 07 第四节 C2）

- navigation rebuild 仍 provider-free、非 selector、非授权、非 lifecycle transition;
- narrative candidate/plan 仍受 `_scratch/` lexical+realpath confinement、canonical bytes、
  exact hash 约束;
- structural replay 的 persisted plan、drift fencing、零 provider、target 不重复变更保持原契约;
- 旧 narrative 入口在任何 binding/write/provider work 前失败并返回新命令。

## 同步面（~25–30 文件,重估）

- 固定税见 `05` §A;
- specs: `cli-surface`(:660–677)、`narrative-authoring`、`image-generation`;
- docs: `create-deck.md` 3 处、`03-specify-structured-slides.md` 3 处、`AGENT_CONTRACT.md` 1 处;
- tests: `test_target_structural_cli`（保留并确认回放 + 新 narrative 路由）、
  `test_narrative_page_plan_cli`/`test_narrative_page_plan`、`test_mock_narrative_authoring_journey`、
  `test_human_artifact_reference_cli`。

## 完成判据

1. 两类 plan schema 路由不混淆（契约测试: narrative → `paginate`,structural → `slides apply-plan`）;
2. 旧 `slides narrative-plan` live 域计数 → 0（除 tombstone/禁止句）;
3. structural replay 契约测试（含 drift 零写）原样通过;
4. `npm test` + `openspec validate split-navigation-and-pagination-commands --strict` 全绿。
