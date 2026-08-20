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
  const tip7Status = tip7.complete
    ? 'FOUNDATION COMPLETE'
    : tip7.doneToday
      ? `DONE TODAY · ${tip7.streak} DAY STREAK`
      : `DAY ${tip7.nextDay?.day || 1} · ${tip7.nextDay?.theme || 'OPEN'}`;
  const recentTip9 = (state.tip9.recent || [])[0];
  const tip9Status = state.tip9.lifetime
    ? `${state.tip9.lifetime} COMPLETE${recentTip9?.context ? ` · ${String(recentTip9.context).replace('noball','NO BALL').toUpperCase()}` : ''}`
    : 'READY';
  const memoryCopy = memoryConfidenceCopy(state.memory);
  const suggestion = getTIPSuggestion();

  return `
    <section class="home-products">
      <div class="product-grid">
        <button class="card card-button product-card" type="button" data-action="tip7">
          <div class="eyebrow">BODY</div>
          <div class="product-number">TIP<b>7</b></div>
          <p class="product-description">7 Minute Stretch &amp; Strength</p>
          <div class="product-status">${esc(tip7Status)}</div>
        </button>
        <button class="card card-button product-card" type="button" data-action="tip9">
          <div class="eyebrow">GAME</div>
          <div class="product-number">TIP<b>9</b></div>
          <p class="product-description">9 Ball Challenge for Swing &amp; Skill</p>
          <div class="product-status">${esc(tip9Status)}</div>
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
