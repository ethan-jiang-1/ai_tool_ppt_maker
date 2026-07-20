## Why

HTML-first 已是新 deck 的完整可交付路径，但专业用户仍需要局部主视觉升级。现有 legacy Image2 是整页兼容维护能力，既不能安全地承担新 deck 的逐 slot 精修，也缺少成本授权、候选审核、资产 promotion 与崩溃恢复的可审计闭环。

现在 Change 4 已提供独立的预留 Phase-4 ownership、受约束接口边界和测试树，可在不改变 HTML 成品默认路径的前提下引入这条可选的付费能力。

## What Changes

- 新增 Phase-4 visual-slot refinement：只在 HTML 交付后推荐 2-4 个高价值页面；每页最多一个无文字主视觉 slot，首轮每页一个候选。
- 新增 hash-bound plan、用户明确授权、持久化 attempt 状态与 provider 对账；未授权、stale plan、scope expansion、重复提交和 `unknown-submit` 均不得自动产生额外远端调用。
- 新增 version-owned candidate/comparison/review 产物与逐页 `accept` / `use-html` 决定；部分失败不影响既有 HTML 成品或其他页面。
- 将 accepted candidate 原子 promotion 为版本 source asset 和 selection binding，以本地 HTML compositor 重合成交付；候选与 rejected history 永不写入 `1_upstream_raw_material/`。
- 增加 setup/promotion/review/cleanup 的 journal、幂等恢复、source/asset 完整性与 vNext 重判，保持删除 `_generated/` 后 accepted asset 可零远端重建。
- 增加 `ppt_flow image2` 的受限命令面、Phase-4 playbook/UX/onboarding，以及 HTML/modern/legacy Image2 双向隔离验证。

不新增新 deck 的 renderer 选择、整页 Image2、多个 visual slots、自动重试或未经授权的成本扩大。markerless legacy whole-page maintenance 保持 Phase 5 兼容行为。

## Capabilities

### New Capabilities

- `visual-slot-refinement`: HTML-first deck 的 Image2 visual-slot recommendation、精确授权、attempt、candidate review、promotion、fallback、cleanup 与恢复事务。

### Modified Capabilities

- `bootstrap-env-guidance`: 将首次 Image2 凭据/诊断引导限定到用户选择可选精修后的授权前路径。
- `cli-surface`: 定义 `ppt_flow image2` 的封闭命令、失败回执和成本安全边界。
- `commands-reference`: 路由可选主视觉精修，不把它呈现为新 deck 的必经 renderer 选择。
- `framework-charter`: 记录人类对远端成本和逐页视觉采用的控制权，以及现代/legacy Image2 的隔离。
- `framework-script-layout`: 将预留 Phase 4 升级为受限 public interface 与镜像测试 owner。
- `html-slide-contract`: 提供受限 selection-binding source transaction，保持封闭 YAML schema 与 round-trip 写边界。
- `html-slide-rendering`: 增加受限的 review-only visual-slot candidate composition seam，不让 Phase 3 读取 Phase-4 目录或把 candidate 写入 delivery。
- `image-generation`: 在独立现代 transport seam 实现授权 attempt、provider 对账和 secret-safe generation receipt，不改变 legacy whole-page generation。
- `node-specification`: 定义 version-scoped refinement execution/authorization/review evidence 与 CLI consumer 规则。
- `pipeline-orchestration`: 保持普通 HTML build/provider-free，并通过公开 Phase-4 操作触发显式精修后的本地重合成。
- `playbook-execution`: 增加可选 Phase-4 精修控制器和 completion/resume 规则，不给完整 HTML deck 制造 pending debt。
- `run-bundle-layout`: 确认 Image2 refinement 的 lazy derived/source/scratch 分区、候选 manifest 与 cleanup 边界。
- `visual-asset-management`: 提供受限版本 asset registration transaction，保持 v2 manifest 的唯一解析/序列化与 SHA 完整性权威。

## Impact

这是 framework repository maintenance，修改范围限于 `PPTMAKER_FRAMEWORK/`、`openspec/`、`tests/` 和 `tests_e2e/`。实现主要进入 `scripts/04-image2-refinement/`，并通过其公开接口与既有 Phase-2 selection resolver、Phase-3 composition 协作；provider transport 是可注入的 Phase-4 私有依赖，测试用 fake adapter 覆盖可观察行为。既有 `primary_visual.selection` 和 v2 asset manifest 保持其 current/stale/broken 与封闭字段契约，refinement provenance 不复制进这两个 schema。

既有 HTML create/build/local iteration、结构版本化和 markerless legacy maintenance 不改变语义，也不得因为本 change 产生 provider 加载或远端调用。run bundle 新路径仍为 lazy：用户不选择精修时不创建授权、候选或 pending execution。
