# T-scope


## T-hygiene（2026-09-20）

- 已收紧静态层卫生用例：已删 comfyui/runninghub 文件不得重现，保留页面不得引用其已删路径。
- 已清理 episode-pipeline、task-center、floating-dismissal 中的 comfyui/runninghub 调用、分支、标记与专属浮层选择器。
- 指定 3 个 JS 的 node --check 通过；静态层全部 56 个保留 JS 的 node --check 通过；静态残留扫描与删除路径存在性检查通过。
- Python pytest 全量门禁未执行：当前环境无 python 命令；详见 T-hygiene.md。
- 证据边界：以上为当前工作区本地检查，不代表远端 CI 或生产验收。

## T-v2（2026-09-20）

- V2 前端整体保留；仅处理中性化残留：v2/index.html 的生图端点标签与默认端口、v2/production.html 的流程标签、v2/agents.html 的生图集群能力文案。
- 三个指定 HTML 文件中 comfyui / runninghub（不区分大小写）计数均为 0；Node.js 复核同时确认无 UTF-8 BOM、无 U+FFFD。
- pytest -v 未执行：当前环境未找到 pytest 命令；Git 提交、推送、远端 CI、生产验收未执行。
- 证据边界：本节仅覆盖静态文件字节级复核，不代表浏览器运行时、远端 CI 或生产验收。

## T-prov（2026-09-20）

### 改动清单

- 重写 `docs/provenance/CLEANROOM-CODE-CLASSIFICATION-2026-09-17.md`：确立四类来源口径，写入授权清单中的两个日期选择器源/目标 SHA-256，并将旧 SHA/字节/行数说明为历史快照。
- 重建 `docs/provenance/STATIC-SCOPE-REGISTRY-2026-09-20.md`：按工作树逐文件登记 `src/gods_workbench/static/**`，并单列 Git 跟踪但已删除的 comfyui/runninghub 路径。
- 在 `docs/governance/TASK-NOTES-2026-09-18.md` 末尾追加 §12.5，本节只追加不改写历史。

### 执行的命令

- `Get-Content AGENTS.md`、`Get-Content docs/governance/AGENT-TASK-2026-09-20.md`：读取工作规约与 T-scope。
- `git ls-files -- src/gods_workbench/static/**`：跟踪路径 113 条。
- `Get-ChildItem -LiteralPath src/gods_workbench/static -Recurse -File`、`Measure-Object`：工作树现存 108 个文件。
- `Get-FileHash -Algorithm SHA256`、`Get-Content ... .Count`：复核两个日期选择器哈希、字节数与行数。
- `py -m pytest -v`：已执行，但环境返回 `No installed Python found!`，因此 pytest 未运行。
- UTF-8 BOM/U+FFFD 检查：4 个本轮文件均 BOM=False、FFFD=False。

### 关键实测数字

- 静态层现存总量：108 个文件，35,024,949 字节；Git 跟踪 113 条，缺失 5 条。
- 分类汇总：① 2 / 10,385 字节；② 90 / 4,266,643 字节；③ 15 / 30,723,433 字节；④ 1 / 24,488 字节。
- `project-date-range.js`：7,811 字节、147 行，SHA-256 `3607B19926040C0F40590781451964003616AA3BC436D7E8674E055C5378A593`。
- `project-date-range.css`：2,574 字节、20 行，SHA-256 `794B0E20B8DAC4A48BD1E3ACEE1C1F4D7087B1EAC412B9F34D69DE5F0563197A`。

### 未完成项

- pytest 全量门禁未完成（环境缺少 Python）；未执行远端 CI、生产验收。
- 未执行 `git add`、`git commit`、`git push`、`git remote`。

### 证据边界

以上数字和哈希是本地工作树与授权清单的读取结果；静态登记不等同于远端 CI、发布授权或生产验收。工作树原有的其它改动未由本节覆盖或重写。
