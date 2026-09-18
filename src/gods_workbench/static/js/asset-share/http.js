import { createFetchTransport } from '../http-transport.js';

/** Stateless HTTP transport for the public asset-share page. */
export function createAssetShareHttp(fetchImpl = globalThis.fetch) {
    return createFetchTransport(fetchImpl);
}

const assetShareHttp = Object.freeze(createAssetShareHttp());

export default assetShareHttp;
