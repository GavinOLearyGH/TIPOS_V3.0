export function renderTIP() {
  return `
    <section>
      <div class="eyebrow">TIP</div>
      <h1 class="page-title">How can TIP help today?</h1>
      <p class="page-copy">Tell TIP what happened, or let TIP build the work.</p>
    </section>

    <section class="section tip-action-list">
      <button class="card card-button card-accent tip-action-card" type="button" data-action="tell-tip">
        <div class="eyebrow">TELL TIP</div>
        <h2>Tell TIP what you did</h2>
        <p>Round · Practice · Lesson · Equipment · Note</p>
      </button>

      <button class="card card-button tip-action-card" type="button" data-action="build-session">
        <div class="eyebrow">TODAY'S WORK</div>
        <h2>Build today's session</h2>
        <p>Time · place · what TIP knows about your golf</p>
      </button>
    </section>
  `;
}
