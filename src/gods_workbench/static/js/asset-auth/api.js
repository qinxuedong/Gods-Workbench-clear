import assetAuthHttp from './http.js';

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
    const candidate = http || assetAuthHttp;
    if (!candidate || typeof candidate.request !== 'function') {
        throw new TypeError('An asset-auth HTTP transport with request(url, init) is required');
    }
    return candidate;
}

function sameOriginInit(init = {}) {
    return {...init, credentials: 'same-origin'};
}

/**
 * Stateless boundary for authenticated account, team and operation approval
 * calls. The page owns response parsing, 401 projection and UI state.
 */
export function createAssetAuthApi(http) {
    const transport = resolveHttp(http);
    const request = (url, init) => transport.request(url, init);
    const userUrl = userId => `/api/asset-auth/users/${encodeURIComponent(userId)}`;
    const teamUrl = teamId => `/api/asset-auth/teams/${encodeURIComponent(teamId)}`;

    return {
        getStatus(init = {}) {
            return request('/api/asset-auth/status', sameOriginInit(init));
        },
        bootstrap(payload, init = {}) {
            return request('/api/asset-auth/bootstrap', jsonInit(payload, sameOriginInit({...init, method: 'POST'})));
        },
        login(payload, init = {}) {
            return request('/api/asset-auth/login', jsonInit(payload, sameOriginInit({...init, method: 'POST'})));
        },
        listUsers(init = {}) {
            return request('/api/asset-auth/users', sameOriginInit(init));
        },
        createUser(payload, init = {}) {
            return request('/api/asset-auth/users', jsonInit(payload, sameOriginInit({...init, method: 'POST'})));
        },
        updateUser(userId, payload, init = {}) {
            return request(userUrl(userId), jsonInit(payload, sameOriginInit({...init, method: 'PATCH'})));
        },
        deleteUser(userId, init = {}) {
            return request(userUrl(userId), sameOriginInit({...init, method: 'DELETE'}));
        },
        listTeams(init = {}) {
            return request('/api/asset-auth/teams', sameOriginInit(init));
        },
        createTeam(payload, init = {}) {
            return request('/api/asset-auth/teams', jsonInit(payload, sameOriginInit({...init, method: 'POST'})));
        },
        deleteTeam(teamId, payload, init = {}) {
            return request(
                teamUrl(teamId),
                jsonInit(payload, sameOriginInit({...init, method: 'DELETE'})),
            );
        },
        updateTeamMember(teamId, payload, init = {}) {
            return request(
                `${teamUrl(teamId)}/members`,
                jsonInit(payload, sameOriginInit({...init, method: 'PUT'})),
            );
        },
        deleteTeamMember(teamId, userId, init = {}) {
            return request(
                `${teamUrl(teamId)}/members/${encodeURIComponent(userId)}`,
                sameOriginInit({...init, method: 'DELETE'}),
            );
        },
        listOperationApprovals(query = '', init = {}) {
            const suffix = String(query || '').replace(/^\?/, '');
            return request(
                `/api/asset-auth/operation-approvals${suffix ? `?${suffix}` : ''}`,
                sameOriginInit(init),
            );
        },
        updateOperationApproval(approvalId, payload, init = {}) {
            return request(
                `/api/asset-auth/operation-approvals/${encodeURIComponent(approvalId)}`,
                jsonInit(payload, sameOriginInit({...init, method: 'PUT'})),
            );
        },
        createToken(payload, init = {}) {
            return request('/api/asset-auth/tokens', jsonInit(payload, sameOriginInit({...init, method: 'POST'})));
        },
        logout(init = {}) {
            return request('/api/asset-auth/logout', sameOriginInit({...init, method: 'POST'}));
        },
    };
}

const assetAuthApi = Object.freeze(createAssetAuthApi());
globalThis.GodsWorkbenchAssetAuthApi = assetAuthApi;

export default assetAuthApi;
