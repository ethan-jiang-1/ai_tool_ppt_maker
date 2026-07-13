# Vendor 可靠性（出图通道选择）

**遇到什么:** 反复重画 slide 时，默认 vendor（api.apib.ai）频繁 mirror download 失败（status=completed 但 fetch 失败）。aiuxu 也有类似问题。aishuch 最稳。

**怎么试的:** 
- api.apib.ai：多张 slide 在 status=completed 后 mirror fetch failed（s05/s08/s09/s14/s15/s18/s21/s24 均有记录）
- api.aiuxu.com：部分 slide 同样 mirror fetch failed，且 pilot 时偶发 internal error
- api.aishuch.com：s07/s14/s15/s20 直接指定时全部成功，无 mirror 失败

**结论:** 这个 deck 用 api.aishuch.com 最稳。出图时加 `--base-url https://api.aishuch.com/v1` 指定 vendor，不走默认 fallback 链。

**下次先看哪:** 重画图时直接用 aishuch，别再浪费一次尝试在默认链上。命令：
```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot <runDir> \
  --only <ids> --resolution 2k --base-url https://api.aishuch.com/v1
```

**不是密钥:** API key 已经在 `.env` 的 `IMAGE2_API_KEY` 里配好了，不需额外操作。
