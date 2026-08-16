# Tasks: align-doctor-operation-readiness

> 排序：loader/来源 → registry → 消费方 → 合同 → 回归。每个任务标注 capability 与完成判据。
> 全部使用隔离 fixture，不触碰 production `deck_*`/`dpt_*`，不手改 `_generated/`。

## T1 共享受限 startup loader

- [x] **T1.1** 新建 `ppt_maker_harness/scripts/shared/image2/startup_env.mjs`（capability:
  image-generation）：`IMAGE2_STARTUP_KEYS`、`resolveImage2StartupEnv`（merged env、
  `extraKeys`、`loadedFrom` 位置摘要、无值输出）、`applyImage2StartupEnv`（就地补缺）。
  - 完成判据：unit tests——shell > deck > cwd 正反；只读声明 keys；不覆盖显式值；无值输出；
    缺失/空 .env；runDir 与 searchDirs 模式；import-safe（无 npm 依赖）。
- [x] **T1.2** manifest 注册 `shared/image2/startup_env.mjs` 到 shared/image2 interface + 测试登记。
  - 完成判据：`npm test`（architecture guard）通过。

## T2 Doctor registry 收敛（environment-check）

- [x] **T2.1** `00-setup/internal/env_check.mjs`：`PAGE_IMAGE_DOCTOR_OPERATIONS` 移除
  `image2-raw` 与 `assembly-notes`；`pageImageDoctorPlan` 删除 `image2-raw` 分支。
  - 完成判据：unit/进程测试——`--operation image2-raw`/`assembly-notes` → usage 拒绝并列出
    accepted 集合；help 与 accepted 集合一致。
- [x] **T2.2** `runAllChecks` 的 `.env` 加载改走 `applyImage2StartupEnv({ searchDirs:
  [...walkUpDirs(start)], extraKeys: ["PPT_FONT_DIR"] })`；删除内部 `loadDotenv`。
  - 完成判据：`tests/00-setup/test_process_env_check.mjs` 全绿；IMAGE2 checks 与 consumer 同源；
    checkFonts 的 `PPT_FONT_DIR` 行为保持。

## T3 消费方统一（image-generation / style-master-generation）

- [x] **T3.1** `ppt_flow.mjs` doctor run-bound branch（:743-744）改走 `applyImage2StartupEnv({
  runDir: route.run_dir })`。
  - 完成判据：进程测试——deck `.env` 无 shell export 时 raw-generation READY。
- [x] **T3.2** `commandTargetPageImageImage2`：authorize/generate 入口先 `applyImage2StartupEnv({
  runDir })`；`targetPageImageGenerateCredentials` 改用同一 loader。
  - 完成判据：BUG-070 回归——无 shell export 时 authorize 不再以 profile-identity 失败；
    mismatch 仍 hard-stop 且零 provider call。
- [x] **T3.3** `commandStyleMaster`：authorize/generate 入口先 `applyImage2StartupEnv({ runDir })`；
  `initializeStyleMasterImage2Transport` 改用同一 loader。
  - 完成判据：进程测试——Style Master authorize/generate 与 Image2 同源同 precedence；
    provider-free planning 不加载 dotenv。

## T4 合同同步（cli-surface / environment-check）

- [x] **T4.1** cli-surface delta（MODIFIED R13）与 environment-check delta 已随本 change 提供；
  实施后 main specs 同步时逐字落位。
  - 完成判据：archive 后 main specs 与 delta 一致；`openspec validate --all --strict` 通过。

## T5 回归与验证

- [x] **T5.1** 进程级 BUG-070 回归（tests_e2e mock 或 process tier）：doctor READY → authorize
  同源；mismatch hard-stop；Style Master 同源。
  - 完成判据：全部通过；断言无 provider call（mock provider calls 为空或不存在）。
- [x] **T5.2** `npm test`、`npm run test:sweep`、process tier、`npm run test:mock-e2e` 全绿。
- [x] **T5.3** `openspec validate align-doctor-operation-readiness --strict --no-interactive` 通过；
  `openspec doctor` 通过；main specs 同步并 archive。
- [x] **T5.4** BUG-070 评估记录写入路线图文件（回归通过后评估关闭，正式关闭留给 bug 台账 owner）；
  M-5 #6/#7（`assembly-notes`、隐藏 `image2-raw`）关闭证据记录。
