# Design: Align current-layer terminology

## 决策概览

| 决策 | 结论 | 拥有侧 |
|---|---|---|
| 修改面 | 10 个 main spec（MODIFIED）+ 文档 10 文件（M-1）+ 文档 4 文件（M-8/L-2 新增；glossary 与 M-1 共用）+ `CONTEXT.md` + 1 个文件名重命名 | MD⇔JS protocol（纯措辞） |
| M-1 | `protected geometry`/`protected-geometry` → `protected composition` | 散文统一（spec 7 文件 + 文档 10 文件） |
| M-2 | `protected zone`/`protected-zone` → `Reserved Header Region`（本地空间）或 `Provider Avoidance Constraint`（provider 指令） | 散文统一 |
| M-2 CONTEXT | `CONTEXT.md:218-221` "still uses" 反向过期 → "曾用旧名，现已不再使用；仅历史文档可见" | 术语权威修正 |
| M-3 | retired `mode` 措辞 → `selected workflow`/`source/workflow pair`/`durable workflow`/`production_identity`；环境检查的 `Base mode`/`Image2 mode` → `provider-free base scope`/`Image2-inclusive scope`（检查范围表述） | 散文统一 |
| M-8 | `00-setup/README.md` 相对路径 → `../../charter/`、`../../reference/`；`glossary.md` "export action" → `` `repair-current-protocol-identity` ``；退役文件名重命名 | 文档修正 |
| M-9 | `Complete Page Review` 决策语义以 `image-production` 为 owner；`image-generation` 的 Framed 细节 requirement 保留但显式引用 owner | spec 收敛 |
| 场景标题 | **不改名**（OpenSpec 验证器强制：MODIFIED 场景标题是身份，改名=删除旧场景）；只改 WHEN/THEN/AND 内容 | 验证约束 |
| 豁免 | node-specification 场景示例 node 名（L-2#4）不改：无行为影响、restate 面大，留待专项 | 成本权衡 |
| 红线 | `header_region`/`protected_composition`/`reserved_header`/`body_safe` 序列化字段一字不动；无命令/flag/行为变化 | 机器契约 |

## 1. 术语映射（唯一替换表）

| 旧（退役/回流） | 新（规范） | 适用 finding |
|---|---|---|
| `protected geometry` / `protected-geometry` | `protected composition` | M-1 |
| `protected zone`（指本地空间） | `Reserved Header Region` | M-2 |
| `protected zone`（指 provider 指令语境） | `Provider Avoidance Constraint` | M-2 |
| `protected-zone`（Pure 不暴露 Framed 本地控制） | `Reserved Header Region` | M-2 |
| `durable mode` | `durable workflow` | M-3 |
| `source/mode pair` | `source/workflow pair` | M-3 |
| `infer mode` / `infer a source, mode, controller` | `infer a selected workflow` / `infer a source, workflow, controller` | M-3 |
| `current state, mode` | `current state, workflow` | M-3 |
| `mode record` | `workflow record` | M-3 |
| `production mode` | `production identity` | M-3 |
| `Base mode` / `Image2 mode`（env-check 检查范围） | `provider-free base scope` / `Image2-inclusive scope` | M-3 |
| `export action` | `` `repair-current-protocol-identity` `` | M-8 |

应用原则：只替换**退役语义**的命中；「拒绝/禁止退役输入」语境中的旧词（如
"`production_modes` SHALL fail"）保留——那是正确的拒绝行为，不是残留（audit 判定边界）。
每处替换后 grep 复核清零。

## 2. 各文件修改清单

### Spec（10 个 capability，均 MODIFIED）

| capability | requirement | 修改 |
|---|---|---|
| node-specification | state.mjs SAFETY / State YAML / State uses one declared current shape / Controller metadata | M-3 措辞（source/workflow、durable workflow、production identity） |
| pipeline-orchestration | Page Image invalidation is determined by current compiled inputs | M-1 ×3 |
| harness-charter | Harness guidance defines… / Harness guidance routes changes… | M-2（:179 Provider Avoidance Constraint）/ M-1（:192 protected-composition） |
| playbook-execution | Current Controller refresh and Pilot paths… / Existing-deck sessions start with whole-workflow resume ritual | M-1（:348）+ M-3（:54,57 durable mode/inferred mode → durable workflow/inferred workflow） |
| cli-surface | CLI diagnostics validate the closed Framed header contract | M-1 |
| workflow-inspection | Inspection projects the direct compiled-input lifecycle | M-1 ×2 |
| visual-config | Pure deck visual system is a closed version-resolved source contract | M-1（:284）+ M-2（:298 Reserved Header Region） |
| image-production | Complete Page Review makes one complete-page decision | M-2（:84 Reserved Header Region） |
| image-generation | Current raw lifecycle… / Current provider compilation binds… | M-1（:321 / :942） |
| environment-check | Zero-dependency runtime check / API key verification / Image API base URL / Image2 readiness requires explicit runtime profile identity | M-3（base/Image2 检查范围表述；场景标题保留原名；含 "Base and Framed-local modes" 组织轴） |

### 文档（apply 阶段直接改，无需 delta）

- M-1 文档 10 文件：AGENT_CONTRACT:32、WORKFLOW:30、glossary:57、anti-patterns:29、
  workflow/README:16、02-visual-system/README:36、03-framed-image/README:9、
  classify-change:34、edit-text:20、edit-visual:20
  （AGENT_CONTRACT:14 已是规范词，不动；06-iteration/README 当前树无命中，不处理）
- M-8：00-setup/README:24,45,49（路径）、glossary:59（export）、文件名重命名
- L-2：scripts/README:36（悬空句）、CLAUDE.md:20（quick intake → Step 0-4）、
  docs/adr/0001（标 Superseded）
- CONTEXT.md:218-221（Protected Zone 反向过期修正）

### 文件名重命名

`ppt_maker_harness/workflow/02-visual-system/04-validate-page-authority-visual-system.md`
→ `04-validate-page-image-visual-system.md`（git mv），更新其全部引用者（grep
`04-validate-page-authority-visual-system`）。

## 3. 验证策略

- **grep 清零断言**（apply 后）：
  - `protected geometry|protected-geometry` 在 `openspec/specs/` + `ppt_maker_harness/` 清零
    （仅保留「禁止/拒绝」语境——如有豁免需列明）
  - `protected zone|protected-zone` 在 `openspec/specs/` 清零；`CONTEXT.md` 只剩
    「曾用旧名」说明（:218-221）与 Avoid 列表禁止语境（:209，告诉读者勿用旧词——符合
    §1 原则「拒绝/禁止退役输入」语境保留）
  - retired `mode` 短语（`durable mode|source-mode pair|source/mode pair|infer mode|production mode`）
    在 `openspec/specs/` 清零（普通英语 mode 不在此列）；environment-check 正文的
    `Base mode|Image2 mode|base mode|Image2-mode` 清零（场景标题豁免——身份不可改，
    只改 WHEN/THEN/AND）
  - `04-validate-page-authority-visual-system` 全仓清零（改名后）
  - `quick intake`、`export action` 清零
- **行为无变化**：`npm test`（core）、`npm run test:sweep`、`openspec validate --strict` +
  `--all --strict`、`git diff --check`。
- **不做**：process/e2e 重跑（纯措辞，无行为面；core + sweep 已覆盖 guard/coherence 面）。

## 4. Policy 合规

- 本 change 是纯措辞/文档对齐：不涉及 gate/readiness/diagnostic/state 行为变化，不新增
  控制层；`simple-reliable-control.md` 的净简化体现在消除新旧并存的第二表述（同一份文档
  AGENT_CONTRACT 内 :14/:32 新旧打架、CONTEXT "still uses" 与实现零命中矛盾）。
- 红线（不动序列化字段）与 audit 风险缓解一致：M-1/M-2 只改散文。
