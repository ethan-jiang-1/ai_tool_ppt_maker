## Purpose

Define how the five production stages are orchestrated: the whole pipeline runs on the Node.js 18+ runtime as directly-runnable ESM (`.mjs`, no build step), and the `unified_pipeline.mjs` entry point supports the Stage subsets used by Header Text & Style Refresh, Generated Image Rebuild, and Notes-Only Refresh; loads credentials from `.env`; and offers `--dry-run`, `--force-images`, and `--only <id>` while running Stage 2 via in-framework `stage2_generate_images.mjs` (no external skills). This capability guarantees that full builds and targeted edits share one orchestrator, so an iteration refreshes only the artifacts it actually invalidated.
## Requirements
### Requirement: Pipeline runs on Node.js runtime

整个生产管线 SHALL 在 Node.js 18+ 运行时上执行. 所有脚本 SHALL 以 ESM (`.mjs`) 编写, `node script.mjs` 直接运行, 无需编译.

#### Scenario: Agent runs pipeline on Windows

- **WHEN** Agent runs `node scripts/ppt_flow.mjs build <run_dir>` on Windows 11 with Node.js 20
- **THEN** all 5 stages complete successfully, producing a .pptx file

### Requirement: Unified pipeline supports semantic refresh paths

The unified pipeline entry point (`unified_pipeline.mjs`) SHALL continue to support the Stage subsets used by three English canonical refresh paths: Header Text & Style Refresh resolves source in Stage 1 and completes Stages 3,4,5 without Stage 2 when only KICKER/TITLE/SUBTITLE text or Stage-3-owned overlay styling is stale and the raw-image contract is unchanged; Generated Image Rebuild covers Stages 1,2,3,4,5 as a logical workflow with actual selected image regeneration and required review; Notes-Only Refresh uses Stage 5 only. The former Chain A/B/C labels are compatibility aliases, not CLI values or machine identifiers.

Generated Image Rebuild SHALL preserve the existing force semantics: raw `unified_pipeline --only <ids>` limits Stage 2 scope but does not imply force, so intentional rebuilding of existing selected images SHALL include `--force-images`. A public `ppt_flow refresh --kind visual` request MAY add force for its explicitly selected/all scope. For reviewed full-page title changes, Stage 2 MAY occur in a pilot command and final Stages 3,4,5 MAY reuse the reviewed image; the path SHALL NOT require one literal all-stage invocation.

#### Scenario: Header Text & Style Refresh skips image regeneration

- **WHEN** a resolved `body+header-lock` header change follows Header Text & Style Refresh
- **THEN** Stage 1 refreshes the plan and Stages 3,4,5 complete without Stage 2
- **AND** pipeline completes in under 5 minutes for a standard deck

#### Scenario: Safe-zone change is not a header-only refresh

- **WHEN** a header safe-zone or render-mode change alters the raw-image prompt contract
- **THEN** the affected slide uses Generated Image Rebuild rather than Header Text & Style Refresh

#### Scenario: Raw selected image rebuild requires force

- **WHEN** an existing selected image must be intentionally regenerated through raw `unified_pipeline`
- **THEN** the invocation includes both `--only <ids>` and `--force-images`
- **AND** `--only` by itself remains a scope selector rather than a regeneration request

#### Scenario: Reviewed full-page title rebuild is multi-command

- **WHEN** a full-page title change requires new reviewed image evidence
- **THEN** selected Stage 2 regeneration MAY run through pilot with `--force-images`
- **AND** final assembly reuses the reviewed image without a second image generation

#### Scenario: Canonical names are not CLI values

- **WHEN** maintainers update help or guidance for refresh paths
- **THEN** they do not add `--chain`, canonical-name arguments, or a new machine-readable path enum

### Requirement: Unified pipeline orchestrates stages

`unified_pipeline.mjs` SHALL delegate to individual stage scripts, load credentials from `.env`, and support `--dry-run`, `--force-images`, `--only <id>`, and Stage 2 via in-framework `stage2_generate_images.mjs` + `make_contact_sheet.mjs`.

#### Scenario: Dry run reports stages without executing them

- **WHEN** `node unified_pipeline.mjs --stage all --dry-run` is run
- **THEN** the orchestrator reports the stage scripts it would invoke and the credentials it would load from `.env`
- **AND** no stage is actually executed

### Requirement: Shared slide-id resolution for --only

`unified_pipeline.mjs` SHALL resolve every `--only` token through the shared selector contract owned by `slide-identity-and-ordering`, also used by `ppt_flow`: exact current formal ID, spoken key, explicit 1-based position, unique case-insensitive title fragment, then supported legacy-prefix fallback. It SHALL resolve all tokens against one current `slide_plan.json` snapshot and preserve per-token bindings with `matched_by`; after that, this caller MAY deduplicate repeated formal IDs for stage execution. Ambiguous or unknown tokens SHALL fail and list bounded available `position + slide_id + title` tuples; approximate matches SHALL NOT be selected automatically.

#### Scenario: Spoken mnemonic resolves

- **WHEN** `--only "UX gap"` is passed and the plan contains formal ID `UXGap`
- **THEN** Stage 2 processes `UXGap` only

#### Scenario: Prefix s03 resolves

- **WHEN** `--only s03` is passed, no higher-precedence selector matches, and exactly one legacy plan ID starts with `s03`
- **THEN** Stage 2 processes that formal legacy ID only

#### Scenario: Page number resolves

- **WHEN** `--only 3` is passed and the plan has at least three slides
- **THEN** Stage 2 targets the third slide's formal ID

#### Scenario: Ambiguous selector fails closed

- **WHEN** a title fragment or supported legacy prefix matches more than one plan entry
- **THEN** resolution fails with the matching position, formal ID, and title tuples
- **AND** no pipeline stage runs for an inferred selection

### Requirement: --preview uses preview readiness for Stage 2

When Stage 2 is included, `unified_pipeline.mjs` SHALL validate with **pipeline** readiness by default, and with **preview** readiness when `--preview` is set (style master required; metadata gates not required). `--preview` SHALL NOT mutate gate fields.

#### Scenario: Stage 2 with --preview while gates pending

- **WHEN** metadata gates are `pending`
- **AND** style master exists
- **AND** `unified_pipeline … --stage 2 --preview` runs
- **THEN** validation passes the gate check
- **AND** Stage 2 may proceed

#### Scenario: Stage 2 without --preview still needs gates

- **WHEN** metadata gates are `pending`
- **AND** `unified_pipeline … --stage 2` runs without `--preview`
- **THEN** validation fails with a gate-related error

### Requirement: Stage 2 regenerates only when --force-images is set

Stage 2 SHALL skip existing image files unless `--force-images` is set. Presence of `--only` SHALL NOT by itself force regeneration.

#### Scenario: --only without force skips existing files

- **WHEN** `--only <id>` is set, the image file exists, and `--force-images` is absent
- **THEN** Stage 2 skips that file and does not call the image API for it

#### Scenario: --force-images regenerates selection

- **WHEN** `--force-images` is set with or without `--only`
- **THEN** selected existing images are regenerated

### Requirement: Automatic pilot selection covers content full-page header risk

`ppt_flow pilot` automatic selection SHALL classify a full-page slide as hero or content using the same shared VISUAL TYPE canonicalization helper as Stage 1, not merely its `render_mode`. When at least one content full-page slide exists and `count >= 1`, the selected ids SHALL include at least one. When at least two content full-page slides exist and `count >= 2`, the selected ids SHALL include at least two so cross-page header consistency can be reviewed. Remaining capacity SHALL cover opener/closer and other render modes using deterministic, deduplicated selection. Explicit `--only` SHALL remain authoritative and SHALL NOT have slides silently added by the CLI.

#### Scenario: Default pilot samples two content full-page pages
- **WHEN** a deck has at least two content full-page slides and automatic pilot runs with the default count of three
- **THEN** two selected ids are content full-page slides
- **AND** the remaining id is selected deterministically from the other representative classes

#### Scenario: Count one prioritizes the changed risk
- **WHEN** a deck has a content full-page slide and automatic pilot runs with `--count 1`
- **THEN** that one selected slide is content full-page

#### Scenario: Explicit only remains exact
- **WHEN** the caller supplies valid `--only` ids
- **THEN** the CLI uses exactly those ids and does not append content full-page slides

### Requirement: Header review gate guides per-slide

Gate SHALL 以 per-slide 粒度检查 full-page 标题。输出 SHALL 为 MD Controller 可消费的结构体。纯 full-page deck SHALL 自动放行。`--only` SHALL 限缩检查范围。

#### Scenario: Single slide title change — MD gets actionable command

- **WHEN** s05 的 title 从 "传统开发" 改为 "软件优先"，其余 24 页不变
- **THEN** `changed: [{id: "s05", field: "title", was: "传统开发", now: "软件优先"}]`
- **AND** `action: "node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot \"{runDir}\" --only s05"`
- **AND** 不阻塞其余 24 页

#### Scenario: Pure full-page deck skips

- **WHEN** deck 无 body+header-lock slide
- **THEN** `applicable: false`

#### Scenario: --only limits scope

- **WHEN** `--only s05,s07` 传入
- **THEN** 仅检查 s05 和 s07

#### Scenario: No changes — silent pass

- **WHEN** 所有 full-page slide 与上次 review 一致
- **THEN** `ok: true`

#### Scenario: More than 5 slides changed — full pilot

- **WHEN** 6 页标题发生变化
- **THEN** `action` 不含 `--only`，指向全量 pilot

#### Scenario: End-to-end — title change to resolution

- **WHEN** 用户改 s05/s07 标题后 build
- **THEN** gate → `ok: false` + `action: pilot --only s05,s07`
- **AND** MD 执行 pilot → approve → gate 重检（第二次 build）→ `ok: true` → 继续

#### Scenario: Stage 4 image bytes mismatch on single slide

- **WHEN** Stage 4 `requireCurrentImages` 检查发现 s05 的 PNG 文件 SHA-256 与 manifest 不匹配
- **THEN** `changed: [{id: "s05", field: "image", was: null, now: null}]`
- **AND** `action` 引导 `--force-images --only s05` + pilot

#### Scenario: Missing header_snapshot in state

- **WHEN** slide 有 `status` 但缺 `header_snapshot`
- **THEN** `changed` 中 `was: null`，建议 pilot 确认

#### Scenario: Visual type change detected

- **WHEN** s05 的 visual_type 从 "Content Page" 改为 "Title / Opener"，标题文字未变
- **THEN** fingerprint 不匹配 → `changed: [{id: "s05", field: "visual_type", was: "Content Page", now: "Title / Opener"}]`

#### Scenario: Generation profile mismatch

- **WHEN** 当前 build 请求 2k resolution 但上次 review 用 1k
- **THEN** gate 返回所有 content full-page slide 为 `changed`
- **AND** `hint` 说明 profile 不匹配，需重新 pilot

### Requirement: Gate output is MD-controller-friendly

返回结构 SHALL 始终包含全部 6 个字段。`ok: true` 时 `changed: []`, `action: null`, `hint: null`。`ok: false` 时 `changed` 非空、`action` 为可执行命令、`hint` 为人话解释。MD 遇无 `format` 字段 → 旧代码 → 放行。

#### Scenario: Gate passes — null action

- **WHEN** 没有 slide 需要 review
- **THEN** `{format: 2, applicable: true, ok: true, changed: [], action: null, hint: null}`

#### Scenario: Gate fails — MD gets command

- **WHEN** s05 title 变了
- **THEN** `{ok: false, changed: [{s05,...}], action: "node ... pilot \"{runDir}\" --only s05", hint: "..."}`

#### Scenario: Non-existent slide in --only

- **WHEN** `--only s99` 且 s99 不在 plan 中
- **THEN** `ok: true`, `hint: "s99 not found in slide plan"`

### Requirement: buildHeaderReviewInputs produces per-slide fingerprints

`buildHeaderReviewInputs()` SHALL 为每页 full-page slide 独立计算 fingerprint + `hasBodyHeaderLockSlides: boolean`。

#### Scenario: Per-slide fingerprint varies independently

- **WHEN** s05 的 title 改变但 s06 不变
- **THEN** `slideFingerprints["s05"]` 改变，`slideFingerprints["s06"]` 不变

#### Scenario: hasBodyHeaderLockSlides reflects deck composition

- **WHEN** deck 有 `body+header-lock` slide → `hasBodyHeaderLockSlides: true`
- **WHEN** deck 全部 `full-page` → `hasBodyHeaderLockSlides: false`

### Requirement: mergeHeaderReviewRecord stores per-slide state

`mergeHeaderReviewRecord()` SHALL 写入 `header_snapshot` + `fingerprint` + `status`。SHALL 自动清理 plan 中不存在的 slide 条目。首次 body+header-lock 引入时所有无 record 的 full-page slide → `status: "changed"`。

#### Scenario: Reviewed slide gets snapshot stored

- **WHEN** 用户 approve s05 的 pilot
- **THEN** `slides.s05.header_snapshot` 保存当前 kicker/title/subtitle
- **AND** `slides.s05.status` 变为 `reviewed`

#### Scenario: Deleted slide is cleaned up

- **WHEN** slide plan 中不再包含 s05
- **AND** `mergeHeaderReviewRecord` 被调用
- **THEN** state 中 `slides.s05` 条目被移除

### Requirement: changedFullPageIds supports per-slide state

`changedFullPageIds()` SHALL 接受可选 `slideStates` 参数。有 per-slide state → 读 `status === "changed"`；无 state（首次 pilot）→ fallback 到全局 snapshot diff。

#### Scenario: Per-slide state used when available

- **WHEN** `slideStates` 含 `{c1: {status: "changed"}}`
- **THEN** 返回 `["c1"]`

#### Scenario: Fallback to snapshot diff when no state

- **WHEN** `slideStates` 为 null
- **THEN** 使用全局 `previousSnapshot` vs `currentSnapshot` diff

### Requirement: Structural refresh impact is computed by stable identity

After a structural edit creates a target version, orchestration SHALL compare source and target slide plans by formal `slide_id` and classify each ID as retained, inserted, deleted, reordered, or content/profile changed. Position changes alone SHALL invalidate only cheap local outputs such as slide plan projections, prompt twins, Stage 3 final/header-lock output, contact sheets, PPTX assembly, and notes injection. They SHALL NOT invalidate an expensive raw-render fingerprint.

The impact report SHALL expose current position, stable ID, title, retained/materialized raw artifacts, missing or stale artifacts, `verified` versus `legacy-located` status, required local stages, `needs_render`, and any human review requirement. Deleted IDs SHALL not be assembled into the target while the source version and its artifacts remain unchanged.

#### Scenario: Reorder-only impact is cheap

- **WHEN** source and target contain the same formal IDs and semantic inputs but in a different order
- **THEN** orchestration classifies all pages as retained/reordered
- **AND** schedules order-dependent outputs without marking raw renders stale

#### Scenario: Insert isolates expensive work

- **WHEN** the target adds one new formal ID and leaves every retained slide's semantic inputs unchanged
- **THEN** orchestration marks only the new ID as missing a raw render
- **AND** retained IDs remain eligible for verified materialization

### Requirement: Structural versions materialize only verified expensive raw renders

Orchestration SHALL materialize an artifact from the source version into the target only through the shared render-artifact resolver and the owning Stage's manifest rules. Cross-version materialization in this change SHALL be limited to expensive `raw-render` artifacts. A retained raw render SHALL require matching stable ID, engine, artifact kind, generation fingerprint/profile, and verified source-byte SHA. A `legacy-located` file without complete proof SHALL NOT qualify. Successful materialization SHALL atomically copy bytes into the target and write target-owned manifest entries with source-version lineage. Stage 3 final/header-lock output, contact sheet/QA, PPTX, and notes SHALL be rebuilt locally in the target rather than copied across versions. Any failed or missing raw check SHALL report the ID under `needs_render` without guessing from filenames or reading the source version as a runtime fallback.

Header-review evidence MAY be re-established in the target's version-scoped state only when it is a verified per-slide approval and stable ID, generation profile, and reviewed raw-image SHA all match verified current inputs. The target record SHALL identify source-version lineage and SHALL satisfy the existing current-version review contract only after publication in the target. Waivers, `legacy-located` evidence, and unverified source-version evidence SHALL remain unusable.

#### Scenario: Verified retained raw render becomes target-owned

- **WHEN** a retained slide passes every raw-render kind, engine, fingerprint/profile, and byte-hash check
- **THEN** orchestration materializes its raw bytes and current manifest entry into the target version
- **AND** Stage 3 and all later cheap stages rebuild from that target-owned raw entry

#### Scenario: One retained slide has stale provenance

- **WHEN** one source raw artifact's bytes do not match its recorded SHA while all other retained IDs verify
- **THEN** only that ID is excluded from materialization and appears under `needs_render`
- **AND** verified unrelated IDs remain reusable

#### Scenario: Legacy-located file does not prove reuse

- **WHEN** a compatibility adapter locates a retained PNG but cannot prove its current raw-render fingerprint and bytes
- **THEN** orchestration does not materialize it as current
- **AND** reports the retained ID under `needs_render` without making a remote call

#### Scenario: Cheap final artifact is rebuilt locally

- **WHEN** a retained raw render is materialized into a reordered target
- **THEN** target Stage 3 reruns and publishes a target-owned final manifest
- **AND** no prior-version Stage 3 final file is copied as the current target output

#### Scenario: Header evidence is re-established, not borrowed

- **WHEN** source-version review evidence and all bound fingerprints and image bytes verify for a retained target slide
- **THEN** orchestration may publish equivalent target-version evidence with source lineage
- **AND** the target does not directly treat the source-version record as current

#### Scenario: Waiver is not carried forward

- **WHEN** the source version proceeded through a waiver rather than a verified per-slide approval
- **THEN** orchestration does not establish target review evidence from that waiver
- **AND** the target remains subject to its normal review contract

### Requirement: Structural materialization never silently invokes remote rendering

Structural apply, structural impact analysis, and cross-version materialization SHALL never invoke Image2 or any future remote renderer. They SHALL materialize verified raw renders, rebuild cheap local stages where prerequisites exist, and return every missing/stale selected-engine raw artifact as `needs_render`. The Agent SHALL invoke Generated Image Rebuild only through an explicit subsequent refresh after the relevant cost/scope is authorized. A structural or materialization code path with any remote renderer call SHALL fail integration tests.

For reorder/delete-only work whose retained raw renders all verify, the explicit local production path SHALL complete Stage 1, raw materialization, Stage 3, order-dependent QA/contact-sheet work, Stage 4, and Stage 5 with zero remote calls. If any retained raw render cannot be proven, the source vNext remains valid but production stops with `needs_render` rather than quietly spending quota.

#### Scenario: Reorder-only makes zero renderer calls

- **WHEN** all retained artifacts verify after a reorder-only edit
- **THEN** Stage 3, target PPTX, and notes are rebuilt locally in current order
- **AND** no Image2 or future HTML remote render request is made

#### Scenario: Delete-only makes zero renderer calls

- **WHEN** a page is deleted and every remaining ID has verified artifacts
- **THEN** the deleted ID is omitted from target assembly
- **AND** no retained slide is remotely rerendered

#### Scenario: Insert reports missing render before any renderer call

- **WHEN** exactly one inserted ID lacks its selected-engine artifact and all retained IDs verify
- **THEN** structural apply/materialization reports exactly that ID under `needs_render`
- **AND** makes zero remote calls until an explicit Generated Image Rebuild is invoked

#### Scenario: Explicit rebuild scopes the remote call

- **WHEN** the Agent subsequently invokes an authorized Generated Image Rebuild for the one `needs_render` ID
- **THEN** the selected renderer is called only for that ID
- **AND** retained verified raw renders remain untouched

### Requirement: Order-dependent views display position and stable identity

Pipeline status, selector diagnostics, pilot/contact-sheet labels, and structural impact output SHALL present each current page as `position + formal slide_id + title` when those fields are available. Position SHALL be treated as the current snapshot projection and formal ID as the cross-version reference.

#### Scenario: Contact sheet remains easy to discuss

- **WHEN** a contact sheet is rebuilt after reordering
- **THEN** each label shows the page's new position and unchanged formal ID
- **AND** the image artifact remains associated by ID rather than label text
