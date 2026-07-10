# 鉴权(项目级实例骨架)

> 本文件是 **占位符骨架**。`init.mjs` 会把它复制到 `<repo>/.claude/rules/auth.md`,
> 由项目 author / 主 agent 与用户对话填具体凭据机制(<REDACTED> / JWT / OAuth / Cookie / Custom Token / ...)。
> 这是当前工作区的具体实例文件,与 skill 的框架文件解耦。

- 版本:v1.0(项目自填)
- 性质:**当前工作区具体实例文件** — 仅描述当前 `<primary-repo>` = `{{项目名}}` 这一项目的鉴权链路
- 适用:{{项目名}} 后端的所有 HTTP 接口调用(本地 / 测试环境 / 生产)
- 上位规则:`<skill-path>/references/hard-constraints.md` §7"鉴权失败时不硬跑"

## 1. 机制概述

{{项目名}} 的鉴权机制 = {{<REDACTED> / JWT Bearer / Cookie Session / Custom Header / OAuth2.0 / ...}}。

具体流程:

1. {{发起方在请求头加 X-XXX 头 / Cookie / Authorization Bearer / ...}}
2. 后端 {{Filter / Interceptor / Middleware}} 的 `{{ClassName}}` 拦截
3. 调 {{鉴权 SDK / 鉴权服务 / Custom 检查}} 验证
4. 校验通过后 {{包装请求 / 注入身份 / 设置 ThreadLocal}} 让业务代码可获取身份

> 关键文件位置(自填):
> - 鉴权 Filter:`{{src/.../XxxAuthFilter.java}}`
> - 配置项(白名单 / 跳过路径):`{{application-*.yml 的 xxx 字段}}`

## 2. 凭据来源

**禁止**把 token 值、响应里的真实姓名 / 工号 / 邮箱写到报告、提交记录或外发消息。

| 字段 | 对应 HTTP 头 / Cookie | 获取方式 |
|---|---|---|
| `{{ENV_VAR_1}}` | `{{X-XXX-Sid}}` | {{从 .env / 登录返回 / OAuth flow}} |
| `{{ENV_VAR_2}}` | `{{X-XXX-Token}}` | {{...}} |
| ... | ... | ... |

凭据文件位置:`{{<secondary-repo>/.env / ~/.config/{project}/credentials / ...}}`(已 gitignore)

## 3. 选哪个 URL

| 环境 | 基地址 | 适用场景 |
|---|---|---|
| 本地 | `{{http://localhost:8080}}` | 验证未部署的新代码;本地调试 |
| 测试环境 | `{{https://xxx.test.example.com}}` | 验证已部署的测试代码;真实数据调用 |
| 生产 | `{{https://xxx.example.com}}` | **仅在明确任务要求时**,默认不动生产 |

## 4. Bash 模板(复制粘贴即可)

```bash
# 1) 载入 .env 到环境变量
set -a
. "{{凭据文件路径,例:./.env}}"
set +a

# 2) 自检:必须先打 /me 或同等握手接口,返回 200 才能继续
curl -sS --max-time 30 \
  -X POST "{{基地址}}/{{握手端点,例:api/v1/auth/me}}" \
  -H "Content-Type: application/json" \
  -H "{{X-XXX-Sid}}: ${{ENV_VAR_1}}" \
  -H "{{X-XXX-Token}}: ${{ENV_VAR_2}}" \
  -d '{}'

# 3) 打业务接口示例
curl -sS --max-time 45 \
  -X POST "{{基地址}}/{{业务端点}}" \
  -H "Content-Type: application/json" \
  -H "{{X-XXX-Sid}}: ${{ENV_VAR_1}}" \
  -H "{{X-XXX-Token}}: ${{ENV_VAR_2}}" \
  -d '{}'
```

## 5. PowerShell 模板

```powershell
# 1) 载入 .env(PowerShell 不识别 set -a,用正则解析)
Get-Content "{{凭据文件路径}}" | ForEach-Object {
  if ($_ -match '^\s*([^#=]+?)\s*=\s*"?([^"]*)"?\s*$') {
    [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
  }
}

# 2) 自检:打握手端点
$headers = @{
  "Content-Type" = "application/json"
  "{{X-XXX-Sid}}"    = $env:{{ENV_VAR_1}}
  "{{X-XXX-Token}}"  = $env:{{ENV_VAR_2}}
}
Invoke-RestMethod -Uri "{{基地址}}/{{握手端点}}" `
  -Method POST -Headers $headers -Body '{}' | ConvertTo-Json -Depth 5
```

## 6. 鉴权失败排错表

| 现象 | 可能原因 | 处置 |
|---|---|---|
| HTTP 401 / 鉴权失败 | 凭据未带 / 带错 | 检查 header 名大小写;`echo $XXX` 确认已加载 |
| HTTP 401,凭据已加载 | token 过期 | 联系凭据持有者重新登录;**不要自己构造 token** |
| HTTP 403 不在白名单 | 鉴权机制启用且当前身份不在白名单 | 看相关配置;报告标 NOTE |
| HTTP 302 / 返回登录页 HTML | 没命中目标 Filter,落到老鉴权链路 | 确认带了对应头;确认 URL 前缀 |
| 连接超时 / 拒绝 | 本地未起 / 测试环境内网不通 | 本地:确认服务启动完成;测试环境:确认已接公司内网 |
| CORS / HTTPS 错误 | 误用了浏览器 / 代理 | 用 curl 或 Invoke-RestMethod,不走浏览器 |

## 7. 硬规则

1. **所有**对后端的请求必须带正确凭据,缺一不可
2. **不要**尝试绕过鉴权(修配置、关 aegis、加白名单、伪造 token)
3. 如果鉴权跑不通,在任务报告里**标"未验证(鉴权失败 + 原因)"**,不要继续硬跑
4. **禁止**把 token 值、响应里的真实姓名 / 工号 / 邮箱写进任何产出

## 版本记录

- v1.0 (YYYY-MM-DD):项目首次填写
