# 产物路径与内部状态隔离修复（待审核）

## 已确定的隔离失败
受控进程仅在新临时GW_DATA_DIR里写入internal-state.json标记：readonly调用GET /api/download-output?path=internal-state.json返回200并暴露全文；GET /api/storage-files列出；editor POST /api/storage-files/delete可删除。真实team_messages数据库也位于data_root根目录（仅查源码，未读取真实文件）。不能把“在数据根内”当“可公开下载/删除的产物”。

## 最小修复建议
- 在core/storage.py提供共享的产物准入函数，仅允许数据根下四个实际产物命名空间：ai_uploads、media_output、registry_uploads、local_assets；必须是普通文件，resolve后仍处于同一命名空间，拒绝链接/目录/根JSON/SQLite/未知子目录。错误403且不回显绝对路径或内部内容。
- download-output的path与asset_id候选都经准入；storage-files只列准入产物；批量删除先完整预检所有路径再删除，避免合法+越界混合请求部分生效。不存在的合法产物仍可skip；未知命名空间拒绝。
- 不新增视频命名空间：视频产物继续走独立项目鉴权路由，不能通过通用下载绕过ACL。不得把团队消息DB、Provider配置、身份文件作为合法产物。
- 分享media沿用注册表media_file准入，不把通用下载放宽来修分享。
- 验收：只读不能导出根内部标记/伪SQLite；编辑不能删除；合法上传/缩略/转码/线上图片/本地存储仍能下载和删除；混合请求不删首项；符号链接/Junction越界拒绝；仓库外临时证据，未操作真实用户数据。
