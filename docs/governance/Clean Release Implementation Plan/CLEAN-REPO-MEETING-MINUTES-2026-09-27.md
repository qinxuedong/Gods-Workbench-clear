# Gods-Workbench 纯净新仓架构重整讨论会议纪要 (Meeting Minutes)

- **会议日期**：2026-09-27
- **会议主题**：Phase 12 完成后项目重新整理为干净 Git 仓库的目录层级、文件命名、持续防腐与运行数据隔离方案讨论
- **关联执行计划书**：[CLEAN-REPO-REORGANIZATION-PLAN.md](CLEAN-REPO-REORGANIZATION-PLAN.md)（v1.2 起取代 v1.1 与 v1.0）

---

## 一、 讨论背景与核心诉求

在 `Gods-Workbench-clear` 历经 Phase 1 至 Phase 12 的渐进式洁净室迁移与研发后，项目功能已趋于完备，但仓库内部留下了大量阶段性施工痕迹（如根目录交接单、带批次号的模块与路由文件、带阶段号的测试文件、`static/v2/` 历史子目录等）。

**核心目标**：在 Phase 12 全部完成后，将项目整理为一个结构极简、命名自解释、零历史包袱的干净工程发布到 Git，并确保未来新增需求、调研项目与本地测试运行时不再产生混乱或污染真实业务数据。

---

## 二、 完整讨论脉络与演进过程（五轮迭代）

### 第一轮：全仓现状痛点诊断与初步重整框架
1. **现状事实盘点（5 大痛点）**：
   - **根目录堆积过程文件**：存在 `HANDOFF.md` ~ `HANDOFF-11.md`、`CLEANROOM-*.md`、临时调试文件（`_hg_check.py`, `b4test.txt`, `oldtests.txt`, `phase8.diff`, `review_chunks.txt`）及中英文混杂的启动脚本（`启动GodsWorkbench.ps1/.pyw`）。
   - **后端带有施工批次后缀与同域割裂**：`api/` 下并存 `routes_asset_library.py` 与 `routes_asset_library_b4.py`、`routes_asset_review_b6.py`、`routes_episode_pipeline_b7.py`、`routes_prompt_library_b8.py`、`routes_public_b9.py`；领域层被切碎为 `asset_library`（含 `b4_service.py`）、`asset_registry`、`asset_review`、`media`，且 `core/` 混入了大量认证与业务代码。
   - **测试文件按阶段时间线命名**：`tests/contracts/` 下 38 个测试文件中有 29 个以 `test_phase6_...` ~ `test_phase12_...` 命名，无法直观反映业务领域。
   - **文档与脚本残留过程记录**：`docs/governance/` 含大量带日期的 Agent 任务单与证据报告，`tools/` 下含 `_probe_p12.py` 等一次性脚本。
   - **卫生门禁自锁识别**：核查发现 `tests/hygiene/` 中存在迁移期绑定的 SHA-256 哈希清单锁与硬编码路径，重整时需同步升级为正式版架构门禁。
2. **首轮待确认议题**：
   - 顶层包名是否保留 `src/gods_workbench/`？
   - 前端 `static/v2/` 是保留路径兼容（方案 A）还是彻底展平去 `v2` 化（方案 B）？
   - 后端业务模块是否需要一层 `domains/` 目录缩进？

---

### 第二轮：确立极简命名与彻底去 `v2` 化方向
1. **用户明确拍板三项核心偏好**：
   - **顶层包名**：不要冗长的 `src/gods_workbench/`，直接简短使用 **`main/`**；
   - **前端目录**：选择 **方案 B**，不要 `v2` 字眼，彻底展平；
   - **目录层级**：少一层缩进，不设多余的 `domains/` 中间层。
2. **技术可行性核查结论**：
   - 改为单层 `main/` 后，Python 默认将根目录加入寻址路径，彻底省去 `PYTHONPATH=src` 配置，原生支持 `import main.xxx` 与 `uvicorn main.app:app`。
   - 核对原 `static/v2/` 下的 9 个工作台主页面与原 `static/` 根下的 7 个内嵌/分享页面，确认 **16 个 HTML 文件名 100% 零重名冲突**，CSS 与 JS 文件名同样零冲突，完全具备展平条件。

---

### 第三轮：确立“旧仓封存 + 新仓直建”与前端代码级全量去 `V2` 化
1. **用户关键决策**：
   - **前端彻底去 `v2` 化**：不仅目录名、文件名（`v2-shell.js` → `workbench-shell.js`）、URL 路由去掉 `v2`，连前端 JS/HTML/CSS 代码内部的全局命名空间（如 `window.V2Shell` → `window.WorkbenchShell`、`window.V2Projects` → `window.WorkbenchProjects`、`window.V2TaskQueue` → `window.WorkbenchTaskQueue`）及 `v2-` 类名前缀也顺手全部重构净化。
   - **仓库隔离策略**：`Gods-Workbench-clear` 本地文件夹和仓库（关闭公开）保持原封不动；新开一个独立的文件夹和仓库 **`Gods-Workbench`**，直接在里面实现。
2. **工程评估**：
   - “旧仓封存不动、新仓直建”是零风险的最佳实践：旧仓作为 Phase 1~12 完整审计档案与只读黄金参照基准；新仓从 `git init` 第一秒起即拥有 100% 纯净的 Git 历史。

---

### 第四轮：第一性原理架构再升级（极致纯净版）
在进一步探讨“是否有更好方案”时，从第一性原理出发完成了 **3 项架构升级**，并获用户确认采用：
1. **后端取消 `main/api/` 集中营，改为“垂直领域内聚（Vertical Slice）”**：
   - 不再把路由放在 `main/api/routes_xxx.py`、把服务放在 `main/xxx/service.py` 两头跑；
   - 直接取消 `main/api/` 目录，让 `main/` 下的 8 大业务包（`auth`, `projects`, `god_canvas`, `assets`, `episodes`, `prompts`, `observability`, `settings`）各自内聚标准四件套：`router.py` + `service.py` + `models.py` + `repository.py`，由 `main/app.py` 统一挂载。
2. **前后端在根目录平级分离（`main/` + `web/`）**：
   - 将前端静态资源从后端 Python 包内提出来，直接放在仓库根目录的 **`web/`** 下，与纯后端目录 **`main/`** 平起平坐（`main/app.py` 将 `/static` 挂载到 `web/`，对外 URL 100% 兼容）。
3. **前端 `web/css/` 与 `web/js/` 内部分层归拢**：
   - 告别 30 多个 JS 文件散装平铺，将 `web/css/` 分为 `base/` 与 `pages/`，将 `web/js/` 分为 **`core/`（全局底座）**、**`controllers/`（9 个主页面控制器）**、**`modules/`（细分业务与子面板模块）**。

---

### 第五轮：未来新需求防熵增（Anti-Entropy）与测试运行数据隔离
针对用户提出的两个长远痛点——**“未来新增需求、临时文件、调研项目如何管理”**与**“在项目里测试运行如何避免写入真实数据”**，确立了最终闭环机制：

1. **设立 `.local/` 本地专属全能沙盒（Git 忽略 + 卫生测试双豁免）**：
   - **`.local/research/`**：专门存放未来的调研项目、技术预研、PoC 原型（即使包含测试图片、音视频样本，卫生门禁也自动跳过 `.local/`，绝不误报）；
   - **`.local/notes/` & `.local/probes/` & `.local/tmp/`**：存放 AI 任务单、过程草稿、一次性调试探针脚本（`_probe_*.py`）与日志，确保根目录与受控区永远一尘不染。
2. **新需求原位演进 + `test_repo_structure.py` 自动化目录守卫**：
   - 已有业务加需求一律在对应领域包内原位扩展，新业务按标准四件套平级扩展；
   - `pytest` 自动守卫根目录白名单，并全仓拦截任何包含 `phase\d+`、`_b\d+`、`v2`、`temp`、`draft`、`handoff` 的文件或目录命名。
3. **运行数据“单一数据根 + 三态物理隔离”（解决旧仓数据串味隐患）**：
   - **隐患修复**：修复旧仓 `GW_DATA_DIR`（JSON）与 `GW_LOCAL_AUTH_DB`（SQLite）分裂导致跑测试或本地启动容易读写 `%LOCALAPPDATA%` 真实数据的问题，新仓将所有持久化文件 100% 统一收口至唯一数据根 `storage.data_root()`（`GW_DATA_DIR`）。
   - **三态隔离**：
     1. **`pytest` 自动化测试态**：强制锁入系统临时目录 `tmp_path`，跑完即焚；
     2. **`python run.py` 开发调试沙盒态（IDE 终端默认）**：默认写入项目内的 **`.local/runtime-dev/`**（支持 `python run.py --reset` 一键清空重来），随便测试点页面绝不触碰真实数据；
     3. **双击 `start.bat`（或 `python run.py --prod`）真实生产态**：连接独立于代码仓库之外的 `%LOCALAPPDATA%\GodsWorkbench\data\` 真实业务数据区。

---

### 第六轮：启动脚本极简化（合并替换 `.ps1` 与 `.pyw` 为单一 `start.bat`）
1. **用户诉求**：希望将根目录下的 `启动GodsWorkbench.ps1` 与 `启动GodsWorkbench.pyw` 两个启动文件替换为一个 `.bat` 文件。
2. **第一性原理与事实核查**：
   - **历史原因排查**：旧仓之所以同时存在 `启动GodsWorkbench.ps1`（调用 `tools/start_gods_workbench.ps1`）与 `启动GodsWorkbench.pyw`（调用 `tools/run_visible_server.py` 再调用 `run.py`）这 **4 个套娃脚本**，是因为旧仓 `tests/hygiene/cleanroom_extensions.py` 误把纯文本脚本 `.bat` / `.cmd` 当成二进制可执行文件（`.exe` / `.dll`）列入了 `BANNED_EXTENSIONS`。
   - **新仓定稿方案**：
     1. 在新仓 `cleanroom_extensions.py` 中纠正分类，仅拦截真正的二进制文件，放行纯文本 `.bat`；
     2. 将等待 `/healthz` 就绪并自动打开浏览器的逻辑直接内聚到 `run.py --open-browser` 中；
     3. 根目录仅保留一个干净的 **`start.bat`**（双击即运行 `python run.py --prod --open-browser`），一次性砍掉原来的 4 个套娃启动脚本。

---

## 三、 前六轮当时的决议

1. **旧仓处置**：等 Phase 12 完成后，`Gods-Workbench-clear` 保持原状封存（关闭公开），不再做结构性改动。
2. **新仓落地**：新建 `Gods-Workbench` 文件夹与 Git 仓库，再按执行计划重整。

本节只保留当时已经确定、且第七轮没有推翻的方向：旧仓封存、新仓不继承旧历史、前端去掉 `v2`、运行数据分三个物理位置、`.local/` 收纳本机临时文件、最终只留一个 `start.bat`。

下列当时的做法不再执行：包名 `main/`、本期取消 `api/` 并合并成垂直切片、每个域强制四件套、测试折成 8 个文件、`.bat` 按扩展名放行、子串正则、16 个 HTML 全部平铺。旧的 6 步清单也由第七轮的任务 0 到任务 7 取代。

---

## 四、 第七轮：独立复核与定稿修订

- **复核日期**：2026-09-27
- **复核对象**：v1.0 执行计划、本纪要前六轮，以及洁净仓当前代码与本地仓库状态
- **结论**：重整方向保留，v1.0 不能直接执行。执行依据改为计划书 v1.1。

### 1. 计划内部与仓库事实的冲突

1. 第六轮保留「只使用 `start.bat`」这个结果，但它给出的放行理由不成立。`.bat` 是文本，不代表可以按扩展名从可执行脚本清单中删除。卫生规则只给根目录 `start.bat` 逐路径白名单，`.cmd` 及其他 `.bat` 继续拒绝。
2. v1.0 的反施工正则对文件名做子串匹配，会误伤 `template`、`attempt` 等合法名称。改为只匹配完整路径段。
3. 「每个域固定四件套」与 v1.0 自己的目录树冲突，也会催生空文件。本期不强制文件名集合。
4. `tests/contracts/` 现有约 40 个测试模块。按域建目录可以，把它们合并成 8 个大文件会丢断言。
5. 16 个 HTML 文件名确实不冲突，但根级页面不是一组同类页面。`app.py` 对 6 个页面在缺少 `embedded=1` 时返回 307，带 `embedded=1` 时必须返回原文件；`asset-share.html` 是公开分享页，不能被这套重定向卷入。
6. `main` 可以少打几个字，但不是可安装、可长期引用的包名。import 继续使用 `gods_workbench`，只去掉 `src/`。

### 2. 行为边界被目录图漏掉

1. 资产、评审、提示词目前同时存在不带批次号和带 `_b4`、`_b6`、`_b8` 的路由。观测域还会调用项目、画布和资产服务。这些都是当前行为，不是待清理的空目录。
2. 画布路由注册顺序本身是行为：`/api/canvases/trash` 必须先于 `/{canvas_id}`。
3. 因此本期只做可由对照表验证的机械搬家。服务合并、双代路由合并和垂直切片重排，另立一次改动。
4. 去 `v2` 除文件名外，还要覆盖脚本地址、全局对象、CSS/DOM 标识和 `localStorage` 键。改键时先读旧键、写新键。
5. 旧 `/static/v2/*` 可以暂时 307，但必须写明失效条件，不能成为永久第二套入口。

### 3. 数据、卫生与发布

1. 当前默认数据目录名是 `GodsWorkbenchClear`，账号库又由 `GW_LOCAL_AUTH_DB` 单独定位。新代码统一到 `GodsWorkbench` 数据根，但不在 `run.py` 启动时自动搬运旧数据。
2. 迁移是一次性显式命令：复制、写回执、旧目录保留。相对路径拒绝；开发数据不得逃出 `.local/runtime-dev/`；生产数据不得写入仓库。
3. `--reset` 必须显式指向开发沙盒，并拒绝 `%LOCALAPPDATA%`。开发态与生产态分开 Cookie；同时运行两个实例时，第二个必须另给端口。默认端口仍是 2077。
4. JSON 存储目前只保证单进程一致性。继续开发时不把多 worker 当成已经支持的部署方式。
5. `.gitignore` 不能证明已跟踪文件已被排除。卫生测试必须检查 `git ls-files`。
6. `docs/behavior/`、契约、夹具和来源账本是活文档。`HANDOFF`、探针、过程任务单和本讨论稿留在封存仓。`PLUGIN-PROTOCOL-SPEC.md` 继续排除。
7. 新目录、新历史和测试通过，都不改变 `release_authorized: false`。许可证、NOTICE、第三方清单、字体授权另行过门。CI 从新仓第一次提交就运行。

### 4. 仓库名可以回到 Gods-Workbench，但旧仓不能复活

1. 三个名字分开：仓库名 `Gods-Workbench`、import 名 `gods_workbench`、数据目录名 `GodsWorkbench`。
2. 新仓内容只来自洁净仓的冻结提交，使用 `git archive` 或等价导出后重新 `git init`。不读取旧 `Gods-Workbench` 源码，不继承旧提交。
3. GitHub 旧远程已经改名 `Gods-Workbench-old20260927`。复核时本地 `D:\Working\Code Pro\Gods-Workbench` 仍占用原名，HEAD 为 `2a95a2fcec8bc1d7fa82bad33281ee733ab79e99`，且 `origin` 仍指向 `Gods-Workbench.git`。
4. `Gods-Workbench-release` 和 `Gods' Workbench-old-sealed-20260821` 的 `origin` 也同样指向旧地址。必须先改到 `Gods-Workbench-old20260927.git` 并删除 push URL。
5. 旧本地目录还有未提交修改和调研文件。改名不会删除它们，但需要保留的文件要先另行归档，不能带进新仓。
6. 洁净仓当时比自己的 `origin/master` 超前 17 个提交，工作区也未冻结。没有冻结提交和归档标签，就不能导出。
7. GitHub 上的新 `Gods-Workbench` 必须是新仓库。禁止把已改名的旧远程改回原名，否则旧克隆的 push 会在跳转失效后指向新历史。

### 5. 执行前新增的验收材料

路径对照、测试对照、数据对照、文档去留四张表，必须在机械搬家前由冻结提交生成。没有这四张表，测试通过也不能证明行为没有丢失。

---

## 五、 当前有效决议

1. **继续开发的仓库名**是 `Gods-Workbench`。它是洁净仓冻结提交导出的新历史，不是旧仓库换名复活。
2. **Python 包名**保持 `gods_workbench`，目录从 `src/gods_workbench/` 升到仓库根。
3. **真实数据目录名**使用 `%LOCALAPPDATA%\GodsWorkbench\`。旧的 `GodsWorkbenchClear` 只接受一次性显式迁移。
4. **本期范围**是钉住行为、导出、机械搬家、测试分目录、数据三态、文档分流和 CI。不合并双代路由或服务。
5. **前端**分为主页面、`embedded=1` 内嵌页、公开分享页；`v2` 按磁盘清单清除，并保留有期限的旧 URL 兼容。
6. **启动器**只留逐路径放行的 `start.bat`。
7. **发布状态**在本计划完成后仍是未授权。`/healthz` 继续如实返回 `release_authorized: false`。
8. **执行顺序**以 [CLEAN-REPO-REORGANIZATION-PLAN.md](CLEAN-REPO-REORGANIZATION-PLAN.md) v1.2 的任务 0 到任务 8 为准。任务 0 完成前，不创建新的 `Gods-Workbench` 文件夹或 GitHub 仓库。
9. **旧仓知识材料**只在任务 8 处理，位于任务 0 至任务 7 之后。未轮到前不复制、不改写、不删除。

---

## 六、 第八轮：旧仓知识材料盘点

- **讨论日期**：2026-09-28
- **盘点对象**：`D:\Working\Code Pro\Gods-Workbench` 的技能、设计文档、产品规范、契约、工作流和合规材料
- **用户决定**：先整理进计划和纪要；这批文件的迁移放在整个重整的最后处理
- **执行结果**：计划书由 v1.1 增至 v1.2，新增任务 8。本次没有复制、改写或删除旧仓文件

### 1. 为什么不能插进前面的任务

旧仓材料混有四类内容：仍有效的产品规则、可提取的设计规则、需要核许可证的通用技能、必须留下的施工日志和旧许可证。任务 2 的导出源只允许是洁净仓冻结提交。提前从旧仓取文件，会把旧路线图、SIGNAL-FLOW、自定义许可证和上游署名重新带进新仓。

### 2. 盘点结论

1. **可重写**：`USER-STORIES.md`、`PRODUCT.md`、`GLOBAL-ID-CONTRACT.md`、自动化权限、本地客户端、备份恢复、可观测性和 20 万素材性能计划，以及 `workflows/` 的 ComfyUI JSON。
2. **只提取设计规则**：根目录和设计稿中的 `DESIGN.md`、设计索引、Iconify 指南、SIGNAL-FLOW 提案、`.impeccable/design.json`。黑金色值、字阶、间距、状态色和无障碍要求可以摘；`static/v2`、Outfit、Manrope、Iconify、Google Fonts、Unsplash、CDN 和 SIGNAL-FLOW 旧壳不带入。
3. **技能分开审**：`gods-workbench` 技能与根 `AGENTS.md` 留旧仓；三个 addyosmani 通用技能和 `impeccable` 先核许可证，优先放个人技能目录。`.claude/settings.local.json` 不迁移。
4. **合规材料只读**：`docs/open-source-commercialization/` 与 `docs/security/route-permissions.*` 可作审查输入。旧 `LICENSE` 不是新仓的发布许可。
5. **明确不进**：`ROADMAP.md`、M0–M3 执行计划、飞书/GitHub/Discord 迁移记录、归档和报告、旧 OpenAPI 快照、调研过程稿、wheel、虚拟环境、缓存、临时目录、`cutover_to_v2.py`。

### 3. 任务 8 的顺序

产品不变量、设计差异、通用技能、ComfyUI 与第三方准入，依次单独审查。路线图、施工日志和旧许可证全程留在旧仓。任何一项通过审查，也不提前把 `release_authorized` 改为 `true`。

逐项清单与排除表以计划书第九节为准。