(function () {
  'use strict';

  const CONTEXT_KEYS = ['project_id', 'entity_id', 'canvas_id', 'asset_id', 'job_id'];
  const PAGE_LABELS = {
    zimage: '文生图',
    enhance: '细节增强',
    klein: '图片编辑',
    angle: '角度控制',
    online: '在线生图',
    video: '视频生成',
  };
  const STAGE_ACTIONS = {
    zimage: ['generator.open-enhance', 'generator.open-klein', 'generator.open-angle', 'generator.open-video', 'generator.open-online'],
    enhance: ['generator.open-zimage', 'generator.open-klein', 'generator.open-angle', 'generator.open-video', 'generator.open-online'],
    klein: ['generator.open-zimage', 'generator.open-enhance', 'generator.open-angle', 'generator.open-video', 'generator.open-online'],
    angle: ['generator.open-zimage', 'generator.open-enhance', 'generator.open-klein', 'generator.open-video', 'generator.open-online'],
    online: ['generator.open-zimage', 'generator.open-enhance', 'generator.open-klein', 'generator.open-angle', 'generator.open-video'],
    video: ['generator.open-zimage', 'generator.open-enhance', 'generator.open-klein', 'generator.open-angle', 'generator.open-online'],
  };
  const STATUS_LABELS = {
    submitting: '正在提交',
    queued: '已排队',
    pending: '待处理',
    running: '运行中',
    recovering: '恢复中',
    remote_pending: '上游排队',
    cancel_requested: '正在取消',
    succeeded: '已完成',
    failed: '失败',
    canceled: '已取消',
    interrupted: '已中断',
  };

  const path = location.pathname.split('/').pop() || '';
  const page = path.replace(/\.html$/i, '').trim();
  if (!Object.prototype.hasOwnProperty.call(PAGE_LABELS, page)) return;

  function stableId(value) {
    const id = String(value == null ? '' : value).trim();
    return /^[A-Za-z0-9][A-Za-z0-9_.:@-]{0,191}$/.test(id) ? id : '';
  }

  function boundedText(value, maximum) {
    const text = String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
    return STATUS_LABELS[text.toLowerCase()] || text.slice(0, maximum);
  }

  function normalizedContext(source) {
    const value = source && typeof source === 'object' ? source : {};
    return CONTEXT_KEYS.reduce((context, key) => {
      const id = stableId(value[key]);
      if (id) context[key] = id;
      return context;
    }, {});
  }

  const params = new URLSearchParams(location.search);
  const state = {
    context: normalizedContext(Object.fromEntries(CONTEXT_KEYS.map(key => [key, params.get(key)]))),
    jobId: '',
    status: '',
    timer: 0,
  };
  state.jobId = state.context.job_id || '';

  function report() {
    const context = {...state.context};
    if (state.jobId) context.job_id = state.jobId;
    else delete context.job_id;
    window.Workspace?.reportTouchbarCapabilities?.({
      page,
      context,
      selection: state.jobId ? {
        type: 'job',
        id: state.jobId,
        label: `${PAGE_LABELS[page]}任务`,
        status: state.status,
      } : null,
      actions: STAGE_ACTIONS[page],
      status: state.status,
    });
  }

  function schedule() {
    window.clearTimeout(state.timer);
    state.timer = window.setTimeout(report, 0);
  }

  function update(value) {
    const next = value && typeof value === 'object' ? value : {};
    const context = normalizedContext(next.context);
    Object.assign(state.context, context);
    CONTEXT_KEYS.forEach(key => {
      if (!Object.prototype.hasOwnProperty.call(next, key)) return;
      const id = stableId(next[key]);
      if (id) state.context[key] = id;
      else delete state.context[key];
    });
    if (Object.prototype.hasOwnProperty.call(next, 'job_id') || Object.prototype.hasOwnProperty.call(next, 'jobId')) {
      state.jobId = stableId(next.job_id ?? next.jobId);
      if (state.jobId) state.context.job_id = state.jobId;
      else delete state.context.job_id;
    }
    if (Object.prototype.hasOwnProperty.call(next, 'status')) state.status = boundedText(next.status, 48);
    schedule();
  }

  window.GeneratorTouchbarContext = Object.freeze({report, update});
  report();
  window.addEventListener('load', report, {once: true});
})();
