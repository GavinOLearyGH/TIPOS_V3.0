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
- **V3.0-F — TIP Suggests:** memory → one recommended action.
- **V3.0-G — Build Today's Session:** compose TIP7/TIP9/custom activities from time, context and memory.

## Current milestone — V3.0-E TIP Memory

TIP Memory is an internal coaching layer. It does not create another golfer-facing dashboard. The Journal remains the single source of truth; Memory is derived state that can be rebuilt from Journal history at any time.

### Canonical topic vocabulary

V3.0-E starts deliberately smaller than the V2 coaching ontology.

**Game / Skill**
- Tee Control
- Approach Play
- Wedge Distance
- Putting Start Line
- Putting Pace
- Short Game
- Course Management

**Game / Swing**
- Contact
- Tempo
- Start Direction
- Low Point
- Face Awareness
- Balance
- Transition

**Body / Stretch**
- Mobility
- Rotation
- Hips
- Thoracic Rotation
- Shoulders

**Body / Strength**
- Stability
- Core
- Lower Body
- Golf Posture

**Mind / other**
- Routine
- Confidence
- Equipment

### Signal extraction

The Memory layer reads evidence from the existing Journal rather than asking the golfer to maintain another coaching model.

Signals currently come from:

- explicit Journal topics
- simple positive/negative reflection language
- mixed reflections evaluated clause-by-clause
- round metrics such as Fairways, GIR, Putts and Penalties
- TIP7 completion/check-in outcomes
- TIP9 Skill scores
- TIP9 Swing `Felt Good / Keep Working` outcomes

For example, a note such as:

> Driver was good, but the irons were heavy and most approaches were short.

can produce positive Tee Control evidence and negative Approach/Contact evidence from the same entry.

### Rebuildable memory

Memory is recalculated from Journal history whenever shared state changes. Editing or deleting a manual Journal entry therefore changes TIP's understanding rather than leaving stale coaching evidence behind.

The derived state lives at:

`TIP_V3_STATE.memory`

Each known topic stores:

- positive evidence
- negative evidence
- net score
- confidence
- trend
- current state
- last observed date
- recent evidence history

The memory summary stores the current strongest need, strongest positive area, total weighted evidence and recent signals.

### Recency and protected reads

Recent evidence matters more than old evidence. Signals decay gradually as they age so last week's golf carries more coaching weight than last year's golf.

An established positive pattern is also protected from being erased by one isolated bad observation. Negative evidence still counts, but its immediate impact is reduced when TIP has substantial prior evidence that the area is a real strength.

### Confidence language

The golfer does not see confidence percentages or topic scores. Home only exposes a lightweight coaching-state sentence:

- `I'm learning your golf.`
- `I'm starting to see the first signals.`
- `I'm starting to see patterns.`
- `I've seen enough to coach with more confidence.`

V3.0-F will use the underlying priority and strength data to replace the current Memory card with one actual recommended action.

### Offline

The TIP Memory topic registry, signal extractor and memory engine are included in the V3 PWA app-shell cache. The derived coaching model can therefore update from local Journal activity without connectivity.

## What now exists

The first three parts of the coaching loop are now structurally present:

**DO**
- TIP7 — Body
- TIP9 — Game

↓

**REMEMBER**
- Journal — visible history
- TIP Memory — invisible interpretation

↓

**SUGGEST**
- next milestone: V3.0-F

The important product constraint remains: complexity belongs behind the interface. The golfer still sees only Home, TIP and Golfer.
