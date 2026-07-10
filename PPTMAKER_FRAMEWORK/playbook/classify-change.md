---
node: classify-change
shared: true
produces: [change-classification]
entry:
  - user_request_received
exit:
  - change_type_identified
  - playbook_selected
---

# classify-change: 变更分类

## Step 1 — MD
分析用户的变更请求. 参考 `scripts/change-classifier.md` 决策树.

判断:
1. 改了什么? (text / visual / notes / structure)
2. 影响多少页? (1 / few / all)
3. 要 pilot 吗?

## Step 2 — MD
确认分类结果, 告知用户: "这是 Chain X, 预计 ~N 分钟". 
选择对应 playbook 继续执行.
