# 视觉主干

**这里放什么:**
- `page-image-visual-language.yaml` — current recipe, composition, motif, and frame inputs
- `page-design-system.md` — optional shared Page Image provider design guidance for both Pure and Framed; a version may override it only at `overrides/visual-style/page-design-system.md`
- `image2-provider-profile.yaml` — Deck Author confirmed non-secret Image2 route capability; a version may override it only at `overrides/visual-style/image2-provider-profile.yaml`
- `page-image-presentation/` — Page Class catalog, deck defaults, Pure profiles, and Framed header profiles; version overrides use the matching `overrides/visual-style/page-image-presentation/` path
- `style-master-prompt.md` — Style Master intent input; `style_master.png` — optional local Style Master PNG source
- `assets/asset-manifest.yaml` — verified local references

**权威:** 当前 version/workflow 的 accepted selection 在 `_state/state.yaml`; `style_master.png` 只按 override-first/backbone-default 路径作为本地候选源，不能单独通过 raw gate。

**你做什么:** 改 intent/registry/资产或 selected bytes 后，先回到 Style Master，再走受影响范围的 Generated Image Rebuild。
