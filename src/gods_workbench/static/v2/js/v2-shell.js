(function () {
  'use strict';
  const ROUTES = {
    'index.html': 'index.html', 'projects.html': 'projects.html', 'workshop.html': 'workshop.html',
    'production.html': 'production.html', 'storyboard.html': 'storyboard.html?view=canvas',
    'agents.html': 'agents.html', 'assets.html': 'assets.html', 'collab.html': 'collab.html', 'settings.html': 'settings.html'
  };
  function standardRightDeck() {
    const deck = document.querySelector('.topbar-master-deck .recessed-deck-slot');
    if (!deck || deck.children.length < 2) return;
    const old = deck.lastElementChild;
    if (old?.classList.contains('gw-shell-right')) return;
    const right = document.createElement('div');
    right.className = 'gw-shell-right';
    right.innerHTML = '<div class="gw-shell-fader"><span>FLUX</span><div class="hw-fader-track-horizontal gw-shell-fader-track"><div class="hw-fader-glow-bar" style="width:0%"></div><div class="hw-fader-thumb-3d" style="left:0%"></div></div><span class="text-amber-300" data-gw-degradation="not_integrated" title="本切片无任何真实算力/GPU 遥测数据源，未读取任何指标">未接入</span></div><div class="gw-shell-fader"><span>VRAM</span><div class="hw-fader-track-horizontal gw-shell-fader-track"><div class="hw-fader-glow-bar" style="width:0%;background:linear-gradient(90deg,#38bdf8,#2dd4bf)"></div><div class="hw-fader-thumb-3d" style="left:0%"></div></div><span class="text-amber-300" data-gw-degradation="not_integrated" title="本切片无任何真实显存遥测数据源，未读取任何指标">未接入</span></div><span class="h-4 w-px bg-white/10"></span><span class="text-[9px] font-mono text-slate-400">PRE</span><div class="hw-slide-toggle active" aria-label="PRE/POST"><div class="hw-slide-peg"></div></div><span class="text-[9px] font-mono text-[#dfc384]">POST</span><span class="h-4 w-px bg-white/10"></span><a id="topbarUnifiedTrashBtn" class="gw-shell-trash" href="projects.html?openTrash=1" onclick="if(window.V2Projects?.openGlobalTrashDrawer){event.preventDefault();window.V2Projects.openGlobalTrashDrawer();}" title="统一回收站" aria-label="打开统一回收站"><span class="hw-mini-knob"><span class="hw-mini-knob-arc" style="border-top-color:#ef4444;border-right-color:#f59e0b"></span><span class="hw-mini-knob-inner"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></span></span><span id="topbarTrashBadge" class="gw-shell-trash-badge" hidden>0</span></a><div class="h-4 w-px bg-white/10"></div><div class="hw-avatar-keycap" title="认证状态未接入：点击打开认证中心查看真实登录状态" data-gw-identity="unverified"><div class="hw-avatar-keycap-inner"><i data-lucide="shield-check" class="w-4 h-4 text-[#eddab3]"></i></div><span class="hw-avatar-keycap-status"></span></div>';
    old.replaceWith(right);
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }
  function injectTrash() {
    const deck = document.querySelector('.topbar-master-deck .recessed-deck-slot');
    if (!deck || deck.querySelector('.gw-shell-trash') || document.querySelector('#topbarUnifiedTrashBtn')) return;
    const right = deck.lastElementChild;
    if (!right) return;
    const button = document.createElement('a');
    button.className = 'gw-shell-trash';
    button.href = 'projects.html?openTrash=1';
    button.title = '统一回收站';
    button.setAttribute('aria-label', '打开统一回收站');
    button.innerHTML = '<span class="hw-mini-knob"><span class="hw-mini-knob-arc" style="border-top-color:#ef4444;border-right-color:#f59e0b"></span><span class="hw-mini-knob-inner"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></span></span><span class="gw-shell-trash-badge" hidden>0</span>';
    const divider = document.createElement('span');
    divider.className = 'h-4 w-px bg-white/10';
    right.insertBefore(divider, right.firstChild);
    right.insertBefore(button, right.firstChild);
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  }
  function syncNavPills(href = location.href) {
    const url = new URL(href, location.href);
    const activeName = url.pathname.split('/').pop() || 'index.html';
    const settingsActive = activeName === 'settings.html' || (activeName === 'index.html' && url.searchParams.get('view') === 'settings');
    document.querySelectorAll('.nav-pill-btn').forEach(item => {
      const itemHref = item.getAttribute('href') || '';
      let active = false;
      if (item.id === 'navPillSettings') active = settingsActive;
      else if (item.id === 'navPillDashboard') active = !settingsActive && activeName === 'index.html';
      else if (itemHref) {
        const target = new URL(itemHref, location.href);
        const targetName = target.pathname.split('/').pop() || 'index.html';
        active = targetName === activeName;
        if (targetName === 'index.html' && target.searchParams.get('view') === 'settings') active = settingsActive;
      }
      item.classList.toggle('pill-capsule-active', active);
      item.classList.toggle('pill-capsule-inactive', !active);
      if (item.matches('button')) item.setAttribute('aria-pressed', String(active));
    });
  }
  function init() { standardRightDeck(); injectTrash(); syncNavPills(location.href); }
  function shellWorkspace() { return document.querySelector('.topbar-master-deck')?.nextElementSibling || null; }
  function targetWorkspace(doc) { return doc.querySelector('.topbar-master-deck')?.nextElementSibling || doc.body; }
  function firstSidebar(workspace) { return workspace?.querySelector(':scope > aside') || null; }
  function workspaceNodes(workspace, aside) { return [...(workspace?.children || [])].filter(node => node !== aside); }
  function syncRouteBody(doc) {
    if (!doc.body) return;
    document.body.className = doc.body.className;
    [...document.body.attributes].forEach(attribute => {
      if (attribute.name.startsWith('data-')) document.body.removeAttribute(attribute.name);
    });
    [...doc.body.attributes].forEach(attribute => {
      if (attribute.name.startsWith('data-')) document.body.setAttribute(attribute.name, attribute.value);
    });
  }
  async function runRouteScripts(doc) {
    const scripts = [...doc.querySelectorAll('body > script')].filter(script => {
      const src = script.getAttribute('src') || '';
      return src && !src.includes('v2-shell.js') && src.includes('/static/') || (!src && script.textContent.trim());
    });
    for (const source of scripts) {
      const script = document.createElement('script');
      if (source.src) {
        script.src = new URL(source.getAttribute('src'), doc.baseURI || location.href).href;
        script.async = false;
        await new Promise(resolve => { script.onload = resolve; script.onerror = resolve; document.body.appendChild(script); });
      } else {
        script.textContent = source.textContent;
        document.body.appendChild(script);
      }
    }
  }
  async function navigate(href, push) {
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) return;
    const currentWorkspace = shellWorkspace();
    const currentSidebar = firstSidebar(currentWorkspace);
    if (!currentWorkspace) { location.href = url.href; return; }
    try {
      const response = await fetch(url.href, { credentials: 'same-origin', headers: { 'X-GW-Partial': '1' } });
      if (!response.ok) throw new Error('route ' + response.status);
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const nextWorkspace = targetWorkspace(doc);
      syncRouteBody(doc);
      // Settings uses a direct <main> root while work pages use a workspace
      // wrapper. Preserve the shared header, but swap the complete content
      // root at this boundary so the target layout classes remain intact.
      if (currentWorkspace.matches('main') !== nextWorkspace.matches('main')) {
        currentWorkspace.replaceWith(document.importNode(nextWorkspace, true));
        if (push) history.pushState({}, '', url.href);
        if (doc.title) document.title = doc.title;
        standardRightDeck();
        await runRouteScripts(doc);
        syncNavPills(url.href);
        window.dispatchEvent(new CustomEvent('gw:route-loaded', { detail: { href: url.href } }));
        if (window.lucide?.createIcons) window.lucide.createIcons();
        return;
      }
      const nextSidebar = firstSidebar(nextWorkspace);
      const nextNodes = workspaceNodes(nextWorkspace, nextSidebar);
      if (!nextNodes.length) throw new Error('target workspace missing');
      document.querySelectorAll('style[data-gw-route-style],link[data-gw-route-style]').forEach(node => node.remove());
      doc.head.querySelectorAll('style,link[rel="stylesheet"]').forEach(node => {
        const copy = node.cloneNode(true); copy.dataset.gwRouteStyle = '1'; document.head.appendChild(copy);
      });
      if (currentSidebar && nextSidebar) {
        currentSidebar.innerHTML = nextSidebar.innerHTML;
        currentSidebar.id = nextSidebar.id;
      } else if (currentSidebar && !nextSidebar) {
        currentSidebar.innerHTML = '<div class="flex-1"></div>';
        currentSidebar.removeAttribute('id');
      }
      workspaceNodes(currentWorkspace, currentSidebar).forEach(node => node.remove());
      nextNodes.forEach(node => currentWorkspace.appendChild(document.importNode(node, true)));
      if (push) history.pushState({}, '', url.href);
      if (doc.title) document.title = doc.title;
      syncNavPills(url.href);
      standardRightDeck();
      await runRouteScripts(doc);
      window.dispatchEvent(new CustomEvent('gw:route-loaded', { detail: { href: url.href } }));
      if (window.lucide?.createIcons) window.lucide.createIcons();
    } catch (error) {
      console.warn('[GW shell] partial route failed, falling back to full navigation', error);
      location.href = url.href;
    }
  }
  function bindNavigation() {
    document.addEventListener('click', event => {
      const link = event.target.closest('.nav-pill-btn[href], .tree-node-card[href]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.matches('.tree-node-card') && !firstSidebar(shellWorkspace())?.contains(link)) return;
      const rawHref = link.getAttribute('href') || '';
      const targetUrl = new URL(rawHref, location.href);
      if (targetUrl.origin !== location.origin || !targetUrl.pathname.startsWith('/static/v2/') || !ROUTES[targetUrl.pathname.split('/').pop()] || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
      event.preventDefault();
      const target = targetUrl.pathname.endsWith('/index.html') && targetUrl.searchParams.get('view') === 'settings' ? 'settings.html' : link.href;
      navigate(target, true);
    });
    window.addEventListener('popstate', () => navigate(location.href, false));
  }
  function bindSelection() {
    const selector = '.tree-node-card';
    let observer;
    function prepare() {
      const aside = firstSidebar(shellWorkspace());
      if (!aside) return;
      aside.querySelectorAll(selector).forEach(item => {
        if (!item.matches('a, button')) {
          item.setAttribute('role', 'button');
          item.tabIndex = 0;
        }
        if (!item.matches('a')) {
          const pressed = String(item.classList.contains('active'));
          if (item.getAttribute('aria-pressed') !== pressed) item.setAttribute('aria-pressed', pressed);
        }
      });
    }
    function observeSidebar() {
      observer?.disconnect();
      prepare();
      const aside = firstSidebar(shellWorkspace());
      if (!aside) return;
      observer = new MutationObserver(prepare);
      observer.observe(aside, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }
    document.addEventListener('click', event => {
      const target = event.target.closest(selector);
      const aside = firstSidebar(shellWorkspace());
      if (!target || !aside?.contains(target) || target.matches('[disabled], [aria-disabled="true"]') || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      aside.querySelectorAll(selector).forEach(item => {
        item.classList.toggle('active', item === target);
      });
    }, true);
    document.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target.closest(selector);
      if (!target || event.target !== target || target.matches('a, button') || !firstSidebar(shellWorkspace())?.contains(target)) return;
      event.preventDefault();
      target.click();
    });
    window.addEventListener('gw:route-loaded', observeSidebar);
    observeSidebar();
  }
  const oldInit = init;
  init = function () { oldInit(); bindNavigation(); bindSelection(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
