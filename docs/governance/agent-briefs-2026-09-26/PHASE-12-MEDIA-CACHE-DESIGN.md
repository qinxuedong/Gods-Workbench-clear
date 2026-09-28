# 分镜缓存删除闭环最小修复（待审核）

## 问题
真实storyboard调用extract_frame写入media_output/{asset_id}/frame_*.png；删除接口却只扫media_output/storyboards，所以新生成分镜不会被删。且现有通用删除按stem.startswith(asset_id)，asset_1会命中asset_10，不能证明按稳定ID精确删除。

## 方案
- 新分镜专用目录media_output/storyboards/{asset_id}/；extract_frame共享实际抽帧内部函数，公共单帧仍留在原media_output/{asset_id}。分镜路径包含时间戳索引，返回output_name仍为相对数据根。
- 删除storyboards对每个ID校验安全单段及resolve后位于预期目录，只枚举该目录下本模块生成的frame_*.png普通文件，不递归、不跟随符号链接、不删除视频/单帧/其他资产。返回准确removed及幂等重复0。未知ID空集合不伪报删除。
- 旧布局中的frame可能来自单帧预览，无法证明归属；保留，不盲目清理，明确legacy_shared_frames_preserved，不宣称已清完旧格式缓存。
- 缩略图既有命名stem.jpg.png的兼容删除改精确stem匹配，不再前缀匹配，保留pic与pic2彼此隔离。相同文件名跨根覆盖是另一归属问题，先要求有asset_id时采用稳定ID生成名，缺asset_id时仅维持现有源名兼容，不称跨根匿名缓存隔离已通过。
- 验证：真实FFmpeg生成→下载分镜→删除→下载404；其他资产、同资产单帧与视频clip仍可读；重复删除0；目录穿越/链接拒绝；两前缀相似ID不互删；黄金/卫生/全量与独立审核。
