/* Signal Flow canvas domain: classic-output-viewer.js. Loaded before the legacy entry to preserve its public global facade. */
function renderOutputMedia(item, useGridLayout=false){
    const url = outputUrlValue(item);
    const safe = escapeAttr(url);
    const meta = item && typeof item === 'object' ? item : {};
    const kind = mediaKindForOutputItem(item);
    const grid = useGridLayout ? (meta.grid || null) : null;
    const gridStyle = grid ? ` style="grid-row:${Number(grid.row || 0) + 1};grid-column:${Number(grid.col || 0) + 1};aspect-ratio:${Math.max(1, Number(grid.w || 1))}/${Math.max(1, Number(grid.h || 1))}"` : '';
    const timePill = meta.runMs && !meta.viewed ? `<span class="output-time-pill">${formatRunDuration(meta.runMs)}</span>` : '';
    if(isMissingAssetUrl(url)){
        return `<div class="output-img-wrap" data-output-url="${safe}" data-missing-url="${safe}"${gridStyle}>${missingAssetHtml(url, true)}${timePill}<button class="output-del" title="${tr('common.delete')}">×</button></div>`;
    }
    if(kind === 'video'){
        return `<div class="output-img-wrap" data-output-url="${safe}"${gridStyle}>${canvasVideoPreviewHtml(url, useGridLayout ? 512 : 768, 'alt="video output" data-video-fallback-attrs="controls data-output-video-fallback=&quot;1&quot;"')}${timePill}<button class="canvas-video-play output-video-play" type="button" title="播放"><i data-lucide="play"></i></button><div class="output-video-badge"><i data-lucide="play" class="w-3 h-3"></i>VIDEO</div><button class="output-del" title="${tr('common.delete')}">×</button></div>`;
    }
    if(kind === 'audio'){
        return `<div class="output-img-wrap output-audio-wrap" data-output-url="${safe}"${gridStyle}><div class="output-audio-card"><i data-lucide="file-audio" class="w-7 h-7"></i><span>${escapeHtml(outputImageName(url))}</span><audio src="${safe}" data-url="${safe}" controls preload="metadata"></audio></div>${timePill}<button class="output-del" title="${tr('common.delete')}">×</button></div>`;
    }
    if(kind === 'text' || kind === 'file'){
        const icon = kind === 'text' ? 'file-text' : 'file';
        const label = kind === 'text' ? 'TEXT' : 'FILE';
        return `<div class="output-img-wrap output-file-wrap" data-output-url="${safe}"${gridStyle}><div class="output-file-card"><i data-lucide="${icon}" class="w-7 h-7"></i><span>${escapeHtml(meta.name || outputImageName(url))}</span><small>${label}</small></div>${timePill}<button class="output-del" title="${tr('common.delete')}">×</button></div>`;
    }
    return `<div class="output-img-wrap" data-output-url="${safe}"${gridStyle}>${canvasPreviewImgHtml(url, useGridLayout ? 512 : 768, 'alt="generated output"')}${timePill}<button class="output-del" title="${tr('common.delete')}">×</button></div>`;
}
function outputGridLayout(node){
    const images = node?.images || [];
    if(!images.length || node?._pending?.length) return null;
    const layout = node.outputLayout;
    if(!layout || layout.type !== 'grid-split' || !layout.groupId) return null;
    const allMatch = images.every(item => item && typeof item === 'object' && item.grid?.groupId === layout.groupId);
    return allMatch ? layout : null;
}
function renderOutputGrid(node, pendingHtml=''){
    const layout = outputGridLayout(node);
    const gridClass = layout ? 'output-grid grid-layout' : 'output-grid';
    const style = layout ? ` style="--grid-cols:${Math.max(1, Number(layout.cols || 1))}"` : '';
    return `<div class="${gridClass}"${style}>${(node.images || []).map(item => renderOutputMedia(item, !!layout)).join('')}${pendingHtml}</div>`;
}
function outputImageName(url){
    const clean = (url || '').split('?')[0];
    const name = clean.split('/').filter(Boolean).pop();
    return name ? decodeURIComponent(name) : 'output image';
}
function setOutputDragPreview(event, img){
    if(!event.dataTransfer || !img) return;
    const wrap = document.createElement('div');
    wrap.className = 'output-drag-preview';
    const clone = img.cloneNode();
    clone.removeAttribute('id');
    wrap.appendChild(clone);
    document.body.appendChild(wrap);
    const rect = img.getBoundingClientRect();
    event.dataTransfer.setDragImage(wrap, Math.min(rect.width / 2, 120), Math.min(rect.height / 2, 120));
    setTimeout(() => wrap.remove(), 0);
}
function appendOutputImages(out, images, compareRef, metas=[], layout=null){
    const list = (images || []).filter(Boolean);
    if(!out || !list.length) return;
    if(layout?.type === 'grid-split'){
        out.images = [];
        out.outputLayout = layout;
    } else if(out.outputLayout) {
        delete out.outputLayout;
    }
    out.images = [...(out.images || []), ...list.map((url, i) => {
        const meta = metas[i] || metas[0] || {};
        const source = url && typeof url === 'object' ? url : {};
        const item = {url:outputUrlValue(url), viewed:false, runMs:meta.runMs || 0, run:meta.run || null};
        if(source.name) item.name = source.name;
        if(source.kind || source.mediaKind) item.kind = source.kind || source.mediaKind;
        const assetId = canvasExplicitAssetId(source);
        if(assetId) item.asset_id = assetId;
        if(meta.kind) item.kind = meta.kind;
        if(meta.grid) item.grid = meta.grid;
        return item;
    })];
    if(compareRef?.url){
        out.imageComparisons = out.imageComparisons || {};
        list.forEach(url => {
            out.imageComparisons[url] = {url:compareRef.url, name:compareRef.name || 'input image'};
        });
    }
}
function outputCompareUrlFor(url, out){
    const source = out?.imageComparisons?.[url];
    if(typeof source === 'string' && source) return source;
    if(source?.url) return source.url;
    const meta = outputMetaFor(url, out);
    return meta?.run?.refs?.find(ref => ref?.url)?.url || '';
}
function markOutputViewed(out, url){
    if(!out || !url || !(out.images || []).length) return;
    let changed = false;
    out.images = out.images.map(item => {
        if(typeof item === 'string') return item;
        if(item?.url === url && !item.viewed){
            changed = true;
            return {...item, viewed:true};
        }
        return item;
    });
    if(changed){
        render();
        scheduleSave();
    }
}
function outputLightboxItems(out=null){
    const normalize = (item, sourceOut=null) => {
        const url = outputUrlValue(item);
        if(!url || mediaKindForOutputItem(item) !== 'image') return null;
        return {url, outId:sourceOut?.id || ''};
    };
    const sourceOut = out?.id ? nodes.find(n => n.id === out.id) || out : null;
    if(sourceOut){
        if(sourceOut.type === 'group') return groupImageItems(sourceOut).map(item => normalize(item, sourceOut)).filter(Boolean);
        if(sourceOut.type === 'image' && sourceOut.url) return [normalize({url:sourceOut.url, kind:mediaKindForNode(sourceOut)}, sourceOut)].filter(Boolean);
        return (sourceOut.images || []).map(item => normalize(item, sourceOut)).filter(Boolean);
    }
    const outputNodeItems = nodes
        .filter(n => n.type === 'output')
        .flatMap(n => (n.images || []).map(item => normalize(item, n)).filter(Boolean));
    if(outputNodeItems.length) return outputNodeItems;
    return (canvas?.logs || [])
        .flatMap(log => (log.outputs || []).map(url => normalize(url, null)).filter(Boolean));
}
function openGroupLightbox(groupId, index=0){
    const group = nodes.find(n => n.id === groupId);
    const items = groupImageItems(group);
    if(!items.length) return;
    const item = items[Math.max(0, Math.min(items.length - 1, index))] || items[0];
    openOutputLightbox(item.url, group);
}
function navigateOutputLightbox(direction){
    if(!outputLightbox.classList.contains('open') || !currentOutputLightboxUrl) return false;
    const out = currentOutputLightboxOutId ? nodes.find(n => n.id === currentOutputLightboxOutId) : null;
    const items = outputLightboxItems(out);
    if(items.length < 2) return false;
    let idx = items.findIndex(item => item.url === currentOutputLightboxUrl);
    if(idx < 0) idx = 0;
    const next = items[(idx + direction + items.length) % items.length];
    const nextOut = next.outId ? nodes.find(n => n.id === next.outId) : null;
    openOutputLightbox(next.url, nextOut);
    return true;
}
function createImageCardFromOutput(url, point){
    if(!ensureCanvas() || !url) return;
    if(mediaKindForRef(url) !== 'image') return;
    const p = point || defaultPoint(0, 0);
    nodes.push({id:uid('img'), type:'image', x:p.x, y:p.y, url, name:outputImageName(url)});
    render();
    scheduleSave();
}
function setOutputCompareMode(active){
    outputPreview.classList.toggle('compare-mode', active);
    if(active){
        outputCompareOriginalWrap.style.clipPath = 'inset(0 50% 0 0)';
        outputCompareSlider.style.left = '50%';
    }
}
function outputResolutionText(text, meta=null){
    const parts = [text || '--'];
    if(meta?.runMs) parts.push(`<span>${formatRunDuration(meta.runMs)}</span>`);
    outputResolution.innerHTML = parts.join('<span style="opacity:.38">|</span>');
}
function setupOutputPromptPanel(meta){
    currentOutputMeta = meta || null;
    const prompt = meta?.run?.prompt || '';
    outputPromptPanel.classList.toggle('open', !!prompt || !!meta?.run);
    outputPromptText.textContent = prompt || tr('canvas.noPromptMeta');
    outputCopyPromptBtn.onclick = e => {
        e.stopPropagation();
        if(!prompt) return;
        copyTextToClipboard(prompt);
        const span = outputCopyPromptBtn.querySelector('span');
        const oldText = span?.textContent || tr('canvas.copyPrompt');
        outputCopyPromptBtn.classList.add('copied');
        if(span) span.textContent = tr('canvas.copied');
        clearTimeout(outputCopyPromptBtn._copyTimer);
        outputCopyPromptBtn._copyTimer = setTimeout(() => {
            outputCopyPromptBtn.classList.remove('copied');
            if(span) span.textContent = oldText;
        }, 1200);
    };
    outputRerunBtn.onclick = e => {
        e.stopPropagation();
        rerunFromOutputMeta(currentOutputMeta);
    };
}
promptTemplateSearch?.addEventListener('input', event => {
    promptTemplateQuery = event.target.value || '';
    renderPromptTemplateModal();
});
promptTemplateLibrarySelect?.addEventListener('change', () => {
    activePromptLibraryId = promptTemplateLibrarySelect.value || 'system';
    canvasPromptTemplates = activeCanvasPromptLibraryItems();
    promptTemplateSelectedId = '';
    promptTemplateEditing = false;
    renderPromptTemplateModal();
});
if(promptTemplateClose) promptTemplateClose.onclick = closePromptTemplateModal;
promptTemplatePanel?.addEventListener('pointerdown', e => e.stopPropagation());
promptTemplatePanel?.addEventListener('mousedown', e => e.stopPropagation());
promptTemplatePanel?.addEventListener('wheel', e => e.stopPropagation(), {passive:false});
promptTemplatePanel?.addEventListener('click', event => {
    event.stopPropagation();
    const apply = event.target.closest('[data-template-apply],[data-prompt-template-apply]');
    if(apply){
        applyPromptTemplateToPromptNode(apply.dataset.templateApply || apply.dataset.promptTemplateApply || 'positive');
        return;
    }
    if(event.target.closest('[data-template-save-current],[data-prompt-template-save-current]')){ saveCurrentCanvasPromptAsTemplate(); return; }
    if(event.target.closest('[data-template-new],[data-prompt-template-new]')){ createBlankCanvasPromptTemplate(); return; }
    if(event.target.closest('[data-template-edit],[data-prompt-template-edit]')){
        promptTemplateEditing = true;
        renderPromptTemplateModal();
        return;
    }
    if(event.target.closest('[data-template-edit-cancel],[data-prompt-template-edit-cancel]')){ promptTemplateEditing = false; renderPromptTemplateModal(); return; }
    if(event.target.closest('[data-template-edit-save],[data-prompt-template-edit-save]')){ saveCanvasPromptTemplateEdit(); return; }
    if(event.target.closest('[data-template-delete],[data-prompt-template-delete]')){
        deleteCanvasPromptTemplate();
        return;
    }
    const cat = event.target.closest('[data-template-cat],[data-prompt-template-cat]');
    if(cat){
        promptTemplateCategory = cat.dataset.templateCat || cat.dataset.promptTemplateCat || 'all';
        promptTemplateSelectedId = '';
        promptTemplateEditing = false;
        renderPromptTemplateModal();
        return;
    }
    const catEdit = event.target.closest('[data-template-cat-edit]');
    if(catEdit){
        renameCanvasPromptTemplateGroup(catEdit.dataset.templateCatEdit || '');
        return;
    }
    const catDelete = event.target.closest('[data-template-cat-delete]');
    if(catDelete){
        deleteCanvasPromptTemplateGroup(catDelete.dataset.templateCatDelete || '');
        return;
    }
    if(event.target.closest('[data-template-group-edit]')){
        promptTemplateGroupEditMode = !promptTemplateGroupEditMode;
        renderPromptTemplateModal();
        return;
    }
    if(event.target.closest('[data-template-cat-new]')){ createCanvasPromptTemplateGroup(); return; }
    const item = event.target.closest('[data-template-id],[data-prompt-template-id]');
    if(item){
        promptTemplateSelectedId = item.dataset.templateId || item.dataset.promptTemplateId || '';
        promptTemplateEditing = false;
        renderPromptTemplateModal();
        return;
    }
});
canvasAssetToggle?.addEventListener('click', () => toggleCanvasAssetLibrary());
workflowTransferToggle?.addEventListener('click', () => {
    if(workflowTransferModal?.classList.contains('open')) closeWorkflowTransferModal();
    else openWorkflowTransferModal();
});
canvasLogToggle?.addEventListener('click', event => {
    event.preventDefault();
    openCanvasLog();
});
workflowImportInput?.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if(file) importWorkflowFile(file);
    event.target.value = '';
});
workflowImportDropZone?.addEventListener('click', () => workflowImportInput?.click());
workflowImportDropZone?.addEventListener('dragenter', event => {
    event.preventDefault();
    event.stopPropagation();
    workflowImportDropZone.classList.add('drag-over');
});
workflowImportDropZone?.addEventListener('dragover', event => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    workflowImportDropZone.classList.add('drag-over');
});
workflowImportDropZone?.addEventListener('dragleave', event => {
    event.preventDefault();
    event.stopPropagation();
    if(!workflowImportDropZone.contains(event.relatedTarget)) workflowImportDropZone.classList.remove('drag-over');
});
workflowImportDropZone?.addEventListener('drop', event => {
    event.preventDefault();
    event.stopPropagation();
    workflowImportDropZone.classList.remove('drag-over');
    const file = [...(event.dataTransfer?.files || [])].find(item => /\.(json|zip)$/i.test(item.name || ''));
    if(file) importWorkflowFile(file);
    else setStatus('请拖入 JSON 或 ZIP 工作流文件');
});
canvasAssetCloseBtn?.addEventListener('click', () => toggleCanvasAssetLibrary(false));
canvasAssetLibrarySelect?.addEventListener('change', () => {
    activeCanvasAssetLibraryId = canvasAssetLibrarySelect.value || '';
    activeCanvasAssetCategoryId = '';
    renderCanvasAssetLibrary();
});
canvasAssetCategorySelect?.addEventListener('change', () => {
    activeCanvasAssetCategoryId = canvasAssetCategorySelect.value || '';
    renderCanvasAssetLibrary();
});
canvasAssetAddCategoryBtn?.addEventListener('click', async () => {
    if(canvasAssetLibraryIsLocal()){ setStatus('本地素材请在素材库管理中管理文件夹'); return; }
    const name = window.prompt('新分组名称', '新分组');
    if(!String(name || '').trim()) return;
    const data = await classicCanvasApi().createAssetLibraryCategory({library_id:activeCanvasAssetLibraryId, name:String(name).trim(), type:'image'}).then(r => r.json());
    canvasAssetLibrary = data.library || canvasAssetLibrary;
    activeCanvasAssetCategoryId = data.category?.id || activeCanvasAssetCategoryId;
    renderCanvasAssetLibrary();
});
canvasAssetPanel?.addEventListener('wheel', event => {
    event.stopPropagation();
    const scroller = event.target.closest?.('.canvas-asset-grid') || canvasAssetGrid;
    if(!scroller || getComputedStyle(scroller).display === 'none') return;
    const canScroll = scroller.scrollHeight > scroller.clientHeight || scroller.scrollWidth > scroller.clientWidth;
    if(!canScroll) return;
    event.preventDefault();
    scroller.scrollTop += event.deltaY;
    scroller.scrollLeft += event.deltaX;
}, {passive:false, capture:true});
workflowTransferModal?.addEventListener('wheel', event => {
    event.stopPropagation();
}, {passive:true, capture:true});
workflowTransferModal?.addEventListener('dragover', event => {
    event.preventDefault();
    event.stopPropagation();
    if(workflowImportDropZone){
        event.dataTransfer.dropEffect = 'copy';
        workflowImportDropZone.classList.add('drag-over');
    }
});
workflowTransferModal?.addEventListener('dragleave', event => {
    event.preventDefault();
    event.stopPropagation();
    if(!workflowTransferModal.contains(event.relatedTarget)) workflowImportDropZone?.classList.remove('drag-over');
});
workflowTransferModal?.addEventListener('drop', event => {
    event.preventDefault();
    event.stopPropagation();
    workflowImportDropZone?.classList.remove('drag-over');
    const file = [...(event.dataTransfer?.files || [])].find(item => /\.(json|zip)$/i.test(item.name || ''));
    if(file) importWorkflowFile(file);
    else setStatus('请拖入 JSON 或 ZIP 工作流文件');
});
function hasCanvasAssetSaveDrop(dataTransfer){
    return hasOutputImageDrag(dataTransfer) || hasImageDropData(dataTransfer);
}
canvasAssetDropZone?.addEventListener('dragover', event => {
    if(!hasCanvasAssetSaveDrop(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    canvasAssetDropZone.classList.add('drag-over');
});
canvasAssetDropZone?.addEventListener('dragleave', () => canvasAssetDropZone.classList.remove('drag-over'));
canvasAssetDropZone?.addEventListener('drop', async event => {
    if(!hasCanvasAssetSaveDrop(event.dataTransfer)) return;
    event.preventDefault();
    event.stopPropagation();
    canvasAssetDropZone.classList.remove('drag-over');
    try {
        if(hasOutputImageDrag(event.dataTransfer)){
            await addUrlToCanvasAssetLibrary(event.dataTransfer.getData('application/x-canvas-output-image'), 'output');
            return;
        }
        const payload = await resolveImageDropPayload(event.dataTransfer);
        if(payload.type === 'files'){
            const cat = activeCanvasAssetCategory();
            const data = cat ? await uploadFilesToLibrary(payload.files, activeCanvasAssetLibraryId, cat.id) : null;
            if(data?.library) {
                canvasAssetLibrary = data.library;
                renderCanvasAssetLibrary();
                setStatus('已保存到资产库');
            }
        } else if(payload.type === 'url') {
            await addUrlToCanvasAssetLibrary(payload.url, outputImageName(payload.url));
        }
    } catch(err) {
        showErrorModal(err.message || '保存资产失败', '保存资产失败');
    }
});
gateAssetManagerBtn?.addEventListener('click', openAssetManager);
document.querySelectorAll('[data-manager-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
        assetManagerTab = btn.dataset.managerTab || 'assets';
        renderAssetManager();
    });
});
assetManagerModal?.addEventListener('change', event => {
    let shouldRender = false;
    const assetCheck = event.target.closest?.('[data-manager-asset-check]');
    if(assetCheck){
        if(assetCheck.checked) managerSelectedAssetIds.add(assetCheck.dataset.managerAssetCheck);
        else managerSelectedAssetIds.delete(assetCheck.dataset.managerAssetCheck);
        shouldRender = true;
    }
    const promptCheck = event.target.closest?.('[data-manager-prompt-check]');
    if(promptCheck){
        if(promptCheck.checked) managerSelectedPromptIds.add(promptCheck.dataset.managerPromptCheck);
        else managerSelectedPromptIds.delete(promptCheck.dataset.managerPromptCheck);
        shouldRender = true;
    }
    const workflowCheck = event.target.closest?.('[data-manager-workflow-check]');
    if(workflowCheck){
        if(workflowCheck.checked) managerSelectedWorkflowIds.add(workflowCheck.dataset.managerWorkflowCheck);
        else managerSelectedWorkflowIds.delete(workflowCheck.dataset.managerWorkflowCheck);
        shouldRender = true;
    }
    if(shouldRender) renderAssetManager();
});
assetManagerModal?.addEventListener('click', async event => {
    const assetLib = event.target.closest?.('[data-manager-asset-lib]');
    if(assetLib){ activeCanvasAssetLibraryId = assetLib.dataset.managerAssetLib || ''; activeCanvasAssetCategoryId = ''; managerSelectedAssetIds.clear(); renderAssetManager(); return; }
    const assetCat = event.target.closest?.('[data-manager-asset-cat]');
    if(assetCat){ activeCanvasAssetCategoryId = assetCat.dataset.managerAssetCat || ''; managerSelectedAssetIds.clear(); renderAssetManager(); return; }
    const workflowLib = event.target.closest?.('[data-manager-workflow-lib]');
    if(workflowLib){ activeCanvasAssetLibraryId = workflowLib.dataset.managerWorkflowLib || ''; activeCanvasWorkflowCategoryId = ''; managerSelectedWorkflowIds.clear(); renderAssetManager(); return; }
    const workflowCat = event.target.closest?.('[data-manager-workflow-cat]');
    if(workflowCat){ activeCanvasWorkflowCategoryId = workflowCat.dataset.managerWorkflowCat || ''; managerSelectedWorkflowIds.clear(); renderAssetManager(); return; }
    const promptLib = event.target.closest?.('[data-manager-prompt-lib]');
    if(promptLib){ activePromptLibraryId = promptLib.dataset.managerPromptLib || 'system'; managerSelectedPromptIds.clear(); renderAssetManager(); return; }
    const workflowRename = event.target.closest?.('[data-manager-workflow-rename]');
    if(workflowRename){
        const itemId = workflowRename.dataset.managerWorkflowRename || '';
        const item = (activeCanvasWorkflowCategory()?.items || []).find(entry => entry.id === itemId);
        const name = window.prompt('工作流名称', item?.name || '');
        if(!item || !String(name || '').trim()) return;
        const data = await classicCanvasApi().renameAssetLibraryItem(item.id, {name}).then(r => r.json());
        canvasAssetLibrary = data.library || canvasAssetLibrary;
        renderAssetManager(); renderCanvasAssetLibrary(); return;
    }
    const workflowRemove = event.target.closest?.('[data-manager-workflow-remove]');
    if(workflowRemove){
        const itemId = workflowRemove.dataset.managerWorkflowRemove || '';
        const item = (activeCanvasWorkflowCategory()?.items || []).find(entry => entry.id === itemId);
        if(!item || !window.confirm(`删除工作流「${item.name || 'workflow'}」？`)) return;
        const data = await classicCanvasApi().deleteAssetLibraryItem(item.id).then(r => r.json());
        canvasAssetLibrary = data.library || canvasAssetLibrary;
        managerSelectedWorkflowIds.delete(item.id);
        renderAssetManager(); renderCanvasAssetLibrary(); return;
    }
    const assetRename = event.target.closest?.('[data-manager-asset-rename]');
    if(assetRename){
        const itemId = assetRename.dataset.managerAssetRename || '';
        const item = (activeCanvasMediaCategory()?.items || []).find(entry => entry.id === itemId);
        const name = window.prompt('资产名称', item?.name || '');
        if(!item || !String(name || '').trim()) return;
        const data = await classicCanvasApi().renameAssetLibraryItem(item.id, {name}).then(r => r.json());
        canvasAssetLibrary = data.library || canvasAssetLibrary;
        renderAssetManager(); renderCanvasAssetLibrary(); return;
    }
    const assetRemove = event.target.closest?.('[data-manager-asset-remove]');
    if(assetRemove){
        const itemId = assetRemove.dataset.managerAssetRemove || '';
        const item = (activeCanvasMediaCategory()?.items || []).find(entry => entry.id === itemId);
        if(!item || !window.confirm(`删除资产「${item.name || 'asset'}」？`)) return;
        const data = await classicCanvasApi().deleteAssetLibraryItem(item.id).then(r => r.json());
        canvasAssetLibrary = data.library || canvasAssetLibrary;
        managerSelectedAssetIds.delete(item.id);
        renderAssetManager(); renderCanvasAssetLibrary(); return;
    }
    const promptEdit = event.target.closest?.('[data-manager-prompt-edit]');
    if(promptEdit){
        const lib = activeCanvasPromptLibrary();
        if(!lib || lib.readonly) return;
        const itemId = promptEdit.dataset.managerPromptEdit || '';
        const item = (lib.items || []).find(entry => entry.id === itemId);
        if(!item) return;
        const name = window.prompt('提示词名称', item.name || '提示词');
        if(!String(name || '').trim()) return;
        const positive = window.prompt('提示词内容', item.positive || '');
        if(!String(positive || '').trim()) return;
        const data = await classicCanvasApi().updatePromptLibraryItem(item.id, {library_id:lib.id, name, positive, negative:item.negative || '', category:item.category || 'mine', scene:item.scene || ''}).then(r => r.json());
        canvasPromptLibraries = data.library?.libraries || canvasPromptLibraries;
        refreshCanvasPromptTemplatesFromLibraries();
        renderAssetManager(); return;
    }
    const promptRemove = event.target.closest?.('[data-manager-prompt-remove]');
    if(promptRemove){
        const lib = activeCanvasPromptLibrary();
        if(!lib || lib.readonly) return;
        const itemId = promptRemove.dataset.managerPromptRemove || '';
        const item = (lib.items || []).find(entry => entry.id === itemId);
        if(!item || !window.confirm(`删除提示词「${item.name || '提示词'}」？`)) return;
        const data = await classicCanvasApi().deletePromptLibraryItem(item.id).then(r => r.json());
        canvasPromptLibraries = data.library?.libraries || canvasPromptLibraries;
        managerSelectedPromptIds.delete(item.id);
        refreshCanvasPromptTemplatesFromLibraries();
        renderAssetManager(); return;
    }
    if(event.target.closest?.('[data-manager-asset-lib-new]')){
        const name = window.prompt('资产库名称', '新资产库');
        if(!String(name || '').trim()) return;
        const data = await classicCanvasApi().createAssetLibrary({name}).then(r => r.json());
        canvasAssetLibrary = data.library || canvasAssetLibrary;
        activeCanvasAssetLibraryId = data.asset_library?.id || activeCanvasAssetLibraryId;
        activeCanvasAssetCategoryId = '';
        renderAssetManager(); renderCanvasAssetLibrary(); return;
    }
    if(event.target.closest?.('[data-manager-asset-lib-rename]')){
        const lib = activeCanvasAssetLibrary();
        const name = window.prompt('资产库名称', lib?.name || '');
        if(!lib || !String(name || '').trim()) return;
        const data = await classicCanvasApi().renameAssetLibrary(lib.id, {name}).then(r => r.json());
        canvasAssetLibrary = data.library || canvasAssetLibrary;
        renderAssetManager(); renderCanvasAssetLibrary(); return;
    }
    if(event.target.closest?.('[data-manager-asset-lib-delete]')){
        const lib = activeCanvasAssetLibrary();
        if(!lib || !window.confirm(`删除资产库「${lib.name || '资产库'}」？`)) return;
        const data = await classicCanvasApi().deleteAssetLibrary(lib.id).then(r => r.json());
        canvasAssetLibrary = data.library || canvasAssetLibrary;
        activeCanvasAssetLibraryId = canvasAssetLibrary.active_library_id || canvasAssetLibraries()[0]?.id || '';
        activeCanvasAssetCategoryId = '';
        renderAssetManager(); renderCanvasAssetLibrary(); return;
    }
    if(event.target.closest?.('[data-manager-asset-cat-new]')){
        const name = window.prompt('分组名称', '新分组');
        if(!String(name || '').trim()) return;
        const data = await classicCanvasApi().createAssetLibraryCategory({library_id:activeCanvasAssetLibraryId, name, type:'image'}).then(r => r.json());
        canvasAssetLibrary = data.library || canvasAssetLibrary;
        activeCanvasAssetCategoryId = data.category?.id || activeCanvasAssetCategoryId;
        renderAssetManager(); renderCanvasAssetLibrary(); return;
    }
    if(event.target.closest?.('[data-manager-asset-cat-rename]')){
        const cat = activeCanvasMediaCategory();
        const name = window.prompt('分组名称', cat?.name || '');
        if(!cat || !String(name || '').trim()) return;
        const data = await classicCanvasApi().renameAssetLibraryCategory(cat.id, {name}).then(r => r.json());
        canvasAssetLibrary = data.library || canvasAssetLibrary;
        renderAssetManager(); renderCanvasAssetLibrary(); return;
    }
    if(event.target.closest?.('[data-manager-asset-cat-delete]')){
        const cat = activeCanvasMediaCategory();
        if(!cat || !window.confirm(`删除分组「${cat.name || '分组'}」？`)) return;
        const data = await classicCanvasApi().deleteAssetLibraryCategory(cat.id).then(r => r.json());
        canvasAssetLibrary = data.library || canvasAssetLibrary;
        activeCanvasAssetCategoryId = canvasMediaCategories()[0]?.id || '';
        renderAssetManager(); renderCanvasAssetLibrary(); return;
    }
    if(event.target.closest?.('[data-manager-asset-delete]')){
        if(!managerSelectedAssetIds.size) return;
        const data = await classicCanvasApi().deleteAssetLibraryItems({library_id:activeCanvasAssetLibraryId, ids:[...managerSelectedAssetIds]}).then(r => r.json());
        canvasAssetLibrary = data.library || canvasAssetLibrary;
        managerSelectedAssetIds.clear();
        renderAssetManager(); renderCanvasAssetLibrary(); return;
    }
    if(event.target.closest?.('[data-manager-workflow-export]')){
        const items = (activeCanvasWorkflowCategory()?.items || []).filter(item => managerSelectedWorkflowIds.has(item.id));
        if(items.length === 1) {
            const item = items[0];
            downloadUrl(item.url, `${item.name || 'workflow'}${String(item.url).toLowerCase().endsWith('.json') ? '.json' : '.zip'}`);
        } else if(items.length > 1) {
            const res = await classicCanvasApi().downloadCanvasAssets({filename:'workflows.zip', items:items.map(item => ({url:item.url, name:item.name || 'workflow'}))});
            if(res.ok) downloadBlob(await res.blob(), 'workflows.zip');
        }
        return;
    }
    if(event.target.closest?.('[data-manager-workflow-delete]')){
        if(!managerSelectedWorkflowIds.size) return;
        const data = await classicCanvasApi().deleteAssetLibraryItems({library_id:activeCanvasAssetLibraryId, ids:[...managerSelectedWorkflowIds]}).then(r => r.json());
        canvasAssetLibrary = data.library || canvasAssetLibrary;
        managerSelectedWorkflowIds.clear();
        renderAssetManager(); renderCanvasAssetLibrary(); return;
    }
    if(event.target.closest?.('[data-manager-workflow-cat-new]')){
        const name = window.prompt('工作流分组名称', '工作流');
        if(!String(name || '').trim()) return;
        const data = await classicCanvasApi().createAssetLibraryCategory({library_id:activeCanvasAssetLibraryId, name, type:'workflow'}).then(r => r.json());
        canvasAssetLibrary = data.library || canvasAssetLibrary;
        activeCanvasWorkflowCategoryId = data.category?.id || activeCanvasWorkflowCategoryId;
        renderAssetManager(); renderCanvasAssetLibrary(); return;
    }
    if(event.target.closest?.('[data-manager-prompt-lib-new]')){
        const name = window.prompt('提示词库名称', '新提示词库');
        if(!String(name || '').trim()) return;
        const data = await classicCanvasApi().createPromptLibrary({name}).then(r => r.json());
        canvasPromptLibraries = data.library?.libraries || canvasPromptLibraries;
        activePromptLibraryId = data.prompt_library?.id || activePromptLibraryId;
        refreshCanvasPromptTemplatesFromLibraries();
        renderAssetManager(); return;
    }
    if(event.target.closest?.('[data-manager-prompt-lib-rename]')){
        const lib = activeCanvasPromptLibrary();
        if(!lib || lib.readonly) return;
        const name = window.prompt('提示词库名称', lib.name || '');
        if(!String(name || '').trim()) return;
        const data = await classicCanvasApi().renamePromptLibrary(lib.id, {name}).then(r => r.json());
        canvasPromptLibraries = data.library?.libraries || canvasPromptLibraries;
        refreshCanvasPromptTemplatesFromLibraries();
        renderAssetManager(); return;
    }
    if(event.target.closest?.('[data-manager-prompt-lib-delete]')){
        const lib = activeCanvasPromptLibrary();
        if(!lib || lib.readonly || !window.confirm(`删除提示词库「${lib.name || '提示词库'}」？`)) return;
        const data = await classicCanvasApi().deletePromptLibrary(lib.id).then(r => r.json());
        canvasPromptLibraries = data.library?.libraries || canvasPromptLibraries;
        activePromptLibraryId = data.library?.active_library_id || canvasPromptLibraries.find(item => item.id !== 'system')?.id || 'system';
        refreshCanvasPromptTemplatesFromLibraries();
        renderAssetManager(); return;
    }
    if(event.target.closest?.('[data-manager-prompt-new]')){
        const lib = activeCanvasPromptLibrary();
        if(!lib || lib.readonly) return;
        const name = window.prompt('提示词名称', '新提示词');
        if(!String(name || '').trim()) return;
        const positive = window.prompt('提示词内容', '');
        if(!String(positive || '').trim()) return;
        const data = await classicCanvasApi().createPromptLibraryItem({library_id:lib.id, name, positive, category:'mine'}).then(r => r.json());
        canvasPromptLibraries = data.library?.libraries || canvasPromptLibraries;
        refreshCanvasPromptTemplatesFromLibraries();
        renderAssetManager(); return;
    }
    if(event.target.closest?.('[data-manager-prompt-delete]')){
        if(!managerSelectedPromptIds.size) return;
        const data = await classicCanvasApi().deletePromptLibraryItems({ids:[...managerSelectedPromptIds]}).then(r => r.json());
        canvasPromptLibraries = data.library?.libraries || canvasPromptLibraries;
        managerSelectedPromptIds.clear();
        refreshCanvasPromptTemplatesFromLibraries();
        renderAssetManager(); return;
    }
}, true);
function rerunFromOutputMeta(meta){
    if(!ensureCanvas() || !meta?.run?.nodeType) return;
    const base = JSON.parse(JSON.stringify(meta.run.node || {}));
    const p = defaultPoint(180, 40);
    const node = {...base, id:uid(base.type || meta.run.nodeType), type:meta.run.nodeType, x:p.x, y:p.y, inputs:[], running:false};
    nodes.push(node);
    const prompt = meta.run.prompt || '';
    if(prompt){
        const promptNode = {id:uid('pr'), type:'prompt', x:p.x - 340, y:p.y, text:prompt};
        nodes.push(promptNode);
        connections.push({id:uid('c'), from:promptNode.id, to:node.id});
    }
    (meta.run.refs || []).slice(0, 8).forEach((ref, i) => {
        const imgNode = {id:uid('img'), type:'image', x:p.x - 340, y:p.y + 110 + i * 86, url:ref.url, name:ref.name || 'image'};
        nodes.push(imgNode);
        connections.push({id:uid('c'), from:imgNode.id, to:node.id});
    });
    closeOutputLightbox();
    render();
    scheduleSave();
}
function updateOutputCompareSlider(clientX){
    const rect = outputCompareContainer.getBoundingClientRect();
    if(!rect.width) return;
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    outputCompareOriginalWrap.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
    outputCompareSlider.style.left = `${percent}%`;
}
function applyOutputPreviewZoom(){
    const transform = `translate(${outputPreviewPan.x}px, ${outputPreviewPan.y}px) scale(${outputPreviewZoom})`;
    [outputLightboxImg, outputCompareResult, outputCompareOriginal].forEach(img => {
        img.style.transform = transform;
        img.style.transformOrigin = '0 0';
    });
    outputPreview.classList.toggle('zoomed', outputPreviewZoom > 1.001);
}
function resetOutputPreviewZoom(){
    outputPreviewZoom = 1;
    outputPreviewPan = {x: 0, y: 0};
    outputPreviewPanDrag = null;
    outputPreview.classList.remove('panning');
    applyOutputPreviewZoom();
}
function initOutputPreviewZoomEvents(){
    outputPreview.addEventListener('wheel', e => {
        if(outputLightboxVideo.style.display === 'block') return;
        e.preventDefault();
        e.stopPropagation();
        const rect = outputPreview.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;
        const before = {
            x:(localX - outputPreviewPan.x) / outputPreviewZoom,
            y:(localY - outputPreviewPan.y) / outputPreviewZoom
        };
        const factor = e.deltaY > 0 ? .9 : 1.1;
        const nextZoom = Math.max(1, Math.min(6, outputPreviewZoom * factor));
        outputPreviewZoom = nextZoom;
        outputPreviewPan = nextZoom <= 1.001 ? {x: 0, y: 0} : {
            x:localX - before.x * nextZoom,
            y:localY - before.y * nextZoom
        };
        applyOutputPreviewZoom();
    }, {passive:false});
    outputPreview.addEventListener('mousedown', e => {
        if(outputLightboxVideo.style.display === 'block') return;
        if(e.button !== 0 || outputPreviewZoom <= 1.001) return;
        if(e.target.closest('.output-preview-actions, .output-resolution, .output-compare-slider')) return;
        outputPreviewPanDrag = {
            sx:e.clientX,
            sy:e.clientY,
            ox:outputPreviewPan.x,
            oy:outputPreviewPan.y
        };
        outputPreview.classList.add('panning');
        e.preventDefault();
        e.stopPropagation();
    });
    window.addEventListener('mousemove', e => {
        if(!outputPreviewPanDrag) return;
        outputPreviewPan = {
            x:outputPreviewPanDrag.ox + e.clientX - outputPreviewPanDrag.sx,
            y:outputPreviewPanDrag.oy + e.clientY - outputPreviewPanDrag.sy
        };
        applyOutputPreviewZoom();
    });
    window.addEventListener('mouseup', () => {
        outputPreviewPanDrag = null;
        outputPreview.classList.remove('panning');
    });
}
function initOutputCompareEvents(){
    outputCompareContainer.addEventListener('mousedown', e => {
        outputCompareDrag = true;
        updateOutputCompareSlider(e.clientX);
        e.preventDefault();
        e.stopPropagation();
    });
    outputCompareSlider.addEventListener('mousedown', e => {
        outputCompareDrag = true;
        e.preventDefault();
        e.stopPropagation();
    });
    window.addEventListener('mousemove', e => {
        if(outputCompareDrag) updateOutputCompareSlider(e.clientX);
    });
    window.addEventListener('mouseup', () => { outputCompareDrag = false; });
    outputCompareContainer.addEventListener('touchstart', e => {
        outputCompareDrag = true;
        updateOutputCompareSlider(e.touches[0].clientX);
        e.preventDefault();
        e.stopPropagation();
    }, {passive:false});
    window.addEventListener('touchmove', e => {
        if(outputCompareDrag) {
            updateOutputCompareSlider(e.touches[0].clientX);
            e.preventDefault();
        }
    }, {passive:false});
    window.addEventListener('touchend', () => { outputCompareDrag = false; });
}
function openOutputLightbox(url, out){
    if(!url) return;
    resetOutputPreviewZoom();
    currentOutputLightboxOutId = out?.id || '';
    currentOutputLightboxUrl = url;
    const meta = outputMetaFor(url, out);
    markOutputViewed(out, url);
    setupOutputPromptPanel(meta);
    outputResolutionText('--', meta);
    currentOutputCompareUrl = outputCompareUrlFor(url, out);
    setOutputCompareMode(false);
    const groupDownloadItems = out?.type === 'group' ? groupImageItems(out) : [];
    if(outputDownloadAllBtn){
        outputDownloadAllBtn.style.display = groupDownloadItems.length > 1 ? 'flex' : 'none';
        outputDownloadAllBtn.onclick = e => {
            e.stopPropagation();
            if(currentOutputLightboxOutId) downloadGroupNodeImages(currentOutputLightboxOutId);
        };
    }
    const videoMode = mediaKindForOutputItem(meta && Object.keys(meta).length ? {...meta, url} : url) === 'video';
    outputLightboxImg.style.display = videoMode ? 'none' : 'block';
    outputLightboxVideo.style.display = videoMode ? 'block' : 'none';
    outputCompareResult.style.display = videoMode ? 'none' : 'block';
    outputCompareOriginal.style.display = videoMode ? 'none' : 'block';
    if(videoMode){
        outputLightboxImg.src = '';
        outputCompareResult.src = '';
        outputCompareOriginal.src = '';
        outputLightboxVideo.onloadedmetadata = () => {
            outputResolutionText(outputLightboxVideo.videoWidth && outputLightboxVideo.videoHeight
                ? `${outputLightboxVideo.videoWidth} x ${outputLightboxVideo.videoHeight}`
                : 'Video', meta);
        };
        outputLightboxVideo.src = canvasDisplayMediaUrl(url, outputDownloadName(url));
        outputPreview.ondblclick = null;
        outputDownloadBtn.onclick = e => {
            e.stopPropagation();
            downloadUrl(url, outputDownloadName(url)).catch(err => alert(err.message || '下载失败'));
        };
        outputLightbox.classList.add('open');
        refreshIcons();
        return;
    }
    outputLightboxVideo.pause();
    outputLightboxVideo.src = '';
    outputLightboxImg.draggable = false;
    outputCompareResult.draggable = false;
    outputCompareOriginal.draggable = false;
    outputLightboxImg.onload = () => {
        outputResolutionText(`${outputLightboxImg.naturalWidth} x ${outputLightboxImg.naturalHeight}`, meta);
    };
    outputLightboxImg.src = canvasDisplayMediaUrl(url, outputDownloadName(url));
    outputCompareResult.src = canvasDisplayMediaUrl(url, outputDownloadName(url));
    outputCompareOriginal.src = currentOutputCompareUrl ? canvasDisplayMediaUrl(currentOutputCompareUrl, outputDownloadName(currentOutputCompareUrl)) : '';
    outputPreview.ondblclick = e => {
        e.stopPropagation();
        if(!currentOutputCompareUrl) return;
        setOutputCompareMode(!outputPreview.classList.contains('compare-mode'));
    };
    outputDownloadBtn.onclick = e => {
        e.stopPropagation();
        downloadUrl(url, outputDownloadName(url)).catch(err => alert(err.message || '下载失败'));
    };
    outputLightbox.classList.add('open');
    refreshIcons();
}
function closeOutputLightbox(){
    outputLightbox.classList.remove('open');
    setOutputCompareMode(false);
    outputLightboxImg.src = '';
    outputLightboxVideo.pause();
    outputLightboxVideo.src = '';
    outputLightboxVideo.style.display = 'none';
    outputLightboxImg.style.display = 'block';
    outputCompareResult.style.display = 'block';
    outputCompareOriginal.style.display = 'block';
    outputCompareResult.src = '';
    outputCompareOriginal.src = '';
    outputPreview.ondblclick = null;
    if(outputDownloadAllBtn){
        outputDownloadAllBtn.style.display = 'none';
        outputDownloadAllBtn.onclick = null;
    }
    resetOutputPreviewZoom();
    currentOutputCompareUrl = '';
    currentOutputMeta = null;
    currentOutputLightboxOutId = '';
    currentOutputLightboxUrl = '';
    setupOutputPromptPanel(null);
}
function groupSelectedImages(){
    if(!ensureCanvas()) return;
    const targets = [...selected].map(id => nodes.find(n => n.id === id)).filter(n => n?.type === 'image' || n?.type === 'prompt');
    let group;
    pushUndo();
    if(targets.length){
        const box = nodeBounds(targets.map(n => n.id));
        group = {id:uid('grp'), type:'group', x:box.x - 24, y:box.y - 58, w:box.w + 48, h:box.h + 90, items:targets.map(n => n.id)};
    } else {
        const p = defaultPoint(0, 0);
        group = {id:uid('grp'), type:'group', x:p.x, y:p.y, w:300, h:220, items:[]};
    }
    nodes.push(group);
    if(targets.length) handoffExistingInputsToGroup(group, targets);
    selected.clear();
    selected.add(group.id);
    syncGeneratorInputs();
    refreshGeneratorInputViews();
    render();
    scheduleSave();
}
function nodeBounds(ids){
    const rects = ids.map(id => {
        const n = nodes.find(item => item.id === id);
        const el = nodesEl.querySelector(`.node[data-id="${id}"]`);
        if(!n) return null;
        return {x:n.x, y:n.y, w:el?.offsetWidth || n.w || 260, h:el?.offsetHeight || n.h || 220};
    }).filter(Boolean);
    const x1 = Math.min(...rects.map(r => r.x));
    const y1 = Math.min(...rects.map(r => r.y));
    const x2 = Math.max(...rects.map(r => r.x + r.w));
    const y2 = Math.max(...rects.map(r => r.y + r.h));
    return {x:x1, y:y1, w:x2 - x1, h:y2 - y1};
}
