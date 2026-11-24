const key='irish-par-theme';

export function clubTheme(){
    const requested=new URLSearchParams(globalThis.location?.search).get('theme');
    if(requested==='springhaven'||requested==='irish-par')return requested;
    try{return globalThis.sessionStorage.getItem(key)==='springhaven'?'springhaven':'irish-par';}
    catch{return 'irish-par';}
}

export function applyClubTheme(){
    const theme=clubTheme();
    if(globalThis.document?.documentElement)document.documentElement.dataset.clubTheme=theme;
    try{globalThis.sessionStorage.setItem(key,theme);}catch{}
}

export function themedURL(url){
    if(clubTheme()==='springhaven')url.searchParams.set('theme','springhaven');
    return url;
}

// Keep the initial paint and the navigation module on the same theme selection.
export function clubThemeHead(){
    return `<head><script>(()=>{const key=${JSON.stringify(key)};${clubTheme.toString()}
(${applyClubTheme.toString()})();})();</script>`;
}
