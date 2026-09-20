# T-ci-remote：远端 CI 失败取证与根因（2026-09-20 第二轮）

> 负责人：主代理 /root（子代理通道未能交付，改由主代理直接取证）。
> 证据边界：本文件只记录**实测命令输出**；未执行 `gh workflow run`、未执行 `git push`、未做生产验收。

## 1. 结论（一句话）

**远端 CI 现在真的在运行了**（不再是「计费未启动」），本次失败是**真实缺陷**：
CI 报 `2 failed, 38 passed`，失败集中在 `tests/hygiene/test_cleanroom_hygiene.py` 的两个哈希登记用例，
**根因是哈希登记绑定在 Windows 工作树的 CRLF 行尾上，而 Linux CI 检出的是 LF 内容**。
这是**跨平台行尾绑定缺陷**，不是业务逻辑错误，也不是「任务未启动」。

## 2. 最近 run（原始输出）

```text
$ gh run list --limit 5
completed  failure  HANDOFF-2：追加推送与远端 CI 实测（push 成功；CI 因账户计费未启动）  CI  master  push  35508749903  17s  2026-09-20T12:37:19Z
completed  failure  洁净室收口：字体白名单文档纠偏、范围口径统一、comfyui/runninghub 移除、P3 标签更新与 HANDOFF-2  CI  master  push  35508682089  19s  2026-09-20T12:36:34Z
```

两次 run 的步骤结论一致：

```text
Set up job                 success
检出代码                    success
配置 Python 3.11           success
安装运行期与测试依赖         success
验证关键依赖可导入          success
运行全量测试               failure   <-- 失败点
扫描二进制白名单            skipped
```

注意：**步骤 5（依赖导入）通过、步骤 6（全量测试）执行**，说明 Python 环境与依赖安装正常；
与此前「`steps: []`、任务未启动」的计费阻塞是两个完全不同的问题。

## 3. 失败用例与断言差异（原始片段）

```text
FAILED tests/hygiene/test_cleanroom_hygiene.py::test_accepted_non_canvas_slices_match_migration_manifest
       - AssertionError: 接受迁移切片的目标哈希与来源登记不一致
FAILED tests/hygiene/test_cleanroom_hygiene.py::test_phase2_input_hashes_match_current_files
       - AssertionError: 输入哈希不匹配: docs/behavior/BEHAVIOR-SPEC-PRODUCTION-PROJECTS-HUB.md
2 failed, 38 passed, 2 warnings in 0.57s
```

Differing items（CI 侧实算 vs 登记值）：

```text
src/gods_workbench/static/v2/css/project-date-range.css
   CI(LF)= 1ca8a32367ea5402d7b60a9975ed82555ac450a231dcfeb2395f4f6775b0bf22
   登记  = 794b0e20b8dac4a48bd1e3acee1c1f4d7087b1eac412b9f34d69de5f0563197a
src/gods_workbench/static/v2/js/project-date-range.js
   CI(LF)= 1ae7a24062af580a95b54802cd95a3027db83266993f67f9f407e750d082232c
   登记  = 3607b19926040c0f40590781451964003616aa3bc436d7e8674e055c5378a593
```

## 4. 根因独立证据（主代理实测，可复算）

同一文件在两种取法下的哈希：

```text
文件: docs/behavior/BEHAVIOR-SPEC-PRODUCTION-PROJECTS-HUB.md
  Windows 工作树 raw(CRLF) = f675864e0b7bb91d1817ecaf9dc643f96f41d090a90b57b3dfa752f358cf627f   <- 登记表用的就是它
  Windows 工作树 LF       = b0765218eb8814f2332dbe346f3f1c46ce0b7c99c3753cb35aeb66cf264cf398   <- CI 实算
  git show HEAD:... (LF)  = b0765218eb8814f2332dbe346f3f1c46ce0b7c99c3753cb35aeb66cf264cf398   <- 仓库真源

文件: src/gods_workbench/static/v2/js/project-date-range.js
  Windows 工作树 raw(CRLF) = 3607b19926040c0f40590781451964003616aa3bc436d7e8674e055c5378a593   <- 迁移清单登记值
  Windows 工作树 LF       = 1ae7a24062af580a95b54802cd95a3027db83266993f67f9f407e750d082232c   <- CI 实算
  git show HEAD:... (LF)  = 1ae7a24062af580a95b54802cd95a3027db83266993f67f9f407e750d082232c
```

统计性证据：

- `git show HEAD:<file>` 对全部 224 个受跟踪文件的 blob 逐个扫描：**含 CRLF 的 blob = 0**。
  即仓库真源一直是 LF，只有 Windows 工作树按 `core.autocrlf=true` 检出成了 CRLF。
- `docs/provenance/PHASE-2-INPUT-SHA256.txt` 的 16 条登记里，**15 条**等于「工作树 CRLF 内容」哈希，
  只有 `docs/contracts/CANVAS-INTERFACE-CATALOG.yaml`（当时是 LF）1 条例外。
- `docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt` 的 2 条 `目标 SHA-256` 同样是 CRLF 哈希。

因此：**本地 Windows `40 passed` 之所以掩盖了问题，是因为登记哈希与本地工作树行尾恰好同源；
换到 Linux CI（LF 检出）立即暴露。**

## 5. 修复方向（本轮已实施）

1. **登记表改为内容规范化哈希**：`PHASE-2-INPUT-SHA256.txt` 的 16 条与迁移清单的 2 条 `目标 SHA-256`
   全部重算为「CRLF/CR 归一为 LF 后」的 SHA-256（即与仓库真源一致）。
2. **测试改为行尾无关**：`tests/hygiene/test_cleanroom_hygiene.py` 新增 `_canonical_sha256()`，
   两个哈希断言改为比较规范化后的哈希——Windows 与 Linux 检出必须得到同一结论。
3. **固化行尾规范**：新增 `.gitattributes`，`* text=auto eol=lf`，二进制类型显式标记，
   从源头消除「同一内容两种哈希」。

## 6. 本地与跨平台验证（本轮实测）

```text
Windows 工作树：  python -m pytest -q --no-header -p no:cacheprovider  ->  40 passed
全部 56 个保留 .js：node --check                                     ->  0 failures
静态层 runninghub|comfy|\.rh- 残留                                   ->  0
二进制红线：仅 3 个白名单 .otf，无其它图片/音视频/字体

LF 检出模拟（把所有文本文件归一为 LF 后再跑）：                        ->  40 passed，CRLF 文件数 0
```

## 7. 证据边界与未执行项

- **未执行**：`gh workflow run`（未触发新的远端 run）、`git push`、生产验收。
- 因此**不能**宣称「远端 CI 已通过」；当前最多可宣称「已定位并在本地/跨平台模拟下修复，待下一次远端 run 复核」。
- 历史两次 run 的失败**是代码/登记缺陷**（已修复），与本仓历史上「计费导致任务未启动」的记录不同；
  两者不可混为一谈。

---

## 远端 CI 实测结果（2026-09-20 修复后）

本节为**追加**。

### 修复前（失败）

- run `35508749903` / `35508682089`：步骤「运行全量测试」失败，`2 failed, 38 passed`。
- 失败用例：`test_accepted_non_canvas_slices_match_migration_manifest`、`test_phase2_input_hashes_match_current_files`。
- 根因：登记哈希绑定 Windows CRLF 字节，Linux 检出为 LF（CI 报错值等于 git blob LF 哈希）。

### 修复后（通过）

- 提交：`8c955e2d3072df5916758b1e462013dd7547b24b`（`master`，已 `git push`，`6a3389f..8c955e2`）。
- run `35512673637`：**completed / success**，作业「Python 3.11 tests and hygiene」16s。
- 远端实测：`40 passed, 2 warnings in 0.57s`；步骤「扫描二进制白名单」通过（允许项仅 3 个 Source Han Sans CN 字体路径）。
- 证据命令：`gh run view 35512673637 --log` / `gh run list --limit 3`。

### 边界

以上为**远端 CI**结果；**生产验收未执行**，属独立决策，不能由 CI 通过替代。仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
