const compass=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
const skies=['clear','partly cloudy','overcast','rain','snow','fog'];
const feed='https://raw.githubusercontent.com/GavinOLearyGH/TIPOS_V3.0/springhaven-weather/';
const pending=new Map();

export function validDailyWeather(value,day){
    return value?.day===day&&value.source==='NWS'&&
        Number.isFinite(value.mph)&&value.mph>=0&&value.mph<=200&&
        Number.isInteger(value.from)&&value.from>=0&&value.from<360&&
        (value.gust===null||Number.isFinite(value.gust)&&value.gust>=value.mph&&value.gust<=250)&&
        (value.recentPrecipMm===undefined||Number.isFinite(value.recentPrecipMm)&&value.recentPrecipMm>=0)&&
        Number.isFinite(value.temperature)&&value.temperature>=-100&&value.temperature<=150&&skies.includes(value.sky);
}

export function turfWetness(weather){
    if(!weather||weather.sky==='snow')return 0;
    const recent=Number.isFinite(weather.recentPrecipMm)?weather.recentPrecipMm:0;
    return Math.min(1,Math.max(weather.sky==='rain'?.3:0,recent/15));
}

export function turfLabel(weather){
    const wetness=turfWetness(weather);
    return wetness>=.65?'Wet turf':wetness>=.15?'Damp turf':'';
}

export function weatherSummary(weather){
    const {sky,temperature,mph,from,gust}=weather;
    const wind=mph?compass[Math.round(from/22.5)%16]+' '+mph+' mph':'Calm';
    return sky[0].toUpperCase()+sky.slice(1)+' · '+temperature+'°F · '+wind+(gust>mph?' · gusts '+gust+' mph':'')+(turfLabel(weather)?' · '+turfLabel(weather):'');
}

export function loadPreviewWeather(day){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return Promise.reject(Error('Invalid challenge date'));
    if(!pending.has(day)){
        const request=(async()=>{
            const response=await fetch(feed+day+'.json',{cache:'no-store',signal:AbortSignal.timeout(5000)});
            if(response.status===404)return null;
            if(!response.ok)throw Error('Today’s conditions could not load. Please try again.');
            const weather=await response.json();
            if(!validDailyWeather(weather,day))throw Error('Today’s conditions could not load. Please try again.');
            return weather;
        })().catch(error=>{pending.delete(day);throw error;});
        pending.set(day,request);
    }
    return pending.get(day);
}
