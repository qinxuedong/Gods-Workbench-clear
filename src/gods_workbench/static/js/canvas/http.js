import { createFetchTransport } from '../http-transport.js';

/**
 * Stateless canvas HTTP transport.
 *
 * It deliberately returns the native fetch result unchanged: callers retain
 * their existing JSON/text/blob parsing and HTTP-status handling.
 */
export function createCanvasHttp(fetchImpl = globalThis.fetch) {
    return createFetchTransport(fetchImpl);
}

const canvasHttp = Object.freeze(createCanvasHttp());
globalThis.GodsWorkbenchCanvasHttp = canvasHttp;

export default canvasHttp;
