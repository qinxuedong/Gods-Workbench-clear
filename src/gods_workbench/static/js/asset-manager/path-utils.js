export function pathCompareKey(value=''){
    return String(value || '').trim().replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
}
