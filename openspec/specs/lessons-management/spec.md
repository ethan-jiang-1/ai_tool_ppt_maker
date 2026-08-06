## Purpose

Provide the CLI operational surface at `scripts/shared/run-bundle/lessons.mjs` for the `_lessons/` self-retained lessons mechanism in run bundles.

## Requirements

### Requirement: Lessons remain bundle-local rather than global memory

The Harness-supplied lessons operations SHALL resolve one exact current Bundle
through the Run Bundle layout authority. They SHALL not create a global lesson
store, cross-session memory, or portable binding behavior.

#### Scenario: Agent checks lessons for one exact Bundle

- **WHEN** an Agent invokes the Harness lessons CLI for an exact run directory
- **THEN** it reads only that Bundle's `_lessons/` location through the layout
  authority
- **AND** it does not read or write lesson data outside that Bundle

### Requirement: lessons.mjs CLI lists lessons in a run bundle

`ppt_maker_harness/scripts/shared/run-bundle/lessons.mjs` SHALL provide a `list` subcommand that, given a run directory path, resolves the deck root, reads all files in `_lessons/` (excluding `README.md`), and prints a human-readable listing with one line per lesson file showing the filename and a brief summary extracted from the first heading or frontmatter.

The tool SHALL:
- Accept a run directory (e.g., `deck_*/3_versions/v1`) as its argument
- Resolve the deck root via `deckRoot()` from `bundle_layout.mjs`
- Read `deck_*/_lessons/` and list all `.md` and `.yaml` files (excluding `README.md`)
- For `.md` files: extract the first `# ` heading as the summary; if no heading exists, use the filename as the summary
- For `.yaml` files: extract the first `# ` comment line as the summary; if no comment exists, use the filename as the summary
- Print a count at the end (e.g., "2 lessons")
- Exit 0 even if `_lessons/` is empty or absent (just report "0 lessons")
- Have zero external dependencies (Node.js built-ins only)
- Support `--json` flag to output machine-readable JSON array with `{file, summary}` objects

#### Scenario: List lessons in a deck with lessons

- **WHEN** Agent runs `lessons.mjs list <runDir>` on a deck whose `_lessons/` contains `vendor-reliability.md` and `image2-proven.yaml`
- **THEN** output includes each filename with its heading or frontmatter summary
- **AND** the final line reports the correct count

#### Scenario: List lessons in a deck without lessons

- **WHEN** Agent runs `lessons.mjs list <runDir>` on a deck with no `_lessons/` directory or an empty one
- **THEN** output reports "0 lessons"
- **AND** exit code is 0

#### Scenario: List lessons with JSON output

- **WHEN** Agent runs `lessons.mjs list <runDir> --json`
- **THEN** stdout is a JSON array of `{file, summary}` objects
- **AND** exit code is 0

### Requirement: lessons.mjs CLI adds new lessons from a template

`lessons.mjs` SHALL provide an `add` subcommand that scaffolds a new lesson file under `deck_*/_lessons/` using the 4-question template (遇到什么？/ 怎么试的？/ 结论是什么？/ 下次先看哪？) as defined in `LESSONS_DIR_README`.

The tool SHALL:
- Accept a positional `<runDir>` argument (consistent with `list`, `check`, `search`)
- Accept `--title <slug>` for the kebab-case filename (required)
- Create `deck_*/_lessons/<title>.md` with the 4-question template pre-filled
- Refuse to overwrite an existing file (exit non-zero with a clear message)
- Print the created file path on success
- Create the `_lessons/` directory if it does not exist

#### Scenario: Add a new lesson

- **WHEN** Agent runs `lessons.mjs add <runDir> --title "font-rendering-fix"`
- **THEN** `deck_*/_lessons/font-rendering-fix.md` is created
- **AND** the file contains the 4-question template with the title pre-filled
- **AND** output includes the created file path

#### Scenario: Add creates _lessons/ directory when absent

- **WHEN** Agent runs `lessons.mjs add <runDir> --title "first-lesson"` on a deck that has no `_lessons/` directory
- **THEN** the `_lessons/` directory is created
- **AND** the lesson file is created inside it
- **AND** exit code is 0

#### Scenario: Refuse to overwrite existing lesson

- **WHEN** Agent runs `lessons.mjs add` with a title that already exists as a file
- **THEN** exit code is non-zero
- **AND** stderr message indicates the file already exists

#### Scenario: Add fails when title is missing

- **WHEN** Agent runs `lessons.mjs add <runDir>` without `--title`
- **THEN** exit code is non-zero
- **AND** stderr message indicates `--title` is required

### Requirement: lessons.mjs CLI checks for unread lessons

`lessons.mjs` SHALL provide a `check` subcommand that prints a reminder to read existing lessons, suitable for piping into the agent's context at session start.

The tool SHALL:
- Print a prominent reminder message when lessons exist: one filename per line with a header line stating the lesson count, followed by an instruction to read them before proceeding
- Print a brief confirmation when no lessons exist: "No lessons yet — nothing to review."
- Exit 0 in both cases

#### Scenario: Check with existing lessons

- **WHEN** Agent runs `lessons.mjs check <runDir>` on a deck with 2 lessons
- **THEN** output lists both lesson filenames
- **AND** output urges reading them before proceeding
- **AND** exit code is 0

#### Scenario: Check with no lessons

- **WHEN** Agent runs `lessons.mjs check <runDir>` on a deck with no lessons
- **THEN** output confirms nothing to review
- **AND** exit code is 0

### Requirement: lessons.mjs CLI searches lessons by keyword

`lessons.mjs` SHALL provide a `search` subcommand that greps all lesson files for a keyword and prints matching filenames with the matching line content.

The tool SHALL:
- Accept a positional `<runDir>` and a `<keyword>` argument
- Perform case-insensitive search across all lesson files
- Print filename and the matching line for each hit
- Exit 0 if no matches found (report "no matches")

#### Scenario: Search finds matching lessons

- **WHEN** Agent runs `lessons.mjs search <runDir> "vendor"`
- **THEN** output includes the filename of any lesson containing "vendor" with the matching line
- **AND** exit code is 0

#### Scenario: Search finds no matches

- **WHEN** Agent runs `lessons.mjs search <runDir> "nonexistent"`
- **THEN** output reports "no matches"
- **AND** exit code is 0

#### Scenario: Search fails when keyword is missing

- **WHEN** Agent runs `lessons.mjs search <runDir>` without a keyword argument
- **THEN** exit code is non-zero
- **AND** stderr message indicates a search keyword is required

### Requirement: lessons.mjs integrates with bundle_layout path constants

`lessons.mjs` SHALL import `deckRoot`, `LESSONS_DIR` from `bundle_layout.mjs` and SHALL NOT hardcode any run-bundle paths. Lesson file discovery SHALL resolve `deckRoot(runDir)` then join with `LESSONS_DIR`, consistent with how other Harness scripts resolve bundle paths.

#### Scenario: Path resolution follows bundle_layout SSOT

- **WHEN** `lessons.mjs` resolves a run directory
- **THEN** it uses `deckRoot()` and `LESSONS_DIR` from `bundle_layout.mjs`
- **AND** does not hardcode `_lessons` or `deck_` strings for path computation
