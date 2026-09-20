# HANDOFF-5 —— 2026-09-21 Phase 5（可复现性与证据闭环）收口

> 基线：`994b501`（Phase 4 收口，已 push，远端 CI success）。
> 真源：`master` 与 `origin/master` 同源；本文件为 Phase 5 交接入口。
> 依据：根 `AGENTS.md`、`docs/governance/AGENT-TASK-2026-09-21-PHASE5.md`、`HANDOFF-4.md`。
> 状态：**本地工作树完成，尚未提交**（提交与远端 CI 由主代理在本文件之后执行）。

## 1. 本轮目标与结果

把「可复现构建」从 Phase 4 的「本地版本锁」推进到「**哈希锁 + 跨平台实测 + 许可证清点**」。

| 任务 | 负责人 | 产物 | 结果 |
|---|---|---|---|
| P5-A1 哈希锁与按锁重装 | 代理 A1 → 主代理补完 | `requirements.lock.hashes`（新）、`docs/governance/agent-reports-2026-09-20/T-hashlock.md`（新） | 完成 |
| P5-A2 Linux 闭包实测 | 代理 A2 → 主代理补完 | `docs/provenance/LINUX-CLOSURE-2026-09-21.txt`（新）、`docs/governance/agent-reports-2026-09-20/T-linux-closure.md`（新） | 完成 |
| P5-A3 许可证闭包清点 | 代理 A3 | `docs/provenance/THIRD-PARTY-INVENTORY-2026-09-21.md`（新）、`docs/governance/agent-reports-2026-09-20/T-license-inventory.md`（新） | 完成（闭环 0 项） |
| P5-B1 独立对抗式终审 | 审核代理 B1（四轮） | `attestations/reviews/PHASE-5-INDEPENDENT-REVIEW-2026-09-21.md`（新） | R1/R2 不可提交 → 修正 → R3/R4 闭合 |

## 2. 实测证据（本地 / WSL2）

### 2.1 跨平台哈希锁

- `requirements.lock.hashes`：**31 行版本、38 个 `--hash=sha256:`**，覆盖 Windows 与 Linux(manylinux x86_64)；
  `uvloop==0.22.1 ; sys_platform != "win32"` 单独一行。
- 文件全文 SHA-256：**`0527bd488dc104060b5482de1ced562376a54dafe8788bc7cc65bf2ba97e6f56`**
  （追加 PEP 263 首行声明后的当前值；追加前的旧值为 `cdf4f469a88bd45d71352335023c11721db333f85b4e86a718f93463fcb7b087`）。

### 2.2 按锁精确重装（双平台）

| 平台 | 解释器 / pip | 结果 |
|---|---|---|
| Windows（cp936 区域设置） | CPython 3.11.9 / pip 24.0（新建 venv） | 安装成功（30 包，`uvloop` 按标记跳过）；`pip check` 通过；`pytest` **63 passed** |
| Linux（WSL2 Ubuntu 24.04.4） | CPython 3.11.15 / pip 24.0（新建 venv） | 安装成功；`import uvloop` → **0.22.1**；`pip check` 通过；`pytest` **63 passed** |

- 篡改实验：修改任一哈希 → `THESE PACKAGES DO NOT MATCH THE HASHES` 硬失败（哈希强制校验真实生效）。
- 差集：**仅 `+uvloop`（Linux）/ `−colorama`（Windows）**，其余 29 条版本完全一致。

### 2.3 许可证清点

- 条目总数 **47** = Python 31 + vendor 7 + prompt-registry 8 + Tailwind CDN 1；另列排除项 1
  （`davidwu-gpt-image2-prompts`，上游无明确许可）。
- 本地资产 SHA-256：**15/15 实算**（vendor 7 + prompt-registry 8）。
- **发布义务闭环：0 项**；未创建根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`。

## 3. 独立终审发现并由主代理修复的真实缺陷（保留，不得删除）

审核代理 B1 **四轮**对抗式终审，R1/R2 均判**不可提交**，暴露出主代理先前未发现的真实缺陷：

1. **65 位错误哈希**：A3 清单把 `src/gods_workbench/static/vendor/js/three-0.160.0.module.js` 的 SHA-256
   写成 65 字符（多插入一个 `e`），长度非法。主代理复算磁盘真值（64 位）后修正两处。
2. **6 个 source 路径不可复算**：清单原写裸 `sources/*.json`，按原文路径仅 **9/15** 命中；已改为完整路径
   `src/gods_workbench/static/prompt-registry/sources/*.json`，修正后 **15/15**。
3. **cp936 下依赖清单不可解析（P0，主代理新发现）**：四个依赖文件含中文注释却无编码声明；pip 24.0 的
   `auto_decode()` 在无 BOM / 无 `coding:` 声明时回退 `locale.getpreferredencoding(False)` = cp936，
   直接 `UnicodeDecodeError`。影响：**中文 Windows 默认区域设置下按锁重装与依赖安装完全不可用**
   （A1/A2 因 `PYTHONUTF8=1` 未暴露）。修复：四个文件首行追加 `# -*- coding: utf-8 -*-`；
   修复后 Windows 与 Linux 双平台按锁重装均成功。
4. **标题计数错误**：`## 2` 实为 31 条、`## 4` 实为 8 个文件；已更正。
5. **`requirements.txt` 混入 CRLF**：`.gitattributes` 要求 `eol=lf`；已归一为 LF。

> B1 的沙箱无可用 Python（`No installed Python found!`），故其 R1–R4 的 `pytest`/`pip` 结论只能标注为
> **主代理自述证据**；B1 独立完成的是文件结构、SHA-256、行尾、路径可复算、JS 语法、二进制红线等核对。

## 4. 证据边界（必须遵守）

- **本地通过 ≠ 远端 CI ≠ 生产验收**。
- 本轮全为本地 / WSL2 证据；远端 CI 需提交后读回（见 §6）。
- WSL2 **不等于**生产容器：镜像、基础层、非 root 用户、只读根文件系统、资源限制、健康检查均未验收。
- 未覆盖 macOS / aarch64；未含 sdist 哈希；无签名与来源证明（无 SLSA / in-toto）。

## 5. 待用户确认项（本轮跳过，不代为决定）

1. **是否建立根级许可证与通知文件**（`LICENSE`、`THIRD_PARTY_NOTICES.md`）：依 `AGENTS.md` §1.4 未经独立审计
   与合规评估前不得添加；如需建立，请明确授权范围。
2. **`colorama==0.4.6` 的 SPDX 许可证**：SBOM 仅记「未提供 SPDX id；见 classifier 记录」，需上游元数据/许可证文件核实。
3. **Tailwind CDN 策略**：URL 未钉死不可变版本、无 SRI / 锁文件；需决定固定版本 + SRI / 镜像 / 许可包方案。
4. **prompt-registry 内容权利链**：六个源快照的许可证来自上游声明，**上游声明不重新授予内容权利**；
   提示词 / 图片 / 名称仍需逐来源审查（`davidwu-gpt-image2-prompts` 已排除，不得视为已许可）。
5. **字体 / JS 许可正文通知包**：Source Han Sans CN ×3（OFL-1.1）、Lucide（ISC + Feather MIT）、Three.js（MIT）
   仅有本地哈希与声明，缺完整正文 / 版权通知与上游不可变制品匹配。
6. **真实外部 IdP 接线**：`src/gods_workbench/core/oidc.py` 为**影子校验模块**，默认关闭、失败关闭、**不接线**；
   `verify_jwt` 未被任何生产路径调用。真实接线属生产变更，需用户确认。
7. **发布授权**：仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**；公开发布需独立审计与合规评估。
8. **是否将 `requirements.lock.hashes` 更名或纳入 CI 门禁**：本轮未改 CI 工作流（避免越权变更 CI 语义）。

## 6. 下一步（主代理执行）

1. 逐文件 `git add`（**严禁 `git add -A`**）：`requirements.txt`、`requirements-dev.txt`、`requirements.lock`、
   `requirements.lock.hashes`、`docs/governance/AGENT-TASK-2026-09-21-PHASE5.md`、
   `docs/governance/agent-reports-2026-09-20/T-hashlock.md`、`T-linux-closure.md`、`T-license-inventory.md`、
   `docs/provenance/LINUX-CLOSURE-2026-09-21.txt`、`docs/provenance/THIRD-PARTY-INVENTORY-2026-09-21.md`、
   `attestations/reviews/PHASE-5-INDEPENDENT-REVIEW-2026-09-21.md`、`docs/governance/TASKS.md`、
   `docs/governance/TASK-NOTES-2026-09-18.md`、`CLEANROOM-STATUS.md`、`HANDOFF-5.md`。
2. 中文提交信息；`git push`；`gh run list --workflow CI --branch master` 读回远端 CI 结果。
3. 生产验收为**独立决策**，不得由本地或 CI 通过推定完成。

## 7. 边界重申

- 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**；字体白名单放行 ≠ 分发授权。
- 未闭环：真实外部 IdP、许可证义务闭合、SBOM 签名 / 来源证明、macOS / aarch64、生产容器部署与验收。
