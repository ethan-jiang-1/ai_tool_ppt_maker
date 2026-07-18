# Legacy Image2 Remote Submit Inventory

This inventory records the Change-1 production boundaries. All listed public paths converge on `image_api_client.mjs` and its `assertImageSubmitPrerequisites` guard immediately before `generateOneImage` enters the provider adapter.

| Public path | Orchestration chain | Remote-work decision | Transport authority | Style-reference authority |
|---|---|---|---|---|
| `ppt_flow style-master` | `commandStyleMaster` -> `generateStyleMaster` -> `generateOneImage` | Existing output is retained unless `--force`; dry-run exits before adapter | `resolveVendors` reads `IMAGE2_API_KEY` and CLI `--base-url` or `IMAGE2_BASE_URL` | None; creating a style master cannot require a prior style master |
| `ppt_flow pilot` | `commandPilot` -> unified Stage 2 -> `generateImages` -> `generateOneImage` | Per-slide provenance selects current reuse versus missing/forced render | Same canonical `resolveVendors` authority | `styleAsset(runDir, STYLE_MASTER_IMAGE)` after preview bundle readiness |
| `ppt_flow build` | `commandBuild` -> unified Stage 2 -> `generateImages` -> `generateOneImage` | Per-slide provenance after current header-review gate | Same canonical `resolveVendors` authority | `styleAsset(runDir, STYLE_MASTER_IMAGE)` |
| `ppt_flow refresh --kind visual` | `commandRefresh` -> unified Stage 2 -> `generateImages` -> `generateOneImage` | Selected slides are forced; local title/notes refreshes never enter Stage 2 | Same canonical `resolveVendors` authority | `styleAsset(runDir, STYLE_MASTER_IMAGE)` |
| Direct unified Stage 2 | `stage2` -> `generateImages` -> `generateOneImage` | Per-slide provenance; all-current selection remains local | Same canonical `resolveVendors` authority | `styleAsset(runDir, STYLE_MASTER_IMAGE)` |

Local Stage 1/3/4/5 subsets, notes-only refresh, dry-run, contact-sheet/PPTX assembly from current reviewed images, and `materializeStructuralVersion` do not call the transport resolver or provider adapter. The style-master no-op and all-current Stage 2 reuse paths also do not resolve transport.

Missing transport or page style reference is represented as an `ImageSubmitPrerequisiteError`. Stage 2 and style-master map it into the existing secret-safe CLI diagnostic categories without including API keys, endpoint payloads, prompts, or provider response bodies.
