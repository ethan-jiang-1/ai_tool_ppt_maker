# ai_tool_ppt_maker

AI 驱动的 PPT 生成系统. Agent 读方法论文档 → 做创意判断 → 跑生产管线 → 出 PPTX.

## 快速开始

```bash
# 1. 装依赖
npm install

# 2. 环境检查
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor

# 3. 配 Image2 凭据（key + base URL 都必填）
cat > .env <<'EOF'
IMAGE2_API_KEY=sk-...
IMAGE2_BASE_URL=https://your-relay/v1
EOF

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
| `tests_e2e/` | 端到端测试 |
| `openspec/` | Spec-driven 开发 |
| `_backlog/` | 待办/Bug/Plan |
| `deck_*/` | [产出] run bundle — 框架生产出的 PPT 项目 |
| `dpt_*/` | [输入] deep research 素材 不指定就不要读|

> `deck_*` 由 `ppt_flow.mjs init` 创建，做 PPT 时 Agent 在里面工作。它是框架的**产出物**，不是框架源码。

## 技术栈

Node.js 18+, ESM (.mjs), `@napi-rs/canvas` + `pptxgenjs` + `commander`
