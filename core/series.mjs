export const seriesPar=12;
export function newSeries(id,setup){return {id,setup,results:[]};}
export function recordHole(series,hole,strokes,penalties){
    if(![1,2,3].includes(hole)||!Number.isInteger(strokes)||strokes<1||!Number.isInteger(penalties)||penalties<0||penalties>=strokes)throw Error('Invalid hole score');
    if(series.results.length<hole-1)throw Error('Complete the preceding hole first');
    return {...series,results:[...series.results.filter(r=>r.hole<hole),{hole,strokes,penalties}]};
}
export function seriesScore(series){const total=series.results.reduce((s,r)=>s+r.strokes,0);return {total,complete:series.results.length===3,relative:total-[4,5,3].slice(0,series.results.length).reduce((a,b)=>a+b,0)};}
export function setupKey(setup){return JSON.stringify([setup.tee,setup.windAngle??Number(setup.wind||0)*45,setup.mph,setup.speed,setup.windModel??'static',setup.windSeed??'']);}
