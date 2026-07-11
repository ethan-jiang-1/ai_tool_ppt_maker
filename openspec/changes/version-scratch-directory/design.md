## Context

Phase A fixed **enforcement**: version `_scratch/`, deck-root whitelist, charter deep text. That is necessary but not sufficient.

Failure mode that remains: Agent mid-task thinks “I need a bak / temp / pilot artifact” and **does not know which canonical token to trust**. It will not scroll CONSTITUTION mid-paragraph. It **will** `rg`. If the soft bundle has no stable, path-named headings and no entry-doc pointer saying “grep these keys,” the model improvises directory names — then check fails after the damage, or worse, litter accumulates until someone notices.

So Phase B is a **discoverability / vocabulary** layer on top of the same layout SSOT (`bundle_layout.mjs`). Soft bundle teaches *how to think*; the Where Map teaches *which string to search and where the file lives*.

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

- One **Where Map** SSOT in `reference/glossary.md`: grep-friendly terms for high-frequency placement objects (workspace, version leaf, scratch, generated, style master, pilot/contact sheet, state, lessons, upstream, backbone, overrides)
- Entry docs plant **search keys** + the grep-before-invent rule
- Phase 0 / deck-root README maps show `_scratch` with the **same tokens** as glossary
- Golden deck first-look READMEs refreshed so opening a live deck does not teach a stale map
- Light tests that anchors exist

**Non-Goals**

- Changing `SCRATCH_SUBDIR` or adding deck-root scratch
- Replacing `checkBundle` with docs-only trust
- Auto-rewriting every historical deck README
- Expanding glossary into a full design textbook (only placement-critical terms)

## Decisions

### D0 — New capability `run-bundle-layout` ≠ `framework-directory-layout`

| Capability | Object |
|------------|--------|
| `framework-directory-layout` | Soft bundle `PPTMAKER_FRAMEWORK/` only |
| **`run-bundle-layout` (NEW)** | Run bundle `deck_{NAME}/` tree, roles, gradient, Where Map |
| `run-bundle-management` | Ops: init / check / new-version / self-check (+ seed README copy) |
| `framework-charter` | Entry/charter **mirrors and points**; does not own ontology |

Do **not** extend soft-bundle layout to cover `deck_*`. Delta spec: `specs/run-bundle-layout/spec.md` → sync to main on archive. Where Map requirements live primarily under `run-bundle-layout`.

### D1 — Phase A mechanism stays; Phase B is the open work

Do not re-litigate `_scratch` path, whitelist, or gitignore. Reopened change = capability split + discoverability + vocabulary alignment.

### D2 — Where Map is the GREP index; glossary definitions hang under same headings

- Top of `glossary.md`: **Where Map** table (Term | Path | Means | Do not).
- Body: `###` headings = **exact grep tokens** (`### _scratch/`, `### style_master.jpg`, `### --run-dir`, …).
- English-primary one-liners; Chinese allowed as gloss.
- Alias line only: `Also-search → canonical` (e.g. bak/temp → `_scratch/`; 小样 → `contact_sheet` / `pilot`).

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

One bullet under「目录结构是宪法」: unsure where to put → GREP tokens → `reference/glossary.md` Where Map. Do not paste the full table into BOOTSTRAP (drift risk). Quick-ref table may link glossary.

### D5 — AGENTS Phase 0 tree uses same labels as glossary

Tree annotation for `_scratch/` uses English role words aligned with Where Map (e.g. SCRATCH · version temp/bak · not SSOT). No third Chinese-only nickname as the sole label.

### D6 — `_DIR_READMES` are first-look maps for agents inside a deck

- Deck-root README: list that version temp lives at `3_versions/v{n}/_scratch/`; one line structure gradient / 上严下松.
- `3_versions` README: `--new-version` does not copy `_scratch/` contents (alongside `_generated/`).
- Leaf `_scratch` README already OK; keep routing table; ensure opening line shares glossary token `_scratch/`.

### D7 — Force-refresh golden deck READMEs

`deck_ai_sdlc_keynote` root + `v1/README.md` overwritten to match current seeds (init uses `_writeIfAbsent` — stale live decks stay wrong forever otherwise).

### D8 — Tests are anchor presence, not prose quality

Assert strings like `_scratch` / `Where Map` / grep-loop phrasing in glossary + BOOTSTRAP (and/or seed README constants). Structure check on keynote remains green.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Glossary grows into unmaintainable essay | Cap Where Map to placement-critical rows; deep why stays in existing sections |
| Entry docs and glossary drift | Same tokens; BOOTSTRAP points, does not fork table |
| Agent greps Chinese only | Also-search line + English paths in table |
| Stale decks outside keynote | Non-goal; seeds fix new inits; document refresh pattern |

## Migration Plan

1. Add `specs/run-bundle-layout/spec.md`; slim charter/management deltas to mirror/ops  
2. Apply: glossary Where Map → BOOTSTRAP → AGENTS tree → `_DIR_READMES` → keynote README force → light tests  
3. `npm test` + keynote `--structure-only`  
4. On archive/sync: main gains `openspec/specs/run-bundle-layout/` — never merge into `framework-directory-layout`  
5. Archive only after human OK (do not self-commit/archive)  

## Open Questions

None for mechanism. Copy tone (EN/中 mix) follows D2; human reviews wording at apply.
