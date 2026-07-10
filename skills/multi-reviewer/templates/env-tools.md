# 开发环境与工具链(项目级实例骨架)

> 本文件是 **占位符骨架**。`init.mjs` 会把它复制到 `<repo>/.claude/rules/env-tools.md`,
> 由项目 author / 主 agent 与用户对话填具体编译/启动/调试的工具链命令。
> 这是当前工作区的具体实例文件,与 skill 的框架文件解耦。

- 版本:v1.0(项目自填)
- 性质:**当前工作区具体实例文件** — 仅描述当前 `<primary-repo>` 与 `<secondary-repo>`(若有)的本地构建/运行链路
- 上位规则:无强制;本文件是主 agent 编码 / 自测 / 集成测试,以及 reviewer 跑回归命令的具体环境参考

## 1. 主仓({{后端 / 服务端}})

### 1.1 语言/版本要求

- 语言:`{{Java 8 / Java 17 / Node 18 / Go 1.21 / Python 3.11 / ...}}`
- 关键依赖版本约束:`{{有就写,例:JDK 8 强制(Lombok 老版本与 17+ 不兼容)}}`
- IDE 设置:`{{有就写,例:IDEA Project Structure 把 SDK 指向 JDK 8}}`

### 1.2 包/构建工具

- 工具:`{{Maven 3.9 / Gradle 8 / npm 10 / pnpm 9 / cargo / ...}}`
- 路径:`{{D:\apache-maven-3.9.9 / 全局可达}}`
- 本地仓库 / 缓存:`{{C:\Users\xxx\.m2\repository / ~/.gradle / ...}}`(**禁止**作为清理目标)

### 1.3 便捷脚本(若有)

`{{脚本名,例:mvn-jdk8.ps1}}`

- 位置:`{{<repo>/.claude/scripts/...}}`
- 行为:`{{描述,例:setlocal/Process scope 隔离环境变量;自动检测 D:\jdk-8\jdk1.8.0_*;校验 java -version;透传参数给 mvn}}`
- 示例:
  ```{{powershell / bash}}
  {{脚本调用示例 1}}

  {{脚本调用示例 2}}
  ```

### 1.4 本地启动主仓的前提

- 网络:`{{能连通公司内网 / 能访问 X.Y.Z.W:port}}`
- 端口:`{{8080 / 3000 / ...}}` 空闲
- 凭据:见 `auth.md`
- 其他依赖服务:`{{有就列}}`

profile 默认加载:`{{描述加载方式,例:application.yml 里写的那一串,无需手动传 --spring.profiles.active}}`

## 2. 副仓({{客户端 / CLI / 前端}})

### 2.1 基础环境

- 语言/版本:`{{Node 18+ / Bun / Deno / ...}}`
- 包管理:`{{npm / bun / pnpm / yarn}}`(若 lock 多种共存,说明优先级)

### 2.2 类型检查 / Lint

```bash
cd <secondary-repo> && {{npx tsc --noEmit -p tsconfig.json / bun run typecheck / ...}}
```

EXIT=0 说明静态类型通过,**不代表**运行时可用。真实执行要:

### 2.3 本地跑客户端命令

```bash
# 确保凭据已存在
ls {{凭据文件路径}}

# 走默认环境(test profile / dev profile / ...)
cd <secondary-repo>
{{构建命令,例:npm run build}}
{{运行命令,例:node ./dist/cli.js <module> +<command>}}
```

环境切换:`{{环境变量,例:DEPLOY_ENV=prod}}` 切到生产配置,默认是 test。

### 2.4 鉴权

见 [auth.md](./auth.md)。{{凭据如何被注入}}

## 3. 常见踩坑

| 症状 | 原因 | 解法 |
|---|---|---|
| `{{典型错误 1}}` | `{{原因 1}}` | `{{解法 1}}` |
| 端口占用(`Port {{PORT}} already in use`) | 上次启动没 kill | `netstat -ano \| grep :{{PORT}}` 找 PID → `taskkill /PID xxx /F` (Win) / `kill <pid>` (Unix) |
| `.env` 没加载 / 环境变量空 | shell 不识别相应语法 | 用对应平台的 .env 解析(见 auth.md) |
| 类型检查挂住没反应 | 可能在索引 node_modules,或被病毒扫描 | 等一会,或加 `--diagnostics` 看卡在哪 |
| 单测挂 `No tests were executed!` | `-Dtest=X` 在 `-am` 模式下子模块没该类 | 加 `-DfailIfNoTests=false` |

## 4. 主 agent / reviewer 通用命令速查

```bash
# 跑后端单测
{{后端单测命令模板}}

# 跑后端模块编译
{{后端模块编译命令}}

# 启动后端
{{后端启动命令(完整 + skip tests)}}

# 启动客户端联调(用 fetch hijack,见 multi-repo.md §3)
{{客户端启动命令}}
```

## 版本记录

- v1.0 (YYYY-MM-DD):项目首次填写
