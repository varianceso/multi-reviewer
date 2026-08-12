# Changelog

All notable changes to **multi-reviewer** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.10.0] - 2026-08-12

### Added

- **reviewer 工作模式 reference**:`reviewer-workmode.md` 原生纳入 reviewer 角色映射、精简派发、验证白名单、基线债阻断、Codex 最多两次重试后切 zcode、mico reviewer、≤5 commit 和 ≤200 字标准化总结。
- **Java 后端条件核查**:`java-backend-standard.md` 纳入 hrod-plus Java 命名、分层、事务、异常、SQL、日志和格式规则；B2/B3/A 在确认 Java 后端范围时加载。

### Changed

- 五份 reviewer prompt 同步引用通用工作模式；B2/B3/A 增加 Java 适用性门，B3/A 增加验证白名单与基线债阻断纪律。
- 保持 review-only 边界、五种入口、双盲与主仓产出规则不变；`init.mjs` 不新增 Coder 配置，现有业务仓无需迁移。
- 已同步 `skills/` 与 `plugins/multi-reviewer/skills/` 镜像及一致性检查锚点。

## [1.<REDACTED>0] - 2026-06-26

### Changed

- **reviewer 产出路径加 `reviewer/` 层级**:所有 reviewer 归档路径从 `.{reviewer}/<slug>/<YYYY-MM-DD>/` 改为 `.{reviewer}/<slug>/reviewer/<YYYY-MM-DD>/`,主 agent `.claude/<slug>/<YYYY-MM-DD>/` 不变

## [1.9.0] - 2026-06-26

### Changed

- **slug 目录范围扩展**:`archive-and-blind.md` §2.5 扩展 slug 根目录可放文件类型:规划文档(PRD / 技术方案 / coder-task / DDL)放 `<slug>/` 根目录,迭代产物(review prompt / coder-result / case-studies)放 `<slug>/<YYYY-MM-DD>/`。新增文件分类规则表、判断口诀、主 agent 产物落盘流程。来源:625-org-standard-management 实战中 PRD / tech-design 跨日期目录散落不便查找。
- **加固 mirror 完整性**:`check-consistency.mjs` 新增全面镜像校验,覆盖全部受检 skill 文件(`skills/` 与 `plugins/multi-reviewer/skills/` 间字节一致)。此前仅 5 个文件有镜像校验,其余 reference + template 文件可能无声漂移。

### Migration

- `archive-and-blind.md` 内部版本已升级至 1.6.0,无向后不兼容;历史 slug 目录按原有规则继续有效
- 无需手动迁移;`check-consistency.mjs` 的新增镜像检查自动生效

## [1.8.0] - 2026-06-25

### Changed

- **归档目录加 `<slug>/` 层级**:所有 agent(主 agent + reviewer)路径从 `.<agent>/<YYYY-MM-DD>/` 改为 `.<agent>/<slug>/<YYYY-MM-DD>/`,对齐多 agent 协同的归档惯例。`.claude/<slug>/` 成为需求物理根目录(不再独立于日期目录)。
- **多仓产出仅主仓**:所有 AC 产出(prompt + 报告 + 方案文档)只在主仓落盘,不再镜像副仓。reviewer 在副仓跑验证后回主仓写一份报告。简化多仓维护成本,审阅者只看主仓即可。
- **slug 下 index/summary 只记结论**:`index.md` 只记每轮 AC 结论(不记日常 reviewer 报告;可选记录阻塞问题产物路径);`summary.md` 只记结论不关联 QA/AC 中间产物。减少噪音,聚焦决策史。
- **<CALENDAR_PLATFORM> PRD 转存**:新建 slug 时若用户提供<CALENDAR_PLATFORM> PRD 文档 URL,主 agent 用<CALENDAR_PLATFORM> MCP `fetch-doc` 转存为 `.claude/<slug>/prd.md`,作为需求基线。
- **方案只保留一份最终版**:所有方案类型(产品/技术/测试/上线)文件名不带版本号(如 `tech-design.md`),内容不含 AC 评审过程痕迹,只呈现最终结果。迭代记录仅当用户要求时存 `iteration-log.md`。

### Added

- **`templates/iteration-log.md`**:方案迭代记录骨架(可选使用,记录变更点 + 原因 + 影响范围)。

### Migration

- **`<slug>/` 层级**:v1.7 及更早的 `.<agent>/<YYYY-MM-DD>/` 历史目录保留不动;新需求按 v1.8 路径落盘
- **多仓报告不再镜像**:v1.7 及更早副仓的历史报告副本不需要主动删;新需求只写主仓
- **check-consistency.mjs** 检查已同步更新

## [1.7.0] - 2026-06-11

### Added

- **Rename / alias**:插件、skill、marketplace 主名从 `tri-agent-coding` 更名为 `multi-reviewer`,展示名改为 `Agent Crosscheck`;新增自然语言短别名 `mrcc`,用于"用 mrcc 评审方案 / 用 mrcc 跑 QA 回归"这类交互。
- **`mrcc` alias skill**:新增 `skills/mrcc/SKILL.md`,让 Codex / Claude 不只通过 description 识别自然语言别名,也能通过 `/skill mrcc` 找到真实技能入口;该入口委托到 `multi-reviewer` 主协议。
- **Codex plugin manifest**:`.codex-plugin/plugin.json` 新增 Codex 可安装入口,复用现有 `skills/` 目录,补齐 Codex UI 所需的 `interface` 元数据和 starter prompts。
- **Codex marketplace**:`.agents/plugins/marketplace.json` 新增 repo-local marketplace,插件条目指向标准 Codex 插件目录 `source.local + path="./plugins/multi-reviewer"`,支持通过 Codex marketplace 安装本仓插件。
- **README 安装说明**:新增 `codex plugin marketplace add` + `codex plugin add multi-reviewer@multi-reviewer-marketplace` 安装路径,并说明安装后新开 Codex 线程、通过自然语言初始化当前仓库;保留 Claude Code marketplace 与手动 clone 路径。
- **Codex skill loader 兼容**:收短 `skills/multi-reviewer/SKILL.md` frontmatter description,避免超过 Codex 1024 字符上限导致 skill 被跳过。

### Changed

- **版本号 bump**:`1.6.0` → `1.7.0`,本轮是 Codex 安装适配发布,协议行为不变。
- **一致性检查扩展**:`check-consistency.mjs` 现在校验 Codex manifest / marketplace JSON、Codex 与 Claude plugin 版本同步、Codex manifest 指向 `./skills/`、Codex marketplace 指向标准插件目录、`mrcc` alias skill 存在,以及所有 skill description 不超过 1024 字符。

## [1.6.0] - 2026-05-28

v1.5 首次以 plugin 形式实际部署后,用户在 2026-05-28 当天反馈了 4 个真实使用场景中暴露的协议问题。本轮**全部直击根因机制化**,**零文件级 breaking change**(v1.5 项目零文件迁移),但**主 agent 交互层新增 1 个 AskUserQuestion 拦截步骤**(第 0 件事 slug,可选 `_oneoff_` 等价老行为)。

### 用户反馈(2026-05-28)

来源:用户用 codex + opencode + trae 三 reviewer 跑了一次 QA 回归 + 用 multi-reviewer 跑了一次差旅 v2 方案设计,实战暴露:

1. **主 agent 把"严格多数共识"当"自动采纳"了** — N=3 时 2 票同认即直接采纳,跳过 §6.5 自扫纪律。问题是主 agent 在与用户交互中积累的上下文(业务理解 / 历史决策 / 未明示约束)是 N reviewer 看不到的;直接信副 agent 等于丢了用户主权,可能采纳"看似多数共识但实际错位"的 finding
2. **AskUserQuestion 上下文不足** — 主 agent 让用户裁决时,只甩一句"reviewer X 说 Y 有问题,要修吗?",没有问题上下文 / 具体例子 / 主 agent 怎么看;用户难裁决,容易拍错
3. **归档目录单维度散** — 差旅 OD v1 在 5/20 日期目录,v2 在 5/28 日期目录,跨多周后主 agent 跨会话进入只看到当天目录,容易丢 v1 决策史 → 重复设计 / 错过 v1 未闭环项
4. **skill 边界被误用为"设计 skill"** — v2 方案设计阶段,主 agent 看到 description 里 "coding & plan-review" 字样,认为本 skill 可以**产出**方案。实际本 skill **只做核验**(已有方案的双盲评审 / 编码后 QA),不做"从零设计"

### Added

- **🚫 skill 边界收紧 = 核验环 ≠ 设计/编码环**(对应反馈 #4):
  - `.claude-plugin/plugin.json` description 重写,首句 "Multi-agent CROSS-VALIDATION protocol for already-drafted plans / already-written code. **Does NOT generate plans or code itself**" — 明确负面语义,LLM 不再误以为该 skill 能产出
  - SKILL.md frontmatter description 同步,加入 "**This skill is review-only — it does NOT generate plans or code**" + 列出 NOT triggered by 关键词("出方案 / 设计方案 / 拍方案 / 写代码 / 实现一下" → superpowers)
  - SKILL.md §0 加 "是什么 / 不是什么" 引言段(含 3 条反例)
  - SKILL.md §1.1 强触发表注脚说明"评审 = 已有方案的评审,不是设计方案";排除表加红线
  - 4 处 description 同步:`.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json` + `marketplace.json`(顶层 + 内层)
- **🆕 主 agent 核验报告纪律 5 步 → 6 步**(对应反馈 #1):
  - `cross-validation.md` §6.5 新增 Step 1 "**逐 finding 自查代码**" — 副 agent 报的每条 finding,主 agent 必须亲自 Read 对应文件 file:line ± 5-15 行,记下 1-3 行片段 + 独立判断,**不允许仅凭"严格多数共识"跳过自查直接采纳**
  - 核心断言:**副 agent 严格多数共识 ≠ 主 agent 自动采纳**(因为主 agent 在用户交互中积累的上下文是 N reviewer 看不到的)
  - anti-pattern 表加 2 条最严重项("严格多数 → 跳过自查""选项不带自查证据")
  - SKILL.md §3 重写为 6 步 + 核心断言;§8 per-task checklist 5 项 → 6 项,Step 1 标 🆕
  - `cross-validation.md` frontmatter 1.3.0 → 1.4.0
- **🆕 AskUserQuestion 4 要素强制**(对应反馈 #2):
  - `cross-validation.md` §7 重写选项骨架,每条 finding 交用户裁决时必带 4 要素:① 副 agent 言论(原文 / 概括,标明哪个 reviewer)② 主 agent 自查(§6.5 Step 1 产物的 file:line + 1-3 行片段 + 独立判断)③ 具体例子(类似 git history / 现有代码对照 / 测试场景)④ 选项
  - 理由:**上下文不到位的 AskUserQuestion 会让用户拍错** — 用户从主 agent 处获得的信息密度决定裁决质量
  - SKILL.md §3 §8 同步引用 4 要素
- **🆕 slug 入口 + 需求维度归档**(对应反馈 #3):
  - 主 agent 进入 skill **第 0 件事** AskUserQuestion 拿 slug:列出 `.claude/` 下现有需求子目录 + 新建 + `_oneoff_`(一次性 spike)
  - 拿到 slug 后**立即 Read** `<primary-repo>/.claude/<slug>/summary.md`(若存在)— 拾跨日 / 跨会话决策史
  - **双维度归档**:物理文件仍按日期落 `.claude/<YYYY-MM-DD>/<file>`(老结构零迁移),需求维度只挂索引 + 概要
    - `<slug>/index.md`:机械索引(主 agent 落盘新产物时追加一行,日期 / 类型 / 文件 / 备注)
    - `<slug>/summary.md`:决策概要(主 agent 手写,跨会话首读对象;含状态 / 决策史 / 未闭环 / 待主 agent 关注)
  - 副 agent **不读不镜像** `<slug>/`(双盲底线;reviewer 看会附和主 agent 决策史失去独立视角)
  - `slug=_oneoff_` 跳过整个需求目录创建(一次性 spike 不入需求线)
  - 新增 `references/archive-and-blind.md` §2.5 完整段 + `templates/slug-index.md` `slug-summary.md` 骨架
  - SKILL.md §2 决策树重写为"两步":第 0 步 slug → 第 1 步 5 选 1;§5 归档骨架加 `<slug>/`;§8 per-task 加"第零件事 slug"+ 需求维度归档分支
- **`scripts/check-consistency.mjs` 加 6 个新 check**(共 30 → 36):
  - main-agent self-verify discipline upgraded to 6 steps
  - AskUserQuestion 4-element context required
  - slug requirement archive documented
  - slug index/summary templates exist
  - skill boundary tightened (review-only, not for generation)
  - all 4 manifest descriptions synchronized to cross-validation semantics

### Changed

- **frontmatter version 升级**:
  - `cross-validation.md` 1.3.0 → 1.4.0
  - `archive-and-blind.md` 1.3.0 → 1.4.0
  - `SKILL.md` (本 skill 版本号) 1.5.1 → 1.6.0
- **§11 同步矩阵加 4 行**:主 agent 自查证据 4 要素 / slug + 需求维度归档 / skill 边界 / 把 v1.4 那行的 5 步描述更新为 6 步
- **plugin.json description 引用从 "v1.5 details" 改为 "v1.6 details"**

### 设计原则(本轮)

- **主 agent 上下文 > 副 agent 严格多数**:核验环里,主 agent 是最了解用户业务背景的"裁判";副 agent 是 LLM,可能集体犯同源偏差。共识阈值用于"必改优先级排序",不能替代主 agent 独立判断
- **上下文密度决定裁决质量**:AskUserQuestion 4 要素是最低门槛,而非加分项;无 4 要素的选项 = 让用户在信息真空里拍板
- **双维度归档不破坏老结构**:物理文件还按日期落,需求维度只挂"索引 + 概要"两个轻文件;v1.0-v1.5 项目零迁移,新需求自动走 slug 入口
- **skill 边界 = 核验环**:本 skill 与 superpowers 互调而非互替;**设计 / 编码 → superpowers**,**评审 / 回归 → 本 skill**;边界混淆是 v1.5 description 措辞问题,v1.6 修复

### 迁移说明(零文件级 breaking change;主 agent 交互层新增 slug AskUserQuestion)

- v1.5 项目升级 v1.6 **零文件迁移成本**:references / SKILL.md 随 skill 升级自动生效;`init.mjs` 不变(D4 决策);老 `.claude/<YYYY-MM-DD>/` 物理结构保留;老 `init.mjs --reviewer-a/b/...` 命令行不变
- **新增交互**:每次进 skill 第 0 件事 AskUserQuestion 拿 slug,比 v1.5 多 1 步;**老行为兼容**:用户可选 `_oneoff_` 等价 v1.5 行为(直接 5 选 1,不入需求维度归档)
- 老需求(已有 `.claude/<YYYY-MM-DD>/` 但无 `<slug>/`)有两种处理方式:
  - **后补 `<slug>/`**:主 agent 手动建 `.claude/<old-slug>/{index.md, summary.md}`,把历史日期目录的产物链接进去(适合还在迭代的需求)
  - **保持原样**:已收尾的需求不必补,新需求按 v1.6 走即可(slug 入口可选,不强制)
- 新需求强烈建议走 slug 入口,跨多日 / 跨会话不丢决策史
- 老 prompt 母板里的占位符不变,等价覆盖 — 重跑 `node scripts/init.mjs <repo>` 不会动用户填好的 auth.md / env-tools.md
- v1.5 老 commit / 老 changelog 里的 "v1.4 引入" 等历史描述保留不动(只增量加 v1.6 内容)

### v1.6 self-review 反馈处理(2026-05-28)

v1.6.0 实施完成 + push feature/v1.6.0 后,**用 v1.6 自身协议跑了一轮 dogfood self-review**(B2 双盲;reviewer-A=codex,reviewer-B=opencode;slug=`v1.6-self-review`)。**主 agent 严格走 v1.6 §6.5 6 步纪律 + §7 4 要素**裁决,本次 self-review 既验证协议本身又收集 finding。

两份评审报告均给 🟡 有条件通过;codex 报 1 HIGH(SKILL.md:161 路径口径) + 1 HIGH(reviewer prompt 模板未同步禁读 `<slug>/`) + 6 MEDIUM;opencode 报 1 MEDIUM 阻塞(同 codex HIGH-1) + 5 HIGH/MEDIUM 强建议 + 7 LOW 锦上添花。主 agent 走 6 步核验后,共识 7 + opencode 单方真漏 4 + 用户裁决 hard-constraints §2.2 提前 + 锦上添花 3 项一并修。

**合并 main 前修复**(本次仍以 1.6.0 版本号合 main,不单独 bump 1.6.1 — 因为 1.6.0 尚未实际合 main,属同一发布周期内的 dogfood 修复):

- **fix#1 (codex HIGH + opencode MEDIUM 阻塞,共识必改)**:`SKILL.md:161` 字面写"所有产物归到 `.claude/<slug>/<date>/`",与协议主体(双维度归档:物理按日期 + `<slug>/` 只挂索引 + 概要)字面级矛盾 → 改为"产物**物理位置仍落 `.claude/<YYYY-MM-DD>/`(零迁移)**;需求维度只挂 `.claude/<slug>/{index.md, summary.md}` 索引 + 概要"
- **fix#2 (codex HIGH + opencode K6 MEDIUM,共识必改)**:5 份 reviewer prompt 模板(product / tech / test-plan / rollout / qa-regression)红线段未同步禁读 `<slug>/index.md/summary.md` → 5 份模板红线段同步加"❌ 不要 Read `<primary-repo>/.claude/<slug>/index.md` 或 `summary.md`(主 agent 跨会话工作记忆;v1.6 双盲底线)"
- **fix#3 (codex MEDIUM,共识)**:`cross-validation.md:29` "第一件事 5 选 1" 与 v1.6 第 0 件事 slug 冲突 → 改为"前两件事:第 0 件事 = AskUserQuestion 拿需求 slug...第 1 件事 = AskUserQuestion 5 选 1"
- **fix#4 (codex MEDIUM,共识)**:`.claude-plugin/marketplace.json:4` 顶层 description 仍含 "& plan-review protocol" → 改为 "multi-agent CROSS-VALIDATION protocol (review-only, NOT for plan/code generation; use superpowers for that)"
- **fix#5 (codex MEDIUM,共识)**:`check-consistency.mjs` 漏检顶层 `.claude-plugin/marketplace.json` description 的 cross-validation 语义 → 加 `marketplaceInner.description.includes("CROSS-VALIDATION")`;同时"4 处描述同步" check 名改为"5 处描述同步"(因为顶层 description 也算)
- **fix#6 (codex + opencode 双方,共识)**:非法 slug(中文 / 含空格 / 含大写)处理流程未定义 → `archive-and-blind.md` slug 命名约定段加"非法输入处理"4 步流程(主 agent 给 kebab-case 建议 → 第二轮 AskUserQuestion 用户确认 → 用户拒绝 3 次 → 默认走 `_oneoff_`)
- **fix#7 (codex + opencode 双方,共识)**:changelog "零 breaking change" 措辞偏满 → 改为"**零文件级 breaking change**;但**主 agent 交互层新增 1 个 AskUserQuestion 拦截步骤**(第 0 件事 slug,可选 `_oneoff_` 等价老行为)"
- **fix#8 (codex MEDIUM 单方真漏)**:`templates/slug-summary.md:26-28` 示例链接 href 写 `(.)` → 改为 `[../{{date}}/...](../{{date}}/...)` 与显示文本一致;同步修 `archive-and-blind.md §2.5` 示例段
- **fix#9 (opencode HIGH 强建议 #1 单方真漏)**:`cross-validation.md` §6.5 Step 1 vs Step 2 顺序未明确 → §6.5 节首加"Step 1 vs Step 2 顺序(v1.6.1 澄清)"段:"职责正交,可并行;表行序号 1→6 是逻辑分层,不是必须严格线性执行"
- **fix#10 (opencode HIGH 强建议 #2 单方真漏)**:reviewer finding 缺 file:line 时主 agent 怎么自查未定义 → §6.5 节首加兜底:"先把 finding 退回 reviewer 要求补依据,再进入 Step 1 自查;若 reviewer 不可达,标 🟡 未核实并独立 spike,不要默默 dismiss"
- **fix#11 (用户裁决,opencode MEDIUM 强建议 #5 → v1.6 直接做,从 v1.7 候选提前)**:用户裁决"提前到 v1.6 加" → `hard-constraints.md` §2 重构为 §2.1 + §2.2;**新增 §2.2 "不读 `<primary-repo>/.claude/<slug>/`"** 作为 BLOCKER 等级铁律,与 archive-and-blind §5.1/§6 + reviewer prompt 红线 + SKILL §5 形成 **4 重保护**;`hard-constraints.md` 1.1.0 → 1.2.0
- **fix#12 (opencode MEDIUM 强建议 #4 单方真漏)**:`check-consistency.mjs` 4 要素 check 只 grep "4 要素" + "主 agent 自查" + "具体例子",未检查所有 4 要素具体子串 → 强化检查:加 grep "副 agent 言论" + "选项",4 要素的 4 个名字都要在 cross-validation §7 中出现
- **fix#13.1 (opencode 锦上添花 LOW,用户选)**:`templates/slug-index.md` 注释加 N≥3 路径范例(reviewer-A `.codex/` / B `.opencode/` / C `.cursor/` / D `.cline/` + 字母循环 a-z)
- **fix#13.2 (opencode 锦上添花 LOW,用户选)**:`templates/slug-summary.md` 注释加"避免空话"反例 1-2 行(反例:"v2 是 v1 的扩展" / "整体 OK";正例:"v2 在 v1 基础上...详见 ...:42-58")
- **fix#13.3 (opencode 锦上添花 LOW,用户选)**:`tech-design-v1.6.md §5` 风险表加 2 行(代码片段贴 AskUserQuestion 上下文可能过长 / `<slug>/` 默认 gitignore 跨 clone 同事丢决策史)

**新增 check**(36 → 38):

- `reviewer prompt templates carry <slug>/ readonly redline`(check 5 份 prompt 模板都有禁读红线)
- `hard-constraints includes <slug>/ readonly clause`(check hard-constraints.md 含 `<slug>` 字串,即 §2.2 已加)

**self-review 元收获 — v1.6 协议本身的 dogfood 验证结果**:

- ✅ **slug 入口前置(第 0 件事)真的工作**:本次 self-review 主 agent 确实在 5 选 1 之前先 AskUserQuestion 拿了 slug=`v1.6-self-review`,落盘到 `.claude/v1.6-self-review/{index,summary}.md`,跨会话决策史归档机制可执行
- ✅ **6 步核验纪律真的工作**:主 agent 在收到 codex/opencode 报告后,严格走了 Step 1 逐 finding 自查代码(对每条 finding 都打开了对应 file:line);未直接信副 agent 共识
- ✅ **4 要素 AskUserQuestion 真的工作**:用户裁决 F11 + F13 时,选项明确包含副 agent 言论 / 主 agent 自查 / 具体例子(见上面 13.x 编号背后的逻辑)
- ✅ **副 agent 不读 `<slug>/` 双盲底线被执行**:codex / opencode 报告附录 A.5 都明确声明"未 Read `.claude/v1.6-self-review/{index,summary}.md`"
- 🟡 **协议复杂度可控但接近上限**:主 agent 在长上下文下严格执行 6 步 + 4 要素 + slug 入口的成本,在本次 self-review 中是可承受的;但 N=3+ 大需求是否仍可承受需要后续验证

**未做**(推 v1.7 候选):

- 端到端 plugin install 验证(需另一台机器 / fresh 环境跑 `/plugin marketplace update + /plugin install`)
- decisions.md 模板(等真有合规追溯需求再做)
- slug-summary.md 必填 vs 可选段标注(已有部分隐式必填,完整标注成本与价值不匹配)

**自检通过**:`check-consistency.mjs` **38/38** 全过(原 36 + 新增 2),`smoke-test.mjs` 通过。

### v1.7 候选

- **裁决记录文件模板**:v1.6 4 要素是 AskUserQuestion 选项内嵌,如果用户希望"事后翻每条 finding 的裁决依据"可能需要落盘到 `<slug>/decisions.md`。等真有合规追溯需求再做
- **slug AskUserQuestion 自动列举增强**:第 0 件事时主 agent 扫 `.claude/` 排除日期目录 / `rules/` / `_oneoff_` 后列出 slug 候选;v1.6 是协议要求 + 主 agent 自觉实现,v1.7 可能补一个 helper 脚本
- **端到端 plugin install 验证**:fresh 机器跑 `/plugin marketplace update + /plugin install`,验证 v1.6 plugin 装载 + 第 0 件事 slug AskUserQuestion 真实端到端
- **N=3+ 大需求长上下文执行性验证**:本次 self-review 是 N=2 小需求,N=3+ 大需求时主 agent 6 步 + 4 要素 + slug 是否仍可承受 — 等真实大需求出现时验证

## [1.5.1] - 2026-05-28

### Fixed

- **`.claude-plugin/plugin.json` `repository` 字段**:从 npm 风格的 `{type, url}` 对象改为 Claude Code 官方插件期望的字符串(`"git@<REDACTED>:<REDACTED>/multi-reviewer.git"`)。1.5.0 实际 `/plugin install` 时报 `Validation errors: repository: Invalid input: expected string, received object`,本仓所有 v1.0-v1.5.0 release 实际都装不上(此前一直走 git clone + ~/.claude/skills/ Junction 绕过 plugin loader,所以未暴露)。修复后首次以 plugin 形式安装成功。

## [1.5.0] - 2026-05-28

本轮以**可验证性与首次使用体验**为主,把 v1.4 的协议自检思想进一步落到脚本层,同时降低新用户理解成本。

### Added

- **`scripts/smoke-test.mjs`**:使用 Node.js 内置模块对 `init.mjs` 做 smoke tests,覆盖 `--dry-run` 零落盘、默认 reviewer、大小写 reviewer 参数归一化、自定义 reviewer、基础占位符替换、多字母 reviewer id 拒绝等路径。
- **`scripts/check-consistency.mjs`**:新增协议一致性检查脚本,检查 JSON 合法性、模板 / reference 文件完整性、版本号与 changelog 对齐、B1 单 reviewer、prompt 单源化、finding 依据外露、hard constraints 引用、5 入口模式和 §11 同步矩阵等关键锚点。
- **README Quick Start**:新增最短路径说明,帮助用户从安装后 bootstrap 到触发技术方案评审 / QA 回归。
- **README FAQ**:新增常见误用说明,覆盖单 reviewer QA、reviewer 是否能修 bug、是否能看主 agent 自测结论、多仓 prompt 单源化、reviewer 结论冲突、归档目录是否入 Git 等问题。
- **README 本仓自检**:新增 smoke test 和 consistency check 的运行方式,便于修改 `init.mjs` / `SKILL.md` / `references/` / `templates/` 后快速回归。

## [1.4.0] - 2026-05-26

10 项 v1.3 遗留点交互式确认后实施 8 项(2 项 #5/#9 推 v1.5)。本次发布以**协议精化与漏修类机制化**为主,无 breaking change,所有 v1.3 跑过的项目可零迁移升级。

### Added

- **`SKILL.md` §11 协议-模板-reference 同步矩阵**(对应 v1.3 遗留 #4):列出 7 类关键协议条款的 SKILL / references / templates 三层锚点对应关系,改协议时主 agent 必读。零新文件、零脚本,LLM 友好的"按 N 行表格逐行比对"工作模式。解决 v1.3 round-2 暴露的"协议改了 reference 没跟"漏修类(case 003 的元层级延伸)
- **`SKILL.md` §9.1 主 agent 从 superpowers 软衔接**(对应 #10):brainstorm / writing-plans / verification-before-completion 完成回到主 agent 时,主动一句"要不要走 tri-agent",降低协议遗忘成本。**软衔接,不强制**
- **`references/report-format.md` §1.1 finding 依据外露(强制)**(对应 #3):每条 finding 必带 4 类客观依据之一(源码行号 / 配置 / 命令输出 / 历史 bug ID);明确与 B1 主观假设外露(用户场景 / 市场 / 组织假设)的语义区分。`tech/test-plan/rollout/qa-regression-prompt.md` 4 份模板各加 1 句引用
- **`references/plan-review-perspectives.md` §2.4 B1 dismiss SOP**(对应 #7):4 步工作流 — 抽取假设 → 假设逐条核查(🟢可核实 / 🟡不可核实 / 🔴已反例) → 主 agent 出 dismiss 倡议 → AskUserQuestion 一次性收尾让用户拍板。明确禁止"主 agent 自己 dismiss 不问用户"和"逐条 AskUserQuestion 推卸假设核查"两种反 anti-pattern
- **`references/archive-and-blind.md` §0 + `multi-repo.md` §0 路径词汇表**(对应 #8):集中定义 `<repo>` / `<primary-repo>` / `<secondary-repo-N>` / `<all-repos>` / `<reviewer-cwd>` / `<skill-path>`;显式列出"同字面 `<repo>` 在双盲条款 / 多仓镜像 / case 引用三种语境下含义不同"的歧义点
- **`templates/case-study.md` §0 硬约束**(对应 #1):**主体描述 < 500 字** / 不写修复详情 / 不区分 reviewer / 抽象规则不跨项目;明确"主体"指 §1-§5,不含 frontmatter / §6 状态表 / §7 引用片段
- **`scripts/init.mjs` --dry-run 标志**(对应 #6):预览将创建 / 修改的文件清单(含行数),不动磁盘。`--yes` 兼容并存
- **`scripts/init.mjs` N≥5 警告**(对应 #5):配 N=5+ reviewer 时打 warning"大部分场景 N=2-4 已足够,LLM reviewer 多至 4 个时同源偏差覆盖度已 ~95%"。README 渲染本身不动(完整 N=26 渲染优化推 v1.5,等真有 N≥7 实际项目)

### Changed

- **`references/multi-round-regression.md` 全文 N reviewer 通用化**(对应 #2):
  - §3 沉淀标准从"一个 reviewer 抓到、另一个没抓到" → "N 份报告中部分抓到、其他没抓到";不沉淀标准从"三方都抓到" → "主 agent + 所有 N 个 reviewer 都抓到"
  - §4 "对称塞给 reviewer-A 和 reviewer-B" → "对称下发给所有 N 个 reviewer";加 N≥3 双盲条款"N 份 prompt 各自的『前轮已知盲点』段字面级相同"
  - §8 跨轮 reviewer 选择加 N=3 / N 中途加减示例
  - §9 anti-pattern "reviewer-A 在 round 1 抓到 X" → "reviewer-X(具名出处)";新增"给不同 reviewer 的 prompt 写不同 case 段"反例
- **3 份 round-1 case 重写到 ~600 字符**(从 800-1100 字符缩到 ~600,降 35-43%):round-1-001 / round-1-002 / round-1-003 主体描述精简,保留 frontmatter + 状态变更表 + 引用片段
- **`SKILL.md` §8 B1 闭环检测 4 行 → 引用 plan-review-perspectives.md §2.4 SOP**:checklist 与 SOP 互补 — checklist 防偷懒,SOP 解决"防偷懒之后怎么办"
- **`.claude-plugin/plugin.json` description**:加 v1.4 关键能力关键词;keywords 加 sync-checklist / finding-evidence / b1-dismiss-sop
- **frontmatter version 升级**:
  - `archive-and-blind.md` 1.2.0 → 1.3.0
  - `multi-repo.md` 1.2.0 → 1.3.0
  - `multi-round-regression.md` 1.0.0 → 1.1.0
  - `report-format.md` 1.0.0 → 1.1.0
  - `plan-review-perspectives.md` 1.0.0 → 1.1.0
  - `SKILL.md` 1.3.0 → 1.4.0

### v1.5 候选(本次推延)

- **#5 N=26 字母循环上限 README 渲染优化**:N≥7 实际项目出现后再做(当前已加 N≥5 警告作过渡)
- **#9 Plan Mode + tri-agent 协同**:v1.3 实践未出现"plan 完才想起跑 tri-agent"实际错误,推 v1.5 等实际用例驱动

### 不在 v1.4 但仍开放的元规则候选

- 用 sync-checklist 矩阵跑下次 v1.5 协议变更,验证矩阵实际效果
- 若 N reviewer 配置真出现 N≥5 项目,根据反馈决定 README 折叠或表格化方案

### Round 1 self-review 反馈处理(2026-05-26)

v1.4 实施完成后用 v1.4 自身协议(§11 同步矩阵 / §1.1 依据外露)跑一轮自验回归。codex + opencode 双盲产出报告(BLOCKER=0 codex / BLOCKER=0 opencode;1 HIGH 共识 + 3 MEDIUM 共识 + 2 codex 单方真漏 + 1 opencode 单方真漏 HIGH + 余 LOW/NOTE),主 agent 复核全采纳,本轮全部修复:

**协议级修复(对应 codex / opencode finding)**:

- **fix#1 (codex HIGH + opencode M-002)**:`init.mjs --dry-run` 仍创建 `.claude/rules/` 空目录违反"零副作用"承诺。`scripts/init.mjs:327` 加 `if (!args.dryRun)` 守卫;dry-run 后目标目录确实零修改(已 smoke test)
- **fix#2 (codex MEDIUM + opencode M-001)**:SKILL.md §11 同步矩阵不完整。(a) 加一行"bootstrap / init.mjs 脚本行为";(b) 删第 5 列"~N 处必读"不准计数;(c) cross-validation `§1-§3` 段号改实际命中段 `§1 §5 §6`;(d) "B1 闭环检测 4 行" 改 "6 项,引用 §2.4 SOP"
- **fix#3 (codex LOW + opencode M-003)**:`case-study.md §0 "<500 字"` 度量歧义。改"<500 汉字 (CJK Unified Ideographs)" + 加 PowerShell / Bash 统计命令例
- **fix#4 (opencode H-001 HIGH;codex 漏抓)**:4 模板"依据"列表与 `report-format.md §1.1` 4 类客观依据措辞分裂(test-plan 引入"用例 ID"等)。统一所有 4 模板写"详见 §1.1 的 4 类客观依据",删各自子集(round-1-001 case 同型复发的协议级闭环)
- **fix#5 (codex 单方真漏 MEDIUM)**:`qa-regression-prompt.md:55` "主仓 = reviewer 启动 cwd" 与 v1.4 路径词汇表 `<primary-repo>` / `<reviewer-cwd>` 区分冲突。改"`<primary-repo>` = 主 agent 触发 skill 时的仓根"
- **fix#6 (codex 单方真漏 MEDIUM)**:`case-study.md` frontmatter `captured_by` 示例仍写 `reviewer-A / reviewer-B` 与 §0 "不区分 reviewer" 矛盾。改"单方 reviewer / 多方 reviewer / 主 agent 复盘"
- **fix#7 (opencode L-001)**:`init.mjs --dry-run` line counts 偏差 ~10%。help 行加注"line counts use JS LF-split, may differ ±10% from editor display"
- **fix#8 (opencode N-001)**:`plugin.json` description ~1000 chars 偏长。压到 ~700 chars,删 v1.4 详细列表(留 changelog 引用),保留核心触发关键词
- **fix#9 (opencode N-002)**:SKILL.md §9.1 superpowers 软衔接触发条件含糊。加"触发条件"表格列出 4 类检测信号(plan written / 自检过了 等关键词);明确与 §1.1 弱信号触发表的"入场前 vs 出场后"分工
- **fix#10 (用户口头反馈,协议级新增)**:**主 agent 核验报告纪律**(本次轮自验暴露主 agent 复核执行不严格)。
  - 新增 `cross-validation.md §6.5` 主 agent 核验报告纪律 5 步:**自扫代码 + 三方对照(自判 + N reviewer)+ 拿不准必 AskUserQuestion + 本轮闭环 + ROI 低不默 dismiss**;6 条反 anti-pattern;明确与 §7 AskUserQuestion / §8 Spike 的关系
  - SKILL.md §3 N+1 协同段加 5 步引用 + §8 per-task checklist 加 5 条 + §11 同步矩阵加一行
  - 升 cross-validation.md 1.2.0 → 1.3.0
- **fix#11 (用户口头反馈)**:删除 `skills/multi-reviewer/examples/` 目录(<DASHBOARD> 实例文件)。理由:技能插件应通用化,具体内部业务术语示例不专业且可能被其他用户安装时困惑。`init.mjs` / `README.md` / `examples/README.md` 的 4 处引用同步清理;init.mjs 的 "鉴权机制(<REDACTED>/JWT/...)" 也通用化为 "鉴权机制(JWT / Cookie / OAuth / API Key / Custom 等)"

**case 状态变更**(本轮自验):

| case | round-2 末状态 | round-1 self-review 末状态 |
|---|---|---|
| round-1-001 同义占位符散乱 | 修复中 | 🟡 监视中(协议级解决但 H-001 同型复发,fix#4 闭环) |
| round-1-002 frontmatter 漂移 | 修复中 | 🟢 已闭环(5 reference + SKILL frontmatter 全升;v1.4 又同步升 1 次) |
| round-1-003 假设外露偷懒检测 | 修复中 | 🟢 已闭环(plan-review-perspectives §2.4 SOP 完整,SKILL §8 6 项 checklist 引用 SOP) |

### 迁移说明(无 breaking change)

- v1.3 项目升级 v1.4 **零迁移成本**:references 随 skill 升级自动生效;`init.mjs` 兼容老 CLI(新增 `--dry-run` 是可选)
- 项目母板若想拿到 v1.4 模板新行(B2/B3/B4/A 模板的 finding 依据外露引用、case-study §0 硬约束、qa-regression 主仓措辞),重跑 `node scripts/init.mjs <repo>` 即可。**老 prompt 母板里的占位符不变,等价覆盖**
- 已经写过的 round-1 case 不需要主动压缩;新写的 case 走 §0 硬约束(<500 汉字)即可
- 若想验本次同步矩阵效果,改 SKILL.md 任一条款时可对照 §11 表逐行勾选(无强制工具,纯 LLM 自查)
- 主 agent 在新 v1.4 跑 N+1 对比时,**必须**走 cross-validation §6.5 5 步纪律(自扫 + 三方对照 + 拿不准必问 + 本轮闭环 + ROI 低不默 dismiss);老 v1.3 习惯"直接照 reviewer 报告裁决"已不再合规
- `examples/` 目录已从仓中删除;若你之前 fork 仓时有该目录,merge v1.4 后会被 git 删除是预期行为

### Plugin 规范合规化(2026-05-26,用户提议)

按 Claude Code 官方插件规范([code.claude.com/docs/en/plugins.md](https://code.claude.com/docs/en/plugins.md))对照本仓做规范化。研究结论:**合规度 9/10**,无阻碍安装的偏差,以下为社区习惯 / 工具体验改进:

- **fix#12 (B1)**:`.claude-plugin/plugin.json` 加 `"displayName": "Agent Crosscheck"`(UI 展示美观)
- **fix#13 (B2)**:`.claude-plugin/plugin.json` 加 `"$schema": "https://json.schemastore.org/claude-code-plugin-manifest.json"`(编辑器补全 + `claude plugin validate` 更精准)
- **fix#14 (B3)**:`SKILL.md` frontmatter 删除 `version` 字段(非 Claude Code 官方 SKILL.md frontmatter 字段;版本统一在 `plugin.json` 的 1.4.0 维护;`references/*.md` / `templates/*.md` 的 `version` 字段是自定义内部追踪,保留)
- **fix#15 (C2)**:新增 `.claude-plugin/marketplace.json` — 单 plugin marketplace 入口文件,使本仓既是 plugin 也是自有 marketplace,可直接被其他用户通过 `/plugin marketplace add <repo-url>` 添加
- **fix#16 (C3)**:新增 `CONTRIBUTING.md` — 本地 `--plugin-dir` 测试、reviewer agent 配置、§11 同步矩阵协议自检、PR 习惯、跨 AI agent 兼容说明

**未做**(与 v1.3 设计意图冲突或当前不必要):
- ❌ `disable-model-invocation: true`:与 v1.3 trigger keywords 自动触发设计冲突,本 skill **必须**支持 LLM 自动命中"评审 / 跑回归"等关键词,故不加
- ⏸ `argument-hint`:本 skill 不走 `/skill argv` 路径(走 5 选 1 AskUserQuestion),意义不大
- ⏸ `repository.url` 改 HTTPS:内网仓库 SSH 地址成员皆可访问,无外发需求
- 已存在 LICENSE(MIT)文件 — 研究 agent 误报"缺 LICENSE",实际 v1.0 起就有

---

## [1.3.0] - 2026-05-25

### Added

- **5 选 1 入口分流**(强制 AskUserQuestion,主 agent 进入 skill **第一件事**):产品方案评审(B1)/ 技术方案评审(B2)/ 测试方案评审(B3)/ 上线方案评审(B4)/ QA 回归(A)。不靠语义猜,扁平不嵌套
- **模式 B 拆为四子模式**:`cross-validation.md` §2 重写,加 B1-B4 分流表;§4 拆为 4.1 通用流程(B2/B3/B4)+ 4.2 B1 产品方案流程
- **3 份新 prompt 模板**:
  - `product-review-prompt.md` — B1 产品方案(**单 reviewer 例外**,不双盲)
  - `test-plan-review-prompt.md` — B3 测试方案(双盲;前置=已通过的产/技方案)
  - `rollout-review-prompt.md` — B4 上线方案(双盲)
- **新 reference**:`plan-review-perspectives.md` — 四类方案视角差异 + 产品方案为何单 reviewer + 共骨架不同视角说明
- **顶层 README** 重写触发场景表 + 文件布局,反映 v1.3 能力面

### Changed

- **跨多仓 prompt 镜像规则修正**:从"prompt 每仓镜像"改为"**prompt 仅主仓单份**(主仓 = skill 触发时的 cwd)";**报告**仍每仓镜像
  - 涉及 `multi-repo.md` §2.4-2.5 重写、§6 产物布局更新、踩坑表新增
  - 涉及 `archive-and-blind.md` §2 跨仓镜像规则重写
  - 涉及 `tech-review-prompt.md` / `qa-regression-prompt.md` 头部"仓库与分支"段从"主+副"两行改成多仓清单
  - 用户痛点(原话):多仓需求下同一份 prompt 被双份维护,改一次要同步两份;现在 reviewer 在主仓读到 prompt 即覆盖所有相关仓的回归
- **plugin.json / marketplace.json description**:加产品/技术/测试/上线方案评审关键词,扩 LLM 触发覆盖。keywords 增 product-plan-review / tech-plan-review / test-plan-review / rollout-plan-review
- **SKILL.md §0-§2** 重写:概览段加 5 种触发场景表;§1 触发条件加"任一方案要进下一阶段";§2 决策树以"主 agent 第一件事 5 选 1"为骨架
- **SKILL.md §3** 三方协同段加 B1 单 reviewer 例外说明 + 新增"B1 单 reviewer 对比表"
- **SKILL.md §4** 多仓段加 v1.3 prompt 单源化口径
- **SKILL.md §5** 归档铁律段加 prompt 单份 / B1 产品方案例外
- **SKILL.md §8** per-task checklist 重写:加"第一件事 5 选 1"、按 5 种模式分流模板路径、B1/双盲两种派发逻辑
- **SKILL.md §9** 全流程示意改成"每段调一次 skill"的 5 次 5 选 1
- **SKILL.md §11** init.mjs fallback 加 3 份新模板
- **SKILL.md §12** 版本 1.2.0 → 1.3.0,加"1.3.0 新增能力"段
- **`scripts/init.mjs`** tasks 数组从 4 份扩到 7 份(加 product / test-plan / rollout 三份);renderRulesReadme 文件表同步更新
- **`cross-validation.md`** §5 双盲特化加 B1 例外;§6 三份产出对比加 B1 单 reviewer 子段

### Round 2 自检反馈处理(2026-05-25)

第 2 轮自检 reviewer(codex / opencode 双盲)对"v1.3 初版 + 第 1 轮自检修复 + N reviewer 扩展"做整体回归。结论:🟡 建议修后再发布。第 1 轮 14 条 finding 全部已闭环或部分覆盖(0 漏修),3 条 case 全部已闭环;第 2 轮新发现 9 条 finding(2 HIGH + 5 MEDIUM/LOW + 多 NOTE) + 主 agent 自己 Spike 抓到 1 条 BLOCKER。逐条裁决后 10 条全部纳入 v1.3 一起修:

#### Fixed(round 2)

- **#1 4 份双盲模板 Step 1 改 N 化**(两方都报):tech-review / test-plan-review / rollout-review / qa-regression Step 1 + 1.b 兜底从"reviewer-A 还是 B"改为"A / B / C / D / ... 中哪一个(默认 N=2 时只有 A/B,配 N≥3 时按字母序最多 26)"。修 N≥3 配置下 reviewer-C/D/... 入场无法识别身份的 happy-path 漏洞
- **#2 多数共识阈值改"严格多数 > N/2"**(codex HIGH):SKILL §3 + cross-validation §6 公式与示例对齐(N=2 都标 / N=3 ≥2 / N=4 ≥3 / N=5 ≥3);**偶数 N 正好半数 = 平局,不算共识**;原"≥半"会让 N=4 时 2/4 算多数与示例 3/4 矛盾
- **#3 SKILL.md frontmatter description 同步 multi-agent / N reviewers**(codex MEDIUM):description 是 LLM 触发主入口,与 plugin.json 已改但 SKILL 漏改的不一致问题修复
- **#4 reference 4 处 B1 措辞与模板实施对齐**(opencode M-NEW-1):archive-and-blind §5.4 / cross-validation §5 / plan-review-perspectives §2.2 + §4 改为"保留 .{a-name}/.{b-name} 占位符,但语义是'任一即可',不做双盲身份识别"。H-001 修法的镜像同步
- **#5 filling-prompts §2.6 文档与 init.mjs 行为对齐**(codex MEDIUM):文档原说 "未配置占位符不会出现在生成的母板里(init 会清理)",实际 init.mjs 不清理。改文档:**未配置字母占位符保留 literal**;主 agent 复制母板到任务文件时按本次实际 N 删除不适用示例(reviewer-C/D/... 段)
- **#6 N=1 配置语义收敛**(codex MEDIUM):SKILL §0/§3 改为"默认 2,**可扩展到 3-26**;N=1 不通过 init.mjs 通用支持,推荐改走 B1 单 reviewer 模式";避免承诺一个不工程化支持的能力
- **#7 tech-review-prompt.md line 51 同义漂移**(opencode L-NEW-3):`{{编码阶段名,如 P0.1}}` → `{{编码阶段}}`(case 001 漏网修补)
- **#8 marketplace.json 顶层 description 同步 multi-agent**(codex LOW):与 plugin description 对齐
- **#9 init.mjs 大写 normalize + 双字母友好错误**(opencode N-NEW-4 / N-NEW-5):
  - `--reviewer-A=name` 自动 lowercase 为 `--reviewer-a=name`,带 warn 提示
  - `--reviewer-aa=name` 报错并 abort(明确"仅单字母 a-z,最多 26 reviewer")
  - 跑 smoke test 通过(uppercase normalize ✅ / multi-letter abort ✅)
- **#10 主 agent Spike 抓到的 .gitignore bug**(BLOCKER 级,两 reviewer 都没报):
  - `.gitignore` 写的是 `.claude/<*>/`(字面字符串,不是 glob),**git 完全没 ignore `.claude/`**
  - 风险:用户跑 `git add -A` 会把 case + prompts + reports 入 skill 仓,**违反"case 不入 skill 仓"协议**
  - 修复:`.claude/<*>/` → `.claude/`,同时主动加 `.cursor/ .cline/ .qoder/ .aider/` 等 reviewer 扩展目录
  - 验证:`.claude-plugin/` 不被误伤(git 路径精确匹配);`.claude/<date>/case-studies/*.md` 现已被 `.gitignore:16:.claude/` 正确 ignore

#### Round 2 case 状态

第 1 轮沉淀的 3 条 case 经第 2 轮 reviewer 双盲验证:

| case | round 2 判定 | 依据 |
|---|---|---|
| round-1-001-同义占位符散乱 | 🟢 已闭环(B3/B4 范围内);tech-review line 51 漂移已记 L-NEW-3 单独修 | grep test-plan / rollout 模板已统一 |
| round-1-002-frontmatter-版本号漂移 | 🟢 已闭环 | 三份 reference 1.2.0 / hard-constraints 1.1.0 / filling-prompts 1.2.0 全对齐 |
| round-1-003-假设外露偷懒检测 | 🟢 已闭环 | SKILL §8 B1 闭环检测 4 行 + cross-validation §6 表"缺 §2 段退回"行 + 模拟测试通过 |

#### Round 2 留 v1.4 候选

- 压缩 3 份 case 到 <500 字(anti-pattern §9 建议;现 53-58 行)
- multi-round-regression.md §3 沉淀差异化标准扩为 N reviewer 通用(N=3+ 时差异化怎么定义)
- case 003 抽象规则的"主 agent 必填段检测"协议化扩展到 B2/B3/B4/A 全模式
- 项目级规则抽象:`.claude/rules/sync-checklist.md` 沉淀"扩展协议时漏同步模板"规律
- N=26 字母循环上限的 README 渲染可读性优化(实际场景概率近零)

### Extended: N reviewer + agent 自定义(2026-05-25)

用户在自检修复后追加协议级扩展诉求:

- **主 agent 即触发 skill 的 agent** — 用户在哪个 agent session 里触发,那个就是主 agent;一次需求只有一个主 agent 贯穿始终
- **主 agent 编码独占** — 写代码 / 改源码 / git 写操作 仅由主 agent 做,避免多 agent 同时编码冲突
- **N reviewer 配置**(默认 2,可扩到 1-N≤26)— init.mjs 支持 `--reviewer-c=cursor --reviewer-d=cline ...` 字母循环 a-z

#### Added(协议层)

- **N+1 协同**(改名自"三方协同"):主 agent + N 个独立 reviewer。N 默认 2(codex + opencode),可配置 1-N≤26
- **多数共识阈值**:N+1 份产出对比时,**多数(≥半)reviewer 标 🔴 → 必改**(N=2 时 = 都标 2/2;N=3 时 ≥ 2/3;N=4 时 ≥ 3/4)
- **N 路双盲对称**:N 个 reviewer 互不参考(N=3/4 时不能让 A 看 B 也不能 A 看 C)

#### Changed(各处适配)

- `SKILL.md` §0 / §3 / §5 / §8:主 agent + N reviewer 概念全文统一;角色表加"编码独占"约束;§3 对比表"两份"扩为"多数共识"
- `references/cross-validation.md` 1.1.0 → 1.2.0:§1 角色表扩 N reviewer + 编码独占;§5 双盲扩 N 路对称;§6 对比表多数共识
- `references/archive-and-blind.md` 1.1.0 → 1.2.0:§1 归档目录骨架扩 a-z;§5.1 N 路对称;§6 reviewer 之间互不看;§8 gitignore 建议
- `references/multi-repo.md` 1.1.0 → 1.2.0:§2.4 / §6 报告镜像扩 N
- `references/filling-prompts.md` 1.1.0 → 1.2.0:§2.6 系统占位符扩 `{c-name}/{d-name}/...`;§6 报告份数列改"N(默认 2)"
- `references/hard-constraints.md` 1.0.0 → 1.1.0:§1 加"N reviewer 都受只读约束 + 编码独占"补充
- `templates/(5 份 prompt)`:输出归档段加"reviewer-C/D/... 类推"扩展;加"N 路双盲 — 不看任何其他 reviewer"
- `scripts/init.mjs`:parseArgs 用 regex `--reviewer-([a-z])=name` 接收任意字母;applyPlaceholders 循环替换 a-z 配置;renderRulesReadme 列所有配置 reviewer + gitignore 建议
- `plugin.json` / `marketplace.json` description / keywords 加 multi-agent / n-reviewer / main-agent-coding-exclusive
- 顶层 `README.md` 重写"主 + N reviewer"概览 + init.mjs N reviewer 用法

#### 设计原则(N reviewer 扩展)

- **编码独占铁律 > 多 agent 协作**:即使 N reviewer 都看到"明显的 bug 一行 fix",也不能改 — 必须由主 agent 来实施。原因:多 agent 同时编码 = 冲突灾难 / 不可追溯;只有主 agent 写代码,git history 才干净
- **多数共识 > 一票否决**:1.2 时代是"任一标 → 复核",N=2 时实际等价"都标 → 必改";扩展到 N≥3 时改为多数共识更通用,避免 1/N 的误判被放大
- **B1 永远 1 reviewer**:不论 N 配置多少,产品方案永远只用 1 个 reviewer(LLM 同源偏差风险与 N 无关)
- **字母循环 a-z**:占位符延续 v1.3 现有 `{a-name}/{b-name}` 风格,扩 c/d/e/...,100% 向后兼容;26 个上限对实际场景足够(>5 reviewer 实际很少)

#### 1.3.0 → 1.2.0 迁移(N reviewer 部分)

老用户(已配置默认 2 reviewer):

1. **行为完全不变** — N=2 默认是原 1.2 / 1.3 行为,无需做任何调整
2. **想加 reviewer-C/D/...**:重跑 init.mjs 加 `--reviewer-c=cursor` 等参数
3. **想缩到 1 reviewer**(罕见):重跑 init.mjs 只传 `--reviewer-a=codex`(b 也会保留默认 opencode;真要 1 个的话需要手工删 .claude/rules/ 后单独保留 a 配置)— 建议直接走 B1 单 reviewer 模式

### Hardened (v1.3.0 自检回归后修复,2026-05-25)

v1.3.0 初版实施后用本仓做自检回归(双盲:codex + opencode),收到 1 HIGH + 6 MEDIUM + 多 LOW/NOTE。逐条裁决后纳入 v1.3.0 同步落地:

- **#1 H-001 修复**:`product-review-prompt.md` Step 1 从"识别 A/B 身份"改为"选归档目录";line 171 §5.4 引用改为 §5"B1 产品方案例外"段;红线规则加"不要执行识别 A/B 双盲动作"
- **#2 filling-prompts.md 1.0 → 1.1**:占位符对照表从"模式 A vs B"扩展为 5 子模式;§6 模板差异表同步;新模板(B1/B3/B4)的占位符全部补对照
- **#3 B3/B4 同义占位符统一**:`{{方案文档绝对路径}}` → `{{测试|上线方案文档绝对路径}}`;`{{测试阶段}}` → `{{测试执行阶段}}`;`{{发布窗口名}}` → `{{发布窗口}}`
- **#4 三份 reference frontmatter 升 1.1.0**:`cross-validation.md` / `archive-and-blind.md` / `multi-repo.md` 之前只升了版本记录段,frontmatter 还是 1.0.0,本次同步
- **#5 SKILL §8 多仓**:加 `git rev-parse --show-toplevel` 兜底(从子目录调起 skill 时仍能解到仓根)
- **#6 changelog 迁移指引**:从"选 skip-all"改为"对已有 4 份按 [N] 保留;3 份新模板自动写入";避免用户误操作丢失新模板
- **#7 SKILL §8 B1 等报告**:加"扫两个目录任一,取最早出现的 evaluation.md"
- **#8/#9/#10 B1 闭环三补**:
  - `qa-regression-prompt.md` 加 Step 2 前置自检 + 红线"无源码改动应改选 B"
  - `cross-validation.md §6 B1` 表加"全部假设不成立"补救行 + "缺 §2 假设节"退回行
  - SKILL §8 B1 闭环检测 4 行 checklist:确认 §2 假设节 + 假设过笼统退回 + 主 agent Spike 复核 + 全 dismiss 兜底
- **#11 qa-regression-prompt.md 加"⚡ 立即执行"骨架**:与 4 份新模板风格统一,8 步表格 + 红线规则 + 前置自检
- **#12 multi-repo 踩坑表**:加 4 行(reviewer 误读副仓 1.2 老 prompt / 副仓不存在 / 部分副仓未跑 等多仓边界)
- **#13 SKILL §8 末尾**:加"中途换模式 = 重新触发 skill"一句
- **#14 触发关键词清单**(用户自检后追加诉求):
  - SKILL.md description 加中英文 trigger keywords 段(zh:评审 / 评估 / 拍方案 / 跑回归 / 三方协同 等;en:plan review / qa regression / cross-validation 等)
  - SKILL.md 新增 §1.1 触发关键词清单(强触发 / 弱信号 / 排除 / 与 superpowers 互调边界)
  - 提升中文场景下 LLM 触发稳定性,同时显式声明"yields to superpowers for brainstorming / writing-plans / TDD / verification"避免抢位

留 v1.4 候选:case-study.md / multi-round-regression.md 对四类方案的分化(B1 单 reviewer 时 case 沉淀逻辑是否需要独立)— 工作量大,留独立学题处理。

### 1.3.0 设计原则

- **入口强制**(解决 b 根因):不让主 agent 凭语义猜默认进编码路径;5 选 1 扁平比嵌套两层更不易误判
- **共骨架不同视角**(解决 c 根因):产品/技术/测试/上线 4 份模板,共享报告骨架(报告格式 / 双盲 / 硬约束 / 归档)但各自有差异化的"你是谁(角色)"和"必查维度"
- **产品方案单 reviewer**(质量保护):LLM 评产品方案主观题易同源偏差(都偏功能完整、低估用户成本、过度乐观),双盲会复刻偏差给"伪交叉"错觉。协议层放弃 B1 双盲,改为单 reviewer + 假设外露 + 主 agent Spike 兜底
- **prompt 单源化**(降维护成本):多仓时 prompt 改一次即可,reviewer 只在主仓读到一份就能覆盖所有相关仓回归;报告保持每仓镜像以保跨仓追溯能力
- **不强串联**(给用户自由):全流程 B1→B2→B3→编码→A→B4 不在协议层强串联,用户分次调 skill 即可,每次 5 选 1

### 1.3.0 → 1.2.0 迁移路径

老用户(已跑过 1.2.0):

1. 重装 plugin / 拉最新 git
2. **重跑 init.mjs**(必要):
   - 在该项目仓重新跑 `node <skill-path>/scripts/init.mjs`
   - 脚本逐文件提示是否覆盖。**对已有的 4 份文件全部按默认 [N] 保留**(auth.md / env-tools.md / tech-review-prompt.md / qa-regression-prompt.md);3 份**新增模板**(product / test-plan / rollout-review-prompt.md)在本机原本不存在,会**自动写入**(无 prompt 询问)
   - ⚠️ **不要选 `skip-all`** — 选了后所有 tasks 包括新模板都会被跳过,等于没拿到新功能
   - 替代方案:跑前先在 `<repo>/.claude/rules/` 下手动 cp 三份新模板,跑 init.mjs 时全部 [N]
3. **不需要清理老归档**:1.2 跑过的需求里 `.claude/<date>/` 下的副仓 prompt 镜像不需要主动删,留作历史归档无害
4. 之后新需求按 1.3 走:5 选 1 入口 → prompt 单份主仓 → 报告每仓镜像
5. 1.3.0 完全向后兼容 1.2 的 case 沉淀(多轮回归)规则

新项目直接跑 init.mjs 即可,自带 1.3.0 行为。

## [1.2.0] - 2026-05-21

### Added

- **多轮回归协议**(`references/multi-round-regression.md`):同一需求 ≥ 2 轮交叉验证时,主 agent 怎么沉淀本需求的 case 文件、怎么把前轮 case 塞进新一轮 prompt 让 reviewer 带先验工作、怎么判定 case 闭环。核心目的:防止 context 增长 / 截断后同一类盲点反复出现,让 agent 在某个特定项目的某次需求多轮交互中**变聪明**
- **case 文件骨架**(`templates/case-study.md`):每个差异化 finding 产出一份 case 落项目 `<repo>/.claude/<date>/case-studies/round-{N}-{NNN}-{key}.md`。结构化字段:漏点描述 / reviewer 抓取手法 / 漏的根因(同源思维 / 经验缺口 / context 健忘) / 抽象规则(本需求范围内可迁移) / 状态(监视中/未闭环/修复中/已闭环/误报作废)
- **prompt 模板"前轮已知盲点"段**:`templates/{tech-review,qa-regression}-prompt.md` 各加一段,占位符填本需求历史 case 文件路径;reviewer 自己 Read 不嵌入 prompt;对 reviewer-A 和 reviewer-B 完全对称(不破坏双盲)
- **SKILL.md §8 checklist 加多轮回归分支**:第 N+1 轮 prompt 生成前先扫 case 状态、塞路径不塞内容、case 不跨需求迁移等纪律

### Changed

- 版本 bump 1.1.0 → 1.2.0

### 设计原则(本轮)

- **case 是项目本地档案,不入 skill 仓**:skill 只提供协议(怎么记 / 怎么塞 / 怎么闭环),不提供通用案例库。这避免不同项目场景被通用规则过拟合
- **case 不跨需求迁移**:不同需求的代码上下文 / 业务逻辑 / 风险面不同,跨需求迁移容易失效或误导。如果一个 case 暴露的是"项目级通用规律",应抽到 `<repo>/.claude/rules/` 而非塞进其它需求 case
- **质重于量**:每轮 0-3 条 case 即可。case 太多反而稀释下轮 prompt 信号
- **统一语言写 case**:用主 agent 归纳语言,不区分"是哪个 reviewer 抓的",这样塞给两个 reviewer 时双盲对称

### 1.2.0 → 1.1.0 迁移路径

老用户(已跑过 1.1.0):
1. 重装 plugin / 拉最新 git
2. **不需要重跑 init.mjs**:1.2.0 没有改 init.mjs / 没改 auth.md / env-tools.md 骨架
3. **可选**:在该项目下次发起多轮回归时,在 `<repo>/.claude/<date>/` 下手动建 `case-studies/` 子目录,按 `templates/case-study.md` 骨架开始沉淀
4. 1.2.0 完全向后兼容:第 1 轮回归不需要走多轮分支,行为与 1.1.0 一致

## [1.1.0] - 2026-05-21

### Changed

- **`templates/{tech-review,qa-regression}-prompt.md` 改为 prompt 本体**(剥掉外层使用说明 + 5-backtick 围栏)。原因:用户反馈 v1.0 模板需要打开文件后从围栏里复制内容粘贴给 reviewer,不直观。新格式下文件本体即指令,reviewer agent 读到后可以直接驱动跑(用户 workflow:在 codex/opencode 贴绝对路径 + "执行" 二字)
- **SKILL.md §8 checklist 更新**:per-task 段明确"用户贴文件路径 + 执行"的 dispatch workflow,不再"复制粘贴"
- 版本 bump 1.0.0 → 1.1.0

### Added

- **`references/filling-prompts.md`**:新增 reference,集中放
  - 主 agent 填占位符的步骤(skill 模板 → 项目母板 → 任务文件 三级关系)
  - 模式 A / 模式 B 占位符对照表
  - **用户 dispatch workflow**(贴文件路径 + 执行)
  - 双盲原则的 do/don't 清单
  - 占位符填漏的常见症状与解法

### 1.1.0 → 1.0.0 迁移路径

老用户(已跑过 1.0.0 init.mjs 的项目仓):
1. 重装 plugin:`/plugin update multi-reviewer`(或拉最新 git)
2. 在该项目仓重新跑一次 init.mjs(会询问 overwrite)
3. 选择 overwrite,把 `<repo>/.claude/rules/{tech-review,qa-regression}-prompt.md` 升到 1.1.0 格式
4. **注意**:`auth.md` / `env-tools.md` 是项目自有,选 skip-all 或 [N] 保留你自己填好的内容

新项目直接跑 init.mjs 即可,自带 1.1.0 格式。

## [1.0.0] - 2026-05-21

### Added

- 首版发布。从 <REDACTED> <DASHBOARD> 仓 `<repo>/.claude/rules/` 沉淀的三方协同协议抽象而成
- **SKILL.md 索引主体**(中文,英文 description),9 主章 + 8 步 checklist,250-350 行
- **references/ 协议详细规则**(5 份):
  - `cross-validation.md` — 三方协同流程(模式 A/B、双盲、对比、Spike 兜底、跳过条件)
  - `multi-repo.md` — 多仓同步编码(分支对齐、commit 顺序、fetch hijack、踩坑表)
  - `archive-and-blind.md` — 归档目录与双盲铁律(`.{agent}/<date>/`、跨仓镜像、不要碰对方目录)
  - `hard-constraints.md` — QA agent 7 条硬约束(每条附反例与自查)
  - `report-format.md` — 报告 markdown 骨架与严重度分级(BLOCKER/HIGH/MEDIUM/LOW/NOTE)
- **templates/ 占位符模板**(4 份):
  - `tech-review-prompt.md` — 模式 B(编码前评审)
  - `qa-regression-prompt.md` — 模式 A(编码后回归)
  - `auth.md` — 项目级鉴权骨架(待填)
  - `env-tools.md` — 项目级工具链骨架(待填)
- **examples/ <DASHBOARD> 实例**(3 份):
  - `README.md` — 实例使用说明
  - `auth-<DASHBOARD>.md` — <DASHBOARD> `X-ClawToken` 通道实例
  - `env-tools-<DASHBOARD>.md` — <DASHBOARD>(JDK 8 + Maven)+ <PROJECT_A>-agent CLI 实例
- **scripts/init.mjs** — 跨平台 Node bootstrap 脚本,支持 `--reviewer-a` / `--reviewer-b` / `--yes` 参数
- **plugin 元数据**:`.claude-plugin/plugin.json` + `marketplace.json` 支持 `/plugin install`
- 顶层 `README.md` + `LICENSE` (MIT)

### 设计决策(brainstorming 锁定)

- 抽象 reviewer-A / reviewer-B 占位,codex / opencode 仅作示例(向后兼容 cursor / cline / qoder 等独立 agent 工具)
- references **不**复制到 `<repo>/.claude/rules/`,仅 templates / auth.md / env-tools.md 复制
  - 设计:skill 升级后,所有项目同步获得新规则;项目自身的 auth/env-tools 不会被覆盖
- 中文主体 + 英文 description,LLM 触发覆盖更广

### 已知 follow-up

- [ ] 上线后跑 RED-GREEN baseline 测试(单 agent 无 skill vs 装 skill 对比)
- [ ] 收集首批用户反馈(<DASHBOARD> 团队 / 外部 FDE)
- [ ] 根据反馈决定:多仓 + 三方协同两条主线是否需要拆为独立 skill
- [ ] (可选)上游提交到 anthropic/claude-plugins-public marketplace,扩散到外部社区
