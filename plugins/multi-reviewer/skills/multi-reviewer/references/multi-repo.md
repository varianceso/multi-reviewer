---
name: multi-repo
description: 多仓同步编码/调试的完整指引,涵盖路径词汇表、判定信号、分支对齐、默认分支不对称、产出仅主仓(v1.8)、主仓认定、跨仓 MR 顺序、本地联调 fetch hijack 完整示例
version: 1.4.0
---

# 多仓同步编码

> 上位文件:`SKILL.md`(索引);本文件是多仓同步编码的完整版,展开判定、分支对齐、归档、本地联调、踩坑表。

## 0. 路径占位符词汇表(多仓上下文)

> 完整词汇表见 `archive-and-blind.md` §0。本文件以多仓上下文为主,关键占位符:
>
> - `<primary-repo>` = 主仓 = skill 触发时的 cwd(详见 §2.5);**所有 AC 产出唯一落点**
> - `<secondary-repo-N>` = 副仓(N=1,2,...);reviewer 自己 cd 进入的目标(验证代码用)
> - `<all-repos>` = 主仓 + 所有副仓(reviewer 验证动作的循环上下文)
> - `<repo>` 在本文件用得少;若出现表示"reviewer 当前 cwd"(=cd 进入哪个仓就是哪个)

## 1. 何时算多仓?

满足任一条:

- 改动横跨**后端 + 客户端**(CLI / Web / iOS / Android / Desktop)
- 改动横跨 ≥ 2 个独立 git 仓
- 接口契约的双方分属不同仓(例:后端定义 controller,CLI 定义 SDK 对接)
- 数据契约/事件协议跨服务(发布方与订阅方在不同仓)

只要命中一条,就走"多仓同步"分支。

## 2. 判定后必须做的 4 件事

### 2.1 分支命名对齐

各仓用相同 `feature/{需求关键字}` 或 `fix/{issue-id}` 命名,便于跨仓追溯。

例:需求"差旅报表 Agent",backend 仓和 CLI 仓都用 `feature/520-travel-skill`。

### 2.2 警惕默认分支不对称

不同仓的默认分支可能不同:

| 仓类型 | 常见默认分支 |
|---|---|
| 较老的 Java/Spring 后端 | `master` |
| 较新的 Node/TypeScript 仓 | `main` |
| 公司基线/规范仓 | `master` 或 `develop` |

**提 MR 前必查**:

```bash
git remote show origin | grep "HEAD branch"
# 或
git symbolic-ref refs/remotes/origin/HEAD
```

如果跨多仓的 MR 都假设是 `master`,会出现"在 main 仓向 master 提 MR 找不到"的低级错误。

### 2.3 跨仓 MR 顺序

**契约定义方先合,消费方后合**:

| 场景 | 先合 | 后合 |
|---|---|---|
| 后端定 controller,CLI/Web 调用 | 后端 | CLI/Web |
| 后端发事件,前端订阅 | 后端 | 前端 |
| 共享类型/契约仓 + 业务仓 | 共享仓 | 业务仓 |
| 数据库 schema 变更 + 业务代码 | DB 迁移 | 业务代码 |

逆序合容易出现"消费方代码已在生产但生产对端未升级",造成临时降级。

### 2.4 产出仅主仓(v1.8)

> v1.8 起,**所有 AC 产出(prompt + 报告 + 方案文档)一律只在主仓(`<primary-repo>`)落盘**。副仓不镜像任何 AC 产出。

**为什么**:
- 主仓是 AC 流程的"控制面" — 所有 reviewer 在主仓读 prompt、在主仓写报告
- reviewer 在副仓做的事是**代码验证**(跑接口、CLI 命令、数据核对),验证结果汇总进主仓的报告即可
- 副仓不留 AC 产出,避免多仓维护成本 + 敏感信息分散

**产物落盘规则**:

```
<primary-repo>/.claude/<slug>/<YYYY-MM-DD>/qa-regression-prompt.md   ← 唯一一份 prompt
<primary-repo>/.codex/<slug>/reviewer/<YYYY-MM-DD>/qa-report.md               ← reviewer-A 报告
<primary-repo>/.opencode/<slug>/reviewer/<YYYY-MM-DD>/qa-report.md            ← reviewer-B 报告

副仓不落任何 AC 产出。
```

**reviewer 工作流**(以跨多仓 QA 回归为例):

1. reviewer 在**主仓**读到 prompt 文件
2. reviewer 按 prompt 头部"仓库与分支"段,自己 cd 到副仓跑验证命令
3. reviewer 把所有仓的验证结果汇总到**主仓的一份报告**中
4. 报告里 §1 "跑过的验证"表显式列出每个仓的验证状态(已通过 / 未验证 / 不适用)

> v1.3-v1.7 行为:prompt 仅主仓,报告每仓镜像。v1.8 起全部仅主仓。老版本的副仓报告镜像不需要主动删。

### 2.5 主仓的认定

**主仓 = skill 触发时的当前工作目录(cwd)**。

- 用户从哪个仓发起 skill,那个仓就是主仓
- 该仓的 `.claude/<slug>/` 是**所有 AC 产出的唯一落点**
- prompt 头部"仓库与分支"段必须明确列出主仓 + 所有副仓的绝对路径,这样 reviewer 不论从哪个 cwd 启动都能 resolve

**反例**:用户从随手切到的子目录调起 skill,主仓被当成了某个不该是主仓的仓 → 主 agent 应当用 `git rev-parse --show-toplevel` 解到仓根再当主仓。

如果一次需求从主仓发起,但 reviewer 的回归动作主要发生在副仓(典型:后端发起 / CLI 副仓做主要回归),仍然按 cwd 算主仓 — prompt 在主仓,reviewer 自己 cd 到副仓跑命令,产出报告只在主仓写一份。

## 3. 本地联调技巧:fetch hijack preload

当客户端要在本地未发版的后端上做联调时,**优先用 Node `NODE_OPTIONS --import` + preload fetch hijack 重定向出站 URL**,而不是临时改 `src/config/*.conf.ts` 后 `git checkout --` 还原。

### 3.1 为什么推荐 fetch hijack

- **git status 全程零修改**:避免误漏还原、避免 dirty tree 混入后续 commit
- **无需重新编译**:产物不变,hijack 在运行时改路由
- **对 QA 硬约束 §4 "不得 git checkout" 友好**:彻底不动源码

### 3.2 完整示例

```powershell
# Windows PowerShell

# 1. 生成 hijack mjs(放 %TEMP% 或临时目录,勿入仓)
$hijack = "C:\Users\$env:USERNAME\AppData\Local\Temp\fetch-hijack.mjs"
Set-Content -Encoding utf8 $hijack @'
const origFetch = globalThis.fetch;
globalThis.fetch = (url, opts) => {
  if (typeof url === "string") {
    url = url.replace(/^https?:\/\/[^/]+/, "<target-base-url>");
  }
  return origFetch(url, opts);
};
'@

# 2. 注入运行
$env:NODE_OPTIONS = "--import=file:///$($hijack -replace '\\','/')"
cd <secondary-repo>
npm run build:test
node bin/<entry>.js <module> +<command>
# ... 其他命令 ...

# 3. 收尾:清 mjs 文件 + unset NODE_OPTIONS
Remove-Item $hijack
Remove-Item Env:\NODE_OPTIONS
```

```bash
# Linux / macOS bash

# 1. 生成 hijack mjs
HIJACK=$(mktemp --suffix=.mjs)
cat > "$HIJACK" <<'EOF'
const origFetch = globalThis.fetch;
globalThis.fetch = (url, opts) => {
  if (typeof url === "string") {
    url = url.replace(/^https?:\/\/[^/]+/, "<target-base-url>");
  }
  return origFetch(url, opts);
};
EOF

# 2. 注入运行
export NODE_OPTIONS="--import=file://$HIJACK"
cd <secondary-repo>
npm run build:test
node bin/<entry>.js <module> +<command>

# 3. 收尾
rm "$HIJACK"
unset NODE_OPTIONS
```

### 3.3 何时 fallback 到临时改配置文件

- fetch hijack 在特定 Node/Undici 版本下不兼容(已知:Node 18- 的 experimental fetch + `--import` 某些组合)
- 需要测试**配置其他字段**(host / port / 路由前缀等),不止 base URL

此时可临时改对应配置文件,但**必须**:
- 改动只在一次回归过程中存在
- 回归结束**立刻** `git checkout -- <配置文件路径>` 还原(主 agent 自己 OK,reviewer 不能动)
- 在 QA 报告里明确记录"临时改 / 已还原",避免审阅者以为漏修

## 4. 跨仓 commit 顺序与回滚

### 4.1 顺序

跨仓提交时,**先 push 契约方**,再 push 消费方:

```bash
# 在后端仓
git push origin feature/520-travel-skill

# 等后端 push 成功后
cd ../cli-repo
git push origin feature/520-travel-skill
```

### 4.2 跨仓回滚

如果消费方上线后发现契约对接有问题:

| 严重度 | 处置 |
|---|---|
| 契约错误,消费方完全跑不了 | 回滚消费方分支(契约方保留,等修后再上消费方) |
| 契约不一致但消费方有 fallback | 修一行消费方 patch 兜住 |
| 数据有错,但流量小 | 双方都不滚,在线修(注意先停消费方写) |

**避免**:同时回滚两侧 → 中间态可能两边都不一致;通常单侧回滚更安全。

## 5. 多仓典型踩坑表

| 症状 | 原因 | 解法 |
|---|---|---|
| MR 提到了错误分支(显示无 diff) | 默认分支不一致(master vs main) | 提 MR 前查 origin HEAD;PR 模板写明 base branch |
| 后端没 push 就在 CLI 联调 | 跨仓顺序颠倒 | 先 push 契约方;本地联调用 fetch hijack 顶住 |
| reviewer 跑 CLI 但找不到接口 | 后端代码没合到 CLI 跑的环境 | 在 prompt 里明确写"CLI 应打 `<本地后端>` / `<测试环境>`",不要默认走线上 |
| 跨多仓 token 失效 | `.env` 在每个仓都有一份,只更新了一个 | 把 token 维护抽到统一位置,或 `.env` 用 symlink |
| 跨仓 commit 有 dirty 临时文件 | 联调时改了 conf 没还原 | 用 fetch hijack 替代;若用了 conf 改动,push 前 `git status` 强制扫一遍 |
| reviewer 在副仓找不到 prompt | 老习惯每仓找 prompt(1.2.0 行为) | v1.3.0 起 prompt 只在主仓;v1.8 所有产出只在主仓;reviewer 应从用户给的绝对路径读 |
| prompt 跨仓内容不一致 | 老 1.2.0 镜像不同步 | v1.3.0 起单份主仓,不再有镜像不同步问题 |
| reviewer 误读副仓老 prompt | 副仓 `.claude/` 有历史镜像的 prompt | reviewer **只读用户给的绝对路径**,不要 ls 副仓 `.claude/` |
| 副仓路径在本机不存在 | 用户在另一台机器 clone 位置不同 / 副仓未同步到本地 | reviewer 把该副仓标"未验证(路径不存在)"继续验其它仓;报告里 §1 跑过的验证表显式列出 |
| 只跑了部分副仓 | reviewer 时间紧只 cd 进了后端 | 报告 §1 表列出每个仓的验证状态(已通过/未验证-未进入),覆盖情况一目了然 |
| 副仓报告镜像没人看 | v1.7 及更早每仓镜像,实际审阅都在主仓 | v1.8 起**不再镜像**,报告只在主仓;审阅者只看主仓即可 |

## 6. 多仓 + AC 协同的产物布局(v1.8)

```
backend-repo/                              ← 主仓(skill 触发时的 cwd),**所有 AC 产出唯一落点**
  .claude/<slug>/
    index.md                               ← AC 结论索引
    summary.md                             ← 决策概要
    prd.md                                 ← <CALENDAR_PLATFORM>转存的 PRD(如有)
    tech-design.md                         ← 技术方案最终版
    <YYYY-MM-DD>/
      tech-review-prompt.md                ← 模式 B 提示词
      qa-regression-prompt.md              ← 模式 A 提示词
      case-studies/round-N-NNN-*.md        ← 多轮回归(如适用)
  .codex/<slug>/reviewer/<YYYY-MM-DD>/
    {方案名}-evaluation.md                 ← reviewer-A 模式 B 报告
    qa-report.md                           ← reviewer-A 模式 A 报告
  .opencode/<slug>/reviewer/<YYYY-MM-DD>/
    {方案名}-evaluation.md                 ← reviewer-B 模式 B 报告
    qa-report.md                           ← reviewer-B 模式 A 报告

cli-repo/                                  ← 副仓
  (不落任何 AC 产出;reviewer cd 进来跑验证命令后回主仓写报告)
```

**规则**:
- **所有 AC 产出**(prompt / 报告 / 方案 / slug 目录)**仅主仓**
- reviewer 在主仓读 prompt,在副仓跑验证,在主仓写报告
- 副仓 `.claude/` `.{reviewer}/` 下不创建 AC 相关目录

> v1.2-v1.7 行为:prompt 仅主仓,报告每仓镜像;v1.8 起全部仅主仓。已存在的副仓历史报告不需要主动删。

## 版本记录

- v1.4.0 (2026-06-25):v1.8.0 同步。§2.4 重写为"产出仅主仓"(删除报告镜像);§6 产物布局完全重写(删副仓示例,全部 AC 产出仅主仓);踩坑表更新(删镜像相关条目,加"镜像没人看"条目);路径加 `<slug>/` 层级;§0 词汇表更新
- v1.3.0 (2026-05-26):v1.4.0 同步。§0 新增"路径占位符词汇表(多仓上下文)",指向 `archive-and-blind.md` §0 完整定义,本文件突出 `<primary-repo>` / `<secondary-repo-N>` / `<all-repos>` 在多仓语境的具体语义
- v1.2.0 (2026-05-25):v1.3.0 同步。报告镜像扩为 N reviewer(N=2 默认 / N≥3 配置时按数);§2.4 / §6 产物布局加 reviewer-C/D/... 示例
- v1.1.0 (2026-05-25):v1.3.0 同步。prompt 从"每仓镜像"改为"仅主仓单份(=skill 触发时的 cwd)";报告仍每仓镜像。加 §2.5 主仓认定段、§6 产物布局更新、踩坑表新增 v1.3 行为变化条目
- v1.0.0 (2026-05-21):首版,从 <DASHBOARD> `qa-cross-validation.md` v1.3 中"CLI 本地回归推荐手法"提级,加判定信号、分支对齐、commit 顺序、跨仓回滚、典型踩坑表
