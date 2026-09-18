const CANVAS_SESSION_VIEWPORTS_KEY = 'canvas_session_viewports_v1';
let canvasSessionViewportFallback = {};

// The legacy renderer keeps its behavior and compatibility entry points, but
// the mutable page state lives here so F2 can split state/render/interaction
// without creating a cross-canvas store.
const canvasSelectionState = new Set();
const canvasRuntimeState = {
    selection: canvasSelectionState,
    viewport: {x:-1800, y:-1000, scale:1},
    zoomPreviewState: null,
    taskRecovery: {activeCanvasTaskPolls: new Set()}
};
window.GodsWorkbenchClassicCanvasState = window.GodsWorkbenchClassicCanvasState || {};
window.GodsWorkbenchClassicCanvasState.selection = canvasSelectionState;
window.GodsWorkbenchClassicCanvasState.viewport = canvasRuntimeState.viewport;
window.GodsWorkbenchClassicCanvasState.taskRecovery = canvasRuntimeState.taskRecovery;

function exposeCanvasStateAlias(name, key, container=canvasRuntimeState){
    const existing = Object.getOwnPropertyDescriptor(window, name);
    if(existing && !existing.configurable) return;
    Object.defineProperty(window, name, {
        configurable:true,
        get:() => container[key],
        set:value => { container[key] = value; }
    });
}

exposeCanvasStateAlias('viewport', 'viewport');
exposeCanvasStateAlias('zoomPreviewState', 'zoomPreviewState');
exposeCanvasStateAlias('activeCanvasTaskPolls', 'activeCanvasTaskPolls', canvasRuntimeState.taskRecovery);

function loadLocalViewportMap(){
    try {
        const data = JSON.parse(sessionStorage.getItem(CANVAS_SESSION_VIEWPORTS_KEY) || '{}');
        return data && typeof data === 'object' ? data : {};
    } catch(e) {
        return canvasSessionViewportFallback;
    }
}

function localViewportForCanvas(canvasId, fallback={x:0, y:0, scale:1}){
    const item = loadLocalViewportMap()[canvasId || ''];
    if(!item || typeof item !== 'object') return {...fallback};
    return {
        x:Number.isFinite(Number(item.x)) ? Number(item.x) : Number(fallback.x || 0),
        y:Number.isFinite(Number(item.y)) ? Number(item.y) : Number(fallback.y || 0),
        scale:Number.isFinite(Number(item.scale)) ? Math.max(.12, Math.min(8, Number(item.scale))) : Number(fallback.scale || 1)
    };
}

function saveLocalViewport(canvasId, viewport){
    if(!canvasId) return;
    const map = loadLocalViewportMap();
    map[canvasId] = {
        x:Number(viewport?.x || 0),
        y:Number(viewport?.y || 0),
        scale:Number(viewport?.scale || 1),
        updatedAt:Date.now()
    };
    canvasSessionViewportFallback = map;
    try {
        sessionStorage.setItem(CANVAS_SESSION_VIEWPORTS_KEY, JSON.stringify(map));
    } catch(e) {}
}
