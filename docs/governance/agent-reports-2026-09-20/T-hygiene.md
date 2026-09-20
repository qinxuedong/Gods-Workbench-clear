# T-hygiene（卫生用例收紧 + 静态层残留收口）

## 改动清单

- 收紧 tests/hygiene/test_cleanroom_hygiene.py 的静态层卫生用例：
  - 断言 comfyui-settings.html、comfyui-settings.css、comfyui-settings.js、i18n/comfyui-settings.js 与 runninghub 目录不得重现。
  - 断言保留静态页面不得引用 /static/runninghub/、comfyui-settings.html、comfyui-settings.js、comfyui-settings.css。
  - 未删除原有断言或其它用例。
- 清理 src/gods_workbench/static/js/episode-pipeline.js：移除 comfyInstances 状态、ComfyUI 实例请求/赋值、本地模型选项、ComfyUI 分支及专属文案；普通 provider 模型路径保留。
- 清理 src/gods_workbench/static/js/task-center.js：去除 runninghub 分类标记，工作流动作匹配改为通用 workflow 语义。
- 清理 src/gods_workbench/static/js/floating-dismissal.js：移除 RunningHub/ComfyUI 专属浮层选择器、匹配与注释，保留通用浮层逻辑。
- 新增本报告，并在 T-scope 台账末尾追加本任务小节。

## 命令与输出摘要

- node --check src/gods_workbench/static/js/episode-pipeline.js：退出码 0。
- node --check src/gods_workbench/static/js/task-center.js：退出码 0。
- node --check src/gods_workbench/static/js/floating-dismissal.js：退出码 0。
- 静态残留扫描：rg -n -i "/static/runninghub/|comfyui-settings\.html|comfyui-settings\.js|comfyui-settings\.css" src/gods_workbench/static --glob "*.html" --glob "*.css" --glob "*.js"：无输出。
- 三个 JS 残留扫描：episode-pipeline、task-center、floating-dismissal 均无 comfyui/comfy/runninghub 专属标记输出。
- 删除路径存在性检查：5 个目标路径均 exists=false。
- 编码检查：4 个改动源文件均 UTF-8 无 BOM、无 U+FFFD。
- 全部保留 static/**/*.js 语法检查：56 个文件，failed=0。
- git diff --check：无空白错误；Git 提示测试文件工作副本下次被 Git 写入时可能转换为 CRLF。

## 门禁结果

- 通过：3 个指定 JavaScript 文件逐个 node --check；静态层全部 56 个保留 JavaScript 文件 node --check 均通过。
- 通过：删除路径不存在、静态层指定残留引用扫描无输出、改动文件编码检查通过。
- 未执行：python -m pytest -q --no-header -p no:cacheprovider。当前环境未提供 python 命令（PowerShell 报“python 不是可识别的命令”），因此无法确认“原有 6 个用例全绿”或总通过数 >=40。

## 未完成项

- Python/pytest 全量卫生门禁未执行，待具备 Python 3.11 + pytest 的环境后复跑并记录真实输出。
- 未执行远端 CI、push、生产验收。

## 证据边界

本报告仅证明当前工作区的静态文件、指定 Node 语法检查与命令扫描结果；本地静态检查不等同于 pytest 全量通过、远端 CI 通过或生产验收。未进行 git add、commit、push、remote 或 orca 操作。
