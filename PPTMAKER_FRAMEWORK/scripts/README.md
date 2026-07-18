# Scripts — 生产脚本

> 所有可执行代码. Agent 运行时调这些. 脚本就地运行, 不复制进 run bundle.

> 修改任何 CLI 入口、返回通道、JSON 模式、delegation 或 exit path 前，先读 `openspec/specs/cli-surface/spec.md` 与 active `cli-surface` delta；统一使用 `scripts/lib/cli_error.mjs`，不要在脚本内复制诊断 schema。

## 入口

| 脚本 | 用途 | 调用 |
|------|------|------|
| `ppt_flow.mjs` | CLI 命令面 (13 个命令，含 `slides`) | `node scripts/ppt_flow.mjs <command>` |
| `bundle_layout.mjs` | 目录结构 SSOT | `node scripts/bundle_layout.mjs [--init\|--check\|--self-check]` |

## 生产管线

| 脚本 | Stage | 输入 → 输出 | 依赖 |
|------|-------|------------|------|
| `stage1_build_inputs.mjs` | 1 | legacy → `slide_plan.json` + prompts；HTML-first direct route validation-only | 标准库 + closed YAML contract |
| `stage2_generate_images.mjs` | 2 | `_prompts.json` + style master → PNGs | `image_api_client.mjs` + API key |
| `make_contact_sheet.mjs` | 2 QA | PNGs → `preview/contact_sheet.jpg` | `@napi-rs/canvas` |
| `stage3_lock_headers.mjs` | 3 | `page_images_full/*.png` → `header_locked/*.png` | `@napi-rs/canvas` |
| `stage4_build_pptx.mjs` | 4 | `header_locked/*.png` → `.pptx` | `pptxgenjs` |
| `stage5_inject_notes.mjs` | 5 | `.pptx` + `slide-specifications.md` → `.pptx` (with notes) | `pptxgenjs` |
| `unified_pipeline.mjs` | 编排 | 串联 Stage 1→5 | 所有 |

HTML-first v1 在当前 change 只允许 unified 的 literal Stage 1 原子写 `_generated/slide_plan.json`；Stage 1 dry-run 与两条其它 validation 路径零写，Stages 2–5 交付仍显式不可用。详见 `../reference/html-first-v1-authoring.md`。

结构版本由 `slide_id` 维持身份、`position` 投影当前顺序。跨版本只复用 provenance 完整的 expensive `raw-render`；目标版本拥有自己的 raw manifest，Stage 3 final、contact sheet、PPTX 与 notes 都本地重建。文件/manifest identity 按 ID + engine + artifact kind + fingerprint，不按页序或 glob 猜测；`legacy-located` 只能提示，不算复用证据。

Stage 2 在框架内实现（`image_api_client.mjs`），不依赖外部 skill。凭据规范名：`IMAGE2_API_KEY` + `IMAGE2_BASE_URL`；详见 `workflow/00-setup/03-tool-selection.md`。

## 辅助

| 文件 | 用途 |
|------|------|
| `visual_config.mjs` | Stage 1/3 共享颜色配置加载器 |
| `generate_style_master.mjs` | Phase 2: 生成 `style_master.jpg` |
| `env-check.mjs` | built-ins-first 环境检查（默认本地 runtime；Image2 显式选择） |
| `fonts/` | HTML runtime 内置 WOFF2/inventory/license；与 legacy canvas 字体 contract 分开 |
| `../reference/html-first-v1-authoring.md` | HTML-first v1 结构源的 validation-only 写法、v2 catalog 与当前不可用生产边界 |

## Agent 工具

| 文件 | 用途 |
|------|------|
| `agent-prompts.md` | 6 个可复用 Agent prompt 模板 |
| `change-classifier.md` | 用户自然语言变更 → 所有权/失效产物 → 刷新或结构路径决策树 |

## 常用命令

```bash
# 全量生产
node scripts/unified_pipeline.mjs --run-dir deck_{NAME}/3_versions/v1 --stage all

# 改标题：先解析 resolved render mode，再选择 Header Text & Style Refresh / Generated Image Rebuild
node scripts/ppt_flow.mjs refresh deck_{NAME}/3_versions/v1 --kind title --only UXGap

# 只改备注 (Notes-Only Refresh)
node scripts/unified_pipeline.mjs --run-dir deck_{NAME}/3_versions/v1 --stage 5

# 单页重建生成图 (Generated Image Rebuild；raw --only 必须显式 force)
node scripts/unified_pipeline.mjs --run-dir deck_{NAME}/3_versions/v1 --stage 2 --only UXGap --force-images

# 结构编辑默认 preview；确认后 Agent 重放同一操作并传 exact plan hash
node scripts/ppt_flow.mjs slides move deck_{NAME}/3_versions/v1 "UX gap" --after 3 --json
```

## 依赖

```
@napi-rs/canvas  — Stage 3 图片+字体渲染
pptxgenjs        — Stage 4/5 PPTX 生成
commander        — ppt_flow CLI
playwright@1.61.1 — 固定 Chromium runtime（浏览器另跑 setup:chromium 安装）
saxes@6.0.0 / fast-png@8.0.0 / jpeg-js@0.4.4 — HTML-first v2 passive SVG/raster 本地完整性校验
yaml@2.9.0       — HTML-first closed YAML 与 canonical edited-fence contract
vitest           — 测试 (dev)
```
