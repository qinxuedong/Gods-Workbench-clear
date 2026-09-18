(function(){
  const {api, escapeHtml:esc, navigate} = Workspace;
  const q = selector => document.querySelector(selector);
  const urlParams = new URLSearchParams(location.search);
  const episodeContext = {
    pipelineId: String(urlParams.get('episode_pipeline_id') || '').trim(),
    stage: String(urlParams.get('episode_stage') || '').trim(),
  };
  const state = {providers:[], reference:null, taskId:'', taskStatus:'', poll:null, episodeCallbackDone:false};
  let touchbarReportTimer = 0;

  function productionContext(){
    const context = {
      project_id: String(urlParams.get('project_id') || '').trim(),
      entity_id: String(urlParams.get('entity_id') || '').trim(),
      canvas_id: String(urlParams.get('canvas_id') || '').trim(),
      asset_id: String(urlParams.get('asset_id') || '').trim(),
    };
    return Object.fromEntries(Object.entries(context).filter(([, value]) => value));
  }
  function reportVideoTouchbarContext(){
    const context = {...productionContext(), ...(state.taskId ? {job_id:state.taskId} : {})};
    window.GeneratorTouchbarContext?.update({
      context,
      job_id: state.taskId,
      status: state.taskStatus,
    });
    if (window.GeneratorTouchbarContext) return;
    Workspace.reportTouchbarCapabilities?.({
      page: 'video',
      context,
      selection: state.taskId ? {type: 'job', id: state.taskId, label: `视频任务 ${state.taskId}`, status: state.taskStatus} : null,
      actions: ['generator.open-zimage', 'generator.open-enhance', 'generator.open-klein', 'generator.open-angle', 'generator.open-online'],
      status:state.taskStatus,
    });
  }
  function scheduleVideoTouchbarReport(){
    clearTimeout(touchbarReportTimer);
    touchbarReportTimer = setTimeout(reportVideoTouchbarContext, 0);
  }

  async function completeEpisodeStage(task, status, message=''){
    if(!episodeContext.pipelineId || !episodeContext.stage || state.episodeCallbackDone) return;
    state.episodeCallbackDone = true;
    const result = task?.result && typeof task.result === 'object' ? task.result : {};
    const assetIds = Array.isArray(result.asset_ids)
      ? result.asset_ids.map(value => String(value || '').trim()).filter(Boolean)
      : [];
    const sourceJobId = String(task?.job_id || task?.id || state.taskId || '').trim();
    try {
      await api(`/api/episode-pipelines/${encodeURIComponent(episodeContext.pipelineId)}/stages/${encodeURIComponent(episodeContext.stage)}/complete`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status, source_job_id: sourceJobId, output_asset_ids: assetIds, message: message || (status === 'succeeded' ? '视频生成已回写' : '视频生成失败')})
      });
    } catch(error) {
      state.episodeCallbackDone = false;
      q('#formHint').textContent = `阶段回写失败：${error.message || '请求失败'}`;
    }
  }

  function providerModels(provider){
    return (provider?.video_models || []).map(item=>typeof item==='string'?item:(item.id || item.name || '')).filter(Boolean);
  }
  async function loadProviders(){
    const data = await api('/api/providers');
    state.providers = (data.providers || []).filter(item=>item.enabled !== false && providerModels(item).length);
    q('#providerSelect').innerHTML = state.providers.length ? state.providers.map(item=>`<option value="${esc(item.id)}">${esc(item.name || item.id)}</option>`).join('') : '<option value="">未配置视频模型</option>';
    q('#providerState').textContent = state.providers.length ? `${state.providers.length} PROVIDERS` : 'NO PROVIDER';
    renderModels();
  }
  function renderModels(){
    const provider = state.providers.find(item=>item.id===q('#providerSelect').value) || state.providers[0];
    const models = providerModels(provider);
    q('#modelSelect').innerHTML = models.length ? models.map(model=>`<option value="${esc(model)}">${esc(provider?.model_names?.[model] || model)}</option>`).join('') : '<option value="">请先在 API 设置中配置</option>';
  }
  function setFormHint(message){ q('#formHint').textContent = message || ''; }
  async function uploadReference(file){
    const form = new FormData(); form.append('file',file);
    q('#referenceLabel').textContent = '正在上传参考图…';
    setFormHint('正在上传参考首帧');
    const data = await api('/api/ai/upload',{method:'POST',body:form});
    state.reference = {url:data.url || data.path || data.filename,name:file.name,role:'first_frame',kind:'image',mime:file.type};
    q('#referenceLabel').style.display = 'none';
    q('#referencePreview').src = URL.createObjectURL(file);
    q('#referencePreview').style.display = 'block';
    setFormHint('参考首帧已准备完成');
  }
  function setRunning(message='视频模型正在生成…'){
    q('#videoOutput').innerHTML = `<div class="run-state"><div class="spinner"></div><strong>${esc(message)}</strong><span>可以切换到任务中心查看所有系统任务。</span></div>`;
    q('#videoOutput').setAttribute('aria-busy','true');
    setFormHint(message);
    q('#submitButton').disabled = true;
    q('#submitButton').textContent = '任务运行中…';
    scheduleVideoTouchbarReport();
  }
  function finishTask(task){
    clearInterval(state.poll); state.poll = null;
    state.taskStatus = String(task.status || '');
    q('#videoOutput').setAttribute('aria-busy','false');
    q('#submitButton').disabled = false;
    q('#submitButton').textContent = '＋ 提交视频任务';
    if(task.status === 'succeeded'){
      const videos = task.result?.videos || [];
      const url = videos[0];
      q('#videoOutput').innerHTML = url ? `<div><video controls autoplay playsinline src="${esc(url)}"></video><div style="margin-top:12px;display:flex;justify-content:flex-end"><a class="btn primary" href="${esc(url)}" download>下载视频</a></div></div>` : '<div class="run-state"><strong>任务完成</strong><span>上游未返回可预览的视频地址。</span></div>';
      setFormHint(url ? '视频生成完成，可预览或下载结果' : '视频任务完成，但上游未返回可预览地址');
      void completeEpisodeStage(task, 'succeeded');
    } else {
      q('#videoOutput').innerHTML = `<div class="run-state"><strong>生成失败</strong><span>${esc(task.error || '未知错误')}</span></div>`;
      setFormHint(`视频生成失败：${task.error || '未知错误'}`);
      void completeEpisodeStage(task, 'failed', task.error || '视频生成失败');
    }
    scheduleVideoTouchbarReport();
  }
  async function pollTask(){
    if(!state.taskId) return;
    const task = await api(`/api/video-tasks/${encodeURIComponent(state.taskId)}`);
    state.taskStatus = String(task.status || '');
    if(['succeeded','failed'].includes(task.status)) finishTask(task);
    else setRunning(task.message || ({queued:'等待调度…',running:'视频模型正在生成…'}[task.status] || '任务处理中…'));
  }
  async function submit(event){
    event.preventDefault();
    const provider = q('#providerSelect').value, model = q('#modelSelect').value, prompt = q('#promptInput').value.trim();
    if(!provider || !model) throw new Error('请先配置可用的视频服务商与模型');
    if(!prompt) throw new Error('请填写画面描述');
    const seedValue = q('#seedInput').value.trim();
    const payload = {prompt,provider_id:provider,model,duration:Number(q('#durationSelect').value),aspect_ratio:q('#ratioSelect').value,resolution:q('#resolutionSelect').value,images:state.reference?[state.reference]:[],enhance_prompt:q('#enhanceInput').checked,generate_audio:q('#audioInput').checked,production_context:productionContext()};
    if(seedValue) payload.seed = Number(seedValue);
    setRunning('正在提交视频任务…');
    const data = await api('/api/video-tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    state.taskId = data.task_id; q('#taskId').textContent = data.task_id;
    state.taskStatus = 'queued';
    scheduleVideoTouchbarReport();
    await pollTask(); state.poll = setInterval(()=>pollTask().catch(error=>finishTask({status:'failed',error:error.message})),3000);
  }
  document.addEventListener('click',event=>{const nav=event.target.closest('[data-nav]');if(nav)navigate(nav.dataset.nav);});
  q('#providerSelect').addEventListener('change',renderModels);
  q('#referenceInput').addEventListener('change',event=>event.target.files[0]&&uploadReference(event.target.files[0]).catch(error=>{q('#referenceLabel').textContent=error.message;q('#referencePreview').style.display='none';setFormHint(`参考首帧上传失败：${error.message}`);}));
  if(episodeContext.stage === 'audio_compose') q('#audioInput').checked = true;
  q('#videoForm').addEventListener('submit',event=>submit(event).catch(error=>{q('#submitButton').disabled=false;q('#submitButton').textContent='＋ 提交视频任务';q('#videoOutput').setAttribute('aria-busy','false');q('#videoOutput').innerHTML=`<div class="run-state"><strong>无法提交</strong><span>${esc(error.message)}</span></div>`;setFormHint(`视频任务提交失败：${error.message}`);}));
  loadProviders().catch(error=>{q('#providerState').textContent='ERROR';q('#formHint').textContent=error.message;});
  scheduleVideoTouchbarReport();
})();
