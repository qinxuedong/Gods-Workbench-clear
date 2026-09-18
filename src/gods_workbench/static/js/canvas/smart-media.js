(function(){
    function triggerDownload(href, filename, revokeDelay=0){
        if(!href) return false;
        const link = document.createElement('a');
        link.href = href;
        link.download = filename || 'smart-canvas-workflow.json';
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

    window.GodsWorkbenchSmartCanvasMedia = {downloadBlob, triggerDownload};
})();
