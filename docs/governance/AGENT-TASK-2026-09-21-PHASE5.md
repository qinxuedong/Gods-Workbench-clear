# Phase 5 任务书（2026-09-20/21 第四轮：可复现性与证据闭环）

> 共享任务书（主代理 /root 编写）。**Phase 5 全体代理必读**。
> 仓库唯一根：`D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear`，分支 `master`。
> 基线提交：`994b501`（本地 HEAD == `origin/master`，工作树干净，远端 CI success）。
> 上游依据：`HANDOFF-4.md` §7「未闭环」、`CLEANROOM-IMPLEMENTATION-HANDOFF.md` 阶段 5/Phase 8、
> `docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md`、
> `docs/governance/DEPLOYMENT-ACCEPTANCE-PLAN-2026-09-20.md`、`docs/governance/EXTERNAL-IDP-PLAN-2026-09-20.md`。

## 0. 本轮总原则（用户 2026-09-21 指示）

- 夜间**无人值守**推进；**凡需要用户确认才能继续的事项一律跳过**，记入报告「待用户确认」，不要停下等待、也不要自行拍板。
- 不得为了实现进度而降低证据标准；不得把未执行写成已通过。

## 0.1 硬规则（违反即作废）

1. 中文输出；遵守根 `AGENTS.md`（KISS、稳定 ID、CAS、标准错误包、端口 2077）。
2. **禁止** `git add` / `git commit` / `git push` / `git remote` / `git checkout` / `git restore` / `git reset`（主代理统一收口）。
3. **禁止**新增图片 / 音视频 / 字体（`AGENTS.md` §1.2 的 3 个思源黑体白名单除外）。
4. **禁止**读取旧仓 `D:\Working\Code Pro\Gods-Workbench-release` 的源码或提交历史。
5. **禁止**把任何真实密钥 / token / 凭据写入仓库、报告或命令行历史；测试密钥必须运行时生成。
6. **禁止**新增根级 `LICENSE` 或 `THIRD_PARTY_NOTICES.md`（`AGENTS.md` §1.4：未经独立审计与合规评估不得添加正式许可证；NOTICE 亦须用户裁决）。
7. 草稿写 `%TEMP%\gw-<任务>-20260921\`；仓库内不留临时文件、`.pyc`、日志、venv。
8. 不得把 python 脚本命名为 `re.py` / `glob.py` 等 stdlib 同名文件。
9. **证据边界**：本地通过 ≠ 远端 CI ≠ 生产验收；不得伪造任何数字或命令输出。
10. 破坏性操作一律不做；必要时写报告交用户裁决。

## 1. 本轮目标：把「可复现构建」从「本地版本锁」推进到「哈希锁 + 跨平台实测」

Phase 4 已交付版本锁与 SBOM，但 `HANDOFF-4.md` §7 明确仍缺：**哈希锁、按 lock 精确重装、Linux/容器闭包验证、SBOM 来源证明、许可证闭包**。
Phase 5 在**不需要用户确认**的范围内补齐上述证据。

| 任务 | 负责人 | 独占可写文件 | 产出报告 |
|---|---|---|---|
| P5-A1 哈希锁与按锁重装 | 代理 A1 | `requirements.lock.hashes`(新) | `docs/governance/agent-reports-2026-09-20/T-hashlock.md`(新) |
| P5-A2 Linux 闭包实测 | 代理 A2 | `docs/provenance/LINUX-CLOSURE-2026-09-21.txt`(新) | `docs/governance/agent-reports-2026-09-20/T-linux-closure.md`(新) |
| P5-A3 许可证闭包清点 | 代理 A3 | `docs/provenance/THIRD-PARTY-INVENTORY-2026-09-21.md`(新) | `docs/governance/agent-reports-2026-09-20/T-license-inventory.md`(新) |
| P5-B1 独立终审 | 审核代理 B1 | `attestations/reviews/PHASE-5-INDEPENDENT-REVIEW-2026-09-21.md`(新) | 同左 |
| 收口 | /root | `HANDOFF-5.md`、`CLEANROOM-STATUS.md`、`docs/governance/TASKS.md`、`TASK-NOTES` | — |

## 2. P5-A1：哈希锁与按锁精确重装

目标：把 `requirements.lock` 的主表升级为**哈希锁**，并**真正按锁重装**验证。

要求：
1. 生成 `requirements.lock.hashes`：对 `requirements.lock` 主表 30 个包，逐条记录 **sha256**（wheel 与/或 sdist）。
   - 推荐做法：`python -m pip download --only-binary=:all: --no-deps -d <dir> -r <lock>`，再对每个文件 `python -m hashlib` / `pip hash` 计算；也可用 `pip install --dry-run --report` 读取 `archive_info.hashes`。
   - 文件格式须为 `pip` 可消费的 `--require-hashes` 形式：`name==version --hash=sha256:<hex>`。
   - 若某包无 wheel（需 sdist），**如实登记**并说明该包无法用 `--only-binary` 完成哈希锁。
2. **按锁重装实测**：在 `%TEMP%` 新建干净 venv，执行
   `pip install --require-hashes -r requirements.lock.hashes`，原文粘贴结果。
   - 成功 → 记录并跑 `pytest`。
   - 失败 → 原文粘贴错误，如实登记「未完成」，**禁止**改写成成功。
3. 复跑全量 `python -m pytest -q --no-header -p no:cacheprovider` 并粘贴输出（当前基线 63 passed）。
4. 明确写出：哈希锁只覆盖**本机解析出的 30 个包**，**不覆盖 Linux 专有的 `uvloop`**；跨平台哈希锁仍待补齐。

## 3. P5-A2：Linux 闭包实测（真实 Linux，不是仿真）

背景：本机 WSL 已确认可用：`wsl -e bash -lc "python3.11 -V"` → **Python 3.11.15**，Node 可用，PyPI 可达（HTTP 200）。
任务：在 **WSL Ubuntu 24（glibc/Linux）**中做真实闭包与测试验证。

要求：
1. 在 WSL 内新建 venv（放 `/tmp/gw-a2-20260921/`，**不要**放仓库或 `/mnt/d` 下以免污染）：
   `python3.11 -m venv /tmp/gw-a2-20260921/venv`
2. `pip install -r requirements-dev.txt`（路径用 `/mnt/d/...` 访问仓库）。
3. 原文粘贴：`pip freeze`（**完整**）、`pip check`、以及 `python -m pytest -q --no-header -p no:cacheprovider`。
4. **重点取证**：记录 Linux 闭包**是否包含 `uvloop`**、其版本、以及 `pip freeze` 与 `requirements.lock` 主表 30 条的**差集**（哪些包 Linux 多、哪些版本不同）。
5. 结论必须明确：Linux 闭包与 Windows 快照的差异清单，以及「跨平台统一锁」还缺什么。
6. 把关键原始输出另存为 `docs/provenance/LINUX-CLOSURE-2026-09-21.txt`（纯文本、可复算、不含凭据）。

调用提示（PowerShell → WSL）：脚本用 **LF 换行** 写入 `%TEMP%`，再 `wsl -- bash /mnt/c/.../script.sh`；
注意 WSL 内 `/mnt/d/Working/Code Pro/...` 路径带空格，必须加引号。若 WSL 不可用或联网失败：原文粘贴错误并如实登记「未完成」。

## 4. P5-A3：许可证闭包清点（文档级，不新增根级 LICENSE/NOTICE）

目标：把 Phase 4 遗留的「许可证闭包不完整」推进为**逐项可核对的清点**，但**只写文档**，不建立根级许可证/通知文件。

要求：
1. 清点并逐项登记（名称 / 版本或来源 / 许可证 / 本地证据路径 / 义务）：
   - Python 运行期与测试依赖（沿用 `requirements.lock` 主表 30 条）；
   - `src/gods_workbench/static/vendor/**` 7 个文件（Source Han Sans CN ×3 / Lucide / Three.js / `css/fonts.css` / `MANIFEST.md`）；
   - `src/gods_workbench/static/prompt-registry/**`：`manifest.json`、`NOTICE.md` 与 6 个 `sources/*.json`（逐个记录声明来源与许可证，并标注「上游声明不重新授予内容权利」）；
   - 外部 CDN：Tailwind（URL 未钉死版本的供应链风险）。
2. 对每个本地文件计算 **SHA-256** 并入表，使清点可复算。
3. 生成 `docs/provenance/THIRD-PARTY-INVENTORY-2026-09-21.md`。
4. **明确列出无法闭环的项**（如上游未声明许可证、CDN 传递依赖、`davidwu-gpt-image2-prompts` 已排除等），并写明「待用户/法务裁决」。
5. 不得创建 `LICENSE` / `THIRD_PARTY_NOTICES.md`；如认为必要，只写建议并标注需用户确认。

## 5. P5-B1：独立终审（对抗式最终门）

触发条件：A1–A3 全部产出后。**不得采信任何被审代理自述。**

必须覆盖：
1. 逐条回到文件与命令取证，复核 A1/A2/A3 的每条结论；指出夸大、错数、口径不符。
2. 复跑门禁并原文粘贴：`python -m pytest -q --no-header -p no:cacheprovider`；全部 `.js` 的 `node --check`；二进制红线扫描（跳过 `.git`）。
3. **证伪式抽查 ≥3 处**：例如
   - 用 `pip hash` 或 `pip download --require-hashes` 验证 `requirements.lock.hashes` 中若干条哈希是否真实匹配；
   - 校验 `LINUX-CLOSURE-2026-09-21.txt` 中 `uvloop` 与版本差集是否与 WSL 复跑一致；
   - 校验 `THIRD-PARTY-INVENTORY-2026-09-21.md` 中的 SHA-256 是否与磁盘一致；
   - 确认未新增根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`，未改默认认证路径。
4. 复核 `git status --porcelain -uall` 与 `git diff --numstat`（对已跟踪文件的改动必须为纯追加）。
5. 明确区分：本地实测 / 远端 CI / 生产验收。
6. 判定：**可提交 / 不可提交**；是否可宣称发布或生产就绪（默认为否）。

## 6. 收口（主代理执行，禁止子代理）

1. 汇总 A1–A3 + B1，核对 `git status --porcelain -uall` 与 `git diff --numstat`。
2. 追加 `docs/governance/TASKS.md`（T16）、`docs/governance/TASK-NOTES-2026-09-18.md` 新小节、`CLEANROOM-STATUS.md`。
3. 新增 `HANDOFF-5.md`（本轮真实结论、未闭环项、待用户确认项、下一步）。
4. 逐文件 `git add`（严禁 `-A`），中文提交信息，`git push`，读回远端 CI。
5. 生产验收仍为独立决策；**待用户确认项**集中列入 `HANDOFF-5.md`，不在本轮代为决定。
