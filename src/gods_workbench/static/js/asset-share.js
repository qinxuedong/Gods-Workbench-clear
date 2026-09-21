import assetShareApi from './asset-share/api.js';

(function(){
    'use strict';
    const app=document.getElementById('shareApp');
    const pathSegment=decodeURIComponent(location.pathname.split('/').filter(Boolean).pop()||'');
    // 直接打开 /static/asset-share.html（末段为 *.html 或空）时根本不存在分享令牌，明确提示而非静默 404。
    const isDirectOpen=!pathSegment||/\.html?$/i.test(pathSegment);
    const token=isDirectOpen?'':pathSegment;
    const state={meta:null,data:null,index:0,tool:'pin',draft:null,start:null,points:[],timecodeMs:null,keyboardPoint:{x:0.5,y:0.5}};
    const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const attr=esc;
    const icon=(name)=>'<i data-lucide="'+name+'"></i>';
    const current=()=>state.data?.assets?.[state.index]||null;
    // 统一从后端标准错误包 {"detail":{"code":...,"message":...}} 提取可读信息。
    function apiErrorMessage(data){
        const detail=data?.detail;
        if(typeof detail==='string'&&detail)return detail;
        if(detail&&typeof detail==='object'&&detail.message)return String(detail.message);
        return data?.message||'访问失败';
    }

    async function readJson(responsePromise){
        const response=await responsePromise;
        const data=await response.json().catch(()=>({}));
        if(!response.ok) throw new Error(apiErrorMessage(data));
        return data;
    }
    function error(message){
        app.setAttribute('aria-busy','false');
        app.setAttribute('role','alert');
        app.setAttribute('aria-live','assertive');
        app.className='share-error';
        app.innerHTML=icon('circle-x')+'<strong>无法打开分享</strong><span>'+esc(message)+'</span>';
        lucide?.createIcons();
    }
    function timecode(ms){
        if(ms===null||ms===undefined)return '';
        const total=Math.max(0,Number(ms));const h=Math.floor(total/3600000);const m=Math.floor(total%3600000/60000);const s=Math.floor(total%60000/1000);const f=Math.floor(total%1000/40);
        return [h,m,s].map(v=>String(v).padStart(2,'0')).join(':')+':'+String(f).padStart(2,'0');
    }
    function finishShareLoading(){
        app.setAttribute('aria-busy','false');
        app.removeAttribute('role');
        app.removeAttribute('aria-live');
    }
    async function load(){
        if(!token){error('缺少分享令牌，请使用完整的分享链接打开本页面。');return;}
        try{
            state.meta=await readJson(assetShareApi.getPublicShare(token));
            if(!state.meta.available){error(state.meta.reason||'链接不可用');return;}
            if(state.meta.requires_password) renderAccess();
            else await unlock('');
        }catch(err){error(err.message);}
    }
    function renderAccess(message=''){
        finishShareLoading();
        app.className='share-access';
        app.innerHTML='<form id="shareAccessForm" class="share-access-card"><h1>'+esc(state.meta?.title||'素材审阅')+'</h1><p>这是受保护的素材审阅链接，请输入分享密码。</p><input name="password" type="password" placeholder="分享密码" autofocus required><button class="share-primary" type="submit">'+icon('lock-keyhole')+'进入审阅</button><div class="share-access-error" role="alert" aria-live="assertive">'+esc(message)+'</div></form>';
        lucide?.createIcons();
    }
    async function unlock(password){
        try{
            state.data=await readJson(assetShareApi.accessPublicShare(token,{password}));
            render();
        }catch(err){renderAccess(err.message);}
    }
    function annotationSvg(annotation,draft=false){
        const g=annotation?.geometry||{};const color=annotation?.style?.color||(draft?'#ffb020':'#ff4d67');const width=Number(annotation?.style?.width||4);
        const x=Number(g.x||0)*1000,y=Number(g.y||0)*1000,x2=Number(g.x2??g.x??0)*1000,y2=Number(g.y2??g.y??0)*1000,w=Number(g.width||0)*1000,h=Number(g.height||0)*1000;
        if(annotation.kind==='pin')return '<g><circle cx="'+x+'" cy="'+y+'" r="18" fill="'+color+'"/><circle cx="'+x+'" cy="'+y+'" r="7" fill="white"/></g>';
        if(annotation.kind==='rect')return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="none" stroke="'+color+'" stroke-width="'+width+'" vector-effect="non-scaling-stroke"/>';
        if(annotation.kind==='freehand')return '<polyline points="'+attr((g.points||[]).map(p=>p.x*1000+','+p.y*1000).join(' '))+'" fill="none" stroke="'+color+'" stroke-width="'+width+'" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';
        return '';
    }
    function annotations(){
        const values=(current()?.review?.comments||[]).flatMap(comment=>comment.annotations||[]);
        if(state.draft)values.push({...state.draft,_draft:true});
        return '<svg id="shareAnnotationSvg" class="share-annotation-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+values.map(value=>annotationSvg(value,value._draft)).join('')+'</svg>';
    }
    function media(asset){
        if(asset.kind==='video')return '<video id="shareMedia" src="'+attr(asset.media_url)+'" controls playsinline preload="metadata" aria-label="'+attr(asset.name)+'"></video>';
        if(asset.kind==='audio')return '<audio id="shareMedia" src="'+attr(asset.media_url)+'" controls preload="metadata" aria-label="'+attr(asset.name)+'"></audio>';
        return '<img id="shareMedia" src="'+attr(asset.media_url)+'" alt="'+attr(asset.name)+'">';
    }
    function thumb(asset){
        if(asset.kind==='image')return '<img src="'+attr(asset.media_url)+'" loading="lazy" alt="" aria-hidden="true">';
        return icon(asset.kind==='video'?'film':asset.kind==='audio'?'audio-lines':'file');
    }
    function comment(value){
        const seek=value.timecode_ms!==null&&value.timecode_ms!==undefined?'<button type="button" data-seek="'+attr(value.timecode_ms)+'" aria-label="跳转到 '+timecode(value.timecode_ms)+'">'+icon('timer')+timecode(value.timecode_ms)+'</button>':'';
        return '<article class="share-comment"><header><strong>'+esc(value.author_name||'访客')+'</strong><time>'+new Date(Number(value.created_at||0)).toLocaleString()+'</time></header><p>'+esc(value.body||(value.annotations?.length?'图形批注':'')).replace(/\n/g,'<br>')+'</p><footer>'+seek+(value.annotations?.length?'<span>'+value.annotations.length+' 个标记</span>':'')+'</footer></article>';
    }
    function render(){
        const asset=current();if(!asset){error('分享中没有可用资产');return;}
        finishShareLoading();
        const permissions=state.data.share.permissions||{};const comments=asset.review?.comments||[];const watermark=state.data.share.watermark_text||'仅供审阅';
        const drawSurfaceAttributes=permissions.comment?' tabindex="0" role="region" aria-label="批注画布" aria-describedby="shareAnnotationHelp"':'';
        const annotationHelp=permissions.comment?'<p id="shareAnnotationHelp" class="share-sr-only">批注画布。使用方向键移动标注位置，Enter 或空格放置标记，框选或画笔模式下再次按 Enter 完成，Escape 取消当前标注。</p>':'';
        const annotationStatus=permissions.comment?'<p id="shareAnnotationStatus" class="share-sr-only" role="status" aria-live="polite"></p>':'';
        app.className='share-shell';
        app.innerHTML='<header class="share-head"><div class="share-brand"><div><strong>'+esc(state.data.share.title)+'</strong><span>'+state.data.assets.length+' 个资产 · '+(state.data.share.expires_at?'有效至 '+new Date(state.data.share.expires_at).toLocaleDateString():'长期有效')+'</span></div></div><div class="share-head-actions">'+
            (permissions.download?'<a href="'+attr(asset.media_url+'&download=true')+'" aria-label="下载当前资产">'+icon('download')+'<span>下载</span></a>':'')+'<button type="button" data-copy-link>'+icon('link')+'<span>复制链接</span></button></div></header>'+
            '<main class="share-main"><aside class="share-assets">'+state.data.assets.map((item,index)=>'<button type="button" class="share-asset-row '+(index===state.index?'active':'')+'" data-asset-index="'+index+'" aria-pressed="'+(index===state.index)+'"><span class="share-asset-thumb">'+thumb(item)+'</span><span><strong>'+esc(item.name)+'</strong><span>'+esc(item.kind)+'</span></span></button>').join('')+'</aside>'+
            '<section class="share-stage-wrap">'+annotationHelp+'<div class="share-stage" data-draw-surface'+drawSurfaceAttributes+'>'+media(asset)+(asset.kind!=='audio'?annotations():'')+'<div class="share-watermark">'+esc(watermark)+'</div></div>'+annotationStatus+
            (permissions.comment?'<div class="share-tools"><button type="button" class="'+(state.tool==='pin'?'active':'')+'" data-tool="pin" aria-pressed="'+(state.tool==='pin')+'">'+icon('map-pin')+'标记</button><button type="button" class="'+(state.tool==='rect'?'active':'')+'" data-tool="rect" aria-pressed="'+(state.tool==='rect')+'">'+icon('square')+'框选</button><button type="button" class="'+(state.tool==='freehand'?'active':'')+'" data-tool="freehand" aria-pressed="'+(state.tool==='freehand')+'">'+icon('pencil')+'画笔</button><button type="button" data-clear>'+icon('eraser')+'清除</button>'+(asset.kind==='video'?'<button type="button" data-time>'+icon('timer')+'取时间点</button>':'')+(state.timecodeMs!==null?'<span class="share-time">'+timecode(state.timecodeMs)+'</span>':'')+'</div>':'')+'</section>'+
            '<aside class="share-review"><div class="share-review-head"><strong>审阅意见</strong></div>'+
            (permissions.comment?'<div class="share-approval"><span>版本结论</span><div><button type="button" data-approval="changes_requested">需修改</button><button type="button" data-approval="approved">通过</button></div></div>':'')+
            '<div class="share-comments">'+(comments.map(comment).join('')||'<div class="share-empty">暂无评论</div>')+'</div>'+
            (permissions.comment?'<form id="shareCommentForm" class="share-comment-form"><textarea name="body" placeholder="输入意见，或在画面上标记…"></textarea><div><input name="guest_name" value="'+attr(localStorage.getItem('asset_review_guest')||'')+'" placeholder="您的称呼" required><button class="share-primary" type="submit">'+icon('send')+'发布</button></div></form>':'')+'</aside></main>';
        lucide?.createIcons();
    }
    function refreshSvg(){
        const svg=document.getElementById('shareAnnotationSvg');if(!svg)return;
        const values=(current()?.review?.comments||[]).flatMap(comment=>comment.annotations||[]);if(state.draft)values.push({...state.draft,_draft:true});
        svg.innerHTML=values.map(value=>annotationSvg(value,value._draft)).join('');
    }
    function announceAnnotation(message){
        const status=document.getElementById('shareAnnotationStatus');
        if(status)status.textContent=message;
    }
    function clampAnnotationPoint(point){
        return {x:Math.max(0,Math.min(1,Number(point?.x)||0)),y:Math.max(0,Math.min(1,Number(point?.y)||0))};
    }
    function updateKeyboardDraft(){
        if(!state.start)return;
        const point=clampAnnotationPoint(state.keyboardPoint);
        if(state.tool==='rect')state.draft={kind:'rect',geometry:{x:Math.min(state.start.x,point.x),y:Math.min(state.start.y,point.y),width:Math.abs(point.x-state.start.x),height:Math.abs(point.y-state.start.y)},style:{color:'#ffb020',width:4}};
        if(state.tool==='freehand'){
            const last=state.points[state.points.length-1];
            if(!last||last.x!==point.x||last.y!==point.y)state.points.push(point);
            state.draft={kind:'freehand',geometry:{points:state.points.slice(-5000)},style:{color:'#ffb020',width:4}};
        }
        refreshSvg();
    }
    function handleStageKeyboard(event,surface){
        if(!state.data?.share?.permissions?.comment||event.target.id==='shareMedia')return;
        const step=event.shiftKey?0.1:0.02;
        const movement={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[event.key];
        if(movement){
            event.preventDefault();
            state.keyboardPoint=clampAnnotationPoint({x:state.keyboardPoint.x+movement[0],y:state.keyboardPoint.y+movement[1]});
            updateKeyboardDraft();
            surface.setAttribute('aria-label','批注画布，当前位置 '+Math.round(state.keyboardPoint.x*100)+'%，'+Math.round(state.keyboardPoint.y*100)+'%');
            return;
        }
        if(event.key==='Escape'&&state.start){
            event.preventDefault();state.start=null;state.points=[];state.draft=null;refreshSvg();announceAnnotation('已取消当前批注');return;
        }
        if(event.key!=='Enter'&&event.key!==' ')return;
        event.preventDefault();
        const point=clampAnnotationPoint(state.keyboardPoint);
        if(state.tool==='pin'){
            state.draft={kind:'pin',geometry:point,style:{color:'#ffb020',width:4}};refreshSvg();announceAnnotation('已放置标记，填写意见后发布');return;
        }
        if(!state.start){
            state.start=point;state.points=[point];state.draft=null;announceAnnotation('已设置批注起点，使用方向键调整后再次按 Enter 完成');return;
        }
        updateKeyboardDraft();state.start=null;state.points=[];announceAnnotation('已完成批注，填写意见后发布');
    }
    function position(event,surface){const rect=surface.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height))};}
    function down(event,surface){
        if(!state.data?.share?.permissions?.comment||['VIDEO','AUDIO','BUTTON'].includes(event.target.tagName))return;
        const point=position(event,surface);state.keyboardPoint=point;state.start=point;state.points=[point];
        if(state.tool==='pin'){state.draft={kind:'pin',geometry:point,style:{color:'#ffb020',width:4}};state.start=null;refreshSvg();announceAnnotation('已放置标记，填写意见后发布');}
    }
    function move(event,surface){
        if(!state.start)return;const point=position(event,surface);
        if(state.tool==='rect')state.draft={kind:'rect',geometry:{x:Math.min(state.start.x,point.x),y:Math.min(state.start.y,point.y),width:Math.abs(point.x-state.start.x),height:Math.abs(point.y-state.start.y)},style:{color:'#ffb020',width:4}};
        if(state.tool==='freehand'){state.points.push(point);state.draft={kind:'freehand',geometry:{points:state.points.slice(-5000)},style:{color:'#ffb020',width:4}};}
        refreshSvg();
    }
    function up(event,surface){if(!state.start)return;move(event,surface);state.start=null;state.points=[];}
    async function submitComment(form){
        const asset=current();const values=new FormData(form);const guest=String(values.get('guest_name')||'访客');localStorage.setItem('asset_review_guest',guest);
        try{
            const result=await readJson(assetShareApi.createPublicShareComment(token,{ticket:state.data.ticket,asset_id:asset.id,guest_name:guest,body:String(values.get('body')||''),timecode_ms:state.timecodeMs,annotations:state.draft?[state.draft]:[]}));
            asset.review.comments.push(result.comment);state.draft=null;state.timecodeMs=null;render();
        }catch(err){alert(err.message);}
    }
    async function approve(status){
        const asset=current();const guest=localStorage.getItem('asset_review_guest')||prompt('您的称呼')||'访客';const note=prompt(status==='approved'?'审批说明（可选）':'请说明修改意见')??'';
        try{const result=await readJson(assetShareApi.updatePublicShareApproval(token,{ticket:state.data.ticket,asset_id:asset.id,guest_name:guest,status,note}));asset.review.approvals.unshift(result.approval);render();}catch(err){alert(err.message);}
    }
    document.addEventListener('submit',event=>{if(event.target.id==='shareAccessForm'){event.preventDefault();unlock(new FormData(event.target).get('password')||'');}if(event.target.id==='shareCommentForm'){event.preventDefault();submitComment(event.target);}});
    document.addEventListener('click',event=>{
        const asset=event.target.closest?.('[data-asset-index]');if(asset){state.index=Number(asset.dataset.assetIndex);state.draft=null;state.start=null;state.points=[];state.timecodeMs=null;state.keyboardPoint={x:0.5,y:0.5};render();document.querySelectorAll('[data-asset-index]')[state.index]?.focus();return;}
        const tool=event.target.closest?.('[data-tool]');if(tool){state.tool=tool.dataset.tool;document.querySelectorAll('[data-tool]').forEach(node=>{const active=node===tool;node.classList.toggle('active',active);node.setAttribute('aria-pressed',String(active));});announceAnnotation('已选择'+tool.textContent.trim()+'工具');return;}
        if(event.target.closest?.('[data-clear]')){state.draft=null;state.start=null;state.points=[];refreshSvg();announceAnnotation('已清除当前批注');return;}
        if(event.target.closest?.('[data-time]')){state.timecodeMs=Math.round(Number(document.getElementById('shareMedia')?.currentTime||0)*1000);render();return;}
        const seek=event.target.closest?.('[data-seek]');if(seek){const media=document.getElementById('shareMedia');media.currentTime=Number(seek.dataset.seek)/1000;media.play?.();return;}
        const approval=event.target.closest?.('[data-approval]');if(approval)approve(approval.dataset.approval);
        if(event.target.closest?.('[data-copy-link]'))navigator.clipboard.writeText(location.href);
    });
    document.addEventListener('pointerdown',event=>{const surface=event.target.closest?.('[data-draw-surface]');if(surface)down(event,surface);});
    document.addEventListener('pointermove',event=>{const surface=document.querySelector('[data-draw-surface]');if(surface)move(event,surface);});
    document.addEventListener('pointerup',event=>{const surface=document.querySelector('[data-draw-surface]');if(surface)up(event,surface);});
    document.addEventListener('keydown',event=>{const surface=event.target.closest?.('[data-draw-surface]');if(surface)handleStageKeyboard(event,surface);});
    load();
})();
