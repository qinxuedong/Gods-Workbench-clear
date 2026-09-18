import canvasHttp from './http.js';

function jsonInit(payload, init = {}) {
    const headers = {...(init.headers || {})};
    if (!Object.keys(headers).some(name => name.toLowerCase() === 'content-type')) {
        headers['Content-Type'] = 'application/json';
    }
    return {...init, headers, body: JSON.stringify(payload)};
}

function resolveHttp(http) {
    const candidate = http || canvasHttp;
    if (!candidate || typeof candidate.request !== 'function') {
        throw new TypeError('A canvas HTTP transport with request(url, init) is required');
    }
    return candidate;
}

function workflowUrl(name) {
    const path = String(name || '').split('/').filter(Boolean).map(encodeURIComponent).join('/');
    return `/api/workflows/${path}`;
}

/**
 * API boundary for the smart canvas page. Smart canvas ids have always been
 * URL-encoded, including CAS metadata and log mutations.
 */
export function createSmartCanvasApi(http) {
    const transport = resolveHttp(http);
    const request = (url, init) => transport.request(url, init);
    const canvasUrl = id => `/api/canvases/${encodeURIComponent(id)}`;

    return {
        listCanvases(init) {
            return request('/api/canvases', init);
        },
        getCanvas(id, init) {
            return request(canvasUrl(id), init);
        },
        createCanvas(payload, init) {
            return request('/api/canvases', jsonInit(payload, {...init, method: 'POST'}));
        },
        saveCanvas(id, payload, init) {
            return request(canvasUrl(id), jsonInit(payload, {...init, method: 'PUT'}));
        },
        deleteCanvas(id, init) {
            return request(canvasUrl(id), {...init, method: 'DELETE'});
        },
        patchCanvasMeta(id, payload, init) {
            return request(`${canvasUrl(id)}/meta`, jsonInit(payload, {...init, method: 'POST'}));
        },
        getCanvasMeta(id, init) {
            return request(`${canvasUrl(id)}/meta`, init);
        },
        deleteCanvasLog(id, payload, init) {
            return request(`${canvasUrl(id)}/logs/delete`, jsonInit(payload, {...init, method: 'POST'}));
        },
        getAssetLibrary(init) {
            return request('/api/asset-library', init);
        },
        createAssetLibraryItem(payload, init) {
            return request('/api/asset-library/items', jsonInit(payload, {...init, method: 'POST'}));
        },
        renameAssetLibraryItem(id, payload, init) {
            return request(`/api/asset-library/items/${encodeURIComponent(id)}`, jsonInit(payload, {...init, method: 'PATCH'}));
        },
        deleteAssetLibraryItem(id, init) {
            return request(`/api/asset-library/items/${encodeURIComponent(id)}`, {...init, method: 'DELETE'});
        },
        createAssetLibraryCategory(payload, init) {
            return request('/api/asset-library/categories', jsonInit(payload, {...init, method: 'POST'}));
        },
        renameAssetLibraryCategory(id, payload, init) {
            return request(`/api/asset-library/categories/${encodeURIComponent(id)}`, jsonInit(payload, {...init, method: 'PATCH'}));
        },
        getLocalAssets(init) {
            return request('/api/local-assets', init);
        },
        getRemoteUrlAssets(init) {
            return request('/api/asset-registry/assets?root_id=remote_url&limit=500', init);
        },
        getWorkflow(name, init) {
            return request(workflowUrl(name), init);
        },
        getRunningHubWorkflow(id, init) {
            return request(`/api/runninghub/workflows/${encodeURIComponent(id)}`, init);
        },
        getRunningHubWorkflowInfo(workflowId, init) {
            return request(`/api/runninghub/workflow-info?workflowId=${encodeURIComponent(workflowId)}`, init);
        },
        getConfig(init) {
            return request('/api/config', init);
        },
        getWorkflows(init) {
            return request('/api/workflows', init);
        },
        createCanvasLlm(payload, init) {
            return request('/api/canvas-llm', jsonInit(payload, {...init, method: 'POST'}));
        },
        createRemoteAsset(payload, init) {
            return request('/api/asset-registry/remote-assets', jsonInit(payload, {...init, method: 'POST'}));
        },
        updateRemoteAsset(id, payload, init) {
            return request(`/api/asset-registry/remote-assets/${encodeURIComponent(id)}`, jsonInit(payload, {...init, method: 'PATCH'}));
        },
        deleteRemoteAsset(id, init) {
            return request(`/api/asset-registry/remote-assets/${encodeURIComponent(id)}`, {...init, method: 'DELETE'});
        },
        getPromptLibraries(init) {
            return request('/api/prompt-libraries', init);
        },
        createPromptLibraryItem(payload, init) {
            return request('/api/prompt-libraries/items', jsonInit(payload, {...init, method: 'POST'}));
        },
        updatePromptLibraryItem(id, payload, init) {
            return request(`/api/prompt-libraries/items/${encodeURIComponent(id)}`, jsonInit(payload, {...init, method: 'PATCH'}));
        },
        deletePromptLibraryItem(id, init) {
            return request(`/api/prompt-libraries/items/${encodeURIComponent(id)}`, {...init, method: 'DELETE'});
        },
        createPromptLibraryCategory(payload, init) {
            return request('/api/prompt-libraries/categories', jsonInit(payload, {...init, method: 'POST'}));
        },
        renamePromptLibraryCategory(id, payload, init) {
            return request(`/api/prompt-libraries/categories/${encodeURIComponent(id)}`, jsonInit(payload, {...init, method: 'PATCH'}));
        },
        deletePromptLibraryCategory(id, init) {
            return request(`/api/prompt-libraries/categories/${encodeURIComponent(id)}`, {...init, method: 'DELETE'});
        },
        getLegacyPromptTemplates(init) {
            return request('/api/smart-canvas/prompt-templates', init);
        },
        exportCanvasWorkflow(payload, init) {
            return request('/api/canvas-workflows/export', jsonInit(payload, {...init, method: 'POST'}));
        },
        importCanvasWorkflow(formData, init) {
            return request('/api/canvas-workflows/import', {...init, method: 'POST', body: formData});
        },
        downloadCanvasAssets(payload, init) {
            return request('/api/canvas-assets/download', jsonInit(payload, {...init, method: 'POST'}));
        },
        uploadCloudVideo(payload, init) {
            return request('/api/cloud-video/upload', jsonInit(payload, {...init, method: 'POST'}));
        },
        uploadRunningHubAsset(payload, init) {
            return request('/api/runninghub/upload-asset', jsonInit(payload, {...init, method: 'POST'}));
        },
        submitRunningHubApp(payload, init) {
            return request('/api/runninghub/submit', jsonInit(payload, {...init, method: 'POST'}));
        },
        submitRunningHubWorkflow(payload, init) {
            return request('/api/runninghub/workflow-submit', jsonInit(payload, {...init, method: 'POST'}));
        },
        getRunningHubTask(taskId, useWallet, {jobId = '', ...init} = {}) {
            const jobQuery = jobId ? `&job_id=${encodeURIComponent(jobId)}` : '';
            return request(`/api/runninghub/query?taskId=${encodeURIComponent(taskId)}&useWallet=${useWallet ? '1' : '0'}${jobQuery}`, init);
        },
        queryJimengMedia(payload, init) {
            return request('/api/jimeng/query-media', jsonInit(payload, {...init, method: 'POST'}));
        },
        generateModelscopeZImage(payload, init) {
            return request('/generate', jsonInit(payload, {...init, method: 'POST'}));
        },
        generateModelscopeQwenEdit(payload, init) {
            return request('/api/angle/generate', jsonInit(payload, {...init, method: 'POST'}));
        },
        generateModelscopeImage(payload, init) {
            return request('/api/ms/generate', jsonInit(payload, {...init, method: 'POST'}));
        },
        uploadComfyInput(formData, init) {
            return request('/api/upload', {...init, method: 'POST', body: formData});
        },
        uploadAiReferences(formData, init) {
            return request('/api/ai/upload', {...init, method: 'POST', body: formData});
        },
        uploadLocalAssets(formData, init) {
            return request('/api/local-assets/upload', {...init, method: 'POST', body: formData});
        },
        createLocalAssetFolder(payload, init) {
            return request('/api/local-assets/folders', jsonInit(payload, {...init, method: 'POST'}));
        },
        renameLocalAssetFolder(payload, init) {
            return request('/api/local-assets/folders', jsonInit(payload, {...init, method: 'PATCH'}));
        },
        renameLocalAsset(payload, init) {
            return request('/api/local-assets/items', jsonInit(payload, {...init, method: 'PATCH'}));
        },
        deleteLocalAssets(payload, init) {
            return request('/api/local-assets/delete', jsonInit(payload, {...init, method: 'POST'}));
        },
        importLocalImagePaths(payload, init) {
            return request('/api/ai/import-local-image', jsonInit(payload, {...init, method: 'POST'}));
        },
        importLocalAssetUrls(payload, init) {
            return request('/api/local-assets/import-urls', jsonInit(payload, {...init, method: 'POST'}));
        },
        getMedia(url, init = {}) {
            return request(url, init);
        },
        createCanvasImageTask(payload, init) {
            return request('/api/canvas-image-tasks', jsonInit(payload, {...init, method: 'POST'}));
        },
        createCanvasComfyTask(payload, init) {
            return request('/api/canvas-comfy-tasks', jsonInit(payload, {...init, method: 'POST'}));
        },
        createVideoTask(payload, init) {
            return request('/api/video-tasks', jsonInit(payload, {...init, method: 'POST'}));
        },
        queryImageTask(payload, init) {
            return request('/api/image-task-query', jsonInit(payload, {...init, method: 'POST'}));
        },
        getCanvasImageTask(taskId, init) {
            return request(`/api/canvas-image-tasks/${encodeURIComponent(taskId)}`, init);
        },
        getCanvasComfyTaskForResume(taskId, init) {
            return request(`/api/canvas-comfy-tasks/${encodeURIComponent(taskId)}?resume=1`, init);
        },
        getVideoTaskForResume(taskId, init) {
            return request(`/api/video-tasks/${encodeURIComponent(taskId)}?resume=1`, init);
        },
    };
}

const smartCanvasApi = Object.freeze(createSmartCanvasApi());
globalThis.GodsWorkbenchSmartCanvasApi = smartCanvasApi;

export default smartCanvasApi;
