# 任务书 H：合规/供应链与发布阻断项 只读复算

## 角色
独立合规/供应链核实代理人。**只读**：严禁 git 写操作，严禁修改/创建/删除仓库内任何文件。
脚本与输出只允许放 C:\Users\qinxuedong\AppData\Local\Temp\gw-p9t-root\ 下。

## 基线
仓库：D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear
HEAD 预期 = 714414a9aa5665f65c576809698ff387971f91ef
先贴：git rev-parse HEAD / git status --porcelain=v1 -uall

## 必须复算的项（每项给原始输出 + 命令）
1. 二进制/字体白名单：仓库内是否存在白名单以外的二进制（图片/音视频/压缩包/可执行/字体）。
   - git ls-files 后用扩展名过滤，并只列**实际命中**的路径；对比 AGENTS.md §1.2 三条思源黑体白名单。
2. 根级 LICENSE / THIRD_PARTY_NOTICES.md：git ls-files LICENSE THIRD_PARTY_NOTICES.md（贴原始空输出）。
3. Tailwind Play CDN：
   - 全站 HTML 中的 CDN URL 现状（file:line + URL 原文）。
   - 只读网络探测（**禁止跟随重定向后当作 200**）：对每个出现的 URL 单独发请求，记录 状态码 / 是否 3xx / Location / 是否含 Access-Control-Allow-Origin / 字节数 / SHA-256。
   - 判断：SRI/integrity 当前是否**可用**（依据是 上游是否提供 CORS 与稳定制品），给确定结论。
4. prompt-registry 内容权利链：sources 数量、条目总数、逐源许可声明（命令 + 原始输出）。
5. vendor/MANIFEST.md 中标记为 BLOCKED 的项（贴原文）。
6. Phase 7 合规清单（docs/provenance/CDN-SUPPLY-CHAIN-2026-09-21.md）中「已执行 / 未执行」逐条核对，指出**文档自述与实际复算不一致**之处（若有）。
7. 发布授权现状：git grep -n -F "NOT AUTHORIZED FOR PUBLIC DISTRIBUTION"（贴命中原文与文件:行）。

## 硬约束
- 不得下载/写入仓库任何文件；网络探测只做 HEAD/GET 只读请求。
- 结束前再跑 git status --porcelain=v1 -uall 并贴原始输出。
- 中文、简明；不得把「本机探测」写成「生产验收」。

## 交付
报告 UTF-8 写入：C:\Users\qinxuedong\AppData\Local\Temp\gw-p9t-root\reports\SUPPLY-CHAIN-AUDIT.md
结构：逐项 = 结论 + 原始证据 + 复算命令；末尾给「仍未闭环项」与「文档自述不符项」。
