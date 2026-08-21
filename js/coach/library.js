import { LEGACY_LIBRARY_ITEMS, LEGACY_LIBRARY_REPORT } from './legacy-library-data.js';
import { TIP7_DAYS } from '../tip7/tip7-data.js';

export const TIP_LIBRARY_DIMENSIONS=['Swing','Skill','Stretch','Strength'];

const normalize=value=>String(value||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const slug=value=>normalize(value).replace(/\s+/g,'-');
const DIMENSION_ORDER=new Map(TIP_LIBRARY_DIMENSIONS.map((d,i)=>[d,i]));

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

// The golfer-facing library is deliberately leaf-level curriculum only.
// TIP9 family IDs, focus relationships and recommendation taxonomy remain internal
// in the coaching engine. They are not browse categories and are never rendered here.
const legacyTitles=new Set(LEGACY_LIBRARY_ITEMS.map(item=>normalize(item.title)));
const allTIP7Movements=nativeTIP7Movements();
const tip7Items=allTIP7Movements.filter(item=>!legacyTitles.has(normalize(item.title)));

export const TIP_LIBRARY_ITEMS=[...LEGACY_LIBRARY_ITEMS,...tip7Items].sort((a,b)=>{
  const dimension=(DIMENSION_ORDER.get(a.dimension)??99)-(DIMENSION_ORDER.get(b.dimension)??99);
  return dimension||String(a.title).localeCompare(String(b.title));
});

export const TIP_LIBRARY_REPORT={
  legacy:LEGACY_LIBRARY_REPORT,
  sourceLessons:LEGACY_LIBRARY_REPORT.sourceLessonCount||475,
  legacyPracticeReady:LEGACY_LIBRARY_ITEMS.length,
  legacyExcludedByV2Gate:LEGACY_LIBRARY_REPORT.excludedCount??Math.max(0,(LEGACY_LIBRARY_REPORT.sourceLessonCount||0)-LEGACY_LIBRARY_ITEMS.length),
  v2ReadyVisibleCoverage:1,
  sourceLessonCoverage:(LEGACY_LIBRARY_REPORT.sourceLessonCount||0)?LEGACY_LIBRARY_ITEMS.length/LEGACY_LIBRARY_REPORT.sourceLessonCount:0,
  nativeTIP7Unique:allTIP7Movements.length,
  nativeTIP7Added:tip7Items.length,
  exactTIP7Deduplicated:allTIP7Movements.length-tip7Items.length,
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
    (dimension==='All'||item.dimension===dimension)&&contextMatches(item,context)&&(!q||normalize([item.title,item.skill,item.area,item.summary].join(' ')).includes(q))
  );
}
