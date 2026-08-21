// V3.11 coaching catalog layer.
//
// The execution engines stay intentionally small: TIP7 is a program and TIP9
// is the nine-ball Swing + Skill format. This layer describes golfer-facing
// coaching lanes above those execution primitives so the underlying curriculum
// can grow without turning the UI into a drill catalog.

export const SESSION_FOCUS = {
  auto:{label:'Let TIP Decide',short:'TIP chooses from your Journal and recent work',practiceIds:[],kind:'auto'},
  tee:{label:'Tee Game',short:'Playable starts and predictable tee shots',practiceIds:['SK06','SW04','SW06','SK10','SK12'],kind:'tip9'},
  approach:{label:'Approach',short:'Contact, start window and useful dispersion',practiceIds:['SK08','SK11','SW01','SW03','SW04','SK09'],kind:'tip9'},
  wedges:{label:'Wedges',short:'Scoring carries and partial-shot control',practiceIds:['SK07','SK15','SK11','SW01'],kind:'tip9'},
  short:{label:'Short Game',short:'Chip, pitch, bunker and up-and-down skills',practiceIds:['SK14','SK15','SK16','SK17','SK18'],kind:'tip9'},
  putting:{label:'Putting',short:'Start line, pace, reads and scoring putts',practiceIds:['SK01','SK02','SK03','SK04','SK05'],kind:'tip9'},
  swing:{label:'Swing',short:'Contact, motion and predictable delivery',practiceIds:['SW01','SW02','SW03','SW04','SW05','SW06','SW07','SW08'],kind:'tip9'},
  body:{label:'Body',short:'Mobility, strength and stability',practiceIds:[],kind:'tip7'}
};

export function getSessionFocus(key='auto') {
  return SESSION_FOCUS[key] || SESSION_FOCUS.auto;
}

export function focusPracticeIds(key='auto') {
  return [...getSessionFocus(key).practiceIds];
}
