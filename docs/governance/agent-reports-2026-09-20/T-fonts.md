# T-fonts 完成报告（2026-09-20）

## 结论

T-fonts 已完成。本报告补齐任务书要求的输出文件；本次只写入本文件，未修改 `AGENTS.md` 白名单路径，也未修改其它仓库文件。依据任务书第二轮口径，3 个 Source Han Sans CN（思源黑体，OFL-1.1）本地字体属于明确放行项；仓库仍保持 **NOT AUTHORIZED FOR PUBLIC DISTRIBUTION**。

## 白名单与实际文件核对

`AGENTS.md` §1.2、`README.md`、设计文档及两个卫生用例均采用同一组逐条精确路径：

- `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Bold.otf`
- `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Medium.otf`
- `src/gods_workbench/static/vendor/fonts/SourceHanSansCN-Normal.otf`

当前工作区实际仅发现以上 3 个字体文件，均已被 Git 跟踪；未发现其它 `.ttf`、`.otf`、`.woff`、`.woff2` 或 `.eot` 文件。

| 文件 | 字节数 | SHA-256 |
| --- | ---: | --- |
| `SourceHanSansCN-Bold.otf` | 9,036,076 | `0972537EF0238CCF5B3B055CAFFC15B69E314AC676B0B9BAC8E5649D76E2F03A` |
| `SourceHanSansCN-Medium.otf` | 8,812,324 | `9CDEB297C219D4A73201C70F01A41F7B0D2FEAB5B0384312EE3E91971A8D037A` |
| `SourceHanSansCN-Normal.otf` | 8,806,392 | `DD058AC5FD8471302D4F8331384EFF3C594D6FC1FB90F1A3566832E8DA090FAB` |

字体内部 name table 均指向 `Source Han Sans CN`；本地加载配置 `src/gods_workbench/static/vendor/css/fonts.css` 只声明 400/500/700 三个字重，并分别指向上述 Normal/Medium/Bold 文件。

## 文档漂移处理口径

- 活跃规范、设计文档、白名单测试与运行期 `fonts.css` 已统一为“三个思源黑体本地字体”口径。
- `src/gods_workbench/static/vendor/MANIFEST.md` 中 Inter、JetBrains Mono、Space Grotesk 条目均明确标注为本地文件已不存在的历史记录，不属于当前白名单；三条 Source Han Sans CN 当前文件记录与实测哈希一致。
- `docs/governance/BINARY-AND-NAMING-BASELINE-2026-09-18.md` 属历史快照，不作为 2026-09-20 当前资源清单；本报告以当前工作区实测为准。
- 未改写根 `AGENTS.md`，符合“只修复文档漂移、不改白名单路径”的任务口径。

## 聚焦验证

已执行：

```text
python -m pytest -q --no-header -p no:cacheprovider tests/hygiene/test_cleanroom_hygiene.py::test_no_banned_binary_assets tests/hygiene/test_phase6_deep_hygiene.py::test_repo_wide_zero_binary_assets
..                                                                       [100%]
2 passed in 0.04s
```

未执行：全量 `pytest -v`、Node 全量语法检查、远端 CI、部署/生产验收；这些不属于本 T-fonts 聚焦验证范围。

## 证据边界

以上结论仅代表当前本地工作区快照。聚焦测试通过不等于独立第三方审计、远端 CI 通过或生产验收通过；也不构成公开发布授权。
