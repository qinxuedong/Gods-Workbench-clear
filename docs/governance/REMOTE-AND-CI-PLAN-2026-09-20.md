# Remote 与 CI 执行计划（2026-09-20）

> **证据边界**：本文是远端接入与 CI 的执行计划，不代表已经执行了 remote、push、GitHub Actions 或生产验收。当前洁净仓状态仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

## 1. 已核对的只读事实

| 项目 | 事实 |
|---|---|
| release 仓路径 | `D:\Working\Code Pro\Gods-Workbench-release` |
| release 仓当前分支 | `main` |
| release 仓 HEAD | `006f3ddce51cd1c022c51f2b963f91380cee6072` |
| release 仓 remote URL | `https://github.com/qinxuedong/Gods-Workbench.git` |
| release 仓与 `origin/main` | ahead 41 / behind 0 |
| release 仓 `origin/main` SHA | `2a95a2fcec8bc1d7fa82bad33281ee733ab79e99` |
| 最近 5 条远端运行 | 已核对，均为历史 `failure`；不能作为本轮现行 CI 证据 |
| 本洁净仓分支/HEAD | `master` / `cde7433cd24e297ceeabd248365908a8da006813` |
| 本洁净仓 remote | 当前未配置；本任务未添加 remote |

release 仓当时存在未跟踪临时文件；本任务只读核对，未写入、未清理、未借用其文件。

## 2. 分支与触发策略

- 主开发分支保留 `master`；远端收口时由主代理决定是否推送为 `main`，不得在本任务内替换分支或改写历史。
- 受保护分支建议启用：PR 必须通过 CI，禁止直接强推，合并使用线性或 squash 策略并保留审查记录。
- `.github/workflows/ci.yml` 触发：`push` 到 `main`/`master`、面向 `main`/`master` 的 `pull_request`，以及手动 `workflow_dispatch`。
- CI 固定 Python 3.11，安装 `requirements-dev.txt`（其包含运行期依赖），先做依赖导入验证，再运行 `python -m pytest -q --no-header -p no:cacheprovider`，最后执行二进制白名单扫描。

## 3. 主代理待执行的精确命令序列

以下命令**仅供主代理在确认工作树、凭据和发布审批后执行**；本任务没有执行其中任何写操作：

```powershell
# 0) 在洁净仓目录执行，先确认没有误改文件
Set-Location 'D:\Working\Code Pro\Gods-Workbench-clear-all\Gods-Workbench-clear'
git status --short

# 1) 由主代理配置远端（本任务未执行）
git remote add origin https://github.com/qinxuedong/Gods-Workbench.git
git remote -v

# 2) 主代理完成审查后推送当前分支（本任务未执行）
git push -u origin master

# 3) 触发或等待 CI；若需手动触发
 gh workflow run CI --ref master

# 4) 获取最近运行并精确选择本次运行 ID
 gh run list --workflow CI --branch master --limit 5

# 5) 仅对已核对的本次运行 ID 观察结果，不要盲目重试
 gh run watch <RUN_ID> --exit-status
```

`gh run watch` 返回非零时，先读取失败步骤与日志，修复后由主代理重新审查再重跑；不得把历史失败运行写成本轮成功证据。

## 4. 失败排查

1. **依赖安装失败**：检查 Python 版本、pip 缓存和 PyPI 可达性；本地用 `python -m pip install -r requirements-dev.txt` 复现，确认锁定范围没有超出 Python 3.11。
2. **导入失败**：优先比对 `requirements.txt` 与 `src/**` 的真实第三方 import；项目内模块不加入 requirements。
3. **pytest 失败**：先单独运行失败测试，再运行完整命令；区分代码回归、夹具哈希漂移、卫生用例与环境问题，不得删测试或放宽断言。
4. **二进制扫描失败**：只允许 AGENTS.md §1.2 的 3 个精确字体路径；其余图片、音视频和字体必须移除或经治理裁决后再改白名单。
5. **远端运行状态不明**：`workflow_dispatch` 或网络超时时，将结果标为“未知”，先用 `gh run list`/`gh run view <RUN_ID> --log-failed` 读回，禁止盲目重复触发。

## 5. 回滚策略

- CI 配置回滚：由主代理在独立分支或已审查工作树中恢复到上一份已验证的 `.github/workflows/ci.yml`，再运行本地门禁；不得直接删除历史证据。
- 应用回滚：只回滚到已通过当前 CI 且有明确 SHA 的提交；回滚前记录当前 HEAD、目标 SHA 和原因，回滚后重新执行本地 `/healthz`、`/docs` 与根路径检查。
- 远端回滚：优先提交反向变更并经 PR 审查，禁止强推覆盖共享分支；本任务不执行任何远端写操作。
