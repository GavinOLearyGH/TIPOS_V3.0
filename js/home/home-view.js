import { TIPState } from '../core/storage.js';
import { getTIP7Status } from '../tip7/tip7-engine.js';
import { memoryConfidenceCopy } from '../coach/memory.js';
import { getTIPSuggestion, suggestionModeLabel } from '../coach/recommend.js';

function esc(value='') {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

export function renderHome() {
  const state = TIPState.get();
  const tip7 = getTIP7Status();
  const tip7Copy = tip7.complete
    ? 'Foundation complete · 7 / 7'
    : tip7.doneToday
      ? `Done today · 🔥 ${tip7.streak} day streak`
      : `Day ${tip7.nextDay?.day || 1} · ${tip7.nextDay?.theme || 'Foundation'}`;
  const recentTip9 = (state.tip9.recent || [])[0];
  const tip9Copy = state.tip9.lifetime
    ? `${state.tip9.lifetime} completed${recentTip9?.context ? ` · Last: ${String(recentTip9.context).replace('noball','No Ball')}` : ''}`
    : 'Nine balls · Swing + Skill';
  const memoryCopy = memoryConfidenceCopy(state.memory);
  const suggestion = getTIPSuggestion();

  return `
    <section>
      <div class="eyebrow">THE IRISH PAR</div>
      <h1 class="page-title">Build your golfer.</h1>
      <p class="page-copy">Train your body. Practice your game. Let TIP remember what you learn.</p>
    </section>

    <section class="section">
      <div class="product-grid">
        <button class="card card-button product-card" type="button" data-action="tip7">
          <div class="eyebrow">BODY</div>
          <div class="product-number">TIP<b>7</b></div>
          <p>${tip7Copy}</p>
        </button>
        <button class="card card-button product-card" type="button" data-action="tip9">
          <div class="eyebrow">GAME</div>
          <div class="product-number">TIP<b>9</b></div>
          <p>${tip9Copy}</p>
        </button>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <div>
          <div class="eyebrow">TIP SUGGESTS</div>
          <h2>${esc(memoryCopy)}</h2>
        </div>
      </div>
      <article class="card card-accent tip-suggestion-card">
        <div class="card-top">
          <div>
            <span class="pill">${esc(suggestionModeLabel(suggestion.mode))}</span>
            <h3>${esc(suggestion.title)}</h3>
          </div>
          <small>${esc(suggestion.label)}</small>
        </div>
        <p>${esc(suggestion.reason)}</p>
        <button class="primary-button tip-suggestion-start" type="button" data-action="tip-suggestion">START</button>
      </article>
    </section>
  `;
}
