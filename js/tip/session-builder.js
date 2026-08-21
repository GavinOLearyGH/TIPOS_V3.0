import { composeTodaySession, SESSION_CONTEXTS } from '../coach/compose-session.js';

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

export function renderSessionBuilder(options={}){
  const inline = options.inline === true;
  const form = `<form id="sessionBuilderForm" class="session-builder-form ${inline?'session-builder-inline':''}">
      <fieldset class="field"><legend>How much time?</legend><div class="session-choice-grid">
        ${[7,15,30,45,60].map(m=>`<label class="session-choice"><input type="radio" name="minutes" value="${m}" ${m===30?'checked':''}><span><strong>${m===60?'60+':m}</strong><small>MIN</small></span></label>`).join('')}
      </div></fieldset>
      <fieldset class="field"><legend>Where are you?</legend><div class="session-context-grid">
        ${Object.entries(SESSION_CONTEXTS).map(([key,value])=>`<label class="session-choice session-context-choice"><input type="radio" name="context" value="${key}" ${key==='anywhere'?'checked':''}><span><strong>${esc(value.label)}</strong></span></label>`).join('')}
      </div></fieldset>
      <button class="primary-button" type="submit">BUILD SESSION</button>
    </form>`;
  if (inline) return form;
  return `<section><div class="eyebrow">TIP · TODAY'S WORK</div><h1 class="page-title">Build today's session.</h1><p class="page-copy">Tell TIP how much time you have and where you are. TIP will assemble the work from your current progress and Journal.</p></section><section class="section">${form}<button class="text-button" type="button" data-action="session-cancel">← BACK TO TIP</button></section>`;
}

export function renderSessionPlan(options={}, renderOptions={}){
  const plan=composeTodaySession(options);
  const inline = renderOptions.inline === true;
  const blockHTML=plan.blocks.map((block,index)=>`<article class="session-block compact-session-block">
    <div class="session-block-number">${index+1}</div>
    <div><div class="eyebrow">${block.kind==='tip7'?'TIP7':`TIP9 · ${esc(block.practiceType||'GAME')}`}</div><h3>${esc(block.title)}</h3><p>${block.kind==='tip7'?`Day ${block.day} · ~${block.estimate} min`:`${esc(block.context||'')} · 9 ${block.context==='noball'?'reps':'balls'} · ~${block.estimate} min`}</p></div>
  </article>`).join('');
  const content=`<div class="inline-session-plan">
    <div class="inline-session-head"><div class="eyebrow">TIP BUILT THIS</div><h2>${esc(plan.title)}</h2><p>${esc(plan.contextLabel)} · ${plan.minutes===60?'60+':plan.minutes} min${plan.focus?` · ${esc(plan.focus)}`:''}</p></div>
    <p class="session-reason">${esc(plan.reason)}</p>
    <div class="session-plan-list">${blockHTML||'<div class="empty-state">TIP could not assemble a session for this combination yet.</div>'}</div>
    <div class="inline-session-actions"><button class="primary-button" type="button" data-action="session-start" ${plan.blocks.length?'':'disabled'}>START SESSION</button><button class="secondary-button" type="button" data-action="session-rebuild">CHANGE TIME OR PLACE</button></div>
  </div>`;
  if (inline) return {plan,html:content};
  return {plan,html:`<section><div class="eyebrow">TIP BUILT THIS</div><h1 class="page-title">${esc(plan.title)}</h1><p class="page-copy">${esc(plan.contextLabel)} · ${plan.minutes===60?'60+':plan.minutes} min${plan.focus?` · Focus: ${esc(plan.focus)}`:''}</p></section><section class="section">${content}</section>`};
}
