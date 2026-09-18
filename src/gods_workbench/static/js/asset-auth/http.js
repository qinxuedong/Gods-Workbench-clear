import { createFetchTransport } from '../http-transport.js';

/**
 * Stateless HTTP transport for account, team and approval operations.
 *
 * The API facade deliberately returns native fetch responses untouched so the
 * page remains responsible for JSON parsing and authentication UI state.
 */
export function createAssetAuthHttp(fetchImpl = globalThis.fetch) {
    return createFetchTransport(fetchImpl);
}

const assetAuthHttp = Object.freeze(createAssetAuthHttp());

export default assetAuthHttp;
