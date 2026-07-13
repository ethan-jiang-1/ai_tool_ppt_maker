## ADDED Requirements

### Requirement: Lint library validates agent-authored MD files

The system SHALL provide `scripts/lib/lint_output.mjs` exporting `lintYaml`, `lintMarkdown`, `lintSlideSpecs`, `lintFile`, and `lintNodeProduces`. Each function SHALL return a `LintResult` object shaped as `{ ok: boolean, errors: LintIssue[], warnings: LintIssue[] }` where `LintIssue` is `{ rule: string, line?: number, col?: number, message: string }`. The library SHALL NOT lint JS pipeline outputs.

#### Scenario: Valid YAML passes lint

- **WHEN** `lintYaml("key: value\nlist:\n  - a\n  - b")` is called
- **THEN** the result has `ok: true` with empty errors and warnings arrays

#### Scenario: Invalid YAML fails lint

- **WHEN** `lintYaml("key: [unclosed")` is called
- **THEN** the result has `ok: false` and at least one error with rule `yaml-parse-error`

#### Scenario: Markdown with valid frontmatter passes lint

- **WHEN** `lintMarkdown("---\ntitle: Test\n---\n## Slide 1")` is called
- **THEN** the result has `ok: true`

#### Scenario: Markdown with unclosed frontmatter fails lint

- **WHEN** `lintMarkdown("---\ntitle: Test\n")` is called (no closing `---`)
- **THEN** the result has `ok: false` and at least one error with rule `frontmatter-unclosed`

### Requirement: lintFile auto-detects file type

`lintFile(filePath, opts?)` SHALL route `.md` files matching `slide-specifications.md` to `lintSlideSpecs`, other `.md` files to `lintMarkdown`, `.yaml`/`.yml` to `lintYaml`. Unknown extensions SHALL return `ok: true` with a warning.

#### Scenario: Slide specs file detected by path

- **WHEN** `lintFile("/path/to/slide-specifications.md")` is called
- **THEN** the function delegates to `lintSlideSpecs`

#### Scenario: Regular MD file uses lintMarkdown

- **WHEN** `lintFile("/path/to/core-metaphor.md")` is called
- **THEN** the function delegates to `lintMarkdown`

### Requirement: lintYaml validates YAML syntax

`lintYaml(content, filePath?)` SHALL parse content with `yaml.parseDocument()` using `strict: false`. Parse errors SHALL produce `ok: false` with rule `yaml-parse-error`.

#### Scenario: Tolerant parse accepts minor issues

- **WHEN** `lintYaml` processes YAML with duplicate keys (tolerant mode)
- **THEN** if the library produces a usable document, it returns `ok: true`

### Requirement: lintMarkdown validates frontmatter closure

`lintMarkdown(content, filePath?)` SHALL check that if the file starts with `---`, the frontmatter block is properly closed. It SHALL parse the frontmatter body as YAML via `lintYaml`. Unclosed frontmatter SHALL produce `ok: false` with rule `frontmatter-unclosed`.

#### Scenario: No frontmatter is fine

- **WHEN** `lintMarkdown("# Just a heading\n\nSome content")` is called
- **THEN** the result has `ok: true` (no frontmatter to validate)

### Requirement: lintSlideSpecs validates with context options

`lintSlideSpecs(content, filePath?, opts?)` SHALL validate for: placeholder residue (`{{...}}`), missing IMAGE PROMPT, missing TITLE, duplicate IDs. It SHALL accept `{ allowPlaceholders: boolean }` (default `false`). When `true`, placeholders are warnings; when `false`, placeholders are errors. It SHALL reuse `stage1_build_inputs.mjs` `validateSpecs()` logic.

#### Scenario: Placeholder is error when not allowed

- **WHEN** `lintSlideSpecs` processes `{{TOPIC}}` with `allowPlaceholders: false`
- **THEN** the result has `ok: false` with an error about unresolved placeholder

#### Scenario: Placeholder is warning when allowed

- **WHEN** `lintSlideSpecs` processes `{{TOPIC}}` with `allowPlaceholders: true`
- **THEN** the result has `ok: true` with a warning about placeholder

### Requirement: lintNodeProduces maps produces to files

`lintNodeProduces(runDir, nodeId, playbookDir)` SHALL read the node's `produces` list from the playbook declaration, map each ID to a file path via `PRODUCES_PATH_MAP`, and run the appropriate validator. Unmapped IDs (pure evidence or JS pipeline output) SHALL be skipped with `ok: true` and a warning note. It SHALL return `[{ file, ok, errors, warnings }]`.

#### Scenario: Mapped ID with context options

- **WHEN** `lintNodeProduces(runDir, "wave0", playbookDir)` is called
- **THEN** it resolves to `slide-specifications.md` with `lintSlideSpecs({ allowPlaceholders: true })`

#### Scenario: Unmapped ID skipped

- **WHEN** `lintNodeProduces` encounters `produces: [confirmed-intake]`
- **THEN** the result entry has `ok: true` with a warning

### Requirement: outputs_linted condition returns boolean

The `outputs_linted` condition in `CONDITIONS` SHALL call `lintNodeProduces(ctx.runDir, ctx.nodeId, ctx.playbookDir)` and return `true` only when ALL results have `ok: true`. It SHALL NOT return structured error data—the agent obtains that via `ppt_flow lint` CLI.

#### Scenario: All produces pass

- **WHEN** `outputs_linted` is evaluated and all files are valid
- **THEN** the condition returns `true`

#### Scenario: One produce fails

- **WHEN** `outputs_linted` is evaluated and one file has errors
- **THEN** the condition returns `false`

### Requirement: checkExit and checkEntry inject nodeId and playbookDir into ctx

`checkExit(nodeName, playbookDir, state, ctx)` and `checkEntry(nodeName, playbookDir, state, ctx)` SHALL inject `{ ...ctx, nodeId: nodeName, playbookDir }` before passing to conditions.

#### Scenario: nodeId and playbookDir reach condition

- **WHEN** `checkExit("wave0", playbookDir, state, { runDir })` is called
- **THEN** conditions receive `ctx.nodeId === "wave0"` and `ctx.playbookDir === playbookDir`

### Requirement: Strict and tolerant modes differ for schema-level issues only

Syntax errors (unparseable YAML, unclosed frontmatter) SHALL always produce `ok: false`. Schema deviations (missing keys, missing sections, placeholder residue when `allowPlaceholders: true`) SHALL produce `ok: true` + warnings in tolerant mode.

#### Scenario: Syntax error fails in tolerant mode

- **WHEN** `lintYaml` encounters unparseable content in tolerant mode
- **THEN** the result has `ok: false`

#### Scenario: Schema deviation is warning in tolerant mode

- **WHEN** a YAML frontmatter is missing an optional field in tolerant mode
- **THEN** the result has `ok: true` with a warning
