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

## V3.0 release candidate

The A–G build sequence is complete and the codebase has entered a hardening pass before release consolidation.

Completed milestones:

- **Foundation** — shell, navigation, shared state, storage and PWA.
- **Journal** — canonical entries, manual capture, CRUD, backup/restore and conservative V2 history import.
- **TIP7** — native body execution with shared progression and automatic Journal completion.
- **TIP9** — native game execution with shared progression and automatic Journal completion.
- **TIP Memory** — Journal → signals → normalized topics → confidence/trends/priorities.
- **TIP Suggests** — Memory → one next action on Home.
- **Build Today's Session** — time + place + Memory → composed TIP7/TIP9 session.

## Core architecture

### One golfer

All persistent V3 data lives behind `TIP_V3_STATE`. TIP7 and TIP9 do not own separate local-storage databases.

### One visible history

The Journal is the source of truth for completed golf activity. TIP Memory is derived from Journal evidence and can be rebuilt.

### Native execution blocks

A built session is an ordered sequence of the existing TIP7 and TIP9 engines. It does not create a third drill engine or duplicate component progression.

### One recommendation

Home shows one TIP suggestion rather than a dashboard of weaknesses, plans or coaching scores.

## Release hardening completed

The release-candidate pass includes:

- stricter V3 snapshot validation before restore
- defensive state normalization
- explicit storage-write failure handling
- Memory rebuilds limited to Journal/restore/import/reset changes
- composed-session navigation and abort cleanup
- transient session-plan cleanup
- canonical TIP9 topic mappings so practice evidence is not silently dropped by Memory
- TIP9 completion validation requiring all three scored blocks
- corrected V2 import deduplication counts
- release-candidate PWA cache versioning
- removal of milestone-only version labeling from the golfer-facing shell

## Current coaching loop

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

## Release scope

V3.0 intentionally does **not** restore the V2 dashboard, Today's Mission, TIP Plans, Coaching Notes, Coach's Corner, player-card/XP/identity layers or a separate Smart Journal UI.

The release remains intentionally small:

**HOME | TIP | GOLFER**

Complexity stays behind the interface.
