# T-v2 前端残留清理报告

## 改动清单

- src/gods_workbench/static/v2/index.html
  - 将“生图引擎服务端点 (ComfyUI / FLUX API)”改为“生图引擎服务端点 (FLUX API)”。
  - 清空 ComfyUI 默认端口输入值 http://127.0.0.1:8188，保留输入控件及布局。
- src/gods_workbench/static/v2/production.html
  - 将 COMFYUI FLOW #04 改为中性标签 SHOT FLOW #04。
- src/gods_workbench/static/v2/agents.html
  - 将“ComfyUI 生图集群调度 (gpu.dispatch)”中性化为“生图集群调度 (gpu.dispatch)”，保留复选框布局。
- 按任务要求保留 V2 其它页面与控制器；未改动 CSS 或其它 JS。

## 命令与输出摘要

1. 定点替换脚本：使用 Node.js 按 UTF-8 字节精确替换，三处目标均各命中 1 次并写回成功。
2. 残留与编码复核：Node.js 输出如下：

   ~~~
   {"file":"src/gods_workbench/static/v2/index.html","comfyui":0,"runninghub":0,"bom":false,"replacement":0}
   {"file":"src/gods_workbench/static/v2/production.html","comfyui":0,"runninghub":0,"bom":false,"replacement":0}
   {"file":"src/gods_workbench/static/v2/agents.html","comfyui":0,"runninghub":0,"bom":false,"replacement":0}
   ~~~

3. pytest -v：未执行；当前环境未找到 pytest 命令（PowerShell 报“不是可识别的命令”）。
4. Git 提交、推送、远端 CI、生产验收：未执行。

## 残留计数复核

| 文件 | comfyui（不区分大小写） | runninghub（不区分大小写） | U+FEFF | U+FFFD |
|---|---:|---:|---:|---:|
| v2/index.html | 0 | 0 | 0 | 0 |
| v2/production.html | 0 | 0 | 0 | 0 |
| v2/agents.html | 0 | 0 | 0 | 0 |

## 未完成项

- 自动化测试门禁未执行：环境缺少可调用的 pytest。
- 未进行浏览器运行时交互验证、远端 CI 或生产验收。

## 证据边界

- 以上结论来自当前工作区三个指定 HTML 文件的字节级定点修改与 Node.js 文本/编码复核，仅证明静态文件中目标残留计数为零。
- 静态计数不等同于浏览器运行时或后端行为验收；测试、CI、部署与生产验收均未执行。
- 当前工作区存在任务开始前的其它未提交改动；本报告仅记录本 T-v2 指定文件中的目标行处理，不将其它改动归因于本任务。
