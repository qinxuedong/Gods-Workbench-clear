# Phase 12 PDF 修复方案（R3/R9，待独立设计复核）

## 已确认问题
- 注册表字体起点y760超出横向页面高度595，导出白页。
- 注册表和正文导出截断40行；中文以问号替换，不是无损ASCII转义。
- 本轮不增加仓库二进制，不扩大字体白名单，不复制第三方实现，不引入新的运行依赖。

## 拟实现
1. 三个导出面复用一个自研标准库文本PDF生成器：asset_registry、asset_library.content_pdf、asset_review交付。
2. 统一A4纵向595×842、页边距48、字号11、行距17，按安全字符宽度换行，每页最多42行，全部分页，不截断。
3. 以PDF标准Type0/CID字体及UniGB-UTF16-H编码显示中文与ASCII，使用阅读器的Adobe-GB1字体替代；不把非嵌入字体称为跨阅读器绝对字形一致。配ToUnicode映射保障文本提取。
4. 未承诺字形覆盖的字符使用明确可读的Unicode转义，不替换问号；PDF附带UTF-8原文source.txt，确保所有Unicode内容可无损取回。正文不执行JS、启动动作或外部链接。
5. 资源上限超出时标准错误拒绝，不静默截断。空数据仍生成明确空态文档。
6. 保留各路由权限/响应头；注册表X-PDF-Exported统计应与真实导出资产一致，未知ID处理明确，不能把未导出的项写成成功。

## 官方协议来源（只读规格，不复制实现）
- Adobe发布的ISO32000-1:2008，§9.7 Type0/CID、Table118 UniGB-UTF16-H、§9.10 ToUnicode、§7.11文件规范和嵌入文件：
  https://developer.adobe.com/document-services/docs/assets/35e4369068f86065372c18787171a17e/PDF_ISO_32000-1.pdf
- Adobe CMap官方资源README，UniGB-UCS2已建议迁往UTF16：
  https://github.com/adobe-type-tools/cmap-resources/blob/master/README.md

## 验收与边界
- 1/41/100条资产清单、长行、中文标题、括号反斜杠、Emoji等原文；断言页数/最后一条/未丢失字符/附件精确UTF8等价。
- 用独立PDF解析器提取文字，并实际渲染第一页/跨页尾页，像素不是全白且文字边界在纸面内；目视截图。
- 三个HTTP导出面使用合法实体夹具，保存到仓库外临时目录，中文响应文件名保持RFC5987；401/403门禁保留。
- PyMuPDF或其他解析器仅用于本机验收，不作为运行期新增依赖。若非嵌入字体方案未通过当前Chrome/PyMuPDF可读验收，不能声称解决R9；后续另评审嵌入现有许可字体，不私增依赖。


### 原文核实补充
主代理已用只读HTTP下载Adobe官方`https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf`到仓库外临时目录，并用本机PyMuPDF读取原文：第281页Table118明确UniGB-UTF16-H是Adobe-GB1的UTF-16BE映射；第300-301页ToUnicode；第89/111-112页EmbeddedFiles。原web工具返回空输出，不据此虚构引用。此规格核实不等于渲染验收，方案仍待独立复核。
