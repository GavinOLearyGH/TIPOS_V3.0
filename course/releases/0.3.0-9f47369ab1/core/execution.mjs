import {clamp,clubs} from './physics.mjs';
export function executionWindow(club,power,lie='fairway'){
    if(club==='Putter')return 1;
    const long=(clubs[club]?.carry??100)>170;
    return clamp(.48-.25*power**2-(long?.07:0)-(lie==='heavy'?.08:lie==='rough'?.04:0),.10,.48);
}
export function strikePosition(elapsed){return -Math.cos(Math.max(0,elapsed)*Math.PI*2/1400);}
export function resolveExecution(club,power,position=0,lie='fairway'){
    if(club==='Putter')return {heading:0,power,label:'Putt',error:0};
    const zone=executionWindow(club,power,lie),signed=Math.sign(position)*clamp((Math.abs(position)-zone)/(1-zone),0,1);
    const error=Math.abs(signed);
    return {heading:signed*.055,power:power*(1-.12*error**1.3),error,
        label:error===0?'Clean strike':(error<.4?'Slight miss':'Mishit')+' · '+(signed<0?'left':'right')};
}
