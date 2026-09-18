/* Signal Flow canvas domain: smart-asset-library.js. Loaded before the legacy entry to preserve its public global facade. */
async function loadAssetLibrary(){
    try {
        const [data, localData, urlData] = await Promise.all([
            smartCanvasApi().getAssetLibrary().then(r => r.json()),
            smartCanvasApi().getLocalAssets().then(r => r.ok ? r.json() : {items:[], tree:null}).catch(() => ({items:[], tree:null})),
            smartCanvasApi().getRemoteUrlAssets().then(r => r.ok ? r.json() : {items:[]}).catch(() => ({items:[]}))
        ]);
        localAssetLibrary = {items:Array.isArray(localData.items) ? localData.items : [], tree:localData.tree || null};
        assetUrlLibrary = {items:Array.isArray(urlData.items) ? urlData.items.map(item => registryAssetItemForSmartCanvas(item)) : []};
        setAssetLibraryFromResponse(data, {render:false});
        renderAssetLibrary();
    } catch(e) {
        toast(tr('smart.assetLoadFail'));
    }
}
function refreshAssetLibrarySoon(delay=120){
    clearTimeout(assetLibraryRefreshTimer);
    assetLibraryRefreshTimer = setTimeout(async () => {
        await loadAssetLibrary();
        if(mentionPicker?.classList?.contains('open') && mentionSource === 'asset') renderMentionPicker('asset');
    }, delay);
}
function handleAssetLibraryUpdatedMessage(data={}){
    const remoteUpdatedAt = Number(data.updated_at || 0);
    if(remoteUpdatedAt && remoteUpdatedAt <= Number(assetLibraryUpdatedAt || 0)) return;
    refreshAssetLibrarySoon();
}
// 多人协作同步：一个稳定的客户端 id，既用于 WS 连接，也随 saveCanvas 上报，
// 服务器广播 canvas_updated 时带回 client_id，自己发的就忽略，避免自我刷新。
const smartClientId = `canvas_smart_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
let canvasSyncInFlight = false;
let canvasSyncTimer = null;
let canvasMetaPollTimer = null;
let connectionLayerRaf = 0;
let smartCanvasDirty = false;
let smartCanvasConflictPending = false;
function smartCanvasHasUnsavedChanges(){
    return Boolean(smartCanvasDirty || saveTimer || canvasSyncInFlight);
}
function enterSmartCanvasConflictPending(){
    if(smartCanvasConflictPending) return;
    // Do not advance the local CAS pair or partially merge a remote snapshot:
    // either would allow a later full PUT to overwrite fields not in the merge.
    smartCanvasConflictPending = true;
    smartCanvasDirty = true;
    clearTimeout(saveTimer);
    saveTimer = null;
    clearTimeout(canvasSyncTimer);
    canvasSyncTimer = null;
    toast('保存冲突：本地改动未自动覆盖远程版本，请刷新后处理。');
}
function smartNodeInFlight(node){
    if(smartNodeHasCompletedResult(node)) return false;
    return Boolean(node && (node.running || node.pending || node.queued || node.jimengPending || smartPendingTasks(node).length));
}
function smartNodeHasDisplayResult(node){
    return Boolean((node?.images || []).some(img => img?.url && !img.loopInputPreview));
}
function smartNodeHasCompletedResult(node){
    if(!smartNodeHasDisplayResult(node)) return false;
    if(node?.runFinishedAt) return true;
    return !node?.jimengPending && !smartPendingTasks(node).length && !Number(node?.pending || 0) && !node?.queued;
}
function liveSmartNode(node){
    if(!node?.id) return node;
    return nodes.find(n => n.id === node.id) || node;
}
function clearSmartNodeBusyState(node){
    if(!node) return node;
    smartNodeRunTokens.delete(node.id);
    node.running = false;
    node.pending = 0;
    node.queued = false;
    delete node.jimengPending;
    delete node.pendingTasks;
    return node;
}
function markSmartNodeComplete(node, meta=null){
    if(!node) return node;
    const keepHidden = node.runTimerHidden === true;
    clearSmartNodeBusyState(node);
    node.runFinishedAt = Number(node.runFinishedAt || 0) || nowMs();
    if(!node.runStartedAt) node.runStartedAt = meta?.createdAt || node.runFinishedAt;
    node.runElapsedMs = Math.max(0, Number(node.runFinishedAt || nowMs()) - Number(node.runStartedAt || node.runFinishedAt || nowMs()));
    node.runTimerHidden = meta?.hideTimer === true || keepHidden;
    return node;
}
function completedDownstreamOutputForNode(sourceNode){
    if(!sourceNode?.id) return null;
    const startedAt = Number(sourceNode.runStartedAt || 0);
    return downstreamImageTargetsFor(sourceNode).find(target => {
        if(!smartNodeHasCompletedResult(target)) return false;
        if(target.sourceNodeId && target.sourceNodeId !== sourceNode.id) return false;
        const finishedAt = Number(target.runFinishedAt || 0);
        return !startedAt || !finishedAt || finishedAt >= startedAt;
    }) || null;
}
function clearSourceBusyStateIfDownstreamDone(sourceNode, options={}){
    if(!sourceNode || !smartNodeInFlight(sourceNode)) return false;
    if(sourceNode.jimengPending || smartPendingTasks(sourceNode).length) return false;
    if(!completedDownstreamOutputForNode(sourceNode)) return false;
    clearSmartNodeBusyState(sourceNode);
    if(!sourceNode.runFinishedAt){
        sourceNode.runFinishedAt = nowMs();
        if(!sourceNode.runStartedAt) sourceNode.runStartedAt = sourceNode.runFinishedAt;
        sourceNode.runElapsedMs = Math.max(0, sourceNode.runFinishedAt - Number(sourceNode.runStartedAt || sourceNode.runFinishedAt));
        sourceNode.runTimerHidden = options.hideTimer === true || sourceNode.runTimerHidden === true;
    }
    return true;
}
function clearCompletedSourceBusyStates(){
    let changed = false;
    (nodes || []).forEach(node => {
        if(clearSourceBusyStateIfDownstreamDone(node)) changed = true;
    });
    return changed;
}
function hideCompletedRunTimers(){
    let changed = false;
    (nodes || []).forEach(node => {
        if(!node || node.type === 'smart-prompt') return;
        if(node.pending || node.running || node.jimengPending || !node.runFinishedAt || node.runTimerHidden) return;
        node.runTimerHidden = true;
        changed = true;
    });
    return changed;
}
function clearCompletedNodeBusyStates(){
    let changed = false;
    (nodes || []).forEach(node => {
        if(!node || !smartNodeHasCompletedResult(node) || !smartNodeInFlight(node)) return;
        markSmartNodeComplete(node);
        changed = true;
    });
    if(clearCompletedSourceBusyStates()) changed = true;
    return changed;
}
function usedCanvasOutputUrls(){
    const used = new Set();
    (nodes || []).forEach(node => (node.images || []).forEach(img => {
        if(img?.url && !img.loopInputPreview) used.add(img.url);
    }));
    return used;
}
function successfulRecentComfyLogOutputs(sourceNodeId='', withinMs=30 * 60 * 1000){
    const cutoff = Date.now() - withinMs;
    const logs = (canvas?.logs || [])
        .filter(log => log && log.status === 'success' && Number(log.createdAt || 0) >= cutoff)
        .filter(log => log.request?.workflow_json || String(log.platform || '').toLowerCase().includes('comfy'))
        .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0));
    const scoped = sourceNodeId ? logs.filter(log => log.nodeId === sourceNodeId) : logs;
    const usable = scoped.length ? scoped : logs.filter(log => !log.nodeId);
    return usable.flatMap(log => (log.outputs || []).map(url => ({url, createdAt:log.createdAt, nodeId:log.nodeId}))).filter(item => item.url);
}
function recoverStuckLoopOutputsFromLogs(){
    const used = usedCanvasOutputUrls();
    let changed = false;
    const slots = (nodes || [])
        .filter(node => node && isSmartImageNode(node) && !isHistoryGroupNode(node))
        .filter(node => (node.loopSourceId || node.loopRootId || Number.isFinite(Number(node.loopSlotIndex))) && !smartNodeHasDisplayResult(node))
        .filter(node => (node.pending || node.running || node.queued) && !smartPendingTasks(node).length)
        .sort((a, b) => (Number(a.loopSlotIndex || 0) - Number(b.loopSlotIndex || 0)) || (Number(a.y || 0) - Number(b.y || 0)));
    slots.forEach(slot => {
        const sourceId = slot.loopRootId || slot.sourceNodeId || '';
        const output = successfulRecentComfyLogOutputs(sourceId).find(item => !used.has(item.url));
        if(!output) return;
        const kind = mediaKindForUrls([output.url], 'image');
        const ext = kind === 'video' ? 'mp4' : kind === 'audio' ? 'mp3' : kind === 'text' ? 'txt' : 'png';
        slot.images = [stripImageGenerationMeta({url:output.url, name:`comfy-recovered-${Number(slot.loopSlotIndex || 0) + 1}.${ext}`, kind, generatedResult:true})];
        markSmartNodeComplete(slot);
        if(kind) slot.outputKind = kind;
        slot.title = slot.title || 'Image';
        slot.scale = mediaNodeDefaultScale(slot);
        delete slot.w;
        delete slot.h;
        used.add(output.url);
        changed = true;
        clearSourceBusyStateIfDownstreamDone(nodes.find(n => n.id === sourceId));
    });
    return changed;
}
function syncRunButtonState(node=selectedNode()){
    if(!runBtn) return;
    // 只在“当前选中节点自己”忙时禁用运行：节点正在生成/排队，或它本身是正在跑的循环。
    // 不再因为“画布上有任意循环/级联在跑”就全局禁用——跑循环时仍可对其他节点点生成。
    runBtn.disabled = !isSmartRunnableNode(node) || smartNodeInFlight(node) || smartCascadeIsLoopRunning(node?.id);
}
async function mergeReloadCanvasNow(){
    if(!canvasId || smartCanvasConflictPending) return;
    if(dragState || selectionState){
        // 用户正在拖拽/框选，稍后再合并，别打断操作
        scheduleCanvasMergeReload(600);
        return;
    }
    try {
        const res = await smartCanvasApi().getCanvas(canvasId);
        if(!res.ok) return;
        const data = await res.json();
        if(data && data.canvas){
            if(smartCanvasHasUnsavedChanges()) enterSmartCanvasConflictPending();
            else await loadCanvas(); // Full rebase: never retain stale icon/logs/settings/viewport.
        }
    } catch(e) {}
}
function scheduleCanvasMergeReload(delay=200){
    if(smartCanvasConflictPending) return;
    clearTimeout(canvasSyncTimer);
    canvasSyncTimer = setTimeout(() => { mergeReloadCanvasNow(); }, delay);
}
function handleCanvasUpdatedMessage(data={}){
    if(!data || data.type !== 'canvas_updated') return;
    if(!canvasId || data.canvas_id !== canvasId) return;
    if(data.client_id && data.client_id === smartClientId) return; // 自己发的，忽略
    if(smartCanvasConflictPending) return;
    if(canvasSyncInFlight) return; // 我正在保存，保存完成/409 合并会处理
    const remoteUpdatedAt = Number(data.updated_at || 0);
    if(remoteUpdatedAt && remoteUpdatedAt <= Number(canvas?.updated_at || 0)) return;
    scheduleCanvasMergeReload(200);
}
function startCanvasMetaPoll(){
    // WS / iframe 转发不可靠时的兜底：定期看服务器 updated_at 是否变新，变新就合并拉取
    if(canvasMetaPollTimer) return;
    canvasMetaPollTimer = setInterval(async () => {
        if(!canvasId || !canvas) return;
        if(smartCanvasConflictPending) return;
        if(canvasSyncInFlight || dragState || selectionState) return;
        try {
            const res = await smartCanvasApi().getCanvasMeta(canvasId);
            if(!res.ok) return;
            const meta = await res.json();
            if(Number(meta.updated_at || 0) > Number(canvas.updated_at || 0)) mergeReloadCanvasNow();
        } catch(e) {}
    }, 8000);
}
function connectAssetLibrarySyncSocket(){
    if(window.parent && window.parent !== window) return;
    const host = window.location.host;
    if(!host) return;
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const clientId = smartClientId;
    let socket;
    let retryTimer = null;
    let retryCount = 0;
    const connect = () => {
        try {
            socket = new WebSocket(`${protocol}://${host}/ws/stats?client_id=${clientId}`);
        } catch(e) {
            retryTimer = setTimeout(connect, Math.min(30000, 3000 * 2 ** Math.min(retryCount++, 3)));
            return;
        }
        socket.onopen = () => { retryCount = 0; };
        socket.onmessage = event => {
            try {
                const data = JSON.parse(event.data);
                if(data?.type === 'asset_library_updated') handleAssetLibraryUpdatedMessage(data);
                if(data?.type === 'canvas_updated') handleCanvasUpdatedMessage(data);
            } catch(e) {}
        };
        socket.onclose = event => {
            if([4001,4003,4401,4403].includes(Number(event.code))) return;
            retryTimer = setTimeout(connect, Math.min(30000, 3000 * 2 ** Math.min(retryCount++, 3)));
        };
        socket.onerror = () => {
            try { socket.close(); } catch(e) {}
        };
    };
    window.addEventListener('beforeunload', () => {
        clearTimeout(retryTimer);
        try { socket?.close(); } catch(e) {}
    });
    connect();
}
function setAssetLibraryFromResponse(data, options={}){
    assetLibrary = data.library || assetLibrary;
    assetLibraryUpdatedAt = Number(assetLibrary.updated_at || assetLibraryUpdatedAt || 0);
    const libs = assetLibraries();
    if(!activeAssetLibraryId) activeAssetLibraryId = assetLibrary.active_library_id || libs[0]?.id || '';
    if(activeAssetLibraryId && activeAssetLibraryId !== LOCAL_ASSET_LIBRARY_ID && !libs.some(lib => lib.id === activeAssetLibraryId)) activeAssetLibraryId = libs[0]?.id || '';
    const cats = assetCategories('image');
    if(activeAssetCategoryId && !cats.some(cat => cat.id === activeAssetCategoryId)) activeAssetCategoryId = '';
    if(!activeAssetCategoryId) activeAssetCategoryId = activeAssetCategory()?.id || '';
    const workflowCats = workflowAssetCategories();
    if(activeWorkflowAssetCategoryId && !workflowCats.some(cat => cat.id === activeWorkflowAssetCategoryId)) activeWorkflowAssetCategoryId = '';
    if(!activeWorkflowAssetCategoryId) activeWorkflowAssetCategoryId = activeWorkflowAssetCategory()?.id || '';
    if(mentionAssetCategoryId && !cats.some(cat => cat.id === mentionAssetCategoryId)) mentionAssetCategoryId = '';
    if(!mentionAssetCategoryId) mentionAssetCategoryId = activeAssetCategoryId;
    if(options.render !== false) {
        renderAssetLibrary();
        if(mentionPicker?.classList?.contains('open') && mentionSource === 'asset') renderMentionPicker('asset');
    }
}
function toggleAssetLibrary(open=!assetLibraryOpen){
    if(!assetPanel || !assetToggle) return;
    assetLibraryOpen = !!open;
    assetPanel.classList.toggle('open', assetLibraryOpen);
    assetToggle?.classList.toggle('active', assetLibraryOpen);
    if(assetLibraryOpen) loadAssetLibrary();
    render();
}
function assetCategoryForMention(){
    const cats = assetCategories('image');
    if(!cats.length) return null;
    return cats.find(cat => cat.id === mentionAssetCategoryId)
        || cats.find(cat => cat.id === activeAssetCategoryId)
        || cats.find(cat => (cat.items || []).length)
        || cats[0];
}
function assetMediaKind(item){
    if(!item) return 'image';
    if(item.kind === 'workflow' || item.type === 'workflow') return 'workflow';
    if(item.kind === 'video' || item.type === 'video') return 'video';
    if(item.kind === 'audio' || item.type === 'audio') return 'audio';
    const url = String(item.url || item.thumbnail || '').toLowerCase().split('?')[0];
    const name = String(item.name || '').toLowerCase();
    if(/\.(mp4|webm|mov|m4v|avi|mkv)$/.test(url) || /\.(mp4|webm|mov|m4v|avi|mkv)$/.test(name)) return 'video';
    if(/\.(mp3|wav|m4a|aac|ogg|flac)$/.test(url) || /\.(mp3|wav|m4a|aac|ogg|flac)$/.test(name)) return 'audio';
    if(/\.(json|zip)$/.test(url) || /\.(json|zip)$/.test(name)) return 'workflow';
    return 'image';
}
function registryAssetItemForSmartCanvas(item, fallbackUrl=''){
    const asset = {...(item || {}), url:item?.public_url || item?.url || fallbackUrl || ''};
    const assetId = typeof item?.asset_id === 'string' ? item.asset_id.trim()
        : typeof item?.id === 'string' ? item.id.trim() : '';
    if(assetId) asset.asset_id = assetId;
    return asset;
}
function assetNodeImageFromItem(item, fallbackName='asset'){
    const image = {
        url:item?.url || '',
        name:item?.name || fallbackName,
        kind:item?.kind || assetMediaKind(item)
    };
    copyMediaSizeFields(item, image);
    if(item?.asset_uris && typeof item.asset_uris === 'object') image.asset_uris = {...item.asset_uris};
    const assetId = smartStableAssetId(item);
    if(assetId) image.asset_id = assetId;
    return image;
}
function assetThumbHtml(item){
    const url = escapeAttr(item.url || '');
    const thumb = item.thumbnail || item.thumb || item.preview || item.url || '';
    const kind = assetMediaKind(item);
    if(kind === 'video'){
        return `<div class="asset-thumb-wrap">${smartVideoPreviewHtml(item, 256, 'class="asset-thumb" loading="lazy" decoding="async" alt=""')}<span class="asset-video-badge"><i data-lucide="film"></i>VIDEO</span></div>`;
    }
    if(kind === 'audio'){
        return `<div class="asset-thumb-wrap media-thumb audio-thumb asset-thumb"><i data-lucide="file-audio"></i><span>${escapeHtml(item.name || 'Audio')}</span></div>`;
    }
    if(kind === 'workflow'){
        return `<div class="asset-thumb-wrap media-thumb workflow-thumb asset-thumb"><i data-lucide="workflow"></i><span>${escapeHtml(item.name || 'Workflow')}</span></div>`;
    }
    // 网格缩略图用较小尺寸 + 懒加载/异步解码：素材多时滚动不再一次性加载解码全部图片。
    return smartPreviewImgHtml({...item, url:thumb}, 256, 'class="asset-thumb" loading="lazy" decoding="async" alt=""');
}
function renderAssetLibrary(){
    if(!assetPanel || !assetGrid || !assetCategorySelect) return;
    document.querySelectorAll('[data-asset-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.assetTab === assetTab));
    const urlMode = assetTab === 'url';
    const libs = currentAssetSourceLibraries();
    if(!activeAssetLibraryId || !libs.some(lib => lib.id === activeAssetLibraryId)) activeAssetLibraryId = assetLibrary.active_library_id || assetLibraries()[0]?.id || LOCAL_ASSET_LIBRARY_ID;
    if(assetLibrarySelect){
        assetLibrarySelect.innerHTML = libs.map(lib => `<option value="${escapeHtml(lib.id)}" ${lib.id === activeAssetLibraryId ? 'selected' : ''}>${escapeHtml(lib.name || '资产库')}</option>`).join('');
    }
    const imageMode = assetTab === 'image';
    const workflowMode = assetTab === 'workflow';
    assetImageControls.style.display = (imageMode || workflowMode) ? 'block' : 'none';
    const localMode = assetLibraryIsLocal();
    assetDropZone.style.display = (imageMode || urlMode) ? 'flex' : 'none';
    assetDropZone.textContent = urlMode ? '拖入公网图片或视频链接，保存到统一资产中心' : tr('smart.assetDropHint');
    assetGrid.style.display = (imageMode || workflowMode || urlMode) ? 'grid' : 'none';
    workflowEmpty.style.display = 'none';
    if(urlMode){ renderAssetUrlLibrary(); return; }
    if(!imageMode && !workflowMode){ refreshIcons(); return; }
    const baseCats = workflowMode ? workflowAssetCategories() : assetCategories('image');
    const smartClassCats = imageMode && !localMode ? assetSmartClassEntries().map(entry => ({
        ...entry,
        id:entry.id,
        name:`${entry.label} / ${entry.tag} (${entry.count})`,
        type:'image',
        smartClass:true,
        items:[]
    })) : [];
    const cats = workflowMode ? baseCats : [...baseCats, ...smartClassCats];
    const activeCatId = workflowMode ? activeWorkflowAssetCategoryId : activeAssetCategoryId;
    if(workflowMode && !cats.some(cat => cat.id === activeWorkflowAssetCategoryId)) activeWorkflowAssetCategoryId = cats[0]?.id || '';
    if(imageMode && !cats.some(cat => cat.id === activeAssetCategoryId)) activeAssetCategoryId = cats[0]?.id || '';
    assetCategorySelect.innerHTML = cats.map(cat => `<option value="${escapeHtml(cat.id)}" ${cat.id === (workflowMode ? activeWorkflowAssetCategoryId : activeAssetCategoryId) ? 'selected' : ''}>${escapeHtml(cat.name || (workflowMode ? '工作流' : tr('smart.assetFolder')))}</option>`).join('');
    const cat = workflowMode ? activeWorkflowAssetCategory() : activeAssetCategory();
    const smartClass = imageMode ? parseAssetSmartClassId(activeAssetCategoryId) : null;
    const items = smartClass ? itemsForAssetSmartClass(activeAssetCategoryId) : (cat?.items || []);
    if(assetAddCategoryBtn) assetAddCategoryBtn.disabled = Boolean(smartClass);
    if(assetRenameCategoryBtn) assetRenameCategoryBtn.disabled = !cat || Boolean(smartClass) || (localMode && (cat.id === '__root__' || !cat.id));
    assetGrid.innerHTML = items.length ? items.map(item => `
        <div class="asset-item ${workflowMode ? 'workflow-asset-item' : ''}" draggable="${workflowMode ? 'false' : 'true'}" data-asset-id="${escapeHtml(item.id)}" data-url="${escapeHtml(item.url)}" data-name="${escapeHtml(item.name || 'asset')}" data-kind="${escapeHtml(assetMediaKind(item))}">
            ${assetThumbHtml(item)}
            <div class="asset-meta">
                <span class="asset-name" ${localMode ? `data-rename-local-asset="${escapeHtml(item.id)}"` : ''} title="${escapeHtml(item.name || '')}">${escapeHtml(item.name || 'asset')}</span>
                ${workflowMode
                    ? `<button class="asset-mini-btn" type="button" data-rename-workflow-asset="${escapeHtml(item.id)}" title="${escapeHtml(tr('smart.assetRename'))}"><i data-lucide="pencil"></i></button>
                       <button class="asset-mini-btn" type="button" data-delete-workflow-asset="${escapeHtml(item.id)}" title="${escapeHtml(tr('common.delete'))}"><i data-lucide="trash-2"></i></button>`
                    : localMode ? `<button class="asset-mini-btn" type="button" data-rename-local-asset="${escapeHtml(item.id)}" title="${escapeHtml(tr('smart.assetRename'))}"><i data-lucide="pencil"></i></button>
                       <button class="asset-mini-btn" type="button" data-delete-local-asset="${escapeHtml(item.id)}" title="${escapeHtml(tr('common.delete'))}"><i data-lucide="trash-2"></i></button>` : `<button class="asset-mini-btn" type="button" data-rename-asset="${escapeHtml(item.id)}" title="${escapeHtml(tr('smart.assetRename'))}"><i data-lucide="pencil"></i></button>
                       <button class="asset-mini-btn" type="button" data-delete-asset="${escapeHtml(item.id)}" title="${escapeHtml(tr('common.delete'))}"><i data-lucide="trash-2"></i></button>`}
            </div>
        </div>
    `).join('') : `<div class="asset-empty">${escapeHtml(localMode ? '暂无本地素材，拖入图片即可保存' : (smartClass ? '这个智能分类下暂无素材' : (workflowMode ? '暂无工作流资产' : tr('smart.assetEmpty'))))}</div>`;
    if(workflowMode) bindWorkflowAssetItemEvents();
    else bindAssetItemEvents();
    bindSmartPreviewImageFallbacks(assetGrid);
    refreshIcons();
}
function smartManualUrlKind(url, fallback='image'){
    const text = String(url || '').trim().toLowerCase().split('?')[0].split('#')[0];
    if(/\.(mp4|webm|mov|m4v|avi|mkv)$/.test(text)) return 'video';
    if(/\.(mp3|wav|m4a|aac|ogg|flac)$/.test(text)) return 'audio';
    if(/\.(png|jpe?g|webp|gif|bmp|tiff?|avif)$/.test(text)) return 'image';
    return fallback || 'image';
}
function assetUrlLibraryItems(){
    return (Array.isArray(assetUrlLibrary?.items) ? assetUrlLibrary.items : [])
        .filter(item => item?.url)
        .map((item, index) => ({
            ...item,
            id:item.id || `url_${index}`,
            kind:item.kind || smartManualUrlKind(item.url, 'image'),
            name:item.name || fileNameFromUrl(item.url) || `URL ${index + 1}`
        }));
}
function parseAssetUrlEditText(text, fallback={}){
    const lines = String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const urlIndex = lines.findIndex(line => /^https?:\/\//i.test(line));
    if(urlIndex < 0) return null;
    return {
        url:lines[urlIndex],
        name:lines.find((line, index) => index !== urlIndex) || fallback.name || fileNameFromUrl(lines[urlIndex]) || 'URL'
    };
}
async function saveUrlsToAssetUrlLibrary(urls=[], names=[]){
    const saved = [];
    for(const [index, raw] of (urls || []).entries()){
        const url = String(raw || '').trim();
        if(!/^https?:\/\//i.test(url)) continue;
        const response = await smartCanvasApi().createRemoteAsset({url,name:String(names[index] || fileNameFromUrl(url) || '').trim(),kind:smartManualUrlKind(url, 'image')});
        const data = await response.json().catch(() => ({}));
        if(!response.ok) throw new Error(apiErrorMessage(data, '保存 URL 失败'));
        const item = data.asset ? registryAssetItemForSmartCanvas(data.asset, url) : {url};
        const existing = assetUrlLibrary.items.findIndex(value => value.id === item.id);
        if(existing >= 0) assetUrlLibrary.items[existing] = item;
        else assetUrlLibrary.items.unshift(item);
        saved.push(item);
    }
    if(assetTab === 'url') renderAssetLibrary();
    return saved;
}
function renderAssetUrlLibrary(){
    const items = assetUrlLibraryItems();
    assetGrid.innerHTML = `<div class="asset-url-controls"><button class="asset-url-add" type="button" data-add-asset-url><i data-lucide="link"></i><span>添加 URL</span></button><span class="asset-url-count">${escapeHtml(items.length ? `${items.length} 个公网素材` : '保存公网图片或视频链接')}</span></div>${items.length ? items.map(item => `
        <div class="asset-item asset-url-item" draggable="true" data-asset-url-id="${escapeHtml(item.id)}" data-url="${escapeHtml(item.url)}" data-name="${escapeHtml(item.name || 'URL')}" data-kind="${escapeHtml(assetMediaKind(item))}" title="${escapeHtml(item.url)}">
            ${assetThumbHtml(item)}
            <div class="asset-meta"><span class="asset-name">${escapeHtml(item.name || 'URL')}</span><button class="asset-mini-btn" type="button" data-copy-asset-url="${escapeHtml(item.id)}" title="复制 URL"><i data-lucide="copy"></i></button><button class="asset-mini-btn" type="button" data-edit-asset-url="${escapeHtml(item.id)}" title="编辑"><i data-lucide="pencil"></i></button><button class="asset-mini-btn" type="button" data-delete-asset-url="${escapeHtml(item.id)}" title="删除"><i data-lucide="trash-2"></i></button></div>
        </div>`).join('') : '<div class="asset-empty">暂无公网 URL 素材</div>'}`;
    bindAssetUrlLibraryEvents();
    bindSmartPreviewImageFallbacks(assetGrid);
    refreshIcons();
}
function bindAssetUrlLibraryEvents(){
    assetGrid.querySelector('[data-add-asset-url]')?.addEventListener('click', async event => {
        event.preventDefault(); event.stopPropagation();
        const value = await openAssetNameDialog({title:'添加 URL 素材',placeholder:'每行一个 http/https 链接',cancelValue:null,multiline:true});
        if(value === null) return;
        const urls = String(value || '').split(/[\s,]+/).map(item => item.trim()).filter(item => /^https?:\/\//i.test(item));
        if(!urls.length){ toast('请输入有效的 http(s) URL'); return; }
        try { await saveUrlsToAssetUrlLibrary(urls); toast(`已保存 ${urls.length} 个 URL 素材`); }
        catch(err){ toast(err.message || '保存 URL 失败'); }
    });
    assetGrid.querySelectorAll('.asset-url-item').forEach(el => el.addEventListener('dragstart', event => {
        const item = assetUrlLibraryItems().find(value => value.id === el.dataset.assetUrlId);
        if(!item) return;
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData('application/x-smart-asset', JSON.stringify(assetNodeImageFromItem(item, 'URL')));
        event.dataTransfer.setData('text/plain', item.url || '');
    }));
    assetGrid.querySelectorAll('[data-copy-asset-url]').forEach(btn => btn.onclick = async event => {
        event.preventDefault(); event.stopPropagation();
        const item = assetUrlLibraryItems().find(value => value.id === btn.dataset.copyAssetUrl);
        if(item?.url){ await copyTextToClipboard(item.url); toast('已复制 URL'); }
    });
    assetGrid.querySelectorAll('[data-edit-asset-url]').forEach(btn => btn.onclick = async event => {
        event.preventDefault(); event.stopPropagation();
        const item = assetUrlLibraryItems().find(value => value.id === btn.dataset.editAssetUrl);
        if(!item) return;
        const value = await openAssetNameDialog({title:'编辑 URL 素材',value:`${item.name || 'URL'}\n${item.url}`,placeholder:'第一行名称，第二行 URL',cancelValue:null,multiline:true});
        const parsed = value === null ? null : parseAssetUrlEditText(value, item);
        if(!parsed) return;
        const response = await smartCanvasApi().updateRemoteAsset(item.id, {...parsed,kind:smartManualUrlKind(parsed.url,item.kind)});
        const data = await response.json().catch(() => ({}));
        if(!response.ok){ toast(apiErrorMessage(data, '更新 URL 失败')); return; }
        assetUrlLibrary.items = assetUrlLibrary.items.map(value => value.id === item.id ? registryAssetItemForSmartCanvas(data.asset, parsed.url) : value);
        renderAssetLibrary();
    });
    assetGrid.querySelectorAll('[data-delete-asset-url]').forEach(btn => btn.onclick = async event => {
        event.preventDefault(); event.stopPropagation();
        const id = btn.dataset.deleteAssetUrl;
        const response = await smartCanvasApi().deleteRemoteAsset(id);
        if(!response.ok){ toast(apiErrorMessage(await response.json().catch(() => ({})), '删除 URL 失败')); return; }
        assetUrlLibrary.items = assetUrlLibrary.items.filter(item => item.id !== id);
        renderAssetLibrary();
    });
}
let assetNameDialogClose = null;
function closeAssetNameDialog(){
    assetNameDialogClose?.();
}
function openAssetNameDialog({title='', value='', placeholder='', cancelValue='', multiline=false }={}){
    if(!assetDialogBackdrop || !assetDialogInput || !assetDialogOk || !assetDialogCancel) return Promise.resolve(cancelValue);
    return new Promise(resolve => {
        assetDialogTitle.textContent = title || tr('smart.assetRename');
        assetDialogInput.value = value || '';
        assetDialogInput.placeholder = placeholder || '';
        assetDialogInput.classList.toggle('is-multiline', Boolean(multiline));
        assetDialogInput.rows = multiline ? 5 : 1;
        assetDialogBackdrop.hidden = false;
        assetDialogBackdrop.classList.add('open');
        assetDialogInput.focus();
        assetDialogInput.select();
        const cleanup = result => {
            if(assetNameDialogClose === closeCurrentDialog) assetNameDialogClose = null;
            assetDialogBackdrop.classList.remove('open');
            assetDialogBackdrop.hidden = true;
            assetDialogOk.onclick = null;
            assetDialogCancel.onclick = null;
            assetDialogInput.onkeydown = null;
            assetDialogBackdrop.onmousedown = null;
            assetDialogInput.classList.remove('is-multiline');
            assetDialogInput.rows = 1;
            resolve(result);
        };
        const closeCurrentDialog = () => cleanup(cancelValue);
        assetNameDialogClose = closeCurrentDialog;
        assetDialogOk.onclick = () => cleanup(assetDialogInput.value.trim());
        assetDialogCancel.onclick = closeCurrentDialog;
        assetDialogInput.onkeydown = event => {
            if(event.key === 'Enter' && !multiline) cleanup(assetDialogInput.value.trim());
            if(event.key === 'Enter' && multiline && (event.ctrlKey || event.metaKey)) cleanup(assetDialogInput.value.trim());
            if(event.key === 'Escape') closeCurrentDialog();
        };
        assetDialogBackdrop.onmousedown = event => {
            if(event.target === assetDialogBackdrop) closeCurrentDialog();
        };
    });
}
let assetHoverTimer = 0;
function positionAssetHoverPreview(event){
    if(!assetHoverPreview || assetHoverPreview.hidden || assetHoverPreview.style.display === 'none') return;
    const pad = 14;
    const w = assetHoverPreview.offsetWidth || 260;
    const h = assetHoverPreview.offsetHeight || 300;
    let left = event.clientX - w - 16;
    if(left < pad) left = event.clientX + 16;
    left = Math.max(pad, Math.min(window.innerWidth - w - pad, left));
    const top = Math.max(pad, Math.min(window.innerHeight - h - pad, event.clientY + 12));
    assetHoverPreview.style.left = `${left}px`;
    assetHoverPreview.style.top = `${top}px`;
}
function showAssetHoverPreview(event, item){
    if(!assetHoverPreview || !item?.url) return;
    let media = assetHoverPreview.querySelector('img,video');
    const name = assetHoverPreview.querySelector('.asset-hover-name');
    const kind = assetMediaKind(item);
    if(kind === 'video' && media?.tagName?.toLowerCase() !== 'video'){
        media?.replaceWith(document.createElement('video'));
        media = assetHoverPreview.querySelector('video');
    } else if(kind !== 'video' && media?.tagName?.toLowerCase() !== 'img'){
        media?.replaceWith(document.createElement('img'));
        media = assetHoverPreview.querySelector('img');
    }
    if(kind === 'video'){
        media.muted = true;
        media.loop = true;
        media.playsInline = true;
        media.preload = 'metadata';
        media.controls = false;
        media.disablePictureInPicture = true;
        media.setAttribute('disablepictureinpicture', '');
        media.setAttribute('controlslist', 'nodownload noplaybackrate noremoteplayback');
        media.src = item.url;
        media.play?.().catch(() => {});
    } else {
        // 用预览代理（缩放图）而非原图，悬浮预览更快、不卡。
        media.loading = 'lazy';
        media.decoding = 'async';
        media.src = smartMediaPreviewUrl(item, 768);
        media.alt = 'asset preview';
    }
    name.textContent = item.name || 'asset';
    assetHoverPreview.hidden = false;
    assetHoverPreview.style.display = 'block';
    positionAssetHoverPreview(event);
}
function hideAssetHoverPreview(){
    if(!assetHoverPreview) return;
    assetHoverPreview.style.display = 'none';
    assetHoverPreview.hidden = true;
    const media = assetHoverPreview.querySelector('img,video');
    media?.pause?.();
    media?.removeAttribute('src');
    media?.load?.();
}
function beginAssetInlineRename(assetId){
    const item = (activeAssetCategory()?.items || []).find(x => x.id === assetId)
        || (activeWorkflowAssetCategory()?.items || []).find(x => x.id === assetId);
    const card = [...assetGrid.querySelectorAll('.asset-item')].find(el => el.dataset.assetId === assetId);
    const nameEl = card?.querySelector('.asset-name');
    if(!item || !card || !nameEl || card.querySelector('.asset-rename-input')) return;
    hideAssetHoverPreview();
    const previousName = item.name || 'asset';
    const previousDraggable = card.draggable;
    const input = document.createElement('input');
    input.className = 'asset-rename-input';
    input.type = 'text';
    input.value = previousName;
    input.setAttribute('aria-label', tr('smart.assetRename'));
    card.draggable = false;
    nameEl.replaceWith(input);
    input.focus();
    input.select();
    let done = false;
    const restore = () => {
        if(input.isConnected) input.replaceWith(nameEl);
        card.draggable = previousDraggable;
    };
    const finish = async save => {
        if(done) return;
        done = true;
        const name = input.value.trim();
        if(!save || !name || name === previousName){
            restore();
            return;
        }
        input.disabled = true;
        try {
            if(assetLibraryIsLocal() || item.file){
                const data = await smartCanvasApi().renameLocalAsset({path:item.file || item.id, name}).then(async r => {
                    if(!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || '重命名失败');
                    return r.json();
                });
                localAssetLibrary = {items:Array.isArray(data.items) ? data.items : localAssetLibrary.items, tree:data.tree || localAssetLibrary.tree};
                activeAssetCategoryId = data.item?.folder || activeAssetCategoryId;
                if(data.old_path && data.item?.url){
                    const oldUrl = `/assets/uploads/${String(data.old_path).split('/').map(encodeURIComponent).join('/')}`;
                    nodes.forEach(node => (node.images || []).forEach(img => {
                        if(img?.url !== oldUrl) return;
                        img.url = data.item.url;
                        img.name = data.item.name || img.name;
                        copyMediaSizeFields(data.item, img);
                    }));
                    scheduleSave();
                }
                renderAssetLibrary();
                render();
                toast('已重命名本地素材，反推提示词和分类索引已同步');
            } else {
                const data = await smartCanvasApi().renameAssetLibraryItem(assetId, {name}).then(r => r.json());
                setAssetLibraryFromResponse(data);
            }
        } catch(err){
            restore();
            toast(err.message || tr('smart.assetAddFail'));
        }
    };
    input.addEventListener('keydown', event => {
        event.stopPropagation();
        if(event.key === 'Enter'){
            event.preventDefault();
            finish(true);
        } else if(event.key === 'Escape'){
            event.preventDefault();
            finish(false);
        }
    });
    input.addEventListener('pointerdown', event => event.stopPropagation());
    input.addEventListener('mousedown', event => event.stopPropagation());
    input.addEventListener('click', event => event.stopPropagation());
    input.addEventListener('blur', () => finish(true));
}
function bindAssetItemEvents(){
    assetGrid.querySelectorAll('.asset-item').forEach(el => {
        const thumb = el.querySelector('.asset-thumb');
        // 悬浮预览延迟显示：滚动时缩略图会从光标下快速划过、连发 mouseenter，立即加载大图会卡。延迟后只在
        // 光标真正停留时才加载预览，滚动划过不触发。
        thumb?.addEventListener('mouseenter', e => {
            clearTimeout(assetHoverTimer);
            const data = {url:el.dataset.url, name:el.dataset.name, kind:el.dataset.kind};
            const cx = e.clientX, cy = e.clientY;
            assetHoverTimer = setTimeout(() => showAssetHoverPreview({clientX:cx, clientY:cy}, data), 160);
        });
        thumb?.addEventListener('mousemove', e => positionAssetHoverPreview(e));
        thumb?.addEventListener('mouseleave', () => { clearTimeout(assetHoverTimer); hideAssetHoverPreview(); });
        el.addEventListener('dragstart', e => {
            hideAssetHoverPreview();
            e.dataTransfer.effectAllowed = 'copy';
            const item = (activeAssetCategory()?.items || []).find(x => x.id === el.dataset.assetId);
            e.dataTransfer.setData('application/x-smart-asset', JSON.stringify(assetNodeImageFromItem(item || {url:el.dataset.url, name:el.dataset.name, kind:el.dataset.kind})));
            e.dataTransfer.setData('text/plain', el.dataset.url || '');
        });
    });
    assetGrid.querySelectorAll('[data-rename-asset]').forEach(btn => {
        btn.onclick = async e => {
            e.preventDefault(); e.stopPropagation();
            beginAssetInlineRename(btn.dataset.renameAsset);
        };
    });
    assetGrid.querySelectorAll('[data-rename-local-asset]').forEach(btn => {
        btn.onclick = async e => {
            e.preventDefault(); e.stopPropagation();
            beginAssetInlineRename(btn.dataset.renameLocalAsset || '');
        };
    });
    assetGrid.querySelectorAll('[data-delete-local-asset]').forEach(btn => {
        btn.onclick = async e => {
            e.preventDefault(); e.stopPropagation();
            btn.disabled = true;
            await deleteLocalAssetFromPanel(btn.dataset.deleteLocalAsset || '');
        };
    });
    assetGrid.querySelectorAll('[data-delete-asset]').forEach(btn => {
        btn.onclick = async e => {
            e.preventDefault(); e.stopPropagation();
            btn.disabled = true;
            try {
                const data = await smartCanvasApi().deleteAssetLibraryItem(btn.dataset.deleteAsset).then(r => r.json());
                setAssetLibraryFromResponse(data);
            } catch(err){
                btn.disabled = false;
                toast(err.message || tr('smart.assetAddFail'));
            }
        };
    });
}
function bindWorkflowAssetItemEvents(){
    assetGrid.querySelectorAll('[data-rename-workflow-asset]').forEach(btn => {
        btn.onclick = async e => {
            e.preventDefault();
            e.stopPropagation();
            beginAssetInlineRename(btn.dataset.renameWorkflowAsset);
        };
    });
    assetGrid.querySelectorAll('[data-delete-workflow-asset]').forEach(btn => {
        btn.onclick = async e => {
            e.preventDefault();
            e.stopPropagation();
            const item = (activeWorkflowAssetCategory()?.items || []).find(x => x.id === btn.dataset.deleteWorkflowAsset);
            if(!item) return;
            btn.disabled = true;
            try {
                const data = await smartCanvasApi().deleteAssetLibraryItem(item.id).then(r => r.json());
                setAssetLibraryFromResponse(data);
            } catch(err){
                btn.disabled = false;
                toast(err.message || tr('smart.assetAddFail'));
            }
        };
    });
}
async function addUrlToAssetLibrary(url, name=''){
    if(assetLibraryIsLocal()) return addUrlToLocalAssetLibrary(url, name);
    const cat = activeAssetCategory();
    if(!cat){ toast(tr('smart.assetNoFolder')); return; }
    const data = await smartCanvasApi().createAssetLibraryItem({library_id:activeAssetLibraryId, category_id:cat.id, url, name}).then(async r => {
        if(!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || tr('smart.assetAddFail'));
        return r.json();
    });
    setAssetLibraryFromResponse(data);
    toast(tr('smart.assetSaved'));
}
function localAssetFolderPath(){
    const cat = activeAssetCategory();
    return cat && cat.id !== '__root__' ? (cat.id || '') : '';
}
function setLocalAssetLibraryFromResponse(data){
    localAssetLibrary = {items:Array.isArray(data.items) ? data.items : localAssetLibrary.items, tree:data.tree || localAssetLibrary.tree};
}
async function addFilesToLocalAssetLibrary(files=[]){
    const supported = [...(files || [])].filter(isSupportedUploadFile);
    if(!supported.length) return [];
    const form = new FormData();
    form.append('folder', localAssetFolderPath());
    supported.forEach(file => form.append('files', file, file.name || 'media'));
    const data = await smartCanvasApi().uploadLocalAssets(form).then(async r => {
        if(!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || tr('smart.assetAddFail'));
        return r.json();
    });
    const localData = await smartCanvasApi().getLocalAssets().then(r => r.ok ? r.json() : {items:[], tree:null});
    setLocalAssetLibraryFromResponse(localData);
    renderAssetLibrary();
    toast(`已保存 ${data.files?.length || 0} 个本地素材`);
    return data.files || [];
}
async function addLocalPathsToLocalAssetLibrary(paths=[]){
    const imported = await importSmartLocalImages(paths);
    return addUrlItemsToLocalAssetLibrary(imported.map(item => ({url:item.url, name:item.name || smartImageNameFromUrl(item.url)})));
}
async function addUrlItemsToLocalAssetLibrary(items=[]){
    const list = (items || []).filter(item => item?.url);
    if(!list.length) return [];
    const data = await smartCanvasApi().importLocalAssetUrls({
        folder:localAssetFolderPath(),
        items:list.map(item => ({url:item.url, name:item.name || smartImageNameFromUrl(item.url)}))
    }).then(async r => {
        if(!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || tr('smart.assetAddFail'));
        return r.json();
    });
    setLocalAssetLibraryFromResponse(data);
    renderAssetLibrary();
    const failed = Array.isArray(data.items) ? data.items.filter(item => !item?.ok) : [];
    if(failed.length){
        const firstError = String(failed[0]?.error || '该素材无法安全导入').trim().slice(0, 120);
        const imported = Number(data.count || 0);
        toast(imported
            ? `已保存 ${imported} 个本地素材，${failed.length} 个未导入：${firstError}`
            : `没有素材被导入：${firstError}`);
    } else {
        toast(`已保存 ${data.count || 0} 个本地素材`);
    }
    return data.files || [];
}
async function addUrlToLocalAssetLibrary(url, name=''){
    return addUrlItemsToLocalAssetLibrary([{url, name:name || smartImageNameFromUrl(url)}]);
}
async function deleteLocalAssetFromPanel(itemId){
    const item = (activeAssetCategory()?.items || []).find(x => x.id === itemId)
        || (localAssetLibrary.items || []).find(x => x.id === itemId || x.file === itemId);
    if(!item) return;
    try {
        const data = await smartCanvasApi().deleteLocalAssets({names:[item.file || item.id]}).then(async r => {
            if(!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || '删除失败');
            return r.json();
        });
        const localData = await smartCanvasApi().getLocalAssets().then(r => r.ok ? r.json() : {items:[], tree:null});
        setLocalAssetLibraryFromResponse(localData);
        renderAssetLibrary();
        toast(data.deleted?.length ? '已删除本地素材' : '未找到要删除的本地素材');
    } catch(err){
        toast(err.message || '删除失败');
    }
}
function canvasImageDragPayload(node, index=0){
    const img = node?.images?.[index];
    if(!img?.url) return null;
    return {url:img.url, name:img.name || node.title || 'image'};
}
// 迁移旧数据：早期把图片节点作为成员（items[]）放进分组的画布，统一把这些图片吸收进 group.images，
// 让它们显示为卡片内的缩略图网格（新模型）。一次性、幂等。
function migrateSmartGroupImageMembers(){
    let changed = false;
    nodes.filter(isSmartGroupNode).forEach(group => {
        const imageMemberIds = (Array.isArray(group.items) ? group.items : [])
            .map(id => nodes.find(n => n.id === id))
            .filter(m => m && isSmartImageNode(m) && (m.images || []).some(img => img?.url))
            .map(m => m.id);
        imageMemberIds.forEach(id => {
            const member = nodes.find(n => n.id === id);
            if(member && absorbImageNodeIntoSmartGroup(group, member)) changed = true;
        });
    });
    return changed;
}
