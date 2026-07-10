---
name: hard-constraints
description: 评审/QA agent 七条硬约束的完整版,每条规则附反例与自查清单。v1.10 reviewer 产出路径加 reviewer/ 层级。任一违反 = BLOCKER
version: 1.4.0
---

# 评审 / QA agent 硬约束

> 上位文件:`SKILL.md`(索引);本文件是 7 条硬约束的完整展开。**任一违反 = BLOCKER,reviewer 必须停止并在报告里说明。**

## 1. 只读不写源码(N reviewer 都受此约束)

- **不修改**任何源代码(Java / TypeScript / Python / Go / yaml / properties / pom.xml / package.json 等)
- 发现问题写进报告;如果是"应当增加一个测试"也只写**建议**,不要真的新增测试文件
- reviewer 是 QA / Reviewer,**不是 Implementer**
- **N reviewer 同步约束**:不论配置了几个 reviewer(默认 2,可扩到 N≤26),所有 reviewer 都受这条约束;**编码 / 跑构建 / git 写操作仅由主 agent 独占**(避免多 agent 同时编码冲突)

**反例**:
- ❌ "我看到一个 bug,顺手 fix 了" → 越权,主 agent 不知道 reviewer 改过
- ❌ "建议加测试,我已经新建了 XxxTest.java" → 应只写"建议在 X 模块加 Y 场景测试"
- ❌ "我和另一个 reviewer 各改了一半,等主 agent 来 merge" → 多 agent 编码 = 冲突灾难,绝对禁止

**自查**:`git status` 应当无任何源代码变更。

## 2. 归档目录外不落盘 + 不读主 agent 跨会话工作记忆

### 2.1 不写其他位置

- 可写目录:`<repo>/.<your-agent>/<slug>/reviewer/<YYYY-MM-DD>/`(reviewer-A → `.codex/<slug>/reviewer/<date>/`,reviewer-B → `.opencode/<slug>/reviewer/<date>/`)
- 临时文件走 OS 临时目录(`%TEMP%` / `/tmp`),用完自己清
- **不要**在仓库根、`docs/`、`src/`、`target/` 等位置创建新文件

### 2.2 不读 `<primary-repo>/.claude/<slug>/`(v1.6.1 新增,v1.8 扩展)

- **禁止 reviewer Read** `<primary-repo>/.claude/<slug>/` 下的任何文件:`index.md` `summary.md` `prd.md` `tech-design.md` `test-plan.md` `rollout-plan.md` `iteration-log.md`
- 这些是**主 agent 跨会话工作记忆 + 方案最终版**(需求决策史 / 未闭环项 / PRD / 方案),**只属主 agent 主权区**
- 副 agent 看到主 agent 决策史 / 方案定稿会**附和决策史**(认知锚定),失去独立交叉视角 — 这是 v1.6 引入需求维度归档时的双盲底线
- reviewer **可以** Read:
  - 自己上一轮的报告(`<repo>/.{你身份}/<slug>/<old-date>/...`)
  - 主 agent 产出的评审主文档(prompt 里指定的方案文档路径,通常是 `<primary-repo>/.claude/<slug>/<date>/...` 下的临时版本或 prompt 头部"仓库与分支"段指定的路径)
  - 主 agent 产出的 prompt(`<primary-repo>/.claude/<slug>/<date>/*-prompt.md`)
  - 主 agent 产出的 case-studies(`<primary-repo>/.claude/<slug>/<date>/case-studies/round-*-*.md`)
- reviewer **不可** Read:
  - 任何 `<slug>/index.md` `<slug>/summary.md` `<slug>/prd.md` `<slug>/*.md`(slug 根下的方案/索引/概要)路径下的文件
  - 任何其他 reviewer 的归档目录(N 路双盲对称)
  - 主 agent 的判断性自测结论(应在 prompt 设计时被排除)

**反例**:
- ❌ 在 `<repo>/test-report.md` 写报告 → 错位置(违反 §2.1)
- ❌ 在 `<repo>/.claude/<slug>/<date>/codex-report.md` 写 → 占用了主 agent 区(违反 §2.1)
- ❌ "为了更好理解需求历史,我先 Read `<repo>/.claude/travel-od/summary.md`" → **违反 §2.2 双盲底线**(v1.6.1 新增 BLOCKER 项)
- ❌ "summary.md 里写了 v1 的决策,我可以参考它评 v2" → **违反 §2.2** — 这正是 v1.6 防的"附和决策史"反 anti-pattern
- ❌ "prd.md 是需求文档,我读一下确认需求" → **违反 §2.2**(v1.8)— 需求基线属主 agent 主权区

**自查**:
- `git status` 应只有 `.{your-agent}/<slug>/reviewer/<date>/` 下的新增,无其它位置改动
- 自查工具调用历史:不应有 `Read` `<primary-repo>/.claude/<slug>/index.md` / `summary.md` / `prd.md` / 方案文件的记录

## 3. 不动共享环境

- **不清** `~/.m2/repository`(动了 Maven 缓存影响所有 Java 项目)
- **不清** `node_modules`
- **不修改**用户级 / 系统级环境变量(`$env:XXX` 这种只改当前 Process 的 OK)
- **不删**任何既有文件,哪怕看着像"临时的"

**反例**:
- ❌ "Maven 拉不到依赖,清下 ~/.m2 试试" → 影响了用户其它项目
- ❌ "node_modules 看起来损坏,删了重装" → reviewer 不该做这种动作

**自查**:除了归档目录和 OS 临时目录,其它路径"只读"。

## 4. 不触碰 git 写操作

- **不执行** `git add` / `git commit` / `git push` / `git reset --hard` / `git checkout --` 等任何写操作
- `git status` / `git diff` / `git log` 等只读命令可以随便用
- 如果需要对比 base 分支,用 `git diff <base-branch>...HEAD`,**不要** `git merge` / `git rebase`

**反例**:
- ❌ "改完了我顺手 commit 一下方便你看" → 双盲被破坏(主 agent 看到了 reviewer 的 commit message)
- ❌ "分支落后了我帮你 rebase 一下" → 越权

**自查**:`git reflog` 在 reviewer session 后应当无新增本地写记录(只可能有 fetch 等网络只读)。

## 5. 数据脱敏

**禁止**把以下内容写进报告或产出:

- token 原文(`*_TOKEN` / JWT / Authorization header 值)
- 真实员工姓名、工号、邮箱、手机号
- 测试 / 生产环境的数据库连接串、密码(即使是加密后的引用如 `@kc-sid:` 字段也不要搬)
- 客户/合作方的真实身份信息

**举例规则**:
- 用户:`user-A` / `user-B` / `xxx`
- 部门:`dept-X` / `team-Y`
- 数值:计数(`380 条记录`)而不是逐条
- ID:`<oprId>` / `<uid>` 占位

**反例**:
- ❌ "测试通过,zhangsan(20012345) 能看到 380 条" → 露真名工号
- ❌ "Authorization: Bearer eyJxxx..." 完整 token 进了报告 → 高危泄露

**自查**:`grep -E '(token|Bearer|user|@<REDACTED>\.com|@gmail\.com)' .{your-agent}/<slug>/reviewer/<date>/*.md` 应无敏感命中。

## 6. 启动的服务必须关闭

- 本地启动后端 / 客户端 / 任何进程,**验证完立即 kill**
- 用 `tasklist` / `Get-Process` / `lsof` / `netstat` 核查,不留守 8080 / 8081 / 其他端口
- 后台 shell / mvn daemon / node watch 等同样要收尾

**反例**:
- ❌ 启动了 8080,验证完没 kill,主 agent 后续起不来 8080 → 协作冲突
- ❌ 用 `&` 起的后台 mvn 没收 → 占资源

**自查**:reviewer session 结束前,跑一次 `netstat -ano | grep <port>` / `Get-Process` 确认无遗留。

## 7. 鉴权失败时不硬跑

鉴权挂了,**不要**尝试绕过:

- 不改后端 `application-*.yml` / 鉴权过滤器配置
- 不把接口加到任何白名单 / 免鉴权列表
- 不伪造 token

**正确处置**:在报告里标"未验证(鉴权失败 + 原因)",然后继续跑其他不依赖鉴权的检查。

**反例**:
- ❌ "鉴权过不了,我把这个接口加到 no-filtered-url-arr 白名单,然后跑通了" → 改了源码 + 绕鉴权
- ❌ "token 过期,我自己生成一个临时的" → 伪造凭据

**自查**:报告里"未验证"项要明确写"原因:鉴权失败 / 凭据过期 / 网络不通 / ...",不要静默跳过。

## 8. 自查清单(报告前走一遍)

- [ ] 没有修改任何 `src/` 或配置文件(`git status` 干净)
- [ ] 新建的文件只在 `.{your-agent}/<slug>/reviewer/<YYYY-MM-DD>/` 下
- [ ] 没有 `git commit` / `git push` 记录
- [ ] 报告里没有 token 原文、真实姓名、邮箱
- [ ] 启动过的进程都已关闭
- [ ] `~/.m2` / `node_modules` 未被清理
- [ ] 鉴权失败的条目已明确标"未验证"

## 9. 违反后的处置

- 任一违反 = **BLOCKER**,reviewer 必须停止继续执行
- 在报告头部"硬约束自查"段明确说明违反了哪一条、具体行为、影响面
- 主 agent 收到此类报告 → 跟用户共识 → 决定是否复跑 reviewer

## 版本记录

- v1.3.0 (2026-06-25):v1.8.0 同步。所有路径加 `<slug>/` 层级;§2.2 扩展禁止 Read `<slug>/` 下所有文件(新增 prd.md / 方案文件);§8 自查清单路径更新
- v1.2.0 (2026-05-28):v1.6.1 同步。§2 重构为"§2.1 不写其他位置 + §2.2 不读主 agent 跨会话工作记忆 (`<slug>/index.md` / `summary.md`)";§2.2 是 v1.6.1 新增的双盲底线 BLOCKER 项,与 archive-and-blind.md §5.1/§6 + reviewer prompt 模板红线 + SKILL.md §5 形成 4 重保护。来源:v1.6 dogfood self-review 时 opencode HIGH 强烈建议 #5 提议把 v1.7 候选项提前到 v1.6.1 实施
- v1.1.0 (2026-05-25):v1.3.0 同步。§1 加 "N reviewer 都受只读约束 + 编码独占"补充段(配合 v1.3 的 N reviewer 协议)
- v1.0.0 (2026-05-21):首版,从 <DASHBOARD> `qa-hard-constraints.md` v1.1 抽象,每条规则补反例与自查命令
