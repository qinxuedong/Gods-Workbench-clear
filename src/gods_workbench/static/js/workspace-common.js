(function(){
  const locale = () => window.StudioI18n?.lang?.() === 'en' ? 'en-US' : 'zh-CN';
  const tr = (key, fallback = key) => {
    const value = window.StudioI18n?.t?.(key);
    return value && value !== key ? value : fallback;
  };
  const trf = (key, values, fallback) => Object.entries(values || {}).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    tr(key, fallback),
  );
  const api = async (url, options={}) => {
    const response = await fetch(url, options);
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch (_) { data = {}; }
    const plainDetail = raw && raw.trim();
    const fallbackDetail = plainDetail && !/^Internal Server Error$/i.test(plainDetail)
      ? plainDetail
      : trf('common.requestFailed', {status:response.status}, `请求失败 (${response.status})`);
    if(!response.ok) throw new Error(data.detail || data.message || fallbackDetail);
    return data;
  };
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const timeValue = value => {
    const number = Number(value || 0);
    return number && number < 1e12 ? number * 1000 : number;
  };
  const relativeTime = value => {
    const timestamp = timeValue(value);
    if(!timestamp) return '—';
    const diff = Math.max(0, Date.now() - timestamp);
    const minute = Math.floor(diff / 60000);
    if(minute < 1) return tr('common.justNow', '刚刚');
    if(minute < 60) return trf('common.minutesAgo', {count:minute}, `${minute} 分钟前`);
    const hour = Math.floor(minute / 60);
    if(hour < 24) return trf('common.hoursAgo', {count:hour}, `${hour} 小时前`);
    const day = Math.floor(hour / 24);
    return day < 30
      ? trf('common.daysAgo', {count:day}, `${day} 天前`)
      : new Date(timestamp).toLocaleDateString(locale());
  };
  const dateTime = value => {
    const timestamp = timeValue(value);
    return timestamp ? new Date(timestamp).toLocaleString(locale(), {month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—';
  };
  const navigate = (page, params = {}) => {
    const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && String(value));
    // 经典版页面已删除：把旧路由别名重定向到 V2 对应页面，避免落到已下线的 /static/<page>.html。
    const v2PageAliases = { 'project-board': 'v2/projects' };
    const standalonePage = page === 'canvas' ? 'canvas-list' : (v2PageAliases[page] || page);
    try {
      const target = parent.document.getElementById(`frame-${page}`);
      if (target && entries.length) {
        const source = target.dataset.src || target.getAttribute('src') || `/static/${standalonePage}.html`;
        const destination = new URL(source, parent.location.origin);
        entries.forEach(([key, value]) => destination.searchParams.set(key, String(value)));
        if(page === 'canvas') destination.searchParams.set('m3', 'f1b');
        target.src = `${destination.pathname}${destination.search}${destination.hash}`;
      }
      const navEl = parent.document.getElementById(`main-nav-${page}`)
        || (page === 'project-board' ? parent.document.getElementById('main-nav-project') : null)
        || (page === 'asset-manager' ? parent.document.getElementById('main-nav-assets') : null)
        || parent.document.querySelector(`[onclick*="'${page}'"]`)
        || null;
      parent.switchUI(navEl, page);
    } catch(e) {
      const destination = new URL(`/static/${standalonePage}.html`, location.origin);
      entries.forEach(([key, value]) => destination.searchParams.set(key, String(value)));
      if(page === 'canvas') destination.searchParams.set('m3', 'f1b');
      location.href = `${destination.pathname}${destination.search}${destination.hash}`;
    }
  };
  const syncTheme = theme => {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    document.body?.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  };
  let touchbarRevision = 0;
  const touchbarStableId = value => {
    const id = String(value == null ? '' : value).trim();
    return /^[A-Za-z0-9][A-Za-z0-9_.:@-]{0,191}$/.test(id) ? id : '';
  };
  const touchbarSteps = new Set(['script', 'assets', 'video', 'audio_compose']);
  const touchbarStep = value => {
    const step = String(value == null ? '' : value).trim();
    return touchbarSteps.has(step) ? step : '';
  };
  const touchbarContext = value => {
    const source = value && typeof value === 'object' ? value : {};
    return ['project_id', 'entity_id', 'canvas_id', 'asset_id', 'job_id', 'episode_pipeline_id', 'pipeline_id', 'episode_stage_job_id'].reduce((result, key) => {
      const id = touchbarStableId(source[key]);
      if (id) result[key] = id;
      return result;
    }, {});
  };
  const reportTouchbarCapabilities = value => {
    if (window.parent === window || !value || typeof value !== 'object') return false;
    const page = String(value.page || '').trim();
    if (!page) return false;
    const context = touchbarContext(value.context);
    const rawSelection = value.selection && typeof value.selection === 'object' ? value.selection : null;
    const selectionId = touchbarStableId(rawSelection?.id || rawSelection?.stable_id);
    const selection = selectionId ? {
      type: String(rawSelection.type || '').trim().toLowerCase().slice(0, 32),
      id: selectionId,
      label: String(rawSelection.label || rawSelection.name || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 100),
      status: String(rawSelection.status || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 36),
    } : null;
    const step = touchbarStep(value.step || value.episode_stage || value.context?.episode_stage);
    const episodeStage = touchbarStep(value.episode_stage || value.step || value.context?.episode_stage);
    const episodeStageJobId = touchbarStableId(value.episode_stage_job_id || value.context?.episode_stage_job_id);
    const pipelineId = touchbarStableId(value.pipeline_id || value.context?.pipeline_id || value.context?.episode_pipeline_id);
    const pipelineStatus = String(value.pipeline_status || value.pipeline?.status || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 48);
    const rawPipelineSelection = value.pipeline_selection && typeof value.pipeline_selection === 'object' ? value.pipeline_selection : null;
    const pipelineSelectionId = touchbarStableId(rawPipelineSelection?.pipeline_id || rawPipelineSelection?.id || pipelineId);
    const pipelineSelectionStatus = String(rawPipelineSelection?.status || pipelineStatus).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 48);
    const actions = (Array.isArray(value.actions) ? value.actions : []).slice(0, 16).map(item => {
      const actionId = typeof item === 'string' ? item : item?.action_id;
      if (typeof actionId !== 'string') return null;
      const action = {action_id: actionId.slice(0, 80)};
      const actionStep = touchbarStep(item?.step || item?.episode_stage);
      const placement = ['left', 'main', 'right'].includes(String(item?.placement || '').trim()) ? String(item.placement).trim() : '';
      if (actionStep) action.step = actionStep;
      if (placement) action.placement = placement;
      if (item && typeof item === 'object' && item.enabled === false) action.enabled = false;
      return action;
    }).filter(Boolean);
    try {
      const payload = {
        type: 'gw-touchbar-capabilities',
        version: 1,
        revision: ++touchbarRevision,
        page,
        context,
        selection,
        actions,
        status: String(value.status || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 48),
      };
      if (step) payload.step = step;
      if (episodeStage) payload.episode_stage = episodeStage;
      if (episodeStageJobId) payload.episode_stage_job_id = episodeStageJobId;
      if (pipelineId) payload.pipeline_id = pipelineId;
      if (pipelineStatus) payload.pipeline_status = pipelineStatus;
      if (pipelineSelectionId) payload.pipeline_selection = {
        pipeline_id: pipelineSelectionId,
        status: pipelineSelectionStatus,
      };
      window.parent.postMessage(payload, location.origin);
      return true;
    } catch (_) {
      return false;
    }
  };
  const storedTheme = () => localStorage.getItem('studio_theme') || localStorage.getItem('canvas_theme') || localStorage.getItem('theme') || 'dark';
  window.addEventListener('message', event => {
    if(event.origin && event.origin !== location.origin) return;
    if(['theme-change','studio-theme'].includes(event.data?.type)) syncTheme(event.data.theme);
  });
  syncTheme(storedTheme());
  window.Workspace = {api, escapeHtml, relativeTime, dateTime, navigate, syncTheme, timeValue, reportTouchbarCapabilities};
})();
