<!--
  multi-reviewer · mode A · 编码后 QA 回归提示词(双盲)
  使用方式:在 codex / opencode / 其它 reviewer agent 里贴本文件绝对路径 + "执行" 即可。
  Agent 会按下面的"任务"段直接驱动跑回归。
  跨多仓时:本 prompt 仅主仓单份;reviewer 自己按"仓库与分支"段 cd 到副仓做事。
  填占位符与用法详见 SKILL.md §"templates" 与 references/filling-prompts.md。
-->

# 任务:对 {{仓库与分支描述}} 的改动做独立测试回归

> **使用方式**:你已被指派为本任务的 reviewer。请直接读取本文件并按下面"立即执行"步骤跑,不需要额外补充说明。
> **双盲**:reviewer-A 与 reviewer-B 各自独立跑,互不参考对方过程与产出。

---

## ⚡ 立即执行(Agent 入口)

按以下顺序逐步执行,**不要中途回复用户**(除非 Step 1 身份识别失败 / Step 2 前置不成立),所有产出落盘后再做一次性总结回报。

| Step | 动作 | 完成判定 |
| --- | --- | --- |
| **1. 自我识别** | 通过命令行名 / 进程名 / 系统 prompt / 用户调用上下文,识别自己是哪一个 reviewer(A / B / C / D / ... — 项目默认 N=2 时只有 A/B,配 N≥3 时按字母序最多到 26 个) | 心里明确身份,后续路径用对应的 `.{a-name}/` `.{b-name}/` `.{c-name}/` ... 之一 |
| 1.b 识别失败兜底 | 仅当无法判断身份时,问用户一次"我应该按 reviewer-A / B / C / ... 中哪一个身份回归?" | 拿到明确身份 |
| **2. 前置自检(无源码改动 → 报前置不成立)** | 在主仓跑 `git diff --stat` `git status`,确认本次有源码 / 测试 / 配置类改动。**如果只有文档改动**(*.md / docs/ 只增减),写一份简短报告说"前置不成立:本次无源码改动,QA 回归不适用,建议主 agent 改选 B 模式" → 跳到 Step 7 落盘退出 | 确认有可回归对象,或直接退出 |
| **3. 阅读必读文档** | 完整读"必读"段下的需求 / 技术方案 / 鉴权指引 / 环境工具链 | 理解设计意图与硬约束 |
| **4. 回看你的旧 QA 报告** | 多轮回归时读 `<repo>/.{你身份}/{{上一轮日期}}/qa-report.md`(只读你自己那一份)。首轮回归则跳过 | 拿到自己上一轮 finding |
| **5. 鉴权自检 → 跑回归** | 按下文"推荐验证命令"逐项跑(鉴权自检 → 单测 → 接口 / curl → CLI / 客户端真跑 → 静态检查) | 形成"跑过的验证"表素材 |
| **6. 起草报告** | 按 `<skill-path>/references/report-format.md` 模式 A 骨架写完整 | 各节齐全,finding 按严重度分级 |
| **7. 落盘** | Write 到对应路径(见下文"输出路径"),严格不要写到 `.claude/` 目录 | 文件已存在,内容完整 |
| **8. 简短总结** | 单条回复用户:报告路径 + 控制台摘要行(BLOCKER=x HIGH=y MEDIUM=z LOW=w NOTE=n);**不要**复读整份报告 | 回复 ≤ 200 字 |

**红线规则**:

- ❌ 不要在 Step 3-7 之间打断给用户讲进度
- ❌ 不要询问"我应该评估哪些维度 / 格式如何"等本文件已答复的问题
- ❌ 不要把报告写到 `.claude/` 目录(主 agent 的产出区)
- ❌ 不要查看另一方(对方)的同期或历史 QA 报告
- ❌ **不要 Read** `<primary-repo>/.claude/<slug>/index.md` 或 `<primary-repo>/.claude/<slug>/summary.md`(主 agent 跨会话工作记忆;v1.6 双盲底线 — reviewer 看到主 agent 决策史会附和失去独立视角)
- ❌ 不要在无源码改动时硬跑 — Step 2 报"前置不成立"是合规动作,不是失败
- ❌ 鉴权失败时不要绕过(改 yaml / 关 aegis / 加白名单 / 伪造 token);标"未验证(原因)"继续跑其它
- ❌ **不要写无依据的 finding** — 每条 finding 必带"依据"字段(强制,详见 `<skill-path>/references/report-format.md` §1.1 的 4 类客观依据);无依据 = 降级 LOW 或合并 NOTE
- ✅ 启动的进程验完立即 kill(参 hard-constraints §6)
- ✅ 可以并应该开多个 Read / Grep / Glob / Bash 调用做事实核查与真实跑

---

你是一位独立的 QA / Reviewer。另一个 Agent 刚实现了"{{需求短描述}}"。
你需要做**独立**的测试回归:

- 不复述实现者的步骤
- 靠你自己判断设计意图 → 评估实现是否匹配 → 跑真实验证 → 给出严重度分级的问题清单
- 必须覆盖下面"你要回答的问题"里的所有维度

## 仓库与分支(本 prompt 仅落主仓 .claude/<slug>/<date>/ 单份)

- **主仓**(`<primary-repo>` = 主 agent 触发 skill 时的仓根;prompt 唯一落点):
  - `{{主仓路径}}`,分支 `{{主仓分支名}}`
- **副仓**(reviewer 自行 cd 验证;如本次不跨多仓则删整段):
  - `{{副仓 1 路径}}`,分支 `{{副仓 1 分支名}}`
  - `{{副仓 2 路径}}`,分支 `{{副仓 2 分支名}}`
  - …

> reviewer 在主仓读到本 prompt 后,按上面清单 cd 到各副仓跑验证。报告写完后**只在主仓**`.{your-agent}/<slug>/reviewer/<date>/qa-report.md` 落一份(v1.8 起不再镜像副仓)。
> **不要去副仓找 prompt** — 跨多仓时本 prompt 只在主仓有一份。

## 必读:需求与技术方案

先把下面文档完整读一遍,理解设计意图与硬约束:

1. `{{repo}}/.claude/<slug>/{{YYYY-MM-DD}}/requirement.md`
2. `{{repo}}/.claude/<slug>/{{YYYY-MM-DD}}/tech-design-{{name}}.md`
   重点:{{列出最需要精读的章节号}}
3. (如有其他必读文档)

## 前轮已知盲点(本需求历史 case 摘要)

> {{第 1 轮回归则删整段;第 2 轮及以后填本段}}
>
> 本需求是第 {{当前轮次}} 轮回归。前 {{N-1}} 轮已沉淀以下 case(主 agent 用统一语言归纳,**对 reviewer-A / reviewer-B 内容完全相同**):
>
> 1. 重点验证下方"未闭环" + "监视中" + "修复中"的 case 是否本轮仍存在 / 是否真的修好了
> 2. 同时寻找前轮没发现的新盲点
> 3. **不要**把前轮 case 当 check 清单照抄过来——case 只是先验,不是答案
> 4. 在 QA 报告"§3 与技术方案的偏差"段或新加一段,逐条对照本 case 列表的本轮验证结果
>
> 待验证 cases(请你自己 Read 这些文件):
>
> {{列出本需求 .claude/<原日期>/case-studies/ 下所有"未闭环"/"监视中"/"修复中"状态的 case 文件路径,每行一个。已闭环 / 误报作废的不要列。
>
> 例:
> - `<repo>/.claude/2026-05-20/case-studies/round-1-001-sql-字段漂移.md`(状态:监视中)
> - `<repo>/.claude/2026-05-20/case-studies/round-1-003-跨服务时序.md`(状态:修复中,commit `<sha>` 已修,本轮验证)
> }}

## 通用规范(严格遵守)

详细规则在 skill `<skill-path>/references/` 下,**完整阅读并严格执行**:

- 鉴权指引:`<repo>/.claude/rules/auth.md`
  (**先按此文件跑通鉴权自检再做其他验证**;鉴权失败时不要硬跑,按排错表处理)
- reviewer 工作模式:`<skill-path>/references/reviewer-workmode.md`
- 文件归档规则:`<skill-path>/references/archive-and-blind.md`
- QA 硬约束:`<skill-path>/references/hard-constraints.md`(违反任一条 = BLOCKER)
- 报告格式:`<skill-path>/references/report-format.md`
- 环境与工具链:`<repo>/.claude/rules/env-tools.md`

## 你要回答的问题

请至少覆盖以下维度,每个发现按 `report-format.md` 标注严重度:

1. **{{维度 1 名称}}**
   {{这个维度下具体要查什么,可以分多个子问题}}
2. **{{维度 2}}**
   ...
3. **{{维度 3}}**
   ...
{{按需扩展;保持 5-8 个维度为宜}}

## 本次需求专有的环境信息

- **测试数据**:{{可用的真实测试角色名 / 账号 / ID}}
- **外部依赖的审批状态**:{{已批准的 / 未批准的}}
- **本次新增的单测类**:`{{模块路径}}/src/test/.../{{TestClass}}`
- **本次新增的 HTTP 端点**:
  - `POST {{/api/v1/...}}`
  - `POST {{/api/v1/...}}`
- **CLI / 客户端新增命令**(如有):
  - `+{{cmd1}}`
  - `+{{cmd2}}`
- **其他注意**:{{本次特有的坑点 / 约束}}

## 推荐验证命令

> 下方命令按"后端 + 客户端"双仓场景给出。具体路径参考 `<repo>/.claude/rules/env-tools.md` 的当前工作区实例。

```bash
# 1) 鉴权自检 —— 详见 rules/auth.md
{{鉴权自检命令,例:curl 后端 /me 端点确认 200}}

# 2) 跑本次新增单测
{{单测执行命令,例:mvn-jdk8.ps1 -pl <module> -am test -Dtest={{TestClass}} -DfailIfNoTests=false}}

# 3) 静态类型 / lint 检查
{{类型检查命令,例:cd <secondary-repo> && npx tsc --noEmit -p tsconfig.json}}

# 4) {{本次特有的验证命令}}
```

## Java 后端适用性门

如果改动命中 `.java` 文件、Maven `pom.xml`、Gradle Java 插件/模块、Java 源码包路径，
或任务明确声明为 Java 后端，必须完整读取并应用
`<skill-path>/references/java-backend-standard.md`，逐条核查本次新增/修改代码的命名、
分层、参数、事务、异常、SQL、日志脱敏和 150 字符行宽。存量违规标为 baseline debt，
不扩大本轮验证。无法确认适用时报告 `NOTE: Java 规范适用性未确认`，不以 Java-only 规则直接阻塞。

## 验证白名单与基线债

只运行本 prompt 列出的验证白名单；Maven 使用 `-pl <受影响模块> -am`，多个测试类使用
逗号分隔的 `-Dtest=ClassA,ClassB`，禁止扩大到未改动模块、无关测试或未批准接口。白名单
命令暴露无关基线问题时立即停止扩大，记录命令、错误证据、基线判断、影响范围和未验证项，
等待主 agent 或用户授权后再扩大；不得用临时 classpath、Launcher、改配置或关闭鉴权绕过。

## 输出路径

按 `<skill-path>/references/archive-and-blind.md` 规则,**所有 AC 产出仅主仓**(v1.8 起,不再镜像副仓):

- 如果你是 **reviewer-A**(例:codex),**报告**只写到主仓:
  - `{{主仓路径}}\.{a-name}\<slug>\reviewer\{{YYYY-MM-DD}}\qa-report.md`
- 如果你是 **reviewer-B**(例:opencode),**报告**只写到主仓:
  - `{{主仓路径}}\.{b-name}\<slug>\reviewer\{{YYYY-MM-DD}}\qa-report.md`
- 如果你是 **reviewer-C / D / ...**(项目配置 N≥3 时存在),**报告**只写到主仓:
  - `{{主仓路径}}\.{c-name}\<slug>\reviewer\<date>\qa-report.md` / `.{d-name}\<slug>\reviewer\<date>\qa-report.md` ...

> N reviewer 双盲:你不能查看其他 reviewer(不论 A/B/C/D/...)的同期或历史 QA 报告。

跨多仓时,reviewer 在主仓读 prompt,在副仓跑验证命令,所有结论汇总到主仓的一份报告中。目录不存在就创建。
写完后按 `report-format.md` 约定在控制台打一行摘要,不要把报告正文打印出来。

> 不要把 prompt 或报告镜像到副仓 — v1.8 起全部产出仅主仓。副仓不落任何 AC 产出。

## 硬约束

所有 reviewer 还必须遵守 `<skill-path>/references/reviewer-workmode.md`，包括双盲派发、
断流兜底、≤5 commit 和 ≤200 字标准化总结。

见 `<skill-path>/references/hard-constraints.md`。

额外本次限定(如有):
- {{本次需求特有的额外约束,没有就删掉整段}}

---

**开始回归。**
