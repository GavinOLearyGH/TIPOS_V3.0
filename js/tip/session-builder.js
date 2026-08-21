import { composeTodaySession, SESSION_CONTEXTS } from '../coach/compose-session.js';
import { SESSION_FOCUS } from '../coach/catalog.js';

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

export function renderSessionBuilder(options={}){
  const inline = options.inline === true;
  const form = `<form id="sessionBuilderForm" class="session-builder-form ${inline?'session-builder-inline':''}">
      <fieldset class="field"><legend>How much time?</legend><div class="session-choice-grid">
        ${[7,15,30,45,60].map(m=>`<label class="session-choice" data-session-choice="minutes" data-session-value="${m}"><input type="radio" name="minutes" value="${m}" ${m===30?'checked':''}><span><strong>${m===60?'60+':m}</strong><small>MIN</small></span></label>`).join('')}
      </div></fieldset>
      <fieldset class="field"><legend>Where are you?</legend><div class="session-context-grid">
        ${Object.entries(SESSION_CONTEXTS).map(([key,value])=>`<label class="session-choice session-context-choice" data-session-choice="context" data-session-value="${key}"><input type="radio" name="context" value="${key}" ${key==='anywhere'?'checked':''}><span><strong>${esc(value.label)}</strong></span></label>`).join('')}
      </div></fieldset>
      <fieldset class="field"><legend>What do you want to work on? <small>Choose a focus, or let TIP decide.</small></legend><div class="session-context-grid session-focus-grid">
        ${Object.entries(SESSION_FOCUS).map(([key,value])=>`<label class="session-choice session-focus-choice" data-session-choice="focus" data-session-value="${key}"><input type="radio" name="focus" value="${key}" ${key==='auto'?'checked':''}><span><strong>${esc(value.label)}</strong></span></label>`).join('')}
      </div></fieldset>
      <button class="primary-button" type="submit">BUILD SESSION</button>
    </form>`;
  if (inline) return form;
  return `<section><div class="eyebrow">ASK TIP</div><h1 class="page-title">Build a custom session.</h1><p class="page-copy">Choose your time, location and focus—or let TIP decide. TIP combines your choices with what it knows about your golf.</p></section><section class="section">${form}<button class="text-button" type="button" data-action="session-cancel">← BACK TO TIP</button></section>`;
}

export function renderSessionPlan(options={}, renderOptions={}){
  const plan=composeTodaySession(options);
  const inline = renderOptions.inline === true;
  const blockHTML=plan.blocks.map((block,index)=>`<article class="session-block compact-session-block">
    <div class="session-block-number">${index+1}</div>
    <div><div class="eyebrow">${block.kind==='tip7'?'TIP7':`TIP9 · ${esc(block.practiceType||'GAME')}`}</div><h3>${esc(block.title)}</h3><p>${block.kind==='tip7'?`Day ${block.day} · ~${block.estimate} min`:`${esc(block.context||'')} · 9 ${block.context==='noball'?'reps':'balls'} · ~${block.estimate} min`}</p></div>
  </article>`).join('');
  const focusMeta=plan.focus?` · ${esc(plan.focus)}`:'';
  const content=`<div class="inline-session-plan">
    <div class="inline-session-head"><div class="eyebrow">TIP BUILT THIS</div><h2>${esc(plan.title)}</h2><p>${esc(plan.contextLabel)} · ${plan.minutes===60?'60+':plan.minutes} min${focusMeta}</p></div>
    <p class="session-reason">${esc(plan.reason)}</p>
    <div class="session-plan-list">${blockHTML||'<div class="empty-state"><strong>No extra work needed here.</strong><p>TIP could not build a useful session for this combination without adding unrelated work.</p></div>'}</div>
    <div class="inline-session-actions"><button class="primary-button" type="button" data-action="session-start" ${plan.blocks.length?'':'disabled'}>START SESSION</button><button class="secondary-button" type="button" data-action="session-rebuild">CHANGE TIME, PLACE OR FOCUS</button></div>
  </div>`;
  if (inline) return {plan,html:content};
  return {plan,html:`<section><div class="eyebrow">TIP BUILT THIS</div><h1 class="page-title">${esc(plan.title)}</h1><p class="page-copy">${esc(plan.contextLabel)} · ${plan.minutes===60?'60+':plan.minutes} min${focusMeta}</p></section><section class="section">${content}</section>`};
}