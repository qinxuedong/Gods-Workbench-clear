import assetShareHttp from './http.js';

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
    const candidate = http || assetShareHttp;
    if (!candidate || typeof candidate.request !== 'function') {
        throw new TypeError('An asset-share HTTP transport with request(url, init) is required');
    }
    return candidate;
}

/**
 * Stateless boundary for public share access. It deliberately preserves the
 * caller's credential mode because public ticket access is not authenticated.
 */
export function createAssetShareApi(http) {
    const transport = resolveHttp(http);
    const request = (url, init) => transport.request(url, init);
    const shareUrl = token => `/api/public/shares/${encodeURIComponent(token)}`;

    return {
        getPublicShare(token, init) {
            return request(shareUrl(token), init);
        },
        accessPublicShare(token, payload, init = {}) {
            return request(`${shareUrl(token)}/access`, jsonInit(payload, {...init, method: 'POST'}));
        },
        createPublicShareComment(token, payload, init = {}) {
            return request(`${shareUrl(token)}/comments`, jsonInit(payload, {...init, method: 'POST'}));
        },
        updatePublicShareApproval(token, payload, init = {}) {
            return request(`${shareUrl(token)}/approvals`, jsonInit(payload, {...init, method: 'PUT'}));
        },
    };
}

const assetShareApi = Object.freeze(createAssetShareApi());

export default assetShareApi;
