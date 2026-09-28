# 分享读回及访问边界修复方案（待独立审核）

## 当前源码证据，不作为最终缺陷验收替代
- asset_review/repository.py公共评论/审批持久记录session_id恒None；public_access的资产来自_resolve_assets，comments/approvals恒空数组。故公共写入后重新进入分享无法读回，私有审查也不关联。
- expires_at创建时只保存，public_meta/access/comment/approval未检验时间；前端asset-review.js真实提交Date.now()+days*86400000。
- _enforce_rate修改state().read()副本，副本未写回，连续请求计数无法累积。
- 公共分享返回受登录认证保护的注册表media_url；无登录访客不能真实预览/下载。前端下载还直接追加&download=true，原URL没有问号。
- 不据此声称全部A3无效；已存在的哈希令牌/口令验证/次数限制/基础落盘应保留。

## 最小修复提案
1. share创建允许可选session_id，由私有审查前端携带；若提供须真实存在且关联素材匹配。所选资产必须真实登记；不再用不存在资产ID假夹具。旧无绑定分享保持可访问，但不把访客写入附到任意同资产的其他会话。
2. 公共评论/审批在同一次state.mutate内重新检查当前票据、分享有效期、权限及asset_id属于分享。写入保存share_id、asset_id、可选session_id。public_access填充对应share/asset的真实review.comments/approvals（并兼容既有数据结构）；有显式绑定时私有session GET可读回。访客审批不自动越过私有会话状态机，只登记访客结论。
3. expires_at接受前端已有Unix毫秒正整数或带时区ISO8601，规范化存储；无期限允许null，非法400；按当前UTC在四个公共入口及媒体读取检查，到期410 SHARE_EXPIRED。max_access_count仅控制新access，不使已拿到的当前票据在达到次数时立即失效。
4. 限流独立持久事务计数，再执行业务；不能因随后业务拒绝回滚计数。键只存token哈希及操作类别，每60秒120次；超限429。保持单实例锁模型，不假称多worker限流。
5. 最小新增GET /api/public/shares/{share_token}/assets/{asset_id}/media，票据只从X-Share-Ticket头读取（不进入URL）。必须核验分享、期限、票据、成员资产、can_download（显式download=true时）；复用现有注册表本地路径准入及FileResponse，不新增外网请求。
6. 前端用header带票据fetch媒体，生成blob URL供预览/下载；切换、重新验证、离页时撤销旧object URL，迟到请求丢弃。禁止票据放URL/日志/DOM展示。can_download=false只关闭直接下载功能，不承诺DRM或阻止用户复制已预览内容。
7. 保留现有单分享当前票据策略（再次access使旧票据失效）并明确文档，不在此轮引入访客会话系统。若审核认为会影响既有多访客需求，应另列必要变更，不隐式扩大认证域。

## 验收门槛
- 合法资产及显式会话创建分享→公共access→中文comment/approval→再次access真实读回；私有session GET读回；重启同数据根恢复；新分享不得读到其他分享评论。
- controlled clock过期、无期限、非法时间；121次请求429与重启不清计数；错误口令等失败请求也纳入限流。
- 错票据、跨分享/跨资产、过期、未授权下载拒绝；真实PNG/MP4受控字节下载hash，响应private/no-store、nosniff，无credential URL。
- Node及浏览器实际执行分享前端加载/切换/迟到请求/失败/URL释放，不以fetch存在代替功能通过。
- 更新公开分享方法路径计数、Phase8精确基线、契约及相关测试；不扩宽错误白名单。
- 所有数据/媒体/截图在仓库外，无公网托管、商业模型或真实CLI副作用；改动后全量pytest与独立复核。
