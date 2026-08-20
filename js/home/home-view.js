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
  const totalEvidence = Number(state.memory?.summary?.totalEvidence || 0);
  const hasCoachingEvidence = totalEvidence > 0;
  const suggestion = hasCoachingEvidence ? getTIPSuggestion() : null;

  return `
    <section class="page-header">
      <div class="eyebrow">TODAY</div>
      <h1 class="page-title">What are you working on?</h1>
    </section>

    <section class="home-core-list section" aria-label="The Irish Par">
      <button class="home-core-row" type="button" data-action="tip7">
        <div class="home-core-name">TIP7</div>
        <div class="home-core-content">
          <div class="home-core-description">7 Minute Stretch &amp; Strength</div>
          <div class="home-core-status">${esc(tip7Status)}</div>
        </div>
        <span class="home-core-arrow" aria-hidden="true">›</span>
      </button>

      <button class="home-core-row" type="button" data-action="tip9">
        <div class="home-core-name">TIP9</div>
        <div class="home-core-content">
          <div class="home-core-description">9 Ball Challenge for Swing &amp; Skill</div>
          <div class="home-core-status">${esc(tip9Status)}</div>
        </div>
        <span class="home-core-arrow" aria-hidden="true">›</span>
      </button>

      <a class="home-core-row home-core-tip" href="#/tip" aria-label="Open TIP">
        <div class="home-core-name">TIP</div>
        <div class="home-core-content">
          <div class="home-core-description home-core-tip-description">Tell TIP about your golf. Let TIP help with what comes next.</div>
        </div>
        <span class="home-core-arrow" aria-hidden="true">›</span>
      </a>
    </section>

    ${hasCoachingEvidence ? `
      <section class="home-suggests section">
        <div class="section-head">
          <div>
            <div class="eyebrow">TIP SUGGESTS</div>
            <h2>${esc(memoryCopy)}</h2>
          </div>
        </div>
        <article class="card card-accent tip-suggestion-card home-tip-suggestion">
          <div class="card-top">
            <div>
              <span class="pill">${esc(suggestionModeLabel(suggestion.mode))}</span>
              <h2>${esc(suggestion.title)}</h2>
            </div>
            <small>${esc(suggestion.label)}</small>
          </div>
          <p>${esc(suggestion.reason)}</p>
          <button class="primary-button tip-suggestion-start" type="button" data-action="tip-suggestion">START</button>
        </article>
      </section>
    ` : ''}
  `;
}
