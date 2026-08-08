---
stage: workflow/02-visual-system
---

# Why Page Image Is Explicit

Every version needs a clear final-pixel workflow. Target Page Image records
it once in source: `pure` assigns every final pixel to the Provider, while
`framed` assigns provider-rendered body pixels to the Provider and reserves only
the transparent kicker/title/subtitle overlay for local rendering. Every target
slide inherits that choice.

The visual-language registry keeps recipes, compositions, motifs, identities, and
negative constraints reviewable. This makes invalidation explicit: only a
compiled-input-preserving header-overlay change can remain local, while source,
visual brief, or reference changes renew raw evidence.
