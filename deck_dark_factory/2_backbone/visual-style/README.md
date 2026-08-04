# 视觉主干

**这里放什么:**
- `page-authority-visual-language.yaml` — current recipe, composition, motif, and frame inputs
- `style-master-prompt.md` — Style Master intent input; `style_master.jpg` — derived compatibility JPEG after acceptance
- `assets/asset-manifest.yaml` — verified local references

**权威:** 当前 version/workflow 的 accepted selection 在 `_state/state.yaml`; `style_master.jpg` 只按 override-first/backbone-default 路径投影，不能单独通过 raw gate。

**你做什么:** 改 intent/registry/资产或 selected bytes 后，先回到 Style Master，再走受影响范围的 Generated Image Rebuild。
