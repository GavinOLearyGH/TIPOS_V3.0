# Full course prototype

Open `course/` through a web server for the independent course entry page. Choose a tee and play `course/play.html?hole=1`. The overhead review remains at `course/hole-1/`.

The course player supports first-person slingshot shots, ball-following camera, live overhead map, flyover with downhill green markers, wind and green speed, penalties, and a hole completion dialog. It uses a fixed 240 Hz physics step for each shot.

## Shared mechanics

- `core/physics.mjs` owns club calibration, ball flight, surface impact, bounce, rollout, putting, flagstick and cup contact. Both Hole 6's browser build and its server replay receive this engine through `node leaderboard/build.mjs`.
- `core/round.mjs` owns the 14-club course bag, successive shots, strokes, penalties and completion. Daily Challenge eligibility remains a game mode.
- `core/renderer.mjs` owns course terrain meshes, surface textures, scenery and camera projection.
- `core/visuals.mjs` is the canonical Hole 6 ball, flag, cup, putting grid and flyover green read. Both players use it; putting has the fine grid and moving dashes, while flyovers show larger downhill chevrons.
- `core/controls.mjs` owns the shared slingshot aim/power curve, camera offsets and projected pull-guide geometry.
- `course/play.mjs` owns the shared course UI, slingshot interaction, camera follow, flyover, HUD, map and completion dialog.
- `course/catalog.mjs` registers available holes.
- `core/geometry.mjs` owns path sampling and surface containment.
- `core/course.mjs` turns a hole definition into terrain, lie and OB queries.
- `course/holes/hole-1.mjs` contains Hole 1's confirmed tees and yardages, traced surface boundaries, and provisional elevations.

The 3D player and overhead preview use the same course queries and round session. Course geometry supplies metre coordinates, `ground(x,z)`, `surface(x,z)`, bounds, tees, pins and optional collision features. Wind and green speed are round settings. The engine contains no hole number or Springhaven layout coordinates. Full-course clubs use provisional carry and flight targets for testing.

Run `node leaderboard/build.mjs` to refresh the self-contained Hole 6 HTML, server physics, and generated course/core assets. Run `node tests/course.mjs` from the repository root to check the Hole 6 client/server replay comparison and shared full-hole behavior. Run `node tests/ground-contact.mjs` for full-bag surface, slope, church-pew relief and shared-source regressions.

Hole 1 scale is calibrated to 419 yards between the black marker and green center. The other three marker distances are 401, 353 and 349 yards. Actual tee marker locations, bunker distances and contours require field confirmation. Overhead shot aiming remains a layout-testing control. The 3D slingshot player calls the same round and physics engine. Tree and cart-path interactions are shared mechanics with per-hole scenery data. Native mobile WebGL rendering still needs device testing.

Grass impacts resolve velocity against the local terrain normal and tangent. Fairway and rough dissipate energy with distinct bounce, retention and rolling resistance; playing from rough reduces carry and spin without an extra rollout multiplier. Green and cup behavior is retained. The church pews use seven distinct 1.15 m provisional ridges with finer terrain sampling; their height is an art/physics calibration, not a surveyed measurement.

The source branch rebuilds Hole 6 from these shared modules so it can join the full course without separate physics or green-read code. Publishing `course/` and `core/` to GitHub does not replace the standalone Daily Challenge deployment. A future Daily Challenge update must deploy the rebuilt client and matching server replay together.

## Release packaging and shot measurement

`node leaderboard/build.mjs` now packages a content-derived `0.3.0-…` course release. Publish the generated `public/course/` files and `public/core/` files to the course preview. The three generated HTML entry pages reference a complete snapshot under `course/releases/<build>/`. All relative imports stay within that release, including the single physics instance. Keep previously published release directories: cached HTML and open games still need them. `course/release.json` is checked without browser caching on page load/focus; an older running build offers Load update, disabled during a shot. The loaded build number appears on the landing and game pages. Landing-page Play links include that build number to refresh the game HTML.

The generic round records horizontal carry before first ground contact, all subsequent horizontal travel as bounce + roll (including later hops and rollback), and their sum as total travel. It also retains straight-line net displacement for diagnostics. Putt carry is zero. Penalty records keep the original flight measurements before relief resets the ball. The course game displays the most recent shot, club, power and starting lie, with feet used for short shots.

Long-iron fairway release is calibrated separately from airborne carry and green impact. Calm Hole 1 reference shots produce approximately: driver 230.5 yd carry + 9.7 yd release; a representative rough 4-iron from 223 yd, 137.4 + 16.4 yd; rough 7-iron from 178 yd, 114.1 + 13.2 yd. These are reproducible prototype checks, not surveyed course or real-world launch-monitor measurements.

Run `node tests/hole-1-metrics.mjs` for the reported cases, 101 nearby rough positions, putt measurements and penalty retention. Run `node tests/course-release.mjs` to verify packaged entry points, release-relative imports and physics identity.

### Parent-site offline cache boundary

The TIPOS coaching PWA's root `sw.js` previously cached every GET request first, including old course HTML and the original renderer. Immutable release files alone cannot correct a legacy HTML entry already captured by that worker. On the GitHub preview, apply `protectCourseRoutes` from `scripts/patch-preview-worker.mjs` to the current root worker: it leaves `/course/` and `/core/` requests to the browser and preserves the coaching shell's cache behavior. Patch the current worker in place; do not replace its coaching asset list with a game-owned copy. Course entry modules request an update of an existing controlling worker without registering another worker or interrupting a hole.

`node tests/course-cache.mjs` verifies the route boundary (optionally pass the current worker file as its argument). `node tests/green-visuals.mjs` checks the shared putting grid and small moving dashes, flyover-only chevrons, and return to putting. Set up your round uses the same round controller and renderer; future hole definitions supply geometry and contours, not a separate green renderer or physics engine.

## Hole 2

Hole 2 is registered alongside Hole 1 and uses the same course queries, fixed-step physics, round controller, ball/cup graphics, green grid, camera and slingshot controls. The course landing lists both holes. Set up your round can select either hole and shows its tee yardages. Completing Hole 1 offers Play Hole 2 while retaining tee identity, wind and green speed.

`course/holes/hole-2.mjs` traces the supplied overhead. Published tee yardages are 550/540/467/458 (1896/Rawlins/Butler/Dixon), par 5. The barranca is playable with no automatic penalty; its confirmed maximum depth is 1.524 m (5 ft). A generic landform depression supplies smooth banks and a flat/deeper bed. Smooth, heavy and tight lie patches are spatially fixed and displayed in the HUD. Each patch configures launch, speed/spin retention and underlying ground material; choosing a different club never rerolls the lie. Their distribution and exact bank profiles remain provisional. The green has a provisional two-tier height profile pending detailed readings.

Landforms and lie profiles are generic optional course data. Hole 1 does not acquire a barranca or altered ground behavior. Hole 2 supplies fairway aim waypoints, scenery, paths, bunker shapes and tee coordinates. Course geometry and lie profiles feed the shared engine; there is no Hole 2 shot simulation or green renderer. Run `node tests/hole-2.mjs` for yardage, depth, stable lies, recoveries, ditch landings, three-shot play and tier checks.

## Hole 3

The par-three Hole 3 is traced from the supplied markup, with 193/151/137/117-yard tees, a separate rear pad and long main tee pad, rough corridor, short-mown approach, narrow surround and three greenside bunkers. Green contours, elevations and bunker depths remain provisional. Hole 3 uses the same engine, controls, renderer, green grid and round controller, and appears after Hole 2 in the existing completion navigation. Run `node tests/hole-3.mjs` for tee distances, surface boundaries, bunker recovery, cup capture and terrain checks.

## Play 3 and strike timing

The course landing offers Play 3 (par 12) with a tee choice. A tab-local series records completed holes and penalties across navigation; resetting a hole invalidates that hole and later results. The final card offers the same setup or a new wind setup. Personal bests are stored on the browser per tee/wind/speed combination. Browser storage is required for the three-hole series; individual holes remain available.

The course player shows a deterministic 1.4-second strike sweep while pulling/charging. Release inside the green zone executes the aimed shot cleanly. Outside the window, signed error changes heading and reduces effective power. High power, long clubs and heavy lies narrow the window. The shared round controller applies the execution result before the existing flight simulation and records contact feedback. Putts bypass execution timing. Existing callers default to centered contact, including physics regressions. This update is course-preview only; the live Daily Challenge is separate.

Course wind uses a single round direction, transformed by each hole's relative bearing. Relative bearings (Hole 1 = 0°, Hole 2 ≈ 177°, Hole 3 ≈ 157°) follow the supplied course-wide satellite photo; they remain approximate and are not true-north measurements. Similar hole directions may feel similar; opposite directions reverse the wind. Legacy static test callers retain fixed strength; the course player uses the dynamic profile below.

The clean zone shrinks smoothly above 90% power to 35% narrower at full power. Timing errors apply signed launch deviation, club-dependent horizontal curvature, speed loss, reduced backspin and slightly reduced lift. Curve uses a velocity rotation and adds no horizontal kinetic energy. Clean strikes and putts preserve prior behavior; grass/sand impact logic is unchanged. `tests/wind-contact.mjs` checks the transforms and contact changes.

Shot setup now uses a forward lookahead rather than selecting nearby waypoints that can point sideways after a drive. Swipe the canvas away from the ball to turn the camera and aiming direction; gestures beginning on the ball remain swing gestures. Turn release does not fire a shot, pointer cancellation restores the prior turn heading, and Face pin restores the direct bearing. Club selection preserves aim. The edge-only vertical power gauge fills bottom-to-top, with percentage above and putt roll estimate below; pin distance stays in the top HUD. `tests/view-controls.mjs` covers lookahead and control math. Native portrait/landscape hand clearance still requires device review.


## Dynamic wind (course preview)

`core/wind.mjs` owns versioned `clock-v1` weather. New setups store `windAngle` in clockwise degrees relative to Hole 1, `mph`, and `windSeed`. Twelve setup clock positions are 30° apart; actual direction is continuous. Legacy `wind=0..7` URLs and saved series convert with `index × 45°`, retaining intermediate angles as a previous-setup option. These numbers are never reinterpreted as clock indices. The legacy static API and standalone Daily Challenge remain unchanged.

The deterministic profile combines slow sine waves: direction stays within ±15° of the prevailing direction, strength within ±20% of the base (capped at 25 mph), and zero remains calm. A round's integer `state.windTick` advances at the existing 240 Hz step, including while aiming/charging and throughout flight. `settings.wind` is the exact current sample used by both flight physics and the continuous HUD arrow, localized to the hole bearing and then the golfer's aim for display. No wind-driven auto aim or change to strike timing is added. Putts remain unaffected by wind.

The UI pauses the weather/physics clock on window blur, hidden tabs, flyovers and result dialogs, with no elapsed-time catch-up. Completed Play 3 holes persist the clock and seed for continuation on the next hole. Reset restores that hole's entry clock; replaying a setup starts the same pattern again; new setups get a new seed. Personal best keys include the pattern/version. Shot metrics retain pattern, seed, release tick and release vector for reproducibility. The Daily Challenge's client and replay server require a separate coordinated migration before enabling dynamic wind there.

Run `node tests/dynamic-wind.mjs` for twelve directions, legacy conversion, bounded/smooth variation, deterministic seeded replay, orientation, idle/flight integration, display identity, different release phases, putt immunity and retained static behavior.


## Integrated Daily Challenge

`daily/` supplies the combined front page. The build places it at the generated root and retains the existing Hole 6 player as `ace.html`. `core/competition.mjs` provides deterministic daily three-hole setups, settled-shot replay/recovery, penalties, automatic Hole 3 tee-shot tiebreak capture and shared ranking. `core/daily-client.mjs` adapts that competition to browser-local preview storage or the Namecheap API. Both modes use the existing course player/engine; official controls prevent resets or changing setup.

The build snapshots course HTML as well as modules, allowing an unfinished official round to resume with its exact starting engine. The backend validates every shot using that pinned snapshot and performs compare-and-swap revision updates. `leaderboard/three.mjs` handles official start/shot/publication, while the existing Hole 6 API is retained. `leaderboard/NAMECHEAP.md` describes the additive table and server upgrade. `tests/daily-three.mjs`, `tests/daily-hub.mjs`, `tests/course-wind-ui.mjs` and `tests/namecheap-assets.mjs` exercise full-round replay, retry/recovery, result/ranking presentation and HTTP asset routing. Native phone rendering still requires device review.


## One player for Hole 6 and the three-hole challenge

`course/holes/hole-6.mjs` preserves the original metre-scale terrain functions, nine pin positions, tapered wall, pond seam and arched bridge meshes. `core/renderer.mjs` draws its static mesh batches through the same shader, camera, ball/cup and green-read pipeline used by every other hole. `course/play.html` is the only current player: shared overlay, full bag, power curve, strike timing, dynamic wind, aiming and results. The one-shot ACE adapter in `core/competition.mjs` calls the same `core/round.mjs` execution/physics path and finishes after the first settled shot. `ace.html` redirects into this player; the old source HTML remains solely to support legacy replay/backward compatibility and regression comparisons. Publishing rebuilds the current player and both backend replay paths; keep pinned old releases for existing three-hole attempts.
