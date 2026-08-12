# multi-reviewer

> **N+1 AI agent 协同 + 多仓同步编码** 的工作协议,作为 Codex / Claude Code plugin 分发。
> 短别名:**mrcc**。交互时可以直接说"用 mrcc 评审方案"或"用 mrcc 跑 QA 回归",也可以手动调用 `/skill mrcc`。

插件内置 `references/reviewer-workmode.md`，统一 reviewer 的双盲派发、验证白名单、
基线债阻断、Codex 断流转 zcode、mico 映射和 ≤200 字标准化总结。B2 技术方案、B3
测试方案和 A QA 回归在确认 Java 后端范围时，自动加载 `references/java-backend-standard.md`
核查命名、分层、事务、异常、SQL、日志和测试范围；B1/B4 与非 Java 任务不受影响。
这次增强仍保持 review-only，不新增 Coder 入口或业务代码生成能力。

**1 主实现 + N 独立评审**(默认 N=2,可配置 1-N≤26):

- **主 agent**:**触发 skill 的 agent**(claude / cursor / cline / codex / opencode 等任一);**编码独占** — 写代码 / 改源码 / git 写操作 仅由主 agent 做,避免多 agent 同时编码冲突
- **N 个 reviewer**:默认 codex + opencode;可在 init 时通过 `--reviewer-c=cursor --reviewer-d=cline ...` 扩到任意 N 个;reviewer 一律只读不写源码
- **N 路双盲**:reviewer 之间互不参考(对称严格);主 agent 拿 N 份独立产出做"多数共识"对比

配合多仓同步编码与本地联调技巧,形成一套抗"自验自卖"盲点的 AI Coding 工作方式。

## Quick Start

安装 plugin 后,进入你的业务项目仓并初始化项目级规则与 prompt 母板:

```bash
cd <your-repo>
node ~/.claude/skills/multi-reviewer/scripts/init.mjs --yes
```

然后填写本项目鉴权和工具链信息:

- `.claude/rules/auth.md`
- `.claude/rules/env-tools.md`

最后对主 agent 说一句触发词,例如:

- “用 mrcc 跑一次技术方案评审”
- “代码改完了,用 mrcc 跑 QA 回归”

第一次只需要记住两件事:

- **安装后先跑 `init.mjs --yes`** 生成 `.claude/rules/`
- 之后用 **“mrcc / 评审 / 跑回归 / 交叉验证”** 这类关键词触发 skill

## 为什么要这套协议

单一 AI agent 自己写代码 + 自己做 QA 容易出现:

- **同源盲点**:实现思路与验证思路源自同一上下文,系统性遗漏
- **过度自信**:agent 倾向于"按照设计文档说能行"声明完成,缺乏外部对照
- **多仓割裂**:前后端、CLI 端单 agent 撑不下完整跨仓的并发、契约、时序问题
- **回滚成本高**:盲点发现往往在合入后,跨仓回滚比单仓回滚复杂数倍

## 5 种触发场景

主 agent 进入 skill **第一件事**:`AskUserQuestion` 5 选 1 扁平,不靠语义猜。

| 编号 | 场景 | reviewer 数量 | 产出文件名 |
|---|---|---|---|
| **B1** | 产品方案评审 | **1**(LLM 评产品主观题易同源偏差,**单 reviewer 例外**) | `{方案}-{版本}-evaluation.md` × 1 |
| **B2** | 技术方案评审 | 2(双盲) | `{方案}-{版本}-evaluation.md` × 2 |
| **B3** | 测试方案评审(前置=已通过的产/技方案) | 2(双盲) | 同上 × 2 |
| **B4** | 上线方案评审 | 2(双盲) | 同上 × 2 |
| **A**  | QA 回归(编码后) | 2(双盲) | `qa-report.md` × 2 |

```
              用户
               │
               ▼
       主 agent (claude / cursor / ...)
       │  AskUserQuestion 5 选 1 → brainstorming → 方案 → 编码 → 自测
       │
       ├─ B1 产品方案 → 单 reviewer(贴给 A 或 B 任一)
       │                            ↓
       │                  .{rev}/<slug>/reviewer/<date>/evaluation.md
       │                            ↓
       │              主 agent Spike 复核"假设外露"段
       │
       ├─ B2/B3/B4 方案 → reviewer-A & reviewer-B 双盲并行
       │                            ↓
       │                  .{a}/<slug>/reviewer/<date>/  .{b}/<slug>/reviewer/<date>/
       │                  evaluation.md        evaluation.md
       │                            ↓
       │                       三份产出交叉对比
       │
       └─ A QA 回归 → reviewer-A & reviewer-B 双盲
                                    ↓
                          .{a}/<slug>/reviewer/<date>/qa-report.md
                          .{b}/<slug>/reviewer/<date>/qa-report.md
                                    ↓
                          三份产出交叉对比(v1.9:产出仅主仓)
```

reviewer-A / reviewer-B 不写源码、不 commit、不看对方报告;
主 agent 拿三份产出做对比,逐条 finding 用 AskUserQuestion 跟用户共识修/延后/不修。

## 安装

### 方式 1:Codex plugin marketplace(推荐)

```bash
codex plugin marketplace add https://github.com/varianceso/multi-reviewer
codex plugin add multi-reviewer@multi-reviewer-marketplace
```

如已配置 SSH key,可走 SSH:

```bash
codex plugin marketplace add https://github.com/varianceso/multi-reviewer.git
codex plugin add multi-reviewer@multi-reviewer-marketplace
```

如果之前已经添加过 marketplace,请先刷新快照:

```bash
codex plugin marketplace upgrade multi-reviewer-marketplace
codex plugin add multi-reviewer@multi-reviewer-marketplace
```

安装后请新开一个 Codex 线程,让新插件和 skill 生效。首次进入业务仓后可直接说:

```text
使用 mrcc 初始化当前仓库
```

Codex 会从已安装插件中加载 skill,并执行其自带的 `scripts/init.mjs`。

### 方式 2:Claude Code plugin marketplace

```
/plugin marketplace add https://github.com/varianceso/multi-reviewer
/plugin install multi-reviewer
```

如已配置 SSH key,可走 SSH:

```
/plugin marketplace add https://github.com/varianceso/multi-reviewer.git
/plugin install multi-reviewer
```

### 方式 3:手动 clone(无 plugin 系统时)

```bash
# HTTPS
git clone https://github.com/varianceso/multi-reviewer ~/.claude/skills/multi-reviewer-src
# 或 SSH
git clone https://github.com/varianceso/multi-reviewer.git ~/.claude/skills/multi-reviewer-src

ln -s ~/.claude/skills/multi-reviewer-src/skills/multi-reviewer ~/.claude/skills/multi-reviewer
```

(Windows 用 `mklink /D` 替代 `ln -s`)

## 第一次使用

### 1. 在你的项目仓里 bootstrap

Codex 用户直接在新线程中说:

```text
使用 mrcc 初始化当前仓库
```

Claude Code 或手动 clone 用户可执行:

```bash
cd <your-repo>
node ~/.claude/skills/multi-reviewer/scripts/init.mjs
```

或自定义默认 2 reviewer:

```bash
node ~/.claude/skills/multi-reviewer/scripts/init.mjs --reviewer-a=cursor --reviewer-b=cline
```

或扩展到 N 个 reviewer(字母循环 a-z 最多 26 个):

```bash
node ~/.claude/skills/multi-reviewer/scripts/init.mjs \
  --reviewer-a=codex \
  --reviewer-b=opencode \
  --reviewer-c=cursor \
  --reviewer-d=cline
# 4 个 reviewer 配置成功
```

### 2. 填写本仓实例

`init.mjs` 会创建 `<your-repo>/.claude/rules/` 含:

| 文件 | 你需要做 |
|---|---|
| `auth.md` | 填鉴权机制(JWT / Cookie / OAuth / API Key / Custom 等),凭据来源、curl 模板、排错表 |
| `env-tools.md` | 填编译/启动工具链(语言版本、构建命令、常见踩坑) |
| `product-review-prompt.md` | B1 产品方案母板(单 reviewer),新需求 cp 到 `.claude/<slug>/<date>/` 填占位符 |
| `tech-review-prompt.md` | B2 技术方案母板(双盲) |
| `test-plan-review-prompt.md` | B3 测试方案母板(双盲) |
| `rollout-review-prompt.md` | B4 上线方案母板(双盲) |
| `qa-regression-prompt.md` | A QA 回归母板(双盲),编码后用 |
| `README.md` | 自动生成,指向 skill references |

### 3. 在仓根 `CLAUDE.md` 追加协议引用

```markdown
## 三方协同协议

本仓使用 [multi-reviewer](https://github.com/varianceso/multi-reviewer) skill。

- 项目本地实例:`.claude/rules/`
- 协议主体:skill 自带 `references/` (随 skill 升级而更新)
```

### 4. 把归档目录加进 `.gitignore`

```
.claude/
.codex/
.opencode/
```

(若用其它 reviewer,加对应目录)

## 触发方式

skill 的 description 涵盖:
- 非琐碎编码任务(业务逻辑、API 契约、新 SQL、0→1 能力、跨多仓)
- **任何方案要进下一阶段**(产品 / 技术 / 测试 / 上线)
- 触发线索词:mrcc / 评审 / 评估 / 看下方案 / 审方案 / 代码改完 / 跑回归 / 交叉验证

主 agent 进入 skill 后**第一件事**会用 `AskUserQuestion` 让你 5 选 1。

也可以手动调:

```
/skill multi-reviewer
/skill mrcc
```

## 跳过场景(skill 不应触发)

- 一行 typo / 注释 / README 文字调整
- 纯重命名 / 纯移动重构
- 实验性 / 临时脚本
- 用户明确说"直接编码,不用 QA"

## 文件布局

```
multi-reviewer/
├── README.md                              ← 本文件
├── LICENSE                                ← MIT
├── .codex-plugin/plugin.json              ← Codex plugin manifest
├── .agents/plugins/marketplace.json       ← Codex marketplace
├── plugins/multi-reviewer/              ← Codex marketplace install source
├── .claude-plugin/plugin.json
├── marketplace.json                       ← Claude marketplace
├── skills/
│   ├── mrcc/
│   │   └── SKILL.md                       ← `mrcc` 短别名 skill
│   └── multi-reviewer/
│       ├── SKILL.md                       ← 索引主体(中文 + 英文 description)
│       ├── references/                    ← 协议详细规则(随 skill 升级)
│       │   ├── cross-validation.md            模式 A/B + 四子模式 + 双盲
│       │   ├── plan-review-perspectives.md    四类方案视角差异 (v1.3 新增)
│       │   ├── multi-repo.md                  多仓同步 + prompt 单源化
│       │   ├── archive-and-blind.md           归档目录 + 双盲铁律
│       │   ├── hard-constraints.md            QA 7 条硬约束
│       │   ├── report-format.md               报告骨架与严重度
│       │   ├── filling-prompts.md             占位符填法 + dispatch
│       │   └── multi-round-regression.md      多轮 case 沉淀
│       ├── templates/                     ← 占位符模板(7 份)
│       │   ├── auth.md
│       │   ├── env-tools.md
│       │   ├── product-review-prompt.md       B1 产品方案 (单 reviewer)
│       │   ├── tech-review-prompt.md          B2 技术方案
│       │   ├── test-plan-review-prompt.md     B3 测试方案 (v1.3 新增)
│       │   ├── rollout-review-prompt.md       B4 上线方案 (v1.3 新增)
│       │   ├── qa-regression-prompt.md        A  QA 回归
│       │   └── case-study.md                  多轮 case 文件骨架
│       └── scripts/
│           ├── init.mjs                   ← 跨平台 bootstrap 脚本
│           ├── smoke-test.mjs             ← init.mjs smoke tests
│           └── check-consistency.mjs      ← 协议 / 模板 / reference 一致性检查
└── docs/
    └── changelog.md
```

## 本仓自检

本仓保持零第三方依赖,自检脚本均使用 Node.js 内置模块:

```bash
node skills/multi-reviewer/scripts/smoke-test.mjs
node skills/multi-reviewer/scripts/check-consistency.mjs
```

建议在修改 `scripts/init.mjs`、`SKILL.md`、`references/` 或 `templates/` 后都跑一次。

## FAQ

### 我只想让 1 个 reviewer 跑 QA,可以吗?

可以临时只采纳 1 份报告,但协议默认仍建议 B2/B3/B4/A 使用 2 个 reviewer 双盲。B1 产品方案是唯一固定单 reviewer 的模式。

### reviewer 可以顺手修 bug 吗?

不可以。reviewer 一律只读不写源码,只能在报告里写建议。写代码 / 改源码 / git 写操作由主 agent 独占。

### reviewer 能看主 agent 的自测结论吗?

不要看判断性结论。事实性信息可以写进 prompt,例如环境、数据规模、已批准接口;“我认为这里没问题”这类结论不能喂给 reviewer。

### 多仓时为什么副仓不放 prompt?

v1.9 起产出仅主仓:prompt 只放主仓 `.claude/<slug>/<date>/`,报告也只在主仓 `.reviewer/<slug>/<date>/` 落一份,不在副仓镜像。

### 两个 reviewer 结论冲突怎么办?

主 agent 先独立复核源码 / 配置 / 命令证据,再做三方对照。拿不准的 finding 必须问用户裁决,不能默默 dismiss。

### `.claude/`、`.codex/`、`.opencode/` 要入 Git 吗?

默认不入 Git。它们是项目本地草稿和 reviewer 归档目录,建议加入 `.gitignore`。

## 与 superpowers 系列的关系

本 skill 与 [superpowers](https://github.com/anthropics/skills/tree/main/superpowers)
**互调而非互斥**:

| 时机 | 调用 |
|---|---|
| 任何创意/编码工作开始前 | `superpowers:brainstorming` 优先 |
| 方案定稿后转编码前 | `superpowers:writing-plans` |
| 实现阶段(每个子模块) | `superpowers:test-driven-development` |
| 声明完成前 | `superpowers:verification-before-completion` |
| 自检完成需要外部视角 | **本 skill** 替代纯 self-review |

## 反馈与贡献

- Issue:https://github.com/varianceso/multi-reviewer/-/issues
- 欢迎 PR 改进 references / templates / scripts
- 重大协议改动建议先开 issue 讨论

## License

MIT — 见 [LICENSE](./LICENSE)。
