(function(){
    function escapeAttr(value){
        return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
            '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
        }[character]));
    }

    function canvasOriginalMediaUrl(url){
        const raw = String(url || '');
        if(!raw) return '';
        try {
            const parsed = new URL(raw, window.location.origin);
            if(parsed.pathname === '/api/media-preview'){
                const original = parsed.searchParams.get('url') || '';
                return original || raw;
            }
        } catch(e) {}
        return raw;
    }

    function canvasFileNameFromUrl(url=''){
        try {
            const parsed = new URL(String(url || ''), window.location.href);
            return decodeURIComponent(parsed.pathname.split('/').filter(Boolean).pop() || '');
        } catch(e) {
            return decodeURIComponent(String(url || '').split('?')[0].split('#')[0].split('/').filter(Boolean).pop() || '');
        }
    }

    function canvasProxiedMediaUrl(url, name=''){
        const raw = canvasOriginalMediaUrl(url);
        if(!raw || raw.startsWith('/assets/') || raw.startsWith('/output/') || raw.startsWith('data:') || raw.startsWith('blob:')) return raw;
        if(!/^https?:\/\//i.test(raw)) return raw;
        const filename = name || canvasFileNameFromUrl(raw) || 'preview';
        return `/api/download-output?inline=1&url=${encodeURIComponent(raw)}&name=${encodeURIComponent(filename)}`;
    }

    function canvasDisplayMediaUrl(url, name=''){
        const raw = canvasOriginalMediaUrl(url);
        return /^https?:\/\//i.test(raw) ? canvasProxiedMediaUrl(raw, name) : raw;
    }

    function canvasMediaPreviewUrl(url, size=512){
        const raw = canvasOriginalMediaUrl(url);
        if(!raw || raw.startsWith('data:') || raw.startsWith('blob:')) return raw;
        if(!raw.startsWith('/output/') && !raw.startsWith('/assets/')) return canvasDisplayMediaUrl(raw);
        if(!/\.(png|jpe?g|webp|gif|bmp|avif|tiff?|mp4|webm|mov|m4v|avi|mkv|flv)(\?|#|$)/i.test(raw)) return raw;
        const width = Math.max(64, Math.min(2048, Math.round(Number(size) || 512)));
        return `/api/media-preview?w=${width}&url=${encodeURIComponent(raw)}`;
    }

    function canvasPreviewImgHtml(url, size=512, attrs=''){
        const original = canvasOriginalMediaUrl(url);
        const preview = canvasMediaPreviewUrl(original, size);
        return `<img loading="lazy" decoding="async" src="${escapeAttr(preview)}" data-preview-src="${escapeAttr(preview)}" data-original-src="${escapeAttr(original)}" data-url="${escapeAttr(original)}"${attrs ? ` ${attrs}` : ''}>`;
    }

    function loadCanvasOriginalImageDimensions(url){
        const src = String(url || '');
        if(!src || /^data:/i.test(src) || /^blob:/i.test(src)) return Promise.resolve(null);
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(img.naturalWidth && img.naturalHeight ? {w:img.naturalWidth, h:img.naturalHeight} : null);
            img.onerror = () => resolve(null);
            img.src = src;
        });
    }

    function canvasVideoPreviewHtml(url, size=512, attrs=''){
        const original = canvasOriginalMediaUrl(url);
        const preview = canvasMediaPreviewUrl(original, size);
        return `<img loading="lazy" decoding="async" src="${escapeAttr(preview)}" data-preview-src="${escapeAttr(preview)}" data-original-src="${escapeAttr(original)}" data-url="${escapeAttr(original)}" data-preview-kind="video"${attrs ? ` ${attrs}` : ''}>`;
    }

    function canvasVideoFallbackHtml(url, attrs=''){
        const original = canvasOriginalMediaUrl(url);
        const src = canvasDisplayMediaUrl(original);
        return `<video src="${escapeAttr(src)}" data-url="${escapeAttr(original)}" muted preload="metadata" playsinline disablepictureinpicture controlslist="nodownload noplaybackrate noremoteplayback"${attrs ? ` ${attrs}` : ''}></video>`;
    }

    function canvasVideoPlayerHtml(url, attrs=''){
        const original = canvasOriginalMediaUrl(url);
        const src = canvasDisplayMediaUrl(original);
        return `<video src="${escapeAttr(src)}" data-url="${escapeAttr(original)}" controls autoplay playsinline preload="metadata" disablepictureinpicture controlslist="nodownload noplaybackrate noremoteplayback"${attrs ? ` ${attrs}` : ''}></video>`;
    }

    function canvasActivateVideoPreview(img){
        if(!img) return false;
        const target = img.matches?.('img[data-preview-kind="video"]') ? img : img.querySelector?.('img[data-preview-kind="video"]');
        if(!target) {
            const fallback = img.matches?.('video[data-url]') ? img : img.querySelector?.('video[data-url]');
            if(fallback){
                fallback.controls = true;
                fallback.muted = false;
                fallback.play?.().catch(() => {});
                return true;
            }
            return false;
        }
        const original = canvasOriginalMediaUrl(target.dataset.originalSrc || target.dataset.url || target.getAttribute('src') || '');
        if(!original) return false;
        const tpl = document.createElement('template');
        tpl.innerHTML = canvasVideoPlayerHtml(original, target.dataset.videoPlayerAttrs || '');
        const video = tpl.content.firstElementChild;
        if(!video) return false;
        target.replaceWith(video);
        video.parentElement?.querySelector?.('.canvas-video-play')?.style?.setProperty('display', 'none');
        video.play?.().catch(() => {});
        return true;
    }

    function isCanvasPreviewImage(img){
        return img?.tagName?.toLowerCase?.() === 'img'
            && img.dataset?.previewSrc
            && img.dataset?.originalSrc
            && img.dataset.previewSrc !== img.dataset.originalSrc
            && img.getAttribute('src') !== img.dataset.originalSrc;
    }

    function bindCanvasPreviewImageFallbacks(root=document){
        root.querySelectorAll?.('img[data-preview-src][data-original-src]:not([data-preview-fallback-bound])').forEach(img => {
            img.dataset.previewFallbackBound = '1';
            img.addEventListener('error', () => {
                const original = img.dataset.originalSrc || img.dataset.url || '';
                if(img.dataset.previewKind === 'video'){
                    const video = document.createElement('template');
                    video.innerHTML = canvasVideoFallbackHtml(original, img.dataset.videoFallbackAttrs || '');
                    img.replaceWith(video.content.firstElementChild);
                    return;
                }
                if(original && img.getAttribute('src') !== original) img.src = original;
            });
        });
    }

    function triggerDownload(href, filename, revokeDelay=0){
        if(!href) return false;
        const link = document.createElement('a');
        link.href = href;
        link.download = filename || 'canvas-workflow.json';
        document.body.appendChild(link);
        link.click();
        link.remove();
        if(revokeDelay > 0 && /^blob:/i.test(href)){
            setTimeout(() => URL.revokeObjectURL(href), revokeDelay);
        }
        return true;
    }

    function downloadBlob(blob, filename, options={}){
        if(!blob) return false;
        const href = URL.createObjectURL(blob);
        return triggerDownload(href, filename, Number(options.revokeDelay) || 800);
    }

    window.GodsWorkbenchClassicCanvasMedia = {
        canvasOriginalMediaUrl,
        canvasFileNameFromUrl,
        canvasProxiedMediaUrl,
        canvasDisplayMediaUrl,
        canvasMediaPreviewUrl,
        canvasPreviewImgHtml,
        loadCanvasOriginalImageDimensions,
        canvasVideoPreviewHtml,
        canvasVideoFallbackHtml,
        canvasVideoPlayerHtml,
        canvasActivateVideoPreview,
        isCanvasPreviewImage,
        bindCanvasPreviewImageFallbacks,
        downloadBlob,
        triggerDownload
    };
})();
