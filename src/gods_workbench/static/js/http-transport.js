/**
 * Shared stateless fetch transports used by domain-specific API facades.
 *
 * The transports intentionally return native fetch responses untouched. JSON,
 * text and blob parsing belongs to each page/API boundary; response error
 * projection is shared because it has no domain state.
 */
export function createFetchTransport(fetchImpl = globalThis.fetch) {
    if (typeof fetchImpl !== 'function') {
        throw new TypeError('A fetch implementation is required');
    }

    return {
        request(url, init) {
            return fetchImpl(url, init);
        },
    };
}

/**
 * Legacy canvas-list keeps global fetch instrumentation observable when it is
 * installed after module evaluation, so its default transport resolves lazily.
 */
export function createLazyFetchTransport(fetchImpl) {
    if (fetchImpl !== undefined && typeof fetchImpl !== 'function') {
        throw new TypeError('A fetch implementation is required');
    }

    return {
        request(url, init) {
            const activeFetch = fetchImpl || globalThis.fetch;
            if (typeof activeFetch !== 'function') {
                throw new TypeError('A fetch implementation is required');
            }
            return activeFetch.call(globalThis, url, init);
        },
    };
}

/**
 * Convert the response shapes emitted by FastAPI and upstream providers into
 * a user-facing message without consuming the response body more than once.
 */
export function apiErrorMessage(data, fallback = '请求失败') {
    if (!data) return fallback;
    if (typeof data === 'string') return data || fallback;
    const detail = data.detail ?? data.error ?? data.message;
    if (typeof detail === 'string') return detail || fallback;
    if (Array.isArray(detail)) {
        const messages = detail.map(item => {
            if (typeof item === 'string') return item;
            const loc = Array.isArray(item?.loc) ? item.loc.filter(x => x !== 'body').join('.') : '';
            const msg = item?.msg || item?.message || JSON.stringify(item);
            return loc ? `${loc}: ${msg}` : msg;
        }).filter(Boolean);
        return messages.join('\n') || fallback;
    }
    if (detail && typeof detail === 'object') {
        return detail.message || detail.msg || JSON.stringify(detail);
    }
    try {
        return JSON.stringify(data);
    } catch (_) {
        return fallback;
    }
}

export async function responseErrorMessage(response, fallback = '请求失败') {
    try {
        const data = await response.clone().json();
        return apiErrorMessage(data, fallback);
    } catch (_) {
        try {
            const text = await response.text();
            return text || fallback;
        } catch (_) {
            return fallback;
        }
    }
}

// Legacy script entries cannot import an ES module, so expose only this
// stateless helper bundle while keeping their existing local function names.
globalThis.GodsWorkbenchHttpErrors = Object.freeze({apiErrorMessage, responseErrorMessage});
