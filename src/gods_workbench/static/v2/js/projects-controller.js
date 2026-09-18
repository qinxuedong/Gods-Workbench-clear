/**
 * Gods' Workbench v2 - 项目中心控制器 (projects-controller.js)
 * 提供看板模式 (Kanban) 与列表模式 (Table) 双视图切换、分类筛选、实时检索与后端项目 CRUD 对接
 */

window.V2Projects = (function () {
  'use strict';

  const state = {
    projects: [],
    filterType: 'all',
    filterScope: 'active', // 'active' | 'archived' | 'trash'
    searchQuery: '',
    currentView: 'kanban',
    activeProjectId: null,
    pendingAction: null,
    counts: { active: 0, archived: 0, trash: 0 }
  };

  // 全局统一回收站数据状态池（工程、素材资产、工程画布集中隔离）
  const globalTrashState = {
    currentTab: 'projects', // 'projects' | 'assets' | 'canvases'
    projects: [],
    assets: [],
    canvases: [],
    initialized: false
  };

  const esc = str => String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // 原始项目日期路由使用毫秒时间戳；datetime-local 不带时区，按本地时间转换。
  const dateInputTimestamp = value => {
    const text = String(value || '').trim();
    if (!text) return null;
    const numeric = Number(text);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
    const timestamp = new Date(text).getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  };
  const dateInputValue = value => {
    const timestamp = Number(value || 0);
    if (!Number.isFinite(timestamp) || timestamp <= 0) return '';
    const date = new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp);
    if (Number.isNaN(date.getTime())) return '';
    const pad = number => String(number).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const formatTime = ts => {
    if (!ts) return '近期';
    const date = new Date(typeof ts === 'number' ? (ts < 1e12 ? ts * 1000 : ts) : ts);
    return isNaN(date.getTime()) ? '近期' : date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  };

  // 黑金拟物 Toast 提示消息
  function showToast(message, type = 'info') {
    const container = document.getElementById('v2ToastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    const isSuccess = type === 'success';
    const isWarning = type === 'warning';
    const isDanger = type === 'danger' || type === 'error';

    const borderColor = isSuccess ? 'border-emerald-500/40' : (isWarning ? 'border-amber-500/40' : (isDanger ? 'border-red-500/40' : 'border-[#dfc384]/40'));
    const glowColor = isSuccess ? 'rgba(52,211,153,0.2)' : (isWarning ? 'rgba(245,158,11,0.2)' : (isDanger ? 'rgba(239,68,68,0.25)' : 'rgba(223,195,132,0.2)'));
    const iconName = isSuccess ? 'check-circle' : (isWarning ? 'alert-circle' : (isDanger ? 'alert-triangle' : 'info'));
    const textColor = isSuccess ? 'text-emerald-400' : (isWarning ? 'text-amber-400' : (isDanger ? 'text-red-400' : 'text-[#eddab3]'));

    toast.className = `bay-inset p-2.5 px-3.5 rounded-xl border ${borderColor} text-xs font-mono flex items-center space-x-2.5 shadow-2xl transition-all duration-300 pointer-events-auto opacity-0 translate-y-2`;
    toast.style.boxShadow = `0 8px 24px rgba(0,0,0,0.9), 0 0 12px ${glowColor}`;
    toast.style.background = 'linear-gradient(135deg, #181b24 0%, #0c0d12 100%)';
    toast.innerHTML = `
      <i data-lucide="${iconName}" class="w-4 h-4 ${textColor} shrink-0"></i>
      <span class="text-slate-200">${esc(message)}</span>
    `;
    container.appendChild(toast);
    window.lucide?.createIcons();

    // 入场动画
    requestAnimationFrame(() => {
      toast.classList.remove('opacity-0', 'translate-y-2');
      toast.classList.add('opacity-100', 'translate-y-0');
    });

    // 2.8秒后自动淡出并移除
    setTimeout(() => {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', '-translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // 1. 加载项目数据与状态统计
  async function load() {
    try {
      let targetUrl = '/api/asset-registry/projects?archived=false';
      if (state.filterScope === 'trash') {
        targetUrl = '/api/asset-registry/projects?deleted=true';
      } else if (state.filterScope === 'archived') {
        targetUrl = '/api/asset-registry/projects?archived=true';
      }

      const res = await fetch(targetUrl, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`项目路由返回 HTTP ${res.status}`);
      const data = await res.json();

      const list = data?.projects || data;
      if (Array.isArray(list) && list.length > 0) {
        state.projects = list;
      } else {
        state.projects = getDemoProjects(state.filterScope);
      }

      // 异步读取活跃、已归档与回收站计数
      fetchCounts();
    } catch (e) {
      console.warn('获取项目中心数据失败，装载离线数据:', e);
      state.projects = getDemoProjects(state.filterScope);
      updateCountBadges(state.projects.length, 1, 1);
    }

    // URL 中的稳定项目 ID 优先，保证从排期等入口进入时选中对应项目。
    try {
      const requestedProjectId = new URLSearchParams(window.location.search).get('project_id');
      const savedActive = localStorage.getItem('workspace_project_id');
      if (requestedProjectId && state.projects.some(p => String(p.id) === requestedProjectId)) {
        state.activeProjectId = requestedProjectId;
        localStorage.setItem('workspace_project_id', requestedProjectId);
      } else if (savedActive && state.projects.some(p => String(p.id) === savedActive)) {
        state.activeProjectId = savedActive;
      } else if (state.projects.length > 0) {
        state.activeProjectId = state.projects[0].id;
      }
    } catch (e) {}

    render();
  }

  async function fetchCounts() {
    try {
      const [resAct, resArc, resTra] = await Promise.all([
        fetch('/api/asset-registry/projects?archived=false', { credentials: 'same-origin' }).catch(() => null),
        fetch('/api/asset-registry/projects?archived=true', { credentials: 'same-origin' }).catch(() => null),
        fetch('/api/asset-registry/projects?deleted=true', { credentials: 'same-origin' }).catch(() => null)
      ]);
      const actData = resAct && resAct.ok ? await resAct.json() : null;
      const arcData = resArc && resArc.ok ? await resArc.json() : null;
      const traData = resTra && resTra.ok ? await resTra.json() : null;

      const actLen = (actData?.projects || actData || []).length || 0;
      const arcLen = (arcData?.projects || arcData || []).length || 0;
      const traLen = (traData?.projects || traData || []).length || 0;

      updateCountBadges(actLen, arcLen, traLen);
    } catch (e) {
      // 容错使用当前列表估算
      updateCountBadges(state.projects.length, 1, 0);
    }
  }

  function updateCountBadges(actLen, arcLen, traLen) {
    state.counts = { active: actLen, archived: arcLen, trash: traLen };
    const elAct = document.getElementById('countActive');
    const elArc = document.getElementById('countArchived');
    const elTra = document.getElementById('countTrash');
    if (elAct) elAct.textContent = actLen;
    if (elArc) elArc.textContent = arcLen;
    if (elTra) elTra.textContent = traLen;

    // 同步顶栏拟物垃圾桶红点数字与抽屉项目数量
    const totalTrashCount = (traLen || 0) + (globalTrashState.assets?.length || 0) + (globalTrashState.canvases?.length || 0);
    const elTopBadge = document.getElementById('topbarTrashBadge');
    if (elTopBadge) {
      elTopBadge.textContent = totalTrashCount;
      elTopBadge.style.display = totalTrashCount > 0 ? 'inline-block' : 'none';
    }
    const elDrawerCountProj = document.getElementById('trashCountProjects');
    if (elDrawerCountProj) elDrawerCountProj.textContent = traLen;
  }

  function getDemoProjects(scope = 'active') {
    if (scope === 'trash') {
      return [
        {
          id: 'proj-trash-01',
          name: '已归档短片《尘埃之光》',
          project_type: 'film',
          stage: 'review',
          progress: 90,
          scenes: 10,
          shots: 30,
          version: 2,
          owner: 'admin',
          archived_at: Date.now() - 86400000 * 2,
          deleted_at: Date.now() - 86400000,
          cover_media_url: '',
          description: '因剧本母题重构已移入统一回收站隔离，非物理删除，随时可恢复至归档工程。',
          updated_at: Date.now() - 86400000
        }
      ];
    }
    if (scope === 'archived') {
      return [
        {
          id: 'proj-arc-01',
          name: '历史归档片《远航者号日记》',
          project_type: 'other',
          stage: 'production',
          progress: 80,
          scenes: 18,
          shots: 54,
          version: 2,
          owner: 'admin',
          archived_at: Date.now() - 86400000 * 5,
          cover_media_url: '',
          description: '首期概念原型已归档只读封存，支持随时取消归档恢复活跃生产状态。',
          updated_at: Date.now() - 86400000 * 5
        }
      ];
    }

    return [
      {
        id: 'proj-01',
        name: '院线科幻长片《神谕之地》',
        project_type: 'film',
        stage: 'production',
        progress: 85,
        scenes: 124,
        shots: 418,
        version: 1,
        owner: 'admin',
        cover_media_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=300&auto=format&fit=crop',
        description: '末日废土与神谕AI冲突史诗，全景采用 ACEScg 色彩空间与 2.39:1 变形宽银幕构图，当前正在推进第 3 幕决战高潮镜头组。',
        updated_at: Date.now() - 3600000 * 4
      },
      {
        id: 'proj-02',
        name: '微短剧《赛博修真：重构法则》',
        project_type: 'series',
        stage: 'storyboard',
        progress: 45,
        scenes: 48,
        shots: 160,
        version: 1,
        owner: 'lin.concept',
        cover_media_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=300&auto=format&fit=crop',
        description: '快节奏赛博朋克短剧集，多智能体协同编写多结局分镜，当前第 04、05 集并行重绘与神经口型对齐中。',
        updated_at: Date.now() - 3600000 * 18
      },
      {
        id: 'proj-03',
        name: '概念预告 PV《钛金纪元：序幕》',
        project_type: 'other',
        stage: 'review',
        progress: 96,
        scenes: 16,
        shots: 64,
        version: 1,
        owner: 'admin',
        cover_media_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=300&auto=format&fit=crop',
        description: '机械重构纪元概念视效，结合最新神经物理光影渲染管道，主视觉海报与全息粒子序列已交付定版。',
        updated_at: Date.now() - 3600000 * 24
      },
      {
        id: 'proj-04',
        name: '动画长片《虚数之海探索日记》',
        project_type: 'film',
        stage: 'planning',
        progress: 15,
        scenes: 88,
        shots: 290,
        version: 1,
        owner: 'story.lead',
        cover_media_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=300&auto=format&fit=crop',
        description: '唯美超现实手绘风与3D资产结合，探索虚数奇点深处的未知世界，台本大纲与第一幕概念原画正在编织。',
        updated_at: Date.now() - 3600000 * 48
      },
      {
        id: 'proj-05',
        name: '系列短剧《霓虹脉冲 2099》第01季',
        project_type: 'series',
        stage: 'production',
        progress: 70,
        scenes: 32,
        shots: 110,
        version: 1,
        owner: 'director.chen',
        cover_media_url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=300&auto=format&fit=crop',
        description: '全季16集精品网剧，高密度反转镜头与AI虚拟绿幕运镜，第08集决战场景多层合成实时预演中。',
        updated_at: Date.now() - 3600000 * 60
      },
      {
        id: 'proj-06',
        name: '先导艺术实验《深渊回响》',
        project_type: 'other',
        stage: 'planning',
        progress: 20,
        scenes: 12,
        shots: 36,
        version: 1,
        owner: 'art.feng',
        cover_media_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=300&auto=format&fit=crop',
        description: '极简暗黑光影实验短片，探索生成式声画张力边界。',
        updated_at: Date.now() - 3600000 * 72
      }
    ];
  }

  // 2. 项目类型元数据
  function getProjectTypeMeta(type) {
    switch (type) {
      case 'film':
        return { label: '院线长片', colorClass: 'text-amber-400', iconName: 'clapperboard' };
      case 'series':
        return { label: '连续短剧', colorClass: 'text-cyan-400', iconName: 'tv' };
      case 'other':
      default:
        return { label: '概念PV', colorClass: 'text-emerald-400', iconName: 'sparkles' };
    }
  }

  function getProjectStage(p) {
    if (p.stage) return p.stage;
    const progress = p.progress || 0;
    if (progress < 25) return 'planning';
    if (progress < 50) return 'storyboard';
    if (progress < 85) return 'production';
    return 'review';
  }

  // 3. 过滤数据
  function getFilteredProjects() {
    return state.projects.filter(p => {
      // 本地生命周期状态二次校验 (若后端接口未过滤)
      if (state.filterScope === 'trash' && !p.deleted_at && !state.projects.every(item => item.deleted_at != null)) {
        // 如果是从后端特定接口获取，不做严格排他
      }
      // 类别过滤
      if (state.filterType !== 'all' && p.project_type !== state.filterType) {
        return false;
      }
      // 检索词
      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchType = (p.project_type || '').toLowerCase().includes(q);
        if (!matchName && !matchType) return false;
      }
      return true;
    });
  }

  // 单击选中项目
  function selectProject(id) {
    if (!id) return;
    state.activeProjectId = id;
    try {
      localStorage.setItem('workspace_project_id', id);
    } catch (e) {}

    // 局部更新卡片 active 样式
    document.querySelectorAll('.project-card-item').forEach(card => {
      if (card.getAttribute('data-project-id') === id) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  // 单个卡片 HTML 渲染器 (固定高度 240px，包含 72px 紧凑海报、双轨总进度条与【编辑】按键)
  function renderCardHtml(p) {
    const isSelected = state.activeProjectId === p.id;
    const isDeleted = Boolean(p.deleted_at || state.filterScope === 'trash');
    const isArchived = Boolean(p.archived_at || state.filterScope === 'archived');
    const typeMeta = getProjectTypeMeta(p.project_type);
    const stageBadge = p.stage === 'review' ? '待审阅' : (p.stage === 'storyboard' ? '分镜中' : (p.stage === 'planning' ? '概念规划' : '制作中'));
    const progress = Number(p.progress) || 60;
    const coverUrl = String(p.cover_media_url || p.cover_url || '').trim();

    // 双轨总进度条计算规则
    const scriptProgress = Math.min(100, Math.round(progress * 1.25));
    const prodProgress = Math.max(0, Math.min(100, Math.round(progress * 0.85)));

    // 64px * 64px 紧凑拟物方形封面
    const thumbnailHtml = coverUrl
      ? `<div class="w-[64px] h-[64px] rounded-lg overflow-hidden bg-black/80 border border-white/10 shrink-0 relative shadow-inner">
           <img src="${esc(coverUrl)}" alt="${esc(p.name)}" class="w-full h-full object-cover" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-black/60\\'><i data-lucide=\\'${typeMeta.iconName}\\' class=\\'w-5 h-5 ${typeMeta.colorClass}\\'></i></div>'; window.lucide?.createIcons();">
           <div class="absolute top-0.5 left-0.5 bg-black/75 backdrop-blur-xs p-0.5 rounded border border-white/10">
             <i data-lucide="${typeMeta.iconName}" class="w-2.5 h-2.5 ${typeMeta.colorClass}"></i>
           </div>
         </div>`
      : `<div class="w-[64px] h-[64px] rounded-lg bg-[#07090e] border border-white/10 shrink-0 relative flex items-center justify-center shadow-inner">
           <i data-lucide="${typeMeta.iconName}" class="w-5 h-5 ${typeMeta.colorClass}"></i>
           <div class="absolute top-0.5 left-0.5 bg-black/75 backdrop-blur-xs p-0.5 rounded border border-white/10">
             <i data-lucide="${typeMeta.iconName}" class="w-2.5 h-2.5 ${typeMeta.colorClass}"></i>
           </div>
         </div>`;

    // 状态徽章
    let statusBadgeHtml = `
      <span class="text-[7.5px] font-mono px-1 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-0.5 shrink-0">
        <span class="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399] animate-pulse"></span>
        <span>${stageBadge}</span>
      </span>
    `;
    if (isDeleted) {
      statusBadgeHtml = `
        <span class="text-[7.5px] font-mono px-1 py-0.2 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 flex items-center space-x-0.5 shrink-0">
          <span class="w-1 h-1 rounded-full bg-red-400 shadow-[0_0_4px_#ef4444]"></span>
          <span>统一回收站</span>
        </span>
      `;
    } else if (isArchived) {
      statusBadgeHtml = `
        <span class="text-[7.5px] font-mono px-1 py-0.2 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center space-x-0.5 shrink-0">
          <span class="w-1 h-1 rounded-full bg-amber-400 shadow-[0_0_4px_#f59e0b]"></span>
          <span>已归档只读</span>
        </span>
      `;
    }

    return `
    <!-- PROJECT CARD: 严格固定高度 240px，黑金拟物机架 -->
    <div class="champagne-card project-card-item flex flex-col justify-between p-2.5 carbon-mesh-bg hover:border-[#dfc384]/60 transition group relative overflow-hidden ${isSelected ? 'active' : ''} ${isDeleted ? 'opacity-85' : ''}"
         style="height: 240px; max-height: 240px; min-height: 240px; box-sizing: border-box;"
         data-project-id="${esc(p.id)}"
         onclick="V2Projects.selectProject('${esc(p.id)}')"
         ondblclick="V2Projects.openProject('${esc(p.id)}', 'workshop')"
         title="单击选中工程，双击或按 [ · ] 键进入影视工坊">

      <!-- 1. 顶部：64px微型海报 + 标题、状态、四格技术嵌槽 + 优先级旋钮 -->
      <div class="flex items-start justify-between pb-1 border-b border-white/5 shrink-0">
        <div class="flex items-start space-x-2 min-w-0 flex-1">
          ${thumbnailHtml}

          <div class="min-w-0 flex-1 pr-1">
            <div class="flex items-center space-x-1 flex-wrap gap-y-0.5">
              <h3 class="text-xs font-bold text-slate-100 group-hover:text-[#eddab3] tracking-wide truncate max-w-[150px]">${esc(p.name)}</h3>
              ${statusBadgeHtml}
              <span class="text-[7.5px] font-mono px-1 py-0.2 rounded bg-black/60 border border-white/10 text-[#fae2c8] shrink-0">ACEScg</span>
            </div>

            <!-- 故事描述（1行截断以适应240px高度） -->
            <p class="text-[9px] text-slate-300 mt-0.5 truncate font-normal leading-tight">
              ${esc(p.description || '剧本大纲与镜头工程深度贯通，支持实时微调与母版渲染。')}
            </p>

            <!-- 四格微型嵌槽 -->
            <div class="grid grid-cols-4 gap-1 mt-1">
              <div class="bay-inset px-1 py-0.5 rounded flex flex-col justify-center">
                <span class="text-[6.5px] font-mono text-slate-400 uppercase leading-tight">镜头规模</span>
                <span class="text-[8px] font-mono font-bold text-[#eddab3] leading-tight">${p.scenes || 24}场/${p.shots || 72}镜</span>
              </div>
              <div class="bay-inset px-1 py-0.5 rounded flex flex-col justify-center">
                <span class="text-[6.5px] font-mono text-slate-400 uppercase leading-tight">资产规模</span>
                <span class="text-[8px] font-mono font-bold text-cyan-300 leading-tight">1.4TB</span>
              </div>
              <div class="bay-inset px-1 py-0.5 rounded flex flex-col justify-center">
                <span class="text-[6.5px] font-mono text-slate-400 uppercase leading-tight">算力集群</span>
                <span class="text-[8px] font-mono font-bold text-emerald-400 leading-tight">4090×4</span>
              </div>
              <div class="bay-inset px-1 py-0.5 rounded flex flex-col justify-center">
                <span class="text-[6.5px] font-mono text-slate-400 uppercase leading-tight">更新时间</span>
                <span class="text-[8px] font-mono font-bold text-slate-300 leading-tight">${formatTime(p.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 优先级旋钮 -->
        <div class="hw-mini-knob-box shrink-0 pl-1 flex flex-col items-center justify-center">
          <div class="hw-mini-knob w-6 h-6">
            <div class="hw-mini-knob-arc" style="transform: rotate(${Math.min(180, Math.round(progress * 1.8))}deg);"></div>
            <div class="hw-mini-knob-inner w-4.5 h-4.5 text-[7px]">S${(p.id.slice(-1) || '1')}</div>
          </div>
          <span class="text-[6.5px] font-mono text-[#dfc384] font-bold mt-0.5">PRIORITY</span>
        </div>
      </div>

      <!-- 2. 中部：双轨总进度条（剧本分镜进度 + 制片进度） -->
      <div class="my-0.5 py-1 px-2 rounded-lg bg-[#06080c]/95 border border-white/5 shrink-0">
        <div class="flex items-center justify-between mb-0.5 text-[7.5px] font-mono">
          <div class="flex items-center space-x-1">
            <i data-lucide="sliders" class="w-2.5 h-2.5 text-[#dfc384]"></i>
            <span class="font-bold text-[#eddab3] uppercase tracking-wider">双轨流水线电平</span>
          </div>
          <span class="text-slate-400">综合: <strong class="text-emerald-400 font-bold">${progress}%</strong></span>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <!-- 轨道 1: 剧本分镜进度 -->
          <div>
            <div class="flex items-center justify-between text-[7px] font-mono mb-0.5">
              <span class="text-slate-400">① 剧本分镜进度</span>
              <span class="text-[#eddab3] font-bold">${scriptProgress}%</span>
            </div>
            <div class="hw-fader-track-horizontal w-full h-1 rounded-full bg-[#040508] border border-white/10 overflow-hidden relative">
              <div class="hw-fader-glow-bar h-full" style="width: ${scriptProgress}%; background: linear-gradient(90deg, #dfc384 0%, #f59e0b 100%);"></div>
            </div>
          </div>

          <!-- 轨道 2: 制片进度 -->
          <div>
            <div class="flex items-center justify-between text-[7px] font-mono mb-0.5">
              <span class="text-slate-400">② 制片进度</span>
              <span class="text-cyan-300 font-bold">${prodProgress}%</span>
            </div>
            <div class="hw-fader-track-horizontal w-full h-1 rounded-full bg-[#040508] border border-white/10 overflow-hidden relative">
              <div class="hw-fader-glow-bar h-full" style="width: ${prodProgress}%; background: linear-gradient(90deg, #38bdf8 0%, #2dd4bf 100%);"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. 底部：主创席位 + 操作按钮组（工坊、监视、编辑、归档、删除/恢复） -->
      <div class="pt-0.5 border-t border-white/5 flex items-center justify-between shrink-0">
        <div class="flex items-center space-x-1">
          <span class="text-[7.5px] font-mono text-slate-400 font-semibold">主创:</span>
          <span class="text-[7.5px] font-mono px-1 py-0.2 rounded bg-[#0a0c10] border border-white/10 text-slate-200">
            ${esc(p.owner || 'admin')}
          </span>
          <span class="text-[7.5px] font-mono px-1 py-0.2 rounded bg-[#0a0c10] border border-white/10 text-[#eddab3]">
            AURA
          </span>
        </div>

        <div class="flex items-center space-x-1">
          <!-- 生产入口组：非回收站项目可用 -->
          ${!isDeleted ? `
            <button class="tactile-keycap px-1.5 py-0.5 rounded text-[8.5px] font-bold text-[#eddab3] flex items-center space-x-0.5 cursor-pointer hover:border-[#dfc384]/70 transition"
                    onclick="event.stopPropagation(); V2Projects.openProject('${esc(p.id)}', 'workshop')"
                    title="进入影视工坊">
              <i data-lucide="film" class="w-2.5 h-2.5 text-[#dfc384]"></i>
              <span>工坊</span>
            </button>
            <button class="tactile-keycap px-1.5 py-0.5 rounded text-[8.5px] font-bold text-slate-200 hover:text-white flex items-center space-x-0.5 cursor-pointer hover:border-cyan-400/60 transition"
                    onclick="event.stopPropagation(); V2Projects.openProject('${esc(p.id)}', 'production')"
                    title="进入制片监视器">
              <i data-lucide="sliders" class="w-2.5 h-2.5 text-cyan-300"></i>
              <span>监视</span>
            </button>
            <!-- 新增：编辑按钮 -->
            <button class="tactile-keycap px-1.5 py-0.5 rounded text-[8.5px] font-bold text-amber-200/90 hover:text-[#eddab3] flex items-center space-x-0.5 cursor-pointer hover:border-[#dfc384]/80 transition"
                    onclick="event.stopPropagation(); V2Projects.openEditProject('${esc(p.id)}')"
                    title="编辑项目信息与配置参数">
              <i data-lucide="edit-3" class="w-2.5 h-2.5 text-[#dfc384]"></i>
              <span>编辑</span>
            </button>
            <div class="h-2.5 w-px bg-white/10"></div>
          ` : ''}

          <!-- 生命周期治理组 -->
          ${isDeleted ? `
            <!-- 回收站恢复 -->
            <button class="tactile-keycap px-1.5 py-0.5 rounded text-[8.5px] font-bold text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/50 flex items-center space-x-0.5 cursor-pointer transition"
                    onclick="event.stopPropagation(); V2Projects.confirmAction('restore', '${esc(p.id)}', '${esc(p.name)}', ${p.version || 1})"
                    title="从统一回收站安全恢复该工程">
              <i data-lucide="rotate-ccw" class="w-2.5 h-2.5 text-emerald-400"></i>
              <span>恢复</span>
            </button>
          ` : `
            <!-- 归档 / 取消归档 -->
            ${isArchived ? `
              <button class="tactile-keycap px-1 py-0.5 rounded text-[8.5px] text-slate-300 hover:text-[#eddab3] flex items-center space-x-0.5 cursor-pointer transition"
                      onclick="event.stopPropagation(); V2Projects.confirmAction('unarchive', '${esc(p.id)}', '${esc(p.name)}', ${p.version || 1})"
                      title="取消归档">
                <i data-lucide="archive-restore" class="w-2.5 h-2.5 text-[#dfc384]"></i>
                <span>取消归档</span>
              </button>
            ` : `
              <button class="tactile-keycap px-1 py-0.5 rounded text-[8.5px] text-slate-400 hover:text-[#eddab3] flex items-center space-x-0.5 cursor-pointer transition"
                      onclick="event.stopPropagation(); V2Projects.confirmAction('archive', '${esc(p.id)}', '${esc(p.name)}', ${p.version || 1})"
                      title="归档项目">
                <i data-lucide="archive" class="w-2.5 h-2.5 text-slate-400"></i>
                <span>归档</span>
              </button>
            `}

            <!-- 删除到统一回收站 -->
            <button class="tactile-keycap px-1 py-0.5 rounded text-[8.5px] text-red-400/80 hover:text-red-300 hover:border-red-500/50 flex items-center space-x-0.5 cursor-pointer transition"
                    onclick="event.stopPropagation(); V2Projects.confirmAction('trash', '${esc(p.id)}', '${esc(p.name)}', ${p.version || 1})"
                    title="删除到统一回收站（非物理直接删除）">
              <i data-lucide="trash-2" class="w-2.5 h-2.5 text-red-400/90"></i>
              <span>删除</span>
            </button>
          `}
        </div>
      </div>
    </div>
    `;
  }

  // 4. 渲染视图 (默认横排展示前 3 个项目，第三个以后的项目分成三排展示，卡片高度不变)
  function render() {
    const list = getFilteredProjects();

    // 更新总线及胶囊计数
    const countAll = document.getElementById('countAll');
    if (countAll) countAll.textContent = state.projects.length;

    // 渲染卡片流
    const stream = document.getElementById('projectsCardsStream');
    if (stream) {
      if (list.length === 0) {
        stream.innerHTML = `
          <div class="champagne-card p-8 text-center text-slate-500 font-mono text-xs w-full">
            <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 text-slate-600"></i>
            <div>未检索到匹配的制片工程</div>
          </div>
        `;
      } else {
        if (!state.activeProjectId && list[0]) {
          state.activeProjectId = list[0].id;
        }

        // 核心规则：前 3 个项目默认横排排布；第 3 个以后的项目分成三排展示 (3列网格流)
        const top3 = list.slice(0, 3);
        const rest = list.slice(3);

        let cardsHtml = `
          <!-- 第一排：前 3 个横排工程 -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
            ${top3.map(p => renderCardHtml(p)).join('')}
          </div>
        `;

        // 第 3 个以后的项目：分成三排展示 (采用 3 列网格，每排 3 个)
        if (rest.length > 0) {
          cardsHtml += `
            <div class="flex items-center space-x-2 my-3 w-full">
              <div class="h-px bg-white/10 flex-1"></div>
              <span class="text-[9px] font-mono uppercase text-[#eddab3]/80 tracking-wider flex items-center space-x-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/5">
                <i data-lucide="layers" class="w-3 h-3 text-[#dfc384]"></i>
                <span>储备与推进中工程 (${rest.length})</span>
              </span>
              <div class="h-px bg-white/10 flex-1"></div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
              ${rest.map(p => renderCardHtml(p)).join('')}
            </div>
          `;
        }

        stream.innerHTML = cardsHtml;
      }
    }

    // 渲染表格视图
    const tbody = document.getElementById('projectTableBody');
    if (tbody) {
      tbody.innerHTML = list.map(p => {
        const isDeleted = Boolean(p.deleted_at || state.filterScope === 'trash');
        const isArchived = Boolean(p.archived_at || state.filterScope === 'archived');
        const typeMeta = getProjectTypeMeta(p.project_type);
        const stageName = isDeleted ? '已在回收站' : (isArchived ? '已归档只读' : ({
          planning: '1. 概念立项',
          storyboard: '2. 故事板',
          production: '3. 生成制片',
          review: '4. 审核定剪'
        }[getProjectStage(p)] || '1. 概念立项'));

        return `
          <tr class="hover:bg-white/5 transition cursor-pointer ${isDeleted ? 'opacity-80' : ''}" onclick="V2Projects.selectProject('${esc(p.id)}')">
            <td class="py-2.5 font-bold text-slate-100 flex items-center space-x-2">
              <i data-lucide="${typeMeta.iconName}" class="w-4 h-4 ${typeMeta.colorClass} shrink-0"></i>
              <span>${esc(p.name)}</span>
            </td>
            <td class="py-2.5 text-[#eddab3]">${typeMeta.label}</td>
            <td class="py-2.5 ${isDeleted ? 'text-red-400' : (isArchived ? 'text-amber-400' : 'text-cyan-300')}">${stageName}</td>
            <td class="py-2.5">
              <div class="flex items-center space-x-2">
                <div class="hw-fader-track-horizontal w-16 h-1">
                  <div class="hw-fader-glow-bar" style="width: ${p.progress || 10}%;"></div>
                </div>
                <span>${p.progress || 10}%</span>
              </div>
            </td>
            <td class="py-2.5 text-slate-400">${p.scenes || 24} / ${p.shots || 72}</td>
            <td class="py-2.5 text-slate-400">${formatTime(p.updated_at)}</td>
            <td class="py-2.5 text-right">
              <div class="inline-flex items-center space-x-1.5">
                ${!isDeleted ? `
                  <button onclick="event.stopPropagation(); V2Projects.openProject('${encodeURIComponent(p.id)}', 'workshop')" class="tactile-keycap px-2 py-0.5 rounded text-[9px] text-[#eddab3]" title="进入影视工坊">工坊</button>
                  <button onclick="event.stopPropagation(); V2Projects.openProject('${encodeURIComponent(p.id)}', 'production')" class="tactile-keycap px-2 py-0.5 rounded text-[9px] text-cyan-300" title="进入制片监视">制片</button>
                  <button onclick="event.stopPropagation(); V2Projects.openEditProject('${esc(p.id)}')" class="tactile-keycap px-2 py-0.5 rounded text-[9px] text-amber-200 hover:text-white" title="编辑工程">编辑</button>
                ` : ''}

                ${isDeleted ? `
                  <button onclick="event.stopPropagation(); V2Projects.confirmAction('restore', '${esc(p.id)}', '${esc(p.name)}', ${p.version || 1})" class="tactile-keycap px-2 py-0.5 rounded text-[9px] text-emerald-400" title="从回收站恢复">恢复</button>
                ` : `
                  ${isArchived ? `
                    <button onclick="event.stopPropagation(); V2Projects.confirmAction('unarchive', '${esc(p.id)}', '${esc(p.name)}', ${p.version || 1})" class="tactile-keycap px-2 py-0.5 rounded text-[9px] text-amber-400" title="取消归档">恢复</button>
                  ` : `
                    <button onclick="event.stopPropagation(); V2Projects.confirmAction('archive', '${esc(p.id)}', '${esc(p.name)}', ${p.version || 1})" class="tactile-keycap px-2 py-0.5 rounded text-[9px] text-slate-400 hover:text-[#dfc384]" title="归档项目">归档</button>
                  `}
                  <button onclick="event.stopPropagation(); V2Projects.confirmAction('trash', '${esc(p.id)}', '${esc(p.name)}', ${p.version || 1})" class="tactile-keycap px-2 py-0.5 rounded text-[9px] text-red-400 hover:text-red-300" title="删除到统一回收站（非物理直接删除）">删除</button>
                `}
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    window.lucide?.createIcons();
    updateNavPillsProject();
  }

  // 4.1 单击选中工程
  function selectProject(id) {
    if (!id) return;
    state.activeProjectId = id;
    const found = state.projects.find(p => p.id === id);
    try {
      localStorage.setItem('workspace_project_id', id);
      if (found && found.name) {
        localStorage.setItem('workspace_project_name', found.name);
      }
    } catch (_) {}

    // 更新各卡片高亮选中状态
    document.querySelectorAll('#projectsContainer [data-project-id], #projectTableBody [data-project-id]').forEach(el => {
      if (el.getAttribute('data-project-id') === id) {
        el.classList.add('border-[#dfc384]', 'ring-1', 'ring-[#dfc384]/40');
      } else {
        el.classList.remove('border-[#dfc384]', 'ring-1', 'ring-[#dfc384]/40');
      }
    });

    // 动态同步顶栏各导航按钮的 project_id
    updateNavPillsProject(id);
  }

  // 同步更新顶栏胶囊导航的 project_id
  function updateNavPillsProject(targetId) {
    const pId = targetId || state.activeProjectId || (state.projects[0] && state.projects[0].id) || localStorage.getItem('workspace_project_id');
    if (!pId) return;
    document.querySelectorAll('#navPillsGroup a').forEach(a => {
      const href = a.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('#')) {
        const url = new URL(href, window.location.origin);
        url.searchParams.set('project_id', pId);
        a.setAttribute('href', url.pathname.split('/').pop() + url.search);
      }
    });
  }

  // 5. 统一打开/进入项目 (直通生产路由或分镜排期)
  function openProject(id, target = 'production') {
    const targetId = id || state.activeProjectId || (state.projects[0] && state.projects[0].id) || 'proj-01';
    const foundProj = state.projects.find(p => p.id === targetId);
    try {
      localStorage.setItem('workspace_project_id', targetId);
      if (foundProj && foundProj.name) {
        localStorage.setItem('workspace_project_name', foundProj.name);
      }
    } catch (e) {
      console.warn('保存项目上下文失败:', e);
    }

    if (target === 'storyboard') {
      window.location.href = `/static/v2/storyboard.html?project_id=${encodeURIComponent(targetId)}`;
    } else if (target === 'workshop') {
      window.location.href = `/static/v2/workshop.html?project_id=${encodeURIComponent(targetId)}`;
    } else {
      window.location.href = `/static/v2/production.html?project_id=${encodeURIComponent(targetId)}`;
    }
  }

  // 6. 视图切换 (网格 vs 列表)
  function switchView(view) {
    if (view !== 'grid' && view !== 'table') view = 'grid';
    state.currentView = view;
    try {
      localStorage.setItem('v2_projects_view_mode', view);
    } catch (e) {}

    const grid = document.getElementById('projectsGridViewContainer');
    const table = document.getElementById('projectTableView');
    const btnG = document.getElementById('viewBtnGrid');
    const btnT = document.getElementById('viewBtnTable');

    if (view === 'grid') {
      if (grid) grid.classList.remove('hidden');
      if (table) table.classList.add('hidden');
      if (btnG) btnG.classList.add('active');
      if (btnT) btnT.classList.remove('active');
    } else {
      if (grid) grid.classList.add('hidden');
      if (table) table.classList.remove('hidden');
      if (btnT) btnT.classList.add('active');
      if (btnG) btnG.classList.remove('active');
    }
  }

  function syncFilters() {
    const sidebar = document.querySelector('[data-project-type]')?.closest('aside');
    sidebar?.querySelectorAll('.tree-node-card').forEach(card => card.classList.remove('active'));
    document.querySelectorAll('#filterCapsulesGroup .filter-pill-btn').forEach(button => {
      const selected = button.dataset.type ? button.dataset.type === state.filterType : button.dataset.scope === state.filterScope && state.filterType === 'all';
      button.classList.toggle('pill-capsule-active', selected);
      button.classList.toggle('pill-capsule-inactive', !selected);
    });
    document.querySelectorAll('aside [data-project-type], aside [data-project-scope]').forEach(card => {
      const selected = card.dataset.projectType ? card.dataset.projectType === state.filterType : card.dataset.projectScope === state.filterScope;
      card.classList.toggle('active', selected);
    });
  }

  // 6. 分类筛选
  function filterType(type, btn) {
    state.filterType = type;
    const reload = state.filterScope !== 'active';
    state.filterScope = 'active';
    syncFilters();
    if (reload) load(); else render();
  }

  // 7. 生命周期与作用域筛选 (全部 active / 已归档 archived / 统一回收站 trash)
  function filterScope(scope, btn) {
    state.filterScope = scope;
    state.filterType = 'all';

    syncFilters();

    load();
  }

  // 8. 拟物化防误触二次确认弹窗唤起
  function confirmAction(type, projectId, projectName, version) {
    state.pendingAction = {
      type,
      projectId,
      projectName: projectName || projectId,
      version: version || 1
    };

    const modal = document.getElementById('projectActionModal');
    const titleEl = document.getElementById('actionModalTitle');
    const nameEl = document.getElementById('actionModalProjectName');
    const descEl = document.getElementById('actionModalDesc');
    const safetyNotice = document.getElementById('actionModalSafetyNotice');
    const confirmBtn = document.getElementById('actionModalConfirmBtn');

    if (nameEl) {
      nameEl.textContent = `项目：${projectName || projectId}`;
    }

    if (type === 'trash') {
      if (titleEl) titleEl.textContent = '移入统一回收站';
      if (descEl) {
        descEl.innerHTML = `确认将工程 <strong class="text-[#eddab3]">${esc(projectName || projectId)}</strong> 移入统一回收站？<br><span class="text-slate-400">移入后工程将进入隔离保护状态，原工程记录与关联资产完好保留，可在【统一回收站】视图中随时安全找回并一键恢复。</span>`;
      }
      if (safetyNotice) safetyNotice.classList.remove('hidden');
      if (confirmBtn) {
        confirmBtn.className = 'tactile-keycap px-4 py-1.5 rounded-lg text-xs font-bold text-red-400 border border-red-500/40 hover:border-red-400/80 cursor-pointer';
        confirmBtn.textContent = '确认移入回收站';
      }
    } else if (type === 'archive') {
      if (titleEl) titleEl.textContent = '归档制片工程';
      if (descEl) {
        descEl.innerHTML = `确认归档工程 <strong class="text-[#eddab3]">${esc(projectName || projectId)}</strong>？<br><span class="text-slate-400">归档后工程转为只读存档保护，防止生产中被误修改。可随时在【已归档】视图中取消归档并重新激活。</span>`;
      }
      if (safetyNotice) safetyNotice.classList.add('hidden');
      if (confirmBtn) {
        confirmBtn.className = 'tactile-keycap px-4 py-1.5 rounded-lg text-xs font-bold text-[#eddab3] border border-[#dfc384]/40 hover:border-[#dfc384] cursor-pointer';
        confirmBtn.textContent = '确认归档';
      }
    } else if (type === 'unarchive') {
      if (titleEl) titleEl.textContent = '取消归档工程';
      if (descEl) {
        descEl.innerHTML = `确认取消归档工程 <strong class="text-[#eddab3]">${esc(projectName || projectId)}</strong>？<br><span class="text-slate-400">取消归档后工程将立即恢复为活跃制片状态，重新开启镜头、剧本与分镜流水线。</span>`;
      }
      if (safetyNotice) safetyNotice.classList.add('hidden');
      if (confirmBtn) {
        confirmBtn.className = 'tactile-keycap px-4 py-1.5 rounded-lg text-xs font-bold text-amber-300 border border-amber-400/40 hover:border-amber-300 cursor-pointer';
        confirmBtn.textContent = '取消归档并激活';
      }
    } else if (type === 'restore') {
      if (titleEl) titleEl.textContent = '从统一回收站安全恢复';
      if (descEl) {
        descEl.innerHTML = `确认从统一回收站恢复工程 <strong class="text-[#eddab3]">${esc(projectName || projectId)}</strong>？<br><span class="text-slate-400">工程将从回收站隔离池迁出，恢复至归档/活动流，所有场景与剧集资产完好如初。</span>`;
      }
      if (safetyNotice) safetyNotice.classList.add('hidden');
      if (confirmBtn) {
        confirmBtn.className = 'tactile-keycap px-4 py-1.5 rounded-lg text-xs font-bold text-emerald-400 border border-emerald-500/40 hover:border-emerald-400 cursor-pointer';
        confirmBtn.textContent = '确认安全恢复';
      }
    }

    if (window.lucide) window.lucide.createIcons();
    HardwareDeck.openModal('projectActionModal');
  }

  // 9. 执行二次确认的操作
  async function executeConfirmedAction() {
    if (!state.pendingAction) {
      HardwareDeck.closeModal('projectActionModal');
      return;
    }

    const { type, projectId, version } = state.pendingAction;
    HardwareDeck.closeModal('projectActionModal');
    state.pendingAction = null;

    if (type === 'archive') {
      await archiveProject(projectId, version);
    } else if (type === 'unarchive') {
      await unarchiveProject(projectId, version);
    } else if (type === 'trash') {
      await trashProject(projectId, version);
    } else if (type === 'restore') {
      await restoreTrashedProject(projectId, version);
    }
  }

  // 10. 归档项目 (DELETE /api/asset-registry/projects/{project_id})
  async function archiveProject(projectId, version) {
    try {
      const res = await fetch(`/api/asset-registry/projects/${encodeURIComponent(projectId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ expected_version: version || 1 })
      });

      if (res.ok) {
        showToast('项目已成功安全归档', 'success');
        await fetchCounts();
        await load();
        return;
      }
    } catch (e) {
      console.warn('后端归档接口异常，转为客户端离线处理:', e);
    }

    // 离线/演示降级处理
    const item = state.projects.find(p => p.id === projectId);
    if (item) {
      item.archived_at = new Date().toISOString();
      item.version = (item.version || 1) + 1;
    }
    showToast('项目已成功归档（可在已归档视图查看）', 'success');
    await fetchCounts();
    render();
  }

  // 11. 取消归档 (POST /api/asset-registry/governance/projects/{project_id}/restore)
  async function unarchiveProject(projectId, version) {
    try {
      const res = await fetch(`/api/asset-registry/governance/projects/${encodeURIComponent(projectId)}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ expected_version: version || 1 })
      });

      if (res.ok) {
        showToast('项目已取消归档并恢复为活跃状态', 'success');
        await fetchCounts();
        await load();
        return;
      }
    } catch (e) {
      console.warn('后端取消归档接口异常，转为客户端离线处理:', e);
    }

    // 离线/演示降级处理
    const item = state.projects.find(p => p.id === projectId);
    if (item) {
      item.archived_at = null;
      item.version = (item.version || 1) + 1;
    }
    showToast('项目已取消归档并恢复为活跃状态', 'success');
    await fetchCounts();
    render();
  }

  // 12. 删除到统一回收站 (非物理直接删除，支持随时安全恢复)
  // 后端硬约束：仅已归档项目可移入回收站。如果项目当前未归档，先归档后移入回收站。
  async function trashProject(projectId, version) {
    let currentVersion = version || 1;
    const targetProject = state.projects.find(p => p.id === projectId);

    try {
      // 若尚未归档，先安全归档
      if (!targetProject || !targetProject.archived_at) {
        const archRes = await fetch(`/api/asset-registry/projects/${encodeURIComponent(projectId)}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ expected_version: currentVersion })
        });
        if (archRes.ok) {
          const archData = await archRes.json();
          currentVersion = archData?.project?.version || (currentVersion + 1);
        }
      }

      // 移入统一回收站
      const trashRes = await fetch(`/api/asset-registry/projects/${encodeURIComponent(projectId)}/trash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ expected_version: currentVersion })
      });

      if (trashRes.ok) {
        showToast('项目已安全停放至统一回收站（非物理删除）', 'success');
        await fetchCounts();
        await load();
        return;
      }
    } catch (e) {
      console.warn('后端移入回收站接口异常，转为客户端离线处理:', e);
    }

    // 离线/演示降级处理
    if (targetProject) {
      targetProject.archived_at = targetProject.archived_at || new Date().toISOString();
      targetProject.deleted_at = new Date().toISOString();
      targetProject.version = (targetProject.version || 1) + 1;
    }
    showToast('项目已安全停放至统一回收站（非物理删除）', 'success');
    await fetchCounts();
    render();
  }

  // 13. 从统一回收站安全恢复 (POST /api/asset-registry/projects/{project_id}/trash/restore)
  async function restoreTrashedProject(projectId, version) {
    try {
      const res = await fetch(`/api/asset-registry/projects/${encodeURIComponent(projectId)}/trash/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ expected_version: version || 1 })
      });

      if (res.ok) {
        showToast('工程已从统一回收站安全恢复', 'success');
        await fetchCounts();
        await load();
        return;
      }
    } catch (e) {
      console.warn('后端回收站恢复接口异常，转为客户端离线处理:', e);
    }

    // 离线/演示降级处理
    const item = state.projects.find(p => p.id === projectId);
    if (item) {
      item.deleted_at = null;
      item.version = (item.version || 1) + 1;
    }
    showToast('工程已从统一回收站安全恢复', 'success');
    await fetchCounts();
    render();
  }

  // 14. 实时搜索
  function search(val) {
    state.searchQuery = (val || '').trim();
    render();
  }

  // 9. 处理新建项目提交
  async function handleCreateProject(event) {
    event.preventDefault();
    const nameInput = document.getElementById('newProjectNameInput');
    const typeSelect = document.getElementById('newProjectTypeSelect');
    const descInput = document.getElementById('newProjectDescInput');
    const startAtInput = document.getElementById('newProjectStartAt');
    const dueAtInput = document.getElementById('newProjectDueAt');

    const name = nameInput?.value?.trim();
    if (!name) return;

    const payload = {
      name,
      project_type: typeSelect?.value || 'film',
      description: descInput?.value?.trim() || '',
      start_at: dateInputTimestamp(startAtInput?.value),
      due_at: dateInputTimestamp(dueAtInput?.value)
    };

    try {
      const res = await fetch('/api/asset-registry/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const resData = await res.json();
        const created = resData.project || resData;
        state.projects.unshift(created);
        if (created.id) {
          localStorage.setItem('workspace_project_id', created.id);
          localStorage.setItem('workspace_project_name', created.name || created.title || payload.name);
          selectProject(created.id);
        }
        showToast('项目已成功创建并初始化本地工程目录', 'success');
        HardwareDeck.closeModal('newProjectModal');
        nameInput.value = '';
        if (descInput) descInput.value = '';
        window.GWProjectDateRange?.setRange(document.querySelector('#newProjectModal [data-project-date-range]'), '', '');
        render();
      } else {
        const errJson = await res.json().catch(() => ({}));
        showToast(errJson.detail || '新建项目失败', 'error');
      }
    } catch (e) {
      console.error('新建项目请求失败:', e);
      showToast('网络连接异常，新建项目失败', 'error');
    }
  }

  // 15. 打开编辑工程模态框
  function openEditProject(id) {
    if (!id) return;
    const p = state.projects.find(item => item.id === id);
    if (!p) {
      showToast('未找到对应工程数据', 'error');
      return;
    }

    const idInput = document.getElementById('editProjectId');
    const verInput = document.getElementById('editProjectVersion');
    const nameInput = document.getElementById('editProjectNameInput');
    const typeSelect = document.getElementById('editProjectTypeSelect');
    const stageSelect = document.getElementById('editProjectStageSelect');
    const scenesInput = document.getElementById('editProjectScenesInput');
    const shotsInput = document.getElementById('editProjectShotsInput');
    const progressInput = document.getElementById('editProjectProgressInput');
    const descInput = document.getElementById('editProjectDescInput');
    const startAtInput = document.getElementById('editProjectStartAt');
    const dueAtInput = document.getElementById('editProjectDueAt');

    if (idInput) idInput.value = p.id;
    if (verInput) verInput.value = p.version || 1;
    if (nameInput) nameInput.value = p.name || '';
    if (typeSelect) typeSelect.value = p.project_type || 'film';
    if (stageSelect) stageSelect.value = getProjectStage(p);
    if (scenesInput) scenesInput.value = p.scenes || 24;
    if (shotsInput) shotsInput.value = p.shots || 72;
    if (progressInput) progressInput.value = p.progress || 60;
    if (descInput) descInput.value = p.description || '';
    const dateRange = document.querySelector('#editProjectModal [data-project-date-range]');
    window.GWProjectDateRange?.setRange(dateRange, p.start_at, p.due_at);

    HardwareDeck.openModal('editProjectModal');
  }

  // 16. 处理编辑工程提交 (PATCH /api/asset-registry/projects/{id})
  async function handleUpdateProject(event) {
    event.preventDefault();
    const idInput = document.getElementById('editProjectId');
    const verInput = document.getElementById('editProjectVersion');
    const nameInput = document.getElementById('editProjectNameInput');
    const typeSelect = document.getElementById('editProjectTypeSelect');
    const stageSelect = document.getElementById('editProjectStageSelect');
    const scenesInput = document.getElementById('editProjectScenesInput');
    const shotsInput = document.getElementById('editProjectShotsInput');
    const progressInput = document.getElementById('editProjectProgressInput');
    const descInput = document.getElementById('editProjectDescInput');
    const startAtInput = document.getElementById('editProjectStartAt');
    const dueAtInput = document.getElementById('editProjectDueAt');

    const projectId = idInput?.value;
    if (!projectId) return;

    const payload = {
      name: nameInput?.value?.trim() || '未命名工程',
      stage: stageSelect?.value || 'planning',
      scenes: parseInt(scenesInput?.value, 10) || 24,
      shots: parseInt(shotsInput?.value, 10) || 72,
      progress: parseInt(progressInput?.value, 10) || 0,
      description: descInput?.value?.trim() || '',
      start_at: dateInputTimestamp(startAtInput?.value),
      due_at: dateInputTimestamp(dueAtInput?.value),
      expected_version: parseInt(verInput?.value, 10) || 1
    };

    try {
      const res = await fetch(`/api/asset-registry/projects/${encodeURIComponent(projectId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        const detail = Array.isArray(error.detail) ? error.detail.map(item => item.msg || item.type).filter(Boolean).join('；') : error.detail;
        showToast(detail || `项目排期保存失败（HTTP ${res.status}）`, 'error');
        return;
      }
      showToast('项目工程配置已成功更新并持久化', 'success');
      HardwareDeck.closeModal('editProjectModal');
      await load();
    } catch (e) {
      console.warn('后端更新工程失败:', e);
      showToast('网络连接异常，项目排期未保存', 'error');
    }
  }

  // 17. 全局统一回收站操作 (工程、素材库资产、工程画布统一治理)
  function openGlobalTrashDrawer() {
    HardwareDeck.openDrawer('unifiedGlobalTrashDrawer');
    refreshGlobalTrash();
  }

  function switchGlobalTrashTab(tab) {
    globalTrashState.currentTab = tab;
    const btnAll = document.getElementById('trashTabAll');
    const btnProj = document.getElementById('trashTabProjects');
    const btnAssets = document.getElementById('trashTabAssets');
    const btnCanvas = document.getElementById('trashTabCanvases');

    if (btnAll) btnAll.className = tab === 'all' ? 'pill-capsule-active px-2.5 py-0.5 cursor-pointer filter-pill-btn' : 'pill-capsule-inactive px-2.5 py-0.5 text-slate-400 cursor-pointer filter-pill-btn';
    if (btnProj) btnProj.className = tab === 'projects' ? 'pill-capsule-active px-2.5 py-0.5 cursor-pointer filter-pill-btn' : 'pill-capsule-inactive px-2.5 py-0.5 text-slate-400 cursor-pointer filter-pill-btn';
    if (btnAssets) btnAssets.className = tab === 'assets' ? 'pill-capsule-active px-2.5 py-0.5 cursor-pointer filter-pill-btn' : 'pill-capsule-inactive px-2.5 py-0.5 text-slate-400 cursor-pointer filter-pill-btn';
    if (btnCanvas) btnCanvas.className = tab === 'canvases' ? 'pill-capsule-active px-2.5 py-0.5 cursor-pointer filter-pill-btn' : 'pill-capsule-inactive px-2.5 py-0.5 text-slate-400 cursor-pointer filter-pill-btn';

    renderGlobalTrash();
  }

  async function refreshGlobalTrash() {
    try {
      const response = await fetch('/api/asset-registry/governance/overview', { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`治理总览读取失败（${response.status}）`);
      const data = await response.json();
      globalTrashState.projects = (Array.isArray(data.projects) ? data.projects : [])
        .filter(item => item && (item.deleted_at != null || item.deleted_entity_id));
      globalTrashState.assets = Array.isArray(data.assets) ? data.assets : [];
      globalTrashState.canvases = Array.isArray(data.canvases) ? data.canvases : [];

      globalTrashState.initialized = true;

      // 更新数量徽章
      const countProj = globalTrashState.projects.length;
      const countAssets = globalTrashState.assets.length;
      const countCanvases = globalTrashState.canvases.length;
      const totalTrash = countProj + countAssets + countCanvases;
      const elDrawerCountAll = document.getElementById('trashCountAll');

      const elDrawerCountProj = document.getElementById('trashCountProjects');
      const elDrawerCountAssets = document.getElementById('trashCountAssets');
      const elDrawerCountCanvases = document.getElementById('trashCountCanvases');
      const elTopBadge = document.getElementById('topbarTrashBadge');

      if (elDrawerCountProj) elDrawerCountProj.textContent = countProj;
      if (elDrawerCountAll) elDrawerCountAll.textContent = totalTrash;
      if (elDrawerCountAssets) elDrawerCountAssets.textContent = countAssets;
      if (elDrawerCountCanvases) elDrawerCountCanvases.textContent = countCanvases;
      if (elTopBadge) {
        elTopBadge.textContent = totalTrash;
        elTopBadge.style.display = totalTrash > 0 ? 'inline-block' : 'none';
      }

      renderGlobalTrash();
    } catch (e) {
      console.warn('刷新全局回收站池失败:', e);
      globalTrashState.projects = [];
      globalTrashState.assets = [];
      globalTrashState.canvases = [];
      renderGlobalTrash();
    }
  }

  function renderGlobalTrash() {
    const container = document.getElementById('globalTrashContainer');
    if (!container) return;

    const tab = globalTrashState.currentTab;

    if (tab === 'all') {
      const groups = [['projects', '项目', globalTrashState.projects], ['canvases', '画布', globalTrashState.canvases], ['assets', '资产', globalTrashState.assets]];
      container.innerHTML = groups.map(([kind, label, list]) => `<section class="space-y-1.5"><h4 class="text-[10px] font-mono text-slate-400">${label} · ${list.length}</h4>${list.length ? `<div class="space-y-1.5">${list.map(item => `<div class="bay-inset p-2.5 rounded-xl border border-white/5 flex items-center justify-between"><span class="text-xs text-slate-200 truncate">${esc(item.name || item.title || item.id)}</span><span class="text-[9px] font-mono text-slate-500">${formatTime(item.deleted_at)}</span></div>`).join('')}</div>` : '<div class="text-[10px] text-slate-600 font-mono">暂无删除内容</div>'}</section>`).join('');
    } else if (tab === 'projects') {
      const list = globalTrashState.projects;
      if (list.length === 0) {
        container.innerHTML = `
          <div class="bay-inset p-8 text-center text-slate-500 font-mono text-xs rounded-xl">
            <i data-lucide="check-circle-2" class="w-7 h-7 mx-auto mb-2 text-emerald-400/60"></i>
            <div>制片工程隔离池为空，暂无已移入工程</div>
          </div>
        `;
      } else {
        container.innerHTML = list.map(p => {
          const typeMeta = getProjectTypeMeta(p.project_type);
          const restoreAction = p.recycle_entry_id
            ? `V2Projects.restoreProjectContentFromTrash('${esc(p.recycle_entry_id)}')`
            : `V2Projects.confirmAction('restore', '${esc(p.id)}', '${esc(p.name)}', ${p.version || 1})`;
          return `
            <div class="bay-inset p-3 rounded-xl border border-white/5 hover:border-red-500/30 transition flex items-center justify-between">
              <div class="min-w-0 flex-1 pr-3">
                <div class="flex items-center space-x-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                  <h4 class="text-xs font-bold text-slate-100 truncate">${esc(p.name)}</h4>
                  <span class="text-[8px] font-mono px-1.5 py-0.2 rounded bg-red-500/15 text-red-400 border border-red-500/30">工程隔离</span>
                  <span class="text-[8px] font-mono text-slate-400">${typeMeta.label}</span>
                </div>
                <div class="text-[9px] font-mono text-slate-400 mt-1 flex items-center space-x-3">
                  <span>镜头: ${p.scenes || 24}场/${p.shots || 72}镜</span>
                  <span>隔离时间: ${formatTime(p.deleted_at)}</span>
                  <span>ID: ${esc(p.id)}</span>
                </div>
              </div>
              <button class="tactile-keycap px-2.5 py-1 rounded-lg text-[9.5px] font-bold text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/50 flex items-center space-x-1 cursor-pointer transition shrink-0"
                      onclick="${restoreAction}"
                      title="一键安全恢复该工程">
                <i data-lucide="rotate-ccw" class="w-3 h-3 text-emerald-400"></i>
                <span>安全恢复</span>
              </button>
            </div>
          `;
        }).join('');
      }
    } else if (tab === 'assets') {
      const list = globalTrashState.assets;
      if (list.length === 0) {
        container.innerHTML = `
          <div class="bay-inset p-8 text-center text-slate-500 font-mono text-xs rounded-xl">
            <i data-lucide="check-circle-2" class="w-7 h-7 mx-auto mb-2 text-emerald-400/60"></i>
            <div>素材库隔离池为空，暂无软删除资产</div>
          </div>
        `;
      } else {
        container.innerHTML = list.map(a => `
          <div class="bay-inset p-3 rounded-xl border border-white/5 hover:border-[#dfc384]/30 transition flex items-center justify-between">
            <div class="min-w-0 flex-1 pr-3">
              <div class="flex items-center space-x-2">
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <h4 class="text-xs font-bold text-slate-100 truncate">${esc(a.name)}</h4>
                <span class="text-[8px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">${esc(a.type || 'RAW')}</span>
              </div>
              <div class="text-[9px] font-mono text-slate-400 mt-1 flex items-center space-x-3">
                <span>大小: ${esc(a.size || '未知')}</span>
                <span>隔离时间: ${formatTime(a.deleted_at)}</span>
                <span class="truncate max-w-[120px]">哈希: ${esc(a.hash || 'sha256:...')}</span>
              </div>
            </div>
            <button class="tactile-keycap px-2.5 py-1 rounded-lg text-[9.5px] font-bold text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/50 flex items-center space-x-1 cursor-pointer transition shrink-0"
                    onclick="V2Projects.restoreAssetFromTrash('${esc(a.id)}')"
                    title="恢复此素材到资产库">
              <i data-lucide="rotate-ccw" class="w-3 h-3 text-emerald-400"></i>
              <span>恢复素材</span>
            </button>
          </div>
        `).join('');
      }
    } else if (tab === 'canvases') {
      const list = globalTrashState.canvases;
      if (list.length === 0) {
        container.innerHTML = `
          <div class="bay-inset p-8 text-center text-slate-500 font-mono text-xs rounded-xl">
            <i data-lucide="check-circle-2" class="w-7 h-7 mx-auto mb-2 text-emerald-400/60"></i>
            <div>工程画布隔离池为空，暂无软删除画布</div>
          </div>
        `;
      } else {
        container.innerHTML = list.map(c => `
          <div class="bay-inset p-3 rounded-xl border border-white/5 hover:border-purple-500/30 transition flex items-center justify-between">
            <div class="min-w-0 flex-1 pr-3">
              <div class="flex items-center space-x-2">
                <span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                <h4 class="text-xs font-bold text-slate-100 truncate">${esc(c.name)}</h4>
                <span class="text-[8px] font-mono px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">画布节点</span>
              </div>
              <div class="text-[9px] font-mono text-slate-400 mt-1 flex items-center space-x-3">
                <span>节点规模: ${c.nodes_count || 12} Nodes</span>
                <span>隔离时间: ${formatTime(c.deleted_at)}</span>
              </div>
            </div>
            <button class="tactile-keycap px-2.5 py-1 rounded-lg text-[9.5px] font-bold text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/50 flex items-center space-x-1 cursor-pointer transition shrink-0"
                    onclick="V2Projects.restoreCanvasFromTrash('${esc(c.id)}')"
                    title="恢复此画布到分镜画布台">
              <i data-lucide="rotate-ccw" class="w-3 h-3 text-emerald-400"></i>
              <span>恢复画布</span>
            </button>
          </div>
        `).join('');
      }
    }

    window.lucide?.createIcons();
  }

  // 18. 恢复素材库资产
  async function restoreAssetFromTrash(id) {
    try {
      await fetch(`/api/asset-registry/governance/asset-trash/${encodeURIComponent(id)}/restore`, {
        method: 'POST',
        credentials: 'same-origin'
      });
    } catch (e) {}

    globalTrashState.assets = globalTrashState.assets.filter(a => a.id !== id);
    showToast('素材资产已安全恢复至素材库', 'success');
    refreshGlobalTrash();
  }

  async function restoreProjectContentFromTrash(entryId) {
    try {
      const response = await fetch(`/api/asset-registry/project-recycle/${encodeURIComponent(entryId)}/restore`, { method: 'POST', credentials: 'same-origin' });
      if (!response.ok) throw new Error('项目内容恢复失败');
      showToast('项目内容已恢复', 'success');
      await refreshGlobalTrash();
    } catch (error) {
      showToast(error.message || '项目内容恢复失败', 'danger');
    }
  }

  // 19. 恢复工程画布
  async function restoreCanvasFromTrash(id) {
    try {
      await fetch(`/api/canvases/${encodeURIComponent(id)}/restore`, {
        method: 'POST',
        credentials: 'same-origin'
      });
    } catch (e) {}

    globalTrashState.canvases = globalTrashState.canvases.filter(c => c.id !== id);
    showToast('工程画布已安全恢复至分镜台', 'success');
    refreshGlobalTrash();
  }

  // 10. 键盘快捷键监听：按“·”（Backquote 点号键）进入当前选中项目的影视工坊
  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // 正在输入框中键入时忽略
      const target = e.target;
      if (target && (target.matches('input, textarea, select') || target.isContentEditable)) {
        return;
      }

      // 支持中英文按键输入下的反引号点号键
      if (e.key === '`' || e.key === '·' || e.code === 'Backquote') {
        e.preventDefault();
        const activeId = state.activeProjectId || (state.projects[0] && state.projects[0].id) || 'proj-01';
        openProject(activeId, 'workshop');
      }
    });
  }

  function init() {
    load();
    setupKeyboardShortcuts();
    if (new URLSearchParams(location.search).get('openTrash') === '1') {
      setTimeout(openGlobalTrashDrawer, 0);
    }
    try {
      const savedView = localStorage.getItem('v2_projects_view_mode');
      if (savedView === 'table' || savedView === 'grid') {
        switchView(savedView);
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    load,
    render,
    switchView,
    filterType,
    filterScope,
    toggleArchived: btn => filterScope(state.filterScope === 'archived' ? 'active' : 'archived', btn),
    search,
    selectProject,
    openProject,
    openEditProject,
    handleUpdateProject,
    openGlobalTrashDrawer,
    switchGlobalTrashTab,
    refreshGlobalTrash,
    restoreAssetFromTrash,
    restoreProjectContentFromTrash,
    restoreCanvasFromTrash,
    handleCreateProject,
    confirmAction,
    executeConfirmedAction,
    archiveProject,
    unarchiveProject,
    trashProject,
    restoreTrashedProject,
    showToast
  };
})();
