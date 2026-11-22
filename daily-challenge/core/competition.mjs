import {createRound,fullBag} from './round.mjs';
import {createCourse} from './course.mjs';
import {stepTime} from './physics.mjs';
import {hole1} from '../course/holes/hole-1.mjs';
import {hole2} from '../course/holes/hole-2.mjs';
import {hole3} from '../course/holes/hole-3.mjs';
export const competitionVersion='three-v1';
const courses=[hole1,hole2,hole3].map(createCourse);
const formatter=new Intl.DateTimeFormat('en',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'});
export function dayKey(now=new Date()){
 const parts=Object.fromEntries(formatter.formatToParts(now).map(({type,value})=>[type,value]));return parts.year+'-'+parts.month+'-'+parts.day;
}
export function dailySetup(day){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day)))throw Error('Invalid challenge day');
 let seed=2166136261;for(const c of day)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
 return {tee:['1896','rawlins','butler','dixon'][seed%4],speed:['.8','1','1.24'][(seed>>>4)%3],windModel:'clock-v1',
  windAngle:String((seed>>>8)%12*30),mph:String(4+(seed>>>12)%9),windSeed:competitionVersion+':'+day};
}
const copy=value=>JSON.parse(JSON.stringify(value));
function roundFor(session,tick=session.state.windTick){
 const round=createRound(courses[session.hole-1],{tee:session.setup.tee,greenSpeed:Number(session.setup.speed),windProfile:session.setup,windTick:tick});
 Object.assign(round.state,copy(session.state),{windTick:tick});return round;
}
export function newCompetition(day,build,id){
 const setup=dailySetup(day),round=createRound(courses[0],{tee:setup.tee,greenSpeed:Number(setup.speed),windProfile:setup});
 return {version:competitionVersion,day,build,id,setup,hole:1,state:copy(round.state),results:[],shots:[],revision:0,status:'in-progress',tieValid:false,tieMM:null};
}
export function totalScore(session){return session.results.reduce((sum,row)=>sum+row.strokes,0)+(session.status==='completed'?0:session.state.strokes);}
export function applyCompetitionShot(original,shot){
 if(original.version!==competitionVersion||original.status!=='in-progress')throw Error('This official round is already complete');
 if(shot.hole!==original.hole||!fullBag.includes(shot.club)||!Number.isFinite(shot.power)||shot.power<.025||shot.power>1||
  Math.abs(shot.power*2000-Math.round(shot.power*2000))>1e-6||!Number.isFinite(shot.heading)||Math.abs(shot.heading)>Math.PI||
  !Number.isFinite(shot.position)||Math.abs(shot.position)>1||!Number.isSafeInteger(shot.releaseTick)||shot.releaseTick<original.state.windTick||
  shot.releaseTick>original.state.windTick+240*3600*6||original.shots.length>=180)throw Error('Invalid official shot');
 const session=copy(original),round=roundFor(session,shot.releaseTick);
 if(!round.hit(shot.club,shot.power,shot.heading,shot.position))throw Error('Shot could not start');
 let steps=0;while(['air','roll','drop'].includes(round.state.ball.mode)&&steps++<240*90)round.step();
 if(steps>=240*90)throw Error('Shot did not settle');
 const result=round.state.history.at(-1);
 if(session.hole===3&&session.state.strokes===0){
  session.tieValid=result.outcome==='rest'||result.outcome==='holed';
  session.tieMM=session.tieValid?(result.outcome==='holed'?0:Math.round(Math.hypot(result.to.x-round.settings.pin.x,result.to.z-round.settings.pin.z)*1000)):null;
 }
 session.shots.push({...shot});session.revision++;
 if(round.state.complete){
  session.results.push({hole:session.hole,strokes:round.state.strokes,penalties:round.state.penalties});
  if(session.hole===3)session.status='completed';
  else{
   session.hole++;
   const next=createRound(courses[session.hole-1],{tee:session.setup.tee,greenSpeed:Number(session.setup.speed),windProfile:session.setup,windTick:round.state.windTick});
   session.state=copy(next.state);return session;
  }
 }
 session.state=copy(round.state);return session;
}
export function restoreCompetitionRound(session){return roundFor(session);}
export function compareThree(a,b){return a.total-b.total||Number(b.tieValid)-Number(a.tieValid)||(a.tieValid?a.tieMM-b.tieMM:0);}
export function rankedThree(rows){let previous,rank=0;return [...rows].sort(compareThree).map((row,index)=>{if(!previous||compareThree(previous,row))rank=index+1;previous=row;return {...row,rank};});}
