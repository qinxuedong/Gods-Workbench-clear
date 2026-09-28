# Phase 12 最终本机验收报告

## 结论

**本轮授权范围的实现与本机验收完成。独立技术审核已列出的 Required 清零。**

此结论覆盖 HANDOFF 续接范围及用户明确新增的视频生成/本地渲染导出、团队消息、Provider tokens/s；不代表公开发布、商业 Provider 现场验收、真实 CLI 账户验收、真实 OIDC 身份提供商验收或多实例生产认证。发布状态仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。本轮未提交、推送或发布，保留原工作树改动。

## 一、三项新增能力

| 能力 | 实现与验收结果 | 边界 |
|---|---|---|
| 视频生成及本地渲染/导出 | 稳定job_id/202、持久幂等、主体隔离、未知提交不盲重试、取消及迟到响应防护；普通分集手选项目画布实体，预览/下载；实际FFmpeg导出并ffprobe验证H264、1280×720、30fps，刷新读回 | 远端生成适配器采用冻结协议，验收上游是受控回环HTTP，不是商业模型生成现场验收 |
| 团队消息 | 当前团队成员/治理权限、持久消息与序号、幂等及分页/增量去重、纯文本展示；Chrome75条历史→发送第76条→刷新；独立新Python进程读回；readonly读取200、发送及重放403 | 当前为纯文本消息与轮询，不含附件、已读回执或WebSocket |
| Provider tokens/s | 选定服务端Provider/model后显式发送；按上游completion_tokens÷服务端单调时钟端到端耗时计算；无合法usage为null；切换清读数，取消/加载/刷新不误发或自动重试 | 是端到端输出tokens/s，不是模型解码速度；回环协议数值不能作为商业Provider性能基准 |

## 二、原交接发现与集成收口

- 本地素材稳定ID、多允许根同名隔离、移动/删除读回及上传409不得先覆盖，均已修复并独审。
- PDF小清单白页、超过40项截断、中文/源文本保真，已通过独立解析、渲染和目视；不支持字形采用明确转义，不冒称所有Unicode字形可见。
- 模板字段/CAS、真实项目恢复、筛选游标、提示词父子持久化及同进程原子边界，已通过针对性审核。
- 项目持久真源、单调ID预留、阶段门权限/CAS/生命周期/幂等完成；owner降为readonly/reviewer后写门403，先于CAS返回。
- 后台索引有真实受控扫描、暂停/恢复/取消/重试、主体隔离、增量合并与持久提交收据；状态文件持续写失败后仍不得把已提交任务取消或重跑。
- Outbox真实本地收据投递与公平性通过；101项中前100持续失败时，独立新进程仍可处理第101项。
- 分享权限、到期/限流、媒体、评论/审批及页面epoch/Abort关闭；生命周期测试为受控pagehide/pageshow，不声称浏览器实际命中BFCache。
- CLI受管进程与登录状态解析、错误边界通过受控协议夹具验收；未操作真实Dreamina账户。
- 视频历史claim保留显式授权语义：ACL来源绑定可信项目owner，旧NULL仅真源owner本人兼容，治理显式补来源；禁止其他主体覆盖和非NULL错配刷新。迁移保留旧任务、产物、幂等及风险状态，并验证失败回滚。
- 创建、授权、执行、下载发布和产物读取仍严格核对项目真源；原任务主体在真源故障时仍可读任务状态/计费风险和取消止损，其他主体404、readonly取消403。

独立结论入口：`PHASE-12-INDEX-CLI-SHARE-CLOSURE-REVIEW.md` 的最终追加，以及该文件引用的先前PDF、素材/产物、过滤及提示词专项审核。旧报告中的Required应按后续逐项关闭记录读取，不删除历史证据。

## 三、最终全量与稳定快照

执行：`python tools/phase12_coverage_matrix.py`，内部真实运行 `python -m pytest -v`。

- **904 passed / 8 skipped / 3 warnings，172.21秒，退出码0。**
- 工作树全部Git可见文件运行前后哈希一致，`stable_snapshot=true`：
  `6cc92191bc33cccb2a69c0b2cb49ad9346b00d611e525704b1991690681c1d9f`
- 矩阵：`C:\Users\qinxuedong\AppData\Local\Temp\phase12-coverage-cd412584f1044987b9e18c92e5c4b33e.json`
- 完整日志：同名 `.txt`。测试后新增的本最终报告及审核/队列更新是文档收口，不用这些文档改写代码验收哈希。
- 黄金夹具与洁净室卫生均通过；另行专项46通过。20个本轮变动JS/MJS语法检查全部通过；媒体生命周期Node4通过。
- 8个跳过为7个真实OIDC/IdP现场用例和1个Windows文件symlink权限用例；真实Windows Junction用例已执行。跳过不计为通过。
- 3个警告为既有Pydantic属性提示与两个websockets弃用提示；不是失败，也没有据此升级第三方依赖。

### 操作覆盖口径

256个OpenAPI操作，253个有实际pytest ASGI请求，248个有2xx，共2265次请求。**2xx只是触达，不等于全部业务状态通过；前置审批/运行态/历史项目等隔离夹具不冒称公开生产创建链。**

剩余8个无2xx的操作逐项如下，不隐藏到总通过数中：

| 操作 | 本轮判定 |
|---|---|
| GET /api/asset-auth/callback | 16次302，为OIDC重定向成功语义，不要求2xx |
| POST /api/canvas-assets/download | 冻结画布排除；实测503/401/403，未声称下载已实现 |
| POST /api/canvases/assets | 冻结画布排除；实测503，未声称挂接已实现 |
| POST /api/shared-folders/import | 冻结失败关闭；实测503 |
| GET /api/shared-folders/{folder_id}/tree | 冻结失败关闭；实测404/503 |
| POST /api/asset-registry/governance/canvases/purge-expired | 既有画布排除，未执行，不计通过 |
| POST /api/canvases/{canvas_id}/workflow/export | 既有画布排除，未执行，不计通过 |
| POST /api/canvases/{canvas_id}/workflow/import | 既有画布排除，未执行，不计通过 |

视频不再属于画布排除，三项用户新增能力全部独立计入本轮实现与测试。

## 四、浏览器与实物证据

- 九页认证门禁：9页、7交互、9壳路由、8连续导航、27顶栏组合、27真实变异失败；pageerror均为空。合法HTTP创建项目并读回，不依赖生产黄金种子；结束撤销会话并核实活动会话为0。
- 最终代码同版九页报告：`C:\Users\qinxuedong\AppData\Local\Temp\gw-phase12-auth-browser-qzc2ltyn\phase12-authenticated-browser.json`，PASS；团队消息全部断言通过，结束后会话数0。
- 视频实物：`C:\Users\qinxuedong\AppData\Local\Temp\gw-video-identity-remediation-20260928\test_video_generate_preview_ex0\`。此流程亦在904通过的稳定全量中重新执行。
- tokens/s浏览器：`C:\Users\qinxuedong\AppData\Local\Temp\gw-provider-browser-20260928-0328\test_provider_metrics_browser_0\`。此流程亦在稳定全量与独审中重新执行。
- 最终claim/取消独立真实local_account+回环HTTP：`C:\Users\qinxuedong\AppData\Local\Temp\gw-claim-independent-8881536b42004797836f1946965e4b3c\`。
- 截图、媒体、数据库及日志均在仓库外TEMP；未新增仓库二进制资源。

## 五、团队与后续边界

实施负责人按任务采用GPT-6-luna/max，独立审核为GPT-6-astra/high；活动子代理不超过2名。主代理负责集成、全量矩阵和最终口径核对。全部技术结论均以实际代码、测试、业务读回和独立复现为依据。

后续如需商业Provider、真实CLI账号、真实OIDC现场或公开发布，需配置与相应授权后另行验收。当前代码可按仓库既有方式运行，不因本次验收自动部署到用户已有服务或迁移真实运行数据。


## 六、最终文档收口后的源文件一致性

最终九页补跑再次PASS；前后453份非治理文件（包含源码、测试、工具、契约及夹具）与稳定全量快照完全一致。非治理文件映射摘要：
`2f7580fb2fde573998808282956cbc2b17ef908d6b8acefa9486b1519494e532`

完整验证清单：`C:\Users\qinxuedong\AppData\Local\Temp\gw-phase12-final-verification-manifest.json`。稳定全量之后仅6份治理文档收口更新，未夹带未经测试的源代码变更。独立审核已核对最终矩阵、九页证据与非治理文件一致性。
