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

The original four dimensions remain inside the system, but the golfer-facing model is simplified:

- **BODY** → Stretch + Strength
- **GAME** → Swing + Skill

## Architecture principles

1. Home is for doing.
2. TIP is for talking and coaching.
3. Golfer is the Journal.
4. Every meaningful activity becomes a Journal entry.
5. TIP recommends one thing, not ten.
6. Complexity belongs behind the interface.
7. TIP7 and TIP9 remain focused execution engines inside one shared application state.
8. The app talks to storage through a provider boundary so local storage can later be replaced or supplemented by TIP Cloud.
9. V3 does not inherit V2 UI debt, plans, XP, identities, missions or coaching dashboards.

## Build phases

- **V3.0-A — Foundation:** shell, navigation, shared state, storage, PWA.
- **V3.0-B — Journal:** canonical entries, round/practice/note capture, backup/restore.
- **V3.0-C — TIP7:** native TIP7 engine with Journal completion.
- **V3.0-D — TIP9:** native TIP9 engine with Journal completion.
- **V3.0-E — TIP Memory:** Journal → signals → topics → memory.
- **V3.0-F — TIP Suggests:** memory → one recommended action.
- **V3.0-G — Build Today's Session:** compose TIP7/TIP9/custom activities from time, context and memory.

## Current milestone

`V3.0-A: Foundation`

The first implementation establishes the clean shell and shared state model before any source engine is migrated.
