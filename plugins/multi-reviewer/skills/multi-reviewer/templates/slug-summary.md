<!--
  multi-reviewer · v1.9 · 需求维度决策概要骨架
  路径:<primary-repo>/.claude/<slug>/summary.md
  作用:该需求的决策史 + 未闭环项 + 跨会话提醒;主 agent 跨会话进入 skill 时**首要 Read** 对象
  谁维护:主 agent — 重大决策 / v 版本切换 / 新发现未闭环项时**人工更新**

  v1.9 变更:
  - 只记每轮 AC 结论,不关联 QA/AC 中间产物
  - 加 PRD 引用(<CALENDAR_PLATFORM>转存的 prd.md)
  - 方案引用不带版本号(tech-design.md 而非 tech-design-v2.md)
  - 决策史每行只写结论概述,不链 reviewer 报告

  避免空话:每条具体到事实 + 引用文件路径
    反例(不要写):
      "v2 是 v1 的扩展" / "整体看起来 OK" / "技术方案没大问题" / "审批走流程"
    正例(应这样写):
      "R1 B2 技术方案评审 🟡 有条件通过(接口分页参数统一为 cursor/limit,异常日志级别调整),方案定稿 tech-design.md"
      "R2 A QA 回归 🟢 通过,0 BLOCKER 0 HIGH,已上线 6/22"

  副 agent:**不读不镜像**(双盲底线;详见 references/archive-and-blind.md §5.1 / §6)
-->

# {{slug}} — 决策概要

## 状态

- **当前阶段**:{{需求澄清 / 技术方案 / 编码 / QA / 上线 / 已收尾}}
- **最后更新**:{{YYYY-MM-DD}}
- **PRD**:[prd.md](./prd.md)(如有,从<CALENDAR_PLATFORM>文档转存)
- **技术方案**:[tech-design.md](./tech-design.md)(方案最终版,不带版本号)
- **测试方案**:[test-plan.md](./test-plan.md)(如适用)
- **上线方案**:[rollout-plan.md](./rollout-plan.md)(如适用)
- **关联仓库**(若多仓):
  - 主仓:{{绝对路径,分支名}}
  - 副仓:{{绝对路径,分支名}}

## 决策史

> 每轮 AC 一行,只记结论;不链 reviewer 报告

- **R1** {{模式 B1/B2/B3/B4/A}} ({{YYYY-MM-DD}}):{{结论概述,如 "🟡 有条件通过(2 个 MEDIUM 建议已修:接口分页参数统一、异常日志级别)"}}
- **R2** {{模式}} ({{YYYY-MM-DD}}):{{结论概述}}

## 未闭环项

> 跨轮跨日期的待办;每条用 markdown checkbox,close 时标 `[x]` + 闭环依据

- [ ] {{具体事项,如 "R1 B2 中建议的 SQL 索引优化尚未实施,待 R2 A 验证"}}
- [ ] {{...}}

## 待主 agent 关注(下次进 skill 必读)

> 跨会话提醒;主 agent 第 0 件事拿到 slug 后,Read 本文件就重点看这一段

- {{下次进 skill 必读事项,如 "测试方案 B3 评审尚未跑;按协议 B3 前置=已通过的产/技方案,需先确认技术方案已通过 B2"}}
- {{...}}

## 历史 reviewer 配置(可选,仅在 N>2 或非默认配置时记)

- reviewer-A:{{codex / 其它}}
- reviewer-B:{{opencode / 其它}}
- reviewer-C:{{...,若有}}

## 备注

{{任何其它跨会话需要记下的 context}}
