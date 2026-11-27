import {holeByNumber} from '../course/catalog.mjs';

const legacyHoles=[1,2,3];
export const roundModes={
    three:{label:'Three Holes',par:12},
    nine:{label:'Play 9',par:35}
};
const pondTees={1896:'back',rawlins:'middle',butler:'forward',dixon:'forward'};

export function roundHoles(round){return round.holes??(round.kind==='ace'?[round.hole??6]:legacyHoles);}
export function roundPar(round){return roundHoles(round).reduce((sum,number)=>sum+holeByNumber(number).par,0);}
export function roundTee(tee,hole){return hole===6?(pondTees[tee]??tee):tee;}
export function newSeries(id,setup,holes=legacyHoles){return {id,setup,holes:[...holes],results:[]};}
export function recordHole(series,hole,strokes,penalties){
    const index=roundHoles(series).indexOf(hole);
    if(index<0||!Number.isInteger(strokes)||strokes<1||!Number.isInteger(penalties)||penalties<0||penalties>=strokes)throw Error('Invalid hole score');
    if(series.results.length<index)throw Error('Complete the preceding hole first');
    return {...series,results:[...series.results.slice(0,index),{hole,strokes,penalties}]};
}
export function seriesScore(series){
    const total=series.results.reduce((sum,row)=>sum+row.strokes,0);
    const completedPar=series.results.reduce((sum,row)=>sum+holeByNumber(row.hole).par,0);
    return {total,complete:series.results.length===roundHoles(series).length,relative:total-completedPar};
}
export function setupKey(setup){return JSON.stringify([setup.tee,setup.windAngle??Number(setup.wind||0)*45,setup.mph,setup.speed,setup.windModel??'static',setup.windSeed??'']);}
