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

- **第 4 项（错误语义）**：`core/errors.py` 定义 `401 unauthorized` / `403 FORBIDDEN` /
  `409 VERSION_CONFLICT` / `409 CANVAS_VERSION_CONFLICT`；`409` 另含 `LIFECYCLE_CONFLICT`（生命周期前置条件，
  契约已声明「409 CAS 冲突或生命周期不满足前置条件」）。`202` 由
  `routes_god_canvas.py:180` 声明，返回稳定 `job_id` + `poll_hint`，并有黄金夹具 `canvas-task-accepted-202.json`。
  统一错误包 `{"detail":{"code":…,"message":…}}` 由 `app.py` 的 `CleanroomException` 处理器统一产出；
  参数校验错误走 400 独立分支（同为统一外层结构）。
  **更正（2026-09-21）**：本节历史行曾把 `401 unauthorized` 写成含零宽/西里尔字符的形近串，属**历史文档污染**（`src/` 实现为纯 ASCII）。本轮已就地更正为纯 ASCII `unauthorized`。
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


---

## 10. Phase 9D 追加：用户裁决第 3 项收口与 R6-8 闭环（2026-09-21 追加，实现方自采 + 独立复核读回）

> 本节**仅追加**，不修改 §0–§9 的历史结论与哈希快照。

### 10.1 本轮新增/修改范围

- **前端显式降级收口**（用户裁决第 3 项）：
  `v2/js/home-controller.js`、`v2/js/projects-controller.js`、`v2/workshop.html`（内联脚本）、
  9 个 v2 页 + `v2/js/v2-shell.js`、`static/css/hardware-design-system.css`、`v2/index.html`、`v2/settings.html`、
  `v2/projects.html`、`v2/production.html`、`static/js/hardware-telemetry.js`。
- **口径更正**：`static/js/http-transport.js` 第 18 行注释（仅该行，7354 B → 7387 B，CRLF 保留）。
- **R6-8 修复**：`core/config.py`（重定向逐跳重校验增加同源约束，起始 origin 线程本地绑定）。
- **新增守卫**：`tests/contracts/test_phase9d_cross_module_consistency.py`（6 用例，Node 真实执行）。

### 10.2 伪造身份 / 伪造状态断言清零（静态层实测）

| 关键词 | 本轮结束后命中数 |
|---|---|
| `proj-demo` / `proj-local` / `proj-trash` | 0 / 0 / 0 |
| `本地挂载` / `本地兜底` / `就绪待命` | 0 / 0 / 0 |
| `PIPELINE ENGINE BUS: CONNECTED` | 0 |
| `ACTIVE SESSION` | 0 |
| `4/4 ONLINE` | 0 |
| `本机管理员席位` | 0 |
| `免密单机` / `超级管理员 (Admin)` | 0 / 0 |
| `当前登录席位：admin (主创)` | 0 |

### 10.3 跨模块降级语义一致性（Node 真实执行，分歧数 = 0）

`degradation.js`（经典脚本）与 `http-transport.js`（ESM）对 10 个输入逐条对照：

```text
404_plain_empty          not_integrated       / not_integrated
404_plain_notfound       not_integrated       / not_integrated
404_lowercase            not_integrated       / not_integrated
404_501_style            not_integrated       / not_integrated
404_business_envelope    none                 / none
404_business_text        none                 / none
501_plain                not_integrated       / not_integrated
503_generic              service_unavailable  / service_unavailable
500_generic              none                 / none
200_ok                   none                 / none
MISMATCHES: 0
```

### 10.4 R6-8 修复前后实测（OIDC 重定向同源约束）

```text
修复前：fetched kids = ['ATTACKER-KEY']；attacker hits = 1
修复后：exception: HTTPError 302；attacker hits = 0；VERDICT: blocked
```

### 10.5 门禁（本轮实测，未提交工作树）

```text
python -m pytest -q --no-header -p no:cacheprovider                 -> 160 passed
python -m pytest -q --no-header -p no:cacheprovider tests/hygiene    -> 11 passed
node --check（非 vendor .js，55 个）                                  -> 55 / 0 failed
同形字扫描（28 个改动文件，ord() 判定）                                 -> 0 命中
```

### 10.6 明确未做（不得外推）

- **未**安排第三方独立审计；**未**取得发布授权（仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**）。
- **未**接入生产 IdP；**未**做令牌撤销、密钥轮换并发压测。
- O4 / O5 / O6 / R6-7 与 `static/js/canvas/http.js` 删除均**待用户裁决**，本轮未执行。
- 本地通过 ≠ 远端 CI ≠ 生产验收；同框架内复核 ≠ 外部第三方独立审计。

---

## §11 Phase 9E / 9F / 9G 追加验收登记（2026-09-21，主代理实测，未提交工作树）

### 11.1 本轮修复的真实缺陷

1. **R6-9 授权门禁 fail-open（高）**：`asset-review.js` 的 `can()` 依赖后端**不存在**的
   `auth_required` 字段（`!undefined === true`），使**未认证访客**在 `asset-manager.html` /
   `v2/collab.html` 被判为拥有 admin/editor/reviewer **全部权限**。已改为 fail-closed。
2. **R6-10 / P9G 真实 IdP 互操作（高）**：Google 官方 discovery 跨主机
   （issuer `accounts.google.com` / jwks `www.googleapis.com` / token `oauth2.googleapis.com`），
   原「逐字同源」判据使 `oidc_ready=false`、登录 **503**，**且显式配 `GW_OIDC_JWKS_URL` 仍被拒**。
   已新增 opt-in `GW_OIDC_ENDPOINT_HOSTS`；**默认严格同源未变**。
3. **顶栏推子具体读数（中）**：7 个 v2 页 + `v2-shell.js` 的推子读数会被读成真实遥测，
   已统一 **`0%` + 「未接入」+ 降级标记**；真实交互输入推子（LoRA/roughness/CFG/温度）**刻意保留**。
4. **令牌交换重定向（中）**：新增 `_NO_REDIRECT_OPENER`，令牌路径**任何 3xx 失败关闭**。
5. **R6-12 `X || 默认值` 吞掉真实 0（高）**：`home-controller.js` / `projects-controller.js` /
   `production-controller.js` 多处 `progress || 10/60/75`、`scenes || 24`、`shots || 72`；
   后端新建项目 `progress=0.0`，**0% 会被显示成 10%/60%/75%**。已改为 `Number.isFinite` 判定 +
   显式「未接入」，并新增 **Node 行为级** 8 组 fixture 守卫（断言 0 保持 `0%`）。

### 11.2 真实 Google 接线实测（经代理 `127.0.0.1:7897`）

```text
未设 GW_OIDC_ENDPOINT_HOSTS  -> oidc_ready=false, /login 503 OIDC_NOT_CONFIGURED（默认严格）
设 accounts.google.com,www.googleapis.com,oauth2.googleapis.com
                             -> jwks_url=https://www.googleapis.com/oauth2/v3/certs
                                oidc_ready=true, login_available=true, /login 200
                                authorization_url 含 code_challenge_method=S256
```

> 边界：仅验证**元数据 / JWKS / 授权 URL 构造**，**未完成**真实授权码交换（无真实 `client_id`）。

### 11.3 最新门禁（本稿**取代** §10.5 的 160 passed / 55 node 作为当前值）

```text
python -m pytest -q --no-header -p no:cacheprovider                 -> 208 passed
python -m pytest -q --no-header -p no:cacheprovider tests/hygiene    -> 11 passed
node --check（static/ 下非 vendor 全量 55 个；含未跟踪 degradation.js） -> 55 / 0 failed
node --check（2 个 vendor .js 单独复算）                              -> 2 / 0 failed（跟踪 .js 56 个全通过）
同形字扫描（42 个改动文件，ord() 判定）                                 -> 0 命中
真实浏览器 E2E（16 页，Playwright/Chrome）                             -> pageerror 0
二进制白名单越界 / 根级 LICENSE、THIRD_PARTY_NOTICES.md / 嵌套 .git     -> 0 / False / False / 0
```

§10.5 记录的 `160 passed / 55 node` 是**该轮次当时**的真实值，保留不改写；**当前值以 §11.3 为准**。

### 11.4 明确未做（不得外推）

- **未**安排第三方独立审计；**未**取得发布授权（仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**）。
- **未接入生产 IdP**；**未做**令牌撤销、密钥轮换并发压测。
- O4 / O5 / O6 / R6-7 与 `static/js/canvas/http.js` 删除**仍待用户裁决**（本轮 0 处置）。
- **180 条未实现端点**保持原状；三块大功能面标「未纳入当前切片」**不代表已实现或已验收**。
- 本地通过 ≠ 远端 CI ≠ 生产验收；同框架内复核 ≠ 外部第三方独立审计。

## §12 Phase 9H 追加验收登记（2026-09-21，实现方自采，未提交工作树）

> §10.5（160 passed）与 §11.3（208 passed）是**各自轮次当时**的真实值，保留不改写。**当前值以 §12.3 为准**。

### 12.1 本轮修复/新增的真实缺陷与能力证据

| 编号 | 严重度 | 内容 | 状态 |
|---|---|---|---|
| R6-13 | 高（能力证据缺口） | 前几轮 IdP 证据全部来自**本仓自写测试桩**，只能证明自洽；补充**真实第三方 OP** 互操作 | 已实测通过 |
| R6-14 | 中 | discovery 文档自述 `issuer` 未校验（OIDC Discovery 1.0 §4.3 / mix-up 路径） | 已修复 + 4 条守卫 |
| R6-15 | 中 | 伪硬件读数残留：`1.4TB` / `4090×4` / `3.84 TB / 10 TB` / 静态 70%·100% 推子 / `settings.html` `Math.random()` 伪 CPU·RAM 遥测 / 无条件 `ONLINE`·`ACTIVE` / `nodes_count \|\| 12` 吞 0 | 已修复 + 6 条守卫 |

### 12.2 真实第三方 OP 互操作实测（非本仓实现）

对端：npm `oidc-provider@9.12.2`（panva），本地真实实例，运行时生成签名密钥。

```text
脚本端到端（含真实 HTTP 链路 + OP 交互链）
  discovery.issuer                          -> http://127.0.0.1:<port>（与该 OP 自述逐字一致）
  code_challenge_methods_supported          -> ["S256"]
  POST /api/asset-auth/login                -> 200，authorization_url 带 response_type=code / S256
  第三方 OP 交互（登录 + 同意）连跳             -> 最终回跳 redirect_uri，带 code + state
  GET /api/asset-auth/callback              -> 302 /static/v2/index.html（无 auth_error）
  gw_session Cookie                         -> 已建立
  /status                                    -> authenticated=true, role=editor（来自 IdP groups 声明）
  带会话写操作                                -> 201
  伪造 X-User-Role: governor 的治理操作       -> 403（请求头无法提权）
  登出                                       -> 204，会话失效
  RESULT                                    -> PASS

负向路径（同一真实第三方 OP）
  篡改 code_verifier                         -> OP 拒绝换码 -> auth_error=token_exchange_failed，未建会话
  nonce 不符                                 -> OP 签发的合法 id_token 被拒 -> auth_error=id_token_rejected，未建会话

真实浏览器（Chromium / Playwright）
  打开 /static/v2/index.html -> 点击界面真实登录按钮 -> 第三方 OP 页面 -> 提交表单 -> 回跳应用
  gw_session 已建立 / authenticated=true / role=editor / pageerror 0
```

已固化为 **opt-in** 用例 `tests/contracts/test_phase9g_real_op_interop.py`：
未安装第三方 OP 时 **skip**；显式配置 `GW_OIDC_PROVIDER_MODULE_DIR` 时**必须真跑**
（启动失败按 fail 处理，不静默跳过）。

### 12.3 最新门禁（本稿**取代** §11.3 的 208 passed 作为当前值）

```text
python -m pytest -q --no-header -p no:cacheprovider                 -> 218 passed, 3 skipped
python -m pytest -q --no-header -p no:cacheprovider tests/hygiene    -> 11 passed
设 GW_OIDC_PROVIDER_MODULE_DIR 后全量                                      -> 221 passed
第三方 OP 互操作用例（显式配置时）                                          -> 3 passed
第三方 OP 互操作用例（指向空目录）                                          -> 3 skipped（证明真 opt-in）
node --check（static/ 下非 vendor 全量，55 个）                            -> 55 / 0 failed
同形字扫描（44 个改动文件，ord() 判定）                                     -> 0 命中
真实浏览器 E2E（16 页，Playwright/Chrome）                                 -> pageerror 0
```

**变异测试**：把 5 处修复逐一回退为原缺陷写法，5/5 守卫失败（`ALL_GUARDS_DETECT: True`），
证明新增守卫非恒真；探针结束后文件逐字还原（已断言还原一致）。

### 12.4 明确未做（不得外推）

- **未**安排第三方独立审计；**未**取得发布授权（仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**）。
- 第三方 OP 是**开源 OP 软件的本地实例**，**不等于**接入任何真实生产 IdP：
  无真实 `client_id`、无真实用户目录、无 TLS 终止、无密钥轮换、无撤销策略。
- **未做**令牌撤销与密钥轮换并发压测；`_SESSIONS` / `_FLOW_STATES` 仍为**单进程内存存储**。
- O4 / O5 / O6 / R6-7 与 `static/js/canvas/http.js` 删除**仍待用户裁决**（本轮 0 处置）。
- **180 条未实现端点**保持原状；三块大功能面标「未纳入当前切片」**不代表已实现或已验收**。
- 本地通过 ≠ 远端 CI ≠ 生产验收；同框架内复核 ≠ 外部第三方独立审计。

### §12.5 与 P9-D 独立复核报告的交叉引用

`docs/governance/agent-reports-2026-09-21/P9-D-INDEPENDENT-REVIEW.md` 由**独立复核方**创建并持有，
本稿**不改写**该文件。该报告的门禁小节留有 `{{GATE_*}}` 占位符（由复核方设计，
要求由组长在**实现方停止改动后**填入）；**对应的真实值记录在本稿 §12.3**，两者应交叉阅读。

复核方独立实测结论（与本稿）一致：骨干门禁 **218 passed, 3 skipped**；
装好 `oidc-provider` 后 **221 passed**（其中第三方 OP 互操作 **3 passed**）；
`tests/hygiene` **11 passed**；tracked `.js` `node --check` **56/56 ok**；
真实 Chrome 16 页 `pageerror` = **0**；tracked 文件数 **275**；
死类 `py-0.2` **70 处 / 11 文件**、`backdrop-blur-xs` **2**、`h-4.5/w-4.5` 各 **1**。

> 复核方对 `production.html` 的 85% / 18% / 65% 提出过质疑：经核实，它们是
> **用户可调控件的真实初值**（LoRA 权重 0.85 / 粗糙度 0.18 / CFG 6.5），**不是遥测读数**，
> 已显式加 `data-gw-control="user-input"` 标记以便机器区分；守卫因此对它们放行，
> 对无标记的非零写死宽度仍判违规（已用变异测试证明）。

---

## 13. Phase 9H-2 追加：两个真实缺陷（2026-09-21，主代理实测 + 独立复核复算）

### 13.1 缺陷表

| 编号 | 等级 | 位置 | 性质 | 处置 |
|---|---|---|---|---|
| R6-16 | 低（但真实） | `tests/contracts/test_oidc_verifier.py::test_tampered_signature_rejected` | 篡改方式不可靠 → 负向守卫约 1/256 概率失去意义 | 已修（确定性比特翻转 + 自检） |
| R6-17 | 中 | `tests/contracts/test_phase9g_real_op_interop.py` | 第三方 OP 版本无断言 → 文档声明可被静默漂移 | 已修（版本比对，不一致 fail） |

### 13.2 R6-16 证据（签名篡改不可靠）

根因：Base64URL 末位存在**同值别名**。实测：

```text
python -c "import base64; print(base64.urlsafe_b64decode('xw=='), base64.urlsafe_b64decode('xx=='))"
b'\xc7' b'\xc7'
```

确定性枚举（固定 256 字节签名体、尾字节取遍 0..255）：

```text
collision_last_bytes: [('0xc7', 'xw')]
count=1  ->  失败概率 = 1/256 = 0.3906%
```

即**仅当签名末字节 == 0xC7（末两字符 == `xw`）**时，`signature[:-2] + "xx"` 解码后字节不变，
守卫静默失效、用例伪失败。原写法实测：每次新建密钥采样 1500 次命中 11 次、
采样 6000 次命中 15 次（统计波动区间内，不作概率估计；精确概率由上述枚举给出）。

修复：确定性翻转签名原始字节首字节 1 bit 再重新编码 + `assert tampered_signature != signature` 自检。

变异验证：把 `_verify_signature` 改为直接 `return` 后该用例**确实失败**：

```text
FAILED tests/contracts/test_oidc_verifier.py::test_tampered_signature_rejected
1 failed in 0.27s
```

探针结束文件逐字还原（`restored identical: True`）。

### 13.3 R6-17 证据（第三方 OP 版本漂移）

```text
node_modules/oidc-provider/package.json  ->  8.8.1   （复核时实测）
package.json                             ->  "^8.8.1"
npm cache index: 21:43 抓取 9.12.2（原轮次真实使用）
                 22:09:33 重装为 8.8.1（事后环境漂移）
npm view oidc-provider version           ->  9.12.2  （dist-tags.latest 亦为 9.12.2）
```

修复后负向实测（显式声明与实装不符）：

```text
GW_OIDC_PROVIDER_VERSION=8.8.1 + GW_OIDC_PROVIDER_MODULE_DIR=... \
  python -m pytest -q tests/contracts/test_phase9g_real_op_interop.py
-> 3 errors（版本漂移被拦下）
```

环境处置：已把本机对端重装为 `oidc-provider@9.12.2`，与文档声明逐字一致后再复跑。

### 13.4 门禁（最新真实值，未提交工作树）

```text
python -m pytest -q --no-header -p no:cacheprovider                 -> 218 passed, 3 skipped
python -m pytest -q --no-header -p no:cacheprovider tests/hygiene    -> 11 passed
设 GW_OIDC_PROVIDER_MODULE_DIR 后全量                                      -> 221 passed
第三方 OP 互操作用例（9.12.2）                                              -> 3 passed
第三方 OP 互操作用例（版本声明不符 8.8.1）                                  -> 3 errors
第三方 OP 互操作用例（空目录）                                              -> 3 skipped
node --check（static/ 非 vendor 全量）                                     -> 55 / 0 failed
tracked 文件数                                                            -> 275
```

### 13.5 未做 / 不得写 PASS

- **O4**（`tools/build_static_tailwind_utilities.py` 未被跟踪 → 静态 Tailwind 不可复现）
- **O5**（死类 `py-0.2` 70 处 / `backdrop-blur-xs` 2 处 / `h-4.5`·`w-4.5` 各 1 处）
- **O6**（`P9-B-INDEPENDENT-REVIEW.md` §11.2 / §9.2 写 `tracked 269`，实为 275，本文件**不改写他人文件**）
- **R6-7**（`core/session.py` 无绝对过期上限）
- `static/js/canvas/http.js`（512 B、零调用方，删除属破坏性操作）
- **T40 第三方独立审计与发布授权**（用户裁决「另行安排」）

### 13.6 与 P9-D 交叉引用

独立复核方持有一份独立复核文件（`P9-D-INDEPENDENT-REVIEW.md`，由复核方创建并持有，
本报告**不代其填写**）。本次复核方对 R6-16 根因（Base64URL 同值别名 / ≈1/256）
与 R6-17 版本漂移**独立复算并确认**，并补充确认：

- 文档写 `9.12.2` **是准确的**——复核方当时的对端确为 9.12.2，属事后被重装为 8.8.1；
- 新增版本守卫**封住了「版本漂移就静默通过」的风险**，属有效加固；
- 复核方在同一工作树复跑：`pytest` **218 passed, 3 skipped**、`tests/hygiene` **11 passed**、
  tracked `.js` `node --check` **56/56**、真实 Chrome 16 页 `pageerror` **0**、tracked **275**、
  工作树 **45 项**、`py-0.2`=70、`backdrop-blur-xs`=2（O5 未处置）。

### 13.7 边界

- 全部为**本地实测**；**不等于**远端 CI，更**不等于**生产验收；
  **同框架内复核 ≠ 外部第三方独立审计**。
- 两个缺陷均属**测试/证据可靠性**范畴，**不是**运行时安全缺陷。
- 第三方 OP 仍是**开源 OP 软件的本地实例**，**不等于**接入任何真实生产 IdP：
  无真实 `client_id`、无真实用户目录、无 TLS 终止、无密钥轮换、无撤销策略。
- 仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**，发布授权**待第三方独立审计完成**。

---

## 14. Phase 9I 追加：裁决 3 legacy 页收口 + 真实外部 IdP 接线核验（2026-09-22）

本节为**追加**，不改写上方任何历史行，也不改写 `P9-D-INDEPENDENT-REVIEW.md`。

### 14.1 裁决 3 legacy 页收口（本轮新增）

5 个 legacy/v2 页（`api-settings.html` / `governance.html` / `canvas-list.html` / `task-center.html` /
`v2/settings.html`）全部在页面自身脚本**之前**引入 `static/js/degradation.js`，并把对应脚本的
静默失败改为显式降级（文案 + `data-gw-degradation` / `dataset.gwDegradation` 标记）。
`v2/settings.html` 修正了脚本顺序缺陷（原 `degradation.js` 在 `settings.js` 之后）。

守卫：`tests/contracts/test_phase9_frontend_degradation.py` 追加 7 条静态守卫。

### 14.2 Phase 9I：真实外部 IdP 生产端点接线核验（本轮新增）

新增 `tests/contracts/test_phase9i_real_idp_wiring.py`（5 用例，opt-in，默认 5 skipped）。
真实上游只读实测（2026-09-22，未使用任何用户令牌）：

| 目标 | 结果 |
|---|---|
| Google `https://accounts.google.com` | 5 passed（discovery 一致 / JWKS 2 公钥 / PKCE S256 / 四种失败模式 401） |
| Microsoft 单租户 `<租户ID>/v2.0` | 5 passed |
| Microsoft 多租户 `common` / `organizations` | **正确拒绝**（自述 issuer 含 `{tenantid}`，R6-14 mix-up 防护） |
| Google 未设 `GW_OIDC_ENDPOINT_HOSTS` | `oidc_ready=false`、`/login` 503 `OIDC_NOT_CONFIGURED`（白名单是显式 opt-in） |

部署方接线手册：`docs/governance/EXTERNAL-IDP-WIRING-RUNBOOK-2026-09-22.md`。

### 14.3 本轮门禁真实值（未提交工作树）

```text
python -m pytest -q --no-header -p no:cacheprovider                 -> 226 passed, 7 skipped
python -m pytest -q --no-header -p no:cacheprovider tests/hygiene    -> 11 passed
设 GW_OIDC_PROVIDER_MODULE_DIR=%TEMP%\gw-idp-node 后全量                        -> 229 passed, 4 skipped
设 GW_REAL_IDP_ISSUER / GW_REAL_IDP_ENDPOINT_HOSTS（Google）后全量              -> 230 passed, 3 skipped
node --check（static/ 下非 vendor 全量）                                   -> 55 / 0 failed
前端 /api 引用 / 已实现 / 未实现                                              -> 189 / 12 / 177
```

### 14.4 口径更正与本轮明确未做（不得外推）

- **未实现端点口径更正为 177**（189 引用 / 12 已实现 / 177 未实现）；本文档 §151 / §164 / §373 / §442 的
  「180」为**当时**真实值，**保留不改**，以本节为准。
- **未**执行真实用户登录（无真实 `client_id`、无用户目录授权、无授权码换 id_token），
  **不能**证明生产登录可用。
- **未**做令牌撤销、密钥轮换并发窗口、多实例会话一致性压测；`_SESSIONS` / `_FLOW_STATES`
  仍为**单进程内存存储**。
- **未**安排外部第三方独立审计；**未**取得发布授权（仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**）。
- **O4 / O5 / O6 / R6-7 与 `static/js/canvas/http.js` 删除**仍待用户裁决（本轮 0 处置），不得写 PASS。
- 本地通过 **!=** 远端 CI **!=** 生产验收；同框架内复核 **!=** 外部第三方独立审计。

## 15. Phase 9J 追加：R6-7 会话绝对过期上限闭环（2026-09-22 追加）

本节仅追加，不改写上方任何历史行。

- **R6-7（中）已修复**：`src/gods_workbench/core/session.py` 原只有滑动过期，
  活跃会话可无限续期；现新增 `SESSION_ABSOLUTE_MAX_SECONDS`（24h）与
  `_Session.absolute_expires_at`，`get_session()` 先判绝对上限、滑动续期封顶，
  `_prune()` 双判清理。
- 新增 `tests/contracts/test_phase9i_session_absolute_expiry.py`（6 用例）。
- 变异测试（临时副本）：移除上限 → **2 failed / 4 passed**；还原 → **6 passed**。
- 门禁：全量 **232 passed, 7 skipped**；hygiene **11 passed**；
  第三方 OP → **235 passed, 4 skipped**；真实 IdP（Google）→ **5 passed**；
  `node --check` **56 / 0 failed**；同形字 **0**。
- **边界**：真实用户登录未执行；Cookie `Max-Age` 仍短于绝对上限；
  会话仍为单进程内存；**O4 / O5 / O6 与 `static/js/canvas/http.js` 仍未处置，不得写 PASS**；
  仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

## 16. 口径更正：tracked 文件数 269 → 275（2026-09-22 追加）

- 历史数值出处：`P9-B-INDEPENDENT-REVIEW.md` §9.2 L202 与 §11.2 L328 均记录 `tracked 269`；本报告 §3 L91 同样记录 269。上述历史行保留不改写。
- 本轮独立运行 `git ls-files | Measure-Object -Line`，实测当前 tracked 文件数为 **275**；该计数不包含未跟踪文件。
- 边界：本节仅为文档口径更正，不改变任何历史结论。
