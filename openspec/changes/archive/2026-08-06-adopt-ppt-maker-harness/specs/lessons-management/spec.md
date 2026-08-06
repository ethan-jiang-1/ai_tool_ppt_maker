## MODIFIED Requirements

### Requirement: lessons.mjs CLI lists lessons in a run bundle

`ppt_maker_harness/scripts/shared/run-bundle/lessons.mjs` SHALL provide a
`list` subcommand that, given a run directory path, resolves the deck root,
reads all files in `_lessons/` (excluding `README.md`), and prints a
human-readable listing with one line per lesson file showing the filename and a
brief summary extracted from the first heading or frontmatter.

The tool SHALL:

- Accept a run directory (e.g., `deck_*/3_versions/v1`) as its argument
- Resolve the deck root via `deckRoot()` from `bundle_layout.mjs`
- Read `deck_*/_lessons/` and list all `.md` and `.yaml` files (excluding
  `README.md`)
- For `.md` files: extract the first `# ` heading as the summary; if no heading
  exists, use the filename as the summary
- For `.yaml` files: extract the first `# ` comment line as the summary; if no
  comment exists, use the filename as the summary
- Print a count at the end (e.g., "2 lessons")
- Exit 0 even if `_lessons/` is empty or absent (just report "0 lessons")
- Have zero external dependencies (Node.js built-ins only)
- Support `--json` flag to output machine-readable JSON array with
  `{file, summary}` objects

#### Scenario: List lessons in a deck with lessons

- **WHEN** Agent runs `lessons.mjs list <runDir>` on a deck whose `_lessons/`
  contains `vendor-reliability.md` and `image2-proven.yaml`
- **THEN** output includes each filename with its heading or frontmatter summary
- **AND** the final line reports the correct count

#### Scenario: List lessons in a deck without lessons

- **WHEN** Agent runs `lessons.mjs list <runDir>` on a deck with no `_lessons/`
  directory or an empty one
- **THEN** output reports "0 lessons"
- **AND** exit code is 0

#### Scenario: List lessons with JSON output

- **WHEN** Agent runs `lessons.mjs list <runDir> --json`
- **THEN** stdout is a JSON array of `{file, summary}` objects
- **AND** exit code is 0

## ADDED Requirements

### Requirement: Lessons remain bundle-local rather than global memory

The Harness-supplied lessons operations SHALL resolve one exact current Bundle
through the Run Bundle layout authority. They SHALL not create a global lesson
store, cross-session memory, or portable binding behavior.

#### Scenario: Agent checks lessons for one exact Bundle

- **WHEN** an Agent invokes the Harness lessons CLI for an exact run directory
- **THEN** it reads only that Bundle's `_lessons/` location through the layout
  authority
- **AND** it does not read or write lesson data outside that Bundle
