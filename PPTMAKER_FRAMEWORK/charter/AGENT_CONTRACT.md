# Agent Contract

## Authority

Page Authority is the only current production protocol. Its source marker is
`page-authority-image2-v1`; its state mode is `image2-page-authority`; its
adapter is `page-authority-image2`.

Each slide has one authority:

| Authority | Owner | Refresh consequence |
| --- | --- | --- |
| `pure-image2` | Image2 raw output | Raw contract changes require explicit raw authorization and review. |
| `framed-image2` | Image2 underlay plus local Text Frame | Text Frame-only changes recompose locally from accepted raw evidence. |

## Invalidation

Use the smallest owner-valid path:

- Header Text & Style Refresh for Framed text/frame changes.
- Generated Image Rebuild for Pure display text or raw visual-contract changes.
- Notes-Only Refresh for speaker notes.
- Structural Versioning Path for additions, removals, reordering, or authority changes.

Structural work is preview-first. The exact plan hash binds apply; target
materialization makes no remote call. A missing raw item is reported as
`needs_render`, never silently generated.

## Evidence

Current production is a receipt chain: source receipt, raw plan/authorization,
raw manifest and review, final manifest and projection, PPTX assembly, notes,
and delivery review. A later receipt cannot repair a missing earlier receipt.
Generated files are rebuildable output and never replace the receipt chain.

## Historical boundary

Existing historical source/state pairs are read only through the legacy
observer. A recognized pair can be adopted into a clean current target without
provider calls or copied output evidence. Corrupt or ambiguous pairs stop at
repair/export guidance. The observer never creates a production adapter.

## RUN_BUNDLE locator entry

When no exact local run directory is known, a user may provide `RUN_BUNDLE.md`
bytes. Resolve them through
`scripts/shared/run-bundle/run_bundle_locator.mjs`; it accepts only the card,
an optional original-card path, or a human-supplied deck/framework root. It
does not infer a deck from the current directory, names, or timestamps.

After resolution, use the state owner only to obtain the active run version or
`resolveContinuationTargetVersion`; 不得用第二个 YAML parser. Validate
the exact result with `bundle_layout --check <run-dir> --structure-only`, then
use `ppt_flow state <run-dir> --json` and `status` for the current action.
When the resolver reports a conflict, request the current card or repair the
named root; 不得拿另一条路径覆盖. A terminal deck may be inspected read-only.
generic remote-chat attachment integration is not a framework capability.

## Git boundary

Visible `vN` versions remain the deck's working authority. Git is optional and
user-owned; `_generated/` 始终是可重建派生品. 一个连续 source-work episode 内最多
给出一次非阻塞 checkpoint 建议。
A suggestion does not authorize inspection. Without explicit authorization for
a named operation and exact scope（命名操作和精确范围）, do not inspect or
change Git state. 普通 checkpoint 授权不包含任何 inspection.

## Agent behavior

- Humans own content and approval; the Agent owns bounded process execution.
- Do not hand-edit `_generated/`, state, receipts, or journals.
- Keep stable mnemonic `slide_id` values; position is snapshot-local.
- Do not request provider credentials for local Framed composition.
- Do not infer a current route from historical source, state, or output bytes.
