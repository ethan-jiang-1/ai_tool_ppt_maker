# Scripts — 生产脚本

> 所有可执行代码. Agent 运行时调这些. 脚本就地运行, 不复制进 run bundle.

> 修改任何 CLI 入口、返回通道、JSON 模式、delegation 或 exit path 前，先读 `openspec/specs/cli-surface/spec.md` 与 active `cli-surface` delta；统一使用 `scripts/lib/cli_error.mjs`，不要在脚本内复制诊断 schema。

## 入口

| 脚本 | 用途 | 调用 |
|------|------|------|
| `ppt_flow.mjs` | CLI 命令面 (12 个命令) | `node scripts/ppt_flow.mjs <command>` |
| `bundle_layout.mjs` | 目录结构 SSOT | `node scripts/bundle_layout.mjs [--init\|--check\|--self-check]` |

## 生产管线

| 脚本 | Stage | 输入 → 输出 | 依赖 |
|------|-------|------------|------|
| `stage1_build_inputs.mjs` | 1 | `slide-specifications.md` → `slide_plan.json` + `_prompts.json` | 标准库 |
| `stage2_generate_images.mjs` | 2 | `_prompts.json` + style master → PNGs | `image_api_client.mjs` + API key |
| `make_contact_sheet.mjs` | 2 QA | PNGs → `preview/contact_sheet.jpg` | `@napi-rs/canvas` |
| `stage3_lock_headers.mjs` | 3 | `page_images_full/*.png` → `header_locked/*.png` | `@napi-rs/canvas` |
| `stage4_build_pptx.mjs` | 4 | `header_locked/*.png` → `.pptx` | `pptxgenjs` |
| `stage5_inject_notes.mjs` | 5 | `.pptx` + `slide-specifications.md` → `.pptx` (with notes) | `pptxgenjs` |
| `unified_pipeline.mjs` | 编排 | 串联 Stage 1→5 | 所有 |

Stage 2 在框架内实现（`image_api_client.mjs`），不依赖外部 skill。凭据规范名：`IMAGE2_API_KEY` + `IMAGE2_BASE_URL`；详见 `workflow/00-setup/03-tool-selection.md`。

## 辅助

| 文件 | 用途 |
|------|------|
| `visual_config.mjs` | Stage 1/3 共享颜色配置加载器 |
| `generate_style_master.mjs` | Phase 2: 生成 `style_master.jpg` |
| `env-check.mjs` | 零依赖环境检查 (Node/npm/API key/字体) |
| `fonts/` | Header-Lock 字体文件 |

## Agent 工具

| 文件 | 用途 |
|------|------|
| `agent-prompts.md` | 6 个可复用 Agent prompt 模板 |
| `change-classifier.md` | 用户自然语言变更 → 编辑链 A/B/C 决策树 |

## 常用命令

```bash
# 全量生产
node scripts/unified_pipeline.mjs --run-dir deck_{NAME}/3_versions/v1 --stage all

# 改标题：先解析 resolved render mode，再由 ppt_flow 选择 Chain A / B
node scripts/ppt_flow.mjs refresh deck_{NAME}/3_versions/v1 --kind title --only slide_07

# 只改备注 (Chain C)
node scripts/unified_pipeline.mjs --run-dir deck_{NAME}/3_versions/v1 --stage 5

# 单页生图 (Chain B)
node scripts/unified_pipeline.mjs --run-dir deck_{NAME}/3_versions/v1 --stage 2 --only slide_07
```

## 依赖

```
@napi-rs/canvas  — Stage 3 图片+字体渲染
pptxgenjs        — Stage 4/5 PPTX 生成
commander        — ppt_flow CLI
vitest           — 测试 (dev)
```
