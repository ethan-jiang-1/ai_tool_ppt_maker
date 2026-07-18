## ADDED Requirements

### Requirement: Legacy Image2 entry points enforce their own remote prerequisites

Every legacy orchestration path SHALL first determine whether selected work can reuse current verified artifacts. Only a path that is about to submit Image2 work SHALL validate action-specific prerequisites, immediately before entering its remote adapter. Every remote submit SHALL require resolvable Image2 credentials and base URL. Legacy page generation through pilot, build, or visual rebuild SHALL additionally require its current style-reference asset. Style-master generation SHALL require transport prerequisites but SHALL NOT require a pre-existing style master. The guard SHALL use existing credential, run-bundle, and style-reference authorities and SHALL NOT rely on a prior doctor result. A missing prerequisite SHALL fail before provider submit with the existing secret-safe CLI diagnostic authority.

Local-only Stage subsets, dry runs, Structural Versioning materialization from verified artifacts, notes-only refresh, assembly that reuses already reviewed images, a no-op style-master invocation retaining its existing output, and Stage 2 when every selected image has current provenance SHALL NOT acquire Image2 transport prerequisites and SHALL NOT make a remote request merely because default doctor no longer checks Image2.

#### Scenario: Legacy pilot has no credentials

- **WHEN** a legacy pilot reaches its Image2 generation boundary without resolvable `IMAGE2_API_KEY` or `IMAGE2_BASE_URL`
- **THEN** it fails before the provider adapter is called
- **AND** the diagnostic points to explicit Image2 readiness/remediation without exposing secret values

#### Scenario: Legacy Stage 2 has no style reference

- **WHEN** a legacy build or visual refresh is about to enter Stage 2 and its required style master is absent
- **THEN** orchestration fails before any Image2 submit
- **AND** it identifies the style-reference prerequisite through existing run-bundle paths

#### Scenario: Style-master generation has no style master yet

- **WHEN** legacy style-master generation has valid Image2 transport prerequisites but no existing style master
- **THEN** the action may enter its remote adapter
- **AND** does not impose the page-generation style-reference guard on itself

#### Scenario: Local stages do not inherit Image2 gate

- **WHEN** an invocation runs only Stages 1, 3, 4, or 5 from valid local/reviewed inputs
- **THEN** missing Image2 credentials do not block the invocation
- **AND** no provider submit occurs

#### Scenario: Structural materialization remains remote-free

- **WHEN** a structural version reuses verified expensive raw renders under the existing materialization contract
- **THEN** it does not run an Image2 readiness guard as a substitute for materialization evidence
- **AND** it never silently invokes remote rendering

#### Scenario: Dry run does not require or submit Image2

- **WHEN** a legacy pipeline invocation includes Stage 2 but is executed with `--dry-run`
- **THEN** it may report the future prerequisite boundary but does not require secret values, launch a provider adapter, or submit remote work

#### Scenario: Current generated artifacts require no transport lookup

- **WHEN** style-master or Stage 2 determines that every selected output can be retained or reused under current provenance without generation
- **THEN** missing Image2 credentials and base URL do not block the invocation
- **AND** no transport prerequisite resolver or provider adapter is invoked

## MODIFIED Requirements

### Requirement: Pipeline runs on Node.js runtime

整个生产管线 SHALL 在 checked-in runtime profile 支持的 Node.js major (`22.x`、`24.x` 或 `26.x`) 上执行；`package.json` 的 `>=22` 只表达 engine floor，不自动支持 23/25 等未列出的 major. 所有脚本 SHALL 以 ESM (`.mjs`) 编写, `node script.mjs` 直接运行, 无需编译. 需要本地 HTML runtime 的调用 SHALL 消费 `html-render-runtime` 拥有的 exact Playwright/Chromium/font profile，而不得自行选择 system browser；legacy Image2 stages SHALL 继续使用其现有 Node adapter.

#### Scenario: Agent runs pipeline on Windows

- **WHEN** Agent runs `node scripts/ppt_flow.mjs build <run_dir>` on supported Windows with Node.js 22 and the selected pipeline's prerequisites
- **THEN** all selected production stages complete successfully, producing a `.pptx` file

#### Scenario: Node 20 is below the repository baseline

- **WHEN** Agent attempts to run the production pipeline on Node.js 20
- **THEN** the environment gate reports the unsupported runtime before production work proceeds
