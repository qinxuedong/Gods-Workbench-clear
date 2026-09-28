# CLI协议与登录状态闭环方案（待独立审核）

## 当前证据
- 仅执行本机官方dreamina.exe的`-h`、`login -h`、`user_credit -h`，均退出0；未执行真实登录/登出/余额查询/生成，未读取凭据。
- 官方帮助明确余额为`user_credit`而非`credit`；普通`login`输出OAuth Device Flow授权材料并等待用户完成；headless模式须后续checklogin，故不能把headless退出0当登录成功。
- 当前同步subprocess.run完成后仍返回running=true，status固定false，无法闭环；原始stdout/stderr和任意首个URL回显存在凭据暴露风险。
- 本轮已修复非零退出/超时503及受控错误字段被ErrorDetail丢弃的问题。CLI边界7项通过，尚非完整协议验收。

## 最小修订
1. 保留已有HTTP路径；Dreamina唯一准入候选为dreamina（不将不明jimeng/antigravity命令视为同一官方协议）。余额固定user_credit；所有请求argv不接纳用户命令文本。
2. 普通login后台Popen（非headless，不自动重登），单进程唯一控制器+锁；重复start返回同一在途观察，绝不重复启动。启动返回200仅表示启动/观察，不表示已登录；returncode允许null。
3. 读线程流式消费stdout/stderr合并的有限输出，只提取明确命名的verification_uri与user_code，不保存/回显device_code/token/cookie或原始输出；授权地址仅允许HTTPS、无凭据/fragment/query，前端明确作为链接而非二维码图片。无法识别输出则显示“CLI输出格式无法识别，请在本机终端完成登录”，不伪造URL。
4. 只有普通login进程真实退出0才记录logged_in=true（last_operation观察，不代表持续在线）；非零仅表示操作失败，logged_in=null/result_unknown=true；超时/输出超限/进程意外失败同样null+result_unknown=true，终止并回收子进程，不重试。五分钟上限及64KiB输出限额。应用退出时关闭受管子进程；多worker不支持本机共享CLI控制，必须明确单进程边界。
5. status只读本应用本进程最后操作观测，不调用未知CLI status、不读取外部OAuth文件；初始/重启logged_in=null，running=false，state=unknown。附state、observed_at、source=last_operation；成功logout记false，失败记unknown。另一终端更改凭据不在观测能力内，UI明确标示。
6. 本机CLI账号是共享机器状态，login/logout及余额限定治理角色；帮助保持编辑权限。控制器保存发起方稳定主体hash（不存凭据），其他主体不得获取授权链接或user_code；新主体对在途登录返回409。所有含登录材料的响应no-store，错误不含原始CLI输出。logout在登录运行中拒绝409，禁止隐式取消后自动登出。
7. 前端显式确认“修改服务器本机CLI登录”；按钮busy防重、轮询串行、结束/离页清理计时器，离页仅停止等待不隐式取消。状态unknown/失败不得展示成未登录或已登录；query余额仅显式按钮触发，不自动付费调用。

## 验证
- 所有执行验收使用仓库外Python受控可执行夹具（含授权提示、延迟、成功、失败、输出限制），绝不触发真实账户变更。HTTP权限、同主体幂等、异主体隔离、超时/失败/终止回收、重启unknown、日志脱敏及前端真实函数验证。
- 文档同步精确契约，不扩宽状态码白名单；全量pytest、黄金/卫生及独立审核后才收口。

## 审核后执行条件
按PHASE-12-SHARE-CLI-MEDIA-DESIGN-REVIEW.md C1–C3执行：非零登录不能推导已退出；逐执行代次、实际字节上限、主动超时/回收、终态清材料、异主体status拒绝及Windows隐藏进程均为Required。
