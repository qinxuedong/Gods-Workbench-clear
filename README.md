# Gods Workbench (洁净重构版)

本项目是依据《洁净实现章程》与《AGENTS.md》作业宪章完成的生产级重写版本。系统完全遵循脱源码规范、接口契约与黄金夹具驱动开发，具备高并发 CAS 乐观锁互斥保障、原生高质感前端与统一的 `god-canvas` 拓扑与智能编排引擎。

---

## 🌟 核心架构与设计特性

1. **统一画布引擎 (`god-canvas`)**：
   - 统一整合普通拓扑读写与智能异步任务流转；
   - 完美支持 JSON 与原生 `.godmap` 格式的无损导出、校验与反序列化还原；
   - 智能任务采用异步状态机（`202 Accepted` 受理、稳定 `job_id` 生成、轮询推进与终端不可逆保护）。
2. **CAS 乐观锁与并发安全保障**：
   - 项目与画布核心写操作严格校验 `expected_version`；
   - 多线程高并发竞争下原子自增，冲突时严格返回 `409 Conflict` 标准错误包，坚决杜绝静默覆盖或竞态穿透。
3. **极简原生前端 (Hardware Design System)**：
   - 恪守 KISS 原则，杜绝沉重的前端构建脚手架；
   - 基于原生 HTML5 + 现代 JavaScript + Tailwind CDN，采用黑金拟物科技硬件设计风格；
   - 零本地受限二进制资源（字体/图标全部走 CDN）。
4. **统一规范与稳定 ID 体系**：
   - 核心生产链路实体 ID 严格标准化：`project_id`、`canvas_id`、`entity_id`、`job_id`、`asset_id`；
   - 统一默认运行端口固定为 **`2077`**。

---

## 🚀 快速启动

### 运行环境要求
- Python 3.11+
- FastAPI、Uvicorn、Pydantic v2、Pytest

### 一键启动
在项目根目录下直接运行：
```powershell
python run.py
```
服务启动后默认监听于：**`http://127.0.0.1:2077`**

### 访问入口
- **前端项目中心**：`http://127.0.0.1:2077/`（自动 307 重定向至 `/projects.html`）
- **画布工作台**：`http://127.0.0.1:2077/workshop.html`
- **交互式 API 文档**：`http://127.0.0.1:2077/docs`

---

## 🧪 自动化测试与质量门禁

运行全仓自动化契约测试与防污染深度审计：
```powershell
pytest -v
```
全量测试套件覆盖：
- 黄金夹具解析与契约一致性校验
- 多线程高并发 CAS 乐观锁并发写入互斥压测
- 百级大规模拓扑图与 `.godmap` 格式编解码闭环
- 智能任务状态机全生命周期（`accepted` -> `running` -> `completed` / `cancelled`）
- 全仓零受限二进制资产扫描（图片/字体/二进制扫描）
- 固定 2077 端口与统一实体 ID 规范审计

---

## 📜 洁净室合规证明链索引

本项目历经严格的洁净室开发流程，全链路各阶段均已落盘书面独立审查与核验记录：

| 阶段 | 阶段名称 | 核心产出与独立审核记录 |
| :--- | :--- | :--- |
| **Phase 1** | 洁净实现章程与边界 | `CLEANROOM-CHARTER.md` |
| **Phase 2** | 脱源码规范与黄金夹具 | `docs/provenance/PHASE-2-INPUT-REGISTER.md` (16 项材料 SHA-256 冻结) |
| **Phase 3** | 契约冻结审查 | `attestations/reviews/PHASE-3-CONTRACT-FREEZE-REVIEW.md` (四独立角色签署) |
| **Phase 4** | 工程脚手架与数据模型 | `attestations/reviews/PHASE-4-SCAFFOLDING-RECORD-2026-09-17.md` |
| **Phase 5** | 最小垂直切片实现 | `attestations/reviews/PHASE-5-VERTICAL-SLICE-RECORD-2026-09-17.md` |
| **Phase 6** | 全面测试与契约质量门禁 | `attestations/reviews/PHASE-6-TESTING-AUDIT-RECORD-2026-09-17.md` |
| **Phase 7** | 发布审计与就绪授权 | `attestations/reviews/PHASE-7-FINAL-RELEASE-AUTHORIZATION-2026-09-17.md` |
