# The Irish Par V3

**TIPOS V3.0** is the clean rebuild of The Irish Par around one simple coaching loop:

**DO → REMEMBER → SUGGEST → DO**

The golfer sees only three primary places:

- **Home** — TIP7, TIP9, or TIP's suggestion.
- **TIP** — tell TIP what happened or have TIP build today's session.
- **Golfer** — the Journal; the single visible history of the golfer.

## V3 product model

- **TIP7** — seven minutes for the golf body: Stretch + Strength.
- **TIP9** — nine balls/reps for the golf game: Swing + Skill.
- **TIP** — the coach that learns from Journal evidence and recommends or composes useful work.
- **Journal** — the single source of truth for rounds, practice, TIP7, TIP9, lessons, equipment, notes and completed built sessions.

## Build phases

- **V3.0-A — Foundation:** shell, navigation, shared state, storage, PWA. ✓
- **V3.0-B — Journal:** canonical entries, capture, CRUD, backup/restore and V2 history import. ✓
- **V3.0-C — TIP7:** native TIP7 engine with shared progress and Journal completion. ✓
- **V3.0-D — TIP9:** native TIP9 engine with shared progress and Journal completion. ✓
- **V3.0-E — TIP Memory:** Journal → signals → topics → memory. ✓
- **V3.0-F — TIP Suggests:** memory → one recommended action. ✓
- **V3.0-G — Build Today's Session:** time + place + memory → composed TIP7/TIP9 session. ✓

## Current milestone — V3.0-G Build Today's Session

The second action on the TIP screen is now functional.

The golfer chooses only:

1. **How much time?** — 7, 15, 30, 45 or 60+ minutes.
2. **Where are you?** — Range, Hitting Bay, Putting Green, Short Game, Home / No Ball or Anywhere.

TIP then composes a session from the existing native execution engines rather than inventing a third drill system.

### Composition model

`js/coach/compose-session.js` combines:

- the current TIP Suggests recommendation
- TIP Memory priority
- today's TIP7 eligibility and Foundation sequence
- TIP9 context eligibility
- TIP9 current progression level
- recent TIP9 usage
- available time

A seven-minute request remains one focused action. Longer sessions can combine today's available TIP7 with one or more TIP9 blocks.

Examples:

**15 minutes**
- TIP7
- TIP9

or, where short-game/putting context makes body work less practical:
- TIP9
- TIP9

**30 minutes**
- TIP7
- priority TIP9
- secondary TIP9

Longer sessions add further non-duplicate context-valid TIP9 blocks while keeping the current coaching priority first.

### Session preview

Before execution, TIP shows:

- selected time and place
- the current coaching focus
- why the session was built this way
- the ordered TIP7/TIP9 blocks

The golfer can start or change time/place.

### Native execution

Built sessions do not duplicate TIP7 or TIP9 logic.

Each block launches the existing native engine at the correct progression state. A known session context is passed directly into TIP9 so a built Range session does not ask the golfer where they are again.

A block must actually complete before the runner advances. If the golfer stops early, completed component activities remain in the Journal, but V3 does not fabricate a completed parent session.

### Journal model

TIP7 and TIP9 continue to write their own canonical Journal entries.

When every planned block is completed, V3 writes one additional read-only parent `session` entry containing:

- planned time
- practice context
- completed/planned block count
- ordered block descriptors
- IDs of the underlying TIP7/TIP9 Journal entries
- combined topics/dimensions
- session start/completion timestamps

The parent record links the session together without duplicating the component scores, progression or check-ins.

### Offline

The session composer and builder UI are included in the V3 PWA cache alongside the existing Journal, Memory, Suggests, TIP7 and TIP9 modules.

## V3.0 core loop

The complete V3 coaching loop now exists:

**DO**
- TIP7
- TIP9
- or a TIP-built multi-block session

↓

**REMEMBER**
- one Journal

↓

**UNDERSTAND**
- TIP Memory

↓

**SUGGEST / COMPOSE**
- one next action on Home
- or one coherent session based on time and place

↓

**DO AGAIN**

The primary V3.0 product architecture is now functionally represented in the codebase without reintroducing the V2 dashboard, plans, missions, coaching notes or player-card layers.
