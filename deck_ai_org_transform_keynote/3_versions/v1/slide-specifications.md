---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
---

# Page Image current source

Before source validation or provider work, record exactly one version workflow under
`production`: `workflow: framed` when the local Text Frame owns title-like text, or
`workflow: pure` when readable body labels, values, dates, captions, or diagram text belong
to Image2. This is one decision for the entire version, never a per-slide choice.

Start each slide with a stable mnemonic slide ID such as `KeyGo`. Every slide supplies a
closed `VISUAL BRIEF` selection from the visual-language registry.
