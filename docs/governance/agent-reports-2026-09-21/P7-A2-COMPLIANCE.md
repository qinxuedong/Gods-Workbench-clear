# P7-A2 报告：可本地关闭的合规项证据化登记（2026-09-21）

> 角色：P7-A2 合规与 SBOM 工程师（本会话子代理委派不可用，由主代理 `/root` 亲自执行，见 §5）。
> 施工依据：`docs/governance/AGENT-TASK-2026-09-21-PHASE7.md` §5；`HANDOFF-5.md` §5 第 2、4 条。
> 基线：`b4c7153`。

## 1. `colorama==0.4.6` SPDX 落地

**实测依据**（`https://pypi.org/pypi/colorama/0.4.6/json`，2026-09-21）：

```text
info.license            = ''            （空）
info.license_expression = None
classifiers             = ['License :: OSI Approved :: BSD License']
```

**sdist 核对**：`colorama-0.4.6.tar.gz` 内含 `LICENSE.txt`
（SHA-256 `CAC35C02686E5D04A5A7140BFB3B36E73AED496656E891102E428886D7930318`），为 **3 条款 BSD** 正文
（源码再分发 / 二进制再分发 / 不得背书）；`PKG-INFO` 声明 `License-File: LICENSE.txt`。

**判定**：**BSD-3-Clause**（依据 sdist LICENSE 正文；上游元数据未给 SPDX id）。

**产物**：
- 在 `docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md` **末尾追加**「追加更正（2026-09-21，Phase 7）」一节（仅追加，未改历史行）。
- `docs/provenance/SBOM-2026-09-20.cdx.json` 中该组件许可证字段更正：

| 字段 | 更正前 | 更正后 |
|---|---|---|
| `licenses[0].license.name` | `未提供 SPDX id；见 classifier 记录` | `BSD 3-Clause License` |
| `licenses[0].license.id` | （不存在） | `BSD-3-Clause` |
| `properties` | 2 项 | 3 项（新增 `gw:license:spdx-evidence`） |

- JSON 合法性：`python -c "import json;json.load(open('docs/provenance/SBOM-2026-09-20.cdx.json',encoding='utf-8'))"` **通过**；
  组件总数仍为 **39**（未增删条目）。

## 2. prompt-registry 逐来源权利审查

新增 `docs/provenance/PROMPT-REGISTRY-RIGHTS-AUDIT-2026-09-21.md`，覆盖全部 **6 个来源**。

**哈希与条目数核验**（自算 SHA-256 与 `manifest.json` 比对）：

```text
banana-prompt-quicker        lic=MIT        count=323 actual=323 hash_ok=True
freestylefly-gpt-image-2     lic=MIT        count=523 actual=523 hash_ok=True
awesome-gpt-image            lic=MIT        count= 53 actual= 53 hash_ok=True
awesome-gpt4o-image-prompts  lic=MIT        count= 76 actual= 76 hash_ok=True
youmind-gpt-image-2          lic=CC-BY-4.0  count=126 actual=126 hash_ok=True
youmind-nano-banana-pro      lic=CC-BY-4.0  count=129 actual=129 hash_ok=True
sum counts: 1230  total(manifest): 1230
```

**预览图权利链**：全部 `coverUrl` / `referenceImageUrls` 均为**外部 URL**；仓库内**无任何图片文件**
（二进制扫描 `.png/.jpg/...` = 0），即**未复制任何预览图**。

**结论（如实）**：
- 提示词文本/元数据受各自来源许可约束（4×MIT + 2×CC BY 4.0）；CC BY 4.0 来源（YouMind ×2 = 255 条）再分发须署名并注明修改。
- 预览图/参考图为外链，**内容权利链不在本仓闭环**，登记为**待用户/法务裁决**。
- **本轮不宣称 prompt-registry 内容权利已闭环。**

## 3. 未改动清单（合规边界）

- **未创建**根级 `LICENSE` / `THIRD_PARTY_NOTICES.md`。
- **未删改**任何 `src/gods_workbench/static/prompt-registry/sources/*.json` 内容（仅只读核验）。
- **未改动** `AGENTS.md`、`docs/behavior/PLUGIN-PROTOCOL-SPEC.md`。

## 4. 门禁

```text
python -c "import json;json.load(open('docs/provenance/SBOM-2026-09-20.cdx.json',encoding='utf-8'))"  -> 通过
python -m pytest -q --no-header -p no:cacheprovider  -> 见主代理收口（含新增 Phase 7 契约测试）
```

## 5. 独立性问题声明（如实登记）

按任务书，P7-A2 应由子代理 `p7_a2_compliance` 承担；但本会话**子代理委派失败**
（多子代理、多渠道共 6 次尝试，任务正文均未送达，子代理仅收到 `AGENTS.md` 上下文）。
为避免空转，由**主代理 `/root`** 亲自执行，并在 `attestations/reviews/PHASE-7-INDEPENDENT-REVIEW-2026-09-21.md`
由独立复核章节对抗式验证。该偏差与 Phase 6 §9.1 同类，一并如实登记。

## 6. 待主代理提交的文件清单

1. `docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md`（追加更正节）
2. `docs/provenance/SBOM-2026-09-20.cdx.json`（colorama 许可证字段更正）
3. `docs/provenance/PROMPT-REGISTRY-RIGHTS-AUDIT-2026-09-21.md`（新增）
4. `docs/governance/agent-reports-2026-09-21/P7-A2-COMPLIANCE.md`（本报告）
