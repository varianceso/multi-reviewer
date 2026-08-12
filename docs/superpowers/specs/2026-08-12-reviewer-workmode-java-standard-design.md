# Reviewer Workmode and Java Backend Review Design

## Context

`multi-reviewer` is a review-only plugin for cross-validating finalized plans and
completed code. It currently provides five review modes (B1-B4 and A), N-way
double-blind reviewer coordination, archive rules, report formats, project
bootstrap templates, and consistency checks.

The requested upgrade must align reviewer behavior with the current local work
mode and integrate the hrod-plus Java backend coding standard. The plugin must
remain review-only: it will not dispatch implementation work, add a Coder mode,
or write business code.

## Goals

1. Make the shared reviewer work mode a native plugin policy rather than a
   project-local patch.
2. Automatically enforce the Java backend standard for Java backend technical
   reviews, test-plan reviews, and QA regression.
3. Keep prompts compact by referencing plugin-owned policy documents instead of
   copying large standards into every task prompt.
4. Preserve the existing five-mode workflow, reviewer read-only boundary,
   double-blind rules, archive layout, and primary-repository-only output.
5. Extend automated consistency checks so policy, templates, manifests, and the
   Codex marketplace mirror cannot silently drift.

## Non-Goals

- No Coder role or sixth entry mode.
- No implementation-task template or `.claude/<slug>/coder/<date>/` workflow.
- No source-code generation or modification by reviewers.
- No Java policy enforcement for non-Java work.
- No project-specific copy of the Java standard under `.claude/rules/`.
- No change to existing business-repository archive files.

## Architecture

### Shared reviewer work mode

Add `references/reviewer-workmode.md` as the single source of truth for behavior
shared by all five review modes. It will define:

- reviewer mappings for codex, opencode, mico, zcode, cursor, cline, qoder,
  aider, and trae;
- double-blind dispatch boundaries and primary-repository-only output;
- compact dispatch content shaped as path, execution requirements, report
  requirements, and exit behavior;
- on-demand document reading using targeted `rg` and `sed` reads for large
  supporting documents rather than inlining their content;
- a validation allowlist, prohibition on expanding into unrelated validation,
  and baseline-debt stop/report behavior;
- Codex stream-failure handling: at most two attempts for one request, then mark
  it incomplete; after two consecutive stream failures for the same subtask,
  hand the task to zcode;
- a maximum of five commits in one review scope;
- a standardized final response of at most 200 Chinese characters.

The policy will remain subordinate to the existing seven hard constraints. It
cannot grant a reviewer permission to modify source, run Git writes, clear
shared state, bypass authentication, or read another reviewer's output.

### Java backend standard

Add `references/java-backend-standard.md` as the plugin-owned canonical copy of
the supplied hrod-plus backend rules. It will retain rule identifiers and cover:

- naming and model suffixes;
- method parameters, pagination, and sorting;
- formatting and the 150-character hard limit;
- object-oriented/domain behavior placement;
- collections, concurrency, and transactions;
- control flow, exceptions, HTTP status mapping, logging, and redaction;
- comments and internal-identifier restrictions;
- MySQL schema/query requirements;
- API, Application, Domain, Infra, Repository, and Common layer boundaries;
- applicability, legacy-debt handling, and documented exceptions.

Review findings based on this policy must cite a rule identifier, source or plan
location, observed evidence, and impact. A pre-existing violation outside the
current change is baseline debt, not automatically a blocker for the current
delivery. New or changed code that violates a mandatory rule is severity-rated
by behavioral, safety, maintainability, or layering impact.

## Applicability

The Java policy applies automatically when any reliable signal establishes Java
backend scope:

- changed or reviewed `.java` files;
- a Maven `pom.xml` or a Gradle Java plugin/module in the reviewed scope;
- conventional Java backend source paths or packages;
- an explicit task or plan statement that the target is a Java backend.

If the reviewer cannot establish applicability, the reviewer records
`NOTE: Java standard applicability not confirmed` and continues without using
Java-only rules as blocking criteria.

| Mode | Shared work mode | Java backend standard |
| --- | --- | --- |
| B1 Product plan | Required | Not required |
| B2 Technical plan | Required | Required when Java backend applies |
| B3 Test plan | Required | Required when Java backend applies |
| B4 Rollout plan | Required | Not required |
| A QA regression | Required | Required when Java backend applies |

For B2, reviewers verify that the proposed structure and contracts conform to
the Java and layering rules. For B3, reviewers additionally verify the Maven
module selection, explicit comma-separated test classes, and prevention of
Surefire false-green runs. For A, reviewers verify both changed code and the
allowlisted validation commands.

## Template Integration

All five reviewer prompt templates will reference and require
`reviewer-workmode.md`. B2, B3, and A will include a short Java applicability
gate and conditionally require `java-backend-standard.md`; B1 and B4 will not
load Java-specific rules.

B3 and A will require an explicit validation allowlist. For Maven work this
means the affected module is constrained with `-pl <module> -am`, and test
classes are explicitly comma-separated rather than joined with `+`. Reviewers
must not broaden validation to an unchanged chain. A baseline problem exposed
outside the allowlist stops that expansion and is reported to the main agent;
only the main agent or user may authorize a wider run.

Templates will continue to contain the executable review workflow and output
contract. They will not inline either new reference document. Existing
double-blind, archive, evidence, hard-constraint, and concise-summary clauses
remain in effect.

## Skill and Documentation Integration

`SKILL.md` will document:

- the shared work-mode policy;
- Java applicability detection and per-mode behavior;
- mico and zcode as supported reviewer identities;
- stream-failure fallback and validation allowlists;
- the five-mode applicability matrix;
- new synchronization-matrix anchors.

`README.md` will summarize the new native behavior and keep the plugin described
as cross-validation only. `CONTRIBUTING.md` will tell contributors to update the
new references and synchronization checks when changing these policies.

## Bootstrap and Compatibility

`init.mjs` will not copy the Java standard or shared work-mode reference into a
business repository. Task prompts resolve the installed plugin references, so
there is one canonical policy source and existing `.claude/rules/` directories
need no migration.

The current five prompt motherboards remain the bootstrap output. Re-running
initialization continues to update the same files and reviewer substitutions.
No Coder configuration, Coder template, or coder archive is added.

## Versioning and Distribution

Treat the upgrade as a backward-compatible minor release. Update the version in
the Codex manifest, Claude manifest, marketplace entries that carry a version,
and the Codex install-source mirror. Add a changelog entry describing behavior,
compatibility, and the absence of project migration.

Descriptions may mention Java-aware plan/QA review and reviewer work-mode
policies, but must continue to say that the plugin does not generate plans or
code.

## Consistency and Test Strategy

Extend `check-consistency.mjs` before implementation so it initially fails for
the missing behavior, then make the implementation satisfy it. New checks will
verify:

1. Both references exist in the root skill and Codex install mirror.
2. Every reviewer template references the shared work mode.
3. Only B2, B3, and A require the conditional Java policy.
4. B3 and A include allowlist, no-expansion, and baseline-debt clauses.
5. Work-mode policy contains mico, zcode, two-attempt stream fallback, five-
   commit scope, and the 200-character response limit.
6. Java policy retains representative mandatory rules from every section and
   all six layering boundaries.
7. Manifest descriptions remain review-only and versions agree.
8. Every skill file remains byte-identical between `skills/` and
   `plugins/multi-reviewer/skills/`.
9. No Coder template, sixth mode, or coder bootstrap output is introduced.

Verification will run:

```bash
node skills/multi-reviewer/scripts/check-consistency.mjs
node skills/multi-reviewer/scripts/smoke-test.mjs
node skills/multi-reviewer/scripts/init.mjs --dry-run
```

The smoke suite will also initialize a temporary repository and confirm its
expected rule files remain unchanged. A final Git diff review will check the
read-only reviewer boundary, five-mode count, mirror completeness, and absence
of accidental Coder functionality.

## Risks and Mitigations

- **Prompt growth:** keep detailed rules in references and add only applicability
  gates and links to templates.
- **False Java detection:** require a reliable signal; uncertainty becomes a
  NOTE rather than a blocker.
- **Legacy violations overwhelming reviews:** distinguish changed-code findings
  from baseline debt and prohibit unrelated validation expansion.
- **Policy drift:** enforce anchors and full mirror equality in the consistency
  script.
- **Boundary regression:** assert review-only manifest language and absence of a
  Coder entry mode or bootstrap template.

## Acceptance Criteria

- Existing B1-B4/A workflows and archive paths continue to work.
- All reviewers natively follow the shared work mode.
- Java backend B2/B3/A reviews automatically load and apply the Java standard.
- Non-Java and uncertain-scope reviews are not blocked by Java-only rules.
- Validation commands remain allowlisted and unrelated baseline failures stop
  expansion rather than encouraging workarounds.
- Codex failures stop after two attempts and zcode is the documented fallback
  after two consecutive failures for the same subtask.
- Consistency and smoke tests pass with synchronized distribution mirrors.
- The plugin remains review-only and requires no existing project migration.
