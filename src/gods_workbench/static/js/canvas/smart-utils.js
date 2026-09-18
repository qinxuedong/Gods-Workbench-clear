(function(){
    function safeExportFileName(name, fallback='download.zip'){
        const cleaned = String(name || fallback).replace(/[\\/:*?"<>|]+/g, '_').trim();
        return cleaned || fallback;
    }

    function formatRunDuration(ms){
        const total = Math.max(0, Math.floor(Number(ms || 0) / 1000));
        const min = Math.floor(total / 60);
        const sec = total % 60;
        return min ? `${min}:${String(sec).padStart(2, '0')}` : `${sec}s`;
    }

    window.GodsWorkbenchSmartCanvasUtils = {safeExportFileName, formatRunDuration};
})();
