import { LEGACY_LIBRARY_ITEMS, LEGACY_LIBRARY_REPORT } from './legacy-library-data.js';
import { SESSION_FOCUS } from './catalog.js';
import { TIP9_PRACTICES } from '../tip9/tip9-data.js';
import { TIP7_DAYS } from '../tip7/tip7-data.js';

export const TIP_LIBRARY_DIMENSIONS=['Swing','Skill','Stretch','Strength'];

const normalize=value=>String(value||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const slug=value=>normalize(value).replace(/\s+/g,'-');
const DIMENSION_ORDER=new Map(TIP_LIBRARY_DIMENSIONS.map((d,i)=>[d,i]));
const CONTEXT_LABELS={range:'Range',bay:'Hitting Bay',green:'Putting Green',short:'Short Game',noball:'Home / No Ball'};

function tip9FocusKeys(id){
  return Object.entries(SESSION_FOCUS).filter(([,focus])=>focus.practiceIds?.includes(id)).map(([key])=>key);
}

function nativeTIP9(){
  return TIP9_PRACTICES.map(practice=>({
    id:`v3:tip9:${practice.id}`,
    nativeId:practice.id,
    kind:'tip9',
    title:practice.name,
    dimension:practice.type==='SWING'?'Swing':'Skill',
    skill:practice.name,
    area:'TIP9',
    summary:practice.desc,
    purpose:practice.desc,
    locations:practice.contexts.map(c=>CONTEXT_LABELS[c]||c),
    contexts:[...practice.contexts],
    equipment:practice.need?[practice.need]:[],
    duration:0,
    dose:{balls:9},
    instructions:practice.levels?.[0]?.[0]?[practice.levels[0][0]]:[],
    success:practice.levels?.[0]?.[1]?[practice.levels[0][1]]:[],
    easier:[],harder:[],notice:[],coachNote:'',journalPrompt:'',safety:[],
    focusKeys:tip9FocusKeys(practice.id),
    familyIds:[practice.id],
    source:'v3-tip9'
  }));
}

function movementDimension(day,exercise){
  if(day.dimension==='STRETCH') return 'Stretch';
  if(day.dimension==='STRENGTH') return 'Strength';
  if(/^STRENGTH\b/i.test(exercise.cue||'')) return 'Strength';
  return 'Stretch';
}

function nativeTIP7Movements(){
  const map=new Map();
  for(const day of TIP7_DAYS){
    for(const exercise of day.exercises||[]){
      const key=normalize(exercise.name);
      const dimension=movementDimension(day,exercise);
      const existing=map.get(key);
      if(existing){
        existing.tip7Days.push(day.day);
        if(!existing.dimensionsSeen.includes(dimension)) existing.dimensionsSeen.push(dimension);
        continue;
      }
      map.set(key,{
        id:`v3:movement:${slug(exercise.name)}`,
        nativeId:exercise.name,
        kind:'movement',
        title:exercise.name,
        dimension,
        dimensionsSeen:[dimension],
        skill:day.theme||'',
        area:'Body',
        summary:exercise.cue||day.purpose||'',
        purpose:day.purpose||'',
        locations:['Home','Anywhere'],
        contexts:['noball'],
        equipment:[],
        duration:.5,
        dose:{seconds:30},
        instructions:exercise.how?[exercise.how]:[],
        success:exercise.cue?[exercise.cue]:[],
        easier:[],harder:[],notice:[],coachNote:exercise.cue||'',journalPrompt:'',safety:[],
        focusKeys:['body'],familyIds:[],source:'v3-tip7',tip7Days:[day.day]
      });
    }
  }
  return [...map.values()];
}

const legacyTitles=new Set(LEGACY_LIBRARY_ITEMS.map(item=>normalize(item.title)));
const tip9Items=nativeTIP9();
const tip7Items=nativeTIP7Movements().filter(item=>!legacyTitles.has(normalize(item.title)));

export const TIP_LIBRARY_ITEMS=[...LEGACY_LIBRARY_ITEMS,...tip9Items,...tip7Items].sort((a,b)=>{
  const dimension=(DIMENSION_ORDER.get(a.dimension)??99)-(DIMENSION_ORDER.get(b.dimension)??99);
  return dimension||String(a.title).localeCompare(String(b.title));
});

export const TIP_LIBRARY_REPORT={
  legacy:LEGACY_LIBRARY_REPORT,
  legacyPracticeReady:LEGACY_LIBRARY_ITEMS.length,
  nativeTIP9:tip9Items.length,
  nativeTIP7Unique:nativeTIP7Movements().length,
  nativeTIP7Added:tip7Items.length,
  exactTIP7Deduplicated:nativeTIP7Movements().length-tip7Items.length,
  total:TIP_LIBRARY_ITEMS.length,
  byDimension:Object.fromEntries(TIP_LIBRARY_DIMENSIONS.map(d=>[d,TIP_LIBRARY_ITEMS.filter(item=>item.dimension===d).length]))
};

export function getTIPLibraryItem(id){return TIP_LIBRARY_ITEMS.find(item=>item.id===id)||null;}

export function getTIPLibraryCounts(){return {...TIP_LIBRARY_REPORT.byDimension,All:TIP_LIBRARY_REPORT.total};}

function contextMatches(item,context){
  if(!context) return true;
  if(item.contexts?.includes(context)) return true;
  const locations=(item.locations||[]).map(normalize);
  if(context==='range') return locations.some(x=>/range|practice facility/.test(x));
  if(context==='bay') return locations.some(x=>/bay|simulator|indoor|net/.test(x));
  if(context==='green') return locations.some(x=>/putting green|green/.test(x));
  if(context==='short') return locations.some(x=>/short game|bunker|chipping|pitching/.test(x));
  if(context==='noball') return locations.some(x=>/home|no ball|anywhere/.test(x))||['Stretch','Strength'].includes(item.dimension);
  return true;
}

export function filterTIPLibrary({dimension='All',context=null,query=''}={}){
  const q=normalize(query);
  return TIP_LIBRARY_ITEMS.filter(item=>
    (dimension==='All'||item.dimension===dimension)&&contextMatches(item,context)&&(!q||normalize([item.title,item.skill,item.area,item.summary,...(item.focusKeys||[])].join(' ')).includes(q))
  );
}
