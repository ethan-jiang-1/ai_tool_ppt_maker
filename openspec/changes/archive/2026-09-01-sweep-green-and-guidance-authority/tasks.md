## 1. B-JS：扫描器豁免（先做：解锁后续所有 sweep 验证）

- [x] 1.1 在 `ppt_maker_harness/scripts/contracts/harness_architecture.mjs` 的 residue 匹配环为 `ACTIVE_SURFACE_NUMERIC_VERSION` 命中增加前置字符 `[\w-]` 跳过逻辑（token 内部标识符片段豁免）；验证：node 直接调用 `evaluateActiveSurfaceResidue`，`command_result.mjs:80` 与 `tests/shared/cli/test_process_cli_error.mjs:372` 两处不再报 issue
- [x] 1.2 在 `tests/contracts/test_production_schema_conformance.mjs` 既有 focused 覆盖中扩展两例：① 构造含生产角色词 + `reset-unproduced-v1` 标识符的行 → 接受；② 同一行另植裸 `v1` + 角色词 → 仍报 `retired-numeric-protocol-identity`；验证：`npx vitest run tests/contracts/test_production_schema_conformance.mjs` 中新用例通过（此时全文件仍红，因 spec 行文未改）

## 2. B-spec：6 处规范行文锚定（语义不变，逐字对照 delta）

- [x] 2.1 `openspec/specs/run-bundle-management/spec.md`："Unproduced unique v1 can be owner-reseeded" requirement 两个场景的裸 `v1` 锚定为 `3_versions/v1`（对齐 change delta）；验证：grep 该 requirement 内不再有未锚定裸 `v1`，扫描该文件无 residue issue
- [x] 2.2 `openspec/specs/slide-identity-and-ordering/spec.md`："Page-plan publication reuses exact structural source protections" 的段落与两个场景共 3 处裸 `v1` 锚定（对齐 change delta）；验证：同上
- [x] 2.3 `openspec/specs/cli-surface/spec.md`："Unproduced unique v1 reset is a registered direct command" 的 "Successful reset restores the init authoring draft" 场景 `against that v1` 改为 `against the unproduced 3_versions/v1`（对齐 change delta）；验证：同上

## 3. C：COMMANDS.md 新手词汇边界（消除 spec↔test 矛盾）

- [x] 3.1 `ppt_maker_harness/COMMANDS.md` Common Requests 的 image-channel 行改写为 Deck-Author 词汇（不含 `ppt_flow`、`--flag`、JSON/stderr/diagnostic. 词表），语义三目标不变（confirmed 可取图 / candidate 发现 / 空 `_lab/` 不阻塞）；验证：`test_diagnostic_recovery_handoff.mjs` 的 Common Requests 禁词断言对该行通过
- [x] 3.2 同文件 Common Requests 的 reset 行（"still only v1 … page plan as v1"）改写为不含裸版本 token 的新手表述，保留 unproduced 语义；验证：扫描该文件无 `retired-numeric-protocol-identity`
- [x] 3.3 确认 `## Agent Routing Reference` 段声明 `probe-image-channels` / `ppt_flow probe <run-dir>` 精确命令（缺失则补齐）；验证：`openspec/specs/commands-reference/spec.md` delta 的新场景断言（novice 区间无实现词汇 + Agent 段有精确命令）两条均通过

## 4. A/D/E：guidance 文档合规

- [x] 4.1 根 `AGENTS.md:52` "跑回归测试" 改为 bounded core verification 词表（如 "跑受保护核心验证（非全量回归）"）；验证：`grep -n "回归" AGENTS.md` 仅剩"非全量回归"类否定式表述，`cli-surface` 词表 requirement 精神合规
- [x] 4.2 删除 `ppt_maker_harness/BOOTSTRAP.md` 的空 "Runtime check map" heading 骨架，替换为指向 `ppt_flow doctor` / `environment-check` 的两行权威指针；验证：`grep -rn "Runtime check map"` 零命中，`npm test` docs 锁定字符串（`Reserved Header Region`、`Provider Avoidance Constraint`）仍通过
- [x] 4.3 依赖清单四处（根 `AGENTS.md`、`README.md`、`ppt_maker_harness/charter/CONSTITUTION.md`、`openspec/config.yaml`）各加"完整清单以 `package.json` 为唯一权威"指针句；根 `AGENTS.md` 与 `config.yaml` 枚举对齐核心六项（实施期事实修正，见 design 附录）；验证：`grep -rn "唯一权威" 四文件` 命中，`openspec validate --strict` 通过（config.yaml registry 块未动）

## 5. F：事实归属收敛（A–E 全绿后执行）

- [x] 5.1 盘点 "framed|pure 选择 + `production_identity.by_version` + `repair-current-protocol-identity` hard-stop" 全部复述实例，按 design D6 三分类写入 `design.md` 附录归属表；验证：附录表完整、每实例有分类；无 requirement 级变化（未触发拆分条件）
- [x] 5.2 按归属表把非 home 实例改为一行指针（保留 root `AGENTS.md` 单 bullet 入口摘要、BOOTSTRAP 紧凑投影、CLAUDE.md redirect 豁免、机器锁定术语导向句）；验证：`grep` 确认非 home 文件不含完整规则三要素复述，`npm test` 的 docs 锁定字符串全通过
- [x] 5.3 在 `tests/contracts/test_process_docs_consistency.mjs` 新增归属锁定断言（非 home 文件无完整规则文本 + 含 home 指针）；验证：process 档运行该断言绿，且 negative 自证（pre-change 文本含 `production_identity` → 断言谓词为真）

## 6. 收口验证与规格同步

- [x] 6.1 core：`npm test` 绿
- [x] 6.2 两个原红测试：`npx vitest run tests/contracts/test_production_schema_conformance.mjs tests/contracts/test_diagnostic_recovery_handoff.mjs` 全绿
- [x] 6.3 全量：`npm run test:sweep` 701/701 绿（无新增失败）
- [x] 6.4 `openspec validate "sweep-green-and-guidance-authority" --strict` 与 `openspec validate --all --strict` 通过；`git diff --check` 干净
- [x] 6.5 归档准备：确认 main specs 将在 archive 时从 5 个 delta 同步（delta 与 main requirement 文本逐字一致），回填 design 附录的归属表最终版
