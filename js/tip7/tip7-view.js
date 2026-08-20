import { TIPState } from '../core/storage.js';
import { TIP7_DAYS, TIP7_WORK_SECONDS, TIP7_PREP_SECONDS } from './tip7-data.js';
import { completeTIP7Day, getTIP7Status, saveTIP7Feel } from './tip7-engine.js';

function esc(value='') {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function checkOptions(day) {
  if (day.check === 'effort') return ['Easy','Right','Hard'];
  if (day.check === 'combo') return ['Tired','Good','Strong'];
  return ['Tighter','Same','Looser'];
}

function beep(freq=700,duration=.1) {
  const prefs = TIPState.get().preferences;
  if (!prefs.sound) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    beep.ctx = beep.ctx || new Ctx();
    const osc = beep.ctx.createOscillator();
    const gain = beep.ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(.12, beep.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, beep.ctx.currentTime + duration);
    osc.connect(gain); gain.connect(beep.ctx.destination); osc.start(); osc.stop(beep.ctx.currentTime + duration);
  } catch {}
  if (prefs.vibration && navigator.vibrate) navigator.vibrate(30);
}

function overviewHTML() {
  const status = getTIP7Status();
  const p = status.progress;
  if (status.complete) {
    return `<section class="tip7-overview"><div class="eyebrow">TIP7 · LEVEL 1</div><h1 class="page-title">Foundation ✓</h1><p class="page-copy">Seven days completed. The habit has started.</p><div class="tip7-stats"><div><strong>${p.bestStreak||status.streak}</strong><span>BEST</span></div><div><strong>${p.lifetime||7}</strong><span>TIP7s</span></div><div><strong>7/7</strong><span>LEVEL</span></div></div><button class="secondary-button" data-tip7-exit>BACK HOME</button></section>`;
  }
  const d = status.nextDay;
  const button = status.canStart ? `START DAY ${d.day}` : 'DONE FOR TODAY ✓';
  return `<section class="tip7-overview">
    <div class="tip7-brand">TIP<b>7</b></div>
    <div class="eyebrow">LEVEL 1 · FOUNDATION</div>
    <p class="page-copy">Seven days to build the habit. Stretch and strength, built for golf.</p>
    <div class="tip7-stats"><div><strong>${status.streak}</strong><span>🔥 STREAK</span></div><div><strong>${p.bestStreak||0}</strong><span>BEST</span></div><div><strong>${p.lifetime||0}</strong><span>TIP7s</span></div></div>
    <article class="card card-accent tip7-today"><div class="card-top"><div><div class="eyebrow">DAY ${d.day} · ${esc(d.dimension)}</div><h2>${esc(d.theme)}</h2></div><span class="pill">${status.canStart?'TODAY':'TOMORROW'}</span></div><p>${esc(status.canStart?d.purpose:'Today’s work is done. The next circuit unlocks on your next calendar day.')}</p><div class="card-meta">12 movements · 30 sec work · 10 sec prepare</div></article>
    <button class="primary-button" data-tip7-start ${status.canStart?'':'disabled'}>${button}</button>
    <div class="tip7-week">${TIP7_DAYS.map((day,i)=>`<div class="tip7-day ${p.completed.includes(i)?'done':i===status.nextIndex&&status.canStart?'today':'locked'}"><span>${p.completed.includes(i)?'✓':day.day}</span><div><strong>${esc(day.theme)}</strong><small>${esc(day.dimension)}</small></div></div>`).join('')}</div>
    <p class="tip7-safety">Work through a comfortable, pain-free range and stop any movement that causes pain. TIP7 is general fitness programming, not medical or rehabilitation advice.</p>
    <button class="text-button" data-tip7-exit>← BACK HOME</button>
  </section>`;
}

export function startTIP7({ container, onExit = () => {}, onComplete = () => {} }) {
  let dayIndex = null;
  let step = 0;
  let phase = 'prepare';
  let remaining = TIP7_PREP_SECONDS;
  let paused = false;
  let timer = null;
  let completionEntry = null;
  const controller = new AbortController();

  document.body.classList.add('execution-mode');

  function stopTimer() { if (timer) clearInterval(timer); timer = null; }
  function renderOverview() { stopTimer(); container.innerHTML = overviewHTML(); }

  function renderSession() {
    const day = TIP7_DAYS[dayIndex];
    const ex = day.exercises[step];
    const prep = phase === 'prepare';
    const completed = step + (prep ? 0 : (TIP7_WORK_SECONDS - remaining) / TIP7_WORK_SECONDS);
    container.innerHTML = `<section class="tip7-session ${prep?'prepare-state':'work-state'}">
      <div class="tip7-progress-head"><span>DAY ${day.day} · ${esc(day.dimension)} · ${esc(day.theme)}</span><span>${step+1} / 12</span></div>
      <div class="tip7-track"><div style="width:${Math.min(100,completed/12*100)}%"></div></div>
      <div class="tip7-phase"><div class="eyebrow">${prep?'PREPARE':'WORK'}</div><div class="tip7-counter">${remaining}</div><small>SECONDS</small></div>
      <article class="card tip7-exercise"><h2>${esc(ex.name)}</h2><p>${esc(ex.how)}</p><div class="tip7-cue"><strong>CUE</strong> · ${esc(ex.cue)}</div>${!prep && day.exercises[step+1]?`<div class="tip7-next">NEXT · <strong>${esc(day.exercises[step+1].name)}</strong></div>`:''}</article>
      <div class="tip7-controls"><button data-tip7-prev>← Previous</button><button data-tip7-pause>${paused?'Resume':'Pause'}</button><button data-tip7-next>Next →</button></div>
    </section>`;
  }

  function finish() {
    stopTimer();
    beep(1000,.16); setTimeout(()=>beep(1250,.18),180);
    completionEntry = completeTIP7Day(dayIndex);
    const day = TIP7_DAYS[dayIndex];
    const status = getTIP7Status();
    container.innerHTML = `<section class="tip7-complete"><div class="tip7-check">✓</div><div class="eyebrow">${status.complete?'LEVEL 1 COMPLETE':`DAY ${day.day} COMPLETE`}</div><h1 class="page-title">${status.complete?'Foundation ✓':'You showed up.'}</h1><p class="page-copy">${status.complete?'Seven days starts the 49-day journey.':'Today’s work is done and already saved to your Journal.'}</p>
      <article class="card"><div class="journal-metrics"><span>${esc(day.dimension)} · ${esc(day.theme)}</span><strong>🔥 ${status.streak} day streak</strong></div></article>
      <div class="section"><div class="eyebrow">TIP CHECK-IN</div><h2>${day.check==='effort'?'How did that feel?':day.check==='combo'?'How do you feel after Level 1?':'How do you feel?'}</h2><div class="tip7-feel">${checkOptions(day).map(v=>`<button data-tip7-feel="${esc(v)}">${esc(v)}</button>`).join('')}</div></div>
      <button class="primary-button" data-tip7-done>DONE</button></section>`;
    onComplete(completionEntry);
  }

  function tick() {
    if (paused) return;
    remaining--;
    if (phase === 'prepare' && remaining > 0 && remaining <= 3) beep(480,.04);
    if (remaining <= 0) {
      if (phase === 'prepare') { phase = 'work'; remaining = TIP7_WORK_SECONDS; beep(900,.12); }
      else if (step === 11) { finish(); return; }
      else { step++; phase = 'prepare'; remaining = TIP7_PREP_SECONDS; beep(650,.08); }
    }
    renderSession();
  }

  function begin() {
    const status = getTIP7Status();
    if (!status.canStart) return;
    dayIndex = status.nextIndex;
    step = 0;
    phase = 'prepare';
    remaining = TIP7_PREP_SECONDS;
    paused = false;
    renderSession();
    stopTimer();
    timer = setInterval(tick,1000);
    beep(520,.07);
  }

  function cleanup() {
    stopTimer();
    controller.abort();
    document.removeEventListener('visibilitychange', visibility);
    document.body.classList.remove('execution-mode');
  }

  function exit() {
    cleanup();
    onExit();
  }

  function clickHandler(event) {
    const target = event.target.closest('button');
    if (!target) return;
    if (target.matches('[data-tip7-start]')) begin();
    else if (target.matches('[data-tip7-exit]')) exit();
    else if (target.matches('[data-tip7-pause]')) { paused = !paused; renderSession(); }
    else if (target.matches('[data-tip7-next]')) {
      if (phase === 'prepare') { phase='work'; remaining=TIP7_WORK_SECONDS; }
      else if (step===11) { finish(); return; }
      else { step++; phase='prepare'; remaining=TIP7_PREP_SECONDS; }
      renderSession();
    } else if (target.matches('[data-tip7-prev]')) {
      if (phase==='work') { phase='prepare'; remaining=TIP7_PREP_SECONDS; }
      else if (step>0) { step--; phase='prepare'; remaining=TIP7_PREP_SECONDS; }
      renderSession();
    } else if (target.matches('[data-tip7-feel]')) {
      container.querySelectorAll('[data-tip7-feel]').forEach(b=>b.classList.toggle('selected', b===target));
      saveTIP7Feel(dayIndex, target.dataset.tip7Feel);
    } else if (target.matches('[data-tip7-done]')) exit();
  }

  const visibility = () => {
    if (document.hidden && timer) {
      paused = true;
      renderSession();
    }
  };

  container.addEventListener('click', clickHandler, { signal:controller.signal });
  document.addEventListener('visibilitychange', visibility);
  renderOverview();

  return cleanup;
}
