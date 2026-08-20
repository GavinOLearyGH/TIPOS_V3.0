export const TIP_MEMORY_VERSION = '3.0-e-1';

export const TIP_TOPICS = {
  teeControl:{ label:'Tee Control', group:'game', dimension:'skill' },
  approachPlay:{ label:'Approach Play', group:'game', dimension:'skill' },
  wedgeDistance:{ label:'Wedge Distance', group:'game', dimension:'skill' },
  puttingStartLine:{ label:'Putting Start Line', group:'game', dimension:'skill' },
  puttingPace:{ label:'Putting Pace', group:'game', dimension:'skill' },
  shortGame:{ label:'Short Game', group:'game', dimension:'skill' },
  courseManagement:{ label:'Course Management', group:'game', dimension:'skill' },
  contact:{ label:'Contact', group:'game', dimension:'swing' },
  tempo:{ label:'Tempo', group:'game', dimension:'swing' },
  startDirection:{ label:'Start Direction', group:'game', dimension:'swing' },
  lowPoint:{ label:'Low Point', group:'game', dimension:'swing' },
  faceAwareness:{ label:'Face Awareness', group:'game', dimension:'swing' },
  balance:{ label:'Balance', group:'game', dimension:'swing' },
  transition:{ label:'Transition', group:'game', dimension:'swing' },
  mobility:{ label:'Mobility', group:'body', dimension:'stretch' },
  rotation:{ label:'Rotation', group:'body', dimension:'stretch' },
  hips:{ label:'Hips', group:'body', dimension:'stretch' },
  thoracic:{ label:'Thoracic Rotation', group:'body', dimension:'stretch' },
  shoulders:{ label:'Shoulders', group:'body', dimension:'stretch' },
  stability:{ label:'Stability', group:'body', dimension:'strength' },
  core:{ label:'Core', group:'body', dimension:'strength' },
  lowerBody:{ label:'Lower Body', group:'body', dimension:'strength' },
  golfPosture:{ label:'Golf Posture', group:'body', dimension:'strength' },
  routine:{ label:'Routine', group:'mind', dimension:'mind' },
  confidence:{ label:'Confidence', group:'mind', dimension:'mind' },
  equipment:{ label:'Equipment', group:'equipment', dimension:'equipment' }
};

export function normalizeTopic(topic='') {
  const raw=String(topic||'').trim();
  if (TIP_TOPICS[raw]) return raw;
  const key=raw.toLowerCase().replace(/[^a-z0-9]+/g,'');
  const aliases={
    teecontrol:'teeControl',driver:'teeControl',fairways:'teeControl',
    approach:'approachPlay',approachplay:'approachPlay',gir:'approachPlay',
    wedgedistance:'wedgeDistance',distancecontrol:'wedgeDistance',
    puttingstartline:'puttingStartLine',startlineputting:'puttingStartLine',
    puttingpace:'puttingPace',lagputting:'puttingPace',speedcontrol:'puttingPace',
    shortgame:'shortGame',bunker:'shortGame',chipping:'shortGame',pitching:'shortGame',
    coursemanagement:'courseManagement',recovery:'courseManagement',
    contact:'contact',strike:'contact',
    tempo:'tempo',rhythm:'tempo',
    startdirection:'startDirection',startline:'startDirection',
    lowpoint:'lowPoint',
    faceawareness:'faceAwareness',facecontrol:'faceAwareness',
    balance:'balance',finish:'balance',
    transition:'transition',
    mobility:'mobility',stretch:'mobility',
    rotation:'rotation',turn:'rotation',
    hips:'hips',hip:'hips',
    thoracic:'thoracic',
    shoulders:'shoulders',shoulder:'shoulders',
    stability:'stability',strength:'stability',
    core:'core',
    lowerbody:'lowerBody',legs:'lowerBody',
    golfposture:'golfPosture',posture:'golfPosture',
    routine:'routine',mental:'routine',
    confidence:'confidence',
    equipment:'equipment',builder:'equipment'
  };
  return aliases[key] || null;
}

export function defaultTopicMemory(key) {
  const def=TIP_TOPICS[key] || {label:key,group:'other',dimension:'other'};
  return { key,label:def.label,group:def.group,dimension:def.dimension,evidence:0,positive:0,negative:0,score:0,confidence:0,trend:'Learning',state:'Learning',lastObserved:null,history:[] };
}
