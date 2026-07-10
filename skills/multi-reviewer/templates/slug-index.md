<!--
  multi-reviewer · v1.9 · 需求维度 AC 结论索引骨架
  路径:<primary-repo>/.claude/<slug>/index.md
  作用:记录该需求(slug)下每轮 AC 的结论,跨日期可达
  谁维护:主 agent — 每轮 AC 结束后追加一行(机械动作)
  谁读:主 agent 跨会话进入 skill 时拾历史
  副 agent:**不读不镜像**(双盲底线;详见 references/archive-and-blind.md §5.1 / §6)

  v1.9 变更:
  - 只记每轮 AC 结论,不记 reviewer 的中间报告
  - 存在阻塞问题时可选择记录中间产物路径(在"产物"列)
  - 路径从 ../<date>/ 变为 ./<date>/(index 在 slug 根,日期目录在 slug 下)
-->

# {{slug}} — AC 结论索引

> 本文件由主 agent 在每轮 AC 结束后追加;每行 = 一轮 AC 结论。

| 日期 | 轮次 | 模式 | 结论 | 产物(可选) |
|---|---|---|---|---|
| {{YYYY-MM-DD}} | R{{N}} | {{B1/B2/B3/B4/A}} | {{🟢/🟡/🔴 结论概述(1-2 行)}} | — |

<!--
追加示例(只记结论):

| 2026-06-20 | R1 | B2 | 🟡 有条件通过(2 个 MEDIUM 建议已修:接口分页参数统一、异常日志级别) | — |
| 2026-06-22 | R2 | A | 🟢 通过(0 BLOCKER,0 HIGH) | — |
| 2026-06-25 | R3 | A | 🔴 阻塞(codex+opencode 都报 SQL 性能问题,详见报告) | [../../.codex/625-org-standard-management/2026-06-25/qa-report.md](../../.codex/625-org-standard-management/2026-06-25/qa-report.md) |

注意:
- "结论"列:用 1-2 行概述本轮 AC 结果(结论模板:🟢 通过 / 🟡 有条件通过 / 🔴 阻塞 + 简述)
- "产物"列:大部分轮次填 `—`;仅在存在阻塞问题时,可选择记录关键中间产物路径供追溯
- 路径:同 slug 下的日期目录:`./<date>/<file>`;reviewer-A (默认 .codex/):`../../.codex/<slug>/reviewer/<date>/<file>`;reviewer-B (默认 .opencode/):`../../.opencode/<slug>/reviewer/<date>/<file>`
- reviewer-C (N≥3,如 .cursor/):`../../.cursor/<slug>/reviewer/<date>/<file>`;字母循环 a-z 类推
- 不记录 reviewer 的日常评审/QA 报告 — 那些在 reviewer 自己的归档目录中
-->
