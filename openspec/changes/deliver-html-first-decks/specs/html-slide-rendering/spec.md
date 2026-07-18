## ADDED Requirements

### Requirement: Valid structured slides produce inert self-contained HTML pages

The renderer SHALL consume only a validated `pptmaker-html-slide-plan-v1` and its verified receipts. For each slide it SHALL produce one UTF-8 HTML document containing the exact resolved family geometry/theme/content, only page-used bundled font files, validated local catalog assets, and renderer-owned chart/pattern/icon output. The document SHALL contain no external stylesheet/script/font/image/iframe, no service worker, no executable author-authored HTML/CSS/JavaScript, and no HTTP/HTTPS/protocol-relative/file URL. Markdown/YAML parsing, family choice, asset catalog resolution, and source mutation SHALL remain outside the renderer.

#### Scenario: Page is complete without a server

- **WHEN** a valid HTML-first plan slide is prepared
- **THEN** the emitted HTML contains every dependency needed for local rendering
- **AND** opening it requires no network, provider, style master, or source re-interpretation

#### Scenario: Source prose cannot inject markup

- **WHEN** a visible source string contains HTML-significant characters
- **THEN** the renderer emits them as escaped text
- **AND** they cannot create an element, style, script, URL, or event handler

### Requirement: Ten family components obey the resolved geometry and token contract

One closed component registry SHALL render `hero`, `split`, `cards`, `kpi`, `comparison`, `flow`, `timeline`, `data`, `quote`, and `visual-focus`. Components SHALL place every visible record in the named boxes from the resolved immutable geometry variant, preserve source/item order, use only the plan's closed typography/spacing/component tokens, and materialize resolved fallback/selection evidence without moving or resizing family-level boxes. Every one of the 68 registry variants SHALL resolve exactly one component output.

#### Scenario: Geometry variant is rendered without inference

- **WHEN** a plan contains `split--text-visual-right--callout1`
- **THEN** the component uses the plan's named text, visual, header, and callout boxes exactly
- **AND** it does not recompute a different split or choose another placement

#### Scenario: Registry and component coverage drift

- **WHEN** a valid geometry variant has no component mapping or a component emits an undeclared visible box
- **THEN** renderer coherence validation fails before browser launch

### Requirement: Data charts use a closed deterministic ECharts SVG adapter

Data-family charts SHALL be converted from the structured chart record and resolved chart tokens through exact direct dependency `echarts@6.1.0` using Node-side SSR SVG rendering with animation disabled. The adapter SHALL own a closed option mapping for `bar|line|area`, exact formatter output, series/categories/legend, colors, axes, grid, and plot padding; source SHALL NOT supply ECharts options. The resulting SVG SHALL be checked for a bounded renderer-owned passive vocabulary, local-only references, declared dimensions, and absence of script, CSS imports, animation, external/data resources, or event behavior before being embedded. ECharts JavaScript SHALL NOT execute in the page browser.

#### Scenario: Chart renders with no browser script

- **WHEN** a valid data slide is prepared
- **THEN** the HTML contains a deterministic inline SVG chart
- **AND** contains no ECharts runtime script or remote resource

#### Scenario: Adapter output violates the closed subset

- **WHEN** generated SVG contains a forbidden active or external construct
- **THEN** page preparation fails with renderer/version evidence
- **AND** the browser is not asked to interpret the construct

### Requirement: Browser composition uses the pinned runtime and zero-network policy

Composition SHALL reuse the verified `html-render-runtime` Playwright installation and paired Chromium, reject channel/executable overrides, block service workers, abort and record every HTTP/HTTPS request, and use only local/data page bytes. It SHALL render pages sequentially in one bounded deck context, close every page/context/browser in `finally`, and enforce a 30-second per-slide timeout with normalized last-phase evidence. It SHALL NOT install/download a browser or initialize Image2/provider configuration.

#### Scenario: Page attempts a network request

- **WHEN** any page resource or runtime code requests HTTP or HTTPS
- **THEN** the request is aborted and composition fails
- **AND** no final-slide manifest entry is published

#### Scenario: Browser work stalls

- **WHEN** launch, load, fonts, measurement, or screenshot exceeds the page timeout
- **THEN** composition reports the last normalized phase
- **AND** closes created browser resources

### Requirement: Browser measurement proves fonts, bounds, and overflow before capture

Before screenshot, the renderer SHALL wait for local fonts, use CDP platform-font evidence to prove non-zero custom-font glyph use for every rendered family/weight role, and inspect renderer-owned DOM markers for root/slot scroll overflow, text line boxes, chart/image bounds, family geometry, and allowed overlays. No visible box or text rect may escape its owned geometry beyond the checked-in tolerance; single-line and explicit-line contracts SHALL remain satisfied after browser layout. Failure is diagnostic-only and SHALL publish neither a current HTML-page entry nor a final-slide entry.

#### Scenario: Source capacity passed but pixels overflow

- **WHEN** a valid structured slide produces browser text outside its owned slot
- **THEN** composition fails with slide ID, field path, box, measured overflow, and remediation boundary
- **AND** it does not shrink text or truncate content automatically

#### Scenario: Browser falls back to a system font

- **WHEN** visible glyphs do not use the expected bundled custom font
- **THEN** composition fails despite `document.fonts.ready`
- **AND** no screenshot is accepted as verified

### Requirement: Final-slide screenshot profile and evidence are versioned

The v1 screenshot profile SHALL capture the exact logical canvas `1000 x 562.5` at device scale factor 2 into a `2000 x 1125` non-animated PNG. Apply SHALL prove the paired Chromium fractional clip behavior before enabling production; a mismatch SHALL require a spec/profile revision rather than runtime rounding. A verified final-slide entry SHALL bind slide ID, composition fingerprint, HTML SHA-256, PNG path/SHA-256/dimensions, runtime/screenshot/renderer/compositor/component/chart/recipe versions, normalized measurement/font/network evidence, and exact input receipts.

#### Scenario: Exact profile renders

- **WHEN** a valid page passes measurement under the pinned runtime
- **THEN** the output is one 2000 x 1125 PNG with current manifest evidence
- **AND** the entry binds the HTML and all rendering-version inputs

#### Scenario: Screenshot dimensions drift

- **WHEN** captured PNG dimensions differ from the profile
- **THEN** the slide fails verification
- **AND** Stage 4 cannot consume the bytes

### Requirement: Composition fingerprints are slide-local and delivery digest is ordered

`composition_fingerprint_v1` SHALL hash the renderer/compositor/component/chart/recipe versions, pinned runtime profile, complete renderer-consumed slide projection, resolved theme/geometry/visual resolution, and referenced asset/font SHAs while excluding physical position, source locators, timestamps, notes, and unreferenced catalog entries. `html_delivery_digest_v1` SHALL hash the Stage-1 ordered plan digest plus ordered slide IDs and their current composition fingerprints/final-slide SHAs. Reorder SHALL preserve per-slide composition fingerprints and bytes but change the delivery digest.

#### Scenario: Pure reorder reuses slide pixels

- **WHEN** unchanged slides are reordered
- **THEN** their composition fingerprints and final PNG SHAs remain current
- **AND** the delivery digest/contact sheet/PPTX order changes

#### Scenario: One fallback asset changes

- **WHEN** a referenced fallback asset byte changes through a valid source transaction
- **THEN** only consuming slides' composition fingerprints become stale
- **AND** unreferenced slides remain reusable

### Requirement: HTML and final-slide publication is atomic and drift-safe

HTML pages and final slides SHALL publish through separate hidden transaction directories under `_generated/html_production/`. Each transaction SHALL recheck every byte receipt and lexical/realpath confinement proof immediately before atomic replacement of its owned current manifest/file set. Failure, timeout, input drift, or interruption SHALL preserve the prior current set and SHALL not expose a mixed manifest. Successful replacement SHALL remove only unreferenced prior files owned by that manifest.

#### Scenario: Input drifts before final rename

- **WHEN** plan, config, geometry, font, manifest, or referenced asset bytes change after preparation
- **THEN** publication aborts and preserves the prior HTML/final-slide set
- **AND** the next action is a clean local rerun

#### Scenario: First render fails

- **WHEN** `_generated/html_production/` did not exist and rendering fails
- **THEN** no current manifest or partially named page/final-slide file is published
