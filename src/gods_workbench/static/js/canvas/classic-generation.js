/* Signal Flow canvas domain: classic-generation.js. Loaded before the legacy entry to preserve its public global facade. */
function renderLoopBody(node){
    const wrap = document.createElement('div');
    wrap.className = 'loop-body';
    node.count = loopCount(node);
    node.loopStart = Math.max(1, Number(node.loopStart) || 1);
    node.imageBatchSize = Math.max(1, Math.min(100, Number(node.imageBatchSize) || 1));
    node.mode = node.mode === 'parallel' ? 'parallel' : 'serial';
    node.showPrompt = Boolean(node.showPrompt);
    node.imageInput = Boolean(node.imageInput);
    node.videoInput = false;
    const imageInputCount = loopInputImageRefs(node, {index:node.loopStart}).length;
    const promptItemCount = node.showPrompt ? loopInputPromptItems(node).length : 0;
    const hasUpstreamPrompt = promptItemCount > 0;
    const loopTargetId = findLoopCascadeTarget(node.id);
    const loopTargetOrder = loopTargetId ? computeCascadeOrder(loopTargetId) : [];
    const loopRunHtml = loopTargetId ? (isCascadeActive(loopTargetId)
        ? `<div class="gen-run-row"><button class="gen-cascade-btn gen-cascade-stop" type="button" data-loop-cascade-stop="${loopTargetId}" ${isCascadeStopping(loopTargetId) ? 'disabled' : ''}><i data-lucide="square" class="w-4 h-4"></i><span>${isCascadeStopping(loopTargetId) ? '停止中…' : '停止运行'}</span></button></div>`
        : `<div class="gen-run-row"><button class="gen-cascade-btn" type="button" data-loop-cascade="${loopTargetId}" title="从当前循环节点启动整条工作流"><i data-lucide="play-circle" class="w-4 h-4"></i><span>开始 ${loopTargetOrder.length || 1} 个节点 × ${node.count} ${tr('canvas.loopRounds')}</span></button></div>`)
        : '';
    wrap.innerHTML = `
        <div class="loop-count-row">
            <div class="loop-run-row">
                <div class="loop-count-group">
                    <span class="loop-count-label">${tr('canvas.loopCount')}</span>
                    <input class="loop-count-input" type="number" min="1" max="100" step="1" value="${node.count}">
                </div>
                <div class="seg loop-mode">
                    <button type="button" data-loop-mode="serial" class="${node.mode !== 'parallel' ? 'active' : ''}">${tr('canvas.loopSerial')}</button>
                    <button type="button" data-loop-mode="parallel" class="${node.mode === 'parallel' ? 'active' : ''}">${tr('canvas.loopParallel')}</button>
                </div>
            </div>
            <div class="loop-toggle-row">
                <button class="loop-toggle loop-image-toggle ${node.imageInput ? 'active' : ''}" type="button"><i data-lucide="image" class="w-3.5 h-3.5"></i>${tr('canvas.loopImageToggle')}</button>
                <button class="loop-toggle loop-prompt-toggle ${node.showPrompt ? 'active' : ''}" type="button"><i data-lucide="text-cursor-input" class="w-3.5 h-3.5"></i>${tr('canvas.loopPromptToggle')}</button>
            </div>
        </div>
        ${node.imageInput ? `<div class="loop-image-panel">
            <div class="loop-image-row">
                <span class="loop-count-label">${tr('canvas.loopImageStart')}</span>
                <input class="loop-count-input loop-image-start-input" type="number" min="1" max="9999" step="1" value="${node.loopStart}">
                <span class="loop-count-label">${tr('canvas.loopBatchSize')}</span>
                <input class="loop-count-input loop-batch-input" type="number" min="1" max="100" step="1" value="${node.imageBatchSize}">
            </div>
            <div class="loop-image-hint loop-image-hint-only">${imageInputCount ? trf('canvas.loopImageWillOutput', {n:imageInputCount}) : tr('canvas.loopImageEmpty')}</div>
        </div>` : ''}
        ${node.showPrompt ? `<div class="loop-prompt-panel ${hasUpstreamPrompt ? 'has-upstream' : ''}">
            <div class="loop-field">
                <div class="loop-variable-editor ${hasUpstreamPrompt ? 'is-disabled' : ''}" contenteditable="${hasUpstreamPrompt ? 'false' : 'true'}" data-placeholder="${escapeAttr(tr('canvas.loopVariablePlaceholder'))}">${loopVariableHtml(node.variablePrompt || '')}</div>
            </div>
            ${hasUpstreamPrompt ? `<div class="loop-prompt-hint">已识别 ${promptItemCount} 条提示词，按计数轮流输出</div>` : ''}
            <div class="loop-start-row">
                <button class="loop-token-btn loop-counter-token-btn" type="button" data-token="《计数》">${tr('canvas.counterToken')}</button>
                <span class="loop-count-label">${tr('canvas.loopStart')}</span>
                <input class="loop-count-input loop-start-input" type="number" min="1" max="9999" step="1" value="${node.loopStart}">
            </div>
        </div>` : ''}
        ${loopRunHtml}
    `;
    const countInput = wrap.querySelector('.loop-count-input');
    const variable = wrap.querySelector('.loop-variable-editor');
    const toggle = wrap.querySelector('.loop-prompt-toggle');
    const imageToggle = wrap.querySelector('.loop-image-toggle');
    if(variable) {
        variable.onmousedown = e => e.stopPropagation();
        variable.onclick = e => e.stopPropagation();
        variable.onwheel = e => e.stopPropagation();
    }
    const refreshPreview = () => {
        const preview = wrap.querySelector('.loop-preview:last-child');
        if(preview) preview.textContent = renderLoopPrompt(node, {index:1, total:loopCount(node)}) || tr('canvas.noPromptMeta');
    };
    const refreshImageHint = () => {
        const hint = wrap.querySelector('.loop-image-hint-only');
        if(!hint) return;
        const count = loopInputImageRefs(node, {index:node.loopStart}).length;
        hint.textContent = count ? trf('canvas.loopImageWillOutput', {n:count}) : tr('canvas.loopImageEmpty');
    };
    const syncStartInputs = source => {
        wrap.querySelectorAll('.loop-image-start-input, .loop-start-input').forEach(input => {
            if(input !== source && input.value !== String(node.loopStart)) input.value = node.loopStart;
        });
    };
    countInput.oninput = e => {
        node.count = loopCount({count:e.target.value});
        e.target.value = node.count;
        refreshPreview();
        /* 同步底部级联按钮上的轮数文字，避免输入循环次数后下游"× N 轮"残留旧值
           不直接 render() 是为了不破坏当前正在输入的 input 焦点 */
        const loopCascadeBtn = wrap.querySelector('[data-loop-cascade]');
        if(loopCascadeBtn){
            const span = loopCascadeBtn.querySelector('span');
            if(span) span.textContent = `开始 ${loopTargetOrder.length || 1} 个节点 × ${node.count} ${tr('canvas.loopRounds')}`;
        }
        if(loopTargetId){
            const targetEl = document.querySelector(`.node[data-id="${loopTargetId}"]`);
            const targetCascadeBtn = targetEl?.querySelector('[data-cascade]');
            if(targetCascadeBtn){
                const span = targetCascadeBtn.querySelector('span');
                if(span){
                    const targetOrder = computeCascadeOrder(loopTargetId);
                    span.textContent = `一键运行 ${targetOrder.length} 个节点 × ${node.count} ${tr('canvas.loopRounds')}`;
                }
            }
        }
        scheduleSave();
    };
    const startInput = wrap.querySelector('.loop-start-input');
    if(startInput){
        startInput.onmousedown = e => e.stopPropagation();
        startInput.onclick = e => e.stopPropagation();
        startInput.oninput = e => {
            node.loopStart = Math.max(1, Number(e.target.value) || 1);
            refreshImageHint();
            syncStartInputs(e.target);
            scheduleSave();
            syncGeneratorInputs();
            refreshGeneratorInputViews();
        };
    }
    const imageStartInput = wrap.querySelector('.loop-image-start-input');
    if(imageStartInput){
        imageStartInput.onmousedown = e => e.stopPropagation();
        imageStartInput.onclick = e => e.stopPropagation();
        imageStartInput.oninput = e => {
            node.loopStart = Math.max(1, Number(e.target.value) || 1);
            refreshImageHint();
            syncStartInputs(e.target);
            scheduleSave();
            syncGeneratorInputs();
            refreshGeneratorInputViews();
        };
    }
    const batchInput = wrap.querySelector('.loop-batch-input');
    if(batchInput){
        batchInput.onmousedown = e => e.stopPropagation();
        batchInput.onclick = e => e.stopPropagation();
        batchInput.oninput = e => {
            node.imageBatchSize = Math.max(1, Math.min(100, Number(e.target.value) || 1));
            e.target.value = node.imageBatchSize;
            refreshImageHint();
            scheduleSave();
            syncGeneratorInputs();
            refreshGeneratorInputViews();
        };
    }
    wrap.querySelectorAll('[data-loop-mode]').forEach(btn => {
        btn.onclick = e => {
            e.stopPropagation();
            node.mode = btn.dataset.loopMode === 'parallel' ? 'parallel' : 'serial';
            render();
            scheduleSave();
        };
    });
    toggle.onclick = e => {
        e.stopPropagation();
        const opening = !node.showPrompt;
        node.showPrompt = opening;
        autoSizeLoopNode(node, opening);
        autoSizeLoopForPanels(node);
        if(!opening){
            connections = connections.filter(c => c.to !== node.id || canConnect(c.from, node.id));
        }
        render();
        scheduleSave();
        syncGeneratorInputs();
        refreshGeneratorInputViews();
    };
    if(variable) {
        variable.oninput = e => {
            node.variablePrompt = loopEditorText(variable);
            refreshPreview();
            scheduleSave();
            syncGeneratorInputs();
            refreshGeneratorInputViews();
        };
        variable.addEventListener('click', e => {
            const btn = e.target.closest('.loop-token-chip button');
            if(!btn) return;
            e.preventDefault();
            e.stopPropagation();
            btn.closest('.loop-token-chip')?.remove();
            node.variablePrompt = loopEditorText(variable);
            refreshPreview();
            scheduleSave();
            syncGeneratorInputs();
            refreshGeneratorInputViews();
        });
    }
    wrap.querySelectorAll('[data-token]').forEach(btn => {
        btn.onclick = e => {
            e.stopPropagation();
            const token = btn.dataset.token || '';
            if(!variable) return;
            insertLoopToken(variable, token);
            node.variablePrompt = loopEditorText(variable);
            variable.focus();
            refreshPreview();
            scheduleSave();
            syncGeneratorInputs();
            refreshGeneratorInputViews();
        };
    });
    if(imageToggle){
        imageToggle.onclick = e => {
            e.stopPropagation();
            node.imageInput = !node.imageInput;
            if(node.imageInput){
                node.loopStart = Math.max(1, Number(node.loopStart) || 1);
                node.imageBatchSize = Math.max(1, Math.min(100, Number(node.imageBatchSize) || 1));
            } else {
                connections = connections.filter(c => c.to !== node.id || canConnect(c.from, node.id));
            }
            autoSizeLoopForPanels(node);
            render();
            scheduleSave();
            syncGeneratorInputs();
            refreshGeneratorInputViews();
        };
    }
    wrap.querySelectorAll('[data-loop-cascade]').forEach(btn => {
        btn.onmousedown = e => e.stopPropagation();
        btn.onclick = e => {
            e.stopPropagation();
            runNodeCascade(btn.dataset.loopCascade);
        };
    });
    wrap.querySelectorAll('[data-loop-cascade-stop]').forEach(btn => {
        btn.onmousedown = e => e.stopPropagation();
        btn.onclick = e => {
            e.stopPropagation();
            requestCascadeStop(btn.dataset.loopCascadeStop);
        };
    });
    return wrap;
}
function renderLLMBody(node){
    const wrap = document.createElement('div');
    wrap.className = 'llm-body';
    const mode = node.mode || 'node';
    node.llmProvider = resolveChatProviderId(node.llmProvider || 'comfly');
    const llmProv = node.llmProvider;
    if(llmProv === 'modelscope') node.model = node.llmMsModel || node.model;
    if(!providerChatModels(llmProv).includes(node.model)) node.model = providerChatModels(llmProv)[0] || node.model;
    const modelOpts = chatModelOptions(node.model, llmProv);
    const imgs = llmInputImages(node);
    const videos = llmInputVideos(node);
    const mediaBadgeText = [
        imgs.length ? `${imgs.length} 张图片` : '',
        videos.length ? `${videos.length} 个视频` : ''
    ].filter(Boolean).join(' · ');
    const imgBadge = mediaBadgeText ? `<div style="display:flex;align-items:center;gap:6px;padding:5px 10px;border-radius:8px;background:rgba(16,185,129,.12);color:#047857;font-size:10.5px;font-weight:700;width:fit-content;line-height:1.4"><i data-lucide="${videos.length && !imgs.length ? 'video' : 'image'}" class="w-3 h-3"></i>已连接 ${mediaBadgeText} · 需选支持视觉/视频的模型</div>` : '';
    node.showSystem = Boolean(node.showSystem);
    wrap.innerHTML = `
        <div class="llm-row">
            <select class="select-lite llm-provider-select" style="flex:1">${chatProviderOptions(llmProv)}</select>
            <select class="select-lite llm-model">${modelOpts}</select>
            <div class="llm-mode"><button data-mode="node">${tr('canvas.nodeMode')}</button><button data-mode="chat">${tr('canvas.chatMode')}</button></div>
            <button class="llm-sys-toggle ${node.showSystem ? 'active' : ''}" type="button">System</button>
        </div>
        ${imgBadge}
        ${node.showSystem ? `<textarea class="llm-system" placeholder="${tr('canvas.systemPrompt')}">${escapeHtml(node.systemPrompt || '')}</textarea>` : ''}
        <div class="llm-node-pane"></div>
        <div class="llm-chat-pane"></div>
    `;
    const providerSelect = wrap.querySelector('.llm-provider-select');
    const modelSelect = wrap.querySelector('.llm-model');
    providerSelect.value = llmProv;
    modelSelect.value = resolveChatModel(node.model, llmProv);
    [providerSelect, modelSelect].forEach(input => {
        input.onmousedown = e => e.stopPropagation();
        input.onclick = e => e.stopPropagation();
    });
    providerSelect.onchange = e => {
        e.stopPropagation();
        node.llmProvider = e.target.value;
        const models = providerChatModels(node.llmProvider);
        node.model = models[0] || '';
        if(node.llmProvider === 'modelscope') node.llmMsModel = node.model;
        render();
        scheduleSave();
    };
    modelSelect.onchange = e => {
        e.stopPropagation();
        node.model = e.target.value;
        if((node.llmProvider||'comfly') === 'modelscope') node.llmMsModel = e.target.value;
        scheduleSave();
    };
    wrap.querySelector('.llm-sys-toggle').onclick = e => { e.stopPropagation(); node.showSystem = !node.showSystem; render(); scheduleSave(); };
    const sysEl = wrap.querySelector('.llm-system');
    if(sysEl){ sysEl.oninput = e => { node.systemPrompt = e.target.value; scheduleSave(); }; bindScrollableText(sysEl); }
    wrap.querySelectorAll('[data-mode]').forEach(btn => {
        btn.classList.toggle('active', mode === btn.dataset.mode);
        btn.onclick = e => { e.stopPropagation(); node.mode = btn.dataset.mode; render(); scheduleSave(); };
    });
    const nodePane = wrap.querySelector('.llm-node-pane');
    const chatPane = wrap.querySelector('.llm-chat-pane');
    if(mode === 'chat'){
        nodePane.style.display = 'none';
        renderLLMChatPane(chatPane, node);
    } else {
        chatPane.style.display = 'none';
        renderLLMNodePane(nodePane, node);
    }
    return wrap;
}
function renderLLMNodePane(container, node){
    const connectedInput = llmInputText(node);
    const isReadonly = connectedInput.length > 0;
    const inputValue = connectedInput || node.userInput || '';
    const inputHeight = Math.max(70, node.llmInputHeight || 110);
    const outputHeight = Math.max(70, node.llmOutputHeight || 150);
    const inputPlaceholder = langIsEn() ? 'Type input, or connect a Prompt node…' : '直接输入，或连接提示词节点…';
    container.innerHTML = `
        <div class="llm-pane-label">Input${isReadonly ? ' <span style="font-size:9px;opacity:.5;font-weight:600;text-transform:none;letter-spacing:0">(来自连接)</span>' : ''}</div>
        <textarea class="llm-input-area llm-input-output" style="height:${inputHeight}px; flex:0 0 ${inputHeight}px;" ${isReadonly ? 'readonly' : ''} placeholder="${inputPlaceholder}">${escapeHtml(inputValue)}</textarea>
        <div class="llm-pane-resizer" title="${tr('canvas.resizePanes')}"></div>
        <div class="llm-pane-label">Output</div>
        <div class="llm-output-wrap" style="height:${outputHeight}px; flex:0 0 ${outputHeight}px;">
            <button class="llm-copy-btn llm-output-copy" type="button" title="复制"><i data-lucide="copy" class="w-3.5 h-3.5"></i></button>
            <div class="llm-output llm-result-output">${escapeHtml(node.outputText || tr('canvas.llmOutputEmpty'))}</div>
        </div>
        <div class="gen-run-row mt-2">
            <button class="llm-run ${node.running ? 'running' : ''}" ${node.running ? 'disabled' : ''}><i data-lucide="play" class="w-4 h-4"></i>${node.running ? tr('canvas.running') : 'Run LLM'}</button>
            ${cascadeBtnHtml(node)}
        </div>
        ${retryBarHtml(node)}
    `;
    const inputEl = container.querySelector('.llm-input-output');
    bindScrollableText(inputEl);
    if(!isReadonly){
        inputEl.oninput = e => { node.userInput = e.target.value; };
    }
    bindScrollableText(container.querySelector('.llm-result-output'));
    container.querySelector('.llm-pane-resizer').onmousedown = e => startLLMPaneResize(e, node);
    container.querySelector('.llm-run').onclick = e => { e.stopPropagation(); runLLMNode(node.id); };
    bindCascadeButtons(container, node.id);
    const copyBtn = container.querySelector('.llm-output-copy');
    if(copyBtn){
        copyBtn.onmousedown = e => e.stopPropagation();
        copyBtn.onclick = async e => {
            e.stopPropagation();
            const text = node.outputText || '';
            if(!text) return;
            if(await copyTextToClipboard(text)){
                copyBtn.classList.add('copied');
                setTimeout(() => copyBtn.classList.remove('copied'), 1500);
            }
        };
    }
}
function renderLLMChatPane(container, node){
    const messages = node.messages || [];
    container.innerHTML = `
        <div class="llm-chat-log">${messages.length ? messages.map((msg, mi) => `<div class="llm-bubble ${msg.role === 'user' ? 'user' : 'assistant'}" data-msg-idx="${mi}">${escapeHtml(msg.content || '')}${msg.role === 'assistant' ? `<button class="llm-bubble-copy" type="button" title="复制"><i data-lucide="copy" style="width:11px;height:11px;display:inline-block;vertical-align:middle"></i></button>` : ''}</div>`).join('') : `<div class="text-[11px] text-gray-300">${tr('canvas.startChat')}</div>`}</div>
        <textarea class="llm-chat-input mt-2" rows="2" placeholder="${tr('canvas.chatInput')}">${escapeHtml(node.chatInput || '')}</textarea>
        <button class="llm-run mt-2" ${node.running ? 'disabled' : ''}><i data-lucide="send" class="w-4 h-4"></i>${node.running ? tr('canvas.sending') : 'Send'}</button>
    `;
    bindScrollableText(container.querySelector('.llm-chat-log'));
    bindScrollableText(container.querySelector('.llm-chat-input'));
    const chatInputEl = container.querySelector('.llm-chat-input');
    chatInputEl.oninput = e => { node.chatInput = e.target.value; scheduleSave(); };
    chatInputEl.onkeydown = e => {
        if(e.key === 'Enter' && !e.shiftKey && !e.isComposing){
            e.preventDefault();
            e.stopPropagation();
            runLLMChat(node.id);
        }
    };
    container.querySelector('.llm-run').onclick = e => { e.stopPropagation(); runLLMChat(node.id); };
    container.querySelectorAll('.llm-bubble-copy').forEach(btn => {
        btn.onmousedown = e => e.stopPropagation();
        btn.onclick = async e => {
            e.stopPropagation();
            const bubble = btn.closest('.llm-bubble');
            const idx = Number(bubble?.dataset.msgIdx);
            const msg = (node.messages || [])[idx];
            if(!msg) return;
            if(await copyTextToClipboard(msg.content || '')){
                btn.classList.add('copied');
                setTimeout(() => btn.classList.remove('copied'), 1500);
            }
        };
    });
}
function bindScrollableText(el){
    if(!el) return;
    const stop = e => e.stopPropagation();
    const beginSelection = e => {
        e.stopPropagation();
        textSelectionGuard = {
            el,
            scrollTop:el.scrollTop || 0,
            scrollLeft:el.scrollLeft || 0,
            clientY:e.clientY,
            wheelUntil:0,
            active:true
        };
    };
    el.addEventListener('mousedown', beginSelection);
    el.addEventListener('mousemove', e => {
        e.stopPropagation();
        if(textSelectionGuard?.el === el) textSelectionGuard.clientY = e.clientY;
    });
    el.addEventListener('mouseup', e => {
        e.stopPropagation();
        if(textSelectionGuard?.el === el) textSelectionGuard.active = false;
    });
    el.addEventListener('mouseleave', e => {
        e.stopPropagation();
        if(textSelectionGuard?.el === el) {
            el.scrollTop = textSelectionGuard.scrollTop;
            el.scrollLeft = textSelectionGuard.scrollLeft;
        }
    });
    el.addEventListener('scroll', () => {
        const guard = textSelectionGuard;
        if(!guard || guard.el !== el || !guard.active || Date.now() < guard.wheelUntil) {
            if(guard?.el === el) {
                guard.scrollTop = el.scrollTop || 0;
                guard.scrollLeft = el.scrollLeft || 0;
            }
            return;
        }
        const nextTop = el.scrollTop || 0;
        const prevTop = guard.scrollTop || 0;
        const rect = el.getBoundingClientRect();
        const pointerBelow = Number.isFinite(guard.clientY) && guard.clientY > rect.bottom - 10;
        const pointerAbove = Number.isFinite(guard.clientY) && guard.clientY < rect.top + 10;
        const jumpedToTop = prevTop > Math.max(80, el.clientHeight * 0.45) && nextTop < 4 && !pointerAbove;
        const wrongDirectionJump = pointerBelow && nextTop < prevTop - Math.max(40, el.clientHeight * 0.25);
        if(jumpedToTop || wrongDirectionJump) {
            requestAnimationFrame(() => {
                if(textSelectionGuard?.el === el && textSelectionGuard.active) {
                    el.scrollTop = prevTop;
                    el.scrollLeft = guard.scrollLeft || 0;
                }
            });
            return;
        }
        guard.scrollTop = nextTop;
        guard.scrollLeft = el.scrollLeft || 0;
    }, {passive:true});
    el.addEventListener('click', stop);
    el.addEventListener('dblclick', stop);
    el.addEventListener('wheel', e => {
        e.stopPropagation();
        if(textSelectionGuard?.el === el) textSelectionGuard.wheelUntil = Date.now() + 180;
    }, {passive:true});
}
function startLLMPaneResize(e, node){
    e.preventDefault();
    e.stopPropagation();
    llmPaneDrag = {
        node,
        sy:e.clientY,
        inputStart:Math.max(70, node.llmInputHeight || 110),
        outputStart:Math.max(70, node.llmOutputHeight || 150)
    };
    window.onmousemove = onLLMPaneResize;
    window.onmouseup = endDrag;
}
function onLLMPaneResize(e){
    if(!llmPaneDrag) return;
    const total = llmPaneDrag.inputStart + llmPaneDrag.outputStart;
    const delta = (e.clientY - llmPaneDrag.sy) / viewport.scale;
    const minPane = 70;
    const nextInput = Math.max(minPane, Math.min(total - minPane, llmPaneDrag.inputStart + delta));
    const nextOutput = Math.max(minPane, total - nextInput);
    llmPaneDrag.node.llmInputHeight = Math.round(nextInput);
    llmPaneDrag.node.llmOutputHeight = Math.round(nextOutput);
    const el = nodesEl.querySelector(`.node[data-id="${llmPaneDrag.node.id}"]`);
    if(el){
        const inputEl = el.querySelector('.llm-input-output');
        const outputEl = el.querySelector('.llm-result-output');
        if(inputEl){
            inputEl.style.height = `${llmPaneDrag.node.llmInputHeight}px`;
            inputEl.style.flexBasis = `${llmPaneDrag.node.llmInputHeight}px`;
        }
        if(outputEl){
            outputEl.style.height = `${llmPaneDrag.node.llmOutputHeight}px`;
            outputEl.style.flexBasis = `${llmPaneDrag.node.llmOutputHeight}px`;
        }
    }
}
function llmInputText(node){
    return connections.filter(c => c.to === node.id).map(c => nodes.find(n => n.id === c.from)).filter(Boolean).map(n => {
        if(n.type === 'prompt') return n.text || '';
        if(n.type === 'loop') return renderLoopPrompt(n);
        if(n.type === 'promptGroup') return (n.items || []).map(id => nodes.find(x => x.id === id)).filter(Boolean).map(p => p.text || '').filter(Boolean).join('\n\n');
        if(n.type === 'llm') return n.outputText || '';
        return '';
    }).filter(Boolean).join('\n\n');
}
function llmInputImages(node){
    const urls = [];
    connections.filter(c => c.to === node.id).map(c => nodes.find(n => n.id === c.from)).filter(Boolean).forEach(n => {
        if(n.type === 'image' && n.url && mediaKindForNode(n) === 'image') urls.push(n.url);
        if(n.type === 'output' && (n.images||[]).length){
            const last = [...n.images].reverse().map(outputUrlValue).find(url => url && !isVideoUrl(url) && !isAudioUrl(url));
            if(last) urls.push(last);
        }
        if(n.type === 'group'){
            (n.items || []).map(id => nodes.find(x => x.id === id)).filter(x => x?.type === 'image' && x?.url && mediaKindForNode(x) === 'image').forEach(img => urls.push(img.url));
        }
    });
    return urls;
}
function llmInputVideos(node){
    const urls = [];
    connections.filter(c => c.to === node.id).map(c => nodes.find(n => n.id === c.from)).filter(Boolean).forEach(n => {
        if(n.type === 'image' && n.url && mediaKindForNode(n) === 'video') urls.push(n.url);
        if(n.type === 'output' && (n.images||[]).length){
            const last = [...n.images].reverse().map(outputUrlValue).find(url => url && isVideoUrl(url));
            if(last) urls.push(last);
        }
        if(n.type === 'group'){
            (n.items || []).map(id => nodes.find(x => x.id === id)).filter(x => x?.type === 'image' && x?.url && mediaKindForNode(x) === 'video').forEach(video => urls.push(video.url));
        }
    });
    return urls;
}
function renderGeneratorBody(node){
    const wrap = document.createElement('div');
    wrap.className = 'generator-body';
    const inputSources = generatorSources(node);
    const ordered = orderedSources(node, inputSources);
    const mediaInputs = ordered.filter(src => src.refs?.some(ref => ['image','video','audio'].includes(mediaKindForRef(ref))));
    const promptInputs = ordered.filter(src => src.prompt && !src.refs?.length);
    sanitizeImageNodeProviderModel(node);
    normalizeApiNodeSizeChoice(node);
    wrap.innerHTML = `
        <div class="prompt-list mb-3"></div>
        <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">${tr('canvas.images')}</div>
        <div class="input-list"></div>
        <div class="gen-settings">
            <div class="gen-settings-row">
                <select class="select-lite provider-select">${providerOptions(node.apiProvider)}</select>
                <select class="select-lite model-select">${imageModelOptions(node.model, node.apiProvider)}</select>
            </div>
            <div class="gen-settings-row api-size-row">
                <select class="select-lite resolution compact-select" data-field="resolution">
                    <option value="auto">自动</option>
                    <option value="1k">1K</option>
                    <option value="2k">2K</option>
                    <option value="4k">4K</option>
                    <option value="custom">${tr('canvas.custom')}</option>
                </select>
                <select class="select-lite ratio compact-select" data-field="ratio">
                    <option value="square">1:1</option>
                    <option value="portrait">2:3</option>
                    <option value="landscape">3:2</option>
                    <option value="portrait43">3:4</option>
                    <option value="landscape43">4:3</option>
                    <option value="story">9:16</option>
                    <option value="wide">16:9</option>
                    <option value="ultrawide">21:9</option>
                    <option value="ultratall">9:21</option>
                    <option value="source">${tr('canvas.adaptiveRatio')}</option>
                    <option value="custom">${tr('canvas.custom')}</option>
                </select>
                <select class="select-lite quality-select">
                    <option value="auto">Q auto</option>
                    <option value="low">Q low</option>
                    <option value="medium">Q med</option>
                    <option value="high">Q high</option>
                </select>
                <div class="gen-count-row">
                    <div class="gen-stepper">
                        <button class="gen-step-btn" data-step="-1" type="button" title="${tr('canvas.decrease')}" aria-label="${tr('canvas.decreaseCount')}"><i data-lucide="chevron-left" class="w-3.5 h-3.5"></i></button>
                        <input class="gen-count-input" type="text" inputmode="numeric" pattern="[0-9]*" value="${Math.max(1, Math.min(8, Number(node.count || 1)))}">
                        <button class="gen-step-btn" data-step="1" type="button" title="${tr('canvas.increase')}" aria-label="${tr('canvas.increaseCount')}"><i data-lucide="chevron-right" class="w-3.5 h-3.5"></i></button>
                    </div>
                </div>
            </div>
            <div class="gen-settings-row custom-ratio-row" style="display:none">
                <label class="field">
                    <div class="setting-title">${tr('canvas.ratioWidth')}</div>
                    <input class="setting-input custom-ratio-w-input" type="number" min="1" step="1" value="${escapeHtml(node.customRatioWidth || '')}" placeholder="4">
                </label>
                <label class="field">
                    <div class="setting-title">${tr('canvas.ratioHeight')}</div>
                    <input class="setting-input custom-ratio-h-input" type="number" min="1" step="1" value="${escapeHtml(node.customRatioHeight || '')}" placeholder="3">
                </label>
            </div>
            <div class="gen-settings-row custom-size-row" style="display:none">
                <label class="field">
                    <div class="setting-title">${tr('canvas.width')}</div>
                    <input class="setting-input custom-w-input" type="number" min="64" step="64" value="${escapeHtml(node.customWidth || '')}" placeholder="Auto">
                </label>
                <label class="field">
                    <div class="setting-title">${tr('canvas.height')}</div>
                    <input class="setting-input custom-h-input" type="number" min="64" step="64" value="${escapeHtml(node.customHeight || '')}" placeholder="Auto">
                </label>
                <button class="secondary-btn fit-size-btn" type="button" style="height:32px;align-self:flex-end;padding:0 10px;font-size:11px">${tr('canvas.fitImageSize')}</button>
            </div>
        </div>
        <div class="gen-run-row">
            <button class="gen-btn ${node.running ? 'running' : ''}" ${node.running ? 'disabled' : ''}><i data-lucide="zap" class="w-4 h-4"></i>${node.running ? tr('canvas.generating') : tr('canvas.apiGenerate')}</button>
            ${cascadeBtnHtml(node)}
        </div>
        ${retryBarHtml(node)}
    `;
    const providerSelect = wrap.querySelector('.provider-select');
    const modelSelect = wrap.querySelector('.model-select');
    providerSelect.onmousedown = e => e.stopPropagation();
    providerSelect.onclick = e => e.stopPropagation();
    providerSelect.onchange = e => {
        e.stopPropagation();
        node.apiProvider = e.target.value;
        const providerModels = providerImageModels(node.apiProvider);
        if(!providerModels.includes(resolveImageModel(node.model))) node.model = providerModels[0] || '';
        node._apiResolutionUserSet = false;
        node.resolution = defaultApiImageResolution(node.model);
        modelSelect.innerHTML = imageModelOptions(node.model, node.apiProvider);
        syncSizeControls();
        syncQualityControls();
        scheduleSave();
    };
    modelSelect.onmousedown = e => e.stopPropagation();
    modelSelect.onclick = e => e.stopPropagation();
    modelSelect.onchange = e => {
        e.stopPropagation();
        node.model = e.target.value;
        node._apiResolutionUserSet = false;
        if(node.resolution !== 'custom') node.resolution = defaultApiImageResolution(node.model);
        syncSizeControls();
        syncQualityControls();
        scheduleSave();
    };
    const ratioSelect = wrap.querySelector('.ratio');
    const resolutionSelect = wrap.querySelector('.resolution');
    const qualitySelect = wrap.querySelector('.quality-select');
    const customRatioRow = wrap.querySelector('.custom-ratio-row');
    const customSizeRow = wrap.querySelector('.custom-size-row');
    const customRatioWInput = wrap.querySelector('.custom-ratio-w-input');
    const customRatioHInput = wrap.querySelector('.custom-ratio-h-input');
    const customWInput = wrap.querySelector('.custom-w-input');
    const customHInput = wrap.querySelector('.custom-h-input');
    const fitSizeBtn = wrap.querySelector('.fit-size-btn');
    const referenceImages = ordered.flatMap(src => src.refs || []);
    const syncQualityControls = () => {
        qualitySelect.disabled = false;
        if(!['auto','low','medium','high'].includes(String(node.quality || 'auto'))) node.quality = 'auto';
        qualitySelect.value = node.quality || 'auto';
    };
    const hydrateCustomParts = () => {
        if((!node.customRatioWidth || !node.customRatioHeight) && node.customRatio) {
            const raw = String(node.customRatio || '');
            if(raw.includes(':')){
                const [w,h] = raw.split(':');
                node.customRatioWidth = node.customRatioWidth || w;
                node.customRatioHeight = node.customRatioHeight || h;
            }
        }
        if((!node.customWidth || !node.customHeight) && node.customSize) {
            const parsed = parseSizeValue(node.customSize);
            node.customWidth = node.customWidth || parsed?.width || '';
            node.customHeight = node.customHeight || parsed?.height || '';
        }
    };
    hydrateCustomParts();
    let sourceRatioRequest = 0;
    const updateSourceRatioFromFirstRef = async () => {
        if(node.ratio !== 'source') return;
        const ref = referenceImages.find(item => item.url);
        const requestId = ++sourceRatioRequest;
        if(!ref){
            node.customRatio = '';
            node.customRatioWidth = '';
            node.customRatioHeight = '';
            customRatioWInput.value = '';
            customRatioHInput.value = '';
            return;
        }
        try {
            const dims = await getImageDimensions(ref.url);
            if(requestId !== sourceRatioRequest || node.ratio !== 'source') return;
            const parts = ratioPartsFromDimensions(dims.width, dims.height);
            node.customRatioWidth = String(parts.width);
            node.customRatioHeight = String(parts.height);
            node.customRatio = `${parts.width}:${parts.height}`;
            customRatioWInput.value = node.customRatioWidth;
            customRatioHInput.value = node.customRatioHeight;
            scheduleSave();
        } catch(_) {}
    };
    const syncSizeControls = () => {
        normalizeApiNodeSizeChoice(node);
        const autoOption = resolutionSelect.querySelector('option[value="auto"]');
        if(autoOption) autoOption.disabled = !isGptImageAutoSizeModel(resolveImageModel(node.model));
        const squareOption = ratioSelect.querySelector('option[value="square"]');
        if(squareOption){
            squareOption.disabled = false;
            squareOption.title = '';
        }
        const ratioValue = node.ratio && [...ratioSelect.options].some(opt => opt.value === node.ratio) ? node.ratio : 'square';
        ratioSelect.value = ratioValue;
        resolutionSelect.value = node.resolution || defaultApiImageResolution(node.model);
        ratioSelect.disabled = node.resolution === 'custom' || node.resolution === 'auto';
        customRatioRow.style.display = (node.resolution !== 'auto' && (node.ratio === 'custom' || node.ratio === 'source')) ? 'flex' : 'none';
        customSizeRow.style.display = node.resolution === 'custom' ? 'flex' : 'none';
        customRatioWInput.disabled = node.ratio === 'source';
        customRatioHInput.disabled = node.ratio === 'source';
        customRatioWInput.value = node.customRatioWidth || '';
        customRatioHInput.value = node.customRatioHeight || '';
        customWInput.value = node.customWidth || '';
        customHInput.value = node.customHeight || '';
        if(fitSizeBtn) fitSizeBtn.disabled = !referenceImages.some(ref => ref.url);
        syncQualityControls();
        if(node.ratio === 'source') updateSourceRatioFromFirstRef();
    };
    qualitySelect.onmousedown = e => e.stopPropagation();
    qualitySelect.onclick = e => e.stopPropagation();
    qualitySelect.onchange = e => {
        e.stopPropagation();
        node.quality = e.target.value;
        scheduleSave();
    };
    ratioSelect.onmousedown = e => e.stopPropagation();
    ratioSelect.onclick = e => e.stopPropagation();
    ratioSelect.onchange = e => {
        e.stopPropagation();
        node.ratio = e.target.value;
        normalizeApiNodeSizeChoice(node);
        if(node.ratio !== 'custom' && node.ratio !== 'source') {
            node.customRatio = '';
            node.customRatioWidth = '';
            node.customRatioHeight = '';
        } else if(node.ratio === 'source') {
            node.customRatio = '';
            node.customRatioWidth = '';
            node.customRatioHeight = '';
        }
        syncSizeControls();
        scheduleSave();
    };
    resolutionSelect.onmousedown = e => e.stopPropagation();
    resolutionSelect.onclick = e => e.stopPropagation();
    resolutionSelect.onchange = e => {
        e.stopPropagation();
        node.resolution = e.target.value;
        node._apiResolutionUserSet = true;
        if(node.resolution === 'custom') {
            node.ratio = '';
        } else if(node.resolution === 'auto') {
            if(!node.ratio) node.ratio = 'square';
            node.customSize = '';
            node.customWidth = '';
            node.customHeight = '';
        } else if(!node.ratio) {
            node.ratio = 'square';
            node.customSize = '';
            node.customWidth = '';
            node.customHeight = '';
        } else {
            node.customSize = '';
            node.customWidth = '';
            node.customHeight = '';
        }
        normalizeApiNodeSizeChoice(node);
        syncSizeControls();
        scheduleSave();
    };
    [customRatioWInput, customRatioHInput].forEach(input => {
        input.onmousedown = e => e.stopPropagation();
        input.onclick = e => e.stopPropagation();
        input.oninput = e => {
            node.customRatioWidth = customRatioWInput.value;
            node.customRatioHeight = customRatioHInput.value;
            node.customRatio = node.customRatioWidth && node.customRatioHeight ? `${node.customRatioWidth}:${node.customRatioHeight}` : '';
            node.ratio = 'custom';
            syncSizeControls();
            scheduleSave();
        };
    });
    [customWInput, customHInput].forEach(input => {
        input.onmousedown = e => e.stopPropagation();
        input.onclick = e => e.stopPropagation();
        input.oninput = e => {
            node.customWidth = customWInput.value;
            node.customHeight = customHInput.value;
            node.customSize = node.customWidth && node.customHeight ? `${node.customWidth}x${node.customHeight}` : '';
            node.resolution = 'custom';
            node._apiResolutionUserSet = true;
            node.ratio = '';
            syncSizeControls();
            scheduleSave();
        };
    });
    if(fitSizeBtn){
        fitSizeBtn.onmousedown = e => e.stopPropagation();
        fitSizeBtn.onclick = async e => {
            e.stopPropagation();
            const ref = referenceImages.find(item => item.url);
            if(!ref) return;
            try {
                const dims = await getImageDimensions(ref.url);
                node.customWidth = dims.width;
                node.customHeight = dims.height;
                node.customSize = `${dims.width}x${dims.height}`;
                node.resolution = 'custom';
                node._apiResolutionUserSet = true;
                node.ratio = '';
                syncSizeControls();
                scheduleSave();
            } catch(err) {
                    showErrorModal(tr('canvas.imageReadFailed'));
            }
        };
    }
    syncSizeControls();
    const countInput = wrap.querySelector('.gen-count-input');
    countInput.onmousedown = e => e.stopPropagation();
    countInput.onclick = e => e.stopPropagation();
    countInput.oninput = e => {
        const value = Math.max(1, Math.min(8, Number(e.target.value) || 1));
        node.count = value;
        scheduleSave();
    };
    countInput.onblur = e => { e.target.value = String(Math.max(1, Math.min(8, Number(node.count || 1)))); };
    wrap.querySelectorAll('[data-step]').forEach(btn => {
        btn.onclick = e => {
            e.stopPropagation();
            const next = Math.max(1, Math.min(8, Number(node.count || 1) + Number(btn.dataset.step || 0)));
            node.count = next;
            countInput.value = String(next);
            scheduleSave();
        };
    });
    const list = wrap.querySelector('.input-list');
    renderImageInputList(list, node, mediaInputs);
    renderPromptPreview(wrap.querySelector('.prompt-list'), promptInputs);
    wrap.querySelector('.gen-btn').onclick = e => { e.stopPropagation(); runCanvasGenerate(node.id); };
    bindCascadeButtons(wrap, node.id);
    return wrap;
}
function midjourneyModalHtml(node, maskRef){
    if(!node.mjModalTaskId) return '';
    const hasMask = Boolean(maskRef?.url);
    return `<div class="mj-modal-panel"><div class="mj-action-title">局部重绘</div><textarea class="mj-modal-prompt" placeholder="描述要替换的内容">${escapeHtml(node.mjModalPrompt || node.lastPrompt || '')}</textarea><div class="mj-modal-mask ${hasMask ? 'ready' : ''}"><i data-lucide="${hasMask ? 'brush' : 'image-off'}"></i><span>${hasMask ? `遮罩已连接：${escapeHtml(maskRef.name || 'mask')}` : '连接遮罩图片节点后才能提交'}</span></div><button type="button" class="mj-reroll mj-modal-submit" ${hasMask && !node.running ? '' : 'disabled'}><i data-lucide="wand-sparkles"></i>${node.running ? '提交中...' : '提交局部重绘'}</button></div>`;
}
function midjourneyContinuationHtml(node){
    if(!node.lastTaskId || node.mjModalTaskId) return '';
    if(['blend','edit'].includes(node.lastAction)) return '';
    const isSingle = Number(node.lastImageCount || 0) === 1;
    if(!isSingle){
        return `<div class="mj-actions"><div class="mj-action-title">选择四宫格图片</div><div class="mj-action-grid">${[1,2,3,4].map(index => `<button type="button" data-mj-action="upscale" data-index="${index}">U${index}</button>`).join('')}</div><div class="mj-action-grid">${[1,2,3,4].map(index => `<button type="button" data-mj-action="variation" data-index="${index}">V${index}</button>`).join('')}</div><button class="mj-reroll" type="button" data-mj-action="reroll"><i data-lucide="refresh-cw"></i>重新生成</button></div>`;
    }
    return `<div class="mj-actions"><div class="mj-action-title">单图细化</div><div class="mj-text-action-grid"><button type="button" data-mj-action="low_variation" data-index="1">弱变体</button><button type="button" data-mj-action="high_variation" data-index="1">强变体</button><button type="button" data-mj-action="zoom" data-zoom-ratio="1.5">扩图 1.5x</button><button type="button" data-mj-action="zoom" data-zoom-ratio="2">扩图 2x</button></div><div class="mj-pan-grid"><button type="button" data-mj-action="pan" data-direction="left"><i data-lucide="arrow-left"></i></button><button type="button" data-mj-action="pan" data-direction="up"><i data-lucide="arrow-up"></i></button><button type="button" data-mj-action="inpaint"><i data-lucide="brush"></i></button><button type="button" data-mj-action="pan" data-direction="right"><i data-lucide="arrow-right"></i></button></div></div>`;
}
function renderMidjourneyBody(node){
    const wrap = document.createElement('div');
    wrap.className = 'generator-body midjourney-body';
    node.apiProvider = resolveMidjourneyProviderId(node.apiProvider || '');
    node.mode = ['imagine','blend','edit'].includes(node.mode) ? node.mode : 'imagine';
    node.size = /^\d{1,2}:\d{1,2}$/.test(String(node.size || '')) ? node.size : '1:1';
    node.version = String(node.version || '6.1');
    node.speed = ['relax','fast','turbo'].includes(node.speed) ? node.speed : 'relax';
    const sources = orderedSources(node, generatorSources(node));
    const mediaInputs = sources.filter(src => src.refs?.some(ref => mediaKindForRef(ref) === 'image'));
    const promptInputs = sources.filter(src => src.prompt && !src.refs?.length);
    const maskRef = mediaInputs.flatMap(source => source.refs || []).find(ref => String(ref.role || '').toLowerCase() === 'mask') || null;
    const hasProvider = Boolean(node.apiProvider);
    const taskText = node.lastTaskId ? `任务 ${escapeHtml(node.lastTaskId.slice(-14))}` : '生成四宫格后可选图';
    wrap.innerHTML = `
        <div class="prompt-list mb-3"></div>
        <div class="midjourney-input-head"><span>参考图片</span><span>最多 4 张</span></div>
        <div class="input-list mj-input-list"></div>
        <div class="gen-settings mj-settings">
            <div class="gen-settings-row"><select class="select-lite mj-mode"><option value="imagine" ${node.mode === 'imagine' ? 'selected' : ''}>生成</option><option value="blend" ${node.mode === 'blend' ? 'selected' : ''}>融合</option><option value="edit" ${node.mode === 'edit' ? 'selected' : ''}>编辑</option></select><select class="select-lite mj-provider">${midjourneyProviderOptions(node.apiProvider)}</select><select class="select-lite mj-version">${['8.2','8.1','7','6.1','5.2','5.1'].map(version => `<option value="${version}" ${node.version === version ? 'selected' : ''}>v${version}</option>`).join('')}</select></div>
            <div class="gen-settings-row"><select class="select-lite mj-size">${['1:1','3:4','4:3','9:16','16:9','21:9'].map(size => `<option value="${size}" ${node.size === size ? 'selected' : ''}>${size}</option>`).join('')}</select><select class="select-lite mj-speed"><option value="relax" ${node.speed === 'relax' ? 'selected' : ''}>Relax</option><option value="fast" ${node.speed === 'fast' ? 'selected' : ''}>Fast</option><option value="turbo" ${node.speed === 'turbo' ? 'selected' : ''}>Turbo</option></select></div>
        </div>
        <div class="mj-task-line ${node.lastTaskId ? 'ready' : ''}"><i data-lucide="clock-3"></i><span>${taskText}</span></div>
        <div class="gen-run-row"><button class="gen-btn mj-run" ${node.running || !hasProvider ? 'disabled' : ''}><i data-lucide="wand-sparkles" class="w-4 h-4"></i>${node.running ? '提交中...' : '生成四宫格'}</button>${cascadeBtnHtml(node)}</div>
        ${midjourneyContinuationHtml(node)}${midjourneyModalHtml(node, maskRef)}${retryBarHtml(node)}`;
    renderPromptPreview(wrap.querySelector('.prompt-list'), promptInputs);
    renderImageInputList(wrap.querySelector('.mj-input-list'), node, mediaInputs);
    ['mode','provider','version','size','speed'].forEach(field => {
        const input = wrap.querySelector(`.mj-${field}`);
        if(!input) return;
        input.onchange = event => { event.stopPropagation(); node[field === 'provider' ? 'apiProvider' : field] = event.target.value; scheduleSave(); if(field === 'provider' || field === 'mode') refreshNodes([node.id]); };
    });
    wrap.querySelector('.mj-run').onclick = event => { event.stopPropagation(); runCanvasGenerate(node.id); };
    wrap.querySelectorAll('[data-mj-action]').forEach(button => button.onclick = event => { event.stopPropagation(); runMidjourneyAction(node.id, button.dataset.mjAction, Number(button.dataset.index || 0), {direction:button.dataset.direction || '', zoomRatio:Number(button.dataset.zoomRatio || 0) || null}); });
    const modalPrompt = wrap.querySelector('.mj-modal-prompt');
    if(modalPrompt) modalPrompt.oninput = event => { node.mjModalPrompt = event.target.value; scheduleSave(); };
    const modalSubmit = wrap.querySelector('.mj-modal-submit');
    if(modalSubmit) modalSubmit.onclick = event => { event.stopPropagation(); runMidjourneyModal(node.id, maskRef); };
    bindCascadeButtons(wrap, node.id);
    return wrap;
}
function renderVideoBody(node){
    const wrap = document.createElement('div');
    wrap.className = 'generator-body';
    const inputSources = generatorSources(node);
    const ordered = orderedSources(node, inputSources);
    const mediaInputs = ordered.filter(src => src.refs?.some(ref => ['image','video','audio'].includes(mediaKindForRef(ref))));
    const promptInputs = ordered.filter(src => src.prompt && !src.refs?.length);
    sanitizeVideoNodeProviderModel(node);
    node.model = node.model || 'veo3-fast';
    wrap.innerHTML = `
        <div class="prompt-list mb-3"></div>
        <div class="video-input-head">
            <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Media</div>
            <div class="video-input-actions">
                <button type="button" class="tool-btn" data-video-manual-url title="手动输入视频 URL"><i data-lucide="link" class="w-4 h-4"></i><span>输入网址</span></button>
                <button type="button" class="tool-btn" data-video-temp-sh ${node.tempShUploading ? 'disabled' : ''} title="上传当前输入视频到云端直链"><i data-lucide="upload-cloud" class="w-4 h-4"></i><span>${node.tempShUploading ? '上传中...' : '上传云端'}</span></button>
            </div>
        </div>
        <div class="input-list video-img-list"></div>
        <div class="gen-settings">
            <div class="gen-settings-row">
                <select class="select-lite video-provider" style="flex:1">${videoProviderOptions(node.apiProvider)}</select>
                <select class="select-lite video-model" style="flex:2">${videoModelOptions(node.model, node.apiProvider)}</select>
            </div>
            <div class="gen-settings-row">
                <label class="field" style="flex:1">
                    <div class="setting-title">${tr('canvas.videoDuration')}</div>
                    <input class="setting-input video-duration" type="number" min="1" max="60" step="1" value="${Number(node.duration || 5)}">
                </label>
                <label class="field" style="flex:1">
                    <div class="setting-title">${tr('canvas.videoAspect')}</div>
                    <select class="select-lite video-aspect compact-select">
                        <option value="16:9">16:9</option>
                        <option value="9:16">9:16</option>
                        <option value="1:1">1:1</option>
                        <option value="4:3">4:3</option>
                        <option value="3:4">3:4</option>
                        <option value="21:9">21:9</option>
                        <option value="9:21">9:21</option>
                        <option value="keep_ratio">keep</option>
                        <option value="adaptive">adapt</option>
                    </select>
                </label>
                <label class="field" style="flex:1">
                    <div class="setting-title">${tr('canvas.videoResolution')}</div>
                    <select class="select-lite video-resolution compact-select">
                        <option value="">Auto</option>
                        <option value="480p">480p</option>
                        <option value="720p">720p</option>
                        <option value="1080p">1080p</option>
                        <option value="780P">780P</option>
                    </select>
                </label>
            </div>
            <div class="gen-settings-row" style="flex-wrap:wrap">
                <button type="button" class="setting-check ${node.enhancePrompt ? 'active' : ''}" data-video-toggle="enhancePrompt"><span class="check-dot"></span>${tr('canvas.videoEnhancePrompt')}</button>
                <button type="button" class="setting-check ${node.enableUpsample ? 'active' : ''}" data-video-toggle="enableUpsample"><span class="check-dot"></span>${tr('canvas.videoUpsample')}</button>
                <button type="button" class="setting-check ${node.watermark ? 'active' : ''}" data-video-toggle="watermark"><span class="check-dot"></span>${tr('canvas.videoWatermark')}</button>
                <button type="button" class="setting-check ${node.cameraFixed ? 'active' : ''}" data-video-toggle="cameraFixed"><span class="check-dot"></span>${tr('canvas.videoCameraFixed')}</button>
                <button type="button" class="setting-check ${node.generateAudio ? 'active' : ''}" data-video-toggle="generateAudio"><span class="check-dot"></span>${tr('canvas.videoGenerateAudio')}</button>
                <button type="button" class="setting-check ${node.multimodal ? 'active' : ''}" data-video-toggle="multimodal"><span class="check-dot"></span>${tr('canvas.videoMultimodal')}</button>
                <button type="button" class="setting-check ${node.useFrameRoles ? 'active' : ''}" data-video-toggle="useFrameRoles"><span class="check-dot"></span>${tr('canvas.videoFirstLastFrames')}</button>
            </div>
        </div>
        <div class="gen-run-row">
            <button class="gen-btn ${node.running ? 'running' : ''}" ${node.running ? 'disabled' : ''}><i data-lucide="clapperboard" class="w-4 h-4"></i>${node.running ? tr('canvas.generating') : tr('canvas.videoGenerate')}</button>
            ${cascadeBtnHtml(node)}
        </div>
        ${retryBarHtml(node)}
    `;
    const providerSelect = wrap.querySelector('.video-provider');
    const modelSelect = wrap.querySelector('.video-model');
    const durationSelect = wrap.querySelector('.video-duration');
    const aspectSelect = wrap.querySelector('.video-aspect');
    const resolutionSelect = wrap.querySelector('.video-resolution');
    providerSelect.value = node.apiProvider;
    durationSelect.value = String(node.duration || 5);
    aspectSelect.value = node.aspectRatio || '16:9';
    resolutionSelect.value = node.resolution || '';
    [providerSelect, modelSelect, durationSelect, aspectSelect, resolutionSelect].forEach(input => {
        input.onmousedown = e => e.stopPropagation();
        input.onclick = e => e.stopPropagation();
    });
    providerSelect.onchange = e => {
        e.stopPropagation();
        node.apiProvider = e.target.value;
        const models = providerVideoModels(node.apiProvider);
        if(!models.includes(node.model)) node.model = models[0] || node.model;
        modelSelect.innerHTML = videoModelOptions(node.model, node.apiProvider);
        scheduleSave();
    };
    modelSelect.onchange = e => { e.stopPropagation(); node.model = e.target.value; scheduleSave(); };
    durationSelect.oninput = e => { e.stopPropagation(); node.duration = Math.max(1, Math.min(60, Number(e.target.value || 5))); scheduleSave(); };
    durationSelect.onblur = e => { e.target.value = String(Math.max(1, Math.min(60, Number(node.duration || 5)))); };
    aspectSelect.onchange = e => { e.stopPropagation(); node.aspectRatio = e.target.value; scheduleSave(); };
    resolutionSelect.onchange = e => { e.stopPropagation(); node.resolution = e.target.value; scheduleSave(); };
    wrap.querySelectorAll('[data-video-toggle]').forEach(btn => {
        btn.onmousedown = e => e.stopPropagation();
        btn.onclick = e => {
            e.stopPropagation();
            const field = btn.dataset.videoToggle;
            node[field] = !node[field];
            if(field === 'multimodal' && node.multimodal) node.useFrameRoles = false;
            if(field === 'useFrameRoles' && node.useFrameRoles) node.multimodal = false;
            render();
            scheduleSave();
        };
    });
    wrap.querySelectorAll('[data-video-temp-sh]').forEach(btn => {
        btn.onmousedown = e => e.stopPropagation();
        btn.onclick = async e => {
            e.stopPropagation();
            try {
                await uploadCanvasVideosToCloud(node.id);
            } catch(err) {
                showErrorModal(err.message || '云端上传失败', '上传云端');
            }
        };
    });
    wrap.querySelectorAll('[data-video-manual-url]').forEach(btn => {
        btn.onmousedown = e => e.stopPropagation();
        btn.onclick = async e => {
            e.stopPropagation();
            try {
                await setCanvasManualVideoUrl(node.id);
            } catch(err) {
                showErrorModal(err.message || '设置视频网址失败', '输入网址');
            }
        };
    });
    const list = wrap.querySelector('.video-img-list');
    renderVideoImageInputs(list, node, mediaInputs);
    renderPromptPreview(wrap.querySelector('.prompt-list'), promptInputs);
    wrap.querySelector('.gen-btn').onclick = e => { e.stopPropagation(); runCanvasGenerate(node.id); };
    bindCascadeButtons(wrap, node.id);
    return wrap;
}
function miniMaxEngine(node){
    return node?.minimaxEngine === 'runninghub' ? 'runninghub' : CANVAS_MINIMAX_DEFAULT_ENGINE;
}
function miniMaxAspectValue(value){
    const text = String(value || '').trim();
    const match = text.match(/\d+\s*:\s*\d+/);
    return match ? match[0].replace(/\s+/g, '') : '16:9';
}
function miniMaxRefsForNode(node){
    const sources = orderedSources(node, generatorSources(node));
    return {
        sources,
        prompt:sources.map(src => src.prompt).filter(Boolean).join('\n\n'),
        refs:sources.flatMap(src => src.refs || []).filter(ref => ref?.url)
    };
}
function miniMaxNormalizeRef(ref){
    if(!ref?.url) return null;
    return {...ref, kind:mediaKindForRef(ref)};
}
function miniMaxUniqueRefs(refs=[]){
    const seen = new Set();
    return (refs || []).map(miniMaxNormalizeRef).filter(Boolean).filter(ref => {
        const key = `${ref.kind}:${ref.url}`;
        if(seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
function miniMaxRefSummary(refs=[]){
    const counts = refs.reduce((map, ref) => {
        const kind = mediaKindForRef(ref);
        map[kind] = (map[kind] || 0) + 1;
        return map;
    }, {});
    const parts = [];
    if(counts.image) parts.push(`${counts.image} image`);
    if(counts.image) parts.push(`${counts.image} 图`);
    if(counts.video) parts.push(`${counts.video} 视频`);
    if(counts.audio) parts.push(`${counts.audio} 音频`);
    return parts.join(' · ') || 'No refs';
}
function miniMaxEnsureSegment(node){
    node.minimaxEngine = miniMaxEngine(node);
    node.workflow = node.workflow || 'MiniMax_H3.json';
    node.minimaxRunningHubWorkflowId = node.minimaxRunningHubWorkflowId || CANVAS_MINIMAX_RUNNINGHUB_WORKFLOW_ID;
    node.rhPayment = node.rhPayment || 'free';
    node.aspectRatio = miniMaxAspectValue(node.aspectRatio || '16:9');
    node.megapixels = Number.isFinite(Number(node.megapixels)) ? Number(node.megapixels) : 0.4;
    node.segments = Array.isArray(node.segments) ? node.segments : [];
    if(!node.segments.length){
        node.segments.push({id:uid('seg'), start:0, duration:Number(node.duration || 8) || 8, prompt:'', refs:[], result:null, results:[], trimIn:0, trimOut:Number(node.duration || 8) || 8});
    }
    node.segments.forEach((seg, index) => {
        if(!seg.id) seg.id = uid('seg');
        seg.start = Math.max(0, Number(seg.start || 0) || 0);
        seg.duration = Math.max(0.5, Number(seg.duration || node.duration || 8) || 8);
        seg.prompt = String(seg.prompt || '');
        seg.aspectRatio = miniMaxAspectValue(seg.aspectRatio || node.aspectRatio || '16:9');
        seg.megapixels = Number.isFinite(Number(seg.megapixels)) ? Number(seg.megapixels) : Number(node.megapixels || 0.4);
        const refBuckets = seg.refs && typeof seg.refs === 'object' && !Array.isArray(seg.refs) ? seg.refs : {};
        const migrated = [
            ...(Array.isArray(seg.refs) ? seg.refs : []),
            ...(Array.isArray(seg.refItems) ? seg.refItems : []),
            ...['image','video','audio'].flatMap(kind => Array.isArray(refBuckets[kind]) ? refBuckets[kind].map(ref => ({...ref, kind})) : [])
        ];
        seg.refs = miniMaxUniqueRefs(migrated).slice(0, CANVAS_MINIMAX_REF_IMAGE_MAX + CANVAS_MINIMAX_REF_VIDEO_MAX + CANVAS_MINIMAX_REF_AUDIO_MAX);
        seg.result = seg.result && seg.result.url ? {...seg.result, kind:seg.result.kind || mediaKindForOutputItem(seg.result)} : null;
        seg.results = Array.isArray(seg.results) ? seg.results.filter(item => outputUrlValue(item)) : [];
        seg.trimIn = Math.max(0, Math.min(Number(seg.trimIn || 0), Math.max(0, seg.duration - 0.1)));
        seg.trimOut = Math.max(seg.trimIn + 0.1, Math.min(seg.duration, Number(seg.trimOut || seg.duration) || seg.duration));
        if(index > 0){
            const prev = node.segments[index - 1];
            seg.start = Math.max(seg.start, Number(prev.start || 0) + Number(prev.duration || 0));
        }
    });
    if(!node.selectedSegmentId || !node.segments.some(seg => seg.id === node.selectedSegmentId)) node.selectedSegmentId = node.segments[0].id;
    node.duration = Math.max(1, ...node.segments.map(seg => Number(seg.start || 0) + Number(seg.duration || 0)));
    node.materials = Array.isArray(node.materials) ? node.materials.filter(item => outputUrlValue(item)) : [];
    return node.segments.find(seg => seg.id === node.selectedSegmentId) || node.segments[0];
}
function miniMaxSelectedSegment(node){
    return miniMaxEnsureSegment(node);
}
function miniMaxTimelineTotal(node){
    miniMaxEnsureSegment(node);
    return Math.max(1, Number(node.duration || 0), ...node.segments.map(seg => Number(seg.start || 0) + Number(seg.duration || 0)));
}
function miniMaxActiveSegmentAt(node, time){
    miniMaxEnsureSegment(node);
    const safeTime = Math.max(0, Number(time || 0));
    return (node.segments || []).find(seg => safeTime >= Number(seg.start || 0) && safeTime <= Number(seg.start || 0) + Number(seg.duration || 0)) || miniMaxSelectedSegment(node);
}
function miniMaxCompactSegments(node){
    if(!node?.segments?.length) return;
    node.segments.sort((a, b) => Number(a.start || 0) - Number(b.start || 0));
    let cursor = 0;
    node.segments.forEach(seg => {
        seg.start = cursor;
        seg.duration = Math.max(0.5, Number(seg.duration || 1) || 1);
        cursor += seg.duration;
    });
    node.duration = Math.max(1, cursor);
    node.playhead = Math.min(Number(node.playhead || 0), node.duration);
}
function miniMaxExplicitRefsForSegment(seg){
    return miniMaxUniqueRefs(seg?.refs || []);
}
function miniMaxRefsForSegment(node, seg){
    const own = miniMaxExplicitRefsForSegment(seg);
    if(own.length) return own;
    const upstream = miniMaxRefsForNode(node).refs;
    return miniMaxUniqueRefs(upstream).slice(0, CANVAS_MINIMAX_REF_IMAGE_MAX + CANVAS_MINIMAX_REF_VIDEO_MAX + CANVAS_MINIMAX_REF_AUDIO_MAX);
}
function miniMaxMediaHtml(item, label='Media'){
    const url = outputUrlValue(item);
    const kind = mediaKindForOutputItem(item) || mediaKindForRef(item);
    if(kind === 'image' && url) return canvasPreviewImgHtml(url, 512, 'draggable="false"');
    if(kind === 'video' && url) return `<div class="minimax-lite-media is-video">${canvasVideoPreviewHtml(url, 512, 'draggable="false"')}<span>${escapeHtml(item?.name || label)}</span></div>`;
    const icon = kind === 'audio' ? 'file-audio' : kind === 'video' ? 'film' : 'sparkles';
    return `<div class="minimax-lite-media is-${escapeAttr(kind || 'file')}"><i data-lucide="${icon}"></i><span>${escapeHtml(item?.name || label)}</span></div>`;
}
function miniMaxPlayerHtml(seg){
    const item = seg?.result?.url ? seg.result : null;
    if(!item) return `<div class="minimax-player-empty"><i data-lucide="clapperboard"></i><span>Current segment</span></div>`;
    const kind = mediaKindForOutputItem(item);
    if(kind === 'audio') return `<div class="minimax-player-empty"><i data-lucide="file-audio"></i><span>${escapeHtml(item.name || 'Audio')}</span><audio src="${escapeAttr(canvasDisplayMediaUrl(item.url, item.name || 'audio'))}" controls preload="metadata"></audio></div>`;
    if(kind === 'image') return `<div class="minimax-player-image">${canvasPreviewImgHtml(item.url, 1024, 'draggable="false"')}</div>`;
    return canvasVideoPlayerHtml(item.url, 'data-minimax-player="1"');
}
function miniMaxSetSegmentResult(node, seg, item){
    if(!node || !seg || !outputUrlValue(item)) return false;
    const url = outputUrlValue(item);
    const result = typeof item === 'object' ? {...item, url, kind:item.kind || 'video'} : {url, kind:'video', name:'minimax.mp4'};
    seg.result = result;
    seg.results = Array.isArray(seg.results) ? seg.results : [];
    if(!seg.results.some(existing => outputUrlValue(existing) === url)) seg.results.unshift(result);
    node.materials = Array.isArray(node.materials) ? node.materials : [];
    if(!node.materials.some(existing => outputUrlValue(existing) === url)) node.materials.unshift({...result, segmentId:seg.id, createdAt:Date.now()});
    return true;
}
function miniMaxDownloadItem(item){
    const url = outputUrlValue(item);
    if(!url) return;
    const link = document.createElement('a');
    link.href = canvasDisplayMediaUrl(url, item?.name || canvasFileNameFromUrl(url) || 'minimax.mp4');
    link.download = safeDownloadFileName(item?.name || canvasFileNameFromUrl(url) || 'minimax.mp4', 'minimax.mp4');
    document.body.appendChild(link);
    link.click();
    link.remove();
}
async function miniMaxExportTimeline(node){
    const clips = (node?.segments || []).map(seg => {
        const item = seg?.result;
        const url = outputUrlValue(item);
        if(!url) return null;
        const duration = Math.max(0.1, Number(seg.duration || 0) || 0.1);
        const start = Math.max(0, Number(seg.trimIn || 0) || 0);
        const end = Math.max(start + 0.1, Math.min(duration, Number(seg.trimOut || duration) || duration));
        return {url, name:item?.name || `minimax-${seg.id || 'clip'}.mp4`, start, end, duration};
    }).filter(Boolean);
    if(!clips.length){
        showErrorModal('时间轴里还没有可导出的视频', 'MiniMax H3');
        return;
    }
    try {
        const response = await classicCanvasApi().exportMiniMaxTimeline({clips, filename:`minimax-timeline-${Date.now()}.mp4`});
        if(!response.ok) throw new Error(await responseErrorMessage(response, '时间线导出失败'));
        miniMaxDownloadItem(await response.json());
    } catch(error) {
        showErrorModal(error.message || '时间线导出失败', 'MiniMax H3');
    }
}
function miniMaxSegmentRefsByKind(refs, kind){
    return miniMaxUniqueRefs(refs).filter(ref => mediaKindForRef(ref) === kind);
}
function miniMaxSetPlayheadDom(wrap, node, time){
    const total = miniMaxTimelineTotal(node);
    const safeTime = Math.max(0, Math.min(total, Number(time || 0)));
    node.playhead = safeTime;
    const pct = total ? (safeTime / total) * 100 : 0;
    wrap.querySelectorAll('[data-minimax-playhead]').forEach(head => { head.style.left = `${pct}%`; });
    const label = wrap.querySelector('[data-minimax-time-label]');
    if(label){
        const fmt = value => `${(Number(value || 0)).toFixed(Number(value || 0) % 1 ? 1 : 0)}s`;
        label.textContent = `${fmt(safeTime)} / ${fmt(total)}`;
    }
    return safeTime;
}
function miniMaxSyncPlayerDom(wrap, seg, time, play=false){
    const stage = wrap.querySelector('[data-minimax-player-stage]');
    if(!stage || !seg) return;
    const nextUrl = seg.result?.url || '';
    if(stage.dataset.minimaxPlayerSegment !== seg.id || stage.dataset.minimaxPlayerUrl !== nextUrl){
        stage.dataset.minimaxPlayerSegment = seg.id || '';
        stage.dataset.minimaxPlayerUrl = nextUrl;
        const content = stage.querySelector('[data-minimax-player-content]');
        if(content) content.innerHTML = miniMaxPlayerHtml(seg);
        refreshIcons();
    }
    const media = stage.querySelector('[data-minimax-player]');
    if(media){
        const rel = Math.max(0, Number(time || 0) - Number(seg.start || 0));
        try { media.currentTime = Math.min(Math.max(0, rel), Number(seg.duration || rel) || rel); } catch(e) {}
        if(play) media.play?.().catch(() => {});
        else media.pause?.();
    }
}
function miniMaxApplyTimelineTime(wrap, node, time, play=false){
    const safeTime = miniMaxSetPlayheadDom(wrap, node, time);
    const seg = miniMaxActiveSegmentAt(node, safeTime);
    if(seg?.id && seg.id !== node.selectedSegmentId){
        node.selectedSegmentId = seg.id;
        refreshNodes([node.id]);
        scheduleSave();
        return;
    }
    miniMaxSyncPlayerDom(wrap, seg, safeTime, play);
}
function miniMaxStartPaneResize(e, node, pane){
    e.preventDefault();
    e.stopPropagation();
    const wrap = e.currentTarget?.closest?.('.minimax-canvas-workbench');
    const startX = e.clientX;
    const startY = e.clientY;
    const startLibrary = Math.max(170, Math.min(520, Number(node.minimaxLibraryW || 190)));
    const startPreview = Math.max(130, Math.min(760, Number(node.minimaxPreviewH || 220)));
    const startVideo = Math.max(48, Math.min(180, Number(node.minimaxVideoTrackH || 74)));
    const startRefLane = Math.max(30, Math.min(130, Number(node.minimaxRefLaneH || 36)));
    const refLanes = Math.max(1, wrap?.querySelectorAll?.('.minimax-ref-lane')?.length || 1);
    document.body.classList.add('canvas-minimax-pane-resize');
    const applyVars = () => {
        if(!wrap) return;
        wrap.querySelector('.minimax-wb-body')?.style.setProperty('--minimax-library-w', `${Math.max(170, Math.min(520, Number(node.minimaxLibraryW || 190)))}px`);
        const main = wrap.querySelector('.minimax-wb-main');
        if(main){
            main.style.setProperty('--minimax-preview-h', `${Math.max(130, Math.min(760, Number(node.minimaxPreviewH || 220)))}px`);
            main.style.setProperty('--minimax-video-h', `${Math.max(48, Math.min(180, Number(node.minimaxVideoTrackH || 74)))}px`);
            main.style.setProperty('--minimax-ref-lane-h', `${Math.max(30, Math.min(130, Number(node.minimaxRefLaneH || 36)))}px`);
            main.style.setProperty('--minimax-ref-h', `${Math.max(78, refLanes * Math.max(30, Math.min(130, Number(node.minimaxRefLaneH || 36))))}px`);
        }
    };
    const onMove = move => {
        move.preventDefault();
        const dx = (move.clientX - startX) / viewport.scale;
        const dy = (move.clientY - startY) / viewport.scale;
        if(pane === 'library') node.minimaxLibraryW = Math.round(Math.max(170, Math.min(520, startLibrary + dx)));
        if(pane === 'preview') node.minimaxPreviewH = Math.round(Math.max(130, Math.min(760, startPreview + dy)));
        if(pane === 'video') node.minimaxVideoTrackH = Math.round(Math.max(48, Math.min(180, startVideo + dy)));
        if(pane === 'refs') node.minimaxRefLaneH = Math.round(Math.max(30, Math.min(130, startRefLane + dy)));
        applyVars();
    };
    const onUp = () => {
        document.body.classList.remove('canvas-minimax-pane-resize');
        window.removeEventListener('mousemove', onMove, true);
        window.removeEventListener('mouseup', onUp, true);
        window.removeEventListener('blur', onUp, true);
        scheduleSave();
    };
    window.addEventListener('mousemove', onMove, true);
    window.addEventListener('mouseup', onUp, true);
    window.addEventListener('blur', onUp, true);
}
function renderMiniMaxBody(node){
    const wrap = document.createElement('div');
    wrap.className = 'minimax-canvas-workbench';
    const selected = miniMaxSelectedSegment(node);
    const total = miniMaxTimelineTotal(node);
    const playhead = Math.max(0, Math.min(total, Number(node.playhead || 0)));
    const playheadPct = total > 0 ? (playhead / total) * 100 : 0;
    const fmt = value => `${(Number(value || 0)).toFixed(Number(value || 0) % 1 ? 1 : 0)}s`;
    const previewH = Math.max(130, Math.min(760, Number(node.minimaxPreviewH || 220)));
    const videoTrackH = Math.max(48, Math.min(180, Number(node.minimaxVideoTrackH || 74)));
    const refLaneH = Math.max(30, Math.min(130, Number(node.minimaxRefLaneH || 36)));
    const libraryW = Math.max(170, Math.min(520, Number(node.minimaxLibraryW || 190)));
    const ticks = Array.from({length:Math.min(13, Math.max(3, Math.ceil(total) + 1))}).map((_, i, arr) => {
        const ratio = arr.length <= 1 ? 0 : i / (arr.length - 1);
        return `<span class="minimax-tick" style="left:${ratio * 100}%"><b>${fmt(total * ratio)}</b></span>`;
    }).join('');
    const segmentsHtml = node.segments.map((seg, index) => {
        const left = total ? (Number(seg.start || 0) / total) * 100 : 0;
        const width = total ? Math.max(5, (Number(seg.duration || 1) / total) * 100) : 100;
        const active = seg.id === selected?.id;
        const result = seg.result?.url ? seg.result : null;
        const refCount = miniMaxExplicitRefsForSegment(seg).length;
        return `<div class="minimax-tl-clip ${active ? 'active' : ''} ${result ? 'has-result' : ''}" data-minimax-segment="${escapeAttr(seg.id)}" data-minimax-drop-segment="${escapeAttr(seg.id)}" style="left:${left}%;width:${Math.min(width, 100 - left)}%" title="Clip ${index + 1}">
            <div class="minimax-clip-media">${result ? miniMaxMediaHtml(result, `Clip ${index + 1}`) : `<div class="minimax-clip-empty"><i data-lucide="sparkles"></i></div>`}</div>
            <div class="minimax-clip-meta"><b>Clip ${index + 1}</b><span>${fmt(seg.start)} - ${fmt(Number(seg.start || 0) + Number(seg.duration || 0))}</span></div>
            ${refCount ? `<span class="minimax-clip-ref-count"><i data-lucide="paperclip"></i>${refCount}</span>` : ''}
            ${node.segments.length > 1 ? `<button type="button" class="minimax-clip-delete" data-minimax-delete-segment="${escapeAttr(seg.id)}" title="删除片段"><i data-lucide="trash-2"></i></button>` : ''}
        </div>`;
    }).join('');
    const selectedRefs = miniMaxExplicitRefsForSegment(selected);
    const refLanes = Math.max(1, selectedRefs.length, ...node.segments.map(seg => miniMaxExplicitRefsForSegment(seg).length));
    const refsHtml = Array.from({length:refLanes}).map((_, laneIndex) => {
        const clips = node.segments.map(seg => {
            const left = total ? (Number(seg.start || 0) / total) * 100 : 0;
            const width = total ? Math.max(5, (Number(seg.duration || 1) / total) * 100) : 100;
            const ref = miniMaxExplicitRefsForSegment(seg)[laneIndex] || null;
            const active = seg.id === selected?.id;
            return `<div class="minimax-ref-clip ${active ? 'active' : ''} ${ref ? 'has-ref' : 'is-empty'}" data-minimax-ref-segment="${escapeAttr(seg.id)}" data-minimax-segment="${escapeAttr(seg.id)}" data-minimax-drop-segment="${escapeAttr(seg.id)}" style="left:${left}%;width:${Math.min(width, 100 - left)}%">
                <div class="minimax-ref-media">${ref ? miniMaxMediaHtml(ref, `Ref ${laneIndex + 1}`) : `<div class="minimax-clip-empty"><i data-lucide="paperclip"></i></div>`}</div>
                ${ref ? `<button type="button" data-minimax-delete-ref="${escapeAttr(`${seg.id}:${laneIndex}`)}" title="移除参考"><i data-lucide="x"></i></button>` : ''}
                <span class="minimax-ref-counts">${ref ? escapeHtml(ref.name || `Ref ${laneIndex + 1}`) : `Ref ${laneIndex + 1}`}</span>
            </div>`;
        }).join('');
        return `<div class="minimax-ref-lane">${clips}</div>`;
    }).join('');
    const upstream = miniMaxRefsForNode(node);
    const assets = miniMaxUniqueRefs([...node.segments.flatMap(seg => seg.refs || []), ...upstream.refs]).slice(0, 36);
    const assetsHtml = assets.length ? assets.map((item, index) => `<div class="minimax-material-card minimax-asset-item" draggable="true" data-minimax-asset-index="${index}" title="${escapeAttr(item.name || mediaKindForRef(item))}">
        ${miniMaxMediaHtml(item, item.name || mediaKindForRef(item))}<span>${escapeHtml(mediaKindForRef(item))}</span>
    </div>`).join('') : `<div class="minimax-library-empty"><i data-lucide="database"></i><span>Assets</span></div>`;
    const materialsHtml = (node.materials || []).slice(0, 24).map((item, index) => `<div class="minimax-material-card minimax-output-item" draggable="true" data-minimax-material-index="${index}" title="${escapeAttr(item.name || 'Output')}">
        ${miniMaxMediaHtml(item, 'Output')}
        <button type="button" data-minimax-download-material="${index}" title="下载"><i data-lucide="download"></i></button>
        <button type="button" data-minimax-use-material="${index}" title="设为当前片段"><i data-lucide="replace"></i></button>
    </div>`).join('') || `<div class="minimax-library-empty"><i data-lucide="inbox"></i><span>Output</span></div>`;
    const segDuration = Math.max(0.5, Number(selected?.duration || 8) || 8);
    const imageCount = miniMaxSegmentRefsByKind(selectedRefs, 'image').length;
    const videoCount = miniMaxSegmentRefsByKind(selectedRefs, 'video').length;
    const audioCount = miniMaxSegmentRefsByKind(selectedRefs, 'audio').length;
    const overLimit = imageCount > CANVAS_MINIMAX_REF_IMAGE_MAX || videoCount > CANVAS_MINIMAX_REF_VIDEO_MAX || audioCount > CANVAS_MINIMAX_REF_AUDIO_MAX;
    wrap.innerHTML = `
        <div class="minimax-wb-toolbar">
            <div class="minimax-brand"><i data-lucide="clapperboard"></i><span>MiniMax H3</span><b data-minimax-time-label>${fmt(playhead)} / ${fmt(total)}</b></div>
            <div class="minimax-transport"><button type="button" data-minimax-play title="播放"><i data-lucide="play"></i></button><button type="button" data-minimax-add-segment title="新增片段"><i data-lucide="plus"></i></button></div>
            <div class="minimax-top-actions"><button type="button" data-minimax-export ${node.segments.some(seg => seg.result?.url) ? '' : 'disabled'} title="导出时间线"><i data-lucide="film"></i></button><button type="button" data-minimax-download-current ${selected?.result?.url ? '' : 'disabled'} title="下载当前片段"><i data-lucide="download"></i></button></div>
        </div>
        <div class="minimax-wb-body" style="--minimax-library-w:${libraryW}px">
            <div class="minimax-library minimax-asset-bin"><span class="minimax-pane-resize minimax-library-resize" data-minimax-pane-resize="library"></span><div class="minimax-library-head"><i data-lucide="database"></i><span>Assets</span></div><div class="minimax-library-list">${assetsHtml}</div><div class="minimax-library-head minimax-output-head"><i data-lucide="folder-output"></i><span>Output</span></div><div class="minimax-library-list minimax-output-list">${materialsHtml}</div></div>
            <div class="minimax-wb-main" style="--minimax-preview-h:${previewH}px;--minimax-video-h:${videoTrackH}px;--minimax-ref-lane-h:${refLaneH}px;--minimax-ref-h:${Math.max(78, refLanes * refLaneH)}px">
                <div class="minimax-player-stage" data-minimax-player-stage="1" data-minimax-player-segment="${escapeAttr(selected?.id || '')}" data-minimax-player-url="${escapeAttr(selected?.result?.url || '')}"><div class="minimax-player-content" data-minimax-player-content="1">${miniMaxPlayerHtml(selected)}</div><span class="minimax-pane-resize minimax-preview-resize" data-minimax-pane-resize="preview"></span></div>
                <div class="minimax-edit-timeline" data-minimax-scrub-track="1">
                    <span class="minimax-pane-resize minimax-video-resize" data-minimax-pane-resize="video"></span>
                    <span class="minimax-pane-resize minimax-ref-resize" data-minimax-pane-resize="refs"></span>
                    <div class="minimax-timeline-controls"><button type="button" data-minimax-play title="播放"><i data-lucide="play"></i></button></div>
                    <div class="minimax-ruler"><div class="minimax-track-content">${ticks}<span class="minimax-playhead" data-minimax-playhead="1" style="left:${playheadPct}%"></span></div></div>
                    <div class="minimax-add-gutter minimax-ruler-gutter"></div>
                    <div class="minimax-track-label minimax-video-label">Video</div>
                    <div class="minimax-track minimax-video-track"><div class="minimax-track-content">${segmentsHtml}</div></div>
                    <button type="button" class="minimax-video-add" data-minimax-add-segment title="新增片段"><i data-lucide="plus"></i></button>
                    <div class="minimax-track-label minimax-ref-label">Refs</div>
                    <div class="minimax-ref-track"><div class="minimax-ref-content">${refsHtml}</div></div>
                    <div class="minimax-add-gutter minimax-ref-gutter"></div>
                </div>
                <div class="minimax-current-panel">
                    <div class="minimax-current-head"><div class="minimax-current-title"><span class="minimax-current-dot"></span><b>Clip ${Math.max(1, node.segments.findIndex(seg => seg.id === selected?.id) + 1)}</b><span>${fmt(selected?.start)} - ${fmt(Number(selected?.start || 0) + segDuration)}</span></div><div class="minimax-current-refs"><span><i data-lucide="image"></i>${imageCount}</span><span><i data-lucide="film"></i>${videoCount}</span><span><i data-lucide="file-audio"></i>${audioCount}</span></div></div>
                    <label class="minimax-prompt-field"><span><i data-lucide="text-cursor-input"></i>Prompt</span><textarea data-minimax-prompt placeholder="Prompt for selected clip">${escapeHtml(selected?.prompt || '')}</textarea></label>
                    <div class="minimax-clip-parameters"><div class="minimax-section-label"><i data-lucide="sliders-horizontal"></i><span>Clip settings</span></div><div class="minimax-settings minimax-segment-fields">
                        <label class="minimax-wide-setting minimax-engine-setting"><span>Engine</span><select class="minimax-engine-select" data-minimax-engine><option value="comfyui" ${node.minimaxEngine === 'comfyui' ? 'selected' : ''}>ComfyUI</option><option value="runninghub" ${node.minimaxEngine === 'runninghub' ? 'selected' : ''}>RunningHub</option></select></label>
                        <label><span>Duration</span><input type="number" min="0.5" max="60" step="0.1" data-minimax-seg-number="duration" value="${escapeAttr(segDuration)}"><b>s</b></label>
                        <label><span>Megapixels</span><input type="number" min="0.1" max="2" step="0.1" data-minimax-seg-number="megapixels" value="${escapeAttr(selected?.megapixels || node.megapixels || 0.4)}"><b>MP</b></label>
                        <label class="minimax-wide-setting"><span>Aspect ratio</span><select data-minimax-select="aspectRatio">${['16:9','9:16','1:1','4:3','3:4','21:9','9:21'].map(value => `<option value="${value}" ${value === (selected?.aspectRatio || node.aspectRatio) ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
                        <label class="minimax-wide-setting"><span>Payment</span><select data-minimax-payment>${rhPaymentOptions(node)}</select></label>
                        <button class="minimax-run ${node.running ? 'running' : ''}" type="button" data-minimax-run ${node.running || overLimit ? 'disabled' : ''}><i data-lucide="${node.running ? 'loader-2' : 'sparkles'}"></i><span>${node.running ? 'Running' : 'Generate clip'}</span></button>
                    </div></div>
                </div>
            </div>
        </div>
        ${retryBarHtml(node)}
    `;
    bindMiniMaxWorkbench(wrap, node);
    bindCascadeButtons(wrap, node.id);
    return wrap;
}
function bindMiniMaxWorkbench(wrap, node){
    wrap.querySelectorAll('button,select,input,textarea,.minimax-tl-clip,.minimax-ref-clip,.minimax-material-card').forEach(el => {
        el.onmousedown = e => e.stopPropagation();
        el.onclick = el.onclick || (e => e.stopPropagation());
    });
    wrap.querySelectorAll('[data-minimax-pane-resize]').forEach(handle => {
        handle.onmousedown = e => miniMaxStartPaneResize(e, node, handle.dataset.minimaxPaneResize);
    });
    const addRefToSegment = (seg, item) => {
        if(!seg || !item?.url) return false;
        const kind = mediaKindForRef(item);
        const limits = {image:CANVAS_MINIMAX_REF_IMAGE_MAX, video:CANVAS_MINIMAX_REF_VIDEO_MAX, audio:CANVAS_MINIMAX_REF_AUDIO_MAX};
        if(!limits[kind]) return false;
        const current = miniMaxUniqueRefs(seg.refs || []);
        if(current.some(ref => ref.url === item.url)) return false;
        if(current.filter(ref => mediaKindForRef(ref) === kind).length >= limits[kind]) return false;
        seg.refs = miniMaxUniqueRefs([...current, {...item, kind}]);
        return true;
    };
    const assetsForNode = () => miniMaxUniqueRefs([...node.segments.flatMap(seg => seg.refs || []), ...miniMaxRefsForNode(node).refs]).slice(0, 36);
    const resolveDroppedMiniMaxItem = dataTransfer => {
        const assetIndex = Number(dataTransfer?.getData('application/x-canvas-minimax-asset-index'));
        if(Number.isFinite(assetIndex)) return {item:assetsForNode()[assetIndex], mode:'ref'};
        const materialIndex = Number(dataTransfer?.getData('application/x-canvas-minimax-material-index'));
        if(Number.isFinite(materialIndex)) return {item:node.materials?.[materialIndex], mode:'result'};
        const canvasUrl = dataTransfer?.getData('application/x-canvas-output-image') || dataTransfer?.getData('text/uri-list') || dataTransfer?.getData('text/plain') || '';
        const url = String(canvasUrl || '').split(/\r?\n/).find(Boolean) || '';
        return url ? {item:{url, name:canvasFileNameFromUrl(url) || 'asset', kind:mediaKindForRef({url})}, mode:'ref'} : null;
    };
    wrap.querySelectorAll('[data-minimax-scrub-track], .minimax-ruler, .minimax-video-track').forEach(track => {
        track.onmousedown = e => {
            if(e.button !== 0 || e.target.closest('button,.minimax-tl-clip,.minimax-ref-clip,.minimax-pane-resize')) return;
            e.preventDefault();
            e.stopPropagation();
            const content = wrap.querySelector('.minimax-ruler .minimax-track-content') || track;
            const rect = content.getBoundingClientRect();
            const setFromEvent = ev => {
                ev.preventDefault?.();
                const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / Math.max(1, rect.width)));
                miniMaxApplyTimelineTime(wrap, node, ratio * miniMaxTimelineTotal(node));
            };
            const onMove = move => setFromEvent(move);
            const onUp = () => {
                window.removeEventListener('mousemove', onMove, true);
                window.removeEventListener('mouseup', onUp, true);
                window.removeEventListener('blur', onUp, true);
                scheduleSave();
            };
            setFromEvent(e);
            window.addEventListener('mousemove', onMove, true);
            window.addEventListener('mouseup', onUp, true);
            window.addEventListener('blur', onUp, true);
        };
    });
    wrap.querySelectorAll('[data-minimax-drop-segment], .minimax-ref-track, .minimax-video-track').forEach(zone => {
        zone.ondragover = e => { e.preventDefault(); e.stopPropagation(); zone.classList.add('drag-over'); };
        zone.ondragleave = e => { e.stopPropagation(); zone.classList.remove('drag-over'); };
        zone.ondrop = e => {
            e.preventDefault();
            e.stopPropagation();
            zone.classList.remove('drag-over');
            let segId = zone.dataset.minimaxDropSegment || zone.closest('[data-minimax-drop-segment]')?.dataset.minimaxDropSegment || '';
            if(!segId){
                const content = wrap.querySelector('.minimax-ruler .minimax-track-content') || wrap.querySelector('.minimax-video-track');
                const rect = content?.getBoundingClientRect?.();
                if(rect){
                    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
                    segId = miniMaxActiveSegmentAt(node, ratio * miniMaxTimelineTotal(node))?.id || '';
                }
            }
            segId = segId || node.selectedSegmentId;
            const seg = node.segments.find(item => item.id === segId) || miniMaxSelectedSegment(node);
            const dropped = resolveDroppedMiniMaxItem(e.dataTransfer);
            if(!dropped?.item?.url || !seg) return;
            pushUndo();
            node.selectedSegmentId = seg.id;
            const intoVideoTrack = Boolean(zone.closest?.('.minimax-video-track,.minimax-tl-clip') || zone.classList?.contains('minimax-video-track') || zone.classList?.contains('minimax-tl-clip'));
            const intoRefTrack = Boolean(zone.closest?.('.minimax-ref-track,.minimax-ref-clip') || zone.classList?.contains('minimax-ref-track') || zone.classList?.contains('minimax-ref-clip'));
            if(dropped.mode === 'result' && intoVideoTrack && !intoRefTrack) miniMaxSetSegmentResult(node, seg, dropped.item);
            else addRefToSegment(seg, dropped.item);
            refreshNodes([node.id]);
            scheduleSave();
        };
    });
    wrap.querySelectorAll('[data-minimax-segment], [data-minimax-ref-segment]').forEach(el => {
        el.onclick = e => {
            if(e.target.closest('button')) return;
            e.stopPropagation();
            node.selectedSegmentId = el.dataset.minimaxSegment || el.dataset.minimaxRefSegment || node.selectedSegmentId;
            const seg = miniMaxSelectedSegment(node);
            node.playhead = Number(seg?.start || 0);
            refreshNodes([node.id]);
            scheduleSave();
        };
    });
    wrap.querySelectorAll('[data-minimax-add-segment]').forEach(btn => {
        btn.onclick = e => {
            e.stopPropagation();
            pushUndo();
            miniMaxCompactSegments(node);
            const start = miniMaxTimelineTotal(node);
            const duration = Math.max(0.5, Number(node.segments.at(-1)?.duration || node.duration || 8) || 8);
            const seg = {id:uid('seg'), start, duration, prompt:'', refs:[], result:null, results:[], aspectRatio:node.aspectRatio || '16:9', megapixels:Number(node.megapixels || 0.4), trimIn:0, trimOut:duration};
            node.segments.push(seg);
            node.selectedSegmentId = seg.id;
            node.playhead = start;
            miniMaxCompactSegments(node);
            refreshNodes([node.id]);
            scheduleSave();
        };
    });
    wrap.querySelectorAll('[data-minimax-delete-segment]').forEach(btn => {
        btn.onclick = e => {
            e.stopPropagation();
            if(node.segments.length <= 1) return;
            pushUndo();
            const id = btn.dataset.minimaxDeleteSegment;
            node.segments = node.segments.filter(seg => seg.id !== id);
            node.selectedSegmentId = node.segments[0]?.id || '';
            miniMaxCompactSegments(node);
            refreshNodes([node.id]);
            scheduleSave();
        };
    });
    wrap.querySelectorAll('[data-minimax-delete-ref]').forEach(btn => {
        btn.onclick = e => {
            e.stopPropagation();
            const [segId, rawIndex] = String(btn.dataset.minimaxDeleteRef || '').split(':');
            const seg = node.segments.find(item => item.id === segId);
            const index = Number(rawIndex);
            if(!seg || !Number.isFinite(index)) return;
            pushUndo();
            const refs = miniMaxExplicitRefsForSegment(seg);
            refs.splice(index, 1);
            seg.refs = refs;
            node.selectedSegmentId = seg.id;
            refreshNodes([node.id]);
            scheduleSave();
        };
    });
    const prompt = wrap.querySelector('[data-minimax-prompt]');
    if(prompt){
        bindScrollableText(prompt);
        prompt.oninput = e => {
            e.stopPropagation();
            const seg = miniMaxSelectedSegment(node);
            if(seg) seg.prompt = prompt.value;
            scheduleSave();
        };
    }
    wrap.querySelectorAll('[data-minimax-engine]').forEach(select => {
        select.onchange = e => { e.stopPropagation(); node.minimaxEngine = e.target.value === 'runninghub' ? 'runninghub' : 'comfyui'; refreshNodes([node.id]); scheduleSave(); };
    });
    wrap.querySelectorAll('[data-minimax-payment]').forEach(select => {
        select.onchange = e => { e.stopPropagation(); node.rhPayment = e.target.value === 'wallet' ? 'wallet' : 'free'; scheduleSave(); };
    });
    wrap.querySelectorAll('[data-minimax-select]').forEach(select => {
        select.onchange = e => {
            e.stopPropagation();
            const seg = miniMaxSelectedSegment(node);
            if(seg) seg[select.dataset.minimaxSelect] = select.value;
            node[select.dataset.minimaxSelect] = select.value;
            scheduleSave();
        };
    });
    wrap.querySelectorAll('[data-minimax-seg-number]').forEach(input => {
        input.oninput = input.onchange = e => {
            e.stopPropagation();
            const seg = miniMaxSelectedSegment(node);
            if(!seg) return;
            const value = Number(input.value);
            if(input.dataset.minimaxSegNumber === 'duration'){
                seg.duration = Math.max(0.5, value || 0.5);
                seg.trimOut = Math.min(seg.duration, Math.max(Number(seg.trimOut || seg.duration), Number(seg.trimIn || 0) + 0.1));
                miniMaxCompactSegments(node);
                if(e.type === 'change') refreshNodes([node.id]);
            }
            if(input.dataset.minimaxSegNumber === 'megapixels'){
                seg.megapixels = Math.max(0.1, Math.min(2, value || 0.4));
                node.megapixels = seg.megapixels;
            }
            scheduleSave();
        };
    });
    wrap.querySelectorAll('[data-minimax-run]').forEach(btn => {
        btn.onclick = e => { e.stopPropagation(); runMiniMaxNode(node.id); };
    });
    wrap.querySelectorAll('[data-minimax-download-current]').forEach(btn => {
        btn.onclick = e => { e.stopPropagation(); miniMaxDownloadItem(miniMaxSelectedSegment(node)?.result); };
    });
    wrap.querySelectorAll('[data-minimax-export]').forEach(btn => {
        btn.onclick = e => { e.stopPropagation(); miniMaxExportTimeline(node); };
    });
    wrap.querySelectorAll('[data-minimax-download-material]').forEach(btn => {
        btn.onclick = e => { e.stopPropagation(); miniMaxDownloadItem(node.materials?.[Number(btn.dataset.minimaxDownloadMaterial)]); };
    });
    wrap.querySelectorAll('[data-minimax-use-material]').forEach(btn => {
        btn.onclick = e => {
            e.stopPropagation();
            const item = node.materials?.[Number(btn.dataset.minimaxUseMaterial)];
            const seg = miniMaxSelectedSegment(node);
            if(!item || !seg) return;
            pushUndo();
            miniMaxSetSegmentResult(node, seg, item);
            refreshNodes([node.id]);
            scheduleSave();
        };
    });
    wrap.querySelectorAll('[data-minimax-asset-index]').forEach(card => {
        card.ondragstart = e => {
            e.stopPropagation();
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('application/x-canvas-minimax-asset-index', card.dataset.minimaxAssetIndex || '');
        };
    });
    wrap.querySelectorAll('[data-minimax-material-index]').forEach(card => {
        card.ondragstart = e => {
            e.stopPropagation();
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('application/x-canvas-minimax-material-index', card.dataset.minimaxMaterialIndex || '');
        };
    });
    wrap.querySelectorAll('[data-minimax-play]').forEach(btn => {
        btn.onclick = e => {
            e.stopPropagation();
            const video = wrap.querySelector('[data-minimax-player]');
            if(video){ video.paused ? video.play?.().catch(() => {}) : video.pause?.(); }
        };
    });
}
function renderPromptPreview(container, promptInputs){
    if(!container) return;
    container.innerHTML = promptInputs.length ? `<div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Prompts</div>${promptInputs.map(src => `<div class="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 line-clamp-2">${escapeHtml(src.label)}</div>`).join('')}` : '';
}
function renderImageInputList(list, node, imageInputs, emptyText=null){
    if(!list) return;
    list.innerHTML = imageInputs.length ? '' : `<div class="text-[11px] text-gray-300 py-2">${escapeHtml(emptyText || tr('canvas.inputImagesEmpty'))}</div>`;
    imageInputs.forEach((src, i) => {
        const item = document.createElement('div');
        item.className = 'input-item';
        item.draggable = true;
        item.dataset.sourceId = src.id;
        const previewHtml = src.preview && !isMissingAssetUrl(src.preview) ? canvasPreviewImgHtml(src.preview, 256) : (src.preview ? missingAssetHtml(src.preview, true) : '<i data-lucide="image" class="w-6 h-6 text-slate-400"></i>');
        item.innerHTML = `<span class="input-index">${i + 1}</span>${previewHtml}<span class="input-label">${escapeHtml(src.label)}</span>`;
        item.ondragstart = e => {
            e.stopPropagation();
            internalDrag = true;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('application/x-canvas-input', src.id);
        };
        item.ondragend = () => { internalDrag = false; };
        item.ondragover = e => { e.preventDefault(); e.stopPropagation(); };
        item.ondrop = e => {
            e.preventDefault();
            e.stopPropagation();
            reorderInput(node, e.dataTransfer.getData('application/x-canvas-input'), src.id);
            internalDrag = false;
        };
        list.appendChild(item);
    });
    refreshIcons();
}
function renderVideoImageInputs(list, node, imageInputs){
    if(!list) return;
    list.innerHTML = imageInputs.length ? '' : `<div class="text-[11px] text-gray-300 py-2">${tr('canvas.groupEmpty')}</div>`;
    imageInputs.forEach((src, i) => {
        const item = document.createElement('div');
        item.className = 'input-item video-input-item';
        item.draggable = true;
        item.dataset.sourceId = src.id;
        const kind = mediaKindForRef(src.refs?.[0] || {url:src.preview || ''});
        const frameLabel = kind === 'image' && node.useFrameRoles && i === 0 ? tr('canvas.videoRoleFirstFrame') : kind === 'image' && node.useFrameRoles && i === 1 ? tr('canvas.videoRoleLastFrame') : '';
        const previewHtml = kind === 'video'
            ? canvasVideoPreviewHtml(src.preview || src.refs?.[0]?.url || '', 256)
            : kind === 'audio'
            ? `<div class="video-input-audio"><i data-lucide="file-audio" class="w-6 h-6"></i><span>${escapeHtml(src.label || 'Audio')}</span></div>`
            : src.preview && !isMissingAssetUrl(src.preview)
            ? canvasPreviewImgHtml(src.preview, 256)
            : (src.preview ? missingAssetHtml(src.preview, true) : '<i data-lucide="image" class="w-6 h-6 text-slate-400"></i>');
        const typeLabel = kind === 'audio' ? `音频${i + 1}` : kind === 'video' ? `视频${i + 1}` : `图${i + 1}`;
        item.innerHTML = `
            <div class="video-input-thumb">
                <span class="input-index">${i + 1}</span>
                ${previewHtml}
                <span class="input-label">${escapeHtml(typeLabel)}</span>
            </div>
            ${frameLabel ? `<div class="video-frame-label">${frameLabel}</div>` : ''}
        `;
        item.ondragstart = e => { e.stopPropagation(); internalDrag = true; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('application/x-canvas-input', src.id); };
        item.ondragend = () => { internalDrag = false; };
        item.ondragover = e => { e.preventDefault(); e.stopPropagation(); };
        item.ondrop = e => { e.preventDefault(); e.stopPropagation(); reorderInput(node, e.dataTransfer.getData('application/x-canvas-input'), src.id); internalDrag = false; };
        list.appendChild(item);
    });
    refreshIcons();
}
function comfyWorkflowOptions(selected){
    const opts = comfyWorkflows.map(w => `<option value="${escapeHtml(w.name)}" ${w.name === selected ? 'selected' : ''}>${escapeHtml(w.title || w.name.replace('.json',''))}</option>`).join('');
    return opts || `<option value="">${tr('canvas.comfyNoWorkflow')}</option>`;
}
function hasComfyWorkflow(name){
    return !!name && comfyWorkflows.some(w => w.name === name);
}
function validComfyWorkflowName(name){
    return hasComfyWorkflow(name) ? name : (comfyWorkflows[0]?.name || '');
}
function pruneMissingComfyWorkflows(){
    let changed = false;
    nodes.filter(n => n.type === 'comfy').forEach(node => {
        if(node.comfyWorkflow && !hasComfyWorkflow(node.comfyWorkflow)){
            delete comfyWorkflowCache[node.comfyWorkflow];
            node.comfyWorkflow = '';
            changed = true;
        }
    });
    if(changed) scheduleSave();
}
function currentComfyWorkflow(node){
    const selected = validComfyWorkflowName(node.comfyWorkflow || comfyWorkflows[0]?.name || '');
    return comfyWorkflowCache[selected] || null;
}
function comfyWorkflowLinkValue(value){
    return Array.isArray(value) && value.length === 2 && typeof value[0] === 'string' && Number.isInteger(value[1]);
}
function comfyWorkflowInputFields(workflow){
    const fields = [];
    if(!workflow || typeof workflow !== 'object' || Array.isArray(workflow)) return fields;
    Object.entries(workflow).forEach(([nodeId, node]) => {
        const inputs = node?.inputs;
        if(!inputs || typeof inputs !== 'object' || Array.isArray(inputs)) return;
        const title = node?._meta?.title || node?.class_type || `Node ${nodeId}`;
        Object.entries(inputs).forEach(([input, value]) => {
            if(comfyWorkflowLinkValue(value)) return;
            const valueType = typeof value;
            if(!['string', 'number', 'boolean'].includes(valueType) && value !== null) return;
            const inputKey = String(input).toLowerCase();
            const kind = /^(image|mask|video|audio|sound|movie|photo|picture)$/.test(inputKey)
                ? (/(video|movie)/.test(inputKey) ? 'video' : /(audio|sound)/.test(inputKey) ? 'audio' : 'image')
                : /prompt|positive|negative|text|caption|description/.test(inputKey) ? 'prompt' : 'setting';
            const type = valueType === 'boolean' ? 'boolean' : valueType === 'number' ? 'number' : kind === 'prompt' ? 'textarea' : 'text';
            fields.push({
                id:`${nodeId}.${input}`,
                node:String(nodeId),
                input:String(input),
                name:`${title} - ${input}`,
                type,
                kind,
                default:value === null ? '' : value,
                options:[],
                random_enabled:false,
                source:'workflow'
            });
        });
    });
    return fields;
}
function hydrateComfyWorkflowFields(data){
    if(!data || typeof data !== 'object') return data;
    const config = data.config && typeof data.config === 'object' ? data.config : {};
    const configured = Array.isArray(config.fields) ? config.fields : [];
    const seen = new Set(configured.map(field => field?.node && field?.input ? `${field.node}.${field.input}` : field?.id).filter(Boolean));
    const derived = comfyWorkflowInputFields(data.workflow).filter(field => {
        if(seen.has(field.id)) return false;
        seen.add(field.id);
        return true;
    });
    return {...data, config:{...config, fields:[...configured, ...derived]}};
}
async function ensureComfyWorkflow(name){
    if(!hasComfyWorkflow(name)) return null;
    if(comfyWorkflowCache[name]) return comfyWorkflowCache[name];
    if(comfyWorkflowLoads[name]) return comfyWorkflowLoads[name];
    const load = (async () => {
        const res = await classicCanvasApi().getWorkflow(name);
        if(!res.ok){
            delete comfyWorkflowCache[name];
            return null;
        }
        const data = await res.json();
        const hydrated = hydrateComfyWorkflowFields(data);
        if(hydrated && hydrated !== data && data && typeof data === 'object') data.config = hydrated.config;
        comfyWorkflowCache[name] = data;
        return data;
    })().finally(() => { delete comfyWorkflowLoads[name]; });
    comfyWorkflowLoads[name] = load;
    return load;
}
function validRunningHubWorkflowId(workflowId){
    return String(workflowId || '').trim();
}
function currentRunningHubWorkflow(node){
    const workflowId = validRunningHubWorkflowId(node.workflowId || '');
    return runningHubWorkflowCache[workflowId] || null;
}
async function ensureRunningHubWorkflow(workflowId){
    workflowId = validRunningHubWorkflowId(workflowId);
    if(!workflowId) return null;
    if(runningHubWorkflowCache[workflowId]) return runningHubWorkflowCache[workflowId];
    if(runningHubWorkflowLoads[workflowId]) return runningHubWorkflowLoads[workflowId];
    const load = (async () => {
        const res = await classicCanvasApi().getRunningHubWorkflow(workflowId);
        const loadRemoteInfo = async saved => {
            try {
                const infoRes = await classicCanvasApi().getRunningHubWorkflowInfo(workflowId);
                const infoPayload = await infoRes.json();
                const info = infoPayload?.data || {};
                const fields = Array.isArray(info.nodeInfoList) ? info.nodeInfoList : [];
                if(infoRes.ok && infoPayload?.success !== false && (saved || fields.length)){
                    return {
                        ...(saved || {}),
                        workflowId,
                        title:saved?.title || info.title || workflowId,
                        fields:fields.length ? fields : (saved?.fields || []),
                        raw:saved?.raw || info.raw || null
                    };
                }
            } catch(_) {}
            return null;
        };
        const clearFailed = () => {
            if(!res.ok){ delete runningHubWorkflowCache[workflowId]; return null; }
            return null;
        };
        if(!res.ok){
            const fallback = await loadRemoteInfo(null);
            if(fallback){
                runningHubWorkflowCache[workflowId] = fallback;
                return fallback;
            }
            return clearFailed();
        }
        const data = await res.json();
        runningHubWorkflowCache[workflowId] = data.workflow || null;
        const saved = runningHubWorkflowCache[workflowId];
        if(Array.isArray(saved?.fields) && saved.fields.length) return runningHubWorkflowCache[workflowId];
        const fallback = await loadRemoteInfo(saved);
        if(fallback){
            runningHubWorkflowCache[workflowId] = fallback;
            return fallback;
        }
        delete runningHubWorkflowCache[workflowId];
        return saved;
    })().finally(() => { delete runningHubWorkflowLoads[workflowId]; });
    runningHubWorkflowLoads[workflowId] = load;
    return load;
}
function comfyFieldKind(f){
    if(['image','video','audio','prompt','setting'].includes(f?.kind)) return f.kind;
    if(['image','video','audio'].includes(f?.type)) return f.type;
    const key = `${f.input || ''} ${f.name || ''}`.toLowerCase();
    if(f.type === 'textarea' || /prompt|text|提示词|正向|负向/.test(key)) return 'prompt';
    return 'setting';
}
function comfyFields(node, kind='all'){
    const data = currentComfyWorkflow(node);
    const fields = data?.config?.fields || [];
    return kind === 'all' ? fields : fields.filter(f => comfyFieldKind(f) === kind);
}
function comfyUploadFieldKey(field){
    return String(field?.id || `${field?.node || ''}.${field?.input || ''}`);
}
function comfyUploadNodeForField(node, field){
    const key = comfyUploadFieldKey(field);
    const nodeId = String(node?.comfyUploadBindings?.[key] || '').trim();
    const upload = nodeId
        ? nodes.find(item => item.id === nodeId)
        : nodes.find(item => item.type === 'image' && item.comfyUploadFor?.comfyNodeId === node.id && item.comfyUploadFor?.fieldKey === key);
    return upload?.type === 'image' && upload.comfyUploadFor?.comfyNodeId === node.id ? upload : null;
}
function syncComfyUploadNodes(node){
    if(!node || node.type !== 'comfy' || (node.mode || 'text') !== 'custom') return false;
    const fields = comfyFields(node).filter(field => ['image','video','audio'].includes(comfyFieldKind(field)));
    if(!fields.length) return false;
    node.comfyUploadBindings = node.comfyUploadBindings && typeof node.comfyUploadBindings === 'object' ? node.comfyUploadBindings : {};
    const counts = {image:0, video:0, audio:0};
    let changed = false;
    fields.forEach(field => {
        const kind = comfyFieldKind(field);
        const index = counts[kind]++;
        const key = comfyUploadFieldKey(field);
        const current = comfyUploadNodeForField(node, field);
        if(current){
            if(node.comfyUploadBindings[key] !== current.id){
                node.comfyUploadBindings[key] = current.id;
                changed = true;
            }
            current.uploadLabel = current.uploadLabel || rhMediaUploadLabel(kind, index);
            current.mediaKind = kind;
            current.comfyUploadFor = {...(current.comfyUploadFor || {}), comfyNodeId:node.id, fieldKey:key, kind, index};
            return;
        }
        const label = rhMediaUploadLabel(kind, index);
        const upload = {
            id:uid('comfy-upload'),
            type:'image',
            x:Number(node.x || 0) - 380,
            y:Number(node.y || 0) + Math.max(0, fields.indexOf(field)) * 170,
            url:'',
            name:label,
            mediaKind:kind,
            uploadLabel:label,
            comfyUploadFor:{comfyNodeId:node.id, fieldKey:key, fieldName:String(field.input || ''), kind, index}
        };
        nodes.push(upload);
        node.comfyUploadBindings[key] = upload.id;
        if(canConnect(upload.id, node.id) && !connections.some(c => c.from === upload.id && c.to === node.id)){
            connections.push({id:uid('c'), from:upload.id, to:node.id});
        }
        changed = true;
    });
    Object.keys(node.comfyUploadBindings).forEach(key => {
        const field = fields.find(item => comfyUploadFieldKey(item) === key);
        if(!field || !comfyUploadNodeForField(node, field)){
            delete node.comfyUploadBindings[key];
            changed = true;
        }
    });
    if(changed) scheduleSave();
    return changed;
}
function comfyBoundMediaRefs(node, kind, sources){
    return comfyBoundMediaRefsByField(node, kind, sources).filter(Boolean);
}
function comfyBoundMediaRefsByField(node, kind, sources){
    const fields = comfyFields(node, kind);
    if(!fields.length) return [];
    const sourcesById = new Map((sources || []).map(source => [String(source.id || ''), source]));
    const boundUploadIds = new Set(Object.values(node?.comfyUploadBindings || {}).map(String));
    const fallback = (sources || []).filter(source => !boundUploadIds.has(String(source.id || '')))
        .flatMap(source => (source.refs || []).filter(ref => mediaKindForRef(ref) === kind));
    const result = [];
    fields.forEach((field, index) => {
        const upload = comfyUploadNodeForField(node, field);
        const source = upload ? sourcesById.get(upload.id) : null;
        const ref = source?.refs?.find(item => mediaKindForRef(item) === kind) || fallback[index];
        result.push(ref?.url ? ref : null);
    });
    return result;
}
function comfyParamValue(node, field){
    node.comfyParams = node.comfyParams || {};
    if(node.comfyParams[field.id] !== undefined) return node.comfyParams[field.id];
    return field.default ?? (field.type === 'boolean' ? false : (field.type === 'number' || field.type === 'slider' ? 0 : ''));
}
function comfyRandomEnabled(field){
    return field?.type === 'number' && field.random_enabled === true;
}
function comfyRandomActive(node, fieldId){
    node.comfyRandomActive = node.comfyRandomActive || {};
    return node.comfyRandomActive[fieldId] !== false;
}
function comfyRandomValue(field){
    const isFloat = Number(field.step) > 0 && Number(field.step) < 1;
    let min = Number.isFinite(Number(field.min)) ? Number(field.min) : null;
    let max = Number.isFinite(Number(field.max)) ? Number(field.max) : null;
    const name = `${field.input || ''} ${field.name || ''}`.toLowerCase();
    const looksSeed = name.includes('seed') || name.includes('noise') || name.includes('随机') || name.includes('噪');
    if(min === null) min = looksSeed ? 1 : 0;
    if(max === null || max <= min) max = looksSeed ? 4294967295 : 999999;
    if(looksSeed) max = Math.min(max, 4294967295);
    let value = min + Math.random() * (max - min);
    if(isFloat){
        const precision = Math.min(8, Math.max(1, String(field.step).split('.')[1]?.length || 2));
        return Number(value.toFixed(precision));
    }
    return Math.floor(value);
}
function toggleComfyRandom(nodeId, fieldId){
    const node = nodes.find(n => n.id === nodeId);
    if(!node) return;
    const field = comfyFields(node).find(f => f.id === fieldId);
    if(!comfyRandomEnabled(field)) return;
    node.comfyRandomActive = node.comfyRandomActive || {};
    node.comfyRandomActive[fieldId] = !comfyRandomActive(node, fieldId);
    refreshNodes([node.id]);
    scheduleSave();
}
function renderComfyBody(node){
    const wrap = document.createElement('div');
    wrap.className = 'comfy-body';
    const inputSources = generatorSources(node);
    const ordered = orderedSources(node, inputSources);
    const mediaInputs = ordered.filter(src => src.refs?.length);
    const imageInputs = mediaInputs
        .map(src => ({...src, refs:imageRefsOnly(src.refs || [])}))
        .filter(src => src.refs?.length);
    const promptInputs = ordered.filter(src => src.prompt && !src.refs?.length);
    const mode = node.mode || 'text';
    const imageFieldCount = mode === 'custom' ? comfyFields(node, 'image').length : 0;
    const videoFieldCount = mode === 'custom' ? comfyFields(node, 'video').length : 0;
    const audioFieldCount = mode === 'custom' ? comfyFields(node, 'audio').length : 0;
    const mediaFieldCount = imageFieldCount + videoFieldCount + audioFieldCount;
    if(mode === 'custom'){
        const validWorkflow = validComfyWorkflowName(node.comfyWorkflow);
        if(node.comfyWorkflow && node.comfyWorkflow !== validWorkflow) node.comfyWorkflow = validWorkflow;
        if(!node.comfyWorkflow && validWorkflow) node.comfyWorkflow = validWorkflow;
    }
    wrap.innerHTML = `
        <div class="mode-tabs">
            <button type="button" data-mode="text" class="${mode === 'text' ? 'active' : ''}">${tr('canvas.comfyModeText')}</button>
            <button type="button" data-mode="enhance" class="${mode === 'enhance' ? 'active' : ''}">${tr('canvas.comfyModeEnhance')}</button>
            <button type="button" data-mode="edit" class="${mode === 'edit' ? 'active' : ''}">${tr('canvas.comfyModeEdit')}</button>
            <button type="button" data-mode="custom" class="${mode === 'custom' ? 'active' : ''}">${tr('canvas.comfyModeCustom')}</button>
        </div>
        <div class="comfy-content">
            <div class="prompt-list"></div>
            <div class="comfy-images ${(mode === 'text' || (mode === 'custom' && !mediaFieldCount)) ? 'hidden' : ''}">
                <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${mode === 'custom' ? `Media · Images ${imageFieldCount} · Videos ${videoFieldCount} · Audio ${audioFieldCount}` : 'Images'}</div>
                <div class="input-list mt-2"></div>
            </div>
        </div>
        <div class="comfy-controls">
            <div class="gen-settings comfy-settings"></div>
            <div class="gen-run-row">
                <button class="comfy-run ${node.running ? 'running' : ''}" ${node.running ? 'disabled' : ''}><i data-lucide="zap" class="w-4 h-4"></i>${node.running ? tr('canvas.comfyRunning') : tr('canvas.comfyRun')}</button>
                ${cascadeBtnHtml(node)}
            </div>
            ${retryBarHtml(node)}
        </div>
    `;
    wrap.querySelectorAll('[data-mode]').forEach(btn => {
        btn.onclick = e => {
            e.stopPropagation();
            node.mode = btn.dataset.mode;
            if(node.mode === 'custom' && !hasComfyWorkflow(node.comfyWorkflow) && comfyWorkflows[0]?.name){
                node.comfyWorkflow = comfyWorkflows[0].name;
                ensureComfyWorkflow(node.comfyWorkflow).then(() => render());
            }
            render();
            scheduleSave();
        };
    });
    renderPromptPreview(wrap.querySelector('.prompt-list'), promptInputs);
    if(mode !== 'text' && !(mode === 'custom' && !mediaFieldCount)){
        renderComfyImages(wrap.querySelector('.input-list'), node, mode === 'custom' ? mediaInputs : imageInputs);
    }
    renderComfySettings(wrap.querySelector('.comfy-settings'), node);
    wrap.querySelector('.comfy-run').onclick = e => { e.stopPropagation(); runCanvasGenerate(node.id); };
    bindCascadeButtons(wrap, node.id);
    return wrap;
}
function renderComfyImages(list, node, imageInputs){
    list.innerHTML = imageInputs.length ? '' : `<div class="text-[11px] text-gray-300 py-2">${tr('canvas.groupEmpty')}</div>`;
    imageInputs.forEach((src, i) => {
        const item = document.createElement('div');
        item.className = 'input-item';
        item.draggable = true;
        item.dataset.sourceId = src.id;
        const firstRef = (src.refs || [])[0];
        const kind = mediaKindForRef(firstRef || src.preview);
        const icon = kind === 'video' ? 'file-video' : kind === 'audio' ? 'file-audio' : 'image';
        const label = kind === 'image' ? `${tr('canvas.image')} ${i + 1}` : `${nodeTitleForMedia({mediaKind:kind})} ${i + 1}`;
        const previewHtml = kind === 'video' && src.preview && !isMissingAssetUrl(src.preview)
            ? canvasVideoPreviewHtml(src.preview, 256)
            : kind === 'audio'
                ? `<i data-lucide="${icon}" class="w-6 h-6 text-slate-400"></i>`
                : (src.preview && !isMissingAssetUrl(src.preview) ? canvasPreviewImgHtml(src.preview, 256) : (src.preview ? missingAssetHtml(src.preview, true) : `<i data-lucide="${icon}" class="w-6 h-6 text-slate-400"></i>`));
        item.innerHTML = `<span class="input-index">${i + 1}</span>${previewHtml}<span class="input-label">${escapeHtml(label)}</span>`;
        item.ondragstart = e => {
            e.stopPropagation();
            internalDrag = true;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('application/x-canvas-input', src.id);
        };
        item.ondragend = () => { internalDrag = false; };
        item.ondragover = e => { e.preventDefault(); e.stopPropagation(); };
        item.ondrop = e => {
            e.preventDefault();
            e.stopPropagation();
            reorderInput(node, e.dataTransfer.getData('application/x-canvas-input'), src.id);
            internalDrag = false;
        };
        list.appendChild(item);
    });
}
const RH_KNOWN_FIELD_OPTIONS = {
    aspectRatio:['1:1','16:9','9:16','4:3','3:4','4:5','5:4','3:2','2:3','21:9','9:21'],
    aspect_ratio:['1:1','16:9','9:16','4:3','3:4','4:5','5:4','3:2','2:3','21:9','9:21'],
    ratio:['1:1','16:9','9:16','21:9','9:21','4:3','3:4','4:5','5:4','3:2','2:3'],
    resolution:['1k','2k','4k','8k'],
    size:['512','768','1024','1280','1536','2048'],
    mode:['text2img','img2img'],
    quality:['low','medium','high','best'],
    instanceType:['default','plus','pro'],
    instance_type:['default','plus','pro'],
    precision:['fp16','fp32','bf16'],
    scheduler:['normal','karras','exponential','sgm_uniform','simple','ddim_uniform'],
    sampler:['euler','euler_ancestral','heun','dpm_2','dpm_2_ancestral','lms','dpmpp_2m','dpmpp_sde','ddim','uni_pc']
};
function rhParamKey(nodeId, fieldName){
    return `${nodeId ?? ''}::${fieldName ?? ''}`;
}
function rhFieldKind(field){
    const type = String(field?.fieldType || '').trim().toUpperCase();
    if(type === 'IMAGE') return 'image';
    if(type === 'VIDEO') return 'video';
    if(type === 'AUDIO') return 'audio';
    if(type === 'SLIDER') return 'slider';
    if(['NUMBER','FLOAT','INTEGER','INT'].includes(type)) return 'number';
    if(['BOOLEAN','BOOL'].includes(type)) return 'boolean';
    const key = `${field?.fieldName || ''} ${field?.fieldValue || ''}`.toLowerCase();
    if(/\b(image|img|mask|photo|picture)\b/.test(key) || /\.(png|jpe?g|webp|gif|bmp)(\?|$)/i.test(key)) return 'image';
    if(/\b(video|movie|mp4)\b/.test(key) || /\.(mp4|webm|mov|m4v|mkv)(\?|$)/i.test(key)) return 'video';
    if(/\b(audio|sound|music|voice)\b/.test(key) || /\.(mp3|wav|ogg|m4a|flac|aac)(\?|$)/i.test(key)) return 'audio';
    return 'text';
}
function rhFieldRole(field){
    const kind = rhFieldKind(field);
    if(['image','video','audio','number','slider','boolean'].includes(kind)) return kind;
    const text = `${field?.fieldName || ''} ${field?.label || ''} ${field?.group || ''}`.toLowerCase();
    if(/prompt|positive|negative|text|caption|description|关键词|提示词|正向|负向/.test(text)) return 'prompt';
    return 'text';
}
function rhExtractFieldOptions(field){
    const candidates = [field?.fieldData, field?.options, field?.list, field?.values, field?.enum, field?.choices, field?.items, field?.selectOptions, field?.dropdown];
    for(const candidate of candidates){
        if(!Array.isArray(candidate) || !candidate.length) continue;
        if(candidate.every(x => ['string','number'].includes(typeof x))) return candidate.map(String);
        if(candidate.every(x => x && typeof x === 'object' && ('value' in x || 'label' in x || 'name' in x))){
            return candidate.map(x => x.value ?? x.label ?? x.name).filter(v => v !== undefined && v !== null).map(String);
        }
    }
    const fieldType = String(field?.fieldType || '').toUpperCase();
    if(['LIST','SELECT','DROPDOWN','COMBO','ENUM'].includes(fieldType) && Array.isArray(field?.fieldValue)){
        return field.fieldValue.filter(x => ['string','number'].includes(typeof x)).map(String);
    }
    const name = String(field?.fieldName || '').trim();
    if(name){
        if(RH_KNOWN_FIELD_OPTIONS[name]) return RH_KNOWN_FIELD_OPTIONS[name].map(String);
        const hit = Object.keys(RH_KNOWN_FIELD_OPTIONS).find(k => k.toLowerCase() === name.toLowerCase());
        if(hit) return RH_KNOWN_FIELD_OPTIONS[hit].map(String);
    }
    return null;
}
function rhDefaultValue(field){
    let value = field?.fieldValue;
    if(Array.isArray(value)) value = value[0];
    if(value === undefined || value === null || typeof value === 'object') return '';
    return String(value);
}
function rhRandomEnabled(field){
    return rhFieldKind(field) === 'number' && field?.random_enabled === true;
}
function rhRandomActive(node, key){
    node.rhRandomActive = node.rhRandomActive || {};
    return node.rhRandomActive[key] !== false;
}
function toggleRhRandom(nodeId, key){
    const node = nodes.find(n => n.id === nodeId);
    if(!node) return;
    const field = rhActiveFields(node).find(f => rhParamKey(f.nodeId, f.fieldName) === key);
    if(!rhRandomEnabled(field)) return;
    node.rhRandomActive = node.rhRandomActive || {};
    node.rhRandomActive[key] = !rhRandomActive(node, key);
    refreshNodes([node.id]);
    scheduleSave();
}
function rhWorkflowNodeInfoList(data){
    const list = [];
    if(!data || typeof data !== 'object' || Array.isArray(data)) return list;
    Object.entries(data).forEach(([nodeId, nodeContent]) => {
        const inputs = nodeContent?.inputs || {};
        if(!inputs || typeof inputs !== 'object') return;
        Object.entries(inputs).forEach(([fieldName, rawValue]) => {
            if(rhIsWorkflowLinkValue(rawValue)) return;
            let fieldValue = rawValue;
            if(fieldValue !== null && typeof fieldValue === 'object') fieldValue = JSON.stringify(fieldValue);
            else if(fieldValue === undefined || fieldValue === null) fieldValue = '';
            else fieldValue = String(fieldValue);
            list.push({
                nodeId:String(nodeId),
                fieldName:String(fieldName),
                fieldValue,
                fieldType:rhInferWorkflowFieldType(fieldName, fieldValue),
                source:'workflow'
            });
        });
    });
    return list;
}
function rhInferWorkflowFieldType(fieldName, fieldValue){
    const key = `${fieldName || ''} ${fieldValue || ''}`.toLowerCase();
    if(/\b(image|img|mask|photo|picture)\b/.test(key) || /\.(png|jpe?g|webp|gif|bmp)(\?|$)/i.test(key)) return 'IMAGE';
    if(/\b(video|movie|mp4)\b/.test(key) || /\.(mp4|webm|mov|m4v|mkv)(\?|$)/i.test(key)) return 'VIDEO';
    if(/\b(audio|sound|music|voice)\b/.test(key) || /\.(mp3|wav|ogg|m4a|flac|aac)(\?|$)/i.test(key)) return 'AUDIO';
    if(/^(true|false)$/i.test(String(fieldValue || ''))) return 'BOOLEAN';
    if(String(fieldValue || '').trim() !== '' && !Number.isNaN(Number(fieldValue))) return 'NUMBER';
    return 'TEXT';
}
function rhIsWorkflowLinkValue(value){
    return Array.isArray(value) && value.length === 2 && typeof value[0] === 'string' && Number.isInteger(value[1]);
}
function runningHubProvider(){
    const provider = (apiProviders || []).find(p => p.id === 'runninghub');
    return provider || null;
}
function runningHubEntries(kind){
    const provider = runningHubProvider();
    if(kind === 'model'){
        return uniqueModels(provider?.image_models || []).map(model => ({
            id:model,
            model,
            title:model,
            enabled:true,
            source:'model'
        }));
    }
    const key = kind === 'workflow' ? 'rh_workflows' : 'rh_apps';
    return Array.isArray(provider?.[key]) ? provider[key].filter(item => item?.enabled !== false && item?.hidden !== true) : [];
}
function runningHubEntryId(entry, kind){
    if(kind === 'model') return String(typeof entry === 'string' ? entry : (entry?.model || entry?.id || entry?.name || '')).trim();
    return String(kind === 'workflow' ? (entry?.workflowId || entry?.id || '') : (entry?.appId || entry?.id || '')).trim();
}
function runningHubEntryLabel(entry, kind){
    const id = runningHubEntryId(entry, kind);
    if(kind === 'model') return entry?.title || entry?.name || id;
    return entry?.title || entry?.name || (kind === 'workflow' ? `工作流 ${id.slice(-6)}` : `AI 应用 ${id.slice(-6)}`);
}
function runningHubEntryKey(kind, id){
    return `${kind}:${String(id || '').trim()}`;
}
function parseRunningHubEntryKey(value){
    const text = String(value || '').trim();
    const match = text.match(/^(app|workflow|model):(.+)$/);
    if(match) return {kind:match[1], id:match[2]};
    return null;
}
function runningHubAllEntries(){
    return [
        ...runningHubEntries('model').map(entry => ({kind:'model', id:runningHubEntryId(entry, 'model'), entry})),
        ...runningHubEntries('app').map(entry => ({kind:'app', id:runningHubEntryId(entry, 'app'), entry})),
        ...runningHubEntries('workflow').map(entry => ({kind:'workflow', id:runningHubEntryId(entry, 'workflow'), entry}))
    ].filter(item => item.id);
}
function rhSelectedEntryRef(node){
    const parsed = parseRunningHubEntryKey(node?.rhConfigKey || '');
    const all = runningHubAllEntries();
    if(parsed){
        const hit = all.find(item => item.kind === parsed.kind && item.id === parsed.id);
        if(hit) return hit;
    }
    const workflowId = validRunningHubWorkflowId(node?.workflowId || '');
    if(workflowId){
        const hit = all.find(item => item.kind === 'workflow' && item.id === workflowId);
        if(hit) return hit;
    }
    const webappId = String(node?.webappId || '').trim();
    if(webappId){
        const hit = all.find(item => item.kind === 'app' && item.id === webappId);
        if(hit) return hit;
    }
    return null;
}
function applyRhEntrySelection(node, ref){
    if(!node || !ref) return;
    node.rhConfigKey = runningHubEntryKey(ref.kind, ref.id);
    node.rhMode = ref.kind;
    if(ref.kind === 'workflow') node.workflowId = ref.id;
    else if(ref.kind === 'app') node.webappId = ref.id;
    else if(ref.kind === 'model'){
        node.rhModel = ref.id;
        node.model = ref.id;
        node.apiProvider = 'runninghub';
        node.resolution = node.resolution || defaultApiImageResolution(ref.id);
        node.ratio = node.ratio || 'square';
        node.quality = node.quality || 'auto';
        node.count = Math.max(1, Math.min(8, Number(node.count || 1)));
    }
}
function currentRunningHubAppConfig(node){
    const webappId = String(node?.webappId || '').trim();
    if(!webappId) return null;
    return runningHubEntries('app').find(app => runningHubEntryId(app, 'app') === webappId) || null;
}
function currentRunningHubWorkflowEntry(node){
    const workflowId = validRunningHubWorkflowId(node?.workflowId || '');
    if(!workflowId) return null;
    return runningHubEntries('workflow').find(workflow => runningHubEntryId(workflow, 'workflow') === workflowId) || null;
}
function rhEntryFields(entry){
    return Array.isArray(entry?.fields) ? entry.fields : [];
}
function rhWorkflowJsonFromSources(...sources){
    for(const source of sources){
        if(source && typeof source === 'object' && Object.keys(source).length) return source;
    }
    return {};
}
function rhCurrentEntry(node){
    return rhSelectedEntryRef(node)?.entry || null;
}
function rhCurrentKind(node){
    const selected = rhSelectedEntryRef(node)?.kind;
    if(selected) return selected;
    return ['model','workflow','app'].includes(node?.rhMode) ? node.rhMode : 'app';
}
function ensureRhNodeSelection(node){
    if(!node || node.type !== 'rh') return null;
    node.rhPayment = node.rhPayment || 'free';
    const all = runningHubAllEntries();
    let ref = rhSelectedEntryRef(node);
    if(!ref && all.length) ref = all[0];
    if(ref){
        applyRhEntrySelection(node, ref);
        return ref.entry;
    }
    return null;
}
function rhEntryOptions(selected){
    const models = runningHubEntries('model');
    const apps = runningHubEntries('app');
    const workflows = runningHubEntries('workflow');
    if(!models.length && !apps.length && !workflows.length) return `<option value="">请先在 API 设置里添加 RunningHub 配置</option>`;
    const group = (kind, entries, label) => entries.length ? `
        <optgroup label="${label}">
            ${entries.map(entry => {
                const id = runningHubEntryId(entry, kind);
                const key = runningHubEntryKey(kind, id);
                return `<option value="${escapeAttr(key)}" ${String(selected || '') === key ? 'selected' : ''}>${escapeHtml(runningHubEntryLabel(entry, kind))}</option>`;
            }).join('')}
        </optgroup>
    ` : '';
    return `${group('model', models, '模型 API')}${group('app', apps, 'AI 应用')}${group('workflow', workflows, '工作流')}`;
}
function rhPaymentOptions(node){
    const provider = runningHubProvider();
    const selected = node.rhPayment === 'wallet' ? 'wallet' : 'free';
    return `
        <option value="free" ${selected === 'free' ? 'selected' : ''}>RunningHub币 Key${provider?.has_key ? '' : '（未配置）'}</option>
        <option value="wallet" ${selected === 'wallet' ? 'selected' : ''}>账户余额 Key${provider?.has_wallet_key ? '' : '（未配置）'}</option>
    `;
}
function rhUseWallet(node){
    return node?.rhPayment === 'wallet';
}
function rhUsableFields(fields){
    const list = Array.isArray(fields) ? fields : [];
    if(!list.length) return [];
    const enabled = list.filter(f => f.enabled === true);
    return enabled.length ? enabled : list;
}
function rhActiveFields(node){
    if(rhCurrentKind(node) === 'model') return [];
    const sortFields = fields => [...(fields || [])].sort((a, b) => {
        const ak = rhFieldKind(a), bk = rhFieldKind(b);
        if(ak === 'image' && bk === 'image'){
            const ao = Number(a.imageOrder) || 9999;
            const bo = Number(b.imageOrder) || 9999;
            if(ao !== bo) return ao - bo;
        }
        if(ak === 'image' && bk !== 'image') return -1;
        if(ak !== 'image' && bk === 'image') return 1;
        return String(a.nodeId || '').localeCompare(String(b.nodeId || ''), undefined, {numeric:true}) || String(a.fieldName || '').localeCompare(String(b.fieldName || ''));
    });
    if(rhCurrentKind(node) === 'workflow') {
        const workflowId = validRunningHubWorkflowId(node.workflowId || '');
        const savedEntry = currentRunningHubWorkflowEntry(node);
        if(Array.isArray(savedEntry?.fields) && savedEntry.fields.length) return sortFields(rhUsableFields(savedEntry.fields));
        const saved = workflowId ? runningHubWorkflowCache[workflowId] : null;
        if(Array.isArray(saved?.fields) && saved.fields.length) return sortFields(rhUsableFields(saved.fields));
        return sortFields(node.rhWorkflowInfo?.nodeInfoList || []);
    }
    const savedApp = currentRunningHubAppConfig(node);
    if(Array.isArray(savedApp?.fields) && savedApp.fields.length) return sortFields(rhUsableFields(savedApp.fields));
    return sortFields(node.rhAppInfo?.nodeInfoList || []);
}
function rhMediaUploadLabel(kind, index){
    const normalized = String(kind || '').toLowerCase();
    if(normalized === 'image') return `上传图片${index > 0 ? index + 1 : ''}`;
    if(normalized === 'video') return `上传视频${index > 0 ? index + 1 : ''}`;
    if(normalized === 'audio') return `上传音频${index > 0 ? index + 1 : ''}`;
    return '上传素材';
}
function rhUploadFieldKey(field){
    return rhParamKey(field?.nodeId, field?.fieldName);
}
function rhUploadNodeForField(node, field){
    const key = rhUploadFieldKey(field);
    const nodeId = String(node?.rhUploadBindings?.[key] || '').trim();
    const upload = nodeId
        ? nodes.find(item => item.id === nodeId)
        : nodes.find(item => item.type === 'image' && item.rhUploadFor?.rhNodeId === node.id && item.rhUploadFor?.fieldKey === key);
    return upload?.type === 'image' && upload.rhUploadFor?.rhNodeId === node.id ? upload : null;
}
function rhUploadNodeSource(node, field, sourcesById){
    const upload = rhUploadNodeForField(node, field);
    if(!upload) return null;
    return sourcesById.get(upload.id) || null;
}
function syncRhUploadNodes(node){
    if(!node || node.type !== 'rh') return false;
    const fields = rhActiveFields(node).filter(field => ['image','video','audio'].includes(rhFieldKind(field)));
    if(!fields.length) return false;
    node.rhUploadBindings = node.rhUploadBindings && typeof node.rhUploadBindings === 'object' ? node.rhUploadBindings : {};
    const indexes = rhFieldIndexes(fields);
    let changed = false;
    fields.forEach(field => {
        const kind = rhFieldKind(field);
        const key = rhUploadFieldKey(field);
        const index = indexes[key] || 0;
        const current = rhUploadNodeForField(node, field);
        if(current){
            if(node.rhUploadBindings[key] !== current.id){
                node.rhUploadBindings[key] = current.id;
                changed = true;
            }
            current.uploadLabel = current.uploadLabel || rhMediaUploadLabel(kind, index);
            current.mediaKind = kind;
            current.rhUploadFor = {...(current.rhUploadFor || {}), rhNodeId:node.id, fieldKey:key, kind, index};
            return;
        }
        const p = {
            x:Number(node.x || 0) - 380,
            y:Number(node.y || 0) + Math.max(0, fields.indexOf(field)) * 170,
        };
        const label = rhMediaUploadLabel(kind, index);
        const upload = {
            id:uid('rh-upload'),
            type:'image',
            x:p.x,
            y:p.y,
            url:'',
            name:label,
            mediaKind:kind,
            uploadLabel:label,
            rhUploadFor:{rhNodeId:node.id, fieldKey:key, fieldName:String(field.fieldName || ''), kind, index}
        };
        nodes.push(upload);
        node.rhUploadBindings[key] = upload.id;
        if(canConnect(upload.id, node.id) && !connections.some(c => c.from === upload.id && c.to === node.id)){
            connections.push({id:uid('c'), from:upload.id, to:node.id});
        }
        changed = true;
    });
    Object.keys(node.rhUploadBindings).forEach(key => {
        const field = fields.find(item => rhUploadFieldKey(item) === key);
        const upload = field ? rhUploadNodeForField(node, field) : null;
        if(!field || !upload) {
            delete node.rhUploadBindings[key];
            changed = true;
        }
    });
    if(changed) scheduleSave();
    return changed;
}
function currentRunningHubWorkflowConfig(node){
    if(rhCurrentKind(node) !== 'workflow') return null;
    const workflowId = validRunningHubWorkflowId(node.workflowId || '');
    const entry = currentRunningHubWorkflowEntry(node);
    if(entry){
        const cached = workflowId ? runningHubWorkflowCache[workflowId] : null;
        return {
            ...entry,
            ...(cached || {}),
            workflowId:runningHubEntryId(entry, 'workflow') || workflowId,
            title:entry.title || cached?.title || workflowId,
            fields:rhEntryFields(entry).length ? rhEntryFields(entry) : (cached?.fields || []),
            optionalImageMode:entry.optionalImageMode || cached?.optionalImageMode || 'prune-workflow',
            workflowJson:rhWorkflowJsonFromSources(cached?.workflowJson, entry.workflowJson, entry.raw?.workflowJson, entry.raw?.prompt)
        };
    }
    return workflowId ? runningHubWorkflowCache[workflowId] : null;
}
async function ensureRunningHubWorkflowConfigForNode(node){
    if(rhCurrentKind(node) !== 'workflow') return null;
    const workflowId = validRunningHubWorkflowId(node.workflowId || '');
    if(!workflowId) return null;
    if(!runningHubWorkflowCache[workflowId]){
        try { await ensureRunningHubWorkflow(workflowId); } catch(_) {}
    }
    return currentRunningHubWorkflowConfig(node);
}
function rhMediaSources(node){
    const sources = orderedSources(node, generatorSources(node));
    const allRefs = sources.flatMap(src => src.refs || []).filter(ref => ref?.url);
    const fields = rhActiveFields(node).filter(field => ['image','video','audio'].includes(rhFieldKind(field)));
    const mapped = {image:[], video:[], audio:[]};
    if(fields.length){
        const indexes = rhFieldIndexes(fields);
        const sourcesById = new Map(sources.map(source => [String(source.id || ''), source]));
        const byKind = {image:[], video:[], audio:[]};
        const boundUploadIds = new Set(Object.values(node?.rhUploadBindings || {}).map(String));
        sources.filter(source => !boundUploadIds.has(String(source.id || ''))).forEach(source => (source.refs || []).forEach(ref => {
            const kind = mediaKindForRef(ref);
            if(byKind[kind]) byKind[kind].push({source, ref});
        }));
        fields.forEach(field => {
            const kind = rhFieldKind(field);
            const key = rhUploadFieldKey(field);
            const index = indexes[key] || 0;
            const explicit = rhUploadNodeSource(node, field, sourcesById);
            const explicitRef = explicit?.refs?.find(ref => mediaKindForRef(ref) === kind);
            const candidate = explicitRef || byKind[kind]?.[index]?.ref;
            if(candidate?.url) mapped[kind][index] = candidate;
        });
    } else {
        allRefs.forEach(ref => {
            const kind = mediaKindForRef(ref);
            if(mapped[kind]) mapped[kind].push(ref);
        });
    }
    const refs = [...mapped.image, ...mapped.video, ...mapped.audio, ...allRefs]
        .filter(ref => ref?.url)
        .filter((ref, index, list) => list.findIndex(item => item.url === ref.url) === index);
    return {
        sources,
        refs,
        image:mapped.image,
        video:mapped.video,
        audio:mapped.audio,
        prompt:sources.map(src => src.prompt).filter(Boolean).join('\n\n')
    };
}
function rhFieldIndexes(fields){
    const counters = {image:0, video:0, audio:0};
    const map = {};
    const ordered = [...(fields || [])].sort((a, b) => {
        const ak = rhFieldKind(a), bk = rhFieldKind(b);
        if(ak === 'image' && bk === 'image'){
            return (Number(a.imageOrder) || 9999) - (Number(b.imageOrder) || 9999);
        }
        return 0;
    });
    ordered.forEach(field => {
        const kind = rhFieldKind(field);
        if(['image','video','audio'].includes(kind)){
            map[rhParamKey(field.nodeId, field.fieldName)] = counters[kind]++;
        }
    });
    return map;
}
function rhFieldValue(node, field, media=null){
    node.rhParams = node.rhParams || {};
    const key = rhParamKey(field.nodeId, field.fieldName);
    const kind = rhFieldKind(field);
    const param = node.rhParams[key];
    if(['image','video','audio'].includes(kind)){
        const idx = rhFieldIndexes(rhActiveFields(node))[key] || 0;
        const up = (media || rhMediaSources(node))[kind]?.[idx]?.url || '';
        if(rhCurrentKind(node) === 'workflow' && kind === 'image' && field.required !== true && !up && param?.sourceFromUpstream !== false) return '';
        if(param?.sourceFromUpstream === false) return param.value ?? rhDefaultValue(field);
        return up || param?.value || rhDefaultValue(field);
    }
    if(rhRandomEnabled(field) && rhRandomActive(node, key)){
        node.rhRandomValues = node.rhRandomValues || {};
        if(node.rhRandomValues[key] === undefined){
            node.rhRandomValues[key] = comfyRandomValue({
                input:field.fieldName,
                name:field.label || field.fieldName,
                min:field.min,
                max:field.max,
                step:field.step,
                type:'number'
            });
        }
        return node.rhRandomValues[key];
    }
    if(rhFieldRole(field) === 'prompt'){
        const upstreamPrompt = (media || rhMediaSources(node)).prompt || '';
        return param?.value ?? (upstreamPrompt || rhDefaultValue(field));
    }
    return param?.value ?? rhDefaultValue(field);
}
function rhRequiredLabel(field){
    return field?.label || field?.fieldName || `#${field?.nodeId || ''}`;
}
function rhPruneWorkflowForMissingFields(workflowJson, missingFields){
    if(!workflowJson || typeof workflowJson !== 'object' || !missingFields?.length) return null;
    const workflow = JSON.parse(JSON.stringify(workflowJson));
    const removeIds = new Set();
    missingFields.forEach(field => {
        const node = workflow[String(field.nodeId)];
        if(node?.inputs && Object.prototype.hasOwnProperty.call(node.inputs, field.fieldName)){
            delete node.inputs[field.fieldName];
        }
        if(node && rhWorkflowNodeInfoList({[field.nodeId]: node}).length <= 0){
            removeIds.add(String(field.nodeId));
        }
    });
    removeIds.forEach(id => delete workflow[id]);
    Object.values(workflow).forEach(node => {
        if(!node?.inputs || typeof node.inputs !== 'object') return;
        Object.entries(node.inputs).forEach(([name, value]) => {
            if(rhIsWorkflowLinkValue(value) && removeIds.has(String(value[0]))) delete node.inputs[name];
        });
    });
    return workflow;
}
async function rhBuildWorkflowRequestExtras(node, media, nodeInfoList){
    const config = await ensureRunningHubWorkflowConfigForNode(node);
    if(!config || (config.optionalImageMode || 'prune-workflow') !== 'prune-workflow') return {};
    const fields = rhActiveFields(node);
    const indexes = rhFieldIndexes(fields);
    const missingOptional = [];
    for(const field of fields){
        const kind = rhFieldKind(field);
        if(!['image','video','audio'].includes(kind)) continue;
        const key = rhParamKey(field.nodeId, field.fieldName);
        const idx = indexes[key] || 0;
        const hasInput = Boolean(media[kind]?.[idx]?.url);
        if(field.required === true && !hasInput){
            throw new Error(`RunningHub 工作流缺少必选素材：${rhRequiredLabel(field)}`);
        }
        if(field.required !== true && !hasInput){
            missingOptional.push(field);
        }
    }
    if(!missingOptional.length) return {};
    missingOptional.forEach(field => {
        const key = rhParamKey(field.nodeId, field.fieldName);
        const idx = nodeInfoList.findIndex(item => rhParamKey(item.nodeId, item.fieldName) === key);
        if(idx >= 0) nodeInfoList.splice(idx, 1);
    });
    const workflow = rhPruneWorkflowForMissingFields(config.workflowJson || {}, missingOptional);
    return workflow ? {workflow} : {};
}
function miniMaxRunningHubEntry(node=null){
    const workflows = runningHubEntries('workflow');
    const currentId = String(node?.minimaxRunningHubWorkflowId || '').trim();
    const titleKey = CANVAS_MINIMAX_RUNNINGHUB_WORKFLOW_TITLE.toLowerCase().replace(/\s+/g, '');
    return workflows.find(item => String(item.title || item.name || '').toLowerCase().replace(/\s+/g, '') === titleKey)
        || workflows.find(item => runningHubEntryId(item, 'workflow') === currentId)
        || workflows.find(item => runningHubEntryId(item, 'workflow') === CANVAS_MINIMAX_RUNNINGHUB_WORKFLOW_ID)
        || null;
}
function miniMaxRunningHubFieldText(field){
    return [field?.nodeId, field?.fieldName, field?.label, field?.group, field?.title, field?.description, field?.source]
        .filter(v => v !== undefined && v !== null)
        .map(String)
        .join(' ')
        .toLowerCase();
}
function miniMaxRunningHubFieldMatches(field, patterns=[], fallbackKeys=[]){
    const key = rhParamKey(field?.nodeId, field?.fieldName);
    if((fallbackKeys || []).includes(key)) return true;
    const text = miniMaxRunningHubFieldText(field);
    return (patterns || []).some(pattern => pattern.test(text));
}
function miniMaxRunningHubFullAspectField(field){
    return /widescreen|portrait|square|画面比例|比例/.test(miniMaxRunningHubFieldText(field) || '') && String(rhDefaultValue(field) || '').includes('(');
}
function miniMaxFullAspectLabel(ratio){
    const clean = miniMaxAspectValue(ratio);
    if(clean === '16:9') return '16:9 (Widescreen)';
    if(clean === '9:16') return '9:16 (Portrait)';
    if(clean === '1:1') return '1:1 (Square)';
    return clean;
}
function miniMaxRunningHubValue(field, desired){
    if(miniMaxRunningHubFullAspectField(field)) return miniMaxFullAspectLabel(desired);
    const value = String(desired ?? '');
    const options = rhExtractFieldOptions(field) || [];
    if(options.length){
        const normalized = value.replace(/\s+/g, '');
        return options.find(opt => String(opt).replace(/\s+/g, '') === normalized)
            || options.find(opt => String(opt).replace(/\s+/g, '').startsWith(normalized))
            || value;
    }
    return desired;
}
function miniMaxSetRunningHubParam(params, fields, patterns, fallbackKeys, desired){
    const field = (fields || []).find(item => miniMaxRunningHubFieldMatches(item, patterns, fallbackKeys));
    if(!field) return false;
    params[rhParamKey(field.nodeId, field.fieldName)] = {value:miniMaxRunningHubValue(field, desired)};
    return true;
}
function miniMaxCompactJson(value, limit=1800){
    try {
        const text = JSON.stringify(value);
        return text.length > limit ? `${text.slice(0, limit)}...` : text;
    } catch(e) {
        return String(value || '');
    }
}
function miniMaxDetailedError(message, details={}){
    const err = new Error(message);
    err.miniMaxDetails = details;
    return err;
}
function miniMaxRunningHubPayloadError(stage, data, fallback, extra={}){
    const detailObj = data?.detail && typeof data.detail === 'object' ? data.detail : null;
    const rawDetail = detailObj?.message || data?.detail || data?.error || data?.message || data?.failReason || data?.msg || fallback || 'RunningHub 失败';
    const detail = typeof rawDetail === 'object' ? miniMaxCompactJson(rawDetail, 1200) : String(rawDetail || '');
    const raw = detailObj?.raw || data?.raw || data?.data?.raw || data;
    const code = detailObj?.code ?? data?.code ?? data?.data?.code ?? raw?.code ?? '';
    const taskId = detailObj?.taskId || detailObj?.task_id || data?.taskId || data?.task_id || data?.data?.taskId || extra.taskId || '';
    const parts = [`RunningHub ${stage}失败`, detail].filter(Boolean);
    if(taskId) parts.push(`taskId=${taskId}`);
    if(code !== '') parts.push(`code=${code}`);
    return miniMaxDetailedError(parts.join('; '), {stage, taskId, code, raw, ...(detailObj || {}), ...extra});
}
function miniMaxReadableError(error, engine='comfyui'){
    const text = String(error?.message || error || tr('canvas.generationFailed')).trim();
    const jsonStart = text.indexOf('{');
    if(jsonStart < 0) return text;
    try {
        const payload = JSON.parse(text.slice(jsonStart));
        const parts = [];
        const mainError = payload?.error;
        if(mainError?.message) parts.push(String(mainError.message));
        if(mainError?.details && !parts.includes(String(mainError.details))) parts.push(String(mainError.details));
        Object.entries(payload?.node_errors || {}).slice(0, 3).forEach(([nodeId, nodeError]) => {
            const details = (nodeError?.errors || []).slice(0, 2).map(item => item?.details || item?.message).filter(Boolean);
            if(details.length) parts.push(`节点 ${nodeId}${nodeError?.class_type ? `（${nodeError.class_type}）` : ''}：${details.join('；')}`);
        });
        const prefix = engine === 'runninghub' ? 'RunningHub 工作流执行失败' : 'ComfyUI 拒绝了工作流';
        return parts.length ? `${prefix}：${parts.join('；')}` : text;
    } catch(e) {
        return text;
    }
}
function miniMaxLogError(error, engine='comfyui'){
    const base = miniMaxReadableError(error, engine);
    const details = error?.miniMaxDetails || {};
    const lines = [base];
    if(details.taskId && !base.includes(details.taskId)) lines.push(`taskId: ${details.taskId}`);
    if(details.code !== undefined && details.code !== null && details.code !== '') lines.push(`code: ${details.code}`);
    if(details.stage) lines.push(`stage: ${details.stage}`);
    if(details.workflowId) lines.push(`workflowId: ${details.workflowId}`);
    if(details.nodeInfoList) lines.push(`nodeInfoList: ${miniMaxCompactJson(details.nodeInfoList, 1800)}`);
    if(details.raw) lines.push(`raw: ${miniMaxCompactJson(details.raw, 4200)}`);
    return lines.filter(Boolean).join('\n');
}
function rhMediaPreviewHtml(ref, kind){
    const safe = escapeAttr(ref?.url || '');
    if(kind === 'video') return canvasVideoPreviewHtml(ref?.url || '', 256);
    if(kind === 'audio') return `<i data-lucide="file-audio" class="w-6 h-6 text-slate-400"></i>`;
    return safe && !isMissingAssetUrl(safe) ? canvasPreviewImgHtml(safe, 256) : `<i data-lucide="image" class="w-6 h-6 text-slate-400"></i>`;
}
function renderRhBody(node){
    const wrap = document.createElement('div');
    wrap.className = 'rh-body';
    node.rhParams = node.rhParams || {};
    const entry = ensureRhNodeSelection(node);
    const selectedRef = rhSelectedEntryRef(node);
    const media = rhMediaSources(node);
    const fields = rhActiveFields(node);
    const mode = selectedRef?.kind || rhCurrentKind(node);
    const selectedId = selectedRef?.id || (mode === 'workflow' ? (node.workflowId || '') : (node.webappId || ''));
    if(mode === 'workflow' && selectedId && !fields.length && !runningHubWorkflowCache[selectedId] && !runningHubWorkflowLoads[selectedId]){
        ensureRunningHubWorkflow(selectedId).then(() => {
            if(rhActiveFields(node).length) refreshNodes([node.id]);
        }).catch(() => {});
    }
    const selectedKey = selectedRef ? runningHubEntryKey(selectedRef.kind, selectedRef.id) : '';
    const entryNote = entry?.note || entry?.description || '';
    if(mode === 'model'){
        node.model = selectedRef?.id || node.rhModel || node.model || '';
        normalizeApiNodeSizeChoice(node);
    }
    wrap.innerHTML = `
        <div class="rh-top">
            <label class="field rh-webapp-field">
                <div class="setting-title">RunningHub 配置</div>
                <select class="select-lite rh-entry-select">${rhEntryOptions(selectedKey)}</select>
            </label>
            <label class="field rh-payment-field" style="${mode === 'model' ? 'display:none' : ''}">
                <div class="setting-title">Key</div>
                <select class="select-lite rh-payment-select">${rhPaymentOptions(node)}</select>
            </label>
            <label class="field rh-machine-field" style="${mode === 'model' ? 'display:none' : ''}">
                <div class="setting-title">显存</div>
                <select class="select-lite rh-machine-select">
                    <option value="" ${!node.instanceType ? 'selected' : ''}>24G</option>
                    <option value="plus" ${node.instanceType === 'plus' ? 'selected' : ''}>48G</option>
                </select>
            </label>
        </div>
        <div class="rh-prompt-list"></div>
        <div class="rh-media-section">
            <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">${tr('canvas.rhInputs')}</div>
            <div class="input-list rh-input-list"></div>
        </div>
        ${mode === 'model' ? rhModelSettingsHtml(node) : ''}
        <div class="rh-param-head">
            <span>${mode === 'model' ? '模型 API 参数' : mode === 'workflow' ? tr('canvas.rhWorkflowParams') : tr('canvas.rhParams')}</span>
            <span>${fields.length}</span>
        </div>
        <div class="rh-param-list"></div>
        <div class="gen-run-row">
            <button class="gen-btn rh-run ${node.running ? 'running' : ''}" ${node.running ? 'disabled' : ''}><i data-lucide="workflow" class="w-4 h-4"></i>${node.running ? tr('canvas.rhRunning') : tr('canvas.rhRun')}</button>
            ${cascadeBtnHtml(node)}
        </div>
        ${retryBarHtml(node)}
    `;
    const entrySelect = wrap.querySelector('.rh-entry-select');
    if(entrySelect) entrySelect.onchange = e => {
        const parsed = parseRunningHubEntryKey(e.target.value);
        const ref = parsed ? runningHubAllEntries().find(item => item.kind === parsed.kind && item.id === parsed.id) : null;
        if(ref) applyRhEntrySelection(node, ref);
        node.rhParams = {};
        node.rhRandomValues = {};
        render();
        scheduleSave();
    };
    const paymentSelect = wrap.querySelector('.rh-payment-select');
    if(paymentSelect) paymentSelect.onchange = e => {
        node.rhPayment = e.target.value === 'wallet' ? 'wallet' : 'free';
        scheduleSave();
    };
    const machineSelect = wrap.querySelector('.rh-machine-select');
    if(machineSelect) machineSelect.onchange = e => {
        node.instanceType = e.target.value === 'plus' ? 'plus' : '';
        scheduleSave();
    };
    if(mode === 'model') renderPromptPreview(wrap.querySelector('.rh-prompt-list'), media.sources.filter(src => src.prompt && !src.refs?.length));
    else renderRhPromptFields(wrap.querySelector('.rh-prompt-list'), node, fields);
    renderRhInputs(wrap.querySelector('.rh-input-list'), node, media);
    renderRhParams(wrap.querySelector('.rh-param-list'), node, fields, media);
    if(mode === 'model') bindRhModelControls(wrap, node, media);
    wrap.querySelector('.rh-run').onclick = e => { e.stopPropagation(); runCanvasGenerate(node.id); };
    bindCascadeButtons(wrap, node.id);
    refreshIcons();
    return wrap;
}
function rhModelSettingsHtml(node){
    const count = Math.max(1, Math.min(8, Number(node.count || 1)));
    return `
        <div class="gen-settings rh-model-settings">
            <div class="gen-settings-row api-size-row">
                <select class="select-lite resolution compact-select" data-rh-model-field="resolution">
                    <option value="auto">自动</option>
                    <option value="1k">1K</option>
                    <option value="2k">2K</option>
                    <option value="4k">4K</option>
                    <option value="custom">${tr('canvas.custom')}</option>
                </select>
                <select class="select-lite ratio compact-select" data-rh-model-field="ratio">
                    <option value="square">1:1</option>
                    <option value="portrait">2:3</option>
                    <option value="landscape">3:2</option>
                    <option value="portrait43">3:4</option>
                    <option value="landscape43">4:3</option>
                    <option value="story">9:16</option>
                    <option value="wide">16:9</option>
                    <option value="ultrawide">21:9</option>
                    <option value="ultratall">9:21</option>
                    <option value="source">${tr('canvas.adaptiveRatio')}</option>
                    <option value="custom">${tr('canvas.custom')}</option>
                </select>
                <select class="select-lite quality-select" data-rh-model-field="quality">
                    <option value="auto">Q auto</option>
                    <option value="low">Q low</option>
                    <option value="medium">Q med</option>
                    <option value="high">Q high</option>
                </select>
                <input class="setting-input rh-model-count-input" data-rh-model-field="count" type="number" min="1" max="8" step="1" value="${count}" style="width:64px">
            </div>
            <div class="gen-settings-row custom-ratio-row" style="display:none">
                <label class="field"><div class="setting-title">${tr('canvas.ratioWidth')}</div><input class="setting-input custom-ratio-w-input" data-rh-model-field="customRatioWidth" type="number" min="1" step="1" value="${escapeHtml(node.customRatioWidth || '')}" placeholder="4"></label>
                <label class="field"><div class="setting-title">${tr('canvas.ratioHeight')}</div><input class="setting-input custom-ratio-h-input" data-rh-model-field="customRatioHeight" type="number" min="1" step="1" value="${escapeHtml(node.customRatioHeight || '')}" placeholder="3"></label>
            </div>
            <div class="gen-settings-row custom-size-row" style="display:none">
                <label class="field"><div class="setting-title">${tr('canvas.width')}</div><input class="setting-input custom-w-input" data-rh-model-field="customWidth" type="number" min="64" step="64" value="${escapeHtml(node.customWidth || '')}" placeholder="Auto"></label>
                <label class="field"><div class="setting-title">${tr('canvas.height')}</div><input class="setting-input custom-h-input" data-rh-model-field="customHeight" type="number" min="64" step="64" value="${escapeHtml(node.customHeight || '')}" placeholder="Auto"></label>
            </div>
        </div>
    `;
}
function bindRhModelControls(wrap, node, media){
    const resolutionSelect = wrap.querySelector('[data-rh-model-field="resolution"]');
    const ratioSelect = wrap.querySelector('[data-rh-model-field="ratio"]');
    const qualitySelect = wrap.querySelector('[data-rh-model-field="quality"]');
    const countInput = wrap.querySelector('[data-rh-model-field="count"]');
    const customRatioRow = wrap.querySelector('.custom-ratio-row');
    const customSizeRow = wrap.querySelector('.custom-size-row');
    const customRatioWInput = wrap.querySelector('[data-rh-model-field="customRatioWidth"]');
    const customRatioHInput = wrap.querySelector('[data-rh-model-field="customRatioHeight"]');
    const customWInput = wrap.querySelector('[data-rh-model-field="customWidth"]');
    const customHInput = wrap.querySelector('[data-rh-model-field="customHeight"]');
    const hydrateCustomParts = () => {
        if((!node.customRatioWidth || !node.customRatioHeight) && node.customRatio) {
            const raw = String(node.customRatio || '');
            if(raw.includes(':')){
                const [w,h] = raw.split(':');
                node.customRatioWidth = node.customRatioWidth || w;
                node.customRatioHeight = node.customRatioHeight || h;
            }
        }
        if((!node.customWidth || !node.customHeight) && node.customSize) {
            const parsed = parseSizeValue(node.customSize);
            node.customWidth = node.customWidth || parsed?.width || '';
            node.customHeight = node.customHeight || parsed?.height || '';
        }
    };
    const sync = () => {
        hydrateCustomParts();
        normalizeApiNodeSizeChoice(node);
        if(resolutionSelect) resolutionSelect.value = node.resolution || defaultApiImageResolution(node.model);
        if(ratioSelect) ratioSelect.value = node.ratio || 'square';
        if(qualitySelect) qualitySelect.value = node.quality || 'auto';
        if(countInput) countInput.value = Math.max(1, Math.min(8, Number(node.count || 1)));
        if(customRatioRow) customRatioRow.style.display = node.ratio === 'custom' ? '' : 'none';
        if(customSizeRow) customSizeRow.style.display = node.resolution === 'custom' ? '' : 'none';
        if(customRatioWInput) customRatioWInput.value = node.customRatioWidth || '';
        if(customRatioHInput) customRatioHInput.value = node.customRatioHeight || '';
        if(customWInput) customWInput.value = node.customWidth || '';
        if(customHInput) customHInput.value = node.customHeight || '';
    };
    wrap.querySelectorAll('[data-rh-model-field]').forEach(control => {
        control.onmousedown = e => e.stopPropagation();
        control.onclick = e => e.stopPropagation();
        control.oninput = control.onchange = e => {
            const field = control.dataset.rhModelField;
            if(field === 'resolution'){
                node.resolution = e.target.value || defaultApiImageResolution(node.model);
                node._apiResolutionUserSet = true;
            } else if(field === 'ratio'){
                node.ratio = e.target.value || 'square';
            } else if(field === 'quality'){
                node.quality = e.target.value || 'auto';
            } else if(field === 'count'){
                node.count = Math.max(1, Math.min(8, Number(e.target.value || 1)));
            } else if(field === 'customRatioWidth' || field === 'customRatioHeight'){
                node[field] = e.target.value;
                node.customRatio = node.customRatioWidth && node.customRatioHeight ? `${node.customRatioWidth}:${node.customRatioHeight}` : '';
            } else if(field === 'customWidth' || field === 'customHeight'){
                node[field] = e.target.value;
                node.customSize = node.customWidth && node.customHeight ? `${node.customWidth}x${node.customHeight}` : '';
            }
            sync();
            scheduleSave();
        };
    });
    sync();
}
function renderRhInputs(list, node, media){
    if(!list) return;
    const fields = rhActiveFields(node).filter(field => ['image','video','audio'].includes(rhFieldKind(field)));
    const indexes = rhFieldIndexes(fields);
    const entries = fields.length
        ? fields.map(field => {
            const kind = rhFieldKind(field);
            const index = indexes[rhUploadFieldKey(field)] || 0;
            return {field, kind, index, ref:media?.[kind]?.[index] || null};
        })
        : (media.refs || []).map((ref, i) => ({ref, kind:mediaKindForRef(ref), index:i, field:null}));
    if(!entries.length){
        list.innerHTML = `<div class="text-[11px] text-gray-300 py-2">${tr('canvas.groupEmpty')}</div>`;
        return;
    }
    list.innerHTML = '';
    entries.forEach(({ref, kind, index, field}) => {
        const item = document.createElement('div');
        item.className = 'input-item rh-input-item';
        const label = rhMediaUploadLabel(kind, index);
        const fieldLabel = field?.label || field?.fieldName || '';
        item.innerHTML = `<span class="input-index">${index + 1}</span>${rhMediaPreviewHtml(ref || {}, kind)}<span class="input-label">${escapeHtml(label)}${fieldLabel ? ` → ${escapeHtml(fieldLabel)}` : ''}</span>`;
        list.appendChild(item);
    });
}
function renderRhPromptFields(container, node, fields){
    if(!container) return;
    const prompts = (fields || []).filter(field => rhFieldRole(field) === 'prompt');
    if(!prompts.length){
        container.innerHTML = '';
        return;
    }
    container.innerHTML = prompts.map(field => {
        const key = rhParamKey(field.nodeId, field.fieldName);
        const label = field.label || field.fieldName || 'Prompt';
        const value = rhFieldValue(node, field, rhMediaSources(node));
        return `<label class="field rh-prompt-field">
            <div class="setting-title">${escapeHtml(label)}</div>
            <textarea class="setting-input rh-param-input" data-rh-param="${escapeAttr(key)}" data-rh-role="prompt">${escapeHtml(value)}</textarea>
        </label>`;
    }).join('');
    bindRhParamControls(container, node);
}
function renderRhParams(container, node, fields, media){
    if(!container) return;
    const params = (fields || []).filter(field => {
        const role = rhFieldRole(field);
        return !['image','video','audio','prompt'].includes(role);
    });
    if(!params.length){
        container.innerHTML = `<div class="rh-empty">${tr('canvas.rhNoParams')}</div>`;
        return;
    }
    container.innerHTML = params.map((field, i) => {
        const key = rhParamKey(field.nodeId, field.fieldName);
        const kind = rhFieldRole(field);
        const options = rhExtractFieldOptions(field);
        const value = rhFieldValue(node, field, media);
        const label = field.label || field.fieldName || `Field ${i + 1}`;
        const valueText = String(value ?? '');
        const wide = kind === 'text' && (String(label).length > 18 || valueText.length > 28);
        return renderRhSettingField(node, field, key, kind, label, value, options, wide);
    }).join('');
    bindRhParamControls(container, node);
}
function renderRhSettingField(node, field, key, kind, label, value, options, wide=false){
    const safeLabel = escapeHtml(label);
    if(kind === 'boolean'){
        const active = String(value).toLowerCase() === 'true';
        return `<div class="gen-settings-row rh-param-row ${wide ? 'wide' : ''}">
            <button type="button" class="setting-check ${active ? 'active' : ''}" data-rh-param="${escapeAttr(key)}" data-rh-type="boolean"><span class="check-dot"></span>${safeLabel}</button>
        </div>`;
    }
    if(kind === 'slider'){
        const min = Number.isFinite(Number(field.min)) ? Number(field.min) : 0;
        const max = Number.isFinite(Number(field.max)) && Number(field.max) > min ? Number(field.max) : 1;
        const step = Number.isFinite(Number(field.step)) && Number(field.step) > 0 ? Number(field.step) : 0.01;
        const numericValue = Number.isFinite(Number(value)) ? Number(value) : min;
        return `<div class="gen-settings-row rh-param-row ${wide ? 'wide' : ''}">
            <label class="field" style="flex:1">
                <div class="setting-title" style="display:flex;justify-content:space-between"><span>${safeLabel}</span><span class="rh-param-val">${escapeHtml(numericValue)}</span></div>
                <input type="range" class="canvas-range rh-param-input" data-rh-param="${escapeAttr(key)}" data-rh-type="slider" min="${escapeAttr(min)}" max="${escapeAttr(max)}" step="${escapeAttr(step)}" value="${escapeAttr(numericValue)}">
            </label>
        </div>`;
    }
    if(options?.length){
        return `<div class="gen-settings-row rh-param-row ${wide ? 'wide' : ''}">
            <label class="field"><div class="setting-title">${safeLabel}</div><select class="select-lite rh-param-input" data-rh-param="${escapeAttr(key)}" data-rh-type="select" style="width:100%">${options.map(opt => `<option value="${escapeAttr(opt)}" ${String(value) === String(opt) ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join('')}</select></label>
        </div>`;
    }
    if(rhRandomEnabled(field)){
        const active = rhRandomActive(node, key);
        return `<div class="gen-settings-row rh-param-row ${wide ? 'wide' : ''}">
            <div class="comfy-random-field">
                <label class="field"><div class="setting-title">${safeLabel}</div><input class="setting-input rh-param-input" type="number" data-rh-param="${escapeAttr(key)}" data-rh-type="number" value="${escapeAttr(value)}" ${active ? 'disabled' : ''}></label>
                <button class="tool-btn comfy-random-btn ${active ? 'active' : ''}" type="button" data-rh-random="${escapeAttr(key)}" title="${active ? '随机已开启，点击关闭' : '随机已关闭，点击开启'}"><i data-lucide="dice-5" class="w-4 h-4"></i></button>
            </div>
        </div>`;
    }
    const inputType = kind === 'number' ? 'number' : 'text';
    return `<div class="gen-settings-row rh-param-row ${wide ? 'wide' : ''}">
        <label class="field"><div class="setting-title">${safeLabel}</div><input class="setting-input rh-param-input" type="${inputType}" data-rh-param="${escapeAttr(key)}" data-rh-type="${escapeAttr(kind)}" value="${escapeAttr(value)}"></label>
    </div>`;
}
function bindRhParamControls(container, node){
    container.querySelectorAll('button[data-rh-param]').forEach(btn => {
        btn.onmousedown = e => e.stopPropagation();
        btn.onclick = e => {
            e.stopPropagation();
            const key = btn.dataset.rhParam;
            node.rhParams = node.rhParams || {};
            const field = rhActiveFields(node).find(f => rhParamKey(f.nodeId, f.fieldName) === key);
            const cur = node.rhParams[key] || {};
            const on = String(rhFieldValue(node, field)).toLowerCase() === 'true';
            node.rhParams[key] = {...cur, value:String(!on)};
            render();
            scheduleSave();
        };
    });
    container.querySelectorAll('input[data-rh-param], select[data-rh-param], textarea[data-rh-param]').forEach(control => {
        control.onmousedown = e => e.stopPropagation();
        control.onclick = e => e.stopPropagation();
        control.oninput = control.onchange = e => {
            const key = control.dataset.rhParam;
            node.rhParams = node.rhParams || {};
            const cur = node.rhParams[key] || {};
            node.rhParams[key] = {...cur, value:e.target.value};
            const val = control.closest('.field')?.querySelector('.rh-param-val');
            if(val) val.textContent = e.target.value;
            scheduleSave();
        };
    });
    container.querySelectorAll('[data-rh-random]').forEach(btn => {
        btn.onmousedown = e => e.stopPropagation();
        btn.onclick = e => {
            e.stopPropagation();
            toggleRhRandom(node.id, btn.dataset.rhRandom);
        };
    });
}
async function rhFetchAppInfo(nodeId, showAlert=true){
    const node = nodes.find(n => n.id === nodeId);
    if(!node) return;
    if(!String(node.webappId || '').trim()){
        if(showAlert) alert(tr('canvas.rhNeedWebappId'));
        return false;
    }
    node.rhFetching = true;
    refreshNodes([node.id]);
    try {
        const res = await classicCanvasApi().getRunningHubAppInfo(node.webappId.trim());
        const data = await res.json();
        if(!res.ok || data.success === false) throw new Error(data.detail || data.error || tr('canvas.rhFailed'));
        node.rhAppInfo = data.data || {};
        node.rhParams = node.rhParams || {};
        (node.rhAppInfo.nodeInfoList || []).forEach(field => {
            const key = rhParamKey(field.nodeId, field.fieldName);
            if(!node.rhParams[key]) node.rhParams[key] = {value:rhDefaultValue(field)};
        });
        node.runStatus = '';
        node.runError = '';
        scheduleSave();
        return true;
    } catch(err) {
        if(showAlert) alert(err.message || tr('canvas.rhFailed'));
        return false;
    } finally {
        node.rhFetching = false;
        refreshNodes([node.id]);
    }
}
async function rhFetchWorkflowInfo(nodeId, showAlert=true){
    const node = nodes.find(n => n.id === nodeId);
    if(!node) return false;
    if(!String(node.workflowId || '').trim()){
        if(showAlert) alert(tr('canvas.rhNeedWorkflowId'));
        return false;
    }
    node.rhFetching = true;
    refreshNodes([node.id]);
    try {
        const saved = await ensureRunningHubWorkflow(node.workflowId.trim());
        const res = await classicCanvasApi().getRunningHubWorkflowInfo(node.workflowId.trim());
        const data = await res.json();
        if(!res.ok || data.success === false) throw new Error(data.detail || data.error || tr('canvas.rhFailed'));
        const info = data.data || {};
        const savedFields = Array.isArray(saved?.fields) ? saved.fields : [];
        const mergedFields = savedFields.length
            ? savedFields
            : Array.isArray(info.nodeInfoList) ? info.nodeInfoList : [];
        node.rhWorkflowInfo = {
            workflowId:node.workflowId.trim(),
            nodeInfoList:mergedFields,
            raw:info.raw || null
        };
        node.rhParams = node.rhParams || {};
        (node.rhWorkflowInfo.nodeInfoList || []).forEach(field => {
            const key = rhParamKey(field.nodeId, field.fieldName);
            if(!node.rhParams[key]) node.rhParams[key] = {value:rhDefaultValue(field)};
        });
        node.runStatus = '';
        node.runError = '';
        scheduleSave();
        return true;
    } catch(err) {
        if(showAlert) alert(err.message || tr('canvas.rhFailed'));
        return false;
    } finally {
        node.rhFetching = false;
        refreshNodes([node.id]);
    }
}
async function rhImportWorkflowJson(nodeId, file){
    const node = nodes.find(n => n.id === nodeId);
    if(!node || !file) return;
    try {
        const text = await file.text();
        const json = JSON.parse(text);
        const nodeInfoList = rhWorkflowNodeInfoList(json);
        if(!nodeInfoList.length) throw new Error(tr('canvas.rhWorkflowJsonInvalid'));
        node.rhMode = 'workflow';
        node.rhWorkflowInfo = {fileName:file.name || 'api.json', nodeInfoList};
        node.rhParams = node.rhParams || {};
        nodeInfoList.forEach(field => {
            const key = rhParamKey(field.nodeId, field.fieldName);
            if(!node.rhParams[key]) node.rhParams[key] = {value:rhDefaultValue(field)};
        });
        node.runStatus = '';
        node.runError = '';
        render();
        scheduleSave();
    } catch(err) {
        alert(err.message || tr('canvas.rhWorkflowJsonInvalid'));
    }
}
async function rhUploadValueIfNeeded(value, node=null){
    const text = String(value || '').trim();
    if(!text) return '';
    if(!/^https?:\/\//i.test(text) && !text.startsWith('/output/') && !text.startsWith('/assets/')) return text;
    const res = await classicCanvasApi().uploadRunningHubAsset({url:text, useWallet:rhUseWallet(node)});
    const data = await res.json();
    if(!res.ok || data.success === false) throw new Error(data.detail || data.error || tr('canvas.rhUploadFailed'));
    return data.data?.fileName || text;
}
async function rhBuildNodeInfoList(node, media){
    const fields = rhActiveFields(node);
    const result = [];
    const indexes = rhFieldIndexes(fields);
    for(const field of fields){
        const kind = rhFieldKind(field);
        const key = rhParamKey(field.nodeId, field.fieldName);
        if(rhCurrentKind(node) === 'workflow' && field.sourceFromUpstream === false && !['image','video','audio'].includes(kind)) continue;
        if(rhCurrentKind(node) === 'workflow' && ['image','video','audio'].includes(kind)){
            const idx = indexes[key] || 0;
            const hasInput = Boolean(media[kind]?.[idx]?.url);
            if(field.required === true && !hasInput) throw new Error(`RunningHub 工作流缺少必选素材：${rhRequiredLabel(field)}`);
            if(field.required !== true && !hasInput) continue;
        }
        let value = rhFieldValue(node, field, media);
        if(['image','video','audio'].includes(kind)) value = await rhUploadValueIfNeeded(value, node);
        if(['number','slider'].includes(kind) && String(value ?? '').trim() !== '' && !Number.isNaN(Number(value))) value = Number(value);
        result.push({nodeId:field.nodeId, fieldName:field.fieldName, fieldValue:value});
    }
    return result;
}
function rhInputBindingSnapshot(fields, nodeInfoList, media){
    const indexes = rhFieldIndexes(fields);
    const submitted = new Map((nodeInfoList || []).map(item => [rhParamKey(item.nodeId, item.fieldName), item]));
    const displayName = (value, fallback='') => {
        const text = String(value || '').trim();
        if(!text) return fallback;
        return text.split(/[\\/]/).pop().split('?')[0].slice(0, 160);
    };
    return (fields || []).filter(field => ['image','video','audio'].includes(rhFieldKind(field))).map(field => {
        const key = rhParamKey(field.nodeId, field.fieldName);
        const kind = rhFieldKind(field);
        const index = indexes[key] || 0;
        const source = media?.[kind]?.[index] || {};
        const item = submitted.get(key) || {};
        const submittedValue = displayName(item.fieldValue);
        return {
            inputIndex:index + 1,
            kind,
            nodeId:String(field.nodeId || ''),
            fieldName:String(field.fieldName || ''),
            sourceName:displayName(source.name || source.filename || source.fileName, `图${index + 1}`),
            submittedFileName:submittedValue,
            hasValue:Boolean(String(item.fieldValue ?? '').trim())
        };
    });
}
async function runRhNode(nodeId, opts={}){
    const node = nodes.find(n => n.id === nodeId);
    if(!node || (node.running && !opts.cascade)) return;
    const cascadeTargetId = cascadeTargetIdFromOptions(opts);
    ensureRhNodeSelection(node);
    const mode = rhCurrentKind(node);
    if(mode === 'model') return runRhModelNode(node, opts);
    node.rhRandomValues = {};
    if(mode === 'workflow' && !String(node.workflowId || '').trim()){ alert(tr('canvas.rhNeedWorkflowId')); return; }
    if(mode === 'app' && !String(node.webappId || '').trim()){ alert(tr('canvas.rhNeedWebappId')); return; }
    const selectedEntry = rhCurrentEntry(node);
    if(!selectedEntry){
        alert(mode === 'workflow' ? '请先在 API 设置里添加 RunningHub 工作流' : '请先在 API 设置里添加 RunningHub 应用');
        return;
    }
    if(mode === 'workflow') await ensureRunningHubWorkflowConfigForNode(node);
    if(!rhActiveFields(node).length){
        alert(mode === 'workflow' ? '请先在 API 设置里编辑并保存这个 RunningHub 工作流参数' : '请先在 API 设置里编辑并保存这个 RunningHub 应用参数');
        return;
    }
    const media = rhMediaSources(node);
    let out = outputForNode(node, 500);
    const pendingId = uid('p');
    const run = runSnapshot(node, media.prompt || 'RunningHub', media.refs);
    run.taskLabel = 'RunningHub';
    if(out) out._pending = [...(out._pending || []), makePendingForRun(pendingId, run, node, {refs:media.refs, cascadeTargetId})];
    if(!opts.cascade) node.running = true;
    refreshRunNodes(node, out);
    try {
        const nodeInfoList = await rhBuildNodeInfoList(node, media);
        const workflowExtras = mode === 'workflow' ? await rhBuildWorkflowRequestExtras(node, media, nodeInfoList) : {};
        const inputBindings = rhInputBindingSnapshot(rhActiveFields(node), nodeInfoList, media);
        run.request = {input_bindings:inputBindings};
        const productionContext = canvasImageTaskProductionContext();
        const inputAssetIds = canvasInputAssetIds(media.refs);
        const body = mode === 'workflow'
            ? {workflowId:node.workflowId.trim(), nodeInfoList, useWallet:rhUseWallet(node), ...workflowExtras, input_asset_ids:inputAssetIds, production_context:productionContext}
            : {webappId:node.webappId.trim(), nodeInfoList, instanceType:node.instanceType || '', useWallet:rhUseWallet(node), input_asset_ids:inputAssetIds, production_context:productionContext};
        const submit = await cascadeRequest(signal => (
            mode === 'workflow'
                ? classicCanvasApi().submitRunningHubWorkflow(body, signal ? {signal} : {})
                : classicCanvasApi().submitRunningHubApp(body, signal ? {signal} : {})
        ), {cascadeTargetId}).then(async r => {
            const data = await r.json();
            if(!r.ok || data.success === false) throw new Error(data.detail || data.error || tr('canvas.rhFailed'));
            return data.data || data;
        });
        const taskId = submit.taskId;
        if(!taskId) throw new Error(tr('canvas.rhNoTaskId'));
        const jobId = String(submit.job_id || '').trim();
        const useWallet = rhUseWallet(node);
        run.request = {input_bindings:inputBindings, task_id:taskId, ...(jobId ? {job_id:jobId} : {}), webappId:node.webappId, workflowId:node.workflowId, backend:'runninghub', mode, useWallet};
        let result = null;
        for(let i = 0; i < 720; i++){
            if(cascadeTargetId) ensureCascadeActive(cascadeTargetId);
            await sleep(2500);
            const data = await cascadeRequest(signal => classicCanvasApi().getRunningHubTask(taskId, useWallet, {
                jobId,
                ...(signal ? {signal} : {}),
            }), {cascadeTargetId}).then(async r => {
                const json = await r.json();
                if(!r.ok || json.success === false) throw new Error(json.detail || json.error || tr('canvas.rhFailed'));
                return json.data || json;
            });
            if(data.status === 'SUCCESS'){
                result = data;
                break;
            }
            if(data.status === 'FAILED') throw new Error(data.failReason || tr('canvas.rhFailed'));
        }
        if(!result) throw new Error(tr('canvas.rhTimeout'));
        const outputs = resultMediaUrls(result);
        if(!outputs.length) throw new Error(tr('canvas.rhOutputsEmpty'));
        const meta = collectRunMeta(out, pendingId);
        if(out) out._pending = (out._pending || []).filter(p => p.id !== pendingId);
        appendOutputImages(out, outputs, media.refs[0], [meta]);
        mergeGeneratedOutputs(node, outputs, Boolean(opts.cascade));
        addGenerationLog({run, outputs, runMs:meta.runMs || 0});
        node.runStatus = 'done';
        node.runError = '';
        refreshRunNodes(node, out);
        scheduleSave();
    } catch(err) {
        const meta = collectRunMeta(out, pendingId);
        addGenerationLog({run, outputs:[], runMs:meta.runMs || 0, error:err.message || String(err)});
        if(out) out._pending = (out._pending || []).filter(p => p.id !== pendingId);
        if(isCascadeAbortError(err)){
            if(opts.cascade) throw err;
            return;
        }
        node.runStatus = 'failed';
        node.runError = err.message || String(err);
        refreshRunNodes(node, out);
        if(opts.cascade) throw err;
        alert(err.message || tr('canvas.rhFailed'));
    } finally {
        node.running = false;
        refreshRunNodes(node, out);
    }
}
async function runRhModelNode(node, opts={}){
    if(!node || (node.running && !opts.cascade)) return;
    const cascadeTargetId = cascadeTargetIdFromOptions(opts);
    const selectedRef = rhSelectedEntryRef(node);
    const model = selectedRef?.id || node.rhModel || node.model || '';
    if(!model){
        alert('请先在 API 设置里添加 RunningHub 模型 API');
        return;
    }
    node.rhModel = model;
    node.model = model;
    node.apiProvider = 'runninghub';
    const media = rhMediaSources(node);
    const prompt = media.prompt || '';
    const refs = imageRefsOnly(media.refs || []);
    if(!prompt && !refs.length){ alert(tr('canvas.needPromptOrImage')); return; }
    const count = Math.max(1, Math.min(8, Number(node.count || 1)));
    let out = outputForNode(node, 500);
    const run = runSnapshot(node, prompt || 'Edit the reference images.', refs);
    run.taskLabel = 'RunningHub';
    const payload = {
        prompt:prompt || 'Edit the reference images.',
        provider_id:'runninghub',
        model,
        size:await generatorSizeForRun(node, refs),
        reference_images:refs.slice(0, CANVAS_REFERENCE_IMAGE_MAX),
        input_asset_ids:canvasInputAssetIds(refs)
    };
    const quality = normalizedImageQuality(node.quality);
    if(quality) payload.quality = quality;
    let pendingIds = [];
    const startedAt = nowMs();
    if(!opts.cascade){
        node.running = true;
        refreshRunNodes(node, out);
        setTimeout(() => { node.running = false; refreshRunNodes(node, out); }, 2000);
    }
    try {
        const taskInfos = await Promise.all(Array.from({length:count}, () => createCanvasImageTask(payload, {cascadeTargetId})));
        if(!out){
            let outputs = [];
            for(const task of taskInfos){
                const result = await waitCanvasImageTaskResult(task.task_id, {cascadeTargetId});
                outputs.push(...canvasImageResultItems(result));
                run.request = requestMetaFromResult(result);
            }
            if(!outputs.length) throw new Error(tr('canvas.generationFailed'));
            mergeGeneratedOutputs(node, outputs, Boolean(opts.cascade));
            addGenerationLog({run, outputs, runMs:nowMs() - startedAt});
            node.runStatus = 'done';
            node.runError = '';
            node.running = false;
            refreshRunNodes(node, out);
            scheduleSave();
            return;
        }
        pendingIds = taskInfos.map(() => uid('p'));
        out._pending = [
            ...(out._pending || []),
            ...taskInfos.map((task, index) => makePendingForRun(pendingIds[index], run, node, {refs, requestSize:payload.size, cascadeTargetId}, {
                canvasTaskId:task.task_id,
                canvasTaskType:'online-image',
                providerId:payload.provider_id,
                model:payload.model,
                appendGenerated:Boolean(opts.cascade)
            }))
        ];
        refreshRunNodes(node, out);
        scheduleSave();
        await saveCanvas();
        const statuses = await Promise.all(taskInfos.map(task => pollCanvasImageTask(task.task_id, {cascadeTargetId})));
        if(statuses.includes('aborted')) throw cascadeAbortError(cascadeStopMessage());
        if(statuses.includes('failed')) throw new Error(node.runError || tr('canvas.generationFailed'));
    } catch(err) {
        const remainingPending = pendingIds.map(id => pendingById(out, id)).filter(Boolean);
        const removableIds = remainingPending.filter(p => !(p.failed && p.recoverTaskId)).map(p => p.id);
        if(removableIds.length){
            const metas = collectRunMetas(out, removableIds);
            addGenerationLog({run, outputs:[], runMs:Math.max(...metas.map(m => m.runMs || 0), 0), error:err.message || String(err)});
            if(out) out._pending = (out._pending || []).filter(p => !removableIds.includes(p.id));
        }
        if(isCascadeAbortError(err)){
            node.running = false;
            refreshRunNodes(node, out);
            scheduleSave();
            if(opts.cascade) throw err;
            return;
        }
        node.runStatus = 'failed';
        node.runError = err.message || String(err);
        node.running = false;
        refreshRunNodes(node, out);
        scheduleSave();
        if(remainingPending.some(p => p.failed && p.recoverTaskId) && !removableIds.length) return;
        if(opts.cascade) throw err;
        showErrorModal(err.message || tr('canvas.generationFailed'), tr('canvas.apiFailed'));
    }
}
function renderComfySettings(container, node){
    const mode = node.mode || 'text';
    if(mode === 'text'){
        container.innerHTML = `
            <div class="gen-settings-row">
                <label class="field"><div class="setting-title">${tr('canvas.width')}</div><input class="setting-input" data-field="width" type="number" min="64" step="64" value="${Number(node.width || 1024)}"></label>
                <label class="field"><div class="setting-title">${tr('canvas.height')}</div><input class="setting-input" data-field="height" type="number" min="64" step="64" value="${Number(node.height || 1024)}"></label>
            </div>
        `;
    } else if(mode === 'enhance'){
        const strength = Number(node.enhanceStrength ?? 0.5);
        container.innerHTML = `
            <div class="gen-settings-row">
                <label class="field" style="flex:1">
                    <div class="setting-title" style="display:flex;justify-content:space-between">
                        <span>${tr('studio.enhancementStrength')}</span><span class="enhance-strength-val">${strength.toFixed(2)}</span>
                    </div>
                    <input type="range" class="canvas-range enhance-strength-slider" data-field="enhanceStrength" min="0.1" max="1.0" step="0.05" value="${strength}">
                </label>
            </div>
            <div class="gen-settings-row">
                <button type="button" class="setting-check ${node.enhanceUpscale ? 'active' : ''}" data-toggle-field="enhanceUpscale"><span class="check-dot"></span>${tr('studio.superResolution')}</button>
                <select class="select-lite ${node.enhanceUpscale ? '' : 'opacity-40 cursor-not-allowed'}" data-field="enhanceUpscaleRes" ${node.enhanceUpscale ? '' : 'disabled'}><option value="2048">2X (2048)</option><option value="4096">4X (4096)</option></select>
            </div>
        `;
        container.querySelector('[data-field="enhanceUpscaleRes"]').value = String(node.enhanceUpscaleRes || 2048);
    } else if(mode === 'edit'){
        container.innerHTML = `
            <div class="gen-settings-row">
                <button type="button" class="setting-check ${node.editUpscale ? 'active' : ''}" data-toggle-field="editUpscale"><span class="check-dot"></span>${tr('studio.superResolution')}</button>
                <select class="select-lite ${node.editUpscale ? '' : 'opacity-40 cursor-not-allowed'}" data-field="editUpscaleRes" ${node.editUpscale ? '' : 'disabled'}><option value="2048">2X (2048)</option><option value="4096">4X (4096)</option></select>
            </div>
        `;
        container.querySelector('[data-field="editUpscaleRes"]').value = String(node.editUpscaleRes || 2048);
    } else if(mode === 'custom'){
        const selected = validComfyWorkflowName(node.comfyWorkflow || comfyWorkflows[0]?.name || '');
        if(node.comfyWorkflow && node.comfyWorkflow !== selected) node.comfyWorkflow = selected;
        const data = currentComfyWorkflow(node);
        const fields = data?.config?.fields || [];
        const settingFields = fields.filter(f => comfyFieldKind(f) === 'setting');
        container.innerHTML = `
            <div class="gen-settings-row">
                <select class="select-lite comfy-workflow-select" data-field="comfyWorkflow" style="width:100%">${comfyWorkflowOptions(selected)}</select>
            </div>
            ${!selected ? `<div class="text-[11px] text-slate-400">${tr('canvas.comfyNoWorkflow')}</div>` : (!data ? `<div class="text-[11px] text-slate-400">${tr('canvas.comfyLoadingWorkflow')}</div>` : '')}
            ${data ? settingFields.map(f => renderComfyCustomField(node, f)).join('') || `<div class="text-[11px] text-slate-400">${tr('canvas.comfyNoExtraParams')}</div>` : ''}
        `;
        if(selected && !data) ensureComfyWorkflow(selected).then(() => render());
    } else {
        container.innerHTML = '';
    }
    container.querySelectorAll('[data-toggle-field]').forEach(btn => {
        btn.onmousedown = e => e.stopPropagation();
        btn.onclick = e => {
            e.stopPropagation();
            const field = btn.dataset.toggleField;
            node[field] = !node[field];
            render();
            scheduleSave();
        };
    });
    container.querySelectorAll('button[data-comfy-param]').forEach(btn => {
        btn.onmousedown = e => e.stopPropagation();
        btn.onclick = e => updateComfyField(node, btn, e);
    });
    container.querySelectorAll('button[data-comfy-random]').forEach(btn => {
        btn.onmousedown = e => e.stopPropagation();
        btn.onclick = e => {
            e.stopPropagation();
            toggleComfyRandom(node.id, btn.dataset.comfyRandom);
        };
    });
    container.querySelectorAll('input, select, textarea').forEach(input => {
        input.onmousedown = e => e.stopPropagation();
        input.onclick = e => e.stopPropagation();
        if(input.classList.contains('model-select')) return;
        input.onchange = e => updateComfyField(node, input, e);
        input.oninput = e => updateComfyField(node, input, e);
    });
}
function renderComfyCustomField(node, f){
    const value = comfyParamValue(node, f);
    const label = escapeHtml(f.name || f.input);
    if(f.type === 'boolean'){
        return `<div class="gen-settings-row">
            <button type="button" class="setting-check ${value ? 'active' : ''}" data-comfy-param="${escapeHtml(f.id)}" data-comfy-type="boolean"><span class="check-dot"></span>${label}</button>
        </div>`;
    }
    if(f.type === 'slider'){
        const min = f.min ?? 0, max = f.max ?? 10, step = f.step ?? 1;
        return `<div class="gen-settings-row">
            <label class="field" style="flex:1">
                <div class="setting-title" style="display:flex;justify-content:space-between"><span>${label}</span><span class="comfy-param-val">${escapeHtml(value)}</span></div>
                <input type="range" class="canvas-range" data-comfy-param="${escapeHtml(f.id)}" data-comfy-type="slider" min="${min}" max="${max}" step="${step}" value="${escapeHtml(value)}">
            </label>
        </div>`;
    }
    if(f.type === 'dropdown'){
        const opts = (f.options || []).map(o => `<option value="${escapeHtml(o)}" ${String(value) === String(o) ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('');
        return `<div class="gen-settings-row">
            <label class="field" style="flex:1"><div class="setting-title">${label}</div><select class="select-lite" data-comfy-param="${escapeHtml(f.id)}" data-comfy-type="dropdown" style="width:100%">${opts || '<option value="">(无选项)</option>'}</select></label>
        </div>`;
    }
    if(f.type === 'textarea'){
        return `<div class="gen-settings-row">
            <label class="field" style="flex:1"><div class="setting-title">${label}</div><textarea class="setting-input" data-comfy-param="${escapeHtml(f.id)}" data-comfy-type="textarea" style="height:66px;padding-top:8px;resize:vertical">${escapeHtml(value)}</textarea></label>
        </div>`;
    }
    const type = f.type === 'number' ? 'number' : 'text';
    if(comfyRandomEnabled(f)){
        const active = comfyRandomActive(node, f.id);
        return `<div class="gen-settings-row">
            <div class="comfy-random-field">
                <label class="field"><div class="setting-title">${label}</div><input class="setting-input" type="number" data-comfy-param="${escapeHtml(f.id)}" data-comfy-type="number" value="${escapeHtml(value)}"></label>
                <button class="tool-btn comfy-random-btn ${active ? 'active' : ''}" type="button" data-comfy-random="${escapeHtml(f.id)}" title="${active ? '随机已开启，点击关闭' : '随机已关闭，点击开启'}" aria-label="${active ? '随机已开启，点击关闭' : '随机已关闭，点击开启'}"><i data-lucide="dice-5" class="w-4 h-4"></i></button>
            </div>
        </div>`;
    }
    return `<div class="gen-settings-row">
        <label class="field" style="flex:1"><div class="setting-title">${label}</div><input class="setting-input" type="${type}" data-comfy-param="${escapeHtml(f.id)}" data-comfy-type="${escapeHtml(f.type || 'text')}" value="${escapeHtml(value)}"></label>
    </div>`;
}
function updateComfyField(node, input, event){
    event?.stopPropagation();
    const paramId = input.dataset.comfyParam;
    if(paramId){
        node.comfyParams = node.comfyParams || {};
        const field = comfyFields(node).find(f => f.id === paramId);
        const type = input.dataset.comfyType || field?.type || 'text';
        if(type === 'boolean') node.comfyParams[paramId] = !Boolean(node.comfyParams[paramId] ?? field?.default ?? false);
        else if(type === 'number' || type === 'slider') node.comfyParams[paramId] = Number(input.value) || 0;
        else node.comfyParams[paramId] = input.value;
        const val = input.closest('.field')?.querySelector('.comfy-param-val');
        if(val) val.textContent = node.comfyParams[paramId];
        if(type === 'boolean') render();
        scheduleSave();
        return;
    }
    const field = input.dataset.field;
    if(!field) return;
    if(field === 'comfyWorkflow'){
        node.comfyWorkflow = validComfyWorkflowName(input.value);
        node.comfyParams = {};
        ensureComfyWorkflow(node.comfyWorkflow).then(() => render());
        scheduleSave();
        return;
    }
    if(input.type === 'checkbox') {
        node[field] = input.checked;
        if(field === 'enhanceUpscale') render();
    }
    else if(field === 'enhanceStrength') {
        node[field] = Number(input.value) || 0.5;
        const val = input.closest('.field')?.querySelector('.enhance-strength-val');
        if(val) val.textContent = node[field].toFixed(2);
    }
    else if(['width','height','enhanceUpscaleRes','editUpscaleRes','count'].includes(field)) node[field] = Number(input.value) || 1;
    else node[field] = input.value;
    scheduleSave();
}

const CANVAS_GENERATOR_TYPES = ['generator','midjourney','msgen','comfy','ltxDirector','video','rh','minimax'];
const CANVAS_IMAGE_OUTPUT_TYPES = ['generator','midjourney','msgen','comfy','ltxDirector','rh'];
const CANVAS_MEDIA_OUTPUT_TYPES = ['generator','midjourney','msgen','comfy','ltxDirector','video','rh','minimax'];
function hasExplicitOutputConnection(nodeId){
    return connections.some(c => {
        if(c.from !== nodeId) return false;
        const to = nodes.find(n => n.id === c.to);
        return to?.type === 'output';
    });
}
function hasDownstreamGenerator(nodeId){
    return connections.some(c => {
        if(c.from !== nodeId) return false;
        const to = nodes.find(n => n.id === c.to);
        if(!to) return false;
        if(CANVAS_GENERATOR_TYPES.includes(to.type)) return true;
        if(to.type !== 'output') return false;
        return connections.some(cc => {
            if(cc.from !== to.id) return false;
            const next = nodes.find(n => n.id === cc.to);
            return next && CANVAS_GENERATOR_TYPES.includes(next.type);
        });
    });
}
function shouldCreateOutputForNode(node){
    if(!node) return false;
    if(hasExplicitOutputConnection(node.id)) return true;
    return !hasDownstreamGenerator(node.id);
}
function outputForNode(node, dx=460){
    if(!node || !shouldCreateOutputForNode(node)) return null;
    let out = connections
        .filter(c => c.from === node.id)
        .map(c => nodes.find(n => n.id === c.to))
        .find(n => n?.type === 'output');
    if(!out){
        out = {id:uid('out'), type:'output', x:node.x + dx, y:node.y, images:[]};
        nodes.push(out);
        connections.push({id:uid('c'), from:node.id, to:out.id});
    }
    return out;
}
function outputNodesForSource(nodeId){
    return connections
        .filter(c => c.from === nodeId)
        .map(c => nodes.find(n => n.id === c.to))
        .filter(n => n?.type === 'output');
}
function latestGeneratedOutputItem(node){
    return [...(node?.generatedOutputs || [])].reverse().find(item => outputUrlValue(item));
}
function outputHasUrl(out, url){
    return Boolean(url && (out?.images || []).some(item => outputUrlValue(item) === url));
}
function appendOutputImagesWithoutDuplicates(out, images, compareRef=null, metas=[], layout=null){
    const unique = (images || []).filter(item => {
        const url = outputUrlValue(item);
        return url && !outputHasUrl(out, url);
    });
    appendOutputImages(out, unique, compareRef, metas, layout);
    return unique.length;
}
function syncLatestGeneratedOutputToConnection(fromId, toId){
    const source = nodes.find(n => n.id === fromId);
    const out = nodes.find(n => n.id === toId);
    if(!source || !out || out.type !== 'output' || !CANVAS_MEDIA_OUTPUT_TYPES.includes(source.type)) return false;
    const latest = latestGeneratedOutputItem(source);
    if(!latest) return false;
    return appendOutputImagesWithoutDuplicates(out, [latest]) > 0;
}
function syncConnectedOutputsFromGenerated(node, outputs){
    if(!node || !CANVAS_MEDIA_OUTPUT_TYPES.includes(node.type)) return;
    const list = (outputs || []).filter(item => outputUrlValue(item));
    if(!list.length) return;
    outputNodesForSource(node.id).forEach(out => appendOutputImagesWithoutDuplicates(out, list));
}
function generatedImageRefs(node){
    const keepGeneratedMedia = ['rh','ltxDirector','video'].includes(node?.type);
    return (node?.generatedOutputs || [])
        .map((item, i) => {
            const url = outputUrlValue(item);
            if(!url) return null;
            const kind = mediaKindForOutputItem(item);
            return canvasRefWithAssetId({url, name:outputImageName(url) || `${node.type || 'generated'}-${i + 1}`, kind, index:i}, item);
        })
        .filter(Boolean)
        .filter(ref => keepGeneratedMedia || ref.kind === 'image')
        .map(ref => {
            const {index, ...clean} = ref;
            return clean;
        });
}
function mediaRefsFromNode(node){
    if(!node) return [];
    if(node.type === 'image' && node.url){
        const kind = mediaKindForNode(node);
        return [canvasRefWithAssetId({url:node.url, name:node.name || kind, role:node.role || '', kind}, node)];
    }
    if(node.type === 'group'){
        return (node.items || [])
            .map(id => nodes.find(x => x.id === id))
            .filter(x => x?.type === 'image' && x?.url)
            .map(item => canvasRefWithAssetId({url:item.url, name:item.name || mediaKindForNode(item), role:item.role || '', kind:mediaKindForNode(item)}, item));
    }
    if(node.type === 'output'){
        return (node.images || []).map((item, i) => {
            const url = outputUrlValue(item);
            if(!url) return null;
            const kind = mediaKindForOutputItem(item);
            return canvasRefWithAssetId({url, name:outputImageName(url) || `output-${i + 1}`, kind, nodeId:node.id, outputIndex:i}, item);
        }).filter(Boolean);
    }
    if(CANVAS_MEDIA_OUTPUT_TYPES.includes(node.type)) return generatedImageRefs(node);
    return [];
}
function generatorSources(gen){
    return connections.filter(c => c.to === gen.id).map(c => nodes.find(n => n.id === c.from)).filter(Boolean).map(n => {
        if(n.type === 'output' && (n.images||[]).length){
            // 从 output 节点取最新一张图当作 reference 给下游
            const reversed = [...n.images].map((item, index) => ({item, index})).reverse();
            const found = reversed.find(entry => outputUrlValue(entry.item));
            if(found){
                const last = outputUrlValue(found.item);
                const kind = mediaKindForOutputItem(found.item);
                const ref = canvasRefWithAssetId({url:last, name:'output.png', kind, nodeId:n.id, outputIndex:found.index}, found.item);
                return {id:n.id, type:'outputImage', label:'上游输出', preview:last, refs:[ref], prompt:''};
            }
        }
        if(CANVAS_MEDIA_OUTPUT_TYPES.includes(n.type)){
            const refs = generatedImageRefs(n);
            if(refs.length){
                return refs.map((ref, i) => ({
                    id:`${n.id}:generated:${i}:${ref.url}`,
                    type:'generatedImage',
                    label:`上游生成 ${i + 1}`,
                    preview:ref.url,
                    refs:[ref],
                    prompt:''
                }));
            }
        }
        if(n.type === 'image' && n.url) {
            const kind = mediaKindForNode(n);
            const ref = canvasRefWithAssetId({url:n.url, name:n.name || kind, role:n.role || '', kind}, n);
            return {id:n.id, type:kind, label:n.name || kind, preview:n.url, refs:[ref], prompt:''};
        }
        if(n.type === 'group') {
            const items = (n.items || []).map(id => nodes.find(x => x.id === id)).filter(Boolean);
            const sources = items.filter(x => x.type === 'image' && x.url).map(img => ({
                id:`${n.id}:${img.id}`,
                type:`group-${mediaKindForNode(img)}`,
                groupId:n.id,
                imageId:img.id,
                label:img.name || mediaKindForNode(img),
                preview:img.url,
                refs:[canvasRefWithAssetId({url:img.url, name:img.name || mediaKindForNode(img), role:img.role || '', kind:mediaKindForNode(img)}, img)],
                prompt:''
            }));
            const prompts = items.filter(x => x.type === 'prompt').map(p => p.text || '').filter(Boolean);
            if(prompts.length){
                const combined = prompts.join('\n\n');
                sources.push({
                    id:`${n.id}:prompts`,
                    type:'groupPrompt',
                    groupId:n.id,
                    label:combined.slice(0, 32),
                    refs:[],
                    prompt:combined
                });
            }
            return sources;
        }
        if(n.type === 'prompt') return {id:n.id, type:'prompt', label:(n.text || '提示词').slice(0, 32), refs:[], prompt:n.text || ''};
        if(n.type === 'loop') {
            const ctx = gen?._activeLoopCtx || loopContext || null;
            const prompt = renderLoopPrompt(n, ctx);
            const imageRefs = loopInputImageRefs(n, ctx);
            const out = [];
            if(imageRefs.length){
                const currentIndex = Math.max(1, Number(ctx?.index || n.loopStart || 1) || 1);
                imageRefs.forEach((ref, i) => {
                    out.push({
                        id:`${n.id}:image:${currentIndex + i}:${ref.url}`,
                        type:'loopImage',
                        label:trf('canvas.loopImageLabel', {n:currentIndex + i}),
                        preview:ref.url,
                        refs:[ref],
                        prompt:i === 0 && !out.length ? prompt : ''
                    });
                });
            }
            if(out.length) return out;
            return {id:n.id, type:'loop', label:`${tr('canvas.loopNode')} ${loopCount(n)}x`, refs:[], prompt};
        }
        if(n.type === 'promptGroup') {
            const prompts = (n.items || []).map(id => nodes.find(x => x.id === id)).filter(Boolean).map(p => p.text || '').filter(Boolean);
            return {id:n.id, type:'promptGroup', label:`提示词 ${prompts.length} 个`, refs:[], prompt:prompts.join('\n\n')};
        }
        if(n.type === 'llm' && (n.mode || 'node') === 'node' && n.outputText) return {id:n.id, type:'llm', label:(n.outputText || 'LLM').slice(0, 32), refs:[], prompt:n.outputText || ''};
        return null;
    }).flat().filter(Boolean);
}
function orderedSources(gen, sources){
    gen.inputs = (gen.inputs || []).filter(id => sources.some(s => s.id === id));
    sources.forEach(s => { if(!gen.inputs.includes(s.id)) gen.inputs.push(s.id); });
    return gen.inputs.map(id => sources.find(s => s.id === id)).filter(Boolean);
}
function reorderInput(gen, movedId, targetId){
    if(!movedId || movedId === targetId) return;
    const sources = generatorSources(gen);
    const imageIds = sources.filter(s => s.refs?.length).map(s => s.id);
    if(!imageIds.includes(movedId) || !imageIds.includes(targetId)) return;
    const promptIds = (gen.inputs || []).filter(id => !imageIds.includes(id));
    const ids = (gen.inputs || []).filter(id => imageIds.includes(id));
    const from = ids.indexOf(movedId), to = ids.indexOf(targetId);
    if(from < 0 || to < 0) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    gen.inputs = [...ids, ...promptIds];
    render();
    scheduleSave();
}
function syncGeneratorInputs(){
    nodes.filter(n => CANVAS_GENERATOR_TYPES.includes(n.type)).forEach(gen => {
        orderedSources(gen, generatorSources(gen));
        if(gen.type === 'ltxDirector') ltxSyncConnectedImagesToTimeline(gen);
    });
}
// 提示词节点每敲一个字都全量重建所有生成器节点的输入/预览 DOM 会卡顿。节点的 text 已即时写入
// （运行时实时读取，不受影响），生成器里的预览只需稍后同步一次即可，这里做防抖。
let generatorInputSyncTimer = 0;
function scheduleGeneratorInputSync(){
    clearTimeout(generatorInputSyncTimer);
    generatorInputSyncTimer = setTimeout(() => {
        syncGeneratorInputs();
        refreshGeneratorInputViews();
    }, 160);
}
function refreshGeneratorInputViews(){
    nodes.filter(n => CANVAS_GENERATOR_TYPES.includes(n.type)).forEach(gen => {
        const el = nodesEl.querySelector(`.node[data-id="${gen.id}"]`);
        if(!el) return;
        const sources = orderedSources(gen, generatorSources(gen));
        const imageInputs = sources
            .map(src => ({...src, refs:imageRefsOnly(src.refs || [])}))
            .filter(src => src.refs?.length);
        renderPromptPreview(el.querySelector('.prompt-list'), sources.filter(src => src.prompt && !src.refs?.length));
        if(gen.type === 'generator') renderImageInputList(el.querySelector('.input-list'), gen, imageInputs);
        if(gen.type === 'midjourney') renderImageInputList(el.querySelector('.mj-input-list'), gen, imageInputs);
        if(gen.type === 'msgen') renderImageInputList(el.querySelector('.ms-img-list'), gen, imageInputs);
        if(gen.type === 'comfy') renderComfyImages(el.querySelector('.input-list'), gen, imageInputs);
        if(gen.type === 'ltxDirector'){
            ltxSyncConnectedImagesToTimeline(gen);
            renderComfyImages(el.querySelector('.input-list'), gen, imageInputs);
        }
        if(gen.type === 'video') renderVideoImageInputs(el.querySelector('.video-img-list'), gen, imageInputs);
        if(gen.type === 'minimax'){
            miniMaxEnsureSegment(gen);
            refreshNodes([gen.id]);
            return;
        }
        if(gen.type === 'rh'){
            const media = rhMediaSources(gen);
            if(rhCurrentKind(gen) === 'model') renderPromptPreview(el.querySelector('.rh-prompt-list'), media.sources.filter(src => src.prompt && !src.refs?.length));
            else renderRhPromptFields(el.querySelector('.rh-prompt-list'), gen, rhActiveFields(gen));
            renderRhInputs(el.querySelector('.rh-input-list'), gen, media);
            renderRhParams(el.querySelector('.rh-param-list'), gen, rhActiveFields(gen), media);
        }
    });
}
async function runGenerator(genId, opts={}){
    const gen = nodes.find(n => n.id === genId);
    if(!gen || (gen.running && !opts.cascade)) return;
    const cascadeTargetId = cascadeTargetIdFromOptions(opts);
    const sources = orderedSources(gen, generatorSources(gen));
    const prompt = sources.map(s => s.prompt).filter(Boolean).join('\n\n');
    const refs = imageRefsOnly(sources.flatMap(s => s.refs || []));
    if(!prompt && !refs.length){ alert(tr('canvas.needPromptOrImage')); return; }
    const count = Math.max(1, Math.min(8, Number(gen.count || 1)));
    let out = outputForNode(gen, 460);
    const run = runSnapshot(gen, prompt || 'Edit the reference images.', refs);
    const payload = {
        prompt: prompt || 'Edit the reference images.',
        provider_id:resolveImageProviderId(gen.apiProvider || 'comfly'),
        model:resolveImageModel(gen.model),
        size:await generatorSizeForRun(gen, refs),
        aspect_ratio:gen.ratio === 'custom' ? (gen.customRatio || '') : (gen.ratio || ''),
        resolution:gen.resolution || '',
        reference_images:refs.slice(0, CANVAS_REFERENCE_IMAGE_MAX),
        input_asset_ids:canvasInputAssetIds(refs)
    };
    const quality = normalizedImageQuality(gen.quality);
    if(quality) payload.quality = quality;
    let pendingIds = [];
    const startedAt = nowMs();
    if(!opts.cascade){
        gen.running = true;
        refreshRunNodes(gen, out);
        // API 支持并发：2s 后即可再次点击，任务仍由 pending 卡片继续追踪
        setTimeout(() => { gen.running = false; refreshRunNodes(gen, out); }, 2000);
    }
    try {
        const taskInfos = await Promise.all(Array.from({length:count}, () => createCanvasImageTask(payload, {cascadeTargetId})));
        if(!out){
            let outputs = [];
            for(const task of taskInfos){
                const result = await waitCanvasImageTaskResult(task.task_id, {cascadeTargetId});
                outputs.push(...canvasImageResultItems(result));
                run.request = requestMetaFromResult(result);
            }
            if(!outputs.length) throw new Error(tr('canvas.generationFailed'));
            mergeGeneratedOutputs(gen, outputs, Boolean(opts.cascade));
            addGenerationLog({run, outputs, runMs:nowMs() - startedAt});
            gen.runStatus = 'done';
            gen.runError = '';
            gen.running = false;
            refreshRunNodes(gen, out);
            scheduleSave();
            return;
        }
        pendingIds = taskInfos.map(() => uid('p'));
        if(out) out._pending = [
            ...(out._pending || []),
            ...taskInfos.map((task, index) => makePendingForRun(pendingIds[index], run, gen, {refs, requestSize:payload.size, cascadeTargetId}, {
                canvasTaskId:task.task_id,
                canvasTaskType:'online-image',
                providerId:payload.provider_id,
                model:payload.model,
                appendGenerated:Boolean(opts.cascade)
            }))
        ];
        refreshRunNodes(gen, out);
        scheduleSave();
        await saveCanvas();
        const statuses = await Promise.all(taskInfos.map(task => pollCanvasImageTask(task.task_id, {cascadeTargetId})));
        if(statuses.includes('aborted')) throw cascadeAbortError(cascadeStopMessage());
        if(statuses.includes('failed')) throw new Error(gen.runError || tr('canvas.generationFailed'));
    } catch(err) {
        const remainingPending = pendingIds.map(id => pendingById(out, id)).filter(Boolean);
        const removableIds = remainingPending.filter(p => !(p.failed && p.recoverTaskId)).map(p => p.id);
        if(removableIds.length){
            const metas = collectRunMetas(out, removableIds);
            addGenerationLog({run, outputs:[], runMs:Math.max(...metas.map(m => m.runMs || 0), 0), error:err.message || String(err)});
            if(out) out._pending = (out._pending||[]).filter(p => !removableIds.includes(p.id));
        }
        if(isCascadeAbortError(err)){
            gen.running = false;
            refreshRunNodes(gen, out);
            scheduleSave();
            throw err;
        }
        gen.runStatus = 'failed'; gen.runError = err.message || String(err);
        gen.running = false;
        refreshRunNodes(gen, out);
        scheduleSave();
        if(remainingPending.some(p => p.failed && p.recoverTaskId) && !removableIds.length) return;
        if(opts.cascade) throw err;
        showErrorModal(err.message || tr('canvas.generationFailed'), tr('canvas.apiFailed'));
    }
}
async function midjourneyRequest(request, options={}){
    const {cascadeTargetId='', ...init} = options;
    const response = cascadeTargetId
        ? await cascadeRequest(signal => request(signal ? {...init, signal} : init), {cascadeTargetId})
        : await request(init);
    if(!response.ok) throw new Error(await responseErrorMessage(response, 'Midjourney 请求失败'));
    return response.json();
}
async function waitMidjourneyTask(providerId, taskId, options={}){
    while(true){
        const cascadeTargetId = cascadeTargetIdFromOptions(options);
        if(cascadeTargetId) ensureCascadeActive(cascadeTargetId);
        const result = await midjourneyRequest(
            init => classicCanvasApi().getMidjourneyTask(taskId, providerId, init),
            {cascadeTargetId},
        );
        if(result.status === 'succeeded') return result;
        if(result.status === 'failed') throw new Error(result.error || 'Midjourney 任务失败');
        await sleep(2200);
    }
}
async function completeMidjourneyRun(node, out, run, result, append=false){
    const outputs = result.image_items?.length ? result.image_items : (result.images || []);
    if(!outputs.length) throw new Error('Midjourney 任务没有返回图片');
    run.request = requestMetaFromResult(result);
    run.request.task_id = result.task_id || node.lastTaskId || '';
    appendOutputImages(out, outputs, run.refs?.[0], [{runMs:nowMs() - Number(run.startedAt || nowMs()), run}]);
    mergeGeneratedOutputs(node, outputs, append);
    node.runStatus = 'done'; node.runError = ''; node.running = false;
    node.lastTaskStatus = 'SUCCESS'; node.lastImageCount = outputs.length;
    addGenerationLog({run, outputs, runMs:nowMs() - Number(run.startedAt || nowMs())});
    refreshRunNodes(node, out); scheduleSave();
}
async function runMidjourneyNode(nodeId, opts={}){
    const node = nodes.find(item => item.id === nodeId);
    if(!node || (node.running && !opts.cascade)) return;
    const providerId = resolveMidjourneyProviderId(node.apiProvider || '');
    if(!providerId){ showErrorModal('请先在 API 设置中添加 APIMart 平台。', 'Midjourney'); return; }
    const sources = orderedSources(node, generatorSources(node));
    const prompt = sources.map(source => source.prompt).filter(Boolean).join('\n\n').trim();
    const refs = imageRefsOnly(sources.flatMap(source => source.refs || []));
    const mode = ['imagine','blend','edit'].includes(node.mode) ? node.mode : 'imagine';
    if(mode === 'blend' && (refs.length < 2 || refs.length > 4)){ alert('多图融合需要连接 2 到 4 张图片'); return; }
    if(mode !== 'blend' && !prompt){ alert(tr('canvas.needPrompt')); return; }
    if(mode === 'edit' && !refs.length){ alert('图片编辑需要连接至少一张图片'); return; }
    const out = outputForNode(node, 460);
    const run = runSnapshot(node, prompt, refs);
    run.taskLabel = mode === 'blend' ? 'Midjourney 多图融合' : mode === 'edit' ? 'Midjourney 图片编辑' : `Midjourney v${node.version || '6.1'}`;
    run.startedAt = nowMs(); node.lastPrompt = prompt; node.running = true; node.runStatus = 'running'; node.runError = '';
    refreshRunNodes(node, out);
    try {
        const submitted = await midjourneyRequest(
            init => classicCanvasApi().submitMidjourney({provider_id:providerId, mode, prompt, size:node.size, version:node.version, speed:node.speed, reference_images:refs.slice(0, 4)}, init),
            {cascadeTargetId:cascadeTargetIdFromOptions(opts)},
        );
        node.lastTaskId = submitted.task_id; node.lastAction = mode; node.lastTaskStatus = submitted.status || 'queued'; scheduleSave();
        const result = await waitMidjourneyTask(providerId, submitted.task_id, opts);
        await completeMidjourneyRun(node, out, run, result, Boolean(opts.cascade));
    } catch(error) {
        node.running = false; node.runStatus = 'failed'; node.runError = error.message || String(error); node.lastTaskStatus = 'FAILED';
        addGenerationLog({run, outputs:[], runMs:nowMs() - run.startedAt, error:node.runError}); refreshRunNodes(node, out); scheduleSave();
        if(opts.cascade) throw error;
        showErrorModal(node.runError, 'Midjourney');
    }
}
async function runMidjourneyAction(nodeId, action, index=0, extra={}){
    const node = nodes.find(item => item.id === nodeId);
    if(!node?.lastTaskId || node.running) return;
    const providerId = resolveMidjourneyProviderId(node.apiProvider || '');
    if(!providerId){ showErrorModal('请先在 API 设置中添加 APIMart 平台。', 'Midjourney'); return; }
    const out = outputForNode(node, 460);
    const run = runSnapshot(node, '', []); run.taskLabel = `Midjourney ${action}`; run.startedAt = nowMs(); node.running = true; node.runStatus = 'running'; refreshRunNodes(node, out);
    try {
        const submitted = await midjourneyRequest(
            init => classicCanvasApi().submitMidjourneyAction({provider_id:providerId, task_id:node.lastTaskId, action, index, speed:node.speed, prompt:node.lastPrompt || '', direction:extra.direction || '', zoom_ratio:extra.zoomRatio || null}, init),
        );
        node.lastTaskId = submitted.task_id; node.lastAction = action; node.lastTaskStatus = submitted.status || 'queued'; scheduleSave();
        if(action === 'inpaint'){
            node.mjModalTaskId = submitted.task_id; node.mjModalPrompt = node.mjModalPrompt || node.lastPrompt || ''; node.running = false; node.runStatus = ''; refreshRunNodes(node, out); scheduleSave(); return;
        }
        await completeMidjourneyRun(node, out, run, await waitMidjourneyTask(providerId, submitted.task_id), true);
    } catch(error) {
        node.running = false; node.runStatus = 'failed'; node.runError = error.message || String(error); node.lastTaskStatus = 'FAILED'; addGenerationLog({run, outputs:[], runMs:nowMs() - run.startedAt, error:node.runError}); refreshRunNodes(node, out); scheduleSave(); showErrorModal(node.runError, 'Midjourney');
    }
}
async function runMidjourneyModal(nodeId, maskRef){
    const node = nodes.find(item => item.id === nodeId);
    if(!node?.mjModalTaskId || !maskRef?.url || node.running) return;
    const providerId = resolveMidjourneyProviderId(node.apiProvider || '');
    if(!providerId){ showErrorModal('请先在 API 设置中添加 APIMart 平台。', 'Midjourney'); return; }
    const out = outputForNode(node, 460); const prompt = String(node.mjModalPrompt || node.lastPrompt || '').trim(); const run = runSnapshot(node, prompt, [maskRef]); run.taskLabel = 'Midjourney 局部重绘'; run.startedAt = nowMs(); node.running = true; node.runStatus = 'running'; refreshRunNodes(node, out);
    try {
        const submitted = await midjourneyRequest(
            init => classicCanvasApi().submitMidjourneyModal({provider_id:providerId, task_id:node.mjModalTaskId, prompt, speed:node.speed, mask_image:maskRef}, init),
        );
        node.lastTaskId = submitted.task_id; node.lastAction = 'inpaint'; node.lastTaskStatus = submitted.status || 'submitted'; node.mjModalTaskId = ''; scheduleSave(); await completeMidjourneyRun(node, out, run, await waitMidjourneyTask(providerId, submitted.task_id), true);
    } catch(error) { node.running = false; node.runStatus = 'failed'; node.runError = error.message || String(error); addGenerationLog({run, outputs:[], runMs:nowMs() - run.startedAt, error:node.runError}); refreshRunNodes(node, out); scheduleSave(); showErrorModal(node.runError, 'Midjourney'); }
}
async function runGeneratorLegacy(genId, opts={}){
    const gen = nodes.find(n => n.id === genId);
    if(!gen || (gen.running && !opts.cascade)) return;
    const sources = orderedSources(gen, generatorSources(gen));
    const prompt = sources.map(s => s.prompt).filter(Boolean).join('\n\n');
    const refs = imageRefsOnly(sources.flatMap(s => s.refs || []));
    if(!prompt && !refs.length){ alert(tr('canvas.needPromptOrImage')); return; }
    const count = Math.max(1, Math.min(8, Number(gen.count || 1)));
    let out = outputForNode(gen, 460);
    const pendingIds = Array.from({length:count}, () => uid('p'));
    const run = runSnapshot(gen, prompt || 'Edit the reference images.', refs);
    const requestSize = await generatorSizeForRun(gen, refs);
    if(out) out._pending = [...(out._pending||[]), ...pendingIds.map(id => makePendingForRun(id, run, gen, {refs, requestSize}))];
    if(!opts.cascade){
        gen.running = true;
        refreshRunNodes(gen, out);
        setTimeout(() => { gen.running = false; refreshRunNodes(gen, out); }, 2000);
    }
    else refreshRunNodes(gen, out);
    try {
        const payload = {
            prompt: prompt || 'Edit the reference images.',
            provider_id:resolveImageProviderId(gen.apiProvider || 'comfly'),
            model:resolveImageModel(gen.model),
            size:requestSize,
            reference_images:refs.slice(0, CANVAS_REFERENCE_IMAGE_MAX),
            input_asset_ids:canvasInputAssetIds(refs),
            production_context:canvasImageTaskProductionContext()
        };
        const quality = normalizedImageQuality(gen.quality);
        if(quality) payload.quality = quality;
        const results = await Promise.all(Array.from({length:count}, () => classicCanvasApi().generateOnlineImage(payload)
            .then(async r => { if(!r.ok) throw new Error(await responseErrorMessage(r, tr('canvas.generationFailed'))); return r.json(); })));
        const images = results.flatMap(canvasImageResultItems);
        const metas = collectRunMetas(out, pendingIds);
        run.request = results[0] ? requestMetaFromResult(results[0]) : {};
        if(out) out._pending = (out._pending||[]).filter(p => !pendingIds.includes(p.id));
        appendOutputImages(out, images, refs[0], metas);
        mergeGeneratedOutputs(gen, images, Boolean(opts.cascade));
        addGenerationLog({run, outputs:images, runMs:Math.max(...metas.map(m => m.runMs || 0), 0)});
        gen.runStatus = 'done'; gen.runError = '';
        refreshRunNodes(gen, out);
        scheduleSave();
    } catch(err) {
        const metas = collectRunMetas(out, pendingIds);
        addGenerationLog({run, outputs:[], runMs:Math.max(...metas.map(m => m.runMs || 0), 0), error:err.message || String(err)});
        if(out) out._pending = (out._pending||[]).filter(p => !pendingIds.includes(p.id));
        gen.runStatus = 'failed'; gen.runError = err.message || String(err);
        refreshRunNodes(gen, out);
        if(opts.cascade) throw err;
        showErrorModal(err.message || tr('canvas.generationFailed'), tr('canvas.apiFailed'));
    }
}
async function runVideoNode(nodeId, opts={}){
    const node = nodes.find(n => n.id === nodeId);
    if(!node || (node.running && !opts.cascade)) return;
    const cascadeTargetId = cascadeTargetIdFromOptions(opts);
    const sources = orderedSources(node, generatorSources(node));
    const prompt = sources.map(s => s.prompt).filter(Boolean).join('\n\n');
    const allRefs = sources.flatMap(s => s.refs || []);
    const mediaRefs = applyUploadedUrlToRefs((allRefs || []).filter(ref => ['image','video','audio'].includes(mediaKindForRef(ref))), node);
    const refs = imageRefsOnly(mediaRefs);
    const videoRefs = videoRefsOnly(mediaRefs);
    const audioRefs = audioRefsOnly(mediaRefs);
    const submittedVideoRefs = manualVideoUrlForNode(node) ? [] : videoRefs;
    const inputAssetIds = canvasInputAssetIds([...refs, ...submittedVideoRefs, ...audioRefs]);
    if(node.useFrameRoles && refs[0]) refs[0] = {...refs[0], role:'first_frame'};
    if(node.useFrameRoles && refs[1]) refs[1] = {...refs[1], role:'last_frame'};
    if(!prompt){ alert(tr('canvas.videoNeedsPrompt')); return; }
    let out = outputForNode(node, 460);
    const pendingId = uid('p');
    const run = runSnapshot(node, prompt, refs);
    if(out) out._pending = [...(out._pending || []), makePendingForRun(pendingId, run, node, {refs, cascadeTargetId})];
    if(!opts.cascade){ node.running = true; refreshRunNodes(node, out); }
    else refreshRunNodes(node, out);
    try {
        const task = await cascadeRequest(
            signal => classicCanvasApi().createVideoTask({
                prompt,
                provider_id:resolveVideoProviderId(node.apiProvider || 'comfly'),
                model:node.model || 'veo3-fast',
                duration:Number(node.duration || 5),
                aspect_ratio:node.aspectRatio || '16:9',
                resolution:node.resolution || '',
                images:refs,
                videos:manualVideoUrlForNode(node)
                    ? [manualVideoUrlForNode(node)]
                    : submittedVideoRefs.map(ref => tempShUploadedUrlForNode(node, ref.url)),
                audios:audioRefs.map(ref => ref.url).filter(Boolean),
                enhance_prompt:Boolean(node.enhancePrompt),
                enable_upsample:Boolean(node.enableUpsample),
                watermark:Boolean(node.watermark),
                camerafixed:Boolean(node.cameraFixed),
                generate_audio:Boolean(node.generateAudio),
                multimodal:Boolean(node.multimodal),
                input_asset_ids:inputAssetIds,
                production_context:canvasImageTaskProductionContext()
            }, signal ? {signal} : {}),
            {cascadeTargetId}
        ).then(async r => { if(!r.ok) throw new Error(await responseErrorMessage(r, tr('canvas.videoFailed'))); return r.json(); });
        if(!task.task_id) throw new Error(tr('canvas.videoFailed'));
        const result = await waitCanvasVideoTaskResult(task.task_id, {cascadeTargetId});
        const meta = collectRunMeta(out, pendingId);
        if(out) out._pending = (out._pending || []).filter(p => p.id !== pendingId);
        const outputUrls = resultMediaUrls(result).map(item => {
            const url = outputUrlValue(item);
            return item && typeof item === 'object' ? {...item, url, kind:item.kind || 'video'} : {url, kind:'video'};
        }).filter(item => item.url);
        if(!outputUrls.length) throw new Error(tr('canvas.videoFailed'));
        run.request = requestMetaFromResult(result);
        appendOutputImages(out, outputUrls, refs[0], [{...meta, kind:'video'}]);
        mergeGeneratedOutputs(node, outputUrls, Boolean(opts.cascade));
        addGenerationLog({run, outputs:outputUrls, runMs:meta.runMs || 0});
        node.runStatus = 'done'; node.runError = '';
        refreshRunNodes(node, out);
        scheduleSave();
    } catch(err) {
        const meta = collectRunMeta(out, pendingId);
        addGenerationLog({run, outputs:[], runMs:meta.runMs || 0, error:err.message || String(err)});
        if(out) out._pending = (out._pending || []).filter(p => p.id !== pendingId);
        if(isCascadeAbortError(err)){
            if(opts.cascade) throw err;
            return;
        }
        node.runStatus = 'failed'; node.runError = err.message || String(err);
        refreshRunNodes(node, out);
        if(opts.cascade) throw err;
        alert(err.message || tr('canvas.videoFailed'));
    } finally {
        node.running = false;
        refreshRunNodes(node, out);
    }
}
async function miniMaxDynamicParams(node, prompt, refs){
    const seg = miniMaxSelectedSegment(node);
    const duration = Math.max(1, Math.min(60, Number(seg?.duration || node.duration || 8) || 8));
    const params = {
        "136":{},
        "115":{aspect_ratio:miniMaxFullAspectLabel(seg?.aspectRatio || node.aspectRatio || '16:9'), megapixels:Number(seg?.megapixels || node.megapixels || 0.4)},
        "132":{value:duration},
        "138":{value:prompt},
        "129":{noise_seed:Math.floor(Math.random() * 4294967295)}
    };
    for(let i = 0; i < CANVAS_MINIMAX_REF_IMAGE_MAX; i++) params["136"][`ref_images.ref_image_${i}`] = null;
    for(let i = 0; i < CANVAS_MINIMAX_REF_VIDEO_MAX; i++) params["136"][`ref_videos.ref_video_${i}`] = null;
    for(let i = 0; i < CANVAS_MINIMAX_REF_AUDIO_MAX; i++) params["136"][`ref_audios.ref_audio_${i}`] = null;
    const images = imageRefsOnly(refs);
    const videos = videoRefsOnly(refs);
    const audios = audioRefsOnly(refs);
    if(images.length > CANVAS_MINIMAX_REF_IMAGE_MAX) throw new Error(`MiniMax H3 最多支持 ${CANVAS_MINIMAX_REF_IMAGE_MAX} 张参考图`);
    if(videos.length > CANVAS_MINIMAX_REF_VIDEO_MAX) throw new Error(`MiniMax H3 supports at most ${CANVAS_MINIMAX_REF_VIDEO_MAX} reference videos`);
    if(audios.length > CANVAS_MINIMAX_REF_AUDIO_MAX) throw new Error(`MiniMax H3 supports at most ${CANVAS_MINIMAX_REF_AUDIO_MAX} reference audios`);
    for(let i = 0; i < images.length; i++){
        const name = await comfyNameForRef(images[i]);
        params[String(9000 + i)] = {class_type:'LoadImage', inputs:{image:name}, _meta:{title:`MiniMax image ${i + 1}`}};
        params["136"][`ref_images.ref_image_${i}`] = [String(9000 + i), 0];
    }
    for(let i = 0; i < videos.length; i++){
        const name = await comfyNameForRef(videos[i]);
        const loadNodeId = String(9040 + i);
        const componentsNodeId = String(9050 + i);
        params[loadNodeId] = {class_type:'LoadVideo', inputs:{file:name}, _meta:{title:`MiniMax video ${i + 1}`}};
        params[componentsNodeId] = {class_type:'GetVideoComponents', inputs:{video:[loadNodeId, 0]}, _meta:{title:`MiniMax video frames ${i + 1}`}};
        params["136"][`ref_videos.ref_video_${i}`] = [componentsNodeId, 0];
    }
    for(let i = 0; i < audios.length; i++){
        const name = await comfyNameForRef(audios[i]);
        params[String(9060 + i)] = {class_type:'LoadAudio', inputs:{audio:name}, _meta:{title:`MiniMax audio ${i + 1}`}};
        params["136"][`ref_audios.ref_audio_${i}`] = [String(9060 + i), 0];
    }
    return params;
}
async function miniMaxRunningHubSettings(node){
    const entry = miniMaxRunningHubEntry(node);
    const workflowId = runningHubEntryId(entry, 'workflow');
    if(!entry || !workflowId) throw new Error(`Add ${CANVAS_MINIMAX_RUNNINGHUB_WORKFLOW_TITLE} in API settings first`);
    node.minimaxRunningHubWorkflowId = workflowId;
    node.rhPayment = node.rhPayment || 'free';
    const cached = await ensureRunningHubWorkflow(workflowId).catch(() => null);
    const fields = rhUsableFields(
        Array.isArray(entry?.fields) && entry.fields.length ? entry.fields : (cached?.fields || [])
    );
    if(!fields.length) throw new Error(`请先在 API 设置中打开「${runningHubEntryLabel(entry, 'workflow')}」，拉取并保存工作流参数`);
    const rhNode = {
        type:'rh',
        rhMode:'workflow',
        rhConfigKey:runningHubEntryKey('workflow', workflowId),
        workflowId,
        rhPayment:node.rhPayment || 'free',
        rhParams:{},
        rhWorkflowInfo:{workflowId, nodeInfoList:fields},
        rhOptionalImageMode:entry.optionalImageMode || cached?.optionalImageMode || 'prune-workflow'
    };
    return {entry, workflowId, fields, rhNode};
}
function miniMaxApplyRunningHubParams(rhNode, fields, node, prompt){
    const seg = miniMaxSelectedSegment(node);
    const params = rhNode.rhParams || {};
    miniMaxSetRunningHubParam(params, fields, [/prompt|positive|text|caption|description/i], ['138::value'], prompt);
    miniMaxSetRunningHubParam(params, fields, [/duration|seconds/i], ['132::value'], Math.max(1, Math.min(60, Number(seg?.duration || node.duration || 8) || 8)));
    miniMaxSetRunningHubParam(params, fields, [/aspect[_\s-]?ratio|\bratio\b/i], ['115::aspect_ratio'], miniMaxAspectValue(seg?.aspectRatio || node.aspectRatio || '16:9'));
    miniMaxSetRunningHubParam(params, fields, [/megapixels?/i], ['115::megapixels'], Number(seg?.megapixels || node.megapixels || 0.4));
    rhNode.rhParams = params;
}
async function miniMaxBuildRunningHubNodeInfoList(rhNode, fields, media){
    const result = [];
    const indexes = rhFieldIndexes(fields);
    for(const field of fields){
        const kind = rhFieldKind(field);
        const role = rhFieldRole(field);
        const key = rhParamKey(field.nodeId, field.fieldName);
        if(['image','video','audio'].includes(kind)){
            const idx = indexes[key] || 0;
            const hasInput = Boolean(media[kind]?.[idx]?.url);
            if(!hasInput && field.required !== true) continue;
            if(!hasInput && field.required === true) throw new Error(`RunningHub 工作流缺少必选素材：${rhRequiredLabel(field)}`);
        }
        let value = '';
        const param = rhNode.rhParams?.[key];
        if(field.sourceFromUpstream === false && !['image','video','audio'].includes(kind) && !param) continue;
        if(['image','video','audio'].includes(kind)){
            const idx = indexes[key] || 0;
            value = media[kind]?.[idx]?.url || param?.value || rhDefaultValue(field);
            value = await rhUploadValueIfNeeded(value, rhNode);
        } else if(role === 'prompt') {
            value = param?.value ?? (media.prompt || rhDefaultValue(field));
        } else {
            value = param?.value ?? rhDefaultValue(field);
        }
        if(['number','slider'].includes(kind) && String(value ?? '').trim() !== '' && !Number.isNaN(Number(value))) value = Number(value);
        result.push({nodeId:field.nodeId, fieldName:field.fieldName, fieldValue:value});
    }
    return result;
}
async function miniMaxBuildRunningHubWorkflowExtras(rhNode, fields, media, nodeInfoList){
    const config = await ensureRunningHubWorkflowConfigForNode(rhNode);
    if(!config || (config.optionalImageMode || 'prune-workflow') !== 'prune-workflow') return {};
    const indexes = rhFieldIndexes(fields);
    const missingOptional = [];
    for(const field of fields){
        const kind = rhFieldKind(field);
        if(!['image','video','audio'].includes(kind)) continue;
        const key = rhParamKey(field.nodeId, field.fieldName);
        const idx = indexes[key] || 0;
        const hasInput = Boolean(media[kind]?.[idx]?.url);
        if(field.required === true && !hasInput) throw new Error(`RunningHub 工作流缺少必选素材：${rhRequiredLabel(field)}`);
        if(field.required !== true && !hasInput) missingOptional.push(field);
    }
    if(!missingOptional.length) return {};
    missingOptional.forEach(field => {
        const key = rhParamKey(field.nodeId, field.fieldName);
        const idx = nodeInfoList.findIndex(item => rhParamKey(item.nodeId, item.fieldName) === key);
        if(idx >= 0) nodeInfoList.splice(idx, 1);
    });
    const workflow = rhPruneWorkflowForMissingFields(config.workflowJson || {}, missingOptional);
    return workflow ? {workflow} : {};
}
async function runMiniMaxRunningHub(node, media, options={}){
    const {entry, workflowId, fields, rhNode} = await miniMaxRunningHubSettings(node);
    miniMaxApplyRunningHubParams(rhNode, fields, node, media.prompt);
    const nodeInfoList = await miniMaxBuildRunningHubNodeInfoList(rhNode, fields, media);
    const workflowExtras = await miniMaxBuildRunningHubWorkflowExtras(rhNode, fields, media, nodeInfoList);
    const body = {
        workflowId,
        nodeInfoList,
        useWallet:rhUseWallet(rhNode),
        ...workflowExtras,
        input_asset_ids:canvasInputAssetIds(media.refs),
        production_context:canvasImageTaskProductionContext()
    };
    const cascadeTargetId = cascadeTargetIdFromOptions(options);
    const submit = await cascadeRequest(
        signal => classicCanvasApi().submitRunningHubWorkflow(body, signal ? {signal} : {}),
        {cascadeTargetId},
    ).then(async r => {
        const data = await r.clone().json().catch(async () => ({detail:await r.text().catch(() => '')}));
        if(!r.ok || data.success === false) throw miniMaxRunningHubPayloadError('submit', data, 'RunningHub workflow submission failed', {
            endpoint:'/api/runninghub/workflow-submit',
            workflowId,
            nodeInfoList:nodeInfoList.slice(0, 40),
            hasWorkflow:Boolean(body.workflow)
        });
        return data.data || data;
    });
    const taskId = submit.taskId;
    if(!taskId) throw new Error(tr('canvas.rhNoTaskId'));
    const jobId = String(submit.job_id || '').trim();
    for(let i = 0; i < 720; i++){
        if(cascadeTargetId) ensureCascadeActive(cascadeTargetId);
        await sleep(2500);
        const data = await cascadeRequest(
            signal => classicCanvasApi().getRunningHubTask(taskId, rhUseWallet(rhNode), {jobId, ...(signal ? {signal} : {})}),
            {cascadeTargetId},
        ).then(async r => {
            const json = await r.clone().json().catch(async () => ({detail:await r.text().catch(() => '')}));
            if(!r.ok || json.success === false) throw miniMaxRunningHubPayloadError('查询', json, 'RunningHub 查询失败', {taskId, workflowId});
            return json.data || json;
        });
        if(data.status === 'SUCCESS'){
            const outputs = resultMediaUrls(data);
            if(!outputs.length) throw new Error(tr('canvas.rhOutputsEmpty'));
            return {outputs, request:{task_id:taskId, ...(jobId ? {job_id:jobId} : {}), workflowId, workflowTitle:runningHubEntryLabel(entry, 'workflow'), backend:'runninghub', mode:'workflow', useWallet:rhUseWallet(rhNode)}};
        }
        if(data.status === 'FAILED') throw miniMaxRunningHubPayloadError('执行', data, data.failReason || 'RunningHub 执行失败', {taskId, workflowId});
    }
    throw new Error(tr('canvas.rhTimeout'));
}
async function runMiniMaxNode(nodeId, opts={}){
    const node = nodes.find(n => n.id === nodeId);
    if(!node || (node.running && !opts.cascade)) return;
    const cascadeTargetId = cascadeTargetIdFromOptions(opts);
    const sourceData = miniMaxRefsForNode(node);
    const seg = miniMaxSelectedSegment(node);
    const prompt = String(seg?.prompt || '').trim() || sourceData.prompt;
    const refs = miniMaxRefsForSegment(node, seg);
    const media = {
        sources:sourceData.sources,
        refs,
        image:imageRefsOnly(refs),
        video:videoRefsOnly(refs),
        audio:audioRefsOnly(refs),
        prompt
    };
    if(!media.prompt){
        const msg = 'MiniMax 需要连接提示词';
        if(opts.cascade) throw new Error(msg);
        alert(msg);
        return;
    }
    const engine = miniMaxEngine(node);
    let out = outputForNode(node, 500);
    const pendingId = uid('p');
    const run = runSnapshot(node, media.prompt, media.refs);
    run.taskLabel = engine === 'runninghub' ? 'MiniMax RunningHub' : 'MiniMax ComfyUI';
    if(out) out._pending = [...(out._pending || []), makePendingForRun(pendingId, run, node, {refs:media.refs, cascadeTargetId})];
    if(!opts.cascade) node.running = true;
    refreshRunNodes(node, out);
    try {
        let outputs = [];
        if(engine === 'runninghub'){
            const rhResult = await runMiniMaxRunningHub(node, media, {cascadeTargetId});
            outputs = rhResult.outputs || [];
            run.request = rhResult.request || {};
        } else {
            const params = await miniMaxDynamicParams(node, media.prompt, media.refs);
            const result = await runQueuedComfyGenerate({
                prompt:media.prompt,
                workflow_json:node.workflow || 'MiniMax_H3.json',
                params,
                type:'minimax-h3',
                client_id:CLIENT_ID,
                input_asset_ids:canvasInputAssetIds(media.refs)
            }, {cascadeTargetId});
            outputs = resultMediaUrls(result);
            run.request = requestMetaFromResult(result);
        }
        const normalized = (outputs || []).map((item, i) => {
            const url = outputUrlValue(item);
            const explicitKind = typeof item === 'object' && item.kind ? item.kind : '';
            const kind = explicitKind || 'video';
            return item && typeof item === 'object' ? {...item, url, kind} : {url, kind, name:`minimax-${i + 1}.mp4`};
        }).filter(item => item.url);
        if(!normalized.length) throw new Error('MiniMax returned no video');
        const meta = collectRunMeta(out, pendingId);
        if(out) out._pending = (out._pending || []).filter(p => p.id !== pendingId);
        appendOutputImages(out, normalized, media.refs[0], [{...meta, kind:'video'}]);
        if(seg) normalized.forEach(item => miniMaxSetSegmentResult(node, seg, item));
        mergeGeneratedOutputs(node, normalized, Boolean(opts.cascade));
        addGenerationLog({run, outputs:normalized, runMs:meta.runMs || 0});
        node.runStatus = 'done';
        node.runError = '';
        refreshRunNodes(node, out);
        scheduleSave();
    } catch(err) {
        const meta = collectRunMeta(out, pendingId);
        const readable = miniMaxReadableError(err, engine);
        addGenerationLog({run, outputs:[], runMs:meta.runMs || 0, error:miniMaxLogError(err, engine)});
        if(out) out._pending = (out._pending || []).filter(p => p.id !== pendingId);
        if(isCascadeAbortError(err)){
            if(opts.cascade) throw err;
            return;
        }
        node.runStatus = 'failed';
        node.runError = readable;
        refreshRunNodes(node, out);
        if(opts.cascade) throw err;
        showErrorModal(readable, 'MiniMax H3');
    } finally {
        node.running = false;
        refreshRunNodes(node, out);
    }
}
async function uploadCanvasUrlToComfy(url){
    const blob = await classicCanvasApi().getMedia(url).then(r => {
        if(!r.ok) throw new Error(langIsEn() ? 'Image read failed' : '图片读取失败');
        return r.blob();
    });
    const filename = (url || '').split('/').pop()?.split('?')[0] || `canvas_${Date.now()}.png`;
    const form = new FormData();
    form.append('files', blob, filename);
    const data = await classicCanvasApi().uploadComfyInput(form).then(async r => {
        if(!r.ok) throw new Error(await responseErrorMessage(r, langIsEn() ? 'Image upload to ComfyUI failed' : '图片上传到 ComfyUI 失败'));
        return r.json();
    });
    return data.files?.[0]?.comfy_name || filename;
}
async function comfyNameForRef(ref){
    if(!ref?.url){
        if(ref?.comfy_name) return ref.comfy_name;
        throw new Error(langIsEn() ? 'Missing input image' : '缺少输入图片');
    }
    const url = String(ref.url || '');
    const refreshLocal = url.startsWith('/assets/') || url.startsWith('/output/') || url.startsWith('/api/view') || url.startsWith('blob:') || url.startsWith('data:');
    if(ref.comfy_name && !refreshLocal) return ref.comfy_name;
    const name = await uploadCanvasUrlToComfy(ref.url);
    ref.comfy_name = name;
    return name;
}
async function runComfyUpscale(imageInput, resolution, options={}){
    const imageUrl = outputUrlValue(imageInput);
    if(!imageUrl) throw new Error(actionFailed('studio.superResolution', langIsEn() ? 'missing input image' : '缺少输入图片'));
    const nextInput = await uploadCanvasUrlToComfy(imageUrl);
    const upscale = await runQueuedComfyGenerate({
        workflow_json:'upscale.json',
        params:{
            "15": { image:nextInput },
            "172": { seed:Math.floor(Math.random() * 4294967295), resolution:Number(resolution || 2048) }
        },
        type:'enhance',
        client_id:CLIENT_ID,
        input_asset_ids:canvasInputAssetIds([imageInput])
    }, options);
    if(upscale.error) throw new Error(actionFailed('studio.superResolution', upscale.error));
    if(!upscale.images?.length) throw new Error(noReturnedImage('studio.superResolution'));
    return upscale.images || [];
}
function comfyResultOutputs(result){
    return resultMediaUrls(result);
}
function canvasImageResultItems(result){
    if(Array.isArray(result?.image_items) && result.image_items.length) return result.image_items;
    return Array.isArray(result?.images) ? result.images : [];
}
function resultMediaUrls(result){
    const urls = [];
    const urlKeys = ['url','assetUrl','asset_url','remoteUrl','remote_url','mediaUrl','media_url','fileUrl','file_url','path','src','uri','output','output_url','outputUrl','imageUrl','image_url','video','video_url','videoUrl','mp4_url','mp4Url','download_url','downloadUrl','preview_url','previewUrl'];
    const outputContainers = ['image_items','imageItems','media_items','mediaItems','items','outputs','output','results','result','files','videos','audios','images','urls','data','result_data','payload','content'];
    const assetMediaUrl = assetId => `/api/asset-registry/assets/${encodeURIComponent(String(assetId || '').trim())}/media`;
    const looksLikeOutputUrl = value => {
        const text = String(value || '').trim();
        return /^(https?:\/\/|data:|blob:|\/output\/|\/assets\/|\/files\/|\/api\/)/i.test(text)
            || /\.(png|jpe?g|webp|gif|bmp|avif|mp4|webm|mov|m4v|mkv|mp3|wav|m4a|aac|ogg|flac)(\?|#|$)/i.test(text);
    };
    const add = value => {
        if(!value) return;
        if(typeof value === 'string'){
            const text = value.trim();
            if(text.startsWith('{') || text.startsWith('[')){
                try { add(JSON.parse(text)); } catch(_) {}
            } else if(looksLikeOutputUrl(text)) urls.push(text);
            return;
        }
        if(Array.isArray(value)){
            value.forEach(add);
            return;
        }
        if(typeof value === 'object'){
            const url = urlKeys.map(key => value[key]).find(item => typeof item === 'string' && item.trim()) || urlKeys.map(key => value[key]).find(item => Array.isArray(item) && item.length);
            const assetId = canvasExplicitAssetId(value);
            if(assetId && !url) urls.push({url:assetMediaUrl(assetId), asset_id:assetId, kind:value.kind || value.type || value.mediaKind || ''});
            if(url){
                if(Array.isArray(url)) url.forEach(add);
                else {
                    const item = {url, kind:value.kind || value.type || value.mediaKind || '', name:value.name || value.filename || value.fileName || ''};
                    const assetId = canvasExplicitAssetId(value);
                    if(assetId) item.asset_id = assetId;
                    urls.push(item);
                }
            }
            outputContainers.forEach(key => add(value[key]));
            ['asset_ids','assetIds','output_asset_ids','outputAssetIds'].forEach(key => {
                const ids = value[key];
                (Array.isArray(ids) ? ids : [ids]).forEach(id => {
                    const cleanId = String(id || '').trim();
                    if(cleanId) urls.push({url:assetMediaUrl(cleanId), asset_id:cleanId});
                });
            });
            urlKeys.forEach(key => add(value[key]));
        }
    };
    add(result);
    const seen = new Set();
    return urls.map(item => {
        const url = outputUrlValue(item);
        if(!url) return null;
        return typeof item === 'object' ? item : url;
    }).filter(item => {
        const url = outputUrlValue(item);
        return looksLikeOutputUrl(url) && !seen.has(url) && seen.add(url);
    });
}
function ltxDirectorSyncSeconds(node){
    const fps = Math.max(1, Number(node?.frameRate) || 24);
    node.durationSeconds = Math.round((Number(node.durationFrames) || 120) / fps * 1000) / 1000;
}
function ltxParseTimeline(node){
    try {
        const t = JSON.parse(node?.ltxTimelineData || '{}');
        return {
            segments: Array.isArray(t.segments) ? t.segments : [],
            audioSegments: Array.isArray(t.audioSegments) ? t.audioSegments : []
        };
    } catch(e) {
        return {segments: [], audioSegments: []};
    }
}
function ltxRefreshTimelineEditor(node){
    if(!node?._ltxEditor || typeof window.LTXParseInitial !== 'function') return;
    node._ltxEditor.timeline = window.LTXParseInitial(node.ltxTimelineData || '{}');
    node._ltxEditor.loadImages?.();
    node._ltxEditor.commitChanges?.(true);
    node._ltxEditor.render?.();
}
function ltxSyncConnectedImagesToTimeline(node){
    if(!node || node.type !== 'ltxDirector') return;
    const hadTimeline = Boolean(node.ltxTimelineData);
    const sources = orderedSources(node, generatorSources(node));
    const imageInputs = sources.filter(src => imageRefsOnly(src.refs || []).length);
    const timeline = ltxParseTimeline(node);
    const fps = Math.max(1, Number(node.frameRate) || 24);
    const defaultLen = Math.max(6, fps);
    const manual = (timeline.segments || []).filter(s => !s.canvasSourceId);
    const existingAuto = new Map((timeline.segments || []).filter(s => s.canvasSourceId).map(s => [s.canvasSourceId, s]));
    const autoSegs = [];
    let cursor = 0;
    for(const src of imageInputs){
        const ref = imageRefsOnly(src.refs || [])[0];
        const url = ref?.url;
        if(!url) continue;
        let seg = existingAuto.get(src.id);
        if(seg){
            if(seg.imageB64 !== url){
                seg.imageB64 = url;
                seg.imageFile = null;
                delete seg.imgObj;
            }
            if(!seg.length || seg.length < 1) seg.length = defaultLen;
        } else {
            seg = {
                id:uid('ltxseg'),
                start:cursor,
                length:defaultLen,
                prompt:src.prompt || '',
                type:'image',
                imageB64:url,
                canvasSourceId:src.id,
                guideStrength:1
            };
        }
        seg.start = cursor;
        cursor += Math.max(1, Number(seg.length) || defaultLen);
        autoSegs.push(seg);
    }
    let nextStart = cursor;
    const reflowedManual = [...manual].sort((a, b) => (Number(a.start) || 0) - (Number(b.start) || 0));
    for(const seg of reflowedManual){
        seg.start = nextStart;
        nextStart += Math.max(1, Number(seg.length) || defaultLen);
    }
    const allSegs = [...autoSegs, ...reflowedManual];
    const maxEnd = allSegs.reduce((m, s) => Math.max(m, (Number(s.start) || 0) + (Number(s.length) || 0)), 0);
    if(maxEnd > (Number(node.durationFrames) || 0)){
        node.durationFrames = Math.ceil(maxEnd);
        ltxDirectorSyncSeconds(node);
    }
    const prevTimeline = node.ltxTimelineData;
    node.ltxTimelineData = JSON.stringify({segments: allSegs, audioSegments: timeline.audioSegments || []});
    ltxRefreshTimelineEditor(node);
    if(hadTimeline && node.ltxTimelineData !== prevTimeline) scheduleSave();
}
function bindLTXParamsRow(container, node){
    const row = container.querySelector('[data-ltx-params]');
    if(!row) return;
    const fps = () => Math.max(1, Number(node.frameRate) || 24);
    const bindNum = (sel, apply) => {
        const inp = row.querySelector(sel);
        if(!inp) return;
        inp.onmousedown = e => e.stopPropagation();
        inp.onclick = e => e.stopPropagation();
        inp.onchange = () => {
            apply(inp);
            ltxDirectorSyncSeconds(node);
            if(node._ltxEditor){
                node._ltxEditor.commitChanges?.(true);
                node._ltxEditor.render?.();
            }
            scheduleSave();
        };
    };
    const sec = row.querySelector('[data-ltx-duration-seconds]');
    const frames = row.querySelector('[data-ltx-duration-frames]');
    const rate = row.querySelector('[data-ltx-frame-rate]');
    const width = row.querySelector('[data-ltx-width]');
    const height = row.querySelector('[data-ltx-height]');
    if(sec) sec.value = Number(node.durationSeconds) || 5;
    if(frames) frames.value = Number(node.durationFrames) || 120;
    if(rate) rate.value = Number(node.frameRate) || 24;
    if(width) width.value = Number(node.customWidth) || 0;
    if(height) height.value = Number(node.customHeight) || 0;
    bindNum('[data-ltx-duration-seconds]', inp => {
        const v = Math.max(0.1, Math.min(1000, parseFloat(inp.value) || node.durationSeconds || 5));
        node.durationSeconds = Math.round(v * 1000) / 1000;
        node.durationFrames = Math.max(1, Math.round(node.durationSeconds * fps()));
        inp.value = node.durationSeconds;
        if(frames) frames.value = node.durationFrames;
    });
    bindNum('[data-ltx-duration-frames]', inp => {
        node.durationFrames = Math.max(1, Math.min(10000, parseInt(inp.value, 10) || 120));
        if(sec) sec.value = Math.round((node.durationFrames / fps()) * 1000) / 1000;
        inp.value = node.durationFrames;
    });
    bindNum('[data-ltx-frame-rate]', inp => {
        node.frameRate = Math.max(1, Math.min(240, parseInt(inp.value, 10) || 24));
        if(sec) sec.value = Math.round((node.durationFrames / fps()) * 1000) / 1000;
    });
    bindNum('[data-ltx-width]', inp => {
        node.customWidth = Math.max(0, Math.min(8192, parseInt(inp.value, 10) || 0));
        inp.value = node.customWidth;
    });
    bindNum('[data-ltx-height]', inp => {
        node.customHeight = Math.max(0, Math.min(8192, parseInt(inp.value, 10) || 0));
        inp.value = node.customHeight;
    });
}
function ltxFlushTimelineToNode(node){
    if(!node || node.type !== 'ltxDirector') return;
    if(node._ltxEditor && typeof node._ltxEditor.commitChanges === 'function'){
        node._ltxEditor.commitChanges(true);
    }
}
function ltxBuildContiguousRelay(node, globalPromptFallback=''){
    ltxFlushTimelineToNode(node);
    const durationFrames = Math.max(1, Number(node.durationFrames) || 120);
    const fallback = (globalPromptFallback || node.globalPrompt || '').trim() || '.';
    let sortedSegments = [];
    try {
        const t = JSON.parse(node.ltxTimelineData || '{}');
        sortedSegments = [...(t.segments || [])].sort((a, b) => (Number(a.start) || 0) - (Number(b.start) || 0));
    } catch(e) {}
    const contiguousLengths = [];
    const contiguousPrompts = [];
    let currentCursor = 0;
    let pendingGap = 0;
    for(const seg of sortedSegments){
        const start = Number(seg.start) || 0;
        const length = Math.max(1, Number(seg.length) || 1);
        if(start >= durationFrames) break;
        if(start > currentCursor){
            const gapLength = Math.min(start, durationFrames) - currentCursor;
            if(contiguousLengths.length > 0) contiguousLengths[contiguousLengths.length - 1] += gapLength;
            else pendingGap += gapLength;
        }
        const clippedEnd = Math.min(start + length, durationFrames);
        const clippedLength = clippedEnd - start;
        contiguousLengths.push(clippedLength + pendingGap);
        const prompt = (seg.prompt || '').trim();
        contiguousPrompts.push(prompt || fallback);
        if(!prompt) seg.prompt = fallback;
        pendingGap = 0;
        currentCursor = start + length;
    }
    const clampedCursor = Math.min(currentCursor, durationFrames);
    if(contiguousLengths.length > 0 && clampedCursor < durationFrames){
        contiguousLengths[contiguousLengths.length - 1] += durationFrames - clampedCursor;
    }
    if(!contiguousLengths.length){
        contiguousLengths.push(durationFrames);
        contiguousPrompts.push(fallback);
    }
    const guideStrength = sortedSegments
        .filter(s => s.type !== 'text')
        .map(s => (s.guideStrength !== undefined ? s.guideStrength : 1.0).toFixed(2))
        .join(',');
    return {
        local_prompts:contiguousPrompts.join(' | '),
        segment_lengths:contiguousLengths.join(','),
        guide_strength:guideStrength,
        sortedSegments
    };
}
async function ltxDirectorBuildTimelinePayload(node, globalPromptFallback=''){
    ltxDirectorSyncSeconds(node);
    let timeline = {segments: [], audioSegments: []};
    try { timeline = JSON.parse(node.ltxTimelineData || '{}'); } catch(e) {}
    const relay = ltxBuildContiguousRelay(node, globalPromptFallback);
    const segments = [...relay.sortedSegments];
    for(const seg of segments){
        if(seg.type === 'image' && !seg.imageFile){
            const url = seg.imageB64 || '';
            if(url){
                const fullUrl = url.startsWith('http') ? url : (location.origin + (url.startsWith('/') ? url : '/' + url));
                seg.imageFile = await uploadCanvasUrlToComfy(fullUrl);
            }
        }
        if(seg.imgObj) delete seg.imgObj;
    }
    const timelineJson = JSON.stringify({segments, audioSegments: timeline.audioSegments || []});
    node.ltxLocalPrompts = relay.local_prompts;
    node.ltxSegmentLengths = relay.segment_lengths;
    node.ltxGuideStrength = relay.guide_strength;
    node.ltxTimelineData = timelineJson;
    return {
        global_prompt:(globalPromptFallback || node.globalPrompt || '').trim(),
        duration_frames:Number(node.durationFrames) || 120,
        duration_seconds:Number(node.durationSeconds) || 5,
        timeline_data:timelineJson,
        local_prompts:relay.local_prompts,
        segment_lengths:relay.segment_lengths,
        guide_strength:relay.guide_strength,
        epsilon:Number(node.epsilon) || 0.001,
        frame_rate:Number(node.frameRate) || 24,
        use_custom_audio:Boolean(node.useCustomAudio),
        display_mode:node.displayMode || 'seconds',
        custom_width:Math.max(0, Number(node.customWidth) || 0),
        custom_height:Math.max(0, Number(node.customHeight) || 0),
        resize_method:'maintain aspect ratio',
        divisible_by:Math.max(1, Number(node.divisibleBy) || 32),
        img_compression:Number(node.imgCompression) ?? 18,
        timeline_ui:''
    };
}
function ltxDirectorTimelineSegments(node){
    ltxFlushTimelineToNode(node);
    if(node?._ltxEditor?.timeline?.segments) return node._ltxEditor.timeline.segments;
    try {
        const t = JSON.parse(node.ltxTimelineData || '{}');
        return t.segments || [];
    } catch(e) {
        return [];
    }
}
function clearStuckGeneratorRunning(node){
    if(!node || !node.running) return;
    if(cascadeRunningIds.has(node.id) || cascadeSerialIds.has(node.id)) return;
    node.running = false;
}
function resetCascadeRuntimeState(){
    cascadeRunningIds.clear();
    cascadeStopIds.clear();
    cascadeSerialIds.clear();
    cascadeContexts.forEach(ctx => clearCascadeCleanupTimer(ctx));
    cascadeContexts.clear();
    loopContext = null;
}
function cascadeContextFor(targetId){
    return targetId ? cascadeContexts.get(targetId) || null : null;
}
function isCascadeActive(targetId){
    const ctx = cascadeContextFor(targetId);
    return Boolean(ctx && (ctx.status === 'running' || ctx.status === 'stopping'));
}
function isCascadeStopping(targetId){
    return cascadeContextFor(targetId)?.status === 'stopping';
}
function cascadeAbortError(message='已停止一键运行'){
    const err = new Error(message);
    err.name = 'CascadeAbortError';
    err.isCascadeAbort = true;
    return err;
}
function isCascadeAbortError(err){
    return Boolean(err?.isCascadeAbort || err?.name === 'CascadeAbortError');
}
function cascadeStopMessage(reason=''){
    if(reason) return reason;
    return langIsEn() ? 'One-click run stopped' : '已停止一键运行';
}
function cascadeBackendRestartMessage(){
    return langIsEn() ? 'Backend restarted and task status was lost. This one-click run has been stopped.' : '后端已重启，任务状态已丢失，本次一键运行已停止';
}
function normalizeCanvasTaskError(err, fallback=''){
    const raw = err?.message || String(err || '');
    const text = String(raw || '').trim();
    if(!text) return fallback || tr('canvas.generationFailed');
    if(/backend restarted and task status was lost/i.test(text)) return cascadeBackendRestartMessage();
    if(/(404|not found|missing)/i.test(text) && /canvas-image-task/i.test(text)) return cascadeBackendRestartMessage();
    if(/Failed to fetch|NetworkError|Load failed|ERR_CONNECTION_REFUSED|ERR_CONNECTION_RESET/i.test(text)) return cascadeBackendRestartMessage();
    return text;
}
function clearCascadeNodeState(node, options={}){
    if(!node) return;
    const keepError = Boolean(options.keepError);
    if(node.runStatus) node.runStatus = '';
    if(node._cascadeIdx) node._cascadeIdx = '';
    if(!keepError){
        node.runError = '';
        node._cascadeFailed = false;
    }
}
function createCascadeContext(targetId, order, options={}){
    const ctx = {
        targetId,
        order:[...(order || [])],
        status:'running',
        startedAt:nowMs(),
        abortRequested:false,
        message:'',
        currentNodeId:'',
        currentRoundLabel:'',
        mode:options.mode || 'serial',
        cleanupTimer:null,
        controllers:new Set()
    };
    cascadeContexts.set(targetId, ctx);
    return ctx;
}
function clearCascadeCleanupTimer(ctx){
    if(!ctx?.cleanupTimer) return;
    clearTimeout(ctx.cleanupTimer);
    ctx.cleanupTimer = null;
}
function beginCascade(targetId, order, options={}){
    const existing = cascadeContextFor(targetId);
    if(existing){
        clearCascadeCleanupTimer(existing);
        cascadeContexts.delete(targetId);
    }
    const ctx = createCascadeContext(targetId, order, options);
    cascadeRunningIds.add(targetId);
    if(options.serial) cascadeSerialIds.add(targetId);
    if(options.mode) ctx.mode = options.mode;
    return ctx;
}
function queueCascadeCleanup(ctx, ids){
    if(!ctx) return;
    clearCascadeCleanupTimer(ctx);
    ctx.cleanupTimer = setTimeout(() => {
        const uniqueIds = [...new Set((ids || []).filter(Boolean))];
        uniqueIds.forEach(id => {
            const node = nodes.find(n => n.id === id);
            if(node && node.runStatus === 'done') clearCascadeNodeState(node, {keepError:false});
        });
        refreshNodes(uniqueIds);
        if(cascadeContexts.get(ctx.targetId) === ctx) cascadeContexts.delete(ctx.targetId);
        ctx.cleanupTimer = null;
    }, 3000);
}
function requestCascadeStop(targetId, reason=''){
    if(!targetId) return;
    cascadeStopIds.add(targetId);
    const ctx = cascadeContextFor(targetId);
    if(ctx){
        ctx.abortRequested = true;
        ctx.status = 'stopping';
        if(reason) ctx.message = reason;
        [...(ctx.controllers || [])].forEach(controller => {
            try { controller.abort(); } catch(_) {}
        });
    }
    refreshNodes(cascadeUiNodeIds(targetId));
}
function ensureCascadeActive(targetId, reason=''){
    const ctx = cascadeContextFor(targetId);
    if(!ctx) return null;
    if(ctx.abortRequested || ctx.status === 'stopping') throw cascadeAbortError(cascadeStopMessage(reason || ctx.message));
    return ctx;
}
function finalizeCascade(targetId, state, options={}){
    const ctx = cascadeContextFor(targetId);
    const order = options.order || ctx?.order || computeCascadeOrder(targetId);
    const uiIds = cascadeUiNodeIds(targetId, order);
    clearCascadeCleanupTimer(ctx);
    cascadeRunningIds.delete(targetId);
    cascadeStopIds.delete(targetId);
    cascadeSerialIds.delete(targetId);
    if(ctx) ctx.status = state;
    if(state === 'done'){
        queueCascadeCleanup(ctx, uiIds);
        refreshNodes(uiIds);
        return;
    }
    if(state === 'stopped'){
        (order || []).forEach(id => {
            const node = nodes.find(n => n.id === id);
            if(node && !node._cascadeFailed) clearCascadeNodeState(node);
        });
    }
    refreshNodes(uiIds);
    cascadeContexts.delete(targetId);
}
function cascadeTargetIdFromOptions(options={}){
    return String(options?.cascadeTargetId || options?.targetId || '');
}
function cascadeContextFromOptions(options={}){
    return cascadeContextFor(cascadeTargetIdFromOptions(options));
}
async function cascadeRequest(callback, options={}){
    const ctx = cascadeContextFromOptions(options);
    if(!ctx) return callback(undefined);
    ensureCascadeActive(ctx.targetId, ctx.message);
    const controller = new AbortController();
    ctx.controllers.add(controller);
    try {
        return await callback(controller.signal);
    } catch(err) {
        if(controller.signal.aborted || err?.name === 'AbortError'){
            throw cascadeAbortError(cascadeStopMessage(ctx.message));
        }
        throw err;
    } finally {
        ctx.controllers.delete(controller);
    }
}
function updateLTXNodeElementSize(node){
    const el = document.querySelector(`.node[data-id="${CSS.escape(node.id)}"]`);
    if(!el) return;
    if(node.w) el.style.width = `${node.w}px`;
    if(node.h) el.style.height = `${node.h}px`;
    refreshGeometryAfterLayout();
}
function renderLTXDirectorBody(node){
    if(typeof window.ltxMigrateLegacySegments === 'function') window.ltxMigrateLegacySegments(node);
    else if(typeof ltxMigrateLegacySegments === 'function') ltxMigrateLegacySegments(node);
    ltxDirectorSyncSeconds(node);
    if(!node.ltxTimelineData){
        const len = Math.max(1, Number(node.durationFrames) || 120);
        node.ltxTimelineData = JSON.stringify({
            segments:[{id:uid('ltxseg'), start:0, length:len, prompt:'', type:'text'}],
            audioSegments:[]
        });
    }

    const wrap = document.createElement('div');
    wrap.className = 'ltx-director-body';
    const sources = orderedSources(node, generatorSources(node));
    const promptInputs = sources.filter(src => src.prompt && !src.refs?.length);
    const imageInputs = sources
        .map(src => ({...src, refs:imageRefsOnly(src.refs || [])}))
        .filter(src => src.refs?.length);

    wrap.innerHTML = `
        <div class="prompt-list"></div>
        <div class="ltx-params-row" data-ltx-params>
            <label class="field"><span class="setting-title">${tr('canvas.ltxDurationSec')}</span><input class="setting-input" data-ltx-duration-seconds type="number" min="0.1" max="1000" step="0.01"></label>
            <label class="field"><span class="setting-title">${tr('canvas.ltxDurationFrames')}</span><input class="setting-input" data-ltx-duration-frames type="number" min="1" max="10000" step="1"></label>
            <label class="field"><span class="setting-title">${tr('canvas.ltxFps')}</span><input class="setting-input" data-ltx-frame-rate type="number" min="1" max="240" step="1"></label>
            <label class="field"><span class="setting-title">${tr('canvas.width')}</span><input class="setting-input" data-ltx-width type="number" min="0" max="8192" step="32" title="0 = auto"></label>
            <label class="field"><span class="setting-title">${tr('canvas.height')}</span><input class="setting-input" data-ltx-height type="number" min="0" max="8192" step="32" title="0 = auto"></label>
        </div>
        <div class="ltx-director-timeline-host" data-ltx-timeline-host></div>
        <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">${tr('canvas.ltxLinkedImages')} · ${imageInputs.length}</div>
        <div class="input-list mt-1"></div>
        <div class="gen-run-row">
            <button class="comfy-run ltx-run ${node.running ? 'running' : ''}" ${node.running ? 'disabled' : ''}><i data-lucide="film" class="w-4 h-4"></i>${node.running ? tr('canvas.ltxRunning') : tr('canvas.ltxRun')}</button>
            ${cascadeBtnHtml(node)}
        </div>
        ${retryBarHtml(node)}
    `;

    renderPromptPreview(wrap.querySelector('.prompt-list'), promptInputs);
    bindLTXParamsRow(wrap, node);
    ltxSyncConnectedImagesToTimeline(node);
    renderComfyImages(wrap.querySelector('.input-list'), node, imageInputs);

    const host = wrap.querySelector('[data-ltx-timeline-host]');
    if(host && window.CanvasLTXTimelineEditor){
        if(node._ltxEditor && node._ltxEditor.wrapper){
            host.appendChild(node._ltxEditor.wrapper);
            node._ltxEditor.container = host;
            node._ltxEditor._onCanvasCommit = () => scheduleSave();
            node._ltxEditor._onCanvasResize = () => { updateLTXNodeElementSize(node); scheduleSave(); };
        } else {
            destroyLTXEditor(node);
            try {
                const editor = new window.CanvasLTXTimelineEditor(node, host, null);
                editor._onCanvasCommit = () => scheduleSave();
                editor._onCanvasResize = () => { updateLTXNodeElementSize(node); scheduleSave(); };
                node._ltxEditor = editor;
            } catch(err) {
                console.error('LTX timeline editor init failed', err);
                host.innerHTML = `<div class="text-[11px] text-red-500 p-2">${escapeHtml(tr('canvas.ltxTimelineLoadFailed'))}</div>`;
            }
        }
    } else if(host) {
        host.innerHTML = `<div class="text-[11px] text-red-500 p-2">${escapeHtml(tr('canvas.ltxTimelineScriptMissing'))}</div>`;
    }

    const runBtn = wrap.querySelector('.ltx-run');
    if(runBtn){
        runBtn.onmousedown = e => e.stopPropagation();
        runBtn.onclick = e => {
            e.stopPropagation();
            e.preventDefault();
            runCanvasGenerate(node.id);
        };
    }
    bindCascadeButtons(wrap, node.id);
    return wrap;
}
async function runLTXDirectorNode(nodeId, opts={}){
    const node = nodes.find(n => n.id === nodeId);
    if(!node || node.type !== 'ltxDirector') return;
    const cascadeTargetId = cascadeTargetIdFromOptions(opts);
    clearStuckGeneratorRunning(node);
    if(node.running && !opts.cascade) return;
    ltxFlushTimelineToNode(node);
    const sources = orderedSources(node, generatorSources(node));
    const upstreamPrompt = sources.map(s => s.prompt).filter(Boolean).join('\n\n');
    const globalPrompt = [node.globalPrompt, upstreamPrompt].filter(Boolean).join('\n\n').trim();
    const segments = ltxDirectorTimelineSegments(node);
    const hasSegPrompt = segments.some(s => (s.prompt || '').trim());
    const hasImageSeg = segments.some(s => s.type === 'image' && (s.imageFile || s.imageB64));
    if(!globalPrompt && !hasSegPrompt && !hasImageSeg){
        const msg = tr('canvas.needPromptOrImage');
        setStatus(msg);
        showErrorModal(msg, tr('canvas.ltxFailed'));
        return;
    }
    if(segments.some(s => s.type === 'image' && !s.imageFile && !s.imageB64)){
        const msg = tr('canvas.ltxImageSegNeedRef');
        setStatus(msg);
        showErrorModal(msg, tr('canvas.ltxFailed'));
        return;
    }
    ltxDirectorSyncSeconds(node);
    let out = outputForNode(node, 520);
    const pendingId = uid('p');
    const refs = sources.flatMap(s => s.refs || []);
    const run = runSnapshot(node, globalPrompt || segments.map(s => s.prompt).join(' | '), refs);
    run.taskLabel = tr('canvas.ltxDirector');
    if(out) out._pending = [...(out._pending || []), makePendingForRun(pendingId, run, node, {refs, cascadeTargetId})];
    if(!opts.cascade){
        node.running = true;
        refreshRunNodes(node, out);
        setStatus(tr('canvas.ltxRunning'));
    } else {
        refreshRunNodes(node, out);
    }
    try {
        const directorInputs = await ltxDirectorBuildTimelinePayload(node, globalPrompt);
        const params = {
            [LTX_DIRECTOR_WF_NODE]:directorInputs,
            [LTX_DIRECTOR_SEED_NODE]:{noise_seed:Number(node.noiseSeed ?? 12)}
        };
        const result = await runQueuedComfyGenerate({
            prompt:globalPrompt,
            workflow_json:LTX_DIRECTOR_WORKFLOW,
            params,
            type:'ltx-director',
            client_id:CLIENT_ID,
            input_asset_ids:canvasInputAssetIds(refs)
        }, {cascadeTargetId});
        run.request = requestMetaFromResult(result);
        if(result.error) throw new Error(result.error);
        const outputs = comfyResultOutputs(result);
        if(!outputs.length) throw new Error(tr('canvas.ltxNoOutput'));
        const meta = collectRunMeta(out, pendingId);
        if(out) out._pending = (out._pending || []).filter(p => p.id !== pendingId);
        appendOutputImages(out, outputs, refs[0], [meta]);
        mergeGeneratedOutputs(node, outputs, Boolean(opts.cascade));
        addGenerationLog({run, outputs, runMs:meta.runMs || 0});
        node.runStatus = 'done';
        node.runError = '';
        refreshRunNodes(node, out);
        scheduleSave();
    } catch(err) {
        const meta = collectRunMeta(out, pendingId);
        if(out) out._pending = (out._pending || []).filter(p => p.id !== pendingId);
        addGenerationLog({run, outputs:[], runMs:meta.runMs || 0, error:err.message || String(err)});
        if(isCascadeAbortError(err)){
            if(opts.cascade) throw err;
            return;
        }
        node.runStatus = 'failed';
        node.runError = err.message || String(err);
        refreshRunNodes(node, out);
        if(opts.cascade) throw err;
        showErrorModal(err.message || tr('canvas.ltxFailed'), tr('canvas.ltxFailed'));
    } finally {
        if(!opts.cascade){
            node.running = false;
            refreshRunNodes(node, out);
        }
    }
}
async function runComfyNode(nodeId, opts={}){
    const node = nodes.find(n => n.id === nodeId);
    if(!node || (node.running && !opts.cascade)) return;
    const cascadeTargetId = cascadeTargetIdFromOptions(opts);
    const mode = node.mode || 'text';
    if(mode === 'custom'){
        const selectedWorkflow = validComfyWorkflowName(node.comfyWorkflow || comfyWorkflows[0]?.name || '');
        if(selectedWorkflow) await ensureComfyWorkflow(selectedWorkflow);
        syncComfyUploadNodes(node);
    }
    const sources = orderedSources(node, generatorSources(node));
    const prompt = sources.map(s => s.prompt).filter(Boolean).join('\n\n');
    const customImageFields = mode === 'custom' ? comfyFields(node, 'image') : [];
    const customVideoFields = mode === 'custom' ? comfyFields(node, 'video') : [];
    const customAudioFields = mode === 'custom' ? comfyFields(node, 'audio') : [];
    const customPromptFields = mode === 'custom' ? comfyFields(node, 'prompt') : [];
    const sourceRefs = sources.flatMap(s => s.refs || []);
    const imageRefsByField = mode === 'custom' ? comfyBoundMediaRefsByField(node, 'image', sources) : [];
    const videoRefsByField = mode === 'custom' ? comfyBoundMediaRefsByField(node, 'video', sources) : [];
    const audioRefsByField = mode === 'custom' ? comfyBoundMediaRefsByField(node, 'audio', sources) : [];
    const refs = mode === 'custom' ? imageRefsByField.filter(Boolean) : imageRefsOnly(sourceRefs);
    const videoRefs = mode === 'custom' ? videoRefsByField.filter(Boolean) : videoRefsOnly(sourceRefs);
    const audioRefs = mode === 'custom' ? audioRefsByField.filter(Boolean) : audioRefsOnly(sourceRefs);
    const allRefs = mode === 'custom'
        ? [...refs, ...videoRefs, ...audioRefs].filter((ref, index, list) => list.findIndex(item => item.url === ref.url) === index)
        : sourceRefs;
    const inputAssetIds = canvasInputAssetIds(mode === 'custom' ? allRefs : refs);
    if((mode === 'text' || (mode === 'custom' && customPromptFields.length)) && !prompt){ alert(tr('canvas.needPrompt')); return; }
    if((mode !== 'text' && mode !== 'custom' && !refs.length) || (mode === 'custom' && refs.length < customImageFields.length)){ alert(tr('canvas.needImage')); return; }
    if(mode === 'custom' && videoRefs.length < customVideoFields.length){ alert(langIsEn() ? 'Please connect enough video inputs for this ComfyUI workflow.' : '请为这个 ComfyUI 工作流连接足够的视频输入'); return; }
    if(mode === 'custom' && audioRefs.length < customAudioFields.length){ alert(langIsEn() ? 'Please connect enough audio inputs for this ComfyUI workflow.' : '请为这个 ComfyUI 工作流连接足够的音频输入'); return; }
    let out = outputForNode(node, 480);
    const pendingId = uid('p');
    const run = runSnapshot(node, prompt, mode === 'custom' ? allRefs : refs);
    run.taskLabel = comfyRunLabel(node);
    const requestSize = mode === 'text' ? {width:Number(node.width || 1024), height:Number(node.height || 1024)} : null;
    if(out) out._pending = [...(out._pending||[]), makePendingForRun(pendingId, run, node, {refs, requestSize, cascadeTargetId})];
    if(!opts.cascade){
        node.running = true;
        refreshRunNodes(node, out);
        setTimeout(() => { node.running = false; refreshRunNodes(node, out); }, 2000);
    }
    else refreshRunNodes(node, out);
    try {
        let images = [];
        if(mode === 'text'){
            run.taskLabel = tr('canvas.comfyText');
            const result = await runQueuedComfyGenerate({
                prompt,
                width:Number(node.width || 1024),
                height:Number(node.height || 1024),
                workflow_json:'Z-Image.json',
                type:'zimage',
                client_id:CLIENT_ID,
                input_asset_ids:inputAssetIds
            }, {cascadeTargetId});
            run.request = requestMetaFromResult(result);
            images = comfyResultOutputs(result);
        } else if(mode === 'enhance'){
            run.taskLabel = tr('canvas.comfyEnhance');
            const inputName = await comfyNameForRef(refs[0]);
            const enhance = await runQueuedComfyGenerate({
                workflow_json:'Z-Image-Enhance.json',
                params:{
                    "15": { image:inputName },
                    "204": { value:Number(node.enhanceStrength ?? 0.5) }
                },
                type:'enhance',
                client_id:CLIENT_ID,
                input_asset_ids:inputAssetIds
            }, {cascadeTargetId});
            run.request = requestMetaFromResult(enhance);
            if(enhance.error) throw new Error(actionFailed('canvas.comfyEnhance', enhance.error));
            if(!enhance.images?.length) throw new Error(noReturnedImage('canvas.comfyEnhance'));
            if(node.enhanceUpscale){
                images = await runComfyUpscale(enhance.images?.[0], node.enhanceUpscaleRes || 2048, {cascadeTargetId});
            } else {
                images = enhance.images || [];
            }
        } else if(mode === 'custom'){
            const workflowName = validComfyWorkflowName(node.comfyWorkflow || comfyWorkflows[0]?.name || '');
            run.taskLabel = workflowName || tr('canvas.comfyCustom');
            if(node.comfyWorkflow && node.comfyWorkflow !== workflowName) node.comfyWorkflow = workflowName;
            const wf = await ensureComfyWorkflow(workflowName);
            if(!workflowName || !wf) throw new Error(tr('canvas.comfyNoWorkflow'));
            const fields = wf?.config?.fields || [];
            const params = {};
            const imageFields = fields.filter(f => comfyFieldKind(f) === 'image');
            const videoFields = fields.filter(f => comfyFieldKind(f) === 'video');
            const audioFields = fields.filter(f => comfyFieldKind(f) === 'audio');
            const promptFields = fields.filter(f => comfyFieldKind(f) === 'prompt');
            const settingFields = fields.filter(f => comfyFieldKind(f) === 'setting');
            const assignMediaFields = async (mediaFields, mediaRefs) => {
                const names = [];
                for(let i = 0; i < mediaFields.length; i++){
                    const ref = mediaRefs[i];
                    names.push(ref?.url ? await comfyNameForRef(ref) : '');
                }
                mediaFields.forEach((f, i) => {
                    if(!f.node || !f.input) return;
                    params[f.node] = params[f.node] || {};
                    params[f.node][f.input] = names[i] || '';
                });
            };
            await assignMediaFields(imageFields, imageRefsByField);
            await assignMediaFields(videoFields, videoRefsByField);
            await assignMediaFields(audioFields, audioRefsByField);
            promptFields.forEach(f => {
                if(!f.node || !f.input) return;
                params[f.node] = params[f.node] || {};
                params[f.node][f.input] = prompt;
            });
            settingFields.forEach(f => {
                if(!f.node || !f.input) return;
                params[f.node] = params[f.node] || {};
                if(comfyRandomEnabled(f) && comfyRandomActive(node, f.id)){
                    node.comfyParams = node.comfyParams || {};
                    node.comfyParams[f.id] = comfyRandomValue(f);
                }
                params[f.node][f.input] = comfyParamValue(node, f);
            });
            const result = await runQueuedComfyGenerate({
                prompt,
                workflow_json:workflowName,
                params,
                type:'workflow-custom',
                client_id:CLIENT_ID,
                input_asset_ids:inputAssetIds
            }, {cascadeTargetId});
            run.request = requestMetaFromResult(result);
            if(result.error) throw new Error(actionFailed('canvas.comfyCustom', result.error));
            images = comfyResultOutputs(result);
            if(!images.length) throw new Error(noReturnedImage('canvas.comfyCustom'));
        } else {
            run.taskLabel = tr('canvas.comfyEdit');
            const names = [];
            for (const ref of refs.slice(0, 3)) names.push(await comfyNameForRef(ref));
            const result = await runQueuedComfyGenerate({
                prompt,
                workflow_json:'Flux2-Klein.json',
                type:'klein',
                params:{
                    "168": { text:prompt },
                    "158": { noise_seed:Math.floor(Math.random() * 1000000) },
                    "278": { image:names[0] || "" },
                    "270": { image:names[1] || "" },
                    "292": { image:names[2] || "" },
                    "313": { value:Boolean(names[1]) },
                    "314": { value:Boolean(names[2]) }
                },
                client_id:CLIENT_ID,
                input_asset_ids:inputAssetIds
            }, {cascadeTargetId});
            run.request = requestMetaFromResult(result);
            if(result.error) throw new Error(actionFailed('canvas.comfyEdit', result.error));
            if(!result.images?.length) throw new Error(noReturnedImage('canvas.comfyEdit'));
            images = node.editUpscale ? await runComfyUpscale(result.images?.[0], node.editUpscaleRes || 2048, {cascadeTargetId}) : result.images || [];
        }
        const meta = collectRunMeta(out, pendingId);
        if(out) out._pending = (out._pending||[]).filter(p => p.id !== pendingId);
        appendOutputImages(out, images, refs[0], [meta]);
        mergeGeneratedOutputs(node, images, Boolean(opts.cascade));
        addGenerationLog({run, outputs:images, runMs:meta.runMs || 0});
        node.runStatus = 'done'; node.runError = '';
        refreshRunNodes(node, out);
        scheduleSave();
    } catch(err) {
        const meta = collectRunMeta(out, pendingId);
        addGenerationLog({run, outputs:[], runMs:meta.runMs || 0, error:err.message || String(err)});
        if(out) out._pending = (out._pending||[]).filter(p => p.id !== pendingId);
        if(isCascadeAbortError(err)){
            refreshRunNodes(node, out);
            if(opts.cascade) throw err;
            return;
        }
        node.runStatus = 'failed'; node.runError = err.message || String(err);
        refreshRunNodes(node, out);
        if(opts.cascade) throw err;
        alert(err.message || actionFailed('canvas.comfyGenerate'));
    }
}
async function callCanvasLLM(node, message, messages=[], options={}){
    const llmProv = resolveChatProviderId(node.llmProvider || 'comfly');
    const model = resolveChatModel(node.model || node.llmMsModel, llmProv);
    const images = llmInputImages(node);
    const videos = llmInputVideos(node);
    const result = await cascadeRequest(signal => classicCanvasApi().createCanvasLlm({
            message,
            model,
            ms_model: llmProv === 'modelscope' ? model : '',
            provider: llmProv,
            system_prompt:node.systemPrompt || 'You are a helpful assistant.',
            messages,
            images,
            videos,
        }, signal ? {signal} : {}), options).then(async r => {
        if(!r.ok){
            throw new Error(await responseErrorMessage(r, 'LLM 运行失败'));
        }
        return r.json();
    });
    return result.text || '';
}
async function runLLMNode(nodeId, opts={}){
    const node = nodes.find(n => n.id === nodeId);
    if(!node || (node.running && !opts.cascade)) return;
    const cascadeTargetId = cascadeTargetIdFromOptions(opts);
    const input = llmInputText(node) || node.userInput || '';
    if(!input){
        if(opts.cascade) throw new Error('LLM 缺少提示词输入');
        alert(tr('canvas.needPromptToLLM')); return;
    }
    if(!opts.cascade){ node.running = true; refreshNodes([node.id]); }
    try {
        node.outputText = await callCanvasLLM(node, input, [], {cascadeTargetId});
        if(!opts.cascade) node.running = false;
        node.runStatus = 'done'; node.runError = '';
        refreshNodes([node.id]);
        scheduleSave();
    } catch(err) {
        if(!opts.cascade) node.running = false;
        if(isCascadeAbortError(err)){
            refreshNodes([node.id]);
            if(opts.cascade) throw err;
            return;
        }
        node.runStatus = 'failed'; node.runError = err.message || String(err);
        refreshNodes([node.id]);
        if(opts.cascade) throw err;
        alert(err.message || 'LLM 运行失败');
    }
}
// 判断是不是「链尾」节点：没有下游生成节点（直接相连或经 Output 中转都算）
function isTerminalGenerator(nodeId){
    const GEN_TYPES = canvasRunTypes();
    for(const c of connections.filter(c => c.from === nodeId)){
        const t = nodes.find(n => n.id === c.to);
        if(!t) continue;
        if(GEN_TYPES.includes(t.type)) return false;
        if(t.type === 'output'){
            for(const c2 of connections.filter(cc => cc.from === t.id)){
                const t2 = nodes.find(n => n.id === c2.to);
                if(t2 && GEN_TYPES.includes(t2.type)) return false;
            }
        }
    }
    return true;
}
function findLoopCascadeTarget(loopId){
    const runTypes = canvasRunTypes();
    const seen = new Set();
    const candidates = [];
    const walk = (id, depth=0) => {
        if(seen.has(id)) return;
        seen.add(id);
        connections.filter(c => c.from === id).forEach(c => {
            const next = nodes.find(n => n.id === c.to);
            if(!next) return;
            if(runTypes.includes(next.type)){
                candidates.push({id:next.id, depth:depth + 1, terminal:isTerminalGenerator(next.id)});
            }
            walk(next.id, depth + 1);
        });
    };
    walk(loopId);
    const terminal = candidates.filter(c => c.terminal).sort((a, b) => b.depth - a.depth)[0];
    return (terminal || candidates.sort((a, b) => b.depth - a.depth)[0])?.id || '';
}
function cascadeBtnHtml(node){
    // 仅链尾节点显示一键运行
    if(!isTerminalGenerator(node.id)) return '';
    // 也要求至少有上游生成节点，否则没意义
    const order = computeCascadeOrder(node.id);
    const loop = resolveCascadeLoop(node.id);
    if(order.length <= 1 && !loop) return '';
    const suffix = loop ? ` × ${loop.count} ${tr('canvas.loopRounds')}` : '';
    if(isCascadeActive(node.id)){
        const stopping = isCascadeStopping(node.id);
        return `<button class="gen-cascade-btn gen-cascade-stop" type="button" data-cascade-stop="${node.id}" ${stopping ? 'disabled' : ''}><i data-lucide="square" class="w-4 h-4"></i><span>${stopping ? '停止中…' : '停止运行'}</span></button>`;
    }
    return `<button class="gen-cascade-btn" type="button" data-cascade="${node.id}" title="一键运行整条工作流（追溯所有上游生成节点）"><i data-lucide="play-circle" class="w-4 h-4"></i><span>一键运行 ${order.length} 个节点${suffix}</span></button>`;
}
function retryBarHtml(node){
    // 只在一键运行模式中失败才显示；普通单节点失败直接弹 alert，不显示这条
    if(node.runStatus !== 'failed' || !node._cascadeFailed) return '';
    return `<div class="node-retry-bar" data-retry-bar>
        <span class="node-retry-msg" title="${escapeAttr(node.runError||'')}">${escapeHtml((node.runError||tr('canvas.generationFailed')).slice(0,60))}</span>
        <button class="node-retry-btn" type="button" data-retry="${node.id}">重试</button>
        <button class="node-stop-btn" type="button" data-stop="${node.id}">停止</button>
    </div>`;
}
function bindCascadeButtons(wrap, nodeId){
    wrap.querySelectorAll(`[data-cascade="${nodeId}"]`).forEach(b => {
        b.onmousedown = e => e.stopPropagation();
        b.onclick = e => { e.stopPropagation(); runNodeCascade(nodeId); };
    });
    wrap.querySelectorAll(`[data-cascade-stop="${nodeId}"]`).forEach(b => {
        b.onmousedown = e => e.stopPropagation();
        b.onclick = e => { e.stopPropagation(); requestCascadeStop(nodeId); };
    });
    wrap.querySelectorAll(`[data-retry="${nodeId}"]`).forEach(b => {
        b.onmousedown = e => e.stopPropagation();
        b.onclick = e => { e.stopPropagation(); retryNodeAndDownstream(nodeId); };
    });
    wrap.querySelectorAll(`[data-stop="${nodeId}"]`).forEach(b => {
        b.onmousedown = e => e.stopPropagation();
        b.onclick = e => { e.stopPropagation(); cancelCascade(nodeId); };
    });
}
// —— 一键运行：从目标节点反向追溯到所有上游生成节点，按拓扑顺序串行执行 ——
function runCascadeNodeByType(node, opts={}){
    const runOpts = {cascade:true, ...opts};
    if(node.type === 'generator') return runGenerator(node.id, runOpts);
    if(node.type === 'midjourney') return runMidjourneyNode(node.id, runOpts);
    if(node.type === 'msgen') return runMsGenNode(node.id, runOpts);
    if(node.type === 'comfy') return runComfyNode(node.id, runOpts);
    if(node.type === 'ltxDirector') return runLTXDirectorNode(node.id, runOpts);
    if(node.type === 'llm') return runLLMNode(node.id, runOpts);
    if(node.type === 'video') return runVideoNode(node.id, runOpts);
    if(node.type === 'minimax') return runMiniMaxNode(node.id, runOpts);
    if(node.type === 'rh') return runRhNode(node.id, runOpts);
    return Promise.resolve();
}
async function runCascadeNodeWithLoopContext(node, ctx, opts={}){
    const previous = loopContext;
    const previousNodeCtx = node ? node._activeLoopCtx : null;
    loopContext = ctx || null;
    if(node) node._activeLoopCtx = ctx || null;
    try {
        return await runCascadeNodeByType(node, opts);
    } finally {
        loopContext = previous;
        if(node){
            if(previousNodeCtx) node._activeLoopCtx = previousNodeCtx;
            else delete node._activeLoopCtx;
        }
    }
}
function cascadeParallelLimit(order, totalRounds){
    const hasComfy = order.some(id => nodes.find(n => n.id === id)?.type === 'comfy');
    if(hasComfy) return Math.max(1, Math.min(totalRounds, comfyBackendCount || 1));
    return Math.max(1, Math.min(totalRounds, 6));
}
async function runLimitedCascadeRounds(rounds, limit, runner){
    let next = 0;
    const workers = Array.from({length:Math.max(1, Math.min(limit, rounds.length))}, async () => {
        while(next < rounds.length){
            const round = rounds[next++];
            await runner(round);
        }
    });
    return Promise.allSettled(workers);
}
function canvasRunTypes(){
    return ['generator','midjourney','msgen','comfy','ltxDirector','llm','video','rh','minimax'];
}
function canvasWorkflowEdges(){
    const runTypes = canvasRunTypes();
    const direct = [];
    connections.forEach(c => {
        const from = nodes.find(n => n.id === c.from);
        const to = nodes.find(n => n.id === c.to);
        if(!from || !to || !runTypes.includes(from.type)) return;
        if(runTypes.includes(to.type)){
            direct.push([from.id, to.id]);
            return;
        }
        if(to.type === 'output'){
            connections.filter(cc => cc.from === to.id).forEach(cc => {
                const next = nodes.find(n => n.id === cc.to);
                if(next && runTypes.includes(next.type)) direct.push([from.id, next.id]);
            });
        }
    });
    return direct;
}
function computeConnectedWorkflowOrder(anchorId){
    const anchor = nodes.find(n => n.id === anchorId);
    const runTypes = canvasRunTypes();
    if(!anchor || !runTypes.includes(anchor.type)) return [];
    const edges = canvasWorkflowEdges();
    const connected = new Set([anchorId]);
    let changed = true;
    while(changed){
        changed = false;
        edges.forEach(([from, to]) => {
            if(connected.has(from) && !connected.has(to)){ connected.add(to); changed = true; }
            if(connected.has(to) && !connected.has(from)){ connected.add(from); changed = true; }
        });
    }
    const order = [];
    const seen = new Set();
    const visit = id => {
        if(seen.has(id)) return;
        seen.add(id);
        edges.filter(([, to]) => to === id).forEach(([from]) => {
            if(connected.has(from)) visit(from);
        });
        if(connected.has(id)) order.push(id);
    };
    nodes.filter(n => connected.has(n.id) && runTypes.includes(n.type)).forEach(n => visit(n.id));
    return order;
}
async function runCanvasGenerate(nodeId){
    const node = nodes.find(n => n.id === nodeId);
    if(!node || node.running || cascadeRunningIds.has(nodeId)) return;
    return runCascadeNodeByType(node, {cascade:false});
}
function computeCascadeOrder(targetId){
    const visited = new Set();
    const order = [];
    const GEN_TYPES = canvasRunTypes();
    function dfs(id){
        if(visited.has(id)) return;
        visited.add(id);
        const node = nodes.find(n => n.id === id);
        if(!node) return;
        // 找该节点的上游
        connections.filter(c => c.to === id).forEach(c => {
            const from = nodes.find(n => n.id === c.from);
            if(!from) return;
            if(GEN_TYPES.includes(from.type)){
                dfs(from.id);
            } else if(from.type === 'output'){
                // output 节点的上游是生成器
                connections.filter(cc => cc.to === from.id).forEach(cc => {
                    const ff = nodes.find(n => n.id === cc.from);
                    if(ff && GEN_TYPES.includes(ff.type)) dfs(ff.id);
                });
            }
        });
        if(GEN_TYPES.includes(node.type)) order.push(id);
    }
    dfs(targetId);
    return order;
}
function upstreamNodeIds(targetId){
    const found = new Set();
    const walk = id => {
        connections.filter(c => c.to === id).forEach(c => {
            if(found.has(c.from)) return;
            found.add(c.from);
            walk(c.from);
        });
    };
    walk(targetId);
    return found;
}
function resolveCascadeLoop(targetId){
    const upstream = upstreamNodeIds(targetId);
    const loops = nodes.filter(n => n.type === 'loop' && upstream.has(n.id));
    if(!loops.length) return null;
    const loop = loops[loops.length - 1];
    return {node:loop, count:loopCount(loop), mode:loop.mode === 'parallel' ? 'parallel' : 'serial'};
}
function cascadeUiNodeIds(targetId, order=null){
    const ids = new Set([targetId, ...(order || computeCascadeOrder(targetId))]);
    const loop = resolveCascadeLoop(targetId);
    if(loop?.node?.id) ids.add(loop.node.id);
    return [...ids].filter(Boolean);
}
async function runNodeCascade(nodeId){
    const target = nodes.find(n => n.id === nodeId);
    if(!target) return;
    if(target.running){ alert('当前节点正在运行'); return; }
    const order = computeCascadeOrder(nodeId);
    if(!order.length){ alert('没有可运行的生成节点'); return; }
    const loop = resolveCascadeLoop(nodeId);
    const totalRounds = loop?.count || 1;
    const startIdx = Math.max(1, Number(loop?.node?.loopStart) || 1);
    const loopImageStride = loop?.node?.imageInput ? Math.max(1, Math.min(100, Number(loop?.node?.imageBatchSize) || 1)) : 0;
    const loopBatchSize = Math.max(1, loopImageStride);
    const endIdx = startIdx + (totalRounds - 1) * loopBatchSize;
    const ctx = beginCascade(nodeId, order, {serial:true, mode:loop?.mode || 'serial'});
    refreshNodes(cascadeUiNodeIds(nodeId, order));
    order.forEach(id => {
        const n = nodes.find(x => x.id === id);
        if(n) n.generatedOutputs = [];
    });
    if(loop?.mode === 'parallel' && totalRounds > 1){
        order.forEach(id => {
            const n = nodes.find(x => x.id === id);
            if(n){ n.runStatus = 'queued'; n.runError = ''; n._cascadeFailed = false; n._cascadeIdx = `0/${totalRounds}`; }
        });
        refreshNodes(cascadeUiNodeIds(nodeId, order));
        let done = 0;
        const rounds = Array.from({length:totalRounds}, (_, idx) => ({idx, index:startIdx + idx * loopBatchSize}));
        const limit = cascadeParallelLimit(order, totalRounds);
        const results = await runLimitedCascadeRounds(rounds, limit, async ({index}) => {
            ensureCascadeActive(nodeId, ctx.message);
            const loopCtx = {index, total:endIdx, nodeId:loop.node.id};
            for(let i = 0; i < order.length; i++){
                ensureCascadeActive(nodeId, ctx.message);
                const id = order[i];
                const node = nodes.find(n => n.id === id);
                if(!node) continue;
                ctx.currentNodeId = id;
                ctx.currentRoundLabel = `${index}/${endIdx}`;
                node.runStatus = 'running';
                node._cascadeIdx = `${order.indexOf(id)+1}/${order.length} · ${index}/${endIdx}`;
                refreshNodes([id]);
                await runCascadeNodeWithLoopContext(node, loopCtx, {cascadeTargetId:nodeId});
                ensureCascadeActive(nodeId, ctx.message);
                node.runStatus = 'done';
                refreshNodes([id]);
            }
            done += 1;
            order.forEach(id => {
                const n = nodes.find(x => x.id === id);
                if(n) n._cascadeIdx = `${done}/${totalRounds}`;
            });
            refreshNodes(order);
        });
        loopContext = null;
        const failed = results.find(r => r.status === 'rejected');
        if(failed){
            const err = failed.reason || new Error('parallel loop failed');
            if(isCascadeAbortError(err)){
                finalizeCascade(nodeId, 'stopped', {order});
                return;
            }
            const node = nodes.find(n => n.id === ctx.currentNodeId) || nodes.find(n => n.id === nodeId) || target;
            node.runStatus = 'failed';
            node.runError = err.message || String(err);
            node._cascadeFailed = true;
            finalizeCascade(nodeId, 'failed', {order});
            return;
        }
        finalizeCascade(nodeId, 'done', {order});
        return;
    }
    refreshNodes(cascadeUiNodeIds(nodeId, order));
    for(let round = 1; round <= totalRounds; round++){
        ensureCascadeActive(nodeId, ctx.message);
        const loopIndex = startIdx + (round - 1) * loopBatchSize;
        loopContext = loop ? {index:loopIndex, total:endIdx, nodeId:loop.node.id} : null;
        order.forEach(id => {
            const n = nodes.find(x => x.id === id);
            if(n){ n.runStatus = 'queued'; n.runError = ''; n._cascadeFailed = false; n._cascadeIdx = `${order.indexOf(id)+1}/${order.length}${totalRounds > 1 ? ` · ${loopIndex}/${endIdx}` : ''}`; }
        });
        refreshNodes(cascadeUiNodeIds(nodeId, order));
        for(let i = 0; i < order.length; i++){
            const id = order[i];
            const node = nodes.find(n => n.id === id);
            if(!node) continue;
            ctx.currentNodeId = id;
            ctx.currentRoundLabel = totalRounds > 1 ? `${loopIndex}/${endIdx}` : '';
            node.runStatus = 'running';
            refreshNodes([id]);
            try {
                await runCascadeNodeWithLoopContext(node, loopContext, {cascadeTargetId:nodeId});
                ensureCascadeActive(nodeId, ctx.message);
                node.runStatus = 'done';
                refreshNodes([id]);
            } catch(err){
                loopContext = null;
                if(isCascadeAbortError(err)){
                    finalizeCascade(nodeId, 'stopped', {order});
                    return;
                }
                node.runStatus = 'failed';
                node.runError = `${totalRounds > 1 ? `${tr('canvas.loopRound')} ${round}/${totalRounds}: ` : ''}${err.message || String(err)}`;
                node._cascadeFailed = true;
                for(let j = i + 1; j < order.length; j++){
                    const n2 = nodes.find(x => x.id === order[j]);
                    if(n2){ n2.runStatus = ''; n2._cascadeIdx = ''; }
                }
                finalizeCascade(nodeId, 'failed', {order});
                return;
            }
        }
    }
    loopContext = null;
    finalizeCascade(nodeId, 'done', {order});
}
async function runOneCascadePass(order, options={}){
    const targetId = cascadeTargetIdFromOptions(options);
    order.forEach(id => {
        const n = nodes.find(x => x.id === id);
        if(n){ n.runStatus = 'queued'; n.runError = ''; n._cascadeFailed = false; n._cascadeIdx = ''; }
    });
    refreshNodes(order);
    for(let i = 0; i < order.length; i++){
        if(targetId) ensureCascadeActive(targetId);
        const id = order[i];
        const node = nodes.find(n => n.id === id);
        if(!node) continue;
        const ctx = cascadeContextFor(targetId);
        if(ctx) ctx.currentNodeId = id;
        node.runStatus = 'running';
        refreshNodes([id]);
        try {
            if(node.type === 'generator') await runGenerator(id, {cascade:true, cascadeTargetId:targetId});
            else if(node.type === 'midjourney') await runMidjourneyNode(id, {cascade:true, cascadeTargetId:targetId});
            else if(node.type === 'msgen') await runMsGenNode(id, {cascade:true, cascadeTargetId:targetId});
            else if(node.type === 'comfy') await runComfyNode(id, {cascade:true, cascadeTargetId:targetId});
            else if(node.type === 'ltxDirector') await runLTXDirectorNode(id, {cascade:true, cascadeTargetId:targetId});
            else if(node.type === 'llm') await runLLMNode(id, {cascade:true, cascadeTargetId:targetId});
            else if(node.type === 'video') await runVideoNode(id, {cascade:true, cascadeTargetId:targetId});
            else if(node.type === 'minimax') await runMiniMaxNode(id, {cascade:true, cascadeTargetId:targetId});
            else if(node.type === 'rh') await runRhNode(id, {cascade:true, cascadeTargetId:targetId});
            if(targetId) ensureCascadeActive(targetId);
            node.runStatus = 'done';
            refreshNodes([id]);
        } catch(err) {
            node.runStatus = 'failed';
            node.runError = err.message || String(err);
            node._cascadeFailed = true;
            throw err;
        }
    }
}
// 失败重试：从该节点继续往下游跑
async function retryNodeAndDownstream(nodeId){
    const target = nodes.find(n => n.id === nodeId);
    if(!target) return;
    if(isCascadeActive(nodeId)) return;
    const order = computeCascadeOrder(nodeId);
    // 只重跑从该节点开始的剩余链
    const idx = order.indexOf(nodeId);
    const remain = idx >= 0 ? order.slice(idx) : [nodeId];
    beginCascade(nodeId, remain, {serial:true, mode:'retry'});
    try {
        await runOneCascadePass(remain, {cascadeTargetId:nodeId});
        finalizeCascade(nodeId, 'done', {order:remain});
    } catch(err) {
        if(isCascadeAbortError(err)){
            finalizeCascade(nodeId, 'stopped', {order:remain});
            return;
        }
        finalizeCascade(nodeId, 'failed', {order:remain});
        refreshNodes(remain);
    }
}
function cancelCascade(nodeId){
    requestCascadeStop(nodeId);
}

async function runLLMChat(nodeId){
    const node = nodes.find(n => n.id === nodeId);
    if(!node || node.running) return;
    const message = (node.chatInput || '').trim();
    if(!message) return;
    node.messages = node.messages || [];
    const history = node.messages.slice();
    node.messages.push({role:'user', content:message});
    node.chatInput = '';
    node.running = true;
    refreshNodes([node.id]);
    try {
        const text = await callCanvasLLM(node, message, history);
        node.messages.push({role:'assistant', content:text});
        node.outputText = text;
        node.running = false;
        refreshNodes([node.id]);
        scheduleSave();
    } catch(err) {
        node.running = false;
        refreshNodes([node.id]);
        alert(err.message || 'LLM 运行失败');
    }
}
