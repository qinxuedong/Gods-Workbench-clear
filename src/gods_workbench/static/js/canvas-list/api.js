import canvasListHttp from './http.js';

function jsonInit(payload, init = {}) {
    const sourceHeaders = init.headers;
    const useNativeHeaders = typeof Headers !== 'undefined'
        && (sourceHeaders instanceof Headers || Array.isArray(sourceHeaders));
    const headers = useNativeHeaders ? new Headers(sourceHeaders) : {...(sourceHeaders || {})};
    if (useNativeHeaders) {
        if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    } else if (!Object.keys(headers).some(name => name.toLowerCase() === 'content-type')) {
        headers['Content-Type'] = 'application/json';
    }
    return {...init, headers, body: JSON.stringify(payload)};
}

function resolveHttp(http) {
    const candidate = http || canvasListHttp;
    if (!candidate || typeof candidate.request !== 'function') {
        throw new TypeError('A canvas-list HTTP transport with request(url, init) is required');
    }
    return candidate;
}

/**
 * API boundary for the legacy project canvas-list page. Response parsing and
 * board state stay in the page so existing load ordering and rollback logic
 * remain unchanged.
 */
export function createCanvasListApi(http) {
    const transport = resolveHttp(http);
    const request = (url, init) => transport.request(url, init);
    const projectUrl = id => `/api/asset-registry/projects/${encodeURIComponent(id)}`;
    const canvasUrl = id => `/api/canvases/${encodeURIComponent(id)}`;

    return {
        listProjects(init) {
            return request('/api/asset-registry/projects?archived=false', init);
        },
        listCanvases(init) {
            return request('/api/canvases', init);
        },
        createProject(payload, init = {}) {
            return request('/api/asset-registry/projects', jsonInit(payload, {...init, method: 'POST'}));
        },
        updateProject(id, payload, init = {}) {
            return request(projectUrl(id), jsonInit(payload, {...init, method: 'PATCH'}));
        },
        deleteProject(id, payload, init = {}) {
            return request(projectUrl(id), jsonInit(payload, {...init, method: 'DELETE'}));
        },
        getCanvas(id, init) {
            return request(canvasUrl(id), init);
        },
        createCanvas(payload, init = {}) {
            return request('/api/canvases', jsonInit(payload, {...init, method: 'POST'}));
        },
        updateCanvasMeta(id, payload, init = {}) {
            return request(`${canvasUrl(id)}/meta`, jsonInit(payload, {...init, method: 'POST'}));
        },
        deleteCanvas(id, init = {}) {
            return request(canvasUrl(id), {...init, method: 'DELETE'});
        },
        listTrashedCanvases(init) {
            return request('/api/canvases/trash', init);
        },
        listArchivedCanvases(init = {}) {
            const url = '/api/canvases/trash?view=archived';
            return request(url, init);
        },
        archiveCanvas(id, init = {}) {
            return request(`${canvasUrl(id)}/touch?operation=archive`, {...init, method: 'POST'});
        },
        unarchiveCanvas(id, init = {}) {
            return request(`${canvasUrl(id)}/touch?operation=unarchive`, {...init, method: 'POST'});
        },
        restoreCanvas(id, init = {}) {
            return request(`${canvasUrl(id)}/restore`, {...init, method: 'POST'});
        },
        purgeCanvas(id, init = {}) {
            return request(`${canvasUrl(id)}/purge`, {...init, method: 'DELETE'});
        },
        getResource(url, init) {
            return request(url, init);
        },
    };
}

const canvasListApi = Object.freeze(createCanvasListApi());
globalThis.GodsWorkbenchCanvasListApi = canvasListApi;

export default canvasListApi;
