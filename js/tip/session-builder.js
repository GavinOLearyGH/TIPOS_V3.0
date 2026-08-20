import { composeTodaySession, SESSION_CONTEXTS } from '../coach/compose-session.js';

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

export function renderSessionBuilder(){
  return `<section>
    <div class="eyebrow">TIP · TODAY'S WORK</div>
    <h1 class="page-title">Build today's session.</h1>
    <p class="page-copy">Tell TIP how much time you have and where you are. TIP will assemble the work from your current progress and Journal.</p>
  </section>
  <section class="section">
    <form id="sessionBuilderForm" class="session-builder-form">
      <fieldset class="field"><legend>How much time?</legend><div class="session-choice-grid">
        ${[7,15,30,45,60].map((m,i)=>`<label class="session-choice"><input type="radio" name="minutes" value="${m}" ${m===30?'checked':''}><span><strong>${m===60?'60+':m}</strong><small>MIN</small></span></label>`).join('')}
      </div></fieldset>
      <fieldset class="field"><legend>Where are you?</legend><div class="session-context-grid">
        ${Object.entries(SESSION_CONTEXTS).map(([key,value])=>`<label class="session-choice session-context-choice"><input type="radio" name="context" value="${key}" ${key==='anywhere'?'checked':''}><span><strong>${esc(value.label)}</strong></span></label>`).join('')}
      </div></fieldset>
      <button class="primary-button" type="submit">BUILD MY SESSION</button>
      <button class="text-button" type="button" data-action="session-cancel">← BACK TO TIP</button>
    </form>
  </section>`;
}

export function renderSessionPlan(options={}){
  const plan=composeTodaySession(options);
  const blockHTML=plan.blocks.map((block,index)=>`<article class="card session-block">
    <div class="session-block-number">${index+1}</div>
    <div><div class="eyebrow">${block.kind==='tip7'?'TIP7 · BODY':`TIP9 · ${esc(block.practiceType||'GAME')}`}</div><h3>${esc(block.title)}</h3><p>${block.kind==='tip7'?`Day ${block.day} · ~${block.estimate} min`:`${esc(block.context||'')} · 9 ${block.context==='noball'?'reps':'balls'} · ~${block.estimate} min`}</p></div>
  </article>`).join('');
  return {plan,html:`<section>
    <div class="eyebrow">TIP BUILT THIS</div>
    <h1 class="page-title">${esc(plan.title)}</h1>
    <p class="page-copy">${esc(plan.contextLabel)} · ${plan.minutes===60?'60+':plan.minutes} min${plan.focus?` · Focus: ${esc(plan.focus)}`:''}</p>
  </section>
  <section class="section"><article class="card card-accent"><div class="eyebrow">WHY THIS SESSION</div><p>${esc(plan.reason)}</p></article></section>
  <section class="section"><div class="session-plan-list">${blockHTML||'<div class="empty-state">TIP could not assemble a session for this combination yet.</div>'}</div></section>
  <section class="section">
    <button class="primary-button" type="button" data-action="session-start" ${plan.blocks.length?'':'disabled'}>START SESSION</button>
    <button class="secondary-button" type="button" data-action="session-rebuild">CHANGE TIME OR PLACE</button>
  </section>`};
}
