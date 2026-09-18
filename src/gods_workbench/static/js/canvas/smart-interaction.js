(function(){
    function isEditableTarget(target){
        const el = target || document.activeElement;
        return !!el?.closest?.('input, textarea, select, option, [contenteditable="true"], .prompt-node-control, .prompt-input');
    }

    function bindKeyboardLifecycle({setRKeyDown}){
        window.addEventListener('keyup', event => {
            if(String(event.key || '').toLowerCase() === 'r') setRKeyDown(false);
        });
        window.addEventListener('blur', () => setRKeyDown(false));
    }

    function bindThemeLifecycle({applyTheme}){
        window.addEventListener('studio-theme-change', event => {
            applyTheme(event.detail?.theme || 'dark');
        });
    }

    window.GodsWorkbenchSmartCanvasInteraction = {isEditableTarget, bindKeyboardLifecycle, bindThemeLifecycle};
})();
