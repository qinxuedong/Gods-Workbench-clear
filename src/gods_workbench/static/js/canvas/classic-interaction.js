(function(){
    function isEditableTarget(target){
        const tag = target?.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable || target?.closest?.('select, option');
    }

    function isZoomPreviewIgnoredTarget(target){
        return !!target?.closest?.('#createMenu, #linkCreateMenu, #nodeInputMenu, #nodeOutputMenu, #imageNodeMenu, .minimap, #canvasAssetPanel, #assetManagerModal, #workflowTransferModal, #logModal, #promptTemplateModal, #imageEditModal, #outputLightbox');
    }

    function bindKeyboardLifecycle({setRKeyDown, setKnifeMode, resetSelectionDrag}){
        window.addEventListener('keyup', event => {
            if(String(event.key || '').toLowerCase() === 'r') setRKeyDown(false);
            if(event.key === 'Shift') setKnifeMode(false);
        });
        window.addEventListener('blur', () => {
            setRKeyDown(false);
            setKnifeMode(false);
            resetSelectionDrag();
        });
    }

    function bindThemeLifecycle({applyTheme}){
        window.addEventListener('studio-theme-change', event => {
            applyTheme(event.detail?.theme || 'dark');
        });
    }

    window.GodsWorkbenchClassicCanvasInteraction = {
        isEditableTarget,
        isZoomPreviewIgnoredTarget,
        bindKeyboardLifecycle,
        bindThemeLifecycle
    };
})();
