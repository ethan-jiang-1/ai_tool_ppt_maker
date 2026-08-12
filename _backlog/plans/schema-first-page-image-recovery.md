# Progressive Plan: Schema-First Page Image Recovery

> Type: progressive coordination plan | Updated: 2026-08-12 | Status: active (C1-C6 archived; C7 is the next production operation)
>
> **This is the only route document for Page Image recovery.** Three earlier
> plans were closed on 2026-08-11 as CLS-025/026/027; everything from them that
> still binds is restated below, so no downstream change needs to open a closed
> document. Two specialist plans remain active and will guide change C6:
> [framed-provider-protected-composition.md](framed-provider-protected-composition.md)
> and
> [framed-provider-capability-discovery-research.md](framed-provider-capability-discovery-research.md).

> **Current decision override.** The earlier frozen-identifier and
> compatibility-preservation conclusions in this plan are superseded. C2
> completed the one-contract clean cutover: active historical `*-vN` names were
> removed rather than preserved. Apply the decision procedure in
> [Schema-First Clean-Cutover Decisions](schema-first-clean-cutover-decisions.md)
> whenever implementation inspection exposes a hidden contract. Archived
> OpenSpec artifacts remain history only; they do not define active behavior.

## Read This First: Orientation For The Implementing Agent

You are picking this up without the conversation that produced it. This section
is the context that is otherwise lost. Everything here was verified against the
code on 2026-08-11; re-verify anything you are about to depend on, because file
line numbers drift.

### What the owner actually complained about

The trigger was not a bug. It was that a previous agent kept doing "patch on
patch" (补丁摞补丁) work — each fix layered onto code whose data contract was
never written down. The owner's instruction was to **define the schema first,
scrutinize it, and only then let code change**.

That reverses the usual order and it is the point of the whole plan. C1 ships
*no runtime change at all*. If you find yourself editing `.mjs` during C1, you
have misread the plan.

### The six constraints the owner set, in their own words

1. **Schema lives outside code, in YAML** — "这样三个角色都容易沟通，人、prompt
   和传统的JS". Three consumers must read the same definition: the human, the
   prompt, and the JS. A JS constant serves only the third.
2. **No versioning, ever** — "我们今后只会有一个版本啊，我不可能支持多个版本…
   唯一的，是我们的宪法宪章，他要变了，大家一块儿变就完了" and "最好别考虑版本了，
   考虑版本真是个噩梦". The root `VERSION` is the only version number. This is
   why no *new* schema identifier may carry `-vN`.
3. **Names are 2–3 words and obvious at a glance** — "别太短…你用两个单词，甚至
   三个单词都好…尽量一眼就能看到，看明白，不要猜测的东西". No abbreviations.
4. **The whole chain must be visible** — visual → story → pagination → complete
   page content → converted into what image2/framed needs. The owner's reason:
   "我都能指正起来" (then I can correct any of it), and it is friendlier to
   novices. This is why C5 exists as its own change.
5. **Keep the existing structure** — "结构尽量别动了，结构已经调出来，感觉还可以".
   The 00→06 pipeline stays. Only the schema and dataflow change.
6. **An assistant, not a strict tool** — "整个 agent flow 是一个很重交互的过程，
   用户是小白，主要是要帮助他按照流程把事做对。是助手而不是机械的严苛的工具".
   Strict rules, helpful responses. See "Who is on the other side" below; this
   constrains how every rule written in C1 and enforced in C2/C4 refuses.

### Why derived data is designed for the Agent, not the human
"上下文一旦第一次结构出来了之后，所有的打磨都是借助哈密斯打磨，对话来不断的控制" —
after the first generation, the human never hand-writes a source file again. All
refinement is conversational.

The consequence is easy to get backwards: derived files are **not** optimized to
be human-writable. They are optimized so an Agent can answer "where do I change
this, and what else changes with it?" That is why every derived value must carry
provenance. A pretty file that cannot answer that question has failed.

### Who is on the other side: a Deck Author, not an operator

"整个 agent flow 是一个很重交互的过程，用户是小白，主要是要帮助他按照流程把事
做对。是助手而不是机械的严苛的工具。"

The person using this system knows their content and knows nothing about the
Harness. They cannot name a schema, a controller, a field, or a lifecycle node —
and **being able to is never a precondition for making progress.** The whole
thing is driven through conversation. `CONTEXT.md` now names this role
**Deck Author**.

This constrains the schema work more than it looks, because schema-first has a
specific and seductive failure mode: 19 written schemas plus a drift test make
it easy to build a validator that is entirely correct and completely unhelpful.
The rules should be strict — the Harness's value is that its evidence can be
trusted. The *response to a violation* must not be.

Concretely, for every rule you write in C1 and enforce in C2/C4:

- A refusal names the next action **in the author's terms**, not the rule it
  violated. `**PAGE CLASS**` must be one of four values → the author sees "this
  page reads like a section divider — mark it as a transition?" `CONTEXT.md`
  calls this obligation **Repair Guidance**; it is part of the schema
  definition, authored next to the rule, not bolted on by the Agent afterwards.
- Never make the author supply a fact the system can derive or the Agent can
  ask for conversationally. An omitted Page Class normalizes to `standard`; it
  does not error.
- Never make correctness depend on the author learning vocabulary. If a
  message only makes sense to someone who has read the schema, rewrite it.
- Guidance is a Collaboration Projection: it helps the author decide, and it
  never authorizes, records, or gates anything.

This does **not** soften a Hard Stop. Identity, integrity, attributable
execution, security, and recoverability failures still refuse without
exception — they just also say what to do next. Recorded as
[ADR 0007](../../docs/adr/0007-refusals-carry-repair-guidance.md).

### The process rule that overrides your instincts

The owner interrupted an earlier session precisely on this point: "等等等。我们得
按照正常的路数做，首先你只是改context.md或者是DOS底下的a Dr 然后我们要借助
open.Spec来调整东西啊，我看你刚才立刻已经动schema了".

- `CONTEXT.md` and `docs/adr/` may be edited directly.
- **Everything else in the Harness source domain goes through an OpenSpec
  change.** Per `openspec/config.yaml`, that domain is exactly four directories:
  `ppt_maker_harness/`, `openspec/`, `tests/`, `tests_e2e/`.
- `deck_*` and `dpt_*` are production data — never source, never fixtures,
  never auto-migration targets. Do not read them unless the task names them.
- `_backlog/` is a separate bookkeeping system, read only when named. It does
  **not** track OpenSpec change status.

I violated this rule once by creating `ppt_maker_harness/schema/` directly and
had to delete it. Do not repeat that: C1 creates that directory *through an
OpenSpec change*.

**The accepted specs are part of the source domain and are cleaned through an
OpenSpec change — never hand-edited.** A version-suffixed literal in
`openspec/specs/` is a live contradiction of the no-versioning rule: it is
written down as the *contract* and every future change inherits it. It is
removed the same way it was written — a delta spec inside an OpenSpec change.
C2's final step scans the accepted specs to zero, including `openspec/specs/`.

**The owner's standing instruction, restated so a future reader does not have
to guess:** the point of this whole route is that every contract ends up
declared once under `ppt_maker_harness/schema/`, and the old scattered,
differently-named versions are *replaced* — not preserved. Whenever later work
hits another hidden contract (a term, serialization format, protocol label,
mode, identity scheme, record type, or recovery rule that lives in code or in
an accepted spec instead of under `schema/`), the disposition is
[Schema-First Clean-Cutover Decisions](schema-first-clean-cutover-decisions.md):
define it in `schema/` first, replace every active reader and writer together,
delete what has no role, and leave historical Run Bundle data untouched. That
decision is a standing rule for the entire route, not a one-time C2 event.

### Where to start reading the code

| Question | File |
| --- | --- |
| What identifiers exist and who validates them | `scripts/shared/image2/page_image_progressive_schema.mjs` |
| How a retired protocol is refused without rewriting records | `scripts/shared/run-bundle/page_image_workflow_identity.mjs` |
| Cross-file schema-ownership rules that already exist | `scripts/contracts/harness_architecture.mjs` |
| Where source is parsed into a receipt | `scripts/01-content/internal/page_image_source.mjs` |
| The shared seam both adapters compile through | `scripts/shared/page-image/page_image_core.mjs` |
| The Framed local header geometry | `scripts/03-framed-image/internal/header_overlay.mjs` |
| The actual HTTP body sent to the provider | `scripts/ppt_flow.mjs:2244` |
| Glossary — every term used in this plan | `CONTEXT.md` |
| Why YAML is authoritative and why no versioning | `docs/adr/0006-define-production-schemas-in-yaml.md` |

Single CLI entry point: `node ppt_maker_harness/scripts/ppt_flow.mjs <command>`.
Relevant subcommands: `state`, `style-master`, `image2`, `validate`, `build`,
`new-version`. Tests: `npm test`, or `npx vitest run <path>` for one file.

## What Changed And Why This Plan Exists

The previous route treated the schema as one input to a presentation-system
implementation. The owner's decision reverses that: **the schema is the
deliverable, and the code changes because the data flow changed.** The
existing pipeline structure is sound and stays; what was wrong is that the
schema was scattered, invisible, and named inconsistently.

Three founding rules now constrain every phase:

1. **No schema versioning.** The root `VERSION` is the only version number and
   it is the charter. Schema identifiers carry no `-vN` suffix. Recorded in
   [ADR 0006](../../docs/adr/0006-define-production-schemas-in-yaml.md).
2. **Names are 2–3 words and obvious at a glance.** No abbreviation, nothing
   the reader has to guess.
3. **All refinement after the first generation is conversational.** The human
   never hand-writes a source file again. The design criterion for derived data
   is therefore Agent traceability, not human writability.

The withdrawn OpenSpec change `introduce-page-image-presentation-system` is
deleted (21 files, 1335 lines; recoverable at commit `c05a502` with
`git show c05a502 --stat`). It was withdrawn for two reasons: it proposed
renaming the protocol to `page-authority-image2-v2`, which the no-versioning
rule forbids and which the frozen-identifier finding independently rules out;
and it treated the schema as an input to an implementation rather than as the
deliverable. Recover it only to read what was considered, never to resume it.

## Historical C2 Discovery (Superseded)

This section records the investigation that originally scoped C2. Its
preservation and compatibility conclusions were superseded by the clean-cutover
decision above and must not be used as implementation instructions. In
particular, do not reproduce its Run Bundle inventory commands: production data
is outside this route's source scope.

This is the finding that forced the seven-change split, and it was absent from
every earlier plan. Read it before touching any identifier.

### How to reproduce the inventory

Do not trust the numbers below — regenerate them. They were taken on
2026-08-11 and the bundles keep growing.

```sh
# every schema-shaped identifier the code knows
grep -rhno '"[a-z][a-z0-9-]*-v[0-9]"' ppt_maker_harness/scripts/ \
  | sed 's/^[0-9]*://;s/"//g' | sort -u

# for each one, how many production files outside _generated/ persist it
grep -rl "<identifier>" deck_dark_factory_current/ | grep -v /_generated/ | wc -l
```

The `grep -v /_generated/` is the whole test. Inside `_generated/` a name is
rebuildable and therefore renamable; outside it, the name is in Record Data or
Source Data and renaming it destroys or invalidates something.

### What the inventory shows

89 distinct identifiers exist in `scripts/`. **26 of them are persisted outside
`_generated/` in `deck_dark_factory_current` alone**, and they fall into four
groups that need different treatment. An earlier draft of this plan said "15";
that count covered only the first group and is wrong. The full list:

**Group 1 — paid raw-production records (8).** Grants, attempts, provenance,
review decisions. Each file is evidence that money was spent.

| Identifier | Files |
| --- | --- |
| `page-image-progressive-raw-item-attempt-v1` | 40 |
| `page-image-progressive-raw-materialization-provenance-v1` | 12 |
| `page-image-progressive-raw-complete-review-v1` | 7 |
| `page-image-progressive-raw-batch-grant-v1` | 5 |
| `page-image-progressive-raw-batch-projection-v1` | 5 |
| `page-image-progressive-raw-work-plan-v1` | 4 |
| `page-image-progressive-raw-scope-head-v1` | 3 |
| `page-image-progressive-accepted-raw-evidence-v1` | 2 |

**Group 2 — Style Master lineage records (7).**
`page-image-style-master-candidate-attempt-v1` (10),
`-generated-provenance-v1` (10), `-candidate-grant-v1` (5),
`-plan-identity-v1` (5), `-review-decision-v1` (5),
`-local-provenance-v1` (4), `-head-v1` (3).

**Group 3 — live state records (4).** These sit in `_state/state.yaml`, which is
rewritten by the runtime but never hand-edited:
`page-image-workflow-target-state-v1`, `page-image-workflow-handoff-v1`,
`page-image-style-master-selection-v1`, plus the `pipeline:` and `mode:` fields.

**Group 4 — Source Data schemas (7).** These label files a human authored, and
renaming one is a source migration, not a rename:
`pptmaker-run-bundle-v2` (`RUN_BUNDLE.md`),
`pptmaker-page-image-visual-language-v1`,
`pptmaker-pure-deck-visual-system-v1`,
`pptmaker-image2-reference-registry-v1` (all under `2_backbone/visual-style/`),
`page-image-workflow-v1` and `mnemonic-v1` (front matter of
`slide-specifications.md`), and `standard-v1` (the `**FRAME PRESET**` field
value on every Framed slide).

**Rule: records are read under their historical identifier forever; only newly
written records use the new vocabulary.** For Group 4 the rule is different —
those names are still actively written, so they are frozen against *renaming*
but not against use.

### The one that would silently destroy evidence

`page-image-workflow-v1` is not merely stored. It is *computed into* the
provider idempotency key:

```js
// ppt_maker_harness/scripts/shared/image2/page_image_progressive_schema.mjs:417
export function progressiveRawIdempotencyKey({ attempt_key_sha256 } = {}) {
  assertDigest(attempt_key_sha256, "attempt_key_sha256");
  return `page-image-workflow-v1-${attempt_key_sha256}`;
}
```

and `validateProgressiveRawItemAttempt` compares the persisted key against that
function for **exact equality** at `:457` (submitted attempts) and `:463`
(terminal attempts). 27 attempt records under
`deck_dark_factory_current/1_upstream_raw_material/page-image-workflow-iterations/`
carry keys with that prefix.

Change the literal and every one of those records fails validation. The paid
attempt history does not become mislabelled — it becomes *unreadable*, and the
failure surfaces as a validation error far from the rename that caused it.

### Decision: the protocol keeps the name `page-image-workflow-v1`

The user asked for `page-image2-workflow`, reasoning "因为我们是想充分利用
image2 的能力". The withdrawn OpenSpec change independently proposed a third
name, `page-authority-image2-v2`.

Both are rejected. The new name reads better, but it buys nothing the schema
definitions do not already deliver, and it costs the readability of evidence of
money already spent. The `-v1` here is a frozen literal inside an identity
function — the same category as the record identifiers above, not a version
number anyone may bump.
Two other live literals are frozen for the same reason:
`image2-page-workflow-v1` (the per-version production mode, in
`production_mode.mjs`) and `mnemonic-v1` (the slide identity scheme).

**If a future owner insists on the rename anyway**, it is a source migration in
its own right and needs: a successor version created by `--new-version`, the
predecessor left byte-preserved, and an explicit decision that the old attempt
records are archived rather than carried. It is not a C2 rename and must never
be bundled into one.

### There is already a retirement mechanism — read it before inventing another

`page-image-workflow-identity.mjs` implements exactly this problem for the
*previous* protocol generation. `page-authority-image2-v2` and
`image2-page-authority-v2` were retired, and rather than rewriting the records,
the module scans raw record bytes for retired identifiers and returns
`UNSUPPORTED_PROTOCOL` with `byte_preserving: true` and an export action.

Two lessons for C1/C2. First, the repo's established answer to "this name is
obsolete" is *refuse and preserve*, never *rewrite* — the clean-cutover
decision builds on that: historical data stays byte-preserved, and the
refusal path stays, while the active *write* path moves to the one declared
unversioned contract. Second, that module is a working reference implementation
for how a contract register should be enforced at runtime — do not design a new
mechanism without reading it. (The earlier phrase "how `frozen-identifiers.yaml`
should be enforced" is superseded: that file is deleted in C2; the module's
pattern transfers to `serialization-contracts.yaml`.)

## Target: 19 Schemas

Counted after the Q13 addition (`page-artifact-index`) and the Q14 split
(`layout-config` + `page-layout`). Earlier rounds said 17; 19 is correct.

**These 19 are the *conceptual* target vocabulary, not a rename list.** There
are 89 identifiers in the code today. The mismatch is intentional: most of the
89 are internal projections, capture profiles, and lineage records that have no
place in a vocabulary the human reads. The 19 answer the question "what are the
meaningful stages of the data flow"; the 89 answer "what does the runtime
serialize". C1 defines the 19. C2 maps the 89 onto them — and for most, the
mapping is "internal detail of stage X", not a rename.

Do not attempt a 1:1 rename. Three of the 19 (`story-outline`,
`design-constraints`, and the pagination step) have **no** existing
implementation at all — that is C3's entire reason to exist.

### Deck level — Source

| Schema | Answers |
| --- | --- |
| `story-outline` | What is the argument, in what order, on what evidence |
| `visual-language` | What the deck looks like: type, colour roles, imagery register |
| `design-constraints` | Audience, tone, forbidden claims, required terminology |

### Version level — Source

| Schema | Answers |
| --- | --- |
| `layout-config` | Page Class catalog and the profiles each class resolves to |
| `page-source` | One page's exact content, visual selection, and class |

### Per page — Derived

| Schema | Answers |
| --- | --- |
| `page-source-receipt` | What the parser understood from this page's source |
| `page-layout` | The geometry and treatment this page resolved to, with provenance |
| `page-render-model` | What this page will look like — the complete human-reviewable page |
| `page-generation-spec` | What the provider is being asked to generate |
| `image2-request` | The exact bytes going to image2 |
| `framed-header-html` | The local overlay, when the workflow is framed (`format: html`) |
| `page-artifact-index` | Where this page's artifacts are and what state they are in |

`page-render-model` and `page-generation-spec` are the pair most easily
confused. The first is what a human reviews; the second is a machine
instruction. Their definitions must each carry an explicit "does not contain"
clause naming the other.

### Production

| Schema | Kind | Answers |
| --- | --- | --- |
| `image-generation-plan` | derived | What will be generated, at what scope |
| `image-generation-record` | **record** | What was actually generated, at what cost |
| `page-review-decision` | **record** | The human `proceed \| repair` outcome |
| `final-page-list` | derived | Which image is final for each page |
| `delivery-package` | derived | The PPTX, notes, and delivery receipts |

### Infrastructure

| Schema | Kind | Answers |
| --- | --- | --- |
| `visual-style-candidates` | **record** | Style Master candidate lineage and decisions |
| `production-progress-state` | **record** | Where this version is in the pipeline |

Renamed from the earlier round for the 2–3-word rule: `style-master` →
`visual-style-candidates`, `workflow-state` → `production-progress-state`,
`page-links` → `page-artifact-index`, `source-receipt` → `page-source-receipt`.

### Known anchors: where each target already has an implementation

Verified 2026-08-11. This is C2's starting map, not its conclusion — C2 must
re-derive it, because a name with no anchor may simply mean I did not find it.

| Target | Existing identifier | Defined in |
| --- | --- | --- |
| `visual-language` | `pptmaker-page-image-visual-language-v1` | `02-visual-system/internal/page_image_visual_language.mjs:7` |
| `page-source-receipt` | `page-image-workflow-source-v1` | `01-content/internal/page_image_source.mjs:860` |
| `page-generation-spec` | `page-image-core-facts-v1`, `-core-slide-facts-v1` | `shared/page-image/page_image_core.mjs` |
| `image2-request` | `page-image-framed-provider-input-v1` / `-pure-provider-input-v1` | the two adapters; ownership enforced by `harness_architecture.mjs:88` |
| `image-generation-plan` | `page-image-progressive-raw-work-plan-v2` | `shared/image2/page_image_progressive_schema.mjs:5` |
| `image-generation-record` | `page-image-progressive-raw-item-attempt-v1` + provenance | same file — **frozen, Group 1** |
| `page-review-decision` | `page-image-progressive-raw-complete-review-v1` | same file — **frozen, Group 1** |
| `final-page-list` | `page-image-final-slide-manifest-v1` | `05-delivery/index.mjs:123` |
| `delivery-package` | `page-image-delivery-receipt-v1`, `-delivery-media-v1`, `-pptx-assembly-v1`, `-notes-receipt-v1` | `05-delivery/` |
| `visual-style-candidates` | the 7 `page-image-style-master-*` records | `shared/image2/style_master_schema.mjs` — **frozen, Group 2** |
| `production-progress-state` | `page-image-workflow-target-state-v1` | `shared/state/state.mjs:650` |
| `framed-header-html` | `FRAMED_HEADER_OVERLAY_PRESET` / `standard` | `03-framed-image/internal/header_overlay.mjs:6` |

| Target | Status |
| --- | --- |
| `layout-config` | **does not exist** — C4 creates it |
| `page-layout` | **does not exist** — C4 creates it |
| `page-artifact-index` | **does not exist** — C5 creates it |
| `page-render-model` | **does not exist** — C5 creates it |
| `story-outline` | materialized by C3 as the current Block-first backbone source |
| `design-constraints` | materialized by C3 as the current focused content-boundary source |
| `page-source` | partially exists as the `slide-specifications.md` grammar; C4 adds `**PAGE CLASS**` |

Note the shape this reveals: **downstream of the page is well-implemented and
mostly needs renaming; upstream of the page barely exists.** That asymmetry is
the real defect the owner noticed, and it is why C3 and C4/C5 are separate
changes rather than one "schema" change.

## Definition Home

```text
ppt_maker_harness/schema/
  README.md          authority boundary: YAML authoritative, code is mirror
  META.yaml          how to write one definition + naming rules
                     + the required on_violation shape (Repair Guidance)
  flow.yaml          the dataflow: each transformation, owner, invalidation
  stages/            19 field-level definitions, one file each
  serialization-contracts.yaml  one declared unversioned value per durable
                     selector and wire schema — the clean-cutover register,
                     added by C2
```

Code constants become mirrors annotated `// anchor: schema/stages/<name>.yaml`.
A regression test enumerates schema constants across `.mjs` and fails on any
name with no definition. `serialization-contracts.yaml` is the exception list
of the clean cutover: every durable selector and wire schema has exactly one
declared unversioned value there, so a `-vN` literal in active code or an
accepted spec is a defect, not an inheritance. It replaces the earlier
`frozen-identifiers.yaml` proposal: the frozen list preserved old names, and the
clean-cutover decision supersedes that — nothing active keeps a version suffix
merely because historical code or data understood it. Each entry carries the
specific data at risk, so a future reader sees why the value exists rather than
a bare `-vN` to "fix".

The owner's intent behind this directory, restated: **all contracts end up
declared once, here, and the old scattered, differently-named versions are
replaced — not preserved.**

### Every rule carries its Repair Guidance

`META.yaml` must require it, so it cannot be skipped one field at a time. A
stage definition states, for each constrained field:

```yaml
page_class:
  rule: one of standard | opening | transition | closing
  default: standard          # omission normalizes; it does not error
  on_violation:
    means: this page's narrative role is not one the deck knows how to lay out
    ask: which of these four roles does this page play in the argument?
    never: name the field or the schema file in what the author sees
```

`rule` is for the JS. `means` and `ask` are for the Deck Author, routed through
the Agent. The `never` line exists because the natural failure is to emit the
rule text as the message — correct, and useless to someone who has never read a
schema.

Three tests make this real rather than aspirational, and they belong to C1 and
C2 respectively: every constrained field in `stages/` has an `on_violation`
block (C1); no author-facing message contains a schema identifier or a source
field name (C2); every default that exists in `META.yaml` is applied rather
than validated against (C2).

Rationale in [ADR 0007](../../docs/adr/0007-refusals-carry-repair-guidance.md).

## Already Landed

Carried forward from the closed plans. These need no rework.

| Work | Evidence |
| --- | --- |
| **Baseline confirmed** | The v3 collision is provider-page content entering the Framed local header area before local composition. Current v3 has no accepted raw evidence, final manifest, or delivery receipt, so it cannot proceed. |
| **Framed test baseline restored** | `restore-framed-contract-baseline` (2026-08-10): 16 passing workflow tests, 3 named `it.todo` cases for the known omissions — lost `subject_restrictions`, ambiguous protected-region coordinates, missing body-safe region. The old 11 stale failures are gone. Those three define C6's work. |
| **Task Mandate aligned** | `align-task-mandate-exact-grants`, committed `17bb9f5`. Routine plan/Pilot/successor/grant/generation actions are Agent-run with `requires_human: false`; exact batch/grant/attempt/provenance lineage retained; Pilot and Complete Page Review remain human decisions. Verified: State/raw-owner/workflow 52/52, CLI 4/4, Controller 9/9, mock E2E 8/8, `npm test`. |
| **Provider surface recorded** | The transport submits `model`, `prompt`, `n`, `size`, `image`, `images`, `image_urls` — no mask or region field. A synthetic stress fixture, rubric, and result template exist. No paid probe was run; that stays in C6. |
| **Glossary and decision record** | `CONTEXT.md` rewritten 2026-08-11: 11 stale "settled target" terms removed, upstream narrative and data-kind vocabulary added, `Header Overlay Preset` corrected against the implementation. [ADR 0006](../../docs/adr/0006-define-production-schemas-in-yaml.md) records the YAML-authority and no-versioning decisions. |

## Ordered Route

```text
Landed
  Confirmed baseline
  Framed current-contract test baseline restored
  Task Mandate aligned with exact-grant runtime
  Provider capability surface recorded
  CONTEXT.md rewritten + ADR 0006          <- 2026-08-11
       |
       v
 C1  Publish the schema definitions                    (no runtime change)
       |
     Checkpoint 1: the data flow is visible and agreed
       |
       v
 C2  Clean-cutover the contract: one unversioned value per durable selector,
     replace readers and writers together, zero version-suffixed literal in
     active source, tests, or accepted specs
       |
     Checkpoint 2: one contract, records preserved, scans zero
       |
       v
 C3  Close the upstream gap: story, constraints, pagination
       |
     Checkpoint 3: the flow starts at the story, not at the page
       |
       v
 C4  Land Page Class and the layout config             (the presentation system)
       |
     Checkpoint 4: a page resolves one workflow projection
       |
       v
 C5  Publish per-page derived data on disk
       |
     Checkpoint 5: every intermediate step is inspectable
       |
       v
 C6  Framed protected-composition hardening
       |
     Checkpoint 6: the provider promise is honest
       |
       v
 C7  Repair and resume current v3
```

### What each checkpoint actually requires

A checkpoint is a Guided Checkpoint, not a Hard Stop: it states whether enough
evidence exists to start the next change. Checkpoint 1 is the only one that is
purely a human judgment — the rest are evidence plus a short confirmation.

| Checkpoint | Passed when |
| --- | --- |
| 1 | The owner has read `flow.yaml` and the 19 stage files and says the flow is what they want. No test can substitute for this. |
| 2 | All required tests pass; the static drift proof fails deliberately; all active consumers use one contract; the accepted-spec scan (including `openspec/specs/`) is zero; no production data was read or migrated. |
| 3 | A deck's argument and constraints exist as Source Data, and a page list derives from them carrying provenance. |
| 4 | One page resolves to exactly one workflow projection; the resolved view shows inherited values and their origin; editing an unselected profile invalidates nothing. |
| 5 | For one page, a human reads source → receipt → layout → render model → generation spec → provider bytes on disk, without running anything. |
| 6 | A written statement that Framed protection is bounded best effort, or a separately verified native primitive with a transport change. Any provider trial is limited to the explicitly authorized disposable samples; its result remains bounded empirical evidence. |

If a checkpoint is not ready, the rule from `CONTEXT.md` applies: name the
missing fact and prepare the smallest safe next action. Do not proceed into the
next change on the assumption it will be fixed later — that is precisely the
patch-on-patch habit this plan exists to end.

## Why Seven Changes, Not One

Each boundary below is a place where the work would otherwise become
unreviewable or unsafe to land partially.

| Change | Scope | Why it cannot merge with its neighbour |
| --- | --- | --- |
| **C1** Publish schema definitions | `ppt_maker_harness/schema/` only; zero runtime behaviour | This is the artifact the owner reviews. Mixing it with code changes makes the review impossible. Landing it alone is risk-free. **Archived 2026-08-11.** |
| **C2** Clean-cutover the contract | One unversioned value per durable selector/wire schema; replace all readers and writers together; zero version-suffixed literal in active source, tests, or accepted specs | Archived 2026-08-11 at `openspec/changes/archive/2026-08-11-conform-code-to-schema-definitions/`; completion commit `c473d14`. |
| **C3** Upstream gap | `story-outline`, `design-constraints`, pagination | Archived 2026-08-11 at `openspec/changes/archive/2026-08-11-close-upstream-narrative-gap/`; completion commit `ec8ec8b`. |
| **C4** Page Class + layout config | Parser, Core, resolver, both adapters, invalidation | Archived 2026-08-11 at `openspec/changes/archive/2026-08-11-land-page-class-and-layout-config/`; completion commit `1aa1994`. |
| **C5** Per-page derived data on disk | `image2 plan` writer, path layout | Archived 2026-08-12 at [`publish-per-page-derived-data`](../../openspec/changes/archive/2026-08-12-publish-per-page-derived-data/); six delta specs synced and completion commit `fcd9652`. It remains provider-free and inspectable before any spend. |
| **C6** Framed hardening | `subject_restrictions` propagation, normalized composition, body-safe region | Archived 2026-08-12 at [`harden-framed-provider-protected-composition`](../../openspec/changes/archive/2026-08-12-harden-framed-provider-protected-composition/). It establishes bounded best-effort provider guidance, not a native guarantee; no paid call, native transport claim, production-bundle read, or v3 repair occurred. Completion commit: `693921e`. |
| **C7** v3 repair | Production data path only | Not Harness maintenance. Runs under the Task Mandate, not OpenSpec. |

C1-C5 are complete. C6-C7 absorb the remaining earlier-plan phases with their
evidence intact.

## The Seven Changes In Detail

Each entry gives the proposed OpenSpec change name, its goal in one sentence,
what is in and out of scope, and the exit evidence that lets the next change
start. **Names are proposals** — confirm against `openspec/config.yaml`'s
capability registry when you write the proposal, and reuse an existing
capability rather than inventing one.

C1–C6 are OpenSpec changes. C7 is not: it is production work on a `deck_*`
bundle, entered through `BOOTSTRAP.md` and the controller playbook.

---

### C1 — `publish-production-schema-definitions`

**Goal.** Make the entire Page Image data flow visible in one place the human,
the prompt, and the JS can all read, so that every later change argues against a
written definition instead of against code.

**In scope.** Only `ppt_maker_harness/schema/`: `README.md`, `META.yaml`,
`flow.yaml`, `stages/` (19 files), `serialization-contracts.yaml` (published
by C2). Plus whatever `openspec/specs/` requirement declares that directory
authoritative. **Status: archived 2026-08-11** — C1 is done; the
`frozen-identifiers.yaml` mention in the archived scope was superseded by the
clean-cutover decision and C2 deletes it.

**Out of scope.** Every `.mjs` file. Any behaviour change. Any rename. If the
diff touches `scripts/`, the change is wrong.

**Why it is alone.** This is the artifact the owner personally reviews and the
whole point of the schema-first reversal. A diff that mixes definitions with
code cannot be reviewed for the thing that matters — whether the vocabulary is
right. It is also risk-free to land: nothing executes it yet.

**Design notes.**
- `flow.yaml` is the piece with no precedent. It must record, per
  transformation: input schema, output schema, owning module, what invalidates
  the output. This is what lets an Agent answer "what else changes with it".
- `serialization-contracts.yaml` (added by C2, not C1) supersedes the earlier
  `frozen-identifiers.yaml` idea: one declared unversioned value per durable
  selector and wire schema, with the specific data at risk named, so a future
  reader sees why the value exists rather than a bare `-vN` to "fix".
- **Every constrained field needs its `on_violation` block** — see "Every rule
  carries its Repair Guidance". `META.yaml` requires it, so it cannot be skipped
  one field at a time. This is the single easiest thing to omit in C1 and the
  most expensive to retrofit, because retrofitting means reopening all 19 files.
- `page-render-model` vs `page-generation-spec` is the pair most easily
  confused. Each definition must carry an explicit "does not contain" clause
  naming the other.

**Exit evidence.** The owner has read `flow.yaml` and the 19 stage files and
agrees the data flow is what they want. That agreement is Checkpoint 1 — it is
a human judgment, not a test result. **Status: archived 2026-08-11** — evidence
at commit `948681a`; checkpoint satisfied in conversation.

---

### C2 — `conform-code-to-schema-definitions`

**Goal.** Make the active Harness have exactly one declared unversioned
serialization contract under `schema/`, then replace every active reader,
writer, test, and operating document to use it together — and clean
`openspec/specs/` the same way.

**In scope.** The complete active Page Image and directly affected shared
Harness contract inventory: source/state/receipt/record/protocol/mode/identity/
idempotency/locator/catalog values. C2 adds `serialization-contracts.yaml`,
uses C1 stages as conceptual `schema` names, uses `artifact_role` only when a
stage has multiple concrete forms, and removes the frozen inventory and
historical scanners.

**Out of scope.** Run Bundle or research-data inspection/migration/deletion;
provider semantic changes; and C3-C5 producer work such as Page Class.

**Design notes.**
- The authoritative detailed decision is
  [Schema-First Clean-Cutover Decisions](schema-first-clean-cutover-decisions.md).
  It supersedes every earlier C2 preservation and compatibility instruction.
- **The accepted specs are inside C2's cleanup, through the change.** Today
  `openspec/specs/` carries at least 13 distinct version-suffixed identifiers —
  including `page-image-workflow-v1` (18×), `page-authority-image2-v2` (9×),
  `image2-page-workflow-v1` (6×), `page-image-final-slide-manifest-v1` (4×),
  `pptmaker-run-bundle-v2` (3×). That is the scattered, inconsistently-named
  state this route exists to end, written down as the *contract* — every future
  change inherits it. C2 removes them with a delta spec per affected capability
  (same procedure as its own main specs) and then scans the accepted specs to
  zero. Never a hand edit.
- A durable semantic value belongs in `schema/`; an implementation-only value
  has one documented owning invariant; an unused value is deleted. No active
  value is retained because old code happens to understand it.
- Extend the existing pure `harness_architecture.mjs` evaluator and its
  protected-core seam. The opt-in YAML/source sweep owns real-file parsing; it
  is not a runtime gate or second controller.
- C2 must not overload established `kind` fields. `artifact_role` is the new
  serialization discriminator when it is actually needed.
- The cleanup proof scans active Harness source, tests, and operating documents
  for version-suffixed production identifiers. The C2 deltas are the
  pre-archive specification proof; after sync/archive, accepted specs receive
  the same zero-result scan — including `openspec/specs/` itself, which C2
  edits through delta specs, never by hand.

**Exit evidence.** The inventory is reviewed; active-scope cleanup scans are
zero; focused owner and conformance tests pass; protected core remains
YAML-free; and after spec sync/archive the accepted-spec scan is zero —
including `openspec/specs/`. No Run Bundle was used as a fixture or
compatibility target.

**Status: archived 2026-08-11.** Evidence is retained at
[`openspec/changes/archive/2026-08-11-conform-code-to-schema-definitions/evidence.md`](../../openspec/changes/archive/2026-08-11-conform-code-to-schema-definitions/evidence.md).
The change was synced to accepted specs before archival; completion commit:
`c473d14`.

---

### C3 — `close-upstream-narrative-gap`

**Goal.** Make the flow start at the argument rather than at the page, so the
human can correct the story before any page exists.

**In scope.** `story-outline`, `design-constraints`, and the pagination step
that turns a story into a page list.

**Out of scope.** Page Class and layout config (C4). Anything about how a page
is rendered.

**Why it is separate.** Genuinely new territory with low coupling to the rest.
It could be done before or after C4 — the ordering here is a preference, not a
dependency. If C4 is urgent, C3 may follow it.

**Design notes.** This is the least-specified change in the plan, because the
earlier plans were all page-level. Expect to grill the owner on what a story
outline actually contains before writing the proposal. The one firm constraint:
it is Source Data, so it must be editable and must not be recomputable from the
pages.

**Owner decisions, 2026-08-11.** C3 runs before C4. `story-outline` is a
Block-first source: its deck root carries the central claim and intended
audience outcome; each ordered Block carries its audience question, argument
function, supporting evidence or reasoning beats, and intended page range.
Pagination derives a provenance-carrying page plan from that structure. The
Agent presents the plan conversationally; only an approved exact plan may
materialize `slide-specifications.md`. The current source name is
`2_backbone/story-outline.md`: C3 removes the active `outline.md` layout,
template, guidance, and test references without a legacy reader or migration
path. `design-constraints` owns audience, language/tone, claim boundaries, and
required terminology; visual and per-page layout controls remain with
`visual-language` and C4.

**Exit evidence.** A deck can express its argument and constraints in source,
and pagination derives a page list from them with provenance.

**Status: archived 2026-08-11.** C3 introduced the current Block-first Story
Outline and focused Design Constraints sources, provider-free narrative-plan
preview, one conversational content/structure confirmation, and exact Page
Source publication. Its seven delta specs were synced to accepted specs before
archival. Focused schema/layout/CLI/Controller coverage (76 tests), the selected
mock E2E, `npm test`, strict OpenSpec validation, the bundle self-check, and
`git diff --check` passed using only synthetic temporary bundles. Archive:
`openspec/changes/archive/2026-08-11-close-upstream-narrative-gap/`; completion
commit: `ec8ec8b`.

---

### C4 — `land-page-class-and-layout-config`

**Goal.** Let a page declare what *kind* of page it is, and resolve that
declaration into exactly one workflow-specific presentation, deterministically
and with provenance.

**In scope.** The `**PAGE CLASS**` source field; the four-document config
package; the resolver; both adapters; the invalidation rules. Parser, Core,
`03-framed-image/`, `04-pure-image/`.

**Out of scope.** Publishing the resolved data to disk (C5). Provider-facing
protection semantics (C6).

**Why it is the hard one.** Rated `XL`: it changes common contracts, both
adapters, paths, and regression suites. It must come after C1/C2 or it will
re-scatter the schema — that is the specific failure this whole plan exists to
prevent.

**Design notes.** All of "Absorbed Design Decisions" Q2–Q13 below is C4's
specification. Read it before proposing. In particular:
- The closed class set is `standard | opening | transition | closing`, default
  `standard`, omission normalizes to `standard`.
- Selected-vs-unselected invalidation is the subtle part: editing a profile the
  page *uses* forces a raw rebuild and a new review; editing a sibling profile
  invalidates nothing.
- `pure-deck-visual-system.yaml` is deliberately Pure-only and cannot be
  extended into a shared registry.
- There is exactly one Header Overlay Preset today (`standard`, hardcoded,
  caller-supplied rejected). **Resolved 2026-08-11:** `**PAGE CLASS**` is the
  only page-level presentation selector and supersedes `**FRAME PRESET**`.
  C4 removes that source field, receipt contract, and hard-coded selection
  without a compatibility reader, translation, or coexisting control plane;
  the existing overlay becomes the selected `standard` Framed profile.
- **A Deck Author must never have to name a class to make progress.** Omission
  normalizes to `standard` silently. When a page looks like it wants a different
  class, that is a suggestion the Agent raises conversationally — never a
  blocking prompt and never a validation error.

**Exit evidence.** A page resolves to exactly one workflow projection; the
resolved view shows inherited values; unselected-profile edits provably
invalidate nothing.

**Status: archived 2026-08-11.**
[`land-page-class-and-layout-config`](../../openspec/changes/archive/2026-08-11-land-page-class-and-layout-config/)
completed the clean cutover: `PAGE CLASS` is now the only current page-level
presentation selector; the four source documents resolve one workflow-isolated,
provenance-carrying projection per page; selected drift rebuilds raw work and
requires a new Complete Page Review; valid unselected sibling changes do not
invalidate a page. The seven delta specs were synced to accepted specs before
archive. Focused C4 regression coverage (146 passing tests, 3 existing TODOs),
the selected mock E2E, `npm test`, strict OpenSpec validation, layout
self-check, and `git diff --check` passed without production Run Bundle or
research input access. Completion commit: `1aa1994`.

The archived ledger retains one user-approved warning: its repository-wide
`npm run test:sweep` did not exit clean because a CLI diagnostic expectation and
two clean-target-draft State assertions reproduce outside C4's touched source;
the C4 Pure raw-binding expectation was corrected and passes in isolation.

---

### C5 — `publish-per-page-derived-data`

**Goal.** Make every intermediate step inspectable on disk before any money is
spent, so the human can correct the pipeline rather than judge its output.

**In scope.** Writing `page-source-receipt`, `page-layout`, `page-render-model`,
`page-generation-spec`, `image2-request`, `framed-header-html`, and
`page-artifact-index` as independent per-page files, plus the deck-level index.
Timing: at `image2 plan`.

**Out of scope.** Any provider call. Any new gate.

**Why it is separate.** It depends on C4's resolver existing, and it is
provider-free — so it can land and be inspected before any spend. That is
exactly the owner's "我都能指正起来".

**Design notes.**
- `image2 plan` is the correct timing: after the plan exists, before
  authorization.
- The existing inspection sidecar stores request JSON under `prompt`, and Human
  Navigation forbids raw prompt prose in its tree. The new per-page data must be
  an independent directory, **not** a navigation copy.
- Framed publishes header **HTML only**, no sibling JSON — the resolved page
  layout already carries the structured facts.
- **The trap:** a friendly projection must never become a new gate or a second
  authority. Keep `test_complete_page_review.mjs` passing so publication cannot
  create a second acceptance state.
- The audience for these files is the Agent, not the Deck Author — the author
  reads them *through* the Agent, in conversation. Optimize for provenance and
  traceability, not for someone hand-editing YAML. See "Why derived data is
  designed for the Agent, not the human".

**Exit evidence.** For one page, a human can read every stage from source to
exact provider bytes without running anything, and each derived file names what
produced it.

**Status: proposal-ready 2026-08-11.**
[`publish-per-page-derived-data`](../../openspec/changes/publish-per-page-derived-data/)
has all four strict-valid OpenSpec artifacts. It fixes one generated output
tree at `_generated/page_image_workflow/derived/`: independent per-page
receipt/layout/render-model/generation-spec/request/index files plus the
Framed HTML-only header and a deck index. The plan writes only after a valid
candidate is compiled and before the current progressive raw plan exposes
authorization; it deliberately creates no provider work, new gate, second
acceptance state, Human Navigation copy, migration, or historical reader.
**Status: archived 2026-08-12** at
[`openspec/changes/archive/2026-08-12-publish-per-page-derived-data/`](../../openspec/changes/archive/2026-08-12-publish-per-page-derived-data/);
six delta specs are synced to main specs and completion commit is `fcd9652`.

---

### C6 — `harden-framed-provider-protected-composition`

**Goal.** Make the Framed protection promise honest by establishing explicit,
bounded best-effort guidance and preserving the existing human review decision.

**In scope.** `subject_restrictions` propagation, normalized protected
composition with explicit canvas semantics, a body-safe region, request and
review binding, and deterministic verification.

**Out of scope.** Everything C1–C5 own. The v3 repair itself (C7).

**Why it is separate and last-but-one.** It is the only change carrying
external provider risk — an outcome no amount of local work can guarantee. It
must not block C1–C5.

**Full specification.** [framed-provider-protected-composition.md](framed-provider-protected-composition.md),
with the probe fixture and rubric in
[framed-provider-capability-discovery-research.md](framed-provider-capability-discovery-research.md).
Both are current and were re-aligned on 2026-08-11.

**The three known defects it owns** (each with a standing `it.todo` test):
`subject_restrictions` dropped at `page_image_core.mjs:183`; bare
`protected_geometry` with no canvas or unit semantics at
`03-framed-image/index.mjs:821`; no body-safe region anywhere.

**Status: archived 2026-08-12.** C6 replaced `protected_geometry` with the
profile-owned CSS-pixel `header_region` and resolver-derived normalized
`protected_composition`; it binds Core-retained `subject_restrictions` only to
the Framed raw/request lineage, publishes the two guides as review context, and
keeps one Complete Page Review decision. The request remains full-canvas opaque
shared transport with no native region, mask, crop, or reserved-area field.
The implementation makes the bounded-best-effort statement explicit; it ran no
real provider, paid probe, or production-bundle operation. The five delta specs
were synced to main specs before archive; completion commit: `693921e`.

**Follow-up boundary.** A synthetic paid probe or provider-native primitive is
not C6 work. It requires an explicit human Work Request and a separately
proposed OpenSpec change; it can never make an already-generated v3 page
acceptable.

---

### C7 — v3 repair (not an OpenSpec change)

**Goal.** Get `deck_dark_factory_current` v3 unstuck and delivered.

**Why it is not OpenSpec.** It is production work on a `deck_*` bundle.
`openspec/config.yaml` is explicit: production bundles are never Harness source,
and deck work enters through `BOOTSTRAP.md`, `AGENT_CONTRACT.md`, and the
controller playbook — not through a proposal.

**Current v3 state.** Framed workflow. Complete-page review for raw plan
`d179342d` shows a header collision on all three pages (`DkfGo`, `TwoMet`,
`PlatGo`). No accepted raw evidence, no final manifest, no delivery receipt —
so it cannot proceed. The correct decision is `repair`, not `proceed`.

**The mechanism.** Version succession, not migration. `--new-version` copies
only `slide-specifications.md` and `overrides/` and resets `_generated/`, so the
successor gets a clean source snapshot plus the new config package, while v3
stays byte-preserved with its evidence intact. The successor inherits no raw
evidence, grant, review decision, or final media. All three v3 pages normalize
to `standard`, so succession makes no content or class judgment.

**Hard rules.** Never hand-edit `_generated/`, state, receipts, or review
records. Never carry a prior authorization forward. Inspect both the provider
page and the composite before `proceed`.

## Absorbed Design Decisions

The two superseded plans are closed. Everything from them that still binds is
restated here, so no downstream change needs to read a closed document.

### From the schema plan (Q2–Q13, settled 2026-08-10)

| # | Decision | Owner |
| --- | --- | --- |
| Q2 | The current Work Version is the design boundary. Other versions may learn from it but never inherit automatically. | C4 |
| Q3 | Flexibility for opening/transition/closing pages is source-authored class selection, never a post-generation layout override. | C4 |
| Q4 | The closed class set is `standard`, `opening`, `transition`, `closing`. | C4 |
| Q5 | `standard` is the default; every special class is explicit in source. | C4 |
| Q6 | A framed header treatment owns its allowed kicker/title/subtitle set; a special class may be title-only. | C4 |
| Q7 | A human may redirect a page only to an existing named class, through source. That invalidates raw work and requires a new review. | C4 |
| Q8 | Page-definition schema and profile ownership are a cross-workflow problem. Pure's configuration cannot be repurposed to hold Framed facts. | C4 |
| Q9 | One version-level config resolves a class into strictly isolated Pure and Framed projections. Not one cross-workflow YAML. | C4 |
| Q10 | Before production each page exposes its source, resolved config, and generation spec; Framed also exposes its deterministic header HTML. No duplicate header-controller JSON. | C5 |
| Q11 | Those layers publish as independent per-page files with an index, not one giant document. | C5 |
| Q12 | A deck-level index explains purpose, adjustment scope, downstream controllers, and rebuild impact. | C5 |
| Q13 | Class profiles inherit deck-wide defaults and declare only typed differences; the resolved view shows the inherited result. | C4 |

**Config file layout** (C4). Four documents under
`visual-style/page-image-presentation/`, resolved by the normal
override-first/backbone-default path and validated as one closed package:

| Document | Owns | Must not contain |
| --- | --- | --- |
| class catalog | closed class set, default, class→profile identifiers | slide literals, geometry, provider prose |
| deck defaults | workflow-neutral typography, colour roles, density | per-slide facts, renderer geometry, prompts |
| pure profiles | Pure-only full-page treatment per class | framed header facts |
| framed header profiles | allowed fields, Reserved Header Region, local type/colour/spacing | Pure zones, provider prose, slide overrides |

A malformed, missing, or cross-file-inconsistent document stops planning; the
resolver never falls back to an earlier generated projection. The source-facing
counterpart is one closed field, `**PAGE CLASS**: opening`, whose omission
normalizes to `standard`.

**Invalidation** (C4). A class reassignment, a deck-default edit, or a
*selected* profile edit changes the page's resolved presentation and forces raw
rebuild plus a new Complete Page Review. An *unselected* class or sibling
profile edit invalidates nothing. A workflow transition resolves a fresh
projection and never reuses an old raw contract.

**Framed publishes header HTML only** (C5). The resolved page layout already
carries the structured header facts, and the HTML is the exact deterministic
local controller. A sibling JSON copy would add a duplicate with no decision
value.

### From the feasibility research (2026-08-10)

Effort, in the research's own scale — `S` bounded to one owner, `M` crosses a
few, `L` changes an adapter and its lifecycle tests, `XL` changes common
contracts, both adapters, paths, and regression suites:

| Change | Estimate | Dominant risk |
| --- | --- | --- |
| C1 | `S` | none — documentation only |
| C2 | `M` | wide diff; the frozen record identifiers must be removed — not preserved — and the accepted specs cleaned |
| C3 | `M` | new territory, low coupling |
| C4 | `XL` | selected-vs-unselected invalidation, and source migration |
| C5 | `M` | must not become a second authority or a navigation copy |
| C6 | `L` prompt-only, `XL` if a native primitive appears | external provider behaviour |
| C7 | `M` operationally | low architecture risk if C1–C6 pass |

Regression blast radius, by area:

| Area | Coverage to add or repair |
| --- | --- |
| source and receipt | `tests/01-content/test_page_authority_source.mjs` — currently asserts only the old preset |
| shared semantics | `test_page_image_core.mjs`, `test_page_image_invalidation.mjs`, both adapter suites |
| version config | `test_pure_deck_visual_system.mjs` plus new resolver/migration tests including unselected-profile non-invalidation |
| framed compilation | `test_framed_workflow.mjs`, then parsed-source-to-exact-request, coordinate-semantics, restriction, transport tests |
| per-page derived data | new path/schema tests; keep `test_complete_page_review.mjs` so publication cannot create a second acceptance state |

The research's three relaxation findings still hold: provider capability
discovery does not wait for schema code; Task-Mandate runtime alignment was
independent (and has landed); and a friendly projection must never become a new
gate.

### Version succession, not protocol migration

The superseded schema plan specified a `v3 -> v4` migration. Its **mechanism**
survives; its **framing as a protocol change** does not — there is one
protocol.

What survives: `--new-version` already copies only `slide-specifications.md`
and `overrides/` while resetting `_generated/`. A successor version therefore
gets a clean source snapshot and the new config package before any raw plan is
built, and the predecessor stays byte-preserved with its evidence intact. The
successor receives no raw evidence, grant, review decision, or final media.
Verified against the current v3: all three pages (`DkfGo`, `TwoMet`, `PlatGo`)
normalize to `standard`, so succession makes no content or special-class
judgment. Owned by C7.

## Carried-Forward Findings

These survive from the earlier plans and must not be re-litigated:

- **`subject_restrictions` is dropped by Page Image Core** before adapter
  compilation (`page_image_core.mjs:183`). This is the forbidden-subject defect.
  Owned by C6.
- **Framed sends bare `protected_geometry`** with no canvas or unit semantics
  (`03-framed-image/index.mjs:821`). This is the collision defect. Owned by C6.
- **The transport has no mask or region field** — only `model`, `prompt`, `n`,
  `size`, `image`, `images`, `image_urls`. A native primitive would need a
  separate transport change. Owned by C6.
- **`pure-deck-visual-system.yaml` is deliberately Pure-only** and its digest is
  forbidden for Framed. It cannot be extended into a shared profile registry.
  Owned by C4.
- **`image2 plan` is the correct publication timing** — after the plan exists,
  before authorization. Owned by C5.
- **The inspection sidecar stores request JSON under `prompt`** and Human
  Navigation forbids raw prompt prose in its tree. The new per-page data must be
  an independent directory, not a navigation copy. Owned by C5.
- **`FRAMED_HEADER_OVERLAY_PRESET = "standard"` is hardcoded and singular**
  (`header_overlay.mjs:6,64`); a caller supplying its own is rejected. The
  earlier plans' "Header Profile Set" does not exist. `CONTEXT.md` now calls the
  real thing **Header Overlay Preset**. Owned by C4.

## Non-Negotiable Rules

- A Work Version has exactly one workflow, `framed` or `pure`, chosen once.
- Framed renders only kicker, title, and subtitle locally. Everything else is
  provider-rendered.
- `_generated/`, receipts, review records, and state are never hand-edited.
- A provider avoidance instruction is not a collision guarantee.
- **The clean cutover is the law of the route.** Every active durable selector
  and wire schema has exactly one declared unversioned value in
  `serialization-contracts.yaml`. A version-suffixed production literal in
  active source, tests, or accepted specs is a defect, not an inheritance.
  Nothing active is retained merely because old code, tests, sample data, or a
  prior plan can still read it. No compatibility reader, migration, conversion
  path, frozen-name exception, or dual writer is ever added to make old and new
  contracts coexist. Replace all active writers and readers together; there is
  no legacy read path and no mixed-format interval. Historical `deck_*` data
  stays byte-preserved and untouched.
- The accepted specs are part of the source domain and are cleaned **through an
  OpenSpec change** — never hand-edited. `openspec/changes/archive` is decision
  history, not active vocabulary.
- A derived value without provenance is a defect: the Agent could not then state
  a change's blast radius, and the human could not check the claim.
- When a hidden contract surfaces later in the route, apply
  [Schema-First Clean-Cutover Decisions](schema-first-clean-cutover-decisions.md)
  before changing any caller. It is a standing rule, not a one-time C2 event.

## Update Protocol

Check a task only when its named evidence exists. When a change lands, record
its exit evidence here and in the owning specialist plan. If a decision changes
the ordering or the ownership of a boundary, revise this plan before starting
the affected downstream change.

The Execution Tracker below is the single progress surface for this route. It
is a Collaboration Projection, not a state of record: it helps a human and an
Agent coordinate, and it cannot prove that work happened. The proof is always
the named evidence — a test run, an archived OpenSpec change, a file on disk.
If the tracker and the evidence disagree, the evidence wins and the tracker is
wrong.

## Execution Tracker

**How to use this.** Tick a box only when its evidence line is true and you
can name where the evidence is. `[~]` means started. Leave the evidence column
filled in when you tick — a bare `[x]` six weeks later tells the next agent
nothing. Every change ends with an archived OpenSpec change except C7.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done with evidence
· `[-]` dropped, with a reason recorded in the change's proposal.

### Landed before this route began

- [x] Baseline confirmed — v3 collision is provider content entering the local header area
- [x] Framed contract test baseline restored — `restore-framed-contract-baseline`, 16 pass + 3 `it.todo`
- [x] Task Mandate aligned with exact-grant runtime — commit `17bb9f5`
- [x] Provider transport surface recorded — no mask/region field; probe not run
- [x] `CONTEXT.md` rewritten + [ADR 0006](../../docs/adr/0006-define-production-schemas-in-yaml.md) — 2026-08-11
- [x] `Deck Author` + `Repair Guidance` added to `CONTEXT.md`; [ADR 0007](../../docs/adr/0007-refusals-carry-repair-guidance.md) — 2026-08-11
- [x] Three superseded plans closed as CLS-025/026/027 — 2026-08-11
- [x] `introduce-page-image-presentation-system` deleted — commit `c05a502`

### C1 — `publish-production-schema-definitions`

- [x] Confirm the capability name against `openspec/config.yaml`; do not invent one
- [x] Write the OpenSpec proposal — schema-only scope, zero runtime change
- [x] `schema/README.md` — authority boundary: YAML authoritative, code is mirror
- [x] `schema/META.yaml` — how a definition file is shaped
- [x] `schema/META.yaml` requires an `on_violation` block on every constrained field
- [x] `schema/flow.yaml` — per transformation: input, output, owning module, invalidator
- [x] `schema/stages/` — all 19 definitions written
- [x] Every constrained field carries `means` / `ask` / `never` in the author's terms
- [x] Every field that can be defaulted has a `default:` rather than an error path
- [x] Test: every constrained field in `stages/` has an `on_violation` block
- [x] `page-render-model` and `page-generation-spec` each carry a "does not contain" clause naming the other
- [x] `schema/frozen-identifiers.yaml` — both entry kinds, every entry has a `reason:` *(superseded — C2 deletes it in favor of `serialization-contracts.yaml`)*
- [x] Verify the diff has no production-runtime `.mjs` change; the approved static directory assertion and one contracts-only test are the only `.mjs` exceptions
- [x] Archive the change
- [x] **Checkpoint 1** — the owner has read `flow.yaml` and the 19 stage files and agrees the flow is right

> Evidence: 2026-08-11 — the owner approved the C1 flow, nineteen definitions,
> and C1-C7 route authority for archival. `npm run test:sweep --
> tests/contracts/test_page_image_schema_definitions.mjs` passed (4 tests), the
> font-authority sweep passed (13 tests), `npm test`, `git diff --check`, and
> `openspec validate publish-production-schema-definitions --strict` passed.
> The delta was synced to `harness-directory-layout`, then archived at
> `openspec/changes/archive/2026-08-11-publish-production-schema-definitions/`.
> Completion commit: `7be177f`.

### C2 — `conform-code-to-schema-definitions`

- [x] Re-derive the complete active contract inventory; do not trust historical counts or inspect a Run Bundle
- [x] Classify every active value as a C1 stage, shared schema contract, documented implementation invariant, or deletion
- [x] Publish `serialization-contracts.yaml`; delete `frozen-identifiers.yaml` and every active preservation/compatibility reference
- [x] Replace readers and writers together with unversioned selectors and C1-stage/`artifact_role` records; keep existing `kind` semantics
- [x] Delete legacy scanners, special historical branches, migration/conversion paths, frozen fixtures, and dual-writer assumptions
- [x] Extend the pure `harness_architecture.mjs` evaluator; keep YAML parsing in the opt-in test, never in the protected core or runtime control path
- [x] Update active templates, guidance, tests, and all C2 capability deltas to the current contract
- [x] Prove the active source/test/document scan has no version-suffixed production literal or undeclared durable contract
- [x] **Clean `openspec/specs/` through the change** — a delta spec per affected capability: version-suffixed identifiers removed, unversioned ones declared; never a hand edit. Same procedure as the C2 main specs
- [x] After sync/archive, prove the same zero-result scan for accepted main specs and for `openspec/specs/`
- [x] Archive the change
- [x] **Checkpoint 2** — all required tests pass; the static drift proof fails
  deliberately; all active consumers use one contract; the accepted-spec scan is
  zero; no production data was read or migrated

> Evidence: 2026-08-11 — archived at
> `openspec/changes/archive/2026-08-11-conform-code-to-schema-definitions/`.
> The change re-derived the active inventory without using Run Bundle or
> research data; `serialization-contracts.yaml` is now the sole durable-contract
> inventory. Active Harness/test/E2E scans and the post-sync accepted-spec scan
> returned zero version-suffixed production identifiers. The pure evaluator and
> opt-in conformance test passed, as did focused owner tests, `npm test`,
> `npm run test:sweep`, process tests, `openspec validate --all --strict`, and
> `git diff --check`. Completion commit: `c473d14`. Full evidence:
> [`evidence.md`](../../openspec/changes/archive/2026-08-11-conform-code-to-schema-definitions/evidence.md).

### C3 — `close-upstream-narrative-gap`

- [x] **Grill the owner on what a Story Outline actually contains** — owner confirmed the Block-first model and its required content on 2026-08-11
- [x] Decide whether C3 runs before or after C4 — owner chose C3 first on 2026-08-11
- [x] Write the proposal, apply, sync seven delta specs, and archive `close-upstream-narrative-gap`
- [x] `story-outline` as Source Data — editable, not recomputable from pages
- [x] `design-constraints` as Source Data
- [x] The pagination step: story → page list, carrying provenance
- [x] Archive the change
- [x] **Checkpoint 3** — a deck expresses its argument and constraints in source, and a page list derives from them

> Evidence: 2026-08-11 — archived at
> `openspec/changes/archive/2026-08-11-close-upstream-narrative-gap/`; all 17
> apply tasks completed, seven delta specs synced to accepted specs, and strict
> OpenSpec validation passed. Focused schema/layout/CLI/Controller coverage
> (76 tests), selected mock E2E, `npm test`, bundle self-check, and
> `git diff --check` passed. No Run Bundle or research data was used as a
> fixture. Completion commit: `ec8ec8b`.

### C4 — `land-page-class-and-layout-config`

- [x] Read all of "Absorbed Design Decisions" Q2–Q13 — that is this change's specification
- [x] **Resolve the previously unresolved selector:** `**PAGE CLASS**` supersedes `**FRAME PRESET**`; remove the latter completely rather than retaining compatibility or a parallel control plane
- [x] Write the proposal, delta specs, design, and implementation tasks in [`land-page-class-and-layout-config`](../../openspec/changes/archive/2026-08-11-land-page-class-and-layout-config/) — rated `XL`; common contracts, both adapters, paths, and regression suites are planned
- [x] `**PAGE CLASS**` source field — closed set `standard | opening | transition | closing`, omission normalizes to `standard`
- [x] Omission never errors and never blocks; a better-fitting class is an Agent suggestion, not a prompt
- [x] The four-document config package
- [x] The resolver — deterministic, one projection per page, provenance on every inherited value
- [x] Framed adapter consumes the resolved profile
- [x] Pure adapter consumes the same class through its whole-page visual system
- [x] Invalidation: editing a *selected* profile forces raw rebuild and new review
- [x] Invalidation: editing an *unselected* profile invalidates nothing — prove it
- [x] `pure-deck-visual-system.yaml` stays Pure-only; its digest stays forbidden for Framed
- [x] Archive the change
- [x] **Checkpoint 4** — a page resolves exactly one workflow projection; inherited values show their origin

> Completion evidence: 2026-08-11 — archived at
> [`openspec/changes/archive/2026-08-11-land-page-class-and-layout-config/`](../../openspec/changes/archive/2026-08-11-land-page-class-and-layout-config/).
> All seven delta specs were synced before archive. The C4 focused suite (146
> passing tests, 3 existing TODOs), selected mock E2E, `npm test`, strict
> OpenSpec validation, layout self-check, and `git diff --check` passed. The
> archived ledger records the user-approved C4 `5.2` warning: the full sweep
> has reproducible non-C4 CLI/State baseline failures. Completion commit:
> `1aa1994`.

### C5 — `publish-per-page-derived-data`

- [x] Write the proposal, six delta specs, design, and implementation tasks in [`publish-per-page-derived-data`](../../openspec/changes/archive/2026-08-12-publish-per-page-derived-data/) — provider-free scope, no new gate; strict OpenSpec validation passed
- [x] Publish at `image2 plan` — after the plan exists, before authorization
- [x] Write each per-page file: `page-source-receipt`, `page-layout`, `page-render-model`, `page-generation-spec`, `image2-request`, `page-artifact-index`
- [x] Framed additionally publishes `framed-header-html` — HTML only, no sibling JSON
- [x] The deck-level index
- [x] Every derived file names what produced it and what invalidates it
- [x] Use an independent directory, **not** a Human Navigation copy — navigation forbids raw prompt prose in its tree
- [x] Confirm no second acceptance state was created: `test_complete_page_review.mjs` still passes
- [x] Archive the change
- [x] **Checkpoint 5** — for one page, a human reads source → receipt → layout → render model → generation spec → provider bytes on disk, without running anything

> Evidence: 2026-08-12 — archived at
> [`openspec/changes/archive/2026-08-12-publish-per-page-derived-data/`](../../openspec/changes/archive/2026-08-12-publish-per-page-derived-data/).
> Six delta specs were synced to accepted main specs; all 19 tasks completed.
> Focused C5 unit/integration/E2E coverage, `npm test`, strict OpenSpec
> validation, the Run Bundle layout self-check, the mock public-CLI journey,
> and `git diff --check` passed. Completion commit: `fcd9652`.

### C6 — `harden-framed-provider-protected-composition`

Full specification: [framed-provider-protected-composition.md](framed-provider-protected-composition.md).
Probe fixture and rubric: [framed-provider-capability-discovery-research.md](framed-provider-capability-discovery-research.md).

- [x] Propose and strict-validate `harden-framed-provider-protected-composition`
- [x] Retain `subject_restrictions` in Core and bind it only to the Framed raw/request lineage
- [x] Replace bare `protected_geometry` with CSS-pixel `header_region` and exact normalized `protected_composition`, including the full-width body-safe region
- [x] Remove Framed header-literal provider context and former geometry readers/writers without a compatibility path
- [x] Bind composition drift to the existing raw-rebuild and Complete Page Review path; keep guide rectangles as review context only
- [x] Verify C6 with focused suites, mock public-CLI coverage, `npm test`, strict OpenSpec validation, the layout self-check, and `git diff --check`
- [x] Record the bounded-best-effort provider boundary: no native region/mask/crop field, no real provider or paid probe, no v3 repair, no production-bundle read or migration
- [x] Sync five delta specs to main specs, archive the change, and commit `693921e`
- [x] **Checkpoint 6** — the provider promise is explicitly bounded best effort; only Complete Page Review can accept a provider page
- [x] Record that any paid synthetic probe or native-primitive transport work requires its own explicit Work Request and follow-up OpenSpec change

> Evidence: [`evidence.md`](../../openspec/changes/archive/2026-08-12-harden-framed-provider-protected-composition/evidence.md); archived change path above; all 19 implementation tasks complete. The prepared probe research remains historical preparation only, not execution evidence.

### C7 — v3 repair (Task Mandate, not OpenSpec)

Entered through `BOOTSTRAP.md` and the controller playbook. Production data
only — this is not Harness maintenance.

- [ ] Confirm the current v3 review decision is `repair`, not `proceed`
- [ ] Create the successor with `--new-version` — copies only `slide-specifications.md` and `overrides/`, resets `_generated/`
- [ ] Verify v3 is byte-preserved with its evidence intact
- [ ] Verify the successor inherited no raw evidence, grant, review decision, or final media
- [ ] Generate under the new config package
- [ ] Inspect both the provider page and the Production-Equivalent Composite before deciding
- [ ] Complete Page Review returns `proceed`
- [ ] Deliver
- [ ] Update the `deck_dark_factory_current` memory entry

> Evidence: _(successor version number; the review decision record; the delivery receipt)_

### Post-route provider constraint trial

[`validate-framed-provider-constraint`](../../openspec/changes/archive/2026-08-12-validate-framed-provider-constraint/)
was archived on 2026-08-12 after the explicit Work Request authorized two
disposable, non-production Framed samples. `BodyMap` and `BodyRun` used one
exact two-item grant and no page was resubmitted. Both samples placed provider
body content and key subjects in the reserved header; both local headers stayed
legible in the composite, but Complete Page Review correctly decided `repair`.
No native region, mask, crop, or reserved-area transport field or provider
contract was verified. The conclusion remains bounded to these two requests and
does not authorize a transport extension or alter C7. Evidence lives in the
archived change.

### Cleanup must not be forgotten

This route's whole reason for existing is that schemas were scattered with
inconsistent names. The final state is therefore not "C1–C6 landed" — it is
**everything ends up declared once under `schema/`, and the old versions
replaced everywhere they used to live, including the accepted specs.** Use this
checklist at closeout, and at any later point in the route when a hidden
contract surfaces:

- [x] No version-suffixed production literal remains in active source or tests — C2's scan proves it
- [x] No version-suffixed production literal remains in `openspec/specs/` — C2's accepted-spec scan proves it, applied through an OpenSpec change
- [x] Every durable selector and wire schema has exactly one unversioned entry in `serialization-contracts.yaml`
- [x] No compatibility reader, migration path, frozen-name exception, or dual writer exists anywhere in active scope
- [x] Historical `deck_*` data untouched and byte-preserved — C2 did not read, write, migrate, delete, or use it as a fixture
- [ ] The decision record itself stays with the route: close
      [schema-first-clean-cutover-decisions.md](schema-first-clean-cutover-decisions.md)
      alongside this plan when the last change archives

### Route closeout

- [x] All six route OpenSpec changes archived; the separate post-route provider constraint trial is also archived
- [ ] `VERSION` bump judged against `openspec/config.yaml` `rules: version:` and confirmed with the owner
- [ ] `VERSION_LOG.md`, `ppt_maker_harness/README.md`, `package.json` updated in step
- [ ] This plan closed: `git mv` to `_backlog/_done/_closed_plans/`, assigned CLS-NNN, three index files updated per `_backlog/plans/README.md`
