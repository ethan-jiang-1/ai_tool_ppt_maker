# Unify Page Image Core And Header Rendering Policy

Status: Proposed

Pure and Framed share one Page Image Core: the provider composes a full-canvas
page and renders its provider-rendered content. `framed` remains a version-level
Header Rendering Policy in which a transparent deterministic local overlay
renders only kicker, title, and subtitle; `pure` has the provider render those
fields too. `hybrid` describes the Framed composition and is not a third
workflow.

The incorrect text-free Framed model is removed from the active Harness rather
than preserved, converted, or treated as a compatibility input. Canonical source
retains authority over claims, data, and exact required copy; provider rendering
does not grant semantic authorship.
