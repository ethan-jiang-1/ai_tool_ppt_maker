# Change 0: split-ppt-flow-command-modules（纯拆分,零行为变化）

> 阶段见 `progress.md`。人类决定（2026-08-16）: **拆一定要拆**,用最安全的拆法——纯拆分,
> 零行为变化,排在所有命令面 change 之前。
> 这是 findings-I 选项 B「库 seam + 薄 CLI」的**文件级前奏**: 只拆文件、不动 seam 位置、
> 不改测试哲学、不搬家 secret 边界——完整选项 B 留作独立 plan（`06` 延后清单）。

## 现状（已实测）

- `ppt_maker_harness/scripts/ppt_flow.mjs` = **4035 行**,是统一 CLI 入口（12 命令注册/分派）;
- 深 egress 层已经在 `scripts/shared/cli/`（`cli_bootstrap.mjs` + `cli_error.mjs`）——拆分目标
  目录与之同域;
- 3 个测试直接 import 入口内部符号（拆分必须处理的唯一「行为外」改动）:
  `tests/03-framed-image/test_framed_workflow.mjs:89`、`tests/04-pure-image/test_pure_workflow.mjs:89`、
  `tests/shared/image2/test_style_master_raw_binding.mjs:18` 都 import `targetPageImageSubmitFactory`。

## 目标结构

```
ppt_maker_harness/scripts/shared/cli/
├── cli_bootstrap.mjs            (不动)
├── cli_error.mjs                (不动)
├── command_support.mjs          (新: 跨命令共享胶水——resolveRunAdapter、submit factories、
│                                 emit 封装、错误码分类表的机械搬家,不重新归属)
└── commands/                    (新,12 个;文件名与命令名一致,kebab)
    ├── doctor.mjs / init.mjs / status.mjs / validate.mjs / build.mjs /
    ├── refresh.mjs / new-version.mjs / test.mjs / state.mjs /
    ├── slides.mjs / image2.mjs / style-master.mjs
    └── 约定: 每模块导出 handler + 注册 descriptor(grammar/flags/help;descriptor 声明的
        command id 与 `PPT_FLOW_COMMAND_INVENTORY` 中的名字相同)——C1 的
        declaration authority（01 §1.8）以此为载体

ppt_flow.mjs → 只剩: 入口、bootstrap 安装(:20 不动)、inventory、argv 解析、
                懒加载分派(动态 await import)、envelope 纪律调用
```

## 铁律（纯拆分 = 只搬不改）

1. **零行为变化**: 12 个命令名、flags、grammar、exit codes、stdout/stderr 契约、
   diagnostic schema 全部逐字不变;`PPT_FLOW_COMMAND_INVENTORY` 不变;
   `cli-surface`/`commands-reference` 的 fixed forms 不变;
2. **不重新归属**: 28 张错误码分类表、`styleMasterFailure` 决策树等 owner 渗漏,
   机械搬进 `command_support.mjs` 或所属命令模块,**不在 C0 里修归属**（留给 C1 之后）;
3. **冷启动不回退**: 命令体保持动态 `await import()` 风格（现有 `:80–82` 的
   `--help`/`doctor` 特判跳过 01-content 全量 import 的模式照搬）;
   禁止把命令模块改成顶层静态 import;
4. **模块初始化顺序与单例照搬**: 如 `runNode.lastChildResult`（模块级单例）原样搬家;
5. **测试 import 修正**: 上述 3 个测试的 `targetPageImageSubmitFactory` import 改为指向
   新 shared home——仅测试面改动,生产行为不变;
6. **governance 登记**: `harness-script-layout` delta + `harness_architecture.mjs` seam
   admission（`commands/` 目录 + command_support import 边界）,否则架构审计红。

## 同步面（~20 文件）

- 新增: 12 个命令模块 + `command_support.mjs`;
- 重写: `ppt_flow.mjs`（4035 行 → 估计 200–300 行入口）;
- 测试: 上述 3 个 import 修正（其余 spawn 测试零改动）;
- spec: `openspec/specs/harness-script-layout/spec.md` MODIFIED（新 layout + seam 声明）;
- 审计: `harness_architecture.mjs`（seam admission）;`executable_inventory.mjs`（若登记脚本清单）。

## 完成判据

0. planning artifacts 过 polish 门,达 `ready for apply`（`progress.md` 全局规则）;
1. `npm test` 全绿（含全部现有 spawn 测试与 3 个修正 import 的测试）;
2. 全部审计绿: `harness_architecture` / `harness_coherence` / `harness_document_command_audit` /
   `cli_return_audit` / `test_process_docs_consistency`;
3. 冷启动 smoke: `--help` 耗时与拆分前同数量级（不回退）;
4. `git diff --check` + `openspec validate split-ppt-flow-command-modules --strict` 全绿;
5. 行为零变化证据: 拆分前后对同一 fixture run bundle 跑**全部 12 个命令**
   （`init` 用新建 deck 根;`slides` 用 list/resolve;`image2` 用 plan/artifact-view 等无提交
   形态;`style-master` 用 inspect;其余按最小合法参数）,stdout/stderr 逐字节一致。

## 与后续 change 的关系

- C1 的 declaration authority（`01` §1.8）直接建立在各命令模块的 descriptor 上;
- C2/C4 的「命令体搬迁」变为「在已拆分的模块内编辑/迁移」,diff 更小、review 更纯;
- `01–04` 中引用的 `ppt_flow.mjs` 行号按当前工作区实测（`ppt_flow.mjs` 最后修改 commit
  `5571002`）,C0 落地后行号失效,由执行 Agent 按新模块定位。
