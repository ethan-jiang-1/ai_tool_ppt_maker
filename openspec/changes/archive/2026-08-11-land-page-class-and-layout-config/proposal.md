## Why

C3 现在能从可审阅的故事源发布 Page Source，但页面仍无法以一个有来源、跨工作流一致的方式表达“这是开场、转场还是收束”。现有 Framed 源中的每页 `FRAME PRESET` 只指向硬编码的 `standard` overlay，而 Pure 的 deck visual system 也不能承载 Framed 事实；继续扩展任一侧都会重新分散 schema 和产生相互冲突的选择器。

现在执行 C4，是因为 C1--C3 已经建立了当前源、身份和叙事路径。C4 以一次干净切换把 Page Class、配置包、跨工作流解析和失效规则收拢到各自的 owner，为 C5 的派生数据发布建立唯一、可解释的输入。

## What Changes

- Add the optional source-authored `**PAGE CLASS**` field with the closed values
  `standard`, `opening`, `transition`, and `closing`. Omission silently normalizes
  to `standard`; a possibly better special class is conversational Agent guidance,
  never a parser error or blocking prompt.
- **BREAKING:** remove the per-page `**FRAME PRESET**` source field and its
  caller-selectable receipt contract. `PAGE CLASS` is the sole page-level
  presentation selector. The existing `standard` Framed overlay becomes the
  profile selected by the class-to-profile resolver; no compatibility reader,
  migration, or dual control plane remains.
- Add the version-level `2_backbone/visual-style/page-image-presentation/`
  package: a class catalog, workflow-neutral deck defaults, isolated Pure
  profiles, and isolated Framed header profiles. Normal override-first then
  backbone-default lookup resolves and validates the four documents as one
  closed package.
- Resolve every page class to exactly one projection for the version's selected
  workflow, retaining the class/profile binding and provenance for every
  inherited value. Pure facts remain in Pure profiles and Framed header facts
  remain in Framed profiles; `pure-deck-visual-system.yaml` is not repurposed as
  a shared registry. A Framed source literal disallowed by its selected profile
  stops with direct source repair; it is never silently dropped, rewritten, or
  made provider-visible.
- Route both adapters through that resolved projection. A selected class/profile
  or deck-default change invalidates the affected page's raw work and requires
  a fresh Complete Page Review; an unselected sibling class/profile change
  invalidates nothing. Framed raw-plan proof, composition, and review coverage
  bind each page's selected profile and guide, so one review may contain
  multiple valid Page Classes without inventing a deck-wide presentation
  profile. A workflow transition resolves a new projection and never reuses an
  old raw contract.
- Materialize C4's declared schema-stage producers and current serialization
  inventory entries. The four configuration records become unversioned
  `layout-config` source contracts; the existing Pure record moves out of the
  visual-language registry, and the active `framed_header_preset: standard`
  selector is retired. This change computes and consumes resolved data in
  memory; it does not publish C5's per-page derived files, call a provider, or
  add an approval, acceptance, or other durable control state.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `content-parsing`: parse and normalize the closed `PAGE CLASS` source field,
  and remove the current `FRAME PRESET` ingress and receipt contract.
- `visual-config`: own the closed four-document Page Image presentation package,
  the workflow-isolated class/profile resolver, inherited-value provenance, and
  package validation.
- `pipeline-orchestration`: classify page-class/config changes from current
  resolved inputs so selected changes take the existing raw-rebuild route while
  unselected siblings leave current work intact.
- `image-generation`: bind each current provider input and Framed local header
  controller to the one resolved workflow-specific projection, without adding a
  provider-facing override or persistent projection file.
- `harness-directory-layout`: materialize the C4 schema-stage owners and current
  serialization-contract entries at their executable anchors.
- `run-bundle-layout`: reserve the four source documents in the version
  backbone, including their strict ownership and rebuildable-derived boundary.
- `run-bundle-management`: seed and validate the complete current package for
  new/current source work and clean successors, without reading, modifying, or
  migrating production bundles.

## Impact

- **Harness source:** `ppt_maker_harness/schema/`, Page Source parsing,
  `scripts/shared/page-image/`, `03-framed-image/`, `04-pure-image/`, visual
  config, Run Bundle layout/init, and relevant workflow guidance change together.
  `openspec/`, `tests/`, and `tests_e2e/` receive the corresponding contracts and
  focused coverage.
- **Control owner:** the MD Controller/Agent remains the owner of presentation
  advice and human-facing class suggestions; JS owns parsing, package validation,
  deterministic resolution, invalidation, and diagnostic facts. Their handoff is
  the existing source/config-to-CLI protocol, not a second controller or state
  machine.
- **Run Bundle contract:** breaking clean cutover for current authoring: one
  `PAGE CLASS` selector and a required four-document source package replace
  `FRAME PRESET` and the hard-coded sole overlay selection. No `deck_*` or
  `dpt_*` object is read as a fixture, altered, migrated, or deleted; historical
  production data remains outside this change's scope.
- **Human control:** omission and routine class suggestions are `guide`s. No
  new `confirm` is introduced: changing source or selected visual config enters
  the existing raw rebuild and Complete Page Review, where the human already
  judges the resulting complete page. A malformed/missing/inconsistent package,
  absent selected projection, workflow mixing, or stale raw binding is a
  `hard-stop` because it protects canonical configuration, workflow isolation,
  provenance, and exact review evidence. The Agent repairs the direct source or
  config and reruns the same check under the Task Mandate.
- **Control simplicity:** the shortest path is Page Source + four canonical
  config documents -> one resolver -> existing raw-rebuild/review path. It
  deletes `FRAME PRESET` rather than layering class selection beside it, reuses
  existing lifecycle checks, and deliberately adds no fallback, migration,
  duplicate header JSON, new gate, retry route, or durable decision record. This
  follows [human-centered gates](../../policies/human-centered-gates.md),
  [agent assistance and control](../../policies/agent-assistance-and-control.md),
  and [simple reliable control](../../policies/simple-reliable-control.md).
