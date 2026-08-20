import { TIPState } from '../core/storage.js';
import { TIP9_CONTEXTS, TIP9_PRACTICES } from './tip9-data.js';
import { recommendTIP9, getTIP9Practice, getTIP9PracticeState, getTIP9Data, buildTIP9Blocks, swingResponse, completeTIP9, saveTIP9Feel } from './tip9-engine.js';

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function unit(context){return context==='noball'?'REPS':'BALLS';}
function renderBalls(results=[]){let html='';for(let i=0;i<9;i++){let status='';for(let j=0;j<results.length;j++)if(i>=j*3&&i<j*3+3)status=(i-j*3)<results[j]?'good':'miss';html+=`<div class="tip9-ball ${status}">${status==='good'?'✓':status==='miss'?'×':''}</div>`;}return html;}

function contextHTML(){
  const state=TIPState.get();
  return `<section class="tip9-overview"><div class="tip9-brand">TIP<b>9</b></div><div class="eyebrow">QUICK PRACTICE</div><h1 class="page-title">Nine balls.<br>One purpose.</h1><p class="page-copy">Choose where you are. TIP9 will give you a focused Swing or Skill practice that works there.</p><div class="tip9-contexts">
    <button data-tip9-context="range"><strong>Range</strong><span>Full flight · Targets · Turf</span></button>
    <button data-tip9-context="bay"><strong>Hitting Bay</strong><span>Net · Simulator · Launch monitor</span></button>
    <button data-tip9-context="green"><strong>Putting Green</strong><span>Start line · Speed · Scoring</span></button>
    <button data-tip9-context="short"><strong>Short Game</strong><span>Chip · Pitch · Bunker</span></button>
    <button data-tip9-context="noball"><strong>No Ball</strong><span>Rehearsals · Motion · Feel</span></button>
  </div><div class="card-meta">${state.tip9.lifetime||0} TIP9${state.tip9.lifetime===1?'':'s'} completed</div><button class="text-button" data-tip9-browse>Browse all practices</button><button class="text-button" data-tip9-exit>← BACK HOME</button></section>`;
}

function recommendationHTML(context,practice){
  const ps=getTIP9PracticeState(practice.id); const data=getTIP9Data(practice,context);
  return `<section class="tip9-overview"><div class="eyebrow">${esc(TIP9_CONTEXTS[context])}</div><p class="page-copy">TIP9 suggests:</p><article class="card card-accent"><div class="card-top"><span class="eyebrow">${esc(practice.type)}</span><span class="pill">LEVEL ${ps.level}</span></div><h1 class="page-title tip9-title">${esc(practice.name)}</h1><p>${esc(practice.desc)}</p><div class="tip9-need"><span>YOU NEED</span><strong>${esc(data.need)}</strong></div></article><button class="primary-button" data-tip9-setup="${esc(practice.id)}">START TIP9</button><div class="tip9-links"><button class="text-button" data-tip9-another>Another practice</button><button class="text-button" data-tip9-browse-context>Browse here</button></div><button class="text-button" data-tip9-change-context>← Change context</button></section>`;
}

function libraryHTML(context=null,filter='all'){
  const rows=TIP9_PRACTICES.filter(p=>(!context||p.contexts.includes(context))&&(filter==='all'||p.type===filter));
  return `<section class="tip9-overview"><div class="eyebrow">PRACTICE LIBRARY</div><h1 class="page-title">${context?esc(TIP9_CONTEXTS[context]):'All practices'}</h1><div class="tip9-filters"><button data-tip9-filter="all" class="${filter==='all'?'selected':''}">All</button><button data-tip9-filter="SWING" class="${filter==='SWING'?'selected':''}">Swing</button><button data-tip9-filter="SKILL" class="${filter==='SKILL'?'selected':''}">Skill</button></div><div class="tip9-library">${rows.map(p=>{const ps=getTIP9PracticeState(p.id);return `<button class="card card-button" data-tip9-library-id="${p.id}"><div class="card-top"><span class="eyebrow">${p.type}</span><span class="pill">LEVEL ${ps.level}</span></div><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p></button>`;}).join('')}</div><button class="text-button" data-tip9-library-back>← Back</button></section>`;
}

function setupHTML(context,practice){const data=getTIP9Data(practice,context),ps=getTIP9PracticeState(practice.id);return `<section class="tip9-overview"><div class="eyebrow">${practice.type} · ${esc(TIP9_CONTEXTS[context])}</div><h1 class="page-title">${esc(practice.name)}</h1><p class="page-copy">${esc(practice.desc)}</p><article class="card"><span class="eyebrow">YOU NEED</span><h3>${esc(data.need)}</h3><span class="eyebrow">LEVEL</span><h3>${ps.level} of 3</h3></article><button class="primary-button" data-tip9-begin>START TIP9</button><button class="text-button" data-tip9-setup-back>← Choose another</button></section>`;}

export function startTIP9({container,onExit=()=>{},onComplete=()=>{}}){
  let context=null,currentId=null,blocks=[],block=0,results=[],libraryContext=null,filter='all',completion=null;
  document.body.classList.add('execution-mode');
  function render(html){container.innerHTML=html;window.scrollTo({top:0,behavior:'instant'});}
  function home(){context=null;currentId=null;render(contextHTML());}
  function chooseContext(c,avoid=null){context=c;const p=recommendTIP9(c,avoid);currentId=p?.id||null;render(p?recommendationHTML(c,p):contextHTML());}
  function openSetup(id){currentId=id;const p=getTIP9Practice(id);if(!p)return; if(!context)context=p.contexts[0];render(setupHTML(context,p));}
  function openLibrary(c=libraryContext,f=filter){libraryContext=c;filter=f;render(libraryHTML(c,f));}
  function begin(){blocks=buildTIP9Blocks(currentId,context);block=0;results=[];renderPlay();}
  function renderPlay(){const p=getTIP9Practice(currentId),b=blocks[block];render(`<section class="tip9-play"><div class="card-top"><div><div class="eyebrow">${p.type} · LEVEL ${getTIP9PracticeState(currentId).level}</div><h2>${esc(p.name)}</h2></div><span class="pill">${unit(context)} ${block*3+1}–${block*3+3}</span></div><div class="tip9-balls">${renderBalls(results)}</div><article class="card"><div class="eyebrow">${esc(b.stage)}</div><div class="tip9-instruction"><span>WHAT TO DO</span><p>${esc(b.instruction)}</p></div><div class="tip9-success"><strong>SUCCESS</strong><p>${esc(b.goal)}</p></div></article><p class="page-copy">${context==='noball'?'Complete all three rehearsals, then record how many met the success goal.':'Hit all three balls, then record how many met the success goal.'}</p><div class="tip9-scoregrid">${[0,1,2,3].map(n=>`<button data-tip9-score="${n}">${n} / 3</button>`).join('')}</div><button class="text-button" data-tip9-end>End practice</button></section>`);}
  function recordScore(n){results.push(n);const p=getTIP9Practice(currentId);if(block===2){finish();return;}const next=blocks[block+1];const response=p.type==='SWING'?swingResponse(n):{title:'NEXT 3',text:`${n}/3 recorded. Keep the challenge stable and measure execution again.`};block++;render(`<section class="tip9-overview"><div class="eyebrow">${unit(context)} ${block*3} / 9 COMPLETE</div><h1 class="page-title">${esc(response.title)}</h1><article class="card card-accent"><span class="eyebrow">TIP9 RESPONSE</span><p class="tip9-response">${esc(response.text)}</p><div class="tip9-instruction"><span>NEXT 3 · WHAT TO DO</span><p>${esc(next.instruction)}</p></div><div class="tip9-success"><strong>SUCCESS</strong><p>${esc(next.goal)}</p></div></article><div class="tip9-balls">${renderBalls(results)}</div><button class="primary-button" data-tip9-ready>READY FOR NEXT 3</button></section>`);}
  function finish(){completion=completeTIP9({practiceId:currentId,context,results});const p=completion.practice;const skill=p.type==='SKILL';render(`<section class="tip9-complete"><div class="tip9-check">✓</div><div class="eyebrow">TIP9 COMPLETE</div><h1 class="page-title">${esc(p.name)}</h1><article class="card"><span class="eyebrow">${skill?'SCORE':'NINE COMPLETE'}</span><div class="tip9-result">${skill?`${completion.score}/9`:'9'}</div><div class="tip9-balls">${renderBalls(results)}</div>${completion.unlocked?`<div class="tip9-unlock">Level ${completion.newLevel} unlocked.</div>`:''}</article>${skill?'':`<section class="section"><p class="page-copy">After those 9:</p><div class="button-row"><button class="secondary-button" data-tip9-feel="Felt Good">Felt Good</button><button class="secondary-button" data-tip9-feel="Keep Working">Keep Working</button></div></section>`}<button class="primary-button ${skill?'':'tip9-done-delayed'}" data-tip9-done>DONE</button></section>`);onComplete(completion.entry);}
  function exit(){document.body.classList.remove('execution-mode');onExit();}

  container.addEventListener('click',event=>{const t=event.target.closest('button');if(!t)return;
    if(t.dataset.tip9Context)chooseContext(t.dataset.tip9Context);
    else if(t.hasAttribute('data-tip9-exit'))exit();
    else if(t.hasAttribute('data-tip9-another'))chooseContext(context,currentId);
    else if(t.hasAttribute('data-tip9-change-context'))home();
    else if(t.hasAttribute('data-tip9-browse'))openLibrary(null,'all');
    else if(t.hasAttribute('data-tip9-browse-context'))openLibrary(context,'all');
    else if(t.dataset.tip9Filter)openLibrary(libraryContext,t.dataset.tip9Filter);
    else if(t.dataset.tip9LibraryId)openSetup(t.dataset.tip9LibraryId);
    else if(t.hasAttribute('data-tip9-library-back'))libraryContext?chooseContext(libraryContext):home();
    else if(t.dataset.tip9Setup)openSetup(t.dataset.tip9Setup);
    else if(t.hasAttribute('data-tip9-setup-back'))chooseContext(context,currentId);
    else if(t.hasAttribute('data-tip9-begin'))begin();
    else if(t.dataset.tip9Score!=null)recordScore(Number(t.dataset.tip9Score));
    else if(t.hasAttribute('data-tip9-ready'))renderPlay();
    else if(t.hasAttribute('data-tip9-end'))home();
    else if(t.dataset.tip9Feel){saveTIP9Feel(completion.entry.id,currentId,t.dataset.tip9Feel);container.querySelectorAll('[data-tip9-feel]').forEach(b=>b.classList.toggle('selected',b===t));container.querySelector('[data-tip9-done]')?.classList.remove('tip9-done-delayed');}
    else if(t.hasAttribute('data-tip9-done'))exit();
  });
  home();
  return()=>{document.body.classList.remove('execution-mode');};
}
