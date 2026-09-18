/** Read-only projections of the existing collaboration APIs. */
window.V2Collab = (() => {
  'use strict';
  const projectId = new URLSearchParams(location.search).get('project_id') || '';
  const pageState = () => ({items: [], status: 'loading', cursor: '', window: null, busy: false});
  const state = {members: pageState(), teams: pageState(), tasks: pageState(), logs: pageState(), audit: pageState(), approvals: pageState(), view: 'tasks'};
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const el = id => document.getElementById(id);
  const dateText = value => {
    if (!value) return '时间未知';
    const n = Number(value);
    const date = Number.isFinite(n) ? new Date(n < 100000000000 ? n * 1000 : n) : new Date(value);
    return Number.isNaN(date.getTime()) ? '时间未知' : date.toLocaleString('zh-CN', {month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'});
  };
  const statusText = status => ({loading:'读取中', ready:'已读取', unauthorized:'请先登录', forbidden:'无读取权限', error:'读取失败，请刷新重试', degraded:'数据源降级，结果可能不完整'}[status] || status);
  const empty = (page, message) => '<div class="collab-empty">' + esc(page.status === 'ready' ? message : statusText(page.status)) + '</div>';
  const roles = {admin:'管理员', editor:'编辑者', reviewer:'审阅者'};

  function renderMembers() {
    const page = state.members;
    el('collabOnlineCount').textContent = page.status === 'ready' ? page.items.length + ' 个账户' : statusText(page.status);
    el('collabMemberList').innerHTML = page.items.length ? page.items.map(member => {
      const teams = state.teams.items.filter(team => (team.members || []).some(m => m.user_id === member.id));
      const teamText = state.teams.status === 'ready' ? (teams.map(t => t.name).join('、') || '未加入团队') : '团队：' + statusText(state.teams.status);
      return '<article class="collab-task-item"><strong>' + esc(member.display_name || member.username || member.id) + '</strong><p>' + esc(roles[member.role] || member.role || '未分配角色') + ' · ' + esc(member.status === 'active' ? '账户启用' : member.status === 'disabled' ? '账户停用' : member.status || '状态未知') + '</p><p>' + esc(teamText) + '</p></article>';
    }).join('') : empty(page, '暂无可见协同席位。');
    if (page.status === 'ready') el('collabMemberList').innerHTML += '<p class="collab-empty">在线状态未接入。</p>';
  }

  function updateMore(id, page) {
    const button = el(id);
    button.hidden = !page.cursor;
    button.disabled = page.busy;
    button.textContent = page.busy ? '读取中…' : page.status === 'error' ? '重试加载' : '加载更多';
  }

  function renderTimeline() {
    const page = state.audit;
    el('collabAuditScope').textContent = (projectId ? '当前工程' : '全局') + '变更审计 · 最近 24 小时';
    el('collabTimeline').innerHTML = page.items.length ? page.items.map(event => '<article class="collab-task-item"><div class="flex justify-between gap-2"><strong>' + esc(event.event_name || '变更审计') + '</strong><time>' + esc(dateText(event.timestamp)) + '</time></div><p>' + esc(event.actor_id || '系统') + ' · ' + esc(event.message_safe || '审计活动已记录') + '</p></article>').join('') : empty(page, '最近 24 小时暂无可见变更审计。');
    el('collabTimelineState').textContent = page.status === 'ready' ? page.items.length + ' 条审计' : statusText(page.status);
    updateMore('collabAuditMore', page);
  }

  function renderApprovals() {
    const page = state.approvals;
    el('collabApprovalCount').textContent = page.status === 'ready' ? '最近 ' + page.items.length + ' 条 · ' + page.items.filter(a => a.status === 'pending').length + ' 待处理' : statusText(page.status);
    el('collabApprovalList').innerHTML = page.items.length ? page.items.map(a => '<article class="collab-approval-item"><div class="flex justify-between gap-2"><strong>' + esc(a.action || '操作申请') + '</strong><span class="text-xs">' + esc(({pending:'待审批', approved:'已通过', rejected:'已拒绝'})[a.status] || a.status) + '</span></div><p>' + esc(a.requester_name || a.requester_username || a.requested_by || '未知账户') + ' · ' + esc(dateText(a.operation_created_at || a.created_at)) + '</p></article>').join('') : empty(page, '暂无审批记录。');
  }

  function renderTaskFeed() {
    const page = state[state.view];
    const tasks = state.view === 'tasks';
    el('collabTaskFeed').innerHTML = page.items.length ? page.items.map(item => {
      const title = tasks ? (item.summary || item.title || item.job_type || item.job_id) : (item.message_safe || item.event_name || '运行事件');
      const meta = tasks ? (item.status || 'unknown') + ' · ' + (item.job_id || '') : (item.level || 'INFO') + ' · ' + (item.source || '');
      return '<article class="collab-task-item"><div class="flex justify-between gap-2"><strong>' + esc(title) + '</strong><time>' + esc(dateText(item.updated_at || item.timestamp || item.created_at)) + '</time></div><p>' + esc(meta) + '</p></article>';
    }).join('') : empty(page, tasks ? '暂无可见任务。' : '最近 24 小时暂无可见日志。');
    el('collabTaskState').textContent = (tasks ? '全部时间任务' : '全部来源日志 · 最近 24 小时') + ' · ' + (page.status === 'ready' ? '已加载 ' + page.items.length + ' 条' : statusText(page.status));
    updateMore('collabTaskMore', page);
  }

  function render(key) {
    if (key === 'members' || key === 'teams') renderMembers();
    else if (key === 'audit') renderTimeline();
    else if (key === 'approvals') renderApprovals();
    else renderTaskFeed();
  }

  function requestUrl(key, page) {
    if (key === 'members') return '/api/asset-auth/users';
    if (key === 'teams') return '/api/asset-auth/teams';
    if (key === 'approvals') return '/api/asset-auth/operation-approvals?status=all&limit=100';
    const params = new URLSearchParams({range:key === 'tasks' ? 'all' : '24h', limit:'100'});
    if (key === 'audit') {
      params.set('source', 'audit_logs');
      if (projectId) params.set('project_id', projectId);
    }
    if (page.cursor) params.set('cursor', page.cursor);
    // Event cursors are scoped to an exact window, which must survive pagination.
    if (page.window) {
      params.set('start_ms', String(page.window.start));
      params.set('end_ms', String(page.window.end));
    }
    return '/api/observability/' + (key === 'tasks' ? 'tasks' : 'events') + '?' + params;
  }

  async function loadPage(key, more = false) {
    const page = state[key];
    if (page.busy) return;
    if (!more) Object.assign(page, pageState());
    page.busy = true;
    render(key);
    try {
      const response = await fetch(requestUrl(key, page), {credentials:'same-origin', cache:'no-store', signal:AbortSignal.timeout(15000)});
      if (!response.ok) {
        page.status = response.status === 401 ? 'unauthorized' : response.status === 403 ? 'forbidden' : 'error';
        if (response.status === 401 || response.status === 403) { page.items = []; page.cursor = ''; }
        return;
      }
      const data = await response.json();
      const field = {members:'users', teams:'teams', approvals:'approvals'}[key] || 'items';
      if (!Array.isArray(data[field])) throw new Error('Invalid API response');
      page.items = more ? page.items.concat(data[field]) : data[field];
      page.status = data.data_status === 'degraded' ? 'degraded' : 'ready';
      page.cursor = data.has_more ? data.next_cursor || '' : '';
      if (data.start_ms != null && data.end_ms != null) page.window = {start:data.start_ms, end:data.end_ms};
    } catch (_) {
      page.status = 'error';
    } finally {
      page.busy = false;
      render(key);
    }
  }

  async function refresh() {
    const button = el('collabRefresh');
    button.disabled = true;
    try { await Promise.all(['members', 'teams', 'tasks', 'logs', 'audit', 'approvals'].map(key => loadPage(key))); }
    finally { button.disabled = false; }
  }

  function bindTabs() {
    const tabs = [...document.querySelectorAll('[data-collab-view]')];
    tabs.forEach((button, index) => {
      button.tabIndex = index ? -1 : 0;
      button.addEventListener('click', () => {
        state.view = button.dataset.collabView === 'logs' ? 'logs' : 'tasks';
        tabs.forEach(item => {
          const active = item === button;
          item.classList.toggle('active', active);
          item.setAttribute('aria-selected', String(active));
          item.tabIndex = active ? 0 : -1;
        });
        document.querySelector('[data-collab-route-link]').href = '/static/task-center.html?view=' + state.view;
        renderTaskFeed();
      });
      button.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const target = tabs[event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
        target.focus();
        target.click();
      });
    });
  }

  async function openTeamManagement(tab = '') {
    try {
      if (!window.AssetReview?.openTeamManagement) throw new Error('团队管理模块尚未加载，请刷新页面后重试。');
      await window.AssetReview.openTeamManagement(tab);
    } catch (error) { window.alert(error.message || '团队管理读取失败，请稍后重试。'); }
  }

  function init() {
    bindTabs();
    el('collabRefresh').addEventListener('click', refresh);
    el('collabTaskMore').addEventListener('click', () => loadPage(state.view, true));
    el('collabAuditMore').addEventListener('click', () => loadPage('audit', true));
    refresh();
    window.lucide?.createIcons();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  return {openTeamManagement};
})();
