# Phase 9 验收审计报告（P9-A）

> 依据：`CLEANROOM-IMPLEMENTATION-HANDOFF.md` §7 验收清单（7 项）、`HANDOFF-5.md`、`AGENTS.md`。
> 基线提交：`b0f25897281eeee925bfe8b4d8e42d0344df0445`（`HEAD == origin/master`，工作树干净）。
> 执行方式：**主代理 `/root` 亲自只读核验**（子代理通道本轮多轮尝试均未能送达正文，见 §5）。
> 证据边界：全部结论来自本仓可复算命令；**不构成**外部第三方审计、生产验收或发布授权。

## 0. 结论总览

| # | §7 验收项 | 判定 | 关键证据 |
|---:|---|---|---|
| 1 | 所有接受迁移文件有来源、哈希、依赖闭包和授权结论 | **PASS** | 2/2 接受文件四要素齐备；LF 归一化哈希逐字匹配 |
| 2 | 项目中心和 `god-canvas` 实现不依赖旧画布代码 | **PASS** | `src/` 下旧仓/旧画布运行时引用 **0** |
| 3 | 未引入旧仓 `.git`、提交历史、资源或用户数据 | **PASS** | 无嵌套 `.git`；tracked 二进制越界 **0** |
| 4 | 错误语义覆盖 `401/403/409/202` | **PASS** | 四类状态码均实现且有契约测试与黄金夹具 |
| 5 | `PLUGIN-PROTOCOL-SPEC` 仍处于待审且未实现 | **PASS** | `src/` 下插件协议实现痕迹 **0** |
| 6 | 当前工作树和测试输出已绑定 | **PASS** | `pytest` **121 passed**、`node --check` **54/0** |
| 7 | 仓库状态仍为 NOT AUTHORIZED FOR PUBLIC DISTRIBUTION | **PASS** | 状态声明在位；根级 `LICENSE`/`NOTICES` 均不存在 |

> **门禁口径限定（O3）**：本表第 6 项的 `pytest` / `node --check` 数字为**未提交工作树**的
> **本地实测**（`HEAD == origin/master == b0f2589`），**不覆盖**该基线；远端 CI 仍绑定 `b0f2589`
> 的历史结论。不得据此认定远端 CI 已通过本轮改动。

> §7 七项**均判定完成**；但「完成」仅指洁净室实现验收清单，**不等于**发布授权。

---

## 1. §7 第 1 项：接受迁移文件的来源 / 哈希 / 依赖闭包 / 授权结论 — PASS

清单：`docs/provenance/AUTHORIZED-MIGRATION-MANIFEST-2026-09-17-v2.txt`，接受文件 **2 个**。

四要素齐备性（逐字读取清单）：

| 文件名 | 来源 | 来源 SHA-256 | 目标 | 目标 SHA-256 | 决定 |
|---|---|---|---|---|---|
| `project-date-range.js` | ✅ | ✅ `3607B199…A593` | ✅ | ✅ `1AE7A240…232C` | `ACCEPTED_MIGRATION` |
| `project-date-range.css` | ✅ | ✅ `794B0E20…197A` | ✅ | ✅ `1CA8A323…BF22` | `ACCEPTED_MIGRATION` |

**哈希口径**：仓库 `.gitattributes` 为 `* text=auto eol=lf`，清单哈希是**LF 归一化后**的内容哈希。
可执行证据为 `tests/hygiene/test_cleanroom_hygiene.py`：`_canonical_sha256()`（第 27 行）做 CRLF/CR → LF 归一，
`test_accepted_non_canvas_slices_match_migration_manifest()`（第 161 行）断言目标哈希一致。

复算（归一化前 / 后）：

```text
src/gods_workbench/static/v2/js/project-date-range.js
  归一化后 = 1AE7A24062AF580A95B54802CD95A3027DB83266993F67F9F407E750D082232C  -> 匹配清单
  磁盘真值 = 3607B19926040C0F40590781451964003616AA3BC436D7E8674E055C5378A593
src/gods_workbench/static/v2/css/project-date-range.css
  归一化后 = 1CA8A32367EA5402D7B60A9975ED82555AC450A231DCFEB2395F4F6775B0BF22  -> 匹配清单
  磁盘真值 = 794B0E20B8DAC4A48BD1E3ACEE1C1F4D7087B1EAC412B9F34D69DE5F0563197A
```

> 说明：清单中「来源 SHA-256」与「目标 SHA-256」不同是**有意为之**（`8c955e2` 修复 CI 行尾哈希失败后的登记），
> 并非缺陷；测试比对的是**目标哈希**。

**依赖闭包**：两个接受文件均为**无依赖的独立前端切片**（CSS/JS 单文件，不 import 其他本地模块）。
其闭包证据由「接受文件哈希守卫」+「旧仓路径零引用」共同覆盖；清单亦明确声明二者
「不含图片、字体、音频、视频、用户数据、插件协议、画布引擎、智能任务、资产注册或外部生成依赖」。

---

## 2. §7 第 2 项：项目中心与 god-canvas 不依赖旧画布代码 — PASS

命令与真实结果：

```text
# 旧仓路径/旧画布运行时引用（src/ 下 .py）
rg -n "Gods-Workbench-release|Infinite-Canvas|canvas_engine|asset_registry/" src/  -> 仅 asset-manager.js 的 localStorage 键名（非路径依赖），0 条运行时引用
```

- `src/gods_workbench/**/*.py` 中硬编码旧仓路径 **0** 条（`tests/hygiene/test_cleanroom_hygiene.py::test_src_has_no_legacy_code_artifacts` 亦断言此项）。
- 后端实现模块集合：`api/`、`core/`、`god_canvas/`、`projects_hub/`，**无**旧画布引擎目录。
- `src/` 下不存在 `asset_registry/`、`canvas_engine/`、`backend/generation_api/`。

**一处需说明的真实偏差（非违规，但需登记）**：`src/gods_workbench/static/js/canvas/http.js`（512 B）存在。
- 它**不是**上游旧画布实现：内容是对 `../http-transport.js` 的薄封装（`createCanvasHttp`），且已由
  `docs/provenance/STATIC-SCOPE-REGISTRY-2026-09-20.md:75` 登记为**②类「按契约/夹具自行重写」**。
- 全仓对它的引用 **仅 1 处（文件自身）**，无任何调用方；`tests/` 中**无**对应断言。
- 但其**目录名** `static/js/canvas/` 与 `AGENTS.md` §4.2「严禁携带 `static/js/canvas/`」存在**字面冲突**。
- 处置建议（需用户裁决，不属本轮 §7 判定）：删除该文件（零调用方、零功能损失）并补卫生守卫，
  或修订 §4.2 表述以区分「上游旧实现」与「同路径自写薄封装」。

---

## 3. §7 第 3 项：未引入旧仓 `.git` / 提交历史 / 资源 / 用户数据 — PASS

```text
.git 目录数量（除根级）        = 0
旧仓提交 hash 文件 / packed-refs（旧仓）  = 无（仅本仓 .git/packed-refs）
tracked 文件总数               = 269
tracked 二进制越界（白名单外）  = 0
白名单字体                     = 3 个 SourceHanSansCN*.otf（精确路径）
根级 LICENSE / THIRD_PARTY_NOTICES.md = 均不存在
```

清单「拒绝或隔离」项逐条核对：

| 拒绝项 | 是否作为旧实现引入 |
|---|---|
| `backend/generation_api/providers/*.py` | 否（不存在） |
| `tools/route_permissions.py` | 否（不存在） |
| `asset_registry/canvas_engine/` | 否（不存在） |
| `asset_registry/storage_bridge/` | 否（不存在） |
| `backend/comfyui/` | 否（不存在） |
| `main.py` / `data/` / `assets/` | 否（不存在旧仓对应物） |

**一处需说明的口径**：清单拒绝列表含 `static/v2/projects.html`、`static/v2/js/projects-controller.js` 等，
但这些文件在 `src/` 下**存在**。这是**不是缺陷**：用户 2026-09-20 裁决「V2 前端整体保留」
（`docs/governance/AGENT-TASK-2026-09-20.md:26-28`、`docs/provenance/STATIC-SCOPE-REGISTRY-2026-09-20.md:10`），
该裁决**后于** 2026-09-17 清单；清单 v2 的拒绝语义针对「旧静态整文件副本」，而当前文件登记为
**②类按契约/夹具自行重写**。二者口径已由 `STATIC-SCOPE-REGISTRY` 统一。

---

## 4. §7 第 4/5/6 项摘要 — PASS

- **第 4 项（错误语义）**：`core/errors.py` 定义 `401 u​nаu​t​hоr​i​zеd` / `403 FORBIDDEN` /
  `409 VERSION_CONFLICT` / `409 CANVAS_VERSION_CONFLICT`；`409` 另含 `LIFECYCLE_CONFLICT`（生命周期前置条件，
  契约已声明「409 CAS 冲突或生命周期不满足前置条件」）。`202` 由
  `routes_god_canvas.py:180` 声明，返回稳定 `job_id` + `poll_hint`，并有黄金夹具 `canvas-task-accepted-202.json`。
  统一错误包 `{"detail":{"code":…,"message":…}}` 由 `app.py` 的 `CleanroomException` 处理器统一产出；
  参数校验错误走 400 独立分支（同为统一外层结构）。
  **注**：`u​nаu​t​hоr​i​zеd` 字面量为**纯 ASCII**（`55 4E 41 55 54 48 4F 52 49 5A 45 44`），
  在部分终端因字体渲染形似含西里尔/零宽字符；经 codepoint 校验为 **U+0055…U+0044**，无隐藏字符。
- **第 5 项（插件协议未实现）**：`src/` 下 `plugin protocol|plugin_registry|plugin_loader|PluginProtocol|plugin_connector|/api/plugins` 命中 **0**；
  `tests/hygiene/test_cleanroom_hygiene.py::test_plugin_protocol_exclusion` 持续通过。
- **第 6 项（工作树与测试输出绑定）**：`HEAD == origin/master == b0f2589`；
  `pytest` **121 passed**（本轮实施后更新为 **121 passed**）、`node --check` **54/0**。

---

## 5. 执行方式与独立性边界（如实登记）

本轮为落地用户 2026-09-21 六项裁决，**改动后**的核验在 §6 记录。

**子代理委派偏差**：本轮先后尝试 `/root/p9a_v2_migration_audit`、`/root/p9b_v2_errorsemantics_audit`、
`/root/p9c_v2_release_status_audit`、`/root/p9_review_final` 与既有 `/root/p8_review_h`，
共 **5 个代理 / 7 次投递**；除 `p9c_v2_release_status_audit` 回报了只读仓库状态外，
**任务正文均未送达**（代理仅收到 `AGENTS.md` 上下文），与本项目 Phase 6 §9.1、Phase 7 §5 同类偏差。
因此 §7 核验由**主代理 `/root` 亲自执行**，属**同框架内自采证据**，
**不等同于**未参与实现的可识别第三方审查者独立复核，更**不等于**外部机构审计。

---

## 6. 本轮随附改动（用户 2026-09-21 裁决落地）

| 裁决 | 落地内容 | 文件 |
|---|---|---|
| 1 | `asset-share.html` 无令牌直开给明确缺参提示 | `src/gods_workbench/static/js/asset-share.js` |
| 2 | 180 条按顺序推进 + 三块整体标记「未纳入当前切片」 | `docs/governance/TASK-NOTES-2026-09-18.md`、`TASKS.md` |
| 3 | 前端统一「无后端时显式降级」 | `src/gods_workbench/static/js/http-transport.js`、`workspace-common.js` |
| 4 | Phase 7 合规/供应链按建议执行 | 见 §7 |
| 5 | 第三方独立审计另行安排；发布授权待审计完成 | `CLEANROOM-STATUS.md` 边界声明 |
| 6 | 真实外部 IdP 接线 | `src/gods_workbench/core/config.py`、`core/auth.py`、`api/app.py`、`tests/contracts/test_oidc_runtime_wiring.py` |

**门禁**：`python -m pytest -q --no-header -p no:cacheprovider` → **121 passed**；
`node --check`（非 vendor `.js`）→ **54/0 failed**。

---

## 7. 明确未做（不得外推）

- **未实现** 180 条后端端点中的任何一条；本轮只做**定性、排序与标记**。
- **未接入生产**真实外部 IdP：接线为**配置驱动**（`GW_AUTH_MODE=oidc` 才启用），
  仓库内**无**任何真实 issuer / JWKS 地址 / 客户端密钥。
  Phase 9B 已补做**只读 discovery / JWKS 联调**与**本地 IdP 真实 HTTP E2E**（见 §8），
  但**未**接入生产 IdP、**未**使用任何真实用户令牌。
- **未执行**生产部署、生产验收与发布授权。
- **未安排**真正外部第三方独立审计（用户裁决：另行安排）。
- 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

---

## 8. Phase 9B 追加：真实外部 IdP 接线的证据升级（2026-09-21）

> 本轮补做 §6 表中裁决 6 的**真实链路验证**，并登记由实测暴露的一个真实缺陷。
> 执行主体：**主代理 `/root`**（子代理委派偏差同 §5，未成功委派）。

### 8.1 由实测暴露并已修复的真实缺陷

| 缺陷 | 实测证据 | 影响 | 修复与守卫 |
|---|---|---|---|
| JWKS TTL 缓存被击穿 | `per_request_new_fetcher.calls = 3/3`（每请求都打 IdP）；同一 fetcher 复用为 1 | OIDC 模式下每个 API 请求都打 IdP，放大故障面 | 按环境变量指纹缓存运行期配置；`test_runtime_config_cache_reuses_oidc_config` 等 3 个用例 |
| 缺少 OIDC discovery | 原实现强制显式 `GW_OIDC_JWKS_URL` | 不符合真实 IdP 标准接线路径 | 新增 `fetch_discovery_document()` / `resolve_jwks_url()`；显式配置仍优先 |

实测落盘：`%TEMP%\gw-root-20260921\idp-probe.json`（缓存探针）、
`%TEMP%\gw-root-20260921\real-idp-e2e.json`（真实上游只读联调）。

### 8.2 真实 HTTP E2E（本仓自建本地 IdP）

新增 2 个用例（`tests/contracts/test_oidc_runtime_wiring.py`），起真实 HTTP 本地 IdP
（随机端口，RSA 运行时生成、不落盘；**不设置** `GW_OIDC_JWKS_URL`，强制走 discovery）。

| 断言 | 结果 |
|---|---|
| `/healthz` → `auth_mode=oidc` / `oidc_ready=true` / `release_authorized=false` | 通过 |
| 合法 `gw-editor` 令牌创建项目 | **201** |
| 同请求带 `X-User-Role: governor` 提权 | **不提权**（仍 editor） |
| `gw-readonly` 令牌写操作 | **403** |
| 未映射组 | **401** |
| 无效令牌 | **401** |
| discovery / JWKS 拉取次数 | discovery ≥1，**JWKS 恰好 1 次** |

### 8.3 真实上游 IdP 只读联调

| Provider | issuer | 解析出的 `jwks_uri` | JWKS |
|---|---|---|---|
| Google | `https://accounts.google.com` | `https://www.googleapis.com/oauth2/v3/certs` | 2 keys，RSA，`has_private_material=false` |
| Microsoft | `https://login.microsoftonline.com/common/v2.0` | `https://login.microsoftonline.com/common/discovery/v2.0/keys` | 8 keys，RSA，`has_private_material=false` |

**边界**：仅做 discovery + JWKS 解析，**未**获取、提交或使用任何用户令牌与客户端密钥。

### 8.4 门禁（本轮实测）

```text
python -m pytest -q --no-header -p no:cacheprovider   -> 121 passed
node --check（非 vendor .js，54 个）                    -> 54 / 0 failed
```

### 8.5 明确未做（不得外推）

- 未接入生产 IdP；未覆盖 authorization code / PKCE 回调、令牌撤销、密钥轮换并发窗口。
- 本地 IdP 为**测试桩**，不等同真实 IdP 的完整 OIDC 语义。
- 未执行生产部署 / 生产验收；未安排外部第三方独立审计。
- 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

### 8.6 独立审核（P9-B）与缺陷修复闭环

独立审核代理出具 `docs/governance/agent-reports-2026-09-21/P9-B-INDEPENDENT-REVIEW.md`，
发现 D1（JWKS 缓存击穿）/ D2（503 误判为「未接入」）/ D3（缺行为守卫）三项，**均已修复**：

- D1：按环境变量指纹缓存运行期配置；实测 5 次请求 → JWKS 拉取 **1** 次。
- D2：`NOT_INTEGRATED_STATUSES = {404, 501}`；503 单独产出 `SERVICE_UNAVAILABLE`（可恢复）。
- D3：新增 `tests/contracts/test_phase9_degradation_runtime.py`（Node 真实执行 JS，6 个用例）。

**门禁**：`pytest` **121 passed**、`node --check` **54/0 failed**。
详见 `docs/governance/TASK-NOTES-2026-09-18.md` §21.12.5。


---

## 9. 提交与远端 CI 读回（2026-09-21）

- 本地提交与推送：`2241340412e1b12952f571d04b85c480b0ff27e1`；`HEAD == origin/master == 2241340412e1b12952f571d04b85c480b0ff27e1`（逐字一致）。
- CI run `35575654111`：`conclusion=success`，`headSha=2241340412e1b12952f571d04b85c480b0ff27e1`（逐字一致）。
- 步骤：安装运行期与测试依赖 / 验证关键依赖可导入 / 运行全量测试 / 扫描二进制白名单，全部通过。
- **边界**：远端 CI 绿只覆盖该 SHA 在 CI 环境的检查，**不等于**生产验收，也不构成发布授权。
