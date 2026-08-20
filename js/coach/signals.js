import { normalizeTopic } from './topics.js';

const POSITIVE=/\b(good|great|solid|better|improved|working|confident|comfortable|consistent|looser|strong|felt good|in play|hit well)\b/i;
const NEGATIVE=/\b(bad|poor|worse|struggle|struggled|heavy|thin|fat|short|long|left|right|tight|tighter|hard|missed|inconsistent|penalty|three putt|3 putt|keep working|rushed)\b/i;

const TEXT_RULES=[
  [/\b(driver|tee ball|fairway|off the tee)\b/i,'teeControl'],
  [/\b(approach|iron|gir|green in regulation)\b/i,'approachPlay'],
  [/\b(wedge|yardage|distance control)\b/i,'wedgeDistance'],
  [/\b(start line|starting line)\b/i,'puttingStartLine'],
  [/\b(lag|pace|speed control|three putt|3 putt)\b/i,'puttingPace'],
  [/\b(chip|pitch|bunker|short game|up.?and.?down)\b/i,'shortGame'],
  [/\b(recovery|course management|decision|hero shot)\b/i,'courseManagement'],
  [/\b(contact|strike|heavy|fat|thin|toe|heel)\b/i,'contact'],
  [/\b(tempo|rhythm|smooth|rushed)\b/i,'tempo'],
  [/\b(start direction|start window)\b/i,'startDirection'],
  [/\b(low point|divot)\b/i,'lowPoint'],
  [/\b(face|clubface)\b/i,'faceAwareness'],
  [/\b(balance|finish|stumble)\b/i,'balance'],
  [/\b(transition|from the top)\b/i,'transition'],
  [/\b(mobility|loose|looser|tight|tighter|stretch)\b/i,'mobility'],
  [/\b(rotation|rotate|turn)\b/i,'rotation'],
  [/\b(hip|hips)\b/i,'hips'],
  [/\b(thoracic|t.?spine)\b/i,'thoracic'],
  [/\b(shoulder|shoulders)\b/i,'shoulders'],
  [/\b(stability|stable)\b/i,'stability'],
  [/\b(core)\b/i,'core'],
  [/\b(lower body|legs|glutes)\b/i,'lowerBody'],
  [/\b(posture)\b/i,'golfPosture'],
  [/\b(routine|focus|mental|commit|committed)\b/i,'routine'],
  [/\b(confidence|confident)\b/i,'confidence'],
  [/\b(equipment|club|shaft|grip|loft|lie|putter|driver change)\b/i,'equipment']
];

function sentimentFor(text=''){
  const positive=POSITIVE.test(text), negative=NEGATIVE.test(text);
  if(positive&&!negative) return 1;
  if(negative&&!positive) return -1;
  return 0;
}

function pushSignal(list,topic,signal,weight,source,note,entry){
  const key=normalizeTopic(topic);
  if(!key) return;
  list.push({topic:key,signal:signal>=0?1:-1,weight:Math.max(1,Number(weight)||1),source,note:String(note||'').slice(0,180),ref:entry.id,at:entry.createdAt});
}

function resultSignals(entry,list){
  if(entry.type==='tip9'){
    const topic=(entry.topics||[])[0];
    if(entry.result?.score!=null){
      const score=Number(entry.result.score);
      pushSignal(list,topic,score>=7?1:-1,score>=7?3:2,'tip9-score',`${score}/9`,entry);
    } else if(entry.result?.feel){
      pushSignal(list,topic,/felt good/i.test(entry.result.feel)?1:-1,2,'tip9-feel',entry.result.feel,entry);
    }
  }
  if(entry.type==='tip7'){
    const feel=String(entry.result?.feel||'');
    for(const topic of entry.topics||[]){
      if(/looser|good|strong|right/i.test(feel)) pushSignal(list,topic,1,2,'tip7-feel',feel,entry);
      else if(/tighter|tired|hard/i.test(feel)) pushSignal(list,topic,-1,2,'tip7-feel',feel,entry);
      else pushSignal(list,topic,1,1,'tip7-complete','Completed TIP7',entry);
    }
  }
}

function metricSignals(entry,list){
  if(entry.type!=='round') return;
  const m=entry.metrics||{};
  if(Number.isFinite(Number(m.fairways))){
    const fw=Number(m.fairways);
    if(fw>=10) pushSignal(list,'teeControl',1,2,'round-metric',`${fw} fairways`,entry);
    else if(fw<=6) pushSignal(list,'teeControl',-1,2,'round-metric',`${fw} fairways`,entry);
  }
  if(Number.isFinite(Number(m.penalties))){
    const p=Number(m.penalties);
    if(p===0) pushSignal(list,'courseManagement',1,1,'round-metric','0 penalties',entry);
    else if(p>=2) pushSignal(list,'courseManagement',-1,2,'round-metric',`${p} penalties`,entry);
  }
  if(Number.isFinite(Number(m.gir))){
    const gir=Number(m.gir);
    if(gir>=9) pushSignal(list,'approachPlay',1,2,'round-metric',`${gir} GIR`,entry);
    else if(gir<=5) pushSignal(list,'approachPlay',-1,2,'round-metric',`${gir} GIR`,entry);
  }
  if(Number.isFinite(Number(m.putts))){
    const p=Number(m.putts);
    if(p<=30) pushSignal(list,'puttingPace',1,1,'round-metric',`${p} putts`,entry);
    else if(p>=36) pushSignal(list,'puttingPace',-1,1,'round-metric',`${p} putts`,entry);
  }
}

export function signalsFromEntry(entry){
  const list=[];
  const note=String(entry.reflection?.text||'');
  const explicit=(entry.topics||[]).map(normalizeTopic).filter(Boolean);
  const clauses=note.split(/[.!?;\n]+|\bbut\b|\bwhile\b|\bhowever\b/i).map(x=>x.trim()).filter(Boolean);

  for(const clause of clauses){
    const signal=sentimentFor(clause);
    if(!signal) continue;
    for(const [rule,topic] of TEXT_RULES){
      if(rule.test(clause)) pushSignal(list,topic,signal,1,'journal-text',clause,entry);
    }
  }

  const wholeSentiment=sentimentFor(note);
  if(wholeSentiment){
    for(const topic of explicit) pushSignal(list,topic,wholeSentiment,2,'explicit-topic',note,entry);
  }

  resultSignals(entry,list);
  metricSignals(entry,list);

  const dedup=new Map();
  for(const s of list){
    const key=`${s.topic}|${s.signal}|${s.source}`;
    const prev=dedup.get(key);
    if(!prev||s.weight>prev.weight) dedup.set(key,s);
  }
  return [...dedup.values()];
}

export function extractJournalSignals(journal=[]){
  return journal.flatMap(signalsFromEntry).sort((a,b)=>new Date(a.at)-new Date(b.at));
}
