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
- **V3.0-C — TIP7:** native TIP7 engine with Journal completion.
- **V3.0-D — TIP9:** native TIP9 engine with Journal completion.
- **V3.0-E — TIP Memory:** Journal → signals → topics → memory.
- **V3.0-F — TIP Suggests:** memory → one recommended action.
- **V3.0-G — Build Today's Session:** compose TIP7/TIP9/custom activities from time, context and memory.

## Current milestone — V3.0-B Journal

The Journal is now functional rather than a placeholder.

### Manual entries

The golfer can add:

- Round
- Practice
- Lesson
- Equipment
- Note

Rounds can capture score, fairways, GIR, putts, up-and-downs and penalties. Practice can capture time, balls/reps and focus topics. All entry types support a short reflection so the golfer can simply tell TIP what is worth remembering.

Entries can be edited or deleted from the Journal timeline.

### Shared state

All Journal entries live in `TIP_V3_STATE`. TIP7 and TIP9 will write to the same schema in later milestones rather than maintaining separate histories.

### Backup and restore

Settings now supports:

- Export Golfer — downloads the complete V3 state as JSON.
- Restore Golfer — validates and replaces the local V3 golfer from a prior export.
- Reset Golfer.

### TIP OS V2 import

Because the GitHub Pages applications share an origin, V3 can detect legacy V2 local-storage keys on the same browser/device. The V3.0-B importer conservatively brings across:

- historical rounds → Round Journal entries
- historical sessions → Practice Journal entries
- meaningful notebook entries → Note/Equipment Journal entries
- season goal and handicap where available

It intentionally does **not** migrate V2 plans, XP, identities, journeys, missions, badges or UI state. Re-running the importer preserves existing V3 entries and avoids importing the same historical record twice.

Legacy V2 memory is detected but not converted yet; V3.0-E will own the new memory model.
