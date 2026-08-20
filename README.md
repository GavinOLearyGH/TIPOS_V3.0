# The Irish Par V3

**TIPOS V3.0** is the clean rebuild of The Irish Par around one simple coaching loop:

**DO → REMEMBER → SUGGEST → DO**

The golfer sees only three primary places:

- **Home** — do something now: TIP7, TIP9, or TIP's suggestion.
- **TIP** — tell TIP what happened or have TIP build today's session.
- **Golfer** — the Journal; the single visible history of the golfer.

## V3 product model

- **TIP7** — seven minutes for the golf body: Stretch + Strength.
- **TIP9** — nine balls/reps for the golf game: Swing + Skill.
- **TIP** — the coach that learns from Journal evidence and recommends one useful next action.
- **Journal** — the single source of truth for rounds, practice, TIP7, TIP9, lessons, equipment and notes.

## Build phases

- **V3.0-A — Foundation:** shell, navigation, shared state, storage, PWA. ✓
- **V3.0-B — Journal:** canonical entries, capture, CRUD, backup/restore and V2 history import. ✓
- **V3.0-C — TIP7:** native TIP7 engine with shared progress and Journal completion. ✓
- **V3.0-D — TIP9:** native TIP9 engine with shared progress and Journal completion. ✓
- **V3.0-E — TIP Memory:** Journal → signals → topics → memory. ✓
- **V3.0-F — TIP Suggests:** memory → one recommended action. ✓
- **V3.0-G — Build Today's Session:** compose TIP7/TIP9/custom activities from time, context and memory.

## Current milestone — V3.0-F TIP Suggests

TIP Suggests connects the invisible Memory layer to one visible action on Home. It does not expose a weakness dashboard, topic list or coaching scorecard.

The Home contract is now:

- TIP7 — Body
- TIP9 — Game
- TIP Suggests — one next action

### Recommendation contract

`js/coach/recommend.js` returns one recommendation with:

- `kind` — TIP7 or TIP9
- `mode` — Improve, Reinforce, Maintain or Learn
- coaching topic
- display title and reason
- executable action

The Home screen renders only that single recommendation and one `START` button.

### Improve

When Memory contains a meaningful recent negative pattern, TIP identifies the strongest current need using recency, confidence, trend and negative evidence.

Game priorities are mapped to the relevant TIP9 practice families. Examples include:

- Tee Control → Playable Tee Ball
- Approach Play → Approach Window / Club Selection
- Wedge Distance → Wedge Distance / Pitch Control
- Putting Pace → Lag Putting / Speed Ladder
- Contact → Contact / Low Point
- Tempo → Tempo / Transition
- Short Game → the relevant short-game TIP9 family

Recent practice history and the golfer's current TIP9 level influence which eligible practice is selected so TIP does not simply repeat the same drill when a useful alternative exists.

### Reinforce

If there is no sufficiently strong current weakness, TIP can reinforce an established positive Game pattern instead of inventing a problem.

This supports the coaching principle that a strength can be worth preserving and that every recommendation does not need to be corrective.

### Body priorities

Body topics continue to respect TIP7's programmed Foundation sequence. TIP will not jump directly to an arbitrary mobility or strength circuit merely because one body topic scores highly.

If a Body priority is active and today's TIP7 is available, the suggestion launches the next legitimate Foundation day and explains that it is continuing the body work without breaking progression.

### Learn / early golfer

TIP does not pretend to know a weakness when the Journal has too little evidence.

During the learning stage it recommends a simple useful activity — normally the available TIP7 day or a foundational TIP9 — specifically to generate better evidence for the Journal and Memory layer.

### Suggested TIP9 context

A Home recommendation can now carry a selected TIP9 practice directly into the execution engine.

If that practice works in several locations, TIP asks only one question:

**Where are you practicing?**

The golfer chooses from the contexts supported by that recommended practice, and TIP9 then opens at the correct current progression level. The golfer can still choose a different TIP9 if desired.

This means the sequence is:

**Memory → recommended practice → context → current level → 3 × 3 execution**

rather than selecting a recommendation on Home and then losing it when TIP9 opens.

### Recent-use protection

TIP9 recommendation selection takes account of recent use and completion history. When several practices address the same coaching topic, recently repeated work receives a penalty so an equally useful alternative can surface.

This is intentionally lightweight in V3.0-F. V3.0-G can use the same recommendation contract when composing longer sessions.

### Memory remains derived

The Journal is still truth. TIP Memory and TIP Suggests are interpretations of that history.

Editing or deleting a manual Journal entry rebuilds Memory, which can immediately change the Home recommendation. Completing TIP7 or TIP9 also writes to the Journal, rebuilds Memory, and allows the next suggestion to adapt.

### Offline

`js/coach/recommend.js` is included in the PWA app-shell cache alongside Memory, TIP7 and TIP9. Recommendation selection and execution therefore continue to work from the local golfer state when offline.

## What now exists

The core V3 loop now works end-to-end:

**DO**
- TIP7 — Body
- TIP9 — Game

↓

**REMEMBER**
- Journal — visible history
- TIP Memory — invisible interpretation

↓

**SUGGEST**
- one Home recommendation

↓

**DO AGAIN**
- START launches the recommended TIP7 or TIP9

The remaining major V3.0 milestone is **V3.0-G — Build Today's Session**, where TIP will combine the same body/game activities into a longer session based on available time, practice context and current Memory.
