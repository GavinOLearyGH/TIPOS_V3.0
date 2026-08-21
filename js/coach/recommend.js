import { TIPState } from '../core/storage.js';
import { getTIPMemory } from './memory.js';
import { signalsFromEntry } from './signals.js';
import { TIP_TOPICS } from './topics.js';
import { getTIP7Status } from '../tip7/tip7-engine.js';
import { TIP9_PRACTICES } from '../tip9/tip9-data.js';
import { getTIP9PracticeState } from '../tip9/tip9-engine.js';

export const TIP_SUGGEST_VERSION = '3.10-2';
const ACTION_COOLDOWN_HOURS = 24;

const TOPIC_TO_TIP9 = {
  teeControl:['SK06'],
  approachPlay:['SK08','SK11'],
  wedgeDistance:['SK07','SK15'],
  puttingStartLine:['SK01','SK03','SK05'],
  puttingPace:['SK02','SK04'],
  shortGame:['SK14','SK15','SK16','SK17','SK18'],
  courseManagement:['SK11','SK13'],
  contact:['SW01','SW03'],
  tempo:['SW02','SW08'],
  startDirection:['SW04','SW06'],
  lowPoint:['SW03','SW01'],
  faceAwareness:['SW06','SW04'],
  balance:['SW05','SW07'],
  transition:['SW08','SW02'],
  routine:['SK12','SK05'],
  confidence:['SK12']
};

function daysSince(value){
  const time = new Date(value || 0).getTime();
  return time ? Math.max(0,(Date.now()-time)/86400000) : 9999;
}
function hoursSince(value){ return daysSince(value)*24; }

function topicNeedScore(topic){
  if(!topic || !topic.evidence) return -Infinity;
  const negative = Math.max(0,-Number(topic.score||0));
  const confidence = Number(topic.confidence||0)/100;
  const recency = daysSince(topic.lastObserved) <= 14 ? 1 : daysSince(topic.lastObserved) <= 45 ? .8 : .55;
  const trendBonus = topic.trend === 'Sliding' ? 2 : topic.trend === 'Improving' ? -.5 : 0;
  return negative*(.65+.35*confidence)*recency + trendBonus;
}

function topicReinforceScore(topic){
  if(!topic || !topic.evidence || Number(topic.score||0) <= 0) return -Infinity;
  const confidence = Number(topic.confidence||0)/100;
  const recent = daysSince(topic.lastObserved) <= 30 ? 1 : .7;
  return Number(topic.score||0)*(.5+.5*confidence)*recent + (topic.trend === 'Improving' ? 1.5 : 0);
}

function actionableTopic(topic){
  const group = TIP_TOPICS[topic?.key]?.group;
  return group === 'body' || Boolean(TOPIC_TO_TIP9[topic?.key]);
}

function rankedSelections(memory){
  const known = Object.values(memory?.topics || {}).filter(t => t.evidence > 0 && TIP_TOPICS[t.key] && actionableTopic(t));
  const needs = known.filter(t => t.score < 0)
    .map(t => ({mode:'improve',topic:t,score:topicNeedScore(t)}))
    .filter(x => x.score >= .75)
    .sort((a,b)=>b.score-a.score);
  const strengths = known.filter(t => t.score > 0 && Boolean(TOPIC_TO_TIP9[t.key]))
    .map(t => ({mode:'reinforce',topic:t,score:topicReinforceScore(t)}))
    .filter(x => x.score >= 1.5)
    .sort((a,b)=>b.score-a.score);
  return [...needs,...strengths];
}

function recentPracticePenalty(id,state){
  const recent = state.tip9.recent || [];
  const index = recent.findIndex(x => (typeof x === 'string' ? x : x.id) === id);
  return index < 0 ? 0 : (8-index)*3;
}

function journalHasNewExternalNeed(topicKey,lastAt,state){
  const last = new Date(lastAt || 0).getTime();
  if(!last) return false;
  return (state.journal || []).some(entry => {
    const at = new Date(entry.createdAt || 0).getTime();
    if(!at || at <= last || entry.type === 'tip9') return false;
    return signalsFromEntry(entry).some(signal => signal.topic === topicKey && signal.signal < 0);
  });
}

function practiceEligible(practiceId,topic,state){
  const ps = getTIP9PracticeState(practiceId,state);
  if(!ps.lastAt) return true;
  if(hoursSince(ps.lastAt) >= ACTION_COOLDOWN_HOURS) return true;
  return journalHasNewExternalNeed(topic?.key,ps.lastAt,state);
}

function chooseTIP9ForTopic(topic,state){
  const ids = TOPIC_TO_TIP9[topic.key] || [];
  const candidates = ids
    .map(id => TIP9_PRACTICES.find(p=>p.id===id))
    .filter(Boolean)
    .filter(practice => practiceEligible(practice.id,topic,state));
  if(!candidates.length) return null;
  return candidates.map((practice,index)=>{
    const ps = getTIP9PracticeState(practice.id,state);
    const score = (ps.completions||0)*2 + recentPracticePenalty(practice.id,state) + (ps.level-1)*.5 + index*.01;
    return {practice,score};
  }).sort((a,b)=>a.score-b.score)[0].practice;
}

function labelFor(topic){ return TIP_TOPICS[topic?.key]?.label || topic?.label || 'Your Golf'; }

function bodySuggestion(selection,state){
  const tip7 = getTIP7Status();
  if(!tip7.canStart || !tip7.nextDay) return null;
  return {
    version:TIP_SUGGEST_VERSION,
    kind:'tip7',
    mode:selection?.mode || 'maintain',
    topic:selection?.topic?.key || tip7.nextDay.topics?.[0] || 'mobility',
    title:tip7.nextDay.theme,
    label:`TIP7 · Day ${tip7.nextDay.day}`,
    reason: selection?.topic
      ? `Your recent Journal points to ${labelFor(selection.topic).toLowerCase()}. Today’s TIP7 keeps the body work moving without breaking the Foundation sequence.`
      : 'A short body session keeps the habit moving while TIP continues learning your golf.',
    action:{ type:'tip7' }
  };
}

function gameSuggestion(selection,state){
  const practice = chooseTIP9ForTopic(selection.topic,state);
  if(!practice) return null;
  const ps = getTIP9PracticeState(practice.id,state);
  return {
    version:TIP_SUGGEST_VERSION,
    kind:'tip9',
    mode:selection.mode,
    topic:selection.topic.key,
    title:practice.name,
    label:`TIP9 · ${practice.type} · Level ${ps.level}`,
    reason: selection.mode === 'improve'
      ? `Your recent Journal keeps pointing to ${labelFor(selection.topic).toLowerCase()}. This is the best available TIP9 to work on it next.`
      : `${labelFor(selection.topic)} has been showing up positively. Reinforce it with one focused TIP9 rather than adding a new problem to solve.`,
    action:{ type:'tip9', practiceId:practice.id, contexts:[...practice.contexts] }
  };
}

function firstEligibleLearningPractice(state,memory){
  const preferred = TIP9_PRACTICES.find(p=>p.id==='SW02');
  const ordered = preferred ? [preferred,...TIP9_PRACTICES.filter(p=>p.id!==preferred.id)] : TIP9_PRACTICES;
  return ordered.find(practice => {
    const topics = Object.values(memory?.topics || {}).filter(t => (TOPIC_TO_TIP9[t.key]||[]).includes(practice.id));
    const topic = topics[0] || {key:null};
    return practiceEligible(practice.id,topic,state);
  }) || null;
}

function learningSuggestion(state,memory){
  const tip7 = getTIP7Status();
  if(tip7.canStart && Number(state.tip7.lifetime||0) <= Number(state.tip9.lifetime||0)) {
    return bodySuggestion(null,state);
  }
  const practice = firstEligibleLearningPractice(state,memory);
  if(!practice) return null;
  const ps = getTIP9PracticeState(practice.id,state);
  return {
    version:TIP_SUGGEST_VERSION,
    kind:'tip9', mode:'learn', topic:'tempo', title:practice.name,
    label:`TIP9 · ${practice.type} · Level ${ps.level}`,
    reason:'TIP is still building evidence. A simple, repeatable TIP9 gives the Journal something useful to learn from without pretending there is already a clear weakness.',
    action:{ type:'tip9', practiceId:practice.id, contexts:[...practice.contexts] }
  };
}

export function getTIPSuggestion(){
  const state = TIPState.get();
  const memory = getTIPMemory();
  const selections = rankedSelections(memory);

  if(selections.length){
    for(const selection of selections){
      const def = TIP_TOPICS[selection.topic.key];
      const suggestion = def?.group === 'body'
        ? bodySuggestion(selection,state)
        : TOPIC_TO_TIP9[selection.topic.key]
          ? gameSuggestion(selection,state)
          : null;
      if(suggestion) return suggestion;
    }
    return null;
  }
  return learningSuggestion(state,memory);
}

export function suggestionModeLabel(mode){
  return ({improve:'IMPROVE',reinforce:'REINFORCE',maintain:'MAINTAIN',learn:'LEARN'})[mode] || 'TIP SUGGESTS';
}
