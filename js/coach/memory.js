import { TIPState } from '../core/storage.js';
import { TIP_MEMORY_VERSION, TIP_TOPICS, defaultTopicMemory } from './topics.js';
import { extractJournalSignals } from './signals.js';

function clamp(n,min,max){return Math.max(min,Math.min(max,n));}

function confidenceFor(evidence,score){
  return Math.round(clamp(8 + evidence*8 + Math.abs(score)*2,0,96));
}

function recencyFactor(at){
  const time=new Date(at||0).getTime();
  if(!time) return .35;
  const days=Math.max(0,(Date.now()-time)/86400000);
  if(days<=14) return 1;
  if(days<=45) return .8;
  if(days<=120) return .6;
  if(days<=365) return .45;
  return .3;
}

function trendFromHistory(history=[]){
  const recent=history.slice(-6);
  if(recent.length<3) return 'Learning';
  const weighted=recent.reduce((sum,item)=>sum + item.signal*item.effectiveWeight,0);
  if(weighted>=3.5) return 'Improving';
  if(weighted<=-3.5) return 'Sliding';
  return 'Stable';
}

function stateFromTopic(topic){
  if(topic.evidence<2) return 'Learning';
  const ratio=topic.score/Math.max(1,topic.evidence);
  if(ratio>=.55 && topic.confidence>=75) return 'Established';
  if(ratio>=.35) return 'Reliable';
  if(ratio>=.10) return 'Growing';
  if(ratio>-.10) return 'Developing';
  if(ratio>-.35) return 'Needs Attention';
  return 'Priority';
}

export function buildMemoryFromJournal(journal=[]){
  const topics={};
  for(const key of Object.keys(TIP_TOPICS)) topics[key]=defaultTopicMemory(key);
  const signals=extractJournalSignals(journal);

  for(const signal of signals){
    const topic=topics[signal.topic] || defaultTopicMemory(signal.topic);
    const rawWeight=Math.max(1,Number(signal.weight)||1);
    const effectiveWeight=rawWeight*recencyFactor(signal.at);
    const protectedRead=signal.signal<0 && topic.confidence>=70 && topic.score>4;
    const impactWeight=protectedRead?effectiveWeight*.45:effectiveWeight;
    const impact=signal.signal>=0?impactWeight:-impactWeight;

    topic.evidence+=effectiveWeight;
    topic.score=clamp(topic.score+impact,-100,100);
    if(signal.signal>=0) topic.positive+=effectiveWeight; else topic.negative+=effectiveWeight;
    topic.lastObserved=signal.at || null;
    topic.history.push({at:signal.at,signal:signal.signal,weight:rawWeight,effectiveWeight,source:signal.source,note:signal.note,ref:signal.ref,protectedRead});
    topic.history=topic.history.slice(-24);
    topic.confidence=confidenceFor(topic.evidence,topic.score);
    topic.trend=trendFromHistory(topic.history);
    topic.state=stateFromTopic(topic);
    topics[signal.topic]=topic;
  }

  for(const topic of Object.values(topics)){
    topic.evidence=Number(topic.evidence.toFixed(2));
    topic.positive=Number(topic.positive.toFixed(2));
    topic.negative=Number(topic.negative.toFixed(2));
    topic.score=Number(topic.score.toFixed(2));
  }

  const known=Object.values(topics).filter(t=>t.evidence>0);
  const needs=known.filter(t=>t.score<0).sort((a,b)=>(b.confidence-a.confidence)||(a.score-b.score));
  const strengths=known.filter(t=>t.score>0).sort((a,b)=>(b.confidence-a.confidence)||(b.score-a.score));
  const recentSignals=signals.slice(-12).reverse();

  return {
    version:TIP_MEMORY_VERSION,
    topics,
    summary:{
      known:known.length,
      totalEvidence:Number(known.reduce((sum,t)=>sum+t.evidence,0).toFixed(2)),
      priority:needs[0]?.key || null,
      strength:strengths[0]?.key || null,
      recentSignals
    },
    updatedAt:new Date().toISOString()
  };
}

function stableMemoryShape(memory){
  return JSON.stringify({version:memory.version,topics:memory.topics,summary:memory.summary});
}

export function rebuildTIPMemory(){
  const state=TIPState.get();
  const next=buildMemoryFromJournal(state.journal||[]);
  if(stableMemoryShape(next)===stableMemoryShape(state.memory||{})) return state.memory;
  TIPState.update(draft=>{draft.memory=next;return draft;},'memory:rebuild');
  return next;
}

export function getTIPMemory(){
  const memory=TIPState.get().memory;
  if(memory?.version!==TIP_MEMORY_VERSION) return rebuildTIPMemory();
  return memory;
}

export function memoryConfidenceCopy(memory=getTIPMemory()){
  const total=Number(memory?.summary?.totalEvidence||0);
  if(total<1) return "I'm learning your golf.";
  if(total<6) return "I'm starting to see the first signals.";
  if(total<18) return "I'm starting to see patterns.";
  return "I've seen enough to coach with more confidence.";
}
