---
name: archive-and-blind
description: .{agent}/<slug>/reviewer/<YYYY-MM-DD>/ 归档协议与双盲铁律的完整定义,涵盖路径词汇表、目录命名(v1.10 reviewer/ 层级)、产出仅主仓(不再多仓镜像)、需求维度归档(.claude/<slug>/index+summary+prd+plan+iteration-log)、方案单份最终版、临时文件、双盲四种特化(含 B1 产品方案单 reviewer 例外)、不要碰对方目录
version: 1.7.0
---

# 归档协议 + 双盲铁律

> 上位文件:`SKILL.md`(索引);本文件是归档与双盲规则的完整版。

## 0. 路径占位符词汇表

文档与 prompt 模板里出现的路径占位符,**含义按上下文区分**:

| 占位符 | 含义 | 用在哪些场景 |
|---|---|---|
| `<repo>` | reviewer 当前 cwd 所在的仓库根(默认上下文) | 双盲条款、归档目录路径、reviewer 视角下的相对路径 |
| `<primary-repo>` | 主仓 = skill 触发时的 cwd | prompt 唯一落点、`<slug>/` 需求目录存放点、所有 AC 产出唯一落点 |
| `<secondary-repo-N>` | 副仓 N(N=1,2,…) | reviewer 跨多仓时 cd 进入的目标(验证代码用,不在副仓留 AC 产出) |
| `<all-repos>` | 主仓 + 所有声明的副仓(循环展开) | reviewer 验证动作的循环上下文(代码验证在各仓,产出仅主仓) |
| `<reviewer-cwd>` | reviewer 进程启动时的 cwd | 等同 `<repo>` 的展开,见 reviewer 自我位置 |
| `<skill-path>` | multi-reviewer skill 安装根目录 | reference 与 template 之间的相对引用 |
| `<slug>` | 需求标识(kebab-case;主 agent 入 skill 第 0 件事 AskUserQuestion 获取);特殊值 `_oneoff_` = 跳过需求目录(一次性 spike) | `<primary-repo>/.claude/<slug>/` 需求归档根目录(物理);所有日期产物在 `<slug>/<YYYY-MM-DD>/` 下 |

**歧义点示例**(同一字面 `<repo>`,语义随上下文变):

- `<repo>/.{a-name}/<slug>/reviewer/<date>/qa-report.md`(双盲条款 §5 / §6 里)= **reviewer 当前 cwd**
- `<repo>/.{a-name}/<slug>/reviewer/<date>/qa-report.md`(单仓场景, reviewer 在**主仓**写报告)= **`<primary-repo>`**
- `<repo>/.claude/<slug>/...`(prompt 模板引用里)= **`<primary-repo>` 主仓**(所有 AC 产出一律在主仓)

冲突点处后文会显式换成 `<primary-repo>` / `<all-repos>` 等专属名;通用上下文仍用 `<repo>`。reviewer 不能自己确定时,**遵循 prompt 头部"仓库与分支"段的具体路径**(那里全是绝对路径,无歧义)。

## 1. 归档目录骨架

每个 AI agent 的产出物存放在该 agent 专属的顶级目录里,子目录按 **需求 slug** → **产出日期**(`YYYY-MM-DD`,以产出当天为准)两级划分:

| Agent | 归档根(相对仓根) | 完整路径模式 |
|---|---|---|
| **主 agent**(触发 skill 的 agent;不论是 claude / cursor / cline / 其它,产出统一进 `.claude/`)| `.claude/<slug>/<YYYY-MM-DD>/` | `<primary-repo>/.claude/<slug>/<YYYY-MM-DD>/<file>.md` |
| reviewer-A(默认 codex)| `.codex/<slug>/reviewer/<YYYY-MM-DD>/` | `<primary-repo>/.codex/<slug>/reviewer/<YYYY-MM-DD>/<file>.md` |
| reviewer-B(默认 opencode)| `.opencode/<slug>/reviewer/<YYYY-MM-DD>/` | `<primary-repo>/.opencode/<slug>/reviewer/<YYYY-MM-DD>/<file>.md` |
| reviewer-C(配置 N≥3 时,例:cursor)| `.cursor/<slug>/reviewer/<YYYY-MM-DD>/` | `<primary-repo>/.cursor/<slug>/reviewer/<YYYY-MM-DD>/<file>.md` |
| reviewer-D(N≥4,例:cline)| `.cline/<slug>/reviewer/<YYYY-MM-DD>/` | `<primary-repo>/.cline/<slug>/reviewer/<YYYY-MM-DD>/<file>.md` |
| ...(字母循环 a-z) | ... | ... |

> **主 agent 归档目录始终是 `.claude/`**(协议约定),即使触发的不是 Claude:这是为了让"主 agent 产出"有稳定可识别的位置,与 N reviewer 区分清楚。
>
> reviewer 顶级目录名 = 该 reviewer 工具自己的标识(全小写,无空格)。如果用 cursor 做 reviewer,目录就是 `.cursor/<slug>/reviewer/<YYYY-MM-DD>/`。reviewer 数量默认 2,可配置 1-N(N≤26),通过 `init.mjs --reviewer-a/-b/-c/-d/...` 指定。
>
> **`<slug>/` 层级**(v1.8 新增,对齐多 agent 协同的归档惯例):同一需求的各轮次、各 agent 产出统一放在同一个 slug 目录下,按日期进一步区分。`<slug>` 是 AC (multi-reviewer) 技能中的任务短标识符,通常为 `<issue-number>-<short-name>` 格式(如 `625-org-standard-management`、`520-travel-skill`)。

目录不存在就直接创建。**不需要 git commit**(默认应该 gitignore;如果团队希望共享归档,把 `.claude/` 等加白名单)。

**需求维度索引/概要/PRD/方案**(v1.8):以下文件直接放在 `<primary-repo>/.claude/<slug>/` 目录根下(不在日期子目录里):

| 文件 | 作用 | 维护方式 |
|---|---|---|
| `index.md` | 每轮 AC 结论索引(机械追加;**只记结论,不记 reviewer 中间报告**) | 主 agent 每轮 AC 后追加一行 |
| `summary.md` | 需求决策概要(**只记结论,不关联 QA/AC 中间产物**) | 主 agent 手写,跨会话首读 |
| `prd.md` | 产品 PRD(新建 slug 时若用户提供<CALENDAR_PLATFORM>文档,由主 agent 转存) | 主 agent 在 slug 初始化时创建 |
| `tech-design.md` / `test-plan.md` / `rollout-plan.md` | **方案最终版**(不带版本号,不含 AC 评审过程痕迹) | 主 agent 在方案定稿后落盘 |
| `iteration-log.md` | 方案迭代记录(**仅当用户要求记录时创建**) | 主 agent 在用户要求时追加 |

详见 §2.5 需求维度归档。

## 2. 跨仓:产出仅主仓(v1.8)

> v1.8 起,**所有 AC 产出(prompt + 报告 + 方案文档 + case-studies + slug 目录)一律只在主仓(`<primary-repo>`)落盘**,副仓不再镜像任何内容。
>
> 历史行为:v1.3-v1.7 prompt 仅主仓,报告每仓镜像;v1.0-v1.2 prompt + 报告都每仓镜像。v1.8 简化:reviewer 在副仓跑的代码验证动作(接口调用、CLI 命令、数据核对)结果全部汇总到主仓的**一份报告**里。主仓是 AC 流程的"控制面"。

| 类别 | 落盘 | 原因 |
|---|---|---|
| **prompt**(`{name}-prompt.md`) | **仅主仓** `.claude/<slug>/<date>/` | 单源真相,改一处即可 |
| **报告**(`qa-report.md` / `evaluation.md`) | **仅主仓** `.{reviewer}/<slug>/<date>/` | reviewer 在主仓写报告,覆盖所有相关仓的验证结论 |
| **方案文档**(`tech-design.md` 等) | **仅主仓** `.claude/<slug>/` | 方案是需求级产物,不按仓拆分 |
| **case-studies**(多轮回归) | 仅主仓 | reviewer 通过 prompt 路径自己 Read |
| **需求维度目录**(`<slug>/`) | **仅主仓** `.claude/<slug>/` | slug 是主 agent 视角的"需求线" |

**主仓 = skill 触发时的当前工作目录(cwd)**。详见 `multi-repo.md` §2.5。

例(单仓需求):

```
<primary-repo>/.claude/<slug>/<YYYY-MM-DD>/qa-regression-prompt.md   ← prompt
<primary-repo>/.codex/<slug>/reviewer/<YYYY-MM-DD>/qa-report.md               ← reviewer-A 报告
<primary-repo>/.opencode/<slug>/reviewer/<YYYY-MM-DD>/qa-report.md            ← reviewer-B 报告
```

例(跨多仓需求):

```
<primary-repo>/.claude/<slug>/<YYYY-MM-DD>/qa-regression-prompt.md   ← 唯一一份 prompt
<primary-repo>/.codex/<slug>/reviewer/<YYYY-MM-DD>/qa-report.md               ← reviewer-A 报告(覆盖所有仓)
<primary-repo>/.opencode/<slug>/reviewer/<YYYY-MM-DD>/qa-report.md            ← reviewer-B 报告(覆盖所有仓)

副仓不落任何 AC 产出。
```

reviewer 在主仓读到 prompt,自己按 prompt 头部"仓库与分支"段列出的副仓路径 cd 过去做代码验证;所有验证结论汇总到主仓的一份报告中。副仓不需要留存报告副本。

> v1.7 → v1.8 变化:报告从"每仓镜像"改为"仅主仓"。v1.7 及更早的副仓报告镜像不需要主动删(留作历史归档无害);新需求按 v1.8 落盘。

## 2.5 需求维度归档

**目的**:
1. 跨多日 / 跨会话同需求迭代时,避免主 agent 遗漏历史决策
2. 新建 slug 时自动拉取<CALENDAR_PLATFORM> PRD 文档作为需求基线
3. 方案只保留最终版,不含 AC 评审过程痕迹

### 路径结构

```
<primary-repo>/.claude/
  <slug>/                         ← 需求维度,该需求所有产物的组织根
    index.md                      ← 每轮 AC 结论索引(只记结论)
    summary.md                    ← 决策概要(只记结论,不链中间产物)
    PRD-<需求名>.md               ← 产品方案(一个需求一份蓝图)
    tech-design-<需求名>.md       ← 技术方案(一个需求一份,版本迭代覆盖)
    coder-task-doc            ← 编码执行计划(一个需求一份,分仓可多份)
    ddl/                          ← DDL 脚本等基础变更
    iteration-log.md              ← 方案迭代记录(仅当用户要求)
    <YYYY-MM-DD>/                 ← 日期目录:每次迭代/执行才产生的内容
      tech-review-prompt.md       ← 评审提示词(每轮不同)
      coder-result-<仓>.md        ← 编码执行结果(每次执行不同)
      qa-regression-prompt.md
      case-studies/               ← 多轮 case 沉淀
  <YYYY-MM-DD>/                   ← v1.7 及更早的历史日期目录(保留)
```

**示例**(需求 `625-org-standard-management`):

```
<primary-repo>/.claude/
  625-org-standard-management/
    index.md
    summary.md
    PRD-组织架构规范化管理.md                  ← 产品方案(蓝图,slug 根)
    tech-design-组织架构规范化管理.md           ← 技术方案最终版(蓝图,slug 根)
    coder-task-doc                       ← 后端编码执行计划(蓝图)
    coder-task-doc                           ← CLI 编码执行计划(蓝图)
    coder-task-doc                      ← 前端编码执行计划(蓝图)
    ddl/                                        ← DDL 脚本(蓝图)
    2026-06-25/
      tech-review-prompt.md
      coder-result-cli.md                       ← CLI 编码执行结果(迭代产物)
      coder-result-frontend.md                  ← 前端编码执行结果(迭代产物)
    2026-06-26/
      qa-regression-prompt.md
      case-studies/
  .codex/625-org-standard-management/2026-06-25/evaluation.md   ← reviewer-A B2 报告
  .codex/625-org-standard-management/2026-06-26/qa-report.md    ← reviewer-A A 模式报告
  .opencode/625-org-standard-management/2026-06-25/evaluation.md
  .opencode/625-org-standard-management/2026-06-26/qa-report.md
```

**文件分类规则**:

slug 根目录放"一个需求一份蓝图"的规划文档,日期目录放"每次迭代/执行才产生"的产物:

| 类别 | 放哪 | 说明 |
|------|------|------|
| PRD / 产品方案 | `<slug>/` | 需求基线,跨版本引用 |
| 技术方案 | `<slug>/` | 一个需求一份(含 v1/v2 等版本迭代),最新版覆盖或标注版本号 |
| coder 执行计划(task) | `<slug>/` | 分仓可多份(backend/cli/frontend),是执行蓝图非产物 |
| DDL 脚本 | `<slug>/ddl/` | 数据库变更,与代码版本绑定 |
| review prompt | `<slug>/<YYYY-MM-DD>/` | 每轮评审可能不同 |
| coder 执行结果(result) | `<slug>/<YYYY-MM-DD>/` | 每次执行产出不同,按日期追踪 |
| case-studies | `<slug>/<YYYY-MM-DD>/case-studies/` | 按轮次迭代 |
| 临时脚本/截图 | `<slug>/<YYYY-MM-DD>/` | 一次性产物 |

**判断口诀**:这份文件下次进这个需求还会是同一份吗?是 → slug 根;不是 → 日期目录。

**主 agent 产物落盘流程**:

1. 规划文档(PRD / 技术方案 / coder-task / DDL)→ 直接落 `<slug>/` 根目录
2. 迭代产物(review prompt / coder-result / case-studies)→ 落 `<slug>/<YYYY-MM-DD>/`
3. 追加一行到 `<slug>/index.md`(机械动作)
4. 重大决策 / v 版本切换 / 新发现的未闭环项 → 更新 `<slug>/summary.md`

### index.md — 每轮 AC 结论索引

**只记每轮 AC 结论**,不记录 reviewer 的中间报告。在存在阻塞问题时,**可选择**记录中间产物以便追溯。

主 agent 每轮 AC 结束后追加一行:

```markdown
# <slug> — AC 结论索引

| 日期 | 轮次 | 模式 | 结论 | 产物(可选) |
|---|---|---|---|---|
| 2026-06-20 | R1 | B2 技术方案 | 🟡 有条件通过(2 个 MEDIUM 建议已修) | — |
| 2026-06-22 | R2 | A QA 回归 | 🟢 通过(0 BLOCKER,0 HIGH) | — |
| 2026-06-25 | R3 | A QA 回归 | 🔴 阻塞(codex+opencode 都报 SQL 性能问题) | [../.codex/.../qa-report.md](../../.codex/625-org-standard-management/2026-06-25/qa-report.md) |
```

- "结论"列用 1-2 行概述本轮 AC 结果
- "产物"列大部分轮次填 `—`;仅在存在阻塞问题需要追溯时,记录关键中间产物路径

### summary.md — 决策概要

**只记录每轮结论,不关联 QA/AC 多轮次的中间产物。** 主 agent 手写,跨会话首要 Read 对象:

```markdown
# <slug> — 决策概要

## 状态
- 当前阶段:{需求澄清 / 技术方案 / 编码 / QA / 上线 / 已收尾}
- 最后更新:{YYYY-MM-DD}
- PRD:[prd.md](./prd.md)
- 技术方案:[tech-design.md](./tech-design.md)

## 决策史
> 每轮 AC 一行,只记结论;不链 reviewer 报告

- R1 B2 (2026-06-20):技术方案评审通过,2 个 MEDIUM 建议(接口分页参数统一 / 异常日志级别)已修
- R2 A (2026-06-22):QA 回归通过,0 BLOCKER,0 HIGH,方案已定稿

## 未闭环项
- [ ] ...
```

**避免空话**(反例):
- "v2 是 v1 的扩展" / "整体 OK" / "技术方案没大问题"

**正例**:
- "R1 B2 技术方案评审 🟡 有条件通过,详见 tech-design.md"
- "R2 A QA 回归 🟢 全通过,已上线 6/22"

### <CALENDAR_PLATFORM> PRD 转存(v1.8 新增)

新建 slug 时,若用户提供<CALENDAR_PLATFORM> PRD 文档 URL:

1. 主 agent 用<CALENDAR_PLATFORM> MCP 工具(`fetch-doc`)获取文档内容
2. 将内容转成 Markdown,存储为 `<primary-repo>/.claude/<slug>/prd.md`
3. 在 `summary.md` 的"状态"段补上 `PRD: [prd.md](./prd.md)` 引用
4. 若用户未提供<CALENDAR_PLATFORM> PRD URL,跳过此步

### 方案版本管理(v1.8 新增)

**方案只保留一份最终版**,适用所有方案类型(产品 / 技术 / 测试 / 上线方案):

| 规则 | 说明 |
|---|---|
| **文件名不带版本号** | `tech-design.md` 而非 `tech-design-v1.md` / `tech-design-v2.md` |
| **只保留最终结果** | 经过多轮 AC 评审的方案,每次修订直接覆盖原文件 |
| **不含评审过程痕迹** | 方案内容不能体现"reviewer-A 说 X,修改为 Y"这类 AC 过程;只呈现最终决策 |
| **迭代记录按需保存** | 版本迭代内容 → `iteration-log.md`,**仅当用户明确要求记录时**创建;主 agent 不主动生成 |

**为什么方案不含 AC 评审痕迹**:方案定稿后通常会转为<CALENDAR_PLATFORM>文档进行正式技术评审(含其他方案评审)。文档中存在"reviewer-A 发现 XX 问题,已改为 YY"这类片段,读者没有 AC 过程的上下文输入,反而造成困惑,让评审难以进行。

### iteration-log.md 骨架(新增,v1.8)

仅当用户要求记录方案迭代过程时创建:

```markdown
# <slug> — 方案迭代记录

> 本文件仅在用户要求时创建,记录方案从初版到最终版的迭代过程。

## 迭代记录

### 2026-06-20 → 2026-06-22(例)
- **变更点**:接口分页参数从 `page/pageSize` 统一为 `cursor/limit`
- **原因**:B2 评审建议统一分页风格
- **影响范围**:3 个接口(`/api/org/list` `/api/org/search` `/api/org/tree`)
```

### slug 命名约定

- kebab-case(小写字母 + 数字 + `-`),正则 `^[a-z0-9]+(-[a-z0-9]+)*$`
- 无空格,无中文,无大写
- 通常 = 需求英文短名(如 `travel-od` / `auth-refactor` / `payment-v2`) 或 `<issue-number>-<short-name>`(如 `625-org-standard-management`)
- `_oneoff_`(下划线包夹)= 一次性 spike,**跳过整个需求目录创建** — 产物只落 `.claude/<YYYY-MM-DD>/`,不进 `_oneoff_/`
- 以 `_` 开头的其它名(如 `_test_`)保留为协议特殊值,业务需求避免

### 非法输入处理(主 agent 强制流程)

用户在第 0 件事 AskUserQuestion 输入不符合 `^[a-z0-9]+(-[a-z0-9]+)*$` 且不是 `_oneoff_` 的 slug 时(常见:中文需求名、含空格、含大写),**主 agent 必须**:

1. **不要**静默自动翻译为 kebab-case(LLM 翻译歧义会导致同需求不同主 agent / 不同会话生成不同 slug → 决策史断层)
2. **不要**直接接受非法输入(写入 `.claude/差旅 OD/` 这种目录会破坏跨 OS 兼容、grep 困难、git 不友好)
3. **必须**主 agent 给出建议的 kebab-case 翻译(如"差旅 OD" → 建议 `travel-od`),通过 **第二轮 AskUserQuestion** 让用户确认或重输:
   - 选项 1:"使用建议的 `travel-od`"
   - 选项 2:"用户输自己的 kebab-case slug"
   - 选项 3:"取消,改走 `_oneoff_`(本次不入需求维度归档)"
4. 若用户拒绝建议且 3 次输入仍非法,主 agent 默认走 `_oneoff_` 并明确告知用户原因,**不要**强行落盘到非法路径

### 何时用 `_oneoff_`

- 一次性脚本评审(后面不会再迭代)
- 文档级一次性核验
- 用户明确说"这次 spike,不进项目主线"

### 何时不用 `_oneoff_`

- 真正的业务需求(哪怕只跑一次也建议起 slug — 后续可能补迭代)
- 跨多日的需求

### 副 agent(reviewer)与 `<slug>/` 的关系

- 副 agent 归档目录(`.codex/` `.opencode/` `.cursor/` ...)**同样使用 `<slug>/<YYYY-MM-DD>/` 层级**
- 副 agent **不读不写** `<primary-repo>/.claude/<slug>/` 下的 index/summary/prd/方案文件(双盲底线,详见 §6)— `<slug>/` 是主 agent 跨日 / 跨会话工作记忆,副 agent 看到会"附和主 agent 决策史",失去独立视角

### 与 case-studies 的关系(避免混淆)

| 维度 | `<slug>/index.md` `<slug>/summary.md` | `<slug>/<date>/case-studies/round-N-XXX-*.md`(v1.2) |
|---|---|---|
| 谁在用 | 主 agent **跨日 / 跨会话**记忆 | reviewer **跨轮**带先验工作 |
| 读者 | 主 agent | reviewer(通过 prompt 路径塞引用) |
| 内容 | 每轮 AC **结论** + 决策史 | 一类盲点的归纳 + 状态机(监视/未闭环/已闭环) |
| 跨 reviewer 对称 | 不需要(主 agent 主权) | 必须(双盲对称,塞给所有 reviewer 的内容相同) |

两个互补,不替代。`<slug>/summary.md` 解决"主 agent 自己跨会话遗忘";`case-studies/` 解决"reviewer 跨轮带先验"。

## 3. 放什么 / 不放什么

### 可以放

- 需求文档、技术方案、调研笔记、架构决策
- 产品 PRD(从<CALENDAR_PLATFORM>转存的 Markdown)
- 方案迭代记录(`iteration-log.md`,仅当用户要求)
- AC 协同的提示词(`tech-review-prompt.md` / `qa-regression-prompt.md`)
- 各方的评审报告 / 回归报告
- 临时脚本(只在该任务生命周期内使用的)
- 调试日志摘要(脱敏后)

### 不要放

- 包含真实业务数据的文件(员工姓名 / 工号 / 邮箱 / token 值等原文)
- `docs/` 才应该有的正式项目文档(正式文档走 `docs/` 常规流程)
- 仓库根目录的随手文件(根目录只留项目本来就有的东西)
- 其他 agent 的产出(不要跨 agent 写对方目录)

## 4. 日期滚动

- 同一 slug 下,同一天的多个产出可以叠加到同一个 `<YYYY-MM-DD>` 目录
- 跨天继续做同一个任务时,新产出进同 slug 下的新日期目录;历史目录保留别删
- 同一需求的各轮次(round-1, round-2, …)产出统一放在同一个 `<slug>` 下,按日期区分
- 删除只在任务明确结束 + 用户确认后才做
- 每个 `<YYYY-MM-DD>` 目录建议用一份 `README.md` 作为当天工作概览(可选,但有助于回看)

## 5. 双盲铁律(强制)

### 5.1 通用规则(模式 A 与 B 都适用)

**N 个 reviewer 互不参考其他人的过程与产出**(N 路双盲对称)。

> 把任一对方结论提前喂另一个,会让其停在"照着清单复跑",失去交叉价值。N=3 / 4 时双盲对称要求更严:不能让 A 看 B 的、也不能让 A 看 C 的、也不能让 B 看 C 的。

> **`<slug>/` 下的 index/summary/prd/方案文件是主 agent 主权区,reviewer 不读不写**:reviewer 在 prompt / 报告 / 任何工作中**不要 Read 或引用** `<primary-repo>/.claude/<slug>/index.md` `summary.md` `prd.md` `tech-design.md` 等文件。这是主 agent 跨会话记忆 + 方案知识,副 agent 看到会附和主 agent 决策史 → 失去独立交叉价值。

### 5.2 模式 A 特化(编码后回归)

- 提示词里**不写**主 agent 的判断性自测结论(例:"已验证通过的 5 个接口"、"发现的 3 个瑕疵")
- **例外**:事实性信息(可用测试角色名、数据规模、已批准的接口)可以写进提示词的"环境信息"段;判断性结论不要写

### 5.3 模式 B 特化(B2/B3/B4 双盲场景)

- **允许**让 reviewer 回看**自己**上一轮的同类报告(评估方案是否回应了上一轮问题)
- **严禁**让一方看另一方的同期或历史报告
- 不要在提示词里写主 agent 对方案的"自我点评";让 reviewer 从零判断每项变更的合理性

### 5.4 B1 产品方案例外(单 reviewer,不双盲)

- 协议层放弃双盲 — 只一份 reviewer 跑一次
- prompt 中**保留** `.{a-name}` `.{b-name}` 占位符(N reviewer 配置时也含 `.{c-name}` 等),但**语义改为"任一即可"**而非"双盲身份":
  - reviewer 在模板 Step 1"选择归档目录"时,从所有配置的 `.{a-name}/` `.{b-name}/` `.{c-name}/` ... 中**任选一**(默认按主 agent 派发指示;如未告知,默认 `.{a-name}/`)
  - **不**要求 reviewer 执行"识别 A/B/C/D 身份"的双盲动作 — 那是 B2/B3/B4/A 双盲场景的纪律
- 报告写到 reviewer 选定的归档目录(`.{a-name}/<slug>/reviewer/<date>/` 或 `.{b-name}/<slug>/reviewer/<date>/` 或 ...,**只一份**;不要同时写多份)
- 不存在"对方报告"概念,§5.1 双盲规则在本场景**自动生效但无对象**(没有第二方可看)
- 详见 `plan-review-perspectives.md` §2 与 `cross-validation.md` §4.2

## 6. 不要碰对方目录

- **禁止**一个 agent 修改/读取另一个 agent 的归档目录内容(双盲底线)
- **禁止**主 agent 在 reviewer 的目录写文件(reviewer 自己写自己的)
- **禁止**reviewer 写到 `.claude/`(那是主 agent 区)
- **禁止**reviewer **读** `.claude/<slug>/index.md` `summary.md` `prd.md` `tech-design.md` 等(主 agent 跨会话工作记忆 + 方案知识,副 agent 看到会附和主 agent 决策史)
- **禁止**reviewer 之间互看(reviewer-A 不看 `.{b}/`,B 不看 `.{a}/`,C 不看 `.{a}/` 也不看 `.{b}/`,以此类推)
- 主 agent 做 N+1 份对比时,可以读所有 reviewer 的归档目录(`.{a}/<slug>/reviewer/<date>/` `.{b}/<slug>/reviewer/<date>/` `.{c}/<slug>/reviewer/<date>/` ...);自己读 OK,但不能改

## 7. 临时文件去哪

不要写到归档目录之外的仓内位置。临时文件走 OS 临时目录:

| OS | 路径变量 |
|---|---|
| Windows | `%TEMP%`(`C:\Users\<user>\AppData\Local\Temp`) |
| Linux | `/tmp` 或 `$TMPDIR` |
| macOS | `/tmp` 或 `$TMPDIR` |

例:fetch hijack mjs 文件、临时下载、调试 dump 都走 OS 临时目录,用完清理。

## 8. 默认 gitignore 建议

新项目里建议在 `.gitignore` 加(覆盖默认 N=2 + 常见扩展 reviewer):

```
# AI agent local archives — local scratch space, not shared via git
.claude/
.codex/        # default reviewer-A
.opencode/     # default reviewer-B
.cursor/       # optional reviewer-C/D/...
.cline/
.qoder/
.aider/
.trae/
.zcode/
```

> 配置 N>2 时,把对应 reviewer 的归档目录也加进去。每行一个,字母循环 a-z 最多 26 个。

如果团队希望某些归档共享(例:技术方案),可以单独白名单:

```
.claude/
!.claude/<slug>/tech-design.md   # 例外:技术方案共享
!.claude/<slug>/rollout-plan.md
```

## 9. 禁止事项汇总

- 禁止往 `.claude/` `.codex/` `.opencode/` 目录下写非归档内容(临时缓存、部分下载文件)
- 禁止一个 agent 修改另一个 agent 的归档目录内容
- 禁止把归档目录加入 git ignore 以外的规则覆盖(各仓已有的 gitignore 规则优先)

## 版本记录

- v1.7.0 (2026-06-26):**reviewer 产出路径加 `reviewer/` 层级**:所有 reviewer 归档路径从 `.{reviewer}/<slug>/<YYYY-MM-DD>/` 改为 `.{reviewer}/<slug>/reviewer/<YYYY-MM-DD>/`,主 agent `.claude/<slug>/<YYYY-MM-DD>/` 不变
- v1.6.0 (2026-06-26):**§2.5 需求维度归档扩展 slug 目录内容范围**:规划文档(PRD / 技术方案 / coder-task / DDL)放 slug 根目录,迭代产物(review prompt / coder-result / case-studies)放日期目录;新增文件分类规则表 + 判断口诀 + 主 agent 产物落盘流程;示例更新为真实需求 625-org-standard-management 布局。来源:625-org-standard-management 实战中 PRD / tech-design 跨日期目录散落不便查找
- v1.5.0 (2026-06-25):v1.8.0 同步。**归档加 `<slug>/` 层级**(所有 agent 路径改为 `.<agent>/<slug>/<YYYY-MM-DD>/`,对齐多 agent 协同惯例);**多仓产出仅主仓**(删除"报告每仓镜像",全部 AC 产出只在主仓落盘);**index/summary 只记结论**(不记录 reviewer 中间报告,可选记录阻塞问题);**<CALENDAR_PLATFORM> PRD 转存**(新建 slug 时用<CALENDAR_PLATFORM> MCP 拉取 PRD 存为 prd.md);**方案单份最终版**(不带版本号,不含 AC 评审痕迹,迭代记录按需保存到 iteration-log.md);§2.5 完全重写;§3 更新;§8 gitignore 加 .trae/.zcode
- v1.4.0 (2026-05-28):v1.6.0 同步。§0 路径词汇表加 `<slug>` 占位符;§2 跨仓镜像表加"需求维度索引/概要"行;**新增 §2.5 需求维度归档**(`.claude/<slug>/index.md` + `summary.md`,主 agent 跨日跨会话决策史,副 agent 不读不镜像);§5.1 / §6 加红线"reviewer 不读 `<slug>/`"。来源:v1.5 实战(差旅 OD v1/v2 跨日散落,主 agent 跨会话遗漏 v1 决策)反例
- v1.3.0 (2026-05-26):v1.4.0 同步。§0 新增"路径占位符词汇表",定义 `<repo>` / `<primary-repo>` / `<secondary-repo-N>` / `<all-repos>` / `<reviewer-cwd>` / `<skill-path>`,显式列出"同字面 `<repo>` 三种语境含义不同"的歧义点
- v1.2.0 (2026-05-25):v1.3.0 同步。§1 归档目录骨架扩为 N reviewer(默认 2,可配置 1-N≤26);§5.1 双盲改"N 路对称";§6 加"reviewer 之间互不看";§8 gitignore 建议扩展 reviewer-C/D/...
- v1.1.0 (2026-05-25):v1.3.0 同步。§2 跨仓镜像规则改"prompt 单份主仓 / 报告每仓镜像";§5 双盲特化加 5.4 B1 产品方案单 reviewer 例外
- v1.0.0 (2026-05-21):首版,从 <DASHBOARD> `archive-rules.md` v1.1 抽象,泛化 reviewer 名字,加 gitignore 建议章节
