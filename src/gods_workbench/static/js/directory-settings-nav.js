(function () {
    if (document.querySelector('.settings-index [data-section="directories"]')) return;
    const nav = document.querySelector('.settings-index');
    const general = document.querySelector('[data-panel="general"]');
    if (!nav || !general) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.section = 'directories';
    button.className = (nav.querySelector('button')?.className || '')
        .replace(/\bactive\b/g, '')
        .replace(/\btext-white\b/g, '');
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = '<i data-lucide="folder-cog" class="w-4 h-4"></i><span>目录设置</span>';
    nav.firstElementChild.after(button);
    const panel = document.createElement('section');
    panel.dataset.panel = 'directories';
    panel.className = 'directory-settings-panel';
    panel.innerHTML = '<iframe title="目录设置" class="directory-settings-frame" src="/static/asset-manager.html?settings=directories&embedded=1" loading="lazy"></iframe>';
    general.after(panel);
})();
