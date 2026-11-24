import {totalScore} from './competition.mjs';
import {roundModes} from './series.mjs';

const names={ace:'Hole-in-One Challenge',three:'Three-Hole Challenge',nine:roundModes.nine.label};
const penalties={water:'Water',out:'Out of play'};
const own=(record,key)=>Object.hasOwn(record,key);

export function readChallengeInvite(params){
    const kind=params.get('challenge'),day=params.get('day'),score=params.get('score');
    if(!own(names,kind)||!/^\d{4}-\d{2}-\d{2}$/.test(day??''))return null;
    const date=new Date(day+'T00:00:00Z');
    if(Number.isNaN(+date)||date.toISOString().slice(0,10)!==day)return null;
    const limit=kind==='ace'?9999999:9999;
    if(kind==='ace'&&(score==='ace'||own(penalties,score)))return {kind,day,score};
    if(!/^\d{1,7}$/.test(score??'')||Number(score)>limit||(kind!=='ace'&&Number(score)<(kind==='three'?3:9)))return null;
    return {kind,day,score:Number(score)};
}

export function describeChallenge({kind,score}){
    const name=names[kind];
    if(kind==='ace'){
        if(score==='ace')return {name,result:'Hole in one!',lead:'I made a hole in one'};
        if(typeof score==='string')return {name,result:penalties[score],lead:score==='water'?'My shot found the water':'My shot finished out of play'};
        const inches=Math.round(score/25.4);
        const distance=inches===0?'Under 1 in':[Math.floor(inches/12)?Math.floor(inches/12)+' ft':'',inches%12?inches%12+' in':''].filter(Boolean).join(' ');
        return {name,result:distance+' from the pin',lead:'I finished '+distance.toLowerCase()+' from the pin'};
    }
    const relative=score-roundModes[kind].par,delta=relative===0?'E':relative>0?'+'+relative:String(relative);
    return {name,result:score+' strokes ('+delta+')',lead:'I shot '+score+' ('+delta+')'};
}

export function challengeShare(session,root){
    const {kind,day,outcome,ace,mm}=session;
    const score=kind==='ace'?(ace?'ace':outcome==='in-play'?mm:outcome==='water'?'water':'out'):totalScore(session);
    const params=new URLSearchParams({challenge:kind,day,score});
    const invite=readChallengeInvite(params);
    if(!invite)return null;
    const {name,lead}=describeChallenge(invite);
    const url=new URL(root);url.search=params;
    return {title:name+' · The Irish Par',text:lead+' in the '+name+' at Springhaven. Can you beat it?',url:url.href};
}
