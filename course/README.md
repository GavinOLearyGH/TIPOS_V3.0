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
