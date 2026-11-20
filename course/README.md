# Full course prototype

Open `course/` through a web server for the independent course entry page. Choose a tee and play `course/play.html?hole=1`. The overhead review remains at `course/hole-1/`.

The course player supports first-person slingshot shots, ball-following camera, live overhead map, flyover with downhill green markers, wind and green speed, penalties, and a hole completion dialog. It uses a fixed 240 Hz physics step for each shot.

## Shared mechanics

- `core/physics.mjs` owns club calibration, ball flight, surface impact, bounce, rollout, putting, flagstick and cup contact. Both Hole 6's browser build and its server replay receive this engine through `node leaderboard/build.mjs`.
- `core/round.mjs` owns the 14-club course bag, successive shots, strokes, penalties and completion. Daily Challenge eligibility remains a game mode.
- `core/renderer.mjs` owns terrain meshes, surface textures, scenery, camera projection and green direction markers.
- `course/play.mjs` owns the shared course UI, slingshot interaction, camera follow, flyover, HUD, map and completion dialog.
- `course/catalog.mjs` registers available holes.
- `core/geometry.mjs` owns path sampling and surface containment.
- `core/course.mjs` turns a hole definition into terrain, lie and OB queries.
- `course/holes/hole-1.mjs` contains Hole 1's confirmed tees and yardages, traced surface boundaries, and provisional elevations.

The 3D player and overhead preview use the same course queries and round session. Course geometry supplies metre coordinates, `ground(x,z)`, `surface(x,z)`, bounds, tees, pins and optional collision features. Wind and green speed are round settings. The engine contains no hole number or Springhaven layout coordinates. Full-course clubs use provisional carry and flight targets for testing.

Run `node leaderboard/build.mjs` to refresh the self-contained Hole 6 HTML, server physics, and generated course/core assets. Run `node tests/course.mjs` from the repository root to check the frozen Hole 6 replay comparison and shared full-hole behavior.

Hole 1 scale is calibrated to 419 yards between the black marker and green center. The other three marker distances are 401, 353 and 349 yards. Actual tee marker locations, bunker distances and contours require field confirmation. Overhead shot aiming remains a layout-testing control. The 3D slingshot player calls the same round and physics engine. Tree and cart-path interactions are shared mechanics with per-hole scenery data. Native mobile WebGL rendering still needs device testing.
