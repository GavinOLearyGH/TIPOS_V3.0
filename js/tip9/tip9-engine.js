import { TIPState } from '../core/storage.js';
import { addJournalEntry, updateJournalEntry } from '../core/journal.js';
import { TIP9_PRACTICES } from './tip9-data.js';

const TOPIC_MAP={
SW01:['contact','lowPoint'],SW02:['tempo'],SW03:['lowPoint','contact'],SW04:['startDirection'],SW05:['balance'],SW06:['faceAwareness','startDirection'],SW07:['rotation','balance'],SW08:['transition','tempo'],
SK01:['puttingStartLine'],SK02:['puttingPace'],SK03:['puttingStartLine'],SK04:['puttingPace'],SK05:['puttingStartLine','routine'],SK06:['teeControl'],SK07:['wedgeDistance'],SK08:['approachPlay'],SK09:['approachPlay','courseManagement'],SK10:['faceAwareness','startDirection'],SK11:['approachPlay','courseManagement'],SK12:['routine','confidence'],SK13:['courseManagement'],SK14:['shortGame'],SK15:['shortGame','wedgeDistance'],SK16:['shortGame'],SK17:['shortGame'],SK18:['shortGame']
};

export function getTIP9Practice(id){ return TIP9_PRACTICES.find(p=>p.id===id)||null; }
export function getTIP9PracticeState(id,state=TIPState.get()){ return {level:1,best:0,last:null,feel:null,completions:0,lastAt:null,...(state.tip9.practices?.[id]||{})}; }
export function getTIP9Pool(context){ return TIP9_PRACTICES.filter(p=>p.contexts.includes(context)); }
export function getTIP9Data(practice,context){ return context==='noball'&&practice?.noBall?practice.noBall:practice; }

export function recommendTIP9(context,avoidId=null){
  const state=TIPState.get();
  let pool=getTIP9Pool(context).filter(p=>p.id!==avoidId);
  if(!pool.length) pool=getTIP9Pool(context);
  const recentIds=(state.tip9.recent||[]).slice(0,6).map(x=>typeof x==='string'?x:x.id);
  return pool.map((practice,index)=>{
    const ps=getTIP9PracticeState(practice.id,state);
    const recentIndex=recentIds.indexOf(practice.id);
    const recencyPenalty=recentIndex<0?0:(7-recentIndex)*20;
    const score=(ps.completions||0)*8+recencyPenalty+(ps.level-1)*3+index/100;
    return {practice,score};
  }).sort((a,b)=>a.score-b.score)[0]?.practice||null;
}

export function buildTIP9Blocks(practiceId,context){
  const practice=getTIP9Practice(practiceId); if(!practice) throw new Error('TIP9 practice not found.');
  const data=getTIP9Data(practice,context); const level=Math.max(1,Math.min(3,getTIP9PracticeState(practiceId).level));
  const [instruction,goal]=data.levels[level-1];
  const first=level===1?(practice.type==='SWING'?'FIND':'LEARN'):level===2?'CONTROL':'PERFORM';
  const variable=context==='noball'?'Reset fully between reps and change the imagined target or shot so you reproduce the movement rather than groove it.':'Change one simple variable between balls—target, club, distance or lie—so you reproduce the task rather than groove it.';
  const play=context==='noball'?'For the final three, use your normal pre-shot routine and make one committed rehearsal for each imagined shot.':'For the final three, use your normal pre-shot routine and treat every ball as a one-ball golf shot. Do not hit an immediate correction ball.';
  return [
    {stage:first,instruction,goal},
    {stage:'TEST',instruction:`${instruction} ${variable}`,goal},
    {stage:'PLAY',instruction:`${instruction} ${play}`,goal:'Carry the same success into a normal golf-shot context.'}
  ];
}

export function swingResponse(score){
  if(score===0)return{title:'RESET',text:'Make the same task easier for the next three. Reduce effort to 60–70%, make two slow rehearsals that exaggerate only this feel, then go. Do not add another swing thought.'};
  if(score===1)return{title:'REINFORCE',text:'You found it once. Keep the same task and support for the next three. Make one deliberate rehearsal and reset fully each time.'};
  if(score===2)return{title:'PROGRESS',text:'The pattern is showing up. Keep the same idea, reduce the support slightly and let your attention move toward the target.'};
  return{title:'PROGRESS',text:'You have the task. Remove unnecessary support and make the next three look more like normal golf shots.'};
}

export function completeTIP9({practiceId,context,results}){
  const practice=getTIP9Practice(practiceId); if(!practice) throw new Error('TIP9 practice not found.');
  const safeResults=Array.isArray(results)?results.map(Number).filter(n=>Number.isFinite(n)&&n>=0&&n<=3).slice(0,3):[];
  if(safeResults.length!==3) throw new Error('TIP9 completion requires three scored blocks.');
  const score=safeResults.reduce((a,b)=>a+b,0); let unlocked=false; let level=1;
  const at=new Date().toISOString();
  TIPState.update(state=>{
    const current={level:1,best:0,last:null,feel:null,completions:0,lastAt:null,...(state.tip9.practices[practiceId]||{})};
    current.best=Math.max(Number(current.best||0),score); current.last=score; current.completions=Number(current.completions||0)+1; current.lastAt=at;
    if(practice.type==='SKILL'&&score>=7&&current.level<3){current.level++;unlocked=true;}
    level=current.level; state.tip9.practices[practiceId]=current; state.tip9.lifetime=Number(state.tip9.lifetime||0)+1;
    state.tip9.recent=[{id:practiceId,context,at},...(state.tip9.recent||[]).filter(x=>(typeof x==='string'?x:x.id)!==practiceId)].slice(0,20);
    return state;
  },'tip9:complete');
  const entry=addJournalEntry({type:'tip9',source:'tip9',title:practice.name,dimensions:[practice.type.toLowerCase()],topics:TOPIC_MAP[practiceId]||[],context:{practiceContext:context},result:{practiceId,practiceType:practice.type,score,outOf:9,level:level-(unlocked?1:0),unlockedLevel:unlocked?level:null,feel:''},activity:{kind:'tip9',practiceId,context,results:safeResults,units:context==='noball'?'reps':'balls'},note:''});
  return {entry,score,unlocked,newLevel:level,practice};
}

export function saveTIP9Feel(entryId,practiceId,feel){
  const value=String(feel||'').trim(); if(!value)return null;
  TIPState.update(state=>{const p=state.tip9.practices[practiceId]; if(p)p.feel=value; return state;},'tip9:feel');
  return updateJournalEntry(entryId,{result:{...TIPState.get().journal.find(e=>e.id===entryId)?.result,feel:value},reflection:{text:`TIP9 check-in: ${value}`}});
}
