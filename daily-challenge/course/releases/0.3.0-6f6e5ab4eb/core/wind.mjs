// Course wind v1. Angles are clockwise from Hole 1's playing direction.
// Legacy 0–7 direction indices remain supported by wind-setup.mjs and migration.
export const windModel='clock-v1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const wrap=angle=>((angle%360)+360)%360;
const number=(value,fallback)=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value))?Number(value):fallback;
export function windSetup(input={},seed='practice'){
    const angle=number(input.windAngle,number(input.wind,0)*45);
    return {windModel,windAngle:String(wrap(angle)),mph:String(clamp(number(input.mph,0),0,25)),
        windSeed:String(input.windSeed??seed).slice(0,128)};
}
export function randomWindSetup(random=Math.random){
    return windSetup({windAngle:Math.min(11,Math.floor(random()*12))*30,
        mph:4+Math.min(8,Math.floor(random()*9)),windSeed:Math.floor(random()*4294967296).toString(36)});
}
function phases(seed){
    let hash=2166136261;
    for(const char of String(seed))hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;
    return [0,1,2,3].map(()=>{hash=(Math.imul(hash,1664525)+1013904223)>>>0;return hash/4294967296*Math.PI*2;});
}
export function createWind(input={}){
    if(input.windModel&&input.windModel!==windModel)throw Error('Unsupported wind pattern version');
    const setup=windSetup(input),baseAngle=Number(setup.windAngle),baseMph=Number(setup.mph),p=phases(setup.windSeed);
    function values(time){
        const t=Math.max(0,number(time,0));
        const angle=baseAngle+15*(.65*Math.sin(t*Math.PI*2/27+p[0])+.35*Math.sin(t*Math.PI*2/41+p[1]));
        const mph=clamp(baseMph*(1+.14*Math.sin(t*Math.PI*2/19+p[2])+.06*Math.sin(t*Math.PI*2/31+p[3])),0,25);
        return {angle,mph};
    }
    return {setup,sample(time,bearing=0){
        const {angle,mph}=values(time),ahead=values(Math.max(0,number(time,0))+.5).mph;
        const radians=(angle-bearing)*Math.PI/180,speed=mph*.44704;
        return {x:Math.cos(radians)*speed,z:Math.sin(radians)*speed,mph,angle:wrap(angle),
            trend:ahead-mph>.025?'building':ahead-mph<-.025?'easing':'steady'};
    }};
}
export function windReading(wind,heading=0){
    const mph=Math.hypot(wind.x,wind.z)/.44704;
    if(mph<.05)return {rotation:0,text:'Calm',calm:true};
    const rotation=(Math.atan2(wind.z,wind.x)-heading)*180/Math.PI;
    const clock=Math.round(wrap(rotation)/30)%12||12;
    return {rotation,text:Math.round(mph)+' mph · '+clock+' o’clock'+(wind.trend?' · '+wind.trend:''),calm:false};
}
