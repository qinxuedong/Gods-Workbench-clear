(function(){
    function safeScale(value){
        const n = Number(value);
        return Number.isFinite(n) && n > 0 ? n : 1;
    }

    function applyViewport(world, shell, viewport, renderMinimap, scheduleSmartImageResolutionSync){
        world.style.transform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`;
        world.classList.toggle('canvas-scaled', Math.abs(viewport.scale - 1) > 0.001);
        shell.style.backgroundSize = '24px 24px';
        shell.style.backgroundPosition = '0 0';
        renderMinimap?.();
        scheduleSmartImageResolutionSync?.(world, 120);
    }

    function screenToWorld(shell, viewport, event){
        const rect = shell.getBoundingClientRect();
        return {
            x:(event.clientX - rect.left - viewport.x) / viewport.scale,
            y:(event.clientY - rect.top - viewport.y) / viewport.scale
        };
    }

    function canvasWheelZoomFactor(event, pageSize){
        const unit = event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? pageSize : 1;
        const isMac = /^Mac/.test(navigator.platform || '');
        const sensitivity = 0.0008;
        const macMultiplier = isMac ? 1.15 : 1;
        return Math.exp(-event.deltaY * unit * sensitivity * macMultiplier);
    }

    function viewportCenter(shell, viewport){
        return {
            x:(shell.clientWidth / 2 - viewport.x) / viewport.scale,
            y:(shell.clientHeight / 2 - viewport.y) / viewport.scale
        };
    }

    window.GodsWorkbenchSmartCanvasRender = {
        safeScale,
        applyViewport,
        screenToWorld,
        canvasWheelZoomFactor,
        viewportCenter
    };
})();
