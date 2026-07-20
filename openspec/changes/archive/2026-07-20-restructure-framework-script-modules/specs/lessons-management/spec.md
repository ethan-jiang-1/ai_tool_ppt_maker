## MODIFIED Requirements

### Requirement: lessons.mjs CLI lists lessons in a run bundle

`PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/lessons.mjs` SHALL provide a `list` subcommand that, given a run directory path, resolves the deck root, reads all files in `_lessons/` (excluding `README.md`), and prints a human-readable listing with one line per lesson file showing the filename and a brief summary extracted from the first heading or frontmatter.

The tool SHALL:
- Accept a run directory (e.g., `deck_*/3_versions/v1`) as its argument
- Resolve the deck root via `deckRoot()` from the public shared run-bundle interface
- Read `deck_*/_lessons/` and list all `.md` and `.yaml` files (excluding `README.md`)
- For `.md` files: extract the first `# ` heading as the summary; if no heading exists, use the filename as the summary
- For `.yaml` files: extract the first `# ` comment line as the summary; if no comment exists, use the filename as the summary
- Print a count at the end (e.g., "2 lessons")
- Exit 0 even if `_lessons/` is empty or absent (just report "0 lessons")
- Have zero external dependencies (Node.js built-ins only)
- Support `--json` flag to output machine-readable JSON array with `{file, summary}` objects

#### Scenario: List lessons in a deck with lessons

- **WHEN** Agent runs the canonical `lessons.mjs list <runDir>` direct CLI on a deck whose `_lessons/` contains `vendor-reliability.md` and `image2-proven.yaml`
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

### Requirement: lessons.mjs integrates with bundle_layout path constants

`lessons.mjs` SHALL import `deckRoot` and `LESSONS_DIR` from the public shared run-bundle `bundle_layout.mjs` interface and SHALL NOT hardcode any run-bundle paths. Lesson file discovery SHALL resolve `deckRoot(runDir)` then join with `LESSONS_DIR`, consistent with how other framework modules resolve bundle paths.

#### Scenario: Path resolution follows bundle_layout SSOT

- **WHEN** `lessons.mjs` resolves a run directory
- **THEN** it uses `deckRoot()` and `LESSONS_DIR` from `shared/run-bundle/bundle_layout.mjs`
- **AND** does not hardcode `_lessons` or `deck_` strings for path computation
