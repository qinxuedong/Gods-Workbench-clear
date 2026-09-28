# Phase 12｜Provider 协议证据与适配范围

- 查证日期：2026-09-27；仅公开官方协议说明，不复制任何旧仓实现。
- 目的：为本轮视频与吞吐增补契约提供可核实的外部协议依据；不证明用户已有凭据、模型可用或付费服务实测成功。

## 一、视频首个适配器：New API unified-video

已读取 New API 官方创建和查询页面：
- `https://docs.newapi.pro/zh/docs/api/ai-model/videos/createvideogeneration`
- `https://docs.newapi.pro/zh/docs/api/ai-model/videos/getvideogeneration`

协议事实：
- 创建：`POST /v1/video/generations`，JSON，Bearer 认证；字段包含 model、prompt、duration、width、height、fps、metadata，返回 task_id 与 status。
- 查询：`GET /v1/video/generations/{task_id}`，Bearer 认证；状态 queued/in_progress/completed/failed；成功响应含 url 和媒体 metadata，失败可带 error。
- 本轮明确协议名建议为 `newapi_video`；不根据模型名称自动推测不同视频协议。只支持有配置的单个适配器即可，不要求通吃所有视频供应商。
- 官方上述页面没有给出取消或幂等保证，因此本地取消仅撤销本地等待/结果发布，不能宣称远端任务已取消或费用撤销。创建超时视为结果未知，禁止自动重新提交；本地幂等键不被假定为上游幂等。
- 产物 URL 必须单独执行安全校验和有界下载，不能把上游 Bearer 自动转发给产物域。成功必须落本地并经 ffprobe 验证，再返回本地鉴权内容URL。

## 二、不采用已停用的 OpenAI Videos 服务作为当前默认实现

已读取：`https://developers.openai.com/api/reference/resources/videos/methods/create`。

该官方页明确标记历史API，说明 Sora 2 与 Videos API 于 **2026-09-24** 关闭。不能把历史页面仍在线解释为当前服务可用；因此本轮默认视频适配不绑定 OpenAI 官方 Sora 服务。这里也不推断第三方兼容网关的可用性，后者必须按自身协议和配置验证。

## 三、吞吐首个适配协议：Chat Completions

已读取 OpenAI 官方 Chat Completions 响应定义：
`https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create`

本轮只依据真实返回 `usage.completion_tokens` 计量输出token数，必须为非负整数且不是bool；缺失或异常返回不可计量。用单调时钟测量同一次HTTP请求的端到端耗时，指标明确命名为端到端输出 tokens/s，不宣称流式解码速度。上游计数可能包含推理token，UI应注明“上游报告输出token”。其它协议要单独明确适配，不以 `len(text)` 或响应字节数猜测。

## 四、版本与验收边界

上述为本日官方文档观察；实现须把方法/状态/字段映射落入本地冻结契约，并以受控HTTP测试验证。当前未读取/修改用户真实Provider凭据，未提交任何付费生成任务。测试服务成功只证明协议调用路径，真实商业服务仍需部署配置后的现场验证。
