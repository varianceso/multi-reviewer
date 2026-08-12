# Reviewer Workmode and Java Standard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate the shared reviewer work mode and Java backend standard into `multi-reviewer` without changing its five-mode, review-only boundary.

**Architecture:** Add two canonical references under `skills/multi-reviewer/references/`. Prompt templates link to the shared policy; B2/B3/A conditionally load the Java standard. Extend the existing consistency script with semantic checks and mirror all skill changes under `plugins/multi-reviewer/skills/`.

**Tech Stack:** Markdown policy documents, vanilla Node.js ESM consistency/smoke scripts, JSON manifests, Git mirror files.

---

### Task 1: Add failing consistency checks

**Files:**
- Modify: `skills/multi-reviewer/scripts/check-consistency.mjs`

- [ ] **Step 1: Add reference names and loaded contents**

Extend `expectedReferences` with `reviewer-workmode.md` and `java-backend-standard.md`. Load both documents beside the existing references and add their paths to `mirrorSkillFiles` through the existing `expectedReferences` expansion.

- [ ] **Step 2: Add semantic assertions**

Add checks that assert:

```js
addCheck("shared reviewer work mode is synchronized",
  workmode.includes("mico") && workmode.includes("zcode") &&
  workmode.includes("2 次") && workmode.includes("5") && workmode.includes("200 字"));
addCheck("Java standard contains mandatory layer boundaries",
  javaStandard.includes("API") && javaStandard.includes("Application") &&
  javaStandard.includes("Domain") && javaStandard.includes("Infra") &&
  javaStandard.includes("Repository") && javaStandard.includes("Common"));
addCheck("review templates reference shared work mode",
  [productPrompt, techPrompt, testPlanPrompt, rolloutPrompt, qaPrompt]
    .every((text) => text.includes("reviewer-workmode.md")));
addCheck("Java-aware templates reference Java standard",
  [techPrompt, testPlanPrompt, qaPrompt]
    .every((text) => text.includes("java-backend-standard.md")) &&
  !productPrompt.includes("java-backend-standard.md") &&
  !rolloutPrompt.includes("java-backend-standard.md"));
addCheck("allowlist policy is present in test and QA prompts",
  [testPlanPrompt, qaPrompt].every((text) =>
    text.includes("验证白名单") && text.includes("基线债") && text.includes("不得扩大")));
addCheck("review-only boundary remains intact",
  skill.includes("不新增 Coder") &&
  plugin.description.includes("Does NOT generate") &&
  codexPlugin.description.includes("Does NOT generate"));
```

Use distinct check names and include the new reference variables before these assertions.

- [ ] **Step 3: Run the check and verify the expected RED state**

Run:

```bash
node skills/multi-reviewer/scripts/check-consistency.mjs
```

Expected: non-zero exit with failures for the two missing references and the new semantic assertions. Do not proceed until the failure is caused by the intended missing behavior rather than a syntax error.

### Task 2: Add the shared reviewer work-mode reference

**Files:**
- Create: `skills/multi-reviewer/references/reviewer-workmode.md`

- [ ] **Step 1: Define reviewer roles and boundaries**

Document claude as main implementer/coordinator, codex and opencode as default independent reviewers, mico as a project-local multi-role framework, and zcode as the codex continuity fallback. Include the supported reviewer list and preserve the read-only, no-commit, no-shared-environment, double-blind, and primary-repository-only constraints.

- [ ] **Step 2: Define validation and baseline-debt policy**

State that reviewers and any test executor use only the explicit allowlist. For Maven, require `-pl <affected-module> -am` and comma-separated `-Dtest=ClassA,ClassB`; prohibit unrelated module/test expansion. When an allowlisted run exposes an unrelated baseline failure, stop expanding, record the failure and scope, and ask the main agent for authorization before widening.

- [ ] **Step 3: Define dispatch, stream fallback, cadence, and response contract**

Specify compact dispatch as paths plus execution/report/exit requirements, targeted `rg`/`sed` reads for large documents, Codex maximum two retries per request, zcode handoff after two consecutive failures for the same subtask, no more than five commits in one review scope, and a copyable final response no longer than 200 Chinese characters.

### Task 3: Add the Java backend standard reference

**Files:**
- Create: `skills/multi-reviewer/references/java-backend-standard.md`

- [ ] **Step 1: Copy the supplied rule structure into the canonical reference**

Preserve the eight numbered sections and applicability/exemption language from `/Users/lm/xyyc/plugins/backend-coding-standard.md`, adding plugin frontmatter and a short reviewer-use section.

- [ ] **Step 2: Make evidence and baseline handling explicit**

Require rule ID, file/line or plan section, observed evidence, and impact for findings. Mark pre-existing violations outside the changed scope as baseline debt; mandatory violations introduced by the current change remain review findings. Retain all API/Application/Domain/Infra/Repository/Common boundaries and DO/API/SDK type leakage rules.

### Task 4: Integrate references into reviewer prompts

**Files:**
- Modify: `skills/multi-reviewer/templates/product-review-prompt.md`
- Modify: `skills/multi-reviewer/templates/tech-review-prompt.md`
- Modify: `skills/multi-reviewer/templates/test-plan-review-prompt.md`
- Modify: `skills/multi-reviewer/templates/rollout-review-prompt.md`
- Modify: `skills/multi-reviewer/templates/qa-regression-prompt.md`

- [ ] **Step 1: Add the shared work-mode requirement to all five prompts**

In each prompt's required references/red-line area, require reading `<skill-path>/references/reviewer-workmode.md` and following it alongside `hard-constraints.md`.

- [ ] **Step 2: Add conditional Java applicability to B2, B3, and A**

Add a short gate that detects `.java`, Maven/Gradle Java configuration, Java source/package paths, or explicit Java backend scope. When detected, require `<skill-path>/references/java-backend-standard.md`; when uncertain, record a NOTE rather than applying Java-only blockers. Add B2 checks for layers/contracts, B3 checks for test selection, and A checks for changed Java code and verification commands.

- [ ] **Step 3: Add allowlist and baseline-debt clauses to B3 and A**

Require explicit allowed commands, `-pl ... -am` and comma-separated test classes where Maven applies, prohibit broadening to unrelated tests/modules, and require a stop/report on unrelated baseline failures. Keep each prompt's existing <=200-character summary requirement.

### Task 5: Update skill documentation, contributor guidance, and release metadata

**Files:**
- Modify: `skills/multi-reviewer/SKILL.md`
- Modify: `README.md`
- Modify: `CONTRIBUTING.md`
- Modify: `.codex-plugin/plugin.json`
- Modify: `plugins/multi-reviewer/.codex-plugin/plugin.json`
- Modify: `.claude-plugin/plugin.json`
- Modify: `.claude-plugin/marketplace.json`
- Modify: `marketplace.json`
- Modify: `.agents/plugins/marketplace.json`
- Modify: `docs/changelog.md`

- [ ] **Step 1: Document policy references and applicability in SKILL.md**

Add the shared work-mode and Java-aware review matrix to the skill index, extend the synchronization matrix with new anchors, list mico/zcode mappings, and explicitly state that no Coder mode is added.

- [ ] **Step 2: Update README and CONTRIBUTING**

Explain the native reviewer work-mode policy, conditional Java backend checks, and reference update requirements while retaining the review-only description and existing bootstrap instructions.

- [ ] **Step 3: Bump and synchronize release metadata**

Set all version-bearing manifests and the Codex install mirror to the same backward-compatible `1.10.0` release version (the `1.1.0` number is already used by historical changelog entries), retain `Does NOT generate`/review-only language, and add a changelog entry with behavior changes and no migration requirement.

### Task 6: Synchronize the Codex install mirror

**Files:**
- Mirror all modified and new files from `skills/` to `plugins/multi-reviewer/skills/` byte-identically.

- [ ] **Step 1: Copy canonical skill files into the install source**

Synchronize the two references, five templates, `SKILL.md`, and `check-consistency.mjs` using a byte-preserving copy operation. Do not alter unrelated files.

- [ ] **Step 2: Verify mirror equality**

Run:

```bash
diff -qr skills plugins/multi-reviewer/skills
```

Expected: no output and exit 0.

### Task 7: Run the full verification suite

**Files:**
- No further source changes expected; fix only issues exposed by verification.

- [ ] **Step 1: Run consistency and smoke tests**

Run:

```bash
node skills/multi-reviewer/scripts/check-consistency.mjs
node skills/multi-reviewer/scripts/smoke-test.mjs
```

Expected: all consistency checks pass and smoke tests print `smoke tests passed`.

- [ ] **Step 2: Verify dry-run and temporary bootstrap**

Run `node skills/multi-reviewer/scripts/init.mjs --dry-run` against a temporary repository and confirm no `.claude` directory is created; run the existing smoke suite for actual temporary initialization.

- [ ] **Step 3: Inspect final scope and syntax**

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Confirm that only the planned references, templates, documentation, metadata, consistency script, mirror files, and design/plan documents changed; no Coder mode or source-writing permission was introduced.

- [ ] **Step 4: Commit implementation**

Create one implementation commit after all checks pass:

```bash
git add skills plugins README.md CONTRIBUTING.md .codex-plugin .claude-plugin .agents docs/changelog.md
git commit -m "feat: integrate reviewer workmode and Java backend checks"
```
