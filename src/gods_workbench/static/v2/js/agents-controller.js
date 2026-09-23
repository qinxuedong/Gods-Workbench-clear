/**
 * Gods' Workbench v2 - 智能体神经中枢控制器 (agents-controller.js)
 */

window.V2Agents = (function () {
  'use strict';

  // 内置示例目录：**未接入后端**。本切片无智能体运行时端点（/api/chat/agent 未实现），
  // 因此 status 一律为 not_integrated，绝不静态声称 online。
  const state = {
    agents: [
      { id: 'aura-01', name: 'AURA·核心调度脑', role: '系统编排与逻辑拆解', status: 'not_integrated', model: 'Claude-3.5-Sonnet', active: true },
      { id: 'flux-02', name: 'FLUX-PRO 电影原画师', role: '4K ACEScg 视觉生成', status: 'not_integrated', model: 'FLUX.1-DEV + LoRA', active: false },
      { id: 'script-03', name: 'SCRIPT-ARCH 剧本架构师', role: '文学分镜与冲突提炼', status: 'not_integrated', model: 'DeepSeek-R1 / V3', active: false, route: '/static/episode-pipeline.html?agent=script-03' },
      { id: 'vox-04', name: 'VOX-SYNCLIP 配音合成师', role: '音效唇形与声音克隆', status: 'not_integrated', model: 'Wav2Lip + GPT-SoVITS', active: false }
    ],
    traces: [],
    traceUnsubscribe: null
  };

  const esc = str => String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function renderAgents() {
    const list = document.getElementById('agentList');
    if (!list) return;

    list.innerHTML = state.agents.map(ag => `
      <div class="tree-node-card ${ag.active ? 'active' : ''} p-2 cursor-pointer transition" role="button" tabindex="0" onclick="V2Agents.selectAgent('${ag.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();V2Agents.selectAgent('${ag.id}')}" aria-label="选择 ${esc(ag.name)}">
        <div class="flex items-center justify-between mb-1">
          <div class="font-bold text-slate-100 text-xs truncate">${esc(ag.name)}</div>
          ${ag.route ? `<a href="${esc(ag.route)}" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-[#dfc384] shrink-0" title="打开剧本架构师路由" aria-label="打开剧本架构师路由" onclick="event.stopPropagation()"><i data-lucide="external-link" class="w-3 h-3"></i></a>` : ''}
          <span class="text-[7.5px] font-mono px-1 py-0.5 rounded-full ${ag.status === 'online' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'}"${ag.status === 'not_integrated' ? ' data-gw-degradation="not_integrated"' : ''}>
            ${ag.status === 'not_integrated' ? '未接入' : ag.status}
          </span>
        </div>
        <div class="text-[8.5px] text-slate-400 truncate mb-1">${esc(ag.role)}</div>
        <div class="text-[8px] font-mono text-[#dfc384] truncate">${esc(ag.model)}</div>
      </div>
    `).join('');
  }

  function renderTraces() {
    const container = document.getElementById('agentTraceStream');
    if (!container) return;
    if (!state.traces.length) {
      container.innerHTML = '<div class="aura-trace-empty">等待剧本架构师执行记录…</div>';
      return;
    }
    container.innerHTML = state.traces.map(t => {
      let tagColor = 'text-[#dfc384] bg-[#dfc384]/15 border-[#dfc384]/30';
      if (t.tag === 'TOOL') tagColor = 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30';
      if (t.tag === 'THINK') tagColor = 'text-purple-300 bg-purple-500/15 border-purple-500/30';
      if (t.tag === 'EXEC') tagColor = 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';

      return `
        <div class="aura-trace-row" role="button" tabindex="0" data-aura-trace-id="${esc(t.id)}" aria-expanded="false" title="点击展开详情">
          <div class="aura-trace-summary text-xs">
            <span class="text-[8px] font-mono text-slate-500 shrink-0 pt-0.5">${esc(t.time)}</span>
            <span class="text-[7.5px] font-mono px-1 py-0.5 rounded border ${tagColor} shrink-0 font-bold">${esc(t.tag)}</span>
            <span class="aura-trace-summary-text text-slate-200 leading-relaxed font-sans">${esc(t.summary || t.text || '')}</span>
          </div>
          <pre class="aura-trace-detail" data-aura-trace-detail hidden>${esc(t.detail || t.text || t.summary || '')}</pre>
        </div>
      `;
    }).join('');

    container.querySelectorAll('[data-aura-trace-id]').forEach(row => {
      const detail = row.querySelector('[data-aura-trace-detail]');
      const collapse = () => { row.classList.remove('is-expanded'); row.setAttribute('aria-expanded', 'false'); if (detail) detail.hidden = true; };
      const expand = () => { row.classList.add('is-expanded'); row.setAttribute('aria-expanded', 'true'); if (detail) detail.hidden = false; };
      row.addEventListener('click', () => row.classList.contains('is-expanded') ? collapse() : expand());
      row.addEventListener('mouseleave', collapse);
      row.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); row.classList.contains('is-expanded') ? collapse() : expand(); } });
    });

    container.scrollTop = container.scrollHeight;
  }

  function appendTrace(trace) {
    if (!trace?.id || state.traces.some(item => item.id === trace.id)) return;
    state.traces.push(trace);
    state.traces = state.traces.slice(-80);
    renderTraces();
  }

  function selectAgent(id) {
    const restoreFocus = document.getElementById('agentList')?.contains(document.activeElement);
    state.agents.forEach(a => a.active = (a.id === id));
    renderAgents();
    if (restoreFocus) {
      const selected = document.querySelector('#agentList .active');
      if (selected) { selected.tabIndex = 0; selected.focus(); }
    }
    const found = state.agents.find(a => a.id === id);
    const titleEl = document.getElementById('currentAgentTitle');
    if (titleEl && found) {
      titleEl.textContent = `${found.name} (思维链路实时透视)`;
    }
    if (found?.route) {
      try { localStorage.setItem('gwb_agent_route', found.route); } catch (_) {}
      window.dispatchEvent(new CustomEvent('gw-agent-route', {detail: {agentId: found.id, route: found.route}}));
    }
  }

  function sendTestPrompt(e) {
    e.preventDefault();
    const input = document.getElementById('agentPromptInput');
    if (!input || !input.value.trim()) return;
    const val = input.value.trim();
    input.value = '';
    const operation = `AURA 测试执行 · ${val}`;
    const publish = (tag, summary, detail, status) => window.AuraTraceBus?.publish?.({
      tag,
      summary,
      detail,
      agentId: 'aura-01',
      route: 'aura-test',
      operation,
      stage: 'agent-test',
      status,
    });
    publish('INPUT', `已接收：${val}`, {message_chars: val.length}, 'running');
    publish('THINK', 'AURA 测试路由未接入：本切片没有 /api/chat/agent 端点', {route: '/api/chat/agent', degraded: 'not_integrated'}, 'running');
    publish('EXEC', `指令未发送：智能体执行端点未接入（未纳入当前切片），未产生任何真实执行结果`, {message_chars: val.length, result: 'not_integrated'}, 'not_integrated');
  }

  function createAgent() {
    alert('智能体挂载未接入：本切片没有智能体管理端点，未打开任何向导，也未挂载任何模型。');
  }

  function init() {
    state.traces = window.AuraTraceBus?.history?.() || [];
    renderAgents();
    renderTraces();
    state.traceUnsubscribe = window.AuraTraceBus?.subscribe?.(appendTrace) || null;
    window.addEventListener('gw-aura-scope', () => {
      state.traces = window.AuraTraceBus?.history?.() || [];
      renderTraces();
    });
    window.lucide?.createIcons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    selectAgent,
    sendTestPrompt,
    createAgent
  };
})();
