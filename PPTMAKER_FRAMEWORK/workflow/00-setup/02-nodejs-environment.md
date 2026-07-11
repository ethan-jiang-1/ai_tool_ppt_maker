# Node.js 环境配置

> 替代 `02-python-environment.md`. PPTMAKER_FRAMEWORK 生产管线只需要 Node.js.

## 你需要什么

| 组件 | 用途 | 安装 |
|------|------|------|
| **Node.js 18+** | 运行时 | [nodejs.org](https://nodejs.org) (LTS), 或 `brew install node@20` (macOS), `winget install OpenJS.NodeJS.LTS` (Windows) |
| **npm** | 包管理 | 随 Node.js 自带 |

## 首次安装

```bash
# 在 repo 根目录 (package.json 所在位置)
npm install
```

这会装上三个依赖:
- `@napi-rs/canvas` — Stage 3 Header-Lock (图片+字体渲染)
- `pptxgenjs` — Stage 4/5 PPTX 生成
- `commander` — CLI 命令面

HTTP 请求用 Node 内置 `fetch` (Node 18+), 无需额外安装.

## 验证环境

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor
# 等价: node PPTMAKER_FRAMEWORK/scripts/env-check.mjs
```

输出 READY 表示可以开始. 如果显示 NOT READY, 按提示修复.

## API Key 配置

在 repo 根（或 deck 根）创建 `.env`：

```
IMAGE2_API_KEY=sk-你的key
IMAGE2_BASE_URL=https://你的-relay/v1
```

两者都必填（doctor ≡ 运行时）。别名 `OPENAI_*` / `APIMART_*` 仍认。完整规程见 `03-tool-selection.md`。

管线运行时自动 walk-up 加载 `.env`. 填一次即可, 不用每次跑都设置.
