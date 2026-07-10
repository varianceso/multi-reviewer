#!/usr/bin/env node
// init.mjs — bootstrap a project's .claude/rules/ scaffold for multi-reviewer skill
//
// Usage:
//   node init.mjs [<repo-path>] [--reviewer-a=<name>] [--reviewer-b=<name>] [--reviewer-c=<name> ...] [--yes] [--dry-run]
//
// Defaults:
//   <repo-path>         = process.cwd()
//   --reviewer-a        = codex
//   --reviewer-b        = opencode
//   --reviewer-c/-d/... = (none, optional;字母循环 a-z 最多 26 个)
//   --yes               = non-interactive, auto-confirm overwrites (CI-friendly)
//   --dry-run           = preview what would be written/created, but don't touch disk
//
// Behavior:
//   1. Detect <repo>/.claude/rules/. Prompt overwrite/skip/abort if exists.
//   2. Copy 7 templates to <repo>/.claude/rules/:
//      - auth.md, env-tools.md
//      - product-review-prompt.md   (B1, single-reviewer)
//      - tech-review-prompt.md      (B2)
//      - test-plan-review-prompt.md (B3)
//      - rollout-review-prompt.md   (B4)
//      - qa-regression-prompt.md    (A)
//   3. Replace {a-name} / {b-name} / {c-name} / ... and <reviewer-a>/<reviewer-b>/... placeholders
//      for each configured reviewer letter.
//   4. Write <repo>/.claude/rules/README.md (pointing to skill references).
//   5. NOT copy references/ — they live in the skill, upgrade-shared.

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import process from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_ROOT = resolve(__dirname, "..");
const TEMPLATES_DIR = join(SKILL_ROOT, "templates");

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(level, msg) {
  const tag =
    level === "info" ? `${ANSI.cyan}info${ANSI.reset}` :
    level === "ok" ? `${ANSI.green}ok${ANSI.reset}` :
    level === "warn" ? `${ANSI.yellow}warn${ANSI.reset}` :
    level === "err" ? `${ANSI.red}err${ANSI.reset}` :
    level;
  console.log(`[${tag}] ${msg}`);
}

function parseArgs(argv) {
  // reviewers: { a: 'codex', b: 'opencode', c?: 'cursor', d?: 'cline', ... }
  // Default a=codex, b=opencode; c/d/e/... are added via --reviewer-c=... etc.
  const args = { repoPath: null, reviewers: { a: "codex", b: "opencode" }, yes: false, dryRun: false };
  // Accept lowercase, uppercase (auto-normalize), but NOT multi-letter
  const reviewerArgRe = /^--reviewer-([A-Za-z])=(.+)$/;
  const reviewerMultiLetterRe = /^--reviewer-([A-Za-z]{2,})=/;
  for (const a of argv) {
    if (reviewerMultiLetterRe.test(a)) {
      log("err", `${a}: only single-letter reviewer ids (a-z) are supported. Up to 26 reviewers; got multi-letter id. Aborting.`);
      process.exit(1);
    }
    const m = a.match(reviewerArgRe);
    if (m) {
      const rawLetter = m[1];
      const letter = rawLetter.toLowerCase();
      if (rawLetter !== letter) {
        log("warn", `--reviewer-${rawLetter}=... auto-normalized to --reviewer-${letter}=... (only lowercase a-z is canonical)`);
      }
      const name = m[2];
      if (!name) {
        log("warn", `--reviewer-${letter}=<empty> ignored`);
        continue;
      }
      args.reviewers[letter] = name;
    } else if (a === "--yes" || a === "-y") {
      args.yes = true;
    } else if (a === "--dry-run" || a === "--dryrun") {
      args.dryRun = true;
    } else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    } else if (!a.startsWith("--") && args.repoPath === null) {
      args.repoPath = a;
    } else {
      log("warn", `ignored unknown arg: ${a}`);
    }
  }
  args.repoPath = resolve(args.repoPath ?? process.cwd());
  return args;
}

function printHelp() {
  console.log(`multi-reviewer (mrcc) init — bootstrap .claude/rules/ in a project

Usage:
  node init.mjs [<repo-path>] [options]

Options:
  --reviewer-a=<name>   reviewer A's directory name (default: codex)
  --reviewer-b=<name>   reviewer B's directory name (default: opencode)
  --reviewer-c=<name>   reviewer C's directory name (optional, e.g. cursor)
  --reviewer-d=<name>   reviewer D's directory name (optional, e.g. cline)
  ...                   alphabetic loop a-z, up to 26 reviewers
  --yes, -y             non-interactive, auto-confirm overwrites
  --dry-run             preview what would be written/created, but don't touch disk
                        (line counts use JS LF-split, may differ ±10% from editor display)
  --help, -h            show this help

Examples:
  node init.mjs                                                     # bootstrap CWD with defaults (2 reviewers)
  node init.mjs E:/projects/my-repo                                 # specific path
  node init.mjs --reviewer-a=cursor --reviewer-b=cline              # change default 2
  node init.mjs --reviewer-c=cursor --reviewer-d=cline              # extend to 4 reviewers
  node init.mjs --reviewer-c=cursor --reviewer-d=cline --reviewer-e=qoder   # 5 reviewers
`);
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(question, (a) => { rl.close(); res(a); }));
}

function ensureDir(path) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function fileExists(path) {
  try { return statSync(path).isFile(); } catch { return false; }
}

function dirExists(path) {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

function applyPlaceholders(content, { reviewers }) {
  // For each configured reviewer letter, replace its placeholders:
  //   <reviewer-X>     → reviewers[X]
  //   {X-name}          → reviewers[X]
  //   .{reviewer-X}    → .reviewers[X]
  //   .{X-name}         → .reviewers[X]
  // Iterates over all configured letters (a-z), so unconfigured letters stay literal
  // (templates referencing reviewer-C/D/... when only a/b configured will keep those tokens
  //  — they're documentation pointers, not active replacements).
  let out = content;
  for (const [letter, name] of Object.entries(reviewers)) {
    const reReviewer = new RegExp(`<reviewer-${letter}>`, "g");
    const reShortName = new RegExp(`\\{${letter}-name\\}`, "g");
    const reDotReviewer = new RegExp(`\\.\\{reviewer-${letter}\\}`, "g");
    const reDotShortName = new RegExp(`\\.\\{${letter}-name\\}`, "g");
    out = out
      .replace(reReviewer, name)
      .replace(reShortName, name)
      .replace(reDotReviewer, `.${name}`)
      .replace(reDotShortName, `.${name}`);
  }
  return out;
}

async function copyTemplate(srcName, destPath, args) {
  const src = join(TEMPLATES_DIR, srcName);
  if (!fileExists(src)) {
    log("err", `template missing: ${src}`);
    return false;
  }
  if (fileExists(destPath) && !args.yes && !args.dryRun) {
    const a = (await ask(`${ANSI.yellow}exists${ANSI.reset} ${destPath} — overwrite? [y/N/skip-all] `)).trim().toLowerCase();
    if (a === "skip-all") return "skip-all";
    if (a !== "y" && a !== "yes") {
      log("info", `kept existing: ${destPath}`);
      return false;
    }
  }
  const content = readFileSync(src, "utf8");
  const transformed = applyPlaceholders(content, args);
  if (args.dryRun) {
    const lines = transformed.split("\n").length;
    const action = fileExists(destPath) ? "overwrite" : "create";
    log("info", `${ANSI.dim}[dry-run]${ANSI.reset} would ${action}: ${destPath} (${lines} lines)`);
    return true;
  }
  ensureDir(dirname(destPath));
  writeFileSync(destPath, transformed, "utf8");
  log("ok", `wrote ${destPath}`);
  return true;
}

// Generate the rules/README.md content directly with args, avoiding the
// placeholder replacement (which would garble the docs that explain placeholders).
function renderRulesReadme({ reviewers }) {
  const reviewerLetters = Object.keys(reviewers).sort();
  const reviewerListMd = reviewerLetters
    .map((letter) => `- reviewer-${letter.toUpperCase()} → \`${reviewers[letter]}\` (产出归档目录:\`.${reviewers[letter]}/<YYYY-MM-DD>/\`)`)
    .join("\n");
  const gitignoreLines = ["  .claude/", ...reviewerLetters.map((l) => `  .${reviewers[l]}/`)].join("\n");

  return `# .claude/rules/ — multi-reviewer 协议本地落地

- 由 \`multi-reviewer\` skill 的 \`scripts/init.mjs\` 自动生成
- 性质:**项目本地**(per-project)的协议落地;**协议主体**在 skill 自带的 \`references/\`

## 上位规则

详细规则在 skill 目录下,**不复制到本仓**(升级 skill 后所有项目同步生效):

- \`<skill-path>/SKILL.md\` — 索引主体
- \`<skill-path>/references/cross-validation.md\` — N+1 协同流程(N reviewer 默认 2)
- \`<skill-path>/references/plan-review-perspectives.md\` — 四类方案视角差异
- \`<skill-path>/references/multi-repo.md\` — 多仓同步 + prompt 单源化
- \`<skill-path>/references/archive-and-blind.md\` — 归档与双盲铁律
- \`<skill-path>/references/hard-constraints.md\` — QA 7 条硬约束
- \`<skill-path>/references/report-format.md\` — 报告格式与严重度
- \`<skill-path>/references/filling-prompts.md\` — 占位符填法 + dispatch
- \`<skill-path>/references/multi-round-regression.md\` — 多轮回归 case 沉淀

\`<skill-path>\` 通常在 \`~/.claude/skills/multi-reviewer/skills/multi-reviewer/\`
或 \`~/.claude/plugins/.../multi-reviewer/skills/multi-reviewer/\`(取决于安装方式)。

## 本目录文件

| 文件 | 性质 | 说明 |
|---|---|---|
| \`auth.md\` | **当前工作区实例**(项目自填) | 本项目的鉴权机制、凭据、curl 模板、排错表 |
| \`env-tools.md\` | **当前工作区实例**(项目自填) | 本项目的编译/启动工具链 |
| \`product-review-prompt.md\` | 项目级母板 | **B1 产品方案**评审提示词(**单 reviewer 例外**),新需求 cp 到 \`.claude/<slug>/<date>/\` 填占位符 |
| \`tech-review-prompt.md\` | 项目级母板 | **B2 技术方案**评审提示词(N 路双盲) |
| \`test-plan-review-prompt.md\` | 项目级母板 | **B3 测试方案**评审提示词(N 路双盲;前置=已通过的产/技方案) |
| \`rollout-review-prompt.md\` | 项目级母板 | **B4 上线方案**评审提示词(N 路双盲) |
| \`qa-regression-prompt.md\` | 项目级母板 | **A QA 回归**提示词(N 路双盲),编码后用 |

## 当前 reviewer 配置(${reviewerLetters.length} 个)

\`init.mjs\` 已根据 CLI 参数固化 reviewer 名:

${reviewerListMd}

如需调整 reviewer 数量或名称,重新跑 \`init.mjs\` 并加 \`--reviewer-a=xxx --reviewer-b=yyy --reviewer-c=zzz ...\`。
默认 2 个(a/b);最多 26 个(字母循环 a-z)。**B1 产品方案永远只用 1 个 reviewer**(贴手边任一,与 N 配置无关)。

## 下一步

1. 打开 \`auth.md\`,根据本项目实际情况填写 \`{{}}\` 占位符
   - 鉴权机制(JWT / Cookie / OAuth / API Key / Custom 等)
   - 凭据来源(.env / OAuth flow / 配置中心)
   - 各环境基地址
   - curl 模板 + 排错表

2. 打开 \`env-tools.md\`,填写编译/启动工具链
   - 后端语言版本与构建工具
   - 客户端基础环境
   - 常见踩坑表

3. 在仓根 \`CLAUDE.md\` 末尾追加引用块:

\`\`\`markdown
## 三方协同协议

本仓使用 [multi-reviewer](https://github.com/varianceso/multi-reviewer) skill。

- 项目本地实例:\`.claude/rules/\`
- 协议主体:skill 自带 \`references/\` (随 skill 升级而更新)
- 工作流:见 \`<skill-path>/SKILL.md\`
- 当前配置 ${reviewerLetters.length} 个 reviewer:${reviewerLetters.map((l) => reviewers[l]).join(", ")}
\`\`\`

4. 把 \`.claude/\` 与所有 reviewer 归档目录加入 \`.gitignore\`:

\`\`\`
${gitignoreLines}
\`\`\`

(默认本地草稿区,不入仓)
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const reviewerLetters = Object.keys(args.reviewers).sort();

  console.log(`${ANSI.bold}multi-reviewer (mrcc) bootstrap${ANSI.reset}${args.dryRun ? ` ${ANSI.dim}[dry-run]${ANSI.reset}` : ""}`);
  log("info", `repo path  : ${args.repoPath}`);
  log("info", `reviewers  : ${reviewerLetters.length} 个 (${reviewerLetters.map((l) => `${l}=${args.reviewers[l]}`).join(", ")})`);
  log("info", `templates  : ${TEMPLATES_DIR}`);
  if (args.dryRun) {
    log("info", `${ANSI.dim}--dry-run: no files will be created or modified${ANSI.reset}`);
  }
  if (reviewerLetters.length >= 5) {
    log("warn", `${reviewerLetters.length} reviewers configured. 大部分场景 N=2-4 已足够,N≥5 建议核对是否真有交叉验证收益(LLM reviewer 多至 4 个时同源偏差覆盖度已 ~95%)。继续?可加 --yes 跳过此后所有交互确认。`);
  }

  if (!dirExists(args.repoPath)) {
    log("err", `repo path does not exist: ${args.repoPath}`);
    process.exit(1);
  }
  if (!dirExists(TEMPLATES_DIR)) {
    log("err", `skill templates dir not found: ${TEMPLATES_DIR}`);
    log("err", "this script expects to be at <skill>/scripts/init.mjs with templates/ next to it");
    process.exit(1);
  }

  const rulesDir = join(args.repoPath, ".claude", "rules");
  if (dirExists(rulesDir) && !args.yes && !args.dryRun) {
    const a = (await ask(`${ANSI.yellow}exists${ANSI.reset} ${rulesDir} — overwrite/skip-all/abort [o/s/A]? `)).trim().toLowerCase();
    if (a === "a" || a === "abort" || a === "") {
      log("info", "aborted by user");
      process.exit(0);
    }
    if (a === "s" || a === "skip-all") {
      args.yes = false; // per-file prompts will keep existing
      log("info", "will keep existing files (per-file prompts disabled)");
    } else {
      args.yes = true;
      log("info", "will overwrite existing files");
    }
  }
  if (!args.dryRun) {
    ensureDir(rulesDir);
  }

  const tasks = [
    ["auth.md", "auth.md"],
    ["env-tools.md", "env-tools.md"],
    ["product-review-prompt.md", "product-review-prompt.md"],
    ["tech-review-prompt.md", "tech-review-prompt.md"],
    ["test-plan-review-prompt.md", "test-plan-review-prompt.md"],
    ["rollout-review-prompt.md", "rollout-review-prompt.md"],
    ["qa-regression-prompt.md", "qa-regression-prompt.md"],
  ];

  let skipAll = false;
  for (const [src, dest] of tasks) {
    if (skipAll) { log("info", `skip ${dest} (skip-all)`); continue; }
    const r = await copyTemplate(src, join(rulesDir, dest), args);
    if (r === "skip-all") skipAll = true;
  }

  // Always (re)write the rules/README.md — small, version-managed, safe to overwrite.
  const readmePath = join(rulesDir, "README.md");
  if (args.dryRun) {
    const lines = renderRulesReadme(args).split("\n").length;
    const action = fileExists(readmePath) ? "overwrite" : "create";
    log("info", `${ANSI.dim}[dry-run]${ANSI.reset} would ${action}: ${readmePath} (${lines} lines)`);
  } else {
    writeFileSync(readmePath, renderRulesReadme(args), "utf8");
    log("ok", `wrote ${readmePath}`);
  }

  console.log("");
  if (args.dryRun) {
    log("ok", `${ANSI.green}dry-run complete${ANSI.reset} ${ANSI.dim}(no files written; rerun without --dry-run to apply)${ANSI.reset}`);
    return;
  }
  log("ok", `${ANSI.green}bootstrap complete${ANSI.reset}`);
  const gitignoreSuggestion = [".claude/", ...reviewerLetters.map((l) => `.${args.reviewers[l]}/`)].join(" ");
  console.log(`
${ANSI.bold}下一步${ANSI.reset}:

  1. 打开 ${ANSI.cyan}${join(rulesDir, "auth.md")}${ANSI.reset},填写 {{}} 占位符
  2. 打开 ${ANSI.cyan}${join(rulesDir, "env-tools.md")}${ANSI.reset},填写 {{}} 占位符
  3. 在仓根 CLAUDE.md 追加协议引用块(见 ${join(rulesDir, "README.md")} 末尾"下一步"段)
  4. 把 ${gitignoreSuggestion} 加入 .gitignore
`);
}

main().catch((err) => {
  log("err", err.stack ?? String(err));
  process.exit(1);
});
