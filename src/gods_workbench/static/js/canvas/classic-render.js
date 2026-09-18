(function(){
    function safeViewportScale(value){
        const n = Number(value);
        return Number.isFinite(n) && n > 0 ? n : 1;
    }

    function screenToWorld(board, viewport, clientX, clientY){
        const rect = board.getBoundingClientRect();
        return {
            x:(clientX - rect.left - viewport.x) / viewport.scale,
            y:(clientY - rect.top - viewport.y) / viewport.scale
        };
    }

    function canvasWheelZoomFactor(event, pageSize){
        const unit = event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? pageSize : 1;
        const isMac = /^Mac/.test(navigator.platform || '');
        const sensitivity = 0.0008;
        const macMultiplier = isMac ? 1.15 : 1;
        return Math.exp(-event.deltaY * unit * sensitivity * macMultiplier);
    }

    function applyViewport(world, viewport, scheduleMinimapRender){
        world.style.transform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`;
        scheduleMinimapRender?.();
    }

    window.GodsWorkbenchClassicCanvasRender = {
        safeViewportScale,
        screenToWorld,
        canvasWheelZoomFactor,
        applyViewport
    };
})();
