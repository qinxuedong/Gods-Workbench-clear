import { createFetchTransport } from '../http-transport.js';

/**
 * Stateless HTTP transport for the authenticated asset-review page.
 * Response parsing and authentication UI projection stay in the page.
 */
export function createAssetReviewHttp(fetchImpl = globalThis.fetch) {
    return createFetchTransport(fetchImpl);
}

const assetReviewHttp = Object.freeze(createAssetReviewHttp());

export default assetReviewHttp;
