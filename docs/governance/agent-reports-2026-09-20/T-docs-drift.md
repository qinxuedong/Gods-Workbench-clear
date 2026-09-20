# T-docs-drift —— 文档漂移盘点与更正（2026-09-20）

## 任务
用户裁决：3 个开源思源黑体可放行；修复治理文档与本裁决的漂移。权威口径为根 `AGENTS.md` §1.2（唯一白名单：`SourceHanSansCN-{Bold,Medium,Normal}.otf`）。

## 结论
**开源字体放行 ≠ 公开分发授权**；仓库发布状态仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

## 逐条盘点

| 文件 | 原文要点 | 判定 | 处理 |
|---|---|---|---|
| `CLEANROOM-CHARTER.md:5` | 「除 AGENTS.md 白名单…外，不得提交任何字体」 | 已白名单一致 | 无需改 |
| `CLEANROOM-STATUS.md:36` | 「字体仅允许 AGENTS.md §1.2 白名单的 3 个…其余一律禁止」 | 已白名单一致 | 无需改 |
| `README.md:44` | 「仅 AGENTS.md §1.2 白名单的 3 个…允许本地自托管」 | 已白名单一致 | 无需改 |
| `docs/design/README.md:33` | 「本目录严禁提交任何图片…字体仅允许 AGENTS.md §1.2 白名单的 3 个」 | 已白名单一致 | 无需改 |
| `docs/governance/BINARY-AND-NAMING-BASELINE-2026-09-18.md:51` | 称 `AGENTS.md §1.2` 是「零二进制硬红线」 | 历史快照，需追加指针 | 追加 2026-09-20 指针（未改写原文） |
| `docs/governance/FILE-GOVERNANCE-2026-09-18.md`（§6 记录） | 时点「3 个 OTF 入库」 | 历史快照，需追加指针 | 追加 2026-09-20 指针 |
| `docs/governance/FILE-GOVERNANCE-REVIEW-2026-09-18.md:46` | 记录「3 个 `.otf` 属违规」 | 历史快照，需追加指针 | 追加 2026-09-20 指针 |
| `attestations/reviews/PHASE-3-GATE-CHECK-2026-09-17.md:18` | 记录「无图片、字体资源」PASS | 历史快照，已有指针 | 已由既有「后续状态更新（2026-09-20）」覆盖 |
| `attestations/reviews/PHASE-6-TESTING-AUDIT-RECORD-2026-09-17.md:25` | G-6「全仓资产零二进制扫描」 | 历史快照，需追加指针 | 追加 2026-09-20 指针 |

## 处理原则
凡历史审计文档一律**追加指针、不改写历史**；仅纠正与当前 `AGENTS.md` §1.2 白名单冲突的时效表述。

## 证据边界
本盘点为本地只读检索 + 追加更正；不构成发布或生产验收。仓库仍为 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。
