export function renderTIP() {
  return `
    <section>
      <div class="eyebrow">TIP</div>
      <h1 class="page-title">How can TIP help today?</h1>
      <p class="page-copy">Tell TIP what happened, or have TIP build the work. The deeper coaching logic stays behind the interface.</p>
    </section>

    <section class="section">
      <button class="card card-button card-accent" type="button" data-action="tell-tip">
        <div class="eyebrow">TELL TIP</div>
        <h2>Tell TIP what you did</h2>
        <p>Round · Practice · Lesson · Equipment · Note</p>
      </button>

      <button class="card card-button" type="button" data-action="build-session">
        <div class="eyebrow">TODAY'S WORK</div>
        <h2>Have TIP build today's session</h2>
        <p>Time + context + what TIP knows about your golf.</p>
      </button>
    </section>

    <section class="section">
      <div class="empty-state">Entry capture arrives in V3.0-B. Session composition arrives after TIP7, TIP9 and Memory are integrated.</div>
    </section>
  `;
}
