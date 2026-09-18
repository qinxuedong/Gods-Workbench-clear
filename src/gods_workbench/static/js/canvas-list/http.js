import { createLazyFetchTransport } from '../http-transport.js';

/**
 * Stateless HTTP transport for the legacy project canvas-list page.
 *
 * The default transport resolves globalThis.fetch at request time so browser
 * instrumentation installed after module evaluation remains observable.
 */
export function createCanvasListHttp(fetchImpl) {
    return createLazyFetchTransport(fetchImpl);
}

const canvasListHttp = Object.freeze(createCanvasListHttp());
globalThis.GodsWorkbenchCanvasListHttp = canvasListHttp;

export default canvasListHttp;
