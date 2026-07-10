## Context

PPTMAKER_FRAMEWORK 当前的生产管线 (Stage 1-5) 和基础设施脚本全部用 Python 实现, 依赖 Pillow + python-pptx + requests. 框架将被嵌入 coding agent 项目, 该环境以 Node.js 为运行时. 目标平台含 Windows, 不允许 bash.

## Goals / Non-Goals

**Goals:**
- 用 Node.js ESM (`.mjs`) 重写全部 Python 文件, 功能等价, 对外接口不变
- 三个核心外部依赖找到 Node.js 等价替代
- CLI 命令名和参数保持兼容——Agent 调用的命令面不变
- Windows/macOS/Linux 跨平台
- 现有测试覆盖的所有场景在新实现中继续覆盖

**Non-Goals:**
- 不改变管线架构 (5 Stage + 3 Editing Chain 不变)
- 不改变 run bundle 目录结构 (bundle_layout 的宪法地位不变)
- 不改变文件格式 (slide_plan.json, _prompts.json, color_palette.json 格式不变)
- 不改方法论文档 (Phase 01-05 的 Markdown 内容不变)
- 不重写 `image2-ppt` skill (Stage 2 的官方路径在外部 skill 中, 不在框架内)

## Decisions

### 1. Node.js ESM (`.mjs`)

**选择**: Node.js 原生 ESM, `.mjs` 扩展名. `node script.mjs` 直接运行, 零额外依赖.

**为什么不是 TypeScript**: 少一层编译/运行时依赖 (`tsx`, `typescript`). TypeScript 的类型系统对管线脚本有价值, 但 `.mjs` 的简单性更重要——用户只需要装 Node.js, `npm install` 就好了. Agent 跑 `node script.mjs`, 完全等同于 `python script.py` 的体验.

**`.mjs` vs `.js` + `"type": "module"`**: `.mjs` 扩展名强制 ESM 语义, 不受 package.json 的 `type` 字段影响. 与其他 `.js` 文件共存时不冲突.

**考虑过的替代**:
- TypeScript + `tsx` — 多两个依赖, 对用户无可见收益
- CommonJS (`.cjs`) — 2026 年了, ESM 是标准

### 2. 包管理与入口

**选择**: npm + `package.json` 放在 **repo 根目录** (与 `PPTMAKER_FRAMEWORK/` 平级). Agent 调用的入口是 `node PPTMAKER_FRAMEWORK/06_reference_scripts/ppt_flow.mjs <command>`. Node.js 最低版本 18 (LTS, `fetch` 内置). 用户只需: 装 Node.js → `npm install` → 配 `.env` → 跑.

**为什么 `node_modules` 不在框架内**: `PPTMAKER_FRAMEWORK` 是纯方法论 + 脚本, 拷给用户时不带 node_modules.

### 3. 依赖映射

| Python | Node.js | 理由 |
|--------|---------|------|
| Pillow (Image, ImageDraw, ImageFont) | `@napi-rs/canvas` | Rust/skia 实现, 预编译二进制覆盖 Windows/macOS/Linux. API 接近 Canvas API, 文字渲染 + 图片合成一体. |
| python-pptx | `pptxgenjs` | 纯 JS, 零原生依赖. 成熟度最高 (5k+ stars). API 清晰. |
| requests | `fetch` (Node 18+ 内置) | 零依赖. 异步原生. |
| argparse | `commander` | 纯 JS, 声明式 CLI 定义 |
| subprocess | `child_process` | Node 内置 |
| dataclasses | JSDoc `@typedef` | 文档即类型, 无编译 |

**`@napi-rs/canvas` 深度评估**:
- 对标 Pillow 的核心能力: loadImage, drawText (含自定义字体), 像素级定位, saveImage
- 补充能力: 阴影, 渐变, 图层, 都在 Canvas API 内
- 字体系统: `registerFont()` 加载自定义字体, 与 Pillow 的 `ImageFont.truetype()` 等价
- 跨平台: 预编译 skia 二进制, Windows 有 `@napi-rs/canvas-win32-x64-msvc`
- 备选: `node-canvas` (Cairo) — 更老但更重, 编译依赖多; `sharp` — 只能做图片像素操作, 不能画文字

### 4. 文件结构

```
PPTMAKER_FRAMEWORK/
├── package.json              # npm 依赖声明
├── 06_reference_scripts/
│   ├── ppt_flow.mjs          # CLI 入口 (← 原 ppt_flow.py)
│   ├── bundle_layout.mjs     # 目录结构宪法 (← 原 bundle_layout.py)
│   ├── unified_pipeline.mjs  # 管线编排器 (← 原 unified_pipeline.py)
│   ├── stage1_build_inputs.mjs
│   ├── stage3_lock_headers.mjs
│   ├── stage4_build_pptx.mjs
│   ├── stage5_inject_notes.mjs
│   ├── visual_config.mjs
│   └── generate_style_master.mjs
├── tests/                    # 测试 (根目录, 与 scripts 一一对应)
│   ├── test_bundle_layout.mjs
│   ├── test_stage1_build_inputs.mjs
│   ├── test_stage3_lock_headers.mjs
│   ├── test_stage4_build_pptx.mjs
│   ├── test_stage5_inject_notes.mjs
│   ├── test_unified_pipeline.mjs
│   ├── test_ppt_flow.mjs
│   ├── test_visual_config.mjs
│   ├── test_generate_style_master.mjs
│   ├── test_env_check.mjs
│   └── test_docs_consistency.mjs
├── 00_project_setup/
│   ├── 00-env-check.mjs      # 环境检查 (← 00-auto-env-check.py)
│   └── 02-nodejs-environment.md  # 环境文档 (← 02-python-environment.md)

# 删除:
# ✗ *.py (全部 19 个)
# ✗ stage2_generate_images.LEGACY.py (已废弃)
# ✗ run_tests.py (vitest 替代)
```

测试放在 repo 根目录 `tests/`, 与 `PPTMAKER_FRAMEWORK/` 平级——用户不需要看到测试。

```
tests/
├── test_bundle_layout.mjs
├── test_stage1_build_inputs.mjs
├── test_stage3_lock_headers.mjs
├── test_stage4_build_pptx.mjs
├── test_stage5_inject_notes.mjs
├── test_unified_pipeline.mjs
├── test_ppt_flow.mjs
├── test_visual_config.mjs
├── test_generate_style_master.mjs
├── test_env_check.mjs
└── test_docs_consistency.mjs

### 5. Stage 2 LEGACY

直接删除. 官方 Stage 2 路径是通过 `image2-ppt` skill, 不在框架代码内. LEGACY 文件只是 API 调用参考, 用 `fetch` 重写只需 10 行, 不值得保留为独立文件.

### 6. 测试

**选择**: `vitest`. 测试放在 repo 根目录 `tests/` (与 `PPTMAKER_FRAMEWORK/` 平级), 每个源脚本一个测试文件, 命名 `test_<script>.mjs`.

| 源脚本 | 测试文件 |
|--------|---------|
| `06_reference_scripts/bundle_layout.mjs` | `tests/test_bundle_layout.mjs` |
| `06_reference_scripts/stage1_build_inputs.mjs` | `tests/test_stage1_build_inputs.mjs` |
| `06_reference_scripts/stage3_lock_headers.mjs` | `tests/test_stage3_lock_headers.mjs` |
| `06_reference_scripts/stage4_build_pptx.mjs` | `tests/test_stage4_build_pptx.mjs` |
| `06_reference_scripts/stage5_inject_notes.mjs` | `tests/test_stage5_inject_notes.mjs` |
| `06_reference_scripts/unified_pipeline.mjs` | `tests/test_unified_pipeline.mjs` |
| `06_reference_scripts/ppt_flow.mjs` | `tests/test_ppt_flow.mjs` |
| `06_reference_scripts/visual_config.mjs` | `tests/test_visual_config.mjs` |
| `06_reference_scripts/generate_style_master.mjs` | `tests/test_generate_style_master.mjs` |
| `00_project_setup/00-env-check.mjs` | `tests/test_env_check.mjs` |
| — | `tests/test_docs_consistency.mjs` (static drift guard) |

## Risks / Trade-offs

**[R] `@napi-rs/canvas` 原生模块在 Windows 上的兼容性**
→ 预编译包 `@napi-rs/canvas-win32-x64-msvc` 覆盖主流 Windows. CI 加 Windows runner 验证. 备选: `skia-canvas`.

**[R] `pptxgenjs` 生成的 PPTX 与 python-pptx 生成的内部结构可能不同**
→ PPTX 是 ZIP 包 + XML, 两种库都生成标准 Office Open XML. 对外观的影响: 两者都是全屏图片幻灯片, 无编辑文本框, 差异极小. 用现有多页 deck 做 A/B 对比验证.

**[R] 字体查找路径跨平台差异**
→ 原 Python 代码的字体解析逻辑 (bundled fonts → env var → OS fonts) 需要在 Node.js 中复制. `@napi-rs/canvas` 的 `registerFont()` 接受绝对路径, 路径解析逻辑纯 JS——无原生依赖风险.

**[R] Agent 文档中的命令示例大面积过时**
→ 这是文字替换工作, 不是逻辑变更. 在 tasks 中单独列一条全量扫描任务.

## Open Questions

1. **`@napi-rs/canvas` 的预编译包是否覆盖 Windows ARM?** — 目前主流 Windows 是 x64. 如果未来需支持 Windows ARM (Surface Pro X 等), 需要确认 `@napi-rs/canvas-win32-arm64-msvc` 的存在. 当前不阻塞.
2. **`pptxgenjs` 对 16:9 full-bleed image slide 的支持是否完美?** — 需在首轮实现中验证. 备选: 直接用 `jszip` 操作 PPTX XML (更底层但更可控).
