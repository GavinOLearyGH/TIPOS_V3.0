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
