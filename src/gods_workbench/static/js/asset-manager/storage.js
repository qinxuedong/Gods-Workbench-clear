export function readStoredBoolean(key, fallback=false){
    try {
        const value = localStorage.getItem(key);
        return value === null ? Boolean(fallback) : value === 'true';
    } catch(_) {
        return Boolean(fallback);
    }
}

export function readStoredNumber(key, fallback=0){
    try {
        const value = Number(localStorage.getItem(key));
        return Number.isFinite(value) && value > 0 ? value : Number(fallback || 0);
    } catch(_) {
        return Number(fallback || 0);
    }
}
