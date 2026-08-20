import { TIPState } from '../core/storage.js';
import { getTIPSuggestion } from './recommend.js';
import { getTIP7Status } from '../tip7/tip7-engine.js';
import { TIP9_PRACTICES } from '../tip9/tip9-data.js';
import { getTIP9PracticeState } from '../tip9/tip9-engine.js';

export const SESSION_CONTEXTS = {
  range:{label:'Range',tip9:'range'},
  bay:{label:'Hitting Bay',tip9:'bay'},
  green:{label:'Putting Green',tip9:'green'},
  short:{label:'Short Game',tip9:'short'},
  home:{label:'Home / No Ball',tip9:'noball'},
  anywhere:{label:'Anywhere',tip9:null}
};

const TIME_BUCKETS = [7,15,30,45,60];

function normalizeMinutes(value){
  const n=Number(value)||30;
  return TIME_BUCKETS.reduce((best,x)=>Math.abs(x-n)<Math.abs(best-n)?x:best,TIME_BUCKETS[0]);
}

function practiceEligible(practice,context){
  if(!practice) return false;
  const mapped=SESSION_CONTEXTS[context]?.tip9;
  return mapped ? practice.contexts.includes(mapped) : true;
}

function recencyPenalty(practiceId,state){
  const recent=(state.tip9.recent||[]).slice(0,10);
  const idx=recent.findIndex(x=>(typeof x==='string'?x:x.id)===practiceId);
  return idx<0?0:(10-idx)*3;
}

function rankPractice(practice,state,preferredIds=[]){
  const ps=getTIP9PracticeState(practice.id,state);
  const preferredIndex=preferredIds.indexOf(practice.id);
  const preference=preferredIndex<0?8:preferredIndex*1.5;
  return preference+(ps.completions||0)*1.5+recencyPenalty(practice.id,state)+(ps.level-1)*.25;
}

function choosePractice({context,state,avoid=[],preferredIds=[]}){
  const mapped=SESSION_CONTEXTS[context]?.tip9;
  let pool=TIP9_PRACTICES.filter(p=>!avoid.includes(p.id) && (!mapped || p.contexts.includes(mapped)));
  if(!pool.length) pool=TIP9_PRACTICES.filter(p=>!mapped || p.contexts.includes(mapped));
  return pool.map(p=>({practice:p,score:rankPractice(p,state,preferredIds)})).sort((a,b)=>a.score-b.score)[0]?.practice||null;
}

function suggestionPracticeIds(suggestion){
  if(suggestion?.action?.type!=='tip9' || !suggestion.action.practiceId) return [];
  return [suggestion.action.practiceId];
}

function resolveContextForPractice(practice,sessionContext){
  const mapped=SESSION_CONTEXTS[sessionContext]?.tip9;
  if(mapped && practice.contexts.includes(mapped)) return mapped;
  if(sessionContext==='anywhere'){
    const priority=['range','bay','green','short','noball'];
    return priority.find(c=>practice.contexts.includes(c))||practice.contexts[0];
  }
  return practice.contexts[0];
}

function addTIP9(blocks,practice,context){
  if(!practice) return;
  blocks.push({kind:'tip9',refId:practice.id,title:practice.name,practiceType:practice.type,context:resolveContextForPractice(practice,context),estimate:7});
}

export function composeTodaySession({minutes=30,context='anywhere'}={}){
  const state=TIPState.get();
  const duration=normalizeMinutes(minutes);
  const safeContext=SESSION_CONTEXTS[context]?context:'anywhere';
  const suggestion=getTIPSuggestion();
  const tip7=getTIP7Status();
  const blocks=[];
  const used=[];
  const preferred=suggestionPracticeIds(suggestion);

  // A seven-minute request should remain one focused action.
  if(duration===7){
    if(suggestion?.kind==='tip7' && tip7.canStart){
      blocks.push({kind:'tip7',title:tip7.nextDay.theme,day:tip7.nextDay.day,estimate:7});
    } else {
      let p=TIP9_PRACTICES.find(x=>x.id===preferred[0] && practiceEligible(x,safeContext));
      if(!p) p=choosePractice({context:safeContext,state,preferredIds:preferred});
      addTIP9(blocks,p,safeContext);
    }
  } else {
    // For 15+ minutes, include today's body work when available unless location is explicitly putting/short-game focused and time is only 15 minutes.
    const bodyFits=tip7.canStart && !(duration===15 && (safeContext==='green'||safeContext==='short'));
    if(bodyFits) blocks.push({kind:'tip7',title:tip7.nextDay.theme,day:tip7.nextDay.day,estimate:7});

    const desiredTIP9 = duration===15 ? (bodyFits?1:2) : duration===30 ? (bodyFits?2:3) : duration===45 ? (bodyFits?3:4) : (bodyFits?4:5);
    for(let i=0;i<desiredTIP9;i++){
      let p=null;
      if(i===0 && preferred[0]) p=TIP9_PRACTICES.find(x=>x.id===preferred[0] && practiceEligible(x,safeContext) && !used.includes(x.id));
      if(!p) p=choosePractice({context:safeContext,state,avoid:used,preferredIds:preferred});
      if(!p) break;
      used.push(p.id);
      addTIP9(blocks,p,safeContext);
    }
  }

  const estimated=blocks.reduce((sum,b)=>sum+b.estimate,0);
  return {
    id:`session_${Date.now()}`,
    title:"Today's Session",
    minutes:duration,
    context:safeContext,
    contextLabel:SESSION_CONTEXTS[safeContext].label,
    reason:suggestion?.reason || 'Built from your current progress and recent Journal.',
    focus:suggestion?.title || null,
    blocks,
    estimated
  };
}
