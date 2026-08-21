import fs from 'node:fs/promises';
import path from 'node:path';

const SOURCE_URL='https://raw.githubusercontent.com/GavinOLearyGH/TIP_OS_v2.9.8.5_PWA/main/data/tip-curriculum-v1.js';
const OUT_DIR=path.resolve('generated');
const FOUNDATIONS=new Set(['Swing','Skill','Stretch','Strength']);

const normalize=value=>String(value||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

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

function compactLesson(lesson){
  const assignment=lesson.practiceAssignment||{};
  const view=lesson.practiceView||{};
  return {
    id:lesson.lessonId,
    legacyId:lesson.lessonId,
    source:'TIP_OS_v2.9.8.5',
    title:lesson.title,
    dimension:lesson.foundation,
    skill:lesson.skill||'',
    area:lesson.area||'',
    type:lesson.type||'golf_drill',
    summary:lesson.summary||lesson.purpose||'',
    purpose:lesson.purpose||'',
    whyItHelps:lesson.whyItHelps||'',
    whenToUse:lesson.whenToUse||[],
    equipment:lesson.equipment||[],
    locations:lesson.location||[],
    durationMinutes:Number(lesson.durationMinutes||assignment.dose?.totalMinutes||view.dose?.totalMinutes||0),
    instructions:lesson.instructions||assignment.doThis||view.doThis||[],
    successStandard:lesson.successStandard||assignment.winCondition||view.winCondition||[],
    whatToNotice:lesson.whatToNotice||[],
    commonMistakes:lesson.commonMistakes||[],
    makeItEasier:lesson.makeItEasier||assignment.makeItEasier||view.makeItEasier||[],
    makeItHarder:lesson.makeItHarder||assignment.makeItHarder||view.makeItHarder||[],
    safety:lesson.safety||assignment.safety||view.safety||[],
    coachNote:lesson.tipNote||assignment.coachConnection||view.coachNote||'',
    journalPrompt:assignment.journalPrompt||view.journalPrompt||'',
    dose:assignment.dose||view.dose||null,
    planTags:lesson.planTags||[],
    relatedLessonIds:lesson.relatedLessonIds||[],
    evidenceLevel:lesson.evidenceLevel||'',
    evidenceLabel:lesson.evidenceLabel||'',
    reviewStatus:lesson.reviewStatus||'',
    lastReviewed:lesson.lastReviewed||'',
    practiceReady:lesson.practiceReady===true,
    libraryVisible:lesson.libraryVisible!==false,
    normalizedTitle:normalize(lesson.title)
  };
}

const curriculum=await readSource();
const lessons=Array.isArray(curriculum.lessons)?curriculum.lessons:[];
const eligible=lessons.filter(l=>FOUNDATIONS.has(l.foundation)&&l.practiceReady===true&&l.libraryVisible!==false);
const compact=eligible.map(compactLesson);
const byDimension=Object.fromEntries([...FOUNDATIONS].map(d=>[d,compact.filter(x=>x.dimension===d).length]));
const titles=new Map();
for(const item of compact){
  const key=item.normalizedTitle;
  if(!titles.has(key)) titles.set(key,[]);
  titles.get(key).push(item.id);
}
const duplicateTitleGroups=[...titles.entries()].filter(([,ids])=>ids.length>1).map(([title,ids])=>({title,ids}));
const report={
  sourceVersion:curriculum.version||'',
  sourceRelease:curriculum.release||'',
  sourceLessonCount:Number(curriculum.lessonCount||lessons.length),
  parsedLessonCount:lessons.length,
  eligiblePracticeCount:compact.length,
  byDimension,
  excludedCount:lessons.length-compact.length,
  duplicateTitleGroups,
  generatedAt:new Date().toISOString()
};

await fs.mkdir(OUT_DIR,{recursive:true});
await fs.writeFile(path.join(OUT_DIR,'v2-practice-library.json'),JSON.stringify({version:'3.12-migration-1',source:SOURCE_URL,report,items:compact},null,2));
await fs.writeFile(path.join(OUT_DIR,'v2-migration-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
