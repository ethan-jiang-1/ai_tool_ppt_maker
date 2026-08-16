# Design: Align doctor operation readiness

## 决策概览

| 决策 | 结论 | 拥有侧 |
|---|---|---|
| 共享 startup 来源 | 新增 `shared/image2/startup_env.mjs`（受限 loader）：只读声明 keys，shell > deck `.env` > cwd `.env` 补缺，不输出值 | JS（image-generation provider boundary） |
| Loader API | `resolveImage2StartupEnv`（返回 merged env，不突变）+ `applyImage2StartupEnv`（就地补缺，返回 loadedFrom 位置摘要）；`extraKeys` 供入口声明自己的非 IMAGE2 key | JS |
| 消费方 | doctor run-bound branch、`image2 authorize/generate`、Style Master authorize/generate、env-check raw-generation 全部改走同一 loader | JS |
| Provider-free 操作 | 不加载 dotenv（plan/pilot/expansion/review/accept/reconcile/artifact-view/status/state） | JS |
| Doctor registry | 移除 `image2-raw` alias 与 `assembly-notes`；accepted = {framed-local-refresh, raw-generation, full-build} | JS（environment-check） |
| cli-surface 合同 | MODIFIED R13：authorize 允许解析受限非秘密 startup env 做 profile identity 检查；credential 仍 generate-scoped | MD⇔JS protocol |
| hard-stop | missing/invalid/mismatch 在 grant/attempt/provider request 前 secret-safe hard-stop，不放松 identity | JS |
| 兼容 | 无新命令/flag/字段；run-bundle `none`；不相关 CLI 行为不变 | — |

## 1. 共享受限 startup loader

`ppt_maker_harness/scripts/shared/image2/startup_env.mjs`（import-safe：只依赖 node:fs/node:path，
无 npm 依赖，env-check 预安装边界可静态导入）：

```js
export const IMAGE2_STARTUP_KEYS = Object.freeze([
  "IMAGE2_API_KEY",
  "IMAGE2_BASE_URL",
  "IMAGE2_PROVIDER_PROFILE_ID",
]);

export function resolveImage2StartupEnv({ runDir = null, searchDirs = null, extraKeys = [], env = process.env } = {})
//  dirs = runDir ? [deckRoot(runDir), process.cwd()] : (searchDirs ?? [process.cwd()])
//  merged = { ...env }
//  对每个 dir 按序读取 .env，仅对 (IMAGE2_STARTUP_KEYS ∪ extraKeys) 中 merged 缺失的 key 补值；
//  显式 env 永不被覆盖；返回 { env: merged, loadedFrom: [<dir 路径>, ...] }（frozen，无值）

export function applyImage2StartupEnv(opts = {})
//  同 resolve，但就地补缺到 env（默认 process.env），返回 { loadedFrom }——消费方保持读 process.env 不变
```

- `extraKeys` 只用于入口自己声明的非 IMAGE2 key（env-check 声明 `PPT_FONT_DIR` 以保持 checkFonts
  行为），不得用于任意 key 透传。
- `loadedFrom` 只含目录路径，绝不包含 key 值或 secrets。
- deck 根解析复用 `deckRoot(runDir)`（bundle_layout 现有 helper），不复制路径逻辑。

## 2. 消费方改造

| 入口 | 现状 | 改为 |
|---|---|---|
| `ppt_flow doctor` run-bound raw-generation/full-build branch（:743-744） | `loadDotenv(route.deck_dir); loadDotenv(process.cwd());` | `applyImage2StartupEnv({ runDir: route.run_dir })`（profile identity 检查读 process.env 不变） |
| `image2 authorize` / `image2 generate`（commandTargetPageImageImage2） | authorize 完全不加载；generate 经 `targetPageImageGenerateCredentials`（:2501） | 入口对 authorize/generate 先 `applyImage2StartupEnv({ runDir: route.run_dir })`；`targetPageImageGenerateCredentials` 内改同一 loader |
| Style Master authorize / generate（commandStyleMaster） | generate 经 `initializeStyleMasterImage2Transport`（:2512） | 入口对 authorize/generate 先 `applyImage2StartupEnv({ runDir: route.run_dir })`；transport 初始化改同一 loader |
| `env-check`（00-setup/internal/env_check.mjs runAllChecks :633） | 自实现 walk-up `loadDotenv`（最近祖先 `.env` 全量加载） | `applyImage2StartupEnv({ searchDirs: [...walkUpDirs(start)], extraKeys: ["PPT_FONT_DIR"] })`（保留最近祖先优先；IMAGE2 keys 与 IMAGE2 consumer 同源） |

- 放置位置：image2/style-master 的 apply 放在命令入口的 authorize|generate 分支内、owner 调用之前；
  其他 image2 操作分支不调用（provider-free 不加载）。
- apply 幂等（只补缺），doctor/generate 入口重复调用无害。

## 3. Doctor operation registry（environment-check）

- `PAGE_IMAGE_DOCTOR_OPERATIONS` 收敛为 `["framed-local-refresh", "raw-generation", "full-build"]`；
  移除 `"image2-raw"`（隐藏 alias）与 `"assembly-notes"`（无 owner readiness）。
- `pageImageDoctorPlan` 删除 `operation === 'image2-raw'` 分支（唯一名 `raw-generation`）；
  未知 operation 走既有 usage 诊断并列出 accepted 集合（:1062-1065 逻辑自动生效）。
- help 文本已只列三个 operation（env-check.mjs:15），无需改。
- 消费审计：`tests/00-setup/test_process_env_check.mjs` 若引用 `image2-raw`/`assembly-notes` 需更新
  为负向断言（usage 拒绝）。

## 4. cli-surface 合同修正

MODIFIED `Current Image2 transport remains single-endpoint and bounded`：将"provider-free plan,
Pilot/Expansion, authorization, … do not load or write dotenv configuration"改为——provider-free
plan/Pilot/Expansion/reconciliation/review/acceptance/delivery 不加载 dotenv；`image2 authorize`
仅通过共享受限 startup env 解析 exact-run 非秘密 profile identity，不解析 credentials、不改写
dotenv、不 claim/初始化 provider。credential pair 解析保持 generate-scoped（R13 其余正文不变）。

## 5. hard-stop 与负向路径

- missing/invalid/mismatch：`resolveImage2RuntimeProfileId`/`requireMatchingImage2RuntimeProfileId`
  既有错误与分类不变（`environment`/`repair_environment`，或 source 类 `source_validation`/
  `edit_source`）；只改变"读取哪些来源"，不改变"缺失时如何失败"。
- shell 显式值永不被 deck/cwd `.env` 覆盖；mismatch 时 deck `.env` 的值参与比较后仍 hard-stop。
- 无 provider side effect：authorize 的 loader 调用不初始化 credentials/不发起网络。

## 6. 验证策略

- **unit**：`tests/shared/image2/test_startup_env.mjs`（manifest 注册 interface）——precedence
  正反（shell > deck > cwd；deck 补缺；cwd 补仍缺）、只读声明 keys（.env 中其他 key 不进 merged）、
  不覆盖显式值、`extraKeys`、无值输出（返回值不含 key 值）、缺失文件/空文件、runDir 与 searchDirs
  两种模式。
- **进程回归（BUG-070）**：`tests_e2e/shared/workflow/` 新增 mock 用例——(a) deck `.env` 含三 key、
  shell 不 export：`doctor --run-dir --operation raw-generation` READY；随后 `image2 authorize`
  不再以 profile-identity 失败（进入后续 gate 或成功）；(b) deck `.env` profile 与 plan-bound
  mismatch：authorize 仍以 mismatch hard-stop、零 provider call；(c) Style Master authorize 同源
  断言。复用 mock journey 的 fixture/lifecycle helper。
- **registry 测试**：`tests/00-setup/test_process_env_check.mjs` 增加 `--operation image2-raw` /
  `assembly-notes` → usage 拒绝的负向断言。
- **回归**：`npm test`、`npm run test:sweep`、process tier、mock e2e、`openspec validate --strict`、
  `openspec validate --all --strict`。

## 7. Policy 合规

- `human-centered-gates.md`：missing/invalid/mismatch = `hard-stop`（protected invariant：
  provider identity/attribution 边界、零 provider side effect），唯一恢复路径
  `repair_environment`/`edit_source` 后重跑同一 checkpoint；不引入 confirm/waiver/force。
- `agent-assistance-and-control.md`：一个受限 startup 来源 + 一个 precedence，替换 doctor/generate
  三处 ad-hoc `loadDotenv` 与 env-check walk-up 变体；不建立第二 config authority。
- `simple-reliable-control.md`：净简化——删除 `image2-raw` alias、`assembly-notes` hollow op、
  非受限 dotenv 读取；loader 是唯一读取点；`extraKeys` 是有声明边界的例外，不是通用透传。
