---
stage: workflow/02-visual-system
depends_on:
  - workflow/02-visual-system/02-design-the-visual-system.md
feeds_into:
  - workflow/02-visual-system/04-validate-the-html-system.md
---

# Configure Visual Tokens

Record the renderer-neutral system in `color_palette.json`: palette references, bundled typography roles, spacing, component recipes, image language, and the fixed geometry registry. Use `template-color-palette.json` or one of the checked-in presets as a valid starting point and edit the human-owned source, not a generated theme file.

The HTML renderer consumes the validated `html_first` projection. A style master is not a prerequisite for a new deck. Optional Image2 visual-slot refinement is considered only after current HTML delivery and exact cost authorization; explicit whole-page historical decks use `playbook/create-deck.md`.

Run `ppt_flow validate <run-dir>` and local preview to inspect real output before visual approval.
