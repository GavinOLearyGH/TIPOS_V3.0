import {createRound,fullBag} from './round.mjs';
import {createConnectedCourse,courseWindAngle} from '../course/connected-view.mjs';
import {stepTime} from './physics.mjs';
import {playableHoles} from '../course/catalog.mjs';
import {roundHoles,roundTee} from './series.mjs';
export const competitionVersion='three-v1';
const courses=new Map();
const rotationStart='2026-11-24';
const frontNine=playableHoles.map(hole=>hole.number);
const threeCombinations=[1,4,5,7].flatMap(four=>[2,8].flatMap(five=>[3,6,9].map(three=>[four,five,three])));
let shuffle=4169;
for(let index=threeCombinations.length-1;index>0;index--){
 shuffle=(Math.imul(shuffle,1664525)+1013904223)>>>0;
 const swap=shuffle%(index+1);
 [threeCombinations[index],threeCombinations[swap]]=[threeCombinations[swap],threeCombinations[index]];
}
export function dailyLineup(day,kind='three'){
 if(kind==='nine')return [...frontNine];
 if(day<rotationStart)return [1,2,3];
 const index=Math.floor((Date.parse(day)-Date.parse(rotationStart))/86400000);
 return [...threeCombinations[index%threeCombinations.length]];
}
function scheduledRound(number,setup,tick=0){
 if(!courses.has(number))courses.set(number,createConnectedCourse(number));
 return createRound(courses.get(number),{tee:roundTee(setup.tee,number),greenSpeed:Number(setup.speed),windProfile:setup,windTick:tick,dailyWeather:setup.weather});
}
const formatter=new Intl.DateTimeFormat('en',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'});
export function dayKey(now=new Date()){
 const parts=Object.fromEntries(formatter.formatToParts(now).map(({type,value})=>[type,value]));return parts.year+'-'+parts.month+'-'+parts.day;
}
function withWeather(setup,day,weather){
 if(weather?.day!==day)return setup;
 return {...setup,windAngle:String(courseWindAngle(weather.from)),mph:String(Math.min(weather.mph,25)),
  windSeed:'springhaven:'+day,weather,...(weather.gust!==null?{gustMph:String(Math.min(weather.gust,25))}:{})};
}
export function dailySetup(day,kind='three',weather){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day)))throw Error('Invalid challenge day');
 let seed=2166136261;for(const c of day)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
 return withWeather({tee:kind==='nine'?'rawlins':['1896','rawlins','butler','dixon'][seed%4],speed:['.8','1','1.24'][(seed>>>4)%3],windModel:'clock-v1',
  windAngle:String((seed>>>8)%12*30),mph:String(4+(seed>>>12)%9),windSeed:(kind==='nine'?'nine-v1':competitionVersion)+':'+day},day,weather);
}
const copy=value=>JSON.parse(JSON.stringify(value));
function roundFor(session,tick=session.state.windTick){
 const round=session.kind==='ace'?aceRound(session.setup,tick):scheduledRound(session.hole,session.setup,tick);
 Object.assign(round.state,copy(session.state),{windTick:tick});return round;
}
export function newCompetition(day,build,id,kind='three',weather){
 if(kind==='ace')return newAceCompetition(day,build,id,weather);
 if(!['three','nine'].includes(kind))throw Error('Unknown competition');
 const setup=dailySetup(day,kind,weather),holes=dailyLineup(day,kind),hole=holes[0],round=scheduledRound(hole,setup);
 return {kind,version:kind==='nine'?'nine-v1':competitionVersion,day,build,id,setup,holes,hole,state:copy(round.state),results:[],shots:[],revision:0,status:'in-progress',tieValid:false,tieMM:null};
}
export function totalScore(session){return session.results.reduce((sum,row)=>sum+row.strokes,0)+(session.status==='completed'?0:session.state.strokes);}
export function applyCompetitionShot(original,shot){
 if(original.kind==='ace')return applyAceShot(original,shot);
 const version=original.kind==='nine'?'nine-v1':competitionVersion;
 const holes=roundHoles(original),index=holes.indexOf(original.hole),final=index===holes.length-1;
 if(original.version!==version||original.status!=='in-progress'||index<0)throw Error('This official round is already complete');
 if(shot.hole!==original.hole||!fullBag.includes(shot.club)||!Number.isFinite(shot.power)||shot.power<.025||shot.power>1||
  Math.abs(shot.power*2000-Math.round(shot.power*2000))>1e-6||!Number.isFinite(shot.heading)||Math.abs(shot.heading)>Math.PI||
  !Number.isFinite(shot.position)||Math.abs(shot.position)>1||!Number.isSafeInteger(shot.releaseTick)||shot.releaseTick<original.state.windTick||
  shot.releaseTick>original.state.windTick+240*3600*6||original.shots.length>=60*holes.length)throw Error('Invalid official shot');
 const session=copy(original),round=roundFor(session,shot.releaseTick);
 if(!round.hit(shot.club,shot.power,shot.heading,shot.position))throw Error('Shot could not start');
 let steps=0;while(['air','roll','drop'].includes(round.state.ball.mode)&&steps++<240*90)round.step();
 if(steps>=240*90)throw Error('Shot did not settle');
 const result=round.state.history.at(-1);
 if(final&&session.state.strokes===0){
  session.tieValid=result.outcome==='rest'||result.outcome==='holed';
  session.tieMM=session.tieValid?(result.outcome==='holed'?0:Math.round(Math.hypot(result.to.x-round.settings.pin.x,result.to.z-round.settings.pin.z)*1000)):null;
 }
 session.shots.push({...shot});session.revision++;
 if(round.state.complete){
  session.results.push({hole:session.hole,strokes:round.state.strokes,penalties:round.state.penalties});
  if(final)session.status='completed';
  else{
   session.hole=holes[index+1];
   const next=scheduledRound(session.hole,session.setup,round.state.windTick);
   session.state=copy(next.state);return session;
  }
 }
 session.state=copy(round.state);return session;
}
export function restoreCompetitionRound(session){return roundFor(session);}
export function compareThree(a,b){return a.total-b.total||Number(b.tieValid)-Number(a.tieValid)||(a.tieValid?a.tieMM-b.tieMM:0);}
export function rankedThree(rows){let previous,rank=0;return [...rows].sort(compareThree).map((row,index)=>{if(!previous||compareThree(previous,row))rank=index+1;previous=row;return {...row,rank};});}

export function dailyAceSetup(day,weather){
 const index=((Math.floor(Date.parse(day+'T00:00:00Z')/86400000)%4)+4)%4;
 const options=[['forward','middle',0,0,1],['middle','back',3,6,1.24,189.16,34.66],['forward','back',7,8,1.24],['back','back',0,8,.8,197.15,36.05]];
 const [tee,pin,dir,mph,speed,x,z]=options[index];
 return withWeather({tee,pin,speed:speed===.8?'.8':String(speed),windModel:'clock-v1',windAngle:String(dir*45),mph:String(mph),windSeed:'ace-v2:'+day,...(x===undefined?{}:{cup:{x,z}})},day,weather);
}
function newAceCompetition(day,build,id,weather){
 const setup=dailyAceSetup(day,weather),session={kind:'ace',version:'ace-v2',day,build,id,setup,hole:6,results:[],shots:[],revision:0,status:'in-progress',tieValid:false,tieMM:null};
 session.state=copy(aceRound(setup).state);return session;
}
function aceRound(setup,tick=0){
 const course=createConnectedCourse(6),pin=setup.cup?'daily':setup.pin;
 if(setup.cup)course.pins=[...course.pins,{id:'daily',...setup.cup}];
 return createRound(course,{tee:setup.tee,pin,greenSpeed:Number(setup.speed),windProfile:setup,windTick:tick,dailyWeather:setup.weather});
}
function applyAceShot(original,shot){
 if(original.version!=='ace-v2'||original.status!=='in-progress'||shot.hole!==6)throw Error('This official shot is already complete');
 const session=copy(original),round=roundFor(session,shot.releaseTick);
 if(!fullBag.includes(shot.club)||!Number.isFinite(shot.power)||shot.power<.025||shot.power>1||Math.abs(shot.power*2000-Math.round(shot.power*2000))>1e-6||
 !Number.isFinite(shot.heading)||Math.abs(shot.heading)>Math.PI||!Number.isFinite(shot.position)||Math.abs(shot.position)>1||
 !Number.isSafeInteger(shot.releaseTick)||shot.releaseTick<original.state.windTick||shot.releaseTick>original.state.windTick+240*3600*6)throw Error('Invalid official shot');
 if(!round.hit(shot.club,shot.power,shot.heading,shot.position))throw Error('Shot could not start');
 let count=0;while(['air','roll','drop'].includes(round.state.ball.mode)&&count++<21600)round.step();
 if(count>=21600)throw Error('Shot did not settle');
 const last=round.state.history.at(-1),ace=last.outcome==='holed',inPlay=ace||last.outcome==='rest';
 session.ace=ace;session.mm=inPlay?(ace?0:Math.round(Math.hypot(last.to.x-round.settings.pin.x,last.to.z-round.settings.pin.z)*1000)):null;
 session.outcome=inPlay?'in-play':last.outcome==='water'?'water':'out';session.status='completed';session.revision=1;session.shots=[{...shot}];
 session.state=copy(round.state);session.state.complete=true;return session;
}
