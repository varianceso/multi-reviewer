#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const skillRoot = resolve(__dirname, "..");
const repoRoot = resolve(skillRoot, "..", "..");

const expectedTemplates = [
  "auth.md",
  "env-tools.md",
  "product-review-prompt.md",
  "tech-review-prompt.md",
  "test-plan-review-prompt.md",
  "rollout-review-prompt.md",
  "qa-regression-prompt.md",
  "case-study.md",
  "iteration-log.md",
];

const expectedReferences = [
  "archive-and-blind.md",
  "cross-validation.md",
  "filling-prompts.md",
  "hard-constraints.md",
  "java-backend-standard.md",
  "multi-repo.md",
  "multi-round-regression.md",
  "plan-review-perspectives.md",
  "report-format.md",
  "reviewer-workmode.md",
];

const jsonFiles = [
  ".codex-plugin/plugin.json",
  ".agents/plugins/marketplace.json",
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
  "marketplace.json",
];

const checks = [];

function read(relPath) {
  return readFileSync(join(repoRoot, relPath), "utf8");
}

function addCheck(name, pass, details = "") {
  checks.push({ name, pass, details });
}

function fileExists(relPath) {
  return existsSync(join(repoRoot, relPath));
}

function includesAll(text, terms) {
  return terms.every((term) => text.includes(term));
}

function sameText(left, right) {
  return left.replaceAll("\r\n", "\n") === right.replaceAll("\r\n", "\n");
}

function mirrorPath(skillPath) {
  return skillPath.replace(/^skills\//, "plugins/multi-reviewer/skills/");
}

function parseFrontmatter(relPath) {
  const contents = read(relPath);
  const match = contents.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const frontmatter = match[1];
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const foldedDescription = frontmatter.match(/^description:\s*>\s*\r?\n([\s\S]*)$/m);
  const description = foldedDescription
    ? foldedDescription[1]
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join(" ")
        .trim()
    : frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();

  return { name, description: description ?? "" };
}

function skillDescriptionLengthOk(relPath) {
  return parseFrontmatter(relPath).description.length <= 1024;
}

for (const file of jsonFiles) {
  try {
    JSON.parse(read(file));
    addCheck(`valid JSON: ${file}`, true);
  } catch (err) {
    addCheck(`valid JSON: ${file}`, false, err.message);
  }
}

for (const file of expectedTemplates) {
  addCheck(`template exists: ${file}`, fileExists(`skills/multi-reviewer/templates/${file}`));
}

for (const file of expectedReferences) {
  addCheck(`reference exists: ${file}`, fileExists(`skills/multi-reviewer/references/${file}`));
}

const codexPlugin = JSON.parse(read(".codex-plugin/plugin.json"));
const codexPluginMirror = JSON.parse(read("plugins/multi-reviewer/.codex-plugin/plugin.json"));
const plugin = JSON.parse(read(".claude-plugin/plugin.json"));
const changelog = read("docs/changelog.md");
const readme = read("README.md");
const skill = read("skills/multi-reviewer/SKILL.md");
const acSkill = read("skills/mrcc/SKILL.md");
const init = read("skills/multi-reviewer/scripts/init.mjs");
const productPrompt = read("skills/multi-reviewer/templates/product-review-prompt.md");
const techPrompt = read("skills/multi-reviewer/templates/tech-review-prompt.md");
const testPlanPrompt = read("skills/multi-reviewer/templates/test-plan-review-prompt.md");
const rolloutPrompt = read("skills/multi-reviewer/templates/rollout-review-prompt.md");
const qaPrompt = read("skills/multi-reviewer/templates/qa-regression-prompt.md");
const archiveAndBlind = read("skills/multi-reviewer/references/archive-and-blind.md");
const multiRepo = read("skills/multi-reviewer/references/multi-repo.md");
const reportFormat = read("skills/multi-reviewer/references/report-format.md");
const planPerspectives = read("skills/multi-reviewer/references/plan-review-perspectives.md");
const crossVal = read("skills/multi-reviewer/references/cross-validation.md");
const workmode = read("skills/multi-reviewer/references/reviewer-workmode.md");
const javaStandard = read("skills/multi-reviewer/references/java-backend-standard.md");
const marketplaceInner = JSON.parse(read(".claude-plugin/marketplace.json"));
const marketplaceOuter = JSON.parse(read("marketplace.json"));
const codexMarketplace = JSON.parse(read(".agents/plugins/marketplace.json"));

addCheck("plugin version appears in changelog", changelog.includes(`## [${plugin.version}]`) || changelog.includes(`v${plugin.version}`), `version=${plugin.version}`);
addCheck("Codex plugin version matches Claude plugin version", codexPlugin.version === plugin.version, `codex=${codexPlugin.version}, claude=${plugin.version}`);
addCheck("Codex plugin manifest points at skills root", codexPlugin.skills === "./skills/" && codexPlugin.name === plugin.name);
addCheck("Codex marketplace exposes standard plugin directory", codexMarketplace.plugins?.[0]?.name === plugin.name && codexMarketplace.plugins?.[0]?.source?.source === "local" && codexMarketplace.plugins?.[0]?.source?.path === "./plugins/multi-reviewer");
addCheck("Codex install source mirrors root manifest and skills",
  codexPluginMirror.name === codexPlugin.name &&
  codexPluginMirror.version === codexPlugin.version &&
  codexPluginMirror.skills === "./skills/" &&
  fileExists("plugins/multi-reviewer/skills/multi-reviewer/SKILL.md") &&
  fileExists("plugins/multi-reviewer/skills/mrcc/SKILL.md"));

// v1.9+ — comprehensive mirror integrity check (all expected skill files)
const mirrorSkillFiles = [
  "skills/mrcc/SKILL.md",
  "skills/multi-reviewer/SKILL.md",
  "skills/multi-reviewer/scripts/init.mjs",
  "skills/multi-reviewer/scripts/smoke-test.mjs",
  "skills/multi-reviewer/scripts/check-consistency.mjs",
  ...expectedReferences.map((f) => `skills/multi-reviewer/references/${f}`),
  ...expectedTemplates.map((f) => `skills/multi-reviewer/templates/${f}`),
  "skills/multi-reviewer/templates/slug-index.md",
  "skills/multi-reviewer/templates/slug-summary.md",
];
const mirrorResults = mirrorSkillFiles.map((sp) => {
  const pp = mirrorPath(sp);
  return { source: sp, mirror: pp, exists: fileExists(pp), identical: fileExists(pp) ? sameText(read(sp), read(pp)) : false };
});
const mirrorOk = mirrorResults.every((r) => r.exists && r.identical);
if (!mirrorOk) {
  const failures = mirrorResults.filter((r) => !r.exists || !r.identical)
    .map((r) => `${r.source} -> ${r.mirror}`).join(", ");
  addCheck("all expected skill files mirrored byte-identical (skills/ vs plugins/)", false, `failures: ${failures}`);
} else {
  addCheck("all expected skill files mirrored byte-identical (skills/ vs plugins/)", true);
}
addCheck("multi-reviewer rename and mrcc alias are documented", plugin.name === "multi-reviewer" && codexPlugin.name === "multi-reviewer" && readme.includes("短别名:**mrcc**") && skill.includes("Alias: mrcc"));
addCheck("mrcc alias skill exists and delegates to multi-reviewer",
  fileExists("skills/mrcc/SKILL.md") &&
  acSkill.includes("name: mrcc") &&
  acSkill.includes("Alias for multi-reviewer") &&
  acSkill.includes("../multi-reviewer/SKILL.md"));
addCheck("skill descriptions stay within Codex loader limit",
  [
    "skills/multi-reviewer/SKILL.md",
    "skills/mrcc/SKILL.md",
    "plugins/multi-reviewer/skills/multi-reviewer/SKILL.md",
    "plugins/multi-reviewer/skills/mrcc/SKILL.md",
  ].every(skillDescriptionLengthOk));
addCheck("README references seven prompt/bootstrap files", includesAll(readme, expectedTemplates.filter((file) => file !== "case-study.md" && file !== "iteration-log.md")));
addCheck("init copies seven rule templates", includesAll(init, expectedTemplates.filter((file) => file !== "case-study.md" && file !== "iteration-log.md")));
addCheck("init documents --dry-run", init.includes("--dry-run") && init.includes("dry-run complete"));
addCheck("init documents N>=5 warning", init.includes("reviewerLetters.length >= 5") && init.includes("N=2-4"));

addCheck("B1 single-reviewer rule is synchronized", includesAll(skill, ["B1", "单 reviewer", "产品方案"]) && productPrompt.includes("单 reviewer") && planPerspectives.includes("B1"));
addCheck("output primary-repo-only rule is synchronized (v1.9)", includesAll(skill, ["产出仅主仓"]) && archiveAndBlind.includes("产出仅主仓") && multiRepo.includes("产出仅主仓") && qaPrompt.includes("仅主仓"));
addCheck("finding evidence rule is synchronized", reportFormat.includes("源码行号") && reportFormat.includes("命令输出") && [techPrompt, testPlanPrompt, rolloutPrompt, qaPrompt].every((text) => text.includes("report-format.md") && text.includes("§1.1")));
addCheck("hard constraints are referenced by reviewer prompts", [productPrompt, techPrompt, testPlanPrompt, rolloutPrompt, qaPrompt].every((text) => text.includes("hard-constraints.md")));
addCheck("five entry modes are documented", includesAll(skill, ["产品方案评审", "技术方案评审", "测试方案评审", "上线方案评审", "QA 回归"]));
addCheck("sync matrix remains present", skill.includes("协议-模板-reference 同步矩阵") && skill.includes("bootstrap / init.mjs 脚本行为"));

// v1.6 — main-agent self-verify discipline upgraded to 6 steps
addCheck("main-agent self-verify discipline upgraded to 6 steps",
  crossVal.includes("逐 finding 自查代码") && skill.includes("逐 finding 自查代码") && crossVal.includes("严格多数共识 ≠"));
// v1.6 — AskUserQuestion 4-element context required
// v1.6.1: strengthen — also check the 4 named elements (副 agent 言论 / 主 agent 自查 / 具体例子 / 选项) all appear in §7
addCheck("AskUserQuestion 4-element context required",
  crossVal.includes("4 要素") && crossVal.includes("副 agent 言论") && crossVal.includes("主 agent 自查") && crossVal.includes("具体例子") && crossVal.includes("选项") && skill.includes("4 要素"));
// v1.6 — slug requirement archive documented
addCheck("slug v1.9 archive documented (physical root + <CALENDAR> PRD + plan single version)",
  archiveAndBlind.includes("§2.5") && archiveAndBlind.includes("<slug>") && skill.includes("需求维度归档") && skill.includes("<CALENDAR_PLATFORM> PRD") && skill.includes("方案只保留一份最终版") && archiveAndBlind.includes("prd.md"));
// v1.6 — slug index/summary templates exist
addCheck("slug index/summary/iteration-log templates exist (v1.9)",
  fileExists("skills/multi-reviewer/templates/slug-index.md") &&
  fileExists("skills/multi-reviewer/templates/slug-summary.md") &&
  fileExists("skills/multi-reviewer/templates/iteration-log.md"));
// v1.6 — skill boundary tightened (NOT for plan/code generation)
addCheck("skill boundary tightened (review-only, not for generation)",
  plugin.description.includes("Does NOT generate") && plugin.description.includes("superpowers") &&
  codexPlugin.description.includes("Does NOT generate") && codexPlugin.description.includes("superpowers") &&
  skill.includes("不是设计/编码环") && skill.includes("出方案 / 设计方案"));
// v1.6 — all 5 description fields are synchronized to "review-only" semantics
// v1.6.1: include marketplaceInner.description (top-level) — was missing in v1.6.0 check
addCheck("all 5 manifest descriptions synchronized to cross-validation semantics",
  plugin.description.includes("CROSS-VALIDATION") &&
  codexPlugin.description.includes("CROSS-VALIDATION") &&
  marketplaceInner.description.includes("CROSS-VALIDATION") &&
  marketplaceInner.plugins[0].description.includes("CROSS-VALIDATION") &&
  marketplaceOuter.description.includes("cross-validation") &&
  marketplaceOuter.plugins[0].description.includes("CROSS-VALIDATION"));

// v1.10 — reviewer prompt templates carry reviewer/ subdirectory in output paths
addCheck("reviewer prompt templates use <slug>/reviewer/<date> convention",
  [productPrompt, techPrompt, testPlanPrompt, rolloutPrompt, qaPrompt].every((text) =>
    text.includes("<slug>/reviewer/{{YYYY-MM-DD}}") || text.includes("<slug>/reviewer/{{上一轮") ||
    text.includes("<slug>/reviewer/<date>") || text.includes("<slug>\\reviewer\\{{YYYY-MM-DD}}") ||
    text.includes("<slug>\\reviewer\\<date>")) &&
  [productPrompt, techPrompt, testPlanPrompt, rolloutPrompt, qaPrompt].every((text) =>
    !text.includes("每仓镜像") && !text.includes("副仓各一份")));

// v1.9 — slug-entry checklist updated (<CALENDAR> PRD + plan single final version + only-conclusions index)
addCheck("SKILL slug-entry checklist updated for v1.9",
  skill.includes("<CALENDAR_PLATFORM> PRD") && skill.includes("方案只保留一份最终版") && skill.includes("iteration-log.md"));

// v1.6.1 — hard-constraints includes §8 reviewer-not-read-slug-dir (added in v1.6.1)
addCheck("hard-constraints includes <slug>/ readonly clause",
  read("skills/multi-reviewer/references/hard-constraints.md").includes("<slug>"));

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
    text.includes("验证白名单") && text.includes("基线债") &&
    (text.includes("不得扩大") || text.includes("禁止扩大"))));
addCheck("review-only boundary remains intact",
  skill.includes("不新增 Coder") &&
  plugin.description.includes("Does NOT generate") &&
  codexPlugin.description.includes("Does NOT generate"));

for (const { name, pass, details } of checks) {
  if (pass) {
    console.log(`[ok] ${name}`);
  } else {
    console.error(`[fail] ${name}${details ? ` — ${details}` : ""}`);
  }
}

const failed = checks.filter((check) => !check.pass);
if (failed.length > 0) {
  console.error(`consistency checks failed: ${failed.length}/${checks.length}`);
  process.exit(1);
}

console.log(`consistency checks passed: ${checks.length}/${checks.length}`);
