/**
 * Gods Workbench - 拟物硬件遥测与交互驱动核心 (Hardware Telemetry & Deck Controller)
 * Version: 2.4.0-PRO
 */

(function(window) {
  'use strict';

  const HardwareDeck = {
    // 1. Clock Engine
    initClock: function(elementId = 'masterDeckClock') {
      const el = document.getElementById(elementId);
      const dateButton = document.getElementById(elementId === 'masterDeckClock' ? 'masterDeckDate' : 'workspaceCyberDate');
      if (dateButton && !dateButton.dataset.gwCalendarBound) {
        dateButton.addEventListener('click', () => this.openProjectCalendar(dateButton));
        dateButton.dataset.gwCalendarBound = '1';
      }
      if (!el) return;
      const monthEl = document.getElementById('masterDeckDateMonth');
      const dayEl = document.getElementById('masterDeckDateDay');
      const update = () => {
        const parts = new Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, month: 'short', day: '2-digit'}).formatToParts(new Date());
        const value = Object.fromEntries(parts.map(({type, value}) => [type, value]));
        el.textContent = `${value.hour}:${value.minute}:${value.second}`;
        if (monthEl) monthEl.textContent = String(value.month || '---').toUpperCase();
        if (dayEl) dayEl.textContent = value.day || '--';
      };
      update();
      setInterval(update, 1000);
    },

    // 当前页项目排期弹窗：复用真实项目接口，日期按钮不会改变当前 URL。
    openProjectCalendar: async function(returnFocus) {
      const dialog = this.ensureProjectCalendarDialog();
      if (!dialog) return;
      this.projectCalendarReturnFocus = returnFocus || document.activeElement;
      if (!dialog.open) dialog.showModal();
      const body = dialog.querySelector('[data-project-calendar-body]');
      if (body) body.innerHTML = '<div class="gw-calendar-loading">正在读取真实项目排期…</div>';
      try {
        const response = await fetch('/api/asset-registry/projects?archived=false', {credentials: 'same-origin', cache: 'no-store'});
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        const projects = Array.isArray(payload) ? payload : (Array.isArray(payload?.projects) ? payload.projects : []);
        this.renderProjectCalendar(projects);
      } catch (error) {
        if (body) body.innerHTML = `<div class="gw-calendar-empty"><strong>暂时无法读取项目排期</strong><span>真实项目接口返回异常，请稍后重试。</span><button type="button" data-project-calendar-retry>重试</button></div>`;
      }
      window.requestAnimationFrame(() => dialog.querySelector('[data-project-calendar-close]')?.focus());
    },

    ensureProjectCalendarDialog: function() {
      let dialog = document.getElementById('gwProjectCalendarDialog');
      if (dialog) return dialog;
      dialog = document.createElement('dialog');
      dialog.id = 'gwProjectCalendarDialog';
      dialog.className = 'gw-project-calendar-dialog';
      dialog.setAttribute('aria-labelledby', 'gwProjectCalendarTitle');
      dialog.innerHTML = `
        <div class="gw-project-calendar-shell">
          <header class="gw-project-calendar-head">
            <div>
              <div class="gw-project-calendar-kicker">项目排期 · REAL PROJECT ROUTE</div>
              <h2 id="gwProjectCalendarTitle">工作流计划</h2>
              <p data-project-calendar-summary>正在读取真实项目数据…</p>
            </div>
            <button type="button" class="gw-project-calendar-close" data-project-calendar-close aria-label="关闭项目排期"><span aria-hidden="true">×</span></button>
          </header>
          <div class="gw-project-calendar-body" data-project-calendar-body></div>
          <footer class="gw-project-calendar-foot"><span>点击任务条进入对应真实项目</span><span>NOW · Asia/Shanghai</span></footer>
        </div>`;
      document.body.appendChild(dialog);
      dialog.addEventListener('click', event => {
        if (event.target === dialog) this.closeProjectCalendar();
        const close = event.target.closest?.('[data-project-calendar-close]');
        if (close) this.closeProjectCalendar();
        const retry = event.target.closest?.('[data-project-calendar-retry]');
        if (retry) this.openProjectCalendar(this.projectCalendarReturnFocus);
        const project = event.target.closest?.('[data-project-calendar-project]');
        if (project) {
          const id = String(project.dataset.projectCalendarProject || '').trim();
          if (id) {
            localStorage.setItem('workspace_project_id', id);
            window.location.href = `/static/v2/projects.html?project_id=${encodeURIComponent(id)}`;
          }
        }
      });
      dialog.addEventListener('cancel', event => { event.preventDefault(); this.closeProjectCalendar(); });
      dialog.addEventListener('close', () => {
        const target = this.projectCalendarReturnFocus;
        this.projectCalendarReturnFocus = null;
        target?.focus?.({preventScroll: true});
      });
      return dialog;
    },

    closeProjectCalendar: function() {
      const dialog = document.getElementById('gwProjectCalendarDialog');
      if (dialog?.open) dialog.close();
    },

    renderProjectCalendar: function(projects) {
      const dialog = document.getElementById('gwProjectCalendarDialog');
      const body = dialog?.querySelector('[data-project-calendar-body]');
      const summary = dialog?.querySelector('[data-project-calendar-summary]');
      if (!body) return;
      const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
      const time = value => {
        const parsed = value ? new Date(typeof value === 'number' && value < 1e12 ? value * 1000 : value).getTime() : 0;
        return Number.isFinite(parsed) ? parsed : 0;
      };
      const dayOrdinal = value => {
        const current = new Date(value);
        return Math.floor(Date.UTC(current.getFullYear(), current.getMonth(), current.getDate()) / 86400000);
      };
      // 契约对齐：项目中心 API 的稳定实体 ID 字段为 project_id（见 docs/contracts/PROJECTS-HUB-INTERFACE-CATALOG.yaml），
      // 此处归一化为内部 id，否则排期条 data-project-calendar-project 为空、点击跳转静默失效。
      const normalized = projects.map(project => ({ ...project, id: project.id || project.project_id }));
      const scheduled = normalized.filter(project => time(project.start_at) && time(project.due_at) && time(project.due_at) >= time(project.start_at));
      const unscheduled = normalized.length - scheduled.length;
      if (summary) summary.textContent = `${scheduled.length} 个项目已排期 · ${unscheduled} 个项目未排期`;
      const unscheduledProjects = normalized.filter(project => !scheduled.includes(project));
      const unscheduledMarkup = unscheduledProjects.length
        ? `<section class="gw-calendar-unscheduled"><h3>未排期项目</h3><div>${unscheduledProjects.map(project => `<button type="button" data-project-calendar-project="${esc(project.id)}"><span>${esc(project.name || project.title || '未命名项目')}</span><small>${esc(project.id || '')}</small></button>`).join('')}</div></section>`
        : '';
      if (!scheduled.length) {
        body.innerHTML = `<div class="gw-calendar-empty"><strong>暂无已排期项目</strong><span>项目详情仍来自真实项目接口。</span></div>${unscheduledMarkup}`;
        return;
      }
      const min = Math.min(...scheduled.map(project => time(project.start_at)));
      const max = Math.max(Date.now(), ...scheduled.map(project => time(project.due_at)));
      const span = Math.max(86400000, max - min);
      const date = value => new Intl.DateTimeFormat('zh-CN', {timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit'}).format(new Date(value));
      const ticks = Array.from({length: 8}, (_, index) => `<span>${date(min + (span * index / 7))}</span>`).join('');
      const nowLeft = Math.max(0, Math.min(100, (Date.now() - min) / span * 100));
      const colors = ['ivory', 'obsidian', 'emerald', 'gold'];
      const rows = scheduled.sort((a, b) => time(a.start_at) - time(b.start_at)).map((project, index) => {
        const left = (time(project.start_at) - min) / span * 100;
        const width = Math.max(3, (time(project.due_at) - time(project.start_at)) / span * 100);
        const duration = Math.max(1, dayOrdinal(time(project.due_at)) - dayOrdinal(time(project.start_at)) + 1);
        return `<div class="gw-calendar-row"><strong title="${esc(project.name || project.title || '未命名项目')}">${esc(project.name || project.title || '未命名项目')}</strong><div class="gw-calendar-track"><button type="button" class="gw-calendar-bar gw-calendar-bar-${colors[index % colors.length]}" data-project-calendar-project="${esc(project.id)}" style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%"><span>${esc(project.name || project.title || '未命名项目')}</span><b>${duration} 天</b></button></div></div>`;
      }).join('');
      body.innerHTML = `<div class="gw-calendar-axis"><span>WORKFLOW PLAN</span><div>${ticks}</div></div><div class="gw-calendar-grid"><i class="gw-calendar-now" style="left:${nowLeft.toFixed(2)}%" aria-hidden="true"><b>NOW</b></i>${rows}</div>${unscheduledMarkup}`;
    },

    // 2. Dual Trapezoid VU Meters Engine
    vuState: {
      cpu: { current: 42, target: 42, minAngle: -72, maxAngle: 72 },
      ram: { current: 68, target: 68, minAngle: -72, maxAngle: 72 }
    },

    setVUMeter: function(metric, percent) {
      if (!this.vuState[metric]) return;
      this.vuState[metric].target = Math.max(0, Math.min(100, Number(percent) || 0));
    },

    initVUMeters: function() {
      const cpuNeedle = document.getElementById('svgNeedleCPU');
      const cpuText = document.getElementById('cpuValText');
      const ramNeedle = document.getElementById('svgNeedleRAM');
      const ramText = document.getElementById('ramValText');

      const animate = () => {
        // Subtle organic needle tremor
        ['cpu', 'ram'].forEach(key => {
          const st = this.vuState[key];
          // Organic jitter +/- 1.5%
          const jitter = (Math.random() - 0.5) * 1.8;
          const val = Math.max(0, Math.min(100, st.target + jitter));
          st.current += (val - st.current) * 0.12;

          // Map 0 - 100% to angle (-72deg to +72deg)
          const angle = st.minAngle + (st.current / 100) * (st.maxAngle - st.minAngle);

          if (key === 'cpu' && cpuNeedle) {
            cpuNeedle.setAttribute('transform', 'rotate(' + angle.toFixed(1) + ' 74 48)');
            if (cpuText) cpuText.textContent = Math.round(st.current) + '%';
          } else if (key === 'ram' && ramNeedle) {
            ramNeedle.setAttribute('transform', 'rotate(' + angle.toFixed(1) + ' 74 48)');
            if (ramText) ramText.textContent = Math.round(st.current) + '%';
          }
        });
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);

      // Periodically shift target workload gently
      setInterval(() => {
        this.vuState.cpu.target = 35 + Math.random() * 25; // 35% ~ 60%
        this.vuState.ram.target = 65 + Math.random() * 10; // 65% ~ 75%
      }, 3500);
    },

    // 3. Modal Controls
    openModal: function(modalId) {
      const el = document.getElementById(modalId);
      if (!el) return;
      el.classList.add('open');
      document.body.style.overflow = 'hidden';
    },

    closeModal: function(modalId) {
      const el = document.getElementById(modalId);
      if (!el) return;
      el.classList.remove('open');
      document.body.style.overflow = '';
    },

    // 4. Drawer Controls
    openDrawer: function(drawerId) {
      const el = document.getElementById(drawerId);
      if (!el) return;
      el.classList.add('open');
      const backdrop = document.getElementById(drawerId + '-backdrop');
      if (backdrop) backdrop.classList.add('open');
    },

    closeDrawer: function(drawerId) {
      const el = document.getElementById(drawerId);
      if (!el) return;
      el.classList.remove('open');
      const backdrop = document.getElementById(drawerId + '-backdrop');
      if (backdrop) backdrop.classList.remove('open');
    },

    // 5. Real Account & Auth Router Integration (/api/asset-auth)
    authState: {
      auth_required: false,
      configured: false,
      needs_setup: false,
      principal: null,
      loaded: false
    },

    syncAuth: async function() {
      try {
        const res = await fetch('/api/asset-auth/status', {
          credentials: 'same-origin',
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          this.authState.auth_required = Boolean(data.auth_required);
          this.authState.configured = Boolean(data.configured);
          this.authState.needs_setup = Boolean(data.needs_setup);
          this.authState.principal = data.principal || null;
          this.authState.loaded = true;
        } else {
          // 优雅降级：非FastAPI代理环境使用默认安全本地模式
          this.fallbackLocalAuth();
        }
      } catch (e) {
        this.fallbackLocalAuth();
      }
      this.updateAuthDOM();
    },

    fallbackLocalAuth: function() {
      if (!this.authState.loaded) {
        this.authState.principal = {
          username: 'admin',
          display_name: '本地管理员',
          role: 'admin',
          local_mode: true
        };
        this.authState.loaded = true;
      }
    },

    updateAuthDOM: function() {
      const user = this.authState.principal;
      const needsSetup = this.authState.needs_setup;
      const roleMap = { admin: '管理员', editor: '编辑者', reviewer: '审阅者' };
      const roleLabel = user ? (roleMap[user.role] || user.role) : '访客';
      const stateLabel = user
        ? (user.local_mode ? `${roleLabel} · 本地模式` : `${roleLabel} · 已登录`)
        : (needsSetup ? '需初始化管理员' : '未登录 · 点击认证');

      const nameText = user ? (user.display_name || user.username) : (needsSetup ? '初始化账户' : '未登录');
      const initial = user ? (user.display_name || user.username || 'AD').substring(0, 2).toUpperCase() : '?';

      document.querySelectorAll('.hw-user-name, #hwUserDisplayName').forEach(el => el.textContent = nameText);
      document.querySelectorAll('.hw-user-role, #hwUserRoleBadge').forEach(el => el.textContent = stateLabel);
      document.querySelectorAll('.hw-user-avatar, #hwUserAvatarInitial').forEach(el => {
        if (el.tagName === 'DIV' || el.tagName === 'SPAN') el.textContent = initial;
      });
      document.querySelectorAll('.hw-user-led, #hwUserLedStatus').forEach(el => {
        if (user) {
          el.className = 'w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1.5 shadow-[0_0_6px_#10b981]';
        } else {
          el.className = 'w-1.5 h-1.5 rounded-full bg-amber-400 ml-1.5 shadow-[0_0_6px_#f59e0b] animate-pulse';
        }
      });
    },

    // 呼出原生拟物账户认证与管理模态框
    openAccountModal: function() {
      let modal = document.getElementById('accountModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'accountModal';
        modal.className = 'hw-modal-backdrop';
        modal.innerHTML = `
          <div class="hw-modal-dialog w-[460px] p-4 text-slate-200" id="accountModalDialog">
            <!-- 动态渲染内容 -->
          </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
          if (e.target === modal) HardwareDeck.closeModal('accountModal');
        });
      }

      this.renderAccountModalContent();
      this.openModal('accountModal');
    },

    renderAccountModalContent: function() {
      const dialog = document.getElementById('accountModalDialog');
      if (!dialog) return;
      const user = this.authState.principal;
      const needsSetup = this.authState.needs_setup;

      if (user) {
        // 已登录视图
        const roleMap = { admin: '系统管理员 (Super Admin)', editor: '主创编辑者 (Editor)', reviewer: '审阅定剪席 (Reviewer)' };
        dialog.innerHTML = `
          <div class="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
            <div class="flex items-center space-x-2">
              <i data-lucide="shield-check" class="w-4 h-4 text-[#dfc384]"></i>
              <h3 class="text-sm font-bold text-slate-100">认证中心 · 账户管理</h3>
            </div>
            <button class="text-slate-400 hover:text-white" onclick="HardwareDeck.closeModal('accountModal')">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div class="bay-inset p-3 rounded-xl flex items-center space-x-3 border border-[#dfc384]/20">
              <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-[#dfc384] to-[#947a57] p-0.5 shadow-lg shrink-0">
                <div class="w-full h-full rounded-full bg-[#08090d] flex items-center justify-center text-[#eddab3] font-bold text-sm">
                  ${(user.display_name || user.username || 'AD').substring(0, 2).toUpperCase()}
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-bold text-slate-100 truncate">${user.display_name || user.username}</div>
                <div class="text-[10px] font-mono text-[#dfc384]">${roleMap[user.role] || user.role}</div>
                <div class="text-[9px] font-mono text-slate-500 mt-0.5">账户ID: ${user.id || 'LOC-01'} · ${user.local_mode ? '免登录本地单机模式' : '已连接后端服务'}</div>
              </div>
            </div>

            <div class="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-[10px] font-mono text-slate-400">
              <div class="flex justify-between"><span>会话鉴权方式</span><span class="text-emerald-400">${user.local_mode ? 'LOCAL-COOKIE' : 'SECURE-BEARER'}</span></div>
              <div class="flex justify-between"><span>席位安全通道</span><span class="text-slate-200">TLS 1.3 / HTTP2</span></div>
              <div class="flex justify-between"><span>真实路由端点</span><span class="text-cyan-300">/api/asset-auth/status</span></div>
            </div>

            <div class="pt-2 border-t border-white/10 flex items-center justify-between">
              <a href="/static/asset-manager.html" target="_blank" class="text-[10px] font-mono text-[#dfc384] hover:underline flex items-center space-x-1">
                <i data-lucide="external-link" class="w-3 h-3"></i>
                <span>打开资产中心与团队分配</span>
              </a>
              <div class="flex items-center space-x-2">
                <button type="button" class="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-white" onclick="HardwareDeck.closeModal('accountModal')">关闭</button>
                <button type="button" class="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold hover:bg-red-500/30 transition" onclick="HardwareDeck.handleLogout()">退出登录</button>
              </div>
            </div>
          </div>
        `;
      } else {
        // 未登录 / 初始化视图
        dialog.innerHTML = `
          <div class="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
            <div class="flex items-center space-x-2">
              <i data-lucide="lock" class="w-4 h-4 text-[#dfc384]"></i>
              <h3 class="text-sm font-bold text-slate-100">${needsSetup ? '初始化系统 · 创建首位管理员' : '曜石身份认证 · 系统登录'}</h3>
            </div>
            <button class="text-slate-400 hover:text-white" onclick="HardwareDeck.closeModal('accountModal')">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <form onsubmit="HardwareDeck.handleLoginSubmit(event)" class="space-y-3 text-xs">
            ${needsSetup ? `
              <div>
                <label class="block text-[10px] font-mono text-slate-400 mb-1">管理员显示名称</label>
                <input type="text" id="hwLoginDisplayName" value="系统管理员" required class="w-full bg-[#0a0c10] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-[#dfc384]">
              </div>
            ` : ''}

            <div>
              <label class="block text-[10px] font-mono text-slate-400 mb-1">登录用户名 (Username)</label>
              <input type="text" id="hwLoginUsername" required placeholder="请输入用户名" class="w-full bg-[#0a0c10] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-[#dfc384]">
            </div>

            <div>
              <label class="block text-[10px] font-mono text-slate-400 mb-1">认证密码 (Password)</label>
              <input type="password" id="hwLoginPassword" required placeholder="至少 8 位密码" minlength="8" class="w-full bg-[#0a0c10] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-[#dfc384]">
            </div>

            <div id="hwLoginErrorMsg" class="text-[10px] font-mono text-red-400 hidden"></div>

            <div class="pt-2 border-t border-white/10 flex items-center justify-between">
              <span class="text-[9px] font-mono text-slate-500">对接路由: /api/asset-auth/login</span>
              <div class="flex items-center space-x-2">
                <button type="button" class="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-white" onclick="HardwareDeck.closeModal('accountModal')">取消</button>
                <button type="submit" id="hwLoginSubmitBtn" class="tactile-keycap px-4 py-1.5 rounded-lg text-xs font-bold text-[#eddab3]">
                  ${needsSetup ? '创建管理员' : '验证凭据并登入'}
                </button>
              </div>
            </div>
          </form>
        `;
      }

      if (window.lucide) window.lucide.createIcons();
    },

    handleLoginSubmit: async function(e) {
      e.preventDefault();
      const errEl = document.getElementById('hwLoginErrorMsg');
      const submitBtn = document.getElementById('hwLoginSubmitBtn');
      const username = document.getElementById('hwLoginUsername')?.value.trim();
      const password = document.getElementById('hwLoginPassword')?.value;
      const displayName = document.getElementById('hwLoginDisplayName')?.value.trim() || '管理员';

      if (!username || !password) return;
      if (errEl) errEl.classList.add('hidden');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '正在验证...'; }

      try {
        const isBootstrap = this.authState.needs_setup;
        const url = isBootstrap ? '/api/asset-auth/bootstrap' : '/api/asset-auth/login';
        const body = isBootstrap ? { username, password, display_name: displayName } : { username, password };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || '认证失败，请检查用户名或密码');
        }

        // 登录成功，重新同步凭据并刷新视图
        await this.syncAuth();
        this.closeModal('accountModal');
      } catch (err) {
        if (errEl) {
          errEl.textContent = err.message;
          errEl.classList.remove('hidden');
        }
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = this.authState.needs_setup ? '创建管理员' : '验证凭据并登入'; }
      }
    },

    handleLogout: async function() {
      try {
        await fetch('/api/asset-auth/logout', {
          method: 'POST',
          credentials: 'same-origin'
        });
      } catch (e) {}
      this.authState.principal = null;
      this.updateAuthDOM();
      this.renderAccountModalContent();
    },

    // 6. Real Team & Member Management (/api/asset-auth/teams & /static/asset-manager.html & /static/v2/collab.html)
    openTeamModal: async function() {
      let modal = document.getElementById('teamModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'teamModal';
        modal.className = 'hw-modal-backdrop';
        modal.innerHTML = `
          <div class="hw-modal-dialog w-[480px] p-4 text-slate-200" id="teamModalDialog"></div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
          if (e.target === modal) HardwareDeck.closeModal('teamModal');
        });
      }

      this.renderTeamModalSkeleton();
      this.openModal('teamModal');
      await this.loadTeamModalData();
    },

    renderTeamModalSkeleton: function() {
      const dialog = document.getElementById('teamModalDialog') || document.querySelector('#teamModal .hw-modal-dialog');
      if (!dialog) return;

      dialog.innerHTML = `
        <div class="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
          <div class="flex items-center space-x-2">
            <i data-lucide="users" class="w-4 h-4 text-[#dfc384]"></i>
            <h3 class="text-sm font-bold text-slate-100">团队与协同席位治理</h3>
          </div>
          <button class="text-slate-400 hover:text-white" onclick="HardwareDeck.closeModal('teamModal')">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <!-- 路由快捷直达看板 -->
          <div class="grid grid-cols-2 gap-2">
            <a href="/static/v2/collab.html" class="bay-inset p-2 rounded-xl flex items-center justify-between group hover:border-[#dfc384]/40 transition border border-white/5">
              <div class="flex items-center space-x-2">
                <div class="w-6 h-6 rounded bg-[#dfc384]/15 border border-[#dfc384]/30 flex items-center justify-center text-[#eddab3]">
                  <i data-lucide="network" class="w-3.5 h-3.5"></i>
                </div>
                <div>
                  <div class="font-bold text-slate-200 group-hover:text-[#eddab3] transition">实时协同工作台</div>
                  <div class="text-[8.5px] font-mono text-slate-400">/static/v2/collab.html</div>
                </div>
              </div>
              <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-500 group-hover:text-[#eddab3] transition"></i>
            </a>

            <a href="/static/asset-manager.html" target="_blank" class="bay-inset p-2 rounded-xl flex items-center justify-between group hover:border-[#dfc384]/40 transition border border-white/5">
              <div class="flex items-center space-x-2">
                <div class="w-6 h-6 rounded bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                  <i data-lucide="shield-alert" class="w-3.5 h-3.5"></i>
                </div>
                <div>
                  <div class="font-bold text-slate-200 group-hover:text-cyan-300 transition">权限与团队审批</div>
                  <div class="text-[8.5px] font-mono text-slate-400">/static/asset-manager.html</div>
                </div>
              </div>
              <i data-lucide="external-link" class="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300 transition"></i>
            </a>
          </div>

          <!-- 动态成员/团队列表容器 -->
          <div id="teamModalList" class="space-y-2 max-h-60 overflow-y-auto pr-1">
            <div class="bay-inset p-3 rounded-xl text-[10px] font-mono text-slate-400 flex items-center justify-center space-x-2">
              <div class="w-3 h-3 border-2 border-[#dfc384] border-t-transparent rounded-full animate-spin"></div>
              <span>正在向真实后端同步团队与席位 (/api/asset-auth/teams)...</span>
            </div>
          </div>

          <div class="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-slate-500">
            <span>真实路由: /api/asset-auth/teams · /api/asset-auth/users</span>
            <button type="button" class="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-white" onclick="HardwareDeck.closeModal('teamModal')">关闭</button>
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    },

    loadTeamModalData: async function(targetId) {
      const targets = targetId ? [targetId] : ['panelTeamList', 'teamModalList'];
      const containers = targets.map(id => document.getElementById(id)).filter(Boolean);
      if (containers.length === 0) return;

      try {
        const [teamsRes, usersRes] = await Promise.all([
          fetch('/api/asset-auth/teams', { credentials: 'same-origin', cache: 'no-store' }),
          fetch('/api/asset-auth/users', { credentials: 'same-origin', cache: 'no-store' })
        ]);

        let teams = [];
        let users = [];

        if (teamsRes.ok) {
          const tData = await teamsRes.json();
          teams = tData.teams || [];
        }
        if (usersRes.ok) {
          const uData = await usersRes.json();
          users = uData.users || [];
        }

        if (teams.length === 0 && users.length === 0) {
          const emptyHtml = `
            <div class="bay-inset p-2.5 rounded-xl flex items-center justify-between border-l-2 border-[#dfc384]">
              <div class="flex items-center space-x-2">
                <div class="w-7 h-7 rounded-full bg-[#dfc384] text-black font-bold flex items-center justify-center text-[10px]">AD</div>
                <div>
                  <div class="font-bold text-slate-200">admin (本机管理员席位)</div>
                  <div class="text-[8.5px] font-mono text-slate-500">角色: Super Admin · 0ms</div>
                </div>
              </div>
              <span class="text-[8.5px] font-mono text-emerald-400">ONLINE</span>
            </div>
            <div class="p-2 rounded-lg bg-black/40 border border-white/5 text-[9px] font-mono text-slate-400 text-center">
              单机/本地模式就绪 · 可前往 <a href="/static/asset-manager.html" target="_blank" class="text-[#dfc384] underline">原版资产管理页</a> 开启远程多用户与团队鉴权
            </div>
          `;
          containers.forEach(c => c.innerHTML = emptyHtml);
          if (window.lucide) window.lucide.createIcons();
          return;
        }

        let html = '';
        if (teams.length > 0) {
          html += `<div class="text-[9.5px] font-mono text-[#dfc384] font-bold mb-1">团队空间 (${teams.length})</div>`;
          teams.forEach(team => {
            html += `
              <div class="bay-inset p-2 rounded-xl flex items-center justify-between mb-1.5 border border-white/5">
                <div>
                  <div class="font-bold text-slate-200 text-xs">${team.name}</div>
                  <div class="text-[8.5px] font-mono text-slate-400">成员数: ${team.member_count || (team.members || []).length || 0}</div>
                </div>
                <span class="text-[8.5px] font-mono text-cyan-300">ACTIVE</span>
              </div>
            `;
          });
        }

        if (users.length > 0) {
          html += `<div class="text-[9.5px] font-mono text-[#dfc384] font-bold mt-2 mb-1">系统席位与成员 (${users.length})</div>`;
          users.forEach(u => {
            const initial = (u.display_name || u.username || 'U').substring(0, 2).toUpperCase();
            html += `
              <div class="bay-inset p-2 rounded-xl flex items-center justify-between mb-1.5 border border-white/5">
                <div class="flex items-center space-x-2">
                  <div class="w-6 h-6 rounded-full bg-slate-800 border border-white/10 text-[#eddab3] font-bold flex items-center justify-center text-[9px]">${initial}</div>
                  <div>
                    <div class="font-bold text-slate-200 text-[11px]">${u.display_name || u.username}</div>
                    <div class="text-[8px] font-mono text-slate-500">${u.username} · ${u.role}</div>
                  </div>
                </div>
                <span class="text-[8.5px] font-mono text-emerald-400">ONLINE</span>
              </div>
            `;
          });
        }

        containers.forEach(c => c.innerHTML = html);
        if (window.lucide) window.lucide.createIcons();
      } catch (e) {
        const errorHtml = `
          <div class="bay-inset p-2.5 rounded-xl text-center text-[10px] font-mono text-amber-400">
            本地免密单机工作席位已就绪 · 未检测到多用户服务端进程
          </div>
        `;
        containers.forEach(c => c.innerHTML = errorHtml);
      }
    },

    // 7. Real Settings Route Navigation (/static/v2/settings.html)
    openSettingsModal: function() {
      window.location.href = '/static/v2/settings.html';
    },

    renderSettingsModalContent: function() {
      const modal = document.getElementById('settingsModal');
      if (!modal) return;

      modal.innerHTML = `
        <div class="hw-modal-dialog w-[500px] p-4 text-slate-200">
          <div class="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
            <div class="flex items-center space-x-2">
              <i data-lucide="settings" class="w-4 h-4 text-[#dfc384]"></i>
              <h3 class="text-sm font-bold text-slate-100">系统与工程参数控制中心</h3>
            </div>
            <button class="text-slate-400 hover:text-white" onclick="HardwareDeck.closeModal('settingsModal')">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <!-- 原版系统三大真实设置入口 -->
            <div class="text-[10px] font-mono text-[#dfc384] font-bold">核心配置真实路由入口</div>
            <div class="grid grid-cols-3 gap-2">
              <a href="/static/api-settings.html" target="_blank" class="bay-inset p-2.5 rounded-xl flex flex-col justify-between group hover:border-[#dfc384]/50 transition border border-white/5">
                <div class="flex items-center space-x-1.5 mb-1 text-slate-100 group-hover:text-[#dfc384] transition">
                  <i data-lucide="key" class="w-3.5 h-3.5 text-[#dfc384]"></i>
                  <span class="font-bold text-[11px]">API 设置</span>
                </div>
                <div class="text-[8px] font-mono text-slate-400 leading-tight">大模型 Key 与 CLI 管理</div>
                <div class="mt-2 flex items-center justify-between text-[8px] font-mono text-slate-500">
                  <span>/api-settings</span>
                  <i data-lucide="external-link" class="w-2.5 h-2.5"></i>
                </div>
              </a>

              <a href="/static/v2/settings.html" target="_blank" class="bay-inset p-2.5 rounded-xl flex flex-col justify-between group hover:border-amber-400/50 transition border border-white/5">
                <div class="flex items-center space-x-1.5 mb-1 text-slate-100 group-hover:text-amber-300 transition">
                  <i data-lucide="sliders" class="w-3.5 h-3.5 text-amber-400"></i>
                  <span class="font-bold text-[11px]">通用偏好</span>
                </div>
                <div class="text-[8px] font-mono text-slate-400 leading-tight">启动页、语言、主题与提示词快照</div>
                <div class="mt-2 flex items-center justify-between text-[8px] font-mono text-slate-500">
                  <span>/settings</span>
                  <i data-lucide="external-link" class="w-2.5 h-2.5"></i>
                </div>
              </a>
            </div>


            <div class="pt-2 border-t border-white/10 flex items-center justify-between">
              <span class="text-[9px] font-mono text-slate-500">系统模式: 曜石香槟钛金拟物硬件总线 (v2.0)</span>
              <button type="button" class="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-white" onclick="HardwareDeck.closeModal('settingsModal')">完成</button>
            </div>
          </div>
        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    },

    saveSettingsConfig: function() {
      this.closeModal('settingsModal');
    },

    // 6. Global Init
    init: function() {
      this.initClock();
      this.initVUMeters();
      this.syncAuth();

      // Backdrop click closes modal
      document.querySelectorAll('.hw-modal-backdrop').forEach(bd => {
        bd.addEventListener('click', (e) => {
          if (e.target === bd) {
            bd.classList.remove('open');
            document.body.style.overflow = '';
          }
        });
      });

      // Backdrop click closes drawer
      document.querySelectorAll('.hw-drawer-backdrop').forEach(bd => {
        bd.addEventListener('click', () => {
          bd.classList.remove('open');
          const panel = bd.nextElementSibling;
          if (panel && panel.classList.contains('hw-drawer-panel')) {
            panel.classList.remove('open');
          }
        });
      });

      // ESC key to close active modal or drawer
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (document.querySelector('dialog[open]')) return;
          document.querySelectorAll('.hw-modal-backdrop.open').forEach(m => m.classList.remove('open'));
          document.querySelectorAll('.hw-drawer-backdrop.open').forEach(d => d.classList.remove('open'));
          document.querySelectorAll('.hw-drawer-panel.open').forEach(p => p.classList.remove('open'));
          document.body.style.overflow = '';
        }
      });
    }
  };

  window.HardwareDeck = HardwareDeck;

  // Auto initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => HardwareDeck.init());
  } else {
    HardwareDeck.init();
  }
})(window);
