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
- **V3.0-D — TIP9:** native TIP9 engine with Journal completion.
- **V3.0-E — TIP Memory:** Journal → signals → topics → memory.
- **V3.0-F — TIP Suggests:** memory → one recommended action.
- **V3.0-G — Build Today's Session:** compose TIP7/TIP9/custom activities from time, context and memory.

## Current milestone — V3.0-C TIP7

TIP7 is now a native execution engine inside The Irish Par rather than a linked or embedded standalone application.

### Foundation Level

Level 1 preserves the seven-day Foundation structure:

1. Stretch — OPEN
2. Strength — STABLE
3. Stretch — ROTATE
4. Strength — BASE
5. Stretch — RESTORE
6. Strength — CONTROL
7. Stretch + Strength — COMPLETE

Each circuit contains 12 movements using 30-second work intervals and 10-second prepare/changeover intervals. The guided execution screen includes exercise instructions, cues, progress, pause, previous/next controls, sound cues and supported device vibration.

### Shared progression

TIP7 progress now lives inside `TIP_V3_STATE.tip7` rather than a standalone `tip7_v02` local-storage object. V3 tracks:

- completed Foundation days
- completion dates
- current streak
- best streak
- lifetime TIP7 completions
- post-circuit feel check-ins
- last completion time

The next Foundation day unlocks on the next calendar day. Completed work is retained even if the streak later breaks.

### Journal integration

Finishing a circuit immediately creates one canonical Journal entry with:

- source `tip7`
- Foundation level/day
- Stretch/Strength dimension
- relevant body topics
- completion result
- guided circuit duration

The optional post-circuit check-in then updates that same Journal entry rather than creating a second reflection record.

### V3 execution mode

When TIP7 starts, the normal Home/TIP/Golfer navigation is temporarily hidden so the workout owns the screen. Exiting or completing TIP7 returns the golfer to the normal V3 shell. State changes during an active circuit do not cause the shell to rerender over the workout.

### Offline

The V3 service worker now includes the TIP7 programming, engine, view and execution stylesheet in the app-shell cache, so an already installed/cached V3 golfer can run TIP7 offline.

## Journal / portability from V3.0-B

Manual Round, Practice, Lesson, Equipment and Note entries remain available. Export/Restore operate on the entire shared V3 state, including TIP7 progress. The conservative TIP OS V2 history importer also remains available from Settings.
