# Framework Agent Contract

进入 framework 后先读 `BOOTSTRAP.md`、`charter/AGENT_CONTRACT.md`、`charter/NODE-SPEC.md` 和指定 OpenSpec change。做具体 PPT 时，framework 方法只读；工作发生在用户指定的 `deck_*` run bundle。

## Ownership

- Human owns topic, claims, source truth, content/visual decisions and explicit remote cost.
- MD Controller owns intent routing, waits, gates, review presentation and typed final decisions.
- Node/CLI owns parsing, deterministic HTML rendering, measurements, receipts, manifests, state healing and bounded diagnostics.
- `_generated/` and `_scratch/` are rebuildable/transactional; never hand-edit, copy, or use them as source.

## Pipeline boundary

Probe `production.pipeline` before readiness or writes:

```text
html-first-v1  -> structured source -> HTML pages -> measured final slides -> PPTX -> notes
whole-page-image2-v1 -> structured source -> whole-page Image2 -> header lock -> PPTX -> notes
```

HTML paths never load provider credentials, style master, Image2 adapter, or whole-page render mode. Whole-page paths never satisfy HTML gate/delivery evidence. New HTML work never creates Image2 refinement directories.

## Lifecycle and gates

`0 setup -> 1 content -> 2 visual system -> 3 HTML delivery -> [4 optional/authorized] -> 5 iteration`。

Phase 2 visual approval is based on real local representative pages/contact sheets. Phase 3 publishes current contact sheet, assembly-v2, notes-v3 and final delivery review. A complete accepted HTML deck has no Phase-4 debt.

HTML authoritative evidence is version-scoped under reserved state nodes `html-content-review`, `html-visual-review`, `html-delivery-review`, `html-production-reset`; optional Phase-4 execution is version-scoped under reserved `image2-refinement`. Metadata `html_*` fields are mirrors only. Plain status is read-only. Gate journals and reset fences recover only through their owning interfaces.

## Source and identity

- `slide_id` is stable identity; `position` is current order only.
- New IDs use mnemonic-v1: 5-8 ASCII letters, exactly two BlockCase semantic chunks, preferably 5-6.
- Structured source carries `SLIDE BODY` and closed family/typed fields. Do not hide exact visible text in `IMAGE PROMPT`; do not author HTML/CSS/coordinates.
- Structural changes use preview + exact `plan_sha256`, then source-only clean vNext. Target-local materialization is explicit and zero-remote.

## Refresh paths

HTML: Local Slide Rebuild, Local Deck Rebuild, Notes-Only Refresh, Structural Versioning Path.
Image2-only: Header Text & Style Refresh, Generated Image Rebuild, Notes-Only Refresh, Structural Versioning Path.
`needs_render` is a whole-page cost report, never permission; HTML uses `needs_local_materialization`.

## Failure and Git rules

Consume the last valid CLI failure envelope and follow `diagnostic.next`; `requires_human: true` stops for a decision. Never guess omitted path/id/hash/token, manually repair `_state`, delete a lock/journal, or edit `_generated/`.

Git 对做 PPT **可选但推荐** only as a user-owned source/control audit. This invocation's directory is not confirmed as a worktree unless the user explicitly authorizes inspection; there may be no verifiable Git history checkpoint. Do not run `git init` inside a project root or framework, and do not treat Git as recovery authority.

## Framework maintenance verification

For framework changes, run `npm test` first. This is the bounded, dependency-free core checkpoint and it reports one final JSON result; it is not release coverage. `invalid_inventory` means repair the inventory or dependency boundary, `unavailable` means restore local Vitest, `failed` means repair the named core assertion, and `timed_out` means reduce or demote the selected core work. Each is a hard stop for claiming core evidence: do not retry, widen workers, or substitute another tier.

Then select the minimum affected opt-in evidence: `npm run test:focused -- <tests/.../test_*.mjs>` for one non-visual seam, `npm run test:render -- <tests/.../test_*.mjs>` for one visual-engine seam, and at most one `npm run test:e2e -- <tests_e2e/.../test_mock_*.mjs>` mocked journey. `npm run test:sweep` is explicit unit/integration sampling. Browser, HTML compositor, Canvas/PPTX/ECharts, provider, load-closure, journey, and sweep work are diagnostics or release sampling, never default completion evidence; no broad E2E command is available.
