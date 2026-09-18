import canvasHttp from './http.js';

function jsonInit(payload, init = {}) {
    const sourceHeaders = init.headers;
    const useNativeHeaders = sourceHeaders instanceof Headers || Array.isArray(sourceHeaders);
    const headers = useNativeHeaders ? new Headers(sourceHeaders) : {...(sourceHeaders || {})};
    if (useNativeHeaders) {
        if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    } else if (!Object.keys(headers).some(name => name.toLowerCase() === 'content-type')) {
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
 * API boundary for the legacy canvas page. Preserve its mixed historical URL
 * semantics: CRUD, recovery and metadata reads interpolate ids directly,
 * while metadata mutations, touch and log deletion encode the id path
 * segment. Status and response parsing stay with the page.
 */
export function createClassicCanvasApi(http) {
    const transport = resolveHttp(http);
    const request = (url, init) => transport.request(url, init);
    const canvasUrl = id => `/api/canvases/${id}`;
    const encodedCanvasUrl = id => `/api/canvases/${encodeURIComponent(id)}`;

    return {
        listCanvases(init) {
            return request('/api/canvases', init);
        },
        listTrashedCanvases(init) {
            return request('/api/canvases/trash', init);
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
        touchCanvas(id, init) {
            return request(`${encodedCanvasUrl(id)}/touch`, {...init, method: 'POST'});
        },
        restoreCanvas(id, init) {
            return request(`${canvasUrl(id)}/restore`, {...init, method: 'POST'});
        },
        purgeCanvas(id, init) {
            return request(`${canvasUrl(id)}/purge`, {...init, method: 'DELETE'});
        },
        patchCanvasMeta(id, payload, init) {
            return request(`${encodedCanvasUrl(id)}/meta`, jsonInit(payload, {...init, method: 'POST'}));
        },
        getCanvasMeta(id, init) {
            return request(`${canvasUrl(id)}/meta`, init);
        },
        getAssetLibrary(init) {
            return request('/api/asset-library', init);
        },
        createAssetLibrary(payload, init) {
            return request('/api/asset-library/libraries', jsonInit(payload, {...init, method: 'POST'}));
        },
        renameAssetLibrary(id, payload, init) {
            return request(`/api/asset-library/libraries/${encodeURIComponent(id)}`, jsonInit(payload, {...init, method: 'PATCH'}));
        },
        deleteAssetLibrary(id, init) {
            return request(`/api/asset-library/libraries/${encodeURIComponent(id)}`, {...init, method: 'DELETE'});
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
        createAssetLibraryItemsBatch(payload, init) {
            return request('/api/asset-library/items/batch', jsonInit(payload, {...init, method: 'POST'}));
        },
        deleteAssetLibraryItems(payload, init) {
            return request('/api/asset-library/items/delete', jsonInit(payload, {...init, method: 'POST'}));
        },
        createAssetLibraryCategory(payload, init) {
            return request('/api/asset-library/categories', jsonInit(payload, {...init, method: 'POST'}));
        },
        renameAssetLibraryCategory(id, payload, init) {
            return request(`/api/asset-library/categories/${encodeURIComponent(id)}`, jsonInit(payload, {...init, method: 'PATCH'}));
        },
        deleteAssetLibraryCategory(id, init) {
            return request(`/api/asset-library/categories/${encodeURIComponent(id)}`, {...init, method: 'DELETE'});
        },
        getLocalAssets(init) {
            return request('/api/local-assets', init);
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
        generateOnlineImage(payload, init) {
            return request('/api/online-image', jsonInit(payload, {...init, method: 'POST'}));
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
        getWorkflow(name, init) {
            return request(workflowUrl(name), init);
        },
        getRunningHubWorkflow(id, init) {
            return request(`/api/runninghub/workflows/${encodeURIComponent(id)}`, init);
        },
        getRunningHubAppInfo(webappId, init) {
            return request(`/api/runninghub/app-info?webappId=${encodeURIComponent(webappId)}`, init);
        },
        getRunningHubWorkflowInfo(workflowId, init) {
            return request(`/api/runninghub/workflow-info?workflowId=${encodeURIComponent(workflowId)}`, init);
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
        submitMidjourney(payload, init) {
            return request('/api/midjourney/submit', jsonInit(payload, {...init, method: 'POST'}));
        },
        getMidjourneyTask(taskId, providerId, init) {
            return request(`/api/midjourney/tasks/${encodeURIComponent(taskId)}?provider_id=${encodeURIComponent(providerId)}`, init);
        },
        submitMidjourneyAction(payload, init) {
            return request('/api/midjourney/actions', jsonInit(payload, {...init, method: 'POST'}));
        },
        submitMidjourneyModal(payload, init) {
            return request('/api/midjourney/modal', jsonInit(payload, {...init, method: 'POST'}));
        },
        getPromptLibraries(init) {
            return request('/api/prompt-libraries', init);
        },
        createPromptLibrary(payload, init) {
            return request('/api/prompt-libraries', jsonInit(payload, {...init, method: 'POST'}));
        },
        renamePromptLibrary(id, payload, init) {
            return request(`/api/prompt-libraries/${encodeURIComponent(id)}`, jsonInit(payload, {...init, method: 'PATCH'}));
        },
        deletePromptLibrary(id, init) {
            return request(`/api/prompt-libraries/${encodeURIComponent(id)}`, {...init, method: 'DELETE'});
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
        deletePromptLibraryItems(payload, init) {
            return request('/api/prompt-libraries/items/delete', jsonInit(payload, {...init, method: 'POST'}));
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
        exportCanvasWorkflow(payload, init) {
            return request('/api/canvas-workflows/export', jsonInit(payload, {...init, method: 'POST'}));
        },
        importCanvasWorkflow(formData, init) {
            return request('/api/canvas-workflows/import', {...init, method: 'POST', body: formData});
        },
        exportCanvasWorkflowToLibrary(payload, init) {
            return request('/api/canvas-workflows/export-to-library', jsonInit(payload, {...init, method: 'POST'}));
        },
        uploadAssetLibraryWorkflows(formData, init) {
            return request('/api/asset-library/workflows/upload', {...init, method: 'POST', body: formData});
        },
        downloadCanvasAssets(payload, init) {
            return request('/api/canvas-assets/download', jsonInit(payload, {...init, method: 'POST'}));
        },
        exportMiniMaxTimeline(payload, init) {
            return request('/api/smart-canvas/minimax-export', jsonInit(payload, {...init, method: 'POST'}));
        },
        checkCanvasAssets(payload, init) {
            return request('/api/canvas-assets/check', jsonInit(payload, {...init, method: 'POST'}));
        },
        uploadCloudVideo(payload, init) {
            return request('/api/cloud-video/upload', jsonInit(payload, {...init, method: 'POST'}));
        },
        getMedia(url, init) {
            return request(url, init);
        },
        uploadComfyInput(formData, init) {
            return request('/api/upload', {...init, method: 'POST', body: formData});
        },
        uploadAiReferences(formData, init) {
            return request('/api/ai/upload', {...init, method: 'POST', body: formData});
        },
        importLocalImagePaths(payload, init) {
            return request('/api/ai/import-local-image', jsonInit(payload, {...init, method: 'POST'}));
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
        getCanvasImageTaskForResume(taskId, init) {
            return request(`/api/canvas-image-tasks/${encodeURIComponent(taskId)}?resume=1`, init);
        },
        getCanvasComfyTaskForResume(taskId, init) {
            return request(`/api/canvas-comfy-tasks/${encodeURIComponent(taskId)}?resume=1`, init);
        },
        getVideoTaskForResume(taskId, init) {
            return request(`/api/video-tasks/${encodeURIComponent(taskId)}?resume=1`, init);
        },
        queryImageTask(payload, init) {
            return request('/api/image-task-query', jsonInit(payload, {...init, method: 'POST'}));
        },
        deleteCanvasLog(id, payload, init) {
            return request(`${encodedCanvasUrl(id)}/logs/delete`, jsonInit(payload, {...init, method: 'POST'}));
        },
    };
}

const classicCanvasApi = Object.freeze(createClassicCanvasApi());
globalThis.GodsWorkbenchClassicCanvasApi = classicCanvasApi;

export default classicCanvasApi;
