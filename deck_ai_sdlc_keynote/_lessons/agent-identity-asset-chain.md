# Agent Visual Identity Asset Chain

> 类型: 参考（reference） | 更新: 2026-07-30

## 遇到什么

v3（`whole-page-image2-v1`）生成的 Agent 形象每页不一致——有的"soft amber glow outlining its form"、有的是"small circle with etched radial lines"、有的是"larger agent figure labeled 舵"。三张已审核的 Agent 参考图（`model-sheet.png`、`guide.png`、`collaborating.png`）一次都没传进 Image2。

v2（`page-authority-image2-v2`）虽然 pipeline 支持，但所有 slide 的 `VISUAL IDENTITY` 都未激活（`identity_subject_count: "none"`）。

## 资产链（框架已全线贯通）

```
slide-specifications.md（每页可选）
  **VISUAL IDENTITY**: amber-agent/guide     ← 选 <profile>/<role>
  **IDENTITY SUBJECT COUNT**: one           ← 必须 one
  **SUBJECT RESTRICTIONS**: none            ← none | no-generic-metal-robot | no-identity-subject
         │
         ▼ resolvePageAuthorityIdentityReference()
image2-reference-material.yaml（SSOT 注册表）
  profiles.amber-agent.roles.guide:
    reference_path: guide.png               ← 已审核 PNG
    reference_sha256: cb81bcc0e...
    role_clause: "one warm amber light-form gently leads, open palm..."
         │
         ▼ verified SHA + role_clause compiled
ppt_flow.mjs image2 generate (line 1427-1428)
  references.push(identityPath)             ← base64 → Image2 API body.images
  body = { model, prompt, images: [style_master, identity_ref] }
```

**关键文件：**
- 注册表: `2_backbone/visual-style/assets/reference/amber-agent/image2-reference-material.yaml`
- 解析器: `PPTMAKER_FRAMEWORK/scripts/02-visual-system/internal/page_authority_reference_material.mjs`
- 参考图: `2_backbone/visual-style/assets/reference/amber-agent/*.png`
- 视觉教义: `2_backbone/visual-style/assets/reference/amber-agent/model-sheet.png`（SHA 硬编码验证）
- Agent 规范: `1_upstream_raw_material/agent-portrayal.md`（上游 prose 描述，非机器消费）

## 当前缺口

1. **v2 slide-specifications.md 全部 slide 未激活 VISUAL IDENTITY**。需要 Agent 的 slide（04 OneTool / 05 NewPart / 09 FabFive / 18 FramAut / 20 AllNem 等）应添加：
   ```markdown
   **VISUAL IDENTITY**: amber-agent/guide
   **IDENTITY SUBJECT COUNT**: one
   **SUBJECT RESTRICTIONS**: none
   ```

2. **已注册 role 只有 2 个**（`guide`、`collaborating`），但 deck 定义了 6 个命名 Agent：
   - 砚 Yan（inkstone, writer）— 安静写代码/测试/规范
   - 铸 Zhu（forge, builder）— 连接设备/调动资源/跑流程
   - 舵 Duo（rudder, planner）— 调度/编排
   - 核 He（core checker）— 承保核对
   - 察 Cha（inspector）— 欺诈筛查
   - 算 Suan（calculator）— 赔付计算
   
   当前只能复用 `guide` 和 `collaborating` 两个 role clause。每新增一个命名 Agent 需要在 registry 加一个 role + 对应的 reference PNG。

3. **v3 的 IMAGE PROMPT 里手写 Agent 描述没有任何 framework 约束**——`whole-page-image2-v1` pipeline 根本没有 VISUAL IDENTITY 字段。迁移到 `page-authority-image2-v2` 是激活资产链的前提。

## 激活步骤（下次怎么做）

1. 在需要 Agent 的 slide 里加三行 field（见上方示例）
2. 如果 deck 的命名 Agent 超出了 `guide`/`collaborating` 两个 role：在 `image2-reference-material.yaml` 的 `profiles.amber-agent.roles` 下新增 role，配上 reference PNG，更新 SHA
3. 运行 `ppt_flow validate` 确认 VISUAL IDENTITY 解析通过（parser 会验证 profile/role 在 registry 中存在、reference PNG SHA 匹配）
4. `image2 plan → authorize → generate` —— framework 自动把 identity reference image 编入 Image2 API 请求的 `images` 数组

## 下次先看哪

- [[agent-portrayal-spec]] — 上游 prose 规范（6 个命名 Agent 的定义）
- `2_backbone/visual-style/assets/reference/amber-agent/image2-reference-material.yaml` — role 注册表
- `PPTMAKER_FRAMEWORK/scripts/02-visual-system/internal/page_authority_reference_material.mjs` — 解析与 SHA 验证逻辑
- `PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs` line ~1426-1428 — reference image 注入点
