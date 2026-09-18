import { createFetchTransport } from '../http-transport.js';

/**
 * Stateless HTTP transport for the asset manager page.
 *
 * The facade deliberately returns the native fetch result unchanged so each
 * asset-manager flow keeps its existing JSON parsing and error projection.
 */
export function createAssetManagerHttp(fetchImpl = globalThis.fetch) {
    return createFetchTransport(fetchImpl);
}

const assetManagerHttp = Object.freeze(createAssetManagerHttp());

export default assetManagerHttp;
