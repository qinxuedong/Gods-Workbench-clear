# 任务书 I：HEAD=714414a 变更集独立代码审查（只读、对抗式）

## 角色
独立 Code Reviewer（对抗式）。**只读**：严禁 git 写操作，严禁修改/创建/删除仓库内任何文件。

## 基线
仓库：D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear
HEAD = 714414a9aa5665f65c576809698ff387971f91ef（= origin/master）
审查范围：git diff 482709b..714414a（10 文件；Phase 9T 前端分项显式降级修复 + Tailwind CDN 插件版本钉死）

先亲跑并贴原始输出：git rev-parse HEAD / git status --porcelain=v1 -uall / git diff --stat 482709b..714414a

## 必查点（每条给 文件:行号 + 可复现命令）
1. src/gods_workbench/static/js/task-center.js：degradeKind / degradeLabel / pushDegraded 是否真的「按条目分 kind」；`data-gw-degradation` 是否逐条正确（重点：同一页面 404 与 503 混装时是否串味）。
2. src/gods_workbench/static/js/episode-pipeline.js：recordDegradation / loadWithExplicitFallback / resetDegradations 是否存在**残留静默 .catch 回落**；loadPipelines() 是否已非静默；是否存在「瞬时故障清空进行中视图并中止轮询」的附带风险。
3. 降级横幅容器 #episodeDegradation 的位置：是否在渲染容器之外但仍**可见**（被放在 #episodePipeline 之后是否被推到页面底部、需滚动才能看到）。请给出实际页面结构证据（file:line）。
4. tests/contracts/test_phase9_frontend_degradation.py：新增守卫是否为「过窄/恒真」守卫（尤其断言 `data-gw-degradation="${degradedKind}"` 字面量那条）；请用**变异法**证明守卫有效（在 %TEMP% 副本中修改实现，确认测试变红；严禁动仓库文件）。副本目录建议：C:\Users\qinxuedong\AppData\Local\Temp\gw-p9t-root\mut_i\
5. Tailwind CDN URL 钉死是否真能消除浮动解析：只读网络探测 https://cdn.tailwindcss.com/3.4.17?plugins=forms@0.5.10,container-queries@0.1.1 的状态码 / 字节数 / SHA-256，**禁止跟随重定向来推断**。
6. 是否还有其它**静默降级**或**误导性文案**残留（扫描 static/js/ 排除 vendor/）。

## 输出
按 🔴 blocker / 🟡 suggestion / 💭 nit 分级；每条给文件:行号、复现命令、影响说明。
必须单列「未覆盖项」。
报告 UTF-8 写入：C:\Users\qinxuedong\AppData\Local\Temp\gw-p9t-root\reports\REVIEW-714414a.md

## 硬约束
- 结束前再跑 git status --porcelain=v1 -uall 并贴原始输出，证明仓库未被你改动。
- 中文、简明、禁夸大；不得把本机实测写成生产验收。
