## 1. `shared/cli/commands/` 契约头达标（17 个）

- [x] 1.1 逐一处理 17 个命令模块：5 个无头（artifacts、paginate、reset-unproduced-v1、state、style-master）新增契约头，12 个在既有首块注释内插入 `Authority:` 行；每个文件的 owning capability 以 grep `openspec/specs/` 的证据确定（如 `init`→run-bundle-management、`doctor`/`preflight`→environment-check、`state`/`status`→node-specification/workflow-inspection、`style-master`→style-master-generation、`image2`→image-generation；双 owner 文件列多行指针），按 design D2 schema 书写，禁止复述 requirement。验证：对 69 文件清单跑检测脚本，commands/ 目录零缺口；`npm test` 全绿
- [x] 1.2 提交该组（仅注释变更），`git diff --stat` 确认无 `.mjs` 逻辑行变更

## 2. `shared/` 其余接缝契约头达标

- [x] 2.1 对 `PUBLIC_SHARED_INTERFACES` 中其余 shared 文件（cli 支撑、diagnostic、identity、page-image、image2、run-bundle、state、workflow 各目录）执行同一样达标：无头的新增（如 `canonical_json.mjs`、`byte_hash.mjs`、`provider_profile.mjs`、`runtime_profile_id.mjs`、`page_image_source_receipt.mjs`、`page_image_presentation_envelope.mjs`、`cli_bootstrap.mjs`），有头的插入 Authority 行；指针按 capability registry（`openspec/config.yaml`）owner_paths 证据确定（如 `bundle_layout.mjs` 列 run-bundle-layout + run-bundle-management 双指针、`problem_fact.mjs`→diagnostic-facts、`inspect_workflow.mjs`→workflow-inspection）。验证：shared/ 目录零缺口；`npm test` 全绿
- [x] 2.2 提交该组（含 4 个"保留不动"大文件，仅注释）

## 3. stage `index.mjs` 契约头达标（7 个）

- [x] 3.1 `00-setup`、`01-content`、`02-visual-system`、`03-framed-image` 4 个新增契约头；`05-delivery`、`06-iteration` 2 个在中部既有头插入 Authority 行；`04-pure-image` 仅插入 Authority 行并核对其格式为其余提供样板。验证：7 个 stage index 全部被检测脚本判合规；`npm test` 全绿
- [x] 3.2 提交该组

## 4. architecture guard 契约头检查 + focused tests

- [x] 4.1 在 `harness_architecture.mjs` 新增清单驱动的契约头校验（design D2/D3：显式文件清单 + 可注入读取；检测首个 `/**` 块、`* Authority: openspec/specs/<capability>/spec.md` 行、被指 spec 路径 existsSync），装配真实注册清单接入现有 snapshot 校验路径。验证：临时脚本对全仓 69 文件跑校验返回零 issue
- [x] 4.2 在 `tests/contracts/test_harness_architecture.mjs` 增加四个用例：已注册接缝缺头/无指针→失败并点名；补合规头后→同检查通过；未注册 internal 文件缺头→不报告；指针指向不存在 spec→报告 stale pointer。验证：`npm run test:focused -- tests/contracts/test_harness_architecture.mjs` 全绿（36/36）
- [x] 4.3 提交 guard 与测试

## 5. 统一入口措辞对齐

- [x] 5.1 修改 `ppt_flow.mjs:11` 头注释：`the human-facing command map` → `the novice-facing discovery reference (commands-reference)`，保持"不枚举命令清单"其余语义不变。验证：`grep -rn "command map" ppt_maker_harness/` 零命中（`openspec/specs/` 主 spec 命中在 sync 时随 delta 归档消除）；`npm test` 全绿（含 command-surface guard 用例，process 档 6/6）
- [x] 5.2 提交

## 6. 全量验证

- [x] 6.1 `npm test`（core）全绿
- [x] 6.2 `npm run test:sweep` 全绿（706/706，含新增 focused 用例）
- [x] 6.3 `openspec validate "add-public-seam-contract-headers" --strict` 与 `openspec validate --all --strict` 通过（26/26）；`git diff --check` 干净；sync 后 `openspec validate --specs` 25/25，`command map` 全 repo 清零
