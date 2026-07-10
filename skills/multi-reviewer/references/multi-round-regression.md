---
name: multi-round-regression
description: 同一需求多轮交叉验证时,主 agent 怎么沉淀本需求的 case 文件、怎么把前轮 case 塞进新轮 prompt 让 reviewer 带先验工作、怎么判定 case 闭环;通用化到 N reviewer(默认 N=2,可配置 1-26),核心目的:防止 context 增长/截断后同一类盲点重复出现
version: 1.2.0
---

# 多轮回归协议

> 上位文件:`SKILL.md`(索引);本文件适用同一需求 ≥ 2 轮交叉验证的场景。
>
> 核心目的:让主 agent 在某个**特定项目的某次需求**多轮交互中**变聪明**——前一轮 reviewer 抓到的差异化盲点,沉淀为本需求自己的 case 档案;下一轮回归时把这些 case 塞进 prompt,reviewer 拿到先验、不用从零白板看,既减少同源盲点重复,也规避 context 增长后的"健忘"。

---

## 1. 何时算"多轮"?

任一条件成立 → 进入多轮回归协议:

- 同一个需求(同一份 `requirement.md` / 同一个 feature 分支)做过 ≥ 1 次交叉验证(模式 A 或 模式 B)
- 用户改了方案后要重新走一次模式 B(方案修订 → 再评审)
- 第一轮回归后修了部分 finding,要再走模式 A 验证修复结果
- 跨多日的需求,每次新增改动后都要回归

如果是**完全独立的新需求**,不进入多轮协议(case 不跨需求迁移,详见 §6)。

---

## 2. case 文件落哪里

**项目本地,不入 skill 仓**:

```
<repo>/.claude/<slug>/<YYYY-MM-DD>/case-studies/
  ├── round-1-001-{key}.md     ← 第 1 轮发现的第 1 个差异化盲点
  ├── round-1-002-{key}.md
  ├── round-2-003-{key}.md     ← 第 2 轮发现的新盲点
  └── ...
```

命名规则:`round-{轮次}-{自增编号 3 位}-{关键字 kebab-case}.md`

`<key>` 是该 case 的关键字(例:`sql-字段漂移` / `跨服务时序` / `auth-绕过`),便于扫一眼目录就懂。

> 跨多仓需求:每个相关仓都各写一份(内容相同),与 `archive-and-blind.md` 的归档镜像规则保持一致。

---

## 3. 什么 finding 该沉淀为 case?

**沉淀**(标准:**差异化** + **可迁移**):

- 主 agent 自测 / 方案里**漏了**,任一 reviewer 抓到的
- N 份 reviewer 报告中**部分抓到、其他没抓到**的(差异化的活样本;N=2 时即"一方抓到一方漏",N≥3 时即"少数 reviewer 抓到")
- 修复后**容易复发**的(根因没消除,只在本次绕过)
- 暴露了主 agent 思维盲区的(同源思维 / 经验缺口 / context 太长导致的健忘)

**不沉淀**(背景噪声):

- 主 agent + 所有 N 个 reviewer 都抓到的(不差异化)
- 纯命名 / 注释 / 文档级 LOW 问题(无可迁移规则)
- 一次性环境问题(网络抖动 / 凭据过期)
- 需求理解分歧而非盲点(产品决策类)

> 数量上:大致 1 轮回归 沉淀 0-3 条 case 即可。**质重于量**——case 太多反而稀释下轮 prompt 信号。

---

## 4. case 怎么进入下一轮 prompt

**对称**下发给所有 N 个 reviewer(reviewer-a / reviewer-b / reviewer-c / ...,内容字面级一致)。这是双盲不破的前提:N 路对称,任一 reviewer 拿到的"前轮已知盲点"段必须完全相同,不能透露"是哪一个 reviewer 在前轮抓到的"。

主 agent 在生成第 N+1 轮 prompt 时:

```markdown
## 前轮已知盲点(本需求历史 case 摘要)

> 本需求是第 N 轮交叉验证。前 N-1 轮已沉淀以下 case,你应该:
> 1. 重点验证下方"未闭环" + "监视中"的 case 是否本轮仍存在
> 2. 同时寻找前轮没发现的新盲点
> 3. **不要**把前轮 case 当 check 清单照抄过来——case 只是先验,不是答案

待验证 cases(reviewer 自行 Read):

- `<repo>/.claude/<slug>/<原日期>/case-studies/round-1-001-sql-字段漂移.md`(状态:监视中)
- `<repo>/.claude/<slug>/<原日期>/case-studies/round-1-003-跨服务时序.md`(状态:未闭环)
- (已闭环的 case **不要**塞)
```

**关键纪律**:

- prompt 里**只放 case 文件路径**,不嵌入 case 内容。原因:
  - prompt 不膨胀
  - reviewer 自己 Read 文件,与读其它源码一致
  - 后续修订 case 文件,reviewer 自动看到最新版
- **统一**用主 agent 的归纳语言写 case,**不区分**是哪个 reviewer 抓的——下发给任一 reviewer 时,case 文本对所有人一致,不会泄露其他 reviewer 的具体动作
- 已闭环的 case **不要**塞(浪费 reviewer 注意力)
- N≥3 时同样适用:N 份 prompt 各自的"前轮已知盲点"段字面级相同,**不能**给 reviewer-c 写"上轮 a 抓到 X"或给 reviewer-a 写"上轮 b 没抓到 Y"

---

## 5. case 状态机

每个 case 文件头部有 `status` 字段,取值:

| 状态 | 定义 | 下轮 prompt 是否塞 |
|---|---|---|
| `监视中` | 已知盲点,本轮疑似仍存在,需要 reviewer 重新核 | ✅ 塞 |
| `未闭环` | 已知盲点 + 待修但本轮未修 | ✅ 塞(reviewer 验证它仍未修复) |
| `修复中` | 已修但未验证 | ✅ 塞(本轮验证修复有效性) |
| `已闭环` | 已修复 + reviewer 验证不再复现 + 维持 ≥ 1 轮 | ❌ 不塞 |
| `误报作废` | 经裁决判定原 finding 不成立 | ❌ 不塞 |

**闭环判定**(从"修复中" → "已闭环"):
- 修复后**至少 1 轮**回归 reviewer 没再抓到 + 主 agent 复核相关代码确实修复

每轮 prompt 生成前,主 agent 先扫历史 case,把状态变化更新到 case 文件,再决定哪些塞。

---

## 6. case 不跨需求迁移

case 是**本需求的本地档案**,不要把别需求的 case 塞进当前需求 prompt。原因:
- 不同需求的代码上下文 / 业务逻辑 / 风险面不同,跨需求迁移容易失效或误导
- skill 提供的是**协议**(怎么记 / 怎么塞 / 怎么闭环),不提供**通用案例库**
- 跨需求 / 跨团队的共性知识,通过 skill 自身演进(改 references / hard-constraints)沉淀,不通过 case 迁移

如果一个 case 暴露的盲点确实是**项目级的通用规律**(例如本项目所有 SQL 都该走某种字段对照),应该:
- 保留该 case 在原需求目录(归档历史)
- 同时把规律抽到 `<repo>/.claude/rules/`(项目级规则,例如新建 `rules/sql-conventions.md`)
- 之后所有该项目的需求都自动看到 `rules/`

---

## 7. 何时不需要走多轮协议

- 第一轮交叉验证,且本轮三方一致通过 → 不会有第二轮,无 case 沉淀
- 第一轮发现的全部 finding 都被裁决为"不修(已知风险接受)" → 关闭整个交叉验证流,无 case
- 用户明确说"这个需求不再回归" → 把所有未闭环 case 标"作废",close

---

## 8. 与 brainstorming / writing-plans / 单轮模式 A/B 的关系

多轮回归协议是**叠加**在 §3 §4(模式 A/B)上的——不是替代。每轮单独看仍是一次完整的模式 A 或模式 B,只是:
- 第 N+1 轮的 prompt 比第 1 轮多一段"前轮已知盲点"
- 主 agent 在三份产出对比阶段,额外维护 case 文件状态

每轮的 reviewer 选择可以变:
- N=2 例:第 1 轮 codex+opencode,第 2 轮 codex+cursor
- N=3 例:第 1 轮 codex+opencode+cursor,第 2 轮 codex+opencode+cline(替换某一个)
- N 中途加减(例 N=2 → N=3)也可以,新加入的 reviewer 拿到本需求的 case 文件即可

但 case 文件用统一术语描述,任一 reviewer 都能看懂——case 不为某个特定 reviewer 写。

---

## 9. 反 anti-pattern

| Anti-pattern | 为什么不好 |
|---|---|
| 把所有 finding 都沉淀为 case | 信号被噪声稀释,下轮 reviewer 一份长清单,反而失焦 |
| case 写成"reviewer-X 在 round 1 抓到 Y"(具名出处) | 破坏 N 路对称;case 应该用统一语言写"Y 是已发现盲点",哪一方抓到不重要 |
| 给不同 reviewer 的 prompt 写不同 case 段 | 等于把对方动作泄露给己方,N=3 时同样禁止 |
| 已闭环的 case 仍塞下轮 prompt | 浪费 reviewer 注意力,可能让其疑虑"为什么这个还在?" |
| 跨需求 / 跨项目搬 case | 失去本地上下文,容易误导 |
| case 太长(>500 字) | 失去"快速过先验"价值;case 应短小、精确 |
| 主 agent 直接把 case 嵌入 prompt 而非给路径 | prompt 膨胀;后续修订 case 不同步 |

---

## 版本记录

- v1.2.0 (2026-06-25):v1.8.0 同步。case-studies 路径加 `<slug>/` 层级(从 `.claude/<date>/case-studies/` 改为 `.claude/<slug>/<date>/case-studies/`)
- v1.1.0 (2026-05-26):v1.4.0 同步,通用化到 N reviewer。§3 沉淀/不沉淀标准改"N 份报告中部分抓到 / 主 agent + N 个 reviewer 都抓到";§4 "对称塞给 reviewer-A/B" 改"对称下发给所有 N 个 reviewer",并加 N≥3 双盲条款;§8 跨轮 reviewer 选择加 N=3 示例;§9 anti-pattern "reviewer-A 在 round 1 抓到 X" 改 "reviewer-X(具名出处)",新增"给不同 reviewer 的 prompt 写不同 case 段"反例
- v1.0.0 (2026-05-21):首版,v1.2.0 新增 reference,服务多轮回归场景的 case 流转协议
