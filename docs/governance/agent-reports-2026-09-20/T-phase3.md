# T-phase3 执行报告（2026-09-20）

## 交付判定

已按授权产出重签记录、当前快照审计，并仅在两个历史报告末尾追加指针。**审计动作已完成，但测试门禁受阻，Phase 3 冻结未批准、T-scope 依赖未验收。不能宣称“全部门禁通过”。**

- HEAD：`cde7433cd24e297ceeabd248365908a8da006813`；分支：`master`。
- 主采集窗口：`2026-09-20T17:59:44.059049+08:00` 至 `2026-09-20T17:59:47.407024+08:00`（UTC+08:00）。补充取证：`2026-09-20T18:01:47.575761+08:00` 至 `2026-09-20T18:01:47.731424+08:00`。
- 绑定的是上述 HEAD **加当时的未提交/未跟踪工作树**，不是干净提交。工作树由其他任务并行修改，不是原子快照；不得把本报告推广为后续文件版本的验收。
- 只读审计当前洁净仓；没有读取旧仓源码/提交历史。未修改契约、夹具、业务实现或门禁状态。

## 写入范围

新增（仅本任务所有）：
- `attestations/reviews/PHASE-3-CONTRACT-RE-FREEZE-2026-09-20.md`
- `attestations/reviews/CURRENT-SNAPSHOT-AUDIT-2026-09-20.md`
- `docs/governance/agent-reports-2026-09-20/T-phase3.md`

仅尾部追加 `## 后续状态更新（2026-09-20）`，原始字节前缀不改：
- `attestations/reviews/PHASE-3-CONTRACT-FREEZE-REVIEW.md`
- `attestations/reviews/PHASE-3-GATE-CHECK-2026-09-17.md`

没有操作索引/提交/远端，没有派生代理，没有使用 orca；自写脚本和采集 JSON 均位于系统临时目录，没有新增仓库脚本或其他输出。

## 实测摘要

- HEAD、分支、工作树、文件计数：详见快照报告的原始 snapshot-start/end 输出。
- 输入哈希 16/16 一致；9 个清单夹具可 JSON 解析；有限错误包静态检查通过。
- 14 条契约 method/path 均在源码找到；源码共 18 条路由，枚举含文件行号。
- 资源候选只有精确白名单 3 个字体，另有 33 个运行期 .pyc 缓存单列。插件协议标记 0 命中。
- 全部保留独立 JS 语法检查主窗口为 56 项、0 失败；其后他人继续改动，因此不是最终文件版本保证。
- 卫生/黄金夹具/边界 pytest 都因缺失 pytest 退出 1；`pytest -v` 进程未启动；动态 API 探针因缺失 fastapi 退出 1。**没有可报告的本轮测试通过数。**
- 发现契约允许省略导入 CAS、异步返回 200/可选 poll_hint，与根规约不完全一致；当时仍有 2 处 RunningHub 已删路径引用。问题写入报告，未越界修复。
- 自动化签署身份明确为“自动化 Codex 子代理会话身份”；机器自证不等于独立第三方审计，后续要求人工外审。

## 环境异常与动作边界

首次直接调用 `python` 时，PowerShell 原始错误为：
```text
The term 'python' is not recognized as a name of a cmdlet, function, script file, or executable program.
```
`py -0p` 原始输出为：
```text
No installed Pythons found!
```
随后只在命令进程 PATH 中加入 Codex 已有运行时 Python 路径，没有写系统环境：
```powershell
$pyRoot='C:\Users\qinxuedong\.cache\codex-runtimes\codex-primary-runtime\dependencies\python'
$env:PATH="$pyRoot;$pyRoot\Scripts;$env:PATH"
$env:PYTHONDONTWRITEBYTECODE='1'
$env:PYTHONIOENCODING='utf-8'
```
实际运行时为 Python 3.12.14，不是项目要求的 3.11。Python 3.11 启动权限拒绝的原文在重签报告 supplement。没有安装依赖、复制解释器绕过限制或修改配置。`Get-Content pyproject.toml` 和初次读取 T-scope 报告均因文件不存在失败，不作为验证通过依据。

Anytype 只读查询 `Gods-Workbench-clear` 返回 `fetch failed`；本地记忆轻量检索没有用作本轮事实依据。所有结论来自当前仓库及命令输出，不使用历史测试数字。

## 全部采集命令索引

下表退出码 `未启动` 是 OS 启动失败，没有伪造测试进程返回值；最初采集器打印的 127 已明确为内部占位，正式报告不把它当 pytest 退出码。

| 取证项 | 开始时间 | 实际退出码 | 原始输出位置 |
|---|---|---|---|
| snapshot-start | 2026-09-20T17:59:44.059049+08:00 | 0 | 快照审计（重签报告亦附相关门禁） / 同名小节 |
| hygiene | 2026-09-20T17:59:44.303106+08:00 | 1 | 快照审计（重签报告亦附相关门禁） / 同名小节 |
| hashes | 2026-09-20T17:59:44.325429+08:00 | 0 | 重签报告 / 同名小节 |
| routes-contracts-fixtures | 2026-09-20T17:59:44.376365+08:00 | 0 | 重签报告 / 同名小节 |
| golden-fixtures | 2026-09-20T17:59:44.432420+08:00 | 1 | 快照审计（重签报告亦附相关门禁） / 同名小节 |
| boundaries | 2026-09-20T17:59:44.453112+08:00 | 1 | 快照审计（重签报告亦附相关门禁） / 同名小节 |
| full-suite | 2026-09-20T17:59:44.473750+08:00 | 未启动 | 快照审计（重签报告亦附相关门禁） / 同名小节 |
| resources-static-js | 2026-09-20T17:59:44.479762+08:00 | 0 | 快照审计（重签报告亦附相关门禁） / 同名小节 |
| runtime-probes | 2026-09-20T17:59:47.115164+08:00 | 1 | 快照审计（重签报告亦附相关门禁） / 同名小节 |
| snapshot-end | 2026-09-20T17:59:47.162193+08:00 | 0 | 快照审计（重签报告亦附相关门禁） / 同名小节 |
| supplement | 2026-09-20T18:01:47.575761+08:00 | 0 | 重签报告 / 同名小节 |

## 复现脚本

以下为本轮实际使用的脚本源码；临时文件可能被系统清理，故将源码嵌入报告。脚本的运行/失败证据均见上述原文，**存在请求代码不代表请求执行过**。`routes` 分支仅提取 YAML 的 method/path/meta，输出的状态/请求/查询 None 表示脚本未提取这些字段，不代表契约缺少字段；真实字段另以带行号源码核对。

### audit.py

实际临时路径：`C:\Users\QINXUE~1\AppData\Local\Temp\gw-t-phase3-fd075b99940d4b089de2b76752d99517\audit.py`；SHA-256：`91e440120a017635adc6c399cb1fb86d3b6e4a6d42cd7e1abb6eadcb04c75087`。

```python
import ast, datetime, hashlib, json, os, pathlib, re, subprocess, sys
ROOT = pathlib.Path.cwd()
OUT = pathlib.Path(__file__).parent
os.environ['PYTHONDONTWRITEBYTECODE'] = '1'
os.environ['PYTHONIOENCODING'] = 'utf-8'
os.environ['PYTEST_ADDOPTS'] = '-p no:cacheprovider'
sys.dont_write_bytecode = True
sys.path.insert(0, str(ROOT / 'src'))
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def stamp(): return datetime.datetime.now().astimezone().isoformat()
def paths(): return sorted(p for p in ROOT.rglob('*') if p.is_file() and '.git' not in p.relative_to(ROOT).parts)
def inventory(): return {p.relative_to(ROOT).as_posix():sha(p) for p in paths() if '__pycache__' not in p.parts and '.pytest_cache' not in p.parts}
def snap():
    for cmd in [['git','rev-parse','HEAD'],['git','branch','--show-current'],['git','status','--porcelain','-uall'],['git','diff','--stat']]:
        p=subprocess.run(cmd,capture_output=True,text=True,encoding='utf-8'); print('$ '+' '.join(cmd)); print(p.stdout,end=''); print(p.stderr,end=''); print('退出码:',p.returncode)
    p=subprocess.run(['git','ls-files','-z'],capture_output=True)
    files=p.stdout.decode('utf-8').split('\0'); files=[x for x in files if x]
    print('git ls-files -z 退出码:',p.returncode,'索引路径数:',len(files),'磁盘仍存在:',sum((ROOT/x).is_file() for x in files),'索引列出但磁盘不存在:',sum(not (ROOT/x).is_file() for x in files))
    print('git ls-files 原始输出 SHA-256:',hashlib.sha256(p.stdout).hexdigest())
    print('磁盘文件数（排除 .git，包含忽略缓存）:',len(paths()))
    print('磁盘文件数（再排除 __pycache__ / .pytest_cache）:',len(inventory()))
    print('静态层磁盘文件数:',sum(p.is_file() for p in (ROOT/'src/gods_workbench/static').rglob('*')))
    for rel in ['docs/governance/agent-reports-2026-09-20/T-scope.md','docs/provenance/STATIC-SCOPE-REGISTRY-2026-09-20.md']:
        p=ROOT/rel; print(rel,'存在='+str(p.exists()),'SHA-256='+sha(p) if p.is_file() else '')

def hashes():
    entries=re.findall(r'^([0-9a-fA-F]{64})\s+(.+)$',(ROOT/'docs/provenance/PHASE-2-INPUT-SHA256.txt').read_text(encoding='utf-8'),re.M)
    ok=0
    for expected,rel in entries:
        rel=rel.strip(); actual=sha(ROOT/rel) if (ROOT/rel).is_file() else 'MISSING'; match=actual==expected.lower(); ok+=match
        print(('PASS' if match else 'FAIL'),rel,'登记='+expected,'实算='+actual)
    print('项目数:',len(entries),'匹配:',ok,'不匹配:',len(entries)-ok)
    if len(entries)!=16 or ok!=16: sys.exit(1)

def routes():
    found=set()
    for p in sorted((ROOT/'src/gods_workbench/api').glob('*.py')):
        tree=ast.parse(p.read_text(encoding='utf-8')); prefixes={}
        for n in ast.walk(tree):
            if isinstance(n,ast.Assign) and isinstance(n.value,ast.Call) and isinstance(n.value.func,ast.Name) and n.value.func.id=='APIRouter':
                prefixes[n.targets[0].id]=next((ast.literal_eval(k.value) for k in n.value.keywords if k.arg=='prefix'),'')
        for n in ast.walk(tree):
            if not isinstance(n,(ast.FunctionDef,ast.AsyncFunctionDef)): continue
            for d in n.decorator_list:
                if not isinstance(d,ast.Call) or not isinstance(d.func,ast.Attribute) or d.func.attr not in ['get','post','put','patch','delete','options','head']: continue
                prefix=prefixes.get(getattr(d.func.value,'id',''),''); route=prefix+ast.literal_eval(d.args[0]); method=d.func.attr.upper(); found.add((method,route))
                print(f'{method} {route} | {p.relative_to(ROOT).as_posix()}:{d.lineno} | {n.name}')
    print('源文件装饰器路由总数:',len(found))
    contracts=set()
    for p in sorted((ROOT/'docs/contracts').glob('*.yaml')):
        text=p.read_text(encoding='utf-8')
        data={'meta':{k:re.search(r'^  '+k+r': (.+)$',text,re.M).group(1) for k in ['review_status','distribution']},'interfaces':[]}
        for chunk in re.split(r'^  - name: ',text,flags=re.M)[1:]:
            item={k:re.search(r'^    '+k+r': (.+)$',chunk,re.M).group(1) for k in ['method','path']}
            data['interfaces'].append(item)
        print(p.relative_to(ROOT).as_posix(),json.dumps(data['meta'],ensure_ascii=False),'（标准库按字段读取，不冒充 YAML 解析器验证）')
        for item in data['interfaces']:
            pair=(item['method'],item['path']); contracts.add(pair)
            print('契约',*pair,'有实现='+str(pair in found),'状态='+str(item.get('status')),'请求='+str(item.get('body')),'查询='+str(item.get('query')))
    print('契约端点数:',len(contracts),'缺失:',sorted(contracts-found),'实现增量:',sorted(found-contracts))
    manifest=json.loads((ROOT/'docs/fixtures/GOLDEN-FIXTURE-MANIFEST.json').read_text(encoding='utf-8'))
    print('夹具元数据:',json.dumps(manifest['meta'],ensure_ascii=False))
    for item in manifest['fixtures']:
        p=ROOT/'docs/fixtures'/item['file']; value=json.loads(p.read_text(encoding='utf-8')); print('夹具可解析',item['file'],'顶层键='+str(sorted(value)))
    print('清单夹具数:',len(manifest['fixtures']))
    for rel in ['docs/contracts/CANVAS-INTERFACE-CATALOG.yaml','src/gods_workbench/api/routes_god_canvas.py','src/gods_workbench/api/routes_projects.py','src/gods_workbench/api/app.py','src/gods_workbench/core/auth.py','tests/hygiene/test_cleanroom_hygiene.py']:
        for i,line in enumerate((ROOT/rel).read_text(encoding='utf-8').splitlines(),1):
            if any(token in line for token in ['expected_version:', 'poll_hint:', 'response_200:', 'authorization ==', 'frozen_contracts', 'release_authorized', 'credential.strip()', 'X-User-Role', 'comfyui', 'runninghub']): print(f'观察 {rel}:{i}: {line.strip()}')

def scan():
    allowed={'src/gods_workbench/static/vendor/fonts/SourceHanSansCN-'+x+'.otf' for x in ['Bold','Medium','Normal']}
    ext=set('.png .jpg .jpeg .gif .webp .bmp .ico .avif .tif .tiff .heic .psd .pdf .ttf .otf .woff .woff2 .eot .mp3 .wav .ogg .flac .aac .m4a .mp4 .mov .avi .mkv .webm .zip .7z .rar .tar .gz .exe .dll .so .dylib .bin .wasm'.split())
    suspect=[]; caches=[]; bans=[]
    for p in paths():
        rel=p.relative_to(ROOT).as_posix()
        if p.suffix.lower()=='.pyc': caches.append(rel); continue
        raw=p.read_bytes()
        if p.suffix.lower() in ext or b'\0' in raw:
            suspect.append(rel); permitted=rel in allowed
            if not permitted: bans.append(rel)
            print('资源候选',rel,'字节='+str(len(raw)),'白名单='+str(permitted),'SHA-256='+hashlib.sha256(raw).hexdigest())
    print('资源候选数:',len(suspect),'非白名单候选数:',len(bans),'运行期 .pyc 缓存数（不计入资源授权）:',len(caches))
    print('扫描：排除 .git，.pyc 单列；扩展名集合='+','.join(sorted(ext))+'；另检所有非 .pyc 文件的 NUL 字节；不等于所有编码资源的完整取证。')
    markers=['PluginProtocol','plugin_connector','PLUGIN-PROTOCOL-SPEC']
    matches=[]; residual=[]; api=[]
    static=ROOT/'src/gods_workbench/static'
    for p in sorted((ROOT/'src').rglob('*')):
        if not p.is_file() or p.suffix.lower() not in {'.py','.html','.js','.css','.json'}: continue
        for i,line in enumerate(p.read_text(encoding='utf-8').splitlines(),1):
            for term in markers:
                if term in line: matches.append(f'{p.relative_to(ROOT).as_posix()}:{i}: {term}')
            if static in p.parents:
                for term in ['/static/runninghub/','comfyui-settings.html','comfyui-settings.js','comfyui-settings.css']:
                    if term in line: residual.append(f'{p.relative_to(ROOT).as_posix()}:{i}: {term}')
                if '/api/' in line: api.append(f'{p.relative_to(ROOT).as_posix()}:{i}: {line.strip()[:240]}')
    print('插件协议标记命中数:',len(matches)); print('\n'.join(matches))
    print('删除路径残留引用数:',len(residual)); print('\n'.join(residual))
    for rel in ['comfyui-settings.html','css/comfyui-settings.css','js/comfyui-settings.js','js/i18n/comfyui-settings.js','runninghub']:
        print('删除目标',rel,'仍存在='+str((static/rel).exists()))
    print('静态 /api/ 文字命中行数:',len(api),'（仅词法观察，不推断完整浏览器调用图）')
    print('\n'.join(api[:45]))
    js=sorted(static.rglob('*.js')); failed=[]
    for p in js:
        r=subprocess.run(['node','--check',str(p)],capture_output=True,text=True,encoding='utf-8')
        print('node --check',p.relative_to(ROOT).as_posix(),'退出码='+str(r.returncode))
        if r.stdout: print(r.stdout,end='')
        if r.stderr: print(r.stderr,end='')
        if r.returncode: failed.append(p.relative_to(ROOT).as_posix())
    print('JS 检查总数:',len(js),'失败:',len(failed))

def probes():
    from fastapi.testclient import TestClient
    from gods_workbench.api.app import create_app
    from gods_workbench.god_canvas.service import default_god_canvas_service
    from gods_workbench.projects_hub.service import default_projects_service
    import inspect
    print('服务构造签名:',inspect.signature(type(default_god_canvas_service)),inspect.signature(type(default_projects_service)))
    client=TestClient(create_app())
    auth={'Authorization':'Bearer phase3-local-test','X-User-Role':'editor'}
    def call(method,path,**kw):
        r=client.request(method,path,**kw); value=r.json(); print(method,path,'HTTP',r.status_code,json.dumps(value,ensure_ascii=False)); return value
    call('GET','/healthz')
    for p in ['/api/asset-registry/projects','/api/canvases?project_id=prj-0001']:
        r=client.get(p); print('无会话 GET',p,'HTTP',r.status_code,'响应顶层键='+str(sorted(r.json())))
    payload={'name':'Phase3 本地内存验证','project_type':'other'}
    call('POST','/api/asset-registry/projects',json=payload)
    call('POST','/api/asset-registry/projects',json=payload,headers={**auth,'X-User-Role':'readonly'})
    p=call('POST','/api/asset-registry/projects',json=payload,headers=auth)['project']
    call('PATCH','/api/asset-registry/projects/'+p['project_id'],json={'name':'CAS 验证','expected_version':p['version']+99},headers=auth)
    c=call('POST','/api/canvases',json={'project_id':p['project_id'],'title':'Phase3 内存画布','mode':'classic'},headers=auth)['canvas']; cid=c['canvas_id']
    call('PATCH','/api/canvases/'+cid,json={'expected_version':c['version']+99,'nodes':[],'connections':[]},headers=auth)
    c=call('PATCH','/api/canvases/'+cid,json={'expected_version':c['version'],'nodes':[{'entity_id':'phase3-node','kind':'input'}],'connections':[]},headers=auth)['canvas']
    call('POST','/api/canvases/'+cid+'/tasks',json={'entry_nodes':['phase3-node'],'run_mode':'single'},headers=auth)
    call('POST','/api/canvases/'+cid+'/workflow/import',content=json.dumps({'canvas_id':cid,'version':c['version'],'nodes':[{'entity_id':'phase3-node','kind':'input'}],'connections':[]}),headers=auth)
    call('PATCH','/api/canvases/'+cid,json={'nodes':[],'connections':[]},headers=auth)
    call('GET','/api/phase3-nonexistent')
    print('说明：上述写请求仅作用于独立 Python 进程内存，不访问运行服务、不持久化项目、不记录真实凭据。')

if len(sys.argv)>1:
    globals()[sys.argv[1]](); sys.exit()
initial=inventory(); (OUT/'initial.json').write_text(json.dumps(initial,ensure_ascii=False,indent=2),encoding='utf-8')
records=[]
def run(name,args):
    start=stamp()
    try: r=subprocess.run(args,capture_output=True,text=True,encoding='utf-8')
    except OSError as exc: r=subprocess.CompletedProcess(args,127,'',repr(exc))
    end=stamp()
    item={'name':name,'command':subprocess.list2cmdline(args),'start':start,'end':end,'code':r.returncode,'stdout':r.stdout,'stderr':r.stderr}
    records.append(item); (OUT/'evidence.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
    print(name,'退出码='+str(r.returncode),start); print(r.stdout[-2200:]); print(r.stderr[-1000:])
for name,args in [
    ('snapshot-start',['python',__file__,'snap']),
    ('hygiene',['python','-m','pytest','tests/hygiene/test_cleanroom_hygiene.py','-q']),
    ('hashes',['python',__file__,'hashes']),
    ('routes-contracts-fixtures',['python',__file__,'routes']),
    ('golden-fixtures',['python','-m','pytest','tests/contracts/test_golden_fixtures.py','-v']),
    ('boundaries',['python','-m','pytest','tests/contracts/test_remediation_boundaries.py','-v']),
    ('full-suite',['pytest','-v']),
    ('resources-static-js',['python',__file__,'scan']),
    ('runtime-probes',['python',__file__,'probes']),
    ('snapshot-end',['python',__file__,'snap'])
]: run(name,args)
print('证据目录:',OUT)
```
### supplement.py

实际临时路径：`C:\Users\QINXUE~1\AppData\Local\Temp\gw-t-phase3-fd075b99940d4b089de2b76752d99517\supplement.py`；SHA-256：`565ef3a36f2d8620ab615cfb04c892ffbc48204d5d1adf65a6dafce88b647402`。

```python
import datetime, hashlib, json, os, pathlib, re, subprocess, sys
root=pathlib.Path.cwd(); out=pathlib.Path(__file__).parent
print('解释器:',sys.executable); print('Python:',sys.version)
for command in [['node','--version'],['git','--version'],[r'C:\Users\qinxuedong\AppData\Local\Programs\Python\Python311\python.exe','--version']]:
    print('$',subprocess.list2cmdline(command))
    try:
        r=subprocess.run(command,capture_output=True,text=True,encoding='utf-8'); print('退出码:',r.returncode); print(r.stdout,end='');print(r.stderr,end='')
    except OSError as e: print('进程未启动:',repr(e))
checks={
'canvas-auth-401.json':'UNAUTHORIZED',
'canvas-forbidden-403.json':'FORBIDDEN',
'canvas-save-conflict-409.json':'CANVAS_VERSION_CONFLICT',
'projects-hub-update-conflict-409.json':'VERSION_CONFLICT'}
for file,code in checks.items():
    data=json.loads((root/'docs/fixtures'/file).read_text(encoding='utf-8')); ok=isinstance(data.get('detail'),dict) and data['detail'].get('code')==code and bool(data['detail'].get('message'))
    print('错误夹具结构',file,'预期='+code,'满足='+str(ok),json.dumps(data,ensure_ascii=False))
    assert ok
p=json.loads((root/'docs/fixtures/canvas-task-accepted-202.json').read_text(encoding='utf-8'))
assert p.get('job_id') and p.get('poll_hint') and p.get('state')=='accepted'
print('异步夹具结构 PASS',json.dumps(p,ensure_ascii=False),'（HTTP 状态码未动态测试）')
for rel,start,end in [
('docs/contracts/CANVAS-INTERFACE-CATALOG.yaml',153,180),
('src/gods_workbench/api/routes_god_canvas.py',175,218),
('src/gods_workbench/core/auth.py',23,53),
('src/gods_workbench/api/app.py',24,51),
('src/gods_workbench/static/v2/js/projects-controller.js',1,40)]:
    lines=(root/rel).read_text(encoding='utf-8').splitlines()
    for i in range(start,min(end,len(lines))+1): print(f'{rel}:{i}: {lines[i-1]}')
for rel in ['src/gods_workbench/god_canvas/service.py','src/gods_workbench/static/v2/js/projects-controller.js']:
    for i,line in enumerate((root/rel).read_text(encoding='utf-8').splitlines(),1):
        if any(x in line for x in ['expected_version is not None','def restore_canvas','def import_workflow','/api/','expected_version']): print(f'{rel}:{i}: {line.strip()}')
initial=json.loads((out/'initial.json').read_text(encoding='utf-8')); current={}
for p in sorted(root.rglob('*')):
    if not p.is_file() or any(x in p.relative_to(root).parts for x in ['.git','__pycache__','.pytest_cache']): continue
    current[p.relative_to(root).as_posix()]=hashlib.sha256(p.read_bytes()).hexdigest()
changed=[k for k in sorted(set(initial)|set(current)) if initial.get(k)!=current.get(k)]
print('自采集初始时点以来工作树文件内容变化（本会话尚未写仓库）:',json.dumps(changed,ensure_ascii=False))
for rel in sorted(current):
    if rel.startswith(('src/gods_workbench/api/','src/gods_workbench/core/','src/gods_workbench/god_canvas/','src/gods_workbench/projects_hub/')) or rel in ['AGENTS.md','tests/hygiene/test_cleanroom_hygiene.py','src/gods_workbench/static/js/api-settings.js','docs/governance/AGENT-TASK-2026-09-20.md']:
        print('复核文件 SHA-256',rel,current[rel])
print('非缓存磁盘清单数量:',len(current),'清单规范 JSON SHA-256:',hashlib.sha256(json.dumps(current,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest())
```

## 后续收口

由主代理提供可执行的 Python 3.11 测试环境，并待 T-scope 最终版本后重新跑卫生、黄金夹具、全量测试与 JS 检查；对契约差异请用户/人工外审裁决。本会话未关闭阶段、未授权公开分发。

## 文档写入后复验（追加证据）

本节记录写入文档后的真实尝试；不把环境缺失误记为用例失败或用例通过。快照中的本报告字节数不含本节追加内容。

### `pytest -v`

时点：2026-09-20T18:06:35.541789+08:00；退出码：未启动，无进程退出码。

标准输出：
```text
（空）
```

标准错误：
```text
PermissionError(13, '拒绝访问。', None, 5, None)
```

### `python -m pytest -v`

时点：2026-09-20T18:06:35.546868+08:00；退出码：1。

标准输出：
```text
（空）
```

标准错误：
```text
C:\Users\qinxuedong\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe: No module named pytest
```

### `python -m pytest tests/hygiene/test_cleanroom_hygiene.py -q`

时点：2026-09-20T18:06:35.568102+08:00；退出码：1。

标准输出：
```text
（空）
```

标准错误：
```text
C:\Users\qinxuedong\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe: No module named pytest
```

### `python C:\Users\QINXUE~1\AppData\Local\Temp\gw-t-phase3-fd075b99940d4b089de2b76752d99517\audit.py hashes`

时点：2026-09-20T18:06:35.589178+08:00；退出码：0。

标准输出：
```text
PASS docs/behavior/BEHAVIOR-SPEC-PRODUCTION-PROJECTS-HUB.md 登记=f675864e0b7bb91d1817ecaf9dc643f96f41d090a90b57b3dfa752f358cf627f 实算=f675864e0b7bb91d1817ecaf9dc643f96f41d090a90b57b3dfa752f358cf627f
PASS docs/behavior/BEHAVIOR-SPEC-CANVAS.md 登记=e18d6d9151ed2b2d317a54f8a9af5cbb4e3818aa4f8163086bfc019f37b00188 实算=e18d6d9151ed2b2d317a54f8a9af5cbb4e3818aa4f8163086bfc019f37b00188
PASS docs/behavior/BEHAVIOR-SPEC-SMART-CANVAS.md 登记=9c18704f9972e30054a8ec20d9671f65bbf4203083577f82f06fea04f345bf31 实算=9c18704f9972e30054a8ec20d9671f65bbf4203083577f82f06fea04f345bf31
PASS docs/behavior/PLUGIN-PROTOCOL-SPEC.md 登记=f474a6de79afd3812a2783c2da8d12b1314b66c9cb7e2a4ae5e3a42fdb0b6242 实算=f474a6de79afd3812a2783c2da8d12b1314b66c9cb7e2a4ae5e3a42fdb0b6242
PASS docs/contracts/PROJECTS-HUB-INTERFACE-CATALOG.yaml 登记=1c7aa1a583bf6839525c1949666fb9ebf3cab5595735b9f518587341a1a81f3d 实算=1c7aa1a583bf6839525c1949666fb9ebf3cab5595735b9f518587341a1a81f3d
PASS docs/contracts/CANVAS-INTERFACE-CATALOG.yaml 登记=11d070809a171bea44c03131bf32e83d99d1451a9ef5b773391b0d2d75dd5b33 实算=11d070809a171bea44c03131bf32e83d99d1451a9ef5b773391b0d2d75dd5b33
PASS docs/fixtures/GOLDEN-FIXTURE-MANIFEST.json 登记=0ce79f2c17f6b6068cc5875e052bc9b3d5a43b5355446a5401ffae39663e3ead 实算=0ce79f2c17f6b6068cc5875e052bc9b3d5a43b5355446a5401ffae39663e3ead
PASS docs/fixtures/projects-hub-list-active.json 登记=c845069c4ba7d6b824e01d96a83f443980a847d185b7d768604e9d26ded6fb88 实算=c845069c4ba7d6b824e01d96a83f443980a847d185b7d768604e9d26ded6fb88
PASS docs/fixtures/projects-hub-create-request.json 登记=cc4e8df3b4ab5028549c1ec06263189be7d68b2fb4ee60552a7e2ea102f2bc6c 实算=cc4e8df3b4ab5028549c1ec06263189be7d68b2fb4ee60552a7e2ea102f2bc6c
PASS docs/fixtures/projects-hub-update-conflict-409.json 登记=1d758466523213aaa211e2a775ae70f920d1cc22cf059137f611a3266df18b88 实算=1d758466523213aaa211e2a775ae70f920d1cc22cf059137f611a3266df18b88
PASS docs/fixtures/canvas-workflow-minimal.json 登记=d8ea3db721bda2720eac7ba1e285e4840b54e2045fa9191d688bd08541502ad0 实算=d8ea3db721bda2720eac7ba1e285e4840b54e2045fa9191d688bd08541502ad0
PASS docs/fixtures/canvas-workflow-minimal.godmap 登记=6effafe14f6be864888e241189cd691c066ffb94e5527e11f36364199c91e0fe 实算=6effafe14f6be864888e241189cd691c066ffb94e5527e11f36364199c91e0fe
PASS docs/fixtures/canvas-save-conflict-409.json 登记=f0fe637d19e9d1ba3925ba00cda14615262889ee49509626eeb2752deb0921b4 实算=f0fe637d19e9d1ba3925ba00cda14615262889ee49509626eeb2752deb0921b4
PASS docs/fixtures/canvas-task-accepted-202.json 登记=b74b107e660b869a82509b5c5869654a588f6d037a73f229f3a53763bd614a8a 实算=b74b107e660b869a82509b5c5869654a588f6d037a73f229f3a53763bd614a8a
PASS docs/fixtures/canvas-auth-401.json 登记=2f276ffa89ee9251dfdff172bbb67ebb4150df25b1ee3f8c75772c4e19a2bbf7 实算=2f276ffa89ee9251dfdff172bbb67ebb4150df25b1ee3f8c75772c4e19a2bbf7
PASS docs/fixtures/canvas-forbidden-403.json 登记=d75071a9ccdee0b62eff2b2b9b2640f0281d976f5e20bc97215af7795fdaff9a 实算=d75071a9ccdee0b62eff2b2b9b2640f0281d976f5e20bc97215af7795fdaff9a
项目数: 16 匹配: 16 不匹配: 0
```

标准错误：
```text
（空）
```

### `python C:\Users\QINXUE~1\AppData\Local\Temp\gw-t-phase3-fd075b99940d4b089de2b76752d99517\audit.py snap`

时点：2026-09-20T18:06:35.638280+08:00；退出码：0。

标准输出：
```text
$ git rev-parse HEAD
cde7433cd24e297ceeabd248365908a8da006813
退出码: 0
$ git branch --show-current
master
退出码: 0
$ git status --porcelain -uall
 M CLEANROOM-CHARTER.md
 M CLEANROOM-IMPLEMENTATION-HANDOFF.md
 M CLEANROOM-STATUS.md
 M HANDOFF.md
 M README.md
 M attestations/reviews/CLEANROOM-REMEDIATION-VERIFICATION-2026-09-17.md
 M attestations/reviews/INDEPENDENT-CLEANROOM-AUDIT-2026-09-17.md
 M attestations/reviews/PHASE-3-CONTRACT-FREEZE-REVIEW.md
 M attestations/reviews/PHASE-3-GATE-CHECK-2026-09-17.md
 M attestations/reviews/PHASE-4-SCAFFOLDING-RECORD-2026-09-17.md
 M attestations/reviews/PHASE-5-VERTICAL-SLICE-RECORD-2026-09-17.md
 M attestations/reviews/PHASE-6-TESTING-AUDIT-RECORD-2026-09-17.md
 M attestations/reviews/PHASE-7-FINAL-RELEASE-AUTHORIZATION-2026-09-17.md
 M docs/design/README.md
 M src/gods_workbench/static/api-settings.html
 D src/gods_workbench/static/comfyui-settings.html
 D src/gods_workbench/static/css/comfyui-settings.css
 M src/gods_workbench/static/js/api-settings.js
 D src/gods_workbench/static/js/comfyui-settings.js
 M src/gods_workbench/static/js/hardware-telemetry.js
 M src/gods_workbench/static/js/i18n.js
 D src/gods_workbench/static/js/i18n/comfyui-settings.js
 D src/gods_workbench/static/runninghub/api_providers.json
 M src/gods_workbench/static/v2/index.html
 M src/gods_workbench/static/v2/settings.html
?? .github/workflows/ci.yml
?? HANDOFF-2.md
?? attestations/reviews/CURRENT-SNAPSHOT-AUDIT-2026-09-20.md
?? attestations/reviews/PHASE-3-CONTRACT-RE-FREEZE-2026-09-20.md
?? docs/governance/AGENT-TASK-2026-09-20.md
?? docs/governance/DEPLOYMENT-ACCEPTANCE-EVIDENCE-2026-09-20.md
?? docs/governance/DEPLOYMENT-ACCEPTANCE-PLAN-2026-09-20.md
?? docs/governance/EXTERNAL-IDP-PLAN-2026-09-20.md
?? docs/governance/LICENSE-AND-THIRD-PARTY-COMPLIANCE-2026-09-20.md
?? docs/governance/REMOTE-AND-CI-PLAN-2026-09-20.md
?? docs/governance/agent-reports-2026-09-20/T-compliance.md
?? docs/governance/agent-reports-2026-09-20/T-fonts.md
?? docs/governance/agent-reports-2026-09-20/T-handoff.md
?? docs/governance/agent-reports-2026-09-20/T-phase3.md
?? docs/governance/agent-reports-2026-09-20/T-release-ops.md
?? requirements-dev.txt
?? requirements.txt
warning: unable to access 'C:\Users\qinxuedong/.config/git/ignore': Permission denied
warning: unable to access 'C:\Users\qinxuedong/.config/git/ignore': Permission denied
退出码: 0
$ git diff --stat
 CLEANROOM-CHARTER.md                               |    2 +-
 CLEANROOM-IMPLEMENTATION-HANDOFF.md                |    3 +-
 CLEANROOM-STATUS.md                                |    2 +-
 HANDOFF.md                                         |   17 +-
 README.md                                          |    3 +-
 ...LEANROOM-REMEDIATION-VERIFICATION-2026-09-17.md |   12 +
 .../INDEPENDENT-CLEANROOM-AUDIT-2026-09-17.md      |   12 +
 .../reviews/PHASE-3-CONTRACT-FREEZE-REVIEW.md      |   10 +
 .../reviews/PHASE-3-GATE-CHECK-2026-09-17.md       |   10 +
 .../PHASE-4-SCAFFOLDING-RECORD-2026-09-17.md       |   12 +
 .../PHASE-5-VERTICAL-SLICE-RECORD-2026-09-17.md    |   12 +
 .../PHASE-6-TESTING-AUDIT-RECORD-2026-09-17.md     |   12 +
 ...ASE-7-FINAL-RELEASE-AUTHORIZATION-2026-09-17.md |   12 +
 docs/design/README.md                              |    2 +-
 src/gods_workbench/static/api-settings.html        |  123 +-
 src/gods_workbench/static/comfyui-settings.html    |  134 -
 src/gods_workbench/static/css/comfyui-settings.css |  243 --
 src/gods_workbench/static/js/api-settings.js       | 1736 -----------
 src/gods_workbench/static/js/comfyui-settings.js   | 1434 ---------
 src/gods_workbench/static/js/hardware-telemetry.js |   32 +-
 src/gods_workbench/static/js/i18n.js               |    1 -
 .../static/js/i18n/comfyui-settings.js             |   72 -
 .../static/runninghub/api_providers.json           | 3165 --------------------
 src/gods_workbench/static/v2/index.html            |   27 -
 src/gods_workbench/static/v2/settings.html         |   27 -
 25 files changed, 118 insertions(+), 6997 deletions(-)
warning: in the working copy of 'HANDOFF.md', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'attestations/reviews/PHASE-3-CONTRACT-FREEZE-REVIEW.md', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'attestations/reviews/PHASE-3-GATE-CHECK-2026-09-17.md', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/gods_workbench/static/api-settings.html', LF will be replaced by CRLF the next time Git touches it
退出码: 0
git ls-files -z 退出码: 0 索引路径数: 206 磁盘仍存在: 201 索引列出但磁盘不存在: 5
git ls-files 原始输出 SHA-256: 060786e4802986db9b2ae9b3eb68a11f5671f9c83e4b9f3b7221a6bea29cb619
磁盘文件数（排除 .git，包含忽略缓存）: 291
磁盘文件数（再排除 __pycache__ / .pytest_cache）: 253
静态层磁盘文件数: 108
docs/governance/agent-reports-2026-09-20/T-scope.md 存在=False 
docs/provenance/STATIC-SCOPE-REGISTRY-2026-09-20.md 存在=False 
```

标准错误：
```text
（空）
```

### 编码、仅追加与文件存在检查

命令：`python C:\Users\QINXUE~1\AppData\Local\Temp\gw-t-phase3-fd075b99940d4b089de2b76752d99517\finalize.py` 中的字节断言（本节原始输出）。
```text
UTF-8 无 BOM / 无 U+FFFD PASS attestations/reviews/PHASE-3-CONTRACT-RE-FREEZE-2026-09-20.md
UTF-8 无 BOM / 无 U+FFFD PASS attestations/reviews/CURRENT-SNAPSHOT-AUDIT-2026-09-20.md
UTF-8 无 BOM / 无 U+FFFD PASS docs/governance/agent-reports-2026-09-20/T-phase3.md
UTF-8 无 BOM / 无 U+FFFD PASS attestations/reviews/PHASE-3-CONTRACT-FREEZE-REVIEW.md
UTF-8 无 BOM / 无 U+FFFD PASS attestations/reviews/PHASE-3-GATE-CHECK-2026-09-17.md
仅追加 PASS attestations/reviews/PHASE-3-CONTRACT-FREEZE-REVIEW.md 原始字节=5662 原始SHA-256=ed98be2a43bcd9ad57b4fa0858817f0070a16ee5891b695aa676e9e5d1f1d123 追加字节=597
仅追加 PASS attestations/reviews/PHASE-3-GATE-CHECK-2026-09-17.md 原始字节=1319 原始SHA-256=df43915c76c8b82d622c630e31921fd8538e8a7431eaf959f8d2916c7ceb7c99 追加字节=597
交付文档 SHA-256 attestations/reviews/PHASE-3-CONTRACT-RE-FREEZE-2026-09-20.md 395813beeda3e80d73f176e640426e5f139d3c5716314d458db3cce339e06128
交付文档 SHA-256 attestations/reviews/CURRENT-SNAPSHOT-AUDIT-2026-09-20.md f526119402784a390b98d6d7711ad8d4e509b125ad5b98be3b1d2d10fa627a55
全部指定链接目标存在=True
```

以上断言在本节追加前执行；追加内容也已作 UTF-8 / 无 U+FFFD 检查。两份交付文档的 SHA-256 不包含本报告，不构成签名或第三方认证。
