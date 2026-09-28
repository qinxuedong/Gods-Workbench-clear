# Gods-Workbench 纯净新仓重整与防腐执行计划书 (Clean Release Implementation Plan)

- **文档版本**：v1.2（旧仓知识材料增补，取代 v1.1）
- **制定日期**：2026-09-27
- **修订日期**：2026-09-28
- **触发时机**：Phase 12 收官，并且本文「任务 0」的名字与远程门槛全部完成之后，才能开始导出新仓
- **核心方针**：继续开发的仓库名叫 `Gods-Workbench`。它是从 `Gods-Workbench-clear` 的一个冻结提交导出的新 Git 历史，不是把旧的 `Gods-Workbench` 复活，也不是把目录重整和公开发布做成同一次提交。

v1.0 与 v1.1 不再作为执行依据。与本文冲突的会议决议，以 [会议纪要第八节](CLEAN-REPO-MEETING-MINUTES-2026-09-27.md) 为准。

---

## 一、v1.1 相对 v1.0 的修订清单

| # | v1.0 | v1.1 |
| :--- | :--- | :--- |
| 1 | 顶层 Python 包改名为 `main/` | **否决**。import 名保持 `gods_workbench`。只去掉 `src/` 这一层 |
| 2 | 本期取消 `api/`，8 个域各合并成一套服务 | **移出本期**。本期只搬家，不合并双代路由，不改服务调用关系 |
| 3 | 每个域强制 `router.py + service.py + models.py + repository.py` | **否决**。禁止为了凑齐四件套而新建空文件 |
| 4 | 约 40 个契约测试折成 8 个 `test_<domain>.py` | **否决**。按域分目录，用例文件保持独立，禁止合并内容 |
| 5 | `.bat` 按扩展名从二进制清单放行 | **否决**。只给根目录 `start.bat` 逐路径白名单 |
| 6 | 子串正则拦截 `temp`、`v2`、`draft` 等 | **否决**。只匹配完整路径段，避免误伤 `template`、`attempt` |
| 7 | 16 个 HTML 全部平铺到 `web/` 根 | **修订**。主页面、`embedded=1` 内嵌页、公开分享页三者分开 |
| 8 | 去 `v2` 只列了 4 行对照 | **修订**。先从磁盘生成标识符清单，含 `localStorage` 键迁移 |
| 9 | 启动时把数据根改到新目录 | **修订**。新代码只认 `GodsWorkbench`；旧目录只能由一次性迁移命令复制 |
| 10 | `docs/` 收成 architecture/contracts/design/fixtures | **否决**。行为规范、契约、夹具、来源账本分别保留 |
| 11 | 新仓首日即「纯净发布」 | **否决**。`release_authorized` 维持 `false`。重整不等于公开授权 |
| 12 | 直接新建文件夹 `Gods-Workbench` | **前置改道**。本地旧目录和三处旧 `origin` 先退出这个名字 |
| 13 | 纪要写 `launch_workbench.pyw`，计划写 `start.bat` | **统一**为根目录 `start.bat`。`.pyw` 不再是生产入口 |
| 14 | 未登记旧仓技能、设计、路线图和其他知识材料 | **增补为任务 8**。分类保留，但排在任务 0 至任务 7 全部完成之后，不插入本次搬家 |

---

## 二、仍然有效的决定

1. `Gods-Workbench-clear` 在冻结提交并打上归档标签后只读封存，不再做结构性改动。
2. 新仓不继承任何旧 `.git` 历史，也不读取旧 `Gods-Workbench` 的源码。
3. 前端去掉路径、文件名、全局名、CSS/DOM 标识中的 `v2` / `V2`。
4. 运行数据保持三个物理位置：pytest 临时目录、仓库内开发沙盒、用户目录中的真实数据。
5. 根目录使用白名单。一次性草稿、探针、调研只进 `.local/`。
6. 以后新增业务继续落在对应领域包内，但不在本期把现有领域重写一遍。
7. 对外继续开发时，仓库名回到 `Gods-Workbench`。
8. 旧仓的技能、设计、产品规则、契约、工作流和合规材料最后单独处理。它们不是任务 2 的导出输入，也不提前放进 `.local/`。

---

## 三、三套名字

三个名字解决三件不同的事，禁止互相替代。

| 名字 | 用途 | 禁止 |
| :--- | :--- | :--- |
| `Gods-Workbench` | 本地文件夹、Git 仓库、GitHub 仓库 | 用作 Python import 名或数据目录名 |
| `gods_workbench` | `import gods_workbench` | 为了少一层目录改成 `main` |
| `GodsWorkbench` | `%LOCALAPPDATA%\GodsWorkbench\` | 继续沿用 `GodsWorkbenchClear`，或每个阶段再换一个目录名 |

少一层目录的做法是把包从 `src/gods_workbench/` 升到仓库根的 `gods_workbench/`。import 语句保持不变，因此不产生大约 260 处 import 改写。`pyproject.toml` 声明该包，使根目录可直接执行 `uvicorn gods_workbench.api.app:app`。

---

## 四、名字与远程的前置门槛

远程 `Gods-Workbench` 已改名为 `Gods-Workbench-old20260927`，但本地尚未让出这个名字。在门槛完成前，禁止创建新的本地文件夹，也禁止在 GitHub 新建同名仓库。

2026-09-27 复核到的事实：

1. `D:\Working\Code Pro\Gods-Workbench` 仍是旧仓，分支 `main`，HEAD `2a95a2fcec8bc1d7fa82bad33281ee733ab79e99`。
2. 该目录 `origin` 仍是 `https://github.com/qinxuedong/Gods-Workbench.git`，工作区有未提交修改、删除和未跟踪调研文档。
3. `Gods-Workbench-release` 与 `Gods' Workbench-old-sealed-20260821` 的 `origin` 也仍指向上述旧地址。
4. `Gods-Workbench-clear` 的远程正确，指向 `Gods-Workbench-clear.git`；当时比 `origin/master` 超前 17 个提交，且工作区有大量未提交改动。

必须按这个顺序处理：

1. 旧目录里需要留下的未提交调研文档，单独复制到档案位置。它们不是新仓的输入。
2. 本地文件夹改名为 `Gods-Workbench-old20260927`。
3. 上述三个仍指向旧项目地址的本地克隆，把 `origin` 改为 `https://github.com/qinxuedong/Gods-Workbench-old20260927.git`，并删除 push URL。GitHub 改名后的旧地址跳转不可依赖。
4. `Gods-Workbench-clear` 先完成 Phase 12，形成一次明确的冻结提交，并打归档标签。标签记录完整提交哈希。
5. 只有此时，才允许新建本地 `Gods-Workbench` 和 GitHub 上一个**全新**的 `Gods-Workbench` 仓库。禁止把 `Gods-Workbench-old20260927` 再改回原名。

---

## 五、本期目标结构

本期是机械搬家。除第六节明确列出的运行数据、启动入口和 `v2` 标识符替换外，不改变分支、路由顺序、服务组合和断言。

```text
Gods-Workbench/
├── .github/
│   └── workflows/
│       └── ci.yml                         # 第一次提交就存在
├── .local/                                # Git 忽略；卫生门禁以 git ls-files 为准
│   ├── README.md                          # 唯一允许被跟踪的沙盒说明
│   ├── research/
│   ├── runtime-dev/
│   ├── notes/
│   ├── probes/
│   ├── logs/
│   └── tmp/
├── gods_workbench/                        # 去掉 src/；import 名不变
│   ├── api/                               # 本期保留现有路由模块，禁止合并
│   ├── core/
│   ├── asset_library/
│   ├── asset_registry/
│   ├── asset_review/
│   ├── canvas_closure/
│   ├── episode_pipeline/
│   ├── god_canvas/
│   ├── media/
│   ├── observability/
│   ├── projects_hub/
│   ├── prompt_library/
│   ├── settings/
│   └── 其余现有领域包
├── web/
│   ├── pages/                             # 原 static/v2 下 9 个主页面
│   ├── embeds/                            # 仅 embedded=1 时返回的 6 个内嵌页
│   ├── asset-share.html                   # 公开分享页，不进入上面的重定向
│   ├── css/
│   │   ├── base/
│   │   └── pages/
│   ├── js/
│   │   ├── core/
│   │   ├── controllers/
│   │   └── modules/
│   ├── prompt-registry/
│   ├── system-prompts/
│   └── vendor/
│       └── fonts/                         # 仅有的 3 个思源黑体白名单
├── docs/
│   ├── behavior/                          # 保留，含插件协议的排除状态
│   ├── contracts/
│   ├── fixtures/
│   ├── design/
│   ├── provenance/                        # 保留来源与授权账本
│   └── architecture/                      # 只放仍然有效的架构说明
├── scripts/
├── tests/
│   ├── conftest.py
│   ├── contracts/                         # 按域分目录；不把多个测试文件合成一个
│   │   ├── auth/
│   │   ├── projects/
│   │   ├── god_canvas/
│   │   ├── assets/
│   │   ├── episodes/
│   │   ├── prompts/
│   │   ├── observability/
│   │   └── settings/
│   ├── e2e/
│   └── hygiene/
├── .gitattributes
├── .gitignore
├── AGENTS.md
├── README.md                              # 只记录一行冻结提交溯源
├── pyproject.toml
├── requirements.txt
├── requirements-dev.txt
├── start.bat                              # 唯一逐路径放行的启动脚本
└── run.py
```

`attestations/` 留在封存的洁净仓，作为审计档案；新仓 README 用冻结标签指向它，不复制全过程报告。`HANDOFF*`、探针、带日期的任务单和这两份重整讨论稿也不进入新仓。

### 明确不在本期

- 不把 `routes_asset_library.py` 与 `routes_asset_library_b4.py` 这类双代路由合成一个服务。评审、提示词等同理。
- 不把观测域对项目、画布、资产服务的调用关系重写。
- 不调整 `app.py` 中画布路由的注册顺序。`/api/canvases/trash` 必须继续先于 `/{canvas_id}`。
- 不把约 40 个测试模块折成 8 个大文件。
- 不在本期把领域包再改成垂直切片四件套。那是测试已在新路径通过之后的另一次独立改动。

---

## 六、关键规范

### 1. 前端搬家与去 `v2`

搬家前从磁盘生成清单，禁止用手写的「9 个控制器、16 个页面」代替实际文件表。

页面分三类，行为必须原样保留：

1. **主页面**：原 `static/v2/*.html` 进入 `web/pages/`。对外 URL 从 `/static/v2/<name>.html` 改为 `/static/pages/<name>.html`。
2. **内嵌页**：`asset-manager`、`api-settings`、`canvas-list`、`episode-pipeline`、`task-center`、`governance` 进入 `web/embeds/`。不带 `embedded=1` 时 307 到对应主页面并保留原查询参数；带 `embedded=1` 时必须返回原文件，禁止重定向，避免 iframe 循环。
3. **公开分享页**：`asset-share.html` 保持直接返回，不进入上述重定向表。

旧的 `/static/v2/*` 只保留一个有失效条件的 307 兼容层。兼容层的删除条件写进测试名称或测试说明，不能变成永久第二套入口。

标识符替换至少覆盖脚本 URL、`window.V2Shell`、`window.V2Projects`、`window.V2TaskQueue`、`v2-shell-*`、`data-v2-*` 和实际扫描到的 `localStorage` 键。键改名时先读旧键、写入新键；旧键在兼容层删除前不主动清除。

CSS 与 JS 可以按 `base/pages`、`core/controllers/modules` 换目录，但只改路径和标识符，不顺手改页面逻辑。

### 2. 启动入口与 `.bat` 白名单

生产入口只保留根目录 `start.bat`，由它调用 `python run.py --prod --open-browser`。不再使用 `launch_workbench.pyw`，也不恢复旧的四段启动链。

`.bat`、`.cmd` 继续属于默认可执行脚本。卫生规则只增加这一条精确路径：

```text
start.bat
```

禁止按扩展名整体放行。

### 3. 数据根、迁移与三态隔离

所有持久化文件最终都落在唯一的 `storage.data_root()` 下。相对路径一律拒绝。

| 入口 | 数据位置 | 约束 |
| :--- | :--- | :--- |
| `pytest` | 每个用例自己的 `tmp_path` | 不能因为导入时已经读取环境变量而逃到用户目录 |
| `python run.py` | `<repo>/.local/runtime-dev/data` | 解析后必须仍在仓库的 `.local/runtime-dev/` 内 |
| `start.bat` 或 `python run.py --prod` | `%LOCALAPPDATA%\GodsWorkbench\data` | 解析后不得位于源码仓库内 |

现有 `%LOCALAPPDATA%\GodsWorkbenchClear` 不在启动时自动搬运。单独的迁移命令只做复制、写迁移回执、把旧目录保留为只读；复制失败时新目录不得被当成已迁移。

`--reset` 必须同时满足：命令行显式给出目标、目标解析后位于 `.local/runtime-dev/`、目标不是 `%LOCALAPPDATA%`。缺一项就拒绝，禁止靠默认路径猜测。

开发态和生产态使用不同的会话 Cookie 名。默认端口仍是 `2077`；同一台机器要同时运行两种状态时，第二个实例必须显式指定其他端口。

`storage.py` 现有的单进程一致性限制继续写在启动说明里。本期不引入多 worker，也不用进程内锁假装已解决多进程写入。

### 4. 防熵增门禁

`.gitignore` 忽略 `.local/*`，但保留 `.local/README.md`。测试断言的是 `git ls-files` 的结果，而不是「遍历文件系统时跳过目录」。已经跟踪的文件不会因为新的忽略规则自动消失。

根目录只允许本期目录树中的顶层项。新增临时文件的失败信息要指向 `.local/`。

施工痕迹守卫以路径段为单位，大小写不敏感：

- 整段等于 `tmp`、`temp`、`backup`、`draft`、`drafts`、`handoff` 时拒绝。
- 整段匹配 `handoff([._-].*)?`、`phase[0-9]+([._-].*)?` 时拒绝。
- 整段自身按分隔符拆开后含有独立记号 `v2` 时拒绝。
- 整段以 `_b` 加纯数字结尾时拒绝。

`template`、`attempt` 必须通过。此守卫只检查文件名和目录名。`v2` 的正文清理是第六节第 1 条的标识符清单，不拿这份文件名正则去扫描文档正文，否则迁移说明本身会被门禁拒绝。

另加两条架构守卫，替代被否决的四件套要求：

- 领域包之间不得新增循环导入。
- 不得新增第二套平行路由文件来承载同一领域。

### 5. 文档、CI 与发布身份

新仓保留 `docs/behavior/`、`docs/contracts/`、`docs/fixtures/`、`docs/design/` 和仍然有效的 `docs/provenance/`。`PLUGIN-PROTOCOL-SPEC.md` 继续是明确排除项，不因为换仓而变成实现任务。

过程性 `HANDOFF`、探针、一次性调研和会议过程稿留在封存仓。

第一次提交就包含只读 CI：卫生、结构、契约。`/healthz` 继续返回 `release_authorized: false`。README 不得写成已经允许公开分发。许可证、NOTICE、第三方清单和字体授权是独立门禁；目录重整通过不等于这四项通过。

---

## 七、执行前必须交付的四张表

任务 3 开始前，下列四张表必须已由脚本对照冻结提交生成，并有人工复核记录。没有表，不许宣称测试「100% PASS」就代表没有丢行为。

| 表 | 每一行必须回答 |
| :--- | :--- |
| 路径对照 | 旧路径、新路径、是移动还是删除、删除原因 |
| 测试对照 | 旧测试节点、新测试节点、断言是否原样保留 |
| 数据对照 | 旧文件或环境变量、新数据根中的位置、是否需要迁移命令 |
| 文档去留 | 留在新仓、留在封存仓，或明确排除；以及原因 |

---

## 八、分步执行任务

- [ ] **任务 0：让出 `Gods-Workbench` 这个名字**
  - 归档本地旧仓未提交且需要保留的调研文件。
  - 将 `D:\Working\Code Pro\Gods-Workbench` 改名为 `Gods-Workbench-old20260927`。
  - 把旧目录、`Gods-Workbench-release`、`Gods' Workbench-old-sealed-20260821` 的 `origin` 改到 `Gods-Workbench-old20260927.git` 并删除 push URL。
  - 确认 GitHub 上还不存在新的 `Gods-Workbench` 仓库。

- [ ] **任务 1：在洁净仓钉住行为，不改目录**
  - Phase 12 收官后形成冻结提交和归档标签。
  - 补齐路由对照、`embedded=1`、`asset-share`、画布回收站路由顺序、数据根不会落入用户目录的测试。
  - 生成第七节的四张对照表草稿。

- [ ] **任务 2：只从冻结提交导出新仓**
  - 使用 `git archive` 或等价的索引导出，源只能是任务 1 的冻结提交。
  - 在已经空出的路径创建 `Gods-Workbench`，执行 `git init`。
  - 不复制旧仓 `.git`，不打开旧 `Gods-Workbench` 源码做参照编辑。

- [ ] **任务 3：机械搬家**
  - 去掉 `src/`，保持 `import gods_workbench`。
  - 按第六节移动 `web/pages`、`web/embeds`、`asset-share.html`、CSS、JS 和 vendor。
  - 按标识符清单替换 `v2`，并加入旧键迁移。
  - 保留双代路由、服务边界和画布路由顺序。
  - 每改完一类路径，就对照四张表补记实际落点。

- [ ] **任务 4：测试分目录与卫生门禁**
  - 契约测试按域进入子目录，但不合并文件内容。
  - 更新字体白名单的新路径。
  - 落地 `start.bat` 逐路径白名单、路径段守卫、`git ls-files` 的 `.local/` 断言和循环导入守卫。

- [ ] **任务 5：三态数据根与一次性迁移**
  - 实现三个入口的路径约束、Cookie 隔离、显式 `--reset` 和独立迁移命令。
  - 用测试证明开发运行不会写入 `%LOCALAPPDATA%`，生产运行不会写入仓库。

- [ ] **任务 6：文档分流、CI 与未授权状态**
  - 按文档去留表迁入活文档，排除过程稿。
  - 写入正式 `README.md` 与 `AGENTS.md`；README 只保留冻结标签和提交哈希这一行溯源。
  - CI 在首个提交中运行卫生、结构和契约测试。
  - `/healthz` 的 `release_authorized` 保持 `false`。

- [ ] **任务 7：新仓回归**
  - 运行 `pytest -v`，契约、冒烟和卫生测试全部通过。
  - 用 `python run.py` 验证开发沙盒，并核对数据落在 `.local/runtime-dev/`。
  - 对照四张表确认没有未解释的删除。
  - 垂直切片合并、公开许可证和正式发布不在本任务内。

- [ ] **任务 8：旧仓知识材料（最后处理）**
  - 前置条件：任务 0 至任务 7 全部完成。未完成前不复制、不改写、不删除本节所列文件。
  - 来源只读：`D:\Working\Code Pro\Gods-Workbench`（任务 0 改名后为 `Gods-Workbench-old20260927`）。
  - 进入新仓前必须逐项审查来源、许可证、旧路径和与洁净仓现行规则的冲突。禁止整份复制。
  - 分类、候选和明确排除项见第九节。审查结论另行写入，不改变 `release_authorized: false`。

---

## 九、旧仓知识材料（任务 8，最后处理）

2026-09-28 只读盘点了 `D:\Working\Code Pro\Gods-Workbench`。本节只登记去留，不授权现在迁移。虚拟环境、wheel、缓存、临时目录和 `temp\codex\` 不在候选内。

### 1. 可重写后进入新仓的产品规则

| 旧位置 | 可保留的内容 | 重写前必须去掉 |
| :--- | :--- | :--- |
| `docs/USER-STORIES.md` | 用户、场景、验收口径 | 飞书快照、M3 施工记录、旧提交哈希 |
| `PRODUCT.md` | 用户、产品目的、反例、设计原则 | SIGNAL-FLOW、D350 |
| `docs/GLOBAL-ID-CONTRACT.md` | 稳定 ID 与 `global_id` 规则 | 与洁净仓现行契约冲突的并行口径 |
| `docs/AI-AUTOMATION-PLAN.md` | Agent、Skill、Hook、MCP 的权限边界 | 旧任务系统与旧路线图绑定 |
| `docs/LOCAL-CLIENT-AND-INTERACTION-PLAN.md` | 本地客户端与交互规划 | 旧仓范围和路径假设 |
| `docs/BACKUP-RESTORE.md` | 备份、恢复和灾备要求 | 旧部署路径 |
| `docs/OBSERVABILITY-CENTER-PLAN.md` | 日志、指标和任务可观测性 | 未批准的新依赖 |
| `docs/20万素材库性能治理计划.md` | 大库索引、分页、游标和性能门禁 | 不得插入任务 0 至任务 7 |
| `workflows/` 下的 ComfyUI JSON | 生成工作流资产 | 未审的模型、节点和第三方来源 |

### 2. 设计材料只提取规则

根目录 `DESIGN.md`、`docs/DESIGN-SYSTEM-INDEX.md`、`docs/UI-SKILLS-AND-DESIGN-ENGINEERING-GUIDE.md`、`docs/ICONIFY-INTEGRATION-GUIDE.md`、`docs/design-proposals/SIGNAL-FLOW-*`、`.impeccable/design.json`，以及 `temp/UI设计稿/` 下的 `DESIGN.md`，原件都留在旧仓。

允许提取黑金色值、24/18/14/12 字阶、24px 外边距、56px 行高、状态色和无障碍要求。禁止带入 `static/v2`、Outfit、Manrope、Iconify、Google Fonts、Unsplash、CDN 和 SIGNAL-FLOW 旧壳。洁净仓 `docs/design/` 是对照基线，不另建第二套设计真源。

### 3. 技能与代理规则

| 对象 | 处置 |
| :--- | :--- |
| `.agents/skills/gods-workbench/` 及其 references、根目录 `AGENTS.md` | 原件留旧仓。资产、架构、验证规则只能按新宪章择要重写 |
| `api-and-interface-design`、`code-review-and-quality`、`observability-and-instrumentation` | 上游为 `addyosmani/agent-skills`。先核许可证，优先放个人技能目录 |
| `impeccable` | 先核来源、许可证和脚本，不进产品仓 |
| `.agents/skills/references/` 的安全、性能、可观测性清单 | 审查清单候选，不直接启用 |
| `.claude/settings.local.json` | 本机配置，不迁移 |

### 4. 合规材料只作审查输入

`docs/open-source-commercialization/` 的许可证矩阵、来源审计、第三方准入模板和 Infinite-Canvas 洁净室研究，以及 `docs/security/route-permissions.*`，任务 8 可以读取。旧仓根 `LICENSE` 的自定义非商业条款不构成新仓发布许可。

### 5. 明确不进入新仓

`ROADMAP.md`、`M0` 至 `M3` 执行计划、飞书/GitHub/Discord 迁移记录、`docs/archive/`、`docs/report/`、`docs/演示归档/`、根目录 `GW-*` 报告、`CHANGELOG.md`、`RUNNING-NOTES.txt`、`docs/contracts/` 的旧 OpenAPI 快照与 draft、`docs/调研候选/`、`docs/research/`、`packages/`、虚拟环境、缓存、临时目录、`scripts/cutover_to_v2.py`。

### 6. 任务 8 的内部顺序

1. 产品不变量：用户故事、稳定 ID、备份恢复、自动化权限。
2. 设计差异：只保留与洁净仓不冲突的规则。
3. 通用技能：许可证、来源和脚本。
4. ComfyUI 工作流与第三方准入。
5. 路线图、施工日志和旧许可证全程留在旧仓。

---

## 十、以后继续开发的约束

1. 新功能落在现有领域包内；新的平行路由文件或循环导入直接由门禁失败。
2. 从封存的旧仓或洁净仓再取文件，仍按洁净室规则单独审查，不因为新文件夹已叫回原名就视为同库复制。
3. `.local/` 的内容默认每台机器不同，不能成为「只有我这里能跑」的隐藏依赖。
4. 多进程部署不在现有 JSON 存储的保证范围内。要开多个 worker，先单独更换具备事务的存储。
5. 公开发布以独立的授权结论为准。本计划全部完成后，发布状态仍然是未授权。
