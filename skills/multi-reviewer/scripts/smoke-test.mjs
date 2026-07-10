#!/usr/bin/env node

import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import process from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const initScript = resolve(__dirname, "init.mjs");

const expectedRuleFiles = [
  "auth.md",
  "env-tools.md",
  "product-review-prompt.md",
  "tech-review-prompt.md",
  "test-plan-review-prompt.md",
  "rollout-review-prompt.md",
  "qa-regression-prompt.md",
  "README.md",
];

function fail(message) {
  console.error(`[fail] ${message}`);
  process.exitCode = 1;
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function run(args, options = {}) {
  return spawnSync(process.execPath, [initScript, ...args], {
    cwd: options.cwd ?? resolve(__dirname, ".."),
    encoding: "utf8",
    shell: false,
  });
}

function fileExists(path) {
  try { return statSync(path).isFile(); } catch { return false; }
}

function dirExists(path) {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

function makeTempRepo() {
  return mkdtempSync(join(tmpdir(), "multi-reviewer-smoke-"));
}

function cleanup(path) {
  if (existsSync(path)) rmSync(path, { recursive: true, force: true });
}

const tempRepos = [];

try {
  const dryRunRepo = makeTempRepo();
  tempRepos.push(dryRunRepo);
  const dryRun = run([dryRunRepo, "--dry-run"]);
  assert(dryRun.status === 0, `dry-run should exit 0, got ${dryRun.status}\n${dryRun.stderr}\n${dryRun.stdout}`);
  assert(!dirExists(join(dryRunRepo, ".claude")), "dry-run should not create .claude");
  assert(dryRun.stdout.includes("dry-run complete"), "dry-run output should report completion");

  const defaultRepo = makeTempRepo();
  tempRepos.push(defaultRepo);
  const bootstrap = run([defaultRepo, "--yes"]);
  assert(bootstrap.status === 0, `bootstrap should exit 0, got ${bootstrap.status}\n${bootstrap.stderr}\n${bootstrap.stdout}`);
  const rulesDir = join(defaultRepo, ".claude", "rules");
  for (const file of expectedRuleFiles) {
    assert(fileExists(join(rulesDir, file)), `bootstrap should create ${file}`);
  }
  const defaultReadme = readFileSync(join(rulesDir, "README.md"), "utf8");
  assert(defaultReadme.includes("reviewer-A → `codex`"), "default README should include codex reviewer-A");
  assert(defaultReadme.includes("reviewer-B → `opencode`"), "default README should include opencode reviewer-B");

  const customRepo = makeTempRepo();
  tempRepos.push(customRepo);
  const custom = run([customRepo, "--reviewer-A=cursor", "--reviewer-b=cline", "--reviewer-c=qoder", "--yes"]);
  assert(custom.status === 0, `custom reviewer bootstrap should exit 0, got ${custom.status}\n${custom.stderr}\n${custom.stdout}`);
  assert(custom.stdout.includes("auto-normalized"), "uppercase reviewer id should be auto-normalized");
  const customRulesDir = join(customRepo, ".claude", "rules");
  const customReadme = readFileSync(join(customRulesDir, "README.md"), "utf8");
  assert(customReadme.includes("reviewer-A → `cursor`"), "custom README should include reviewer-A cursor");
  assert(customReadme.includes("reviewer-B → `cline`"), "custom README should include reviewer-B cline");
  assert(customReadme.includes("reviewer-C → `qoder`"), "custom README should include reviewer-C qoder");
  const techPrompt = readFileSync(join(customRulesDir, "tech-review-prompt.md"), "utf8");
  assert(!techPrompt.includes("<reviewer-a>"), "configured reviewer-a placeholder should be replaced");
  assert(!techPrompt.includes("<reviewer-b>"), "configured reviewer-b placeholder should be replaced");
  assert(!techPrompt.includes("{a-name}"), "configured a-name placeholder should be replaced");
  assert(!techPrompt.includes("{b-name}"), "configured b-name placeholder should be replaced");

  const invalidRepo = makeTempRepo();
  tempRepos.push(invalidRepo);
  const invalid = run([invalidRepo, "--reviewer-ab=bad"]);
  assert(invalid.status !== 0, "multi-letter reviewer id should fail");
  assert((invalid.stdout + invalid.stderr).includes("only single-letter reviewer ids"), "multi-letter failure should explain reviewer id rule");

  if (process.exitCode) {
    console.error("smoke tests failed");
  } else {
    console.log("smoke tests passed");
  }
} finally {
  for (const repo of tempRepos) cleanup(repo);
}
