import { TIPState } from '../core/storage.js';
import { getTIP7Status } from '../tip7/tip7-engine.js';

export function renderHome() {
  const state = TIPState.get();
  const hasJournal = state.journal.length > 0;
  const tip7 = getTIP7Status();
  const tip7Copy = tip7.complete
    ? 'Foundation complete · 7 / 7'
    : tip7.doneToday
      ? `Done today · 🔥 ${tip7.streak} day streak`
      : `Day ${tip7.nextDay?.day || 1} · ${tip7.nextDay?.theme || 'Foundation'}`;

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
          <p>Nine balls · Swing + Skill</p>
        </button>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <div>
          <div class="eyebrow">TIP SUGGESTS</div>
          <h2>${hasJournal ? 'TIP is learning from your Journal.' : 'TIP is learning your golf.'}</h2>
        </div>
      </div>
      <article class="card card-accent">
        <div class="card-top">
          <div>
            <span class="pill">FOUNDATION</span>
            <h3>${hasJournal ? 'Recommendation engine arrives in V3.0-F.' : 'Give TIP something to remember.'}</h3>
          </div>
        </div>
        <p>${hasJournal ? 'Your Journal is already stored in the shared V3 state. The coaching layer will turn that evidence into one useful next action.' : 'Record a round, practice, or complete TIP7 and the Journal will begin building your golf history.'}</p>
      </article>
    </section>
  `;
}
