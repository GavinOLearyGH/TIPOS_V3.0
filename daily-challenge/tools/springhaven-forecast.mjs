import {pathToFileURL} from 'node:url';

const zone='America/New_York';
const localDate=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'});
const localHour=new Intl.DateTimeFormat('en-US',{timeZone:zone,hour:'numeric',hourCycle:'h23'});
const directions=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
const pointURL='https://api.weather.gov/points/39.8875,-75.3630';
const matchesHour=(date,day)=>localDate.format(date)===day&&Number(localHour.format(date))===10;

function gridValue(grid,time){
    return grid?.values.find(({validTime})=>{
        const [start,duration]=validTime.split('/'),ms=Date.parse(start);
        const [,days='0',hours='0',minutes='0']=duration.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/)??[];
        return time>=ms&&time<ms+((Number(days)*24+Number(hours))*60+Number(minutes))*60000;
    })?.value;
}

export function forecastWeather(day,hourly,grid){
    const period=hourly.periods.find(item=>matchesHour(new Date(item.startTime),day));
    if(!period)throw Error('NWS did not return the 10 a.m. Springhaven forecast');
    const {startTime,shortForecast,temperature,temperatureUnit,windDirection,windSpeed}=period;
    const time=Date.parse(startTime);
    const speeds=String(windSpeed).match(/\d+/g)?.map(Number),direction=directions.indexOf(windDirection);
    if(!speeds||! /\bmph\b/i.test(windSpeed))throw Error('NWS did not return usable wind');
    const mph=Math.round(speeds.reduce((sum,speed)=>sum+speed,0)/speeds.length);
    const degrees=gridValue(grid?.windDirection,time);
    const from=Number.isFinite(degrees)?Math.round(degrees)%360:direction>=0?Math.round(direction*22.5):mph===0?0:null;
    const gustValue=gridValue(grid?.windGust,time);
    const gustMph=!Number.isFinite(gustValue)?NaN:grid?.windGust?.uom==='wmoUnit:km_h-1'?gustValue*.621371:
        grid?.windGust?.uom==='wmoUnit:m_s-1'?gustValue*2.23694:NaN;
    const clouds=gridValue(grid?.skyCover,time);
    const sky=/snow|sleet|flurr/i.test(shortForecast)?'snow':/rain|shower|drizzle|thunder/i.test(shortForecast)?'rain':
        /fog|mist/i.test(shortForecast)?'fog':Number.isFinite(clouds)?clouds>=75?'overcast':clouds>=25?'partly cloudy':'clear':
        /partly|mostly sunny/i.test(shortForecast)?'partly cloudy':/cloud|overcast/i.test(shortForecast)?'overcast':'clear';
    return {day,source:'NWS',mph,from,gust:Number.isFinite(gustMph)?Math.max(mph,Math.round(gustMph)):null,
        temperature:temperatureUnit==='C'?Math.round(temperature*9/5+32):temperature,sky};
}

export async function fetchForecast(day,fetcher=fetch){
    async function get(url){
        if(new URL(url).origin!=='https://api.weather.gov')throw Error('Unexpected NWS endpoint');
        const response=await fetcher(url,{headers:{'User-Agent':'Irish Par Golf (https://www.theirishpar.com)','Accept':'application/geo+json'},signal:AbortSignal.timeout(12000)});
        if(!response.ok)throw Error('NWS returned HTTP '+response.status);
        return (await response.json()).properties;
    }
    const point=await get(pointURL);
    const [hourly,grid]=await Promise.all([get(point.forecastHourly),get(point.forecastGridData).catch(()=>null)]);
    return forecastWeather(day,hourly,grid);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
    const today=localDate.format(new Date());
    const day=process.argv[2]??new Date(Date.parse(today+'T12:00:00Z')+86400000).toISOString().slice(0,10);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('Expected YYYY-MM-DD');
    const weather=await fetchForecast(day);
    const {validDailyWeather}=await import('../core/daily-weather.mjs');
    if(!validDailyWeather(weather,day))throw Error('Incomplete NWS forecast');
    console.log(JSON.stringify(weather));
}
