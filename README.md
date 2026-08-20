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

## Architecture principles

1. Home is for doing.
2. TIP is for talking and coaching.
3. Golfer is the Journal.
4. Every meaningful activity becomes a Journal entry.
5. TIP recommends one thing, not ten.
6. Complexity belongs behind the interface.
7. TIP7 and TIP9 remain focused execution engines inside one shared application state.
8. Storage sits behind a provider boundary so Local Golfer can later become or sync with TIP Cloud.
9. V3 does not inherit V2 UI debt, plans, XP, identities, missions or coaching dashboards.

## Build phases

- **V3.0-A — Foundation:** shell, navigation, shared state, storage, PWA. ✓
- **V3.0-B — Journal:** canonical entries, capture, CRUD, backup/restore and V2 history import. ✓
- **V3.0-C — TIP7:** native TIP7 engine with shared progress and Journal completion. ✓
- **V3.0-D — TIP9:** native TIP9 engine with shared progress and Journal completion. ✓
- **V3.0-E — TIP Memory:** Journal → signals → topics → memory.
- **V3.0-F — TIP Suggests:** memory → one recommended action.
- **V3.0-G — Build Today's Session:** compose TIP7/TIP9/custom activities from time, context and memory.

## Current milestone — V3.0-D TIP9

TIP9 is now the native GAME-side execution engine inside The Irish Par.

### Practice model

The V3 library preserves the 26 programmed practice families from the standalone TIP9 prototype:

- 8 Swing practices
- 18 Skill practices
- five contexts: Range, Hitting Bay, Putting Green, Short Game and No Ball
- three progression levels per practice
- No Ball variants for rehearsal-compatible Swing work

The practice curriculum remains data-driven in `js/tip9/tip9-data.js` rather than being embedded in the screen logic.

### 3 × 3 execution

A TIP9 is still nine balls or nine No Ball reps in three blocks of three.

For Swing work, each 0–3 block result produces an adaptive response:

- 0/3 — Reset and simplify
- 1/3 — Reinforce
- 2/3 — Progress
- 3/3 — Progress toward normal golf shots

Swing completion remains `Felt Good / Keep Working` rather than foregrounding a 0–9 score.

Skill work remains scored execution. A score of 7/9 or better unlocks the next level until Level 3.

### Context-first front door

TIP9 begins by asking where the golfer is practicing. Only practices valid for that context are eligible.

Until V3.0-F adds Journal-driven coaching priority, the V3.0-D recommendation is deterministic and progression-aware: it favors eligible practices that have been used less recently and less frequently rather than choosing randomly. `Another practice` and Browse remain available.

### Shared progression

TIP9 no longer owns a `tip9StateV2` local-storage object. Progress lives inside `TIP_V3_STATE.tip9`:

- per-practice level
- best result
- latest result
- latest Swing feel
- completion count
- recent practice/context history
- lifetime TIP9 completions

### Journal integration

Every completed TIP9 immediately creates one canonical Journal entry with:

- source `tip9`
- practice ID and name
- Swing or Skill dimension
- context
- level
- 3 × 3 results
- relevant coaching topics
- Skill score or Swing completion
- any unlocked next level

For Swing practices, the optional `Felt Good / Keep Working` response updates the same Journal record rather than creating a second reflection.

TIP7 and TIP9 Journal records are automatic system activity and are not exposed with ordinary manual Edit/Delete controls.

### V3 execution mode

TIP7 and TIP9 now use the same execution lifecycle. While either engine is active, the normal Home/TIP/Golfer shell is hidden; exiting returns to Home. Execution handlers are scoped and cleaned up on exit so repeated launches do not accumulate duplicate event listeners.

### Offline

The V3 PWA cache now includes both execution engines and their programming, allowing the already installed/cached body and game tools to run without connectivity.

## What now exists

The first half of the V3 coaching loop is real:

**DO**

- TIP7 — Body
- TIP9 — Game

↓

**REMEMBER**

- one shared Journal

The next milestone, **V3.0-E TIP Memory**, begins the intelligence layer: Journal evidence will be translated into normalized topics, positive/negative signals, confidence and trends without adding another golfer-facing dashboard.
