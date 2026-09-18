(function(){
    const currentScript = document.currentScript;
    const cacheQuery = currentScript?.src
        ? new URL(currentScript.src, document.baseURI).search || ''
        : '';
    const withVersion = src => cacheQuery
        ? src + cacheQuery
        : src;
    const scripts = [
        '/static/js/i18n-core.js',
        '/static/js/i18n/common.js',
        '/static/js/i18n/studio.js',
        '/static/js/i18n/api-settings.js',
        '/static/js/i18n/canvas.js',
        '/static/js/i18n/smart-canvas.js',
        '/static/js/i18n/comfyui-settings.js',
        '/static/js/i18n/task-center.js',
        '/static/js/i18n/governance.js',
    ];
    const tags = scripts.map(src => '<script src="' + withVersion(src) + '"></script>').join('');
    if(document.readyState === 'loading' && currentScript){
        document.write(tags);
        return;
    }
    scripts.reduce((promise, src) => promise.then(() => new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = withVersion(src);
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    })), Promise.resolve()).then(() => window.StudioI18n?.apply?.()).catch(err => console.error('Failed to load i18n modules', err));
})();
