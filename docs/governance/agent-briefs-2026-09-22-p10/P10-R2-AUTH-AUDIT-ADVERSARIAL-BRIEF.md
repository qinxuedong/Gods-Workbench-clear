你是只读对抗式核验代理。仓库：D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear

目标：对身份/审计/令牌绑定三项既有声明做**证伪式**抽查。不要相信文档结论，自己读源码与测试，并尝试构造反例。禁止修改/创建/删除任何文件；禁止 git 写操作；只读（如需运行测试，只运行 `python -m pytest`，不得改动源码）。

请逐项给出「成立 / 不成立 / 无法确证」+ 证据（文件:行号 + 命令 + 输出片段）：

Q1. 401 错误码字面量：`src/gods_workbench/core/errors.py` 的 UnauthorizedException、`docs/fixtures/canvas-auth-401.json`、`src/gods_workbench/core/auth.py` 中的 code 是否都为**纯 ASCII 小写 `unauthorized`**？是否存在同形字（西里尔字母/零宽空格）污染或大小写不一致？请打印每个来源的 hex 编码前 24 字节与 `isascii()` 结果作为证据。

Q2. 审计不落敏：`src/gods_workbench/core/audit.py` 的字段白名单是否真的无法写入令牌/授权码/code_verifier/state/nonce/Cookie 值？请阅读 `record_auth_event` 实现与其调用点（`api/routes_auth.py`、`core/auth.py`），指出**任何**可能把上述敏感值写入审计的路径（包括异常消息、reason 拼接、subject 传参）。若无路径，请说明你如何验证。

Q3. `azp` 校验：`src/gods_workbench/core/oidc.py` 的 `verify_authorized_party` 是否严格比对客户端自身标识（GW_OIDC_CLIENT_ID）而非 audience？是否存在 fail-open（缺失 azp 时放行）？对「多 audience 且 azp 缺失」的 id_token，本实现是接受还是拒绝？请给出代码路径与现有契约测试用例名。

Q4. 会话绝对过期：`src/gods_workbench/core/session.py` 的绝对上限是否真的不可被滑动续期绕过？给出关键代码行与对应测试。

Q5. 是否存在声明声称「已独立复核」但实际无第三方证据的情况？列出你发现的任何过度声称。

完成后运行：
orca orchestration send --subject "P10-R2身份审计核验" --outcome succeeded --body "<结论>" --from $env:ORCA_TERMINAL_HANDLE
