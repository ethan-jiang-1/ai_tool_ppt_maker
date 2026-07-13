# 视觉迭代 + Image-API 调试 Retro

Date: 2026-07-11

> 场景：把 `deck_ai_sdlc_keynote` 的人物从"旧时代"改成现代——重生成 style master + 出 3 页 pilot 小样。过程中连环踩到 image-API 客户端/管道的 bug，并区分了"外部 relay 故障"与"我们的代码 bug"。（注：截至写此 retro，3 页小样仍在渲染中、尚未肉眼确认视觉效果——本文只记已证实的经验。）

## What Went Well

- **每个失败都当"契约探针"，逐层揭出下一个 bug**：submit 不认 `data:[{task_id}]` 数组（BUG-008）→ `/tasks/{id}/result` 端点不存在（结果其实内嵌在 poll 响应里）→ `--preview` 路径 `planFile is not defined`。一个修好就暴露下一个，而不是打一个孤立补丁。
- **用录下来的 trace 当"地面真相"**：`*.apimart-task.json` 里录着**成功跑通那次**的真实请求/响应（submit/poll/`final_task_response`、base_urls）。据此**恢复**了缺失的 base_url、看清了"完成响应里 `data.result.images[0].url` 就是图"——把猜测变成证据。
- **明确区分"外部故障"与"代码 bug"**：relay 的 502 不赖代码（style master 之前 80s 出图证明设置对）；代码的 `planFile`/`/result` 不赖 relay。用**带 auth 的真实生图探测**判活（200=通 / 502=挂），没有对着挂掉的 relay 空砸。
- **长渲染改后台 + 心跳**：前台等撞了 10 分钟工具墙、管道还吞了输出；改后台跑 + 定时 tail 早期信号（拿到 task_id、status=processing、无 502），既不失联也不空转。
- **自己修框架 bug 时最小 + 附加 + 真验证**：改 image_api_client 用"优先取 poll 内嵌图、`/result` 仅作 fallback"（不删旧行为）；改 unified_pipeline 的 `planFile → join(buildDir, GEN_SLIDE_PLAN)`。都靠**重跑真实生成**验证，不靠嘴说。

## Repeatable Practices

- 改 image-API 解析/端点前，**先读 `*.apimart-task.json` trace** 拿真实契约（submit/poll/result 形态、端点路径）。
- 排查"为什么 0 产出"按固定顺序：① 进程还活着吗 ② 日志尾部说什么 ③ 磁盘上落了几个产物 ④ 是 502（外部）还是栈报错（代码）。
- 判"外部 vs 代码"：**带 auth 的真实请求探测端点**——200/4xx=服务在，502/超时=服务挂。挂着就别重试，等自愈或换端点。
- 长渲染一律**后台 + 心跳**，绝不前台阻塞超过工具超时（会杀在半路、且 `| tail` 吞输出）。
- 框架 bug 修复：**最小、附加（旧行为留作 fallback）、重跑真实流程验证**。
- 约束若分散在两个文件（`deck_system.txt` ↔ `style-master-prompt.md`），**同改**，并记漂移风险。

## Why This Found More Issues

- **跑真实端到端流程**（不是 dry-run / mock）才逼出了这条 bug 链——无单测的解析代码把它们藏住了，每修一层就露出下一层。
- **拿 trace 当 fixture 对照**，把"数组 vs 对象""结果内嵌在 poll 里"这类响应形态不匹配**精确**定位，而不是反复试错。
- **auth 探测分离了"我们的 bug"与"他们的宕机"**，避免了对着一个 502 的 relay 白改代码 / 白等。

## Next-Time Standard（image-gen 类改动"做完"清单）

- [ ] 改动用**真实生成**验证（style master 或 1 页 pilot），不止 dry-run。
- [ ] 响应解析改动对照 **trace fixture** 核过。
- [ ] 声明 bug 前，**显式区分外部宕机 vs 代码**（relay 探测）。
- [ ] 长渲染**后台 + 心跳**，无静默前台卡死。
- [ ] 发现的 bug 已落 `_backlog/bugs/`（授权时可直接修 + 记录）；设计缺口 → `_backlog/plans/`。
- [ ] 分散在两文件的约束**同步修**（`deck_system.txt` ↔ `style-master-prompt.md`），无漂移。
- [ ] 未肉眼确认的产物**不过度宣称**（如"现代化生效"须等真图开出来看过才算）。
