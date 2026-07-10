---
name: filling-prompts
description: 主 agent 怎么填 templates/ 占位符并 dispatch 给 reviewer 的完整指引;5 子模式占位符对照表;用户 dispatch workflow(贴文件路径 + 执行)
version: 1.3.0
---

# 填充提示词与 dispatch 流程

> 上位文件:`SKILL.md`(索引)。本文件给主 agent 看:每次新需求怎么从 `templates/` 生成可直接被 reviewer 执行的 prompt 文件。

---

## 1. 主 agent 流程(每次新需求)

```
1. 拷贝 templates/<name>-prompt.md → <primary-repo>/.claude/<slug>/<YYYY-MM-DD>/<name>-prompt.md
2. 填占位符(只替换 {{...}},不要动 <skill-path> / <repo> / .{a-name} 等系统占位符)
3. 双盲检查:确认没把主 agent 自评 / 对方报告内容写进 prompt
4. 告诉用户文件绝对路径,用户去 codex / opencode 直接贴路径 + "执行"
```

**模板 vs 项目母板 vs 任务文件 三级关系**:

| 层 | 路径 | 角色 |
|---|---|---|
| skill 模板 | `<skill-path>/templates/<name>-prompt.md` | 跨项目通用骨架,版本随 skill 升级 |
| 项目母板 | `<repo>/.claude/rules/<name>-prompt.md` | init.mjs 把 skill 模板拷过来,reviewer 名占位符已替换 |
| 任务文件 | `<primary-repo>/.claude/<slug>/<YYYY-MM-DD>/<name>-prompt.md` | 主 agent 每次新需求从项目母板复制,填本次具体的 `{{...}}` |

通常推荐主 agent 直接从**项目母板**复制(不是 skill 模板),因为项目母板的 reviewer 名已经替换好了,且若该项目对模板有局部定制也能跟着继承。

---

## 2. 占位符对照表(5 子模式)

> v1.3.0 起,模式 B 拆为 4 子模式(B1 产品 / B2 技术 / B3 测试 / B4 上线),对应 4 份模板;模式 A 仍 1 份。下面分别给对照表。

### 共有占位符(5 模板共用)

| 占位符 | 含义 | 示例 |
|---|---|---|
| `{{需求短标题}}` | 简短标题(15 字以内) | `差旅报表 Agent` |
| `{{版本号}}` | 当前评审/回归的版本 | `v2` |
| `{{当前版本}}` | 与版本号同义,行文用 | `v2` |
| `{{N}}` | 关键变更/动作的项数 | `13` |
| `{{YYYY-MM-DD}}` | 当天日期 | `2026-05-25` |
| `{{当前轮次}}` | 多轮回归时本轮编号 | `2` |
| `{{上一轮日期}}` / `{{上一轮文件名}}` | 多轮回归回看自己旧报告 | `2026-05-20` / `xxx-evaluation.md` |
| `{{评审报告文件名}}` (B1-B4) / `qa-report.md` (A) | 报告输出文件名 | `差旅 Agent-v2-evaluation.md` |

### 2.1 模式 B2(tech-review-prompt.md)

| 占位符 | 含义 | 示例 |
| --- | --- | --- |
| `{{需求短标题}}` | 方案的简短标题(15 字以内) | `差旅报表 Agent` |
| `{{版本号}}` | 当前评审的方案版本 | `v2` |
| `{{方案文档绝对路径}}` | 主方案文档完整路径 | `<repo>\.claude\<YYYY-MM-DD>\<方案名>.md` |
| `{{方案文档相对路径}}` | 在评审报告头部引用的路径 | `.claude/<slug>/<YYYY-MM-DD>/<方案名>.md` |
| `{{当前版本}}` | 与版本号同义,用于行文 | `v2` |
| `{{上一轮评审日期 YYYY-MM-DD}}` | 上一轮评审报告的日期目录 | 例 `2026-05-14` |
| `{{上一轮文件名}}` | 上一轮评审报告文件名 | `<方案名>-evaluation.md` |
| `{{评审报告文件名}}` | 本轮评审报告输出文件名 | `<方案名>-{版本}-evaluation.md` |
| `{{YYYY-MM-DD}}` | 本轮评审日期目录 | 例 `2026-05-21` |
| `{{编码阶段}}` | 评审通过后进入的编码里程碑名 | `P0.1` |
| `{{技术栈关键词}}` | 角色画像里的技术栈 | `Java / Spring / MyBatis / Doris` |
| `{{业务领域常识}}` | 角色画像里的业务背景 | `HR/SaaS 领域权限模型` |
| `{{相关设计领域}}` | 角色画像里的设计判断力 | `LLM Agent / CLI / Skill 路由设计` |
| `{{方案标题与版本}}` | 评审任务行的全称 | `差旅报表 Agent 技术方案 v2` |
| `{{N}}` | 关键变更的项数 | `13` |

### 2.2 模式 B1(product-review-prompt.md,**单 reviewer 例外**)

| 占位符 | 含义 | 示例 |
|---|---|---|
| `{{产品方案文档绝对路径}}` | 产品方案主文档 | `<repo>\.claude\<date>\prd-差旅 Agent-v2.md` |
| `{{产品方案文档相对路径}}` | 报告头部引用 | `.claude/<slug>/<date>/prd-差旅 Agent-v2.md` |
| `{{业务领域常识}}` | 角色画像里的业务背景 | `HR/SaaS / 工具效率类产品 / B2B 协同` |
| `{{下一阶段名}}` | 评审通过后进入的阶段 | `技术方案` / `MVP` |
| `{{方案标题与版本}}` | 任务行全称 | `差旅 Agent 产品方案 v2` |

**单 reviewer 例外的 dispatch**:主 agent 派发时**告知用户**"贴给 reviewer-A 或 reviewer-B 任一即可,不需要双盲";reviewer 在模板 Step 1 选归档目录(`.{a-name}/` 或 `.{b-name}/`),报告**只写一份**。

### 2.3 模式 B3(test-plan-review-prompt.md)

| 占位符 | 含义 | 示例 |
|---|---|---|
| `{{测试方案文档绝对路径}}` | 测试方案主文档 | `<repo>\.claude\<date>\test-plan-差旅 Agent-v2.md` |
| `{{测试方案文档相对路径}}` | 报告头部引用 | `.claude/<slug>/<date>/test-plan-差旅 Agent-v2.md` |
| `{{已通过的产品方案绝对路径}}` | 前置依赖 | `<repo>\.claude\<date>\prd-差旅 Agent-v2.md` |
| `{{已通过的技术方案绝对路径}}` | 前置依赖 | `<repo>\.claude\<date>\tech-design-差旅 Agent-v2.md` |
| `{{技术栈关键词}}` | 角色画像 | `Java JUnit / TypeScript Jest / Python pytest` |
| `{{业务领域常识}}` | 角色画像 | `HR/SaaS 多租户测试` |
| `{{测试执行阶段}}` | 评审通过后进入的阶段(统一,不要再用 `测试阶段`) | `P0.2-test` |
| `{{方案标题与版本}}` | 任务行全称 | `差旅 Agent 测试方案 v2` |

**前置依赖**:reviewer 必须先确认产品方案 / 技术方案均已通过评审;若未通过,直接报"前置不成立"。

### 2.4 模式 B4(rollout-review-prompt.md)

| 占位符 | 含义 | 示例 |
|---|---|---|
| `{{上线方案文档绝对路径}}` | 上线方案主文档 | `<repo>\.claude\<date>\rollout-差旅 Agent-v2.md` |
| `{{上线方案文档相对路径}}` | 报告头部引用 | `.claude/<slug>/<date>/rollout-差旅 Agent-v2.md` |
| `{{已通过的技术方案绝对路径}}` | 前置依赖 | `<repo>\.claude\<date>\tech-design-差旅 Agent-v2.md` |
| `{{基础设施关键词}}` | 角色画像 | `Kubernetes / GitLab CI / Argo Rollouts / Prometheus` |
| `{{业务领域常识}}` | 角色画像 | `高频次低风险服务 / 数据敏感型服务` |
| `{{发布窗口}}` | 评审通过后进入的发布阶段(统一,不要再用 `发布窗口名`) | `P0.3-rollout` |
| `{{方案标题与版本}}` | 任务行全称 | `差旅 Agent 上线方案 v2` |

**基础设施事实核查**:reviewer 必须打开 CI/CD pipeline 配置 / 监控规则,不准凭印象判断"灰度策略合理"。

### 2.5 模式 A(qa-regression-prompt.md)

| 占位符 | 含义 | 示例 |
|---|---|---|
| `{{仓库与分支描述}}` | 一句话描述本次改动 | `<DASHBOARD> feature/520 + <PROJECT_A>-agent CLI` |
| `{{需求短描述}}` | 一句话描述功能 | `Agent 权限相关查询能力` |
| `{{主仓路径}}` | 主仓绝对路径(= skill 触发时的 cwd 所属 git 仓根) | `E:\<REDACTED>\<DASHBOARD>` |
| `{{主仓分支名}}` | 主仓 git 分支 | `feature/520-travel-skill` |
| `{{副仓 1 路径}}` / `{{副仓 N 路径}}` | 副仓绝对路径(v1.3:**prompt 不再镜像副仓**,但要列出供 reviewer 自己 cd) | `E:\<REDACTED>\<PROJECT_A>-agent` |
| `{{副仓 N 分支名}}` | 各副仓分支 | `feature/520-travel-skill` |
| `{{repo}}` | 对应仓相对路径前缀 | `E:\<REDACTED>\<DASHBOARD>` |
| `{{name}}` | 技术方案文档后缀 | `<DASHBOARD>` / `cli` |
| `{{维度 N 名称}}` | 本次验证的维度 | "零影响是否真零影响" |
| `{{TestClass}}` | 本次新增的测试类名 | `AgentPermissionServiceImplTest` |
| `{{模块路径}}` | 单测所在模块 | `<DASHBOARD>-application` |
| `{{鉴权自检命令}}` | 健康探针 / 鉴权握手 | `curl -X POST .../me ...` |
| `{{单测执行命令}}` | 当前工作区跑单测的方式 | `mvn-jdk8.ps1 -pl X -am test ...` |
| `{{类型检查命令}}` | 静态检查 | `npx tsc --noEmit ...` |

### 2.6 由 init.mjs 自动替换的系统占位符(主 agent 别动)

| 占位符 | 替换规则 |
|---|---|
| `{a-name}` / `{b-name}` | reviewer-A / B 的目录名(默认 `codex` / `opencode`)|
| `{c-name}` / `{d-name}` / ... | reviewer-C / D / ... 的目录名(配置 N≥3 时存在;字母循环 a-z 最多 26 个)|
| `<reviewer-a>` / `<reviewer-b>` / `<reviewer-c>` / ... | 同上 |
| `<repo>` | 不替换,reviewer 在自己环境里 resolve |
| `<skill-path>` | 不替换,reviewer 在自己环境里 resolve |

> **N reviewer 配置**:`init.mjs --reviewer-a=codex --reviewer-b=opencode --reviewer-c=cursor --reviewer-d=cline ...`(默认 a/b 必填,c/d/e/... 可选)。
>
> **init 替换行为**:`init.mjs` 只替换**实际配置的字母**对应占位符(`{a-name}` `{b-name}` `{c-name}` ... 中已配置的);**未配置的字母占位符会原样保留 literal**(如默认 N=2 时 `{c-name}` `{d-name}` 不被替换,以 `{c-name}` 字面字符串保留在生成的项目母板里)。
>
> **主 agent 处置**:主 agent 从项目母板复制到任务文件 `<repo>/.claude/<slug>/<date>/<name>-prompt.md` 时,**按本次实际配置的 N 删掉不适用的 reviewer-C/D/... 示例行**(若本项目 N=2,删除模板里 reviewer-C/D 的归档示例 + Step 1 的 "C/D" 提及;若 N=3 则保留 C 删除 D)。这是主 agent 填占位符阶段的清理动作,不是 init.mjs 的责任。

---

## 3. 用户 dispatch workflow(给用户)

主 agent 把占位符填好、文件落到 `<primary-repo>/.claude/<slug>/<YYYY-MM-DD>/<name>-prompt.md`,然后告诉用户文件绝对路径。

**用户在 codex / opencode 里**:

```
<绝对路径>/.claude/<slug>/<YYYY-MM-DD>/tech-review-prompt.md
执行
```

或:

```
请按 <绝对路径>/.claude/<slug>/<YYYY-MM-DD>/qa-regression-prompt.md 的指令跑
```

reviewer agent 读到文件后,顶部的 HTML 注释告诉它"这是 multi-reviewer 提示词、按下面的步骤跑";第二段开始就是它要执行的具体内容(立即执行 / 任务段)。

**用户对每个 reviewer 各跑一遍**:同一份 prompt 文件,先丢给 reviewer-A,再丢给 reviewer-B,**两边互不告知对方在跑什么**。

> v1.10 起,reviewer 报告的落点也在主仓(**不镜像副仓**),路径为 `<primary-repo>/.{reviewer}/<slug>/reviewer/<YYYY-MM-DD>/qa-report.md`。

---

## 4. 双盲原则:填占位符时的 do / don't

### Do(允许写)

- 任务事实:仓库路径、分支名、方案文档路径
- 数据规模:可用测试角色名、380 条记录、5 个接口
- 已批准的外部依赖
- 关键变更编号、章节号引用
- 评估维度清单(主 agent 已知本次方案需要被特别审视的方向)

### Don't(双盲禁区)

- 主 agent 的判断性自测结论:"我自测过 5 个接口都通过"
- 主 agent 对方案的自评:"我觉得 K2 简化是稳的"
- 对方 reviewer 的报告或结论:"另一个 reviewer 说 X"
- 暗示性引导:"重点关注 SQL 性能,我担心索引"(让 reviewer 自己发现,而不是被引导)

详见 `cross-validation.md` §5 双盲原则。

---

## 5. 占位符填漏的常见问题

| 症状 | 原因 | 解法 |
|---|---|---|
| reviewer 跑出来全是问"我应该 ..." | `{{N}}` `{{方案标题与版本}}` `{{编码阶段}}` 等关键占位符没填 | 主 agent 重新检查 prompt 文件,把所有 `{{...}}` 处理掉 |
| reviewer 写错归档路径 | `{a-name}` / `{b-name}` 没替换(init.mjs 没跑过 / 跑了但 prompt 是手工新建的) | 手工跑下 init.mjs 的字串替换;或用 sed/手工改 `{a-name}` → 实际名 |
| reviewer 跑了但完全没读方案文档 | `{{方案文档绝对路径}}` 路径错 | 主 agent 验证路径存在;考虑用 `<repo>` 占位符 + reviewer 自己 resolve |
| reviewer 说"我看到主 agent 的自测结论" | 主 agent 把判断性结论写进 prompt 了(违反双盲) | 重写 prompt,只留事实信息,不留主观判断 |

---

## 6. 5 子模式模板差异对照

| 维度 | B1 产品 | B2 技术 | B3 测试 | B4 上线 | A QA 回归 |
| --- | --- | --- | --- | --- | --- |
| 适用阶段 | 编码前(产品方案审) | 编码前(技术方案审) | 编码前(测试方案审) | 编码前(上线方案审) | 编码后(实现验) |
| 双盲 | ❌ **单 reviewer 例外** | ✅ | ✅ | ✅ | ✅ |
| 是否跑代码 | 否(读文档+假设外露) | 否(读文档+源码核查) | 否(读文档+历史 bug 模式) | 否(读文档+基础设施核查) | 是(跑接口、curl、CLI) |
| 前置依赖 | 无 | 无 | **产品+技术方案均通过** | 技术方案通过 | 编码完成、单测通过 |
| 角色画像 | 产品 / 业务专家 | 工程架构专家 | QA / 测试架构专家 | SRE / DevOps 专家 | 同 B2 风格 |
| reviewer 专属纪律 | **假设外露**(必填) | 代码核查 > 印象 | 前置依赖核查 | 基础设施事实核查 | 鉴权自检 + 真实跑 |
| 双盲对象 | 不看主 agent 自评 | 不看对方评审 | 不看对方评审 | 不看对方评审 | 不看主 agent 自测结论 |
| 输出主轴 | 假设外露 + 阻塞 + 建议 | 阻塞 + 建议 + 上轮对照 | 同 B2 + 偏差段 | 同 B2 + 故障覆盖段 | 严重度分级 finding |
| 落盘文件名约定 | `{方案名}-{版本}-evaluation.md` | 同左 | 同左 | 同左 | `qa-report.md` |
| 报告份数 | **1**(单 reviewer 永远不变) | N(默认 2,可配置 1-N≤26) | 同左 | 同左 | 同左 |

## 版本记录

- v1.3.0 (2026-06-25):v1.8.0 同步。路径加 `<slug>/` 层级;dispatch workflow 加"产出仅主仓"说明;版本号升级
- v1.2.0 (2026-05-25):v1.3.0 同步。§2.6 系统占位符表扩为 N reviewer(`{c-name}/{d-name}/...` 字母循环 a-z);§6 报告份数列改"N(默认 2)"
- v1.1.0 (2026-05-25):v1.3.0 同步。§2 占位符对照表拆为 5 子模式(B1/B2/B3/B4/A)+ 共有占位符段;§6 模板差异表从"模式 A vs B"扩为"5 子模式";A 模式表占位符更新为多仓单源化口径(主仓 + 多副仓 N)
- v1.0.0 (2026-05-21):首版,从 v1.0.0 templates 文件中"使用说明 / 占位符对照表"段提级,新增 dispatch workflow + 双盲 do/don't 段
