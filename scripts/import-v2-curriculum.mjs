import fs from 'node:fs/promises';
import path from 'node:path';

const SOURCE_URL='https://raw.githubusercontent.com/GavinOLearyGH/TIP_OS_v2.9.8.5_PWA/main/data/tip-curriculum-v1.js';
const OUT_DIR=path.resolve('generated');
const PRODUCTION_FILE=path.resolve('js/coach/legacy-library-data.js');
const FOUNDATIONS=['Swing','Skill','Stretch','Strength'];
const FOUNDATION_SET=new Set(FOUNDATIONS);

const normalize=value=>String(value||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const cleanList=value=>Array.isArray(value)?value.filter(Boolean):[];

async function readSource(){
  const response=await fetch(SOURCE_URL);
  if(!response.ok) throw new Error(`Could not fetch V2 curriculum: ${response.status}`);
  const text=await response.text();
  const prefix='window.TIP_CURRICULUM = ';
  const start=text.indexOf(prefix);
  if(start<0) throw new Error('TIP_CURRICULUM assignment not found');
  let json=text.slice(start+prefix.length).trim();
  if(json.endsWith(';')) json=json.slice(0,-1);
  return JSON.parse(json);
}

function hiddenFocusKeys(lesson){
  const hay=normalize([lesson.foundation,lesson.skill,lesson.area,lesson.title,...cleanList(lesson.planTags)].join(' '));
  const keys=new Set();
  if(lesson.foundation==='Swing') keys.add('swing');
  if(lesson.foundation==='Stretch'||lesson.foundation==='Strength') keys.add('body');
  if(/putt|green read/.test(hay)) keys.add('putting');
  if(/chip|pitch|bunker|short game|up down|landing spot/.test(hay)) keys.add('short');
  if(/wedge|partial/.test(hay)) keys.add('wedges');
  if(/driver|tee ball|off tee|tee shot/.test(hay)) keys.add('tee');
  if(/approach|iron|center green|green strategy|distance control|club selection/.test(hay)) keys.add('approach');
  return [...keys];
}

function hiddenFamilyIds(lesson){
  const hay=normalize([lesson.skill,lesson.area,lesson.title,...cleanList(lesson.planTags)].join(' '));
  const ids=new Set();
  if(lesson.foundation==='Swing'){
    if(/tempo|rhythm/.test(hay)) ids.add('SW02');
    if(/centered contact|strike|contact/.test(hay)) ids.add('SW01');
    if(/low point/.test(hay)) ids.add('SW03');
    if(/start direction|alignment|start line/.test(hay)) ids.add('SW04');
    if(/balance|finish/.test(hay)) ids.add('SW05');
    if(/clubface|face control|face awareness/.test(hay)) ids.add('SW06');
    if(/centered turn|turn|pivot/.test(hay)) ids.add('SW07');
    if(/transition|sequence/.test(hay)) ids.add('SW08');
  }
  if(lesson.foundation==='Skill'){
    if(/putting start line|start line/.test(hay)&&/putt/.test(hay)) ids.add('SK01');
    if(/lag putting|putting pace|distance control/.test(hay)&&/putt/.test(hay)) ids.add('SK02');
    if(/short putt/.test(hay)) ids.add('SK03');
    if(/speed ladder/.test(hay)) ids.add('SK04');
    if(/green reading|read commit/.test(hay)) ids.add('SK05');
    if(/playable tee ball|tee ball/.test(hay)) ids.add('SK06');
    if(/wedge distance|distance matrix|partial wedge/.test(hay)) ids.add('SK07');
    if(/approach window|approach start line|approach distance/.test(hay)) ids.add('SK08');
    if(/trajectory/.test(hay)) ids.add('SK09');
    if(/curve/.test(hay)) ids.add('SK10');
    if(/club selection/.test(hay)) ids.add('SK11');
    if(/pressure/.test(hay)) ids.add('SK12');
    if(/recovery|trouble/.test(hay)) ids.add('SK13');
    if(/chip/.test(hay)) ids.add('SK14');
    if(/pitch/.test(hay)) ids.add('SK15');
    if(/bunker/.test(hay)) ids.add('SK16');
    if(/landing spot/.test(hay)) ids.add('SK17');
    if(/up down/.test(hay)) ids.add('SK18');
  }
  return [...ids];
}

function compactLesson(lesson){
  const assignment=lesson.practiceAssignment||{};
  const view=lesson.practiceView||{};
  const instructions=cleanList(lesson.instructions?.length?lesson.instructions:(assignment.doThis||view.doThis));
  const success=cleanList(lesson.successStandard?.length?lesson.successStandard:(assignment.winCondition||view.winCondition));
  return {
    id:`v2:${lesson.lessonId}`,
    legacyId:lesson.lessonId,
    title:lesson.title,
    dimension:lesson.foundation,
    skill:lesson.skill||'',
    area:lesson.area||'',
    summary:lesson.summary||lesson.purpose||'',
    purpose:lesson.purpose||'',
    locations:cleanList(lesson.location),
    equipment:cleanList(lesson.equipment),
    duration:Number(lesson.durationMinutes||assignment.dose?.totalMinutes||view.dose?.totalMinutes||0),
    dose:assignment.dose||view.dose||null,
    instructions,
    success,
    easier:cleanList(lesson.makeItEasier?.length?lesson.makeItEasier:(assignment.makeItEasier||view.makeItEasier)),
    harder:cleanList(lesson.makeItHarder?.length?lesson.makeItHarder:(assignment.makeItHarder||view.makeItHarder)),
    notice:cleanList(lesson.whatToNotice),
    coachNote:lesson.tipNote||assignment.coachConnection||view.coachNote||'',
    journalPrompt:assignment.journalPrompt||view.journalPrompt||'',
    safety:cleanList(lesson.safety?.length?lesson.safety:(assignment.safety||view.safety)),
    focusKeys:hiddenFocusKeys(lesson),
    familyIds:hiddenFamilyIds(lesson),
    source:'v2.9.8.5'
  };
}

async function currentV3Names(){
  const tip9=await fs.readFile(path.resolve('js/tip9/tip9-data.js'),'utf8');
  const tip7=await fs.readFile(path.resolve('js/tip7/tip7-data.js'),'utf8');
  const tip9Names=[...tip9.matchAll(/A\('(?:SW|SK)\d+'\s*,\s*'(?:SWING|SKILL)'\s*,\s*'([^']+)'/g)].map(m=>m[1]);
  const tip7Names=[...tip7.matchAll(/E\((['"])(.*?)\1\s*,/g)].map(m=>m[2]);
  return {tip9Names:[...new Set(tip9Names)],tip7Names:[...new Set(tip7Names)]};
}

const curriculum=await readSource();
const lessons=Array.isArray(curriculum.lessons)?curriculum.lessons:[];
const eligible=lessons.filter(l=>FOUNDATION_SET.has(l.foundation)&&l.practiceReady===true&&l.libraryVisible!==false);
const compact=eligible.map(compactLesson);
const byDimension=Object.fromEntries(FOUNDATIONS.map(d=>[d,compact.filter(x=>x.dimension===d).length]));
const titles=new Map();
for(const item of compact){
  const key=normalize(item.title);
  if(!titles.has(key)) titles.set(key,[]);
  titles.get(key).push(item.legacyId);
}
const duplicateTitleGroups=[...titles.entries()].filter(([,ids])=>ids.length>1).map(([title,ids])=>({title,ids}));
const native=await currentV3Names();
const legacyTitles=new Set(compact.map(x=>normalize(x.title)));
const exactV3Tip9Overlaps=native.tip9Names.filter(x=>legacyTitles.has(normalize(x)));
const exactV3Tip7Overlaps=native.tip7Names.filter(x=>legacyTitles.has(normalize(x)));
const report={
  sourceVersion:curriculum.version||'',
  sourceRelease:curriculum.release||'',
  sourceLessonCount:Number(curriculum.lessonCount||lessons.length),
  parsedLessonCount:lessons.length,
  eligiblePracticeCount:compact.length,
  byDimension,
  excludedCount:lessons.length-compact.length,
  duplicateTitleGroups,
  currentV3:{tip9Families:native.tip9Names.length,tip7UniqueMovements:native.tip7Names.length,exactV2Tip9TitleOverlaps:exactV3Tip9Overlaps,exactV2Tip7TitleOverlaps:exactV3Tip7Overlaps},
  generatedAt:new Date().toISOString()
};

await fs.mkdir(OUT_DIR,{recursive:true});
await fs.mkdir(path.dirname(PRODUCTION_FILE),{recursive:true});
await fs.writeFile(path.join(OUT_DIR,'v2-practice-library.json'),JSON.stringify({version:'3.12-migration-2',source:SOURCE_URL,report,items:compact},null,2));
await fs.writeFile(path.join(OUT_DIR,'v2-migration-report.json'),JSON.stringify(report,null,2));
await fs.writeFile(PRODUCTION_FILE,`// AUTO-GENERATED by scripts/import-v2-curriculum.mjs from TIP OS v2.9.8.5.\n// Do not hand-edit. Re-run the migration script to reproduce this file.\nexport const LEGACY_LIBRARY_ITEMS=${JSON.stringify(compact)};\nexport const LEGACY_LIBRARY_REPORT=${JSON.stringify({...report,generatedAt:undefined})};\n`);
console.log(JSON.stringify(report,null,2));
