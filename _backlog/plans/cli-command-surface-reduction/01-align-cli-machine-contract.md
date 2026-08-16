# Change 1: align-cli-machine-contract（G + H + D）

> 对应 `_backlog/_findings/cli-agent-ergonomics-and-optimization-space.md` §3 的 G/H/D 三项。
> 零档 + 一档,纯增量。建议 openspec change 名: `align-cli-machine-contract`。

## 范围与内容

| 项 | 内容 | 收益 |
| --- | --- | --- |
| **G 帮助机器契约块** | 每个命令 `--help` 尾部固定输出: exit codes（0/1,`state validate` 的 2 特例）、stdout/stderr 契约（失败时 stderr 最后一行为唯一 envelope）、本命令输出的 digest 字段名（plan_hash/batch_hash/grant digest）、`--decision` 枚举 | Agent 读一个 help 就能正确调用;全局缓解 2.1–2.9 |
| **H 动词撞名决策表** | style-master vs image2 同动词差异表（hash 需求、decision 枚举、产物）;挂进 `harness_document_command_audit` 防漂移 | 缓解 2.5（plan/authorize/review/accept 两家族语义漂移） |
| **D `--json` 一致性** | `validate`/`build`/`refresh`/`new-version` 补 `--json` + 注册 report schema;`style-master` 补显式 `--json` flag（或明确"无 flag 也 JSON"并写进帮助）;成功 digest 字段名统一列进 help | 机器事实一条规则可拿;缓解 2.7/2.1 |

## 同步面（本 change 必改,~12–15 文件）

- **代码**: `ppt_maker_harness/scripts/ppt_flow.mjs`（help 文案 + 4 命令的 `--json` 分派）;
  `scripts/shared/cli/cli_error.mjs`（report schema 注册）
- **spec**: `openspec/specs/cli-surface/spec.md`（`--json`/report 条款、help 契约条款）;
  `openspec/specs/commands-reference/spec.md`（如提及命令形态）
- **文档**: `ppt_maker_harness/COMMANDS.md`（决策表或引用）;`charter/AGENT_CONTRACT.md`、
  `charter/NODE-SPEC.md`（仅当机器契约表述需要同步）
- **测试**: 4 组命令测试 + `tests/contracts/test_cli_surface.mjs` + 1 个帮助契约防漂移测试
  （spawn `--help` 断言契约块存在）
- **审计**: `scripts/contracts/harness_document_command_audit.mjs` 登记 H 决策表

## 风险 / 取舍

- 纯加法/文案: 现有输出不变,无行为破坏。唯一行为变化是 `style-master` 新增 `--json` flag
  （此前无 flag 也输出 JSON）——新 flag 是显式化,默认输出保持原样即可零破坏;是否改变默认
  由 proposal 定。
- [帮助契约与实现漂移] → 防漂移契约测试 spawn `--help` 断言契约块存在且字段与实现一致。

## 完成判据

1. 每个命令 `--help` 含机器契约块,契约测试绿;
2. 新增 `--json` 的 4+1 个命令成功输出为注册 schema 的单文档 JSON;
3. `npm test` + `openspec validate align-cli-machine-contract --strict` 全绿;
4. 无 exit-code / stdout-stderr 契约变化（本 change 不改协议,只把协议写进帮助）。
