# ai_tool_ppt_maker

AI 驱动的 PPT 生成系统. Agent 读方法论文档 → 做创意判断 → 跑生产管线 → 出 PPTX.

## 快速开始

```bash
# 1. 装依赖
npm install

# 2. 环境检查
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor

# 3. 配 API key
echo "OPENAI_API_KEY=sk-..." > .env

# 4. 跟 Agent 说: "我要做一个 PPT"
```

## 回归测试

```bash
npm test
```

## 项目结构

| 目录 | 用途 |
|------|------|
| `PPTMAKER_FRAMEWORK/` | 方法论知识库 + 生产脚本 |
| `tests/` | 测试文件 |
| `openspec/` | Spec-driven 开发 |
| `_backlog/` | 待办/Bug/Plan |

## 技术栈

Node.js 18+, ESM (.mjs), `@napi-rs/canvas` + `pptxgenjs` + `commander`
