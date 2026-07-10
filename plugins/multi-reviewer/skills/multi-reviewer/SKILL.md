---
name: multi-reviewer
description: >
  Review-only workflow for already-drafted product, technical, test, or rollout plans, or already-written code needing QA regression. Alias: mrcc. Use for mrcc, multi-reviewer, crosscheck, plan/proposal/spec review, QA regression, cross-validation, multi-agent review, 评审, 看下方案, 审方案, 跑回归, 多 agent 协同, 交叉验证. Do not use for drafting plans, designing solutions, writing code, implementing features, typo-only edits, pure renames, README wording, or one-off scripts; use superpowers first for brainstorming, writing plans, coding, and self-verification. Coordinates one main implementer with N independent reviewers, double-blind review where applicable, B1 single-reviewer exception, multi-repo prompt/report discipline, and .claude/rules bootstrap.
---

# multi-reviewer

短别名:**mrcc**。

## 0. 一句话概览

> ⚠️ **本 skill = 核验环,不是设计/编码环**。
>
> **是什么**:对**已经定稿的方案** / **已经写完的代码**做多 agent 双盲交叉验证,找盲点、抓回归、防同源偏差。
>
> **不是什么**:**不**用来出方案、做设计、写代码、写实施计划、做需求脑暴。这些是 `superpowers` 系列 (`brainstorming` / `writing-plans` / `test-driven-development` / `verification-before-completion`) 的事;走完那些再来这里跑评审 / 回归。
>
> **v1.10 要点**:
> - reviewer 产出路径加 `reviewer/` 层级:`.{reviewer}/<slug>/reviewer/<YYYY-MM-DD>/`
> - 主 agent 路径 `.claude/<slug>/<YYYY-MM-DD>/` 不变
>
> **v1.9 要点**:
> - 归档路径加 `<slug>/` 层级(对齐多 agent 协同惯例)
> - 多仓 QA 产出仅主仓,不再镜像副仓
> - slug 下 index/summary 只记结论,不记中间产物
> - 新建 slug 时<CALENDAR_PLATFORM> PRD 自动转存为 `prd.md`
> - 方案只保留一份最终版(不带版本号,不含 AC 评审痕迹)
> - slug 目录范围扩展:规划文档(PRD / tech-design / coder-task / DDL)放 slug 根目录(详见 `archive-and-blind.md` 更新版 §2.5)
> - 加固 mirror 完整性:`check-consistency.mjs` 校验全部 24 个 skill 文件在 `skills/` 与 `plugins/` 间字节一致
>
> **典型反例**(主 agent 不应该进本 skill 的场景):
> - 用户说"帮我设计一下 v2 方案" → ❌ 错误地进 5 选 1;✅ 应先调 `superpowers:brainstorming` + `writing-plans`,等方案定稿再回来选 B2
> - 用户说"写一个 OD 接口" → ❌ 错误地进编码;✅ 应先调 `superpowers:test-driven-development`,实现 + 自检完成后回来选 A QA 回归
> - 用户说"出个测试方案" → ❌;✅ 同上,先 superpowers 写 → 再回来选 B3 评审

**1 主实现 + N 独立评审**(**默认 N=2,可扩展到 3-26**;B1 产品方案永远 1 reviewer 例外)的**核验**协同 + 多仓同步评审工作协议,覆盖 **5 种触发场景**:

- **B1 产品方案评审**(编码前;**单 reviewer 例外**,LLM 评产品主观题易同源偏差)
- **B2 技术方案评审**(编码前;双盲)
- **B3 测试方案评审**(编码前;双盲;前置=已通过的产品/技术方案)
- **B4 上线方案评审**(编码前;双盲)
- **A QA 回归**(编码后;双盲)

主 agent **进入 skill 第一件事:AskUserQuestion 5 选 1 扁平**,不靠语义猜。

| 角色 | 谁 | 干什么 |
|---|---|---|
| **主 agent** | **触发 skill 的那个 agent**(claude / cursor / cline / codex / opencode 等任一) | **本 skill 范围内**:生成 prompt、与 reviewer 派发协调、N+1 份产出对比、与用户交互式逐条裁决、回归。**本 skill 范围外**(**先用 superpowers 完成再回来**):需求分析(`brainstorming`)、方案设计(`writing-plans`)、编码(`test-driven-development`)、自检(`verification-before-completion`)。注意编码独占铁律仍由主 agent 承担,但**编码动作本身不在本 skill 流程内**。 |
| reviewer-A / B / C / ... | 例:codex / opencode / cursor / cline 等(用户在 init 时配置)| 独立评审 / 回归;数量 **默认 2,可扩展到 3-26**;N reviewer 都受 hard-constraints 约束(只读不写源码) |

> **主 agent 怎么确定**:用户在哪个 agent session 里触发本 skill,那个就是主 agent。一次需求**只有一个主 agent**贯穿始终。
>
> **编码独占铁律**:**写代码 / 改源码 / 跑构建 / 提交 git 写操作 = 主 agent 独占**。reviewer 一律只读不写(详见 `references/hard-constraints.md` §1)。这个分工是为了避免多 agent 同时编码冲突。
>
> **reviewer 数量**:默认 2(reviewer-a + reviewer-b);项目 init 时可加 `--reviewer-c=cursor --reviewer-d=cline ...` 扩到 3-26。**单 reviewer(N=1)不通过 init.mjs 通用支持** — 如果某项目只想要 1 个 reviewer 跑 B2/B3/B4/A,推荐改走 B1 单 reviewer 模式;否则保留默认 2,只用其中一个的报告也可,主 agent 按 1 份对比即可。**B1 产品方案例外永远是 1 reviewer**(贴手边任一,与 N 配置无关)。
>
> **reviewer agent 实例**:Cursor / Cline / Qoder / Aider / Codex / OpenCode / Claude(不同 session)等任何能独立跑提示词、独立产出 markdown 报告的 AI 工具皆可代入。

---

## 1. 何时用 / 何时不用

| 用 | 不用 |
|---|---|
| 业务逻辑 / 接口契约 / 数据权限 | typo / README 文字 |
| 鉴权链路 / 新数据源 / 新 SQL 设计 | 纯重命名重构(编译通过即可) |
| 0→1 新能力 | 已有功能纯字段补充(无语义变化) |
| 跨多仓改动(后端 + CLI / 前端) | 实验性 / 一次性临时脚本 |
| **产品 / 技术 / 测试 / 上线 任一方案要进下一阶段** | 用户明确说"直接改,不用 QA" |
| 任何"改坏了不可回滚"风险 | — |

**判断口径**:如果用户的需求里**任一**触发条件命中,就走本协议;只要全部命中"不用"列才能跳过。

## 1.1 触发关键词(给 LLM 自动识别 + 给用户参考)

**强触发**(命中即应该自动触发本 skill;主 agent 进来后第一件事 5 选 1):

| 中文 | 英文 | 默认走 |
|---|---|---|
| **评审** / 评估 / 看下方案 / 审方案 / review 一下方案(注意:**已有方案**的评审,而不是"设计方案") | plan review / proposal review / spec review / design review | 模式 B(进 5 选 1 选子类) |
| 跑回归 / QA 回归 / 测试回归 / 代码改完帮我验 / 帮我跑下测试 | qa regression / regression test / verify implementation | 模式 A |
| 三方协同 / 双盲评审 / 交叉验证 / 多仓回归 / cross-check / cross-validation | tri-agent / double-blind review / cross-validation review | 5 选 1 让用户决定 |

> **重要边界**:中文里"拍方案 / 出方案 / 设计方案 / 写方案"是**起草动作**,不是评审动作。这些词**不触发本 skill** — 应先调 `superpowers:brainstorming` + `superpowers:writing-plans`。等用户产出方案文档后,关键词从"拍方案"变成"评审方案 / 看下方案 / 审方案"才进本 skill。

**弱信号**(可能触发,但优先让 superpowers 处理):

| 关键词 | 优先 skill | 理由 |
|---|---|---|
| 头脑风暴 / brainstorm / 想想需求 | `superpowers:brainstorming` | 需求澄清阶段,本 skill 还轮不到 |
| 写个实施计划 / writing plan / 出个 spec | `superpowers:writing-plans` | 方案撰写,完成后再走本 skill 评审 |
| 实现一下 / implement / 写代码 / TDD | `superpowers:test-driven-development` | 编码阶段,完成后再走本 skill QA 回归 |
| 上线前自检 / verify before complete | `superpowers:verification-before-completion` | 自检阶段,**自检完成**后转交本 skill 做外部评审 |
| 做个新功能 / 加个能力 / 设计一下 | (不直接触发) | 需求颗粒度不够,先 brainstorm |

**排除**(明确不触发本 skill):

- **🚫 红线:出方案 / 设计方案 / 拍方案 / 写代码 / 实现一下 / 加个能力 / 做个新功能 / 出实施计划** — 这些是**起草/产出**动作,本 skill **不做**。必须先调 `superpowers` 完成,**完成后**关键词变成"评审 / 跑回归"才进本 skill
- 一行 typo / 注释 / README 文字调整
- 纯重命名 / 纯移动重构
- 实验性 / 临时脚本类一次性产出
- 已有功能纯字段补充(无语义变化)
- 用户明确说"不用 QA / 直接编码"

**与 superpowers 互调**(详见 §9):
- 本 skill 触发后可主动调用 superpowers(brainstorming → writing-plans → tdd → verification);
- superpowers 跑完 verification 后,**自检完成需要外部视角时转交本 skill**;
- 两个 skill 系统**不抢**:本 skill 守"外部评审 / 跨仓协同 / 三方对比"的位,superpowers 守"个人创意 / 实施 / 自检"的位。

如果你不确定本次是否该触发本 skill,**主 agent 直接 AskUserQuestion 5 选 1 即可** — 用户选了再继续。误触发的成本(多问一次)远低于漏触发(默认进编码路径)。

**触发实战提示**(给用户):
- 想稳定触发本 skill,**最有效的关键词是 "评审已定稿方案 / 跑回归 / 三方协同 / 交叉验证"** — 这些词在 description 和本节都被明示;关键是"评审"指**审视已有产物**,不是"设计/出方案"
- 也可以直接 `/skill multi-reviewer` 手动调
- 还可以说 "用 mrcc 帮我看下..." 或 "用 multi-reviewer 帮我看下..." 显式触发(已有方案 / 已有改动)
- **如果你说"帮我设计 v2 方案",主 agent 应该先调 `superpowers:brainstorming` 而不是本 skill** — 设计完后再来评审

---

## 2. 决策树(主 agent 进入 skill 前两件事:slug → 5 选 1)

```
用户给出已定稿方案 / 改完代码(注意:出方案/写代码先走 superpowers,不进本 skill)
    │
    ▼
本仓有 .claude/rules/ ?
    │  否 → 跑 scripts/init.mjs 一次 bootstrap
    │  是 → ↓
    ▼
┌─────────────────────────────────────────────────┐
│  ⚡ 第 0 件事 — slug AskUserQuestion(v1.6)      │
│                                                 │
│  「本次需求挂在哪个 slug 下?」                  │
│   - 选已有(列出 .claude/<slug-X>/ 目录列表)    │
│   - 新建(用户输 kebab-case slug)               │
│   - 一次性 spike(不入需求目录)→ slug=_oneoff_ │
└─────────────────────────────────────────────────┘
    │
    ▼  (拿到 slug 后)
    ├─ 新建 slug → 创建 .claude/<slug>/ 目录 + index.md/summary.md 骨架
    │              └─ 用户提供<CALENDAR_PLATFORM> PRD URL? → 用<CALENDAR_PLATFORM> MCP fetch-doc 转存为 .claude/<slug>/prd.md
    ├─ 已有 slug → 立即 Read .claude/<slug>/summary.md(拾跨日决策史)
    │              └─ 同时 Read .claude/<slug>/prd.md(如无也可)
    ▼
┌─────────────────────────────────────────────────┐
│  ⚡ 第 1 件事 — AskUserQuestion 5 选 1           │
│                                                 │
│  「本次走哪种核验?」(5 选 1 扁平,不嵌套)     │
│   1) 产品方案评审  (B1,**单 reviewer 例外**)   │
│   2) 技术方案评审  (B2,双盲)                   │
│   3) 测试方案评审  (B3,双盲;前置=已通过的产/技) │
│   4) 上线方案评审  (B4,双盲)                   │
│   5) QA 回归       (A,编码后,双盲)            │
└─────────────────────────────────────────────────┘
    │
    ├─ 选 1 (B1) → 复制 templates/product-review-prompt.md → .claude/<slug>/<date>/
    │              (全部 AC 产出仅主仓;v1.8)
    │              告诉用户:「贴给 reviewer-A 或 reviewer-B 任一即可」
    │              等回 .{rev}/<slug>/reviewer/<date>/{方案名}-evaluation.md(只一份)
    │              主 agent 复核 reviewer 的"假设外露"段
    │              假设站不住的 finding dismiss,站得住的 → AskUserQuestion 逐条
    │
    ├─ 选 2/3/4 (B2/B3/B4) → 复制 templates/{tech|test-plan|rollout}-review-prompt.md
    │              (主仓单份)→ 用户分别贴给 A 和 B
    │              等回 .{a}/<slug>/reviewer/<date>/ + .{b}/<slug>/reviewer/<date>/ 各一份
    │              三份产出交叉对比 → 修订方案 → 进入下一阶段
    │
    └─ 选 5 (A) → 复制 templates/qa-regression-prompt.md → .claude/<slug>/<date>/
                   (全部 AC 产出仅主仓,不镜像副仓;v1.8)
                   用户分别贴给 A 和 B
                   等回 .{a}/<slug>/reviewer/<date>/qa-report.md + .{b}/<slug>/reviewer/<date>/qa-report.md
                   三份对比 → AskUserQuestion 逐条 → 合 / 补测 / 不合

跨多仓需求:在任一模式上叠加"多仓同步"分支(详见 §4)
全流程(B → 编码 → A):分次调 skill 即可,协议不强串联
多轮回归:第 N+1 轮在 prompt "前轮已知盲点"段塞 case 路径(详见 references/multi-round-regression.md)
```

**重要**:
- **第 0 件事**(slug 入口,v1.6 引入,v1.8 升级):获取需求 slug,产物物理落 `.claude/<slug>/<YYYY-MM-DD>/`;需求根 `.claude/<slug>/` 挂 index/summary/prd/方案/iteration-log(详见 §5 + `archive-and-blind.md` §2.5)。一次性 spike 用 `_oneoff_` 跳过需求目录。
- **第 1 件事**(5 选 1)是**强制**的 — 不要凭语义猜默认进编码路径。哪怕用户 message 看起来很明确(如"代码改完了帮我跑回归"),AskUserQuestion 也快得很,不会打断流。
- 两步合计 ~5 秒,换来跨日 / 跨会话不丢决策史 + 不误触发,值得。

四类方案视角差异 + 产品方案为何单 reviewer → `references/plan-review-perspectives.md`

---

## 3. N+1 协同(主 agent + N reviewer)

精简版角色:

| 角色 | 职责 | 不做什么 |
|---|---|---|
| **主 agent**(触发 skill 的 agent) | 需求分析、方案设计、**编码独占**、自测、写交叉验证提示词、N+1 份报告对比裁决、与用户逐条裁决 | 不做最终 QA 回归(避免自己验自己) |
| **reviewer-A / B / C / ...**(N 个,默认 2) | 独立专家:评审方案 / 编码后 QA 回归 | **不改源码、不跑构建、不 commit、不清环境、不看其他 reviewer 产出**(N 路双盲) |
| **用户** | 提需求、审方案、审 PR、三方结论分歧时仲裁 | — |

> **编码独占**:`reviewer 一律只读不写源码`(`hard-constraints.md` §1);N 越大,这条铁律越重要 — 多 agent 同时编码 = 冲突灾难。哪怕 reviewer 看到"明显的 bug 一行 fix",也不能改,只能在报告里写"建议这样改"。

**N 路双盲铁律(B2/B3/B4/A)**:N 个 reviewer **互不参考对方**的过程与产出。把任一对方结论提前喂另一个,会让其停在"照着清单复跑",失去交叉价值。N=3 / 4 时双盲对称要求更严:不能让 A 看 B 的、也不能让 A 看 C 的。

**B1 产品方案例外(单 reviewer)**:LLM 评产品方案时缺客观基线(用户调研 / 竞品 / 商业数据),两个 reviewer 大概率犯同一种偏差("功能完整偏好""用户成本低估""过度乐观"),双盲会复刻同一个偏差给"伪交叉"错觉。协议层放弃 B1 的双盲 — 只一份 reviewer 跑一次,主 agent 自己 Spike 复核假设。详见 `references/plan-review-perspectives.md` §2。

**N+1 份产出对比表(B2/B3/B4/A 双盲场景,N≥2)**:

| 情形 | 判定 |
|---|---|
| **严格多数(> N/2)reviewer 标 🔴 阻塞 / 报同一问题** | **必改**(N=2 时 = 2/2 都标;N=3 时 ≥ 2/3;N=4 时 ≥ 3/4;N=5 时 ≥ 3/5) |
| 不到严格多数 reviewer 标 🔴 / 报问题(包括偶数 N 时正好半数) | 主 agent 复核每份依据 → 真漏 vs 误判 → 必要时跟用户共识(偶数 N 半数=平局,不算共识) |
| 严格多数标 🟡 建议 | 取并集,按重要度分级 |
| 全员 🟢 通过 / 都不报 | 大概率稳;但若全员都未涉及某维度,要区分"都没测" vs "都测了没问题" |
| 多个 reviewer 对同一项打分相反 | 通常其中误读,主 agent 复核裁决;N 越大此情形越罕见 |
| N=3+ 时结论高度分散(每个 reviewer 给不同结论) | 这是协议本身没设计好的信号,主 agent 应当主动 Spike + 与用户共识 |

**B1 单 reviewer 对比表(只一份产出,改"假设核查")**:

| 情形 | 判定 |
|---|---|
| reviewer 标 🔴 + 假设站得住 | **必改** + AskUserQuestion 逐条 |
| reviewer 标 🔴 + 假设不成立 | dismiss(假设错位),主 agent 在裁决记录里写明 |
| reviewer 🟢 通过 | 不能默认稳 — 单视角通过比双盲弱;主 agent 必须 Spike 1-2 个高风险维度补强 |

**主 agent 核验报告纪律(v1.4 引入,v1.6 升级到 6 步;N+1 对比之前必做)**:收到 N 份报告后,**不允许直接照 reviewer 结论批量裁决**。

> **核心断言(v1.6)**:**副 agent 严格多数共识 ≠ 主 agent 自动采纳**。哪怕 N=3 时所有 reviewer 都标某 finding 阻塞,主 agent 仍必须亲自打开代码独立判断 — 主 agent 在用户交互中积累的上下文(业务理解 / 历史决策 / 未明示约束)是 N reviewer 看不到的。

必须按 6 步走:

1. **🆕 逐 finding 自查代码(强制)** — 对副 agent 报的**每条** finding,主 agent 亲自 Read 对应文件行号 ± 上下文 5-15 行,记下 1-3 行片段 + 独立判断;**不允许仅凭"严格多数共识"跳过自查直接采纳**
2. **自扫代码独立判断**(主 agent 自己 spike 关键路径,形成自判清单)
3. **三方对照**(自判 + N reviewer 报告逐条比对;不一致也是有效信号)
4. **拿不准必 AskUserQuestion(4 要素)** — 选项必带:① 副 agent 言论 ② 主 agent 自查(Step 1 的 file:line + 片段 + 判断)③ 具体例子 ④ 选项;无 4 要素的选项 = 让用户在信息真空里拍板
5. **本轮闭环**(本轮发现的问题本轮就修;不接受"留 v1.X+1"借口)
6. **ROI 低 finding 不能默 dismiss**(必须列建议 + 理由,让用户裁决)

详见 `references/cross-validation.md` §6.5(完整 6 步表 + 8 条反 anti-pattern)+ §7(AskUserQuestion 4 要素骨架)。

**深读** → `references/cross-validation.md`(完整流程图、双盲四种特化、Spike 兜底、§6.5 核验纪律)
       → `references/plan-review-perspectives.md`(四类方案视角差异)

---

## 4. 多仓同步编码

精简版:

**何时算多仓?** 满足任一条:
- 改动横跨后端 + 客户端(CLI/Web/App)
- 改动横跨 ≥ 2 个独立 git 仓
- 接口契约的双方分属不同仓(例:后端定 controller,CLI 定 SDK 对接)

**多仓判定后必须做的 4 件事**:

1. **分支命名对齐**(便于跨仓追溯):各仓用相同 `feature/{需求关键字}` 或 `fix/{issue-id}` 命名
2. **默认分支不一定相同**:警惕 master vs main 不对称(常见:后端 master、前端 main)。提 MR 前查 `git remote show origin | grep HEAD`
3. **跨仓 MR 顺序**:契约定义方先合(通常后端 controller),消费方后合(通常前端/CLI)
4. **产出仅主仓**(v1.8):所有 AC 产出(prompt + 报告)只在主仓落盘,不再镜像副仓。reviewer 在副仓跑验证后回主仓写一份报告。
**v1.8 产出仅主仓**:跨多仓时**所有 AC 产出**(prompt + 报告 + 方案)只在**主仓**(= skill 触发时的 cwd)落盘。reviewer 在副仓跑验证后回主仓写一份报告。副仓不落任何 AC 产出。

```
backend-repo (主仓 = cwd)
  .claude/<slug>/<date>/qa-regression-prompt.md     ← 唯一一份 prompt
  .{a}/<slug>/reviewer/<date>/qa-report.md                   ← reviewer-A 报告
  .{b}/<slug>/reviewer/<date>/qa-report.md                   ← reviewer-B 报告

cli-repo (副仓)
  (不落任何 AC 产出;reviewer cd 进来跑验证,回主仓写报告)
```

reviewer 在主仓读到 prompt,按 prompt 头部"仓库与分支"段列出的副仓路径自己 cd 过去做验证,所有结论汇总到主仓的一份报告中。

**本地联调技巧:fetch hijack preload**(优于临时改 conf 文件):

```bash
# 用 NODE_OPTIONS --import 在客户端运行时把出站请求重定向到本地后端
# 不修改任何源码 / 配置,git status 全程零改动
# 完整示例见 references/multi-repo.md §5
```

**深读** → `references/multi-repo.md`(完整 fetch hijack 示例、临时改 conf 的还原纪律、跨仓 commit 顺序、典型踩坑表)

---

## 5. 归档 + 双盲铁律

精简版:

```
<primary-repo>/
  .claude/<slug>/               ← 需求根目录(v1.8:物理根,不再独立于日期目录)
    index.md                    ←   - AC 结论索引(只记结论;可选记录阻塞问题产物)
    summary.md                  ←   - 决策概要(只记结论,不关联中间产物)
    prd.md                      ←   - 产品 PRD(新建 slug 时从<CALENDAR_PLATFORM>转存;如有)
    tech-design.md              ←   - 方案最终版(不带版本号,不含 AC 评审痕迹)
    iteration-log.md            ←   - 方案迭代记录(仅当用户要求)
    <YYYY-MM-DD>/               ← 主 agent 的日期产物(物理文件)
  .{reviewer-a}/<slug>/reviewer/<YYYY-MM-DD>/   ← reviewer-A 的产出(默认 .codex/)
  .{reviewer-b}/<slug>/reviewer/<YYYY-MM-DD>/   ← reviewer-B 的产出(默认 .opencode/)
  .{reviewer-c}/<slug>/reviewer/<YYYY-MM-DD>/   ← reviewer-C 的产出(N≥3 时,如 .cursor/)
  ...                           ← 字母循环 a-z,最多 26 个
```

**铁律**:

- 一个 agent **只写自己的归档目录**,不跨写;主 agent 不写 reviewer 目录,reviewer 不写主 agent 目录(也不写其他 reviewer 目录)
- **所有 AC 产出仅主仓**(v1.8),不再镜像副仓
- **需求维度目录** `.claude/<slug>/` **仅主仓**,含 index/summary/prd/方案/iteration-log;副 agent **不读不镜像**(主 agent 跨会话主权区)
- **方案只保留一份最终版**(不带版本号,不含 AC 评审过程痕迹);迭代记录仅当用户要求时存 iteration-log.md
- 一次性 spike 用 `slug=_oneoff_` 跳过需求目录创建,产物只落 `.claude/<YYYY-MM-DD>/`(无 slug 层级)
- **N 路双盲**:N 个 reviewer 互不参考(默认 N=2,可配置 1-N≤26)
- **编码独占**:**写代码 / 改源码 / 跑构建 / git 写操作 = 主 agent 独占**;reviewer 一律只读不写(不论 N 是几)
- 临时文件走 OS 临时目录(`%TEMP%` / `/tmp`),不污染仓
- reviewer 的提示词里**不写**主 agent 的判断性自测结论(双盲)
- 但**事实性信息**(数据规模、可用测试角色、已批准的接口)可以写进提示词的"环境信息"段
- **B1 产品方案例外**:不双盲(永远 1 reviewer,即使配了 N>1);prompt 占位符不区分 A/B/C(用户贴给手边任一 reviewer);只产出一份报告

**深读** → `references/archive-and-blind.md`(prompt 单份口径、跨仓镜像规则、双盲四种特化、产品方案例外)

---

## 6. 评审 / QA agent 七条硬约束

任一违反 = BLOCKER,reviewer 必须停止并在报告里说明:

1. **只读不写源码** — 不修改任何源码 / 配置 / pom / package.json
2. **归档目录外不落盘** — 只写到 `<repo>/.<your-agent>/<YYYY-MM-DD>/`
3. **不动共享环境** — 不清 `~/.m2`、不清 `node_modules`、不改用户级环境变量
4. **不触碰 git 写操作** — `add`/`commit`/`push`/`reset --hard`/`checkout --` 全禁
5. **数据脱敏** — 报告里不出现 token 原文、真实姓名 / 工号 / 邮箱
6. **启动的服务必须关闭** — 本地启动的进程验完立即 kill
7. **鉴权失败时不硬跑** — 不绕过、不改配置、不伪造 token;在报告里标"未验证"

**深读** → `references/hard-constraints.md`(每条规则的反例 / 自查清单 / 踩坑场景)

---

## 7. 报告格式

精简版严重度:

| 级别 | 定义 |
|---|---|
| **BLOCKER** | 功能不可用 / 数据错误 / 安全漏洞 / 破坏零影响约束 |
| **HIGH** | 边界异常下行为不正确;方案偏差较大;覆盖明显不足 |
| **MEDIUM** | 小偏差 / 健壮性不足 / 轻微降级 |
| **LOW** | 风格 / 命名 / 注释 / 文档小问题 |
| **NOTE** | 观察 / 假设澄清 / 未验证项 / 建议补测 |

**控制台摘要行**(报告结尾必须有):

```
QA report saved: <path>   (BLOCKER=x HIGH=y MEDIUM=z LOW=w NOTE=n)
```

**深读** → `references/report-format.md`(完整 markdown 报告骨架、未验证项的写法)

---

## 8. 触发后的执行 checklist(给主 agent 自己跑)

**第一次进入项目时(bootstrap)**:

- [ ] 检测 `<repo>/.claude/rules/` 是否存在
- [ ] 不存在 → 跑 `node <skill-path>/scripts/init.mjs <repo-path>`(脚本失败时用 Read+Write 手工 fallback,见 §11)
- [ ] 引导用户填 `.claude/rules/auth.md` `{{}}` 占位符(项目鉴权机制)
- [ ] 引导用户填 `.claude/rules/env-tools.md` `{{}}` 占位符(项目编译/启动工具链)
- [ ] 在 `<repo>/CLAUDE.md` 末尾追加引用块,指向 `.claude/rules/` + 本 skill 的 references

**每次新需求时(per-task)**:

- [ ] **🆕 第零件事(v1.6)**:`AskUserQuestion` 获取需求 slug:列出 `<repo>/.claude/` 下现有需求子目录(过滤掉 `<YYYY-MM-DD>` 日期目录、`rules/`、`<slug>/`),让用户选已有 / 新建 / `_oneoff_`(一次性);**slug 拿到后立即 Read** `<repo>/.claude/<slug>/summary.md`(若存在),拾跨日 / 跨会话决策史
- [ ] **第一件事**:`AskUserQuestion` 5 选 1 扁平(产品 / 技术 / 测试 / 上线 / QA),不要凭语义猜
- [ ] 走 brainstorming(必要时,选定模式后再做需求澄清)
- [ ] 根据用户选择,复制对应模板(优先项目母板 `<repo>/.claude/rules/{name}-prompt.md`,缺失回退 skill 模板)到 `<repo>/.claude/<slug>/<YYYY-MM-DD>/`:
  - 用户选 1 → `product-review-prompt.md`(B1,**单 reviewer**)
  - 用户选 2 → `tech-review-prompt.md`(B2,双盲)
  - 用户选 3 → `test-plan-review-prompt.md`(B3,双盲;前置=已通过的产/技方案)
  - 用户选 4 → `rollout-review-prompt.md`(B4,双盲)
  - 用户选 5 → `qa-regression-prompt.md`(A,双盲)
- [ ] 填 `{{...}}` 占位符。占位符对照表见 `references/filling-prompts.md`
- [ ] **双盲原则**:不把主 agent 的判断性自测结论写进 prompt;事实性信息可以(详见 filling-prompts.md §4)
- [ ] 告诉用户 prompt 文件的绝对路径:
  - **B1 产品方案**:「贴给 reviewer-A 或 reviewer-B 任一即可,不需要双盲」
  - **B2/B3/B4/A**:「分别贴给 reviewer-A 和 reviewer-B,各自独立跑」
- [ ] **B1 等报告**:扫**所有配置的 reviewer 归档目录**(`.{reviewer-a}/<slug>/reviewer/<date>/` `.{reviewer-b}/<slug>/reviewer/<date>/` `.{reviewer-c}/<slug>/reviewer/<date>/` ...)任一,取最早出现的 evaluation.md(B1 单 reviewer 时主 agent 不知道用户实际贴给了哪一方)
- [ ] **B2/B3/B4/A 等报告**:N 个 reviewer 各产出 1 份(N=2 默认 / N=3+ 配置时按数);N 份齐了再走对比
- [ ] **某个 reviewer 没出报告**:超时(默认 30 min)等不到 → 询问用户是否撤回该 reviewer / 用 N-1 份做对比
- [ ] **核验纪律 6 步(v1.6;§3 + cross-validation.md §6.5 + §7,N+1 对比之前必做)**:
  - [ ] (1) **🆕 逐 finding 自查代码(强制)** — 对副 agent 报的每条 finding,Read 对应文件 file:line ± 5-15 行上下文,记下 1-3 行片段 + 主 agent 独立判断(同意/不同意/上下文不够);**不允许**仅凭"严格多数 reviewer 共识"跳过自查直接采纳
  - [ ] (2) 自扫代码独立判断 — 对每个改动文件 / 模块跑 grep / 读上下文 / 必要快速命令,形成主 agent 自判 finding 清单(覆盖副 agent 可能漏的盲点)
  - [ ] (3) 三方对照 — 把自判 + N 份 reviewer 报告逐条比对,不一致点单独标记(主 agent 漏 / reviewer 漏 / 双方解读不同)
  - [ ] (4) 拿不准的 finding(设计意图 / 业务约束 / ROI 不清)立即 AskUserQuestion;**选项必带 4 要素**(副 agent 言论 / 主 agent 自查 file:line + 片段 / 具体例子 / 选项),无 4 要素 = 让用户在信息真空里拍板
  - [ ] (5) 本轮闭环 — 本轮发现的问题本轮就修;**不**留 "v1.X+1 / 后续 follow up" 借口
  - [ ] (6) ROI 低 finding **不**自己 dismiss — 列详细建议 + 不修理由,让用户拍板
- [ ] 双盲场景:走"三份产出交叉对比"(§3 表 + references/cross-validation.md §6 / §6.5)
- [ ] **B1 闭环检测**(单 reviewer 场景特有,v1.4 升级为完整 SOP — 详见 `references/plan-review-perspectives.md` §2.4)— 共 6 项:
  - [ ] (1) 拿到 evaluation.md 后,先确认报告 §2 "我的判断基于以下假设" 段存在且至少列 3 条具体假设
  - [ ] (2) 如缺失 / 假设过于笼统(如"假设用户会愿意学新功能"这种空话),把报告退回 reviewer 要求补假设,**不直接进 §3 finding 裁决**
  - [ ] (3) 走 §2.4 SOP Step 1:抽取假设(列出 finding ↔ 假设对应表)
  - [ ] (4) 走 §2.4 SOP Step 2-3:假设逐条核查(🟢可核实/🟡不可核实/🔴已反例) → 主 agent 出 dismiss 倡议(必带反例)
  - [ ] (5) 走 §2.4 SOP Step 4:AskUserQuestion 一次性收尾让用户拍板;**不要**主 agent 自己 dismiss 不问用户 / **不要**逐条 AskUserQuestion 推卸假设核查
  - [ ] (6) 全部假设都不成立 = 等价于"无 finding 通过" → 必走主 agent Spike 兜底,可考虑换 reviewer 重跑(详见 cross-validation §6 B1 表)
- [ ] **A 模式预检**:若 `git diff --stat` 显示无源码改动,提示用户改选 B 模式而非 A
- [ ] **逐条裁决**:用 `AskUserQuestion` 把每条 finding 拿出来,用户决策修 / 延后 / 不修;不批量打包
- [ ] 中途想换模式 / 加模式(已生成 B2 prompt 后想再加 B3)→ **重新触发 skill,再 5 选 1**;不要在同一次触发里硬塞两套

**需求维度归档分支(v1.8 升级,任一模式叠加)** — 除非 slug=`_oneoff_`,否则必跑:

- [ ] **第 0 件事**(per-task 第一步)拿到 slug 后,**立即 Read** `<primary-repo>/.claude/<slug>/summary.md`(若存在)— 拾跨日 / 跨会话决策史
- [ ] 若 `<slug>/` 不存在(新建场景):
  - [ ] 从 `<skill-path>/templates/slug-index.md` 和 `slug-summary.md` 复制骨架到 `<primary-repo>/.claude/<slug>/`,填入需求基础信息
  - [ ] **用户提供<CALENDAR_PLATFORM> PRD URL?** → 用<CALENDAR_PLATFORM> MCP `fetch-doc` 获取内容,转存为 `<primary-repo>/.claude/<slug>/prd.md`;在 `summary.md` 补 PRD 引用
- [ ] 5 选 1 + 后续流程**照旧**,产物落 `<primary-repo>/.claude/<slug>/<YYYY-MM-DD>/`
- [ ] **每轮 AC 结束后**:追加一行到 `<slug>/index.md`(**只记结论;可选记录阻塞问题产物**;日常 reviewer 报告不记)
- [ ] 重大决策 / v 版本切换 / 新发现的未闭环项 → **更新** `<slug>/summary.md`(只记结论,不关联 QA/AC 中间产物)
- [ ] **方案定稿后**:落 `<slug>/<plan>.md`(如 `tech-design.md`,不带版本号,不含 AC 评审过程痕迹);如有需要覆盖旧版本
- [ ] **用户要求记录迭代过程?** → 创建/追加 `<slug>/iteration-log.md`(变更点+原因+影响范围,不含 reviewer 对话痕迹)
- [ ] 副 agent 归档目录(`.codex/` `.opencode/` ...)**不**镜像 `<slug>/`;reviewer 也**不**读 `<slug>/` 下任何文件(双盲底线)
- [ ] **slug=`_oneoff_` 时跳过此分支** — 一次性 spike 不入需求目录

**多仓同步分支额外项**(任一模式叠加):

- [ ] 用 `git rev-parse --show-toplevel` 解到主仓仓根(**不要直接用 cwd**,可能在子目录;cwd 不在 git 仓内时报"前置不成立"由用户指定)
- [ ] 在 prompt 头部"仓库与分支"段列出主仓 + 所有副仓的绝对路径
- [ ] **产出仅主仓**(v1.8):prompt + 报告全部只在主仓落盘。reviewer 在副仓跑验证后回主仓写一份报告;副仓不落任何 AC 产出
- [ ] 接口契约定义方先合,消费方后合
- [ ] 本地联调用 fetch hijack 而非改 conf

**多轮回归分支额外项**(同一需求 ≥ 2 轮交叉验证时叠加):

- [ ] 第 N+1 轮 prompt 生成前,扫历史 case 文件 `<repo>/.claude/<原日期>/case-studies/round-*-*.md`,更新所有未闭环 case 的状态
- [ ] 把"未闭环 / 监视中 / 修复中"的 case 文件路径塞进新 prompt 的"前轮已知盲点"段(已闭环的不塞)
- [ ] **prompt 里只放路径,不嵌内容**(reviewer 自己 Read,不污染 prompt context)
- [ ] case 文件内容**对 reviewer-A 和 reviewer-B 完全对称**,用统一归纳语言写,不区分"是哪个 reviewer 抓的"(双盲对称)
- [ ] 本轮收到新 finding 后,**只挑差异化 + 可迁移**的 finding 沉淀为新 case(背景噪声不沉淀,大致 0-3 条 / 轮)
- [ ] 修复后,把对应 case 状态改"修复中" → 下轮再确认无复现 → 改"已闭环"
- [ ] case 不跨需求迁移;若发现"项目级通用规律",抽到 `<repo>/.claude/rules/<规律>.md` 而非塞进其它需求的 case

**深读** → `references/multi-round-regression.md`(case 状态机、何时不沉淀、anti-patterns)

---

## 9. 与 superpowers 系列的关系

本 skill 触发后,与 superpowers 系列**互相调用**而非互斥:

| 时机 | 调用 |
|---|---|
| 任何创意/编码工作开始前 | `brainstorming` 优先 |
| 方案定稿后转编码前 | `writing-plans` |
| 实现阶段(每个子模块) | `test-driven-development` |
| 声明完成前 | `verification-before-completion` |
| 自检完成需要外部视角 | `requesting-code-review` |
| 本 skill 不替代上述,只在协同维度上叠加 | 三方协同 / 多仓同步 / 归档 |

具体说,典型流程(全流程式 = 每段调一次 skill):

```
brainstorming(澄清需求)
    → 本 skill 第 1 次(5 选 1 = B1 产品方案评审 → 单 reviewer + 假设核查)
    → 本 skill 第 2 次(5 选 1 = B2 技术方案评审 → 双盲)
    → writing-plans(方案定稿 + 编码计划)
    → 本 skill 第 3 次(5 选 1 = B3 测试方案评审 → 双盲)
    → test-driven-development(实现)
    → verification-before-completion(自检)
    → 本 skill 第 4 次(5 选 1 = A QA 回归 → 双盲)
    → 本 skill 第 5 次(5 选 1 = B4 上线方案评审 → 双盲)
    → finishing-a-development-branch(收尾 + 发布)
```

每次调 skill 是一次独立 5 选 1,协议层不强串联;用户按需取用。

### 9.1 主 agent 从 superpowers 回来后的软衔接

当从 `superpowers:brainstorming` / `superpowers:writing-plans` / `superpowers:verification-before-completion` 完成回到主 agent 时,主 agent 应**主动一句**询问:

> "刚出炉的 {产品方案 / 技术方案 / 实现} — 要让 N reviewer 评审 / 跑回归吗?"

**触发条件**(满足任一,主 agent 才提一句;否则保持沉默,避免反复打扰):

| 检测信号 | 例 |
|---|---|
| 用户上一条 message 提到"plan written" / "spec done" / "verified locally" / "实施计划写完了" / "自检过了" / "MVP 跑通了" 类完成性关键词 | "我把技术方案 v2 写完了" → 主 agent 应主动提 |
| `superpowers:writing-plans` 产出的 plan 文件刚落盘(主 agent 看到 plan 文件路径出现在对话上下文) | 用户说"已落盘到 docs/plan-XXX.md" → 主 agent 应主动提 |
| `superpowers:brainstorming` / `verification-before-completion` 的对话刚结束(连续多轮问询后用户来一句"OK 这就是我想的" / "差不多了") | 头脑风暴收尾 → 主 agent 应主动提 |
| **不满足**:用户仍在 brainstorm 中(还在问"如果我们这样设计...") | 不打扰,继续 brainstorm |

**注意**:
- **软衔接**,不强制;用户可直接说"不用,直接编码"或"先聊别的"跳过
- 主 agent **不要**自动跳到 5 选 1 — 等用户答应后再触发本 skill
- 如果用户已经在前一句说了"评审一下"等触发关键词(§1.1 强触发表),则直接进 5 选 1,不再多问软衔接(避免双重问)
- 与 §1.1 的关系:§1.1 是**入场前**判断("用户开口就说评审" → 直接 5 选 1);§9.1 是**出场后**判断("brainstorm 完了" → 主动一句问)。两段不冲突
- 软衔接的目的是**降低协议遗忘成本**(用户专注 brainstorm 后容易忘了下一步该评审),不是绑死流程
- **检测靠主 agent 自觉,无机械检测** — 误漏可接受,但反复打扰不可接受;宁缺勿滥

实施口径:本 skill 的 description 说"Yields to superpowers for ...",意味着 superpowers 阶段主 agent **不主动**进 5 选 1;但 superpowers 完成回来时(按上述触发条件检测),主 agent **应主动**提一句"要不要走 tri-agent",不让协议遗失。

---

## <REDACTED> 跳过本 skill 的场景(防误触发)

- 一行 typo / 注释 / README 文字调整
- 纯重命名 / 纯移动重构(编译通过即可)
- 实验性 / 临时脚本类一次性产出
- 已有功能纯字段补充(无语义变化)
- 用户明确说"不用 QA / 直接编码"

涉及业务逻辑、接口契约、数据权限、鉴权链路、新数据源 / 新 SQL 设计、0→1 新能力、跨多仓改动的需求都**不在豁免范围**。

---

## 11. 协议-模板-reference 同步矩阵(修改本协议时必读)

**给本 skill 的协议作者看**,不是给主 agent 跑任务时看的。修改 SKILL.md 任一关键协议条款时,**必须按下表勾选所有对应锚点是否已同步**。这条 §11 是 v1.4 引入的"sync-checklist 项目级规则"的内嵌实现 — 解决 v1.3 round-2 暴露的"协议改了 reference 没跟"漏修类。

| 协议条款 | SKILL.md 锚点 | references 锚点 | templates / scripts 锚点 |
|---|---|---|---|
| **N reviewer 数量与字母循环** | §0(角色表 / reviewer 数量段)、§3(N 路双盲铁律)、§5(归档目录 a-z) | `cross-validation.md` §1 §5 §6、`archive-and-blind.md` §1 §5.1 §6、`multi-repo.md` §2.4 §6、`multi-round-regression.md` §3-§4 §8-§9、`hard-constraints.md` §1 | 5 份 prompt 模板 Step 1 「自我识别」段、各模板归档路径段、各模板 case 引用段;`scripts/init.mjs` 字母 a-z 循环 + N≥5 警告 |
| **B1 产品方案单 reviewer 例外** | §0(角色表注脚)、§2(决策树第 1 分支)、§3(B1 单 reviewer 对比表)、§5(B1 例外段)、§8(B1 闭环检测 6 项,引用 §2.4 SOP) | `cross-validation.md` §4.2 §5、`archive-and-blind.md` §5.4、`plan-review-perspectives.md` §2 §2.4 §6 | `product-review-prompt.md` 全文(尤 Step 1 / 红线规则) |
| **多仓产出仅主仓(v1.8)** | §2(决策树各分支)、§4(v1.8 段)、§5(铁律段)、§8(多仓分支 checklist) | `archive-and-blind.md` §0 §2、`multi-repo.md` §0 §2.4 §2.5 §6 | `qa-regression-prompt.md` 输出路径段、其余 4 份模板归档路径段 |
| **主 agent 编码独占 / reviewer 只读不写** | §0(角色表 + 编码独占铁律)、§3(精简版角色表)、§5(铁律段) | `hard-constraints.md` §1、`cross-validation.md` §1 | 5 份 prompt 模板硬约束段(都引用 hard-constraints.md) |
| **finding 依据外露 / B1 假设外露区分** | §3(对比表)、§8(B1 闭环检测) | `report-format.md` §1.1(权威 4 类客观依据)、`plan-review-perspectives.md` §2.2 §2.4 | `tech/test-plan/rollout/qa-regression-prompt.md` 各「评审纪律小结」or 红线规则段(**字面级引用 §1.1 而非各自子集**);`product-review-prompt.md` Step 5 主观假设外露段 |
| **多轮回归 case 沉淀标准** | §8(多轮回归分支 checklist) | `multi-round-regression.md` §3 §4 §9 | `case-study.md` 模板 §0 硬约束(< 500 汉字 + 不区分 reviewer + 不写修复详情) |
| **路径占位符词汇表** | §4(多仓段)、§5(归档段) | `archive-and-blind.md` §0(权威完整表)、`multi-repo.md` §0(多仓上下文摘录) | 各模板路径引用(避免 `<repo>` 与 `<primary-repo>` / `<reviewer-cwd>` 混用) |
| **bootstrap / init.mjs 脚本行为** | §8(bootstrap checklist)、§12(init.mjs 失败 fallback)、§13(版本与升级) | — | `scripts/init.mjs`:CLI 参数解析 / dry-run / N≥5 警告 / `applyPlaceholders` / `renderRulesReadme`;`docs/changelog.md` 列出脚本行为变化 |
| **主 agent 核验报告纪律(v1.4 引入,v1.6 升 6 步)** | §3(6 步 + 核心断言 + 引用)、§8(per-task checklist 6 条) | `cross-validation.md` §6.5(完整 6 步表 + 8 条反 anti-pattern + 与 §7 §8 关系) | — |
| **🆕 主 agent 自查证据嵌入 AskUserQuestion 4 要素(v1.6)** | §3(6 步表 Step 1 + Step 4)、§8(per-task checklist Step 1 + Step 4) | `cross-validation.md` §6.5 Step 1 + Step 4、§7(4 要素骨架重写) | 暂无模板;v1.7 候选评估是否需要"裁决记录文件"模板 |
| **🆕 slug 入口 + 需求维度归档(v1.6;v1.8 升级:slug 为物理根 + <CALENDAR_PLATFORM> PRD + 方案单份 + 只记结论)** | §0(v1.8 要点)、§2(决策树 slug 分支 + <CALENDAR_PLATFORM> PRD)、§5(归档骨架完整)`、§8(需求维度归档分支完整) | `archive-and-blind.md` §0 §1 §2 §2.5;v1.8 新增 `iteration-log.md` 模板 | `templates/slug-index.md`(只记结论)、`templates/slug-summary.md`(只记结论,加 PRD 引用)、`templates/iteration-log.md`(新增) |
| **🆕 skill 边界 = 核验环 ≠ 设计/编码环(v1.6)** | frontmatter description(NOT triggered by 段)、§0("是什么 / 不是什么" 段)、§1.1(强触发表注脚 + 排除红线 + 触发实战提示) | — | `.claude-plugin/plugin.json` description、`.claude-plugin/marketplace.json` description(顶层 + 内层 plugins[0])、`marketplace.json` 顶层 + 内层 description(**v1.6.1:5 处描述同步**) |

**自检流程**(改完 SKILL.md 关键条款后):

1. 对照本表,找出本次改动涉及的协议条款行
2. 逐个 grep / Read 该行所列的 references 锚点和 templates 锚点
3. 与 SKILL.md 新版本逐字符对照(尤其是关键名词、数量、铁律)
4. 在 changelog 里写明"已同步以下锚点:..."(哪些被实际编辑过)
5. 不要假设 LLM "应该会自动跟" — round-2 反例证明这种假设站不住

**何时更新本表**:
- 加新协议条款 / 加新 reference / 加新模板 → 在本表加一行
- 拆分 / 合并 reference 章节 → 更新对应锚点
- 删过时协议 → 删对应行

**与 case 003 的关系**:case 003 抽象规则的"主 agent 接收报告先核必填段"是 reviewer-prompt 层的同步;本 §11 是 SKILL-reference-template 三层之间的同步。两者是同一种"协议改 → 检测点跟"思想在不同层级的应用。

---

## 12. init.mjs 失败时的手工 fallback

如果 `scripts/init.mjs` 跑不了(node 缺失 / 权限 / 路径异常),主 agent 应该:

1. 用 Read 把以下 7 份模板读出来:
   - `templates/auth.md`
   - `templates/env-tools.md`
   - `templates/product-review-prompt.md`(v1.3 新增)
   - `templates/tech-review-prompt.md`
   - `templates/test-plan-review-prompt.md`(v1.3 新增)
   - `templates/rollout-review-prompt.md`(v1.3 新增)
   - `templates/qa-regression-prompt.md`
2. 用 Write 写到 `<repo>/.claude/rules/` 下,把 `<reviewer-a>` `<reviewer-b>` `{a-name}` `{b-name}` 占位符替换成实参
3. 用 Write 创建 `<repo>/.claude/rules/README.md`(指向 skill 的 references)
4. 在末尾跟用户报告"已用手工 fallback,推荐稍后修复 node 环境"

手工 fallback 必须严格等价于 `init.mjs` 行为,**不要省略 README**。

---

## 13. 版本与升级

- 本 skill 版本:**1.0.0**(2026-06-26)
- references 不会被复制到项目仓 → 升级 skill 后所有项目同步获得新规则
- 项目仓的 `<repo>/.claude/rules/auth.md` `env-tools.md` 是项目自有,不会被 skill 升级覆盖
- 项目母板(7 份 prompt)在 `init.mjs` 跑过的项目里**需要重新拉取**才能拿到 v1.3 新增的 product / test-plan / rollout 三份评审模板。详见 `docs/changelog.md` 的 1.3.0 迁移说明
- 升级方式:重装 plugin(`/plugin update multi-reviewer`)
- 重大不兼容变更(major version bump)会在 `docs/changelog.md` 标注 migration 路径

### 1.0.0 新增能力

- **reviewer 产出路径加 `reviewer/` 层级**:所有 reviewer 归档路径从 `.{reviewer}/<slug>/<YYYY-MM-DD>/` 改为 `.{reviewer}/<slug>/reviewer/<YYYY-MM-DD>/`,主 agent `.claude/<slug>/<YYYY-MM-DD>/` 不变

### 1.9.0 新增能力

- **slug 目录范围扩展**:`archive-and-blind.md` §2.5 扩展 slug 根目录可放文件类型:规划文档(PRD / 技术方案 / coder-task / DDL)放 `<slug>/` 根目录,迭代产物(review prompt / coder-result / case-studies)放 `<slug>/<YYYY-MM-DD>/`;新增文件分类规则表 + 判断口诀 + 主 agent 产物落盘流程
- **加固 mirror 完整性**:`check-consistency.mjs` 新增全面镜像校验,覆盖全部 24 个 skill 文件(`skills/` 与 `plugins/multi-reviewer/skills/` 间字节一致),杜绝此前 19 个 reference + template 文件可能出现的静默漂移

### 1.8.0 新增能力

- **归档目录加 `<slug>/` 层级**(主 agent + reviewer):所有 agent 路径改为 `.<agent>/<slug>/<YYYY-MM-DD>/`,对齐多 agent 协同的归档惯例。`.claude/<slug>/` 成为需求物理根目录(不再独立于日期目录)
- **多仓产出仅主仓**:所有 AC 产出(prompt + 报告 + 方案)只在主仓落盘,不再镜像副仓。reviewer 在副仓跑验证后回主仓写一份报告
- **slug 下 index/summary 只记结论**:`index.md` 只记每轮结论(不记日常 reviewer 报告;可选记录阻塞问题产物);`summary.md` 只记结论不关联 QA/AC 中间产物
- **<CALENDAR_PLATFORM> PRD 转存**:新建 slug 时若用户提供<CALENDAR_PLATFORM>文档 URL,主 agent 用<CALENDAR_PLATFORM> MCP `fetch-doc` 转存为 `.claude/<slug>/prd.md`
- **方案只保留一份最终版**:文件名不带版本号(如 `tech-design.md`),内容不含 AC 评审过程痕迹;迭代记录仅当用户要求时存 `iteration-log.md`
- **新增 `templates/iteration-log.md`** 骨架

### 1.6.0 新增能力

- **🚫 skill 边界收紧 = 核验环 ≠ 设计/编码环**:plugin.json + 2 份 marketplace.json description 把 "Multi-agent coding & plan-review" 改为 "Multi-agent CROSS-VALIDATION protocol — Does NOT generate plans or code";SKILL.md frontmatter description 同步;§0 加 "是什么 / 不是什么" 段(含 3 条反例);§1.1 排除表加红线"出方案 / 设计方案 / 拍方案 / 写代码 → superpowers"。来源:v1.5 实战(差旅 v2 方案设计被误进 tri-agent)反例
- **🆕 主 agent 核验报告纪律 5 步 → 6 步**:`cross-validation.md` §6.5 新增 Step 1 "**逐 finding 自查代码**"(强制要求,核心断言 **副 agent 严格多数共识 ≠ 主 agent 自动采纳**);anti-pattern 表加 2 条最严重项(跳过自查 / 选项不带自查证据)。SKILL §3 §8 同步。来源:v1.5 实战(3 reviewer 同认 → 主 agent 直接采纳)反例
- **🆕 AskUserQuestion 4 要素强制**:`cross-validation.md` §7 重写选项骨架,每条 finding 交用户裁决时必带 ① 副 agent 言论 ② 主 agent 自查(file:line + 1-3 行片段 + 独立判断)③ 具体例子 ④ 选项;无 4 要素 = 让用户在信息真空里拍板
- **🆕 slug 入口 + 需求维度归档**:主 agent 进入 skill **第 0 件事** AskUserQuestion 拿 slug;`<primary-repo>/.claude/<slug>/{index.md, summary.md}` 双文件归档:`index.md` 机械索引(主 agent 追加),`summary.md` 决策概要(主 agent 手写跨会话首读)。物理文件仍按日期落,`<slug>/` 只挂索引;副 agent **不读不镜像** `<slug>/`(双盲底线)。一次性 spike 用 `slug=_oneoff_` 跳过。新增 `archive-and-blind.md` §2.5 完整段 + `templates/slug-index.md` `slug-summary.md` 骨架。来源:v1.5 实战(差旅 OD v1/v2 跨日散落,主 agent 跨会话遗漏 v1 决策史)反例
- **`scripts/check-consistency.mjs` 加 6 个新 check**:覆盖 6 步纪律 / 4 要素 / slug 归档 / slug 模板存在 / skill 边界 / 4 处 description 同步,共 36/36 一致性检查

### 1.5.0 新增能力

- **`scripts/smoke-test.mjs`**:`init.mjs` smoke tests(零依赖,Node.js 内置模块),覆盖 `--dry-run` 零落盘 / 默认 reviewer / reviewer 参数大小写归一化 / 自定义 reviewer / 占位符替换 / 多字母 reviewer id 拒绝
- **`scripts/check-consistency.mjs`**:协议一致性检查脚本,核对 JSON 合法性、模板 / reference 完整性、版本号与 changelog 对齐、B1 单 reviewer、prompt 单源化、finding 依据外露、hard constraints 引用、5 入口模式、§11 同步矩阵等关键锚点
- **README Quick Start + FAQ + 本仓自检**:降低首次使用理解成本,覆盖单 reviewer QA / reviewer 是否能修 bug / 多仓 prompt 单源化 / reviewer 结论冲突等常见误用

### 1.4.0 新增能力

- **§11 协议-模板-reference 同步矩阵**:在 SKILL.md 内嵌列每条关键协议的 ~3-12 个对应锚点,改协议时主 agent 必读(解决 v1.3 round-2 漏修类)
- **§9.1 主 agent 从 superpowers 软衔接**:brainstorm / writing-plans 完成回来时,主 agent 主动一句"要不要走 tri-agent",降低协议遗忘成本
- **`references/multi-round-regression.md` 通用化到 N reviewer**:沉淀标准 / 双盲条款 / anti-pattern 全文从 A/B 双向改为 N 路对称
- **`references/report-format.md` §1.1 finding 依据外露(强制)**:每条 finding 必带源码行号 / 配置 / 命令输出 / 历史 bug ID 至少一条;明确与 B1 主观假设外露区分。B2/B3/B4/A 4 份模板配套加引用
- **`references/plan-review-perspectives.md` §2.4 B1 dismiss SOP**:4 步工作流(抽取假设 → 逐条核查 → 主 agent 出 dismiss 倡议 → AskUserQuestion 收尾让用户拍板),把 case 003 的"防偷懒 checklist"升级为完整流程
- **`references/archive-and-blind.md` §0 + `multi-repo.md` §0 路径词汇表**:消除 `<repo>` 在双盲条款 / 多仓镜像 / case 引用三种语境含义不同的歧义
- **`templates/case-study.md` §0 硬约束**:主体描述 < 500 字 / 不写修复详情 / 不区分 reviewer / 不跨项目;3 份 round-1 case 重写到 ~600 字符
- **`scripts/init.mjs` --dry-run 标志 + N≥5 警告**:dry-run 预览不落盘;N≥5 时提示"大部分场景 N=2-4 已足够"

### 1.3.0 新增能力

- **5 选 1 入口分流**(强制 AskUserQuestion):产品 / 技术 / 测试 / 上线 方案评审 + QA 回归
- **3 份新模板**:`product-review-prompt.md`(单 reviewer 例外)/ `test-plan-review-prompt.md` / `rollout-review-prompt.md`
- **新 reference**:`plan-review-perspectives.md`(四类方案视角差异 + 产品方案为何单 reviewer)
- **prompt 单源化**:跨多仓时 prompt 仅主仓(= cwd)`.claude/<slug>/<date>/` 单份;副仓不再镜像 prompt。v1.8 起**报告也仅主仓**
