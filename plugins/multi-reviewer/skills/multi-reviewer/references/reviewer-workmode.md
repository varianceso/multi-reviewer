---
name: reviewer-workmode
description: 当前工作模式下的 reviewer 协同、派发、验证白名单与断流兜底规则。所有 multi-reviewer reviewer 必须遵守。
version: 1.0.0
---

# Reviewer 工作模式

> 上位文件:`SKILL.md`。本文件是所有 B1-B4/A reviewer 共用的执行政策，优先级低于用户明确授权和 `hard-constraints.md` 的硬约束。

## 1. 角色与协同

| 角色 | 职责 | 禁止事项 |
| --- | --- | --- |
| `claude` 主 agent | 需求澄清、方案设计、编码、自测、本地集成测试、生成 prompt、收集 N 份报告并裁决 | 不把最终 QA 回归交给自己完成 |
| `codex` | 独立方案评审或编码后 QA 回归；默认经 PPIO 使用 gpt-5.6 | 不改源码、不 commit、不清共享环境、不读其他 reviewer 产出 |
| `opencode` | 与 codex 对称的独立方案评审或 QA 回归 | 同上 |
| `mico` | 项目 `.claude/mico/` 中的 lead/coder/qa/reviewer 等角色框架 | reviewer 角色只读评审，不做 AC commit |
| `zcode` | codex 断流后的同一子任务接跑替补 | 不因替补身份放宽 reviewer 硬约束 |

可配置 reviewer 还包括 `cursor`、`cline`、`qoder`、`aider`、`trae` 等。所有 reviewer
均保持 N 路双盲：不看其他 reviewer 的同期或历史报告，不读取主 agent 的
`<slug>/index.md`、`summary.md`、`prd.md` 和方案最终版。

## 2. 派发风格

review prompt 只提供四类信息：

1. **路径**：任务 prompt、必要的方案/代码路径、仓库与分支路径。
2. **执行要求**：目标、适用约束、需要覆盖的评审维度和验证白名单。
3. **报告要求**：归档路径、报告格式、finding 证据和严重度要求。
4. **退出条件**：前置不成立、鉴权失败、基线债阻断或所有产出落盘后的标准总结。

不要把大段源码或文档正文内联到 prompt。需要查大文档时，先用
`rg -n "关键词" <file>` 定位，再用 `sed -n '起始,结束p' <file>` 读取必要片段。
事实性环境信息可以写入 prompt；主 agent 的判断性自测结论不能写入 prompt。

reviewer 最终回复必须是可直接复制的标准化摘要，包含报告路径、结论和
BLOCKER/HIGH/MEDIUM/LOW/NOTE 数量，长度不超过 200 字，不复读报告正文。

## 3. 验证白名单与基线债

Coder 自测和 reviewer 回归都只运行 prompt 中明确列出的白名单命令：

- Maven 后端优先使用 `-pl <受影响模块> -am` 缩小 reactor；
- Surefire 的多个测试类使用逗号分隔，例如 `-Dtest=FooTest,BarTest`，禁止用
  `+` 连接导致空跑假绿；
- 不因“顺便回归”而扩大到未改动模块、无关测试或未批准的接口链路。

如果白名单命令暴露了与本次变更无关的基线问题（例如测试引用已删除类导致
compile 失败），立即停止扩大验证，报告：命令、失败证据、是否属于基线、受影响
范围和未验证项。只有主 agent 或用户明确授权后才可扩大范围；不得用临时
classpath、Launcher、改配置或关闭鉴权绕过基线债。

## 4. Codex 断流兜底

- 单次 Codex 请求最多重试 2 次；达到上限仍断流时，标记为“未完成（断流）”，不要死等或重试 10 轮。
- 同一子任务连续两次断流，直接切换 `zcode` 接跑，并在主 agent 记录中说明替补关系。
- 切换 reviewer 不改变双盲、只读、归档、脱敏和鉴权约束。

## 5. Commit 节奏

一轮方案评审、编码交付或 QA 闭环最多 5 个 commit。超过上限时先合并同类
文档/规则变更或暂停扩展范围，由主 agent 与用户决定是否拆轮；reviewer 不得
自行 commit。

## 6. 证据与报告

每条 finding 必须给出客观依据：源码 `file:line` 片段、命令输出、可复现输入输出、
或方案/配置的明确章节与反例。Java 规则 finding 还要标出对应规则编号。
无法验证的内容写成 NOTE，不用猜测填充结论。

所有 reviewer 产出遵守 `references/archive-and-blind.md` 的
`.<reviewer>/<slug>/reviewer/<YYYY-MM-DD>/` 路径和“仅主仓”规则。
