# Tasks: align-current-layer-terminology

> 排序：spec（唯一真源）→ 文档/CONTEXT/文件名（镜像）→ 验证。全部为措辞/文档修改，
> 不动机器序列化字段（`header_region`/`protected_composition`/`reserved_header`/`body_safe`）。

## T1 Spec 措辞（10 个 capability 的 MODIFIED 落位）

- [ ] **T1.1** `node-specification`：4 个 requirement MODIFIED（R22 state.mjs SAFETY、R23 State
  YAML、R26 State uses one declared current shape、Controller metadata：source/workflow pair、
  durable workflow、production identity；场景标题保持原名）。
  - 完成判据：grep `durable mode|source-mode pair|source/mode pair|infer mode|production mode`
    在 `openspec/specs/node-specification/spec.md` 清零（普通英语 mode 除外）。
- [ ] **T1.2** `pipeline-orchestration`（1 requirement）、`harness-charter`（2）、
  `playbook-execution`（2）、`cli-surface`（1）、`workflow-inspection`（1）MODIFIED 落位
  （M-1：protected geometry → protected composition；harness-charter 另含 M-2：protected
  zone → Provider Avoidance Constraint；playbook-execution 另含 M-3：resume ritual 的
  durable mode/inferred mode → durable workflow/inferred workflow）。
  - 完成判据：grep 清零。
- [ ] **T1.3** `visual-config`（1）、`image-production`（1）、`image-generation`（3）MODIFIED
  落位（M-1 + M-2：protected zone → Reserved Header Region；image-generation 另含 M-9：
  Framed evidence 显式引用 image-production owner）。
  - 完成判据：grep 清零。
- [ ] **T1.4** `environment-check` 四处 MODIFIED 落位（Base mode/Image2 mode → provider-free
  base scope / Image2-inclusive scope；含 `Image2 readiness requires explicit runtime
  profile identity` 的 "Base and Framed-local modes" 组织轴）。
  - 完成判据：正文中 `Base mode|Image2 mode|base mode|Image2-mode|and Framed-local modes`
    清零；**场景标题豁免**（"Base mode does not initialize a provider" 等是身份，验证器
    禁止改名，只改 WHEN/THEN/AND 内容）。
- [ ] **T1.5** `openspec validate align-current-layer-terminology --strict` 通过；
  确认每个 MODIFIED 与 main spec 的场景标题一一对应（archive 不拒）。

## T2 文档 / CONTEXT / 文件名（apply 阶段）

- [ ] **T2.1** M-1 文档 10 文件散文统一（AGENT_CONTRACT/WORKFLOW/glossary/anti-patterns/
  workflow README ×3/classify-change/edit-text/edit-visual；06-iteration 当前树无命中）。
  - 完成判据：`grep -rn "protected geometry\|protected-geometry" ppt_maker_harness/` 清零
    （AGENT_CONTRACT:14 已是规范词，确认不动）。
- [ ] **T2.2** M-8：`00-setup/README.md` 路径改 `../../charter/`、`../../reference/`；
  `glossary.md:59` "export action" → `` `repair-current-protocol-identity` ``。
- [ ] **T2.3** M-2 CONTEXT：`CONTEXT.md:218-221` Protected Zone 段改为"曾用旧名，现已不再
  使用；仅历史文档可见"。
- [ ] **T2.4** 文件名重命名：`04-validate-page-authority-visual-system.md` →
  `04-validate-page-image-visual-system.md`（git mv）+ 更新引用者。
  - 完成判据：`grep -rn "page-authority-visual-system\|04-validate-page-authority" ppt_maker_harness/` 清零。
- [ ] **T2.5** L-2：`scripts/README.md:36` 悬空句修复、`CLAUDE.md:20` 三步名 → Step 0-4、
  `docs/adr/0001` 标 Superseded（`docs/adr/` 当前无 README 索引，无需更新状态行）。
  - 完成判据：`grep -n "quick intake" ppt_maker_harness/CLAUDE.md` 清零。

## T3 验证与收尾

- [ ] **T3.1** grep 清零矩阵全过（见 design §3）。
- [ ] **T3.2** `npm test`、`npm run test:sweep`、`openspec validate --strict` +
  `openspec validate --all --strict`、`git diff --check` 全绿。
- [ ] **T3.3** archive；更新 `_backlog/plans/current-layer-legacy-trace-audit.md` 的
  Progress Tracker（Change 1 → done，Change 2 → NEXT）+ 顶部状态行。
- [ ] **T3.4** 豁免记录复核：L-2#4 示例 node 名未改（理由已写入 proposal/design），audit
  文件中保留该记录。
