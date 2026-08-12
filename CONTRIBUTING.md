# Contributing to multi-reviewer

Thanks for your interest. This skill plugin orchestrates multi-agent (1 main implementer + N independent reviewers) cross-validation. Contributions welcome — but a few specifics differ from typical open-source contribution.

## Local development

### 1. Install via symlink (recommended for active development)

```bash
# Linux / macOS
ln -s "$(pwd)/skills/multi-reviewer" ~/.claude/skills/multi-reviewer

# Windows (Git Bash)
ln -s "$(pwd -W)/skills/multi-reviewer" "$HOME/.claude/skills/multi-reviewer"
```

Edits land instantly — no reinstall needed for content changes. New skill metadata (frontmatter) requires a fresh Claude Code session to refresh.

### 2. Or install via `--plugin-dir` (one-shot test)

```bash
claude --plugin-dir <repo-root>
```

Plugin is loaded for that session only.

### 3. Validate plugin structure

```bash
claude plugin validate
```

Should output no errors. Warnings about unknown frontmatter fields are usually fine (e.g., `version` in references/*.md is intentional internal versioning).

## Reviewer agent setup

This plugin is designed for use across multiple AI agents (Claude Code, codex, opencode, mico, zcode, cursor, cline, etc.). Each reviewer agent runs the same prompt independently and produces a report in its own archive directory.

All reviewers follow `skills/multi-reviewer/references/reviewer-workmode.md`. When a B2/B3/A task is confirmed to target a Java backend, they also apply `references/java-backend-standard.md`; the Java standard is not copied into project `.claude/rules/`.

For local testing of double-blind cross-validation:

1. Generate a per-task review/regression prompt via the skill's interactive 5-choice (B1 / B2 / B3 / B4 / A)
2. Paste the prompt absolute path to your second AI agent (e.g., codex CLI) — it will read, run, and produce a report
3. Repeat for any additional reviewers (default N=2; configurable up to N=26 via `init.mjs --reviewer-a/b/c/d/...`)
4. Main agent reads all N reports, runs §6.5 verification discipline (self-scan code + N-way comparison + AskUserQuestion for unclear items + close in this round + don't silently dismiss low-ROI findings)

See `skills/multi-reviewer/references/cross-validation.md` for full protocol.

## Protocol changes (most contributions land here)

When modifying any core protocol clause in `SKILL.md`:

**Mandatory**: walk through `SKILL.md §11 Sync Matrix` line by line. Each row lists corresponding anchors in `references/` and `templates/`. If you change the protocol, you must verify all listed anchors stay in sync — not just the spot you edited.

History: v1.3 round-2 self-review caught "protocol changed but reference anchors didn't follow" gaps; v1.4 introduced §11 to mechanize this check. Don't break the mechanism by skipping it on your own contribution.

Changes to reviewer dispatch, validation allowlists, stream fallback, commit cadence, or Java applicability must update the two new references, affected prompt templates, the §11 sync matrix, and `check-consistency.mjs` together.

## Pull request guidelines

1. **Branch**: `feature/v<NEXT>.0` for protocol changes, `fix/<keyword>` for bug fixes
2. **Commits**: write `why` not `what` (the diff already shows what)
3. **Tests**: this skill has no automated test suite (it's a protocol skill, not code). The test is "use the skill on real coding tasks and check it doesn't break."
4. **Self-review (recommended for non-trivial PRs)**: before requesting human review, generate a `qa-regression-prompt.md` for your branch and run it against codex + opencode (= dogfood the skill on itself). Attach both reports to the PR description.
5. **Changelog**: add an entry to `docs/changelog.md` following Keep a Changelog format. Note both Added/Changed and any case-study sedimentation if you fixed a recurring class of issue.

## Code style

- **Markdown**: prose in 中文 by convention (this is a <REDACTED>-internal-rooted plugin); section headers and code blocks may be English. New contributions can use either, but maintain consistency within a file.
- **JS** (`scripts/init.mjs`): vanilla Node ESM, no build step, no dependencies. Keep it cross-platform (Windows / Linux / macOS).
- **Frontmatter**: `SKILL.md` has minimal frontmatter (`name` + `description`). `references/*.md` and `templates/*.md` have internal `version` field — that's intentional for tracking inside the skill, not visible to Claude Code's plugin loader.

## Reporting issues

Open an issue on the project tracker (see `homepage` in `.claude-plugin/plugin.json`). Include:

- Claude Code version (or which other AI agent)
- Skill version (from `.claude-plugin/plugin.json`)
- Reproduction steps
- Expected vs actual behavior

For protocol-level concerns (e.g., "the §6.5 discipline doesn't cover X scenario"), include a concrete example of the scenario rather than abstract criticism.

## Licensing

All contributions are accepted under the MIT License (see `LICENSE`).
