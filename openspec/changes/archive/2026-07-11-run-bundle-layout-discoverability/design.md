## Context

Phase A already shipped `_scratch/` enforcement (`checkBundle`, init/new-version, charter deep text). **Enforcement alone is not enough.**

**Recurrence proof (in-scope, not optional):** `deck_ai_sdlc_bpm_keynote/_slidespec.bak-split` appeared again at deck root while older baks already lived under `v1/_scratch/`. `checkBundle --structure-only` correctly fails with 上严下松 + “Version temp/bak → `…/_scratch/`”. So the drawer and the police exist; the agent still **does not discover** them before writing. This change must close that loop.

Remaining problem = **spec ownership + GREP discoverability**:

- Main `run-bundle-management` Purpose still claims to **define** directory structure (ontology + ops tangled).
- Soft bundle already has `framework-directory-layout`; run bundle had no counterpart capability.
- Agents GREP; without a Where Map of stable tokens, they invent paths even when check would later fail.

This change’s deltas (step 2) already state the intended main-spec shape. Design records **how** we implement and sync without reopening those decisions.

```
think: where does X go?   (e.g. slidespec .bak before rewrite)
  → rg token (_scratch | …)
  → glossary Where Map (run-bundle-layout)
  → write under 3_versions/v{n}/_scratch/
  → checkBundle still enforces if someone slips (run-bundle-management)
```

## Goals / Non-Goals

**Goals**

- Sync deltas → main: NEW `run-bundle-layout`; MODIFIED management / framework-directory-layout / charter / playbook as in `specs/`
- Register `run-bundle-layout` in `openspec/config.yaml`
- On sync of existing caps: hand-author main `## Purpose` to match delta semantics (management = ops; soft-layout = soft only)
- Apply: Where Map + entry pointers + `_DIR_READMES` + keynote README refresh + light tests

**Non-Goals**

- New disk paths or deck-root `_scratch`
- Splitting `bundle_layout.mjs`
- Merging the two layout capabilities
- Re-implementing Phase A whitelist/`SCRATCH_SUBDIR` logic
- Re-ADDing playbook bak→`_scratch` (already in main)

## Decisions

### D1 — One module, two capability owners

| Owner | Owns | Same file |
|-------|------|-----------|
| `run-bundle-layout` | Tree meaning, roles, gradient, Where Map, `renderTree()` narrative | `bundle_layout.mjs` constants / tree text |
| `run-bundle-management` | `--init` / `--check` / `--new-version` / `--self-check`, seed README **outputs** | same module CLI |

Do not create a second layout script.

### D2 — Soft vs run layout never merge

`framework-directory-layout` = `PPTMAKER_FRAMEWORK/` only.  
`run-bundle-layout` = `deck_*` only.  
Boundary enforced by soft-layout ADDED requirement + layout Purpose.

### D3 — Charter is mirror, not ontology

CONSTITUTION / CONTRACT / BOOTSTRAP / AGENTS **state and point**; they do not redefine the tree. Where Map SSOT = glossary under `run-bundle-layout`. BOOTSTRAP must not paste a second full table.

### D4 — Where Map GREP shape

- `## Where Map` table: Term | Path | Means | Do not
- `###` headings = exact tokens (`### _scratch/`, `### --run-dir`, `### style_master.jpg`, …)
- Minimum tokens per layout delta (run bundle, soft bundle, `--run-dir`, `_scratch/`, `_generated/`, style master, pilot/contact sheet, `_state/`, `_lessons/`, …)
- Also-search aliases → canonical

### D5 — Sync mechanics (agent-driven)

Per openspec-sync: deltas use only ADDED/MODIFIED/REMOVED/RENAMED headers; main specs store `## Purpose` + `## Requirements` only. For NEW `run-bundle-layout`, copy Purpose from delta then flatten ADDED into Requirements. For MODIFIED caps, merge requirement bodies; **rewrite Purpose** from proposal/delta semantics (especially management: drop “Define directory structure”).

### D6 — Apply order after specs are sync-ready

1. glossary Where Map  
2. BOOTSTRAP + AGENTS  
3. `_DIR_READMES` + template-deck-guide if needed  
4. Force-refresh keynote root + v1 README  
5. Tests + `npm test` + keynote `--structure-only`  
6. Human OK → archive/sync (+ `config.yaml` registry: add `run-bundle-layout` row **and** rewrite `run-bundle-management` row to ops)

### D7 — Stale READMEs

`_writeIfAbsent` never refreshes live decks; keynote root/v1 MUST be overwritten to teach `_scratch`.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| config.yaml registry drifts from spec semantics | Explicit task: on sync/archive **add** `run-bundle-layout` row **and rewrite** the `run-bundle-management` row (drop “目录结构宪法” → ops), matching the narrowed Purpose |
| Management Purpose left stale after requirement rename | Sync hand-authors Purpose (D5) |
| Glossary / BOOTSTRAP drift | BOOTSTRAP pointer-only; one Where Map SSOT |
| Old decks outside keynote stay stale | Non-goal; seeds fix new inits |

## Migration Plan

1. Human OK on design → write tasks  
2. Apply framework docs/seeds/tests  
3. Sync deltas → main specs + config registry  
4. Archive only after human OK — no silent commit/archive

## Open Questions

None for boundary. Apply copy (EN/中 mix) follows D4; human reviews at apply gate.
