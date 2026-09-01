# Known Limitations & Rejected Paths

## 3D Models and Chart Animations

PPTxgenjs does not support 3D models, chart animations, or embedded video.
These are limitations of the underlying library, not deliberate design choices.

## Font Embedding

Font embedding requires a LibreOffice-based conversion pipeline. The current
pipeline does not include this step, and there are no immediate plans to add it.
PPTX files created by this system use standard fonts available on the
presenter's system.

## Puppeteer-Based Rendering (Rejected)

**What was considered**: Using Puppeteer/Chromium to render slides as images.
**Why rejected**: Adding Chromium as a dependency (~300 MB) would make the
toolchain significantly heavier. The existing `@napi-rs/canvas`-based rendering
is sufficient for all current page-image workflows (Framed and Pure). If
`@napi-rs/canvas` becomes a blocking limitation, Puppeteer will be reconsidered
with a clear cost-benefit analysis.

## JSON Schema for Design Rules (Rejected)

**What was considered**: Encoding design rules (layout constraints, typography,
color system) as JSON Schema for programmatic validation.
**Why rejected**: The Controller-based prose guidance system is more flexible
for the kinds of creative/design decisions this system handles. Design is a
conversation, not a validation pass. The production data pipeline (stages,
receipts) continues to use YAML schemas — this rejection is specifically about
design-rule governance, not production data contracts.

## Bash-Based Production Pipelines (Rejected)

**What was considered**: Using `.sh` scripts or POSIX-only commands as the
production pipeline runtime.
**Why rejected**: This is a charter-level constraint. All Harness
production code runs on Node.js ESM. Shell code blocks in documentation are
only command examples for human or Agent invocation, never `.sh` executables
in the production path.

## Intent Route Catalog (Superseded by MD Controllers)

**What was considered**: A separate versioned Intent Route Catalog alongside
the Controller manifest, for novice-oriented discovery.
**Why rejected/superseded**: The catalog was implemented and later retired.
MD Controllers + Controller manifest + Diagnostic Recovery Handoff now own
routing. See `docs/adr/0001-intent-route-catalog.md` for the full history.