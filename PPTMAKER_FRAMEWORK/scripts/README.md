# Scripts — Phase ownership map

`PPTMAKER_FRAMEWORK/scripts/` 是框架的 Node.js ESM 生产代码树。它与 `workflow/00`–`05` 使用同一套 Phase 词汇，但职责不同：workflow 解释方法，scripts 实现可执行管线，`tests/` 和 `tests_e2e/` 镜像验证 owner。

日常入口只有一个：

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs <command>
```

维护者需要直接运行某个 adapter 时，必须使用下文列出的 canonical owner path。旧的 root flat paths 和 `scripts/lib/` 已删除，不提供兼容 shim。

## Exact tree

```text
scripts/
├── README.md
├── ppt_flow.mjs
├── 00-setup/
│   ├── index.mjs
│   ├── env-check.mjs
│   └── internal/
├── 01-content/
│   ├── index.mjs
│   └── internal/
├── 02-visual-system/
│   ├── index.mjs
│   └── internal/
├── 03-html-production/
│   ├── index.mjs
│   ├── stage1_build_inputs.mjs
│   ├── stage2_render_html.mjs
│   ├── stage3_compose_slides.mjs
│   ├── stage4_build_pptx.mjs
│   ├── stage5_inject_notes.mjs
│   ├── unified_pipeline.mjs
│   └── internal/
├── 04-image-production/
│   ├── index.mjs
│   ├── whole-page/           # direct whole-page CLIs and lazy provider adapter
│   └── visual-slot/          # HTML-dependent visual-slot adapter and private transport
├── 05-iteration/
│   ├── index.mjs
│   ├── change-classifier.md
│   ├── structural/
│   ├── migration/
│   └── internal/
├── shared/
│   ├── cli/
│   ├── run-bundle/
│   ├── state/
│   └── identity/
├── contracts/
├── fonts/
└── fixtures/
```

根目录白名单只有 `README.md`、`ppt_flow.mjs`、六个 numbered Phase 目录、`shared/`、`contracts/`、`fonts/` 和 `fixtures/`。Image Production 只通过 family/adaptor `index.mjs` 暴露 whole-page 与 visual-slot interfaces；CLI 仍只从 root `ppt_flow image2` 进入，provider transport 保持 private injectable。

## Deep Phase interfaces

每个 active Phase 只暴露一个 import-safe `index.mjs`。外部 caller 依赖 cohesive operation，不依赖 owner 的 `internal/` 文件、物理 artifact path 或 CLI bootstrap。

| Interface | Owner responsibility | Allowed consumers |
|---|---|---|
| `00-setup/index.mjs` | provider-free base/package/browser/font/runtime readiness | root doctor、env-check adapter、Phase 3 |
| `01-content/index.mjs` | structured source、slide identity、selector、render policy | Phase 3、Phase 5 |
| `02-visual-system/index.mjs` | visual config、asset catalog、components、tokens、geometry | Phase 3、Phase 5 |
| `03-html-production/index.mjs` | HTML validate/preview/build/refresh、Stage 1–5 local production | root、Phase 5 |
| `04-image-production/index.mjs` | whole-page and visual-slot public adapters | root、Phase 3、Phase 5 |
| `05-iteration/index.mjs` | structural versioning、migration、local iteration、explicit whole-page legacy maintenance | root |

Importing an interface must not parse arguments, install a CLI transaction, exit the process, write production files, launch Chromium, initialize a provider, or eagerly load heavy operation-specific implementation. Operation boundaries use string-literal dynamic imports so static architecture checks can resolve the edge.

## Public shared interfaces

Only these paths are cross-owner public interfaces:

- `shared/cli/cli_bootstrap.mjs`
- `shared/cli/cli_error.mjs`
- `shared/run-bundle/bundle_layout.mjs`
- `shared/run-bundle/production_marker.mjs`
- `shared/state/state.mjs`
- `shared/state/md_controller_reader.mjs`
- `shared/state/html_review_evidence.mjs`
- `shared/identity/canonical_json.mjs`
- `shared/identity/byte_hash.mjs`
- `shared/identity/notes_receipt.mjs`
- `shared/identity/render_artifacts.mjs`

其他 shared 文件是 private。唯一允许的 shared internal collaboration 是 `shared/run-bundle/bundle_layout.mjs` 和 `shared/state/html_review_evidence.mjs` 访问 `shared/state/internal/html_review_evidence_core.mjs`；没有目录级或 pattern 级豁免。`shared/run-bundle/lessons.mjs` 是 direct CLI adapter，不是跨 owner library interface。

## Fourteen direct executables

Canonical registry 位于 `contracts/executable_inventory.mjs`。路径必须是相对 `scripts/` 的 POSIX path，不能退化为 basename。

1. `ppt_flow.mjs`
2. `00-setup/env-check.mjs`
3. `03-html-production/stage1_build_inputs.mjs`
4. `03-html-production/stage2_render_html.mjs`
5. `03-html-production/stage3_compose_slides.mjs`
6. `03-html-production/stage4_build_pptx.mjs`
7. `03-html-production/stage5_inject_notes.mjs`
8. `03-html-production/unified_pipeline.mjs`
9. `04-image-production/whole-page/generate_style_master.mjs`
10. `04-image-production/whole-page/make_contact_sheet.mjs`
11. `04-image-production/whole-page/stage2_generate_images.mjs`
12. `04-image-production/whole-page/stage3_lock_headers.mjs`
13. `shared/run-bundle/bundle_layout.mjs`
14. `shared/run-bundle/lessons.mjs`

普通 direct Phase CLI 必须是 owning `index.mjs` 上的薄 adapter。仅以下五个 process seam 可协调多个 public owner：`ppt_flow.mjs`、`00-setup/env-check.mjs`、`03-html-production/unified_pipeline.mjs`、`03-html-production/stage1_build_inputs.mjs`、`03-html-production/stage4_build_pptx.mjs`。它们仍不得 import foreign private implementation。

## Import direction

```text
ppt_flow -> active Phase index + declared public shared interfaces
Phase    -> own private + public shared + contracts + allowlisted foreign Phase index
shared   -> public shared + contracts
contracts -> contract-owned modules + exact external parser leaves
```

Exact foreign-Phase adjacency：

```text
00-setup            -> {}
01-content          -> {}
02-visual-system    -> {}
03-html-production  -> {00-setup, 01-content, 02-visual-system}
04-image-production -> {01-content, 02-visual-system, 03-html-production}
05-iteration        -> {01-content, 02-visual-system, 03-html-production, 04-image-production}
```

Image Production 的 `visual-slot` adapter 只由 `image2-refine` controller 在 current HTML delivery review 后显式授权；`whole-page` adapter 由 `image2-only` create-deck nodes 使用，且不需要 HTML delivery。`shared/` 不能 import numbered Phase；Phase 不能 import foreign `internal/` 或 foreign executable；contracts 不能反向 import Phase/shared production implementation。两个 adapter 不得跨入对方的 private transport。

## Source-to-test ownership

测试树使用相同 owner vocabulary：

```text
tests/{00-setup,01-content,02-visual-system,03-html-production,04-image-production,05-iteration,shared,contracts,helpers}
tests_e2e/{00-setup,01-content,02-visual-system,03-html-production,04-image-production,05-iteration,shared,helpers}
```

Machine-readable mapping 位于 `tests/contracts/source-test-ownership-v1.json`。它必须覆盖每个 Phase/public shared/declared contract interface、15 个顶层 command surface 及其 direct executable union、unit/integration owner 和 owning E2E journey；缺失、重复、目录不匹配或 executable union 漂移都 fail closed。`tests/helpers/` 与 `tests_e2e/helpers/` 只构造输入、临时目录和 fake adapter，不复制 production parser/state/fingerprint/path 规则。

## Verification authorities

- CLI envelope、diagnostic、return category：`openspec/specs/cli-surface/spec.md`
- 目录、interface、import graph、manifest：`openspec/specs/framework-script-layout/spec.md` 和 active change delta
- Static enforcement：`contracts/framework_architecture.mjs`
- Default regression：`npm test`

不要在本 README 复制 CLI producer schema；这里负责 ownership 和导航。不要手改 `_generated/`，也不要把 `deck_*` / `dpt_*` 当 framework test fixture。
