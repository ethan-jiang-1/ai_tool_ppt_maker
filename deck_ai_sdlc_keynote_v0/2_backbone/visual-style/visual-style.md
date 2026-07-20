---
title: Visual Style v1 — Sketch/Etching on Warm Editorial
version: v1
direction: Sketch/Etching + Warm Editorial
status: draft
created: 2026-07-08
---

# Visual Style v1: Sketch/Etching on Warm Editorial

> 19 世纪科学插画的质感 + 高端杂志的排版。奶油纸、棕墨、琥珀点缀。核心表达媒介是素描/版画线条——可以是大图、可以是旁注小图、可以解构复杂概念。

---

## 1. Style Master Prompt

```
Design a visual style guide for a keynote slide deck. This is a reference image, not a slide itself.

The deck uses etching and sketch illustration as its primary visual language — like 19th-century scientific notebooks or Da Vinci's sketchbooks. Every slide image is built on this sketch aesthetic.

Show clearly:

- Color palette: 5 swatches with hex codes, labeled with their roles:
    Primary background (cream paper): #F5F0EB
    Panel / card surface: #EDE5DA
    Primary ink (text + sketch lines): #2D1B11
    Secondary ink (labels, annotations): #6B5B4F
    Accent (amber — like aged highlighter on old paper): #D97706

- Typography: headline sample (large, serif, brown ink), subtitle sample (medium, gray-brown), body text sample (small, readable), pull-quote sample (large, italic, with amber quotation marks) — clear size hierarchy.

- Layout grid: simple wireframe showing kicker zone (small caps label + thin amber line), title zone, main content zone (70% of height), and bottom callout bar.

- THREE SKETCH USAGE MODES (this is the most important part):

  MODE 1 — CENTERPIECE SKETCH: A large, detailed etching-illustration filling ~60% of the slide. Example: a classical building (representing SDLC) built on a cracked foundation stone, drawn in fine sepia ink lines with cross-hatched shadows. This is the main visual — the sketch IS the slide.

  MODE 2 — MARGINAL SKETCH: A small, quick sketch (8-10% of slide area) positioned beside a text block. Example: beside a pull-quote about AI agents, a tiny hand-drawn figure with autonomous motion lines. The sketch annotates the text like a margin note in an old book.

  MODE 3 — DIAGRAMMATIC SKETCH: Abstract concepts rendered as hand-drawn diagrams. Example: an information processing chain drawn as linked figures passing bundles along a line, with sketched arrows and hand-lettered labels. Not a polished vector diagram — a thinking sketch.

- Component examples (small but readable, all in sketch style):
    One KPI card: cream panel, oversized hand-drawn number in amber, small label below
    One comparison layout: two columns, left muted, right with amber accent border, sketch illustrations in each column
    One timeline: hand-drawn horizontal line with small amber ink dots at year markers, sketch labels

- Micro decoration examples (tiny sketch mnemonics for abstract AI concepts):
    Beside "AI Agent" — a tiny sketch of an autonomous figure with motion lines
    Beside "Information Chain (ITO)" — tiny linked figures passing bundles
    Beside "Harness Engineering" — tiny guardrails with cross-hatched texture
    Beside "Framed Autonomy" — a tiny geometric frame with a figure moving freely inside
    Beside "Organizational Pyramid" — tiny stacked figures forming a triangle
    Each mnemonic is no larger than 8% of slide area — positioned in margins beside text.
    Same sketch aesthetic — sepia ink, hand-drawn lines, cross-hatched shadows.

Overall style: warm, human, intellectual. Like opening a 19th-century naturalist's field notebook — cream paper, brown ink sketches, amber highlights. The sketch lines are visible, slightly irregular, with cross-hatching for depth. Not cold vector graphics — warm hand-drawn marks on paper.
Typography is serif and authoritative — Georgia or similar — title dominates.
This is a strategic keynote about AI disrupting information work, for executives — not a tech product demo, not a corporate quarterly review.

No real company logo, no watermark, no page number, no draft label. No photograph. No 3D render. No neon. No blue tones. No clip art. No smooth vector icons.
Canvas: 16:9, 2K resolution.
```

---

## 2. Color System — Sepia Sketch on Cream Paper

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| **Background** | Cream Paper | `#F5F0EB` | Every slide background — like aged sketchbook paper |
| **Panel/Card** | Warm Panel | `#EDE5DA` | Content cards, quote boxes, KPI containers |
| **Primary Ink** | Sepia Ink | `#2D1B11` | Body text, sketch lines, titles — warm brown-black |
| **Secondary Ink** | Faded Ink | `#6B5B4F` | Labels, annotations, page markers, sketch shading |
| **Accent** | Amber Wash | `#D97706` | KICKER underline, key numbers, emphasis, callout bars |

### Color Philosophy

This is a single-family earth-tone palette. Every color is a variation on "ink and paper." Cream Paper → Warm Panel is depth within the same surface. Sepia Ink → Faded Ink is two intensities of the same mark-making tool. Amber Wash is the only outsider — like an aged highlighter or a wash of color on a sketch — and is used sparingly. No blue. No green. No neon. The colors should feel like they belong on a 19th-century draftsman's desk.

### Color Roles in Narrative

- **Cream Paper + Sepia Ink** — neutral ground + primary voice. Always present.
- **Warm Panel** — container for evidence, quotes, data. "This is worth isolating."
- **Amber Wash** — attention signal. "This matters." Used on KICKER lines, key numbers, callout bars. Sparingly — max 2-3 amber elements per slide.
- **Faded Ink** — supporting voice. Labels, sources, annotations. "This is context, not main argument."

---

## 3. Typography Scale

| Level | Size (relative) | Weight | Color | Usage |
|-------|----------------|--------|-------|-------|
| **Kicker** | XS, all caps | Medium | Faded Ink | Section label above title |
| **Title** | XL | Bold | Sepia Ink | Slide's single claim — serif, dominant |
| **Body** | S–M | Regular | Sepia Ink | Supporting text, max 3-4 lines per zone |
| **KPI Number** | XXL | ExtraBold | Amber Wash | Dominant metric — 3-4x body size |
| **Callout** | S | Medium | Sepia Ink on Amber | Bottom insight sentence |
| **Label** | XS | Regular | Faded Ink | Sketch annotations, node labels |

### Typography Rules

- Title must be serif (Georgia / Noto Serif CJK SC) — matches the sketchbook/editorial feel
- KPI numbers should feel 3-4x larger than body text
- Most slides stay under 40 words (excluding sketch labels)
- Body text never in paragraphs — only short blocks, cards, or labels
- KICKER always followed by a thin amber horizontal line (1px, 40-60px wide)

---

## 4. Layout Grid — Three Modes

### Mode A: Full-Width Sketch Statement
```
┌─────────────────────────────────────────┐
│ KICKER                            ▐     │
│ Title (serif, large)                    │
├─────────────────────────────────────────┤
│                                         │
│   CENTERPIECE SKETCH                    │
│   (detailed etching, ~60% of slide)     │
│                                         │
├─────────────────────────────────────────┤
│ Bottom callout (amber bar)              │
└─────────────────────────────────────────┘
```
Used for: opening, section dividers, key claims, closing.

### Mode B: Sketch Beside Text
```
┌──────────────────┬──────────────────────┐
│ KICKER           │                      │
│ Title (full width)                      │
├────────┬─────────┤   MARGINAL SKETCH    │
│ Text   │ Data    │   (8-10% of slide,   │
│ block  │ point   │   annotating the     │
│        │         │   text like a margin │
│ Pull   │ KPI     │   note)              │
│ quote  │ card    │                      │
├────────┴─────────┴──────────────────────┤
│ Bottom callout                          │
└─────────────────────────────────────────┘
```
Used for: evidence slides, data + concept, case studies.

### Mode C: Diagrammatic Sketch Framework
```
┌─────────────────────────────────────────┐
│ KICKER                                  │
│ Title: Framework claim                  │
├─────────────────────────────────────────┤
│                                         │
│  [Sketch Node A] ──→ [Sketch Node B]    │
│     ↓                     ↓             │
│  [hand-lettered]     [hand-lettered]    │
│                                         │
├─────────────────────────────────────────┤
│ Bottom callout                          │
└─────────────────────────────────────────┘
```
Used for: process flows, ITO chains, before/after, frameworks.

**Distribution target**: 30% Mode A, 35% Mode B, 35% Mode C.

---

## 5. Micro Decoration System — AI Concept Sketch Mnemonics

### Design Rules

- **Size**: Never larger than 8-10% of slide area. Decorations, not main visuals.
- **Position**: In margins, beside or below the relevant term. Never center-stage.
- **Style**: Sepia ink sketch lines, cross-hatched shadows, slightly irregular hand-drawn feel. Not clip art. Not vector icons.
- **Consistency**: Same concept = same sketch symbol across all slides. Builds visual vocabulary.
- **Behavior**: If concept IS the slide claim, use BOTH a marginal mnemonic AND a Mode A centerpiece sketch.

### Concept → Sketch Mnemonic Map

| Concept | Sketch Mnemonic | Description |
|---------|----------------|-------------|
| **AI Agent** | Autonomous Figure | Small humanoid with radiating motion lines, suggesting independent action |
| **Information Chain (ITO)** | Linked Figures | Three figures in a row, each passing a bundle to the next |
| **SDLC** | Classical Building | A temple-like structure on a foundation stone, now cracked |
| **BPM** | Mirror Building | Same structure as SDLC, mirrored — identical but facing the other way |
| **Framed Autonomy** | Geometric Frame | A hand-drawn rectangle, small figure moving freely inside, larger figure adjusting frame edge |
| **Harness Engineering** | Guardrails | Parallel lines with cross-hatched texture, like fencing or rails |
| **Human-in-the-loop** | Inspector Figure | Small figure at each station, magnifying glass over output |
| **Human-on-the-loop** | Control Panel Figure | Single figure elevated, viewing multiple stations from above |
| **Organizational Pyramid** | Stacked Figures | Small figures arranged in triangle formation, each layer holding the one above |
| **Communication Bottleneck** | Narrow Passage | Wide channel constricting to a thin neck, figures crowding at the narrow point |
| **Trust Gap** | Broken Bridge | Two sides of a bridge not meeting, gap in the middle, figure hesitating at edge |
| **AI Glow / Intelligence** | Radiating Core | Small circle with radial etched lines emanating outward — like a candle's glow in ink |

---

## 6. Slide Type Templates

### TYPE: Title / Section Divider
```
Design a finished 16:9 keynote slide image in sketch/etching style.
Use the reference style master exactly — cream paper background, sepia ink, amber accents.
Kicker: [LABEL]
Title: [main title in large serif]

Main visual: [one centerpiece etching — describe the sketch].
Composition: title dominant at top, sketch fills lower 60%.
Sketch style: sepia ink lines, cross-hatched shadows, slightly irregular hand-drawn feel.

No logos, watermarks, page numbers, source notes, draft labels.
No photography. No 3D renders. No vector icons. No blue tones.
```

### TYPE: Evidence / Case Study
```
Design a finished 16:9 keynote slide image in sketch/etching style.
Use the reference style master exactly.
Kicker: [KICKER]
Title: [claim]

Layout: Mode B — text/data left, marginal sketch right.
Left: [data points — KPI cards, pull quotes, or short text blocks]
Right: [one small marginal sketch annotating the key concept — 8-10% of slide]
Bottom callout bar (amber): [insight sentence]

No logos, watermarks, page numbers. No photography. No blue.
```

### TYPE: Framework / Flow
```
Design a finished 16:9 keynote slide image in sketch/etching style.
Use the reference style master exactly.
Kicker: [KICKER]
Title: [framework claim]

Layout: Mode C — diagrammatic sketch of [concept].
[Nodes/arrows/flow drawn as hand-drawn sketches with sepia ink lines and hand-lettered labels]
Bottom callout bar (amber): [integrated message]

No logos, watermarks, page numbers. No photography. No vector diagrams — sketch feel.
```

### TYPE: Closer
```
Design a finished 16:9 keynote slide image in sketch/etching style.
Use the reference style master exactly.
Near-black warm brown background (the dark side of sepia).
Center: one line of text, then a second, then a third — the final question — slightly glowing warm amber.
Like the final frame of a film, just before the screen goes black.
No sketch. Just text in darkness. Serif. Minimal.

No logos, watermarks, page numbers.
```

---

## 7. Deck-Wide Constraints (`deck_system.txt`)

```
LANGUAGE: Chinese with English key terms. KICKER in English all-caps.
DECK TYPE: Strategic keynote about AI disrupting information work. Sketch/etching visual language.
BACKGROUND: Cream paper #F5F0EB on every slide. Exception: closer slide uses near-black warm brown.
COLOR FAMILY: Earth tones only — cream, sepia brown, warm gray-brown, amber. FORBIDDEN: blue, green, neon, purple, pure black, pure white, cool grays.
TEXT DENSITY: Most slides under 35 readable words (excluding sketch labels). Never paragraphs on slide images — only short blocks, cards, or labels.
FORBIDDEN: Photography, 3D renders, vector clip art, smooth digital icons, stock photos of people, corporate logos, watermarks, page numbers, source notes, draft labels, glowing orbs, gradient backgrounds, circuit board imagery, robot imagery, brain icons.
TONE: Warm, intellectual, human. Like a 19th-century naturalist's notebook — not a tech product launch. Confident but curious. The sketch style signals "thinking in progress," not "finished answers."
SKETCH QUALITY: Visible hand-drawn lines. Slight irregularity. Cross-hatched shadows. Sepia ink on cream paper. Sketches should feel like they were drawn by a skilled illustrator, not a child. Not messy — deliberate. Fine lines, careful composition.
CONSISTENCY: Every slide must feel like a page from the same sketchbook. Same paper, same ink, same hand.
```
