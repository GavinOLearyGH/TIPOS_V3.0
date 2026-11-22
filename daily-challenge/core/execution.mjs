import {clamp,clubs} from './physics.mjs';
import {clubLie} from './club-lie.mjs';
export function executionWindow(club,power,lie='fairway'){
    if(club==='Putter')return 1;
    const long=(clubs[club]?.carry??100)>170;
    const base=clamp(.48-.25*power**2-(long?.07:0)-(lie==='heavy'?.08:lie==='rough'?.04:0),.10,.48);
    const high=clamp((power-.9)/.1,0,1);return base*(1-.35*high*high*(3-2*high))*clubLie(club,lie).window;
}
export function strikePosition(elapsed){return -Math.cos(Math.max(0,elapsed)*Math.PI*2/1400);}
export function resolveExecution(club,power,position=0,lie='fairway'){
    if(club==='Putter')return {heading:0,power,label:'Putt',error:0};
    const zone=executionWindow(club,power,lie),signed=Math.sign(position)*clamp((Math.abs(position)-zone)/(1-zone),0,1);
    const error=Math.abs(signed);
    const carry=clubs[club]?.carry??100;
    const curveScale=carry>170?.0013:carry>110?.0008:.0003;
    // Preserve forgiveness at the clean-zone boundary, then progressively
    // amplify direction and curvature. Controlled swings reduce both effects.
    // Keep contact power/spin/lift penalties independent of this lateral ramp.
    const effort=(.55+.45*power**2)*clubLie(club,lie).miss;
    const direction=signed*(1+1.25*error)*effort;
    const curvature=signed*(1+1.5*error)*effort;
    return {heading:direction*.045,power:power*(1-.12*error**1.3),error,
        curve:curvature*curveScale,spin:1-.4*error,lift:1-.08*error,
        label:error===0?'Clean strike':(signed<0?'Early · draws left':'Late · fades right')+' · reduced spin'};
}
