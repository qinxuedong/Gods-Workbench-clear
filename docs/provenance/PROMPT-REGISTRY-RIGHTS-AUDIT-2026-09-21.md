# Prompt Registry 逐来源权利审查（2026-09-21）

> 依据：`docs/governance/AGENT-TASK-2026-09-21-PHASE7.md` §5；`HANDOFF-5.md` §5 第 4 条。
> 只做证据化登记；**不改变任何结论性权利判定**，也不删改提示词内容。

## 1. 范围与边界

- 快照：`src/gods_workbench/static/prompt-registry/`，`manifest.json` 记录
  `snapshotId=image-prompt-registry-2026-08-22`、`upstreamRegistry=https://github.com/yukkcat/image-prompts`、
  `upstreamRegistryHash=702d43e1146d42567b795c735bf50dec550901e34aff270656a4b4ef9cdbbd2e`、总数 **1230** 条。
- 本仓**只保存提示词文本与其元数据（JSON）**；**不复制任何图片 / 预览图**。
  所有条目中的 `coverUrl` / `referenceImageUrls` 均为**外部 URL**（见 §3），运行期由外部域名提供。
- `src/gods_workbench/static/prompt-registry/NOTICE.md` 明确：上游注册表（`yukkcat/image-prompts`）自身为 MIT，
  但**其 MIT 许可不重新授予上游提示词、图片、名称或其他材料的权利**；消费者仍须按各来源条款审查。

## 2. 逐来源登记与哈希核验（2026-09-21 自算）

核验命令等价于：对每个 `sources/*.json` 计算 SHA-256 并与 `manifest.json` 的 `sha256` 逐字比对；
同时对 JSON 条目数计数并与 `count` 比对。

| 来源 | 条目数 | 许可 | 维护者 | 主页 | 自算 SHA-256 == manifest | 条目数 == manifest | sourceUrl 随条目保留 |
|---|---:|---|---|---|---|---|---|
| Banana Prompt Quicker | 323 | MIT | glidea | https://glidea.github.io/banana-prompt-quicker/ | ✅ | ✅ | ✅（323 条） |
| Freestylefly GPT Image 2 | 523 | MIT | freestylefly | https://github.com/freestylefly/awesome-gpt-image-2 | ✅ | ✅ | ✅（523 条） |
| Awesome GPT Image | 53 | MIT | Zero Lu | https://github.com/ZeroLu/awesome-gpt-image | ✅ | ✅ | ✅（53 条） |
| Awesome GPT-4o Image Prompts | 76 | MIT | Awesome GPT4o Image Prompts | https://github.com/ImgEdify/Awesome-GPT4o-Image-Prompts | ✅ | ✅ | ✅（76 条） |
| YouMind GPT Image 2 | 126 | CC BY 4.0 | YouMind OpenLab | https://github.com/YouMind-OpenLab/awesome-gpt-image-2 | ✅ | ✅ | ✅（126 条） |
| YouMind Nano Banana Pro | 129 | CC BY 4.0 | YouMind OpenLab | https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts | ✅ | ✅ | ✅（129 条） |

**合计**：323 + 523 + 53 + 76 + 126 + 129 = **1230**，与 `manifest.json.total` 一致。
六个源文件的 SHA-256 与条目数**全部**与 `manifest.json` 记录一致（无漂移）。

## 3. 预览图 / 参考图权利链（实测）

每个源 JSON 的条目字段为：`id, sourceId, title, prompt, description, coverUrl, referenceImageUrls,
tags, author, sourceUrl, createdAt, imageMode, imageModel`。

- 全仓 `sources/*.json` 中**仅存在外部图片 URL 引用**，各源外部图片引用数为：
  Banana 239、Freestylefly 523、Awesome GPT Image 12、Awesome GPT-4o Image Prompts 76、
  YouMind GPT Image 2 190、YouMind Nano Banana Pro 254。
- 通过 `git ls-files` + 二进制扫描确认：**仓库内无任何图片文件**（`.png/.jpg/...` 计数 0），
  即**预览图未被复制进本仓**，仅以外部 URL 形式随提示词引用。

## 4. 结论（如实）

- 提示词**文本与元数据**受各自来源许可约束：4 个 MIT 来源 + 2 个 CC BY 4.0 来源。
- **CC BY 4.0 来源（YouMind × 2，共 255 条）**再分发时须保留署名（`author`/`sourceUrl` 已随条目保留）、
  链接许可证并说明修改（本快照只做格式转换与元数据补充）。
- **预览图 / 参考图**为外部 URL 引用，其**内容权利链未在本仓闭环**：本仓既未复制图片，也不对图片主张权利；
  图片可用性与权利由对应外部域名与来源方决定。该风险**不在本仓可控范围**内，登记为**待用户/法务裁决**。
- **本轮不宣称 prompt-registry 内容权利已闭环**：`yukkcat/image-prompts` 上游声明不重新授予上游权利，
  各来源条款仍须逐来源审查；公开发布仍受仓库总门禁（NOT AUTHORIZED FOR PUBLIC DISTRIBUTION）约束。
