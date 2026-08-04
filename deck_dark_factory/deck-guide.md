# deck_dark_factory - PPT operating guide

Use [RUN_BUNDLE.md](RUN_BUNDLE.md) to locate this bundle in a new local Agent session. This
guide defines source ownership and operating rules after the bundle is located; current run,
production mode, node, gates, and recovery actions always come from state/status.

## Source ownership

| What changes | Owner |
|---|---|
| Slide text, structure, layout family, and notes | `3_versions/vN/slide-specifications.md` |
| Narrative, formula, and design constraints | `2_backbone/` |
| Visual system and local assets | `2_backbone/visual-style/` |
| Research material | `1_upstream_raw_material/` |

Never hand-edit `3_versions/vN/_generated/`; edit its source and rerun the
owning path. Put version-local temporary work only in `3_versions/vN/_scratch/`.

## Operating rules

- Start every resumed session with the exact run selected by state, then inspect state/status.
- Classify edits as Header Text & Style Refresh, Generated Image Rebuild, Notes-Only Refresh, or
  Structural Versioning Path. Structural edits require preview plus the exact plan hash before
  publication; materialization never grants remote-render authorization.
- Keep `slide_id` as stable cross-version identity. A position is only the current snapshot.
- Capture reusable non-secret lessons in `_lessons/`; execution progress belongs in
  `_state/state.yaml` and is never hand-edited.

## CLI diagnostic contract

For a non-zero CLI result, consume only the final valid JSON failure envelope on stderr. Use the
producer-issued `diagnostic.category` and supported `diagnostic.next`, never prose, to choose the
owner action; keep its `program` and `args` as separate arguments. Stop when
`requires_human: true`; do not guess omitted lineage, repair state/journals/locks by hand, or treat
a chat request as approval.

For a user-facing diagnostic, explain exactly these four parts in order:

1. **What happened**: the bounded owner result only.
2. **What it affects**: the named source, subject, lineage, or current run scope only.
3. **What the Agent can mechanically do**: the exact producer-issued action only.
4. **The one human action or confirmation required**: stop for that action, or say:
   "No human action is required now."

Never use raw stderr as a recovery policy or invent a retry, authorization, or state edit. This
guide does not locate a run or select pre-install recovery; it applies only after this bundle is
already located.

Git is optional and user-owned. Visible `vN` remains the work-version authority, and
`_generated/` is never a recovery target. Do not perform a Git mutation without the
user's explicit authorization for its named operation and exact scope.
