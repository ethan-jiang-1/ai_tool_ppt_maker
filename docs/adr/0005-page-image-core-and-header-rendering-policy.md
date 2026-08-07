# Unify Page Image Core And Header Rendering Policy

Status: Proposed

Pure and Framed share one Page Image Core: the provider composes a full-canvas
page and renders its provider-rendered content. `framed` remains a version-level
Header Rendering Policy in which a transparent deterministic local overlay
renders only kicker, title, and subtitle; `pure` has the provider render those
fields too. `hybrid` describes the Framed composition and is not a third
workflow.

The Page Image Workflow is the value-bearing compiler for these policies: Pure
produces one full-page provider input, while Framed coordinates a local
header-renderer input with a provider page input. The Framed provider input
contains the exact header literals as context not to render, so a literal change
normally requires a new page image rather than an overlay-only refresh.

The incorrect text-free Framed model is removed from the active Harness rather
than preserved, converted, or treated as a compatibility input. Canonical source
retains authority over claims, data, and exact required copy; provider rendering
does not grant semantic authorship. Provider-rendered content is declared through
a closed structured source model, not free-form BODY prose; the later OpenSpec
design will define its exact vocabulary and validation rules. The selected Page
Image Workflow uses Image2 knowledge to compile that source into provider input
and composition constraints, but it cannot invent or silently rewrite source-owned
meaning or required copy. Source may explicitly mark non-factual supporting copy
as Presentation-Adaptable Copy, allowing the workflow to use Image2's integrated
text-and-visual composition ability without delegating claims, facts, numbers,
names, labels, headers, or unmarked text.

Complete Page Review makes one proceed-or-repair decision without adding a
composite gate: Framed presents its provider raw page beside the
production-equivalent local-header composite, while Pure presents its complete
provider page. Final delivery review remains a separate check of delivery
artifacts and presentation quality.
