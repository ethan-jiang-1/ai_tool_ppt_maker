## Context

Started as a small symptom: Agent dumps `.bak` at `deck_*` root. Phase A fixed **enforcement** (`_scratch/`, deck-root whitelist). That was not enough.

The larger hole: **run-bundle folder ontology had no OpenSpec home**. Soft bundle already has `framework-directory-layout`. Run-bundle tree/roles were smeared across `run-bundle-management` (Purpose said “Define directory structure” + ops) and `framework-charter` (docs looked like the definition). Agents mid-task **GREP**; if there is no stable Where Map, they improvise.

Change renamed: `version-scratch-directory` → **`run-bundle-layout-discoverability`**.

```
think: where does X go?
    → rg canonical token (_scratch | style_master | contact_sheet | …)
    → hit glossary Where Map (term → path → role → not-here)
    → write to that path
    → checkBundle still enforces if wrong
```

Code agents are GREP-native; design for `rg` hits, not prose recall or BM25.

## Goals / Non-Goals

**Goals**

- NEW capability `run-bundle-layout` owns deck tree / roles / gradient / Where Map
- MODIFIED `run-bundle-management` Purpose → ops over layout (not ontology owner)
- MODIFIED `framework-directory-layout` Purpose → soft bundle only; points at `run-bundle-layout` for `deck_*`
- Charter mirrors layout; BOOTSTRAP/AGENTS plant grep keys
- First-look README seeds + golden deck refresh; light anchor tests

**Non-Goals**

- Changing `SCRATCH_SUBDIR` or adding deck-root scratch
- Splitting `bundle_layout.mjs` into two scripts
- Merging soft-bundle and run-bundle layouts into one capability
- Replacing `checkBundle` with docs-only trust
- Auto-rewriting every historical deck README

## Decisions

### D0 — Two layouts + management (capability ownership)

| Capability | Object | Owns | Does not own |
|------------|--------|------|--------------|
| `framework-directory-layout` | `PPTMAKER_FRAMEWORK/` | Soft-bundle five dirs | Any `deck_*` tree |
| **`run-bundle-layout` (NEW)** | `deck_{NAME}/` | Tree, roles, gradient, Where Map; `renderTree()` meaning | init/check CLI behavior details |
| `run-bundle-management` | Same `bundle_layout.mjs` CLI | `--init`/`--check`/`--new-version`/`--self-check`; seed README **outputs** | Second ontology; Where Map |
| `framework-charter` | Entry/charter docs | Mirror + GREP pointers | Folder ontology |
| `playbook-execution` | Agent behavior | bak→`_scratch`; GREP before invent | Tree definition |

One implementation file: `bundle_layout.mjs`. Specs split **ownership**, not code.

### D1 — Phase A mechanism stays; this change owns boundary + discoverability

Do not re-litigate `_scratch` path, whitelist, or gitignore. Ontology narrative moves to `run-bundle-layout`; management **enforces**.

### D2 — Where Map is the GREP index; glossary definitions hang under same headings

- Top of `glossary.md`: **Where Map** table (Term | Path | Means | Do not).
- Body: `###` headings = **exact grep tokens** (`### _scratch/`, `### style_master.jpg`, `### --run-dir`, …).
- English-primary one-liners; Chinese allowed as gloss.
- Alias line only: `Also-search → canonical`.

### D3 — Canonical tokens (minimum set)

Must appear as searchable anchors (table and/or `###`):

| Token | Path gist |
|-------|-----------|
| `run bundle` | `deck_{NAME}/` |
| `soft bundle` | `PPTMAKER_FRAMEWORK/` |
| `--run-dir` | `…/3_versions/v{n}/` (≠ deck root) |
| `_scratch/` | version temp / bak |
| `_generated/` | pipeline derived |
| `slide-specifications.md` | version source SSOT |
| `style_master.jpg` | backbone visual anchor |
| `contact_sheet` / `pilot` | `_generated/preview/` 小样 |
| `_state/` / `_lessons/` | progress vs notes |
| `1_upstream_raw_material/` / `2_backbone/` / `overrides/` | tiers |
| structure gradient / 上严下松 | rule, not a path |

`_scratch/` definition MUST answer: what / where / not what / vs `_generated/`.

### D4 — BOOTSTRAP plants the loop; does not duplicate the whole map

One bullet under「目录结构是宪法」: unsure where to put → GREP tokens → `reference/glossary.md` Where Map. Do not paste the full table into BOOTSTRAP.

### D5 — AGENTS Phase 0 tree uses same labels as glossary

Tree annotation for `_scratch/` uses English role words aligned with Where Map (e.g. SCRATCH · version temp/bak · not SSOT).

### D6 — `_DIR_READMES` are first-look maps (management scaffold output)

Deck-root / `3_versions` seeds MUST surface `_scratch` + gradient tokens owned by layout. Leaf `_scratch` README keeps routing table.

### D7 — Force-refresh golden deck READMEs

`deck_ai_sdlc_keynote` root + `v1/README.md` overwritten to match current seeds.

### D8 — Tests are anchor presence, not prose quality

Assert Where Map / `_scratch` anchors; keynote structure-only green.

### D9 — On archive/sync

Main gains `openspec/specs/run-bundle-layout/`. Management Purpose replaced (no longer “Define directory structure”). Soft-bundle layout Purpose gains deck boundary sentence. Never merge into `framework-directory-layout`.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Dual SSOT if management Purpose left as “Define structure” | MODIFIED Purpose + RENAMED constitution requirement |
| Soft-bundle layout gets deck requirements later | Explicit Purpose boundary + layout distinction requirement |
| Glossary grows into essay | Cap Where Map to placement-critical rows |
| Stale decks outside keynote | Non-goal; seeds fix new inits |

## Migration Plan

1. Rename change + rewrite proposal (done)  
2. Delta specs: layout NEW; management / fdl / charter MODIFIED  
3. Apply docs/seeds/tests when human says apply  
4. Archive only after human OK — do not self-commit/archive  

## Open Questions

None for capability boundary. Copy tone (EN/中) follows D2; human reviews at apply.
