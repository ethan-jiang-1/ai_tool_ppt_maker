# Page Authority Visual-Language Registry Contract

## Purpose And Owner

`VISUAL BRIEF` selects reviewed visual language; it never carries arbitrary provider-facing prose.
The registry is therefore a trusted visual-system source, not a parser implementation detail and not an
HTML asset catalog extension. The existing `visual-config` capability owns the registry's deep module:
file parsing, compatibility, compilation of trusted clauses, and the registry semantic digest.
`content-parsing` owns only the slide-level selection and source spans. `image-generation` receives the
compiled projection and never reads registry files directly.

The single canonical physical home is:

```text
2_backbone/visual-style/page-authority-visual-language.yaml
```

It is deck-wide visual doctrine. A version override under `3_versions/vN/overrides/visual-style/`, an
HTML `asset-manifest.yaml` entry, a CLI path argument, or a generated copy is invalid. A semantic
registry change is a visual-system source change; it invalidates affected raw image contracts and cannot
be smuggled in as a per-slide prompt edit.

## Closed File Shape

The YAML document has exactly these top-level keys:

```yaml
schema: pptmaker-page-authority-visual-language-v1
revision: <positive-integer>
text_guard: page-authority-text-guard-v1
recipes: {}
compositions: {}
motifs: {}
```

`schema` and `text_guard` are fixed literals. Mapping keys in `recipes`, `compositions`, and `motifs` are unique
lower-kebab IDs. Duplicate keys, aliases, anchors, tags, unknown fields, empty IDs, escaping paths,
external files, template variables, and unregistered selections fail with source spans.

Each record has a closed trusted shape:

```yaml
# recipes.<id>
provider_clause: <reviewed nonempty visual-only clause>
authorities: [pure-image2, framed-image2]
composition_ids: [<composition-id>, ...]
motif_ids: [<motif-id>, ...]
identity_subject_classes: [none, amber-light-form]

# compositions.<id>
provider_clause: <reviewed nonempty visual-only clause>
authorities: [pure-image2, framed-image2]
min_motifs: 0
max_motifs: 6

# motifs.<id>
provider_clause: <reviewed nonempty visual-only clause>
authorities: [pure-image2, framed-image2]
recipe_ids: [<recipe-id>, ...]
composition_ids: [<composition-id>, ...]
```

## Deterministic Text Guard

Every `provider_clause`, plus the separate Agent-reference registry's `role_clause`, passes
`page-authority-text-guard-v1` before it can enter a provider payload. The guard is deliberately
mechanical and reproducible:

1. Decode the YAML scalar, require nonempty printable ASCII only (`U+0020` through `U+007E`), lowercase
   it with ASCII rules, reject leading/trailing or repeated spaces, and reject any character outside
   `[a-z0-9 ,;:()./-]`. This rejects all CJK and other non-ASCII text, quotes, escapes, newlines, and
   template syntax rather than attempting language-specific tokenization.
2. Tokenize using maximal `[a-z0-9]+` runs. Reject an exact token in this closed list:
   `annotation`, `annotations`, `banner`, `banners`, `callout`, `callouts`, `caption`, `captions`,
   `chart`, `charts`, `headline`, `headlines`, `label`, `labels`, `legend`, `legends`, `letter`,
   `letters`, `logo`, `logos`, `placard`, `placards`, `poster`, `posters`, `quote`, `quotes`,
   `readable`, `sign`, `signs`, `subtitle`, `subtitles`, `table`, `tables`, `text`, `title`, `titles`,
   `typography`, `watermark`, `watermarks`, `word`, `words`, `write`, `writing`, `written`.
3. Reject an adjacent token pair in this closed list: `speech bubble`, `thought bubble`, `page number`,
   `source note`, `hand written`, `hand lettering`, `text label`, `diagram label`, `axis label`.

The exact guard identifier, normalization algorithm, token list, pair list, and character grammar are
canonicalized into `text_guard_digest` and included in every selected-language projection. Human visual
review remains required because the guard prevents an instruction to draw text; it cannot prove that a
model will never hallucinate text. The Framed `no-readable-text` and `no-labels` constraints plus raw
visual review remain the separate output-quality controls.

## Selection And Compatibility

A slide selects exactly one recipe, exactly one composition, and zero to six motifs through its closed
`VISUAL BRIEF` mapping. The selection is valid only when all conditions hold:

1. The resolved page authority appears in every selected record's `authorities`.
2. The composition ID appears in the recipe's `composition_ids`.
3. Every motif appears in the recipe's `motif_ids`, contains the recipe in `recipe_ids`, and contains
   the composition in `composition_ids`.
4. The motif count lies inside the selected composition's inclusive range.
5. The selected identity subject class is in the recipe's `identity_subject_classes`. No selected
   identity resolves to `none`; a selected amber Agent role resolves to `amber-light-form` through the
   separate Image2 reference registry.
6. Framed selections carry `no-readable-text` and `no-labels`; Pure selections follow the
   authority-aware contradiction rules in the active protocol.

This is where visual richness lives. A new visual subject or narrative motif is a reviewed registry
change before any slide selects it; it is never inserted as free slide prose. The provider compiler
emits clauses in canonical order: recipe, composition, selected motifs in source order, authority facts,
canvas/reserved-frame facts, identity projection, and allowed Pure display fields. It emits no Framed
display field.

## Digest And Invalidation

The receipt records fixed schema, monotonic `revision`, and a canonical whole-registry file digest for
audit only. The registry module canonicalizes only selected records and their applicable compatibility
facts into the raw projection:

```text
visual_language_projection = {
  schema,
  text_guard_digest,
  registry_semantic_digest,
  recipe: { id, provider_clause_sha256 },
  composition: { id, provider_clause_sha256 },
  motifs: [{ id, provider_clause_sha256 }, ...],
  selected_identity_subject_class
}
```

Physical path, YAML comments, whitespace, mapping order, unselected records, and source spans are
excluded. `registry_semantic_digest` covers the selected record clauses and only their selected
compatibility/identity edges, never the whole file. A selected semantic registry change, selected-ID
change, identity-class compatibility change, selected-clause change, or text-guard change changes
`raw_image_contract_digest`. A revision-only or unselected-record change does not. The state/source
owner then advances the affected version's `source_epoch` in its existing source/structural transaction.
A provider model/output profile change instead changes
`raw_generation_profile_digest` and invalidates raw reuse/review without advancing `source_epoch`.

The final contract consumes raw image-contract and raw generation-profile digests, accepted raw
coverage, and, for Framed pages, the deterministic Text Frame and `framed-runtime` capability digest.

## Required Proof

- Parser tests reject non-closed YAML, dangling IDs, one-sided compatibility, every forbidden text-guard
  token/pair/character class, escapes, duplicate motifs, and a version override.
- Resolver tests prove valid selections compile only trusted registry bytes, never slide free prose or
  Framed visible text.
- Raw-contract tests prove semantic registry/reference changes invalidate exactly affected slides;
  whitespace/comment/span-only changes do not.
- Provider-bound integration tests show canonical payload order and no bypass through CLI
  prompt/style/output options.
- Visual review tests cover representative recipes, compositions, motifs, and Agent identity selections
  before a registry revision becomes current visual-system doctrine.
