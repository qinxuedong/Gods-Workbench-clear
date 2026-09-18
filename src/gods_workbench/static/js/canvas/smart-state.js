// Smart canvas state stays isolated from the classic canvas state.  Aliases
// below preserve the legacy script's global bindings while the containers are
// owned by this module for incremental F2 extraction.
const smartCanvasRuntimeState = {
    selection: {
        selectedId: '',
        selectedIds: [],
        selectedImage: {nodeId:'', index:-1}
    },
    viewport: {x:0, y:0, scale:1},
    zoomPreviewState: null,
    taskRecovery: {
        runTimerInterval: null,
        smartRunStateToken: 0,
        smartCascadeRuns: new Map(),
        activeSmartTaskPolls: new Map(),
        smartNodeRunTokens: new Map()
    }
};

window.GodsWorkbenchSmartCanvasState = window.GodsWorkbenchSmartCanvasState || {};
window.GodsWorkbenchSmartCanvasState.selection = smartCanvasRuntimeState.selection;
window.GodsWorkbenchSmartCanvasState.viewport = smartCanvasRuntimeState.viewport;
window.GodsWorkbenchSmartCanvasState.taskRecovery = smartCanvasRuntimeState.taskRecovery;

function exposeSmartCanvasStateAlias(name, container, key){
    const existing = Object.getOwnPropertyDescriptor(window, name);
    if(existing && !existing.configurable) return;
    Object.defineProperty(window, name, {
        configurable:true,
        get:() => container[key],
        set:value => { container[key] = value; }
    });
}

exposeSmartCanvasStateAlias('selectedId', smartCanvasRuntimeState.selection, 'selectedId');
exposeSmartCanvasStateAlias('selectedIds', smartCanvasRuntimeState.selection, 'selectedIds');
exposeSmartCanvasStateAlias('selectedImage', smartCanvasRuntimeState.selection, 'selectedImage');
exposeSmartCanvasStateAlias('viewport', smartCanvasRuntimeState, 'viewport');
exposeSmartCanvasStateAlias('zoomPreviewState', smartCanvasRuntimeState, 'zoomPreviewState');
exposeSmartCanvasStateAlias('runTimerInterval', smartCanvasRuntimeState.taskRecovery, 'runTimerInterval');
exposeSmartCanvasStateAlias('smartRunStateToken', smartCanvasRuntimeState.taskRecovery, 'smartRunStateToken');
exposeSmartCanvasStateAlias('smartCascadeRuns', smartCanvasRuntimeState.taskRecovery, 'smartCascadeRuns');
exposeSmartCanvasStateAlias('activeSmartTaskPolls', smartCanvasRuntimeState.taskRecovery, 'activeSmartTaskPolls');
exposeSmartCanvasStateAlias('smartNodeRunTokens', smartCanvasRuntimeState.taskRecovery, 'smartNodeRunTokens');
