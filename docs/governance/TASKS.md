# 任务台账
长说明见 `docs/governance/TASK-NOTES-2026-09-18.md`
- [x] T1 `/static/` 裸目录 404 可接受 —— 用户答复「ok」，详见 §8
- [x] T2 二进制资源合规 + V2 命名基线已做文档记录 —— 见 `docs/governance/BINARY-AND-NAMING-BASELINE-2026-09-18.md`
- [x] T3 前序变更盘点与文件治理 —— 见 `docs/governance/FILE-GOVERNANCE-2026-09-18.md` + 独立复核
- [x] T4 建立本 TASKS 台账 —— 见 `docs/governance/TASKS.md`
- [x] T5 按独立审核意见修正治理报告 + 产出二进制/命名基线文档 —— 见 `docs/governance/FILE-GOVERNANCE-REVIEW-2026-09-18.md`
- [x] T6 最终验收审核 + 复审确认 —— 详见 §8
- [x] T7 用户裁决落地：AGENTS.md 二进制白名单（仅 3 个思源黑体）+ 卫生用例白名单化 —— 见 `AGENTS.md`、`ALLOWED_BINARY_ALLOWLIST`
- [x] T8 用户裁决落地：清理 12 个图片资源并修复全部引用 —— 图片目录已空、`vendor/fonts/` 仅剩 3 个 otf（`Get-ChildItem`）
- [x] T9 命名断言改「影视工坊」已落地 —— 详见 §3
- [x] T10 提交一版（本地提交） —— 已完成，`git status --porcelain -uall` 为空；提交见 `git log --oneline -1`
- [~] T11 `main.py` 拆分进行中；Phase D 已收口（实测 56/60 迁出 + 4 设计保留），后续 Phase E–G —— 详见 TASK-NOTES §9
- [ ] T12（P1，破坏性，待用户确认）清理 `.git` 内 checkpoint 二进制 —— 详见 §2
- [ ] T13 旧集成标记卫生用例基线重定义（待裁决）—— 详见 §4
