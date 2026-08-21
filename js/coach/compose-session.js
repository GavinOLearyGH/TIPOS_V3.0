import { TIPState } from '../core/storage.js';
import { getTIPSuggestion } from './recommend.js';
import { getSessionFocus, focusPracticeIds } from './catalog.js';
import { getTIP7Status } from '../tip7/tip7-engine.js';
import { TIP9_PRACTICES } from '../tip9/tip9-data.js';
import { getTIP9PracticeState } from '../tip9/tip9-engine.js';

export const SESSION_CONTEXTS = {
  range:{label:'Range',tip9:'range'}, bay:{label:'Hitting Bay',tip9:'bay'}, green:{label:'Putting Green',tip9:'green'}, short:{label:'Short Game',tip9:'short'}, home:{label:'Home / No Ball',tip9:'noball'}, anywhere:{label:'Anywhere',tip9:null}
};
const TIME_BUCKETS = [7,15,30,45,60];
function normalizeMinutes(value){const n=Number(value)||30;return TIME_BUCKETS.reduce((best,x)=>Math.abs(x-n)<Math.abs(best-n)?x:best,TIME_BUCKETS[0]);}
function practiceEligible(practice,context){if(!practice)return false;const mapped=SESSION_CONTEXTS[context]?.tip9;return mapped?practice.contexts.includes(mapped):true;}
function recencyPenalty(practiceId,state){const recent=(state.tip9.recent||[]).slice(0,10);const idx=recent.findIndex(x=>(typeof x==='string'?x:x.id)===practiceId);return idx<0?0:(10-idx)*3;}
function rankPractice(practice,state,preferredIds=[]){const ps=getTIP9PracticeState(practice.id,state);const preferredIndex=preferredIds.indexOf(practice.id);const preference=preferredIndex<0?8:preferredIndex*1.5;return preference+(ps.completions||0)*1.5+recencyPenalty(practice.id,state)+(ps.level-1)*.25;}
function choosePractice({context,state,avoid=[],preferredIds=[],allowedIds=[]}){
  const mapped=SESSION_CONTEXTS[context]?.tip9;
  let pool=TIP9_PRACTICES.filter(p=>!avoid.includes(p.id)&&(!mapped||p.contexts.includes(mapped))&&(!allowedIds.length||allowedIds.includes(p.id)));
  if(!pool.length&&allowedIds.length)return null;
  if(!pool.length)pool=TIP9_PRACTICES.filter(p=>!mapped||p.contexts.includes(mapped));
  return pool.map(p=>({practice:p,score:rankPractice(p,state,preferredIds)})).sort((a,b)=>a.score-b.score)[0]?.practice||null;
}
function suggestionPracticeIds(suggestion){if(suggestion?.action?.type!=='tip9'||!suggestion.action.practiceId)return[];return[suggestion.action.practiceId];}
function resolveContextForPractice(practice,sessionContext){const mapped=SESSION_CONTEXTS[sessionContext]?.tip9;if(mapped&&practice.contexts.includes(mapped))return mapped;if(sessionContext==='anywhere'){const priority=['range','bay','green','short','noball'];return priority.find(c=>practice.contexts.includes(c))||practice.contexts[0];}return practice.contexts[0];}
function addTIP9(blocks,practice,context){if(!practice)return;blocks.push({kind:'tip9',refId:practice.id,title:practice.name,practiceType:practice.type,context:resolveContextForPractice(practice,context),estimate:7});}
function orderedPreferences(focusIds,suggestionIds){if(!focusIds.length)return suggestionIds;const suggested=suggestionIds.filter(id=>focusIds.includes(id));return [...suggested,...focusIds.filter(id=>!suggested.includes(id))];}

export function composeTodaySession({minutes=30,context='anywhere',focus='auto'}={}){
  const state=TIPState.get();
  const duration=normalizeMinutes(minutes);
  const safeContext=SESSION_CONTEXTS[context]?context:'anywhere';
  const focusConfig=getSessionFocus(focus);
  const safeFocus=focusConfig===getSessionFocus(focus)?focus:'auto';
  const suggestion=getTIPSuggestion();
  const tip7=getTIP7Status();
  const blocks=[]; const used=[];
  const suggestionIds=suggestionPracticeIds(suggestion);
  const focusIds=focusPracticeIds(safeFocus);
  const preferred=orderedPreferences(focusIds,suggestionIds);
  const focusedTIP9=focusConfig.kind==='tip9';
  let adaptedFromPriority=false;
  let adaptedFromFocus=false;

  if(focusConfig.kind==='tip7'){
    if(tip7.canStart)blocks.push({kind:'tip7',title:tip7.nextDay.theme,day:tip7.nextDay.day,estimate:7});
  } else if(duration===7){
    let p=null;
    if(!focusedTIP9){
      p=TIP9_PRACTICES.find(x=>x.id===preferred[0]&&practiceEligible(x,safeContext));
      if(preferred[0]&&!p)adaptedFromPriority=true;
    }
    if(!p)p=choosePractice({context:safeContext,state,preferredIds:preferred,allowedIds:focusedTIP9?focusIds:[]});
    if(!p&&focusedTIP9){adaptedFromFocus=true;p=choosePractice({context:safeContext,state,preferredIds:suggestionIds});}
    addTIP9(blocks,p,safeContext);
  } else {
    const bodyFits=!focusedTIP9&&focusConfig.kind==='auto'&&tip7.canStart&&!(duration===15&&(safeContext==='green'||safeContext==='short'));
    if(bodyFits)blocks.push({kind:'tip7',title:tip7.nextDay.theme,day:tip7.nextDay.day,estimate:7});
    const desiredTIP9=duration===15?(bodyFits?1:2):duration===30?(bodyFits?2:3):duration===45?(bodyFits?3:4):(bodyFits?4:5);
    for(let i=0;i<desiredTIP9;i++){
      let p=null;
      if(i===0&&!focusedTIP9&&preferred[0]){
        p=TIP9_PRACTICES.find(x=>x.id===preferred[0]&&practiceEligible(x,safeContext)&&!used.includes(x.id));
        if(!p)adaptedFromPriority=true;
      }
      if(!p)p=choosePractice({context:safeContext,state,avoid:used,preferredIds:preferred,allowedIds:focusedTIP9?focusIds:[]});
      if(!p&&focusedTIP9){
        adaptedFromFocus=true;
        p=choosePractice({context:safeContext,state,avoid:used,preferredIds:suggestionIds});
      }
      if(!p)break;
      used.push(p.id); addTIP9(blocks,p,safeContext);
    }
  }

  const contextLabel=SESSION_CONTEXTS[safeContext].label;
  const focusLabel=focusConfig.label;
  let reason=suggestion?.reason||'Built from your current progress and recent Journal.';
  if(focusConfig.kind==='tip7'){
    reason=tip7.canStart
      ? `You asked to work on your body, so TIP selected the next TIP7 session in your program.`
      : `Your TIP7 work is complete for today. TIP will not add unrelated work just to fill the requested time.`;
  } else if(focusedTIP9&&!adaptedFromFocus){
    reason=`You chose ${focusLabel}. TIP selected the work inside that focus using your location, progression and recent practice.`;
    if(suggestionIds.some(id=>focusIds.includes(id)))reason+=` Your Journal also supports this focus.`;
  } else if(adaptedFromFocus){
    reason=`${focusLabel} is not available in ${contextLabel} with the current curriculum, so TIP adapted to useful work you can do here instead.`;
  } else if(adaptedFromPriority&&safeContext!=='anywhere'){
    reason=`${reason} That exact work is not available in ${contextLabel}, so TIP adapted the session to useful work you can do here.`;
  }

  return {
    id:`session_${Date.now()}`,
    title:focusConfig.kind==='auto'?"Today's Session":`${focusLabel} Session`,
    minutes:duration, context:safeContext, contextLabel,
    focusKey:safeFocus, focus:focusConfig.kind==='auto'?(adaptedFromPriority?null:(suggestion?.title||null)):focusLabel,
    reason, adaptedFromPriority, adaptedFromFocus,
    blocks, estimated:blocks.reduce((sum,b)=>sum+b.estimate,0)
  };
}
